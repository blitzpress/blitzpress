package plugins

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestDiscoverReturnsValidPlugins(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	pluginDir := writePlugin(t, pluginsDir, "example-plugin", validManifestJSON("example-plugin", "1.2.3", "0.1.0", 1, false, "", ""), true, true)

	discovered, errs := Discover(pluginsDir)

	if len(errs) != 0 {
		t.Fatalf("expected no discovery errors, got %v", errs)
	}

	if len(discovered) != 1 {
		t.Fatalf("expected 1 discovered plugin, got %d", len(discovered))
	}

	plugin := discovered[0]
	if plugin.ManifestFile.ID != "example-plugin" {
		t.Fatalf("expected manifest id example-plugin, got %q", plugin.ManifestFile.ID)
	}

	if plugin.Dir != pluginDir {
		t.Fatalf("expected plugin dir %q, got %q", pluginDir, plugin.Dir)
	}

	wantSOPath := filepath.Join(pluginDir, PluginSOFilename())
	if plugin.SOPath != wantSOPath {
		t.Fatalf("expected .so path %q, got %q", wantSOPath, plugin.SOPath)
	}
}

func TestDiscoverSkipsPluginsWithMissingOrInvalidManifest(t *testing.T) {
	t.Parallel()

	t.Run("missing manifest", func(t *testing.T) {
		t.Parallel()

		pluginsDir := t.TempDir()
		writePlugin(t, pluginsDir, "missing-manifest", "", false, true)

		discovered, errs := Discover(pluginsDir)

		if len(discovered) != 0 {
			t.Fatalf("expected no discovered plugins, got %d", len(discovered))
		}

		if len(errs) != 1 {
			t.Fatalf("expected 1 error, got %d", len(errs))
		}

		if !strings.Contains(errs[0].Error(), "plugin.json") {
			t.Fatalf("expected error to mention plugin.json, got %q", errs[0].Error())
		}
	})

	t.Run("invalid manifest json", func(t *testing.T) {
		t.Parallel()

		pluginsDir := t.TempDir()
		writePlugin(t, pluginsDir, "invalid-json", "{", true, true)

		discovered, errs := Discover(pluginsDir)

		if len(discovered) != 0 {
			t.Fatalf("expected no discovered plugins, got %d", len(discovered))
		}

		if len(errs) != 1 {
			t.Fatalf("expected 1 error, got %d", len(errs))
		}

		if !strings.Contains(errs[0].Error(), "decode plugin.json") {
			t.Fatalf("expected decode error, got %q", errs[0].Error())
		}
	})
}

func TestDiscoverRejectsInvalidSchemaVersion(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	writePlugin(t, pluginsDir, "example-plugin", validManifestJSON("example-plugin", "1.2.3", "0.1.0", 2, false, "", ""), true, true)

	discovered, errs := Discover(pluginsDir)

	if len(discovered) != 0 {
		t.Fatalf("expected no discovered plugins, got %d", len(discovered))
	}

	assertSingleErrorContains(t, errs, "schema_version must be 1")
}

func TestDiscoverRejectsNonKebabCaseIDs(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	writePlugin(t, pluginsDir, "ExamplePlugin", validManifestJSON("ExamplePlugin", "1.2.3", "0.1.0", 1, false, "", ""), true, true)

	discovered, errs := Discover(pluginsDir)

	if len(discovered) != 0 {
		t.Fatalf("expected no discovered plugins, got %d", len(discovered))
	}

	assertSingleErrorContains(t, errs, "kebab-case")
}

func TestDiscoverRejectsMissingRequiredManifestFields(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name          string
		manifest      string
		wantSubstring string
	}{
		{
			name: "name",
			manifest: `{
  "schema_version": 1,
  "id": "example-plugin",
  "name": "",
  "version": "1.2.3",
  "sdk_version": "0.1.0",
  "has_frontend": false,
  "frontend_entry": ""
}`,
			wantSubstring: "name is required",
		},
		{
			name: "sdk version",
			manifest: `{
  "schema_version": 1,
  "id": "example-plugin",
  "name": "Example Plugin",
  "version": "1.2.3",
  "sdk_version": "",
  "has_frontend": false,
  "frontend_entry": ""
}`,
			wantSubstring: "sdk_version is required",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			pluginsDir := t.TempDir()
			writePlugin(t, pluginsDir, "example-plugin", tt.manifest, true, true)

			discovered, errs := Discover(pluginsDir)

			if len(discovered) != 0 {
				t.Fatalf("expected no discovered plugins, got %d", len(discovered))
			}

			assertSingleErrorContains(t, errs, tt.wantSubstring)
		})
	}
}

func TestDiscoverRejectsInvalidSemverValues(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name          string
		version       string
		sdkVersion    string
		wantSubstring string
	}{
		{
			name:          "version",
			version:       "1.2",
			sdkVersion:    "0.1.0",
			wantSubstring: "version must be valid semver",
		},
		{
			name:          "sdk version",
			version:       "1.2.3",
			sdkVersion:    "0.1",
			wantSubstring: "sdk_version must be valid semver",
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			pluginsDir := t.TempDir()
			writePlugin(t, pluginsDir, "example-plugin", validManifestJSON("example-plugin", tt.version, tt.sdkVersion, 1, false, "", ""), true, true)

			discovered, errs := Discover(pluginsDir)

			if len(discovered) != 0 {
				t.Fatalf("expected no discovered plugins, got %d", len(discovered))
			}

			assertSingleErrorContains(t, errs, tt.wantSubstring)
		})
	}
}

