# Contributing

Thanks for helping out. Bug reports, new options and fixes for things Omarchy changed upstream are
all welcome.

## Setup

Requires Node 24 and pnpm.

```bash
pnpm install
pnpm dev
```

Before sending a pull request:

```bash
pnpm check
pnpm build
```

## Where changes go

- **A new choice in the form** (a service, dev env, agent…): [`src/lib/options.ts`](../src/lib/options.ts).
  Values must match what the `omarchy` CLI accepts.
- **A new validation rule or YAML key**: [`src/lib/config.ts`](../src/lib/config.ts), plus the matching
  step in [`static/apply.sh`](../static/apply.sh) and the [config format](config-format.md) doc.
- **Anything Omarchy itself defines** (packages, built-in themes, install menus, community themes):
  the sync scripts in [`scripts/`](../scripts). Never hand-edit `src/lib/omarchy.json`,
  `src/lib/community-themes.json` or `static/themes/`; the next scheduled sync overwrites them.
  See [Omarchy sync](omarchy-sync.md).
- **UI changes**: run `pnpm brand:readme` afterwards if the change shows in the README banner.

## Conventions

- Keep the export flat (top-level keys, one level of lists). `apply.sh` parses it with `grep`/`awk`,
  not a YAML library. See [Applying a config](applying.md#parsing).
- Every step in `apply.sh` is best-effort: log the failure and carry on.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`,
  `chore:`, `ci:`, `docs:`).

## Reporting a security issue

Please don't open a public issue. Use the contact in the site's
[`/.well-known/security.txt`](https://omarchy-provision.stefanbogdanovic.dev/.well-known/security.txt).
