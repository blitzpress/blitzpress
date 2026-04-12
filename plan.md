# Plugin Management: API Rename + Full Frontend Wiring

## Summary

Rename all core API routes from `/api/cms/` and `/api/admin/` to `/api/core/`, add new admin plugin endpoints, wire the frontend toggle end-to-end, remove sample data, and persist the naming convention in `AGENTS.md`.

## API Route Migration

| Old Route | New Route | Used By |
|-----------|-----------|---------|
| `GET /api/cms/plugins` | `GET /api/core/plugins` | `loader.ts` (runtime) |
| `GET /api/cms/modules/*` | `GET /api/core/modules/*` | import map in `main.go` |
| `GET /api/admin/plugins/:id/settings` | `GET /api/core/plugins/:id/settings` | `PluginSettingsView.tsx` |
| `PUT /api/admin/plugins/:id/settings` | `PUT /api/core/plugins/:id/settings` | `PluginSettingsView.tsx` |
| _(new)_ | `GET /api/core/plugins/all` | `PluginsPage.tsx` (admin) |
| _(new)_ | `PUT /api/core/plugins/:id/enabled` | `PluginsPage.tsx` (toggle) |
| `/api/plugins/:id/*` | **unchanged** | plugin-scoped custom routes |
| `/plugins/:id/assets/*` | **unchanged** | plugin static assets |

## Backend Changes

### 1. `core/main.go` -- route mounting

Rename the `apiRouter` group and all route registrations:

```go
apiRouter.Get("/core/plugins", api.CMSPluginsHandler(registry))          // runtime loader
apiRouter.Get("/core/modules/*", api.CMSModulesHandler(moduleAssets))
apiRouter.Get("/core/plugins/all", api.AdminPluginsHandler(registry))    // NEW
apiRouter.Put("/core/plugins/:id/enabled", api.AdminPluginToggleHandler(registry, db)) // NEW
apiRouter.Get("/core/plugins/:id/settings", api.PluginSettingsGetHandler(registry, db))
apiRouter.Put("/core/plugins/:id/settings", api.PluginSettingsPutHandler(registry, db))
```

Note: `/core/plugins/all` is registered **before** `/core/plugins/:id/settings` to avoid "all" being captured as `:id`.

### 2. `core/internal/api/handlers.go` -- new types + handlers

**New response type:**
```go
type adminPluginListItem struct {
    ID          string   `json:"id"`
    Name        string   `json:"name"`
    Version     string   `json:"version"`
    Description string   `json:"description,omitempty"`
    Author      string   `json:"author,omitempty"`
    Status      string   `json:"status"`       // "loaded" | "disabled" | "error"
    Enabled     bool     `json:"enabled"`
    HasFrontend bool     `json:"has_frontend"`
    Errors      []string `json:"errors,omitempty"`
}
```

**`AdminPluginsHandler`** -- returns all plugins (loaded + disabled + error) with full manifest metadata.

**`AdminPluginToggleHandler`** -- accepts `{"enabled": bool}`, upserts `plugin_states`, updates in-memory status via `registry.SetPluginEnabled()`, returns updated item. When enabling a disabled plugin, returns `"restart_required": true` since the `.so` can only be loaded at startup.

### 3. `core/internal/plugins/registry.go` -- new method

```go
func (r *PluginRegistry) SetPluginEnabled(pluginID string, enabled bool) error
```

Upserts the `plugin_states` DB row and updates the in-memory `LoadedPlugin.Status` to `"disabled"` (when disabling) or leaves it as-is with a note that restart is needed (when enabling).

### 4. `core/internal/api/handlers_test.go` -- new + updated tests

- Update existing test URLs from `/api/cms/` to `/api/core/`
- `TestAdminPluginsHandlerReturnsAllPlugins` -- disabled + loaded + error all appear
- `TestAdminPluginToggleHandler` -- toggling persists to DB and returns correct status

## Frontend Changes

### 1. Update API paths in existing files

| File | Old path | New path |
|------|----------|----------|
| `core/frontend/src/plugin-runtime/loader.ts` | `/api/cms/plugins` | `/api/core/plugins` |
| `core/frontend/src/plugins/components/PluginSettingsView.tsx` | `/api/admin/plugins/${id}/settings` | `/api/core/plugins/${id}/settings` |
| `core/main.go` (import map) | `/api/cms/modules/...` | `/api/core/modules/...` |

### 2. New file: `core/frontend/src/plugins/pluginsApi.ts`

```ts
export interface AdminPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  status: string;      // "loaded" | "disabled" | "error"
  enabled: boolean;
  has_frontend: boolean;
  errors?: string[];
}

export async function fetchAdminPlugins(): Promise<AdminPlugin[]> { ... }
export async function togglePluginEnabled(id: string, enabled: boolean): Promise<AdminPlugin> { ... }
```

### 3. Rewrite: `core/frontend/src/plugins/PluginsPage.tsx`

- **Remove** `samplePlugins` array and `pluginMeta` map (hardcoded fake data)
- **Remove** client-only `pluginStates` signal
- Fetch from `GET /api/core/plugins/all` on mount via `createResource`
- Toggle calls `PUT /api/core/plugins/:id/enabled` then refetches/mutates local state
- Filter tabs use real `enabled` field:
  - **Installed** = all plugins
  - **Active** = `enabled === true`
  - **Inactive** = `enabled === false`
- Show error indicator for `status === "error"` plugins
- Show "restart required" note when enabling a disabled plugin
- Keep existing card design, runtime status banner, Settings link
- Keep "Install Plugin" button as-is (non-functional)

## `AGENTS.md` Update

Add to the Coding Style section:

> **API Route Naming:** All core API routes use the prefix `/api/core/`. Per-plugin custom routes remain under `/api/plugins/:id/`. Never use `/api/cms/` or `/api/admin/` prefixes.

## Files Changed

| File | Action |
|------|--------|
| `AGENTS.md` | Add API naming convention |
| `core/main.go` | Rename routes, add 2 new, reorder |
| `core/internal/api/handlers.go` | Add `adminPluginListItem`, `AdminPluginsHandler`, `AdminPluginToggleHandler` |
| `core/internal/api/handlers_test.go` | Update URLs, add 2 new test functions |
| `core/internal/plugins/registry.go` | Add `SetPluginEnabled()` method |
| `core/frontend/src/plugin-runtime/loader.ts` | Update URL |
| `core/frontend/src/plugins/components/PluginSettingsView.tsx` | Update URL |
| `core/frontend/src/plugins/pluginsApi.ts` | **New** -- API client |
| `core/frontend/src/plugins/PluginsPage.tsx` | Rewrite with real API, remove sample data |
