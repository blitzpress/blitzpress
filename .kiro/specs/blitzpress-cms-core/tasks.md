# Implementation Plan: BlitzPress CMS Core

## Overview

This plan implements a Go monorepo CMS with a plugin system inspired by WordPress's extensibility model. The system consists of four modules (core, plugin-sdk, manager, example-plugin) connected via Go workspace, with a SolidJS frontend that dynamically loads plugin frontends via ES module import maps.

## Tasks

- [x] 1. Set up monorepo structure and Go workspace
  - Create root directory structure: `core/`, `plugin-sdk/`, `manager/`, `example-plugin/`, `build/`, `scripts/`
  - Create `go.work` file listing all four modules as workspace members (Go 1.24+)
  - Create `go.mod` files for each module with appropriate module paths
  - Create `.gitignore` to exclude `build/` directory
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement Plugin SDK module (`plugin-sdk/`)
  - [x] 2.1 Create core SDK interfaces and types
    - Create `plugin-sdk/plugin.go` with `Plugin` interface, `Manifest` struct, and `Registrar` struct
    - Create `plugin-sdk/hooks.go` with `HookRegistry` interface, `HookContext`, `ActionFunc`, `FilterFunc`, and `HookOptions`
    - Create `plugin-sdk/events.go` with `EventBus` interface, `Event` struct, and `EventHandler` type
    - Create `plugin-sdk/http.go` with `HTTPRegistry` interface
    - Create `plugin-sdk/settings.go` with `SettingsRegistry`, `ConfigReader`, `SettingsSchema`, and field types
    - Create `plugin-sdk/context.go` with `Logger` interface and `MenuItem` struct
    - Create `plugin-sdk/errors.go` with standard plugin error types
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1-3.8, 4.1-4.4, 7.1, 12.1-12.4_

  - [x] 2.2 Implement BaseModel with UUID v7 and Carbon datetime
    - Create `plugin-sdk/model.go` with `BaseModel` struct using `uuid.UUID` primary key
    - Implement `BeforeCreate` GORM hook to auto-generate UUID v7
    - Use `carbon.DateTime` from `github.com/dromara/carbon/v2` for all datetime fields
    - Add dependencies: `github.com/google/uuid` (v1.6+) and `github.com/dromara/carbon/v2`
    - _Requirements: 17.1, 17.2, 17.5, 17.6, 17.7_

  - [x] 2.3 Write unit tests for SDK types
    - Test `Manifest` validation
    - Test `BaseModel` UUID v7 generation
    - Test Carbon datetime serialization/deserialization
    - _Requirements: 2.1, 2.2, 17.1, 17.2_

- [x] 3. Implement core database layer (`core/internal/database/`)
  - [x] 3.1 Create database initialization and models
    - Create `database.go` with `Initialize()` function supporting SQLite and PostgreSQL
    - Create `models.go` with `User`, `Setting`, `PluginState`, and `PluginSetting` models
    - All models must embed `pluginsdk.BaseModel` instead of `gorm.Model`
    - Add composite unique index on `PluginSetting` for `(plugin_id, key)`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.4a, 9.5, 17.3, 17.4_

  - [x] 3.2 Write unit tests for database models
    - Test model creation with UUID v7 primary keys
    - Test unique constraints and indexes
    - Test Carbon datetime field persistence
    - _Requirements: 9.1, 9.2, 17.3_

- [x] 4. Implement core configuration system (`core/internal/config/`)
  - Create `config.go` with `AppConfig` struct and `Load()` function
  - Read environment variables with `BLITZPRESS_` prefix
  - Provide sensible defaults for local development
  - _Requirements: 8.1_

