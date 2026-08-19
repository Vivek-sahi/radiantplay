# Agentic Analytics — A Study Narrative
_A study of how the industry is building data/analytics for an era where BI is consumed by both humans and AI agents — and what it means for ThoughtSpot and Data Studio._

_Compiled 2026-06-16. Structured as milestones, one per stage of the inquiry. Each milestone preserves the full nuance of that step; the closing synthesis distills the through-line and the implications for Data Studio._

* * *
## How to read this
This started as "read this article" and turned into a sector-wide strategy study. The milestones are roughly chronological — each one builds on the last. The argument tightens as it goes: it starts with _how companies build analytics agents_, moves to _where the durable value sits_, and ends with _what is actually defensible when both the semantic layer and the agent are being competed to zero from multiple directions_.

The single sentence the whole study converges on:

> **The model is commoditizing. The agent is commoditizing. The only thing that compounds is governed, accountable context and the loop that keeps it true.**

* * *
## Milestone 1 — Two paths to agentic analytics: Anthropic vs OpenAI
Source: "Two Paths to Agentic Analytics" (handsondata.substack.com), contrasting how Anthropic and OpenAI build internal analytics agents. Framed as **ETL vs ELT**.

|     | **Anthropic — "ETL" (curate first)** | **OpenAI — "ELT" (navigate chaos)** |
| --- | --- | --- |
| Strategy | Canonicalize upfront: consolidate duplicate tables, deprecate redundant assets, keep related data together. _Shrink the answer space before the agent touches anything._ | Keep the entire estate (600 PB, 70k+ datasets); use automated enrichment + retrieval to navigate full complexity. |
| Scale | Product/growth analytics — "millions of fields," hundreds of tables → curation is feasible | Enterprise-wide — 3,500+ users across eng, finance, research, GTM → sprawl is inevitable |
| Bet | Discipline and structure | Infrastructure and context-on-demand |

**Surprising convergences (both reached independently despite opposite strategies):**

- SQL generation is _not_ the bottleneck — **question-to-entity mapping is**.
  
- **Context architecture** matters more than prompts or model routing.
  
- Query history barely helps (<1 pt accuracy gain).
  
- Inspecting **pipeline code** reveals semantic meaning better than schema alone.
  
- **Slack and Notion** act as institutional knowledge stores.
  
- Permission pass-through (agents get no special access).
  

**Anthropic's distinctive moves:**

- **Skills framework** — senior analysts document workflows as markdown alongside transformation code (documentation as a first-class citizen).
  
- **CI enforcement** — ~90% of data-model PRs include matching skill/doc updates.
  
- **Accuracy-decay finding** — accuracy dropped **95% → 65% in one month through inaction alone**. Agentic analytics is not build-once.
  
- **Correction loops** — scheduled agents scan for correction language, auto-draft doc fixes for human review.
  
- **Transparency** — answers carry source tier, freshness, ownership, failure reasons.
  

**OpenAI's distinctive moves:**

- **Codex enrichment** — crawl pipeline code to surface nuances invisible in schema (filtered vs unfiltered sources).
  
- **Memory layers** — corrections learned in infrastructure, not tied to data models.
  

**Author's takeaway:** the real unlock is **data foundations**, not new paradigms. Anthropic just intensified existing disciplines (dimensional modeling, shift-left testing, freshness/completeness checks) and made them hard requirements because the end-user is now an agent. Recommendation for most teams: start with Anthropic's approach — _folders of markdown, CI hooks, a simple correction loop_ — before adding retrieval infra. **The work that compounds is building the evaluation loop.**

* * *
## Milestone 2 — Meta's home-grown Analytics Agent
Source: "Inside Meta's Home-Grown AI Analytics Agent" (Analytics at Meta).

- Autonomous agent that runs SQL, reads results, spots patterns, and decides its own follow-ups. Weekend prototype → in 6 months used by **77% of Meta's data scientists/engineers** + ~5× that many non-data users.
  
- **Signature example:** "why did signups drop last Tuesday?" → queries signups, sees numbers normal, checks for a logging change, finds a deploy that altered the event schema, surfaces the root cause. Note: _iterative reasoning, not text-to-SQL._
  
- **80/20 bounding insight:** 88% of data-scientist queries rely only on tables queried in the **preceding 90 days** → bound the agent to the hot set.
  
