# Research: Day Zero Journey — "Zero to model in ThoughtSpot"

_Journey spec. Updated 2026-05-06 with session decisions. Build-ready._

---

## Narrative goal

Show that a new ThoughtSpot user can go from a completely empty platform to a published,
cached, quality-checked model — without leaving the product, without waiting on a data
engineer, and without any third-party tools. Everything happens inside Data Studio, guided
by the agent.

The story ends with: **"I didn't get blocked once."**

---

## The four journeys (vision)

| # | Journey | Status | Overview entry state |
|---|---------|--------|----------------------|
| 1 | **Get started** — Day Zero, warehouse to first model | Building now | Empty state (new) |
| 2 | **Monitor & optimize** — Day N, improve existing models | Teammate building | Existing overview (10–20 models + alerts) |
| 3 | **Debug issues** — diagnose and fix a broken model | Later | Same as Journey 2 |
| 4 | **dbt plug-and-play** — import and publish a dbt project | Later | Same as Journey 2 |

Journey 2–4 land on the same overview screen. Only Journey 1 is built in this session.
Journeys 2–4 appear on the picker but are not clickable (locked/greyed out).

---

## New work in this session

Two things are genuinely new:

1. **Journey infrastructure** — picker screen, journey switcher (bottom-left shell pin),
   empty-state overview for Day Zero.
2. **Connection flow + clarifying questions** — four new agent conversations that don't
   exist anywhere in the prototype yet.

Everything from "use case prompt → build → quality → caching → publish" is reused unchanged.

---

## Journey infrastructure

### Journey picker screen
_Entry: clicking "Start journey" button on the Overview page, OR the journey switcher pin._

Full-page screen (not a modal). Shows all four journeys as cards. Only Journey 1 is active;
2–4 are greyed out with a "Coming soon" label.

Each card:
- Journey number + title
- One-line description
- For Journey 1: "Start →" CTA button
- For Journeys 2–4: greyed out, "Coming soon" label

Clicking "Start →" on Journey 1 → navigate to the Day Zero empty-state overview.

---

### Journey switcher (shell pin)
_A new item pinned to the bottom of the left sidebar in Shell.tsx._

Visually: a small icon button (e.g. a compass or map icon) pinned below the main nav
items, separated by a divider. Always visible. Clicking it opens the journey picker.

**Implementation note:** additive change to Shell — new `pinnedBottom` slot or a simple
absolute-positioned element at the bottom of the sidebar. Does not touch existing nav
items or routing logic.

---

### Empty-state overview (Day Zero entry)
_What the user sees when they start Journey 1._

This is a **new component** (`DayZeroOverview.tsx`), not a modification of `Overview.tsx`.
`index.tsx` routes to it when `journeyContext === 'day_zero'`.

**Layout:**
- Same shell (left nav, header) as the regular overview
- Center: a hero area with the agent prompt bar (same `PromptBar` component)
- Below the prompt bar: two card rows

**Card row 1 — "Connect your warehouse":**
Horizontal row of warehouse icon cards: Snowflake · Redshift · BigQuery · Databricks · More
Each card: warehouse logo + name. Clicking one (Snowflake for the demo) opens the
workspace with `journeyContext: 'day_zero'` and `warehouseTarget: 'snowflake'` pre-set,
and auto-fires the `day_zero_connect_warehouse` SCRIPT.

**Card row 2 — "Start with an existing model":**
A single card. Clicking it opens the existing `NewProjectPrompt` / workspace empty state.
(Not the Day Zero flow — this is the escape hatch for users who already have something.)

No recent projects. No alerts. No other sections. Clean.

---

## Connection flow (new agent work)

Four sequential conversations inside the agent panel. Uses all existing agent patterns:
shimmer for working steps, `autoComplete: true` for non-interactive steps, chips for
single-select choices.

### Conversation 1 — Warehouse already chosen (from the card click)

Agent opens with a confirmation, not a question (user already clicked Snowflake):

> "Connecting to Snowflake. I'll need your credentials."

Immediately transitions to Conversation 2.

---

### Conversation 2 — Credentials

Agent message:
> "What are your Snowflake credentials?"

Agent renders an **inline credential form** in the chat. This is a new UI component —
a compact form card that appears inside the agent message scroll, not a modal.

Fields:
- Account identifier (`xy12345.us-east-1`)
- Username
- Password (masked)
- Warehouse name
- Database (optional)

Submit button: "Connect"
(Mock — always succeeds after a 2s delay.)

