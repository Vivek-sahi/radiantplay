# Data Studio — Product Requirements Document (Option 2)

**Version:** 0.2 — Draft  
**Date:** 2026-04-08  
**Author:** Vivek Sahi  
**Status:** In Review

---

## 1. Overview

Data Studio is a data modeling and analytics platform for data teams. It enables users to connect to data sources (warehouses and dbt), create semantic projects, query data via natural language, monitor model health, and resolve issues through agent-driven workflows.

The primary user is the **analytics engineer / data user** — someone who takes raw warehouse tables and produces a clean, published data model that business users can query via AI.

---

## 2. Goals

### Primary
- Reduce time from raw warehouse data → queryable semantic model
- Enable plug-and-play analytics from existing dbt models and semantic views
- Provide agent-assisted modeling, debugging, and issue resolution
- Ensure reliability through monitoring signals + guided fix workflows
- Build trust through governance (verified status, business terms, lineage)

### Non-Goals (v1)
- Full BI dashboarding suite
- Replacing dbt or warehouse transformation pipelines
- Heavy ETL / pipeline creation
- Real-time streaming data support
- Multi-warehouse query federation

---

## 3. User Personas

| Persona | Description | Primary Tasks |
|---|---|---|
| **Analytics Engineer** | Primary user. Owns the semantic layer. Builds and maintains data models. | Connect sources, create projects, fix issues |
| **Data Team Lead** | Oversees model quality and team output. Reviews monitoring signals. | Monitor alerts, verify projects, review governance |
| **Business Analyst** | Consumes published models. Queries via natural language. | Explore data, flag bad results |
| **Admin** | Manages workspace connections and permissions. Owns verification approvals. | Connect warehouse/dbt, manage access, approve verifications |

---

## 4. System Architecture

```
Data Sources → Projects → Monitoring Signals → Agent Actions → Governance
     ↓               ↓              ↓                  ↓              ↓
  Warehouse       Semantic       Alerts            Guided fix      Verified
  DBT Cloud       Models         (4 types)         workflows       projects
```

### Layers

1. **Setup** — Connect warehouse, connect dbt
2. **Build** — Create project from tables (agentic) or from models (plug-and-play)
3. **Run** — Query execution, monitoring signals, usage tracking
4. **Act** — Agent-driven fix, expand, optimize, sync
5. **Trust** — Verification, business terms, memory, catalog integration

---

## 5. Information Architecture

### Global Navigation

```
Overview                 ← Home dashboard
Projects                 ← All / Mine / Shared
Data                     ← Tables / Models
Connections              ← Warehouse connections / DBT connections
Monitoring               ← All alerts / by type (global — across all projects)
Trust & Governance       ← Verified projects / Business terms / Memory / Catalog
```

### Overview (Home)
- Active alerts (top P1/P2 monitoring issues)
- Recent projects (last modified)
- Quick links: Explore data, New project, Add connection

### Projects
- Project list with tabs: All / Mine / Shared
- Columns: Name, Status, Source (Warehouse/DBT), Last Modified, Health, Spotter Conversations
- Create project CTA → two paths (see Section 7)
- Clicking a project opens the **Project Workspace** in View mode by default

### Data
- **Tables** — all tables from connected warehouses, with schema/column browser
- **Models** — all imported dbt models and semantic views

### Connections
- **Warehouse connections** — all configured warehouse connections (Snowflake, BigQuery, Redshift, Databricks, PostgreSQL)
- **DBT connections** — all configured dbt Cloud / dbt Core connections
- Add connection CTA → flows in Section 6

### Monitoring
- Global alert list, filterable by type and project
- Alert detail view with agent-assisted fix panel

### Trust & Governance
- Verified projects (Draft / Verified / Deprecated lifecycle)
- Business terms glossary (org-level)
- Memory (agent-saved business context, org-level)
- Catalog integration (Atlan, Alation, Collibra)

### Project Workspace (per-project)
Each project has its own workspace with two modes:
- **Edit mode** — for building and refining the semantic model
- **View mode** — for monitoring, operating, and reviewing a published model

See Section 10 for full workspace spec.

---

## 6. Connect Data Sources

### 6.1 Warehouse Connection

**Step flow:**
```
Select warehouse type
  → Enter credentials
    → Validate connection (live test)
      → Fetch metadata (schemas, tables, columns)
        → Configure import options
          → Confirm (summary of tables and views)
```

#### Step 1 — Select Warehouse Type
Options: Snowflake · BigQuery · Redshift · Databricks · PostgreSQL

---

#### Step 2 — Enter Credentials

**Snowflake**

| Field | Required | Notes |
|---|---|---|
| Display name | Yes | Label for this connection |
| Account identifier | Yes | e.g. `xyz12345.us-east-1.aws` |
| Warehouse | Yes | Compute warehouse name |
| Database | Yes | Default database |
| Authentication type | Yes | Key Pair (recommended) or OAuth |
| — Key Pair: Username | Yes | Snowflake username |
| — Key Pair: Private key | Yes | PEM-encoded PKCS8, no passphrase |
| — OAuth: Client ID | Yes | From Snowflake security integration |
| — OAuth: Client Secret | Yes | From Snowflake security integration |
| Role | No | Defaults to user's Snowflake default |
| Default schema | No | Auto-selects PUBLIC if blank |
| Database timezone | No | For time dimension handling |

> Note: Snowflake is deprecating username/password auth (MFA enforced). Key Pair is the recommended auth method.

**BigQuery**

| Field | Required | Notes |
|---|---|---|
| Display name | Yes | |
| Service account JSON | Yes | Upload file → auto-populates all auth fields |
| Default dataset | Yes | |
| Region | Yes | e.g. `US`, `EU`, `us-central1` |
| Database timezone | No | |

> Auto-populated from JSON: `project_id`, `private_key`, `client_email`, `client_id`, all OAuth URIs.

**Redshift**

| Field | Required | Notes |
|---|---|---|
| Display name | Yes | |
| Host | Yes | Redshift endpoint address |
| Port | Yes | Default: 5439 |
| Database | Yes | |
| Username | Yes | |
| Password | Yes | |
| SSL certificate | No | Alternative to password auth |

**Databricks**

| Field | Required | Notes |
|---|---|---|
| Display name | Yes | |
| HTTP Path | Yes | From Databricks connection settings |
| Default catalog | Yes | |
| Default schema | Yes | |
| Access token | Yes (or OAuth) | Personal access token |
| OAuth M2M | No | Alternative to PAT for service accounts |

---

#### Step 3 — Validate Connection
- Live connection test fires immediately after credentials are entered
- Tests: authentication → database access → schema read permissions
- Shows: ✓ Connection successful / ✗ [specific error with fix suggestion]
- Failure modes surfaced: wrong account ID format, expired credentials, missing role permissions, IP not allowlisted, SSH tunnel misconfigured

---

#### Step 4 — Fetch Metadata
What is fetched on successful connection:
- All databases visible to the role
- All schemas within each database
- All tables and views per schema
- All columns per table (name, type, nullable, description/comment)
- Foreign key constraints (Snowflake, PostgreSQL) — used for join inference
- Row counts (approximate, from information_schema)
- Last modified timestamps per table

**Import configuration options shown to user:**
| Option | Description |
|---|---|
| Include schemas | Comma-separated list; blank = all schemas |
| Exclude schemas | Regex pattern or list to suppress |
| Offload large schemas | Lazy-load schemas with >500 tables; browsable on demand |
| Infer relationships from FK | Auto-detect joins from foreign key constraints |
| Query timeout | Seconds before query is cancelled (default: 900s) |

---

#### Step 5 — Confirm
Summary screen shows:
- Connection name
- Auth method used
- Databases accessible: N
- Schemas imported: N
- Tables and views: N
- Estimated refresh time for schema sync
- Network security note (IP allowlist CIDRs to add, SSH public key if tunnel configured)

---

#### Network Security (Optional, shown as expandable section)

**IP Allowlist**
- Data Studio publishes a set of static outbound IP CIDRs
- User must add these to their warehouse firewall rules before creating the connection
- IPs displayed on the connections setup page

**SSH Tunnel**
- Data Studio generates an RSA keypair
- User copies the public key to their bastion host's `authorized_keys`
- User provides: SSH host, SSH port, SSH username
- Tunnel validates before connection proceeds

---

### 6.2 DBT Connection

