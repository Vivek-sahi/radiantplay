---
description: Preview and merge latest changes from upstream RadiantPlay (galaxy remote) into this fork. Shows what's coming, then asks before merging.
---

Sync this fork with the latest changes from the upstream main repo (galaxy: mohammed-faris/radiantplay).

You are doing a git operation that could lose the designer's work if you get it wrong. Be careful. Apply your normal safe-git instincts (refuse on broken state, never silently overwrite, ask before destructive operations). The notes below are the project-specific rules that aren't obvious from the code.

---

## Project-specific rules (these are the things Claude can't infer)

### Rule 1 — Upstream always lands on `main` first

Never merge `upstream/main` directly into a feature branch — it pollutes the branch with merge commits and risks pushing WIP to main.

The correct flow when the designer is on a feature branch:
1. Stash WIP (always use `--include-untracked`)
2. Switch to `main`, merge `upstream/main`, push `main` to `origin`
3. Switch back to the feature branch
4. Merge `main` forward into the feature branch
5. Pop the stash

The designer must end up on the same branch they started on, with their work intact.

### Rule 2 — Registry conflicts have specific resolutions

The project uses a split registry:
- `registry-core.ts` — upstream-owned sample prototypes
- `registry-mine.ts` — designer-owned prototypes (never conflicts in normal flow)
- `registry.ts` — thin merger (do not edit by hand)

**Subsequent syncs:** conflicts should only appear in `registry-core.ts`. Accept upstream's version. If `registry-mine.ts` conflicts, stop — that's unexpected and worth surfacing.

**First sync after the registry split** (designer's fork still has the old monolithic `registry.ts`):
1. Read the conflicted `registry.ts` and identify the designer's entries (anything not in upstream's `registry-core.ts`).
2. Accept upstream's version of `registry.ts` (the thin merger).
3. Move designer entries into `registry-mine.ts`:
   - `import React from 'react';` at the top
   - Thumbnail imports
   - `React.lazy(() => import(...))` declarations
   - Entries in `myRegistry` with `section: 'mine'`
4. Ensure `registry-mine.ts` imports `ProjectMeta` from `'./registry-core'`.

After resolving:
```
git add src/prototypes/registry.ts src/prototypes/registry-core.ts src/prototypes/registry-mine.ts
git commit --no-edit
```

### Rule 2b — Other conflicts with a known resolution

| Conflict | Resolution |
|---|---|
| A sample thumbnail in `src/prototypes/thumbnails/` that the fork edited and upstream deleted (modify/delete) | Accept upstream's deletion (`git rm <file>`). Sample prototypes now use screenshots in their own folders. A thumbnail the designer's own prototype still imports is not a sample one; if a deleted file is imported by `registry-mine.ts`, keep it and say so. |
| A sample thumbnail SVG that both sides edited | Take upstream's version (`git checkout --theirs <file>`). |
| `package.json` `scripts` added on both sides | Keep both sides' scripts: join the two lists, add the comma between them, and check the file is valid JSON (`node -e "JSON.parse(require('fs').readFileSync('package.json'))"`). For any other `package.json` conflict (dependencies, versions), stop and show it. |
| Vendored Radiance: `public/vendor/radiance/*`, `scripts/radiance/upstream/*` | Always take upstream's version (`git checkout --theirs <file>`), never keep a fork's edit. These are Radiance's own files, checked against `public/vendor/radiance/manifest.json` by `npm run radiance:check`. |
| `vite.config.ts` that both sides changed | Keep both. Take the fork's additions (their plugins, `define`, `server` settings) and upstream's, and make sure upstream's `import { registryWritePlugin } from './vite.registry-write';` and `registryWritePlugin(),` in `plugins` both survive: the gallery saves through it. Then run `npm run typecheck`. |
| `src/prototypes/_liveboard-template/index.tsx` that the fork edited | Keep the fork's version (`git checkout --ours <file>`), since the designer built on it. Upstream's version moved its styles into `index.module.css`; the fork's file doesn't use that, so it still builds. Say that the template's new CSS Module version is in upstream if they want it. |
| Guidance files: `CLAUDE.md`, `.cursor/rules/*`, `.claude/commands/*`, `.claude/skills/*` | Take upstream's version for the conflicting block, and keep the fork's other edits to the file that merged cleanly. Upstream's guidance teaches the current conventions (for example theme-aware colour with `sysVar()`); keeping an old block brings back outdated patterns. Tell the designer which of their edits were replaced. |

Resolve a conflict block, not the whole file, wherever the fork made other changes that merged cleanly: edit out the `<<<<<<<`, `=======`, `>>>>>>>` section and keep upstream's side.

### Rule 3 — Common post-merge build errors

After merging, run `npm run build`. If it fails, the cause is usually one of:

| Error | Fix |
|---|---|
| `Cannot find module './<Name>'` in `registry-core.ts` | Upstream removed a sample prototype but a lazy import lingers. Remove the `React.lazy` line and its registry entry. |
| `Cannot find module` in `registry-mine.ts` | A designer prototype was deleted but its entry remains. Remove the lazy import and entry. |
| `Cannot find module` in another barrel/index file | An export references a deleted file. Remove the broken export. |
| `Could not resolve "./thumbnails/<Name>.svg"` from `registry-mine.ts` | The designer's entry imports a sample thumbnail that upstream deleted (sample prototypes now use screenshots in their own folders). Remove the import and the entry's `thumbnail` field; the gallery shows a live preview until the designer runs `/thumbnail`. Typecheck passes on this one, so only the build catches it. |
| `Cannot find name 'systemColors'` (or `rdComponentColors`, `referenceColors`) in a file the designer changed | Git merged cleanly but upstream removed that import. Replace `systemColors.light['x']` with `sysVar('x')` and `rdComponentColors.light['x']` with `compVar('x')`, importing `sysVar` / `compVar` from `@tokens/colors`. Same token, same light value, and it now follows the theme. Don't re-add the old import. |
| TypeScript error inside a designer prototype | Unrelated to the sync. Flag it but continue — the sync itself is fine. |

