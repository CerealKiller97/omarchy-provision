/** Site-wide copy and metadata used by the page head, header and footer. */
export const SITE = {
	name: 'Omarchy Provision',
	title: 'Omarchy Provision · Set up Omarchy even faster',
	tagline: 'Omarchy is fast. Your setup is even faster.',
	description:
		'Omarchy already installs in minutes. Pick your theme, apps and tools once, keep omarchy.yml in your dotfiles, and let one command provision every new machine.',
	/** Absolute site URL (the SITE_URL Actions variable), set by the deploy workflow. */
	url: ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, ''),
	author: { name: 'Stefan Bogdanović', url: 'https://stefanbogdanovic.dev' },
	/** This project's GitHub repository (the header's Star button). */
	repo: 'https://github.com/CerealKiller97/omarchy-provision',
	/** Umami analytics; only loaded when `url` is set (production builds), and only counts that domain. */
	analytics: {
		src: 'https://analytics.stefanbogdanovic.dev/script.js',
		websiteId: 'b75dc9d4-6112-49dc-9bc1-04171e976b18'
	},
	/** Where to report vulnerabilities; published as `Contact` in /.well-known/security.txt. */
	securityContact: 'https://stefanbogdanovic.dev/contact'
};
