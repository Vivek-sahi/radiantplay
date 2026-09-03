# Deploying RadiantPlay on Coolify — designer guide

A step-by-step for putting your RadiantPlay fork on Coolify so it gets a live
URL. RadiantPlay is a **Vite single-page app** — it has to be **built** before
it's served, and it uses client-side routing. The steps below account for both;
skipping them is why an app can deploy "successfully" and still show a blank
page or 404 on refresh.

## Before you start

- Be on **Twingate VPN** (Coolify and galaxy are internal).
- Have access to Coolify at `https://ts.coolify.thoughtspot.com`.

## Pick your path

| | Path A — Git deploy key | Path B — Docker image |
|---|---|---|
| Use when | You can add a deploy key to your galaxy fork | You have **no git connection** to Coolify |
| Auto-deploy on push | ✅ Yes — **after the webhook step (A7)**; the deploy key alone only lets Coolify *pull* | ❌ No — rebuild + push + redeploy by hand each time |
| You need | An SSH deploy key on your repo | Docker installed locally + a container registry |
| Effort | Set up once, then automatic | Manual every update |

**Path A is less work overall** — a "deploy key" is just an SSH key added to your
galaxy repo, not a full GitHub integration, so it's worth checking whether it's
really unavailable before choosing Docker. If git is genuinely off the table,
use Path B.

---

# Path A — Git deploy key (auto-deploy)

## A1 — Generate your OWN deploy key

Each repo needs its own unique key. **Don't reuse someone else's** — GitHub
Enterprise allows a key on only one repo, so a shared key is rejected with "key
already in use."

1. Coolify → **Keys & Tokens** → **Private Keys** → **+ Add**
2. **Generate new ED25519 SSH Key**, name it `GHE-radiantplay-<yourname>`
3. **Continue**, then copy the **public key** (`ssh-ed25519 AAAA...`)

## A2 — Add the key to your galaxy fork

1. `https://galaxy.corp.thoughtspot.com/<you>/radiantplay/settings/keys`
2. **Add deploy key** → Title `coolify-deploy` → paste the public key
3. **Leave "Allow write access" OFF** → **Add key**

## A3 — Create the application

1. Coolify → **Projects** → your project → **+ Add New Resource** → **Application**
2. **Private Repository (with Deploy Key)** → select your key
3. Repository URL `git@galaxy.corp.thoughtspot.com:<you>/radiantplay.git`, branch `main`

## A4 — Build settings (Coolify's defaults are wrong for this app)

| Setting | Value | Why |
|---|---|---|
| **Build Pack** | **Nixpacks** | **Not "Static"** — Static serves your *unbuilt* source and shows a blank page. |
| **Is it a static site?** | **ON** | Serves the built files via nginx. |
| **Publish Directory** | `/dist` | Vite's output. |
| **Install Command** | `npm ci` | No registry login needed. |
| **Build Command** | `npm run build` | Runs `vite build`. |
| **Port** | `80` | |

## A5 — Pin the Node version (required)

**Environment Variables** → add `NIXPACKS_NODE_VERSION` = `22`. Nixpacks defaults
to Node 18, but Vite 7 needs 20.19+/22.12+, else the build fails with
`crypto.hash is not a function`.

## A6 — Fix deep links

**Configuration** → **General** → tick **Is it a static site?** and save. The
**Custom Nginx Configuration** box appears (Coolify pre-fills a default that
404s on deep links). Replace it with the contents of `docker/nginx.conf` in
this repo, then save:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
}
```

Without this, shared deep links (`/playground/...`) and refreshes 404.

Then set the domain (step "Domain & verify" below) and **Deploy**.

## A7 — Make pushes deploy automatically (webhook)

The deploy key lets Coolify *pull* your repo. It does **not** tell Coolify when
you pushed — without this step every deploy is a manual **Redeploy** click, and
the app silently serves an old build. (radiantplay-faris ran that way for a
month; all nine of its deployments were manual.)

1. Coolify → your app → **Webhooks** → under **GitHub**, copy the **manual
   webhook secret**. (Ignore the URL shown there — see the note below.)
2. `https://galaxy.corp.thoughtspot.com/<you>/radiantplay/settings/hooks` →
   **Add webhook**
3. **Payload URL:**
   `http://10.79.75.177:8000/webhooks/source/github/events/manual`
   **Content type:** `application/json` · **Secret:** the one you copied ·
   **Just the push event** · Active → **Add webhook**
4. Galaxy sends a ping. **Recent Deliveries** must show **200** — Coolify
   answers `pong`. Then push a commit: a deployment starts in Coolify by itself,
   marked `is_webhook: true`. A **401** on the push means the secret doesn't
   match — redo step 1.

