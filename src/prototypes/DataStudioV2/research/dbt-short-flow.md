# Research: dbt integration — the short flow

## The question

How do peer platforms integrate dbt, and what's the shortest viable flow from "I have a dbt project" to "I have a usable model in ThoughtSpot"?

## Who is affected

Data analyst with an existing dbt project. Story 3 (Day N — "Using ThoughtSpot for plug-and-play models / ecosystem"). The pre-existing dbt investment is the entry point.

---

## Specific questions

**How peers handle dbt integration**
- When dbt is integrated, do dbt models become **models in their platform**?
- Are they made available to end users immediately, or kept in a "raw" state?
- Do they translate the dbt definitions into their own format?
- Do they disconnect from the source dbt models, or maintain a live link?
- When are users asked to fix issues? What kind of issues?
- What happens on the data side — caching, re-runs, sync schedule?

**The short flow shape for ThoughtSpot**
- Import → review → publish (with issues warning), or save as draft
- dbt models become draft ThoughtSpot models on import (no wrapper layer)
- The "issues" warning at publish: what does it surface? (chasm traps, RLS gaps, missing descriptions, broken metric defs?)
- The AI-fix interaction — inline in the publish gate, or a separate flow?
- What's the publish gate? What can a user override vs not?

**Status / lineage**
- After import, does the user see the dbt model as the source?
- When dbt-side changes happen, how is that surfaced?

---

## Competitive references to study

- **Hex** (Context Studio — how dbt artifacts flow in)
- **Omni** (dbt sync, Modeling Agent — most relevant comparator)
- **Sigma** — dbt integration if any
- **Cube** — semantic layer ingest patterns
- **dbt Cloud / Semantic Layer** — native consumption pattern
- **ThoughtSpot today** — V2's `import_dbt` script behavior, what it does and doesn't do

---

## Patterns observed

### Comparison table

| Platform | dbt → native model? | Available immediately? | Translation | Sync model | Issue detection timing | Issue types flagged | Fix UX | User overrides |
|---|---|---|---|---|---|---|---|---|
| **Omni** | Yes — view files generated, primary keys + relationships auto-detected from dbt constraints | Yes for analysts in branch mode; published via merge | Pulls `manifest.json` → Omni view files. Field/table descriptions, `accepted_values`, exposures. Bidirectional (push back to dbt). | Schema refresh — manual button, scheduled, or API. Branch-aware dev/prod via dbt environments. | At dev/branch time via Content Validator before merge | Broken downstream references, conflicting AI context, validation errors, missing descriptions/governance | **Modeling Agent** with three modes: Sandbox (proposes + bundles), Review (writes inline, pauses), Auto (immediate). Bulk format updates, drafts governance changes. | Field hide, access controls, dimension/measure tweaks, joins. Can promote any view back to dbt with one click. |
| **Hex (Context Studio + Semantic Model Sync)** | Partially — dbt MetricFlow / Cube / Snowflake Semantic Views become browseable datasets in Explore | Yes — measures, dimensions, joins available in Explore once synced | Hex reads YAML and "translates the specs into measures, dimensions, and joins." Requires `config.meta.hex` table override per semantic project. | **GitHub Action triggered on merge** (push-style, not poll). Schema refresh button for dbt metadata. dbt Cloud only — no Core. | At sync time (GitHub Action surfaces failures); at agent run-time via Review Agent observability | Agent uncertainty/confusion, missing context, conflicting definitions, user doubt signals from real conversations | Review Agent surfaces suggestions in Context Studio with summary + evidence + recommended fix. User reviews and publishes from UI or CLI. Test in controlled env before publish. | Each suggestion is approve-to-publish; can edit before shipping. |
| **Sigma** | **No** — dbt is metadata-only enrichment. No Sigma datasets created from dbt. | N/A — dbt models still appear as raw warehouse tables; descriptions/tests overlay on them | None. Pulls table/column descriptions, test results, last refresh from dbt Cloud API. | Reactive — dbt tab populates after a dbt job runs. Separate dbt Semantic Layer integration for metrics. | Surfaced in Sigma's data catalog UI (dbt tab) | Failed tests, source freshness, model staleness | Manual — analyst goes back to dbt to fix. No fix loop in Sigma. | N/A for the dbt artifacts themselves; Sigma datasets are independent. |
| **Cube** | Yes — dbt models rendered as cubes via `cube_dbt` Jinja templates | Yes — once template renders and is deployed | Generation-time: `model.as_cube()` emits YAML (name, description, sql_table, dimensions). Engineer enriches with measures/joins/pre-aggs by hand. | Build-time. Reads `manifest.json`. No live link — re-render to pick up changes. | At template render / cube build; debug via Visual Modeler / Playground / `meta` API | Compile errors, missing measures, undefined joins | Manual — engineer-led. No AI fix loop. | Full — engineer owns the YAML. |
| **dbt Cloud + Semantic Layer** | N/A — dbt **is** the source. Downstream tools query metrics via JDBC/GraphQL/Python SDK/MCP. | After `dbt build` job deploys MetricFlow artifacts | None — metrics live in dbt; consumers don't translate. | Live API. dbt Cloud job deploys; consumers query through Semantic Layer service. | At `dbt build` (compile + tests); at query time for permission errors | MetricFlow compile errors, test failures, source freshness, access permission gaps | Manual in dbt — fix YAML, re-run. AI assist via dbt Copilot / MCP. | Whatever the YAML allows; consumers don't override. |
| **Holistics** | Yes — dbt models mirrored into Holistics datasets | Yes — auto-sync on dbt run | Live link. Metadata changes in dbt auto-flow into Holistics. dbt run completion triggers report refresh. | Continuous / event-driven. | At sync — surfaces broken/missing models. Metric layer overlaid on top. | Schema drift, missing descriptions | Manual — analyst layers Holistics metrics on top. | Metric layer, custom measures. |
| **ThoughtSpot today** | Yes — dbt models become Worksheets/Models with auto-generated joins | Yes once import succeeds | Reads `manifest.json` + `catalog.json`. Imports DB/schema, table/column names + descriptions, joins from `yml`. Snowflake-only: pulls formulas, measures, dimensions, metrics. | **One-time, manual re-import**. No scheduled sync. No automatic reflection of dbt changes. | At import (connection / file errors); not at publish | Connection failures, missing `generate docs on run`, missing relationships | Manual — re-import to refresh. No AI loop today. | Add tables/columns/joins. **Cannot remove** imported tables/columns/joins. |