- [x] 5. Implement plugin discovery system (`core/internal/plugins/discover.go`)
  - [x] 5.1 Create plugin manifest file types and discovery logic
    - Create `PluginManifestFile` struct matching `plugin.json` schema
    - Implement `Discover()` function to walk `build/plugins/` directory
    - Validate manifest fields: schema_version, id (kebab-case), name, version (semver), sdk_version
    - Validate frontend fields if `has_frontend` is true
    - Verify `plugin.so` file exists
    - Return `DiscoveredPlugin` structs with manifest, directory path, and `.so` path
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1_

  - [x] 5.2 Write unit tests for plugin discovery
    - Test manifest validation rules
    - Test kebab-case ID validation
    - Test semver version validation
    - Test error handling for missing/invalid manifests
    - _Requirements: 5.2, 5.5, 5.6_

- [x] 6. Implement plugin loader (`core/internal/plugins/loader.go`)
  - [x] 6.1 Create plugin loading logic
    - Implement `LoadPlugin()` function using `plugin.Open()`
    - Lookup `Plugin` symbol from `.so` file
    - Validate `Manifest()` matches `plugin.json` fields
    - Check SDK version compatibility
    - Return `LoadedPlugin` struct with status ("loaded", "error", "disabled")
    - _Requirements: 6.2, 6.3, 6.5, 6.6_

  - [x] 6.2 Write unit tests for plugin loader
    - Test symbol lookup and validation
    - Test manifest mismatch detection
    - Test SDK version compatibility checking
    - _Requirements: 6.3, 6.5, 6.6_

- [x] 7. Implement hook engine (`core/internal/plugins/hooks.go`)
  - [x] 7.1 Create HookEngine implementation
    - Implement `HookEngine` struct with sorted slices for actions and filters
    - Implement `AddAction()` and `AddFilter()` with priority ordering (default 10)
    - Implement `DoAction()` to execute actions in priority order
    - Implement `ApplyFilters()` to chain value through filters in priority order
    - Implement `RemoveAction()` and `RemoveFilter()` using stable HookID
    - Use atomic counter for generating unique HookIDs
    - Handle same-priority hooks in registration order
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 7.2 Write unit tests for hook engine
    - Test priority ordering (lower priority executes first)
    - Test registration order for same-priority hooks
    - Test action execution and error collection
    - Test filter chaining and value transformation
    - Test hook removal by ID
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 8. Implement event bus (`core/internal/plugins/eventbus.go`)
  - [x] 8.1 Create EventBus implementation
    - Implement `EventBusImpl` with buffered channel and worker goroutines
    - Implement `Publish()` for async event dispatch (non-blocking)
    - Implement `Subscribe()` and `Unsubscribe()` for handler management
    - Create `Event` struct with `Name`, `PluginID`, `Payload`, and `Timestamp` (carbon.DateTime)
    - Implement `Start()` and `Stop()` for worker lifecycle management
    - Log handler errors without propagating to publisher or other subscribers
    - Use default 4 workers with buffer size 256
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 17.6_

  - [x] 8.2 Write unit tests for event bus
    - Test async event publishing (non-blocking)
    - Test subscriber notification
    - Test handler error isolation
    - Test graceful shutdown
    - _Requirements: 4.1, 4.2, 4.5, 4.6_

- [x] 9. Implement HTTP registry (`core/internal/plugins/http.go`)
  - [x] 9.1 Create plugin HTTP registry
    - Implement `pluginHTTPRegistry` struct to collect route and static registrations
    - Implement `API()` to collect plugin API route functions
    - Implement `Static()` to collect embedded filesystem mounts
    - Routes are namespaced under `/api/plugins/{pluginID}/`
    - Static assets are served at `/plugins/{pluginID}/assets/`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 9.2 Write unit tests for HTTP registry
    - Test route collection during registration
    - Test static filesystem collection
    - Test namespace enforcement
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [x] 10. Implement settings service (`core/internal/plugins/settings.go`)
  - [x] 10.1 Create settings registry and config reader
    - Implement `pluginSettingsRegistry` to store plugin settings schemas
    - Implement `pluginConfigReader` to read settings from database
    - Implement `Get()`, `GetInt()`, `GetFloat()`, `GetBool()`, and `GetAll()` methods
    - Settings stored in `plugin_settings` table with JSON-encoded values
    - _Requirements: 12.1, 12.2, 12.3, 12.6, 12.7_

  - [x] 10.2 Write unit tests for settings service
    - Test schema registration
    - Test settings persistence and retrieval
    - Test type conversion methods
    - _Requirements: 12.1, 12.6, 12.7_

