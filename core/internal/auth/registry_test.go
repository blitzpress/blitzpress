package auth

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type authTestHooks struct {
	actionName  string
	actionArgs  []any
	filterName  string
	filterArgs  []any
	filterValue any
	filterErr   error
}

func (h *authTestHooks) DoAction(_ *pluginsdk.HookContext, name string, args ...any) error {
	h.actionName = name
	h.actionArgs = append([]any(nil), args...)
	return nil
}

func (h *authTestHooks) ApplyFilters(_ *pluginsdk.HookContext, name string, value any, args ...any) (any, error) {
	h.filterName = name
	h.filterArgs = append([]any(nil), args...)
	if h.filterErr != nil {
		return value, h.filterErr
	}
	if h.filterValue != nil {
		return h.filterValue, nil
	}
	return value, nil
}

type authTestDriver struct {
	user    *pluginsdk.AuthUser
	allowed bool
}

func (d authTestDriver) Authenticate(_ string) (*pluginsdk.AuthUser, error) {
	return d.user, nil
}

func (d authTestDriver) GetLoggedInUser(c *fiber.Ctx) *pluginsdk.AuthUser {
	user, _ := c.Locals(AuthUserKey).(*pluginsdk.AuthUser)
	return user
}

func (d authTestDriver) HasCapability(_ *pluginsdk.AuthUser, _ string) bool {
	return d.allowed
}

func (d authTestDriver) GetRoles() []pluginsdk.RoleDefinition {
	return nil
}

func (d authTestDriver) LoginURL() string {
	return "/login"
}

func TestRegistryRegisterDriverFiresHook(t *testing.T) {
	t.Parallel()

	hooks := &authTestHooks{}
	registry := NewRegistry()
	registry.SetHooks(hooks)

	driver := authTestDriver{}
	registry.RegisterDriver(driver)

	if hooks.actionName != HookDriverRegistered {
		t.Fatalf("expected hook %q, got %q", HookDriverRegistered, hooks.actionName)
	}
	if len(hooks.actionArgs) != 1 {
		t.Fatalf("expected registered driver arg, got %#v", hooks.actionArgs)
	}
}

func TestAdminAuthMiddlewareFiresAuthenticatedHook(t *testing.T) {
	t.Parallel()

	user := &pluginsdk.AuthUser{
		ID:          uuid.MustParse("11111111-1111-1111-1111-111111111111"),
		Email:       "admin@example.com",
		DisplayName: "Admin",
		Roles:       []string{"administrator"},
	}
	hooks := &authTestHooks{}
	registry := NewRegistry()
	registry.SetHooks(hooks)
	registry.RegisterDriver(authTestDriver{user: user})

	app := fiber.New()
	app.Get("/api/protected", AdminAuthMiddleware(registry), func(c *fiber.Ctx) error {
		return c.SendStatus(fiber.StatusNoContent)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/protected", nil)
	req.Header.Set("Authorization", "Bearer test-token")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, resp.StatusCode)
	}

	if hooks.actionName != HookUserAuthenticated {
		t.Fatalf("expected hook %q, got %q", HookUserAuthenticated, hooks.actionName)
	}
	if len(hooks.actionArgs) != 1 || hooks.actionArgs[0] != user {
		t.Fatalf("expected authenticated user arg, got %#v", hooks.actionArgs)
	}
}

func TestRequireCapabilityUsesCapabilityFilter(t *testing.T) {
	t.Parallel()

	user := &pluginsdk.AuthUser{
		ID:          uuid.MustParse("22222222-2222-2222-2222-222222222222"),
		Email:       "editor@example.com",
		DisplayName: "Editor",
		Roles:       []string{"editor"},
	}
	hooks := &authTestHooks{filterValue: true}
	registry := NewRegistry()
	registry.SetHooks(hooks)
	registry.RegisterDriver(authTestDriver{user: user, allowed: false})

	app := fiber.New()
	app.Get("/api/protected",
		func(c *fiber.Ctx) error {
			c.Locals(AuthUserKey, user)
			return c.Next()
		},
		RequireCapability(registry, "manage_users"),
		func(c *fiber.Ctx) error {
			return c.SendStatus(fiber.StatusNoContent)
		},
	)

	resp, err := app.Test(httptest.NewRequest(http.MethodGet, "/api/protected", nil))
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("expected status %d, got %d", http.StatusNoContent, resp.StatusCode)
	}

	if hooks.filterName != HookCheckCapability {
		t.Fatalf("expected filter %q, got %q", HookCheckCapability, hooks.filterName)
	}
	if len(hooks.filterArgs) != 2 || hooks.filterArgs[0] != user || hooks.filterArgs[1] != "manage_users" {
		t.Fatalf("expected user and capability filter args, got %#v", hooks.filterArgs)
	}
}

func TestRequireCapabilityReturnsFilterErrors(t *testing.T) {
	t.Parallel()

	user := &pluginsdk.AuthUser{
		ID:          uuid.MustParse("33333333-3333-3333-3333-333333333333"),
		Email:       "admin@example.com",
		DisplayName: "Admin",
		Roles:       []string{"administrator"},
	}
	hooks := &authTestHooks{filterErr: errors.New("filter failed")}
	registry := NewRegistry()
	registry.SetHooks(hooks)
	registry.RegisterDriver(authTestDriver{user: user, allowed: true})

	app := fiber.New()
	app.Get("/api/protected",
		func(c *fiber.Ctx) error {
			c.Locals(AuthUserKey, user)
			return c.Next()
		},
		RequireCapability(registry, "manage_users"),
		func(c *fiber.Ctx) error {
			return c.SendStatus(fiber.StatusNoContent)
		},
	)

	resp, err := app.Test(httptest.NewRequest(http.MethodGet, "/api/protected", nil))
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected status %d, got %d", http.StatusInternalServerError, resp.StatusCode)
	}
}
