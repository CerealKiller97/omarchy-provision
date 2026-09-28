<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/readme-banner-dark.png">
  <img alt="Omarchy Provision: Omarchy is fast. Your setup is even faster. Pick your theme, apps and tools once, export a validated omarchy.yml and let it provision the rest." src="docs/readme-banner-light.png">
</picture>

<h1 align="center">Omarchy Provision</h1>

<p align="center">
  <strong>Omarchy is fast. Your setup is even faster.</strong><br>
  Build your <code>omarchy.yml</code> in the browser, keep it in your dotfiles, and provision any fresh
  <a href="https://omarchy.org">Omarchy</a> install with one command.
</p>

<p align="center">
  <a href="https://omarchy-provision.stefanbogdanovic.dev"><strong>omarchy-provision.stefanbogdanovic.dev</strong></a>
</p>

<p align="center">
  <a href="src/lib/omarchy.json"><img alt="Synced Omarchy release" src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FCerealKiller97%2Fomarchy-provision%2Fmain%2Fsrc%2Flib%2Fomarchy.json&query=%24.version&prefix=v&label=synced%20with%20omarchy&color=2e7d32"></a>
  <a href="https://github.com/basecamp/omarchy/releases/latest"><img alt="Latest Omarchy release" src="https://img.shields.io/github/v/release/basecamp/omarchy?label=latest%20omarchy"></a>
  <a href="https://github.com/CerealKiller97/omarchy-provision/commits/main/src/lib/omarchy.json"><img alt="Omarchy data last updated" src="https://img.shields.io/github/last-commit/CerealKiller97/omarchy-provision/main?path=src%2Flib%2Fomarchy.json&label=omarchy%20data%20updated"></a>
  <a href="https://github.com/CerealKiller97/omarchy-provision/commits/main/src/lib/community-themes.json"><img alt="Community themes last updated" src="https://img.shields.io/github/last-commit/CerealKiller97/omarchy-provision/main?path=src%2Flib%2Fcommunity-themes.json&label=community%20themes%20updated"></a>
  <br>
  <a href="https://github.com/CerealKiller97/omarchy-provision/actions/workflows/sync-omarchy.yml"><img alt="Sync Omarchy workflow" src="https://img.shields.io/github/actions/workflow/status/CerealKiller97/omarchy-provision/sync-omarchy.yml?branch=main&label=omarchy%20sync"></a>
  <a href="https://github.com/CerealKiller97/omarchy-provision/actions/workflows/sync-community-themes.yml"><img alt="Sync community themes workflow" src="https://img.shields.io/github/actions/workflow/status/CerealKiller97/omarchy-provision/sync-community-themes.yml?branch=main&label=themes%20sync"></a>
  <a href="https://github.com/CerealKiller97/omarchy-provision/actions/workflows/deploy.yml"><img alt="Deploy workflow" src="https://img.shields.io/github/actions/workflow/status/CerealKiller97/omarchy-provision/deploy.yml?branch=main&label=deploy"></a>
  <a href="https://omarchy-provision.stefanbogdanovic.dev"><img alt="Website status" src="https://img.shields.io/website?url=https%3A%2F%2Fomarchy-provision.stefanbogdanovic.dev&label=site"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-blue"></a>
</p>

---

Omarchy already installs in minutes. What still takes time is everything after: the theme you
always pick, the browser and editor you always switch to, the preinstalls you always remove, the
packages, web apps and launchers you always add. **Omarchy Provision** turns those choices into a
single `omarchy.yml` that you pick once, check into your dotfiles, and replay on every new machine.

## Features

