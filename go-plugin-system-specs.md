# Go Plugin System Specs for BlitzPress

## 1. Purpose

This document captures:

1. how the current codebase loads Go plugins today,
2. how the example plugin is built and mounted,
3. the architectural gaps in the current implementation,
4. a proposed next-generation plugin system for a composable web CMS with many backend and frontend plugins.

The goal is to preserve the spirit of the current `.so`-based Go plugin flow while upgrading it into a stable, typed, composable plugin platform with:

- backend route registration,
- backend action/filter hooks inspired by WordPress,
- public frontend SolidJS extensions,
- a public Go `pluginsdk` package in the same workspace,
- a public frontend CMS plugin SDK,
- enough structure to support an app-store-like plugin ecosystem later.

---

## 2. Current Codebase Snapshot

## Workspace layout

Relevant modules and apps:

- `core/` - Go Fiber backend entrypoint
- `common/` - shared Go package currently acting as a minimal plugin SDK
- `packages/example-plugin/` - current example Go plugin
- `frontend/` - SolidJS app
- `go.work` - links the Go workspace modules:
  - `./common`
  - `./core`
  - `./packages/example-plugin`

## Runtime topology

Current request flow:

1. `nginx` receives requests on port `3000`
2. `/` is proxied to the SolidJS Vite frontend
3. `/api` is proxied to `core`
4. `core` loads plugin `.so` files from `../build`
5. loaded plugins can mount Fiber routes under `/api/{plugin-name}`

From `vhost.conf`:

- `/` -> `frontend:80`
- `/api` -> `core:80`

From `docker-compose.yml`:

- `core` depends on `example-plugin`
- both mount the whole repo into `/app`
- the example plugin builds a `.so` file into `/app/build`

---

## 3. Current Backend Plugin Flow

The active implementation is in `core/main.go`.

## Startup flow

At startup, `core` does the following:

1. creates a Fiber app,
2. creates a separate `api` Fiber app and mounts it at `/api`,
3. serves embedded static files from `core/static/*`,
4. initializes an in-memory `actions` map:

```go
actions := map[string][](func() interface{}){}
```

5. walks `../build`,
6. loads every file ending in `.so`,
7. opens the shared object with `plugin.Open`,
8. looks up two required symbols:
   - `PluginRegister`
   - `PluginInit`
9. calls `PluginRegister()` to get plugin metadata,
10. constructs a tiny SDK with:
    - `AddAction`
    - `RemoveAction` (currently unimplemented),
11. calls `PluginInit(sdk)`,
12. after all plugins are loaded, it iterates through the `actions` map,
13. if an action name is `"routes"`, it:
    - creates a new Fiber app for that hook,
    - invokes the plugin route callback,
    - mounts that sub-app at `/api/{pluginName}`.

## Symbol contract used today

Each `.so` plugin must export:

```go
func PluginRegister() common.PluginInfo
func PluginInit(sdk common.PluginSdk)
```

## Current action registration contract

`common.PluginSdk` currently exposes:

```go
type PluginSdk struct {
    AddAction    func(name string, callback func(args ...interface{}) interface{})
    RemoveAction func(name string)
}
```

Inside `core/main.go`, `AddAction` wraps the callback into a closure that captures the plugin name, then stores it in `actions[name]`.

## How route hooks are executed today

The `"routes"` hook is special-cased after all plugins are loaded:

```go
for action, hooks := range actions {
    for _, hook := range hooks {
        if action == "routes" {
            routeHook := hook().(struct {
                pluginName string
                hook       func(args ...interface{}) interface{}
            })
            pluginApp := fiber.New()
            routeHook.hook(pluginApp)
            api.Mount(routeHook.pluginName, pluginApp)
        }
    }
}
```

Important consequences:

- only the `"routes"` action has runtime meaning right now,
- hooks are not executed through a generic dispatcher,
- action execution is untyped,
- there is no priority ordering,
- there is no filter pipeline,
- there is no plugin dependency graph,
- there is no activation/deactivation state,
- there is no formal manifest beyond name and version.

---

## 4. Current Shared Go SDK (`common`)

