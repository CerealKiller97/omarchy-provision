<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	let {
		id,
		title,
		icon: Icon,
		description,
		meta,
		children
	}: {
		id: string;
		title: string;
		icon: Component;
		description?: Snippet | string;
		meta?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section {id} aria-labelledby="{id}-title" class="bg-card scroll-mt-24 rounded-xl border shadow-xs">
	<header class="flex items-start gap-4 border-b px-6 py-4">
		<div
			class="bg-secondary text-foreground grid size-8 shrink-0 place-items-center rounded-md border"
			aria-hidden="true"
		>
			<Icon class="size-4" />
		</div>
		<div class="grid min-w-0 flex-1 gap-1">
			<h2 id="{id}-title" class="text-base leading-6 font-semibold">{title}</h2>
			{#if typeof description === 'string'}
				<p class="text-muted-foreground text-sm">{description}</p>
			{:else if description}
				<p class="text-muted-foreground text-sm">{@render description()}</p>
			{/if}
		</div>
		{#if meta}<div class="flex shrink-0 items-center gap-2 self-center">{@render meta()}</div>{/if}
	</header>
	<div class="p-6">
		{@render children()}
	</div>
</section>
