# Brand assets

## Favicon and social card

[`static/favicon.svg`](../static/favicon.svg) is the source icon; it inverts in dark browser UIs.
[`scripts/brand/og.html`](../scripts/brand/og.html) is the 1200×630 social card.

```bash
pnpm brand
```

regenerates `favicon.ico`, `apple-touch-icon.png` and `og.png`. It needs `rsvg-convert`, ImageMagick
and a Chromium-based browser.

Site copy and the author link live in [`src/lib/site.ts`](../src/lib/site.ts). The deploy workflow
sets `VITE_SITE_URL` so Open Graph URLs are absolute.

## README banner

The README banner (`docs/readme-banner-{light,dark}.png`, 1280×640 at 2x) is
[`scripts/brand/readme-banner.html`](../scripts/brand/readme-banner.html) with a live screenshot of the
built site.

```bash
pnpm brand:readme
```

rebuilds it after UI changes: it builds the site, serves it locally and captures both color modes.
The dark banner also works as the repository's social preview (**Settings → General → Social
preview**).
