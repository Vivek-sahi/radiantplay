# Test Mode — Build Spec

_Written 2026-05-12. Companion to `test-mode-design-decisions.md`._
_Classification: **Large + New territory** — new interaction paradigm, rewires existing test+coaching flows._

---

## What already exists (do not rebuild)

A test mode was built in earlier sessions. Most of the logic is correct — it just lives in the wrong place.

| What | Where in AgentPanel.tsx |
|---|---|
| `SpotterAnswer` type + `SPOTTER_ANSWERS` mock data (2 answers) | ~line 1717 |
| `TestMsg` type with `feedbackState`, `feedbackAnswer` fields | ~line 1727 |
| `coaching-question` + `coaching-debug` message roles | ~line 1727 |
| `sendTest()` — routes question to Spotter answer or fallback | ~line 2607 |
| `handleFeedback()` — marks answer correct/incorrect, appends coaching-question | ~line 2651 |
| `handleCoachingOption()` — appends coaching-debug with animated steps | ~line 2664 |
| `switchToBuildWithContext()` — switches to build, fires coaching script in `messages` | ~line 2700 |
| All 5 coaching scripts (`coaching_number_wrong`, `coaching_time_period`, etc.) | ~line 1179 |
| `COACHING_OPTIONS`, `COACHING_SCRIPT_MAP`, `COACHING_DEBUG_STEPS` | nearby |
| `DEMO_QUESTIONS` — 3 sample questions | ~line 1848 |
| Build/Test toggle pill in prompt bar toolbar | `AgentPanel.tsx` prompt bar JSX |

**The problem:** All of the above operates on a separate `testMessages` state and renders in a separate test panel that replaces the agent panel content when `project.testMode === true`. This is the old paradigm.

---

## What changes

### Core migration: testMessages → messages

The test panel (`project.testMode && (...)`) and `testMessages` state are removed. Instead, test answers appear **inline in the main `messages` array**, interleaved with build messages. There is one conversation — build and test happen in the same thread.

The mode switch (prompt bar pill) controls routing only: in test mode, `processText` routes to Spotter instead of the build agent. Messages from both modes share one list.

---

## New message types in `messages`

Add to the existing message `type` union:

```typescript
type: 'spotter-answer'   // Spotter Q&A result — replaces TestMsg in old testMessages
type: 'spotter-user'     // User question in test mode (distinct visual from build user bubble)
type: 'coaching-prompt'  // "What was wrong?" coaching question card
type: 'coaching-result'  // Coaching debug steps + outcome card
```

`spotter-answer` carries the same fields currently on `TestMsg`:
`answerTitle`, `answerDesc`, `chips`, `workingSteps`, `workingExpanded`, `revealedSteps`, `answerRevealed`, `chartData`, `feedbackState`, `feedbackAnswer`, `sourceQuestion`.

---

## Mode switch wiring

**When Build pill is active:**
- Prompt bar placeholder: "Describe a task, or '@' to mention tables."
- `processText` routes to existing build agent logic (unchanged)
- Test pill: enabled only when `buildStep !== 'empty'` — grayed out at 35% opacity otherwise

**When Test pill is active:**
- Prompt bar placeholder: "Ask a question about your data…"
- `processText` routes to `handleSpotterQuestion(text)` instead of build agent
- Build pill remains clickable — user can switch back at any time
- The connection pill (left slot) stays visible and functional

**`handleSpotterQuestion(text)`** — replaces `sendTest()`:
1. Appends `{ type: 'spotter-user', content: text }` to `messages`
2. Looks up `SPOTTER_ANSWERS[text]`
3. Appends `{ type: 'spotter-answer', ...answer fields, feedbackState: 'pending' }` to `messages`
4. Animates `revealedSteps` and `answerRevealed` as currently done in `sendTest()`

---

## Spotter answer card anatomy

Rendered inline in the conversation when `msg.type === 'spotter-answer'`.

```
┌─────────────────────────────────────────────────────────┐
│ ◎  Spotter                               [working steps ›]│
│                                                           │
│  ROAS by Campaign and Channel                            │
│  Here's the return on ad spend across your active        │
│  campaigns...                                            │
│                                                           │
│  [# ROAS] [campaign_name] [channel != 'organic'] ...     │
│                                                           │
│  [bar chart]                                             │
│                                                           │
│ ─────────────────────────────────────────────────────── │
│  Looks right ✓          Something's off ✗               │
└─────────────────────────────────────────────────────────┘
```

