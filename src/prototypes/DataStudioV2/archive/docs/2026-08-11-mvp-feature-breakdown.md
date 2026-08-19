# POC V2 MVP — feature breakdown
_2026-08-11. Breaks the MVP statement into sub-features, stories, workflows, design possibilities, exploration needs, our POV, and the user mental model behind each. Companion to_ `2026-08-06-poc-scope.md` _(that doc defines surface scope — in/out; this one breaks down how the in-scope pieces actually work)._

**The MVP statement, as given:** Users can make multi source data model by caching their tables in ThoughtSpot.

* * *
## Overall POV — where we're taking a position, and where we're not
**Positions taken, grounded in what's already built or decided:**

- Sample-first caching, full data by choice or by action (cleaning, save). But user can opt for full cache also.
  
- Data Browser stays docked + collapsible, not a modal — multi-source means repeated trips back to it. Why? Should this be a modal?
  
- Model-level Spreadsheet must be join-aware — the current row-position zip is a bug, not a design choice. yes this has to be model aware.
  
- Join type (Inner/Left/Right/Full) and cardinality are already the right shape — nothing to relitigate there. We need to go into detail, prototype them and then upgrade them.
  
- Miro/FigJam interaction literacy is the right borrow for canvas manipulation. these are inspiration for canvas behavior
  
- A model never has orphan tables by save time; the canvas can, mid-build
  

**We need to take a call — and here's our stand on each:**

- **Filter and formula creation is removed from the table/card/node level entirely — it's a model-level action.** Not scoped to a table, not attached to a specific join. Peer research found real precedent for drawing this on a canvas (Alteryx, KNIME, Coalesce all do it) — the earlier "no peer does this" claim was wrong — but none of it transfers cleanly: a formula can need two tables that aren't directly joined to each other at all, only connected transitively through a third, so there's often no single join edge to attach to even if we wanted one. Created and listed in one dedicated off-canvas panel (a Fields/Metrics list), reachable from both Canvas and Spreadsheet. See item 5&6 for the full reasoning.
  
- **Long-wait caching extends the existing header chip** with a percentage/ETA readout rather than a new component, stays non-blocking, keeps the confirm-before-start gate. **Default sample: ~500 rows** as our working number, not an empirically tested one — upgradable to full on request, on a cleaning action, or right before save.
  
- **Connection filtering: yes** — as a secondary facet on the unified tree (search/filter-by-connection), never a forced single-connection mode.
  
- **Data-preview actions: read-only.** Matches how Preview already behaves elsewhere in the product — inspection only, no editing surface duplicated from Spreadsheet.
  
- **Parameters and Settings: cut from MVP.** Neither is part of the stated promise — bring tables, join, formula, preview, save. Revisit once the core loop is validated.
  
- **Enable for Spotter: no separate step.** Save makes a model available, consistent with dropping draft/publish entirely — a second gate here would quietly reintroduce the thing we just removed.
  

* * *
## Overall mental model — what users already bring, and what's new
Two borrowed literacies have to coexist, and almost every open item below is a seam between them:

1. **Spreadsheet/warehouse literacy** — tables, columns, real join semantics, SQL vocabulary. Validated by keeping real join types and cardinality rather than inventing new terms for them.
  
2. **Whiteboard literacy** (Miro/FigJam) — spatial arrangement, drag-to-connect, zoom. This is the canvas's actual novelty relative to every peer we've looked at.
  

Model-level filter/formula is where these two collide with no ready vocabulary: it's not "on a table" the way a sticky note belongs to a board, and it's not purely relational the way a SQL clause is scoped to nothing visual. Real peer precedent exists once you check node-canvas tools rather than BI tools (Alteryx, KNIME, Coalesce all draw this somehow) — but none of it transfers, because our canvas draws pairwise join edges, not the arbitrary-N-table nodes those tools use, and a formula routinely needs tables with no direct edge between them at all. That's a structural mismatch, not a missing precedent — which is why it's still the one area we're deciding from first principles rather than borrowing.

**Net-new to teach:** sample vs. full data readiness. Modern BI/sheet tools have already trained this instinct generally (preview vs. run), but ThoughtSpot's current product doesn't ask users to think this way today.

* * *
## 1. Entry point
**Sub-features:** `+` in the Data Workspace sidebar → menu (Connection / Model / Dataset / SQL view) → Model → a choice of **Old canvas** / **New canvas**.

