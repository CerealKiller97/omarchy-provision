#!/usr/bin/env node
/**
 * Fetches the latest Omarchy release's package lists and built-in themes from GitHub and writes them
 * to src/lib/omarchy.json, with each theme's preview as a self-hosted thumbnail in
 * static/themes/builtin/. Everything comes from the release tag, so the version, packages and themes
 * always describe what users actually run. The output is deterministic (sorted, no timestamps), so
 * nothing changes until upstream does. A Markdown summary of what changed is printed to stdout;
 * nothing is printed when the data is unchanged.
 *
 * The editors, terminals, browsers, AI and gaming apps come from the release's Install menus
 * (default/omarchy/omarchy-menu.jsonc), each with the `omarchy` command that installs it without
 * the menu's floating terminal. Browsers are the values `omarchy default browser` accepts: the ones
 * the menu installs plus preinstalled ones (Chromium).
 *
 * It also records which built-in themes Try Omarchy (the macOS VM, omacom/try-omarchy) ships: its
 * image only copies the themes listed in guest/spec.json.
 *
 * Env: OMARCHY_REPO (default basecamp/omarchy), OMARCHY_REF (default: the latest release tag;
 *      set it to preview a branch), TRY_OMARCHY_REPO (default omacom/try-omarchy),
 *      GITHUB_TOKEN (optional, raises the API rate limit).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { syncThumbnails } from './lib/thumbnails.mjs';

const REPO = process.env.OMARCHY_REPO || 'basecamp/omarchy';
const TRY_REPO = process.env.TRY_OMARCHY_REPO || 'omacom/try-omarchy';
const TRY_SPEC = 'guest/spec.json';
const OUT = new URL('../src/lib/omarchy.json', import.meta.url);
const IMAGES = new URL('../static/themes/builtin/', import.meta.url);
const MENU = 'default/omarchy/omarchy-menu.jsonc';
const DEFAULT_BROWSER = 'bin/omarchy-default-browser';
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
const raw = (sha, path, parse = (r) => r.text()) =>
	get(`https://raw.githubusercontent.com/${REPO}/${sha}/${path}`, parse);

const PALETTE_KEYS = ['mode', 'background', 'foreground', 'accent', 'red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];

/** Picks the palette keys out of a theme's flat `key = "value"` colors.toml. */
const parsePalette = (text) => {
	const all = Object.fromEntries(
		[...text.matchAll(/^\s*([\w-]+)\s*=\s*"([^"]*)"/gm)].map(([, k, v]) => [k, v.toLowerCase()])
	);
	return Object.fromEntries(PALETTE_KEYS.filter((k) => all[k]).map((k) => [k, all[k]]));
};

/** Splits a shell command into words, honouring single and double quotes. */
const shellWords = (text) =>
	[...String(text).matchAll(/'([^']*)'|"((?:\\.|[^"\\])*)"|(\S+)/g)].map(([, sq, dq, bare]) =>
		sq ?? (dq !== undefined ? dq.replace(/\\(.)/g, '$1') : bare)
	);

const MENU_TERMINAL = 'omarchy-launch-floating-terminal-with-presentation';
const PACKAGE = /^[a-z0-9@_+][a-z0-9@._+-]*$/;

/**
 * The `omarchy` arguments that do what a menu action does, minus the UI around it:
 * `omarchy-install-and-launch <name> '<pkgs>' <desktop-id>` and `omarchy-install-app <name> '<pkgs>'`
 * become `pkg add <pkgs>`, and any other `omarchy-x-y [args]` script becomes `x y [args]`
 * (e.g. `install editor zed`, `voxtype install`).
 * Returns null for anything else, so an action this can't translate is never guessed at.
 */
function installArgs(action) {
	let words = shellWords(action);
	if (words[0] === MENU_TERMINAL) words = shellWords(words.slice(1).join(' '));
	const [cmd, ...args] = words;
	if (cmd === 'omarchy-install-and-launch' || cmd === 'omarchy-install-app') {
		const pkgs = shellWords(args[1] ?? '');
		return pkgs.length && pkgs.every((p) => PACKAGE.test(p)) ? `pkg add ${pkgs.join(' ')}` : null;
	}
	if (/^omarchy-(?!launch-|menu-)[a-z0-9-]+$/.test(cmd ?? '') && args.every((a) => /^[\w.-]+$/.test(a)))
		return [...cmd.replace(/^omarchy-/, '').split('-'), ...args].join(' ');
	return null;
}

/** Entries under `<prefix>.` in the menu file, in menu order: one `"key": {...}` object per line. */
const parseMenu = (text, prefix) =>
	[...text.matchAll(/^\s*"([\w.-]+)":\s*(\{.*\}),?\s*$/gm)]
		.filter(([, key]) => key.startsWith(`${prefix}.`))
		.map(([, key, json]) => ({ id: key.slice(prefix.length + 1), ...JSON.parse(json) }));

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