- **Three-layer knowledge system:** Cookbooks (domain packages) / Recipes (SOPs: workflows, validation rules, tool controls) / Ingredients (semantic models, docs, business rules).
  
- **Personalization / "shared memory":** processes each analyst's query history offline to learn their tables, patterns, style. You can **clone a colleague's expertise** via their query history.
  
- **Trust:** every data point shows its **source SQL**; a **separate validation layer** checks outputs against natural-language rules.
  
- Money quote: _"An AI agent without personalized context is just a chatbot with database access."_
  

**Three-way comparison (Anthropic / OpenAI / Meta):** the genuine divergence is the _scoping strategy_ — Anthropic shrinks the **data**, OpenAI embraces **all of it**, Meta shrinks the **query surface** (recent/hot tables). Common thread holds: question→entity mapping is the bottleneck; the durable work is the knowledge + eval/correction loop. Meta adds a fourth angle the others underweight: **personalization** as the thing separating an agent from "a chatbot with DB access."

* * *
## Milestone 3 — Who else has written reliably about their analytics setup
A neutral reading list of substantive first-party writeups (full links in the appendix):

- **Anthropic** — self-service analytics with Claude (agentic stack; ~95% of queries automated at ~95% accuracy).
  
- **Meta** — the analytics agent above.
  
- **Pinterest** — "How we built Text-to-SQL at Pinterest" (RAG table discovery across 100k+ tables; ~35% faster SQL) and "Unified Context-Intent Embeddings" (embedding analytical intent from query history).
  
- **Uber** — Finch, a Slack-based conversational data agent for finance (maps internal terminology to data, benchmark validation, human-in-the-loop).
  
- **Salesforce** — internal Slack text-to-SQL agent (Horizon).
  
- **Shopify** — ShopifyQL (commerce query language).
  
- **Netflix** — the three-part analytics-engineering survey (next milestone).
  

* * *
## Milestone 4 — Netflix's three-part survey of analytics engineering
Broader than a single agent — a survey of the whole analytics-engineering practice.

**Part 1 — Platform & tooling (Analytics Enablement):**

- **DataJunction (DJ)** — open-source semantic layer centralizing metric definitions. Define once ("Total Streaming Hours"), works across account/country/filtered queries, auto-handles dimensional joins ("dimension linking"), serves both dashboards and the A/B experimentation platform.
  
- **LORE** — LLM chatbot democratizing access; human-readable explanations + **confidence scores**; learns from 👍/👎 with a fine-tuning loop.
  
- **Cloud Efficiency Analytics (CEA)** — Foundational Platform Data + time-series cost attribution.
  
- Theme: fight metric inconsistency and dashboard sprawl through standardization.
  

**Part 2 — Applied measurement & causal inference:** synthetic-control frameworks for game user-acquisition incrementality; state-machine modeling of player journeys; content cash modeling for "TBD slots" via constrained polynomial optimization; ASR-assisted dubbing workflow with multi-layer measurement.

**Part 3 — Craft:** dashboard design ("design = how it works"; IA matched to mental models); analytics API deployment lessons (batch vs real-time, build-custom-when-nothing-fits, latency expectations 7s→~1s via caching, align eng-sprints vs data-quarters cadence); Benn Stancil (Mode) keynote.

**The contrast that matters:** Anthropic/OpenAI/Meta/Pinterest/Uber write about **the agent**. Netflix writes about **the foundation the agent needs** — a centralized metrics layer (DataJunction) + rigorous measurement discipline. Reinforces the throughline: the data foundation is the real unlock.

* * *
## Milestone 5 — How should ThoughtSpot think about building a data product?
**The key reframe:** ThoughtSpot is _not_ in the same business as any of these companies. They built an _internal_ tool for _their own_ data, analysts, and semantics — they could hand-curate. ThoughtSpot has to ship the **machinery** that lets thousands of customers do all of this on data it has never seen, can't curate by hand, and doesn't own. That flips every lesson.

**Shared findings → vendor implications:**

| Shared finding | ThoughtSpot's version |
| --- | --- |
| Bottleneck = question→entity mapping | The semantic model is the core; the moat is that the data is _already modeled_ |
| Context architecture > model/prompt | Make org-specific context a first-class, customer-authorable, versioned, governed object |
| Accuracy decays without maintenance | Ship the _maintenance loop_ as product surface — drift detection, auto-drafted fixes |
| Personalization matters | Per-tenant + per-user learning from real usage |
| Trust is a feature | Provenance, freshness, "why this answer," failure reasons |