The current shared package lives in `common/common.go`.

It defines:

```go
type PluginInfo struct {
    Name    string
    Version string
}

type PluginSdk struct {
    AddAction    func(name string, callback func(args ...interface{}) interface{})
    RemoveAction func(name string)
}
```

and a helper:

```go
func PluginSdkRouteParams(args []interface{}) (*fiber.App, error)
```

This helper tries to cast the first variadic argument into `*fiber.App`.

## What this means

`common` is already functioning as the first draft of a public Go plugin SDK, but it is too small and too loosely typed to scale to a CMS with many plugins.

It should evolve into a dedicated, stable workspace package such as:

- `common/pluginsdk`, or
- `packages/pluginsdk`

with versioned public contracts.

---

## 5. How the Example Plugin Works Today

The example plugin lives in `packages/example-plugin/main.go`.

## Exported entrypoints

It exports:

```go
func PluginRegister() common.PluginInfo
func PluginInit(sdk common.PluginSdk)
```

`PluginRegister()` returns:

```go
common.PluginInfo{
    Name:    "example-plugin",
    Version: "0.0.1",
}
```

## What `PluginInit` does

It registers two `"routes"` actions:

1. a custom API route:

```go
app.Get("/plugin", func(c *fiber.Ctx) error {
    ip := c.IP()
    return c.SendString(fmt.Sprintf("hello from plugin2 ! IP=%s", ip))
})
```

2. a static file server using embedded plugin assets:

```go
app.Use("/", filesystem.New(filesystem.Config{
    Root:       http.FS(staticContent),
    PathPrefix: "/static",
    Browse:     true,
}))
```

The plugin also embeds `packages/example-plugin/static/index.html`.

## Resulting routes

After loading, the plugin is mounted under:

```text
/api/example-plugin
```

So the plugin serves:

- `GET /api/example-plugin/plugin`
- `GET /api/example-plugin/`

## Build flow

The plugin `.air.toml` builds it with:

```bash
go build -buildvcs=false -buildmode=plugin -o ../../build/example-plugin.so .
```

That means:

- package type must be `main`,
- output is a shared object,
- the artifact lands in `build/example-plugin.so`,
- `core` later discovers it by scanning `../build`.

---

## 6. Strengths of the Current Design

The current approach already proves several useful ideas:

1. **shared workspace contracts**  
   The host and plugin share Go types through the workspace.

2. **plugin-local static assets**  
   A plugin can embed and serve its own files.

3. **plugin-local route registration**  
   A plugin can attach backend routes without editing `core`.

4. **simple discovery model**  
   Dropping `.so` files into a build directory is easy to understand.

5. **good first step toward an app ecosystem**  
   The model is small but demonstrates real dynamic extension.

---

## 7. Current Weaknesses and Scaling Problems

For a large CMS plugin ecosystem, the current version has major limitations.

## 7.1 Untyped extensibility surface

The current contract is:

```go
func(args ...interface{}) interface{}
```

That makes plugin APIs:

- hard to discover,
- hard to validate,
- error-prone,
- difficult for future agents and humans to use safely.

## 7.2 `RemoveAction` cannot work as designed

Right now hooks are anonymous callbacks stored in slices. There is no stable handle, ID, or callback identity. A WordPress-style removal system needs:

- a hook name,
- a callback handle or registration ID,
- optional priority,
- plugin ownership metadata.

## 7.3 Only one hook type really exists

There is an `actions` map, but only `"routes"` is actually interpreted by the runtime.

There is no:

- generic `DoAction`,
- generic `ApplyFilters`,
- event context,
- cancellation/error propagation strategy.

## 7.4 No plugin manifest

The host only knows:

- `Name`
- `Version`

It does not know:

- slug,
- display name,
- description,
- author,
- dependencies,
- compatibility,
- capabilities,
- whether the plugin has frontend assets,
- whether it exposes admin UI,
- whether it has migrations/jobs/commands.

## 7.5 No frontend plugin story

The SolidJS app is currently static. There is no first-class way for a plugin to contribute:

- pages,
- widgets,
- menu items,
- desktop launchers,
- settings panels,
- form fields,
- dashboards,
- editor blocks,
- client-side hooks/filters.

