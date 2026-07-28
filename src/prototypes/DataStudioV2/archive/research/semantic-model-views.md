# Semantic model view research
_What Sigma, Databricks Genie, Omni, Hex, and Snowflake show in their published model / data space "info" views._

Most web fetches were blocked during research. Best signal came from Sigma and Databricks Genie.

---

## Sigma — Data Model Overview page

**Structure:**
- Header: edit button, description, owner, last updated, count of reusable elements
- Element cards (expanded): connection details, materialization timestamps, top 3 referencing docs, top 3 active users, published state
- Element cards (collapsed): title, doc reference count, row/column dimensions
- "Explore" button: opens model in a new workbook
- "View details" button → modal with 3 tabs:
  - **Columns**: name, type, format, description, null %, distinct values, min/max, stddev
  - **Controls**: filters applied, control IDs, types, defaults
  - **Lineage**: upstream warehouse sources + downstream workbooks/models

**Key insight:** Sigma separates the landing page (what can I do with this?) from the details modal (deep metadata). The landing page is about *action* (Explore), not documentation.

**From catalog view:** Description, certification badge (Endorsed/Warning/Deprecated), column info, connection details, lineage.

---

## Databricks Genie — Space consumer UI

**Structure:**
- Main area: conversational chat
- Left sidebar with 3 tabs:
  - **About**: owner, tags, space description, **common questions** (pre-set sample Qs)
  - **Data**: tables and columns with descriptions
  - **Instructions**: text guidance, joins, SQL expressions, functions
- Share button

**Key insight:** "Common questions" is a first-class feature — immediately tells a user what to ask. This is the most useful signal for our Info tab design. The About tab is the entry point; data structure is secondary (Data tab).

**Answer display:** Understanding the question → Found relevant data → Thinking steps → answer. Response is rich and trustworthy.

---

## Omni — Topics

Research mostly blocked. Known: Field Picker 2.0 for field search in the workbook; topic-level permissions. Published topic view details not captured.

---

## Hex, Snowflake — No useful content captured

Both were blocked by permission denials.

---

## Takeaways for Data Studio Info tab

1. **Lead with purpose, not structure.** Sigma leads with "Explore." Genie leads with "common questions." Neither leads with a table list.
2. **Sample questions belong in Spotter, not Model View.** When Sara is in the model view, she is a builder — debugging, caching, or expanding the model. Sample questions are irrelevant to her. They belong in Spotter/SpotIQ, surfaced to the analyst when they select a model to query. **This is a suggestion for the SpotIQ team, not a DataStudio feature.**
3. **Metrics > tables in hierarchy.** The computed layer (metrics) is what makes the model AI-ready. Tables are raw plumbing — secondary.
4. **Certification/trust signals.** Sigma has "Endorsed / Warning / Deprecated" badges. For us: published version + last updated is the trust signal.
5. **Lineage is a power-user feature.** Useful but doesn't belong on the Info tab — maybe Data quality or a future Lineage tab.
