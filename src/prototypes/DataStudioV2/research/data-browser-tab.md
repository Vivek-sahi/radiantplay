# Research: Data Browser — definition, scope, and IA

## The question

What is the Data Browser tab? Is it **everything** (raw warehouse tables + dbt models + uploaded files + ThoughtSpot models), or only the **external data** that came in via connections? What do peer tools do, and what's intuitive for analysts?

## Who is affected

Data analyst (primary user). Affects daily discovery — the surface where they find tables, models, and files to start work from. Touches all three demo stories.

---

## Specific questions

**Definition / scope** *(this is the load-bearing question)*
- Is Data Browser **everything** — raw tables + dbt models + uploaded files + ThoughtSpot models?
- Or only **external data** brought in via connections (raw tables + uploaded files)?
- Where do ThoughtSpot models live — same surface, separate Models surface, or both?

**The dbt nuance**
- When a dbt project is imported, dbt models become **draft ThoughtSpot models**. We don't want a wrapper.
- Are imported dbt models visible in Data Browser, only in Models, or both?
- Does Data Browser show the *source* dbt-as-warehouse-view, the *imported* draft model, or both?

**What's in vs. out**
- Filter by connection? By type (table / view / dbt model / file)?
- Search across everything?
- Preview (sample rows, schema)?
- Actions from Data Browser — start a model, add to existing model, open in workspace?

**What's intuitive for users**
- Do analysts expect *"everything in one place"* or *"raw vs modeled separated"*?
- What mental model aligns with how they actually think?

---

## Patterns observed

Six peer tools were studied. Findings below are sourced from product docs, changelogs, and blog posts (URLs cited).

### Comparison table

| Tool | Unified or separated? | How dbt models surface | How modeled artifacts (semantic / dataset / explore) surface | Raw tables visible without modeling? | Primary actions from browse |
|---|---|---|---|---|---|
| **Hex** | **Unified** with tabs (`All Contents` / `Data Models` / `Recently used` / `Favorites`) | In `All Contents` alongside raw tables, with extra metadata badges (last run, tests, freshness, dbt Cloud doc link) | In a separate `Data models` tab — semantic projects synced from dbt MetricFlow / Cube / Snowflake semantic views, or authored in Hex | Yes — full warehouse hierarchy (connection → database → schema → table) | Preview, query in SQL cell, copy qualified name, star/favorite, endorse, "add to project" |
| **Omni** | **Unified field picker** in workbook; separate IDE for the model | dbt views populate the schema model layer on schema refresh; surfaced inline with database tables | Topics (joined views) and shared-model dimensions/measures appear in the same field picker, nested under views | Yes — schema model "mirrors the raw database" | Drag-to-query in workbook, promote workbook changes back to shared model |
| **Sigma** | **Separated** — left-nav data catalog (warehouse-shaped) is distinct from Datasets / Data Models / Warehouse Views | No first-class dbt integration in catalog UI; dbt-built tables appear as warehouse tables | Datasets and Data Models live in the workspace folder system, not in the warehouse catalog | Yes — catalog browses connection → database → schema → table | Preview, ask Sigma Assistant, annotate, "create dataset / data model / warehouse view from this table" |
| **Looker** | **Modeled-only** (no raw browser) | dbt is upstream of LookML; doesn't appear in Looker UI as a distinct artifact | Explores grouped by LookML model in the Explore menu; fields nested by view | **No** — only LookML-modeled Explores are browsable | Open Explore, drag fields, run query |
| **dbt Catalog (Explorer)** | **Unified** with three sidebar modes: `Resources` (by type), `File Tree` (repo), `Database` (warehouse) | First-class — models, sources, seeds, snapshots are the primary objects | n/a — dbt is the modeling layer; metrics/semantic models appear as Resource types | Yes (Enterprise+) — external metadata ingestion shows non-dbt warehouse relations | Search, filter by resource type / layer / materialization / tag, lineage graph, ERD |
| **Snowflake / Snowsight** | **Unified** database explorer (raw tables, views, dynamic tables, materialized views, semantic views all under DB → schema) | dbt-built models indistinguishable from any other view/table once materialized | Semantic views show in same DB tree, just a different object type | Yes — this *is* the warehouse | Preview, query, edit, lineage |
| **ThoughtSpot today** | **Unified** Data workspace with a single list filtered by source-type (Models / Tables / Views / SQL Views) | dbt sync **creates ThoughtSpot Models** (not drafts — active Models with edit constraints); the source tables also remain | Models appear in the same list as tables, distinguished by type filter | Yes — connection tables appear once added | Filter by type/tag/author, open Model editor, search by name |

### Key takeaways from the peer scan

