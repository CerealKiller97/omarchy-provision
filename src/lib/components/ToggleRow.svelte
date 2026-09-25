<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';

	let {
		id,
		label,
		description,
		checked = $bindable()
	}: {
		id: string;
		label: Snippet | string;
		description?: Snippet | string;
		checked: boolean;
	} = $props();
</script>

<div class="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
	<div class="grid gap-1">
		<Label for={id} class="text-sm leading-5 font-medium">
			{#if typeof label === 'string'}{label}{:else}{@render label()}{/if}
		</Label>
		{#if description}
			<p class="text-muted-foreground text-xs leading-4">
				{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}
			</p>
		{/if}
	</div>
	<Switch {id} bind:checked />
</div>
