# SpotterPrep2 — Master Task List

_Created 2026-05-26. Add tasks here. Move to NEXT.md when ready to build. Do things one at a time._

Status: `[ ]` open · `[→]` in next up · `[x]` done

---

## Open questions — answer before building

These block specific tasks. Flag when building and wait for decision.

| # | Question | Blocks |
|---|---|---|
| OQ-1 | When the user opens a QualitySession on a model that is already cached and scanned, does the session open with the scan results already shown (agent greets with "Found 9 issues...") or does it open with a blank greeting + "Scan for issues" chip? PRD says scan is auto-triggered. NEXT.md from session 5 says no auto-start. Need a decision. | T-03, T-08, T-09 |
| OQ-2 | When the user opens the Quality tab for the first time on a cached model — do they see a column profile (null rates, issue count per column) or just a grade + CTA? PRD says Quality tab shows "grade, all issues unresolved, empty rules chain" after scan. | — |
| OQ-3 | What exactly happens when the user clicks Save in QualitySession? PRD says a new model entity M1' is created. Does the user see a confirmation step, a naming dialog, or does it happen silently? What happens to the original model's quality state? | T-16 |
| OQ-4 | Mode selection (Interactive / Batch / Autonomous) — is this a user choice or agent-decided based on issue count? PRD says agent decides. Current prototype has a manual switcher (prototype chrome). For the story, what mode should be the primary scenario? | T-08, T-09, T-10 |
| OQ-5 | The data table in QualitySession — on first open (before any scan in-session), should it be dimmed with a "Run a scan" overlay, or already showing issue highlights (since the Quality tab scan already ran before the user entered)? | T-11 |

---

## A — Agent UX: adopt Data Studio patterns

These are the highest-priority tasks. SpotterPrep2 currently has none of the established agent design patterns from DataStudioV2.

### T-01: Replace ✦ with AgentAvatar
`[ ]` Copy the exact `AgentAvatar` SVG from `DataStudioV2/components/AgentPanel.tsx` (lines 4030–4047).
Blue gradient circle (`#2770ef` → `#5b9ef4`), sparkle path rotates when `working=true`, circle pulses with `ag-pulse`.
Add `ag-spin` and `ag-pulse` keyframes to the CSS block.
Replace every `✦` usage in QualitySession.tsx.

### T-02: Replace individual tool-call pills with working step block
`[ ]` The current design renders each tool call as a separate pill in the chat. Replace with a **single `working` message** following the DataStudio pattern:
- One working message per agent turn
- `steps` array with `label`, `detail`, `status: pending | running | done`
- Steps reveal one by one (800ms each) with dot + connector line structure
- When all done → auto-collapses to "Show work ▾" toggle
- `AgentAvatar` pulsates while steps are running
- Step labels use the actual profiler/transformer IDs from the PRD:
  - Profiling: `P01_NULL_RATE`, `P02_DUPLICATE_PK`, `P07_IMPOSSIBLE_SEQUENCE`, `P11_OUTLIER_STATISTICAL`, `P12_FLOAT_PRECISION`, `P13_ORPHANED_FK`
  - Applying: `T01_DEDUPLICATE_PK`, `T05_STANDARDIZE_FORMAT`, `T06_CAP_RANGE`, `T07_SET_ZERO_FLOOR`, `T08_IMPUTE_MEDIAN`, `T10_FLAG_ONLY`
  - Final step: `✦ Confidence map built · 9 issues · 6 high · 2 medium · 1 low`

### T-03: Add opening greeting state (no auto-start scan)
`[ ]` Session mount should NOT auto-start the scan (remove lines 751–756 in current QualitySession.tsx).
Session opens with a `response` message immediately:
```
"hr-analytics is cached as of 2 hours ago. I found 9 quality issues on last scan."
interactiveChips: [{ label: 'Review issues', value: 'review' }]
```
_OR_ (if OQ-1 resolves to no-prior-scan):
```
"hr-analytics is cached as of 2 hours ago. I haven't run a quality scan yet."
interactiveChips: [{ label: 'Scan for issues', value: 'scan' }]
```
_Decision on OQ-1 determines exact wording._

