#!/usr/bin/env bash
# Usage: scripts/install.sh <profile path>
# Links chrome/ into the profile and appends the theme prefs to user.js (marked block).
set -euo pipefail

repo="$(cd "$(dirname "$0")/.." && pwd)"
profile="${1:-}"
begin="// >>> mx-theme"
end="// <<< mx-theme"

if [[ -z "$profile" || ! -f "$profile/prefs.js" ]]; then
  echo "error: '$profile' is not a Thunderbird profile (no prefs.js)" >&2
  exit 1
fi
if pgrep -xq "${MX_TB_PROCESS:-thunderbird}"; then
  echo "error: Thunderbird is running; quit it first" >&2
  exit 1
fi

link="$profile/chrome"
if [[ -e "$link" || -L "$link" ]]; then
  if [[ ! -L "$link" || "$(readlink "$link")" != "$repo/chrome" ]]; then
    echo "error: $link exists and is not this theme's symlink; move it away first" >&2
    exit 1
  fi
else
  ln -s "$repo/chrome" "$link"
fi

userjs="$profile/user.js"
if [[ -f "$userjs" ]] && grep -qF "$begin" "$userjs"; then
  echo "prefs already installed"
  exit 0
fi
[[ -f "$userjs" ]] || : > "$profile/user.js.mx-none"

{
  if [[ -s "$userjs" && -n "$(tail -c1 "$userjs")" ]]; then echo; fi
  echo "$begin"
  cat "$repo/prefs/user.js"
  echo "$end"
} >> "$userjs"

echo "installed into $profile – start Thunderbird"
