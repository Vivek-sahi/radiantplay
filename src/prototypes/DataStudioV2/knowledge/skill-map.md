# Skill Map

Master index of all agent skills. Update **Status** as you iterate.

**Statuses:** `draft` · `in-progress` · `confirmed` · `built`

---

| Group | Skill | What it does | Status |
|---|---|---|---|
| **1 · Connection & Discovery** | `read-connections` | Fetch existing warehouse connections, identify the relevant one | draft |
| | `connect-warehouse` | Build a new connection when none exists | draft |
| | `scan-connection` | Scan a specific connection — tables, columns, relationships | draft |
| **2 · Model Building** | `clarify-scope` | Detect ambiguity, run clarification loop before building | draft |
| | `build-model` | Structural build — select tables, infer joins, map columns | draft |
| | `generate-formulas` | Add-on — create derived/calculated metrics (note: every column added to a model auto-becomes a metric; this skill creates new derived ones) | draft |
| | `add-model-filters` | Add-on — apply model-level default filters (e.g. exclude test accounts, default to active records) | draft |
| **3 · Review, Testing & Quality** | `review-model` | Structural review — ERD, joins, columns | draft |
| | `validate-model` | Validate integrity — chasm traps, join correctness, RLS | draft |
| | `test-suite` | Auto-generate + run test questions, review results accordion | draft |
| | `data-quality-check` | Check result set for nulls, duplicates, outliers | draft |
| | `data-quality-fix` | Generate fix plan, user approves, agent applies | draft |
| **4 · dbt** | `translate-dbt-model` | Translate dbt semantic layer into ThoughtSpot TML | draft |
| | `review-dbt-model` | Review translation against dbt YAML source | draft |
| | `validate-dbt-model` | Validate lineage, metric definitions, RLS carry-over | draft |
| | `fix-dbt-model` | Fix objects that didn't translate correctly | draft |
| **5 · Answer & Insight** | `resolve-query-ambiguity` | Query-time disambiguation — when a query matches multiple model paths, surface options to user | draft |
| | `spotter` | Run query via Spotter, render answer in chat | draft |
| | `save-answer` | Destination picker, save answer, liveboard prompt | draft |
| **6 · Coaching & Memory** | `feedback-coach` | Post-answer: positive / negative / corrective → save to memory | draft |
| **7 · Sharing & Publishing** | `publish-model` | Publish model to workspace | draft |
| | `share-model` | Share model with users or groups | draft |
| **8 · Liveboard** | `create-liveboard` | Propose metrics from model + answers → user refines → build liveboard | draft |
| | `share-liveboard` | Share liveboard with users or groups | draft |
| **9 · Monitoring & Maintenance** | `model-health` | Health badge — healthy / needs coaching / broken | draft |
| | `diagnose-model` | Analyze failing query logs, surface semantic gap | draft |
| | `update-model` | Draft TML fix, apply, health resets to green | draft |
| **10 · Orchestration** | `render-genui` | After reasoning completes, decide which UI to render for the output (demo: hardcoded map; production: generative UI API) | draft |
| | `suggest-next` | After any skill completes, populate follow-up chips contextually | draft |
