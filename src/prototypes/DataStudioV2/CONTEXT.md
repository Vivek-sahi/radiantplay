# Data Studio — Canvas State

_Current state of the Data Studio V2 prototype. For session history see `SESSION_LOG.md`. For active work items see `NEXT_UP.md`._

---

## What it is

Data Studio is a no-code visual canvas for building AI-ready data models. The primary user is a data engineer or analyst who joins, cleans, and semantically describes data for ThoughtSpot's Spotter AI. The prototype lives at `src/prototypes/DataStudioV2/`.

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

**Topbar** (inside ModelCanvas, above browser+canvas): model name (display) · data-mode pill · view switcher (Canvas / Columns / Test) · AI readiness pill · Draft saved · Publish.

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
