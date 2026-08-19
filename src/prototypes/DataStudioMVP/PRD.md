# Data Studio - MVP — product requirements

_The journey, then every feature as the user meets it, with the expected behaviour and where it
stands. **This doubles as the test plan.** The why, the vocabulary and the principles are in
`FOUNDATION.md` — not repeated here._

**Last updated:** 2026-08-19

**Status key:** ✅ works · 🟡 partial · ❌ not built · ❓ behaviour not decided

---

## The MVP journey

_Stated by Vivek, 2026-08-17. This is what the MVP is. Everything below serves it._

**The situation.** A team uses **one data warehouse**. Their structured tables are already prepared
and clean in it. Their business team uses ThoughtSpot for analytics. A business analyst wants to let
that business team get insights from data that is clean but sitting in a warehouse.

**The journey:**

1. Connect to that warehouse and bring **the metadata only** of the required tables
2. Start a new model in ThoughtSpot
3. Choose the connection
4. Select the tables
5. Preview each table to check it
6. Choose which columns are needed to answer the business questions
7. Join the tables and configure the joins
8. Preview the final data and confirm there is no error — duplicated rows and the like
9. Check the semantic information Spotter will need, and update it
10. Add formulas
11. Define filters that business users or the agent can use at their end
12. Use the spreadsheet to explore the data while modelling
13. **Enable it for Spotter**, the business-user agent

All of it either **manually or with the modelling agent, SpotterModel** — the agent already sitting
in the canvas's left panel.

⚠️ **One warehouse, metadata only.** Two consequences that define the cut: nothing is copied, so
every query is live against the source; and there is nothing to bring over, so **canvas caching is
not in this prototype at all.**

### The workflow we build, in order

_Vivek, 2026-08-19. The journey above says what the MVP covers; this says what the user does, in
sequence, and it is the thing to walk end to end._

1. Open a new model
2. Drop tables on the canvas, **selecting which columns to bring in** as you go
3. Preview the columns added from each table
4. **Join the tables visually on the canvas**
5. **Switch to the spreadsheet and create formulas**
6. **Explore further in the spreadsheet by creating filters**
7. **Save the formulas and filters to publish as part of the model** — ❓ this bit needs working out
8. Test using **Search data** — position to be decided, Vivek adding
9. **Publish the model**

⚠️ **Steps 5 and 6 are the boundary.** Formulas and filters are authored **in the spreadsheet and
nowhere else** — not on a card, not on a join edge, not from the Fields pane, and not in a side
panel. We borrow the object from the spreadsheet, so we borrow its pattern too: a modal.

Two things this list does not say, and neither is assumed cut: **checking and updating the semantic
information** (step 9 of the journey above), and whether **Publish** replaces Save — the journey has
no draft state, and "publish" implies one.

---

## Phases

This prototype is the MVP. The phases after it are where the product goes, and the **Demo cut in
`DataStudioV2` is the north star** — already built, so the target isn't hypothetical.

| Phase | Scope | State |
|---|---|---|
| **MVP** | The journey above. One warehouse, metadata only, live queries | **This prototype** |
| **Next** | **Multi-source**, and the caching that makes a cross-warehouse join possible at all | Built in `DataStudioV2`, out of scope here |
| **Then** | **Python and SQL** — code, cleaning, and data from anywhere: CSV, Google Sheets, any app. Unlocks "start from any messy data and model it" | |
| **Then** | **AI readiness** — the model as something an agent consumes, and how a human understands that | |
| **Then** | **Continuous improvement and monitoring** — a model decays, so this is how it's maintained | |
| **North star** | The full agentic experience: a model created from conversation, readiness checks, the Spotter hand-off | Built at `DataStudioV2` `?v=demo` |

---

# Feature by feature

## 1 · Open a canvas

**The entry flow**, six steps. The old/new canvas choice sits after the model type, not before: at a
nav submenu the user hasn't yet said what kind of model they want, so "old" and "new" mean nothing to
choose between. It sits **after the connection** too — the connection is a property of the model
whichever canvas you use, so it can be answered first, which leaves the canvas choice as the last
thing before you land on one.

