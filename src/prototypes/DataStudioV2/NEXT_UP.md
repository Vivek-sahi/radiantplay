# Data Studio — Next Up

_Active work items. Edit in place each session — move done items to Done, add new ones. Not a log._

---

## Active

### Do this first ⚠️

- **Walk the whole demo once, now including S1.** S1→S20 connects end to end. S1–S3 was
  watched on screen this session; S4 onward after the chat-first start has not been, and
  the beat that most deserves a look is **S4→S7 following a created model** — the agent
  now waits on the canvas's 4.4s creation pass before advancing to Databricks, and that
  ordering has only been reasoned about, not seen.
- **The run-of-show is now out of date at S7.** It says "Canvas opens with all three"
  after caching; the canvas actually appears at S3, because the accepted tables need
  somewhere to go. Decided deliberately (2026-08-01) — edit the script to match.
- **`MODEL_CREATE_MS` is a guess at 4.4s.** Vivek asked for 4–5s and it hasn't been timed
  against a live narration. One number in `ModelCanvas.tsx`.
- **The Spotter beat leans on one keyword rule.** `pickCannedResponse` routes renewal
  questions ahead of its churn rule; improvise a phrasing that misses both and you get a
  generic chart. Six phrasings are covered (harness in the commit message for 153) — worth
  broadening before a stakeholder rehearses.
- **Nothing dismisses the caching chip.** By design — it's the route back to the model —
  but it stays in the header until you leave Data Studio. Revisit if it reads as stuck.

- **Run the readiness beat end to end** (`?v=demo` → add a table → AI-readiness pill).
  It has never been watched start to finish by a human — every check this session was
  `tsc` + build. Worth doing before a stakeholder rehearsal.
- **S17 and the build now disagree.** The script says *"Score climbs to green. Let the
  score animate. This is the only place worth spending a real animation."* There is no
  score, by decision. Either edit the run-of-show or plan to narrate past it. `i9`
  ("Renewal Risk has no definition an LLM can reason from") carries the beat instead.
- **The avatar swap reverses session 151.** The Spotter mascot was a deliberate choice
  then; the agent now uses `SpotterModel avatar.svg` to match Komal's flow. Decided, but
  worth a second look on screen. `spotter-mascot.png` is still in `assets/`.
- **The user avatar still differs between the two.** Her flow uses
  `/spotter-assets/User avatar.png` via `_agentic/UserBubble`; our thread draws its own
  SVG silhouette (`AgentPanel.tsx` `UserAvatar`). Only the agent mark was unified.

### Parked by Vivek — 2026-07-31, decided not to do yet

- ✅ **Demo lands on Workspace, not the canvas.** Resolved by the chat-first start —
  Demo's home prompt now opens the canvas directly and never routes to Workspace. The
  `buildStep !== 'empty'` transition in `index.tsx` is untouched and still serves Vision
  and POC.
- **Empty-state chips name off-story tables.** The canvas agent's first screen offers
  "Fetch dim_accounts, support_cases and call_metrics", which is a different scenario.
  Agreed it shouldn't be table names; tackling later.
- **Inert spreadsheet formatting toolbar.** 10 of 15 buttons have no handler (Undo,
  Redo, Sort range, Format paint, Align, Wrap, Currency, Percent, both decimals, Fill
  colour), and Align/Wrap/Sort show carets that never open. Vivek's call: it's for
  display, not being shown off in the demo. Icons are now the real Figma exports.
- **Per-step code storage.** One shared `pythonConfig`/`sqlConfig` serves every code
  block, so switching cards discards an edit you typed but never ran.
- **Unrendered agentic components.** `ToolcallCard` is now used (via ReasoningBlock);
  `PlanStepsCard`, `NextActionChips` and `TypingIndicator` are still rendered nowhere —
  our own chips and typing indicator superseded them. Delete after the demo rather than
  wire them.
- **"N cols" vs "N rows"** — resolved: both preview pane headers now show both.

### Script divergences — the run-of-show is the spec

The On screen lane quotes the agent's wording; it isn't ours to paraphrase. Remaining:

- **S7 agent line** — script: *"I can join these — here's what I suggest."* Ours
  paraphrases at length.
- ✅ **`acct_st`** — added to `accounts` (values `A` / `AR` / `CH` / `P`) with a readiness
  finding naming it, so S16's narration matches the screen. Note `accounts` is a column
  wider than it was.
- ✅ **Data tab → "Spreadsheet"** — already renamed.
- ✅ **S6 caching** — built, as an in-thread form rather than a modal.

### Remaining demo gaps

