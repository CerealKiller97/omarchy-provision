import { SITE } from '$lib/site';
import type { RequestHandler } from './$types';

export const prerender = true;

// RFC 9116 wants Expires less than a year out. It is computed at build time, and every deploy
// (including the scheduled data syncs) renews it.
const VALID_DAYS = 360;

export const GET: RequestHandler = () => {
	const expires = new Date(Date.now() + VALID_DAYS * 24 * 60 * 60 * 1000);
	expires.setUTCHours(0, 0, 0, 0);
	const lines = [
		`Contact: ${SITE.securityContact}`,
		`Expires: ${expires.toISOString()}`,
		'Preferred-Languages: en'
	];
	if (SITE.url) {
		lines.push(`Canonical: ${SITE.url}/.well-known/security.txt`);
	}
	return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