**Step flow:**
```
Select DBT source type (dbt Cloud / dbt Core)
  → Enter DBT credentials
    → Validate connection (confirm access to project + models)
      → Fetch DBT metadata (models, lineage, tests, metrics)
        → Link warehouse (select existing warehouse or connect new)
          → Validate end-to-end (ensure models can be queried in warehouse)
            → Import models (auto import all models)
              → Confirm import (summary of imported models)
```

---

#### Step 1 — Select DBT Source
- **dbt Cloud** — hosted, connects via service token
- **dbt Core** — self-hosted, connects via git repository

---

#### Step 2 — Enter DBT Credentials

**dbt Cloud**

| Field | Required | Notes |
|---|---|---|
| Display name | Yes | |
| Account ID | Yes | From dbt Cloud URL: `/settings/accounts/{id}` |
| Project ID | Yes | From dbt Cloud URL: `/projects/{id}` |
| Environment ID | Yes | The production deployment environment ID |
| Service token | Yes | Must have both **Metadata Only** + **Job Admin** permissions |

> The Environment ID is the stable identifier for production state. All Discovery API queries, Semantic Layer, and cross-project refs use this ID.

**dbt Core (Git)**

| Field | Required | Notes |
|---|---|---|
| Display name | Yes | |
| Git repository URL | Yes | SSH URL, e.g. `git@github.com:org/dbt-project.git` |
| Git branch | Yes | Default: `main` |
| Default schema | Yes | Schema where dbt deploys models |
| Subfolder | No | If `dbt_project.yml` is not at repo root |

> Data Studio generates an SSH deploy key → user adds it to the repo's Deploy Keys in GitHub/GitLab.

---

#### Step 3 — Validate Connection
- Confirms: service token has correct permissions / repo is accessible
- Confirms: target environment has a successful run (for dbt Cloud)
- Confirms: `dbt_project.yml` is found at repo root (for dbt Core)

---

#### Step 4 — Fetch DBT Metadata

What is imported from dbt (via Discovery API manifest):

**Models**
- Name, description, schema, database, materialization type
- Raw SQL + compiled SQL
- Column-level descriptions (from `schema.yml`)
- Defined tests per column (unique, not_null, accepted_values, relationships)
- Last run status (success / error / skipped) + execution time
- Last run error message (if applicable)

**Lineage**
- Upstream ancestors (source tables → staging → intermediate → marts)
- Downstream children (which models depend on this model)
- Column-level lineage (where available)

**Sources**
- Source name, schema, database
- Freshness configuration (`warn_after`, `error_after` thresholds)
- Last loaded at timestamp + freshness status

**Metrics (dbt Semantic Layer / MetricFlow)**
- Metric name, type (simple / ratio / cumulative / derived), description
- Underlying measure and semantic model
- Dimensions available for slicing
- Time grain options

**Tests**
- Test name, type, column tested, last run status (pass / warn / error)
- Failure count and example failing rows

---

#### Step 5 — Link Warehouse
- Select an existing warehouse connection (from connections already configured)
- Or: shortcut to create a new warehouse connection inline
- Data Studio validates that the dbt models can be queried against the linked warehouse

---

#### Step 6 — Validate End-to-End
- Runs a sample query against 2-3 imported models in the linked warehouse
- Confirms: models are materialized (tables/views exist in the schema)
- Flags: any models that are referenced in dbt but not yet materialized

---

#### Step 7 — Confirm Import
Summary screen shows:
- Models imported: N (breakdown by folder/subfolder)
- Sources: N
- Tests: N (pass/warn/fail counts)
- Metrics: N
- Semantic models: N
- Lineage depth: N levels
- Last successful dbt run: [timestamp]

---

## 7. Create a Project

Both project creation paths are **agent-first**: the user describes their use case in natural language and the agent drives the entire flow — fetching data, recommending a model, reviewing AI readiness, and initiating testing. Forms and manual selections are fallbacks, not the primary UI.

### Prioritization: Models over Tables

When a user creates a project and the workspace has both warehouse tables and imported models (dbt / semantic views), the agent **always checks for an existing model first**. If a suitable model exists, the agent recommends it (Section 7.2 path). It only falls back to building from raw tables (Section 7.1 path) if no existing model covers the stated use case. Users can override this recommendation and request a table-based build explicitly.

### One-Shot vs Step-by-Step

The agent defaults to a **one-shot recommendation** — proposing tables, joins, and metric formulas together in a single pass. However, users can work step-by-step through the agent conversation if they prefer more control:
- "Let's start with just the tables — don't add joins yet"
- "Show me the joins before adding any metrics"

The agent adapts to this pace and holds back subsequent steps until the user is ready. There is no separate manual flow — it is the same agent conversation, just progressing more incrementally.

---

### 7.1 From Warehouse Tables (Agentic Build)

**Intended for:** Analytics engineers starting from raw warehouse tables with no existing semantic layer.

**Full flow (from Figma):**
```
Create new project
  → User describes use-case in natural language
    → [Context gate] Does context capture intent, use-cases, persona and sample questions?
        No → Agent and user discuss more context (loop)
        Yes → Agent fetches data the user has access to
                → Agent recommends base model: tables, joins, columns and formulas
                  → [Accept gate] Does user accept base model recommendation?
                      No → Agent and user discuss more context / user can add tables manually
                      Yes → Agent creates the base model
                              → Agent reviews descriptions, metadata, context for tables and columns
                                → Agent recommends AI readiness updates
                                  → [AI gate] Does user accept AI readiness recommendation?
                                      No → Agent and user update descriptions / context (loop)
                                      Yes → Agent updates context
                                              → Agent recommends user to test the model
                                                → Agent switches view to test mode (or user switches manually)
                                                  → Agent pre-populates questions to test
                                                    → User asks or selects a question
                                                      → Agent generates response
                                                        → [Quality gate] Does response meet user expectation?
                                                            Yes → User publishes the model
                                                            No → [see Test Loop below]
```

---

#### Step 1 — Describe Use Case (Natural Language)

The project creation entry point is a single open text prompt — no form, no table picker.

Agent prompt: *"What are you trying to analyze? Describe the use case, the questions you want to answer, or the business team you're building this for."*

Examples of what the user might type:
- "I want to analyze campaign performance vs revenue for the marketing team"
- "The growth team needs to track weekly active users and retention cohorts"
- "Finance needs a project to monitor query costs by team per month"

Agent evaluates whether the description captures:
- **Intent** — what questions will be answered
- **Use cases** — specific analyses or reports needed
- **Persona** — who will be using this model (business user type)
- **Sample questions** — 3–5 representative NL queries to test against later

If any are missing, agent asks follow-up questions before proceeding.

---

#### Step 2 — Agent Fetches Available Data

Once context is sufficient, agent scans the connected warehouse(s):
- Tables and views the user has read access to
- Existing semantic views (if any)
- Schema descriptions and column comments

Agent does not show a raw table picker — it reasons about what's relevant to the stated use case.

---

#### Step 3 — Agent Recommends Base Model

Agent presents a recommendation:
- **Tables to include**: name, row count, why it's relevant to the use case
- **Join graph**: proposed joins with join type, join condition, and confidence (High/Medium/Low)
  - Source: FK constraint / column name match / data sample
  - Fan-out warnings: "Joining orders to order_items is many-to-one — I'll exclude this from aggregates by default"
- **Columns to expose**: key dimensions and measures surfaced from column names and types
- **Proposed metrics**: e.g. "Return on Spend = SUM(revenue) / SUM(cost)" with rationale

User can accept the recommendation, reject and discuss, or manually add/remove tables.

**Decision point:** "Does user accept base model recommendation?"
- **Yes** → agent creates the base model
- **No** → agent asks clarifying questions, user can also manually pick tables to seed the model

---

#### Step 4 — Agent Creates the Base Model

On acceptance, agent materializes the semantic model:

**Dimensions** auto-generated:
- String/boolean columns → categorical dimensions (snake_case → Title Case labels)
- Date/timestamp columns → time dimensions (grain options: day/week/month/quarter/year)
- FK columns → join keys (hidden from UI, used for relationships only)

**Measures** auto-generated from column names:
- `SUM` → columns containing: `amount`, `revenue`, `cost`, `quantity`, `value`, `price`
- `COUNT_DISTINCT` → columns containing: `_id`, `order_id`, `user_id`, `session_id`
- `AVG` → columns containing: `duration`, `score`, `rate`, `latency`

