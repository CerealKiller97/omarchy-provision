<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils';
	import { BUILTIN_THEMES, THEME_PALETTES } from '$lib/options';

	let { value = $bindable() }: { value: string } = $props();

	const SWATCHES = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'] as const;
</script>

<div role="radiogroup" aria-label="Built-in theme" class="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
	{#each BUILTIN_THEMES as t (t.value)}
		{@const p = THEME_PALETTES[t.value]}
		{@const on = value === t.value}
		<label
			class={cn(
				'group relative grid min-w-0 cursor-pointer grid-cols-1 gap-2 rounded-lg border p-2 transition-colors duration-150',
				'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
				on ? 'border-primary ring-primary ring-1' : 'hover:border-foreground/25'
			)}
		>
			<input type="radio" class="sr-only" name="builtin-theme" value={t.value} bind:group={value} />

			<!-- Miniature of the theme: background, two text lines, its six colors and accent. -->
			<div
				class="flex h-20 flex-col justify-between rounded-md border border-black/5 p-3 dark:border-white/10"
				style:background-color={p.background}
				aria-hidden="true"
			>
				<div class="grid gap-1">
					<span class="h-1.5 w-12 rounded-full opacity-90" style:background-color={p.foreground}></span>
					<span class="h-1.5 w-8 rounded-full opacity-40" style:background-color={p.foreground}></span>
				</div>
				<div class="flex items-center gap-1">
					{#each SWATCHES as c (c)}
						<span class="size-2 rounded-full" style:background-color={p[c]}></span>
					{/each}
					<span class="ml-auto h-2 w-6 rounded-full" style:background-color={p.accent}></span>
				</div>
			</div>

			<div class="flex items-center justify-between gap-2 px-1 pb-1">
				<span class="truncate text-sm font-medium" title={t.label}>{t.label}</span>
				{#if on}
					<span class="bg-primary text-primary-foreground grid size-4 shrink-0 place-items-center rounded-full">
						<CheckIcon class="size-3" strokeWidth={3} />
					</span>
				{:else}
					<span class="text-muted-foreground hidden text-xs capitalize sm:inline">{p.mode ?? 'dark'}</span>
				{/if}
			</div>
		</label>
	{/each}
</div>
