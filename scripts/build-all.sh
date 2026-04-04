#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_PLUGIN_SCRIPT="$ROOT_DIR/scripts/build-plugin.sh"
BUILD_CORE_SCRIPT="$ROOT_DIR/scripts/build-core.sh"

log() {
  printf '==> %s\n' "$*"
}

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

if [[ ! -x "$BUILD_PLUGIN_SCRIPT" ]]; then
  fail "plugin build script is not executable: $BUILD_PLUGIN_SCRIPT"
fi

if [[ ! -x "$BUILD_CORE_SCRIPT" ]]; then
  fail "core build script is not executable: $BUILD_CORE_SCRIPT"
fi

plugin_found=false
for manifest_path in "$ROOT_DIR"/*/plugin.json; do
  if [[ ! -f "$manifest_path" ]]; then
    continue
  fi

  plugin_found=true
  plugin_dir="$(dirname "$manifest_path")"

  log "Building plugin from $(basename "$plugin_dir")"
  "$BUILD_PLUGIN_SCRIPT" "$plugin_dir"
done

if [[ "$plugin_found" == false ]]; then
  log "No plugins found to build"
fi

log "Building core"
"$BUILD_CORE_SCRIPT"

log "Full build completed"