## 7.6 `plugin` package constraints

Per Go's own `plugin` package documentation, `.so` plugins have important drawbacks:

- intended for Linux, FreeBSD, and macOS rather than portable Windows execution,
- host and plugins must use the same toolchain/build settings,
- shared dependencies must come from the same source versions,
- runtime crashes can happen if binaries drift,
- deployment is more fragile than a single static executable.

This does **not** mean the approach is unusable. It means the build and compatibility rules must be explicit.

## 7.7 No compatibility guarantees

The system currently does not verify:

- host SDK version compatibility,
- plugin ABI expectations,
- required hooks,
- dependency versions,
- checksum/signature validity.

## 7.8 No lifecycle separation

There is no distinction between:

- discovery,
- validation,
- loading,
- bootstrapping,
- route registration,
- ready state,
- shutdown.

For a big CMS, that lifecycle must become explicit.

---

## 8. Target Architecture

The improved system should keep the current philosophy but formalize it into three public contracts:

1. **Go backend plugin SDK**
2. **SolidJS frontend plugin SDK**
3. **Plugin package manifest format**

The plugin system should support:

- backend HTTP routes,
- backend hooks/actions/filters,
- frontend pages and components,
- admin shell extensions,
- plugin-to-plugin composition,
- deterministic load order,
- metadata-driven discovery,
- future app-store packaging.

---

## 9. Proposed Workspace Structure

Recommended shape:

```text
go.work
common/
  pluginsdk/
    manifest.go
    hooks.go
    route.go
    assets.go
    context.go
    errors.go
core/
  internal/plugins/
    discover.go
    loader.go
    registry.go
    hooks.go
    manifest.go
    runtime.go
    http.go
frontend/
  src/
    cms/
      plugin-runtime/
        registry.ts
        hooks.ts
        loader.ts
        types.ts
  packages/
    cms-plugin-sdk/
      src/
        index.ts
        hooks.ts
        registry.ts
        components.ts
plugins/
  example/
    plugin.json
    backend/
      main.go
    frontend/
      src/
        index.ts
        pages/
        widgets/
```

If you want to keep the current module style, `packages/example-plugin` is fine, but a `plugins/<slug>` layout will become clearer as plugin count grows.

---

## 10. Proposed Plugin Packaging Model

Each plugin should be a directory, not just a loose `.so`.

Recommended packaged artifact:

```text
build/plugins/example-plugin/
  plugin.json
  backend/
    plugin.so
  frontend/
    manifest.json
    assets/
      index.js
      index.css
      ...
  checksums.txt
```

## Why this is better than scanning only `.so`

Scanning only `.so` files tells the host almost nothing. Scanning plugin directories with a manifest gives the host enough information to:

- validate compatibility before loading code,
- know whether frontend assets exist,
- expose plugin metadata to the CMS UI,
- order plugins by dependencies,
- enable plugin installation/activation UX later.

---

## 11. Proposed `plugin.json` Manifest

Example:

```json
{
  "schemaVersion": 1,
  "id": "example-plugin",
  "name": "Example Plugin",
  "version": "0.1.0",
  "description": "Demonstrates backend routes, frontend pages, and hooks.",
  "author": "BlitzPress",
  "backend": {
    "entry": "backend/plugin.so",
    "goSdkVersion": "0.1.0"
  },
  "frontend": {
    "entry": "frontend/manifest.json",
    "sdkVersion": "0.1.0"
  },
  "compatibility": {
    "cms": ">=0.1.0",
    "api": "v1"
  },
  "dependencies": [
    {
      "id": "users",
      "version": ">=0.1.0",
      "optional": true
    }
  ],
  "capabilities": [
    "admin.routes",
    "admin.widgets",
    "api.routes",
    "hooks"
  ]
}
```

## Required manifest fields

- `schemaVersion`
- `id` - stable slug, filesystem-safe, URL-safe
- `name`
- `version`
- `backend.entry` if backend exists
- `frontend.entry` if frontend exists

## Important rules

