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
	siBattledotnet,
	siBitwarden,
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
	siGoogle,
	siGooglechrome,
	siGooglemaps,
	siGooglemessages,
	siGooglephotos,
	siHelix,
	siHeroicgameslauncher,
	siHey,
	siKdenlive,
	siLaravel,
	siLibreoffice,
	siLmstudio,
	siLutris,
	siNeovim,
	siNodedotjs,
	siNordvpn,
	siNvidia,
	siObsidian,
	siObsstudio,
	siOcaml,
	siOllama,
	siOpencode,
	siOpenjdk,
	siPerplexity,
	siPhoenixframework,
	siPhp,
	siPython,
	siRetroarch,
	siRuby,
	siRust,
	siScala,
	siSignal,
	siSpotify,
	siSteam,
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

const BROWSER_BRANDS: Record<string, SimpleIcon> = {
	chrome: siGooglechrome,
	brave: siBrave,
	'brave-origin': siBrave,
	firefox: siFirefoxbrowser,
	zen: siZenbrowser
};

/**
 * Values `omarchy default browser` takes, synced by scripts/sync-omarchy.mjs: the Install > Browser
 * menu (installed with `omarchy install browser <value>`) plus preinstalled ones.
 */
export const BROWSERS: Option[] = omarchy.browsers.map((b) => ({
	value: b.id,
	label: b.label,
	hint: b.preinstalled ? 'Preinstalled' : undefined,
	icon: BROWSER_BRANDS[b.id]
}));

const TERMINAL_BRANDS: Record<string, SimpleIcon> = { alacritty: siAlacritty, ghostty: siGhostty };

/** Omarchy's Install > Terminal menu, synced by scripts/sync-omarchy.mjs; `omarchy install terminal <value>`. */
export const TERMINALS: Option[] = omarchy.terminals.map((t) => ({
	value: t.id,
	label: t.label,
	// The menu hides installed terminals, so say which ones Omarchy already ships.
	hint: omarchy.packages.base.includes(t.id) ? 'Preinstalled' : undefined,
	icon: TERMINAL_BRANDS[t.id]
}));

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

const EDITOR_BRANDS: Record<string, SimpleIcon> = {
	cursor: siCursor,
	zed: siZedindustries,
	sublime: siSublimetext,
	helix: siHelix,
	vim: siVim,
	emacs: siGnuemacs
};

const AI_BRANDS: Record<string, SimpleIcon> = {
	'grok-bot': siX,
	'lm-studio': siLmstudio,
	ollama: siOllama,
	perplexity: siPerplexity
};

const GAMING_BRANDS: Record<string, SimpleIcon> = {
	steam: siSteam,
	retroarch: siRetroarch,
	'geforce-now': siNvidia,
	battlenet: siBattledotnet,
	lutris: siLutris,
	heroic: siHeroicgameslauncher
};

/** `summary` is the upstream script's own description, when the entry has a script of its own. */
type MenuInstall = { id: string; label: string; install: string; summary?: string };

// Preinstalled browsers and terminals are only choices for the default, not things to install.
const installableOnly = (list: { id: string; label: string; install?: string; preinstalled: boolean }[]) =>
	list.filter((e): e is MenuInstall & { preinstalled: boolean } => !e.preinstalled && !!e.install);

/**
 * Install menus synced by scripts/sync-omarchy.mjs, keyed by their `Config` field: YAML key, menu
 * name, entries and brand icons. Object order is the YAML order.
 */
export const MENU_INSTALLS = {
	browsers: { yaml: 'install_browsers', menu: 'Browser', entries: installableOnly(omarchy.browsers), brands: BROWSER_BRANDS },
	terminals: { yaml: 'install_terminals', menu: 'Terminal', entries: installableOnly(omarchy.terminals), brands: TERMINAL_BRANDS },
	editors: { yaml: 'install_editors', menu: 'Editor', entries: omarchy.editors as MenuInstall[], brands: EDITOR_BRANDS },
	ai: { yaml: 'install_ai', menu: 'AI', entries: omarchy.ai as MenuInstall[], brands: AI_BRANDS },
	gaming: { yaml: 'install_gaming', menu: 'Gaming', entries: omarchy.gaming as MenuInstall[], brands: GAMING_BRANDS }
};
export type MenuInstallGroup = keyof typeof MENU_INSTALLS;

/** A menu's entries as checkbox options, in the menu's order. */
export const menuOptions = (group: MenuInstallGroup): Option[] =>
	MENU_INSTALLS[group].entries.map((e) => ({
		value: e.id,
		label: e.label,
		hint: e.summary,
		icon: (MENU_INSTALLS[group].brands as Record<string, SimpleIcon>)[e.id]
	}));

export const EDITOR_INSTALLS = menuOptions('editors');

/** Default-editor values (see EDITORS) that need installing first, mapped to their menu id. */
export const DEFAULT_EDITOR_INSTALL: Record<string, string> = {
	code: 'vscode',
	cursor: 'cursor',
	zed: 'zed',
	sublime_text: 'sublime',
	helix: 'helix',
	vim: 'vim',
	emacs: 'emacs'
};

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

export type Target = 'omarchy' | 'try-omarchy';

/** Where the config will be applied: a normal install, or the Try Omarchy macOS VM. */
export const TARGETS: { value: Target; label: string }[] = [
	{ value: 'omarchy', label: 'Omarchy' },
	{ value: 'try-omarchy', label: 'Try Omarchy (macOS)' }
];

/** The subset of built-in themes the Try Omarchy VM image ships, synced from its guest/spec.json. */
export const TRY_OMARCHY_THEMES: string[] = omarchy.tryOmarchy?.themes ?? [];

/** Try Omarchy's Omarchy release (it pins its own commit, so it can trail the latest release). */
export const TRY_OMARCHY_RELEASE: string = omarchy.tryOmarchy?.release ?? '';

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

/**
 * The Install › Service menu, in its order. Most map to `omarchy install service <value>`;
 * static/apply.sh maps the two menu entries that have no omarchy-install-service-* script.
 */
export const SERVICES: Option[] = [
	{ value: '1password', label: '1Password', icon: si1password },
	{ value: 'dropbox', label: 'Dropbox', icon: siDropbox },
	{ value: 'spotify', label: 'Spotify', icon: siSpotify },
	{ value: 'signal', label: 'Signal', icon: siSignal },
	{ value: 'tailscale', label: 'Tailscale', icon: siTailscale },
	{ value: 'nordvpn', label: 'NordVPN', icon: siNordvpn },
	{ value: 'once', label: 'ONCE', hint: 'Self-hosted 37signals apps' },
	{ value: 'bitwarden', label: 'Bitwarden', icon: siBitwarden },
	{ value: 'chromium-account', label: 'Chromium Account', hint: 'Google sign-in for Chromium', icon: siGoogle }
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
