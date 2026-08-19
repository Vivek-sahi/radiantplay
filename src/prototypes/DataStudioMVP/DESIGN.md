# Data Studio - MVP — design status

_What's in flight, who owns what, and the design decisions behind the build. Product requirements
live in `PRD.md`; this is the working state around them._

**Last updated:** 2026-08-19 (session 161)

---

## Ownership

**Komal:** canvas representation and actions — data preview, canvas interaction, property panel,
nodes, relationships. **Formula authoring counted as hers**, because the builder lived in the property
panel. ⚠️ **Ownership shifted on 2026-08-19** — Vivek is building the end-to-end flow, so the
property panel, the canvas cards and the join surfaces are ours to change. Her POC V2 work still
targets `DataStudioV2`'s files and will need reconciling.

**Ours:** entry point, data browser, column selection, spreadsheet, save, the **Fields** pane and its
list, and the formula, filter, parameter and join modals. ⚠️ **The property panel is no longer
anyone's** — every surface it held is now a modal, so it renders nothing.

**Inherited:** the Spotter agent on canvas, from the SpotterModel team. It drives the canvas through
three calls — `agentAddTables`, `agentAddJoins`, `agentAddPythonSource`. That is the entire API
surface between a conversation and the canvas, and the feasibility question in one line.

---

## The extraction — what was done, and what it left

Lifted out of `DataStudioV2` on 2026-08-17. That prototype held four cuts in one codebase, selected
at runtime; this one is POC V2 standing alone.

**What came across:** 72 files, ~36,000 lines — the entry flow, the canvas, the data browser, the
Fields pane, the spreadsheet, the agent panel, save, and the model detail page.

**What stayed behind:** 36 files — the Vision workspace, chat and notebook views, dbt import, Pulse
monitoring, the connections and models pages, SpotterX, the discoverability explorations and the
Playground.

**The variant system is gone.** No `variant.tsx`, no `?v=`, no header toggle, no `Scope` object, no
`isPocCut`. In its place, `ModelCanvas.tsx` opens with a `SCOPE` constant holding POC V2's settings
with a comment on each.

⚠️ **The branches those constants guard are still there.** `scope.canvasCaching` is `false`, so the
cache gate can never fire, but the code that would run it is still in the file. This was deliberate:
the canvas behaves exactly as it did, and an incoming merge still applies. **Folding the constants
through and deleting the dead branches is the first item in the queue below.**

**Type errors:** 128, every one of them carried over from `DataStudioV2` line for line. The
extraction added none. `npm run build` passes because Vite doesn't typecheck — **do not add to the
count.**

---

## Build queue

_Items 1, 2, 3 and 3b closed on 2026-08-19, along with the join modal, parameters and Query. What is
left below is either ours to build or a decision to take._

