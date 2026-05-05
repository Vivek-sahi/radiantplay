# Data Studio — Project Status
_Single source of truth for this prototype. Update at the end of every session._

---

## Next up

**Journey 4 fix pass (next session)**

First build of Journey 4 (dbt plug-and-play) is done but has 8 issues found in review. All documented in `research/journey-4-dbt-spec.md` under "Session 56 — build review fixes". Fix those before demoing Journey 4. Key items: External Models empty state must live inside DataBrowserPage (not a separate screen), wizard must use design system WizardModal, canvas needs dbt welcome message + column warning indicators + working Publish modal.

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

- **2026-05-06** — Day Zero agentic flow built. Working branch confirmed as `prototype/data-studio` (not `main` — CONTEXT.md was wrong). Vivek owns this branch; Komal works on hers and merges in when ready.
- **2026-05-06** — Journey infrastructure isolated to new files only. `Overview.tsx` never touched — teammate owns it for the monitoring journey. Merge safety: additive changes to `Shell.tsx` + `index.tsx` only.
- **2026-05-06** — Day Zero journey warehouse path only (no sample data). Connection flow: 4 agent conversations, inline credential form in AgentPanel scroll. Clarifying questions before build fires (new `awaitingClarification` state). Full decisions in `research/day-zero-journey.md`.
- **2026-05-05** — Migrated `DataModel` type, skill catalog, and per-skill reasoning from DataStudioVision into V2. Vision branch goes quiet; V2 is the single home.
- **2026-05-05** — Connections: Option C (Hybrid). Admin warehouse + per-user credentials + soft schema filter. No setup-time table/column picker. See `research/connections-tab.md`.
- **2026-05-05** — Data Browser: Option B (Sigma-style). Data Browser = warehouse catalog. Models tab = TS Models (incl. dbt drafts). See `research/data-browser-tab.md`.
- **2026-05-05** — dbt sync model: bidirectional. Live link + on-demand pull + push-back for user overrides.
- **2026-05-06** — Working branch is `main` of `origin` (vivek-sahi fork). Never use `prototype/data-studio` for Vivek's work. Komal works on her own branch and merges into Vivek's `main`. Never push to `upstream` (mohammed-faris).
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

### 2026-05-06 (session 56)

**Journey 4 — dbt plug-and-play. First build pass + spec. 8 fixes identified.**

- Toolbar polish: gear icon (inline SVG replacing broken CogIcon), Share button label added, Publish button always enabled.
- Publish modal: AI context / data prep / caching rows updated to plain text (no chips).
- `research/journey-4-dbt-spec.md` written. Full Journey 4 flow documented: 4-step wizard, 3 exit paths, External Models empty + filled states, dbt canvas, dbt PublishModal.
- First build: `DbtImportWizard.tsx`, `DbtOverview.tsx`, `ExternalModelsPage.tsx` created. `DbtPublishModal` added to `Workspace.tsx`. Journey 4 routing wired in `index.tsx`.
- Review found 8 issues — documented in spec. Key: External Models empty state should live inside `DataBrowserPage` tabs, not a separate screen. Wizard needs design system `WizardModal`. Canvas needs dbt welcome agent message + column warnings + working Publish.
- Build: clean ✓

---

### 2026-05-06 (session 55)

**Day Zero flow redesign — schema choice, clarify cards, requirement summary.**

- `AgentPanel.tsx` — "Skip for now" renamed to "Try with demo data". Post-connection outcome card drops latency. Schema chips replaced with `schemaChoice` two-option card ("Bring all" / "I want to select"). New `SchemaChecklistCard` inline component: 6 schemas with checkboxes + "Import schemas" button. New `ClarifyCard` inline component: stacked option buttons + "Enter your own…" text input, one question at a time. Q1: "What are you trying to solve for?" [Campaign ROI, Ad spend tracking, Attribution analysis]. Q2: "What should I focus on?" [ROI metrics only, Ad spend + ROI, Full funnel analysis]. After Q2: `day_zero_understand_requirement` SCRIPT fires (Understanding → Identifying tables) → requirement summary card ("Here's what I've captured…") → "Yes, build it →" chip → existing `build_project`. New phases: `schema_choice`, `schema_checklist`. `handleSchemaImport` added.
- `CredentialFormCard.tsx` — "Connect to Snowflake" button now `size="medium"` + `fullWidth`.
- `CenterPanel.tsx` — "No columns selected" empty state replaced with neutral "No data yet" state.
- Build: clean ✓

---

### 2026-05-06 (session 54)

**Day Zero agentic flow — connection → schema → clarify → build.**

- `CredentialFormCard.tsx` — new component. Inline credential form rendered inside an agent message bubble. Auth method selector (decorative), 5 fields, 2s mock submit → fires validation phase.
- `AgentPanel.tsx` — `isDayZero` prop + `dayZeroPhase` state machine (8 phases). `runDayZeroSteps` helper for working-step animations without the proposal/confirm path. `handleDayZeroFormSubmit` + `handleDayZeroInput` handle all phase transitions. 3 new SCRIPTS: `day_zero_discover`, `day_zero_validate_connection`, `day_zero_parse_use_case`. `interactiveChips` + `credentialForm` fields on `AgentMessage`. `MessageBubble` updated to render both.
- `Workspace.tsx` — `isDayZero` prop threaded to AgentPanel.
- `index.tsx` — `isDayZero` state, `handleDayZeroPromptSubmit`, reset on goBack, threaded to Workspace.
- Build: clean ✓

---

### 2026-05-06 (session 53)

**Journey infrastructure promoted to live + workflow cleanup.**

- `JourneyPicker.tsx` — extracted from playground. All 4 journeys active and clickable. Journey 1 → `DayZeroOverview`, journeys 2–4 → existing `Overview`. App opens on journey picker.
- `DayZeroOverview.tsx` — extracted from `j-day0` exploration. Warehouse cards pre-fill prompt bar; PromptBar submit → `handleOverviewPromptSubmit`. Existing model cards → `newProject`.
- `Shell.tsx` — added `onJourneyPickerOpen` prop + `JourneyPin` compass button via new `bottomSlot` in AppSidebar.
- `AppSidebar` — additive `bottomSlot` prop + CSS. No existing behavior changed.
- `index.tsx` — `'journey-picker'` and `'day-zero'` views wired.
- **Cleanup:** deleted promoted exploration files (DataBrowser, Connections, JourneyExplorations), `radiantplay-optimizations.md`, `knowledge/phase-2.md`. Playground.tsx updated.
- **Git workflow fixed:** working branch is now `main` of `origin` (vivek-sahi). Documented in CLAUDE.md.
- Build: clean ✓

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
