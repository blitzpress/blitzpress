# BlitzPress - Complete Project Overview for AI Agent

## What Is This

BlitzPress is a CMS (Content Management System) built in Go, inspired by WordPress but designed for performance, scalability, and security. It uses a compiled plugin system (`.so` shared objects) with a SolidJS frontend. The project is a monorepo with Go workspace.

---

## Monorepo Structure

```
blitzpress/
├── go.work                    # Go workspace file linking all Go modules
├── go.work.sum
├── core/                      # Main CMS application (Go + embedded SolidJS)
│   ├── go.mod                 # module: github.com/user/blitzpress/core
│   ├── main.go                # Entrypoint: Fiber server, plugin loader, DB init
│   ├── internal/
│   │   ├── plugins/           # Plugin system internals
│   │   │   ├── discover.go    # Scan /build/plugins/ for plugin.json manifests
│   │   │   ├── loader.go      # plugin.Open(), symbol lookup, lifecycle
│   │   │   ├── registry.go    # Runtime registry of loaded plugins
│   │   │   ├── hooks.go       # WordPress-style action/filter engine
│   │   │   └── http.go        # Mount plugin routes onto Fiber
│   │   ├── database/          # GORM setup, connection, migration runner
│   │   │   ├── database.go    
│   │   │   └── migrations/    # Go-based migrations (not SQL files)
│   │   └── config/            # App configuration loading
│   ├── frontend/              # SolidJS app source (Vite project)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── packages/
│   │   │   └── vite-plugin/   # @blitzpress/vite-plugin for plugin authors
│   │   │       ├── package.json
│   │   │       ├── src/
│   │   │       │   └── index.ts
│   │   │       └── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.tsx
│   │   │   ├── App.tsx
│   │   │   ├── plugin-runtime/ # Frontend plugin loader & registries
│   │   │   │   ├── registry.ts
│   │   │   │   ├── hooks.ts
│   │   │   │   ├── loader.ts
│   │   │   │   └── types.ts
│   │   │   └── pages/
│   │   └── dist/              # Vite build output (gitignored)
│   ├── static/                # Embedded SolidJS build files (copied from dist/)
│   │   └── (index.html, assets/, etc.)
│   └── .air.toml              # Air hot-reload config
│
├── plugin-sdk/                # Public Go SDK package for plugin authors
│   ├── go.mod                 # module: github.com/user/blitzpress/plugin-sdk
│   ├── plugin.go              # Plugin interface, Manifest struct, Registrar
│   ├── hooks.go               # HookRegistry, ActionFunc, FilterFunc, HookID
│   ├── events.go              # EventBus interface, Event struct
│   ├── http.go                # HTTPRegistry interface
│   ├── settings.go            # SettingsRegistry, SettingsSchema, SettingsField
│   ├── context.go             # HookContext
│   └── errors.go              # SDK error types
│
├── manager/                   # CLI tool for plugin management (future)
│   ├── go.mod                 # module: github.com/user/blitzpress/manager
│   └── main.go                # Plugin install/remove/enable/disable commands
│
├── example-plugin/            # Reference plugin implementation
│   ├── go.mod                 # module: github.com/user/blitzpress/example-plugin
│   ├── plugin.json            # Plugin manifest (required)
│   ├── main.go                # Exports var Plugin (implements pluginsdk.Plugin)
│   ├── frontend/              # Plugin's own SolidJS micro-app
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── index.ts       # register() entry - registers pages, widgets, etc.
│   │       └── pages/
│   ├── static/                # Embedded static files (plugin's own assets)
│   └── .air.toml              # Air config for this plugin
│
├── build/                     # All build outputs (gitignored)
│   ├── blitzpress             # Core binary
│   └── plugins/
│       └── example-plugin/
│           ├── plugin.json
│           ├── plugin.so
│           └── frontend/
│               └── assets/
│                   ├── index.js
│                   └── index.css
│
├── .air.toml                  # Root air config (orchestrates everything)
└── scripts/                   # Build helper scripts
    ├── build-core.sh
    ├── build-plugin.sh
    └── build-all.sh
```

---

## Go Workspace Configuration

```
// go.work
go 1.24

use (
    ./core
    ./plugin-sdk
    ./manager
    ./example-plugin
)
```

