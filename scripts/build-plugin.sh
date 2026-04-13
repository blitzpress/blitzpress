#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_ROOT="$ROOT_DIR/build/plugins"

DEFAULT_PLATFORMS="$(go env GOOS)/$(go env GOARCH)"
ALL_PLATFORMS="linux/amd64 linux/arm64 darwin/amd64 darwin/arm64"
WATCH_IGNORED_DIRS=(
  ".git"
  "frontend/dist"
  "frontend/node_modules"
  "frontend_embed/assets"
)

log() {
  printf '==> %s\n' "$*"
}

usage() {
  cat >&2 <<EOF
usage: $0 <plugin-directory> [--all-platforms] [--watch]
EOF
}

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "required command not found: $command_name"
  fi
}

recreate_dir() {
  local dir_path="$1"

  if [[ -z "$dir_path" || "$dir_path" == "/" ]]; then
    fail "refusing to recreate unsafe directory path"
  fi

  rm -rf "$dir_path"
  mkdir -p "$dir_path"
}

create_staging_dir() {
  local plugin_id="$1"

  mkdir -p "$BUILD_ROOT"
  mktemp -d "$BUILD_ROOT/.${plugin_id}.staging.XXXXXX"
}

resolve_plugin_dir() {
  local plugin_input="$1"

  if [[ -z "$plugin_input" ]]; then
    usage
    fail "missing plugin directory"
  fi

  if [[ -d "$plugin_input" ]]; then
    cd "$plugin_input" && pwd
    return
  fi

  if [[ -d "$ROOT_DIR/$plugin_input" ]]; then
    cd "$ROOT_DIR/$plugin_input" && pwd
    return
  fi

  fail "plugin directory not found: $plugin_input"
}

read_manifest_info() {
  local manifest_path="$1"

  python3 - "$manifest_path" <<'PY'
import json
import sys
from pathlib import Path

manifest = json.loads(Path(sys.argv[1]).read_text())
plugin_id = str(manifest.get("id", "")).strip()
has_frontend = "true" if bool(manifest.get("has_frontend")) else "false"

print(plugin_id)
print(has_frontend)
PY
}

install_frontend_dependencies() {
  local plugin_dir="$1"
  local frontend_dir="$plugin_dir/frontend"

  if [[ ! -d "$frontend_dir" ]]; then
    fail "frontend directory not found for plugin: $frontend_dir"
  fi

  log "Installing frontend dependencies for $(basename "$plugin_dir")"
  (
    cd "$frontend_dir"
    bun install
  )
}

stage_frontend_assets() {
  local plugin_dir="$1"
  local frontend_dir="$plugin_dir/frontend"
  local dist_dir="$frontend_dir/dist/frontend"
  local embed_dir="$plugin_dir/frontend_embed/assets"

  if [[ ! -d "$frontend_dir" ]]; then
    fail "frontend directory not found for plugin: $frontend_dir"
  fi

  log "Building frontend for $(basename "$plugin_dir")"
  (
    cd "$frontend_dir"
    bun run build
  )

  if [[ ! -d "$dist_dir" ]]; then
    fail "expected plugin frontend build output not found: $dist_dir"
  fi

  log "Staging frontend assets into frontend_embed/"
  rm -rf "$embed_dir"
  mkdir -p "$embed_dir"
  cp -R "$dist_dir/assets/." "$embed_dir/"
}

cleanup_frontend_staging() {
  local plugin_dir="$1"
  local embed_assets="$plugin_dir/frontend_embed/assets"

  if [[ -d "$embed_assets" ]]; then
    rm -rf "$embed_assets"
  fi
}

build_plugin_so() {
  local plugin_dir="$1"
  local output_dir="$2"
  local target_os="$3"
  local target_arch="$4"
  local so_name="plugin-${target_os}-${target_arch}.so"

  log "Building plugin .so for ${target_os}/${target_arch}"
  (
    cd "$plugin_dir"
    CGO_ENABLED=1 GOOS="$target_os" GOARCH="$target_arch" \
      go build -buildvcs=false -buildmode=plugin -o "$output_dir/$so_name" .
  )
}

sync_plugin_output() {
  local staging_dir="$1"
  local output_dir="$2"
  local staged_file=""

  mkdir -p "$output_dir"

  find "$output_dir" -maxdepth 1 -type f -name 'plugin-*.so' -delete

  shopt -s nullglob
  for staged_file in "$staging_dir"/plugin-*.so; do
    cp "$staged_file" "$output_dir/"
  done
  shopt -u nullglob

  # Replace the manifest last so watchers only restart after binaries are ready.
  cp "$staging_dir/plugin.json" "$output_dir/plugin.json"
}

should_reinstall_frontend_deps() {
  local changed_path="$1"

  case "$changed_path" in
    frontend/package.json|frontend/bun.lock|frontend/bun.lockb)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

