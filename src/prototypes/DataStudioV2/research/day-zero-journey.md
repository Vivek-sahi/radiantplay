# Research: Day Zero Journey — "Zero to model in ThoughtSpot"

_Journey spec. Not a decision doc — a full narrative map for the prototype._

---

## Narrative goal

Show that a new ThoughtSpot user can go from a completely empty platform to a published,
cached, quality-checked model — without leaving the product, without waiting on a data
engineer, and without any third-party tools. Everything happens inside Data Studio, guided
by the agent.

The story ends with a specific feeling: **"I didn't get blocked once."**

---

## Entry point: Journeys on the Overview page

Add a **Journeys** section to the Overview page, above or below the Recent projects section.
It surfaces guided narrative flows — Day Zero is the first. Day N (monitoring + optimization)
is the second, to be specced separately.

**Journeys section layout:**
- Section label: "Journeys"
- One card per journey. Each card has:
  - Title ("Getting started with ThoughtSpot")
  - One-line description ("From warehouse to first model — guided by the agent")
  - Estimated time ("~10 min")
  - A "Start journey" button / CTA

For this spec: one card, "Day Zero — Get your first model live."

---

## Full journey map

### Step 0 — Journey picker screen
_Triggered by "Start journey" on the Overview card._

A full-page or modal overlay. Not the workspace yet — a dedicated pick screen.

**What the user sees:**
- Heading: "How do you want to start?"
- Two large option cards side by side:
  - **"Connect your data warehouse"** — Snowflake, BigQuery, Redshift, etc. Your own data.
  - **"Start with sample data"** — a pre-loaded retail dataset. No credentials needed.
- Small note: "You can always connect your warehouse later."

**Decision for the build:** Both paths enter the same workspace + agent flow. Sample data
path skips the connection setup steps and seeds the workspace with the existing mock data
(orders, campaigns, users). Warehouse path goes through Steps 1–2 before the build.

---

### Step 1 — Empty canvas + agent greeting (warehouse path only)
_User lands in a fresh Workspace. `buildStep: 'empty'`. Agent panel is open._

This replaces the current "Tell me about the model you want to build" empty state for the
Day Zero journey context. The agent greets first, before the user types anything.

**Agent opening message (auto-plays, no user prompt):**

> "Welcome. I don't see any data connected to your workspace yet.
> Would you like to **connect your data warehouse**, or use **sample data** to explore first?"

Two inline chips / buttons:
- "Connect warehouse"
- "Use sample data"

If "Use sample data" → skip to Step 3 (use case prompt), seeded with mock data.
If "Connect warehouse" → proceed to Step 2.

**What's new here:** A new SCRIPT entry `day_zero_greeting` that auto-fires when the
journey context is 'warehouse' and `buildStep === 'empty'`. The current empty state flow
starts on user input — this one starts on agent initiative.

---

### Step 2 — Agent-driven connection setup
_Agent guides the user through connecting a warehouse. Stays inside the agent panel._

**Script outline — `day_zero_connect_warehouse`:**

Working steps (animated, sequential):

1. **"Which data warehouse are you connecting to?"**
   Chips: Snowflake · BigQuery · Redshift · Databricks · Other
   User selects → Snowflake (for the demo path).

2. **"Great. What are your Snowflake credentials?"**
   Agent renders an inline credential form in the chat:
   - Account identifier (e.g. `xy12345.us-east-1`)
   - Username
   - Password or key-pair toggle
   - Warehouse name
   - Database + Schema (optional at this step)
   Submit button: "Connect"
   (Form is mock — submitting always succeeds after a 2s simulated delay.)

3. **Working steps while "connecting":**
   - Verifying credentials...
   - Fetching available schemas...
   - Connection established.

4. **Agent outcome message:**
   > "Connected to Snowflake — I can see 3 schemas. Which one contains the data you
   > want to work with?"
   Schema chips: `analytics` · `marketing` · `raw_data`
   User selects → `analytics`.

5. **Agent response:**
   > "Got it. I'll use the `analytics` schema. Now tell me what you want to build."

→ Proceed to Step 3.

**What's reused:** The connection created here maps to the existing Connections page
(wired but visual-only). The agent outcome card can show a "View connection →" link.

