# Data Studio — current state

_What exists right now. Requirements are in `PRD.md`; what's in flight and why is in `DESIGN.md`;
history is in `SESSION_LOG.md`. **State only** — no changelog._

**Last updated:** 2026-08-17 (session 158)

---

## The four cuts

One codebase, four experiences, selected at runtime by `?v=` → `localStorage` → default. A
`VariantToggle` sits in the header and the choice is reflected back into the URL, so each cut is
shareable and reload-safe. `variant.tsx` owns this.

| Cut | `?v=` | What it is |
|---|---|---|
| **Vision** | `vision` | The full vision-level experience. The default |
| **POC** | `poc` | Komal's scoped-down cut. **Frozen** — the reviewed reference, not a workspace |
| **POC V2** | `pocv2` | **The MVP, and where all current work happens** |
| **Demo** | `demo` | The stakeholder cut, and **the north star.** The only cut where the run-of-show script fires |

Differences are expressed as fields on a typed `Scope` object, one per difference. Each cut spreads
its parent, so a cut can only differ where a pick is written down.

⚠️ **`poc` is `isPocCut(variant)`, which includes POC V2** — ~28 checks read that one boolean.

---

## POC V2 — what it looks like

The canvas is a feature of ThoughtSpot's **Data Workspace**, not a destination: Data Studio's own
home screen and nav are replaced by the workspace's. Publishing is **Save model** — one click, no
modal, landing on the model's detail page, where Edit model returns to the canvas.

**Entry is six steps** (2026-08-17): `+` → **Model** → Suraj's model-type modal → **Build a new
model** → old-vs-new canvas cards → **Select connection** → the canvas. Only "Build a new model"
continues; every other option in that modal closes as it always did. ⚠️ **Old canvas has no
destination** — it used to *be* the model-type modal, so with that at the front there is nothing
for it to open.

**One connection per model, chosen before the canvas and unchangeable.** So the data browser is a
**flat list of that connection's tables** — no connection, database or schema levels, no filter;
search narrows table names. Behind `flatTableBrowser`.

⚠️ **Canvas caching is gone** (`canvasCaching: false`). One warehouse and metadata only means
nothing to bring over, so the gate can never fire. Removed: the cache pill, the notice, the
settings dialog, the gate. **Kept: the model cache** on a saved model's Caching tab — a different
cache, after the model is ready. ⚠️ Do **not** express this by turning `tableCaching` off; that
switches Vision's older model-level caching UI back on.

```
GlobalHeader
└── Topbar          model name · Canvas/Spreadsheet switcher · Save model
    ├── Left dock   [ Data browser | Metrics ]  ← SegmentedControl, one rail not two
    ├── Canvas      dot grid; BlockNode cards; orthogonal join lines; Tidy up
    ├── Properties  docked right — join, filter, formula, metadata
    └── Preview     bottom — Data | Semantic
```

⚠️ **`dataset2` mode renders `BlockNode`, not `CanvasNodeCard`.** Two shipped bugs came from
wiring the other one.

**Absent in POC V2:** Columns tab · Test tab · Spotter readiness pill · CSV / SQL / Python · Clean ·
draft and publish · Parameters · Settings.

---

## Where things live

| Piece | File |
|---|---|
| Cut resolution + `Scope` | `variant.tsx` |
| The canvas — everything | `components/ModelCanvas.tsx` (~8,300 lines) |
| Agent chat | `components/AgentPanel.tsx`, `components/PromptBar.tsx` |
| Data Workspace shell + nav | `Shell.tsx` (`dataWorkspace` prop) |
| Data objects landing | `components/DataObjectsPage.tsx` |
| Model detail page (view state) | `components/ModelDetailPage.tsx` |
| Table → warehouse authority | `data/tableConnections.ts` |
| Residency, policy, estimates | `components/cache/cacheState.ts` |
| Cache notice · dialog | `cache/CacheRequiredNotice.tsx` · Near Store's `CachingSettingsModal` |
| Canvas ⇄ cache dialog adapter | `cache/modelCacheAdapter.ts` |
| Model cache state above the canvas | `cache/ModelCacheContext.tsx` (keyed by model **name** — the canvas has no id) |
| Cache progress (clock-driven) | `components/CacheProgress.tsx` |
| Cache window list (own copy — AgentDB is frozen) | `components/cache/nearstore/windows.ts` |
| Join-aware merge | `buildModelMerge` in `ModelCanvas.tsx` |
| Spreadsheet | `components/Spreadsheet.tsx`, `DataSheetToolbar` |
| Readiness flow (POC + Demo) | `components/pocReadiness/` |
| Agentic vocabulary | `components/agentic/` |
| Persona | `persona.ts` — one source behind every header and avatar |

