import React, { useState, useRef, useEffect } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { ProjectState, ProjectContext } from '../index';
import { agentEnabled, routeMessage, executeFindTables, executeCreateJoins, executeCreateMetric, executeSelectColumns } from '../api/agent';
import { tableMetadata, relationships } from '../data/mockData';
import PromptBar, { PromptBarRef } from './PromptBar';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentMessage {
  id: string;
  type: 'user' | 'working' | 'response' | 'execution';
  content: string;
  steps?: WorkingStep[];
  stepsCollapsed?: boolean;
  duration?: string;
  pendingAction?: PendingAction;
  suggestions?: string[];
}

interface WorkingStep {
  label: string;
  detail?: string;
  collapsible?: string;
  collapsibleOpen?: boolean;
  status: 'pending' | 'running' | 'done';
}

interface PendingAction {
  key: string;
  nextStep: ProjectState['buildStep'];
  dynamicTables?: string[];                    // tables Claude returned at runtime
  dynamicColumns?: Record<string, string[]>;   // column selection Claude returned at runtime
}

interface StepDef {
  label: string;
  detail?: string;
  collapsible?: string;
}

// ── Scripted flows ────────────────────────────────────────────────────────────

const SCRIPTS: Record<string, {
  steps: StepDef[];
  duration: string;
  proposal: string;
  execution: string;
  nextStep: ProjectState['buildStep'];
  contextUpdate?: Partial<ProjectContext>;
  newName?: string;
  setsProfileComplete?: boolean;
  setsColumnsSelected?: boolean;
  preserveStep?: boolean;          // if true, buildStep is NOT changed on confirm
  defaultColumns?: Record<string, string[]>; // fallback column selection
  lineDelay?: number;
  executionSuggestions?: string[];
  tablesToAdd?: string[];
}> = {

  find_tables: {
    steps: [
      {
        label: 'Understanding your request',
        detail: 'Analyzing your use case to identify the right tables from connected data sources.',
      },
      {
        label: 'Scanning Snowflake warehouse',
        detail: '120 tables scanned. Found 3 matches based on column names, descriptions, and semantic overlap — orders, campaigns, users.',
      },
      {
        label: 'Scanning dbt Analytics',
        detail: 'No matching models found in dbt Analytics for this use case.',
      },
      {
        label: 'Preparing recommendations',
        detail: '3 table recommendations ready with row counts, column previews, and join key candidates.',
      },
    ],
    duration: '28 seconds',
    proposal: `I found **3 tables** in your Snowflake connection that cover order transactions, campaign attribution, and user demographics.

**orders**
~Sarah-Snowflake · marketing_db · analytics · Updated Mar 28 · 150 rows~
order_id (string), user_id (string), campaign_id (string), order_date (date), amount (number) +3 more columns

**campaigns**
~Sarah-Snowflake · marketing_db · analytics · Updated Mar 28 · 45 rows~
campaign_id (string), campaign_name (string), channel (string), budget (number), spend (number) +4 more columns

**users**
~Sarah-Snowflake · marketing_db · analytics · Updated Mar 28 · 90 rows~
user_id (string), name (string), email (string), signup_date (date), region (string) +3 more columns

Would you like me to add these to your project?`,
    execution: `Added **3 tables** to your project:
✓ orders — 150 rows · 8 columns (Sarah-Snowflake · marketing_db)
✓ campaigns — 45 rows · 9 columns (Sarah-Snowflake · marketing_db)
✓ users — 90 rows · 8 columns (Sarah-Snowflake · marketing_db)

Tables are now visible in the left panel.`,
    nextStep: 'tables',
    contextUpdate: {
      persona: 'Marketing analyst at an e-commerce company focused on campaign attribution, ROI, and regional performance.',
      sampleQuestions: 'Which campaigns drove the most orders last month?\nWhat is the return on spend per campaign channel?\nHow do campaigns perform across regions and user segments?',
    },
    newName: 'Marketing Campaign Attribution',
    executionSuggestions: ['Identify joins', 'Select columns', 'Profile the data'],
    tablesToAdd: ['orders', 'campaigns', 'users'],
  },

  create_joins: {
    steps: [
      {
        label: 'Reading table schemas',
        detail: 'Loaded schemas for orders (8 cols), campaigns (10 cols), users (8 cols). Total 26 columns across 3 tables.',
      },
      {
        label: 'Finding relationships',
        detail: 'Found campaign_id in orders and campaigns. Found user_id in orders and users. No other key overlap detected.',
      },
      {
        label: 'Scoring join confidence',
        detail: 'orders.campaign_id → campaigns.campaign_id: 82% match rate (27 nulls — LEFT JOIN recommended).\norders.user_id → users.user_id: 100% match rate — INNER JOIN safe.',
      },
      {
        label: 'Generating join SQL',
        detail: 'Two JOIN clauses written and validated against live schema.',
        collapsible: `SELECT
  o.*,
  c.campaign_name, c.channel, c.spend, c.impressions,
  u.segment, u.region
FROM orders o
LEFT JOIN campaigns c ON o.campaign_id = c.campaign_id
INNER JOIN users u ON o.user_id = u.user_id`,
      },
    ],
    duration: '15 seconds',
    proposal: `I found **2 joins** that connect your tables:

**orders × campaigns** — orders.campaign_id → campaigns.campaign_id
Many-to-one · 82% match rate · LEFT JOIN (preserves organic orders with no campaign)

**orders × users** — orders.user_id → users.user_id
Many-to-one · 100% match rate · INNER JOIN

Shall I create both?`,
    execution: `Created **2 joins**:
✓ orders × campaigns (LEFT JOIN on campaign_id)
✓ orders × users (INNER JOIN on user_id)

Visualizer and Data Preview updated.`,
    nextStep: 'joined',
    executionSuggestions: ['Select columns', 'Add calculated columns', 'Profile the data'],
  },

  create_metric: {
    steps: [
      {
        label: 'Scanning schema for opportunities',
        detail: 'Reviewed 25 columns across the joined dataset. Identified 3 metric candidates aligned with campaign performance.',
      },
      {
        label: 'Validating Return on Spend',
        detail: 'NULLIF prevents division-by-zero on zero-spend campaigns. Sample values: 2.41, 1.87, 3.12, 0.94…',
        collapsible: `SUM(orders.amount) / NULLIF(campaigns.spend, 0)
-- Output: FLOAT · handles zero-spend rows`,
      },
      {
        label: 'Validating Conversion Rate',
        detail: 'Impression data available in campaigns. Expressed as percentage. Sample: 3.2%, 1.8%, 4.7%…',
        collapsible: `COUNT(orders.order_id) / NULLIF(campaigns.impressions, 0) * 100
-- Output: FLOAT (percentage)`,
      },
      {
        label: 'Validating Days to Convert',
        detail: 'Lag between campaign start and order date. Date formats normalized before diff. Sample: 3, 7, 1, 14…',
        collapsible: `DATEDIFF(orders.order_date, campaigns.start_date)
-- Output: INTEGER (days)`,
      },
    ],
    duration: '22 seconds',
    proposal: `Based on your campaign performance goal, I can add **3 calculated columns**:

**1. Return on Spend**
SUM(orders.amount) / NULLIF(campaigns.spend, 0)
Sample: 2.41, 1.87, 3.12, 0.94…

**2. Conversion Rate**
COUNT(orders.order_id) / NULLIF(campaigns.impressions, 0) * 100
Sample: 3.2%, 1.8%, 4.7%…

**3. Days to Convert**
DATEDIFF(orders.order_date, campaigns.start_date)
Sample: 3, 7, 1, 14…

These will appear as new columns in Data Preview. Shall I add them?`,
    execution: `Added **3 calculated columns**:
✓ Return on Spend — formula validated, column populated
✓ Conversion Rate — formula validated, column populated
✓ Days to Convert — formula validated, column populated

SQL cells added to Notebook.`,
    nextStep: 'transformed',
    executionSuggestions: ['Profile the data', 'Fix data quality issues', 'Test the model'],
  },

  select_columns: {
    steps: [
      {
        label: 'Inventorying columns',
        detail: 'Reading schemas for 3 tables: 26 columns found (orders: 8, campaigns: 10, users: 8).',
      },
      {
        label: 'Applying criteria filters',
        detail: 'Found: 3 PII columns (users.name, email, age), 1 system field (order_id), 1 duplicate dimension (users.region), 5 low-signal columns for this use case.',
      },
      {
        label: 'Scoring relevance to use case',
        detail: 'Campaign performance goal: prioritising spend, amount, impressions as measures; channel, region, segment as key dimensions.',
      },
      {
        label: 'Preparing recommendation',
        detail: '16 columns recommended across 3 tables. 4 criteria applied.',
      },
    ],
    duration: '18 seconds',
    proposal: `Your **3 tables** have **26 columns** total. Before recommending, I applied 4 criteria:

**Removed PII** (3 columns): \`users.name\`, \`users.email\`, \`users.age\` — personal data, excluded by default

**Removed system fields** (1 column): \`orders.order_id\` — internal row ID, not useful for analysis

**Removed duplicate dimensions** (1 column): \`users.region\` — same concept already in \`orders.region\`

**Removed low-signal for campaign performance** (5 columns): \`orders.product_category\`, \`orders.status\`, \`campaigns.start_date\`, \`campaigns.end_date\`, \`campaigns.status\`

That leaves **16 columns** for your campaign performance model:

**orders** (5 of 8): \`campaign_id\`*, \`user_id\`*, \`order_date\`, \`amount\`, \`region\`
**campaigns** (7 of 10): \`campaign_id\`*, \`campaign_name\`, \`channel\`, \`spend\`, \`budget\`, \`impressions\`, \`target_region\`
**users** (4 of 8): \`user_id\`*, \`segment\`, \`lifetime_value\`, \`signup_date\`

_\\* = join key, auto-included_

Want me to apply this? You can adjust: "include product_category", "skip budget", or "include all columns".`,
    execution: '',  // computed dynamically in handleConfirm
    nextStep: 'joined',
    preserveStep: true,
    setsColumnsSelected: true,
    defaultColumns: {
      orders:    ['campaign_id', 'user_id', 'order_date', 'amount', 'region'],
      campaigns: ['campaign_id', 'campaign_name', 'channel', 'spend', 'budget', 'impressions', 'target_region'],
      users:     ['user_id', 'segment', 'lifetime_value', 'signup_date'],
    },
    executionSuggestions: ['Add calculated columns', 'Profile the data', 'Test the model'],
  },

  profile_data: {
    steps: [
      {
        label: 'Scanning columns',
        detail: '285 total rows. orders: 150 rows · 8 cols. campaigns: 45 rows · 9 cols. users: 90 rows · 8 cols.',
      },
      {
        label: 'Computing null rates',
        detail: 'orders.campaign_id: 18% null (27 rows). users.segment: 15% null (14 rows). campaigns.end_date: 13% null (6 rows).',
      },
      {
        label: 'Detecting duplicates and anomalies',
        detail: 'orders: 7 duplicate order_ids. campaigns: 2 duplicate campaign_ids. users.age: 4 anomalous values (0, −3, 142, 199).',
      },
      {
        label: 'Checking date formats',
        detail: 'orders.order_date: MM/DD/YYYY. campaigns.start_date: YYYY-MM-DD. users.signup_date: YYYY/MM/DD. 3-way mismatch — date joins may fail.',
      },
      {
        label: 'Computing health score',
        detail: '24 issues found: 9 data issues and 15 semantic issues (missing descriptions). Score: Poor (34/100).',
      },
    ],
    duration: '41 seconds',
    proposal: `Here's your **data profile** across 3 tables (285 rows):

**orders** (150 rows)
- amount: avg $1,240 · min $12 · max $55,900 ⚠ outlier flagged
- campaign_id: 18% null — 27 likely organic orders
- order_date: MM/DD/YYYY — mismatch with other tables ⚠

**campaigns** (45 rows)
- spend: avg $8,400 · range $1,200–$42,000
- campaign_id: 2 duplicate IDs ⚠
- start_date: YYYY-MM-DD — format mismatch ⚠

**users** (90 rows)
- age: 4 anomalous values (0, −3, 142, 199) ⚠
- segment: 15% null — 14 unclassified users

**24 issues** found. Data health: **Poor (34/100)**. Want me to fix these?`,
    execution: `Profile saved to project:
✓ Column statistics computed for all 24 columns
✓ 4 anomalies flagged in orders.amount
✓ 3 date format mismatches identified

Data health: **Poor (34/100)**.`,
    nextStep: 'transformed',
    setsProfileComplete: true,
    executionSuggestions: ['Fix data quality issues', 'Add column descriptions', 'Test the model'],
  },

  fix_health: {
    steps: [
      {
        label: 'Loading data profile',
        detail: '24 issues loaded: 9 data issues, 15 semantic issues (missing column descriptions).',
      },
      {
        label: 'Prioritizing by severity',
        detail: 'Semantic issues ranked first — missing descriptions have the highest impact on AI accuracy.',
      },
      {
        label: 'Building fix plan',
        detail: '5 steps: add descriptions (20 cols), remove duplicates (9 rows), fill nulls (27 rows), normalize dates (3 tables), flag anomalies (4 values).',
      },
    ],
    duration: '12 seconds',
    proposal: `I'll fix all **24 issues** in 5 steps:

1. Add column descriptions (20 columns missing metadata)
2. Remove duplicate rows (orders: 7, campaigns: 2)
3. Fill null campaign_ids → 'organic' (27 rows)
4. Normalize date formats across all 3 tables
5. Flag anomalous amounts with an is_anomaly column

Shall I proceed?`,
    execution: `Fixing 24 issues step by step...
✓ Step 1 — Added descriptions to all 20 columns
✓ Step 2 — Removed 9 duplicate rows (orders: 7, campaigns: 2)
✓ Step 3 — Filled 27 null campaign_ids → 'organic'
✓ Step 4 — Standardized all dates to YYYY-MM-DD
✓ Step 5 — Flagged 4 anomalous values with is_anomaly column

**Data health is now Good (82/100).** Your model is AI-ready.`,
    nextStep: 'healthy',
    lineDelay: 600,
    executionSuggestions: ['Test the model', 'Publish model', 'Share with team'],
    contextUpdate: {
      businessLogic: "Orders with null campaign_id are organic — keep them in revenue totals with LEFT JOIN.\nDuplicate order_ids removed; latest row per order_id is kept.\nDates normalized to YYYY-MM-DD across all tables.",
      spotterInstructions: 'For "top campaigns" sort by return_on_spend descending. "Latest" means last 30 days. "Organic" orders have no campaign attribution.',
    },
  },
};

