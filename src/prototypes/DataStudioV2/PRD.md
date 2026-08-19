# Data Studio — product requirements

_Phases, then every feature as the user meets it, with the expected behaviour and where it stands.
**This doubles as the test plan.** The why, the vocabulary and the principles are in
`FOUNDATION.md` — not repeated here._

**Last updated:** 2026-08-17

**Status key:** ✅ works · 🟡 partial · ❌ not built · ❓ behaviour not decided

---

## The MVP journey

_Stated by Vivek, 2026-08-17. This is what the MVP is. Everything below serves it._

**The situation.** A team uses **one data warehouse**. Their structured tables are already
prepared and clean in it. Their business team uses ThoughtSpot for analytics. A business
analyst wants to let that business team get insights from data that is clean but sitting in a
warehouse.

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

All of it either **manually or with the modelling agent, SpotterModel** — the agent already
sitting in the canvas's left panel.

⚠️ **One warehouse, metadata only.** Two consequences that define the cut: nothing is copied,
so every query is live against the source; and there is nothing to bring over, so **canvas
caching is out of the MVP entirely** (see below).

---

## Phases

The **Demo cut is the north star** — already built at `?v=demo`, so the target isn't
hypothetical. The phases are the path to it.

| Phase | Scope | State |
|---|---|---|
| **MVP** | The journey above. One warehouse, metadata only, live queries. Connect → select → preview → columns → join → semantics → formulas → filters → spreadsheet → enable for Spotter | Current target |
| **Next** | **Multi-source**, and the caching that makes a cross-warehouse join possible at all | Built, then withdrawn from the MVP — see below |
| **Then** | **Python and SQL** — code, cleaning, and data from anywhere: CSV, Google Sheets, any app. Unlocks "start from any messy data and model it" | |
| **Then** | **AI readiness** — the model as something an agent consumes, and how a human understands that | |
| **Then** | **Continuous improvement and monitoring** — a model decays, so this is how it's maintained | |
| **North star** | The full agentic experience: a model created from conversation, readiness checks, the Spotter hand-off | **Built** |

### ⚠️ Caching left the canvas (2026-08-17)

Canvas caching existed for exactly one reason: **two tables in two warehouses cannot be
joined**, so both had to be brought into ThoughtSpot's store. The MVP is a single warehouse, so
there is nothing to bring over and the gate can never fire.

**What was removed:** the cache pill and its dropdown, the cache-required notice, the caching
settings dialog, and the gate that held a join. Behind `canvasCaching: false` in POC V2 —
Vision, POC and Demo keep theirs.

**What stayed, deliberately:** the **model cache** — the performance one on a saved model's
Caching tab. A different cache, after the model is ready, and always a separate surface.

⚠️ **Do not express this by turning `tableCaching` off.** That switches the `!tableCaching`
branches back on, which is Vision's older model-level caching UI — more caching, not less.

---

# The MVP, feature by feature

## 1 · Open a canvas

**The entry flow**, six steps (2026-08-17). The old/new canvas choice moved out of the nav
submenu: there the user hasn't yet said what kind of model they want, so "old" and "new" mean
nothing to choose between.

1. `+` icon
2. **Model** → Suraj's model-type modal, unchanged
3. **Build a new model** → ⚠️ only this option continues; every other path closes as before
4. **New canvas** → the old-vs-new choice, a card each with a visual and its features
5. **Choose a connection** → Select connection, master/detail with search
6. Land on the canvas

| Feature | Expected | |
|---|---|---|
| `+ → Model` | Opens the model-type modal directly. No submenu | ✅ |
| Build a new model | Branches to the old-vs-new modal | ✅ |
| Other model types | Unchanged, no old/new prompt | ✅ |
| Old vs new cards | Title, screenshot, two or three features each | ✅ placeholder screenshot and copy |
| Select connection | Search the list, detail on the right, Back / Next | ✅ |
| Old canvas | ❓ **Has no destination.** It used to *be* the model-type modal, and with that moved to the front there is nothing for it to open. Closes, as the honest placeholder | ❓ |
| Empty canvas | Left dock with **Data browser** / **Metrics** tabs. Topbar: model name · view switcher · Save model | ✅ |
| No cache pill | Removed with canvas caching | ✅ |
| No readiness pill | AI readiness is a later phase | ✅ |
| **No draft state** | Nothing is created until Save. Leave without saving and there is no model | ✅ |

## 2 · Add tables

