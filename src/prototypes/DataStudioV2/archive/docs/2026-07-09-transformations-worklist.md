# Data Studio — Transformations: worklist

_Consolidated from team feedback (Slack + review sessions + modeling/transformation looms), 2026-07-09. Scope: the transformation / canvas / code-block / data-preview work. Connections and monitoring feedback are tracked separately._

**Type legend:** `UI` small UI fix · `Copy` wording · `Feature` new build · `Design` needs a design decision first · `Research` competitive · `PM` question for PM · `Demo` comms/demo
**Status:** `today` in today's scope · `todo` queued · `open` decision needed · `parked`

---

## 1. Things to do

| # | Item | Type | Status | Source / note |
|---|------|------|--------|---------------|
| 1 | Data-browser click → show columns in **preview only**, not a columns view in the browser | UI | today | Vivek scope |
| 2 | Remove **`sort`** from the toolbar | UI | today | Vivek scope |
| 3 | Move **undo/redo + zoom to the right** | UI | today | Vivek scope |
| 4 | **Caching modal copy reframe** — statement, not question. Title "Caching is required"; body "To use uploaded files, a model is required to be cached…"; CTAs **"Cancel file upload"** / **"Continue with caching"** | Copy | todo | Abhinav (Slack, verbatim) |
| 5 | **Code-block lifecycle (SQL/Python): create → preview → edit → debug → join downstream.** Code as a first-class canvas node (inputs → code → output); emphasize on canvas (not hidden in a rail) | Design→Feature | today | Vivek scope · Anjali · team ("getting hidden") |
| 6 | **Expandable / full-screen code surface** (right panel too small for real code) — progressive disclosure, not permanent widening | Design→Feature | today | Anjali ("will the right space be enough for a complicated transformation?") · team |
| 7 | **New use-case: bring fresh data from an app/API via Python** (Python block/notebook as a data source) | Design→Feature | today | Anjali ("apps via python notebooks; true power of Analyst Studio not represented") · missing from demo |
| 8 | **Spreadsheet-like data preview** — grid with filters, sorts, hide/unhide columns, full-screen, (maybe) in-grid formula | Design→Feature | today | Vivek scope · team ("spreadsheet/search view for validation", "Databricks-like") |
| 9 | **Object-level vs model-level actions** — separate prep/filter/join (object) from formula/SQL/Python (model-level); give model-level actions a home | Design→Feature | todo | Vivek + feedback ("no clear way to build a formula combining two tables") |
| 10 | **Formula across tables** (cross-table / model-level formula) | Feature | todo | part of #9 · loom ("table-level vs model-level function; also SQL/Python") |
| 11 | **Column auto-select** from data browser when 100s of columns | Feature | todo | loom ("auto-select is the right direction") |
| 12 | **Side panel / screen UI treatment** — keep current treatment, polish (umbrella for #1–3) | UI | today | Vivek scope |
| 13 | **Full-capability demo/loom** — show Python/API-as-source + agent-directed authoring (canvas previews, user directs via agent); code write/edit/debug | Demo | todo | team ("demo didn't show full power"; "separate loom") |

---

## 2. Open items (decisions needed before building)

- **Code authoring model** — agent writes → canvas/preview shows → user edits/debugs, vs. user hand-writes? (or both) → blocks #5
- **Where model-level actions live** — model toolbar (A) / explicit output-model node (B) / the spreadsheet-on-output (C)? → blocks #9. _Lean: B + C, agent as primary author._
- **Spreadsheet: authoring vs validation-only** — can you create model formulas in-grid, or is it look/filter/sort only? → blocks #8. _Lean: authoring (natural home for cross-table formula)._
- **View-controls vs model-edits** — do filters/sorts/hide in the preview persist as model steps, or are they an ephemeral lens? Must be visually distinct. → blocks #8. _Lean: view-lens by default + explicit "make this a model step"._
- **Preview scope** — default to the **model output** (with a way to inspect a single node) vs. per-node "select a node"? → blocks #8. _Lean: model output._
- **Input/Output (source/output) view** — one output-focused view vs. separate before/after view? _Lean: output-primary + on-demand before/after on transform steps._
- **Panel treatment** — on-demand expand vs. permanent widen? _Resolved: expand (progressive disclosure)._
- **Fan/chasm trap honesty** — a flat spreadsheet preview of a *joined* model can double-count; how does the preview stay honest?

---

## 3. PM questions

- What is an **example of a complex transformation**? (calibrates #5/#6/#8)
- What happens when a transformation is **too complex** for the current treatment?
- **Cached data: raw vs pre-transformed (baked)?** — affects whether a post-transform edit takes effect immediately for consumers or only after a cache re-run (PM/eng).

---

## 4. Direction & principles (from discussion + competitor research)

**Principles**
- **Design for complex, default to simple** — progressive disclosure; the demo looked simple because the example was, but real ETL code gets complex.
- **Code = first-class node** (inputs → code → output) that participates in the DAG, so its output joins downstream like any table.
- **Complex code gets its own surface** (expand / full-screen editor), never the rail. Rail = simple visual steps only.
- **Emphasize code, don't hide it** — visible code node + "view/edit code" affordance.
- **Separate object-level from model-level** actions; the spreadsheet-on-output can be the model-level home.
- **Distinguish "you're looking" (view controls) from "you're changing the model" (edits).**

**Competitor references (how visual-canvas tools handle code)**
- **Alteryx** — Python/R/Formula are first-class tools/nodes; double-click → dedicated editor.
- **Dataiku** — visual Flow + code *recipes* (SQL/Py/R) in a full IDE-like editor; output dataset joins downstream. Closest analog.
- **Databricks** — notebooks + declarative/visual pipelines; heavy code lives in a notebook the canvas orchestrates.
- **Coalesce** — dbt-native; each node generates SQL you can view/override.
- **Power Query** — step list + "Advanced Editor" modal for full M code (progressive disclosure).
- _(Current specifics to verify with a live research pass before finalizing #5's design.)_

---

## 5. Today's build order (proposed)

- **Round 1 (no design needed):** #1, #2, #3, #4
- **Round 2:** lock code authoring model → build #5 + #6 → then #7 (API-via-Python)
- **Round 3:** lock spreadsheet decisions → build #8
- **Later:** #9/#10 (object-vs-model), #11, #13
