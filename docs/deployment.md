# Deployment

## How it deploys

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on every push to `main`, on
demand, and when a [sync workflow](omarchy-sync.md) calls it after committing new data (commits
pushed with `GITHUB_TOKEN` don't fire `push`, so they call it directly).

It runs `pnpm check` and `pnpm build`, uploads the build with `scp` and publishes it into
`/var/www/omarchy-provision` over SSH. New files are copied in before stale ones are removed, so the
site never goes empty mid-deploy.

## Self-hosting

The build is plain static files in `./build`, so any static host works:

```bash
VITE_SITE_URL=https://provision.example.com pnpm build
```

Set `BASE_PATH=/some/path` as well if the site isn't served from the domain root. Without
`VITE_SITE_URL`, the sitemap stays empty, Open Graph URLs are relative and analytics stay off. The
apply command on the page always points at the `apply.sh` served next to it, so it uses your domain.

## Using the included workflow

1. Create a deploy key and authorize it for the user that owns `/var/www/omarchy-provision`:

   ```bash
   ssh-keygen -t ed25519 -N '' -C omarchy-provision-deploy -f omarchy-provision-deploy
   ```

   ```bash
   ssh-copy-id -i omarchy-provision-deploy.pub deploy@your-server
   ```

2. Add repository secrets (**Settings → Secrets and variables → Actions**):

   | Secret | Value |
   | --- | --- |
   | `SSH_HOST` | Server hostname or IP |
   | `SSH_USER` | User that owns `/var/www/omarchy-provision` |
   | `SSH_PRIVATE_KEY` | Contents of `omarchy-provision-deploy` |
   | `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan -p 22 your-server` (pins the host key) |
   | `SSH_PORT` | Optional, defaults to 22 |

3. Add repository variables:

   | Variable | Value |
   | --- | --- |
   | `SITE_URL` | Public URL, passed to the build as `VITE_SITE_URL` for canonical / Open Graph tags, the sitemap and the apply command |
   | `BASE_PATH` | Optional sub-path the site is served under |

If you fork the repo, also update `src/lib/site.ts` (author, repo link, analytics and security
contact) so your deployment doesn't report to someone else's analytics.
