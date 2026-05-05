# Data Browser UI Patterns: Hex, Omni, Sigma

Research for Data Studio V2 — how peer platforms shape their data-browse surface, with a particular eye on the "two left bars" problem (app-level nav alongside a connection/schema/table tree).

Note on confidence: Hex has the richest public docs; Omni's workbook UI is described mostly via release notes (videos behind a sign-up wall); Sigma's "Select source" dialog is documented in prose but live screenshots are sparse in public docs. Calls below are flagged when based on prose rather than confirmed screenshots.

---

## 1. Hex — Data Browser

### Where it lives
Hex avoids the two-left-bar problem by collapsing both navigations into **one sidebar with switchable panes**. The left sidebar of a project hosts a vertical list of panes — Outline, Project Search, **Data Browser**, Environment, Files, Variables, Scheduled Runs, History, Command palette. Only one pane is rendered at a time; the user clicks a pane label/icon to swap content. There is no separate icon rail outside this sidebar in the project view ([projects intro](https://learn.hex.tech/docs/explore-data/projects/projects-introduction), [develop your notebook](https://learn.hex.tech/docs/explore-data/notebook-view/develop-your-notebook)).

### Layout shapes (three modes)
1. **Inline pane** — the default. Lives in the project's left sidebar at standard sidebar width. Tree of connections → schemas → tables ([data browser docs](https://learn.hex.tech/docs/explore-data/data-browser)).
2. **Wide preview** — clicking the eye icon next to a table opens a wider overlay with a 100-row preview plus metadata, while keeping the tree visible.
3. **Full-screen view** — added in the April 2024 update. The browser expands to fill the canvas with **Recently Used** and **Favorites** tabs at the top, used for serious exploration and as a "blank state" entry point ([2024-04-03 changelog](https://learn.hex.tech/changelog/2024-04-03), [Spring 2024 release](https://hex.tech/blog/spring-release-2024/)).

### Tree shape
"Schemas and tables unroll in **one tree view**" — there is no separate dbt area. Connection → schema → table → columns. Semantic projects (and their models, dimensions, measures) hang off the same connection node ([2022-11-08 changelog](https://learn.hex.tech/changelog/2022-11-08), [data browser docs](https://learn.hex.tech/docs/explore-data/data-browser)).

### Search
Pinned at the top. Prefix syntax: `database:`, `schema:`, `table:` to scope to one object type. Filterable to "favorites only" ([data browser docs](https://learn.hex.tech/docs/explore-data/data-browser)).

### Table detail panel
On hover: preview, query, copy qualified name, search-within-table actions. On click/preview:
- 100-row sample of rows
- Column list with names, datatypes, descriptions
- **dbt metadata inline with raw warehouse tables**: model/source/column descriptions, last-run timestamp, source-freshness results, test status, link to dbt Cloud docs
- Editable user-added descriptions
([dbt integration](https://learn.hex.tech/docs/connect-to-data/data-connections/dbt-integration), [data browser docs](https://learn.hex.tech/docs/explore-data/data-browser))

---

## 2. Omni — Field Picker

### Where it lives
Omni does not have a separate "data browser" surface; **all data browsing happens inside a workbook's Field Picker**, on the left side of the workbook canvas ([build analyses in workbooks](https://docs.omni.co/docs/querying-and-sql/workbook), [field picker 2.0 demo](https://omni.co/demos/20231201)).

### Tree shape — two layers
Omni's organizing concept is the **Topic** (curated, joined dataset that hides warehouse complexity). The field picker is rooted at a topic; underneath, dimensions and measures are split into separate sections, each "nested under individual tables in your data warehouse." Group labels (`group_label`) and `display_order` let modelers create custom nesting levels — the January 2026 update made this **multi-level nesting arbitrary depth** ([topics docs](https://docs.omni.co/modeling/topics), [2026-01-02 demo](https://omni.co/demos/20260102), [Omni docs guide](https://dataplatr.com/blog/a-comprehensive-guide-to-omni-analytics-documentation)).

Raw warehouse tables vs joined views: surfaced via the model layer (`schema model` mirrors raw tables; `extension model` adds joins/topics). Aliased views may be hidden from the workbook's "All Views and Fields" picker when only the topic-level presentation is desired — modelers control this ([views docs](https://docs.omni.co/modeling/views)).

### Search
"Elegant new controls for simpler, more-powerful search… focus on SQL queriers" — the field picker has a top search input. Verification badges show next to unverified fields ([demo Dec 2023](https://omni.co/demos/20231201)).

### Click behavior
A field click adds it to the workbook query; right-click opens a context menu (apply aggregations like sum/avg/count distinct on dimensions, build duration fields from timestamps, edit). A `+ Add Field` button at the bottom creates custom calc fields. SQL queries written in the workbook produce "potential dimensions" that surface at the top of the picker with an "Add to Workbook" button — this blurs the line between "browsing" and "modeling" ([custom fields docs](https://docs.omni.co/analyze-explore/custom-fields)).

### Two-left-bar handling
There is no second left bar — the workbook itself is the surface. The app-level home/IDE nav lives on a thin top bar; once you're in a workbook, the left side belongs entirely to the field picker.

---

## 3. Sigma — Data Catalog and "Select source"

### Two distinct surfaces
Sigma splits data browsing into two surfaces, which is unusual:

**A. Data Catalog** (admin/management surface): accessed from Sigma Home → Connections. Left navigation panel shows a hierarchical tree: **databases/catalogs → schemas → tables**. Used to add metadata (descriptions, certification badges, column descriptions) — not the primary surface for picking data while building ([manage data catalog](https://help.sigmacomputing.com/docs/manage-data-catalog)).

**B. "Select source" dialog inside a workbook** (build-time picker): triggered by the **Add element bar** at the bottom of the workbook → Data → Table. A modal/dialog appears with:
- A **Suggested data sources** primary tab
- Search input
- Browse access to workbook elements, tables, datasets, data models
- Sources already in use elsewhere shown with **different icons** to disambiguate
- A column-level preview where you can deselect columns before clicking Add
([create a data element](https://help.sigmacomputing.com/docs/create-a-data-element), [create and manage tables](https://help.sigmacomputing.com/docs/create-and-manage-tables))

Critically: data models, raw warehouse tables, and CSV uploads appear in the **same picker**, differentiated by icon — not by separate tabs ([create a data element](https://help.sigmacomputing.com/docs/create-a-data-element)).

### Table detail (catalog view)
Clicking a table in the catalog opens an info area with description, certification badge, connection details, last-modified timestamp, columns tab (name, friendly name, visibility, format, descriptions, primary-key section at top). A separate "Column Details" popup gives stats, top values, and summaries ([manage data catalog](https://help.sigmacomputing.com/docs/manage-data-catalog), [phData on tables](https://www.phdata.io/blog/fundamentals-of-using-table-elements-in-sigma-computing/)).

### Data Models page (a third related surface)
A list/card layout (not a tree) showing each reusable model's title, document-reference count, row/column counts, last-materialization timestamp, top documents and team members ([navigate data models](https://help.sigmacomputing.com/docs/navigate-data-models)).

### Two-left-bar handling
Sigma sidesteps it by **not putting the data tree in a persistent left bar inside the workbook at all** — it lives in a transient modal triggered from the bottom Add element bar.

---

## 4. Cross-cutting findings

### Patterns common across all three
- **Single tree mixing raw + modeled assets** (Hex, Sigma). Omni inverts this by making the curated topic primary and treating raw views as opt-in. None use separate "raw" vs "dbt" tabs.
- **Search is always pinned to the top** of the data surface. Hex goes furthest with prefix scoping (`database:`, `schema:`, `table:`).
- **Click-to-preview** with a 100-row sample is universal as the default interaction.
- **Metadata enriches inline** (descriptions, freshness, tests, certification) — none use a separate "details" route.

### How they each avoid the two-left-bar problem
| Platform | Pattern |
|---|---|
| Hex | One sidebar, **switchable panes** — Data Browser is a pane, not a second bar. Optional **full-screen takeover** for heavy browsing. |
| Omni | **No separate browse surface.** Data tree IS the workbook's left rail. App nav lives on a thin top bar. |
| Sigma | **Modal on demand** — triggered from the bottom Add element bar, not a persistent left tree. Catalog is a separate route entirely. |

None of the three runs two persistent left bars side by side. **That validates the instinct that our current sketch is wrong.**

### dbt models specifically
- **Hex**: same tree as raw tables, dbt metadata layered onto the same node ([dbt integration](https://learn.hex.tech/docs/connect-to-data/data-connections/dbt-integration)).
- **Omni**: dbt-style joined logic surfaces as Topics (separate hierarchy layer), but inside the same field picker.
- **Sigma**: data models appear in the same Select-source dialog as raw tables, **icon-differentiated**, not tab-separated.

### Three lessons to borrow

**1. Replace the second left bar with a switchable pane on the V2 left nav.** Take Hex's pattern — Overview / Projects / **Data** / Connections / Monitoring / Governance stays as the single left rail. Clicking **Data** swaps the pane content to a connection→schema→table tree (search at top, dbt + raw + files in one tree, icon-differentiated). No second bar, no nav competition.

**2. Add a full-screen mode for serious browsing.** Hex's full-screen Data Browser with Recently Used / Favorites tabs is a copy-worthy pattern when users need to scan the whole catalog rather than pick one table. Trigger via an expand icon on the pane.

**3. Mix dbt views, raw tables, and uploaded files into one tree, differentiated by icon and inline metadata badges** — Sigma's icon approach plus Hex's inline dbt metadata. Avoid Sigma's split between Catalog and Select-source — for V2 a single surface is enough. Reserve the "Topics" layering pattern (Omni) for when ThoughtSpot Models become the primary entry, but keep them in the separate Models tab as already decided.

---

## Sources
- Hex — [Data browser docs](https://learn.hex.tech/docs/explore-data/data-browser)
- Hex — [Develop your notebook](https://learn.hex.tech/docs/explore-data/notebook-view/develop-your-notebook)
- Hex — [Projects introduction](https://learn.hex.tech/docs/explore-data/projects/projects-introduction)
- Hex — [dbt integration](https://learn.hex.tech/docs/connect-to-data/data-connections/dbt-integration)
- Hex — [Changelog 2024-04-03 (Data browser updates)](https://learn.hex.tech/changelog/2024-04-03)
- Hex — [Changelog 2022-11-08 (New Data Browser)](https://learn.hex.tech/changelog/2022-11-08)
- Hex — [Spring Release 2024](https://hex.tech/blog/spring-release-2024/)
- Omni — [Build analyses in workbooks](https://docs.omni.co/docs/querying-and-sql/workbook)
- Omni — [Topics docs](https://docs.omni.co/modeling/topics)
- Omni — [Views docs](https://docs.omni.co/modeling/views)
- Omni — [Custom fields](https://docs.omni.co/analyze-explore/custom-fields)
- Omni — [Field Picker 2.0 demo, Dec 2023](https://omni.co/demos/20231201)
- Omni — [Multi-level nesting demo, Jan 2026](https://omni.co/demos/20260102)
- Omni — [Comprehensive guide (Dataplatr)](https://dataplatr.com/blog/a-comprehensive-guide-to-omni-analytics-documentation)
- Sigma — [Manage data catalog](https://help.sigmacomputing.com/docs/manage-data-catalog)
- Sigma — [Navigate data models](https://help.sigmacomputing.com/docs/navigate-data-models)
- Sigma — [Create a data element](https://help.sigmacomputing.com/docs/create-a-data-element)
- Sigma — [Create and manage tables](https://help.sigmacomputing.com/docs/create-and-manage-tables)
- Sigma — [phData: Table elements fundamentals](https://www.phdata.io/blog/fundamentals-of-using-table-elements-in-sigma-computing/)
