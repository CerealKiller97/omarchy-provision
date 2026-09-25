#!/usr/bin/env node
/**
 * Fetches the latest Omarchy release, package lists and theme palettes from GitHub and writes them to
 * src/lib/omarchy.json. The output is deterministic (sorted, no timestamps), so
 * the file only changes when upstream does. A Markdown summary of what changed
 * is printed to stdout; nothing is printed when the data is unchanged.
 *
 * Env: OMARCHY_REPO (default basecamp/omarchy), OMARCHY_REF (default quattro),
 *      GITHUB_TOKEN (optional, raises the API rate limit).
 */

import { readFile, writeFile } from 'node:fs/promises';

const REPO = process.env.OMARCHY_REPO || 'basecamp/omarchy';
const REF = process.env.OMARCHY_REF || 'quattro';
const OUT = new URL('../src/lib/omarchy.json', import.meta.url);
const PACKAGE_LISTS = {
	base: 'install/omarchy-base.packages',
	other: 'install/omarchy-other.packages'
};

const headers = {
	Accept: 'application/vnd.github+json',
	'User-Agent': 'omarchy-provision-sync',
	...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` })
};

async function get(url, parse) {
	const res = await fetch(url, { headers });
	if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
	return parse(res);
}

const api = (path) => get(`https://api.github.com/repos/${REPO}${path}`, (r) => r.json());
// Pinned to one commit so the package lists and theme palettes always match each other.
const raw = (sha, path) =>
	get(`https://raw.githubusercontent.com/${REPO}/${sha}/${path}`, (r) => r.text());

const PALETTE_KEYS = ['mode', 'background', 'foreground', 'accent', 'red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];

/** Picks the palette keys out of a theme's flat `key = "value"` colors.toml. */
const parsePalette = (text) => {
	const all = Object.fromEntries(
		[...text.matchAll(/^\s*([\w-]+)\s*=\s*"([^"]*)"/gm)].map(([, k, v]) => [k, v.toLowerCase()])
	);
	return Object.fromEntries(PALETTE_KEYS.filter((k) => all[k]).map((k) => [k, all[k]]));
};

/** One package per line; `#` starts a comment. */
const parsePackages = (text) =>
	[
		...new Set(
			text
				.split('\n')
				.map((line) => line.replace(/#.*/, '').trim())
				.filter(Boolean)
		)
	].sort();

const { sha } = await api(`/commits/${encodeURIComponent(REF)}`);
// The version is the latest published release. The branch's own `version` file is a
// development marker (e.g. "4.0.0.alpha") and does not reflect what users run.
const [version, ...lists] = await Promise.all([
	api('/releases/latest').then((r) => String(r.tag_name).replace(/^v/, '')),
	...Object.values(PACKAGE_LISTS).map((path) => raw(sha, path).then(parsePackages))
]);
const packages = Object.fromEntries(Object.keys(PACKAGE_LISTS).map((k, i) => [k, lists[i]]));

const { tree } = await api(`/git/trees/${sha}?recursive=1`);
const themeNames = tree
	.map((e) => e.path.match(/^themes\/([^/]+)\/colors\.toml$/)?.[1])
	.filter(Boolean)
	.sort();
const palettes = await Promise.all(
	themeNames.map((name) => raw(sha, `themes/${name}/colors.toml`).then(parsePalette))
);
const themes = Object.fromEntries(themeNames.map((name, i) => [name, palettes[i]]));

if (!version || !packages.base.length || !themeNames.length) throw new Error('Upstream data looks empty, refusing to write');

const next = { repo: REPO, ref: REF, version, packages, themes };
const prev = await readFile(OUT, 'utf8')
	.then(JSON.parse)
	.catch(() => null);

const json = JSON.stringify(next, null, '\t') + '\n';
if (prev && JSON.stringify(prev, null, '\t') + '\n' === json) process.exit(0);
await writeFile(OUT, json);

// ── Change summary ───────────────────────────────────────────────────────────

if (!prev) {
	const counts = Object.entries(packages).map(([k, l]) => `${l.length} ${k}`);
	console.log(
		`Initial import from ${REPO}@${REF}: ${version}, ${counts.join(', ')} packages, ${themeNames.length} themes.`
	);
	process.exit(0);
}

const lines = [];
if (prev.version !== version) lines.push(`- version: ${prev.version ?? '-'} -> ${version}`);
for (const [key, list] of Object.entries(packages)) {
	const old = new Set(prev.packages?.[key] ?? []);
	const now = new Set(list);
	const added = list.filter((p) => !old.has(p));
	const removed = [...old].filter((p) => !now.has(p));
	if (added.length) lines.push(`- ${key} packages added: ${added.join(', ')}`);
	if (removed.length) lines.push(`- ${key} packages removed: ${removed.join(', ')}`);
}
const oldThemes = prev.themes ?? {};
const addedThemes = themeNames.filter((t) => !oldThemes[t]);
const removedThemes = Object.keys(oldThemes).filter((t) => !themes[t]);
const recolored = themeNames.filter(
	(t) => oldThemes[t] && JSON.stringify(oldThemes[t]) !== JSON.stringify(themes[t])
);
if (addedThemes.length) lines.push(`- themes added: ${addedThemes.join(', ')}`);
if (removedThemes.length) lines.push(`- themes removed: ${removedThemes.join(', ')}`);
if (recolored.length) lines.push(`- theme colors changed: ${recolored.join(', ')}`);
console.log(lines.join('\n'));
