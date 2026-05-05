# Research: Secondary view placement + agent interaction model

_Decision: Where do Data Preview, Tables/Lineage, and Notebook live relative to the Columns canvas? How does the agent interact with them?_

_Researched 2026-04-23. Tools surveyed: dbt Cloud IDE, dbt Canvas, Hex + Notebook Agent, Databricks + Genie Agent, Cursor, Sigma, BigQuery Studio, Mode Analytics, Omni._

---

## The question

Should Data Preview, Tables/Lineage, and Notebook open as a bottom panel (terminal-style), as a full canvas swap (current), or something else — and how does the agent interact with them?

## Who is affected

Sara (data modeler). Most relevant to situations 1–4 (building, testing, coaching, expanding). These views surface reactively — agent flags an issue, Sara checks it, returns to work.

## Current state

All three open as full canvas swaps — they replace ColumnsView entirely. Clicking the active icon returns to Columns. No agent interaction from within these views. Context question ("what am I looking at?") is entirely implicit.

---

## Competitive reference

### Bottom panel (dbt Cloud IDE, BigQuery Studio, Cursor terminal)
- Results/preview/notebook appear in a panel docked at the bottom; primary editor stays visible above.
- Views are **subordinate** — output-only, no AI interaction.
- Works well for outputs that are **tall but not wide** (log lines, dbt test results, SQL errors).
- Breaks for Data Preview: a data grid with 10+ columns needs **width**, not height. A 30–40% tall panel cuts most columns off.
- Cursor's innovation: terminal output feeds into AI chat via `Ctrl+L` — terminal becomes a peer through an explicit "send to agent" bridge, not by co-location.

### Notebook-first with persistent agent (Hex, Databricks Genie)
- Notebook is the primary canvas; agent panel is always on the right.
- Views are **peers** — agent can read/reference all cell outputs, tables, and data explicitly via `@cell`, `@table_name`, "Add context" button.
- Agent interaction is from the **agent panel** — not from clicking a cell or row. The bridge is explicit (@-mention or button), not ambient.
- Context is always visible to the user: "the agent is seeing Cell 3's output because I @-referenced it."

### Modal/drawer (Sigma, dbt Canvas)
- Secondary views (detail modals, node config panels) are **contextual overlays** — primary canvas stays visible beneath or beside.
- dbt Canvas: click a node → right panel opens with Output/Preview/Code tabs. Diagram stays visible. Works because the diagram is spatial and you want to see where you are.
- Sigma: click a row → detail modal, primary gallery still visible behind. Good for spatial context; less good for dense grids.

---

## Key insight from the research

The bottom-panel pattern is a poor fit for Data Preview specifically. Every tool that uses it (dbt, BigQuery) is showing **text output** (SQL results, log lines, errors) — narrow rows, not wide grids. Data Preview in DataStudio is a joined multi-table grid with 12–15 columns. It needs full width to be useful.

The notebook-first tools (Hex, Databricks) make the agent a peer with explicit context bridges. Their pattern works because **the notebook IS the primary canvas**. In DataStudio, Columns is the primary canvas and the other views are on-demand.

The object model the user described — "on demand, you visit and come back" — maps directly to the **contextual child view** pattern, not the peer pattern. The agent already lives in the right panel. The missing piece is the bridge: how Sara sends what she's looking at to the agent while she's in a secondary view.

---

## Options considered

### Option A — Bottom panel (terminal-style)
Columns view compresses to the top ~60%; secondary view opens below as a resizable panel.

**For:** Familiar IDE pattern. Keeps Columns partially visible alongside Tables/Notebook.
**Against:** Data Preview is wide, not tall — it's nearly unusable in a bottom panel. Tables/Lineage diagram also needs width for left-to-right join lines. Notebook is the only view that's naturally tall. Three views, one mechanism, one of them is a bad fit.

### Option B — Full canvas swap (current)
Secondary views replace Columns entirely. Icon toggles back.

**For:** Full real estate for each view. Sara explicitly said she doesn't need Columns alongside Preview, Notebook, or Tables.
**Against:** Toggle-back behavior (click active icon) is subtle — feels like a hidden gesture. No agent context bridge from within these views.

### Option C — Per-view treatment (differentiated)
- Data Preview → full canvas swap (needs width, no Columns needed alongside)
- Tables/Lineage → full canvas swap OR bottom panel (small content, but diagram needs width too)
- Notebook → full canvas swap (no Columns needed alongside)

**For:** Matches each view's natural content shape.
**Against:** Inconsistent mechanism. Three views, three behaviors — adds cognitive overhead.

### Option D — Full canvas swap + agent context bridge (Option B, extended)
Keep full canvas swap. Fix the two real problems: (1) make return-to-Columns feel obvious, not like a hidden toggle gesture; (2) add explicit "send to agent" hooks from within secondary views.

**For:** Simplest mechanism. Already built. Matches Sara's stated object model. Agent interaction happens through the always-present agent panel, via explicit context sends — same pattern as Databricks @cell / Cursor Ctrl+L, just visually different.
**Against:** None identified — both problems being solved are real and fixable.

---

## Decision

**Option D — full canvas swap with improved return UX and agent context bridges.**

Reasoning:
1. Sara's object model is correct: Columns is home, the others are visits. A child view that takes full canvas while you're in it is not wrong — it's how browsers work, how modals work, how dbt Canvas node panels work.
2. Full-screen Data Preview is right. It's a dense grid — it should have full width. Sara said it herself.
3. Bottom panel fails for two of three views (Preview, Tables). Inconsistent per-view treatment adds complexity.
4. The real gap isn't layout — it's (a) making return feel easy and (b) making agent interaction possible from secondary views.

**Return UX fix:** Sub-header should show a clear "back pill" or breadcrumb when in a secondary view — e.g., a pill that reads "← Columns" in the left slot, replacing the column count and search. One click, back home. No hidden icon-toggle required.

**Agent context bridge:** While in a secondary view, the agent panel stays open. Add a lightweight explicit mechanism per view:
- **Data Preview:** hover a row → "Ask agent" button appears at the row end. Clicking pre-fills the agent prompt with the row's key values.
- **Notebook:** each cell gets an "Ask agent" button in its toolbar (alongside edit/run). Clicking pre-fills the prompt with the cell's code.
- **Tables:** click a join line or a table node → a small inline popover appears with an "Ask agent about this join" option.

This is the Cursor/Databricks pattern (explicit context bridge) applied to DataStudio's visual canvas — not ambient, not implicit, always user-initiated.

---

## What this defers / leaves open

- **Notebook writability:** Currently static (read-only cells reflecting build state). Can Sara edit a cell and have the agent execute it? Not decided here.
- **Data Preview selection:** Can Sara select multiple rows and ask the agent to explain the pattern? Deferred.
- **Tables view depth:** Should clicking a table node open a detail panel (dbt Canvas-style) instead of the current `TableDetailModal`? Deferred.

## Return mechanism — DECIDED

The return pill exploration was superseded. The **segmented control** (Columns · Tables · Preview · Notebook) built in session 43 IS the return mechanism — clicking "Columns" returns to the primary view. No separate back pill needed.

The segmented control is always visible in the sub-header regardless of which view is active. The return gesture is explicit and obvious: the "Columns" segment is always present as the home state.

**Agent context bridge** (Data Preview row hover → "Ask agent", Notebook cell toolbar → "Ask agent") remains unbuilt. Deferred — additive, low-risk, can be added when needed.
