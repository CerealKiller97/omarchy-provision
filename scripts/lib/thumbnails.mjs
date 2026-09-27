/**
 * Self-hosted theme previews. The site's CSP only allows same-origin images, so the sync scripts
 * download upstream previews and commit small webp thumbnails under static/themes/.
 *
 * A thumbnail is named `<key>-<first 8 chars of the upstream git blob sha>.webp`: a preview is only
 * downloaded and re-encoded when upstream changes it (so re-runs never churn the files), and the
 * name changes with the content, which keeps browser caches honest.
 */

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const WIDTH = 640;
const CONCURRENCY = 8;

/**
 * Makes `dir` (a URL ending in `/`) hold exactly one thumbnail per item and returns
 * key -> file name. Items: `{ key, sha, fetch }`, where `fetch()` resolves to the source image bytes.
 */
export async function syncThumbnails(dir, items) {
	await mkdir(dir, { recursive: true });
	const existing = new Set(await readdir(dir));
	const wanted = new Map(items.map((item) => [`${item.key}-${item.sha.slice(0, 8)}.webp`, item]));

	const queue = [...wanted].filter(([file]) => !existing.has(file));
	const worker = async () => {
		for (let next; (next = queue.shift()); ) {
			const [file, item] = next;
			const image = await sharp(await item.fetch())
				.resize({ width: WIDTH, withoutEnlargement: true })
				.webp({ quality: 78, effort: 6 })
				.toBuffer();
			await writeFile(new URL(file, dir), image);
		}
	};
	await Promise.all(Array.from({ length: CONCURRENCY }, worker));

	for (const file of existing) if (!wanted.has(file)) await rm(new URL(file, dir));
	return new Map([...wanted].map(([file, item]) => [item.key, file]));
}