- [x] 11. Implement plugin registry (`core/internal/plugins/registry.go`)
  - [x] 11.1 Create central plugin registry
    - Implement `PluginRegistry` struct with thread-safe plugin map
    - Implement `NewPluginRegistry()` constructor
    - Implement `DiscoverAndLoad()` orchestration method
    - Build per-plugin `Registrar` with scoped HTTP, settings, and config
    - Call `plugin.Register(registrar)` for each loaded plugin
    - Fire built-in hooks: `core.booting`, `plugin.loaded`, `core.ready`
    - Implement `GetPlugin()`, `ListPlugins()`, and `MountRoutes()` methods
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 3.9, 8.1_

  - [x] 11.2 Write integration tests for plugin registry
    - Test full plugin lifecycle (discover, load, register)
    - Test hook firing sequence
    - Test error handling for failed plugins
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 12. Checkpoint - Ensure all backend core systems compile
  - Run `go build` in `plugin-sdk/`, `core/`, and verify no errors
  - Ensure all tests pass, ask the user if questions arise

- [x] 13. Implement core API handlers (`core/internal/api/`)
  - [x] 13.1 Create core API endpoints
    - Implement `GET /api/cms/plugins` handler to list loaded plugins with frontend info
    - Implement `GET /api/admin/plugins/:id/settings` handler to return schema and values
    - Implement `PUT /api/admin/plugins/:id/settings` handler with schema validation
    - Implement `GET /api/cms/modules/*` handler to serve shared ESM modules
    - _Requirements: 8.3, 10.2, 10.3, 12.5_

  - [x] 13.2 Write unit tests for API handlers
    - Test plugin list endpoint response format
    - Test settings GET/PUT with validation
    - Test module serving
    - _Requirements: 8.3, 12.5_

- [ ] 14. Implement core entrypoint (`core/main.go`)
  - [ ] 14.1 Create main application startup sequence
    - Load configuration from environment
    - Initialize slog logger
    - Initialize GORM database connection
    - Create GoFiber app with middleware (CORS, logging, recovery)
    - Initialize plugin registry
    - Fire `core.booting` hook
    - Discover and load all plugins
    - Mount plugin API routes and static assets
    - Register core API endpoints
    - Embed and serve SolidJS frontend with SPA fallback
    - Inject import map into `index.html`
    - Fire `core.ready` hook
    - Set up graceful shutdown with `core.shutdown` hook
    - Start Fiber server
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 14.2 Write integration tests for core startup
    - Test full startup sequence
    - Test graceful shutdown
    - Test import map injection
    - _Requirements: 8.1, 8.2_

