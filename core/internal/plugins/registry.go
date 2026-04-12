package plugins

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"mime"
	"path"
	"sort"
	"strings"
	"sync"

	"github.com/BlitzPress/BlitzPress/core/internal/database"
	"github.com/gofiber/fiber/v2"

	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"gorm.io/gorm"
)

var (
	ErrCoreBootingHook = errors.New("core.booting hook failed")
	ErrCoreReadyHook   = errors.New("core.ready hook failed")
)

type PluginRegistry struct {
	plugins      map[string]*LoadedPlugin
	hooks        *HookEngine
	events       *EventBusImpl
	authRegistry pluginsdk.AuthRegistry
	mu           sync.RWMutex
	logger       *slog.Logger
	db           *gorm.DB
}

func NewPluginRegistry(db *gorm.DB, logger *slog.Logger, authRegistry pluginsdk.AuthRegistry) *PluginRegistry {
	if logger == nil {
		logger = slog.New(slog.NewTextHandler(io.Discard, nil))
	}

	events := NewEventBus(logger, 0, 0)
	events.Start()

	return &PluginRegistry{
		plugins:      make(map[string]*LoadedPlugin),
		hooks:        NewHookEngine(),
		events:       events,
		authRegistry: authRegistry,
		logger:       logger,
		db:           db,
	}
}

func (r *PluginRegistry) Hooks() *HookEngine {
	return r.hooks
}

func (r *PluginRegistry) EventBus() *EventBusImpl {
	return r.events
}

func (r *PluginRegistry) DiscoverAndLoad(pluginsDir string) error {
	if err := r.hooks.DoAction(&pluginsdk.HookContext{}, "core.booting"); err != nil {
		return fmt.Errorf("%w: %w", ErrCoreBootingHook, err)
	}

	discovered, discoveryErrors := Discover(pluginsDir)
	var errs []error

	for _, err := range discoveryErrors {
		r.logger.Error("plugin discovery failed", "error", err)
		errs = append(errs, err)
	}

	for _, dp := range discovered {
		enabled, err := r.pluginEnabled(dp.ManifestFile.ID)
		if err != nil {
			r.logger.Error("plugin state lookup failed", "plugin_id", dp.ManifestFile.ID, "error", err)
			r.storePlugin(fallbackLoadedPlugin(nil, dp, err))
			errs = append(errs, err)
			continue
		}
		if !enabled {
			r.logger.Info("plugin is disabled; skipping load", "plugin_id", dp.ManifestFile.ID)
			r.storePlugin(disabledLoadedPlugin(dp))
			continue
		}

		loaded, err := LoadPlugin(dp)
		if err != nil {
			r.logger.Error("plugin load failed", "plugin_id", dp.ManifestFile.ID, "error", err)
			r.storePlugin(fallbackLoadedPlugin(loaded, dp, err))
			errs = append(errs, err)
			continue
		}

		httpRegistry := newPluginHTTPRegistry(loaded.Manifest.ID)
		settingsRegistry := newPluginSettingsRegistry(loaded.Manifest.ID)
		configReader := newPluginConfigReader(loaded.Manifest.ID, r.db)
		registrar := &pluginsdk.Registrar{
			Hooks:    newScopedHookRegistry(loaded.Manifest.ID, r.hooks),
			HTTP:     httpRegistry,
			Events:   newScopedEventBus(loaded.Manifest.ID, r.events),
			DB:       r.db,
			Settings: settingsRegistry,
			Logger:   slogLoggerAdapter{logger: r.logger.With("plugin_id", loaded.Manifest.ID)},
			Config:   configReader,
			Auth:     r.authRegistry,
		}

		if err := loaded.Instance.Register(registrar); err != nil {
			err = errors.Join(pluginsdk.ErrRegistrationFailed, err)
			loaded.Status = "error"
			loaded.Errors = append(loaded.Errors, err)
			r.logger.Error("plugin registration failed", "plugin_id", loaded.Manifest.ID, "error", err)
			r.storePlugin(loaded)
			errs = append(errs, err)
			continue
		}

		loaded.Routes = append([]registeredRoute(nil), httpRegistry.routes...)
		loaded.Statics = append([]registeredStatic(nil), httpRegistry.statics...)
		if settingsRegistry.schema != nil {
			schema := cloneSettingsSchema(*settingsRegistry.schema)
			loaded.SettingsSchema = &schema
		}

		r.storePlugin(loaded)

		if err := r.hooks.DoAction(&pluginsdk.HookContext{PluginID: loaded.Manifest.ID}, "plugin.loaded", loaded); err != nil {
			r.logger.Error("plugin.loaded hook failed", "plugin_id", loaded.Manifest.ID, "error", err)
			errs = append(errs, err)
		}
	}

	if err := r.hooks.DoAction(&pluginsdk.HookContext{}, "core.ready"); err != nil {
		err = fmt.Errorf("%w: %w", ErrCoreReadyHook, err)
		r.logger.Error("core.ready hook failed", "error", err)
		errs = append(errs, err)
	}

	return errors.Join(errs...)
}

