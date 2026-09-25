<script lang="ts">
	import { fade } from 'svelte/transition';
	import CheckIcon from '@lucide/svelte/icons/check';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import ImageOffIcon from '@lucide/svelte/icons/image-off';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { COMMUNITY_THEMES, communityThemeImage } from '$lib/options';

	/** Bound to the theme's repo URL, which is what omarchy-theme-install takes. */
	let { value = $bindable() }: { value: string } = $props();

	const PAGE = 12;

	let query = $state('');
	let limit = $state(PAGE);
	let broken = $state<Record<string, boolean>>({});

	const q = $derived(query.trim().toLowerCase());
	const matches = $derived(
		q
			? COMMUNITY_THEMES.filter((t) =>
					[t.name, t.author, t.slug].some((f) => f.toLowerCase().includes(q))
				)
			: COMMUNITY_THEMES
	);
	const visible = $derived(matches.slice(0, limit));
	const selected = $derived(COMMUNITY_THEMES.find((t) => t.url === value));
</script>

<div class="grid gap-4">
	{#if selected}
		<div class="bg-muted flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-4 py-3 text-sm" transition:fade={{ duration: 150 }}>
			<span>
				<span class="font-medium">{selected.name}</span>
				<span class="text-muted-foreground">by {selected.author}</span>
			</span>
			<span class="text-muted-foreground text-xs">
				Installs as <code class="text-foreground font-mono">{selected.slug}</code>
			</span>
			<a
				href={selected.url}
				target="_blank"
				rel="noreferrer"
				class="text-muted-foreground hover:text-foreground focus-visible:ring-ring ml-auto inline-flex items-center gap-1 rounded-sm text-xs transition-colors duration-150 outline-none focus-visible:ring-2"
			>
				Repository <ExternalLinkIcon class="size-3" />
			</a>
		</div>
	{/if}

	<div class="relative">
		<SearchIcon class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
		<input
			type="search"
			bind:value={query}
			oninput={() => (limit = PAGE)}
			placeholder="Search {COMMUNITY_THEMES.length} community themes"
			aria-label="Search community themes"
			class="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-9 w-full rounded-md border bg-transparent pr-3 pl-9 text-sm shadow-xs transition-[color,box-shadow] duration-150 outline-none focus-visible:ring-3"
		/>
	</div>

	{#if visible.length}
		<div role="radiogroup" aria-label="Community theme" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each visible as t (t.url)}
				{@const on = value === t.url}
				{@const src = communityThemeImage(t)}
				<label
					class={cn(
						'group relative grid min-w-0 cursor-pointer grid-cols-1 gap-2 rounded-lg border p-2 transition-colors duration-150',
						'has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-offset-2',
						on ? 'border-primary ring-primary ring-1' : 'hover:border-foreground/25'
					)}
				>
					<input type="radio" class="sr-only" name="community-theme" value={t.url} bind:group={value} />
					<div class="bg-muted aspect-video overflow-hidden rounded-md border border-black/5 dark:border-white/10">
						{#if src && !broken[t.url]}
							<img
								{src}
								alt=""
								loading="lazy"
								decoding="async"
								class="size-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
								onerror={() => (broken[t.url] = true)}
							/>
						{:else}
							<div class="text-muted-foreground grid size-full place-items-center">
								<ImageOffIcon class="size-5" />
							</div>
						{/if}
					</div>
					<div class="flex items-center justify-between gap-2 px-1 pb-1">
						<span class="grid min-w-0">
							<span class="truncate text-sm font-medium" title={t.name}>{t.name}</span>
							<span class="text-muted-foreground truncate text-xs">by {t.author}</span>
						</span>
						{#if on}
							<span class="bg-primary text-primary-foreground grid size-4 shrink-0 place-items-center rounded-full">
								<CheckIcon class="size-3" strokeWidth={3} />
							</span>
						{/if}
					</div>
				</label>
			{/each}
		</div>
	{:else}
		<div class="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
			No themes match “{query.trim()}”.
		</div>
	{/if}

	{#if matches.length > visible.length}
		<div class="flex items-center justify-between gap-4">
			<p class="text-muted-foreground text-xs tabular-nums">
				Showing {visible.length} of {matches.length}
			</p>
			<Button type="button" variant="outline" size="sm" onclick={() => (limit += PAGE * 2)}>
				Show more
			</Button>
		</div>
	{/if}

	<p class="text-muted-foreground text-xs">
		From <a href="https://omarchy.org/themes" target="_blank" rel="noreferrer" class="text-foreground underline underline-offset-4">omarchy.org/themes</a>, synced twice a day.
	</p>
</div>
