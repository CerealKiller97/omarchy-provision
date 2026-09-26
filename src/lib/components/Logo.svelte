<script lang="ts">
	import { cn } from '$lib/utils';

	/** The Omarchy Provision mark: a terminal prompt (>_), for "one command and you're set up". */
	let { class: className }: { class?: string } = $props();
</script>

<svg viewBox="0 0 32 32" aria-hidden="true" class={cn('size-7 shrink-0', className)}>
	<rect width="32" height="32" rx="8" class="fill-primary" />
	<g
		class="stroke-primary-foreground"
		fill="none"
		stroke-width="2.6"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M8.5 10.5l5.5 5.5-5.5 5.5" />
		<path d="M17 22h7" />
	</g>
</svg>