- **Spreadsheet toolbar 6 → 19 icons.** All 12 missing icons are exported to `components/icons/SpreadsheetIcons.tsx`, just unwired. Alignment is a dropdown, wrap a toggle, currency/percent/decimals act directly on the selected column; overflow folds whole groups from the right. Open question: is `Style` a menu or a toggle? ⚠️ `align-right` exports identical to `align-left` — wrong variant in the Figma, flagged in the file header.
- **S6 caching hand-off.** Vivek's call: an agent chip ("Configure caching") opening the existing `cacheConfirm` modal, rather than building a toast system. `interactiveChips` already does this for Review/Run.
- ✅ **S1 starting screen** — Demo's home leads with the prompt, centred in the first
  screen with the cursor in it; Pulse and Recent kept but pulled up so their tops sit on
  screen; capability chips dropped. Deliberately no auto-typing on load.
- **`Open P1 Escalations` doesn't resolve** in the formula bar — no escalation-count column exists, so it reports "treated as 0". Either add the column or leave it as an honest gap that sets up the readiness beat.
- ✅ **S19/S20 payoff** — back in scope and built (153). Publishing offers "Test in Spotter",
  which opens the Spotter prototype inside Data Studio with our header, its menu collapsed
  and the published model selected; the renewal question returns a ranked answer.

### Surfaced 2026-07-31 — worth doing

- **The data browser tree still lists the old Pendo-era tables** (`dim_accounts`,
  `support_cases`, `pendo_nps_enriched`, …), not the renewal-risk set. The agent adds
  its tables directly, so the demo works — but if a presenter opens the browser, the
  tree and the story don't match.
- **Derive arrows are still curved and grey** while join lines are now orthogonal and
  blue, so the canvas has two edge idioms. Deliberately not touched — that renderer
  feeds the sentiment beat. Revisit after the demo.
- **Orthogonal routing has no obstacle avoidance.** Same-column joins are pushed apart
  so nothing crosses a card today, but the guarantee comes from the layout, not from the
  router. Real channel routing is a separate project.
- **`arrangeCanvas` has no undo.** Tidy up reflows every card and there's no way back.

### Demo robustness

- **Triggers are keyword-based.** The five Type-lane inputs all work and `demoStage` covers S2→S3 whatever the wording, but improvising elsewhere gets no response. Worth broadening the remaining branches before a stakeholder rehearses.

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

### Surfaced by the readiness merge — worth doing

- **The dock blocks the composer.** While a fixes dock is up you cannot type to the agent
  at all until Skip or Fix selected. That's Komal's workflow and was kept deliberately,
  but it reads differently now the flow lives in the main thread. A disabled-but-present
  composer may be better.
- **Her canned composer replies are dead code.** `cannedReply` / `sendPrompt` in
  `PocReadinessFlow` are unreachable now the composer routes to the normal agent. The
  `send` half of `PocReadinessHandle` is unused; `stop` is still live.
- **Her merge doc undercounts its own edits.** `MERGE_POC_AI_READINESS.md` §4 describes 2
  blocks in `ModelCanvas.tsx`; there are four plus a one-line change. The undocumented
  ones are `POC_SEM_REVIEW`, the semantic-preview bridge, and its consumer. A mechanical
  re-apply following only §4 would silently drop the semantic step.
- **`PILLARS` / `MODEL` / `severityRank` in `pocReadiness/data.ts` are unused.** Ported for
  completeness and updated to our scenario, but nothing reads them. Delete or wire.
- **Demo has no way to add a formula or column.** `columnsTab: false` plus the preview
  now being read-only means neither surface offers it. Consistent with the script (Maya
  writes her metric in the spreadsheet beat), but confirm during a rehearsal.

### Loose ends from 153

- **Dead code left on purpose.** `AgentForm`'s `time` / `checkbox` field types and its
  `link` / `sameRow` flags are unused since the caching form was cut back; `cannedReply` /
  `sendPrompt` in `PocReadinessFlow` are unreachable since the composer routes to the normal
  agent; `dismiss` in the cache context is no longer called by the chip. All small, all
  ready if the fuller versions come back. Strip if they start reading as clutter.
- **`SpotterXShell.tsx:180` still hardcodes "Royal Enfield".** Off the demo path, so left
  alone — but it's the last copy of the old persona.
- **`api/chat.ts` fails to resolve `@vercel/node`** during the Vercel build. Pre-existing,
  doesn't fail the build (Vite doesn't typecheck), but that serverless function may not run.
- **The chip and toast use literal hex**, matching surrounding canvas code rather than
  tokens. On the existing consolidation debt below.

### Surfaced by the Search data editor — worth knowing before a rehearsal

- ⚠️ **The editor's column checkboxes tick but change nothing.** `checkedCols` is read
  only to draw the tick; the chart and table come from the question's data regardless.
  Vivek's call to leave it (2026-08-03). The risk is on stage: untick a measure and the
  bars don't move. Wiring the table view (tick = column appears) is the cheap fix if it
  ever matters — the bar answers can't gain a real second measure.