1. `+` icon
2. **Model** → Suraj's model-type modal, unchanged
3. **Build a new model** → ⚠️ only this option continues; every other path closes as before
4. **Choose a connection** → Select connection, master/detail with search
5. **New canvas** → the old-vs-new choice, a card each with a visual and its features
6. Land on the canvas

| Feature | Expected | |
|---|---|---|
| `+ → Model` | Opens the model-type modal directly. No submenu | ✅ |
| Build a new model | Branches to Select connection | ✅ |
| Other model types | Unchanged, no connection or old/new prompt | ✅ |
| Select connection | Search the list, detail on the right, Back / Next | ✅ |
| Old vs new cards | Title, screenshot, two or three features each | ✅ placeholder screenshot and copy |
| **Every step goes back** | Back returns to the previous step, not out of the flow. Escape and the close control still leave entirely | ✅ |
| Old canvas | ❓ **Has no destination.** It used to *be* the model-type modal, and with that moved to the front there is nothing for it to open. Closes, as the honest placeholder | ❓ |
| Empty canvas | Left dock with **Data browser** / **Fields** tabs. Topbar: model name · Query · Save model | ✅ |
| No cache pill | Canvas caching is not in this prototype | ✅ |
| No readiness pill | AI readiness is a later phase | ✅ |
| **No draft state** | Nothing is created until Save. Leave without saving and there is no model | ✅ |

## 2 · Add tables

| Feature | Expected | |
|---|---|---|
| Browse | A **flat list of the chosen connection's tables** — no connection, database or schema levels, and no connection filter. We don't let users sync a schema, a database or several warehouses, so three of the tree's four levels described nothing | ✅ |
| The connection cannot be changed | Chosen at step 5 and fixed. ⚠️ So every table shares a warehouse | ✅ |
| Search | Narrows table names | ✅ |
| Table detail flyout | Click a row → metadata, checkboxed columns, `Add with N columns` | ✅ |
| **Bring all columns** | Every column ticked by default | ✅ |
| **Bring some columns** | Some tables have hundreds of columns, and adding all of them costs load time. So where a table is large there is a fast path: pick only what's needed | 🟡 confirm the untick narrows what actually lands |
| **Change your mind later** | Reopen the table in the browser → the flyout shows which columns are in the model, and you **select and deselect freely** → **Save changes**. The checkbox works both ways: a ticked box that won't untick is a worse lie than having two routes to removal | ✅ |
| Add the same table twice | Not possible. There is no point to it | 🔍 |
| Add a connection from the canvas | **No.** Connection setup is not a canvas job | ✅ by absence |
| Row count / freshness on the row | Not needed. Add only if a reason appears | ✅ by absence |

## 3 · Preview and review a table

| Feature | Expected | |
|---|---|---|
| Data preview | Bottom pane shows the table's rows. **Not actionable** — this is for checking | ✅ |
| Semantic review | Data / Semantic toggle showing description, AI context, synonyms, indexed per column | 🟡 confirm reachable |
| Row counts | The user doesn't care about them | — |

## 4 · Join

**Settings, at parity with the current product:** four join types (Inner · Full Outer · Left Outer ·
Right Outer), three cardinalities (Many:1 · 1:Many · 1:1), composite keys via `+ Add column`. Most
people use inner, but we are selling to enterprise, so all four stay.