| # | Item | Status | Note |
|---|---|---|---|
| 1 | **Insert formula — as a modal** | ✅ **Done 2026-08-19** | Not a side panel. Reference: ThoughtSpot's own "Insert formula". Left rail = category dropdown (*All functions*) + search + scrolling function list; right pane = signature (`ABS ( NUMBER )`), one-line description, worked **Examples** (`abs ( -10 ) = 10`, `abs ( profit )`). Footer Cancel / **Insert formula**. On insert the **formula bar activates** with the chosen function; the user completes it there. Built as `components/InsertFormulaModal.tsx`, carrying a real function reference across ThoughtSpot's categories — see item 3b for what it replaced |
| 2 | **Filter — as a modal, per column** | ✅ **Done 2026-08-19** | `components/FilterModal.tsx`. Replicates the shipping `Select value for :` dialog. All four variants built — date (Rolling / Fixed), number (condition + value, incl. between), string (search + value checklist), boolean (checklist) — each keeping the **Preview** chip. ⚠️ Only the *date* variant had a reference; the other three are our reading and need Vivek's eyes. Applying **actually filters the sheet**, and the CSV export follows |
| 3 | **The flow around both** | ✅ **Done 2026-08-19** | *action → modal → apply → marker on the column → click the marker for edit / delete / save*. Built for filter: filled funnel in the column header, opening `FilterMarkerMenu` (Edit · Delete). **Column selection built 2026-08-19** — the sheet had none, only a selected *cell* for the formula bar; a header click now selects the column (header and cells tint, underline marks it, re-click clears) and that is what arms the toolbar's filter, which then does exactly what that column's ▾ → Filter does. ⚠️ Cell and column are **one** selection — picking either clears the other, so "what does the next action act on" has one answer. ⚠️ Formula's half is different in kind: its marker *is* the new column, so it has no menu — which is why "where does editing a formula live" is now its own open item (4c) |
| 3b | **Insert formula — the same treatment** | ✅ **Done 2026-08-19** | Formula now has five entry points producing three objects: the sheet's formula bar (computes values, no listing), the Fields pane's `+` (lists, computes nothing, never reaches the sheet), the toolbar `fx` and the column ▾ (both file a *card-level* step through the "which table?" picker), and a dead Columns-tab modal. The boundary says one: **the spreadsheet.** Collapsed to the formula bar plus `InsertFormulaModal` in front of it. The side panel, the Fields pane's `+`, the card-level step path and the table picker are gone, with `modelAction`, `modelFilters` and `dataActionPicker`. ⚠️ **The docked property panel is now entirely unreachable** — filters, formulas and joins are all modals and the join was its last live use, so `propertiesPanel` renders `null` in every state. ~1,200 lines to delete as its own change |
| 4 | ~~Where a saved formula or filter goes~~ | ⚫ **Moot 2026-08-19** | This is the promotion step, not a new problem. Vivek's model: what you make in the sheet is **scratch by default**, and saving promotes it into the model view — which is *why* that view earns its place, since it is the one argument for it that survived the view/configure split. ⚠️ Promotion changes what the thing *means*: a column filter says "I am looking at a subset", a Model filter says "every question anyone ever asks of this model is filtered", and it is one of the two data-security mechanisms. The copy at the save step has to carry that. `PRD.md` §5 already flags the wording as unfinished. **Then the premise went** (Vivek, 2026-08-19): "by default, whatever you do in a data model does get saved." So there is no scratch object and no promotion step to design. Save filter came out of the marker menu, `SheetFilter.saved` came off the object, the funnel has one state, and the Fields pane lists everything. Formulas and parameters already worked this way, so all three are consistent |
| 4b | **Delete the dead property panel** | 🔴 Ours | ~1,200 lines that render `null` in every state. It was reachable only for a join, and the join is a modal now. Do it as its own change, not folded into a feature |
| 4c | **Editing a formula has no home** | ❓ Decision | A filter has Edit · Delete on its column marker; a formula's marker *is* the column, so the column ▾ is the parallel place — unspecced. Right now a formula can be created and never changed or removed |
| 4d | **Parameters can't be referenced** | 🔴 Ours | Create and list works. A parameter is not usable inside a formula or a filter, deliberately — one that silently resolved to nothing would be worse than one plainly inert |
| 5 | **Per-join scope in the sheet** | 🔴 Ours | Selecting a join shows the **whole model**. `buildModelMerge` walks the entire join graph, so there is no "just these two tables" merge to scope to. With two tables it is the same thing; with four it shows more than was asked for |
| 6 | ~~Dead data branches in the old preview pane~~ | ⚫ **Don't delete** | They looked unreachable once the sheet served data in both states. ⚠️ **The data-preview concept needs that path**, so this is no longer cleanup — it is one of the two options under review. Revisit only when that decision lands |
| 7 | **Fold `SCOPE` through and delete the dead branches** | 🔴 Ours | Canvas caching, the connection filter, the category tabs, the Columns tab, the tree browser — all unreachable, all still in the file |
| 8 | **One dataset** | 🔴 Ours | Three unrelated scenarios still coexist. The four renewal-risk tables were widened on 2026-08-19 (`accounts` 6 → 20 columns, with matching rows); the marketing tables — `orders`, `campaigns`, `customers` — are untouched at 4–6 columns and are still what the canvas auto-populates |
| 9 | **Three of four join types produce identical output** | 🔴 Ours | The merge only branches on inner vs. not-inner, so right and full outer behave as left outer. Tier 1: we are designing this panel and can't review a choice the output can't distinguish |
| 10 | **Auto-propose cardinality** | 🔴 Ours | From key uniqueness, shown as detected, editable. Hardcoded `many_to_one`. ⚠️ Now more visible, not less: cardinality is drawn as **crow's feet** on the connector, so a hardcoded value is a picture that asserts something it never checked |
| 11 | **Apply the FK dedup rule** | 🔴 Ours | Decided (fact-side FK excluded, survives once from the dimension) and unimplemented. `account_id` appears twice in the merged output |
| 12 | **Model formula column into the whole-model spreadsheet** | 🔴 Ours | Authoring, listing, editing and removal work; the computed column isn't in the merge |
| 13 | **Naming a model on save** | 🔴 Ours | Should ask for a name and a description; lands as "Untitled model" |
| 14 | **Composite join keys are discarded at Apply** | 🔴 Ours | `CanvasJoin` has no field for them |
| 15 | **Join keys are invisible on the canvas** | ❓ Decision | The badge gives the join type, the crow's feet give cardinality, the tables are obvious — but nothing says the join is on `account_id`. It exists only inside the edit form. Vivek stopped short of putting it in the preview header; undecided |
| 16 | **Old canvas has no destination** | ❓ Decision | It used to *be* the model-type modal. Closes today, as the honest placeholder |
| 17 | ~~The pane's name~~ | ⚫ **Settled 2026-08-19: Fields** | Three names had been in play — Metrics, Data, model view / Model — asked three times and never settled. Resolved by checking the industry rather than arguing: see the architecture decision below |
| 18 | **Strip the agent panel's out-of-scope flows** | 🟡 Later | Multi-source and notebook scripts still live in `AgentPanel.tsx` |
| 19 | Canvas drag/snap polish | ⚪ Komal | Miro/FigJam is the reference. ⚠️ Ownership shifted 2026-08-19 — Vivek is taking the end-to-end flow, so the property panel is no longer hers by default |
| 20 | Spotter agent | ⚪ Inherited | ~3 weeks from 2026-08-11 |


