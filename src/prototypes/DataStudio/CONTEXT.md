# DataStudio — Prototype Context

**Author:** Vivek Sahi
**Prototype name:** DataStudio
**Branch:** prototype/data-studio
**Started:** 2026-03-31

---

## What DataStudio Is

Data Studio is a new ThoughtSpot product for **data teams** — the people responsible for getting raw warehouse data into a clean, queryable model that AI agents and business users can use to generate insights.

It is NOT a dashboard tool. It is NOT for business users. It is a **data workspace product**.

---

## ThoughtSpot's Three User Types (context)

| User | What they do | Tool today |
|------|-------------|------------|
| Business user | Consumes insights via Liveboards, Spotter, Search | Liveboards, Spotter |
| **Data user (this product)** | Gets raw data into a clean model | **Data Studio** |
| Admin | Configuration, governance | Admin portal |

---

## DataStudio — Shell Layout (from Figma)

Data Studio lives inside the ThoughtSpot shell. The top global nav bar has three product-mode tabs (Analytics/Liveboards, Data Studio, Developer). Switching to Data Studio activates the left sidebar below.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [TS Logo]  [📊 Analytics] [⊞ Data Studio*] [</> Dev]    [🔍 Search]  [🔔][?][V] │  ← Global header (dark)
├────────────────────┬────────────────────────────────────────────────────┤
│  Data Studio   [+] │                                                    │
│  ─────────────     │                                                    │
│  Projects ←active  │          Main content area                        │
│  Data              │                                                    │
│  Connections       │                                                    │
│                    │                                                    │
└────────────────────┴────────────────────────────────────────────────────┘
```

**Left sidebar nav items (Data Studio):**
- **Projects** — list of all projects (this prototype's starting point)
- **Data** — standalone data browser (browse warehouse tables/models)
- **Connections** — manage warehouse connections

**Monitoring is NOT a separate nav item** — it surfaces inline as columns in the Projects table (Health, Spotter Conversations).

This prototype focuses entirely on **Projects**.

---

## Product Concept Model — Four Layers

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: PROJECT PROPERTIES                                │
│  Lifecycle state, query strategy, settings, management      │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: INPUTS                                            │
│  Context · Data Sources · Relationships · Transformations   │
│  Data Health                                                │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: WORKSPACE (the IDE)                               │
│  Left panel (inputs) + Center tabs (outputs) + Agent        │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: OUTPUT                                            │
│  The data model — shared with business users                │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Project Properties

### 1a. Lifecycle / Status

| State | Meaning |
|-------|---------|
| **Draft** | Created, being worked on, not shared with anyone |
| **Published** | Shared with a group or org — business users can query it |
| **Verified** | Org-endorsed. High accuracy + made/approved by data team lead. Signals trust to business users consuming the model |

**Verified** is a separate trust layer on top of Published — solves for accuracy trust in AI-generated answers downstream.

### 1b. Query Strategy

| Strategy | Meaning |
|----------|---------|
| **Live query** | Every question queries the warehouse directly. Always fresh, higher latency, higher cost |
| **Cached** | Data is materialized locally in ThoughtSpot. Faster, cheaper, better for business. ThoughtSpot has native caching capability. |

Session-level override: user can set "cache all queries for this session" while working — avoid hitting warehouse repeatedly during active build work.

### 1c. Settings

- **.env variables** — for Python notebook cells that need environment-specific config (API keys, connection strings)
- **Session cache** — cache all warehouse queries during the current work session
- **Execution mode** — auto-execute on each change (creates join → immediately runs query and shows result) OR manual execute
- **Version history** — every meaningful change is versioned. User can revert to a previous state via the platform UI or via the Data Agent ("revert to yesterday's version")

### 1d. Project Management Actions

Actions available on a project from the projects list or within the project:

| Action | Description |
|--------|-------------|
| Rename | Change project name |
| Favorite | Pin to top of projects list |
| Duplicate | Copy project as a new draft |
| Add to collection | Organize projects into named collections |
| Transfer ownership | Reassign project to another user |
| Delete | Permanently remove |
| Create new | Start a fresh project |

---

## What a Project Is

A project is a **collaborative workspace** where a data analyst takes raw warehouse tables and produces a clean, published **data model** that business users can query via an analytics agent.

### Top-Level User Flow

```
Projects list
      │
      ▼  click "+ New project"
  Empty workspace (Untitled Project) — no intermediate modal, user lands here directly
  Project auto-renamed after first agent interaction: once tables are selected, agent
  generates a smart name (e.g. "Marketing Campaign Attribution") — same pattern as
  how chat tools auto-title conversations from the first message
      │
      ▼  user types intent in Data Agent
  ─────────────────────────────────────────────────────
  STEP 1: Add tables
  Agent: understand → find tables skill → propose tables to user
  User: confirms (yes/approve)
  Agent: add tables skill → tables land in project
    • Left panel: Data Sources populated (Orders, Campaigns, Users)
    • Visualizer: 3 unconnected floating nodes
    • Data Preview: individual table selectable (no join yet)
    • Notebook: 3 SQL cells (SELECT * FROM each table)
    • Data Health: auto-populates immediately (nulls, dupes, missing descriptions)
  ─────────────────────────────────────────────────────
  STEP 2: Create joins
  Agent: understand → create joins skill → propose joins (columns, cardinality)
  User: confirms
  Agent: creates joins
    • Left panel: Relationships section populated (Order x campaigns, Order x users)
    • Visualizer: nodes now connected with lines
    • Data Preview: combined master table now available
    • Notebook: SQL cells with JOIN definitions
  ─────────────────────────────────────────────────────
  STEP 3: Create custom column
  User: asks for campaign ROI column (provides formula)
  Agent: verifies formula → shows data type + sample values (top 10 rows) → asks to confirm
  User: confirms
  Agent: creates column
    • Left panel: new Transformation entry (e.g. "Campaign ROI")
    • Visualizer: no change
    • Data Preview: new column appears in the grid
    • Notebook: SQL cell for the formula
  ─────────────────────────────────────────────────────
  STEP 4: Improve data health
  User: "How can I improve my data health score?"
  Agent: identifies 20-30 issues → creates a task list → executes each task sequentially
    Each task: title + skill called + output (runs one by one)
    • Notebook: cell added per task as it runs
    • Data Preview: updates as data is cleaned
    • Visualizer: no change
    • Data Health score: improves from Poor → Fair/Good
  ─────────────────────────────────────────────────────
  STEP 5: Share
  User: clicks "⎘ Share"
  → Share modal opens (standard)
  → Share with: entire org / specific groups / specific users
  → Model published → business users access via their analytics agent
  ─────────────────────────────────────────────────────
      │
      ▼  (anytime: click "▶ Test" to validate before sharing)
  TEST MODE — chat or graph interface to verify model output
      │
      ▼  iterate: back to Build, fix, test again
