# Coolify operations — RadiantPlay

What is deployed on ThoughtSpot's self-hosted Coolify, how it gets there, and
the things that bite. For the step-by-step setup of a new app see
`2026-09-03-deploy-guide-for-designers.md`. Vercel stays alongside Coolify for
now: Vercel deploys from `origin` (GitHub), Coolify from `galaxy`.

## Instance

| | |
|---|---|
| Coolify | `https://ts.coolify.thoughtspot.com` (v4.1.x; also `http://10.79.75.177:8000` on the corporate network) |
| Team | Design Team |
| Project | `radiantplay-faris` (uuid `gt788yuck7au4kevlo0iykbn`), environment `production` (`fy593jra6tgvv7gxbbukjp9f`) |
| Server | `coolify-server-02` (`p55vx2x8ooycypm3p03js76c`, 10.79.138.56) |
| Deploy key | `GHE-radiantplay-faris` (id 58, uuid `i5qx976k4ody80y31jayht13`) — one key covers every branch of `mohammed-faris/radiantplay` |
| Access | Corporate network / Twingate only. No password gate, no live AI (`/api/chat` is Vercel-only). |

## Apps

| App | UUID | Branch | URL |
|---|---|---|---|
| `radiantplay` | `lur4ohh5seaozpanxt4dcssl` | `main` | https://radiantplay.design.coolify.thoughtspot.com |
| `radiantplay-staging` | `cwhp98o7jkyj0t534qr1livj` | `staging` | https://radiantplay-staging.design.coolify.thoughtspot.com |
| `radiantplay-faris` | `dyrd36i1vjlpcxf6uab5ktn9` | `faris` | https://radiantplay-faris.design.coolify.thoughtspot.com |

All three pull `git@galaxy.corp.thoughtspot.com:mohammed-faris/radiantplay.git`
at `HEAD` of their branch. Other designers' apps (`radiantplay-<name>`) follow
the same recipe against their own galaxy fork with their own deploy key.

## The recipe (identical on every app)

| Setting | Value | Why |
|---|---|---|
| Build strategy (was Build pack) | Nixpacks | `Static` copies the unbuilt repo into nginx and serves a blank page |
| Site type (was Is it a static site?) | Static | Serves `dist/` via `nginx:alpine` |
| Install / build | `npm ci` / `npm run build` | Public registry only, no auth needed |
| Publish directory | `/dist` | Leading slash required; the API 422s on `dist` |
| Ports exposes (was Port), under Networking | 80 | |
| Env `NIXPACKS_NODE_VERSION` | `22` (build time) | Nixpacks defaults to Node 18; Vite 7 needs 20.19+ or 22.12+ |
| Custom nginx configuration | contents of `docker/nginx.conf` | SPA fallback, so deep links and refreshes don't 404, and `no-cache` on every `.html`, so browsers don't keep an old shell |

`Dockerfile` + `docker/nginx.conf` bake the same recipe into an image for the
no-git path in the designer guide.

## How a deploy happens

1. Push to `galaxy`. `main` and `staging` go there as part of the normal
   dual push; `faris` via `bash internal/scripts/push-faris.sh`.
2. A repo webhook on galaxy (Settings → Hooks, push events only) posts to
   `http://10.79.75.177:8000/webhooks/source/github/events/manual`. Coolify
   matches `owner/repo` + branch and deploys the right app. One webhook per
   fork covers every app built from that fork, **provided every app carries
   the same GitHub webhook secret** (see below).
3. Build takes 3 to 4 minutes. Check under the app's **Deployments** tab, or
   with the `coolify-write` MCP (`deployment list_for_app`).
4. Verify: root, a deep link such as `/playground`, and a refresh all return
   200, and the HTML references `/assets/index-*.js` (a built bundle, not
   `src/main.tsx`).

Manual redeploy: **Deploy** button in the UI, or `deploy` via the MCP.

### Why the webhook uses the plain-http IP

Coolify's TLS certificate comes from an internal CA the GHE appliance does not
trust, and `ts.coolify.thoughtspot.com` resolves to an overlay address galaxy
cannot route. GHE shows that as a bare 500 in 0.01 s. Both hosts are on the
corporate network and the payload is HMAC-signed. A green ping does not prove
the secret matches (pings are not verified); only a real push does, and a 401
on push means the secret is wrong.

