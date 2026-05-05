# Data Studio — Project Status
_Single source of truth for this prototype. Update as decisions are made._

---

## Next up

**Phase 2** → `knowledge/phase-2.md` — eight concrete tasks. Strategy memo at `research/phase-2-manage-iterate.md` is reference background, not the build plan.

1. Move agent prompt from inside project to Data Studio overview page
2. Add example task chips on the overview page (build, debug, modify, monitor)
3. Add a connection step at the start of the building flow
4. Show caching as a step in the building flow
5. Show how dbt models are imported in the dbt build flow
6. Trigger editing via an optimization use-case (agentic)
7. Show a debugging + monitoring use-case (agentic)
8. Increase the agent panel's default width

Deferred build tasks (from session 47 audit, still valid):

- **Source column name** — add as a separate column in ColumnsView (currently merged with "Column name"). Needed for rename support.
- **Agent context bridge** — "Ask agent" buttons on Data Preview rows + Notebook cells. Deferred, additive, low-risk.
- **Data Quality tab in Model View** — where prep transforms surface in the in-use state (status per cache run). Not yet built.

Needs PM input before building:
- Blank count vs. null count — same column or separate?
- Anomaly count — absolute row count or percentage?
- Caching + prep interaction — does cached data include query-time transforms, or are transforms applied to cached data at query time?

---

## Where things live

Quick reference. When you need X, this is where to look.

| Need | File / folder |
|---|---|
| `DataModel` type + supporting interfaces (validationIssues, rls, healthStatus, etc.) | `data/types.ts` |
| Mock data — tables, projects, scenarios, conversations, alerts | `data/mockData.ts` |
| Agent panel + the SCRIPTS map (22 entries) that drives all skills | `components/AgentPanel.tsx` |
| Skill catalog — 28 skills across 10 groups | `knowledge/skill-map.md` |
| Per-skill reasoning chains + output states | `knowledge/agent-architecture.md` |
| Users, platform constraints, confirmed patterns | `knowledge/users.md` · `platform.md` · `patterns.md` |
| Routing pipeline + load-bearing rules | `reference.md` + `CLAUDE.md` Hard rules |
| Why we made a non-obvious call | this file → Decisions log |

---

## Decisions log

Non-obvious calls, with date and brief rationale. Add an entry when you make a decision that future-us might not infer from the code.

- **2026-05-05** — Migrated `DataModel` type, skill catalog, and per-skill reasoning architecture from DataStudioVision into V2. Reason: V2 has the core working flow; the Vision restart turned out to be unnecessary. V2 is now the single home for future work; Vision branch goes quiet.
- **2026-04-30** — Embedded `formula` inside `columns[]` rather than a separate `formulas[]` array on `DataModel`. Reason: ThoughtSpot formulas are derived columns, so they belong with their column kind (`'metric'`).
- **2026-04-30** — Push only to `origin` (vivek-sahi fork). Never to `upstream` (mohammed-faris). Reason: don't have write access; team pulls from Vivek's fork.

---

### What's built (session 45):

**Human-in-the-loop coaching flow — fixes + polish:**

- **Build handoff fixed** — "Fix in build →" now injects a user message bubble into the Build chat: `"I tested '[question]' — [category]."` The agent starts working immediately after (no blank state).
- **Per-category coaching fix scripts** — 5 new `SCRIPTS` entries (`coaching_time_period`, `coaching_number_wrong`, `coaching_wrong_columns`, `coaching_join_wrong`, `coaching_something_else`). All `autoComplete: true`, `stepDelay: 800`. Each is targeted — no more generic "17 columns" scan.
- **Correct/Incorrect action bar** — merged into a single row: ✓ Correct · ✗ Incorrect on the left, Download on the right. "Was this correct?" label removed. After correct: "✓ Correct" in green in the same slot.
- **"Switch to test mode" suggestion removed** from coaching fix scripts — no suggestion shown after the fix.
- **Selected row highlight** — clicking a column row now shows a full-row `background-subtle` highlight (lightest grey token). All cells show the selection (removed `backgroundColor` from `tdStyle()` so `<tr>` color shows through). Sticky first column cell still has an explicit solid background.
- **Impressions synonym workflow** — select `impressions` row, type anything with "synonym", "views", or "visits". Agent runs 3 working steps and writes `views` + `visits` as synonyms to `columnOverrides.impressions.synonyms`. Appears immediately in Synonyms column.
- Build passes.

