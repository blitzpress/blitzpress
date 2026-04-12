package main

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
	"time"

	"github.com/BlitzPress/BlitzPress/core/internal/config"
	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

func TestCoreApplicationStartupLoadsPluginsAndRoutes(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	buildMainTestPlugin(t, pluginsDir, mainTestPluginFixture{
		id:      "example-plugin",
		name:    "Example Plugin",
		version: "1.0.0",
		source:  startupPluginSource("example-plugin", "Example Plugin", "1.0.0"),
		staticFiles: map[string]string{
			"static/hello.txt": "hello from plugin",
		},
	})

	app := newTestCoreApplication(t, &config.AppConfig{
		Port:       ":0",
		DBDriver:   "sqlite",
		DBDSN:      "file:" + sanitizeTestName(t.Name()) + "?mode=memory&cache=shared",
		PluginsDir: pluginsDir,
		LogLevel:   "error",
	})
	t.Cleanup(func() {
		if err := app.Shutdown(); err != nil {
			t.Fatalf("Shutdown() error = %v", err)
		}
	})

	pluginsResp, err := app.app.Test(httptest.NewRequest(http.MethodGet, "/api/core/plugins", nil))
	if err != nil {
		t.Fatalf("plugins app.Test() error = %v", err)
	}
	if pluginsResp.StatusCode != http.StatusOK {
		t.Fatalf("expected plugin list status %d, got %d", http.StatusOK, pluginsResp.StatusCode)
	}

	var payload struct {
		Plugins []struct {
			ID      string `json:"id"`
			Name    string `json:"name"`
			Version string `json:"version"`
		} `json:"plugins"`
	}
	if err := json.NewDecoder(pluginsResp.Body).Decode(&payload); err != nil {
		t.Fatalf("decoding plugin list failed: %v", err)
	}
	if len(payload.Plugins) != 1 || payload.Plugins[0].ID != "example-plugin" {
		t.Fatalf("unexpected plugin list payload: %#v", payload)
	}

	statusResp, err := app.app.Test(httptest.NewRequest(http.MethodGet, "/api/plugins/example-plugin/status", nil))
	if err != nil {
		t.Fatalf("plugin status app.Test() error = %v", err)
	}
	statusBody, err := io.ReadAll(statusResp.Body)
	if err != nil {
		t.Fatalf("reading status response failed: %v", err)
	}
	if statusResp.StatusCode != http.StatusOK {
		t.Fatalf("expected plugin status route %d, got %d", http.StatusOK, statusResp.StatusCode)
	}
	if !strings.Contains(string(statusBody), `"ready":true`) {
		t.Fatalf("expected core.ready hook to run before route handling, got %q", string(statusBody))
	}

	staticResp, err := app.app.Test(httptest.NewRequest(http.MethodGet, "/plugins/example-plugin/assets/hello.txt", nil))
	if err != nil {
		t.Fatalf("plugin static app.Test() error = %v", err)
	}
	staticBody, err := io.ReadAll(staticResp.Body)
	if err != nil {
		t.Fatalf("reading plugin static response failed: %v", err)
	}
	if staticResp.StatusCode != http.StatusOK {
		t.Fatalf("expected plugin static status %d, got %d", http.StatusOK, staticResp.StatusCode)
	}
	if string(staticBody) != "hello from plugin" {
		t.Fatalf("unexpected plugin static response: %q", string(staticBody))
	}
}

func TestCoreApplicationShutdownFiresHookAndStopsEventBus(t *testing.T) {
	t.Parallel()

	app := newTestCoreApplication(t, &config.AppConfig{
		Port:       ":0",
		DBDriver:   "sqlite",
		DBDSN:      "file:" + sanitizeTestName(t.Name()) + "?mode=memory&cache=shared",
		PluginsDir: t.TempDir(),
		LogLevel:   "error",
	})

	shutdownTriggered := make(chan struct{}, 1)
	app.registry.Hooks().AddAction("core.shutdown", func(ctx *pluginsdk.HookContext, args ...any) error {
		select {
		case shutdownTriggered <- struct{}{}:
		default:
		}
		return nil
	})

	if err := app.Shutdown(); err != nil {
		t.Fatalf("Shutdown() error = %v", err)
	}

	select {
	case <-shutdownTriggered:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for core.shutdown hook")
	}

	if err := app.registry.EventBus().Publish("after.shutdown", map[string]any{"ok": true}); err == nil {
		t.Fatal("expected event bus publish to fail after shutdown")
	}
}

