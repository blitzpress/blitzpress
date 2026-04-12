#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_ROOT="$ROOT_DIR/build/plugins"

DEFAULT_PLATFORMS="$(go env GOOS)/$(go env GOARCH)"
ALL_PLATFORMS="linux/amd64 linux/arm64 darwin/amd64 darwin/arm64"

log() {
  printf '==> %s\n' "$*"
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

resolve_plugin_dir() {
  local plugin_input="$1"

  if [[ -z "$plugin_input" ]]; then
    fail "usage: $0 <plugin-directory> [--all-platforms]"
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

stage_frontend_assets() {
  local plugin_dir="$1"
  local frontend_dir="$plugin_dir/frontend"
  local dist_dir="$frontend_dir/dist/frontend"
  local embed_dir="$plugin_dir/frontend_embed/assets"

  if [[ ! -d "$frontend_dir" ]]; then
    fail "frontend directory not found for plugin: $frontend_dir"
  fi

  log "Installing frontend dependencies for $(basename "$plugin_dir")"
  (
    cd "$frontend_dir"
    bun install
  )

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

require_command bun
require_command go
require_command python3

PLUGIN_INPUT=""
BUILD_ALL_PLATFORMS=false

for arg in "$@"; do
  case "$arg" in
    --all-platforms)
      BUILD_ALL_PLATFORMS=true
      ;;
    *)
      if [[ -z "$PLUGIN_INPUT" ]]; then
        PLUGIN_INPUT="$arg"
      else
        fail "unexpected argument: $arg"
      fi
      ;;
  esac
done

PLUGIN_DIR="$(resolve_plugin_dir "${PLUGIN_INPUT}")"
MANIFEST_PATH="$PLUGIN_DIR/plugin.json"

if [[ ! -f "$MANIFEST_PATH" ]]; then
  fail "plugin manifest not found: $MANIFEST_PATH"
fi

mapfile -t MANIFEST_INFO < <(read_manifest_info "$MANIFEST_PATH")
PLUGIN_ID="${MANIFEST_INFO[0]:-}"
HAS_FRONTEND="${MANIFEST_INFO[1]:-false}"

if [[ -z "$PLUGIN_ID" ]]; then
  fail "plugin manifest is missing a valid id: $MANIFEST_PATH"
fi

OUTPUT_DIR="$BUILD_ROOT/$PLUGIN_ID"

log "Preparing output directory for $PLUGIN_ID"
recreate_dir "$OUTPUT_DIR"

if [[ "$HAS_FRONTEND" == "true" ]]; then
  stage_frontend_assets "$PLUGIN_DIR"
fi

trap 'cleanup_frontend_staging "$PLUGIN_DIR"' EXIT

if [[ "$BUILD_ALL_PLATFORMS" == true ]]; then
  for platform in $ALL_PLATFORMS; do
    target_os="${platform%/*}"
    target_arch="${platform#*/}"
    if ! build_plugin_so "$PLUGIN_DIR" "$OUTPUT_DIR" "$target_os" "$target_arch" 2>/dev/null; then
      log "Warning: skipped ${target_os}/${target_arch} (cross-compilation toolchain not available)"
    fi
  done
else
  target_os="$(go env GOOS)"
  target_arch="$(go env GOARCH)"
  build_plugin_so "$PLUGIN_DIR" "$OUTPUT_DIR" "$target_os" "$target_arch"
fi

log "Copying plugin manifest"
cp "$MANIFEST_PATH" "$OUTPUT_DIR/plugin.json"

log "Plugin build completed: $OUTPUT_DIR"
