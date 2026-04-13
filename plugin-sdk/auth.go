package pluginsdk

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

const AuthUserContextKey = "auth_user"

type AuthUser struct {
	ID          uuid.UUID      `json:"id"`
	Email       string         `json:"email"`
	DisplayName string         `json:"display_name"`
	Roles       []string       `json:"roles"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

type RoleDefinition struct {
	Slug         string   `json:"slug"`
	Label        string   `json:"label"`
	Capabilities []string `json:"capabilities"`
}

type AuthDriver interface {
	Authenticate(token string) (*AuthUser, error)
	GetLoggedInUser(c *fiber.Ctx) *AuthUser
	HasCapability(user *AuthUser, capability string) bool
	GetRoles() []RoleDefinition
	LoginURL() string
}

type AuthLoginDriver interface {
	Login(email, password string) (string, *AuthUser, error)
}

type AuthRegistry interface {
	RegisterDriver(driver AuthDriver)
}
