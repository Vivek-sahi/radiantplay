# Data Studio - MVP — session log

_One paragraph per session. History only — current state lives in `CONTEXT.md`._

---

**Session 159 — 2026-08-17.** Created the prototype. Extracted POC V2 out of `DataStudioV2` into
`DataStudioMVP`: traced the render path to 72 files (~36,000 lines) and left 36 behind — the Vision
workspace, chat and notebook views, dbt import, Pulse monitoring, connections and models pages,
SpotterX, the discoverability explorations and the Playground. Removed the variant system entirely
— no `variant.tsx`, no `?v=`, no header toggle, no `Scope`, no `isPocCut` — replacing it with a
`SCOPE` constant at the top of `ModelCanvas.tsx` carrying POC V2's settings and the reasoning behind
each. Wrote a new `index.tsx` holding only the six-step entry flow, the canvas, the data objects
list and the model detail page. Registered as "Data Studio - MVP" in `registry-mine.ts` alongside
`DataStudioV2`, which is untouched and still runs all four cuts. Typecheck reports 128 errors, every
one inherited from `DataStudioV2` line for line — the extraction added none — and the build passes.
Documentation written fresh as the same 8-file working set. Decided with Vivek: Komal's POC V2 work
merges into this prototype when she is done, so the dead branches the `SCOPE` constants now guard
were deliberately left in place rather than folded through — that is queue item 1.

**Session 160 — 2026-08-19.** Walked the MVP journey step by step with Vivek, refining each surface
as we reached it. Entry modals rebuilt on Radiant primitives, which surfaced two shared design-system
traps that cost a full layout break: `View` is `display: flex` with row direction rather than a
generic div, and `v2TextStyles` passes `lineHeight` as a bare number that React treats as unitless
(a 12px caption rendering in a 216px line box) — both now documented in `design-system.md` and the
traps table, with a `text()` normaliser in `styles.ts`. Built a **UX concepts** menu in the
GlobalHeader so design options can be switched live in front of stakeholders, seeded with the Data
panel decision. Data browser: table detail became a full-height panel with a column search, labelled
source/database/schema, and the four renewal-risk tables were widened (`accounts` 6 → 20 columns)
with matching row data so the search has something to search. Canvas cards lost their menu for an
icon + name + `n of m` columns and a single Remove action, which closed the open ❌ on card-level
filters; deleting a table now takes its joins with it. Joins became drawable — the whole
drag-to-connect pipeline already existed and had never been called — went grey instead of blue, and
state their cardinality as crow's feet rather than the words "Many:1", which required exposing which
end is table 1 since the path is laid out by position. Agreed and implemented the rule that the
property panel is **for configuring, never for viewing**. Then merged the data preview and the
spreadsheet into one surface at two heights, removed the Canvas/Spreadsheet tabs and the row limit,
and gave Semantic the full-screen state it never had. ⚠️ Removing the tabs orphaned the entire
spreadsheet for two messages — they were the only thing setting `viewMode` to `'data'` — a route
removed before its replacement rendered the thing; fixed, and added to the traps table. Ownership
shifted: Vivek is taking the end-to-end flow, so the property panel and canvas surfaces are no
longer Komal's by default. Closed with the formula and filter modals specced from reference
screenshots but unbuilt — queue items 1–3. Typecheck ends at 125 for this prototype, three below the
128 baseline, because three dormant wire props are finally used; build passes.

**Session 161 — 2026-08-19.** Started by auditing formula and filter for parity and finding there
wasn't any: formula had five entry points producing three objects, and the model-level filter was
stored, listed, edited and read by nothing — you could apply `region = West`, see it listed, and
watch every row stay. Vivek drew the boundary in response: **formulas and filters are authored in
the spreadsheet and nowhere else**, and since we borrow the object from the spreadsheet we borrow its
pattern too — a modal, not a side panel. He then gave the nine-step workflow the MVP is actually
built around (now in `PRD.md` under the journey) and the filter workflow with a reference screenshot
of ThoughtSpot's own `Select value for :` dialog. Built it: `components/FilterModal.tsx` with all
four column-type variants, each keeping the Preview chip; entry from the toolbar or a column ▾;
apply genuinely filters the sheet and the CSV with it; a funnel in the filtered column's header,
outlined while scratch and filled once saved, opening Edit · Delete · Save filter. Save marks the
filter and files it nowhere, deliberately — the destination is the one thing still open, and the
leading candidate is the Metrics pane's Filters section, whose own existence Vivek has questioned.
Removed Add filter from that pane's `+`, and took filter off the card-level `startAction` path.
Confirmed on the way that the sheet had no column-selection state, only a selected cell — so Vivek
called that out as the gap and it was built: a header click selects the column, header and cells tint
with an underline marking it, and that is what arms the toolbar's filter, which then does exactly
what the column's own dropdown does. Cell and column are one selection, either clearing the other. Two traps recorded: a formula
column's values are indexed by row *position*, so filtering rows without remapping those arrays puts
`fx` numbers beside the wrong rows; and `SelectOption` / `SegmentOption` key on `id`, which
`design-system.md` had documented wrong and is now corrected. Also deleted the stale duplicate build
queue that had been sitting in `DESIGN.md` since the reorder — its filter item contradicted the new
one. Typecheck ends at 125 for this prototype, three below the 128 baseline; build passes. Next:
the same treatment for formula, then the destination question.

**Session 161 continued — 2026-08-19 (the long one).** After filters, the same treatment went to
formulas: `InsertFormulaModal` replicating ThoughtSpot's dialog with a real function reference, Insert
seeding the formula bar with the argument selected, Enter landing an `Untitled n` column that loads
then fills. The evaluator learned functions — math, text, date, conversion, `IF … THEN … ELSE`, and
aggregates resolved once over the column — and learned to **refuse by name** what it can't compute,
which is what stops Enter on an uncompleted `=abs ( number )` producing a column of zeros. Formula's
five entry points collapsed to one, which left the docked property panel with nothing to show at all.
Then Vivek's bug list: the join config became a modal (`JoinModal`, one form for create and edit,
replacing three copies), which fixed **Edit join doing nothing** — the badge's portaled menu bubbled
its pointerup through the component tree into the badge's own handler, closing the menu before the
click landed. The join preview now holds on the drag-source table until Apply; Model is disabled in
the selector until every table is joined, superseding the orphan error screen; the dock-seam heights
went to two shared constants and the formula bar was decoupled and shortened; the Data/Semantic toggle
became unconditional. Added **Query** — the Search data editor expanded, driven by the model's own
columns — then **parameters**, then creation toasts. Two big reversals: **nothing is scratch** (save
filter is gone, applying is saving), and **saving keeps you on the canvas** with a name-and-description
modal on first save, Update model after, and Query only available once the model exists. Renamed
Metrics to **Fields** after checking Looker, Tableau and Power BI rather than arguing — filters and
parameters are literally field types in LookML, and nothing anywhere calls this group metrics. Full
screen became **Expand Spreadsheet / Dock Spreadsheet**. Both data-surface concepts are built and the
UX concepts menu is now **hidden behind one flag**, nothing deleted. Typecheck 124 for this prototype,
four below the 128 baseline; build passes.
