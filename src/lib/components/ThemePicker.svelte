<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '$lib/utils';
	import { BUILTIN_THEMES, THEME_PALETTES, themeImage } from '$lib/options';

	/** `only` limits the list to these theme names (e.g. what Try Omarchy ships). */
	let { value = $bindable(), only }: { value: string; only?: string[] } = $props();

	const themes = $derived(only ? BUILTIN_THEMES.filter((t) => only.includes(t.value)) : BUILTIN_THEMES);

	const SWATCHES = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta', 'accent'] as const;

	let broken = $state<Record<string, boolean>>({});
</script>

<div role="radiogroup" aria-label="Built-in theme" class="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
	{#each themes as t (t.value)}
		{@const p = THEME_PALETTES[t.value]}
		{@const on = value === t.value}
		{@const src = themeImage(p.preview)}
		<label
			class={cn(
				'group relative grid min-w-0 cursor-pointer grid-cols-1 gap-2 rounded-lg border p-2 transition-colors duration-150',
				'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
				on ? 'border-primary ring-primary ring-1' : 'hover:border-foreground/25'
			)}
		>
			<input type="radio" class="sr-only" name="builtin-theme" value={t.value} bind:group={value} />

			<!-- The theme's own preview screenshot, with its six colors and accent as a strip below. -->
			<div
				class="grid overflow-hidden rounded-md border border-black/5 dark:border-white/10"
				style:background-color={p.background}
				aria-hidden="true"
			>
				<div class="aspect-video overflow-hidden">
					{#if src && !broken[t.value]}
						<img
							{src}
							alt=""
							loading="lazy"
							decoding="async"
							class="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
							onerror={() => (broken[t.value] = true)}
						/>
					{:else}
						<!-- No preview: a miniature of the theme's background and text. -->
						<div class="grid content-start gap-1 p-3">
							<span class="h-1.5 w-12 rounded-full opacity-90" style:background-color={p.foreground}></span>
							<span class="h-1.5 w-8 rounded-full opacity-40" style:background-color={p.foreground}></span>
						</div>
					{/if}
				</div>
				<div class="flex h-1.5">
					{#each SWATCHES as c (c)}
						<span class="flex-1" style:background-color={p[c]}></span>
					{/each}
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