### Sources

- Omni dbt docs: https://docs.omni.co/integrations/dbt
- Omni "How dbt and BI should work together": https://omni.co/blog/using-omni-dbt-integration
- Omni "Three ways to use the dbt integration": https://omni.co/blog/three-ways-to-use-omnis-dbt-integration
- Omni "Do you model in dbt or BI?": https://omni.co/blog/do-you-model-in-dbt-or-bi
- Omni Modeling Agent announcement: https://omni.co/blog/announcing-omnis-modeling-agent
- Hex dbt integration docs: https://learn.hex.tech/docs/connect-to-data/data-connections/dbt-integration
- Hex Context Studio: https://hex.tech/product/context-studio/
- Hex Context Studio docs: https://learn.hex.tech/docs/agent-management/context-studio
- Hex Semantic Model Sync: https://hex.tech/blog/introducing-semantic-model-sync/
- Hex MetricFlow modeling: https://learn.hex.tech/docs/connect-to-data/semantic-models/dbt-metricflow
- Sigma dbt integration: https://help.sigmacomputing.com/docs/manage-dbt-integration
- Cube + dbt: https://cube.dev/docs/product/data-modeling/recipes/dbt
- Cube `cube_dbt` package: https://cube.dev/docs/product/data-modeling/reference/cube_dbt
- dbt Semantic Layer overview: https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl
- dbt consume metrics: https://docs.getdbt.com/docs/use-dbt-semantic-layer/consume-metrics
- Holistics dbt integration: https://www.holistics.io/dbt-integration/
- ThoughtSpot dbt integration: https://docs.thoughtspot.com/cloud/latest/dbt-integration

### What's consistent across the strong comparators (Omni, Hex, Holistics)

1. **dbt models become first-class native models in the platform.** Sigma is the outlier — it stays metadata-only and pays for it (analyst has to rebuild everything in Sigma).
2. **Available immediately, but inside a dev/branch surface.** Omni's branch mode, Hex's Explore, Holistics' auto-mirror — all let analysts work the moment data arrives. Publish-to-prod is a separate event, usually tied to git merge.
3. **Live link, not one-time copy.** Sync is either pull (Omni schema refresh button + scheduled), push (Hex GitHub Action on merge), or event (Holistics dbt-run-complete). Only ThoughtSpot today is one-time-and-stale.
4. **Issues surface in two places: at sync (broken refs, missing files) and at use (validation failures, agent confusion).** Omni's Content Validator catches sync-time issues; Hex's Review Agent catches use-time issues. Both treat them as observability with suggested fixes, not blocking gates.
5. **AI fix loops are a 2026 pattern, but they're advisory, not gating.** Omni's Modeling Agent has Sandbox / Review / Auto modes — user picks how much agency. Hex's Review Agent generates suggestions you publish on demand. Nobody blocks the user behind a forced "fix this first" wall.

### Gaps in the research

