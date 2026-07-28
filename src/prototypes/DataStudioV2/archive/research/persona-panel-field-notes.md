# Data Studio — Persona Panel Field Notes
_A simulated user-research readout across 10 data personas and 8 incumbents_

**Researcher:** Claude (simulating a lead user researcher), 2026-04-24
**Prototype reviewed:** DataStudioV2 at `prototype/data-studio`, through session 46. SCRIPT.md, product.md, users.md, platform.md, patterns.md, CONTEXT.md.
**Mode:** Document + code review, not live click-through. Where the prototype is scripted, I flag the seam honestly.

> **Honesty disclaimer, up front.** This is a *simulation* of user research. I am not pretending these quotes came from real sessions. What I can do well: ground each persona in the actual tools and day-to-day work of their role at companies I know, then project how someone in that seat reacts to the Sara story and the 6 situations. What I cannot do: replace a real research loop. Treat the contrasts as hypothesis-generating, not hypothesis-confirming.

---

## 0. TL;DR — seven takeaways

1. **The opening build (Situation 1) is the strongest moment in the deck.** Every persona — even the skeptical ones — reacted to "25 seconds from brief to model." This is your wedge.
2. **Testing + coaching (2 + 3) is the second AHA, and arguably the durable one.** "One issue = scan the whole class" is a stronger selling pattern than the one-shot build, because it compounds over time. Don't let it get overshadowed.
3. **Monitor (6) is the sleeper win for enterprise.** The personas who yawned at caching lit up at schema-drift-as-an-alert-that-routes-you-back. This is the feature that turns a BI tool into data platform.
4. **Caching (5) is the weakest moment of the six.** Not because it isn't useful — because it conflicts with Snowflake/Databricks primitives, and because "$340/mo" is too small a number for the scale of buyer who'd see this demo. It needs a different framing: latency + governance, not cost.
5. **The dbt question keeps surfacing.** Analytics engineers at every scale asked variants of *"Does this replace dbt, sync from dbt, or extend dbt?"* The prototype has a real answer (sync one-way, add BI enrichment on top) — but the demo doesn't show it. Situation 1 starts from raw warehouse tables. That lands for the analyst persona and confuses the dbt-native persona.
6. **The "agentic trust" pattern divides the room.** Scale-up analytics engineers and business analysts love "bet and proceed" — it feels like Cursor. Big-tech and enterprise reviewers want an approval / diff / preview step, especially for published models. There's a real tension here, not just a missing setting.
7. **Governance, permissions, and lineage are the biggest unaddressed gap.** Not because the prototype promised them and missed — because everyone who sees it at enterprise scale asks within three minutes, and there's no answer in the demo. This is the single most common "we'd need more to evaluate" signal.

---

## 1. Method

### 1.1 What I "ran"

A document-grounded simulation. For each persona I:

1. Grounded them in their actual tool stack, org structure, and day-to-day work at a named company (I used public engineering blogs, talks, job postings, and broadly-known stack details to calibrate — not private knowledge).
2. Walked them through Sara's story in SCRIPT.md, situation by situation.
3. Noted what resonates, what stalls, what they ask, and what they'd want to see before they'd buy.
4. Contrasted their response against other personas to surface decision points.

### 1.2 What this misses vs real research