**The two paths don't apply to a vendor** the way they apply to a lab. You can't pick one _for_ the customer — they arrive at different points. The product job is: **make curation nearly free, and make navigation governed.** Auto-generate a candidate semantic model from existing tables, pipeline code, and query history; human-in-the-loop reviews rather than authors.

**Where to push:**

1. From "ask → chart" to **"ask → investigate"** (Meta's root-cause loop). Retrieval is table stakes; iterative reasoning is the differentiator.
  
2. **Sell the data team a new job** — from writing SQL to curating the agent. The most defensible product may be the **agent-curation console**, not the consumer ask-bar.
  
3. **Skills/recipes as governed, shareable artifacts** — a marketplace/library + switching cost.
  
4. **Self-healing semantic layer** — drift detection, correction-mining, CI-style enforcement. This is where the 95→65% lesson becomes a feature you charge for.
  
5. **The flywheel is the moat, not the LLM** — the proprietary corpus of real questions/corrections/feedback is what no lab has.
  

**One-paragraph version:** Don't build a better text-to-SQL bot (commoditizing). Build the **factory + flywheel** — cheap/automatic generation of a governed semantic model, an agent that _investigates_, and a maintenance/eval loop the data team operates as their new core job. ThoughtSpot's unfair advantage is that it _starts_ with a governed semantic layer. The strategic mistake would be chasing model quality (a race against labs you can't win) instead of the foundation and the loop (a race you're already leading).

* * *
## Milestone 6 — How this compares to Data Studio
**Verdict:** Data Studio is essentially the **"factory + maintenance loop" half** of that vision — already made concrete. Same thesis, deliberately narrower scope.

**Where they're the same (a tight match):**

| Vision pillar | Data Studio's version |
| --- | --- |
| BI consumed by humans _and_ agents | Verbatim in the product vision |
| Semantic layer is the unlock | Central object is **a model** — not a project, not a dataset |
| Data team's job shifts to directing/curating the agent | _"Data teams direct; the agent executes."_ Agent-first |
| Accuracy decays → ship the loop | The lifecycle _is_ the loop: connect → build → test/coach → monitor for drift |
| Trust/transparency as a feature | The queued "Anthropic-article builds" — provenance chip, stale flag, unreviewed badge |

**Where Data Studio is actually _ahead_ of the abstract vision** — it has designed the surfaces: **AIRS** (AI-readiness score + actions), **Test mode + coaching** (the human-in-the-loop correction step), **Pulse monitoring** (drift), **notebook-as-lineage-record** (provenance), **dbt import + multi-source scan** (cheap curation, partial).

**Where the vision goes _beyond_ Data Studio (the deltas worth sitting with):**

1. **The consume/investigate half is Spotter's job, not DS's** — by design. DS is the _supply side_ (build the model); the Meta-style investigating agent is the _demand side_.
  
2. **Skills as a second first-class object.** DS's central object is the **model** (the _what_ — entities, joins, metrics). Anthropic skills / Meta recipes are a _different_ artifact: **procedural knowledge** (the _how_). DS has one object; the writeups suggest you need two. **The sharpest open question: is "skill" a Data Studio object or a Spotter object?**
  
3. **Personalization** — no equivalent in DS's vision (it models the data, not the user).
  
4. **Bootstrapping semantics from existing queries/pipeline code** — DS has dbt import + scan, but not "mine the warehouse to _propose_ the model."
  
5. **The flywheel/moat framing** — a strategy lens, not yet a product feature.
  

**One-line distinction:** the vision is the whole stack — supply (curate the model) + demand (an agent that investigates) + the flywheel between them. Data Studio is a well-built slice of the **supply side**: the place a data team curates and maintains the model Spotter consumes.

* * *
## Milestone 7 — Scale, federation, AGI, and the stakes axis
**Trigger:** Anthropic's curate-everything works for one product team, but a Nestlé/Coca-Cola has finance, regional, and brand teams with many abstract org structures — hard to maintain. Does that difficulty favor OpenAI's navigate-chaos approach, and does AGI make it scale?

**The axis correction — it's not era-based, it's stakes-based:**

1. **At a large org the hard problem isn't volume — it's conflicting ontologies.** "Net sales" means different things to finance, a region, and the brand team — each locally true, mutually inconsistent. Anthropic's approach assumes a single canonical model is _achievable_ (true for one team). OpenAI's doesn't pre-canonicalize but defers the cost to query time — the ambiguity doesn't disappear; someone still answers "_which_ revenue?"
  
2. **What AGI actually changes:** it kills the **tedium** (a capable model can read pipeline code, infer semantics, draft/maintain docs) — genuinely moving the equilibrium toward navigation. But it does **not** dissolve the need for canonical decisions, because _"what counts as an active customer" is a definitional/political problem the business decides, not a reasoning problem._ The agent can only ask or pick — and picking is exactly the accountability you can't hand to a machine in regulated reporting. You can't tell an auditor "the AGI decided what revenue means."
  

**Synthesis — permanent stakes-based coexistence:**

- **Navigate** the long tail (exploratory, low-stakes) — AGI makes this much better.
  
- **Curate** the contested core (regulated, board-level, definitionally political) — big orgs have _more_ of this, not less.
  

**The large-org answer is neither pure path — it's federated curation: curate locally, navigate globally.** Many local canonical models (finance owns theirs, each region owns theirs); the agent navigates across them, resolving conflicts contextually. AGI shrinks the curation labor to almost nothing; what's left for humans is **owning the contested definitions and vouching for them.** The semantic layer doesn't vanish — it gets _thinner and more political._

* * *
## Milestone 8 — What a skill is and where it sits
Most platforms conflate three different objects:

| Object | Question it answers | Analogy |
| --- | --- | --- |
| **Model** (semantic layer) | _What does this mean?_ — entities, metrics, joins, definitions | The **nouns** |
| **Skill** (recipe/cookbook) | _How do I reason about this?_ — procedure + caveats + guardrails | The **verbs + judgment** |
| **Memory** | _Who's asking and what do they usually mean?_ | The **adaptation** |

A **skill** is the part that was never in the schema — tacit analyst know-how: _"to measure retention, use_ `fct_engagement` _not_ `fct_sessions`_, exclude internal accounts, beware nulls in_ `resolution_time`_, sanity-check against the synthetic-control baseline."_ Formally it binds five things: a **trigger** (when it applies), a **procedure** (steps/queries/tools), **constraints** (validation rules, what _not_ to do), **provenance/owner**, and **examples**.

**Where it sits — the punchline:** between the model and the agent, and it is **the unit of federation.** Each org structure — finance, a region, a brand team — owns its **skill pack** layered over shared base models.

> Skills are how you do "curate locally, navigate globally." Each team curates its procedural doctrine; the agent composes skills across teams at query time. Because a skill has an _owner, a version, and a review_, it's the artifact that carries **human accountability while remaining machine-consumable** — the bridge between the accountability we value now and the scale we want later.

**In Data Studio terms:** a skill is a **sibling first-class object to the model.** Model = the data's structure. Skill = the team's analytical doctrine over that structure. Spotter consumes both. (This resolves the open question from Milestone 6 — skill is a Data Studio object, owned alongside the model.)

* * *
## Milestone 9 — The form, aesthetic, and dimensions of the future data platform
The platform stops being a **warehouse** (store → browse → query — the grid-of-assets aesthetic) and becomes a **studio** (raise → coach → tend). The name "Data Studio" already points at the right metaphor.

**The objects:** Sources (federated, never fully tamed) → Models (local-canonical, owned) → Skills (procedural doctrine, owned, composable) → Memory (personalization) → Agents (compose all of it) → the connective tissue: the **trust/eval loop** (provenance, drift, freshness, sign-off).

**The dimensions (axes it's organized along):**

- **Stakes** (exploratory ↔ regulated) — _the_ master axis; decides curate-vs-navigate and how much sign-off is required, per surface.
  
- **Ownership/federation** (central ↔ domain ↔ region) — Conway's law rendered as schema topology.
  
- **Consumer** (human ↔ agent).
  
- **Abstraction** (raw → entity → metric → narrative answer).
  
- **Time** (live ↔ historical; decay over time).
  

**The aesthetic — five commitments:**

1. **From storage to stewardship** — a system you _tend_; health/decay over time (AIRS, Pulse) is the main view, not the moment of construction.
  
2. **Trust is ambient and legible** — every answer carries its receipts (provenance, freshness, confidence, owner). You can trace "why did it say this" to model + skill + source + the human who vouches for each.
  
3. **Formality modulates with stakes** — high-stakes surfaces look austere, gated, signed-off (like a financial statement); low-stakes exploration looks fluid, fast, disposable. One product, two registers.
  
4. **Two faces, one system** — a consumer face (Spotter: calm, answer-first, investigates) and a curator face (Data Studio: dense, structural, the workshop).
  
5. **The federation is a visible map** — domains, models, skills, owners; where definitions conflict, lit up in red. Tribal knowledge becomes a navigable object.
  

**One-line form:** a future data platform is a **stewardship surface for a federation of owned semantic models and skill packs, consumed by agents, where every answer is accountable down to a named human, and the whole thing modulates its formality by stakes.**

* * *
## Milestone 10 — "Catalog is all you need" and the warehouse power dynamic
**The challenge:** dbt's thesis is "catalog is all you need," but the data still lives in the warehouse. It's wishful that warehouses will _let_ an independent catalog win — they'll build catalog capabilities and win it themselves.

**The sharpening — the thesis being right is what dooms the independent.** "Catalog is the control point" is correct, which is exactly why the warehouses adopted it: Databricks bet on **Unity Catalog** (then open-sourced it + bought Tabular); Snowflake built **Horizon** + **Polaris/Open Catalog** + **Cortex Analyst**. When the platform underneath you adopts your thesis, the catalog stops being a moat and becomes a knife fight you bring a catalog to and they bring data + compute + the customer's budget.

**Two complications to "the warehouse just wins":**

1. **The catalog's only durable moat is spanning warehouses — and big orgs are never single-warehouse** (the Nestlé point). The warehouse _structurally cannot_ win cross-warehouse neutrality, because neutrality is the opposite of lock-in. So the catalog wins _across_ warehouses, loses _within_ one. (dbt+Fivetran is a bet on that seam.)
  
2. **Iceberg is moving the data gravity** that made the warehouse win. If data sits in open Iceberg tables in the customer's bucket, gravity weakens and the _catalog_ becomes the control point — which is why everyone's fighting to _be_ the catalog. It validates dbt's thesis and reshuffles the winner at once.
  

**Different layers, different fates:**

| Layer | What it is | Who wins it | Why |
| --- | --- | --- | --- |
| **Catalog** (governance/metadata/lineage) | discovery, permissions, freshness | **Warehouse wins** | Tied to data + compute + security |
| **Semantic layer** (what "revenue" means) | metrics, entities, definitions | **Contested** | Could collapse _down_ into the warehouse or _up_ into BI |
| **Skills + agentic consumption + accountability** | doctrine, the investigating agent, trust loop | **Up for grabs — warehouses worst at it** | Product/experience DNA, not infra DNA |

**The move for ThoughtSpot:** don't own the catalog/semantic layer — **consume** it. Own the layer value migrates _to_ when the lower layers commoditize: skills/doctrine, the investigating agent, accountability, the cross-warehouse trust loop. **"Catalog is all you need" is true — which is exactly why catalog is the wrong thing to own.**

**The risk to interrogate:** this only holds if ThoughtSpot's semantic layer (worksheets/TML, the agentic semantic layer) is positioned as a _consumption-side composition + doctrine layer_, not as a rival warehouse-grade semantic layer. If it's the latter, you're in dbt's fight. Which one DS's "model" actually is today is the question that should anchor the roadmap.

* * *
## Milestone 11 — Is the thesis true for the whole sector?
**Verdict: conditionally true. The dividing line is one variable — do you own the data platform beneath you?** The sector is visibly bifurcating.

**Camp A — integrated giants _double down_ on owning the semantic layer** (it's the agent's grounding and they have the data gravity to defend it):

- **Microsoft / Power BI + Fabric** — Copilot depends entirely on the semantic model; Microsoft is _strengthening_ it (synonyms, description overrides, sample questions). Owns warehouse + catalog + semantic + BI + agent in one SKU, with universal distribution.
  
- **Salesforce / Tableau Next** — built **Tableau Semantics** (AI-infused semantic layer) wired into Data Cloud, backed by the **Agentforce Trust Layer**.
  
- **Google / Looker** — repositioned **LookML as the source of truth** for Gemini Conversational Analytics. Looker-the-semantic-layer matters more; Looker-the-BI-tool less.
  
- **Databricks (Unity + Genie) / Snowflake (Cortex Analyst + semantic views)** — same playbook from the warehouse side.
  
- For Camp A the thesis is **false/inverted** — owning the semantic layer _is_ the moat.
  

**Camp B — independents _consume_ warehouse semantics and differentiate above:**

- **Sigma** — the cleanest proof. Native integration with **Snowflake Semantic Views**; "semantic logic defined once, governed centrally in the warehouse"; agents inherit warehouse RLS/CLS. Explicitly refuses to own the semantic layer.
  
- **Hex, Omni, Mode (now ThoughtSpot), Metabase** — warehouse-native consumption layers, none defending a proprietary warehouse-grade semantic layer.
  
- For Camp B the thesis is **true** — it's the survival strategy.
  

**dbt** — contested; trying to _be_ the cross-warehouse semantic layer; squeezed from both sides.

**The corrections the sector data forces:**

1. **The real threat to independents isn't "the semantic layer commoditizes" — it's "the _agent_ commoditizes via bundling."** Microsoft ships Copilot, Google ships Conversational Analytics, Salesforce ships Tableau Next agents, Databricks ships Genie — all "good enough," all included in a platform already paid for. So an independent can't differentiate on _having_ an agent; the experience must be dramatically better or get bundled out.
  
2. **The durable wedge is cross-platform neutrality** — the one thing the giants structurally cannot do (Copilot grounds on Fabric, Looker CA on BigQuery, Cortex on Snowflake; none will be neutral because neutrality kills lock-in). Serving the Nestlé heterogeneity (Snowflake _and_ Databricks _and_ BigQuery _and_ the SAP/Salesforce sprawl) is the moat.
  

**Bonus validation:** the whole sector is independently inventing "skills." Power BI's Copilot metadata = synonyms + description overrides + sample questions; Tableau calls it "agent enrichment." Everyone's bolting a procedural/semantic-doctrine layer onto the raw model — validating the skill object from Milestone 8. The giants build skills _platform-locked, inside their semantic layer_. The independent's opening: **portable, cross-platform skills** — doctrine that travels across warehouses, which a Fabric-locked skill never can.

**ThoughtSpot's position:** squarely Camp B → the thesis holds. Caveat: Camp B's future rides on two things the giants can't easily copy — **experience superiority and cross-platform neutrality.** Structural disadvantage: distribution (Microsoft is already installed). Structural advantage: agent-first and neutral before the giants were either.

* * *
## Milestone 12 — The general-purpose agent pincer
**The challenge:** the Camp B wedge is also being attacked by general-purpose agents (Claude, ChatGPT, Gemini) that reach data directly via MCP, reason better than any wrapped BI model, and live where the user already is.

**It's a pincer — squeezed from below (warehouse bundling) and above (horizontal agents).** A knowledge worker can point Claude/ChatGPT at a warehouse over MCP and get text-to-SQL + investigation + charts + narrative without opening a BI tool. The frontier labs proved it — _the article that started this study is Anthropic demonstrating that Claude + a context layer IS the analytics agent._

**This kills part of the thesis: the agent — specialized or general — is not the durable layer. Value is migrating off the agent entirely.** "We have a great analytics agent" is dead as a wedge: warehouses, frontier labs, and the BI vendor will all have one, and two of those three are better positioned than the BI vendor.

**The asymmetry:**

- **Camp A giants are immune** — their general agent _is_ their BI agent (Copilot, Gemini, Agentforce). Vertical alignment, no conflict.
  
- **Frontier labs are the new attacker** from the horizontal/consumer side.
  
- **Camp B independents are most exposed** — bundled below, disintermediated above.
  

**What survives the pincer (narrower than "BI"):**

1. **Governance, permissions, accountability — the system of record for trust.** Enterprises won't let a general agent roam the warehouse ungoverned (who can it see, what RLS/CLS, is it auditable, can finance certify?). The governed layer is the thing the general agent must go _through_, not replace. Strongest durable position.
  
2. **The context + skills/doctrine + correction loop — agent-neutral.** A bare general agent on a raw schema hits the "concept-to-entity ambiguity" failure. It's accurate only if fed the semantic layer + skills + accumulated corrections. **That context is the asset, and it should feed Spotter _and_ Claude-via-MCP equally.** (What ThoughtSpot's `spotter-code` MCP implicitly bets on.)
  
3. **The operational / embedded last mile.** General agents win _ad hoc, one-off_. They're weak at maintained dashboards, scheduled monitoring (Pulse), alerting, embedding at scale, and serving thousands of governed self-service users.
  

**The stakes axis returns:** general-purpose agents win the low-stakes, ad-hoc, exploratory long tail ("poke around, get a chart"). The governed platform holds the high-stakes, operational, embedded, must-tie-to-the-penny, audited core. The wedge isn't eliminated — it _relocates_ and gets smaller.

**The strategic move — and its trap.** Don't out-agent the frontier labs (you'll lose). Become the **governed, neutral, accountable layer every agent — yours, the warehouse's, and the general-purpose ones — must go through to touch enterprise data safely.** Be infrastructure to the agent ecosystem; expose the semantic+skill+governance layer over MCP and win regardless of where the question is asked. **The trap:** if you become _only_ the MCP server / context API, the general agent captures the user relationship and you're dbt one level up. So hold **both** ends — the governed context layer _and_ a sticky destination experience (Spotter, dashboards, embedded). Own the trust + operational + doctrine trifecta, which accumulates institutional memory and audit history and therefore _compounds_.