**Design pattern:** same visual language as the agent outcome card — bordered card,
`background-subtle` fill, Radiant `TextInput` components. Submit calls the next script.

---

### Conversation 3 — Working steps (connecting)

After submit, agent shows working steps (shimmer + sequential reveal, existing pattern):

- Verifying credentials...
- Fetching available schemas...
- Connection established.

Outcome card:
> "Connected to Snowflake. Found 3 schemas."
> [View connection →] (links to Connections page)

---

### Conversation 4 — Schema + clarifying questions

Agent:
> "Which schema contains the data you want to work with?"

Chips: `analytics` · `marketing` · `raw_data`
User selects → `analytics`.

Agent:
> "Got it. Now tell me what you want to build — what's the business question?"

User types use case (e.g. "Campaign ROI by channel and region").

**Clarifying questions (new agent pattern):**

Instead of building immediately, the agent asks 1–2 focused questions before starting.
This is the new interaction — the agent doesn't assume and fire; it briefly confirms.

Example exchange:
> "A couple of quick questions before I start:"
> "1. Is this for a marketing team, or broader across the org?"
> "2. Do you want to include spend data alongside ROI, or just ROI?"

User answers in plain text or chips (design TBD — probably plain text reply for a
natural feel). After both answered, agent transitions to the build:

> "Got it. Building your campaign ROI model now..."

Then existing `build_project` SCRIPT fires. No changes to that script.

**What's new about clarifying questions:**
- The agent initiates a multi-turn Q&A before the script (currently the build starts on
  the first message).
- Needs a new `awaitingClarification` state in AgentPanel — the panel is in a "listening"
  mode, collecting answers, before the build script fires.
- After N answers (2 for demo), the agent synthesizes and launches the build.

---

## What's reused, unchanged

- `build_project` SCRIPT — no changes
- `review_data_quality` SCRIPT + `DataQualityPlanModal` — no changes
- Test tab + coaching SCRIPTS — no changes
- Cache modal — no changes
- Publish flow — no changes
- `Overview.tsx` — **not touched** (teammate's file)

---

## Merge strategy

The teammate is building Journey 2 (monitoring) and making changes to `Overview.tsx`.
Their prototype has no journey infrastructure (no picker, no switcher).

**Rule: Journey infrastructure lives in new files and additive changes only.**

| File | What we do | Teammate can do |
|------|-----------|-----------------|
| `Overview.tsx` | **Do not touch** | Free to modify |
| `DayZeroOverview.tsx` | New file, we own it | No conflict |
| `JourneyPicker.tsx` | New file, we own it | No conflict |
| `Shell.tsx` | Additive: add pinned bottom slot | No conflict if they don't touch Shell |
| `index.tsx` | Add `journeyContext` state + route to `DayZeroOverview` | Minor merge — just route additions |
| `data/mockData.ts` | Add journey mock data if needed | Minor merge — additive |
| `AgentPanel.tsx` | Add `awaitingClarification` state + new SCRIPTS | They likely won't touch this |

When they merge their work in: `Overview.tsx` merges cleanly (we never touched it).
`index.tsx` gets a 3-way merge on route additions — manageable since both sides are
adding new routes, not editing the same ones. Shell gets a clean merge if we add the
bottom pin as a new prop/slot.

**The critical discipline:** never import from or modify `Overview.tsx` in our Day Zero
work. The journey picker just navigates to `DayZeroOverview` (our file) or to `Overview`
(their file) — `index.tsx` is the only router and it keeps the two separate.

---

## Out of scope (locked)

- Sample data path
- Journey complete state (quality → cache → publish → share is the existing flow, unchanged)
- Agent memory visualization
- Journey 2, 3, 4 implementation
- dbt connection path
- Real credential validation

---

## Build order

1. Journey infrastructure
   - `JourneyPicker.tsx` (4 cards, only #1 active)
   - Shell: pinned bottom journey switcher button
   - `index.tsx`: `journeyContext` state + route to picker + route to `DayZeroOverview`

2. `DayZeroOverview.tsx`
   - Hero prompt bar
   - Warehouse icon cards (Snowflake, Redshift, BigQuery, Databricks)
   - "Start with existing model" card

3. Connection flow scripts
   - `day_zero_connect_warehouse` SCRIPT (Conversations 1–3: greeting → credential form → working steps)
   - Inline credential form component inside AgentPanel
   - Conversation 4: schema chips + clarifying questions

4. Clarifying questions pattern
   - `awaitingClarification` state in AgentPanel
   - 2-question exchange before `build_project` fires

5. Verify the handoff into existing build flow is seamless
