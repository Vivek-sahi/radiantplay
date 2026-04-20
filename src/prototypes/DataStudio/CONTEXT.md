# Data Studio — Project Status
_Single source of truth for this prototype. Update as decisions are made._

---

## Demo arc — 6 situations (locked 2026-04-20)

**Goal:** Make the convergence of data modeling + prep + caching feel inevitable. Show that Data Studio is the right product to build — the single workspace for making data AI-ready for BI agents (Spotter).

**Audience:** SVP Product, VP Product, Directors of data modeling and data prep teams.

**Format:** One real, surprising AI moment per situation. The rest can be scripted. Not a feature tour — a story.

| # | Situation | Status | Entry point |
|---|-----------|--------|-------------|
| 1 | **Zero to one** — Build a model from scratch | Built (workflows 1–4) | Overview → New project → NewProjectPrompt → Workspace |
| 2 | **Test it** — Ask questions, find where Spotter struggles | Not built | Overview → open existing project → Workspace (test mode) |
| 3 | **Teach and fix** — Coach based on what testing revealed | Not built | Continues from situation 2 |
| 4 | **Expand the model** — Add a table or metric to a working model | Partial (add metric built; add new table not) | Overview → open existing project → Workspace |
| 5 | **Cache it** — Pull data to ThoughtSpot, set refresh, cost story | Not built | Overview → open existing project → Cache tab |
| 6 | **Monitor and fix** — Surface a change or issue, route to fix | Not built | Overview → alert card → Workspace at the broken node |

**Navigation shell:** Done. Shell + Overview + NewProjectPrompt wired in index.tsx. `openProject()` pre-seeds realistic state for situations 2–6. WorkflowDirectory FAB exists but workflows are not yet wired to scenarios.

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

## Demo script — Sara's story

**Character:** Sara, data analyst, marketing analytics team.  
**Scenario:** Campaign Performance Analysis — orders + campaigns + users in Snowflake.  
**Setup:** Sara's VP and senior marketing leaders have specific questions they want to answer via Spotter. They've given her a brief with use cases and sample questions.

---

### Situation 1 — Zero to one

**Screen:** Overview → "New project" → NewProjectPrompt

**Sara types:**
> "My VP of marketing wants to understand campaign performance. Key questions: What's our ROAS by campaign and channel? Which user segments convert best? How efficient is our budget across regions? I have order data, campaign data, and user data in Snowflake."

**Agent (working steps, visible, stoppable):**
- Scanning your use case and sample questions…
- Searching Snowflake for relevant tables…
- Found 3 tables: orders, campaigns, users
- Identifying join keys and relationships…
- Selecting columns relevant to your use cases…
- Building metrics from your sample questions…

**Agent response (one-shot proposal):**
> Here's what I built for your campaign performance project.
>
> **Tables** — orders (150 rows), campaigns (45 rows), users (90 rows)
>
> **Joins** — orders → campaigns on `campaign_id` (LEFT JOIN, preserves organic orders with no campaign); orders → users on `user_id` (LEFT JOIN)
>
> **Columns selected** — removed 2 PII fields (email, name) and 3 system fields. 18 columns included across the 3 tables.
>
> **Metrics added** from your sample questions:
> - ROAS = SUM(orders.amount) / SUM(campaigns.spend)
> - Conversion rate = COUNT(DISTINCT orders.user_id) / COUNT(DISTINCT users.user_id)
>
> ⚠️ One assumption: `campaign_id` has 18% nulls — these are organic orders with no campaign. I've kept them in the model with a LEFT JOIN so total revenue is accurate, but they'll be excluded from ROAS. Let me know if you'd like to handle this differently.
>
> Ready to test, or want to change anything?

**Canvas state:** Visualizer shows orders + campaigns + users with join lines. Left panel: Tables (3), Joins (2), Formulas (2).

**Sara:** "Looks good, let's test it"

**→ Workspace opens, Test mode activates**

**Wow moment:** Full model — tables, joins, columns, metrics — built from a plain-English brief. No form-filling, no step-by-step approvals. Sara never clicked the canvas.

---

### Situation 2 — Test it

**Screen:** Workspace in test mode (Test button active in header). Agent panel shifts to test-mode prompt.

**Sara types:**
> "What's our ROAS by campaign for last quarter?"

**Agent response:**

