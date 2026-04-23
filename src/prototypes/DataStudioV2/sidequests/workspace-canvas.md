# Sidequest: Workspace canvas layout

_Started 2026-04-23. Updated 2026-04-23 (session 4). Layout direction locked — panel UI built — header consolidated._

---

## Question
What is the spatial layout and visual treatment of the workspace — specifically, how do secondary views (data preview, lineage, code) relate to the primary columns view?

## Constraints
- Columns view is the primary object — it must dominate the space
- Agent panel stays on the right (ThoughtSpot pattern)
- All interactions must use ThoughtSpot design system tokens (dark mode)
- No tabs competing at equal visual weight

## Decision: locked — V6 pattern

**Going with: horizontal panel below, dark (ThoughtSpot tokens)**
- Route to reference: `/data-studio/playground-v6`
- Playground file: `src/prototypes/DataStudio/Playground.tsx`

### Layout
- Columns view is primary — always full height, never shares vertical space by default
- 3 icon buttons in the Columns header (right side): Data · Lineage · Code
- Clicking an icon opens a **resizable horizontal panel below** columns (drag top edge to resize)
- Clicking the active icon again closes the panel
- Each panel has a × close button in its header
- No tabs anywhere

### What's in each panel
| Icon | View | Notes |
|------|------|-------|
| Grid | Data preview | Raw warehouse rows, table picker (orders / campaigns / users) |
| Branch | Lineage | Horizontal workflow diagram — like dbt, not a vertical tree |
| Code | SQL/Notebook | Generated SQL, debugging only — not primary |

### Test
Merged into Agent panel — not a separate secondary view.

### Color: dark mode
- Background: `background-base-inverse` (#1D232F)
- Raised surfaces: `background-raised-inverse` (#323946)
- Borders: `border-divider-inverse` (#4A515E)
- Text: `content-primary-inverse` (#FFFFFF)
- Dim text: `border-hover-inverse` (#777E8B)
- Brand accent: `content-brand-inverse` (#71A1F4)
- Do NOT use raw black (`#0D1117`) — tokens only
- Reference: ThoughtSpot SpotterViz and Styling panels

### Why horizontal won over vertical (V4)
- Data, lineage, and code are all horizontally-oriented content
- Vertical panel narrows columns view, which already has horizontal scroll issues
- Data preview cross-references columns view above — horizontal alignment is the right pairing

---

## What was built (sessions 3–4)

### Data preview (session 3)
- Added "Campaign Performance" as first chip (joined model: orders × campaigns × users)
- Chip order: Campaign Performance → campaigns → orders → users
- Model tab shows joined rows with: order_id, order_date, amount, region, status, campaign_name, channel, spend, segment, lifetime_value

### Lineage (session 3)
- Replaced text tree with SVG diagram: orders card left-center, campaigns top-right, users bottom-right
- Orthogonal connector lines with LEFT JOIN / INNER JOIN badges at midpoint
- Join key labels on each connector end
- Dark palette (K tokens) throughout

### Notebook (session 3)
- Replaced SQL view with dark notebook matching demo's `NotebookView`
- 8 cells: SQL and Python — add tables → joins → metric → date normalization → dedup
- Cell header: type badge (SQL blue / Python purple), Cell N label, ▶ and ··· action buttons
- Comment line + syntax-highlighted code with line numbers

### Header consolidation (session 4)
- V6 now has its own standalone component (not through `HorizPlayground`)
- Main header: demo-style (← back, project name, v1, warehouse icon, settings icon, Test, Share, Publish)
- Sub-header: single row with [Data panel toggle] [spacer] [Data/Lineage/Notebook panel toggles] [separator] [Data Agent toggle]
- `CanvasHeader` removed from center column — no more intermediate header layer
- Shared labels (CTABS "SQL", SEC_PANE_DEFS "Code") kept unchanged — V6 only relabels "Code" → "Notebook" in its own sub-header

## What to consider next
- Whether the columns view's own internal toolbar (search, hide properties, column count) should also move into the sub-header
- Further panel polish: column type badges in data preview header, lineage card clickability

---

## All playground iterations

| Route | What it is | Status |
|-------|-----------|--------|
| `/data-studio/playground` | V1 — original bottom drawer | Keep |
| `/data-studio/playground-v2` | V2 — dark terminal drawer (GitHub-dark) | Superseded |
| `/data-studio/playground-v3` | V3 — icon-triggered horizontal panel (dark) | Superseded |
| `/data-studio/playground-v4` | V4 — icon-triggered vertical panel (dark) | Rejected |
| `/data-studio/playground-v5` | V5 — icon-triggered horizontal panel (light) | Rejected |
| `/data-studio/playground-v6` | **V6 — CURRENT DIRECTION** | ✅ Active |

## How to close this
When the three panel views (data preview, lineage, code) are built to sufficient quality, write a summary in `knowledge/patterns.md` under "Workspace canvas — confirmed" and delete this file.
