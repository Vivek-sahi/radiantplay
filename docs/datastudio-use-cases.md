# Data Studio — Purpose, Workflows, and Journeys

**Audience:** Product, Engineering, Design leadership [Directors, VP, Executives]
**Purpose:** Align on what Data Studio is, how data teams will use it, and what we're proposing to build — before we go deeper into UI building

---

## 1. Purpose

**Why Data Studio exists:**
Business users want fast, accurate answers from their data using AI. Right now, most companies can't get there — not because the AI is bad, but because their data isn't ready for AI to reason over it. We do have these capabilities in ThoughtSpot but these are fragmented across Data Workspace and Analyst Studio; are hard to discover and isn't a part of a coherent workflow.

**What Data Studio does:**
Data Studio enables companies to make their data AI-ready. It is the layer where data teams connect their warehouse data, define what it means, clean it, and publish it — so that when business users ask Spotter a question, they get the right answer. Once their data is being used, Data Studio also allows them to monitor and improve its performance and accuracy.

The goal is correct answers to business user questions. Model building is the means, not the end.

---

## 2. Capabilities

What a data team member can do in Data Studio:

| Capability | What it means |
|---|---|
| **Connect** | Authenticate to a data warehouse (Snowflake, BigQuery, Databricks, Redshift) and bring tables or existing models into ThoughtSpot |
| **Bring models** | Import existing dbt models or Snowflake semantic views — translated, not rebuilt |
| **Modelling** | Define relationships between tables, create joins, build calculated fields, define metrics |
| **Make data AI-ready** | Add column descriptions, AI context, business logic, persona, sample questions — so Spotter understands what the data means |
| **Prep and clean** | Fix quality issues (nulls, duplicates, anomalies, date format mismatches), schedule cleaning jobs |
| **Cache** | Materialize data within ThoughtSpot for performance, rather than always querying the warehouse live |
| **Publish** | Make the model available to business users through Spotter |
| **Control access** | Manage who can see which models, with row and column-level permissions |
| **Monitor** | See how business users are querying the model — which questions are being asked, where answers fail |
| **Iterate** | Add columns, fix business logic, respond to wrong answers, improve the model over time |

---

## 3. Industry Standard Workflow

Before proposing how Data Studio should work, here is what the industry has converged on — based on how Looker, dbt, Snowflake Cortex, Tableau, Sigma, Omni, and Hex handle this today (as of early 2026).

### The convergent pattern: "Define once, govern centrally, use everywhere"

The semantic layer is no longer emerging technology — Gartner and GigaOm now classify it as essential infrastructure. 80% of data practitioners identify a unified semantic layer as the single most important enabler of AI value.

**The canonical 9-step workflow across all mature platforms:**

