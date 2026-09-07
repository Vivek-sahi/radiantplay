---
description: Generate and open the local project canvas for this repo (content, branches, sites, forks, docs). Pure shell, no LLM tokens.
---

Run the status script and confirm it opened.

```bash
bash internal/scripts/status.sh
```

After it runs, tell the user the file path (`public/status.html`) and that it opened in the browser. Do not interpret or summarize the contents. The page is the deliverable.

## What the page holds

Six tabs, each rebuilt from where the work actually is, so none of it can quietly go stale.

| Tab | Source |
|---|---|
| Overview | Topology diagram, working tree, recent commits, remotes |
| Content | Grouped by project: the two prototype registries, every standalone page in `public/`, and the project docs, newest first inside each group |
| Branches | `git`, with divergence against each configured baseline |
| Sites | `curl` against the configured deploys, all checked at once |
| Forks or Upstream | `gh` on the configured host; the tab changes by role |
| Docs and plans | Plans, rules, slash commands, docs and articles, each openable in place |

A markdown file listed under Docs and plans opens in a reader on the page, so the dashboard works from `file://` with nothing served. Files that exist only on this machine carry a `local` badge.

## Settings

Everything a fork would want to change lives in `internal/status.config.sh`: title, git host, baselines, per-branch purpose notes, and the Sites rows. It is a sourced shell file rather than JSON, so the script still needs nothing but shell, git and gh. A fork without the file falls back to the same defaults.

To add a project group, append a `"Group name|substring substring"` row to `STATUS_GROUPS`. Each substring is matched case insensitively against an item's path or registry id, the first matching group wins, and the declared order is the render order. Anything unmatched lands under **Unfiled** at the bottom, which is the cue to add a pattern. A markdown file only reaches Content when it matches a group: an unmatched one is repo machinery rather than project work, and stays in Docs and plans only.

To add a deploy, append a `"branch|platform|url"` row to `STATUS_DEPLOYS`. A URL on an internal host only answers on Twingate VPN and reads as unreachable off it. A password-gated deploy answers 401 and reads as `Gated`, which still counts as up.

## Looks

The page ships two visual systems, toggled in its header and remembered per browser.

- **ASCII**, the default and the repo canon: flat squares, mono labels, warm amber as the only accent.
- **Studio**, borrowed from the agentspot Data Apps canvas: rounded surfaces, sans labels, indigo links, a soft wash behind the header.

Light and dark follow the operating system on first load, and the Mode button overrides it. `STATUS_LOOK` in the config sets which look a fresh browser starts on.

## Known cost

The Forks tab makes two sequential `gh api` calls per fork, which is most of the run time on the maintainer path. Everything else, the site checks included, is about a second.
