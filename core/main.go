package main

import (
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log/slog"
	"mime"
	"os"
	"os/signal"
	"path"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"syscall"

	"github.com/BlitzPress/BlitzPress/core/internal/api"
	"github.com/BlitzPress/BlitzPress/core/internal/config"
	"github.com/BlitzPress/BlitzPress/core/internal/database"
	"github.com/BlitzPress/BlitzPress/core/internal/plugins"
	pluginsdk "github.com/BlitzPress/BlitzPress/plugin-sdk"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	fiberlogger "github.com/gofiber/fiber/v2/middleware/logger"
	fiberrecover "github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"
)

//go:embed static
var embeddedStatic embed.FS

type browserImportMap struct {
	Imports map[string]string `json:"imports"`
}

var defaultImportMap = browserImportMap{
	Imports: map[string]string{
		"solid-js":               "/api/core/modules/solid-js.js",
		"solid-js/web":           "/api/core/modules/solid-js-web.js",
		"solid-js/store":         "/api/core/modules/solid-js-store.js",
		"@blitzpress/plugin-sdk": "/api/core/modules/plugin-sdk.js",
	},
}

const managerPIDEnv = "BLITZPRESS_MANAGER_PID"

type coreApplication struct {
	config   *config.AppConfig
	logger   *slog.Logger
	db       *gorm.DB
	registry *plugins.PluginRegistry
	app      *fiber.App

	listening    atomic.Bool
	shutdownOnce sync.Once
	shutdownErr  error
}

type spaHandler struct {
	assets fs.FS

	indexOnce sync.Once
	indexHTML []byte
	indexErr  error
}

