import {
	AGENTS,
	BROWSERS,
	BUILTIN_THEMES,
	DEFAULT_EDITOR_INSTALL,
	DEV_ENVS,
	EDITOR_INSTALLS,
	MENU_INSTALLS,
	EDITORS,
	PREINSTALL_APPS,
	PREINSTALL_TUIS,
	PREINSTALL_WEBAPPS,
	SERVICES,
	TERMINALS,
	TRY_OMARCHY_THEMES,
	type MenuInstallGroup,
	type PreinstallMode,
	type Target
} from './options';
import omarchy from './omarchy.json';

export type Webapp = { name: string; url: string; icon: string };
export type Tui = { name: string; command: string; style: 'float' | 'tile'; icon: string };

export type Config = {
	/** Only narrows the choices (Try Omarchy ships fewer themes); it is not exported. */
	target: Target;
	theme: {
		/** community = picked from omarchy.org/themes, custom = any Git repo; both install by URL. */
		source: 'builtin' | 'community' | 'custom';
		builtin: string;
		url: string;
		backgroundImage: string;
	};
	defaults: { browser: string; agent: string; terminal: string; editor: string };
	plugins: string[];
	preinstalls: PreinstallMode;
	removeApps: string[];
	removeWebApps: string[];
	removeTuis: string[];
	pacmanPackages: string[];
	aurPackages: string[];
	services: string[];
	/** Ids from the synced Install menus (MENU_INSTALLS). */
	browsers: string[];
	terminals: string[];
	editors: string[];
	ai: string[];
	gaming: string[];
	devEnvs: string[];
	webapps: Webapp[];
	tuis: Tui[];
	updatePacmanMirrors: boolean;
	initialSystemUpdate: boolean;
};

export function defaultConfig(): Config {
	return {
		target: 'omarchy',
		theme: { source: 'builtin', builtin: 'tokyo-night', url: '', backgroundImage: '' },
		defaults: { browser: 'brave', agent: 'claude', terminal: 'ghostty', editor: 'nvim' },
		plugins: [],
		preinstalls: 'keep',
		removeApps: [],
		removeWebApps: [],
		removeTuis: [],
		pacmanPackages: [],
		aurPackages: [],
		services: [],
		browsers: [],
		terminals: [],
		editors: [],
		ai: [],
		gaming: [],
		devEnvs: [],
		webapps: [],
		tuis: [],
		updatePacmanMirrors: false,
		initialSystemUpdate: true
	};
}

// ── Field validators (return an error message, or null when valid) ────────────