- [ ] 15. Implement SolidJS frontend core (`core/frontend/`)
  - [ ] 15.1 Set up SolidJS project structure
    - Create `package.json` with SolidJS, Vite, and TypeScript dependencies
    - Create `vite.config.ts` with main app build and modules build configurations
    - Create `tsconfig.json` with appropriate compiler options
    - Create `index.html` with placeholder for import map injection
    - _Requirements: 10.1, 10.2_

  - [ ] 15.2 Create plugin runtime system
    - Create `src/plugin-runtime/types.ts` with all frontend interfaces
    - Create `src/plugin-runtime/registry.ts` with SolidJS store for plugin registrations
    - Create `src/plugin-runtime/hooks.ts` with frontend hook engine (priority-based)
    - Create `src/plugin-runtime/events.ts` with frontend event bus (microtask-based)
    - Create `src/plugin-runtime/loader.ts` to fetch and dynamically import plugin frontends
    - _Requirements: 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ] 15.3 Create shared ESM module wrappers
    - Create `src/modules/solid-js.ts` re-exporting `solid-js`
    - Create `src/modules/solid-js-web.ts` re-exporting `solid-js/web`
    - Create `src/modules/solid-js-store.ts` re-exporting `solid-js/store`
    - Create `src/modules/plugin-sdk.ts` exporting `registerPlugin` and runtime APIs
    - Configure Vite to build these as separate ES modules
    - _Requirements: 10.1, 10.2_

  - [ ] 15.4 Create main app component
    - Create `src/App.tsx` with router and plugin page rendering
    - Create `src/index.tsx` as entry point
    - Call `loadPlugins()` on app mount
    - Render plugin pages and widgets from registry
    - _Requirements: 10.3, 10.5, 10.6_

  - [ ] 15.5 Write unit tests for frontend plugin runtime
    - Test hook engine priority ordering
    - Test event bus pub/sub
    - Test plugin registration
    - _Requirements: 10.6, 10.7_

- [ ] 16. Implement `@blitzpress/vite-plugin` package
  - [ ] 16.1 Create Vite plugin for plugin authors
    - Create `core/frontend/packages/vite-plugin/` directory
    - Create `package.json` with Vite peer dependency
    - Create `src/index.ts` with plugin implementation
    - Configure externals for `solid-js`, `solid-js/web`, `solid-js/store`, `@blitzpress/plugin-sdk`
    - Set output format to ES modules
    - Accept `pluginId` option for base path configuration
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 16.2 Write unit tests for Vite plugin
    - Test external dependency configuration
    - Test output format settings
    - _Requirements: 11.2, 11.3_

- [ ] 17. Implement example plugin backend (`example-plugin/`)
  - [ ] 17.1 Create example plugin structure
    - Create `example-plugin/go.mod` with dependency on `plugin-sdk`
    - Create `example-plugin/plugin.json` with all required fields
    - Create `example-plugin/static/` directory with embedded assets
    - _Requirements: 15.1, 15.6, 5.2_

  - [ ] 17.2 Implement example plugin Go code
    - Create `example-plugin/main.go` with `Plugin` implementation
    - Implement `Manifest()` returning ID, Name, Version matching `plugin.json`
    - Implement `Register()` demonstrating API routes, static files, hooks, filters, and settings
    - Register at least one action hook and one filter hook
    - _Requirements: 15.2, 15.3, 15.4_

- [ ] 18. Implement example plugin frontend (`example-plugin/frontend/`)
  - [ ] 18.1 Create example plugin frontend structure
    - Create SolidJS project with `package.json`, `vite.config.ts` (using `@blitzpress/vite-plugin`), `tsconfig.json`
    - Create `src/index.ts` calling `registerPlugin()` from `@blitzpress/plugin-sdk`
    - Register at least one page via `registrar.pages.add()`
    - Add at least one frontend filter hook
    - _Requirements: 15.5, 15.6_

  - [ ] 18.2 Create example plugin components
    - Create `src/pages/Home.tsx` as example page component
    - Demonstrate widget registration (optional)
    - Demonstrate custom settings component (optional)
    - _Requirements: 15.5_

- [ ] 19. Implement settings UI system
  - [ ] 19.1 Create auto-generated settings form
    - Create `core/frontend/src/components/SettingsForm.tsx`
    - Render form fields based on schema type (string, text, number, boolean, select, color, url, email)
    - Support custom field components via `fieldComponents` registry
    - Support custom settings component override via `settingsComponents` registry
    - Pass current values and save callback to custom components
    - _Requirements: 12.4, 12.4a, 12.8, 12.9, 12.10_

  - [ ] 19.2 Write unit tests for settings form
    - Test field rendering for each type
    - Test custom component integration
    - _Requirements: 12.4, 12.8, 12.9_

