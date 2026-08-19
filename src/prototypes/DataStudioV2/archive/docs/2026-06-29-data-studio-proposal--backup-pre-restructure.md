# Data Studio — positioning & problem
_Working draft for alignment · 2026-06-29_

We've worked on Data Studio for a while. Before we argue features, we need to agree on the problem and the position. If we don't, every feature debate starts from zero and we never ship. This doc is the problem and the position. Outcomes follow.
## The problem
Customers buy ThoughtSpot and stall before they get value. The gap is the work between raw data and an answer they can trust Spotter to give — and today that work is scattered, manual, and unproven.

The market just caught up. Gartner, March 2026: "the model is table stakes; context is the moat." Agentic BI breaks without a governed semantic layer — ask the same question twice, get two answers. ThoughtSpot is already betting here (Spotter Semantics, Open Semantic Interchange). Data Studio is where that context gets built and kept honest.
## Positioning
**Data Studio is ThoughtSpot's product for the data team** — the people who build models, prep data, and keep it healthy. Not the business users who consume answers. (Its capabilities also reach those users indirectly, through SpotterX, when SpotterX calls for them.)

It's the one place to turn any data into AI-ready data — the **semantics and context** AI needs to answer trustworthily — and keep it that way.
## Pillars
**1 · Works with your stack.** Connect any source. Plug in the semantic models you already have, or build them here — on your warehouse, on the open standard. _Why it matters:_ more customers now author semantic models outside ThoughtSpot — [data: % of our base]. If we can't plug into them, we're a non-starter.

**2 · Build the semantics and context AI needs.** Turn messy data into governed meaning and context — relationships, synonyms, lineage — that agents read to get answers right. Build it by hand, with the agent, or in code. This is the core. _Why it matters:_ as agents — not dashboards — deliver more of the insight, AI-readiness is what customers chase. And AI-ready means semantics and context.

**3 · Prove it, and keep it trustworthy.** Test before release. Certify what's trusted. Monitor for drift, debug when it's wrong, improve over time — with the agent watching and flagging what to fix. _Why it matters:_ accuracy decays when no one's watching — Anthropic's research on their data agent saw answers fall from ~90% to ~60% in a month [pin source]. Agents drive decisions off these models, so drift no one catches is a liability.

**4 · Optimize cost across BI and AI.** Control what runs live and what's cached. Cut query and inference spend. _Why it matters:_ AI spend can spike suddenly — already a concern, and growing as agentic workloads multiply queries.
## Customer problems — and where each lands
What we hear. Each maps to a pillar; anything that doesn't is a flag — a missing pillar, or a problem to drop. Today it all maps.

- "I can't connect the data I need — no access, and I'm capped at one connection." → **P1**
  
- "I built my models in dbt; they drift out of sync with ThoughtSpot." → **P1**
  
- "My data's messy and I can't clean or transform it here." → **P2**
  
- "I can't even preview what I'm working with." → **P2**
  
- "Building a model is slow and clicky, and the agent won't let me drive." → **P2**
  
- "I don't know what makes data 'ready' for AI." → **P2**
  
- "I can't test whether Spotter will answer right before I publish." → **P3**
  
- "Spotter gave a wrong answer and I can't tell why, or fix it." → **P3**
  
- "Once it's live, I have no way to know it's drifting." → **P3**
  
- "My query and AI costs keep climbing and I can't see or control them." → **P4**
  
## Outcomes
The yardstick per pillar.

- **P1 · Works with your stack** — customers who already have models (dbt, etc.) get started fast. → _time to first model._
  
- **P2 · Semantics & context** — messy data becomes an AI-ready model fast. → _time to first model._
  
- **P3 · Prove & keep trustworthy** — (1) confidence the model will answer accurately before release; (2) that accuracy holds over time. → _pre-release confidence; no accuracy decay (the 90→60 problem)._
  
- **P4 · Optimize cost** — transparency into cost, and the ability to optimize and cut it on demand. → _cost visibility; % spend reduced._
  