| Campaign | Spend | Revenue | ROAS |
|----------|-------|---------|------|
| Summer Sale | $12,400 | $48,200 | 3.9× |
| Brand Awareness | $8,100 | $18,300 | 2.3× |
| Retargeting | $5,600 | $31,400 | 5.6× |
| (unattributed) | — | $22,100 | — |

> **Answer confidence**
> 🟡 **Data quality** — `campaign_id` is null on 18% of orders. $22,100 revenue (15% of total) has no campaign attribution. ROAS figures may be understated for all campaigns.
> 🟢 **Context** — All columns used have sufficient descriptions. No approximations made.
> 🟢 **Structure** — No join traps detected. LEFT JOIN is correct for this aggregation.
>
> *Inspect this answer ↓*

**Sara clicks Inspect:**
- Columns used: campaign_name, spend, amount, campaign_id
- Join path: orders LEFT JOIN campaigns on campaign_id
- SQL visible
- Data quality flag expanded: "27 of 150 orders have null campaign_id. These are organic purchases — expected, not a bug. ROAS is calculated on attributed orders only."

**Sara types:**
> "Which segments convert best?"

**Agent response:**

| Segment | Users | Orders | Conversion |
|---------|-------|--------|------------|
| Enterprise | 210 | 89 | 42% |
| Mid-market | 180 | 61 | 34% |
| SMB | 290 | 74 | 26% |
| (unclassified) | 140 | — | — |

> **Answer confidence**
> 🟡 **Context** — `users.segment` has no description. I interpreted it as customer tier based on the values. Verify this is correct.
> 🟡 **Data quality** — `segment` is null for 15% of users (140 rows). Conversion for this group is unknown.
> 🟢 **Structure** — No join traps detected.

**Wow moment:** Sara can see *why* the answer might be wrong — not just that it is. Two issues identified: one data quality (null campaign_id), one context gap (segment has no description). She has a diagnosis, not just a symptom.

---

### Situation 3 — Teach and fix

**Screen:** Workspace, continuing from test mode. Sara switches back to build/coach mode.

**Sara types:**
> "Generate descriptions for all columns that are missing context"

**Agent (working steps):**
- Scanning 26 columns across orders, campaigns, users…
- Found 18 columns with no descriptions
- Generating descriptions based on names, types, and your use case…
- Applying…

**Agent response:**
> I've drafted and applied descriptions for 18 columns. A few examples:
>
> - `orders.region` → "Geographic region where the order was placed (North, South, East, West, APAC)"
> - `campaigns.channel` → "Marketing channel (paid_search, social, email, display)"
> - `users.segment` → "Customer tier based on purchase behavior: enterprise, mid-market, SMB, individual"
>
> Since this project is in draft, I applied these directly — no approval needed. You can edit any description inline by clicking it, or just tell me what to change.
>
> **What this fixes:** Spotter will now correctly interpret segment, channel, and region. Previously it was approximating from column names alone. Want me to also check for synonym gaps?

**Sara:** "Yes — and add 'revenue' as a synonym for order amount"

**Agent:** "Done. I found 3 more synonym opportunities: `spend` → 'investment', `conversion_rate` → 'conversion', `lifetime_value` → 'LTV'. Added all of them including yours. `orders.amount` now responds to 'revenue', 'order value', and 'sales'."

**Wow moment:** One instruction fixes 18 columns. The agent doesn't just do what Sara asked — it scans the whole class of issues and fixes them all. Sara didn't have to find each gap manually.

---

### Situation 4 — Expand the model

**Screen:** Overview → Sara clicks "Marketing Campaign Attribution" (published, 1,839 conversations) → Workspace opens

**Context:** Three weeks after publish. Marketing team wants product-level breakdowns.

**Sara types:**
> "I want to add product category performance — the team wants to know which product lines drive the most revenue per campaign"

**Agent (working steps):**
- Checking current model for product data…
- Found `orders.product_category` — already included in your model
- Drafting a new metric…

**Agent response:**
> `product_category` is already in your model — no new table needed.
>
> I've added one metric based on your request:
> - **Revenue by product** = SUM(orders.amount) grouped by product_category
>
> Your team can now ask "What's revenue by product category and campaign?" and get a clean answer. Ready to republish?

**Sara:** "Republish"

**Agent:** "Published. Changes are live. Your team's next Spotter query will use the updated model."

**Wow moment:** Expanding the model takes one message. No data team meeting, no engineering ticket. Sara does it herself in under a minute.

---