| Feature | Expected | |
|---|---|---|
| **Draw the join** | Hover a card → one connect handle on the edge nearest the pointer → drag to another card. Creates the join, infers a shared key from the two tables' columns, opens the config | ✅ |
| Open the panel | Table 1 fixed, Table 2 pre-filled | ✅ |
| **Only one thing is selected at a time** | Two cards come together by being *connected*, not co-selected. Shift no longer extends | ✅ |
| **The join has a name** | Editable, at the bottom of the config form — you name the relationship after defining it, not before. Defaults to `table1 × table2`. A join is a **logical grouping**, not a physical combined entity, so the name shows in the data view's header and **not** on the canvas edge | ✅ |
| **Cardinality is drawn, not written** | Crow's feet on the connector: a fork means *many* that side, a cross-stroke means *one*. Replaces the "Many:1" text badge, matching the shipping product | ✅ |
| **Clicking a join previews it; editing is a separate act** | Click re-scopes the data view to the joined rows and opens Edit / Delete. The config form opens only when asked | ✅ |
| Join keys are visible on the canvas | ❓ Nothing says the join is on `account_id` — it exists only inside the form | ❓ |
| Cardinality | **We auto-propose it.** Users have questions about their own cardinality, so the system offers one and they confirm or change it | ❌ hardcoded `many_to_one` |
| **Preview catches the mistake** | Wrong cardinality shows as repetition in the preview, and the user fixes it. This is the correctness mechanism — not validation, not blocking | ✅ preview exists |
| Never silently change their config | An agent may change something visibly; we never do it quietly | ✅ |
| Join type behaviour | Each type produces the rows it promises | ❌ three of four are identical — right and full outer behave as left outer |
| Key present in both tables | ❓ **The open one.** How is it resolved, and what is a composite key for? | ❓ |
| Composite keys | ❓ Tied to the above. Accepted at input and discarded at Apply — `CanvasJoin` has no field for them | ❌ |
| Delete a table | Its joins are deleted with it. ⚠️ A join names one end by id and the other by table name — both must be matched | ✅ |
| Refuse a join | ❓ Needs validating rather than deciding | ❓ |
| Agent proposes a join | ❓ What the user is reviewing is a question for the agent team | ❓ |

## 5 · Fields — formulas, filters and parameters

**Renamed from Metrics to Fields on 2026-08-19, and the name is the industry's, not ours.** In
LookML a **filter** and a **parameter** are field types alongside dimension and measure — this
pane's contents exactly. Tableau's Data pane calls its contents *data fields* and lists calculated
fields and parameters among them; Power BI's equivalent is the Field list. ⚠️ **Nothing calls this
group "metrics"** — everywhere, a metric is a specific calculated thing rather than the collection,
which is why the old name never settled and why `FOUNDATION.md`'s definition of a metric could never
cover the filters and parameters in the same list. It also frees **Model** to mean only the object.

The pane lists everything in the model: **Table 1 columns · Table 2 columns · formulas · filters ·
parameters**, grouped in that order.

⚠️ **The pane is a view list and nothing else** (Vivek, 2026-08-19): "the goal for the metric panel
is just to have a view list — formulas and filters will get created only from the spreadsheet."
**No `+`, no row menu.**

⚠️ **The spreadsheet is inherited, not ours.** The Insert formula dialog, the formula bar, the
column ▾ and its rename come from another product team. We replicate them so the workflow can be
walked end to end — naming, multi-argument editing and the function reference are theirs.

