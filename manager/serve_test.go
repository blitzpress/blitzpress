package main

import (
	"bytes"
	"context"
	"io"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"testing"
	"time"
)

func TestRunServeLoopRestartsAfterCrash(t *testing.T) {
	repoRoot := t.TempDir()
	countFile := filepath.Join(repoRoot, "crash-count.txt")
	t.Setenv("TEST_COUNT_FILE", countFile)
	corePath := createServeTestCoreScript(t, repoRoot, `#!/bin/sh
count_file="$TEST_COUNT_FILE"
count=$(cat "$count_file" 2>/dev/null || printf '0')
count=$((count + 1))
printf '%s' "$count" > "$count_file"
exit 1
`)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var stderr bytes.Buffer
	errCh := make(chan error, 1)
	go func() {
		errCh <- runServeLoop(ctx, make(chan os.Signal), serveConfig{
			RepoRoot:            repoRoot,
			CorePath:            corePath,
			PluginsDir:          filepath.Join(repoRoot, "build", "plugins"),
			WatchPlugins:        false,
			RestartDelay:        20 * time.Millisecond,
			MaxRestartDelay:     40 * time.Millisecond,
			StopTimeout:         250 * time.Millisecond,
			StableRestartWindow: time.Second,
		}, io.Discard, &stderr)
	}()

	waitForServeCountAtLeast(t, countFile, 2, 2*time.Second)
	cancel()
	waitForServeManagerExit(t, errCh)
}

func TestRunServeLoopRestartsOnManagedSignal(t *testing.T) {
	repoRoot := t.TempDir()
	countFile := filepath.Join(repoRoot, "signal-count.txt")
	t.Setenv("TEST_COUNT_FILE", countFile)
	corePath := createServeTestCoreScript(t, repoRoot, `#!/bin/sh
count_file="$TEST_COUNT_FILE"
count=$(cat "$count_file" 2>/dev/null || printf '0')
count=$((count + 1))
printf '%s' "$count" > "$count_file"
trap 'exit 0' TERM INT
while :
do
  sleep 0.1
done
`)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	restartSignals := make(chan os.Signal, 1)
	errCh := make(chan error, 1)
	go func() {
		errCh <- runServeLoop(ctx, restartSignals, serveConfig{
			RepoRoot:            repoRoot,
			CorePath:            corePath,
			PluginsDir:          filepath.Join(repoRoot, "build", "plugins"),
			WatchPlugins:        false,
			StopTimeout:         time.Second,
			StableRestartWindow: time.Second,
		}, io.Discard, io.Discard)
	}()

	waitForServeCountAtLeast(t, countFile, 1, 2*time.Second)
	restartSignals <- syscall.SIGUSR1
	waitForServeCountAtLeast(t, countFile, 2, 2*time.Second)

	cancel()
	waitForServeManagerExit(t, errCh)
}

func TestRunServeLoopRestartsAfterPluginArtifactChange(t *testing.T) {
	repoRoot := t.TempDir()
	pluginsDir := filepath.Join(repoRoot, "build", "plugins", "example-plugin")
	pluginBinaryPath := filepath.Join(pluginsDir, "plugin.so")
	if err := os.MkdirAll(pluginsDir, 0o755); err != nil {
		t.Fatalf("MkdirAll(%q) error = %v", pluginsDir, err)
	}
	if err := os.WriteFile(pluginBinaryPath, []byte("v1"), 0o644); err != nil {
		t.Fatalf("WriteFile(%q) error = %v", pluginBinaryPath, err)
	}

	countFile := filepath.Join(repoRoot, "watch-count.txt")
	t.Setenv("TEST_COUNT_FILE", countFile)
	corePath := createServeTestCoreScript(t, repoRoot, `#!/bin/sh
count_file="$TEST_COUNT_FILE"
count=$(cat "$count_file" 2>/dev/null || printf '0')
count=$((count + 1))
printf '%s' "$count" > "$count_file"
trap 'exit 0' TERM INT
while :
do
  sleep 0.1
done
`)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	errCh := make(chan error, 1)
	go func() {
		errCh <- runServeLoop(ctx, make(chan os.Signal), serveConfig{
			RepoRoot:            repoRoot,
			CorePath:            corePath,
			PluginsDir:          filepath.Join(repoRoot, "build", "plugins"),
			WatchPlugins:        true,
			WatchInterval:       20 * time.Millisecond,
			WatchDebounce:       60 * time.Millisecond,
			StopTimeout:         time.Second,
			StableRestartWindow: time.Second,
		}, io.Discard, io.Discard)
	}()

	waitForServeCountAtLeast(t, countFile, 1, 2*time.Second)
	time.Sleep(80 * time.Millisecond)

	if err := os.WriteFile(pluginBinaryPath, []byte("updated-plugin-binary"), 0o644); err != nil {
		t.Fatalf("WriteFile(%q) error = %v", pluginBinaryPath, err)
	}

	waitForServeCountAtLeast(t, countFile, 2, 2*time.Second)
	cancel()
	waitForServeManagerExit(t, errCh)
}

func createServeTestCoreScript(t *testing.T, repoRoot, contents string) string {
	t.Helper()

	scriptPath := filepath.Join(repoRoot, "core-under-test.sh")
	if err := os.WriteFile(scriptPath, []byte(contents), 0o755); err != nil {
		t.Fatalf("WriteFile(%q) error = %v", scriptPath, err)
	}

	return scriptPath
}

func waitForServeCountAtLeast(t *testing.T, path string, minimum int, timeout time.Duration) int {
	t.Helper()

	deadline := time.Now().Add(timeout)
	for time.Now().Before(deadline) {
		contents, err := os.ReadFile(path)
		if err == nil {
			count, err := strconv.Atoi(strings.TrimSpace(string(contents)))
			if err == nil && count >= minimum {
				return count
			}
		}

		time.Sleep(20 * time.Millisecond)
	}

	contents, _ := os.ReadFile(path)
	t.Fatalf("timed out waiting for count >= %d in %s, last contents=%q", minimum, path, strings.TrimSpace(string(contents)))
	return 0
}

func waitForServeManagerExit(t *testing.T, errCh <-chan error) {
	t.Helper()

	select {
	case err := <-errCh:
		if err != nil {
			t.Fatalf("runServeLoop() error = %v", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("timed out waiting for runServeLoop() to exit")
	}
}
