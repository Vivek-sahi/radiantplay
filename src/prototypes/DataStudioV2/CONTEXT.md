# Data Studio — Canvas State

_Current state of the Data Studio V2 prototype. For session history see `SESSION_LOG.md`. For active work items see `NEXT_UP.md`._

---

## What it is

Data Studio is a no-code visual canvas for building AI-ready data models. The primary user is a data engineer or analyst who joins, cleans, and semantically describes data for ThoughtSpot's Spotter AI. The prototype lives at `src/prototypes/DataStudioV2/`.

---

## The demo build

The run-of-show (`demo/2026-07-29-run-of-show.html`) is the spec — 5:00, six beats,
states S1–S20, Maya Chen / renewal-risk scenario. **The demo runs on Vision**, because
POC has neither CSV upload nor Python, which S5 and S10–S11 need.

**Reading the script:** *Type* = the stakeholder's five typed inputs. *Say* = spoken
narration, never rendered. *On screen* = what we build, **including the agent's quoted
wording** — that isn't ours to paraphrase. Distinguish text from components: the S2
connection list is a component (`agentic/ConnectionList`), not prose in a message.

**Beats 2, 3 and 5 run end to end.** S13/S14 work; S6 now works (caching runs as an
in-thread form); S1 and S19/S20 don't. See `NEXT_UP.md`.

**The script fires only in the Demo cut** (`variant === 'demo'`, threaded to `AgentPanel`
as `demo`). S2, S3, S4, S6 and S8–S12 are all gated, so Vision's canvas agent is
unscripted again: "renewal risk" is just words there, and accepting tables adds tables.

| Piece | Where |
|---|---|
| Agentic vocabulary, ported | `components/agentic/` |
| Agent→canvas seam | `agentAddTables` / `agentAddJoins` / `agentAddPythonSource` in `ModelCanvas` |
| Demo conversation | `handleCanvasAgentInput` in `AgentPanel`, plus `DEMO_*` consts |
| Readiness pillars + findings | `data/readiness.ts` |
| Renewal-risk tables | `TABLE_COLS` / `MOCK_DATA` in `ModelCanvas` |
| Spreadsheet toolbar icons | `components/icons/SpreadsheetIcons.tsx` (exported, unwired) |

**Ported from `surajboro-ts/spotter-readiness-vision`** on a patterns-not-product-decisions
filter — take the cards and the data, keep our canvas, rebuild anything that reaches into a
canvas. His fix-pipeline UI finds rows via CSS classes his canvas stamps; ours needed
`data-model-col` adding, since React `key` never reaches the DOM.

**Agent-added objects are ordinary canvas objects.** `agentAddTables` wraps the existing
`addToCanvas`, so an agent-added card is indistinguishable from a hand-added one. Batch
adds pass `{ select: false }` so several tables landing don't steal selection or force the
preview open.

---

## Three cuts — Vision, POC and Demo

The prototype ships **three experiences from one codebase**, selected at runtime:

- **Vision** — the full vision-level experience. The default.
- **POC** — a scoped-down cut (Komal's, merged 2026-07-28) for what's buildable now.
- **Demo** — the stakeholder cut for the sales kickoff, added 2026-07-31. Vision plus
  selected POC cleanups, and **the only cut where the run-of-show script fires.**

`variant.tsx` owns this: a `VariantProvider` + `useVariant()` context resolving from
`?v=` URL param → `localStorage` → `vision`. A `VariantToggle` segmented control sits
in the header, and the choice is reflected back into the URL so each cut is shareable
and reload-safe.

**Gating has two layers, and the distinction matters:**

1. **`poc` boolean prop** — the original, threaded into `ModelCanvas`, `AgentPanel`,
   `Overview`. Untouched by the Demo work; ~25 checks still read it. `poc` is true for
   the POC cut only.
2. **`Scope` object** (`useVariant().scope`) — one typed field per thing the cuts
   actually differ on. A boolean can only say *which cut am I*, which is useless once
   Demo needs some things from POC and the rest from Vision. `DEMO_SCOPE` spreads
   `VISION_SCOPE` before its overrides, so **Demo can only differ where a pick is
   written down** — it cannot drift from Vision by accident.

Move a check from layer 1 to layer 2 only when Demo needs it to differ. The cost is
then per pick, not a rewrite of every gate. There is no forked component tree; do not
create one.

**Demo's picks from POC** (reviewed pick by pick with Vivek, 2026-07-31): model-level
preview · no Columns tab (Canvas · Spreadsheet only) · no browser category tabs ·
the Databricks connection naming, in the tree *and* the filter list · Spreadsheet
opening clears selection and panels · no full-screen toggle · no home setup entry
points · no AgentDB connection · multi-select join flow · bordered connection pill ·
`@` table mention.

**Demo stays as Vision on:** data-browser tree rows, the browser Add button, the
connection filter, both collapse treatments, Clean + Code in the node menu, and free
cross-connection adds (the script runs its own caching beat).

⚠️ **AI readiness is held.** Komal is building a new version; the chip stays and what
happens on click arrives with her merge. Nothing there gets wired or extracted until
then — including moving the readiness surfaces into their own folder, which is the
right refactor but wrong while she's mid-flight.

Two props were renamed while wiring Demo, because a flag named for POC that Demo also
switches on is a trap: `ConnectionPill.poc` → `bordered`, `PromptBar.pocTools` →
`tableTools`.

**POC scope:** single-category data browser (connections only, no tabs, multi-connection,
cross-connection adds require caching first) · hamburger node menu (Join/Filter/Formula/
Delete; no Clean/Code) · "Spotter readiness" instead of "AI readiness", with a Check-for
tests panel · canvas multi-node pick → chips in the composer → "join these tables" →
reasoning → join recommendation card · bordered connection pill + `@` table mention on
the home prompt bar · 44px collapsed data-browser rail with a header toggle.

**Vision-specific behaviour** (restored behind `!poc` during the merge): data-browser
tree rows show the hover info + add pair; the data browser collapses to 0 width with the
control moving up to the topbar database icon.

⚠️ Not all of her work was gated — see `2026-07-28-poc-vision-gating-review.md` and
`NEXT_UP.md`. 71 regions in `ModelCanvas.tsx` still need classifying as both/gate/n/a.
Assume Vision may differ from its pre-merge behaviour in unreviewed places; the
pre-merge state is tagged `pre-komal-merge-2026-07-28`.

**Also arrived with her canvas work:** `SpotterXShell`, `TestView` (dormant —
`showTestTab` defaults false), `EvalView`, `MRDReview`, `TestFixCard`, and a unified
`renderColumnsTable` that replaced the two bespoke semantic preview tables with one
richer shared table (adds Description / AI context / Synonyms / Indexed).

---

## Main views

`index.tsx` routes between these views via `Shell.tsx`:

| View | Component | Status |
|------|-----------|--------|
| Overview | `Overview.tsx` | ✅ Active — landing, model cards, Pulse insights |
| Model canvas | `ModelCanvas.tsx` | ✅ Active — the primary build surface |
| Models page | `ModelsPage.tsx` | ✅ Active — published models list |
| Workspace | `Workspace.tsx` | ✅ Active — older notebook-based flow |
| Chat / multi-source | `ChatView.tsx` | ✅ Active — agentic multi-source flow |
| Connections | `ConnectionsPage.tsx` | ✅ Active |
| Data browser | `DataBrowserPage.tsx` | ✅ Active |

---

## ModelCanvas architecture

`ModelCanvas.tsx` (~4,900 lines) owns the entire canvas experience. Layout (left → right):

```
GlobalHeader (top bar — logo, search, user)
├── AgentPanel       Left column — agent chat + PromptBar.tsx
├── Data browser     Collapsible — warehouse tree; Add data button in header
│   └── Tabs: Warehouse | Connections
├── Canvas viewport  Dot-grid; floating op toolbar (top-center); undo/zoom (bottom-right)
│   └── BlockNode / CanvasNodeCard — data source cards with inline chip pipeline
│   └── Join edges — drag-to-connect between cards
├── Properties panel Docked right — step config (join, filter, formula, SQL, Python, metadata)
└── Spreadsheet      Bottom — SpreadsheetGrid + SpreadsheetToolbar (Spreadsheet.tsx)
    └── Preview header: table/scope dropdown · Data|Semantic · Limit · Expand
```

**Topbar** (inside ModelCanvas, above browser+canvas): model name (display) · data-mode pill · view switcher (Canvas / Columns / Spreadsheet / Test) · AI readiness pill · Draft saved · Publish.

**Join rendering and layout** (rewritten 2026-07-31). One orthogonal path per join —
out of the left card, one vertical run in the column gutter, into the right card —
computed once in `joinGeometry` and shared by the line layer and the badge layer, so a
badge always sits on its own line. Before this each join drew *two* curves converging on
a floating badge, which made five joins into one hub unreadable. Joins sharing a gutter
get their own channel; joins leaving one card exit at different heights.

`arrangeCanvas` lays cards out left-to-right by join distance from the most-connected
table, centring each column vertically. A join whose two ends land in the same column
pushes one end onward, so **no line passes behind a card by construction**. It runs
automatically only for agent-committed joins — hand-placed cards are never moved — and
the **Tidy up** button (bottom-right, by undo/zoom) re-runs it on demand. That split is
the convention canvas tools follow.

Our join badge and `1:M` / `M:1` labels are unchanged. No crow's-foot notation, and no
column lists inside cards — the ERD references were shape inspiration only.

---

## Concept model (locked)

- **Add data** = ingestion. Always creates an independent source card. Lives in the data browser header (Upload file · SQL · Python).
- **Table-level transforms** = chips inline on the card (Filter · Formula · Clean · Sort). Never standalone nodes.
- **Join** = drag-to-connect edge between cards. Not a toolbar button.
- **SQL / Python** = dual-homed: as a source (via Add data → independent card) or as a transform chip (via card `+` menu).
- **Caching**: CSV upload and Python source always require caching. SQL stays live. Prep transforms cache the model.
- **Canvas modes**: `dataset` (Option 1 — chips inline), `blocks` (Option 2 — every action is a node), `dataset2` (Option 3 — current default; no op toolbar, Add data in browser).

---

## What's built

| Area | Status |
|------|--------|
| Overview — landing + hero prompt + model cards + Pulse insight cards | ✅ |
| Chat (from scratch) — clarify → plan → build → auto-transition to Workspace | ✅ |
| Workspace — agent + columns/tables/preview/notebook + drag resize | ✅ |
| Notebook — Phase 1: cell states, output panels, Run all, per-cell run, pre-failed cell, Edit and retry | ✅ |
| Test mode — inline Spotter Q&A + coaching flow | ✅ |
| Data quality — DQ chip, quality plan, prep transforms, Transformations section in LeftPanel | ✅ |
| AI readiness (AIRS) — chip, panel, score, action items | ✅ |
| Cache — configure + enable from model tab bar | ✅ |
| Model view — Info / Cache / Monitoring tabs | ✅ |
| Pulse monitoring — 6 flows wired; object-click → read-only artifact in FullChatView | ✅ |
| Data browser — warehouse explorer + dbt import wizard | ✅ |
| Connections — management + New Connection workflow + agentic Snowflake connect | ✅ |
| dbt import — full flow with broken/degraded column indicators + fix scripts | ✅ |
| Multi-source model flow — scan → Pendo notebook → CSV → staging → build | ✅ |
| Canvas — dataset mode (Option 1): chip pipeline, join edges, drag-to-connect | ✅ |
| Canvas — block mode (Option 2): every action a node, wired edges | ✅ |
| Canvas — dataset2 mode (Option 3): current default; Add data in browser header | ✅ |
| Spreadsheet preview — SpreadsheetGrid, column menu, toolbar, skeleton | ✅ |
| Python / SQL blocks — code editor, syntax highlighting, run, Fix-with-AI | ✅ |
| Publish flow — status modal → Draft→Published pill → Models page | ✅ |
| AI readiness tuning — rate correct/incorrect/OOS → Generate fixes → Spotter ready | ✅ |
| AgentDB connection — appears in warehouse browser under `cached` schema | ✅ |
| Test tab — placeholder in view switcher | ✅ (placeholder) |
| Dropdown menus — `AnchoredMenu` helper (portal + fixed + auto-flip + viewport clamp); used by data-mode, AIRS, browser Add-data, block `+` menu, spreadsheet toolbar prep; column ▾ menu self-clamps | ✅ |
| Join preview gating — placeholder until Apply; merged data only after join is created | ✅ |
| Preview output-pane header — always shows table name; step label appended as secondary (`table · Filter`) | ✅ |
| SQL derived tables — SQL block `@`-references other cards (inline caret dropdown; forgiving name match incl. renamed/displayed names) → combines them into a new table; gray derive arrows (distinct from blue join edges); merged preview via `rowsForCard` | ✅ (demo-mock: Pendo/NPS) |
| Pan-to-reveal — canvas pans horizontally so the selected node stays visible when the properties panel opens (reveal-not-recenter; resets on deselect) | ✅ |
| Sentiment reveal — fetch/Fix stamps enriched schema with `sentiment`/`sentiment_score` hidden; running the sentiment cell reveals + pulses them | ✅ (demo-mock) |
| Fix-with-AI review — data loads only on Accept (error stays during review); Reject/Accept soft red/green | ✅ |
| Data browser collapse — panel collapses to 0 width; warehouse icon moves to topbar (mirrors agent collapse) | ✅ |
| Demo cut — third variant, Vision + reviewed POC picks, sole home of the script | ✅ |
| Join graph — one orthogonal line per join, channels, badge on the line, layered auto-layout + Tidy up | ✅ |
| Agentic thread — Suraj's `ReasoningBlock` wired; one primary Button everywhere; caching as an in-thread form; real connector marks; tinted confidence + Radiant tooltip | ✅ |
| Code blocks — Python and SQL are always editors (no read-only mode, no Edit button); Run keeps you in the code | ✅ |
| Preview — row count / "Not run yet"; code row filters apply at node level (S11's 10 → 8); no formatting toolbar | ✅ |
| Spreadsheet tab — empty state is an empty sheet that fills the pane; formula columns carry an `fx` badge | ✅ |
| Publish modal — Status, Sources and Cache all derived from state; sources listed per connection | ✅ |
| Agent avatar — Spotter mascot (shared with the Viz panel) | ✅ |

---

## Deferred / partial

- **WorkflowDirectory** — cosmetic only; do not wire without explicit decision.
- **Manual workflow paths** — intentionally deferred; agentic paths first.
- **UI↔code toggle** — read-only code view for visual-transform cells (join/filter/formula). Deferred.
- **Expand icon on code blocks** — visual affordance only; full-screen code view dropped.
- **"Fix all with agent" DQ chip** — visual only, not wired.
- **AIRS Generate / Add buttons** — visual only.
- **Per-step code storage** — multi-cell code blocks (right architecture); deferred post-demo.

---

## Naming

- The from-scratch flow was called "Day Zero" until session 112. Now `isFromScratch`, `fromScratchPhase`, `runFromScratchSteps` throughout the codebase.
- The central object is a **model**. The internal type `ProjectState` is legacy — do not rename; it is load-bearing across the routing pipeline.
- **"Clean"** = the prep/transform menu (renamed from "Prep" in session 139).
