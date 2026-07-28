# Data Studio — Next Up

_Active work items. Edit in place each session — move done items to Done, add new ones. Not a log._

---

## Active

### POC / Vision gating review ← picked up when convenient

- **Classify the 71 ungated regions** — see `2026-07-28-poc-vision-gating-review.md`. Komal's POC cut landed 2026-07-28; most of it is gated behind the `poc` prop, but not all. Two ungated changes were caught and split by variant during the merge (data-browser row affordances, data-browser collapse). The doc lists the remaining regions in `ModelCanvas.tsx` that differ from pre-merge Vision with no `poc` reference. Most are improvements to keep for both cuts — the job is to classify each as **both** / **gate** / **n/a**, not to revert.
- **Fill in `PocScope`** — `variant.tsx` defines a `PocScope` config object intended as "the single place that names what the POC turns off," but it's an empty stub. Gating today is ad-hoc `poc &&` checks scattered through components. Worth consolidating as the gating list firms up.
- **Clear the dead type errors** — 4 real ones arrived with her work, all in code that never runs: `ChatView.tsx` ~250 (false branch of `{true ? … : …}`) and two arithmetic errors in the dormant `TestView.tsx`. Clean up when the Test tab is next touched.

### Polish / loose ends

- **Loose end #1** — pixel-exact icon swap from Figma node 517-1053 (file `ZOIU8Te4ocC5Kqjwwynz52`). Current icons match the style but not the exact SVGs.
- **Loose end #4** — block default name still shows "Untitled block"; Models page states-one-side / actions-other still open.
- **Color / icon / font fixes** — icon grays done (145); font colours consolidated conservatively (146). Remaining: `#2770EF` vs `#2563EB` blue split; border consolidation `#EAEDF2` vs `#E2E6EC`; strokeWidth canonical = 1.3 throughout.
- **AI readiness CTA verb** — the run-scan button inside the AIRS dropdown still reads "Check AI readiness" (kept as an action verb; topbar pill is now just "AI readiness"). Decide whether to drop "Check" here too.
- **Dropdown submenus** — block `+` menu Clean/Code sub-menus and the column-menu Clean sub-menu still open sideways via inline `position:absolute` (can clip at extreme right edge). Portalise via `AnchoredMenu` if it becomes an issue.
- **Join connector width** — the join connector SVG still uses the hardcoded `+180` width (line ~3193/3199), so a join line can start *inside* a wide card. Apply the derive arrow's real-width measurement (`querySelector([data-block-id]).offsetWidth`) to joins too if it shows.
- **Derive / sentiment are demo-mock** — the SQL-derive merge, sentiment reveal, and Fix-with-AI data are hardcoded to the Pendo/NPS (`pendo_nps_enriched`) demo tables and column-signature matching. Generalize if this becomes more than a Loom prop.

### Strategy / design

- **Confirm P1 scoping** — review `2026-07-10-analyst-activities.md`, confirm the 27-item P1 list before building.
- **Agentic workflow design doc** — write to `research/`; open decisions: co-pilot vs autopilot hero · where autonomy lives · vertical-slice vs full-flow first.

### Git

- **Commit decision** — sessions 135–147 all uncommitted. Vivek will **merge + commit at the start of the next session** (demo recording done 2026-07-14; code left staged intentionally).

---

## Done (recent)

