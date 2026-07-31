# Vision · POC · Demo — where to start, and what the gaps actually are
_2026-07-31. Written to answer three questions: where should the Demo cut start from, what does POC have that Vision doesn't, and why isn't the AI readiness selection screen in Vision._

* * *
## The short answer
**Start Demo from Vision.** Not mainly because Vision has more features — because **Komal's UI cleanup is already in Vision.** It landed ungated during the 2026-07-28 merge, so it applies to both cuts. Starting from POC would trade away Vision's features to gain styling you already have.

* * *
## Her work landed in two piles
**Pile 1 — ungated, so already in both cuts.** This is the cleanup. 71 regions are catalogued in `2026-07-28-poc-vision-gating-review.md`. The substantial ones:

| What | Where |
|---|---|
| Unified `renderColumnsTable` — replaced two narrower semantic tables, added Description / AI context / Synonyms / Indexed | `ModelCanvas` ~L6040+ |
| Properties-panel rewrite (−299 lines of the old floating-toolbar path) | ~L3407 |
| `summaryRow` helper — consistent label/value rows in the panel | ~L3338 |
| Filter / null-fix input styling, `selectWrap`, focus treatment | ~L3832–4013 |
| Card sizing + resize (`cardSizes`) | ~L1571 |
| Canvas background — `RADIANCE_WASH` + film grain, replacing Vision's radial gradient | ~L6325 |
| Model identity — click-to-rename inline | ~L2476 |
| `downloadTableCsv` / CSV export paths | ~L5912 |
| Inline pipeline chip layout, join connector anchoring | ~L1277–1345 |

**Pile 2 — gated behind** `poc`**, so POC-only.** 25 conditionals across 4 files, plus 5 `variant === 'poc'` checks in `Overview`. Nearly all of them **scope down** rather than refine — fewer categories, rails instead of controls that live a level up.

* * *
## Complete inventory of POC-only differences
| Area | POC | Vision | Pull into Demo? |
|---|---|---|---|
| **AI readiness surface** (`ModelCanvas:3143–3152`) | 400px / radius 16 → `SpotterReadinessPanel` ("Check for": Physical schema · Semantics · Spotter answers, checkbox + Run each) | 292px / radius 10 → intro dropdown → one "Check AI readiness" button | **See below — this is the one you asked about** |
| **Node menu** (`:1559`) | Join / Filter / Formula / Delete | + Clean and Code submenus | Probably not — demo uses Code (S10) |
| **Data browser categories** (`:3457, :3488, :3500, :3540`) | Connections only, no tabs | Warehouse / Connections tabs, row hover info+add pair | No — demo needs the fuller tree |
| **Browser collapse** (`:3428, :3442`) | 44px rail + header toggle | Collapses to 0, reopens from topbar database icon | Either; cosmetic |
| **Agent panel collapse** (`:6832, :6872`) | 56px SpotterX-style rail | Topbar "open agent panel" icon | Either; cosmetic |
| **Connection pill** (`ConnectionPill:41–57`) | Bordered pill, `@` table mention on the home prompt bar | Plain subtle background | Worth a look — reads better |
| **Cross-connection add** (`:2321`) | Requires caching first | Adds freely | Demo does this itself in the script |
| **Pick mode** (`:2797`, `AgentPanel:5828`) | Sticky toggle; multi-node → chips in composer → "join these tables" → reasoning → join card | One reference per activation | Maybe — it's a real agentic flow |
| **Spreadsheet full-screen** (`:6000`) | Hidden (chevron is the only control) | Full-screen toggle | No |
| **View switch to Data** (`:3066`) | Clears selection + panels | Keeps them | No |
| **Mock connections** (`:3628–3629`) | databricks / product_catalog | bigquery-product / product_db | Demo needs Databricks — take POC's |
| **AgentDB connection** (`:3648`) | Absent | Present under `cached` schema | Keep Vision's |
| **Overview** (`Overview:474–509`) | `pocTools`, no Create-connection / Connect-Snowflake / Cache-a-model chips, no multi-source or notebook entry | All present | Demo wants its own entry page anyway |

So the honest count: **two or three things** are worth pulling from POC into Demo. The cleanup you liked is already in Vision.

* * *
## AI readiness — three versions exist, and I misread this - Komal is building a new version so hold on any work on it. just have the ai readyness chip. clicking on it and what happens will come from a different merge.
You asked why clicking AI readiness doesn't open the screen where you select physical / semantic / Spotter readiness. **That screen exists in this codebase.** It's `SpotterReadinessPanel` (`ModelCanvas.tsx:897–940`) — "Check for", with Physical schema, Semantics and Spotter answers, each with a checkbox and its own Run button. It is gated to POC, so you only see it at `?v=poc`. I said the launcher "wasn't ported" — that was true of _Suraj's_ launcher and it made me miss that POC ships essentially that surface.

The three versions, precisely:

1. **Vision (what you clicked)** — intro dropdown ("Make this model work with Spotter", 3 bullets, ~10 sec) → one button → all three pillars run as sequential working steps in the agent panel → findings card. This is what run-of-show S15 describes: _"three layers checking in sequence."_
  
