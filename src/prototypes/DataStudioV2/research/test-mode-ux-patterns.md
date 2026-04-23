# Test Mode UX Patterns — Design Brief

_Research question: Should testing happen in a separate screen, or parallel to the model-building canvas? If parallel, does the data agent stay visible? What is the exact UI mechanism — modes, tabs, or persistent split?_

_Researched 2026-04-23. Tools surveyed: dbt Cloud IDE + Canvas, Looker/LookML IDE + Explore, Hex Notebook, Mode Analytics, Snowflake Cortex Analyst, ThoughtSpot, Cursor 3, GitHub Copilot Workspace, Replit Agent, Databricks Genie Code, Power BI Copilot, Metabase, Omni Analytics._

---

## Per-Product Breakdown

---

### 1. dbt Cloud IDE + dbt Canvas

**Pattern:** A — Inline bottom panel (IDE); inline side panel per node (Canvas)

**How it works:**
The dbt Studio IDE uses a three-section layout that has been stable for years: file editor top-center, file explorer left, persistent bottom console. Test/preview/run results land in the bottom panel, which has tabs: **Results** (tabular preview), **Commands** (dbt invocation logs), **Code Quality** (linter), **Compiled Code** (generated SQL), and in 2025 a new **Problems tab** (live file-as-you-type error detection). Runs happen in the background — "you can continue to view and edit code while you wait." The IDE never switches screens for testing.

dbt Canvas is different: visual drag-and-drop. When you click a node, a config side panel opens on the right with tabs: Configure, Input, Output (preview data), Code (generated SQL). A **Runs pane** in left nav shows run status. You click Preview on any node; the canvas stays visible; results appear in the node's Output tab in the right panel. This is a spatial split (canvas left, config/results right) at the node level.

**UI mechanism:** No mode switch. No tabs switching the whole pane. The console is always docked at the bottom. In Canvas, the right panel opens on node click — it's contextual. There is no "enter test mode" toggle.

**User feedback:**
No documented community revolt against the bottom-panel approach. Feature requests focus on richer content within the panel (better test failure explanations, richer diffs, markdown preview, CSV preview) — not its location. The existence of the **dbt Power User** VS Code extension (adds a richer query results panel) is indirect evidence that some users want more — but motivation is richer formatting and query history, not displacing the pattern.

**Established?** Fully established, years-old. Industry-standard for SQL-first developer tools (mirrors VS Code, DataGrip, BigQuery console).

---

### 2. Snowflake Cortex Analyst

**Pattern:** B — Persistent split pane. Model spec left, test chat right. No mode switch.

**How it works:**
The Snowflake Cortex Analyst interface in Snowsight is a ~50/50 horizontal split:
- **Left pane:** YAML semantic model file in an editable code editor
- **Right pane:** Chat window for testing natural language questions

The workflow is explicitly linear:
1. Author/edit the YAML model in the left editor (synonyms, descriptions, dimension/measure definitions)
2. Click **Validate** (bottom-left) — confirms the model is parseable
3. Ask questions in the chat on the right — returns generated SQL + results
4. If SQL is wrong: click **Edit** to correct it
5. If SQL is right: click **Save as Verified Query** — appends to the model's Verified Query Repository section in the YAML

The chat and the editor are always both visible. There is no "test mode" toggle. The chat pane is always the test interface. The Streamlit-based predecessor used the same layout; it was migrated into Snowsight native as a first-class feature.

**UI mechanism:** Single persistent split. No mode switch. No tabs between "build" and "test." The agent panel IS the test panel, always open. One agent, always present. The "build" action (edit YAML) and "test" action (ask question in chat) both happen in the same screen at the same time.

**User feedback:**
Documented friction centers on **model constraints, not the layout:**
- 32K token limit forces pruning large models
- "Updating a semantic view via SQL overwrites manual edits made in an active Snowsight session"
- "Users can't add/alter tables, columns, or metadata within existing semantic views — they must recreate them"