---

### What's built (session 44):

**Human-in-the-loop coaching flow (Situation 3):**

- **Issue Inspector removed** — replaced with a cleaner human-driven feedback model. No more auto-detected issue cards in test mode.
- **Correct / Incorrect feedback buttons** — appear on every AI answer after it's revealed. "Correct" shows a "✓ Marked correct" confirmation. "Incorrect" opens the coaching flow.
- **Coaching question step** — agent responds "Got it. What went wrong with this answer?" with 5 chip options: The number is wrong · The time period is wrong · The wrong columns or tables are being used · The join between tables is wrong · Something else. Selected option highlights blue; others dim and lock.
- **Debug working animation** — 3 scripted working steps per category animate in (700ms each), followed by a diagnosis sentence. Different steps per category.
- **Two CTAs** — "Continue testing" (dismisses, user keeps asking questions) and "Fix in build →" (switches to Build tab and pre-seeds the right coaching fix script with question context).
- **No other flows disturbed** — build tab, all workflows unchanged.
- Build passes.

---

### What's built (session 39):
- **Test mode UX research** — deep per-product analysis of dbt Cloud, Snowflake Cortex Analyst, Looker, Cursor 3, Hex, GitHub Copilot, Databricks. Includes user feedback, established vs. experimental patterns. Written to `research/test-mode-ux-patterns.md`.
- **Key finding** — split-pane (model + agent always side-by-side, no mode switch) is the right pattern. Cortex Analyst is the direct analogue. Looker's IDE→Explore switch is the cautionary tale — Spectacles exists because of that pain.
- **Three layout explorations built** in Playground (`/data-studio/playground`, Test mode layout section):
  - TM1 Always-On: three columns always visible, no mode switch — recommended
  - TM2 Adaptive Shift: header toggle re-weights panels (center narrows, agent widens)
  - TM3 Horizontal Stack: model canvas top, Preview/SQL/Lineage/Test Log in bottom panel, narrow agent sidebar
- **Playground consolidated** — all 9 iterations (v1–v6 + tm1–tm3) unified under `/data-studio/playground` with a left-side nav (dark, two sections). Old `/data-studio/playground-v2` through `-v6` routes redirect to the unified URL.
- Build passes.

### What's built (session 38):
- **ColumnsView interaction cleanup** — removed ✦ hover icon on column name, removed purple row highlight on selection, removed bulk action bar ("N columns added to agent" + Clear). Row click still toggles column into agent chips; visual feedback is the chips in PromptBar only.
- `hoveredRow` state removed entirely.
- Build passes.

### What's built (session 37):
- **Checkboxes removed** from ColumnsView header and rows. `CB_WIDTH` constant + `toggleAll`/`toggleRow`/`allChecked`/local `selected` state all removed.
- **Row click → toggle selection** — `onClick` on `<tr>` calls `onToggleColumn(col.name)`. Selected rows highlight purple (removed in session 38).
- **`selectedColumns: string[]` lifted to Workspace** — passed down to CenterPanel → ColumnsView (for highlights) and AgentPanel → PromptBar (for chips). Chip × and "Clear" in bulk bar both update the same state.
- **PromptBar column chips** — `attachedColumns` state + `setColumns()` ref method. Chips render in purple (`#F3F0FF` / `#6D28D9`) with ✦ prefix and × to remove. On submit: columns prepended as `@col1 @col2` to the message, then cleared.
- **Bulk bar** — removed in session 38.
- **`onColumnRemove` callback** — chip × in PromptBar calls back to Workspace to deselect that column in CenterPanel.
- Build passes.

### What's built (session 36):
- **Empty state loading** — sub-header (tabs + Data panel toggle) moved inside center column so it only affects canvas, not agent panel. Tabs hidden until `buildStep !== 'empty'`.
- **AgentPanel header** — own header bar with sparkle + "Data Agent" label + collapse button (→ arrow). Dead `collapsed` state + `«` strip removed.
- **Collapse behavior** — collapse button calls `onClose` → `setAgentPanelOpen(false)`. Reopen button appears in sub-header right slot. During empty state, sub-header appears only when agent panel is closed (so reopen button is always accessible).
- **`convert_currency` workflow** — free-form typed, no pill. Regex trigger: `/\b(inr|rupee|indian rupee)\b/`. 3 working steps (understand intent → scan → update). `autoComplete: true` — no confirm needed. Updates `columnOverridesUpdate` for `amount`, `spend`, `budget` from USD → INR. Canvas (ColumnsView) reflects immediately.
- **Key decision:** Prep workflow (Review data quality) is warehouse-only — dbt models are read-only, no prep chips.

