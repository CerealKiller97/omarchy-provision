<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import XIcon from '@lucide/svelte/icons/x';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let {
		id,
		items = $bindable(),
		validator,
		placeholder,
		mono = true,
		normalize = (v: string) => v.trim()
	}: {
		id: string;
		items: string[];
		validator: (v: string) => string | null;
		placeholder?: string;
		mono?: boolean;
		normalize?: (v: string) => string;
	} = $props();

	let draft = $state('');
	let error = $state<string | null>(null);

	function add() {
		const v = normalize(draft);
		if (!v) return;
		error = validator(v) ?? (items.includes(v) ? 'Already added' : null);
		if (error) return;
		items = [...items, v];
		draft = '';
	}
</script>

<div class="grid gap-2">
	<div class="flex gap-2">
		<Input
			{id}
			bind:value={draft}
			{placeholder}
			class={mono ? 'font-mono text-sm' : ''}
			autocomplete="off"
			spellcheck="false"
			aria-invalid={error ? true : undefined}
			aria-describedby="{id}-help"
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					add();
				}
			}}
			oninput={() => (error = null)}
		/>
		<Button type="button" variant="outline" onclick={add} disabled={!draft.trim()}>
			<PlusIcon class="size-4" /> Add
		</Button>
	</div>
	<p id="{id}-help" class="text-xs {error ? 'text-destructive' : 'text-muted-foreground'}" aria-live="polite">
		{error ?? 'Press Enter to add.'}
	</p>
	{#if items.length}
		<ul class="flex flex-wrap gap-2" aria-label="Added">
			{#each items as item (item)}
				<li transition:fade={{ duration: 150 }}>
					<span
						class="bg-secondary inline-flex h-7 items-center gap-1 rounded-md border pr-1 pl-2 text-xs {mono
							? 'font-mono'
							: 'font-medium'}"
					>
						{item}
						<button
							type="button"
							class="text-muted-foreground hover:bg-background hover:text-foreground focus-visible:ring-ring grid size-5 place-items-center rounded-sm transition-colors duration-150 outline-none focus-visible:ring-2"
							aria-label="Remove {item}"
							onclick={() => (items = items.filter((i) => i !== item))}
						>
							<XIcon class="size-3" />
						</button>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
