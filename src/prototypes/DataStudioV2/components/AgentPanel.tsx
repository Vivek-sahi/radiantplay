import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { c, sp, ff, fs, fw, ts } from '../styles';
import { ProjectState, ProjectContext } from '../index';
// agent.ts: skills registry (no API calls — all execution is scripted)
import { tableMetadata, relationships } from '../data/mockData';
import PromptBar, { PromptBarRef } from './PromptBar';
import DataQualityPlanModal from './DataQualityPlanModal';
import { Avatar } from '../../../components/Avatar';
import { TextInput } from '../../../components/TextInput';
import { Button } from '../../../components/Button';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PrepSuggestion {
  id: string;
  tableId: string;
  columnId: string;
  issueType: 'null' | 'duplicate' | 'anomaly' | 'date_format';
  issue: string;
  fix: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  checked: boolean;
  sql: string; // used when writing PrepTransform; not shown in UI
}

export interface AgentMessage {
  id: string;
  type: 'user' | 'working' | 'response' | 'execution';
  content: string;
  steps?: WorkingStep[];
  stepsCollapsed?: boolean;
  duration?: string;
  pendingAction?: PendingAction;
  suggestions?: string[];
  attachment?: { type: string; label: string };
  outcomeCard?: { title: string; chips: string[]; note: string };
  reviewPlanCTA?: boolean;
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

const PREP_SUGGESTIONS: PrepSuggestion[] = [
  {
    id: 'null_campaign_id',
    tableId: 'orders', columnId: 'campaign_id', issueType: 'null', severity: 'high', checked: true,
    issue: '18% null values (27 of 150 rows)',
    fix: "Replace nulls with 'organic'",
    reason: "campaign_id is null for orders with no campaign attribution — these are organic purchases. Labeling them 'organic' preserves them in revenue totals without distorting attribution metrics.",
    sql: "COALESCE(campaign_id, 'organic')",
  },
  {
    id: 'dedup_orders',
    tableId: 'orders', columnId: 'order_id', issueType: 'duplicate', severity: 'high', checked: true,
    issue: '7 duplicate rows',
    fix: 'Keep latest row per order_id',
    reason: "7 order_id values appear more than once — likely from duplicate ingestion events. Keeping only the latest row per order_id ensures revenue totals and order counts aren't inflated.",
    sql: 'ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY created_at DESC) = 1',
  },
  {
    id: 'date_order_date',
    tableId: 'orders', columnId: 'order_date', issueType: 'date_format', severity: 'high', checked: true,
    issue: 'Format is MM/DD/YYYY — mismatches campaigns and users',
    fix: 'Normalize to YYYY-MM-DD',
    reason: "orders.order_date uses MM/DD/YYYY while campaigns and users use different formats. Normalizing to ISO 8601 ensures date joins and time-series grouping work correctly across all three tables.",
    sql: "TO_DATE(order_date, 'MM/DD/YYYY')",
  },
  {
    id: 'date_signup_date',
    tableId: 'users', columnId: 'signup_date', issueType: 'date_format', severity: 'high', checked: true,
    issue: 'Format is YYYY/MM/DD — mismatches orders and campaigns',
    fix: 'Normalize to YYYY-MM-DD',
    reason: "users.signup_date uses YYYY/MM/DD format. Normalizing to ISO 8601 ensures cohort analysis and date comparisons with order_date produce accurate results.",
    sql: "TO_DATE(signup_date, 'YYYY/MM/DD')",
  },
  {
    id: 'null_segment',
    tableId: 'users', columnId: 'segment', issueType: 'null', severity: 'medium', checked: true,
    issue: '15% null values (14 of 90 rows)',
    fix: "Replace nulls with 'unclassified'",
    reason: "segment is null for users who haven't been classified yet. Replacing with 'unclassified' prevents them from being silently dropped in Spotter queries that group by segment.",
    sql: "COALESCE(segment, 'unclassified')",
  },
  {
    id: 'dedup_campaigns',
    tableId: 'campaigns', columnId: 'campaign_id', issueType: 'duplicate', severity: 'medium', checked: true,
    issue: '2 duplicate rows',
    fix: 'Keep latest row per campaign_id',
    reason: "2 campaign_id values appear more than once in the campaigns table. Removing duplicates prevents double-counting in spend and impression aggregations.",
    sql: 'ROW_NUMBER() OVER (PARTITION BY campaign_id ORDER BY created_at DESC) = 1',
  },
  {
    id: 'anomaly_amount',
    tableId: 'orders', columnId: 'amount', issueType: 'anomaly', severity: 'medium', checked: true,
    issue: '4 anomalous values (outside $0–$10,000 range)',
    fix: 'Flag anomalies with is_anomaly column',
    reason: "4 orders have amounts outside the expected 0–$10,000 range — likely test orders or data entry errors. Flagging them gives Spotter the option to exclude outliers rather than silently skew revenue averages.",
    sql: 'amount BETWEEN 0 AND 10000',
  },
  {
    id: 'date_start_date',
    tableId: 'campaigns', columnId: 'start_date', issueType: 'date_format', severity: 'medium', checked: true,
    issue: 'Format is YYYY-MM-DD — explicit cast needed for consistency',
    fix: 'Apply TO_DATE cast for consistent type handling',
    reason: "campaigns.start_date is already in YYYY-MM-DD format, but lacks an explicit TO_DATE cast. Adding one ensures consistent type handling when joining with order_date and signup_date.",
    sql: "TO_DATE(start_date, 'YYYY-MM-DD')",
  },
  {
    id: 'null_end_date',
    tableId: 'campaigns', columnId: 'end_date', issueType: 'null', severity: 'low', checked: true,
    issue: '13% null values (6 of 45 rows) — campaigns still running',
    fix: "Replace nulls with 'ongoing'",
    reason: "end_date is null for campaigns that haven't ended yet. Replacing with 'ongoing' makes the status readable in reports without affecting date arithmetic.",
    sql: "COALESCE(end_date, 'ongoing')",
  },
];

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
  autoComplete?: boolean;   // skip proposal/confirm — execute immediately after working steps
  stepDelay?: number;       // ms per step (default 800; use 5000 for one-shot build)
  followUpProposal?: string; // key of a SCRIPTS entry to show as a second proposal after execution
  columnOverridesUpdate?: Record<string, { aiContext?: string | null; syncStatus?: 'ok' | 'broken' | 'degraded' }>; // written to columnOverrides on confirm
  additionalColumns?: Record<string, string[]>;  // merged into includedColumns (append, not replace)
  outcomeCard?: { title: string; chips: string[]; errorChips?: string[]; note: string }; // rendered after steps collapse
  setsProjectSource?: 'warehouse' | 'dbt'; // written to ProjectState on completion
  reviewPlanCTA?: boolean;  // show "Review plan" button instead of inline confirm
}> = {

  build_project: {
    steps: [
      {
        label: 'Understanding your requirements',
        detail: 'Reading your use case, goals, and sample questions.',
      },
      {
        label: 'Finding tables in Snowflake',
        detail: '120 tables scanned · 3 matches: orders, campaigns, users — cover transactions, attribution, and user demographics.',
        collapsible: `SELECT table_name, row_count, last_modified
FROM information_schema.tables
WHERE table_schema = 'marketing_db'
  AND table_name IN ('orders', 'campaigns', 'users')
-- orders: 150 rows · campaigns: 45 rows · users: 90 rows`,
      },
      {
        label: 'Identifying joins',
        detail: 'orders.campaign_id → campaigns.campaign_id (82% match · LEFT JOIN). orders.user_id → users.user_id (100% match · LEFT JOIN).',
        collapsible: `LEFT JOIN campaigns c
  ON o.campaign_id = c.campaign_id
  -- 82% match · 27 nulls = organic orders, preserved with LEFT JOIN
LEFT JOIN users u
  ON o.user_id = u.user_id
  -- 100% match · INNER JOIN safe`,
      },
      {
        label: 'Selecting columns',
        detail: 'Removed 2 PII fields (name, email) and 3 system fields. 16 columns selected across 3 tables. Join key columns (campaign_id, user_id) appear once under their source table — not repeated in orders.',
        collapsible: `SELECT
  o.order_date, o.amount, o.region,
  c.campaign_id, c.campaign_name, c.channel, c.spend,
  c.budget, c.impressions, c.target_region,
  u.user_id, u.segment, u.lifetime_value, u.signup_date
  -- excluded: users.name, users.email (PII)
  -- excluded: orders.order_id, orders.status, orders.product_category
  -- excluded: o.campaign_id, o.user_id (FK join keys — canonical copy in dimension tables)`,
      },
      {
        label: 'Building the model',
        detail: 'Adding Return on Spend and Conversion Rate metrics from your goals. Model ready.',
        collapsible: `-- Return on Spend
SUM(orders.amount) / NULLIF(SUM(campaigns.spend), 0)
-- handles zero-spend campaigns · output: FLOAT

-- Conversion Rate
COUNT(DISTINCT orders.user_id)
  / NULLIF(COUNT(DISTINCT users.user_id), 0) * 100
-- output: FLOAT (percentage)`,
      },
      {
        label: '✦ Enriching for AI',
        detail: 'Writing AI context and synonyms for 16 columns. Spotter needs this to answer questions well.',
      },
    ],
    stepDelay: 5000,
    duration: '~25 seconds',
    autoComplete: true,
    proposal: '',
    execution: `Done. I connected 3 tables, created 2 joins, and selected 16 columns relevant to campaign performance. I also added Return on Spend and Conversion Rate as calculated metrics based on your goals.\n\nReady to test whenever you are — or make any changes first.`,
    nextStep: 'healthy',
    tablesToAdd: ['orders', 'campaigns', 'users'],
    defaultColumns: {
      orders:    ['order_date', 'amount', 'region'],
      campaigns: ['campaign_id', 'campaign_name', 'channel', 'spend', 'budget', 'impressions', 'target_region'],
      users:     ['user_id', 'segment', 'lifetime_value', 'signup_date'],
    },
    setsColumnsSelected: true,
    newName: 'Campaign Performance',
    executionSuggestions: ['Review data quality', 'Switch to test mode'],
    outcomeCard: {
      title: 'Campaign Performance',
      chips: ['3 tables', '2 joins', '16 columns'],
      note: 'Your model is ready. Start testing or make any changes first.',
    },
    contextUpdate: {
      purpose: 'Understand campaign performance across channels, regions, and user segments.',
      persona: 'Marketing analyst focused on ROAS, budget efficiency, and user segment conversion.',
      sampleQuestions: 'What is our ROAS by campaign and channel?\nWhich user segments convert best?\nHow efficient is our budget across regions?',
    },
    columnOverridesUpdate: {
      order_date:      { aiContext: 'Date the order was placed, normalized to YYYY-MM-DD. Use for time-series and trend analysis.' },
      amount:          { aiContext: 'Order value in USD at time of purchase. Use SUM for total revenue, AVG for average order value.' },
      region:          { aiContext: 'Geographic region where the order was placed. Values: North, South, East, West, APAC.' },
      campaign_id:     { aiContext: 'Unique identifier for each campaign. Join key linking orders to campaigns. Use campaign_name for display.' },
      campaign_name:   { aiContext: 'Human-readable name for this campaign. Use for labeling in charts and comparisons.' },
      channel:         { aiContext: 'Marketing channel used for this campaign. Values: paid_search, social, email, display.' },
      spend:           { aiContext: 'Total amount spent running this campaign in USD. Used as denominator in Return on Spend = revenue / spend.' },
      budget:          { aiContext: 'Total approved spend limit for this campaign in USD. Compare against spend to assess budget utilization.' },
      impressions:     { aiContext: 'Number of times campaign ads were shown. Use as a reach metric; divide by spend for CPM.' },
      target_region:   { aiContext: 'Geographic region this campaign was targeted at. May differ from where orders actually originated.' },
      user_id:         { aiContext: 'Unique identifier for each registered user. Join key linking orders to user profiles.' },
      segment:         { aiContext: 'Customer tier based on company size and annual revenue. Values: Enterprise, Mid-market, SMB. Null = unclassified users — expected, not an error.' },
      lifetime_value:  { aiContext: 'Cumulative revenue from this user since signup. Use SUM for cohort totals, AVG to compare segments.' },
      signup_date:     { aiContext: 'Date the user registered, normalized to YYYY-MM-DD. Use for cohort analysis and churn calculations.' },
      campaign_roas:   { aiContext: 'Return on Ad Spend: total revenue divided by total campaign spend. Higher = more efficient use of budget.' },
      days_to_convert: { aiContext: 'Average days from first campaign impression to first order, per user. Lower = faster conversion.' },
    },
  },

  import_dbt: {
    steps: [
      {
        label: 'Understanding your requirements',
        detail: 'Reading your use case, goals, and sample questions.',
      },
      {
        label: 'Finding relevant datasets',
        detail: '120 tables scanned · also found 1 dbt semantic model: Campaign Performance — 3 tables, 42 objects, 17 pre-written descriptions. Using the dbt model as the base.',
      },
      {
        label: 'Translating to ThoughtSpot',
        detail: '38 objects mapped cleanly. 3 metrics couldn\'t be translated — period filter, window function, and custom macro not supported.',
      },
      {
        label: '✦ Enriching for AI',
        detail: 'Writing AI context for 38 translated columns using dbt descriptions as source.',
      },
      {
        label: 'Flagging issues',
        detail: 'campaign_roas (period filter), days_to_convert (window function), user_segment_fill (custom macro).',
      },
    ],
    stepDelay: 5000,
    duration: '~25 seconds',
    autoComplete: true,
    proposal: '',
    execution: `Found a dbt semantic model that already covers this use case — Campaign Performance with 3 tables and 42 objects. I translated and enriched it for Spotter.\n\n3 metrics couldn't be mapped automatically. Click any flagged column to fix it, or ask me how.`,
    nextStep: 'healthy',
    tablesToAdd: ['orders', 'campaigns', 'users'],
    defaultColumns: {
      orders:    ['order_date', 'amount', 'region'],
      campaigns: ['campaign_id', 'campaign_name', 'channel', 'spend', 'budget', 'impressions', 'target_region', 'campaign_roas', 'days_to_convert'],
      users:     ['user_id', 'segment', 'lifetime_value', 'signup_date', 'user_segment_fill'],
    },
    setsColumnsSelected: true,
    newName: 'Campaign Performance',
    setsProjectSource: 'dbt',
    executionSuggestions: ['Switch to test mode'],
    outcomeCard: {
      title: 'Campaign Performance',
      chips: ['3 tables', '2 joins', '16 columns', 'Synced from dbt'],
      errorChips: ['⚠ 3 issues'],
      note: '38 objects translated. 3 couldn\'t be mapped — review and fix before publishing.',
    },
    contextUpdate: {
      purpose: 'Understand campaign performance across channels, regions, and user segments.',
      persona: 'Marketing analyst focused on ROAS, budget efficiency, and user segment conversion.',
      sampleQuestions: 'What is our ROAS by campaign and channel?\nWhich user segments convert best?\nHow efficient is our budget across regions?',
    },
    columnOverridesUpdate: {
      order_date:       { aiContext: 'Date the order was placed, normalized to YYYY-MM-DD. Use for time-series and trend analysis.' },
      amount:           { aiContext: 'Order value in USD at time of purchase. Use SUM for total revenue, AVG for average order value.' },
      region:           { aiContext: 'Geographic region where the order was placed. Values: North, South, East, West, APAC.' },
      campaign_id:      { aiContext: 'Unique identifier for each campaign. Join key linking orders to campaigns. Use campaign_name for display.' },
      campaign_name:    { aiContext: 'Human-readable name for this campaign. Use for labeling in charts and comparisons.' },
      channel:          { aiContext: 'Marketing channel used for this campaign. Values: paid_search, social, email, display.' },
      spend:            { aiContext: 'Total amount spent running this campaign in USD. Used as denominator in Return on Spend = revenue / spend.' },
      budget:           { aiContext: 'Total approved spend limit for this campaign in USD. Compare against spend to assess budget utilization.' },
      impressions:      { aiContext: 'Number of times campaign ads were shown. Use as a reach metric; divide by spend for CPM.' },
      target_region:    { aiContext: 'Geographic region this campaign was targeted at. May differ from where orders actually originated.' },
      user_id:          { aiContext: 'Unique identifier for each registered user. Join key linking orders to user profiles.' },
      segment:          { aiContext: 'Customer tier based on company size and annual revenue. Values: Enterprise, Mid-market, SMB. Null = unclassified users — expected, not an error.' },
      lifetime_value:   { aiContext: 'Cumulative revenue from this user since signup. Use SUM for cohort totals, AVG to compare segments.' },
      signup_date:      { aiContext: 'Date the user registered, normalized to YYYY-MM-DD. Use for cohort analysis and churn calculations.' },
      campaign_roas:    { aiContext: 'Return on Ad Spend: total revenue divided by total campaign spend. Higher = more efficient use of budget.' },
      days_to_convert:  { aiContext: 'Average days from first campaign impression to first order, per user. Lower = faster conversion.' },
    },
  },

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
    executionSuggestions: ['Profile the data', 'Review data quality', 'Test the model'],
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
    executionSuggestions: ['Review data quality', 'Add column descriptions', 'Test the model'],
  },

  convert_currency: {
    steps: [
      {
        label: 'Understanding request',
        detail: 'Intent: replace currency references in AI context from USD to INR (Indian Rupee).',
      },
      {
        label: 'Scanning AI context for USD references',
        detail: 'Found USD in 3 columns: orders.amount · campaigns.spend · campaigns.budget.',
      },
      {
        label: 'Updating context — USD → INR',
        detail: 'Rewriting currency labels and descriptions in all 3 columns.',
      },
    ],
    autoComplete: true,
    execution: `Done. Updated currency context in 3 columns:\n✓ **amount** — "Order value in INR at time of purchase"\n✓ **spend** — "Total amount spent in INR"\n✓ **budget** — "Total approved spend limit in INR"\n\nSpotter will now interpret and report all monetary values in Indian Rupees.`,
    nextStep: 'healthy',
    preserveStep: true,
    columnOverridesUpdate: {
      amount:  { aiContext: 'Order value in INR at time of purchase. Use SUM for total revenue, AVG for average order value.' },
      spend:   { aiContext: 'Total amount spent running this campaign in INR. Used as denominator in Return on Spend = revenue / spend.' },
      budget:  { aiContext: 'Total approved spend limit for this campaign in INR. Compare against spend to assess budget utilization.' },
    },
  },

  review_data_quality: {
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
        detail: 'orders: 7 duplicate order_ids. campaigns: 2 duplicate campaign_ids. orders.amount: 4 anomalous values.',
      },
      {
        label: 'Checking date formats',
        detail: 'orders.order_date: MM/DD/YYYY. campaigns.start_date: YYYY-MM-DD. users.signup_date: YYYY/MM/DD. 3-way mismatch — date joins may fail.',
      },
      {
        label: 'Building fix plan',
        detail: '9 issues identified across 9 columns in 3 tables — 4 high severity, 4 medium, 1 low.',
      },
    ],
    duration: '38 seconds',
    proposal: `Found **9 issues** across your 3 tables — null values, duplicate rows, anomalies, and date format inconsistencies.\n\nI've generated a fix plan with a recommended transform for each issue.`,
    reviewPlanCTA: true,
    execution: '', // computed dynamically in handleConfirm
    nextStep: 'healthy',
    lineDelay: 400,
    executionSuggestions: ['Switch to test mode'],
    contextUpdate: {
      businessLogic: "Orders with null campaign_id are organic — keep them in revenue totals with LEFT JOIN.\nDuplicate order_ids removed; latest row per order_id is kept.\nDates normalized to YYYY-MM-DD across all tables.",
      spotterInstructions: 'For "top campaigns" sort by return_on_spend descending. "Latest" means last 30 days. "Organic" orders have no campaign attribution.',
    },
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
    executionSuggestions: ['Switch to test mode'],
    contextUpdate: {
      businessLogic: "Orders with null campaign_id are organic — keep them in revenue totals with LEFT JOIN.\nDuplicate order_ids removed; latest row per order_id is kept.\nDates normalized to YYYY-MM-DD across all tables.",
      spotterInstructions: 'For "top campaigns" sort by return_on_spend descending. "Latest" means last 30 days. "Organic" orders have no campaign attribution.',
    },
  },

  // ── Fix broken dbt columns ────────────────────────────────────────────────
  // Triggered by clicking @campaign_roas or @days_to_convert from the columns canvas.

  fix_campaign_roas: {
    steps: [
      { label: 'Reading column definition', detail: 'campaign_roas — formula: SUM(amount) / NULLIF(SUM(spend), 0). Sync status: broken.' },
      { label: 'Identifying the issue', detail: 'The dbt definition references fct_campaigns.total_revenue — this column doesn\'t exist in this model. ThoughtSpot couldn\'t resolve the reference during translation.' },
      { label: 'Finding a fix', detail: 'This model has orders.amount and campaigns.spend. The formula can be rewritten using columns already in the model — same semantics.', collapsible: `SUM(orders.amount) / NULLIF(SUM(campaigns.spend), 0)\n-- resolves fct_campaigns.total_revenue → orders.amount\n-- same ROAS semantics, fully local to this model` },
    ],
    duration: '8 seconds',
    proposal: `The issue: the dbt formula for \`campaign_roas\` references \`fct_campaigns.total_revenue\` — a column that doesn't exist in this model.

The fix rewrites it using columns already in your model — same semantics. Shall I apply this?`,
    execution: `Fixed. \`campaign_roas\` now uses your model's columns.\n\n✓ Formula updated — resolved to orders.amount / campaigns.spend\n✓ Sync status cleared\n\nThe column will resolve correctly in Spotter queries.`,
    nextStep: 'healthy',
    preserveStep: true,
    executionSuggestions: ['Fix days_to_convert too', 'Switch to test mode'],
    columnOverridesUpdate: { campaign_roas: { syncStatus: 'ok' } },
  },

  fix_days_to_convert: {
    steps: [
      { label: 'Reading column definition', detail: 'days_to_convert — measures average days from order date to campaign start date. Sync status: broken.' },
      { label: 'Identifying the issue', detail: 'The dbt formula references orders.purchase_date — that column doesn\'t exist in this model. The orders table uses order_date instead.' },
      { label: 'Finding a fix', detail: 'Straightforward rename — swapping purchase_date for order_date gives the exact same calculation.', collapsible: `-- dbt source:\nAVG(DATEDIFF('day', campaigns.start_date, orders.purchase_date))\n\n-- fixed:\nAVG(DATEDIFF('day', campaigns.start_date, orders.order_date))\n-- purchase_date → order_date (column was renamed in warehouse)` },
    ],
    duration: '8 seconds',
    proposal: `The issue: the dbt formula for \`days_to_convert\` references \`orders.purchase_date\` — but in this model the column is called \`order_date\`. The column was renamed in the warehouse after the dbt model was written.

This is a straightforward fix — same calculation, just the correct column name. Shall I apply this?`,
    execution: `Fixed. \`days_to_convert\` is now using the correct column name.\n\n✓ orders.purchase_date → orders.order_date\n✓ Sync status cleared\n\nNo change to the calculation — results will be accurate.`,
    nextStep: 'healthy',
    preserveStep: true,
    executionSuggestions: ['Switch to test mode'],
    columnOverridesUpdate: { days_to_convert: { syncStatus: 'ok' } },
  },

  // ── Coaching: context issue (Situation 3) ─────────────────────────────────
  // Triggered by Debug button on a Context-type issue in test mode.
  // Two-stage: fix one column → offer to fix all 17 others.

  debug_context: {
    steps: [
      { label: 'Reading issue context — users.segment, context type', detail: 'Issue flagged during testing: no description found. Column: string, 930 rows, 15% null.' },
      { label: 'Inspecting column — sample values and metadata', detail: 'Values: Enterprise, Mid-market, SMB, null. No description. No synonyms. No aggregation rule set.' },
      { label: 'Identifying root cause', detail: 'Without a description, Spotter matched "segment" by column name only. Nulls interpreted as missing data rather than expected unclassified state.' },
      { label: 'Scanning model for similar gaps — 26 columns checked', detail: 'Found 17 additional columns with no descriptions across orders, campaigns, and users.' },
    ],
    duration: '18 seconds',
    proposal: `Here's what I'd write for \`users.segment\`:

**users.segment** → *"Customer tier based on company size and annual revenue. Values: Enterprise, Mid-market, SMB. Null = unclassified users — expected, not an error."*

Shall I apply this?`,
    execution: `Applied description to users.segment.`,
    nextStep: 'healthy',
    preserveStep: true,
    followUpProposal: 'debug_context_bulk',
    columnOverridesUpdate: {
      segment: { aiContext: 'Customer tier based on company size and annual revenue. Values: Enterprise, Mid-market, SMB. Null = unclassified users — expected, not an error.' },
    },
  },

  debug_context_bulk: {
    steps: [],  // shown via followUpProposal mechanism, not runFlow
    duration: '',
    proposal: `Also found **17 other columns** missing descriptions across your model:

**orders** — region, status, product_category, order_date (4 columns)
**campaigns** — channel, spend, budget, impressions, target_region, start_date, end_date (7 columns)
**users** — signup_date, lifetime_value, country, age, email (6 columns)

Write descriptions for all of them? You can review and edit them afterwards.`,
    execution: `Done. Applied descriptions to all 18 columns:\n✓ orders — 4 columns\n✓ campaigns — 7 columns\n✓ users — 7 columns (including users.segment)\n\nSpotter now has full context for every column in your model. Answers that relied on name-matching alone will be more accurate.\n\nYou can keep making fixes here, or switch to test mode to verify.`,
    nextStep: 'healthy',
    preserveStep: true,
    lineDelay: 400,
    executionSuggestions: ['Switch to test mode'],
    columnOverridesUpdate: {
      // orders (4)
      region:           { aiContext: 'Geographic region where the order was placed. Values: North, South, East, West, APAC.' },
      status:           { aiContext: 'Current state of the order. Values: completed, pending, cancelled, refunded.' },
      product_category: { aiContext: 'Product line the ordered item belongs to. Values: Electronics, Apparel, Home, Beauty, Sports.' },
      order_date:       { aiContext: 'Date the order was placed, normalized to YYYY-MM-DD. Use for time-series and trend analysis.' },
      // campaigns (7)
      channel:          { aiContext: 'Marketing channel used for this campaign. Values: paid_search, social, email, display.' },
      spend:            { aiContext: 'Total amount spent running this campaign in USD. Used as denominator in Return on Spend = revenue / spend.' },
      budget:           { aiContext: 'Total approved spend limit for this campaign in USD. Compare against spend to assess budget utilization.' },
      impressions:      { aiContext: 'Number of times campaign ads were shown. Use as a reach metric; divide by spend for CPM.' },
      target_region:    { aiContext: 'Geographic region this campaign was targeted at. May differ from where orders actually originated.' },
      start_date:       { aiContext: 'Date the campaign became active. Use with end_date to calculate campaign duration.' },
      end_date:         { aiContext: 'Campaign end date. NULL means the campaign is still running — expected for ~13% of campaigns.' },
      // users (7, including segment)
      segment:          { aiContext: 'Customer tier based on company size and annual revenue. Values: Enterprise, Mid-market, SMB. Null = unclassified users — expected, not an error.' },
      signup_date:      { aiContext: 'Date the user registered, normalized to YYYY-MM-DD. Use for cohort analysis and churn calculations.' },
      lifetime_value:   { aiContext: 'Cumulative revenue from this user since signup. Use SUM for cohort totals, AVG to compare segments.' },
      country:          { aiContext: 'Country of residence for this user. Use for geographic segmentation.' },
      age:              { aiContext: 'User age in years. Contains anomalies (0, -3, 142, 199) — filter to 13–100 for valid analysis.' },
      email:            { aiContext: 'User email address. PII — excluded from Spotter surface by default. Do not use as a grouping or filter column.' },
    },
  },

  // ── Expand model: add returns table (Situation 4) ────────────────────────
  // Triggered when user mentions @returns or "add returns" on a healthy model.
  // Shows work ladder then proposes join — requires explicit confirm.

  add_returns: {
    steps: [
      { label: 'Looking up returns in warehouse', detail: 'Searching Snowflake · marketing_db for returns table.' },
      { label: 'Analyzing schema', detail: '6 columns found: return_id, order_id, return_date, return_reason, amount, return_status. ~1,240 rows.' },
      { label: 'Finding join path to existing model', detail: 'Checking foreign key candidates across orders, campaigns, users.' },
      { label: 'Found join: returns.order_id → orders.order_id', detail: '1:many · 94% match rate · LEFT JOIN recommended (preserves orders with no return).', collapsible: `LEFT JOIN returns r
  ON o.order_id = r.order_id
  -- 94% match · ~1,140 orders have at least one return
  -- LEFT JOIN preserves orders with no return` },
    ],
    duration: '12 seconds',
    proposal: `I found the **returns** table — 6 columns, ~1,240 rows.

It joins to **orders** on \`order_id\` (1:many). LEFT JOIN keeps all orders, including those with no return.

I also identified **4 relevant columns** to add: \`return_date\`, \`return_reason\`, \`amount\`, and \`return_status\`.

Want me to go ahead — add the table, create the join, and populate the columns?`,
    execution: `Done. Here's what I added:\n✓ Table: returns (~1,240 rows · Snowflake)\n✓ Join: orders × returns (LEFT JOIN on order_id · 1:many)\n✓ Columns: return_date, return_reason, amount, return_status\n\nCampaign Performance now covers 4 tables. Columns and visualizer updated.`,
    nextStep: 'healthy',
    preserveStep: true,
    tablesToAdd: ['returns'],
    additionalColumns: {
      returns: ['return_date', 'return_reason', 'amount', 'return_status'],
    },
    executionSuggestions: ['Switch to test mode'],
  },

  // ── Expand model: add a product category metric (Situation 4) ─────────────
  // Triggered when user asks about product category / product line performance.
  // autoComplete: no confirmation needed — metric is auto-applied.

  expand_model: {
    steps: [
      { label: 'Checking model schema', detail: 'Reading current model — orders, campaigns, users. Checking column inventory against request.' },
      { label: 'Scanning for product_category', detail: 'Found product_category in orders — already included. No new table needed.' },
      { label: 'Drafting metric — Revenue by product category', detail: 'Writing SUM(orders.amount) grouped by orders.product_category. Validating against live schema.' },
    ],
    duration: '12 seconds',
    autoComplete: true,
    proposal: '',
    execution: `Added **Revenue by Product Category** to your model.\n\n\`\`\`sql\nSUM(orders.amount)\nGROUP BY orders.product_category\n\`\`\`\n\nThis lets Spotter answer questions like *"Which product lines drove the most revenue?"* and *"How does category performance vary by channel?"* directly from your model.\n\nReady to test?`,
    nextStep: 'healthy',
    preserveStep: true,
    executionSuggestions: ['Switch to test mode'],
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
  if (lower.match(/review.*quality|review data quality|data quality review/)) return 'review_data_quality';
  if (lower.match(/\b(inr|rupee|indian rupee)\b/)) return 'convert_currency';
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
  buildAbortRef?: React.MutableRefObject<boolean>,
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
      status: (script.autoComplete && i === 0) ? 'running' as const : 'pending' as const,
    })),
    stepsCollapsed: false,
  }]);

  script.steps.forEach((_, idx) => {
    setTimeout(() => {
      if (buildAbortRef?.current) return;

      setMessages(prev => prev.map(m => {
        if (m.id !== workingId || !m.steps) return m;
        const steps = m.steps.map((s, i) =>
          i === idx     ? { ...s, status: 'done' as const } :
          i === idx + 1 ? { ...s, status: 'running' as const } : s
        );
        return { ...m, steps };
      }));

      if (idx === script.steps.length - 1) {
        (async () => {
          await new Promise(r => setTimeout(r, 600));
          if (buildAbortRef?.current) { setIsProcessing(false); return; }

          setMessages(prev => prev.map(m =>
            m.id === workingId
              ? { ...m, stepsCollapsed: true, steps: m.steps?.map(s => ({ ...s, status: 'done' as const })) }
              : m
          ));

          if (script.autoComplete) {
            // One-shot build: apply all state directly, no proposal/confirm step
            setProject(p => ({
              ...p,
              buildStep: script.nextStep,
              name: script.newName && p.name === 'Untitled Project' ? script.newName : p.name,
              ...(script.tablesToAdd ? { addedTables: [...new Set([...p.addedTables, ...script.tablesToAdd])] } : {}),
              ...(script.setsColumnsSelected ? { columnsSelected: true, includedColumns: script.defaultColumns ?? p.includedColumns } : {}),
              ...(script.contextUpdate ? { context: { ...p.context, ...script.contextUpdate } } : {}),
              ...(script.setsProjectSource ? { projectSource: script.setsProjectSource } : {}),
              ...(script.columnOverridesUpdate
                ? {
                    columnOverrides: Object.entries(script.columnOverridesUpdate).reduce(
                      (acc, [colId, patch]) => ({ ...acc, [colId]: { ...(acc[colId] ?? {}), ...patch } }),
                      { ...p.columnOverrides }
                    ),
                  }
                : {}),
            }));
            setMessages(prev => [...prev, {
              id: `r-${Date.now()}`, type: 'response',
              content: script.execution,
              outcomeCard: script.outcomeCard,
              suggestions: script.executionSuggestions,
            }]);
            setIsProcessing(false);
          } else {
            // Normal flow: show proposal, wait for user confirm
            const action: PendingAction = { key, nextStep: script.nextStep };
            setPendingAction(action);
            setMessages(prev => [...prev, {
              id: `r-${Date.now()}`, type: 'response', content: script.proposal ?? '', pendingAction: action,
              ...(script.reviewPlanCTA ? { reviewPlanCTA: true } : {}),
            }]);
            setIsProcessing(false);
            if (script.contextUpdate) {
              setProject(p => ({ ...p, context: { ...p.context, ...script.contextUpdate } }));
            }
          }
        })();
      }
    }, script.autoComplete ? (idx + 1) * (script.stepDelay ?? 5000) : 600 + idx * 800);
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
  const tableDesc = knownTables.map(t => `${t.name}: ${t.columns.length} columns · ${t.rowCount.toLocaleString()} rows`).join(' · ');
  const connName  = knownTables[0]?.connection ?? 'Snowflake';
  const steps: Array<{ label: string; detail?: string; status: 'pending' | 'running' | 'done' }> = [
    { label: `Locating ${knownTables.map(t => t.name).join(', ')} in warehouse`, detail: `Searching ${connName} for matching tables.`, status: 'running' },
    { label: 'Loading schema and row counts', detail: tableDesc + '.', status: 'pending' },
    { label: 'Reading column metadata', detail: 'Importing column types, nullable flags, and descriptions.', status: 'pending' },
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
    setMessages(prev => prev.map(m => m.id !== workingId ? m : {
      ...m, steps: m.steps?.map((s, i) =>
        i === 1 ? { ...s, status: 'done' as const } :
        i === 2 ? { ...s, status: 'running' as const } : s
      ),
    }));
  }, 1300);

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
  }, 2000);
}

