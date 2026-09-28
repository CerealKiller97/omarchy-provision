# Applying a config

[`static/apply.sh`](../static/apply.sh) is served next to the site and applies an exported
`omarchy.yml` through Omarchy's own `omarchy` CLI. It must run on a real Omarchy install.

## Usage

```bash
bash <(curl -fsSL https://omarchy-provision.stefanbogdanovic.dev/apply.sh)
```

The config is resolved in this order:

1. The path passed as the first argument: `bash <(curl …) ~/dotfiles/omarchy.yml`
2. The `OMARCHY_CONFIG` environment variable
3. `./omarchy.yml` in the current directory
4. `~/Downloads/omarchy.yml`, where the site's **Download** button puts it

`--help` prints the usage.

Run it with `bash <(curl …)` rather than `curl … | bash`. Several installers the script calls prompt
for input, and with a pipe they would read the rest of the script as their answers.

## What it runs, in order

| Step | Keys | Command |
| --- | --- | --- |
| System | `update_pacman_mirrors`, `initial_system_update` | `reflector` (installed if missing; the old mirrorlist is kept as `mirrorlist.bak`), then `omarchy update -y` |
| Theme | `theme.name`, `theme.url`, `theme.background_image` | Built-in: `omarchy theme set <name>`. Otherwise `omarchy-theme-install <url>` (skipped if `~/.config/omarchy/themes/<name>` exists), then `omarchy theme bg set` |
| Plugins | `plugins` | `omarchy plugin add <url> --enable --yes` |
| Preinstalls | `preinstalls` | `all`: `omarchy remove preinstalls` |
| Removals | `remove_apps`, `remove_web_apps`, `remove_tuis` | `omarchy pkg drop`, `omarchy webapp remove`, `omarchy tui remove` |
| Packages | `pacman_packages`, `aur_packages` | `omarchy pkg add`, `omarchy pkg aur add` |
| Services | `install_services` | `omarchy install service <name>` (Bitwarden and the Chromium Google account have their own commands) |
| Install menus | `install_browsers`, `install_terminals`, `install_editors`, `install_ai`, `install_gaming` | The `omarchy` arguments stored after the `\|` in each entry |
| Dev environments | `install_dev_envs` | `omarchy install dev-env <env>` |
| Launchers | `webapps`, `tuis` | `omarchy webapp install`, `omarchy tui install` |
| Defaults | `defaults.*` | Installs the default browser and terminal if needed, then `omarchy default <key> <value>` |

Defaults run last on purpose: every `omarchy install terminal` makes that terminal the default, so
installing the chosen default terminal again at the end guarantees it wins.

## Failure handling

Each item is best-effort. A failed package, theme or launcher is logged in red and the script moves
on, so one broken entry doesn't leave the rest of your setup undone. Scroll back through the output
for `[ERROR]` lines when it finishes.

The script only aborts before doing anything: when no config is found, or when the `omarchy` CLI
isn't on the `PATH`.

## Parsing

The script parses the file with `grep`, `awk` and `sed` rather than a YAML library, so it has no
dependencies beyond what Omarchy ships. That's why the [format](config-format.md) is deliberately
flat: top-level keys, one level of lists, and `|`-separated fields instead of nested maps. Hand
edits should keep that shape.