### What's built (session 35):
- Select dropdowns (Radiant `Select`, `size="basic"`) replace chip pills for severity and table filters in `DataQualityPlanModal`
- `✦` transform indicators in ColumnsView — increased font size (10→12) and added `padding: 2px` for easier hover target
- LeftPanel order fixed: Tables → Joins → Formulas → Transformations (Transformations moved below Formulas)

### What's built (session 34):
- `PrepSuggestion` type (replaces `ChecklistItem`) with `issue`, `fix`, `reason`, `severity`, `checked`, `sql` fields
- `PREP_SUGGESTIONS` — 9 scripted suggestions with full content (issue description, fix label, semantic reason, severity High/Med/Low)
- `DataQualityPlanModal` component — M3 modal with intro block, sticky filter bar (search + severity + table), flat table grouped by column, cosmetically editable fix inputs, severity badges, sticky "Apply/Dismiss" footer
- `review_data_quality` script — final message shows "Review plan" button (not inline checkable plan); `reviewPlanCTA: true` on message
- `planModalOpen` + `prepSuggestions` state in AgentPanel (replaces `checkedPrepItems`)
- "Apply" in modal → closes modal → calls `handleConfirm()` → writes `prepTransforms` mapped from suggestions
- Done message updated: no "health score" or "AI ready" language — tells user to view transforms in Transformations panel or hover cells

### Key decisions (session 34, locked):
- Plan in modal, not inline in chat — "Review plan" button in agent bubble opens modal
- Flat table (no collapsible groups) — column is a visible column, sorted by severity
- Fix field cosmetically editable — display text updates in state, underlying SQL is always scripted
- Severity: High / Medium / Low (scripted per suggestion)
- Footer: "Apply (N)" shows count when not all checked; "Apply" when all checked; "Dismiss" to close without applying

### What's built (session 33):
- LeftPanel "Transformations" section below Formulas — appears after transforms are applied
- ColumnsView `✦` indicator on Null %, Duplicates, Anomalies cells where a transform is active (tooltip shows SQL)

### Key decisions (locked):
- Prep = query-time SQL transformations embedded in the model. Not cached, not pushed to warehouse.
- No auto-profiling on build — profile data already visible in ColumnsView by default.
- No quality banner — per-column stats in ColumnsView are sufficient.
- Transforms in LeftPanel "Transformations" section (separate from Formulas — confirmed session 33).
- "Skip and test" path shows raw data quality warnings in test diagnostics.
- Caching is separate from prep — decoupled. Prep works on live data.
- Prep workflow is warehouse-only — dbt models are read-only, no "Review data quality" chip surfaces in the dbt flow.
- Full research doc: `research/data-prep-workflow.md`

---

## Demo arc — 6 situations (locked 2026-04-20)

**Goal:** Make the convergence of data modeling + prep + caching feel inevitable. Show that Data Studio is the right product to build — the single workspace for making data AI-ready for BI agents (Spotter).

**Audience:** SVP Product, VP Product, Directors of data modeling and data prep teams.

**Format:** One real, surprising AI moment per situation. The rest can be scripted. Not a feature tour — a story.

| # | Situation | Status | Entry point |
|---|-----------|--------|-------------|
| 1 | **Zero to one** — Build a model from scratch | Built (workflows 1–4) | Overview → New project → NewProjectPrompt → Workspace |
| 2 | **Test it** — Ask questions, find where Spotter struggles | Built | Overview → open existing project → Workspace (test mode) |
| 3 | **Teach and fix** — Coach based on what testing revealed | Built | Continues from situation 2 |
| 4 | **Expand the model** — Add a table or metric to a working model | Partial (add metric built; add new table not) | Overview → open existing project → Workspace |
| 5 | **Cache it** — Pull data to ThoughtSpot, set refresh, cost story | Built | Overview → open existing project → Model View → Cache tab |
| 6 | **Monitor and fix** — Surface a change or issue, route to fix | Built | Overview → alert card → Model View with alert banner |

