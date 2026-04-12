package plugins

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
)

var (
	pluginIDPattern = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
	semverPattern   = regexp.MustCompile(`^\d+\.\d+\.\d+$`)
)

type PluginManifestFile struct {
	SchemaVersion int      `json:"schema_version"`
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	Version       string   `json:"version"`
	Description   string   `json:"description,omitempty"`
	Author        string   `json:"author,omitempty"`
	SDKVersion    string   `json:"sdk_version"`
	HasFrontend   bool     `json:"has_frontend"`
	FrontendEntry string   `json:"frontend_entry,omitempty"`
	FrontendStyle string   `json:"frontend_style,omitempty"`
	Capabilities  []string `json:"capabilities,omitempty"`
}

type DiscoveredPlugin struct {
	ManifestFile PluginManifestFile
	Dir          string
	SOPath       string
}

func Discover(pluginsDir string) ([]DiscoveredPlugin, []error) {
	absolutePluginsDir, err := filepath.Abs(pluginsDir)
	if err != nil {
		return nil, []error{fmt.Errorf("resolve plugins dir %q: %w", pluginsDir, err)}
	}

	entries, err := os.ReadDir(absolutePluginsDir)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, nil
		}

		return nil, []error{fmt.Errorf("read plugins dir %q: %w", absolutePluginsDir, err)}
	}

	discovered := make([]DiscoveredPlugin, 0, len(entries))
	var discoveryErrors []error

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}

		pluginDir := filepath.Join(absolutePluginsDir, entry.Name())
		plugin, err := discoverPlugin(pluginDir)
		if err != nil {
			discoveryErrors = append(discoveryErrors, fmt.Errorf("discover plugin %q: %w", pluginDir, err))
			continue
		}

		discovered = append(discovered, plugin)
	}

	return discovered, discoveryErrors
}

func discoverPlugin(pluginDir string) (DiscoveredPlugin, error) {
	manifestPath := filepath.Join(pluginDir, "plugin.json")
	manifestBytes, err := os.ReadFile(manifestPath)
	if err != nil {
		return DiscoveredPlugin{}, fmt.Errorf("read plugin.json: %w", err)
	}

	var manifest PluginManifestFile
	if err := json.Unmarshal(manifestBytes, &manifest); err != nil {
		return DiscoveredPlugin{}, fmt.Errorf("decode plugin.json: %w", err)
	}

	if err := validateManifest(manifest); err != nil {
		return DiscoveredPlugin{}, err
	}

	soPath := filepath.Join(pluginDir, PluginSOFilename())
	soInfo, err := os.Stat(soPath)
	if err != nil {
		return DiscoveredPlugin{}, fmt.Errorf("%s not found: %w", PluginSOFilename(), err)
	}
	if soInfo.IsDir() {
		return DiscoveredPlugin{}, fmt.Errorf("%s must be a file", PluginSOFilename())
	}

	return DiscoveredPlugin{
		ManifestFile: manifest,
		Dir:          pluginDir,
		SOPath:       soPath,
	}, nil
}

func PluginSOFilename() string {
	return fmt.Sprintf("plugin-%s-%s.so", runtime.GOOS, runtime.GOARCH)
}

func validateManifest(manifest PluginManifestFile) error {
	var validationErrors []error

	if manifest.SchemaVersion != 1 {
		validationErrors = append(validationErrors, fmt.Errorf("schema_version must be 1"))
	}

	id := strings.TrimSpace(manifest.ID)
	switch {
	case id == "":
		validationErrors = append(validationErrors, fmt.Errorf("id is required"))
	case id != manifest.ID || !pluginIDPattern.MatchString(manifest.ID):
		validationErrors = append(validationErrors, fmt.Errorf("id must be kebab-case"))
	}

	if strings.TrimSpace(manifest.Name) == "" {
		validationErrors = append(validationErrors, fmt.Errorf("name is required"))
	}

	version := strings.TrimSpace(manifest.Version)
	switch {
	case version == "":
		validationErrors = append(validationErrors, fmt.Errorf("version is required"))
	case version != manifest.Version || !semverPattern.MatchString(manifest.Version):
		validationErrors = append(validationErrors, fmt.Errorf("version must be valid semver"))
	}

	sdkVersion := strings.TrimSpace(manifest.SDKVersion)
	switch {
	case sdkVersion == "":
		validationErrors = append(validationErrors, fmt.Errorf("sdk_version is required"))
	case sdkVersion != manifest.SDKVersion || !semverPattern.MatchString(manifest.SDKVersion):
		validationErrors = append(validationErrors, fmt.Errorf("sdk_version must be valid semver"))
	}

	if manifest.HasFrontend && strings.TrimSpace(manifest.FrontendEntry) == "" {
		validationErrors = append(validationErrors, fmt.Errorf("frontend_entry is required when has_frontend is true"))
	}
	if manifest.HasFrontend && strings.TrimSpace(manifest.FrontendStyle) == "" {
		validationErrors = append(validationErrors, fmt.Errorf("frontend_style is required when has_frontend is true"))
	}

	return errors.Join(validationErrors...)
}
