# Data Studio — Session Log (Archive)

_Sessions older than the last 3. Current sessions live in [CONTEXT.md](./CONTEXT.md)._

---

### 2026-04-23 (session 39)

**Test mode UX research + playground consolidation:**

- Researched testing/validation UX patterns across dbt Cloud IDE + Canvas, Snowflake Cortex Analyst, Looker/LookML, Cursor 3, Hex Notebook, GitHub Copilot Workspace (deprecated), Databricks Genie Code. Full findings in `research/test-mode-ux-patterns.md`.
- Key decision: current `testMode: boolean` (replaces canvas) = Pattern C. Wrong. Cortex Analyst-style persistent split pane with no mode switch is Pattern B — the right direction.
- Built 3 layout explorations: TM1 Always-On (recommended), TM2 Adaptive Shift, TM3 Horizontal Stack. Each covers testing + data preview + SQL + lineage together in one screen.
- Consolidated all playground iterations (v1–v6 + tm1–tm3) into a single `/data-studio/playground` URL with left-side dark nav. Old routes redirect.

---

### 2026-04-23 (session 35)

**Polish pass — data quality modal and column view fixes:**

- **Select dropdowns** — severity and table filters in `DataQualityPlanModal` switched from chip buttons to Radiant `Select` (`size="basic"`) to match search input height and use design system.
- **`✦` hover target** — increased font size 10→12 and added `padding: 2px` on all three transform indicators (null, duplicate, anomaly) in `CenterPanel.tsx`. Easier to hover without precise targeting.
- **LeftPanel order** — Transformations section moved to below Formulas. Order is now: Tables → Joins → Formulas → Transformations.
- Build passes.

---

### 2026-04-23 (session 34)

**Data quality plan modal — built:**

- **`PrepSuggestion` type** replaces `ChecklistItem` — adds `issue`, `fix`, `reason`, `severity`, `checked`, `sql` fields. Exported from AgentPanel.
- **`PREP_SUGGESTIONS`** — 9 scripted suggestions with full semantic content. Sorted High → Medium → Low for display.
- **`DataQualityPlanModal`** — new component in `components/`. Uses Radiant `Modal` (size M3). Intro block + stats pills + sticky filter bar (search, severity chips, table chips) + flat scrollable table. Cosmetically editable fix inputs. Severity badge per row. Sticky footer with "Apply (N)" / "Dismiss".
- **`review_data_quality` script** — changed `checkablePlan` to `reviewPlanCTA: true`. Proposal text updated. Final step detail updated.
- **AgentPanel state** — `checkedPrepItems` replaced by `planModalOpen` + `prepSuggestions` (mutable copy of `PREP_SUGGESTIONS`).
- **Apply flow** — modal Apply calls `handleConfirm()` directly. `prepTransforms` written by mapping `prepSuggestions` → `PrepTransform[]`.
- **Done message** — removed "health score improved" and "AI ready"; now says "Applied N transforms. View and edit in Transformations panel or hover cells."
- **MessageBubble** — `reviewPlanCTA` shows "Review plan" button (opens modal); normal pendingAction shows "Apply this" only when `reviewPlanCTA` is false.
- Build passes.

---

### 2026-04-23 (session 33)

**Prep workflow — built end to end:**

- **Chip renamed:** "Fix data quality issues" → "Review data quality" in `create_metric` and `profile_data` executionSuggestions in AgentPanel.
- **`PrepTransform` type added** to `index.tsx` with fields: `id`, `columnId`, `tableId`, `issueType`, `label`, `sql`. Added `prepTransforms?: PrepTransform[]` to `ProjectState`.
- **`ChecklistItem` type + `PREP_PLAN_ITEMS`** constant added to AgentPanel — 9 items covering null handling (campaign_id, segment, end_date), deduplication (orders, campaigns), anomaly flagging (amount), and date normalization (order_date, signup_date, start_date).
- **`review_data_quality` script** — 5 profile steps, proposal with checkable plan, dynamic execution text that lists applied transforms. Sets `nextStep: 'healthy'` and writes `prepTransforms` to ProjectState on confirm. Routing trigger: `/review.*quality|review data quality|data quality review/`.
- **`AgentMessage.checkablePlan`** — new field on AgentMessage; rendered as a checkbox list in the proposal bubble. Checked state tracked in `checkedPrepItems` in AgentPanel; passed down to MessageBubble.
- **LeftPanel "Transformations" section** — new section below Formulas, appears when `project.prepTransforms.length > 0`. Shows label per transform; SQL in `title` tooltip.
- **ColumnsView `✦` indicators** — on Null %, Duplicates, Anomalies cells when a matching prepTransform exists for `${tableId}:${columnId}:${issueType}`. Tooltip shows the SQL. Raw values unchanged.
- **Key decision:** Transforms section is separate from Formulas. LeftPanel now has: Tables / Joins / Formulas / Transformations.
- **Bug fix (same session):** `build_project` executionSuggestions was `['Switch to test mode']` only — "Review data quality" was never surfaced after a zero-to-one build. Fixed to `['Review data quality', 'Switch to test mode']`.
- Build passes.

