---
description: Share your work with Radiant Play the right way. Asks a few questions, works out where each piece belongs (Radiant, Spotter, shared prototype code or a sample prototype), splits it into PRs against staging or a shared team branch, runs the checks and writes the PR description. Asks before every commit and push.
---

The designer wants to send work back to Radiant Play (upstream: galaxy `mohammed-faris/radiantplay`). Your job is to get it there in a shape that other designers can use and that keeps every fork merging. Arguments, if any: `$ARGUMENTS` (a prototype name, a path, or a short description).

Many designers are not engineers. Ask in plain words, one round at a time, and explain each decision in a line.

---

## Step 1: Ask

Use AskUserQuestion. Skip a question when `$ARGUMENTS` or the code already answers it.

1. **What are you sharing?**
   - A prototype other designers can open and learn from
   - A change to a component that already exists (a Radiant or Spotter one)
   - A new component or pattern other prototypes should be able to use
   - A fix to rules, docs, commands or tooling
2. **Where is it now?** The prototype name or folder. Read `registry-mine.ts` and offer their prototypes as options.
3. **Who should use it?**
   - Only shown as a sample: people look at it, nobody imports from it
   - Any new prototype should be able to build with it
4. **How final is it?**
   - Final: matches Figma or the agreed spec
   - Still exploring
5. **Where should it go?**
   - `staging`: straight into Radiant Play (the default)
   - A shared team branch in a teammate's fork, for example Simran's `feat/agentic-ds`, where several designers build one set of components before its owner raises it against `staging`. Ask for the fork's URL and the branch name, then add the fork as a remote named after its owner (`git remote add simran <url>`) and fetch it. Nobody needs collaborator access: the PR goes from their own fork to the owner's. If the fetch fails, check the URL with them and stop.

The answer to 5 is the **base**: every PR below branches from `<base remote>/<base>` (`upstream/staging`, or for example `simran/feat/agentic-ds`) and targets that branch. On a shared team branch, also read its `CONTRIBUTING.md` (in the prototype or the branch root) if it has one, and follow its folder and catalog conventions where they don't conflict with the rules below.

If the answer to 4 is "Still exploring" and the base is `staging`, say that work in progress stays in their fork until it's final, offer to note what's left, and stop. Nothing upstream changes. On a shared team branch, work in progress is fine: carry on.

## Step 2: Look at the work

Read the files yourself before deciding anything. Compare the work against `<base remote>/<base>` (fetch first; see Remotes below). Find:

- **Copies of shared code.** Files in the prototype with the same name or near-identical contents as files in `src/components/` or `src/spotter/` (compare with `cmp` and `diff`). List each as same, changed (with the size of the change) or new.
- **Edits to shared code made in place.** Changes under `src/components/`, `src/spotter/`, `src/tokens/`, `src/styles/` or `src/prototypes/_shared/`.
- **Registry edits.** Any change to `registry-mine.ts`, `registry-core.ts` or `registry.ts`.
- **Imports across prototypes.** A prototype importing from another prototype's folder.
- **Compliance.** `npm run scan:dark -- <paths>`, plus `npm run lint:tokens` when shared folders are touched. Also look for raw `<button>`, `<input>`, `<select>` and `<table>` where a Radiant component exists.
- **Who uses what it changes.** For every shared file that changes, grep `src/` for its importers and list the prototypes that use it.

## Step 3: Decide where each piece goes

Sort every piece of the work into one place:

| The piece is | It goes to |
|---|---|
| A product-agnostic UI building block (input, menu, card, layout) | `src/components/` (Radiant). Read `.cursor/rules/design-system.md`, `component-inventory.md`, `token-usage.md`, `content-guidelines.md` first. |
| An agentic or AI pattern (chat, reasoning, answers, viz, Spotter page shell) | `src/spotter/` (Spotter DS). Read the Spotter rules named in `.cursor/rules/_orchestration.md`. |
| A change to an existing Radiant or Spotter component | That component's own file, edited in place. Never a copy. |
| Helpers or data that several prototypes share but that aren't design system | `src/prototypes/_shared/` |
| A whole prototype shown as a sample, or a catalog or showcase of components | The prototype folder, registered in `registry-core.ts`. It imports shared pieces from `@components/*` and `@spotter/*`. It keeps no copies. |
| Rules, docs, commands, tooling | Their own files, in a PR of their own |
| Something only this prototype needs | It stays in the prototype's own `components/` folder |

Rules that always hold:

- **Never add or change entries in `registry-mine.ts` upstream.** Every fork edits that file, so an upstream entry gives every designer a merge conflict. A sample goes in `registry-core.ts`, and the designer's own fork keeps its `registry-mine.ts` entry until the sample lands.
- **One shared component, one home.** If the work holds a changed copy of a shared component, the change goes into the real file and the copy is dropped.
- **If the "new" component is close to one that exists, extend the existing one** with a prop or variant. Say which one and why.
- Answer 3 "only shown as a sample" with nothing in the shared folders: one PR, just the prototype.

## Step 4: Show the plan

Show the plan before touching git, in this shape:

```
Here's how I'd raise it

PR 1  <title>               branch feat/<name>
      Goes to: src/spotter/chat/
      What: <one line per change>
      Affects: <prototypes that use these files>

PR 2  ...

Stays in your fork: <anything not going upstream, and why>
Needs your call: <anything only the designer can judge, for example which of
several changed files are final>
```

Order the PRs so each one builds on merged work: changes to existing shared components first, then new shared components, then the prototype that uses them, then docs. A PR must build on its own on top of the ones before it.

Ask: "Raise these PRs? (yes / change something / no)". Stop on no.

## Step 5: Build each PR

Do the PRs one at a time, in order.

1. **Keep their work safe.** Don't switch the designer's branch. Build each PR in a separate worktree:
   ```
   git worktree add ../radiantplay-contribute-<name> -b feat/<name> <base remote>/<base>
   ```
   Link `node_modules` from the main checkout. If a worktree can't be made, stash with `--include-untracked`, check `git status --porcelain` is empty, and restore the stash at the end.
2. **Bring over only this PR's files.** Copy them in, or `git checkout <their-branch> -- <paths>`. When a PR updates an existing shared file, apply their version of it and read the diff with the designer if it's large.
3. **Fix what moved.** Point imports at `@components/*`, `@spotter/*` or `@/prototypes/_shared/*`. Export new components from their folder's `index.ts`. Remove the prototype's copies.
4. **Fix what the checks found** in the files this PR adds or changes: tokens instead of hex and magic numbers, Radiant components instead of raw HTML, sentence case. A new shared component also needs forwardRef, focus styles and keyboard support (`.cursor/rules/design-system.md`).
5. **Sample prototypes** get a `registry-core.ts` entry with `theme: 'global'` and `look: 'radiant-3'` once the dark check passes, plus a thumbnail (`.claude/skills/rp-prototype-thumbnails/SKILL.md`).
6. **Leave `docs/CHANGELOG.md` and `src/data/versionHistory.ts` alone.** The maintainer sets the version when merging into `staging`.

## Step 6: Check

In the PR's worktree:

```
npm run typecheck
npm run build
npm run scan:dark -- <changed paths>
```

Add `npm run lint:tokens` when the PR touches `src/components/`, `src/spotter/` or `src/prototypes/_shared/`.

Then run the dev server and open every prototype in the PR's "Affects" list, in light and dark. Look for errors in the console and anything that looks different from before. For a sample prototype, also run `/rp-radiant-check <Name>`.

Fix anything that fails, or stop and explain it. Never raise a PR that fails typecheck or build.

## Step 7: Commit, push, open the PR

Ask before each commit and each push.

- Commit on the PR branch with a message like `feat(spotter): add ClarifyingQuestion` and a short body saying what and why.
- Push the branch to the designer's own fork: `git push origin feat/<name>`. Never push to `upstream`, never to `main`. For a shared team branch it's the same: push to their own fork, never to the owner's.
- Write the PR description to a file in the worktree and show it:
  ```
  ## What
  <one line per change>

  ## Why
  <the problem or the Figma / spec link>

  ## Where it lives
  <shared folders touched, or "prototype only">

  ## Affects
  <prototypes that use the changed files, and that each was opened and checked>

  ## Checks
  typecheck, build, dark scan (and lint:tokens) pass

  ## Order
  <"Merge after #<n>" when it depends on an earlier PR>

  ## Screenshots
  <light and dark>
  ```
- Give the link to open the PR, with the base as its target:
  `https://galaxy.corp.thoughtspot.com/mohammed-faris/radiantplay/compare/staging...<their-username>:feat/<name>`
  Their username is the owner in `git remote get-url origin`. For a shared team branch, the PR goes to the owner's fork instead: `https://galaxy.corp.thoughtspot.com/<owner>/radiantplay/compare/<base>...<their-username>:feat/<name>`.

## Raising a shared team branch against staging

When the owner of a shared team branch (like Simran's `feat/agentic-ds`) is ready to send the whole set to `staging`, run this command with `staging` as the base and the team branch as the work. Step 2 then reads the whole branch. Merge `upstream/staging` into the team branch first (never the other way round) and fix conflicts there, so the PR to `staging` merges cleanly. Name the contributors in the PR description.

## Step 8: Wrap up

Say which PRs are raised and in what order they should merge, and what stays in their fork. Remove each worktree once its PR is pushed (`git worktree remove`), and restore any stash. The designer ends on the branch they started on, with their work as it was.

---

## Remotes

- Designer forks: `origin` is their fork, `upstream` is galaxy `mohammed-faris/radiantplay`. If `upstream` is missing, add it as in `.claude/commands/sync-upstream.md` Rule 4.
- On the maintainer's machine (`origin`, `galaxy` and `public` all exist), use `galaxy` wherever this says `upstream`, push the branch only when asked, and never push to `public`.

## Never

- Never open a PR against `main`. Everything goes through `staging`, directly or through a shared team branch.
- Never push to a shared team branch directly, even as a collaborator. Changes reach it through a PR its owner reviews.
- Never add entries to `registry-mine.ts` upstream.
- Never leave a copy of a shared component in a prototype.
- Never commit or push without a yes for that step.
- Never lose the designer's work: same branch at the end, stash restored.
