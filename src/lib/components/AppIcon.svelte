<script lang="ts">
	import type { SimpleIcon } from 'simple-icons';
	import { cn } from '$lib/utils';

	/**
	 * Brand glyph (Simple Icons) in its brand color, or a letter badge when there is none. Brand
	 * colors that would disappear against the light or dark surface fall back to the text color.
	 */
	let { icon, label, class: className }: { icon?: SimpleIcon; label: string; class?: string } = $props();

	const LIGHT_SURFACE = 1; // #ffffff
	const DARK_SURFACE = luminance('111111');
	const MIN_CONTRAST = 1.6;

	function luminance(hex: string) {
		const [r, g, b] = [0, 2, 4].map((i) => {
			const c = parseInt(hex.slice(i, i + 2), 16) / 255;
			return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * r + 0.7152 * g + 0.0722 * b;
	}

	const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

	const colors = $derived.by(() => {
		if (!icon) return '';
		const l = luminance(icon.hex);
		const pick = (surface: number) =>
			contrast(l, surface) >= MIN_CONTRAST ? `#${icon.hex}` : 'currentColor';
		return `--brand-light: ${pick(LIGHT_SURFACE)}; --brand-dark: ${pick(DARK_SURFACE)}`;
	});
</script>

{#if icon}
	<svg viewBox="0 0 24 24" aria-hidden="true" class={cn('brand size-4 shrink-0', className)} style={colors}>
		<path d={icon.path} />
	</svg>
{:else}
	<span
		aria-hidden="true"
		class={cn(
			'bg-foreground/10 grid size-4 shrink-0 place-items-center rounded-[4px] text-[9px] leading-none font-semibold uppercase',
			className
		)}>{label.replace(/[^a-z0-9]/gi, '')[0] ?? '?'}</span
	>
{/if}

<style>
	/* Painted with `fill`, so hover/focus text-color changes in menus don't wash the brand out. */
	.brand {
		--brand: var(--brand-light);
		fill: var(--brand);
	}
	:global(.dark) .brand {
		--brand: var(--brand-dark);
	}
</style>