// Same rule omarchy-theme-install applies to the name it derives.
const THEME_NAME = /^[a-z0-9_][a-z0-9._+-]*$/;
// Arch package names: lowercase alphanumerics and @ . _ + -, not starting with - or .
const PACKAGE = /^[a-z0-9@_+][a-z0-9@._+-]*$/;
const GIT_URL = /^https:\/\/(github\.com|gitlab\.com|codeberg\.org)\/[\w.-]+\/[\w.-]+?(\.git)?\/?$/;
const HTTP_URL = /^https?:\/\/[^\s|#'"]+$/;
const ICON_NAME = /^[\w. -]+$/;
const BG_FILE = /^[\w. -]+\.(jpe?g|png|webp|gif|mp4|webm)$/i;

export const validate = {
	themeName: (v: string) =>
		!v ? 'Required' : THEME_NAME.test(v) ? null : 'Not a valid Omarchy theme name',
	themeUrl: (v: string) =>
		!v ? 'Required' : GIT_URL.test(v) ? null : 'Must be an https GitHub / GitLab / Codeberg repo URL',
	background: (v: string) =>
		!v ? null : BG_FILE.test(v) ? null : 'Must be an image/video filename (png, jpg, webp, mp4…)',
	pluginUrl: (v: string) =>
		GIT_URL.test(v) ? null : 'Must be an https GitHub / GitLab / Codeberg repo URL',
	packageName: (v: string) =>
		PACKAGE.test(v) ? null : 'Lowercase letters, digits and @ . _ + - only (Arch package name)',
	webappName: (v: string) =>
		!v
			? 'Required'
			: /[/|#'"]/.test(v)
				? "Cannot contain / | # ' or \""
				: null,
	url: (v: string) => (!v ? 'Required' : HTTP_URL.test(v) ? null : 'Must be an http(s) URL'),
	icon: (v: string) =>
		!v
			? 'Required'
			: HTTP_URL.test(v) || ICON_NAME.test(v)
				? null
				: 'Must be an http(s) URL or an installed icon name',
	tuiCommand: (v: string) =>
		!v ? 'Required' : /[|#'"]/.test(v) ? "Cannot contain | # ' or \" (quotes are stripped)" : null
};

export type Issue = { level: 'error' | 'warning'; message: string };

/** Cross-field checks. Errors block the export; warnings do not. */
export function checkConfig(c: Config): Issue[] {
	const issues: Issue[] = [];
	const err = (message: string) => issues.push({ level: 'error', message });
	const warn = (message: string) => issues.push({ level: 'warning', message });

	if (!BROWSERS.some((b) => b.value === c.defaults.browser))
		err(`Browser "${c.defaults.browser}" isn't offered by Omarchy ${omarchy.version}; pick another one.`);
	if (!TERMINALS.some((t) => t.value === c.defaults.terminal))
		err(`Terminal "${c.defaults.terminal}" isn't offered by Omarchy ${omarchy.version}; pick another one.`);

	if (c.theme.source === 'builtin' && c.target === 'try-omarchy' && !TRY_OMARCHY_THEMES.includes(c.theme.builtin))
		err(`Try Omarchy doesn't ship the ${c.theme.builtin} theme; pick one of ${TRY_OMARCHY_THEMES.join(', ')}.`);

	if (c.theme.source !== 'builtin') {
		const u = validate.themeUrl(c.theme.url);
		const n = u ? null : validate.themeName(themeNameFromUrl(c.theme.url));
		if (u) err(c.theme.source === 'community' ? 'Pick a community theme.' : `Theme URL: ${u}`);
		if (n) err(`Theme name "${themeNameFromUrl(c.theme.url)}": ${n}`);
		const b = validate.background(c.theme.backgroundImage);
		if (b) err(`Background image: ${b}`);
	}

	const removed = new Set(c.removeApps);
	if (c.preinstalls === 'all') PREINSTALL_APPS.forEach((a) => removed.add(a.value));

	for (const pkg of c.pacmanPackages)
		if (c.aurPackages.includes(pkg)) err(`"${pkg}" is listed as both a pacman and an AUR package.`);
	for (const pkg of [...c.pacmanPackages, ...c.aurPackages])
		if (removed.has(pkg)) err(`"${pkg}" is being installed and removed at the same time.`);
	const shipped = new Set(omarchy.packages.base);
	for (const pkg of [...c.pacmanPackages, ...c.aurPackages])
		if (shipped.has(pkg) && !removed.has(pkg))
			warn(`"${pkg}" already ships with Omarchy ${omarchy.version}.`);

	if (c.preinstalls === 'all' && c.defaults.agent === 'claude')
		warn('Removing all preinstalls also deletes the mise stubs for agents, including `claude`.');
	if (c.devEnvs.includes('node'))
		warn('The Node dev environment overlaps with an NVM/Node install in your own scripts.');
	if (c.defaults.editor === 'sublime_text')
		warn('Sublime Text is set as the default editor; make sure it is installed.');

	c.webapps.forEach((w, i) => {
		// Web app icons are optional: empty lets Omarchy fetch the site's own icon.
		const e = validate.webappName(w.name) ?? validate.url(w.url) ?? (w.icon ? validate.icon(w.icon) : null);
		if (e) err(`Web app #${i + 1}: ${e}`);
	});
	c.tuis.forEach((t, i) => {
		const e = validate.webappName(t.name) ?? validate.tuiCommand(t.command) ?? validate.icon(t.icon);
		if (e) err(`TUI #${i + 1}: ${e}`);
	});
	const dup = (names: string[], kind: string) => {
		const seen = new Set<string>();
		for (const n of names.map((x) => x.trim().toLowerCase()).filter(Boolean)) {
			if (seen.has(n)) err(`Duplicate ${kind} name "${n}".`);
			seen.add(n);
		}
	};
	dup(c.webapps.map((w) => w.name), 'web app');
	dup(c.tuis.map((t) => t.name), 'TUI');

	return issues;
}

// ── YAML export ──────────────────────────────────────────────────────────────

const list = (key: string, items: string[]) =>
	items.length ? `${key}:\n${items.map((i) => `  - ${i}`).join('\n')}\n` : `${key}:\n`;

/**
 * The name omarchy-theme-install gives a theme installed from `url`: the repo basename without
 * `.git`, a leading `omarchy-` or a trailing `-theme`, lowercased. apply-config.sh uses it to
 * skip re-installs and to find the theme's backgrounds/ folder.
 */
export function themeNameFromUrl(url: string): string {
	return (url.replace(/\/+$/, '').split('/').pop() ?? '')
		.replace(/\.git$/, '')
		.replace(/^omarchy-/, '')
		.replace(/-theme$/, '')
		.toLowerCase();
}

/**
 * Editors to install, in menu order: the ticked ones plus the default editor when it isn't
 * preinstalled (like the default browser and terminal, it has to be installed to be usable).
 * Ids the current Omarchy data no longer knows are dropped.
 */
export function installedEditors(c: Config): string[] {
	const wanted = new Set(c.editors);
	const forDefault = DEFAULT_EDITOR_INSTALL[c.defaults.editor];
	if (forDefault) wanted.add(forDefault);
	return EDITOR_INSTALLS.map((o) => o.value).filter((id) => wanted.has(id));
}

/**
 * A menu group's ticked ids in menu order, dropping ids the current Omarchy data no longer has.
 * The default browser and terminal are left out: apply.sh installs those with the defaults.
 */
export function menuSelection(c: Config, group: MenuInstallGroup): string[] {
	if (group === 'editors') {
		return installedEditors(c);
	}
	const wanted = new Set(c[group]);
	if (group === 'browsers') wanted.delete(c.defaults.browser);
	if (group === 'terminals') wanted.delete(c.defaults.terminal);
	return MENU_INSTALLS[group].entries.map((e) => e.id).filter((id) => wanted.has(id));
}

/** Renders the flat, comment-annotated YAML that `apply-config.sh` reads. */
export function toYaml(c: Config): string {
	const t = c.theme;
	const builtin = t.source === 'builtin';
	const out: string[] = [];

	out.push('# Generated by omarchy-provision.\n');

	out.push(
		[
			'# builtin theme: omarchy theme set <name>',
			'# other themes:  omarchy-theme-install <url>, then omarchy theme bg set <background_image>',
			'theme:',
			`  name: ${builtin ? t.builtin : themeNameFromUrl(t.url)}`,
			`  url: ${builtin ? '' : t.url}`.trimEnd(),
			`  background_image: ${builtin ? '' : t.backgroundImage}`.trimEnd(),
			''
		].join('\n')
	);

	out.push(
		[
			'# cmd: omarchy install browser <b>; omarchy default browser <b>',
			'#      omarchy default agent <a>',
			'#      omarchy install terminal <t> (also sets the default)',
			'#      omarchy default editor <e>',
			'defaults:',
			`  browser: ${c.defaults.browser}`,
			`  agent: ${c.defaults.agent}`,
			`  terminal: ${c.defaults.terminal}`,
			`  editor: ${c.defaults.editor}`,
			''
		].join('\n')
	);

	out.push('# cmd: omarchy plugin add <url> --enable --yes\n' + list('plugins', c.plugins));

	out.push(
		[
			'# keep - leave preinstalled apps alone',
			'# all  - omarchy remove preinstalls',
			'# some - remove only what is listed in remove_apps / remove_web_apps / remove_tuis',
			`preinstalls: ${c.preinstalls}`,
			''
		].join('\n')
	);

	const some = c.preinstalls === 'some';
	// Only preinstalls, so a stale value from an older saved config never reaches the export.
	const pkgs = some ? c.removeApps.filter((a) => PREINSTALL_APPS.some((o) => o.value === a)) : [];
	out.push('# cmd: omarchy pkg drop <app>\n' + list('remove_apps', pkgs));
	out.push(
		'# cmd: omarchy webapp remove <web-app>\n' + list('remove_web_apps', some ? c.removeWebApps : [])
	);
	out.push('# cmd: omarchy tui remove <name>\n' + list('remove_tuis', some ? c.removeTuis : []));

	out.push('# cmd: omarchy pkg add <package>\n' + list('pacman_packages', c.pacmanPackages));
	out.push('# cmd: omarchy pkg aur add <package>\n' + list('aur_packages', c.aurPackages));
	out.push('# cmd: omarchy install service <service>\n' + list('install_services', c.services));
	for (const [group, m] of Object.entries(MENU_INSTALLS) as [MenuInstallGroup, (typeof MENU_INSTALLS)[MenuInstallGroup]][]) {
		const args = new Map(m.entries.map((e) => [e.id, e.install]));
		out.push(
			`# cmd: omarchy <args> (from the Install > ${m.menu} menu); entries are id|args\n` +
				list(m.yaml, menuSelection(c, group).map((id) => `${id}|${args.get(id)}`))
		);
	}
	out.push('# cmd: omarchy install dev-env <env>\n' + list('install_dev_envs', c.devEnvs));
	out.push(
		'# "name|url|icon" (empty icon = the site\'s own)  cmd: omarchy webapp install <name> <url> <icon>\n' +
			list(
				'webapps',
				c.webapps.map((w) => `${w.name}|${w.url}|${w.icon}`)
			)
	);
	out.push(
		'# "name|command|float-or-tile|icon"  cmd: omarchy tui install <name> <command> <style> <icon>\n' +
			list(
				'tuis',
				c.tuis.map((x) => `${x.name}|${x.command}|${x.style}|${x.icon}`)
			)
	);

	out.push(
		[
			'# reflector: rank mirrors (replaces Omarchy\'s default mirrorlist, keeps a .bak)',
			`update_pacman_mirrors: ${c.updatePacmanMirrors}`,
			'',
			'# omarchy update -y (runs first)',
			`initial_system_update: ${c.initialSystemUpdate}`,
			''
		].join('\n')
	);

	return out.join('\n');
}

// Exported so the UI and tests can assert every option is valid.
export const ALL_OPTION_SETS = {
	BROWSERS,
	TERMINALS,
	EDITORS,
	AGENTS,
	BUILTIN_THEMES,
	SERVICES,
	DEV_ENVS,
	PREINSTALL_APPS,
	PREINSTALL_WEBAPPS,
	PREINSTALL_TUIS
};
