# Data Notebook — Build State

_Standalone prototype extracted from DataStudio V2 on 2026-06-11. A Hex-style reactive data notebook with a notebook agent._

---

## Product north star (agreed 2026-06-12)

**An agentic data notebook that turns messy, multi-source data into a trustworthy, AI-ready ThoughtSpot model — then lets anyone ask it questions in plain English and get answers, with the notebook as the transparent build-and-trust record behind every answer.**

The moat = the **closed loop**: raw data → agent-built notebook → published model → plain-English answers, where every answer traces back to the exact cells that produced it. (Hex stops at the notebook; Spotter alone is a black box; this is both, joined.)

---

## What it is

A faithful reproduction of Hex's **notebook + notebook-agent** experience in Radiant, with **our** use case (Customer Health Scorecard, multi-source). Built from the Hex docs (notebook view, cell types, notebook agent).

- **Route:** `/playground/DataNotebook` · registered in `registry-mine.ts` as `DataNotebook`.
- **Entry:** `index.tsx` → minimal `Home` (prompt bar + 4 scenario chips, no nav/monitoring/recents) → `HexNotebook`.

## The agent is scripted; the engine is real

- **Real SQL** via **DuckDB-WASM** over seeded Customer Health tables (`seed.ts`, exact mockData schemas).
- **Real Python** via **Pyodide** (pandas + numpy), booted lazily on first Python cell.
- SQL results bridge into Python as pandas DataFrames and back; SQL can query dataframe vars (`source: dataframes`).
- **Reactive graph** (`deps.ts`): editing/running a cell marks downstream stale; input changes re-run downstream automatically.
- The **notebook agent** (`agentScript.ts`) is a canned narrative (search → plan → streams cells) — but every cell it writes contains **real, runnable** code.

## Four scenarios (all built + verified executing)

| id | chip | sources | ingestion |
|----|------|---------|-----------|
| s1 | CDW + Spotstore | Snowflake + Spotstore | SQL both sides |
| s2 | All in Spotstore | Spotstore only | SQL over Spotstore |
| s3 | CDW + CSV | Snowflake + CSV | SQL + real CSV-upload cell |
| s4 | CDW + Pendo + CSV | Snowflake + Pendo + CSV | SQL + Python Pendo fetch (numpy) + real CSV-upload cell |

## Files

```
DataNotebook/
  index.tsx          entry: Home ↔ HexNotebook
  Home.tsx           prompt bar + 4 scenario chips
  HexNotebook.tsx    container: cells state, kernel wiring, run/reactive logic, agent playback, header (Notebook⇄Graph, Run all, Browse data)
  kernel.ts          DuckDB + Pyodide + variable store + SQL↔Python bridge
  seed.ts            Customer Health tables (mockData schemas, expanded deterministically)
  agentScript.ts     SCENARIOS[4] — prompt/search/plan/cells/followups
  deps.ts            reactive dependency graph (inputs, downstream, edges)
  agg.ts             client-side aggregation for chart / single-value / pivot
  types.ts           cell + notebook types
  styles.ts          local token re-export (self-contained)
  components/        Cell, CodeEditor (CodeMirror), ResultsView, AddCellBar,
                     NotebookCanvas, AgentRail, GraphView, DataBrowserModal, ui
```

## Cell types

SQL (source selector + Dataframe/Query pill), Python, Chart (ECharts), Input (slider/dropdown/text/date), Single value, Pivot (no-code), **CSV upload** (drop-zone / browse / sample → DuckDB `read_csv_auto`), Markdown.

## Verified (browser, 2026-06-11)

- Home → chip → notebook (blank, prompt pre-filled) → Send → agent builds, cells stream + execute for real.
- Scenario 4: 9 cells, real Pendo numpy fetch + triple merge, avg health ≈ 69%, chart renders, **0 errors**.
- Reactive slider: at-risk count 11 → 48 as threshold moved 0.6 → 0.95.
- `npm run build` clean.

## Known limitations / next iterations

- **Pendo "fetch"** (s4) is a Python cell generating data with numpy — not a live API. Next: a mock-API affordance / keyed fetch cell.
- Bundle is large (DuckDB + Pyodide CDN + echarts + CodeMirror); not code-split.

## Verified browser session 2 (2026-06-12)

- **Real CSV-upload cell** added (`csv` type). Scenarios 3 & 4 use it; auto-loads the bundled `CSM_MAPPING_Q2.csv` sample during the agent build, and **a user-dropped custom CSV reparses through DuckDB and re-runs downstream** (tested with a custom file → `ZZZ_TestCSM` flowed into the score, 0 errors).
- Scenario 3 build clean (CSV cell + downstream merge, 0 errors).
- **Graph view** renders the DAG (arrows + nodes). **Data browser modal** opens and "Query in a SQL cell" adds + runs a real SQL cell.
- `npm run build` clean.

## Session 3 (2026-06-12) — product framing + the closed loop

- **Home prompt routing fixed** (`Home.tsx`): free-text no longer force-runs scenario 1. "csv" → manual notebook with a CSV cell; pendo/spotstore/scorecard/nps → matching guided scenario; else → manual notebook with a SQL starter. `HexNotebook` gained a **manual mode** (`scenarioId === null`): seeds a starter cell + honest intro, no scripted build.
- **"Publish & ask Spotter" finale** (`spotter.ts`, `components/SpotterPanel.tsx`): once a model var exists (health/score column), a Publish button opens a Spotter panel. Plain-English question → keyword intent (measure + dimension + filter) → **real aggregation** over the model's dataframe → headline / bar chart / ranked table, with the **query shown as the lineage line**. No LLM, real numbers.
- Verified: build scenario → Publish → "average health by region" returns a real grouped chart (`GROUP BY region FROM customer_health`); "which accounts are at risk?" returns a real filtered table (`WHERE … < 0.6`, real ACC- rows). Build clean.
- The Ask-Spotter answers are scripted-NL but **real-compute** — next real step would be an actual agent (Claude Code + MCP, since no API key) for open-ended questions + building.

## Bug fixed this session

Input cells didn't publish their value as a kernel scalar at build time → downstream cells referencing the slider (`at_risk`) errored. Fixed in `executeCell` (input case) + `addCell`.