```

**Build mode** and **Test mode** are the two primary modes of the project workspace. The top bar "▶ Test" button switches from Build → Test. Build mode is the default when a project is opened.

### Agent Meta-Flow (how every skill execution works)

```
User types intent
      │
      ▼
Agent: Understand & translate requirement
      │
      ▼
Agent: Identify relevant skill(s)
      │
      ▼
Agent: Run skill → generate proposal/output
      │
      ▼
User: Confirm (yes/no — human in the loop for every major action)
      │
      ▼
Agent: Execute → update project state
  (left panel + active view + notebook always reflect the change)
```

### Project Header — Top Bar Button Order (confirmed)
```
← Project name  ⓘ    [Visualizer] [Data Preview] [Notebook]    ▶Test  🗄 Warehouse ▾  ⚙Settings  ⎘Share
```

### Query Strategy / Warehouse Indicator (confirmed)
- Position: top right, between Test and Settings
- Shows: **🗄 Warehouse ▾** (database icon + label + dropdown chevron)
- Default state: "Warehouse" = live querying from Snowflake
- Dropdown options: switch to ThoughtSpot cache
- When set to cache: label changes to reflect cached mode
- No separate modal for the basic toggle — dropdown is sufficient
- Cache configuration details (refresh schedule etc.) live in Settings

### Example project: "Campaign Performance"

- **Business intent:** "My marketing team wants insights on how campaigns are performing against orders on the iPhone app."
- **Tables:** `orders`, `users`, `campaigns`
- **Key relationships:** `orders.user_id → users.id` (many-to-one), `orders.campaign_id → campaigns.id` (many-to-one)
- **Issues to resolve:** null values in `orders.campaign_id`, duplicate orders, date format mismatch between `orders` and `campaigns`
- **Output:** A clean joined model called `Campaign Performance Model` shared with the marketing team

---

## Project Workspace — Information Architecture (from Figma)

The project workspace is a **3-panel layout** with a fixed structure. There is no left navigation menu — tools are accessed via **center tabs** instead.

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ← Untitled Project  ⓘ    [Visualizer] [Data Preview] [Notebook]   ▶Test ⚙Settings ⎘Share  │  ← Project header
├─────────────────────┬──────────────────────────────────┬─────────────────────┤
│                     │                                  │                     │
│   LEFT PANEL        │       CENTER PANEL               │   RIGHT PANEL       │
│   (project meta)    │       (active tab view)          │   (Data Agent)      │
│                     │                                  │                     │
│  Context        ✏   │   ← switches between:           │  💡 Data Agent  >>  │
│  Goal, Persona,     │     Visualizer                  │                     │
│  and instructions   │     Data Preview                │  [empty chat area]  │
│  ─────────────      │     Notebook                    │                     │
│  Data           +   │                                  │                     │
│  No data            │   [large empty gray canvas]      │  ─────────────────  │
│  available          │                                  │  Give me a task.    │
│  [Add Data]         │                                  │  Use '@' to mention │
│  ─────────────      │                                  │  table, or columns. │
│  Data Health        │                                  │  [TS icon] [  ↑  ] │
│  Available when     │                                  │                     │
│  data is present    │                                  │                     │
│  [Check data health]│                                  │                     │
│  (disabled)         │                                  │                     │
└─────────────────────┴──────────────────────────────────┴─────────────────────┘
```

