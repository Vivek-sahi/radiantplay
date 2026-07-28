# Data Prep Workflow — Research

_Research conducted 2026-04-22. Informs where and how to insert a prep workflow into the Data Studio demo narrative._

---

## The core question

Where is the right entry point for data prep in the demo? What does the agentic workflow look like? How do other tools handle it?

---

## 1. How analysts approach data prep today

### Reactive vs. proactive

The honest picture in 2024–2025: **most data quality work is reactive.** An analyst learns about a problem after damage has occurred — a broken dashboard, a stakeholder complaint, a metric that looks wrong in a meeting. By then, the issue has often propagated through multiple downstream assets.

Proactive approaches exist and are growing (especially for AI use cases where bad batch data is unacceptable), but they require organizational maturity — scheduled quality gates, schema enforcement, continuous monitoring — that most teams don't yet have.

The economic framing: the **1:10:100 rule** — catching an issue at source costs $1, at transformation costs $10, at consumption costs $100. Despite knowing this, most teams catch issues at consumption.

Forrester's widely cited figure: **analysts spend ~70% of their time preparing data rather than analyzing it.** Despite the proliferation of tooling over the last 5 years, this ratio hasn't changed much.

### Most common triggers that send an analyst into a prep workflow

1. **Downstream complaint / broken dashboard** — a stakeholder reports a wrong number. Most common, highest urgency, most chaotic to fix.
2. **Schema change from an upstream system** — a source renames/drops a column, changes a type. Cascades into broken pipelines.
3. **Pipeline failure** — an ETL job fails (API timeout, row count mismatch), leaving a table stale or incomplete.
4. **Anomalous metric noticed during analysis** — the analyst themselves spots something wrong: a metric that jumped 300%, dates in 1970, a count of zero where there should always be records.
5. **Audit / compliance trigger** — a formal review flags duplicate records, referential integrity violations, unexpected null rates.
6. **New data source onboarding** — connecting a new source surfaces existing quality problems (wrong formats, duplicate IDs, inconsistent categories).
7. **CI test failure** — for dbt teams, a red check on a PR blocks a merge. The engineer must investigate before code can ship.

### What a quality fix process looks like end-to-end

**Discovery**
- Source: Slack alert from a monitoring tool, failed pipeline, stakeholder complaint, or the analyst's own eyes on a dashboard
- First action: determine if this is a known issue or new; check if others are affected

**Diagnosis**
- Query the affected table directly — pull sample rows, check row counts, run aggregations
- Check lineage to identify upstream sources (Monte Carlo, Atlan, dbt lineage graph)
- Review pipeline run logs — when did it last succeed? What changed?
- Profile the column: null rates, distribution, value ranges, recent changes

**Fix**
- May happen at the data layer (backfill, correction script), transformation layer (dbt model fix), or source system (coordinate with data owners)
- For dbt teams: create a PR with the fix, run CI tests against a temporary schema before merging

**Verify**
- Re-run the pipeline and check that tests pass
- Validate output against expected values (compare with historical baselines or a trusted alternate source)
- For critical datasets: human review of sample rows before marking clean

**Monitor (prevent recurrence)**
- Add a new test or monitor targeting the exact failure mode just fixed
- Configure alerting so the same failure is caught automatically next time
- Annotate the model or table with context about what happened and why

### What the end goal is

Analysts are working toward different things depending on context:

