package plugins

import (
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path/filepath"
	"reflect"
	"testing"

	"github.com/BlitzPress/BlitzPress/core/internal/database"
	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
)

func TestPluginRegistryDiscoverLoadAndMountRoutes(t *testing.T) {
	t.Parallel()

	db := newSettingsTestDB(t, "plugin_registry_full_lifecycle")
	insertPluginSettings(t, db, database.PluginSetting{
		PluginID: "example-plugin",
		Key:      "site_name",
		Value:    `"BlitzPress"`,
	})

	pluginsDir := t.TempDir()
	buildRegistryPlugin(t, pluginsDir, registryPluginFixture{
		id:         "example-plugin",
		name:       "Example Plugin",
		version:    "1.2.3",
		sdkVersion: pluginsdk.SDKVersion,
		source:     successfulRegistryPluginSource("example-plugin", "Example Plugin", "1.2.3"),
		staticFiles: map[string]string{
			"static/hello.txt": "hello asset",
		},
	})

	registry := NewPluginRegistry(db, nil, nil)

	var loadedIDs []string
	registry.Hooks().AddAction("plugin.loaded", func(ctx *pluginsdk.HookContext, args ...any) error {
		loadedIDs = append(loadedIDs, ctx.PluginID)

		if len(args) != 1 {
			return fmt.Errorf("expected loaded plugin argument")
		}

		if _, ok := args[0].(*LoadedPlugin); !ok {
			return fmt.Errorf("expected *LoadedPlugin argument, got %T", args[0])
		}

		return nil
	})

	if err := registry.DiscoverAndLoad(pluginsDir); err != nil {
		t.Fatalf("DiscoverAndLoad() error = %v", err)
	}

	loaded, ok := registry.GetPlugin("example-plugin")
	if !ok {
		t.Fatal("expected plugin to be stored in registry")
	}

	if loaded.Status != "loaded" {
		t.Fatalf("expected loaded plugin status %q, got %q", "loaded", loaded.Status)
	}

	if len(loaded.Routes) != 1 {
		t.Fatalf("expected 1 registered route, got %d", len(loaded.Routes))
	}

	if len(loaded.Statics) != 1 {
		t.Fatalf("expected 1 static mount, got %d", len(loaded.Statics))
	}

	if loaded.SettingsSchema == nil || len(loaded.SettingsSchema.Sections) != 1 {
		t.Fatalf("expected settings schema to be stored, got %#v", loaded.SettingsSchema)
	}

	if !reflect.DeepEqual(loadedIDs, []string{"example-plugin"}) {
		t.Fatalf("expected plugin.loaded hook sequence %v, got %v", []string{"example-plugin"}, loadedIDs)
	}

	app := fiber.New()
	api := app.Group("/api")
	registry.MountRoutes(api, app)

	routeReq := httptest.NewRequest(http.MethodGet, "/api/plugins/example-plugin/hello", nil)
	routeResp, err := app.Test(routeReq)
	if err != nil {
		t.Fatalf("route app.Test() error = %v", err)
	}

	routeBody, err := io.ReadAll(routeResp.Body)
	if err != nil {
		t.Fatalf("reading route response body failed: %v", err)
	}

	if routeResp.StatusCode != http.StatusOK {
		t.Fatalf("expected route status %d, got %d", http.StatusOK, routeResp.StatusCode)
	}

	if string(routeBody) != "hello:BlitzPress" {
		t.Fatalf("expected route response %q, got %q", "hello:BlitzPress", string(routeBody))
	}

	staticReq := httptest.NewRequest(http.MethodGet, "/plugins/example-plugin/assets/hello.txt", nil)
	staticResp, err := app.Test(staticReq)
	if err != nil {
		t.Fatalf("static app.Test() error = %v", err)
	}

	staticBody, err := io.ReadAll(staticResp.Body)
	if err != nil {
		t.Fatalf("reading static response body failed: %v", err)
	}

	if staticResp.StatusCode != http.StatusOK {
		t.Fatalf("expected static status %d, got %d", http.StatusOK, staticResp.StatusCode)
	}

	if string(staticBody) != "hello asset" {
		t.Fatalf("expected static response %q, got %q", "hello asset", string(staticBody))
	}
}