## Feature modules
_Per module: today → change · status · pain it kills · open questions.Status =_ **_New_** _(doesn't exist) ·_ **_Change_** _(exists in ThoughtSpot, modify it) ·_ **_Port_** _(exists in another TS product — e.g. Analyst Studio — bring it in). (In the final doc these sit after the use-case journeys.)_
### P1 · Works with your stack
| Module | Today's status | Change | Pain it kills | Open question |
| --- | --- | --- | --- | --- |
| Warehouse connections | Coupled to specific tables/columns → loose connection + schema filtering | Change | "Can't connect the data I need" | Does this also lift the single-connection limit? |
| Semantic integration | One-way → two-way (bidirectional) sync with external layers (dbt); edits flow back | Change | "My dbt models drift out of sync" | Conflict resolution (dbt vs. TS)? which standard (OSI)? |
| Third-party app data | None → notebook connector pulls from any app (Mixpanel, Pendo, Google) via Python + credentials | New | "Can't bring my other data" | Credential + code-execution governance? |
| Spreadsheets (Sheets / Excel) | Separate analyst tool → brought into ThoughtSpot | Port (Analyst Studio) | "I work in sheets and can't bring it in" | Live sync or one-time import? |
| Write-back | Gap → persist tables created/prepped here back to warehouse / Spotstore | New | New tables & prep don't persist | Write to warehouse or Spotstore? who publishes? |
### P2 · Build the semantics & context AI needs

| Module | Today's status | Change | Pain it kills | Open question |
| --- | --- | --- | --- | --- |
| Preview tables | Limited → sample + profile (nulls, types, distributions) at every step: source, after prep, after join | Change | "Can't preview what I'm working with" | Per-node at every step, or source-only? |
| Prep & transform | No real in-product prep → clean (nulls, anomalies, types) + reshape (filter, derive, aggregate); agent flags issues | New | "Data's messy, can't clean or transform here" | Last-mile only, or full transforms vs. push to dbt? |
| Join tables | Manual, clicky joins → join visually, with the agent, or in code; relationships + cardinality | Change | "Building is slow and clicky, agent won't let me drive" | Canvas-primary or split-with-code? unit of accept/reject? |
| Custom columns & formulas | → add derived/calculated columns and business formulas | Change | "Can't add my own business logic" | — |
| Semantics & context | Manual AI context → governed semantics (descriptions, synonyms, metrics) + context (lineage, relationships) agents read; agent drafts, human curates | Change | "I don't know what makes data 'ready' for AI" | How much agent-auto vs. human-authored? Context Graph scope? |

### P3 · Prove & keep trustworthy

| Module | Today's status | Change | Pain it kills | Open question |
| --- | --- | --- | --- | --- |
| Test before release | None → ask Spotter questions and see if it answers right before publishing (Test mode + coaching) | New (prototyped) | "Can't test before I publish to Spotter" | Test set: agent-generated, user, or golden Q&A? |
| Publish & certify | Publish exists → add certify / draft states; promote to a trusted source of truth | Change | Shipping unproven models; no certified truth | Who can certify? draft vs. certified rules? |
| Monitor (Pulse) | None → watch accuracy, drift, freshness post-publish; alert on degradation | New (prototyped) | "Once live, no way to know it's drifting" | Which signals + thresholds (accuracy / freshness / usage)? |
| Debug | None → diagnose why Spotter is wrong (3-dimension diagnostic) | New (prototyped) | "Spotter's wrong and I can't tell why or fix it" | What are the 3 dimensions (data / join / context / formula)? |
| Improve | None → agent proactively suggests fixes; coaching raises accuracy over time | New (prototyped) | "Can't improve results" | Agent auto-applies or suggests? re-enters accept/reject + publish? |

### P4 · Optimize cost

| Module | Today's status | Change | Pain it kills | Open question |
| --- | --- | --- | --- | --- |
| Query cost | Little visibility/control → see query/compute cost; control live-vs-cached (caching) | Change | "Query costs keep climbing" | Cache freshness vs. cost tradeoff; what auto-caches? |
| AI running cost | Opaque, can spike → see and optimize agent / LLM inference spend | New | "AI costs keep climbing" | How to attribute and cap agent spend? |
## Scope — what we own, what we connect to
We own the trust layer: model → test → publish → monitor → debug → optimize. We don't rebuild the warehouse or dbt. We sit on top and make their output trustworthy for Spotter.
