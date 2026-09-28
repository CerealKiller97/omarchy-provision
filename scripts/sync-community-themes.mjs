#!/usr/bin/env node
/**
 * Syncs the community themes listed on omarchy.org/themes (src/data/themes.json in the omarchy-site
 * repo) into src/lib/community-themes.json, and their previews into static/themes/community/ as
 * self-hosted thumbnails. Output is deterministic (sorted, no timestamps), so nothing changes unless
 * the list or a preview does. A Markdown summary of what changed is printed to stdout; nothing is
 * printed when everything is unchanged.
 *
 * Env: SITE_REPO (default omacom/omarchy-site), SITE_REF (default master),
 *      GITHUB_TOKEN (optional, raises the API rate limit).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { syncThumbnails } from './lib/thumbnails.mjs';

const REPO = process.env.SITE_REPO || 'omacom/omarchy-site';
const REF = process.env.SITE_REF || 'master';
const DATA = 'src/data/themes.json';
const OUT = new URL('../src/lib/community-themes.json', import.meta.url);
const IMAGES = new URL('../static/themes/community/', import.meta.url);

const headers = {
	Accept: 'application/vnd.github+json',
	'User-Agent': 'omarchy-provision-sync',
	...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` })
};

async function get(url, parse) {
	const res = await fetch(url, { headers });
	if (!res.ok) {
		throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
	}
	return parse(res);
}

const api = (path) => get(`https://api.github.com/repos/${REPO}${path}`, (r) => r.json());
// Pinned to one commit so the theme list and its preview images always match each other.
const raw = (sha, path, parse) => get(`https://raw.githubusercontent.com/${REPO}/${sha}/${path}`, parse);

/** The name omarchy-theme-install gives a theme: repo basename minus `omarchy-` / `-theme`. */
const installName = (repoUrl) =>
	repoUrl
		.split('/')
		.pop()
		.replace(/\.git$/, '')
		.replace(/^omarchy-/, '')
		.replace(/-theme$/, '')
		.toLowerCase();

const { sha } = await api(`/commits/${encodeURIComponent(REF)}`);
const [list, { tree }] = await Promise.all([
	raw(sha, DATA, (r) => r.json()),
	api(`/git/trees/${sha}?recursive=1`)
]);
// Blob shas of every file at this commit; they identify each preview's exact content.
const blobs = new Map(tree.map((e) => [e.path, e.sha]));

const themes = [];
const previews = [];
for (const entry of list) {
	const url = String(entry.repo ?? '').replace(/\/+$/, '');
	const name = String(entry.name ?? '').trim();
	if (!name || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(url)) {
		console.error(`Skipping unrecognised theme entry: ${JSON.stringify(entry)}`);
		continue;
	}
	const slug = installName(url);
	if (!/^[a-z0-9_][a-z0-9._+-]*$/.test(slug)) {
		console.error(`Skipping ${url}: install name "${slug}" is not valid`);
		continue;
	}
	// Site-absolute (/assets/themes/x.webp), i.e. relative to the repo root.
	const path = String(entry.image ?? '').replace(/^\/+/, '');
	const key = path.split('/').pop().replace(/\.\w+$/, '');
	if (path && blobs.has(path)) {
		previews.push({ key, sha: blobs.get(path), fetch: () => raw(sha, path, (r) => r.arrayBuffer()) });
	} else {
		console.error(`No preview for ${name}: "${entry.image}" is not in ${REPO}@${sha.slice(0, 7)}`);
	}
	themes.push({ name, slug, author: url.split('/')[3], url, key: blobs.has(path) ? key : null });
}

if (themes.length < 10) {
	throw new Error(`Only ${themes.length} themes parsed, refusing to write`);
}
themes.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.url.localeCompare(b.url));

const files = await syncThumbnails(IMAGES, previews);
for (const t of themes) {
	// Relative to static/, so the UI can resolve it under any base path.
	t.image = t.key ? `themes/community/${files.get(t.key)}` : null;
	delete t.key;
}

const next = { source: `${REPO}@${REF}/${DATA}`, themes };
const json = JSON.stringify(next, null, '\t') + '\n';
const prev = await readFile(OUT, 'utf8')
	.then(JSON.parse)
	.catch(() => null);
if (prev && JSON.stringify(prev, null, '\t') + '\n' === json) {
	process.exit(0);
}
await writeFile(OUT, json);

// ── Change summary ───────────────────────────────────────────────────────────

if (!prev) {
	console.log(`Initial import of ${themes.length} community themes from ${next.source}.`);
	process.exit(0);
}

const byUrl = (list) => new Map(list.map((t) => [t.url, t]));
const before = byUrl(prev.themes ?? []);
const after = byUrl(themes);
const added = themes.filter((t) => !before.has(t.url)).map((t) => t.name);
const removed = [...before.values()].filter((t) => !after.has(t.url)).map((t) => t.name);
const changed = themes.filter((t) => before.has(t.url) && JSON.stringify(before.get(t.url)) !== JSON.stringify(t));
const repreviewed = changed.filter((t) => before.get(t.url).image !== t.image).map((t) => t.name);
const renamed = changed.filter((t) => before.get(t.url).image === t.image).map((t) => t.name);

const lines = [];
if (added.length) lines.push(`- community themes added: ${added.join(', ')}`);
if (removed.length) lines.push(`- community themes removed: ${removed.join(', ')}`);
if (repreviewed.length) lines.push(`- community theme previews updated: ${repreviewed.join(', ')}`);
if (renamed.length) lines.push(`- community themes updated: ${renamed.join(', ')}`);
if (!lines.length) lines.push('- community theme list metadata changed');
console.log(lines.join('\n'));