### Situation 5 — Cache it

**Screen:** Workspace → Settings → Cache tab (or agent surfaces it proactively)

**Agent (proactive suggestion in workspace):**
> This project had 1,839 Spotter conversations last month. Every query is hitting Snowflake live. Enabling daily caching would serve all queries from a pre-built cache — estimated to save ~$340/month in compute costs and reduce query time from ~3s to ~200ms.

**Sara:** "Enable it, daily at 2am"

**Agent:** "Caching enabled. Data will refresh every day at 2:00 AM. First run is scheduled for tonight. Once the cache is warm, Spotter queries on this project will be near-instant."

**Cache panel shows:** schedule (daily · 2:00 AM), next run (tonight 2:00 AM), estimated savings ($340/mo), last run status (pending first run).

**Wow moment:** Cost control built into the same workspace where Sara builds the model. Not a separate admin panel. Not an engineering request. One toggle.

---

### Situation 6 — Monitor and fix

**Screen:** Overview — alert card visible

**Alert card:** Schema change · campaigns table · critical · 2 hours ago · "budget_currency column added"

**Sara clicks the alert → Workspace opens, campaigns table highlighted in left panel and visualizer**

**Agent:**
> **What changed:** Snowflake added `budget_currency` to the campaigns table. It wasn't there when you built this model.
>
> **What's affected:** Your ROAS metric divides `orders.amount` (USD) by `campaigns.spend`. But `spend` for international campaigns may now be in non-USD currencies, making ROAS inaccurate for those rows.
>
> **Proposed fix:** Mark campaigns where `budget_currency ≠ 'USD'` as currency-unverified. Spotter will show a ⚠️ on ROAS for those campaigns until you add a proper conversion.
>
> Apply this fix?

**Sara:** "Yes, apply it"

**Agent:** "Done. 4 international campaigns are now flagged. ROAS for those campaigns will show a currency warning in Spotter. I've also added a note to the model context so your team knows why."

**Wow moment:** The alert surfaces proactively. Sara doesn't discover the problem from a confused user — Data Studio finds it first, explains it, and offers a fix. One click to apply. No engineering escalation.

---

## Screens implied by this script

These views need to exist or be built:

| Screen | Exists? | Notes |
|--------|---------|-------|
| Overview with alert cards | Built | Alert cards need to be clickable with routing |
| NewProjectPrompt | Built | Working |
| Workspace — build mode | Built | Visualizer, left panel, agent panel working |
| Workspace — test mode | Not built | Agent panel shifts to test mode; answer + confidence diagnostic |
| Answer confidence panel | Not built | 3-dimension inline diagnostic per answer |
| Inspect answer panel | Not built | Columns used, join path, SQL, expanded issue detail |
| Coaching in draft (no approval) | Partial | Approval flow exists; needs draft-mode bypass |
| Cache settings panel | Not built | Schedule, next run, savings estimate |
| Alert → workspace routing | Not built | Click alert → workspace pre-navigated to affected node |

---

## Open Questions

Design questions to resolve before or during build. Mark resolved when decided.

- [ ] **View vs edit mode**
  Should there be separate modes at all, or is everything always editable? View mode probably exists as a *permission state* (shared read-only) rather than a manual toggle. The primary analyst is always in edit mode. A viewer just sees the model without the ability to change it.

- [ ] **Agent in view mode**
  If view mode exists, agent should still be available — scoped differently. In view mode: agent explains (what does this model do, how does this join work). In edit mode: agent proposes and builds. Opening the agent doesn't need to imply edit intent.

- [ ] **Test: separate view or side-by-side with agent?**
  Side-by-side is probably right for the core build→test→fix loop — you're still talking to the agent, still looking at the model, just asking different questions. A focused "pre-publish test mode" that strips the build UI might make sense as a separate moment — simulating what an actual user sees. Two modes of testing for two different purposes.

- [x] **Proposal card placement** — resolved
  Proposals live in the agent panel as chat messages. Canvas is read-only output of confirmed actions.

- [x] **Left panel tree scope** — resolved
  Project tables only (not the full warehouse). Left panel answers "what's in my model." The warehouse browser (DataBrowserModal) stays as a secondary modal for adding new tables.

- [x] **Where do joins go in the left panel tree?** — resolved
  Flat "Joins" section, not nested under tables. Joins are model-level constructs (they connect two tables); forcing them into a single-table tree creates ambiguity about which table they belong to.