func TestDiscoverRejectsPluginsWithoutSharedObject(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	writePlugin(t, pluginsDir, "example-plugin", validManifestJSON("example-plugin", "1.2.3", "0.1.0", 1, false, "", ""), true, false)

	discovered, errs := Discover(pluginsDir)

	if len(discovered) != 0 {
		t.Fatalf("expected no discovered plugins, got %d", len(discovered))
	}

	assertSingleErrorContains(t, errs, PluginSOFilename())
}

func TestDiscoverRequiresFrontendEntryWhenFrontendIsEnabled(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	writePlugin(t, pluginsDir, "frontend-plugin", validManifestJSON("frontend-plugin", "1.2.3", "0.1.0", 1, true, "", "frontend/assets/index.css"), true, true)

	discovered, errs := Discover(pluginsDir)

	if len(discovered) != 0 {
		t.Fatalf("expected no discovered plugins, got %d", len(discovered))
	}

	assertSingleErrorContains(t, errs, "frontend_entry is required")
}

func TestDiscoverAcceptsFrontendPluginWithEntryAndStyle(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	writePlugin(t, pluginsDir, "frontend-plugin", validManifestJSON("frontend-plugin", "1.2.3", "0.1.0", 1, true, "frontend/assets/index.js", "frontend/assets/index.css"), true, true)

	discovered, errs := Discover(pluginsDir)

	if len(errs) != 0 {
		t.Fatalf("expected no discovery errors, got %v", errs)
	}

	if len(discovered) != 1 {
		t.Fatalf("expected 1 discovered plugin, got %d", len(discovered))
	}
}

func TestDiscoverAcceptsFrontendPluginWithoutStyle(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	writePlugin(t, pluginsDir, "frontend-plugin", `{
  "schema_version": 1,
  "id": "frontend-plugin",
  "name": "Example Plugin",
  "version": "1.2.3",
  "sdk_version": "0.1.0",
  "has_frontend": true,
  "frontend_entry": "frontend/assets/index.js"
}`, true, true)

	discovered, errs := Discover(pluginsDir)

	if len(errs) != 0 {
		t.Fatalf("expected no discovery errors, got %v", errs)
	}

	if len(discovered) != 1 {
		t.Fatalf("expected 1 discovered plugin, got %d", len(discovered))
	}

	if discovered[0].ManifestFile.FrontendStyle != "" {
		t.Fatalf("expected empty frontend style, got %q", discovered[0].ManifestFile.FrontendStyle)
	}
}

func TestDiscoverAcceptsFrontendPluginWithNullStyle(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	writePlugin(t, pluginsDir, "frontend-plugin", `{
  "schema_version": 1,
  "id": "frontend-plugin",
  "name": "Example Plugin",
  "version": "1.2.3",
  "sdk_version": "0.1.0",
  "has_frontend": true,
  "frontend_entry": "frontend/assets/index.js",
  "frontend_style": null
}`, true, true)

	discovered, errs := Discover(pluginsDir)

	if len(errs) != 0 {
		t.Fatalf("expected no discovery errors, got %v", errs)
	}

	if len(discovered) != 1 {
		t.Fatalf("expected 1 discovered plugin, got %d", len(discovered))
	}

	if discovered[0].ManifestFile.FrontendStyle != "" {
		t.Fatalf("expected empty frontend style, got %q", discovered[0].ManifestFile.FrontendStyle)
	}
}

func TestDiscoverContinuesAfterErrors(t *testing.T) {
	t.Parallel()

	pluginsDir := t.TempDir()
	validPluginDir := writePlugin(t, pluginsDir, "valid-plugin", validManifestJSON("valid-plugin", "1.2.3", "0.1.0", 1, false, "", ""), true, true)
	writePlugin(t, pluginsDir, "invalid-plugin", validManifestJSON("InvalidPlugin", "1.2.3", "0.1.0", 1, false, "", ""), true, true)

	discovered, errs := Discover(pluginsDir)

	if len(discovered) != 1 {
		t.Fatalf("expected 1 discovered plugin, got %d", len(discovered))
	}

	if discovered[0].Dir != validPluginDir {
		t.Fatalf("expected valid plugin dir %q, got %q", validPluginDir, discovered[0].Dir)
	}

	assertSingleErrorContains(t, errs, "kebab-case")
}

func writePlugin(t *testing.T, pluginsDir, dirName, manifest string, withManifest, withSO bool) string {
	t.Helper()

	pluginDir := filepath.Join(pluginsDir, dirName)
	if err := os.MkdirAll(pluginDir, 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}

	if withManifest {
		writeFile(t, filepath.Join(pluginDir, "plugin.json"), manifest)
	}

	if withSO {
		writeFile(t, filepath.Join(pluginDir, PluginSOFilename()), "")
	}

	return pluginDir
}

func writeFile(t *testing.T, path, contents string) {
	t.Helper()

	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatalf("WriteFile(%q) error = %v", path, err)
	}
}

func validManifestJSON(id, version, sdkVersion string, schemaVersion int, hasFrontend bool, frontendEntry, frontendStyle string) string {
	return fmt.Sprintf(`{
  "schema_version": %d,
  "id": %q,
  "name": "Example Plugin",
  "version": %q,
  "sdk_version": %q,
  "has_frontend": %t,
  "frontend_entry": %q,
  "frontend_style": %q
}`, schemaVersion, id, version, sdkVersion, hasFrontend, frontendEntry, frontendStyle)
}

func assertSingleErrorContains(t *testing.T, errs []error, want string) {
	t.Helper()

	if len(errs) != 1 {
		t.Fatalf("expected 1 error, got %d", len(errs))
	}

	if !strings.Contains(errs[0].Error(), want) {
		t.Fatalf("expected error %q to contain %q", errs[0].Error(), want)
	}
}
