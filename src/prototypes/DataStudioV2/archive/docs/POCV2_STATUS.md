# POC V2 — build status

_The single canonical work list for POC V2 (`?v=pocv2`). Update statuses in place as
items move. Supersedes the overlapping lists in `2026-08-11-prototype-plan.md`,
`2026-08-11-mvp-feature-breakdown.md`, and the work-split conversation — those stay as
reference for reasoning and open questions; **this file is the list.**_

**Last updated:** 2026-08-12 (session 156)

**MVP statement:** Users can make a multi-source data model by caching their tables in
ThoughtSpot — bring tables from multiple warehouses, preview, join, create formulas,
build a model for a use case, save it.

**Ownership.** Komal: canvas representation and actions — data preview, canvas,
property panel, nodes, relationships. **Formula authoring counts as hers**, because the
builder lives in the property panel and can generate a formula without a table node
selected.

Ours: entry point, data browser, column selection, caching, spreadsheet, save,
metrics (the pane and its list — not the formula builder behind it).

---

## Build queue — in order

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | **Entry point** — `+ → Model → Old canvas / New canvas` | ✅ **Done** | Submenu built; New canvas → empty canvas. Multi-source card removed from the modal, which is now Suraj's unmodified 5 cards behind Old canvas. |
| 2 | **Save flow** — drop the stale "Draft saved" text | ✅ **Done** | Hidden in `saveMode` only. Draft/publish is out of MVP scope, so the line was advertising a concept the cut doesn't have. Vision/POC/Demo unchanged. |
| 3 | **Spreadsheet** — join-aware merge + scope dropdown | ✅ **Done** | `buildModelMerge` walks the join graph: real key matching, join type respected (inner drops unmatched, outer keeps with nulls), multi-hop, one-to-many fans out. Connected component only — unjoined tables are neither blended **nor named** (2026-08-12: the canvas already shows an unjoined table as unjoined, so captioning it under the grid reported a fact the user can see, in the one place they are not looking at it). Scope (Whole model + each table) lives on the **toolbar's right edge**; there is no footer, no pagination and no row-count readout — the sheet scrolls infinitely and the design (Figma `Data journey` 622:5094) has no footer. Formula bar rebuilt to that design: `fx` cell + sunken input, name box dropped as dead space. ⚠️ **Whole model errors when a table is orphaned** — no join means no row correspondence, so the sheet refuses rather than rendering the connected component as if it were the model; individual table scope always works. Row heights aligned across the dock seam (header/toolbar 40, search/formula bar 32). |
| 4 | **Data Browser** | ✅ **Done** | Spec: `2026-08-11-data-browser-spec.md`. Built: connection filter un-gated for POC V2 via `browserConnectionFilter` scope + made an overlay (was pushing the tree down) with outside-click/Esc close; search wired (was a dead `<input>`) over table/schema/db/connection with flat breadcrumbed results; **click a row → detail flyout** with metadata + checkboxed columns + `Add with N columns`, closing on outside-click/Esc. Row is icon+name only — no `+`, info icon, count, tick or highlight; on-canvas reads as blue icon+text. Cleared 4 dead props (20→16 type errors). |
| 5 | **Metrics pane** | ✅ **Done (ours)** | `Data` / `Metrics` tabs share the left dock (`metricsPane` scope flag) — no second rail. Flat list of every selected column across all tables plus formulas, `fx` badge reusing Spreadsheet's, search, source/expression per row. Filters excluded — not metrics. |
| 5b | **Formula authoring** | ⚪ **Komal** | Builder lives in the property panel (hers), and can generate a formula without starting from a table node. Our Metrics `+` points at it and our pane lists the result. ✅ **The `+` no longer needs a canvas selection** (2026-08-12) — with nothing selected it files the formula on the model's most-connected table. A model-level metric spans tables, so demanding you pick one contradicted the pane. Until 5b lands the formula is still *stored* on a card, so deleting that card deletes it. |
| 6 | **Caching** | 🟢 **Built — phases 1–5 + Near Store consolidation** | **Flow spec: `2026-08-12-caching-flow-spec.md`** (supersedes the flow sections of the proposal and strategy docs). Six steps: drop (no cache) → attempt cross-warehouse join → info, not error → modal (model scope + per-table window / reference column / refresh) → background fill with canvas indicator → join auto-resumes into its property panel. Two policies: **full is portable, a window is half-portable** (the duration travels, the reference column can't). ✅ **All modeling-team blockers closed (2026-08-12):** a cache holds only the chosen slice, progress reports per table, and row count + size arrive as pre-cache table metadata. Nothing external gates item #6 now. **Build plan in §7** — 6 phases, 5 new files under `components/cache/`, and one invisible prerequisite (§7.1) that has to land first. **Built:** the connection authority (`data/tableConnections.ts`) · `cache/cacheState.ts` · the gate on all three join paths · info notice → `TableCacheModal` → 30s background fill → per-card badges → the held join auto-resuming · `tableCaching` / `cacheOnConnectionAdd` scope flags. **Consolidated with Near Store:** one shared window list in `_shared/caching/windows.ts`, its `CachingTab` / `CachingSettingsModal` / `RunHistoryModal` imported (not copied) onto the model detail page via `cache/modelCacheAdapter.ts`, its `CacheMarker` + a `Query` column on the listing, and `canFallBackToLive` so a multi-source model never claims older data is queried live. **Left:** the dashed pending edge (Dismiss currently discards the join) and the during-fill capability matrix beyond blocking joins. |
| 7 | ~~**Model detail page** — tab for filters/formulas~~ | ⚫ **Dropped 2026-08-12** | No changes to the view state after saving; the focus is the canvas. Formulas surface in the Metrics list and the Spreadsheet, which is enough. (The detail page *did* gain a Caching tab, but that is #6's Near Store consolidation, not a view-state redesign.) |
| 8 | **Join panel** — polish pass | ⚪ **Komal** | Property panel is hers. Shape decided (4 join types + cardinality, both built); may need room for caching status. |
| 9 | **Canvas** — drag/snap polish | ⚪ **Komal** | Canvas interaction is hers. Miro/FigJam is the reference. |
| 10 | **Column selection** — cross-warehouse FK collision | ⚪ **Blocked — not ours** | FK-dedup rule already decided (`research/fk-column-deduplication.md`). Open question is whether it survives caching materialising cross-warehouse tables into one place → data-modeling team. |
| 11 | **Spotter agent** | ⚪ **Blocked — inherited** | Arrives from the SpotterModel team (~3 weeks from 2026-08-11). Not our design surface; position on canvas unchanged. |

**Legend:** ✅ done · 🟡 in design · 🔴 ready to build, not started · ⚪ blocked/external

---

## Caching — decisions and reasoning

_Full argument in `2026-08-12-caching-proposal.html`; research and sources in
`2026-08-12-caching-research.md`. Captured here because these are the durable conclusions._

**Problem.** How do we let users explore data modeling in real time when caching enough
data takes minutes to hours? Caching is required because you can't join across warehouses —
every table must sit in one warehouse, ours or an external one. Unlike Agent DB (cached
*after* modeling, latency optional), here it blocks the join the user is making.

**Solution.** Cache a *slice* to keep exploring. Full data stays available for anyone who
accepts the latency.

**Timing** (Tableau Hyper benchmarks): 10M rows ≈ 37s · 100M ≈ 7min · 500M/25GB ≈ 45min.
**Below ~50M rows there is nothing to solve**; slicing earns its complexity above ~200M.

### Ways to slice — time period wins

| Lever | Joins survive | Why |
|---|---|---|
| **Time period** (last N hours/days) | ✅ | Both tables share the predicate meaningfully — an order and its shipment both fall in the last 7 days |
| Rows | ❌ | Arbitrary cut. First 500 rows of two tables needn't share keys → join returns near-zero matches, **silently** |
| GB | ❌ | Resolves to an arbitrary row cut, same silent failure. Keep as a *readout*, never an input |

### The flow

1. **Drop a table** — no caching. Preview queries the source live; explore freely
2. **Draw a join** — caching required. Each table cached separately; each needs a time
   period + reference date column. Default the shortest window (24h) so the first cache
   is fast and the choice isn't weighty
3. **While caching** — preview loads progressively; formula and filter can be created;
   join and clean cannot
4. **Cached, sliced** — everything except cleaning
5. **Testing** — a question inside the period answers; outside it, offer a full cache

### Capability by cache state

| | Uncached | Caching | Sliced | Full |
|---|---|---|---|---|
| Data preview | Live | Progressive | ✅ | ✅ |
| Formula | ✅ | ✅ | ✅ | ✅ |
| Filter | ✅ | ✅ | ✅ | ✅ |
| **Join** | ❌ | ❌ | ✅ | ✅ |
| **Clean** | ❌ | ❌ | ❌ | ✅ |
| **Test** | — | — | In period only | ✅ |

⚠️ **Barring join during the fill is what makes progressive caching safe** — nothing
available mid-fill depends on completeness. Two partially-filled tables joining on
arbitrary prefixes was the one real hazard, and blocking join removes it by construction
rather than by warning.

### Approach picks

| Approach | In? | Why |
|---|---|---|
| Slice by time period | ✅ | Makes the cache fast enough to keep exploring |
| Progressive use during fill | ✅ | Complementary, not an alternative. Gated per the matrix |
| Cache at join, not on drop | ✅ | Costs nothing (preview is live) and the window is chosen with context |
| ~~Target the majority warehouse~~ | ❌ **Dropped** | Not available by definition: caching *means* bringing tables into ThoughtSpot's warehouse. Every table in the join caches; there is no target to choose |
| Background + notify | ❌ | Only justified at 45-min scale, which slicing should prevent. No notification surface exists |
| Entity subset (N accounts + related rows) | ❌ | Best join integrity, needs no date column, but requires the join graph and likely unsupported. Recorded, not dismissed |

### Fact vs dimension, without joins

Caching happens before joins exist, so classification uses column statistics only. Strongest
first: a column with **distinct count ≈ row count** (natural key → dimension); **ID-shaped
columns with heavy repetition** (→ fact); row count; event date vs audit date. Show the
guess, let the user correct once per table. Good-to-have — fallback is asking per table.

**Dimensions cache full, facts get a window.** Not a restriction — dimensions are small, so
it's free, and it removes the reference-column problem since only facts need one.

### Corrections worth not repeating

- Partial caching is **not** a correctness problem. The window defines the model's **scope** —
  an aggregate over 7 days is correct for a 7-day model. So **Save does not gate on full data**
- Staleness is handled by **refresh frequency**, not by gating
- Spotter already honours our warehouse as a connection, so scope travelling with the model
  is not a cross-team dependency
- Tableau shipped one flattened extract and **reversed it in 2018.3** — cache the tables, not
  the joined result; the denormalised output is larger than the sum of its inputs
- Our no-cross-warehouse-join constraint is **ours, not the domain's** — Trino federates in
  memory with no materialisation; Sigma declines the feature entirely
- Inner joins **hide** cache-boundary row loss; outer joins show it as nulls. Outer is safer
  while a window is active — inner is currently the default for agent-created joins

---

## Decisions locked (don't relitigate)

- Entry point is a CTA, not a Data Studio home. Vision's landing page is out of MVP.
- Published model view: no change.
- Draft mode and publishing flows: **out of MVP.** Save only.
- AI readiness: **phase 2**, inherited from Komal.
- Parameters, Settings: **cut from MVP.**
- Enable for Spotter: no separate step — Save makes the model available.
- Connection filtering: yes, as a facet on a unified tree — never a single-connection mode.
- Data preview: read-only.
- Filter/formula: **model-level only.** Not on a card, not on a join edge.
- A model never has orphan tables at save time; the canvas may, mid-build.
- Data Browser: docked + collapsible, not a modal.
- Join: 4 types (Inner/Left/Right/Full) + cardinality as a separate axis. No colour-coding on cardinality.
- Caching = bringing tables from other warehouses **into ThoughtSpot's warehouse** and refreshing on a frequency. Required because we don't support federated query. **The benefit is that live queries stop, which saves money** — it is not only a cost to be minimised.
- Caching is triggered by **attempting a join whose tables have different sources**, never by dropping a table. Compare sources at join time; different → caching required. ⚠️ **A cached table's source is ThoughtSpot** — so cached + Snowflake counts as two sources and needs caching, while two uncached Snowflake tables count as one and don't.
- **Progress lives on the table card, status on the model pill.** Tables cache one at a time and at different times, so a model-level bar can only average into something that describes no individual table. The header chip stays the "a job is running at all" signal that survives leaving the canvas.
- **During a fill:** join, Python and clean are blocked; preview, filter, formula, SQL, save, dropping tables and leaving the canvas are allowed. Python and SQL split because SQL pushes down to the complete source and Python only ever sees our partial copy.
- **Time period and refresh frequency are both the user's choice** and both stay in the modal — the window is how much history the use case needs, the frequency is how fresh it must be. We educate rather than default them away.
- Table cache (feasibility, per table, during build) ≠ model cache (performance, whole model, after save — `ModelView` → Cache tab).
- Table residency has **three** states, not two: Live · Cached · Native (CSV / Python output — no window, no refresh, no cache badge; its source mark already says so).

---

## Open questions, by item

**#5 Metrics** — mostly closed
- ~~Flat or grouped by table?~~ **Flat.** A cross-table formula has no single table to nest under.
- ~~Filters in this pane?~~ **No — filters aren't metrics.** See the open filter question below.
- ~~Canvas trace for a created formula?~~ **No.** A field spanning tables has no card to anchor to.
- ~~Where does the builder live?~~ **Right property panel** — Komal's, and it can generate a formula without a table node selected.

**⚠️ Filters have no home.** Model-level (decided), excluded from Metrics (decided), not on a card or join (decided) — so nowhere. New gap; needs an owner and a surface.

### ⚠️ The live/cached indicator — mental model unresolved (Vivek, 2026-08-12)

_Thinking-out-loud, recorded as an open question. **Not a build item** — do not act on this without
asking._

The pill is currently a dropdown button labelled "Live query" / "Cached". Vivek's doubt is whether
that treatment is right at all, and whether it even belongs in the topbar.

**The model underneath it.** Live query means we're querying an *external* source warehouse.
Modelling across warehouses means caching into ours — so internally the table simply changes
connection: it was an external connection, now it's an internal one. That framing makes "cached"
sound like less of a mode change than the current pill implies.

**There are three states, not two**, and the pill only names two:

| | What it means |
|---|---|
| **Live** | Single source, nothing cached — every query hits the source warehouse |
| **Live + cache** | Single source, cached for a window. Queries **inside** the window serve from cache; queries **beyond** it still go live |
| **Cache only** | Multi-source. No live fallback exists, because live is exactly what can't cross warehouses |

`canFallBackToLive` already encodes the third case, but the pill has no vocabulary for the middle
one — which is the common case for a single-source model with a window.

**Possible directions, none decided:** make it an *icon indicator* rather than a dropdown button;
or move it out of the topbar entirely. Vivek is not convinced it belongs where it is.

**It's entangled with a Settings surface we don't have yet.** A settings panel is coming (PRD
pending from the PM). Two placements were floated: a third dock tab — `Data browser · Metrics ·
Settings` — or a settings icon in the topbar just before Save model. Which one wins changes where
the live/cached indicator should live, so **this question should not be answered before the
settings question is.** Both point at a broader look at the workspace/workbench layout.

**Preview pane's "Model level" option may now be redundant** — the Spreadsheet owns the model view, and the preview pane still carries its own (unfixed, still-zipping) model-level merge. Decide whether to drop that option or fix it.

**Sample → full can invalidate a formula** eyeballed against sampled data. Nothing re-checks or flags it.

**#6 Caching** — external blockers all closed (spec §6). Ours to decide:
- ⚠️ **Mock data is the last dependency.** Row counts of 45–1,240 make the size estimate absurd and
  push every table to "dimension", so the windowed path can only be demoed via the manual Fact
  override. The logic is right; the numbers aren't.
- **Circuit-breaker threshold** for an inherited *full* policy. "Apply to all future tables"
  is decided when the model is cheap and fires when it may not be — a 300M-row table joining
  in later would silently start a ~45-min cache. The one interruption earned *against* an
  explicit user preference.
- **Retroactive or forward-only** when the policy changes? 30d → 6h discards data a formula
  may have been built against. Recommendation: retroactive, confirmed.
- **Bridge tables** — classification can't decide; needs a human.
- **Failure** — cache dies halfway: what does the card show, what happens to the pending
  edge? `ModelView` already has a `cache_failed` status; the flow doesn't.
- **Formula during the fill** is allowed — against what data?
- ~~Sample shape~~ **Closed: time period.** Rows and GB cut arbitrarily and break joins silently.
- ~~Long-wait progress~~ **Closed: background fill + canvas indicator**, not a blocking screen.
- ⚠️ **`Enable for Spotter` carries its own caching settings** (platform feature). "Enable for
  Spotter: no separate step" is in Decisions locked — reconcile.

**#3 Spreadsheet**
- Does a model-level formula created in #5's panel auto-add a column to the grid, or is that opt-in?

**#4 Data Browser** — built; two leftovers
- **Add-connection from inside the browser?** Tableau puts it in the Connections header, and you often discover you need a second warehouse mid-build. But connection setup is an auth flow that lives in Connections today. Scope call.
- **Drag as a second add gesture?** Click-opens-the-flyout is decided and built. Tableau is drag-only onto the canvas; drag could be added as a discoverable alternative, not a replacement.
- ~~Click vs. drag~~ **Closed:** click opens the preview flyout; Add lives in the panel.
- ~~Does browse-time column ticking converge with the Fields panel?~~ **Closed: they stay separate.** No platform merges them — "what exists in the warehouse" vs. "what's in my model" are different questions.

**#9 Canvas**
- Does sticky multi-select-to-join survive #5?

**#10 Column selection** — for the data-modeling team
- Does FK-auto-dedup hold after cross-warehouse caching, or does materialising into one place create a new collision?

**#11 Spotter agent** — for the SpotterModel team
- Can the inherited agent drive the canvas via the existing three calls (`agentAddTables`, `agentAddJoins`, `agentAddPythonSource`)?
- Does it need a **new** call for triggering caching, or for creating a model-level formula?

---

## Known gaps in the prototype (not design questions)

- `ModelCanvas.tsx` carries 20 pre-existing type errors (unused vars + one `BrandMark` prop mismatch) and `index.tsx` 2. All predate POC V2 work; build passes regardless since Vite doesn't typecheck.
- `MODEL_DETAILS` only covers `proj-mc` and `proj-sp`, so most models open a detail page with an empty Columns tab.
- Three unrelated datasets still coexist (campaign performance / customer health / renewal risk). Not yet reconciled to one.
- Spreadsheet formatting toolbar: 10 of 15 buttons dead — flagged for removal.
- Canvas undo exists; spreadsheet undo/redo are dead buttons; Tidy up has no undo.

---

## Next session — start here

**Session 156 was caching feedback + a design-system cleanup.** Two things it left on the floor,
both cheap:

0. **Finish the type scale on the canvas and spreadsheet.** They are the only surfaces still below
   the 12px floor and off the token scale (canvas 11, spreadsheet 16 sub-12px sizes), which now
   reads as a seam against the browser and topbar beside them. Same script as session 156 — but
   run `npm run typecheck`, not just `npm run build`, because Vite does not typecheck and a
   scripted edit can introduce an undefined identifier that only fails at runtime.
   ⚠️ The **property panel** is in the same state (25 sub-12px, 251 hex literals) but is Komal's —
   that's a conversation, not a commit.

**The join is still the substantive work**, unchanged from session 155 — and the trustworthiness
of what a model produces.

1. ⚠️ **Write the join spec** — the only cross-owner item, and where the silent-wrongness risk
   lives. The join panel is Komal's (#8), so this needs writing down rather than building:
   - **Derive cardinality** from whether the join column is unique on each side, shown as
     *detected* with the evidence, editable. It is a hardcoded `many_to_one` today, and three
     things rest on it: which key survives dedup, whether rows fan out, and fact vs dimension.
   - **A row-count readout before Apply.** Highest-value single addition — it turns cardinality
     and join type into one number that catches a wrong model before it exists.
   - **Auto-dedup follows cardinality.** One rule: *drop the duplicate key only when the join
     guarantees the surviving column is never null.* Safe on inner and on outers that keep the
     "one" side; **coalesce** on outers that keep the many side; **don't dedup on M:M**, warn and
     suggest a bridge.
   - **Not silent** — the panel says what it derived and what it did; the Metrics list shows the
     hidden key as hidden and restorable (it is a column-list change, not a deletion).
2. **Apply the FK rule on the live path.** Decided in April (`research/fk-column-deduplication.md`)
   and implemented in mock data only. The browser-add path adds all columns and `buildModelMerge`
   keeps both, so `account_id` appears twice in the merged output *and* in the Metrics list, with
   18 React duplicate-key errors.
3. ⚠️ **Decide where filters live.** The node menu offers a **card-level Filter**, which
   contradicts the locked "model-level only, not on a card" decision. Either the decision moves or
   the menu item does. Suggested home: a topbar chip beside the model name, because a filter
   changes every number in the model and must be visible without navigating.
4. **Finish the caching edges** — the dashed pending edge so Dismiss stops discarding the join;
   mark the pending join in the property panel; prompt to widen the window at first save and at
   enable-for-Spotter; enforce the during-fill matrix beyond blocking joins.
5. **Naming a model on save.** It lands as "Untitled model" because nothing asks. A flow decision,
   not a bug.

**Read first:** `2026-08-12-caching-flow-spec.md` (the built flow, §9 for the Near Store
consolidation) and `research/2026-08-12-ux-walkthrough.md` (the three workflows run in a browser,
with screenshots and what's still open).

⚠️ **Ask before building.** Design notes in this project are notes, not a build queue.

---

## Reference docs

- `2026-08-11-prototype-plan.md` — per-feature interaction possibilities + how to prototype
- `2026-08-11-mvp-feature-breakdown.md` — sub-features, stories, workflows, POV, mental model
- `2026-08-11-node-canvas-peer-research.md` — Alteryx/KNIME/Matillion/Coalesce/dbt findings
- `2026-08-06-poc-scope.html` — surface scope (in/out/who builds what)
- `research/fk-column-deduplication.md` — the decided FK rule
- `research/caching-discoverability.md` — live-vs-cached state surfacing (different question from the wait UX)
- **`2026-08-12-caching-flow-spec.md` — the buildable caching flow.** Start here for #6; the
  proposal and strategy docs are the argument behind it, not the spec
- `2026-08-12-caching-proposal.html` — the caching proposal (problem → solution → open)
- `2026-08-12-caching-research.md` — Tableau/Trino/Sigma/dbt findings, timing benchmarks, sample-vs-full per operation
- `2026-08-11-data-browser-spec.md` — data browser, closed for dev