2. **POC** — the `SpotterReadinessPanel` selection surface. **But the selection is cosmetic:** the checkboxes feed nothing, and `onRun` at `:3152` discards the pillar id and calls the same all-three `airRunScan()`. So it looks like per-pillar control and isn't.
  
3. **Suraj's launcher** — never ported as UI. Only its data came across, into `data/readiness.ts`: the three pillars and 12 named findings. The fields his launcher needed — `prereq`, `prereqMet`, `cost`, `costLabel`, `lastRun`, `points`, `blurb` — are in the file and **referenced by no component**. The data for the screen is sitting there unused.
  

**Decided 2026-07-31: no readiness work.** Komal is building a new version. The AI readiness chip stays where it is; what happens when you click it arrives with her merge. Nothing here gets wired, extracted or rewired in the meantime — including the extraction suggested in the next section, which waits for the same reason.

* * *
## Making her next merge cheaper
You'll be merging her readiness work again. Right now `SpotterReadinessPanel` lives inline in a ~6,900-line `ModelCanvas.tsx`, which is why the last merge needed a hand-audit of 71 hunks. If the readiness surfaces move to `components/readiness/` before her next drop, her version arrives as a **file-level swap** instead of hunks inside the canvas — the merge becomes "take her folder" rather than "diff and classify."

That's the single highest-leverage refactor for the recurring merge pain. Doing it while she's mid-flight is the wrong order, though: agree the file boundary with her first, or do it right after her next merge lands.

* * *
## The Demo cut
### What "scripted" currently means, and where it lives inside Vision
| Scripted piece | Location |
|---|---|
| Keyword branches driving S2→S12 | `AgentPanel.handleCanvasAgentInput` |
| `demoStage` ref (awaiting_connections) | `AgentPanel:4381` |
| `DEMO_SNOWFLAKE_TABLES`, `DEMO_DATABRICKS_TABLES`, `DEMO_JOINS`, `DEMO_QUESTION_POOL` | `AgentPanel:2471–2660` |
| Auto-advance on accept (Snowflake → Databricks → caching → CSV → joins) | `AgentPanel` `onAcceptTables` |
| Jira: credentials form → scope form → script → run → join | `AgentPanel:4520+` |
| `__dsNotifyPythonRun__` seam (join draws only after a real Run) | `AgentPanel` / `ModelCanvas` Run handler |
| Renewal-risk mock tables (`accounts`, `contracts`, `arr_snapshot`, `billing_events`, `usage_events`, `feature_adoption`, `qbr_sentiment`, fixed `jira_cs_tickets`) | `ModelCanvas:297`, `:514` |
| Formula-bar term resolution tuned to the script's wording | `ModelCanvas.commitFormula` |
| Readiness findings pointed at the renewal-risk tables | `data/readiness.ts` |

All of it currently fires in Vision. That's the wiring pollution you noticed.
### Plan
1. **Three variants, one scope object.** `'vision' | 'poc' | 'demo'`, and fill in the `PocScope` stub in `variant.tsx` as a typed `Scope` — one field per thing the cuts actually differ on, drawn from the inventory above.
  
2. **Demo derives from Vision.** `const DEMO_SCOPE = { ...VISION_SCOPE, /* picks */ }`. Demo can never silently drift; it differs only where a pick is named. Safe to land before any picks are decided — Demo starts as an exact Vision clone.
  
3. **Keep** `poc` **as-is.** `poc = variant === 'poc'`, so all 25 existing gates keep working untouched. New gates read `useScope()` from context — no prop threading. Migrate a gate only when Demo needs it to differ. You pay per pick.
  
4. **Move the rails behind** `variant === 'demo'`**.** Vision goes back to being explorable; the script only fires in Demo. Mock tables and readiness data can stay in both — data is harmless.
  
5. **Demo gets its own entry page.** S1 wants an empty state with one centred prompt; Vision's Overview has 11 Pulse cards and 10 recent models. This is the piece that makes Demo feel like a different Data Studio.
  

Scaffolding (1–3) is about two hours. Step 4 is the real work — an afternoon, and it needs a click-through of the whole run-of-show afterwards, since it moves every scripted branch. Step 5 is a new screen.

* * *
## Decisions — 2026-07-31

1. **Readiness** — ✅ **Hold.** Komal is building a new version. The chip stays; what
   happens on click comes from her merge. No wiring, no extraction until then.

2. **What Demo takes from POC** — ✅ **Nothing yet.** Demo starts as an exact copy of
   Vision, so nothing has to be decided up front. One thing will need fixing once Demo
   exists: the data browser lists that connection as **bigquery-product**, but the script
   has Maya saying product usage comes from **Databricks** — POC already labels it
   Databricks. If a presenter opens the browser on screen, Vision's label contradicts
   the narration. Everything else (the connection pill styling, the multi-select-to-join
   flow) can be judged later by opening Demo and POC side by side.

3. **Demo entry page** — ✅ **Start with what we have.** Demo opens on the current
   Overview; the S1 empty state gets built inside Demo later. No new screen now.

