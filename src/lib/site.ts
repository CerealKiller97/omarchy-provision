/** Site-wide copy and metadata used by the page head, header and footer. */
export const SITE = {
	name: 'Omarchy Provision',
	title: 'Omarchy Provision · Set up Omarchy even faster',
	tagline: 'Omarchy is fast. Your setup is even faster.',
	description:
		'Omarchy already installs in minutes. Pick your theme, apps and tools once, export omarchy.yml, and let it provision the rest.',
	/** Absolute site URL (the SITE_URL Actions variable), set by the deploy workflow. */
	url: ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/$/, ''),
	author: { name: 'Stefan Bogdanović', url: 'https://stefanbogdanovic.dev' }
};
