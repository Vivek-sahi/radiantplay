# Phase 2: Manage + Iterate — Why this is the bet

**Status:** Strategy memo for leadership review
**Author:** Vivek Sahi
**Date:** 2026-04-25
**Scope:** Data Studio Phase 2 positioning. Not a feature spec. An argument for where to invest and why.

---

## TL;DR

Data Studio's Phase 2 should concede **Build** as a commodity and stake its ground on **Manage + Iterate** — the runtime, governance, and improvement loop for a semantic layer that BI AI agents (starting with Spotter) consume.

- **Build is moving elsewhere.** Analysts are authoring LookML, dbt, Cube, and raw semantic YAML in Claude Code, Cursor, terminals. Agents are increasingly drafting for them (Omni's Modeling Agent, Cube's AI authoring). The DSL battle is lost.
- **Manage is table stakes.** Every serious semantic-layer product will ship versioning, governance, permissions, lineage, staged publishing. Hex's Context Studio is the clearest example. Required, not differentiating.
- **Iterate is undefended.** Nobody has a polished closed loop from agent failure → proposed fix → eval → ship → measure. Hex Context Suggestions is v0. Ramp Research's doc-edit-then-re-run-evals is v0. This is where Data Studio should stake its difference.

The customer proof point: a semantic layer that doesn't continuously improve from production failures *decays*. Even the strongest current table-selection method (Google's Metadata Reasoner, Apr 2026) leaves 17% of KramaBench questions wrong. Closing that 17% is the iterate loop. Nobody has productized it.

**Ask of leadership:** endorse Phase 2 scope centered on Manage + Iterate, Spotter-first, with Build deprioritized to "import and sync, don't author."

---

## Where the space is actually moving

Four shifts, each evidenced by sources archived in `the-diff/bookmarks.md`.

### 1. Agents overtake humans as query consumers

Tristan Handy (dbt founder) argues agent-initiated queries will exceed human-initiated ones within 12 months, with 100× possible within 36 months. Evidence: dbt MCP server call volume is "absolutely exploding." Production agents already live at Meta, OpenAI, and Ramp.

**Design consequence:** the semantic layer must be built for agent consumers, not dashboard authors. The authoring UX, the output format, and the validation patterns all shift.

### 2. Build is commoditizing

- Omni shipped a Modeling Agent that writes every piece of the semantic model autonomously (views, relationships, dimensions, measures, descriptions, governance rules).
- Cube positions itself explicitly as an "agentic analytics platform."
- Claude Code has become the default IDE for analysts writing LookML, dbt, and semantic YAML.
- Atticus Grinder — a heavy Omni practitioner at Gazer — publicly: Omni's semantic-modeling DSL "feels archaic… like Looker modeling from a decade ago." What he wants: "natural-language semantic modeling."

The authoring surface is no longer differentiating. Analysts go to the tool they already live in. Betting on being the best author is a losing bet.

### 3. The "semantic layer" itself is changing shape

The field is converging on a multi-artifact view of what a semantic layer even is:

| Company | Artifacts | Character |
|---|---|---|
| **Meta** | Ingredients + Recipes + Cookbooks | Structured, hierarchical, authored upfront |
| **Hex** | Endorsements + Semantic models + Workspace guides | Layered, mixed-structured-and-unstructured, retrieved on-demand |
| **Ramp** | Per-domain technical docs | Human-authored retrievable files + agent tools (no formal semantic layer) |
| **OpenAI** | 6-layer stack: schema + annotations + Codex-parsed semantics + institutional docs + memory + runtime introspection | Maximal layered engineering |

**Implication:** "semantic layer" in 2026 means more than dimensions + measures. It includes validation rules, mandatory filters, domain guides, query examples, institutional knowledge, and learned memory from corrections. Manage + Iterate have to accommodate all of these, not just metric defs.

### 4. Silent failure is the dominant failure mode

Jamie Davidson (Omni): text-to-SQL's real danger isn't syntax errors — it's plausible-looking wrong answers from missing domain context. Evidence:

- 81.2% of failing queries are schema/semantic errors, not syntax (study of 4,602 failures).
- BIRD-Interact drops GPT-5 to 29% agentic / 14.5% conversational accuracy.
- LiveSQLBench-Large: 30–36%.
- Metadata Reasoner (Google, Apr 2026): 83% F1 on KramaBench — the state of the art — still leaves 17% wrong.

**The takeaway:** agents fail silently. The semantic layer drifts. Without a closed improvement loop, the BI AI agent's accuracy decays over time. The customer doesn't stop trusting Spotter after one failure — they stop when failures repeat and never get fixed.

---

## Defining Manage + Iterate

A first-pass definition. Anchored by two reference architectures we can study directly.

### Reference 1: Omni's architecture

Omni positions the **Shared data model** as the central artifact. Four consumption surfaces (Point/click, Excel, SQL, AI) read through Workbooks, which in turn draw from the Shared data model. The warehouse (+ dbt) feeds the Shared data model as raw.

What's notable: two-way flow. Workbooks aren't just consumers — they're experimentation surfaces where local analyses get *promoted back* to the Shared data model via a Git-like workflow. The management layer captures which experiments graduate.

*Use for: Manage plane inspiration — single canonical model, multiple consumption surfaces, governed promotion.*

### Reference 2: Hex's Context Studio

Four consumption surfaces (Threads, Notebook, Slack/MCP, CLI) share one **Agent harness** (Core agent loop + Subagents + Agent tools). The harness reads from **Workspace context** (Endorsements, Warehouse metadata, Guides, Semantic models, Data apps/Notebooks).

**Context Studio itself observes agent behavior:** Historical Threads → Review Agent → Suggestions to update context. In parallel: Topic modeling, Feature extraction (summaries, warnings, lineage), Threads observability.

What's notable: this is the most explicit iterate loop shipped by any peer today. Historical threads feed a review agent that proposes context updates. That IS the pattern.

*Use for: Iterate loop inspiration — capture → review → propose → update.*

### Working definition — Manage

The runtime plane for a semantic layer authored anywhere. Surfaces needed:

| Surface | What it does |
|---|---|
| **Ingest** | Read semantic layer definitions from where they live: dbt, LookML, Cube YAML, API push, direct UI edit, agent-authored. Support multi-source models. |
| **Version** | Every change is a diff. History is queryable. Rollback is one click. |
| **Preview** | Stage changes and see how they'd affect real agent queries before publishing. (Hex's Context Workbench.) |
| **Publish** | One model, multiple downstream consumers (Spotter first, any agent second). Deterministic. |
| **Govern** | Permissions, approvals, lineage, audit. |
| **Observe** | Which queries ran. Which failed. Which definitions are stale. Which are most-used. |

### Working definition — Iterate

The improvement loop from production signal to shipped fix.