- `id` is the canonical plugin identifier
- `name` is display-only
- route prefixes should use `id`, not display name
- version compatibility should be semver-based
- capability flags should be explicit

---

## 12. Public Go SDK Specification

The current `common` package should evolve into a stable public package:

```text
common/pluginsdk
```

This package should be treated as the contract between host and plugins.

## 12.1 Core exported types

Suggested base types:

```go
package pluginsdk

type Manifest struct {
    ID          string
    Name        string
    Version     string
    Description string
    Author      string
    Capabilities []string
}

type Plugin interface {
    Manifest() Manifest
    Register(*Registrar) error
}
```

Recommended exported symbol from each backend plugin:

```go
var Plugin pluginsdk.Plugin
```

This is simpler than requiring multiple symbol lookups like `PluginRegister` and `PluginInit`.

Alternative acceptable contract:

```go
func Plugin() pluginsdk.Plugin
```

Either is fine, but pick one and keep it stable.

## 12.2 Registrar surface

The runtime should pass a typed registrar instead of an untyped function bag.

Example:

```go
type Registrar struct {
    Hooks     HookRegistry
    HTTP      HTTPRegistry
    Assets    AssetRegistry
    Services  ServiceRegistry
    Scheduler SchedulerRegistry
    Logger    Logger
    Config    ConfigReader
}
```

The plugin should use registries rather than mutating host internals directly.

## 12.3 HTTP registration

Avoid passing raw `*fiber.App` everywhere. Use a typed router registrar.

Example:

```go
type HTTPRegistry interface {
    API(prefix string, fn func(r fiber.Router)) error
    Admin(prefix string, fn func(r fiber.Router)) error
    Public(prefix string, fn func(r fiber.Router)) error
}
```

This keeps route ownership explicit and lets the host enforce:

- prefix isolation,
- auth middleware,
- permission middleware,
- request logging,
- route introspection.

Recommended mount model:

- plugin API routes -> `/api/plugins/{pluginID}/...`
- plugin admin routes -> `/api/admin/plugins/{pluginID}/...`
- plugin public assets -> `/plugins/{pluginID}/assets/...`

---

## 13. WordPress-Style Hooks for Go

You want `add_action` and `add_filter` inspiration. That is a very good fit for a CMS.

The system should explicitly support both.

## 13.1 Actions vs filters

### Actions

Actions are event notifications. They do not transform a value.

Examples:

- `core.booting`
- `core.ready`
- `user.created`
- `post.saved`
- `menu.admin.build`
- `dashboard.widgets.collect`

### Filters

Filters accept a value, transform it, then return the new value.

Examples:

- `editor.blocks`
- `menu.items`
- `auth.login.response`
- `settings.schema`
- `frontend.desktop.shortcuts`

## 13.2 Required hook API

Suggested backend hook registry:

```go
type HookID string

type HookOptions struct {
    Priority int
    Owner    string
}

type HookContext struct {
    PluginID string
    RequestID string
    UserID string
    Metadata map[string]any
}

type ActionFunc func(ctx *HookContext, args ...any) error
type FilterFunc func(ctx *HookContext, value any, args ...any) (any, error)

type HookRegistry interface {
    AddAction(name string, fn ActionFunc, opts HookOptions) HookID
    AddFilter(name string, fn FilterFunc, opts HookOptions) HookID
    RemoveAction(name string, id HookID) bool
    RemoveFilter(name string, id HookID) bool
    DoAction(ctx *HookContext, name string, args ...any) error
    ApplyFilters(ctx *HookContext, name string, value any, args ...any) (any, error)
}
```

## 13.3 Why IDs solve `RemoveAction`

Instead of trying to remove anonymous functions by name, every registration returns a stable `HookID`.

Example:

```go
id := sdk.Hooks.AddAction("core.ready", fn, pluginsdk.HookOptions{
    Priority: 20,
})

sdk.Hooks.RemoveAction("core.ready", id)
```

This is the correct equivalent of the current unfinished `RemoveAction`.

## 13.4 Priority rules

Use WordPress-like ordering:

- lower number runs earlier
- default priority = `10`
- same priority preserves registration order

This makes plugin composition predictable.

