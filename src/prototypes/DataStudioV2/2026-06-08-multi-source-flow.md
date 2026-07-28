# Multi-Source Model Flow — Implementation Spec
_2026-06-08 · Session 116_

---

## What we're building

A new scenario pill on the Overview that triggers an extended agentic workflow for building a data model when data lives in multiple places — a warehouse, a third-party API, and a file. The Customer Health Scorecard is the demo use case.

This extends the existing from-scratch flow (ChatView → plan → Workspace) with a new **data ingestion phase** before the plan surfaces. Once the staging table is created, the flow hands off to the existing modeling scripts unchanged.

The agent becomes a **data team agent**, not just a data modeling agent. This is the key shift this scenario demonstrates.

---

## Entry point

**New pill on Overview hero prompt:** `Multi-source model`

Clicking it pre-loads ChatView with this user prompt:
> "I need to build a Customer Health Scorecard. Our core customer data lives in Snowflake, but I have other disparate sources I need to blend with it."

This message triggers the `scan_multi_source` script automatically (same pattern as the existing from-scratch flow).

---

## Object model

| Object | Created when | Right panel card | Canvas view |
|---|---|---|---|
| Snowflake tables (×4) | After `scan_multi_source` confirms | 4 cards in context, labeled "via SF_PROD_CUSTOMER" | DataPreview — schema + sample rows |
| Notebook | After `create_pendo_notebook` | Notebook card | NotebookView — cells + output, user can edit |
| CSV Dataset | After `process_csv_upload` | CSV card | DataPreview — schema + sample rows |
| Staging Table | After `compile_staging_table` | Staging table card | DataPreview — columns with sourceTable + sourceColumn fields |
| Plan | After user says "ready, build" | Plan card | PlanPanel (existing) |
| Model | After existing modeling flow | Model card | Existing model view |

All objects are clickable at any time. The agent doesn't open them automatically — the user opens them if they want to inspect.

---

## End-to-end flow

### Phase 1 — Environment scan

**Script key:** `scan_multi_source`

**Working steps:**
```
● Scanning data environment
  detail: "1 connection found: SF_PROD_CUSTOMER (Snowflake)"

● Analyzing schema for customer health indicators
  detail: "240 tables scanned · 4 matches across ANALYTICS_DB, SFDC_RAW,
           GONG_INTEGRATION, JIRA_WORKSPACE"
  collapsible: semantic search SQL

● Profiling matched tables
  detail: "DIM_ACCOUNTS 12k rows · SUPPORT_CASES 84k rows ·
           CALL_METRICS 31k rows · CUSTOMER_FOUND_DEFECTS 6.2k rows"
```

**Proposal (not autoComplete):**
> "I found 4 tables in your Snowflake environment that cover customer accounts, support history, engagement, and engineering escalations. Do these look right?"
> [Table cards shown inline in proposal — name + description]

**On confirm:**
- 4 table cards added to right panel context
- State: `addedTables: ['dim_accounts', 'support_cases', 'call_metrics', 'customer_found_defects']`

**Execution message:**
> "These 4 tables are set as your core sources. What other data do you want to bring in?"

---

### Phase 2 — User specifies additional sources

User types: "I would like to fetch data from Pendo for NPS data and a CSV file for CSM and Exec Sponsor to Accounts mapping"

Routes to: `create_pendo_notebook`

---

### Phase 3 — Pendo ingestion

**Script key:** `create_pendo_notebook`

**Working steps:**
```
● Creating Python notebook container
  detail: "pendo_nps_ingestion.ipynb ready"

● Configuring Pendo API endpoint
  detail: "GET /v2/nps · target column: nps_comments"

● Preparing sentiment analysis pipeline
  detail: "VADER sentiment classifier loaded"
```

**Proposal (not autoComplete):**
> "I've set up a notebook to fetch your Pendo NPS data and run sentiment analysis. To authenticate, I need your Pendo Integration Key."

**New UI pattern — masked API key input:**
Rendered inside the proposal message as an inline input field. Masked (••••••). User types key and submits. Key is stored as a cell in the notebook (masked in the UI, stored as a variable `PENDO_API_KEY`).

After key submitted, agent responds: "Got it. Please confirm — I'm predicting the NPS text column is `nps_comments`. Is that right?"

User confirms → triggers `execute_pendo_fetch`

---

**Script key:** `execute_pendo_fetch`