- **Only valid output.** Every option is a predefined select, checkbox or validated input, so the
  exported file only contains values the [`omarchy` CLI](https://omarchy.org/manual/omarchy-cli/)
  accepts. Conflicts (installing and removing the same package, a default browser you're also
  removing, duplicate launcher names) block the export.
- **Always current.** Scheduled GitHub Actions pull package lists, built-in themes, install menus and
  community themes straight from the latest Omarchy release and
  [omarchy.org/themes](https://omarchy.org/themes), then redeploy. The badges above show which release
  the site describes and when its data last changed.
- **Everything Omarchy lets you choose.** Theme (built-in, community or any Git repo) and background,
  default browser / terminal / editor / agent, preinstall removal, pacman and AUR packages, services,
  browsers, terminals, editors, AI and gaming apps, dev environments, plugins, web app and TUI
  launchers, mirror ranking and a first system update.
- **One command to apply.** `apply.sh` reads the file and runs each section through the `omarchy` CLI.
  Every step is best-effort, so one failure doesn't stop the rest.
- **Runs in your browser.** A static site with no backend. Your config lives in `localStorage`; the
  file itself is never uploaded. See [Privacy](#privacy).
- **Try Omarchy aware.** Targeting the [Try Omarchy](https://github.com/omacom/try-omarchy) macOS VM
  limits the theme list to the themes its image ships.

## Quick start

1. Open **[omarchy-provision.stefanbogdanovic.dev](https://omarchy-provision.stefanbogdanovic.dev)**,
   pick your options and click **Download**. The file lands in `~/Downloads/omarchy.yml`.
2. On your Omarchy machine, run:

   ```bash
   bash <(curl -fsSL https://omarchy-provision.stefanbogdanovic.dev/apply.sh)
   ```

The script looks for `omarchy.yml` in the current folder, then `~/Downloads`. To apply a copy you
keep in your dotfiles instead, pass its path:

```bash
bash <(curl -fsSL https://omarchy-provision.stefanbogdanovic.dev/apply.sh) ~/dotfiles/omarchy.yml
```

> [!TIP]
> Use `bash <(curl …)`, not `curl … | bash`. Some installers prompt for input, and with a pipe they
> would read the rest of the script as their answers.

> [!NOTE]
> `apply.sh` changes your system (installs and removes packages, sets defaults, enables services).
> It's [a plain Bash script](static/apply.sh), so read it first if you like. More in
> [Applying a config](docs/applying.md).

## Example

An excerpt of an exported file (empty lists and the per-key comments trimmed):

```yaml
theme:
  name: tokyo-night

defaults:
  browser: brave
  agent: claude
  terminal: ghostty
  editor: nvim

preinstalls: some

remove_apps:
  - obsidian
  - kdenlive

pacman_packages:
  - nmap

install_services:
  - tailscale
  - 1password

install_editors:
  - zed|install editor zed

install_dev_envs:
  - node
  - go

webapps:
  - Linear|https://linear.app|

initial_system_update: true
```

The real export lists every key and has a comment above each one naming the `omarchy` command that
applies it. The full schema is in [Config format](docs/config-format.md).

## Develop

Requires Node 24 and pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # svelte-check
pnpm build        # static site in ./build (adapter-static)
```

Refresh the synced data locally with `pnpm sync:omarchy` and `pnpm sync:themes`. Built with
[SvelteKit](https://svelte.dev/docs/kit), [shadcn-svelte](https://shadcn-svelte.com) and Tailwind CSS.

## Documentation

| Guide | What's in it |
| --- | --- |
| [Applying a config](docs/applying.md) | What `apply.sh` does, in what order, and how it finds your file |
| [Config format](docs/config-format.md) | Every `omarchy.yml` key, and the validation rules the site enforces |
| [Architecture](docs/architecture.md) | Where things live in the codebase |
| [Omarchy sync](docs/omarchy-sync.md) | How the site stays in step with Omarchy releases and community themes |
| [Deployment](docs/deployment.md) | The deploy workflow and self-hosting your own copy |
| [Brand assets](docs/brand-assets.md) | Favicon, social card and README banner generation |
| [Contributing](docs/CONTRIBUTING.md) | Local setup, conventions and how to send a change |

## Privacy

Everything you build stays in your browser. The production site loads a self-hosted
[Umami](https://umami.is) script (no cookies) that records one event when you export a config.
It sends only the predefined choices you picked, such as the theme, default apps and selected
services, which are public option ids. Anything you typed yourself (package names, URLs,
commands, custom theme repos) is only counted, never sent. Dev builds and builds without a site URL
don't load analytics at all, and content blockers turn it off. See
[`src/lib/analytics.ts`](src/lib/analytics.ts).

## Contributing

Issues and pull requests are welcome. Start with [CONTRIBUTING](docs/CONTRIBUTING.md). New options
usually need a change in [`src/lib/options.ts`](src/lib/options.ts); anything that comes from
Omarchy itself belongs in the sync scripts, not in hand-edited data.

## Acknowledgements

- [Omarchy](https://omarchy.org) by [Basecamp](https://github.com/basecamp/omarchy), which this tool
  exists to configure.
- The community theme authors listed on [omarchy.org/themes](https://omarchy.org/themes).
- [Simple Icons](https://simpleicons.org) and [dashboard-icons](https://github.com/homarr-labs/dashboard-icons)
  for app logos.

Omarchy Provision is an independent project. It is not affiliated with or endorsed by Basecamp or
the Omarchy project.

## License

[MIT](LICENSE) © Stefan Bogdanović
