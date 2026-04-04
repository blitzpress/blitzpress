# Requirements Document

## Introduction

BlitzPress is a high-performance, plugin-driven CMS built in Go with a SolidJS frontend. It draws architectural inspiration from WordPress's extensibility model (hooks, filters, actions) but replaces PHP with Go compiled `.so` plugins for performance and type safety, and replaces the traditional server-rendered frontend with an embedded SolidJS SPA. The system is a monorepo with four modules: `core/`, `plugin-sdk/`, `manager/`, and `example-plugin/`.

---

## Requirements

### Requirement 1: Monorepo Project Structure

**User Story:** As a developer, I want a well-organized Go workspace monorepo, so that all modules (core, plugin-sdk, manager, example-plugin) share dependencies cleanly and can be developed together.

#### Acceptance Criteria

1. WHEN the developer runs `go work sync` THEN the Go workspace SHALL resolve all local module references (`core`, `plugin-sdk`, `manager`, `example-plugin`) without replace directives.
2. WHEN the project is cloned THEN the directory structure SHALL contain `core/`, `plugin-sdk/`, `manager/`, `example-plugin/`, `build/`, and `scripts/` at the root level.
3. WHEN `go build` is run in any module THEN it SHALL compile successfully using the shared `plugin-sdk` module from the workspace.
4. WHEN `go.work` is read THEN it SHALL list `./core`, `./plugin-sdk`, `./manager`, and `./example-plugin` as workspace members using Go 1.24+.

---

### Requirement 2: Plugin SDK (`plugin-sdk/`)

**User Story:** As a plugin author, I want a stable, typed Go SDK package, so that I can build plugins against well-defined interfaces without depending on core internals.

#### Acceptance Criteria

1. The `plugin-sdk` module SHALL export a `Plugin` interface requiring `Manifest() Manifest` and `Register(r *Registrar) error` methods.
2. The `Manifest` struct SHALL require `ID` (kebab-case, URL-safe unique slug), `Name` (display string), and `Version` (semver `major.minor.patch`) fields, with optional `Description` and `Author`.
3. The `Registrar` struct SHALL provide access to `Hooks` (HookRegistry), `HTTP` (HTTPRegistry), `Events` (EventBus), `DB` (*gorm.DB), `Settings` (SettingsRegistry), `Logger`, and `Config` (ConfigReader).
4. WHEN a plugin author imports `plugin-sdk` THEN they SHALL be able to implement the `Plugin` interface and export it as `var Plugin pluginsdk.Plugin` without importing any `core/internal` packages.
5. The SDK SHALL NOT import `core` or any internal core packages -- the dependency direction is strictly one-way (plugins depend on SDK, core depends on SDK, plugins never depend on core).

---

### Requirement 3: WordPress-Style Hook System

**User Story:** As a plugin author, I want to register actions and filters with priority ordering, so that I can extend CMS behavior and transform data pipelines like WordPress's `add_action`/`add_filter` system.

#### Acceptance Criteria

1. The `HookRegistry` interface SHALL expose `AddAction(name string, fn ActionFunc, opts ...HookOptions) HookID` for registering event callbacks.
2. The `HookRegistry` interface SHALL expose `AddFilter(name string, fn FilterFunc, opts ...HookOptions) HookID` for registering value-transformation callbacks.
3. The `HookRegistry` interface SHALL expose `DoAction(ctx *HookContext, name string, args ...any) error` that invokes all registered action callbacks for the given hook name in priority order.
4. The `HookRegistry` interface SHALL expose `ApplyFilters(ctx *HookContext, name string, value any, args ...any) (any, error)` that passes a value through all registered filter callbacks in priority order and returns the final transformed value.
5. WHEN `HookOptions.Priority` is not provided THEN the system SHALL default to priority `10`.
6. WHEN multiple hooks share the same priority THEN the system SHALL execute them in registration order.
7. WHEN `AddAction` or `AddFilter` is called THEN it SHALL return a stable `HookID` that can be used with `RemoveAction(name, id)` or `RemoveFilter(name, id)` to unregister the callback.
8. The `HookContext` SHALL carry `PluginID`, `RequestID`, and `Metadata map[string]any` so callbacks have runtime context.
9. The core SHALL fire built-in action hooks: `core.booting` (before plugin load), `core.ready` (after all plugins loaded), `core.shutdown` (on server stop), and `plugin.loaded` (after each plugin loads).
10. The core SHALL fire built-in filter hooks: `admin.menu.items`, `dashboard.widgets`, and `settings.schema` at appropriate points.