// ── Script matching ───────────────────────────────────────────────────────────

function matchScript(input: string): string {
  const lower = input.toLowerCase();
  if (lower.match(/\b(yes|yeah|yep|yup|ya|yea|sure|ok|okay|cool|great|perfect|sounds good|let'?s go|go ahead|proceed|do it|add it|add them|please|definitely|absolutely|go for it|make it so)\b/)) return '__confirm__';
  if (lower.match(/help|what can you|what do you|capabilities|skills|how do you|what should|^h+i+$|^hey|^hello|^howdy|^sup|^yo\b|^greetings|^good (morning|afternoon|evening)/)) return '__help__';
  if (lower.match(/identify joins?|find joins?|create joins?/)) return 'create_joins';
  if (lower.match(/select columns?|choose columns?|pick columns?/)) return 'select_columns';
  if (lower.match(/add (?:calculated )?metrics?|add formulae?/)) return 'create_metric';
  if (lower.match(/test the model|run test|test model/)) return 'test_model';
  if (lower.match(/publish model|publish the model/)) return 'publish';
  if (lower.match(/share with team|share model|share the model/)) return 'share';
  if (lower.match(/profile|profil|stat|distribution|quality check|scan|inspect|describe|overview|summary of (the )?data/)) return 'profile_data';
  if (lower.match(/join|connect|relationship|link/)) return 'create_joins';
  if (lower.match(/roi|return on spend|metric|formula|calculat|column|field|transform/)) return 'create_metric';
  if (lower.match(/health|fix|improve|clean|issue|null|duplicate|description|anomal/)) return 'fix_health';
  if (lower.match(/campaign|performance|table|data|analyze|analysis|order|user/)) return 'find_tables';
  return '__unknown__';
}

// ── Direct table name detection ───────────────────────────────────────────────
// Catches two types of specific-table intent — both bypass Claude and go straight to runDirectAdd:
//   1. Explicit commands: "add orders", "bring in campaigns table"
//   2. Work-intent phrases: "explore orders", "show me users", "I want to look at orders"
// Pattern 2 validates the candidate name against tableMetadata so we don't false-positive
// on words like "my", "the", "some" that happen to follow a work verb.

// Resolves a candidate word to a known tableMetadata key.
// Handles singular/plural mismatch: "campaign" → "campaigns", "order" → "orders".
function resolveTableName(candidate: string): string | null {
  if (tableMetadata[candidate]) return candidate;
  if (tableMetadata[candidate + 's']) return candidate + 's';
  if (candidate.endsWith('s') && tableMetadata[candidate.slice(0, -1)]) return candidate.slice(0, -1);
  return null;
}

// Returns known table names mentioned anywhere in the text — exact word match only.
// Singular forms (e.g. "campaign" → "campaigns") are NOT matched here; they are handled
// only in Pattern 1 (explicit add commands) via resolveTableName. This prevents
// use-case descriptions like "Analyze campaign performance" from triggering a direct add.
function mentionedTableNames(lower: string): string[] {
  return Object.keys(tableMetadata).filter(name =>
    new RegExp(`\\b${name}\\b`).test(lower)
  );
}

// Returns the minimum word-index distance between any work verb and a word position in `words`.
function minVerbDistance(words: string[], targetIdx: number): number {
  const VERB_LIST = ['explore','see','show','load','fetch','analyze','analyse','check','open',
                     'view','look','pull','work','review','examine','browse','query','need','want','add'];
  let min = Infinity;
  words.forEach((w, i) => { if (VERB_LIST.includes(w)) min = Math.min(min, Math.abs(i - targetIdx)); });
  return min;
}

function extractDirectAddTable(input: string): string | null {
  const lower = input.toLowerCase().trim();

  // Pattern 1 — explicit add/import commands (full-string match)
  // Fuzzy-resolves the captured name so "add campaign table" → campaigns.
  const explicit = lower.match(
    /^(?:add|bring in|use|include|import)\s+(?:the\s+)?([a-z_][a-z0-9_]*)(?:\s+(?:table|view|model|data))?$/
  );
  if (explicit) {
    const resolved = resolveTableName(explicit[1]);
    if (resolved) return resolved;
  }

  // Pattern 2 — work-intent verb + known table names with a word-proximity check.
  //
  // The proximity check (≤ 3 words apart) prevents false-positive direct-adds on
  // use-case descriptions that happen to mention a table name far from the verb, e.g.:
  //   "I need to understand how campaigns drive revenue" → need@1, campaigns@5 → dist=4 → skip ✓
  //   "explore the orders table" → explore@0, orders@2 → dist=2 → direct add ✓
  //
  // Returns the single matched table (if exactly one is close enough) or null.
  // Multi-table cases (2+ tables nearby) are handled separately in processText.
  const WORK_VERB_RX = /\b(?:explore|see|show|load|fetch|analyze|analyse|check|open|view|look|pull|work|review|examine|browse|query|need|want|add)\b/;
  if (WORK_VERB_RX.test(lower)) {
    const words = lower.split(/\s+/);
    const nearby = mentionedTableNames(lower).filter(name => {
      const form = lower.includes(name) ? name : name.slice(0, -1); // exact or singular
      const idx = words.findIndex(w => w === form || w === name);
      return idx >= 0 && minVerbDistance(words, idx) <= 3;
    });
    if (nearby.length === 1) return nearby[0];
  }

  return null;
}

// ── Flow runner ───────────────────────────────────────────────────────────────
// contentPromise: optional parallel Claude call that runs during the animation.
// When it resolves, its proposal + tables override the hardcoded script values.
// If null or rejected, falls back to the hardcoded script content.

function runFlow(
  key: string,
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>,
  setPendingAction: (a: PendingAction) => void,
  setIsProcessing: (v: boolean) => void,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>,
  userText?: string,
  contentPromise?: Promise<{ proposal: string; tables?: string[]; includedColumns?: Record<string, string[]> } | null>,
) {
  const script = SCRIPTS[key];
  const workingId = `w-${Date.now()}`;

  // Step 0 detail shows the user's actual message so it never reads the same way twice
  const step0Detail = userText
    ? `"${userText.length > 120 ? userText.slice(0, 120) + '…' : userText}"`
    : script.steps[0]?.detail;

  setMessages(prev => [...prev, {
    id: workingId, type: 'working', content: '',
    duration: script.duration,
    steps: script.steps.map((s, i) => ({
      label: s.label,
      detail: i === 0 ? step0Detail : s.detail,
      collapsible: s.collapsible,
      collapsibleOpen: false,
      status: 'pending' as const,
    })),
    stepsCollapsed: false,
  }]);

  script.steps.forEach((_, idx) => {
    setTimeout(() => {
      setMessages(prev => prev.map(m => {
        if (m.id !== workingId || !m.steps) return m;
        const steps = m.steps.map((s, i) =>
          i === idx     ? { ...s, status: 'done' as const } :
          i === idx + 1 ? { ...s, status: 'running' as const } : s
        );
        return { ...m, steps };
      }));

      if (idx === script.steps.length - 1) {
        // Async final callback — awaits the content promise (if any) before showing proposal
        (async () => {
          await new Promise(r => setTimeout(r, 400));

          // Resolve dynamic content — by now the Claude call has had 3+ seconds to complete
          const dynamic = contentPromise ? await contentPromise.catch(() => null) : null;
          const proposalText = dynamic?.proposal ?? script.proposal;

          setMessages(prev => prev.map(m =>
            m.id === workingId
              ? { ...m, stepsCollapsed: true, steps: m.steps?.map(s => ({ ...s, status: 'done' as const })) }
              : m
          ));
          const action: PendingAction = { key, nextStep: script.nextStep };
          setPendingAction(action);
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response', content: proposalText, pendingAction: action,
          }]);
          setIsProcessing(false);
          if (script.contextUpdate) {
            setProject(p => ({ ...p, context: { ...p.context, ...script.contextUpdate } }));
          }
          // Stage any dynamic data so confirm can use it
          if (dynamic?.tables && dynamic.tables.length > 0) {
            setPendingAction({ key, nextStep: script.nextStep, dynamicTables: dynamic.tables });
          }
          if (dynamic?.includedColumns && Object.keys(dynamic.includedColumns).length > 0) {
            setPendingAction({ key, nextStep: script.nextStep, dynamicColumns: dynamic.includedColumns });
          }
        })();
      }
    }, 600 + idx * 800);
  });
}

