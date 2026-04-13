# Roles UI And Capability Migration Plan

## Summary

Build role management inside `users-plugin` with `/roles` as the listing page and `/roles/new` plus `/roles/:id` handled by the same SolidJS role editor component.

The role editor supports changing the display name (`label`), slug, and assigned capabilities. Capabilities stay flat in the database; the frontend groups them by parsing the first `.` in each capability slug. Capability slugs use `{module-name}.{capability-name}`, optionally prefixed by provider/plugin as `{provider-or-plugin}:{module-name}.{capability-name}`.

Role deletion is out of scope for this pass.

## Backend

- Add users-plugin endpoints under `/api/plugins/users-plugin`:
  - `GET /roles`
  - `GET /roles/:slug`
  - `POST /roles`
  - `PUT /roles/:slug`
  - `GET /capabilities`
- Protect user/role/capability management endpoints with `users.manage`.
- Validate role slugs as kebab-case and capability slugs as dot/kebab names with optional provider prefix.
- Create/update roles transactionally.
- On role slug changes, update role-capability joins and user-role joins.
- Reload the role-capability cache after role create/update.
- Migrate default seeded capabilities from legacy underscore names to dot/kebab names.
- Preserve unknown custom legacy capabilities to avoid deleting user data.

## Capability Migration

Legacy mappings:

| Old | New |
| --- | --- |
| `manage_options` | `settings.manage` |
| `manage_users` | `users.manage` |
| `manage_plugins` | `plugins.download`, `plugins.activate`, `plugins.upload`, `plugins.deactivate`, `plugins.settings` |
| `edit_posts` | `posts.edit` |
| `edit_others_posts` | `posts.edit-others` |
| `publish_posts` | `posts.publish` |
| `delete_posts` | `posts.delete` |
| `edit_pages` | `pages.edit` |
| `edit_others_pages` | `pages.edit-others` |
| `publish_pages` | `pages.publish` |
| `delete_pages` | `pages.delete` |
| `read` | `site.read` |
| `upload_files` | `media.upload` |
| `manage_categories` | `categories.manage` |
| `moderate_comments` | `comments.moderate` |
| `edit_comments` | `comments.edit` |
| `delete_comments` | `comments.delete` |
| `switch_themes` | `themes.switch` |
| `edit_theme_options` | `themes.edit-options` |

Core capability checks will be updated to the new names.

## Frontend Runtime

- Extend plugin page matching from exact-only to support `:param` path segments.
- Exact routes continue to win before parameterized routes.
- `/roles/:id` matches `/roles/new` and `/roles/administrator`.
- Pass decoded route params to plugin page components.
- Hide parameterized plugin pages from the sidebar.
- Resolve topbar titles for parameterized plugin pages.

## Users Plugin Frontend

- Register:
  - `/roles` -> `RolesPage`
  - `/roles/:id` -> `RoleEditorPage`
- `RolesPage` uses the same `DataTable` pattern as `UsersPage`, with no filters.
- `RoleEditorPage` uses `routeParams.id`; `new` means create mode, any other value means edit mode.
- Render fields for name and slug.
- Render permissions as a responsive grid with 3 columns on wide screens and 1-2 columns on smaller screens.
- Each permission group cell includes capability checkboxes and group-level `All`/`None` controls.

## Validation

Run:

```bash
go test ./...
cd core/frontend && bun test && bunx tsc --noEmit
cd users-plugin/frontend && bun test && bunx tsc --noEmit
./scripts/build-plugin.sh users-plugin
./scripts/build-core.sh
```
