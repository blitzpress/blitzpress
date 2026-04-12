# Repository Guidelines

## Project Structure & Module Organization
BlitzPress is a Go workspace monorepo. `core/` contains the CMS server plus the embedded SolidJS app in `core/frontend/`; backend internals live in `core/internal/{api,config,database,plugins}`. `plugin-sdk/` is the stable public Go SDK and must not depend on `core/internal`. `example-plugin/` is the reference plugin with `plugin.json`, Go backend, and SolidJS frontend. `manager/` holds the CLI. Generated artifacts belong in `build/` and `tmp/`; design context lives in `BLITZPRESS-OVERVIEW.md` and `.kiro/specs/blitzpress-cms-core/`.

## Build, Test, and Development Commands
- `go test ./...` — run all Go workspace tests from the repo root.
- `./scripts/build-core.sh` — install Bun deps, build the core frontend, sync `core/static/`, and compile `build/blitzpress`.
- `./scripts/build-plugin.sh example-plugin` — build a plugin frontend and `.so` into `build/plugins/<id>/`.
- `./scripts/build-all.sh` — build all plugins, then the core binary.
- In `core/frontend/` or `example-plugin/frontend/`: `bun test` and `bunx tsc --noEmit`.
- Hot reload: `air -c .air.toml` for core, `air -c example-plugin/.air.toml` for the sample plugin.

## Coding Style & Naming Conventions
Use `gofmt` for Go code; keep imports grouped and error wrapping explicit with `%w`. **CRITICAL: Every exported Go struct field MUST have a `json:"snake_case"` tag.** Omit empty values with `json:",omitempty"` where appropriate. Missing json tags cause PascalCase keys in API responses, which breaks frontend consumers expecting snake_case. Go types use PascalCase, internal helpers use camelCase. TypeScript runs in strict mode; follow the existing 2-space indentation and keep component files in PascalCase with tests named `*.test.ts` or `*.test.tsx`. Plugin IDs, manifest IDs, and route namespaces must stay lowercase kebab-case. **API Route Naming:** All core API routes use the prefix `/api/core/`. Per-plugin custom routes remain under `/api/plugins/:id/`. Never use `/api/cms/` or `/api/admin/` prefixes.

## Testing Guidelines
Keep Go tests alongside code as `*_test.go`. Frontend/runtime tests live beside sources as `*.test.ts(x)`. Before opening a PR, run the relevant Go, Bun, and typecheck commands for every touched module, plus the matching build script when you change plugin loading, frontend bundling, or embedded assets.

## Commit & Pull Request Guidelines
Match the current history: short, lowercase, outcome-focused messages such as `fix missing: Task 11 ...` or `task 24 done - run final checkpoint`. PRs should summarize scope, list validation commands run, note affected modules (`core`, `plugin-sdk`, `manager`, `example-plugin`), and include screenshots for admin/frontend UI changes.

## Agent-Specific Instructions
Treat `BLITZPRESS-OVERVIEW.md` and the Kiro spec files as the architecture source of truth. Do not hand-edit `build/` outputs; regenerate them with scripts. Preserve `plugin-sdk` compatibility, plugin route prefixes, and manifest conventions when making changes. Use Go from `~/.local/opt/go/bin/go` when `go` is not available on `PATH`.
