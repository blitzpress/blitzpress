package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func newUsersPluginTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	dbName := strings.NewReplacer("/", "_", " ", "_").Replace(t.Name())
	db, err := gorm.Open(sqlite.Open("file:"+dbName+"?mode=memory&cache=shared"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open test database: %v", err)
	}

	if err := db.AutoMigrate(
		&UsersPluginUser{},
		&UsersPluginRole{},
		&UsersPluginCapability{},
		&UsersPluginRoleCapability{},
		&UsersPluginUserRole{},
	); err != nil {
		t.Fatalf("migrate test database: %v", err)
	}

	return db
}

func newUsersPluginTestApp(t *testing.T) (*fiber.App, *gorm.DB, *roleCapCache) {
	t.Helper()

	db := newUsersPluginTestDB(t)
	if err := seedRolesAndCapabilities(db); err != nil {
		t.Fatalf("seed roles: %v", err)
	}

	cache := newRoleCapCache(db)
	if err := cache.Load(); err != nil {
		t.Fatalf("load role cache: %v", err)
	}

	driver := newUsersAuthDriver(db, cache)
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
		c.Locals(pluginsdk.AuthUserContextKey, &pluginsdk.AuthUser{
			ID:          uuid.New(),
			Email:       "admin@example.com",
			DisplayName: "Admin",
			Roles:       []string{"administrator"},
		})
		return c.Next()
	})
	registerRoutes(app, driver, db, cache)

	return app, db, cache
}

func jsonRequest(t *testing.T, method string, target string, body any) *http.Request {
	t.Helper()

	payload, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("marshal request: %v", err)
	}

	req := httptest.NewRequest(method, target, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	return req
}

func TestSeedRolesAndCapabilitiesMigratesLegacyCapability(t *testing.T) {
	db := newUsersPluginTestDB(t)

	if err := db.Create(&UsersPluginRole{Slug: "legacy-manager", Label: "Legacy Manager"}).Error; err != nil {
		t.Fatalf("create legacy role: %v", err)
	}
	if err := db.Create(&UsersPluginCapability{Slug: "manage_plugins"}).Error; err != nil {
		t.Fatalf("create legacy capability: %v", err)
	}
	if err := db.Create(&UsersPluginRoleCapability{
		RoleSlug:       "legacy-manager",
		CapabilitySlug: "manage_plugins",
	}).Error; err != nil {
		t.Fatalf("create legacy role capability: %v", err)
	}

	if err := seedRolesAndCapabilities(db); err != nil {
		t.Fatalf("seed roles and capabilities: %v", err)
	}

	var roleCaps []UsersPluginRoleCapability
	if err := db.Where("role_slug = ?", "legacy-manager").Find(&roleCaps).Error; err != nil {
		t.Fatalf("load role capabilities: %v", err)
	}

	got := map[string]bool{}
	for _, roleCap := range roleCaps {
		got[roleCap.CapabilitySlug] = true
	}

	for _, expected := range []string{
		"plugins.download",
		"plugins.activate",
		"plugins.upload",
		"plugins.deactivate",
		"plugins.settings",
	} {
		if !got[expected] {
			t.Fatalf("expected migrated capability %q, got %#v", expected, got)
		}
	}
	if got["manage_plugins"] {
		t.Fatalf("expected legacy capability join to be removed, got %#v", got)
	}

	var legacyCount int64
	if err := db.Model(&UsersPluginCapability{}).Where("slug = ?", "manage_plugins").Count(&legacyCount).Error; err != nil {
		t.Fatalf("count legacy capability: %v", err)
	}
	if legacyCount != 0 {
		t.Fatalf("expected legacy capability row to be removed, got %d", legacyCount)
	}
}

func TestCreateRoleRejectsInvalidSlug(t *testing.T) {
	app, _, _ := newUsersPluginTestApp(t)

	resp, err := app.Test(jsonRequest(t, http.MethodPost, "/roles", saveRoleRequest{
		Slug:  "Bad Role",
		Label: "Bad Role",
	}))
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestUpdateRoleChangesSlugJoinsAndCache(t *testing.T) {
	app, db, cache := newUsersPluginTestApp(t)

	userID := uuid.New()
	if err := db.Create(&UsersPluginUser{
		Email:        "author@example.com",
		PasswordHash: "hash",
		DisplayName:  "Author",
		IsActive:     true,
	}).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}
	var user UsersPluginUser
	if err := db.First(&user, "email = ?", "author@example.com").Error; err != nil {
		t.Fatalf("load user: %v", err)
	}
	userID = user.ID

	if err := db.Create(&UsersPluginUserRole{
		UserID:   userID,
		RoleSlug: "author",
	}).Error; err != nil {
		t.Fatalf("create user role: %v", err)
	}

	resp, err := app.Test(jsonRequest(t, http.MethodPut, "/roles/author", saveRoleRequest{
		Slug:         "content-author",
		Label:        "Content Author",
		Capabilities: []string{"site.read", "posts.edit"},
	}))
	if err != nil {
		t.Fatalf("app.Test: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	var userRole UsersPluginUserRole
	if err := db.First(&userRole, "user_id = ?", userID).Error; err != nil {
		t.Fatalf("load user role: %v", err)
	}
	if userRole.RoleSlug != "content-author" {
		t.Fatalf("expected user role slug %q, got %q", "content-author", userRole.RoleSlug)
	}

	var oldRoleCapCount int64
	if err := db.Model(&UsersPluginRoleCapability{}).Where("role_slug = ?", "author").Count(&oldRoleCapCount).Error; err != nil {
		t.Fatalf("count old role capabilities: %v", err)
	}
	if oldRoleCapCount != 0 {
		t.Fatalf("expected old role capability joins to be removed, got %d", oldRoleCapCount)
	}

	if !cache.HasCapability([]string{"content-author"}, "posts.edit") {
		t.Fatal("expected cache to include updated role capability")
	}
}