func main() {
	if err := run(context.Background(), os.Stdout); err != nil {
		fmt.Fprintf(os.Stderr, "blitzpress core failed: %v\n", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, output io.Writer) error {
	cfg := config.Load()
	app, err := newCoreApplication(cfg, newLogger(cfg.LogLevel, output))
	if err != nil {
		return err
	}
	defer app.Shutdown()

	shutdownCtx, stop := signal.NotifyContext(ctx, syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		<-shutdownCtx.Done()
		if err := app.Shutdown(); err != nil {
			app.logger.Error("graceful shutdown failed", "error", err)
		}
	}()

	if err := app.Listen(); err != nil {
		if shutdownCtx.Err() != nil {
			return nil
		}

		return err
	}

	return nil
}

func newCoreApplication(cfg *config.AppConfig, logger *slog.Logger) (*coreApplication, error) {
	if cfg == nil {
		cfg = config.Load()
	}
	if logger == nil {
		logger = newLogger(cfg.LogLevel, io.Discard)
	}

	db, err := database.Initialize(database.Config{
		Driver: cfg.DBDriver,
		DSN:    cfg.DBDSN,
	})
	if err != nil {
		return nil, fmt.Errorf("initialize database: %w", err)
	}

	staticAssets, moduleAssets, err := embeddedAssetFS()
	if err != nil {
		closeDatabase(db)
		return nil, fmt.Errorf("load embedded frontend assets: %w", err)
	}

	app := fiber.New()
	app.Use(cors.New())
	app.Use(fiberlogger.New())
	app.Use(fiberrecover.New())

	registry := plugins.NewPluginRegistry(db, logger)
	if err := registry.DiscoverAndLoad(cfg.PluginsDir); err != nil {
		if errors.Is(err, plugins.ErrCoreBootingHook) {
			registry.EventBus().Stop()
			closeDatabase(db)
			return nil, err
		}

		logger.Error("plugin lifecycle completed with errors", "error", err)
	}

	apiRouter := app.Group("/api")
	registry.MountRoutes(apiRouter, app)
	apiRouter.Get("/core/plugins", api.CMSPluginsHandler(registry))
	apiRouter.Get("/core/modules/*", api.CMSModulesHandler(moduleAssets))
	apiRouter.Get("/core/plugins/all", api.AdminPluginsHandler(registry))
	apiRouter.Put("/core/plugins/:id/enabled", api.AdminPluginToggleHandler(registry, db, newManagedRestartRequester(logger)))
	apiRouter.Get("/core/plugins/:id/settings", api.PluginSettingsGetHandler(registry, db))
	apiRouter.Put("/core/plugins/:id/settings", api.PluginSettingsPutHandler(registry, db))

	app.Use(newSPAHandler(staticAssets).Handle)

	return &coreApplication{
		config:   cfg,
		logger:   logger,
		db:       db,
		registry: registry,
		app:      app,
	}, nil
}

func newManagedRestartRequester(logger *slog.Logger) func() {
	managerPID := strings.TrimSpace(os.Getenv(managerPIDEnv))
	if managerPID == "" {
		return nil
	}

	pid, err := strconv.Atoi(managerPID)
	if err != nil {
		if logger != nil {
			logger.Warn("ignoring invalid managed restart target", "manager_pid", managerPID, "error", err)
		}

		return nil
	}
	if pid <= 0 || pid == os.Getpid() {
		if logger != nil {
			logger.Warn("ignoring invalid managed restart target", "manager_pid", managerPID)
		}

		return nil
	}

	return func() {
		if err := syscall.Kill(pid, syscall.SIGUSR1); err != nil && logger != nil {
			logger.Warn("request managed restart failed", "manager_pid", pid, "error", err)
		}
	}
}

func (a *coreApplication) Listen() error {
	if a == nil || a.app == nil {
		return errors.New("application is not initialized")
	}

	a.listening.Store(true)
	defer a.listening.Store(false)

	return a.app.Listen(a.config.Port)
}

func (a *coreApplication) Shutdown() error {
	if a == nil {
		return nil
	}

	a.shutdownOnce.Do(func() {
		var errs []error

		if a.registry != nil {
			if err := a.registry.Hooks().DoAction(&pluginsdk.HookContext{}, "core.shutdown"); err != nil {
				errs = append(errs, fmt.Errorf("fire core.shutdown hook: %w", err))
			}

			if bus := a.registry.EventBus(); bus != nil {
				bus.Stop()
			}
		}

		if a.app != nil && a.listening.Load() {
			if err := a.app.Shutdown(); err != nil {
				errs = append(errs, fmt.Errorf("shutdown fiber app: %w", err))
			}
		}

		if err := closeDatabase(a.db); err != nil {
			errs = append(errs, err)
		}

		a.shutdownErr = errors.Join(errs...)
	})

	return a.shutdownErr
}

func embeddedAssetFS() (fs.FS, fs.FS, error) {
	staticAssets, err := fs.Sub(embeddedStatic, "static")
	if err != nil {
		return nil, nil, err
	}

	moduleAssets, err := fs.Sub(staticAssets, "modules")
	if err != nil {
		return nil, nil, err
	}

	return staticAssets, moduleAssets, nil
}

func newSPAHandler(assets fs.FS) *spaHandler {
	return &spaHandler{assets: assets}
}

func (h *spaHandler) Handle(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodGet && c.Method() != fiber.MethodHead {
		return fiber.ErrNotFound
	}

	if strings.HasPrefix(c.Path(), "/api/") {
		return fiber.ErrNotFound
	}

	assetPath, ok := normalizeAssetPath(c.Path())
	if !ok {
		return fiber.ErrNotFound
	}

	if assetPath != "index.html" {
		file, err := readStaticFile(h.assets, assetPath)
		if err == nil {
			if contentType := mime.TypeByExtension(path.Ext(assetPath)); contentType != "" {
				c.Set(fiber.HeaderContentType, contentType)
			}

			return c.Send(file)
		}

		if !errors.Is(err, fs.ErrNotExist) {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		if path.Ext(assetPath) != "" {
			return fiber.ErrNotFound
		}
	}

	indexHTML, err := h.injectedIndexHTML()
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	c.Type("html", "utf-8")
	return c.Send(indexHTML)
}

func (h *spaHandler) injectedIndexHTML() ([]byte, error) {
	h.indexOnce.Do(func() {
		source, err := fs.ReadFile(h.assets, "index.html")
		if err != nil {
			h.indexErr = fmt.Errorf("read embedded index.html: %w", err)
			return
		}

		h.indexHTML, h.indexErr = injectImportMap(source)
	})

	return h.indexHTML, h.indexErr
}

func injectImportMap(indexHTML []byte) ([]byte, error) {
	if bytes.Contains(indexHTML, []byte(`type="importmap"`)) {
		return append([]byte(nil), indexHTML...), nil
	}

	importMapJSON, err := json.Marshal(defaultImportMap)
	if err != nil {
		return nil, fmt.Errorf("marshal import map: %w", err)
	}

	script := []byte("<script type=\"importmap\">" + string(importMapJSON) + "</script>")
	if bytes.Contains(indexHTML, []byte("<!-- BLITZPRESS_IMPORT_MAP -->")) {
		return bytes.Replace(indexHTML, []byte("<!-- BLITZPRESS_IMPORT_MAP -->"), script, 1), nil
	}

	lowerHTML := strings.ToLower(string(indexHTML))
	headIndex := strings.Index(lowerHTML, "</head>")
	if headIndex >= 0 {
		injected := make([]byte, 0, len(indexHTML)+len(script))
		injected = append(injected, indexHTML[:headIndex]...)
		injected = append(injected, script...)
		injected = append(injected, indexHTML[headIndex:]...)
		return injected, nil
	}

	return append(script, indexHTML...), nil
}

func normalizeAssetPath(requestPath string) (string, bool) {
	cleaned := path.Clean("/" + strings.TrimSpace(requestPath))
	cleaned = strings.TrimPrefix(cleaned, "/")
	if cleaned == "." || cleaned == "" {
		return "index.html", true
	}
	if !fs.ValidPath(cleaned) {
		return "", false
	}

	return cleaned, true
}

func readStaticFile(assets fs.FS, name string) ([]byte, error) {
	info, err := fs.Stat(assets, name)
	if err != nil {
		return nil, err
	}
	if info.IsDir() {
		return nil, fs.ErrNotExist
	}

	return fs.ReadFile(assets, name)
}

func newLogger(level string, output io.Writer) *slog.Logger {
	if output == nil {
		output = io.Discard
	}

	return slog.New(slog.NewTextHandler(output, &slog.HandlerOptions{
		Level: parseLogLevel(level),
	}))
}

func parseLogLevel(level string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func closeDatabase(db *gorm.DB) error {
	if db == nil {
		return nil
	}

	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("get sql database handle: %w", err)
	}

	if err := sqlDB.Close(); err != nil {
		return fmt.Errorf("close database: %w", err)
	}

	return nil
}