Each module references `plugin-sdk` via the workspace (no replace directives needed when using go.work).

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | Go 1.24+ | Core server, plugin host |
| Web Framework | GoFiber v2 | HTTP routing, middleware |
| ORM | GORM | Database access, migrations |
| Database | SQLite (dev) / PostgreSQL (prod) | Data persistence |
| Plugin System | Go `plugin` package (.so) | Runtime plugin loading |
| Frontend | SolidJS | Reactive UI framework |
| Frontend Build | Vite | Bundling, HMR |
| Frontend Package Manager | bun or pnpm | Dependency management |
| Hot Reload | cosmtrek/air | Go file watching + rebuild |
| Embedded Assets | Go `embed` package | Static files in binary |

---

## Plugin SDK Contract (`plugin-sdk/`)

This is the **public API** that every plugin imports. It must be stable and versioned.

### Core Types

```go
package pluginsdk

type Manifest struct {
    ID          string   // Unique slug: "example-plugin" (URL-safe, kebab-case)
    Name        string   // Display name: "Example Plugin"
    Version     string   // Semver: "1.2.3"
    Description string
    Author      string
}

// Every plugin must implement this interface
type Plugin interface {
    Manifest() Manifest
    Register(r *Registrar) error
}

// Passed to Plugin.Register() - the plugin's gateway to the CMS
type Registrar struct {
    Hooks    HookRegistry
    HTTP     HTTPRegistry
    Events   EventBus       // Async event bus for plugin-to-plugin messaging
    DB       *gorm.DB       // Direct DB access for plugin tables
    Settings SettingsRegistry // Declarative settings schema registration
    Logger   Logger
    Config   ConfigReader   // Read plugin's saved settings values
}
```

### WordPress-Style Hooks

This is a **critical** system. Mirrors WordPress `add_action`, `do_action`, `add_filter`, `apply_filters`.

```go
type HookID string

type HookOptions struct {
    Priority int    // Lower = runs first. Default: 10
}

type HookContext struct {
    PluginID  string
    RequestID string
    Metadata  map[string]any
}

type ActionFunc func(ctx *HookContext, args ...any) error
type FilterFunc func(ctx *HookContext, value any, args ...any) (any, error)

type HookRegistry interface {
    // Actions: fire-and-forget events (no return value transformation)
    AddAction(name string, fn ActionFunc, opts ...HookOptions) HookID
    DoAction(ctx *HookContext, name string, args ...any) error
    RemoveAction(name string, id HookID) bool

    // Filters: value transformation pipelines (value passes through chain)
    AddFilter(name string, fn FilterFunc, opts ...HookOptions) HookID
    ApplyFilters(ctx *HookContext, name string, value any, args ...any) (any, error)
    RemoveFilter(name string, id HookID) bool
}
```

**Priority rules:**
- Default priority: `10`
- Lower number = runs earlier
- Same priority = registration order preserved

**Built-in hook names the core fires:**

| Hook Name | Type | When |
|-----------|------|------|
| `core.booting` | Action | Before plugins load |
| `core.ready` | Action | All plugins loaded, server starting |
| `core.shutdown` | Action | Server shutting down |
| `plugin.loaded` | Action | After each plugin loads |
| `admin.menu.items` | Filter | Building admin sidebar menu |
| `dashboard.widgets` | Filter | Collecting dashboard widgets |
| `settings.schema` | Filter | Building settings page schema |

### HTTP Route Registration

```go
type HTTPRegistry interface {
    // Plugin API routes -> mounted at /api/plugins/{pluginID}/...
    API(fn func(router fiber.Router)) error
    
    // Plugin static/frontend assets -> mounted at /plugins/{pluginID}/assets/...
    Static(fs embed.FS, prefix string) error
}
```

Route prefixing is automatic. If plugin ID is `example-plugin`:
- `r.HTTP.API(func(router) { router.Get("/health", ...) })` -> `GET /api/plugins/example-plugin/health`
- Static assets -> `/plugins/example-plugin/assets/*`

### Plugin Symbol Export

Each plugin `.so` must export exactly one symbol:

```go
var Plugin pluginsdk.Plugin
```

The loader does `plugin.Open(path)` then `plugin.Lookup("Plugin")`.

---

## Plugin Manifest (`plugin.json`)

Every plugin directory must contain this file. It is read BEFORE loading the `.so`.