| Feature | Expected | |
|---|---|---|
| The pane | A **view list** of everything in this model — no authoring, no `+`, no row menu | ✅ sectioned per table, then Formulas / Filters / Parameters |
| Its name | **Fields.** Settled 2026-08-19 against the industry's usage | ✅ |
| What it lists | Every formula, every filter, every parameter. There is no promoted subset to narrow to, because nothing is scratch | ✅ |
| **Formulas are authored in the spreadsheet and nowhere else** | 🟢 **The boundary.** Entry from the toolbar's `fx` or a column ▾ → New calculated field. Not from the pane, not from a card, not in a side panel | ✅ |
| **Insert formula is a modal, not a side panel** | Category dropdown (*All functions* + ThoughtSpot's categories) + search + scrolling function list on the left; signature, one-line description and worked **Examples** on the right; Cancel / **Insert formula** | ✅ |
| **Insert activates the formula bar** | The bar receives `=fn ( arg )` **with the argument selected**, so the next keystroke replaces it. The user completes it there and Enter commits | ✅ |
| **No table to choose** | A formula is added to the **model**, not to whichever table the sheet is scoped to — so there is no picker. ⚠️ *A nuance Vivek flagged for the PM to confirm* | ✅ |
| **Enter adds the column** | Appended at the far right, **loading first, then values**, and the sheet scrolls to it | ✅ |
| **The column is `Untitled n`, renamed from the column ▾** | The spreadsheet's own behaviour, and the spreadsheet is inherited — naming is not ours to design | ✅ lands as `Untitled 1`; the ▾'s Rename is the inherited surface's, visual only here |
| Values compute | Real arithmetic plus the functions the prototype implements: math, text, conversion, date, `IF … THEN … ELSE`, and the simple aggregates (resolved once over the column, not per row) | ✅ |
| ⚠️ **What isn't computed says so** | A listed function the prototype doesn't implement (`GROUP_SUM`, `RANK`, `CUMULATIVE_SUM`, `EDIT_DISTANCE`) is **refused by name** rather than evaluated. So is a term that isn't a column — Enter on an uncompleted `=abs ( number )` names `number` instead of landing a column of zeros | ✅ |
| Writing a formula | They write it, see the column and its values, see it doesn't match what they wanted, and modify it. Again preview, not validation | ✅ |
| Formula column in the whole-model spreadsheet | ✅ — and values are **derived per scope**, not stored, so a formula made while previewing one table still reads correctly against the whole model | ✅ |
| **Edit, delete and save a formula** | ❓ **Open.** The filter has Edit · Delete on its column marker; a formula's marker is the column itself, so the parallel home is the column ▾ — not specced | ❌ |
| Delete a formula | **Yes, deletable.** Anything depending on it **breaks**, and a broken formula needs its own UI state | ❌ |
| **Filters are authored in the spreadsheet and nowhere else** | 🟢 **The boundary** (Vivek, 2026-08-19). Not on a card, not on a join edge, not from the Fields pane, not in a side panel. We borrow the object from the spreadsheet, so we borrow the spreadsheet's pattern with it: a modal | ✅ |
| **What a filter is** | A **Model filter** in ThoughtSpot's terms — *"applied every time that Model is used"*, before the query runs, so results are filtered **even when the search never mentions the filtered column**. Two purposes: limiting a model to the data it is for, and data security, letting different groups see different data without row-level security. ⚠️ Not a Liveboard filter — those are created on the liveboard and are a separate thing | ✅ model-level from the moment it applies |
| **Applying one changes the rows** | The sheet re-renders filtered, and the CSV export matches what is on screen. ⚠️ This is not optional: the whole correctness posture is *they see the data*, so a filter that lists as applied and filters nothing is the one thing we rule out. The model-level filter this replaced did exactly that | ✅ |
| **The filter is a modal, per column** | `Select value for : <column>`, replicating ThoughtSpot's shipping dialog: control → value → divider → **Preview:** chip stating the resolved filter in words → Cancel / Apply | ✅ |
| **A family, not one modal** | Date (Rolling / Fixed → window), number (condition → value, incl. between), string (search → value checklist), boolean (value checklist). The renewal-risk tables have all four | 🟡 built; only the **date** variant had a reference, the other three need Vivek's eyes |
| Entry points | The toolbar's filter icon, or a column ▾ → Filter. **Two routes, one behaviour** — the toolbar does exactly what that column's ▾ → Filter does | ✅ |
| **Clicking a column selects it, and that arms the toolbar** | A header click selects the column, the way a spreadsheet does: header and cells tint, an underline marks it, and the toolbar's filter activates. Re-click clears it. Dim with a reason when nothing is selected | ✅ |
| **Cell and column are one selection** | The formula bar tracks a selected *cell*; the toolbar acts on a selected *column*. Picking one clears the other, so there is a single answer to what the next action applies to | ✅ |
| **The marker, and the way back** | Applying puts a filled funnel in the column header. Clicking it opens **Edit filter · Delete filter** | ✅ |
| ~~Saving is a promotion~~ | ⚫ **Reversed 2026-08-19.** There is no scratch filter and no promotion step: "by default, whatever you do in a data model does get saved" (Vivek). Applying **is** saving, so Save filter is gone from the marker menu, the funnel has one state, and the pane lists every filter. This also makes filters and formulas consistent — neither has a save step, so neither has a half-in state | ⚫ |
| Progressive filters | ThoughtSpot supports marking a model filter *progressive*, applying only when its table is referenced in a search. Not accounted for | ❌ |
| Filter a formula column | Works — a formula column's values are filterable like any other | ✅ |
| ⚠️ Rolling windows resolve against **today**, the data stops in 2024 | So Rolling → Today on a date column correctly returns no rows. Honest, and confusing on stage. Belongs with "one dataset" | 🟡 |
| Remove a column | Multi-select → Remove. Hidden and returnable, not destroyed | 🟡 control sits in a tab this prototype doesn't have; the pane's per-column delete is the working route |
| **Parameters** | Created from the sheet's toolbar, directly after the formula icon, as **Create parameter**: name, optional description, type (Integer · Decimal · String · Boolean · Date), Allowed values (Any · List · Range), Default value. Cancel / Save | ✅ |
| Parameter variants | List gives a value-per-row editor with + Add value; Range gives Minimum / Maximum and is **disabled for String and Boolean**, which have no ordering; the Default control follows the type | 🟡 built; only the Integer / Any state had a reference |
| Editing a parameter | The pane's parameter row is **clickable**, and Delete lives in the modal footer. ⚠️ **A call, not a rule** — the pane has no `+` and no ⋯, and a parameter has no column marker, so without the row click a saved parameter would have no route back at all | 🟡 |
| Referencing a parameter | ❌ Not usable inside a formula or a filter. Creating and listing is the whole feature; a parameter that silently resolved to nothing in an expression would be worse than one that is plainly inert | ❌ |
| **Toast on creation** | "Your filter / formula / parameter has been added to the model". ⚠️ **On creation only** — the copy says *added*, so firing it on an edit would report the wrong event | ✅ |

## 6 · The data view

⚠️ **Reversed 2026-08-19: the preview and the spreadsheet are one surface.** They used to be two,
which meant reconciling which controls existed in which. Now docking shortens the *rows* — the
header, the toolbar and the formula bar are present either way — and full screen takes the canvas
column. The Canvas / Spreadsheet tabs are gone with it, which also answers "should these become
Build / Explore": there is one surface.

The distinction that survives is **what it is for**, not which pane it is: checking a join, and
exploring the data.

| Case | Expected | |
|---|---|---|
| One table | Renders | ✅ |
| Several tables, all joined | Whole model blends them: real key matching, join type honoured, multi-hop, one-to-many fans out | ✅ |
| One or more orphans | **Whole model errors**, naming them, with a route back to the canvas. Single-table scope always works | ✅ |
| **The join preview shows the drag-source table** | Dragging a join scopes the sheet to the table you dragged *from* and holds it there until Apply; then the sheet shimmers and fills in as the joined model. It used to select the join and show whole-model data for a join whose key and cardinality nobody had confirmed | ✅ |
| **Chasm or fan trap** | **No preview for the model** — there is no honest flat preview of a trapped graph. We say it can't be previewed, and why | ❌ no detection exists |
| Can't be previewed, any reason | Say so, and say why | 🟡 |
| Empty canvas | An empty sheet filling the pane, chrome present and inert | ✅ |
| Formatting toolbar, undo/redo | Removed — 10 of 15 have no handler | 🟡 still present |
| **One header, both states** | Object selector · Data / Semantic · Full screen / Dock · Collapse. Every control the same height, all boxed | ✅ |
| **The object selector names what you are viewing** | Tables, joins (under their own names) and **Model**, each with its own icon, so a table and a join are told apart. Replaced two scope controls that could disagree | ✅ |
| **Default scope** | One table → that table. Several not all joined → a table, since Model has nothing honest to show. All joined → Model. Live until the user picks, then theirs | ✅ |
| **Semantic full screen** | Reviewing a whole model's semantics is an expanded job; it had no such state | ✅ |
| **Data / Semantic is always present** | It used to be conditional on the scope having something selected, so clicking empty canvas made it vanish and clicking a card brought it back — which read as a bug, because nothing about *which view am I in* depends on what is selected. The chrome stays and the content says what it has | ✅ |
| **"Expand Spreadsheet" / "Dock Spreadsheet"**, not Full screen / Dock | The old label named the geometry of the window; this names the object and what happens to it. ⚠️ It deliberately does **not** name an activity — the expanded state adds room, not capability, since the docked sheet has the same toolbar and formula bar. ⚠️ Dock, not Collapse: collapse is the chevron beside it, which hides the pane to its header. ⚠️ Capital S is deliberate — Spreadsheet names a surface here | ✅ |
| **Model is disabled until every table is joined** | Greyed in the object selector with *Join every table first*, and if you are sitting in Model when that becomes true the scope drops back to a table. ⚠️ **This supersedes the orphan error screen** (decided 2026-08-12): we prevent the state rather than reporting it, so "The whole model can't be shown yet" is now unreachable in normal use. Code kept | ✅ |
| **Full screen keeps the data browser** | It takes the canvas column only — you still add columns and drop tables while working in the sheet | ✅ |
| Per-join scope | Selecting a join shows the **whole model**: `buildModelMerge` walks the entire graph, so there is no two-table merge to scope to | ❌ |
| ~~Tabs may become Build / Explore~~ | **Moot** — there are no tabs | ⚫ |
| ~~Row limit~~ | Removed. The sheet scrolls | ⚫ |

## 7 · Save, and after

| Feature | Expected | |
|---|---|---|
| **Save keeps you on the canvas** | 🟢 Reversed 2026-08-19. Save commits the model and **stays put**: the action relabels to **Update model**, Query starts working, and a toast says which happened. ⚠️ It used to land on the model's detail page — that trip is gone, and the detail page is reached from Data objects instead | ✅ |
| Save | The object is created. Exit the screen and it's there; without saving it isn't | ✅ |
| **Save asks for a name and a description** | A modal on **first save only**: Name (prefilled from the canvas title) and Description (optional), Cancel / Save model. The name entered becomes the canvas title, so the two can't disagree. Update model commits silently — re-asking on every update would make the common action the interruptible one. ⚠️ **This never existed before**; the publish modal in the other cut is a different thing | ✅ |
| Where the description lives | On the model object (`DataObject.description`), so it isn't collected and dropped | ✅ |
| **Query — test the model before saving it** | Journey step 8. A secondary button with a play icon, immediately **before** Save, opening the Search data editor **expanded**: heading *Query*, Close top-right. Driven by **this model's own** measures, attributes, dates and formulas, and the answer is the model's own rows | ✅ |
| **A model must exist before it can be queried** | Query on an unsaved model opens a dialog explaining why, with **Dismiss** and a primary action that saves *and then opens the query* — they asked for a query, so saving is the step in the way rather than the destination. ⚠️ The button stays live rather than going dim: a greyed control leaves the user holding "why?", and the answer is also the next thing to do | ✅ |
| Query's answer-card Save | ❌ Omitted. In the reference it saves an *answer*, which is not an object this journey has — saving here means saving the model | ❌ by decision |
| Ready to save | **No ready state.** The user knows whether it's ready | ✅ by absence |
| **Enable for Spotter is a separate flow** after Save | Then it's visible to end users, and they can ask questions | ✅ separate |
| Save vs Publish, as words | ❓ **Still unsettled.** The topbar says Save model / Update model; Vivek's step 9 says *Publish*. The Query dialog's copy is keyed off the same flag so the two can never contradict, but the vocabulary itself needs deciding | ❓ |
| Second visit | The model opens in a **view state**; Edit returns to the canvas | 🟡 untested |
| Detail page | Columns tab lists the fields; Caching tab shows the model cache | 🟡 Columns says "No columns yet" |
| Remove a table from a saved model | ❓ | ❓ |

---

## Open questions

**Ours to settle:**

- How a join key present in both tables resolves, and what composite keys are for
- Whether **Save** or **Publish** is the word, and whether "publish" implies a draft state
- Where **editing a formula** lives — the filter has Edit · Delete on its column marker; a formula's
  marker is the column itself, so the column ▾ is the parallel home, unspecced
- Whether the **Fields pane** may be clicked at all: it is a view list with no `+` and no ⋯, and a
  parameter row is currently clickable because a parameter has no other route back
- Whether the tabs become Build / Explore
- How much the system should claim to have checked
- What the old-canvas card opens

**Needs validation, not a decision:** whether we ever refuse a join.

**For the agent team:** what the user reviews when the agent proposes a join. And the integration
itself — ⚠️ **it will be a broken experience in MVP.**

⚠️ **The scenario needs refining with inputs** — the prototype tells one story with multiple tables,
and the numbers are plausible. This is a UX refinement, not a data problem.

---

## Not ours

**Komal:** canvas interaction · property panel · nodes and relationships · the join panel's shape ·
the formula builder. **Her POC V2 work merges into this prototype when she is done.**

**Inherited:** the Spotter agent, driving the canvas through `agentAddTables`, `agentAddJoins` and
`agentAddPythonSource`. **The agent cannot trigger caching and cannot save a model** — those are
human-only.
