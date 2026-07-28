# Plan Mode — Research & Design Proposal

_Research session: 2026-05-11_

---

## Problem statement

Building a data model takes 8–10 minutes and is cost-intensive — think ~$100 per build. Users cannot blindly commit to that. The plan is the **cost-control checkpoint**: before the expensive, time-consuming operation starts, the user needs to see exactly what will be built and confirm it is correct.

This means:
1. **Control before the build starts** — the plan is detailed enough that the user can genuinely approve or push back, not rubber-stamp
2. **Transparency during the build** — they can see what's happening and where the agent is across those 8–10 minutes
3. **A comprehensive spec, not a summary** — all columns listed, all relationships, all tables, all sample questions. The full picture, not a one-liner

Today's flow: clarify → requirement summary card → "Yes, build it →" → working step animations → outcome. The requirement summary card is too light (one or two sentences) and the working steps are too opaque (they convey motion, not meaning). Plan mode addresses both.

---

## Prior decision context — why plan mode was rejected before

`knowledge/patterns.md` has this entry:

> ❌ Step-by-step agentic flow with frequent confirmation
> Three patterns exist:
> 1. Step-by-step with confirmation — poor UX
> 2. **Plan mode (show plan, user reviews, then execute) — too much to read, low follow-through**
> 3. One-shot build, user modifies after — right for DataStudio

That rejection was correct for *code editor plan mode* — a markdown file with file paths, function names, and implementation details that the user cannot meaningfully review. Users scan and rubber-stamp because they lack the domain knowledge to push back.

**DataStudio's plan is structurally different.** The content — tables, relationships, columns, sample questions — maps exactly to the spec document that business stakeholders and data team members already exchange as Google Sheets. The user IS the domain expert here. They know if `campaign_id` should join to `ad_spend`. They know if "revenue by region" is a question they need answered. The plan gives them something they can genuinely review and correct.

The failure mode (too much to read, low follow-through) is avoided by:
- Structured sections, not a wall of text
- Business language, not technical syntax
- Scannable card UI, not a markdown file
- A clear, consequential approval gate ("8-minute build starts here")

---

## How Claude Code plan mode works

- **What it is:** A read-only permission state. Agent can read/grep/glob but cannot edit or write files.
- **What a plan looks like:** A markdown file with four phases — Initial Understanding, Design, Review, Final Plan. Stored in a `/plans` folder. "Concise enough to scan quickly, but detailed enough to execute."
- **Review:** User sees the markdown file. Can edit it directly. Then approves → execution begins.
- **Key insight (Armin Ronacher):** "I feel more in control if I have a file on disk I can see, read, review, and edit before acting on it." The plan's value is human legibility + editability, not technical detail.
- **Critique:** Enforced through prompt injections, not tool locks. UX feels like a mode switch; complexity doesn't always justify the value for simple tasks.

**What to take:** The idea that the plan is a reviewable, editable artifact the user owns before execution. The plan as a "file you can see and edit" — translated to DataStudio as a card the user can iterate on.

**What to leave:** The markdown format. The mode-switch feel. The technical implementation detail (file paths, function names) — not relevant to a data model spec.

---

## How Cursor plan mode works

- **Generation:** Agent researches the codebase, asks clarifying questions (interactive UI in v2.1 — not just text, actual answer options), then generates the plan.
- **Format:** Markdown with file paths and code references. Stored in home directory or workspace.
- **Interaction:** Interactive editor to modify plan inline. Can search within plan (⌘+F). "Click to build the plan when ready."
- **Iteration:** User can answer clarifying questions and request plan updates before approving.
- **During execution:** No explicit progress tracker described in docs — execution behavior is the same as standard agent mode.

**What to take:** The clarifying questions → plan generation sequence (we already have this with DayClarifyCard). The interactive UI for answering questions (we already have this). The "click to build" as a single, explicit approval moment.

**What to leave:** The markdown + file path format. The lack of progress tracking during execution (we need this for 8-minute builds). Plan saved as a markdown file — not relevant when the plan is a UI artifact.

---

## Synthesized design proposal

### The plan as a domain-readable spec

The plan artifact maps to what the data team and business already exchange as a Google Sheet before building a model. Five sections:

| Section | What it contains | Why it matters |
|---|---|---|
| **Goal** | 1–2 sentence statement of what the model will enable ("Analyze campaign performance across channels and user segments to optimize ROI") | Sets scope, surfaces misunderstandings immediately |
| **Tables** | List of source tables with schema path (e.g., `analytics.fct_ad_spend`, `marketing.dim_campaigns`) | User can spot wrong tables or missing ones before 8 minutes pass |
| **Relationships** | Join definitions — table A → table B on key X (join type) | The highest-risk part of any model; user is the expert on whether these are correct |
| **Columns** | Key metrics + dimensions + derived formulas, grouped | User can add/remove without rebuilding from scratch after the fact |
| **Sample questions** | 4–6 questions Spotter will be able to answer once the model is live | Gives the user and their stakeholder a concrete sense of model value |

---

### Flow: where plan mode fits

```
Overview prompt →
  Full-screen chat →
    DayClarifyCard (2 questions) →
      Agent generates plan → Plan v1 card appears in chat →
        [User clicks "View plan →" → right-side panel opens]
          ↓ "Start building →"
            6-step build progress tracker → Outcome card (existing)
          ↓ "Edit the plan"
            Agent: "What would you like to change?" →
            User types request →
            Agent updates plan → Plan v2 card appears in chat →
            [loop back to review]
```

