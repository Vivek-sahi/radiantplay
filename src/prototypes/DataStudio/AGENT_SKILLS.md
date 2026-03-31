# DataStudio — Data Agent Interaction Design

The Data Agent is the AI collaborator in the project workspace. It operates like Cursor — the user describes intent in natural language, the agent executes via skills, and the result reflects across all three views (Visualizer, Data Preview, Notebook).

---

## Interaction Model

```
User types instruction
        │
        ▼
Agent identifies skill to invoke
        │
        ▼
Agent shows "thinking" state (typing indicator + skill name)
        │
        ▼
Agent executes skill:
  - Writes SQL/Python cell(s) in Notebook
  - Updates left panel state (Data Sources / Relationships / Transformations / Context)
  - Updates Visualizer if topology changes
        │
        ▼
Agent responds in chat:
  - What it did (1-2 sentences)
  - What it found / what changed
  - Follow-up suggestion (optional)
```

**Key principle:** Agent actions are always visible. Every skill writes to the Notebook as a cell — the user can inspect, edit, or undo any step.

**`@` mention:** User can type `@orders` to reference a specific table or `@campaign_id` to reference a column. Agent resolves these to the actual objects in the project.

**Confirmation pattern:** Always free text. No structured Accept/Reject buttons. User types "yes", "go ahead", "looks good" etc. Agent reads intent from the response.

**Task list confirmation:** For multi-step execution (e.g. fix all health issues), agent presents the full plan once and asks "Shall I proceed?" User says yes once → agent runs all tasks without interruption. No per-task confirmation — analogous to Cursor's "Allow in this session" behavior.

---

## Skill Catalog

### Category 1: Data Access

---

#### Skill: Add table

**Trigger examples:**
- "Add the orders table"
- "Pull in @campaigns from Snowflake"
- "I need the users table in this project"

**What agent does:**
- Searches available connections for the table
- Adds it as a Data Source in the left panel
- Writes a Notebook cell:
  ```sql
  // Add [table] to project
  SELECT * FROM [table];
  ```
- Visualizer: new source node appears on the left side

**Agent response:**
> Added **Orders** from Snowflake. It has 2,847 rows and 8 columns. I noticed **18% null values** in `campaign_id` and **5 duplicate rows** — want me to flag these for cleanup?

---

#### Skill: Profile table

**Trigger examples:**
- "Profile the orders table"
- "What does @campaigns look like?"
- "Show me the data quality of @users"

**What agent does:**
- Runs a profiling query (row count, null %, distinct count, min/max, sample values per column)
- Updates Data Health section with findings
- Writes a Notebook cell with the profiling query

**Agent response:**
> **Orders table profile:**
> - 2,847 rows, 8 columns
> - `campaign_id`: 18% null (organic orders)
> - `order_date`: all MM/DD/YYYY — conflicts with `campaigns.start_date` which is YYYY-MM-DD
> - `amount`: 2 anomalies detected (negative values)
> - No column descriptions — this will hurt AI accuracy

---

### Category 2: Data Quality

---

#### Skill: Find duplicates

**Trigger examples:**
- "Are there duplicates in orders?"
- "Check @campaigns for duplicate rows"
- "Find duplicate order IDs"

**What agent does:**
- Runs a GROUP BY + HAVING COUNT > 1 query
- Reports duplicate keys and row counts
- Writes Notebook cell

**Agent response:**
> Found **5 duplicate rows** in Orders. They share the same `order_id` — likely a data pipeline issue. Want me to deduplicate by keeping the latest entry?

---

#### Skill: Remove duplicates

**Trigger examples:**
- "Remove duplicate orders"
- "Deduplicate @campaigns, keep the latest"
- "Fix the duplicate rows in orders"

**What agent does:**
- Writes a deduplication SQL/Python cell (ROW_NUMBER or DISTINCT strategy)
- Updates the Data Source in the left panel
- Data Health score improves

**Agent response:**
> Removed 5 duplicate rows from Orders. Kept the latest entry per `order_id`. The table now has 2,842 rows.

---

#### Skill: Find nulls

**Trigger examples:**
- "Where are the nulls?"
- "Show me null values in @orders"
- "Which columns have missing data?"