**What's new:** SCRIPT `day_zero_connect_warehouse`, inline credential form component
inside AgentPanel (similar pattern to DataQualityPlanModal — modal triggered by a CTA),
simulated 2s loading state with working steps.

---

### Step 3 — Use case prompt + build
_Agent asks for the use case. User types. Agent clarifies, then builds._

**Agent message:**
> "What do you want to understand with this model? Tell me the business question,
> and I'll figure out the tables."

User types a use case (e.g. "I want to understand campaign ROI by channel and region").

Agent asks 1–2 clarifying questions (existing pattern from `build_project` clarification
steps). Then runs the full build workflow.

**What's reused:** Existing `build_project` SCRIPT entirely. No new script needed here.
The build populates the LeftPanel (tables, joins, formulas), ColumnsView, and the canvas
header identity.

After build completes, `buildStep` reaches `'healthy'`. The quality indicator in the
canvas header shows "9 quality issues" (red chip). The caching indicator shows "Live query".

---

### Step 4 — Quality surfaced + agent prompt to review
_No user action required — agent notices the quality state and proactively surfaces it._

After the build outcome card settles, the agent sends a follow-up message (1.5s delay,
`autoComplete: true`):

> "Before you test this, I noticed **9 data quality issues** — nulls, duplicates,
> and anomalies across several columns. I'd recommend reviewing these now so your
> answers are accurate from the start."
> CTA button: "Review issues →"

Clicking "Review issues →" triggers the existing `review_data_quality` script +
`DataQualityPlanModal`. No new script needed — just a new CTA message entry that
auto-fires post-build in journey context.

**What's new:** A post-build follow-up message that fires automatically in Day Zero
journey context. A flag on the project state (`journeyContext: 'day_zero'`) would
gate this behavior so it doesn't change the non-journey build flow.

---

### Step 5 — Quality fix: agent prepares plan, user applies
_User clicks "Review issues →". DataQualityPlanModal opens._

This is the existing flow exactly:
- 9 issues displayed in a flat table, grouped by severity
- User can review, filter, edit fix labels
- "Apply (N)" applies selected fixes → `prepTransforms` written → quality chip turns green
- Agent sends confirmation: "9 issues resolved. Your model is ready to test."

**What's reused:** `review_data_quality` SCRIPT, `DataQualityPlanModal`, `prepTransforms`
state, quality indicator green state. Nothing new to build.

---

### Step 6 — Test (seamless, no manual publish step)
_Agent suggests testing after quality is resolved._

After the quality resolution message, agent adds:

> "Ready to test? I've set this up so you can query it right now — no publishing
> needed to start."
> CTA button: "Start testing →"

Clicking "Start testing →" switches to the Test tab in the agent panel. The existing
test mode flow takes over: user asks a question, gets an answer, gives feedback
(Correct / Incorrect), coaching flow if incorrect.

**Coaching + agent memory:**
When the user gives "Correct" feedback or after the coaching fix is applied, the agent
sends a note:
> "Noted — I've added that to this model's context so future answers stay consistent."

This is narrative framing — no new data structure needed in the prototype. The agent
simply says it and the user believes it. If we want to make it visual: a small "Memory
updated" indicator on the agent avatar after a coaching fix (could be a green dot flash).

**What's reused:** Test tab, existing test flow, `correct`/`incorrect` feedback,
coaching SCRIPTS. Minor new: post-feedback "Noted" message and optional memory indicator.

---

### Step 7 — Caching decision
_Triggered by user clicking the "Live query" chip in the canvas header._

No change to the existing caching flow. The agent can optionally prompt:
> "One more thing — you're on live query, which means every question hits your warehouse.
> Want to cache this model? It'll cut your costs and speed up answers."
> CTA: "Set up caching →"

Clicking opens the existing Cache modal (recommended defaults path → apply).

**What's reused:** Cache chip, cache modal, `Cached query` state. The optional agent
prompt is new (same pattern as the quality follow-up — a post-test auto-message in
journey context).

---

### Step 8 — Publish + share
_Final step._

After caching, agent sends:
> "You're all set. Publish this model to make it available to your team."
> CTA: "Publish →"

Clicking "Publish →" triggers the existing publish flow (version bump, `publishedVersion: 1`).
After publish, agent sends the journey close message:

> "Done. Your first model is live — cached, quality-checked, and ready for Spotter.
> You brought data from your warehouse, fixed quality issues, and built a production
> model, all inside ThoughtSpot."

A small "Journey complete" state appears — either a banner on the canvas header or a
final agent card. Design to be explored.

---

## What's new vs. what's reused

| Piece | Status | Notes |
|-------|--------|-------|
| Journeys section on Overview | New | One card; "Start journey" CTA |
| Journey picker screen | New | Two options: warehouse / sample data |
| `day_zero_greeting` SCRIPT | New | Auto-fires on agent init, warehouse path |
| `day_zero_connect_warehouse` SCRIPT | New | Multi-step: picker → inline form → working steps → schema select |
| Inline credential form in AgentPanel | New | Similar to quality modal pattern — triggered by script CTA |
| `journeyContext` flag on ProjectState | New | Gates the auto-fire follow-up messages; doesn't affect non-journey flows |
| Post-build quality follow-up message | New | Auto-fires in journey context after `build_project` completes |
| Post-test caching nudge message | New | Auto-fires in journey context after first test interaction |
| Journey close card / "complete" state | New | Design to be explored in Playground |
| Build flow (`build_project`) | Reused | Unchanged |
| Quality review + DataQualityPlanModal | Reused | Unchanged |
| Test tab + coaching | Reused | Minor: "Noted" confirmation message added |
| Cache modal | Reused | Unchanged |
| Publish flow | Reused | Unchanged |
| Connections page | Reused | Agent outcome card links to it |

---

## Open decisions

1. **Journey picker as overlay or full page?** Full page feels more deliberate; overlay
   feels lighter. Preference TBD — explore both in Playground.

2. **Sample data path:** Does it also show the agent greeting, or does it skip straight
   to the use case prompt? Recommendation: show a lighter greeting ("Using sample retail
   data — orders, campaigns, users. What do you want to build?") to maintain the guided
   feel.

3. **Credential form placement:** Inline in the agent chat scroll, or a modal triggered
   by a CTA in the chat? Inline is more immersive; modal is simpler to build. Lean toward
   inline (same scroll as the rest of the conversation) but worth a quick Playground pass.

4. **"Journey complete" state:** Banner on canvas header? Full-page moment? Subtle agent
   card? This is a narrative payoff moment — should feel earned but not over-produced.
   Needs a Playground exploration.

5. **`journeyContext` scoping:** Should the auto-fire follow-up messages be gated strictly
   to Day Zero, or should they become the default post-build behavior for all new projects?
   Lean toward journey-gated for now (simpler, doesn't disturb existing demo flows).

6. **Agent memory visualization:** "Noted — I've added that to this model's context."
   Is a text message enough, or should there be a small visual (e.g. a momentary glow on
   the agent avatar, or a "Model context updated" chip in the subheader)? Open — could
   be a 30-min Playground exploration.

---

## Explorations needed before building?

Yes — two specific things:

1. **Journey picker screen** — try 2 directions: (a) full-page with large illustrated
   option cards, (b) compact modal. Need to see which feels right at the scale of the
   prototype.

2. **Journey complete state** — try 3 directions: (a) agent card with summary, (b) banner
   + confetti-style moment, (c) subtle header state change. Don't over-invest — one
   quick pass per direction.

Everything else (connection form inline, auto-fire messages, Journeys section on Overview)
can be built directly without a Playground pass.

---

## Build order (when ready)

1. `journeyContext` flag + Journeys section on Overview + "Start journey" CTA
2. Journey picker screen (after Playground exploration)
3. `day_zero_greeting` SCRIPT + empty canvas greeting for warehouse path
4. `day_zero_connect_warehouse` SCRIPT + inline credential form
5. Post-build quality follow-up message (auto-fire in journey context)
6. Post-test caching nudge message
7. Journey complete state (after Playground exploration)
8. Sample data path (lighter variant of Steps 0–1)

---

## Out of scope for this spec

- Day N journey (monitoring + optimization) — to be specced separately
- Real credential validation / actual Snowflake connection
- Multi-journey management / resuming a journey
- dbt path (journey picker has the option but the flow is deferred)
