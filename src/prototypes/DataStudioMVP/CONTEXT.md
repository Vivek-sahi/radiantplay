# Data Studio - MVP — current state

_What exists right now. Requirements are in `PRD.md`; what's in flight and why is in `DESIGN.md`;
history is in `SESSION_LOG.md`. **State only** — no changelog._

**Last updated:** 2026-08-19 (session 161)

---

## What this prototype is

**One experience, built around the MVP journey at the top of `PRD.md`.** Extracted from
`DataStudioV2` on 2026-08-17, which held four cuts — Vision, POC, POC V2 and Demo — selected at
runtime by a header toggle. This prototype is POC V2, standing on its own.

There is **no variant system**: no `?v=` parameter, no toggle in the header, no `Scope` object, no
`isPocCut`. One set of screens, one behaviour.

`DataStudioV2` is untouched and still runs at its own registry entry with all four cuts. It is where
to read for anything out of scope here — canvas caching, multi-source, Python/SQL, the Demo
run-of-show.

---

## The screens

```
GlobalHeader — persona, search, and the UX concepts menu
└── Data Workspace shell — sidebar + Data objects list
    └── Model canvas (full screen)
        ├── Topbar       model name · Query · Save / Update model   ← no view switcher
        ├── Left dock    [ Data browser | Fields ]    ← SegmentedControl, one rail not two
        │                 └── table detail — a full-height panel, not a flyout
        ├── Canvas       dot grid; BlockNode cards; grey orthogonal join lines; Tidy up
        ├── Properties   ⚠️ **renders nothing** — every surface it held is a modal now
        └── Data view    bottom — one sheet, docked or full screen
```

⚠️ **There is no view switcher and no Spreadsheet tab.** The data view is docked under the
canvas and opens full screen from its own header. That also settles the parked
"Canvas / Spreadsheet → Build / Explore" question: there is one surface, so nothing to
switch between.

The canvas is a feature of ThoughtSpot's **Data Workspace**, not a destination: there is no Data
Studio home screen and no Data Studio nav.

**Saving keeps you on the canvas.** **Save model** opens a modal asking for a **name and a
description** (first save only), commits, and stays put: the action relabels to **Update model**,
**Query** starts working, and a toast confirms which happened. ⚠️ It used to land on the model's
detail page — that trip is gone; the detail page is reached from Data objects, and **Edit model**
there still returns to the canvas.

**Entry is six steps:** `+` → **Model** → Suraj's model-type modal → **Build a new model** →
**Select connection** → old-vs-new canvas cards → the canvas. Only "Build a new model" continues;
every other option in that modal closes as it always did. Each step after the first carries **Back**,
so the flow is reversible the whole way. ⚠️ **Old canvas has no destination** — it used to *be* the
model-type modal, so with that at the front there is nothing for it to open.

**One connection per model, chosen before the canvas and unchangeable.** So the data browser is a
**flat list of that connection's tables** — no connection, database or schema levels, no filter;
search narrows table names.

⚠️ **`dataset2` mode renders `BlockNode`, not `CanvasNodeCard`.** Two bugs in the source prototype
came from wiring the other one.

**Not here:** canvas caching · Columns tab · Test tab · Spotter readiness pill · CSV / SQL / Python ·
Clean · draft and publish · Settings · a row limit on the data view · the Vision workspace, notebook,
dbt import and Pulse monitoring · the Demo run-of-show.

---

## The data view — one surface, two heights

**Docked and full screen render the same sheet.** Docking shortens the *rows*; the header, the
spreadsheet toolbar and the formula bar are present either way. There is no list of "what the
spreadsheet has that the preview doesn't", because they are the same component.

Its header, identical in both states:

```
[ ⌗ accounts  ▾ ]  [ Data | Semantic ]   [ ⛶ Expand Spreadsheet ]  [ ⌄ ]
```

- **Object selector** — a custom menu, not a `<select>`, because each entry carries an icon: a
  table glyph for tables, the join's own type glyph for joins, a stacked-tables glyph for
  **Model**. Grouped Tables / Joins / Everything. It replaced *two* controls that could
  disagree — the preview's Node/Model level and the sheet's own Whole model / per-table scope.
- **Default scope, live until overridden** — one table → that table; several tables not all
  joined → a table, since Model has nothing honest to show; all joined → Model. A `scopeTouched`
  ref stops the rule the moment the user picks for themselves.
- Every control shares `HEADER_CTRL_H` and a box, so none of them drift apart.
- **Data / Semantic is always present** — it used to be conditional on the scope having a
  selection, so clicking empty canvas made it disappear. Nothing about *which view am I in*
  depends on what is selected.