---

## Project Workspace — Left Panel (Project Metadata)

Always visible. Three sections stacked vertically.

### Section 1: Context
- Label: "Context" + pencil (edit) icon
- Subtitle: "Goal, Persona and instructions"
- **Purpose:** This context is consumed by the **end user's AI agent** to correctly interpret the data model when answering questions. It contains business intent, target persona, and semantic instructions.
- Empty state: just the label + subtitle, no items

**Auto-population from agent chat:**
As the user interacts with the Data Agent, relevant intent is silently captured into the Context section. The section visually indicates it has been updated (e.g. a subtle highlight or "Updated" badge) so the user knows their conversation is being translated into context. The user can review and edit via the pencil icon at any time. Think of it as: agent chat → Context file, the way code agents write to files while explaining in chat.

### Section 2: Data
- Label: "Data" + "+" (add) icon

**Empty state:**
- Subtitle: "No data available in the project"
- CTA button: "Add Data" (outlined/ghost button)

**Populated state — three sub-sections:**

1. **Data Sources** (grid/table icon per item)
   - Lists raw tables pulled from warehouse connections
   - Example: Orders, Campaigns, Transactions

2. **Relationships** (toggle/link icon per item)
   - Lists joins defined between tables
   - Named as "[Table A] x [Table B]"
   - Example: Order x campaigns, Order x Transactions

3. **Transformations** (fx icon per item)
   - Lists custom calculated columns / metrics
   - Example: Return on Spend, Campaign performance

### Section 3: Data Health
- Label: "Data Health" + settings/config icon (top right of section)

**Trigger:** Auto-runs immediately when tables are added to the project. No user action needed — profiling is triggered by table selection.

**Empty state (no tables yet):**
- Text: "Data health is available only when data is present in the project"
- CTA: "Check data health" button — disabled

**Populated state:**
- **Gauge/speedometer visualization** showing overall AI-readiness health level
- Text: "Data health is **[rating]**" (e.g. Poor, Fair, Good)
- **"Top issues"** list — each row shows: issue type | affected table (percentage)
  - Issue types observed: No descriptions, Nulls, Duplicates, Anomalies
  - Example: "No descriptions | Orders (70%)", "Nulls | Orders (18%)", "Duplicates | Campaigns (15%)", "Anomalies | Orders (11%)"