**Story:** As a data team member, when I click `+ → Model`, I want a clear choice between the existing modeling experience and the new canvas, so I know which tool fits what I'm about to build.

**Workflow:** `+ → Model → [Old canvas | New canvas] → New canvas → empty model on canvas`

**Status:** Decided, not open. The only follow-up is that the modal currently built still shows six cards (ported from Suraj's prototype) rather than this two-way choice — a build task, not a design question.

**Mental model:** the two-canvas choice is a transitional MVP fact, not a permanent one — users need to understand there are two paths without needing to care why.

* * *
## 2. Data Browser
**Sub-features:** connections list, database/schema/table tree, search, column tick-selection at browse time, add gesture (click vs. drag), connection filter.

**Stories:**

- As a builder, I want tables from all my connections in one tree, so I don't have to pick a warehouse before I even start.
  
- As a builder, I want to select only the columns I need from a table, so my model doesn't carry fields I'll never use.
  

**Workflow:** open browser → search/filter (optional) → expand connection → schema → tick columns → add to canvas.

**Possibilities:** docked + collapsible panel (Hex-style, matches current build) vs. on-demand modal triggered from an Add action (Sigma-style) vs. embedded-in-canvas field picker (Omni-style — weakest fit here, since our canvas is spatial and multi-table already).

**Our call: docked, not a modal.** The full case for it, since it deserves one:

- Multi-source is the core MVP promise. Building one model routinely means going back to the browser several times a session — table 1, join, back for table 2, checking a column name while writing a cross-table formula, back for table 3. A modal turns every one of those into open→find→close→repeat. A docked panel keeps the tree one glance away the whole time.
  
- The one peer that _does_ use a modal, Sigma, does it inside a spreadsheet-cell workbook with nothing resembling a persistent node canvas to reference. Their modal works because their surface has no canvas to interrupt. Ours does — that's the actual reason a modal is worse here, not a stylistic preference.
  
- The honest case for a modal: it reclaims canvas space and frames "adding data" as one deliberate, bounded action rather than a lingering browse state. Real, but not worth the repeated-trip friction it creates for the thing users will do most.
  

Worth confirming with a usability pass before treating it as locked forever, but this is our working direction, not an open fork between two equally weighted options.

**Mental model:** users expect "browse the warehouse" to feel like a file explorer, not an interruption — which is what makes the modal the weaker fit here specifically, not visual tools in general.

**Still open:** click-vs-drag as the add gesture. (Connection filtering is decided above — yes, as a facet.)

* * *
## 3. Canvas — interaction model
**Sub-features:** free drag, zoom in/out, fit to screen, visual join (drag-connect, not a button), multi-select-to-join.

**Stories:**

- As a builder, I want to arrange tables spatially so the layout matches how I think about the model, not a fixed order.
  
- As a builder, I want to draw a join by connecting two tables directly, the way I would in a whiteboard tool, rather than through a menu.
  

**Workflow:** add table(s) → arrange → drag a connector between two cards → configure join type/cardinality in the properties panel.

**Possibilities:** Miro/FigJam is the named reference — decided direction. What's left is drag ergonomics and snapping behaviour, which is implementation polish, not a strategic fork.

**Needs exploration:** No, beyond normal interaction-polish passes.

**Mental model:** users bring existing whiteboard-tool literacy — that's the whole reason this reference was chosen, and it's meant to keep the learning curve low.

* * *
## 4. Column selection
**Sub-features:** which columns enter the model (tied to Data Browser, per earlier note), shared join-key deduplication.

**Stories:**

- As a builder, I only want the columns I need from a table in my model.
  
- As a builder, I don't want to see the same join key twice once two tables are joined — I want one clean column, not a duplicate.
  

**Workflow:** (folded into Data Browser's flow above) tick columns at add-time → on join, the fact table's FK is auto-excluded, the dimension table's PK survives.

**Status:** the shared-key case is **already decided** — `fk-column-deduplication.md` (2026-04-21), already built into mock data. Looker/Hex-style: FK is plumbing, not a column.

**Still open:** does that rule hold once the two tables are cross-warehouse and caching has materialized them into one place — does caching preserve column identity cleanly, or introduce a _new_ collision the existing decision never accounted for? This reads as a feasibility question for the data-modeling team, not a UX one.

**Mental model:** users think of "the model" as their own curated subset — matches every peer. Where we curate (at browse-time, before the table ever lands on canvas) is earlier than most peers do it, which is worth knowing is the more opinionated choice of the field, not the default one.

* * *
## 5 & 6. Filter and Formula — model-level actions, not table- or join-level
**Sub-features:** filter/formula creation **removed from the table/card/node level entirely** — no more per-card chip. Created as a model-level action instead, referencing any column from any table currently in the model. A dedicated surface for creating and listing both, which doubles as "Metrics" — see all columns and formulas in one place. Confirmed: this can't live only in Spreadsheet, since Canvas needs to reference existing fields while building new ones.

**Stories:**

- As a builder, I want to filter across two joined tables, so I can express logic that isn't scoped to a single source table.
  
- As a builder, I want a formula that references columns from multiple tables, even ones that aren't directly joined to each other — only connected transitively through a third table.
  
- As a builder, I want to see every filter and formula in my model in one place, regardless of which table(s) they touch, so I can audit logic without opening every card.
  

**Workflow:** model-level "add filter" / "add formula" action → pick columns from any table in the model → define the condition/expression → it appears in the shared Fields/Metrics panel. Never opened from a table card; never attached to a specific join.

**Why not join-level:** this was seriously considered — Coalesce's pattern puts cross-table logic in the properties panel of the node that combines those tables, and we already have an equivalent panel (opens when a join edge is selected). It doesn't hold up: a formula routinely needs two tables that aren't directly joined to each other at all, only connected transitively (e.g. `arr_snapshot` and `usage_events`, both joined to `accounts` but not to one another). There's no single join edge that owns that relationship, so a join-level home can't cover the general case even where it could cover a 2-table one. One rule, not two tiers that depend on how many tables a given formula happens to touch.

**Possibilities ruled out, and why:**

- Per-card chip (the old pattern) — **removed.** Doesn't scale past one table.
  
- Attach to the join's properties panel — **ruled out.** See above; doesn't cover transitively-connected tables.
  
- Fold into Spreadsheet as the sole home — **ruled out** earlier this session. Canvas needs to reference existing fields while building new ones; Spreadsheet alone can't serve that.
  
- A persistent canvas-attached strip — not ruled out, but no peer precedent either way; still open if the dedicated panel needs a canvas-visible companion.
  

**Our call: a dedicated model-level panel — a Fields/Metrics list — is both where these are created and where they're all seen, reachable from both Canvas and Spreadsheet.** Still the highest-uncertainty build in this breakdown. Real peer precedent exists for drawing cross-node operations on a canvas (Alteryx, KNIME, Coalesce) — the earlier "no peer does this" claim was wrong — but none of those tools' shapes transfer, since none draw pairwise join edges the way our canvas does. This is genuinely novel territory for our specific structure, not a borrow, and needs real building and testing before it's proven right.

**Mental model:** this is where we're inventing, not borrowing. Every peer assumes metrics belong to "the model" as a whole once things are joined (Omni's Topic-based picker is the closest analog) — none demonstrate "model built from a live, drag-drop canvas, with model-level logic living apart from any single card."

* * *
## 7. Join — visual
**Sub-features:** drag-to-connect gesture, join type (Inner / Left outer / Right outer / Full outer — four pills, already built), cardinality (Many-to-one / One-to-many / One-to-one — separate pills, already built), the venn-diagram glyph (colour deliberately removed from cardinality per a past decision — it read as a false confidence warning).

**Story:** As a builder, I want to draw a join visually and pick its type from plain options, rather than configuring it through a name-matching dialog.

**Workflow:** drag connector between cards → properties panel → pick join-type pill + cardinality pill → confirm join columns.

**Status:** the shape is resolved — four join types plus cardinality as a separate axis is the right strategic call, not up for relitigating. What's still ahead is a **detail and prototype pass**: does the pill-based picker hold up once cross-warehouse joins add real weight to the decision, does the properties-panel treatment need more room, is there polish the current build hasn't gotten. That's real work, just not a fork in direction.

**Mental model:** users read the venn-diagram glyph directly — that's literally why it replaced an earlier hue-coded version nobody could parse without a tooltip.

* * *
## 8. Caching
**Sub-features:** trigger (any cross-warehouse join requires materializing into one place), tiering (sample = fast default for exploration/preview/formula-checking; full = required for cleaning/DQ and before save, or user-chosen anytime), explicit confirmation before it starts (already locked as a principle), progress surfacing for a wait that may be long, default sample size (unresolved number).

**Stories:**

- As a builder joining tables across warehouses, I want to be told this requires bringing the data into one place, and to confirm before it starts.
  
- As a builder exploring a new model, I want to work against a fast sample rather than wait on a full pull just to check my join logic.
  
- As a builder finishing a model, I want to upgrade to full data — either because I choose to, or because I'm about to clean or save — so the model reflects the real dataset.
  

**Workflow (tentative):** cross-warehouse join attempted → system flags it → confirm (cost/time made explicit) → sample cache runs fast → work continues on the sample → user or a specific action (cleaning, save) triggers full cache → progress surfaced → model is save/publish-ready.

**Our call:** sample-first by default (~500 rows, a working number not an empirically tested one), consistent with the existing CSV/Python "always requires caching" rule, refined with a fast first step. Full caching is an explicit, user-visible action — never a silent system trigger, which also fits the already-locked confirm-before-cache principle. The header-chip pattern extends to carry a percentage/ETA rather than becoming a new component, and stays non-blocking.

What the call doesn't finish: the header chip was built for an ~8-second case, and a genuinely long wait (minutes) needs its own prototype pass to know if a percentage readout is enough or if it needs more — that's building and testing the call, not still choosing between options.

**Mental model:** users likely bring "loading" expectations from any modern data tool — fast preview by default, tolerate a longer wait only when it's clearly optional and purposeful, not sprung on them.

* * *
## 9. Metrics — folded into item 5/6
Same underlying object (model-level filters and formulas) as the surface that needs to answer "see everything in one place." Not a separate design problem — see above.

* * *
## 10. Spreadsheet
**Sub-features:** node-level vs. model-level scope toggle (built), grid + column menu (built), formula columns with an `fx` badge (built), the model-level merge needs to become join-aware (currently a positional zip — a bug, not a design choice), the formatting toolbar (mostly dead buttons, flagged for removal in POC).

**Story:** As a builder, I want to see my whole model's data in one flat grid, the way a spreadsheet works, regardless of how many tables it's built from.

**Workflow:** switch scope to Model → see the (properly join-aware) merged grid → switch to Node to see one table's raw data.

**Status:** three real states, not five — single table, fully joined multi-table, and mid-build/unjoined (node-level always covers the last one). This is closer to "fix the existing thing correctly" than "design something new."

**Needs exploration:** No.

**Mental model:** the most familiar surface in the whole feature set — users expect Excel/Sheets behaviour, and that's exactly what it should keep delivering.

* * *
## 11. Save (was Publish)
**Sub-features:** "Save model" commits directly, no modal in between (built); lands on the model's detail page (built); no draft/publish distinction in MVP (decided — explicitly out of scope).

**Story:** As a builder, I want Save to mean "done, here's what I made," without a publish ceremony — matching how the current model editor already works.

**Workflow:** build on canvas → **Save model** → lands on the detail page.

**Status:** decided and built. One loose end: the canvas still shows a "Draft saved" status text left over from Publish, which contradicts "no draft mode in MVP" — a sync item, not a design question.

**Needs exploration:** No.

* * *
## 12. Model detail / view state
Already built (ported from Suraj's `ModelViewMode`). "No change in exit and view mode" was explicit — not part of this breakdown's open items.

* * *
## 13. Spotter agent
Inherited wholesale from the SpotterModel team, arriving in ~3 weeks. Position on canvas stays exactly where it is — not our design surface, not something to explore.

* * *
## Summary — our call is made everywhere; what's left is building and proving it
| Our stand — still needs a real build/prototype pass | Decided and built, or a sync fix |
| --- | --- |
| Data Browser: docked, not a modal — worth a usability pass before locking it | Entry point (decided; modal content needs updating to match) |
| Filter/Formula/Metrics: creation removed from table/card/join level entirely — model-level action only, one dedicated panel reachable from Canvas and Spreadsheet — **highest uncertainty in this doc**; peer precedent exists but none of it transfers to our pairwise-join canvas | Canvas interaction polish (drag/snap) |
| Caching: sample-first (~500 rows), extend the header chip with progress — long-wait UX still needs its own pass | Join UI (shape decided — four join types + cardinality; still needs the detail/prototype pass noted above, not a fork) |
|     | Column selection (FK-dedup already decided; only the cross-warehouse extension is a feasibility question for the data-modeling team) |
|     | Spreadsheet (bug fix, not new design) |
|     | Save flow (decided and built; one status-text sync item) |
