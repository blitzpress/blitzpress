#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CORE_DIR="$ROOT_DIR/core"
FRONTEND_DIR="$CORE_DIR/frontend"
STATIC_DIR="$CORE_DIR/static"
BUILD_DIR="$ROOT_DIR/build"

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

require_command bun
require_command go

if [[ ! -d "$FRONTEND_DIR" ]]; then
  fail "core frontend directory not found: $FRONTEND_DIR"
fi

if [[ ! -d "$CORE_DIR" ]]; then
  fail "core directory not found: $CORE_DIR"
fi

log "Installing core frontend dependencies"
(
  cd "$FRONTEND_DIR"
  bun install
)

log "Building core frontend"
(
  cd "$FRONTEND_DIR"
  bun run build
)

log "Syncing frontend dist to core/static"
recreate_dir "$STATIC_DIR"
cp -R "$FRONTEND_DIR/dist/." "$STATIC_DIR/"

log "Building core binary"
mkdir -p "$BUILD_DIR"
(
  cd "$CORE_DIR"
  go build -o "$BUILD_DIR/blitzpress" .
)

log "Core build completed: $BUILD_DIR/blitzpress"
