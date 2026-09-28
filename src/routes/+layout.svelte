<script lang="ts">
	import './layout.css';
	import { asset } from '$app/paths';
	import { SITE } from '$lib/site';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={asset('/favicon.ico')} sizes="48x48" />
	<link rel="icon" href={asset('/favicon.svg')} type="image/svg+xml" />
	<link rel="apple-touch-icon" href={asset('/apple-touch-icon.png')} />
	{#if SITE.url}
		<script
			defer
			src={SITE.analytics.src}
			data-website-id={SITE.analytics.websiteId}
			data-domains={new URL(SITE.url).hostname}
		></script>
	{/if}
</svelte:head>
{@render children()}