---

## Built and working

**Canvas.** Three modes (`dataset` chips inline · `blocks` every action a node · `dataset2` current
default). Table cards with inline chip pipelines, join edges, multi-select join flow. One orthogonal
line per join with its own gutter channel and the badge on its own line; layered auto-layout for
agent-committed joins only, plus **Tidy up** on demand. Pan-to-reveal keeps a selected node visible
when the property panel opens.

**Data browser.** In POC V2, a flat list of the one chosen connection's tables, with search over
table names and a detail flyout per table carrying metadata and checkboxed columns. Vision, POC and
Demo keep the tree: all connections at once with a connection filter facet, and search across
table/schema/database/connection with flat breadcrumbed results.

**Metrics pane.** Shares the left dock with Data browser. **Sectioned** — one section per table,
then Formulas, Filters, Parameters — each collapsible, open by default. Row actions on hover: a
**delete icon** on a column, since removing is the only thing you can do to one; **⋯ → Edit ·
Remove** on a formula or filter, which can also be edited. `+` is a menu: Add formula / Add filter.

**Formulas and filters are model-level.** They open their own panel with **no card selected and no
chip on any card** — a chip is a step in one table's pipeline, which a model-level metric isn't.
⚠️ **You cannot write a formula across tables that aren't joined**, enforced by only offering the
joined model's columns and naming the unreachable tables. Komal's card-level formula path is
untouched; the two forms are deliberately duplicated.

⚠️ `modelFormulas` **already existed** — a Vision-era feature rendered in the Columns tab, which
POC V2 doesn't have, so it was unreachable. It is reused, not duplicated.

**The table flyout edits columns both ways.** Reopen a table that is on the canvas and its columns
show ticked; select and deselect freely, then **Save changes**. `step.cols` is the single answer to
"which columns are in the model" — `addToCanvas` honours the ticks, which it did not before.

**Spreadsheet.** Join-aware — walks the join graph with real key matching, honours join type,
multi-hop, one-to-many fans out. Scope on the toolbar's right edge; no footer, no pagination, no
row-count readout. Errors rather than showing a partial model when a table is orphaned. Loads cell by
cell on a diagonal with real headers mounted.

**Caching — built, and switched off in POC V2.** Everything below still exists and works in the
cuts that have it; POC V2 has `canvasCaching: false`, so none of it is reachable there. The gate
fires when a join starts, on every path, via one function holding the action to replay. Info notice
→ dialog (model scope + per-table window / reference column / refresh) → background fill → **the
held join resumes itself** into its property panel. Progress and status on the topbar pill and the
header chip, never on the cards. Consolidated with Near Store: its `CachingTab` /
`CachingSettingsModal` / `RunHistoryModal` are imported onto the model detail page — **that part
stays live in POC V2**, since the model cache is the performance one after save — and
`canFallBackToLive` swaps six pieces of copy so a multi-source model never claims older data is
queried live.

**Also present, from earlier cuts:** the readiness flow (POC + Demo, in-thread) · brand connector
logos · join-type glyphs with filled surviving regions · the Search data editor · publish flow and
the Spotter hand-off (Demo) · chat-first start where the model is created from the conversation
(Demo) · Python/SQL blocks, dbt import, Pulse monitoring, Workspace and Chat views (Vision).

---

## Design system

Topbar, data browser, metrics, preview, columns and modals are on Radiant tokens and components —
`Modal`, `SegmentedControl`, `SearchBar`, `Checkbox`. Type on a **12px floor** (Radiant's scale
starts at `xs: 12`, weights stop at `semibold`), spacing on the 4px scale, greys collapsed 76 → 35.

⚠️ **Still off it: the canvas, the spreadsheet and the property panel.** Their type sits a step
smaller than everything beside them, and the seam is visible. The property panel is Komal's.

⚠️ **Row heights are load-bearing across the dock seam** — browser header and spreadsheet toolbar
both 40px, search rows and formula bar both 32px. Change one side and you must change the other.

---

## Naming

The central object is a **model**. `ProjectState` is the legacy internal type — **do not rename**,
it is load-bearing across the routing pipeline. `isFromScratch` was "Day Zero" until session 112.
"Clean" was "Prep" until session 139.
