package main

import (
	"regexp"
	"sort"
	"strings"
	"time"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const sessionCookieName = "bp_session"

var roleSlugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type createUserRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
	Role        string `json:"role"`
}

type updateUserRequest struct {
	Email       *string `json:"email,omitempty"`
	Password    *string `json:"password,omitempty"`
	DisplayName *string `json:"display_name,omitempty"`
	Role        *string `json:"role,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

type userResponse struct {
	ID          uuid.UUID `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	IsActive    bool      `json:"is_active"`
	Roles       []string  `json:"roles"`
}

type saveRoleRequest struct {
	Slug         string   `json:"slug"`
	Label        string   `json:"label"`
	Capabilities []string `json:"capabilities"`
}

type roleResponse struct {
	Slug         string   `json:"slug"`
	Label        string   `json:"label"`
	Capabilities []string `json:"capabilities"`
}

type capabilityResponse struct {
	Slug        string `json:"slug"`
	Description string `json:"description,omitempty"`
}

func registerRoutes(router fiber.Router, driver *usersAuthDriver, db *gorm.DB, cache *roleCapCache) {
	manageUsers := requireCapability(driver, "users.manage")

	router.Post("/login", handleLogin(driver))
	router.Post("/logout", handleLogout())
	router.Get("/me", handleMe(driver))
	router.Get("/users", manageUsers, handleListUsers(db))
	router.Post("/users", manageUsers, handleCreateUser(db, cache))
	router.Put("/users/:id", manageUsers, handleUpdateUser(db, cache))
	router.Delete("/users/:id", manageUsers, handleDeleteUser(db))
	router.Get("/roles", manageUsers, handleListRoles(db))
	router.Get("/roles/:slug", manageUsers, handleGetRole(db))
	router.Post("/roles", manageUsers, handleCreateRole(db, cache))
	router.Put("/roles/:slug", manageUsers, handleUpdateRole(db, cache))
	router.Get("/capabilities", manageUsers, handleListCapabilities(db))
}

func requireCapability(driver *usersAuthDriver, capability string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, _ := c.Locals(pluginsdk.AuthUserContextKey).(*pluginsdk.AuthUser)
		if user == nil {
			user = driver.GetLoggedInUser(c)
		}
		if user == nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "authentication required",
			})
		}
		if !driver.HasCapability(user, capability) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "insufficient permissions",
			})
		}

		return c.Next()
	}
}

func handleLogin(driver *usersAuthDriver) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req loginRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
		}

		if req.Email == "" || req.Password == "" {
			return fiber.NewError(fiber.StatusBadRequest, "email and password are required")
		}

		token, user, err := driver.Login(req.Email, req.Password)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		c.Cookie(&fiber.Cookie{
			Name:     sessionCookieName,
			Value:    token,
			Path:     "/",
			HTTPOnly: true,
			SameSite: "Lax",
			MaxAge:   int(tokenExpiry / time.Second),
		})

		return c.JSON(fiber.Map{
			"token": token,
			"user":  user,
		})
	}
}

func handleLogout() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Cookie(&fiber.Cookie{
			Name:     sessionCookieName,
			Value:    "",
			Path:     "/",
			HTTPOnly: true,
			SameSite: "Lax",
			MaxAge:   -1,
		})

		return c.JSON(fiber.Map{"ok": true})
	}
}

func handleMe(driver *usersAuthDriver) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := c.Get("Authorization")
		if len(token) > 7 && token[:7] == "Bearer " {
			token = token[7:]
		} else {
			token = c.Cookies(sessionCookieName)
		}

		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "authentication required",
			})
		}

		user, err := driver.Authenticate(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "authentication required",
			})
		}

		return c.JSON(fiber.Map{"user": user})
	}
}

func handleListUsers(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var users []UsersPluginUser
		if err := db.Where("is_active = ? OR is_active = ?", true, false).Find(&users).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		result := make([]userResponse, 0, len(users))
		for _, u := range users {
			var userRoles []UsersPluginUserRole
			db.Where("user_id = ?", u.ID).Find(&userRoles)

			roles := make([]string, 0, len(userRoles))
			for _, ur := range userRoles {
				roles = append(roles, ur.RoleSlug)
			}

			result = append(result, userResponse{
				ID:          u.ID,
				Email:       u.Email,
				DisplayName: u.DisplayName,
				IsActive:    u.IsActive,
				Roles:       roles,
			})
		}

		return c.JSON(fiber.Map{"users": result})
	}
}

