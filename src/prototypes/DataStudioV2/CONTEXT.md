# Data Studio — Build State

_Updated at the end of every session. For product context see `product.md`. For session history see `SESSION_LOG.md`._

---

## Current state (session 134, 2026-07-03)

**Vision pivot — DataStudio V2 = no-code visual canvas.** The Workspace modeling surface is moving from the high-code notebook to Komal's visual **ModelCanvas**. The old high-code notebook is preserved as a frozen **"Data Studio 1.5"** prototype (`src/prototypes/DataStudio15/`, registered in `registry-mine.ts`) for stakeholder comparison. V2 is the canvas collab hub — Komal's team is building on the canvas and future merges land there.

**Merged + wired:** Komal's `ModelCanvas.tsx` (`dae7d78` on `komal/dsv/komal-2`) merged; **"New model"** (Overview + Models page) now opens the canvas.

**Built this session (all in `components/ModelCanvas.tsx`):**
- **CSV upload** — file picker (Add data → Upload file) + drag-drop → first-class CSV node (green **table** icon + `CSV`/`Cached` badges); preview + Properties CSV-import settings (delimiter, quote, header). Canned mock table `customer_regions` (has nulls for the prep demo).
- **Fix nulls prep operator** — in the **Prep dropdown** (op `nullfix`). Panel mirrors Formula: manual **Fill value or expression** + **AI-assist** (describe → generate). Applied fix overlays green in the output preview.
- **Live/Cached data mode** — prominent header **dropdown**; two-way toggle w/ confirm gate. Caching required for **CSV + prep** transforms only (join/filter/formula/aggregate stay **live**). Guard blocks Cached→Live while a CSV/prep step exists. Cache-settings modal (scope + refresh).
- **Version-aware preview** — per-step null-fix lineage: output pane = fixes up to & incl. the active step; source pane = up to the previous step.

**Committed:** `d4c8b5e` (+ `d5b77cf`) on origin + github. **NOT deployed to prod** — a `vercel --prod` would also ship uncommitted AgentDB WIP from a parallel chat, so deploy is deferred.
**Build:** clean ✓ (`vite build`).

**Next session:** **pull latest from Komal's branch** (`komal/dsv/komal-2`) and merge new canvas work. Then: **mock-data swap** (canvas uses generic e-commerce data → swap to Customer Health), and the **"enrich for AI"** step after joins. Spec: `2026-07-02-csv-upload-canvas.md`. AgentDB caching-UI fixes were handed off to a parallel chat: `src/prototypes/AgentDB/CACHING-UI-FIXES.md`.

### Prior: session 133 (2026-07-01)

_Merged Komal's **agentic Snowflake connection flow** + New Connection workflow (connection work only). Fixed 3 runtime crashes (`runDayZeroSteps`, orphaned `setVerifyState`, `node_modules` symlink). Committed **DataNotebook**. Deployed `a6d5dcd`. Komal-merge process saved to memory: `reference_komal_merge_process`._

### Prior: session 132 (2026-06-29) — strategy/proposal
_Markdown docs only, no prototype code changed. New doc: `2026-06-29-data-studio-proposal.md` (leadership-alignment proposal). Working notes: `2026-06-22-builder-starting-point-discussion.md`._

### Prior build state (session 131, 2026-06-10)

**Branch:** `prototype/data-studio` on `origin` (vivek-sahi/radiantplay)  
**Deployed:** https://radiantplay-nine.vercel.app  
**Build:** clean ✓

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
| Pulse monitoring — 6 flows wired (ins-d1/d2/d3/d6/o3/o4); object-click → read-only artifact in FullChatView | ✅ |
| Data browser — warehouse explorer + dbt import wizard | ✅ |
| Connections — management + New Connection workflow (CDW / business app / semantic model) + agentic Snowflake connect pill flow (from Komal, s133) | ✅ |
| dbt import — full flow with broken/degraded column indicators + fix scripts | ✅ |
| Multi-source model flow — scan → Pendo notebook → CSV upload → staging table → model build | ✅ |
| Multi-source build — live animated workspace + PlanCardV2 tracker + BuiltSummaryCard | ✅ |

