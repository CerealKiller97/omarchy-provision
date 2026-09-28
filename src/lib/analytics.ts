/**
 * Umami events for exported configs. Only the predefined choices are sent (option ids that are
 * public anyway); anything the user typed (packages, URLs, commands, custom theme repos) is only
 * counted. Does nothing when the Umami script isn't loaded (dev builds, blockers).
 */

import { menuSelection, type Config } from './config';
import {
	COMMUNITY_THEMES,
	DEV_ENVS,
	MENU_INSTALLS,
	PREINSTALL_APPS,
	PREINSTALL_TUIS,
	PREINSTALL_WEBAPPS,
	SERVICES,
	type MenuInstallGroup,
	type Option
} from './options';

type EventData = Record<string, string | number | boolean>;

declare global {
	interface Window {
		umami?: { track: (event: string, data?: EventData) => void };
	}
}

// One export per distinct config per page load, so downloading and copying the same file counts once.
const tracked = new Set<string>();

/** Selected values of a predefined option list, dropping stale ids from older saved configs. */
const known = (selected: string[], options: Option[]) =>
	options.map((o) => o.value).filter((v) => selected.includes(v));

function themeName(c: Config): string {
	if (c.theme.source === 'builtin') {
		return c.theme.builtin;
	}
	if (c.theme.source === 'community') {
		return COMMUNITY_THEMES.find((t) => t.url === c.theme.url)?.slug ?? 'unknown';
	}
	// A custom repo URL is the user's own input; only record that one was used.
	return 'custom';
}

/** Every predefined multi-select choice in the config, as [group, values]. */
function selections(c: Config): [string, string[]][] {
	const groups: [string, string[]][] = [
		['services', known(c.services, SERVICES)],
		...(Object.keys(MENU_INSTALLS) as MenuInstallGroup[]).map(
			(group): [string, string[]] => [group, menuSelection(c, group)]
		),
		['dev-envs', known(c.devEnvs, DEV_ENVS)]
	];
	if (c.preinstalls === 'some') {
		groups.push(
			['remove-apps', known(c.removeApps, PREINSTALL_APPS)],
			['remove-webapps', known(c.removeWebApps, PREINSTALL_WEBAPPS)],
			['remove-tuis', known(c.removeTuis, PREINSTALL_TUIS)]
		);
	}
	return groups;
}

/**
 * Sends `export-config` with the single-value choices and counts, then one `option` event per
 * selected predefined item (`group` + `value`), so each option's popularity can be ranked in Umami.
 */
export function trackExport(c: Config, yaml: string, via: 'download' | 'copy') {
	const umami = typeof window === 'undefined' ? undefined : window.umami;
	if (!umami || tracked.has(yaml)) {
		return;
	}
	tracked.add(yaml);

	const groups = selections(c);
	umami.track('export-config', {
		via,
		target: c.target,
		'theme-source': c.theme.source,
		theme: themeName(c),
		'theme-background': Boolean(c.theme.backgroundImage),
		'default-browser': c.defaults.browser,
		'default-terminal': c.defaults.terminal,
		'default-editor': c.defaults.editor,
		'default-agent': c.defaults.agent,
		preinstalls: c.preinstalls,
		'rank-mirrors': c.updatePacmanMirrors,
		'system-update': c.initialSystemUpdate,
		...Object.fromEntries(groups.map(([group, values]) => [`${group}-count`, values.length])),
		// User-typed lists: counts only.
		'pacman-count': c.pacmanPackages.length,
		'aur-count': c.aurPackages.length,
		'plugins-count': c.plugins.length,
		'webapps-count': c.webapps.length,
		'tuis-count': c.tuis.length
	});

	for (const [group, values] of groups) {
		for (const value of values) {
			umami.track('option', { group, value });
		}
	}
}