- **Three states, three words that can't be confused:** collapsed (header only) · docked (shares
  height with the canvas) · **expanded** (takes the canvas column — ⚠️ *not* the data browser,
  which stays reachable so columns and tables can still be changed while working in the sheet).
- ⚠️ **"Expand Spreadsheet" / "Dock Spreadsheet"**, not Full screen / Dock. The label names the
  object, not the window's geometry — and deliberately not an *activity*, because the expanded
  state adds room, not capability. Dock rather than Collapse, since collapse is the chevron
  beside it. **Capital S is deliberate:** Spreadsheet names a surface here.
- **Semantic has an expanded state**, which it never had before.
- ⚠️ **Model is disabled in the selector until every table is joined**, and choosing it is
  impossible rather than possible-then-refused. Which makes the sheet's "whole model can't be
  shown" error screen unreachable in normal use — code kept, superseded.

---

## Where things live

| Piece | File |
|---|---|
| Entry, routing, the six-step flow | `index.tsx` |
| The canvas — everything | `components/ModelCanvas.tsx` (~9,900 lines) |
| The canvas's settings, as constants | `SCOPE` at the top of `ModelCanvas.tsx` |
| Agent chat | `components/AgentPanel.tsx`, `components/PromptBar.tsx` |
| Data Workspace shell + nav | `components/Shell.tsx` (`dataWorkspace` prop) |
| Data objects landing | `components/DataObjectsPage.tsx` |
| Model detail page (view state) | `components/ModelDetailPage.tsx` |
| Table → warehouse authority | `data/tableConnections.ts` |
| Model cache state | `components/cache/ModelCacheContext.tsx` (keyed by model **name** — the canvas has no id) |
| Join-aware merge | `buildModelMerge` in `ModelCanvas.tsx` |
| Spreadsheet | `components/Spreadsheet.tsx`, `DataSheetToolbar`, `FilterMarkerMenu` |
| Filter modal, its four variants, `OPERATOR_LABEL` | `components/FilterModal.tsx` |
| Insert formula modal + the function reference | `components/InsertFormulaModal.tsx` |
| Create parameter modal | `components/ParameterModal.tsx` |
| Join configuration (create and edit, one form) | `components/JoinModal.tsx` |
| Query — the Search data editor, expanded | `components/EditAnswerModal.tsx` (`fullScreen`) |
| Dock-seam row heights | `DOCK_HEADER_H` · `DOCK_BAND_H` · `FORMULA_BAR_H` in `components/Spreadsheet.tsx` |
| Formula evaluation, functions and aggregates | `evaluateFormula` · `FN_ROW` · `FN_AGG` in `ModelCanvas.tsx` |
| Agentic vocabulary | `components/agentic/` |
| Persona | `persona.ts` — one source behind every header and avatar |
| UX concepts menu — ⚠️ **hidden** (`MENU_VISIBLE = false`), nothing deleted | `components/PrototypeConfig.tsx` |
| Table detail panel · entry modals | `components/SelectConnectionModal.tsx` · `components/CanvasChoiceModal.tsx` |

**Imported from elsewhere, not copied:** Near Store's `CachingSettingsModal` (the model cache on the
detail page) and `_shared/caching/windows.ts`. Single vs multi-source is a property of the model, not
a variant of the prototype — a fork would duplicate ~90% of that for one boolean.

---

## Built and working

Everything below came across from POC V2 behaving exactly as it did there.

**Canvas.** Table cards carrying a table icon, the name, and **`n of m` columns** — `step.cols`
is the single answer to what is in the model, so the card states it. A **⋯ on hover or selection**
holds one item, Remove from model; the old menu (Join · Filter · Formula · Delete) is gone, which
also closed the open ❌ on card-level filters.

**Joins are drawn, not written.** Hovering a card shows **one connect handle on the edge nearest
the pointer**; dragging from it to another card creates the join and opens its configuration
pre-filled with a key inferred from the two tables' column names. Structure is **grey**, the same
as an unselected card border — selection darkens and thickens rather than changing hue.
**Cardinality is crow's feet** on the connector ends, not the words "Many:1": a fork means *many*
on that side, a cross-stroke means *one*. ⚠️ Which end is table 1 comes from `t1AtFrom` in
`joinGeometry` — the path is laid out left-to-right by *position*, so without it a `many_to_one`
would draw its fork on whichever table happened to sit left.

