# Data Studio — Builder & Starting Point
_Discussion record · 2026-06-22 · for Tuesday's meeting + Loom prep_

**Purpose:** capture the feedback themes as discussion items so we can talk them through with the team and scope what's in for Tuesday. Nothing here is a decision yet. Open questions are flagged inline as `❓ Q:` items; answered ones are marked **✅ Answered (Vivek)**.

* * *
## 0. The spine — two workflows (Manual + Agentic)
The organizing idea for the Loom (per Vivek): **show two distinct workflows, side by side.**

- **Agentic workflow** — you tell the agent, it does the work. _This is already clear to people_ — keep it, but it's not where the new emphasis goes.
  
- **Manual workflow** — the user drives: brings their own tables, builds on the visual canvas, accepts/rejects changes. **This is the one to emphasize.** Thesis: _it can't be fully agentic_, so the manual path needs to be first-class, not a fallback.
  

Everything below hangs off this spine. The Loom should let a viewer see the same outcome reached **both ways**.
### What the Loom should cover
1. The **starting point** (manual start) — §1
  
2. The **visual builder** — canvas + code alongside, accept/reject — §2
  
3. Easily **preview a data source** that's been added — §3
  
4. Bring **CSV data → ETL it → join with CDW data** — §3
  
5. **Show joins** — visual builder + view — §3
  
6. The **end-to-end modeling loop** (model → context graph → test → publish → learn) — §4
  
### ❓ Open questions
- **❓ Q0.1** In the Loom, are Manual and Agentic **two separate runs** (same outcome, two takes), or **one run that switches modes** mid-flow?
  
- **❓ Q0.2** Which workflow leads the Loom — open with manual (the new emphasis) and then show agentic as the faster path, or vice versa?
  