**Working steps:**
```
● Authenticating with Pendo API
  detail: "200 OK"
  collapsible: Python cell — requests.get(endpoint, headers=...)

● Fetching NPS responses
  detail: "2,847 records fetched"
  collapsible: Python cell — response parsing

● Running sentiment classification
  detail: "positive: 61% · neutral: 24% · negative: 15%"
  collapsible: Python cell — VADER sentiment scoring

● Writing to ThoughtSpot CDW (Spotstore)
  detail: "pendo_nps_enriched · 2,847 rows · 6 columns"
  collapsible: CREATE TABLE SQL
```

**autoComplete: true**

**Execution message:**
> "Pendo NPS data is cached in the Spotstore. Notebook is available in the panel — you can open it to review or edit."

**Right panel:** Notebook card added. NotebookView in canvas shows all cells + output.

---

### Phase 4 — CSV upload

Agent continues: "Now I need the CSM mapping file you mentioned. Please upload it."

**New UI pattern — file drop zone:**
Rendered inline in the agent message. Drop zone with "Drop CSV here or click to browse." User drops `CSM_MAPPING_Q2.csv`.

**Script key:** `process_csv_upload`

**Working steps:**
```
● Reading CSM_MAPPING_Q2.csv
  detail: "142 rows · 4 columns"

● Detecting join key
  detail: "account_id — 100% match coverage with DIM_ACCOUNTS"

● Schema alignment and type normalization
  detail: "All types clean · no nulls detected"

● Writing to ThoughtSpot CDW (Spotstore)
  detail: "csm_account_mapping · 142 rows · 4 columns"
```

**autoComplete: true**

**Execution message:**
> "CSM mapping loaded and cached. File is available in the panel to review."

**Right panel:** CSV Dataset card added. DataPreview in canvas shows schema + sample rows.

---

### Phase 5 — Staging table compilation

**Script key:** `compile_staging_table`

**Working steps:**
```
● Identifying join key across external sources
  detail: "account_id present in both sources · 100% overlap"

● Running SQL compilation query
  detail: "Joining pendo_nps_enriched + csm_account_mapping"
  collapsible: |
    CREATE TABLE spotstore.customer_health_external AS
    SELECT
      p.account_id,
      p.nps_score,
      p.nps_comments,
      p.sentiment,
      p.sentiment_score,
      c.csm_name,
      c.exec_sponsor,
      c.csm_region,
      c.account_tier
    FROM spotstore.pendo_nps_enriched p
    LEFT JOIN spotstore.csm_account_mapping c
      ON p.account_id = c.account_id

● Writing unified staging table to ThoughtSpot CDW
  detail: "customer_health_external · 2,847 rows · 9 columns"
```

**autoComplete: true**

**Execution message:**
> "All external sources are compiled into a single staging table — `customer_health_external` is ready in the Spotstore. You can review it in the panel. When you're ready, tell me and I'll build the model."

**Right panel:** Staging Table card added. DataPreview shows schema with `sourceTable` + `sourceColumn` fields per column.

---

### Phase 6 — Handoff to existing modeling flow

User: "Ready. Build the model."

This triggers the existing plan + modeling scripts. Plan covers:
- Sources: `customer_health_external` (staging) + 4 Snowflake cached tables
- Joins: `customer_health_external.account_id → dim_accounts.account_id`
- Column selection: agent selects relevant columns (existing `select_columns` pattern)
- Formulas: health score formula

From here: existing Workspace, existing scripts, no new work.

---

## New data needed in mockData.ts

### Snowflake tables (Customer Health schema)

**dim_accounts**
```
account_id, account_name, industry, arr, contract_start_date,
contract_end_date, region, account_tier, renewal_date
```

**support_cases** (from SFDC_RAW)
```
case_id, account_id, created_date, closed_date, priority,
status, case_category, resolution_time_hours, reopened
```

**call_metrics** (from GONG_INTEGRATION)
```
call_id, account_id, call_date, duration_minutes, sentiment_score,
talk_ratio_rep, next_steps_mentioned, deal_risk_flag
```

**customer_found_defects** (from JIRA_WORKSPACE)
```
defect_id, account_id, reported_date, severity, status,
resolution_days, escalated_to_engineering
```

### Spotstore tables (created by agent)

**pendo_nps_enriched**
```
account_id, nps_score, nps_comments, sentiment (positive/neutral/negative),
sentiment_score, response_date
```

