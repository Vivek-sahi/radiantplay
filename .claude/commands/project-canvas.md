---
description: Generate and open the local project canvas for this repo (content, branches, sites, forks, docs). Pure shell, no LLM tokens. Pass `full` (or `census`) to also refresh the maintainer's Forks and Census tabs in the background.
argument-hint: "[full]"
---

Run the status script and confirm it opened. On a designer's first run, ask two questions first (below).

```bash
bash internal/scripts/status.sh
```

After it runs, tell the user the file path (`public/status.html`) and that it opened in the browser. Do not interpret or summarize the contents. The page is the deliverable.

## Full refresh: `full` or `census`

When the arguments include `full` or `census`, run this instead, in the background (it takes a few minutes):

```bash
bash internal/scripts/status.sh --full
```

It opens the quick canvas straight away, then calls GitHub for every fork, runs the prototype census (`internal/scripts/prototype-census.sh`) and rewrites the page. Tell the user the canvas is open and the Forks and Census tabs refresh in the background; when the run finishes, tell them to reload the page. On a designer's fork `full` does nothing extra: those tabs are the maintainer's.

## First run on a designer fork

Before running the script, check the role and whether the designer has settings yet. This prints a few lines and writes nothing:

```bash
bash internal/scripts/status.sh --first-run-defaults
```

If it prints `role=maintainer` or `local=present`, skip this section and run the script. Otherwise ask the designer one message with two questions, each with the default it printed:

1. "What should the canvas be called?" Default: the `title=` value, `<first name>'s RadiantPlay`.
2. "Is your fork on Coolify?" Default: the `site=` URL when it's set (the script found a live site at the usual address). When `site=` is empty: "none yet, run `/rp-coolify-deploy` when you want one".

"Don't know" or a skipped question keeps the default. Then write `internal/status.local.sh`. It's gitignored, so it never reaches a commit or another fork:

```bash
# Your project canvas settings. Gitignored: this file stays on your machine.
STATUS_TITLE="<the title>"
STATUS_TITLE_EM=""
STATUS_SITE_URL="<the Coolify URL, or empty for none yet>"
```

Put a backslash before any `"`, `$` or backtick in the title. Then run the script. Later runs find the file and ask nothing. Running `bash internal/scripts/status.sh` directly never asks anything: without the file it uses the same defaults.

## What the page holds

The page depends on who runs it. The maintainer's checkout (a `galaxy` remote at `mohammed-faris/radiantplay`) gets the maintainer canvas. Every other checkout, a designer's fork, gets the designer canvas. `STATUS_ROLE=designer bash internal/scripts/status.sh` previews the designer canvas on the maintainer's checkout.

### Designer canvas

| Tab | Shows |
|---|---|
| Home | Up to four next steps, each with the command that fixes it; sync and site state; how many releases the fork's `main` is behind `upstream/main`, with each missing release's changelog summary and a link to `/radiant/changelog`; your branches (local only or pushed, unpushed commits, uncommitted files, divergence against `main` and RadiantPlay); the designer guides (Coolify, Claude setup, how RadiantPlay works) |
| My prototypes | Each `registry-mine.ts` prototype: last change, theme, dark ready, Geist ready, thumbnail, open link (from `node scripts/radiant-check/scan.mjs --mine --json`). Below it, your Coolify site from `STATUS_SITE_URL`: up or down, and whether pages are served `no-cache` |

Before fetching `upstream`, the script checks the git host with a 3 second `curl`, so off Twingate it doesn't hang; Home then reads updates from the last fetch.

### Maintainer canvas

Six tabs, each rebuilt from where the work actually is, so none of it can quietly go stale.

| Tab | Source |
|---|---|
| Overview | Topology diagram, working tree, recent commits, remotes |
| Content | Grouped by project: the two prototype registries, every standalone page in `public/`, and the project docs, newest first inside each group |
| Branches | `git`, with divergence against each configured baseline |
| Sites | `curl` against the configured deploys, all checked at once |
| Forks or Upstream | `gh` on the configured host; the tab changes by role. On the maintainer canvas it shows the results saved by the last `full` run, with their age |
| Census | Maintainer only: the prototype census across every fork, from the last `full` run. With nothing saved, or a week old, it shows the command to run |
| Docs and plans | Plans, rules, slash commands, docs and articles, each openable in place |

A markdown file listed under Docs and plans opens in a reader on the page, so the dashboard works from `file://` with nothing served. Files that exist only on this machine carry a `local` badge.

## Settings

A designer's settings live in `internal/status.local.sh` (gitignored): `STATUS_TITLE`, `STATUS_TITLE_EM` and `STATUS_SITE_URL`. The script loads `internal/status.config.sh` only for the maintainer, then `internal/status.local.sh` when it exists.

The maintainer's settings live in `internal/status.config.sh`: title, git host, baselines, per-branch purpose notes, and the Sites rows. It is a sourced shell file rather than JSON, so the script still needs nothing but shell, git and gh. A fork without the file falls back to the same defaults.

To add a project group, append a `"Group name|substring substring"` row to `STATUS_GROUPS`. Each substring is matched case insensitively against an item's path or registry id, the first matching group wins, and the declared order is the render order. Anything unmatched lands under **Unfiled** at the bottom, which is the cue to add a pattern. A markdown file only reaches Content when it matches a group: an unmatched one is repo machinery rather than project work, and stays in Docs and plans only.

To add a deploy, append a `"branch|platform|url"` row to `STATUS_DEPLOYS`. A URL on an internal host only answers on Twingate VPN and reads as unreachable off it. A password-gated deploy answers 401 and reads as `Gated`, which still counts as up.

## Looks

The page ships two visual systems, toggled in its header and remembered per browser.

- **Studio**, the default, borrowed from the agentspot Data Apps canvas: rounded surfaces, sans labels, indigo links, a soft wash behind the header.
- **ASCII**, the repo canon for decks: flat squares, mono labels, warm amber as the only accent.

Light and dark follow the operating system on first load, and the Mode button overrides it. `STATUS_LOOK` in the config sets which look a fresh browser starts on.

## Known cost

A plain run takes a few seconds: it never calls GitHub per fork and never fetches forks. `full` does both (two `gh api` calls per fork, plus the census's `git fetch` of every fork), which is a few minutes, so it runs in the background and saves its results in `internal/cache/` (gitignored) for the quick runs.