wait_for_changes() {
  local plugin_dir="$1"

  python3 - "$plugin_dir" "${WATCH_IGNORED_DIRS[@]}" <<'PY'
import os
import sys
import time
from pathlib import Path

root = Path(sys.argv[1]).resolve()
ignored_dirs = tuple(item.strip("/") for item in sys.argv[2:] if item.strip("/"))


def is_ignored(relative_path: str) -> bool:
    return any(
        relative_path == ignored or relative_path.startswith(f"{ignored}/")
        for ignored in ignored_dirs
    )


def snapshot() -> dict[str, tuple[int, int]]:
    current: dict[str, tuple[int, int]] = {}
    for dirpath, dirnames, filenames in os.walk(root):
        dirpath_path = Path(dirpath)
        relative_dir = os.path.relpath(dirpath_path, root)
        if relative_dir == ".":
            relative_dir = ""

        kept_dirs = []
        for dirname in dirnames:
            relative_path = dirname if not relative_dir else f"{relative_dir}/{dirname}"
            if not is_ignored(relative_path):
                kept_dirs.append(dirname)
        dirnames[:] = kept_dirs

        for filename in filenames:
            relative_path = filename if not relative_dir else f"{relative_dir}/{filename}"
            if is_ignored(relative_path):
                continue

            file_path = dirpath_path / filename
            try:
                stat = file_path.stat()
            except FileNotFoundError:
                continue

            current[relative_path] = (stat.st_mtime_ns, stat.st_size)

    return current


before = snapshot()
while True:
    time.sleep(1.0)
    after = snapshot()
    if after != before:
        changed_paths = sorted(set(before) ^ set(after))
        if not changed_paths:
            for path, stamp in after.items():
                if before.get(path) != stamp:
                    changed_paths = [path]
                    break

        print(changed_paths[0] if changed_paths else "unknown file")
        break
PY
}

build_once() (
  local plugin_dir="$1"
  local manifest_path="$plugin_dir/plugin.json"
  local plugin_id=""
  local has_frontend="false"
  local output_dir=""
  local staging_dir=""
  local target_os=""
  local target_arch=""
  local platform=""

  if [[ ! -f "$manifest_path" ]]; then
    fail "plugin manifest not found: $manifest_path"
  fi

  mapfile -t MANIFEST_INFO < <(read_manifest_info "$manifest_path")
  plugin_id="${MANIFEST_INFO[0]:-}"
  has_frontend="${MANIFEST_INFO[1]:-false}"

  if [[ -z "$plugin_id" ]]; then
    fail "plugin manifest is missing a valid id: $manifest_path"
  fi

  output_dir="$BUILD_ROOT/$plugin_id"
  staging_dir="$(create_staging_dir "$plugin_id")"

  log "Preparing staging directory for $plugin_id"
  recreate_dir "$staging_dir"

  if [[ "$has_frontend" == "true" ]]; then
    if [[ "$FRONTEND_DEPS_READY" != "true" ]]; then
      install_frontend_dependencies "$plugin_dir"
      FRONTEND_DEPS_READY=true
    fi
    stage_frontend_assets "$plugin_dir"
  fi

  if [[ "$BUILD_ALL_PLATFORMS" == true ]]; then
    for platform in $ALL_PLATFORMS; do
      target_os="${platform%/*}"
      target_arch="${platform#*/}"
      if ! build_plugin_so "$plugin_dir" "$staging_dir" "$target_os" "$target_arch" 2>/dev/null; then
        log "Warning: skipped ${target_os}/${target_arch} (cross-compilation toolchain not available)"
      fi
    done
  else
    target_os="$(go env GOOS)"
    target_arch="$(go env GOARCH)"
    build_plugin_so "$plugin_dir" "$staging_dir" "$target_os" "$target_arch"
  fi

  log "Staging plugin manifest"
  cp "$manifest_path" "$staging_dir/plugin.json"

  log "Updating built plugin output"
  sync_plugin_output "$staging_dir" "$output_dir"
  rm -rf "$staging_dir"

  log "Plugin build completed: $output_dir"
)

watch_builds() {
  local plugin_dir="$1"
  local changed_path=""
  local manifest_info=()

  while true; do
    if build_once "$plugin_dir"; then
      mapfile -t manifest_info < <(read_manifest_info "$plugin_dir/plugin.json" 2>/dev/null || true)
      if [[ "${manifest_info[1]:-false}" == "true" ]]; then
        FRONTEND_DEPS_READY=true
      else
        FRONTEND_DEPS_READY=false
      fi
      log "Watching for changes in $plugin_dir"
    else
      log "Build failed; watching for changes in $plugin_dir"
    fi

    changed_path="$(wait_for_changes "$plugin_dir")"
    log "Detected change: $changed_path"

    if should_reinstall_frontend_deps "$changed_path"; then
      FRONTEND_DEPS_READY=false
    fi
  done
}

require_command bun
require_command go
require_command python3

PLUGIN_INPUT=""
BUILD_ALL_PLATFORMS=false
WATCH_MODE=false
FRONTEND_DEPS_READY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all-platforms)
      BUILD_ALL_PLATFORMS=true
      ;;
    --watch)
      WATCH_MODE=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      usage
      fail "unexpected argument: $1"
      ;;
    *)
      if [[ -z "$PLUGIN_INPUT" ]]; then
        PLUGIN_INPUT="$1"
      else
        usage
        fail "unexpected argument: $1"
      fi
      ;;
  esac
  shift
done

PLUGIN_DIR="$(resolve_plugin_dir "${PLUGIN_INPUT}")"

trap 'cleanup_frontend_staging "$PLUGIN_DIR"' EXIT

if [[ "$WATCH_MODE" == true ]]; then
  watch_builds "$PLUGIN_DIR"
else
  build_once "$PLUGIN_DIR"
fi
