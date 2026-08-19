# Data Studio — positioning & problem
_Working draft for alignment · 2026-06-29_

We've worked on Data Studio for a while. Before we argue features, we need to agree on the problem and the bet. If we don't, every feature debate starts from zero and we never ship. This doc is the problem, the bet, and what we'd build.
## The problem
Spotter is only as good as the data behind it. But getting data Spotter-ready — cleaned, joined, semantically rich, trustworthy — is slow, manual, and spread across tools. Two things break:

- **Time to value** — it takes **[X weeks — our number]** to go from buying ThoughtSpot to a model live in Spotter, because data isn't prepared and modeling is manual.
  
- **Trust** — even once live, customers can't tell if Spotter answers right, and accuracy decays silently (**~90% → ~60% in a month**, Anthropic [pin source]).
  

Net: ThoughtSpot gets bought but under-adopted, and a wrong answer erodes trust in the whole platform.
## The bet
> **Our bet:** In the agent era, the data AI reads _is_ the product — and trustworthy data isn't something you generate once; it's a living loop you prove and re-prove against real use. Because we own both where data is _built_ (Data Studio) and where it's _consumed_ (Spotter), we can close that loop — and keep AI accurate as it inevitably drifts. **That loop is the moat, and almost no one is building for decay.**

**Data Studio is ThoughtSpot's product for the data team** — the people who model data, prep data, and keep it healthy. Not the business users who consume answers (capabilities also reach them indirectly, through SpotterX, but they're not the primary users). Data Studio turns any messy data into AI-ready data — the **semantics and context** AI needs to answer trustworthily — and keeps it that way.

Each problem hands off to a value prop. **We win on the two core props (semantics & context, and trust); works-with-your-stack is table-stakes, cost emerges.**

| Value prop | Problem | What customers say | Comments |
| --- | --- | --- | --- |
| **Works with your stack** · table-stakes | Data's scattered — can't get it all in (no access, one connection, dbt models drift). | "Can't connect the data I need — no access, capped at one connection."  <br>"My dbt models drift out of sync." | More customers author semantic models outside ThoughtSpot [data: % of base]; if we can't plug in, we're a non-starter. |
| **Build the semantics & context AI needs** · core | Once in, making it AI-usable — clean, joined, meaningful — is slow and manual; no sense of what "AI-ready" means. | "My data's messy, can't clean or transform here."  <br>"Can't preview what I'm working with."  <br>"Building's slow and clicky, the agent won't let me drive."  <br>"Don't know what makes data 'ready' for AI." | As agents, not dashboards, carry the insight, AI-readiness is the chase — and AI-ready means semantics + context. |
| **Prove it & keep it trustworthy** · core | Even when built, can't tell if Spotter answers right — and it decays after go-live. | "Can't test whether Spotter answers right before I publish."  <br>"Spotter's wrong and I can't tell why, or fix it."  <br>"Once live, no way to know it's drifting." | Agents drive decisions off these models; accuracy decays unwatched (90→60); drift no one catches is a liability. |
| **Optimize cost** · emerging | Running it — queries + AI — gets expensive, with no control. | "Query and AI costs keep climbing and I can't control them." | AI spend can spike; already a concern, growing as agentic workloads multiply queries. |
## Why we win
We've the best loop between end user experience and data teams. Today's winners are not the perfect dashboarding tools or AI agents but platforms that can ensure AI agents remain accurate and don't decay.
## Outcomes
The yardstick per pillar.

- Get started fast. → _Time to first model._
  
- Messy data becomes an AI-ready model fast. → Data _sources connected_
  
- _Spotter accuracy over time_
  
- transparency into cost, and the ability to cut it on demand. → _cost visibility; % spend reduced._
  
## Use cases
Organized by pillar; each is a flow off its value prop. P2–P4 are one continuous story — the **Customer Health** model built (P2), proven and kept trustworthy (P3), then optimized for cost (P4). The end-to-end Loom walk is that single path.
### P1 · Works with your stack
- **Warehouse:** select a CDW · filter schemas · browse catalog · sync · schedule refresh
  
- **Apps:** connect an external app · select table · preview
  
- **Semantic models:** connect the platform (dbt) · bring & enrich a model · maintain sync
  
- **Files:** upload · select destination (Connection / SpotStore / agent DB) · preview · save to agent DB
  
- **Cross-cutting:** preview (almost everything) · manage connections (edit / refresh / disconnect) · authenticate & manage access · multiple connections · write-back
  

_Seams: "agent DB" destination → P4 (caching); "preview" → P2._
### P2 · Build the semantics & context AI needs
Worked example — the **Customer Health** model. Sources: 4 Snowflake tables (`DIM_ACCOUNTS`, `SUPPORT_CASES`, `CALL_METRICS`, `CUSTOMER_FOUND_DEFECTS`) + Pendo NPS (Python block) + a `csm_account_mapping` CSV. _(Add/preview = P1; test/publish = P3 — shown for continuity.)_

1. **Add + preview** the 4 CDW tables (clean), `pendo_nps_enriched` (Python block: pull NPS + run sentiment), and the CSV. → P1
  
