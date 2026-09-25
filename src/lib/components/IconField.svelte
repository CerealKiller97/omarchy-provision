<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import ImageIcon from '@lucide/svelte/icons/image';
	import ImageOffIcon from '@lucide/svelte/icons/image-off';
	import { cn } from '$lib/utils';
	import { catalogUrl, type CatalogIcon } from '$lib/icon-catalog';

	/**
	 * Launcher icon input: a live preview, a free-form URL / icon-name field and a quick-pick list of
	 * known app icons. With `allowAuto`, empty means "let Omarchy fetch the site's own icon".
	 */
	let {
		id,
		value = $bindable(),
		catalog,
		suggestion,
		allowAuto = false,
		label,
		invalid = false
	}: {
		id: string;
		value: string;
		catalog: CatalogIcon[];
		suggestion?: CatalogIcon;
		allowAuto?: boolean;
		label: string;
		invalid?: boolean;
	} = $props();

	const AUTO = '__auto__';

	let focused = $state(false);
	let broken = $state(false);

	const isUrl = $derived(/^https?:\/\//i.test(value));
	const picked = $derived(catalog.find((c) => catalogUrl(c) === value));
	// Suggestion first so the likely match is at the top of the list.
	const ordered = $derived(suggestion ? [suggestion, ...catalog.filter((c) => c !== suggestion)] : catalog);

	$effect(() => {
		value;
		broken = false;
	});
</script>

<div class="grid gap-1">
	<div
		class={cn(
			'border-input flex h-9 w-full min-w-0 overflow-hidden rounded-md border shadow-xs transition-[color,box-shadow] duration-150 dark:bg-input/30',
			'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-3',
			invalid && 'border-destructive ring-destructive/20 dark:ring-destructive/40 ring-3'
		)}
	>
		<!-- Preview -->
		<label
			for={id}
			class="bg-muted text-muted-foreground border-input grid w-9 shrink-0 cursor-text place-items-center border-r"
			title={!value && allowAuto ? "Omarchy fetches the site's own icon" : undefined}
		>
			{#if isUrl && !broken}
				<img src={value} alt="" class="size-5 object-contain" referrerpolicy="no-referrer" onerror={() => (broken = true)} />
			{:else if isUrl}
				<ImageOffIcon class="size-4" />
			{:else if !value && allowAuto}
				<GlobeIcon class="size-4" />
			{:else}
				<ImageIcon class="size-4" />
			{/if}
		</label>

		<!-- Value: a catalog pick reads as its name until focused, then shows the real URL. -->
		<div class="relative min-w-0 flex-1">
			<input
				{id}
				type="text"
				autocomplete="off"
				autocapitalize="off"
				spellcheck="false"
				bind:value
				onfocus={() => (focused = true)}
				onblur={() => (focused = false)}
				aria-label={label}
				aria-invalid={invalid || undefined}
				placeholder={allowAuto ? 'Auto' : 'URL or name'}
				class={cn(
					'placeholder:text-muted-foreground h-full w-full bg-transparent px-2.5 text-sm outline-none',
					picked && !focused && 'text-transparent'
				)}
			/>
			{#if picked && !focused}
				<span class="pointer-events-none absolute inset-0 flex items-center px-2.5 text-sm" aria-hidden="true">
					<span class="truncate">{picked.name}</span>
				</span>
			{/if}
		</div>

		<!-- Quick pick -->
		<Select.Root
			type="single"
			bind:value={() => value || AUTO, (v) => (value = v === AUTO ? '' : v)}
		>
			<Select.Trigger
				aria-label="Pick {label.toLowerCase()}"
				class="border-input rounded-none border-0 border-l bg-transparent px-2 shadow-none data-[size=default]:h-full dark:bg-transparent"
			/>
			<Select.Content class="max-h-80">
				{#if allowAuto}
					<Select.Item value={AUTO} label="Auto">
						<GlobeIcon class="text-muted-foreground size-4" />
						<span class="grid">
							<span>Auto</span>
							<span class="text-muted-foreground text-xs">Site's own icon</span>
						</span>
					</Select.Item>
					<Select.Separator />
				{/if}
				<Select.Group>
					<Select.GroupHeading>Icons</Select.GroupHeading>
					{#each ordered as c (c.slug)}
						<Select.Item value={catalogUrl(c)} label={c.name}>
							<img src={catalogUrl(c)} alt="" loading="lazy" class="size-5 object-contain" />
							{c.name}
							{#if c === suggestion}
								<span class="text-muted-foreground ml-auto rounded border px-1.5 text-[10px] leading-4">Suggested</span>
							{/if}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
	</div>

	{#if !value && suggestion}
		<button
			type="button"
			class="text-muted-foreground hover:text-foreground focus-visible:ring-ring flex w-fit items-center gap-1 rounded-sm text-xs transition-colors duration-150 outline-none focus-visible:ring-2"
			onclick={() => (value = catalogUrl(suggestion))}
		>
			<img src={catalogUrl(suggestion)} alt="" class="size-3.5 object-contain" />
			Use {suggestion.name} icon
		</button>
	{/if}
</div>
