# Data Studio — Maintenance & Monitoring: the workflow pick

_Decision doc · 2026-07-06 · working draft for review_

**What this decides.** The two post-publish workflows of the P3 wedge ("Prove & keep trustworthy") — the **monitoring workflow** (Monitor + Debug) and the **editing / maintenance workflow** (Improve/fix + Edit/expand) — and it resolves the open questions the proposal left: which signals + thresholds, the debug diagnostic dimensions, auto-apply-vs-suggest, the unit of accept/reject, and certify rules.

**Sources.** `2026-06-29-data-studio-proposal.md` (P3), `2026-07-06-vision-loom-transcript.md`, `use-cases.md` (#10), and the committed prior research: `research/monitoring-pov.md`, `research/monitoring-competitive-landscape.md`, `research/agent-observability-hex-omni-sigma.md`, `research/ai-readiness-score.md`, `research/test-mode-*`, `research/data-prep-workflow.md`, `research/plan-mode.md`, `knowledge/platform.md`, plus a code inventory of the current prototype.

---

## TL;DR

**Monitoring — "Trust Pulse."** Monitoring lives *inside each model* as a decay timeline whose hero is a single line: **Spotter answer accuracy, week over week, from real consumption**. The agent speaks first the moment it drifts and arrives with a drafted fix — zero thresholds to configure, no separate dashboard to visit. One workspace-level exception: a **blast-radius-ranked "Health lane" on the Overview** that surfaces the decaying models you didn't think to open and deep-links into each model's Trust Pulse (a triage router, not a dashboard). Clicking any drift point runs the **Debug diagnostic** against the 2–3 *real* failed Spotter questions from that week.

**Editing — "Diagnosis-to-diff, staged in a draft that must re-prove."** The agent **suggests, never silently auto-applies** anything reaching a certified model. It proposes a coherent set of changes; the curator accepts **per change** (one column / synonym / join / formula), low-stakes fixes batch-accept while definitional changes are reviewed one by one. Accepted changes stage into a **draft revision** that is **locked from re-certify until an automated "Re-test in Spotter" re-runs the originally-failing questions and shows them passing**. Re-certify records a named owner + version and auto-spawns a monitor for that exact failure so it's re-caught. Expanding a model (add tables / a product connection + cached data / CSV) rides the same draft → re-test → re-certify spine.

**Do this first.** Build the **Trust Pulse decay timeline** on one model — but its precondition is authoring a **real multi-week accuracy series** into mock data (today it's a 2-point week-over-week delta, so the hero slope literally cannot be drawn). Prove the trend line + agent-speaks-first drafted-fix handoff end-to-end on **`proj-3`** (drops 82% → 43%, and has real schema-drift dead columns) before generalizing.

**Honesty flag.** Both winning options survived an adversarial stress-test as *viable*, not *slam-dunk*. The moat-defining pieces — the decay time-series, the automated re-prove step, and the auto-spawned recurrence monitor — are **net-new build, not free reuse of existing cards**. This doc calls those out explicitly (see "Build dependencies") so we scope them honestly.

---

## What everything was scored against (the strategic tests)

From the loop-is-the-moat thesis, the vision Loom, and the sector study. An option had to pass these, not just be usable:

1. **Loop-closure** — closes Monitor → Debug → Improve → re-test → re-certify, not just "detects."
2. **Decay-over-time** — shows a *trend/slope from a baseline*, because silent decay is a slope, not a point.
3. **Re-prove** — after a fix, re-runs the failing Spotter questions and shows them passing *before* re-publish.
4. **Build+consume signal** — signals sourced from *real Spotter consumption*, not warehouse metrics any dbt tool could compute.
5. **Correction-mining** — the Improve agent drafts fixes *from* mined real failures, feeding the proprietary corpus.
6. **Data-team curator** — the actor curates/vouches for the model; it is not a business user investigating an answer (that's Spotter's job).
7. **Named accountability** — every certified change carries a named human owner + version.
8. **Stakes-modulated autonomy** — autonomy scales with stakes; definitional/regulated changes always get explicit human review.
9. **Draft-vs-certified** — fixes land in draft; only a permitted certifier promotes.
10. **Diagnostic root-cause** — Debug localizes a specific *dimension* to a fixable object, reconciled with the platform's committed **data · context · structure** triad.
11. **Reusable artifact / granular accept** — each accepted fix is a versioned, owned, independently-acceptable artifact — not an all-or-nothing bundle.
12. **Competitor-can't-copy** — relies on the closed build+consume loop + correction corpus + neutrality.
13. **Ambient trust** — models/answers carry receipts (provenance, freshness, confidence, owner) traceable to the vouching human.
14. **Operational last-mile** — scheduled/continuous (Pulse-style), not a manual check you must remember to run.
15. **Explicit-consent-at-stakes** — "monitor-and-fix" is an explicit-confirmation moment (per `platform.md`, alongside publish and caching).

---

## The monitoring workflow — "Trust Pulse"

**The pick:** the model-embedded decay timeline (agent-speaks-first), with a workspace Health lane and a per-conversation debug drill-in grafted on.

**Why this over the alternatives.** Three shapes were generated and stress-tested:
- **Trust Pulse (chosen)** — honors the committed POV that *monitoring lives where the curator already works* (the per-model Monitoring tab), the agent speaks first, and every signal ships with a drafted fix. Its weakness — per-model-only leaves silent decay unseen across a portfolio — is fixed by grafting the Health lane.
- **Health Inbox (rejected as the front door)** — a workspace alert queue. Strongest at portfolio triage and blast-radius ranking, but it is the *navigate-to surface* the research explicitly walked back ("signal should live where the work happens, not a monitoring tab"), and pre-printing a single root-cause label on every card invites portfolio-scale rubber-stamping. **We lift its best idea (blast-radius ranking) into the Health lane and drop the standalone inbox.**
- **Live Trace (rejected as the front door)** — a raw stream of real Spotter conversations. The sharpest build+consume demo, but by its own admission it's *consumer investigation, not curator triage*, it demotes the decay trend to a header strip, and its first-class object (per-conversation quality verdicts) doesn't exist in our data. **We keep its per-conversation debug drill-in as a layer *under* the trend, never the primary object.**

### Signals — ranked, relative, zero-config

No user-configured absolute thresholds. Everything is **relative/trend-based** against the model's own baseline. Build in this order (matches the committed `monitoring-pov.md` ranking):

| # | Signal | Trigger (relative) | Why it's here |
|---|--------|--------------------|---------------|
| 1 | **Spotter answer-accuracy trend** (WoW success rate from real consumption) — the hero decay line | Accuracy drops >~10 pts WoW **or** a 3-week downslope from baseline | The one signal a warehouse/general agent structurally *can't* compute (needs the consume side). It's the literal measurement of the ~90%→60% decay, rendered as a slope. **Build dependency #1** (see below). |
| 2 | **Failing-question cluster growth** (semantic coverage gap) | A cluster of failed/hedged/reformulated questions on one intent grows past ~5/week, or coverage % drops | The inferred, Hex-style signal (not thumbs-up/down). Clustered → curator triages *one card per intent*, not 89 raw events. Feeds the correction corpus. |
| 3 | **Model breakage / silent schema drift** | Event-triggered: a source schema change lands the model hasn't absorbed | The un-monitored *upstream* decay cause nobody covers proactively (Omni needs a manual trigger). A dropped source column silently poisons answers. |
| 4 | **Blast-radius-weighted decay ranking** (the Overview Health lane) | Surfaces only if it crosses signal 1/2 **and** affects a min blast radius (>N unique users, or is published/certified) | Ranked by `uniqueUsersThisWeek` × accuracy-delta severity + negative ROI. The single most competitor-can't-copy expression of owning build+consume; the only way silent decay surfaces without the curator guessing which model to open. |
| 5 | **Cache freshness / adoption slope** (supporting) | Cache hit-rate delta; adoption decline (queries WoW, dying Liveboards) | Cache reframed as a *trust + cost* signal ("is this answer current enough to bet on?"). Freshness travels **inline with each Spotter answer** ("refreshed 6h ago"), never as a badge. Supporting slopes, below the hero line. |

### Debug — the diagnostic

Clicking a drift point runs the diagnostic **inline in the agent panel** against the real failed questions. It localizes a **root-cause dimension** to a concrete fixable object. We reconcile the proposal's four-way list (`data / join / context / formula`) onto the platform's **committed data · context · structure triad** — join and formula are first-class *sub-facets of structure*, not peers:

| Dimension | Detects | Maps to |
|-----------|---------|---------|
| **Context** | Spotter can't resolve a token, or matched the *wrong* token from ambiguous naming (missing/weak descriptions, synonyms, AI annotations, instructions) | Largest single driver of answer quality; what the current fix-review machinery already handles best |
| **Structure** | Numbers double/collapse from fan-out or wrong join type; SUM applied to a ratio (margin, conversion rate) returns garbage; a formula references a renamed/missing column | Folds the proposal's "join" + "formula" + aggregation-additivity |
| **Data quality** | Source nulls, dupes, freshness, dropped/schema-drifted columns | The one axis a warehouse tool can *also* compute — necessary but not the differentiator |

Debug also handles the **operational failure classes** the Loom called out — a **failed sync** and **stale data** — and supports **tracing an answer's lineage** (answer → model → source → the human who vouched), which doubles as the ambient-trust receipt.

> **Open decision for PM:** three dimensions (committed triad) vs. the proposal's four (`data/join/context/formula`), and whether **aggregation rule** deserves to be split out (the Readiness Score ranks it #2 by impact). Flagged, not silently decided.

### Alert model

Two tiers, both proactive, both routed to the model's **named owner**:
- **Tier 1 (primary, in-context):** inside the model's Trust Pulse tab, when a trigger trips, the always-visible agent posts first — *"Accuracy on Marketing Campaigns fell 78% → 65% this week; I traced 3 columns Spotter can no longer resolve"* — with a drafted fix attached. No threshold to set, no tab to visit.
- **Tier 2 (portfolio):** the badge-counted **Health lane** on the Overview, blast-radius-ranked, deep-linking into each model's Trust Pulse. A router, not a dashboard — it does **not** pre-decide root cause.

**Deliberately NOT built:** a monitoring admin panel, manual absolute-threshold config, or a raw conversation feed the curator must scroll. Enterprise note: Spotter interaction/quality logs write to the customer's own warehouse (Sigma-style sovereignty).

---

## The editing / maintenance workflow

Two flows that share **one governance spine** (draft → re-test → re-certify). This matches the stakeholder framing: **"Maintaining a model"** (Improve/fix) and **"Edit an existing model"** (Expand).

### Flow A — Improve / fix (decay-driven): "diagnosis-to-diff review card"

**The pick:** the agent proposes; the curator accepts per-change into a draft revision that must re-prove before re-certify — with a stakes-based batching rule.

- **Auto-apply vs. suggest → SUGGEST, never silent auto-apply** for anything reaching a certified model. This honors `platform.md`: *monitor-and-fix is one of three explicit-consent moments* (with publish and caching). The confirmation gate sits at the **fix** action, not deferred to certify. _(This is why we rejected the auto-fix-into-draft option: it moves the gate to the wrong place, its stakes classifier can't actually be seeded from the severity field it claimed, and silent self-healing masks the very decay slope the thesis needs visible.)_
- **Autonomy modulates by stakes — but the low-stakes concession is BATCHING, not auto-apply.** High-volume low-stakes fixes (8 missing descriptions, synonyms) present as **one coherent batch** the curator accepts wholesale or drills into. Definitional/high-stakes changes (what "revenue" means, a join cardinality change, an aggregation rule) are forced to **individual per-change review**. A human still clicks accept; the change still lands in draft, never live.
- **Unit of accept/reject → the individual change ROW** scoped to one column / formula / join / synonym-set (finer than today's per-check apply). The existing "Accept all" button survives **only** as the low-stakes batch-accept and is **disabled for any batch containing a definitional change** — so accountability is never collapsed into one button for contested definitions.
- **Re-test / re-publish → an automated, gated, net-new step.** After ≥1 change is accepted into draft, **"Re-test in Spotter"** re-runs *only* the originally-failing cluster and returns a **pass/fail verdict per question** — this is effectively the Loom's **"compare v1 vs v2: does Spotter actually improve?"** check. **"Re-certify" stays locked until the previously-failing questions pass.** Promotion records the named owner + version and **auto-spawns a recurrence monitor** for that exact cluster (closing Monitor → Debug → Improve → Monitor).

### Flow B — Edit / expand an existing model

The stakeholder use case: *expand the model by adding more tables, connecting a product + bringing in cached data, uploading a CSV*. Mechanically this re-enters the build flow (add source → preview → transform if messy → join + validate cardinality/fan-out → select columns → enrich for AI) **on a published model**, but it is contained by the same governance spine:

- All additions stage into a **draft revision** — the certified v1 is never mutated in place.
- The **"connect a product + cached data"** path is the natural seam to **AgentDB** (cache the added source for cost/perf; the live-vs-cached control from P4).
- Re-validate joins and re-enrich the new columns, then **Re-test in Spotter** and **Re-certify** exactly as Flow A. Expansion that changes what an existing metric means is treated as a high-stakes change (per-change review).

### High-stakes secondary register (both flows)

For **regulated/contested definitions**, offer a **human-authors / agent-reviews** path: the curator edits on the canvas and the agent acts as reviewer (checks the edit against the failed questions, flags blast radius/side-effects). This is the cleanest "a named human authored this definition" story ("you can't tell an auditor the AGI decided what revenue means") — kept as the deliberate high-stakes minority register, **not** the default (as the default it starves the correction-corpus flywheel).

---

## The loop, end to end + certify rules

One workflow the data-team curator lives in, in the confirmed **always-visible split** (agent panel + canvas, no mode switch — Monitor/Debug/Improve/Re-test are prompt-bar modes and inline cards, never separate screens):

1. **Monitor** — open a model's Trust Pulse, or get pulled in by the Overview Health lane. Agent speaks first with a drafted fix.
2. **Debug** — click a drift point → diagnostic runs against 2–3 real failed questions → stamps one root-cause dimension (context / structure / data quality).
3. **Improve / Edit** — the diagnosed dimension flows into the diagnosis-to-diff card (Flow A) or an expansion (Flow B). Low-stakes batch-accept; definitional per-change; nothing touches certified — everything stages into a **draft v2**.
4. **Re-test** — "Re-test in Spotter" re-runs only the failing cluster and gates on pass/fail.
5. **Re-certify** — locked until re-test passes; promotion records owner + version and spawns a recurrence monitor that feeds a new signal back into Monitor.

**Certify rules (answer to open question e):** move from today's binary **Published/Draft** to three states — **Draft** (builder's volatile workspace) → **Published** (open to Spotter/consumers) → **Certified** (a deliberate quality commitment with a named vouching owner + version), analogous to verified liveboards → **verified/canonical models**. Only the model's **designated owner** may certify, domain-scoped per the federation model (finance owns finance definitions). A fix always lands in a Draft revision and is never mutated in place on the certified model; promotion is gated on the automated re-test pass.

---

## What we build on (current prototype)

| Reuse | Where | Note |
|-------|-------|------|
| Monitoring tab → Trust Pulse timeline | `ModelView.tsx:709-947` (`MonitoringTab`, `PillarCard`, `buildPillars`) | Extend the static 4-pillar snapshot into the decay timeline (hero accuracy slope + pillars-as-slopes) |
| Fix-review diff (current \| proposed) | `ModelCanvas.tsx:231-285` (`AIR_FIX_REVIEW`) | Reuse for **context/data** fixes; **join/formula/synonym diffs need a new representation** this table doesn't cover |
| Accept machinery | `ModelCanvas.tsx:1073-1117, 3900` (`__airApplyFix__` / `airAccepted` / `airIgnoredIds`) | Upgrade per-check → **per-row**; constrain the `__all__` button to low-stakes batches only |
| Diagnosis "thinking" state | `airRunScan` working-steps animation | Reuse for the Debug diagnosis |
| Tuning card shell + evidence | `AgentPanel.tsx:6189-6270` (`AITuneEvalCard`, `TUNE_QUESTIONS`) | Reuse as the shell for the diagnosis card and failed-question evidence — **but the automated pass/fail re-test is net-new** (this card is a *manual* rating card today) |
| Signal data | `mockData.ts:2500-2555+` (`MONITORING_TRENDS`, `SEMANTIC_GAPS`, `MONITORING_STATS`, `WORKSPACE_QUALITY.schemaChanges`, `DEAD_COLUMNS`, `CACHE_STATS`) | `MONITORING_STATS.uniqueUsersThisWeek` + `roiFlag` back the blast-radius Health lane |
| Draft/Published pill | `ModelView.tsx:39,56`; `ModelCanvas.tsx:1472-1481` | Extend with a **Certified** state + named owner + version |
| Always-visible split | agent panel + canvas, no mode switch | Monitor/Debug/Improve/Re-test render as inline cards within it |

Also honored from prior POV: **suggest-then-approve** with a reviewable/editable/versioned plan and item-level include/exclude (`plan-mode.md`, `data-prep-workflow.md`); **test mode = Spotter**, always-visible, diagnostic inline in chat; the **persistent per-model conversation is the verification trail** (no pinned snapshots — they go stale, which is exactly the decay failure mode); **every fix spawns a monitor** for its exact failure.

---

## Build dependencies & honest caveats

The stress-test scored both winners *viable, not strong*, because several load-bearing pieces are **net-new build misread as reuse**. Scope these as real work:

1. **The hero decay slope is unbuildable from current data.** `MONITORING_TRENDS` is a 2-point `thisWeek/lastWeek` delta — not a series. Without a real multi-week accuracy series, the hero line degrades to the delta the pillars already show. **This is the #1 dependency.** Author the series deliberately from *real model names* (per the "never invent mock data" rule) — don't fabricate ad hoc.
2. **Automated re-prove is net-new.** Today's re-test is a manual "switch to test mode" nudge and `AITuneEvalCard` is a *manual* self-rating card. The re-run-the-failing-cluster + pass/fail verdict — the moat-defining second half of the loop — must be built.
3. **The recurrence monitor has no basis in code.** "Auto-spawn a monitor for the fixed cluster" — the mechanism that makes the loop decay-proof — is unbuilt and needs a design + a store.
4. **`AIR_FIX_REVIEW` doesn't cover join/formula/synonym diffs.** Its current\|proposed shape is built for per-column data-quality values; three of the diagnostic dimensions need a new diff representation.
5. **The stakes classifier is unbuilt and can't seed from `AIR_ITEMS.sev`** (severity ≠ stakes). The stakes-batching rule needs a real classifier or a manually-tagged stakes attribute per fix type.
6. **No consumption-mining pipeline exists.** `WorkspaceQuery` has no answer text or quality verdict fields. The build+consume signal is right in principle but must be shown with *carefully authored* mock, or scoped as aspirational for the demo — not fabricated.
7. **The Health lane walks a line against the "no separate monitoring page" POV.** Keep it a lightweight badge + ranked list on the Overview that deep-links in — never a full admin surface.

---

## Open questions for PM / the group

- **Debug taxonomy:** committed **data·context·structure triad** vs the proposal's **data/join/context/formula** — and is **aggregation rule** its own dimension?
- **Certify roles:** owner-only vs any data-team member vs role-gated by domain. Not modeled in `ProjectState` today.
- **Stakes attribute:** where is a model's/change's stakes level declared so autonomy + certify rules can modulate by it?
- **Cached-data timing:** does a post-publish fix take effect for consumers immediately, or only after a cache re-run? (Affects how fast the loop closes — flagged "needs PM/eng" in `data-prep-workflow.md`.)
- **Skill as a first-class object:** should the Improve agent edit *skills* (procedural doctrine), not just the model? The sector study calls skill the highest-leverage unbuilt concept.
- **Bidirectional semantic-layer sync (dbt):** the Loom flags Sigma/Omni's push+pull as likely *essential* for continuous monitoring/iteration. What's our stand?
- **Monitoring priority (the Loom's explicit ask):** confirm signal #1 (AI answer improvement) is the top customer priority to start from.

---

## Recommended sequencing

1. **Author a real multi-week Spotter-accuracy series** into `MONITORING_TRENDS` (weekly array per model, real model names). _Precondition for everything._
2. **Trust Pulse decay timeline** in `ModelView` MonitoringTab (hero slope + pillars-as-slopes) on **`proj-3`** (82% → 43%, has real schema-drift dead columns).
3. **Agent-speaks-first drafted-fix handoff** on that one model — drift-point click → Debug against real failed questions → diagnosis-to-diff card.
4. **Automated Re-test → Re-certify gate** (net-new) + the **Certified** state on the pill.
5. **Overview Health lane** (blast-radius-ranked router).
6. Then generalize across models; layer in Flow B (expand) and the high-stakes register.

_This session produced the pick and the plan; no prototype code was changed (Large + New territory → understand → research → converge, build next)._