func TestPluginRegistryFiresLifecycleHooksInDiscoveryOrder(t *testing.T) {
	t.Parallel()

	db := newSettingsTestDB(t, "plugin_registry_hook_order")
	pluginsDir := t.TempDir()

	buildRegistryPlugin(t, pluginsDir, registryPluginFixture{
		id:         "alpha-plugin",
		name:       "Alpha Plugin",
		version:    "1.0.0",
		sdkVersion: pluginsdk.SDKVersion,
		source:     simpleRegistryPluginSource("alpha-plugin", "Alpha Plugin", "1.0.0"),
	})
	buildRegistryPlugin(t, pluginsDir, registryPluginFixture{
		id:         "beta-plugin",
		name:       "Beta Plugin",
		version:    "1.0.0",
		sdkVersion: pluginsdk.SDKVersion,
		source:     simpleRegistryPluginSource("beta-plugin", "Beta Plugin", "1.0.0"),
	})

	registry := NewPluginRegistry(db, nil, nil)
	var sequence []string
	registry.Hooks().AddAction("core.booting", func(ctx *pluginsdk.HookContext, args ...any) error {
		sequence = append(sequence, "core.booting")
		return nil
	})
	registry.Hooks().AddAction("plugin.loaded", func(ctx *pluginsdk.HookContext, args ...any) error {
		sequence = append(sequence, "plugin.loaded:"+ctx.PluginID)
		return nil
	})
	registry.Hooks().AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
		sequence = append(sequence, "core.ready")
		return nil
	})

	if err := registry.DiscoverAndLoad(pluginsDir); err != nil {
		t.Fatalf("DiscoverAndLoad() error = %v", err)
	}

	want := []string{"core.booting", "plugin.loaded:alpha-plugin", "plugin.loaded:beta-plugin", "core.ready"}
	if !reflect.DeepEqual(sequence, want) {
		t.Fatalf("expected lifecycle sequence %v, got %v", want, sequence)
	}
}

func TestPluginRegistryStopsWhenCoreBootingHookFails(t *testing.T) {
	t.Parallel()

	db := newSettingsTestDB(t, "plugin_registry_booting_failure")
	pluginsDir := t.TempDir()
	buildRegistryPlugin(t, pluginsDir, registryPluginFixture{
		id:         "example-plugin",
		name:       "Example Plugin",
		version:    "1.0.0",
		sdkVersion: pluginsdk.SDKVersion,
		source:     simpleRegistryPluginSource("example-plugin", "Example Plugin", "1.0.0"),
	})

	registry := NewPluginRegistry(db, nil, nil)
	var readyCalled bool
	registry.Hooks().AddAction("core.booting", func(ctx *pluginsdk.HookContext, args ...any) error {
		return errors.New("boot failed")
	})
	registry.Hooks().AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
		readyCalled = true
		return nil
	})

	err := registry.DiscoverAndLoad(pluginsDir)
	if err == nil {
		t.Fatal("expected core.booting failure")
	}

	if !errors.Is(err, ErrCoreBootingHook) {
		t.Fatalf("expected ErrCoreBootingHook, got %v", err)
	}

	if readyCalled {
		t.Fatal("expected core.ready not to fire after core.booting failure")
	}

	if _, ok := registry.GetPlugin("example-plugin"); ok {
		t.Fatal("expected no plugins to be loaded after core.booting failure")
	}
}