func handleCreateUser(db *gorm.DB, cache *roleCapCache) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req createUserRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
		}

		if req.Email == "" || req.Password == "" || req.DisplayName == "" {
			return fiber.NewError(fiber.StatusBadRequest, "email, password, and display_name are required")
		}

		if req.Role == "" {
			req.Role = "subscriber"
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, "failed to hash password")
		}

		user := UsersPluginUser{
			Email:        req.Email,
			PasswordHash: string(hash),
			DisplayName:  req.DisplayName,
			IsActive:     true,
		}

		if err := db.Create(&user).Error; err != nil {
			return fiber.NewError(fiber.StatusConflict, "user with this email already exists")
		}

		if err := db.Create(&UsersPluginUserRole{
			UserID:   user.ID,
			RoleSlug: req.Role,
		}).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"user": userResponse{
				ID:          user.ID,
				Email:       user.Email,
				DisplayName: user.DisplayName,
				IsActive:    user.IsActive,
				Roles:       []string{req.Role},
			},
		})
	}
}

func handleUpdateUser(db *gorm.DB, cache *roleCapCache) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid user id")
		}

		var user UsersPluginUser
		if err := db.First(&user, "id = ?", id).Error; err != nil {
			return fiber.NewError(fiber.StatusNotFound, "user not found")
		}

		var req updateUserRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid request body")
		}

		if req.Email != nil {
			user.Email = *req.Email
		}
		if req.DisplayName != nil {
			user.DisplayName = *req.DisplayName
		}
		if req.IsActive != nil {
			user.IsActive = *req.IsActive
		}
		if req.Password != nil && *req.Password != "" {
			hash, err := bcrypt.GenerateFromPassword([]byte(*req.Password), bcrypt.DefaultCost)
			if err != nil {
				return fiber.NewError(fiber.StatusInternalServerError, "failed to hash password")
			}
			user.PasswordHash = string(hash)
		}

		if err := db.Save(&user).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		if req.Role != nil {
			db.Where("user_id = ?", user.ID).Delete(&UsersPluginUserRole{})
			db.Create(&UsersPluginUserRole{
				UserID:   user.ID,
				RoleSlug: *req.Role,
			})
		}

		var userRoles []UsersPluginUserRole
		db.Where("user_id = ?", user.ID).Find(&userRoles)
		roles := make([]string, 0, len(userRoles))
		for _, ur := range userRoles {
			roles = append(roles, ur.RoleSlug)
		}

		return c.JSON(fiber.Map{
			"user": userResponse{
				ID:          user.ID,
				Email:       user.Email,
				DisplayName: user.DisplayName,
				IsActive:    user.IsActive,
				Roles:       roles,
			},
		})
	}
}

func handleDeleteUser(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid user id")
		}

		if err := db.Where("user_id = ?", id).Delete(&UsersPluginUserRole{}).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		if err := db.Delete(&UsersPluginUser{}, "id = ?", id).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.JSON(fiber.Map{"ok": true})
	}
}

func handleListRoles(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		roles, err := loadRoleResponses(db)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.JSON(fiber.Map{"roles": roles})
	}
}

func handleGetRole(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, err := loadRoleResponse(db, c.Params("slug"))
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				return fiber.NewError(fiber.StatusNotFound, "role not found")
			}
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.JSON(fiber.Map{"role": role})
	}
}

func handleCreateRole(db *gorm.DB, cache *roleCapCache) fiber.Handler {
	return func(c *fiber.Ctx) error {
		req, err := parseSaveRoleRequest(c)
		if err != nil {
			return err
		}

		if err := db.Transaction(func(tx *gorm.DB) error {
			if err := validateRoleCapabilities(tx, req.Capabilities); err != nil {
				return err
			}

			role := UsersPluginRole{
				Slug:  req.Slug,
				Label: req.Label,
			}
			if err := tx.Create(&role).Error; err != nil {
				return fiber.NewError(fiber.StatusConflict, "role with this slug already exists")
			}

			return replaceRoleCapabilities(tx, role.Slug, req.Capabilities)
		}); err != nil {
			return err
		}

		if err := cache.Load(); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		role, err := loadRoleResponse(db, req.Slug)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{"role": role})
	}
}

func handleUpdateRole(db *gorm.DB, cache *roleCapCache) fiber.Handler {
	return func(c *fiber.Ctx) error {
		originalSlug := c.Params("slug")
		req, err := parseSaveRoleRequest(c)
		if err != nil {
			return err
		}

		if err := db.Transaction(func(tx *gorm.DB) error {
			var role UsersPluginRole
			if err := tx.First(&role, "slug = ?", originalSlug).Error; err != nil {
				if err == gorm.ErrRecordNotFound {
					return fiber.NewError(fiber.StatusNotFound, "role not found")
				}
				return err
			}

			if err := validateRoleCapabilities(tx, req.Capabilities); err != nil {
				return err
			}

			if req.Slug != originalSlug {
				var count int64
				if err := tx.Model(&UsersPluginRole{}).Where("slug = ?", req.Slug).Count(&count).Error; err != nil {
					return err
				}
				if count > 0 {
					return fiber.NewError(fiber.StatusConflict, "role with this slug already exists")
				}
			}

			if err := tx.Model(&role).Updates(map[string]any{
				"slug":  req.Slug,
				"label": req.Label,
			}).Error; err != nil {
				return err
			}

			if req.Slug != originalSlug {
				if err := tx.Model(&UsersPluginRoleCapability{}).
					Where("role_slug = ?", originalSlug).
					Update("role_slug", req.Slug).Error; err != nil {
					return err
				}
				if err := tx.Model(&UsersPluginUserRole{}).
					Where("role_slug = ?", originalSlug).
					Update("role_slug", req.Slug).Error; err != nil {
					return err
				}
			}

			return replaceRoleCapabilities(tx, req.Slug, req.Capabilities)
		}); err != nil {
			return err
		}

		if err := cache.Load(); err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		role, err := loadRoleResponse(db, req.Slug)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.JSON(fiber.Map{"role": role})
	}
}

