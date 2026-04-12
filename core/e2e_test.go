package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

func TestBuildAllAndRunCoreBinaryWithExamplePlugin(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping build-all end-to-end test in short mode")
	}

	repoRoot := coreRepoRoot(t)
	runCoreE2ECommand(t, repoRoot, filepath.Join(repoRoot, "scripts", "build-all.sh"))

	serverAddress := reserveLocalAddress(t)
	baseURL := "http://" + serverAddress
	dbPath := filepath.Join(t.TempDir(), "blitzpress-e2e.sqlite")
	binaryPath := filepath.Join(repoRoot, "build", "blitzpress")

	var logs bytes.Buffer
	cmd := exec.Command(binaryPath)
	cmd.Dir = repoRoot
	cmd.Stdout = &logs
	cmd.Stderr = &logs
	cmd.Env = append(
		os.Environ(),
		"BLITZPRESS_PORT="+serverAddress,
		"BLITZPRESS_DB_DRIVER=sqlite",
		"BLITZPRESS_DB_DSN="+dbPath,
		"BLITZPRESS_PLUGINS_DIR="+filepath.Join(repoRoot, "build", "plugins"),
		"BLITZPRESS_LOG_LEVEL=error",
	)

	if err := cmd.Start(); err != nil {
		t.Fatalf("starting built core binary failed: %v", err)
	}

	t.Cleanup(func() {
		stopCoreE2EProcess(t, cmd, &logs)
	})

	waitForCoreE2EReady(t, baseURL+"/api/core/plugins", &logs)

	var pluginList struct {
		Plugins []struct {
			ID            string `json:"id"`
			Name          string `json:"name"`
			Version       string `json:"version"`
			HasFrontend   bool   `json:"has_frontend"`
			FrontendEntry string `json:"frontend_entry"`
			FrontendStyle string `json:"frontend_style"`
		} `json:"plugins"`
	}
	coreE2EGetJSON(t, baseURL+"/api/core/plugins", &pluginList)

	if len(pluginList.Plugins) != 1 {
		t.Fatalf("expected 1 loaded plugin, got %#v", pluginList.Plugins)
	}

	plugin := pluginList.Plugins[0]
	if plugin.ID != "example-plugin" || plugin.Name != "Example Plugin" || plugin.Version != "0.1.0" {
		t.Fatalf("unexpected plugin list entry: %#v", plugin)
	}
	if !plugin.HasFrontend {
		t.Fatalf("expected example plugin frontend to be enabled, got %#v", plugin)
	}
	if plugin.FrontendEntry != "/plugins/example-plugin/assets/index.js" {
		t.Fatalf("expected normalized frontend entry path, got %q", plugin.FrontendEntry)
	}
	if plugin.FrontendStyle != "/plugins/example-plugin/assets/index.css" {
		t.Fatalf("expected normalized frontend style path, got %q", plugin.FrontendStyle)
	}

	indexHTML := coreE2EGetText(t, baseURL+"/")
	if !strings.Contains(indexHTML, `<script type="importmap">`) {
		t.Fatalf("expected import map injection in root HTML, got %q", indexHTML)
	}
	if !strings.Contains(indexHTML, "/api/core/modules/plugin-sdk.js") {
		t.Fatalf("expected plugin-sdk module in import map, got %q", indexHTML)
	}

	moduleJS := coreE2EGetText(t, baseURL+"/api/core/modules/plugin-sdk.js")
	if !strings.Contains(moduleJS, "registerPlugin") {
		t.Fatalf("expected plugin-sdk module to expose registerPlugin, got %q", moduleJS)
	}

	frontendJS := coreE2EGetText(t, baseURL+plugin.FrontendEntry)
	if !strings.Contains(frontendJS, "example-plugin.home") {
		t.Fatalf("expected built plugin frontend bundle to contain example page registration, got %q", frontendJS)
	}

	frontendCSS := coreE2EGetText(t, baseURL+plugin.FrontendStyle)
	if !strings.Contains(frontendCSS, ".example-plugin-home") {
		t.Fatalf("expected built plugin stylesheet to be served, got %q", frontendCSS)
	}

	staticAsset := coreE2EGetText(t, baseURL+"/plugins/example-plugin/assets/hello.txt")
	if !strings.Contains(staticAsset, "example plugin static assets") {
		t.Fatalf("expected embedded plugin static asset to be served, got %q", staticAsset)
	}

	var status struct {
		Enabled      bool   `json:"enabled"`
		Greeting     string `json:"greeting"`
		Mode         string `json:"mode"`
		ItemsPerPage int    `json:"items_per_page"`
		StaticAsset  string `json:"static_asset"`
	}
	coreE2EGetJSON(t, baseURL+"/api/plugins/example-plugin/status", &status)
	if status.Greeting != "Hello from Example Plugin" || status.Mode != "demo" || status.ItemsPerPage != 5 || !status.Enabled {
		t.Fatalf("unexpected default plugin status payload: %#v", status)
	}
	if status.StaticAsset != "/plugins/example-plugin/assets/hello.txt" {
		t.Fatalf("expected plugin status static asset path, got %q", status.StaticAsset)
	}

	var hooksStatus struct {
		CoreReadyReceived bool `json:"core_ready_received"`
		MenuItems         []struct {
			ID    string `json:"id"`
			Label string `json:"label"`
			Icon  string `json:"icon"`
			Path  string `json:"path"`
		} `json:"menu_items"`
	}
	coreE2EGetJSON(t, baseURL+"/api/plugins/example-plugin/hooks-status", &hooksStatus)
	if !hooksStatus.CoreReadyReceived {
		t.Fatalf("expected core.ready hook to have fired in example plugin")
	}
	if len(hooksStatus.MenuItems) != 1 {
		t.Fatalf("expected 1 menu item from admin.menu.items filter, got %d", len(hooksStatus.MenuItems))
	}
	if hooksStatus.MenuItems[0].ID != "example-plugin.home" {
		t.Fatalf("expected menu item id %q, got %q", "example-plugin.home", hooksStatus.MenuItems[0].ID)
	}
	if hooksStatus.MenuItems[0].Label != "Example Plugin" {
		t.Fatalf("expected menu item label %q, got %q", "Example Plugin", hooksStatus.MenuItems[0].Label)
	}
	if hooksStatus.MenuItems[0].Path != "/plugins/example-plugin" {
		t.Fatalf("expected menu item path %q, got %q", "/plugins/example-plugin", hooksStatus.MenuItems[0].Path)
	}

	var publishResult struct {
		Published bool `json:"published"`
	}
	coreE2EPostJSON(t, baseURL+"/api/plugins/example-plugin/events/publish",
		`{"name":"example.ping","data":{"source":"e2e","seq":1}}`, &publishResult)
	if !publishResult.Published {
		t.Fatalf("expected event publish to succeed")
	}

	time.Sleep(200 * time.Millisecond)

	var eventsResult struct {
		Events []struct {
			Name    string         `json:"name"`
			Payload map[string]any `json:"payload"`
		} `json:"events"`
	}
	coreE2EGetJSON(t, baseURL+"/api/plugins/example-plugin/events/received", &eventsResult)
	if len(eventsResult.Events) < 1 {
		t.Fatalf("expected at least 1 received event, got %d", len(eventsResult.Events))
	}
	lastEvent := eventsResult.Events[len(eventsResult.Events)-1]
	if lastEvent.Name != "example.ping" {
		t.Fatalf("expected received event name %q, got %q", "example.ping", lastEvent.Name)
	}
	if lastEvent.Payload["source"] != "e2e" {
		t.Fatalf("expected received event payload source %q, got %v", "e2e", lastEvent.Payload["source"])
	}

	var settings struct {
		Schema *struct {
			Sections []struct {
				ID string `json:"id"`
			} `json:"sections"`
		} `json:"schema"`
		Values map[string]any `json:"values"`
	}
	coreE2EGetJSON(t, baseURL+"/api/core/plugins/example-plugin/settings", &settings)
	if settings.Schema == nil || len(settings.Schema.Sections) != 1 || settings.Schema.Sections[0].ID != "general" {
		t.Fatalf("expected example plugin settings schema, got %#v", settings.Schema)
	}
	if len(settings.Values) != 0 {
		t.Fatalf("expected no persisted values before update, got %#v", settings.Values)
	}

	updatePayload := `{"values":{"greeting":"Updated from e2e","enabled":false,"items_per_page":12,"mode":"verbose"}}`
	coreE2EPutJSON(t, baseURL+"/api/core/plugins/example-plugin/settings", updatePayload, &settings)
	if settings.Values["greeting"] != "Updated from e2e" {
		t.Fatalf("expected saved greeting in response, got %#v", settings.Values)
	}
	if settings.Values["enabled"] != false {
		t.Fatalf("expected saved enabled flag in response, got %#v", settings.Values)
	}

	coreE2EGetJSON(t, baseURL+"/api/plugins/example-plugin/status", &status)
	if status.Greeting != "Updated from e2e" || status.Mode != "verbose" || status.ItemsPerPage != 12 || status.Enabled {
		t.Fatalf("expected updated plugin status payload, got %#v", status)
	}
}

