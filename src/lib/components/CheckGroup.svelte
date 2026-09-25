<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils';
	import AppIcon from '$lib/components/AppIcon.svelte';
	import type { Option } from '$lib/options';

	let {
		name,
		options,
		selected = $bindable(),
		columns = 'sm:grid-cols-2 lg:grid-cols-3'
	}: { name: string; options: Option[]; selected: string[]; columns?: string } = $props();

	const own = $derived(new Set(options.map((o) => o.value)));
	const count = $derived(selected.filter((v) => own.has(v)).length);

	/** Sets this group's selection, keeping values it doesn't own (e.g. set by another control). */
	function setOwn(values: string[]) {
		selected = [...selected.filter((v) => !own.has(v)), ...values];
	}

	function toggle(value: string, on: boolean) {
		setOwn(options.map((o) => o.value).filter((v) => (v === value ? on : selected.includes(v))));
	}
</script>

<div class="grid gap-3">
	<div class="flex items-center justify-between gap-4">
		<p class="text-muted-foreground text-xs tabular-nums" aria-live="polite">
			{count} of {options.length} selected
		</p>
		<div class="flex items-center gap-1">
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm px-2 py-1 text-xs font-medium transition-colors duration-150 outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
				disabled={count === options.length}
				onclick={() => setOwn(options.map((o) => o.value))}>Select all</button
			>
			<button
				type="button"
				class="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm px-2 py-1 text-xs font-medium transition-colors duration-150 outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"
				disabled={count === 0}
				onclick={() => setOwn([])}>Clear</button
			>
		</div>
	</div>

	<div class={cn('grid gap-2', columns)}>
		{#each options as o (o.value)}
			{@const on = selected.includes(o.value)}
			<label
				class={cn(
					'group relative flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors duration-150',
					'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
					on ? 'border-primary bg-muted' : 'hover:border-foreground/25 hover:bg-muted'
				)}
			>
				<input
					type="checkbox"
					class="sr-only"
					name="{name}-{o.value}"
					checked={on}
					onchange={(e) => toggle(o.value, e.currentTarget.checked)}
				/>
				<span
					aria-hidden="true"
					class={cn(
						'mt-0.5 grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-150',
						on ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'
					)}
				>
					<CheckIcon class={cn('size-3 transition-opacity duration-150', on ? 'opacity-100' : 'opacity-0')} strokeWidth={3} />
				</span>
				<span class="grid min-w-0 gap-1">
					<span class="flex items-center gap-2 text-sm leading-5 font-medium">
						<AppIcon icon={o.icon} label={o.label} />
						{o.label}
					</span>
					{#if o.hint}<span class="text-muted-foreground pl-6 text-xs leading-4">{o.hint}</span>{/if}
				</span>
			</label>
		{/each}
	</div>
</div>
