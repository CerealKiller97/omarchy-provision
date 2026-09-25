/**
 * Quick-pick icons for web app and TUI launchers. Omarchy downloads launcher icons as PNG, and
 * its own TUI installer points to dashboardicons.com, so these are that set's PNGs on jsDelivr.
 * Every slug below exists in homarr-labs/dashboard-icons/png.
 */

export const ICON_CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png';

export type CatalogIcon = {
	name: string;
	slug: string;
	/** Web apps: hostnames this icon is suggested for (subdomains match too). */
	domains?: string[];
	/** TUIs: commands this icon is suggested for. */
	commands?: string[];
};

export const catalogUrl = (icon: CatalogIcon) => `${ICON_CDN}/${icon.slug}.png`;

export const WEBAPP_ICONS: CatalogIcon[] = [
	{ name: 'ChatGPT', slug: 'chatgpt', domains: ['chatgpt.com', 'chat.openai.com'] },
	{ name: 'Claude', slug: 'claude-ai', domains: ['claude.ai'] },
	{ name: 'Gemini', slug: 'google-gemini', domains: ['gemini.google.com'] },
	{ name: 'Perplexity', slug: 'perplexity', domains: ['perplexity.ai'] },
	{ name: 'GitHub', slug: 'github', domains: ['github.com'] },
	{ name: 'GitLab', slug: 'gitlab', domains: ['gitlab.com'] },
	{ name: 'Linear', slug: 'linear', domains: ['linear.app'] },
	{ name: 'Jira', slug: 'jira', domains: ['atlassian.net'] },
	{ name: 'Confluence', slug: 'confluence' },
	{ name: 'Notion', slug: 'notion', domains: ['notion.so', 'notion.com'] },
	{ name: 'Figma', slug: 'figma', domains: ['figma.com'] },
	{ name: 'Excalidraw', slug: 'excalidraw', domains: ['excalidraw.com'] },
	{ name: 'Miro', slug: 'miro', domains: ['miro.com'] },
	{ name: 'Asana', slug: 'asana', domains: ['asana.com'] },
	{ name: 'Todoist', slug: 'todoist', domains: ['todoist.com'] },
	{ name: 'Slack', slug: 'slack', domains: ['slack.com'] },
	{ name: 'Discord', slug: 'discord', domains: ['discord.com'] },
	{ name: 'Microsoft Teams', slug: 'microsoft-teams', domains: ['teams.microsoft.com', 'teams.live.com'] },
	{ name: 'Telegram', slug: 'telegram', domains: ['telegram.org'] },
	{ name: 'WhatsApp', slug: 'whatsapp', domains: ['whatsapp.com'] },
	{ name: 'Gmail', slug: 'gmail', domains: ['mail.google.com'] },
	{ name: 'Proton Mail', slug: 'proton-mail', domains: ['mail.proton.me'] },
	{ name: 'Outlook', slug: 'microsoft-outlook', domains: ['outlook.live.com', 'outlook.office.com'] },
	{ name: 'Google Calendar', slug: 'google-calendar', domains: ['calendar.google.com'] },
	{ name: 'Google Drive', slug: 'google-drive', domains: ['drive.google.com'] },
	{ name: 'Google Docs', slug: 'google-docs', domains: ['docs.google.com'] },
	{ name: 'Google Meet', slug: 'google-meet', domains: ['meet.google.com'] },
	{ name: 'Google Maps', slug: 'google-maps', domains: ['maps.google.com'] },
	{ name: 'Google Photos', slug: 'google-photos', domains: ['photos.google.com'] },
	{ name: 'Zoom', slug: 'zoom', domains: ['zoom.us'] },
	{ name: 'YouTube', slug: 'youtube', domains: ['youtube.com'] },
	{ name: 'YouTube Music', slug: 'youtube-music', domains: ['music.youtube.com'] },
	{ name: 'Spotify', slug: 'spotify', domains: ['spotify.com'] },
	{ name: 'Netflix', slug: 'netflix', domains: ['netflix.com'] },
	{ name: 'Reddit', slug: 'reddit', domains: ['reddit.com'] },
	{ name: 'Hacker News', slug: 'hacker-news', domains: ['news.ycombinator.com'] },
	{ name: 'X', slug: 'x', domains: ['x.com', 'twitter.com'] },
	{ name: 'Basecamp', slug: 'basecamp', domains: ['basecamp.com'] },
	{ name: 'Home Assistant', slug: 'home-assistant' },
	{ name: 'Jellyfin', slug: 'jellyfin' },
	{ name: 'Plex', slug: 'plex', domains: ['plex.tv'] },
	{ name: 'Immich', slug: 'immich' },
	{ name: 'Nextcloud', slug: 'nextcloud' },
	{ name: 'Grafana', slug: 'grafana' },
	{ name: 'Portainer', slug: 'portainer' },
	{ name: 'Proxmox', slug: 'proxmox' },
	{ name: 'Tailscale', slug: 'tailscale', domains: ['tailscale.com'] },
	{ name: 'Cloudflare', slug: 'cloudflare', domains: ['cloudflare.com'] },
	{ name: 'Vercel', slug: 'vercel', domains: ['vercel.com'] },
	{ name: 'Netlify', slug: 'netlify', domains: ['netlify.com'] },
	{ name: 'Supabase', slug: 'supabase', domains: ['supabase.com'] },
	{ name: 'Bitwarden', slug: 'bitwarden', domains: ['bitwarden.com'] },
	{ name: '1Password', slug: '1password', domains: ['1password.com'] }
];

export const TUI_ICONS: CatalogIcon[] = [
	{ name: 'Terminal', slug: 'terminal', commands: ['btop', 'htop', 'top', 'ncdu', 'dua'] },
	{ name: 'Docker', slug: 'docker', commands: ['lazydocker', 'docker', 'ctop'] },
	{ name: 'Git', slug: 'git', commands: ['lazygit', 'gitui', 'tig'] },
	{ name: 'Neovim', slug: 'neovim', commands: ['nvim'] },
	{ name: 'Yazi', slug: 'yazi', commands: ['yazi'] },
	{ name: 'Kubernetes', slug: 'kubernetes', commands: ['k9s', 'kubectl'] },
	{ name: 'PostgreSQL', slug: 'postgresql', commands: ['psql', 'pgcli'] },
	{ name: 'Redis', slug: 'redis', commands: ['redis-cli'] },
	{ name: 'MongoDB', slug: 'mongodb', commands: ['mongosh'] },
	{ name: 'Glances', slug: 'glances', commands: ['glances'] },
	{ name: 'Arch Linux', slug: 'arch-linux', commands: ['pacman', 'yay', 'paru'] },
	{ name: 'Omarchy', slug: 'omarchy', commands: ['omarchy'] }
];

/** The catalog icon whose domain matches a web app URL, if any. */
export function suggestForUrl(url: string): CatalogIcon | undefined {
	let host: string;
	try {
		host = new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return undefined;
	}
	return WEBAPP_ICONS.find((i) => i.domains?.some((d) => host === d || host.endsWith(`.${d}`)));
}

/** The catalog icon whose command matches a TUI command line, if any. */
export function suggestForCommand(command: string): CatalogIcon | undefined {
	const bin = command.trim().split(/\s+/)[0]?.split('/').pop() ?? '';
	return bin ? TUI_ICONS.find((i) => i.commands?.includes(bin)) : undefined;
}