**The join is configured in a modal** (`JoinModal.tsx`) — one form for create and edit, replacing
three copies of it in the property panel. Both tables are fixed, because the drag answered them; it
asks for the keys, the join type, the cardinality and the name. ⚠️ **Cancel on a newly drawn join
removes it** — nothing is joined until Apply. ⚠️ **No `+ Add column`**: `CanvasJoin` holds one key
pair and the old form discarded extra pairs at Apply, and a control that throws away what you type is
worse than an absent one.

**While a join is being configured the sheet shows the table you dragged *from***, and on Apply it
shimmers and fills in as the joined model. It used to show whole-model data immediately, for a join
whose key and cardinality nobody had confirmed.

The join badge is a grey pill with a black join-type glyph, **anchored to its line** (it was
draggable, which detached it from its own connector). Clicking it selects the join — re-scoping the
data view — and its ⋯ opens Edit / Delete. ⚠️ **Both of those did nothing until 2026-08-19**: the
menu is portaled, but React bubbles a portal's events through the *component* tree, so a pointerup on
a menu item reached the badge's own handler and closed the menu before the click could land. The join's **name** sits at the bottom of its config form,
defaulting to `table1 × table2`, and shows in the data view's header; deliberately **not** on the
canvas edge, which stays a picture of the relationship.

**Selection is single.** Shift no longer extends: two cards come together by being *connected*.
The multi-join machinery is still in the file and the agent bridge can drive it; it has no route
from the canvas.

**The property panel opens to configure, never to view.** Selecting a table or a join shows the
data view only. It opens for a join being created or one you asked to edit, and closes on apply or
cancel. Deleting a table now takes its joins with it — ⚠️ a join names one end by **id** and the
other by **table name**, so both have to be matched.

**Data browser.** A flat list of the one chosen connection's tables, search over table names
("Search tables"), collapse control on the **right** edge — the edge the panel closes towards.
Table names are `content-primary`: the name is what you scan, and grey read as inactive.

**Table detail is a panel, not a flyout** — full dock height, 360px, flush against the browser's
right edge, still closing on an outside click, Esc, its X or a re-click. It carries the table name,
then labelled **Source table · Database · Schema** (from `TABLE_LOCATION`, the single authority),
then a **column search** above the list. Both modes intact: add a new table, or reopen one on the
canvas and its in-model columns show ticked and locked with the button reading Save changes.

