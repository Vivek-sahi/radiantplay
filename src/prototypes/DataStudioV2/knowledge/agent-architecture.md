# Agent Architecture

Per-skill spec: reasoning chain + output states.

## How to use this

**Reasoning chain** — each step maps directly to a `ReasoningStep` object:
```ts
{ id: string, name: string, text?: string, state: 'pending' | 'current' | 'done' }
```
- `name` = the step title shown in the reasoning block header
- `text` = the description shown below the title while that step is `current` (with shimmer effect)
- Steps are shown one at a time. Only `current` step is expanded. Previous steps collapse to `done`.

**Output states** — what renders in `AgentResponseBlock` after reasoning completes. The "Renders" column describes the UI at the concept level. When building, use Radiant Play components from `src/components/` — the exact combination will be figured out during prototyping, not prescribed here.

Types → `components/agent/types.ts` · Status → `knowledge/skill-map.md`

---

## Group 1 · Connection & Discovery

### `read-connections`

**Reasoning chain**
| name | text |
|---|---|
| Checking workspace | Looking for existing warehouse connections… |
| Identifying best match | Matching connections to your query context… |

| State | Renders |
|---|---|
| `found` | List of existing connections — user selects the relevant one |
| `not-found` | "No connections found" message → triggers `connect-warehouse` |

---

### `connect-warehouse`

**Reasoning chain**
| name | text |
|---|---|
| No connection found | Starting connection setup… |
| Waiting for authentication | Connect to your warehouse to continue… |

| State | Renders |
|---|---|
| `pending` | Warehouse selector (Snowflake, BigQuery, etc.) + credentials input + connect button |
| `success` | "Connected to [warehouse]. Ready to scan." → triggers `scan-connection` |
| `auth-failed` | "Authentication failed. Check your credentials and try again." + retry |

---

### `scan-connection`

**Reasoning chain**
| name | text |
|---|---|
| Scanning [connection name] | Reading available schemas… |
| Reading table schemas | Cataloguing tables and columns… |
| Inferring relationships | Detecting join keys and foreign key patterns… |

| State | Renders |
|---|---|
| `success` | "[N] tables found, [N] relationships inferred" summary |
| `partial` | "Scanned [N] tables. [N] failed — check permissions." |
| `empty` | "No tables found. Check connection permissions." |

---

## Group 2 · Model Building

### `clarify-scope`

**Reasoning chain**
| name | text |
|---|---|
| Analyzing your request | Reading prompt intent and workspace context… |
| Ambiguity detected | Need a few answers before building — [dimension / granularity / security] is unclear… |

| State | Renders |
|---|---|
| `needs-input` | Multi-step clarification form (granularity → dimensions → RLS) |
| `clear` | (silent — scope unambiguous, passes directly to `build-model`) |

---

### `build-model`

**Reasoning chain**
| name | text |
|---|---|
| Scanning available tables | Finding tables relevant to your query… |
| Selecting tables | Identified: [FCT_SALES, DIM_DATE, DIM_REGION]… |
| Inferring join keys | Detecting relationships between selected tables… |
| Mapping columns | Each column will become a metric in your model… |

| State | Renders |
|---|---|
| `proposed` | Model Proposal Card — tables, joins, columns/metrics (each column auto-becomes a metric in ThoughtSpot) |
| `chasm-trap-detected` | Model Proposal Card + warning: "Potential chasm trap between [T1] and [T2]. Validate before proceeding." |

---

### `generate-formulas`
> Every column added to a model auto-becomes a metric. This skill creates **derived/calculated** metrics only — new columns not in the source schema (e.g. Gross Margin = Revenue − COGS).

**Reasoning chain**
| name | text |
|---|---|
| Analyzing model structure | Reviewing existing columns and metrics… |
| Identifying derived metrics | Finding business metrics that need calculated fields… |
| Drafting formulas | Writing expressions for: [Gross Margin, Churn Rate]… |

| State | Renders |
|---|---|
| `proposed` | Editable formula list — name + expression per formula |
| `none-needed` | "All metrics can be derived directly from your columns. No formulas needed." |

---

### `add-model-filters`
> Model-level default filters only — rules applied every time this model is queried (e.g. exclude test accounts). Not query-time filters; not RLS (covered in `validate-model`).

