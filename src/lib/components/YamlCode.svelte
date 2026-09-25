<script lang="ts">
	import { cn } from '$lib/utils';
	import { highlightYaml, TOKEN_CLASS } from '$lib/highlight';

	let { code, class: className }: { code: string; class?: string } = $props();

	const lines = $derived(highlightYaml(code.replace(/\n$/, '')));
</script>

<!-- Line numbers live in a CSS counter so copying the text never includes them. -->
<pre class={cn('font-mono text-xs leading-5', className)}><code>{#each lines as tokens, i (i)}<span class="yaml-line">{#each tokens as t, j (j)}{#if t.kind === 'plain'}{t.text}{:else}<span class={TOKEN_CLASS[t.kind]}>{t.text}</span>{/if}{/each}{'\n'}</span>{/each}</code></pre>

<style>
	code {
		counter-reset: line;
	}
	.yaml-line {
		counter-increment: line;
	}
	.yaml-line::before {
		content: counter(line);
		display: inline-block;
		width: 2rem;
		margin-right: 1rem;
		text-align: right;
		color: var(--code-muted);
		opacity: 0.5;
		user-select: none;
	}
</style>