- Omni docs don't cleanly state whether dbt-imported view files start as drafts vs live. Inferred-live based on branch model.
- No platform appears to call out chasm/fan trap detection by name as a flagged issue type — "validation issues" and "broken references" are the documented categories. ThoughtSpot's join-graph traps may be a genuine differentiation surface (see below).
- ThoughtSpot dbt FAQ page failed to fetch; community-reported pain points are inferred from main docs.
- No public Atticus Grinder / field commentary specifically critiquing dbt-in-platform UX beyond the general "BI is commoditized, integration is the edge" point ([LinkedIn](https://www.linkedin.com/posts/atticusgrinder_big-fan-of-polymer-as-a-bi-tool-i-find-bi-activity-7173671655037202432-pmay)).

---

## Options considered

### Option A — Auto-publish on import, post-publish observability

Mirror Omni / Holistics. dbt project arrives → ThoughtSpot models exist as live, queryable Models. No publish gate. Issues are surfaced after the fact via a separate validation surface (à la Omni's Content Validator), with the AI agent able to propose fixes asynchronously.

**Pros**
- Shortest possible flow. Truest to "I already modeled in dbt; let me use it."
- Matches the pattern users already know from Omni / Holistics.
- Avoids the "rebuild it again" tax that Sigma users complain about.
- Re-imports / dbt updates flow through without ceremony.

**Cons**
- ThoughtSpot's worksheet semantics (joins, RLS, search-tokens) genuinely have trap states that Omni's column-store-friendly semantic model doesn't have to police as hard. Auto-publishing a chasm-trap-prone join graph is a real correctness risk.
- Bad first impression risk — broken Spotter answers on day one if the underlying dbt joins don't translate cleanly.
- "Fix it later" doesn't match the search-time correctness expectation of a TS Model.

### Option B — Issues gate before publish + AI-fix loop, then publish

Import creates draft Models (live link to dbt preserved). User lands in a publish review surface that runs a validation pass: chasm/fan traps, missing descriptions, RLS gaps, ambiguous join paths, missing PKs, no-data tests. Issues are split into **blocking** (correctness — chasm trap, missing PK, ambiguous join) and **advisory** (descriptions, synonyms, governance). The AI fix loop sits inline in the gate: each issue has a suggested fix the user accepts/rejects/edits. Publishing the model is one click once blockers are resolved (or explicitly overridden with an ack).

**Pros**
- Plays to ThoughtSpot's actual differentiation: the Spotter search experience is only as good as the join graph behind it. A gate that catches the things that *break Spotter* is product-shaped, not theatre.
- Keeps the flow short — there's no separate "modeling project" to manage. The gate is the only thing between import and publish.
- AI fixes are scoped (each is bounded to one issue) which makes them auditable and easy to undo. Closer to Hex's "review and publish" pattern than to a chat agent.
- Lets us be honest about the tradeoff with the user: "we import everything; here's what we'd fix before showing this to your team."

**Cons**
- Adds a step that pure-Omni users won't expect.
- The validation pass needs to be fast, or the gate becomes friction. Long-running checks (cardinality scans for chasm detection) need to be backgrounded.
- Risk that the gate becomes a UI dumping ground for every kind of warning. Needs ruthless triage on what's blocking vs advisory.

### Option C — Always import as draft; manual publish when user is ready

Mirror Hex's controlled-environment publish flow. dbt models become drafts; user explicitly works through them and clicks publish. Validation runs at publish but doesn't gate — same advisory model as Hex's Review Agent. AI suggestions are a parallel surface, not inline.

**Pros**
- Most user agency, least surprise.
- Familiar to Hex users.
- Decouples validation from publish, which keeps the publish action one click.

**Cons**
- Longest flow of the three — directly contradicts the "shortest path" thesis.
- For an analyst who already modeled correctly in dbt, the manual review/publish step is busywork.
- Hex's pattern works because Context Studio is a separate, ongoing maintenance surface — that's a heavier IA commitment than DataStudio currently has.

### Differentiation opportunities for ThoughtSpot

Three are visible from the comparison:

1. **Chasm/fan trap detection by name.** No competitor calls this out as a flagged issue type. ThoughtSpot's join-graph engine already understands it; surfacing it during the import-to-publish path is a defensible "we caught a real correctness bug your dbt project has" moment.
2. **Spotter-readiness as the validation lens.** Omni validates "does it compile and join?"; Hex validates "is the agent confused?". ThoughtSpot can validate "will Spotter answer the obvious questions correctly?" — synonyms, search tokens, ambiguous attribute names. That's a TS-native check no one else can do.
3. **One-click promote-back-to-dbt for overrides.** Omni has this for views; ThoughtSpot doesn't. If an analyst overrides a description or adds a synonym in TS, offering to push it back to dbt closes the loop and avoids the duplication-of-truth problem the dbt-Semantic-Layer crowd is trying to solve.

---

## Decision

**Option B — Issues review surface + AI-fix loop, with truly-blocking limited to "won't function" issues.**

### Shape

1. **Import → live draft Models.** dbt project arrives. TS Models exist immediately as drafts. **Bidirectional sync:** live link from dbt → TS (auto-applied as dbt changes land), plus on-demand pull (user can refresh manually), plus push-back to dbt (user-side overrides — descriptions, synonyms — can be promoted back to the dbt project to close the loop).
2. **Issues review surface (fast, pre-computed).** Two tiers:
   - **Truly blocking:** issues that mean the Model literally won't function — broken reference, column doesn't exist in warehouse, missing PK that breaks a join, connection failure. User must resolve or override-with-acknowledgment before publishing.
   - **Advisory:** everything else — chasm/fan traps (works but produces inflated answers), missing descriptions, missing synonyms, ambiguous joins, RLS gaps, Spotter-readiness suggestions. Publish-anyway is allowed; fix-later is fine.
3. **AI fix is inline per issue.** Each item has a suggested fix the user accepts / rejects / edits. Scoped to that issue, auditable, easy to undo. Closer to Hex's "review and publish" pattern than to a chat agent.
4. **Publish = make available for broader testing.** Publishing doesn't force company-wide adoption — it makes the Model live so ~10 more people can try it. Soft launch, not a coronation. Reduces the cost of advisory issues being non-blocking.
5. **dbt is attached to an existing warehouse connection (A2)** — technical relationship matches Hex / Omni. But surfaced prominently in:
   - **Day Zero empty state** of Connections (so analysts see it as an explicit entry point, not buried in a sub-page)
   - **Data Browser** — dbt-built warehouse views are part of the catalog with dbt metadata enriching the rows (last run, tests, freshness)

### Why

- **"Soft launch" framing reduces over-blocking.** When publish is "a few more people can try this," the cost of false-blocking is high and the cost of an advisory is low. Most issues should be visible but not gated.
- **Blocking has a clean test: "will it run?"** A chasm trap produces wrong answers but the Model still functions — advisory. A broken reference means the Model can't compile — blocking. No squishy middle ground.
- **Plays to TS differentiation without weaponizing it.** Spotter-readiness, chasm-trap detection — surfaced as advisory signals, not roadblocks. Analyst gets the value (we caught it) without the friction (we made you fix it).
- **Speed is a feature.** Pre-compute validation at import time so the publish gate is fast. Long-running checks (full cardinality scans for chasm detection) backgrounded.
- **dbt attached to warehouse + prominent surfacing** resolves the connections-tab A1/A2 question. Honest about the technical relationship without hiding dbt from discovery.

### Three differentiation moments to design for

1. **Chasm/fan trap detected** → advisory: *"your dbt model has a fan-out on `transactions ↔ order_items` — queries like `SUM(revenue)` will be inflated."* One-click AI fix to add a deduplication step or restructure the join. No competitor flags this by name.
2. **Spotter-readiness** → advisory: *"Spotter wouldn't answer 'top customers by revenue' correctly because there's no synonym for `lifetime_value`."* Advisory + AI fix to add the synonym. TS-native check no peer can do.
3. **Promote-back-to-dbt** → when an analyst overrides a description or adds a synonym in TS, offer to push the change back to dbt. Closes the loop, avoids duplication-of-truth.

---

## What this defers

- The dbt-side authentication and warehouse-pick step (covered in `connections-tab.md`)
- **Re-sync conflict UX** — when the user has local TS overrides AND dbt-side changes are pulled, what does the user see? Conflicts surface at pull time (user-triggered), but the resolution UX is unspecified — to be designed when we get to it
- Catalog / lineage UI

## Explicitly NOT doing

- **Branch / dev mode** (Omni / Hex pattern) — out of scope. TS doesn't have a separate dev surface, and we're not introducing one for dbt. Imports go straight to draft Models in the main workspace.
- **Redesigning the publish UX** — the existing TS publish workflow stays. The "soft launch" framing is the mental model for what publish *means*, not a redesign of the action.

---

## Explorations needed before building?

Yes — once flow shape is decided, explore the issues warning UI + AI-fix interaction in `Playground.tsx`. Specific directions worth trying:

- Issue list as a left rail with inline fix accept/reject (Hex-style suggestion cards)
- Issues as overlay annotations on the model graph itself (TS-native, leans on the join-graph visualization)
- Two-tier surface: blocking issues at the top of the publish gate, advisory issues in a collapsed "also worth fixing" section