**Derived metrics** (agent-proposed, user confirms):
- Formulas inferred from use case description and column combinations
- Agent explains each metric: "Return on Spend = campaign revenue / campaign cost — is this the right definition?"

---

#### Step 5 — Agent Reviews and Recommends AI Readiness Updates

After building the base model, agent audits it for AI readiness (see Section 9 for full AI Readiness Score spec).

Agent surfaces specific gaps and proposed fixes, e.g.:
- "14 columns have no description — I've drafted descriptions based on column names and data samples. Review them?"
- "The metric `ros` has a technical name — would you like to rename it to `Return on Spend`?"
- "The `campaign_id` column has 18% nulls. Add a note that nulls represent direct traffic?"
- "I recommend adding 3 sample questions to help Spotter understand this model's intent."

**Decision point:** "Does user accept AI readiness recommendation?"
- **Yes** → agent applies all updates
- **No** → agent and user discuss; user can manually edit specific fields; user can also skip individual recommendations

---

#### Step 6 — Agent Recommends Testing

Agent: *"Your model is ready to test. I've prepared 5 sample questions based on the use case you described. Want to switch to test mode?"*

Agent initiates (or user manually initiates) switch to test view.

---

#### Step 7 — Test Mode with Pre-Populated Questions

Test mode is a full-width Spotter-style chat interface.

Agent pre-populates questions derived from:
- The use case description from Step 1
- The persona and sample questions the user confirmed
- Common analytical patterns for the domain (e.g., time-series, ranking, comparison)

Example pre-populated questions for "Campaign Performance":
1. "Which campaigns had the highest Return on Spend last quarter?"
2. "Show me weekly revenue by campaign type"
3. "Which regions had the most campaign spend but lowest conversion?"

User can ask/select any question.

---

#### Step 8 — Iterative Fix Loop (If Response Fails)

**Decision point:** "Does the response meet user expectation?"

**Yes** → proceed to publish

**No** → agent diagnoses the failure type:

**Path A: Interpretation issue** (agent gave a correct answer to the wrong question)
- Agent evaluates the model: are the right fields and joins being used for this query?
- Could agent identify the issue?
  - **Yes** → agent updates the model (adds/corrects a dimension, metric definition, or join) → retries the answer
  - **No** → agent flags it, asks user to describe what the correct answer should be → user explains → agent updates → retries

**Path B: Data issue** (agent interpretation was correct but underlying data is wrong)
- Agent does full data profiling on relevant tables
- Could agent identify the issue?
  - **Yes** → agent flags the fix (e.g., null handling, date truncation, deduplication needed) → agent makes fixes + schedules prep jobs for every cache run → retries
  - **No** → agent checks: is the data cached in ThoughtSpot?
    - **Cached** → agent asks user to invalidate cache and refresh
    - **Not cached** → agent asks user to cache the data model in ThoughtSpot to fix the issue (caching enables pre-computation and resolves some data consistency issues)

Both paths loop back to: user asks a question → agent generates response → quality gate.

---

#### Step 9 — Publish

User publishes the model. The published model becomes available to business users via Spotter/AI chat.

---

### 7.2 From Imported Model (Semantic View or DBT)

**Intended for:** Teams with an existing semantic layer (dbt Semantic Layer or Snowflake semantic views) who want plug-and-play analytics.

**Full flow (from Figma):**
```
Create new project
  → User describes use-case in natural language
    → [Context gate] Does context capture intent, use-cases, persona and sample questions?
        No → Agent and user discuss more context (loop)
        Yes → Agent fetches data the user has access to
                → Agent recommends an existing model that already solves this use-case
                  → [Accept gate] Does user accept the model selection?
                      No → Agent and user discuss more context / user can select manually
                      Yes → Agent populates the imported model in the project
                              → Agent flags issues: Got right / Error states / Couldn't be imported
                                → Agent recommends how to fix translation gaps
                                  → Agent fixes the gaps
                                    → Agent recommends user to test the model
                                      → [same test loop as 7.1 Steps 6–8, but...]
                                        → Agent adds BI-specific context to the model (preserved in ThoughtSpot)
                                          → User selects auto or manual sync with the source model
                                            → User publishes the model
```

---

#### Step 1 — Describe Use Case (Natural Language)

Identical to Section 7.1 Step 1. Same context gate applies.

---

#### Step 2 — Agent Fetches and Recommends Existing Model

Rather than building a new model, agent searches imported dbt models and semantic views:

Agent evaluates each available model against the stated use case:
- Do the model's dimensions and measures match the intended analysis?
- Does the model have sufficient documentation to understand its intent?
- Is the model healthy (last run: success, tests passing)?

Agent presents a ranked recommendation:
- "I found `fct_campaign_performance` — it covers campaign revenue, spend, and ROI by channel. This matches your use case closely."
- Shows: model name, description, source (dbt folder/schema), last run status, test pass rate, dimensions/measures summary

**Decision point:** "Does user accept the model selection?"
- **Yes** → agent imports the model into the project
- **No** → agent asks what's missing; user can select a different model or combine multiple models

---

#### Step 3 — Agent Imports Model and Flags Issues

Agent populates the project with the imported model's full structure.

Three states per imported element:
- **Got right** ✓ — imported cleanly, description and metadata intact
- **Error state** ⚠ — imported but with issues (e.g., a metric formula references a removed column)
- **Couldn't be imported** ✗ — blocked (e.g., model not materialized, missing warehouse permissions)

Agent reports: "I imported 42 fields. 38 imported cleanly. 3 have errors. 1 couldn't be imported."

---

#### Step 4 — Agent Fixes Translation Gaps

For each error or failed import, agent recommends a specific fix:
- Broken metric reference → "Column `campaign_spend` was renamed to `spend_usd` in the last dbt run. Should I update the metric formula?"
- Missing description → "This dimension has no description in dbt. I've drafted one — does this look right?"
- Model not materialized → "This model hasn't been run in 14 days. Trigger a dbt run or use the last available snapshot?"

Agent applies approved fixes.

---

#### Step 5 — Test Loop (Same as 7.1 Steps 6–8)

Identical test loop — agent pre-populates questions, user tests, iterative fix if needed.

**Key difference for dbt models:**
When the agent identifies an interpretation fix, instead of just updating the model definition, the agent **adds BI-specific context preserved in ThoughtSpot** — descriptions, synonyms, sample questions, and metric coaching notes that live in the Data Studio layer, not in dbt. This preserves the dbt model as the source of truth while enriching it for BI consumption.

---

#### Step 6 — Sync Mode Selection + Publish

Before publishing, user selects how this project syncs with the source model:

| Mode | Behaviour |
|---|---|
| **Auto sync** | When the dbt model is updated (new run, schema change), Data Studio automatically re-imports and re-validates |
| **Manual sync** | User triggers sync on demand; Data Studio does not auto-update |

User then publishes. The BI-specific context (descriptions, sample questions, coaching) added by the agent is preserved independently of dbt and is not overwritten on sync.

---

## 8. Semantic Model Authoring

Semantic model authoring is the ongoing activity of refining a project's model after initial creation — adding field descriptions, adjusting metric formulas, managing joins, curating sample questions, and improving AI readiness. **All authoring is agent-first**: the user instructs the agent in natural language; the agent makes changes and shows a diff for approval.

---

### 8.1 What Can Be Authored

**Fields (dimensions and measures)**
| Property | Description |
|---|---|
| Label | Human-readable name (snake_case → "Revenue Last 30 Days") |
| Description | Plain-language explanation for AI and users |
| Synonyms | Alternate names ("ARR" → "Annual Recurring Revenue") |
| Hidden | Exclude from AI and user-facing pickers; keep for internal joins |
| Format | Number format (currency, percentage, comma), date format |
| Default aggregation | SUM / AVG / COUNT_DISTINCT / MIN / MAX |
| Tags | Categorical labels for filtering in the field picker |
| AI context | Free-text coaching notes for the AI ("always filter to active campaigns unless asked otherwise") |

**Metrics**
| Property | Description |
|---|---|
| Name + label | Identifier and display name |
| Formula | SQL expression or MetricFlow measure reference |
| Description | Business definition |
| Time grain | Default grain: day / week / month / quarter / year |
| Filters | Default filters always applied (e.g., `status = 'active'`) |
| Verified | Mark metric as canonical — surfaces prominently in AI responses |