---

## Next session

**Deployed:** https://radiantplay-nine.vercel.app ✓

### Data Studio proposal — open items (`2026-06-29-data-studio-proposal.md`)

**Locked:** positioning (DS = ThoughtSpot's product for the *data team*; turn any data into AI-ready data = semantics + context, kept trustworthy) · the bet/thesis (trustworthy data is a *living loop* proven against real use; we own build (DS) + consume (Spotter) → close the loop, keep AI accurate as it decays; "the loop is the moat, no one builds for decay") · 4 value props ranked: **P2 semantics&context + P3 trust = core/wedge; P1 works-with-your-stack = table-stakes; P4 cost = emerging** · pains→value-props table w/ customer anecdotes · feature modules P1–P4 (tagged New/Change/Port; build P2+P3 first) · use cases for P1 (add data) + P2 (worked Customer Health example) · risks (agents-invent-context, warehouses-absorb [both external], PMF-gap [ours to fix]).

**Data points to fill:** time-to-first-model `[X]` · % of base on external semantic models · verify Anthropic 90→60 source · verify Gartner "context is the moat" + Spotter Semantics/OSI claims · an AI-cost stat.

**Not yet done:** P3 + P4 *use cases* (deliberately skipped the deep Monitor/Improve mechanism — user not yet comfortable with the "how") · tidy Outcomes to align 1:1 with the 4 props · purge stray "model" (use "join tables" for the action).

**Org-buy-in gaps to close before showing leadership** (strategic critique): ownership/turf map (frame DS as the *workbench on top of* Spotter Semantics / SpotterX / connections, not an owner) · the explicit *ask* · SpotterX-coherence answer (DS = supply side of agents) · business case ($ — retention/expansion/deals lost to Sigma/Omni) · unification execution + migration cost · defensibility stress-test vs. warehouses · validation plan · coalition map.

**Settled framing:** direction = validated (market + first-principles + pains converge); what's open = magnitude (data) + defensibility (it's *consensus*, so win on execution/the loop, not the idea).

### Prototype polish (unchanged from session 131)
- Context panel "Source tables" section: wire clicks to notebook cell highlight (same as artifact card clicks in chat)
- 3 Anthropic article builds (lower priority): provenance chip in Test mode, notebook edit → stale flag, unreviewed badge on agent-generated content

---

## Session 131 changes (2026-06-10)

**Notebook flow — model card bugs**

**AgentPanel.tsx:**
- Removed duplicate `ModelArtifactCard` from notebook flow done message — `BuiltSummaryCard` (from plan message) is the only model card shown after build
- Renamed "Open workspace" → "Open model" on `BuiltSummaryCard`

**Workspace.tsx:**
- Notebook item onClick: removed `setCanvasVisible(true)` — opening the notebook panel no longer forces the model artifact open
- `onNavigateToWorkspace` prop to AgentPanel now also clears `planPanelOpen`, `qualityPlanOpen`, `instructionsPanelOpen` — model card click in workspace properly shows the model artifact even when another canvas panel is open

**Build:** clean ✓

---

## Session 130 changes (2026-06-10)

**Notebook flow polish — created panel + workspace nav + ModelBuildPanel removal**

**AgentPanel.tsx:**
- Notebook flow: added `setProject` calls when `pendo_nps_enriched`, `csm_account_mapping`, and `customer_health_external` are written — these now appear in the Created section of the right panel
- Removed `onOpenModelPanel` prop entirely; `BuiltSummaryCard` and `ModelArtifactCard` both navigate to workspace directly via `onNavigateToWorkspace`
- `ModelArtifactCard` click: removed `onBuildStart` call (was causing unnecessary state churn/scroll side effect)
- Notebook flow build: removed `buildPlanCard: true` from the build-start message — fixes 2 artifacts being visible; only `ModelArtifactCard` shows at end