## 13.5 Typed helper wrappers

Even if the internal engine uses `any`, the SDK should expose typed helper wrappers for common contracts.

Examples:

- `AddMenuFilter`
- `AddDashboardWidget`
- `AddSettingsSection`
- `AddEditorBlock`
- `OnPostSaved`

This reduces plugin mistakes and gives future agents a clearer target API.

---

## 14. Backend Route and Service Registration

Backend plugins should be able to contribute more than routes.

Recommended registration categories:

- API routes
- admin-only routes
- public routes
- middleware
- scheduled jobs
- CLI commands
- migrations
- settings schema
- permission definitions

## Suggested backend registration API

```go
type Registrar struct {
    HTTP  HTTPRegistry
    Hooks HookRegistry
}

type HTTPRegistry interface {
    API(prefix string, fn func(r fiber.Router)) error
    Admin(prefix string, fn func(r fiber.Router)) error
    Public(prefix string, fn func(r fiber.Router)) error
}
```

## Example backend plugin

```go
package main

import (
    "github.com/gofiber/fiber/v2"
    "github.com/andreitelteu/hestia-go/common/pluginsdk"
)

type ExamplePlugin struct{}

func (ExamplePlugin) Manifest() pluginsdk.Manifest {
    return pluginsdk.Manifest{
        ID:      "example-plugin",
        Name:    "Example Plugin",
        Version: "0.1.0",
    }
}

func (ExamplePlugin) Register(r *pluginsdk.Registrar) error {
    r.HTTP.API("/", func(router fiber.Router) {
        router.Get("/plugin", func(c *fiber.Ctx) error {
            return c.JSON(fiber.Map{"plugin": "example-plugin"})
        })
    })

    r.Hooks.AddAction("core.ready", func(ctx *pluginsdk.HookContext, args ...any) error {
        return nil
    }, pluginsdk.HookOptions{Priority: 10})

    return nil
}

var Plugin ExamplePlugin
```

That is more readable and more extensible than the current `PluginRegister` + `PluginInit` + `args ...interface{}` approach.

---

## 15. Frontend Plugin System Specification

The backend alone is not enough for a composable CMS. The frontend must also become extensible.

The SolidJS app should expose a public CMS frontend plugin SDK with:

- component registration,
- route/page registration,
- desktop launcher registration,
- menu injection,
- dashboard widget registration,
- settings screen extension,
- editor block registration,
- frontend hooks/actions/filters.

## 15.1 Do not rely only on ad-hoc globals

You mentioned:

- global window variables on Windows, or
- a SolidJS plugin SDK like the Go one.

The best approach is:

1. **primary contract:** a typed frontend SDK package
2. **optional runtime bridge:** expose a stable `window.BlitzPress` global for dynamically loaded bundles

That gives both:

- a clean package API for first-party plugins,
- a runtime host bridge for late-loaded plugin bundles.

## 15.2 Frontend SDK package

Recommended package:

```text
frontend/packages/cms-plugin-sdk
```

Suggested API:

```ts
export interface CmsPluginModule {
  manifest: FrontendManifest;
  register(registrar: FrontendRegistrar): void;
}

export interface FrontendRegistrar {
  pages: {
    add(page: PageDefinition): void;
  };
  desktop: {
    addShortcut(shortcut: DesktopShortcut): void;
  };
  widgets: {
    add(widget: DashboardWidget): void;
  };
  hooks: FrontendHookRegistry;
  components: {
    register(name: string, component: Component<any>): void;
  };
}
```

## 15.3 Frontend manifest

Example:

```json
{
  "pluginId": "example-plugin",
  "entry": "/plugins/example-plugin/assets/index.js",
  "style": "/plugins/example-plugin/assets/index.css"
}
```

## 15.4 Frontend load model

At app bootstrap:

1. frontend requests plugin manifests from the backend
2. backend returns enabled plugins with frontend assets
3. frontend dynamically imports each plugin bundle
4. each bundle calls `register(registrar)`
5. the host merges contributions into runtime registries

This is more robust than hardcoding arrays inside `frontend/src/App.tsx`.

