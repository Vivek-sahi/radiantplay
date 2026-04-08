# Sales Dashboard

A scaffolding template for creating ThoughtSpot Liveboard prototypes with Radiant components.

## What's included

- **LiveboardHeader** (shared component) — View mode header with tabs, filters, actions + Edit mode toolbar with Add/Styling/SpotterViz
- **AnswerTile** — Tile container with mode-aware hover toolbar (Ask Spotter / Edit / Move to / Delete)
- **SampleBarChart** — Interactive SVG bar chart with hover effects
- **SampleKPITile** — KPI sparkline visualization
- **SpotterVizPanel** — AI chat side panel for edit mode
- **Mock data** — Sample tabs, filters, KPIs, and chart data

## Usage

### Option A: Use the scaffolding script

```bash
npm run new-prototype MyDashboard -- --liveboard
```

### Option B: Manual copy

1. Copy this folder to `src/prototypes/YourName/`
2. Rename `SalesDashboard` to `YourName` in `index.tsx`
3. Update mock data in `data/mockData.ts` to match your theme
4. Register in `src/prototypes/registry.ts`

## Customization

- **Tabs & filters**: Edit `data/mockData.ts`
- **Tile layout**: Modify the tile grid rows in `index.tsx`
- **Charts**: Replace `SampleBarChart`/`SampleKPITile` with your visualizations
- **Additional tile types**: Add Note, Group, or Insight tiles following `liveboard-ia.md`

## Architecture reference

See `.cursor/rules/liveboard-ia.md` for the full Liveboard IA specification.
