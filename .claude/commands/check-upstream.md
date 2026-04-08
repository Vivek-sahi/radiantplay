Check what has changed in the upstream Radiant Play repository since your last sync. Shows new components, updated patterns, removals, and a preview of what will change if you run /sync-upstream. Read-only — nothing is merged.

## Instructions

Follow these steps in order.

---

### 1. Verify upstream remote

Run `git remote -v`.

- If `upstream` is listed — proceed to step 2.
- If missing — add it using HTTPS first, fall back to SSH if fetch fails:
  ```
  git remote add upstream https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git
  git fetch upstream
  ```
  If fetch fails with a 403 or authentication error, switch to SSH:
  ```
  git remote set-url upstream git@galaxy.corp.thoughtspot.com:mohammed-faris/radiantplay.git
  git fetch upstream
  ```

---

### 2. Fetch upstream (read-only)

```
git fetch upstream
```

This updates the local reference to upstream/main without touching your branch.

---

### 3. Check how far behind

```
git log --oneline HEAD..upstream/main
```

- If empty — print "You are up to date with upstream. Nothing to sync." and stop.
- If there are commits — count them and continue.

---

### 4. Analyse what changed in upstream

For each commit in `HEAD..upstream/main`, categorise the changes:

Run:
```
git diff HEAD upstream/main --stat
```

Then read the actual diff for meaningful files:
```
git diff HEAD upstream/main -- src/components/
git diff HEAD upstream/main -- src/prototypes/registry-core.ts
git diff HEAD upstream/main -- src/tokens/
git diff HEAD upstream/main -- .cursor/rules/
git diff HEAD upstream/main -- docs/
```

From this, identify:

**New components** — files added under `src/components/` that don't exist in your current branch
**Updated components** — files modified under `src/components/`
**Removed components** — files deleted from `src/components/`
**Token changes** — any additions or changes in `src/tokens/`
**New sample prototypes** — new entries in `registry-core.ts` on upstream
**Removed sample prototypes** — entries removed from `registry-core.ts` on upstream
**Rule/doc updates** — changes to `.cursor/rules/` or `docs/`

---

### 5. Check for conflicts with your work

Detect the designer's modified files using multiple methods (works whether they are on `main` or a `prototype/<slug>` branch):

```
git diff --name-only HEAD
git diff --name-only --cached
```

If on a `prototype/<slug>` branch, also check:
```
git diff --name-only main...HEAD
```

Combine all results into a single list of the designer's modified files.

Then check if any of those files overlap with files changed in upstream (from step 4's `--stat` output):

- **registry-core.ts** overlaps → flag as **"Expected — upstream sample prototypes updated, auto-resolved by /sync-upstream"**
- **registry-mine.ts** overlaps → flag as **"Unexpected — upstream should not touch this file. Review manually."**
- **Any other file** overlaps → flag as **"Potential conflict — review before syncing"** with details on what both sides changed
- **No overlaps** → flag as **"Safe — no overlap with your prototype files"**

---

### 6. Output the report

Print in this format:

```
Upstream Check — <today's date>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATUS
  You are X commits behind upstream.
  Last synced: <date of last merge commit from upstream, or "unknown">

──────────────────────────────
WHAT'S NEW IN THE LIBRARY
──────────────────────────────

  New components (X):
    + <ComponentName>   — <one-line description of what it does>
    + <ComponentName>   — <one-line description>

  Updated components (X):
    ~ <ComponentName>   — <brief summary of what changed, e.g. "new variant added", "prop renamed">

  Removed components (X):
    - <ComponentName>   — removed from the design system

  Token changes (X):
    ~ <token file>      — <brief summary, e.g. "new spacing values added", "color alias updated">

  New sample prototypes (X):
    + <PrototypeName>   — <description>

  Removed sample prototypes (X):
    - <PrototypeName>

  Rule / doc updates:
    ~ <brief summary of any Cursor rule or doc changes that affect how Claude builds prototypes>

──────────────────────────────
IMPACT ON YOUR PROTOTYPE
──────────────────────────────

  If you sync, here is what changes for you:

  ✓ Safe — no overlap with your prototype files
    (or list specific files that are unaffected)

  ⚠ Review before syncing:
    • <file> — you modified this, upstream also changed it
      Upstream change: <what changed>
      Your change: <what you changed>
      Suggestion: <how to reconcile, e.g. "keep both, take upstream's new prop, reapply your logic">

  ↻ Auto-resolved by /sync-upstream:
    • registry-core.ts — upstream added/updated sample entries; your prototypes in registry-mine.ts are unaffected

──────────────────────────────
RECOMMENDATION
──────────────────────────────

  <One of the following, based on the analysis:>

  Safe to sync — run /sync-upstream whenever ready.
  No breaking changes affect your prototype.

  OR

  Good time to sync — X new components are available that could improve your prototype:
    • <ComponentName> could replace your custom <CustomComponent>
    • <ComponentName> is relevant to the <flow> you are building

  OR

  Sync with care — review the conflicts above before running /sync-upstream.
  Suggested order: resolve <file> manually first, then run /sync-upstream.

──────────────────────────────
  To apply these changes: /sync-upstream
```

---

If there are no changes at all:

```
Upstream Check — <today's date>

You are up to date with upstream. No changes to pull in.
Your library and sample prototypes are current.
```
