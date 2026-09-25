<script lang="ts">
	import { onMount, type Component } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import Section from '$lib/components/Section.svelte';
	import OptionSelect from '$lib/components/OptionSelect.svelte';
	import CheckGroup from '$lib/components/CheckGroup.svelte';
	import ChoiceCards from '$lib/components/ChoiceCards.svelte';
	import ThemePicker from '$lib/components/ThemePicker.svelte';
	import CommunityThemePicker from '$lib/components/CommunityThemePicker.svelte';
	import TagInput from '$lib/components/TagInput.svelte';
	import ToggleRow from '$lib/components/ToggleRow.svelte';
	import YamlCode from '$lib/components/YamlCode.svelte';
	import UrlInput from '$lib/components/UrlInput.svelte';
	import IconField from '$lib/components/IconField.svelte';
	import { WEBAPP_ICONS, TUI_ICONS, suggestForUrl, suggestForCommand } from '$lib/icon-catalog';
	import ModeToggle from '$lib/components/ModeToggle.svelte';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import SlidersIcon from '@lucide/svelte/icons/sliders-horizontal';
	import PackageMinusIcon from '@lucide/svelte/icons/package-minus';
	import PackageIcon from '@lucide/svelte/icons/package';
	import PlugIcon from '@lucide/svelte/icons/plug';
	import CodeIcon from '@lucide/svelte/icons/code-xml';
	import PuzzleIcon from '@lucide/svelte/icons/puzzle';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import TerminalIcon from '@lucide/svelte/icons/square-terminal';
	import SettingsIcon from '@lucide/svelte/icons/settings-2';
	import ZapIcon from '@lucide/svelte/icons/zap';
	import FileCodeIcon from '@lucide/svelte/icons/file-code';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import { checkConfig, defaultConfig, themeNameFromUrl, toYaml, validate, type Config } from '$lib/config';
	import * as O from '$lib/options';
	import { cn } from '$lib/utils';
	import omarchy from '$lib/omarchy.json';
	import svelteLogo from '$lib/assets/svelte-logo.svg';
	import { asset } from '$app/paths';
	import { SITE } from '$lib/site';

	const STORAGE_KEY = 'omarchy-provision:v1';
	// Social cards need an absolute image URL; fall back to relative for local builds.
	const ogImage = SITE.url ? `${SITE.url}/og.png` : asset('/og.png');

	let config = $state<Config>(defaultConfig());
	let ready = $state(false);
	let copied = $state(false);
	let resetArmed = $state(false);
	let active = $state('theme');

	onMount(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) config = { ...defaultConfig(), ...JSON.parse(saved) };
		} catch {
			/* storage unavailable or corrupt: start from defaults */
		}
		ready = true;

		// Highlight the section nav entry for whatever is in the upper part of the viewport.
		const observer = new IntersectionObserver(
			(entries) => {
				for (const e of entries) if (e.isIntersecting) active = e.target.id;
			},
			{ rootMargin: '-20% 0px -70% 0px' }
		);
		for (const s of SECTIONS) {
			const el = document.getElementById(s.id);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	});

	$effect(() => {
		const snapshot = JSON.stringify(config);
		if (!ready) return;
		try {
			localStorage.setItem(STORAGE_KEY, snapshot);
		} catch {
			/* ignore */
		}
	});

	const issues = $derived(checkConfig(config));
	const errors = $derived(issues.filter((i) => i.level === 'error'));
	const warnings = $derived(issues.filter((i) => i.level === 'warning'));
	const yaml = $derived(toYaml(config));
	const lineCount = $derived(yaml.replace(/\n$/, '').split('\n').length);

	const removalCount = $derived(
		config.preinstalls === 'all'
			? O.PREINSTALL_APPS.length + O.PREINSTALL_WEBAPPS.length + O.PREINSTALL_TUIS.length
			: config.preinstalls === 'some'
				? config.removeApps.length + config.removeWebApps.length + config.removeTuis.length
				: config.removeApps.filter((a) => O.OTHER_REMOVABLE_APPS.some((o) => o.value === a)).length
	);

	const SECTIONS: { id: string; label: string; icon: Component; count: () => number }[] = [
		{ id: 'theme', label: 'Theme', icon: PaletteIcon, count: () => 0 },
		{ id: 'defaults', label: 'Defaults', icon: SlidersIcon, count: () => 0 },
		{ id: 'preinstalls', label: 'Preinstalls', icon: PackageMinusIcon, count: () => removalCount },
		{
			id: 'packages',
			label: 'Packages',
			icon: PackageIcon,
			count: () => config.pacmanPackages.length + config.aurPackages.length
		},
		{ id: 'services', label: 'Services', icon: PlugIcon, count: () => config.services.length },
		{ id: 'dev-envs', label: 'Dev environments', icon: CodeIcon, count: () => config.devEnvs.length },
		{ id: 'plugins', label: 'Plugins', icon: PuzzleIcon, count: () => config.plugins.length },
		{ id: 'webapps', label: 'Web apps', icon: GlobeIcon, count: () => config.webapps.length },
		{ id: 'tuis', label: 'TUIs', icon: TerminalIcon, count: () => config.tuis.length },
		{ id: 'system', label: 'System', icon: SettingsIcon, count: () => 0 }
	];

	const fieldError = (v: string, fn: (v: string) => string | null) => (v ? fn(v) : null);
	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

	async function copyYaml() {
		try {
			await navigator.clipboard.writeText(yaml);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			/* clipboard blocked: the user can still download */
		}
	}

	function download() {
		const url = URL.createObjectURL(new Blob([yaml], { type: 'text/yaml' }));
		const a = Object.assign(document.createElement('a'), { href: url, download: 'omarchy.yml' });
		a.click();
		URL.revokeObjectURL(url);
	}

	// Reset asks for a second click so a stray click can't wipe the whole config.
	let resetTimer: ReturnType<typeof setTimeout>;
	function reset() {
		if (!resetArmed) {
			resetArmed = true;
			resetTimer = setTimeout(() => (resetArmed = false), 3000);
			return;
		}
		clearTimeout(resetTimer);
		resetArmed = false;
		config = defaultConfig();
	}