**What Data Health measures (per Vivek):**
- Data issues: null values, duplicates, anomalies
- Semantic/context issues: missing column descriptions, missing context
- Combined score = "AI readiness" — anything that would cause the AI agent to give inaccurate answers

---

## Project Workspace — Center Panel (Tab Views)

Three tabs in the center header. Default active: **Visualizer**.

### Tab 1: Visualizer (default)
- Icon: bar chart / visual icon
- The main visual modeling view

**Empty state:** large blank gray canvas

**Populated state — flow/pipeline diagram:**
- Layout: source tables on the LEFT → output models on the RIGHT
- Connected by lines with small **circle nodes** at junctions
- Left nodes (source tables): rectangles labeled with table names (e.g. "Orders", "User Engagement metrics")
- Right nodes (output models): rectangles labeled with model names (e.g. "Sales Growth Analysis", "Product Launch metrics", "Website Traffic")
- Multiple source tables can feed into multiple output models via branching lines
- This is a **data flow view**, NOT a traditional ER diagram — it shows how raw tables get combined into models

**Important distinction:** The Visualizer shows the pipeline topology. Detailed schema editing (column-level joins, data types) likely happens by clicking into a node, not in this top-level view.

### Tab 2: Data Preview
- Icon: document/grid icon
- An **interactive spreadsheet** — not read-only. Users familiar with Excel can work here naturally.
- **Empty state (no joins yet):** Shows message — "No joins exist, so there is no preview available." Does not show individual table data.
- **Populated state (after joins created):** Shows the combined master table.

**Toolbar (above the grid):**
```
← →  | ↑↓ ⊞ ≡ ↔ | cut … | $ % T … | |←→| 🎨 📊 ⚙ ▼filter ✦ | ↓download
```
- Navigation: back / forward
- Arrange: sort (↑↓), grid view, alignment, column width
- Edit: cut, paste, transform actions
- Format: currency ($), percentage (%), text (T), and other cell formats
- Layout: fit columns, color fill, chart insert, settings, filter, add column/formula (✦)
- Export: download icon

**Formula bar:**
- Shows selected column name on the left (e.g. "Campaign")
- `fx` label — users can write formulas to create new calculated columns (Transformations)
- This is how non-technical users create Transformations without writing SQL

**Grid:**
- Row numbers on left
- Column headers with dropdown (▼) for per-column filter/sort
- Actual data values — raw, unprocessed (e.g. Education shows "basic.4y", "high.school", "university.degree" — not yet normalized)
- Alternating row shading
- This is the same left panel state as the Visualizer — Data Sources, Relationships, Transformations all visible

**Purpose (per Vivek):** Spreadsheet-first interface for users who think in Excel. Lets them inspect data, spot quality issues visually, and create new formulas/transformations without SQL. Bridge between no-code and code.

### Tab 3: Notebook
- Icon: code `</>` icon
- SQL / Python cell-based environment

**Purpose (per Vivek):** Dual role —
1. **Audit trail** — every action the Data Agent takes is written as a cell. Users can inspect exactly what SQL/Python was run, step by step.
2. **Manual workbench** — users can add their own cells to debug, customize, or extend what the agent did.

**Toolbar:**
- "+ Add Cell ▼" — add a new cell; dropdown likely offers cell type choice (SQL, Python, Markdown)

**Cell structure:**
Each cell has:
- **Header:** cell type icon + "Cell N" label + ✏ edit icon + "…" more options (right-aligned)
- **Body:** code editor with line numbers, syntax highlighting
  - SQL keywords: purple/blue (`SELECT`, `FROM`)
  - Comments: gray (`//comment text`)
  - Line numbers on left

**Cell types observed:**
- **SQL cell** — gray "SQL" icon. Example cells:
  ```sql
  //Add Orders table into this project
  SELECT * FROM orders;
  ```
  ```sql
  //Add Sales growth analysis table into this project
  SELECT * FROM sales_growth_analysis;
  ```
  ```sql
  //Add User engagement metrics table into this project
  SELECT * FROM transactions;
  ```
