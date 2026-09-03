---
description: Put this fork on Coolify with a live *.design.coolify.thoughtspot.com URL that redeploys on every push, or check an existing Coolify app against the known-good recipe. Guided, one step at a time. Usage: /coolify-deploy [branch] | /coolify-deploy check
---

Deploy this RadiantPlay fork to ThoughtSpot's self-hosted Coolify, or check an app that is already there.

You are walking a designer through infrastructure they have not seen before. Go one step at a time, verify each step before moving on, and explain in plain words what a step is for. The two documents under `docs/coolify/` are the source of truth for every setting; read them at the start and do not invent steps that are not in them:

- `docs/coolify/2026-09-03-deploy-guide-for-designers.md` — the steps (A1 to A7, Path B, verify, gotchas)
- `docs/coolify/2026-09-03-coolify-operations.md` — the recipe table, the webhook mechanics, the quirks

Argument: `$ARGUMENTS`. Empty or a branch name means **set up**. `check` means **check an existing app**.

---

## Hard boundaries (never cross these)

1. **Never type a private key, a webhook secret, an API token or a password into any field.** Coolify generates the deploy key itself, and the webhook secret is copied by the designer. When a step needs one of those pasted, open the right page, name the exact field, and wait for the designer to say done. Say this up front so it is not a surprise: "two pastes in this flow are yours, I will tell you when."
2. **Public keys are fine to paste.** An `ssh-ed25519 AAAA...` public key is not secret.
3. **Never change another designer's app.** Only touch apps whose repository is this fork.
4. **Never bypass a verification.** If a check fails, stop and fix it before the next step. A "successful" deploy that serves a blank page or 404s on refresh is the most common failure here.

---

## Tools: which one, in this order

