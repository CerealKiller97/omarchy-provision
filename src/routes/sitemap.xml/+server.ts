import { SITE } from '$lib/site';
import type { RequestHandler } from './$types';

export const prerender = true;

/** The site is a single page. Sitemap URLs must be absolute, so it stays empty without SITE_URL. */
export const GET: RequestHandler = () => {
	const lastmod = new Date().toISOString().slice(0, 10);
	const urls = SITE.url
		? `\t<url>\n\t\t<loc>${SITE.url}/</loc>\n\t\t<lastmod>${lastmod}</lastmod>\n\t</url>\n`
		: '';
	const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>\n`;
	return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
