# Research: AI Readiness Score

_Decision type: Large + New territory. Full process before building._

---

## The question

How do we help a data analyst understand whether their model is ready for AI agents (Spotter, Claude Code) to answer questions accurately — and what do they need to do to close the gap?

## Who is affected

**Sara** — the data analyst building a new model in DataStudio. Specifically in the moment after she has built a model and is deciding whether to publish it, or in the test mode loop where answers feel wrong but she doesn't know why.

Also relevant to the **Monitor & Optimize** journey (Journey 2) — a team lead who is reviewing the health of models across the workspace.

## Current state

**In ThoughtSpot today:** ThoughtSpot has a data quality score (null rates, duplicates, date format issues). There is no score for semantic readiness — how well-annotated a model is for AI. Spotter quality is a function of semantic metadata completeness, but this is invisible. A model can pass all data quality checks and still give terrible Spotter answers.

**In DataStudio:** We show a "9 quality issues" / "9 resolved" indicator in the artifact tab bar — this covers data quality only. We have no readiness signal for AI.

**In the user's workflow:** Analysts currently discover the problem empirically — they publish a model, run Spotter against it, get bad answers, don't know why. The feedback loop is long and the fix is non-obvious.

## Why this matters (the core insight)

A data model is now two things: a query target for dashboards *and* a knowledge base for AI agents. These have different readiness criteria. A model can be completely correct for dashboards (data is clean, joins are right) and simultaneously poor for AI (no descriptions, no synonyms, aggregation rules missing).

The AI Readiness Score makes this second dimension visible and actionable. It answers: **"If I run Spotter on this model right now, what is my expected answer quality?"**

## What actually affects AI answer quality (ranked by impact)

Based on how text-to-SQL models work and what industry players have surfaced:

1. **Column descriptions** — largest single factor. Without descriptions, agents must infer meaning from column names and guess wrong at high frequency. `amt`, `d1`, `seg_cd` are all opaque.

2. **Aggregation rules** — whether a numeric column is additive (safe to SUM), semi-additive, or non-additive (ratio/percentage, must be recalculated). Summing `profit_margin` or `conversion_rate` returns meaningless numbers. ThoughtSpot's existing aggregation type system covers this but it's often left at default.

3. **Synonyms** — users ask in business language; column names are often technical or abbreviated. Synonym coverage maps user vocabulary to model vocabulary. `revenue → amount`, `customers → users`, `period → fiscal_quarter`.

4. **AI context / annotations** — richer than a description: business rules, caveats, edge case interpretations. ("null here means campaign hasn't launched, not missing data"). The difference between an agent that answers and one that answers *correctly*.

5. **Relationship clarity** — join cardinality and type. An ambiguous many-to-many causes fan-out (inflated numbers). The agent needs to know whether to LEFT JOIN, how to deduplicate, and what cardinality to expect.

6. **Formula documentation** — custom metrics must be described. `blended_roas` and `campaign_roas` may both exist; without context the agent either ignores them or picks wrong.

7. **Context file / instructions** — a domain brief (`instructions.md`) that acts as a system prompt for the model. "This model tracks marketing attribution from Jan 2023. Primary metric: ROAS. Fiscal year starts October." Sets the interpretive frame for the agent.

8. **Sample questions** — not just for discoverability. LLMs use them as few-shot demonstrations of valid intent and vocabulary. A model with 10 well-formed questions gives the agent a strong prior on what queries make sense.

9. **Test coverage** — verified known-answer questions. Empirical evidence the agent performs. Directly tied to the test mode already built.

## Competitive / inspiration references

**Snowflake Cortex Analyst** — their semantic YAML spec for natural language requires column descriptions, synonyms, metric definitions, and sample questions. Description completeness is documented as the #1 accuracy factor. Their spec is effectively an AI readiness checklist made explicit — you can't get good Cortex results without filling it out.

**Databricks Unity Catalog + Genie** — Genie accuracy correlates directly with Unity Catalog metadata completeness. Databricks found this so critical they built AI-auto-generated descriptions as a first pass (human reviews and approves). They now surface "description coverage %" as a first-class catalog health metric.

**dbt Semantic Layer** — every metric requires name, description, type, entity, and dimensions. dbt Explorer shows documentation coverage as a model health indicator. The semantic layer is framed explicitly as "the contract between data and AI tools." The community norm is 100% documented columns before publishing.

**Alation / Atlan / DataHub** — enterprise data catalogs have had "metadata completeness scores" for years (governance/discoverability framing). In 2024-2025 all three reframed these scores as "AI readiness" because the same metadata governs both use cases. They show dimension-level breakdowns and remediation suggestions.

**Hex Magic** — Hex has written about how column naming conventions and description presence affect Magic (AI) suggestion quality. Better metadata → better code suggestions in notebooks. They don't expose a score but the internal signal is the same.