</script>

<svelte:head>
	<title>{SITE.title}</title>
	<meta name="description" content={SITE.description} />
	<meta name="author" content={SITE.author.name} />
	{#if SITE.url}<link rel="canonical" href="{SITE.url}/" />{/if}

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE.name} />
	<meta property="og:title" content={SITE.tagline} />
	<meta property="og:description" content={SITE.description} />
	{#if SITE.url}<meta property="og:url" content="{SITE.url}/" />{/if}
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="{SITE.name}: {SITE.tagline}" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={SITE.tagline} />
	<meta name="twitter:description" content={SITE.description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

{#snippet fieldHelp(id: string, error: string | null, help?: string)}
	{#if error}
		<p id="{id}-help" class="text-destructive text-xs" transition:fade={{ duration: 150 }}>{error}</p>
	{:else if help}
		<p id="{id}-help" class="text-muted-foreground text-xs">{help}</p>
	{/if}
{/snippet}

{#snippet countBadge(n: number, noun: string)}
	{#if n}
		<span class="bg-secondary rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums" transition:fade={{ duration: 150 }}>
			{plural(n, noun)}
		</span>
	{/if}
{/snippet}

{#snippet backgroundField()}
	{@const bg = validate.background(config.theme.backgroundImage)}
	<div class="grid gap-2">
		<Label for="theme-bg">
			Background image <span class="text-muted-foreground font-normal">(optional)</span>
		</Label>
		<Input
			id="theme-bg"
			class="font-mono text-sm"
			placeholder="wallpaper.jpg"
			bind:value={config.theme.backgroundImage}
			aria-invalid={bg ? true : undefined}
			aria-describedby="theme-bg-help"
		/>
		{@render fieldHelp('theme-bg', bg, "A file in the theme's backgrounds/ folder.")}
	</div>
{/snippet}

<!-- ── Top bar ─────────────────────────────────────────────────────────────── -->
<header class="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md">
	<div class="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
		<a href="#top" class="flex items-center gap-2 text-sm font-semibold">
			<span class="bg-primary text-primary-foreground grid size-7 place-items-center rounded-md">
				<ZapIcon class="size-4" fill="currentColor" />
			</span>
			{SITE.name}
		</a>
		<div class="ml-auto flex items-center gap-2">
			<a
				href="https://github.com/{omarchy.repo}/tree/{omarchy.ref}"
				target="_blank"
				rel="noreferrer"
				class="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring hidden h-8 items-center gap-2 rounded-full border px-3 text-xs transition-colors duration-150 outline-none focus-visible:ring-2 sm:inline-flex"
				title="Latest release; options synced from {omarchy.repo}@{omarchy.ref}"
			>
				<span class="bg-success size-1.5 rounded-full" aria-hidden="true"></span>
				Omarchy <span class="text-foreground font-mono">v{omarchy.version}</span>
			</a>
			<ModeToggle />
			<Button size="sm" onclick={download} disabled={errors.length > 0} aria-label="Download omarchy.yml">
				<DownloadIcon class="size-4" /> <span class="hidden sm:inline">Download</span>
			</Button>
		</div>
	</div>
</header>

<main id="top" class="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:py-12">
	<div
		class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[12rem_minmax(0,1fr)_28rem]"
	>
		<!-- ── Section nav ──────────────────────────────────────────────────────── -->
		<nav aria-label="Sections" class="sticky top-24 hidden xl:block">
			<p class="text-muted-foreground mb-2 px-3 text-xs font-medium">On this page</p>
			<ul class="grid gap-1">
				{#each SECTIONS as s (s.id)}
					{@const n = s.count()}
					<li>
						<a
							href="#{s.id}"
							aria-current={active === s.id ? 'location' : undefined}
							class={cn(
								'focus-visible:ring-ring flex h-8 items-center gap-2 rounded-md px-3 text-sm transition-colors duration-150 outline-none focus-visible:ring-2',
								active === s.id
									? 'bg-secondary text-foreground font-medium'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground'
							)}
						>
							<s.icon class="size-4 shrink-0" />
							<span class="truncate">{s.label}</span>
							{#if n}<span class="text-muted-foreground ml-auto text-xs tabular-nums">{n}</span>{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<!-- ── Form ─────────────────────────────────────────────────────────────── -->
		<div class="grid min-w-0 gap-8">
			<div class="grid gap-2">
				<h1 class="text-[32px] leading-10 font-semibold tracking-tight">Build your omarchy.yml</h1>
				<p class="text-muted-foreground max-w-2xl text-base">
					Choose a theme, defaults, apps and launchers. Every value is checked against the
					<code class="text-foreground font-mono text-sm">omarchy</code> CLI, so the file applies cleanly.
				</p>
			</div>

			<form class="grid gap-6" onsubmit={(e) => e.preventDefault()}>
				<Section
					id="theme"
					title="Theme"
					icon={PaletteIcon}
					description="Pick a built-in theme, one of the community themes, or any theme repository."
				>

					<Tabs.Root
						bind:value={
							() => config.theme.source,
							(v) => (config.theme.source = v as Config['theme']['source'])
						}
						class="gap-4"
					>
						<Tabs.List class="w-full sm:w-fit">
							<Tabs.Trigger value="builtin">Built-in</Tabs.Trigger>
							<Tabs.Trigger value="community">Community</Tabs.Trigger>
							<Tabs.Trigger value="custom">Repository</Tabs.Trigger>
						</Tabs.List>
						<Tabs.Content value="builtin">
							<ThemePicker bind:value={config.theme.builtin} />
						</Tabs.Content>
						<Tabs.Content value="community" class="grid gap-6">
							<CommunityThemePicker bind:value={config.theme.url} />
							{#if config.theme.url}{@render backgroundField()}{/if}
						</Tabs.Content>
						<Tabs.Content value="custom">
							{@const urlError = fieldError(config.theme.url, validate.themeUrl)}
							{@const installName = config.theme.url && !urlError ? themeNameFromUrl(config.theme.url) : ''}
							<div class="grid gap-4 sm:grid-cols-2">
								<div class="grid gap-2 sm:col-span-2">
									<Label for="theme-url">Repository URL</Label>
									<Input
										id="theme-url"
										class="font-mono text-sm"
										placeholder="https://github.com/Ahmad-Mtr/omarchy-temerald-theme"
										bind:value={config.theme.url}
										aria-invalid={urlError ? true : undefined}
										aria-describedby="theme-url-help"
									/>
									{#if urlError}
										{@render fieldHelp('theme-url', urlError)}
									{:else if installName}
										<p id="theme-url-help" class="text-muted-foreground text-xs">
											Installs as <code class="text-foreground font-mono">{installName}</code>
										</p>
									{:else}
										{@render fieldHelp('theme-url', null, 'GitHub, GitLab or Codeberg over https.')}
									{/if}
								</div>
								{@render backgroundField()}
							</div>
						</Tabs.Content>
					</Tabs.Root>
				</Section>


				<Section
					id="defaults"
					title="Defaults"
					icon={SlidersIcon}
					description="Browser and terminal are installed first, then set as the default."
				>
					<div class="grid gap-4 sm:grid-cols-2">
						<OptionSelect id="d-browser" label="Browser" options={O.BROWSERS} bind:value={config.defaults.browser} />
						<OptionSelect id="d-terminal" label="Terminal" options={O.TERMINALS} bind:value={config.defaults.terminal} />
						<OptionSelect id="d-editor" label="Editor" options={O.EDITORS} bind:value={config.defaults.editor} />
						<OptionSelect id="d-agent" label="Coding agent" options={O.AGENTS} bind:value={config.defaults.agent} />
					</div>
				</Section>

				<Section
					id="preinstalls"
					title="Preinstalled apps"
					icon={PackageMinusIcon}
					description="Keep Omarchy's default apps, remove them all, or choose which to remove."
				>
					{#snippet meta()}{@render countBadge(removalCount, 'removal')}{/snippet}
					<div class="grid gap-6">
						<ChoiceCards
							name="preinstalls"
							label="Preinstalled apps"
							options={O.PREINSTALL_MODES}
							bind:value={config.preinstalls}
						/>

						{#if config.preinstalls === 'some'}
							<div class="grid gap-6" transition:slide={{ duration: 200 }}>
								<div class="grid gap-2">
									<h3 class="text-sm font-semibold">Desktop apps</h3>
									<CheckGroup name="rm-app" options={O.PREINSTALL_APPS} bind:selected={config.removeApps} />
								</div>
								<div class="grid gap-2">
									<h3 class="text-sm font-semibold">Web apps</h3>
									<CheckGroup name="rm-web" options={O.PREINSTALL_WEBAPPS} bind:selected={config.removeWebApps} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
								</div>
								<div class="grid gap-2">
									<h3 class="text-sm font-semibold">TUI launchers</h3>
									<CheckGroup name="rm-tui" options={O.PREINSTALL_TUIS} bind:selected={config.removeTuis} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
								</div>
							</div>
						{/if}

						<!-- Chromium is not a "preinstall", so it is offered in every mode. -->
						<div class="border-t pt-4">
							{#each O.OTHER_REMOVABLE_APPS as o (o.value)}
								<ToggleRow
									id="rm-other-{o.value}"
									label="Remove {o.label}"
									description={o.hint}
									bind:checked={
										() => config.removeApps.includes(o.value),
										(on) =>
											(config.removeApps = on
												? [...config.removeApps, o.value]
												: config.removeApps.filter((a) => a !== o.value))
									}
								/>
							{/each}
						</div>
					</div>
				</Section>

				<Section id="packages" title="Extra packages" icon={PackageIcon}>
					{#snippet description()}
						Installed with <code class="text-foreground font-mono text-xs">omarchy pkg add</code> and
						<code class="text-foreground font-mono text-xs">omarchy pkg aur add</code>.
					{/snippet}
					{#snippet meta()}{@render countBadge(config.pacmanPackages.length + config.aurPackages.length, 'package')}{/snippet}
					<div class="grid gap-6 md:grid-cols-2">
						<div class="grid content-start gap-2">
							<Label for="pacman">Official repository <span class="text-muted-foreground font-normal">(pacman)</span></Label>
							<TagInput id="pacman" placeholder="ripgrep" bind:items={config.pacmanPackages} validator={validate.packageName} />
						</div>
						<div class="grid content-start gap-2">
							<Label for="aur">AUR</Label>
							<TagInput id="aur" placeholder="ai-usagebar-bin" bind:items={config.aurPackages} validator={validate.packageName} />
						</div>
					</div>
				</Section>

				<Section id="services" title="Services" icon={PlugIcon}>
					{#snippet description()}
						Installed with <code class="text-foreground font-mono text-xs">omarchy install service</code>.
					{/snippet}
					<CheckGroup name="svc" options={O.SERVICES} bind:selected={config.services} />
				</Section>

				<Section id="dev-envs" title="Development environments" icon={CodeIcon}>
					{#snippet description()}
						Installed with <code class="text-foreground font-mono text-xs">omarchy install dev-env</code>.
					{/snippet}
					<CheckGroup name="env" options={O.DEV_ENVS} bind:selected={config.devEnvs} columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
				</Section>

				<Section id="plugins" title="Plugins" icon={PuzzleIcon}>
					{#snippet description()}
						Git repositories, e.g. from
						<a
							class="text-foreground inline-flex items-center gap-1 font-medium underline underline-offset-4"
							href="https://plugins.omarchy.org/"
							target="_blank"
							rel="noreferrer">plugins.omarchy.org <ExternalLinkIcon class="size-3" /></a
						>.
					{/snippet}
					{#snippet meta()}{@render countBadge(config.plugins.length, 'plugin')}{/snippet}
					<TagInput id="plugin" placeholder="https://github.com/user/omarchy-plugin.git" bind:items={config.plugins} validator={validate.pluginUrl} />
				</Section>

				<Section id="webapps" title="Web app launchers" icon={GlobeIcon} description="Sites that open in their own window from the app launcher. Leave the icon on Auto to use the site's own.">
					{#snippet meta()}{@render countBadge(config.webapps.length, 'app')}{/snippet}
					<div class="grid gap-4">
						{#if config.webapps.length}
							<div class="text-muted-foreground hidden gap-2 px-px text-xs font-medium sm:grid sm:grid-cols-[1fr_1.5fr_1.25fr_2.25rem]">
								<span>Name</span><span>URL</span><span>Icon</span><span></span>
							</div>
						{/if}
						{#each config.webapps as w, i (i)}
							{@const e = {
								name: fieldError(w.name, validate.webappName),
								url: fieldError(w.url, validate.url),
								icon: fieldError(w.icon, validate.icon)
							}}
							<div class="grid gap-2 sm:grid-cols-[1fr_1.5fr_1.25fr_2.25rem] sm:items-start" transition:slide={{ duration: 200 }}>
								<div class="grid gap-1">
									<Input placeholder="Name" bind:value={w.name} aria-label="Web app {i + 1} name" aria-invalid={e.name ? true : undefined} />
									{#if e.name}<p class="text-destructive text-xs">{e.name}</p>{/if}
								</div>
								<div class="grid gap-1">
									<UrlInput id="webapp-{i}-url" placeholder="linear.app" bind:value={w.url} aria-label="Web app {i + 1} URL" aria-invalid={e.url ? true : undefined} />
									{#if e.url}<p class="text-destructive text-xs">{e.url}</p>{/if}
								</div>
								<div class="grid gap-1">
									<IconField id="webapp-{i}-icon" label="Web app {i + 1} icon" bind:value={w.icon} catalog={WEBAPP_ICONS} suggestion={suggestForUrl(w.url)} allowAuto invalid={!!e.icon} />
									{#if e.icon}<p class="text-destructive text-xs">{e.icon}</p>{/if}
								</div>
								<Button type="button" variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive" aria-label="Remove web app {i + 1}" onclick={() => (config.webapps = config.webapps.filter((_, j) => j !== i))}>
									<Trash2Icon class="size-4" />
								</Button>
							</div>
						{:else}
							<div class="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
								No web apps yet.
							</div>
						{/each}
						<div>
							<Button type="button" variant="outline" size="sm" onclick={() => (config.webapps = [...config.webapps, { name: '', url: '', icon: '' }])}>
								<PlusIcon class="size-4" /> Add web app
							</Button>
						</div>
					</div>
				</Section>

				<Section id="tuis" title="TUI launchers" icon={TerminalIcon} description="Terminal programs that get their own launcher entry.">
					{#snippet meta()}{@render countBadge(config.tuis.length, 'TUI')}{/snippet}
					<div class="grid gap-4">
						{#if config.tuis.length}
							<div class="text-muted-foreground hidden gap-2 px-px text-xs font-medium sm:grid sm:grid-cols-[1fr_1.25fr_6rem_1.25fr_2.25rem]">
								<span>Name</span><span>Command</span><span>Window</span><span>Icon</span><span></span>
							</div>
						{/if}
						{#each config.tuis as t, i (i)}
							{@const e = {
								name: fieldError(t.name, validate.webappName),
								command: fieldError(t.command, validate.tuiCommand),
								icon: fieldError(t.icon, validate.icon)
							}}
							<div class="grid gap-2 sm:grid-cols-[1fr_1.25fr_6rem_1.25fr_2.25rem] sm:items-start" transition:slide={{ duration: 200 }}>
								<div class="grid gap-1">
									<Input placeholder="Name" bind:value={t.name} aria-label="TUI {i + 1} name" aria-invalid={e.name ? true : undefined} />
									{#if e.name}<p class="text-destructive text-xs">{e.name}</p>{/if}
								</div>
								<div class="grid gap-1">
									<Input placeholder="Command" class="font-mono text-sm" bind:value={t.command} aria-label="TUI {i + 1} command" aria-invalid={e.command ? true : undefined} />
									{#if e.command}<p class="text-destructive text-xs">{e.command}</p>{/if}
								</div>
								<Select.Root type="single" bind:value={t.style}>
									<Select.Trigger class="w-full capitalize" aria-label="TUI {i + 1} window style">{t.style}</Select.Trigger>
									<Select.Content>
										<Select.Item value="tile" label="Tile">Tile</Select.Item>
										<Select.Item value="float" label="Float">Float</Select.Item>
									</Select.Content>
								</Select.Root>
								<div class="grid gap-1">
									<IconField id="tui-{i}-icon" label="TUI {i + 1} icon" bind:value={t.icon} catalog={TUI_ICONS} suggestion={suggestForCommand(t.command)} invalid={!!e.icon} />
									{#if e.icon}<p class="text-destructive text-xs">{e.icon}</p>{/if}
								</div>
								<Button type="button" variant="ghost" size="icon" class="text-muted-foreground hover:text-destructive" aria-label="Remove TUI {i + 1}" onclick={() => (config.tuis = config.tuis.filter((_, j) => j !== i))}>
									<Trash2Icon class="size-4" />
								</Button>
							</div>
						{:else}
							<div class="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
								No TUI launchers yet.
							</div>
						{/each}
						<div>
							<Button type="button" variant="outline" size="sm" onclick={() => (config.tuis = [...config.tuis, { name: '', command: '', style: 'tile', icon: '' }])}>
								<PlusIcon class="size-4" /> Add TUI
							</Button>
						</div>
					</div>
				</Section>

				<Section id="system" title="System" icon={SettingsIcon} description="Runs before anything else is installed.">
					<div class="divide-y">
						<ToggleRow id="mirrors" label="Refresh pacman mirrors" description="Picks the fastest mirrors with reflector." bind:checked={config.updatePacmanMirrors} />
						<ToggleRow id="update" bind:checked={config.initialSystemUpdate}>
							{#snippet label()}Run <code class="font-mono text-xs">omarchy update</code> first{/snippet}
							{#snippet description()}Brings the system up to date before provisioning.{/snippet}
						</ToggleRow>
					</div>
				</Section>
			</form>
		</div>

		<!-- ── Preview ──────────────────────────────────────────────────────────── -->
		<aside aria-label="omarchy.yml preview" class="grid gap-3 lg:sticky lg:top-24">
			<div class="bg-card flex flex-col overflow-hidden rounded-xl border shadow-xs lg:max-h-[calc(100vh-8rem)]">
				<div class="flex items-center gap-3 border-b px-4 py-3">
					<FileCodeIcon class="text-muted-foreground size-4 shrink-0" />
					<div class="grid min-w-0">
						<span class="font-mono text-sm font-medium">omarchy.yml</span>
						<span class="text-muted-foreground text-xs tabular-nums">{lineCount} lines</span>
					</div>
					<span class="ml-auto inline-flex h-6 items-center gap-2 rounded-full border px-2 text-xs font-medium" role="status">
						<span
							class={cn(
								'size-1.5 rounded-full transition-colors duration-200',
								errors.length ? 'bg-destructive' : warnings.length ? 'bg-warning' : 'bg-success'
							)}
							aria-hidden="true"
						></span>
						{errors.length
							? plural(errors.length, 'error')
							: warnings.length
								? plural(warnings.length, 'warning')
								: 'Ready'}
					</span>
				</div>

				{#if issues.length}
					<ul class="max-h-40 divide-y overflow-auto border-b" transition:slide={{ duration: 200 }}>
						{#each [...errors, ...warnings] as issue (issue.message)}
							<li class="flex items-start gap-2 px-4 py-2 text-xs leading-4" transition:slide={{ duration: 150 }}>
								{#if issue.level === 'error'}
									<CircleAlertIcon class="text-destructive size-4 shrink-0" aria-label="Error" />
								{:else}
									<TriangleAlertIcon class="text-warning size-4 shrink-0" aria-label="Warning" />
								{/if}
								<span class="pt-px">{issue.message}</span>
							</li>
						{/each}
					</ul>
				{/if}

				<YamlCode code={yaml} class="bg-code text-code-foreground max-h-[28rem] min-h-0 flex-1 overflow-auto py-4 lg:max-h-none" />

				<div class="flex items-center gap-2 border-t p-3">
					<Button type="button" class="flex-1" onclick={download} disabled={errors.length > 0}>
						<DownloadIcon class="size-4" /> Download
					</Button>
					<Button type="button" variant="outline" onclick={copyYaml} disabled={errors.length > 0} aria-live="polite">
						{#if copied}<CheckIcon class="size-4" /> Copied{:else}<CopyIcon class="size-4" /> Copy{/if}
					</Button>
					<Button
						type="button"
						variant={resetArmed ? 'destructive' : 'ghost'}
						size={resetArmed ? 'default' : 'icon'}
						onclick={reset}
						aria-label={resetArmed ? 'Confirm reset' : 'Reset all options'}
						title="Reset all options"
					>
						<RotateCcwIcon class="size-4" />
						{#if resetArmed}Confirm{/if}
					</Button>
				</div>
			</div>
			<p class="text-muted-foreground px-1 text-xs">
				Runs in your browser. Your choices are saved on this device and never uploaded.
			</p>
		</aside>
	</div>
</main>

<footer class="border-t">
	<div
		class="text-muted-foreground mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row sm:px-6"
	>
		<p>
			Made by
			<a
				href={SITE.author.url}
				target="_blank"
				rel="noreferrer"
				class="text-foreground focus-visible:ring-ring rounded-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2"
				>{SITE.author.name}</a
			>
		</p>
		<a
			href="https://svelte.dev/docs/kit"
			target="_blank"
			rel="noreferrer"
			class="hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-2 rounded-sm transition-colors duration-150 outline-none focus-visible:ring-2"
		>
			Made with
			<img src={svelteLogo} alt="" width="14" height="16" class="h-4 w-auto" />
			<span class="text-foreground font-medium">SvelteKit</span>
		</a>
	</div>
</footer>
