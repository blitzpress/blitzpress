package plugins

import (
	"fmt"
	stdplugin "plugin"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

type LoadedPlugin struct {
	Manifest       pluginsdk.Manifest
	ManifestFile   PluginManifestFile
	Path           string
	Instance       pluginsdk.Plugin
	Status         string
	Errors         []error
	Routes         []registeredRoute
	Statics        []registeredStatic
	SettingsSchema *pluginsdk.SettingsSchema
}

func LoadPlugin(dp DiscoveredPlugin) (*LoadedPlugin, error) {
	loaded := &LoadedPlugin{
		ManifestFile: dp.ManifestFile,
		Path:         dp.Dir,
		Status:       "error",
	}

	if dp.ManifestFile.SDKVersion != pluginsdk.SDKVersion {
		err := fmt.Errorf(
			"%w: plugin requires %s, host provides %s",
			pluginsdk.ErrIncompatibleSDK,
			dp.ManifestFile.SDKVersion,
			pluginsdk.SDKVersion,
		)
		loaded.Errors = []error{err}
		return loaded, err
	}

	p, err := stdplugin.Open(dp.SOPath)
	if err != nil {
		err = fmt.Errorf("open plugin %q: %w", dp.SOPath, err)
		loaded.Errors = []error{err}
		return loaded, err
	}

	symbol, err := p.Lookup("Plugin")
	if err != nil {
		err = fmt.Errorf("%w: %v", pluginsdk.ErrSymbolNotFound, err)
		loaded.Errors = []error{err}
		return loaded, err
	}

	instance, err := resolvePluginSymbol(symbol)
	if err != nil {
		loaded.Errors = []error{err}
		return loaded, err
	}

	manifest := instance.Manifest()
	loaded.Manifest = manifest
	loaded.Instance = instance

	if err := validateLoadedManifest(manifest, dp.ManifestFile); err != nil {
		loaded.Errors = []error{err}
		return loaded, err
	}

	loaded.Status = "loaded"
	return loaded, nil
}

func resolvePluginSymbol(symbol stdplugin.Symbol) (pluginsdk.Plugin, error) {
	switch value := symbol.(type) {
	case *pluginsdk.Plugin:
		if value == nil || *value == nil {
			return nil, fmt.Errorf("%w: Plugin symbol is nil", pluginsdk.ErrSymbolNotFound)
		}

		return *value, nil
	case pluginsdk.Plugin:
		return value, nil
	default:
		return nil, fmt.Errorf("%w: unsupported Plugin symbol type %T", pluginsdk.ErrSymbolNotFound, symbol)
	}
}

func validateLoadedManifest(manifest pluginsdk.Manifest, manifestFile PluginManifestFile) error {
	if manifest.ID != manifestFile.ID || manifest.Name != manifestFile.Name || manifest.Version != manifestFile.Version {
		return fmt.Errorf(
			"%w: plugin exported id=%q name=%q version=%q, manifest file has id=%q name=%q version=%q",
			pluginsdk.ErrManifestMismatch,
			manifest.ID,
			manifest.Name,
			manifest.Version,
			manifestFile.ID,
			manifestFile.Name,
			manifestFile.Version,
		)
	}

	return nil
}
