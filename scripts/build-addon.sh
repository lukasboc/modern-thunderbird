#!/usr/bin/env bash
# Builds dist/modern-thunderbird-actions.xpi from addon/ (manifest.json at the zip root).
set -euo pipefail
repo="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$repo/dist"
out="$repo/dist/modern-thunderbird-actions.xpi"
rm -f "$out"
(cd "$repo/addon" && zip -q -r -X "$out" .)
echo "$out"
