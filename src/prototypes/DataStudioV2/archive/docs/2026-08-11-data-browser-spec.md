# Data Browser — competitive research and closed decisions

_2026-08-11. Written to close the Data Browser for **dev**, not just demo. Every open
question from the session gets an answer and the evidence behind it._

**The decisive reference is Tableau's Data Source page** — it has the same shape as our
canvas (left pane of connections/tables → drag onto a join canvas → preview grid below),
which none of the tools in the earlier research (Hex, Omni, Sigma) do. Where Tableau and
the others disagree, Tableau's evidence is weighted higher for structural questions.

---

## 1. All connections at once, or one at a time via a dropdown?

**Decision: show all connections together in one tree. No single-connection mode.**

| Platform | Pattern |
|---|---|
| **Tableau** | All connections listed in the left pane under a **Connections** header, with an **Add** button to add more. Cross-database joins *require* multiple connections in one data source. |
| Hex | One tree, all connections, schemas/tables unrolled together |
| Sigma | All sources in one picker — tables, datasets, models — differentiated by icon, not by tab |
| Snowsight | Database Explorer over all databases; Universal Search across the account |
| Omni | Rooted at a Topic, with raw views nested underneath |

**Why this closes rather than leans:** Tableau makes it structural, not stylistic — a
cross-database join is *impossible* unless both connections are present in the same
pane, because they have to belong to one data source. Our MVP statement is multi-source
by definition. A dropdown that shows one connection at a time would make the core use
case harder, not simpler.

**Connection filtering stays** — as a *facet* to narrow a unified tree (already decided),
never as a mode that hides the others.

---

## 2. Side panel or modal?

**Decision: docked, collapsible left panel. Not a modal.** Consider Hex-style full-screen
as a secondary mode later; not MVP.

| Platform | Panel or modal | Has a live canvas to protect? |
|---|---|---|
| **Tableau** (Data Source page) | **Docked left pane** | **Yes — same shape as ours** |
| Alteryx / KNIME / Matillion | Docked panel, drag onto canvas | Yes |
| Hex | Docked pane + optional full-screen takeover | No |
| Sigma | Modal from an Add action | No |
| Power BI | Modal (Navigator) | No — load-then-model, not a live canvas |

**Why this closes:** the split is clean and explanatory. **Every tool with a persistent
canvas uses a docked panel. Every tool that uses a modal has no canvas.** Sigma and Power
BI aren't counter-examples — a modal is fine when there's nothing behind it to keep
referencing. Tableau is the direct precedent: same interaction (drag tables onto a join
canvas), docked panel, plus an Add button for more connections.

---

## 3. Feature inventory — what belongs in a data browser

Compiled from all platforms surveyed, with an MVP call on each.

| Feature | Who does it | MVP? |
|---|---|---|
| **Search** | Universal. Hex adds prefix scoping (`database:`, `schema:`, `table:`); Snowsight adds typo tolerance + semantic matching | ✅ **In** — plain search. Prefix scoping is a nice-to-have, not MVP |
| **Connection → database → schema → table tree** | Universal | ✅ **In** — already built |
| **Add connection** | Tableau (button in the Connections header) | ⚠️ **Decide** — see open items |
| **Refresh** | Tableau (refresh button in left pane) | ✅ **In** — cheap, and stale schema is a real failure mode |
| **Table preview (sample rows)** | Hex 100 rows; Tableau data grid 1,000 rows | ✅ **In** — but this is our existing preview pane, not a browser-local feature |
| **Column list with data types** | Hex, Sigma, Power BI, our current build | ✅ **In** — already built (chevron expands a table) |
| **Column selection before add** | Sigma, Power BI Navigator | ✅ **In** — see §4 |
| **Table metadata** (description, row count, last synced, owner) | Hex (rich: dbt freshness, tests, descriptions), Sigma (certification badges), Tableau (tooltips) | ✅ **In**, minimal — row count + last synced + description on hover/expand. We already hold this in `tableMetadata` |
| **Favorites / starring** | Hex (star icon, Favorites tab) | ❌ **Out of MVP** — real scale answer, but not needed to prove the flow |
| **Recently used** | Hex (tab) | ❌ **Out of MVP** — same reasoning |
| **Full-screen browse mode** | Hex (added 2024) | ❌ **Out of MVP** |
| **Metadata grid** (fields-as-rows, bulk rename/hide) | Tableau | ❌ **Out of the browser** — this is our model-level Fields panel's job (item #5), not the warehouse browser's |
| **Certification / endorsement badges** | Sigma, Hex | ❌ **Out of MVP** — governance, separate concern |