---

### Requirement 4: Async Event Bus

**User Story:** As a plugin author, I want to publish and subscribe to asynchronous events, so that plugins can communicate without blocking request handlers or creating tight coupling.

#### Acceptance Criteria

1. The `EventBus` interface SHALL expose `Publish(name string, payload map[string]any) error` that dispatches an event asynchronously without blocking the caller.
2. The `EventBus` interface SHALL expose `Subscribe(name string, handler EventHandler) string` that registers a handler and returns a subscription ID.
3. The `EventBus` interface SHALL expose `Unsubscribe(id string) bool` to remove a previously registered handler.
4. The `Event` struct SHALL contain `Name`, `PluginID` (emitter), `Payload map[string]any`, and `Timestamp`.
5. WHEN an event handler fails THEN the error SHALL be logged but SHALL NOT affect the publisher or other subscribers.
6. The backend implementation SHALL use Go channels and a goroutine worker pool for event processing.
7. The frontend SHALL expose a mirrored `FrontendEventBus` with `publish`, `subscribe`, and `unsubscribe` methods for client-side plugin-to-plugin communication.

---

### Requirement 5: Plugin Manifest (`plugin.json`)

**User Story:** As the CMS core, I want each plugin to declare its metadata in a `plugin.json` manifest, so that I can validate compatibility, discover frontend assets, and display plugin info without loading the `.so`.

#### Acceptance Criteria

1. Every plugin directory in `build/plugins/{id}/` SHALL contain a `plugin.json` file.
2. The manifest SHALL require fields: `schema_version` (integer), `id` (kebab-case slug), `name` (display string), `version` (semver string), and `sdk_version` (semver string).
3. IF the plugin has frontend assets THEN the manifest SHALL include `has_frontend: true`, `frontend_entry` (path to JS bundle), and optionally `frontend_style` (path to CSS).
4. The manifest MAY include `description`, `author`, and `capabilities` (array of strings like `"api.routes"`, `"hooks"`, `"frontend.pages"`).
5. WHEN the core discovers a plugin directory THEN it SHALL read and validate `plugin.json` BEFORE attempting to load the `.so` file.
6. IF `plugin.json` is missing or has invalid required fields THEN the core SHALL skip that plugin and log an error.
7. The `id` field SHALL be the canonical identifier used for route prefixes, database table prefixes, frontend registry namespacing, and future marketplace identification.

---

### Requirement 6: Plugin Loading Lifecycle

**User Story:** As the CMS core, I want a structured plugin loading lifecycle, so that plugins are discovered, validated, loaded, and registered in a predictable, ordered sequence.

#### Acceptance Criteria

1. WHEN the core starts THEN it SHALL walk the `build/plugins/` directory to discover plugin subdirectories.
2. For each discovered plugin, the core SHALL execute these steps in order: parse manifest, check compatibility, load `.so` via `plugin.Open()`, lookup exported `Plugin` symbol, validate `Manifest()` matches `plugin.json`, call `Plugin.Register(registrar)`, mount HTTP routes, and emit `plugin.loaded` action.
3. WHEN all plugins are loaded THEN the core SHALL fire the `core.ready` action hook.
4. The core SHALL maintain a `PluginRegistry` mapping plugin IDs to `LoadedPlugin` structs containing `Manifest`, `Path`, `Instance`, `Status` ("loaded"/"error"/"disabled"), `Errors`, `HasFrontend`, `FrontendEntry`, and `FrontendStyle`.
5. IF `plugin.Open()` fails or the `Plugin` symbol is not found THEN the core SHALL log the error, set the plugin status to `"error"`, and continue loading remaining plugins.
6. IF the plugin's `sdk_version` in `plugin.json` does not match the host's SDK version THEN the core SHALL reject the plugin and log a compatibility error.

---

### Requirement 7: Plugin HTTP Route Registration

**User Story:** As a plugin author, I want to register API routes that are automatically namespaced under my plugin ID, so that my routes don't conflict with other plugins or core routes.

#### Acceptance Criteria