- **Python cell** — snake/Python icon (visible on Cell 4, partially visible)

**Agent-written vs. user-written cells:**
- Agent-generated cells have comments explaining what they do (e.g. "//Add Orders table into this project")
- Users can add their own cells below for debugging or custom logic
- No visual distinction between agent cells and user cells in this view (both look the same)

---

## Project Workspace — Right Panel (Data Agent)

Always visible. Fixed right column.

- Header: "Data Agent" + lightbulb/AI icon + ">>" collapse button
- Body: chat message thread (empty in initial state)
- Input: text box at bottom
  - Placeholder: "Give me a task. Use '@' to mention table, or columns."
  - "@" mentions let users reference specific tables or columns from the project
  - Left button: ThoughtSpot icon (attach / context menu — TBD)
  - Right button: blue circular send button (↑)

---

## Project Workspace — Top Bar Actions (Page-Level)

These are NOT tabs/views — they are page-level actions in the project header.

| Action | Icon | Behavior |
|--------|------|----------|
| **← (back)** | Arrow | Return to projects list |
| **Project name** | Text | Editable inline ("Untitled Project" default) |
| **ⓘ** | Info | Show project info / metadata tooltip |
| **▶ Test** | Play icon | Switch to **Test mode** — replaces the 3-panel layout with full-width test interface |
| **⚙ Settings** | Gear icon | Open project settings panel/modal |
| **⎘ Share** | Share icon | Open share / publish flow |

---

## Test Mode (from Figma)

Test mode **replaces the entire 3-panel build layout** with a full-width interface. The left panel (inputs) and right panel (Data Agent) disappear. The center tabs (Visualizer, Data Preview, Notebook) remain accessible in the header for switching back.

**Purpose:** The analyst simulates being a business user — asking questions against the model to validate it returns correct answers. This is the quality gate before sharing.

**Iteration loop:** Build → Test → back to Build → Test → Share. Not a one-way flow.

**Future consideration (Vivek):** Explore whether Test should be a parallel tab alongside Data Preview and Notebook, rather than a full mode switch. Currently treated as a distinct mode because users spend significant time in each.

### Two sub-modes within Test

```
┌─────────────────────────────────────────────────────┐
│  [Spotter]  [Search Data]                           │
│                                                     │
│  Spotter = conversational AI chat                   │
│  Search Data = graph/visualization making interface │
└─────────────────────────────────────────────────────┘
```

### Spotter tab (chat interface)

**Layout:** Full-width chat thread + input bar at bottom

**Message thread:**
- User message: avatar + question text + timestamp
- AI response:
  - Sparkle/AI icon
  - "Work done in N seconds ▼" — collapsible thinking trace (analyst can see how AI reasoned)
  - Plain text explanation (e.g. "Found region column.")
  - **Bold answer heading** (e.g. "Region with Maximum Sales")
  - Natural language summary with key values bolded
  - **Chart** with filter chips showing the constructed query (e.g. `▼ top 1` `region` `sales` `↑ sort by sales`)
  - Chart actions: delete, edit/sort, expand

**This is exactly what business users will see** — the analyst is previewing the end-user experience against their model.