func TestCoreApplicationServesSPAAndInjectsImportMap(t *testing.T) {
	t.Parallel()

	app := newTestCoreApplication(t, &config.AppConfig{
		Port:       ":0",
		DBDriver:   "sqlite",
		DBDSN:      "file:" + sanitizeTestName(t.Name()) + "?mode=memory&cache=shared",
		PluginsDir: t.TempDir(),
		LogLevel:   "error",
	})
	t.Cleanup(func() {
		if err := app.Shutdown(); err != nil {
			t.Fatalf("Shutdown() error = %v", err)
		}
	})

	rootResp, err := app.app.Test(httptest.NewRequest(http.MethodGet, "/", nil))
	if err != nil {
		t.Fatalf("root app.Test() error = %v", err)
	}
	rootBody, err := io.ReadAll(rootResp.Body)
	if err != nil {
		t.Fatalf("reading root response failed: %v", err)
	}
	rootHTML := string(rootBody)
	if rootResp.StatusCode != http.StatusOK {
		t.Fatalf("expected root status %d, got %d", http.StatusOK, rootResp.StatusCode)
	}
	if !strings.Contains(rootHTML, `<script type="importmap">`) {
		t.Fatalf("expected import map to be injected, got %q", rootHTML)
	}
	if !strings.Contains(rootHTML, `"solid-js":"/api/core/modules/solid-js.js"`) {
		t.Fatalf("expected solid-js import map entry, got %q", rootHTML)
	}
	if !strings.Contains(rootHTML, `<script type="module" crossorigin src="/assets/index.js"></script>`) {
		t.Fatalf("expected frontend script tag, got %q", rootHTML)
	}
	if !strings.Contains(rootHTML, `<link rel="stylesheet" crossorigin href="/assets/style.css">`) {
		t.Fatalf("expected frontend stylesheet link, got %q", rootHTML)
	}

	spaResp, err := app.app.Test(httptest.NewRequest(http.MethodGet, "/admin/plugins/example-plugin", nil))
	if err != nil {
		t.Fatalf("spa fallback app.Test() error = %v", err)
	}
	spaBody, err := io.ReadAll(spaResp.Body)
	if err != nil {
		t.Fatalf("reading spa fallback response failed: %v", err)
	}
	if spaResp.StatusCode != http.StatusOK || !strings.Contains(string(spaBody), `<script type="importmap">`) {
		t.Fatalf("expected SPA fallback to serve injected index, got status=%d body=%q", spaResp.StatusCode, string(spaBody))
	}

	assetResp, err := app.app.Test(httptest.NewRequest(http.MethodGet, "/assets/index.js", nil))
	if err != nil {
		t.Fatalf("asset app.Test() error = %v", err)
	}
	assetBody, err := io.ReadAll(assetResp.Body)
	if err != nil {
		t.Fatalf("reading asset response failed: %v", err)
	}
	if assetResp.StatusCode != http.StatusOK || !strings.Contains(string(assetBody), "BlitzPress Admin") {
		t.Fatalf("expected compiled frontend asset response, got status=%d body=%q", assetResp.StatusCode, string(assetBody))
	}

	moduleResp, err := app.app.Test(httptest.NewRequest(http.MethodGet, "/api/core/modules/plugin-sdk.js", nil))
	if err != nil {
		t.Fatalf("module app.Test() error = %v", err)
	}
	moduleBody, err := io.ReadAll(moduleResp.Body)
	if err != nil {
		t.Fatalf("reading module response failed: %v", err)
	}
	if moduleResp.StatusCode != http.StatusOK || !strings.Contains(string(moduleBody), "registerPlugin") {
		t.Fatalf("expected frontend module response, got status=%d body=%q", moduleResp.StatusCode, string(moduleBody))
	}
}

