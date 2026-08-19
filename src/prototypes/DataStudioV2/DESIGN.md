# Data Studio — design status

_What's in flight, who owns what, and the design decisions behind the build. Product requirements
live in `PRD.md`; this is the working state around them._

**Last updated:** 2026-08-17 (session 158)

---

## Ownership

**Komal:** canvas representation and actions — data preview, canvas interaction, property panel,
nodes, relationships. **Formula authoring counts as hers**, because the builder lives in the
property panel and can generate a formula with no table node selected.

**Ours:** entry point, data browser, column selection, spreadsheet, save, metrics (the pane and its
list — not the builder behind it), and model-level formulas and filters.

**Inherited:** the Spotter agent on canvas, from the SpotterModel team. It drives the canvas through
three calls — `agentAddTables`, `agentAddJoins`, `agentAddPythonSource`. That is the entire API
surface between a conversation and the canvas, and the feasibility question in one line.

---

## Build queue

| # | Item | Status | Note |
|---|---|---|---|
| 1 | Entry point — six steps to the canvas | ✅ Done | `+` → Model → model-type modal → Build a new model → old-vs-new → Select connection → canvas |
| 2 | Save flow | ✅ Done | "Draft saved" hidden in `saveMode`; draft/publish is out of MVP |
| 3 | Spreadsheet — join-aware merge + scope | ✅ Done | Orphan errors rather than showing a partial model |
| 4 | Data browser | ✅ Done | **Flat list** of the one connection's tables, table-name search, detail flyout that edits columns both ways |
| 5 | Metrics pane | ✅ Done | Sectioned per table + Formulas / Filters / Parameters, collapsible, hover actions, `+` menu. Model-level formulas and filters |
| 5b | Formula authoring | ⚪ Komal | Builder is in the property panel |
| 6 | ~~Caching~~ | ⚫ **Out of the MVP 2026-08-17** | Single warehouse → nothing to bring over. `canvasCaching: false`. Model cache (post-save) stays |
| 7 | ~~Model detail page~~ | ⚫ Dropped | No change to the view state after saving |
| 8 | Join panel polish | ⚪ Komal | Shape decided; may need room for cache status |
| 9 | Canvas drag/snap polish | ⚪ Komal | Miro/FigJam is the reference |
| 10 | Column selection — FK collision | 🔴 **Ours after all** | The rule is decided (fact-side FK excluded, survives once from the dimension) and unimplemented on the live path |
| 11 | Spotter agent | ⚪ Inherited | ~3 weeks from 2026-08-11 |

---

## Next up — extract to a new prototype

**Decided 2026-08-17.** The next session's job is to **extract this POC into a new Radiant Play
prototype called `Data Studio MVP`.** Reasons: the MVP journey is now settled and single-warehouse,
caching is out, and four cuts in one 8,300-line file carry a lot that the MVP doesn't want.

**The brief:** keep it very clean, build it around the MVP journey in `PRD.md`, and keep the
documentation equally clean.

Things the extraction has to decide, so they don't get carried over by accident:

- **Does it keep the cut system at all?** `Data Studio MVP` is one experience. `variant.tsx`, the
  `Scope` object, `isPocCut`, and every `poc &&` check exist to serve four cuts. A single-cut
  prototype could drop the whole mechanism — and with it the `poc`-boolean trap.
- **What comes across and what stays behind.** Out by scope: caching (canvas), CSV/SQL/Python,
  Clean, AI readiness, draft/publish, Parameters, Settings, the Columns tab, the Test tab, Workspace,
  Chat, Pulse, dbt import. That is most of the file.
- **Registry:** the new prototype goes in `registry-mine.ts`. ⚠️ `DataStudioV2` must **stay** in the
  registry — removing it has broken the Vercel deploy before.
- **Whether Komal's surfaces come across**, and how her work merges into a second prototype.

Then, inside the new prototype:

1. ⚠️ **Filters.** Resolve the object. They are **Model filters** — applied every time the model is
   used, before the query runs, for scoping and for data security — and the authoring is **the same
   as creating a filter on the spreadsheet** (Vivek). So the spreadsheet's column filter and the
   Metrics pane's filter are one object; the wiring is not done. ThoughtSpot also has *progressive*
   filters, unaccounted for.
2. **Three of four join types produce identical output** — the merge only branches on inner
   vs. not-inner, so right and full outer behave as left outer. Tier 1: we are designing this panel
   and can't review a choice the output can't distinguish.
3. **Auto-propose cardinality** from key uniqueness, shown as detected, editable. Hardcoded
   `many_to_one` today, and it is what step 8 of the journey — "confirm there is no duplication" —
   depends on.
4. **Apply the FK dedup rule.** `account_id` appears twice in the merged output and in the Metrics
   pane. Same step-8 dependency.
5. **Model formula column into the spreadsheet's whole-model view.** Authoring, listing, editing and
   removal all work; the computed column isn't in the merge yet.
6. **One dataset.** Three unrelated scenarios still coexist, so a reviewer builds a marketing model
   and then opens a browser full of support tables. Standardise on **renewal risk** — recommended
   2026-08-06, never actioned.
7. **Old canvas has no destination** in the new entry flow.
8. **Naming a model on save** — it should ask for a name and a description; it lands as "Untitled
   model".
