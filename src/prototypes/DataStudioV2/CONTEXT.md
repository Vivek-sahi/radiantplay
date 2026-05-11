# Data Studio — Project Status
_Single source of truth for this prototype. Update at the end of every session._

---

## Product direction (current paradigm — read this first)

**Deeper shift: chat is the top-level container; model is an artifact created inside the conversation.**

This session significantly deepened the product paradigm beyond what was previously documented.

- **Chat is the top-level object.** The conversation is what the user is always in. Artifacts are things the agent creates *within* that conversation.
- **Artifacts are typed objects** with their own views and actions: a data model has Columns/Tables/Preview/Notebook views; a dashboard would have chart/code views. Views are artifact-specific, not hardcoded to the app.
- **Publish is an artifact property, not an exit gate.** Some artifacts support publish (models, dashboards); others don't (plans). Unpublished but built = draft state on the platform — tied to the originating conversation.
- **Test is a feature of the data model artifact** — same as "export as PDF" is a feature of a dashboard. Not a mode.
- **Multiple artifacts per conversation:** temporary (plan — ephemeral, not saved) vs permanent (model/dashboard — saved as draft or published). Users scroll chat to switch between artifact cards.
- **Entry:** from conversation (chat → artifact opens) OR from Models page (click draft → opens with chat context).

The page-level header says "← Chat" — that is the conversation header. The artifact panel is a self-contained skeleton below it, with its own identity row (name + state + Share + Publish) and tab bar (views left, feature actions right).

Artifact actions for a data model: Test, Live query, Quality issues, Data panel, Settings (tab bar right) + Share, Publish (identity row right).

Playground exploration `artifact-chat` shows the layout — see Phase 2 → explorations in the Playground nav.

Previous product direction notes (co-pilot paradigm) are still below for historical context.

---

**Previous paradigm (superseded):**

The product moved away from a side-panel co-pilot toward a full-screen agent-first experience — closer to Claude artifacts / Claude canvas.

- Entry: Overview prompt → full-screen chat → splits to agent (left) + canvas (right) when artifact ready
- Agent patterns: clarify → build → test → publish
- Journey picker removed; everything enters from Overview prompt bar
- "Projects" renamed to "Models"

---

## Next up

### Pass 3 — Small fixes (all known territory, do together)

1. **Gray gap between agent and artifact panel** — the 5px drag handle div in `Workspace.tsx` has no background; `AppShell`'s default `contentBackground: gray['10']` shows through it. Fix: add `backgroundColor: c['background-base']` to the drag handle div (`style={{ width: 5, flexShrink: 0, cursor: 'col-resize' }}`).

2. **PlanPanel font sizes too small** — section accordion labels (`fs.xs` → `fs.sm`), table/column description text (`fontSize: 11` → `fs.xs`, `fontSize: fs.xs` → `fs.sm`). Also col name span → `fs.sm`.

3. **Download button on plan artifact** — add a download icon button in the PlanPanel header, left of the close button. SVG: `<path d="M8 2v8"/><polyline points="5,7 8,10 11,7"/><path d="M3 13h10"/>`.

4. **Settings gear next to Test button** — in `Workspace.tsx` tab bar right section, add a `28×28` gear icon button immediately before the Test button. Model-level settings — decorative stub for now. SVG: circle cx=8 r=2.5 + 8 radial spokes.

---

### Pass 4 — Quality plan as artifact (medium, spec locked)

**Full spec (discussed and agreed 2026-05-11):**

5. **QualityPlanCard in chat** — replace the existing `reviewPlanCTA` "Review plan" button in `MessageBubble` with a `QualityPlanCard` component (same style as `PlanCard`): warning icon + "Data Quality Plan" title + "View plan →" + goal summary + stats row (`9 issues · 4 high · 4 medium · 1 low`). Below the card (outside it): "Apply fixes" button (calls `onConfirm`) + "Edit plan" ghost button (calls `onSuggestion('Edit the quality plan')`).

