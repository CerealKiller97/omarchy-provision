#!/usr/bin/env node
/**
 * Extracts the community themes listed on omarchy.org/themes (themes/index.html in the
 * omarchy-site repo) and writes them to src/lib/community-themes.json. Output is deterministic
 * (sorted, no timestamps), so the file only changes when the list does. A Markdown summary of
 * what changed is printed to stdout; nothing is printed when the list is unchanged.
 *
 * Env: SITE_REPO (default omacom/omarchy-site), SITE_REF (default master),
 *      GITHUB_TOKEN (optional, raises the API rate limit).
 */

import { readFile, writeFile } from 'node:fs/promises';

const REPO = process.env.SITE_REPO || 'omacom/omarchy-site';
const REF = process.env.SITE_REF || 'master';
const PAGE = 'themes/index.html';
const OUT = new URL('../src/lib/community-themes.json', import.meta.url);

const headers = {
	Accept: 'application/vnd.github.raw+json',
	'User-Agent': 'omarchy-provision-sync',
	...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` })
};

const url = `https://api.github.com/repos/${REPO}/contents/${PAGE}?ref=${encodeURIComponent(REF)}`;
const res = await fetch(url, { headers });
if (!res.ok) throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
const html = await res.text();

const decode = (s) =>
	s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.trim();

/** The name omarchy-theme-install gives a theme: repo basename minus `omarchy-` / `-theme`. */
const installName = (repoUrl) =>
	repoUrl
		.replace(/\/+$/, '')
		.split('/')
		.pop()
		.replace(/\.git$/, '')
		.replace(/^omarchy-/, '')
		.replace(/-theme$/, '')
		.toLowerCase();

const themes = [];
for (const [, figure] of html.matchAll(/<figure class="themes__theme">([\s\S]*?)<\/figure>/g)) {
	const repo = figure.match(/<a href="([^"]+)"/)?.[1]?.replace(/\/+$/, '');
	const image = figure.match(/<img src="([^"]+)"/)?.[1];
	const name = figure.match(/<figcaption>[\s\S]*?>([^<]+)<\/a>/)?.[1];
	if (!repo || !name || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(repo)) {
		console.error(`Skipping unrecognised theme entry: ${figure.replace(/\s+/g, ' ').slice(0, 160)}`);
		continue;
	}
	const slug = installName(repo);
	if (!/^[a-z0-9_][a-z0-9._+-]*$/.test(slug)) {
		console.error(`Skipping ${repo}: install name "${slug}" is not valid`);
		continue;
	}
	themes.push({
		name: decode(name),
		slug,
		author: repo.split('/')[3],
		url: repo,
		// Site-relative; the UI serves it from omarchy.org, which is built from this repo.
		image: image ?? null
	});
}

themes.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.url.localeCompare(b.url));
if (themes.length < 10) throw new Error(`Only ${themes.length} themes parsed, refusing to write`);

const next = { source: `${REPO}@${REF}/${PAGE}`, themes };
const json = JSON.stringify(next, null, '\t') + '\n';
const prev = await readFile(OUT, 'utf8')
	.then(JSON.parse)
	.catch(() => null);
if (prev && JSON.stringify(prev, null, '\t') + '\n' === json) process.exit(0);
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
const changed = themes
	.filter((t) => before.has(t.url) && JSON.stringify(before.get(t.url)) !== JSON.stringify(t))
	.map((t) => t.name);

const lines = [];
if (added.length) lines.push(`- community themes added: ${added.join(', ')}`);
if (removed.length) lines.push(`- community themes removed: ${removed.join(', ')}`);
if (changed.length) lines.push(`- community themes updated: ${changed.join(', ')}`);
if (!lines.length) lines.push('- community theme list metadata changed');
console.log(lines.join('\n'));
