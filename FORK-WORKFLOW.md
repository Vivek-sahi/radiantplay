# Fork Workflow — Designer Guide

How to set up your fork, build prototypes, and stay in sync with the latest changes from the main repo.

---

## Overview

Each designer works on their own **fork** (personal copy) of the project. This keeps the main repo safe — no one can accidentally overwrite shared code. Changes flow back only through Pull Requests.

```
Main repo (galaxy: mohammed-faris/radiantplay)  ← source of truth
    ↑ Pull Requests (reviewed by maintainer)
    |
Your fork (galaxy: your-username/radiantplay)   ← your personal copy
    |
Your machine (local clone)                      ← where you build
```

**Galaxy** (`galaxy.corp.thoughtspot.com`) is the source of truth — not GitHub. Always fork and pull from Galaxy.

---

## Part 1 — First-time setup

### Step 1: Fork the repo on Galaxy

1. Go to `https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay`
2. Click **Fork** (top right)
3. You now have `galaxy.corp.thoughtspot.com/your-username/radiantplay`

### Step 2: Clone your fork

```bash
git clone https://galaxy.corp.thoughtspot.com/YOUR-USERNAME/radiantplay.git
cd radiantplay
```

### Step 3: Add the upstream remote

This connects your fork to the main repo so you can pull updates later:

```bash
git remote add upstream https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git
```

Verify the setup:

```bash
git remote -v
```

Expected output:

```
origin    https://galaxy.corp.thoughtspot.com/YOUR-USERNAME/radiantplay.git  (your fork)
upstream  https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git (main repo)
```

### Step 4: Install dependencies and run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. You should see Radiant Play.

---

## Part 2 — Building your prototype

### Create a new prototype

```bash
npm run new-prototype MyPrototypeName
```

This scaffolds `src/prototypes/MyPrototypeName/` and registers it in the gallery automatically.

Then open `src/prototypes/MyPrototypeName/index.tsx` in Cursor and describe what you want to build. The AI knows all Radiant components, tokens, and patterns.

### Save your work

```bash
git add .
git commit -m "feat: add my prototype"
git push origin main
```

This pushes to **your fork only** — the main repo is unaffected.

---

## Part 3 — Staying in sync with the main repo

The main repo gets updates regularly — new components, bug fixes, tooling improvements. Here is how to pull those in without losing your prototype work.

### First time only: get the sync skill

The `/sync-upstream` skill automates the entire sync process. If you forked before March 17, 2026 you may not have it yet. Run these two commands once to get it:

```bash
git fetch upstream
git checkout upstream/main -- .claude/commands/sync-upstream.md
```

This copies just the skill file from the main repo — no merge, no conflicts. You only need to do this once. From now on, `/sync-upstream` handles all future syncs for you.

> If you forked after March 17, 2026 the skill is already in your clone. Skip this.

---

### Syncing with the skill (recommended)

Open Claude Code in your project folder and run:

```
/sync-upstream
```

Claude will commit any unsaved work, fetch upstream, merge, move your prototype entries into `registry-mine.ts` if needed, verify the build, and push to your fork. Nothing else needed.

---

### Syncing manually (if you prefer)

### Why your prototype is safe

Your prototype lives in `src/prototypes/YourName/` — files you created from scratch. Git only conflicts on files that **both sides modified**. Since nobody on the main repo touches your prototype folder, it will never conflict.

The registry is split into two files to prevent conflicts:
- `registry-core.ts` — upstream-owned (sample prototypes). You never edit this.
- `registry-mine.ts` — **your file**. Your prototype entries go here. Upstream never touches it, so it never conflicts.

---

### Step-by-step sync

**Step 1: Make sure your local work is committed**

Before syncing, commit everything you have in progress. Do not sync with uncommitted changes.

```bash
git status
```

If you see modified files:

```bash
git add .
git commit -m "WIP: save progress before sync"
```

**Step 2: Fetch the latest from upstream**

```bash
git fetch upstream
```