// ── Direct add runner (no proposal step) ─────────────────────────────────────

function runDirectAdd(
  tableNames: string[],
  project: ProjectState,
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>,
  setIsProcessing: (v: boolean) => void,
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>,
) {
  // Already-added check
  const alreadyAdded = tableNames.filter(n => project.addedTables.includes(n.toLowerCase()));
  if (alreadyAdded.length > 0) {
    const names = alreadyAdded.map(n => tableMetadata[n.toLowerCase()]?.name ?? n).join(', ');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `r-${Date.now()}`, type: 'response',
        content: `**${names}** ${alreadyAdded.length === 1 ? 'is' : 'are'} already in your project. You can view ${alreadyAdded.length === 1 ? 'it' : 'them'} in the Data panel on the left.`,
      }]);
      setIsProcessing(false);
    }, 300);
    return;
  }

  const knownTables = tableNames
    .map(n => tableMetadata[n.toLowerCase()] ?? tableMetadata[n.toLowerCase() + 's'] ?? null)
    .filter((t): t is typeof tableMetadata[string] => t !== null);

  if (knownTables.length === 0) {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `r-${Date.now()}`, type: 'response',
        content: `I couldn't find a table named **${tableNames.join(', ')}** in your connected data sources. Try browsing the warehouse with the **+** button in the Data panel, or describe your use case and I'll search for you.`,
      }]);
      setIsProcessing(false);
    }, 400);
    return;
  }

  const workingId = `w-${Date.now()}`;
  const steps: Array<{ label: string; detail?: string; status: 'pending' | 'running' | 'done' }> = [
    { label: `Locating ${knownTables.map(t => t.name).join(', ')}`, status: 'running' },
    { label: 'Loading schema and metadata', status: 'pending' },
  ];

  setMessages(prev => [...prev, {
    id: workingId, type: 'working', content: '', duration: '', stepsCollapsed: false,
    steps: steps.map(s => ({ ...s, collapsibleOpen: false })),
  }]);

  setTimeout(() => {
    setMessages(prev => prev.map(m => m.id !== workingId ? m : {
      ...m, steps: m.steps?.map((s, i) =>
        i === 0 ? { ...s, status: 'done' as const } :
        i === 1 ? { ...s, status: 'running' as const } : s
      ),
    }));
  }, 700);

  setTimeout(() => {
    setMessages(prev => prev.map(m =>
      m.id === workingId
        ? { ...m, stepsCollapsed: true, steps: m.steps?.map(s => ({ ...s, status: 'done' as const })) }
        : m
    ));

    // Build response text from real mock data
    const cards = knownTables.map(t => {
      const cols5 = t.columns.slice(0, 5).map(col => `${col.name} (${col.type})`).join(', ');
      const more  = t.columns.length > 5 ? ` +${t.columns.length - 5} more columns` : '';
      return `**${t.name}**\n~${t.connection} · marketing_db · analytics · Updated Mar 28 · ${t.rowCount} rows~\n${cols5}${more}`;
    }).join('\n\n');

    const intro = knownTables.length === 1
      ? `Found **${knownTables[0].name}** in your ${knownTables[0].connection} warehouse. I've added it to your project.`
      : `Found **${knownTables.length} tables** in your warehouse. I've added them to your project.`;

    const futureCount = new Set([...project.addedTables, ...knownTables.map(t => t.id)]).size;
    const suggestions = futureCount >= 2
      ? ['Identify joins', 'Select columns', 'Profile the data']
      : ['Find related tables', 'Select columns', 'Profile the data'];

    setMessages(prev => [...prev, {
      id: `r-${Date.now()}`, type: 'response',
      content: `${intro}\n\n${cards}`,
      suggestions,
    }]);

    setProject(p => ({
      ...p,
      buildStep: p.buildStep === 'empty' ? 'tables' : p.buildStep,
      addedTables: [...new Set([...p.addedTables, ...knownTables.map(t => t.id)])],
    }));
    setIsProcessing(false);
  }, 1600);
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AgentPanelProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  messages: AgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  initialPrompt?: string;
  onBuildComplete?: () => void;
  externalMessage?: string | null;
  onExternalMessageHandled?: () => void;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ project, setProject, messages, setMessages, initialPrompt, onBuildComplete, externalMessage, onExternalMessageHandled }) => {
  const [collapsed, setCollapsed]       = useState(false);
  const [pendingAction, setPending]     = useState<PendingAction | null>(null);
  const [isProcessing, setProcessing]   = useState(false);
  const messagesEndRef        = useRef<HTMLDivElement>(null);
  const promptBarRef          = useRef<PromptBarRef>(null);
  const buildCalledRef        = useRef(false);
  const initialPromptFiredRef = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!initialPrompt || initialPromptFiredRef.current) return;
    initialPromptFiredRef.current = true;
    processText(initialPrompt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!externalMessage) return;
    onExternalMessageHandled?.();
    processText(externalMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMessage]);

  useEffect(() => {
    if (!isProcessing) setTimeout(() => promptBarRef.current?.focus(), 50);
  }, [isProcessing]);

  useEffect(() => {
    if (buildCalledRef.current) return;
    if (messages.some(m => m.type === 'response')) {
      buildCalledRef.current = true;
      onBuildComplete?.();
    }
  }, [messages, onBuildComplete]);

  const toggleCollapsible = (msgId: string, stepIdx: number) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.steps) return m;
      return { ...m, steps: m.steps.map((s, i) => i === stepIdx ? { ...s, collapsibleOpen: !s.collapsibleOpen } : s) };
    }));
  };

  // ── Confirm handler (extracted so it can be called from multiple paths) ────

  const handleConfirm = () => {
    if (!pendingAction) return;
    const script   = SCRIPTS[pendingAction.key];
    const captured = pendingAction;
    setPending(null);
    const execId = `exec-${Date.now()}`;
    setMessages(prev => [...prev, { id: execId, type: 'execution', content: '' }]);

    // Build execution text dynamically for workflows where the hardcoded script doesn't fit.
    const executionText = (() => {
      if (captured.key === 'create_joins') {
        const activeRels = relationships.filter(
          r => project.addedTables.includes(r.leftTable) && project.addedTables.includes(r.rightTable)
        );
        if (activeRels.length > 0) {
          const joinLines = activeRels.map(r => {
            const left  = tableMetadata[r.leftTable]?.name  ?? r.leftTable;
            const right = tableMetadata[r.rightTable]?.name ?? r.rightTable;
            return `✓ ${left} × ${right} (${r.joinType.toUpperCase()} JOIN on ${r.leftColumn})`;
          });
          const n = joinLines.length;
          return `Created **${n} join${n !== 1 ? 's' : ''}**:\n${joinLines.join('\n')}\n\nVisualizer and Data Preview updated.`;
        }
        return `Joins created.\n\nVisualizer and Data Preview updated.`;
      }
      if (captured.key === 'create_metric') {
        return 'Calculated columns added to your project.\n\nSQL cells added to Notebook.';
      }
      if (captured.key === 'select_columns') {
        const cols = captured.dynamicColumns ?? script.defaultColumns ?? {};
        const colLines = Object.entries(cols).map(([tableId, colList]) => {
          const tableName = tableMetadata[tableId]?.name ?? tableId;
          return `✓ ${tableName} (${colList.length}): ${colList.join(', ')}`;
        });
        const total = Object.values(cols).reduce((sum, c) => sum + c.length, 0);
        return `Added **${total} columns** to your model:\n${colLines.join('\n')}\n\nColumn view and Data Preview updated.`;
      }
      return script.execution;
    })();

    const lines = executionText.split('\n');
    let i = 0;
    const interval = setInterval(() => {
      if (i >= lines.length) {
        clearInterval(interval);
        setProject(p => ({
          ...p,
          buildStep: script.preserveStep ? p.buildStep : captured.nextStep,
          name: script.newName && p.name === 'Untitled Project' ? script.newName : p.name,
          ...(script.setsProfileComplete ? { profileComplete: true } : {}),
          ...(script.setsColumnsSelected ? { columnsSelected: true } : {}),
          ...(script.contextUpdate ? { context: { ...p.context, ...script.contextUpdate } } : {}),
          ...(captured.dynamicTables
            ? { addedTables: [...new Set([...p.addedTables, ...captured.dynamicTables])] }
            : script.tablesToAdd
              ? { addedTables: [...new Set([...p.addedTables, ...script.tablesToAdd])] }
              : {}),
          ...(script.setsColumnsSelected
            ? { includedColumns: captured.dynamicColumns ?? script.defaultColumns ?? p.includedColumns }
            : {}),
        }));
        if (script.executionSuggestions) {
          setMessages(prev => prev.map(m =>
            m.id === execId ? { ...m, suggestions: script.executionSuggestions } : m
          ));
        }
        setProcessing(false);
        return;
      }
      setMessages(prev => prev.map(m =>
        m.id === execId ? { ...m, content: (m.content ?? '') + (i === 0 ? '' : '\n') + lines[i] } : m
      ));
      i++;
    }, script.lineDelay ?? 280);
  };

  // ── Stub responses for workflows not yet scripted ─────────────────────────

  const STUBS: Record<string, string> = {
    select_columns: `Column selection lets you choose which fields from each table to include in your project. This workflow is coming soon — all columns are included for now.`,
    test_model:     `Test mode lets you ask questions against your model and review the AI's reasoning. Use the **Test** button in the project header to enter test mode.`,
    coach:          `Coaching lets you fix a gap found during testing — the agent proposes a fix and writes it to memory. This workflow is coming soon.`,
    publish:        `Publishing makes your model available to business users via Spotter. Use the **Share** button in the header to publish and set access.`,
    share:          `Use the **Share** button in the top-right header to invite teammates and set their access level (viewer or editor).`,
  };

  // ── Core processing ──────────────────────────────────────────────────────────

  const processText = async (text: string, mentionedTables?: string[]) => {
    if (!text || isProcessing) return;
    setProcessing(true);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: text }]);

    // 1. @mention / direct add — always scripted, skip Claude
    if (mentionedTables && mentionedTables.length > 0) {
      runDirectAdd(mentionedTables, project, setMessages, setProcessing, setProject);
      return;
    }
    const directTable = extractDirectAddTable(text);
    if (directTable) {
      runDirectAdd([directTable], project, setMessages, setProcessing, setProject);
      return;
    }

    // 1b. Multi-table direct add: work verb + 2+ known table names all nearby
    // e.g. "explore orders and campaigns" → add both without going through Claude
    const WORK_VERB_RX2 = /\b(?:explore|see|show|load|fetch|analyze|analyse|check|open|view|look|pull|work|review|examine|browse|query|need|want|add)\b/;
    if (WORK_VERB_RX2.test(text.toLowerCase())) {
      const lower2 = text.toLowerCase();
      const words2 = lower2.split(/\s+/);
      const nearbyMulti = mentionedTableNames(lower2).filter(name => {
        const form = lower2.includes(name) ? name : name.slice(0, -1);
        const idx = words2.findIndex(w => w === form || w === name);
        return idx >= 0 && minVerbDistance(words2, idx) <= 3;
      });
      if (nearbyMulti.length >= 2) {
        runDirectAdd(nearbyMulti, project, setMessages, setProcessing, setProject);
        return;
      }
    }

    // 2. Obvious confirm — fires with OR without a pending proposal
    const OBVIOUS_CONFIRM = /^(yes|yeah|yep|yup|ya|yea|sure|ok|okay|cool|great|perfect|sounds good|let'?s go|go ahead|proceed|do it|add it|add them|add those|add these|add the above|add them all|please|definitely|absolutely|go for it|make it so|looks good|that looks good|these look good|those look good|looks right|that works|works for me|make sense|makes sense|that makes sense|that'?s right|sounds right|good to go|confirm|confirmed|correct|i agree|agreed|that'?s good|all good|apply|apply this|apply it|apply them|create those|create them|all of them|all of the above|do those|do them)[\s!.,?]*$/i;
    if (OBVIOUS_CONFIRM.test(text.trim())) {
      if (pendingAction) {
        handleConfirm();
        return;
      }
      // No pending proposal — infer the next logical workflow from buildStep
      const inferredKey =
        project.buildStep === 'tables'      ? 'create_joins' :
        project.buildStep === 'joined'      ? 'create_metric' :
        project.buildStep === 'transformed' ? 'fix_health' : null;
      if (inferredKey) {
        const contentPromise =
          inferredKey === 'create_joins'  ? (agentEnabled() ? executeCreateJoins(project).catch(() => null) : undefined) :
          inferredKey === 'create_metric' ? (agentEnabled() ? executeCreateMetric(text, project).catch(() => null) : undefined) :
          undefined;
        runFlow(inferredKey, setMessages, setPending, setProcessing, setProject, text, contentPromise);
        return;
      }
    }

    // 2b. Join request with only one table — skip Claude, give a clear scripted nudge
    const JOIN_INTENT = /\b(identify|create|add|set[\s-]up|define|find|make)\b[\s\S]*\b(join|relationship|relation)\b|\bidentify joins?\b/i;
    if (JOIN_INTENT.test(text) && project.addedTables.length === 1) {
      const tableName = tableMetadata[project.addedTables[0]]?.name ?? project.addedTables[0];
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `r-${Date.now()}`, type: 'response',
          content: `I need at least **2 tables** to identify joins. Right now you only have **${tableName}** in your project.\n\nUse **@** to add another table directly, or describe your use case and I'll search the warehouse for related tables.`,
          suggestions: ['Find related tables'],
        }]);
        setProcessing(false);
      }, 200);
      return;
    }

    // 2c. "Find related tables" (chip or similar phrasing) — run find_tables regardless of buildStep
    // This lets the chip work even after a single-table direct add (where find_tables skill is unavailable).
    if (/\bfind\b.{0,20}\b(related|more|additional|other)?\s*(tables?|data)\b/i.test(text)) {
      const contentPromise = agentEnabled() ? executeFindTables(text).catch(() => null) : undefined;
      runFlow('find_tables', setMessages, setPending, setProcessing, setProject, text, contentPromise);
      return;
    }

    // 2d. Metric / formula intent shortcut — skip Claude when the user clearly wants calculated columns.
    // This fires even when no specific metric is named (e.g. "add calculated columns", "create metrics").
    // executeCreateMetric will determine appropriate metrics from project context.
    const METRIC_TRIGGER = /\b(add|create|build|make|generate)\b.{0,35}\b(calculated?\s+(?:col(?:umns?)?|field[s]?)|formula[es]?|metric[s]?|kpi[s]?|measure[s]?)\b/i;
    if (METRIC_TRIGGER.test(text)) {
      const metricAvailable = project.buildStep === 'joined' || project.buildStep === 'transformed' || project.buildStep === 'healthy';
      if (metricAvailable) {
        const contentPromise = agentEnabled() ? executeCreateMetric(text, project).catch(() => null) : undefined;
        runFlow('create_metric', setMessages, setPending, setProcessing, setProject, text, contentPromise);
        return;
      }
    }

    // 3. Claude routing (when API available)
    if (agentEnabled()) {
      const routingId = `w-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: routingId, type: 'working', content: '', duration: '', stepsCollapsed: false,
        steps: [{ label: 'Understanding your request', detail: `"${text.length > 120 ? text.slice(0, 120) + '…' : text}"`, status: 'running' as const }],
      }]);

      try {
        const result = await routeMessage(text, project, pendingAction?.key ?? null);

        // Collapse the routing indicator before dispatching
        setMessages(prev => prev.map(m =>
          m.id === routingId
            ? { ...m, stepsCollapsed: true, steps: m.steps?.map(s => ({ ...s, status: 'done' as const })) }
            : m
        ));

        if ('action' in result) {
          const { action } = result;

          // Confirm a pending proposal
          if (action === 'confirm') {
            if (pendingAction) {
              handleConfirm();
            } else {
              const inferredKey =
                project.buildStep === 'tables'      ? 'create_joins' :
                project.buildStep === 'joined'      ? 'create_metric' :
                project.buildStep === 'transformed' ? 'fix_health' : null;
              if (inferredKey) runFlow(inferredKey, setMessages, setPending, setProcessing, setProject);
              else {
                setMessages(prev => [...prev, { id: `r-${Date.now()}`, type: 'response', content: 'Your model is AI-ready. Use the **Share** button to publish it.' }]);
                setProcessing(false);
              }
            }
            return;
          }

          // Run a fully built script
          if (action in SCRIPTS) {
            const contentPromise =
              action === 'find_tables'    ? executeFindTables(text).catch(() => null) :
              action === 'create_joins'   ? executeCreateJoins(project).catch(() => null) :
              action === 'create_metric'  ? executeCreateMetric(text, project).catch(() => null) :
              action === 'select_columns' ? executeSelectColumns(project).catch(() => null) :
              undefined;
            runFlow(action, setMessages, setPending, setProcessing, setProject, text, contentPromise);
            return;
          }

          // Stub: workflow recognised but not yet built
          if (action in STUBS) {
            setTimeout(() => {
              setMessages(prev => [...prev, { id: `r-${Date.now()}`, type: 'response', content: STUBS[action] }]);
              setProcessing(false);
            }, 200);
            return;
          }
        }

        // CHAT response — show Claude's answer directly
        setMessages(prev => [...prev, {
          id: `r-${Date.now()}`, type: 'response',
          content: (result as { chat: string }).chat,
        }]);
        setProcessing(false);

      } catch (e) {
        setMessages(prev => prev.filter(m => m.id !== routingId));
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`, type: 'response',
          content: `Something went wrong: ${e instanceof Error ? e.message : 'Unknown error'}`,
        }]);
        setProcessing(false);
      }
      return;
    }

    // 4. Scripted fallback — no API key configured
    if (project.buildStep === 'empty') {
      runFlow('find_tables', setMessages, setPending, setProcessing, setProject, text);
      return;
    }

    const scriptKey = matchScript(text);

    if (scriptKey === '__confirm__' && pendingAction) { handleConfirm(); return; }

    if (scriptKey === '__confirm__' && !pendingAction) {
      const inferredKey =
        project.buildStep === 'tables'      ? 'create_joins' :
        project.buildStep === 'joined'      ? 'create_metric' :
        project.buildStep === 'transformed' ? 'fix_health' : null;
      if (inferredKey) { runFlow(inferredKey, setMessages, setPending, setProcessing, setProject); return; }
      setMessages(prev => [...prev, { id: `r-${Date.now()}`, type: 'response', content: 'Your model is AI-ready. Use the **Share** button to publish it.' }]);
      setProcessing(false);
      return;
    }

    if (scriptKey === '__help__') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `r-${Date.now()}`, type: 'response',
          content: `Here's what I can help you build:\n\n**1. Bring tables** — Describe your use case. I'll search the warehouse and add the right tables.\n\n**2. Create joins** — I'll find shared keys, score confidence, and propose the right join type.\n\n**3. Add calculated columns** — Describe a metric. I'll write the SQL and validate it.\n\n**4. Profile data** — I'll scan all columns for nulls, anomalies, and format issues.\n\n**5. Fix data health** — I'll prioritize issues from the profile and fix them step by step.`,
        }]);
        setProcessing(false);
      }, 300);
      return;
    }

    if (scriptKey in STUBS) {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `r-${Date.now()}`, type: 'response', content: STUBS[scriptKey] }]);
        setProcessing(false);
      }, 300);
      return;
    }

    if (scriptKey === '__unknown__') {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `r-${Date.now()}`, type: 'response', content: `I'm not sure I understood that. Try describing what you want to build, or ask *"what can you do?"*` }]);
        setProcessing(false);
      }, 300);
      return;
    }

    runFlow(scriptKey, setMessages, setPending, setProcessing, setProject);
  };

  // ── Collapsed panel ──────────────────────────────────────────────────────────

  if (collapsed) {
    return (
      <div style={{ width: 40, borderLeft: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: sp.D, flexShrink: 0 }}>
        <button onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: c['content-secondary'], padding: sp.A }}>«</button>
        <span style={{ marginTop: sp.F, fontSize: fs.xs, color: c['content-secondary'], writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: 1 }}>DATA AGENT</span>
      </div>
    );
  }

  // ── Full panel ───────────────────────────────────────────────────────────────

  return (
    <div style={{ width: 340, flexShrink: 0, borderLeft: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes ag-spin { to { transform: rotate(360deg); } }
        .ag-gradient-text {
          background: linear-gradient(to right, #2770ef 4%, #777e8b);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; display: inline-block;
        }
      `}</style>

      {/* Header */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `0 ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        <span style={{ fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.4px' }}>Data Agent</span>
        <button onClick={() => setCollapsed(true)} title="Collapse panel" style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: 14, padding: sp.A }}>»</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.C}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.D }}>

        {messages.length === 0 && !initialPrompt && (
          <div style={{ textAlign: 'center', padding: `${sp.H}px ${sp.D}px` }}>
            <AgentAvatarLarge />
            <p style={{ fontSize: fs.sm, color: c['content-secondary'], margin: `${sp.C}px 0 ${sp.F}px`, lineHeight: '20px' }}>
              Describe what you want to build. I'll find the right data and set everything up.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
              {['I want to analyze campaign performance', 'Help me understand how campaigns drive orders', 'How can I improve my data health?'].map(hint => (
                <button key={hint} onClick={() => promptBarRef.current?.setValue(hint)}
                  style={{ padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 8, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary, textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const isAfterWorking = (msg.type === 'response' || msg.type === 'execution') && prevMsg?.type === 'working';
          return (
            <div key={msg.id} style={{ marginTop: isAfterWorking ? -sp.B : 0 }}>
              <MessageBubble
                msg={msg}
                showAvatar={!isAfterWorking}
                onToggleSteps={id => setMessages(prev => prev.map(m => m.id === id ? { ...m, stepsCollapsed: !m.stepsCollapsed } : m))}
                onToggleCollapsible={toggleCollapsible}
                onSuggestion={text => processText(text)}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt bar */}
      <div style={{ padding: `${sp.B}px ${sp.C}px ${sp.C}px`, borderTop: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        <PromptBar
          ref={promptBarRef}
          onSubmit={(text, tables) => processText(text, tables)}
          disabled={isProcessing}
          placeholder="Give me a task. Use '@' to mention tables."
          autoFocus
          dropDirection="up"
          compact
        />
      </div>

      {/* Disclaimer */}
      <p style={{ textAlign: 'center', fontSize: 11, color: c['content-secondary'], padding: `${sp.A}px ${sp.D}px ${sp.B}px`, margin: 0, lineHeight: '16px' }}>
        Agent responses should be reviewed. <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Learn more</span>
      </p>
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────

// ── Suggestion chips ──────────────────────────────────────────────────────────

const SuggestionChips: React.FC<{ suggestions: string[]; onSelect: (s: string) => void }> = ({ suggestions, onSelect }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, marginTop: sp.C }}>
    {suggestions.map(s => (
      <button
        key={s}
        onClick={() => onSelect(s)}
        style={{
          padding: `${sp.A}px ${sp.C}px`,
          borderRadius: 20,
          border: `1px solid ${c['border-default']}`,
          backgroundColor: c['background-base'],
          color: c['content-primary'],
          fontSize: fs.xs,
          cursor: 'pointer',
          fontFamily: ff.primary,
          lineHeight: '18px',
          transition: 'all 0.1s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = c['content-brand']; e.currentTarget.style.color = c['content-brand']; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.color = c['content-primary']; }}
      >
        {s}
      </button>
    ))}
  </div>
);

const MessageBubble: React.FC<{
  msg: AgentMessage;
  showAvatar: boolean;
  onToggleSteps: (id: string) => void;
  onToggleCollapsible: (msgId: string, stepIdx: number) => void;
  onSuggestion: (text: string) => void;
}> = ({ msg, showAvatar, onToggleSteps, onToggleCollapsible, onSuggestion }) => {

  // ── User bubble ────────────────────────────────────────────────────────────
  if (msg.type === 'user') {
    return (
      <div style={{ backgroundColor: c['background-sunken'], borderRadius: 12, padding: `${sp.C}px ${sp.D}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.B }}>
          <UserAvatar />
        </div>
        <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px', fontWeight: fw.regular }}>
          {msg.content}
        </p>
      </div>
    );
  }

  // ── Working / thinking block ───────────────────────────────────────────────
  if (msg.type === 'working') {
    const allDone   = msg.steps?.every(s => s.status === 'done') ?? false;
    const isCollapsed = msg.stepsCollapsed ?? false;

    return (
      <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
        <AgentAvatar />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>

          {/* "Work done" header — only once all steps are complete */}
          {allDone && (
            <div
              onClick={() => onToggleSteps(msg.id)}
              style={{ display: 'flex', alignItems: 'center', gap: sp.B, cursor: 'pointer', marginBottom: isCollapsed ? 0 : sp.C }}
            >
              <span style={{ fontSize: fs.sm, color: isCollapsed ? '#a5acb9' : c['content-brand'], lineHeight: '20px' }}>
                Work done{msg.duration ? ` in ${msg.duration}` : ''}
              </span>
              <span style={{ fontSize: 10, color: isCollapsed ? '#a5acb9' : c['content-brand'] }}>
                {isCollapsed ? '▾' : '▲'}
              </span>
            </div>
          )}

          {/* Steps tree — shown while in-progress OR when expanded after done */}
          {msg.steps && (!allDone || !isCollapsed) && (
            <div style={{ display: 'flex', gap: 10, paddingLeft: 2 }}>

              {/* Left vertical line + terminal indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 8, flexShrink: 0, paddingTop: 5 }}>
                <div style={{ width: 1, flex: 1, backgroundColor: c['border-divider'], minHeight: 8 }} />
                {allDone
                  ? <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: c['content-brand'], flexShrink: 0, marginTop: 2 }} />
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #e0e3e8', borderTopColor: '#2770ef', flexShrink: 0, animation: 'ag-spin 0.7s linear infinite', marginTop: 2 }} />
                }
              </div>

              {/* Step items */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 4 }}>
                {msg.steps.map((step, i) => (
                  <div key={i} style={{ opacity: step.status === 'pending' ? 0.35 : 1, transition: 'opacity 0.3s' }}>

                    {/* Label row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                      <span className={step.status !== 'pending' ? 'ag-gradient-text' : undefined}
                        style={{ fontSize: fs.xs, fontWeight: fw.medium, lineHeight: '18px', color: step.status === 'pending' ? c['content-secondary'] : undefined, whiteSpace: 'nowrap' }}>
                        {step.label}
                      </span>
                      {step.status === 'running' && <Spinner />}
                    </div>

                    {/* Detail paragraph */}
                    {step.detail && step.status !== 'pending' && (
                      <p style={{ margin: '3px 0 0', fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px', whiteSpace: 'pre-line' }}>
                        {step.detail}
                      </p>
                    )}

                    {/* Collapsible SQL */}
                    {step.status === 'done' && step.collapsible && (
                      <div style={{ marginTop: 4 }}>
                        <button onClick={() => onToggleCollapsible(msg.id, i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-brand'], fontFamily: ff.primary, padding: 0 }}>
                          {step.collapsibleOpen ? '▾ Hide SQL' : '▶ View SQL'}
                        </button>
                        {step.collapsibleOpen && (
                          <pre style={{ margin: '4px 0 0', padding: `${sp.B}px ${sp.C}px`, backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`, borderRadius: 6, fontSize: fs.xs, fontFamily: ff.mono, color: c['content-primary'], overflowX: 'auto', whiteSpace: 'pre' }}>
                            {step.collapsible}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Agent response ─────────────────────────────────────────────────────────
  if (msg.type === 'response') {
    return (
      <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
        {showAvatar ? <AgentAvatar /> : <div style={{ width: 24, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <RichText content={msg.content} />
          {msg.suggestions && msg.suggestions.length > 0 && (
            <SuggestionChips suggestions={msg.suggestions} onSelect={onSuggestion} />
          )}
        </div>
      </div>
    );
  }

  // ── Execution (line-by-line confirmation) ──────────────────────────────────
  if (msg.type === 'execution') {
    return (
      <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
        {showAvatar ? <AgentAvatar /> : <div style={{ width: 24, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <RichText content={msg.content} />
          {msg.suggestions && msg.suggestions.length > 0 && (
            <SuggestionChips suggestions={msg.suggestions} onSelect={onSuggestion} />
          )}
        </div>
      </div>
    );
  }

  return null;
};

// ── Avatars ───────────────────────────────────────────────────────────────────

const AgentAvatar: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient id="ag-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2770ef" />
        <stop offset="1" stopColor="#5b9ef4" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="12" fill="url(#ag-grad)" />
    {/* Sparkle */}
    <path d="M12 7.5l.8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8z" fill="white" fillOpacity="0.95" />
    <circle cx="16.5" cy="8" r="1" fill="white" fillOpacity="0.6" />
    <circle cx="8.5" cy="16" r="0.7" fill="white" fillOpacity="0.5" />
  </svg>
);

const AgentAvatarLarge: React.FC = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <defs>
      <linearGradient id="ag-grad-lg" x1="3" y1="3" x2="33" y2="33" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2770ef" />
        <stop offset="1" stopColor="#5b9ef4" />
      </linearGradient>
    </defs>
    <circle cx="18" cy="18" r="18" fill="url(#ag-grad-lg)" />
    <path d="M18 11l1.2 4.05L23.25 16.2l-4.05 1.2L18 21.4l-1.2-4.0L12.75 16.2l4.05-1.2z" fill="white" fillOpacity="0.95" />
    <circle cx="24.5" cy="12" r="1.5" fill="white" fillOpacity="0.6" />
    <circle cx="12.5" cy="24" r="1" fill="white" fillOpacity="0.5" />
  </svg>
);

const UserAvatar: React.FC = () => (
  <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5.5" r="2.2" fill={c['content-secondary']} />
      <path d="M2 12.5c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke={c['content-secondary']} strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  </div>
);

// ── Spinner ───────────────────────────────────────────────────────────────────

const Spinner: React.FC = () => (
  <div style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid #e0e3e8', borderTopColor: '#2770ef', flexShrink: 0, animation: 'ag-spin 0.7s linear infinite' }} />
);

// ── Rich text renderer ────────────────────────────────────────────────────────

const RichText: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let keyIdx = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) { i++; continue; }

    // Horizontal divider
    if (trimmed === '---') {
      nodes.push(<div key={keyIdx++} style={{ height: 1, backgroundColor: c['border-divider'], margin: `${sp.C}px 0` }} />);
      i++; continue;
    }

    // Heading ## or #
    const hMatch = trimmed.match(/^#{1,2} (.+)$/);
    if (hMatch) {
      nodes.push(
        <p key={keyIdx++} style={{ margin: `${sp.D}px 0 ${sp.B}px`, fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '20px' }}>
          {parseInline(hMatch[1])}
        </p>
      );
      i++; continue;
    }

    // ~text~ → dim metadata line
    if (trimmed.startsWith('~') && trimmed.endsWith('~')) {
      nodes.push(
        <p key={keyIdx++} style={{ margin: `0 0 4px`, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }}>
          {trimmed.slice(1, -1)}
        </p>
      );
      i++; continue;
    }

    // Standalone **bold** line → treat as heading
    const boldHeading = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (boldHeading) {
      const topMargin = nodes.length > 0 ? sp.D : 0;
      nodes.push(
        <p key={keyIdx++} style={{ margin: `${topMargin}px 0 2px`, fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '20px' }}>
          {boldHeading[1]}
        </p>
      );
      i++; continue;
    }

    // Numbered list — collect consecutive
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s*/, ''));
        i++;
      }
      nodes.push(
        <ol key={keyIdx++} style={{ paddingLeft: 20, margin: `${sp.B}px 0`, display: 'flex', flexDirection: 'column', gap: sp.B }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>
              {parseInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list (- or • or *)
    if (/^[-•*]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-•*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-•*]\s*/, ''));
        i++;
      }
      nodes.push(
        <ul key={keyIdx++} style={{ paddingLeft: 20, margin: `${sp.B}px 0`, display: 'flex', flexDirection: 'column', gap: sp.B, listStyle: 'disc' }}>
          {items.map((item, j) => (
            <li key={j} style={{ fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Checkbox / step list (☐ ✓ ⚠)
    if (/^[☐✓⚠📊🔗]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[☐✓⚠📊🔗🔸]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim());
        i++;
      }
      nodes.push(
        <div key={keyIdx++} style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: `${sp.B}px 0` }}>
          {items.map((item, j) => (
            <div key={j} style={{ fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>
              {parseInline(item)}
            </div>
          ))}
        </div>
      );
      continue;
    }

    // Plain line
    nodes.push(
      <p key={keyIdx++} style={{ margin: `0 0 ${sp.B}px`, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  return <>{nodes}</>;
};

function parseInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ fontWeight: fw.semibold }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} style={{ backgroundColor: c['background-subtle'], padding: '1px 4px', borderRadius: 3, fontSize: fs.xs, fontFamily: ff.mono, color: c['content-primary'] }}>{part.slice(1, -1)}</code>;
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

export default AgentPanel;