---

### 2026-04-23 (session 32)

**Prep workflow — research and design decisions:**

- **Research doc created:** `research/data-prep-workflow.md`.
- **Core decision:** Prep = query-time SQL transformations embedded in the model. Not cached, not pushed to warehouse. Decoupled from caching entirely.
- **No auto-profile on build needed** — stats already visible in ColumnsView by default.
- **No quality banner needed** — per-column stats in ColumnsView are sufficient.
- **"Fix data quality issues" → "Review data quality"** renamed across all executionSuggestions.
- No code built this session — full design and next-up spec written.

---

### 2026-04-22 (session 30)

**AI context auto-populated on zero-shot build (both warehouse and dbt models):**

- **Root cause:** `build_project` and `import_dbt` had a `✦ Enriching for AI` step that was purely cosmetic — no `columnOverridesUpdate` was set, so columns showed empty AI Context after build.
- **Second bug:** The `autoComplete` code path was a simplified branch that didn't apply `columnOverridesUpdate` even if set — only `handleConfirm` did.
- **Fix 1:** Added `columnOverridesUpdate` with AI context for all 14 model columns to both scripts in `AgentPanel.tsx`.
- **Fix 2:** Wired `columnOverridesUpdate` into the `autoComplete` branch of the step-completion handler.
- Columns now arrive pre-populated when the model first appears. Coaching becomes editing, not creation.
- Build passes.

---

### 2026-04-22 (session 31)

**Polish pass — column view, dbt data panel, model view fixes:**

- **CONTEXT.md restructured:** Session log split into `CONTEXT.md` (last 3 sessions) + `SESSION_LOG.md` (archive). CONTEXT.md now 159 lines, always readable in one shot.
- **"Properties" button rename:** Column visibility toggle in ColumnsView was labeled "Columns" — misleading. Renamed to "Properties".
- **"No AI context" color fix (ModelView):** Per-column label and section header count changed from `content-warning` (yellow) to `content-secondary` (gray).
- **dbt data panel — read-only treatment:** `+` button disabled for dbt; "dbt" pill badge added; model name row added; Formulas section shows computed columns with syncStatus and inline broken/degraded icons; "Review issues" CTA removed from `import_dbt` executionSuggestions.
- Build passes.

---

### 2026-04-22 (session 29)

**Polish pass — new project page, prompt bar, model view columns search:**

- **Workflows menu removed** from Overview (FAB button, `showWorkflows` state, `WorkflowDirectory` import all deleted).
- **New project page redesign:** background → white; agent icon + heading + subtitle; suggestion tiles → pill chips (horizontal, wrapping); `← Back` button wired.
- **PromptBar landing-page mode:** no toolbar divider, lighter stroke, bigger padding, `rows={2}`, `fs.md` font.
- **Agent empty-state suggestions** now match landing page (same 3 strings).
- **Model view — column search:** search input in Columns section header; filters by name + description; `×` clear; "no columns match" empty state; warning badge hidden while searching.
- Build passes.

---

### 2026-04-22 (session 28)

**Agent panel drag-to-resize:**

- `agentPanelWidth` state in Workspace (default/min 340, max = `window.innerWidth - 340`).
- Drag handle: 5px invisible zone with `cursor: col-resize` between CenterPanel and AgentPanel. Inner 1px line is border-colored at rest, turns `#2770ef` on hover and while dragging.
- Mouse logic on `window` (added/removed in `useEffect` while `isDraggingAgent`): `onMove` clamps new width, `onUp` clears drag state + restores `body.cursor` and `body.userSelect`.
- `width` prop added to AgentPanel (default 340); both collapsed and full-panel root divs use it. `borderLeft` removed from AgentPanel root divs — the handle renders the visual separator.
- AgentPanel remains always-mounted (display:none when hidden) so internal refs survive toggle.
- Build passes.

---

### 2026-04-22 (session 27)

**Model View overhaul — Info tab + Overview cleanup:**