**Navigation shell:** Done. Shell + Overview + NewProjectPrompt wired in index.tsx. `openProject()` pre-seeds realistic state for situations 2–6.

---

## Agent patterns (decided 2026-04-20)

| Moment | Pattern | Notes |
|--------|---------|-------|
| Opening brief too vague | 2–3 clarifying questions | Only when intent is too underdetermined to build at all. Not about preferences or table choices. |
| Opening brief is clear | One-shot build with working steps | Agent assumes and proceeds. Shows reasoning as it works. Sara can stop midway. |
| Genuine ambiguity mid-build | Bet and proceed | Agent states assumption inline ("I used orders_clean — say 'use raw' to switch"). Never stops work to ask. |
| Testing | One-shot answer + 3-dimension diagnostic | Data quality · Context · Structure — shown inline with every answer |
| Issue found in testing | Scale the fix | One issue = scan the whole class. "9 other columns also missing descriptions — fix all?" |
| Coaching in draft | One-shot apply, no approval | Agent applies, shows summary. Sara edits inline or asks for changes. |
| Publish / cache | Explicit confirm | State changes. Show what's about to happen, require one confirm. |
| Monitor and fix | Explain → propose → confirm | High-stakes. Three steps. |

**On published state:** Publishing doesn't lock the workspace. Sara can always reopen, edit, and republish. Monitoring alerts navigate back into the workspace pre-focused on the problem. No separate "published view" — just a "live" indicator on the project.

---

## Demo script

Full scripted flows for all 6 situations → **[SCRIPT.md](./SCRIPT.md)**

---

## Session log

_Last 3 sessions. Full history → [SESSION_LOG.md](./SESSION_LOG.md)_

---

### 2026-04-25 (session 48)

**Phase 2 strategy memo: Manage + Iterate thesis**