// ── Component ─────────────────────────────────────────────────────────────────

// ── Test mode types ───────────────────────────────────────────────────────────

interface SpotterIssue {
  type: 'Context' | 'Data quality' | 'Structure';
  title: string;
  message: string;
  debugMessage: string;
  column?: string;
  ctaLabel?: string;
}

interface TestWorkingStep {
  title: string;
  desc?: string;
  toolCard?: string;
  isTiming?: boolean;
}

interface SpotterChip {
  type: 'measure' | 'attribute' | 'filter';
  label: string;
}

interface SpotterAnswer {
  answerTitle: string;
  answerDesc: string;
  chips: SpotterChip[];
  workingSteps: TestWorkingStep[];
  chartData?: { categories: string[]; values: number[]; formatter: string; yMax: number };
  issues?: SpotterIssue[];
}

interface TestMsg {
  id: number;
  role: 'user' | 'ai';
  content?: string;
  timestamp?: string;
  answerTitle?: string;
  answerDesc?: string;
  chips?: SpotterChip[];
  workingSteps?: TestWorkingStep[];
  workingExpanded?: boolean;
  revealedSteps?: number;
  answerRevealed?: boolean;
  chartData?: SpotterAnswer['chartData'];
  issues?: SpotterIssue[];
  issueExpanded?: boolean;
}