**Joins**
| Property | Description |
|---|---|
| Join type | left, inner, full outer |
| Condition | Column-to-column expression |
| Relationship | one-to-one, many-to-one, one-to-many |
| Fan-out guard | Exclude from aggregate queries if many-to-many risk |

**Model-level settings**
- Sample questions: 3–10 example NL queries that represent intended use of the model
- Persona context: "This model is built for the marketing team — assume campaign and channel context"
- Default time range: when no date filter specified, default to last 30 days
- Cache policy: TTL duration, refresh trigger (dbt job / schedule / manual)

---

### 8.2 Agent Authoring Interactions

The agent is the primary interface for authoring. Users describe what they want in natural language; the agent translates to model changes.

**Example interactions:**

| User says | Agent does |
|---|---|
| "Add a description to all fields that don't have one" | Drafts descriptions for all undescribed fields using column names + data samples; shows batch diff for review |
| "The metric ROS should always use 90-day attribution" | Updates `Return on Spend` metric to include a default `attribution_window = 90` filter |
| "Hide all the internal ID columns" | Sets `hidden: true` on all columns matching `*_id` pattern, shows list for confirmation |
| "Add 'campaign_type' as a synonym for 'channel'" | Adds synonym to the `channel` dimension |
| "The campaign_id nulls are direct traffic — make sure AI knows that" | Adds AI context note: "NULL campaign_id = direct/organic traffic, not missing data" |
| "Add sample questions for a CMO persona" | Generates 5 CMO-level NL questions and adds them to the model's sample question set |

**Change preview:** Every agent action shows a structured diff (field name → before → after) before applying. User can approve all, approve selectively, or edit inline.

---

### 8.3 Manual Authoring Fallback

For users who prefer direct editing, a field/metric editor panel is accessible from the workspace. It surfaces the same properties as above in a structured form. Changes made manually are reflected in the agent's context immediately.

---

## 9. AI Readiness Score

The AI Readiness Score is a per-project completeness score that measures how well the semantic model is prepared for reliable AI querying via Spotter or other NL interfaces. It is the gating criterion for publishing a model as Verified.

**Score range:** 0–100  
**Minimum to publish:** 70  
**Verified badge threshold:** 85

---

### 9.1 Score Components

| Component | Weight | What it measures |
|---|---|---|
| Field descriptions | 25% | % of dimensions and measures with non-empty descriptions |
| Metric definitions | 20% | % of key metrics with business definitions and confirmed formulas |
| Sample questions | 15% | Are 3+ sample questions defined that cover the stated use case? |
| Join quality | 15% | Are all joins documented with correct cardinality? Any fan-out risks flagged? |
| Data quality | 15% | dbt test pass rate on the model's source tables |
| Persona context | 10% | Is the model's intended audience and use case described? |

---

### 9.2 What Blocks Publishing

Hard blockers (model cannot be published until resolved):
- 0 metric definitions
- 0 sample questions
- Any failing `not_null` test on a primary join key
- An unfixed fan-out join (would cause row duplication in aggregates)

Soft warnings (can publish, shown as advisory):
- Field descriptions coverage <50%
- No persona context defined
- Last dbt run >7 days ago
- Any column with >25% null rate on a non-optional field

---

### 9.3 AI Readiness Panel (in Workspace)

The AI Readiness tab in View mode shows the current score with a breakdown by component:

```
AI Readiness: 74 / 100  [████████░░]

  Field descriptions    18/25  ████████░
  Metrics               16/20  ████████
  Sample questions      10/15  ██████░░
  Joins                 15/15  █████████
  Data quality          10/15  ██████░░
  Persona context        5/10  █████░░░

  Issues to fix:
  ⚠ 8 fields have no description      [Fix with agent →]
  ⚠ 2 sample questions recommended    [Add questions →]
  ⚠ orders.campaign_id: 18% nulls     [Add context note →]
```

Each issue has a one-click "Fix with agent" shortcut that opens the agent panel pre-loaded with the specific fix task.

When score ≥ 85: a "Request Verification" CTA appears. Requesting verification requires a second approver — verification is not self-serve.

---

### 9.4 AI Readiness in the Project Creation Flow

The AI Readiness Score is surfaced explicitly in Step 5 of project creation (Section 7.1/7.2). The agent does not wait for the user to discover gaps — it proactively audits the model post-creation and presents the score before recommending testing.

The test loop in Step 7–8 can also improve the AI Readiness Score retroactively: if a test response fails and the agent fixes it by adding a description, coaching note, or sample question, those fixes are reflected in the score.

---

## 10. Project Workspace

The project workspace opens when a user navigates into a project. It is a **3-panel layout**:

```
┌─────────────┬──────────────────────────┬──────────────┐
│  Left panel │     Center canvas        │ Agent panel  │
│  (model     │     (tabs)               │ (right,      │
│  outline)   │                          │ collapsible) │
└─────────────┴──────────────────────────┴──────────────┘
```

**Project header (above all panels):**
```
← [Project Name] ⓘ  |  Edit · View  |  Test  ·  Share  ·  Settings
```

The workspace has two modes — **Edit** and **View** — toggled in the header. The mode controls which tabs appear in the center canvas and changes the left panel's interaction behavior. The agent panel is always present in both modes.

---

### 10.1 Left Panel — Model Outline

The left panel shows the project's structure at a glance. It is consistent across Edit and View modes.

```
[Project Name]
├── Sources
│   ├── orders  (Snowflake)
│   ├── campaigns  (Snowflake)
│   └── users  (Snowflake)
├── Dimensions  (14)
├── Metrics  (3)
├── Joins  (2)
└── Health
    ├── AI Readiness: 74
    └── Open alerts: 2
```

- In **Edit mode**: clicking a table highlights it in the Visualizer; clicking a metric opens it in Data Preview. Items are editable via the agent or inline.
- In **View mode**: the outline is read-only. Health indicators show status inline (alert count, data freshness).

---

### 10.2 Center Canvas — Edit Mode

Edit mode is for building and refining the semantic model.

| Tab | Purpose |
|---|---|
| **Visualizer** | Interactive flow diagram — tables as nodes, joins as edges, metric cards floating. Click any node to expand or edit via the agent. |
| **Data Preview** | Tabular view of data from any selected table or join result. Used to spot issues and verify the model before publishing. |
| **Notebook** | SQL / Python cells for ad-hoc queries and exploratory analysis. Agent can generate, explain, and run cells. |

**Test button (in header):** Switches to full-width test mode — a Spotter-style chat for validating the model. Not a tab; replaces the workspace view with a back button to return.

---

### 10.3 Center Canvas — View Mode

View mode is for monitoring, operating, and reviewing a published model. Read-focused — no model editing.

| Tab | Purpose |
|---|---|
| **Monitoring signals** | Active alerts scoped to this project (same structure as Section 13, filtered here). |
| **Data Quality** | Data profile summary for the project's source tables + prep job history. Shows last profiling run, open issues count, prep version active. See Section 11.9 for full spec. |
| **Data Samples** | Representative sample rows from the model's key tables. Used to sanity-check the published data. |
| **Cache** | Cache status and configuration. See Section 12.4. |
| **AI Readiness** | Current score breakdown. See Section 9.3. Includes "Request Verification" CTA when score ≥ 85. |

---

### 10.4 Right Panel — Agent

The agent panel is the primary interaction surface for all workflows — modeling, authoring, data quality, and troubleshooting. It is collapsible but always accessible.

- In **Edit mode**: agent assists with model building, field authoring, AI readiness, and data prep workflows. Remediation plans from data profiling are presented inline in the agent chat.
- In **View mode**: agent helps diagnose and fix monitoring alerts, review AI readiness gaps, and manage cache.

---

## 11. Data Quality & Prep

Data Quality & Prep is an agent-driven workflow for profiling and cleaning a project's data. It is an **edit activity** — triggered from the agent panel in Edit mode. There is no dedicated tab for data quality in Edit mode; the remediation plan is presented inline in the agent chat. Summary information (data profile, job history) lives in the **Data Quality tab in View mode** (Section 10.3).

**Key principle:** The agent profiles the project's data across all tables, presents a consolidated remediation plan in the agent chat, and the user decides which issues to fix — individually or in bulk. Every fix produces a new version. The warehouse source is never modified — prep operates on ThoughtSpot's cached data layer only.