6. **QualityPlanPanel.tsx (new component)** — static right-side artifact panel. Identity row: warning icon + "Data Quality Plan" + "9 issues" badge + download button + close button. Sections (accordion, same pattern as PlanPanel): Goal (summary + severity chips), Null values (3), Duplicate rows (2), Date format mismatches (3), Anomalous values (1). Each issue row: `<code>col name</code>` + severity badge (right) + detail + `→ fix`. Footer: "Apply fixes" (primary blue) + "Edit plan" (ghost).

7. **Wire quality plan in Workspace.tsx**:
   - Replace `qualityModalOpen` state → `qualityPlanOpen`
   - Remove `QualityModal` import + render block
   - Import `QualityPlanPanel`
   - Add `qualityPlanOpen && <QualityPlanPanel .../>` in canvas column (replaces artifact card when open; artifact card shown when `!qualityPlanOpen`)
   - Add `handleQualityApplyFixes` → `setQualityPlanOpen(false)` + `setExternalAgentMessage('yes')`
   - Add `handleQualityEditPlan` → `setQualityPlanOpen(false)` + `setExternalInputInject('Edit the quality plan — ')`
   - Pass `onOpenQualityPlan={() => setQualityPlanOpen(true)}` to AgentPanel
   - Quality button in tab bar: `onClick={() => setQualityPlanOpen(true)}`

8. **Wire quality plan in AgentPanel.tsx**:
   - Add `onOpenQualityPlan?: () => void` to `AgentPanelProps` and destructuring
   - Add `onOpenQualityPlan?: () => void` to `MessageBubble` props
   - Pass `onOpenQualityPlan` through the message render loop to `MessageBubble`
   - Add `QualityPlanCard` component (see spec in item 5 above)

---

### Pass 5 — Deferred

9. **Plans as artifacts on the right side** — build plan and data quality fix plan are currently shown as panels/cards. Per the artifact paradigm, they should open on the right side panel (same treatment as model). This is a medium-sized change — needs exploration in Playground first before touching the live flow. Defer to its own session.

---

---

## Done — Remove gray backgrounds from artifact content area (2026-05-11, session 73)

- `CenterPanel.tsx`: outer wrapper, TablesView, NotebookCell header — all `background-sunken`/`background-subtle` → `background-base`. Full white throughout.
- Build: clean ✓

Session discussion: agreed Pass 3 (drag handle gap, font sizes, download, gear) and Pass 4 (quality plan as artifact — spec locked in Next Up above). Not implemented this session — context window limit hit.

---

## Done — Open-artifact arrow on model outcome card (2026-05-11, session 72)

- `OutcomeCard` title row: added `↗` arrow SVG in top-right corner — visual affordance signalling the card represents the artifact on the right panel. Applies to all outcome cards (build, add_tables, etc.). Decorative only; artifact opens by default.
- Build: clean ✓

---

## Done — Polish pass 1: 8 visual + bug fixes (2026-05-11, session 71)

