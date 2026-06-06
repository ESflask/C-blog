#!/usr/bin/env bash
# CMake を設定してビルドする。
set -euo pipefail

cd "$(dirname "$0")/.."

BUILD_TYPE="${1:-Release}"

cmake -S . -B build -DCMAKE_BUILD_TYPE="$BUILD_TYPE"
cmake --build build -j"$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu)"

echo "Build complete: ./build/blog_app"