**csm_account_mapping**
```
account_id, csm_name, exec_sponsor, csm_region, account_tier
```

**customer_health_external** (staging — unified)

| column | sourceTable | sourceColumn |
|---|---|---|
| account_id | pendo_nps_enriched | account_id |
| nps_score | pendo_nps_enriched | nps_score |
| nps_comments | pendo_nps_enriched | nps_comments |
| sentiment | pendo_nps_enriched | sentiment |
| sentiment_score | pendo_nps_enriched | sentiment_score |
| csm_name | csm_account_mapping | csm_name |
| exec_sponsor | csm_account_mapping | exec_sponsor |
| csm_region | csm_account_mapping | csm_region |
| account_tier | csm_account_mapping | account_tier |

---

## New types needed

### Extended CreatedItem (ChatContextPanel)
```typescript
type CreatedItemType =
  | 'plan' | 'model' | 'quality-plan' | 'instructions'  // existing
  | 'table'         // Snowflake tables from phase 1
  | 'notebook'      // Python notebook (Pendo ingestion)
  | 'csv-dataset'   // Uploaded CSV file
  | 'staging-table' // Unified staging table in Spotstore
```

### Extended ColumnMeta (for staging table columns)
```typescript
interface ColumnMeta {
  // ... existing fields ...
  sourceTable?: string;   // which table this column came from
  sourceColumn?: string;  // original column name in the source table
}
```

### Extended TableMeta (to mark Spotstore tables)
```typescript
interface TableMeta {
  // ... existing fields ...
  connectionType: 'snowflake' | 'thoughtspot' | 'sap'  // 'thoughtspot' = Spotstore
  isStaging?: boolean;  // marks staging/intermediate tables
}
```

### New inline message UI types
Two new message subtypes (or new fields on `AgentMessage`) for rendering inline inputs:

```typescript
interface AgentMessage {
  // ... existing fields ...
  inlineInput?: {
    type: 'api-key' | 'file-upload';
    label: string;
    placeholder?: string;
    onSubmit: (value: string | File) => void;
  };
}
```

---

## New ProjectState fields needed

```typescript
interface ProjectState {
  // ... existing fields ...
  scenario?: 'warehouse' | 'multi-source';  // which pill triggered this
  spotStoreTables?: string[];               // tables created in ThoughtSpot CDW
  stagingTableId?: string;                  // the unified staging table
}
```

---

## Build order

1. **Mock data** — add the 6 new tables to `mockData.ts` with realistic rows
2. **New CreatedItem types** — extend type, add rendering in `ChatContextPanel.tsx`
3. **Staging column fields** — add `sourceTable` + `sourceColumn` to `ColumnMeta`, render in DataPreview
4. **Pill** — add `Multi-source model` chip to Overview hero prompt, wire to open ChatView with pre-loaded prompt
5. **`scan_multi_source` script** — phase 1: env scan + table proposal + table cards in context
6. **`create_pendo_notebook` script** — creates notebook, shows inline API key input
7. **Inline API key input** — new UI component rendered inside a response message
8. **`execute_pendo_fetch` script** — runs notebook, auto-complete, adds Notebook card
9. **`process_csv_upload` script** — file drop zone inline in message, processes CSV, adds CSV Dataset card
10. **Inline file upload** — new UI component rendered inside a response message (leverage existing plus button pattern)
11. **`compile_staging_table` script** — SQL compilation, adds Staging Table card
12. **Staging table in DataPreview** — extend DataPreview to render `sourceTable` + `sourceColumn` columns when `isStaging: true`
13. **Routing** — wire `processText()` to route the initial prompt to `scan_multi_source` and subsequent messages to the right scripts

---

## What reuses unchanged

- `runFlow()` — all new scripts use the same runner
- `autoComplete` pattern — phases 3, 4, 5 all auto-complete
- Proposal + confirm pattern — phase 1 (table confirmation) uses the existing confirm flow
- `NotebookView` in CenterPanel — renders the Pendo ingestion notebook as-is
- `DataPreview` in CenterPanel — used for all table/CSV/staging views, minor extension only
- `PlanPanel` — unchanged, plan covers staging table + Snowflake tables
- All existing Workspace scripts (joins, columns, formulas) — unchanged

---

## Session start for next session

Read this file first, then `CONTEXT.md`, then start at step 1 of the build order.
