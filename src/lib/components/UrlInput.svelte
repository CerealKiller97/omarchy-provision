<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	/**
	 * URL field with the scheme as a fixed prefix: the user types `linear.app`, the bound value is
	 * `https://linear.app`. Pasting a full URL keeps its scheme, so `http://` still works for local
	 * services.
	 */
	let {
		id,
		value = $bindable(),
		class: className,
		...rest
	}: { id: string; value: string; class?: string } & Omit<HTMLInputAttributes, 'value' | 'id'> = $props();

	const SCHEME = /^(https?):\/\//i;

	const scheme = $derived(value.match(SCHEME)?.[1].toLowerCase() === 'http' ? 'http' : 'https');
	const address = $derived(value.replace(SCHEME, ''));

	function oninput(e: Event & { currentTarget: HTMLInputElement }) {
		const raw = e.currentTarget.value;
		const pasted = raw.match(SCHEME);
		const host = raw.replace(SCHEME, '');
		value = host ? `${pasted ? pasted[1].toLowerCase() : scheme}://${host}` : '';
		// A pasted scheme moves into the prefix; the field keeps just the address.
		if (pasted) e.currentTarget.value = host;
	}
</script>

<div
	class={cn(
		'border-input flex h-9 w-full min-w-0 overflow-hidden rounded-md border shadow-xs transition-[color,box-shadow] duration-150 dark:bg-input/30',
		'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-3',
		'has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/20 dark:has-[[aria-invalid=true]]:ring-destructive/40 has-[[aria-invalid=true]]:ring-3',
		className
	)}
>
	<label
		for={id}
		class="bg-muted text-muted-foreground border-input flex shrink-0 cursor-text items-center border-r px-3 font-mono text-sm select-none"
		title="Paste an http:// URL to switch the scheme"
	>
		{scheme}://
	</label>
	<input
		{id}
		type="text"
		inputmode="url"
		autocomplete="off"
		autocapitalize="off"
		spellcheck="false"
		value={address}
		{oninput}
		class="placeholder:text-muted-foreground h-full w-full min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm outline-none"
		{...rest}
	/>
</div>
