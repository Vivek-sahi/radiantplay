# Code-block (SQL/Python) interface — decisions & action items

_2026-07-09 · grounded in `2026-07-09-competitor-code-ux-research.md` + our product use-case priority. Companion backlog: `2026-07-09-transformations-worklist.md`._

## Guiding principle: 60/40 modeling-first

Most users come to Data Studio **to model data** — enrich for semantics, or bring an existing model and get going. ~90% will *also* need some transformation / external data / prep along the way, but in emphasis it's roughly **60 modeling / 40 transformation**. So every interface choice must keep **modeling primary and simple**, and treat **transformation/code as capable but progressive-disclosure** — never letting code dominate the surface.

---

## Mental model: the canvas is a visual notebook

The whole surface is a **visual notebook** (the model Hex and Databricks use). Every block is a **cell** — SQL, Python, or a visual transform (join / filter / formula / prep) — and the canvas is the notebook's **graph/DAG view** rather than a linear list of cells.

- **Canvas node = the cell** (compact; no code on the node — like Hex's graph view).
- **Properties panel = the cell editor** — see/edit the cell as UI and/or code.
- **Bottom preview = the cell's output.**

So "every block has a code view" is really "every **cell** has a code representation": SQL/Python *are* code; visual transforms *generate* code. v1 keeps visual-transform code **read-only** (see round-trip decision); a "pure notebook" would make every cell's code editable — a later step.

---

## Concept model: three ways to do anything (the control spectrum)

The same task can be done at three levels of control, and the user chooses:

1. **Agent** (left panel) — describe it; the agent does it. Fastest, least manual.
2. **Manual UI** (properties panel) — do it yourself with visual controls (pickers, dropdowns). Direct, no code.
3. **Code** (switch to code) — for complex tasks the UI can't express, drop into SQL / Python.

This holds across every capability. The **visual notebook** (cells on the canvas) and the **bottom preview** stay constant; only *how you author a cell* slides along agent → UI → code. **Build priority:** the **code** pillar via first-class **Python & SQL cells** first; the UI→code switch for visual-transform cells comes later.

---

## Confirmed interface model

1. **Canvas stays primary.** Code never takes over the screen by default.
2. **Right panel = the block editor**, with up to **two views per block**:
   - **UI / properties view** — pick a column, choose an operation (today's prep/join/formula UX).
   - **Code view** — an editable code editor (editable *by default*).
3. **Per-block view matrix:**

   | Block | UI view | Code view | Default view |
   |-------|:------:|:--------:|-------------|
   | Python | — (none) | yes | **Code** |
   | SQL | light | yes | **Code** |
   | Formula | yes | yes | UI |
   | Join | yes | yes | UI |
   | Filter | yes | yes | UI |
   | Fix nulls / prep | yes | yes | UI |

   Python has **no UI view** (code only); join/filter/formula/prep default to **UI** but the user can **switch to code view**. Right-panel **width is resizable**.
4. **Bottom panel = data preview/output, always.** A block's **Run** result shows in the bottom preview, exactly like every other block. **No code editing in the bottom** — that avoids the tab-switching problem (code in the bottom would fight with preview).
5. **Every block has a code view**, round-trippable with its UI (Power Query pattern). This is how we *emphasize* code without a special surface, while keeping common modeling ops simple.
6. **A code block is a single unit** — 1 block = 1 step → one output. Not a multi-cell notebook.
7. **Right-panel code editor spec (Python/SQL):** source/inputs info · code editor (editable by default — treat it as a real code editor first, properties second) · light properties (Python: **version dropdown**, **import libraries**; SQL: simpler). Effectively a compact, single-cell notebook cell.
8. **Emphasis on the canvas:** a code node shows a **language badge + a short code snippet peek** so it's visible in the flow (Dataiku-style token).
9. **Full-screen = optional escape hatch** for genuinely large code (code on top, results below). Not the default (keeps us in canvas context per 60/40). *Add or remove — TBD.*
10. **Output joins downstream on the canvas** — the block's output is a dataset node; edges auto-derived.
11. **Lifecycle:** write (right panel) → **Run** → output + errors in the **bottom preview** → fix → output node joins downstream.

---

## Open items to resolve

- **Round-trip fidelity:** if a user hand-edits the generated code of a *UI* block (join/formula), does the edit push back to the UI, or does the UI lock once code is hand-edited? (Power Query keeps it as a step; editing generated SQL can break the visual mapping — decide the boundary.)
- **"Switch to code view" affordance** — where/how it appears per block.
- **Full-screen** — include it or not (item 9).
- **Error/debug surface** — inline markers vs a console strip in the bottom preview vs both.
- **SQL properties** — how much beyond the query itself (connection, materialization)?

---

## Action items (build)

**Group A — quick wins (no design needed, from the worklist)**
- Data-browser click → columns show in **preview only**, not a browser columns view
- Remove **sort** from the toolbar
- Move **undo/redo + zoom to the right**
- **Caching modal copy** reframe (statement + "Cancel file upload" / "Continue with caching")

**Group B — code-block lifecycle** (the anchor)
1. Right-panel **dual-view scaffold** — UI view ↔ code view toggle for a block
2. **Python block** — code-first editor (version dropdown, imports, single-cell) → **Run** → bottom preview + errors
3. **SQL block** — code-first editor (lighter props) → **Run** → bottom preview
4. **Every-block code view** — expose code for join/filter/formula/prep (start read-only, then editable per the round-trip decision)
5. **Canvas emphasis** — code node badge + snippet peek
6. **Full-screen expand** (optional, per item 9)

**Group C — new use-case flow (below)**

---

## New use-case flow: bring a data source from the Jira API via Python

Addresses Anjali's feedback ("fresh data from apps using python notebooks; the true power of Analyst Studio isn't represented"). The Python data-source block is just a code block whose input is an API call and whose output is a dataset.

1. **Trigger** — user asks the agent ("bring in our Jira issues") or Add data → **App / API**.
2. **Agent proposes a Python data-source block** — with a visible reassurance that **credentials go to a secure store, not the chat/LLM** (banner).
3. **Right-panel code editor (code-first)** — Python block pre-filled to call the **Jira REST API**: auth via the stored credential, endpoint + JQL/params, `requests`/library imports, Python version. Single cell.
4. **Run** → the **bottom preview** shows fetched Jira issues as a table; errors surface in the preview.
5. **Output = a dataset node** on the canvas (e.g. `jira_issues`) → **cache gate** if required (SpotStore / agent DB) → **join** into the model downstream.
6. **Refresh / schedule** for freshness (re-pull on a cadence).

---

## Sequencing
- **Round 1:** Group A (quick wins)
- **Round 2:** Group B — dual-view scaffold → Python block → SQL block → every-block code view
- **Round 3:** Group C — Jira API flow
- **Separate thread:** spreadsheet-like data preview (worklist #8) + object-vs-model actions (#9)