**Fields pane** (renamed from Metrics, 2026-08-19 — the industry's word; see `DESIGN.md`). Shares the
left dock with Data browser. **Sectioned** — one section per table, then Formulas, Filters, Parameters
— each collapsible, open by default.

⚠️ **It is a view list. No `+`, no row ⋯.** Everything in it is edited where it was made. Two
exceptions, both because nothing else offers a route: a **column** keeps its hover delete (membership
of the model is not a spreadsheet object), and a **parameter row is clickable** (a parameter has no
column marker to hang a menu off).

**Filters live only in the spreadsheet, as a modal.** `components/FilterModal.tsx` replicates
ThoughtSpot's shipping `Select value for : <column>` dialog. Opened from the toolbar's filter icon
or a column ▾ → Filter; **four variants** by column type — date (Rolling / Fixed → window), number
(condition + value, `between` included), string (search + value checklist), boolean (checklist) —
each ending in the **Preview** chip that states the resolved filter in words. Apply **filters the
sheet**, and the CSV export follows. A filtered column carries a **funnel in its header**: outlined
while scratch, filled once saved; clicking it gives **Edit filter · Delete filter · Save filter**.

⚠️ **Save marks the filter and files it nowhere** — where saved filters live is the open decision.

**Clicking a column header selects the column** — header and cells tint, an underline marks it,
re-clicking clears it — and that is what arms the toolbar's filter, which then does exactly what the
column ▾ → Filter does. Two routes, one behaviour. ⚠️ **Cell and column are one selection:** the
formula bar tracks a selected *cell*, the toolbar acts on a selected *column*, and picking either
clears the other, so there is a single answer to what the next action applies to.

⚠️ **`OPERATOR_LABEL` now lives in `FilterModal.tsx`** and is imported by the canvas — one home for
the words a condition is described with.

**Formulas live only in the spreadsheet, as a modal.** `components/InsertFormulaModal.tsx` replicates
ThoughtSpot's **Insert formula** — category dropdown, search, function list, and signature /
description / worked examples on the right. Opened from the toolbar's `fx` or a column ▾ → New
calculated field; **no table picker**, because a formula belongs to the model. Insert writes
`=fn ( arg )` into the formula bar **with the argument selected**, the user finishes it, and Enter
appends a column at the far right — loading first, then values, with the sheet scrolling to it. The
column lands as **`Untitled n`** and is renamed from the column ▾, which is the inherited
spreadsheet's own behaviour.

⚠️ **Values are derived, not stored** — computed against whatever rows are in view, because a formula
belongs to the *model* while the sheet can be scoped to one table, and stored values would eventually
be painted against rows they were never computed from.

⚠️ **What the prototype can't compute, it refuses by name.** `GROUP_SUM`, `RANK`, `CUMULATIVE_SUM`
and `EDIT_DISTANCE` are in the reference list and not implemented; so an unresolved term is refused
too, which is what stops Enter on an uncompleted `=abs ( number )` landing a column of zeros.

⚠️ **A formula has no edit or delete route.** Its marker is the column itself, so there is no menu —
`DESIGN.md` item 4c.

**Model-level formulas keep the old shape where they remain.** They open with **no card selected and
no chip on any card** — a chip is a step in one table's pipeline, which a model-level metric isn't.
⚠️ **You cannot write a formula across tables that aren't joined**, enforced by only offering the
joined model's columns and naming the unreachable tables. **Collapsed to one route, 2026-08-19.** It had five entry points producing three objects; the
spreadsheet is now the only one.

**The table flyout edits columns both ways.** Reopen a table that is on the canvas and its columns
show ticked; select and deselect freely, then **Save changes**. `step.cols` is the single answer to
"which columns are in the model".

**Spreadsheet.** Join-aware — walks the join graph with real key matching, honours join type,
multi-hop, one-to-many fans out. Scope on the toolbar's right edge; no footer, no pagination, no
row-count readout. Errors rather than showing a partial model when a table is orphaned. Loads cell by
cell on a diagonal with real headers mounted.

**Parameters.** `components/ParameterModal.tsx`, opened from the spreadsheet toolbar directly after
the formula icon: **Create parameter** — name, optional description, type (Integer · Decimal · String
· Boolean · Date), Allowed values (Any · List · Range), Default value. List gives a value-per-row
editor; Range gives Minimum / Maximum and is **disabled for String and Boolean**, which have no
ordering; the Default control follows the type. Saved parameters list in the Fields pane. ⚠️ **Not
referenceable from a formula or a filter** — creating and listing is the whole feature.

**Query.** A secondary topbar button with a play icon, immediately before Save, opening
`EditAnswerModal` in its **expanded** mode: heading *Query*, Close top-right, no footer, and a flatter
treatment than the centred modal (the grey ground stays, the card shadows and the search bar's
elevation go). ⚠️ **Driven by this model's own** measures, attributes, dates and formulas, with the
model's own rows as the answer. ⚠️ **A model must exist first:** Query on an unsaved model opens a
dialog whose primary action saves *and then* opens the query. The answer card's Save is omitted — in
the reference it saves an *answer*, which this journey has no object for.

**Toasts on creation** — "Your filter / formula / parameter has been added to the model", and "Your
model has been saved / updated". ⚠️ **Creation only**, never on an edit: the copy says *added*.

**Two data-surface concepts exist, both built**, behind `ConfigValues.spreadsheet`: the merged surface
(default) and the earlier **data preview + Spreadsheet tabs** shape, where the docked pane has no
actions and each column carries a sort control. ⚠️ **The menu that switches them is hidden.** The
question they exist to answer is where formulas get made.

**The model cache**, on a saved model's Caching tab — Near Store's `CachingTab` /
`CachingSettingsModal` / `RunHistoryModal`, imported. This is the performance cache after the model
is ready, not the canvas gate.

---

## Design system

Topbar, data browser, metrics, preview, columns and modals are on Radiant tokens and components —
`Modal`, `SegmentedControl`, `SearchBar`, `Checkbox`. Type on a **12px floor** (Radiant's scale
starts at `xs: 12`, weights stop at `semibold`), spacing on the 4px scale.

⚠️ **Still off it: the canvas, the spreadsheet and the property panel.** Their type sits a step
smaller than everything beside them, and the seam is visible. The property panel is Komal's.

⚠️ **Row heights are load-bearing across the dock seam** — the two dock search rows and both
formula bars read `SEARCH_ROW_BAND_H`, now **52px** (28px field, 12px either side; it was 40, which
gave 6). Change one side and you change the other — which is why it is a constant.

⚠️ **`View` is not a generic div, and `v2TextStyles` is not safe to spread.** Both cost a full
layout break on 2026-08-19. See the traps table in `DESIGN.md` and the warnings in
`design-system.md`; use `text()` from `../styles` for any text style.

---

## Naming

The central object is a **model**. `ProjectState` is the legacy internal type — **do not rename**, it
is load-bearing across the canvas and the agent panel.
