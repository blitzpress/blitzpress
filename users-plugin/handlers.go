package main

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const sessionCookieName = "bp_session"

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

func registerRoutes(router fiber.Router, driver *usersAuthDriver, db *gorm.DB, cache *roleCapCache) {
	router.Post("/login", handleLogin(driver))
	router.Post("/logout", handleLogout())
	router.Get("/me", handleMe(driver))
	router.Get("/users", handleListUsers(db))
	router.Post("/users", handleCreateUser(db, cache))
	router.Put("/users/:id", handleUpdateUser(db, cache))
	router.Delete("/users/:id", handleDeleteUser(db))
	router.Get("/roles", handleListRoles(cache))
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

func handleListRoles(cache *roleCapCache) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"roles": cache.GetRoles()})
	}
}
