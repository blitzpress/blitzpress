package main

import (
	"bytes"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

func TestRunListOutputsPluginTable(t *testing.T) {
	repoRoot := createTestRepo(t)
	buildRoot := filepath.Join(repoRoot, "build", "plugins")

	createBuiltPlugin(t, buildRoot, "beta-plugin", `{"id":"beta-plugin","name":"BetaPlugin","version":"2.0.0"}`, false)
	createBuiltPlugin(t, buildRoot, "alpha-plugin", `{"id":"alpha-plugin","name":"AlphaPlugin","version":"1.0.0"}`, true)

	var out bytes.Buffer
	if err := runList(repoRoot, &out); err != nil {
		t.Fatalf("runList() error = %v", err)
	}

	lines := strings.Split(strings.TrimSpace(out.String()), "\n")
	if len(lines) != 3 {
		t.Fatalf("expected 3 output lines, got %d: %q", len(lines), out.String())
	}

	assertLineMatches(t, lines[0], `^ID\s+NAME\s+VERSION\s+STATUS$`)
	assertLineMatches(t, lines[1], `^alpha-plugin\s+AlphaPlugin\s+1\.0\.0\s+ready$`)
	assertLineMatches(t, lines[2], `^beta-plugin\s+BetaPlugin\s+2\.0\.0\s+missing-plugin\.so$`)
}

func TestRunExecutesListCommandViaCLI(t *testing.T) {
	repoRoot := createTestRepo(t)
	buildRoot := filepath.Join(repoRoot, "build", "plugins")
	createBuiltPlugin(t, buildRoot, "alpha-plugin", `{"id":"alpha-plugin","name":"AlphaPlugin","version":"1.0.0"}`, true)

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := run([]string{"list"}, repoRoot, &stdout, &stderr, func(dir, name string, args ...string) error {
		t.Fatal("command runner should not be called for list")
		return nil
	})
	if exitCode != 0 {
		t.Fatalf("expected exit code 0, got %d with stderr %q", exitCode, stderr.String())
	}

	if stderr.Len() != 0 {
		t.Fatalf("expected no stderr output, got %q", stderr.String())
	}

	assertLineMatches(t, stdout.String(), `(?m)^alpha-plugin\s+AlphaPlugin\s+1\.0\.0\s+ready$`)
}

func TestRunWithoutArgsPrintsUsage(t *testing.T) {
	repoRoot := createTestRepo(t)

	var stdout bytes.Buffer
	var stderr bytes.Buffer
	exitCode := run(nil, repoRoot, &stdout, &stderr, func(dir, name string, args ...string) error {
		t.Fatal("command runner should not be called without args")
		return nil
	})
	if exitCode != 1 {
		t.Fatalf("expected exit code 1, got %d", exitCode)
	}

	if stdout.Len() != 0 {
		t.Fatalf("expected no stdout output, got %q", stdout.String())
	}

	if !strings.Contains(stderr.String(), usageText) {
		t.Fatalf("expected usage text on stderr, got %q", stderr.String())
	}
}

func TestRunBuildReturnsValidationErrorForMissingDirectory(t *testing.T) {
	repoRoot := createTestRepo(t)
	called := false

	err := runBuild(repoRoot, repoRoot, []string{"missing-plugin"}, func(dir, name string, args ...string) error {
		called = true
		return nil
	})
	if err == nil {
		t.Fatal("expected build validation error for missing directory")
	}

	if !strings.Contains(err.Error(), "plugin directory not found: missing-plugin") {
		t.Fatalf("expected missing directory error, got %v", err)
	}

	if called {
		t.Fatal("expected build runner not to be called")
	}
}

func TestRunBuildReturnsValidationErrorForMissingManifest(t *testing.T) {
	repoRoot := createTestRepo(t)
	pluginDir := filepath.Join(repoRoot, "example-plugin")
	if err := os.MkdirAll(pluginDir, 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}

	called := false
	err := runBuild(repoRoot, repoRoot, []string{"example-plugin"}, func(dir, name string, args ...string) error {
		called = true
		return nil
	})
	if err == nil {
		t.Fatal("expected build validation error for missing manifest")
	}

	if !strings.Contains(err.Error(), "plugin manifest not found:") {
		t.Fatalf("expected missing manifest error, got %v", err)
	}

	if called {
		t.Fatal("expected build runner not to be called")
	}
}

func TestRunBuildInvokesBuildScriptForValidPlugin(t *testing.T) {
	repoRoot := createTestRepo(t)
	pluginDir := filepath.Join(repoRoot, "example-plugin")
	if err := os.MkdirAll(pluginDir, 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}

	writeFile(t, filepath.Join(pluginDir, "plugin.json"), `{"id":"example-plugin","name":"Example Plugin","version":"0.1.0"}`)

	var gotDir string
	var gotName string
	var gotArgs []string
	err := runBuild(repoRoot, repoRoot, []string{"example-plugin"}, func(dir, name string, args ...string) error {
		gotDir = dir
		gotName = name
		gotArgs = append([]string(nil), args...)
		return nil
	})
	if err != nil {
		t.Fatalf("runBuild() error = %v", err)
	}

	expectedScriptPath := filepath.Join(repoRoot, "scripts", "build-plugin.sh")
	if gotDir != repoRoot {
		t.Fatalf("expected runner dir %q, got %q", repoRoot, gotDir)
	}

	if gotName != expectedScriptPath {
		t.Fatalf("expected runner command %q, got %q", expectedScriptPath, gotName)
	}

	if len(gotArgs) != 1 || gotArgs[0] != pluginDir {
		t.Fatalf("expected runner args [%q], got %v", pluginDir, gotArgs)
	}
}

func createTestRepo(t *testing.T) string {
	t.Helper()

	repoRoot := t.TempDir()
	writeFile(t, filepath.Join(repoRoot, "go.work"), "go 1.24\n")
	writeFile(t, filepath.Join(repoRoot, "scripts", "build-plugin.sh"), "#!/usr/bin/env bash\n")

	scriptPath := filepath.Join(repoRoot, "scripts", "build-plugin.sh")
	if err := os.Chmod(scriptPath, 0o755); err != nil {
		t.Fatalf("Chmod() error = %v", err)
	}

	return repoRoot
}

func createBuiltPlugin(t *testing.T, buildRoot, pluginID, manifest string, includeBinary bool) {
	t.Helper()

	pluginDir := filepath.Join(buildRoot, pluginID)
	if err := os.MkdirAll(pluginDir, 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}

	writeFile(t, filepath.Join(pluginDir, "plugin.json"), manifest)
	if includeBinary {
		writeFile(t, filepath.Join(pluginDir, "plugin.so"), "binary")
	}
}

func writeFile(t *testing.T, path, contents string) {
	t.Helper()

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatalf("MkdirAll(%q) error = %v", filepath.Dir(path), err)
	}

	if err := os.WriteFile(path, []byte(contents), 0o644); err != nil {
		t.Fatalf("WriteFile(%q) error = %v", path, err)
	}
}

func assertLineMatches(t *testing.T, line, pattern string) {
	t.Helper()

	matched, err := regexp.MatchString(pattern, line)
	if err != nil {
		t.Fatalf("MatchString(%q) error = %v", pattern, err)
	}

	if !matched {
		t.Fatalf("expected line %q to match %q", line, pattern)
	}
}
