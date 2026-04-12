package plugins

import (
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

func TestLoadPluginSuccess(t *testing.T) {
	pluginDir := buildTestPlugin(t, testPluginFixture{
		source: validPluginSource("example-plugin", "Example Plugin", "1.2.3"),
		manifest: PluginManifestFile{
			SchemaVersion: 1,
			ID:            "example-plugin",
			Name:          "Example Plugin",
			Version:       "1.2.3",
			SDKVersion:    pluginsdk.SDKVersion,
		},
	})

	loaded, err := LoadPlugin(pluginDir.discovered)
	if err != nil {
		t.Fatalf("LoadPlugin() error = %v", err)
	}

	if loaded.Status != "loaded" {
		t.Fatalf("expected status loaded, got %q", loaded.Status)
	}

	if loaded.Instance == nil {
		t.Fatal("expected plugin instance to be set")
	}

	if loaded.Manifest.ID != pluginDir.discovered.ManifestFile.ID {
		t.Fatalf("expected manifest id %q, got %q", pluginDir.discovered.ManifestFile.ID, loaded.Manifest.ID)
	}

	if len(loaded.Errors) != 0 {
		t.Fatalf("expected no loader errors, got %v", loaded.Errors)
	}
}

func TestLoadPluginReturnsErrorWhenSymbolMissing(t *testing.T) {
	fixture := buildTestPlugin(t, testPluginFixture{
		source: missingSymbolPluginSource(),
		manifest: PluginManifestFile{
			SchemaVersion: 1,
			ID:            "example-plugin",
			Name:          "Example Plugin",
			Version:       "1.2.3",
			SDKVersion:    pluginsdk.SDKVersion,
		},
	})

	loaded, err := LoadPlugin(fixture.discovered)
	if err == nil {
		t.Fatal("expected missing symbol error")
	}

	if !errors.Is(err, pluginsdk.ErrSymbolNotFound) {
		t.Fatalf("expected ErrSymbolNotFound, got %v", err)
	}

	if loaded == nil || loaded.Status != "error" {
		t.Fatalf("expected error loaded plugin, got %#v", loaded)
	}
}

func TestLoadPluginReturnsErrorWhenSymbolTypeIsInvalid(t *testing.T) {
	fixture := buildTestPlugin(t, testPluginFixture{
		source: invalidSymbolPluginSource(),
		manifest: PluginManifestFile{
			SchemaVersion: 1,
			ID:            "example-plugin",
			Name:          "Example Plugin",
			Version:       "1.2.3",
			SDKVersion:    pluginsdk.SDKVersion,
		},
	})

	loaded, err := LoadPlugin(fixture.discovered)
	if err == nil {
		t.Fatal("expected invalid symbol error")
	}

	if !errors.Is(err, pluginsdk.ErrSymbolNotFound) {
		t.Fatalf("expected ErrSymbolNotFound, got %v", err)
	}

	if loaded == nil || loaded.Status != "error" {
		t.Fatalf("expected error loaded plugin, got %#v", loaded)
	}
}

func TestLoadPluginReturnsErrorOnManifestMismatch(t *testing.T) {
	fixture := buildTestPlugin(t, testPluginFixture{
		source: validPluginSource("example-plugin", "Actual Plugin", "1.2.3"),
		manifest: PluginManifestFile{
			SchemaVersion: 1,
			ID:            "example-plugin",
			Name:          "Expected Plugin",
			Version:       "1.2.3",
			SDKVersion:    pluginsdk.SDKVersion,
		},
	})

	loaded, err := LoadPlugin(fixture.discovered)
	if err == nil {
		t.Fatal("expected manifest mismatch error")
	}

	if !errors.Is(err, pluginsdk.ErrManifestMismatch) {
		t.Fatalf("expected ErrManifestMismatch, got %v", err)
	}

	if loaded == nil || loaded.Status != "error" {
		t.Fatalf("expected error loaded plugin, got %#v", loaded)
	}
}

func TestLoadPluginReturnsErrorOnIncompatibleSDK(t *testing.T) {
	fixture := buildTestPlugin(t, testPluginFixture{
		source: validPluginSource("example-plugin", "Example Plugin", "1.2.3"),
		manifest: PluginManifestFile{
			SchemaVersion: 1,
			ID:            "example-plugin",
			Name:          "Example Plugin",
			Version:       "1.2.3",
			SDKVersion:    "9.9.9",
		},
	})

	loaded, err := LoadPlugin(fixture.discovered)
	if err == nil {
		t.Fatal("expected incompatible sdk error")
	}

	if !errors.Is(err, pluginsdk.ErrIncompatibleSDK) {
		t.Fatalf("expected ErrIncompatibleSDK, got %v", err)
	}

	if loaded == nil || loaded.Status != "error" {
		t.Fatalf("expected error loaded plugin, got %#v", loaded)
	}
}

type testPluginFixture struct {
	source   string
	manifest PluginManifestFile
}

type builtPluginFixture struct {
	discovered DiscoveredPlugin
}

func buildTestPlugin(t *testing.T, fixture testPluginFixture) builtPluginFixture {
	t.Helper()

	pluginDir := t.TempDir()
	writeFile(t, filepath.Join(pluginDir, "main.go"), fixture.source)
	writeFile(t, filepath.Join(pluginDir, "go.mod"), fmt.Sprintf(`module %s

go 1.24

require github.com/BlitzPress/BlitzPress/plugin-sdk v0.0.0

replace github.com/BlitzPress/BlitzPress/plugin-sdk => %s
`, testModuleName(t, pluginDir), pluginSDKDir(t)))

	soPath := filepath.Join(pluginDir, PluginSOFilename())
	cmd := exec.Command(goBinary(t), "build", "-mod=mod", "-buildmode=plugin", "-o", soPath, ".")
	cmd.Dir = pluginDir
	cmd.Env = append(os.Environ(), "CGO_ENABLED=1")
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("building test plugin failed: %v\n%s", err, output)
	}

	return builtPluginFixture{
		discovered: DiscoveredPlugin{
			ManifestFile: fixture.manifest,
			Dir:          pluginDir,
			SOPath:       soPath,
		},
	}
}

func pluginSDKDir(t *testing.T) string {
	t.Helper()

	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller(0) failed")
	}

	return filepath.Clean(filepath.Join(filepath.Dir(filename), "..", "..", "..", "plugin-sdk"))
}

func testModuleName(t *testing.T, pluginDir string) string {
	t.Helper()

	replacer := strings.NewReplacer("/", "-", "\\", "-", " ", "-", "(", "-", ")", "-", ":", "-", ".", "-")
	return "example.com/" + replacer.Replace(t.Name()) + "/" + filepath.Base(pluginDir)
}

func goBinary(t *testing.T) string {
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

func validPluginSource(id, name, version string) string {
	return fmt.Sprintf(`package main

import pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"

type examplePlugin struct{}

func (examplePlugin) Manifest() pluginsdk.Manifest {
	return pluginsdk.Manifest{
		ID: %q,
		Name: %q,
		Version: %q,
	}
}

func (examplePlugin) Register(r *pluginsdk.Registrar) error {
	return nil
}

var Plugin pluginsdk.Plugin = examplePlugin{}
`, id, name, version)
}

func missingSymbolPluginSource() string {
	return `package main

var NotPlugin = "missing"
`
}

func invalidSymbolPluginSource() string {
	return `package main

var Plugin = "invalid"
`
}