**Reasoning chain**
| name | text |
|---|---|
| Applying default filter rules | Setting model-level filters that apply to every query… |

| State | Renders |
|---|---|
| `proposed` | Editable filter rules — column + operator + value per rule |
| `applied` | "Default filters applied to model." |

---

## Group 3 · Review, Testing & Quality

### `review-model`
> **Human-led.** Agent surfaces the model structure for a human to inspect and edit. No system checks run here.

**Reasoning chain**
| name | text |
|---|---|
| Preparing model for review | Organizing tables, joins, and columns for inspection… |

| State | Renders |
|---|---|
| `ready` | Expandable model review — ERD, columns/metrics, join details |
| `issues-found` | Model review with flagged items highlighted |

---

### `validate-model`
> **System-led.** Automated integrity checks. No human input unless an error is found.

**Reasoning chain**
| name | text |
|---|---|
| Running EXPLAIN plans | Compiling model queries to check for errors… |
| Checking for chasm traps | Looking for fact tables sharing dimensions without a bridge… |
| Checking for fan-out traps | Verifying fact tables are at the same grain before joining… |
| Validating join integrity | Confirming all join keys exist and match types… |
| Validating RLS rules | Verifying row-level security expressions are valid… |

| State | Renders |
|---|---|
| `valid` | "Model is valid. Ready to commit." |
| `chasm-trap` | "Chasm trap between [T1] and [T2] — two fact tables share a dimension without a bridge. Suggested fix: [X]" |
| `fan-out` | "Fan-out trap — [T1] and [T2] are at different grains. Joining them will inflate [metric]. Suggested fix: [X]" |
| `rls-invalid` | RLS rule error with specific issue + correction prompt |
| `join-error` | Broken join with specific tables + fix suggestion |

---

### `test-suite`
> Tests across four dimensions. Technical pass ≠ semantic correctness.
> - **Technical** — did the query execute?
> - **Semantic** — does the answer match the business definition?
> - **Time** — correct time range and granularity?
> - **Data quality** — nulls, outliers, stale data in result?

**Reasoning chain**
| name | text |
|---|---|
| Analyzing model metadata | Reading metric definitions, dimensions, and time columns… |
| Generating test questions | Auto-creating [N] questions from your model structure… |
| Executing test queries | Running all queries against your data… |
| Evaluating results | Checking each answer across technical, semantic, time, and quality dimensions… |

| State | Renders |
|---|---|
| `configure` | Test suite setup — AI questions toggle, add custom questions, run |
| `running` | Progress indicator with query count |
| `results` | Results accordion — each question expandable with answer + pass/fail per dimension |
| `all-pass` | "All [N] tests passed across all dimensions." |
| `some-fail` | Results with failed tests surfaced first, each labelled with which dimension failed |

---

### `data-quality-check`

**Reasoning chain**
| name | text |
|---|---|
| Checking result set | Scanning for nulls, duplicates, and outliers… |
| Assessing quality | Evaluating completeness, consistency, and freshness… |

| State | Renders |
|---|---|
| `clean` | Answer chart with quality badge ("Powered by dbt" or "Data verified") |
| `issues-found` | Answer chart with quality warning + "Review issues" CTA |

---

### `data-quality-fix`

**Reasoning chain**
| name | text |
|---|---|
| Analyzing quality issues | Reading [N] flagged problems… |
| Generating fix plan | Writing recommendations for each issue… |

| State | Renders |
|---|---|
| `plan-ready` | Issues list with per-issue recommendation — user approves or rejects each |
| `applied` | "All fixes applied." + updated model summary |
| `partial` | "[N] fixes applied. [N] require manual intervention." + remaining issues |

---

## Group 4 · dbt

### `translate-dbt-model`

**Reasoning chain**
| name | text |
|---|---|
| Reading dbt semantic layer | Scanning metric definitions, dimensions, and entities… |
| Mapping to TML | Translating dbt measures and dimensions to ThoughtSpot TML… |
| Resolving filters and joins | Carrying over filter expressions and relationship definitions… |

| State | Renders |
|---|---|
| `translated` | Translation summary — what mapped cleanly vs needs review |
| `partial` | Summary with flagged objects that need manual fix |
| `no-dbt-layer` | "No dbt semantic layer found in this connection." |

