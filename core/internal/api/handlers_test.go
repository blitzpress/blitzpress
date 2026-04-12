package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/BlitzPress/BlitzPress/core/internal/database"
	"github.com/BlitzPress/BlitzPress/core/internal/plugins"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func TestCMSPluginsHandlerReturnsLoadedPlugins(t *testing.T) {
	t.Parallel()

	registry := buildAPITestRegistry(t, []apiPluginFixture{
		{
			id:            "example-plugin",
			name:          "Example Plugin",
			version:       "1.2.3",
			hasFrontend:   true,
			frontendEntry: "frontend/assets/index.js",
			frontendStyle: "frontend/assets/index.css",
			source:        settingsPluginSource("example-plugin", "Example Plugin", "1.2.3"),
		},
	}, nil)

	app := fiber.New()
	app.Get("/api/core/plugins", CMSPluginsHandler(registry))

	resp, err := app.Test(httptest.NewRequest(http.MethodGet, "/api/core/plugins", nil))
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	var payload pluginListResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decoding response failed: %v", err)
	}

	if len(payload.Plugins) != 1 {
		t.Fatalf("expected 1 plugin, got %d", len(payload.Plugins))
	}

	plugin := payload.Plugins[0]
	if plugin.ID != "example-plugin" || plugin.Name != "Example Plugin" || plugin.Version != "1.2.3" {
		t.Fatalf("unexpected plugin payload: %#v", plugin)
	}
	if !plugin.HasFrontend || plugin.FrontendEntry == "" || plugin.FrontendStyle == "" {
		t.Fatalf("expected frontend fields to be populated, got %#v", plugin)
	}
	if plugin.FrontendEntry != "/plugins/example-plugin/assets/index.js" {
		t.Fatalf("expected normalized frontend entry path, got %q", plugin.FrontendEntry)
	}
	if plugin.FrontendStyle != "/plugins/example-plugin/assets/index.css" {
		t.Fatalf("expected normalized frontend style path, got %q", plugin.FrontendStyle)
	}
}

func TestCMSPluginsHandlerSkipsDisabledPlugins(t *testing.T) {
	t.Parallel()

	db := newAPITestDB(t, "api_disabled_plugins")
	if err := db.Model(&database.PluginState{}).Create(map[string]any{
		"plugin_id": "disabled-plugin",
		"enabled":   false,
		"version":   "1.0.0",
	}).Error; err != nil {
		t.Fatalf("Create(disabled plugin state) error = %v", err)
	}

	registry := buildAPITestRegistry(t, []apiPluginFixture{
		{
			id:      "enabled-plugin",
			name:    "Enabled Plugin",
			version: "1.0.0",
			source:  settingsPluginSource("enabled-plugin", "Enabled Plugin", "1.0.0"),
		},
		{
			id:      "disabled-plugin",
			name:    "Disabled Plugin",
			version: "1.0.0",
			source:  settingsPluginSource("disabled-plugin", "Disabled Plugin", "1.0.0"),
		},
	}, db)

	app := fiber.New()
	app.Get("/api/core/plugins", CMSPluginsHandler(registry))

	resp, err := app.Test(httptest.NewRequest(http.MethodGet, "/api/core/plugins", nil))
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	var payload pluginListResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decoding response failed: %v", err)
	}

	if len(payload.Plugins) != 1 {
		t.Fatalf("expected 1 enabled plugin, got %d", len(payload.Plugins))
	}

	if payload.Plugins[0].ID != "enabled-plugin" {
		t.Fatalf("expected only enabled plugin in payload, got %#v", payload.Plugins)
	}
}

