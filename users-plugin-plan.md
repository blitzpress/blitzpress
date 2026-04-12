# Users Plugin Plan

## Overview

Split user/auth into two layers: (1) a **driver-style auth interface** in `plugin-sdk` + core infrastructure, and (2) a **users plugin** that implements it with DB-backed users, roles, capabilities, sessions, and login UI.

## Architecture

```
plugin-sdk (AuthDriver interface, AuthUser/Role/Cap types)
    |
    v
core (AuthRegistry holds driver, AdminAuthMiddleware protects routes, auth.* hooks)
    |
    v
users-plugin (migration, in-memory cache, AuthDriver impl, login API, frontend)
```

## 1. Plugin SDK Additions (`plugin-sdk/auth.go`)

New types and interface:

```go
type AuthUser struct {
    ID          uuid.UUID      `json:"id"`
    Email       string         `json:"email"`
    DisplayName string         `json:"display_name"`
    Roles       []string       `json:"roles"`
    Metadata    map[string]any `json:"metadata,omitempty"`
}

type RoleDefinition struct {
    Slug         string   `json:"slug"`
    Label        string   `json:"label"`
    Capabilities []string `json:"capabilities"`
}

type AuthDriver interface {
    Authenticate(token string) (*AuthUser, error)
    HasCapability(user *AuthUser, capability string) bool
    GetRoles() []RoleDefinition
    LoginURL() string
}

type AuthRegistry interface {
    RegisterDriver(driver AuthDriver)
}
```

Add `Auth AuthRegistry` to `Registrar`.

## 2. Core Auth Infrastructure (`core/internal/auth/`)

- **`registry.go`** -- holds a single `AuthDriver` slot. If no plugin registers, admin routes are open (dev/first-run).
- **`middleware.go`** -- Fiber middleware:
  1. Reads `Authorization: Bearer <token>` header (API) or `bp_session` cookie (browser).
  2. Calls `AuthDriver.Authenticate(token)`.
  3. On success, stores `*AuthUser` in `c.Locals("auth_user")`.
  4. On failure, returns `401` for API routes or redirects to `LoginURL()` for SPA routes.
  5. `RequireCapability(cap)` wrapper for per-route checks.

Middleware applied in `main.go`:
- All `/api/core/*` (except `/api/core/modules/*`, `/api/core/auth/*`).
- All `/api/plugins/*`.
- SPA handler (redirect to login if unauthenticated).

New hooks:

| Hook | Type | When |
|------|------|------|
| `auth.driver.registered` | Action | Plugin registers auth driver |
| `auth.user.authenticated` | Action | User successfully authenticated |
| `auth.check.capability` | Filter | Before capability check |

New config: `BLITZPRESS_AUTH_SECRET` env var for JWT signing.

## 3. Users Plugin (`users-plugin/`)

### 3a. Database Tables

All use `pluginsdk.BaseModel`, prefixed `users_plugin_`:

| Table | Columns |
|-------|---------|
| `users_plugin_users` | email (unique), password_hash, display_name, is_active |
| `users_plugin_roles` | slug (unique), label |
| `users_plugin_capabilities` | slug (unique), description |
| `users_plugin_role_capabilities` | role_slug, capability_slug (composite unique) |
| `users_plugin_user_roles` | user_id, role_slug (composite unique) |

Seed: default roles (administrator, editor, author, contributor, subscriber) with WordPress-like capabilities. Default admin from `BLITZPRESS_ADMIN_EMAIL` / `BLITZPRESS_ADMIN_PASSWORD`.

### 3b. In-Memory Cache

On startup, load all roles + capabilities into `sync.RWMutex`-protected map. Invalidated when roles/caps modified.

### 3c. AuthDriver Implementation

- `Authenticate(token)`: Validate JWT, lookup user, return `*AuthUser` with roles.
- `HasCapability(user, cap)`: Check cached role-capability map.
- `GetRoles()`: Return cached roles.
- `LoginURL()`: Return `"/login"`.

### 3d. API Routes (`/api/plugins/users-plugin/`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/login` | Email + password -> JWT + cookie |
| POST | `/logout` | Clear session cookie |
| GET | `/me` | Current user info |
| GET | `/users` | List users (requires `manage_users`) |
| POST | `/users` | Create user (requires `manage_users`) |
| PUT | `/users/:id` | Update user (requires `manage_users`) |
| DELETE | `/users/:id` | Delete user (requires `manage_users`) |
| GET | `/roles` | List roles + capabilities |

### 3e. Frontend

- Login page at `/login` (standalone, no AdminShell).
- Auth guard in AdminRuntimeProvider (check `/me`, redirect to `/login` on 401).
- Users admin page registered via `registrar.pages.add()`.

## 4. Core Changes

- Create AuthRegistry, pass into Registrar during plugin loading.
- After plugins load, apply auth middleware if driver registered.
- Expose `GET /api/core/auth/status` (whether auth is configured).
- Remove `User` from `core/internal/database/models.go` and AutoMigrate.
- Add `BLITZPRESS_AUTH_SECRET` to config.

## 5. Frontend Auth Flow

```
Browser -> SPA -> GET /api/core/auth/status
  -> if enabled: GET /api/plugins/users-plugin/me
    -> if 200: render AdminShell
    -> if 401: redirect to /login
  -> if not enabled: render AdminShell (open access)
```

## Files

**New:**
- `plugin-sdk/auth.go`
- `core/internal/auth/registry.go`
- `core/internal/auth/middleware.go`
- `users-plugin/` (full plugin)

**Modified:**
- `plugin-sdk/plugin.go` (add Auth to Registrar)
- `core/main.go` (wire auth)
- `core/internal/database/models.go` (remove User)
- `core/internal/database/database.go` (remove User from AutoMigrate)
- `core/internal/config/config.go` (add AuthSecret)
- `core/frontend/src/routes.ts` (add /login)
- `core/frontend/src/base/app/App.tsx` (auth guard)
- `go.work` (add users-plugin)
