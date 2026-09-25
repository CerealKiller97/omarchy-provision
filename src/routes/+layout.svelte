<script lang="ts">
	import './layout.css';
	import { asset } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={asset('/favicon.ico')} sizes="48x48" />
	<link rel="icon" href={asset('/favicon.svg')} type="image/svg+xml" />
	<link rel="apple-touch-icon" href={asset('/apple-touch-icon.png')} />
</svelte:head>
{@render children()}
