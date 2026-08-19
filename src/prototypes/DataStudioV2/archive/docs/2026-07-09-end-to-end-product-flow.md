# Data Studio — end-to-end product flow

_2026-07-09 · the product spine. Turning any data into AI-ready data: steps 1–4 make data trustworthy, step 5 adds semantics + context for AI._

## The five action types

1. **Add data** — upfront, bring sources onto the canvas (Upload CSV · CDW table · SQL · Python). *Model-level* (grows the model).
2. **Manipulate a table** — shape one source: sort, filter, formula, prep. Surfaced **alongside the data preview**, because you do this while previewing a table. *Table-level.*
3. **Join tables** — relate multiple tables. Done **visually on the canvas** (drag a link from one card to another). The bridge from tables → model.
4. **Clean the joined data** — preview the *combined* result and prep what the join exposed. *Model-level.*
5. **Make the model AI-ready** — close gaps in descriptions, metadata, synonyms, instructions so AI answers correctly. *Model-level.*

Flow: **Add → Shape (table) → Relate → Clean (model) → AI-ready → [Test loop → Publish].**

## Table-level vs model-level (the core IA)

The biggest clarity issue is *what is a table action vs a model action*. Resolve it with **context = selection**: a block is selected → table context; nothing selected / the **Model view** → model context.

| | Table-level (block selected) | Model-level (Model view) |
|---|---|---|
| Data | this table's rows (Table view) | joined result (Combined view) |
| Clean/shape | prep · filter · sort · formula | prep on the joined result |
| Code | SQL / Python on this table | — |
| Quality | **table DQ score** → table prep | **model DQ score** → model fixes |
| Calc | formula = a column | formula = a **metric** across tables |
| Structure | link this table to another | relationships · all columns · metrics |
| Validate | — | **Test** (ask questions of the model) |
| Ship | — | Publish / Certify |

## Steps 2 & 4 are one toolkit at two scopes

Both are "preview data, then act on it." The only difference is the scope — one table vs the joined result — which the **Table | Combined toggle** switches. So we build one prep/reshape toolkit; the toggle sets scope; defaults are tuned per scope:

- **Step 2 (Table view)** — clean the *raw input*: fix nulls (source), change type / parse date / trim, rename, filter-to-scope, dedup.
- **Step 4 (Combined view)** — only meaningful once combined: formula/metric across tables, aggregate to a grain, cross-table filter.

**Why step 4 is genuinely distinct:** the join itself *creates* problems that can't exist at step 2 — null keys from unmatched rows, fanout/duplication from many-to-many, coverage gaps (e.g. "NPS covers only 24% of accounts"). Cleaning those join artifacts is step 4's own job.

## Step 4 vs step 5 — two kinds of "clean"

- **Step 4 = data quality** — is the data correct? (nulls, types, sensible values, join integrity)
- **Step 5 = AI-readiness** — is the model understandable to AI? (descriptions, synonyms, metadata, verified metrics, instructions)

Keep them as two lanes in the Model view.

## The loop

**Test** is the feedback for step 5: test → AI gets something wrong → surfaces an AI-readiness gap → fix → re-test. That test→fix→re-test loop (proving data against real use) is the differentiator — Test is first-class, not a footnote. **Publish/Certify** is the bookend.

## Where the build is (2026-07-09)

- 1 Add data ✅ · 2 Manipulate table ✅ (controls placed) · 3 Join ✅ (drag-to-connect) · 4 Clean joined ⚠️ (Combined toggle exists, prep not wired) · 5 AI-ready ❌ (Model view not built).
- Frontier: the **Model view** (steps 4–5) with a Data-quality lane and an AI-readiness lane, plus **Test**.
