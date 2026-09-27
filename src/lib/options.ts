/**
 * Every predefined choice offered by the form. Values are exactly what the
 * `omarchy` CLI accepts (taken from the `omarchy:args` headers of the
 * `omarchy-*` scripts on the quattro branch), so the exported YAML can only
 * contain valid options.
 */

import { asset } from '$app/paths';
import type { Asset } from '$app/types';
import omarchy from './omarchy.json';
import community from './community-themes.json';
import type { SimpleIcon } from 'simple-icons';
import {
	si1password,
	siAlacritty,
	siBasecamp,
	siBrave,
	siBun,
	siClaude,
	siClojure,
	siCursor,
	siDeno,
	siDiscord,
	siDocker,
	siDotnet,
	siDropbox,
	siElixir,
	siFirefoxbrowser,
	siGhostty,
	siGithubcopilot,
	siGnuemacs,
	siGo,
	siGooglechrome,
	siGooglemaps,
	siGooglemessages,
	siGooglephotos,
	siHelix,
	siHey,
	siKdenlive,
	siLaravel,
	siLibreoffice,
	siNeovim,
	siNodedotjs,
	siNordvpn,
	siObsidian,
	siObsstudio,
	siOcaml,
	siOpencode,
	siOpenjdk,
	siPhoenixframework,
	siPhp,
	siPython,
	siRuby,
	siRust,
	siScala,
	siSignal,
	siSpotify,
	siSublimetext,
	siSymfony,
	siTailscale,
	siVim,
	siWhatsapp,
	siX,
	siYoutube,
	siZedindustries,
	siZenbrowser,
	siZig,
	siZoom
} from 'simple-icons';

/** `icon` is a Simple Icons brand glyph; options without one render a letter badge. */
export type Option = { value: string; label: string; hint?: string; icon?: SimpleIcon };

export const BROWSERS: Option[] = [
	{ value: 'chromium', label: 'Chromium' },
	{ value: 'chrome', label: 'Google Chrome', icon: siGooglechrome },
	{ value: 'brave', label: 'Brave', icon: siBrave },
	{ value: 'brave-origin', label: 'Brave Origin', icon: siBrave },
	{ value: 'edge', label: 'Microsoft Edge' },
	{ value: 'firefox', label: 'Firefox', icon: siFirefoxbrowser },
	{ value: 'zen', label: 'Zen', icon: siZenbrowser }
];

export const TERMINALS: Option[] = [
	{ value: 'alacritty', label: 'Alacritty', icon: siAlacritty },
	{ value: 'foot', label: 'Foot' },
	{ value: 'ghostty', label: 'Ghostty', icon: siGhostty },
	{ value: 'kitty', label: 'Kitty' }
];

export const EDITORS: Option[] = [
	{ value: 'nvim', label: 'Neovim', icon: siNeovim },
	{ value: 'vim', label: 'Vim', icon: siVim },
	{ value: 'helix', label: 'Helix', icon: siHelix },
	{ value: 'emacs', label: 'Emacs', icon: siGnuemacs },
	{ value: 'code', label: 'VS Code' },
	{ value: 'cursor', label: 'Cursor', icon: siCursor },
	{ value: 'zed', label: 'Zed', icon: siZedindustries },
	{ value: 'sublime_text', label: 'Sublime Text', icon: siSublimetext }
];

export const AGENTS: Option[] = [
	{ value: 'claude', label: 'Claude Code', icon: siClaude },
	{ value: 'codex', label: 'Codex' },
	{ value: 'opencode', label: 'opencode', icon: siOpencode },
	{ value: 'copilot', label: 'GitHub Copilot CLI', icon: siGithubcopilot },
	{ value: 'cursor-agent', label: 'Cursor Agent', icon: siCursor },
	{ value: 'agy', label: 'Antigravity' },
	{ value: 'crush', label: 'Crush' },
	{ value: 'grok', label: 'Grok' },
	{ value: 'pi', label: 'pi' },
	{ value: 'omp', label: 'oh-my-pi' },
	{ value: 'ori', label: 'Ori' },
	{ value: 'openclaw', label: 'OpenClaw' },
	{ value: 'hermes', label: 'Hermes' },
	{ value: 'muse', label: 'Muse' }
];

export type ThemePalette = {
	mode?: string;
	background?: string;
	foreground?: string;
	accent?: string;
	red?: string;
	yellow?: string;
	green?: string;
	cyan?: string;
	blue?: string;
	magenta?: string;
	/** Self-hosted preview thumbnail, relative to static/. */
	preview?: string;
};

/** Theme palettes from each theme's colors.toml, synced by scripts/sync-omarchy.mjs. */
export const THEME_PALETTES: Record<string, ThemePalette> = omarchy.themes;

export type CommunityTheme = {
	name: string;
	/** Name omarchy-theme-install gives it (repo basename minus omarchy- / -theme). */
	slug: string;
	author: string;
	url: string;
	/** Self-hosted preview thumbnail, relative to static/. */
	image: string | null;
};

/** Community themes listed on omarchy.org/themes, synced by scripts/sync-community-themes.mjs. */
export const COMMUNITY_THEMES: CommunityTheme[] = community.themes;

/** URL of a synced theme preview (`preview` / `image` above), honouring the base path. */
export const themeImage = (path: string | null | undefined) =>
	path ? asset(`/${path}` as Asset) : null;