- **Overview projects table:** Removed chip styling from Issues (now icon + label text) and Status (plain text). Published/Draft both use secondary color — no green chip. View all links left-aligned, bumped to `sm` font.
- **Alert routing fixed:** `openModelView` now always derives the active alert from `project.issues[0]` — no longer depends on how you navigate. Row click and badge click show identical Model View.
- **Alert banner removed:** Top-of-page AlertBanner removed. Sync failure surfaces only in the Source block's Last sync row (inline, with error icon + "View log" modal + "Retry now" button). Retry state lifted to ModelView and shared.
- **Model View header redesigned:** Fixed-height single row → flexible two-row block. Top row: back · name · Published chip · [spacer] · avatar + author · "Last updated on {date}" · divider · ··· · share · ✦ Edit model. Description row below as single truncating line.
- **Source section added to Info tab (both model types):** `ModelDetails` now has `source: 'warehouse' | 'dbt'`, `syncInfo`, `warehouseInfo`, `hidden` on columns. dbt models show Type / Project / Sync schedule / Last sync (with failure state). Warehouse models show Type / Database / Tables (comma-separated, ≤3 + View all) / Joins (same).
- **Tables + Joins hidden for dbt models:** Folded into Source block for warehouse; not shown at all for dbt (dbt owns that structure).
- **About section moved to header:** Removed from Info tab body — description + metadata always visible regardless of active tab.
- **Column cards redesigned:** Flat list (no per-table grouping). Card: name + type label (attribute/measure; metric→formula for computed) on row 1; source table · description on row 2. Hidden columns filtered. `hidden?: boolean` added to `ModelColumn` interface. Group headers: Formulas · N and Source columns · N.
- **Mock data:** Dates reformatted to "20 April" style. proj-sp author changed to Sara Chen.
- Build passes.

---

### 2026-04-22 (session 26)

**Overview screen redesign — alerts moved into projects table:**

- **Research:** Surveyed alert taxonomy across Omni, Hex, Sigma, dbt Cloud, Monte Carlo, PagerDuty, Metaplane. Bucketed alert types by user impact: breaks end user (sync_failure, schema_change breaking), creates stale answer (data_freshness, cache_failed), gives inaccurate answer (metric_anomaly, schema_change non-breaking, missing_data).
- **Design decision:** Removed separate alerts section from overview. Alerts now live as an Issues column in the projects table — single issue shows type name as a badge, multiple shows count. Clicking the badge navigates to Model View with the alert pre-surfaced (existing AlertBanner handles it — no InfoTab change needed).
- **Alert types added:** `data_freshness` added to `OverviewAlert` type union and `ALERT_BANNER_LABELS` in ModelView.
- **3 projects with issues:** proj-sp (Sync failure · critical), proj-3 (Schema change · critical), proj-6 (Data freshness · warning). 7 projects healthy.
- **Projects expanded to 10:** proj-mc (no issues, for expand demo), proj-sp (sync failure, for monitor/fix demo) at top. Added proj-6 through proj-10.
- **Explore data:** Renamed from "Data". Expanded to 10 tables with richer source info (connection includes schema name). "View all data" link added.
- **View all projects** link added below projects table.
- **Row hover states** added to both tables (was missing).
- `OVERVIEW_ALERTS` flat array removed from mockData — alert data now embedded directly in `OverviewProject.issues[]`.
- Build passes.

---

### 2026-04-22 (session 25)

**Canvas-to-agent interaction — row-level click pattern + scripted broken column fix demo:**

- **Research:** Surveyed canvas-to-agent patterns in Bolt, Cursor, Figma Make, Lovable, v0, spreadsheets. Full findings in `research/canvas-agent-interaction.md`.
- **Design decisions:** Row-level only (not cell-level) for the demo — cell-level deferred. Hover-only ✦ spark on column name cell (top-right corner, no overlap with badges). Clicking any column name injects `@column_name ` into agent input + focuses agent panel + opens it if closed.
- **Implementation:** New `onInjectToAgent` prop chain (CenterPanel → Workspace → AgentPanel). `injectInput` prop on AgentPanel calls `promptBarRef.current?.setValue()` without submitting. Separate from existing `onSendToAgent` (which auto-submits).
- **Broken column scripts:** `fix_campaign_roas` (cross-model ref: `fct_campaigns.total_revenue` → `orders.amount / campaigns.spend`) and `fix_days_to_convert` (column rename: `purchase_date` → `order_date`). Both routed by `/@column_name\b/` regex before `matchScript`. On confirm: `syncStatus` written to `columnOverrides`, badge disappears.
- **SQL moved to collapsible:** Proposal messages no longer contain SQL blocks — SQL is in the "Show work" collapsible on the last step only.
- **dbt entry card fix:** Clicking the dbt suggestion tile now fills the prompt bar and marks `projectSource: 'dbt'` without navigating to workspace. User submits the prompt themselves.
- Build passes.

---

### 2026-04-22 (session 24)

**dbt script corrected + icon polish:**

- `import_dbt` steps rewritten to mirror `build_project` structure: Understanding requirements → Finding relevant datasets (finds dbt model during scan) → Translating → ✦ Enriching → Flagging issues. Natural language tile text ("Measure campaign ROI across channels and segments") is now the actual initialPrompt — no internal token.
- Routing: `__DBT_IMPORT__` token removed. `processText` branches on `project.projectSource === 'dbt'` at the `buildStep === 'empty'` gate.
- Broken/Degraded icons: both now use exclamation-mark SVG (vertical bar + dot) — red for broken, amber for degraded. No text chips.
- Issues chip: `✗` → `⚠` in both header bar and outcome card errorChips.
- "Synced from dbt" + issues chip moved to right side of columns header (before column count).
- Build passes.

