#!/usr/bin/env bash
# Wrapper: runs the real cargo-tauri with LD_LIBRARY_PATH set only for cargo.
export LD_LIBRARY_PATH="${HOME}/anaconda3/lib${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
exec "$(which -a cargo-tauri | tail -1)" "$@"