- [x] **Where do cross-table formulas go in the left panel?** — resolved
  Flat "Formulas" section. Same logic as joins — a formula like `ROAS = orders.amount / campaigns.spend` doesn't belong to either table.

- [ ] **Canvas tabs in test mode**
  Do Visualizer / Data Preview / Notebook tabs hide when testing? Get replaced by a Spotter-style input?

- [ ] **Error/warning routing**
  How do errors in Monitoring route back into the right place in the workspace? (e.g. column deleted → open workspace at the right table)

- [ ] **Validate with users (when prototype is ready)**
  Does the agent-first workflow feel like the right level of control to a data analyst? Specifically: does the one-shot proposal (tables + joins + columns together) feel empowering, or does it feel like too much happening at once with not enough control?

---

## Workflows to build

**Legend**
- `[x]` Done
- `[-]` Deferred (intentionally not built yet)
- `[ ]` Not started

---

### Build ✓

Foundational modeling steps. All complete.

#### 1. Add data (table / view / model)
- [x] **Agentic path**
  - 3 entry points: describe use case → agent searches warehouse → proposes tables (intro sentence → table cards → confirm question); OR `add [table]` for direct add; OR `@mention` in PromptBar
  - Approval logic: agent-initiated proposals require confirm; user-named tables add immediately
  - Real Claude call (`executeFindTables`) runs in parallel with animation
  - `addedTables[]` on ProjectState drives left panel dynamically
  - Contextual suggestion chips after completion
- [-] **Manual path** — left panel `+` → DataBrowserModal (Connection → Database → Schema → Tables) — deferred

#### 2. Add a join
- [x] **Agentic path**
  - Agent scans schemas → identifies foreign key relationships → proposes join type (LEFT vs INNER) with match rate reasoning → user confirms
  - Real Claude call (`executeCreateJoins`) runs in parallel with animation
  - Execution text computed from actual tables in project (not hardcoded)
  - Suggestion chips after: Select columns · Add calculated columns · Profile the data
- [-] **Manual path** — click connector between tables in Visualizer → define join type + key — deferred

#### 3. Select columns
- [x] **Agentic path**
  - Default: all columns excluded when a table is added. Model has no columns until explicitly surfaced.
  - Join keys auto-included and locked — cannot be excluded
  - Agent applies 4 criteria in Option B format (criteria first, recommendation after): Remove PII · Remove system fields · Remove duplicate dimensions · Remove low-signal for use case
  - Real Claude call (`executeSelectColumns`) runs in parallel; parses `INCLUDE_TABLE:` lines from response
  - `columnsSelected: boolean` + `includedColumns: Record<string, string[]>` on ProjectState
  - Canvas: Tables/Columns toggle in Visualizer; Columns view shows name · type · role · description · PII · null%
  - Data Preview: empty state until columns selected; filters to included columns after
  - Gates downstream workflows — testing, coaching, prep all require columns first
- [-] **Manual path** — column browser in left panel or column view toggle; check/uncheck per column — deferred
- **Open questions**
  - [ ] Re-editing after confirm: agent turn ("add region") or click-to-toggle in Columns view?
  - [ ] Should excluded columns appear in Columns view with a muted toggle to add?

#### 4. Create a formula / metric
- [x] **Agentic path**
  - Describe the metric → agent writes SQL with NULLIF guard → shows sample values → user confirms
  - Real Claude call (`executeCreateMetric`) runs in parallel with animation
  - Execution text is generic — not hardcoded to specific metrics
  - Routing: bare metric names ("Order Value by Campaign") correctly route to create_metric
- [-] **Manual path** — `+` formula button → write SQL expression → name and save — deferred

---

### Testing

#### 5. Ask a question from the project
- [ ] **Agentic path** — enter test mode → ask questions against the current model → agent answers from joined + selected columns; surfaces structural / semantic / data quality gaps

#### 6. Inspect a Spotter answer
- [ ] **Agentic path** — show agent trace: what columns it used, what it ignored, why; drill into a specific answer

---

### Coaching

#### 7. Update project memory
- [ ] **Agentic path** — gap identified during test → agent proposes fix → confirm → writes to project memory

#### 8. Add column-level synonym
- [ ] **Agentic path** — "orders.amount is also called revenue" → agent adds synonym to column metadata → confirm
- [ ] **Manual path** — Columns view → edit column → synonyms field