func coreRepoRoot(t *testing.T) string {
	t.Helper()

	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller(0) failed")
	}

	return filepath.Clean(filepath.Join(filepath.Dir(filename), ".."))
}

func runCoreE2ECommand(t *testing.T, repoRoot, commandPath string) {
	t.Helper()

	cmd := exec.Command(commandPath)
	cmd.Dir = repoRoot
	output, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("running %s failed: %v\n%s", commandPath, err, output)
	}
}

func reserveLocalAddress(t *testing.T) string {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("reserving local test port failed: %v", err)
	}
	defer listener.Close()

	return listener.Addr().String()
}

func waitForCoreE2EReady(t *testing.T, url string, logs *bytes.Buffer) {
	t.Helper()

	client := &http.Client{Timeout: 2 * time.Second}
	deadline := time.Now().Add(20 * time.Second)
	for time.Now().Before(deadline) {
		response, err := client.Get(url)
		if err == nil {
			_ = response.Body.Close()
			if response.StatusCode == http.StatusOK {
				return
			}
		}

		time.Sleep(200 * time.Millisecond)
	}

	t.Fatalf("timed out waiting for built core binary to become ready\n%s", logs.String())
}

func stopCoreE2EProcess(t *testing.T, cmd *exec.Cmd, logs *bytes.Buffer) {
	t.Helper()

	if cmd.Process == nil {
		return
	}

	done := make(chan error, 1)
	go func() {
		done <- cmd.Wait()
	}()

	if err := cmd.Process.Signal(os.Interrupt); err != nil && !strings.Contains(err.Error(), "process already finished") {
		t.Logf("interrupting built core binary failed: %v", err)
	}

	select {
	case err := <-done:
		if err != nil {
			t.Logf("built core binary exited with error: %v\n%s", err, logs.String())
		}
	case <-time.After(10 * time.Second):
		_ = cmd.Process.Kill()
		err := <-done
		t.Logf("built core binary was force-killed after timeout: %v\n%s", err, logs.String())
	}
}

