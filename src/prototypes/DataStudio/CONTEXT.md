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