1. The `HTTPRegistry` interface SHALL expose `API(fn func(router fiber.Router)) error` for registering plugin API routes.
2. WHEN a plugin with ID `example-plugin` registers API routes THEN they SHALL be mounted at `/api/plugins/example-plugin/...`.
3. The `HTTPRegistry` interface SHALL expose `Static(fs embed.FS, prefix string) error` for serving embedded static files.
4. WHEN a plugin registers static assets THEN they SHALL be served at `/plugins/{pluginID}/assets/...`.
5. Plugins SHALL NOT be able to register routes outside their namespaced prefix.
6. The core SHALL mount all plugin routes onto the GoFiber app after the `Register()` phase completes.

---

### Requirement 8: Core Application Startup

**User Story:** As a user, I want the CMS to boot up with all systems initialized in the correct order, so that the server is fully functional when it starts accepting requests.

#### Acceptance Criteria

1. WHEN the core binary starts THEN it SHALL execute the following sequence: load configuration, initialize GORM database connection, run pending migrations, create GoFiber app, mount core middleware (CORS, logging, recovery), initialize plugin registry, discover and load all plugins, mount plugin API routes, mount plugin static assets, expose `GET /api/cms/plugins` endpoint, mount embedded SolidJS frontend as catch-all for SPA routing, and start the Fiber server.
2. The core SHALL embed the SolidJS frontend build files using Go's `embed` package and serve them for all non-API routes (SPA catch-all).
3. The `GET /api/cms/plugins` endpoint SHALL return a JSON array of loaded plugins with `id`, `name`, `version`, `has_frontend`, `frontend_entry`, and `frontend_style` fields for each.

---

### Requirement 9: Database Layer (GORM)

**User Story:** As a developer, I want a GORM-based database layer with Go migrations, so that the core and plugins can persist data with a consistent ORM approach.

#### Acceptance Criteria

1. The core SHALL initialize a GORM database connection supporting SQLite (development) and PostgreSQL (production) drivers.
2. WHEN the core starts THEN it SHALL run `AutoMigrate` for core models: `User`, `Setting`, `PluginState`, and `PluginSetting` at minimum.
3. Plugins SHALL receive `*gorm.DB` through the `Registrar` and MAY define their own models and run their own `AutoMigrate` during `Register()`.
4. Plugins SHOULD prefix their database table names with their plugin ID (e.g., `example_plugin_items`) to avoid collisions.
4a. All core and plugin models SHALL embed `pluginsdk.BaseModel` (UUID v7 primary key) instead of `gorm.Model` (see Requirement 17).
5. The `PluginState` model SHALL track plugin `id`, enabled/disabled status, and installed version for each plugin.

---

### Requirement 10: Frontend Plugin System (SolidJS + Import Maps)

**User Story:** As a plugin author, I want my SolidJS components to run inside the core CMS frontend without rebuilding the core, so that plugins can contribute pages, widgets, and UI extensions dynamically.

#### Acceptance Criteria

1. The core's `index.html` SHALL include a `<script type="importmap">` that maps `solid-js`, `solid-js/web`, `solid-js/store`, and `@blitzpress/plugin-sdk` to shared ESM module URLs served by the backend.
2. The backend SHALL serve shared ESM modules at `/api/cms/modules/*` so that all plugins and the core use the same SolidJS instance (critical for reactivity).
3. WHEN the SolidJS app boots THEN it SHALL call `GET /api/cms/plugins`, iterate over plugins with `has_frontend: true`, and dynamically import each plugin's `frontend_entry` as an ES module.
4. IF a plugin has a `frontend_style` THEN the loader SHALL inject a `<link rel="stylesheet">` element into the document head before loading the JS module.
5. Each plugin frontend module SHALL call `registerPlugin(manifest, registerFn)` from `@blitzpress/plugin-sdk` to register its pages, widgets, and hook callbacks.
6. The `FrontendRegistrar` SHALL support `pages.add()`, `widgets.add()`, `hooks` (FrontendHookEngine), and `settings.setCustomComponent()`.
7. The frontend hook engine SHALL mirror the backend pattern: `addAction`, `addFilter`, `doAction`, `applyFilters`, `removeAction`, `removeFilter` with priority and stable IDs.

---

### Requirement 11: `@blitzpress/vite-plugin` Package

