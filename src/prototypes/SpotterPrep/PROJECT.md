# SpotterPrep — Project Doc

## Figma Artifacts

| Artifact | Type | Link |
|---|---|---|
| Workflows & Diagrams | FigJam | https://www.figma.com/board/jIA8zRWTVhVkWNYwLjTGZP |
| Designs | Figma Design | https://www.figma.com/design/JhNsRars6ZRWPLDQy1fvei |

---

## 1. Project Summary

SpotterPrep is a data quality prep capability built into ThoughtSpot. When a data team has built a model and discovers the data quality is poor, they face a choice: go back and fix it at the source tables, or fix it at the model level inside the BI platform — where column-level awareness, semantic context, and usage are already known. SpotterPrep is the latter.

Prep is agentic and generative. A baseline set of common quality checks (5–10 jobs) is surfaced automatically. Beyond that, the data engineer can make any data change they want by talking to the agent. The quality score is derived from the same baseline checks, so score and issues are always in sync.

SpotterPrep only works on cached data. After prep completes, a new version of the cached dataset is created; the original is preserved for rollback. Cache has a refresh frequency (daily, weekly, etc.), and prep jobs run automatically on every refresh. Each run is logged — pass or fail. If a job fails, the user can re-open the agent, debug, and update the fix.

---

## 2. Industry Problem

Data quality is the #1 obstacle for analytics teams — 57% of analytics engineers cite it as their primary challenge (dbt Labs 2024, n=2,000). Analysts spend 60–80% of their time on cleaning and prep instead of producing insights. 67% of data decision-makers don't trust their own org's data.

The deeper problem is that **prep has no home in the analytics workflow today.** Every existing solution is either upstream (Snowflake/Databricks catch issues at the warehouse layer, before data has meaning) or separate (Tableau Prep, Power BI Dataflows exist outside the analytics experience). When analysts discover a quality issue inside a BI tool, their only options are: file a ticket with engineering, or export to Excel and fix it manually. The Excel fallback persists precisely because there is no better option in context.

---

## 3. Our User

**The analytics engineer.** The person who lives in ThoughtSpot — builds and maintains data models, owns the semantic layer, and is accountable when dashboards show wrong numbers. They bridge data engineering and analysis: they understand the business context of the data and the technical structure of the model. They are the ones who discover quality gaps first, and who have no good way to fix them without leaving ThoughtSpot.

This is not the infrastructure data engineer managing pipelines upstream, and not the analyst who only consumes. It is the person in the middle — with full model context and no fix tool.

---

## 4. Our Differentiator

Snowflake and Databricks catch quality issues at the warehouse layer — before data has meaning. ThoughtSpot catches them at the model layer — where columns already have semantic context, where usage across searches and liveboards is known, where the business impact of a null or a duplicate is understood.

> **SpotterPrep does prep in context, with BI intelligence.** No other tool does this.

---

## 5. User Journey

The analytics engineer's journey through SpotterPrep is not a standalone workflow — it is a loop embedded in their daily analytics work:

1. **Build** — Analytics engineer builds or maintains a data model in ThoughtSpot
2. **Discover** — Identifies data quality gaps (surfaced by the quality score or found during analysis)
3. **Fix** — Fixes the gaps in SpotterPrep without leaving ThoughtSpot, without filing a ticket, without exporting to Excel
4. **Return** — Goes back to analytics with cleaner data → better search results, more trustworthy dashboards, higher AI accuracy

Each cycle through the loop raises the quality score and reduces friction in the next round of analysis. Over time, prep becomes a background job: the scheduled rules run on every cache refresh, and the engineer only re-enters when something fails or the data changes significantly.

---

## 6. Workflows

### Workflow 1 — First-time prep, data already cached

1. User opens Data Models list → sees a **Quality column** in the table with a grade indicator per model row
2. User clicks a model → opens model detail → navigates to **Quality tab** (new tab alongside Columns, Joins, etc.)
3. Quality tab shows: quality grade, column data profile, and a "Prep with agent" CTA
4. User clicks "Prep with agent" → enters **full-screen prep mode** (left nav hides, shell changes — like liveboard edit mode)
5. Full-screen layout: **top bar** (model name + Publish + Exit) + **toolbar** (undo, redo, compare before/after, placeholder slots) + **data table** (dominant, left) + **agent panel** (right, flexible width)
6. Agent proactively scans and surfaces baseline issues + current score
7. User works freely: discuss issues, apply fixes, undo/redo, compare before/after at any point
8. User clicks **Publish** → full-screen closes → returns to Quality tab
9. Quality tab now shows: **quality boost** (before → after score), "Prep again" CTA, **prep rules set** as primary view, "View jobs run" CTA → opens in a modal

### Workflow 2 — First-time prep, data not yet cached

1. User opens Data Models list → Quality column shows "Not cached" for this model
2. User clicks model → Quality tab detects no cache → shows **cache settings modal** (set frequency: daily / weekly / monthly → confirm)
3. System caches the data → Quality tab now shows Ready state with grade + column profile + "Prep with agent" CTA
4. Flow continues identically from step 4 of Workflow 1

### Workflow 3 — Scheduled refresh, prep passes

1. Cache refresh is triggered on schedule
2. Prep job runs automatically against the refreshed data
3. Job passes → new version of the prepped dataset is created
4. Run is logged as passed in prep history

### Workflow 4 — Scheduled refresh, prep fails