---

### 11.1 Prerequisites

Prep requires the model's data to be **cached** in ThoughtSpot (Section 12). The agent needs materialized data to run profiling and transformations against. If caching is not enabled when the user initiates prep, the agent prompts the user to enable it first:

> "Data prep requires caching to be enabled. Want me to set up caching for this project before running profiling?"

---

### 11.2 Entry Points

- **Edit mode → Data Quality tab**: The primary entry point. User opens the tab; agent offers to run profiling if no plan exists yet.
- **Monitoring alert**: If a monitoring alert diagnoses a data quality issue (e.g., inconsistent results, high negative feedback), the agent can navigate to the remediation plan directly from the alert detail.
- **Test loop (Section 7.1 Step 8)**: When a failing test response traces to a data issue, the agent proactively triggers data profiling as part of the fix path.

---

### 11.3 Profiling Phase

When a user opens the Data Quality tab (or the agent initiates profiling):

**Agent runs profiling against all cached tables in the project:**
- **Completeness**: null rates per column
- **Uniqueness**: duplicate detection on key columns
- **Distribution**: value distributions, outlier detection (z-score + IQR method)
- **Consistency**: type mismatches, format inconsistencies (e.g., date strings in mixed formats, case inconsistencies)
- **Referential integrity**: FK violations, orphaned rows

**Agent presents a summary:**
```
Data profiling complete — found 23 issues across 3 tables

  Critical (block queries):    2
  High (affect results):       8
  Medium (cosmetic/context):  13
```

---

### 11.4 Remediation Plan Table

The core UX artifact: a single consolidated table of issues across all tables in the project, presented inline in the **agent chat panel**. Secondary summary views are available at project level (Data Quality tab in View mode) and at individual table level in the Data section.

| Column | Description |
|---|---|
| Severity | Critical / High / Medium |
| Table | Affected table name |
| Column | Affected column (blank if table-level) |
| Issue type | Null values / Duplicates / Outlier / Type mismatch / Inconsistency / Format |
| Description | Agent's plain-language description of the issue |
| Scope | N rows affected, % of total |
| Suggested fix | Agent's recommended action |
| Status | Pending / Applied / Skipped |

**Example rows:**

| Severity | Table | Column | Issue | Scope | Suggested fix |
|---|---|---|---|---|---|
| Critical | orders | campaign_id | 18% null values | 2,847 / 15,432 rows | Add context note: nulls = direct traffic |
| High | orders | order_id | 7 duplicate orders | 7 / 15,432 rows | Deduplicate — keep latest by created_at |
| High | campaigns | start_date | Mixed date formats (ISO + US) | 423 / 1,205 rows | Normalize to ISO 8601 |
| Medium | orders | order_amount | Outliers detected (>3σ) | 12 / 15,432 rows | Cap at P99 value ($4,200) |
| Medium | users | email | Inconsistent casing (upper/mixed) | 1,840 / 8,120 rows | Lowercase normalize |

---

### 11.5 Actions

**Bulk actions (table toolbar):**
- **Apply All** — apply all Pending suggested fixes at once
- **Apply Critical + High** — apply only severity Critical and High fixes
- **Skip All** — dismiss all pending issues without applying

**Per-row actions:**
- **Apply** — apply this specific fix with the suggested parameters
- **Skip** — dismiss this issue without applying
- **Edit fix** — modify the agent's suggested fix before applying (e.g., change the cap value for outliers, choose which duplicate to keep)
- **Add context** — instead of transforming data, push a context note to the semantic model field (appropriate for structural quirks like "NULL = direct traffic")

---

### 11.6 Prep Operations in Scope (v1)

| Operation | Description |
|---|---|
| **Null handling** | Fill nulls with a constant, mean, or median — or add a semantic context note without touching data |
| **Deduplication** | Remove duplicate rows per a defined key; user selects which copy to retain (latest, earliest, or by priority column) |
| **Outlier capping** | Cap values beyond a threshold: P99, a user-specified max, or a z-score cutoff |
| **Type mismatch correction** | Cast columns to correct types (e.g., string → integer, ISO date string → date) |
| **Inconsistency normalization** | Standardize case, trim whitespace, normalize date formats, consolidate equivalent values (e.g., "NY" / "New York" → "New York") |

**Out of scope for v1:**
- Custom SQL transformations in the prep layer
- Multi-table deduplication (per-table only)
- Real-time / streaming data cleaning
- Writing transformed data back to the warehouse

---

### 11.7 Versioning

Every time the user applies a set of fixes, a new prep version is created:
- Version number: v1, v2, v3...
- Each version records: timestamp, user, list of applied fixes, row counts before/after
- User can roll back to any previous version from the Jobs & Logs tab (View mode)
- Versions are stored in ThoughtSpot's cached data layer — the warehouse source is never modified

---

### 11.8 Scheduling

Prep jobs can be scheduled to run automatically:
- **On cache refresh** (default when scheduling enabled) — prep re-runs each time the cache is refreshed with new upstream data, applying the same fixes to the latest snapshot
- **Manual only** — user triggers prep runs on demand

Scheduled prep runs appear in the **Jobs & Logs** tab in View mode.

---

### 11.9 Context Push

After applying fixes, the agent may recommend pushing semantic context back to the model:
- "I've noted the null `campaign_id` values in the model context — Spotter will now interpret nulls as direct traffic."
- "I've normalized date formats across campaigns. No model changes needed — data is now consistent in the cache."

For issues where the right fix is semantic (explaining the quirk rather than transforming it), the agent creates an AI context note on the relevant dimension or metric. This improves the AI Readiness Score without transforming data.

---

### 11.10 Data Quality in View Mode

The **Data Quality tab** in View mode (Section 10.3) shows a read-only summary of the project's data quality state:

- **Profile summary**: key signals from the last profiling run — null rates, duplicate counts, type issues, outlier counts
- **Active version**: current prep version active (e.g., v3 — applied 2026-04-07 06:32, 18,234 rows affected)
- **Scheduled prep**: status of next scheduled prep run (e.g., "runs on cache refresh — next tonight 12:00 AM")
- **Open issues**: count of unresolved issues from last scan, with link to agent for remediation
- **Job history**: last N prep runs — timestamp, status, version created, rows affected (full history in the Jobs & Logs tab)

---

## 12. Caching

Caching is a first-class concept in Data Studio — it is both a performance optimization and a prerequisite for Data Quality & Prep. The agent actively manages cache configuration as part of the project lifecycle.

---

### 12.1 What Gets Cached

**Model results cache (ThoughtSpot-level)**
- Pre-computed results for common query patterns on a published model
- Stored in ThoughtSpot's result cache
- Served to Spotter without hitting the warehouse for matching queries
- TTL: user-configured (default: 24h, or aligned to dbt refresh schedule)

**Schema cache (Data Studio-level)**
- Fetched warehouse metadata: schemas, tables, columns, row counts
- Refreshed on schedule (configurable) or on dbt run completion
- TTL: 1h default; force-refresh available

---

### 12.2 When the Agent Recommends Caching

The agent surfaces caching as a recommendation in four scenarios:

**1. High query cost alert (Section 13.5)**
- Agent detects the model is being queried frequently with deterministic results
- Agent estimates cost savings: "Caching would reduce this project's weekly cost from 847 credits to ~12 credits"
- Agent checks for real-time consumers before recommending; if none: configures cache TTL aligned to dbt refresh schedule

**2. Slow query alert (Section 13.6)**
- When root cause is large table scans or warehouse contention, caching pre-computed results eliminates the warehouse hit entirely
- Agent recommends: "Cache this model's results — queries will be served in <1s instead of 47s"

**3. Inconsistent results (Section 13.8)**
- When non-determinism is caused by concurrent warehouse writes during query execution, caching at a stable snapshot point eliminates the inconsistency
- Agent: "Cache at the last dbt run snapshot to ensure all users see consistent results"

**4. Test loop — data issue path (Section 7.1 Step 8)**
- When a failing test response traces to a data consistency issue, the agent may ask the user to cache the data model as part of the fix
- Agent: "Caching this model will pre-compute the results and eliminate the inconsistency caused by concurrent updates"

---

### 12.3 Cache Configuration