1. **Connect** — Authenticate to the warehouse. Most platforms offer full credential access but allow selective table exposure at the model layer (not at connection time).
2. **Import / Map** — Pull schemas or existing models (dbt, Snowflake semantic views, LookML) into the modeling environment. AI-assisted import is now standard — auto-generates descriptions, suggests joins, and infers relationships.
3. **Model** — Define semantic objects: entities (tables), dimensions (attributes), measures (aggregations), relationships, and calculated fields. This is where business logic is encoded once.
4. **Integrate existing models** — All mature platforms now support consuming upstream dbt or Snowflake definitions rather than rebuilding. The trend is **federation over duplication** — translate with adjustments, don't start from scratch.
5. **Quality / Prep** — Apply data quality rules, documentation, and tests. Some platforms (Tableau Prep, Hex) have native prep; others rely on dbt upstream.
6. **Publish / Promote** — Move from draft → staging → production. Git-based versioning is standard at the top tier. Certification or endorsement signals trust.
7. **Access control** — RBAC for who sees which models. Row, column, and topic-level permissions. User-attribute-based routing (different users get different metric definitions for the same question).
8. **Consumption** — Business users pick a model OR the AI auto-selects. Both paths exist in every mature platform.
9. **AI feedback loop** — Wrong answers surface via thumbs-down, chat corrections, or observability tooling. The semantic model is iteratively improved based on usage. The most mature version of this (Hex's Context Studio) monitors all AI interactions, auto-tags where context was missing, and surfaces what to model next.

### Three architectural camps — and what they mean

The camp a platform is in determines three things: **who the primary user is**, **where the semantic definition lives**, and **what "done" looks like**. These are not just implementation choices — they shape the entire product experience.

| Camp | Platforms | Primary user | Where semantics live | "Done" means |
|---|---|---|---|---|
| **Code-first / warehouse-native** | dbt, Snowflake Cortex | Analytics engineer | Git / YAML / SQL | Model deployed to prod, consumed by BI tools via API |
| **BI-native semantic layer** | Looker, Omni | Analytics engineer + data team | Inside the BI tool (Git-backed) | Governed model published; business users explore it |
| **Notebook / app-first** | Hex, Sigma | Data scientist / analyst | The analysis workspace | Analysis published; AI can reference it |

**Why the camp matters for the feedback loop:**
In code-first and BI-native camps, "done" is when the model is deployed or published. Whether business users get correct answers is outside the loop — it's a separate concern. The model team ships; whether it works for AI is discovered later, indirectly.

This is the fundamental gap in the market. No existing camp defines "done" as "business users are getting correct answers." They stop at publishing.

**Where ThoughtSpot sits — and why it's different:**

ThoughtSpot has always been different from every other BI tool in one specific way: before ThoughtSpot, business users needed someone to build dashboards for them to get any insight at all. ThoughtSpot's original bet was: don't build dashboards. Just connect your tables, model them meaningfully, and business users can ask questions in natural language and get answers directly — no dashboard required.

This made ThoughtSpot **business user-first** from day one, while every other BI tool was still data-team-first in its default workflow.

Now with Spotter, that bet extends further. The AI agent is the interface — not search, not dashboards. And the semantic model feeds the AI agent, not a visualization layer.

This creates a fourth camp: **AI-first, BI-native semantic layer.**

| What | ThoughtSpot's position |
|---|---|
| **Primary user** | Business user (Spotter) AND data team (Data Studio) — both are first-class |
| **Where semantics live** | Inside ThoughtSpot, with federation from dbt and Snowflake as inputs |
| **"Done" means** | Business user gets a correct answer from Spotter — not just model deployed |
| **Unique capability** | The AI interpretation layer — context, persona, business logic for AI — that no warehouse tool or code-first platform provides |

**The implication for Data Studio:**
Data Studio is not just a model-building tool. It is the workflow that takes data from "connected" to "Spotter answers correctly." That's what makes it different from Looker's model editor or dbt's semantic layer. The completion condition is an answer, not a deployment.

This also means the feedback loop (wrong answers → model fixes → better answers) is not a nice-to-have. It is the core of what Data Studio does that no other platform does end to end.

---

## 4. End-to-End Journeys

Customers arrive at Data Studio from different starting points. Each journey follows the same spine — define intent, discover data, build the model, make it AI-ready, validate, publish, monitor, iterate — but the early steps look different depending on what the customer already has.

**Four entry points:**
1. Raw warehouse data — tables exist in Snowflake, BigQuery, Databricks, or Redshift; no semantic layer yet
2. Existing semantic layer — Snowflake semantic views or similar already defined
3. dbt models — upstream dbt models exist and should be imported, not rebuilt
4. External files — CSV or spreadsheet upload

---

### Journey 1: Start from raw warehouse data

**Scenario:** A company has their data sitting in a Snowflake warehouse but they don't have models or semantic views yet
**User:** Data analyst / Analytics engineer / AI engineer
**Ends when:** Model is published and business users are getting correct answers

---

#### Phase 1: Setup

**Step 1 — Configure warehouse connection**
Admin authenticates to the warehouse once at the org level. Full credential access — everything in the warehouse is browsable. Not per-project, not scoped at connection time. Data team members don't redo this.

**Step 2 — Create a new project**
Data team member opens Data Studio → Projects → New project. Lands in an empty workspace. Project is Untitled, status Draft.

---

#### Phase 2: Define intent

**Step 3 — Describe the business question**
Before touching any data, the user defines what this model needs to do:
- Who will use it and what decisions will they make?
- What is the grain? (one row = one order? one campaign per day? one user?)
- What are the key metrics, and how does the business define them?

This is the most important step. Getting the grain or metric definition wrong cannot be fixed later with clean SQL.

In the AI-assisted path this is a conversation with the agent. In the manual path this is the user's own thinking — but it still happens first.

---

#### Phase 3: Discover data

**Step 4 — Browse and select tables**
User scans the warehouse: table names, column names, row counts, data types, sample values. Running basic profiling — null rates, distinct counts, min/max ranges.

Two things happen here simultaneously:
- Tables are selected into the project — only what's in scope for this use case
- Joins emerge — the user asks: what keys connect these tables, and are they trustworthy? Joins are discovered from the data, not designed abstractly

Data quality issues are noted here — nulls on key columns, duplicate IDs, format mismatches. Not a blocker, but diagnostic. The user decides what's tolerable vs. must be fixed before publishing.

AI-assisted: agent suggests tables based on the intent from step 3, flags quality issues automatically, proposes join paths with confidence scores.

---

#### Phase 4: Build the model

**Step 5 — Design the output**
Before configuring anything, the user sketches what the final model should look like: which columns, what grain, what measures. Reviewed against the business question from step 3. Changes here are cheap — changes after step 6 are expensive.

**Step 6 — Define relationships**
Joins are formalized now, after each table has been profiled and the output is designed. User defines: which columns connect, join type (inner/left), cardinality. Edge cases flagged — e.g. null keys that would silently drop rows on an inner join.

AI-assisted: agent proposes joins from the discovery in step 4, explains tradeoffs (inner vs. left, match rates), asks for confirmation.

**Step 7 — Configure columns**
With joins defined, the user has a single unified view of all columns across the joined model. For each column:
- Hide — irrelevant to the use case, technical keys, internal audit fields
- Expose — anything a business user or Spotter should see
- Annotate — add a description so Spotter understands what the column means
- Flag PII — restricts downstream access automatically

Annotation happens here, per column, as part of building — not as a separate documentation pass later.

AI-assisted: agent drafts descriptions for every column from name + sample values. User reviews and edits rather than writing from scratch.

**Step 8 — Add calculated fields and metrics**
User defines derived columns — formulas, aggregations, business metrics. Example: `Return on Spend = SUM(orders.amount) / campaigns.spend`. Metrics that the business defined in step 3 get built here.

AI-assisted: agent suggests calculated fields based on stated intent and the columns available in the joined model.

**Step 9 — Add filters**
Default filters (e.g. exclude test orders, exclude internal users). Row-level security — which users see which rows. Column-level restrictions for PII flagged in step 7.

**Step 10 — Add parameters** *(optional)*
User-facing parameters business users can set when querying — date range, region, product category. Most models don't need this in v1.

---

#### Phase 5: Make AI-ready

**Step 11 — Add AI context**
The metadata Spotter reads at query time. Four fields:
- **Persona** — who the business user is, their domain knowledge
- **Sample questions** — representative questions this model should answer
- **Business logic** — rules Spotter must follow (e.g. "always filter to completed orders", "revenue excludes refunds")
- **Spotter instructions** — how to handle ambiguous terms

AI-assisted: agent drafts all four fields from the intent in step 3 and the column annotations from step 7. User refines rather than writes from scratch.

This is the highest-leverage step. Missing or vague context here is the primary cause of wrong Spotter answers.

---

#### Phase 6: Validate

**Step 12 — Test in Spotter**
User switches to Test mode. Asks questions as a business user would. Checks: is the answer correct? Is the SQL right? Did it interpret the question correctly?

**Step 13 — Iterate on context**
Wrong answer → identify the gap (missing context, wrong join, ambiguous column) → fix in the model → retest. This loop repeats until the model answers correctly for the target question set.

---

#### Phase 7: Publish

**Step 14 — Publish**
User publishes the model. Chooses query mode:
- **Live** — every question queries the warehouse directly. Always fresh, higher latency, higher cost. Default.
- **Cached** — ThoughtSpot materializes the data. Faster, cheaper, potentially stale. Explicit opt-in.

**Step 15 — Set permissions**
Share with specific individuals, groups, or the entire org. Spotter only surfaces models the user has permission to access.

---

#### Phase 8: Post-publish

**Step 16 — Monitor**
Check model usage: which questions are being asked, which are failing, what's popular. Wrong-answer feedback from business users surfaces here.

**Step 17 — Iterate**
Fix wrong answers, add columns, update context, respond to schema changes upstream. Model improves over time through the feedback loop.

---

### Journey 2: Customer already has semantic views

**Scenario:** A company has Snowflake semantic views already defined by their data team. They want Spotter to answer questions against them.
**User:** Data analyst / Analytics engineer / AI engineer
**Ends when:** Model is published and business users are getting correct answers

**Key difference from Journey 1:** The structural work — joins, measures, column definitions — already exists in the semantic view. The build phase largely collapses. The real work is the AI-ready layer, which no warehouse tool provides.

---

#### Phase 1: Setup

**Step 1 — Configure warehouse connection**
Same as Journey 1. Admin authenticates once. ThoughtSpot ingests everything in the warehouse — raw tables and semantic views. Semantic views are surfaced as a distinct object type in the connection browser, separate from raw tables.

---

#### Phase 2: Define intent

**Step 2 — Create a new project**
Data team member creates a new project. Lands in empty workspace.

**Step 3 — Describe the business question**
Same as Journey 1. User defines: who uses this, what decisions they make, what questions they need to answer. This is what the AI uses to scan the imported layer.

---

#### Phase 3: Discover and select

**Step 4 — AI scans and proposes**
AI scans everything ThoughtSpot has imported from the connection — all raw tables and all semantic views. It maps the stated intent against what exists and proposes a selection using a priority stack:

1. Semantic views that match the intent — selected whole, not dissected
2. Raw tables that fill gaps the semantic views don't cover
3. Anything uncertain — flagged for the user to decide

The semantic view is treated as a complete, intentional artifact. If it exists and satisfies the intent, the AI uses it as-is. The joins, measures, and column definitions inside it are not re-examined or rebuilt.

AI surfaces a summary:
> "I found 2 semantic views that cover your campaign performance use case. I've also included the `users` raw table which isn't covered by any existing semantic view. Here's what's in the project — review and adjust."

User confirms, adjusts if needed.

---

#### Phase 4: Review the semantic view translation

Translation is never lossless. ThoughtSpot auto-converts what it can and flags what it couldn't — it never silently drops.

**Step 5 — Review what translated**

What typically survives:
- Table references, join paths
- Dimension definitions, basic column types
- Simple measures (SUM, COUNT, AVG)
- Column annotations where they exist in the semantic view

What gets flagged for manual review:
- Complex SQL expressions with platform-specific syntax
- Conditional logic, window functions
- Anything ThoughtSpot couldn't parse with confidence

**Step 6 — Fix translation gaps**

User works through the flagged items — rewrite, fix, or accept the ThoughtSpot equivalent. What never translates and must always be built here:
- Row-level security rules — reference Snowflake-specific user attributes, not ThoughtSpot's
- The AI interpretation layer — persona, sample questions, business logic for Spotter. This doesn't exist in any semantic view.

---

#### Phase 5: Fill the gaps

**Step 7 — Configure raw table additions**
For any raw tables the AI added to fill gaps: define joins to the semantic view, configure columns, annotate. Same as steps 6–7 from Journey 1 but scoped only to the new additions.

**Step 8 — Add calculated fields and metrics** *(if needed)*
If the semantic view's existing measures don't cover everything the use case needs, add calculated fields here. Often minimal — the semantic view likely already has the core metrics.

---

#### Phase 6: Make AI-ready

**Step 9 — Add AI context**
The primary work in Journey 2. Four fields — same as Journey 1:
- **Persona** — who the business user is
- **Sample questions** — representative questions this model should answer
- **Business logic** — rules Spotter must follow
- **Spotter instructions** — how to handle ambiguous terms

AI-assisted: agent drafts all four from the intent in step 3 and the column definitions from the semantic view. Column annotations that came from the semantic view are already populated — user reviews for accuracy rather than writing from scratch. Significant time saving vs. Journey 1.

---

#### Phase 7: Validate

**Step 10 — Test in Spotter**
Same as Journey 1. Ask questions, check answers, identify gaps.

**Step 11 — Iterate**
Wrong answer → identify whether the gap is in the translated model (a field that didn't translate correctly) or in the AI context (missing business logic). Fix accordingly → retest.

---

#### Phase 8: Publish

**Step 12 — Publish**
Same as Journey 1. Choose live or cached. Set permissions.

---

#### Phase 9: Post-publish

**Step 13 — Monitor and iterate**
Same as Journey 1. Plus one additional consideration: when the upstream semantic view changes in Snowflake, Data Studio surfaces it as a sync alert — the model may be out of date. User reviews the diff and updates.

---

## 5. Open Parameters

These are the design decisions that cut across all journeys. For each, we are proposing a direction — but the tradeoffs are called out explicitly so we can align before building.

---

### Parameter 1: How does data get connected?

**The question:** When a data team connects to their warehouse, do they see all tables immediately (full credential access), or do they select specific tables to bring in (selective import)?

**Industry pattern:** Most platforms offer full credential access at connection time, but expose only selected tables at the model layer. Connection ≠ what's in scope.

**The pollution problem:** Full access shows everything in the warehouse — hundreds or thousands of tables, most of which are not relevant for any given use case. This creates noise and makes the workspace hard to navigate.

**Proposed approach:** Full credential access (so data teams can browse), but explicit selection of tables into a project (so only what's in scope is modeled and visible to Spotter). The project is the unit of scoping.

**Tradeoff:** Selective import requires the data team to know upfront what they need. Full exposure is faster to start but degrades the workspace over time.
**How to handle the tradeoff:** AI-assisted table suggestion — based on the project's stated goal and persona, ThoughtSpot recommends which tables are likely relevant. Data team confirms or adjusts.

---

### Parameter 2: Translation fidelity for imported models

**The question:** When a customer imports Snowflake semantic views or dbt models, how complete is the translation?

**Proposed approach:** ThoughtSpot handles structural translation automatically (table structure, dimensions, measures, relationships). Formula/syntax differences are flagged for manual review, not auto-converted (risk of silent errors). Column descriptions carry over where they exist.

**What doesn't translate:** AI interpretation context (persona, sample questions, business logic for Spotter). This is always built in ThoughtSpot — it doesn't exist in the source system.

**Tradeoff:** Partial automation with human review is slower than full automation, but safer. Silent formula conversion errors are worse than flagged review items.

---

### Parameter 3: Query mode — live vs. materialized

**The question:** Does Spotter query the warehouse live when a business user asks a question, or does ThoughtSpot materialize the data?

**Industry pattern:** All mature platforms offer both. Live = always fresh, higher cost, dependent on warehouse performance. Materialized = predictable performance, potentially stale, lower query cost.

**Proposed approach:** Data team chooses per model at publish time. Default = live. Materialization is an explicit opt-in.

**Tradeoff:** Live query can be slow or expensive for large tables. Materialization introduces data freshness lag.
**How to handle:** Scheduled refresh for materialized models; cache invalidation on data pipeline completion. Data team sets the refresh cadence.

---

### Parameter 4: Model states — what exists between creation and business user access?

**The question:** What are the states a model moves through? Is it just Draft → Published, or something more?

**Industry patterns:**
- Looker: Development mode → Production (Git merge)
- dbt: Dev → Staging → Prod (environment tiers)
- Tableau: Draft (author only) → Published (visible to permitted users) → Certified (trusted signal)
- Omni: Workbook (ad hoc) → Shared Model (governed)

**The tradeoffs to align on:**

| Option | Description | Pro | Con |
|---|---|---|---|
| **Draft / Published** | Two states only. Published = accessible to permitted users. | Simple. No ambiguity. | No intermediate testing stage. |
| **Draft / Staging / Published** | Staging allows testing with a subset of users before broad publish. | Safer for high-stakes models. | More overhead; teams may skip staging. |
| **Draft / Published / Certified** | Published = accessible. Certified = signal of quality/trust. | Allows gradual trust-building. | Two-step publish adds friction. |

**Proposed approach:** Draft + Published, with an optional Certified flag. Reasoning: the complexity of a staging environment is better handled by permission-scoping (share with a test group before sharing broadly) than by a formal state machine. Certified is a lightweight quality signal that doesn't require a separate workflow.

---

### Parameter 5: Access, sharing, and permissions

**The question:** How does the data team control who can use a published model?

**Proposed approach:**
- Creator has full access by default
- Explicit share with individuals, groups, or everyone in the org
- Spotter only surfaces models the user has permission to access
- Row-level and column-level security carried over from the warehouse connection

**Open question to align on:** Should there be a "publish to all" action that is distinct from selective sharing? Or is it just: share → add users/groups → done?

can---

### Parameter 6: The feedback loop — who owns wrong answers?

**The question:** When Spotter gives a wrong answer, what happens? Where does that signal go, and who is responsible for fixing it?

**Industry state of the art:** Hex's Context Studio is the most mature implementation — it monitors all AI interactions, auto-tags interactions where the AI lacked sufficient context, and surfaces what to model next to the data team.

**Proposed approach:** Data Studio owns this loop. The flow is:
1. Business user gives negative feedback on a Spotter answer (thumbs down + description)
2. Signal appears in Data Studio — data team sees the question, the generated SQL, and the feedback
3. Data team identifies the gap (missing context, wrong join, ambiguous column)
4. They fix the model and re-publish
5. Spotter is retested on the same question pattern

**Why Data Studio should own this, not Spotter:** The root cause of wrong answers is almost always in the model layer — missing context, incorrect business logic, ambiguous column descriptions. Spotter-level fixes (prompt tweaks) are band-aids. Model-layer fixes are durable.

**This is the flywheel:** Better feedback loop → better models → better Spotter answers → more business user trust → more questions asked → more feedback → repeat.

---

## 6. Product Scenarios

These are specific jobs a data team member does inside Data Studio after a model exists. To be detailed out in the next pass.

### Iterative / growth
1. Spotter gave a wrong answer — find the cause and fix it
2. Add a new table to a live model
3. Add a new calculated field or metric
4. Add or update business context for better Spotter answers

---

### Job 2: Add a new table to a live model

**Scenario:** Business users are asking questions in Spotter that the model can't answer — the data they need isn't in the model yet.
**User:** Analytics engineer who owns the model
**Starts:** Model is published and live
**Ends:** Updated model is published, business users can now get answers to the new questions

---

#### Phase 1: Locate project

**Step 1 — Find project**
User opens Data Studio → Projects list. Finds the relevant project and clicks it. Lands on the model overview — the default view showing project context, data, and monitoring.

---

#### Phase 2: Identify the gap

**Step 2 — View project context and data**
User reviews the model overview: what tables are in it, what columns are exposed, what the current AI context says the model can answer. Gets a clear picture of the current state before making any changes.

**Step 3 — Check project usage**
User reviews the monitoring section of the model overview:
- Failed questions — what business users asked that Spotter couldn't answer
- Usage gaps — question patterns with no answer
- Business user feedback flagged for review

This confirms what's missing and why. The user now knows exactly what table needs to be added before clicking Edit.

---

#### Phase 3: Discover and select data

**Step 4 — Find table**
User clicks **Edit**. Workspace opens with the current draft loaded. Two possible states:
- No prior draft changes — workspace loads the published model. Header shows "Published — no pending changes."
- Unpublished changes exist — workspace loads the draft with those changes intact. Header shows "X changes since last publish."

User tells the agent what they need:
> "Business users are asking about stock levels but inventory data isn't in this model. Add it."

Agent scans the connection — raw tables and semantic views — for anything relevant and proposes the best match.

**Step 5 — Review table**
User reviews the proposed table: column names, data types, sample data, row count, null rates. Agent flags any quality issues — format mismatches, nulls on join keys, anything that could affect join accuracy.

**Step 6 — Add table to model**
User confirms. Agent adds the table as a new Data Source and creates the join to the existing model. Left panel updates — new Data Source entry, new Relationship entry. Visualizer updates — new node connected.

Agent flags join edge cases:
> "Join created on `product_id` — 100% match rate. Note: `stock_date` format differs from `orders.order_date`. Want me to normalise?"

**Step 7 — Add calculated fields** *(optional)*
If the new table enables new metrics the use case needs, user defines them here. Agent suggests calculated fields based on the new columns and existing model context.

**Step 8 — Add filters** *(optional)*
If the new table needs default filters or row-level security rules, define them here.

**Step 9 — Add parameters** *(optional)*
User-facing parameters for the new table's data if needed.

---

#### Phase 4: Make AI-ready

**Step 10 — Update AI context**
Agent automatically updates the AI context to reflect the new capability — adds relevant sample questions, updates business logic if needed. User reviews and refines.

Column annotations for the new table are drafted by the agent from name + sample values. User reviews rather than writing from scratch.

---

#### Phase 5: Validate

**Step 11 — Test in Spotter**
User switches to Test mode. Two things to verify:

- **New capability works** — ask the question that was failing. Check Spotter answers correctly using the new table.
- **Existing answers still work** — ask questions the model already answered. Confirm nothing broke.

**Step 12 — Compare with published model**
User reviews what has changed since the last publish — new table, new join, new columns, updated context. Confirms the diff looks right before going live.

**Step 13 — Iterate**
Wrong answer or regression → identify the gap → fix in draft → retest. The live model is untouched throughout this entire phase.

---

#### Phase 6: Publish

**Step 14 — Keep as draft** *(optional)*
If the user isn't ready to publish — changes are incomplete or need review — they exit the workspace. Draft auto-saves. All changes persist and will be exactly where they left off on return. No explicit save action required.

**Step 15 — Review downstream changes**
Before publishing, user reviews what will change for business users and any downstream objects (Liveboards, Answers) that reference this model. Confirms nothing unexpected will break.

**Step 16 — Update the model**
User clicks **Publish**. Diff shown:
> "1 table added · 1 relationship added · 7 columns added · AI context updated"

User confirms. Draft goes live. Business users can immediately ask questions about the new data in Spotter.

Model overview updates to reflect the new published state. Previously failing questions should now be answerable.

### Performance
5. Cache a model — decide what to materialize and set refresh schedule
6. A model is slow — identify the bottleneck and optimize

### Access and governance
7. Share a model with a new team or individual
8. Restrict access — a column contains PII, hide from certain users
9. Audit a model you didn't build — understand what it does, who uses it, what it answers
10. Deprecate or retire a model

### Monitoring
11. Monitor model usage — which questions are being asked, what's failing, what's popular

### Diagnostic — proactive issue surfacing across all models

These are triggered by upstream or downstream changes, not by the data team manually checking. Data Studio surfaces them in a "Needs attention" view.

12. **Missing metadata** — columns without descriptions or AI context set; Spotter quality degrades silently
13. **Broken dependency** — Liveboards or Answers reference columns that no longer exist in the model
14. **Stale cache** — SpotCache snapshot is too old; data shown to business users may be outdated
15. **Out of sync with dbt** — upstream dbt models have changed since last sync; joins and metrics may be wrong
16. **Unconnected tables** — a table in the project has no join path defined; it will be excluded from Spotter analysis
17. **Schema change** — columns have been added, renamed, or removed in the warehouse; model may be broken

---

## What we're asking product and engineering to align on

1. **The journey above** — does this 17-step flow cover the right scope? Are there steps missing or steps that shouldn't be here?
2. **AI-assisted path** — do we build both paths (manual + AI-assisted) in V1, or ship manual first and layer AI on top?
3. **Step 2.5 (intent)** — what does the AI agent ask for, exactly? A free-text description? A structured form (persona, use case, goal)? A question like "what should your business users be able to ask?"
4. **ThoughtSpot's camp** — do we agree Data Studio's "done" condition is a correct Spotter answer, not just a published model? This framing has implications for what features are core vs. supplementary.
5. **Model states** — Draft + Published + Certified, or something else?
6. **Sharing model** — share-first or publish-first?
7. **Feedback loop ownership** — does Data Studio own the wrong-answer loop end to end?
8. **The AI-ready layer** — is it ThoughtSpot's primary differentiation over dbt/Snowflake? If yes, it should be the centerpiece of the product, not a secondary step.

---

