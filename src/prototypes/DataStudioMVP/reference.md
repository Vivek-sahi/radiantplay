# Data Studio - MVP — reference

_Read this when touching `data/mockData.ts`, `ProjectState`, or the agent's routing. Not needed for
UI-only sessions._

---

## Key files

| File | What it does |
|------|-------------|
| `index.tsx` | Root. Owns `AppView`, the six-step entry flow, and the `ProjectState` type |
| `components/Shell.tsx` | Data Workspace navigation wrapper (sidebar + header) |
| `components/DataObjectsPage.tsx` | The workspace object list — where you start and where a saved model lands |
| `components/ModelDetailPage.tsx` | A saved model's view state; Edit model returns to the canvas |
| `components/ModelCanvas.tsx` | The canvas — everything. `SCOPE` at the top holds its settings |
| `components/AgentPanel.tsx` | Agent chat. Scripted flows |
| `components/Spreadsheet.tsx` | The whole-model spreadsheet, join-aware |
| `data/mockData.ts` | All mock data. **Never invent table or column names** |
| `data/tableConnections.ts` | Table → warehouse authority |
| `data/dataObjects.ts` | The workspace's object list and `makeCreatedModel` |

---

## Mock data schema

⚠️ **Three unrelated scenarios currently coexist** — see queue item 2 in `DESIGN.md`. Standardising
on **renewal risk** is agreed and unactioned.

**Campaign Performance** — marketing team wants to understand how campaigns drive orders across
regions and user segments.

**`orders`** (150 rows, Snowflake)
- `order_id` · `user_id` · `campaign_id` (18% null) · `order_date` (MM/DD/YYYY) · `amount` (SUM) ·
  `product_category` · `status` · `region`
- Issues: 7 duplicate rows, 4 anomalies in `amount`, date format conflict

**`campaigns`** (Snowflake)
- `campaign_id` · `campaign_name` · `channel` · `spend` (SUM) · `budget` · `impressions` ·
  `target_region` · `start_date` · `end_date` (6 nulls, ongoing)
- Issues: 2 duplicate rows, date format YYYY-MM-DD (conflicts with orders)

**`users`** (Snowflake)
- `user_id` · `segment` (15% null) · `lifetime_value` · `signup_date` (YYYY/MM/DD) · `age`
  (anomalies: 0, -3, 142, 199) · `email` (PII) · `country`

**Join keys:** `orders.campaign_id → campaigns.campaign_id`, `orders.user_id → users.user_id`

**Intentional quality issues:** `campaign_id` 18% null (organic orders, no campaign attribution) ·
date format inconsistency across all three tables · duplicate rows in orders and campaigns · age
anomalies in users · most columns missing descriptions.

---

## `ProjectState` shape

⚠️ **Legacy internal type — do not rename.** The user-facing object is a **model**.

```typescript
{
  id: string;
  name: string;
  buildStep: 'empty' | 'tables' | 'joined' | 'transformed' | 'healthy';
  activeTab: 'columns' | 'tables' | 'preview' | 'notebook';
  publishedVersion: number;       // 0 = never saved
  hasUnpublishedChanges: boolean;
  projectSource: 'warehouse' | 'dbt';
  context: ProjectContext;        // purpose, persona, sampleQuestions, businessLogic, spotterInstructions
  addedTables: string[];
  columnsSelected: boolean;
  includedColumns: Record<string, string[]>;
  columnOverrides: Record<string, {...}>;
  prepTransforms?: PrepTransform[];
  dqStatus?: 'idle' | 'scanning' | 'issues_found' | 'fixing' | 'done';
  // ⚠️ Multi-source scaffolding, out of scope — kept only for the agent panel's
  // scripted flows. See queue item 11 in DESIGN.md.
  spotStoreTables?: string[];
  multiSourceCreated?: {...}[];
}
```

---

## The agent's canvas API

The entire surface between a conversation and the canvas is three calls:
`agentAddTables`, `agentAddJoins`, `agentAddPythonSource`.

**The agent cannot trigger caching and cannot save a model** — those are human-only.

---

## Figma files

| File | Key |
|------|-----|
| FigJam (workflow diagrams) | `60MAfL7Hw61kD5ygWPHMZI` |
| Figma (UI designs) | `qLZ511mHw8l2vXlyJKRCsv` |

Never create new Figma or FigJam files for Data Studio. Always write into these two.
