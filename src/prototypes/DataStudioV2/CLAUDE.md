# Data Studio — Claude Instructions

## Session protocol

**Every session, do this first:**
1. Read `src/prototypes/DataStudio/CONTEXT.md` — it is the single source of truth for open questions, workflow status, and session history.
2. Check current git branch (`git branch`) — always work on `prototype/data-studio`.
3. At the end of the session, append a new entry to the Session log in CONTEXT.md.

**Before closing any session:** run `npm run build` and confirm it passes.

---

## What this prototype is

A vision demo for ThoughtSpot's **Data Studio** — the unified workspace for making warehouse data AI-ready for BI agents (Spotter). The goal is to make stakeholders believe this is the right product to build, not to spec every feature.

**The story (Story B):** Analysts have raw warehouse data. Spotter needs that data to be AI-ready to answer business questions well. Data Studio is the single workspace where that happens — connect, build, test, coach, cache, and monitor, all in one place.

**Audience:** SVP Product, VP Product, Directors of data modeling and data prep teams.

---

## 6 demo situations (the demo arc)

| # | Situation | Status |
|---|-----------|--------|
| 1 | **Zero to one** — build a model from scratch | Built |
| 2 | **Test it** — ask questions, find where Spotter struggles | Not built |
| 3 | **Teach and fix** — coach the model based on test results | Not built |
| 4 | **Expand the model** — add a table or metric to a working model | Partial |
| 5 | **Cache it** — pull data to ThoughtSpot, set refresh, cost story | Not built |
| 6 | **Monitor and fix** — surface a change or alert, route to the fix | Not built |

One real AI moment per situation. The rest is scripted. Not a feature tour — a story.

---

## Key files

| File | What it does |
|------|-------------|
| `index.tsx` | Root. Manages `AppView` state (overview / new-project / workspace). `openProject()` pre-seeds healthy project state for situations 2–6. |
| `components/Shell.tsx` | App navigation wrapper (ThoughtSpot sidebar + header). |
| `components/Overview.tsx` | Dashboard — alerts, recent projects, data table. Entry point for all flows. |
| `components/NewProjectPrompt.tsx` | "What would you like to build?" screen. Entry to situation 1. |
| `components/WorkflowDirectory.tsx` | Modal listing 12 workflows. Currently cosmetic — wiring it to demo scenarios is future work. |
| `components/Workspace.tsx` | 3-panel layout (LeftPanel / CenterPanel / AgentPanel). All build workflows live here. |
| `components/LeftPanel.tsx` | Tables / Joins / Formulas tree. `+` buttons fire agent messages. |
| `components/CenterPanel.tsx` | Visualizer (dynamic SVG), Data Preview, Notebook tabs. |
| `components/AgentPanel.tsx` | Agent chat. Scripted flows + real Claude calls. All `execute*` functions live here. |
| `api/agent.ts` | Skills registry, `routeMessage()`, all `execute*` functions. |
| `data/mockData.ts` | All mock data. Do not invent table or column names — always use what is here. |

---

## Mock data schema

Demo scenario: **Campaign Performance** — marketing team wants to understand how campaigns drive orders across regions and user segments.

**`orders`** (150 rows, Snowflake)
- `order_id` · `user_id` · `campaign_id` (18% null) · `order_date` (MM/DD/YYYY) · `amount` (SUM) · `product_category` · `status` · `region`
- Issues: 7 duplicate rows, 4 anomalies in `amount`, date format conflict

**`campaigns`** (Snowflake)
- `campaign_id` · `campaign_name` · `channel` · `spend` (SUM) · `budget` · `impressions` · `target_region` · `start_date` · `end_date` (6 nulls, ongoing)
- Issues: 2 duplicate rows, date format YYYY-MM-DD (conflicts with orders)

**`users`** (Snowflake)
- `user_id` · `segment` (15% null) · `lifetime_value` · `signup_date` (YYYY/MM/DD) · `age` (anomalies: 0, -3, 142, 199) · `email` (PII) · `country`

**Join keys:** `orders.campaign_id → campaigns.campaign_id`, `orders.user_id → users.user_id`

**Intentional quality issues** (used in situation 4 — fix data):
- `campaign_id` 18% null (organic orders, no campaign attribution)
- Date format inconsistency across all 3 tables
- Duplicate rows in orders and campaigns
- Age anomalies in users
- Most columns missing descriptions (semantic health issue)

---

## Routing pipeline (do not restructure without asking)

Message processing order in `AgentPanel.tsx` / `api/agent.ts`:

1. **@mention detection** — `@tablename` → direct add, no confirmation needed
2. **OBVIOUS_CONFIRM** — 35+ phrases ("yes", "looks good", "make sense", "apply", etc.) → infers workflow from `buildStep` and confirms pending proposal
3. **Pre-routing guards** — 1-table join request → scripted nudge; "find related tables" → always `find_tables`
4. **METRIC_TRIGGER** — local shortcut fires before Claude for "add calculated columns", "create metrics", "add formulas"
5. **Claude routing** — `routeMessage()` in `api/agent.ts` → returns a skill key or `CHAT:[text]`
6. **Scripted flow** — skill key maps to a script in `SCRIPTS` object in `AgentPanel.tsx`

**Skills registry** (in `api/agent.ts`): `find_tables`, `create_joins`, `select_columns`, `create_metric`, `profile_data`, `fix_health`, `test_model`, `coach`, `publish`, `share`. Each has an `availableWhen` gate based on `ProjectState`.

---

## ProjectState shape

```typescript
{
  id: string;
  name: string;
  buildStep: 'empty' | 'tables' | 'joined' | 'transformed' | 'healthy';
  activeTab: 'visualizer' | 'preview' | 'notebook';
  testMode: boolean;
  context: ProjectContext;       // purpose, persona, sampleQuestions, businessLogic, spotterInstructions
  addedTables: string[];         // drives LeftPanel and Visualizer dynamically
  columnsSelected: boolean;      // gates testing, coaching, prep
  includedColumns: Record<string, string[]>; // tableId → [colName, ...]
}
```

---

## Figma files

| File | Key |
|------|-----|
| FigJam (workflow diagrams) | `60MAfL7Hw61kD5ygWPHMZI` |
| Figma (UI designs) | `qLZ511mHw8l2vXlyJKRCsv` |

Never create new Figma or FigJam files for Data Studio work. Always write into these two.

---

## Hard rules

- **Never restructure the routing pipeline** without asking — it is load-bearing and has been carefully tuned across 6 sessions.
- **Never invent mock data** — all table names, column names, and values must come from `mockData.ts`.
- **Never add prototype components to `src/components/`** — DataStudio components go in `src/prototypes/DataStudio/components/` only.
- **Always run `npm run build`** before marking a session complete.
- **WorkflowDirectory** is currently cosmetic (clicking does nothing). Do not wire it unless explicitly asked.
- **Manual paths** for all workflows are intentionally deferred — build agentic paths first.