func (r *PluginRegistry) pluginEnabled(pluginID string) (bool, error) {
	if r.db == nil {
		return true, nil
	}

	var state database.PluginState
	result := r.db.Where("plugin_id = ?", pluginID).Limit(1).Find(&state)
	switch {
	case result.Error == nil && result.RowsAffected == 0:
		return true, nil
	case result.Error == nil:
		return state.Enabled, nil
	default:
		return false, fmt.Errorf("lookup plugin state for %q: %w", pluginID, result.Error)
	}
}

func (r *PluginRegistry) SetPluginEnabled(pluginID string, enabled bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	plugin, ok := r.plugins[pluginID]
	if !ok {
		return fmt.Errorf("plugin %q not found", pluginID)
	}

	if r.db != nil {
		var existing database.PluginState
		result := r.db.Where("plugin_id = ?", pluginID).Limit(1).Find(&existing)
		if result.Error != nil {
			return fmt.Errorf("lookup plugin state for %q: %w", pluginID, result.Error)
		}

		if result.RowsAffected == 0 {
			existing = database.PluginState{
				PluginID: pluginID,
				Enabled:  enabled,
				Version:  plugin.ManifestFile.Version,
			}
			if err := r.db.Create(&existing).Error; err != nil {
				return fmt.Errorf("create plugin state for %q: %w", pluginID, err)
			}
		}

		if err := r.db.Model(&existing).Where("plugin_id = ?", pluginID).Update("enabled", enabled).Error; err != nil {
			return fmt.Errorf("update plugin state for %q: %w", pluginID, err)
		}
	}

	plugin.Enabled = enabled
	if !enabled {
		plugin.Status = "disabled"
	}

	return nil
}

func (r *PluginRegistry) GetPlugin(id string) (*LoadedPlugin, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	plugin, ok := r.plugins[id]
	return plugin, ok
}

func (r *PluginRegistry) ListPlugins() []*LoadedPlugin {
	r.mu.RLock()
	defer r.mu.RUnlock()

	plugins := make([]*LoadedPlugin, 0, len(r.plugins))
	for _, plugin := range r.plugins {
		plugins = append(plugins, plugin)
	}

	sort.Slice(plugins, func(i, j int) bool {
		leftID := plugins[i].Manifest.ID
		if leftID == "" {
			leftID = plugins[i].ManifestFile.ID
		}

		rightID := plugins[j].Manifest.ID
		if rightID == "" {
			rightID = plugins[j].ManifestFile.ID
		}

		return leftID < rightID
	})

	return plugins
}

func (r *PluginRegistry) MountRoutes(api fiber.Router, root fiber.Router) {
	for _, plugin := range r.ListPlugins() {
		if plugin.Status != "loaded" {
			continue
		}

		pluginAPI := api.Group("/plugins/" + plugin.Manifest.ID)
		for _, route := range plugin.Routes {
			if route.register != nil {
				route.register(pluginAPI)
			}
		}

		if len(plugin.Statics) == 0 {
			continue
		}

		pluginStatic := root.Group("/plugins/" + plugin.Manifest.ID + "/assets")
		pluginStatic.All("/*", r.servePluginStaticAssets(plugin))
	}
}

func (r *PluginRegistry) storePlugin(plugin *LoadedPlugin) {
	r.mu.Lock()
	defer r.mu.Unlock()

	id := plugin.Manifest.ID
	if id == "" {
		id = plugin.ManifestFile.ID
	}

	r.plugins[id] = plugin
}

func fallbackLoadedPlugin(loaded *LoadedPlugin, dp DiscoveredPlugin, err error) *LoadedPlugin {
	if loaded != nil {
		if loaded.Status == "" {
			loaded.Status = "error"
		}
		if len(loaded.Errors) == 0 {
			loaded.Errors = []error{err}
		}

		return loaded
	}

	return &LoadedPlugin{
		ManifestFile: dp.ManifestFile,
		Path:         dp.Dir,
		Status:       "error",
		Errors:       []error{err},
	}
}

func staticSubFS(static registeredStatic) (fs.FS, error) {
	if static.stripPrefix == "." {
		return static.filesystem, nil
	}

	return fs.Sub(static.filesystem, static.stripPrefix)
}