func newTestCoreApplication(t *testing.T, cfg *config.AppConfig) *coreApplication {
	t.Helper()

	app, err := newCoreApplication(cfg, newLogger(cfg.LogLevel, io.Discard))
	if err != nil {
		t.Fatalf("newCoreApplication() error = %v", err)
	}

	return app
}

type mainTestPluginFixture struct {
	id          string
	name        string
	version     string
	source      string
	staticFiles map[string]string
}

func buildMainTestPlugin(t *testing.T, pluginsDir string, fixture mainTestPluginFixture) {
	t.Helper()

	pluginDir := filepath.Join(pluginsDir, fixture.id)
	if err := os.MkdirAll(pluginDir, 0o755); err != nil {
		t.Fatalf("MkdirAll(%q) error = %v", pluginDir, err)
	}

	writeMainTestFile(t, filepath.Join(pluginDir, "main.go"), fixture.source)
	writeMainTestFile(t, filepath.Join(pluginDir, "go.mod"), fmt.Sprintf(`module %s

go 1.24

require github.com/BlitzPress/BlitzPress/plugin-sdk v0.0.0

replace github.com/BlitzPress/BlitzPress/plugin-sdk => %s
`, mainTestModuleName(t, pluginDir), mainTestPluginSDKDir(t)))
	writeMainTestFile(t, filepath.Join(pluginDir, "plugin.json"), fmt.Sprintf(`{
  "schema_version": 1,
  "id": %q,
  "name": %q,
  "version": %q,
  "sdk_version": "0.1.0",
  "has_frontend": false
}`, fixture.id, fixture.name, fixture.version))

	for name, contents := range fixture.staticFiles {
		filePath := filepath.Join(pluginDir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(filePath), 0o755); err != nil {
			t.Fatalf("MkdirAll(%q) error = %v", filepath.Dir(filePath), err)
		}
		writeMainTestFile(t, filePath, contents)
	}

	cmd := exec.Command(mainTestGoBinary(t), "build", "-mod=mod", "-buildmode=plugin", "-o", filepath.Join(pluginDir, "plugin.so"), ".")
	cmd.Dir = pluginDir
	cmd.Env = append(os.Environ(), "CGO_ENABLED=1")
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("building main test plugin %q failed: %v\n%s", fixture.id, err, output)
	}
}

func startupPluginSource(id, name, version string) string {
	return fmt.Sprintf(`package main

import (
	"embed"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
)

//go:embed static/*
var staticFiles embed.FS

var ready bool

type startupPlugin struct{}

func (startupPlugin) Manifest() pluginsdk.Manifest {
	return pluginsdk.Manifest{ID: %q, Name: %q, Version: %q}
}

func (startupPlugin) Register(r *pluginsdk.Registrar) error {
	r.Hooks.AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
		ready = true
		return nil
	})

	if err := r.HTTP.API(func(router fiber.Router) {
		router.Get("/status", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{"ready": ready})
		})
	}); err != nil {
		return err
	}

	return r.HTTP.Static(staticFiles, "static")
}

var Plugin pluginsdk.Plugin = startupPlugin{}
`, id, name, version)
}

func mainTestPluginSDKDir(t *testing.T) string {
	t.Helper()

	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller(0) failed")
	}

	return filepath.Clean(filepath.Join(filepath.Dir(filename), "..", "plugin-sdk"))
}

func mainTestGoBinary(t *testing.T) string {
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

func mainTestModuleName(t *testing.T, pluginDir string) string {
	t.Helper()

	return "example.com/main-" + sanitizeTestName(t.Name()) + "/" + filepath.Base(pluginDir)
}

func sanitizeTestName(name string) string {
	replacer := strings.NewReplacer("/", "-", "\\", "-", " ", "-", "(", "-", ")", "-", ":", "-", ".", "-")
	return replacer.Replace(name)
}

func writeMainTestFile(t *testing.T, path, contents string) {
	t.Helper()

	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatalf("WriteFile(%q) error = %v", path, err)
	}
}