**ChatView.tsx:**
- Removed `ModelBuildPanel` component and all supporting constants (`MODEL_BUILD_STEPS`, `MODEL_BUILD_SOURCES`, `MODEL_SAMPLE_QUESTIONS`)
- Removed `modelBuildPanelOpen` state, `modelPanelAutoOpenedRef`, auto-open useEffect
- Model item in Created section now always calls `onNavigateToWorkspace` (not the old model panel)
- `notebookCells` and `setNotebookCells` lifted to props (state moved to index.tsx)
- Instructions + plan types filtered out of `createdItems` in `ChatContextPanel`

**ChatContextPanel.tsx:**
- `createdItems` filter now excludes `instructions` and `plan` types

**index.tsx:**
- Added `notebookCells` / `setNotebookCells` state (lifted from ChatView); passed to both ChatView and Workspace
- Workspace now receives `isNotebookFlow` and `notebookCells` props

**Workspace.tsx:**
- Added `isNotebookFlow` and `notebookCells` props
- `contextCreated` includes notebook item + Spotstore tables when `isNotebookFlow` — Environment section persists after navigating from chat to workspace
- Renders `NotebookView` panel when `notebookPanelOpen` (right panel; hides context panel while open)
- AgentPanel now gets `onNavigateToWorkspace={() => setCanvasVisible(true)}` — clicking model artifact card in workspace chat history shows the model canvas
- Notebook tab hidden from center panel tab bar when `isNotebookFlow` (notebook accessible from Environment in right panel)

**Build:** clean ✓

---

## Session 129 changes (2026-06-10)

**Model build panel — inline artifact view for notebook flow**

**ChatView.tsx:**
- `modelBuildPanelOpen` state + `modelPanelAutoOpenedRef`; useEffect auto-opens when `isNotebookFlow && buildStep !== 'empty'`, clearing all other side panels
- `ModelBuildPanel` component: live build steps (5 steps, all done on `buildStep === 'healthy'`), source dots light up as tables are added, sample questions post-build, "Open in workspace" CTA
- Model entry in Created section → opens model panel (not workspace) in notebook flow
- `onOpenModelPanel` prop passed to AgentPanel

**AgentPanel.tsx:**
- `onOpenModelPanel` prop; ModelArtifactCard + BuiltSummaryCard use it instead of `onNavigateToWorkspace`
- useEffect clears `planExpandedId` when `notebookFlowPhase === 'building'`
- `awaiting_build_initiation` regex: `^no` → `^no\b` (was matching "now", blocking build start)

**Build:** clean ✓

---

## Session 128 changes (2026-06-10)

**Single-notebook flow — post-review polish + bug fixes**

**AgentPanel.tsx:**
- `awaiting_build_initiation` regex broadened: now matches ANY input that isn't a question (`?`) or a clear negative (`no/wait/stop/cancel`) — fixes "Great now we're ready to model" not triggering build
- `modelArtifact` added to `awaiting_build_confirm` done message — `ModelArtifactCard` now renders at end of notebook flow build
- `ModelArtifactCard` click made unconditional: `onNavigateToWorkspace?.(); onBuildStart?.()` (no falsy guard)

**ChatView.tsx:**
- Model item in `created` array now has `onClick: onNavigateToWorkspace` — clicking "Customer Health Scorecard" in Created panel navigates to workspace
- `onNavigateToWorkspace` added to `created` useMemo deps
- Notebook item in `created` shown from flow start (not gated on `notebookCells.length > 0`): subLabel shows "Initializing…" until first cell arrives, then "Python · N cells"
- Notebook item also shows after remount when `project.buildStep !== 'empty'` (survives workspace → back-to-chat view switch)

**ChatContextPanel.tsx:**
- Green live indicator is now dynamic: grey "Initializing…" when notebook subLabel is "Initializing…", green "Initialized" once cells exist

**index.tsx:**
- `onNavigateToWorkspace` now clears `initialPrompt` before navigating: `() => { setInitialPrompt(''); navigateTo('workspace'); }` — fixes restart loop (ChatView unmounts on workspace nav; if initialPrompt was still set it would restart the flow on remount)