---

### `review-dbt-model`
> **Human-led.** dbt YAML is read-only — users cannot edit the source definition, only the TML mapping.

**Reasoning chain**
| name | text |
|---|---|
| Reviewing translation | Comparing dbt source against generated TML… |
| Checking metric definitions | Verifying measures, dimensions, and time columns match… |

| State | Renders |
|---|---|
| `ready` | dbt YAML (read-only) alongside mapped TML — side by side |
| `mismatch` | Side-by-side view with specific discrepancies highlighted |

---

### `validate-dbt-model`

**Reasoning chain**
| name | text |
|---|---|
| Validating translation integrity | Checking that all dbt objects have a valid TML equivalent… |
| Running lineage check | Verifying metric lineage against dbt YAML source… |
| Verifying RLS carry-over | Confirming security rules translated correctly… |

| State | Renders |
|---|---|
| `valid` | "Translation valid. Lineage confirmed." |
| `lineage-break` | Specific lineage break + fix suggestion |
| `rls-mismatch` | RLS rule that didn't carry over + correction |

---

### `fix-dbt-model`

**Reasoning chain**
| name | text |
|---|---|
| Analyzing translation failures | Reading [N] objects that failed to translate… |
| Generating fix plan | Writing a fix action for each failure… |

| State | Renders |
|---|---|
| `plan-ready` | Per-issue fix plan — user approves or rejects each |
| `fixed` | "All [N] issues resolved." + updated translation summary |

---

## Group 5 · Answer & Insight

### `resolve-query-ambiguity`
> Fires at query time when a user's question matches multiple valid model paths. Different from `clarify-scope` (pre-build) — this runs mid-query inside `spotter`.

**Reasoning chain**
| name | text |
|---|---|
| Analyzing query | Checking query against available models and metrics… |
| Ambiguity detected | Found [N] possible interpretations — asking user to choose… |

| State | Renders |
|---|---|
| `ambiguous` | "I found [N] ways to interpret this" + selectable option pills |
| `resolved` | (silent — user selected, query continues in `spotter`) |

---

### `spotter`

**Reasoning chain**
| name | text |
|---|---|
| Compiling TML | Building the search query from your model… |
| Executing query | Running against your warehouse… |
| Rendering answer | Formatting result for display… |

| State | Renders |
|---|---|
| `answer` | Chart answer widget + optional badge (dbt / quality) |
| `no-results` | Diagnosed empty state — "No results found. Likely cause: [wrong join / grain mismatch / filter collision]" + suggestions |
| `error` | Query error with explanation |

---

### `save-answer`
**Reasoning chain**
(none — simple user action)

| State | Renders |
|---|---|
| `select-destination` | Folder picker (Personal / Team) |
| `saved` | "Answer saved to [folder]." + "Add this to a Liveboard?" |

---

## Group 6 · Coaching & Memory

### `feedback-coach`
> Coaching writes to the **data model memory file** — one `.md` per model (e.g. `Model_Retail_Core.memory.md`). Stores: synonyms, fiscal definitions, default time granularity, filter defaults, blacklisted column combinations, self-learned usage patterns.
>
> Coaching either updates a **column's metadata** (adds synonym to a specific metric) or appends a **semantic rule to the memory file** (fiscal year = Feb–Jan, always exclude test accounts, etc.).

**Reasoning chain**
(triggered by user action — no proactive reasoning shown)

| State | Renders |
|---|---|
| `positive` | (thumbs up) Silent — logs success to model memory |
| `negative` | "What went wrong?" with dimension options: Wrong time range / Wrong metric / Wrong filter / Other + coaching note input |
| `corrective` | Agent identifies coaching type → "Got it. I'll remember that [rule]. Save to [Model] memory?" + confirm |
| `saved` | "Coaching saved to [Model] memory." |

---

## Group 7 · Sharing & Publishing

### `publish-model`

**Reasoning chain**
| name | text |
|---|---|
| Preparing for publish | Reviewing model completeness… |
| Running final checks | Confirming validation has passed… |

| State | Renders |
|---|---|
| `ready` | Publish confirmation — model summary + publish action |
| `published` | "Model published to workspace." + link to model |

---

### `share-model`
**Reasoning chain**
(none — simple user action)

