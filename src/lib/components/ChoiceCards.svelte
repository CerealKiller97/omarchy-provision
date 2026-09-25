<script lang="ts" generics="T extends string">
	import { cn } from '$lib/utils';

	let {
		name,
		options,
		value = $bindable(),
		label,
		class: className
	}: {
		name: string;
		options: { value: T; label: string; hint?: string }[];
		value: T;
		label: string;
		class?: string;
	} = $props();
</script>

<div role="radiogroup" aria-label={label} class={cn('grid gap-2 sm:grid-cols-3', className)}>
	{#each options as o (o.value)}
		{@const on = value === o.value}
		<label
			class={cn(
				'relative flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors duration-150',
				'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
				on ? 'border-primary bg-muted' : 'hover:border-foreground/25 hover:bg-muted'
			)}
		>
			<input type="radio" class="sr-only" {name} value={o.value} bind:group={value} />
			<span
				aria-hidden="true"
				class={cn(
					'mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border transition-colors duration-150',
					on ? 'border-primary' : 'border-input bg-background'
				)}
			>
				<span
					class={cn(
						'bg-primary size-2 rounded-full transition-transform duration-150',
						on ? 'scale-100' : 'scale-0'
					)}
				></span>
			</span>
			<span class="grid gap-1">
				<span class="text-sm leading-5 font-medium">{o.label}</span>
				{#if o.hint}<span class="text-muted-foreground text-xs leading-4">{o.hint}</span>{/if}
			</span>
		</label>
	{/each}
</div>