```json
{
    "schema_version": 1,
    "id": "example-plugin",
    "name": "Example Plugin",
    "version": "1.2.3",
    "description": "A reference implementation plugin",
    "author": "BlitzPress",
    "sdk_version": "0.1.0",
    "has_frontend": true,
    "frontend_entry": "frontend/assets/index.js",
    "frontend_style": "frontend/assets/index.css",
    "capabilities": ["api.routes", "hooks", "frontend.pages"]
}
```

**Required fields:** `schema_version`, `id`, `name`, `version`, `sdk_version`

The `id` field is the unique marketplace identifier. It must be:
- Lowercase kebab-case
- URL-safe
- Filesystem-safe
- Unique across the plugin ecosystem

---

## Example Plugin Implementation (`example-plugin/main.go`)

```go
package main

import (
    "embed"
    "github.com/gofiber/fiber/v2"
    pluginsdk "github.com/user/blitzpress/plugin-sdk"
)

//go:embed static/*
var staticContent embed.FS

type ExamplePlugin struct{}

func (p ExamplePlugin) Manifest() pluginsdk.Manifest {
    return pluginsdk.Manifest{
        ID:      "example-plugin",
        Name:    "Example Plugin",
        Version: "0.1.0",
    }
}

func (p ExamplePlugin) Register(r *pluginsdk.Registrar) error {
    // Register API routes (auto-prefixed to /api/plugins/example-plugin/)
    r.HTTP.API(func(router fiber.Router) {
        router.Get("/hello", func(c *fiber.Ctx) error {
            return c.JSON(fiber.Map{"message": "Hello from Example Plugin"})
        })
    })

    // Serve embedded static files at /plugins/example-plugin/assets/
    r.HTTP.Static(staticContent, "static")

    // Register a WordPress-style action
    r.Hooks.AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
        r.Logger.Info("Example plugin is ready!")
        return nil
    })

    // Register a filter to add admin menu items
    r.Hooks.AddFilter("admin.menu.items", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
        items := value.([]pluginsdk.MenuItem)
        items = append(items, pluginsdk.MenuItem{
            ID:    "example-plugin.home",
            Label: "Example Plugin",
            Icon:  "puzzle",
            Path:  "/plugins/example-plugin",
        })
        return items, nil
    })

    return nil
}

// This is the symbol the core looks up
var Plugin ExamplePlugin
```

---

## Plugin Loading Lifecycle (core/internal/plugins/)

The loader executes these steps in order:

1. **Discover** - Walk `/build/plugins/` directory
2. **Parse Manifests** - Read and validate each `plugin.json`
3. **Check Compatibility** - Verify `sdk_version` matches host
4. **Sort** - Topological sort by dependencies (future)
5. **Load** - `plugin.Open()` on each `.so` file
6. **Lookup Symbol** - Get exported `Plugin` variable
7. **Validate** - Ensure `Manifest()` matches `plugin.json`
8. **Register** - Call `Plugin.Register(registrar)` with typed registrar
9. **Mount Routes** - Attach all registered HTTP routes to Fiber
10. **Emit Hooks** - Fire `plugin.loaded` action for each, then `core.ready`

```go
// core/internal/plugins/registry.go
type LoadedPlugin struct {
    Manifest       pluginsdk.Manifest
    Path           string
    Instance       pluginsdk.Plugin
    Status         string // "loaded", "error", "disabled"
    Errors         []error
    HasFrontend    bool
    FrontendEntry  string
    FrontendStyle  string
}

type PluginRegistry struct {
    plugins map[string]*LoadedPlugin // keyed by plugin ID
    hooks   *HookEngine
    mu      sync.RWMutex
}
```

---

## Core Application Startup (`core/main.go`)

```
1. Load configuration (env vars, config file)
2. Initialize GORM database connection
3. Run pending migrations
4. Create GoFiber app
5. Mount core middleware (CORS, logging, recovery)
6. Initialize plugin registry
7. Discover & load all plugins from /build/plugins/
8. Mount plugin API routes at /api/plugins/{id}/...
9. Mount plugin static assets at /plugins/{id}/assets/...
10. Expose plugin frontend manifest API: GET /api/cms/plugins
11. Mount embedded SolidJS frontend (catch-all for SPA routing)
12. Start Fiber server
```

### Frontend Manifest API

The core exposes an endpoint that the SolidJS app calls at boot to discover plugin frontends:

```
GET /api/cms/plugins
```

Response:
```json
{
    "plugins": [
        {
            "id": "example-plugin",
            "name": "Example Plugin",
            "version": "0.1.0",
            "has_frontend": true,
            "frontend_entry": "/plugins/example-plugin/assets/index.js",
            "frontend_style": "/plugins/example-plugin/assets/index.css"
        }
    ]
}
```

---

## Frontend Plugin System (SolidJS)

### The Problem

The core SolidJS app is embedded in the Go binary as static build files. Plugins also have their own SolidJS components. We need plugins to inject pages, widgets, and components into the core app **without rebuilding the core**.

### The Solution: ES Module Import Maps with Shared SolidJS Instance

Plugins build their frontends as **ES module bundles** served as static files by the Go backend. The core SolidJS app loads these at runtime using **browser import maps** so plugins can use clean `import` statements.

**Key mechanism:**

1. The core app injects an **import map** into the HTML before any scripts load. This tells the browser where to resolve shared dependencies:

```html
<!-- Generated by the Go backend and injected into the served index.html -->
<script type="importmap">
{
    "imports": {
        "solid-js": "/api/cms/modules/solid-js.js",
        "solid-js/web": "/api/cms/modules/solid-js-web.js",
        "solid-js/store": "/api/cms/modules/solid-js-store.js",
        "@blitzpress/plugin-sdk": "/api/cms/modules/plugin-sdk.js"
    }
}
</script>
```

The core backend serves these shared modules as pre-built ESM files at `/api/cms/modules/*`. These are the **same instances** the core app uses, ensuring there is only one copy of SolidJS in the browser (critical for reactivity to work).

2. The core exposes a runtime plugin SDK module that plugins import:

```ts
// @blitzpress/plugin-sdk (served from /api/cms/modules/plugin-sdk.js)
// This module is built as part of the core frontend and exposes:
export function registerPlugin(manifest: PluginManifest, registerFn: (registrar: FrontendRegistrar) => void): void;
export const hooks: FrontendHookEngine;
export const components: ComponentRegistry;
```

3. Plugin frontends are built as ES modules with shared deps marked as external. The `@blitzpress/vite-plugin` package (see below) handles this automatically:

```ts
// example-plugin/frontend/src/index.ts
import { createSignal } from "solid-js";  // Resolved via import map to core's instance
import { registerPlugin } from "@blitzpress/plugin-sdk";

registerPlugin({
    id: "example-plugin",
    name: "Example Plugin",
}, (registrar) => {
    registrar.pages.add({
        id: "example-plugin.home",
        path: "/plugins/example-plugin",
        title: "Example Plugin",
        component: () => import("./pages/Home"),
    });

    registrar.hooks.addFilter("admin.menu.items", (items) => [
        ...items,
        { id: "example-plugin.menu", label: "Example Plugin", path: "/plugins/example-plugin" }
    ]);
});
```

4. The core app loads plugin modules dynamically at boot:

```ts
// core/frontend/src/plugin-runtime/loader.ts
async function loadPlugins() {
    const res = await fetch("/api/cms/plugins");
    const { plugins } = await res.json();
    
    for (const plugin of plugins) {
        if (plugin.has_frontend) {
            // Load CSS
            if (plugin.frontend_style) {
                const link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = plugin.frontend_style;
                document.head.appendChild(link);
            }
            // Load ES module - import map resolves shared deps
            await import(/* @vite-ignore */ plugin.frontend_entry);
        }
    }
}
```

### `@blitzpress/vite-plugin` - Shared Vite Config Package

Lives at `core/frontend/packages/vite-plugin/` (or as a separate workspace package). Plugin authors add it to their vite config and it handles all the externalization and output format automatically:

```ts
// example-plugin/frontend/vite.config.ts
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import blitzpressPlugin from "@blitzpress/vite-plugin";

export default defineConfig({
    plugins: [
        solidPlugin(),
        blitzpressPlugin({
            pluginId: "example-plugin",
        }),
    ],
});
```