1. Cache refresh is triggered on schedule
2. Prep job runs automatically → job fails
3. Run is logged as failed in prep history
4. User re-opens SpotterPrep agent → agent surfaces what failed
5. User debugs and updates the fix rules → saves
6. Next cache refresh re-runs with the updated rules

---

## 7. Capability & Boundaries

### What the user can do
The user can do anything to the **data** — values and rows:
- Fix common quality issues from the baseline (nulls, blanks, duplicates, type mismatches, anomalies, etc.)
- Update or recast values (e.g. replace "N/A" with null, standardize casing)
- Delete rows (e.g. remove true duplicates)
- Any other data value change via free-form agent interaction

### What the user cannot do
Structural operations are out of scope — the shape of the model does not change:
- Cannot create new columns
- Cannot hide or delete columns
- Cannot make any schema-level changes

### The principle
> The model's structure is fixed. Only the data inside it can change.

### Other constraints
- Changes are staged — not every agent message runs a warehouse query. The warehouse runs on explicit preview (sample) or on save.
- Inline column distributions (histograms, null %, value frequency) are available on request during the session.
- Refreshing the data to pull a new cache from the source is out of scope during a prep session.

---

## 8. Agent Behavior

- **Proactive:** Agent opens with an automatic scan. It does not wait for the user to ask. It surfaces the baseline issues and the current quality score immediately.
- **Baseline-driven:** The baseline covers the most common data quality issues an average data person would fix. These are the same jobs that power the quality score.
- **Open-ended beyond baseline:** After the baseline is surfaced, the user can ask the agent to do anything within scope. No fixed menu of operations.
- **Feedback is numeric, not explanatory by default:** Score updates and column-level before/after are the primary feedback mechanism. The agent explains only when asked.
- **Free-flow session:** No forced sequence. The user decides how much they do in a session. They can exit, test in ThoughtSpot, and come back to continue.
- **Session → scheduled job:** Everything done in the session is saved as rules that re-run on every cache refresh. The session is the job definition.

---

## 9. Screen Design Decisions

### Screen A — Data models list
- Existing ThoughtSpot data objects list table (Radiant Play components)
- Add a **Quality** column to the table: shows grade badge (A/B/C/D/F) for cached models, "Not cached" for uncached

### Screen B1 — Quality tab, Ready state
- Part of the model detail page (new tab: Caching | Quality added to existing tab bar)
- Shows: quality grade + score, column data profile table, "Prep with agent" primary CTA

### Screen B2 — Quality tab, Post-prep state
- Shows: **quality boost** (before → after score comparison, e.g. D 54 → A 91)
- "Prep again" CTA (re-enters full-screen prep mode)
- Primary view: **prep rules set** (the active rules running on each refresh)
- "View jobs run" secondary CTA → opens jobs history in a **modal** (not inline)

### Screen C — Full-screen prep mode
- Full screen — left nav hidden, shell replaced by edit-mode top bar
- **Top bar:** model name / breadcrumb · · · [Exit] [Publish]
- **Toolbar (below top bar):** Undo · Redo · Compare before/after · [placeholder slots]
- **Main content:** data table (dominant, left) + agent panel (right, resizable)
- Agent panel: proactive scan summary → issues → chat interface → suggestion chips

### Screen D — Cache settings modal (not-cached entry)
- Triggered from Quality tab when data is not cached
- Simple modal: frequency selector (daily / weekly / monthly) + Confirm + Cancel

---

## 10. Open Questions

_To be filled as they arise._

---

## 11. To-Do's

_To be filled._

---

## Sessions

### Session 2 — 2026-04-14

**Design decisions locked:**
- Prep session is full-screen mode (like liveboard edit) — not a side panel within the shell
- Full-screen has: top bar (Publish + Exit) + toolbar (undo, redo, compare before/after + placeholders) + data table + agent panel
- Quality tab post-prep shows quality boost (before/after score), prep rules as primary view, jobs run behind modal CTA
- "Caching" tab added alongside "Quality" tab in model detail — cache settings live there, not in Quality tab
- Models list: Quality column added to existing table; uncached models show "Not cached"
- Build to use existing ThoughtSpot UI shell + Radiant Play components

**Wireframes drawn in Figma design file:** A (models list), B1 (Quality ready), B2 (Quality post-prep), C (full-screen prep), D (not-cached modal)

---

### Session 1 — 2026-04-13
- Reviewed SpotterPrep v1 (built) and the PM's agentic v2 proposal (screenshots)
- Analyzed tensions between the two approaches
- Set up three project artifacts: this doc, FigJam workflows file, Figma design file
- Agreed on project summary, 4 workflows, capability boundaries, and early agent behavior principles
- Resolved not-cached entry path: simple cache settings modal (set frequency: daily/weekly/monthly) → confirm → land in split view
- Drew both workflows in FigJam (Workflow 1+2 as first-time prep, Workflow 3+4 as scheduled jobs)
- Ran competitive research: validated need (57% of analytics engineers cite data quality as #1 obstacle; 60–80% of analyst time lost to prep)
- Confirmed user persona: analytics engineer — lives in ThoughtSpot, owns the model, discovers quality gaps in context
- Confirmed differentiator: prep at the model layer with BI semantic context — no other tool does this
- Confirmed user journey: Build → Discover → Fix (in SpotterPrep) → Return to analytics with cleaner data