### T-04: Replace in-chat clarification with ClarifyCard above prompt bar
`[ ]` Current: clarification questions are rendered as `clarification-medium` and `clarification-low` message types inside the chat stream, with inline buttons.
Replace with a `ClarifyCard` component that:
- Floats in the space between the last message and the prompt bar (position: sticky bottom of the scroll container, above the input)
- Disables the prompt bar textarea while visible
- Shows one question at a time with 2–3 option buttons
- On answer: user bubble appears in chat, card advances to next question
- Matches DataStudio's `DayClarifyCard` structure (see AgentPanel.tsx lines 3545+)

### T-05: Add "Apply fixes" button on the proposal response message
`[ ]` After the working block (scan) collapses, the `response` message with the tiered summary should include:
- The scan summary text (High/Medium/Low tiers)
- A **primary action button** "Apply 6 high-confidence fixes" (or "Apply fix" for interactive mode)
- This is the `pendingAction` pattern from DataStudio — the button triggers the next working block
- Do NOT just use chips for this — it needs to be a prominent button

### T-06: Add OutcomeCard at session completion
`[ ]` After all issues resolved, the final `response` message includes an `outcomeCard`:
```
{
  title: 'hr-analytics',
  chips: ['3 tables', '22 columns', '9 fixes applied', '47 → 91'],
  note: 'Save to lock the rules chain. Rules re-run on every cache refresh.'
}
```
Matches DataStudio's `OutcomeCard` component structure.
Save button in top bar activates at this point.

### T-07: Add TypewriterText to step detail and execution lines
`[ ]` DataStudio uses `TypewriterText` for:
- Step `detail` text while `status === 'running'`
- Execution message lines
Copy the `TypewriterText` component from DataStudioV2 or reimplement it (char-by-char with a speed of ~20ms/char).

---

## B — Per-mode scripts

Each of the 3 modes needs a full, correctly-structured script using the DataStudio message types (working → response → clarify → execution → outcomeCard). All 3 share the same components, just different step content and flow logic.

### T-08: Interactive mode script
`[ ]` < 10 issues · one at a time
Flow:
1. Opening greeting (T-03)
2. User clicks "Scan for issues" → working block with P01–P13 steps → collapses
3. Response: "Found 3 issues. Let me walk through them one by one." + "Start reviewing" button
4. **Issue 1:** response message showing issue, fix, reasoning + "Apply fix" / "Skip" buttons
5. Working block: applying fix + recalculating score (T02 steps)
6. Execution: "Fixed. 847 rows updated. Score: 47 → 55." → next issue chip
7. **Issue 2 + 3**: same pattern
8. Outcome card

### T-09: Batch mode script (primary scenario)
`[ ]` 10–50 issues · tier by tier  
Flow:
1. Opening greeting (T-03)
2. User clicks "Scan for issues" → working block with all P01-P13 IDs → collapses
3. Response: tiered summary (High 6 / Medium 2 / Low 1) + "Apply all 6 high-confidence fixes" button (pendingAction)
4. Working block: T01–T10 applying each fix, `T-Recalculate score` → collapses
5. Execution: "6 fixes applied. Score: 47 → 72."
6. ClarifyCard (above prompt bar) for Medium issue 1: email nulls
7. After answer → user bubble → ClarifyCard for Medium issue 2: impossible sequence
8. After answer → working block: applying medium fixes → execution
9. ClarifyCard for Low issue: outlier salary values
10. After answer → working block: recalculate → execution: "All 9 issues resolved."
11. Outcome card + Save activates