### Every app on a fork must share one webhook secret

Coolify checks the webhook signature **per application**, against that app's
own *GitHub manual webhook secret* (Configuration → Webhooks). Apps whose secret
differs from the one the galaxy hook signs with are skipped silently: galaxy
still records a 200, no deployment appears, and the app keeps serving its old
build. New apps get a random secret, so after creating one:

1. Open an app that already auto-deploys (for this fork, `radiantplay-faris`),
   Configuration → Webhooks, copy the GitHub manual webhook secret.
2. Open the new app, same place, paste it in and save.

`radiantplay`, `radiantplay-staging` and `radiantplay-faris` share one secret
as of 2026-09-03. The `radiantplay` (main) app missed its first two pushes this
way before the secret was aligned.

## Known quirks

- **Silent webhook skip.** A 200 from Coolify on the galaxy hook does not mean
  a deploy was queued — it only means the request was received. Per-app secret
  mismatch (above) and disabled auto deploy both return 200 and do nothing.
  Confirm with the app's Deployments tab: a webhook deploy shows
  `is_webhook: true`.
- **`is_static` and `custom_nginx_configuration` cannot be set through the
  `coolify-write` MCP** (`application update` answers "Invalid request"), and
  the REST API accepts them only on create. Set them in the UI: General →
  Build pipeline → Site type → Custom Nginx configuration. The nginx box is a
  Monaco editor: set it with `monaco.editor.getEditors()` and `setValue()` in
  Chrome, never by typing (see A6 in the designer guide).
- **Stale shell after deploy.** Without the `location ~* \.html$` no-cache rule,
  nginx serves `index.html` with no `Cache-Control`, so browsers keep the old
  shell and load the old bundle. The rule is in `docker/nginx.conf`; it was
  pasted into `radiantplay-faris` on 2026-09-08 and into
  `radiantplay-staging` on 2026-10-09; `radiantplay` (main) still needs it.
- **Coolify v4.4.3 (seen 2026-10-09)** renamed fields: Build pack → Build
  strategy, Is it a static site? → Site type, Port → Ports exposes, and auto
  deploy is a dropdown, Advanced → Deployment → Auto deploy → "Deploy on push
  (webhooks)". The General page shows "You have changes that haven't been saved
  yet" on load with nothing edited; ignore it.
- **Two Coolify MCPs.** The read-only `coolify` MCP points at a different
  instance (an old `radiantplay-test` app). Use `coolify-write` for this one.
- **Health checks are off** on all three apps, so status shows
  `running:unknown`. Turning them on is a pending improvement.
- **Not reproduced from `vercel.json`:** the `/talk` → `/talk.html` rewrite and
  the security headers (X-Content-Type-Options, X-Frame-Options,
  Referrer-Policy, Permissions-Policy). Only the SPA rewrite is in the nginx
  config.

## Files in this repo

| File | Role |
|---|---|
| `.claude/commands/coolify-deploy.md` | `/coolify-deploy` guided setup and `check` mode; reads these two docs at run time |
| `docker/nginx.conf` | Canonical nginx config (SPA fallback + no-cache HTML); paste into every app |
| `Dockerfile` | Multi-stage image (Node 22 build → nginx) for the no-git path |
| `internal/scripts/push-faris.sh` | Push any branch to origin + galaxy in one step |
| `scripts/hooks/pre-push` | Refuses force-push / deletion of `faris`; reminds on unversioned `main` pushes |
| `vercel.json` | What the Vercel side does; the reference for what Coolify still lacks |
| `docs/archive/2026-07-23-coolify-deploy-setup.md` | Original design record and decision log |

## History

- 2026-07-21: first `main` deploy on a test instance from GitHub, nixpacks auto-detect.
- 2026-07-23: recipe verified on `ts.coolify.thoughtspot.com` after five failed deploys; `radiantplay-staging` live; per-designer model locked.
- 2026-08-04: `radiantplay-faris` created (branch `faris` from galaxy).
- 2026-09-02: `personal` collapsed into `faris`; galaxy webhook added, deploys become automatic.
- 2026-09-03: `radiantplay` (`main`) created; docs consolidated into `docs/coolify/`; main's webhook secret aligned with the other two apps after its first pushes were skipped.