- **A clean, trustworthy table** — the most common target
- **A certified data source** — a formal status that makes a dataset discoverable and trustworthy for others (Tableau's model)
- **A metric they can defend** — a KPI that won't get challenged in a meeting
- **A passing test suite** — for dbt teams, data quality is operationalized as code; green tests = done
- **A resolved incident** — for observability platform users, marked resolved and stakeholders notified

The underlying mental model is always about **trust**. Data quality is the difference between a number someone stakes a decision on versus one they'll question.

---

## 2. Tools analysts use

### The modern data stack for prep (2025)

| Layer | Common tools |
|-------|-------------|
| Ingestion | Airbyte, Fivetran |
| Warehouse | Snowflake, Databricks, BigQuery |
| Transformation + quality | dbt Core / dbt Cloud |
| Observability | Monte Carlo, Soda, Metaplane, Anomalo |
| Orchestration | Airflow, Dagster, dbt Cloud scheduler |
| BI | Tableau, Sigma, Hex, Omni |

Visual / no-code prep tools for non-SQL analysts: **Tableau Prep**, Power Query, Alteryx, OpenRefine, Trifacta.

### dbt — the de facto quality layer

dbt's testing framework is how analytics engineering teams operationalize quality: declare tests in YAML alongside models, run them after every build, fail CI on any violation.

**Four built-in tests:** `not_null`, `unique`, `accepted_values`, `relationships` (foreign key integrity)

**dbt-expectations extension:** Statistical validation, regex format checks, freshness SLAs, completeness windows. The CI/CD loop — change model → PR → dbt Cloud CI runs changed models in a temp schema → tests run → branch protection blocks merge if any fail — is the workflow that catches issues *before* production.

The mental shift dbt enables: **data quality becomes part of the development workflow, not a separate audit activity.**

### Observability tools

| Tool | Differentiator |
|------|---------------|
| **Monte Carlo** | ML-learned baselines, full lineage, Incident IQ (auto root cause analysis, affected dashboards, post-mortem timeline) |
| **Soda** | SodaCL — readable YAML checks, SodaGPT converts natural language to checks, easier for non-engineers |
| **Anomalo** | Zero-config ML anomaly detection — catches unknown unknowns without manual threshold-setting |
| **Great Expectations** | Code-first Python library, testing framework (not observability platform), generates Data Docs HTML |

Monte Carlo's **five pillars of data observability:** Freshness, Volume, Schema, Distribution, Lineage.

Monte Carlo's **Incident IQ** (2024): detects anomaly → auto root cause analysis → field-level lineage showing impacted downstream dashboards → central timeline for commenting, documentation, post-mortem.

### Alert fatigue — the real problem

"If every alert is urgent, no alert is urgent." Mature teams address this by:
- **Backwards-mapping from critical outputs** — trace from the dashboards executives use, not from every table
- **Routing by who can fix it** — platform failures → infra; business metric anomalies → domain teams
- **ML-learned baselines** instead of static thresholds (Monte Carlo, Anomalo adapt to seasonal patterns)
- **Pruning monitors regularly** — monitors consistently marked "expected" or never actioned should be deleted

---

## 3. How specific tools handle prep

### Snowflake — Data Metric Functions (DMFs)

GA March/April 2024. Native, declarative quality checks on tables.

- **System-defined DMFs** — pre-built in `SNOWFLAKE.CORE`: null counts, duplicate counts, min/max, freshness
- **User-defined DMFs** — custom SQL functions that return a `NUMBER`
- **Schedule-based** — runs on cron or fixed interval; results land in `SNOWFLAKE.LOCAL.DATA_QUALITY_MONITORING_RESULTS`, queryable as a standard SQL table
- **Trigger-based** — runs when DML change occurs (e.g., new rows inserted)

Alerting: teams build Snowflake alerts (`CREATE ALERT`) on the results table or pipe results into a BI dashboard. More DIY than dedicated observability tools.

**Dynamic Tables** — analyst writes a SQL query; Snowflake automates incremental refresh and orchestration. Inspect refresh health via SQL.

### Databricks — DLT Expectations + Lakehouse Monitoring

**Delta Live Tables Expectations** — quality rules in pipeline definitions:
- `@expect` — violating records pass through; metrics recorded
- `@expect_or_drop` — violating records silently dropped from output
- `@expect_or_fail` — single invalid record stops the entire pipeline (rollback)
- **Quarantine pattern** — route invalid records to a separate table for inspection

**Lakehouse Monitoring** — platform-level, no-code:
- Navigate to any Delta table in Unity Catalog → "Quality" tab → "Get Started"
- Auto-generates: profile metrics table (summary stats, null fractions, distributions), drift metrics table (statistical change vs. baseline), and a pre-built SQL dashboard
- Three profile types: Time Series, Snapshot, Inference (for ML model monitoring)
- Custom metrics via SQL expressions refresh alongside automated metrics

### Hex

Collaborative analytics workspace (SQL + Python + R + no-code on a single canvas).

Hex is not a dedicated prep tool, but prep happens naturally: write SQL to pull raw data → Python cell to clean it → visualize. The **Notebook Agent** handles mechanical work (generate queries, combine data sources, run classification). Hex notebooks can be scheduled and gated on upstream quality checks (integrate with Coalesce: run quality check → if pass → refresh Hex notebook).

### Omni

BI platform built around a governed semantic layer (centralized metric definitions, YAML-defined joins/measures).

Data quality is **architectural in Omni, not operational**. Clean data from dbt is inherited automatically. No native monitoring, alerting, or anomaly detection in Omni itself. Quality is a pre-Omni concern.

The **workbook model** (each dashboard is like a git branch off a shared model) solves "shadow analytics" — analysts explore in their workbook without affecting the shared layer.

### Sigma Computing

Spreadsheet interface on top of the cloud data warehouse — pushes all computation to the warehouse.

**Input Tables (the key differentiator):** Users can enter, edit, and annotate data directly in a Sigma workbook. Data writes to a dedicated schema in the connected warehouse.

**Linked Input Tables:** Layer an editable input over an existing dataset — analysts add new columns, annotations, or manual corrections *alongside* source data without modifying the source. This is powerful for data quality annotation workflows: flag rows as "bad," add a "corrected_value" column, write it back to the warehouse.

Sigma as a "last mile" prep environment: pull data into a workbook → identify issues visually → correct or annotate via input tables → write back to warehouse for downstream use. Closer to Excel-driven cleaning than dbt-style transformation.

### Tableau Prep — the benchmark for visual prep UX

Tableau Prep Builder is the clearest example of analyst-oriented visual prep. Key UX patterns worth studying for Data Studio:

**The Flow Pane** — every cleaning operation is a node in a visual subway map. You can see the full data lineage through all prep steps at a glance. Operations: join, union, pivot, split, filter, rename, remove, group values, fix capitalization, replace values, remove whitespace.

**Three coordinated views (the key UX insight):**
1. **Flow pane** — visual map of all operations
2. **Profile pane** — per-field distribution bars showing nulls, outliers, and value breakdowns; selecting a value in the profile filters matching rows in the data grid (bidirectional)
3. **Data grid** — row-level preview of actual records

The coordination between profile and data grid is the core idea: see the *shape* of problems (Profile) and the *specific rows* that embody them (Data Grid) simultaneously. Fixes are visible immediately before running the full flow — built-in verification.

**Output options:** CSV, Hyper, database, or Tableau data source. Flows can be scheduled on Tableau Server/Cloud.

**Monitoring:** When a scheduled flow fails, Tableau Catalog automatically sets a quality warning on the output data source — visible to any user of dashboards built on that data. Auto-cleared on next successful run.

### Tableau data quality warnings + certified data sources

**Data quality warnings (two types):**
- **Manual (data stewards):** Warning / Deprecated / Stale Data / Under Maintenance / custom types. High-visibility warnings appear more prominently and trigger notifications when a view is opened.
- **System-generated:** Auto-set when extract refresh or flow run fails. Auto-cleared on success.

**Propagation:** Warnings cascade through lineage — a warning on a table propagates to every dashboard that depends on it. Users see a warning icon in the Data Details tab.

**Certification workflow:** Author creates → steward validates → steward promotes to production project → admin certifies → certified status becomes discoverable. Certified sources rank first in search and have a visual badge. One certified source per domain, reducing proliferation.

---

## 4. Monitoring and ongoing governance

### Post-fix best practice

Every fixed data quality issue should generate a new monitor or test — otherwise the same issue can silently recur.

| Tool | What you add after a fix |
|------|--------------------------|
| dbt | New test in YAML; runs on every future CI run and scheduled production job |
| Snowflake DMFs | Associate a DMF targeting the specific failure dimension (freshness, null count, duplicate count) |
| Databricks DLT | Add an expectation; use `expect_or_drop` to quarantine future occurrences |
| Monte Carlo | One-click AI Monitor Recommendation for the affected table |
| Soda | New SodaCL check in checks.yml, committed to version control |

### Alert routing — what mature teams do

- Platform layer failures → infra/engineering team
- Business metric anomalies → domain team
- Misrouting guarantees the alert is ignored

Monte Carlo's observed distribution across enterprises: 34% of monitors in landing/ingestion layer, 26% in gold/serving layer, 50% in intermediate transformation layers. Mature teams emphasize catching issues close to source.

---

## 5. Pain points — where the current state falls short

1. **Discovery is still reactive for most teams.** Even with observability tools, business users often find issues before automated systems do. Coverage is incomplete.
2. **The fix-test-deploy loop is fragmented.** The analyst who discovers an issue, the engineer who fixes it, the person who verifies it, and the steward who certifies it are often different people in different tools with no unified workflow.
3. **Lineage is theoretically available, practically hard to maintain.** End-to-end lineage requires consistent metadata across ingestion, transformation, BI, and observability tools — rare.
4. **Alert fatigue is endemic.** Aggressive anomaly detection trains teams to ignore notifications.
5. **Verification is mostly manual.** Even with dbt tests and DMFs, confirming a fix actually resolved the root cause usually requires human judgment — sample data review, comparison to historical baselines.
6. **70% of analyst time still goes to prep.** The ratio hasn't improved much despite tooling proliferation.

---

## 6. Implications for Data Studio

_Decisions made 2026-04-22. Updated from initial open questions._

---

### Profiling is automatic

The moment a model is created, ThoughtSpot queries the warehouse, samples rows, and generates a data profile per column — null rates, duplicate counts, format anomalies, distribution outliers. No user action required. The profile appears in column properties automatically. This is the "aha" moment: you built a model and you can immediately see what's actually in it without asking.

---

### Prep = query-time transformations, not cached data

**Aligned direction:** Prep rules are SQL transformations embedded in the model's query layer — not pushed to the warehouse, not stored in ThoughtSpot. When Spotter (or any consumer) queries the model, ThoughtSpot generates SQL that includes the transformation before hitting the warehouse.

This is the same mechanism ThoughtSpot already uses for formulas. A prep rule is a formula whose purpose is data quality, not metric calculation.

**Concrete examples using the Campaign Performance mock data:**
- `campaign_id` 18% null → `COALESCE(campaign_id, 'organic')` in every query
- Date format inconsistency across orders / campaigns / users → `TRY_CAST(order_date AS DATE)`
- Duplicate rows in orders → `ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_date DESC) = 1` subquery
- Age anomalies in users → `WHERE age BETWEEN 0 AND 120`

The warehouse data is never touched. The transforms live in the model definition.

**Does prep require caching?** No. This is the key decoupling. Prep works on live data because ThoughtSpot is generating more complex SQL — the warehouse executes it. Caching is a separate, orthogonal decision:

| | Prep | Cache |
|--|------|-------|
| **What it does** | Makes data AI-ready (transforms, cleaning) | Makes queries fast (pulls data close to Spotter) |
| **When you need it** | Before testing / publishing | When scaling to production |
| **Relationship** | Independent | When you cache, you cache the already-prepared data |

**On latency:** Simple transforms (COALESCE, CAST, WHERE filters) add negligible latency. Deduplication (window functions on large tables) can add latency at scale — that's when caching becomes valuable. But caching is an upgrade for performance, not a prerequisite for prep to work.

**Tech constraint note:** ThoughtSpot currently requires caching to run certain prep operations (engineering limitation). The demo shows the ideal vision — prep on live data, caching as a separate performance step. This is the north star worth building toward and the right story to tell stakeholders.

---

### The two states: building vs. in-use

**Building state** — focus for the current demo work.
- Analyst is actively constructing the model
- Prep is a setup step: make data AI-ready before testing or publishing
- Discovery: column properties shows profile automatically after model creation
- Interaction: agent plan → review → approve → transforms applied → column profiles update
- Outcome: model ready to test, prep rules embedded in the model definition
- Mindset: "Let me clean this before I deploy it"

**In-use state** — to be addressed later (connects to situation 6).
- Model is published, Spotter is actively querying it
- Upstream data changes; issues can re-emerge
- Prep jobs become scheduled recurring checks, not one-time setup
- Discovery: monitoring alert in Overview ("Data health degraded on Campaign Performance")
- Interaction: navigate to model → see what regressed → re-run or update prep rules
- Mindset: "Something changed — is my data still AI-ready?"

---

### The build state demo sequence (locked)

1. Model is built → column properties auto-shows profile inline (nulls, duplicates, anomalies per column)
2. Agent or workspace surfaces: "This model has 3 data quality issues"
3. Two CTAs: **Fix data issues** (primary, shown when issues exist) · **Skip and test** (secondary)
4. If "Fix data issues":
   - Agent sends full profile to LLM → returns a plan of N proposed fixes
   - User reviews the plan, can remove individual items they don't want
   - User approves → transforms applied → column profiles update to show new state (nulls gone, duplicates removed)
   - CTA becomes: **Test** (primary, now that data is clean)
5. If "Skip and test": goes directly to test mode — useful for showing the consequence of skipping prep (Spotter struggles, motivating a return to fix)

The plan interface supports three modes: apply full plan · iterate with more input · do a subset.

---

### Where prep transforms live in the workspace — DECIDED: Option A

**LeftPanel "Transformations" section** (below Formulas) + **`✦` indicators on individual data quality cells** in ColumnsView.

- LeftPanel lists all transforms across the model in one place
- ColumnsView cells (Null %, Duplicates, Anomalies) show a `✦` indicator when a transform is active on that column+issue combination. Tooltip shows the SQL.
- The raw stat values don't change — the indicator signals "a transform addresses this."

**In Model View (in-use state):** Transforms will live in the Data Quality tab — shows all active transforms and their status per cache run. Not yet built. The open question here is whether cached data is raw (transforms re-applied at query time) or pre-transformed (transforms baked into the cache). **Needs PM/eng input.**

---

### Where prep jobs live

- **In the workspace (building state):** LeftPanel "Prep" section or column properties (per above — to be decided)
- **In Model View (in-use state):** Data quality tab. Prep jobs live there as scheduled rules. Not in Overview — keep Overview clean.
- **Not in Overview:** Overview shows a project-level health signal at most (a quality badge or flag), not the jobs themselves.

---

### The agentic opportunity

The acute pain point across all tools: **the fix-test-deploy loop is fragmented.** Discovery in one tool, diagnosis in another, fix in dbt, verify manually, monitor in a fifth tool.

Data Studio collapses this because the agent knows the model, the profile, the test results, and the destination. The real AI moment for prep: agent doesn't just describe the issue — it proposes the specific fix with reasoning, shows the before/after on the column profile, applies it in one approval, and the transform is now embedded in the model for every future query.

That's the "one surprising AI moment" pattern from the demo arc.

---

### What prep is NOT in this demo

- Not a visual flow builder (no Tableau Prep-style node graph)
- Not a full data transformation tool (not replacing dbt)
- Not tied to caching — prep works on live data
- Not a global prep service — scoped to a single model

Prep in this demo story = **AI-assisted data quality remediation expressed as query-time transformations, embedded in the model, applied to live data.** The story: "Spotter struggled because the data wasn't AI-ready. Data Studio fixed it — and now every query Spotter runs goes through clean data, without touching the warehouse."
