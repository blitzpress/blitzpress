package auth

import (
	"strings"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
)

const AuthUserKey = "auth_user"

func ExtractToken(c *fiber.Ctx) string {
	if header := c.Get("Authorization"); strings.HasPrefix(header, "Bearer ") {
		return strings.TrimPrefix(header, "Bearer ")
	}

	return c.Cookies("bp_session")
}

func isAPIRequest(c *fiber.Ctx) bool {
	return strings.HasPrefix(c.Path(), "/api/")
}

func AdminAuthMiddleware(registry *Registry) fiber.Handler {
	return func(c *fiber.Ctx) error {
		driver := registry.Driver()
		if driver == nil {
			return c.Next()
		}

		token := ExtractToken(c)
		if token == "" {
			return denyAccess(c, driver)
		}

		user, err := driver.Authenticate(token)
		if err != nil || user == nil {
			return denyAccess(c, driver)
		}

		c.Locals(AuthUserKey, user)
		return c.Next()
	}
}

func RequireCapability(registry *Registry, capability string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		driver := registry.Driver()
		if driver == nil {
			return c.Next()
		}

		user, ok := c.Locals(AuthUserKey).(*pluginsdk.AuthUser)
		if !ok || user == nil {
			return denyAccess(c, driver)
		}

		if !driver.HasCapability(user, capability) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "insufficient permissions",
			})
		}

		return c.Next()
	}
}

func denyAccess(c *fiber.Ctx, driver pluginsdk.AuthDriver) error {
	if isAPIRequest(c) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "authentication required",
		})
	}

	return c.Redirect(driver.LoginURL(), fiber.StatusFound)
}

func GetAuthUser(c *fiber.Ctx) *pluginsdk.AuthUser {
	user, _ := c.Locals(AuthUserKey).(*pluginsdk.AuthUser)
	return user
}
