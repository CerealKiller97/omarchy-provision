import { SITE } from '$lib/site';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	const lines = ['# allow crawling everything by default', 'User-agent: *', 'Disallow:'];
	if (SITE.url) {
		lines.push('', `Sitemap: ${SITE.url}/sitemap.xml`);
	}
	return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
