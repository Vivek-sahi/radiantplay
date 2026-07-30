# Data Studio — demo readiness plan

_The run-of-show script (`data-studio-run-of-show.html`) is now the spec. 5:00, six beats, states S1–S20. This is the task list to get the prototype there, and a proposed split across people._

---

## Where we actually are

Verified against code on 2026-07-29, not against CONTEXT.md:

- **Capabilities largely exist.** Confidence-scored table suggestions with per-table reasoning are built (`AgentPanel.tsx:242–244`). Notebook, spreadsheet formula, AIRS panel, publish, Spotter Q&A all exist.
- **The scenario doesn't.** Everything is wired to `marketing_db` (orders / campaigns / users) and the Pendo/NPS demo. The script tells a churn/renewal story.
- **The interaction model doesn't.** The script has Maya *only* typing — the agent reads connections, sequences three sources unprompted, proposes joins, writes the Jira script, applies fixes. Our canvas is direct-manipulation. These are two different products sharing a screen.
- **AI readiness is about half there.** Two of the script's four findings don't exist, including the one the beat's argument rests on.

---

## Decisions to make first

These gate real work. Worth settling before anyone starts.

| # | Decision | Why it blocks |
|---|---|---|
| **D1** | Does the demo run on **Vision** or **POC**? | Two noticeably different demos. Every build task below targets one of them. |
| **D2** | Agentic-everything: does it **replace** direct manipulation, or coexist behind a mode? | Determines whether the canvas work is rebuilt or wrapped. Biggest single call here. |
| **D3** | How far does **SpotterX UX adoption** go — full shell, or borrow chat blocks? | Sets the size of Workstream E from days to weeks. |
| **D4** | Which beat gets the long slot — **AI readiness (60s)** or **Model Cache**? | The script raises this itself. Changes where fidelity effort goes. |
| **D5** | Who drives — **VP narrates** or **SE drives**? | Script says the on-screen lane becomes a cue sheet if an SE drives. |

---

## Workstream A — Scenario and mock data

Mechanical, self-contained, and it unblocks the visible correctness of every beat. Highest leverage per hour.

- **A1.** Add churn tables to `mockData.ts`: `contracts`, `arr_snapshot`, `billing_events`, `usage_events`, `feature_adoption`. (`accounts` and `jira_cs_tickets` already exist.)
- **A2.** Re-point the agent's suggestion sets from marketing to churn — the scored+reasoned entries in `AgentPanel.tsx`, keeping the 96/94/91/38 spread the script specifies.
- **A3.** QBR sentiment CSV fixture for the S5 drag-drop.
- **A4.** The $48M renewing figure and risk-weighted ARR totals for S20.
- **A5.** Decide what happens to the Pendo/NPS demo-mocks (SQL-derive merge, sentiment reveal, Fix-with-AI). They're hardcoded to `pendo_nps_enriched` — re-point or park.

⚠️ Hard rule still applies: table and column names come from `mockData.ts`. Add them there first, don't invent them inline.

---

## Workstream B — AI readiness (S15–S18)

The script's own build note: *"A generic '3 issues found' wastes the only capability with no competitive answer."* Current `AIR_ITEMS` is seven flat coverage-style checks.

- **B1.** Named ambiguous-column finding — script wants `acct_st` called out by name. We report coverage counts ("2 of 12 mapped") instead.
- **B2.** Fan-out as a *readiness finding*. It exists in `EvalView.tsx` and in agent narration, but the AIRS `joins` check is positive-only ("model structure looks good").
- **B3.** **Metric-definition check** — *"Renewal Risk has no definition an LLM can reason from."* Doesn't exist in any form. This is the punchline of the differentiator beat; without it the argument is asserted, not shown.
- **B4.** Restructure into the "three layers checking in sequence" the script describes (S15). Currently flat.
- **B5.** Score-climb animation. Script: *"the only place worth spending a real animation."*

---

## Workstream C — Starting screen

- **C1.** Data Workspace's empty screen becomes the Data Studio landing, renamed.
- **C2.** S1 state: centred prompt bar, cursor blinking, nothing else on canvas.
- **C3.** Type-on animation into the prompt bar, then Enter. Script is explicit: *"Don't make them click a fake button."*

---

## Workstream D — Agentic interaction model

**Large + new territory → research doc before code.**

- **D-R1.** Research: co-pilot vs autopilot, where autonomy lives, what stays direct-manipulation, and how an agent-driven action reads on a canvas built for dragging. Feeds directly off decision D2.

Then, per beat:

- **D1.** Agent reads a connection and ranks tables unprompted (S3) — built, needs re-pointing.
- **D2.** Auto-advance across sources with no new prompt (S4). Script calls the auto-advance "itself the point."
- **D3.** Background caching — progress moves to a chip, she navigates away, toast brings her back (S6–S7).
- **D4.** Agent has already proposed joins on return, unprompted (S7).
- **D5.** **Jira live-pull** (S8–S10): inline credential intake, scoping round, agent writes the script, Review-or-Run. New pattern — our connections flow is Snowflake-shaped and assumes a connection exists.
- **D6.** Agent applies readiness fixes one at a time (S17).

---

## Workstream E — SpotterX / SpotterModel UX

**Large + new territory → research before code.** Couple this with D — if every action is agentic, the chat surface *becomes* the primary UI, which is what the SpotterX shell is for. Deciding them separately means designing the same thing twice.

- **E-R1.** Audit what we already have: `SpotterXShell.tsx` arrived with Komal's merge, and `@spotter/*` is a real DS layer. This may be less green-field than it feels.
- **E-R2.** Scope call (D3), then replace the placeholder agent chat with real Spotter patterns.

---

## Workstream F — carried over

- **F1.** POC/Vision gating review — 71 regions (`2026-07-28-poc-vision-gating-review.md`). Three regressions found and fixed so far.
- **F2.** Canvas background treatment — deferred minor polish.
- **F3.** Four dead-code type errors from the merge.

---

## Build-first, per the script

Three states carry the demo. Highest fidelity here; the rest can be static.

1. **S3** — confidence-scored suggestions with hover reasoning. *Built; needs re-pointing (A2).*
2. **S11** — the genuinely editable notebook line (`priority in (P1, P2)`, re-run, row count drops). *Not verified end-to-end.*
3. **S16** — named, specific readiness findings. *Half built (B1–B3).*

---

## Proposed split

| Who | Takes | Notes |
|---|---|---|
| Person 1 | **A** — scenario + mock data | Self-contained. Unblocks everyone else's demo strings. Start here. |
| Person 2 | **B** — AI readiness | Independent surface, minimal collision with A. |
| Person 3 | **C + F** — starting screen + gating cleanup | Both mechanical, both low-collision. |
| Person 4 | **D-R1 + E-R1** — research | One person, both together, before anyone builds the interaction rework. |

**Dependency to watch:** D and E should land as decisions before D1–D6 or E-R2 are built. A, B, C and F can all run in parallel today.

**Collision risk:** A2, B1–B3 and D1 all touch `AgentPanel.tsx` / `ModelCanvas.tsx`. Worth agreeing who owns which region, or sequencing A2 ahead of the rest.

---

## Open question not yet raised with the team

The script mentions AgentDB — that's **Near Store** now. If the "where cached data lives" line stays in, the name needs updating in the script itself.