- **Everything else in the editor is inert** and honestly so: Go, the ✕, undo/redo/reset,
  Find columns, + Add, the ⋯ menu, all ten rail icons, and the tokens themselves.
- **The ✕ and Go sit outside the input bar.** In the real product they look like they're
  inside it. Left out because pulling them in needs a second divider.

### Surfaced by the chat-first start — worth doing

- **Vision and POC still start the old way**, and Vivek's read is that Vision gets
  replaced by Demo over time rather than kept in step. So `chatFirstStart` is Demo-only
  on purpose — but if that replacement happens, this is the path that has to generalise,
  and Vision's agent is unscripted, so "renewal risk" produces no proposal card there.
  A non-scripted route to a table proposal is the prerequisite.
- **The draft model's name is hardcoded** to `Renewal risk` (`DEMO_DRAFT_MODEL_NAME` in
  `index.tsx`), chosen to match the model Spotter is handed at S19. `deriveModelName()`
  exists and would produce "Which of our accounts renewing" from her actual question,
  which is why it isn't used. Real naming is an open design question.
- **The data browser appears with the card**, so it isn't there for S1–S3. That happens
  to reinforce the script's own point — she isn't browsing the warehouse — but it wasn't
  designed, it fell out of the browser living inside the model card.
- **Nothing in the pre-model state offers a way out** except the left nav. There's no
  back affordance on the centred chat, and the agent-panel collapse is hidden (collapsing
  pre-model would leave an empty screen).

## Done (recent)

- ✅ **Chat-first start** — S1's empty home screen; her question opens the canvas with the
  chat centred and no model; accepting the first table proposal creates the model and the
  card grows in beside a thread that never moves. One flex row, nothing unmounts (154)
- ✅ **Model creation reads as work** — 4.4s, three passes over a filling bar, topbar
  visible throughout, tables revealed under the overlay; the agent awaits it before S4 (154)
- ✅ **S3 says what accepting does** — "Accepting these creates a new model, Renewal risk"
  and the button reads Create model until one exists (154)
- ✅ **Formula bar scrolls to its column** — the new column is appended off screen, so
  Enter used to look like nothing had happened (154)
- ✅ **Canvas no longer skews itself** — the growth-nudge took whichever axis needed the
  smaller push, which for neighbouring columns is the horizontal one, so a card gaining a
  row shunted its neighbour out of alignment. Vertical only now (154)
- ✅ **Tidy up centres the model** in the visible canvas instead of ordering it into the
  top-left corner (154)

- ✅ **Brand connector logos** — real Snowflake / Databricks / Salesforce / Postgres marks
  plus CSV and Python, on canvas cards, the browser tree and the S2 connection list, all
  reading one shared set (155)
- ✅ **Join type is drawn** — filled regions say which rows survive, same glyph in the
  proposal and on the canvas badge; it was four hues on one small circle with the words
  only in a tooltip. Moved into the connector stack, which gave the table names back the
  ~90px the labelled column was eating (155)
- ✅ **Cardinality is no longer amber on fan-out** — it read as low confidence, and
  confidence is the score's job. The caution survives on hover and in the reasoning (155)
- ✅ **Confidence badges read `96%`**, not `96% match` (155)
- ✅ **Search data editor wired to Spotter checks** — `EditAnswerModal` lifted out of
  AgentPanel and parameterised; Edit on a graded question opens it over that question's
  model, tokens, columns and answer. The old `onEdit` was a `console.log` TODO (155)
- ✅ **Out of scope on a graded answer** — third pill beside Looks right / Incorrect, and
  an icon-only toggle in the review list. The grade set is frozen when grading opens, so
  marking one mid-pass no longer shrinks the array under the index (155)
- ✅ **Table headers stop claiming edits that don't exist** — an all-review lit every
  mapped header whether or not that check proposed anything; the readiness flow's semantic
  pass only carries three, so three columns were highlighted with nothing to show (155)
- ✅ **Caching chip closes** — reverses 153's "go-to instead of close". The route back to a
  model is the model; making a notification carry navigation is what forced it to be
  permanent, and permanent is what read as stuck. No View action on the canvas (155)
- ✅ **Fix detail card has a gap above it** — a `-2px` top margin tucked it under a
  highlighted row, so the two tinted blocks ran together (155)
- ✅ **Opening prompt no longer replays** — any remount of the agent panel (collapse and
  reopen, or a hot reload) re-asked her S1 question on top of a live thread; it now fires
  only on an empty thread (154)
- ✅ **Table card freezes before the commit, not after** — with the commit now taking 4.4s
  that was a four-second window to accept twice (154)