/** Themes shipped with Omarchy (`omarchy theme set <name>`), synced from upstream. */
export const BUILTIN_THEMES: Option[] = Object.keys(THEME_PALETTES).map((value) => ({
	value,
	label: value
		.split('-')
		.map((w) => w[0].toUpperCase() + w.slice(1))
		.join(' ')
}));

/** Desktop apps removed by `omarchy remove preinstalls`. */
export const PREINSTALL_APPS: Option[] = [
	{ value: 'aether', label: 'Aether', hint: 'Theme editor' },
	{ value: 'cliamp', label: 'Cliamp', hint: 'Terminal music player' },
	{ value: 'libreoffice-fresh', label: 'LibreOffice', hint: 'Office suite', icon: siLibreoffice },
	{ value: 'xournalpp', label: 'Xournal++', hint: 'PDF annotation & handwriting' },
	{ value: 'pinta', label: 'Pinta', hint: 'Image editor' },
	{ value: 'obsidian', label: 'Obsidian', hint: 'Notes', icon: siObsidian },
	{ value: 'obs-studio', label: 'OBS Studio', hint: 'Recording & streaming', icon: siObsstudio },
	{ value: 'kdenlive', label: 'Kdenlive', hint: 'Video editor', icon: siKdenlive },
	{ value: 'moonlight-qt', label: 'Moonlight', hint: 'Game streaming client' },
	{ value: 'lazydocker', label: 'Lazydocker', hint: 'Docker TUI' },
	{ value: 'omacut', label: 'Omacut', hint: 'Omarchy video app' },
	{ value: 'omacalc', label: 'Omacalc', hint: 'Omarchy calculator' },
	{ value: 'omawrite', label: 'Omawrite', hint: 'Omarchy writing app' }
];

/** Non-preinstall packages that are commonly removed. */
export const OTHER_REMOVABLE_APPS: Option[] = [
	{ value: 'chromium', label: 'Chromium', hint: 'Shipped as the default browser' }
];

const WEBAPP_BRANDS: Record<string, SimpleIcon | undefined> = {
	Basecamp: siBasecamp,
	Discord: siDiscord,
	'Google Maps': siGooglemaps,
	'Google Messages': siGooglemessages,
	'Google Photos': siGooglephotos,
	HEY: siHey,
	WhatsApp: siWhatsapp,
	X: siX,
	YouTube: siYoutube,
	Zoom: siZoom
};

export const PREINSTALL_WEBAPPS: Option[] = [
	'Basecamp',
	'Discord',
	'Google Contacts',
	'Google Maps',
	'Google Messages',
	'Google Photos',
	'HEY',
	'WhatsApp',
	'X',
	'YouTube',
	'Zoom'
].map((value) => ({ value, label: value, icon: WEBAPP_BRANDS[value] }));

export const PREINSTALL_TUIS: Option[] = [
	{ value: 'Disk Usage', label: 'Disk Usage' },
	{ value: 'Docker', label: 'Docker', icon: siDocker }
];

export const SERVICES: Option[] = [
	{ value: '1password', label: '1Password', icon: si1password },
	{ value: 'dropbox', label: 'Dropbox', icon: siDropbox },
	{ value: 'nordvpn', label: 'NordVPN', icon: siNordvpn },
	{ value: 'signal', label: 'Signal', icon: siSignal },
	{ value: 'spotify', label: 'Spotify', icon: siSpotify },
	{ value: 'sunshine', label: 'Sunshine', hint: 'Game streaming host' },
	{ value: 'tailscale', label: 'Tailscale', icon: siTailscale }
];

const DEV_ENV_BRANDS: Record<string, SimpleIcon> = {
	ruby: siRuby,
	node: siNodedotjs,
	bun: siBun,
	deno: siDeno,
	go: siGo,
	laravel: siLaravel,
	symfony: siSymfony,
	php: siPhp,
	python: siPython,
	elixir: siElixir,
	phoenix: siPhoenixframework,
	rust: siRust,
	java: siOpenjdk,
	zig: siZig,
	ocaml: siOcaml,
	dotnet: siDotnet,
	clojure: siClojure,
	scala: siScala
};
const DEV_ENV_LABELS: Record<string, string> = {
	node: 'Node.js',
	php: 'PHP',
	ocaml: 'OCaml',
	dotnet: '.NET'
};

export const DEV_ENVS: Option[] = [
	'ruby',
	'node',
	'bun',
	'deno',
	'go',
	'laravel',
	'symfony',
	'php',
	'python',
	'elixir',
	'phoenix',
	'rust',
	'java',
	'zig',
	'ocaml',
	'dotnet',
	'clojure',
	'scala'
].map((value) => ({ value, label: DEV_ENV_LABELS[value] ?? value[0].toUpperCase() + value.slice(1), icon: DEV_ENV_BRANDS[value] }));

export type PreinstallMode = 'keep' | 'all' | 'some';

export const PREINSTALL_MODES: { value: PreinstallMode; label: string; hint: string }[] = [
	{ value: 'keep', label: 'Keep everything', hint: 'Leave all preinstalled apps alone' },
	{
		value: 'all',
		label: 'Remove all preinstalls',
		hint: 'Runs `omarchy remove preinstalls` (desktop apps, web apps, TUIs, agent stubs)'
	},
	{ value: 'some', label: 'Remove only some', hint: 'Pick exactly which apps to remove' }
];
