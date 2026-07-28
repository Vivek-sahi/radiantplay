# Design Decisions — DataStudio V2

A living record of intentional design choices, the reasoning behind them, and what was explicitly ruled out. Ordered chronologically within each section.

---

## 1. Overview page

### Command-center framing
The Overview is the landing page for the data team lead (Vivek's persona). It was designed as a **command center** — not a dashboard, not a home page. The primary goal is: at a glance, understand what's happening, what needs attention, and what's going well. Everything on the page serves that goal.

### Two-panel layout: Pulse + Recent
Two equal-width panels side by side. No third column, no cards grid, no list of lists.
- **Pulse** (left): active issues and opportunities — things that need a decision
- **Recent** (right): recent models — things you've been working on
- **Why not more panels:** more panels fragment attention. Two creates a clear left-right read: problems → work.

### Recent panel shows models only (not connections)
Connections are infrastructure, not work artifacts. The user's daily workflow is model-centric. Showing connections alongside models diluted the signal and made the panel feel like a mixed-purpose list.

### Health indicator: published models only
Models in draft state do not show a health dot. A draft hasn't been validated or deployed — showing "healthy" or "broken" for something that was never published is misleading. Health is a production concept.

### No fleet health strip
A "10 models · 8 healthy · 2 issues" summary strip was built and removed. Reason: the user can see all this information from the Pulse panel itself. The strip added visual weight without adding decision-making value.

### Hero section: prompt-first
The hero is centered on starting new work (a large PromptBar + 3 suggestion chips). The page subtitle is static ("Describe your goal..."). A context-aware variant ("3 issues need your attention today") was considered but not shipped — the Pulse panel already communicates urgency, so the hero doesn't need to repeat it.

---

## 2. Pulse panel

### Tabs: "Needs attention" and "Opportunities"
Instead of showing all issues in one scrolling list grouped by dividers, the panel uses two tabs. Each tab is a focused list. Reasoning:
- Debugging issues and optimization suggestions require completely different mental modes
- Mixing them in one scroll forces the user to context-switch repeatedly
- The tab badge count (e.g. "6") gives at-a-glance urgency without reading the list

### Tabs in the same header row as the panel title
The "Pulse" label and the tab strip live on one line. This avoids wasting vertical space on a header row that only contains a title. The divider between the label and the tabs acts as a subtle visual separator while keeping the header compact.

### "Needs attention" tab defaults active
Debugging issues are higher priority than optimization opportunities. The tab the user sees first is always the one that requires action. Opportunities is secondary — you look there when you have capacity.

### Row anatomy: left = all information, right = action only
Each PulseRow has a strict left/right split:
- **Left:** title (truncates first), metric (never truncates, colored by severity), context, timestamp
- **Right:** CTA + dismiss

This was arrived at after testing a "balanced" layout that distributed info across both sides. The balanced layout created cluttered eye movement — the user had to scan both sides to understand what a row was about before deciding whether to act. Keeping everything informational on the left means the user reads left-to-right: understand, then decide, then act.

### CTA: "Fix with agent →" for all debugging items
All debugging CTAs were standardized to this label. Rejected alternatives:
- "View model" — describes navigation, not action
- "Investigate" — too passive; doesn't communicate agency
- "Repair" — too mechanical; doesn't communicate that the agent does the work
- Insight-specific labels (e.g. "Resync") — inconsistent, harder to scan as a group

"Fix with agent →" is action-oriented, agent-first, and consistent across all debugging rows.

### CTAs are always blue, always visible (not hover-only)
Earlier implementation hid the CTA behind hover opacity. This made the panel feel passive — at rest it looked like an unactionable list. Making CTAs always visible signals that every row is immediately actionable.

### Dismiss button: on hover only, right of CTA
The ✕ dismiss button appears on row hover, to the right of the CTA. This placement was intentional:
- On hover: the user has indicated intent; showing dismiss is appropriate
- At rest: hiding it keeps the panel scannable without ✕ buttons competing with CTAs
- Right of CTA: natural reading order — primary action first, escape hatch second

### Tooltip on truncated titles
When a row title is long enough to truncate, a `title` attribute shows the full string on hover. The tooltip content is `title · metric` (e.g. "Source columns removed · 2 columns removed") so the full context is visible even when truncated.

### Panel height: 7 rows
Both panels use the same fixed body height (441px), sized to show ~7 rows comfortably. This creates visual balance between the two panels. Going larger made the two-column section feel overwhelming. Going smaller created too much scroll.

---

## 3. Agent chat for debugging (FullChatView)

### Debugging always opens the inline chat, not the Workspace
When a user clicks "Fix with agent →", the experience opens in `FullChatView` (a full-screen chat interface), **not** in the Workspace with the model editor.

**Why:** The model editor (columns, tables, preview) is for model creation — Vivek's workflow. Debugging is about understanding what broke and approving a fix. The user doesn't need to see the model's column list to debug schema drift; they need to understand the agent's diagnosis and make a decision. Surfacing the model editor as the primary view during debugging was adding noise.

**Object view on demand:** If the user needs to inspect a model or specific column while debugging, they tap a chip in the genUI card. The model view appears on demand — it doesn't have to be the primary layout.

### No workflow switcher
A workflow switcher (toggle between "debugging" and "model creation" modes) was built and removed. Reasoning: the two workflows serve different personas in the demo. Vivek owns model creation. The current user owns debugging. Having a switcher implied both workflows live in the same context, which diluted both. Debugging is surfaced from Pulse → inline chat. Model creation is a separate entry point.

### GenUI cards: complete picture before action
Every genUI card shown in the debugging chat shows the full scope of the problem before presenting a CTA. The pattern is: what broke → why → what will change → downstream impact → action. The user is never asked to confirm something they haven't been shown.

**Why this matters:** In production tools, confirmation dialogs without context ("Are you sure?") train users to click through without reading. A complete-picture card makes the confirmation meaningful — the user knows exactly what they're approving.

### autoComplete for low-risk, reversible fixes
Flows where the fix is safe and reversible (token rotation, re-enabling a pipeline schedule) execute automatically after the agent explains what it found. No confirm button. Examples:
- `dbt_connection_repair` — rotating an API token is reversible
- `freshness_sla_repair` — re-enabling a pipeline schedule is reversible

Flows where the fix is destructive or schema-changing require an explicit confirm:
- `schema_drift_multi_repair` — removing columns is irreversible
- `null_rate_investigation` — three valid options with different consequences

### Dependents are tappable chips — tapping shifts layout
Any downstream item (metric, query, model) affected by a broken column is shown as a chip in the genUI card. Tapping one shifts the workspace to object-first mode: the dependent fills the center panel with the broken reference highlighted in red; the agent narrows to a sidebar and sends contextual notes about what the user is viewing.

**Why:** This is the same mental model as the creation flow (object-first, agent-on-demand). Keeping the pattern consistent means users don't need to learn a different interaction for debugging vs. building.

### Three distinct debugging journey types
The three implemented journeys were chosen to cover the full spectrum of agent behavior:
1. **dbt Cloud connection repair (ins-d1):** autoComplete — low-risk, agent just does it
2. **Multi-model schema drift (ins-d3):** destructive action across multiple models — agent shows full impact, user confirms once
3. **Null rate investigation (ins-d6):** root cause is behavioral, not a bug — agent diagnoses and presents 3 options with consequences, user makes a business decision

Together these three cover: safe automation, destructive repair, and ambiguous judgment.

### NullRateCard: agent takes a position
In the null rate investigation, the agent doesn't just present options neutrally. It:
1. Diagnoses the root cause ("Not a data error")
2. Gives a recommendation ("I'd recommend Option 1 — excluding organic would undercount attribution by 18%")
3. Pre-selects the recommended option

**Why:** A truly useful agent doesn't just surface data — it synthesizes and recommends. The user can override (three radio options are always visible), but the default is the best option. This is the difference between a tool and an assistant.

---

## 4. Workspace (model editor)

### Entry point: model creation only
The Workspace is for building and editing models. It is reached via:
- Overview hero prompt → new model
- "New model" button → new-project prompt → workspace
- "Edit model" from the model detail view → workspace

It is **not** reached by clicking "Fix with agent" — that goes to the inline chat. This is a hard boundary between creation and debugging.

### dbt Cloud connection: distinct entry path
When a user opens from a dbt source, the project source is marked as `'dbt'`. This affects column view indicators and agent context but doesn't change the overall workspace layout. The distinction is preserved in `ProjectState.projectSource`.

---

## 5. Panel design

### Soft shadow + border-radius 12, no border
Panels use `box-shadow: 0 0 0 1px rgba(0,0,0,0.06), 0 2px 10px rgba(0,0,0,0.05)` instead of a solid border. This gives them a floating, card-like presence without harsh visual separation. The 1px shadow ring replaces the border — it's subtler than `border: 1px solid` because it's semi-transparent.

### Taller panel header (16px padding)
Panel headers use 16px top/bottom padding (up from 12px). The additional height adds prominence — the header reads as a title bar, not just a label. Both panels use the same header height for consistency.

### Radiant `<Tabs>` component in Pulse header
The Pulse panel uses the Radiant shared Tabs component instead of custom tab buttons. This keeps interaction consistent with the rest of the design system and avoids divergent tab styling. The horizontal padding was reduced from 24px to 12px specifically to fit the Pulse panel's narrower header.

---

## 6. Spacing and visual balance

### Background: base white for hero, sunken for content
The hero section uses `background-base` (white). The two-column section uses `background-sunken` (very light gray). This creates a hierarchy: the hero is the primary interaction area; the panels are secondary/content. The border between them acts as a visual reset.

### Equal top/bottom padding on page
The hero top padding matches the two-column section's padding (both 32px). This prevents the page from feeling top-heavy or lopsided when the panels don't fill the full viewport height.

### Row padding: 14px top/bottom
Individual rows in both Pulse and Recent use 14px vertical padding. This was set to match the panel body height calculation — 7 rows × (14px top + 14px bottom + ~35px content) ≈ 441px. The padding and height are intentionally coupled so row counts and panel height stay in sync.

---

## 7. Things explicitly ruled out

| What | Why rejected |
|------|-------------|
| Health strip (fleet overview bar) | Redundant with Pulse — added noise without adding decisions |
| Workflow switcher | Conflated two different user personas in one view |
| Connections in Recent panel | Connections are infrastructure, not work artifacts |
| Health dot on draft models | Health is a production concept; drafts haven't shipped |
| Hover-only CTAs in Pulse | Made the panel feel passive; CTAs should invite action |
| Per-insight CTA labels | Inconsistent; "Fix with agent →" is clearer as a uniform pattern |
| Open model as default for debugging | Model editor is for creation; debugging is a chat-first workflow |
| Summary strip / fleet health overview | Already visible from Pulse panel; strip was redundant weight |
| Full-page confirm dialogs before low-risk fixes | Creates click-through fatigue; autoComplete is better for reversible actions |
| Neutral agent (no recommendation) | An assistant that doesn't take a position is less useful than one that does |
