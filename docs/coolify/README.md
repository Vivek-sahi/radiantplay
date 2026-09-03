# Coolify

Last updated: 2026-09-03

RadiantPlay deploys to ThoughtSpot's self-hosted Coolify from the `galaxy`
remote, alongside Vercel (which deploys from `origin`).

| Branch | URL |
|---|---|
| `main` | https://radiantplay.design.coolify.thoughtspot.com |
| `staging` | https://radiantplay-staging.design.coolify.thoughtspot.com |
| `faris` | https://radiantplay-faris.design.coolify.thoughtspot.com |

- **Setting up a new app** (your fork, your deploy key): `2026-09-03-deploy-guide-for-designers.md`
- **What runs where, webhook, quirks:** `2026-09-03-coolify-operations.md`
- **Original design record:** `../archive/2026-07-23-coolify-deploy-setup.md`

Config that lives in code: `docker/nginx.conf` (SPA fallback, paste into every
app) and `Dockerfile` (image for the no-git path).