| Feature | Expected | |
|---|---|---|
| Browse | A **flat list of the chosen connection's tables** — no connection, database or schema levels, and no connection filter. We don't let users sync a schema, a database or several warehouses, so three of the tree's four levels described nothing | ✅ |
| The connection cannot be changed | Chosen at step 5 and fixed. ⚠️ So every table shares a warehouse, which is why caching has nothing to do | ✅ |
| Search | Narrows table names. It used to cover table, schema, database and connection; three of those no longer exist | ✅ |
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
Right Outer), three cardinalities (Many:1 · 1:Many · 1:1), composite keys via `+ Add column`.
Most people use inner, but we are selling to enterprise, so all four stay.

| Feature | Expected | |
|---|---|---|
| Open the panel | Table 1 fixed, Table 2 pre-filled from the second selected card | ✅ |
| Cardinality | **We auto-propose it.** Users have questions about their own cardinality, so the system offers one and they confirm or change it | ❌ hardcoded `many_to_one` |
| **Preview catches the mistake** | Wrong cardinality shows as repetition in the preview, and the user fixes it. This is the correctness mechanism — not validation, not blocking | ✅ preview exists |
| Never silently change their config | An agent may change something visibly; we never do it quietly | ✅ |
| Join type behaviour | Each type produces the rows it promises | ❌ three of four are identical — right and full outer behave as left outer |
| Key present in both tables | ❓ **The open one.** How is it resolved, and what is a composite key for? | ❓ |
| Composite keys in MVP | ❓ Tied to the above | ❓ |
| Delete a table | Its joins are deleted with it | 🔍 |
| Refuse a join | ❓ Needs validating rather than deciding | ❓ |
| Agent proposes a join | ❓ What the user is reviewing is a question for the agent team | ❓ |

## 5 · ~~Caching~~ — withdrawn from the MVP

One warehouse, metadata only, nothing copied. **Every query is live against the source.** See
"Caching left the canvas" above for what was removed and what stayed.

## 6 · Metrics, formulas and filters

**A formula is a custom column. A metric is custom columns plus columns from source.** So the pane
lists everything in the model: **Table 1 columns · Table 2 columns · formulas · filters ·
parameters**, grouped in that order.

| Feature | Expected | |
|---|---|---|
| The pane | One place holding everything about the data in this model | ✅ list exists, ❌ not grouped |
| Its name | ❓ Currently Metrics. May need a different name, since it holds more than metrics | ❓ |
| Create a formula | From the pane, with no canvas selection needed | ✅ |
| Values compute | ✅ |
| Writing a formula | They write it, see the column and its values, see it doesn't match what they wanted, and modify it. Again preview, not validation | ✅ |
| Delete a formula | **Yes, deletable.** Anything depending on it **breaks**, and a broken formula needs its own UI state | ❌ |
| **What a filter is** | A **Model filter** in ThoughtSpot's terms — *"applied every time that Model is used"*, before the query runs, so results are filtered **even when the search never mentions the filtered column**. Two purposes: limiting a model to the data it is for, and data security, letting different groups see different data without row-level security. ⚠️ Not a Liveboard filter — those are created on the liveboard and are a separate thing | 🟡 built as a build-time predicate; the framing and copy need to say "every question anyone asks of this model" |
| Authoring | 🟢 **Same as creating a filter on the spreadsheet** (Vivek, 2026-08-17). So the spreadsheet's column filter and this are one object. Wiring not done — resolve later | ❌ |
| Progressive filters | ThoughtSpot supports marking a model filter *progressive*, applying only when its table is referenced in a search. Not accounted for | ❌ |
| Filters live in one place | Not on a card, not on a join edge, not in two places | ❌ card-level Filter still in the node menu |
| Remove a column | Multi-select → Remove. Hidden and returnable, not destroyed | 🟡 control sits in a tab MVP doesn't have |
| Parameters | Listed in the pane. Not otherwise in MVP | ❌ |

## 7 · Spreadsheet

The spreadsheet exists **for exploration, not checking** — checking is what the canvas preview is
for. **The bottom preview is not actionable; the spreadsheet is.** We have a spreadsheet as a
platform, so it comes here.

| Case | Expected | |
|---|---|---|
| One table | Renders | ✅ |
| Several tables, all joined | Whole model blends them: real key matching, join type honoured, multi-hop, one-to-many fans out | ✅ |
| One or more orphans | **Whole model errors**, naming them, with a route back to the canvas. Single-table scope always works | ✅ |
| **Chasm or fan trap** | **No preview for the model** — there is no honest flat preview of a trapped graph. We say it can't be previewed, and why | ❌ no detection exists |
| Can't be previewed, any reason | Say so, and say why | 🟡 |
| Empty canvas | An empty sheet filling the pane, chrome present and inert | ✅ |
| Formatting toolbar, undo/redo | Removed — 10 of 15 have no handler | 🟡 still present |
| **Tabs may become Build / Explore** | ❓ Rather than Canvas / Spreadsheet. Undecided | ❓ |

