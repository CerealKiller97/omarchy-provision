# Omarchy sync

The options on the site aren't maintained by hand. Two scheduled workflows pull them from upstream,
commit any change, and redeploy.

## Status

| | |
| --- | --- |
| Omarchy release the site describes | [![Synced Omarchy release](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FCerealKiller97%2Fomarchy-provision%2Fmain%2Fsrc%2Flib%2Fomarchy.json&query=%24.version&prefix=v&label=synced%20with%20omarchy&color=2e7d32)](../src/lib/omarchy.json) |
| Latest Omarchy release upstream | [![Latest Omarchy release](https://img.shields.io/github/v/release/basecamp/omarchy?label=latest%20omarchy)](https://github.com/basecamp/omarchy/releases/latest) |
| Omarchy data last changed | [![Omarchy data last updated](https://img.shields.io/github/last-commit/CerealKiller97/omarchy-provision/main?path=src%2Flib%2Fomarchy.json&label=omarchy%20data%20updated)](https://github.com/CerealKiller97/omarchy-provision/commits/main/src/lib/omarchy.json) |
| Community themes last changed | [![Community themes last updated](https://img.shields.io/github/last-commit/CerealKiller97/omarchy-provision/main?path=src%2Flib%2Fcommunity-themes.json&label=community%20themes%20updated)](https://github.com/CerealKiller97/omarchy-provision/commits/main/src/lib/community-themes.json) |
| Omarchy sync workflow | [![Sync Omarchy workflow](https://img.shields.io/github/actions/workflow/status/CerealKiller97/omarchy-provision/sync-omarchy.yml?branch=main&label=omarchy%20sync)](https://github.com/CerealKiller97/omarchy-provision/actions/workflows/sync-omarchy.yml) |
| Community themes workflow | [![Sync community themes workflow](https://img.shields.io/github/actions/workflow/status/CerealKiller97/omarchy-provision/sync-community-themes.yml?branch=main&label=themes%20sync)](https://github.com/CerealKiller97/omarchy-provision/actions/workflows/sync-community-themes.yml) |

How to read them:

- When **synced with omarchy** and **latest omarchy** match, the site describes the current release.
  A gap of more than six hours means the sync is failing; the workflow badge will be red.
- **Data updated** is the last *change*, not the last check. The sync output is deterministic (sorted,
  no timestamps), so a run that finds nothing new commits nothing. A quiet date with a green workflow
  badge just means upstream hasn't changed.

## Omarchy release

[`.github/workflows/sync-omarchy.yml`](../.github/workflows/sync-omarchy.yml) runs every 6 hours and
on demand. [`scripts/sync-omarchy.mjs`](../scripts/sync-omarchy.mjs) reads the latest
`basecamp/omarchy` release tag and, pinned to that commit, fetches:

- `install/omarchy-{base,other}.packages`
- every `themes/*/colors.toml` and `themes/*/preview.png`
- the Install › Browser / Editor / Terminal / AI / Gaming entries in
  `default/omarchy/omarchy-menu.jsonc`, each translated to the `omarchy` command that installs it.
  Each entry's own script contributes its `omarchy:summary` as the description on the site. Entries
  whose action can't be translated (like Ollama's GPU check) are skipped with a warning.
- the values `omarchy default browser` accepts

Because everything comes from one tag, the version, packages and built-in themes always describe the
same release. A branch's `version` file is a dev marker and is ignored.

It also reads `guest/spec.json` from [`omacom/try-omarchy`](https://github.com/omacom/try-omarchy).
Its macOS VM image ships only the built-in themes listed there, so picking **Try Omarchy (macOS)** on
the Built-in tab limits the list to those.

If anything changed, the workflow commits `src/lib/omarchy.json` and `static/themes/builtin/` with a
summary of the change, then deploys. Run it manually with **force_deploy** to redeploy without an
upstream change.

## Community themes

[`.github/workflows/sync-community-themes.yml`](../.github/workflows/sync-community-themes.yml) runs
twice a day and on demand. It reads `src/data/themes.json` in `omacom/omarchy-site` (the list
[omarchy.org/themes](https://omarchy.org/themes) renders) and the preview images next to it. If
anything changed, it commits `src/lib/community-themes.json` and `static/themes/community/`, then
deploys.

Both workflows commit through [`.github/actions/commit-data`](../.github/actions/commit-data/action.yml),
which retries with a rebase if the other one pushed first.

## Running it locally

```bash
pnpm sync:omarchy
pnpm sync:themes
```

Environment variables for `sync:omarchy`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `OMARCHY_REF` | latest release tag | Preview a branch, e.g. `OMARCHY_REF=dev pnpm sync:omarchy` |
| `OMARCHY_REPO` | `basecamp/omarchy` | Sync from a fork |
| `TRY_OMARCHY_REPO` | `omacom/try-omarchy` | Where to read the Try Omarchy theme list |
| `GITHUB_TOKEN` | none | Raises the GitHub API rate limit |

Don't commit data synced from a branch; the scheduled run will overwrite it with the release anyway.