* * *
## A. Workflow breakdown — 11 critical parts (single user, DE↔DA modes)
**Framing (confirmed by Vivek): it'll be a single user.** One **member of data staff** uses the workspace and flexes between **data-engineer-leaning** and **data-analyst-leaning** work; the **agent is the second party** that fills whichever gap the user can't (or doesn't want to) do by hand. So "shared workspace" = shared between **human and agent**, not two people. In a traditional two-person team these leanings would be _handoffs between people_ — here they're _modes one person moves through_, which is exactly why the agent matters most at the seams.

This breakdown is the master view; §1–§4 drill into specific parts (parts 1–5 ≈ §1–§3, parts 6–11 ≈ §4's loop).

| #   | Part | Leans | What matters / the agent's job | Where it is today |
| --- | --- | --- | --- | --- |
| 1   | **Add data** — multiple source types, or bring a semantic model (incl. dbt); merge a CSV _with_ a semantic model | DE  | Agent scans/profiles sources, suggests relevant tables. **Capability Q below.** | Connections, data browser, dbt import wizard, CSV upload ✅ |
| 2   | **Preview data** (tables) | DA / shared | One-click sample + profile (nulls, types, distributions) everywhere — source, post-transform, post-join (Lakeflow per-node preview) | Table previews ✅; per-node preview new |
| 3   | **Transform** — clean, drop columns, formulas | DE (hygiene) ↔ DA (business formulas) | Agent writes the SQL/transform; **this is where code accept/reject matters most** | Prep transforms ✅ |
| 4   | **Join data** | DE (keys/cardinality) ↔ DA (intent) | DA knows _what_ to join; agent knows _how_ correctly; joins as visual canvas nodes | Joins in build flow ✅; visual join node new |
| 5   | **Validate join** | DE  | The trust gate — row deltas, key coverage %, fan-out/duplication made _visible_ | Validation step in build ✅ |
| 6   | **Testing** | DA  | Does Spotter answer business questions correctly? Build + test concurrent | Test mode (Spotter Q&A + coaching) ✅ |
| 7   | **Publish** | DE / governance | Certification gate — promote to source of truth; unreviewed agent content shouldn't auto-publish | Minimal today |
| 8   | **Use with Spotter** | Business user / DA | The payoff — model serves humans _and_ AI | Downstream (Spotter) |
| 9   | **Learning** | Agent + both | Usage → model-refinement suggestions; who approves the learned change? | Not built |
| 10  | **Editing** | both | Post-publish change control — re-validate, re-test, re-publish; safe edits to a live model | Partial |
| 11  | **Maintenance** | DE  | Drift, freshness, source health; agent monitors + proposes fixes; closes loop back to transform/edit | Pulse monitoring ✅ |
### The critical seams (where the agent earns its keep)
Not all 11 are equal. The parts where work traditionally _changes hands_ — and where trust is won or lost — are the ones to feature:

- **Validate join (5)** — wrong numbers are born here. Make coverage %, row deltas, and fan-out warnings unmissable.
  
- **Publish (7)** — the gate from "draft" to "source of truth." Needs an explicit, human-owned action; agent content stays flagged until reviewed.
  
- **Learning → Editing (9 → 10)** — the closed-loop moment. A learned change must re-enter the same accept/reject + validate + publish path, never silently apply.
  

For a solo member of data staff, these seams are exactly where the agent acts as the missing second pair of hands/eyes.
### Research grounding (3-thread study: role split · collaboration patterns · handoff friction)
**Our "member of data staff" ≈ the _analytics engineer_ (AE)** — the role created precisely to own the contested middle between DE and DA. That maps the 11 parts onto three bands more cleanly than a flat DE/DA split:

- **DE edge (infra):** connect/ingest raw sources, source-freshness, pipeline maintenance — parts 1, 11. The agent _extends_ the user here (they're not a pipeline expert).
  
- **AE middle (home turf — most of the flow):** staging/transform, joins, semantic model, metric codification, model validation, publish — parts 3–5, 7. Where the user lives; where canvas+code matters.
  
- **DA edge (business meaning):** metric _intent_, testing for business correctness, use with Spotter — parts 6, 8. Business owns intent; the model codifies it once.
  

_So the agent reaches toward the DE edge, supports the DA edge, and co-builds the AE middle with the user._

**Collaboration patterns worth borrowing** (Hex, Deepnote, Databricks, Coalesce, dbt):

- **Review gates publish** — Hex blocks publishing until a review is approved → validates our Publish seam (7): explicit, reviewable, human-owned.
  
- **Unit of work = the semantic entity** (dbt = model file, Coalesce = node) → lock/review at the model/node level, not the whole workspace.
  
- **Two modes over one artifact** — visual + code views of the same thing → validates §2 (canvas + code side by side).
  

**Why this matters (the pain DataStudio resolves — strong Loom framing):**

- **Shadow SQL / "two analysts, two answers"** — analysts re-derive logic per report → contradictory metrics. Fix: define the metric _once_ in the model, propagate everywhere.
  
- **Semantic drift** — meaning diverges silently; _no technical alert fires_. Fix: business meaning lives next to the SQL (owner + plain-language definition + tests) → **this is exactly what the Context Graph should power (§4).**
  
- **Engineering backlog** — ad-hoc data requests eat 10–30% of engineering time; agentic self-serve collapses the wait.
  
- **Lineage is the trust-killer when missing** — keep lineage continuously visible; treat **"show the blast radius of this change"** as a core interaction (relevant to Validate (5) + Editing (10)).
  
- **Draft vs. certified** — let users prototype freely, then a low-friction promotion path (review + tests) converges exploration into the governed model instead of fragmenting away from it.
  

_Sources:_ [_dbt — AE vs DA vs DE_](https://www.getdbt.com/blog/analytics-engineer-vs-data-analyst-vs-data-engineer) _·_ [_Hex reviews_](https://learn.hex.tech/docs/collaborate/reviews) _·_ [_dbt Semantic Layer_](https://www.getdbt.com/product/semantic-layer) _·_ [_Snowflake — semantic views_](https://www.snowflake.com/en/blog/engineering/why-we-need-semantic-views/) _·_ [_AtScale — semantic drift_](https://www.atscale.com/glossary/semantic-drift/) _·_ [_Prophecy — analyst backlog_](https://www.prophecy.ai/guides/the-analyst-engineering-backlog-problem-why-alteryx-makes-it-worse) _·_ [_GitLab handbook — AE_](https://handbook.gitlab.com/job-families/marketing/enterprise-data/analytics-engineer/) _·_ [_Select Star — governance_](https://www.selectstar.com/resources/data-analytics-governance)
### ❓ Q (from Vivek): merge a CSV with a semantic model (e.g., dbt)?
Today: CSV → Spotstore table → join with CDW (federated). A dbt model is already a _governed semantic model_. "Merge a CSV with it" = **bring a governed dbt model as a source _and_ enrich/join an ad-hoc CSV onto it** — small local data meeting the governed model. Powerful, but it raises a governance question: joining ungoverned CSV data to a certified model — is the result still certifiable, or a sandbox?

- **❓ QA.1** Support "semantic model (dbt) + CSV" as a first-class add-data path, or keep CSV joins to raw tables only?
  
- **❓ QA.2** If yes, does enriching a governed model with a CSV produce a _new_ (sandbox) model, or modify the governed one (needs re-publish)?
  
### ❓ Other open questions
- **❓ QA.3** All 11 parts in the Loom, or show a subset and name the rest? (11 is a lot for one Loom — the seams in §A would be the spine.)
  
- **❓ QA.4** Single-user confirmed — but do we still _narrate_ the DE/DA leanings ("this is the engineer-y part, this the analyst-y part"), or keep it invisible and just show one smooth flow?
  

* * *
## 1. Starting point — letting the user start "manually"
### What we heard
Consistent, repeated feedback: people want to **start manually**, not be forced into a fully agent-led cold start.
### ✅ Answered (Vivek) — what "manual" means here
Not one thing — a combination, all hybrid (the agent stays available):

- **Mention a table** (e.g. in chat / by name) to seed the build.
  
- **Add a data source _before_ beginning** — a pre-step entry point.
  
- **Add tables from a data browser _while_ building** — mid-flow, on the canvas.
  

So manual = "I bring/choose my tables and steer," with the agent assisting on top rather than driving. This is a **distinct manual workflow** (§0), not just a toggle.
### Why it matters
- First impression. An agentic-only cold start can feel like a loss of control to users who already know their schema.
  
- Manual start ≈ "open the visual builder with my tables," then build directly (links straight into §2).
  
### Still open
- **❓ Q1.2** Do we know _which users_ asked for this and the job they were doing (control vs. speed vs. trust)? Shapes how hard we lean on manual.
  
- **❓ Q1.5** Confirm: manual start = "open the visual builder with my tables loaded," so §1 and §2 are one continuous demo beat? (Reads that way from your notes.)
  
- **❓ Q1.6** For the Loom we'll need to _show_ manual start — we have no manual entry path built today. How polished does it need to be for Tuesday (clickable mock vs. narrated)?
  

* * *
## 2. The visual builder — canvas + code, side by side
### What we heard / ✅ direction (Vivek)
Three ways to build today: **chat**, **Python notebook**, and the **visual canvas** we want to lead with. Your direction:

- The notebook's work should happen on a **visual canvas**; **Python is its code view.** You can operate entirely on the canvas, or drop into code.
  
- **Thesis: it can't be fully agentic → emphasize manual** on the canvas.
  
- **Show code _alongside_ the visual canvas** (not one-primary-one-hidden) — figure out the layout for this.
  
- Agent changes must be **added visually too**, not just as code.
  
### References studied (Vivek flagged these)
- **Databricks Lakeflow Designer** — visual canvas of operators (filter, **join**, transform) as a DAG, drag-and-drop, with a natural-language layer (Genie) to generate/refine transforms. Has a **Visual ↔ Query (SQL) toggle** and an **interactive preview at each node** (input + output data on a sample). All transforms are backed by code (Git-versioned). → _Visual-primary, code is a switchable view, preview-at-each-step is first-class._
  
- **Claude Code desktop app** — per-file **diff view with explicit Accept / Reject; nothing is written until you accept**; you can **edit before accepting** and leave **per-line comments** the agent revises against. → _Explicit accept-before-apply, but code-diff-centric (no visual model)._
  

_Sources: Lakeflow Designer (_[_blog_](https://www.databricks.com/blog/announcing-lakeflow-designer-no-code-etl) _·_ [_docs_](https://docs.databricks.com/aws/en/designer/what-is-lakeflow-designer)_); Claude Code desktop (_[_docs_](https://code.claude.com/docs/en/desktop-quickstart)_)._
### The core tension (the crux)
Requirement: **agent-generated code must be explicitly accepted — not auto-accepted, not silently rejected.** That collides with "canvas is primary":

- **Canvas primary** → code-level accept/reject can't be the main gesture; you accept/reject a **model change** on the canvas and code just reflects it.
  
- **Code primary** → code accept/reject works naturally, but then the canvas is secondary.
  

Second gap: today the notebook is **code-only**. A canvas-primary world needs a **visual representation of the model** to accept/reject _against_ — we don't have that view yet.
### Proposed resolution — grounded in the two references ✅ (Vivek: "yes, has to be added visually too")
Combine Lakeflow's _visual canvas + per-node preview_ with Claude Code's _explicit accept-before-apply_:

- Agent proposes a change → it appears as a **pending/ghosted node on the canvas** (add join, add derived column, split table) **and** as a **Python/SQL diff in the code view, shown side-by-side.**
  
- **One accept gesture applies both**; nothing lands until accepted. You can preview the data at that node before deciding (Lakeflow-style), edit before accepting, or comment (Claude-Code-style).
  
- Canvas stays primary; the code view is the power-user lens and audit trail, not the gatekeeper.
  
### What the canvas could render (candidates)
- **Relationship/ERD graph** — tables + joins (the model's shape).
  
- **Transform/lineage graph** — nodes per step (source → query → join → derived column → staging → model); maps 1:1 onto notebook cells.
  
- **Column-level model view** — columns, types, keys, derived fields + formulas.
  

Notebook cells and canvas nodes are likely **two views of the same lineage** (cell ≈ node) — that framing keeps "code view vs. canvas" coherent.
### Still open
- **❓ Q2.1 (refined)** "Alongside" = **split-screen** (canvas + code both visible at once) or a **Lakeflow-style toggle** (switch between Visual and Code)? Your wording leans split-screen — confirm.
  
- **❓ Q2.2** What does the canvas render — ERD, transform/lineage graph, column-level, or a combination?
  
- **❓ Q2.3** Unit of accept/reject — one change, a grouped batch, or the whole build?
  
- **❓ Q2.4** Does **manual** canvas editing also go through accept/reject, or only **agent-proposed** changes?
  
- **❓ Q2.6** Notebook = _the_ code view of the canvas (same lineage), or a separate artifact that coexists?
  
- **❓ Q2.8** For the Loom, how much of the visual-model-with-diff view is real vs. mock? (Code/notebook view exists; the visual diff is new.)
  

* * *
## 3. Data prep in the builder — preview, CSV→ETL→join, joins
New scope from Vivek's comments. These are builder capabilities the Loom should show, and Lakeflow's per-node preview is a strong reference for all three.
### 3a. Easily preview an added data source
- After a source is added, the user should be able to **see its data immediately** (sample rows, schema) without ceremony.
  
- Reference: Lakeflow shows **input + output preview at each node**. We can do the same at the source node and at every transform/join.
  
### 3b. CSV → ETL → join with CDW data
- Show the full small-data-meets-big-data story: **bring a CSV → clean/transform it (ETL) → join it with CDW (Snowflake) tables.**
  
- We already have mock pieces for this (CSV `csm_account_mapping`, the 4 Snowflake tables, the staging join) — the new ask is to make the **ETL + join visible on the canvas**, not buried in notebook cells.
  
### 3c. Show joins — visual builder + view
- Joins should be a **visible, manipulable object on the canvas** (Lakeflow models join as a first-class operator node) — and also have a detail "view" (keys, cardinality, coverage).
  
### ❓ Open questions
- **❓ Q3a.1** Preview at the **source level only**, or **per-node** (every transform/join) like Lakeflow?
  
- **❓ Q3b.1** Which concrete CSV + CDW tables do we use for the Loom — reuse the existing Customer Health mock (CSV `csm_account_mapping` + 4 Snowflake tables), or a fresh example?
  
- **❓ Q3c.1** Join "view" — how much detail (keys, cardinality, join-key coverage %, preview of joined output)?
  

* * *
## 4. End-to-end modeling loop — the Loom narrative spine
Closes the loop (workflow from a teammate):

1. **Modeling** — build the model (where §0–§3 live).
  
2. **Context Graph** — show how it powers the model's semantics.
  
3. **Testing** — show some part of testing.
  
4. **Publish** — once testing passes, publish.
  
5. **Edit / learn loop** — after publish, how the user edits it and/or how it learns from interactions → loop closes.
  
### Notes per stage
- **Modeling** — anchor with one example carried through the whole Loom.
  
- **Context Graph** — freshest/most-conceptual. Decide what literally goes on screen.
  
- **Testing** — we already have **Test mode** (inline Spotter Q&A + coaching); likely that.
  
- **Publish** — need the affordance + target; minimal today.
  
- **Edit / learn loop** — least defined; "learns from interactions" = usage → model-refinement suggestions.
  
### ❓ Open questions
- **❓ Q4.1** One continuous dataset/model end-to-end, or separate clips per stage?
  
- **❓ Q4.2** Context Graph — what concretely goes on screen, and how much exists vs. needs mocking?
  
- **❓ Q4.3** Testing — existing Test mode (Spotter Q&A + coaching) or something new?
  
- **❓ Q4.4** Publish — target/affordance, and do we have anything today?
  
- **❓ Q4.5** "Learn from interactions" — what mechanism do we depict, and is it _shown_ or _narrated_ this round?
  
- **❓ Q4.6** Which of the 5 stages are "show live" vs. "describe as direction"?
  

* * *
## 5. Scoping for Tuesday (fill in after the questions are answered)
- **In the Loom (shown):** _…_
  
- **In the Loom (narrated only):** _…_
  
- **Discuss on the call, not shown:** _…_
  
- **Parked / later:** _…_
  

* * *
## Open questions — quick checklist
**Spine**

- [ ] 
  
  **Q0.1** Manual & Agentic — two runs or one run that switches modes?
  
- [ ] 
  
  **Q0.2** Which workflow leads the Loom?
  

**Starting point**

- [x] 
  
  ~~Q1.1 Which "manual"?~~ → mention table + add source before + add tables while building (hybrid)
  
- [ ] 
  
  **Q1.2** Which users asked, and what job?
  
- [x] 
  
  ~~Q1.3 Entry point or mode?~~ → both (pre-step + mid-build)
  
- [x] 
  
  ~~Q1.4 Hybrid or fully manual?~~ → hybrid (agent stays available)
  
- [ ] 
  
  **Q1.5** Manual start = "open visual builder with my tables"? (confirm)
  
- [ ] 
  
  **Q1.6** How polished does manual start need to be for the Loom?
  

**Visual builder**

- [ ] 
  
  **Q2.1** "Alongside" = split-screen or toggle?
  
- [ ] 
  
  **Q2.2** What does the canvas render?
  
- [ ] 
  
  **Q2.3** Unit of accept/reject?
  
- [ ] 
  
  **Q2.4** Do manual canvas edits need accept/reject too?
  
- [x] 
  
  ~~Q2.5 Visual diff = code diff, one accept?~~ → yes, must be added visually too
  
- [ ] 
  
  **Q2.6** Notebook = code view of canvas, or separate?
  
- [x] 
  
  ~~Q2.7 Do all three build modes stay?~~ → reframed as 2 workflows (manual + agentic); canvas+code is the builder
  
- [ ] 
  
  **Q2.8** How much visual-model view is real vs. mock?
  

**Data prep**

- [ ] 
  
  **Q3a.1** Preview source-level only or per-node?
  
- [ ] 
  
  **Q3b.1** Which CSV + CDW tables for the Loom?
  
- [ ] 
  
  **Q3c.1** Join view — how much detail?
  

**End-to-end loop**

- [ ] 
  
  **Q4.1** Continuous example or clips per stage?
  
- [ ] 
  
  **Q4.2** Context Graph — what's on screen, real vs. mock?
  
- [ ] 
  
  **Q4.3** Testing — existing Test mode or new?
  
- [ ] 
  
  **Q4.4** Publish — affordance/target, what exists?
  
- [ ] 
  
  **Q4.5** Learn loop — shown or narrated?
  
- [ ] 
  
  **Q4.6** Per-stage: shown live vs. narrated?