## 8 · Save, and after

| Feature | Expected | |
|---|---|---|
| Save | The object is created. Exit the screen and it's there; without saving it isn't | ✅ |
| **Save asks for a name and a description** | ❌ lands as "Untitled model" | |
| Ready to save | **No ready state.** The user knows whether it's ready | ✅ by absence |
| **Enable for Spotter is a separate flow** after Save | Then it's visible to end users, and they can ask questions | ✅ separate |
| Second visit | The model opens in a **view state**; Edit returns to the canvas | 🟡 untested |
| Detail page | Columns tab lists the fields; Caching tab shows the windows | 🟡 Columns says "No columns yet" |
| Remove a table from a saved model | ❓ Especially if it carried the window | ❓ |

---

# Next phase — multi-source (built, out of the MVP)

_Kept because it is built and reviewed, not because it ships in the MVP._ Caching stops being an
optimisation and becomes the only way the join can exist: **Databricks talking to Snowflake is very
difficult**, so rather than waiting for a data engineer to consolidate warehouses, the analyst brings
both tables into Agent DB. **All of it is behind `canvasCaching`, off in POC V2.**

| Feature | Expected | |
|---|---|---|
| Drop tables from any warehouse | Lands freely. **Dropping is never a caching touchpoint** | ✅ |
| Trigger | Attempting a join whose tables aren't all in one place | ✅ |
| ⚠️ A cached table's source **is** ThoughtSpot | So cached + Snowflake is two sources and needs caching; two uncached Snowflake tables are one and don't | ✅ |
| Same warehouse both sides | Nothing — the join pushes down | ✅ |
| Two warehouses | Info notice, never an error. Names both tables and both warehouses. Dismiss / Proceed | ✅ |
| One cached, one live | Only the live one is listed | ✅ |
| Dismiss | Leaves a dashed pending edge carrying the cache action — "not now", not "undo" | ❌ discards the join |
| **Outside the window, multi-source** | An **error** — we can't answer, we don't have that data. There is no live fallback, because live is what can't cross warehouses | ✅ |
| Completion resumes the join | The held join commits itself and its panel opens | ✅ |
| Progress and status | On the topbar pill and header chip, never on the cards | ✅ |
| Pill is a rollup | "3 of 5 cached · 24h", opening to a per-table list | ❌ still a binary |
| Pending join is marked | The panel says it's waiting | ❌ shows a live Apply |
| **What's blocked during a fill** | ❓ **Do not resolve unilaterally.** Vivek's instinct: preview and spreadsheet go unavailable and return when loading finishes, while the agent, formulas and presentation work continue. Built behaviour bars **join** and keeps preview progressive. Needs technical clarity → proposal → feasibility check | ❓ |

---

# Later phases — scope only, not specced

**Python, SQL and any data.** Code blocks for SQL and Python, as sources and as transforms. Clean
messy data. CSV upload, Google Sheets, any app. The core claim this unlocks: **you can start from any
messy data and model it.**

**AI readiness.** The model as an environment an agent acts in — how an agent uses it, how it
answers on top of it, and how a human understands both. The biggest unknown and the biggest lever;
arrives as an integration with the SpotterModel team and is a tricky area.

**Continuous improvement and monitoring.** A model decays: it needs more columns for new
questions and better context for accurate answers. This phase is how that happens.

---

## Open questions

**Ours to settle:**

- How a join key present in both tables resolves, and what composite keys are for
- What the Metrics pane is called
- Whether the tabs become Build / Explore
- Whether a user can cache before joining
- Whether caching reads as a decision or a setting
- How much the system should claim to have checked

**Needs validation, not a decision:** whether we ever refuse a join.

**For the agent team:** what the user reviews when the agent proposes a join. And the integration
itself — ⚠️ **it will be a broken experience in MVP.**

**Deliberately parked:** what in the demo we'll never build, and whether anything in the demo is
already wrong.

⚠️ **The scenario needs refining with inputs** — the prototype tells one story with multiple tables,
and the numbers are plausible. This is a UX refinement, not a data problem.

---

## Not ours

**Komal:** canvas interaction · property panel · nodes and relationships · the join panel's shape ·
the formula builder.

**Inherited:** the Spotter agent, driving the canvas through `agentAddTables`, `agentAddJoins` and
`agentAddPythonSource`. **The agent cannot trigger caching and cannot save a model** — those are
human-only.