The `@blitzpress/vite-plugin` does:
- Marks `solid-js`, `solid-js/web`, `solid-js/store`, `@blitzpress/plugin-sdk` as external
- Sets output format to `es` (ES modules)
- Configures output directory and file naming for plugin convention
- Sets the correct `base` path for asset references
- Strips out solid-js from the bundle (it comes from the import map)
```

### Frontend Hook System (mirrors backend)

```ts
// core/frontend/src/plugin-runtime/hooks.ts
interface FrontendHookEngine {
    addAction(name: string, fn: Function, opts?: { priority?: number }): string;
    addFilter(name: string, fn: Function, opts?: { priority?: number }): string;
    doAction(name: string, ...args: any[]): void;
    applyFilters(name: string, value: any, ...args: any[]): any;
    removeAction(name: string, id: string): boolean;
    removeFilter(name: string, id: string): boolean;
}
```

### Frontend Registries

```ts
interface FrontendRegistrar {
    pages: {
        add(page: { id: string; path: string; title: string; component: Component }): void;
    };
    widgets: {
        add(widget: { id: string; title: string; component: Component }): void;
    };
    hooks: FrontendHookEngine;
}
```

---

## Database (GORM)

### Setup

```go
// core/internal/database/database.go
import "gorm.io/gorm"
import "gorm.io/driver/sqlite" // dev
// import "gorm.io/driver/postgres" // prod

func Initialize(cfg *config.Config) (*gorm.DB, error) {
    db, err := gorm.Open(sqlite.Open("blitzpress.db"), &gorm.Config{})
    // AutoMigrate core models
    db.AutoMigrate(&User{}, &Post{}, &Setting{}, &PluginState{})
    return db, err
}
```

### Core Models (minimum)

- `User` - authentication, roles
- `Post` / `Content` - core CMS content type
- `Setting` - key-value settings store
- `PluginState` - tracks installed/enabled/disabled plugins

### Plugin Database Access

Plugins receive `*gorm.DB` through the registrar and can:
- Define their own models
- Run their own AutoMigrate in `Register()`
- Query/mutate their own tables

Plugins should prefix their table names with their ID: `example_plugin_items`.

---

## Build System

### Building Core

```bash
# 1. Build SolidJS frontend
cd core/frontend && bun install && bun run build
# 2. Copy dist/ to core/static/ for embedding
cp -r core/frontend/dist/* core/static/
# 3. Build Go binary
cd core && go build -o ../build/blitzpress .
```

### Building a Plugin

```bash
# 1. Build plugin frontend (if has_frontend)
cd example-plugin/frontend && bun install && bun run build
# 2. Create plugin output directory
mkdir -p build/plugins/example-plugin/frontend/assets
# 3. Copy frontend build
cp -r example-plugin/frontend/dist/* build/plugins/example-plugin/frontend/assets/
# 4. Copy manifest
cp example-plugin/plugin.json build/plugins/example-plugin/
# 5. Build .so
cd example-plugin && go build -buildvcs=false -buildmode=plugin -o ../build/plugins/example-plugin/plugin.so .
```

### Build Output Structure

```
build/
├── blitzpress                        # Core binary (Linux)
└── plugins/
    └── example-plugin/
        ├── plugin.json               # Manifest
        ├── plugin.so                  # Go shared object
        └── frontend/
            └── assets/
                ├── index.js           # Plugin frontend bundle
                └── index.css          # Plugin frontend styles
```

---

## Air Hot-Reload Configuration

### Root `.air.toml` (for core)

```toml
root = "."
tmp_dir = "tmp"

[build]
  # Build frontend first, then Go
  cmd = "cd core/frontend && bun run build && cp -r dist/* ../static/ && cd ../.. && cd core && go build -o ../build/blitzpress ."
  bin = "./build/blitzpress"
  delay = 1000
  include_ext = ["go", "tpl", "tmpl", "html"]
  include_dir = ["core"]
  exclude_dir = ["core/frontend/node_modules", "core/frontend/dist", "tmp", "build"]
  # CRITICAL: Watch for plugin .so changes in build/plugins/ to trigger restart
  include_file = ["build/plugins/**/*.so"]
  kill_delay = "1s"
```

### Plugin `.air.toml` (for example-plugin, runs separately)

```toml
root = "."
tmp_dir = "tmp"