| Setting | Options | Default |
|---|---|---|
| Cache enabled | On / Off | Off (must be opted in) |
| TTL | 1h / 6h / 12h / 24h / Custom / Aligned to dbt run | 24h |
| Refresh trigger | Time-based / dbt job completion / Manual | Time-based |
| Scope | All queries on this model / Specific query patterns | All queries |
| Invalidation | Automatic on dbt run / Manual / Never | Manual |

---

### 12.4 Cache Status in the Workspace

The Cache tab in View mode shows the current cache state:
- **Cached** — last cached: [timestamp], TTL expires in: [time]
- **Stale** — cache expired, queries hitting warehouse live
- **Refreshing** — cache being rebuilt
- **Not cached** — no cache configured

Agent can be asked to refresh, configure, or disable caching from the agent panel.

---

## 13. Monitoring

Monitoring is proactive — it is triggered by end-user Spotter usage signals, upstream dbt/warehouse events, statistical anomaly detection, and data quality job failures. It is not a passive log; it surfaces actionable alerts that the agent can help resolve.

**Alert types:** Source Health · Query Execution · User Interaction · Result Quality · Data Quality

**Monitoring scope:** Monitoring alerts are global (visible in the global Monitoring nav) and per-project (visible in the Monitoring signals tab in View mode).

---

### 13.1 Alert Dashboard

The monitoring section surfaces all active alerts across all projects.

**Alert list columns:**
| Column | Description |
|---|---|
| Severity | P1 / P2 / P3 |
| Type | Source Health · Query Execution · User Interaction · Result Quality · Data Quality |
| Project | Affected project name |
| Alert | Short description of the issue |
| Detected | Timestamp |
| Status | Open · Investigating · Resolved |
| Assigned To | Owner |

**Filters:** Type (Source Health / Query Execution / User Interaction / Result Quality / Data Quality) · Severity · Project · Status · Date range  
**Default sort:** Severity desc, then Detected desc

---

### 13.2 Alert Detail — Structure

Every alert detail view contains:

| Section | Fields |
|---|---|
| **Identity** | Alert ID, project name, affected model/table, connection |
| **Classification** | Type, subtype, severity (P1–P3) |
| **Timing** | Detected at, last updated, duration open |
| **Description** | What happened (plain language) |
| **Anomaly context** | Expected value vs. actual value, affected columns, visual trend chart (7-day) |
| **Impact** | Downstream projects affected, estimated queries impacted |
| **Ownership** | Assigned to, team |
| **Agent panel** | "Ask agent to investigate" → initiates guided fix flow |
| **History** | Previous occurrences of same alert type on this asset |
| **Activity log** | Comments, status changes, @mentions |

---

### 13.3 Source Health: DBT Sync Failed

**Trigger conditions:**
- dbt job run fails for a model in this project
- Schema drift detected: column removed, column type changed, model renamed in dbt but not updated in Data Studio
- Source freshness exceeds `error_after` threshold
- dbt `not_null` or `unique` test transitions from pass → error

**Alert fields (in addition to base structure):**
| Field | Example |
|---|---|
| dbt model | `fct_orders` |
| dbt job | Job #1234 — Daily Production Run |
| Last successful run | 2026-04-07 06:14 UTC |
| Error type | Schema drift / Test failure / Freshness / Compilation error |
| Error message | `Column 'campaign_type' removed from source table 'raw_campaigns'` |
| Affected downstream models | `dim_campaigns`, `mart_campaign_performance` |
| Schema diff | Before/after column list |

**Agent-guided fix flow:**
1. User opens alert → clicks "Ask agent to investigate"
2. Agent verifies the dbt model at source (re-fetches manifest/lineage)
3. Agent compares synced state vs. current source state
4. Agent identifies root cause and presents findings:
   - "Column `campaign_type` has been deleted from the source table in Snowflake"
   - "Column `metric_class` has changed type from VARCHAR to INT"
5. Agent evaluates downstream impact:
   - "3 downstream models reference `campaign_type`. Removing it will break `mart_campaign_performance`."
6. Agent presents options:
   - Option A: Remove the column from the Data Studio model + update downstream
   - Option B: Add a fallback (null coalesce) to unblock downstream
   - Option C: Block — do not proceed until source is fixed
7. User selects option → Agent applies the change
8. Agent reruns dbt validation to confirm fix
9. User updates project status → Resolved

---

### 13.4 Query Execution: Query Failing

**Trigger conditions:**
- SQL query against a project model returns an error
- Error rate for a project exceeds threshold (e.g., >5% of queries failing in last hour)
- Warehouse returns: column not found / table not found / permission denied

**Alert fields:**
| Field | Example |
|---|---|
| Query ID | `01b2c3d4-...` |
| Failing query (truncated) | `SELECT campaign_id, SUM(revenue) FROM fct_orders...` |
| Error message | `Column 'campaign_id' does not exist in table 'fct_orders'` |
| Failure rate | 43% of queries in last hour |
| First seen | 2026-04-08 09:23 UTC |
| Affected users | 4 |

**Agent-guided fix flow:**
1. User opens alert → "Ask agent to debug query failure"
2. Agent re-runs the failing query with diagnostic mode on
3. Agent identifies: "Column `campaign_id` was removed from the warehouse table `raw_orders` in the last schema change"
4. Agent checks lineage: "This column is referenced in 2 other models"
5. Agent suggests fix + evaluates impact:
   - "Remap `campaign_id` to `campaign_ref_id` (the replacement column) in `fct_orders`"
   - "This will also need to be updated in `mart_revenue` and `dim_campaigns`"
6. Agent shows before/after SQL diff for user review
7. User approves → Agent applies change + reruns query to confirm
8. User updates project

---

### 13.5 Query Execution: Cost Too High

**Trigger conditions:**
- Project's query cost exceeds daily/weekly budget threshold
- A single query's credit usage is >N× the 30-day average for that project
- Warehouse resource monitor fires a credit alert

**Alert fields:**
| Field | Example |
|---|---|
| Cost period | Last 7 days |
| Actual cost | 847 credits ($423) |
| Expected cost | ~200 credits ($100) |
| Cost driver | Query type: full table scans on `fct_orders` (no partition filter) |
| Top expensive queries | List of top 5 query IDs with cost |
| Caching eligible | Yes — results are deterministic, low freshness requirement |

**Agent-guided fix flow:**
1. User opens alert → "Ask agent to evaluate impact if cached"
2. Agent reviews the project's query patterns and dependents' usage frequency
3. Agent assesses: "This project is queried 340× per day by 12 users. Results change once per day (after the 6 AM dbt run). Caching is a strong fit."
4. Agent shows projected savings: "Caching would reduce cost from ~847 credits/week to ~12 credits/week."
5. Agent checks dependents: "No real-time consumers detected. All downstream dashboards are scheduled."
6. User confirms → Agent enables result caching policy on the project
7. Agent sets cache TTL to match dbt refresh schedule

---

### 13.6 Query Execution: Query Slow

**Trigger conditions:**
- Query P95 latency for a project exceeds SLA threshold (e.g., >30s)
- Query latency increases >2× vs. 7-day baseline
- Warehouse slot/resource contention detected

**Alert fields:**
| Field | Example |
|---|---|
| P95 latency | 47s |
| Baseline P95 | 8s (7-day avg) |
| Slow query pattern | Full table scan: missing partition filter on `event_date` |
| Warehouse state | High concurrency — 23 concurrent queries on same warehouse |
| Affected users | 8 |

**Agent-guided fix flow:**
1. Agent identifies root cause: missing partition filter, missing clustering key, or warehouse contention
2. Agent suggests: add partition column to default filters / upgrade warehouse size / adjust scheduling to off-peak
3. User approves optimization → Agent applies

---

### 13.7 User Interaction: Negative Feedback

**Trigger conditions:**
- Project's negative feedback rate exceeds threshold (e.g., >20% of Spotter conversations thumbs-down'd in last 7 days)
- A specific query pattern has been thumbs-down'd by multiple users

**Feedback taxonomy (collected at point of thumbs-down):**
- Incorrect data
- Lost previous context
- Poor visualization
- Incomplete answer

**Alert fields:**
| Field | Example |
|---|---|
| Negative feedback rate | 34% this week (12/35 conversations) |
| vs. baseline | +28pp vs. prior week |
| Top failure reason | Incorrect data (8/12 thumbs-down) |
| Most affected query pattern | "Show me campaign revenue by region" |
| Sample bad conversations | 3 linked conversation transcripts |

