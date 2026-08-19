# POC V2 — features, interaction exploration, and how to prototype

_2026-08-11. Consolidates `2026-08-11-mvp-feature-breakdown.md` and
`2026-08-11-node-canvas-peer-research.md` into one action-oriented view: what we're
building, what still needs real interaction exploration, how to prototype each thing,
and what's still open — per feature._

---

## All features

1. Entry point
2. Data Browser
3. Canvas — interaction model
4. Column selection
5. Filter & Formula & Metrics (one design problem, not three)
6. Join — visual
7. Caching
8. Spreadsheet
9. Save (was Publish)
10. Model detail / view state
11. Spotter agent

---

## Where to spend prototyping effort

Only two of the eleven genuinely need exploration before they're built. Everything
else is either fully decided or a direct build/fix. Don't spread effort evenly —
spend it here:

| Needs `Playground.tsx` exploration, 2–3 real directions | Direct build, no exploration |
|---|---|
| **5. Filter/Formula/Metrics** — panel shape, how creation is triggered, the cross-table column-picker widget | 1, 6, 8, 9, 10, 11 |
| **7. Caching** — the long-wait progress UI specifically | 2, 3, 4 (interaction-polish only, not exploration) |

---

## 1. Entry point

**Interaction possibilities to explore:** none strategically. `+ → Model → [Old canvas | New canvas]` is decided.

**How to prototype:** direct build — update `CreateModelModal.tsx`'s card list from six options to the two-way choice.

**Open questions:**
- Are "Old canvas" / "New canvas" the final labels, or placeholders that need real copy?
- Does reopening an *existing* model need the same two-way branch, or only net-new creation?

---

## 2. Data Browser

**Interaction possibilities to explore:** click-vs-drag as the add gesture — the one item still genuinely open here. Also worth trying: does tick-column-selection at browse time still make sense standing alone, now that a model-level Fields panel exists (item 5) — could column selection and "what's in my model" converge into one list, or should they stay separate?

**How to prototype:** small enough to try live rather than in Playground — implement click as the baseline, add drag as a layered enhancement, see which one people actually reach for once it's real.

**Open questions:**
- Click vs. drag as the add gesture.
- Exact search/filter UI shape (chips vs. dropdown).
- Does browse-time column ticking still stand alone, or fold toward the Fields panel?

---

## 3. Canvas — interaction model

**Interaction possibilities to explore:** not a strategic fork — Miro/FigJam is decided. What's real: drag ergonomics/snapping detail, and whether POC's sticky multi-select-to-join mode survives as-is now that model-level filter/formula is a separate action (does "select several tables → join" still need its own sticky mode, or does the model-level panel absorb some of what that flow was trying to do?).

**How to prototype:** live spike directly on the canvas — snap distance, connector affordance — not a Playground pass, since direction isn't in question.

**Open questions:**
- Does multi-select-to-join stay as POC built it, or simplify?
- Snap/connector visual feedback specifics.

---

## 4. Column selection

**Interaction possibilities to explore:** none — this is a feasibility question, not an interaction-pattern fork.

**How to prototype:** no UI prototyping needed. The open item is a conversation with the data-modeling team, not a build task.

**Open questions:**
- Does the existing FK-auto-dedup rule hold once caching has materialized cross-warehouse tables into one place, or does that introduce a new collision the rule never anticipated?

---

## 5. Filter & Formula & Metrics — model-level actions

**Interaction possibilities to explore:** the real list, and it's long because this is genuinely new territory:
- The Fields/Metrics panel's layout — flat list? grouped by table, with model-level items in their own group?
- How creation is triggered from that panel — an inline add-row, or a button that opens a focused builder?
- **The cross-table column-picker widget** — the piece that's actually novel. Does it extend the existing single-table formula bar with a table-switcher, or does it need a new interaction entirely?
- Does the panel live open *alongside* the canvas (a docked companion), or take over the view when active?
- Once created, does a formula/filter get any visual acknowledgment on the canvas itself, or does it live purely in the list with no canvas trace at all?
- Filter vs. formula may need different builders — a filter is field + operator + value (simpler, closer to typical BI filter UIs); a formula is a freeform expression. Worth prototyping both, not assuming one UI serves both.

