# Canvas-to-Agent Interaction — Research & Design Decisions

_Research for Data Studio — canvas selection → agent input interaction pattern._  
_Compiled 2026-04-22. Session 25._

---

## Context

Data Studio has a columns canvas (a table view of all model columns and their properties). After a zero-shot build, users need a way to point at something specific in the canvas and give the agent instructions about it. The question: how should canvas selection work with the agent panel?

Reference interaction: clicking the broken/degraded badge on a column already fires a pre-loaded message to the agent (built session 22). We needed to generalise this into a proper canvas-to-agent pattern.

---

## Industry Patterns Researched

### Bolt
- User clicks a dedicated "select" icon in the chatbox, then clicks an element in the preview
- Selection appears above the chatbox as a plain text summary of the element
- User still types the instruction — selection is context only, not a command
- Two-step: select → instruct

### Cursor
- `Cmd+Shift+L` on highlighted code, or `@filename` / `@symbol` in the input
- Reference appears as a pill/chip in the input — highlighted text, file name, or symbol name
- User types instruction after the chip; the chip is context, not the command
- Supports hierarchy: `@codebase` (broad) → `@file` → selected lines (leaf)
- **Most relevant analog** to our pattern

### Figma Make
- Select a layer in the canvas → chat panel shows the selection in context
- Works at layer level (equivalent to row in our table), not at property level
- User describes the change; the selection is the anchor

### Lovable
- "Visual Edits" mode — click element in preview, selection is inferred
- Mode indicator shows selection is active; user types the modification

### v0 (Vercel)
- Preview controls expose parameters; selection mostly implicit through conversation
- Less direct canvas-to-chat linking

### Claude Artifacts
- postMessage metadata carries element context — transparent to user
- No visible chip or reference in the input

### Spreadsheets (Excel Copilot, Google Duet)
- Cell-level selection: select a range → Copilot chat scoped to that range
- Reference shown as named range or cell address (e.g. `A3:B12`)
- In practice, most useful prompts are column-level (all rows in a column), not single-cell

---

## Common Patterns Across Tools

1. **Two-step always** — select then instruct. No tool treats a selection as a command.
2. **Reference is context, not action** — the chip/pill shows what, the user types how.
3. **Chips in the input** — references appear as inline pills near or inside the text field, not as a separate panel or tooltip.
4. **Hierarchy awareness** — tools with tree structures (Cursor, Figma Make) let you select at different levels of granularity.
5. **Non-blocking** — the reference never replaces the input or auto-submits. The user controls when to send.

---

## Granularity Decision: Row vs. Cell

### Option A — Row-level only
Click the column name → `@column_name` chip in input. Works at the column entity level.

### Option B — Cell-level everywhere
Click any cell (Description, AI Context, Null %, etc.) → chip includes the field: `@column_name · AI Context`.

### Option C — Row-level base + cell-level on specific high-value cells
Row click as default; hover spark + click on data quality cells (Null %, Duplicates, Anomalies) gives cell-level precision since those carry specific metric values.

### Decision: **Row-level (Option A) for the demo**

Rationale:
- Cell-level on all cells would require a spark icon on every cell in a 15-column table — visually noisy, implies false parity between cells
- The only cases where cell-level genuinely changes the outcome (vs. being a shortcut) are:
  - Multi-issue columns (disambiguates which problem) 
  - Same column name across tables (disambiguates source)
- For the demo, row-level covers all scenarios cleanly
- Cell-level deferred — can be added to specific cells later when there's a clear user need

---

## Trigger Mechanism Decision: Click vs. Hover Icon

### Option A — Always-visible AI icon on each row
Clear affordance, permanently visible. Risk: adds visual weight to every row; the icon competes with column names.

### Option B — Hover-only spark (✦)
Icon appears only when the user's cursor is over a row. Keeps the table clean; users discover it naturally.

### Decision: **Hover-only ✦ spark**

Rationale:
- Table is information-dense; permanent icons on every row would add clutter
- Hover discovery is sufficient for a demo context where the presenter can narrate the affordance
- ✦ is already used in the prototype for AI-generated content (AI Context, Synonyms headers) — visual consistency
- Positioned top-right of the column name cell so it never overlaps badges or column name text

---

## What Gets Injected

Format: `@column_name ` (the @-mention text followed by a space, cursor placed after)

- Uses the existing PromptBar @-mention rendering — purple highlight, same as typed @-mentions
- No separate chip data structure needed; PromptBar already handles `@word` highlighting
- Space after the mention ensures cursor is ready to type the instruction immediately
- Agent panel auto-opens and focuses when injection fires

---

## Scripted Demo: Fixing Broken Columns

The canvas-to-agent pattern is demoed via broken dbt columns (`campaign_roas`, `days_to_convert`).

### campaign_roas (broken)
**Issue:** dbt formula references `fct_campaigns.total_revenue` — a column from another dbt model that doesn't exist in the current ThoughtSpot model. Translation failed.  
**Fix:** Rewrite using `SUM(orders.amount) / NULLIF(SUM(campaigns.spend), 0)` — same ROAS semantics, resolved to local columns. Exact calculation, no approximation.

### days_to_convert (broken)
**Issue:** dbt formula references `orders.purchase_date` — the column was renamed to `order_date` in the warehouse after the dbt model was written. Simple column name mismatch.  
**Fix:** Swap `purchase_date` → `order_date`. Identical calculation, no change to semantics.

**Why these two errors specifically:**
- `campaign_roas` shows a cross-model reference problem — common in dbt migrations
- `days_to_convert` shows a column rename problem — common when warehouses evolve
- Both are fixable within the existing model (no missing tables, no approximations)
- An earlier version used `fct_events.first_impression_date` as the broken reference for `days_to_convert` — rejected because it reads like a table import failure and the proposed fix (using `campaigns.start_date` as a proxy) was never accurate

---

## Implementation Notes

- `onInjectToAgent(text)` in CenterPanel → `externalInputInject` state in Workspace → `injectInput` prop on AgentPanel → `promptBarRef.current?.setValue(text)` + focus
- Separate from `onSendToAgent` (which auto-submits) — inject only seeds the input
- Agent panel forced open on inject (`setAgentPanelOpen(true)`)
- Broken badge clicks also use inject (not auto-submit) — same pattern as row click
- `syncStatus` override written to `columnOverrides` on confirm — badge disappears after fix without touching source mock data
- Routing: `/@campaign_roas\b/` and `/@days_to_convert\b/` detected before `matchScript` — fires fix script when `buildStep === 'healthy'`
