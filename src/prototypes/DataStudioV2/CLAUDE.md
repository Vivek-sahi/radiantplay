# Data Studio — Claude Instructions

## Session protocol

**Every session, do this first:**
1. Read `src/prototypes/DataStudioV2/CONTEXT.md` — current build state, next up, session log.
2. Check current git branch (`git branch`) — always work on `prototype/data-studio`.
3. At the end of the session, append a new entry to the Session log in CONTEXT.md.

**Before closing any session:** run `npm run build` and confirm it passes.

**Session type — say this at the start:**
- **"next up"** → read CONTEXT.md → state the first open item + its classification (scale + novelty) out loud → then act based on that classification. Do not start building before stating the classification.
- **"sidequest: [name]"** → read `sidequests/[name].md`, work in Playground.tsx only, don't touch main prototype code
- **"research: [topic]"** → use `research/_template.md`, produce a research doc, write no code this session

---

## Task intake — classify before acting

Before starting any task, classify it on two dimensions. State the classification before proceeding.

**Novelty:**
- **Known** — extends or tweaks something already built in DataStudio
- **New** — first time DataStudio touches this problem area

**Scale:**
- **Small** — ≤ 2 files, no new component, no new interaction pattern
- **Medium** — new component, new interaction, or modifies an existing flow
- **Large** — new product area, new user journey, new IA, or first treatment of a capability

| | Known territory | New territory |
|---|---|---|
| **Small** | Build directly | Scan `knowledge/` and `research/` first |
| **Medium** | Check `research/` for prior decisions, then build | Write a research doc first (`research/_template.md`) |
| **Large** | Research + Playground explorations before committing | Full process: understand → research → IA → explore → converge → build |

**Signals — new territory:** first time a capability is touched (caching, monitoring, connections); changes where something lives in the UI; introduces a new user mental model.

**Signals — explore first:** multiple layout approaches are valid; interaction pattern not established. Use `Playground.tsx`, try 2–3 directions before choosing.

**When uncertain:** err toward more process.

**Research is self-triggering.** You don't need the user to say "research: [topic]" — if a task classifies as medium/large + new territory, propose research before building, regardless of how the session started. Say:

> "This is [scale] + new territory. I don't think we should build yet — I want to understand [X] first. Let me ask a few questions / start a research doc."

Then either ask pointed questions to fill `research/_template.md`, or start filling it with what's already known and mark the gaps. The user can redirect ("just build it") but the default is to pause.

---

## Knowledge base — read when relevant

- `knowledge/users.md` — who the primary user is, their workflow, the AHA moment
- `knowledge/platform.md` — ThoughtSpot current state, caching, Spotter failures, dbt integration
- `knowledge/patterns.md` — confirmed patterns, anti-patterns, open design questions
- `design-system.md` — Radiant component cheat sheet (use this before loading full rule files)
- `product.md` — what DataStudio is, the 6 situations, design principles
- `reference.md` — mock data schema, routing pipeline, ProjectState, key files, Figma keys

Read `reference.md` when touching `api/agent.ts`, `data/mockData.ts`, or the routing pipeline. Not needed for UI-only sessions.

---

## Rule files — skip for all DataStudio sessions

Never load: `liveboard-canvas-core.md`, `liveboard-canvas-edit.md`, `liveboard-canvas-advanced.md`, `liveboard-ia.md`, `liveboard-scaffolding.md`, `prototype-generation.md`, `prototype-structure.md`

Use `design-system.md` first. Escalate to full rule files only for patterns not covered there.

---

## Hard rules

- **Never restructure the routing pipeline** without asking — load-bearing, tuned across 34 sessions. See `reference.md`.
- **Never invent mock data** — all table and column names must come from `mockData.ts`. Schema in `reference.md`.
- **Never add prototype components to `src/components/`** — DataStudio components go in `src/prototypes/DataStudioV2/components/` only.
- **Always run `npm run build`** before marking a session complete.
- **WorkflowDirectory** is currently cosmetic. Do not wire it unless explicitly asked.
- **Manual paths** for all workflows are intentionally deferred — build agentic paths first.