The plan replaces the current requirement summary card. It is not an additional step — it replaces a thin one-sentence card with a comprehensive, editable spec artifact.

**The edit loop in detail:**
1. User clicks "Edit the plan" in the panel footer
2. Panel closes (or stays open), agent sends a message in chat: "What would you like to change?"
3. User types in the prompt bar: e.g., "remove the fct_impressions table and add a ROAS formula"
4. Agent responds: "Updated. Here's Plan v2." → new plan card appears in chat
5. User clicks the new card → panel reopens with v2 content
6. Repeat until satisfied, then "Start building →"

---

### Plan card UI anatomy

The plan renders as a **collapsed card** inside the agent chat — not a full-expansion inline block. Clicking the card opens it in a **right-side panel** (similar to a detail drawer). This keeps the chat readable while the full plan detail lives in the panel.

**In-chat card (collapsed state):**
- Title: "Plan v1 — Campaign Performance Model" (goal headline)
- Summary line: "4 tables · 12 relationships · 38 columns · 6 sample questions"
- "View plan →" affordance

**Right-side panel (expanded state):**

Panel header:
- Title: "Build Plan" + version badge: `v1`
- Subtitle: the goal statement

Five sections — all fully expanded by default, all showing complete detail (not summaries):

1. **Goal** — full paragraph statement of what the model enables

2. **Tables** — every table included, listed as rows:
   - Schema path (e.g., `analytics.fct_ad_spend`)
   - Table name + one-line description
   - Row count / freshness if available

3. **Relationships** — every join defined:
   - Table A → Table B
   - Join key (e.g., `campaign_id = campaign_id`)
   - Join type (many-to-one, etc.)
   - No abbreviation — every relationship listed

4. **Columns** — every column that will be in the model:
   - Grouped by table, then by type (Metrics / Dimensions / Formulas)
   - Each row: column name + description + formula (if derived)
   - Toggle to include/exclude individual columns
   - This is the most detailed section — all columns, not a curated subset

5. **Sample questions** — 4–6 questions Spotter will be able to answer, drawn from the use case (e.g., "What is the ROAS by campaign last month?" not generic revenue questions)

**Panel footer — two CTAs:**
- **"Start building →"** (primary, high-weight) — commits to the build; 8–10 min, cost confirmed
- **"Edit the plan"** (secondary, ghost) — triggers the edit loop: agent responds in chat "What would you like to change?" → user types request → plan updates → new version card appears in chat

**Versioning:**
- Each edit cycle produces a new card in the chat: "Plan v2 — Campaign Performance Model"
- Clicking it opens the updated panel state
- Old version cards stay in the chat as history
- The newest version card always has the two CTAs active; older cards are read-only

---

### Build progress tracker

Once the user clicks "Start building →", the agent panel transitions to a 6-step progress view. This replaces the current working-step animations (which convey motion but not meaning).

**6 steps:**
1. Verifying warehouse access
2. Analysing table schemas
3. Designing join structure
4. Building columns and formulas
5. Writing AI context
6. Running quality checks

Each step shows:
- Icon: pending (dot) → in-progress (spinner) → done (checkmark)
- Optional: one-line sub-note when active ("Found 3 tables matching your spec", "Writing descriptions for 18 columns")
- Elapsed time counter on the active step

Steps 1–6 are fixed and known at build-start — the user sees the full ladder immediately and can track where the agent is at any moment.

---

## What we're not doing (scope decisions)

- **No per-section approval gates** — the whole plan is approved at once. This avoids the step-by-step confirmation anti-pattern.
- **No plan versioning UI in v1** — version number increments on change but no history drawer. User can request changes via prompt.
- **No plan editing by direct click in v1** — user requests changes via the prompt bar. Direct inline edit is a future enhancement.
- **Build progress is read-only** — no ability to pause or intervene during the build. If the build produces something wrong, the user corrects it after (existing pattern: one-shot build, user reacts).

---

## Open questions

- [ ] **Plan generation time:** After DayClarifyCard completes, how long does it take to show the plan? Should there be a brief "Generating your plan…" loading state, or does it stream in like a normal message?
- [ ] **Plan persistence:** If the user navigates away and comes back, is the plan still there? Likely yes — it's a chat message — but the "Start building →" CTA should only be active if in the right phase.
- [ ] **Plan for non-Day-Zero flows:** Day Zero is the obvious home for plan mode. Does it also apply when a user asks to add a new table to an existing model mid-session? Probably a lighter version (just Tables + Columns + Relationships affected, no Goal or Sample Questions needed).
- [ ] **Sample questions quality:** The plan is only as good as the sample questions. They need to be domain-relevant, not generic. The agent should draw from the clarify card answers (use case = Campaign ROI → sample questions should be about campaigns, not about generic revenue).

---

## References

- Cursor Plan Mode: https://cursor.com/blog/plan-mode
- Cursor Docs: https://cursor.com/docs/agent/plan-mode
- Cursor v2.1 changelog: https://cursor.com/changelog/2-1
- Claude Code Plan Mode analysis: https://lucumr.pocoo.org/2025/12/17/what-is-plan-mode/
