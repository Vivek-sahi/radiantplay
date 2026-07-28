# Semantic Model Import & Sync Research

**Status: DECIDED — dbt import flow built (sessions 20–24). Two-layer model, agent working steps, broken/degraded indicators, fix-via-agent pattern all implemented. No open questions.**

_Research for Data Studio — "Import from external semantic model" use case (Situation 1b, 2nd prompt card)._  
_Compiled 2026-04-22. Sources: platform docs, product blogs, web research._

---

## Context

Data Studio needs a workflow where users import an existing semantic model (dbt, Snowflake Semantic View, Looker, etc.) instead of building from warehouse tables. The goal: get customers using their existing semantic models in ThoughtSpot as fast as possible, without rebuilding from scratch.

Two sub-problems:
1. **Import + translation** — what maps cleanly, what breaks, how to surface and fix gaps
2. **Ongoing sync** — the source model remains the source of truth; ThoughtSpot must stay connected and handle upstream changes

Demo platform chosen: **dbt Semantic Layer (MetricFlow)**

---

## Part 1 — Import & Translation

### What translates cleanly (across all platforms)
- Tables and columns
- Basic joins (foreign key relationships)
- Simple measures: SUM, COUNT, AVG
- Dimensions / attributes
- Column descriptions and labels

### What breaks or degrades
| Concept | Outcome |
|---|---|
| Window functions (LAG, RANK, running totals) | Breaks — ThoughtSpot doesn't support directly |
| Fan-trap / multi-path join patterns | Breaks — ThoughtSpot requires unambiguous join paths |
| dbt `where` filters on metrics | Breaks — no direct ThoughtSpot equivalent |
| Period-over-period / relative date metrics | Degrades — approximated as formula, may lose precision |
| Fiscal calendars | Breaks — ThoughtSpot infers calendar differently |
| Access filters / row-level security | Breaks — different security model |
| Grain definitions | Breaks — ThoughtSpot infers grain, doesn't accept explicit declarations |
| Custom dbt metadata outside core `semantic_model` spec | Silently dropped |
| dbt version > 1.7 | Import blocked entirely (ThoughtSpot constraint) |

### How platforms surface translation errors

**Sigma** (best-in-class): Surfaces broken downstream references per item. Offers "Auto-fix" (rename detection) and a manual replacement picker before publishing. User reviews every broken item before commit.

**Snowflake Cortex Analyst**: Merge review UI — shows overlapping fields from two sources, lets user choose which to trust, plus toggles to retain/drop unmatched fields. User reviews merge strategy before save.

**Hex**: Inline validation flags in the Modeling Workbench. Errors appear on hover over warning icons in the data browser. No guided fix — manual remediation required.

