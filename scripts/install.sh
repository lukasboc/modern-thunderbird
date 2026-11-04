#!/usr/bin/env bash
# Usage: scripts/install.sh <profile path>
# Copies chrome/ into the profile and appends the theme prefs to user.js (marked block).
# Re-run after changes in chrome/ to update the copy.
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

# chrome/ is copied, not linked: Thunderbird's content processes are sandboxed to the profile
# and cannot read userContent.css through a symlink into the repo.
dest="$profile/chrome"
marker="$dest/.mx-theme"
if [[ -L "$dest" ]]; then
  if [[ "$(readlink "$dest")" != "$repo/chrome" ]]; then
    echo "error: $dest is a symlink not created by this theme; move it away first" >&2
    exit 1
  fi
  rm "$dest"   # old install (symlink to this repo) → replaced by a copy
elif [[ -e "$dest" && ! -f "$marker" ]]; then
  echo "error: $dest exists and is not this theme's copy; move it away first" >&2
  exit 1
fi
mkdir -p "$dest"
rsync -a --delete "$repo/chrome/" "$dest/"
: > "$marker"

# One-time defaults: only where prefs.js has no value yet (stays adjustable in Thunderbird).
while IFS= read -r line; do
  name="$(printf '%s\n' "$line" | sed -n 's/^user_pref("\([^"]*\)".*/\1/p')"
  [[ -n "$name" ]] || continue
  grep -qF "user_pref(\"$name\"," "$profile/prefs.js" || printf '%s\n' "$line" >> "$profile/prefs.js"
done < "$repo/prefs/defaults.js"

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
