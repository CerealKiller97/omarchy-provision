<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import AppIcon from '$lib/components/AppIcon.svelte';
	import type { Option } from '$lib/options';

	let {
		id,
		label,
		options,
		value = $bindable(),
		hint
	}: { id: string; label: string; options: Option[]; value: string; hint?: string } = $props();

	const selected = $derived(options.find((o) => o.value === value));
</script>

<div class="grid gap-2">
	<Label for={id}>{label}</Label>
	<Select.Root type="single" bind:value>
		<Select.Trigger {id} class="w-full">
			{#if selected}
				<span class="flex min-w-0 items-center gap-2">
					<AppIcon icon={selected.icon} label={selected.label} />
					<span class="truncate">{selected.label}</span>
				</span>
			{:else}
				<span class="text-muted-foreground">Select…</span>
			{/if}
		</Select.Trigger>
		<Select.Content>
			{#each options as o (o.value)}
				<Select.Item value={o.value} label={o.label}>
					<AppIcon icon={o.icon} label={o.label} />
					{o.label}
					{#if o.hint}<span class="text-muted-foreground ml-auto pl-3 text-xs">{o.hint}</span>{/if}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
	{#if hint}<p class="text-muted-foreground text-xs">{hint}</p>{/if}
</div>