Always run the build after a merge, even when Git reports no conflicts: a clean merge can still break the build (the dark mode dry run on 2026-10-07 hit exactly the `systemColors` case above).

If the designer edited a shared component (`src/components/*`) and it conflicts, keep upstream's version and re-apply their change on top. For `GlobalHeader` and `AppSidebar`, a fork that wanted the old dark nav passes `theme="dark"`; upstream supports that, so keep the prop rather than the old colour code.

Commit any cleanup as `fix: post-sync build cleanup` before pushing.

### Rule 4 — Upstream remote setup

If `upstream` is missing, add it. Try HTTPS first, fall back to SSH on auth failure:

```
git remote add upstream https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git
# if fetch fails with 403 / auth error:
git remote set-url upstream git@galaxy.corp.thoughtspot.com:mohammed-faris/radiantplay.git
```

---

## What the designer expects to see

### Phase 1 — Preview (no merging yet)

1. Fetch upstream.
2. If `main` is already in sync with `upstream/main` (compare `main..upstream/main`, not `HEAD..upstream/main` — the designer may be on a feature branch), print "Already up to date" and stop.
3. Otherwise, show a preview structured like this:

```
Upstream Sync — preview

STATUS
  Current branch: <branch>
  Uncommitted work: <yes / no>
  main is X commits behind upstream.

WHAT'S NEW IN THE LIBRARY
  New components, updated components, removed components
  Token changes, new/removed sample prototypes, rule/doc updates

IMPACT ON YOUR PROTOTYPE
  Files the designer changed that upstream also touched.
  Mark registry-core.ts overlaps as auto-resolved.
  Mark registry-mine.ts overlaps as unexpected.
  Everything else is a real conflict the designer should know about.

WHAT WILL HAPPEN IF YOU PROCEED
  A plain-English description tailored to current branch + WIP state.
  Mention the pause points: forward merge into feature branch, stash pop.
```

To compute overlap, diff `main upstream/main` and intersect with the designer's modified files (`git diff --name-only HEAD`, `--cached`, and `main...HEAD` if on a feature branch).

Then ask: **"Proceed with sync? (yes / no)"** — and stop if no.

### Phase 2 — Apply

Only after explicit yes. Follow Rule 1's flow. Use your judgment on the mechanics:

- After the merge, re-read this file (`.claude/commands/sync-upstream.md`) from disk. If upstream changed it, follow the new version for the rest of the run. The sync that brings in a new step runs the fork's old copy of this command, so this is how that first sync picks the step up.

- Stash with `--include-untracked` before any branch switch or merge. After stashing, verify `git status --porcelain` is empty — if it isn't, the stash didn't capture everything; stop and surface what's still in the working tree before switching branches.
- If anything goes wrong (mid-merge state, leftover stash, divergent main, etc.), stop and explain in plain language — don't push through.
- On any conflict, tell the designer exactly which files are affected, what each side changed, and the exact commands to resume (`git merge --continue`, `git stash pop`, etc.). Never abandon a stash silently.
- Light-only: nothing to run. Since 26.10.1b a prototype in `registry-mine.ts` with no `theme` line stays light when someone turns dark mode on, so a sync never changes how a designer's prototype looks. Don't add `theme` lines during a sync. (Older forks may still have `theme: 'light-only'` lines from a 26.10.1a sync; leave them.)
- Final report: confirm what branch they're on, what was pulled in, and that their work is intact.
- Radiance: if the merge changed `public/vendor/radiance/manifest.json`, say so in one line with the old and new Radiance version (`radianceVersion` and `vendorVersion`, from `git show <pre-merge main>:public/vendor/radiance/manifest.json` against the merged file). Nothing for the designer to do.
- Prototype status: run `npm run scan:dark -- --mine` and show its table. Then explain in plain words: "Your prototypes stay in light mode when someone turns dark mode on, so they look exactly as they did before. Nothing else changes. Run `/rp-migrate-prototype` when you want them on the new font and dark mode. Nothing is urgent."
- Thumbnails: run `npm run thumbnails:check -- --mine`. If it lists prototypes, capture them by following `.claude/skills/rp-prototype-thumbnails/SKILL.md` (it asks the one-time setup question once per machine and remembers a no). Leave the new images uncommitted and say they're ready to commit. Prototypes without a thumbnail still show a live preview in the gallery, so a declined setup or a failed capture is fine: say so in one line and finish.

---

## The non-negotiables

- The designer must end on the same branch they started on.
- WIP must be preserved end-to-end. If a stash is created, it must be popped (or surfaced as preserved with explicit recovery instructions if a conflict prevents the pop).
- `main` is the only branch that gets pushed to `origin` in this command. Never push a feature branch.
- If you're uncertain about the state of the repo at any point, stop and ask. Lost work costs the designer 20 minutes of debugging — a pause costs nothing.