func TestPluginRegistryStoresDisabledPluginsWithoutLoading(t *testing.T) {
	t.Parallel()

	db := newSettingsTestDB(t, "plugin_registry_disabled")
	if err := db.Model(&database.PluginState{}).Create(map[string]any{
		"plugin_id": "disabled-plugin",
		"enabled":   false,
		"version":   "1.0.0",
	}).Error; err != nil {
		t.Fatalf("Create(disabled plugin state) error = %v", err)
	}

	pluginsDir := t.TempDir()
	buildRegistryPlugin(t, pluginsDir, registryPluginFixture{
		id:          "disabled-plugin",
		name:        "Disabled Plugin",
		version:     "1.0.0",
		sdkVersion:  pluginsdk.SDKVersion,
		hasFrontend: true,
		source:      frontendEmbedRegistryPluginSource("disabled-plugin", "Disabled Plugin", "1.0.0"),
		staticFiles: map[string]string{
			"static/hello.txt": "disabled asset",
		},
		embeddedFrontendFiles: map[string]string{
			"frontend_embed/assets/index.js":  `console.log("disabled frontend");`,
			"frontend_embed/assets/index.css": ".disabled{color:gray;}",
		},
	})

	registry := NewPluginRegistry(db, nil, nil)
	var loadedIDs []string
	registry.Hooks().AddAction("plugin.loaded", func(ctx *pluginsdk.HookContext, args ...any) error {
		loadedIDs = append(loadedIDs, ctx.PluginID)
		return nil
	})

	if err := registry.DiscoverAndLoad(pluginsDir); err != nil {
		t.Fatalf("DiscoverAndLoad() error = %v", err)
	}

	disabled, ok := registry.GetPlugin("disabled-plugin")
	if !ok {
		t.Fatal("expected disabled plugin to be stored in registry")
	}

	if disabled.Status != "disabled" {
		t.Fatalf("expected disabled plugin status %q, got %q", "disabled", disabled.Status)
	}

	if disabled.Instance != nil {
		t.Fatalf("expected disabled plugin instance to be nil, got %#v", disabled.Instance)
	}

	if len(disabled.Errors) != 0 {
		t.Fatalf("expected disabled plugin to have no errors, got %v", disabled.Errors)
	}

	if disabled.Manifest.ID != "disabled-plugin" {
		t.Fatalf("expected disabled plugin manifest id %q, got %q", "disabled-plugin", disabled.Manifest.ID)
	}

	if len(loadedIDs) != 0 {
		t.Fatalf("expected no plugin.loaded hooks for disabled plugins, got %v", loadedIDs)
	}

	app := fiber.New()
	api := app.Group("/api")
	registry.MountRoutes(api, app)

	routeResp, err := app.Test(httptest.NewRequest(http.MethodGet, "/api/plugins/disabled-plugin/hello", nil))
	if err != nil {
		t.Fatalf("disabled route app.Test() error = %v", err)
	}

	if routeResp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected disabled plugin route status %d, got %d", http.StatusNotFound, routeResp.StatusCode)
	}

	staticResp, err := app.Test(httptest.NewRequest(http.MethodGet, "/plugins/disabled-plugin/assets/index.js", nil))
	if err != nil {
		t.Fatalf("disabled static app.Test() error = %v", err)
	}

	if staticResp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected disabled plugin static status %d, got %d", http.StatusNotFound, staticResp.StatusCode)
	}
}

func TestPluginRegistryMountRoutesServesFrontendBuildAssets(t *testing.T) {
	t.Parallel()

	db := newSettingsTestDB(t, "plugin_registry_frontend_assets")
	pluginsDir := t.TempDir()

	buildRegistryPlugin(t, pluginsDir, registryPluginFixture{
		id:          "example-plugin",
		name:        "Example Plugin",
		version:     "1.0.0",
		sdkVersion:  pluginsdk.SDKVersion,
		hasFrontend: true,
		source:      frontendEmbedRegistryPluginSource("example-plugin", "Example Plugin", "1.0.0"),
		embeddedFrontendFiles: map[string]string{
			"frontend_embed/assets/index.js":  `console.log("example frontend");`,
			"frontend_embed/assets/index.css": ".example{color:red;}",
		},
	})

	registry := NewPluginRegistry(db, nil, nil)
	if err := registry.DiscoverAndLoad(pluginsDir); err != nil {
		t.Fatalf("DiscoverAndLoad() error = %v", err)
	}

	app := fiber.New()
	api := app.Group("/api")
	registry.MountRoutes(api, app)

	jsResp, err := app.Test(httptest.NewRequest(http.MethodGet, "/plugins/example-plugin/assets/index.js", nil))
	if err != nil {
		t.Fatalf("frontend js app.Test() error = %v", err)
	}

	jsBody, err := io.ReadAll(jsResp.Body)
	if err != nil {
		t.Fatalf("reading frontend js response body failed: %v", err)
	}

	if jsResp.StatusCode != http.StatusOK {
		t.Fatalf("expected frontend js status %d, got %d", http.StatusOK, jsResp.StatusCode)
	}

	if string(jsBody) != `console.log("example frontend");` {
		t.Fatalf("expected frontend js response %q, got %q", `console.log("example frontend");`, string(jsBody))
	}

	cssResp, err := app.Test(httptest.NewRequest(http.MethodGet, "/plugins/example-plugin/assets/index.css", nil))
	if err != nil {
		t.Fatalf("frontend css app.Test() error = %v", err)
	}

	cssBody, err := io.ReadAll(cssResp.Body)
	if err != nil {
		t.Fatalf("reading frontend css response body failed: %v", err)
	}

	if cssResp.StatusCode != http.StatusOK {
		t.Fatalf("expected frontend css status %d, got %d", http.StatusOK, cssResp.StatusCode)
	}

	if string(cssBody) != ".example{color:red;}" {
		t.Fatalf("expected frontend css response %q, got %q", ".example{color:red;}", string(cssBody))
	}
}