These are semantic model management frustrations. No documented complaints about the split-pane layout itself. A phData practitioner blog describes the workflow as allowing developers to "ask questions, see the output, and then make iterative changes" — framed positively.

**Established?** Deliberate and published. Entered GA November 2025. Still relatively new but the split-pane is the intentional design, not a prototype.

---

### 3. Looker / LookML

**Pattern:** C — Separate screens with manual navigation. The canonical example of what no split-pane produces.

**How it works:**
LookML development requires a manual context-switch cycle:
1. Edit LookML in the web IDE
2. Save → switch to Development Mode Explore (different URL, different interface entirely)
3. Test whether semantic changes produce correct query results in the Explore UI
4. Identify issues → navigate back to the IDE via "Go to LookML" links
5. Edit → repeat

The IDE provides inline syntax validation and LookML linting (syntax errors flagged). But semantic validation — "does this dimension return the right data?" — requires the Explore. There is no native "test chat" or inline query runner within the LookML IDE. The Explore is a full BI query-builder interface, completely separate.

**UI mechanism:** Two entirely separate screens. No split pane. No inline test panel. No mode that brings testing into the authoring view.

**User feedback:**
The clearest negative evidence in the survey:
- **Spectacles** (acquired by Google, now integrated into Looker) was created specifically because the IDE→Explore loop was too slow and manual. The founding blog post by Josh Temple frames the problem: LookML developers need faster feedback than the manual loop provides.
- A devoteam.com article: "a lot of time manually keeping Looker view files in sync with their models, an error-prone and tedious process."
- A Looker community forum thread shows developers encountering navigation friction — can't see Explore results without being in Development Mode, causing confusion about where to look.
- Third-party review (gocobry.com): "the web-based IDE in Looker gets the job done for basic edits, but for serious development, it lacks the features of a modern code editor."
- Community workaround: maintain a separate "dev-testing" Looker project + Spectacles running automated tests — outsourcing the feedback loop entirely to CI.

**Established?** Fully established as the Looker workflow — but also fully established as a known pain point. The entire Spectacles product exists as evidence of this pain.

---

### 4. Cursor (especially Cursor 3 with the Agents Window)

**Pattern:** Originally B (sidebar chat beside editor). Cursor 3 added C (Agents Window — separate full-screen). Community strongly prefers B.

**How Cursor 3 works:**
Cursor's original model: sidebar chat alongside the code editor, always visible. Cursor 3 (April 2026) added the **Agents Window** — a separate full-screen workspace for orchestrating multiple AI agents in parallel. Each agent gets an Agent Tab. Cursor 3.1 added a tiled layout within the Agents Window. **The original sidebar-beside-editor mode (Editor Mode) still exists and was not removed** — Agents Window is additive for multi-agent orchestration scenarios.

**UI mechanism (Cursor 3):** Two modes exist:
- **Editor Mode:** Sidebar agent beside code editor. Single agent, always visible alongside code. This is Pattern B.
- **Agents Window:** Full-screen separate workspace. Multiple agents in tiles. This is Pattern C.

The community's reaction revealed which one they wanted.

**User feedback — specific and direct:**
- **"This view makes you lose any connection to your code"** — Reddit user about the Agents Window, quoted in InfoQ (April 2026).
- **"Reviewing and testing code, constantly switching contexts, juggling model contexts...is so mentally taxing and full of interruptions that it's practically impossible to achieve any sort of flow state"** — HN commenter, same article.
- **"Agent-first needs ambient, background autonomy. Code-first needs precise, synchronous control. Trying to do both in one product means you're always making tradeoffs that frustrate one half"** — HN commenter.
- Cursor forum thread "Agents Window is NOT GOOD": complaints about missing code review capability, missing IntelliSense, missing Plan Mode integration. Cursor team responded that these are "on the radar" and Editor Mode remains available.
- Cursor forum "Trapped in Cursor Agents Window": users could not exit the mode — attempting to open a project in Editor Window refocused the existing Agents Window instead.
- devclass.com (December 2025): "Can you NOT change the UI every week…it is infuriating as hell when I have to reconfigure the editor every week or so after an update."
- Positive feedback on Cursor 3.1 tiling: "super handy when you're comparing a few runs without tab-hopping" and "aligns well with working with files on one screen and agents on another."