func TestAdminPluginsHandlerReturnsAllPlugins(t *testing.T) {
	t.Parallel()

	db := newAPITestDB(t, "api_admin_all_plugins")
	if err := db.Model(&database.PluginState{}).Create(map[string]any{
		"plugin_id": "disabled-plugin",
		"enabled":   false,
		"version":   "1.0.0",
	}).Error; err != nil {
		t.Fatalf("Create(disabled plugin state) error = %v", err)
	}

	registry := buildAPITestRegistry(t, []apiPluginFixture{
		{
			id:      "loaded-plugin",
			name:    "Loaded Plugin",
			version: "1.0.0",
			source:  settingsPluginSource("loaded-plugin", "Loaded Plugin", "1.0.0"),
		},
		{
			id:      "disabled-plugin",
			name:    "Disabled Plugin",
			version: "1.0.0",
			source:  settingsPluginSource("disabled-plugin", "Disabled Plugin", "1.0.0"),
		},
	}, db)

	app := fiber.New()
	app.Get("/api/core/plugins/all", AdminPluginsHandler(registry))

	resp, err := app.Test(httptest.NewRequest(http.MethodGet, "/api/core/plugins/all", nil))
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}

	var payload adminPluginListResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		t.Fatalf("decoding response failed: %v", err)
	}

	if len(payload.Plugins) != 2 {
		t.Fatalf("expected 2 plugins (loaded + disabled), got %d", len(payload.Plugins))
	}

	statusMap := map[string]string{}
	for _, p := range payload.Plugins {
		statusMap[p.ID] = p.Status
	}

	if statusMap["loaded-plugin"] != "loaded" {
		t.Fatalf("expected loaded-plugin status 'loaded', got %q", statusMap["loaded-plugin"])
	}
	if statusMap["disabled-plugin"] != "disabled" {
		t.Fatalf("expected disabled-plugin status 'disabled', got %q", statusMap["disabled-plugin"])
	}
}

