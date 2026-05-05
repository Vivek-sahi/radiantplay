# Research: dbt integration — the short flow

## The question

How do peer platforms integrate dbt, and what's the shortest viable flow from "I have a dbt project" to "I have a usable model in ThoughtSpot"?

## Who is affected

Data analyst with an existing dbt project. Story 3 (Day N — "Using ThoughtSpot for plug-and-play models / ecosystem"). The pre-existing dbt investment is the entry point.

---

## Specific questions

**How peers handle dbt integration**
- When dbt is integrated, do dbt models become **models in their platform**?
- Are they made available to end users immediately, or kept in a "raw" state?
- Do they translate the dbt definitions into their own format?
- Do they disconnect from the source dbt models, or maintain a live link?
- When are users asked to fix issues? What kind of issues?
- What happens on the data side — caching, re-runs, sync schedule?

**The short flow shape for ThoughtSpot**
- Import → review → publish (with issues warning), or save as draft
- dbt models become draft ThoughtSpot models on import (no wrapper layer)
- The "issues" warning at publish: what does it surface? (chasm traps, RLS gaps, missing descriptions, broken metric defs?)
- The AI-fix interaction — inline in the publish gate, or a separate flow?
- What's the publish gate? What can a user override vs not?

**Status / lineage**
- After import, does the user see the dbt model as the source?
- When dbt-side changes happen, how is that surfaced?

---

## Competitive references to study

- **Hex** (Context Studio — how dbt artifacts flow in)
- **Omni** (dbt sync, Modeling Agent — most relevant comparator)
- **Sigma** — dbt integration if any
- **Cube** — semantic layer ingest patterns
- **dbt Cloud / Semantic Layer** — native consumption pattern
- **ThoughtSpot today** — V2's `import_dbt` script behavior, what it does and doesn't do

---

## Options considered
_(fill in after competitive review)_

### Option A — Maximum auto-publish (one click, post-publish warnings)
### Option B — Issues warning gate before publish, AI-fix loop, then publish
### Option C — Always import as draft; user manually publishes when ready

---

## Decision
_(to fill in)_

---

## What this defers

- The dbt-side authentication and warehouse-pick step (covered in `connections-tab.md`)
- Ongoing sync mechanics (out of scope for short-flow research)
- Catalog / lineage UI

---

## Explorations needed before building?

Yes — once flow shape is decided, explore the issues warning UI + AI-fix interaction in `Playground.tsx`.