2. **Transform the messy ones** (CDW is clean; Pendo + CSV aren't):
  

- Pendo: dedup to latest per account · cast `nps_score` → int · standardize `response_date` · flag null sentiment
  
- CSV: normalize `account_id` to match CDW · trim · dedup · fill missing `segment` = "Unknown"
  
- Preview before/after each → accept.
  

3. **Join** off `DIM_ACCOUNTS`: ⟕ CSV (1:1) · ⟕ Pendo (1:1, ~24% coverage → nulls flagged) · ⟕ `SUPPORT_CASES` / `CALL_METRICS` / `CUSTOMER_FOUND_DEFECTS` (1:many → aggregate to `open_p1_cases`, `avg_handle_time`, `open_defects`). Set cardinality / type / key → **validate** (coverage, fan-out, row delta) → **select columns** for the model.
  
4. **Add the health-score formula** (weighted: support load + NPS + defects + usage) → preview scores. _Now it's a model — but just data._
  
5. **Enrich for AI:** agent drafts descriptions + synonyms per column → review / accept; set business logic + relationships → the context graph.
  
6. **→ P3:** test in Spotter → some answers wrong (tier shadowing; NPS-coverage skew) → feedback / fix → iterate → publish.
  

_Three ways throughout: agent (review its diffs) · manual on canvas · Python block · spreadsheet-style edits in preview._
### P3 · Prove & keep trustworthy
Continuing the **Customer Health** model from P2 — built, but unproven. This is the loop Tableau and Looker don't have. _(Add/preview/build = P1+P2; everything here is P3.)_

1. **Test before publish** — ask Spotter real questions against the _draft_ model: "health score for Acme?" · "which enterprise accounts are at risk?" · "why is Globex red?" Two answers come back wrong — the `account_tier` **shadowing** and **NPS-coverage skew** flagged at build (P2 steps 3, 6) surface as actual bad answers. Test mode shows _what the agent read_ to get there.
  
2. **Diagnose & coach** — for each miss, see the agent's reasoning: `account_tier` resolved to the wrong source; the score skews where NPS coverage is thin (~24%). Fix at the source — disambiguate the tier column, tell the agent to caveat low-coverage accounts — as **accept/reject diffs** on the model's semantics + context. Re-test → answers right.
  
3. **Publish & certify** — promote draft → **certified**: a trusted source of truth business users can rely on in Spotter. _(Who can certify · draft-vs-certified rules — [open].)_
  
4. **Monitor (Pulse)** — post-publish, watch **accuracy · freshness · drift · usage**. Three weeks in, an alert fires: health-score answers are degrading — the silent **90→60** decay, finally made visible.
  
5. **Debug** — the diagnostic [3 dimensions — TBD: data / join / context / formula] points to the root cause: `resolution_time_hours` started landing **null at scale**, quietly breaking the support-load term of the score. Not a model bug — a data-drift bug only the loop catches.
  
6. **Improve** — the agent proposes a fix (null-handling on the support-load term + a freshness check) → review the diff → accept → re-test → re-publish certified. Accuracy recovers.
  

_The thread: P2 built it, P3 proved it and kept it alive._ **_This is the trust pillar — the wedge._**
### P4 · Optimize cost
Same **Customer Health** model — now published, certified, and heavily used by CSMs and execs. Adoption is the problem: every Spotter question is a warehouse query **plus** agent inference, and both bills climb. _(Caching reuses the "agent DB" destination from P1.)_

1. **See the spend** — a cost view splits this model's **query/compute cost** (warehouse) from its **AI inference cost** (agent calls per question), trended over time. Both rising with usage.
  
2. **Cut query cost — cache it** — the model is queried constantly but the data only refreshes daily. Cache it to the **agent DB**; repeated Spotter questions hit cache, not the warehouse. Set freshness to match the data (daily) — the live-vs-cached control. Compute cost drops. _(What auto-caches · freshness-vs-cost default — [open].)_
  
3. **Cut AI cost** — see which questions / agents drive inference spend; cache common answers, cap agent spend per workload. _(Attribution + caps — [open].)_
  
4. **Outcome** — cost is visible and controllable; the model stays fast and cheap as it scales. → _cost visibility · % spend reduced._
  

_Emerging, not core — but it's the bill that grows fastest as agentic usage multiplies queries._
## Feature modules
**Build order: P2 + P3 first (the wedge), then P1 (table-stakes), then P4 (emerging).**

_Per module: today → change · status · pain it kills · open questions. Status =_ **_New_** _(doesn't exist) ·_ **_Change_** _(exists in ThoughtSpot, modify it) ·_ **_Port_** _(exists in another TS product — e.g. Analyst Studio — bring it in)._
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
| Custom columns & formulas | → add derived/calculated columns and business formulas | Change | "Can't add my own business logic" | —   |
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
## Risks — what could kill us
1. **Agents invent context on the fly** — get good enough that a curated context layer isn't needed. _External; not in our hands. Already emerging._
  
2. **Warehouses absorb the layer** — CDWs let customers build semantic views and pull the AI in. _External; not in our hands. Already emerging — and the reason "why we win" has to hold._
  
3. **PMF gap** — BI-tool buyers whose goals don't match the ThoughtSpot product. **This one's ours to fix** — better product-market fit is the lever.