#### 9. Add column-level metadata
- [ ] **Agentic path** — "mark campaign_id as a dimension, not a metric" → agent updates classification → confirm
- [ ] **Manual path** — Columns view → edit column → classification / description / aggregation fields

---

### Modify the project

#### 10. Edit a join
- [ ] **Agentic path** — "change the orders↔campaigns join to INNER" → agent proposes updated join → confirm
- [ ] **Manual path** — Joins section → ··· → Edit → join type + key picker

#### 11. Remove a column
- [ ] **Agentic path** — "remove email from the model" → agent confirms impact → executes
- [ ] **Manual path** — Columns view → toggle off; or left panel tree → column row action

#### 12. Update project name
- [ ] **Manual path** — project header → click name → inline edit

---

### Expanding use cases

#### 13. Add a new table
- [ ] **Agentic path** — describe new need → agent finds table → proposes add + join to existing model
- [ ] **Manual path** — left panel Tables `+` → DataBrowserModal → select table

#### 14. Add a new metric
- [ ] **Agentic path** — describe metric → agent writes SQL → proposes → confirm
- [ ] **Manual path** — left panel Formulas `+` → formula editor

---

### Monitoring and debugging

#### 15. View project usage
- [ ] **Manual path** — Monitoring → Usage tab: query volume, active users, peak times

#### 16. View conversations on the project
- [ ] **Manual path** — Monitoring → Conversations tab: list of Spotter sessions that used this model

#### 17. Inspect a conversation
- [ ] **Manual path** — Conversations list → click → full turn-by-turn view with columns used, answers returned

#### 18. Inspect user interaction issues (negative feedback)
- [ ] **Agentic path** — thumbs-down flagged → agent identifies root cause (bad column, wrong join, missing metric) → proposes fix
- [ ] **Manual path** — Monitoring → Feedback tab → drill into flagged answers

#### 19. Inspect result quality issues (inconsistent results)
- [ ] **Agentic path** — agent detects diverging answers for similar questions → surfaces ambiguity → proposes clarification
- [ ] **Manual path** — Monitoring → Issues tab → inconsistency detail view

#### 20. Inspect query execution failures
- [ ] **Agentic path** — query error → agent explains cause → routes to workspace fix
- [ ] **Manual path** — Monitoring → Failures tab → error detail + suggested fix

#### 21. Inspect data source health — DBT sync failure
- [ ] **Agentic path** — sync failed alert → agent explains what changed → proposes model update
- [ ] **Manual path** — Monitoring → Sync tab → diff view of schema changes

#### 22. Inspect data source health — column deleted
- [ ] **Agentic path** — column-deleted alert → agent identifies affected joins/formulas → routes to workspace at the broken node
- [ ] **Manual path** — Monitoring → alert → click through to workspace with error highlighted

---

### Caching

#### 23. Cache a project
- [ ] **Agentic path** — agent suggests caching when model is large or frequently queried
- [ ] **Manual path** — project settings → Cache tab → enable toggle

#### 24. Update cache frequency
- [ ] **Manual path** — Cache settings → frequency selector (hourly / daily / weekly / custom cron)

#### 25. View cache logs
- [ ] **Manual path** — Cache settings → log view: last run, duration, rows cached, status

#### 26. Manually refresh cache
- [ ] **Manual path** — Cache settings → Refresh now button → progress indicator

---

### Improving data quality

#### 27. Inspect data quality
- [ ] **Agentic path** — agent profiles schema + sample data → surfaces issues by severity
- [ ] **Manual path** — Prep tab → summary view: issue count by type and column

#### 28. Read data quality issues
- [ ] **Manual path** — Prep tab → issue list: column · issue type · severity · sample values

#### 29. Apply data changes
- [ ] **Agentic path** — agent proposes fix for each issue → confirm → writes transformation
- [ ] **Manual path** — Prep tab → issue row → Apply / Reject

#### 30. View prep operations scheduled
- [ ] **Manual path** — Prep settings → Scheduled jobs tab: next run, frequency, columns in scope

#### 31. View prep jobs (run history)
- [ ] **Manual path** — Prep settings → Job history tab: timestamp, duration, issues fixed / skipped

#### 32. Run prep job manually
- [ ] **Manual path** — Prep settings → Run now button → live progress log

#### 33. Debug prep job failure
- [ ] **Agentic path** — job failed → agent explains error → proposes fix
- [ ] **Manual path** — Job history → failed run → error detail + stack trace