| Step | What it does |
|---|---|
| **Capture** | Every agent query, failure, correction, user pushback becomes structured signal. |
| **Analyze** | A review agent clusters failures, identifies patterns, extracts candidate fixes (missing synonym, ambiguous dimension, wrong join, stale description). |
| **Propose** | Concrete patches surface for analyst review. Not "here's the problem" — "here's the fix." |
| **Evaluate** | Before a fix ships, run it against an eval set (Ramp's pattern). Does it improve the failing case without regressing adjacent cases? |
| **Ship** | Approved fixes go through the Manage tier's staged publish. |
| **Measure** | Accuracy trend, mean time to fix, production failure rate. |

The two are tightly coupled: Iterate produces changes that flow into Manage's publish plane. Manage produces the observability that feeds Iterate. Neither works alone.

---

## Differentiation — where Data Studio wins

### What peers are doing well

| Peer | Strength |
|---|---|
| **Hex Context Studio** | Strongest observability + review-agent pattern. Historical Threads → Review Agent → Suggestions is the most mature iterate loop in market. Multi-artifact Workspace context is the most complete Manage layer. |
| **Omni Shared Data Model** | Strongest workbook-promote-to-shared workflow. Clean Git-like semantics between experimentation and canonical. |
| **Meta Ingredients/Recipes** | Strongest structured authoring of domain knowledge at regulated enterprise scale. |
| **Ramp Research** | Strongest eval-driven improvement loop (context edits + stepwise evals, measured per-concept). |
| **Omni Modeling Agent** | Strongest autonomous build flow. |

### What nobody is doing well

1. **End-to-end Iterate exposed as a product surface.** Hex has the pieces. Ramp has the evals. Nobody has stitched `failure → proposed fix → eval → ship → measure` into one UX that an analyst uses day-to-day.
2. **Cross-team governance for shared semantic layers.** Meta scales internally because it's one company. At enterprise (JPM-scale), each business unit has its own model, and reconciling/sharing across them is open work.
3. **Agent-agnostic publishing.** Every peer assumes their model powers their own agents. None has a clean "publish to any downstream agent" story. Data Studio will plug into Spotter today, Slack bots tomorrow, embedded analytics next.
4. **Honest observability for semantic-layer quality.** What % of agent queries got a correct, verifiable answer this week? What's the trend? What's the mean time to fix a silent failure? No product answers this today.

### Where Data Studio's bet lands

Stake the ground on:
- **Iterate as a first-class product surface** — the closed loop from production signal to shipped improvement, exposed to the analyst as real UX, not an admin log.
- **Manage as agent-agnostic runtime** — one semantic layer, many downstream consumers.
- **Build as import, not authoring** — accept models from anywhere (dbt, LookML, Cube, agents). Don't try to be the best author; be the best place to manage and iterate on whatever gets authored.

---

## Why this matters for Spotter specifically

Phase 2 is Spotter-first. Three reasons the iterate loop is load-bearing for Spotter's value prop:

1. **Spotter's correctness is bounded by the semantic layer's quality.** The Metadata Reasoner paper shows 14.9 points of execution-accuracy gain in Gemini-3-Pro just from better table selection (56% → 71%). If Spotter's semantic layer is stale or wrong, Spotter silently answers wrong. If the layer continuously improves from failures, Spotter gets better *without* model upgrades.

2. **Without an iterate loop, semantic-layer drift is invisible.** Data changes. Business terms evolve. New columns arrive; old ones deprecate. Without capture + review, the layer and the data diverge. Spotter keeps answering against stale definitions, and no one sees it.

3. **Customer trust compounds or decays from here.** Sara at JPM Wealth Management doesn't stop trusting Spotter because it fails once — she stops when failures repeat and never get fixed. The iterate loop is the mechanism that converts failures into trust, one correction at a time.

---

## Metrics for Phase 2 success

Five load-bearing metrics, scoped to a real Spotter deployment (e.g., one JPM-scale customer pod).

| # | Metric | Definition | Target |
|---|---|---|---|
| 1 | **Silent failure rate** | % of Spotter queries the user didn't accept (correction, re-ask, abandon) | Measurable, trending down MoM |
| 2 | **Mean time to fix** | From Spotter failure → proposed fix → eval passed → shipped | <48h for structural fixes (synonyms, descriptions); <1 week for semantic (new metric/dimension) |
| 3 | **Context growth rate** | New synonyms / descriptions / filters / rules added via iterate loop per week | Non-zero and trending up for first 90 days |
| 4 | **Eval coverage** | % of business-critical questions covered by a regression eval | 50% at 90 days, 80% at 180 days |
| 5 | **Answer accuracy trend** | Measured against eval harness weekly | Non-decreasing (zero regression), ideally improving |

These metrics do double duty: they justify Phase 2 investment to leadership, and they're the KPIs we'd hold ourselves to post-launch.

---

## What this means for the demo and the 6 situations

The current 6 situations (build → test → coach → expand → cache → monitor) were framed for a world where **Build** was central. Under the Manage + Iterate thesis, the arc shifts:

| Current situation | Phase 2 treatment |
|---|---|
| **S1: Build from scratch** | *Demoted.* Replace with: "Onboard an existing model — connect to dbt/LookML/Cube, see your layer in Data Studio." Build is an ingest event. |
| **S2: Test it** | *Kept.* Still important as the surface where failures originate. |
| **S3: Teach and fix (coach)** | *Elevated to core demo.* This IS iterate: Spotter fails → Data Studio surfaces failure + proposed fix → analyst approves → eval passes → ships. |
| **S4: Expand the model** | *Kept, lighter.* Adding a metric is an authoring event that flows through the same Manage pipeline. |
| **S5: Cache** | *Kept, reframed.* Part of Manage — cache config is a governable model property. |
| **S6: Monitor and fix** | *Elevated.* Observability is the Manage layer's most visible surface. |

This is a meaningful narrative shift. Leadership should see it as **"Phase 2 refocuses on the harder, more defensible problem."** The current build-centric arc shows polish; the new arc shows product strategy.

---

## What's NOT in scope for Phase 2

Worth making explicit so the ask is tight:

- **Not building new Build surfaces.** Ingest from existing authoring tools. Don't invest in visual modelers, DSL editors, AI authoring. Ship "connect to dbt/LookML/Cube" and stop.
- **Not building our own warehouse.** Read from whatever warehouse/lakehouse the customer has.
- **Not supporting non-Spotter agents at GA.** Design agent-agnostic; ship Spotter-only. Generalize when a second real consumer shows up.
- **Not replacing regulatory reporting.** Ad-hoc and exploratory analysis first. Regulated flows untouched.
- **Not solving cross-team federation at v1.** One semantic layer per business unit; cross-BU linking is v2.

---

## Decisions needed from leadership

1. **Endorse the Manage + Iterate focus** — or push back with specific concerns. If Build should remain core, we need to know before scope lock.
2. **Spotter-first, agent-agnostic by design.** Ship Spotter-only v1, or insist on the abstraction from day 1? Argues for the abstraction; costs ~20% more engineering.
3. **Eval infrastructure dependency.** The iterate loop requires an eval harness. Does Spotter's team own that, or does Data Studio build one?
4. **Research headcount.** Iterate is research-heavy. Are we funded to build review-agent + eval-generation pipelines, or does that sit on model/infra teams?

---

## Open questions (for the Data Studio team, not leadership)

- What does the review agent actually propose? Free-form text? Structured patches? Diff-style edits? (Probably structured patches + human-readable rationale, per OpenAI's memory UX.)
- How do we handle proposed fixes that require a warehouse change (column doesn't exist yet)?
- Cross-layer fixes: what if the right fix is "add a new dimension table"? In scope for Data Studio or a different product?
- Multi-tenancy: one model per BU, or shared cross-BU? (JPM analysis suggests per-BU with cross-BU linking as v2.)
- Eval ownership: who writes the golden set? Analysts? Product? Spotter team?

---

## Appendix: source evidence

All primary sources archived in `/Users/vivek.sahi/the-diff/bookmarks.md`.

| # | Source | Load-bearing for |
|---|---|---|
| 1 | Tristan Handy, "Five things I believe about the future of analytics" | Agent-initiated queries thesis; strategic framing |
| 2 | Omni, "Why text-to-SQL fails" | Silent failure, schema/semantic error dominance |
| 3 | Omni, "Announcing Omni's Modeling Agent" | Build commoditizing |
| 4 | Hex, "Introducing Context Studio" | Manage + Iterate reference architecture |
| 5 | Hex, "Introducing Context Suggestions" | Iterate loop v0 in market |
| 6 | Meta, "Inside Meta's Home Grown AI Analytics Agent" | Structured context model, validation patterns |
| 7 | Ramp, "Meet Ramp Research" | Doc-based context + stepwise evals + improvement loop |
| 8 | OpenAI, "Inside OpenAI's in-house data agent" | 6-layer context stack, memory UX, eval-as-unit-tests |
| 9 | Google / arXiv, "An Agentic Approach to Metadata Reasoning" (2604.20144) | Table selection as measurable problem; 17% residual as iterate opportunity |
| 10 | Atticus Grinder on Omni (LinkedIn) | Field critique: DSL is dead, NL modeling is the ask |

**Reference architecture diagrams** (from the sources above, shared with this memo):
- Omni architecture: warehouse → shared data model → workbooks (4 consumption surfaces), with promote-to-shared loop
- Hex Context Studio: agent harness + workspace context + context studio (historical threads → review agent → suggestions)