const SPOTTER_ANSWERS: Record<string, SpotterAnswer> = {
  'What is our ROAS by campaign and channel?': {
    answerTitle: 'ROAS by Campaign and Channel',
    answerDesc: "Here's the return on ad spend across your active campaigns, showing how much revenue each campaign generates per dollar spent.",
    chips: [
      { type: 'measure',   label: '# ROAS' },
      { type: 'attribute', label: 'campaign_name' },
      { type: 'filter',    label: "channel != 'organic'" },
      { type: 'filter',    label: "status = 'active'" },
      { type: 'filter',    label: "region = 'US'" },
    ],
    workingSteps: [
      { title: 'Finding ROAS (Return on Ad Spend) data', desc: 'I need to search for ROAS-related information in the model to understand what metrics and columns are available for campaign spend analysis.' },
      { title: 'Retrieving model context' },
      { title: 'Fetching relevant dataset context', toolCard: 'ThoughtSpot: Fetching relevant dataset context' },
      { title: 'Understanding ROAS in this model', desc: 'I found that this model has the building blocks to calculate ROAS. The metric # ROAS is defined as SUM(amount) / SUM(spend), with campaign_name and channel as dimensions. 27 organic orders excluded.' },
      { title: 'Fetching data from dataset', toolCard: 'ThoughtSpot: Answer generation' },
      { title: 'Worked for 8 seconds', isTiming: true },
    ],
    chartData: {
      categories: ['Retargeting', 'Summer Sale', 'Spring Promo', 'Brand Awareness', 'Product Launch'],
      values: [5.6, 3.9, 3.1, 2.3, 2.1],
      formatter: '×',
      yMax: 7,
    },
  },
  'Which user segments convert best?': {
    answerTitle: 'Segment Conversion Rate',
    answerDesc: 'Enterprise users convert at 42%, nearly double the SMB rate. Note: 140 users with no segment were excluded from this analysis.',
    chips: [
      { type: 'measure',   label: '# Conversion Rate' },
      { type: 'attribute', label: 'segment' },
      { type: 'filter',    label: 'segment != null' },
    ],
    workingSteps: [
      { title: 'Finding segment conversion data', desc: 'I need to search for user segment and conversion-related information in the model to understand how segment is defined and what conversion metrics are available.' },
      { title: 'Retrieving model context' },
      { title: 'Fetching relevant dataset context', toolCard: 'ThoughtSpot: Fetching relevant dataset context' },
      { title: 'Understanding segment conversion in this model', desc: 'I found the model has the necessary columns, but with quality gaps. users.segment has no description; meaning approximated from values (Enterprise, Mid-market, SMB). 140 of 930 users have null segment and will be excluded.' },
      { title: 'Fetching data from dataset', toolCard: 'ThoughtSpot: Answer generation' },
      { title: 'Worked for 11 seconds', isTiming: true },
    ],
    chartData: {
      categories: ['Enterprise', 'Mid-market', 'SMB'],
      values: [42, 34, 26],
      formatter: '%',
      yMax: 55,
    },
    issues: [
      {
        type: 'Context',
        title: 'AI context missing',
        message: "Spotter couldn't find AI context or description on `users.segment`, so it approximated the column meaning from values. This may affect the accuracy of this answer.",
        debugMessage: 'I found a context issue during testing: `users.segment` has no description, so Spotter approximated its meaning from column values. Scan the entire model for columns missing descriptions and fix them all.',
        column: 'users.segment',
        ctaLabel: 'Update AI context',
      },
    ],
  },
};