**Agent-guided fix flow:**
1. User opens alert → opens project → finds negatively-rated conversations
2. User reruns a failing conversation in test mode
3. Agent analyzes the conversation transcript:
   - "The query returned revenue attributed to archived campaigns because the model lacks a filter for `campaign_status = 'active'`"
4. Agent identifies root cause in the model
5. Agent proposes fix: "Add a default filter `campaign_status = 'active'` to the campaigns dimension"
6. Agent applies fix → reruns the failing test conversation to validate
7. User reviews improved result → approves → updates project

---

### 13.8 Result Quality: Inconsistent Results

**Trigger conditions:**
- Same query run at different times returns different row counts or values without a corresponding data refresh
- Two users' results for the same query diverge
- Statistical anomaly: metric value is >3σ from rolling 30-day baseline

**Alert fields:**
| Field | Example |
|---|---|
| Affected metric | `Return on Spend` |
| Variance observed | 23% difference between two executions of same query |
| Time delta between runs | 4 minutes |
| Data freshness at each run | Both runs: data as of 2026-04-07 06:14 UTC (no refresh between runs) |
| Likely cause | Non-deterministic join producing row duplication |

**Agent-guided fix flow:**
1. Agent reruns the query multiple times and compares results
2. Agent identifies source of non-determinism (fan-out join, missing deduplication, windowing issue)
3. Agent proposes fix + shows before/after query plan
4. User approves → Agent applies

---

### 13.9 Data Quality: Prep Job Failed

**Trigger conditions:**
- A scheduled prep job fails to complete (error, timeout, or caching not available)
- A prep job completes but the output version validation fails (unexpected row count change, new null columns introduced by the transformation)
- Cache refresh completes but scheduled prep did not run (dependency issue)

**Alert fields:**
| Field | Example |
|---|---|
| Prep job | Scheduled prep — Campaign Performance project |
| Trigger | Cache refresh (2026-04-08 06:00 UTC) |
| Failure reason | Transformation error: `order_date` cast to DATE failed for 234 rows (unparseable format `DD/MM/YYYY`) |
| Last successful prep | v3 — 2026-04-07 06:12 UTC |
| Active version | v3 (unchanged — failed job did not create a new version) |
| Rows affected | 0 (no version was applied) |

**Agent-guided fix flow:**
1. User opens alert → "Ask agent to diagnose prep failure"
2. Agent reviews the failed job log and identifies the specific transformation that errored
3. Agent surfaces the root cause: "234 rows in `campaigns.start_date` have the format DD/MM/YYYY, which failed the ISO 8601 cast I was running"
4. Agent proposes a fix: "Update the type correction rule to handle both formats before casting"
5. User approves → Agent updates the prep rule + reruns the prep job
6. On success: new version created, alert resolved

---

## 14. Data Exploration

### 14.1 Tables Browser

**Entry:** Data → Tables

**List view columns:**
| Column | Description |
|---|---|
| Name | Fully qualified table name (schema.table) |
| Type | Table / View / Materialized View |
| Connection | Source warehouse connection |
| Row count | Approximate, from information_schema |
| Last modified | |
| Used in projects | Count of Data Studio projects referencing this table |
| Trust status | — / Verified / Deprecated |

**Table detail view:**
- Schema: column list (name, type, nullable, description, PII flag)
- Data preview: first 100 rows
- Lineage: upstream sources + downstream models/projects
- Tests: dbt tests defined on this table (if dbt connected)
- Usage: which projects and users query this table
- Agent panel: "Explore this table with the agent"

**Agent exploration flow (Explore data):**
```
Opens Data Studio
  → Go to Data → Tables
    → Find a table (search or browse)
      → Open table detail
        → Click "Open in a project"
          → Select or create a project
            → Explore table with the agent
```

---

### 14.2 Models Browser

**Entry:** Data → Models

**List view columns:**
| Column | Description |
|---|---|
| Name | Model name |
| Source | dbt / Semantic View |
| Schema | Where it's materialized |
| Last run | Timestamp + status |
| Tests | Pass/warn/fail counts |
| Used in projects | Count |
| Trust status | — / Verified / Deprecated |

**Model detail view:**
- Same structure as table detail, plus:
- dbt: compiled SQL, run history (last 30 runs), test results, MetricFlow metrics
- Lineage graph (interactive DAG: sources → this model → downstream models → dashboards)
- Semantic model: dimensions, measures, entities, metrics defined

---

## 15. Trust & Governance

### 15.1 Verified Projects

**Lifecycle states:**

```
Draft → Verified → Deprecated
  ↑                      ↓
  └──────── (revise) ─────┘
```

| State | Meaning | Visual treatment |
|---|---|---|
| Draft | Being built, not production-ready | Grey badge |
| Verified | Meets quality bar, approved for business use | Green badge |
| Deprecated | No longer maintained or reliable | Red badge, warning shown to consumers |

**Trust signals displayed per project:**

| Signal | Source |
|---|---|
| Data freshness | Last successful dbt run / warehouse refresh |
| Test status | dbt test pass rate (last run) |
| Documentation | % of dimensions/measures with descriptions |
| Ownership | Is there an assigned owner? |
| Usage | Queries in last 30 days |
| Feedback | Thumbs-up rate in Spotter conversations |

**Verification workflow:**
1. Project author clicks "Request Verification" (visible when AI Readiness Score ≥ 85)
2. System checks: all trust signals above threshold
3. A designated reviewer receives a notification — **verification requires a second person to approve; self-approval is not allowed**
4. Reviewer approves / requests changes
5. On approval: status → Verified, badge appears everywhere project is referenced

> Verification is an admin-controlled role. Only designated reviewers (admins or nominated leads) can approve verification requests.

---

### 15.2 Memory

**Entry:** Trust & Governance → Memory

Memory is the agent's persistent store of business context, corrections, and learned preferences — accumulated **across all projects in the organization**. Memory is org-level, not project-level: context saved in one project is available to the agent in all projects.

**Memory types:**
| Type | Example |
|---|---|
| Business definition | "Revenue = `order_amount` net of refunds, not gross" |
| Calculation rule | "Campaign ROI always uses 90-day attribution window" |
| Data quirk | "`campaign_id` is NULL for direct traffic — exclude from campaign analysis" |
| User preference | "Always group time by week, not day, unless asked" |

**Memory list view columns:** Name · Type · Created by · Created at · Used N times · Source project

**Actions:** Edit · Delete · Pin (prevents auto-expiry) · Export

---

### 15.3 Business Terms

**Entry:** Trust & Governance → Business Terms

A governed glossary mapping business language to data model fields. Business terms are **org-level** — they apply across all projects and are managed by admins or designated data stewards.

**Term record:**
| Field | Description |
|---|---|
| Term | e.g. "Active Customer" |
| Definition | Plain-language definition |
| Synonyms | Other names used for this concept |
| Mapped to | Data Studio field(s) / dbt metric(s) |
| Owner | Person responsible for this term |
| Status | Draft / Approved / Deprecated |
| Projects using | List of projects where this term is applied |

**How terms are used:**
- Agent automatically applies business term definitions when building queries
- Terms appear as suggested refinements in the agent panel
- Admins can create terms from agent-surfaced corrections

---

### 15.4 Data Catalog Integration

**Entry:** Trust & Governance → Catalog

Connects Data Studio's verified status, business terms, and lineage to an external data catalog.

**Supported catalogs (v1):** Atlan · Alation · Collibra

**What syncs:**

| Data Studio → Catalog | Catalog → Data Studio |
|---|---|
| Project verification status | Asset certification / endorsement status |
| Business terms | Business glossary terms |
| Project lineage (upstream sources) | Data lineage from catalog |
| Data quality test results | External quality check results |
| Column descriptions | Column-level documentation |

**Integration workflow:**
1. Admin configures catalog connection (API token + environment URL)
2. Data Studio maps its projects to catalog assets
3. Sync runs on schedule (default: hourly) or on-demand
4. Trust signals from the catalog appear inline in Data Studio (e.g., "This table is marked Deprecated in Atlan")
5. Verification actions in Data Studio can push updates to catalog

---

## 16. Notifications

### Delivery Channels
- In-app: alert badge on Monitoring nav item + notification tray
- Slack: configurable per alert type and severity
- Email: daily digest (default) or immediate for P1

