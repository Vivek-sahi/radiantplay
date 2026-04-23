# Data Studio — Product Brain

_What this product is, who it's for, and the design direction. Read this alongside CLAUDE.md (session rules) and CONTEXT.md (build state)._

---

## What Data Studio is

Data Studio is ThoughtSpot's unified workspace for making warehouse data AI-ready for Spotter (ThoughtSpot's BI agent). It is a **product vertical** — not a single feature, but a suite of capabilities centered on the data modeling + prep + caching lifecycle.

The problem it solves: analysts have raw warehouse data, but Spotter needs that data to be semantically enriched and structurally clean to answer business questions well. Today that work is fragmented across tools. Data Studio brings it into one place.

**Core workflow:** Connect → Build → Test → Coach → Prep → Cache → Monitor

---

## Where we are

**Phase 1 (now):** Building the vision demo — an agentic experience that shows stakeholders what Data Studio should feel like. One real AI moment per situation, the rest scripted. Goal: make SVP/VP Product believe this is the right product to build.

**Phase 2 (next few weeks):** Shifting into UI exploration — visual design iterations, multiple canvas layouts, component-level decisions. The prototype becomes a design tool, not just a demo.

---

## Audience

| Person | Role | What they care about |
|--------|------|---------------------|
| SVP Product | Decision-maker | Is this the right bet? Does it unify the story? |
| VP Product | Sponsor | Does this accelerate Spotter adoption? |
| Directors (data modeling, data prep) | Validators | Is the workflow real? Would my team use this? |

---

## The 6 demo situations

| # | Situation | Core moment | Status |
|---|-----------|-------------|--------|
| 1 | Zero to one — build a model from scratch | Agent assembles joins + columns from a vague brief | Built |
| 2 | Test it — ask questions, find where Spotter struggles | One-shot answer + 3-dimension diagnostic | Built |
| 3 | Teach and fix — coach the model based on test results | Agent applies coaching, no approval needed | Built |
| 4 | Expand the model — add a table or metric | Add metric built; add new table not yet | Partial |
| 5 | Cache it — pull data to ThoughtSpot, set refresh | Cache tab + cost story | Built |
| 6 | Monitor and fix — surface a change, route to fix | Alert → model view with pre-focused fix | Built |

---

## Design principles

**Agentic, not wizard-like.** The agent assumes and proceeds. It states assumptions inline. It doesn't stop to ask about preferences — it bets and proceeds, and the user can redirect.

**One real moment per situation.** The surprise should be real — actual Claude inference, not faked. Everything else can be scripted. The magic is in the contrast between routine and unexpected.

**The workspace doesn't lock.** Publishing doesn't make the model read-only. Monitoring alerts navigate back into the workspace pre-focused on the problem. There is no separate "published view."

**Data quality is ambient, not a gate.** Issues surface in ColumnsView per column. No banners, no blocking gates. The user decides when to fix, not the system.

**Prep and caching are orthogonal.** Prep = query-time SQL transforms embedded in the model. Cache = performance optimization. They're independent decisions. Demo shows prep on live data; caching is a later optional step.

---

## Key product decisions (locked)

- No auto-profiling on build — `nullRate`, `duplicateCount`, `anomalyCount` already visible in ColumnsView by default
- Transforms in LeftPanel "Transformations" section (separate from Formulas)
- Coaching applies directly, no approval step — agent applies, shows summary, user edits inline
- "Skip and test" path shows raw data quality warnings in test diagnostics
- WorkflowDirectory is cosmetic for now — do not wire unless explicitly asked

---

## Research library

Complex design decisions are researched before building. Each doc covers tools/prior art, the decision made, and why.

| Doc | Topic |
|-----|-------|
| `research/data-prep-workflow.md` | How analysts do data prep today; led to the query-time transforms decision |
| `research/agent-work-display.md` | How to show agent work in progress |
| `research/canvas-agent-interaction.md` | Agent panel interaction patterns |
| `research/column-properties.md` | Column-level metadata and property views |
| `research/publish-share-ux.md` | Publish and share flows |
| `research/semantic-model-views.md` | Model view IA |
| `research/semantic-model-import-sync.md` | dbt import and sync patterns |
| `research/fk-column-deduplication.md` | FK column handling in joins |

---

## What's coming next

- **Test diagnostic variation** — when `prepTransforms` is set, Data quality dim shows "N transforms active" instead of raw issue
- **UI explorations** — canvas layout iterations, 2nd/3rd workspace concepts (see CONTEXT.md "Later" section)
- **Situation 4 completion** — add new table to a working model