func coreE2EGetJSON(t *testing.T, url string, target any) {
	t.Helper()

	response := coreE2ERequest(t, http.MethodGet, url, "")
	defer response.Body.Close()

	if err := json.NewDecoder(response.Body).Decode(target); err != nil {
		t.Fatalf("decoding %s response failed: %v", url, err)
	}
}

func coreE2EPostJSON(t *testing.T, url, body string, target any) {
	t.Helper()

	response := coreE2ERequest(t, http.MethodPost, url, body)
	defer response.Body.Close()

	if err := json.NewDecoder(response.Body).Decode(target); err != nil {
		t.Fatalf("decoding %s response failed: %v", url, err)
	}
}

func coreE2EPutJSON(t *testing.T, url, body string, target any) {
	t.Helper()

	response := coreE2ERequest(t, http.MethodPut, url, body)
	defer response.Body.Close()

	if err := json.NewDecoder(response.Body).Decode(target); err != nil {
		t.Fatalf("decoding %s response failed: %v", url, err)
	}
}

func coreE2EGetText(t *testing.T, url string) string {
	t.Helper()

	response := coreE2ERequest(t, http.MethodGet, url, "")
	defer response.Body.Close()

	body, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("reading %s response failed: %v", url, err)
	}

	return string(body)
}

func coreE2ERequest(t *testing.T, method, url, body string) *http.Response {
	t.Helper()

	var reader io.Reader
	if body != "" {
		reader = strings.NewReader(body)
	}

	request, err := http.NewRequest(method, url, reader)
	if err != nil {
		t.Fatalf("creating %s request for %s failed: %v", method, url, err)
	}
	if body != "" {
		request.Header.Set("Content-Type", "application/json")
	}

	response, err := (&http.Client{Timeout: 5 * time.Second}).Do(request)
	if err != nil {
		t.Fatalf("sending %s request to %s failed: %v", method, url, err)
	}
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		responseBody, _ := io.ReadAll(response.Body)
		_ = response.Body.Close()
		t.Fatalf("%s %s returned status %d: %s", method, url, response.StatusCode, responseBody)
	}

	return response
}