**Feedback row** — only visible when `answerRevealed === true && feedbackState === 'pending'`:
- "Looks right" → `handleFeedback(msgId, 'correct')` → row collapses, small ✓ confirmation appears, conversation continues
- "Something's off" → `handleFeedback(msgId, 'incorrect')` → row collapses, triggers coaching flow (see below)

After feedback is given (`feedbackState === 'answered'`), the row is replaced by a single line:
- Correct: `✓ Marked as correct`
- Incorrect: `✗ Flagged — coaching below`

---

## Feedback → coaching handoff

When user clicks "Something's off":

**Step 1 — coaching-prompt card appears** in `messages`:

```
┌─────────────────────────────────────────────────────────┐
│ What was wrong with this answer?                        │
│                                                           │
│  ○  The number is wrong                                 │
│  ○  The time period is wrong                            │
│  ○  Wrong columns or tables are being used              │
│  ○  The join between tables is wrong                    │
│  ○  Something else                                      │
└─────────────────────────────────────────────────────────┘
```

User clicks an option. The card locks (option highlighted, others dimmed).

**Step 2 — coaching-result card appears** — animated debug steps, same pattern as existing `coaching-debug` rendering:

```
┌─────────────────────────────────────────────────────────┐
│ Investigating: The number is wrong                      │
│                                                           │
│  ✓  Traced metric definition                            │
│  ✓  Checked join logic for campaign_id                  │
│  ✓  Found 18% null campaign_id — organic orders not    │
│     attributed. Spotter counted them as $0 spend.       │
│                                                           │
│  [Fix: Add null filter to campaign_id]                  │
│  [Tell me more]                                          │
└─────────────────────────────────────────────────────────┘
```

**Step 3 — build agent fires the fix** — `switchToBuildWithContext()` already does this. It appends a user bubble to `messages` ("I tested X — number is wrong") and fires the relevant coaching script (`coaching_number_wrong`, etc.). The fix appears as a normal build agent response in the same conversation.

**Step 4 — re-test offer** — after the coaching script completes, the agent appends a final message:

> "Fixed. You can ask that question again in test mode to verify."

This is a simple text response appended at the end of the coaching script's `steps` array. No new mechanism needed.

---

## Changes to switchToBuildWithContext

Currently this function calls `setProject(p => ({ ...p, testMode: false }))` — which was switching away from the old test panel. In the new paradigm:

- Remove `setProject testMode: false` call (test mode is controlled by the prompt bar pill, not project state)
- Switch the prompt bar pill to Build mode: add a `setTestMode(false)` call (new local state in AgentPanel, not on project)
- Everything else stays the same

---

## Mock scenarios to add

Currently only 2 SPOTTER_ANSWERS exist. Add 2 more to support the coaching demo arc:

**"What is revenue by region?"** — answer works, number is correct, analyst marks it correct. Shows the happy path.

**"What is the budget utilisation rate?"** — Spotter can't map "budget utilisation" cleanly. Answer comes back with a fallback message and no chart. Analyst marks "something's off" → "Wrong columns or tables" → coaching finds `budget` column has no description, synonym missing → fix applied → re-test works.

These two additions let the demo show both outcomes: test passing cleanly and test triggering a coaching fix.

---

## Files to touch

| File | Change |
|---|---|
| `AgentPanel.tsx` | Main work: remove testMessages state + test panel JSX, add spotter-user/spotter-answer message rendering, wire mode switch, update switchToBuildWithContext, add 2 SPOTTER_ANSWERS |
| `Workspace.tsx` | No change — test mode no longer sets project.testMode, workspace doesn't need to know |
| `index.tsx` | No change |
| `reference.md` | Update ProjectState section — `testMode` may no longer need to be on ProjectState if it moves to local AgentPanel state |

---

## What NOT to build in this session

- Implicit coaching (agent observing failed queries autonomously) — deferred per design decision
- Liveboard creation from test answers — not allowed in draft state
- Saving test answers to Created — answers stay in chat history only
- Re-test as a separate button/flow — the prompt bar in test mode is sufficient

---

## Interaction arc for the demo

Publish is a separate flow and not part of this arc. The test+coaching arc is complete when the re-test passes.

1. Model is built (buildStep = 'healthy')
2. User switches to Test mode via prompt bar pill
3. User asks "What is our ROAS by campaign and channel?" — correct answer, marks "Looks right"
4. User asks "What is the budget utilisation rate?" — Spotter can't answer cleanly
5. User clicks "Something's off" → "Wrong columns or tables"
6. Coaching debug runs → finds missing description on `budget` column
7. Agent fixes it (switches to build mode) → "Fixed. You can ask that question again to verify."
8. User switches back to test mode → asks "What is the budget utilisation rate?" → correct answer this time
9. User marks "Looks right" → arc complete