---

### 2026-04-22 (session 23)

_(No changes — planning session.)_

---

### 2026-04-22 (session 22)

**dbt additions ported to demo (surgical changes only):**

- `AgentPanel.tsx` — added ✦ Enriching for AI step to `build_project` SCRIPTS. Now part of all zero-shot builds.
- `CenterPanel.tsx` — `AI Context` and `Synonyms` column headers now show `✦ AI Context` / `✦ Synonyms`. Added conditional Broken/Degraded badge next to column name (same PII badge style). Click fires `onSendToAgent` with column @-mentioned and reason pre-loaded.
- `Workspace.tsx` — wired `onSendToAgent` prop on `CenterPanel`.
- `mockData.ts` — added `syncStatus?: 'ok' | 'broken' | 'degraded'` to `ColumnMeta` interface.
- Build passes.

---

### 2026-04-22 (session 21)

**Section 11 playground alignment (CSS/HTML only — no demo files touched):**

- Agent panel: avatar gradient corrected to demo blue (#2770ef → #5b9ef4), pulse animation matched, step label 13px → 14px, all running steps now get gradient text (not just enrich), connector 1px → 2px, dot 7px → 8px, spinner 11px → 12px/#2770ef, "Show work · 4 steps" → "Show work" (no step count), suggestion chips moved outside outcome card as pill buttons (matching demo SuggestionChips pattern).
- Column view: th padding 8px 12px → 8px 16px, font-size 11px → 12px, weight 600 → 500, background bg-subtle → bg-sunken, letter-spacing 0.04em → 0.5px; td padding 10px 12px → 8px 16px, vertical-align top → middle, removed explicit font-size; column name font-family:monospace removed.
- Decision: playground review step is complete. Next session ports the two dbt additions directly to the demo.

---

### 2026-04-22 (session 20)

**Republish wizard migrated to DS `WizardModal` component:**

- `RepublishWizard` now uses `WizardModal` as the shell — Escape key, `body.overflow:hidden`, `background-sunken` footer, progress bar all free from DS.
- Step 1 `validate()` gates Continue instead of `disabled` button.
- `Badge` and `TypeBadge` switched to DS tokens (`background-success/warning`, `content-success/warning`, `background-information`, `content-brand`). No more hardcoded hex.
- AI context count now reads actual `columnOverrides` — shows "All columns described" after coaching instead of always 78%.
- `joinCount` fallback fixed (no more `|| 2`).
- Double toast bug fixed — `showToast` was inside `setProject` functional updater (React StrictMode calls updaters twice). Moved outside in both `RepublishWizard` and `PublishModal`.

**dbt import — research + design decisions:**

- Research doc saved: `research/semantic-model-import-sync.md` — covers import/translation and sync mechanics for Hex, Omni, Sigma, ThoughtSpot TML, Snowflake Cortex, dbt, Cube.
- Demo platform chosen: **dbt Semantic Layer**.
- Design decisions locked:
  - **Two-layer model**: dbt = base layer (synced), ThoughtSpot = enrichment overlay (never overwritten by sync).
  - **AI enrichment as standard step** in ALL zero-shot builds (table build + dbt import) — not just import. Makes ThoughtSpot's contribution visible in the agent working steps.
  - **Column view additions**: Broken/Degraded badge inline in column name (same style as PII badge). No status icon on clean rows. ✦ sparkle on AI Context and Synonyms column headers only.
  - **Fix workflow**: clicking Broken/Degraded badge focuses agent panel with column @-mentioned and reason pre-loaded. No inline fix panel.
  - **Sync lives in Model View** (Info tab), not workspace. Happy path: stays connected to dbt forever.
  - **"Review issues" = suggestion chip** below outcome card (not a button inside the card). Routes to agent fix flow.
- Section 11 added to playground.html — A-i (table build with ✦ enrichment), A-ii (dbt import), B (column view with Broken/Degraded badges). Reviewed and corrected in session 21 before porting.

---

### 2026-04-22 (session 19)

**Situation 4 polish + republish wizard fixes:**

- **`returns` added to `WAREHOUSE_TREE`** in `PromptBar.tsx` — was missing, so `@returns` couldn't autocomplete or be recognised.
- **`runDirectAdd` enriched** — was 2 bare steps, now 3 steps with detail text (locating → schema/row counts → column metadata) and proper timing (700 / 1300 / 2000ms).
- **`add_returns` proposal updated** — now covers all 3 actions in one confirm: add table + create join + populate columns. Proposal text says "add the table, create the join, and populate the columns". SQL removed from proposal text (stays only in work step collapsible). `additionalColumns` field added to SCRIPTS interface; `handleConfirm` merges it into `includedColumns`.
- **Republish wizard** — action selection simplified to compact radio rows (no bordered cards). Back button added to step 2 footer (left side); Cancel + Publish model on right.

---

### 2026-04-22 (session 18)

**Situation 4 — Expand model built:**

- **`returns` table added** to `tableMetadata` in `mockData.ts` — 6 columns (return_id, order_id, return_date, return_reason, amount, return_status), ~1,240 rows, 14% null on return_reason.
- **`add_returns` script** added to `SCRIPTS` in `AgentPanel.tsx` — 4-step work ladder (lookup → schema → find join path → found join with SQL collapsible). Proposal asks user to confirm join. On confirm: adds returns to `addedTables`, sets `preserveStep: true`, suggests "Switch to test mode".
- **`@returns` routing** added in `processText` (before @mention check) — fires `add_returns` when `buildStep === 'healthy'` and `returns` not yet in model.
- **Agent greeting** — new `useEffect` on mount: when `buildStep === 'healthy'` and no `initialPrompt`, agent opens with "What would you like to do today?" + chips: Add a table · Create a formula · Add AI context.
- **Republish wizard** (`RepublishWizard` component in `Workspace.tsx`) — shown when `publishedVersion > 0`. Step 1: dependents table (4 mock entries, type/owner/lastViewed), radio selection (Detach all / Delete all), Continue CTA disabled until selection. Step 2: review summary table (same fields as original PublishModal) + Publish model CTA.
- **`setHasShared` bug fixed** — stale reference removed from ShareModal `onShared` callback.

---

### 2026-04-22 (session 17)

**Model View — Info tab rebuilt:**

- **Manifest direction chosen** — linear document: About card → Columns → Tables → Joins.
- **`ModelColumn` interface added** to `mockData.ts`. `ModelDetails.metrics` replaced by `ModelDetails.columns` (type: `'attribute' | 'measure' | 'metric'`, includes `formula?`, `description?`, `aiContextSet`).
- **`proj-mc` columns** — 18 total (2 computed: Return on Spend, Conversion Rate; 5 orders; 7 campaigns; 4 users). `campaigns.start_date` and `campaigns.end_date` have `aiContextSet: false` — drives the "2 missing AI context" summary. `proj-sp` columns added similarly (4 missing).
- **InfoTab redesign** — full-width (no maxWidth: 720). About section is a card (description body + subtle-bg metadata footer). Columns section: overline summary "Columns · 18 · ⚠ 2 missing AI context"; grouped by Computed → source tables; per-row: type badge + name + formula/description + "⚠ Missing AI context" label when missing. Tables and Joins stacked (not side by side — tried 3fr/2fr grid, reverted per feedback).
- **Research saved** — `research/semantic-model-views.md`.

**Usage tab — Cache promotion banner:**

- Blue info banner at top of Usage tab: "Caching this model can increase Spotter's response speed and reduce querying costs." + "Cache now" (primary) + "Learn more" (outlined).
- "Cache now" opens `CacheSetupModal` lifted to ModelView level. On enable: sets `cacheEnabled` state, closes modal, switches to Cache tab. `CacheTab` accepts `defaultEnabled` prop so it mounts in active state when navigated from banner.
- Run history table now full width (removed `maxWidth: 640`). "Edit settings" button moved inline with "Cache settings" overline (right-aligned), removed from below the card.

---

### 2026-04-22 (session 16)

**Design system fixes — ModelView.tsx:**

- All hardcoded hex colors replaced with DS tokens: `c['content-success/warning/failure']`, `c['background-success/warning/failure']`, `c['border-warning/failure']` throughout AlertBanner, Usage badges, Cache badges, Quality tab, header Published badge.
- Raw `<button>` tabs → DS `Tabs` component. `type Tab` renamed `TabId` to avoid collision with DS `Tab` interface.
- Raw `<button>` "View log" / "Retry sync" in AlertBanner → `Button variant="tertiary/secondary"`.
- Schedule picker raw buttons → `SegmentedControl`. Data range `<input type="radio">` → `Radio`. Quality progress bars → `ProgressBar`.
- `fontSize: 11` → `fs.xs`, `fontSize: 22` → `fs['2xl']`, `fontSize: 32` → `fs['3xl']`. Hardcoded `borderRadius` → `radius.*` tokens.

**Layout fixes — ModelView.tsx:**

- Usage tab: removed `maxWidth: 720` — stat cards and conversation table now fill full width.
- Cache empty state: centered vertically + horizontally with `flex: 1 / align+justify center`, fixed `width: 480` card. Tab body container made flex column.
- Share + Edit model buttons: replaced DS `Button` with hand-rolled 26px buttons matching Workspace header spec. Share = icon-only 26×26 (share graph SVG). Edit model = blue 26px primary with pencil icon.

**Info tab explorations — playground.html Section 10:**

- 3 structural explorations: A (Manifest — linear document), B (Cockpit — sidebar + main), C (Record — summary header + expandable rows).
- Metrics corrected: 1 metric = 1 column/measure. No health score, no healthy/warning badges on metrics, tables, or joins. Quality is a column/metric property only.

---

### 2026-04-22 (session 15)

**Coaching — AI context written via coaching flow:**

- **Stripped all `aiContext` from `mockData.ts`** — all columns now start null. Columns view shows empty AI Context cells before coaching runs.
- **`debug_context` confirm** writes `users.segment` AI context into `columnOverrides`.
- **`debug_context_bulk` confirm** writes all 18 columns (orders: region, status, product_category, order_date; campaigns: channel, spend, budget, impressions, target_region, start_date, end_date; users: segment, signup_date, lifetime_value, country, age, email). Merges into existing overrides — inline edits preserved.
- **`columnOverridesUpdate`** field added to Script interface; `handleConfirm` applies it via `Object.entries` reduce.

**Columns view mount transition:**

- Added `visible` state + 16ms `setTimeout` effect to `ColumnsView`.
- Outer wrapper fades in (`opacity 0→1`) and slides up (`translateY 8px→0`) over 220ms ease. No more hard pop on tab switch or post-build reveal.

---

### 2026-04-22 (session 14)

**Left panel overlay polish:**

- Shadow reduced to `1px 0 4px rgba(29,35,47,0.06)` (DS-toned, matches `shadows.sm` weight).
- Shadow clipped to right edge only via `clipPath: 'inset(0 -20px 0 0)'` — no top/bottom bleed.
- Backdrop reduced to `rgba(0,0,0,0.04)`.
- Info icon (ⓘ) removed from workspace header next to Draft badge.

**Spotter test mode — agentic animation:**

- Steps now reveal one-by-one (600ms interval) instead of all at once.
- Last step shows spinner + gradient label while running; green dot + muted label when done.
- Connecting lines turn green as steps complete (matches AgentPanel).
- Typewriter effect on step descriptions (`SpotterTypewriter`, 14ms/char).
- Answer (title, desc, chips, chart) gated on `answerRevealed` — fades in after all steps + 500ms.
- `ds-step-in`, `ds-spin`, `ds-gradient-text` keyframes added to Workspace style block.
- `SpotterSpinner` and `SpotterTypewriter` components added (mirrors AgentPanel).

**Issue Inspector (Spotter test mode):**

- Replaced flat issue banner with named `IssueInspector` component.
- Collapsed: magnifying glass icon + "Issue Inspector · N issues found".
- Expanded: per-issue card — type badge (Context/Data quality/Structure), title, description, CTA.
- Happy path: green "No issues found with this answer" banner.
- `SpotterIssue` interface extended with `title`, `column`, `ctaLabel`.
- Download button moved below Issue Inspector (was inside chart card).

**Data Preview — full joined table:**

- Preview now joins orders + campaigns + users into one flat table.
- Imported `campaignsData` and `usersData`; LEFT JOIN on campaign_id and user_id.
- Columns shown: all included columns across all 3 tables + computed columns.
- Spreadsheet-style redesign: `background-sunken` header, monospace data cells, `3px 10px` padding, no alternating stripes, frozen row number column with `2px` border.
- Toolbar replaced with pagination bar: `1–100 of 150 rows` + `‹ 1 / 2 ›` prev/next.

**Publish modal — P1 design:**

- New design: proper close button (28×28 SVG X), summary table (Tables, Joins, Metrics, AI context, Data prep, Caching), "Publish Model" CTA.
- All rows default to "Not configured" for prep and caching.
- "What happens" section removed per feedback. Divider above first table row removed.
- Republish wizard (P3) deferred.
- 5 publish modal explorations added to `playground.html` Section 9 (P1–P5).

---

### 2026-04-22 (session 13)

**Publish/Share redesign:**

- **Replaced `published: boolean`** with `publishedVersion: number` (0 = never published) + `hasUnpublishedChanges: boolean` in `ProjectState`. New projects start with `publishedVersion: 0, hasUnpublishedChanges: true`. Published projects open with `publishedVersion: 1, hasUnpublishedChanges: false`.
- **Publish button is now conditional** — enabled (blue) only when `publishedVersion === 0 || hasUnpublishedChanges`; disabled (muted gray) when in sync with published. Applies in both build and test modes.
- **Share is now a persistent icon-only button** (26×26) visible in all modes — edit, test, and model view. No longer a text button; no "Shared/Unshared" state.
- **Badge is now conditional** — shows "Draft" badge when diverged; shows `v{n}` as subtle secondary text when in sync with published.
- **Post-publish toast** now shows `Published v{n}` with an inline `Share →` nudge.
- **ShareModal extracted** to `components/ShareModal.tsx` — now shared between Workspace and ModelView.
- **ModelView Share button** now opens the same ShareModal.
- **useEffect in Workspace** watches `buildStep` and `addedTables.length` to auto-set `hasUnpublishedChanges: true` when model changes after a publish.
- Research filed: `research/publish-share-ux.md`.

---

### 2026-04-22 (session 12)

**Implemented C-iii agent work display in `AgentPanel.tsx`:**

- **Per-step timeline:** Steps only appear when the one above completes (no pre-rendered pending steps). Each step fades in with `ag-step-in` (opacity + translateY). Dot: gray=pending (hidden), spinner=running, green dot=done. 2px connecting line animates green as each step finishes.
- **Avatar:** Pulses (orb glow) + sparkle rotates while any step is `running`. Stops when all done.
- **Show work toggle:** "▶/▼ Show work" (no step count). `fs.sm` (14px).
- **Typewriter descriptions:** Step detail types out at 14ms/char while step is `running`. Snaps to full text on `done` so re-reading via "Show work" is instant.
- **SQL on demand (C-iii):** `build_project` steps now have `collapsible` SQL for 4 of 5 steps — table scan, joins, column selection, metric formulas. "View SQL" toggle per step.
- **Outcome card:** After steps collapse for `build_project`, response shows 2-line summary text then a card (model name + chips: 3 tables · 2 joins · 18 columns — no issues chip). Suggestion chip "Switch to test mode" below.
- **Scroll fix:** Scroll-to-bottom only fires on `messages.length` increase, not step mutations.
- **Font sizes:** Step labels `fs.sm` (14px), details `fs.xs` (12px). Gradient on running only.

---

### 2026-04-22 (session 11)

**Agent work display research + playground explorations (Section 8):**

- Researched how Claude, Cursor, Lovable, Hex Threads, Databricks Genie, and Snowflake Cortex display agent reasoning. Built three animated explorations in `playground.html` Section 8 — all C-style (conversational), varying on SQL treatment: C-i (no SQL), C-ii (SQL inline), C-iii (SQL on demand via toggle).
- **Decision: C-iii** — title + description + "View SQL" on demand. Matches analyst audience. Steps appear dynamically (no fixed list). No plan-first approval for 1-shot builds.
- Research filed: `research/agent-work-display.md`.

**Minor workspace enhancements:**

- Data panel (LeftPanel) now covers full height below headers (`position: fixed`, `top: 96px`) with `height: 100%` on LeftPanel root.
- Removed "Data Agent" header and collapse `»` button from AgentPanel (toggle now lives in subheader).
- Data toggle button disabled (`opacity: 0.4`, `cursor: not-allowed`) during `isBuilding`.

---

### 2026-04-22 (session 10)

**Fixed BuildingSkeleton loading state:** `BuildingSkeleton` had a hardcoded 240px left-panel skeleton rendered alongside the center illustration — a relic from the old layout. Caused two simultaneous loading animations and a dark vertical bar (the panel's `border-right`). Removed the left panel skeleton entirely; loading state is now a single full-width centered illustration + tips. Also removed the `ds-pulse` animation keyframes (no longer needed).

---

### 2026-04-22 (session 9)

**Workspace header split into header + subheader:**

- **Main header (56px):** Back · project name · badge · ⓘ on left. Warehouse · settings · divider · Test · Share · Publish on right. No toggles or tabs.
- **Sub-header (40px):** Three equal-weight zones — `Data` toggle button (left, width:120), tabs pill (center, flex:1), `✦ Data Agent` toggle button (right, width:120). Both toggles: `height:28`, `border-brand`+`background-information` when active, `border-default`+transparent when inactive. Hidden in test mode except for center (shows Spotter/Search Data instead of tabs).

---

### 2026-04-22 (session 8)

**Workspace layout restructure — columns as hero:**

- **Left panel hidden by default.** Toggle icon (left-sidebar icon) in header, adjacent to back button. Active state: `background-information` + `border-brand`. Opens as absolute overlay with semi-transparent backdrop; clicking backdrop closes it. Sending a message to the agent from the panel auto-closes it.
- **Agent panel collapsible.** Toggle icon (right-sidebar icon) in header, in the right actions group. Active state matches left panel toggle. Always mounted (display:none when hidden) so AgentPanel refs survive.
- **Tabs elevated to top-level.** `activeTab` type changed from `'visualizer' | 'preview' | 'notebook'` to `'columns' | 'tables' | 'preview' | 'notebook'`. Header tabs: Columns | Tables | Data Preview | Notebook. Internal Tables/Columns sub-toggle inside VisualizerView removed. `VisualizerView` replaced by `TablesView` (diagram only). `ColumnsView` now routed directly from `activeTab === 'columns'`.
- **CenterPanel is full-width** — no fixed 240px left margin. LeftPanel overlay floats over the content.

---

### 2026-04-21 (session 7)

**Columns view design system alignment:** Replaced all hand-rolled table styles with DS standards.

- Header: `background-sunken`, uppercase + letterSpacing, `sp.D` horizontal padding.
- Row hover: `background-sunken` (was `background-subtle`); selected row: `background-information` (was `background-subtle`).
- Inline edit inputs: `border-default` at rest → `border-brand` on focus only; `radius.input` (6px); `fs.sm` + `fw.light`.
- Search box: replaced custom div+input with DS `SearchInput` component.
- Column visibility trigger: replaced raw `<button>` with DS `Button variant="secondary" size="small"`.
- Column visibility panel: DS `Checkbox` components; overline-style section headers.
- Dropdowns (Column type, Aggregation, Format): replaced raw `<select>` with DS `Select size="small"` via `SelectCell` local wrapper.
- Checkboxes (Additive, Hidden): DS `Checkbox` via `CheckboxCell` local wrapper.
- Row selection checkboxes + select-all: DS `Checkbox` with `indeterminate` support.
- PII badge: `background-failure` + `content-failure` tokens (was hardcoded hex).
- Bulk action bar: DS token colors, `fs.sm` font size.

---

### 2026-04-21 (session 6)

**Verified and fixed coaching flow (full path working):**

**Bug 1 — Missing "Apply this" button:** After the coaching proposal appeared in AgentPanel, there was no confirm button — only text. `MessageBubble` (response type) never rendered anything for `msg.pendingAction`. Fix: Added `onConfirm` prop to `MessageBubble`; passes `handleConfirm` only when `msg.pendingAction.key === pendingAction?.key` (active pending message). "Apply this" button renders inline below the proposal text.

**Bug 2 — "undefined" text in execution message:** `handleConfirm`'s `setInterval` used `i` (a `let` closure variable) inside `setMessages`'s functional update. In React 19 with batched updates, the functional update is deferred — by the time React calls it, `i` has already been incremented by `i++`. For `debug_context` (1-line execution string), `lines[1]` is `undefined`, JS-coerced to the string `"undefined"`. Fix: Snapshot `const ci = i` before `setMessages`; functional update reads `ci` instead of `i`.

---

### 2026-04-21 (session 5)

**Diagnosed and fixed two coaching double-trigger bugs:**

**Bug 1 — AgentPanel remount:** `AgentPanel` was inside `{!testMode && ...}`, so switching back from test mode caused a fresh mount. `initialPromptFiredRef` reset to `false`, causing the initial build prompt to re-fire. With `buildStep = 'healthy'`, "Analyze campaign performance..." routed to `find_tables` (28s) instead of `build_project` — appearing as a stray "I found 3 tables" mid-coaching. Fix (`Workspace.tsx`): AgentPanel is now always mounted; test mode hides it with `display: none`. Refs survive.

**Bug 2 — React StrictMode double-effect:** `useEffect([externalMessage])` fires twice in development (StrictMode). Both invocations see `isProcessing = false` before state commits, so `processText` ran twice → coaching flow fired twice → duplicate proposals, duplicate user messages, "undefined" render artifacts. Fix (`AgentPanel.tsx`): Added `lastHandledExternalRef` — second invocation sees ref already set to the same message and returns early.

Also in this session: Ported Spotter answer card design to TestModePanel.

---

### 2026-04-21 (session 4)

Ported Spotter answer card design from `playground.html` Section 7 to `TestModePanel` in `Workspace.tsx`. User question = gray bg block with Avatar + timestamp. Agent answer = white bg block with Show work timeline (bullet + connecting line + tool call cards + timing step), answer title + description outside the card, answer card with chips (measure/attribute/filter) + view switcher + ReactECharts bar chart (green `#1AA251`, data labels) + Download-only action bar. Issue banner (Q2) open by default, "Update AI context" CTA routes to onDebugIssue coaching flow. Updated SPOTTER_ANSWERS schema: replaced flat workingSteps with rich WorkingStep objects; added answerTitle, answerDesc, chips, chartData.

---

### 2026-04-21 (session 3)

Built Spotter answer card reference design in `playground.html` Section 7. Covers user message (gray bg block), agent answer (white bg, Show work timeline with connecting line + tool cards), Chip components with filter icon, ECharts bar charts in Spotter green, Download-only action bar, and issue banner with "Update AI context" coaching CTA. Design finalized and ready to port to TestModePanel.

---

### 2026-04-21 (session 2)

**Built/fixed:** Columns view — sticky scroll shadow (gradient overlay, not box-shadow which is clipped in border-collapse tables), FK deduplication (campaign_id/user_id removed from orders.includedColumns, follows Looker/Hex pattern), flat alphabetical sort restored, table grouping removed. Auth settings fixed (apiKeyHelper removed, DISABLE_COMPACT added). CONTEXT.md restructured: demo script moved to SCRIPT.md, Next up + Session log sections added.

**Research filed:** `research/fk-column-deduplication.md`
