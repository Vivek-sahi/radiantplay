# Data Studio - MVP — Claude instructions

## Session protocol

**Read these four, in order. That is the whole session start:**

1. **`FOUNDATION.md`** — how to think about this product. What a model is, how data teams work, the
   agent/human line, the correctness posture, the design principles. **Read it first — the other
   three assume it.**
2. **`CONTEXT.md`** — what exists right now.
3. **`PRD.md`** — the journey, then every feature as the user meets it, with expected behaviour and
   status. **This doubles as the test plan.**
4. **`DESIGN.md`** — what's in flight: ownership, build queue, architecture decisions, traps.

Then: check git branch (always `prototype/data-studio` — ask before proceeding if not) and
`feedback/inbox.jsonl` for pending items.

**Look up as needed, not at session start:** `reference.md` (mock data schema, key files) and
`design-system.md` (Radiant cheat sheet).

**Design notes are notes.** When Vivek shares notes, open questions, or thinking-out-loud, that is
not a build queue. Ask before writing code.

---

## What this prototype is, and what `DataStudioV2` is

This is **the MVP journey, as one experience.** Extracted from `DataStudioV2` on 2026-08-17.

`DataStudioV2` still exists and still runs, holding four cuts — Vision, POC, POC V2 and Demo. It is
the reference for everything out of scope here: canvas caching, multi-source, Python/SQL, Clean, AI
readiness, and the Demo run-of-show that is the north star.

⚠️ **Don't port something back from it without asking.** Most of what isn't here was left out
deliberately.

⚠️ **`DataStudioV2` must stay in `registry-mine.ts`.** Removing it has broken the Vercel deploy
before.

---

## End of session

1. Update `PRD.md` if a requirement or status changed.
2. Update `DESIGN.md` — queue, anything reversed.
3. Update `CONTEXT.md` in place — state only, no history, no changelog.
4. Append **one paragraph** to `SESSION_LOG.md`.
5. Run `npm run typecheck` **and** `npm run build`.

⚠️ **Never record build state in `PRD.md`'s prose or in a spec.** Status lives in the status column
and in `DESIGN.md`. Mixing "what we decided" with "what is built" is how a reversal survives in three
documents — it already happened once, with the per-table cache badge.

---

## Keep the working set at 8 files

`FOUNDATION.md` · `CLAUDE.md` · `CONTEXT.md` · `PRD.md` · `DESIGN.md` · `SESSION_LOG.md` ·
`reference.md` · `design-system.md`.

**Do not add a ninth.** `DataStudioV2` held 94 markdown files on 2026-08-13 and the cost was real:
nobody knew which were current, and stale ones were read as authoritative. A new document is almost
always a section in one of the above. If something genuinely needs its own file, say so and ask
first.

**Vivek is the architect and makes the decisions.** Don't fill a gap by inference; if something is
unanswered, ask again. **And discuss before coding** — when a topic is under discussion, propose and
agree before changing anything.

---

## Task intake — classify before acting

State the classification before proceeding.

**Novelty:** *Known* (extends something built) · *New* (first time we touch this problem area).
**Scale:** *Small* (≤2 files, no new component or interaction) · *Medium* (new component,
interaction, or modifies a flow) · *Large* (new product area, journey, or IA).

| | Known | New |
|---|---|---|
| **Small** | Build directly | Check `PRD.md` and `DESIGN.md` first |
| **Medium** | Check `DESIGN.md` for prior decisions, then build | Propose a spec before building |
| **Large** | Explore before committing | Understand → spec → explore → converge → build |

**When uncertain, err toward more process.** If a task is medium/large + new territory, propose
writing it down before building — you don't need to be asked. Vivek can redirect ("just build it"),
but the default is to pause.

---

## This is a stakeholder prototype, not a product

It exists to make design decisions reviewable, not to execute SQL. **"Not built" is the normal state
of anything outside a demoed path.** Before flagging a gap, triage it:

| Tier | Test | Do |
|---|---|---|
| **1 — it lies** | Produces a plausible **wrong answer** in a path we walk, so it misleads our own design conversation | Fix, or make it visibly inert |
| **2 — inert but clickable** | Reachable, does nothing when used | Hide it, or route around |
| **3 — off the path** | Nobody goes there | Note and move on. Not work |

**Don't grade the prototype as shipping software.** A control the real product has and we stub is
fine; it matters only if someone clicks it on stage.

---

## Verification

- **Run `npm run typecheck`, not just `npm run build`.** Vite doesn't typecheck, so a scripted edit
  can introduce an undefined identifier — a clean build and a blank screen at runtime.
- **The baseline is 128 type errors, all inherited from `DataStudioV2`. Do not add to it.**
- **Running it beats compiling it.** Three of five bugs in the last walkthrough were invisible to
  both `tsc` and the build, and all were code wired to a component or state that isn't in play. See
  the traps table in `DESIGN.md`.
- **Don't claim visual fidelity from Playwright.** Verify with typecheck and build, and let Vivek
  look.

---

## Git

- **Always `prototype/data-studio`** on `origin` (`vivek-sahi/radiantplay` on galaxy).
- `main` on the fork is an occasional sync of Faris's upstream — unrelated. Never work on it, and
  never flag the mismatch as a problem.
- **Push to `origin` only** — never `upstream`.
- Komal's work arrives on her own branch, against `DataStudioV2`'s files; review and merge into this
  prototype when she is done.
- Deploy with `vercel --prod --yes` after pushing — don't stop at the push.
- New file additions need a dev server restart; HMR won't pick up brand-new imports.

---

## Hard rules

- **Never invent mock data** — names come from `mockData.ts`.
- **Never add prototype components to `src/components/`** — that's the design system.
- **Never remove `DataStudioV2` or `DataStudioMVP` from `registry-mine.ts`.**
- Manual workflow paths are deferred — agentic paths first.
