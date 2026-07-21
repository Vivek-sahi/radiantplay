# Coolify deploy setup for RadiantPlay

## Goal

Give every designer a working prototype URL on Coolify without asking IT to hand-hold each one. Maintainer's URLs (main, staging) keep working as they do today. Each designer gets their own Coolify project; each branch they push gets its own URL; prototypes inside that deploy stay React Router slugs, same as now.

## Current state (verified 2026-07-21)

- Coolify server `localserver` (10.79.75.177) is up and reachable.
- A `radiantplay-test` project already exists with one running application:
  - Name: `radiantplay:main-dff8xuoun0kpp4a6fl9ih6xy`
  - Source: `faris-ts/radiantplay` (GitHub, branch `main`) — not the galaxy SSH-deploy-key path
  - Build: nixpacks auto-detect, port 3000, base directory `/`
  - URL: `https://radiantplay-test.coolify.thoughtspot.com`
  - Last deployed 2026-07-21. Health checks are **off** (`health_check_enabled: false`), so status reads `running:unknown` instead of `running:healthy`.
- No Dockerfile / nginx.conf / docker-compose in the repo. The earlier Docker-based plan was superseded by nixpacks auto-detect, which already works.
- The Coolify MCP connected to this session is **read-only** (`list_*` / `get_*` only). It cannot create projects, applications, or trigger deploys. Any automation below has to call Coolify's REST API directly with a personal API token (Keys & Tokens → API tokens in the Coolify UI), which is a different credential from the SSH deploy key used for git access.

## Target shape

```
Maintainer (this repo, origin + galaxy)
├── main     → https://radiantplay.coolify.thoughtspot.com          (rename/reuse radiantplay-test)
└── staging  → https://radiantplay-staging.coolify.thoughtspot.com  (new)

Designer (their own fork, origin only)
└── their own Coolify PROJECT
    ├── branch `personal`         → https://radiantplay-<designer>.coolify.thoughtspot.com
    └── branch `personal/<name>`  → https://radiantplay-<designer>-<name>.coolify.thoughtspot.com
```

Inside every deploy, prototypes stay exactly what they are today — React Router paths (`/playground/<Name>`), driven by that branch's `registry-mine.ts`. Nothing changes about how prototypes are built or registered; only the deploy target changes.

**Unit of deploy = one Coolify application per branch**, grouped under one Coolify **project** per designer (Coolify's native project → environment → application hierarchy maps directly onto this — one environment per branch).

## Decisions locked in

| Question | Decision |
|---|---|
| URL structure | One Coolify app per branch. Prototypes remain React Router slugs inside that app — no new routing infrastructure needed. |
| Designer unit | One Coolify app per branch, not per prototype. A designer with `personal` + two `personal/<name>` branches gets three apps in one project. |
| Deploy trigger | Git push auto-deploy via Coolify webhook. No manual redeploy step after first setup. |
| Provisioning | Self-service script the designer runs once per new branch. It calls Coolify's REST API (not the MCP) with the designer's own API token. |

## What the self-service script needs to do

Working name: `scripts/coolify-deploy.sh` (or a `/deploy-coolify` skill wrapping it).

1. Read the current branch and `origin` remote URL from git.
2. Confirm (or create) the designer's Coolify **project** — one per designer, named after their GitHub/galaxy handle.
3. Confirm (or create) an **environment** for the current branch inside that project.
4. Create the **application**:
   - Source: `origin` (GitHub App connection if the fork lives on GitHub; SSH deploy key + galaxy if it lives on galaxy — the two source types already visible in this Coolify instance)
   - Build pack: nixpacks (matches the working `main` deploy, no Dockerfile needed)
   - Port: 3000
   - FQDN: `radiantplay-<designer>[-<branch-slug>].coolify.thoughtspot.com`
   - Health check: **on** this time (`health_check_enabled: true`, path `/`) — fixes the `running:unknown` gap seen on the current `main` deploy
   - Webhook: enabled, so future pushes to this branch auto-deploy
5. Set required env vars on the new application (`ANTHROPIC_API_KEY`, `FIGMA_TOKEN`, `SITE_PASSWORD`, `PUBLIC_MODE` as applicable — see `radiantplay-build-and-env` for what each gates) from the designer's local `.env.local` or an interactive prompt. Never commit these.
6. Trigger the first deploy and print the resulting URL.
7. Re-running the script for a branch that already has an app should update it (idempotent), not create a duplicate.

## Open questions (need IT / Adil, or a decision from you)

- **Coolify account per designer.** Does every designer already have their own Coolify login/team, or does IT need to provision one before the script can call the API on their behalf? This is a one-time human step the script can't do for itself.
- **GitHub-hosted vs galaxy-hosted forks.** The live `main` deploy pulls from GitHub directly (no SSH key). Designer forks can live on either host per `CLAUDE.md`. The script needs to branch on this — GitHub App connection for GitHub forks, SSH deploy key (per the onboarding doc you pasted) for galaxy forks. Worth confirming both connection types are enabled for the team, not just galaxy's.
- **Subdomain naming collisions.** `radiantplay-<designer>-<branch-slug>` needs to stay under whatever length/character limits Coolify's FQDN field enforces, and two designers can't collide on the same slug. Simple to guard in the script; just flagging it.
- **Env var provisioning.** Coolify doesn't inherit env vars the way Vercel's project settings do — each new application starts empty. The script has to set these explicitly every time, which means it needs a source of truth for which vars a personal prototype build actually needs (currently `.env.local`, per `radiantplay-build-and-env`).
- **Cleanup.** When a `personal/<name>` branch is deleted after merge (per the existing workflow in `CLAUDE.md`), does its Coolify app get torn down automatically, or does it linger? Recommend the script (or a companion `coolify-teardown.sh`) delete the app when the branch is deleted, so designer projects don't accumulate dead apps.
- **Does this replace Vercel or run alongside it?** Still open from the original Coolify migration memory — worth deciding before designers start depending on Coolify URLs for review/handoff.

## Next steps

1. Confirm the open questions above, especially Coolify account provisioning per designer and the GitHub-vs-galaxy branching in the script.
2. Turn on health checks for the existing `main` deploy (`radiantplay:main-dff8xuoun0kpp4a6fl9ih6xy`) as a quick win, independent of everything else.
3. Add a `staging` application alongside `main`, same config, to restore parity with the current Vercel branch setup.
4. Write `scripts/coolify-deploy.sh` against Coolify's REST API (not the MCP — it's read-only) and dry-run it on one real designer branch before calling it done.