**Input bar:**
- Placeholder: "Ask me a question. Use '@' to search for columns for values"
- `@` mention = reference specific columns or values (different from Data Agent's `@` which references tables)
- Left: chart type icon, search icon
- Context pill: "Untitled project" — confirms which model is being tested
- Right: blue send button

### Search Data tab
- The graph/visualization-making interface (screen not yet shared)
- Equivalent to ThoughtSpot's Search Data — build a chart by selecting measures/dimensions directly

---

## Agent Panel — Skills

The agent is a persistent right-side panel. It has a chat interface and a set of callable skills.

### Skill categories

| Category | Skills |
|----------|--------|
| **Data access** | Get tables from connection, Profile table, Preview table |
| **Data quality** | Identify null values, Find duplicates, Detect date format mismatches, Flag outliers |
| **Data prep** | Clean column, Normalize values, Fill nulls, Deduplicate rows, Cast date format |
| **Modeling** | Create join, Define relationship type, Suggest joins (AI), Create custom metric, Create calculated column |
| **Testing** | Run test question, Validate model output, Suggest test cases |
| **Publishing** | Publish model, Set query strategy, Grant access |

Agent and human can work on the same project simultaneously. Agent actions are visible in the canvas as steps.

---

## Data Entities in a Project

Three distinct entity types live in the left panel Data section, plus the output models shown in the Visualizer.

```
Connection (warehouse source — exists outside the project)
    │
    ▼
Data Sources (tables added to the project)
    │
    ├── Relationships (joins between Data Sources)
    │
    └── Transformations (calculated columns / custom metrics)
                │
                ▼
            Output Models (shown in Visualizer right side)
                │
                ▼
            Published Model (shared with business users)
```

### Data Source (raw table)
- `id`, `name`
- Source: warehouse connection
- Icon: grid/table icon in left panel
- Shown as left-side nodes in Visualizer

### Relationship (join)
- `name`: "[Table A] x [Table B]" format
- `leftTable`, `rightTable`, `leftColumn`, `rightColumn`
- `joinType`: inner | left | right | full
- `cardinality`: one-to-one | one-to-many | many-to-many
- Icon: toggle/link icon in left panel
- Shown as connecting lines in Visualizer

### Transformation (calculated column / metric)
- `name`: human-readable (e.g. "Return on Spend", "Campaign performance")
- Type: formula, SQL expression, or Python
- Icon: fx icon in left panel
- Contributes to output model columns

### Output Model (right-side nodes in Visualizer)
- `id`, `name` (e.g. "Sales Growth Analysis", "Product Launch metrics")
- Composed of: Data Sources + Relationships + Transformations
- `status`: draft | ready | published
- `queryStrategy`: live | cached
- `publishedAt`, `publishedBy`
- `sharedWith[]` — audience names (groups or "Entire org")

### Context (semantic layer)
- Goal / business intent
- Target persona description
- Column-level descriptions and instructions
- Used by the end user's AI agent to interpret the model correctly

---

## Project List — Entry Screen (from Figma)

The project list is a **flat table**, not a card grid. One row per project.

### Layout
- Page title: "Projects" (top left)
- Primary action: "+ New project" button (top right, blue filled)
- Table below with 6 columns

### Table columns

| Column | Description | Draft state | Published state |
|--------|-------------|-------------|-----------------|
| **Name** | Project name, styled as a blue link | blue link | blue link |
| **Status** | Pencil icon + "Draft" OR green dot + audience name | ✏ Draft | 🟢 Entire org / APAC group / Sales group / etc. |
| **Spotter Conversations** | Count of Spotter conversations on this model, with external link icon | — | 235 ↗ |
| **Connection** | Warehouse connection icon + name | ❄ Snowflake / TS ThoughtSpot / SAP | same |
| **Health** | Quality/freshness indicator | — | 💚 Good / ⚠ 1 alert / ⚠ 2 alerts |
| **Last Modified** | Relative time, optionally "by [name]" | Yesterday by You | 3 days ago by Jane |

### Status values observed
- **Draft** — project not yet published, pencil icon, no audience
- **[Audience name]** with green dot — published and shared with that audience (e.g. "Entire org", "APAC group", "Sales group", "Marketing", "Finance group", "Product group", "Social group")

### Health values observed
- **Good** — green heart/check icon
- **1 alert / 2 alerts** — orange triangle warning icon
- **—** — draft projects have no health score yet

### Connection types observed
- Snowflake (❄ snowflake icon)
- ThoughtSpot (TS icon — native ThoughtSpot connection)
- SAP (TS SAP label)

### States
- **Populated state** — table with rows (shown in Figma screenshot)
- **Empty state** — no projects yet, CTA to create first project (screen TBD)

### Actions
- Create new project: "+ New project" button top right
- Open project: click on row / name link

---

## What This Prototype Will NOT Cover (v1 scope)

- Full Connections setup flow (assume connections already exist)
- Data Browser as a standalone section (only the in-project version)
- Monitoring section
- Business user analytics agent experience
- Real warehouse queries (all data is mocked)