### T-10: Autonomous mode script
`[ ]` > 50 issues · background run
Flow:
1. Opening greeting (T-03)
2. User clicks "Scan for issues" → working block (fast, many steps) → collapses
3. Response: "Found 53 issues. This will take a few minutes. Running autonomously." + "Run in background" button (or auto-proceeds)
4. Working block: many T- steps animate quickly (150ms each) → collapses
5. Response: "50 of 53 issues resolved. 1 blocker needs your call." + score update
6. ClarifyCard for the single blocker (salary outliers)
7. After answer → execution → outcome card

---

## C — Data table UX

### T-11: Pre-scan data table overlay
`[ ]` Before scan runs (opening state), show the data table dimmed with a centered overlay:
```
Icon + "Run a scan to see quality issues"
```
Table cells are visible but muted (opacity: 0.3 or blur). Overlay disappears when scan starts.
Depends on OQ-1/OQ-5 resolution.

### T-12: Table header shows active table name
`[ ]` Currently hardcoded "employees". Scan working block uses "employees", "payroll", "performance_reviews" — table switcher or breadcrumb should reflect which table is active in the data view.

---

## D — Listing page

### T-13: Replace quality score grade badge with cache indicator
`[ ]` PRD says no quality score badge on listing page in Phase 1.
Current: shows A/B/C/D/F grade badges per model row.
Change to: a simple cache indicator (dot or tag) — "Cached" vs nothing. The current green dot is a start. Decide on exact visual (pill saying "Cached" vs a dot vs a timestamp).
No quality grade on the list — that lives on the Quality tab only.

### T-14: Remove "Check Quality" / entry point CTAs from listing
`[ ]` Per user clarification: entry to QualitySession is from the Quality tab only, not from the model list. No quality action buttons on the list rows.

---

## E — Save flow / M1' output

### T-15: Save → creates new model entity
`[ ]` Currently: clicking Save returns user to Quality tab with updated score. PRD says a new model M1' is created as a new entity in the workspace.
Questions to answer first (OQ-3):
- Does user see a naming/confirmation step?
- What happens to the original model?
- What does the returned state look like?
Once OQ-3 is resolved, build the save flow accordingly. Minimum: after Save, show a brief message in the quality session ("Rules chain saved. A new model `hr-analytics_clean` will be ready after next cache refresh.") then return to model detail.

---

## F — Version history / undo

### T-16: Per-fix undo in session (n-1 rollback concept)
`[ ]` PRD says the rules chain supports rollback. In the session, the user should be able to undo individual applied fixes.
DataStudio has a restore point / version history pattern — look at the `RestorePointCard` genUI in AgentPanel.tsx.
For the prototype: add an undo indicator or "Revert last fix" option after each fix is applied. Scope TBD after OQ discussion.

---

## G — Known bugs / quick fixes

### T-17: CachingTab.tsx is unused in navigation
`[ ]` ModelDetail has a Caching tab but CachingTab.tsx content may not be wired up correctly for all scenarios. Verify it renders and that the "Set up caching" flow in Scenario 1 works end-to-end.

### T-18: Scenario 3 (WIP) and 4 (Saved) states in QualityTab
`[ ]` Scenarios 3 and 4 need to show a rules chain summary in the Quality tab (not just a grade). Verify these states render correctly and show something meaningful.

---

## Build order (suggested)

When ready to build, do in this order:
1. T-01 (avatar) — 20 min, zero risk, establishes the right visual tone
2. T-02 (working block) — 2–3 hours, structural change to QualitySession
3. T-07 (typewriter) — 30 min, depends on T-02
4. T-03 (opening state) — 1 hour, depends on OQ-1 answer
5. T-05 (apply button) — 30 min, depends on T-02
6. T-09 (batch script) — 2 hours, primary scenario, depends on T-02–T-05
7. T-04 (ClarifyCard) — 1 hour, needed for batch script
8. T-06 (outcome card) — 30 min
9. T-08 + T-10 (other mode scripts) — after batch works
10. T-13, T-14 (listing page) — independent, can do anytime
11. T-11 (table overlay) — after OQ-5 resolved
12. T-15 (save flow) — after OQ-3 resolved