- ✅ **Spotter stitched into Data Studio** — publishing offers "Test in Spotter"; Spotter
  opens inside our product with our header, collapsed menu and the published model
  pre-selected; a renewal-risk answer built to Spotter's own pattern (153)
- ✅ **One persona** — `persona.ts`; the canvas header no longer says "Royal Enfield", and
  the header, agent thread and readiness flow share one face (153)
- ✅ **Caching progress in the header** — filling ring, 5 tables over 8s, go-to icon back to
  the model; survives leaving the canvas; form cut to scope + refresh (153)
- ✅ **Publish hand-off** — persistent toast to Spotter; save indicator stays status
  instead of becoming a green pill beside the Publish button (153)
- ✅ **Agent chat autoscroll** — ResizeObserver on the content, so streaming blocks and the
  readiness flow pin the view too (153)
- ✅ **Back to model returns to the model** — the canvas stays mounted behind Spotter, and
  the whole logo area is one button. It had been a button nested inside GlobalHeader's own
  logo button, so the click bubbled to that one — whose default is `navigate('/')`, i.e.
  straight out to the Radiant Play registry. Watch for this in any header logo slot (153)
- ✅ **Cache chip right edge** — 8px padding with the trailing icon, 14px without; the canvas
  instance now carries the icon too, wired to bring the canvas view back (153)
- ✅ **Jira python card lands as the agent writes the script**, not on the Review click (153)
- ✅ **Preview is read-only**; **spreadsheet fills cell by cell**; **Tidy up is an icon**;
  properties panel closes on background click; form buttons a size up; "Mark out of scope" (153)

- ✅ **Komal's AI-readiness flow merged** — cherry-picked `7b65884` only, none of her other
  33 commits; gated on for Demo via `scope.readinessFlow`; runs as content in our agent
  thread with our header/PromptBar/disclaimer; copy rewritten to the renewal-risk scenario
  with S16's five named findings as spec (152)
- ✅ **Tidy up** — icon only, rightmost in the zoom group after 100% (it reads as a
  viewport action, not a layout one) (152)
- ✅ **Preview is read-only** — `fx` / Add column removed from the preview header (152)
- ✅ **Spreadsheet fills cell by cell** — real grid and headers stay mounted through the
  load, cells reveal on a diagonal; the fake 7×14 skeleton is gone (152)
- ✅ **Agent avatar unified** on the asset `_agentic/AgentMessage` uses (152)

- ✅ **Demo cut** — third variant with a typed `Scope` object; eleven behaviours picked
  from POC one by one; the run-of-show script gated to Demo so Vision is unscripted again (151)
- ✅ **Join graph rewritten** — one orthogonal line per join through the column gutter,
  per-join channels, staggered card exits, badge riding its own line, same-column joins
  pushed apart, layered auto-layout for agent joins + a Tidy up button (151)
- ✅ **ReasoningBlock wired** — Suraj's shimmer header, dot-pop and box animation replace
  the hand-rolled step list; fed all steps so upcoming ones show grey; step SQL becomes
  the tool call's input (151)
- ✅ **Caching moved into the thread** as an in-thread form; no modal, no context switch (151)
- ✅ **Jira beat corrected** — reviewing the script no longer advances the story or promises
  a join; running it proposes one; the join draws only on accept (151)
- ✅ **Connector marks** — shared `ConnectorIcons.tsx`; the agent's connection list drops
  initials-in-a-square fake logos and reuses the proposal card's stylesheet (151)
- ✅ **One primary Button** across every agent action; confidence keeps its tint on Radiant
  semantic pairs, minus the thumbs-up, plus a real Radiant tooltip (151)
- ✅ **Code blocks are always editors** — read-only mode and Edit buttons gone; Run keeps
  you in the code (151)
- ✅ **Preview** — row count / "Not run yet"; code row filters now apply at node level, which
  is what makes S11's 10 → 8 visible; formatting toolbar removed (151)
- ✅ **Spreadsheet empty state** is an empty sheet that fills the pane (151)
- ✅ **Publish modal** — Status, Sources and Cache derived from state; sources per connection (151)
- ✅ **`acct_st`** added with a readiness finding, so S16's narration matches the screen (151)
- ✅ **Persona** — Maya everywhere, including the header, which said "Vivek Sahi" (151)
- ✅ **Spotter mascot** replaces the gradient sparkle agent avatar (151)
- ✅ **Agent panel default width** 340 → 420 (151)
- ✅ **Formula columns** — `fx` badge instead of NEW, values and header in normal cell colour;
  formula highlighter no longer paints its own markup into the visible string (151)
- ✅ **Dead affordances removed** — "Table info" hover button, orphaned `SpreadsheetIcons`
  now wired instead, `TypewriterText` / `toggleCollapsible` after the renderer swap (151)

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