---

### Project management

#### 34. Archive the project
- [ ] **Manual path** — project settings → Archive → confirm dialog → project moves to Archived state; removed from active list

---

## Session log

### Session 6 — 2026-04-11

**Decisions made**
- Left panel tree scope: **project tables only** (not full warehouse). Warehouse browser stays as a modal for adding new tables. Left panel answers "what's in my model", not "what's in my warehouse."
- Joins and calculated formulas do NOT belong in the table tree — they're model-level constructs. Joins live in a flat "Joins" section; formulas in a flat "Formulas" section.
- `+` buttons in each section trigger the corresponding agent flow (not a modal). Tables `+` → find_tables, Joins `+` → create_joins, Formulas `+` → create_metric.
- Primary click on a table row → expand/collapse tree. Secondary action (···) → context menu with View detail / Remove.
- Drag-and-drop column inclusion deferred (manual path, same as all other manual paths).
- Column click-to-toggle also deferred — this is the manual path for workflow 3.
- Visualizer SVG made fully dynamic: layout computed from whatever is in `project.addedTables`, join lines computed from `relationships` data. No longer hardcoded to orders/campaigns/users.

**Built**
- `LeftPanel.tsx` fully rebuilt:
  - Tables section: expandable tree per table; columns show ⚿ (join key), ✓ (included), – (excluded); X/Y badge on each table header
  - Joins section: renamed from "Relationships", flat list with join type label
  - Formulas section: renamed from "Transformations", flat list with ƒx icon
  - Context menus (···) on tables (View detail, Remove table), joins, formulas (Edit, Remove — stubs)
  - `onSendToAgent` prop: `+` buttons send a message into the agent panel without typing
  - Remove table updates `addedTables`, `includedColumns`, resets `buildStep` to empty if no tables remain
- `Workspace.tsx`: `externalAgentMessage` state bridges LeftPanel → AgentPanel without prop drilling
- `AgentPanel.tsx`: `externalMessage` prop fires `processText` when LeftPanel sends a message
- Visualizer (`CenterPanel.tsx`): `getTableLayout()` positions N tables dynamically; join lines use bezier curves computed from table positions + `relationships` data; `TableNode` handles cols=0 for unknown tables
- Bug fix: create_joins execution text now uses `relationships` data filtered to active tables (no more "undefined" for non-standard table sets)
- Routing fix: OBVIOUS_CONFIRM now infers workflow from `buildStep` when no pending proposal — "these look good" / "yes" / "create those" at `buildStep === 'joined'` runs `create_metric` immediately
- Routing fix: `METRIC_TRIGGER` local shortcut fires before Claude for "add calculated columns/fields", "create metrics", "add formulas" — no more clarifying question loop
- Claude routing prompt updated: `create_metric` no longer requires a named metric; intent alone is sufficient

**Still open**
- Column click-to-toggle in tree (manual path for workflow 3, deferred)
- Drag-and-drop column inclusion (manual path, deferred)
- Workflows 5–9 (Test/EDA, Inspect, Coach, Publish, Share) — all unstarted

---

### Session 5 — 2026-04-11

