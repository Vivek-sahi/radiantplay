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

---

### ~~1. Review artifact UI in Pulse debug flows~~ — Done (session 105)

### ~~1b. Wire onOpenObject on 4 remaining debug cards (ins-d1/d2/d3/d6)~~ — Done (session 106)

### ~~1c. Wire blast radius flow for ins-d2; update ins-d3 to MultiModelDriftCard~~ — Done (session 108)

### ~~3. Add Preview/Code tabs to PlanPanel~~ — Done (session 109)

---

### 2026-05-13 (session 110)

**Working steps fix — day_zero_parse_use_case.**

- Removed `'Identifying relevant metrics and dimensions…'` from the `day_zero_parse_use_case` steps array in `AgentPanel.tsx`. The step was inaccurate — the agent hasn't received enough context at that point to know what to look for.
- Working steps now: `Parsing your use case…` → `Preparing clarifying questions…`
- Committed and deployed to Vercel (https://radiantplay-nine.vercel.app).
- Build: clean ✓

---

**Context — what was done (session 103):**
- Object panel now opens as an artifact on the RIGHT of the agent (was incorrectly opening on the left, pushing agent right)
- AgentPanel is a single instance — wrapper div resizes on split, no remount/state reset on object open
- Artifact card treatment: `background-base` outer column, `border: 1px solid border-divider` + `borderRadius: 10` card, 48px identity row — matches Workspace artifact styling
- Draggable agent width (same Workspace mechanics): drag handle between agent and artifact, default 40% screen width on open, min 320px
- Context panel is fully independent of artifact: toggle always visible in header, opening artifact does not force context open/closed
- Referenced objects accumulate in context panel Models list as objects are clicked — persists across the conversation, deduped with flow's pre-seeded models

**What still needs review:**
- The artifact content (ObjectPanel column table, LiveboardObjectView) — compare to how artifacts look in the build flow and decide if any further visual polish is needed
- Once artifact review is done, wire the 4 remaining debug cards (ins-d1, ins-d2, ins-d3, ins-d6) — see original spec below

**Original wiring spec (ins-d1/d2/d3/d6) — still valid:**
Add `onOpenObject` prop to `ConnectionStatusCard`, `SchemaDriftResolutionCard`, `MultiModelDriftCard`, `NullRateCard` in `AgentPanel.tsx`. Komal's `AgentPanel.tsx` (`/Users/vivek.sahi/Downloads/DataStudioV2 3 komal/components/AgentPanel.tsx`) has the complete implementation. Key wiring per card:
- `ConnectionStatusCard`: blocked model names (Sales Analytics, Sales Performance, Revenue Forecast) → `onOpenObject?.(m)`
- `SchemaDriftResolutionCard`: "FnOps Cost Model" header → `onOpenObject?.('FnOps Cost Model', 'cost_center')`; expanded dependent/liveboard names → `onOpenObject?.(name)`
- `MultiModelDriftCard`: model name cards → `onOpenObject?.(model.name, model.columns[0])`; dependent names → `onOpenObject?.(d.name, d.ref)`
- `NullRateCard`: "Marketing Campaign Attribution" → `onOpenObject?.('Marketing Campaign Attribution', 'campaign_id')`

All `OBJECT_DATA` entries are already in `FullChatView.tsx`. The `onOpenObject` prop is already threaded from `AgentPanel` → `MessageBubble` → card render sites.

---

### (old) Fix object-click panel for all 6 wired Pulse flows — superseded by item 1 above

**Context — what was decided (session 102):**
- Debugging is not editing. Clicking an object name in a Pulse flow should open a **read-only contextual view** alongside the chat, not the full Workspace edit artifact.
- `FullChatView` now has a split layout: object panel slides in from the left (flex 1), agent narrows to 420px on the right. Context panel hides while split. This was merged from Komal's `FullChatView.tsx` in session 102 — `ObjectPanel` (models/dependents: columns + broken/null status) and `LiveboardObjectView` (real `LiveboardHeader` + `AnswerTile` grid with broken tile overlays) are live.

**Current state — which flows open objects on click:**
- ✅ **ins-o3** (Semantic gaps) — "Marketing Campaign Attribution" + column names open `ObjectPanel`
- ✅ **ins-o4** (Cache miss) — "Sales Performance" opens `ObjectPanel`
- ❌ **ins-d1** (dbt connection) — model names are plain `<span>` chips, not clickable at all
- ❌ **ins-d2** (Schema drift single) — accordion items ("Finance Operations Dashboard", "Q4 Cost Analysis" etc.) render as blue `<button>` elements with hover-underline but **zero `onClick`** — look clickable, do nothing; "FnOps Cost Model" in header is plain `<span>`
- ❌ **ins-d3** (Schema drift multi) — model/dependent names are plain `<span>` chips, not clickable
- ❌ **ins-d6** (Null rate) — "Marketing Campaign Attribution" in header is plain `<span>`, not clickable

**What needs to happen:**
Add `onOpenObject` prop to all 4 debugging cards (`ConnectionStatusCard`, `SchemaDriftResolutionCard`, `MultiModelDriftCard`, `NullRateCard`) and wire object names to call it. Komal's `AgentPanel.tsx` (`/Users/vivek.sahi/Downloads/DataStudioV2 3 komal/components/AgentPanel.tsx`) has the complete implementation for all 4 cards — use as the source. Key wiring per card:
- `ConnectionStatusCard`: blocked model names (Sales Analytics, Sales Performance, Revenue Forecast) → `onOpenObject?.(m)`
- `SchemaDriftResolutionCard`: "FnOps Cost Model" header → `onOpenObject?.('FnOps Cost Model', 'cost_center')`; expanded dependent/liveboard names → `onOpenObject?.(name, group.highlightCol)`
- `MultiModelDriftCard`: model name cards → `onOpenObject?.(model.name, model.columns[0])`; dependent names → `onOpenObject?.(d.name, d.ref)`
- `NullRateCard`: "Marketing Campaign Attribution" → `onOpenObject?.('Marketing Campaign Attribution', 'campaign_id')`

All the `OBJECT_DATA` these names resolve to is already in `FullChatView.tsx` (merged session 102). The `onOpenObject` prop is already threaded from `AgentPanel` → `MessageBubble` → card render sites for the 4 debugging cards — just need to add it to each card's props and wire the calls.

**Also: verify ins-o3 and ins-o4 object opens correctly end-to-end** — the panel opens but confirm the right columns are highlighted and the agent note makes sense in context.

**Not wired (lower priority — no SCRIPT, open chat only):**
- ins-d4, ins-d5 — debugging flows with no dedicated SCRIPT
- ins-o1 (slow query), ins-o2 (unused columns), ins-o5 (low adoption) — optimization flows with no SCRIPT

---

### 2. Discuss with Vivek — next direction TBD

**What we discussed:** The DQ chip "Fix all with agent" and AIRS "Generate →" / "Add →" buttons are currently unresponsive. Two options discussed:
- **Option B (preferred):** Make the chip "Fix all with agent" the single entry point for DQ fixes — clicking it sends a message to the agent that triggers `review_data_quality`. Remove the suggestion chip approach. Mirror same pattern for AIRS with a new `improve_ai_readiness` script.

**Why deferred:** Not blocking the demo arc. The existing suggestion chip already triggers the DQ flow. Cover other workflows first.

---

### 5. Team review + iterate on feedback

Any remaining visual or copy feedback from the team after reviewing the updated prototype.

---

### 2026-05-12 (session 104)

**Context panel / artifact independence fix — all three views.**

- **Root cause 1 (Workspace):** `contextPanelOpen` was initialised to `!!instructionsCreated`, so both artifact canvas and context panel opened simultaneously on Workspace entry. Fixed: changed to `useState(false)` — context panel starts closed, user opens it independently with the toggle.
- **Root cause 2 (FullChatView):** `contextPanelOpen` starts as `true`. When an object was opened, the ObjectPanel AND context panel were both visible in the right area simultaneously, looking like they opened together. Fixed: `handleOpenObject` now calls `setContextPanelOpen(false)`; `handleCloseObject` calls `setContextPanelOpen(true)`. Object panel and context panel are now mutually exclusive.
- **ChatView (earlier fix this session):** removed the `useEffect` that auto-closed context panel when `isPlanOpen` became true, and removed `setContextPanelOpen(true)` from all three artifact close handlers. Panel and artifact are independent.
- **Workspace artifact close handlers:** `InstructionsPanel`, `PlanPanel`, `QualityPlanPanel` close buttons no longer call `setCanvasVisible(false)` — they just close their own panel, falling through to show the model artifact card. Only the model artifact card's × closes the canvas entirely.
- Committed and deployed to Vercel (https://radiantplay-nine.vercel.app) via `vercel --prod`.
- Build: clean ✓

---

### 2026-05-12 (session 103)

**Pulse debug flow — artifact layout overhaul in FullChatView.**

- **Object panel moved to right:** artifact now opens on the right of the agent (was left, pushing agent right). Fixed by reordering flex children in `FullChatView.tsx`.
- **Single AgentPanel instance:** removed the split ternary that was mounting two separate `<AgentPanel>` instances. Agent is now a single instance in a wrapper div that changes size — no remount, no state/conversation reset when artifact opens.
- **Artifact card treatment:** outer wrapper uses `background-base` + `padding: 8px 8px 8px 0` (matches Workspace canvas column). Inner card: `border: 1px solid border-divider`, `borderRadius: 10`, `background-base`. ObjectPanel identity row: 48px, `border-divider` token, `content-primary` name — matches Workspace artifact identity row.
- **Draggable agent width:** agent width state + drag handle (5px) between agent and artifact. Default on artifact open: 40% of window width. Min 320px. Same `useEffect` + `mouseMove/mouseUp` pattern as Workspace.
- **Independent context panel:** toggle button always visible in header (was hidden in split mode). Context panel driven only by `contextPanelOpen` toggle — artifact state does not force it open or closed.
- **Referenced objects log:** `referencedObjects` state accumulates object names as they're clicked. `allModels` = deduped union of flow's pre-seeded models + referenced objects. Context panel shows this live list when open.
- Build: clean ✓

---

### 2026-05-12 (session 102)

**Pulse flow review — object-click paradigm decision + FullChatView merge.**

- **Paradigm decision:** In Pulse/debug flows, clicking a model or liveboard name opens a read-only contextual view (not the Workspace edit artifact). The conversation stays the container; the object view slides in alongside it. Debugging = agent is the actor, user is the reviewer — the full edit surface (publish, DQ chip, AIRS chip) is wrong here.
- **FullChatView split layout:** merged from Komal's `DataStudioV2 3 komal/components/FullChatView.tsx`. Added `OBJECT_DATA` (17 objects: models, dependents, liveboards with columns + broken/null status), `OBJECT_NOTES` (per-object contextual agent notes), `LIVEBOARD_DATA` (3 liveboards with tile layouts), `LiveboardObjectView` (real `LiveboardHeader` + `AnswerTile` grid, broken tiles show red overlay), `ObjectPanel` (columns table: name · type · status badges). On click: object panel slides in from left (flex 1), agent narrows to 420px, context panel hides. Agent injects contextual note into chat. Close button restores full-width layout.
- **Object click state across 6 flows:** ins-o3 and ins-o4 are working (onOpenObject already on those cards from session 101). ins-d1/d2/d3/d6 are not — their cards lack the onOpenObject prop. Full details and fix plan documented in Next up item 1.
- Build: clean ✓

---

### 2026-05-12 (session 101)

**Merge Komal 3 — semantic gaps flow, cache miss flow, onOpenObject stub.**

- **Semantic gaps (ins-o3)**: 3 new SCRIPT entries (`semantic_gaps_detect/generate/apply`) + 3 genUI cards (`SemanticGapsCard` with columns/downstream tabs + hover tooltips, `SemanticFillRecommendationsCard` with editable textareas + confidence badges, `SemanticGapsResolvedCard` green success state). Action handlers: `semantic_gaps_fill` → generate, `semantic_gaps_apply_descriptions` → apply, `semantic_gaps_cancel` → lock card.
- **Cache miss (ins-o4)**: Replaced `enable_cache` SCRIPT + `CacheRecommendationCard` with Komal's 3-stage flow (`cache_miss_detect/configure/enable`) + `CacheMissOpportunityCard` (stats grid + "who's running it"), `CacheConfigurationCard` (scope radios + refresh/TTL dropdowns + ROI estimate), `CacheEnabledCard` green success. Action handlers: `cache_miss_configure_action` → configure, `cache_enable_action` → enable, `cache_cancel` → lock.
- **onOpenObject stub**: `onOpenObject?: (name: string, highlightCol?: string) => void` added to `AgentPanelProps` + `MessageBubble` props. Passed to new cards — clicking clickable object names `console.log`s only. Visual affordance (blue link, cursor pointer) is live. Full behaviour is a future paradigm decision.
- **`index.tsx`**: `ins-o3 → semantic_gaps_detect`, `ins-o4 → cache_miss_detect` added to flowMap; prompt strings added to promptMap.
- **`Overview.tsx`**: `isFixWithAgent` condition changed from `category === 'debugging' || type === 'enable-cache'` to `label.includes('with agent')` — catches all agent-action Pulse rows including ins-o3 (`view-gaps` type).
- Build: clean ✓

---

### 2026-05-12 (session 100)

**Pulse row redesign — merged from Komal's DataStudioV2 3 komal.**

- **Source**: Komal 3 only (superset of Komal 2 — no Komal 2 content needed separately).
- **`mockData.ts`**: Added `titleShort?` and `impact?` fields to `ActiveInsight` interface. Replaced all 11 `ACTIVE_INSIGHTS` entries with Komal's richer content — `titleShort` is the short category label shown on line 1; `impact` is the downstream scope string shown on line 2 (e.g. `'sales_analytics · 3 models blocked · 12 answers stale · 4 liveboards affected'`). Action labels updated to specific verbs: Enable/Fill/Optimize/Clean up/Improve with agent →. Routing unaffected — `handleInsightAction` still uses `category` + `primaryAction.type`, not the label.
- **`Overview.tsx`**: Added `WarningIcon` (triangle SVG), `AISparkleIcon` (4-point star SVG), and `getPulseIconStyle` helper above PulseRow. Replaced `PulseRow` body: dot indicator → 34×34 rounded icon box (colour-coded by severity/category); title+metric one-liner → two-line layout (`titleShort` / `impact`); action button now revealed on hover only (was always visible).
- **Decision log**: Komal 3 is the single source for all merges going forward — it is the superset of Komal 2 plus the two new optimization flows.
- Build: clean ✓

---

### 2026-05-12 (session 99)

**Model Health panel design — mhp5 Playground exploration + promoted to main prototype.**

- **Design decision**: narrow dropdown panels (340px, one signal at a time), two-level accordion (categories collapsed by default). mhp3 (scorecards) and mhp4 (flat list with tabs) ruled out for narrow-width constraint. mhp2 (Lighthouse) ruled out for disconnected sections. mhp1 direction chosen.
- **mhp5 Playground exploration**: new `MhpShellDropdown` shell — full artifact skeleton, chips in tab bar anchor actual positioned dropdowns (340px, `maxHeight: 70vh`). One chip open at a time. All categories collapsed by default (`{}`). Added to Model Health nav section.
- **Promoted to Workspace.tsx**:
  - Replaced flat `MH_AIRS_ITEMS` + `MH_AIRS_BARS` with `MH_AIRS_DIMS` (4 collapsible dimensions: Semantic completeness 40%, Context & instructions 20%, Join accuracy 80%, Data type validity 90%).
  - `dqSectionOpen` + `airsSectionOpen` state (both `{}`).
  - Both panels now structurally identical: gauge dial header (SVG arc + div overlay for number — avoids SVG font issue) + collapsible accordion body + full-width "Fix all with agent" footer.
  - DQ gauge: 0% arc (red) showing issue count; 100% arc (green, ✓) when resolved.
  - AIRS gauge: 25% arc (red) showing score.
  - Removed checkboxes from AIRS items; removed pts score (`0/25pt`). Both panels use same item row: `label · action →` (done items: strikethrough + grey).
  - DQ item column names changed from `ff.mono` → `ff.primary` to match AIRS font.
  - All text in both panels explicitly uses `fontFamily: ff.primary`.
- Build: clean ✓

---

### 2026-05-12 (session 98)

**DQ + AIRS chip redesign + 4 panel explorations in Playground.**

- **Chip labels**: both chips now use `Poor / Fair / Good / Excellent` tier vocabulary (shared `MhTier` type). Label pattern: `Data quality · Poor` / `AI readiness · Poor`. Always filled background (colored bg + border), full semantic color text.
- **Tier metadata**: Poor=red, Fair=amber, Good=green, Excellent=deep green. Replaces the old `Not ready / Basic / AI-ready / Optimized` vocabulary on `MH_TIER_META` in Workspace.tsx.
- **DQ chip**: tier derived from `prepTransforms` state — Poor (9 issues) or Good (resolved). Triangle icon removed. Dot removed.
- **AIRS chip**: `MH_AIRS_SCORE=25` → Poor. Mini ring icon removed. Dot removed.
- **4 Playground explorations** (mhp1–mhp4) added under Model Health tab. Both panels shown side-by-side simultaneously. Shared helpers: `PanelTier`, `PT_META`, `TierPill`, `MhpGauge`, `MhpChip`, `MhpShell`. AIRS score in playground = 53 → Good (distinct from DQ Poor for visual contrast).
- Build: clean ✓

---

### 2026-05-12 (session 97)

**Model health chips + cache button reorder.**

- **Direction decided:** separate signals (not umbrella). Two compact dropdown chips in the tab bar.
- **Cache button** moved from tab bar to identity row. New order: Cache → Share → Publish → ×. Label shows "Live query" / "Caching…" / "Cached" (status-aware).
- **Tab bar right** is now: Settings gear | `▲ 9 issues` | `◯ 25% AI ready` | `+ Data`.
- **DQ chip** (`▲ 9 issues`): red when issues present, green "9 resolved" when `prepTransforms` applied. Opens a 340px dropdown with 9 issues across 3 sections (nulls, duplicate rows, date format mismatches). Each row: `code` column name + detail text + severity badge (High/Med) + Fix → link. "Fix all with agent" in header.
- **AIRS chip** (`◯ 25% AI ready`): red ring at score 25 (Not ready tier). Opens a 340px dropdown with a 36px circular gauge, score breakdown (4 colored bars), and 6 action items with pts earned/total. Done items have green checkmark + strikethrough. Action items show "Generate →" / "Add →" links.
- Outside-click closes whichever dropdown is open. Clicking the other chip while one is open switches dropdowns.
- Mock data: `MH_AIRS_SCORE = 25`, `MH_AIRS_TIER = 'Not ready'`, 9 DQ issues, 6 AIRS action items (25+15 pts earned = 25/100).
- Build: clean ✓

---

## Done — Test + coaching polish pass 2 (2026-05-12, session 94)

**Sample questions — full redesign:**
- Replaced 4 wrapping pill buttons with a collapsible "Sample questions" strip (closed by default, expands upward). Same width as the prompt bar.
- Expanded rows use DayClarifyCard-style numbered boxes + question text. Click fills prompt bar + closes strip.
- Refresh button (Radiant `Icon name="refresh"`) cycles between two groups of 4 from an 8-question pool; only visible when open.
- Chevron: ∧ (up) when closed, ∨ (down) when open — content expands above the header strip.
- Font size: `fs.sm` (was `fs.xs`).
- `DEMO_QUESTIONS` renamed to `DEMO_QUESTION_POOL` with 8 questions; first group retains the two scripted demo questions.

**Spotter + coaching step style updated:**
- Both spotter-answer and coaching-result steps now use the build agent pattern: 10×10 grey dot (opacity 0.4 done / 1.0 running), 1px `border-default` connecting line, always `fw.semibold` + `content-primary` label. No more green circles or gradient text.

**Auto-collapse working steps:**
- Spotter-answer: steps collapse the moment `answerRevealed` fires (`workingExpanded: false` set alongside).
- Coaching-result: steps collapse when `debugResultRevealed` fires; "Show work" toggle added (matching build agent pattern).

**Divider above prompt bar removed** — `borderTop: 'none'` on the prompt bar wrapper (all modes). PromptBar's own border provides sufficient separation.

- Build: clean ✓

---

## Done — Test + coaching flow polish (2026-05-12, session 93)

4 feedback items addressed in `AgentPanel.tsx`:

- **"Try a question" pills** — `fontSize: 11` → `fs.xs`; hover color `#7C3AED` (hardcoded purple) → `c['content-brand']` on both border and text.
- **Coaching clarify card** — "Something's off" no longer adds a coaching-prompt message inline in chat. Instead sets `coachingPrompt` state → renders `CoachingClarifyCard` floating above the prompt bar (same DayClarifyCard visual pattern: bordered card, numbered option rows, hover-to-background-subtle). On selection: adds a user bubble with chosen option, then pushes coaching-result message. Prompt bar disabled while card is visible.
- **"Fix in build →" → "Fix this"** — label change on the coaching-result CTA button.
- **No "Switch to test mode" after fixing** — removed `executionSuggestions: ['Switch to test mode']` from all 5 coaching scripts (`coaching_time_period`, `coaching_number_wrong`, `coaching_wrong_columns`, `coaching_join_wrong`, `coaching_something_else`). Each execution text now ends with "Ask another question to verify the fix." `COACHING_DEBUG_RESULTS` text updated to remove "Switch to Build" references (button does that automatically now).

- Build: clean ✓

---

## Done — Pulse → FullChatView flows wired + CacheRecommendationCard (2026-05-11, session 83)

**Goal:** Merge Komal's Pulse-triggered agent workflows into V2 without touching model-build flows.

**Overview.tsx — routing fix:**
- `isFixWithAgent` condition was `category === 'debugging' && type in [fix-model, fix-models]` — missed `view-connection` type (ins-d1 dbt Cloud) and all optimization insights.
- Changed to: `category === 'debugging' || type === 'enable-cache'` — all debugging insights now route to `onFixWithAgent`, and ins-o4 (Cache miss opportunity) also routes there instead of opening ModelView.

**AgentPanel.tsx — additive changes only:**
- Added `CACHE_STATS` to mockData import.
- Added `CacheRecommendationCard` genUI component — shows 2 high-frequency queries for Campaign Performance with run count, avg latency, and savings pill. "Enable caching" action fires `enable_cache` flow.
- Added `cache_recommendation` genUI rendering in message section.
- Updated healthy-project greeting: if `project.name === 'Campaign Performance'`, shows proactive cache recommendation instead of generic suggestions. This fires for both ins-o4 (Pulse → FullChatView) and direct workspace open.

**Pre-existing broken build fixed:**
- Previous session had left an extra `</div>` in the Build tab JSX section (line 2944 in old numbering) — `npm run build` was already failing. Removed the stray tag.

**What was already in V2 (no changes needed):**
- All 4 debugging fix flows and their genUI cards: `dbt_connection_repair` → `ConnectionStatusCard`, `schema_drift_repair` → `SchemaDriftResolutionCard`, `schema_drift_multi_repair` → `MultiModelDriftCard`, `null_rate_investigation` → `NullRateCard`
- `NextIssueCard` (appears after schema drift fix completes)
- `enable_cache` SCRIPT, genUI action handlers, `next_issue` handlers
- `FullChatView.tsx` and `handleFixWithAgent` in index.tsx

- Build: clean ✓

---

## Done — Fix Shell header bleeding into Workspace (2026-05-11, session 79b)

**Root cause of the recurring double-header bug:**
- `Workspace` renders as `position: fixed, inset: 0, zIndex: 50` (outside `<Shell>`)
- Shell's `GlobalHeader` (AppShell.module.css: `position: absolute, z-index: 20`) was still painting underneath
- Result: dark TS shell bar visible on top of Workspace's own "← Chat" header

**Fix (one line in `index.tsx`):**
- `hideSidebar={view === 'chat' || view === 'workspace'}` — sidebar was also rendering when view=workspace
- `hideHeader={view === 'workspace'}` — Shell.tsx already supported this via `display: none`; it was just never set

**Why it keeps recurring:** Any view added as a `position: fixed` overlay outside `<Shell>` must explicitly pass `hideHeader`. Views added INSIDE `<Shell>` (like ChatView) correctly inherit the Shell header as a parent frame — two header bars there is intentional (global ThoughtSpot nav + page context bar).

- Build: clean ✓

---

## Done — Plan artifact panel polish (2026-05-11, session 79)

Both `PlanPanel.tsx` and `QualityPlanPanel.tsx` now visually match the model artifact card.

- **Double-wrapper removed** — outer div with `padding: 12` + `borderLeft` replaced by the inner card becoming the root element (same pattern as the model artifact card in `Workspace.tsx`)
- **Border**: `border-default` (#C0C6CF, visible grey) → `border-divider` (#EAEDF2, subtle/light)
- **Border radius**: 8 → 10
- **Header height**: 40px → 48px (matches the model artifact's identity row)
- **Font sizes**: all hardcoded `fontSize: 11` / `fontSize: 10` replaced with `fs.xs` token (12px)
- **QualityPlanPanel warning icon**: amber `#D97706` → `c['content-secondary']` grey (was intended in session 77 but not applied)
- Severity chips and issue badge retain semantic colours (intentional)
- Build: clean ✓

---

## Done — Overview + chat polish (2026-05-11, session 78)

**Overview prompt bar:**
- Heading: "What would you like to build?" → "Hey Sara, what would you like to do today?" (subtext removed).
- Prompt bar placeholder: "How can I help you today?"
- 5 capability chips with Radiant icons (`table`, `schema`, `ai`, `cord`, `sync`) — icon + label, same pill style.
- Typewriter ghost animation: clicking a chip sets base text as real value, then cycles 2 example suffixes as ghost text overlaid in `#B0B8C4` via the mirror div. Real value never changes; cursor stays after base text. User keypress cancels instantly. Timing: 65ms/char type, 1.6s hold, 35ms/char delete. `PromptBarRef` gains `startTypewriter(base, suffixes[])`.
- `onStartDbt` removed from `Overview` — all chips go through prompt submit.
- All prompts route to chat (no dbt keyword branching — dbt is also an agentic flow, not a screen redirect).

**Chat header + model name:**
- Global ThoughtSpot shell header now visible in chat — `ChatView` is inside `<Shell hideSidebar>`, sidebar hidden, header visible. Matches overview framing.
- ChatView secondary header: centered "Untitled Model" title removed. Back button label now shows `project.name` (e.g., "← Marketing attribution across channels").
- `deriveModelName(prompt)` added in `index.tsx` — strips standard preamble + leading verbs, takes first 5 words, capitalises. Sets `project.name` on chat entry instead of hardcoded "Untitled Model".

- Build: clean ✓

---

## Done — Context panel polish + bug fixes (2026-05-11, session 77)

Multi-pass fix session on the context panel after session 76 promotion.

**Icons:**
- `"table"` and `"doc"` are not in the Radiant icon registry (render null silently). Replaced with inline SVGs: `DocIcon` (document outline + lines) and `TableIcon` (grid with header row). `checkmark-circle` (registered) kept for skills.
- Quality plan icon: gray `content-secondary`, same as build plan — removed amber tint.

**Context panel behaviour:**
- Created items: flat rows (no card border), icon + name only. Quality plan: plain list item, no "Apply fixes" / "Edit plan" actions.
- Quality plan only appears after `project.prepTransforms !== undefined` (set when `review_data_quality` script completes) — not immediately on build.
- Context panel stays open when quality plan opens (removed auto-collapse effect).
- Auto-close context when plan panel opens in ChatView; re-opens when plan panel closes.

**Artifact close / canvas:**
- Added `canvasVisible` + `planPanelOpen` states to Workspace.
- Clicking X on any artifact (artifact card, quality plan, plan panel) → `setCanvasVisible(false)`. Canvas + drag handle hide, agent expands. No navigation away.
- Clicking an item in Created → sets `canvasVisible(true)` + shows correct artifact.
- Build plan now clickable: `PlanPanel` imported in Workspace; opens in canvas area when build plan item clicked.

**Navigation fixes:**
- ChatView header: added `← Overview` back button on left.
- Workspace header: `← Chat` back button + centered title + panel toggle.
- `goBack()` in index.tsx: if `prevView === 'chat'`, returns to chat without clearing messages/project state.
- Table go-to arrow (↗) in context panel: navigates to data browser (wired in both ChatView and Workspace).
- `onBack()` wiring replaced by `setCanvasVisible(false)` on artifact close.

**QualityPlanPanel:** footer buttons (Apply fixes / Edit plan) removed — CTAs were in context panel (now also removed per feedback).

- Build: clean ✓

---

## Done — Chat context panel promoted to live (2026-05-11, session 76)

- `ChatContextPanel.tsx`: new component. Width 280px, `borderLeft: border-divider`. Two collapsible sections — **Created** (plan cards: white bg + border + doc icon; model card: `#EFF6FF` bg + `#BFDBFE` border + 4-quad SVG) and **Context** (Tables with table icon, Skills with checkmark-circle icon). Empty states per section. Chevron rotates via `transform` on `<span>`.
- `ChatView.tsx`: added 48px conversation header row (centered project name, right-side panel toggle SVG icon). Content derived via `useMemo` — `planMsg`, `created`, `contextTables`, `contextSkills`. Panel renders when `contextPanelOpen && !isPlanOpen` (hides when plan panel open to avoid 3-column crowding).
- Build: clean ✓

---

## Done — Pass 3 + Pass 4: font size fixes + QualityPlanPanel (2026-05-11, session 74)

- Discovered that Pass 3 items 1, 3, and 4 (drag handle background, download button, gear button) were already implemented in prior sessions but not cleared from the next-up list.
- `PlanPanel.tsx`: column/formula description text `fontSize: 11` → `fs.xs`; formula col name and sample question text `fs.xs` → `fs.sm`.
- `QualityPlanPanel.tsx`: new component. Identity row (warning icon + "Data Quality Plan" + 9 issues badge + download + close). Accordion sections: Goal (summary + severity chips) + Null values (3) + Duplicate rows (2) + Date format mismatches (3) + Anomalous values (1). Each row: `<code>col</code>` + severity badge + detail + `→ fix` link. Footer: "Apply fixes" (primary) + "Edit plan" (ghost).
- `QualityPlanCard`, Workspace wiring (state, callbacks, render), and AgentPanel wiring were already in place from prior sessions.
- Build: clean ✓

---

## Done — Context panel skeleton in Playground (2026-05-11, session 75)

- `Playground.tsx`: added `ContextPanelExploration` component and wired it into `PlaygroundNav` as `context-panel` card under Phase 2 — explorations.
- Exploration shows: 48px header (← Overview, centered title, panel toggle icon), chat column centering within available space, 280px right panel with **Created** (plan + model cards) and **Context** (Tables + Skills) sections.
- Layout toggle in step bar: "Chat" vs "With artifact" — artifact view shows 3-column layout (360px agent left, flex artifact canvas center, 280px context panel right).
- Step buttons: Empty → Plan → + Quality → + Model — drives both chat messages and panel content.
- Card design: plans = white bg + border + doc icon; model = light blue (`#EFF6FF`) card; no badges.
- Feedback captured in CONTEXT.md Next up spec for live promotion (both plans use same `doc` icon, no gray fill on plan cards).
- Build: clean ✓

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

### 2026-05-13 (session 109)

**PlanPanel — Preview/Code tabs + scroll fixes.**

- **Tab bar:** "Preview" | "Code" below the identity row. Active tab: `content-brand` color + 2px bottom border.
- **Preview tab:** existing accordion unchanged. "Some sections were last edited in code view" info banner when any cell has been run.
- **Code tab — 6 cells** matching preview sections: Goal (text), Tables (SQL/CTEs), Relationships (SQL/JOINs), Columns (SQL/SELECT), Formulas (computed columns with inline comments), Sample questions (text). SQL generated dynamically from `plan` prop.
- **Hex-style cell UI:** 3px left accent bar (blue=SQL, gray=text); cell type as faded uppercase label; edit button reveals on header hover; Run button green (#16a34a); SQL body uses `background-sunken`; text cells use `background-base`.
- **Cell interaction:** pencil → edit mode (textarea); Run ▶ applies + marks applied; Cancel discards. Read-only: line numbers + SQL keyword colorizer.
- **Scroll fix (3 iterations):** (1) `minHeight: 0` on tab body containers; (2) `minHeight: 0` on PlanPanel root div; (3) `flexShrink: 0` on CodeCell root div — flex children shrink by default, so cells were compressing to fit instead of overflowing and triggering scroll.
- Build: clean ✓

---

### 2026-05-13 (session 108)

**Blast radius flow wired for ins-d3 (fact_sales); MultiModelDriftCard wired for ins-d3 multi-model; routing fixes.**

- **ins-d3 (fact_sales, blast radius):** `flowMap` maps `ins-d3` → `schema_blast_repair`. Added render conditions for `blast_radius`, `schema_reconcile`, `restore_point` genUI types (cards were pre-built but unwired). Added `onComplete` prop to `RestorePointCard`. Full flow: `BlastRadiusCard` (detection + Models·2 / Downstream·12 tabs) → `SchemaReconciliationCard` (per-column replace/remove with confidence %) → `RestorePointCard` (success + roll back). No next_issue prompt after completion.
- **ins-d2 (FnOps Cost Model):** restored to original `schema_drift_repair` mapping — unchanged flow.
- **ins-d3 multi-model render:** swapped `DriftMultiResolutionCard` → `MultiModelDriftCard` (already in file) for `multi_model_drift` genUI — per-model column cards, dependent chips, onOpenObject wiring.
- **Routing bug fixed:** mockData has ins-d3 = fact_sales, ins-d2 = FnOps Cost Model. Initial commit had them swapped in flowMap.
- Deployed to Vercel (https://radiantplay-nine.vercel.app).
- Build: clean ✓

---

### 2026-05-13 (session 107)

**SchemaDriftResolutionCard upgraded to Komal v4 (ins-d2).**

- Source: `/Users/vivek.sahi/Downloads/DataStudioV2 4 Komal/components/AgentPanel.tsx`
- **Per-column decisions:** each column now has its own "Remap to" / "Remove it" toggle pair, with an inline column picker dropdown. Columns are fully independent.
- **Dynamic CTA:** single button that changes text + background — blue "Apply mapping → all 9 continue" when all remapped; red "Apply — N will break" when any column is set to remove. Consequence text also updates inline per-column.
- **Agent recommendation block (✦):** blue box above the decisions explaining why remapping is safe ("Both replacements carry the same data under new names…").
- **Flat dependent chips:** accordion removed. All 9 dependents (Answers/Liveboards/Formulas) visible immediately as clickable chips. `onOpenObject` wiring preserved on every chip and the "FnOps Cost Model ↗" header button.
- Scripts, action handlers, `DriftPublishPreviewCard`, `SchemaDriftCompleteCard` unchanged.
- Build: clean ✓

---

### 2026-05-13 (session 106)

**Wire onOpenObject on 4 remaining Pulse debug cards (ins-d1/d2/d3/d6).**

- **ConnectionStatusCard (ins-d1):** blocked model name `<span>` chips → `<button>` elements calling `onOpenObject?.(m)`. Added `↗` affordance.
- **MultiModelDriftCard (ins-d3):** model name `<div>` → `<button>` calling `onOpenObject?.(model.name, model.columns[0])`; dependent `<span>` chips → `<button>` calling `onOpenObject?.(d.name, d.ref)`. Added `↗` affordance on both.
- **NullRateCard (ins-d6):** "Marketing Campaign Attribution" `<span>` → `<button>` calling `onOpenObject?.('Marketing Campaign Attribution', 'campaign_id')`. Added `↗` affordance.
- **SchemaDriftResolutionCard (ins-d2):** "FnOps Cost Model" `<span>` → styled `<button>` calling `onOpenObject?.('FnOps Cost Model', 'cost_center')` with hover-underline; accordion item buttons now have `onClick={() => onOpenObject?.(name)}` (were visually clickable but fired nothing).
- All 4 render sites updated to pass `onOpenObject={onOpenObject}`.
- Build: clean ✓

---

### 2026-05-12 (session 105)

**Debug artifact view — replaced ObjectPanel with composite Info tab style.**

- **Design decision:** Object clicks in Pulse debug flows now open a view-mode artifact that combines ModelView's Info tab layout with debug-specific status data from OBJECT_DATA. Liveboards unchanged.
- **Source section:** shown above Columns when MODEL_DETAILS has data. Warehouse models (Marketing Campaign Attribution): Type, Database, Tables. dbt models (Sales Performance): Type, Project, Schedule, Last sync. Blocked status appears as a Status row inside the Source block — not a disconnected bottom banner.
- **Columns section:** Info tab card-row layout — name (mono) + type badge left, broken/null status badge right; second line shows source table · description where MODEL_DETAILS has it. `highlightCol` auto-scrolls and gets a 3px left accent border.
- **Merge fix:** MODEL_DETAILS columns are primary (richer descriptions/types); OBJECT_DATA columns not present in MODEL_DETAILS (e.g. `campaign_id`) are appended so debug-relevant status is never lost.
- **Blocked fallback:** models that are blocked but have no MODEL_DETAILS entry show a warning note above the column list.
- Committed and deployed to Vercel (https://radiantplay-nine.vercel.app).
- Build: clean ✓

---

### 2026-05-12 (session 96)

**Model health design exploration — mh1 + mh2 Playground explorations.**

- **Design decisions:** AIRS chip opens a canvas view within the artifact (not a panel, not a new artifact — identity row + tab bar stay visible). Three signals: data quality (issue count), AI readiness (metadata score), answer quality (empirical / test mode only). 100% AIRS score does not guarantee correct answers — data quality and LLM limits are independent variables. Score degrades over time via schema drift and test failures.
- **Conceptual framing:** data quality + AI readiness are separate signals (different owners, different fix actions). Model Health is the umbrella name for the models list column. Whether they appear as one chip or two chips in the artifact tab bar is what the explorations test.
- **mh1 (Separate signals):** two chips in the tab bar right side — "9 issues" (data quality, red/green) + "53 Basic" (AI readiness, amber/blue ring). Each chip opens its own canvas view. Canvas view: compact summary bar (status + description + "Fix all with agent") + collapsible checklist sections. Individual "Fix →" per item. Items check off on fix.
- **mh2 (Model Health umbrella):** single "Model health" chip with two colored dots (one for DQ, one for AIRS). Opens a unified canvas view with a summary bar showing both mini-signal pills + a two-level section hierarchy: Data quality → 4 subsections, AI readiness → 4 dimensions. Same fix interactions.
- Both explorations include a full artifact skeleton (identity row, tab bar, table content stub) so placement is visible in context.
- Build: clean ✓

---

### 2026-05-12 (session 95)

**Sample questions strip polish + AI Readiness Score research + Playground explorations.**

- **Strip spacing**: removed `marginBottom: sp.A` from strip wrapper — gap between strip and prompt bar halved (~12px → ~8px).
- **Strip background**: header strip now uses `background-subtle` (hover → `background-sunken`) to separate it from the panel surface.
- **Strip expanded shadow**: when open, a `shadows.sm` wrapper lifts the whole block off the background; question rows use `background-subtle` (was `background-base`); number boxes flipped to white for contrast.
- **AI Readiness Score research doc**: written at `research/ai-readiness-score.md`. Covers: what the score means to a data analyst, 9 ranked factors affecting AI answer quality, competitive landscape (Snowflake Cortex, Databricks Genie, dbt, Alation), 4-dimension score structure with tiers, and design principle ("actionable, not just informational"). Decision: Option D (chip + popover + publish gate + test mode integration), build in phases.
- **Playground explorations (airs1–airs4)**: 4 new explorations under "AI Readiness Score" tab at `/data-studio-v2/playground`:
  - `airs1`: 3 chip variants in identity row — tier label / score+ring / 4-dot segmented; click opens compact breakdown popover
  - `airs2`: Two detail panels side by side — Lighthouse-style (gauge + bars + opportunities + diagnostics) vs Checklist-style (collapsible sections, binary items)
  - `airs3`: Publish-time gate — "Before you publish" intercept with "Improve first" checklist; checks off items with live score feedback; publish button turns green when all addressed
  - `airs4`: Models list with Health + AI Readiness in 3 layout approaches (two columns / combined / single worst-case), with tradeoff notes
- Build: clean ✓

---

### 2026-05-12 (session 92)

**Test + coaching flow review and fixes.**

- **DEMO_QUESTIONS now surfaced in UI** — added a "Try a question" pill row above the prompt bar when `agentMode === 'test'`. 4 clickable pills (the exact scripted question strings) that fill the prompt bar on click. Eliminates the need to type exact strings during a demo.
- **"Switch to test mode" chip fixed** — was calling `setProject(p => ({ ...p, testMode: true }))` (testMode was removed from ProjectState in session 91). Now calls `setAgentMode('test')` directly — the toggle pill actually flips.
- **User bubble normalized** — spotter-user messages no longer show "Test question" label; render same as normal user bubbles.
- **Agent avatar normalized** — Spotter answers now use `AgentAvatar` (blue) instead of `SpotterIconAvatar` (purple Spotter ring). Removed the SpotterIconAvatar component entirely.
- **TypeScript fixes** in AgentPanel:
  - `fw.bold` → `fw.semibold` in measure chip (bold doesn't exist in token type)
  - `convert_currency` script: added missing `duration: ''` and `proposal: ''` fields required by the FlowDef type
  - Removed leftover session-91 dead code: `TestMsg` interface, `SpotterIcon/Sm`, `FilterIcon`, `TChevronIcon`, `TableViewIcon/ChartViewIcon`, `DownloadIcon`, `TSpinner`, `testChipStyle`, `qCount`, `stepCount`, `onOpenPlanModal` (prop + destructure + call site)
  - Removed unused imports: `Avatar`, `TextInput`, `Button`, `ts` token
- Build: clean ✓

---

### 2026-05-12 (session 91)

**Test mode — design decisions + build (inline conversation migration).**

- Design session: defined testing paradigm for data analysts (known-answer verification, granularity ladder, business question coverage, Spotter interpretation checks).
- Key decisions: test mode = Spotter Q&A inline in the conversation thread; answers ephemeral in chat history only (not saved to Created); no liveboards in draft state; one conversation per model persists across sessions. See `research/test-mode-design-decisions.md`.
- Build spec written at `research/test-mode-build-spec.md` — 4-phase migration plan.
- **Build — AgentPanel.tsx:** migrated from separate `testMessages` state + test panel JSX to inline in main `messages` array. New types: `spotter-user`, `spotter-answer`, `coaching-prompt`, `coaching-result`. New functions: `handleSpotterQuestion`, `handleSpotterFeedback`, `handleSpotterCoachingOption`. `agentMode` state routes `processText` to Spotter when in test mode. Feedback buttons (Looks right / Something's off) on each answer; Something's off triggers coaching-prompt → coaching-result → Fix in build. `SpotterIconAvatar` (purple ring) distinguishes Spotter from build agent. 2 new SPOTTER_ANSWERS: revenue by region (happy path) and budget utilisation (coaching demo arc). `switchToBuildWithContext` updated to use `setAgentMode('build')`.
- **Build — index.tsx:** `testMode` removed from `ProjectState` type and all 6 initial state objects.
- Removed: `testMessages`, `testInput`, `testEndRef` state; `sendTest`, `toggleTestWorking`, old `handleFeedback`, old `handleCoachingOption`, old test panel JSX (~326 lines).
- Build: clean ✓

---

### 2026-05-12 (session 90)

**Instructions file — bug fixes (state persistence + exclusive canvas).**

- **`index.tsx`** — lifted `instructionsCreated` state out of ChatView to persist across the chat → workspace auto-transition. Passed as prop to both ChatView and Workspace. `onBuildStart` callback passed to ChatView.
- **`ChatView.tsx`** — removed local `instructionsCreated` state; now accepts `instructionsCreated` + `onBuildStart` as props.
- **`Workspace.tsx`** — added `instructionsPanelOpen` state. Added `instructions.md` to `contextCreated` (first item). Context panel now starts open when `instructionsCreated` is true. InstructionsPanel renders in canvas exclusively — model artifact hidden when `instructionsPanelOpen`. All Created item click handlers now close each other (`setInstructionsPanelOpen(false)` added to plan/quality/model handlers).
- **Reverted** Instructions tab from model artifact — instructions.md is a separate file, not part of the model.
- Build: clean ✓

---

### 2026-05-12 (session 89)

**Instructions file — new artifact in Created section.**

- **`InstructionsPanel.tsx`** — new component. Panel with "instructions.md" header (doc icon + filename + close button). Body: model name as h2, two paragraphs of context, "Sample questions" section with 5 bullet points. Content is scoped to the Campaign Performance / Marketing Campaign Attribution demo model.
- **`AgentPanel.tsx`** — added `onBuildStart?: () => void` prop. Called in `handleStartBuilding` (fires when user clicks "Start building →" after approving the plan).
- **`ChatView.tsx`** — added `instructionsCreated` + `instructionsPanelOpen` states. `onBuildStart` → `setInstructionsCreated(true)`. `created` array now prepends an `'instructions'` item (name: "instructions.md") when created; clicking it opens InstructionsPanel in the canvas. `isPlanOpen` extended to include `instructionsPanelOpen` so the 40/60 layout activates. InstructionsPanel closes and reopens context panel on close.
- **`ChatContextPanel.tsx`** — added `'instructions'` to `CreatedItem` type union.
- Order in Created: instructions.md → model (chronological — instructions appear at "Start building", model appears when build completes).
- Build: clean ✓

---

### 2026-05-12 (session 88)

**Feedback pass — transitions, auto-scroll, connection pill polish.**

- **`ConnectionPill.tsx`** — reduced visual emphasis on Overview prompt bar: removed border, removed internal divider between label and chevron, kept `background-subtle` fill (for separation from upload button), text color → `content-secondary`. Tightened label `paddingRight` 8→4px and chevron container width 28→20px.
- **`ChatView.tsx`** — staggered entrance animation on mount: root fades in (opacity 0→1, 280ms); context panel follows 220ms later with fade + 14px slide from right (260ms). Eliminates the hard pop when switching from Overview → chat.
- **`AgentPanel.tsx`** — auto-scroll now fires on any `messages` change (step updates + new messages), not just when `messages.length` increases. Added `scrollContainerRef` + `isNearBottomRef`: scrolls to bottom if user is within 100px of bottom; stops hijacking scroll if user has scrolled up to read.
- **`Workspace.tsx`** — staggered entrance on mount: root fades in (opacity 0→1, 400ms); entire canvas half (drag handle + artifact) slides in from right (28px, 500ms) after a 280ms delay — agent panel settles visibly before artifact arrives. Removed redundant `ds-slide-in` from artifact card since parent wrapper now animates.
- Build: clean ✓

---

### 2026-05-12 (session 86–87)

**Prompt bar polish pass + Vercel deploy.**

- **`ConnectionPill.tsx`** — new component. Pill-shaped trigger (gray background, label, vertical divider, chevron) + dropdown list. Default label: "All connections". Each connection row shows a status dot (green = connected, amber = auth-needed) and a checkmark on the selected row. Closes on outside click. `dropDirection` prop controls whether the dropdown opens above or below.
- **Overview** — `ConnectionPill` wired as `leftSlot` of the landing page `PromptBar`, opens downward. State: `connFilter` (null = all, string = connection id).
- **AgentPanel** — `ConnectionPill` wired as the leftmost item in the existing `leftSlot` div (left of the build/test mode toggle), opens upward.
- **Remove Add Tables button** — `+ Tables` button and full warehouse tree browser removed from PromptBar. Dead state (`browserOpen`, `tableSearch`, `expConns/DBs/Schemas`, `searchRef`, `tog`, `TreeNode`, `BrowserRow`, `compact` prop) cleaned up. `@` mention lookup unaffected.
- **Upload button** — replaced `↑ Upload` text with `<Icon name="upload" size="s" />` from Radiant registry. 28×28 icon-only button.
- **Send button** — always blue (`#2770ef`); 40% opacity when input is empty instead of going gray. Stop button stays neutral gray.
- **Overview greeting** — "Morning, Sara" → "Welcome back, Sara."
- **Prompt bar toolbar padding** — `sp.A / sp.B` (4/8px) → `sp.B` (8px) all around; bottom now matches sides.
- **Build/test toggle** — outer wrapper `borderRadius: 8 → 20` (pill), buttons `borderRadius: 6 → 50%` (circular), buttons `28×28 → 26×26` to match connection pill height of 30px.
- **Build mode placeholder** — "Give me a task. Use '@' to mention tables." → "Describe a task, or '@' to mention tables." (one sentence).
- **Deployed** to Vercel production: https://radiantplay-nine.vercel.app
- Build: clean ✓

---

### 2026-05-11 (session 85)

**Model-building flow polish — nav, layout, and panel cleanup.**

- **Test button removed** from artifact tab bar (only in prompt bar pill now).
- **Data button** moved to rightmost position in tab bar, icon changed to plus, placed after Quality issues.
- **Workspace background** — added `backgroundColor: background-base` to root wrapper so the full area is white when artifact is closed.
- **Agent panel centered** when artifact is closed — wrapped AgentPanel in a `flex:1 / justifyContent:center` div conditionally; canvas-visible state keeps prior fixed-width behaviour.
- **Created section** in context panel (ChatView) — removed Build plan and Data quality plan entries; only the model shows (permanent artifacts only). Plans accessible from chat as before.
- **Back navigation** unified — all back buttons from ChatView, Workspace, and FullChatView go directly to Overview (state cleared). Removed the `prevView === 'chat'` special case from `goBack()`.
- **Workspace back label**: "← Chat" → "← Overview".
- **FullChatView back label**: `project.name` → "Overview".
- Build: clean ✓

---

### 2026-05-11 (session 84)

**FullChatView alignment + context panel + insight wiring fixes.**

- **FullChatView mounted inside Shell** — moved from `position: fixed, inset: 0` overlay to inside `<Shell hideSidebar>`, so the global ThoughtSpot header is now visible (matching ChatView). `fullPage` prop removed from AgentPanel.
- **FullChatView 48px header** — same structure as ChatView: `← [project.name]` back button (tokens throughout), context panel toggle icon on right.
- **Context panel added to FullChatView** — 280px right panel matching ChatView. "Created" shows "Nothing created yet" (correct — no new artifact is produced at session start). "Context" shows: Models sub-section (the existing model being worked on — not "Created"), Tables, Skills. Each flow has accurate data via `FLOW_CONTEXT` map in `FullChatView.tsx` (e.g. dbt connection repair shows Sales Analytics / Sales Performance / Revenue Forecast, not the generic demo state).
- **ChatContextPanel: `models` prop added** — new `models?: string[]` renders as a "Models" sub-section inside Context with `ModelIcon`, distinct from Created (build artifacts) and Tables. Existing ChatView usage unchanged.
- **ins-d1 insight resolution fixed** — `onInsightResolved('ins-d1')` now fires ~3.2s after "Rotate token & resync" is clicked (timed to land after `dbt_connection_apply` steps finish). Was never called before — Pulse alert stayed visible after returning to Overview.
- **Full Pulse wiring audit** — documented in Next up. 4 debugging flows fully wired; ins-d4 and ins-d5 broken; 4 of 5 optimization opportunities route to static ModelView with no agent flow.
- Build: clean ✓

---

### 2026-05-11 (session 82)

**ModelView tabs cut + Overview/Models page cleanup.**

- **ModelView:** removed Usage and Data quality tabs. Now 3 tabs: Info, Cache, Monitoring. Decision: Monitoring consolidates health/quality signals; Usage conversations had no clear home in the monitoring-first paradigm.
- **Overview:** removed the `borderBottom` divider between the hero and the Pulse section. Removed the old table-style "Recent models" and "Explore data" sections below the panels. Recent Models card (next to Pulse) kept and updated — each row now shows model icon + name + status/queries subtext, then health dot + label and date on the right.
- **Models page:** replaced "Issues" column with "Health" (colored dot + Healthy/Needs attention/Broken label). Dropped "Author" column. Removed `maxWidth: 1200` container so table fills full width.
- Build: clean ✓

---

### 2026-05-11 (session 81)

**ModelView — combined 5-tab version + routing wired.**

- **Clarified entry point distinction:** clicking a model → ModelView (Info tab); clicking a Pulse alert → should open full-screen agent chat (FullChatView), not just ModelView at Monitoring. `onFixWithAgent` deferred — full agent fix flow is a separate task.
- **Combined ModelView approach:** instead of replacing with Komal's 3-tab version, added Monitoring as a 5th tab alongside existing Cache and Data quality tabs. Same approach as the Overview merge — additive first, then evaluate what to cut.
- **`ModelView.tsx` changes:**
  - Added `initialTab?: TabId` prop
  - TabId extended: `'info' | 'usage' | 'cache' | 'quality' | 'monitoring'`
  - New imports: `WORKSPACE_QUERIES`, `WORKSPACE_QUALITY`, `CACHE_STATS`, `SEMANTIC_GAPS`, `MONITORING_TRENDS`, `MONITORING_STATS`, `SEMANTIC_COVERAGE`, `ProgressBarColor`
  - Added all monitoring components inline: `buildPillars`, `PillarCard`, `TrendBadge`, `CostRoiSection`, `SemanticCoverageSection`, `MonitoringTab`
- **`index.tsx` changes:**
  - `openModelView` now accepts optional `initialTab` param
  - `onOpenProjectAtMonitoring` → opens at `initialTab='monitoring'`
  - `onFixWithAgent` → also opens at `initialTab='monitoring'` (stub; full agent flow deferred)
  - `<ModelView>` now receives `initialTab={modelViewInitialTab}`
- Build: clean ✓

---

### 2026-05-11 (session 80)

**Global header, quality plan in Created, test mode exploration + prompt bar.**

- **Global header now visible in Workspace:** Workspace wrapper changed from `inset: 0` to `top: 60, left/right/bottom: 0`; `hideHeader={view === 'workspace'}` removed from Shell. `LeftPanel` overlay `top` updated from 144 → 204 (144 + 60px header).
- **Data quality plan in Created section:** `ChatView.tsx` now detects `messages.find(m => m.reviewPlanCTA)` and adds a `quality-plan` item to the `created` array as soon as the review_data_quality proposal appears — not after fixes are applied. Clicking opens `QualityPlanPanel` in the side panel (same pattern as build plan).
- **Test mode explorations (Playground):** 4 variants under "Test mode — Option A" (`tma1`–`tma4`): icon pill in header, text+icon segmented, mode chip above input, header dropdown. All toggle between Build and Test agent states interactively.
- **Design decision on test mode:** test is a mode of the same agent (Option A), not a separate panel. Toggle lives in the prompt bar toolbar as a leftmost pill.
- **Prompt bar consistency + mode toggle:**
  - `PromptBar`: new `leftSlot?: React.ReactNode` prop renders at far left of toolbar. Upload button now always visible (removed `!compact` guard).
  - `AgentPanel`: removed `compact` prop — `+ Tables` and `↑ Upload` now visible in both Overview and AgentPanel. Build/test pill added as `leftSlot`: bar chart icon (build) + flask icon (test). Test icon disabled at 35% opacity when `buildStep === 'empty'`.
  - Placeholder switches to "Ask anything about your model…" in test mode. Behavior of test mode itself is TBD — wired visually only.
- Build: clean ✓

---

### 2026-05-11 (session 78)

**Overview + chat header polish.**

- Overview: heading → "Hey Sara, what would you like to do today?", subtext removed, placeholder → "How can I help you today?".
- 5 capability chips with icons replacing old text suggestions. `PromptBarRef.startTypewriter(base, suffixes[])` added — animates ghost suffix in `#B0B8C4` via mirror div; real value stays as base text; user keystroke cancels. 65ms/char type, 1.6s hold, 35ms/char delete.
- All chips route to chat (no screen-based dbt branch).
- Global ThoughtSpot shell header now visible in chat — ChatView moved back inside `<Shell hideSidebar>`.
- ChatView secondary header: "Untitled Model" centered title removed; back button label shows `project.name`.
- `deriveModelName(prompt)` in `index.tsx`: strips preamble + leading verbs, first 5 words, capitalised — sets meaningful name on chat entry.
- Build: clean ✓

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