func TestPluginRegistryStoresFailedPluginsAndContinuesLoading(t *testing.T) {
	t.Parallel()

	db := newSettingsTestDB(t, "plugin_registry_failure_handling")
	insertPluginSettings(t, db, database.PluginSetting{
		PluginID: "good-plugin",
		Key:      "site_name",
		Value:    `"Good"`,
	})

	pluginsDir := t.TempDir()
	buildRegistryPlugin(t, pluginsDir, registryPluginFixture{
		id:         "good-plugin",
		name:       "Good Plugin",
		version:    "1.0.0",
		sdkVersion: pluginsdk.SDKVersion,
		source:     successfulRegistryPluginSource("good-plugin", "Good Plugin", "1.0.0"),
		staticFiles: map[string]string{
			"static/hello.txt": "good asset",
		},
	})
	buildRegistryPlugin(t, pluginsDir, registryPluginFixture{
		id:         "bad-plugin",
		name:       "Bad Plugin",
		version:    "1.0.0",
		sdkVersion: pluginsdk.SDKVersion,
		source:     failingRegistryPluginSource("bad-plugin", "Bad Plugin", "1.0.0"),
	})

	registry := NewPluginRegistry(db, nil, nil)

	err := registry.DiscoverAndLoad(pluginsDir)
	if err == nil {
		t.Fatal("expected DiscoverAndLoad() to report plugin failure")
	}

	if !errors.Is(err, pluginsdk.ErrRegistrationFailed) {
		t.Fatalf("expected ErrRegistrationFailed, got %v", err)
	}

	good, ok := registry.GetPlugin("good-plugin")
	if !ok || good.Status != "loaded" {
		t.Fatalf("expected good plugin to load successfully, got %#v", good)
	}

	bad, ok := registry.GetPlugin("bad-plugin")
	if !ok {
		t.Fatal("expected failed plugin to be stored in registry")
	}

	if bad.Status != "error" {
		t.Fatalf("expected failed plugin status %q, got %q", "error", bad.Status)
	}

	if len(bad.Errors) == 0 {
		t.Fatal("expected failed plugin errors to be recorded")
	}
}

type registryPluginFixture struct {
	id                    string
	name                  string
	version               string
	sdkVersion            string
	hasFrontend           bool
	source                string
	staticFiles           map[string]string
	embeddedFrontendFiles map[string]string
}

func buildRegistryPlugin(t *testing.T, pluginsDir string, fixture registryPluginFixture) string {
	t.Helper()

	pluginDir := filepath.Join(pluginsDir, fixture.id)
	if err := os.MkdirAll(pluginDir, 0o755); err != nil {
		t.Fatalf("MkdirAll(%q) error = %v", pluginDir, err)
	}

	writeFile(t, filepath.Join(pluginDir, "main.go"), fixture.source)
	writeFile(t, filepath.Join(pluginDir, "go.mod"), fmt.Sprintf(`module %s

go 1.24

require github.com/BlitzPress/BlitzPress/plugin-sdk v0.0.0

replace github.com/BlitzPress/BlitzPress/plugin-sdk => %s
`, testModuleName(t, pluginDir), pluginSDKDir(t)))
	writeFile(t, filepath.Join(pluginDir, "plugin.json"), pluginManifestJSON(fixture))

	for name, contents := range fixture.staticFiles {
		path := filepath.Join(pluginDir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatalf("MkdirAll(%q) error = %v", filepath.Dir(path), err)
		}

		writeFile(t, path, contents)
	}
	for name, contents := range fixture.embeddedFrontendFiles {
		path := filepath.Join(pluginDir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
			t.Fatalf("MkdirAll(%q) error = %v", filepath.Dir(path), err)
		}

		writeFile(t, path, contents)
	}

	cmd := exec.Command(goBinary(t), "build", "-mod=mod", "-buildmode=plugin", "-o", filepath.Join(pluginDir, PluginSOFilename()), ".")
	cmd.Dir = pluginDir
	cmd.Env = append(os.Environ(), "CGO_ENABLED=1")
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("building registry plugin %q failed: %v\n%s", fixture.id, err, output)
	}

	return pluginDir
}

