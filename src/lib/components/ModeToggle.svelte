<script lang="ts">
	import { onMount } from 'svelte';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import { cn } from '$lib/utils';
	import { colorMode, type Mode } from '$lib/mode.svelte';

	onMount(() => colorMode.init());

	const MODES: { value: Mode; label: string; icon: typeof SunIcon }[] = [
		{ value: 'light', label: 'Light', icon: SunIcon },
		{ value: 'system', label: 'System', icon: MonitorIcon },
		{ value: 'dark', label: 'Dark', icon: MoonIcon }
	];
</script>

<div role="radiogroup" aria-label="Color mode" class="bg-muted flex h-8 items-center gap-0.5 rounded-full border p-0.5">
	{#each MODES as m (m.value)}
		{@const on = colorMode.current === m.value}
		<button
			type="button"
			role="radio"
			aria-checked={on}
			aria-label={m.label}
			title={m.label}
			onclick={() => colorMode.set(m.value)}
			class={cn(
				'focus-visible:ring-ring grid size-6 place-items-center rounded-full transition-colors duration-150 outline-none focus-visible:ring-2',
				on ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
			)}
		>
			<m.icon class="size-3.5" />
		</button>
	{/each}
</div>
