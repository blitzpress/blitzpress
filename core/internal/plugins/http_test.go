package plugins

import (
	"errors"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"

	"github.com/gofiber/fiber/v2"
)

func TestPluginHTTPRegistryAPICollectsRoutes(t *testing.T) {
	t.Parallel()

	registry := newPluginHTTPRegistry("example-plugin")

	if err := registry.API(func(router fiber.Router) {
		router.Get("/health", func(c *fiber.Ctx) error {
			return c.SendString("ok")
		})
	}); err != nil {
		t.Fatalf("API() error = %v", err)
	}

	if got := len(registry.routes); got != 1 {
		t.Fatalf("expected 1 collected route, got %d", got)
	}

	route := registry.routes[0]
	if route.pluginID != "example-plugin" {
		t.Fatalf("expected collected route plugin id %q, got %q", "example-plugin", route.pluginID)
	}
	if route.register == nil {
		t.Fatal("expected collected route registration callback")
	}

	app := fiber.New()
	route.register(app.Group("/api/plugins/" + route.pluginID))

	req := httptest.NewRequest(http.MethodGet, "/api/plugins/example-plugin/health", nil)
	resp, err := app.Test(req)
	if err != nil {
		t.Fatalf("app.Test() error = %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, resp.StatusCode)
	}
}

func TestPluginHTTPRegistryStaticCollectsFilesystems(t *testing.T) {
	t.Parallel()

	registry := newPluginHTTPRegistry("example-plugin")
	filesystem := fstest.MapFS{
		"static/hello.txt": &fstest.MapFile{Data: []byte("hello")},
		"index.txt":        &fstest.MapFile{Data: []byte("root")},
	}

	if err := registry.Static(filesystem, "static"); err != nil {
		t.Fatalf("Static() with stripPrefix error = %v", err)
	}
	if err := registry.Static(filesystem, ""); err != nil {
		t.Fatalf("Static() with empty stripPrefix error = %v", err)
	}

	if got := len(registry.statics); got != 2 {
		t.Fatalf("expected 2 collected static mounts, got %d", got)
	}

	staticWithPrefix := registry.statics[0]
	if staticWithPrefix.pluginID != "example-plugin" {
		t.Fatalf("expected static mount plugin id %q, got %q", "example-plugin", staticWithPrefix.pluginID)
	}
	if staticWithPrefix.stripPrefix != "static" {
		t.Fatalf("expected stripPrefix %q, got %q", "static", staticWithPrefix.stripPrefix)
	}

	subFS, err := fs.Sub(staticWithPrefix.filesystem, staticWithPrefix.stripPrefix)
	if err != nil {
		t.Fatalf("fs.Sub() error = %v", err)
	}

	data, err := fs.ReadFile(subFS, "hello.txt")
	if err != nil {
		t.Fatalf("fs.ReadFile() error = %v", err)
	}
	if string(data) != "hello" {
		t.Fatalf("expected static file contents %q, got %q", "hello", string(data))
	}

	rootMount := registry.statics[1]
	if rootMount.stripPrefix != "." {
		t.Fatalf("expected root stripPrefix %q, got %q", ".", rootMount.stripPrefix)
	}
}

func TestPluginHTTPRegistryKeepsRegistrationsScopedPerPlugin(t *testing.T) {
	t.Parallel()

	alpha := newPluginHTTPRegistry("alpha-plugin")
	beta := newPluginHTTPRegistry("beta-plugin")

	alphaFS := fstest.MapFS{
		"alpha.txt": &fstest.MapFile{Data: []byte("alpha")},
	}
	betaFS := fstest.MapFS{
		"beta.txt": &fstest.MapFile{Data: []byte("beta")},
	}

	if err := alpha.API(func(router fiber.Router) {
		router.Get("/status", func(c *fiber.Ctx) error {
			return c.SendString("alpha")
		})
	}); err != nil {
		t.Fatalf("alpha API() error = %v", err)
	}
	if err := beta.API(func(router fiber.Router) {
		router.Get("/status", func(c *fiber.Ctx) error {
			return c.SendString("beta")
		})
	}); err != nil {
		t.Fatalf("beta API() error = %v", err)
	}

	if err := alpha.Static(alphaFS, ""); err != nil {
		t.Fatalf("alpha Static() error = %v", err)
	}
	if err := beta.Static(betaFS, ""); err != nil {
		t.Fatalf("beta Static() error = %v", err)
	}

	if alpha.routes[0].pluginID != "alpha-plugin" || alpha.statics[0].pluginID != "alpha-plugin" {
		t.Fatalf("expected alpha registrations to stay scoped to %q, got route=%q static=%q", "alpha-plugin", alpha.routes[0].pluginID, alpha.statics[0].pluginID)
	}
	if beta.routes[0].pluginID != "beta-plugin" || beta.statics[0].pluginID != "beta-plugin" {
		t.Fatalf("expected beta registrations to stay scoped to %q, got route=%q static=%q", "beta-plugin", beta.routes[0].pluginID, beta.statics[0].pluginID)
	}

	app := fiber.New()
	alpha.routes[0].register(app.Group("/api/plugins/" + alpha.routes[0].pluginID))
	beta.routes[0].register(app.Group("/api/plugins/" + beta.routes[0].pluginID))

	alphaReq := httptest.NewRequest(http.MethodGet, "/api/plugins/alpha-plugin/status", nil)
	alphaResp, err := app.Test(alphaReq)
	if err != nil {
		t.Fatalf("alpha app.Test() error = %v", err)
	}
	if alphaResp.StatusCode != http.StatusOK {
		t.Fatalf("expected alpha status %d, got %d", http.StatusOK, alphaResp.StatusCode)
	}

	betaReq := httptest.NewRequest(http.MethodGet, "/api/plugins/beta-plugin/status", nil)
	betaResp, err := app.Test(betaReq)
	if err != nil {
		t.Fatalf("beta app.Test() error = %v", err)
	}
	if betaResp.StatusCode != http.StatusOK {
		t.Fatalf("expected beta status %d, got %d", http.StatusOK, betaResp.StatusCode)
	}

	wrongReq := httptest.NewRequest(http.MethodGet, "/api/plugins/alpha-plugin/unknown", nil)
	wrongResp, err := app.Test(wrongReq)
	if err != nil {
		t.Fatalf("wrong path app.Test() error = %v", err)
	}
	if wrongResp.StatusCode != http.StatusNotFound {
		t.Fatalf("expected wrong path status %d, got %d", http.StatusNotFound, wrongResp.StatusCode)
	}
}

func TestPluginHTTPRegistryRejectsInvalidRegistrations(t *testing.T) {
	t.Parallel()

	registry := newPluginHTTPRegistry("")

	if err := registry.API(func(router fiber.Router) {}); !errors.Is(err, errHTTPRegistryPluginIDRequired) {
		t.Fatalf("expected empty plugin id error from API(), got %v", err)
	}
	if err := registry.Static(fstest.MapFS{}, ""); !errors.Is(err, errHTTPRegistryPluginIDRequired) {
		t.Fatalf("expected empty plugin id error from Static(), got %v", err)
	}

	registry = newPluginHTTPRegistry("example-plugin")

	if err := registry.API(nil); !errors.Is(err, errHTTPRegistryAPIFnRequired) {
		t.Fatalf("expected nil API fn error, got %v", err)
	}
	if err := registry.Static(nil, ""); !errors.Is(err, errHTTPRegistryStaticFSRequired) {
		t.Fatalf("expected nil static fs error, got %v", err)
	}
	if err := registry.Static(fstest.MapFS{}, "../static"); !errors.Is(err, errHTTPRegistryInvalidPrefix) {
		t.Fatalf("expected invalid static prefix error, got %v", err)
	}
}