**The emerging consensus:** "AI-ready semantic layer" as a category. The semantic layer (ThoughtSpot's core) is uniquely positioned to be the grounding layer for AI agents — *if* the metadata is complete. The score makes that positioning tangible.

## Proposed score structure

Four dimensions, each independently actionable:

| Dimension | What it measures | Weight |
|---|---|---|
| **Semantic richness** | Description coverage %, AI context %, synonyms on key columns, semantic types set | ~40% |
| **Model definition quality** | Aggregation rules complete, relationship cardinality documented, formulas described, no ambiguous column names | ~30% |
| **AI context** | Instructions file present, sample questions count (target: 8+), domain brief quality | ~20% |
| **Test coverage** | Verified test questions present, pass rate | ~10% |

**Score tiers (not a raw number — tiers are more actionable):**

- **Not ready** (0–40) — AI will give unreliable answers. Core semantic work not done.
- **Basic** (40–65) — AI can answer simple questions. Significant gaps in descriptions or aggregation rules.
- **AI-ready** (65–85) — Good coverage. Most questions will get correct answers. Some edge cases may fail.
- **Optimized** (85–100) — Full enrichment, tested, context file present. Expected to perform well for business users.

## Design principle for the score

**Actionable, not just informational.** A score without a remediation path is anxiety-inducing, not useful. Every tier must show: what's missing, how many items, and a direct path to fix each gap (ideally agent-assisted).

The score is not a grade. It's a readiness indicator with a clear on-ramp. "Here are the 4 things that would take you from Basic to AI-ready."

## Options considered

### Option A — Score as a panel / dedicated view
A full "AI Readiness" tab or panel in the artifact (alongside Columns, Tables, Preview). Shows the score, dimension breakdown, and per-item remediation list. Comprehensive but adds tab clutter.

**Tradeoff:** Full information, but out of the flow — analysts open it when curious, not at the moment they need to act.

### Option B — Score inline in the artifact identity row
A compact score chip in the header (alongside Share / Publish). Click to expand a popover with the breakdown. Persistent and contextual — visible at all times without adding a tab.

**Tradeoff:** Always visible is good. Popover is limited space for a rich breakdown.

### Option C — Score as a publish gate / nudge
The score appears prominently when the analyst is about to publish. Not a hard block, but a clear "Your model is Basic — here are 3 things that would make Spotter significantly better before you share this." Friction at the right moment.

**Tradeoff:** Perfect timing, but doesn't help the analyst during build. Doesn't surface in monitor/iterate flow.

### Option D — Progressive inline surfacing (synthesis)
Score chip in the identity row (always visible, compact). Expands to a side panel or popover. *Also* surfaces as a nudge at publish time. During test mode, the agent proactively references the score when answers are poor ("This question returned uncertain results — your model is missing descriptions on 6 columns that are likely relevant here.").

**Tradeoff:** Most complete, most coherent. More to build.

## Decision

**Option D (synthesis)** — but built in phases:
1. Score chip + breakdown popover in identity row (Phase 1 — surfaces the concept)
2. Publish-time nudge (Phase 2 — right-moment friction)
3. Agent-referenced in test mode when answers are poor (Phase 3 — closes the loop)

Phase 1 alone is enough to ship the concept and validate the dimensions with the team.

## What this defers / leaves open

- **Exact weighting** of the four dimensions — needs validation against real Spotter performance data. The weights proposed are directional.
- **How to score "quality" of descriptions**, not just presence — a one-word description vs. a sentence vs. a paragraph. Start with presence (binary), iterate toward quality.
- **Auto-remediation** — can the agent fill in missing descriptions? (Databricks does this.) Big unlock but separate feature.
- **Model-level vs. workspace-level score** — a workspace view showing AI readiness across all models (Monitor journey). Out of scope for Phase 1.
- **Threshold for "AI-ready" tier** — needs calibration against actual Spotter answer quality. The 65% threshold is a hypothesis.

## Explorations needed before building?

**Yes.** Two directions worth trying in Playground before committing to the identity row placement:

**Exploration 1 — Score chip in identity row**
A compact chip (e.g., "AI-ready · 78") in the artifact header next to the Draft/v1 badge. Click opens a popover: score gauge, 4 dimension rows with progress bars and counts, top 3 action items. Try both a numeric score and a tier label. Does the chip feel like signal or noise at that location?

**Exploration 2 — Publish-time readiness gate**
At the moment of clicking "Publish model," instead of going straight to publish, intercept with a readiness panel. Score + what's missing + "Publish anyway" vs. "Improve first." Modeled loosely on App Store review guidelines: informational, not blocking.

Converge on placement and density before wiring up the scoring logic.
