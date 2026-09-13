#!/usr/bin/env bash
# Dev launcher: runs tauri dev, then patches binary RPATH for Python.
# The RPATH approach avoids LD_LIBRARY_PATH which poisons system libs.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PYTHON_LIB="${HOME}/anaconda3/lib"
BINARY="${SCRIPT_DIR}/src-tauri/target/debug/aco-mission-control"

# Start tauri dev in background
npx tauri dev &
TAURI_PID=$!

# Wait for binary to appear, then patchelf it (RPATH survives cargo rebuilds
# only until the next clean build; this covers incremental builds)
PATCHED=0
for i in $(seq 1 300); do
  if [ -f "$BINARY" ] && [ "$PATCHED" -eq 0 ]; then
    patchelf --set-rpath "$PYTHON_LIB" "$BINARY" 2>/dev/null && PATCHED=1
  fi
  # Re-patch after recompiles (binary mtime changes)
  if [ -f "$BINARY" ] && [ "$PATCHED" -eq 1 ]; then
    CURRENT_MTIME=$(stat -c %Y "$BINARY" 2>/dev/null || echo 0)
    if [ "$CURRENT_MTIME" != "${LAST_MTIME:-0}" ]; then
      patchelf --set-rpath "$PYTHON_LIB" "$BINARY" 2>/dev/null
      LAST_MTIME=$CURRENT_MTIME
    fi
  fi
  sleep 0.5
done &

wait $TAURI_PID 2>/dev/null || true