**Decisions made**
- Column selection is a required structural step that gates all downstream workflows (test, coach, prep)
- Default: all columns excluded when table added — user must explicitly surface them
- Join keys auto-included and locked (can't be excluded — joins break without them)
- Agent uses Option B proposal format: criteria applied first (PII removed, system fields removed, duplicates removed, low-signal removed), then recommendation summary
- Data Preview is empty until columns are selected; filters to included columns after
- Canvas gets Tables/Columns toggle in the Visualizer — columns view shows flat table with semantic metadata
- `columnsSelected: boolean` and `includedColumns: Record<string, string[]>` added to ProjectState
- Column metadata extended: `classification`, `aggregation`, `synonyms`, `isPII`, `isSystemField`, `nullRate`, `duplicateCount`
- `impressions` added to campaigns table (now 10 columns)

**Built**
- `executeSelectColumns` — real Claude call with column inventory (including PII/system/null flags), parses INCLUDE_TABLE: response lines
- `select_columns` script with 4-step working animation and Option B hardcoded fallback proposal
- Columns view in CenterPanel: flat table grouped by table with colored badges, type, role, description, PII, null rate
- Data Preview: empty state when no columns selected; filtered columns view after selection
- OBVIOUS_CONFIRM regex expanded from ~15 to 35+ phrases (make sense, looks good, add the above, apply, confirm, etc.)
- Routing rule strengthened: when pending proposal exists, aggressive confirm routing with explicit examples

**Still open**
- Re-editing column selection after confirm (agent turn vs UI toggle)
- Whether excluded columns should be visible in column view with a toggle

---

### Session 4 — 2026-04-11

**Decisions made**
- Dynamic Claude calls for all built workflows: `executeFindTables`, `executeCreateJoins`, `executeCreateMetric` run in parallel with animations — no extra wait time
- Proposal format: intro/summary sentence always before table cards (never trailing)
- Singular/plural fuzzy matching for table names: `resolveTableName` for explicit add commands only; exact match for intent detection to prevent false positives on use-case descriptions
- Word-proximity check (≤3 words) prevents use-case descriptions from triggering direct table adds
- Pre-routing guards added before Claude is called: 1-table join request → scripted nudge; "find related tables" → always routes to find_tables; multi-table direct add
- WAREHOUSE_TREE and tableMetadata kept in sync: `users` table added to @mention dropdown; 9 additional tables added to metadata

**Built**
- `executeCreateJoins` and `executeCreateMetric` — real Claude calls, parallel execution
- `extractDirectAddTable` rewrite: Pattern 1 (explicit add commands with fuzzy name), Pattern 2 (work verb + known table with proximity check)
- `runDirectAdd` improvements: intro sentence before table card, context-aware suggestion chips
- Dynamic execution text for `create_joins` — computed from actual tables in project
- Generic execution text for `create_metric` — no longer hardcoded to specific metrics
- Bug fixes: "Find related tables" chip, singular/plural matching, 1-table join guard, multi-table direct add, undefined guard in execution interval, routing for bare metric names

---

### Session 3 — 2026-04-11

**Decisions made**
- Approval logic: agent-initiated suggestions require user confirm; user-explicit instructions (direct name or @mention) execute immediately without approval
- Contextual follow-up chips after every completed workflow — 2–3 chips specific to that flow, clicking sends as a new message
- Manual flows deferred: build all agentic build workflows first, then add manual paths together
- `addedTables[]` added to `ProjectState` — drives left panel, tracks uniqueness, prevents duplicate adds
- Working block (thinking steps): expandable/collapsible with blue brand color + ▲ when expanded, gray + ▾ when collapsed; continuous left-border tree, blue terminal dot when done

**Built**
- Shared `PromptBar` component (used on landing page and in agent panel)
- Agent panel redesigned: gradient step labels, working steps with expand/collapse, suggestion chips, direct-add flow, `@mention` routing
- Add table — agentic path complete: 3 entry points, approval logic, paragraph-format table proposals, suggestion chips
- Bug fixes: double-prompt on StrictMode, left panel showing wrong mock data, no "already added" awareness

---

### Session 2 — 2026-04-10

**Decisions made**
- Two-surface model: Workspace = modeling (agent-driven). Monitoring = everything else (button-based, reactive).
- Canvas tabs (Visualizer / Preview / Notebook) are local to the center canvas, not in the main header.
- Test = EDA inside the workspace. Not a gate, not a separate destination.
- Coaching is not a surface — it's an action that can happen anywhere.

**Built**
- FigJam V2 diagram: Build workflow with one-shot proposal pattern
- Figma: 3 layout direction wireframes (A: Inspector panel, B: Mode switcher, C: Rich sidebar)

---

## Files

| File | Purpose |
|---|---|
| `src/prototypes/DataStudio/` | Prototype root |
| `components/Workspace.tsx` | Project workspace (3-panel: left, canvas, agent) |
| `components/LeftPanel.tsx` | Tables, joins, transforms, data health |
| `components/CenterPanel.tsx` | Visualizer (Tables/Columns toggle), Data Preview, Notebook |
| `components/AgentPanel.tsx` | Agent chat, scripted flows, real Claude API calls |
| `api/agent.ts` | Claude Haiku integration, all execute* functions, routing |
| `data/mockData.ts` | All mock data, full column-level semantic metadata |

## Figma / FigJam

| File | Key | Purpose |
|---|---|---|
| FigJam | `60MAfL7Hw61kD5ygWPHMZI` | Workflow diagrams (IA, build flow V1 + V2) |
| Figma designs | `qLZ511mHw8l2vXlyJKRCsv` | Layout wireframes |