// The version is the latest published release. A branch's own `version` file is a
// development marker (e.g. "4.0.0.alpha") and does not reflect what users run.
const tag = String((await api('/releases/latest')).tag_name);
const version = tag.replace(/^v/, '');
const REF = process.env.OMARCHY_REF || tag;
const { sha } = await api(`/commits/${encodeURIComponent(REF)}`);

const [{ tree }, menu, defaultBrowser, ...lists] = await Promise.all([
	api(`/git/trees/${sha}?recursive=1`),
	raw(sha, MENU),
	raw(sha, DEFAULT_BROWSER),
	...Object.values(PACKAGE_LISTS).map((path) => raw(sha, path).then(parsePackages))
]);
const packages = Object.fromEntries(Object.keys(PACKAGE_LISTS).map((k, i) => [k, lists[i]]));
if (tree.truncated) throw new Error(`Tree of ${REPO}@${REF} is truncated, refusing to guess the theme list`);

// Blob shas of every file at this commit; they identify each preview's exact content.
const blobs = new Map(tree.map((e) => [e.path, e.sha]));
const themeNames = tree
	.map((e) => e.path.match(/^themes\/([^/]+)\/colors\.toml$/)?.[1])
	.filter(Boolean)
	.sort();
const palettes = await Promise.all(
	themeNames.map((name) => raw(sha, `themes/${name}/colors.toml`).then(parsePalette))
);
const previews = await syncThumbnails(
	IMAGES,
	themeNames
		.filter((name) => blobs.has(`themes/${name}/preview.png`))
		.map((name) => ({
			key: name,
			sha: blobs.get(`themes/${name}/preview.png`),
			fetch: () => raw(sha, `themes/${name}/preview.png`, (r) => r.arrayBuffer())
		}))
);
const themes = Object.fromEntries(
	themeNames.map((name, i) => [
		name,
		// Relative to static/, so the UI can resolve it under any base path.
		{ ...palettes[i], ...(previews.has(name) && { preview: `themes/builtin/${previews.get(name)}` }) }
	])
);

/**
 * Menu entries under `prefix` that translate to an install command (see installArgs). Only entries
 * that hide or disable themselves once installed (`when` / `disabled`) are installs; the rest are
 * actions like RetroArch's "add a game launcher". `script` is set when the command runs a script of
 * its own (no extra arguments), whose `omarchy:summary` then describes just this entry.
 */
const menuInstalls = (prefix, accept = () => true) =>
	parseMenu(menu, prefix).flatMap(({ id, label, action, when, disabled }) => {
		if (!when && !disabled) return [];
		const install = installArgs(action);
		// The script it runs must exist at this commit, so a renamed one is caught here, not on apply.
		// Like the omarchy CLI, the longest leading run of words names the script; the rest are arguments.
		const words = install?.split(' ') ?? [];
		const count = words.findLastIndex((_, i) => blobs.has(`bin/omarchy-${words.slice(0, i + 1).join('-')}`)) + 1;
		if (!install || !count || !accept(id, install)) {
			console.error(`Skipping ${prefix}.${id}: unexpected menu action: ${action}`);
			return [];
		}
		const own = count === words.length && !install.startsWith('pkg add');
		return [{ id, label, install, ...(own && { script: `bin/omarchy-${words.join('-')}` }) }];
	});