## 15.5 Frontend registry targets

The current `App.tsx` already has a `pages` array and a window manager launcher list. That should become plugin-driven.

Replace hardcoded definitions like:

```ts
const pages = [
  {
    page: 'Guest/Login',
    label: 'Login',
    icon: () => <p>icon</p>,
  }
]
```

with runtime registries such as:

- desktop shortcuts,
- page components,
- window definitions,
- admin menu sections.

## 15.6 Recommended frontend extension points

At minimum:

- `desktop.shortcuts`
- `window.components`
- `admin.menu.items`
- `dashboard.widgets`
- `settings.sections`
- `editor.blocks`
- `form.fieldTypes`
- `command.palette.items`

## 15.7 Frontend actions and filters

Mirror the backend WordPress-style API:

```ts
hooks.addAction('desktop.ready', callback, { priority: 10 })
hooks.addFilter('admin.menu.items', callback, { priority: 10 })
hooks.doAction('desktop.ready', payload)
hooks.applyFilters('admin.menu.items', items)
```

Example filter:

```ts
hooks.addFilter('desktop.shortcuts', (shortcuts) => [
  ...shortcuts,
  {
    id: 'example-plugin.launcher',
    title: 'Example Plugin',
    component: 'example-plugin/home',
  },
]);
```

---

## 16. Frontend Bundle Delivery

There are two good ways to expose plugin frontend code.

## Option A - plugin assets served by backend

Each plugin ships built JS/CSS assets in its packaged directory. The backend exposes them under:

```text
/plugins/{pluginID}/assets/*
```

Pros:

- simple deployment,
- same origin,
- plugin bundle version tied to plugin package,
- easy app-store packaging later.

This is the recommended default.

## Option B - host-managed asset manifest

The CMS copies or fingerprints plugin assets into a centralized host asset directory during install/activation.

Pros:

- easy cache busting,
- uniform asset serving.

Cons:

- more packaging complexity.

For BlitzPress, start with **Option A**.

---

## 17. Recommended Runtime Lifecycle

The host should have an explicit plugin lifecycle:

1. **Discover**  
   Scan plugin directories for `plugin.json`

2. **Parse manifest**  
   Validate schema and required fields

3. **Check compatibility**  
   CMS version, Go SDK version, frontend SDK version, dependency constraints

4. **Sort dependencies**  
   Topologically order plugins

5. **Load backend plugin**  
   `plugin.Open` backend `.so`

6. **Resolve exported plugin symbol**  
   Get `Plugin`

7. **Register contributions**  
   Routes, actions, filters, widgets, settings, etc.

8. **Load frontend manifests**  
   Make frontend assets discoverable to the SPA

9. **Activate plugin**

10. **Emit lifecycle hooks**  
    `plugins.loaded`, `plugin.activated`, `core.ready`

This lifecycle should be internalized in `core/internal/plugins`.

---

## 18. How Discovery Should Change

Current discovery:

- walk `../build`
- load every `.so`

Recommended discovery:

- walk `../build/plugins`
- for each directory:
  - read `plugin.json`
  - validate manifest
  - record backend/frontend entries
  - only then load backend `.so`

This creates a clean contract:

```text
plugin directory = installable unit
manifest = source of truth
.so = only one artifact within that unit
```

---

## 19. Compatibility Rules for `.so` Plugins

If you keep Go native plugins, the rules must be strict and documented.

## Required build guarantees

Host and plugin must be built with:

- the same Go version,
- the same OS/architecture target,
- the same important build flags,
- the same versions of shared dependencies,
- the same `pluginsdk` source.

## Recommended enforcement

Embed a compatibility block into both host and plugin:

```json
{
  "goVersion": "1.21.x",
  "sdkVersion": "0.1.0",
  "targetOS": "linux",
  "targetArch": "amd64"
}
```

The loader should reject plugins that do not match.

## Practical recommendation

For local Windows development, do not assume native `.so` loading will be the portable path. Prefer building and running plugin-loading flows in Linux containers, which already matches your Docker setup.

---

## 20. Build System Procedure

Each plugin should build both backend and frontend outputs.

## Backend build

Recommended command:

```bash
go build -buildvcs=false -buildmode=plugin -o ../../build/plugins/example-plugin/backend/plugin.so ./backend
```

## Frontend build

Recommended command:

```bash
vite build --config frontend.vite.config.ts
```

or equivalent plugin-local frontend build that outputs:

```text
../../build/plugins/example-plugin/frontend/assets/
```

## Manifest copy

Copy:

- `plugin.json`
- backend `.so`
- frontend manifest/assets

into one packaged plugin directory.

## Recommended packaged output

```text
build/plugins/example-plugin/
  plugin.json
  backend/plugin.so
  frontend/manifest.json
  frontend/assets/index.js
  frontend/assets/index.css
```

---

## 21. Recommended Backend Loader Responsibilities

The plugin loader should own:

- discovery,
- manifest parsing,
- compatibility checks,
- dependency ordering,
- symbol lookup,
- registration orchestration,
- plugin registry storage.

Suggested internal registry shape:

```go
type LoadedPlugin struct {
    Manifest       pluginsdk.Manifest
    Path           string
    BackendLoaded  bool
    FrontendLoaded bool
    Status         string
    Errors         []error
}
```

The host should keep a runtime plugin registry so it can expose:

- plugin list APIs,
- admin plugin management screens,
- health/error status,
- enabled/disabled state later.

---

## 22. Example Improved Backend APIs

These are the most useful APIs for a CMS plugin ecosystem.

## 22.1 Route registration

```go
r.HTTP.API("/", func(router fiber.Router) {
    router.Get("/health", healthHandler)
})
```

## 22.2 Menu filter

```go
r.Hooks.AddFilter("admin.menu.items", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
    items := value.([]pluginsdk.MenuItem)
    items = append(items, pluginsdk.MenuItem{
        ID:    "example-plugin.menu",
        Label: "Example Plugin",
        Path:  "/admin/plugins/example-plugin",
    })
    return items, nil
}, pluginsdk.HookOptions{Priority: 20})
```

## 22.3 Dashboard widget action

```go
r.Hooks.AddAction("dashboard.widgets.collect", func(ctx *pluginsdk.HookContext, args ...any) error {
    // register a widget descriptor or push into a shared collector
    return nil
}, pluginsdk.HookOptions{Priority: 10})
```

## 22.4 Settings schema filter

```go
r.Hooks.AddFilter("settings.schema", func(ctx *pluginsdk.HookContext, value any, args ...any) (any, error) {
    schema := value.(pluginsdk.SettingsSchema)
    // mutate schema
    return schema, nil
}, pluginsdk.HookOptions{Priority: 10})
```

---

## 23. Example Improved Frontend APIs

## 23.1 Register a page

```ts
register({
  pages: {
    add({
      id: 'example-plugin.home',
      path: '/plugins/example-plugin',
      title: 'Example Plugin',
      component: lazy(() => import('./pages/Home')),
    });
  }
})
```

## 23.2 Register a desktop shortcut

```ts
registrar.desktop.addShortcut({
  id: 'example-plugin.shortcut',
  title: 'Example Plugin',
  icon: ExampleIcon,
  open: {
    type: 'window',
    component: 'example-plugin.home',
  },
});
```

## 23.3 Register a global component

```ts
registrar.components.register('example-plugin.card', ExampleCard);
```

This is better than unmanaged globals because:

- names are versionable,
- ownership is explicit,
- collisions can be detected,
- host registries can validate contracts.

If needed, expose this registry through:

```ts
window.BlitzPress.components.register(...)
```

but the registry should still be backed by the SDK and host runtime.

---

## 24. Naming and URL Conventions

Use consistent IDs everywhere.

## Plugin ID

Use lowercase kebab-case:

```text
example-plugin
blog-editor
mail-queue
```

## Backend URL conventions

Recommended:

- `/api/plugins/{pluginID}/...`
- `/api/admin/plugins/{pluginID}/...`
- `/plugins/{pluginID}/assets/...`

Avoid mounting directly at arbitrary top-level paths.

## Frontend registry IDs

Use namespaced keys:

```text
example-plugin.home
example-plugin.shortcut
example-plugin.widget.stats
example-plugin.settings.general
```

This prevents collisions.

---

## 25. Security and Trust Model

For a CMS with many plugins, the trust model must be explicit.

## Important facts

- Go `.so` plugins run in-process
- a malicious or buggy plugin can crash the host
- a plugin can access shared memory and host types
- frontend plugins can inject UI and execute client-side code

## Minimum safeguards

- only load enabled plugins from trusted locations,
- validate plugin manifest schema,
- validate compatibility versions,
- keep a plugin allowlist or signed plugin source later,
- isolate route prefixes,
- require explicit capability declarations,
- expose plugin status and load errors in admin UI.

For an eventual marketplace, add:

- signatures,
- checksums,
- approval/review flow,
- capability review at install time.

---

## 26. Recommended MVP Scope for the Next Iteration

A practical next version should implement these in order:

## Phase 1 - formalize backend SDK

- create `common/pluginsdk`
- replace `common.PluginSdk`
- introduce typed manifest
- introduce typed registrar
- introduce `HookRegistry`
- introduce `HookID` and priority

## Phase 2 - formalize backend discovery

- switch from loose `.so` scan to `plugin.json` directory scan
- load backend entry from manifest
- validate compatibility
- build runtime plugin registry

## Phase 3 - formalize route registration

- replace raw `routes` action with `HTTPRegistry`
- use predictable prefixes
- add admin/public/API route categories

## Phase 4 - frontend plugin runtime

- create `frontend/packages/cms-plugin-sdk`
- create frontend plugin manifest format
- load frontend plugin bundles dynamically
- replace hardcoded desktop/page registries with plugin-driven registries

## Phase 5 - richer CMS extension points

- admin menu filters
- dashboard widgets
- settings schema
- editor blocks
- command palette
- notifications

## Phase 6 - plugin management UX

- installed/enabled/disabled state
- plugin registry API
- admin plugin screen
- load errors and compatibility warnings

---

## 27. Recommended Final Contracts

If you want future agents to build against a clean target, this is the contract I would anchor on.

## Backend plugin contract

- packaged as a plugin directory with `plugin.json`
- backend entry is a Linux-built `.so`
- exported symbol is a single stable `Plugin`
- plugin implements:
  - `Manifest()`
  - `Register(*Registrar) error`

## Backend host contract

- discovers plugins via manifest
- validates compatibility before loading
- exposes typed registries for:
  - HTTP
  - hooks
  - assets
  - settings
  - services

## Frontend plugin contract

- frontend bundle ships alongside plugin
- host loads plugin bundles dynamically from manifest
- plugin registers pages, widgets, shortcuts, and components through a typed SDK
- frontend exposes WordPress-style actions and filters too

## Hook contract

- `AddAction`
- `AddFilter`
- `DoAction`
- `ApplyFilters`
- `RemoveAction`
- `RemoveFilter`
- priority and stable registration IDs

---

## 28. What Should Replace the Current Example Plugin

The current example plugin is good as a proof of concept, but the next example plugin should demonstrate all of these:

1. backend API route,
2. backend action registration,
3. backend filter registration,
4. frontend page registration,
5. frontend desktop shortcut,
6. static asset serving,
7. manifest-driven packaging.

That single plugin would become the canonical reference implementation for future plugin authors and future agents.

---

## 29. Summary

The current codebase already has the seed of a real plugin platform:

- `core` scans and loads `.so` files,
- `common` acts as the first shared SDK,
- `example-plugin` proves route and static asset registration,
- `frontend` already has a desktop/window-manager shell that can evolve into a plugin-driven UI.

The right next step is **not** to abandon the existing direction. It is to formalize it:

- promote `common` into a real public `pluginsdk`,
- replace untyped hooks with typed registries,
- introduce manifest-driven plugin packaging,
- add WordPress-style actions and filters properly,
- add a first-class SolidJS frontend plugin SDK,
- treat each plugin as a package containing backend, frontend, and metadata.

That gives BlitzPress a strong foundation for a composable CMS with many plugins, while staying close to the current architecture and build style already present in the repo.