[build]
  # Build frontend, copy assets, copy manifest, build .so
  cmd = """
    cd example-plugin/frontend && bun run build && \
    mkdir -p ../../build/plugins/example-plugin/frontend/assets && \
    cp -r dist/* ../../build/plugins/example-plugin/frontend/assets/ && \
    cp ../plugin.json ../../build/plugins/example-plugin/ && \
    cd .. && go build -buildvcs=false -buildmode=plugin -o ../build/plugins/example-plugin/plugin.so .
  """
  # Plugin air doesn't run a binary - it just builds
  bin = "echo 'Plugin built successfully' && sleep"
  args_bin = ["infinity"]
  delay = 1000
  include_ext = ["go", "ts", "tsx", "css"]
  include_dir = ["example-plugin"]
  exclude_dir = ["example-plugin/frontend/node_modules", "example-plugin/frontend/dist", "tmp"]
```

### How Air Restart Works for Plugin Changes

When a plugin's `.so` file is rebuilt and written to `/build/plugins/`, the **core's** air config detects the change via `include_file = ["build/plugins/**/*.so"]` and restarts the core binary. This way:

1. Plugin dev changes Go code or frontend code
2. Plugin's air rebuilds the `.so` and frontend assets
3. Core's air detects the new `.so` file
4. Core restarts, re-discovers and re-loads all plugins

---

## Manager CLI (`manager/`)

The manager is a separate Go binary for plugin management operations:

```
blitzpress-manager install <plugin-id>     # Download and install a plugin
blitzpress-manager remove <plugin-id>      # Remove a plugin
blitzpress-manager enable <plugin-id>      # Enable a disabled plugin
blitzpress-manager disable <plugin-id>     # Disable without removing
blitzpress-manager list                    # List all installed plugins
blitzpress-manager build <plugin-path>     # Build a plugin from source
```

For the initial implementation, keep this minimal - just `list` and `build` commands. The marketplace features come later.

---

## Async Event Bus (Beyond WordPress Hooks)

In addition to the synchronous WordPress-style hooks (actions/filters), BlitzPress has an **async event bus** for decoupled plugin-to-plugin communication.

**Why both?** Hooks are synchronous pipelines - `DoAction` waits for all handlers, `ApplyFilters` chains values through. The event bus is fire-and-forget async messaging for things like:
- `post.published` -> notification plugin sends email (shouldn't block the publish response)
- `user.registered` -> analytics plugin tracks event
- `payment.completed` -> fulfillment plugin processes order

### Backend Event Bus

```go
// plugin-sdk/events.go

type Event struct {
    Name      string
    PluginID  string         // Who emitted it
    Payload   map[string]any
    Timestamp time.Time
}

type EventHandler func(event Event) error