- Canvas column, BuildingSkeleton, PlanPanel: changed `background-sunken` → `background-base` (white throughout, card border is the only separator)
- Slide-in animation (`ds-slide-in 0.2s ease-out`) on artifact card mount and PlanPanel open
- Publish button: removed 'Published' state — always `publishedVersion === 0 ? 'Publish model' : 'Update model'`
- Quality resolved condition: `buildStep === 'healthy'` → `prepTransforms && prepTransforms.length > 0` (correct: set by Apply fixes chip in `review_data_quality` script)
- Cached button: removed green (#F0FDF4 / #166534) — now neutral (background-subtle / content-secondary / border-default)
- CacheModal: removed "Caching is active" green banner from applied state in `CacheDiscoverability.tsx`
- Share/Publish identity row icons: replaced inline SVGs with `<Icon name="share" />` and `<Icon name="upload" color="#fff" />`
- Content wrapper in artifact card: added `display:flex, flexDirection:column` so CenterPanel `flex:1` fills full height — eliminates white dead space below table view
- Build: clean ✓

---

## Done — Artifact card border treatment + panel cleanup (2026-05-11, session 70)

**Visual treatment matching the Spotter artifact pattern (screenshot reference).**

- Canvas column: `background-sunken` with 8px padding; artifact is a white bordered card (`1px solid border-divider`, `border-radius: 10px`) — no page-level divider line, card border does the separation
- Drag handle: invisible 5px resize zone; visible line removed
- AgentPanel: always visible, no collapse; entire Build/Test tab bar + close button removed from AgentPanel header
- Identity row: Share gets share icon, Publish gets upload arrow icon; × close button added at far right (calls `onBack()` → returns to full-screen chat)
- Tab bar: agent reopen button removed; Settings moved out; right side = divider → [▶ Test label] [Live/Caching…/Cached] [9 issues/9 resolved]
- New columns sub-row (36px, columns tab only): dbt indicators left, search + properties popover + Settings gear right
- Column count display ("14 columns") removed
- LeftPanel overlay top: 144px base + 36px when columns sub-row visible
- CenterPanel `onInjectToAgent` and `onToggleColumn` callbacks no longer call `setAgentPanelOpen`
- Build: clean ✓

---

## Done — Workspace migration complete (2026-05-11, session 69)

**Completed the artifact layout migration in `Workspace.tsx` (Edits 2–4).**

- Edit 2: Artifact identity row (48px) added inside the canvas column — 4-quadrant model icon SVG + project name + Draft/v1 badge left; Share and Publish model/Update model buttons right. Same conditional as the tab bar (`buildStep !== 'empty' || !agentPanelOpen`).
- Edit 3: Canvas sub-header restructured — absolutely-centered segmented control removed; left-aligned underline tabs (Columns/Tables/Preview/Notebook, height 40, `marginBottom: -1` for active underline flush with divider). Right side: Test stub + Live query compact (db icon + Live/Caching…/Cached, `cacheStatus` state → `CacheModal`) + Quality issues compact (triangle icon + 9 issues/9 resolved based on `buildStep === 'healthy'` → `QualityModal`) + Settings stub. Columns-specific controls (dbt indicators, count, search, properties popover) remain columns-only to the left of action buttons with a conditional separator.
- Edit 4: LeftPanel overlay `top: 104` → `top: 136` (48 chat header + 48 identity row + 40 tab bar).
- All modals, state, AgentPanel, CenterPanel, BuildingSkeleton, drag handle — untouched.
- Build: clean ✓

---

## Done — Artifact paradigm + Workspace migration start (2026-05-11, session 68)

**Paradigm deepened: chat as top-level container, model as artifact within conversation.**

- CONTEXT.md: rewrote Product direction block to capture the new paradigm (artifacts, views, publish as artifact property, draft state, multiple artifacts per conversation, artifact panel skeleton).
- `Playground.tsx`: added `ArtifactChatExploration` (id: `artifact-chat`) in Phase 2 → explorations. Shows: page-level "← Chat" header, agent panel left, model artifact panel right with identity row (name + Draft badge + close) and tab bar (views left, actions right: Test/Live query/Quality issues/Data panel/Settings/Share/Publish). Includes static conversation with artifact card and columns list stub.
- `Workspace.tsx` (partial): Edit 1 applied — 64px main header replaced with 48px "← Chat" page-level header. Edits 2–4 deferred to next session (see Next up).
- Build: clean ✓

## Done — Layout + bug fixes (2026-05-11, session 67)

- `index.tsx`: Fixed Day Zero re-trigger bug — added `setIsDayZero(false)` in the `chat → workspace` transition effect so `AgentPanel` remounts in normal mode after the build completes. Root cause: `isDayZero` was never reset, causing `dayZeroPhase` to reinitialize to `'use_case_prompt'` on remount.
- `AgentPanel.tsx`: "Start building" button now adds a user bubble before the working steps animate in (same pattern as "Edit the plan").
- `Workspace.tsx`: Publish button text changed from "Publish" → "Publish model" (pre-publish) / "Update model" (post-publish).
- `index.tsx`: Default `activeTab` changed from `'columns'` → `'tables'` across all project states.
- `PlanPanel.tsx` + `ChatView.tsx` + `Workspace.tsx`: Plan panel now opens on the left, agent on the right (60/40 split) — then immediately reversed again below.
- **Agent moved to left:** Agent panel is now on the left, canvas on the right in Workspace. PlanPanel (in ChatView) also moves to the right when open, agent stays left. Drag handle direction fixed (`e.clientX - dragStartX` instead of reversed). "Data Agent" reopen button moved from right-side toolbar to left side. Gray card container added to PlanPanel (gray outer, white card, 40px header). Gray container removed from Workspace canvas.
- Build: clean ✓

## Done — Plan mode polish + working steps redesign (2026-05-11, session 66)

- `AgentPanel.tsx`: Fixed clarify card not disappearing — added `setDayZeroPhase('confirm_build')` as first line of `handleClarifyComplete` so card hides immediately on last answer. Moved "Start building →" and "Edit the plan" CTAs out of PlanPanel and into the chat message rendering below the plan card (only on latest version). "Edit the plan" now creates a user bubble before the agent responds. Added `handleStartBuilding` and `handleEditPlan` as top-level functions. Simplified `onOpenPlan` prop to `(plan: PlanData) => void`. Plan card title now shows model name + version badge (no "Build Plan" label). Stats row drops "questions" count — shows tables, relationships, columns only. Working steps redesigned: grey dots (opacity 40% done, 100% running), single-pixel grey connecting line, step labels always `content-primary` + semibold, SQL collapsible restyled as a full-width bordered card with document icon + rotating chevron, "Worked for X" duration footer added. "Show work" toggle updated to `content-secondary` grey with SVG chevron (no blue, no filled triangles). Removed `borderTop` divider above prompt bar.
- `PlanPanel.tsx`: Removed footer CTAs (panel is detail-view only). Removed redundant model name + stats block below header. Formulas split into a dedicated section separate from Columns. Sections: Goal → Tables → Relationships → Columns → Formulas → Sample questions.
- `ChatView.tsx`: Simplified — `onOpenPlan` is now `(plan: PlanData) => void`, no CTA callbacks needed.
- Build: clean ✓

## Done — Plan mode phase 1 (2026-05-11, session 65)

Built the plan card + panel flow that replaces the requirement summary card.

- `AgentPanel.tsx`: Added `PlanData`, `PlanTable`, `PlanRelationship`, `PlanColumn` types (exported). Added `planData` field to `AgentMessage`. Added `plan_ready` + `plan_editing` to `DayZeroPhase`. Added `onOpenPlan` prop. Added `planVersion` state. Added `day_zero_generate_plan` SCRIPT (3 steps, 1200ms delay). Added `MOCK_PLAN_BASE` constant (Campaign Performance: 3 tables, 2 joins, 16 columns incl. 2 formulas, 6 sample questions). Replaced old `handleClarifyComplete` — now fires `day_zero_generate_plan` → produces plan card message. Added `handlePlanCardClick` (creates `startBuilding` + `editPlan` closures, calls `onOpenPlan`). Added `plan_ready` + `plan_editing` cases to `handleDayZeroInput` — user typing in either phase triggers mock plan update + new version card. Added `PlanCard` inline component — collapsed card in chat with version badge, model name, goal preview, stats row. Plan messages render outside `MessageBubble` with plan card below intro text.
- `PlanPanel.tsx`: New component. Full detail panel: header (version badge, close button), model name + stats, 5 collapsible sections (Goal, Tables, Relationships, Columns grouped by table with type labels, Sample questions). Footer: disclaimer + "Start building →" (primary) + "Edit the plan" (secondary ghost).
- `ChatView.tsx`: Added `activePlan` + `planCTAs` state. `handleOpenPlan` stores plan + CTA callbacks. When plan is open: chat column narrows to 460px (left-pinned), `PlanPanel` renders to the right filling remaining space. "Start building →" closes panel + fires startBuilding callback. "Edit the plan" closes panel + fires editPlan (sets `plan_editing` phase, agent asks what to change).
- Build: clean ✓

## Done — ClarifyCard promoted (2026-05-11, session 64)

Replaced the old in-message clarify pattern with `DayClarifyCard` — a floating card above the prompt bar.

### What to build

The new ClarifyCard is a floating card that sits **above the prompt bar** (not inside chat message bubbles). It is the standard pattern for all clarifying questions going forward.

**Card anatomy** (reference: `ClarifyBarExploration` in `Playground.tsx`):
- Header: question text (large, semibold) + `‹ N of N ›` nav (no × button)
- Full-width numbered option rows with dividers; click a row → immediately advances
- "Something else" row with pencil icon → expands inline to text input + Submit + Skip
- Skip omits that question from compiled message; back `‹` lets user revisit
- Compiled message is a single user bubble: `Q\nA\n\nQ\nA` — skipped questions omitted, fires immediately on last answer

### Exact changes in `AgentPanel.tsx`

**1. Add `DayClarifyCard` component** — extract the card JSX from `ClarifyBarExploration` in `Playground.tsx` into a reusable component. Props: `questions: {question: string; options: string[]}[]`, `onComplete: (answers: Record<number, string|null>) => void`.

**2. Two trigger points** both add a message with `clarifyCard` field + set `dayZeroPhase('clarify_q1')` — lines ~1666 and ~1896. Change both to add the intro message **without** the `clarifyCard` field. Phase set stays the same.

**3. Replace `handleDayZeroInput` cases** — remove `clarify_q1` and `clarify_q2` cases. Add a `handleClarifyComplete(answers)` callback instead:
- Store `q1 = answers[0]`, `q2 = answers[1]` in `clarifyAnswers`
- Add compiled user message to `messages`
- Call `runDayZeroSteps('day_zero_understand_requirement', ...)` with the same outcome as the old `clarify_q2` case (requirement summary card + `confirm_build` phase)

**4. Render the card** — between messages scroll div and prompt bar div (~line 2405):
```tsx
{dayZeroPhase === 'clarify_q1' && (
  <DayClarifyCard questions={DAY_ZERO_QUESTIONS} onComplete={handleClarifyComplete} />
)}
```

**5. Remove old in-message ClarifyCard** — delete `{msg.clarifyCard && <ClarifyCard ... />}` block (~line 3088) and the old `ClarifyCard` component (~line 2851).

**6. Clean up** — remove `clarify_q2` from `DayZeroPhase` union type (~line 1307); the card handles both steps internally under `clarify_q1`.

### Build/Test tabs
Leave untouched — separate task.

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
- **2026-05-06** — Working branch is `prototype/data-studio` of `origin` (vivek-sahi fork). `main` on the fork is an unrelated sync of Faris's upstream — never use it for DataStudio. Komal works on her own branch and merges into `prototype/data-studio`. Never push to `upstream` (mohammed-faris). (The session-53 "main" decision was wrong and has been corrected.)
- **2026-04-30** — `formula` embedded inside `columns[]`, not a separate array. ThoughtSpot formulas are derived columns.

---

## Demo arc — 4 journeys (new framing, 2026-05-06)

Replaces the original 6-situation arc as the primary demo structure.

| # | Journey | Status | Overview entry state |
|---|---------|--------|----------------------|
| 1 | **Get started** — Day Zero, warehouse to first model | Done | Empty state (DayZeroOverview) |
| 2 | **Monitor & optimize** — Day N, improve existing models | Teammate building | Existing Overview (10–20 models + alerts) |
| 3 | **Debug issues** | Later | Same as Journey 2 |
| 4 | **dbt plug-and-play** | Done | Data Browser → External Models |

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

### 2026-05-11 (session 64)

**ClarifyCard promoted to main prototype.**

- `AgentPanel.tsx`: removed old in-message `ClarifyCard` component and `clarifyCard` field from `AgentMessage`. Removed `clarify_q2` from `DayZeroPhase` union. Removed `clarifyAnswers` state.
- Added `DAY_ZERO_QUESTIONS` constant and `DayClarifyCard` component at module level — extracted from `ClarifyBarExploration` in Playground. Props: `questions`, `onComplete`.
- Added `handleClarifyComplete(answers)` — builds compiled user message, fires `day_zero_understand_requirement` script, sets `confirm_build` phase.
- Both trigger points (useEffect + `use_case_prompt` case) now add intro message without `clarifyCard` field.
- Card renders above the prompt bar when `dayZeroPhase === 'clarify_q1'`; prompt bar disabled during clarify phase.
- Fix: card now closes instantly on last answer — `setDayZeroPhase('confirm_build')` fires at top of `handleClarifyComplete` before async work.
- Fix: compiled user bubble now renders with `whiteSpace: 'pre-wrap'` so `Q\nA\n\nQ\nA` displays as proper line breaks.
- Build: clean ✓

---

### 2026-05-11 (session 63)

**ClarifyCard design iteration — Playground exploration.**

- Designed new clarifying questions pattern: floating card above the prompt bar (not in chat bubbles). Full-width numbered rows, click-to-advance, back/forward nav (`‹ 1 of 2 ›`), "Something else" expands inline, Skip omits from compiled message.
- `Playground.tsx`: `ClarifyBarExploration` fully rebuilt to match sketch. Added to `PlaygroundNav` as "Clarify bar" card under "Phase 2 — explorations" section (NavId `clarify-bar`).
- Prompt bar always visible below card, greyed out while clarify is active, no placeholder text.
- Full promotion spec written to CONTEXT.md Next up.
- Build: clean ✓

---

### 2026-05-11 (session 62)

**Full-screen agent polish + ClarifyBar Playground exploration.**

- `index.tsx`: `ChatView` moved inside `<Shell>` with `hideSidebar={view === 'chat'}` — full-screen agent mode now shows top header only, no left sidebar. Sidebar stays on all other views.
- `ChatView.tsx`: "← Overview" back button removed (top nav handles navigation). Inner wrapper changed from flex column to flex row so `align-items: stretch` pulls AgentPanel to full height — prompt bar now correctly pinned at bottom.
- `AgentPanel.tsx`: disclaimer text changed "Agent responses" → "Spotter responses should be reviewed."
- `Playground.tsx`: `ClarifyBarExploration` component added. Tab toggle ("Workspace" / "Clarify bar") in sub-header. ClarifyBar shows questions above prompt bar (not in chat bubbles); chips auto-advance on select (300ms highlight); custom input per question; on last answer a compiled single user message appears ("Q\nA\n\nQ\nA" format); prompt bar activates after completion. Workspace panel toggles hidden in clarify mode.
- Build: clean ✓

---

### 2026-05-11 (session 61)

**Context cleanup + entry point unification.**

- CLAUDE.md session protocol fixed: "always work on `main`" → `prototype/data-studio` (was causing branch confusion every session).
- CONTEXT.md: added Product direction block at top (co-pilot → full-screen agent shift, Claude artifacts analogy). Note added that `/research/` and `/knowledge/` docs predate this shift.
- "New model" button (Overview + ModelsPage) now routes through `handleOverviewPromptSubmit` → ChatView (full-screen agent), not old `handlePromptSubmit` → Workspace. `NewProjectPrompt` stays as the focused prompt screen; its submit now enters the full-screen agent flow.
- Build: clean ✓

---

### 2026-05-11 (session 60)

**Product direction shift — co-pilot → full-screen agent.**

- Journey picker removed. App opens directly on Overview.
- `ChatView.tsx` added — full-screen centered agent panel (860px wide). Entry: Overview prompt submit → `handleOverviewPromptSubmit` → `isDayZero=true`, `isAgentMode=true` → navigates to `'chat'` view.
- Auto-transition: `chat` → `workspace` when `buildStep` leaves `'empty'` (artifact ready). If no artifact, stays full-screen.
- `isAgentMode` flag passed to Workspace — agent panel starts at 40% width when entering from prompt.
- "Projects" renamed to "Models" throughout (nav, headings, buttons).
- Monitoring and governance tabs removed from nav. Nav is now: Overview / Models / Data / Connections.
- `ModelsPage.tsx` populated — renders `OVERVIEW_PROJECTS` in a table.
- Research docs in `/research/` predate this shift — treat as historical.
- Build: assumed clean (not verified this session).

---

### 2026-05-06 (session 59)

**Journey 4 — three follow-up fixes after session-58 demo review.**

- Empty state: rebuilt as full "Start with an existing model" section matching DayZeroOverview exactly — section label + both cards (dbt models, Semantic views) using `ExternalModelOptionCard` pattern. Semantic views card is a stub.
- Wizard height: `minHeight: 280` → `height: 320px; overflowY: auto` — modal is now fixed height across all steps.
- Publish: removed canvas navigation. `InlinePublishModal` now renders directly in `DataBrowserPage` state; confirming publish closes wizard and sets `dbtImported`.
- Branch confusion resolved: `prototype/data-studio` confirmed as correct working branch. CLAUDE.md, CONTEXT.md, and session-start memory all updated.
- Build: clean ✓

---

### 2026-05-06 (session 58)

**Journey 4 — all 8 session-57 demo issues fixed.**

- Fix 1: `ExternalModelsEmptyState` rebuilt as a single row card (dbt logo + "dbt models" + description + chevron) matching `ExistingModelCard` pattern from `DayZeroOverview.tsx`. Old centered logo + value-prop grid removed.
- Fix 2: Step 4 model names — `<code ff.mono>` → `<span ff.primary>`.
- Fix 3: Step 4 grid — `'2fr 1.4fr auto'` → `'2fr 1.4fr 160px'`; "Issues" header now aligns with button cells.
- Fix 4: Publish button wired — `onPublishModel` calls `openDbtCanvas` (same as Review issues); canvas has `DbtPublishModal` accessible from toolbar.
- Fix 5: Story sync — 2 projects (analytics ✓, finance ✗); 3 models (fct_revenue, dim_customers, dim_campaigns); `IMPORTED_DBT_ENTRIES` constant in `DataBrowserPage.tsx` — filled state shows these 3 instead of full catalog.
- Fix 6: Filter pills — counts removed. "All", "dbt models", "Semantic views".
- Fix 7: Wizard modal height — `minHeight: 280px` wrapper on every step's content; modal no longer resizes between steps.
- Fix 8: `dbtIssueCount` in `Workspace.tsx` now checks `columnOverrides` first; count drops after a column is fixed by the agent.
- Also fixed: branch docs — `prototype/data-studio` is the correct working branch (not `main`). Updated CLAUDE.md, CONTEXT.md, and session-start memory.
- Build: clean ✓

---

### 2026-05-06 (session 57)

**Journey 4 — 8 fix-pass items from session 56 review. All resolved.**

- Fix 1: `DbtOverview.tsx` replaced — External Models empty state now lives inside `DataBrowserPage` (new `ExternalModelsEmptyState` component). DataBrowserPage gains props: `initialTab`, `dbtImported`, `onImportDbt`, `onReviewIssues`. `DbtImportWizard` is hosted inside DataBrowserPage.
- Fix 2: `DbtImportWizard.tsx` fully rewritten to use design system `WizardModal`. Controlled mode (`currentStep` + `onStepChange`) enables Step 2 auto-advance.
- Fix 3: Step 3 CTA simplified to "Import" (model count removed).
- Fix 4: Step 4 summary chips removed. Both "Review issues" and "Publish" always shown per row.
- Fix 5: `isDbtReview` prop threaded `index.tsx` → `Workspace` → `AgentPanel`. Welcome card shown on canvas open: "I've opened [model] in ThoughtSpot…" with "Enrich for AI" + "Fix translation issues" chips.
- Fix 6: `openDbtCanvas` `includedColumns` updated to include `campaign_roas`, `days_to_convert`, `user_segment_fill` — these have `syncStatus: 'broken'/'degraded'` in mockData so warning icons now appear.
- Fix 7: "Fix translation issues" chip routes to `fix_campaign_roas` script in `processText`.
- Fix 8: `projectSource: 'dbt'` correctly preserved in `openDbtCanvas`; `DbtPublishModal` now opens reliably. Root cause was that broken column routes and isDbtReview flow weren't wired — publish itself was always correct.
- `index.tsx`: removed `dbt-overview` + `dbt-external-models` views. Journey 4 now routes to `data-browser` with `initialTab='external-models'` and `dbtImported=false`. Nav → Data resets to `'warehouses'`.
- Build: clean ✓

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
