# Data agents in the wild — competitive research

_Two deep-research passes (2026-07-10 + 2026-07-11), merged. Lens: Data Studio is a **build-side** data agent (messy → reliable → AI-ready dataset + keep the loop trustworthy as data decays). Question: through that lens, what do the market's "data agents" actually do, and where do they fall short? Grounded in primary docs + practitioner reviews; every claim adversarially verified (pass 1: 21/25 confirmed · pass 2: 20/25 confirmed; 9 refuted claims excluded)._

Tools covered: **Snowflake Cortex** (Analyst + Agents + Semantic View Autopilot) · **Databricks AI/BI Genie** (+ Genie Code) · **Hex** (Magic / Notebook Agent) · **Sigma** (Ask Sigma + Data Model Agent) · **Omni** (AI Assistant + Modeling Agent). ThoughtSpot Spotter = incumbent context.

---

## Headline

**All five competitor agents are CONSUME-side.** They answer natural-language questions against a semantic layer **a human already built** — they *presuppose* the build work as a manual prerequisite. Every vendor's own docs say so:

- **Genie**: accuracy is "directly proportional to Unity Catalog metadata quality"; humans must pre-join tables into views/metric views (**30-table cap**), author verified example SQL, and curate Trusted Assets via a manual "Iteration 0→5" loop.
- **Cortex Analyst**: only joins relationships explicitly encoded in a hand-built **YAML semantic model**; can't read VARIANT/ARRAY/OBJECT without manual `LATERAL FLATTEN`; won't infer undefined joins.
- **Sigma Assistant / Omni Assistant**: need hand-written field descriptions, aliases, aggregation rules, and AI-context before answering reliably; Omni works only on curated "Topics."
- **Hex** (now confirmed, pass 2): its own guide says the agent "performs better when it has access to data that is **clean, curated, and contextual**" and instructs "**Do not blindly trust outputs; always read the SQL or Python before relying on it.**" All four stated capabilities are consume-side.

**BUT (pass-2 update): the white space is narrowing at the semantic-modeling layer.** Omni, Sigma, Databricks and Snowflake have all shipped dedicated model-*building* agents in the last ~15 months (see Gap 2). None of them, however, touch source-data prep/quality — and none detect decay.

**The core failure mode is trust rooted in bad/unmodeled data.** Text-to-SQL accuracy collapses from **~80–91% on academic benchmarks** to **~10–21% on real enterprise warehouses**. Snowflake's own raw-LLM test: **51% — "every second answer wrong, fluently."** Databricks' own study: Genie scored **0% out of the box on a realistically messy schema.** Failures are *plausible*: semantically-wrong joins, wrong time-windows, metric misinterpretation — they look right and pass unnoticed.

> **The two genuinely open zones:** (a) **source-data prep/quality** — ingest, profile, clean, transform, test — no competitor agent touches it; (b) **decay/staleness detection** — re-verifying the model as schema and business definitions drift — absent everywhere, roadmap at best.

---

## The four priority gaps (pass-2 deliverables)

### Gap 1 — Hex: confirmed consume-side (high confidence, was under-evidenced)
Hex's own retrospective scopes the Notebook Agent to "generate SQL, charts, and Python" to answer questions. Its best-practices guide presupposes clean, curated, documented data and puts verification on the human ("always read the SQL or Python"). Capabilities listed: agentic search, building a plan, executing analysis, summarizing results — all consume-side. **Caveat:** the current (post-2025) agent *can* do limited ad-hoc cleaning **on request** — "identify nulls, flag outliers, or standardize formats" — but that's user-directed code-gen inside a notebook, not autonomous build-side prep. (Do **not** use the stronger framings "Hex's agent failed at the data-context step" or "Hex requires a manual curation loop" — both refuted in verification.) *Residual gap: independent practitioner sentiment on Hex is still thin; findings rest on Hex's own docs.*

### Gap 2 — Dedicated modeling agents: real, new, and human-gated
The build-side white space **is being probed at the semantic layer**:
- **Omni Modeling Agent** (Apr 9, 2026) — "point it at your tables and it defines views, relationships, dimensions, and measures from your database schema." Runs in three modes: **Sandbox / Review / Auto** — all human-oversight-centric.
- **Sigma Data Model Agent** (~May 6, 2026) — queries the warehouse live for tables/columns/types/relationships; proposes facts vs. dimensions and join keys; "never guesses or assumes column names." Sigma verbatim: "**this agent is not fully autonomous… Every meaningful action — creating a model, making a structural change, generating a semantic view — requires you to confirm before anything happens.**"
- **Databricks Genie Code** (Mar 2026) — auto-launches at agent creation, reads the data, *suggests* table descriptions + example queries ("accept the ones you want to keep").
- **Snowflake Semantic View Autopilot** (~June 2025) + semantic-model-generator — auto-generates semantic views/descriptions.