- Wrote `research/phase-2-manage-iterate.md` — strategy memo for leadership arguing Data Studio's Phase 2 focus should be **Manage + Iterate** of the semantic layer, with **Build deprioritized to "import, don't author."**
- **Thesis anchors:** Build is commoditizing (Omni Modeling Agent, Claude Code authoring, agents drafting DSLs); Iterate is undefended (Hex Context Suggestions + Ramp eval loop are v0); 17% residual failure in Metadata Reasoner paper is the iterate opportunity; silent semantic-layer drift is invisible without a closed loop.
- **Reference architectures used:** Omni (shared data model as hub, workbook-promote-to-shared flow) + Hex Context Studio (Historical Threads → Review Agent → Suggestions to update context). Both diagrams referenced in the memo.
- **Reframes the 6 situations:** demote S1 (build from scratch) to "onboard existing model"; elevate S3 (coach/fix) and S6 (monitor/fix) as core demo. S2/S4/S5 supporting.
- **Proposes 5 KPIs:** silent failure rate, mean time to fix, context growth rate, eval coverage, accuracy trend.
- **Surfaces 4 leadership decisions** + open team questions (review-agent proposal format, cross-layer fixes, multi-tenancy, eval ownership).
- **Side work (not Data Studio):** set up `the-diff` as a separate project (new repo at `/Users/vivek.sahi/the-diff/` + https://github.com/Vivek-sahi/the-diff); moved bookmarks out of Data Studio; renamed and reconfigured the weekly digest routine ("The Diff") with trend-first framing, Unicode bold titles, personalized greeting. Runs Monday 9am IST to Slack DM.
- **Next:** Vivek reviews the memo. Once aligned, it's ready to share with leadership.

---

### 2026-04-24 (session 46)

**Deployment fix + left nav flatten:**

- **Deployed sessions 43–45 to Vercel** — coaching flow, canvas segmented control, and impressions synonyms were committed but not live. Merged `prototype/data-studio` → `main` and deployed.
- **Deploy process clarified** — Vercel does not auto-deploy from Galaxy git. Must run `vercel --prod` from `main` branch. Fixed a bad deploy that was run from `prototype/data-studio` (missing V1 folder).
- **Left nav flattened** — removed Workspace / Sources / Operations section headers from the Shell sidebar. Now a single flat list: Overview · Projects · Data · Connections · Monitoring · Governance. Made `title` optional in `AppSidebar`'s `SidebarCategory` type so the `h3` only renders when a title is provided.
- Build passes.

---

### 2026-04-23 (session 44)

**Human-in-the-loop coaching flow (Situation 3):**

- **Issue Inspector removed** — replaced with a cleaner human-driven feedback model. No more auto-detected issue cards in test mode.
- **Correct / Incorrect feedback buttons** — appear on every AI answer after it's revealed. "Correct" shows a "✓ Marked correct" confirmation. "Incorrect" opens the coaching flow.
- **Coaching question step** — agent responds "Got it. What went wrong with this answer?" with 5 chip options: The number is wrong · The time period is wrong · The wrong columns or tables are being used · The join between tables is wrong · Something else. Selected option highlights blue; others dim and lock.
- **Debug working animation** — 3 scripted working steps per category animate in (700ms each), followed by a diagnosis sentence. Different steps per category.
- **Two CTAs** — "Continue testing" (dismisses, user keeps asking questions) and "Fix in build →" (switches to Build tab and pre-seeds `debug_context` flow with category context).
- **No other flows disturbed** — build tab, all workflows (build_project, test mode, coaching via build agent, dbt import, etc.) unchanged. `debug_context` and `debug_context_bulk` SCRIPTS retained and used by the "Fix in build" handoff.
- Build passes.

---

### 2026-04-23 (session 43)

**Canvas sub-header: segmented view control + data quality improvements:**

- **View segmented control** — replaced three right-side icon-only toggle buttons (Tables, Preview, Notebook) with a four-segment label-only control centered in the sub-header. Segments: Columns · Tables · Preview · Notebook. Active segment lifts to `background-base` with subtle shadow; inactive segments are `content-secondary`. Absolutely positioned at `left: 50%` so it never shifts when right-side controls appear/disappear.
- **Columns is the default and explicit home** — no more hidden toggle-back gesture; clicking Columns returns to the column property view from any other view.
- **Column-specific controls conditional** — column count, search, and Properties popover only render when Columns tab is active. Right-side wrapper uses `marginLeft: auto`.
- **Aggregation, Additive, Hidden, Format hidden by default** — moved from `DEFAULT_VISIBLE_COLS` to `ADVANCED_COLS`. Now off by default, still accessible via Properties popover.
- **Mock data quality issues expanded** — nullRate, blankCount, duplicateCount, anomalyCount spread across previously-clean columns in all three tables (orders, campaigns, users). ~15 columns now have at least one non-zero quality metric instead of ~5.
- **Research doc written** — `research/secondary-views-placement.md`. Decision: full canvas swap is correct (not bottom panel); bottom panel is a poor fit for wide data grids. Real gap was the return UX and agent context bridges (deferred to a future session).
- Build passes.

---

### 2026-04-23 (session 42)

**V1/V2 deployment setup + branch rename:**

- **Folder renamed** — `DataStudio/` → `DataStudioV2/` on `prototype/data-studio` branch. All imports, routes, and registry entries updated.
- **Gallery card** — registry entry renamed to "Data Studio — Agentic UX" (`id: DataStudioV2`). Route: `/playground/DataStudioV2`.
- **V1 preserved** — V1 DataStudio code restored from `2cf7019` into a separate `DataStudio/` folder on `main`. Both cards now live on `radiantplay-nine.vercel.app`.
- **Deployed** — `vercel --prod` run from `main`. Both `DataStudio` (V1) and `DataStudioV2` (V2) cards visible in gallery alongside SpotterPrep.
- **Working branch** — returned to `prototype/data-studio` for continued V2 development.
- **Next up unchanged** — Tables, Data Preview, Notebook, and Lineage child views.
- Build passes.

---

### 2026-04-23 (session 41)

**Canvas sub-header unified into single toolbar:**

- **Tabs pill removed** — Columns / Tables / Data Preview / Notebook tabs pill replaced by icon buttons (Tables, Preview, Notebook) on the right side of the sub-header. Columns is the default view; clicking an active icon returns to Columns.
- **Single bar** — ColumnsView's internal subheader (Search, Properties, column count, dbt indicators) merged into the Workspace sub-header. One bar, always visible.
- **Right toolbar** — column count | search (inline expandable, ESC to close) | properties icon (sliders) | divider | tables icon | preview icon | notebook icon | Data Agent reopen (when collapsed)
- **dbt indicators** — moved to the sub-header: "Synced" green badge (sync icon) + "X issues" red button (filters to issues-only). Computed from project state in Workspace.
- **State lifted** — `search`, `searchOpen`, `showIssuesOnly`, `colVisOpen`, `visibleCols` all live in Workspace now; passed down to CenterPanel → ColumnsView as props.
- `DEFAULT_VISIBLE_COLS`, `ADVANCED_COLS`, `COL_LABELS` exported from CenterPanel and imported in Workspace.
- Build passes.

---

### 2026-04-23 (session 40)

**Test mode merged into agent panel as a tab:**

- **Build / Test tabs** — agent panel header now has Build and Test tabs (no sparkle icon). `project.testMode` drives which tab is active. Canvas stays visible at all times — no more full-page overlay.
- **Workspace cleaned up** — removed the standalone Test button from the header, removed the `TestModePanel` fullscreen block and all related types/components (~640 lines). Removed `enterTestMode`/`exitTestMode`.
- **Test tab UI aligned to Build** — white background, `AgentAvatarLarge` empty state, user messages use `background-sunken` + `UserAvatar`, agent working block uses `AgentAvatar` + same green dot/line step style, agent answer inline (no outer card wrapper).
- **Prompt bar matches Build** — same textarea styling, same 32px circular send button, no `+` Tables or Upload button.
- **Issue Inspector hidden** — removed from test tab render for now.
- **Loading state** — illustration enlarged (96→160px), tip text bumped (xs→sm).
- Build passes.

---

### 2026-04-23 (session 38)

**ColumnsView interaction cleanup:**

- **✦ hover icon removed** — no longer shows on column name cell on hover.
- **Row highlight removed** — selected rows no longer turn purple. `rowBg` always uses `background-base`. Hover state unchanged.
- **Bulk action bar removed** — "N columns added to agent" banner and Clear button gone. Chips in PromptBar are the only feedback that columns are attached.
- **`hoveredRow` state removed** entirely from ColumnsView.
- CONTEXT.md cleaned up: "Still to build" (test diagnostic variation), Feedback tracker, and Later sections all removed.
- Build passes.

---

### 2026-04-23 (session 37)

**Column row-click → agent chip selection:**

- **Checkboxes removed** from ColumnsView header and rows. `CB_WIDTH` constant + `toggleAll`/`toggleRow`/`allChecked`/local `selected` state all removed.
- **Row click → toggle selection** — `onClick` on `<tr>` calls `onToggleColumn(col.name)`. Selected rows highlight purple (`#F3F0FF`). Hover hint `✦` shows on unselected rows.
- **`selectedColumns: string[]` lifted to Workspace** — passed down to CenterPanel → ColumnsView (for highlights) and AgentPanel → PromptBar (for chips). Chip × and "Clear" in bulk bar both update the same state.
- **PromptBar column chips** — `attachedColumns` state + `setColumns()` ref method. Chips render in purple (`#F3F0FF` / `#6D28D9`) with ✦ prefix and × to remove. On submit: columns prepended as `@col1 @col2` to the message, then cleared.
- **Bulk bar** — shows "✦ N columns added to agent" in purple when selection active. "Clear" button clears all. (Both removed in session 38.)
- **`onColumnRemove` callback** — chip × in PromptBar calls back to Workspace to deselect that column in CenterPanel.
- Build passes.

---

### 2026-04-23 (session 36)

**Empty state layout restructure + currency context workflow:**

- **AgentPanel header** — added own 40px header bar (sparkle + "Data Agent" + collapse → icon). Removed dead `collapsed` state and `«` strip. Collapse calls `onClose` which sets `agentPanelOpen: false` in Workspace.
- **Sub-header moved inside center column** — no longer spans full width. Only affects CenterPanel when tabs appear. Shown when `buildStep !== 'empty'` OR `!agentPanelOpen` (so reopen button always accessible). Tabs hidden in empty state; reopen button shows when panel is closed at any build step.
- **`convert_currency` script** — `autoComplete: true`, no confirm. Trigger: `/\b(inr|rupee|indian rupee)\b/`. Steps: understand intent → scan context → update. Applies `columnOverridesUpdate` to amount/spend/budget (USD → INR). ColumnsView reflects immediately.
- Build passes.