**Why the plain-http IP and not `https://ts.coolify.thoughtspot.com/...`:**
Coolify's certificate is issued by an internal ThoughtSpot CA that the GHE
appliance doesn't trust, and the hostname resolves to an overlay address galaxy
can't route — so galaxy's TLS handshake fails instantly and GHE shows it as a
bare **500** in 0.01 s with an empty body. The internal address avoids both.
Both hosts are on the corporate network; the payload is HMAC-signed with the
secret, which is never transmitted. `/api/v1/deploy?uuid=…` is **not** a webhook
target — it needs a bearer token GHE can't send.

One webhook per fork covers every Coolify app built from that repo: Coolify
matches `owner/repo` and the branch from the push payload, so `staging` and
`faris` apps on the same repo each fire only for their own branch.

---

# Path B — Docker image (no git)

You build the image on your own machine and push it to a registry that Coolify
pulls from. The repo already contains a `Dockerfile` that **bakes in every fix**
(Node 22, the build step, and the SPA nginx config) — so with Docker there are
**no fiddly Coolify build settings**; the image is correct by construction.

## B0 — One-time: a registry to push to

Coolify can only deploy an image that lives in a registry it can reach — it
can't grab an image sitting on your laptop. Before starting, confirm with IT
(Adil) whether there's a **ThoughtSpot internal container registry**; use that if
so. Otherwise use a **private Docker Hub repository** (don't use a public one —
RadiantPlay is internal). You'll need login credentials for whichever you pick.

## B1 — Install Docker

Install Docker Desktop and make sure `docker --version` works.

## B2 — Build the image (from your local repo)

From the repo root:

```bash
docker build -t <registry>/radiantplay-<yourname>:latest .
```

(e.g. `docker build -t registry.internal.thoughtspot.com/radiantplay-irene:latest .`)

## B3 — Push it to the registry

```bash
docker login <registry>
docker push <registry>/radiantplay-<yourname>:latest
```

## B4 — Deploy the image in Coolify

1. Coolify → your project → **+ Add New Resource** → **Docker Image**
2. Image: `<registry>/radiantplay-<yourname>:latest`
3. If the registry is private, add its credentials when prompted (or under the
   resource's registry settings)
4. **Port:** `80`
5. Set the domain (below) and **Deploy**

## B5 — Updating later

Docker has no auto-deploy. Each time you change the app:

```bash
docker build -t <registry>/radiantplay-<yourname>:latest .
docker push <registry>/radiantplay-<yourname>:latest
```

then click **Redeploy** on the resource in Coolify.

---

# Domain & verify (both paths)

**Domain:** set the app's domain to
`https://radiantplay-<yourname>.design.coolify.thoughtspot.com`
(e.g. `radiantplay-irene.design.coolify.thoughtspot.com`). The
`*.design.coolify.thoughtspot.com` wildcard already resolves.

**Verify it properly** once deployed:

1. Watch the deploy logs for `✓ ... modules transformed` / `built in ...s` (Path
   A) or a clean image pull (Path B), then a running container.
2. Open your URL. Then go **directly** to a deep link (e.g. `.../playground`) or
   **hard-refresh** on a sub-page — it must load the app, **not a 404**. Clicking
   links alone doesn't test this; only a direct load or refresh does.

---

## Gotchas cheat-sheet (every one is a real failure we hit)

| Symptom | Cause | Fix |
|---|---|---|
| "Key already in use" adding a deploy key | GHE allows a key on only one repo | Generate your own unique key (A1) |
| `Permission to <repo> denied to deploy key` | Key not on *your* fork | Add the public key to your repo (A2) |
| Deploy "succeeds" but page is blank / shows source | Build Pack = Static (serves unbuilt files) | Use Nixpacks + build settings (A4), or Docker (Path B) |
| Build fails: `crypto.hash is not a function` | Node 18 vs Vite 7 (needs 20.19+/22.12+) | `NIXPACKS_NODE_VERSION=22` (A5); Docker image already uses Node 22 |
| Deep links / refresh 404 | No SPA fallback in nginx | Custom nginx config (A6); Docker image already includes it |
| Coolify can't find your Docker image | Image only exists locally | Push it to a registry first (B0, B3) |
| Deploy finished but the browser shows the old build | nginx serves `index.html` without `Cache-Control`, so the browser keeps the old shell | Hard refresh; a `no-cache` header on `index.html` is the permanent fix (not yet applied) |
| API / MCP call to set "static site" or nginx config returns "Invalid request" | Coolify's API accepts `is_static` and `custom_nginx_configuration` only on create, and the `coolify-write` MCP rejects both | Set them in the UI (A6) |

## Notes

- **No environment variables needed** beyond `NIXPACKS_NODE_VERSION` (Path A
  only). Live-AI features are off on Coolify for now, so no `ANTHROPIC_API_KEY`.
- **No password gate** — Coolify apps are reachable only on Twingate VPN.
- What is deployed where, the webhook, and the known quirks:
  `docs/coolify/2026-09-03-coolify-operations.md`.
- Original design record (per-designer model, PR previews, Vercel relationship):
  `docs/archive/2026-07-23-coolify-deploy-setup.md`.
