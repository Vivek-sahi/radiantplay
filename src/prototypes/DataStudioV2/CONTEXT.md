# Data Studio — Project Status
_Single source of truth for this prototype. Update as decisions are made._

---

## Next up

**Work on code, table and data preview views.** Sub-header is now unified — next step is designing and building the Tables, Data Preview, and Notebook (code) child views to match the new single-toolbar design.

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


