# Data Studio — session log

_One paragraph per session. History through session 156 is at
`archive/docs/SESSION_LOG-through-2026-08-13.md` (1,953 lines) — it is not read at session start._

---

## Session 157 — 2026-08-13 · documentation reset

Started as a request for a crisp test plan covering every workflow, and turned into a
documentation cleanup once it became clear the plan couldn't be written against the docs we had.
Verifying the plan's claims against code found the mechanism: **the per-table cache badge was
deleted on 2026-08-12 and three documents still assert it** — the caching flow spec, `POCV2_STATUS`
#6 and the walkthrough screenshots — because specs mixed *what we decided* with *what is built*, so
a reversal had to be chased through four files and wasn't. Two framing corrections came from Vivek
and both stuck: the prototype is a stakeholder artifact, not a product, so "not built" is the normal
state and the axis that matters is *does it lie in a path we walk*; and the working set was the
problem, not the writing, so producing more documents was making it worse. Result: **94 markdown
files reduced to 7.** The test plan and a decisions index I'd written were both folded into a single
`PRD.md` — phases with the Demo cut named as the north star and POC V2 as the MVP, the "why" pulled
out of `knowledge/`, and every feature listed as the user meets it so it doubles as the test plan.
Everything else moved to `archive/`, unharvested by decision, since git holds it. Five design
questions closed along the way (row-count readout, window→full nudge, circuit breaker, retroactive
window changes, bridge tables — all cut), filters got a direction (sectioned into the Metrics pane,
which reverses two locked decisions), and cache failure moved from question to build item. No code
was touched.

## Session 158 — 2026-08-17 · the MVP journey lands, and caching leaves

The session began mid-build on the Metrics pane and ended with the MVP redefined. Work landed in
four areas. **The table flyout** became the place you edit a model's columns: reopening a table on
the canvas now shows what's in and lets you select and deselect freely — an earlier version locked
the in-model columns on the reasoning that removal belonged to the Metrics pane, which Vivek
overruled, correctly ("a ticked checkbox that won't untick is a worse lie than two routes to
removal"). CTAs went static, `Add table` and `Save changes`, because the count sits directly above
them. **The Metrics pane** became sectioned and collapsible — per table, then Formulas, Filters,
Parameters — with hover actions split by what a row allows: a delete icon on a column, ⋯ Edit ·
Remove on a formula or filter. Its `+` is now a menu, and **formulas and filters became model-level**,
opening their own panel with no card selected and no chip on any table card, since a chip is a step
in one table's pipeline. Two bugs were real finds: the connection filter menu did nothing because
Radiant's `Checkbox` renders `<label><input>`, firing the row handler twice per click and toggling
back; and Edit opened the read-only summary because the panel keys edit mode on `stepKey()`
(`id_index`) while I'd hand-rolled `id:index`. **The entry flow** was rebuilt to six steps — `+` →
Model → the model-type modal → Build a new model → old-vs-new canvas cards → Select connection →
canvas — moving the old/new choice out of a nav submenu, where the user has no context to choose
with. **Then the scope changed twice.** One connection per model, chosen up front and unchangeable,
so the data browser became a flat list of its tables: we don't let users sync a schema, a database
or several warehouses, so three of the tree's four levels described nothing. And that made
**caching pointless** — its entire reason was that two warehouses can't be joined — so it left the
canvas behind `canvasCaching: false`, with the post-save model cache kept. ⚠️ Turning `tableCaching`
off would have been the wrong lever: it switches Vision's older caching UI back on. Vivek then
stated the MVP journey end to end — one warehouse, clean tables, metadata only, connect → select →
preview → columns → join → semantics → formulas → filters → spreadsheet → enable for Spotter,
manually or via SpotterModel — which is now the top of `PRD.md`. Filters were researched against
ThoughtSpot's docs and are **Model filters**: applied every time the model is used, before the
query runs, for scoping and for data security. Authoring is to match spreadsheet filters; wiring
deferred. `modelFormulas` turned out to already exist as an unreachable Vision-era feature in the
Columns tab — the third instance of "the working code existed and the path in use didn't reach it" —
and was reused rather than duplicated. Typecheck and build held at baseline throughout (ModelCanvas
17, index 2). Next session: extract this into a new Radiant Play prototype, `Data Studio MVP`.