* * *
## Closing synthesis — the through-line
Reading the milestones in sequence, the argument tightens to one resolution:

1. Across every internal team (Anthropic, OpenAI, Meta, Pinterest, Uber, Netflix), SQL generation is not the bottleneck — **question→entity mapping** is, and the work that compounds is **the data foundation + the eval/correction loop.**
  
2. For a _vendor_, that means building the **factory** (cheap governed curation) **+ the flywheel** (the loop), not a better bot. Data Studio is the well-built supply-side slice of this.
  
3. At _large-org scale_, there is no single canonical model — there are many locally-true, conflicting ones. The answer is **federated curation: curate locally, navigate globally**, with **skills as the unit of federation** and the artifact that carries accountability.
  
4. **AGI doesn't remove accountability** — it removes the _tedium_. The contested, political, regulated definitions still need a named human owner. So curate-vs-navigate is **stakes-based and permanent**, not era-based.
  
5. The **catalog/semantic layer commoditizes down** into the warehouse (the warehouses agree with dbt's thesis, which is what dooms the independent catalog). Don't own it — consume it.
  
6. The **agent commoditizes** too — bundled by the giants from below, and by general-purpose agents from above.
  
7. So the only defensible independent position is the constant of the whole study: **governed, accountable, agent-neutral context + skills/doctrine + the operational/embedded last mile + the eval loop that keeps it true.** Humbler than "the next great BI tool" — it's "the trust-and-context substrate for analytics, whoever's agent is on top."
  

> **The model is commoditizing. The agent is commoditizing. The only thing that compounds is governed, accountable context and the loop that keeps it true.**

* * *
## Implications for Data Studio (open questions to carry forward)
- **Is "the model" a consumption-side composition+doctrine layer, or a rival warehouse-grade semantic layer?** (Milestone 10.) This single positioning choice decides whether DS is defensible or in dbt's fight.
  
- **Make "skill" a first-class object alongside the model** — owner, version, review, trigger/procedure/constraints/examples; composable into per-domain skill packs. (Milestones 8–9.) Highest-leverage unbuilt concept.
  
- **Design for federation explicitly** — local-canonical models per domain/region, a visible conflict map, accountability down to a named human. (Milestone 9.)
  
- **Position the agent as neutral infrastructure** — expose the governed semantic+skill layer over MCP so it feeds Spotter _and_ third-party general agents; but hold a sticky destination experience to avoid disintermediation. (Milestone 12.)
  
- **Lean into the operational/embedded + high-stakes core** — the part general agents can't take. (Milestone 12.)
  
- **Treat the correction/eval loop as the compounding asset** — the queued provenance chip / stale flag / unreviewed badge are the first bricks; the flywheel of real corrections is the moat. (Milestones 1, 5, 6.)
  

* * *
## Appendix — reading list (links)
**AI analytics agents (first-party):**

- Anthropic — How Anthropic enables self-service data analytics with Claude: [https://claude.com/blog/how-anthropic-enables-self-service-data-analytics-with-claude](https://claude.com/blog/how-anthropic-enables-self-service-data-analytics-with-claude)
  
- Meta — Inside Meta's Home-Grown AI Analytics Agent: [https://medium.com/@AnalyticsAtMeta/inside-metas-home-grown-ai-analytics-agent-4ea6779acfb3](https://medium.com/@AnalyticsAtMeta/inside-metas-home-grown-ai-analytics-agent-4ea6779acfb3)
  
- Pinterest — How we built Text-to-SQL at Pinterest: [https://medium.com/pinterest-engineering/how-we-built-text-to-sql-at-pinterest-30bad30dabff](https://medium.com/pinterest-engineering/how-we-built-text-to-sql-at-pinterest-30bad30dabff)
  
- Pinterest — Unified Context-Intent Embeddings for Scalable Text-to-SQL: [https://medium.com/pinterest-engineering/unified-context-intent-embeddings-for-scalable-text-to-sql-793635e60aac](https://medium.com/pinterest-engineering/unified-context-intent-embeddings-for-scalable-text-to-sql-793635e60aac)
  
- Uber — Unlocking Financial Insights with Finch: [https://www.uber.com/blog/unlocking-financial-insights-with-finch/](https://www.uber.com/blog/unlocking-financial-insights-with-finch/)
  
- Salesforce — How We Built a Text-to-SQL AI Agent: [https://www.salesforce.com/blog/text-to-sql-agent/](https://www.salesforce.com/blog/text-to-sql-agent/)
  

**Foundations / analytics engineering:**

- Netflix — Part 1 (DataJunction, LORE, CEA): [https://netflixtechblog.com/part-1-a-survey-of-analytics-engineering-work-at-netflix-d761cfd551ee](https://netflixtechblog.com/part-1-a-survey-of-analytics-engineering-work-at-netflix-d761cfd551ee)
  
- Netflix — Part 2 (measurement & causal inference): [https://netflixtechblog.com/part-2-a-survey-of-analytics-engineering-work-at-netflix-4f1f53b4ab0f](https://netflixtechblog.com/part-2-a-survey-of-analytics-engineering-work-at-netflix-4f1f53b4ab0f)
  
- Netflix — Part 3 (design, APIs, keynote): [https://netflixtechblog.com/part-3-a-survey-of-analytics-engineering-work-at-netflix-e67f0aa82183](https://netflixtechblog.com/part-3-a-survey-of-analytics-engineering-work-at-netflix-e67f0aa82183)
  
- Shopify — Introducing ShopifyQL: [https://shopify.engineering/shopify-commerce-data-querying-language-shopifyql](https://shopify.engineering/shopify-commerce-data-querying-language-shopifyql)
  

**Framing piece:**

- Two Paths to Agentic Analytics (Hands-On Data): [https://handsondata.substack.com/p/two-paths-to-agentic-analytics-anthropics](https://handsondata.substack.com/p/two-paths-to-agentic-analytics-anthropics)
  

**Sector / semantic-layer landscape:**

- Power BI Copilot + semantic models: [https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-semantic-models](https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-semantic-models)
  
- Salesforce — Tableau Next announcement: [https://www.salesforce.com/ap/news/press-releases/2025/04/22/salesforce-redefines-business-intelligence-with-tableau-next-ai-agents-transform-how-businesses-turn-data-into-action/](https://www.salesforce.com/ap/news/press-releases/2025/04/22/salesforce-redefines-business-intelligence-with-tableau-next-ai-agents-transform-how-businesses-turn-data-into-action/)
  
- Tableau Semantics: [https://www.salesforce.com/analytics/tableau-semantics/](https://www.salesforce.com/analytics/tableau-semantics/)
  
- Looker Conversational Analytics: [https://docs.cloud.google.com/looker/docs/conversational-analytics-overview](https://docs.cloud.google.com/looker/docs/conversational-analytics-overview)
  
- How Looker's semantic layer enhances gen AI trustworthiness: [https://cloud.google.com/blog/products/business-intelligence/how-lookers-semantic-layer-enhances-gen-ai-trustworthiness](https://cloud.google.com/blog/products/business-intelligence/how-lookers-semantic-layer-enhances-gen-ai-trustworthiness)
  
- Sigma — native Snowflake Semantic Views integration: [https://www.sigmacomputing.com/resources/announcements/sigma-launches-native-semantic-layer-integration-and-ai-sql-capabilities-on-snowflake-ai-data-cloud](https://www.sigmacomputing.com/resources/announcements/sigma-launches-native-semantic-layer-integration-and-ai-sql-capabilities-on-snowflake-ai-data-cloud)
  
- Semantic Layers in 2025 playbook (Coalesce): [https://coalesce.io/data-insights/semantic-layers-2025-catalog-owner-data-leader-playbook/](https://coalesce.io/data-insights/semantic-layers-2025-catalog-owner-data-leader-playbook/)
