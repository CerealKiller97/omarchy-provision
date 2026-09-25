#!/usr/bin/env bash
# Regenerates the brand assets in static/ from the sources in this folder.
# Needs rsvg-convert + ImageMagick (icons) and a Chromium-based browser (og.png).
set -euo pipefail
cd "$(dirname "$0")/../.."

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Favicon fallbacks: the light variant of static/favicon.svg (its dark @media rule disabled).
sed 's/@media (prefers-color-scheme: dark) {/@media not all {/' static/favicon.svg > "$tmp/fav.svg"
for s in 16 32 48; do rsvg-convert -w $s -h $s "$tmp/fav.svg" -o "$tmp/$s.png"; done
magick "$tmp/16.png" "$tmp/32.png" "$tmp/48.png" static/favicon.ico
rsvg-convert -w 180 -h 180 scripts/brand/icon-square.svg -o static/apple-touch-icon.png

browser=""
for b in "${CHROME:-}" \
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
	"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
	"/Applications/Chromium.app/Contents/MacOS/Chromium" \
	google-chrome chromium chromium-browser; do
	if [[ -n $b ]] && command -v "$b" >/dev/null 2>&1 || [[ -x $b ]]; then browser=$b; break; fi
done
[[ -n $browser ]] || { echo "No Chromium-based browser found (set CHROME=/path/to/browser)" >&2; exit 1; }

"$browser" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
	--window-size=1200,630 --virtual-time-budget=3000 \
	--screenshot="$PWD/static/og.png" "file://$PWD/scripts/brand/og.html" 2>/dev/null
echo "Wrote static/favicon.ico, static/apple-touch-icon.png, static/og.png"
