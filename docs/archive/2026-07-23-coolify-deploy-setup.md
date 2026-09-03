# Coolify deploy setup for RadiantPlay

## Goal

Give every designer a working prototype URL on Coolify, set up by the designer
themselves, pulling from their own galaxy fork. Maintainer URLs (main, staging)
keep working as they do today.

## Decisions locked in (2026-07-23)

| Question | Decision |
|---|---|
| Live AI on Coolify | **Off for now.** Most prototypes don't need it. The `/api/chat` proxy is a later problem. |
| Env vars | **None needed now.** Because AI is off, no `ANTHROPIC_API_KEY`. Apps start empty and stay empty. |
| Password gate | **None.** `middleware.ts` (the `SITE_PASSWORD` gate) is Vercel-style and doesn't run on Coolify. Being on Twingate VPN is the access boundary. |
| Source of truth | **Galaxy fork** via SSH deploy key. This is the designer path. GitHub is the maintainer's exception (the current live `main` app pulls from `faris-ts/radiantplay` on GitHub). |
| Who sets it up | **Self-serve.** Each designer follows IT's "Connecting Galaxy to Coolify" guide, using the RadiantPlay-specific settings below. |
| Deploy model | **Always-on app per designer now.** One persistent Coolify app tracking each designer's `main` branch. |
| PR preview links | **Deferred.** Automatic per-PR links need Coolify's GHE app/webhook integration, which the deploy-key path doesn't set up. Revisit once IT enables it. |
| Vercel relationship | **Undecided.** Vercel stays for main/staging and live-AI prototypes for now. Decide later. |
| URL scheme | `radiantplay-<designer>.design.coolify.thoughtspot.com` (e.g. `radiantplay-alice.design.coolify.thoughtspot.com`). |

## RadiantPlay-specific settings (use alongside IT's guide)

IT's guide gets a designer as far as "create an application from a private
galaxy repo." Its defaults (Build Pack: auto-detected, Port: 3000) are **wrong
for RadiantPlay**, which is a static Vite single-page app. Override them:

| Guide field | RadiantPlay value | Why |
|---|---|---|
| Repository URL | `git@galaxy.corp.thoughtspot.com:<designer>/radiantplay.git` | The designer's own galaxy fork. |
| Branch | `main` | Each designer's working branch on their fork. |
| **Build Pack** | **Static** (not the auto-detected nixpacks) | RadiantPlay builds to static files. Static build serves them via nginx. |
| Install Command | `npm ci` | Clean install. See build note below — no private-registry auth needed. |
| Build Command | `npm run build` | Runs `vite build`. |
| **Publish Directory** | `dist` | Vite's output folder. |
| **Is it a SPA? / SPA fallback** | **On** | **Critical.** See below. |
| Port | leave to the Static build pack default (nginx) | Don't set 3000; that's for a running server, which this isn't. |
| Environment Variables | none | AI is off, so nothing to set. |
| Domain (FQDN) | `radiantplay-<designer>.design.coolify.thoughtspot.com` | The agreed scheme. |

### The one setting designers must get right: SPA fallback

RadiantPlay uses `BrowserRouter` (real paths like `/playground/<Name>`,
`/radiant/...`, confirmed in `src/main.tsx`). On a plain static host, every one
of those paths is a file that doesn't exist on disk, so opening a link directly
or refreshing the page returns a 404. Turning on the **SPA / "redirect all to
index.html"** option makes the static host serve `index.html` for every path
and lets React Router take over. Without it, only the home page works.

### Build note: installs cleanly, no auth

`.npmrc` pins the public npm registry and `package-lock.json` has zero
private-registry references, so `npm ci` on Coolify's builder works with no
packagecloud/jfrog credentials. (Only `@viz/muze` would need private auth, and
it isn't in the default dependencies.) Node version is unpinned — if a Coolify
build ever fails on an old Node, pin it (Vite 7 + React 19 want Node 20+).

## Current state (verified 2026-07-23)

- Coolify server `localserver` (10.79.75.177) is up and reachable.
- A `radiantplay-test` project has one running application:
  - Name: `radiantplay:main-dff8xuoun0kpp4a6fl9ih6xy`
  - Source: `faris-ts/radiantplay` (GitHub, branch `main`) — the maintainer
    exception, not the galaxy deploy-key path designers will use
  - Build: nixpacks auto-detect, port 3000
  - URL: `https://radiantplay-test.coolify.thoughtspot.com`
  - Health checks are **off** (`health_check_enabled: false`), so status reads
    `running:unknown`.
- The Coolify MCP connected to sessions is **read-only** (`list_*` / `get_*`).
  It can't create or configure apps; that's done in the Coolify UI per IT's guide.

## Deferred / not doing yet

- **Per-PR preview links.** Needs Coolify's GitHub-App-style integration with
  GHE so Coolify receives pull-request webhook events. The SSH-deploy-key path
  in IT's guide doesn't provide this. Parked until IT enables it for the team.
  **Clarified 2026-09-02:** this only concerns *PR* events. *Push*-triggered
  deploys need no GitHub App — a plain repo webhook to Coolify's manual endpoint
  works over the internal http address (guide, step A7). radiantplay-faris had
  never auto-deployed until that webhook was added; the deploy key alone only
  grants pull access.
- **Live AI (`/api/chat`).** Would need a small Node server to serve `dist` and
  handle the proxy (Coolify has no Vercel-style serverless functions), plus
  `ANTHROPIC_API_KEY`. Revisit when a prototype actually needs live AI on Coolify.
- **A provisioning script.** Self-serve via IT's guide is the current plan, so
  no `coolify-deploy.sh` for now. If per-designer setup becomes a chore, revisit.
- **Vercel replacement.** Left open.

## Quick win, independent of everything

Turn on health checks for the existing `main` deploy
(`radiantplay:main-dff8xuoun0kpp4a6fl9ih6xy`), path `/`, so its status reads
`running:healthy` instead of `running:unknown`.
