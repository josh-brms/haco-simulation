#!/usr/bin/env bash
# Launcher for ACO Mission Control with Python shared library path.
# PyO3's auto-initialize needs libpython3.13.so at runtime.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_LIB="${HOME}/anaconda3/lib"

export LD_LIBRARY_PATH="${PYTHON_LIB}${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

exec "${SCRIPT_DIR}/target/debug/aco-mission-control" "$@"
