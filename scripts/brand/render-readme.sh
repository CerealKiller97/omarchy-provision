#!/usr/bin/env bash
# Renders docs/readme-banner-{light,dark}.png: builds the site, screenshots it in both color
# modes, and composes each screenshot into scripts/brand/readme-banner.html.
# Needs ImageMagick and a Chromium-based browser (set CHROME=/path/to/browser to override).
set -euo pipefail
cd "$(dirname "$0")/../.."

browser=""
for b in "${CHROME:-}" \
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
	"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
	"/Applications/Chromium.app/Contents/MacOS/Chromium" \
	google-chrome chromium chromium-browser; do
	if [[ -n $b ]] && { command -v "$b" >/dev/null 2>&1 || [[ -x $b ]]; }; then browser=$b; break; fi
done
[[ -n $browser ]] || { echo "No Chromium-based browser found (set CHROME=/path/to/browser)" >&2; exit 1; }

shoot() { # shoot <out.png> <width> <height> <scale> <url> [extra flags...]
	local out=$1 w=$2 h=$3 scale=$4 url=$5
	shift 5
	"$browser" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor="$scale" \
		--window-size="$w,$h" --virtual-time-budget=5000 "$@" --screenshot="$out" "$url" 2>/dev/null
}

tmp=$(mktemp -d)
port=4179
# The banner shows the apply command, so build with the public URL rather than localhost:
# SITE_URL from the environment, else the repository's SITE_URL Actions variable.
site_url="${SITE_URL:-$(gh variable get SITE_URL 2>/dev/null || true)}"
[[ -n $site_url ]] || { echo "Set SITE_URL (or the SITE_URL repository variable) to the public site URL." >&2; exit 1; }
VITE_SITE_URL="$site_url" pnpm build >/dev/null
pnpm exec vite preview --port $port --strictPort >/dev/null 2>&1 &
server=$!
trap 'kill $server 2>/dev/null || true; rm -rf "$tmp"' EXIT
for _ in $(seq 50); do curl -fs "http://localhost:$port/" >/dev/null && break; sleep 0.2; done

read -r builtin community version < <(node -e '
	const o = require("./src/lib/omarchy.json"), c = require("./src/lib/community-themes.json");
	console.log(Object.keys(o.themes).length, c.themes.length, o.version)')

mkdir -p docs
for mode in light dark; do
	[[ $mode == dark ]] && scheme=0 || scheme=1
	# A fresh profile has no saved config, so the app shows its defaults.
	shoot "$tmp/app-$mode.png" 1440 1000 2 "http://localhost:$port/" --blink-settings=preferredColorScheme=$scheme
	# Drop the header and the section nav; keep the form and the YAML preview.
	magick "$tmp/app-$mode.png" -crop 2400x1888+480+112 +repage "$tmp/shot-$mode.png"

	sed -e "s|{{MODE}}|$mode|; s|{{SHOT}}|file://$tmp/shot-$mode.png|; s|{{BUILTIN}}|$builtin|; s|{{COMMUNITY}}|$community|; s|{{VERSION}}|$version|" \
		scripts/brand/readme-banner.html > scripts/brand/.readme-banner-$mode.html
	shoot "$tmp/banner-$mode.png" 1280 640 2 "file://$PWD/scripts/brand/.readme-banner-$mode.html" --allow-file-access-from-files
	rm scripts/brand/.readme-banner-$mode.html
	# Rendered at 2x for crisp text on high-DPI screens; stored at 2560x1280.
	magick "$tmp/banner-$mode.png" -strip -define png:compression-level=9 "docs/readme-banner-$mode.png"
done
echo "Wrote docs/readme-banner-light.png and docs/readme-banner-dark.png"