**Established?** The sidebar-beside-editor pattern (Cursor 1/2) is established and beloved. The Agents Window (Cursor 3) is new, contested, and buggy at launch.

---

### 5. Hex Notebook (Notebook Agent + AI Sidebar)

**Pattern:** A/B hybrid — Notebook stays as primary execution environment. AI is a sidebar that proposes changes with human confirmation. No mode switch.

**How it works:**
The Hex Notebook Agent is accessible from the bottom-right corner. It appears as a sidebar alongside the notebook. Cells (SQL blocks, Python cells) remain visible and executable while the agent is in the sidebar. The agent:
1. Analyzes the notebook's current structure, code, outputs, and connected data
2. For complex tasks, deploys parallel subagents for focused workstreams
3. Presents generated/modified cells as **pending changes** requiring explicit Confirm or Undo before taking effect

The June 2025 agentic sidebar was a lighter version; the fuller Notebook Agent launched August 2025. The agent shares no context-switch — notebook cells stay visible throughout.

**UI mechanism:** Persistent sidebar. No mode switch. No tab between "build" and "test." Run a cell, see the result inline in the cell below — that's the test. The agent sidebar is always accessible but doesn't displace the notebook. Single agent per session.

**User feedback:**
- G2: "the embedded LLM allows live querying and chatting within the system to the database" (positive).
- G2 concern: "the LLM is overprescriptive and provides changes to data without explicit instructions not to."
- Figma analytics manager: "I never have to build another chart again? What a dream come true" — cut reporting time from days to 20 minutes.
- Notion data scientist: uses the Notebook Agent "in pretty much every project."
- Performance concern on G2: "slow performance especially when handling numerous tables or when multiple queries are chained."

**Established?** The notebook-as-test-ground (run cells inline, see results inline) is Hex's core design thesis. The AI sidebar is maturing (Notebook Agent Act II in December 2025 changelog indicates iterative improvement).

---

### 6. GitHub Copilot Workspace (deprecated May 2025) → Copilot Coding Agent

**Pattern:** C → C-async. Workspace was a separate browser-based screen. Coding Agent is even more async (background PR agent on GitHub.com, not IDE-inline).

**How Workspace worked:**
A browser-based separate screen. Flow: Brainstorm → Specification → Plan → Implementation → Validation (integrated terminal). Multi-step, separate from the user's IDE. The VS Code extension connected to a local Codespace but the workspace was browser-native.

**Why it was deprecated:**
The technical preview ended May 30, 2025. Primary reason: overlap with Copilot Agent Mode in VS Code, which received full investment. GitHub took the sub-agent architecture and async model and rebuilt it as the **Copilot Coding Agent** (GA September 2025). The Coding Agent is fully async: assign a GitHub issue to Copilot, it works in the background, pushes commits to a draft PR. You track progress on GitHub.com. All CI requires human approval.

**User feedback on Workspace:**
From GitHub community discussion #145254:
- Rate limiting: "I hit my hourly quota after the initial code generation" on a modest 7-file change.
- Service reliability: "stuck on swirls" (loading spinners), 499/504 gateway timeouts.
- File context: "seems to only scan a small subset of the project" in monorepos.
- UI confusion: "It's not clear why the questions I'm asking aren't being added to the brainstorming section."

Notable: no specific complaints about the separate-screen approach. Frustration was about reliability, quotas, and context scanning. The replacement (Coding Agent) is actually more separate from the IDE, not less — GitHub is doubling down on async PR-based for large-scale agent tasks.

