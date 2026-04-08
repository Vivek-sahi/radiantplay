Sync this fork with the latest changes from the upstream main repo (galaxy: mohammed-faris/radiantplay).

## Instructions

Follow these steps in order. Stop immediately if any step fails and explain what went wrong.

---

### 1. Save in-progress work

Run `git status`.

- If the working tree is clean — proceed to step 2.
- If there are modified or untracked files — auto-stash them:
  ```
  git stash push -m "radiant-sync-wip"
  ```
  Print: **"Saved your in-progress work. It will be restored after the sync."**

Do NOT ask the designer about stashes or require any git knowledge. This is handled automatically.

Remember whether a stash was created — you will need to restore it at the end (step 9).

---

### 2. Check upstream remote

Run `git remote -v`.

- If `upstream` is listed — proceed to step 3.
- If `upstream` is missing — add it using HTTPS first, fall back to SSH if fetch fails:
  ```
  git remote add upstream https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git
  ```
  Run `git fetch upstream`. If it fails with a 403 or authentication error, switch to SSH:
  ```
  git remote set-url upstream git@galaxy.corp.thoughtspot.com:mohammed-faris/radiantplay.git
  ```

---

### 3. Fetch upstream

```
git fetch upstream
```

---

### 4. Show what is coming

Run:
```
git log --oneline HEAD..upstream/main
```

Print the result to the user with a brief summary:
- How many commits behind they are
- One-line summary of the most significant changes (new components, deleted files, etc.)

If the output is empty, print:
```
Already up to date with upstream. Nothing to merge.
```
If a stash was created in step 1, restore it now: `git stash pop`
Then stop — there is nothing to do.

---

### 5. Merge upstream

```
git merge upstream/main
```

Two outcomes:

**A — Clean merge (no conflicts)**
Git prints `Merge made by the 'ort' strategy`. Proceed directly to step 7.

**B — Conflict**
Git may print conflicts in `registry.ts` or `registry-core.ts`. This is expected — proceed to step 6.

If the conflict is in any file OTHER than registry files (`registry.ts`, `registry-core.ts`, `registry-mine.ts`), stop and explain what conflicted and why before attempting to resolve it.

---

### 6. Resolve the registry conflict

The project uses a split registry:
- `registry-core.ts` — upstream-owned sample prototypes (do not add designer entries here)
- `registry-mine.ts` — designer-owned prototypes (this is the designer's file)
- `registry.ts` — thin merger that combines both (do not edit directly)

**If this is the first sync after the registry split** (designer's fork still has the old single `registry.ts`):

1. Read the conflicted `registry.ts` and identify the designer's own prototype entries (any entries NOT in `registry-core.ts`)
2. Accept upstream's version of `registry.ts` entirely (the thin merger)
3. `registry-core.ts` and `registry-mine.ts` are new files from upstream — they will have appeared cleanly
4. Open `registry-mine.ts` and add the designer's entries there:
   - Add their `import React from 'react';` at the top if not present
   - Add their thumbnail imports
   - Add their `React.lazy(() => import(...))` declarations
   - Add their entries to the `myRegistry` array, each with `section: 'mine'`
5. Ensure `registry-mine.ts` imports `ProjectMeta` from `'./registry-core'`

**If the designer already has the split structure** (subsequent syncs):

Conflicts should only happen in `registry-core.ts` (upstream added/changed sample entries). Accept upstream's version. `registry-mine.ts` should never conflict since upstream does not touch it.

After resolving:
```
git add src/prototypes/registry.ts src/prototypes/registry-core.ts src/prototypes/registry-mine.ts
git commit
```

Accept the default merge commit message (do not modify it).

---

### 7. Verify the build

```
npm run build
```

- If it succeeds — proceed to step 8.
- If it fails — read the error output carefully.

**Common post-merge build errors and fixes:**

| Error pattern | Fix |
|---|---|
| `Cannot find module './<Name>'` in registry-core.ts or registry-mine.ts | A prototype was removed upstream but the lazy import still references it. Remove the `const <Name> = React.lazy(...)` line and its registry entry from the appropriate file. |
| `Cannot find module` in an index or barrel file | An export references a deleted file. Remove the broken export line. |
| TypeScript error in designer's own prototype files | This is unrelated to the sync — flag it to the designer and proceed with the push anyway. |

After fixing, re-run `npm run build` to confirm it passes before continuing.

---

### 8. Push to fork

Push the synced state to the designer's remote:

```
git push origin main
```

This is a mandatory step — the sync is not complete until the remote fork is updated.

---

### 9. Restore in-progress work

If a stash was created in step 1, restore it now:

```
git stash pop
```

- If the pop succeeds cleanly — proceed to the report.
- If there are conflicts — tell the designer which files conflicted and help resolve them. These are conflicts between their in-progress work and the upstream changes.

If no stash was created in step 1, skip this step.

---

### 10. Report

Print a summary in this format:

```
Synced with upstream!

Pulled in X commits:
  • <one-line summary of most important changes>
  • <one-line summary>
  ...

Your prototype: intact — src/prototypes/<name>/ was not touched.
Registry: your entries are in registry-mine.ts (yours, never conflicts with upstream).

Your fork is now up to date.
```

If there was nothing to sync:
```
Already up to date — no changes from upstream.
```