const DEMO_QUESTIONS = [
  'What is our ROAS by campaign and channel?',
  'Which user segments convert best?',
  'How efficient is our budget across regions?',
];

// ── Test mode sub-components ──────────────────────────────────────────────────

const SpotterIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <circle cx="13" cy="13" r="11" stroke="#1D232F" strokeWidth="1.8"/>
    <circle cx="13" cy="13" r="5.5" stroke="#1D232F" strokeWidth="1.8"/>
    <circle cx="13" cy="13" r="2" fill="#1D232F"/>
  </svg>
);

const SpotterIconSm = () => (
  <svg width="16" height="16" viewBox="0 0 26 26" fill="none">
    <circle cx="13" cy="13" r="11" stroke="#777E8B" strokeWidth="1.8"/>
    <circle cx="13" cy="13" r="5.5" stroke="#777E8B" strokeWidth="1.8"/>
    <circle cx="13" cy="13" r="2" fill="#777E8B"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="10" height="10" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1.5 3H16.5L10.5 10.065V14.5L7.5 16V10.065L1.5 3Z" stroke="#4A7FE5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TChevronIcon: React.FC<{ open: boolean }> = ({ open }) => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'none' }}>
    <path d="M1.5 3.5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TableViewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="1" y1="5" x2="13" y2="5" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="5" y1="5" x2="5" y2="13" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

const ChartViewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1" y="8" width="3" height="5" rx="0.5" fill="currentColor"/>
    <rect x="5.5" y="5" width="3" height="8" rx="0.5" fill="currentColor"/>
    <rect x="10" y="2" width="3" height="11" rx="0.5" fill="currentColor"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
    <path d="M9 2.25V11.25M9 11.25L5.25 7.5M9 11.25L12.75 7.5M3 15.75H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TSpinner: React.FC = () => (
  <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #e0e3e8', borderTopColor: '#2770ef', flexShrink: 0, animation: 'ds-spin 0.7s linear infinite' }} />
);

