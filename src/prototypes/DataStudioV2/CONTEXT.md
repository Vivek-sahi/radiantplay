# Data Studio — Project Status
_Single source of truth for this prototype. Update at the end of every session._

---

## Next up

**Promote journey infrastructure to live prototype** (start of next session)

Playground explorations are approved and ready:
- `j-picker` — dark journey picker, 4 cards, Data Studio vision tagline
- `j-day0` — Day Zero empty state, 7 warehouse cards with real logos, dbt + semantic views

**Promotion steps:**
1. Add journey switcher pin to `Shell.tsx` (bottom of left sidebar — additive only, no other changes)
2. Wire `JourneyPicker` into `index.tsx` as an app-level screen; journeys 2–4 route to existing `Overview.tsx`
3. Create `DayZeroOverview.tsx` from `j-day0` exploration; journey 1 routes here

**Then — connection flow (new agent work):**
4. `day_zero_connect_warehouse` SCRIPT: 4 conversations (warehouse confirm → inline credential form → working steps → schema select)
5. Clarifying questions pattern: `awaitingClarification` state in AgentPanel before `build_project` fires

Full spec: `research/day-zero-journey.md`

---

## Where things live

| Need | File / folder |
|---|---|
| Mock data — tables, projects, scenarios, conversations, alerts | `data/mockData.ts` |
| Agent panel + SCRIPTS map (22 entries) | `components/AgentPanel.tsx` |
| Journey picker + Day Zero empty state (Playground) | `components/explorations/JourneyExplorations.tsx` |
| Warehouse brand logos | `public/logos/` (snowflake, redshift, bigquery, databricks, azure, postgres, dbt) |
| Day Zero Journey spec | `research/day-zero-journey.md` |
| Skill catalog — 28 skills across 10 groups | `knowledge/skill-map.md` |
| Routing pipeline + load-bearing rules | `reference.md` + `CLAUDE.md` Hard rules |
| Why we made a non-obvious call | this file → Decisions log |

---

## Decisions log

- **2026-05-06** — Journey infrastructure isolated to new files only. `Overview.tsx` never touched — teammate owns it for the monitoring journey. Merge safety: additive changes to `Shell.tsx` + `index.tsx` only.
- **2026-05-06** — Day Zero journey warehouse path only (no sample data). Connection flow: 4 agent conversations, inline credential form in AgentPanel scroll. Clarifying questions before build fires (new `awaitingClarification` state). Full decisions in `research/day-zero-journey.md`.
- **2026-05-05** — Migrated `DataModel` type, skill catalog, and per-skill reasoning from DataStudioVision into V2. Vision branch goes quiet; V2 is the single home.
- **2026-05-05** — Connections: Option C (Hybrid). Admin warehouse + per-user credentials + soft schema filter. No setup-time table/column picker. See `research/connections-tab.md`.
- **2026-05-05** — Data Browser: Option B (Sigma-style). Data Browser = warehouse catalog. Models tab = TS Models (incl. dbt drafts). See `research/data-browser-tab.md`.
- **2026-05-05** — dbt sync model: bidirectional. Live link + on-demand pull + push-back for user overrides.
- **2026-04-30** — Push only to `origin` (vivek-sahi fork). Never to `upstream` (mohammed-faris).
- **2026-04-30** — `formula` embedded inside `columns[]`, not a separate array. ThoughtSpot formulas are derived columns.

---

## Demo arc — 4 journeys (new framing, 2026-05-06)

Replaces the original 6-situation arc as the primary demo structure.

| # | Journey | Status | Overview entry state |
|---|---------|--------|----------------------|
| 1 | **Get started** — Day Zero, warehouse to first model | Building | Empty state (DayZeroOverview) |
| 2 | **Monitor & optimize** — Day N, improve existing models | Teammate building | Existing Overview (10–20 models + alerts) |
| 3 | **Debug issues** | Later | Same as Journey 2 |
| 4 | **dbt plug-and-play** | Later | Same as Journey 2 |

Original 6-situation arc (still valid for demo scripting) → `SCRIPT.md`

---

## Agent patterns (locked 2026-04-20)

| Moment | Pattern |
|--------|---------|
| Opening brief too vague | 2–3 clarifying questions |
| Opening brief is clear | One-shot build with working steps |
| Genuine ambiguity mid-build | Bet and proceed (state assumption inline) |
| Testing | One-shot answer + 3-dimension diagnostic |
| Issue found in testing | Scale the fix |
| Coaching in draft | One-shot apply, no approval |
| Publish / cache | Explicit confirm |
| Monitor and fix | Explain → propose → confirm |

---

## Session log

_Last 3 sessions. Full history → [SESSION_LOG.md](./SESSION_LOG.md)_

---

### 2026-05-06 (session 52)

**Journey infrastructure spec + Playground explorations.**

- **Day Zero Journey spec** finalized at `research/day-zero-journey.md`. Scope locked: warehouse-only path, 4 agent conversations for connection setup, clarifying questions before build, journeys 2–4 land on existing `Overview.tsx`. Merge safety: new files only, `Overview.tsx` never touched.
- **`j-picker` exploration** — dark theme journey picker: deep blue-black background with radial glow, 4 journey cards (01 Get started active, 02–04 "Coming soon"), "Data Studio · Vision" identity + tagline. Click "Start journey" shows selected state.
- **`j-day0` exploration** — Day Zero empty state inside Shell: "What would you like to build?" hero (same as live Overview), 7 warehouse cards with real logos, clicking pre-fills prompt bar. Section 2: dbt models + semantic views with logos.
- **Real logos added** to `public/logos/`: Snowflake, Redshift, BigQuery, Databricks, Azure, PostgreSQL, dbt.
- **Branch merge:** `dsv/vivek-data-browser-fixes` → `prototype/data-studio`. Data Browser + Connections now live in the prototype.
- **Next:** Promotion to live (see Next up above).

---

### 2026-05-05 (sessions 50–51)

**Data Browser + Connections promoted to live prototype.**

- `DataBrowserPage.tsx` promoted: warehouse tree (3-level: schema → table → column), rebuilt per Hex/Omni/Sigma research, Radiant components throughout.
- `ConnectionsPage.tsx` promoted: full design system overhaul, list view with row-click to detail, "+ New connection" entry, action stubs visual-only.
- Design decisions locked: see `research/data-browser-tab.md`, `research/connections-tab.md`, `research/data-connections-promotion-plan.md`.

---

### 2026-05-05 (session 49)

**M7 cache + quality state in canvas header (live).**

- Two-line canvas header: project name + draft/version, status subtext beneath.
- Cache flow: Live query → Caching in progress (10s spinner) → Cached query. Modal with smart defaults + by-tables option.
- Quality flow: red "9 quality issues" → green "9 issues resolved" after prep transforms. Modal CTA → triggers `review_data_quality` script.
- `errorChips: ['⚠ 9 quality issues']` added to `build_project` outcomeCard.
- Playground: CD1–CD5, DQ1–DQ5, M1–M7 explorations. M7 chosen and promoted.