- [ ] 20. Implement build system (`scripts/`)
  - [ ] 20.1 Create core build script
    - Create `scripts/build-core.sh` to build SolidJS frontend and Go binary
    - Build frontend: `cd core/frontend && bun install && bun run build`
    - Copy `dist/` to `core/static/` for embedding
    - Compile Go binary: `cd core && go build -o ../build/blitzpress`
    - _Requirements: 13.1, 13.5_

  - [ ] 20.2 Create plugin build script
    - Create `scripts/build-plugin.sh` accepting plugin directory name
    - Build plugin frontend if it exists
    - Create output directory `build/plugins/{id}/`
    - Copy `plugin.json` and frontend assets
    - Compile `.so`: `go build -buildvcs=false -buildmode=plugin -o build/plugins/{id}/plugin.so`
    - _Requirements: 13.2, 13.4, 13.6_

  - [ ] 20.3 Create build-all script
    - Create `scripts/build-all.sh` to build all plugins then core
    - _Requirements: 13.3_

  - [ ] 20.4 Test build scripts
    - Test core build produces working binary
    - Test plugin build produces valid `.so` files
    - Test build-all script completes successfully
    - _Requirements: 13.1, 13.2, 13.3_

- [ ] 21. Implement Air hot-reload configuration
  - [ ] 21.1 Create root Air config
    - Create `.air.toml` watching `core/` Go files
    - Rebuild SolidJS frontend before Go build
    - Watch `build/plugins/**/*.so` to trigger core restart
    - _Requirements: 14.1, 14.2, 14.4_

  - [ ] 21.2 Create plugin Air config
    - Create `example-plugin/.air.toml` watching plugin Go and frontend files
    - Rebuild frontend and recompile `.so` on changes
    - Use sleep-based keep-alive pattern (no persistent binary)
    - _Requirements: 14.3, 14.5_

- [ ] 22. Implement manager CLI (`manager/`)
  - [ ] 22.1 Create manager CLI structure
    - Create `manager/go.mod` with CLI framework dependency (e.g., cobra)
    - Create `manager/main.go` with CLI entry point
    - _Requirements: 16.1_

  - [ ] 22.2 Implement list command
    - Implement `list` command to scan `build/plugins/` and display plugin info
    - Read each `plugin.json` and show ID, name, version, status in table format
    - _Requirements: 16.2_

  - [ ] 22.3 Implement build command
    - Implement `build` command accepting plugin source directory path
    - Execute same build steps as `scripts/build-plugin.sh`
    - Exit with error if directory or `plugin.json` missing
    - _Requirements: 16.3, 16.4_

  - [ ] 22.4 Write unit tests for manager CLI
    - Test list command output
    - Test build command validation
    - _Requirements: 16.2, 16.3, 16.4_

- [ ] 23. Final integration and wiring
  - [ ] 23.1 Wire all components together
    - Verify Go workspace resolves all module references
    - Verify core binary embeds frontend correctly
    - Verify plugin loading works end-to-end
    - Verify frontend dynamically loads plugin frontends
    - Verify hooks, events, and settings work across plugins
    - _Requirements: 1.1, 1.3, 6.2, 8.1, 10.3_

  - [ ] 23.2 Write end-to-end integration tests
    - Test full system startup with example plugin
    - Test plugin API routes accessible
    - Test plugin frontend loads in browser
    - Test hook execution across core and plugins
    - Test event bus communication
    - Test settings persistence and retrieval
    - _Requirements: 6.2, 8.1, 10.3, 12.5_

- [ ] 24. Final checkpoint - Ensure all tests pass
  - Run all unit tests and integration tests
  - Build core and example plugin
  - Start core binary and verify example plugin loads
  - Test frontend in browser
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design uses Go (not pseudocode), so all implementation is in Go and TypeScript/SolidJS
- No property-based testing tasks included (this is infrastructure/IaC-type project)
- Unit tests and integration tests validate specific examples and edge cases
- Build system uses shell scripts for automation
- Air provides hot-reload for development workflow