**Limits:** all are scoped to the **semantic layer only** — none ingest, profile, clean, transform, or run data-quality tests on raw source data (Omni is warehouse-first: data must be ETL'd into a warehouse *before* Omni can touch it). All keep the human as the mandatory approval gate. And **there is essentially no evidence yet on how well they perform on messy real-world schemas** — the vendor posts don't claim it, and no practitioner accuracy account survived verification. No longitudinal production track record (all < 15 months old).

### Gap 3 — Cost of the manual curation loop: quantified, by the vendors themselves
- **Databricks' own study (admission against interest):** on a deliberately messy schema (tables named `cmp`, `proc_delta`, `uid_seq`), Genie scored **0% — "couldn't answer any of our 13 benchmark questions correctly."** Reaching 100% took **~6 sequential human iterations**: rename tables/columns → write UC descriptions → add PK/FK constraints → enable value dictionaries → author example SQL → write domain-rule instructions. Plus a hand-built **10–20-question SME-validated benchmark suite**. "Expect to iterate… not a one-time configuration."
- **Independent corroboration (Syren):** 53% out of the gate → 100% only after "we annotated everything in Unity Catalog"; the metadata work "**cannot be bypassed or automated**" — "no number of instructions will save you."
- **Snowflake:** "Crafting this semantic model is tough"; even its Mar-2025 agentic improvements concede "some parts still need manual work" (relationships, metrics, custom instructions). *Time-sensitivity: Snowflake has since shipped auto-generation (Autopilot) — don't claim zero auto-gen in 2026.*
- **Recurrence** is directly implied (iterate on testing/usage, forever) but **not yet measured in hours** — open question.

### Gap 4 — Decay detection: absent everywhere
No agent announcement or guide describes detecting schema drift, new columns, stale metadata, or changed business definitions. Databricks monitoring is human-feedback-driven — "**no automatic drift detection… no automated alerts for schema changes, stale metadata, or evolving business definitions.**" Omni's "usage-driven model suggestions" are **explicitly future roadmap**. Nuance (the one 2-1 vote): Omni ships a *reactive* Content Validator that flags **broken references** after a schema refresh — reactive breakage detection, not proactive staleness/definition-drift detection. **The "continuously improve the loop as data decays" half of the thesis is genuinely unowned.**

---

## Per-tool summary

**Snowflake Cortex Analyst** — Text-to-SQL over a YAML semantic model. Markets "90%+" — but that presupposes the human-curated model; Snowflake's own raw-LLM baseline was **51%** on ~150 real BI questions, and it admits benchmark schemas "don't represent the complex, messy… schemas common in BI tasks." Concedes join-path hallucinations / fan & chasm traps "fundamentally compromise trustworthiness." Can be business-wrong while syntactically right (forecast-accuracy as %-diff vs. absolute variance). No VARIANT/ARRAY/OBJECT. **Build-side move:** Semantic View Autopilot (~Jun 2025) auto-generates semantic views — semantic layer only.

**Databricks AI/BI Genie (+ Genie Code)** — NL Q&A over Unity Catalog; quality "directly proportional" to metadata quality. **0% → 100% only via ~6 manual curation iterations + hand-built benchmark suite** (their own blog). 30-table cap forces manual prejoining. Practitioner verdict (SunnyData): "a high-reward, high-preparation tool. It's not a magic wand for messy data… If your metadata is weak, Genie hallucinates. If your metadata is strong, Genie reasons." **Build-side move:** Genie Code auto-suggests descriptions + example queries at creation (human accepts).

**Hex (Magic / Notebook Agent)** — Consume-side Q&A/code-gen inside the notebook (agentic search → plan → execute → summarize). Presupposes clean, curated, documented data; verification is on the human. Can do limited **user-directed** cleaning on request (nulls, outliers, formats). No profiling, no drift/staleness anything. Independent practitioner sentiment still thin.

**Sigma (Ask Sigma + Data Model Agent)** — Assistant answers over a modeled layer with manual "AI context" (aliases, table routing, metric + aggregation rules). **Build-side move:** Data Model Agent (~May 2026) proposes facts/dims/join keys from live warehouse metadata — every meaningful action human-confirmed (their words).

**Omni (AI Assistant + Modeling Agent)** — Assistant works only on curated Topics with hand-written descriptions; firsthand review: wrong ~1 in 5 once stretched; docs concede "**Omni currently doesn't offer a way to test the accuracy of responses.**" **Build-side move:** Modeling Agent (Apr 2026) generates views/relationships/dims/measures — **Sandbox / Review / Auto** modes, human-gated; warehouse-first (no source-data prep); decay suggestions = roadmap.

---

## Comparison — agent capability by pipeline stage

Legend: ✓ real capability · ◑ partial / query-time-only / suggestion-with-human-gate · ✗ not done (manual prerequisite)

| Stage | Cortex (+Autopilot) | Genie (+Code) | Hex | Sigma (Ask + Model Agent) | Omni (Asst + Modeling Agent) |
|---|---|---|---|---|---|
| **Ingest** source data | ✗ | ✗ | ✗ | ✗ | ✗ (warehouse-first) |
| **Profile** raw data / DQ scan | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Clean** / standardize | ✗ (no VARIANT) | ✗ | ◑ on-request in notebook | ✗ | ✗ |
| **Transform** | ◑ query-time SQL | ◑ query-time SQL | ◑ authoring SQL/Py | ◑ query-time | ◑ query-time |
| **Model** (joins, grain) | ◑ Autopilot, human-gated | ◑ Genie Code suggestions | ✗ | ◑ Model Agent, human-gated | ◑ Modeling Agent, human-gated |
| **Semantic layer** | ◑ generated, human-approved | ◑ suggested descriptions | ✗ | ◑ proposed, human-confirmed | ◑ generated, human-gated |
| **Test / DQ verify** | ✗ | ◑ manual benchmark suite | ✗ (human reads the SQL) | ✗ | ✗ (docs: no way to test) |
| **Decay detection** | ✗ | ✗ (no drift detection) | ✗ | ✗ | ✗ (reactive validator only; roadmap) |
| **Consume** (NL Q&A) | ✓ | ✓ | ✓ | ✓ | ✓ |

Everything still clusters at **Consume**. The **Model/Semantic rows moved from ✗ to ◑ in the past year** — that's the narrowing. **Ingest / Profile / Clean / source-Transform / agent-driven Test / Decay remain untouched.**

---

## Done well vs. still done manually

**What the agents do well (and users like):**
- Fast NL Q&A for business users **once a good model exists**.
- Query-time SQL generation across an already-curated, described set of tables.
- Notebook code-gen (Hex) as an analyst accelerant inside an analysis.
- **New:** first-draft semantic artifacts (views, dims, measures, join proposals, descriptions) — with a human approving every meaningful action.

**What people still do manually (the pain):**
- **Ingesting & cleaning** messy source data — untouched by all.
- **Profiling** for quality (nulls, dupes, coverage, cardinality) — untouched.
- **Modeling judgment**: verifying the proposed joins/keys/grain are *right* (agents propose; no evidence they're right on messy schemas).
- **The curation grind**: descriptions, aliases, metric definitions, example SQL, Trusted Assets — 0%→100% only through human iterations; "cannot be bypassed or automated."
- **Testing/verifying**: hand-built SME-validated benchmark suites; Omni admits no test capability; Hex tells you to read the SQL yourself.
- **Detecting decay** — nothing proactive anywhere; re-verification entirely manual.

---

## The accuracy cliff (why the build side is worth money)

- Frontier models: **86–91% Spider 1.0 → 10–21% Spider 2.0** (real enterprise DBs).
- MIT **BEAVER**: execution accuracy "on average **64.4% lower** than Spider" on real warehouse data; best model 11.4%.
- Snowflake's raw-LLM baseline on ~150 real BI questions: **51%**; 90%+ only *with* the human-curated semantic model.
- Databricks Genie on a messy schema: **0% out of the box → 100% only after ~6 human curation iterations.**
- Human-supplied join/schema hints roughly **3× accuracy** (≈10% → 30.1%) — still far below benchmark. The build-side work moves the needle; nobody's agent does it end-to-end.

Why it's dangerous: hallucinations are **plausible** — a fan-out join silently triples a 3-item order's revenue and "nobody noticed because nobody saw the SQL." One team measured **<21% on raw warehouse vs >95% with a governed semantic layer.**

---

## Implication for Data Studio

The research validates the thesis: *"your AI agents are only as good as your data."* Positioning through the merged evidence:

1. **Source-data prep/quality (ingest → profile → clean → transform → test) is uncontested.** No competitor agent touches it — even the new modeling agents start *after* the data is already in a warehouse and reasonably shaped.
2. **Agentic modeling is now contested — differentiate on evidence and correctness.** Omni/Sigma/Genie Code/Autopilot generate semantic artifacts, but there's zero public evidence they're *right* on messy schemas, and everyone hides behind the human gate. Our evidence-backed join proposals (profile → propose-with-coverage/cardinality → preview → approve) is exactly the trust mechanism they lack.
3. **Agent-driven testing is open.** Omni literally admits it can't test; Databricks makes *humans* build the benchmark suite. Our "the agent that built the model turns around and tests it with its Spotter skill — the plan's sample questions become the test suite" fills this directly.
4. **The decay loop is completely unowned** — proactive staleness/drift detection feeding back into re-verification. This is the "continuously improve the loop" half of the thesis and the hardest thing for consume-side vendors to retrofit.
5. **Validation of our autonomy design:** Omni's Modeling Agent ships **Sandbox / Review / Auto** modes and Sigma gates every meaningful action on confirmation — independent convergence on the approve-decisions-not-instructions + autonomy-modes pattern we're designing. We're on-pattern; the differentiators are the *evidence* attached to proposals, the *test loop*, and *decay*.
6. **Speed matters.** The semantic-modeling slice went from open to contested in ~12 months. Source-prep + test + decay won't stay open forever.

---

## Caveats

- **Vendor-heavy evidence base:** strongest findings are vendor docs/blogs — defensible because they're mostly *admissions against interest* (vendors documenting their own agents' failures and manual requirements). Independent practitioner voices are thinner: strongest are SunnyData + Syren (Genie), Dengsoe + knowi (Omni). G2/Gartner pages yielded nothing usable in either pass.
- **Modeling agents are very new** (Omni Apr 2026, Sigma May 2026, Genie Code Mar 2026) — no production track record; existence and scope confirmed, *performance on messy schemas unknown*.
- **Time-sensitivity:** Snowflake now has semantic auto-generation (Autopilot ~Jun 2025) — don't claim zero auto-gen; Genie's table cap rose 25→30; Snowflake shipped join validation + multi-fact support. The picture moves quarterly.
- **Refuted claims (do not use):** "Sigma AI can never build/transform the model" · "Hex's 2023 agent failed precisely at the data-context step" · "Hex requires a manual curation loop (rules file)" · "Sigma Agent can create an entire model in one step, directly narrowing the white space" · "Cortex gives conflicting cross-dept answers" · "Genie hallucinates column names w/o catalog access" · "hidden SQL prevents analysts owning quality" (the plausible-but-wrong danger stands; the causal claim doesn't) · "Omni doesn't claim unattended modeling" as a *refutation* framing (1-2 — its modes are real, see Gap 2).

## Open questions (follow-up candidates)
1. How well do the modeling agents **actually perform on messy schemas**? (Nobody has published the equivalent of Databricks' 0%→100% study for them.)
2. **Recurrence cost in hours** — setup cost is quantified; the ongoing re-curation burden per schema change isn't (largely *because* decay detection doesn't exist).
3. Does **any adjacent tool** (Atlan, Select Star, CI-based scripts) do proactive semantic-staleness detection feeding an agent's trust loop? Found only reactive broken-reference validation.
4. **Independent practitioner sentiment** on the new modeling agents + Hex's current agent (vendor-framing–free) — worth a targeted pass in a quarter when reviews exist.

## Key sources
- Databricks: Genie best practices + set-up + tune-quality + monitor (primary) · "How to build production-ready Genie spaces" (the 0%→100% study) — docs.databricks.com / databricks.com/blog
- Snowflake: Cortex Analyst accuracy engineering blog (51%/90%+) · agentic semantic-model blog — snowflake.com/en/blog/engineering
- Hex: Notebook Agent best practices (primary) · "Bitter lessons building AI in Hex" retrospective — learn.hex.tech / hex.tech/blog
- Sigma: AI-context docs (primary) · "Build with Sigma Agent: data modeling" — help.sigmacomputing.com / sigmacomputing.com/blog
- Omni: docs.omni.co/ai (primary) · "Announcing Omni's Modeling Agent" · Dengsoe firsthand review — omni.co/blog / medium.com/@mikldd
- Academic: BEAVER (arXiv:2409.02038) · Spider 2.0 (arXiv:2411.07763)
- Practitioner: SunnyData Genie production review · Syren Genie guide · Recce "Benchmarks lie" · Mitzu / Definite / colrows on hallucinated joins + the accuracy cliff