**What agent does:**
- Queries null count per column across all or specified tables
- Updates Data Health section
- Writes Notebook cell

**Agent response:**
> **Null summary across all tables:**
> - `orders.campaign_id`: 512 nulls (18%) — organic orders with no campaign
> - `users.segment`: 45 nulls (15%) — unclassified users
> - `campaigns.end_date`: 2 nulls — ongoing campaigns with no end date

---

#### Skill: Fill nulls

**Trigger examples:**
- "Fill null campaign_ids with 'organic'"
- "Replace missing segments with 'unknown'"
- "Set null end dates to today"

**What agent does:**
- Writes a COALESCE / CASE WHEN transform cell
- Adds as a Transformation in the left panel
- Data Health null score improves

**Agent response:**
> Created transformation: **Fill null campaign_id → 'organic'**. 512 rows updated. Added to Transformations in the left panel.

---

#### Skill: Fix date formats

**Trigger examples:**
- "Standardize date formats across all tables"
- "The dates in orders and campaigns don't match"
- "Fix date format inconsistency"

**What agent does:**
- Detects date format differences across tables
- Writes a date normalization transform (TO_DATE / STR_TO_DATE)
- Adds as Transformations for each affected column

**Agent response:**
> Found date format mismatch:
> - `orders.order_date`: MM/DD/YYYY
> - `campaigns.start_date` and `end_date`: YYYY-MM-DD
> - `users.signup_date`: YYYY/MM/DD
>
> Created 3 transformations to normalize all dates to **YYYY-MM-DD**. Joins involving date columns will now work correctly.

---

#### Skill: Detect anomalies

**Trigger examples:**
- "Are there any anomalies in the data?"
- "Check @orders for outliers"
- "Something looks off in the amounts"

**What agent does:**
- Runs statistical analysis (IQR or Z-score) on numeric columns
- Flags rows that fall outside expected ranges

**Agent response:**
> Found **2 anomalies** in `orders.amount`:
> - Row ORD-034: amount = **-$240** (negative — likely a refund logged incorrectly)
> - Row ORD-089: amount = **$48,200** (outlier — 47x the average order)
>
> Want me to remove these rows or flag them with a `is_anomaly` column?

---

### Category 3: Modeling

---

#### Skill: Suggest joins

**Trigger examples:**
- "How can I join these tables?"
- "What relationships exist between my tables?"
- "Suggest joins"

**What agent does:**
- Scans all Data Sources for matching column names and types
- Returns suggestions with confidence scores and cardinality

**Agent response:**
> Found **2 suggested joins:**
>
> **High confidence:**
> - `orders.campaign_id` → `campaigns.campaign_id` (many-to-one) — 82% match rate
> - `orders.user_id` → `users.user_id` (many-to-one) — 100% match rate
>
> Want me to create both?

---

#### Skill: Create join

**Trigger examples:**
- "Join orders with campaigns on campaign_id"
- "Connect @orders and @users"
- "Create a many-to-one join between orders and campaigns"

**What agent does:**
- Creates the Relationship in the left panel
- Writes a JOIN SQL cell in Notebook
- Updates Visualizer with a connecting line between the two nodes

**Agent response:**
> Created join: **Order x campaigns** (many-to-one on `campaign_id`). The Visualizer has been updated. Note: 512 orders have null `campaign_id` — they won't match any campaign. Want me to use a LEFT JOIN to keep them?

---

#### Skill: Create metric

**Trigger examples:**
- "Create a conversion rate metric"
- "Add return on ad spend as a calculated column"
- "I need campaign ROI"

**What agent does:**
- Writes the formula as a SQL/Python cell
- Adds to Transformations in the left panel

**Agent response:**
> Created transformation: **Return on Spend**
> ```sql
> -- Return on Spend = total order revenue / campaign spend
> SUM(orders.amount) / NULLIF(campaigns.spend, 0) AS return_on_spend
> ```
> Added to Transformations. You can see it in Data Preview.

---

#### Skill: Add column description

**Trigger examples:**
- "Add descriptions to all columns in @orders"
- "Describe what campaign_id means"
- "Fill in missing column context"

**What agent does:**
- Generates natural language descriptions for each column based on name + sample values
- Populates the Context section
- Data Health semantic score improves