**ThoughtSpot TML**: Errors block import entirely. No per-item guided fix. User must fix the source model or TML file and retry. (This is the gap we're solving.)

**Omni**: Assumes valid dbt models. Minimal error surfacing documented.

---

## Part 2 — Ongoing Sync

### Sync mechanisms by platform

| Platform | Sync model | Notes |
|---|---|---|
| **Sigma** | Query-time — no local copy | Changes in source reflected immediately. No drift possible, but no local customization layer either. |
| **Hex** | Git push on merge | Model pushed from GitHub to Hex on CI merge. Source is always authoritative. Customizations live in Git alongside source. |
| **Omni** | Manual or scheduled schema refresh | "Hard refresh" removes dropped structures. "Soft refresh" is additive only. Model validator flags broken references after refresh. |
| **ThoughtSpot TML** | Re-trigger dbt sync manually; component-level selective sync | Users can un-sync individual fields and manage them independently. Partial detach at field level already exists. |
| **Cube.dev** | CI/CD continuous deployment | Git repo connected to deployment. Dev branch hot-reloads before promoting to prod. |
| **Cortex Analyst** | Manual import or Git-staged YAML | No automatic sync. |
| **dbt Semantic Layer** | API-driven trigger | Automate via CI/CD on code merge or integrate into deployment pipeline. |

### Change detection and conflict handling

Most platforms **do not** have explicit conflict detection. ThoughtSpot TML is the exception — it already supports selective component-level sync, allowing fields to be independently managed. Omni flags broken references after schema refresh via model validator.

The structural gap: when a user enriches the translated model (AI context, descriptions, fixed translations) and the source then changes (column renamed, metric modified), no platform currently handles this gracefully — they either overwrite enrichments or require manual resolution.

### Drift

No platform explicitly shows "drift" as a concept. Hex and Cube avoid drift by keeping source authoritative in Git. Sigma avoids it by having no local copy. Omni accumulates drift if scheduled refresh is disabled. ThoughtSpot TML has the most risk of silent drift — no indicator that the source has moved.

---

## Part 3 — Design Proposal for Data Studio

### Two-layer model

The external semantic model is the **base layer** (source-owned): tables, joins, column names, metrics — synced from dbt.

ThoughtSpot's work is the **enrichment layer** (ThoughtSpot-owned): AI context, synonyms, descriptions, fixed translations, additional metrics added in Data Studio.

Sync updates the base layer only. It never touches the enrichment layer. A conflict arises only when the source changes something that the enrichment layer has customized (e.g. source renames a column that ThoughtSpot has AI context written for). That conflict surfaces the same way as a broken translation.

### Entry point

Second card on the NewProjectPrompt landing screen: _"I have a dbt model I want to bring into ThoughtSpot"_ → routes to the import agent flow.

### Agent working steps — import vs. table build

**Table build (current):**
1. Scanning warehouse → found 3 tables
2. Detecting relationships → 2 joins
3. Selecting columns → 18 columns
4. ✦ Enriching for AI → writing context for 18 columns _(new standard step for all builds)_

**Model import (new):**
1. Reading dbt model → found 42 objects
2. Translating → 38 objects mapped cleanly
3. ✦ Enriching for AI → writing context for 38 columns
4. 4 objects couldn't be translated — need your attention

**The AI enrichment step is standard across both flows.** It's not unique to model import. It surfaces ThoughtSpot's unique contribution: _Data Studio doesn't just build a model, it makes it AI-ready._

### Column view — inline indicators (no new column headers)

Two icon types added **next to the column name** in the row, not as separate table columns:

- **Translation status icon** (only on imported models):
  - ✓ green dot — translated cleanly
  - ⚠ amber — degraded (imported with approximation, e.g. window function replaced by formula)
  - ✗ red — broken (couldn't translate; needs fix before publish)
- **ThoughtSpot enrichment icon** (✦ sparkle, both flows):
  - Shown on any column where ThoughtSpot has added AI context, synonyms, or custom descriptions
  - Applies to table-build models too — marks what Data Studio has enriched

Filter to show only broken/degraded rows: defer to later (column visibility panel handles this).

### Fix workflow — click to agent

Clicking a ✗ or ⚠ icon on a row:
1. Opens / focuses the agent panel
2. Pre-composes a message: _"@campaign_spend couldn't be translated — window function not supported. How would you like to fix it?"_
3. Column is effectively @mentioned with context pre-loaded
4. User sends (or edits before sending)
5. Agent suggests fix, user confirms — same confirm pattern as coaching today
6. On confirm: column status icon updates to ✓

No separate inline fix panel. The agent is the fix surface, consistent with the rest of the prototype.

### Sync in Model View

The workspace is for building. Model View is for live model management. Sync belongs in Model View (Info tab):

```
Synced from dbt · Campaign Performance · Last pulled 2 days ago  [Pull changes]
```

After pull: changed rows flagged in column view with "Source updated — review change". User can accept source change, keep ThoughtSpot version, or send to agent to merge.

Happy path for demo: import from dbt → stays connected permanently → sync visible in Model View. No "detach" in the happy path.

### Demo scenario (dbt, Campaign Performance)

**Imports cleanly (38 objects):**
- 3 tables: orders, campaigns, users
- 2 joins: orders→campaigns, orders→users
- 15 dimensions, 3 simple measures (revenue, order_count, impressions)

**Flagged (4 objects):**
- `days_to_convert` metric — window function (LAG), broken ✗
- `campaign_roas` metric — period-over-period filter, degraded ⚠ (approximated as formula)
- `orders→returns` join — fan-trap pattern, broken ✗
- `user_segment_null_fill` — custom dbt macro, broken ✗ (no ThoughtSpot equivalent)

**After fixing + enriching → publish → sync story:**
Model View shows "Synced from dbt · Last pulled X". Pull changes brings in one renamed column (`spend` → `campaign_spend`) which conflicts with existing AI context → flagged for review in column view.

---

## Sources

- [Hex Semantic Model Sync](https://learn.hex.tech/docs/connect-to-data/semantic-models/semantic-model-sync/intro)
- [Hex Snowflake Semantic Views Sync](https://learn.hex.tech/docs/connect-to-data/semantic-models/semantic-model-sync/snowflake-semantic-views)
- [Omni dbt Integration](https://docs.omni.co/integrations/dbt/semantic-layer)
- [Omni Schema Refresh](https://docs.omni.co/docs/modeling/model-management)
- [Sigma dbt Semantic Layer Integration](https://help.sigmacomputing.com/docs/query-a-dbt-semantic-layer-integration)
- [ThoughtSpot dbt Integration](https://docs.thoughtspot.com/cloud/latest/dbt-integration)
- [Snowflake Cortex Analyst Semantic Model Spec](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst/semantic-model-spec)
- [Snowflake Cortex dbt Translation Quickstart](https://quickstarts.snowflake.com/guide/semantic_file_translation_from_dbt_to_cortex_analyst/index.html)
- [dbt Semantic Layer Overview](https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl)
- [dbt Semantic Layer APIs](https://docs.getdbt.com/docs/dbt-cloud-apis/sl-api-overview)
- [Cube Semantic Layer Sync](https://cube.dev/docs/product/apis-integrations/semantic-layer-sync)
- [Cube Continuous Deployment](https://cube.dev/docs/product/deployment/cloud/continuous-deployment)