9. **Composite join keys are discarded at Apply** — `CanvasJoin` has no field for them.

## Architecture decisions

| Decision | Why |
|---|---|
| Four cuts from one codebase, selected at runtime — Vision · POC (frozen) · **POC V2 (active)** · Demo (north star) | A fork would duplicate the component tree to express a boolean |
| Gating is a typed **`Scope` object**, one field per difference — not a per-cut boolean | A boolean can only say *which cut am I*, useless once one cut needs some things from another and the rest from a third. Each cut spreads its parent, so it can only differ where a pick is written down |
| ⚠️ **`poc` is `isPocCut(variant)`, which includes POC V2** | ~28 checks read one boolean. Widen the resolver, never the individual checks |
| One table→connection authority (`data/tableConnections.ts`) | Six partial, disagreeing maps existed, using four naming schemes for the same connections — so the same table was in a different warehouse depending on which you asked. It is authoritative but **not yet the only copy**; each site converges when next touched |
| The cache gate is a **function all join paths call**, holding the action to replay | The three paths need different things done on resume |
| Near Store's caching surfaces are **imported, not copied** | Single vs multi-source is a property of the model, not a variant of the prototype. A fork would duplicate ~90% of it for one boolean |
| Prototype components live in `prototypes/DataStudioV2/components/`, never `src/components/` | That directory is the design system |

⚠️ **Never restructure the routing pipeline without asking** — load-bearing, tuned across 34
sessions. See `reference.md`.

⚠️ **Never invent mock data** — table and column names come from `mockData.ts`.

---

## Traps that have already cost us

Each of these shipped as a bug because code was wired to the thing that isn't in play.

| Trap | What happened |
|---|---|
| **POC V2 renders `BlockNode`, not `CanvasNodeCard`** | The cache badge was added to the component that never mounts. Invisible to typecheck |
| **`wireEnd` / drag-to-connect is dormant** | A gate placed there guarded dead code with dead code. The live paths are the property panel's Apply and the agent bridge |
| **A resumed join re-entered the cache gate** | The gate read residency from its render closure, so it saw pre-cache state and re-prompted for tables already cached. A one-tick `setTimeout` is a race, not a fix |
| **`onClick={applyJoin}` passed the MouseEvent as a boolean argument** | Truthy, so it silently skipped the gate |
| **The formula evaluator existed with one caller** | The property panel stored expressions and computed nothing. Third instance of "the working code existed and the path in use didn't reach it" |

**The lesson:** three of five bugs in the last walkthrough were invisible to `tsc` and
`npm run build`. Vite doesn't typecheck, so **run `npm run typecheck`** — and run the thing rather
than verifying it compiles.

---

## Reversed and cut

_Kept so the same argument isn't had twice. If a doc still asserts one of these, that doc is stale._

| Was | Status |
|---|---|
| Per-table **Cached** badge on canvas cards | **Deleted 2026-08-12.** The model states residency once, on the pill — a table isn't cached so much as *moved warehouse*, and stamping that on eight cards said "this one is special" about where the model's data simply lives |
| **Row-count readout before Apply**, called "the highest-value single addition" | **Not needed** (2026-08-13) |
| **Nudge from a window to full** — via out-of-period test question, or asking at Save | **We won't** (2026-08-13) |
| **Circuit breaker** for an inherited full cache policy | **Not needed** — it reasoned about 300M-row tables in a prototype whose largest is 12.4M |
| **Retroactive vs forward-only** window change | **Not needed** |
| **Bridge tables** as an open question | **Dropped** — a warehouse modelling concern, not a design question |
| Filters excluded from Metrics (*"they aren't metrics"*) | **Reversed** — they get a section |
| Metrics pane is **flat** (*"a cross-table formula has no table to nest under"*) | **Reversed** — sectioned, and the formulas section resolves the original objection |
| Model detail page gaining a tab for filters/formulas | **Dropped** — no change to the view state after saving |
| Coalesce-on-outer and never-dedup-on-M:M as part of the FK rule | **Proposed, never decided.** The decided rule is narrower: the fact-side FK is excluded and the column survives once from the dimension |
| Data Studio Vision as a parallel exploration | **Shut down** 2026-05-11 |
| "Day Zero" as the from-scratch flow's name | Renamed `isFromScratch` (session 112) |
| "Prep" as the transform menu name | Renamed **"Clean"** (session 139) |

---

## Known gaps in the prototype

Not design questions — things that are simply rough.

- `ModelCanvas.tsx` is ~8,300 lines and carries ~20 pre-existing type errors; `index.tsx` 2. Build
  passes regardless because Vite doesn't typecheck. **Do not add to the count.**
- `MODEL_DETAILS` only covers two models, so a newly saved model's Columns tab reads "No columns
  yet" despite the fields on the canvas.
- Composite join keys (`+ Add column`) accept input and are discarded at Apply — `CanvasJoin` has no
  field for them.
- Spreadsheet formatting toolbar: 10 of 15 buttons dead. Spreadsheet undo/redo dead. Tidy up has no
  undo.
- Row counts in mock data are small enough that the cache estimate always reads "instant" and
  `classifyRole` calls everything a dimension — role is editable per table so the windowed path
  stays demoable.