/** Replaces each entry's `script` with its `omarchy:summary` header (as `summary`), when it has one. */
const withSummaries = (entries) =>
	Promise.all(
		entries.map(async ({ script, ...entry }) => {
			if (!script) return entry;
			const summary = (await raw(sha, script)).match(/^# omarchy:summary=(.+)$/m)?.[1].trim().replace(/\.$/, '');
			return summary ? { ...entry, summary } : entry;
		})
	);

const [editors, ai, gaming] = await Promise.all(
	['install.editor', 'install.ai', 'install.gaming'].map((prefix) => withSummaries(menuInstalls(prefix)))
);
// `omarchy install terminal <id>` also makes it the default; apply.sh relies on that for the default
// terminal, so only terminals the menu installs exactly that way are offered.
const terminals = menuInstalls('install.terminal', (id, install) => install === `install terminal ${id}`).map(
	({ id, label, install }) => ({ id, label, install, preinstalled: packages.base.includes(id) })
);

// `# omarchy:args=[chromium|chrome|...]` lists every value `omarchy default browser` takes.
const browserIds = (defaultBrowser.match(/^# omarchy:args=\[?([\w|-]+)\]?\s*$/m)?.[1] ?? '').split('|').filter(Boolean);
const installable = new Map(
	menuInstalls('install.browser', (id, install) => install === `install browser ${id}`).map((b) => [b.id, b])
);
const browsers = browserIds.flatMap((id) => {
	const b = installable.get(id);
	if (b) return [{ id, label: b.label, install: b.install, preinstalled: false }];
	// Not in the menu: only offered when Omarchy ships it, since nothing here could install it.
	if (packages.base.includes(id)) return [{ id, label: id[0].toUpperCase() + id.slice(1), preinstalled: true }];
	console.error(`Skipping browser "${id}": not in the Install > Browser menu and not preinstalled`);
	return [];
});

if (
	!version ||
	!packages.base.length ||
	!themeNames.length ||
	!editors.length ||
	!terminals.length ||
	!browsers.length ||
	!ai.length ||
	!gaming.length
)
	throw new Error('Upstream data looks empty, refusing to write');

const prev = await readFile(OUT, 'utf8')
	.then(JSON.parse)
	.catch(() => null);

// Try Omarchy builds its image from its own pinned Omarchy commit, so a theme it lists may be
// missing from this release; only themes both have are offered. When the spec can't be read,
// the last synced list is kept rather than failing the whole sync.
const tryOmarchy = await get(`https://raw.githubusercontent.com/${TRY_REPO}/HEAD/${TRY_SPEC}`, (r) => r.json())
	.then((spec) => {
		const listed = (spec.themes ?? []).map(String);
		const missing = listed.filter((t) => !themes[t]);
		if (missing.length) console.error(`Try Omarchy themes not in ${REF}, skipped: ${missing.join(', ')}`);
		const offered = listed.filter((t) => themes[t]).sort();
		if (!offered.length) throw new Error(`${TRY_SPEC} lists no known themes`);
		return { repo: TRY_REPO, release: String(spec.upstream?.release ?? ''), themes: offered };
	})
	.catch((e) => {
		console.error(`Keeping the previous Try Omarchy data: ${e.message}`);
		return prev?.tryOmarchy ?? null;
	});

const next = { repo: REPO, ref: REF, version, packages, themes, browsers, editors, terminals, ai, gaming, tryOmarchy };

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
const palette = ({ preview, ...colors } = {}) => JSON.stringify(colors);
const recolored = themeNames.filter((t) => oldThemes[t] && palette(oldThemes[t]) !== palette(themes[t]));
const repreviewed = themeNames.filter((t) => oldThemes[t] && oldThemes[t].preview !== themes[t].preview);
if (addedThemes.length) lines.push(`- themes added: ${addedThemes.join(', ')}`);
if (removedThemes.length) lines.push(`- themes removed: ${removedThemes.join(', ')}`);
if (recolored.length) lines.push(`- theme colors changed: ${recolored.join(', ')}`);
if (repreviewed.length) lines.push(`- theme previews changed: ${repreviewed.join(', ')}`);
if (prev.ref !== REF) lines.push(`- synced from: ${prev.ref ?? '-'} -> ${REF}`);
const installList = (list) => (list ?? []).map((e) => `${e.label} (${e.install})`).join(', ') || '-';
for (const [key, list] of Object.entries({ editors, ai, gaming }))
	if (installList(prev[key]) !== installList(list))
		lines.push(`- ${key}: ${installList(prev[key])} -> ${installList(list)}`);
const browserList = (list) =>
	(list ?? []).map((b) => b.label + (b.preinstalled ? ' (preinstalled)' : '')).join(', ') || '-';
if (browserList(prev.browsers) !== browserList(browsers))
	lines.push(`- browsers: ${browserList(prev.browsers)} -> ${browserList(browsers)}`);
const terminalList = (list) => (list ?? []).map((t) => t.label).join(', ') || '-';
if (terminalList(prev.terminals) !== terminalList(terminals))
	lines.push(`- terminals: ${terminalList(prev.terminals)} -> ${terminalList(terminals)}`);
const tryThemes = (t) => t?.themes?.join(', ') || '-';
if (tryThemes(prev.tryOmarchy) !== tryThemes(tryOmarchy))
	lines.push(`- Try Omarchy themes: ${tryThemes(prev.tryOmarchy)} -> ${tryThemes(tryOmarchy)}`);
if ((prev.tryOmarchy?.release ?? '') !== (tryOmarchy?.release ?? ''))
	lines.push(`- Try Omarchy release: ${prev.tryOmarchy?.release || '-'} -> ${tryOmarchy?.release || '-'}`);
// Something else changed (e.g. a menu entry's summary); still give the commit a body.
if (!lines.length) lines.push('- Omarchy metadata changed (menu details)');
console.log(lines.join('\n'));
