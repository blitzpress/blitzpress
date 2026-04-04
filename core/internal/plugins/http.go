package plugins

import (
	"errors"
	"io/fs"
	"path"
	"strings"

	"github.com/gofiber/fiber/v2"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
)

var (
	errHTTPRegistryPluginIDRequired = errors.New("plugin id is required")
	errHTTPRegistryAPIFnRequired    = errors.New("api registration function is required")
	errHTTPRegistryStaticFSRequired = errors.New("static filesystem is required")
	errHTTPRegistryInvalidPrefix    = errors.New("static stripPrefix is invalid")
)

type registeredRoute struct {
	pluginID string
	register func(router fiber.Router)
}

type registeredStatic struct {
	pluginID    string
	filesystem  fs.FS
	stripPrefix string
}

type pluginHTTPRegistry struct {
	pluginID string
	routes   []registeredRoute
	statics  []registeredStatic
}

var _ pluginsdk.HTTPRegistry = (*pluginHTTPRegistry)(nil)

func newPluginHTTPRegistry(pluginID string) *pluginHTTPRegistry {
	return &pluginHTTPRegistry{
		pluginID: strings.TrimSpace(pluginID),
	}
}

func (r *pluginHTTPRegistry) API(fn func(router fiber.Router)) error {
	pluginID := strings.TrimSpace(r.pluginID)
	if pluginID == "" {
		return errHTTPRegistryPluginIDRequired
	}
	if fn == nil {
		return errHTTPRegistryAPIFnRequired
	}

	r.routes = append(r.routes, registeredRoute{
		pluginID: pluginID,
		register: fn,
	})

	return nil
}

func (r *pluginHTTPRegistry) Static(filesystem fs.FS, stripPrefix string) error {
	pluginID := strings.TrimSpace(r.pluginID)
	if pluginID == "" {
		return errHTTPRegistryPluginIDRequired
	}
	if filesystem == nil {
		return errHTTPRegistryStaticFSRequired
	}

	normalizedPrefix, err := normalizeStaticStripPrefix(stripPrefix)
	if err != nil {
		return err
	}

	r.statics = append(r.statics, registeredStatic{
		pluginID:    pluginID,
		filesystem:  filesystem,
		stripPrefix: normalizedPrefix,
	})

	return nil
}

func normalizeStaticStripPrefix(stripPrefix string) (string, error) {
	trimmed := strings.TrimSpace(stripPrefix)
	if trimmed == "" || trimmed == "/" {
		return ".", nil
	}

	cleaned := strings.TrimPrefix(path.Clean(trimmed), "/")
	if cleaned == "." || cleaned == "" {
		return ".", nil
	}
	if !fs.ValidPath(cleaned) {
		return "", errHTTPRegistryInvalidPrefix
	}

	return cleaned, nil
}