- ✅ **SQL derived tables** — SQL block that `@`-references other cards to combine them into a new table (147). Inline caret `@`-dropdown of canvas tables; **forgiving name matching** (normalize away spaces/parens/case + contains, and matches the card's *displayed/renamed* name via step titles, not just `tableName`); derive arrows drawn on Run; merged preview via `rowsForCard` (resolves derived cards + display-named sources by column match, no invented data).
- ✅ **Derive arrow styling** — gray `#D0D6DF` (lighter than join), arrowhead only (start dot removed), anchored to each card's **real measured width** (not hardcoded 180). Join connector recoloured blue `#2770EF`; derive = gray → the two edge types read distinctly (relate vs derive).
- ✅ **Pan-to-reveal** — when the properties panel opens, the canvas pans **horizontally only** to keep the selected node visible; reveal-not-recenter (no motion for already-visible cards); resets on deselect. Wire-preview coords corrected for the pan. (`pan` state + translated wrapper around nodes+edges.)
- ✅ **Sentiment reveal choreography** — fetch/Fix stamps the enriched `pendo_nps_enriched` schema but keeps `sentiment` + `sentiment_score` hidden (`hiddenPreviewCols`); running the sentiment cell (combined fetch+sentiment OR standalone) reveals both + pulses `sentiment_score`. Keyed off `/sentiment/i` in the code.
- ✅ **Fix-with-AI: data on Accept only** — during review the preview stays on the error (no data shown for un-accepted code); Accept applies the corrected data; Reject restores the error. Reject/Accept styled soft red/green (not core-blue); redundant "Fix with AI" button hidden during review.
- ✅ **Data browser collapse** — panel fully collapses to 0 width; warehouse icon moves into the topbar (after model name, before the data-mode pill), mirroring the agent-collapse pattern.
- ✅ Cached pill → "Cached" (was "Cached model") + removed the blue focus-ring outline (147)
- ✅ Clean menu — removed the random per-item icons (147)
- ✅ Preview output-pane header — always shows table name + step (e.g. "table · Filter"), not just the step label (147)
- ✅ Data browser "Add data" button → "Add"; removed "Ran — output in preview below" lines (SQL + Python); agent welcome trimmed to 3 suggestion chips (147)
- ✅ Join preview gating — "Preview available after you create the join" until Apply; Data/Semantic + Limit controls hidden during config (146)
- ✅ Dropdown clipping — new `AnchoredMenu` helper (portal + fixed + auto-flip + viewport clamp); applied to data-mode, AI-readiness, browser Add-data, block `+` menu, spreadsheet toolbar prep; column ▾ menu clamped (146)
- ✅ Empty-state copy — "Start building your model" → "Make your data AI ready" + adding-data subtext (146)
- ✅ "Check AI readiness" pill → "AI readiness" (146)
- ✅ Python icon — official Python logo mark in `currentColor` (Add-data menu + toolbar) (146)
- ✅ Clear button removed from SQL and Python blocks (kept on Formula) (146)
- ✅ Font-colour consolidation (conservative) — reds→`#E22B3D`, greens→`#06BF7F`, stray grays→ramp, purple→`#8C62F5`, `#1B58D4`→`#2770EF` (146)
- ✅ Add data button in data browser — fixed temporal dead zone bug (`addDataItems` moved before `browserPanel`)
- ✅ Residual canvas toolbar box — hidden when no buttons in dataset2 mode
- ✅ Clean icon — swapped to Radiant BrushIcon (s-variant, 14×14 filled) in all 4 locations
- ✅ Table properties panel — removed Database/Schema/Table/Columns rows; kept Connection/Rows/Size/Owner/Created/Last synced
- ✅ Agent panel header — static "New chat" span (was editable input)
- ✅ Test tab — added as third option in Canvas/Columns/Test view switcher (placeholder)
- ✅ Caching modal — updated description + Cancel CTA → "Cancel file upload"
- ✅ Add data → data browser — removed from canvas toolbar; added to browser header with same 3 options
- ✅ AgentDB — added to warehouse browser with `cached` schema and 4 tables
- ✅ Color/icon/font audit — ran 5-file workflow; full findings available (not yet acted on)
- ✅ Combined/join view SpreadsheetToolbar — added to joined-view table with its own header row
- ✅ Dead false&& blocks — deleted old disabled header-action blocks from ModelCanvas topbar
- ✅ Fix all with agent + AIRS buttons wired to agent
- ✅ Documentation cleanup — CONTEXT.md rewritten (canvas state only), NEXT_UP.md synced, CLAUDE.md protocol updated