**Agent response:**
> Added descriptions for all 8 columns in Orders. Data Health improved — semantic issues reduced from 70% to 12%. The AI agent will now have better context for answering questions accurately.

---

### Category 4: Testing (in Test mode)

---

#### Skill: Suggest test questions

**Trigger examples:**
- "What should I test?"
- "Give me test questions for this model"
- "How do I validate this is working?"

**Agent response:**
> Based on your model (orders + campaigns + users), here are 5 test questions:
> 1. "Which campaign drove the most orders last month?"
> 2. "What is the return on spend for each campaign channel?"
> 3. "Which region has the highest order volume?"
> 4. "What is the average order value for premium users?"
> 5. "Which campaigns are currently active and how are they performing?"

---

#### Skill: Validate model

**Trigger examples:**
- "Is this model ready to share?"
- "Check if the model is ready"
- "Run a health check before I publish"

**What agent does:**
- Checks Data Health score
- Checks for missing Context/descriptions
- Checks for unresolved data issues
- Returns a readiness summary

**Agent response:**
> **Model readiness: Not ready**
>
> ✗ Data Health: Poor (score: 34/100)
> ✗ 3 columns missing descriptions (AI accuracy risk)
> ✗ 512 null values in `campaign_id` unresolved
> ✓ All joins created and tested
> ✓ No schema errors
>
> Fix the 3 issues above before sharing. Want me to resolve them?

---

## Agent Task List Pattern (multi-step execution)

When the agent has many tasks to run (e.g. "fix all data health issues"), it does NOT run them silently. It creates a **visible task list** in the chat and executes items one by one.

```
Agent:
  I found 24 issues to fix. Here's my plan:

  ☐ 1. Add table descriptions (3 tables)          → skill: add_context
  ☐ 2. Add column descriptions (Orders, 8 cols)   → skill: add_context
  ☐ 3. Add column descriptions (Campaigns, 9 cols)→ skill: add_context
  ☐ 4. Add column descriptions (Users, 8 cols)    → skill: add_context
  ☐ 5. Remove duplicate orders (ORD-007, ORD-023…)→ skill: remove_duplicates
  ☐ 6. Remove duplicate campaigns (CAM-008)       → skill: remove_duplicates
  ☐ 7. Fill null campaign_ids → 'organic'         → skill: fill_nulls
  ☐ 8. Fill null segments → 'unknown'             → skill: fill_nulls
  ☐ 9. Flag age anomalies (age=0, 142, -3, 199)   → skill: detect_anomalies
  ☐ 10. Normalize date formats (all 3 tables)     → skill: fix_dates
  ... 14 more

  Shall I proceed?

User: yes

Agent: Running...

  ✓ 1. Add table descriptions                     done
  ✓ 2. Add column descriptions (Orders)           done
  ⟳ 3. Add column descriptions (Campaigns)        running...
  ☐ 4. Add column descriptions (Users)            pending
  ...
```

Each completed task:
- Gets a ✓ checkmark
- Writes a corresponding Notebook cell
- Updates the relevant left panel section
- Data Health score updates progressively as issues are resolved

---

## Agent Response Patterns

### Thinking state
```
[Typing indicator]
Running: Profile table...
```

### Success with follow-up
```
Done. [What changed]. [Optional: suggestion or question]
```

### Found issues
```
Found [N] issues. [What they are]. Want me to [fix them]?
```

### Ambiguous request
```
I can do this a few ways:
  1. [Option A] — [tradeoff]
  2. [Option B] — [tradeoff]
Which would you prefer?
```

### Can't do it
```
I can't [X] because [reason]. 
You could [alternative] instead.
```

---

## Agent Skill → UI State Mapping

| Skill | Left Panel change | Notebook | Visualizer |
|-------|-------------------|----------|------------|
| Add table | + Data Source | + SQL cell | + source node |
| Create join | + Relationship | + SQL cell | + connecting line |
| Create metric | + Transformation | + SQL cell | no change |
| Fill nulls | Transformation updated | + SQL cell | no change |
| Fix dates | + Transformation(s) | + SQL cell | no change |
| Add descriptions | Context updated | no cell | no change |
| Remove duplicates | Data Source updated | + SQL cell | no change |
| Data health check | Data Health updated | + SQL cell | no change |