**Build:** clean ✓

---

## Session 127 changes (2026-06-10)

**Single-notebook flow — 9-item review pass**

**AgentPanel.tsx:**
- Removed "Customer Health Analysis" notebook artifact card from chat messages (notebook pre-exists, shouldn't re-appear)
- Env init sequence: 2 working steps now (env init → connection scan) before SQL cells appear; artifact cards for all 4 tables in scan response
- Pre-build flow overhauled: after staging compiles, agent shows neutral "staging table is ready" message, no auto-ask. New `awaiting_build_initiation` phase waits for user to say "build model" etc. → agent lists all 5 sources + "Use all of them" chip → `awaiting_source_selection` → plan card → build
- Added `onNavigateToWorkspace` prop; ModelArtifactCard and BuiltSummaryCard both call it

**ChatView.tsx:**
- Removed notebook auto-open (notebook panel starts closed; user opens via Created section)
- Added `NOTEBOOK_CARD_TO_CELL` map + `handleNotebookCardClick`: DIM_ACCOUNTS→sql-1, SUPPORT_CASES→sql-2, CALL_METRICS→sql-3, CUSTOMER_FOUND_DEFECTS→sql-4, pendo_nps_enriched→sql-pendo-write, csm_account_mapping→sql-csv-write, customer_health_external→sql-staging

**Single-notebook flow overhaul — based on review feedback**

**AgentPanel.tsx:**
- `NotebookFlowPhase` type expanded: added `awaiting_csv_prompt`, `awaiting_csv_write_consent`, `awaiting_staging_decision`, `awaiting_staging_consent`, `awaiting_build_confirm`; removed `awaiting_staging`
- Scan sequence: two working steps (env init → connection scan) before SQL cells; artifact cards shown for all 4 tables at end; "What other data?" is a separate follow-up message
- Pendo API key: uses masked `inlineInput: { type: 'api-key' }` — notebook artifact card removed from this message (was showing 5 cells before key ran); card appears after Pendo completes
- API key fix: `handleApiKeySubmit` passes sentinel `'__key_submitted__'` so raw key never appears in chat; typed key shows `'••••••••'`
- Pendo processing: goes through `execute_pendo_fetch` working steps, shows artifact cards (notebook + pendo_nps_enriched); no auto-CSV prompt — waits for user
- CSV flow: file drop shows attachment chip + consent gate before writing to Spotstore; artifact card for csm_account_mapping after write
- Staging table: SQL joins **only** `pendo_nps_enriched + csm_account_mapping` (CDW tables stay federated); pre-build message lists all 5 sources and asks "use all of them?"
- Model plan: `awaiting_build` shows plan card for review; `awaiting_build_confirm` runs the build after user confirms
- `handleFileUpload`: notebook flow shows attachment chip + consent gate
- `handleApiKeySubmit`: routes to notebook flow when `notebookFlowPhase === 'awaiting_api_key'`

**index.tsx:**
- Auto-transition chat → workspace skips notebook flow (`&& !isNotebookFlow`); build completes in chat, user navigates to workspace manually

**ChatView.tsx:**
- Notebook panel auto-opens when first cell arrives (`notebookAutoOpenedRef` guards single-fire)
- Table/artifact card clicks in notebook flow route to `handleNotebookCardClick` → opens notebook panel + sets `notebookHighlightCellId` (no MultiSourcePreviewPanel)
- `NOTEBOOK_CARD_TO_CELL` map: DIM_ACCOUNTS→sql-1, SUPPORT_CASES→sql-2, CALL_METRICS→sql-3, CUSTOMER_FOUND_DEFECTS→sql-4, pendo_nps_enriched→py-pendo, csm_account_mapping→upload-csv, customer_health_external→sql-staging

**ChatContextPanel.tsx:**
- "Environment" section renders above "Created" when notebook items exist; notebook items filtered out of `createdItems`

**NotebookView.tsx:**
- `highlightCellId?: string | null` prop; scrolls to + pulses blue ring on matching cell for 1.6s; `cellRefMap` ref resolves DOM nodes

**Build:** clean ✓

---

## Session 127 changes (2026-06-10)

**Single-notebook flow — 9-item review pass**

**AgentPanel.tsx:**
- Removed "Customer Health Analysis" notebook artifact card from chat messages (notebook pre-exists, shouldn't re-appear)
- Env init sequence: 2 working steps now (env init → connection scan) before SQL cells appear; artifact cards for all 4 tables in scan response
- Pre-build flow overhauled: after staging compiles, agent shows neutral "staging table is ready" message, no auto-ask. New `awaiting_build_initiation` phase waits for user to say "build model" etc. → agent lists all 5 sources + "Use all of them" chip → `awaiting_source_selection` → plan card → build
- Added `onNavigateToWorkspace` prop; ModelArtifactCard and BuiltSummaryCard both call it

**ChatView.tsx:**
- Removed notebook auto-open (notebook panel starts closed; user opens via Created section)
- Added `NOTEBOOK_CARD_TO_CELL` map + `handleNotebookCardClick`: DIM_ACCOUNTS→sql-1, SUPPORT_CASES→sql-2, CALL_METRICS→sql-3, CUSTOMER_FOUND_DEFECTS→sql-4, pendo_nps_enriched→sql-pendo-write, csm_account_mapping→sql-csv-write, customer_health_external→sql-staging
- `onOpenMsItem` in notebook flow routes to `handleNotebookCardClick` (opens notebook + scrolls to cell)
- Passes `onNavigateToWorkspace` through to AgentPanel

**NotebookView.tsx:**
- Added `CellRunResults` component: appears below SQL cells after clicking Run. DIM_ACCOUNTS shows 3 mock account rows; SUPPORT_CASES, CALL_METRICS, CUSTOMER_FOUND_DEFECTS show appropriate 3-row mock tables; other cells show "3 rows returned"
- `ranCells` state tracks which cells have been run
- `highlightCellId` prop now uses `cellRefMap` refs to scroll + pulse (was already built in session 126, now integrated)

**ChatContextPanel.tsx:**
- New "Environment" section: notebook items (type:'notebook') move here; shows green live indicator dot ("Initialized")
- Context section: Snowflake tables now grouped under "Snowflake · N tables" sub-header + "Federated query" note; Pendo API entry appears after pendo_nps_enriched is written (derived from `created` state)
- Created section: notebook and csv-dataset items excluded (notebook → Environment; CSV file not persisted)
- Context tables timing: source tables appear after scan_running phase completes (when AgentPanel emits the 4 table artifact cards and they're added to notebookCreated state via index.tsx)

**index.tsx:**
- `onNavigateToWorkspace={() => navigateTo('workspace')}` passed to ChatView → AgentPanel
- Auto-transition guard confirmed: `&& !isNotebookFlow` correct

**Build:** clean ✓

---

## Next session

**Deploy when ready:** push to both `origin` (galaxy) AND `github` remote, then `vercel --prod`. Vercel watches GitHub, not galaxy — both pushes required.

**3 Anthropic article builds** (still pending, lower priority this sprint):
- Provenance chip in Test mode
- Notebook edit → stale flag
- Unreviewed badge on agent-generated content

---

## Session 125 changes (2026-06-10)

**Single-notebook multi-source flow**

New chip "Multi-source model, single notebook" on Overview — completely separate entry point, existing multi-source flow untouched.

Mental model: the agent drives a shared notebook. Every step it takes (SQL queries, Python API call, CSV upload, staging join, formula) becomes a cell. The notebook is the lineage record. The user can also add cells manually and edit any agent cell.

**Files changed:**
- `NotebookView.tsx` — new component, pixel-matches the CenterPanel notebook tab: SQL/Python cells with run/edit buttons, line numbers, syntax highlighting (SQL keywords in purple, Python imports in purple), output text row, "Add cell" button with SQL/Python/Text options
- `ChatContextPanel.tsx` — exports `NotebookCell` type; no Environment section (was wrong design)
- `ChatView.tsx` — `notebookPanelOpen` state; notebook appears as `CreatedItem` once cells exist; `NotebookView` renders as flex panel (same layout as MultiSourcePreviewPanel)
- `AgentPanel.tsx` — `isNotebookFlow` prop + `NotebookFlowPhase` type + `handleNotebookFlowInput` handler; `notebookCellsRef` accumulates cells and calls `onNotebookUpdate`
- `Overview.tsx` — `onNotebookFlowClick` prop + new chip
- `index.tsx` — `isNotebookFlow` state + `notebookFlowPendingRef` + `handleNotebookFlowClick`

**Notebook flow phases:** `env_init → scan_running → awaiting_sources → awaiting_api_key → pendo_running → awaiting_csv → csv_running → awaiting_staging → staging_running → awaiting_build → building → done`

**Cell types added per phase:**
- scan: 4 SQL cells (one per Snowflake table), each runs sequentially
- awaiting_api_key: Python cell (Pendo fetch) added as pending → runs on key submit
- awaiting_csv: file-upload cell + SQL write cell
- awaiting_staging: SQL JOIN cell (all 5 sources → staging table)
- awaiting_build: Python formula cell (health score) → model builds in workspace

**Build:** clean ✓

---

## Session 124 changes (2026-06-10)

**Multi-source flow polish**

- **Old build progress removed** — `working` message with inline step list removed from `runLiveBuildMultiSource`; only `PlanCardV2` → `BuiltSummaryCard` now tracks build progress
- **Staging step split** — staging-complete message now only shows `customer_health_external` card and stops (phase `awaiting_build_initiation`). User triggers next step; agent then shows "The model will use: ... Ready to build?" with chip (phase `ready_to_build`). Actual build unchanged.
- **CSM_MAPPING_Q2.csv removed from Created panel** — CSV no longer added to Created on consent; only `csm_account_mapping` appears after the Spotstore write completes
- **Duplicate header removed from PlanPanelV3** — "Customer Health Scorecard / v1 · Semantic model plan" hero stripped; tabs now appear immediately when panel opens (building-state progress header retained)
- **Post-build chips hidden** — "Review data quality" and "Switch to test mode" chips no longer appear after multi-source model build

**Feedback items resolved**
- Scan message split: "What other data do you want to bring in?" is now a separate message after the 4 table cards
- DQ chip on artifact cards: "DQ 94" renders as a colored badge (green ≥90, amber 80–89) separated from the base label
- Notebook card now renders before API key input block (render order swapped in MessageBubble)
- `nps_comments` message rephrased: "The notebook pulls NPS responses from Pendo and runs sentiment analysis on the comment text."

**Build:** clean ✓

---

## Session 123 changes (2026-06-09)

**Live animated model build + plan UX from Komal's proto**

- **`runLiveBuildMultiSource`** — replaces `runFlow('ms_build_project')`. Tables appear one by one in workspace (dim_accounts → support_cases → call_metrics → customer_found_defects → customer_health_external, ~1.4s apart). Joins form at ~6.5s. Columns populate table-by-table at ~7.5–12s. Chat steps advance in sync. `awaiting_ms_build` typed-confirm also routes here.
- **`allStepsVisible: true`** — all 6 working steps visible upfront (ghosted); renderer updated to respect this flag.
- **`buildPlanCard` message** — emitted at build start; renders `PlanCardV2` during build and auto-transitions to `BuiltSummaryCard` once `buildStep === 'healthy'`.
- **`ModelArtifactCard`** — clickable card in final execution message (name + "Semantic model" + 5 sources · 18 columns · 1 metric). Clicking navigates to workspace.
- **`PlanCardV2`** — live build tracker: 5-step checklist, progress from ProjectState, editable name (idle only), "Start building" / spinner / done states. No DQ pause — DQ completed at scan+upload stage.
- **`BuiltSummaryCard`** — post-build collapsed plan (green check + model name + "5 steps completed"). Expanding shows sample questions, metric/dimension chips, full step checklist in green.
- **`planSteps` on `MS_PLAN_DATA`** — 5 steps (no DQ): Map joins → Select columns → Build health score formula → ✦ Enrich for AI → Validate build.
- **`confirmItems` on `MS_PLAN_DATA`** — 3 known edge cases (NPS 24% coverage, null resolution_time_hours, account_tier shadowing).
- **`connectionType` on `PlanTable`** — new optional field; `MS_PLAN_DATA` tables updated (4× snowflake, 1× spotstore). PlanPanelV3 renders inline icon (Snowflake blue, Spotstore purple, CSV green) beside connection label.
- **Type additions:** `AgentMessage` gets `allStepsVisible`, `buildPlanCard`; `PlanData` gets `planSteps`, `confirmItems`; `PlanTable` gets `connectionType`.
- Build: clean ✓

---

## Session 122 changes (2026-06-09)

**Komal's modeling flow merged into multi-source (and from-scratch) journeys**
- Reviewed Komal's DataStudioV2 folder; identified 3 diffs: PlanPanelV3, inline plan card, errorChips on OutcomeCard
- Copied `PlanPanelV3.tsx` from Komal's branch; updated `AVAILABLE_COLS` to our 5 Customer Health tables
- Plan card in chat is now inline-expandable (collapsed: model name + goal + "Draft plan" badge; expanded: `PlanPanelV3` at 68vh with 4 tabs: Tables & Columns, Relationships, Formulas, Sample questions — all editable)
- "Build model" button inside PlanPanelV3 footer routes to the correct handler per flow (`multi_source` → `ms_build_project`, `from_scratch` → `build_project`)
- Multi-source `ready_to_build` phase now runs a 2-step working animation, then shows the plan card; new `awaiting_ms_build` phase catches typed confirmations
- `MS_PLAN_DATA` constant added: all 5 Customer Health sources, 4 joins, 18 columns + health score formula, confidence badges, sample questions
- Extended `PlanTable`, `PlanRelationship`, `PlanColumn` types with optional `confidence`, `reasoning`, `cardinality`, `connection` fields
- `ms_build_project` outcomeCard gains `errorChips: ['⚠ 1 DQ flag']`
- Build: clean ✓

---

## Session 121 changes (2026-06-09)

**Multi-source flow — conversation rewrite (more realistic, less scripted)**
- Scan completion: tables + "what other data?" now in one message; `tables_proposed` gate removed
- "Apply this" button removed from all pending actions
- `awaiting_pendo_write_consent` gate removed — "ready to run it?" was already consent; notebook now runs directly
- Notebook added to Created panel at creation (not after write)
- `awaiting_csv_prompt` phase: CSV upload only shown when user says they have a CSV
- `awaiting_staging_decision` phase: staging table not auto-proposed — user says "create staging from these"
- Pre-build confirmation message lists all 5 sources explicitly before model build

**Staging table modal**
- "View SQL" collapsible replaced with **Data | SQL** tabs (matching CDW table tab pattern)

---

## Session 120 changes (2026-06-09)

- **customerHealthData** — 5-account joined output rows with health scores (94%, 64%, 52%, 64%, 70%), wired into `DataPreviewView` in CenterPanel
- **DataPreviewView** — branches on `addedTables.includes('dim_accounts')`: customer health gets its own grid with ƒx-tagged formula columns and % health score; campaign perf untouched
- **C1:** join SQL in `ms_build_project` now drives from `DIM_ACCOUNTS`; Pendo 24% account coverage called out explicitly
- **C2:** derivation comments for `p1_cases_open` and `open_defects` added to formula collapsible
- **C3:** "all data quality checks passed" → one flag message (`resolution_time_hours` null won't affect results)
- **C4:** `account_tier` shadowing noted in column selection step detail
- **C5:** CSV pushed to `multiSourceCreated` only after `awaiting_csv_write_consent` confirm, not on file drop
- **Step 3:** notebook consent trimmed — removed pipeline over-explanation
- **Step 4:** notebook artifact card rendered at point of creation
- **Step 5:** "predicting nps_comments" → "notebook targets nps_comments — ready to run it?"
- Removed navigation suggestion chips from staging compile and CSV consent messages

---

## Session 119 changes (2026-06-09)

- Scan proposal: 4 Snowflake tables now render as **artifact cards** with connection, row count, DQ score (not plain markdown bold)
- Suggestion chips now render **after** artifact cards in MessageBubble (were before — caused #2/#6/#9 from feedback)
- "Yes, set it up" chip fixed — `awaiting_notebook_consent` check broadened with `/set it up/i`
- Pendo write consent: removed hardcoded "2,847" count (not known before fetch runs)
- Staging consent: simplified — removed internal table names and federated query explanation
- **Multi-source chip UX changed:** chip now prefills prompt bar with the suggested text and focuses it — user sends manually. Was: auto-navigate to chat. `multiSourcePendingRef` in `index.tsx` gates the submit handler.

---

## Multi-source model flow — details (session 118b, 2026-06-09)

Full spec at `2026-06-08-multi-source-flow.md`.

All 13 steps built. The flow is fully interactive end-to-end.

**What works:**
- "Multi-source model" pill on Overview triggers the flow
- Phase 1: env scan → 4 Snowflake table cards in context panel, **each with DQ score** (94, 81, 88, 91)
- Phase 2: user specifies Pendo + CSV → **consent gate**: agent proposes notebook, user confirms before creation
- Phase 3: Pendo notebook created → **inline API key input** with "Use saved Pendo credentials" as primary CTA + manual entry fallback
- After API key: agent confirms nps_comments column → **consent gate**: agent asks before writing to Spotstore
- Phase 4: Pendo fetch → **artifact cards** in message (notebook + pendo_nps_enriched, both clickable). **inline file drop zone** in next message
- After file drop: CSV shown as artifact card → **consent gate**: agent asks before writing CSV to Spotstore
- Phase 5: CSV staged → **csm_account_mapping artifact card** in message · **consent gate** before compiling staging table. Agent explicitly says CDW tables are NOT in staging (federated query)
- Phase 5b: staging compiled → **customer_health_external artifact card** in message
- Phase 6: "Build the model" → existing Workspace flow + **validation step** in ms_build_project (row counts, join key coverage, all checks)
- **Source tables sub-section inside Context** (not a separate top-level section) — CDW refs with CDW badge + "Federated query — not copied to staging" note
- **Created section** now shows: notebook, pendo_nps_enriched (spotstore-table), CSV file, csm_account_mapping (spotstore-table), staging table
- Staging table preview panel: **federated query note** + **expandable SQL** with Copy button
- CDW and Spotstore table previews: Schema tab (columns, type, null %, KEY badge), Sample data tab (5 mock rows), metadata strip (owner, last synced, DQ score, description)
- pendo_nps_enriched and csm_account_mapping now have sample rows in mockData
- process_csv_upload: 2 steps only (read + write — join key detection moved to staging compile)
- ColumnsView in Workspace shows `sourceColumn` column only when any column has that field populated

---

## Partial / deferred

- **Expand model (add table)** — `add_returns` script built; wiring partial
- **"Fix all with agent" DQ chip** — visual only, not wired to agent
- **AIRS Generate / Add buttons** — visual only, not wired to agent
- **Manual workflow paths** — intentionally deferred; agentic paths first
- **WorkflowDirectory** — cosmetic only, do not wire without explicit decision

---

## Naming

- The from-scratch flow was called "Day Zero" until session 112. Now `isFromScratch`, `fromScratchPhase`, `runFromScratchSteps`, etc. throughout the codebase.
- The central object is a **model**. The internal type `ProjectState` is a legacy name — do not rename without caution, it is load-bearing across the routing pipeline.
