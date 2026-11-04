#!/usr/bin/env bash
# Builds dist/modern-thunderbird-theme.xpi from theme/ (manifest.json at the zip root).
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$repo/dist"
out="$repo/dist/modern-thunderbird-theme.xpi"
rm -f "$out"
(cd "$repo/theme" && zip -q -r -X "$out" .)
echo "$out"
