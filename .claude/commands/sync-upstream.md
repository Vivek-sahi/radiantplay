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

### Rule 3 — Common post-merge build errors

After merging, run `npm run build`. If it fails, the cause is usually one of:

| Error | Fix |
|---|---|
| `Cannot find module './<Name>'` in `registry-core.ts` | Upstream removed a sample prototype but a lazy import lingers. Remove the `React.lazy` line and its registry entry. |
| `Cannot find module` in `registry-mine.ts` | A designer prototype was deleted but its entry remains. Remove the lazy import and entry. |
| `Cannot find module` in another barrel/index file | An export references a deleted file. Remove the broken export. |
| TypeScript error inside a designer prototype | Unrelated to the sync. Flag it but continue — the sync itself is fine. |

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

- Stash with `--include-untracked` before any branch switch or merge. After stashing, verify `git status --porcelain` is empty — if it isn't, the stash didn't capture everything; stop and surface what's still in the working tree before switching branches.
- If anything goes wrong (mid-merge state, leftover stash, divergent main, etc.), stop and explain in plain language — don't push through.
- On any conflict, tell the designer exactly which files are affected, what each side changed, and the exact commands to resume (`git merge --continue`, `git stash pop`, etc.). Never abandon a stash silently.
- Final report: confirm what branch they're on, what was pulled in, and that their work is intact.

---

## The non-negotiables

- The designer must end on the same branch they started on.
- WIP must be preserved end-to-end. If a stash is created, it must be popped (or surfaced as preserved with explicit recovery instructions if a conflict prevents the pop).
- `main` is the only branch that gets pushed to `origin` in this command. Never push a feature branch.
- If you're uncertain about the state of the repo at any point, stop and ask. Lost work costs the designer 20 minutes of debugging — a pause costs nothing.