4. **Sequencing** — ✅ **Save and publish first, then build Demo.** Everything from the
   last two weeks — the mock data, the agent conversation, the formula bar, today's
   fixes — exists only on this laptop. The link people can open still shows a version
   from before any of it. Publishing first means there's a working version online to
   fall back to if the Demo restructure breaks something mid-way, and it means anyone
   who opens the link sees the real thing.

## Demo ↔ POC — everything still different, to decide one by one

Demo is currently Vision on every row below. ✅ = already picked up by Demo.

_Note on counts: an earlier version of this doc said "25 `poc` gates". That undercounted —
prop passes like `showColumns={poc}` and `pocTools={variant === 'poc'}` don't match a
`poc &&` search. Real total is ~40 sites across the 17 behaviours below._

### Reviewed 2026-07-31 — all 15 decided

**Demo takes POC's version** (`DEMO_SCOPE` in `variant.tsx`):

| Behaviour | What Demo now does |
|---|---|
| Preview scope | Node level / model level dropdown |
| Canvas view switcher | Canvas · Spreadsheet — no Columns tab |
| Data browser category tabs | None |
| Second warehouse connection | Reads as `databricks` / `product_catalog`, in the tree *and* the filter list |
| Opening Spreadsheet | Clears canvas selection, closes panels — it's a context switch |
| Spreadsheet full-screen toggle | Removed; Spreadsheet is its own tab |
| Home setup entry points | Hidden — no Create-connection / Connect-Snowflake / Cache-a-model chips, no multi-source or notebook entries |
| AgentDB connection | Hidden — off-story, stale label |
| Multi-select join flow | Sticky pick mode; several cards → chips → "join these tables" → reasoning → join card |
| Connection pill | Bordered, with a database glyph |
| Prompt bar | `@` table-mention button; upload reads "Upload data" |

**Demo stays as Vision:** data-browser tree rows (no column reveal — add to canvas
and load the preview), the browser Add button, the connection filter, browser
collapse-to-0, agent-panel topbar collapse, Clean + Code in the node menu, and free
cross-connection adds (the script runs its own caching beat).

Two props were renamed while wiring this, because a flag named for POC that Demo
also switches on is a trap: `ConnectionPill.poc` → `bordered`, `PromptBar.pocTools`
→ `tableTools`.

### Data browser

| # | Behaviour | POC | Vision (= Demo today) | Note |
|---|---|---|---|---|
| 1 | **Tree rows** | Chevron expands a table into tick-selectable columns; always-visible `+` | Hover reveals an info + add pair; no column selection | POC's is more capable, not just cleaner |
| 2 | **"Add" button** in browser header | Absent | Present — Upload file · SQL · Python | This is Vision's home for ingestion; the script never uses it |
| 3 | **Filter connections** button | Absent | Present, next to search | |
| 4 | **Collapse** | 44px rail + header toggle | Collapses to 0; reopen from the topbar database icon | |
| 5 | **Connection labels** | `databricks` / `product_catalog` | `bigquery-product` / `product_db` | ⚠️ Script says product usage is in Databricks — Vision's label contradicts the narration |
| 6 | **Near Store connection** (`cached` schema) | Absent | Present | |

### Canvas

| # | Behaviour | POC | Vision (= Demo today) | Note |
|---|---|---|---|---|
| 7 | **Node menu** | Join · Filter · Formula · Delete | + Clean and Code submenus | Demo needs Code for S10 |
| 8 | **Pick mode / multi-select join** | Sticky toggle; pick several nodes → chips in the composer → "join these tables" → reasoning → join recommendation card | One reference per activation | A real agentic flow, not styling |
| 9 | **Cross-connection add** | Prompts for caching first | Adds freely | Demo scripts its own caching beat |
| 10 | **Switching to Spreadsheet** | Clears selection, closes panels | Keeps them | |

### Everything else

| # | Behaviour | POC | Vision (= Demo today) | Note |
|---|---|---|---|---|
| 11 | **Spreadsheet full-screen toggle** | Hidden — chevron is the only control | Present | |
| 12 | **Agent panel collapse** | 56px SpotterX-style rail | Topbar "open agent panel" icon | |
| 13 | **Connection pill** (home prompt bar) | Bordered pill with a database icon | Plain, no border | |
| 14 | **Prompt bar tools** (home) | `@` button inserts a table mention; upload icon is a `+` labelled "Upload data" | Upload icon only, "Upload a file" | |
| 15 | **Overview** | No Create-connection / Connect-Snowflake / Cache-a-model chips; no multi-source or notebook entry points | All present | Demo's entry page is being redesigned later anyway |

### Held — Komal's merge

| # | Behaviour | POC | Vision (= Demo today) |
|---|---|---|---|
| 16 | **Readiness pill label** | "Spotter readiness" | "AI readiness" |
| 17 | **Readiness dropdown** | 400px `SpotterReadinessPanel` — Check for: Physical schema · Semantics · Spotter answers | 292px intro → one "Check AI readiness" button |

## Build order

Given the above: publish → scaffold the three-way variant (plan steps 1–3) → move the
scripted rails into Demo (step 4) → click through the whole run-of-show. Skip step 5.
No readiness work.