func handleListCapabilities(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var caps []UsersPluginCapability
		if err := db.Order("slug ASC").Find(&caps).Error; err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		result := make([]capabilityResponse, 0, len(caps))
		for _, cap := range caps {
			result = append(result, capabilityResponse{
				Slug:        cap.Slug,
				Description: cap.Description,
			})
		}

		return c.JSON(fiber.Map{"capabilities": result})
	}
}

func parseSaveRoleRequest(c *fiber.Ctx) (saveRoleRequest, error) {
	var req saveRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return req, fiber.NewError(fiber.StatusBadRequest, "invalid request body")
	}

	req.Slug = strings.TrimSpace(req.Slug)
	req.Label = strings.TrimSpace(req.Label)
	req.Capabilities = uniqueStrings(req.Capabilities)

	if req.Label == "" {
		return req, fiber.NewError(fiber.StatusBadRequest, "name is required")
	}
	if !roleSlugPattern.MatchString(req.Slug) {
		return req, fiber.NewError(fiber.StatusBadRequest, "slug must be lowercase kebab-case")
	}

	return req, nil
}

func validateRoleCapabilities(db *gorm.DB, slugs []string) error {
	if len(slugs) == 0 {
		return nil
	}

	var count int64
	if err := db.Model(&UsersPluginCapability{}).Where("slug IN ?", slugs).Count(&count).Error; err != nil {
		return err
	}
	if count != int64(len(slugs)) {
		return fiber.NewError(fiber.StatusBadRequest, "one or more capabilities are invalid")
	}

	return nil
}

func replaceRoleCapabilities(db *gorm.DB, roleSlug string, capabilities []string) error {
	if err := db.Unscoped().Where("role_slug = ?", roleSlug).Delete(&UsersPluginRoleCapability{}).Error; err != nil {
		return err
	}

	for _, cap := range capabilities {
		join := UsersPluginRoleCapability{
			RoleSlug:       roleSlug,
			CapabilitySlug: cap,
		}
		if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&join).Error; err != nil {
			return err
		}
	}

	return nil
}

func loadRoleResponses(db *gorm.DB) ([]roleResponse, error) {
	var roles []UsersPluginRole
	if err := db.Order("label ASC, slug ASC").Find(&roles).Error; err != nil {
		return nil, err
	}

	roleCaps, err := loadCapabilitiesByRole(db)
	if err != nil {
		return nil, err
	}

	result := make([]roleResponse, 0, len(roles))
	for _, role := range roles {
		result = append(result, roleResponse{
			Slug:         role.Slug,
			Label:        role.Label,
			Capabilities: roleCaps[role.Slug],
		})
	}

	return result, nil
}

func loadRoleResponse(db *gorm.DB, slug string) (roleResponse, error) {
	var role UsersPluginRole
	if err := db.First(&role, "slug = ?", slug).Error; err != nil {
		return roleResponse{}, err
	}

	roleCaps, err := loadCapabilitiesByRole(db)
	if err != nil {
		return roleResponse{}, err
	}

	return roleResponse{
		Slug:         role.Slug,
		Label:        role.Label,
		Capabilities: roleCaps[role.Slug],
	}, nil
}

func loadCapabilitiesByRole(db *gorm.DB) (map[string][]string, error) {
	var roleCaps []UsersPluginRoleCapability
	if err := db.Order("capability_slug ASC").Find(&roleCaps).Error; err != nil {
		return nil, err
	}

	result := make(map[string][]string)
	for _, rc := range roleCaps {
		result[rc.RoleSlug] = append(result[rc.RoleSlug], rc.CapabilitySlug)
	}
	for roleSlug := range result {
		sort.Strings(result[roleSlug])
	}

	return result, nil
}

func uniqueStrings(values []string) []string {
	result := make([]string, 0, len(values))
	seen := map[string]bool{}
	for _, value := range values {
		normalized := strings.TrimSpace(value)
		if normalized == "" || seen[normalized] {
			continue
		}
		seen[normalized] = true
		result = append(result, normalized)
	}
	sort.Strings(result)
	return result
}