| State | Renders |
|---|---|
| `share-ui` | User/group selector with permission level (view / edit) |
| `shared` | "Model shared with [N] people." |

---

## Group 8 · Liveboard

### `create-liveboard`

**Reasoning chain**
| name | text |
|---|---|
| Analyzing model structure | Reading metrics, dimensions, and time columns… |
| Reviewing saved answers | Checking answers already created from this model… |
| Proposing metrics | Identifying the most valuable metrics for an executive view… |
| Drafting layout | Organizing metrics into a liveboard layout… |

| State | Renders |
|---|---|
| `metrics-proposed` | Proposed metrics list — user toggles which to include |
| `preview` | Liveboard layout preview with selected metrics |
| `created` | "Liveboard created." + link to open it |

---

### `share-liveboard`
**Reasoning chain**
(none — simple user action)

| State | Renders |
|---|---|
| `share-ui` | User/group selector with permission level |
| `shared` | "Liveboard shared with [N] people." |

---

## Group 9 · Monitoring & Maintenance

### `model-health`
**Reasoning chain**
(background / passive — no reasoning block shown)

| State | Renders |
|---|---|
| `healthy` | Green health badge on model card |
| `needs-coaching` | Amber badge: "Needs coaching" + view recommendations CTA |
| `broken` | Red badge: "Broken" + diagnose CTA → triggers `diagnose-model` |

---

### `diagnose-model`

**Reasoning chain**
| name | text |
|---|---|
| Analyzing recent failures | Reading query logs from the past [N] days… |
| Reviewing chat logs | Checking what users asked and what failed… |
| Identifying semantic gaps | Looking for patterns in failed or blocked queries… |

| State | Renders |
|---|---|
| `diagnosis-ready` | Diagnostic accordion — specific gap e.g. "6 users asked to slice by Zip Code. Zip Code is not a conformed dimension linked to the Inventory Fact. I blocked the query to prevent a fan-out." |
| `no-issues` | "Model is performing well. No semantic gaps found." |

---

### `update-model`

**Reasoning chain**
| name | text |
|---|---|
| Drafting TML update | Writing the model change based on diagnosis… |
| Injecting new dimension | Adding [DIM_LOCATION] as a conformed dimension… |
| Verifying join keys | Confirming join key [location_id] is valid across both facts… |

| State | Renders |
|---|---|
| `proposal-ready` | Model Update Proposal — diff of what changes (before / after) |
| `applied` | "Model updated." + health badge resets to green |

---

## Group 10 · Orchestration

### `render-genui`
> Fires after every skill's reasoning chain completes, before the final output renders. It reads the content type and data shape of the skill output and decides which UI to render — this is the "generative UI" step.
>
> In the **demo**: hardcoded mapping (content type → pre-built component).
> In the **real product**: calls a generative UI API to produce the right component for the content.
>
> This is why reasoning chain steps show UI rather than text — each `ReasoningBlock` step is a `render-genui` decision happening live.

**Reasoning chain**
| name | text |
|---|---|
| Reading output | Analyzing content type and data shape… |
| Selecting UI | Choosing the right view for this result… |

| State | Renders |
|---|---|
| `rendered` | The appropriate GenUI component for the skill output (model card, chart, formula list, etc.) |
| `fallback` | Plain text response — no matching UI found for this content type |

---

### `suggest-next`
> Fires automatically after every skill. No visible reasoning. Reads `skillId` from the completed `AgentMessage` to pick chips.

**Reasoning chain**
(none — no reasoning block shown)

| State | Renders |
|---|---|
| `chips` | 2–4 contextual follow-up chips via `NextChips` (existing agent shell component) |
| `silent` | Nothing |

**Chip map**

| After `skillId` | Suggested chips |
|---|---|
| `build-model` | Generate formulas · Add filters · Validate model · Review model |
| `validate-model` (valid) | Test suite · Publish model · Create liveboard |
| `validate-model` (error) | Fix model · Review model |
| `translate-dbt-model` | Review dbt model · Validate dbt model |
| `spotter` | Save answer · Thumbs up · Thumbs down · Create liveboard |
| `publish-model` | Share model · Create liveboard |
| `create-liveboard` | Share liveboard · Ask another question |
| `feedback-coach` (saved) | Ask another question |