**How to prototype:** the textbook case for this project's own explore-first rule. Take 2–3 real directions into `Playground.tsx` before touching `ModelCanvas.tsx` — e.g. (1) a docked list panel with inline add, (2) a modal builder launched from a `+` in the panel, (3) a hybrid: list for browsing, focused overlay for building. Don't converge early; this is the highest-uncertainty item in the whole MVP.

**Open questions:**
- All of the above interaction items are open, not just "needing polish."
- Does the model detail page (item 10) need its own tab for these, now that they're first-class model objects rather than something buried in a card?

---

## 6. Join — visual

**Interaction possibilities to explore:** none strategically — four join types plus cardinality as a separate axis isn't up for relitigating.

**How to prototype:** direct polish pass on the existing properties panel, not a Playground exploration.

**Open questions:**
- Does the pill-picker need more room once the panel also has to surface caching status (e.g. "this join requires bringing data into one place first")?

---

## 7. Caching

**Interaction possibilities to explore:**
- The long-wait progress UI — does the existing header chip extend with a percentage/ETA, or does a genuinely long wait need something more prominent than a chip at all?
- Where the "upgrade to full data" action surfaces — a button on the chip, on the model detail page, or contextual (a cleaning/DQ action prompts it inline when invoked)?
- What the confirm-before-starting dialog actually shows — estimated time/cost, or a generic warning?

**How to prototype:** genuinely needs exploration, same tier as item 5. Playground pass specifically on the long-wait progress UI — try the extended-chip approach against something heavier (a dedicated progress panel) before committing.

**Open questions:**
- Time-window sampling (dbt's approach — "last 3 days") vs. an arbitrary row count. Unresolved after the peer research.
- Is a schema-only, zero-data validation tier (dbt's `--empty`) worth building for MVP, or deferred?
- What signals "ready for full" beyond an explicit user choice — does invoking a cleaning/DQ action auto-prompt it, and what does that prompt look like?

---

## 8. Spreadsheet

**Interaction possibilities to explore:** minimal — this is mostly a correctness fix (the model-level merge needs to become join-aware; it's currently a positional zip). One real interaction question: does creating a model-level formula in the new Fields panel auto-add a column to the Spreadsheet grid, or is showing it there a separate step?

**How to prototype:** direct build for the merge fix. Decide the formula→grid question inline while building the Fields panel — too small to need its own Playground pass.

**Open questions:**
- Formula-in-panel → column-in-grid: automatic, or opt-in?

---

## 9. Save (was Publish)

**Interaction possibilities to explore:** none — decided and built.

**How to prototype:** n/a.

**Open questions:** none new. One leftover sync fix: the canvas still shows "Draft saved" status text left over from Publish, contradicting the no-draft-mode decision.

---

## 10. Model detail / view state

**Interaction possibilities to explore:** none for the page itself — "no change in exit and view mode" was explicit. One new question, though, falling directly out of today's decision:

**How to prototype:** n/a, pending the open question below.

**Open questions:**
- Now that filter/formula are first-class model objects (item 5), does the detail page need its own tab for them alongside Columns/Joins — so a model can be audited from the view state, not just from inside the edit-state panel?

---

## 11. Spotter agent

**Interaction possibilities to explore:** none — not our design surface, inherited wholesale.

**How to prototype:** n/a — arrives from the SpotterModel team.

**Open questions:**
- The seam: can the inherited agent drive the canvas via the existing three calls (`agentAddTables`, `agentAddJoins`, `agentAddPythonSource`), and does it need a *new* call for triggering caching or creating a model-level formula? Feasibility conversation with that team, not a UX question.