1. **Claude in Chrome** (the designer's own logged-in browser). Preferred for everything in the Coolify and galaxy UIs: creating the app, setting fields, reading results back. Find elements by their label text, never by coordinates — Coolify's layout shifts between versions. Read the page after every save to confirm the value stuck.
2. **A Coolify MCP**, if one is connected. Use it only for what it is good at: creating the app and polling deployments. It **cannot** set "Is it a static site?" or the nginx config (it answers "Invalid request"), and it cannot edit webhook secrets. Do those in the UI.
3. **Printed checklist**, if no browser tool is available. Print each step as "open this page, set this field to this value", then ask the designer to say done. Verify what you can from the terminal with `curl`.

Detect what is available at the start and tell the designer which mode you are in.

---

## Setup flow

### Step 0 — Context

Work out, and show the designer, before touching anything:

- **Fork**: from `git remote -v`, the galaxy remote's `owner/repo`. If there is no galaxy remote, stop: Coolify pulls from galaxy only.
- **Branch**: `$ARGUMENTS` if given, else the current branch. Confirm it is pushed to galaxy (`git rev-parse origin/<branch>` vs the galaxy remote). Coolify builds what is on galaxy, not what is local.
- **Name**: `radiantplay-<designer>` where `<designer>` is the galaxy owner's first name, lower case. If this fork already has an app on Coolify, the second app is `radiantplay-<designer>-<branch>`.
- **URL**: `https://<name>.design.coolify.thoughtspot.com`.
- **Network**: `curl -s -o /dev/null -w "%{http_code}" -m 5 https://ts.coolify.thoughtspot.com/` must return something. A timeout means the designer is off Twingate. Stop and say so.
- **Second app on the same fork?** Ask. If yes, the webhook secret step changes (see A7).

Then say what will happen: roughly 15 minutes, seven steps, two pastes that are the designer's, and a live URL at the end that redeploys itself on push.

### A1 — Deploy key (Coolify generates it)

Coolify → **Keys & Tokens** → **Private Keys** → **Add**. Choose **Generate new ED25519 SSH key**, name it `GHE-radiantplay-<designer>`, continue. Copy the **public key** from the page.

Each galaxy repo needs its own key. Do not reuse one that exists; GHE refuses a key that is already on another repo ("key already in use").

**Verify**: the key appears in the Private Keys list with that name.

### A2 — Public key onto the fork

Open `https://galaxy.corp.thoughtspot.com/<owner>/radiantplay/settings/keys` → **Add deploy key**. Title `coolify-deploy`, paste the public key, leave **Allow write access off**, add.

**Verify**: the key is listed on that page.

### A3 — Create the app

Coolify → **Projects** → the designer's project (create one named `radiantplay-<designer>` if none) → **Add New Resource** → **Application** → **Private Repository (with Deploy Key)** → select the key from A1. Repository `git@galaxy.corp.thoughtspot.com:<owner>/radiantplay.git`, branch from Step 0. Do not deploy yet.

With a Coolify MCP: create with build pack `nixpacks`, install `npm ci`, build `npm run build`, publish directory `/dist` (leading slash required), port `80`, the domain from Step 0, `instant_deploy: false`.

### A4 — Build settings

Open the app → **Configuration** → **General**. Set, and confirm each after save:

| Field | Value |
|---|---|
| Build Pack | **Nixpacks** (never Static; Static serves the unbuilt source as a blank page) |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Publish Directory | `/dist` |
| Port | `80` |
| Domain | the URL from Step 0 |

### A5 — Node version

**Environment Variables** → add `NIXPACKS_NODE_VERSION` = `22`, available at build time. Without it Nixpacks uses Node 18 and the build dies with `crypto.hash is not a function`.

**Verify**: the variable is listed.

### A6 — Static site and deep links

Back in **General**: tick **Is it a static site?** and save. A **Custom Nginx Configuration** box appears with a Coolify default that 404s on deep links. Replace its contents with `docker/nginx.conf` from this repo, save.

**Verify**: reopen the page and confirm the box shows `try_files $uri $uri/ /index.html`.

### First deploy

Click **Deploy** (or trigger via MCP) and wait. Three to four minutes. Watch **Deployments**:

- Success: the log shows `built in ...s` and the status turns to finished.
- Failure: read the log tail and match it to the gotchas table in the guide. The two common ones are `crypto.hash is not a function` (A5 missing) and a permission error cloning (A2 not done or wrong fork).

**Verify the site, not just the build**, from the terminal:

```bash
for p in / /playground /radiant/components/button; do printf "%s -> " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "https://<name>.design.coolify.thoughtspot.com$p"; done
curl -s https://<name>.design.coolify.thoughtspot.com/ | grep -o '<script[^>]*src="[^"]*"' | head -1
```

All three paths must return 200, and the script tag must point at `/assets/index-*.js`. A `src/main.tsx` reference means the Static build pack is serving source (A4). A 404 on the deep links means A6 did not save. Then open the URL in the browser, click into a prototype, and hard-refresh; it must load, not 404.

### A7 — Auto-deploy on push

The deploy key only lets Coolify pull. Without this step every update is a manual Redeploy click and the app silently serves an old build.

**First app on this fork:**

1. Coolify → the app → **Webhooks** → under GitHub, show the designer the **manual webhook secret**. They copy it. Ignore the URL shown there.
2. Open `https://galaxy.corp.thoughtspot.com/<owner>/radiantplay/settings/hooks` → **Add webhook**. Fill in for them: Payload URL `http://10.79.75.177:8000/webhooks/source/github/events/manual`, content type `application/json`, **Just the push event**, Active. Then say: paste the secret into the Secret field and click Add webhook.
3. Galaxy sends a ping. **Recent Deliveries** must show 200. The ping is not signature-checked, so a green ping proves reachability, not the secret. Only a real push proves the secret.

Why the plain-http IP and not the https hostname: Coolify's certificate comes from an internal CA the GHE appliance does not trust, and the hostname resolves to an address galaxy cannot route. GHE shows that as a bare 500. Both hosts sit on the corporate network and the payload is signed.

**Second or later app on the same fork:**

The webhook already exists. Coolify checks the signature **per app**, against each app's own secret, and silently skips apps whose secret differs while galaxy still shows 200. So: open the first app's **Webhooks** page, have the designer copy its GitHub manual webhook secret, open the new app's **Webhooks** page, and have them paste it into the same field and save. No change on galaxy.

**Verify with a real push**: have the designer push any commit to the branch on galaxy. Within a minute a deployment must appear in Coolify marked as a webhook deploy. If nothing appears: galaxy delivery shows 401 means the secret on galaxy is wrong; delivery shows 200 with no deployment means this app's secret does not match the webhook (redo the paste above) or auto deploy is off under **Advanced**.

### Done card

Print, and nothing more:

```
Live:      https://<name>.design.coolify.thoughtspot.com
Tracks:    galaxy <owner>/radiantplay, branch <branch>
Updates:   push to galaxy → rebuilds itself in about 3 minutes
Stale?     hard-refresh once; the shell is cached without Cache-Control
Broken?    /coolify-deploy check
```

---

## Check flow (`/coolify-deploy check`)

Open every Coolify app whose repository is this fork (UI, or MCP if present) and compare against the recipe. Report one line per item, pass or fail, then fix what the designer approves:

| Check | Expect | Where |
|---|---|---|
| Build pack | Nixpacks | General |
| Is it a static site? | on | General |
| Publish directory | `/dist` | General |
| Install / build | `npm ci` / `npm run build` | General |
| Port | 80 | General |
| `NIXPACKS_NODE_VERSION` | 22 | Environment Variables |
| Custom nginx | contains `try_files $uri $uri/ /index.html` | General |
| Auto deploy | on, deploy on push | Advanced → Deployment |
| Webhook secret | identical across every app on this fork | Webhooks, per app |
| Galaxy webhook | exists, push event, plain-http IP URL, active | fork settings → Hooks |
| Last deployment | finished, and its commit equals galaxy `<branch>` HEAD | Deployments |
| Live site | root and a deep link return 200; script tag is `/assets/index-*.js` | curl |

Anything failing maps to a step above. Fix in that order.

---

## Gotchas to recognise on sight

| You see | It means | Do |
|---|---|---|
| "Key already in use" on galaxy | Key is on another repo | A1: generate a new one |
| `Permission to ... denied to deploy key` in the build log | Public key not on this fork | A2 |
| Blank page or raw source after a "successful" deploy | Build pack is Static | A4 |
| `crypto.hash is not a function` | Node 18 | A5 |
| Deep link or refresh 404s, clicking works | No nginx fallback | A6 |
| "Invalid request" from API or MCP on static or nginx fields | Those fields are UI-only | Do A6 in the UI |
| Old build after a deploy | `index.html` cached by the browser | Hard refresh |
| Galaxy delivery 200 but no deployment | Secret mismatch on this app, or auto deploy off | A7 second-app paste; Advanced |
| Galaxy delivery 401 | Secret on galaxy is wrong | Redo the galaxy secret |
| Galaxy delivery 500 in 0.01s, empty body | Webhook URL uses the https hostname | Use the plain-http IP |