type EventBus interface {
    // Publish fires an event asynchronously - does not block the caller
    Publish(name string, payload map[string]any) error
    
    // Subscribe registers a handler for an event type
    Subscribe(name string, handler EventHandler) string
    
    // Unsubscribe removes a handler
    Unsubscribe(id string) bool
}
```

Added to the Registrar:

```go
type Registrar struct {
    Hooks  HookRegistry
    HTTP   HTTPRegistry
    Events EventBus       // Async event bus
    DB     *gorm.DB
    Logger Logger
    Config ConfigReader
}
```

**Implementation:** Uses Go channels internally. A goroutine pool processes events. Failed handlers are logged but don't affect publishers. Optional retry/dead-letter queue in the future.

### Frontend Event Bus

Mirror on the frontend side for real-time plugin communication:

```ts
interface FrontendEventBus {
    publish(name: string, payload: any): void;
    subscribe(name: string, handler: (event: any) => void): string;
    unsubscribe(id: string): boolean;
}
```

This is separate from the hook system. Hooks = synchronous transformation pipelines. Events = async notifications.

---

## Plugin Auto-Generated Settings UI

Plugins can declare a settings schema, and the core automatically renders a settings form at `/admin/plugins/{id}/settings`. Plugins can **optionally** provide a custom SolidJS component instead.

### Backend: Settings Schema Declaration

Plugins declare their settings schema through a filter during registration:

```go
func (p ExamplePlugin) Register(r *pluginsdk.Registrar) error {
    // Declare settings schema
    r.Settings.Register(pluginsdk.SettingsSchema{
        Sections: []pluginsdk.SettingsSection{
            {
                ID:    "general",
                Title: "General Settings",
                Fields: []pluginsdk.SettingsField{
                    {
                        ID:          "api_key",
                        Type:        "string",
                        Label:       "API Key",
                        Description: "Your external service API key",
                        Default:     "",
                        Required:    true,
                    },
                    {
                        ID:      "max_items",
                        Type:    "number",
                        Label:   "Maximum Items",
                        Default: 10,
                        Min:     1,
                        Max:     100,
                    },
                    {
                        ID:      "enabled",
                        Type:    "boolean",
                        Label:   "Enable Feature",
                        Default: true,
                    },
                    {
                        ID:      "mode",
                        Type:    "select",
                        Label:   "Operating Mode",
                        Options: []pluginsdk.SelectOption{
                            {Value: "basic", Label: "Basic"},
                            {Value: "advanced", Label: "Advanced"},
                        },
                        Default: "basic",
                    },
                },
            },
        },
    })
    return nil
}
```

### Backend: Settings Storage & API

The core provides automatic CRUD endpoints for plugin settings:

```
GET  /api/admin/plugins/{id}/settings         -> Returns current values + schema
PUT  /api/admin/plugins/{id}/settings         -> Save settings (validates against schema)
```

Settings are stored in a `plugin_settings` table: `(plugin_id, key, value_json)`.

Plugins read their settings via:
```go
val, err := r.Config.Get("api_key")       // Returns string
val, err := r.Config.GetInt("max_items")   // Returns int
```

### Frontend: Auto-Rendered Form

The core SolidJS app fetches the schema from `/api/admin/plugins/{id}/settings` and auto-renders form fields based on field types (`string` -> text input, `boolean` -> toggle, `number` -> number input, `select` -> dropdown, etc.).

### Frontend: Custom Settings Component Override

If a plugin needs a more complex settings UI, it can register a custom SolidJS component that **replaces** the auto-generated form:

```ts
// example-plugin/frontend/src/index.ts
registerPlugin({ id: "example-plugin", ... }, (registrar) => {
    // This overrides the auto-generated settings form
    registrar.settings.setCustomComponent(
        () => import("./pages/Settings")
    );
});
```

The custom component receives the current settings values and a save function as props. If no custom component is registered, the auto-generated form is used.

### Supported Field Types

| Type | Renders As | Go Type |
|------|-----------|---------|
| `string` | Text input | `string` |
| `text` | Textarea | `string` |
| `number` | Number input | `float64` |
| `boolean` | Toggle switch | `bool` |
| `select` | Dropdown | `string` |
| `color` | Color picker | `string` |
| `url` | URL input | `string` |
| `email` | Email input | `string` |

---

## Security Considerations

- `.so` plugins run **in-process** - a malicious plugin can crash the CMS or access all memory
- Plugin routes are automatically prefixed - plugins cannot hijack core routes
- Plugin database access is unrestricted (trust model) - plugins should prefix their tables
- Frontend plugin scripts execute in the same origin - full DOM access
- Future: plugin signing, capability-based permissions, sandboxing

---

## What NOT to Build Yet

- Docker configuration (explicitly excluded for now)
- Plugin marketplace / app store
- Plugin signing / verification
- Multi-tenant / multi-site
- Plugin dependency resolution (just load order for now)
- Advanced admin UI (just the plugin loading skeleton)

---

## Summary of Key Design Decisions

1. **Go `.so` plugins** (not HashiCorp go-plugin RPC, not WASM) - for direct in-process speed, same as reference project
2. **Single exported symbol `var Plugin`** instead of multiple function lookups
3. **`plugin.json` manifest** read before loading `.so` - validation before execution
4. **WordPress hook model** (`AddAction`/`DoAction`/`AddFilter`/`ApplyFilters`) with priority and `HookID` for removal
5. **Async event bus** alongside hooks - Go channels backend, pub/sub frontend, for decoupled plugin-to-plugin messaging
6. **Frontend plugins as ES modules** loaded at runtime via **browser import maps**, sharing the core's SolidJS instance (no duplication)
7. **`@blitzpress/vite-plugin`** shared Vite config package for plugin authors - handles externalization, output format, and conventions automatically
8. **Auto-generated settings UI** from declarative schema, with optional custom SolidJS component override per plugin
9. **Embedded static files** in both core and plugins via Go `embed`
10. **GORM** for database with Go-based migrations (not SQL files)
11. **GoFiber** as the HTTP framework
12. **Air** for hot-reload with plugin `.so` file watching triggering core restart
13. **Linux host** for native Go `.so` plugin support
