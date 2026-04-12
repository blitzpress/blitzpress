package main

import (
	"errors"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"gorm.io/gorm"
)

const (
	tokenExpiry = 24 * time.Hour
	loginPath   = "/login"
)

var (
	errInvalidCredentials = errors.New("invalid email or password")
	errInvalidToken       = errors.New("invalid or expired token")
	errUserInactive       = errors.New("user account is inactive")
)

type jwtClaims struct {
	jwt.RegisteredClaims
	UserID uuid.UUID `json:"uid"`
}

type usersAuthDriver struct {
	db    *gorm.DB
	cache *roleCapCache
}

func newUsersAuthDriver(db *gorm.DB, cache *roleCapCache) *usersAuthDriver {
	return &usersAuthDriver{db: db, cache: cache}
}

func (d *usersAuthDriver) Authenticate(token string) (*pluginsdk.AuthUser, error) {
	secret := jwtSecret()
	claims := &jwtClaims{}

	parsed, err := jwt.ParseWithClaims(token, claims, func(_ *jwt.Token) (any, error) {
		return []byte(secret), nil
	})
	if err != nil || !parsed.Valid {
		return nil, errInvalidToken
	}

	var user UsersPluginUser
	if err := d.db.Where("id = ? AND is_active = ?", claims.UserID, true).First(&user).Error; err != nil {
		return nil, errInvalidToken
	}

	roles := d.userRoles(user.ID)

	return &pluginsdk.AuthUser{
		ID:          user.ID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		Roles:       roles,
	}, nil
}

func (d *usersAuthDriver) GetLoggedInUser(c *fiber.Ctx) *pluginsdk.AuthUser {
	user, _ := c.Locals("auth_user").(*pluginsdk.AuthUser)
	return user
}

func (d *usersAuthDriver) HasCapability(user *pluginsdk.AuthUser, capability string) bool {
	if user == nil {
		return false
	}
	return d.cache.HasCapability(user.Roles, capability)
}

func (d *usersAuthDriver) GetRoles() []pluginsdk.RoleDefinition {
	return d.cache.GetRoles()
}

func (d *usersAuthDriver) LoginURL() string {
	return loginPath
}

func (d *usersAuthDriver) Login(email, password string) (string, *pluginsdk.AuthUser, error) {
	var user UsersPluginUser
	if err := d.db.Where("email = ?", email).First(&user).Error; err != nil {
		return "", nil, errInvalidCredentials
	}

	if !user.IsActive {
		return "", nil, errUserInactive
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", nil, errInvalidCredentials
	}

	roles := d.userRoles(user.ID)

	token, err := d.generateToken(user.ID)
	if err != nil {
		return "", nil, err
	}

	authUser := &pluginsdk.AuthUser{
		ID:          user.ID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		Roles:       roles,
	}

	return token, authUser, nil
}

func (d *usersAuthDriver) generateToken(userID uuid.UUID) (string, error) {
	now := time.Now()
	claims := jwtClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(tokenExpiry)),
			Subject:   userID.String(),
		},
		UserID: userID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret()))
}

func (d *usersAuthDriver) userRoles(userID uuid.UUID) []string {
	var userRoles []UsersPluginUserRole
	d.db.Where("user_id = ?", userID).Find(&userRoles)

	roles := make([]string, 0, len(userRoles))
	for _, ur := range userRoles {
		roles = append(roles, ur.RoleSlug)
	}
	return roles
}

func jwtSecret() string {
	if s := os.Getenv("BLITZPRESS_AUTH_SECRET"); s != "" {
		return s
	}
	return "blitzpress-dev-secret-change-me"
}