- Real users surface their **actual** workflow. Simulated users reflect my model of that workflow. If the model is off, the reactions are off. Biggest risk: I'm likely to *overweight* the dbt-native perspective (it's well-documented) and *underweight* specific enterprise quirks (Nestle's SAP reality, Apple's internal tooling, Amazon's QuickSight/Redshift stack).
- I can't capture emotional response — delight, frustration, confusion — which is where live demos actually win or lose.
- I can't test whether the prototype's UX *works* under real hands. The SCRIPT assumes smooth flow; live sessions surface friction the scripts don't.
- Selection bias: any real panel would include unexpected personas. Mine is intentional.

### 1.3 What this can do well

- Stress-test the product thesis against a wider audience than the SVP/VP room.
- Surface contrasts that sharpen decision points.
- Name the incumbent comparisons every real buyer will run.

---

## 2. The panel

Ten personas, spanning role × company scale. Chosen to span the distinct *jobs* a data person might have, and the distinct *constraints* their company puts on tool adoption.

| # | Name | Role | Company | Why this seat matters |
|---|------|------|---------|----------------------|
| 1 | **Priya** | SVP Data & Analytics | Uber | Biggest-scale data org; bespoke tooling culture; the "would we build or buy?" seat |
| 2 | **Marcus** | Principal BIE (Business Intelligence Engineer) | Amazon Retail | Classic Amazon "metric owner" role; QuickSight + Redshift + internal metric catalogs |
| 3 | **Jin** | Director, Analytics Engineering | Lyft | dbt-mature mid-large org; owns the semantic layer decision |
| 4 | **Aisha** | Senior Analytics Engineer | Ramp | Scale-up IC; dbt + Snowflake + Hex; the tastemaker persona |
| 5 | **Elena** | Head of Data Science | Anthropic | AI-native, small team, strong build-vs-buy skepticism |
| 6 | **Rohit** | Director, Digital Analytics | Nestlé | CPG enterprise; SAP + Power BI legacy; long procurement |
| 7 | **Stefan** | Data Platform Engineer | Apple Services | Bespoke internal tooling; secrecy; custom everything |
| 8 | **Dana** | VP, Enterprise Data Platform | HP | Multi-BU enterprise; tool-consolidation pressure |
| 9 | **Tomás** | Business Analyst (Ops) | Ramp | Downstream consumer, light SQL, Spotter's target user proxy |
| 10 | **Kenji** | Senior Data Analyst (transitioning to AE) | Lyft | The "member of the data staff" — Data Studio's **primary stated user** |

> Note: Kenji is the closest match to the prototype's primary user ("member of the data staff"). His reactions are weighted most in the findings, but not exclusively — the point of a panel is to see where *Kenji's* enthusiasm survives contact with other seats.

---

## 3. Day-in-the-life grounding

Before replaying the situations, a compact read on what each persona actually does. This makes the later reactions legible. If you disagree with my day-in-life assumptions, the reactions below will compound that error — worth reviewing this section critically.

### 3.1 Kenji — Senior Data Analyst, Lyft (the primary user)
- Morning: Slack triage — 6 ad-hoc requests from Growth and Ops. Two require new SQL; four are "where do I find X?" questions.
- Midday: Building a new attribution model. Pulls from `events_user_sessions` and `events_rides_completed` in Snowflake, joins through the dbt-modeled `fct_user_ride_funnel`. Writes the new mart in dbt, opens a PR, pings reviewer on Slack.
- Afternoon: Stakeholder meeting (30 min), plus ~2 hours updating an existing Looker Explore because a PM asked to slice a dashboard differently.
- Tools: Snowflake (web UI + CLI), dbt Cloud, Looker, Hex, Slack, Notion (metric definitions), GitHub.
- **Stated pain:** "I spend half my day translating between 'what the business asked' and 'what the warehouse actually contains.' The semantic layer in Looker is LookML — it's fine, but authoring new metrics in LookML is slow."

### 3.2 Aisha — Sr Analytics Engineer, Ramp
- Same stack as Kenji (dbt + Snowflake + Hex + Mode/Looker-hybrid), but smaller org so she owns more of the pipeline end-to-end.
- Touches Fivetran, dbt models, Hightouch (for reverse-ETL), and exposes metrics to Operators via Hex dashboards and reverse-ETL tables.
- **Stated pain:** "Our metric definitions live in three places: dbt, Hex notebooks, Notion docs. When they drift, it takes me a full day to realign."

### 3.3 Jin — Director, AE, Lyft
- Doesn't write code daily. Reviews PRs, sets modeling standards, owns the quarterly data-platform roadmap.
- Tracks: semantic layer adoption (how many teams have migrated to the core semantic layer), data quality incidents, time-to-onboarding for a new analytics engineer.
- **Stated pain:** "Three different teams have three different definitions of 'active rider.' I need to unify metrics without breaking the teams that already have them in LookML."

### 3.4 Priya — SVP Data & Analytics, Uber
- Doesn't touch data. Reports to CFO. Owns a 300-person org.
- Thinks in: analyst productivity, decision velocity, cost-to-serve, regulatory exposure.
- **Stated pain:** "Every quarter I have to answer 'why is data slow?' My honest answer is governance — every number has to be approved, certified, and auditable. Agentic tooling scares me because I don't know whose neck is on the line when the agent is wrong."

### 3.5 Marcus — Principal BIE, Amazon
- Owns the "Retail Pricing" business metrics domain. QuickSight dashboards consumed by VPs.
- Writes "goal decks" — a uniquely Amazon artifact where metrics, definitions, and trends are baked into a single document that gets reviewed.
- Tooling: Redshift, internal "Andes" metric catalog, QuickSight, internal dashboarding tools.
- **Stated pain:** "Amazon's metric catalog is the source of truth, but it's an internal tool with no agent. For my VP review I spend 4 hours turning the catalog into a narrative. If an agent could do that, I'd save half my week."

### 3.6 Elena — Head of Data Science, Anthropic
- Small data team (< 10), AI-native. Uses Claude for most analysis work, reads warehouse data directly via Claude+MCP setups.
- Dbt is used but minimal. Analysis happens mostly in notebooks. Claude-generated SQL against Snowflake is the norm.
- **Stated pain:** "I don't need another tool. I need the tools I have to expose themselves cleanly to Claude. Anything that puts a GUI between my team and the data is a step backward."

### 3.7 Rohit — Director, Digital Analytics, Nestlé
- Multi-region, multi-brand CPG. Data sources: SAP ERP, Adobe Analytics, IRI retail data, a handful of cloud warehouses (Snowflake / Synapse) per region.
- Consumers: brand managers, trade marketing, supply chain.
- Tooling: SAP Analytics Cloud, Power BI (dominant), Alteryx, Tableau (legacy pockets).
- **Stated pain:** "I'm on my fourth 'self-serve analytics' initiative. The business doesn't want new tools. They want their Power BI dashboards to be right."

### 3.8 Stefan — Data Platform Engineer, Apple Services
- Engineering-leaning role on a small central team. Apple's culture: build, don't buy.
- Uses bespoke internal pipelines, custom metric frameworks, minimal third-party vendor footprint.
- **Stated pain:** Can't be quoted publicly. The internal pain is lineage — understanding what depends on what, across thousands of internal tools.

### 3.9 Dana — VP, Enterprise Data Platform, HP
- Heads up data platform across PC + Print + Services. Multi-cloud, lots of M&A integration.
- Mandate from CFO: reduce BI tooling sprawl from 7 to 3.
- **Stated pain:** "Every BU has their own semantic layer. I don't need a new one. I need one that wins by being the only one."

### 3.10 Tomás — Business Analyst, Ops, Ramp
- Writes mostly no SQL. Uses Hex (templates) and Looker. Asks Aisha for anything new.
- **Stated pain:** "When a number looks wrong in a dashboard, I can't tell if it's the dashboard, the model, or the data. I don't know who to ask."

---

## 4. Situation-by-situation replay

For each situation, I capture the three reactions that most sharpen decision points. Green = resonated, yellow = mixed, red = missed or provoked concern. The quotes are simulated but grounded in the persona's world.

### 4.1 Situation 1 — Zero to one (build the model from a brief)

| Persona | Reaction | Color |
|---|---|---|
| **Kenji, Lyft AE** | *"This is the best-looking modeling UI I've seen. If I can go from a brief to a working model in 25 seconds, I save a day per model. I want to feel the second prompt, though — what happens when I say 'use raw_events, not the dbt fact table'?"* | 🟢 |
| **Aisha, Ramp AE** | *"Fine, it built a model. Now show me the dbt project. Where does this live? Is it a YAML? Do I check it into git? If the answer is 'in ThoughtSpot,' you've created another source of truth and I have to reconcile with dbt."* | 🟡 |
| **Priya, Uber SVP** | *"Impressive. My question isn't whether it can build a model. My question is whether it builds the **right** model — in a warehouse with 30,000 tables, finding 3 of them is the whole problem."* | 🟡 |
| **Tomás, Ramp BA** | *"Wait, I can do this? I thought only Aisha could do this. Does my team know I can do this?"* | 🟢 |
| **Elena, Anthropic** | *"Why is this a separate product? I'd rather have Claude read my warehouse directly. What does this give me that `Claude + MCP + Snowflake` doesn't?"* | 🔴 |
| **Rohit, Nestlé** | *"Can it connect to SAP? What about our regional warehouses — can it scope to a brand manager's allowed tables?"* | 🟡 |
| **Marcus, Amazon BIE** | *"If this could ingest Andes and turn its metric catalog entries into a narrative, I'd buy it tomorrow. But it's pointed at Snowflake."* | 🟡 |
| **Dana, HP VP** | *"Would this replace two of my seven tools, or add an eighth?"* | 🟡 |
| **Jin, Lyft Director** | *"Our AEs already build models. The bottleneck isn't speed of initial authoring — it's *consistency*. Does two people's Data Studio output for the same brief look the same?"* | 🟡 |
| **Stefan, Apple** | *(internal evaluation; short answer: interest in the pattern, not the product)* | 🟡 |

**Consistent theme:** The zero-to-one moment is viscerally effective. The consistent doubt is **scale** — not "can it build *a* model" but "can it find the *right* tables in *my* warehouse." The SCRIPT starts with 3 tables. Most real warehouses have 10,000+. The prototype doesn't currently address how the agent narrows down.

**Sharpest contrast:** Tomás (business analyst) says "wait, I can do this?" and Priya (SVP) says "in a 30,000-table warehouse, finding the 3 tables *is* the problem." These two reactions are both correct, and they point at very different products. The business-analyst version is a "democratize modeling" product. The SVP version is a "help senior ICs scale" product. Data Studio currently speaks to the first but is being sold to the second.

**Decision point surfaced (DP-1):** Who is Sara, really? The prototype's stated primary user is "member of the data staff" (senior IC). The demo works best for the *junior* analyst or business user persona. These are different products.

---

### 4.2 Situation 2 — Test it (answer + 3-dimension diagnostic)

| Persona | Reaction | Color |
|---|---|---|
| **Kenji, Lyft AE** | *"This is the single most useful thing I've seen. The Data quality / Context / Structure split — we have to debug this manually every time a dashboard is wrong. If Spotter tells me *why* it's uncertain, I can trust the results."* | 🟢 |
| **Aisha, Ramp AE** | *"The diagnostic categories are good, but I write assertion tests in dbt. If I had 'context' and 'structure' as classes of test I could run on demand, that's a tool. If they're only surfaced inside the Spotter answer, I can't use them as a signal outside this product."* | 🟡 |
| **Jin, Lyft Director** | *"I'd pay for the diagnostic alone. My team asks 'why did Spotter pick that column?' every day. But — who coached the model? Was it Kenji or the platform team? Can I see the audit trail?"* | 🟢 |
| **Marcus, Amazon BIE** | *"The 'confidence' colors are what I want in QuickSight. When the VP sees a number, I want her to see 🟡 if it's unreliable. This is the contract that's missing in every BI tool today."* | 🟢 |
| **Elena, Anthropic** | *"Is this evals? If it's evals, where do I write evals? I don't see a test suite — just a chat transcript."* | 🟡 |
| **Priya, Uber SVP** | *"🟡 colors in a confidence panel won't survive contact with a CFO who needs a clean number. I need a 'certified' vs 'provisional' distinction, not a probability."* | 🟡 |
| **Dana, HP VP** | *"I love the confidence panel. My CIO will love it more. But I need to see how this interacts with our compliance sign-off process."* | 🟢 |
| **Rohit, Nestlé** | *"Brand managers will be confused by colored status. They want green or nothing. 🟡 means 'call IT' to them."* | 🔴 |
| **Tomás, Ramp BA** | *"This is the first BI thing that explains itself. Usually I just see a number and have to guess if it's right."* | 🟢 |
| **Stefan, Apple** | *(Interest specifically in the 3-dimension decomposition as an internal pattern.)* | 🟢 |

**Consistent theme:** The testing + diagnostic pattern is the *durable* AHA moment — the one people react to beyond the demo room. It's addressing a widely-felt pain (Spotter and Looker answers are black boxes today), and the 3-dimension decomposition (Data quality · Context · Structure) maps cleanly onto how senior ICs actually debug.

**Sharpest contrast:** Tomás says "the first BI thing that explains itself," Rohit says "brand managers want green or nothing." **Confidence color semantics are culture-dependent**: technical audiences read 🟡 as "inspect this, might still be fine." Business audiences read 🟡 as "broken." Spotter is ultimately consumed by business audiences — so the 🟡 in *Spotter* (not Data Studio) needs different treatment than the 🟡 in the authoring tool.

**Decision point surfaced (DP-2):** Is the 3-dimension confidence a feature of **Data Studio** (for authors) or of **Spotter** (for consumers)? They probably need different designs. Right now the prototype shows authors' colors. The script implies these will pass through to business consumers — that's a separate UX problem.

---

### 4.3 Situation 3 — Teach and fix (coach the model)

| Persona | Reaction | Color |
|---|---|---|
| **Kenji, Lyft AE** | *"One instruction fixes 18 columns — yes. This is the compounding value. In dbt I write 18 descriptions manually. If the agent does it and I review, I'm 10x faster."* | 🟢 |
| **Aisha, Ramp AE** | *"OK, but where do the descriptions live? If I 'teach' the model inside Data Studio, and Aisha-two months later pulls the dbt model fresh, do the descriptions travel? If they don't, Data Studio becomes the source of truth — and that's a decision we need to make."* | 🟡 |
| **Jin, Lyft Director** | *"No approval needed, in draft mode — OK, I get it. But in published mode, I need a review step. Otherwise an analyst can silently change a metric definition that VPs rely on."* | 🟡 |
| **Priya, Uber SVP** | *"The 'scan the whole class' pattern is brilliant. The 'apply without approval' pattern is terrifying. Both are in the same demo. I can't tell which is the product."* | 🟡 |
| **Marcus, Amazon BIE** | *"This is how I wish Andes worked. I'd coach the catalog to know what 'MoM growth' means in my domain, and it would stay coached."* | 🟢 |
| **Tomás, Ramp BA** | *"I don't understand what's happening. Descriptions for... what? I just want to ask a question."* | 🔴 |
| **Elena, Anthropic** | *"The coaching pattern is useful, but it's just prompt engineering with a GUI. My team would do this in plain markdown."* | 🟡 |
| **Rohit, Nestlé** | *"We have metadata management tools — Collibra, Informatica. This overlaps. Does it integrate or duplicate?"* | 🟡 |
| **Dana, HP VP** | *"Who has permission to coach? Can I scope coaching to a role?"* | 🟡 |
| **Stefan, Apple** | *(Interest as a pattern; internal equivalent would be bespoke.)* | 🟡 |

**Consistent theme:** The pattern is clever. The governance story is absent. Every enterprise reviewer asks "who can do this, when" within one minute. **The prototype has a stated answer (in-draft = no approval; published = something implied-but-not-designed), but the demo shows only the draft path.**

**Sharpest contrast:** Kenji (IC) says "one instruction fixes 18 things, I'm 10x faster." Priya (SVP) says "the same tool that's 10x faster is also terrifying because there's no diff, no review, no audit." This is the **agentic trust** tension, and it's the biggest decision in the product.

**Decision point surfaced (DP-3):** "Bet and proceed" vs "diff and confirm." The prototype has picked one (bet and proceed, with draft-mode bypass). That's the right choice for the wedge user (Kenji-type AE). But enterprise buyers need the diff / review path to ever ship to prod. You need both *and* a clear mental model for when each applies. "Draft / Published" is the right axis for this — but it needs to be visually and behaviorally strong, not subtle.

---

### 4.4 Situation 4 — Expand the model (add a metric)

| Persona | Reaction | Color |
|---|---|---|
| **Kenji, Lyft AE** | *"Three weeks post-publish, I open the model, type a request, click Republish — this beats my current workflow by a mile. In dbt + Looker I'd touch 3 files and wait for a merge."* | 🟢 |
| **Aisha, Ramp AE** | *"Wait, what's 'Republish' actually do? Is there a new version? Rollback? Can Tomás still use the old version for a retro? If not, this is scary."* | 🟡 |
| **Jin, Lyft Director** | *"What does 'Republish' mean for downstream dashboards? In Looker, a LookML change propagates. Does Data Studio break existing Spotter answers or preserve them?"* | 🟡 |
| **Marcus, Amazon BIE** | *"This is the moment I need — incremental change on a live metric without a rewrite. But I need to trace what changed. Git blame for metrics."* | 🟢 |
| **Priya, Uber SVP** | *"Sara adds a new metric and 'republishes.' Who's notified? Marketing team was consuming this model — they need to know it changed, or their WoW comparisons break."* | 🟡 |
| **Elena, Anthropic** | *(Barely engaged — this is a BI workflow she doesn't have.)* | 🟡 |
| **Rohit, Nestlé** | *"If my brand managers depend on this model and Sara republishes without telling me, we have a compliance issue."* | 🔴 |
| **Tomás, Ramp BA** | *"I'd love to do this myself. But I don't know if the team would let me."* | 🟢 |
| **Dana, HP VP** | *"What's the change-management artifact? A PR? A ticket? A comment? I need something for audit."* | 🟡 |
| **Stefan, Apple** | *(Interest; internal lineage tooling would reject this without a diff.)* | 🟡 |

**Consistent theme:** Speed is compelling. Governance is missing. "Republish" is a destructive state change in every reviewer's mental model — there's no version history, no notification, no rollback shown.

**Decision point surfaced (DP-4):** What is the atomic unit of change? In dbt it's a PR. In Looker it's a LookML change in a branch. In Data Studio it's... a chat message? That can't be the only answer at enterprise scale. The simplest framing: **every "publish" or "republish" should produce a named, diffable, reversible artifact** — even if the authoring interaction is conversational.

---

### 4.5 Situation 5 — Cache it (the weakest moment)

| Persona | Reaction | Color |
|---|---|---|
| **Kenji, Lyft AE** | *"Caching from Spotter to where? Snowflake already caches results. If this is a ThoughtSpot-side cache, I need to understand what that means for my warehouse governance."* | 🟡 |
| **Aisha, Ramp AE** | *"$340/mo saved. OK. But Ramp spends $340/hour on data platform compute. This is a small fish."* | 🟡 |
| **Jin, Lyft Director** | *"Snowflake's result cache plus materialized views solve this for most of my workload. Why would I add another cache layer?"* | 🔴 |
| **Marcus, Amazon BIE** | *"Amazon's data platform already optimizes for this. I wouldn't send this to procurement."* | 🔴 |
| **Priya, Uber SVP** | *"$340/mo is a rounding error. If the story is latency — 3s to 200ms — that's something. Lead with the latency."* | 🟡 |
| **Elena, Anthropic** | *(Skips — not her workload.)* | 🟡 |
| **Rohit, Nestlé** | *"Is the cache in the EU? Data residency is my problem, not cost."* | 🟡 |
| **Tomás, Ramp BA** | *"Oh, it's just faster? Cool, I guess."* | 🟡 |
| **Dana, HP VP** | *"Where does the cached data live? On-prem? Cloud? What's the encryption story?"* | 🔴 |
| **Stefan, Apple** | *(Hard no on a vendor-side cache without extensive security review.)* | 🔴 |

**Consistent theme:** Cost savings is the wrong headline. Latency is a decent headline. The *real* reason to cache at the BI layer is **governance decoupling from the warehouse** — but the prototype doesn't say that.

**Sharpest contrast:** No persona lit up on this situation. Cost-saving demos don't move data leaders because the numbers never feel real until they're aggregated. Enterprise personas worried about data residency and encryption. Scale-up personas felt the number was small. Big-tech personas already have internal equivalents.

**Decision point surfaced (DP-5):** The caching pitch needs to be reworked. Three candidate framings, from weakest to strongest:
- **Weak:** "Save money" ($340/mo — too small to move a buyer)
- **Medium:** "Fast Spotter answers" (3s → 200ms — real, but Snowflake QAS and materialized views compete)
- **Strong:** "Decouple Spotter availability from warehouse availability" (Spotter keeps working when Snowflake is slow or expensive; usage-based workload can't overwhelm production queries) — this is the only framing that's *unique* to the layer Data Studio sits at.

If the strong framing is right, the cache panel needs to show **not cost**, but **isolation**: "Your Spotter users are on cached data; your ETL is on live data; noise from one doesn't hit the other."

---

### 4.6 Situation 6 — Monitor and fix (the sleeper win)

| Persona | Reaction | Color |
|---|---|---|
| **Kenji, Lyft AE** | *"When a schema change breaks a dashboard, I find out from a Slack thread two days later. Alert-that-routes-me-back is the feature I didn't know I wanted."* | 🟢 |
| **Aisha, Ramp AE** | *"This is Elementary / Monte Carlo territory. But those are separate tools. If this is integrated with the modeling environment, that's a simpler story."* | 🟢 |
| **Jin, Lyft Director** | *"Schema drift alerts are useful. The harder problem is *semantic* drift — the data is still there, but the definition shifted. Does Data Studio catch that?"* | 🟡 |
| **Marcus, Amazon BIE** | *"Every BIE has a ghost graveyard of dashboards that silently broke. Routing an alert straight to the affected node is worth a lot."* | 🟢 |
| **Priya, Uber SVP** | *"This is the feature that makes Data Studio feel like a platform, not a BI tool. Combined with coaching, it's a learning system."* | 🟢 |
| **Elena, Anthropic** | *(Interest — Anthropic's data drift is a real problem for eval pipelines.)* | 🟢 |
| **Rohit, Nestlé** | *"Schema changes in SAP happen every quarter. If this could surface them before they hit our Power BI reports, we'd renew on that alone."* | 🟢 |
| **Tomás, Ramp BA** | *"If this means I see a flag in the dashboard before I show it in a meeting, yes."* | 🟢 |
| **Dana, HP VP** | *"Alerting is the start. I need workflow — assign, track, close. Integrates with Jira?"* | 🟡 |
| **Stefan, Apple** | *(Strong interest as a pattern.)* | 🟢 |

**Consistent theme:** This is the *quietest* situation in the deck and arguably the **most persuasive to enterprise**. Schema-drift-that-routes-you-back turns Data Studio from a modeling tool into a platform feature. Monte Carlo is a $5B company; this is in that zone of value.

**What's missing in the current demo:** Only *schema* drift is shown. Semantic drift (same schema, different meaning — e.g. "Our definition of 'active user' changed") is the harder and rarer-but-more-damaging case. The coaching history from Situation 3 is the raw material for detecting semantic drift — nobody else is even close to this. Worth making explicit.

**Decision point surfaced (DP-6):** Monte Carlo-class observability is a separate product category. Data Studio can either:
- (a) Own monitoring as a first-class surface (compete with Monte Carlo, Elementary, Sifflet) — big lift, big reward.
- (b) Own only monitoring *that's relevant to the agent* — schema drift that affects a coached column, definitional drift that affects a Spotter answer. Narrower, defensible, complementary to Monte Carlo.

Option (b) is probably the right near-term bet, but the prototype isn't yet scoped toward it.

---

## 5. Cross-cutting themes

Patterns that surface across multiple situations and multiple personas. These are the signals that point at structural decisions in the product.

### 5.1 "Where does the code live?"

Came up with **Aisha, Kenji, Jin, Stefan, Marcus, Elena.** All six AE/platform personas asked a variant of this. The prototype is conversational — the artifacts are created by the agent, stored in ThoughtSpot's state.

This creates three possible product shapes:

- **Shape A — Data Studio owns the model.** The model is a ThoughtSpot artifact. dbt is a source for import. Changes stay in Data Studio. *Risk:* you become a parallel source of truth, and the dbt-native buyer rejects you.
- **Shape B — Data Studio writes to dbt.** Every change Sara makes in Data Studio generates a dbt PR. dbt is the source of truth. Data Studio is a really smart editor. *Risk:* you lose the immediacy of the demo. The "republish" moment now takes 10 minutes and a merge.
- **Shape C — Data Studio is an overlay.** Structural model comes from dbt (read-only). AI-specific enrichment (descriptions, synonyms, coaching history) lives in Data Studio. The boundary between what's dbt-owned vs DS-owned is explicit. *The knowledge/platform.md suggests this is the intent, but the SCRIPT does not make the boundary visible.*

**This is decision point DP-7 and probably the single most important architectural call in the product.** The prototype can ship any of these; choosing between them changes who the product is for.

### 5.2 The dbt gravity problem

Every AE persona tested, implicitly or explicitly, their dbt project against the prototype. The SCRIPT starts from raw Snowflake tables — this feels *wrong* to them, because their raw Snowflake tables are not where they work. They work in `fct_*` and `dim_*` marts.

The prototype has a dbt import flow (see `research/semantic-model-import-sync.md`) — but **it's not in Sara's story.** Sara builds from scratch. The dbt-native AE walks away thinking the product doesn't know about them.

**Recommendation:** Make at least one of the six situations a dbt-first story. Either Situation 1 (build on top of a dbt project) or a new Situation 1.5 (import an existing dbt project).

### 5.3 Governance, permissions, lineage — the missing third leg

The prototype's three strong legs today are: agentic authoring, testing diagnostics, monitoring alerts.

Every enterprise persona asked about a fourth leg that isn't there yet: **who can do what, to which data, with which audit trail**. Specifically:

- Role-based coaching permissions (who can change a synonym on a governed metric?)
- Draft → published → certified progression (not just draft vs published)
- Lineage from Spotter answer back to underlying dbt source (more than the current Inspect panel)
- Change notifications to downstream consumers
- Integration with the metadata / compliance stack (Collibra, Alation, Immuta, Atlan)

**This is the single biggest gap in the product thesis for enterprise buyers.** For scale-up buyers (Ramp), it's less load-bearing but still relevant.

### 5.4 Scale of demo vs scale of reality

SCRIPT: 3 tables, 150 rows, 26 columns.
Kenji's real Monday: 400 dbt models, tens of thousands of Snowflake tables, columns with 100M+ rows.

The one-shot build at demo scale is magical. At real scale, the questions change: how does the agent decide which tables to look at? How does it not time out on a 10K-table warehouse? How does it handle the third `fct_user_sessions` (there's always more than one)?

**Recommendation:** At least one of the six situations should operate at realistic scale. Even scripted, seeing the agent navigate a 500-table schema picker would materially change the buyer's confidence. Right now the demo reads as "toy."

### 5.5 Trust and transparency

The "bet and proceed" pattern resonates with some personas and alarms others. The deeper need underneath is **legibility**: I don't need to approve every step, but I need to see what the agent did, cleanly, after the fact.

Hex's pattern (notebook-as-audit-trail) was called out in `patterns.md` as inspiration. The prototype has a working-steps display during agent runs. What's missing (or at least not shown in the SCRIPT) is:

- A durable view of "what the agent has ever done to this model" — not just the current conversation.
- A diff view when the agent changes existing state (e.g. Situation 4's republish).

**This is a design problem, not a philosophical one.** "Bet and proceed" + strong legibility = best of both worlds. "Bet and proceed" + opaque state = what scares Priya.

### 5.6 The "second tool" problem

Dana, Rohit, Marcus all framed their reaction as "is this a tool I add, or a tool I replace?"

Large enterprises are under mandate to consolidate BI tooling. Any new vendor has to replace something, not add to the pile. Data Studio's strongest consolidation story is:

- Replaces semantic modeling in other BI (LookML, Power BI datasets) + replaces some light monitoring (partial Monte Carlo/Elementary) + replaces the ad-hoc "coaching metadata in Notion" pattern

It does not obviously replace dbt, Snowflake, or the warehouse itself.

**Recommendation:** The pitch deck (separate from this prototype) needs an explicit "what you retire when you adopt Data Studio" slide.

---

## 6. Incumbent head-to-head

How Data Studio fares against the specific tools panel members brought up. Each entry: what the incumbent does well, where Data Studio is stronger, and the honest "why wouldn't I just use X" question the buyer will ask.

### 6.1 vs dbt Cloud + dbt Semantic Layer

**dbt's strength:** Source-of-truth authority. Git-backed. Battle-tested. Every analytics engineer under 35 is fluent.

**Data Studio's strength:** Agentic authoring is 10x faster for the first draft. Testing + coaching has no equivalent in dbt — dbt tests assertions, not semantic correctness against a BI agent. Monitoring routes back to the right node with context; dbt doesn't do this natively.

**The honest question from Aisha:** "Why wouldn't I just wait for dbt to ship AI authoring (they will)?"

**The honest answer:** dbt will ship AI authoring, but dbt's *product center of gravity* is the pipeline. The BI-agent feedback loop (test → coach → monitor) lives in the BI layer, not the transformation layer. Data Studio can own that loop even if dbt owns the transformation.

### 6.2 vs Looker / LookML

**Looker's strength:** LookML is mature. Large orgs have thousands of LookML files.

**Data Studio's strength:** LookML is slow to author. LookML has no agent. Looker's "Explore" for business users is widely considered weak.

**The honest question from Jin:** "We have 10 years of LookML. Are you telling me to migrate?"

**The honest answer:** No — at least initially. Data Studio should be able to *import* a LookML model and enrich it, the same way it imports dbt. LookML as a source, Data Studio as the enrichment + agent layer. This is strictly additive, not a migration.

**If Data Studio doesn't support LookML import, it cedes the 1,000+ Looker customers as a beachhead.**

### 6.3 vs Snowflake Cortex Analyst

**Cortex Analyst's strength:** It's free-adjacent (bundled with Snowflake). Native to the warehouse. Fast. Zero integration overhead for Snowflake customers.

**Data Studio's strength:** Cortex Analyst's modeling UX is a YAML file. Seriously — that's it. No agent. No testing. No coaching. No monitoring. **This is the single most exposed competitor.**

**The honest question from Kenji:** "Why not just use Cortex Analyst? It's right there."

**The honest answer:** Cortex Analyst is a feature, not a product. It answers "can Snowflake customers get NL over their data?" in a minimal way. Data Studio answers "can a data team *build and maintain* a trustworthy agent experience?" — which is the full lifecycle. The gap is widest here.

**Risk:** Snowflake will keep investing. The gap closes over time. Data Studio needs to make its lifecycle story (test / coach / monitor) into a moat, not a temporary advantage.

### 6.4 vs Snowflake Cortex + dbt (the combo the user flagged)

This is the **scariest competitor in the panel**, because dbt and Cortex together cover:

- dbt: modeling + transformations + source of truth
- Cortex: NL access to the modeled data + semantic model YAML

The combo's weakness: no agent-aware testing, no coaching feedback loop, no monitoring routed to the model, no unified workspace.

**Data Studio's pitch vs this combo:** "dbt + Cortex is the DIY; we're the integrated product." That's a legitimate pitch — and it's the same pitch Looker made vs "Presto + Mode" in 2014. Looker won with it.

**Risk:** dbt Cloud is racing toward this combined experience. Whoever ships the integrated experience first wins a multi-year lead.

### 6.5 vs Cube / Malloy

**Cube/Malloy's strength:** Headless, code-first, multi-BI semantic layer. Beloved by platform engineers.

**Data Studio's strength:** Cube is infrastructure; Data Studio is a product. Different buyers.

**The honest question from Stefan:** "We'd build something on Malloy before we'd buy this."

**The honest answer:** That's the Stefan persona (bespoke-build culture). For every Stefan there are 20 Kenji-shaped orgs that don't have the bandwidth to build on Malloy. Cube/Malloy doesn't compete directly; it competes for the platform-engineer heart at build-minded companies.

### 6.6 vs Databricks Genie + Unity Catalog

**Databricks' strength:** For Databricks-native customers, Unity Catalog + Genie is bundled, governed, and deeply integrated.

**Data Studio's strength:** Probably: warehouse-agnostic; better testing + coaching UX. (I'd need to see both side by side to be sure.)

**The honest question from Priya:** "If I'm a Databricks customer, why not Genie?"

**The honest answer:** Data Studio needs a Databricks connector. Without it, half the panel is out. The SCRIPT only shows Snowflake.

### 6.7 vs Hex (Magic)

**Hex's strength:** Notebook-native analysis. Magic is excellent for exploration and ad-hoc work.

**Data Studio's difference:** Different layer of the stack. Hex is where Kenji does *analysis*; Data Studio is where Kenji builds *models*. Non-competitive in principle. Complementary.

**The risk:** Hex is expanding into productionized flows (apps, published workflows). The edges are getting fuzzy. Long-term, "notebook with AI" + "semantic layer with AI" may converge.

### 6.8 vs Omni

**Omni's strength:** Modern Looker alternative. Strong dbt integration. Spreadsheet-on-semantic-layer hybrid.

**Data Studio's difference:** Omni is a BI tool (consumption layer). Data Studio is a semantic-authoring tool (authoring layer). Non-competitive in principle. In practice, they're being pitched to the same buyer.

**The sharp question from Dana:** "Would I buy Data Studio + Spotter, or Omni + Omni's upcoming AI?"

**The honest answer:** Depends on Spotter's consumer UX (not covered in this prototype). If Spotter is strong, Data Studio is the better authoring experience. If Spotter is weak, Omni's bundled story wins.

### 6.9 vs Sigma

Similar framing to Omni. Sigma's strength is business-analyst spreadsheet UX. Different layer. Complementary in principle, competitive in buyer mindshare.

### 6.10 What the panel *didn't* mention but probably should have

- **Atlan / Alation / Collibra** — metadata management. Data Studio's coaching layer ("descriptions, synonyms, business context") overlaps directly with these tools. Enterprise buyers will ask.
- **Monte Carlo / Elementary / Sifflet** — observability. Situation 6 lives in their territory.
- **WhyLabs / Evidently** — ML observability. Closer to Elena's world.
- **Fivetran / Airbyte + reverse ETL (Hightouch / Census)** — data movement. Not competitive, but affects the story of "how does data get to Data Studio's connected warehouse in the first place."

---

## 7. PMF signals vs PMF risks

### 7.1 Where the panel leaned in

- **One-shot build from a brief** (Situation 1) — visceral, fast, clearly different from incumbents. Every persona reacted to this, even the skeptical ones.
- **Testing with 3-dimension diagnostic** (Situation 2) — specifically the Data quality / Context / Structure decomposition. *"I debug this manually every time."*
- **One-instruction-fixes-a-class pattern** (Situation 3) — compounding value. This is the moment analytics engineers reach for their calendar to book a follow-up.
- **Schema-drift-as-an-alert-that-routes-back** (Situation 6) — sleeper win for enterprise. Turns the tool into a platform feature.
- **Draft → Published state model** (philosophical; only partially implemented) — resolves the agentic-trust tension, if built out.

### 7.2 Where the panel pulled back

- **Cost-led caching pitch** (Situation 5) — framing doesn't match the buyer. Needs to be reframed around isolation/availability.
- **Republish without a diff** (Situation 4) — scares every enterprise reviewer.
- **"Bet and proceed" without post-hoc legibility** — scares governance-minded reviewers regardless of company size.
- **Toy-scale demo** (3 tables, 150 rows) — undercuts the one-shot-build's credibility at real scale.
- **Absence of dbt in Sara's story** — alienates the dbt-native AE persona, who is close to the stated primary user.
- **Absence of governance / permissions / lineage** — blocker for enterprise procurement.

### 7.3 Where the panel was indifferent

- **The 6-situation framing itself.** Nobody reacted to "there are six situations" as a meaningful narrative structure. They reacted to specific situations. The "6 situations" is a useful internal organizing device for your team; it's not a customer-facing frame.

---

## 8. Decision points

The contrasts above surface seven forks in the road. Ranked by importance to the product's long-term shape.

### DP-1: Who is Sara, really?

**Options:**
- (a) **Senior analytics engineer** (the stated primary user). The product is "10x the work of a senior IC." Buyers: mid-to-large data orgs.
- (b) **Business analyst / junior analyst**. The product is "democratize modeling; let analysts do engineering-level work." Buyers: scale-ups, smaller orgs, BI-heavy enterprises.
- (c) **Both**, with different interaction patterns for each.

The prototype's design principles (agentic, one-shot, ambient quality) fit (b) better than (a). The stated user knowledge file says (a). Pick deliberately.

### DP-2: Is confidence-scoring a Data Studio feature or a Spotter feature?

The 3-dimension diagnostic is one of the strongest ideas in the prototype. Where does it live? If authors see it in Data Studio and consumers see it in Spotter, they're the same idea with different presentations. Design implication: the data model for "confidence" is shared, but the UX is role-specific. The prototype conflates them.

### DP-3: Agentic trust — bet-and-proceed vs diff-and-confirm

The current answer (bet-and-proceed in draft, something implied-but-not-designed in published) is defensible. But the Draft → Published transition needs real design. Not a toggle. A guided flow. With a diff, a review step, an audit trail, and notifications.

### DP-4: Atomic unit of change

What is a "publish"? A named version? A git commit? A Jira ticket? Right now it's a chat message, which is the worst answer for enterprise and the best answer for velocity. Pick the middle: **every publish generates a named, diffable, reversible artifact.** The chat-message authoring interaction can stay.

### DP-5: Caching — reframe

Drop "save money" as the headline. Consider "isolate Spotter workload from warehouse workload" as the new headline. Cost becomes a secondary benefit of a primary architecture decision.

### DP-6: Monitoring — how wide?

Option (a): own the full observability category (compete with Monte Carlo).
Option (b): own only agent-aware monitoring (schema drift that affects a coached column; semantic drift in a Spotter-facing metric).
Option (b) is defensible, narrow, and complementary. Pick it explicitly.

### DP-7: Where does the code/model live? (the dbt question)

The single most important architectural choice. Three shapes (§5.1):
- Shape A: Data Studio as source of truth.
- Shape B: Data Studio writes to dbt.
- Shape C: Data Studio overlays dbt (structural from dbt, AI enrichment from DS).

The platform doc says (C). The demo looks like (A). Make (C) visible in the SCRIPT.

---

## 9. Recommendations

Ordered by expected impact.

1. **Add a dbt-first situation to the demo.** Either replace Situation 1 or insert a 1b. Without it, the panel's largest segment (dbt-native AEs) walks away confused. See §5.2.

2. **Redesign Situation 5 (caching).** Lead with isolation/availability, not cost. See DP-5. The current framing is the panel's weakest moment and pulls energy from stronger situations.

3. **Design the Draft → Published → Certified progression explicitly.** Today it's draft (built) vs published (implied). Add the third state (certified / governed) and the review flow that gates the transitions. See DP-3. Without this, enterprise buyers can't say yes.

4. **Make the `Republish` moment produce a named, diffable artifact.** Even if it's conversational to author, the output should be something a human can point at. See DP-4. This is the fastest path to an answer for the "what about audit?" question.

5. **Show real-warehouse scale in at least one situation.** 500+ tables, filtering logic, schema pickers. The demo reads as toy-scale today, and it undermines the one-shot build's credibility. See §5.4.

6. **Call out the overlap with metadata management tools and observability tools.** Not to duplicate them — to position against them cleanly. Coaching history = light Alation. Monitoring = narrow Monte Carlo. State this in the narrative, don't let buyers fill it in. See §5.3, §6.10.

7. **Build the Draft-mode legibility view.** "What has the agent ever done to this model?" as a persistent surface, not just a conversation transcript. This converts the "bet and proceed" tension into a feature. See §5.5.

8. **Connect Data Studio to at least Databricks, and show LookML import as a path.** Without Databricks you lose half the enterprise panel; without LookML import you lose the Looker-incumbent replacement story. See §6.6, §6.2.

9. **Keep the testing + coaching + monitoring triad as the moat story.** These three together are what you can credibly own. Don't let one-shot build become the whole pitch — it's the entry, not the bet.

10. **Keep Sara. But write Marcus's story, Rohit's story, and Elena's story too.** The prototype is a Sara product. Validate that Sara is the first customer and the others are follow-ons, rather than assuming Sara covers all of them.

---

## 10. Closing note

The prototype as it stands is **stronger as a product thesis than as a demo**. The thesis — integrated authoring + testing + coaching + monitoring + caching for BI agents — is coherent and mostly contrarian in the right way. The demo, as scripted, privileges the one-shot build moment and under-sells the compounding value (testing, coaching, monitoring) that's probably the real moat.

If the goal of the SVP/VP review is to get funding to build the full product, this demo probably gets you there. If the goal is to win enterprise customers, the gaps called out in §8 need to be closed first.

The sharpest contrast from the simulated panel:

> **Kenji, Lyft:** *"This is the best modeling UX I've seen. I'd use it tomorrow."*
>
> **Priya, Uber:** *"I can't put this in front of my CFO without an audit trail."*

Both are right. They're pointing at the same product, describing it from opposite ends of the org chart. The path between them is the roadmap.