**Established?** Copilot Workspace was explicitly experimental. The Coding Agent is the production bet, and it's more async, not more inline.

---

### 7. Databricks Genie Code (formerly Databricks Assistant)

**Pattern:** A/B hybrid — inline cell-level (Cmd+I) plus configurable docked pane. User chooses bottom or right-side.

**How it works:**
Two interaction modes in notebooks:
1. **Inline cell interface:** Press Cmd+I inside a code cell. A text box appears in the cell. Type a prompt. AI-generated code appears in the cell directly.
2. **Genie Code pane:** A configurable panel that can be **docked bottom** or **right-side** (draggable). When you run code in the pane, output displays there AND the variables become available in the notebook — the pane shares kernel state with the notebook. It's a genuine scratchpad, not an isolated sandbox.

Edit Mode (August 2025) adds notebook-wide multi-cell suggestions — AI proposes changes across multiple cells for refactoring, renaming, standardizing.

**UI mechanism:** No mode switch. The pane placement is user-configurable (bottom vs. right). Single agent. The pane closes automatically when you Accept or Reject — so it's not always-visible, more modal-adjacent for the inline inline interaction.

**User feedback:**
Community Q&A discussions are largely how-to in nature rather than critical UX feedback. No strong community revolt documented. Third-party guides describe it as enabling "rapid iteration and feedback loops." The configurable placement (user choice between bottom and right) suggests Databricks actively considered this layout question rather than assuming one answer.

**Established?** The assistant has been live since 2023 in various forms. Edit Mode is newer (August 2025). Considered a stable, mature feature.

---

### 8. Power BI Copilot / DAX Query View

**Pattern:** A — Below-editor results grid for DAX testing. Inline diff for AI-generated code.

**How it works:**
The DAX Query View has Copilot integration via Ctrl+I or ribbon. Copilot generates or modifies DAX with an inline diff editor showing what changed. Click "Keep it" → run the query → results appear in a standard results grid below the editor. This is effectively inline (AI embedded in query editor) with below-editor results — Pattern A. For semantic model documentation specifically, Copilot works in a separate "Copilot pane" that doesn't overlap with the DAX editor.

Key design decision: DAX Query View lets you "create measures without adding them to the model" — test in the query view first, then promote to the model via a "Update the model" CodeLens action. Test-then-promote flow is deliberate.

**UI mechanism:** No mode switch. Inline diff for AI suggestions. Below-panel for query results. Promote to model is an explicit separate action. No tabs switching the whole pane.

**Established?** Public preview March 2024. Established feature in 2025. Positive community feedback; no prominent threads expressing desire for a different approach.

---

### 9. Mode Analytics

**Pattern:** A — SQL editor on top, tabular results below, charts in tabs.

**How it works:**
SQL editor occupies the main canvas. Results appear in a persistent bottom panel. Charts are accessible via tabs at the top of the editor. Standard three-panel layout (editor, results, chart). No AI agent panel in the primary workflow. No mode switch.

No specific user feedback surfaced beyond standard usage documentation.

---

## The "Side-by-Side" Design Pattern: UI Mechanism

**The core finding across all tools that use split-pane testing:**

| Tool | Mode switch? | Tabs? | Always visible? | Single agent? |
|---|---|---|---|---|
| Snowflake Cortex Analyst | No | No | Yes — chat is always open | Yes |
| dbt Canvas | No | Node-level (Output tab in side panel) | Side panel opens on click | N/A (no agent, just preview) |
| Databricks Genie Code | No | No | User-dockable pane, can be persistent | Yes |
| Hex Notebook Agent | No | No | Sidebar persistent | Yes |
| Cursor (Editor Mode) | No | No | Sidebar persistent | Yes |

**The pattern is: no mode switch. No tabs that toggle the pane. One persistent spatial split where the agent or test interface is always accessible alongside the model.**