const TTypewriter: React.FC<{ text: string; active: boolean }> = ({ text, active }) => {
  const [displayed, setDisplayed] = React.useState(active ? '' : text);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  React.useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!active) { setDisplayed(text); return; }
    let i = 0;
    setDisplayed('');
    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }, 14);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return <>{displayed}</>;
};

const IssueInspectorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 18 18" fill="none">
    <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="12" x2="15.5" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="5.5" x2="8" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="8" cy="10.5" r="0.85" fill="currentColor"/>
  </svg>
);

const ISSUE_TYPE_COLORS: Record<SpotterIssue['type'], { badge: string; text: string }> = {
  'Context':      { badge: '#EFF6FF', text: '#1D4ED8' },
  'Data quality': { badge: '#FFF7ED', text: '#C2410C' },
  'Structure':    { badge: '#F0FDF4', text: '#15803D' },
};

const IssueInspector: React.FC<{
  issues: SpotterIssue[];
  expanded: boolean;
  onToggle: () => void;
  onFix: (issue: SpotterIssue) => void;
}> = ({ issues, expanded, onToggle, onFix }) => {
  if (issues.length === 0) {
    return (
      <div style={{ marginTop: 16, border: '1px solid #D1FAE5', borderRadius: 8, backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
        <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7" stroke="#16A34A" strokeWidth="1.5"/>
          <path d="M6 9l2 2 4-4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 12.5, fontWeight: fw.medium, color: '#15803D' }}>No issues found with this answer</span>
      </div>
    );
  }
  return (
    <div style={{ marginTop: 16, border: '1px solid #FDE68A', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFFBEB' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        <span style={{ color: '#B45309', display: 'flex', flexShrink: 0 }}><IssueInspectorIcon /></span>
        <span style={{ fontSize: 12.5, fontWeight: fw.semibold, color: '#92400E', flex: 1 }}>
          Issue Inspector · {issues.length} {issues.length === 1 ? 'issue' : 'issues'} found
        </span>
        <TChevronIcon open={expanded} />
      </button>
      {expanded && (
        <div style={{ borderTop: '1px solid #FDE68A' }}>
          {issues.map((issue, idx) => (
            <div key={idx} style={{ padding: '12px 14px', borderTop: idx > 0 ? '1px solid #FDE68A' : 'none', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: fw.semibold, padding: '2px 7px', borderRadius: 4, backgroundColor: ISSUE_TYPE_COLORS[issue.type].badge, color: ISSUE_TYPE_COLORS[issue.type].text }}>
                  {issue.type}
                </span>
                <span style={{ fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'] }}>{issue.title}</span>
              </div>
              <p style={{ fontSize: 12.5, color: c['content-secondary'], lineHeight: 1.6, margin: '0 0 12px' }}>{issue.message}</p>
              <button
                onClick={() => onFix(issue)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: c['content-brand'], color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12.5, fontWeight: fw.semibold, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {issue.ctaLabel ?? 'Fix this'} →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TFormattedMsg: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => p.startsWith('**') ? <strong key={i}>{p.slice(2,-2)}</strong> : <span key={i}>{p}</span>)}</>;
};

// ── AgentPanel props ──────────────────────────────────────────────────────────

interface AgentPanelProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  messages: AgentMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>;
  initialPrompt?: string;
  onBuildComplete?: () => void;
  externalMessage?: string | null;
  onExternalMessageHandled?: () => void;
  externalMessageAttachment?: { type: string; label: string } | null;
  injectInput?: string | null;
  onInjectInputHandled?: () => void;
  width?: number;
  onClose?: () => void;
  selectedColumns?: string[];
  onColumnRemove?: (name: string) => void;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ project, setProject, messages, setMessages, initialPrompt, onBuildComplete, externalMessage, onExternalMessageHandled, externalMessageAttachment, injectInput, onInjectInputHandled, width = 340, onClose, selectedColumns, onColumnRemove }) => {
  const [pendingAction, setPending]     = useState<PendingAction | null>(null);
  const [isProcessing, setProcessing]   = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [prepSuggestions, setPrepSuggestions] = useState<PrepSuggestion[]>(() =>
    PREP_SUGGESTIONS.map(s => ({ ...s }))
  );
  const messagesEndRef           = useRef<HTMLDivElement>(null);
  const promptBarRef             = useRef<PromptBarRef>(null);
  const buildCalledRef           = useRef(false);
  const initialPromptFiredRef    = useRef(false);
  const buildAbortRef            = useRef(false);
  const lastHandledExternalRef   = useRef<string | null>(null);
  const prevMsgLengthRef         = useRef(messages.length);

  // Test tab state
  const [testInput, setTestInput]       = useState('');
  const [testMessages, setTestMessages] = useState<TestMsg[]>([]);
  const testEndRef                      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  // Only scroll when a new message is added — NOT on step status updates within existing messages
  useEffect(() => {
    if (messages.length > prevMsgLengthRef.current) {
      prevMsgLengthRef.current = messages.length;
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!initialPrompt || initialPromptFiredRef.current) return;
    initialPromptFiredRef.current = true;
    processText(initialPrompt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Guard against React StrictMode double-invocation and stale externalMessage
    if (!externalMessage || lastHandledExternalRef.current === externalMessage) return;
    lastHandledExternalRef.current = externalMessage;
    onExternalMessageHandled?.();
    processText(externalMessage, undefined, externalMessageAttachment ?? undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMessage]);

  useEffect(() => {
    if (!injectInput) return;
    promptBarRef.current?.setValue(injectInput);
    setTimeout(() => promptBarRef.current?.focus(), 50);
    onInjectInputHandled?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectInput]);

  useEffect(() => {
    promptBarRef.current?.setColumns(selectedColumns ?? []);
  }, [selectedColumns]);

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

  // Greeting for expand flow — fires once on mount when opening a healthy project with no prompt
  useEffect(() => {
    if (initialPrompt || buildCalledRef.current) return;
    if (project.buildStep === 'healthy') {
      buildCalledRef.current = true;
      setMessages([{
        id: `r-${Date.now()}`,
        type: 'response',
        content: 'What would you like to do today?',
        suggestions: ['Add a table', 'Create a formula', 'Add AI context'],
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (captured.key === 'review_data_quality') {
        const activeItems = prepSuggestions.filter(s => s.checked);
        const n = activeItems.length;
        return `Applied **${n} transform${n !== 1 ? 's' : ''}** to your model:\n${activeItems.map(s => `✓ ${s.columnId} — ${s.fix}`).join('\n')}\n\nYou can view and edit these in the Transformations panel on the left, or hover over any affected cell in the column view. Switch to test mode to see how Spotter answers questions with the cleaner data.`;
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
          ...(script.columnOverridesUpdate
            ? {
                columnOverrides: Object.entries(script.columnOverridesUpdate).reduce(
                  (acc, [colId, patch]) => ({ ...acc, [colId]: { ...(acc[colId] ?? {}), ...patch } }),
                  { ...p.columnOverrides }
                ),
              }
            : {}),
          ...(script.additionalColumns
            ? {
                includedColumns: Object.entries(script.additionalColumns).reduce(
                  (acc, [tableId, cols]) => ({
                    ...acc,
                    [tableId]: [...new Set([...(acc[tableId] ?? []), ...cols])],
                  }),
                  { ...p.includedColumns }
                ),
              }
            : {}),
          ...(captured.key === 'review_data_quality' ? {
            prepTransforms: prepSuggestions.filter(s => s.checked).map(s => ({
              id: s.id,
              columnId: s.columnId,
              tableId: s.tableId,
              issueType: s.issueType,
              label: `${s.columnId} — ${s.fix}`,
              sql: s.sql,
            })),
          } : {}),
        }));
        if (script.executionSuggestions) {
          setMessages(prev => prev.map(m =>
            m.id === execId ? { ...m, suggestions: script.executionSuggestions } : m
          ));
        }
        if (script.followUpProposal && SCRIPTS[script.followUpProposal]) {
          const followUpKey = script.followUpProposal;
          const followUpScript = SCRIPTS[followUpKey];
          const followUpAction: PendingAction = { key: followUpKey, nextStep: followUpScript.nextStep };
          setTimeout(() => {
            setPending(followUpAction);
            setMessages(prev => [...prev, {
              id: `r-${Date.now()}`, type: 'response',
              content: followUpScript.proposal,
              pendingAction: followUpAction,
            }]);
          }, 500);
        }
        setProcessing(false);
        return;
      }
      const ci = i;
      setMessages(prev => prev.map(m =>
        m.id === execId ? { ...m, content: (m.content ?? '') + (ci === 0 ? '' : '\n') + lines[ci] } : m
      ));
      i++;
    }, script.lineDelay ?? 280);
  };

  // ── Stub responses for workflows not yet scripted ─────────────────────────

  const STUBS: Record<string, string> = {
    select_columns: `Column selection lets you choose which fields from each table to include in your project. This workflow is coming soon — all columns are included for now.`,
    test_model:     `Test mode lets you ask questions against your model and review the AI's reasoning. Switch to the **Test** tab in this panel to get started.`,
    coach:          `Coaching lets you fix a gap found during testing — the agent proposes a fix and writes it to memory. This workflow is coming soon.`,
    publish:        `Publishing is done from the header — click the **Publish** button in the top right when your model is ready.`,
    share:          `Use the **Share** button in the top-right header to invite people or groups and set their access level (Can view or Can edit).`,
  };

  // ── Core processing ──────────────────────────────────────────────────────────

  const processText = async (text: string, mentionedTables?: string[], attachment?: { type: string; label: string }) => {
    // Abort a running build when user types during the one-shot flow
    if (isProcessing && project.buildStep === 'empty') {
      buildAbortRef.current = true;
      setProcessing(false);
      setMessages(prev => [...prev,
        { id: `u-${Date.now()}`, type: 'user', content: text },
        { id: `r-${Date.now()}`, type: 'response', content: "Got it, I've stopped. What would you like to change? Tell me and I'll rebuild." },
      ]);
      return;
    }
    if (!text || isProcessing) return;
    setProcessing(true);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: text, attachment }]);

    // 0. Test mode switch — chip or any "switch to test mode" phrasing
    if (/switch to test mode|enter test mode|go to test mode/i.test(text)) {
      setProject(p => ({ ...p, testMode: true }));
      setProcessing(false);
      return;
    }

    // 0b. Debug from test mode — route to coaching script
    if (/found a context issue during testing/i.test(text)) {
      runFlow('debug_context', setMessages, setPending, setProcessing, setProject, text);
      return;
    }

    // 0c. Situation 4 — @returns or "add returns" on a healthy model → expand join flow
    if (
      project.buildStep === 'healthy' &&
      !project.addedTables.includes('returns') &&
      (
        (mentionedTables && mentionedTables.includes('returns')) ||
        /\breturns?\b/i.test(text)
      )
    ) {
      runFlow('add_returns', setMessages, setPending, setProcessing, setProject, text);
      return;
    }

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
          runFlow(inferredKey, setMessages, setPending, setProcessing, setProject, text);
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
      runFlow('find_tables', setMessages, setPending, setProcessing, setProject, text);
      return;
    }

    // 2d. Metric / formula intent shortcut — skip Claude when the user clearly wants calculated columns.
    // This fires even when no specific metric is named (e.g. "add calculated columns", "create metrics").
    // executeCreateMetric will determine appropriate metrics from project context.
    const METRIC_TRIGGER = /\b(add|create|build|make|generate)\b.{0,35}\b(calculated?\s+(?:col(?:umns?)?|field[s]?)|formula[es]?|metric[s]?|kpi[s]?|measure[s]?)\b/i;
    if (METRIC_TRIGGER.test(text)) {
      const metricAvailable = project.buildStep === 'joined' || project.buildStep === 'transformed' || project.buildStep === 'healthy';
      if (metricAvailable) {
        runFlow('create_metric', setMessages, setPending, setProcessing, setProject, text);
        return;
      }
    }

    // 2f. Expand model — product category / product line performance
    if (project.buildStep === 'healthy' && /product.{0,20}(categor|line[s]?|breakdown|performance)/i.test(text)) {
      runFlow('expand_model', setMessages, setPending, setProcessing, setProject, text);
      return;
    }

    // 2g. Broken column fix routing — catches @campaign_roas / @days_to_convert from canvas selection
    if (/@campaign_roas\b/i.test(text) && project.buildStep === 'healthy') {
      runFlow('fix_campaign_roas', setMessages, setPending, setProcessing, setProject, text);
      return;
    }
    if (/@days_to_convert\b/i.test(text) && project.buildStep === 'healthy') {
      runFlow('fix_days_to_convert', setMessages, setPending, setProcessing, setProject, text);
      return;
    }

    // 3. Scripted routing
    if (project.buildStep === 'empty') {
      buildAbortRef.current = false;
      const zeroShotScript = project.projectSource === 'dbt' ? 'import_dbt' : 'build_project';
      runFlow(zeroShotScript, setMessages, setPending, setProcessing, setProject, text, buildAbortRef);
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

  // ── Test tab helpers ─────────────────────────────────────────────────────────

  const sendTest = (questionOverride?: string) => {
    const text = (questionOverride ?? testInput).trim();
    if (!text) return;
    setTestInput('');
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const msgId = Date.now();
    setTestMessages(prev => [...prev, { id: msgId - 1, role: 'user', content: text, timestamp }]);
    const answer = SPOTTER_ANSWERS[text];
    const steps = answer?.workingSteps ?? [
      { title: 'Resolved question intent' },
      { title: 'Mapped columns across model' },
      { title: 'Applied joins and computed result' },
    ];
    setTimeout(() => {
      setTestMessages(prev => [...prev, {
        id: msgId, role: 'ai',
        answerTitle: answer?.answerTitle, answerDesc: answer?.answerDesc, chips: answer?.chips,
        workingSteps: steps, workingExpanded: true, revealedSteps: 0, answerRevealed: false,
        chartData: answer?.chartData, issues: answer?.issues, issueExpanded: false,
        content: answer ? undefined : `Based on your Campaign Performance model, I found relevant results for this question.\n\nThe analysis draws from your orders, campaigns, and users data. Try one of the sample questions for a scripted demo answer.`,
      }]);
      const STEP_INTERVAL = 600;
      steps.forEach((_, s) => {
        setTimeout(() => {
          setTestMessages(prev => prev.map(m => m.id === msgId ? { ...m, revealedSteps: s + 1 } : m));
        }, (s + 1) * STEP_INTERVAL);
      });
      setTimeout(() => {
        setTestMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, answerRevealed: true, issueExpanded: !!(answer?.issues?.some(iss => iss.type === 'Context')) } : m
        ));
      }, steps.length * STEP_INTERVAL + 500);
    }, 600);
  };

  const toggleTestWorking = (i: number) =>
    setTestMessages(prev => prev.map((m, idx) => idx === i ? { ...m, workingExpanded: !m.workingExpanded } : m));

  const toggleTestIssue = (i: number) =>
    setTestMessages(prev => prev.map((m, idx) => idx === i ? { ...m, issueExpanded: !m.issueExpanded } : m));

  const testChipStyle = (type: SpotterChip['type']): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 9px 3px 7px', borderRadius: 4,
    fontSize: 12, fontWeight: fw.medium, whiteSpace: 'nowrap',
    cursor: 'default', userSelect: 'none', lineHeight: 1.5,
    backgroundColor: '#EAEDF2', color: '#1D232F',
  });

  const buildChartOption = (chartData: NonNullable<TestMsg['chartData']>) => {
    const font = "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif";
    return {
      grid: { top: 28, bottom: 32, left: 12, right: 12, containLabel: true },
      tooltip: {
        trigger: 'axis' as const,
        formatter: (params: { name: string; value: number }[]) => `${params[0].name}: <b>${params[0].value}${chartData.formatter}</b>`,
        backgroundColor: '#fff', borderColor: '#E5E7EB', borderWidth: 1,
        textStyle: { color: '#1D232F', fontSize: 12, fontFamily: font }, padding: [8, 12],
      },
      xAxis: {
        type: 'category' as const, data: chartData.categories,
        axisLabel: { fontSize: 11, color: '#777E8B', fontFamily: font, interval: 0 },
        axisLine: { lineStyle: { color: '#EAEDF2' } }, axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const, min: 0, max: chartData.yMax,
        axisLabel: { fontSize: 11, color: '#777E8B', fontFamily: font, formatter: `{value}${chartData.formatter}` },
        axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#EAEDF2' } },
      },
      series: [{
        type: 'bar' as const, data: chartData.values,
        itemStyle: { color: '#1AA251', borderRadius: [3, 3, 0, 0] }, barMaxWidth: 64,
        label: { show: true, position: 'top' as const, formatter: `{c}${chartData.formatter}`, fontSize: 11, color: '#1D232F', fontFamily: font, fontWeight: 500 },
      }],
    };
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ width, flexShrink: 0, borderLeft: 'none', backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column' }}>
      {/* Panel header — Build/Test tabs + collapse */}
      <div style={{ height: 40, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', paddingLeft: sp.D, flexShrink: 0 }}>
        {/* Tabs */}
        {(['build', 'test'] as const).map(tab => {
          const active = tab === 'build' ? !project.testMode : project.testMode;
          return (
            <button
              key={tab}
              onClick={() => setProject(p => ({ ...p, testMode: tab === 'test' }))}
              style={{
                height: 40, padding: '0 12px', border: 'none',
                borderBottom: `2px solid ${active ? c['content-brand'] : 'transparent'}`,
                background: 'transparent', cursor: 'pointer',
                fontSize: fs.xs, fontWeight: active ? fw.semibold : fw.medium, fontFamily: ff.primary,
                color: active ? c['content-brand'] : c['content-secondary'],
                marginBottom: -1,
              }}
            >
              {tab === 'build' ? 'Build' : 'Test'}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        {onClose && (
          <button
            onClick={onClose}
            title="Collapse"
            style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: c['content-secondary'], padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,4 13,8 9,12"/>
              <line x1="3" y1="8" x2="13" y2="8"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Build tab ─────────────────────────────────────────────────────────── */}
      {!project.testMode && (<>
      <style>{`
        @keyframes ag-spin { to { transform: rotate(360deg); } }
        @keyframes ag-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(39,112,239,0.4); } 50% { box-shadow: 0 0 0 5px rgba(39,112,239,0); } }
        @keyframes ag-step-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .ag-gradient-text {
          background: linear-gradient(to right, #2770ef 4%, #777e8b);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; display: inline-block;
        }
      `}</style>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.C}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.D }}>

        {messages.length === 0 && !initialPrompt && (
          <div style={{ textAlign: 'center', padding: `${sp.H}px ${sp.D}px` }}>
            <AgentAvatarLarge />
            <p style={{ fontSize: fs.sm, color: c['content-secondary'], margin: `${sp.C}px 0 ${sp.F}px`, lineHeight: '20px' }}>
              Describe what you want to build. I'll find the right data and set everything up.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
              {['Analyze campaign performance by channel and region', 'Measure campaign ROI across channels and segments', 'Track P&L by department using finance data'].map(hint => (
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
          const isActivePending = msg.pendingAction != null && msg.pendingAction.key === pendingAction?.key;
          return (
            <div key={msg.id} style={{ marginTop: isAfterWorking ? -sp.B : 0 }}>
              <MessageBubble
                msg={msg}
                showAvatar={!isAfterWorking}
                onToggleSteps={id => setMessages(prev => prev.map(m => m.id === id ? { ...m, stepsCollapsed: !m.stepsCollapsed } : m))}
                onToggleCollapsible={toggleCollapsible}
                onSuggestion={text => processText(text)}
                onConfirm={isActivePending ? handleConfirm : undefined}
                onOpenPlanModal={() => setPlanModalOpen(true)}
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
          disabled={isProcessing && project.buildStep !== 'empty'}
          isProcessing={isProcessing}
          onStop={() => {
            buildAbortRef.current = true;
            setProcessing(false);
            setMessages(prev => [...prev, { id: `r-${Date.now()}`, type: 'response', content: "Stopped. What would you like to change?" }]);
          }}
          placeholder="Give me a task. Use '@' to mention tables."
          autoFocus
          dropDirection="up"
          compact
          onColumnRemove={onColumnRemove}
        />
      </div>

      {/* Disclaimer */}
      <p style={{ textAlign: 'center', fontSize: 11, color: c['content-secondary'], padding: `${sp.A}px ${sp.D}px ${sp.B}px`, margin: 0, lineHeight: '16px' }}>
        Agent responses should be reviewed. <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Learn more</span>
      </p>
      </>)}

      {/* ── Test tab ──────────────────────────────────────────────────────────── */}
      {project.testMode && (
        project.buildStep === 'empty' ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', maxWidth: 280, padding: sp.H }}>
              <h2 style={{ ...ts.sectionLabel, color: c['content-primary'], margin: `0 0 ${sp.C}px` }}>No model ready yet</h2>
              <p style={{ fontSize: fs.sm, color: c['content-secondary'], margin: `0 0 ${sp.F}px` }}>
                Build your model first, then come back to test it.
              </p>
              <Button variant="secondary" onClick={() => setProject(p => ({ ...p, testMode: false }))}>Back to build</Button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: c['background-base'], overflow: 'hidden' }}>

            {/* Test messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.C}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.D }}>
              {testMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: `${sp.H}px ${sp.D}px` }}>
                  <AgentAvatarLarge />
                  <p style={{ fontSize: fs.sm, color: c['content-secondary'], margin: `${sp.C}px 0 ${sp.F}px`, lineHeight: '20px' }}>
                    Ask questions the way your business users will.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                    {DEMO_QUESTIONS.map(q => (
                      <button key={q} onClick={() => sendTest(q)}
                        style={{ padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 8, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary, textAlign: 'left' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >{q}</button>
                    ))}
                  </div>
                </div>
              )}

              {testMessages.map((msg, i) => {
                if (msg.role === 'user') {
                  return (
                    <div key={i} style={{ backgroundColor: c['background-sunken'], borderRadius: 12, padding: `${sp.C}px ${sp.D}px` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.B }}>
                        <UserAvatar />
                      </div>
                      <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>{msg.content}</p>
                    </div>
                  );
                }

                // AI response
                const totalSteps = msg.workingSteps?.length ?? 0;
                const revealed = msg.revealedSteps ?? totalSteps;
                const isAnimating = msg.revealedSteps !== undefined && (revealed < totalSteps || !msg.answerRevealed);
                const visibleSteps = msg.workingSteps?.slice(0, revealed) ?? [];

                return (
                  <div key={i}>
                    {/* Working block — same as Build's working message */}
                    {visibleSteps.length > 0 && (
                      <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
                        <AgentAvatar working={isAnimating} />
                        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                          {!isAnimating && (
                            <button onClick={() => toggleTestWorking(i)} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: ff.primary, marginBottom: msg.workingExpanded ? sp.C : 0 }}>
                              <span style={{ fontSize: fs.sm, color: c['content-brand'] }}>
                                {msg.workingExpanded ? '▼' : '▶'} Show work
                              </span>
                            </button>
                          )}
                          {(isAnimating || msg.workingExpanded) && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              {visibleSteps.map((step, si) => {
                                const stepRunning = isAnimating && si === visibleSteps.length - 1;
                                const stepDone = !stepRunning;
                                return (
                                  <div key={si} style={{ display: 'flex', gap: 10, animation: 'ag-step-in 0.22s ease' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
                                      <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 3 }}>
                                        {stepRunning ? <Spinner /> : <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E' }} />}
                                      </div>
                                      {si < visibleSteps.length - 1 && (
                                        <div style={{ flex: 1, width: 2, minHeight: 12, marginTop: 2, backgroundColor: stepDone ? '#22C55E' : c['border-divider'], transition: 'background-color 0.4s ease', borderRadius: 1 }} />
                                      )}
                                    </div>
                                    <div style={{ flex: 1, paddingBottom: si < visibleSteps.length - 1 ? sp.C : 0 }}>
                                      <span className={stepRunning ? 'ag-gradient-text' : undefined} style={{ fontSize: fs.sm, fontWeight: stepRunning ? fw.medium : fw.regular, lineHeight: '20px', color: stepRunning ? undefined : c['content-secondary'] }}>
                                        {step.title}
                                      </span>
                                      {step.desc && (
                                        <p style={{ margin: '2px 0 0', fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }}>
                                          <TTypewriter text={step.desc} active={stepRunning} />
                                        </p>
                                      )}
                                      {step.toolCard && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${c['border-divider']}`, borderRadius: 8, padding: '8px 12px', marginTop: 6, backgroundColor: c['background-subtle'] }}>
                                          <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>⊞</span>
                                          <span style={{ flex: 1, fontSize: fs.xs, color: c['content-primary'] }}>{step.toolCard}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Answer — same layout as Build's response block */}
                    {msg.answerRevealed !== false && (
                      <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start', marginTop: visibleSteps.length > 0 ? -sp.B : 0 }}>
                        <div style={{ width: 24, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                          {msg.answerTitle && (
                            <p style={{ margin: `0 0 ${sp.A}px`, fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '20px', animation: 'ag-step-in 0.3s ease-out' }}>{msg.answerTitle}</p>
                          )}
                          {msg.answerDesc && (
                            <p style={{ margin: `0 0 ${sp.C}px`, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>{msg.answerDesc}</p>
                          )}
                          {msg.content && (
                            <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px', animation: 'ag-step-in 0.3s ease-out' }}>
                              <TFormattedMsg content={msg.content} />
                            </p>
                          )}

                          {/* Answer card */}
                          {(msg.chips || msg.chartData) && (
                            <div style={{ marginTop: sp.C, border: `1px solid ${c['border-divider']}`, borderRadius: 10, overflow: 'hidden', backgroundColor: c['background-base'], animation: 'ag-step-in 0.35s ease-out' }}>
                              <div style={{ padding: `${sp.C}px ${sp.C}px 0` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: sp.B }}>
                                      {msg.chips?.map((chip, ci) => (
                                        <span key={ci} style={testChipStyle(chip.type)}>
                                          {chip.type === 'measure' && <span style={{ fontSize: 10, color: '#4A7FE5', fontWeight: fw.bold }}>#</span>}
                                          {chip.type === 'filter' && <FilterIcon />}
                                          {chip.label}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', border: `1px solid ${c['border-divider']}`, borderRadius: 6, overflow: 'hidden', flexShrink: 0, alignSelf: 'flex-start' }}>
                                    <button style={{ background: 'none', border: 'none', padding: '5px 8px', cursor: 'pointer', color: c['content-secondary'], display: 'flex' }} title="Table view"><TableViewIcon /></button>
                                    <button style={{ background: '#EFF6FF', border: 'none', borderLeft: `1px solid ${c['border-divider']}`, padding: '5px 8px', cursor: 'pointer', color: '#2563EB', display: 'flex' }} title="Chart view"><ChartViewIcon /></button>
                                  </div>
                                </div>
                              </div>
                              {msg.chartData && (
                                <ReactECharts option={buildChartOption(msg.chartData)} style={{ height: 200, width: '100%' }} opts={{ renderer: 'svg' }} />
                              )}
                            </div>
                          )}

                          {/* Action bar */}
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
                            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 5, fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], fontFamily: 'inherit' }}
                              onMouseEnter={e => { e.currentTarget.style.background = c['background-subtle']; e.currentTarget.style.color = c['content-primary']; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = c['content-secondary']; }}
                            >
                              <DownloadIcon /> Download
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={testEndRef} />
            </div>

            {/* Test prompt bar — matches Build's PromptBar visually */}
            <div style={{ padding: `${sp.B}px ${sp.C}px ${sp.C}px`, borderTop: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
              <style>{`.test-textarea::placeholder { color: #B0B8C4; }`}</style>
              <div style={{ backgroundColor: c['background-base'], borderRadius: 12, border: `1px solid ${c['border-default']}`, boxShadow: '0px 0px 4px rgba(25,35,49,0.06), 0px 2px 4px rgba(25,35,49,0.04)' }}>
                <textarea
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTest(); } }}
                  placeholder="Ask a question about your data"
                  rows={2}
                  className="test-textarea"
                  style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', padding: `${sp.C}px ${sp.C}px ${sp.A}px`, fontSize: fs.sm, color: c['content-primary'], fontFamily: ff.primary, lineHeight: '1.6', backgroundColor: 'transparent', boxSizing: 'border-box', borderRadius: '12px 12px 0 0' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: `${sp.A}px ${sp.B}px` }}>
                  <button
                    onClick={() => sendTest()}
                    disabled={!testInput.trim()}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', backgroundColor: testInput.trim() ? '#2770ef' : c['border-default'], color: testInput.trim() ? '#fff' : c['content-secondary'], cursor: testInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'background-color 0.15s', flexShrink: 0, fontFamily: ff.primary }}
                  >↑</button>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Data quality plan modal */}
      <DataQualityPlanModal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        suggestions={prepSuggestions}
        onToggle={id => setPrepSuggestions(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s))}
        onFixChange={(id, value) => setPrepSuggestions(prev => prev.map(s => s.id === id ? { ...s, fix: value } : s))}
        onApply={() => {
          setPlanModalOpen(false);
          handleConfirm();
        }}
      />
    </div>
  );
};

// ── Message bubble ────────────────────────────────────────────────────────────

// ── Outcome card ──────────────────────────────────────────────────────────────

const OutcomeCard: React.FC<{ card: { title: string; chips: string[]; errorChips?: string[]; note: string } }> = ({ card }) => (
  <div style={{
    padding: `${sp.C}px ${sp.D}px`,
    border: `1px solid ${c['border-divider']}`,
    borderRadius: 8,
    backgroundColor: c['background-base'],
  }}>
    <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B, lineHeight: '20px' }}>
      {card.title}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.A, marginBottom: sp.B }}>
      {card.chips.map(chip => (
        <span key={chip} style={{
          fontSize: fs.xs,
          padding: '2px 8px',
          borderRadius: 10,
          backgroundColor: c['background-sunken'],
          color: c['content-secondary'],
          lineHeight: '18px',
        }}>
          {chip}
        </span>
      ))}
      {card.errorChips?.map(chip => (
        <span key={chip} style={{
          fontSize: fs.xs,
          padding: '2px 8px',
          borderRadius: 10,
          backgroundColor: c['background-failure'],
          color: c['content-failure'],
          lineHeight: '18px',
        }}>
          {chip}
        </span>
      ))}
    </div>
    <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }}>
      {card.note}
    </p>
  </div>
);

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
  onConfirm?: () => void;
  onOpenPlanModal?: () => void;
}> = ({ msg, showAvatar, onToggleSteps, onToggleCollapsible, onSuggestion, onConfirm, onOpenPlanModal }) => {

  // ── User bubble ────────────────────────────────────────────────────────────
  if (msg.type === 'user') {
    return (
      <div style={{ backgroundColor: c['background-sunken'], borderRadius: 12, padding: `${sp.C}px ${sp.D}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.B }}>
          <UserAvatar />
        </div>
        {msg.attachment && (
          <div style={{ marginBottom: sp.B }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: sp.A, fontSize: fs.xs, fontWeight: fw.medium, padding: '2px 8px', borderRadius: 4, border: `1px solid ${c['border-default']}`, backgroundColor: c['background-base'], color: c['content-secondary'] }}>
              ⚠ {msg.attachment.type} · {msg.attachment.label}
            </span>
          </div>
        )}
        <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px', fontWeight: fw.regular }}>
          {msg.content}
        </p>
      </div>
    );
  }

  // ── Working / thinking block ───────────────────────────────────────────────
  if (msg.type === 'working') {
    const allDone    = msg.steps?.every(s => s.status === 'done') ?? false;
    const isRunning  = msg.steps?.some(s => s.status === 'running') ?? false;
    const isCollapsed = msg.stepsCollapsed ?? false;
    const stepCount  = msg.steps?.length ?? 0;

    return (
      <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
        <AgentAvatar working={isRunning} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>

          {/* Show work toggle — only when all steps are done */}
          {allDone && (
            <button
              onClick={() => onToggleSteps(msg.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: ff.primary, marginBottom: isCollapsed ? 0 : sp.C }}
            >
              <span style={{ fontSize: fs.sm, color: c['content-brand'] }}>
                {isCollapsed ? '▶' : '▼'} Show work
              </span>
            </button>
          )}

          {/* Steps — shown while in-progress OR when expanded after done */}
          {msg.steps && (!allDone || !isCollapsed) && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {msg.steps.filter(s => s.status !== 'pending').map((step, i, visible) => (
                <div key={i} style={{ display: 'flex', gap: 10, animation: 'ag-step-in 0.22s ease' }}>

                  {/* Left: dot + connecting line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, flexShrink: 0 }}>
                    {/* Dot */}
                    <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 3 }}>
                      {step.status === 'done'
                        ? <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22C55E' }} />
                        : <Spinner />
                      }
                    </div>
                    {/* Connecting line to next visible step */}
                    {i < visible.length - 1 && (
                      <div style={{
                        flex: 1, width: 2, minHeight: 12, marginTop: 2,
                        backgroundColor: step.status === 'done' ? '#22C55E' : c['border-divider'],
                        transition: 'background-color 0.4s ease',
                        borderRadius: 1,
                      }} />
                    )}
                  </div>

                  {/* Right: step content */}
                  <div style={{
                    flex: 1,
                    paddingBottom: i < visible.length - 1 ? sp.C : 0,
                  }}>
                    {/* Label row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                      <span
                        className={step.status === 'running' ? 'ag-gradient-text' : undefined}
                        style={{
                          fontSize: fs.sm,
                          fontWeight: step.status === 'done' ? fw.regular : fw.medium,
                          lineHeight: '20px',
                          color: step.status === 'running' ? undefined : c['content-secondary'],
                        }}
                      >
                        {step.label}
                      </span>
                    </div>

                    {/* Detail — typewriter effect while running, full text when done */}
                    {step.detail && step.status !== 'pending' && (
                      <p style={{ margin: '2px 0 0', fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px', whiteSpace: 'pre-line' }}>
                        <TypewriterText text={step.detail} active={step.status === 'running'} />
                      </p>
                    )}

                    {/* SQL on demand (C-iii) */}
                    {step.status === 'done' && step.collapsible && (
                      <div style={{ marginTop: 4 }}>
                        <button onClick={() => onToggleCollapsible(msg.id, i)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-brand'], fontFamily: ff.primary, padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
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
                </div>
              ))}
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
          {msg.content && <RichText content={msg.content} />}
          {msg.reviewPlanCTA && onConfirm && (
            <div style={{ marginTop: sp.C }}>
              <button
                onClick={onOpenPlanModal}
                style={{
                  padding: `6px 14px`,
                  backgroundColor: c['content-brand'],
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: fs.xs,
                  fontWeight: fw.semibold,
                  cursor: 'pointer',
                  fontFamily: ff.primary,
                  lineHeight: '18px',
                }}
              >
                Review plan
              </button>
            </div>
          )}
          {msg.outcomeCard && (
            <div style={{ marginTop: msg.content ? sp.C : 0 }}>
              <OutcomeCard card={msg.outcomeCard} />
            </div>
          )}
          {msg.pendingAction && onConfirm && !msg.reviewPlanCTA && (
            <div style={{ marginTop: sp.C }}>
              <button
                onClick={onConfirm}
                style={{ padding: `6px 14px`, backgroundColor: c['content-brand'], color: '#fff', border: 'none', borderRadius: 6, fontSize: fs.xs, fontWeight: fw.semibold, cursor: 'pointer', fontFamily: ff.primary, lineHeight: '18px' }}
              >
                Apply this
              </button>
            </div>
          )}
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

const AgentAvatar: React.FC<{ working?: boolean }> = ({ working }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    style={{ flexShrink: 0, borderRadius: '50%', animation: working ? 'ag-pulse 1.4s ease-in-out infinite' : 'none' }}>
    <defs>
      <linearGradient id="ag-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2770ef" />
        <stop offset="1" stopColor="#5b9ef4" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="12" fill="url(#ag-grad)" />
    {/* Sparkle — rotates while working */}
    <g style={{ transformOrigin: '12px 12px', animation: working ? 'ag-spin 2.2s linear infinite' : 'none' }}>
      <path d="M12 7.5l.8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8z" fill="white" fillOpacity="0.95" />
    </g>
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

// ── Typewriter text ───────────────────────────────────────────────────────────

const TypewriterText: React.FC<{ text: string; active: boolean }> = ({ text, active }) => {
  const [displayed, setDisplayed] = React.useState(active ? '' : text);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!active) {
      setDisplayed(text);
      return;
    }
    let i = 0;
    setDisplayed('');
    timerRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 14);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return <>{displayed}</>;
};

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
