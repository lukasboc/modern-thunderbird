#!/usr/bin/env bash
# Usage: scripts/uninstall.sh <profile path>
# Reverts scripts/install.sh: removes the chrome/ symlink, the marked user.js block and
# the theme prefs Thunderbird copied into prefs.js. Other content is left untouched.
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
  echo "error: Thunderbird is running; quit it first (it rewrites prefs.js on exit)" >&2
  exit 1
fi

# prefs.js first: if it cannot be read, stop before changing anything.
prefs="$profile/prefs.js"
patterns="$(mktemp)"
filtered="$(mktemp)"
trap 'rm -f "$patterns" "$filtered"' EXIT
sed -n 's/^user_pref("\([^"]*\)".*/user_pref("\1",/p' "$repo/prefs/user.js" "$repo/prefs/defaults.js" > "$patterns"
status=0
grep -v -F -f "$patterns" "$prefs" > "$filtered" || status=$?
if (( status > 1 )); then
  echo "error: could not read $prefs; nothing changed" >&2
  exit 1
fi
if ! cmp -s "$prefs" "$filtered"; then
  cp -p "$prefs" "$prefs.mx-bak"
  cat "$filtered" > "$prefs"   # keeps inode and mode (0600)
fi

link="$profile/chrome"
if [[ -L "$link" && "$(readlink "$link")" == "$repo/chrome" ]]; then
  rm "$link"
fi

userjs="$profile/user.js"
if [[ -f "$userjs" ]]; then
  awk -v b="$begin" -v e="$end" '$0==b{skip=1; next} $0==e{skip=0; next} !skip' "$userjs" > "$filtered"
  cat "$filtered" > "$userjs"
  if [[ -f "$profile/user.js.mx-none" && ! -s "$userjs" ]]; then rm "$userjs"; fi
fi
rm -f "$profile/user.js.mx-none"

echo "uninstalled from $profile – start Thunderbird"
[[ -f "$prefs.mx-bak" ]] && echo "backup of the previous prefs.js: $prefs.mx-bak"
exit 0