The tools that use tabs or modes to access testing are all in the weaker category:
- Looker: navigate to a different screen (full context switch)
- GitHub Copilot Workspace (deprecated): multi-step wizard with separate screens per phase
- Current Data Studio: `testMode: boolean` that replaces the canvas — this is closer to the Looker/deprecated-Workspace pattern

---

## Tradeoff Summary

| Dimension | A: Inline Panel | B: Split Pane | C: Separate Screen |
|---|---|---|---|
| Model visibility during testing | Full | Partial (~50%) | None |
| Test result richness | Limited by panel height | Moderate (full pane height) | Unlimited |
| Edit-test loop speed | Fast | Fast | Slow (context switch back) |
| Cognitive overhead | Low | Low–moderate | High |
| AI/agent presence | Natural (right panel stays) | Natural (already in right pane) | Awkward |
| UI mechanism | Always-on bottom panel | Always-on right panel | Mode switch / navigate away |
| Best fit | Syntax / row-level validation | Semantic / answer-quality testing | Async test suites, publication |

---

## Is Split-Pane an Established Industry Pattern?

**It is the emerging consensus for semantic model / AI answer testing, not yet a 5-year-old standard.**

**Evidence it is established:**
- Snowflake Cortex Analyst ships this as deliberate, documented design. It did not arrive at it accidentally.
- Databricks, Hex, and Cursor (Editor Mode) all converge on persistent-sidebar-alongside-canvas without independent coordination.
- dbt Canvas uses a spatial split at the node level (operator-click → side panel with Output tab).
- Multiple tools arriving at the same pattern independently is the strongest form of evidence.
- The Looker case is negative proof: the one major tool that doesn't have it spawned an entire third-party ecosystem (Spectacles) and an acquisition to compensate.

**Evidence it is still evolving:**
- Cursor 3's Agents Window launched in April 2026 with significant community pushback — the product was still figuring out where the agent lives relative to code at time of research.
- Snowflake Cortex Analyst reached GA only in November 2025 — less than a year of production use.
- No tool in the survey has published user research or formal usability studies on split-pane vs. separate-screen for semantic model testing. The convergence is engineering/design intuition, not validated with published data.

**Bottom line:** For the specific task of testing semantic model quality (AI answer quality against a data model), split-pane without a mode switch is the direction the industry is moving. The tools that chose separate-screen are either deprecated (Copilot Workspace) or considered painful enough to work around (Looker). The Cursor community's explicit quote — "this view makes you lose any connection to your code" — is the clearest user articulation of why the separate-screen pattern fails for this use case.

---

## Recommendation for Data Studio

**Pattern B — persistent split pane — with no mode switch.**

The current `testMode: boolean` that replaces the canvas with a full-screen test panel is Pattern C in code. It should become a **panel re-weighting** instead:

- LeftPanel stays visible at full height (tables/joins tree is the most useful debugging reference)
- CenterPanel stays but shifts to Data Preview tab at a narrower width — the column structure is what gets fixed
- AgentPanel stays open and becomes more prominent — it IS the test console
- The 3-dimension diagnostic (Data quality · Context · Structure) renders inline in agent chat
- No "enter test mode" toggle that swaps the whole canvas — just a panel width shift

The closest reference: Snowflake Cortex Analyst. Model spec on the left, test chat on the right, validate then iterate, always both visible, single agent, no mode switch.

---

## Open Question (still live)

**Two panels vs. three panels during testing?**
Snowflake Cortex Analyst: two panels (model left, chat right). dbt Canvas: three (tree + canvas + side panel). For Data Studio: LeftPanel + CenterPanel (narrow, Data Preview) + AgentPanel (wider) is three panels. Whether CenterPanel earns its width during testing depends on whether the column list in Data Preview is useful alongside the agent diagnostic. The answer is almost certainly yes — column descriptions, null %, and data types are exactly what you're debugging when a test reveals a semantic gap.