1. **Looker is the outlier** — pure modeled-only browsing. Every other tool surfaces raw warehouse data.
2. **Hex is the closest analog to what DataStudio is becoming** — unified browser, raw + dbt mixed in `All Contents`, semantic models in their own tab. The Hex pattern explicitly *integrates dbt metadata into raw table rows* rather than wrapping dbt models as separate artifacts. ([learn.hex.tech](https://learn.hex.tech/docs/connect-to-data/data-connections/dbt-integration))
3. **dbt Catalog's "three lenses" pattern** (by resource type / by file tree / by database) is a useful design reference for showing the same underlying objects through different mental models. ([docs.getdbt.com](https://docs.getdbt.com/docs/explore/explore-projects))
4. **Sigma is the cleanest "raw vs modeled" separation** — catalog (warehouse-shaped) and datasets (workspace-shaped) are different surfaces, reached differently. Less mental load on the catalog side, more clicks to bridge the two.
5. **ThoughtSpot's current pattern is unified-with-filters** — same list, type filter. Aligns with what most peers do, but lacks Hex's enrichment-on-rows (dbt freshness, tests on a raw table row).
6. **The "draft model from dbt" framing is unique to ThoughtSpot's roadmap.** No peer tool treats imported dbt as drafts. Hex treats them as synced semantic models (read-only sync). Looker treats LookML as the source of truth (dbt is upstream). Omni *does* allow dbt SQL export from views, but the workbook→shared-model promotion path is the "draft" analog. The closest peer pattern is Omni's: edits live in workbook context, get promoted to shared.

---

## Options considered

### Option A — Everything in Data Browser (raw + dbt + files + ThoughtSpot models in one list)

**What it is.** A single browse surface. Type filter (Table / View / dbt model / File / Model). Search across all. Connection facet. Mirrors ThoughtSpot today and Hex's `All Contents` tab.

**Why it works.**
- Matches 5 of 6 peers (everyone except Looker).
- Single mental model: "all the data I can start from."
- Works with the dbt-as-draft-model design — a dbt model row in the list links to its draft Model; we don't need a wrapper artifact.
- Preserves continuity with current ThoughtSpot Data workspace, lower migration cost.

**Where it strains.**
- The dbt nuance: do we show *the source dbt view in the warehouse* AND *the draft Model derived from it* as two rows? Two rows is honest but noisy. One row (collapsed) needs a clear primary identity.
- "Models" as a top-level concept gets diluted — when a Model is just one type in a flat list, the curation/governance story weakens. Hex addresses this with a separate `Data models` tab inside the same browser; we'd likely need the same affordance.
- File uploads are a different kind of object (the user owns them, not the warehouse) — flattening them into the same list can feel wrong.

### Option B — Only external data in Data Browser; Models is a separate surface

**What it is.** Data Browser = raw warehouse tables + uploaded files + dbt-as-warehouse-view (the source-side artifact). Models is a separate top-level tab with all ThoughtSpot Models, including drafts auto-created from dbt imports. Closest peer: Sigma (catalog vs datasets) and Looker (no raw browse at all, but the *separation* concept is the same).

**Why it works.**
- Clean conceptual split: "raw inputs" vs "curated outputs."
- The dbt nuance becomes simpler: dbt views show in Data Browser as warehouse artifacts; the *draft Models created from them* show in Models. No double-counting in one list.
- Models tab can lean into governance/endorsement/draft state without dragging the catalog UX into it.
- Aligns with how analytics engineering teams typically think (raw layer → modeled layer).

**Where it strains.**
- More clicks to answer "do I have data on X?" — user has to check both surfaces.
- Search across both becomes a separate problem (global search? cross-surface results?).
- For a user landing on DataStudio for the first time, "Data Browser" no longer means "all the data" — it means "warehouse and files, but not the curated stuff," which is a learned distinction.
- Diverges from current ThoughtSpot UX more than Option A.

### Option C — Segmented view inside Data Browser (sub-tabs: Raw | Models | Files)

**What it is.** One Data Browser page, sub-tabs at the top. Most direct copy of Hex's pattern (`All Contents` / `Data models` / `Recently used` / `Favorites`). dbt models surface in two places: the `Raw` tab shows the warehouse view; the `Models` sub-tab shows the draft ThoughtSpot Model derived from it.

**Why it works.**
- Hex pattern is well-validated; their `All Contents` + `Data models` split is exactly the raw-vs-modeled distinction inside one surface.
- Preserves "Data Browser is the data surface" mental model while still giving Models curated treatment.
- The dbt nuance has a natural home: import-time, the dbt model becomes a draft in `Models`, while the warehouse view it's built on stays in `Raw`. Two rows in two tabs is less confusing than two rows in one tab.
- Search and filter can span all sub-tabs (an `All` view), or scope to current sub-tab.

**Where it strains.**
- Three IA decisions to make instead of one (which sub-tabs, what's default, what's the global-search behavior).
- If `Models` lives both here AND as a top-level navigation, it's redundant. Forces a decision: is Models a Data Browser sub-tab, or a sibling tab to Data Browser? (Hex makes it a sub-tab. ThoughtSpot today doesn't separate it.)
- Files-as-sub-tab can feel light if there are few uploads; merging into `Raw` is also defensible.

---

## Decision

**Option B — Data Browser is the data catalog (raw / external only). Models is a separate top-level surface for ThoughtSpot Models (including drafts from dbt imports).**

### Shape

1. **Data Browser = the catalog of data sources you have access to.** Warehouse tables, warehouse views (including dbt-built views as warehouse artifacts), uploaded files. This is the "where does the data live?" surface.
2. **Models tab = ThoughtSpot Models.** Hand-built models, plus draft Models auto-created from dbt imports. This is the "what have I curated?" surface — where edits, improvements, AI context, and governance live.
3. **dbt imports produce two artifacts in two places:**
   - The warehouse view that dbt built → stays in **Data Browser** (it's a warehouse artifact, not a TS curation)
   - The draft TS Model derived from the dbt model → lives in **Models** (this is where edits and improvements happen)
4. **No wrapper layer.** The draft Model *is* the dbt model in TS — not a duplicate or a translation layer. Same identity, edited in the Models surface.

### Why

- **Clean conceptual split.** "Where the data is" (Data Browser) vs "what I've curated for use" (Models). Mental model that maps to how analytics engineers already think.
- **Aligns with V2's existing IA.** Models is already a top-level tab. Option B gives Data Browser a distinct role rather than duplicating Models.
- **Honest about dbt's two identities.** The warehouse view (where the data physically lives) and the TS Model (what we're curating) are real, separate artifacts. Putting each in its right surface preserves both.
- **Closest peer model is Sigma** — catalog (warehouse-shaped) vs Datasets/Data Models (workspace-shaped). Sigma-style separation is the cleanest in the peer set.
- **Differentiation:** ThoughtSpot's Models surface gets to lean into curation, AI context, drafts, and improvements — without dragging warehouse-catalog UX into it.

### Tradeoffs accepted

- **One extra click to find a Model** vs. having it in the Data Browser list. Worth it for clarity.
- **"Data Browser" no longer means "all the data" in the absolute sense** — it means "all the data sources." Slight learning curve from current TS UX, but the gain in clarity is real.
- **Search across both surfaces** becomes a global search problem (workspace-level), not a Data Browser feature. Defer the design.

---

## What this defers

- The Models surface itself (orthogonal — but the relationship between Data Browser and Models needs to be explicit)
- Search architecture / facets
- Endorsement / governance affordances on rows (Hex `Endorsed` is a useful reference — [learn.hex.tech endorsements context](https://learn.hex.tech/tutorials/connect-to-data/setup-for-ai-agents))
- How draft-from-dbt Models are visually distinguished from hand-built Models

---

## Explorations needed before building?

Yes — once scope is decided, explore 2–3 Data Browser layouts in `Playground.tsx`. Specifically:
- Hex-style sub-tabs (Option C).
- Single-list-with-filters (Option A) with dbt-metadata enrichment on raw-table rows.
- Two-surface (Option B) — what the navigation between Data Browser and Models looks like.

---

## Gaps in research

- **Omni's exact UI for browsing modeled vs raw inside a workbook** — the docs page on the field picker required following links not fetched here. The "schema model mirrors the database; topics are joined views" framing is solid, but the *visual* treatment (sections? tabs? collapse?) wasn't pinned down.
- **Hex draft-model semantics** — Hex's docs don't explicitly use "draft" for dbt-synced semantic models. They describe them as synced (likely read-only on the Hex side), which is a different model from ThoughtSpot's "dbt becomes editable draft." There may not be a perfect peer for the draft pattern.
- **ThoughtSpot dbt sync edit constraints** — docs say users "can only add" columns/joins, not remove/change. Worth confirming before settling on draft semantics, since "draft" implies full editability.
- **Snowflake Snowsight database explorer** — tried to fetch, got 404. Pattern inferred from general knowledge (DB tree, all object types together) but not freshly cited.
- **No screenshots reviewed.** All findings are from text docs and blog posts. A pass through actual product screenshots (Hex Data Browser, Omni workbook, Sigma left nav) would tighten the design references.

### Citations

- Hex Data Browser: https://learn.hex.tech/docs/explore-data/data-browser
- Hex dbt Integration: https://learn.hex.tech/docs/connect-to-data/data-connections/dbt-integration
- Hex Semantic Model Sync: https://learn.hex.tech/docs/connect-to-data/semantic-models/semantic-model-sync/intro
- Hex Semantic Authoring: https://hex.tech/blog/introducing-semantic-authoring/
- Hex changelog (Data Browser tabs): https://learn.hex.tech/changelog/2022-11-08
- Omni Workbook: https://docs.omni.co/docs/querying-and-sql/workbook
- Omni Model Management: https://docs.omni.co/docs/modeling/manage-develop/model-management
- Sigma Data Catalog: https://help.sigmacomputing.com/docs/manage-data-catalog
- Sigma Warehouse Views: https://help.sigmacomputing.com/docs/create-and-manage-workbook-warehouse-views
- Looker Explores: https://docs.cloud.google.com/looker/docs/creating-and-editing-explores
- dbt Catalog: https://docs.getdbt.com/docs/explore/explore-projects
- ThoughtSpot Data Workspace: https://docs.thoughtspot.com/cloud/latest/data-workspace
- ThoughtSpot Models: https://docs.thoughtspot.com/cloud/latest/models
- ThoughtSpot dbt Integration: https://docs.thoughtspot.com/cloud/latest/dbt-integration