**User Story:** As a plugin author, I want a shared Vite configuration plugin, so that I don't have to manually configure externals, output format, and asset paths for every plugin frontend build.

#### Acceptance Criteria

1. The `@blitzpress/vite-plugin` package SHALL be located at `core/frontend/packages/vite-plugin/`.
2. WHEN added to a plugin's `vite.config.ts` THEN it SHALL automatically mark `solid-js`, `solid-js/web`, `solid-js/store`, and `@blitzpress/plugin-sdk` as external dependencies.
3. The plugin SHALL set the Vite output format to `es` (ES modules).
4. The plugin SHALL configure output file naming and directory structure to match the BlitzPress plugin convention (`frontend/assets/index.js`, `frontend/assets/index.css`).
5. The plugin SHALL accept a `pluginId` option to set the correct `base` path for asset URL references.

---

### Requirement 12: Plugin Settings System

**User Story:** As a plugin author, I want to declare a settings schema and have the CMS auto-generate a settings UI, so that I can offer configuration options without building custom admin pages for simple settings.

#### Acceptance Criteria

1. The `SettingsRegistry` interface SHALL expose `Register(schema SettingsSchema)` for plugins to declare their settings schema during `Register()`.
2. The `SettingsSchema` SHALL support `Sections`, each containing an `ID`, `Title`, and array of `SettingsField` entries.
3. Each `SettingsField` SHALL have `ID`, `Type`, `Label`, and `Default`, with optional `Description`, `Required`, `Min`, `Max`, and `Options` (for select fields).
4. Supported field types SHALL include: `string`, `text`, `number`, `boolean`, `select`, `color`, `url`, `email`, and `custom`.
4a. IF a field has `Type: "custom"` THEN it SHALL include a `Component` string referencing a frontend component registered via `registrar.settings.addFieldComponent(id, component)`. The auto-generated form SHALL look up this component by ID and render it inline, passing `value` and `onChange` props.
5. The core SHALL expose `GET /api/admin/plugins/{id}/settings` returning the schema and current saved values, and `PUT /api/admin/plugins/{id}/settings` for saving (with schema validation).
6. Settings SHALL be stored in a `plugin_settings` table with columns `plugin_id`, `key`, and `value_json`.
7. Plugins SHALL read their saved settings via `r.Config.Get(key)`, `r.Config.GetInt(key)`, etc. on the `ConfigReader` interface.
8. The core SolidJS frontend SHALL auto-render a settings form from the schema (text input for `string`, toggle for `boolean`, number input for `number`, dropdown for `select`, etc.).
9. IF a plugin registers a custom SolidJS settings component via `registrar.settings.setCustomComponent()` THEN the core SHALL render that component INSTEAD of the auto-generated form.
10. The custom settings component SHALL receive current settings values and a save callback as props.

---

### Requirement 13: Build System

**User Story:** As a developer, I want shell scripts to build the core binary and plugins (including their frontends), so that the build process is automated and produces the correct output structure.

#### Acceptance Criteria

1. A `scripts/build-core.sh` script SHALL: build the SolidJS frontend (`bun install && bun run build`), copy `dist/` contents into `core/static/` for embedding, and compile the Go binary to `build/blitzpress`.
2. A `scripts/build-plugin.sh` script SHALL accept a plugin directory name, build its frontend (if it has one), create the output directory under `build/plugins/{id}/`, copy frontend assets, copy `plugin.json`, and compile the `.so` to `build/plugins/{id}/plugin.so`.
3. A `scripts/build-all.sh` script SHALL build all plugins first, then build the core.
4. Plugin `.so` files SHALL be built with `go build -buildvcs=false -buildmode=plugin`.
5. The `build/` directory SHALL be gitignored.
6. The build output for each plugin SHALL follow the structure: `build/plugins/{id}/plugin.json`, `build/plugins/{id}/plugin.so`, and `build/plugins/{id}/frontend/assets/*` (if frontend exists).

---

### Requirement 14: Air Hot-Reload Configuration

**User Story:** As a developer, I want hot-reload during development where changing Go or frontend code automatically rebuilds and restarts the relevant components, so that the feedback loop is fast.

#### Acceptance Criteria

