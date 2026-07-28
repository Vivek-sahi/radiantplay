# Data Studio canvas — two block models

_2026-07-09 · exploration doc for stakeholder discussion_

We're testing **two different concept models** for how transformations live on the modeling canvas. They are not two skins of the same thing — the mental model differs, so we'll build both as separate options, A/B them against real flows, and keep the winner.

---

## Option 1 — Dataset nodes (current)

**Concept model:** a canvas node = a **dataset** (a table). Transformations *stack inside* the node as an ordered pipeline (source → join → filter → Python). The node *is* the dataset; its pipeline is tucked inside it and surfaced in the properties panel.

**Pros**
- **The canvas reads as a *model*.** One node per table — a semantic model with 8 tables shows ~8 nodes, not 40. Directly serves our 60/40 "modeling is primary" goal.
- Matches the data-team mental model: *"this table, and how I cleaned it."*
- Low wiring overhead; stays legible at scale; close to dbt-model thinking.

**Cons**
- **Can't start with a free-standing block.** Every block must attach to an existing table node — no "drop a Python block on an empty canvas."
- **Multi-table operations look wrong.** A formula/Python across 2–3 tables doesn't fit a pipeline that lives inside one node — the representation is awkward.
- **Lineage isn't clear.** The transform chain is hidden inside a node; you can't see at a glance how a result was derived.
- Branching / reuse of an intermediate result is hard.

---

## Option 2 — Block flow (each action = a block)

**Concept model:** a canvas node = a **single action** (source, join, filter, formula, SQL, Python). Blocks are wired together with arrows. The canvas is a full data-flow graph / DAG.

**Pros**
- **Lineage is explicit and visible** — every operation is a node on the canvas. High value for our **trust / provenance** story: you can *see* exactly how AI-ready data was derived.
- **Total flexibility:** drop a free-standing Python/SQL block, build multi-input nodes (a formula across several tables just works), branch one block's output into many.
- Matches the strongest transform precedents (Alteryx, Dataiku, KNIME, Databricks Lakeflow) and our locked "canvas = notebook, every block is a cell" concept.

**Cons**
- **Spaghetti risk.** A real semantic model becomes a dense mesh of nodes + edges — **modeling can get buried under transformation noise**, the opposite of 60/40.
- More wiring / management overhead per transform.
- Heavier UX to get right: edge drawing, multi-input handles, layout, and preview that follows edges.

---

## Product-use-case lens

The choice is really **"model-first vs. transformation-first."**

- Our wedge is *semantics + context, kept trustworthy*, and modeling is primary (60/40) → favors **Option 1's** readable model canvas.
- But "turn *any* data into AI-ready data" includes messy, multi-source, code-heavy prep — exactly where **Option 1 breaks** (no free-standing blocks, no cross-table formula), and where **Option 2's** explicit lineage shines.

Likely long-term answer: **Option 2 as the substrate, with grouping/collapsing** so the model stays legible. But the honest way to decide is to build the simple Option 2 and feel it against real flows.

---

## Precedent

Offering two surfaces is a known pattern, not a hack. **Databricks Lakeflow ships both:** the *Designer* (graph-primary, code hidden) and the *Editor* (code/DAG-primary) — same data, inverted emphasis.

---

## How we'll test it

- Keep **Option 1 exactly as-is** (untouched).
- Build **Option 2 as a separate component** (reusing the docked panel, code editor, mock data).
- Add a **mode switch** so we can show stakeholders both; delete the loser after testing.
- Switching modes resets the canvas — expected, since they're different models, not two views of one model.

**Open question for stakeholders:** does the trust/lineage win of Option 2 outweigh the readability cost for a *modeling*-primary product — or do we keep Option 1 and solve the two gaps (free-standing blocks, cross-table formula) some other way?