func TestAdminPluginToggleHandler(t *testing.T) {
	t.Parallel()

	db := newAPITestDB(t, "api_admin_toggle")
	registry := buildAPITestRegistry(t, []apiPluginFixture{
		{
			id:      "toggle-plugin",
			name:    "Toggle Plugin",
			version: "1.0.0",
			source:  settingsPluginSource("toggle-plugin", "Toggle Plugin", "1.0.0"),
		},
	}, db)

	app := fiber.New()
	app.Put("/api/core/plugins/:id/enabled", AdminPluginToggleHandler(registry, db))

	disableBody := `{"enabled": false}`
	req := httptest.NewRequest(http.MethodPut, "/api/core/plugins/toggle-plugin/enabled", strings.NewReader(disableBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("expected status %d, got %d: %s", http.StatusOK, resp.StatusCode, body)
	}

	var toggleResp struct {
		Plugin          adminPluginListItem `json:"plugin"`
		RestartRequired bool                `json:"restart_required"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&toggleResp); err != nil {
		t.Fatalf("decoding toggle response failed: %v", err)
	}

	if toggleResp.Plugin.Status != "disabled" {
		t.Fatalf("expected status 'disabled' after toggle, got %q", toggleResp.Plugin.Status)
	}
	if toggleResp.Plugin.Enabled {
		t.Fatalf("expected enabled=false after disabling")
	}

	var state database.PluginState
	if err := db.Where("plugin_id = ?", "toggle-plugin").First(&state).Error; err != nil {
		t.Fatalf("reading plugin state from DB: %v", err)
	}
	if state.Enabled {
		t.Fatalf("expected DB state enabled=false")
	}
}

func TestPluginSettingsHandlersGetPutAndValidate(t *testing.T) {
	t.Parallel()

	db := newAPITestDB(t, "api_plugin_settings")
	insertPluginSettings(t, db, database.PluginSetting{
		PluginID: "settings-plugin",
		Key:      "site_name",
		Value:    `"Existing Site"`,
	})

	registry := buildAPITestRegistry(t, []apiPluginFixture{
		{
			id:      "settings-plugin",
			name:    "Settings Plugin",
			version: "1.0.0",
			source:  settingsPluginSource("settings-plugin", "Settings Plugin", "1.0.0"),
		},
	}, db)

	app := fiber.New()
	app.Get("/api/core/plugins/:id/settings", PluginSettingsGetHandler(registry, db))
	app.Put("/api/core/plugins/:id/settings", PluginSettingsPutHandler(registry, db))

	getResp, err := app.Test(httptest.NewRequest(http.MethodGet, "/api/core/plugins/settings-plugin/settings", nil))
	if err != nil {
		t.Fatalf("settings GET app.Test() error = %v", err)
	}

	var getPayload pluginSettingsResponse
	if err := json.NewDecoder(getResp.Body).Decode(&getPayload); err != nil {
		t.Fatalf("decoding settings GET failed: %v", err)
	}

	if getPayload.Schema == nil || len(getPayload.Schema.Sections) != 1 {
		t.Fatalf("expected settings schema in response, got %#v", getPayload.Schema)
	}

	if getPayload.Values["site_name"] != "Existing Site" {
		t.Fatalf("expected existing site_name, got %#v", getPayload.Values)
	}

	validBody := `{"values":{"site_name":"Updated Site","enabled":true,"count":3,"mode":"advanced"}}`
	putResp, err := app.Test(httptest.NewRequest(http.MethodPut, "/api/core/plugins/settings-plugin/settings", strings.NewReader(validBody)))
	if err != nil {
		t.Fatalf("settings PUT app.Test() error = %v", err)
	}

	if putResp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(putResp.Body)
		t.Fatalf("expected PUT status %d, got %d: %s", http.StatusOK, putResp.StatusCode, body)
	}

	reader := plugins.NewPluginConfigReader("settings-plugin", db)
	siteName, err := reader.Get("site_name")
	if err != nil {
		t.Fatalf("Get(site_name) error = %v", err)
	}
	if siteName != "Updated Site" {
		t.Fatalf("expected persisted site_name %q, got %q", "Updated Site", siteName)
	}

	count, err := reader.GetInt("count")
	if err != nil {
		t.Fatalf("GetInt(count) error = %v", err)
	}
	if count != 3 {
		t.Fatalf("expected persisted count %d, got %d", 3, count)
	}

	invalidBody := `{"values":{"site_name":"Updated Site","enabled":true,"count":0,"mode":"invalid"}}`
	invalidResp, err := app.Test(httptest.NewRequest(http.MethodPut, "/api/core/plugins/settings-plugin/settings", strings.NewReader(invalidBody)))
	if err != nil {
		t.Fatalf("invalid settings PUT app.Test() error = %v", err)
	}

	if invalidResp.StatusCode != http.StatusBadRequest {
		body, _ := io.ReadAll(invalidResp.Body)
		t.Fatalf("expected invalid PUT status %d, got %d: %s", http.StatusBadRequest, invalidResp.StatusCode, body)
	}
}

func TestCMSModulesHandlerServesFiles(t *testing.T) {
	t.Parallel()

	app := fiber.New()
	app.Get("/api/core/modules/*", CMSModulesHandler(fstest.MapFS{
		"solid-js.js": &fstest.MapFile{Data: []byte("export const x = 1;")},
	}))

	okResp, err := app.Test(httptest.NewRequest(http.MethodGet, "/api/core/modules/solid-js.js", nil))
	if err != nil {
		t.Fatalf("modules app.Test() error = %v", err)
	}

	body, err := io.ReadAll(okResp.Body)
	if err != nil {
		t.Fatalf("reading module body failed: %v", err)
	}

	if okResp.StatusCode != http.StatusOK || string(body) != "export const x = 1;" {
		t.Fatalf("unexpected module response status=%d body=%q", okResp.StatusCode, string(body))
	}

	missingResp, err := app.Test(httptest.NewRequest(http.MethodGet, "/api/core/modules/missing.js", nil))
	if err != nil {
		t.Fatalf("missing module app.Test() error = %v", err)
	}

	if missingResp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected missing module status %d, got %d", http.StatusNotFound, missingResp.StatusCode)
	}
}

type apiPluginFixture struct {
	id            string
	name          string
	version       string
	hasFrontend   bool
	frontendEntry string
	frontendStyle string
	source        string
}

func buildAPITestRegistry(t *testing.T, fixtures []apiPluginFixture, db *gorm.DB) *plugins.PluginRegistry {
	t.Helper()

	if db == nil {
		db = newAPITestDB(t, "api_registry")
	}

	pluginsDir := t.TempDir()
	for _, fixture := range fixtures {
		buildAPITestPlugin(t, pluginsDir, fixture)
	}

	registry := plugins.NewPluginRegistry(db, nil)
	if err := registry.DiscoverAndLoad(pluginsDir); err != nil {
		t.Fatalf("DiscoverAndLoad() error = %v", err)
	}

	return registry
}

func buildAPITestPlugin(t *testing.T, pluginsDir string, fixture apiPluginFixture) {
	t.Helper()

	pluginDir := filepath.Join(pluginsDir, fixture.id)
	if err := os.MkdirAll(pluginDir, 0o755); err != nil {
		t.Fatalf("MkdirAll(%q) error = %v", pluginDir, err)
	}

	writeAPITestFile(t, filepath.Join(pluginDir, "main.go"), fixture.source)
	writeAPITestFile(t, filepath.Join(pluginDir, "go.mod"), fmt.Sprintf(`module %s

go 1.24

require github.com/BlitzPress/BlitzPress/plugin-sdk v0.0.0

replace github.com/BlitzPress/BlitzPress/plugin-sdk => %s
`, apiTestModuleName(t, pluginDir), apiPluginSDKDir(t)))
	writeAPITestFile(t, filepath.Join(pluginDir, "plugin.json"), apiPluginManifestJSON(fixture))

	cmd := exec.Command(apiGoBinary(t), "build", "-mod=mod", "-buildmode=plugin", "-o", filepath.Join(pluginDir, "plugin.so"), ".")
	cmd.Dir = pluginDir
	cmd.Env = append(os.Environ(), "CGO_ENABLED=1")
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("building api test plugin %q failed: %v\n%s", fixture.id, err, output)
	}
}

func apiPluginManifestJSON(fixture apiPluginFixture) string {
	return fmt.Sprintf(`{
  "schema_version": 1,
  "id": %q,
  "name": %q,
  "version": %q,
  "sdk_version": "0.1.0",
  "has_frontend": %t,
  "frontend_entry": %q,
  "frontend_style": %q
}`, fixture.id, fixture.name, fixture.version, fixture.hasFrontend, fixture.frontendEntry, fixture.frontendStyle)
}

func settingsPluginSource(id, name, version string) string {
	return fmt.Sprintf(`package main

import pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"

type apiPlugin struct{}

func (apiPlugin) Manifest() pluginsdk.Manifest {
	return pluginsdk.Manifest{ID: %q, Name: %q, Version: %q}
}

func (apiPlugin) Register(r *pluginsdk.Registrar) error {
	r.Settings.Register(pluginsdk.SettingsSchema{
		Sections: []pluginsdk.SettingsSection{
			{
				ID: "general",
				Title: "General",
				Fields: []pluginsdk.SettingsField{
					{ID: "site_name", Type: "string", Label: "Site Name", Required: true},
					{ID: "enabled", Type: "boolean", Label: "Enabled"},
					{ID: "count", Type: "number", Label: "Count", Min: floatPtr(1), Max: floatPtr(5)},
					{ID: "mode", Type: "select", Label: "Mode", Options: []pluginsdk.SelectOption{{Value: "basic", Label: "Basic"}, {Value: "advanced", Label: "Advanced"}}},
				},
			},
		},
	})
	return nil
}

var Plugin pluginsdk.Plugin = apiPlugin{}

func floatPtr(value float64) *float64 { return &value }
`, id, name, version)
}

func newAPITestDB(t *testing.T, name string) *gorm.DB {
	t.Helper()

	db, err := database.Initialize(database.Config{
		Driver: "sqlite",
		DSN:    "file:" + name + "?mode=memory&cache=shared",
	})
	if err != nil {
		t.Fatalf("Initialize() error = %v", err)
	}

	return db
}

func insertPluginSettings(t *testing.T, db *gorm.DB, settings ...database.PluginSetting) {
	t.Helper()

	for _, setting := range settings {
		if err := db.Create(&setting).Error; err != nil {
			t.Fatalf("Create(%s/%s) error = %v", setting.PluginID, setting.Key, err)
		}
	}
}

func apiPluginSDKDir(t *testing.T) string {
	t.Helper()

	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller(0) failed")
	}

	return filepath.Clean(filepath.Join(filepath.Dir(filename), "..", "..", "..", "plugin-sdk"))
}

func apiGoBinary(t *testing.T) string {
	t.Helper()

	goBin := filepath.Join(runtime.GOROOT(), "bin", "go")
	if _, err := os.Stat(goBin); err == nil {
		return goBin
	}

	pathGo, err := exec.LookPath("go")
	if err != nil {
		t.Fatalf("go binary not found: %v", err)
	}

	return pathGo
}

func apiTestModuleName(t *testing.T, pluginDir string) string {
	t.Helper()

	return "example.com/api-" + strings.NewReplacer("/", "-", "\\", "-", " ", "-", "(", "-", ")", "-", ":", "-", ".", "-").Replace(t.Name()) + "/" + filepath.Base(pluginDir)
}

func writeAPITestFile(t *testing.T, path, contents string) {
	t.Helper()

	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatalf("WriteFile(%q) error = %v", path, err)
	}
}