This downloads the latest commits from the main repo but does not change your files yet.

**Step 3: Check how far behind you are** (optional but useful)

```bash
git log --oneline HEAD..upstream/main
```

This lists every commit on the main repo that you do not have yet.

**Step 4: Merge upstream into your branch**

```bash
git merge upstream/main
```

One of two things will happen:

- **Auto-merge succeeds** — git prints `Merge made by the 'ort' strategy` and you are done. Skip to Step 7.
- **Conflict** — git prints conflicts in registry files. Continue to Step 5.

---

### Step 5: Resolve the registry conflict

The project uses a **split registry** to prevent conflicts:
- `registry-core.ts` — upstream's sample prototypes (don't edit)
- `registry-mine.ts` — **your prototypes** (your file, upstream never touches it)
- `registry.ts` — merges both files (don't edit)

**If this is your first sync after the split** (your fork still has the old single `registry.ts`):

1. Accept upstream's version of `registry.ts` (the new merger file)
2. `registry-core.ts` and `registry-mine.ts` are new files — they appeared automatically
3. Move your prototype entries into `registry-mine.ts`:
   - Add your thumbnail imports and `React.lazy(...)` declarations
   - Add your entries to the `myRegistry` array with `section: 'mine'`
4. Or just tell Claude/Cursor to do it: *"Move my prototype entries from the old registry into registry-mine.ts"*

**On subsequent syncs:** No conflict. `registry-mine.ts` is never touched by upstream.

**Step 6: Mark the conflict as resolved and commit**

```bash
git add src/prototypes/registry.ts src/prototypes/registry-core.ts src/prototypes/registry-mine.ts
git commit
```

Git will pre-fill a merge commit message — just save and close the editor.

**Step 7: Push to your fork**

```bash
git push origin main
```

Your fork is now up to date and your prototype is intact.

---

### Quick sync reference

```bash
# 1. Commit your work first
git add . && git commit -m "WIP: save before sync"

# 2. Fetch and merge
git fetch upstream
git merge upstream/main

# 3. If conflict — move your entries to registry-mine.ts, then:
git add src/prototypes/registry*.ts && git commit

# 4. Push to your fork
git push origin main
```

---

## Part 4 — Contributing your prototype back

If you want your prototype to appear in the main repo:

1. Make sure your fork is synced (Part 3 above)
2. Push your latest changes: `git push origin main`
3. Go to your fork on Galaxy
4. Click **Contribute** → **Open pull request**
5. Set base repo to `mohammed-faris/radiantplay`, base branch to `staging`
6. Describe what you built and submit
7. The maintainer reviews and merges

---

## What you can and cannot do

| Action | Allowed? |
|--------|:--------:|
| Clone and run the project | Yes |
| Build prototypes in your fork | Yes |
| Push to your fork | Yes |
| Push directly to the main repo | No |
| Open Pull Requests to the main repo | Yes |
| Merge your own PRs | No — maintainer only |

---

## Quick reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Create a prototype | `npm run new-prototype Name` |
| Save changes | `git add . && git commit -m "message" && git push` |
| Sync with main repo | `/sync-upstream` (or manually: `git fetch upstream && git merge upstream/main`) |
| Check what you are missing | `git log --oneline HEAD..upstream/main` |
| Check remotes | `git remote -v` |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `git merge` shows conflicts in registry files | Move your entries to `registry-mine.ts` — see Step 5 above |
| My prototype disappeared after syncing | Check `registry-mine.ts` — your entry may have been lost during conflict resolution. Re-add it there. |
| `upstream` remote not found | Run `git remote add upstream https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay.git` |
| `npm install` fails | Verify Node.js 18+: `node --version` |
| AI in Cursor does not know Radiant components | Make sure you opened the `radiantplay` folder directly in Cursor, not a parent folder |
| Changes not showing in browser | Make sure `npm run dev` is still running in a terminal |

---

**Questions?** Reach out to the design systems team.