---

## 4. Column selection — how many, and how to make it intentional

**Two established philosophies, and they split cleanly:**

| Philosophy | Who | How |
|---|---|---|
| **Pick before adding** | Sigma, Power BI | Sigma: preview a source → select/deselect columns → **Add**. Their own docs recommend *"deselect all columns and select only the columns required by business users."* Power BI Navigator: tick tables → preview → **Load** |
| **Bring everything, curate later** | Tableau, Hex, Omni | Tableau brings all fields, then you hide them in the **metadata grid** (bulk rename/hide, fields-as-rows). Hex/Omni bring the whole table and curate downstream |

**Decision: default to all columns selected, with the count visible and editable at add time. Not a gate.**

- Ticking every column by hand before a table can land on the canvas is friction on the
  most common action in the product, and our own prior decision already removes the
  equivalent friction elsewhere (`research/connections-tab.md` explicitly killed
  ThoughtSpot's setup-time table/column picker as its "biggest friction").
- But "bring everything silently" isn't intentional either, which is the thing you asked
  about. **The middle path: the table row shows `12 of 12 columns` and that's clickable to
  refine.** Selection is visible and one click from editable, without blocking the add.
- **Refinement continues after add** — the model-level Fields panel (item #5) is where
  columns get curated later, exactly as Tableau's metadata grid does. Add-time doesn't
  have to be the only chance, which is what makes the low-friction default safe.

⚠️ **Interaction with the FK rule:** `research/fk-column-deduplication.md` already decided
that joining auto-excludes the fact table's FK. So the count shown at add time will change
after a join. The count needs to reflect actual included columns, not the original tick
state, or it'll read as a bug.

---

## 5. Scale — pagination or infinite scroll?

**Decision: scroll + search. No pagination in the tree.**

**Honest finding: no surveyed platform documents pagination inside a data-browser tree.**
Not Tableau, Hex, Sigma, Omni, or Snowsight. They handle scale three other ways:

1. **Search as the primary tool** — Snowsight's Universal Search is explicitly built for
   this (partial matches, typos, names that differ from the search term).
2. **Favorites + Recently Used as shortcuts** — Hex's explicit answer to "I have hundreds
   of tables and use six of them."
3. **Lazy expansion** — schemas and tables only load when a node is expanded.

Pagination is a **flat-list** pattern, and a tree is hierarchical — "page 2 of schemas"
isn't a coherent thing to ask for. Note the contrast with our **Data Objects page**, which
*is* a flat list and correctly *does* paginate (already built, 8 per page).

**Also worth knowing:** public docs don't cover scroll performance at thousands-of-tables
scale. That's an engineering question (virtualised list), not a UX one — flag it to dev
rather than designing around it.

---

## 6. How platforms show a model's own tables, columns and formulas

This was your last question, and the answer is consistent enough to be a rule.

**Every platform surveyed uses two separate surfaces: a warehouse browser and a model
fields panel. Nobody merges them.**

| Platform | Warehouse browser | The model's own fields |
|---|---|---|
| **Tableau** | Data Source page: left pane (connections/tables) + canvas + data grid | **Worksheet Data pane** — dimensions/measures split, groupable into folders. **Calculated fields carry an `=` prefix** on their type icon |
| **Looker** | n/a (no raw browsing) | Field picker: collapsible view sections, Dimensions / Measures / Filter-only headers. **Custom fields and table calculations get their own "Custom Fields" section** |
| **Omni** | n/a as separate surface | Field picker rooted at a Topic, dimensions/measures nested under tables |
| **Hex** | Data Browser (raw) | Separate **Data Models** tab |

**Two patterns to borrow directly for item #5 (the Fields/Metrics panel):**

1. **Derived fields are visually marked or sectioned, always.** Tableau marks them
   inline (`=` prefix); Looker gives them a dedicated section. Both work; neither hides
   them among source columns. Our existing `fx` badge in Spreadsheet is already this
   pattern — reuse it rather than inventing a second marker.
2. **The model's fields panel is a different surface from the warehouse browser.** This
   independently validates keeping Data Browser (warehouse, unmodeled) separate from the
   Fields/Metrics panel (model, curated) — which is also what
   `research/data-browser-tab.md` decided for a different reason. Two lines of evidence,
   same conclusion.

**Corollary that closes an open question from the tracker:** *"Does browse-time column
ticking still stand alone once the Fields panel exists, or should they converge?"* —
**They stay separate.** No platform merges them, and they answer different questions:
"what exists in the warehouse" vs. "what's in my model."

---

## Answers, condensed

| Question | Closed answer |
|---|---|
| All connections or one dropdown? | **All, in one tree.** Cross-database join requires it (Tableau) |
| Side panel or modal? | **Docked panel.** Every tool with a canvas docks; only canvas-less tools use modals |
| Search? | **Yes**, plain search. Prefix scoping not MVP |
| Filter? | **Yes**, connection facet on a unified tree |
| Table info / metadata? | **Yes**, minimal — row count, last synced, description |
| See table columns? | **Yes**, chevron expand (already built) |
| Column selection: all or some? | **All by default**, count visible, one click to refine, further curation in the Fields panel |
| Pagination or infinite scroll? | **Neither — scroll + search.** Nobody paginates a tree. Virtualisation is a dev concern |
| Add connection from browser? | **Open** — see below |
| Refresh? | **Yes** |
| Favorites / recents / full-screen? | **Out of MVP** |
| Where do model fields + formulas live? | **A separate panel** from the browser, with derived fields marked (`fx`, reusing Spreadsheet's badge) |

---

## Changes to build — decided 2026-08-11

| # | Change | Status |
|---|---|---|
| 1 | **Connection filter** — facet narrowing the unified tree to one connection. All connections shown by default. | To build |
| 2 | **Search** — one box over database + schema + table names. Results are a **flat list with `connection · database · schema` context**, not a filtered tree. Clicking a result jumps the tree to that item, expanded. | To build |
| 3 | **Column selection → flyout, not inline expansion.** Hovering a table row reveals `+` (add all — fast path) and an info icon. The icon opens a **panel beside the tree** with table metadata + a checkboxed column list + Add. The tree never expands vertically. Replaces the current inline expand-to-tick. | To build |
| 4 | **`Data` / `Fields` tabs** at the top of the dock, so the Fields/Metrics panel costs no new chrome. | **Deferred to item #5** — the Fields panel doesn't exist yet, and shipping a tab pointing at nothing breaks the wire-it-or-remove-it rule. Build the tabs *with* that panel. |

Column default stays **all selected**, with the count visible and editable — per §4.

## Still genuinely open

1. **Add-connection from inside the browser.** Tableau puts it right in the Connections
   header, and it's arguably essential for a multi-source product — you discover you need
   a second warehouse *while* building. But connection setup is an auth flow that lives in
   Connections today, and duplicating an entry point to it is a scope question, not a
   design one. **Needs a call.**
2. **Click vs. drag as the add gesture.** Tableau is drag-only onto the canvas; Sigma and
   Power BI are click-then-confirm. Both defensible. Our build currently has click (`+`).
   Drag matches the canvas metaphor better; click is faster and more accessible. **Could
   support both** — drag as discoverable, click as the fast path.
3. **Scroll virtualisation** at thousands-of-tables scale — engineering, not design.

## Sources

- [Data Source Page | Tableau](https://help.tableau.com/current/pro/desktop/en-us/environment_datasource_page.htm)
- [Join Your Data | Tableau](https://help.tableau.com/current/pro/desktop/en-us/joining_tables.htm)
- [Blend Your Data / multiple connections | Tableau](https://help.tableau.com/current/pro/desktop/en-us/multiple_connections.htm)
- [Work with Data Fields in the Data Pane | Tableau](https://help.tableau.com/current/pro/desktop/en-us/datafields_understanddatawindow.htm)
- [Organize and Customize Fields in the Data Pane | Tableau](https://help.tableau.com/current/pro/desktop/en-us/datafields_dwfeatures.htm)
- [Create a data element | Sigma](https://help.sigmacomputing.com/docs/create-a-data-element)
- [Three Tips for Using Columns in Sigma | phData](https://www.phdata.io/blog/three-tips-for-using-columns-in-sigma-computing/)
- [Connect to data in Power BI Desktop | Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connect-to-data)
- [Data browser | Hex](https://learn.hex.tech/docs/explore-data/data-browser)
- [Data browser updates, Apr 2024 | Hex](https://learn.hex.tech/changelog/2024-04-03)
- [Explore and manage database objects in Snowsight | Snowflake](https://docs.snowflake.com/user-guide/ui-snowsight-data)
- [Search Snowflake objects with Universal Search | Snowflake](https://docs.snowflake.com/en/user-guide/ui-snowsight-universal-search)
- [Changing the Explore menu and field picker | Looker](https://cloud.google.com/looker/docs/changing-explore-menu-and-field-picker)
- [Adding custom fields | Looker](https://docs.cloud.google.com/looker/docs/custom-fields)