### Slack Alert Structure
- Asset name + project
- Alert type + severity badge
- Plain-language description of what happened
- Visual chart (7-day trend, inline)
- Downstream impact count
- Action buttons: "Investigate" · "Assign to me" · "Mark as expected"
- Thread updates for status changes (not new pings)

---

## 17. Agent-First Interaction Principles

Data Studio is built around an agent-first interaction model. The agent is not a sidebar helper — it is the primary UI. Forms, panels, and manual pickers are secondary fallbacks for users who prefer direct control.

---

### 17.1 Core Principle: Describe, Don't Configure

| Traditional approach | Agent-first approach |
|---|---|
| User fills out form fields | User describes intent in natural language |
| User picks tables from a list | Agent recommends tables based on stated use case |
| User writes metric formulas | Agent proposes formulas, explains rationale, user approves |
| User manually adds descriptions | Agent drafts descriptions, user reviews in bulk |
| User triggers tests | Agent recommends test mode, pre-loads questions |

---

### 17.2 The Five Agent Flows

Every major workflow in Data Studio follows one of five agent-driven patterns:

| Pattern | Used in |
|---|---|
| **Describe → Fetch → Recommend → Accept/Discuss** | Project creation (both paths) |
| **Detect → Diagnose → Recommend → Approve → Apply** | All monitoring alert fixes |
| **Audit → Score → Recommend → Accept/Edit** | AI Readiness review |
| **Ask → Generate → Evaluate → Fix/Iterate** | Test mode loop |
| **Explore → Surface → Discuss → Act** | Data exploration, Memory, Business terms |

---

### 17.3 Agent Never Auto-Applies

In all flows, the agent:
- Always shows a structured diff (before → after) before applying any change
- Always waits for explicit user approval before modifying a model, fix, or setting
- Can apply changes in batch (user approves all at once) or selectively (per-item)
- Logs all applied changes in the project activity log

The only exception: the agent can switch the user's view (e.g., to test mode) without explicit approval, because view changes are reversible and non-destructive.

---

### 17.4 Agent Context (What It Has Access To)

| Context | Source |
|---|---|
| Warehouse schema | Connected warehouse metadata (refreshed on schedule) |
| Semantic model | Current project's dimensions, measures, metrics, joins |
| dbt metadata | Models, SQL, tests, lineage, run history via Discovery API |
| Memory | Accumulated business context from previous conversations (org-level) |
| Business terms | Governed glossary mapped to model fields (org-level) |
| Query history | Recent queries, feedback signals, failure patterns |
| Monitoring history | Past alert occurrences and how they were resolved |
| AI Readiness Score | Current score breakdown + outstanding issues |

---

### 17.5 Agent Interaction Surfaces

| Surface | How it appears |
|---|---|
| Project creation | Full-screen conversation — agent leads the entire flow |
| Edit mode workspace | Right panel (collapsible), always available |
| Test mode | Full-width Spotter-style chat, pre-loaded with sample questions |
| Alert detail | Inline "Ask agent to investigate" → opens agent in context of the alert |
| Table/Model detail | "Explore with agent" → agent chat in context of the specific asset |
| AI Readiness tab | "Fix with agent" → opens agent pre-loaded with the specific issue |
| Data Quality tab | Agent leads profiling, presents remediation plan, guides bulk/selective apply |

---

## 18. Agent Patterns (Internal Reference)

### Primary Patterns

**Pattern 1: Describe → Fetch → Recommend → Accept/Discuss**
```
User describes intent
  → Agent fetches relevant data
    → Agent presents recommendation with rationale
      → User accepts / discusses / manually overrides
        → Agent applies accepted changes
```

**Pattern 2: Detect → Diagnose → Recommend → Approve → Apply**
```
Signal detected (alert, failure, feedback)
  → Agent traces root cause (lineage, schema diff, query history)
    → Agent proposes specific fix with before/after diff
      → User reviews and approves (or modifies)
        → Agent applies + validates outcome
```

**Pattern 3: Audit → Score → Recommend → Accept/Edit**
```
Agent audits model for completeness
  → Agent computes AI Readiness Score
    → Agent surfaces specific gaps with proposed fixes
      → User accepts batch / edits individual / skips
        → Agent applies, score updates live
```

**Pattern 4: Ask → Generate → Evaluate → Fix/Iterate**
```
User asks NL question (in test mode)
  → Agent generates response
    → Does response meet expectation?
        Yes → User publishes
        No → Agent diagnoses (interpretation issue / data issue)
               → Agent proposes model fix
                 → Agent applies + retries answer
                   → Loop until satisfied
```

**Pattern 5: Explore → Surface → Discuss → Act**
```
User opens a table or model in the Data section
  → Agent surfaces: schema, lineage, quality signals, usage
    → User asks questions about the data
      → Agent surfaces patterns, anomalies, suggestions
        → User decides to add to a project / add context / tag
```

**Pattern 6: Profile → Remediate → Version → Schedule**
```
User triggers data prep (via agent panel in Edit mode, or agent initiates from monitoring alert)
  → Agent runs profiling across all cached tables
    → Agent presents consolidated remediation plan
      → User applies fixes (bulk or selective)
        → Agent creates versioned snapshot
          → User optionally schedules prep to run on each cache refresh
```

---

## 19. Success Metrics

### 19.1 Product Health

| Metric | Target (6 months post-launch) | How measured |
|---|---|---|
| Time to first published model | < 2 hours median | Time from project creation to first Publish event |
| AI Readiness Score at publish | ≥ 75 median | Score recorded at time of publish |
| Spotter thumbs-up rate | > 70% | Positive feedback / total Spotter conversations on published models |
| Projects published per active user / month | ≥ 1 | Published projects per MAU |

---

### 19.2 Data Quality & Prep

| Metric | Target | How measured |
|---|---|---|
| Data quality issue resolution rate | ≥ 80% of Critical + High | Issues Applied / total Critical+High per project |
| Prep job success rate | > 95% | Successful prep runs / total scheduled runs |
| Rollback rate | < 5% | Versions rolled back / total versions created |
| Caching adoption | > 40% of published projects | Projects with cache enabled / total published |

---

### 19.3 Monitoring & Reliability

| Metric | Target | How measured |
|---|---|---|
| Alert resolution time — P1 | < 4 hours median | Time from alert Opened → Resolved |
| Alert resolution time — P2 | < 24 hours median | Same |
| Agent-guided fix acceptance rate | > 60% | Fixes accepted by user / fixes offered by agent |
| Verified projects share | ≥ 30% of published | Projects with Verified badge / total published |

---

### 19.4 Engagement

| Metric | Target | How measured |
|---|---|---|
| Monthly active users (MAU) | +20% QoQ | Users with ≥ 1 meaningful action in last 30 days |
| Agent interaction rate | > 50% of sessions | Sessions with ≥ 1 agent message / total sessions |
| Open P1/P2 alerts per user | < 5 average | Open high-severity alerts per active user |

---

## 20. Out of Scope (v1)

- Connections setup for: MySQL, SQL Server, ClickHouse, Trino, Starburst, Athena
- Standalone BI dashboarding
- Replacing dbt transformations or warehouse pipelines
- Real-time streaming data sources
- Multi-warehouse query federation
- CSV upload / writeback
- Writing prep transformations back to the warehouse (prep is ThoughtSpot cache layer only)
- Automated agent execution without human approval
- Mobile interface
- SSO / SCIM provisioning (handled at platform level)
- Full data catalog (Atlan/Alation parity)
- Multi-user collaboration / commenting within a project (v2)
- Connections setup (MySQL, SQL Server, ClickHouse, etc.)

---

## Appendix: Key Reference Flows (from Figma — "4.5 Use-cases - 8th April")

Figma file: `https://www.figma.com/design/ZOIU8Te4ocC5Kqjwwynz52/Data-journey?node-id=305-14271`

| Section | Node ID |
|---|---|
| Connect Data Source | 305:14423 |
| Warehouse connection flow | 306:14464 |
| DBT connection flow | 306:14493 |
| Create project — from tables | 311:16282 |
| Create project — from DBT models | 312:16628 |
| Monitoring overview | 313:17202 |
| DBT sync failed flow | 313:17132 |
| Query failing flow | 313:17201 |
| Query cost too high flow | 316:17254 |
| Negative user feedback flow | 316:17316 |
| Explore data — table | 316:17367 |
| Add table to a project | 318:17458 |