---

## Architecture decisions

| Decision | Why |
|---|---|
| **The pane is called Fields** | The industry's word, verified rather than asserted: in LookML a **filter** and a **parameter** are field *types* alongside dimension and measure — this pane's four contents exactly; Tableau's Data pane calls its contents *data fields* and lists calculated fields and parameters among them; Power BI's equivalent is the Field list. ⚠️ **Nothing calls this group "metrics"** — everywhere a metric is a specific calculated thing, not the collection, which is why the old name never settled. It also frees **Model** to mean only the object, and reads correctly against Data browser: source versus selection |
| **Nothing is scratch — saving is not a step** | "By default, whatever you do in a data model does get saved." A filter is model-level the moment it applies, a formula the moment it commits, a parameter the moment it saves. That deleted a promotion step, a `saved` flag, a two-state marker and an undecided destination in one move, and it is what makes the three objects behave alike |
| **The Fields pane is a view list** | No `+`, no row ⋯. Everything in it is edited where it was made — the formula bar, the column marker. ⚠️ Two exceptions, both because there is no alternative route: a column keeps its delete (membership isn't a spreadsheet object), and a parameter row is clickable (a parameter has no column marker) |
| **Save keeps you on the canvas** | It used to land on the model's detail page, which is also where you'd have noticed the model's name. Now the name is asked for at save, the action relabels to Update model, and Query comes alive — the canvas is where the work continues, so leaving it was the odd part |
| **Query needs a saved model, and says so rather than going dim** | A query runs against the model as it exists. A greyed button leaves the user holding "why?", and the answer — it doesn't exist yet — is also their next step, so the control stays live and the dialog carries the route |
| **The data-surface concept is switchable, not decided** | Both options are built behind one `ConfigValues.spreadsheet` field: the merged surface, and the earlier data-preview-plus-Spreadsheet-tabs shape. ⚠️ The question they exist to answer is **where formulas get made** — is a preview what you want for a table, and the spreadsheet what you want for model-level formulas? Research, then decide. ⚠️ The menu that switches them is **hidden** (`MENU_VISIBLE` in `PrototypeConfig.tsx`), not removed |
| **Filters and formulas are authored in the spreadsheet and nowhere else** | The boundary, drawn by Vivek 2026-08-19, and it comes straight out of the workflow: open a model → drop tables picking columns → preview → join on the canvas → **switch to the spreadsheet and create formulas** → **explore further by creating filters** → save the ones to publish → test with Search data → publish. Filters and formulas are steps *in the sheet*, so a card, a join edge and the Fields pane are all the wrong place for them. It also settles the shape: we borrow the object from the spreadsheet, so we borrow the spreadsheet's pattern with it — **a modal, not a side panel** |
| **A filter has to actually filter** | It was stored, listed, edited and read by nothing: `region = West` applied, listed, and every row stayed. Correctness here is *they see the data*, so a control that reports an effect it doesn't have is the exact failure the preview exists to prevent. Filtering is now applied to the sheet and to the CSV export |
| **Filters key by column, and the marker lives in the column header** | One filter per column means the header has one thing to point at, and the funnel is both the "there is a filter here" signal and the way back to it. Outlined = scratch, filled = saved, so a promoted filter is distinguishable from this session's exploration without a second surface listing them |
| **One experience, no cut system** | This prototype is the MVP and nothing else. `variant.tsx`, the `Scope` object, `isPocCut` and every `poc &&` check existed to serve four cuts; a single-cut prototype drops the whole mechanism, and the `poc`-boolean trap with it |
| **`DataStudioV2` stays, untouched** | It is the reviewed reference for everything out of scope here — canvas caching, multi-source, Python/SQL, the Demo north star. ⚠️ It must also **stay in `registry-mine.ts`** — removing it has broken the Vercel deploy before |
| `SCOPE` kept as named constants rather than inlined | ~50 read sites. Inlining them during the extraction would have changed the canvas's shape at the same moment it changed prototype, and made Komal's merge manual. The names also carry the reasoning |
| Near Store's caching surfaces are **imported, not copied** | Single vs multi-source is a property of the model, not a variant of the prototype. A fork would duplicate ~90% of it for one boolean |
| One table→connection authority (`data/tableConnections.ts`) | Six partial, disagreeing maps existed, using four naming schemes for the same connections — so the same table was in a different warehouse depending on which you asked. Authoritative but **not yet the only copy**; each site converges when next touched |
| Prototype components live in `prototypes/DataStudioMVP/components/`, never `src/components/` | That directory is the design system |

⚠️ **Never invent mock data** — table and column names come from `mockData.ts`.

---

## Traps that have already cost us

Each of these shipped as a bug in `DataStudioV2` because code was wired to the thing that isn't in
play. They carry over with the code.

| Trap | What happened |
|---|---|
| **This canvas renders `BlockNode`, not `CanvasNodeCard`** | A badge was added to the component that never mounts. Invisible to typecheck |
| **`wireEnd` / drag-to-connect is dormant** | A gate placed there guarded dead code with dead code. The live paths are the property panel's Apply and the agent bridge |
| **`onClick={applyJoin}` passed the MouseEvent as a boolean argument** | Truthy, so it silently skipped the gate |
| **The formula evaluator existed with one caller** | The property panel stored expressions and computed nothing. Third instance of "the working code existed and the path in use didn't reach it" |
| **The flat table browser didn't pass `showColumns`** | Found 2026-08-17. All seven tree rows passed it; the flat list — the only browser this prototype renders — was missed when it was added the day before. Without it a click falls through to `onAdd`, so the table lands with every column and the column-selection flyout never opens. **Step 6 of the journey was unreachable and nothing failed.** ⚠️ Still present in `DataStudioV2`'s POC V2 cut |

| **`View` is `display: flex`, row direction — not a generic div** | Added 2026-08-19. `design-system.md` called it "a generic div with full layout control". Used as a text wrapper it makes the text an anonymous flex item; used as a list container it lays the rows out **side by side**. Broke the layout of both entry-flow modals |
| **`v2TextStyles` carries `lineHeight` as a bare number** | Added 2026-08-19. React treats `lineHeight` as *unitless*, so spreading `ts.caption` emits `line-height: 18` — eighteen times the font size, a 216px line box on a 12px label. Only `bodyLarge` / `bodyNormal` stringify it. Use `text()` from `../styles`, never the raw style |
| **Removing the view tabs orphaned the whole spreadsheet** | Added 2026-08-19. The Canvas/Spreadsheet switcher was the only thing setting `viewMode` to `'data'`. Deleting it left `dataView` — toolbar, formula bar, grid — built, intact and unreachable. Nothing was deleted; nothing could be reached. **Remove a route only after its replacement renders the thing** |
| **A portal's events bubble through the *component* tree** | Added 2026-08-19. The join badge's menu is portaled, so a pointerup on "Edit join" still reached the badge's own `onPointerUp`, which toggles the menu shut — the item unmounted before its click could land. **Edit join and Delete join did nothing at all**, which is why the join config was unreachable. Menu items now act on pointerup with propagation stopped |
| **A `ref` landed on `CanvasNodeCard`, which never mounts** | Added 2026-08-19. Same trap as the cache badge, caught only because the identifier happened to be out of scope. In scope it would have compiled clean and simply never appeared |
| **A formula column's values are indexed by row *position*** | Added 2026-08-19, while building filters. `derivedCols[col][origIdx]` reads a formula's value by the row's index in the array handed to the grid. So filtering the rows without remapping those arrays by the same indices puts an `fx` column's numbers beside the wrong rows — compiles clean, renders happily, and is wrong. Filters therefore derive one `keptIdx` list and remap both from it. ⚠️ Anything else that ever reorders or drops sheet rows has to do the same |
| **`SelectOption` and `SegmentOption` key on `id`, not `value`** | Added 2026-08-19. `design-system.md` documented both as `{ value, label }`; `value` is an optional override that defaults to `id`. Cost two type errors on first compile. The cheat sheet has been corrected |

**The lesson:** three of five bugs in the last walkthrough were invisible to `tsc` and `npm run
build`. Vite doesn't typecheck, so **run `npm run typecheck`** — and run the thing rather than
verifying it compiles. ⚠️ **Typecheck and build cannot see a layout break at all**: on 2026-08-19
both passed clean while every label in two modals sat in a 216px line box.

---

## Known gaps

Not design questions — things that are simply rough.

- `ModelCanvas.tsx` is ~9,900 lines. **Do not add to the type-error count.**
- `MODEL_DETAILS` only covers two models, so a newly saved model's Columns tab reads "No columns yet"
  despite the fields on the canvas.
- Spreadsheet formatting toolbar: 10 of 15 buttons dead. Spreadsheet undo/redo dead. Tidy up has no
  undo.
- `TestView` is still imported by the canvas although the Test tab is off (`showTestTab` defaults to
  false). Removing the import is part of queue item 1.
