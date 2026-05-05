# Research: Data Browser — definition, scope, and IA

## The question

What is the Data Browser tab? Is it **everything** (raw warehouse tables + dbt models + uploaded files + ThoughtSpot models), or only the **external data** that came in via connections? What do peer tools do, and what's intuitive for analysts?

## Who is affected

Data analyst (primary user). Affects daily discovery — the surface where they find tables, models, and files to start work from. Touches all three demo stories.

---

## Specific questions

**Definition / scope** *(this is the load-bearing question)*
- Is Data Browser **everything** — raw tables + dbt models + uploaded files + ThoughtSpot models?
- Or only **external data** brought in via connections (raw tables + uploaded files)?
- Where do ThoughtSpot models live — same surface, separate Models surface, or both?

**The dbt nuance**
- When a dbt project is imported, dbt models become **draft ThoughtSpot models**. We don't want a wrapper.
- Are imported dbt models visible in Data Browser, only in Models, or both?
- Does Data Browser show the *source* dbt-as-warehouse-view, the *imported* draft model, or both?

**What's in vs. out**
- Filter by connection? By type (table / view / dbt model / file)?
- Search across everything?
- Preview (sample rows, schema)?
- Actions from Data Browser — start a model, add to existing model, open in workspace?

**What's intuitive for users**
- Do analysts expect *"everything in one place"* or *"raw vs modeled separated"*?
- What mental model aligns with how they actually think?

---

## Competitive references to study

- **Hex** (primary — Workspace + Endorsements + Semantic models)
- **Omni** — Shared data model + Workbooks
- **Sigma** — data catalog / browser surface
- **Looker** — Explores
- **dbt Cloud / Snowflake native** — how do they handle "things in warehouse" vs "modeled artifacts"?
- **ThoughtSpot today** — Data tab, Models, what works, what to keep

For each peer, answer: do they show external data? Do they filter? What's the structure?

---

## Options considered
_(fill in after competitive review)_

### Option A — Everything in Data Browser (raw + dbt + models + files)
What it is. Tradeoffs.

### Option B — Only external data in Data Browser; Models is a separate surface
What it is. Tradeoffs.

### Option C — Segmented view inside Data Browser (Raw | Models | Files tabs)
What it is. Tradeoffs.

---

## Decision
_(to fill in)_

---

## What this defers

- The Models surface itself (orthogonal — but the relationship between Data Browser and Models needs to be explicit)
- Search architecture / facets

---

## Explorations needed before building?

Yes — once scope is decided, explore 2–3 Data Browser layouts in `Playground.tsx`.