func pluginManifestJSON(fixture registryPluginFixture) string {
	frontendEntry := ""
	frontendStyle := ""
	if fixture.hasFrontend {
		frontendEntry = "frontend/assets/index.js"
		frontendStyle = "frontend/assets/index.css"
	}

	return fmt.Sprintf(`{
  "schema_version": 1,
  "id": %q,
  "name": %q,
  "version": %q,
  "sdk_version": %q,
  "has_frontend": %t,
  "frontend_entry": %q,
  "frontend_style": %q
}`, fixture.id, fixture.name, fixture.version, fixture.sdkVersion, fixture.hasFrontend, frontendEntry, frontendStyle)
}

func successfulRegistryPluginSource(id, name, version string) string {
	return fmt.Sprintf(`package main

import (
	"embed"
	"errors"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
)

//go:embed static/*
var staticFiles embed.FS

type registryPlugin struct{}

func (registryPlugin) Manifest() pluginsdk.Manifest {
	return pluginsdk.Manifest{ID: %q, Name: %q, Version: %q}
}

func (registryPlugin) Register(r *pluginsdk.Registrar) error {
	if r.DB == nil || r.Hooks == nil || r.HTTP == nil || r.Events == nil || r.Settings == nil || r.Logger == nil || r.Config == nil {
		return errors.New("missing registrar dependency")
	}

	siteName, err := r.Config.Get("site_name")
	if err != nil {
		return err
	}

	r.Settings.Register(pluginsdk.SettingsSchema{
		Sections: []pluginsdk.SettingsSection{
			{
				ID: "general",
				Title: "General",
				Fields: []pluginsdk.SettingsField{
					{ID: "site_name", Type: "string", Label: "Site Name", Default: siteName},
				},
			},
		},
	})

	r.Hooks.AddAction("registry.test", func(ctx *pluginsdk.HookContext, args ...any) error { return nil })
	r.Events.Subscribe("registry.test", func(event pluginsdk.Event) error { return nil })

	if err := r.HTTP.API(func(router fiber.Router) {
		router.Get("/hello", func(c *fiber.Ctx) error {
			return c.SendString("hello:" + siteName)
		})
	}); err != nil {
		return err
	}

	return r.HTTP.Static(staticFiles, "static")
}

var Plugin pluginsdk.Plugin = registryPlugin{}
`, id, name, version)
}

func simpleRegistryPluginSource(id, name, version string) string {
	return fmt.Sprintf(`package main

import pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"

type registryPlugin struct{}

func (registryPlugin) Manifest() pluginsdk.Manifest {
	return pluginsdk.Manifest{ID: %q, Name: %q, Version: %q}
}

func (registryPlugin) Register(r *pluginsdk.Registrar) error {
	return nil
}

var Plugin pluginsdk.Plugin = registryPlugin{}
`, id, name, version)
}

func frontendEmbedRegistryPluginSource(id, name, version string) string {
	return fmt.Sprintf(`package main

import (
	"embed"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

//go:embed all:frontend_embed
var frontendFiles embed.FS

type registryPlugin struct{}

func (registryPlugin) Manifest() pluginsdk.Manifest {
	return pluginsdk.Manifest{ID: %q, Name: %q, Version: %q}
}

func (registryPlugin) Register(r *pluginsdk.Registrar) error {
	return r.HTTP.Static(frontendFiles, "frontend_embed/assets")
}

var Plugin pluginsdk.Plugin = registryPlugin{}
`, id, name, version)
}

func failingRegistryPluginSource(id, name, version string) string {
	return fmt.Sprintf(`package main

import (
	"errors"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

type registryPlugin struct{}

func (registryPlugin) Manifest() pluginsdk.Manifest {
	return pluginsdk.Manifest{ID: %q, Name: %q, Version: %q}
}

func (registryPlugin) Register(r *pluginsdk.Registrar) error {
	return errors.New("register failed")
}

var Plugin pluginsdk.Plugin = registryPlugin{}
`, id, name, version)
}
