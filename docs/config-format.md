# Config format

The site exports a single `omarchy.yml`. Every key is always present (lists may be empty), and each
one has a comment naming the `omarchy` command that applies it. See
[Applying a config](applying.md) for how it's run.

## Keys

| Key | Type | Values |
| --- | --- | --- |
| `theme.name` | string | A built-in theme, or the name `omarchy-theme-install` gives the repo (basename without `.git`, a leading `omarchy-` or a trailing `-theme`, lowercased) |
| `theme.url` | string | Empty for built-in themes, otherwise an https GitHub / GitLab / Codeberg repo |
| `theme.background_image` | string | Optional filename inside the theme's `backgrounds/` folder |
| `defaults.browser` | string | A value `omarchy default browser` accepts |
| `defaults.agent` | string | A value `omarchy default agent` accepts |
| `defaults.terminal` | string | A terminal from Omarchy's Install › Terminal menu |
| `defaults.editor` | string | A value `omarchy default editor` accepts |
| `plugins` | list | https Git repo URLs |
| `preinstalls` | `keep` \| `all` \| `some` | `some` uses the three `remove_*` lists below |
| `remove_apps` | list | Preinstalled packages |
| `remove_web_apps` | list | Preinstalled web apps |
| `remove_tuis` | list | Preinstalled TUIs |
| `pacman_packages` | list | Arch package names |
| `aur_packages` | list | AUR package names |
| `install_services` | list | Values `omarchy install service` accepts, plus `bitwarden` and `chromium-account` |
| `install_browsers`, `install_terminals`, `install_editors`, `install_ai`, `install_gaming` | list | `id\|args`, where `args` is the `omarchy` command line the Install menu entry runs, e.g. `zed\|install editor zed` |
| `install_dev_envs` | list | Values `omarchy install dev-env` accepts |
| `webapps` | list | `name\|url\|icon`. An empty icon makes `omarchy webapp install` fetch the site's own |
| `tuis` | list | `name\|command\|float-or-tile\|icon` |
| `update_pacman_mirrors` | bool | Rank mirrors with `reflector` before anything else |
| `initial_system_update` | bool | Run `omarchy update -y` first |

The option values come from [`src/lib/options.ts`](../src/lib/options.ts) and the synced
[`src/lib/omarchy.json`](../src/lib/omarchy.json), so they always match the Omarchy release shown
on the site.

## Validation

All rules live in [`src/lib/config.ts`](../src/lib/config.ts).

### Fields

| Field | Rule |
| --- | --- |
| Packages | Arch package names: lowercase letters, digits and `@ . _ + -` |
| Theme and plugin repos | https GitHub / GitLab / Codeberg repo URLs |
| Web app URLs | http(s) URLs |
| Icons | An http(s) URL or an installed icon name |
| Web app and TUI names | No `/ \| # ' "` |
| TUI commands | No `\| # ' "` |
| Background images | An image or video filename (png, jpg, webp, mp4…) |

### Conflicts (block the export)

- A default browser or terminal the current Omarchy release doesn't offer
- A built-in theme that [Try Omarchy](https://github.com/omacom/try-omarchy) doesn't ship, when targeting it
- A package listed in both pacman and AUR
- A package that is installed and removed at the same time
- Duplicate web app or TUI names

### Warnings (don't block)

- A package that already ships with Omarchy
- Removing all preinstalls with Claude Code as the default agent (it also drops the agent stubs)
- The Node dev environment alongside your own NVM/Node install
- Sublime Text as the default editor (make sure it's installed)