1. A root `.air.toml` SHALL watch `core/` Go files and rebuild the core binary, including rebuilding the SolidJS frontend before the Go build.
2. The root `.air.toml` SHALL watch `build/plugins/**/*.so` files so that when any plugin `.so` is rebuilt, the core binary is automatically restarted.
3. Each plugin SHALL have its own `.air.toml` that watches the plugin's Go and frontend source files, rebuilds the frontend, copies assets to `build/plugins/{id}/`, and recompiles the `.so`.
4. WHEN a plugin's `.so` file changes in `build/plugins/` THEN the core's air process SHALL detect the change and restart the core binary, causing it to re-discover and re-load all plugins.
5. Plugin air configs SHALL NOT run a persistent binary -- they SHALL build only, using a sleep-based keep-alive pattern (`bin = "echo done && sleep"`, `args_bin = ["infinity"]`).

---

### Requirement 15: Example Plugin

**User Story:** As a plugin author, I want a reference example plugin that demonstrates all plugin capabilities, so that I can use it as a template for building my own plugins.

#### Acceptance Criteria

1. The `example-plugin/` directory SHALL contain `main.go`, `plugin.json`, `frontend/` (SolidJS project), `static/` (embedded assets), `go.mod`, and `.air.toml`.
2. The `main.go` SHALL export `var Plugin ExamplePlugin` implementing `pluginsdk.Plugin`.
3. The `Manifest()` method SHALL return an `ID`, `Name`, and `Version` matching the values in `plugin.json`.
4. The `Register()` method SHALL demonstrate: registering at least one API route via `r.HTTP.API()`, serving embedded static files via `r.HTTP.Static()`, adding an action hook via `r.Hooks.AddAction()`, and adding a filter hook via `r.Hooks.AddFilter()`.
5. The plugin frontend SHALL demonstrate calling `registerPlugin()` from `@blitzpress/plugin-sdk`, registering at least one page via `registrar.pages.add()`, and adding a frontend filter hook.
6. The `plugin.json` SHALL include all required fields (`schema_version`, `id`, `name`, `version`, `sdk_version`) plus `has_frontend: true` with `frontend_entry` and `frontend_style`.

---

### Requirement 17: UUID v7 Primary Keys and Carbon Datetime

**User Story:** As a developer, I want all database models (core and plugin) to use UUID v7 as primary keys and Carbon datetime fields instead of auto-incrementing integers and `time.Time`, so that IDs are globally unique and datetime handling is developer-friendly throughout the codebase.

#### Acceptance Criteria

1. The `plugin-sdk` module SHALL export a `BaseModel` struct that uses `uuid.UUID` (from `github.com/google/uuid`) as the primary key field, along with `CreatedAt`, `UpdatedAt` (both `carbon.DateTime`), and `DeletedAt` (`gorm.DeletedAt`) fields.
2. The `BaseModel.BeforeCreate` GORM hook SHALL auto-generate a UUID v7 (RFC 9562, time-ordered) when the ID is not already set.
3. All core database models (`User`, `Setting`, `PluginState`, `PluginSetting`) SHALL embed `pluginsdk.BaseModel` instead of `gorm.Model`.
4. Plugin authors SHALL embed `pluginsdk.BaseModel` in their own models instead of `gorm.Model`.
5. The UUID column type SHALL be `char(36)` for SQLite/PostgreSQL compatibility.
6. All datetime fields across the entire codebase (models, event structs, API responses) SHALL use `carbon.DateTime` from `github.com/dromara/carbon/v2` instead of `time.Time`.
7. The `carbon.DateTime` type SHALL be used because it implements `database/sql` `Scanner`/`Valuer` interfaces (GORM-compatible) and provides a rich datetime API (formatting, diffing, comparison, timezone handling).

---

### Requirement 16: Manager CLI (Minimal)

**User Story:** As a developer, I want a CLI tool to list installed plugins and build plugins from source, so that I can manage the plugin lifecycle from the command line.

#### Acceptance Criteria

1. The `manager/` module SHALL compile to a separate binary (`blitzpress-manager`).
2. The `list` command SHALL scan `build/plugins/`, read each `plugin.json`, and display plugin ID, name, version, and status in a table format.
3. The `build` command SHALL accept a plugin source directory path and execute the same build steps as `scripts/build-plugin.sh` (frontend build, asset copy, manifest copy, `.so` compilation).
4. IF the specified plugin directory does not exist or lacks a `plugin.json` THEN the command SHALL exit with a descriptive error.