func (r *PluginRegistry) servePluginStaticAssets(plugin *LoadedPlugin) fiber.Handler {
	staticMounts := pluginStaticMounts(plugin)

	return func(c *fiber.Ctx) error {
		if c.Method() != fiber.MethodGet && c.Method() != fiber.MethodHead {
			return fiber.ErrNotFound
		}

		assetPath, ok := normalizePluginAssetPath(c.Params("*"))
		if !ok {
			return fiber.ErrNotFound
		}

		for _, staticMount := range staticMounts {
			contents, err := readPluginStaticFile(staticMount, assetPath)
			if err == nil {
				if contentType := mime.TypeByExtension(path.Ext(assetPath)); contentType != "" {
					c.Set(fiber.HeaderContentType, contentType)
				}

				return c.Send(contents)
			}

			if errors.Is(err, fs.ErrNotExist) {
				continue
			}

			r.logger.Error(
				"plugin static asset lookup failed",
				"plugin_id", plugin.Manifest.ID,
				"asset_path", assetPath,
				"error", err,
			)
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return fiber.ErrNotFound
	}
}

func pluginStaticMounts(plugin *LoadedPlugin) []registeredStatic {
	return plugin.Statics
}

func normalizePluginAssetPath(assetPath string) (string, bool) {
	cleaned := path.Clean("/" + strings.TrimSpace(assetPath))
	cleaned = strings.TrimPrefix(cleaned, "/")
	if cleaned == "." || cleaned == "" {
		return "", false
	}
	if !fs.ValidPath(cleaned) {
		return "", false
	}

	return cleaned, true
}

func readPluginStaticFile(static registeredStatic, name string) ([]byte, error) {
	mountFS, err := staticSubFS(static)
	if err != nil {
		return nil, err
	}

	info, err := fs.Stat(mountFS, name)
	if err != nil {
		return nil, err
	}
	if info.IsDir() {
		return nil, fs.ErrNotExist
	}

	return fs.ReadFile(mountFS, name)
}

type scopedHookRegistry struct {
	pluginID string
	engine   *HookEngine
}

func newScopedHookRegistry(pluginID string, engine *HookEngine) pluginsdk.HookRegistry {
	return &scopedHookRegistry{
		pluginID: strings.TrimSpace(pluginID),
		engine:   engine,
	}
}

func (r *scopedHookRegistry) AddAction(name string, fn pluginsdk.ActionFunc, opts ...pluginsdk.HookOptions) pluginsdk.HookID {
	return r.engine.AddAction(name, r.wrapAction(fn), opts...)
}

func (r *scopedHookRegistry) DoAction(ctx *pluginsdk.HookContext, name string, args ...any) error {
	return r.engine.DoAction(withDefaultPluginID(ctx, r.pluginID), name, args...)
}

func (r *scopedHookRegistry) RemoveAction(name string, id pluginsdk.HookID) bool {
	return r.engine.RemoveAction(name, id)
}

func (r *scopedHookRegistry) AddFilter(name string, fn pluginsdk.FilterFunc, opts ...pluginsdk.HookOptions) pluginsdk.HookID {
	return r.engine.AddFilter(name, r.wrapFilter(fn), opts...)
}

func (r *scopedHookRegistry) ApplyFilters(ctx *pluginsdk.HookContext, name string, value any, args ...any) (any, error) {
	return r.engine.ApplyFilters(withDefaultPluginID(ctx, r.pluginID), name, value, args...)
}

func (r *scopedHookRegistry) RemoveFilter(name string, id pluginsdk.HookID) bool {
	return r.engine.RemoveFilter(name, id)
}

func (r *scopedHookRegistry) wrapAction(fn pluginsdk.ActionFunc) pluginsdk.ActionFunc {
	if fn == nil {
		return nil
	}

	return func(ctx *pluginsdk.HookContext, args ...any) error {
		return fn(withDefaultPluginID(ctx, r.pluginID), args...)
	}
}

func (r *scopedHookRegistry) wrapFilter(fn pluginsdk.FilterFunc) pluginsdk.FilterFunc {
	if fn == nil {
		return nil
	}

	return func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
		return fn(withDefaultPluginID(ctx, r.pluginID), value, args...)
	}
}

func withDefaultPluginID(ctx *pluginsdk.HookContext, pluginID string) *pluginsdk.HookContext {
	if ctx == nil {
		return &pluginsdk.HookContext{PluginID: pluginID}
	}

	if ctx.PluginID != "" {
		return ctx
	}

	cloned := *ctx
	cloned.PluginID = pluginID
	return &cloned
}

type scopedEventBus struct {
	pluginID string
	bus      *EventBusImpl
}

func newScopedEventBus(pluginID string, bus *EventBusImpl) pluginsdk.EventBus {
	return &scopedEventBus{
		pluginID: strings.TrimSpace(pluginID),
		bus:      bus,
	}
}

func (b *scopedEventBus) Publish(name string, payload map[string]any) error {
	return b.bus.publish(b.pluginID, name, payload)
}

func (b *scopedEventBus) Subscribe(name string, handler pluginsdk.EventHandler) string {
	return b.bus.subscribe(b.pluginID, name, handler)
}

func (b *scopedEventBus) Unsubscribe(id string) bool {
	return b.bus.Unsubscribe(id)
}

type slogLoggerAdapter struct {
	logger *slog.Logger
}

func (l slogLoggerAdapter) Debug(msg string, args ...any) {
	l.logger.Debug(msg, args...)
}

func (l slogLoggerAdapter) Info(msg string, args ...any) {
	l.logger.Info(msg, args...)
}

func (l slogLoggerAdapter) Warn(msg string, args ...any) {
	l.logger.Warn(msg, args...)
}

func (l slogLoggerAdapter) Error(msg string, args ...any) {
	l.logger.Error(msg, args...)
}
