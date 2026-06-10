import React, { useState, useRef, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { c, sp, ff, fs, fw } from '../styles';
import { shadows } from '@/tokens/shadows';
import { ProjectState, ProjectContext } from '../index';
// agent.ts: skills registry (no API calls — all execution is scripted)
import { tableMetadata, relationships, CACHE_STATS, CONNECTIONS } from '../data/mockData';
import PromptBar, { PromptBarRef } from './PromptBar';
import ConnectionPill from './ConnectionPill';
import DataQualityPlanModal from './DataQualityPlanModal';
import { Icon } from '../../../components/icons';
import PlanPanelV3 from './PlanPanelV3';

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

// ── Plan mode types ───────────────────────────────────────────────────────────

export interface PlanTable {
  schema: string;
  name: string;
  description: string;
  rowCount?: string;
  connection?: string;
  connectionType?: 'snowflake' | 'dbt' | 'bigquery' | 'redshift' | 'spotstore' | 'csv';
  confidence?: number;
  reasoning?: string;
}

export interface PlanRelationship {
  fromTable: string;
  toTable: string;
  fromKey: string;
  toKey: string;
  joinType: string;
  matchRate: string;
  cardinality?: string;
  confidence?: number;
  reasoning?: string;
}

export interface PlanColumn {
  table: string;
  name: string;
  type: 'metric' | 'dimension' | 'formula';
  description: string;
  formula?: string;
  included: boolean;
  confidence?: number;
  reasoning?: string;
}

export interface PlanData {
  version: number;
  modelName: string;
  goal: string;
  tables: PlanTable[];
  relationships: PlanRelationship[];
  columns: PlanColumn[];
  sampleQuestions: string[];
  planSteps?: { title: string; detail: string }[];
  confirmItems?: string[];
}

export interface AgentMessage {
  id: string;
  type: 'user' | 'working' | 'response' | 'execution' | 'spotter-user' | 'spotter-answer' | 'coaching-prompt' | 'coaching-result';
  content: string;
  steps?: WorkingStep[];
  stepsCollapsed?: boolean;
  allStepsVisible?: boolean;
  duration?: string;
  pendingAction?: PendingAction;
  suggestions?: string[];
  attachment?: { type: string; label: string };
  outcomeCard?: { title: string; chips: string[]; errorChips?: string[]; note: string };
  modelArtifact?: { name: string; tableCount: number; columnCount: number; metricCount: number };
  reviewPlanCTA?: boolean;
  interactiveChips?: { label: string; value: string }[];
  planData?: PlanData;
  planBuildFlow?: 'from_scratch' | 'multi_source';
  buildPlanCard?: boolean;
  genUI?: string;
  genUIResult?: string;
  inlineInput?: {
    type: 'api-key' | 'file-upload';
    label: string;
    placeholder?: string;
    submitted?: boolean;
    savedCredentials?: boolean;
  };
  artifactCards?: Array<{
    type: 'table' | 'spotstore-table' | 'notebook' | 'csv-dataset' | 'staging-table';
    name: string;
    subLabel?: string;
  }>;
  // spotter-answer fields
  answerTitle?: string;
  answerDesc?: string;
  spotterChips?: SpotterChip[];
  workingSteps?: TestWorkingStep[];
  workingExpanded?: boolean;
  revealedSteps?: number;
  answerRevealed?: boolean;
  chartData?: SpotterAnswer['chartData'];
  feedbackState?: 'pending' | 'answered';
  feedbackAnswer?: 'correct' | 'incorrect';
  sourceQuestion?: string;
  // coaching-prompt fields
  coachingOptions?: string[];
  selectedOption?: string;
  // coaching-result fields
  debugCategory?: string;
  debugSteps?: Array<{ label: string; detail: string }>;
  debugRevealedSteps?: number;
  debugResultRevealed?: boolean;
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
  label?: string;                              // button label override; defaults to "Apply this"
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

// ── Mock plan data ────────────────────────────────────────────────────────────

const MOCK_PLAN_BASE: Omit<PlanData, 'version'> = {
  modelName: 'Campaign Performance',
  goal: 'Understand campaign ROI and ad spend efficiency across channels, regions, and user segments — enabling full-funnel analysis from impression to first conversion.',
  tables: [
    { schema: 'marketing_db', name: 'orders', description: 'Transactional records for every order placed, including amount, region, and attribution to a campaign and user.', rowCount: '150 rows' },
    { schema: 'marketing_db', name: 'campaigns', description: 'Campaign metadata — channel, spend, budget, impressions, and target region for each campaign run.', rowCount: '45 rows' },
    { schema: 'marketing_db', name: 'users', description: 'Registered user profiles with segment classification, lifetime value, and signup date.', rowCount: '90 rows' },
  ],
  relationships: [
    { fromTable: 'orders', toTable: 'campaigns', fromKey: 'campaign_id', toKey: 'campaign_id', joinType: 'LEFT JOIN', matchRate: '82% match · 27 nulls = organic orders, preserved' },
    { fromTable: 'orders', toTable: 'users', fromKey: 'user_id', toKey: 'user_id', joinType: 'LEFT JOIN', matchRate: '100% match' },
  ],
  columns: [
    { table: 'orders', name: 'order_date', type: 'dimension', description: 'Date the order was placed, normalised to YYYY-MM-DD. Use for time-series and trend analysis.', included: true },
    { table: 'orders', name: 'amount', type: 'metric', description: 'Order value in USD at time of purchase. Use SUM for total revenue, AVG for average order value.', included: true },
    { table: 'orders', name: 'region', type: 'dimension', description: 'Geographic region where the order was placed. Values: North, South, East, West, APAC.', included: true },
    { table: 'campaigns', name: 'campaign_id', type: 'dimension', description: 'Unique campaign identifier. Join key — use campaign_name for display in charts.', included: true },
    { table: 'campaigns', name: 'campaign_name', type: 'dimension', description: 'Human-readable name for this campaign. Use for labelling in charts and comparisons.', included: true },
    { table: 'campaigns', name: 'channel', type: 'dimension', description: 'Marketing channel used for this campaign. Values: paid_search, social, email, display.', included: true },
    { table: 'campaigns', name: 'spend', type: 'metric', description: 'Total amount spent running this campaign in USD. Denominator in ROAS = revenue ÷ spend.', included: true },
    { table: 'campaigns', name: 'budget', type: 'metric', description: 'Total approved spend limit for this campaign in USD. Compare against spend for budget utilisation.', included: true },
    { table: 'campaigns', name: 'impressions', type: 'metric', description: 'Number of times campaign ads were shown. Divide by spend for CPM reach metric.', included: true },
    { table: 'campaigns', name: 'target_region', type: 'dimension', description: 'Geographic region this campaign was targeted at. May differ from where orders actually originated.', included: true },
    { table: 'users', name: 'user_id', type: 'dimension', description: 'Unique identifier for each registered user. Join key linking orders to user profiles.', included: true },
    { table: 'users', name: 'segment', type: 'dimension', description: 'Customer tier based on company size and revenue. Values: Enterprise, Mid-market, SMB. Null = unclassified.', included: true },
    { table: 'users', name: 'lifetime_value', type: 'metric', description: 'Cumulative revenue from this user since signup. Use AVG to compare segments, SUM for cohort totals.', included: true },
    { table: 'users', name: 'signup_date', type: 'dimension', description: 'Date the user registered, normalised to YYYY-MM-DD. Use for cohort analysis and churn calculations.', included: true },
    { table: 'Formulas', name: 'campaign_roas', type: 'formula', description: 'Return on Ad Spend. Higher = more efficient use of budget.', formula: 'SUM(orders.amount) / NULLIF(SUM(campaigns.spend), 0)', included: true },
    { table: 'Formulas', name: 'conversion_rate', type: 'formula', description: 'Percentage of exposed users who placed an order after campaign exposure.', formula: 'COUNT(DISTINCT orders.user_id) / NULLIF(COUNT(DISTINCT users.user_id), 0) * 100', included: true },
  ],
  sampleQuestions: [
    'What is the ROAS by campaign and channel last month?',
    'Which user segments convert best for paid search campaigns?',
    'How does ad spend compare to budget across regions?',
    'What is the average order value for social vs email campaigns?',
    'Which campaigns have the highest conversion rate this quarter?',
    'How has campaign performance trended over the last 6 months?',
  ],
};

const MS_PLAN_DATA: PlanData = {
  version: 1,
  modelName: 'Customer Health Scorecard',
  goal: 'Track customer health across NPS, support volume, call engagement, and engineering escalations to surface at-risk accounts before renewal.',
  tables: [
    { schema: 'SNOWFLAKE', name: 'dim_accounts', description: 'Master account records — the driving table. All other sources join to account_id.', rowCount: '12,000 rows', connection: 'Snowflake CDW', connectionType: 'snowflake', confidence: 97, reasoning: 'Primary driving table — all joins fan out from here' },
    { schema: 'SNOWFLAKE', name: 'support_cases', description: 'Support case history including priority, status, and resolution time.', rowCount: '84,312 rows', connection: 'Snowflake CDW', connectionType: 'snowflake', confidence: 91, reasoning: 'P1 open case count contributes 20% to health score' },
    { schema: 'SNOWFLAKE', name: 'call_metrics', description: 'Per-account call sentiment and engagement signals.', rowCount: '31,089 rows', connection: 'Snowflake CDW', connectionType: 'snowflake', confidence: 88, reasoning: 'Avg sentiment contributes 25% to health score' },
    { schema: 'SNOWFLAKE', name: 'customer_found_defects', description: 'Engineering defects reported by customers.', rowCount: '6,218 rows', connection: 'Snowflake CDW', connectionType: 'snowflake', confidence: 85, reasoning: 'Open defect count contributes 25% to health score' },
    { schema: 'SPOTSTORE', name: 'customer_health_external', description: 'Pendo NPS + CSM mapping from staging. 24% account coverage — NPS components will be null for remaining accounts.', rowCount: '2,847 rows', connection: 'Spotstore', connectionType: 'spotstore', confidence: 93, reasoning: 'NPS score contributes 30% to health; partial coverage is expected' },
  ],
  relationships: [
    { fromTable: 'dim_accounts', toTable: 'customer_health_external', fromKey: 'account_id', toKey: 'account_id', joinType: 'LEFT JOIN', matchRate: '24% (2,847 of 12,000)', cardinality: 'One-to-one', confidence: 93, reasoning: 'Federated — Spotstore staging; NPS null for unmatched accounts is expected' },
    { fromTable: 'dim_accounts', toTable: 'support_cases', fromKey: 'account_id', toKey: 'account_id', joinType: 'LEFT JOIN', matchRate: '~100%', cardinality: 'One-to-many', confidence: 96 },
    { fromTable: 'dim_accounts', toTable: 'call_metrics', fromKey: 'account_id', toKey: 'account_id', joinType: 'LEFT JOIN', matchRate: '~100%', cardinality: 'One-to-many', confidence: 94 },
    { fromTable: 'dim_accounts', toTable: 'customer_found_defects', fromKey: 'account_id', toKey: 'account_id', joinType: 'LEFT JOIN', matchRate: '~100%', cardinality: 'One-to-many', confidence: 91 },
  ],
  columns: [
    { table: 'dim_accounts', name: 'account_id', type: 'dimension', description: 'Unique account identifier (join key).', included: true, confidence: 99 },
    { table: 'dim_accounts', name: 'account_name', type: 'dimension', description: 'Account display name.', included: true, confidence: 97 },
    { table: 'dim_accounts', name: 'industry', type: 'dimension', description: 'Industry vertical.', included: true, confidence: 88 },
    { table: 'dim_accounts', name: 'arr', type: 'metric', description: 'Annual recurring revenue in USD.', included: true, confidence: 95 },
    { table: 'dim_accounts', name: 'region', type: 'dimension', description: 'Geographic region.', included: true, confidence: 90 },
    { table: 'dim_accounts', name: 'account_tier', type: 'dimension', description: 'CSM mapping version used — shadows the CDW field of the same name.', included: true, confidence: 87, reasoning: 'Two sources have account_tier — CSM CSV version preferred per DE decision' },
    { table: 'dim_accounts', name: 'renewal_date', type: 'dimension', description: 'Next renewal date.', included: true, confidence: 92 },
    { table: 'support_cases', name: 'priority', type: 'dimension', description: 'Case priority level (P1–P4).', included: true, confidence: 94 },
    { table: 'support_cases', name: 'status', type: 'dimension', description: 'Case resolution status.', included: true, confidence: 94 },
    { table: 'support_cases', name: 'case_category', type: 'dimension', description: 'Issue category.', included: true, confidence: 89 },
    { table: 'support_cases', name: 'resolution_time_hours', type: 'metric', description: '14% null — not used in health score formula. Kept for ad-hoc analysis.', included: true, confidence: 72, reasoning: 'High null rate flagged; health formula uses P1 case count, not resolution time' },
    { table: 'call_metrics', name: 'avg_sentiment_score', type: 'metric', description: 'Average call sentiment score per account (0–1). Contributes 25% to health score.', included: true, confidence: 91 },
    { table: 'call_metrics', name: 'next_steps_mentioned', type: 'metric', description: 'Whether next steps were discussed on the call.', included: true, confidence: 85 },
    { table: 'call_metrics', name: 'deal_risk_flag', type: 'dimension', description: 'Agent-flagged deal risk indicator.', included: true, confidence: 88 },
    { table: 'customer_found_defects', name: 'severity', type: 'dimension', description: 'Defect severity level.', included: true, confidence: 90 },
    { table: 'customer_found_defects', name: 'resolution_days', type: 'metric', description: 'Days to resolve defect.', included: true, confidence: 87 },
    { table: 'customer_health_external', name: 'nps_score', type: 'metric', description: 'NPS score (0–10). Contributes 30% to health score.', included: true, confidence: 93 },
    { table: 'customer_health_external', name: 'csm_name', type: 'dimension', description: 'Customer success manager name.', included: true, confidence: 95 },
    { table: 'customer_health_external', name: 'exec_sponsor', type: 'dimension', description: 'Executive sponsor name.', included: true, confidence: 90 },
    { table: 'dim_accounts', name: 'customer_health_score', type: 'formula', description: 'Composite score: NPS 30% + support 20% + call sentiment 25% + defects 25%.', formula: '(CASE WHEN nps_score >= 9 THEN 1.0 WHEN nps_score >= 7 THEN 0.6 ELSE 0.2 END * 0.30)\n+ (CASE WHEN p1_cases_open = 0 THEN 1.0 WHEN p1_cases_open <= 2 THEN 0.5 ELSE 0.0 END * 0.20)\n+ (COALESCE(avg_sentiment_score, 0.5) * 0.25)\n+ (CASE WHEN open_defects = 0 THEN 1.0 WHEN open_defects <= 3 THEN 0.6 ELSE 0.2 END * 0.25)', included: true, confidence: 88 },
  ],
  sampleQuestions: [
    'Which accounts have the lowest health scores this quarter?',
    'What is the NPS trend for our Enterprise accounts?',
    'Which CSMs have the most P1 cases open?',
    'Show me accounts at risk of churning in the next 90 days.',
    'How does call sentiment correlate with renewal outcomes?',
  ],
  planSteps: [
    { title: 'Map joins', detail: 'Connect 5 sources via account_id — 4 LEFT JOINs driven from DIM_ACCOUNTS.' },
    { title: 'Select columns', detail: '18 columns across 5 tables; remove 4 system fields and 2 raw text columns.' },
    { title: 'Build health score formula', detail: 'Composite: NPS (30%) + support volume (20%) + call sentiment (25%) + defect rate (25%).' },
    { title: '✦ Enrich for AI', detail: 'Write AI context and synonyms for 18 columns so Spotter can answer health questions.' },
    { title: 'Validate build', detail: 'Verify join key coverage, row counts across all 5 sources, and DQ scores.' },
  ],
  confirmItems: [
    'NPS data covers 24% of accounts — nulls are expected for the remaining 9,153 accounts.',
    'resolution_time_hours is 14% null in SUPPORT_CASES — health score uses P1 case count, not resolution time.',
    'account_tier appears in both DIM_ACCOUNTS and the CSM CSV — the CSM mapping version is used.',
  ],
};

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
  columnOverridesUpdate?: Record<string, { aiContext?: string | null; syncStatus?: 'ok' | 'broken' | 'degraded'; synonyms?: string[] }>; // written to columnOverrides on confirm
  additionalColumns?: Record<string, string[]>;  // merged into includedColumns (append, not replace)
  outcomeCard?: { title: string; chips: string[]; errorChips?: string[]; note: string }; // rendered after steps collapse
  setsProjectSource?: 'warehouse' | 'dbt'; // written to ProjectState on completion
  reviewPlanCTA?: boolean;  // show "Review plan" button instead of inline confirm
  executionGenUI?: string;  // genUI card to attach to the auto-complete response message
}> = {

  scratch_generate_plan: {
    steps: [
      { label: 'Reviewing your requirements', detail: 'Reading your goals and use case from the clarifying questions.' },
      { label: 'Reading warehouse schemas', detail: 'Found 3 matching tables: orders, campaigns, users — covering transactions, attribution, and user profiles.' },
      { label: 'Drafting your model plan', detail: 'Identified 2 joins, 14 base columns, 2 derived formulas, and 6 sample questions.' },
    ],
    stepDelay: 1200,
    duration: '~4 seconds',
    autoComplete: true,
    preserveStep: true,
    proposal: '',
    execution: '',
    nextStep: 'empty',
  },

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
      errorChips: ['⚠ 9 quality issues'],
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

Would you like me to add these to your model?`,
    execution: `Added **3 tables** to your model:
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
    execution: `Profile saved to model:
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
    duration: '',
    proposal: '',
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

  // ── Semantic Gaps — Phase 1: detect ──────────────────────────────────────
  semantic_gaps_detect: {
    steps: [
      { label: 'Scanning Marketing Campaign Attribution model', detail: 'Reading column metadata and Spotter query logs from the past 30 days.' },
      { label: 'Detecting semantic gaps', detail: '4 columns missing descriptions: campaign_id, target_region, channel, spend.' },
      { label: 'Analyzing Spotter failures', detail: 'Reviewing 31 failed queries this week — all caused by missing column context.' },
      { label: '✦ Impact mapped — 4 gaps causing 31 failures/week', detail: 'Without descriptions, Spotter can\'t understand what these columns mean or when to use them.' },
    ],
    duration: '8 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'I found 4 columns in Marketing Campaign Attribution that are missing descriptions. These gaps are causing Spotter to fail 31 queries per week.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'semantic_gaps',
  },

  // ── Semantic Gaps — Phase 2: generate descriptions ────────────────────────
  semantic_gaps_generate: {
    steps: [
      { label: 'Analyzing column usage patterns', detail: 'Reviewing how campaign_id, target_region, channel, and spend are used in queries and joins.' },
      { label: 'Reviewing sample values and join relationships', detail: 'Inspecting data to understand semantic meaning and business context.' },
      { label: 'Generating context-aware descriptions', detail: 'Creating descriptions based on usage patterns, sample data, and industry best practices.' },
      { label: '✦ Descriptions ready — review and apply', detail: 'All 4 descriptions generated with high confidence.' },
    ],
    duration: '6 seconds',
    autoComplete: true,
    stepDelay: 700,
    proposal: '',
    execution: 'I\'ve generated descriptions for all 4 columns based on their usage patterns and sample data. Review them below and edit if needed:',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'semantic_fill_recommendations',
  },

  // ── Semantic Gaps — Phase 3: apply descriptions ───────────────────────────
  semantic_gaps_apply: {
    steps: [
      { label: 'Adding descriptions to 4 columns', detail: 'Writing campaign_id, target_region, channel, and spend descriptions to model metadata.' },
      { label: 'Refreshing model metadata', detail: 'Updating Marketing Campaign Attribution model in the semantic layer.' },
      { label: 'Updating Spotter context', detail: 'Propagating new descriptions to Spotter\'s context engine.' },
      { label: '✦ Descriptions applied and Spotter updated', detail: 'All 31 failed queries per week should now succeed.' },
    ],
    duration: '5 seconds',
    autoComplete: true,
    stepDelay: 700,
    proposal: '',
    execution: 'All 4 column descriptions have been added. Spotter now has the context it needs to answer questions about campaigns, regions, channels, and spend.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'semantic_gaps_resolved',
  },

  // ── Cache Miss — Phase 1: detect opportunity ──────────────────────────────
  cache_miss_detect: {
    steps: [
      { label: 'Scanning Sales Performance query logs', detail: 'Analyzing query patterns from the past 7 days.' },
      { label: 'Detecting cache miss hot spot', detail: '"Win rate by region" run 34× this week with 0% cache hit rate.' },
      { label: 'Analyzing query pattern and users', detail: '5 users running this query regularly — Sarah Chen (12×), Marcus Rodriguez (8×), and 3 others.' },
      { label: '✦ Cache opportunity identified — ~374s wasted this week', detail: 'Enabling caching would save ~11 seconds per query.' },
    ],
    duration: '6 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'I found a high-frequency query that\'s never cached. "Win rate by region" has been run 34 times this week, wasting ~374 seconds of total execution time.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'cache_miss_opportunity',
  },

  // ── Cache Miss — Phase 2: configure cache settings ───────────────────────
  cache_miss_configure: {
    steps: [
      { label: 'Analyzing query dimensions and filters', detail: 'Identifying cacheable query patterns based on region and time_period dimensions.' },
      { label: 'Calculating optimal refresh schedule', detail: 'Data freshness requirement: 6 hours based on source table update frequency.' },
      { label: 'Estimating cache hit rate', detail: '~85% expected hit rate based on query pattern similarity.' },
      { label: '✦ Cache configuration ready', detail: 'Recommended: 6-hour refresh, 24-hour TTL.' },
    ],
    duration: '5 seconds',
    autoComplete: true,
    stepDelay: 700,
    proposal: '',
    execution: 'I\'ve configured optimal cache settings based on your query patterns and data freshness requirements. Review and enable:',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'cache_configuration',
  },

  // ── Cache Miss — Phase 3: enable cache ───────────────────────────────────
  cache_miss_enable: {
    steps: [
      { label: 'Creating cache policy for "Win rate by region"', detail: 'Setting up 6-hour refresh schedule with 24-hour TTL.' },
      { label: 'Scheduling first data pull', detail: 'Initial cache population starting now — will complete in ~12 seconds.' },
      { label: 'Updating query routing', detail: 'Configuring Spotter to check cache before hitting warehouse.' },
      { label: '✦ Caching enabled successfully', detail: 'First cache refresh in progress.' },
    ],
    duration: '8 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'Cache enabled for "Win rate by region". The first data pull is in progress and will be available in a few seconds.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'cache_enabled',
  },

  // ── Schema drift repair (single model) ────────────────────────────────────
  schema_drift_repair: {
    steps: [
      { label: 'Reading sync error log', detail: 'dbt_finance_spend sync failed at Apr 20 02:14 AM. Error: columns cost_center, allocation_type not found in source schema.' },
      { label: 'Comparing model schema to source', detail: 'Model expects 12 columns from dbt_finance_spend. Source now returns 10 — 2 columns missing.' },
      { label: 'Checking downstream impact', detail: '4 answers, 3 liveboards and 2 formulas reference cost_center or allocation_type. All currently broken.' },
      { label: '✦ Preparing resolution options', detail: 'Found replacement candidates in source: cost_bucket (string), cost_category (string). Preparing column resolution card.' },
    ],
    duration: '14 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: `Here's what changed in the source:\n\n**dbt_finance_spend** removed 2 columns — \`cost_center\` and \`allocation_type\`. They no longer exist in the upstream dbt model.\n\nDecide how to handle them:`,
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'drift_resolution',
  },

  schema_drift_preview: {
    steps: [
      { label: 'Applying column remapping', detail: 'cost_center → cost_bucket, allocation_type → cost_category.' },
      { label: 'Rewriting 2 formulas', detail: 'channel_cost_ratio and cost_per_campaign both reference cost_center. Substituting → cost_bucket in both.' },
      { label: '✦ Changeset ready — awaiting your approval to publish', detail: '' },
    ],
    duration: '8 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'Here\'s the full changeset for **FnOps Cost Model v2**. Review and publish when ready:',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'drift_publish_preview',
  },

  schema_drift_publish: {
    steps: [
      { label: 'Publishing FnOps Cost Model v2', detail: 'Writing column remapping and 2 formula rewrites to the model definition.' },
      { label: 'Running validation queries', detail: 'Spot-checking the 3 most-used answers against the updated schema — all returning valid data.' },
      { label: 'Verifying downstream liveboards', detail: 'Finance Dashboard and 2 other liveboards loading successfully with fresh data.' },
      { label: '✦ Monitoring alert cleared', detail: 'Schema drift for dbt_finance_spend is resolved. Removing from workspace pulse.' },
    ],
    duration: '12 seconds',
    autoComplete: true,
    stepDelay: 900,
    proposal: '',
    execution: 'Model is live and all dependents verified.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'drift_complete',
  },

  // ── Multi-model schema drift ───────────────────────────────────────────────
  schema_drift_multi_repair: {
    steps: [
      { label: 'Reading warehouse schema change log', detail: 'Detected 3 columns removed from the shared source table used by multiple models.' },
      { label: 'Identifying affected models', detail: 'Revenue Forecast and Pipeline Health both reference quarterly_target, forecast_region, and pipeline_stage.' },
      { label: 'Checking warehouse for replacement columns', detail: 'No equivalent columns found — these columns no longer exist in any source table.' },
      { label: 'Calculating downstream impact across both models', detail: '8 dependents affected: 5 answers, 2 liveboards, 1 formula across the 2 models.' },
    ],
    duration: '16 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'Here\'s the full picture — 3 columns were removed from the warehouse and no replacements exist. Both models are currently broken.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'multi_model_drift',
  },

  schema_drift_multi_execute: {
    steps: [
      { label: 'Removing quarterly_target from Revenue Forecast', detail: 'Updating 5 calculated columns that referenced this field.' },
      { label: 'Removing forecast_region and pipeline_stage from Pipeline Health', detail: 'Removing 3 formula references and 2 column definitions.' },
      { label: 'Updating 8 affected dependents', detail: 'Re-validating all answers, liveboards, and formulas that referenced the removed columns.' },
    ],
    duration: '12 seconds',
    autoComplete: true,
    stepDelay: 900,
    proposal: '',
    execution: 'Both models are repaired and ready to publish.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'repair_summary',
  },

  schema_drift_multi_preview: {
    steps: [
      { label: 'Applying column remapping across both models', detail: 'quarterly_target → q_target_amount, forecast_region → region_code, pipeline_stage → deal_stage.' },
      { label: 'Rewriting 3 formulas', detail: 'target_attainment_rate, pipeline_coverage_ratio, and stage_conversion_rate all reference removed columns.' },
      { label: '✦ Changeset ready — awaiting your approval to publish', detail: '' },
    ],
    duration: '10 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'Here\'s the full changeset for **Revenue Forecast v2** and **Pipeline Health v2**. Review and publish when ready:',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'drift_multi_publish_preview',
  },

  schema_drift_multi_publish: {
    steps: [
      { label: 'Publishing Revenue Forecast v2', detail: 'Writing column remapping and formula rewrites to Revenue Forecast.' },
      { label: 'Publishing Pipeline Health v2', detail: 'Writing column remapping and formula rewrites to Pipeline Health.' },
      { label: 'Running validation queries', detail: 'Spot-checking the most-used answers across both models — all returning valid data.' },
      { label: 'Verifying downstream liveboards', detail: '4 liveboards loading successfully with fresh data across both models.' },
      { label: '✦ Monitoring alert cleared', detail: 'Schema drift for warehouse source resolved across both models. Removing from workspace pulse.' },
    ],
    duration: '18 seconds',
    autoComplete: true,
    stepDelay: 900,
    proposal: '',
    execution: 'Both models are live and all dependents verified.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'drift_multi_complete',
  },

  // ── Blast radius — Phase 1: detect + map full impact ─────────────────────
  schema_blast_repair: {
    steps: [
      { label: 'Scanning connection metadata — Snowflake_Sales_Prod', detail: 'Reading latest schema diff from metadata sync completed at 03:14 AM.' },
      { label: 'Detecting removed columns', detail: 'gross_margin and store_id are absent from fact_sales (Snowflake_Sales_Prod). Both were present in the previous sync on Jan 13.' },
      { label: 'Mapping downstream impact — scanning all dependent objects', detail: 'Tracing column references across all Models, Answers, and Liveboards.' },
      { label: 'Scoring criticality — identifying high-traffic objects', detail: 'CEO\'s Daily Pulse Liveboard (2,400 views/wk) and Executive Revenue Dashboard (1,800 views/wk) flagged critical.' },
      { label: '✦ Blast radius mapped — 14 objects, 2 critical', detail: '2 Models · 8 Answers · 4 Liveboards currently serving broken or stale data.' },
    ],
    duration: '18 seconds',
    autoComplete: true,
    stepDelay: 900,
    proposal: '',
    execution: 'Two columns were removed from your warehouse during a schema migration last night — I\'ve mapped every object they power.\n\n**gross_margin** and **store_id** feed 14 objects across your analytics stack. Two of them are critical and currently serving broken data to executives.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'blast_radius',
  },

  // ── Blast radius — Phase 2: semantic analysis + reconciliation plan ────────
  schema_reconcile_plan: {
    steps: [
      { label: '✦ Running semantic analysis on Snowflake_Sales_Prod schema', detail: 'Comparing column names, types, and join patterns against 90 days of usage history.' },
      { label: 'Matching gross_margin → gm_final_amt (95% semantic confidence)', detail: 'Same numeric type, same join keys, found in 6 formula references. High confidence.' },
      { label: 'Matching store_id → location_key (88% confidence via join patterns)', detail: 'Same string type. Found in 4 join conditions — location_key is the post-migration equivalent.' },
      { label: 'Detecting formula references — 6 formulas need column rewrites', detail: 'gross_margin appears in 4 calculated columns; store_id appears in 2 filter expressions.' },
      { label: '✦ Reconciliation plan ready — review and apply', detail: '' },
    ],
    duration: '11 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'I found semantic successors for both columns in your current warehouse schema. Here\'s the full mapping — confirm or adjust before updating:',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'schema_reconcile',
  },

  // ── Blast radius — Phase 3: heal all dependents ────────────────────────────
  schema_blast_heal: {
    steps: [
      { label: 'Updating TML for 2 Models — gross_margin → gm_final_amt, store_id → location_key', detail: 'Sales Performance and Revenue Summary models updated.' },
      { label: 'Propagating changes to 8 Answers', detail: 'All 8 answers referencing either column now point to the new names.' },
      { label: 'Updating 4 Liveboards', detail: 'CEO\'s Daily Pulse Liveboard and Executive Revenue Dashboard now restoring — data will refresh on next query.' },
      { label: 'Rewriting 6 formula references across the stack', detail: 'channel_margin_ratio, revenue_by_store, and 4 others updated.' },
      { label: '✦ Creating restore point — pre-reconciliation snapshot saved', detail: 'Restore point timestamped Apr 14, 2:47 PM. Roll back available.' },
    ],
    duration: '22 seconds',
    autoComplete: true,
    stepDelay: 1000,
    proposal: '',
    execution: 'All 14 dependents updated. The CEO\'s Daily Pulse Liveboard and Executive Revenue Dashboard are live again.\n\nI\'ve saved a restore point so you can roll back everything with one click if the business logic is questioned.',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'restore_point',
  },

  // ── dbt Cloud connection repair ────────────────────────────────────────────
  dbt_connection_repair: {
    steps: [
      { label: 'Checking dbt Cloud connection status', detail: 'Connection ID: dbt-cloud-prod. Status: Offline.' },
      { label: 'Diagnosing sync failure', detail: 'Last successful sync: Jan 12, 2026, 10:22am.' },
      { label: 'Verifying API credentials', detail: 'API token expired Jan 12 at 10:22am. Token last rotated 90 days ago.', collapsible: '401 Unauthorized — token expiry confirmed via dbt Cloud auth endpoint' },
      { label: 'Identifying all affected models', detail: 'Sales Analytics, Sales Performance, Revenue Forecast — all 3 blocked on downstream sync.' },
    ],
    duration: '10 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'Found the issue — the API token expired. Here\'s the full picture before I apply the fix:',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'connection_status',
  },

  dbt_connection_apply: {
    steps: [
      { label: 'Rotating API token', detail: 'Generating new token via dbt Cloud credentials API.' },
      { label: 'Reconnecting to dbt Cloud', detail: 'Handshake verified — connection restored.' },
      { label: 'Queuing resync for 3 blocked models', detail: 'Sales Analytics, Sales Performance, Revenue Forecast added to sync queue. ETA: ~4 minutes.' },
    ],
    duration: '8 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'Connection restored. All 3 models are syncing — you\'ll see fresh data in ~4 minutes.',
    nextStep: 'healthy',
    preserveStep: true,
  },

  // ── Null rate investigation ────────────────────────────────────────────────
  null_rate_investigation: {
    steps: [
      { label: 'Sampling campaign_id null distribution', detail: '18.2% of orders have null campaign_id as of today.', collapsible: 'SELECT COUNT(*) FILTER (WHERE campaign_id IS NULL) * 100.0 / COUNT(*) AS null_pct\nFROM orders\n-- Result: 18.2%' },
      { label: 'Comparing against 30-day historical baseline', detail: 'Null rate was stable at 2% from Dec 1 – Jan 13. Spike started Jan 14.' },
      { label: 'Tracing nulls through the join chain', detail: 'orders.campaign_id → campaigns.id — LEFT JOIN gap analysis complete.' },
      { label: 'Segmenting null orders by channel and date', detail: 'Organic-channel orders added Jan 14 have no campaign_id — this is expected by design.' },
      { label: '✦ Root cause identified', detail: 'Not a data error. New order source introduced Jan 14 intentionally has no campaign attribution.' },
    ],
    duration: '18 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'This isn\'t a data error — it\'s a new behavior introduced Jan 14. Here\'s the full picture and your options:',
    nextStep: 'healthy',
    preserveStep: true,
    executionGenUI: 'null_rate',
  },

  null_rate_add_organic: {
    steps: [
      { label: 'Adding Organic to campaigns table', detail: 'Inserting campaign_id = \'organic\', name = \'Organic\', channel = \'organic\'.' },
      { label: 'Backfilling campaign_id on organic orders', detail: '3,241 orders from Jan 14 onward updated.' },
      { label: 'Updating join to LEFT JOIN', detail: 'orders → campaigns join now handles null-safe attribution.' },
      { label: 'Recalculating attribution metrics', detail: 'All downstream attribution answers updated with organic channel.' },
    ],
    duration: '14 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'Attribution model updated. Organic is now a tracked channel — null rate resolved.',
    nextStep: 'healthy',
    preserveStep: true,
  },

  null_rate_filter_organic: {
    steps: [
      { label: 'Adding filter to exclude organic orders', detail: 'WHERE campaign_id IS NOT NULL applied to attribution model.' },
      { label: 'Recalculating attribution metrics', detail: '3,241 organic orders excluded from all reports.' },
    ],
    duration: '8 seconds',
    autoComplete: true,
    stepDelay: 800,
    proposal: '',
    execution: 'Organic orders filtered. Null rate restored to 2% — note that 18% of orders are now excluded from attribution reports.',
    nextStep: 'healthy',
    preserveStep: true,
  },

  null_rate_suppress: {
    steps: [
      { label: 'Updating alert threshold', detail: 'Null rate threshold raised from 5% to 22% for campaign_id.' },
      { label: 'Marking 18% as expected', detail: 'Baseline reset to current state — future spikes will alert only if rate exceeds 22%.' },
    ],
    duration: '4 seconds',
    autoComplete: true,
    stepDelay: 600,
    proposal: '',
    execution: 'Alert suppressed. No model changes made — threshold updated to 22%.',
    nextStep: 'healthy',
    preserveStep: true,
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

  // ── Coaching fix scripts — triggered by "Fix in build" from test tab ─────────
  // Each is autoComplete (no proposal/confirm) with stepDelay: 800 for fast feel.
  // executionSuggestions: ['Switch to test mode'] takes the user back to re-test.

  coaching_time_period: {
    steps: [
      { label: 'Reading date column definitions', detail: 'Checking how order_date, start_date, and end_date are typed and described in the model.' },
      { label: 'Identifying granularity gap', detail: 'order_date has no granularity context — Spotter defaulted to daily aggregation instead of the time period stated in the question.' },
      { label: 'Writing granularity fix', detail: 'Adding AI context to order_date with correct time period guidance.' },
    ],
    duration: '6 seconds',
    proposal: '',
    execution: `Fixed. Updated \`order_date\` with granularity context:\n\n*"Use monthly aggregation for trend analysis; daily for operational queries. Default to the time period explicitly stated in the question."*\n\nSpotter will now apply the right time period by default. Ask another question to verify the fix.`,
    autoComplete: true,
    stepDelay: 800,
    nextStep: 'healthy',
    preserveStep: true,
    columnOverridesUpdate: {
      order_date: { aiContext: 'Date the order was placed, normalized to YYYY-MM-DD. Use monthly aggregation for trend analysis; daily for operational queries. Default to the time period explicitly stated in the question.' },
    },
  },

  coaching_number_wrong: {
    steps: [
      { label: 'Checking metric formula', detail: 'Reading definitions for campaign_roas, conversion_rate, and related calculated columns.' },
      { label: 'Identifying aggregation issue', detail: 'campaign_roas formula includes refunded orders in revenue — this inflates ROAS.' },
      { label: 'Writing fix', detail: 'Adding aggregation rule to exclude refunded orders from revenue calculations.' },
    ],
    duration: '6 seconds',
    proposal: '',
    execution: `Fixed. Added aggregation rule to \`amount\`:\n\n*"Exclude orders where status = refunded from revenue calculations. Use SUM for total net revenue only."*\n\nROAS will now reflect net revenue, not gross. Ask another question to verify the fix.`,
    autoComplete: true,
    stepDelay: 800,
    nextStep: 'healthy',
    preserveStep: true,
    columnOverridesUpdate: {
      amount: { aiContext: 'Net order value in USD. Exclude orders with status = refunded from revenue calculations. Use SUM for total net revenue, AVG for average order value.' },
    },
  },

  coaching_wrong_columns: {
    steps: [
      { label: 'Mapping question to model columns', detail: 'Matching terms in the question against column names across orders, campaigns, and users.' },
      { label: 'Finding ambiguous column names', detail: 'Found columns with overlapping meanings and no descriptions — Spotter is guessing by column name alone.' },
      { label: 'Writing column descriptions', detail: 'Adding AI context to the most ambiguous columns used in this query type.' },
    ],
    duration: '6 seconds',
    proposal: '',
    execution: `Fixed. Added descriptions to 5 columns most likely used for this query:\n✓ users.segment\n✓ orders.status\n✓ campaigns.channel\n✓ orders.amount\n✓ users.lifetime_value\n\nSpotter now has clear context for which columns to use. Ask another question to verify the fix.`,
    autoComplete: true,
    stepDelay: 800,
    nextStep: 'healthy',
    preserveStep: true,
    columnOverridesUpdate: {
      segment:        { aiContext: 'Customer tier based on company size and annual revenue. Values: Enterprise, Mid-market, SMB. Null = unclassified users — expected, not an error.' },
      status:         { aiContext: 'Current state of the order. Values: completed, pending, cancelled, refunded.' },
      channel:        { aiContext: 'Marketing channel used for this campaign. Values: paid_search, social, email, display.' },
      amount:         { aiContext: 'Order value in USD at time of purchase. Use SUM for total revenue, AVG for average order value.' },
      lifetime_value: { aiContext: 'Cumulative revenue from this user since signup. Use SUM for cohort totals, AVG to compare segments.' },
    },
  },

  coaching_join_wrong: {
    steps: [
      { label: 'Inspecting join paths', detail: 'Tracing joins between orders, campaigns, and users — all are LEFT JOINs on foreign keys.' },
      { label: 'Checking join cardinality', detail: 'orders × campaigns is 1:many — each campaign maps to many orders. Aggregation must happen before the join.' },
      { label: 'Writing join context', detail: 'Adding a join hint to prevent row fan-out during aggregation.' },
    ],
    duration: '6 seconds',
    proposal: '',
    execution: `Fixed. Added join context to the model:\n\n*"Always aggregate orders before joining to campaigns to avoid row multiplication. Use SUM at the order level first."*\n\nSpotter will handle this join correctly going forward. Ask another question to verify the fix.`,
    autoComplete: true,
    stepDelay: 800,
    nextStep: 'healthy',
    preserveStep: true,
  },

  coaching_something_else: {
    steps: [
      { label: 'Scanning full model', detail: 'Reviewing all column definitions, joins, and metric formulas across 3 tables.' },
      { label: 'Checking column context', detail: 'Found 4 columns with no descriptions — likely candidates for the issue.' },
      { label: 'Applying best-guess fix', detail: 'Adding descriptions to the top columns most likely involved in this query type.' },
    ],
    duration: '6 seconds',
    proposal: '',
    execution: `Applied a best-guess fix: added descriptions to the 4 most likely columns involved in this query.\n\nIf the answer is still wrong, try selecting the specific option that matches the issue — "number wrong", "time period", or "join". Ask another question to verify the fix.`,
    autoComplete: true,
    stepDelay: 800,
    nextStep: 'healthy',
    preserveStep: true,
  },

  // ── Add synonyms to impressions (Situation 1 / Build) ────────────────────────
  // Triggered when impressions is selected and user asks to add synonyms/views/visits.

  add_synonyms_impressions: {
    steps: [
      { label: 'Reading impressions column definition', detail: 'campaigns.impressions · measure · SUM. Current synonyms: none.' },
      { label: 'Validating synonym candidates', detail: '"views" and "visits" are standard business terms for ad impression counts. No conflicts found across the model.' },
      { label: 'Writing synonyms to model', detail: 'Adding "views" and "visits" as alternative names for campaigns.impressions.' },
    ],
    duration: '5 seconds',
    proposal: '',
    execution: `Done. Added synonyms to \`campaigns.impressions\`:\n\n✓ views\n✓ visits\n\nSpotter will now match questions like *"how many views did this campaign get?"* or *"show me visits by channel"* directly to the impressions column.`,
    autoComplete: true,
    stepDelay: 800,
    nextStep: 'healthy',
    preserveStep: true,
    columnOverridesUpdate: {
      impressions: { synonyms: ['views', 'visits'] },
    },
  },

  scratch_parse_use_case: {
    steps: [
      { label: 'Parsing your use case…', detail: '' },
      { label: 'Preparing clarifying questions…', detail: '' },
    ],
    duration: '~2s',
    proposal: '',
    execution: '',
    nextStep: 'empty',
    stepDelay: 600,
  },

  scratch_understand_requirement: {
    steps: [
      { label: 'Understanding your requirements…', detail: '' },
      { label: 'Identifying the right tables and metrics…', detail: '' },
    ],
    duration: '~2s',
    proposal: '',
    execution: '',
    nextStep: 'empty',
    stepDelay: 900,
  },

  // ── Multi-source flow scripts ─────────────────────────────────────────────────

  scan_multi_source: {
    steps: [
      { label: 'Scanning data environment', detail: '1 connection found: SF_PROD_CUSTOMER (Snowflake)' },
      {
        label: 'Analyzing schema for customer health indicators',
        detail: '240 tables scanned · 4 matches across ANALYTICS_DB, SFDC_RAW, GONG_INTEGRATION, JIRA_WORKSPACE',
        collapsible: `SELECT table_name, row_count, last_modified
FROM information_schema.tables
WHERE table_schema IN ('ANALYTICS_DB','SFDC_RAW','GONG_INTEGRATION','JIRA_WORKSPACE')
  AND table_name SIMILAR TO '%(ACCOUNT|CUSTOMER|SUPPORT|CALL|DEFECT|HEALTH)%'
ORDER BY row_count DESC
-- Matched: DIM_ACCOUNTS, SUPPORT_CASES, CALL_METRICS, CUSTOMER_FOUND_DEFECTS`,
      },
      {
        label: 'Profiling matched tables',
        detail: 'DIM_ACCOUNTS 12k rows · SUPPORT_CASES 84k rows · CALL_METRICS 31k rows · CUSTOMER_FOUND_DEFECTS 6.2k rows',
      },
    ],
    duration: '~4 seconds',
    stepDelay: 1200,
    autoComplete: false,
    proposal: `I found **4 tables** in your Snowflake environment that cover customer accounts, support history, engagement, and engineering escalations. Do these look right?`,
    execution: `These 4 tables are set as your core sources. What other data do you want to bring in?`,
    nextStep: 'empty',
    preserveStep: true,
  },

  create_pendo_notebook: {
    steps: [
      { label: 'Creating Python notebook container', detail: 'pendo_nps_ingestion.ipynb ready' },
      { label: 'Configuring Pendo API endpoint', detail: 'GET /v2/nps · target column: nps_comments' },
      { label: 'Preparing sentiment analysis pipeline', detail: 'VADER sentiment classifier loaded' },
    ],
    duration: '~3 seconds',
    stepDelay: 1000,
    autoComplete: false,
    proposal: '',
    execution: '',
    nextStep: 'empty',
    preserveStep: true,
  },

  execute_pendo_fetch: {
    steps: [
      {
        label: 'Authenticating with Pendo API',
        detail: '200 OK',
        collapsible: `import requests\n\nendpoint = "https://app.pendo.io/api/v2/aggregation"\nheaders = {"X-Pendo-Integration-Key": PENDO_API_KEY, "Content-Type": "application/json"}\nresponse = requests.get(endpoint, headers=headers)\nassert response.status_code == 200`,
      },
      {
        label: 'Fetching NPS responses',
        detail: '2,847 records fetched',
        collapsible: `data = response.json()["results"]\ndf = pd.DataFrame(data)[["accountId","npsScore","npsComments","responseDate"]]\ndf.columns = ["account_id","nps_score","nps_comments","response_date"]`,
      },
      {
        label: 'Running sentiment classification',
        detail: 'positive: 61% · neutral: 24% · negative: 15%',
        collapsible: `from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer\nsia = SentimentIntensityAnalyzer()\ndf["sentiment_score"] = df["nps_comments"].fillna("").apply(\n    lambda t: sia.polarity_scores(t)["compound"]\n)\ndf["sentiment"] = df["sentiment_score"].apply(\n    lambda s: "positive" if s > 0.05 else "negative" if s < -0.05 else "neutral"\n)`,
      },
      {
        label: 'Writing to ThoughtSpot CDW (Spotstore)',
        detail: 'pendo_nps_enriched · 2,847 rows · 6 columns',
        collapsible: `CREATE TABLE spotstore.pendo_nps_enriched AS\nSELECT account_id, nps_score, nps_comments,\n       sentiment, sentiment_score, response_date\nFROM pendo_staging\n-- Written via TQL import`,
      },
    ],
    duration: '~8 seconds',
    stepDelay: 2000,
    autoComplete: true,
    proposal: '',
    execution: 'Pendo NPS data is cached in the Spotstore. Notebook is available in the panel — open it to review or edit the cells.\n\nDQ 92 — 2,847 rows · 3% null comments (treated as no response) · sentiment coverage 97%.',
    nextStep: 'empty',
    preserveStep: true,
  },

  process_csv_upload: {
    steps: [
      { label: 'Reading CSV file', detail: '142 rows · 4 columns · all types clean' },
      {
        label: 'Writing to ThoughtSpot CDW (Spotstore)',
        detail: 'csm_account_mapping · 142 rows · 4 columns',
      },
    ],
    duration: '~3 seconds',
    stepDelay: 1400,
    autoComplete: true,
    proposal: '',
    execution: '',
    nextStep: 'empty',
    preserveStep: true,
  },

  compile_staging_table: {
    steps: [
      { label: 'Identifying join key across external sources', detail: 'account_id present in both sources · 100% overlap' },
      {
        label: 'Running SQL compilation query',
        detail: 'Joining pendo_nps_enriched + csm_account_mapping',
        collapsible: `CREATE TABLE spotstore.customer_health_external AS\nSELECT\n  p.account_id,\n  p.nps_score,\n  p.nps_comments,\n  p.sentiment,\n  p.sentiment_score,\n  c.csm_name,\n  c.exec_sponsor,\n  c.csm_region,\n  c.account_tier\nFROM spotstore.pendo_nps_enriched p\nLEFT JOIN spotstore.csm_account_mapping c\n  ON p.account_id = c.account_id`,
      },
      { label: 'Writing unified staging table to ThoughtSpot CDW', detail: 'customer_health_external · 2,847 rows · 9 columns' },
    ],
    duration: '~4 seconds',
    stepDelay: 1300,
    autoComplete: true,
    proposal: '',
    execution: 'All external sources are compiled into a single staging table — `customer_health_external` is ready in the Spotstore. Open it in the panel to review the schema and SQL.\n\nPendo ingestion will refresh **daily at 6 AM UTC** by default — change this anytime in model settings. The CSM mapping is a one-time upload.\n\nWhen you\'re ready, tell me and I\'ll build the model.',
    nextStep: 'empty',
    preserveStep: true,
  },

  ms_build_project: {
    steps: [
      { label: 'Reviewing your data sources', detail: 'Reading 4 Snowflake tables + customer_health_external staging table.' },
      {
        label: 'Mapping joins across all sources',
        detail: 'DIM_ACCOUNTS is the driving table. Pendo staging covers 2,847 of 12,000 accounts (24%) — accounts with no NPS response will have null NPS components.',
        collapsible: `FROM dim_accounts da\nLEFT JOIN customer_health_external che ON da.account_id = che.account_id\nLEFT JOIN support_cases sc           ON da.account_id = sc.account_id\nLEFT JOIN call_metrics cm            ON da.account_id = cm.account_id\nLEFT JOIN customer_found_defects cfd ON da.account_id = cfd.account_id`,
      },
      {
        label: 'Selecting columns for customer health scoring',
        detail: 'Selected 18 columns across 5 tables. Removed 4 system fields and 2 raw text columns. Both DIM_ACCOUNTS and the CSM CSV have account_tier — using the CSM mapping version.',
      },
      {
        label: 'Building health score formula',
        detail: 'Composite health score: NPS (30%) + support volume (20%) + call sentiment (25%) + defect rate (25%).',
        collapsible: `-- p1_cases_open  = COUNT(*) FILTER (WHERE priority = 'P1' AND status = 'Open')\n-- open_defects    = COUNT(*) FILTER (WHERE status != 'Resolved')\n\n-- Customer Health Score (composite)\n(\n  CASE WHEN nps_score >= 9 THEN 1.0\n       WHEN nps_score >= 7 THEN 0.6\n       ELSE 0.2 END * 0.30\n) +\n(\n  CASE WHEN p1_cases_open = 0 THEN 1.0\n       WHEN p1_cases_open <= 2 THEN 0.5\n       ELSE 0.0 END * 0.20\n) +\n(\n  COALESCE(avg_sentiment_score, 0.5) * 0.25\n) +\n(\n  CASE WHEN open_defects = 0 THEN 1.0\n       WHEN open_defects <= 3 THEN 0.6\n       ELSE 0.2 END * 0.25\n)`,
      },
      { label: '✦ Enriching for AI', detail: 'Writing AI context and synonyms for 18 columns. Spotter needs this to answer questions about customer health well.' },
      {
        label: 'Validating data quality',
        detail: 'Row counts verified · DIM_ACCOUNTS is the driving table (12,000 accounts) · one DQ flag in SUPPORT_CASES',
        collapsible: `-- Validation summary\nDIM_ACCOUNTS            12,000 rows · DQ 94\nSUPPORT_CASES           84,312 rows · DQ 81  (14% null resolution_time — flagged)\nCALL_METRICS            31,089 rows · DQ 88\nCUSTOMER_FOUND_DEFECTS   6,218 rows · DQ 91\ncustomer_health_external 2,847 rows · DQ 96   (Pendo — 24% account coverage)\n\n-- Join key: account_id\n12,000 accounts in model · 2,847 have NPS data · 9,153 will have null NPS components`,
      },
    ],
    stepDelay: 5000,
    duration: '~25 seconds',
    autoComplete: true,
    proposal: '',
    execution: `Done. I connected 5 sources — 4 Snowflake tables and 1 Spotstore staging table — and built a composite Customer Health Score.\n\nOne flag: \`resolution_time_hours\` in SUPPORT_CASES is 14% null — the health score uses P1 case count, not resolution time, so it won't affect results. Ready to test.`,
    nextStep: 'healthy',
    tablesToAdd: ['dim_accounts', 'support_cases', 'call_metrics', 'customer_found_defects', 'customer_health_external'],
    defaultColumns: {
      dim_accounts:             ['account_id', 'account_name', 'industry', 'arr', 'region', 'account_tier', 'renewal_date'],
      support_cases:            ['account_id', 'priority', 'status', 'case_category', 'resolution_time_hours', 'reopened'],
      call_metrics:             ['account_id', 'sentiment_score', 'next_steps_mentioned', 'deal_risk_flag'],
      customer_found_defects:   ['account_id', 'severity', 'resolution_days', 'escalated_to_engineering'],
      customer_health_external: ['account_id', 'nps_score', 'sentiment', 'sentiment_score', 'csm_name', 'exec_sponsor'],
    },
    setsColumnsSelected: true,
    newName: 'Customer Health Scorecard',
    executionSuggestions: [],
    outcomeCard: {
      title: 'Customer Health Scorecard',
      chips: ['5 sources', '4 joins', '18 columns', '1 health score'],
      errorChips: ['⚠ 1 DQ flag'],
      note: 'Your model is ready. Start testing or make any changes first.',
    },
    contextUpdate: {
      purpose: 'Understand customer health across NPS, support, call engagement, and engineering escalations.',
      persona: 'Customer Success Manager tracking at-risk accounts and renewal health.',
      sampleQuestions: 'Which accounts have the lowest health scores this quarter?\nWhat is the NPS trend for our Enterprise accounts?\nWhich CSMs have the most P1 cases open?',
    },
  },

  pendo_confirm_column: {
    steps: [],
    duration: '',
    proposal: '',
    execution: '',
    nextStep: 'empty',
    preserveStep: true,
  },
};

// ── Coaching script key map ───────────────────────────────────────────────────
const COACHING_SCRIPT_MAP: Record<string, string> = {
  'The number is wrong':                       'coaching_number_wrong',
  'The time period is wrong':                  'coaching_time_period',
  'The wrong columns or tables are being used':'coaching_wrong_columns',
  'The join between tables is wrong':          'coaching_join_wrong',
  'Something else':                            'coaching_something_else',
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
              name: script.newName && p.name === 'Untitled Model' ? script.newName : p.name,
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
              ...(script.executionGenUI ? { genUI: script.executionGenUI } : {}),
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
        content: `**${names}** ${alreadyAdded.length === 1 ? 'is' : 'are'} already in your model. You can view ${alreadyAdded.length === 1 ? 'it' : 'them'} in the Data panel on the left.`,
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
      ? `Found **${knownTables[0].name}** in your ${knownTables[0].connection} warehouse. I've added it to your model.`
      : `Found **${knownTables.length} tables** in your warehouse. I've added them to your model.`;

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

// ── From-scratch state type ───────────────────────────────────────────────────

type FromScratchPhase =
  | 'use_case_prompt'
  | 'clarify_q1'
  | 'plan_ready'
  | 'plan_editing'
  | 'confirm_build'
  | 'done';

// ── Multi-source state type ───────────────────────────────────────────────────

type MultiSourcePhase =
  | 'scan_running'
  | 'tables_proposed'
  | 'awaiting_sources'
  | 'awaiting_notebook_consent'
  | 'notebook_running'
  | 'awaiting_api_key'
  | 'awaiting_nps_confirm'
  | 'pendo_running'
  | 'awaiting_csv_prompt'
  | 'awaiting_csv'
  | 'awaiting_csv_write_consent'
  | 'csv_running'
  | 'awaiting_staging_decision'
  | 'awaiting_staging_consent'
  | 'staging_running'
  | 'awaiting_build_initiation'
  | 'ready_to_build'
  | 'awaiting_ms_build'
  | 'done';

// Runs working steps for a from-scratch script, then calls onComplete.
// Does not use the normal proposal/confirm path — callers handle the follow-up.
function runFromScratchSteps(
  scriptKey: string,
  userText: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<AgentMessage[]>>,
  onComplete: () => void,
  abortRef: React.MutableRefObject<boolean>
) {
  const script = SCRIPTS[scriptKey];
  if (!script) return;
  const workingId = `w-${Date.now()}`;
  const step0Detail = userText
    ? `"${userText.length > 120 ? userText.slice(0, 120) + '…' : userText}"`
    : script.steps[0]?.detail;

  setMessages(prev => [...prev, {
    id: workingId, type: 'working', content: '',
    duration: script.duration,
    steps: script.steps.map((s, i) => ({
      label: s.label,
      detail: i === 0 ? step0Detail : s.detail,
      collapsibleOpen: false,
      status: i === 0 ? 'running' as const : 'pending' as const,
    })),
    stepsCollapsed: false,
  }]);

  const delay = script.stepDelay ?? 800;
  script.steps.forEach((_, idx) => {
    setTimeout(() => {
      if (abortRef.current) return;
      setMessages(prev => prev.map(m => {
        if (m.id !== workingId || !m.steps) return m;
        return {
          ...m,
          steps: m.steps.map((s, i) =>
            i === idx     ? { ...s, status: 'done' as const } :
            i === idx + 1 ? { ...s, status: 'running' as const } : s
          ),
        };
      }));
      if (idx === script.steps.length - 1) {
        setTimeout(() => {
          if (abortRef.current) return;
          setMessages(prev => prev.map(m =>
            m.id === workingId
              ? { ...m, stepsCollapsed: true, steps: m.steps?.map(s => ({ ...s, status: 'done' as const })) }
              : m
          ));
          onComplete();
        }, 600);
      }
    }, (idx + 1) * delay);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

// ── Test mode types ───────────────────────────────────────────────────────────

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
  },
  'What is revenue by region?': {
    answerTitle: 'Revenue by Region',
    answerDesc: "Revenue is distributed across four regions. North America leads with 58% of total revenue from this model's orders data.",
    chips: [
      { type: 'measure',   label: 'SUM(amount)' },
      { type: 'attribute', label: 'region' },
    ],
    workingSteps: [
      { title: 'Mapping revenue metric to orders table' },
      { title: 'Retrieving model context' },
      { title: 'Fetching relevant dataset context', toolCard: 'ThoughtSpot: Fetching relevant dataset context' },
      { title: 'Grouping by region dimension', desc: 'orders.region has 4 values: North America, EMEA, APAC, LATAM. No nulls.' },
      { title: 'Fetching data from dataset', toolCard: 'ThoughtSpot: Answer generation' },
      { title: 'Worked for 5 seconds', isTiming: true },
    ],
    chartData: {
      categories: ['North America', 'EMEA', 'APAC', 'LATAM'],
      values: [142000, 68000, 41000, 19000],
      formatter: '',
      yMax: 170000,
    },
  },
  'What is the budget utilisation rate?': {
    answerTitle: 'Budget Utilisation Rate',
    answerDesc: "I found the budget and spend columns but couldn't confidently map 'utilisation rate' — the column has no description or synonym. I've used SUM(spend)/SUM(budget) as a best guess.",
    chips: [
      { type: 'measure',   label: 'SUM(spend) / SUM(budget)' },
      { type: 'filter',    label: 'budget > 0' },
    ],
    workingSteps: [
      { title: "Searching for 'budget utilisation' in model" },
      { title: 'Retrieving model context' },
      { title: 'Fetching relevant dataset context', toolCard: 'ThoughtSpot: Fetching relevant dataset context' },
      { title: 'No direct match — approximating from available columns', desc: "campaigns.budget has no description or synonym for 'utilisation'. Calculated spend/budget ratio as fallback." },
      { title: 'Fetching data from dataset', toolCard: 'ThoughtSpot: Answer generation' },
      { title: 'Worked for 9 seconds', isTiming: true },
    ],
    chartData: {
      categories: ['Retargeting', 'Summer Sale', 'Spring Promo', 'Brand Awareness', 'Product Launch'],
      values: [94, 87, 72, 61, 48],
      formatter: '%',
      yMax: 110,
    },
  },
};

const DEMO_QUESTION_POOL = [
  'What is our ROAS by campaign and channel?',
  'What is the budget utilisation rate?',
  'Which user segments convert best?',
  'What is revenue by region?',
  'Show me campaign spend by channel last quarter',
  'Which campaigns are over budget this month?',
  'What is our cost per acquisition by channel?',
  'How has conversion rate trended over the last 6 months?',
];

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

// ── Coaching debug steps — per category ──────────────────────────────────────

const COACHING_OPTIONS = [
  'The number is wrong',
  'The time period is wrong',
  'The wrong columns or tables are being used',
  'The join between tables is wrong',
  'Something else',
];

const COACHING_DEBUG_STEPS: Record<string, Array<{ label: string; detail: string }>> = {
  'The number is wrong': [
    { label: 'Reading metric definitions', detail: 'Checking formula logic for columns used in this answer.' },
    { label: 'Verifying aggregation rules', detail: 'Looking for SUM vs COUNT mismatches and null handling.' },
    { label: 'Scanning for filter conflicts', detail: 'Checking if any row-level filters are silently excluding data.' },
  ],
  'The time period is wrong': [
    { label: 'Checking date column definitions', detail: 'Inspecting how date columns are typed and described in the model.' },
    { label: 'Inspecting filter context', detail: 'Looking for default date filters or granularity settings that may restrict results.' },
    { label: 'Verifying time intelligence setup', detail: 'Checking if fiscal year or custom calendar settings are interfering.' },
  ],
  'The wrong columns or tables are being used': [
    { label: 'Mapping question intent to model columns', detail: 'Matching terms in the question to column names and descriptions.' },
    { label: 'Checking for ambiguous column names', detail: 'Found multiple columns with similar names — no description to disambiguate.' },
    { label: 'Identifying missing AI context', detail: 'Columns without descriptions force Spotter to guess by name alone.' },
  ],
  'The join between tables is wrong': [
    { label: 'Inspecting join paths in model', detail: 'Tracing which tables are joined and on which keys.' },
    { label: 'Checking join cardinality', detail: 'Verifying 1:1 vs 1:many relationships to detect row fan-out.' },
    { label: 'Looking for aggregation inflation', detail: 'A bad join can silently multiply row counts and inflate metrics.' },
  ],
  'Something else': [
    { label: 'Scanning full model', detail: 'Reviewing all column definitions, joins, and metric formulas.' },
    { label: 'Checking column context and formulas', detail: 'Looking for missing descriptions, mistyped columns, and broken references.' },
    { label: 'Reviewing join structure', detail: 'No obvious issue found — will need more context in the build agent.' },
  ],
};

const COACHING_DEBUG_RESULTS: Record<string, string> = {
  'The number is wrong': 'The metric formula may be using the wrong aggregation or column. I\'ve flagged the likely culprit.',
  'The time period is wrong': 'The date column used in this answer may be missing a description or granularity rule.',
  'The wrong columns or tables are being used': 'Several columns in this model are missing descriptions, so Spotter is guessing by column name alone.',
  'The join between tables is wrong': 'The join configuration may be causing row duplication or incorrect aggregation.',
  'Something else': 'I\'ve scanned the model but need more context to isolate the issue.',
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
  selectedColumns?: string[];
  onColumnRemove?: (name: string) => void;
  isFromScratch?: boolean;
  isMultiSource?: boolean;
  isDbtReview?: boolean;
  onOpenPlan?: (plan: PlanData) => void;
  onOpenQualityPlan?: () => void;
  onBuildStart?: () => void;
  fullPage?: boolean;
  onBack?: () => void;
  initialFlow?: string;
  initialMessage?: string;
  onInsightResolved?: (id: string) => void;
  onOpenObject?: (name: string, highlightCol?: string) => void;
  onOpenMsItem?: (item: { type: string; name: string }) => void;
}

const AgentPanel: React.FC<AgentPanelProps> = ({ project, setProject, messages, setMessages, initialPrompt, onBuildComplete, externalMessage, onExternalMessageHandled, externalMessageAttachment, injectInput, onInjectInputHandled, width = 340, selectedColumns, onColumnRemove, isFromScratch, isMultiSource, isDbtReview, onOpenPlan, onOpenQualityPlan, onBuildStart, fullPage = false, onBack, initialFlow, initialMessage, onInsightResolved, onOpenObject, onOpenMsItem }) => {
  const [pendingAction, setPending]     = useState<PendingAction | null>(null);
  const [isProcessing, setProcessing]   = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [prepSuggestions, setPrepSuggestions] = useState<PrepSuggestion[]>(() =>
    PREP_SUGGESTIONS.map(s => ({ ...s }))
  );
  const [fromScratchPhase, setFromScratchPhase] = useState<FromScratchPhase | null>(isFromScratch ? 'use_case_prompt' : null);
  const [multiSourcePhase, setMultiSourcePhase] = useState<MultiSourcePhase | null>(isMultiSource ? 'scan_running' : null);
  const [planVersion, setPlanVersion]    = useState(1);
  const [planExpandedId, setPlanExpandedId] = useState<string | null>(null);
  const [agentMode, setAgentMode]        = useState<'build' | 'test'>('build');
  const [connFilter, setConnFilter]      = useState<string | null>(null);
  const [coachingPrompt, setCoachingPrompt] = useState<{ sourceQuestion: string } | null>(null);
  const [sampleQOpen, setSampleQOpen]       = useState(false);
  const [sampleQOffset, setSampleQOffset]   = useState(0);
  const messagesEndRef           = useRef<HTMLDivElement>(null);
  const scrollContainerRef       = useRef<HTMLDivElement>(null);
  const isNearBottomRef          = useRef(true);
  const promptBarRef             = useRef<PromptBarRef>(null);
  const buildCalledRef           = useRef(false);
  const initialPromptFiredRef    = useRef(false);
  const initialFlowFiredRef      = useRef(false);
  const buildAbortRef            = useRef(false);
  const lastHandledExternalRef   = useRef<string | null>(null);
  const prevMsgLengthRef         = useRef(messages.length);


  // Auto-scroll to bottom on any messages change (new message or step update),
  // but only if the user is already near the bottom — don't hijack manual scrolling.
  useEffect(() => {
    prevMsgLengthRef.current = messages.length;
    if (!isNearBottomRef.current) return;
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!initialPrompt || initialPromptFiredRef.current) return;
    initialPromptFiredRef.current = true;
    if (isMultiSource) {
      // Multi-source flow: show user message, auto-run scan_multi_source
      setMessages([{ id: `u-${Date.now()}`, type: 'user', content: initialPrompt }]);
      setProcessing(true);
      setTimeout(() => {
        runFromScratchSteps('scan_multi_source', initialPrompt, setMessages, () => {
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response',
            content: "I found **4 tables** in your Snowflake environment — DIM_ACCOUNTS, SUPPORT_CASES, CALL_METRICS, and CUSTOMER_FOUND_DEFECTS — covering accounts, support history, call engagement, and engineering escalations. These are set as your core sources.",
            artifactCards: [
              { type: 'table' as const, name: 'DIM_ACCOUNTS',           subLabel: 'ANALYTICS_DB · 12k rows · DQ 94' },
              { type: 'table' as const, name: 'SUPPORT_CASES',          subLabel: 'SFDC_RAW · 84k rows · DQ 81' },
              { type: 'table' as const, name: 'CALL_METRICS',           subLabel: 'GONG_INTEGRATION · 31k rows · DQ 88' },
              { type: 'table' as const, name: 'CUSTOMER_FOUND_DEFECTS', subLabel: 'JIRA_WORKSPACE · 6.2k rows · DQ 91' },
            ],
          }, {
            id: `r2-${Date.now()}`, type: 'response',
            content: "What other data do you want to bring in?",
          }]);
          setMultiSourcePhase('awaiting_sources');
          setProcessing(false);
        }, buildAbortRef);
      }, 300);
    } else if (isFromScratch) {
      setMessages([{ id: `u-${Date.now()}`, type: 'user', content: initialPrompt }]);
      setProcessing(true);
      setTimeout(() => {
        runFromScratchSteps('scratch_parse_use_case', initialPrompt, setMessages, () => {
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response',
            content: `I can see you want to build a data model for ${project.name}. Before I start, a couple of quick questions to make sure it fits your use case — feel free to upload any docs or files too.`,
          }]);
          setFromScratchPhase('clarify_q1');
          setProcessing(false);
        }, buildAbortRef);
      }, 300);
    } else {
      processText(initialPrompt);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // initialFlow — auto-trigger a named flow on mount (e.g. schema drift repair from Pulse)
  useEffect(() => {
    if (!initialFlow || initialFlowFiredRef.current || buildCalledRef.current) return;
    initialFlowFiredRef.current = true;
    buildCalledRef.current = true;
    if (initialMessage) {
      const delay = fullPage ? 420 : 0;
      setTimeout(() => {
        setMessages([{ id: `u-${Date.now()}`, type: 'user', content: initialMessage }]);
        setTimeout(() => {
          setProcessing(true);
          runFlow(initialFlow, setMessages, setPending, setProcessing, setProject);
        }, 520);
      }, delay);
    } else {
      setProcessing(true);
      runFlow(initialFlow, setMessages, setPending, setProcessing, setProject);
    }
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
      if (isDbtReview) {
        setMessages([{
          id: `r-${Date.now()}`,
          type: 'response',
          content: `I've opened **${project.name}** in ThoughtSpot. What would you like to do?`,
          interactiveChips: [
            { label: 'Enrich for AI', value: 'Enrich for AI' },
            { label: 'Fix translation issues', value: 'Fix translation issues' },
          ],
        }]);
      } else {
        setMessages([{
          id: `r-${Date.now()}`,
          type: 'response',
          content: 'What would you like to do today?',
          suggestions: ['Add a table', 'Create a formula', 'Add AI context'],
        }]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenUIAction = (action: string, msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, genUIResult: action } : m));

    const addUser = (text: string) => setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: text }]);
    const runNext = (flow: string) => setTimeout(() => { setProcessing(true); runFlow(flow, setMessages, setPending, setProcessing, setProject); }, 200);

    if (action === 'semantic_gaps_fill') {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: 'Fill with agent →' }]);
      setTimeout(() => { setProcessing(true); runFlow('semantic_gaps_generate', setMessages, setPending, setProcessing, setProject); }, 300);
      return;
    }
    if (action === 'semantic_gaps_apply_descriptions') {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: 'Apply descriptions →' }]);
      setTimeout(() => { setProcessing(true); runFlow('semantic_gaps_apply', setMessages, setPending, setProcessing, setProject); }, 300);
      return;
    }
    if (action === 'semantic_gaps_cancel') { return; }
    if (action === 'cache_miss_configure_action') {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: 'Enable caching →' }]);
      setTimeout(() => { setProcessing(true); runFlow('cache_miss_configure', setMessages, setPending, setProcessing, setProject); }, 300);
      return;
    }
    if (action === 'cache_enable_action') {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: 'Enable cache →' }]);
      setTimeout(() => { setProcessing(true); runFlow('cache_miss_enable', setMessages, setPending, setProcessing, setProject); }, 300);
      return;
    }
    if (action === 'cache_cancel') { return; }
    if (action === 'blast_radius_review') {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: 'Review fix plan →' }]);
      setTimeout(() => { setProcessing(true); runFlow('schema_reconcile_plan', setMessages, setPending, setProcessing, setProject); }, 300);
      return;
    }
    if (action === 'schema_reconcile_heal') {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: 'Apply changes' }]);
      setTimeout(() => { setProcessing(true); runFlow('schema_blast_heal', setMessages, setPending, setProcessing, setProject); }, 300);
      return;
    }
    if (action === 'restore_rollback') { return; }
    if (action === 'drift_resolution_remove') { addUser('Remove both columns from the model.'); runNext('schema_drift_preview'); return; }
    if (action === 'drift_resolution_sync')   { addUser('Apply the column mapping.');          runNext('schema_drift_preview'); return; }
    if (action === 'drift_publish_confirm')   { addUser('Publish the model.');                  runNext('schema_drift_publish'); return; }
    if (action === 'drift_multi_resolution_remove') { addUser('Remove all three columns from both models.'); runNext('schema_drift_multi_preview'); return; }
    if (action === 'drift_multi_resolution_sync')   { addUser('Apply the column mapping across both models.'); runNext('schema_drift_multi_preview'); return; }
    if (action === 'multi_model_drift_repair')  { addUser('Repair both models — remove the deprecated columns.'); runNext('schema_drift_multi_execute'); return; }
    if (action === 'repair_summary_publish')    { addUser('Publish both models.');              runNext('schema_drift_multi_publish'); return; }
    if (action === 'connection_status_apply') {
      addUser('Rotate the token and resync all 3 models.');
      runNext('dbt_connection_apply');
      // 3 steps × 800ms + 200ms initial + ~300ms execution render
      setTimeout(() => onInsightResolved?.('ins-d1'), 3200);
      return;
    }
    if (action === 'null_rate_add_organic')    { addUser('Add an Organic campaign and map the orders.'); runNext('null_rate_add_organic'); return; }
    if (action === 'null_rate_filter_organic') { addUser('Filter organic orders — restore the 2% null rate.'); runNext('null_rate_filter_organic'); return; }
    if (action === 'null_rate_suppress')       { addUser('Mark 18% as expected and suppress the alert.'); runNext('null_rate_suppress'); return; }
    if (action === 'drift_multi_publish_confirm') { addUser('Publish both models.'); runNext('schema_drift_multi_publish'); return; }
    if (action === 'next_issue_dismiss') {
      addUser("I'll handle this later.");
      setTimeout(() => setMessages(prev => [...prev, { id: `r-${Date.now()}`, type: 'response', content: "Noted — it'll stay on the workspace pulse when you're ready." }]), 600);
      return;
    }
    if (action === 'next_issue_view_connection') {
      addUser('Show me the connection.');
      setTimeout(() => setMessages(prev => [...prev, {
        id: `r-${Date.now()}`, type: 'response',
        content: 'The **dbt Cloud** connection last synced successfully on Apr 19 at 11:52 PM. The Apr 20 02:14 AM run failed with:\n\n```\nRuntime Error: Relation "analytics.sales_analytics" does not exist\n```\n\nThis is likely a schema rename or the model was dropped upstream. Check the dbt Cloud run log for the Apr 20 job to confirm, then update the source reference in the model.',
        suggestions: ['Open dbt Cloud run log', 'Check source schema', 'Dismiss this issue'],
      }]), 700);
      return;
    }
  };

  const toggleCollapsible = (msgId: string, stepIdx: number) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.steps) return m;
      return { ...m, steps: m.steps.map((s, i) => i === stepIdx ? { ...s, collapsibleOpen: !s.collapsibleOpen } : s) };
    }));
  };

  // ── Confirm handler (extracted so it can be called from multiple paths) ────

  const handleConfirm = () => {
    if (!pendingAction) return;

    // ── Multi-source special cases ────────────────────────────────────────────
    if (pendingAction.key === 'scan_multi_source') {
      setPending(null);
      setProject(p => ({
        ...p,
        addedTables: [...new Set([...p.addedTables, 'dim_accounts', 'support_cases', 'call_metrics', 'customer_found_defects'])],
        multiSourceCreated: [
          ...(p.multiSourceCreated ?? []),
          { type: 'table' as const, name: 'DIM_ACCOUNTS' },
          { type: 'table' as const, name: 'SUPPORT_CASES' },
          { type: 'table' as const, name: 'CALL_METRICS' },
          { type: 'table' as const, name: 'CUSTOMER_FOUND_DEFECTS' },
        ],
      }));
      setMessages(prev => [...prev, {
        id: `r-${Date.now()}`, type: 'response',
        content: "These 4 tables are set as your core sources. What other data do you want to bring in?",
      }]);
      setMultiSourcePhase('awaiting_sources');
      setProcessing(false);
      return;
    }

    if (pendingAction.key === 'pendo_confirm_column') {
      // User already confirmed "ready to run it" — run directly, no extra gate
      setPending(null);
      setMultiSourcePhase('pendo_running');
      setProcessing(true);
      runFromScratchSteps('execute_pendo_fetch', undefined, setMessages, () => {
        setProject(p => ({
          ...p,
          spotStoreTables: [...(p.spotStoreTables ?? []), 'pendo_nps_enriched'],
          multiSourceCreated: [...(p.multiSourceCreated ?? []), { type: 'spotstore-table' as const, name: 'pendo_nps_enriched' }],
        }));
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response',
            content: "Pendo NPS data is in the Spotstore — positive: 61% · neutral: 24% · negative: 15%.",
            artifactCards: [
              { type: 'notebook' as const, name: 'pendo_nps_ingestion.ipynb', subLabel: 'Python · 5 cells' },
              { type: 'spotstore-table' as const, name: 'pendo_nps_enriched', subLabel: 'Spotstore · 2,847 rows · DQ 92' },
            ],
          }]);
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `r-${Date.now()}`, type: 'response',
              content: "Any other data sources you want to add?",
            }]);
            setMultiSourcePhase('awaiting_csv_prompt');
            setProcessing(false);
          }, 800);
        }, 600);
      }, buildAbortRef);
      return;
    }

    // ─────────────────────────────────────────────────────────────────────────

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
        return 'Calculated columns added to your model.\n\nSQL cells added to Notebook.';
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
          name: script.newName && p.name === 'Untitled Model' ? script.newName : p.name,
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
    select_columns: `Column selection lets you choose which fields from each table to include in your model. This workflow is coming soon — all columns are included for now.`,
    test_model:     `Test mode lets you ask questions against your model and review the AI's reasoning. Switch to the **Test** tab in this panel to get started.`,
    coach:          `Coaching lets you fix a gap found during testing — the agent proposes a fix and writes it to memory. This workflow is coming soon.`,
    publish:        `Publishing is done from the header — click the **Publish** button in the top right when your model is ready.`,
    share:          `Use the **Share** button in the top-right header to invite people or groups and set their access level (Can view or Can edit).`,
  };

  const handleClarifyComplete = (answers: Record<number, string | null>) => {
    setFromScratchPhase('confirm_build'); // hide the clarify card immediately
    const parts = FROM_SCRATCH_QUESTIONS
      .map((q, i) => answers[i] != null ? `${q.question}\n${answers[i]}` : null)
      .filter(Boolean) as string[];
    if (parts.length > 0) {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: parts.join('\n\n') }]);
    }
    setProcessing(true);
    runFromScratchSteps('scratch_generate_plan', undefined, setMessages, () => {
      const plan: PlanData = { ...MOCK_PLAN_BASE, version: 1 };
      setPlanVersion(1);
      setMessages(prev => [...prev, {
        id: `r-${Date.now()}`, type: 'response',
        content: "Here's the plan for your model. Review it — once you're happy, I'll start building.",
        planData: plan,
        planBuildFlow: 'from_scratch' as const,
      }]);
      setFromScratchPhase('plan_ready');
      setProcessing(false);
    }, buildAbortRef);
  };

  const handleStartBuilding = () => {
    setFromScratchPhase('done');
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: 'Start building' }]);
    onBuildStart?.();
    setTimeout(() => {
      runFlow('build_project', setMessages, setPending, setProcessing, setProject, 'Start building', buildAbortRef);
    }, 300);
  };

  const handleEditPlan = () => {
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: 'Edit the plan' }]);
    setFromScratchPhase('plan_editing');
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `r-${Date.now()}`, type: 'response',
        content: "What would you like to change?",
      }]);
    }, 400);
  };

  const runLiveBuildMultiSource = (userText = 'Build the model') => {
    const script = SCRIPTS['ms_build_project'];
    const cols = script.defaultColumns!;

    setMultiSourcePhase('done');
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user' as const, content: userText }]);
    setMessages(prev => [...prev, { id: `pc-${Date.now()}`, type: 'response' as const, content: '', planData: MS_PLAN_DATA, buildPlanCard: true }]);
    onBuildStart?.();

    // Tables appear progressively in workspace
    setProject(p => ({ ...p, buildStep: 'tables', activeTab: 'tables', addedTables: ['dim_accounts'] }));
    setTimeout(() => setProject(p => ({ ...p, addedTables: [...p.addedTables, 'support_cases'] })), 1400);
    setTimeout(() => setProject(p => ({ ...p, addedTables: [...p.addedTables, 'call_metrics'] })), 2800);
    setTimeout(() => setProject(p => ({ ...p, addedTables: [...p.addedTables, 'customer_found_defects'] })), 4200);
    setTimeout(() => setProject(p => ({ ...p, addedTables: [...p.addedTables, 'customer_health_external'] })), 5600);

    // Joins form
    setTimeout(() => setProject(p => ({ ...p, buildStep: 'joined' })), 6500);

    // Columns appear table by table
    setTimeout(() => setProject(p => ({ ...p, activeTab: 'columns', columnsSelected: true, includedColumns: { ...p.includedColumns, dim_accounts: cols.dim_accounts } })), 7500);
    setTimeout(() => setProject(p => ({ ...p, includedColumns: { ...p.includedColumns, support_cases: cols.support_cases } })), 8800);
    setTimeout(() => setProject(p => ({ ...p, includedColumns: { ...p.includedColumns, call_metrics: cols.call_metrics } })), 10000);
    setTimeout(() => setProject(p => ({ ...p, includedColumns: { ...p.includedColumns, customer_found_defects: cols.customer_found_defects } })), 11000);
    setTimeout(() => setProject(p => ({ ...p, includedColumns: { ...p.includedColumns, customer_health_external: cols.customer_health_external } })), 12000);

    // Finalize — set project state + show execution message with model artifact card
    setTimeout(() => {
      setProject(p => ({
        ...p, buildStep: 'healthy',
        name: p.name === 'Untitled Model' ? 'Customer Health Scorecard' : p.name,
        ...(script.contextUpdate ? { context: { ...p.context, ...script.contextUpdate } } : {}),
      }));
      setMessages(prev => [...prev, {
        id: `r-${Date.now()}`, type: 'response' as const,
        content: script.execution,
        modelArtifact: { name: 'Customer Health Scorecard', tableCount: 5, columnCount: 18, metricCount: 1 },
        suggestions: script.executionSuggestions,
      }]);
      setProcessing(false);
    }, 16000);
  };

  const handleMsBuildStart = () => runLiveBuildMultiSource();

  const handlePlanCardClick = (plan: PlanData) => {
    if (onOpenPlan) onOpenPlan(plan);
  };

  const handleFromScratchInput = (input: string) => {
    switch (fromScratchPhase) {
      case 'use_case_prompt': {
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
        setProcessing(true);
        runFromScratchSteps('scratch_parse_use_case', input, setMessages, () => {
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response',
            content: "A couple of quick questions before I start:",
          }]);
          setFromScratchPhase('clarify_q1');
          setProcessing(false);
        }, buildAbortRef);
        break;
      }

      case 'plan_ready':
      case 'plan_editing': {
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
        setProcessing(true);
        setTimeout(() => {
          const newVersion = planVersion + 1;
          const updatedPlan: PlanData = { ...MOCK_PLAN_BASE, version: newVersion };
          setPlanVersion(newVersion);
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response',
            content: `Updated. Here's Plan v${newVersion} with your changes.`,
            planData: updatedPlan,
            planBuildFlow: 'from_scratch' as const,
          }]);
          setFromScratchPhase('plan_ready');
          setProcessing(false);
        }, 1400);
        break;
      }

      case 'confirm_build': {
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
        setFromScratchPhase('done');
        setTimeout(() => {
          runFlow('build_project', setMessages, setPending, setProcessing, setProject, input, buildAbortRef);
        }, 300);
        break;
      }
    }
  };

  // ── Multi-source phase handlers ───────────────────────────────────────────────

  const OBVIOUS_CONFIRM_MS = /^(yes|yeah|yep|yup|ya|yea|sure|ok|okay|cool|great|perfect|sounds good|let'?s go|go ahead|proceed|do it|add it|add them|looks good|correct|confirmed|confirm|apply|absolutely|good to go|that works|makes sense|right)[\s!.,?]*$/i;

  const handleMultiSourceInput = (input: string) => {
    switch (multiSourcePhase) {
      case 'tables_proposed': {
        if (OBVIOUS_CONFIRM_MS.test(input.trim()) || pendingAction?.key === 'scan_multi_source') {
          setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
          handleConfirm();
        }
        break;
      }

      case 'awaiting_sources': {
        // User specifies Pendo + CSV — show notebook consent first, don't auto-create
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
        setMessages(prev => [...prev, {
          id: `r-${Date.now()}`, type: 'response',
          content: "To pull Pendo NPS data I need to create a Python notebook. Should I set it up?",
        }]);
        setMultiSourcePhase('awaiting_notebook_consent');
        break;
      }

      case 'awaiting_notebook_consent': {
        if (OBVIOUS_CONFIRM_MS.test(input.trim()) || /set it up/i.test(input)) {
          setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
          setProcessing(true);
          runFromScratchSteps('create_pendo_notebook', undefined, setMessages, () => {
            setProject(p => ({
              ...p,
              multiSourceCreated: [...(p.multiSourceCreated ?? []), { type: 'notebook' as const, name: 'pendo_nps_ingestion.ipynb' }],
            }));
            setMessages(prev => [...prev, {
              id: `r-${Date.now()}`, type: 'response',
              content: "Notebook created. To run it I need your Pendo Integration Key.",
              artifactCards: [
                { type: 'notebook' as const, name: 'pendo_nps_ingestion.ipynb', subLabel: 'Python · 5 cells' },
              ],
              inlineInput: { type: 'api-key' as const, label: 'Pendo Integration Key', placeholder: 'Enter your key…' },
            }]);
            setMultiSourcePhase('awaiting_api_key');
            setProcessing(false);
          }, buildAbortRef);
        }
        break;
      }

      case 'awaiting_nps_confirm': {
        if (OBVIOUS_CONFIRM_MS.test(input.trim()) || pendingAction?.key === 'pendo_confirm_column') {
          setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
          handleConfirm();
        }
        break;
      }

      case 'awaiting_csv_prompt': {
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
        if (/csv|upload|file|mapping|csm/i.test(input)) {
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response',
            content: "Upload the file and I'll read the schema before writing anything.",
            inlineInput: { type: 'file-upload' as const, label: 'Drop CSV here or click to browse' },
          }]);
          setMultiSourcePhase('awaiting_csv');
        } else {
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response',
            content: "Alright. Tell me when you want to build the model.",
          }]);
          setMultiSourcePhase('awaiting_staging_decision');
        }
        break;
      }

      case 'awaiting_csv_write_consent': {
        if (OBVIOUS_CONFIRM_MS.test(input.trim())) {
          setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
          setMultiSourcePhase('csv_running');
          setProcessing(true);
          runFromScratchSteps('process_csv_upload', undefined, setMessages, () => {
            setProject(p => ({
              ...p,
              spotStoreTables: [...(p.spotStoreTables ?? []), 'csm_account_mapping'],
              multiSourceCreated: [...(p.multiSourceCreated ?? []), { type: 'spotstore-table' as const, name: 'csm_account_mapping' }],
            }));
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: `r-${Date.now()}`, type: 'response',
                content: "`csm_account_mapping` is in the Spotstore — 142 rows, DQ 98.",
                artifactCards: [
                  { type: 'spotstore-table' as const, name: 'csm_account_mapping', subLabel: 'Spotstore · 142 rows · DQ 98' },
                ],
              }]);
              setMultiSourcePhase('awaiting_staging_decision');
              setProcessing(false);
            }, 600);
          }, buildAbortRef);
        }
        break;
      }

      case 'awaiting_staging_decision': {
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
        if (/staging|compile|join|combine|merge|create.*table|build.*table|account.?id/i.test(input) || OBVIOUS_CONFIRM_MS.test(input.trim())) {
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response',
            content: "I'll join `pendo_nps_enriched` and `csm_account_mapping` on `account_id` and write the result to Spotstore as `customer_health_external`. OK to proceed?",
          }]);
          setMultiSourcePhase('awaiting_staging_consent');
        }
        break;
      }

      case 'awaiting_staging_consent': {
        if (OBVIOUS_CONFIRM_MS.test(input.trim())) {
          setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
          setMultiSourcePhase('staging_running');
          setProcessing(true);
          runFromScratchSteps('compile_staging_table', undefined, setMessages, () => {
            setProject(p => ({
              ...p,
              stagingTableId: 'customer_health_external',
              spotStoreTables: [...(p.spotStoreTables ?? []), 'customer_health_external'],
              multiSourceCreated: [...(p.multiSourceCreated ?? []), { type: 'staging-table' as const, name: 'customer_health_external' }],
            }));
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: `r-${Date.now()}`, type: 'response',
                content: "`customer_health_external` is ready — Pendo NPS + CSM mapping joined on `account_id`, 2,847 rows.",
                artifactCards: [
                  { type: 'staging-table' as const, name: 'customer_health_external', subLabel: 'Spotstore · staging · 2,847 rows' },
                ],
              }]);
              setMultiSourcePhase('awaiting_build_initiation');
              setProcessing(false);
            }, 600);
          }, buildAbortRef);
        }
        break;
      }

      case 'awaiting_build_initiation': {
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
        setProcessing(true);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `r-${Date.now()}`, type: 'response',
            content: "The model will use:\n- **DIM_ACCOUNTS, SUPPORT_CASES, CALL_METRICS, CUSTOMER_FOUND_DEFECTS** — Snowflake CDW (federated query)\n- **customer_health_external** — Spotstore staging\n\nReady to build?",
            suggestions: ["Ready. Build the model."],
          }]);
          setMultiSourcePhase('ready_to_build');
          setProcessing(false);
        }, 400);
        break;
      }

      case 'ready_to_build': {
        setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: input }]);
        setProcessing(true);
        const wId = `w-${Date.now()}`;
        setMessages(prev => [...prev, {
          id: wId, type: 'working' as const,
          steps: [
            { label: 'Reviewing data sources', detail: 'Mapping 5 sources across Snowflake CDW and Spotstore.', status: 'running' as const },
            { label: 'Resolving columns and joins', detail: 'Identified 4 joins, 18 columns, and 1 composite health score formula.', status: 'pending' as const },
          ],
          duration: '~3 seconds',
        }]);
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === wId
            ? { ...m, steps: m.steps?.map((s, i) => ({ ...s, status: i === 0 ? 'done' as const : 'running' as const })) }
            : m
          ));
          setTimeout(() => {
            setMessages(prev => prev.map(m => m.id === wId
              ? { ...m, stepsCollapsed: true, steps: m.steps?.map(s => ({ ...s, status: 'done' as const })) }
              : m
            ));
            setTimeout(() => {
              setMessages(prev => [...prev, {
                id: `r-${Date.now()}`, type: 'response' as const,
                content: "Here's the model plan — 5 sources, 4 joins, 18 columns, and a composite health score formula. Review and edit anything before I build.",
                planData: MS_PLAN_DATA,
                planBuildFlow: 'multi_source' as const,
              }]);
              setMultiSourcePhase('awaiting_ms_build');
              setProcessing(false);
            }, 300);
          }, 1200);
        }, 1200);
        break;
      }

      case 'awaiting_ms_build': {
        runLiveBuildMultiSource(input);
        break;
      }

      default:
        break;
    }
  };

  const handleApiKeySubmit = (msgId: string, key: string) => {
    const usedSaved = key === '__saved__';
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, inlineInput: { ...m.inlineInput!, submitted: true, savedCredentials: usedSaved } } : m
    ));
    setProcessing(true);
    setTimeout(() => {
      const action: PendingAction = { key: 'pendo_confirm_column', nextStep: 'empty' };
      setPending(action);
      setMessages(prev => [...prev, {
        id: `r-${Date.now()}`, type: 'response',
        content: "The notebook pulls NPS responses from Pendo and runs sentiment analysis on the comment text. Ready to run it?",
        pendingAction: action,
      }]);
      setMultiSourcePhase('awaiting_nps_confirm');
      setProcessing(false);
    }, 500);
  };

  const handleFileUpload = (msgId: string, file: File) => {
    // Mark the inline input as submitted
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, inlineInput: { ...m.inlineInput!, submitted: true } } : m
    ));
    // Show user message with attachment chip
    setMessages(prev => [...prev, {
      id: `u-${Date.now()}`, type: 'user',
      content: file.name,
      attachment: { type: 'CSV', label: file.name },
    }]);
    // Ask consent before writing to Spotstore (CSV added to Created only after confirmation)
    setMessages(prev => [...prev, {
      id: `r-${Date.now()}`, type: 'response',
      content: `Got it — **142 rows, 4 columns** detected in \`${file.name}\`. I'll write this to your Spotstore as \`csm_account_mapping\`. OK to proceed?`,
      artifactCards: [
        { type: 'csv-dataset' as const, name: file.name, subLabel: 'CSV · 142 rows · 4 columns' },
      ],
      suggestions: ["Yes, write to Spotstore"],
    }]);
    setMultiSourcePhase('awaiting_csv_write_consent');
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
    // Test mode — route to Spotter, skip build agent
    if (agentMode === 'test') {
      handleSpotterQuestion(text);
      return;
    }
    // Multi-source flow — route through dedicated handler, skip normal matchScript
    if (multiSourcePhase && multiSourcePhase !== 'done') {
      handleMultiSourceInput(text);
      return;
    }
    // From-scratch flow — route through dedicated handler, skip normal matchScript
    if (fromScratchPhase && fromScratchPhase !== 'done') {
      handleFromScratchInput(text);
      return;
    }
    setProcessing(true);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: text, attachment }]);

    // 0. Test mode switch — chip or any "switch to test mode" phrasing
    if (/switch to test mode|enter test mode|go to test mode/i.test(text)) {
      setAgentMode('test');
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
          content: `I need at least **2 tables** to identify joins. Right now you only have **${tableName}** in your model.\n\nUse **@** to add another table directly, or describe your use case and I'll search the warehouse for related tables.`,
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

    // 2g. Synonyms for impressions — triggers when impressions is selected and user mentions synonyms/views/visits
    if (
      selectedColumns?.includes('impressions') &&
      /\b(synonym[s]?|view[s]?|visit[s]?|alias|also known)/i.test(text)
    ) {
      runFlow('add_synonyms_impressions', setMessages, setPending, setProcessing, setProject, text);
      return;
    }

    // 2h. Broken column fix routing — catches @campaign_roas / @days_to_convert from canvas selection,
    //     and the "Fix translation issues" chip from the dbt review welcome card.
    if (/fix translation issues/i.test(text) && project.buildStep === 'healthy') {
      runFlow('fix_campaign_roas', setMessages, setPending, setProcessing, setProject, text);
      return;
    }
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

  // ── Spotter (inline test mode) ───────────────────────────────────────────────

  const handleSpotterQuestion = (text: string) => {
    if (!text.trim()) return;
    const userId = `su-${Date.now()}`;
    setMessages(prev => [...prev, { id: userId, type: 'spotter-user', content: text }]);
    const answer = SPOTTER_ANSWERS[text];
    const steps: TestWorkingStep[] = answer?.workingSteps ?? [
      { title: 'Resolved question intent' },
      { title: 'Mapped columns across model' },
      { title: 'Applied joins and computed result', isTiming: true },
    ];
    const aiId = `sa-${Date.now()}`;
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: aiId, type: 'spotter-answer',
        content: answer ? '' : 'Based on your Campaign Performance model, I found relevant results. Try one of the sample questions for a scripted demo answer.',
        answerTitle: answer?.answerTitle,
        answerDesc: answer?.answerDesc,
        spotterChips: answer?.chips,
        chartData: answer?.chartData,
        workingSteps: steps, workingExpanded: true, revealedSteps: 0, answerRevealed: false,
        feedbackState: 'pending',
        sourceQuestion: text,
      }]);
      const STEP_MS = 600;
      steps.forEach((_, s) => {
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, revealedSteps: s + 1 } : m));
        }, (s + 1) * STEP_MS);
      });
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, answerRevealed: true, workingExpanded: false } : m));
      }, steps.length * STEP_MS + 500);
    }, 600);
  };

  const handleSpotterFeedback = (msgId: string, answer: 'correct' | 'incorrect', sourceQuestion: string) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, feedbackState: 'answered' as const, feedbackAnswer: answer } : m
    ));
    if (answer === 'correct') return;
    setCoachingPrompt({ sourceQuestion });
  };

  const handleCoachingSelect = (option: string) => {
    const src = coachingPrompt?.sourceQuestion ?? '';
    setCoachingPrompt(null);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: option }]);
    const resultId = `cr-${Date.now()}`;
    const steps = COACHING_DEBUG_STEPS[option] ?? COACHING_DEBUG_STEPS['Something else'];
    setMessages(prev => [...prev, {
      id: resultId, type: 'coaching-result', content: '',
      debugCategory: option, sourceQuestion: src,
      debugSteps: steps, debugRevealedSteps: 0, debugResultRevealed: false,
    }]);
    steps.forEach((_, idx) => {
      setTimeout(() => {
        setMessages(prev => prev.map(m =>
          m.id === resultId ? { ...m, debugRevealedSteps: idx + 1 } : m
        ));
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setMessages(prev => prev.map(m =>
              m.id === resultId ? { ...m, debugResultRevealed: true, workingExpanded: false } : m
            ));
          }, 500);
        }
      }, (idx + 1) * 700);
    });
  };

  const switchToBuildWithContext = (category: string, sourceQuestion: string) => {
    const scriptKey = COACHING_SCRIPT_MAP[category] ?? 'coaching_something_else';
    const userBubble = sourceQuestion
      ? `I tested "${sourceQuestion}" — ${category.toLowerCase()}.`
      : `Found an issue during testing: ${category.toLowerCase()}.`;
    setAgentMode('build');
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, type: 'user', content: userBubble }]);
    runFlow(scriptKey, setMessages, setPending, setProcessing, setProject, userBubble);
  };

  const buildChartOption = (chartData: NonNullable<AgentMessage['chartData']>) => {
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
    <div style={fullPage
      ? { height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f7f8fa' }
      : { width, flexShrink: 0, borderLeft: 'none', backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column' }
    }>

      {/* fullPage header: ← Overview + centered Agent identity */}
      {fullPage && (
        <div style={{ height: 52, borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', padding: '0 20px', flexShrink: 0, backgroundColor: '#fff' }}>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 5px 6px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: '#555', fontSize: 13, fontWeight: fw.medium, fontFamily: ff.primary }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,4 6,8 10,12"/></svg>
            Overview
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AgentAvatar />
            <span style={{ fontSize: 13, fontWeight: fw.semibold, color: '#1a1a1a' }}>Agent</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ width: 86 }} />
        </div>
      )}

      {/* ── Agent panel ───────────────────────────────────────────────────────── */}
      <>
      <style>{`
        @keyframes ag-spin { to { transform: rotate(360deg); } }
        @keyframes ag-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(39,112,239,0.4); } 50% { box-shadow: 0 0 0 5px rgba(39,112,239,0); } }
        @keyframes ag-step-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fullchat-enter { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .ag-gradient-text {
          background: linear-gradient(to right, #2770ef 4%, #777e8b);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; display: inline-block;
        }
      `}</style>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={() => {
          const el = scrollContainerRef.current;
          if (!el) return;
          isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
        style={{ flex: 1, overflowY: 'auto', ...(fullPage ? { backgroundColor: '#f7f8fa' } : {}) }}
      >
      <div style={{
        padding: fullPage ? '32px 24px' : `${sp.C}px ${sp.D}px`,
        display: 'flex', flexDirection: 'column', gap: sp.D,
        ...(fullPage ? { maxWidth: 740, margin: '0 auto' } : {}),
      }}>

        {messages.length === 0 && !initialPrompt && (
          <div style={{ textAlign: 'center', padding: `${sp.H}px ${sp.D}px` }}>
            <AgentAvatarLarge />
            {project.buildStep === 'healthy' ? (
              <>
                <p style={{ fontSize: fs.sm, color: c['content-secondary'], margin: `${sp.C}px 0 ${sp.F}px`, lineHeight: '20px' }}>
                  What would you like to do with this model today?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                  {['Add AI context to improve Spotter answers', 'Enable query caching for faster results', 'Track how this model is being used'].map(hint => (
                    <button key={hint} onClick={() => promptBarRef.current?.setValue(hint)}
                      style={{ padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 8, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary, textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {messages.map((msg, idx) => {
          const prevMsg = idx > 0 ? messages[idx - 1] : null;
          const isAfterWorking = (msg.type === 'response' || msg.type === 'execution') && prevMsg?.type === 'working';
          const isActivePending = msg.pendingAction != null && msg.pendingAction.key === pendingAction?.key;

          if (msg.buildPlanCard && msg.planData) {
            return (
              <div key={msg.id} style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
                <AgentAvatar />
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                  {project.buildStep === 'healthy'
                    ? <BuiltSummaryCard plan={msg.planData} />
                    : <PlanCardV2 plan={msg.planData} onBuild={handleMsBuildStart} project={project} />
                  }
                </div>
              </div>
            );
          }

          if (msg.planData) {
            const plan = msg.planData;
            const isExpanded = planExpandedId === msg.id;
            const buildHandler = msg.planBuildFlow === 'multi_source' ? handleMsBuildStart : handleStartBuilding;
            return (
              <div key={msg.id} style={{ marginTop: isAfterWorking ? -sp.B : 0, display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
                {!isAfterWorking && <AgentAvatar />}
                {isAfterWorking && <div style={{ width: 28, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0, paddingTop: 2, display: 'flex', flexDirection: 'column', gap: sp.B }}>
                  {msg.content && (
                    <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>{msg.content}</p>
                  )}
                  {/* Inline-expandable plan card */}
                  <div style={{
                    border: `1px solid ${c['border-divider']}`,
                    borderRadius: 10,
                    backgroundColor: c['background-base'],
                    overflow: 'hidden',
                  }}>
                    <button
                      onClick={() => setPlanExpandedId(isExpanded ? null : msg.id)}
                      style={{
                        display: 'flex', alignItems: 'center', width: '100%',
                        padding: `${sp.C}px ${sp.D}px`, gap: sp.C,
                        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const,
                        fontFamily: ff.primary,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '20px' }}>
                          {plan.modelName}
                        </div>
                        {plan.goal && (
                          <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2, lineHeight: '16px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                            {plan.goal}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'],
                        backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`,
                        borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' as const, flexShrink: 0,
                      }}>
                        Draft plan
                      </span>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}>
                        <polyline points="2,4 6,8 10,4" />
                      </svg>
                    </button>
                    {isExpanded && (
                      <div style={{ height: '68vh', borderTop: `1px solid ${c['border-divider']}`, display: 'flex', flexDirection: 'column' }}>
                        <PlanPanelV3
                          plan={plan}
                          onClose={() => setPlanExpandedId(null)}
                          onBuildModel={buildHandler}
                          hideClose
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // ── Spotter user question ────────────────────────────────────────────
          if (msg.type === 'spotter-user') {
            return (
              <div key={msg.id} style={{ backgroundColor: c['background-sunken'], borderRadius: 12, padding: `${sp.C}px ${sp.D}px` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.B }}>
                  <UserAvatar />
                </div>
                <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>{msg.content}</p>
              </div>
            );
          }

          // ── Spotter answer ───────────────────────────────────────────────────
          if (msg.type === 'spotter-answer') {
            const totalSteps = msg.workingSteps?.length ?? 0;
            const revealed = msg.revealedSteps ?? totalSteps;
            const isAnimating = msg.revealedSteps !== undefined && (revealed < totalSteps || !msg.answerRevealed);
            const visibleSteps = msg.workingSteps?.slice(0, revealed) ?? [];
            return (
              <div key={msg.id}>
                {/* Working steps */}
                {visibleSteps.length > 0 && (
                  <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
                    <AgentAvatar working={isAnimating} />
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                      {!isAnimating && (
                        <button
                          onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, workingExpanded: !m.workingExpanded } : m))}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: ff.primary, marginBottom: msg.workingExpanded ? sp.C : 0 }}
                        >
                          <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontWeight: fw.medium }}>Show work</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: msg.workingExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}><polyline points="2,4 6,8 10,4" /></svg>
                        </button>
                      )}
                      {(isAnimating || msg.workingExpanded) && (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {visibleSteps.map((step, si) => {
                            const stepRunning = isAnimating && si === visibleSteps.length - 1;
                            const stepDone = !stepRunning;
                            return (
                              <div key={si} style={{ display: 'flex', gap: 12, animation: 'ag-step-in 0.22s ease' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
                                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c['content-secondary'], opacity: stepRunning ? 1 : 0.4, flexShrink: 0, marginTop: 5 }} />
                                  {si < visibleSteps.length - 1 && (
                                    <div style={{ flex: 1, width: 1, minHeight: 10, marginTop: 3, backgroundColor: c['border-default'] }} />
                                  )}
                                </div>
                                <div style={{ flex: 1, paddingBottom: si < visibleSteps.length - 1 ? sp.D : 0 }}>
                                  <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, lineHeight: '20px', color: c['content-primary'] }}>
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
                {/* Answer card */}
                {msg.answerRevealed !== false && (
                  <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start', marginTop: visibleSteps.length > 0 ? -sp.B : 0 }}>
                    <div style={{ width: 24, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                      {msg.answerTitle && <p style={{ margin: `0 0 ${sp.A}px`, fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '20px', animation: 'ag-step-in 0.3s ease-out' }}>{msg.answerTitle}</p>}
                      {msg.answerDesc && <p style={{ margin: `0 0 ${sp.C}px`, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>{msg.answerDesc}</p>}
                      {msg.content && <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px', animation: 'ag-step-in 0.3s ease-out' }}><TFormattedMsg content={msg.content} /></p>}
                      {(msg.spotterChips || msg.chartData) && (
                        <div style={{ marginTop: sp.C, border: `1px solid ${c['border-divider']}`, borderRadius: 10, overflow: 'hidden', backgroundColor: c['background-base'], animation: 'ag-step-in 0.35s ease-out' }}>
                          {msg.spotterChips && (
                            <div style={{ padding: `${sp.C}px ${sp.C}px 0` }}>
                              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: sp.B }}>
                                {msg.spotterChips.map((chip, ci) => (
                                  <span key={ci} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px 3px 7px', borderRadius: 4, fontSize: 12, fontWeight: fw.medium, backgroundColor: '#EAEDF2', color: '#1D232F', whiteSpace: 'nowrap' }}>
                                    {chip.type === 'measure' && <span style={{ fontSize: 10, color: '#4A7FE5', fontWeight: fw.semibold }}>#</span>}
                                    {chip.type === 'filter' && <svg width="10" height="10" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}><path d="M1.5 3H16.5L10.5 10.065V14.5L7.5 16V10.065L1.5 3Z" stroke="#4A7FE5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    {chip.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {msg.chartData && (
                            <ReactECharts option={buildChartOption(msg.chartData)} style={{ height: 200, width: '100%' }} opts={{ renderer: 'svg' }} />
                          )}
                        </div>
                      )}
                      {/* Feedback row */}
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: 6 }}>
                        {msg.feedbackState === 'pending' && (<>
                          <button onClick={() => handleSpotterFeedback(msg.id, 'correct', msg.sourceQuestion ?? '')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: `1px solid ${c['border-default']}`, borderRadius: 6, background: 'none', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], cursor: 'pointer', fontFamily: ff.primary }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#15803D'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.color = c['content-secondary']; }}
                          >✓ Looks right</button>
                          <button onClick={() => handleSpotterFeedback(msg.id, 'incorrect', msg.sourceQuestion ?? '')}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', marginLeft: sp.A, border: `1px solid ${c['border-default']}`, borderRadius: 6, background: 'none', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], cursor: 'pointer', fontFamily: ff.primary }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#B91C1C'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.color = c['content-secondary']; }}
                          >✗ Something's off</button>
                        </>)}
                        {msg.feedbackState === 'answered' && msg.feedbackAnswer === 'correct' && (
                          <span style={{ fontSize: fs.xs, color: '#15803D' }}>✓ Looks right</span>
                        )}
                        {msg.feedbackState === 'answered' && msg.feedbackAnswer === 'incorrect' && (
                          <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>✗ Flagged</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          }


          // ── Coaching result (debug steps + fix button) ───────────────────────
          if (msg.type === 'coaching-result') {
            const dbSteps = msg.debugSteps ?? [];
            const dbRevealed = msg.debugRevealedSteps ?? 0;
            const dbAnimating = dbRevealed < dbSteps.length;
            const dbVisibleSteps = dbSteps.slice(0, dbRevealed);
            const dbResult = COACHING_DEBUG_RESULTS[msg.debugCategory ?? ''] ?? COACHING_DEBUG_RESULTS['Something else'];
            return (
              <div key={msg.id}>
                {dbVisibleSteps.length > 0 && (
                  <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
                    <AgentAvatar working={dbAnimating} />
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                      {!dbAnimating && (
                        <button
                          onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, workingExpanded: !m.workingExpanded } : m))}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: ff.primary, marginBottom: msg.workingExpanded ? sp.C : 0 }}
                        >
                          <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontWeight: fw.medium }}>Show work</span>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: msg.workingExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}><polyline points="2,4 6,8 10,4" /></svg>
                        </button>
                      )}
                      {(dbAnimating || msg.workingExpanded) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {dbVisibleSteps.map((step, si) => {
                          const stepRunning = dbAnimating && si === dbVisibleSteps.length - 1;
                          const stepDone = !stepRunning;
                          return (
                            <div key={si} style={{ display: 'flex', gap: 12, animation: 'ag-step-in 0.22s ease' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c['content-secondary'], opacity: stepRunning ? 1 : 0.4, flexShrink: 0, marginTop: 5 }} />
                                {si < dbVisibleSteps.length - 1 && (
                                  <div style={{ flex: 1, width: 1, minHeight: 10, marginTop: 3, backgroundColor: c['border-default'] }} />
                                )}
                              </div>
                              <div style={{ flex: 1, paddingBottom: si < dbVisibleSteps.length - 1 ? sp.D : 0 }}>
                                <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, lineHeight: '20px', color: c['content-primary'] }}>
                                  {step.label}
                                </span>
                                {step.detail && (
                                  <p style={{ margin: '2px 0 0', fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }}>
                                    <TTypewriter text={step.detail} active={stepRunning} />
                                  </p>
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
                {msg.debugResultRevealed && (
                  <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start', marginTop: dbVisibleSteps.length > 0 ? sp.B : 0, animation: 'ag-step-in 0.3s ease-out' }}>
                    <div style={{ width: 24, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: `0 0 ${sp.C}px`, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>{dbResult}</p>
                      <button
                        onClick={() => switchToBuildWithContext(msg.debugCategory ?? 'Something else', msg.sourceQuestion ?? '')}
                        style={{ padding: `${sp.B}px ${sp.C}px`, border: 'none', borderRadius: 8, background: '#2770ef', fontSize: fs.xs, fontWeight: fw.medium, color: '#fff', cursor: 'pointer', fontFamily: ff.primary }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1E5FD8')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2770ef')}
                      >Fix this</button>
                    </div>
                  </div>
                )}
              </div>
            );
          }

          return (
            <div key={msg.id} style={{ marginTop: isAfterWorking ? -sp.B : 0 }}>
              <MessageBubble
                msg={msg}
                showAvatar={!isAfterWorking}
                onToggleSteps={id => setMessages(prev => prev.map(m => m.id === id ? { ...m, stepsCollapsed: !m.stepsCollapsed } : m))}
                onToggleCollapsible={toggleCollapsible}
                onSuggestion={text => processText(text)}
                onConfirm={isActivePending ? handleConfirm : undefined}
                onOpenQualityPlan={onOpenQualityPlan}
                onChipClick={text => processText(text)}
                onGenUIAction={handleGenUIAction}
                onOpenObject={onOpenObject}
                publishedVersion={project.publishedVersion}
                onApiKeySubmit={handleApiKeySubmit}
                onFileUpload={handleFileUpload}
                onArtifactClick={onOpenMsItem}
                onComplete={msg.genUI === 'drift_complete' ? () => {
                  onInsightResolved?.('ins-d2');
                  setTimeout(() => {
                    setMessages(prev => {
                      if (prev.some(m => m.genUI === 'next_issue')) return prev;
                      return [...prev, {
                        id: `r-next-${Date.now()}`,
                        type: 'response',
                        content: 'There\'s still one more debugging issue open in your workspace — want to tackle it now?',
                        genUI: 'next_issue',
                      }];
                    });
                  }, 1400);
                } : msg.genUI === 'restore_point' ? () => {
                  onInsightResolved?.('ins-d3');
                } : msg.genUI === 'drift_multi_complete' ? () => {
                  onInsightResolved?.('ins-d3');
                } : undefined}
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      </div>

      {/* Clarify card — floats above prompt bar during from-scratch clarify phase */}
      {fromScratchPhase === 'clarify_q1' && (
        <div style={{ padding: `0 ${sp.C}px`, flexShrink: 0 }}>
          <DayClarifyCard questions={FROM_SCRATCH_QUESTIONS} onComplete={handleClarifyComplete} />
        </div>
      )}

      {/* Coaching clarify card — floats above prompt bar when user flags a Spotter answer */}
      {coachingPrompt && (
        <div style={{ padding: `0 ${sp.C}px`, flexShrink: 0 }}>
          <CoachingClarifyCard onSelect={handleCoachingSelect} />
        </div>
      )}

      {/* Test mode — sample questions accordion */}
      {agentMode === 'test' && (() => {
        const groupSize = 4;
        const groupCount = Math.ceil(DEMO_QUESTION_POOL.length / groupSize);
        const groupIndex = sampleQOffset % groupCount;
        const currentQuestions = DEMO_QUESTION_POOL.slice(groupIndex * groupSize, groupIndex * groupSize + groupSize);
        return (
          <div style={{ padding: `0 ${sp.C}px`, flexShrink: 0 }}>
            {/* Shadow wrapper lifts the expanded block off the background */}
            <div style={sampleQOpen ? { borderRadius: 10, boxShadow: shadows.sm } : {}}>
            {/* Expanded question rows — above the header strip */}
            {sampleQOpen && (
              <div style={{ border: `1px solid ${c['border-divider']}`, borderBottom: 'none', borderRadius: '10px 10px 0 0', overflow: 'hidden' }}>
                {currentQuestions.map((q, idx) => (
                  <div key={q}
                    onClick={() => { promptBarRef.current?.setValue(q); setSampleQOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, borderBottom: idx === currentQuestions.length - 1 ? 'none' : `1px solid ${c['border-divider']}`, backgroundColor: c['background-subtle'], cursor: 'pointer', transition: 'background-color 0.1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = c['background-sunken']; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = c['background-subtle']; }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: fw.medium, fontFamily: ff.mono, color: c['content-secondary'] }}>
                      {idx + 1}
                    </div>
                    <span style={{ flex: 1, fontSize: fs.sm, color: c['content-primary'], fontFamily: ff.primary }}>{q}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Strip header */}
            <div
              onClick={() => setSampleQOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-divider']}`, borderRadius: sampleQOpen ? '0 0 10px 10px' : 10, cursor: 'pointer', backgroundColor: c['background-subtle'], userSelect: 'none' as const, transition: 'background-color 0.1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = c['background-sunken']; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = c['background-subtle']; }}
            >
              <span style={{ flex: 1, fontSize: fs.sm, fontWeight: fw.medium, color: c['content-secondary'], fontFamily: ff.primary }}>Sample questions</span>
              {sampleQOpen && (
                <button
                  onClick={e => { e.stopPropagation(); setSampleQOffset(o => o + 1); }}
                  title="Refresh questions"
                  style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 4, color: c['content-secondary'], padding: 0, flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.color = c['content-primary']; }}
                  onMouseLeave={e => { e.currentTarget.style.color = c['content-secondary']; }}
                >
                  <Icon name="refresh" size="s" />
                </button>
              )}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: sampleQOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                <polyline points="2,4 6,8 10,4" />
              </svg>
            </div>
            </div>{/* end shadow wrapper */}
          </div>
        );
      })()}

      {/* Prompt bar */}
      <div style={{
        padding: fullPage ? `${sp.B}px 24px ${sp.C}px` : `${sp.B}px ${sp.C}px ${sp.C}px`,
        borderTop: 'none',
        flexShrink: 0,
        ...(fullPage ? { backgroundColor: '#fff' } : {}),
      }}>
      <div style={fullPage ? { maxWidth: 740, margin: '0 auto' } : {}}>
        <PromptBar
          ref={promptBarRef}
          onSubmit={(text, tables) => processText(text, tables)}
          disabled={(isProcessing && project.buildStep !== 'empty') || fromScratchPhase === 'clarify_q1' || !!coachingPrompt}
          isProcessing={isProcessing}
          onStop={() => {
            buildAbortRef.current = true;
            setProcessing(false);
            setMessages(prev => [...prev, { id: `r-${Date.now()}`, type: 'response', content: "Stopped. What would you like to change?" }]);
          }}
          placeholder={agentMode === 'test' ? "Ask anything about your model…" : fromScratchPhase === 'plan_ready' ? "Ask me to change anything in the plan…" : "Describe a task, or '@' to mention tables."}
          autoFocus
          dropDirection="up"
          onColumnRemove={onColumnRemove}
          leftSlot={
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
              <ConnectionPill connections={CONNECTIONS} value={connFilter} onChange={setConnFilter} dropDirection="up" />
              <div style={{ display: 'flex', padding: 2, background: c['background-subtle'], border: `1px solid ${c['border-default']}`, borderRadius: 20, gap: 2, flexShrink: 0 }}>
              {(['build', 'test'] as const).map(m => {
                const isActive = agentMode === m;
                const canSwitch = m === 'build' || project.buildStep !== 'empty';
                return (
                  <button
                    key={m}
                    onClick={() => canSwitch && setAgentMode(m)}
                    title={m === 'build' ? 'Build mode' : project.buildStep === 'empty' ? 'Test mode (available after model is built)' : 'Test mode'}
                    style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? c['background-base'] : 'transparent', border: isActive ? `1px solid ${c['border-default']}` : '1px solid transparent', borderRadius: '50%', cursor: canSwitch ? 'pointer' : 'default', boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.12s', opacity: canSwitch ? 1 : 0.35 }}
                  >
                    {m === 'build' ? (
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="1" y="8" width="2.5" height="4" rx="0.8" fill={isActive ? '#2770EF' : c['content-tertiary']}/>
                        <rect x="5.25" y="5" width="2.5" height="7" rx="0.8" fill={isActive ? '#2770EF' : c['content-tertiary']}/>
                        <rect x="9.5" y="1" width="2.5" height="11" rx="0.8" fill={isActive ? '#2770EF' : c['content-tertiary']}/>
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M4.5 1.5h4M6.5 1.5v5l3 5.5a.9.9 0 01-.8 1.3H4.3a.9.9 0 01-.8-1.3l3-5.5V1.5z" stroke={isActive ? '#7C3AED' : c['content-tertiary']} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                );
              })}
              </div>
            </div>
          }
        />
      </div>

      </div>

      {/* Disclaimer */}
      <p style={{ textAlign: 'center', fontSize: 11, color: c['content-secondary'], padding: `${sp.A}px ${sp.D}px ${sp.B}px`, margin: 0, lineHeight: '16px' }}>
        Spotter responses should be reviewed. <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Learn more</span>
      </p>
      </>


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

// ── QualityPlanCard — quality plan artifact shown in chat ─────────────────────

const QualityPlanCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    onClick={onClick}
    style={{
      border: `1px solid ${c['border-default']}`,
      borderRadius: 10,
      backgroundColor: c['background-base'],
      cursor: 'pointer',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
      maxWidth: 460,
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = c['content-brand'])}
    onMouseLeave={e => (e.currentTarget.style.borderColor = c['border-default'])}
  >
    {/* Header */}
    <div style={{ padding: `${sp.C}px ${sp.D}px ${sp.B}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={c['content-secondary']} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2L14 14H2L8 2z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12.5" r="0.5" fill={c['content-secondary']}/>
        </svg>
        <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>Data Quality Plan</span>
      </div>
      <span style={{ fontSize: fs.xs, color: c['content-brand'], fontWeight: fw.medium, flexShrink: 0 }}>View plan →</span>
    </div>
    {/* Summary */}
    <div style={{ padding: `0 ${sp.D}px ${sp.C}px` }}>
      <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }}>
        Found 9 issues across 3 tables — null values, duplicate rows, date format inconsistencies, and anomalous amounts.
      </p>
    </div>
    {/* Stats */}
    <div style={{ padding: `${sp.B}px ${sp.D}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', gap: sp.D }}>
      {['9 issues', '4 high', '4 medium', '1 low'].map(stat => (
        <span key={stat} style={{ fontSize: 11, color: c['content-secondary'], fontWeight: fw.medium }}>{stat}</span>
      ))}
    </div>
  </div>
);

// ── Outcome card ──────────────────────────────────────────────────────────────

const OutcomeCard: React.FC<{ card: { title: string; chips: string[]; errorChips?: string[]; note: string } }> = ({ card }) => (
  <div style={{
    padding: `${sp.C}px ${sp.D}px`,
    border: `1px solid ${c['border-divider']}`,
    borderRadius: 8,
    backgroundColor: c['background-base'],
  }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: sp.B }}>
      <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '20px', flex: 1 }}>
        {card.title}
      </span>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={c['content-tertiary'] ?? c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.7 }}>
        <line x1="3" y1="13" x2="13" y2="3"/><polyline points="6,3 13,3 13,10"/>
      </svg>
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

// ── ModelArtifactCard — created model object shown in chat after build ────────

const ModelArtifactCard: React.FC<{
  artifact: NonNullable<AgentMessage['modelArtifact']>;
  onClick: () => void;
}> = ({ artifact, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? c['content-brand'] : c['border-default']}`,
        borderRadius: 10,
        backgroundColor: c['background-base'],
        overflow: 'hidden',
        maxWidth: 340,
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hovered ? '0 2px 12px rgba(39,112,239,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ padding: `${sp.C}px ${sp.D}px`, display: 'flex', alignItems: 'center', gap: sp.B }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, rgba(39,112,239,0.13) 0%, rgba(99,102,241,0.10) 100%)',
          border: '1px solid rgba(39,112,239,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1.5" y="3.5" width="12" height="8" rx="1.5" stroke={c['content-brand']} strokeWidth="1.25"/>
            <path d="M1.5 6h12" stroke={c['content-brand']} strokeWidth="1.25"/>
            <path d="M4.5 9h4" stroke={c['content-brand']} strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {artifact.name}
          </div>
          <div style={{ fontSize: 10, color: c['content-secondary'], marginTop: 2 }}>Semantic model</div>
        </div>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0, color: hovered ? c['content-brand'] : c['content-secondary'], transition: 'color 0.15s' }}>
          <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{
        padding: `${sp.B}px ${sp.D}px`,
        borderTop: `1px solid ${c['border-divider']}`,
        display: 'flex', gap: sp.C, alignItems: 'center',
        backgroundColor: c['background-sunken'],
      }}>
        {[
          { label: 'sources', value: artifact.tableCount },
          { label: 'columns', value: artifact.columnCount },
          { label: 'metrics', value: artifact.metricCount },
        ].map((stat, i) => (
          <React.Fragment key={stat.label}>
            {i > 0 && <span style={{ fontSize: 10, color: c['border-default'] }}>·</span>}
            <span style={{ fontSize: 10, color: c['content-secondary'] }}>
              <span style={{ fontWeight: fw.semibold, color: c['content-primary'] }}>{stat.value}</span>
              {' '}{stat.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// ── PlanCardV2 — live build tracker shown in chat during model build ──────────
// No DQ pause — DQ was completed during scan + upload before reaching this stage.

const PlanCardV2: React.FC<{
  plan: PlanData;
  onBuild: () => void;
  project: ProjectState;
}> = ({ plan, onBuild, project }) => {
  const [name, setName]               = React.useState(plan.modelName);
  const [editingName, setEditingName] = React.useState(false);

  const steps = plan.planSteps ?? [];

  const completedCount = (() => {
    if (project.buildStep === 'healthy') return steps.length;
    if (Object.keys(project.includedColumns).length >= 4) return 4;
    if (Object.keys(project.includedColumns).length >= 2) return 3;
    if (Object.keys(project.includedColumns).length >= 1) return 2;
    if (project.buildStep === 'joined' || project.addedTables.length >= 5) return 1;
    return 0;
  })();

  const buildState: 'idle' | 'building' | 'done' =
    project.buildStep === 'empty' ? 'idle' :
    project.buildStep === 'healthy' ? 'done' : 'building';

  return (
    <>
      <style>{`@keyframes plan-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{
        border: `1px solid ${c['border-default']}`,
        borderRadius: 14,
        backgroundColor: c['background-base'],
        width: '100%', maxWidth: 520,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.07)',
        overflow: 'hidden', fontFamily: ff.primary,
      }}>
        {/* Title + goal */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ marginBottom: 7 }}>
            {editingName ? (
              <input
                autoFocus value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => setEditingName(false)}
                onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
                style={{ fontSize: 19, fontWeight: fw.semibold, color: c['content-primary'], background: 'none', border: 'none', outline: 'none', width: '100%', borderBottom: `2px solid ${c['content-brand']}`, fontFamily: ff.primary, padding: '0 2px', lineHeight: 1.2 }}
              />
            ) : (
              <span
                onClick={() => buildState === 'idle' && setEditingName(true)}
                title={buildState === 'idle' ? 'Click to rename' : undefined}
                style={{ fontSize: 19, fontWeight: fw.semibold, color: c['content-primary'], cursor: buildState === 'idle' ? 'text' : 'default', display: 'block', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >{name}</span>
            )}
          </div>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: c['content-secondary'], lineHeight: '19px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {plan.goal}
          </p>
        </div>

        {/* Build plan checklist */}
        <div style={{ padding: '16px 20px 18px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ margin: '0 0 13px', fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Build plan
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {steps.map((step, i) => {
              const done   = i < completedCount;
              const active = buildState === 'building' && i === completedCount;
              return (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, width: 18, height: 18, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done ? (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: c['content-brand'], display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    ) : active ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: 'plan-spin 0.9s linear infinite' }}>
                        <circle cx="9" cy="9" r="7.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2"/>
                        <path d="M9 1.5 A7.5 7.5 0 0 1 16.5 9" fill="none" stroke={c['content-brand']} strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px solid rgba(0,0,0,0.15)' }}/>
                    )}
                  </div>
                  <div style={{ flex: 1, opacity: done ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
                    <div style={{ fontSize: 13, fontWeight: fw.medium, lineHeight: '18px', color: c['content-primary'] }}>{step.title}</div>
                    <div style={{ fontSize: 12, lineHeight: '17px', marginTop: 2, color: c['content-secondary'] }}>{step.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        {buildState !== 'done' && (
          <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            {buildState === 'idle' ? (
              <button
                onClick={onBuild}
                style={{ height: 34, paddingLeft: 14, paddingRight: 14, border: `1px solid ${c['border-default']}`, borderRadius: 8, backgroundColor: 'transparent', color: c['content-primary'], fontSize: 13, fontWeight: fw.medium, fontFamily: ff.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                Start building
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7h9M8.5 3.5l3.5 3.5-3.5 3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, color: c['content-secondary'], fontSize: 12 }}>
                <svg width="13" height="13" viewBox="0 0 18 18" style={{ animation: 'plan-spin 0.9s linear infinite', flexShrink: 0 }}>
                  <circle cx="9" cy="9" r="7.5" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2"/>
                  <path d="M9 1.5 A7.5 7.5 0 0 1 16.5 9" fill="none" stroke={c['content-brand']} strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Building model…
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// ── BuiltSummaryCard — condensed post-build summary shown in chat ─────────────

const fmtCol = (name: string) => name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const BuiltSummaryCard: React.FC<{ plan: PlanData }> = ({ plan }) => {
  const [expanded, setExpanded] = React.useState(false);

  const formulas   = plan.columns.filter(col => col.type === 'formula');
  const topMetrics = plan.columns.filter(col => col.type === 'metric' && col.included).slice(0, 2);
  const keyDims    = plan.columns.filter(col => col.type === 'dimension' && col.included && !col.name.endsWith('_id') && !col.name.endsWith('_date')).slice(0, 4);
  const questions  = plan.sampleQuestions.slice(0, 3);
  const steps      = plan.planSteps ?? [];
  const metricChips = [...formulas.map(f => fmtCol(f.name)), ...topMetrics.map(m => fmtCol(m.name))];
  const dimChips    = keyDims.map(d => fmtCol(d.name));

  return (
    <div style={{ border: `1px solid ${c['border-default']}`, borderRadius: 12, backgroundColor: c['background-base'], overflow: 'hidden', maxWidth: 520, fontFamily: ff.primary, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div
        onClick={() => setExpanded(o => !o)}
        style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderBottom: expanded ? `1px solid ${c['border-divider']}` : 'none', userSelect: 'none' as const }}
      >
        <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, backgroundColor: 'rgba(22,163,74,0.1)', border: '1.5px solid #16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.2 2.2 3.8-3.8" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{plan.modelName}</div>
          <div style={{ fontSize: 11, color: c['content-secondary'], marginTop: 1 }}>Model requirement · {steps.length} steps completed</div>
        </div>
        <span style={{ fontSize: 11, color: c['content-brand'], fontWeight: fw.medium, flexShrink: 0 }}>{expanded ? 'Collapse' : 'View details'}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s', flexShrink: 0 }}>
          <polyline points="2,4 6,8 10,4"/>
        </svg>
      </div>
      {expanded && (
        <>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c['border-divider']}` }}>
            <div style={{ fontSize: 10, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10 }}>Model requirement</div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 5 }}>Questions to answer</div>
              {questions.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, fontSize: fs.xs, color: c['content-primary'], lineHeight: '18px', marginBottom: 2 }}>
                  <span style={{ color: c['content-secondary'], flexShrink: 0 }}>·</span><span>{q}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 6 }}>Outputs needed</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                {metricChips.map(chip => (
                  <span key={chip} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, backgroundColor: 'rgba(39,112,239,0.08)', color: c['content-brand'], fontWeight: fw.medium }}>{chip}</span>
                ))}
                {dimChips.map(chip => (
                  <span key={chip} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, backgroundColor: c['background-subtle'], color: c['content-secondary'], border: `1px solid ${c['border-default']}` }}>{chip}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10 }}>Build plan</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, backgroundColor: 'rgba(22,163,74,0.1)', border: '1.5px solid #16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l1.8 1.8L6.5 2" stroke="#16A34A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

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


// ── From-scratch clarify card ─────────────────────────────────────────────────

const FROM_SCRATCH_QUESTIONS = [
  { question: 'Who is the primary audience for this model?', options: ['Executive / board', 'Marketing managers', 'Data analysts', 'Engineers'] },
  { question: 'What is the data domain?', options: ['Marketing', 'Finance', 'Sales', 'Operations'] },
];

const navBtnStyleDZ = (disabled: boolean): React.CSSProperties => ({
  width: 22, height: 22, border: 'none', background: 'transparent', cursor: disabled ? 'default' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, padding: 0,
  color: disabled ? c['border-default'] : c['content-secondary'],
  flexShrink: 0,
});

const DayClarifyCard: React.FC<{
  questions: { question: string; options: string[] }[];
  onComplete: (answers: Record<number, string | null>) => void;
}> = ({ questions, onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [customExpanded, setCustomExpanded] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCustomExpanded(false); setCustomValue(''); }, [step]);
  useEffect(() => { if (customExpanded) setTimeout(() => customInputRef.current?.focus(), 50); }, [customExpanded]);

  const advance = (newAnswers: Record<number, string | null>) => {
    if (step < questions.length - 1) { setStep(s => s + 1); }
    else { onComplete(newAnswers); }
  };

  const handleSelect = (answer: string) => {
    const updated = { ...answers, [step]: answer };
    setAnswers(updated);
    advance(updated);
  };

  const handleSkip = () => {
    const updated = { ...answers, [step]: null };
    setAnswers(updated);
    advance(updated);
  };

  const handleCustomSubmit = () => {
    const v = customValue.trim();
    if (!v) return;
    handleSelect(v);
  };

  const canGoBack = step > 0;
  const canGoNext = step < questions.length - 1 && answers[step] !== undefined;
  const q = questions[step];
  const currentAnswer = answers[step];

  return (
    <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 12, backgroundColor: c['background-base'], marginBottom: sp.C, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: `${sp.D}px ${sp.D}px ${sp.C}px` }}>
        <p style={{ margin: 0, fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '24px', flex: 1, paddingRight: sp.D }}>
          {q.question}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, paddingTop: 2 }}>
          <button style={navBtnStyleDZ(!canGoBack)} onClick={() => canGoBack && setStep(s => s - 1)} title="Previous">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="10,4 6,8 10,12"/></svg>
          </button>
          <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary, minWidth: 36, textAlign: 'center' }}>
            {step + 1} of {questions.length}
          </span>
          <button style={navBtnStyleDZ(!canGoNext)} onClick={() => canGoNext && setStep(s => s + 1)} title="Next">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6,4 10,8 6,12"/></svg>
          </button>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${c['border-divider']}` }}>
        {q.options.map((opt, idx) => {
          const isSelected = currentAnswer === opt;
          const isLast = idx === q.options.length - 1;
          return (
            <div key={opt} onClick={() => handleSelect(opt)}
              style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, borderBottom: isLast ? 'none' : `1px solid ${c['border-divider']}`, backgroundColor: isSelected ? c['background-subtle'] : c['background-base'], cursor: 'pointer', transition: 'background-color 0.1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = c['background-subtle']; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isSelected ? c['background-subtle'] : c['background-base']; }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, backgroundColor: isSelected ? '#EFF6FF' : c['background-subtle'], border: `1px solid ${isSelected ? '#BFDBFE' : c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: fw.medium, fontFamily: ff.mono, color: isSelected ? c['content-brand'] : c['content-secondary'] }}>
                {idx + 1}
              </div>
              <span style={{ flex: 1, fontSize: fs.sm, color: c['content-primary'], fontFamily: ff.primary }}>{opt}</span>
            </div>
          );
        })}

        <div style={{ borderTop: `1px solid ${c['border-divider']}` }}>
          {!customExpanded ? (
            <div onClick={() => setCustomExpanded(true)}
              style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, cursor: 'pointer', backgroundColor: c['background-base'], transition: 'background-color 0.1s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = c['background-subtle']; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = c['background-base']; }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke={c['content-tertiary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 1.5L12.5 4.5L4.5 12.5H1.5V9.5L9.5 1.5Z"/></svg>
              </div>
              <span style={{ flex: 1, fontSize: fs.sm, color: c['content-tertiary'], fontFamily: ff.primary }}>Something else</span>
              <button onClick={e => { e.stopPropagation(); handleSkip(); }}
                style={{ height: 26, padding: `0 ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', fontSize: fs.xs, fontFamily: ff.primary, color: c['content-secondary'], flexShrink: 0 }}>
                Skip
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.B}px ${sp.D}px` }}>
              <input ref={customInputRef} value={customValue} onChange={e => setCustomValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit(); if (e.key === 'Escape') { setCustomExpanded(false); setCustomValue(''); } }}
                placeholder="Describe in your own words…"
                style={{ flex: 1, height: 32, padding: `0 ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, fontSize: fs.sm, fontFamily: ff.primary, color: c['content-primary'], backgroundColor: c['background-base'], outline: `2px solid ${c['content-brand']}`, outlineOffset: -1, boxSizing: 'border-box' }}
              />
              <button onClick={handleCustomSubmit} disabled={!customValue.trim()}
                style={{ height: 32, padding: `0 ${sp.C}px`, border: 'none', borderRadius: 6, backgroundColor: customValue.trim() ? c['content-brand'] : c['background-subtle'], color: customValue.trim() ? 'white' : c['content-tertiary'], cursor: customValue.trim() ? 'pointer' : 'default', fontSize: fs.xs, fontFamily: ff.primary, fontWeight: fw.medium, flexShrink: 0, transition: 'all 0.15s' }}>
                Submit
              </button>
              <button onClick={handleSkip}
                style={{ height: 32, padding: `0 ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', fontSize: fs.xs, fontFamily: ff.primary, color: c['content-secondary'], flexShrink: 0 }}>
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── CoachingClarifyCard — floats above prompt bar when user flags an answer ──

const CoachingClarifyCard: React.FC<{ onSelect: (option: string) => void }> = ({ onSelect }) => (
  <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 12, backgroundColor: c['background-base'], marginBottom: sp.C, overflow: 'hidden' }}>
    <div style={{ padding: `${sp.D}px ${sp.D}px ${sp.C}px` }}>
      <p style={{ margin: 0, fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '24px' }}>
        What went wrong with this answer?
      </p>
    </div>
    <div style={{ borderTop: `1px solid ${c['border-divider']}` }}>
      {COACHING_OPTIONS.map((opt, idx) => (
        <div key={opt} onClick={() => onSelect(opt)}
          style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, borderBottom: idx === COACHING_OPTIONS.length - 1 ? 'none' : `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], cursor: 'pointer', transition: 'background-color 0.1s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = c['background-subtle']; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = c['background-base']; }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: fw.medium, fontFamily: ff.mono, color: c['content-secondary'] }}>
            {idx + 1}
          </div>
          <span style={{ flex: 1, fontSize: fs.sm, color: c['content-primary'], fontFamily: ff.primary }}>{opt}</span>
        </div>
      ))}
    </div>
  </div>
);

// ── PlanCard — collapsed plan artifact shown in chat ─────────────────────────

const PlanCard: React.FC<{ plan: PlanData; onClick: () => void }> = ({ plan, onClick }) => {
  const tableCount = plan.tables.length;
  const relCount   = plan.relationships.length;
  const colCount   = plan.columns.filter(col => col.included).length;

  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${c['border-default']}`,
        borderRadius: 10,
        backgroundColor: c['background-base'],
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        maxWidth: 460,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = c['content-brand'])}
      onMouseLeave={e => (e.currentTarget.style.borderColor = c['border-default'])}
    >
      {/* Header — model name + version */}
      <div style={{ padding: `${sp.C}px ${sp.D}px ${sp.B}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
          <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{plan.modelName}</span>
          <span style={{ fontSize: 10, fontWeight: fw.medium, padding: '1px 6px', borderRadius: 4, backgroundColor: c['background-subtle'], color: c['content-secondary'] }}>v{plan.version}</span>
        </div>
        <span style={{ fontSize: fs.xs, color: c['content-brand'], fontWeight: fw.medium, flexShrink: 0 }}>View plan →</span>
      </div>
      {/* Goal */}
      <div style={{ padding: `0 ${sp.D}px ${sp.C}px` }}>
        <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{plan.goal}</p>
      </div>
      {/* Stats — tables, relationships, columns only */}
      <div style={{ padding: `${sp.B}px ${sp.D}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', gap: sp.D }}>
        {[`${tableCount} tables`, `${relCount} relationships`, `${colCount} columns`].map(stat => (
          <span key={stat} style={{ fontSize: 11, color: c['content-secondary'], fontWeight: fw.medium }}>{stat}</span>
        ))}
      </div>
    </div>
  );
};

const MessageBubble: React.FC<{
  msg: AgentMessage;
  showAvatar: boolean;
  onToggleSteps: (id: string) => void;
  onToggleCollapsible: (msgId: string, stepIdx: number) => void;
  onSuggestion: (text: string) => void;
  onConfirm?: () => void;
  onOpenQualityPlan?: () => void;
  onChipClick?: (value: string) => void;
  onGenUIAction?: (action: string, msgId: string) => void;
  onComplete?: () => void;
  publishedVersion?: number;
  onOpenObject?: (name: string, highlightCol?: string) => void;
  onApiKeySubmit?: (msgId: string, key: string) => void;
  onFileUpload?: (msgId: string, file: File) => void;
  onArtifactClick?: (card: { type: string; name: string }) => void;
}> = ({ msg, showAvatar, onToggleSteps, onToggleCollapsible, onSuggestion, onConfirm, onOpenQualityPlan, onChipClick, onGenUIAction, onComplete, publishedVersion, onOpenObject, onApiKeySubmit, onFileUpload, onArtifactClick }) => {
  const [chipUsed, setChipUsed] = React.useState(false);
  const [apiKeyValue, setApiKeyValue] = React.useState('');
  const [isDragOver, setIsDragOver] = React.useState(false);

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
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><line x1="3" y1="4" x2="8" y2="4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="3" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/><line x1="3" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
              {msg.attachment.type} · {msg.attachment.label}
            </span>
          </div>
        )}
        <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px', fontWeight: fw.regular, whiteSpace: 'pre-wrap' }}>
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

    return (
      <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
        <AgentAvatar working={isRunning} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>

          {/* Show work toggle — only when all steps are done */}
          {allDone && (
            <button
              onClick={() => onToggleSteps(msg.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontFamily: ff.primary, marginBottom: isCollapsed ? 0 : sp.C }}
            >
              <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontWeight: fw.medium }}>Show work</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                <polyline points="2,4 6,8 10,4" />
              </svg>
            </button>
          )}

          {/* Steps — shown while in-progress OR when expanded after done */}
          {msg.steps && (!allDone || !isCollapsed) && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(msg.allStepsVisible ? msg.steps : msg.steps.filter(s => s.status !== 'pending')).map((step, i, visible) => (
                <div key={i} style={{ display: 'flex', gap: 12, animation: 'ag-step-in 0.22s ease' }}>

                  {/* Left: dot + connecting line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c['content-secondary'], opacity: step.status === 'running' ? 1 : 0.4, flexShrink: 0, marginTop: 5 }} />
                    {i < visible.length - 1 && (
                      <div style={{ flex: 1, width: 1, minHeight: 10, marginTop: 3, backgroundColor: c['border-default'] }} />
                    )}
                  </div>

                  {/* Right: step content */}
                  <div style={{ flex: 1, paddingBottom: i < visible.length - 1 ? sp.D : 0 }}>
                    <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, lineHeight: '20px', color: c['content-primary'] }}>
                      {step.label}
                    </span>

                    {step.detail && step.status !== 'pending' && (
                      <p style={{ margin: '3px 0 0', fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px', whiteSpace: 'pre-line' }}>
                        <TypewriterText text={step.detail} active={step.status === 'running'} />
                      </p>
                    )}

                    {/* SQL collapsible — card style */}
                    {step.status === 'done' && step.collapsible && (
                      <div style={{ marginTop: sp.B }}>
                        <button
                          onClick={() => onToggleCollapsible(msg.id, i)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-divider']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', fontFamily: ff.primary, textAlign: 'left' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = c['background-base'])}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <rect x="3" y="2" width="10" height="12" rx="1.5" />
                            <line x1="6" y1="6" x2="10" y2="6" />
                            <line x1="6" y1="9" x2="10" y2="9" />
                          </svg>
                          <span style={{ flex: 1, fontSize: fs.xs, color: c['content-secondary'], fontWeight: fw.medium }}>
                            {step.collapsibleOpen ? 'Hide SQL' : 'View SQL'}
                          </span>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: step.collapsibleOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                            <polyline points="2,4 6,8 10,4" />
                          </svg>
                        </button>
                        {step.collapsibleOpen && (
                          <pre style={{ margin: '3px 0 0', padding: `${sp.B}px ${sp.C}px`, backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`, borderRadius: 6, fontSize: fs.xs, fontFamily: ff.mono, color: c['content-primary'], overflowX: 'auto', whiteSpace: 'pre' }}>
                            {step.collapsible}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Duration footer */}
              {allDone && msg.duration && (
                <div style={{ display: 'flex', gap: 12, marginTop: sp.B }}>
                  <div style={{ width: 10, flexShrink: 0 }} />
                  <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-secondary'] }}>
                    Worked for {msg.duration}
                  </span>
                </div>
              )}
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
          {msg.reviewPlanCTA && (
            <div style={{ marginTop: sp.C }}>
              <QualityPlanCard onClick={onOpenQualityPlan ?? (() => {})} />
              <div style={{ display: 'flex', gap: sp.B, marginTop: sp.C }}>
                {onConfirm && (
                  <button
                    onClick={onConfirm}
                    style={{ padding: '6px 14px', backgroundColor: c['content-brand'], color: '#fff', border: 'none', borderRadius: 6, fontSize: fs.xs, fontWeight: fw.semibold, cursor: 'pointer', fontFamily: ff.primary, lineHeight: '18px' }}
                  >
                    Apply fixes
                  </button>
                )}
                <button
                  onClick={() => onSuggestion('Edit the quality plan')}
                  style={{ padding: '6px 14px', backgroundColor: 'transparent', color: c['content-primary'], border: `1px solid ${c['border-default']}`, borderRadius: 6, fontSize: fs.xs, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary, lineHeight: '18px' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Edit plan
                </button>
              </div>
            </div>
          )}
          {msg.outcomeCard && (
            <div style={{ marginTop: msg.content ? sp.C : 0 }}>
              <OutcomeCard card={msg.outcomeCard} />
            </div>
          )}
          {msg.modelArtifact && (
            <div style={{ marginTop: msg.content ? sp.C : 0 }}>
              <ModelArtifactCard artifact={msg.modelArtifact} onClick={() => onBuildStart?.()} />
            </div>
          )}
          {/* ── GenUI cards ─────────────────────────────────────────────────── */}
          {msg.genUI === 'semantic_gaps' && onGenUIAction && (
            <SemanticGapsCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onOpenObject={onOpenObject} />
          )}
          {msg.genUI === 'semantic_fill_recommendations' && onGenUIAction && (
            <SemanticFillRecommendationsCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onOpenObject={onOpenObject} />
          )}
          {msg.genUI === 'semantic_gaps_resolved' && onGenUIAction && (
            <SemanticGapsResolvedCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} />
          )}
          {msg.genUI === 'cache_miss_opportunity' && onGenUIAction && (
            <CacheMissOpportunityCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onOpenObject={onOpenObject} />
          )}
          {msg.genUI === 'cache_configuration' && onGenUIAction && (
            <CacheConfigurationCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} />
          )}
          {msg.genUI === 'cache_enabled' && onGenUIAction && (
            <CacheEnabledCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} />
          )}
          {msg.genUI === 'connection_status' && onGenUIAction && (
            <ConnectionStatusCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onOpenObject={onOpenObject} />
          )}
          {msg.genUI === 'multi_model_drift' && onGenUIAction && (
            <MultiModelDriftCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onOpenObject={onOpenObject} />
          )}
          {msg.genUI === 'repair_summary' && onGenUIAction && (
            <RepairSummaryCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} />
          )}
          {msg.genUI === 'null_rate' && onGenUIAction && (
            <NullRateCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onOpenObject={onOpenObject} />
          )}
          {msg.genUI === 'drift_resolution' && onGenUIAction && (
            <SchemaDriftResolutionCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onOpenObject={onOpenObject} />
          )}
          {msg.genUI === 'drift_publish_preview' && onGenUIAction && (
            <DriftPublishPreviewCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} publishedVersion={publishedVersion} />
          )}
          {msg.genUI === 'drift_multi_resolution' && onGenUIAction && (
            <DriftMultiResolutionCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} />
          )}
          {msg.genUI === 'drift_multi_publish_preview' && onGenUIAction && (
            <DriftMultiPublishPreviewCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} publishedVersion={publishedVersion} />
          )}
          {msg.genUI === 'drift_multi_complete' && (
            <DriftMultiCompleteCard onComplete={onComplete} />
          )}
          {msg.genUI === 'next_issue' && onGenUIAction && (
            <NextIssueCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} />
          )}
          {msg.genUI === 'drift_complete' && (
            <SchemaDriftCompleteCard onComplete={onComplete} />
          )}
          {msg.genUI === 'blast_radius' && onGenUIAction && (
            <BlastRadiusCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onOpenObject={onOpenObject} />
          )}
          {msg.genUI === 'schema_reconcile' && onGenUIAction && (
            <SchemaReconciliationCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onOpenObject={onOpenObject} />
          )}
          {msg.genUI === 'restore_point' && onGenUIAction && (
            <RestorePointCard msgId={msg.id} result={msg.genUIResult} onAction={onGenUIAction} onComplete={onComplete} />
          )}
          {/* ── Artifact cards ──────────────────────────────────────────────── */}
          {msg.artifactCards && msg.artifactCards.length > 0 && (
            <div style={{ marginTop: sp.C, display: 'flex', flexDirection: 'column', gap: sp.B }}>
              {msg.artifactCards.map((card, i) => {
                const cardIcon = card.type === 'notebook'
                  ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><rect x="3" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><line x1="1.5" y1="4" x2="3" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="1.5" y1="7" x2="3" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><line x1="5.5" y1="4" x2="9.5" y2="4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="6.5" y1="5.6" x2="10" y2="5.6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.6"/><line x1="5.5" y1="7" x2="8.5" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  : card.type === 'csv-dataset'
                  ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><line x1="2" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="1.1"/><line x1="2" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="1.1"/><line x1="5.5" y1="5" x2="5.5" y2="13" stroke="currentColor" strokeWidth="1.1"/><line x1="8.5" y1="5" x2="8.5" y2="13" stroke="currentColor" strokeWidth="1.1"/></svg>
                  : card.type === 'staging-table'
                  ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="12" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3" fill="none"/><rect x="1" y="8" width="12" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3" fill="none"/><line x1="7" y1="6" x2="7" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M5 7.2L7 8.8L9 7.2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}><rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><line x1="1" y1="4.5" x2="13" y2="4.5" stroke="currentColor" strokeWidth="1.1"/><line x1="5" y1="4.5" x2="5" y2="13" stroke="currentColor" strokeWidth="1.1"/></svg>;
                const dqMatch = card.subLabel?.match(/^(.*?)\s*·\s*DQ\s*(\d+)$/);
                const dqScore = dqMatch ? parseInt(dqMatch[2]) : null;
                const baseLabel = dqMatch ? dqMatch[1] : card.subLabel;
                return (
                  <button
                    key={i}
                    onClick={() => onArtifactClick?.(card)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: sp.B,
                      padding: `${sp.B}px ${sp.C}px`,
                      borderRadius: 6, border: `1px solid ${c['border-default']}`,
                      backgroundColor: c['background-base'], cursor: onArtifactClick ? 'pointer' : 'default',
                      textAlign: 'left', fontFamily: ff.primary, width: '100%',
                      transition: 'background-color 0.1s ease, border-color 0.1s ease',
                    }}
                    onMouseEnter={e => { if (onArtifactClick) { e.currentTarget.style.backgroundColor = c['background-subtle']; e.currentTarget.style.borderColor = c['border-default']; } }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = c['background-base']; e.currentTarget.style.borderColor = c['border-default']; }}
                  >
                    <div style={{ color: c['content-secondary'], display: 'flex', alignItems: 'center' }}>{cardIcon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-primary'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.name}</div>
                      {card.subLabel && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, color: c['content-secondary'] }}>{baseLabel}</span>
                          {dqScore !== null && (
                            <span style={{
                              fontSize: 10, fontWeight: 600, lineHeight: 1,
                              color: dqScore >= 90 ? '#16A34A' : dqScore >= 80 ? '#D97706' : '#DC2626',
                              backgroundColor: dqScore >= 90 ? '#F0FDF4' : dqScore >= 80 ? '#FFFBEB' : '#FEF2F2',
                              padding: '2px 5px', borderRadius: 4,
                            }}>DQ {dqScore}</span>
                          )}
                        </div>
                      )}
                    </div>
                    {onArtifactClick && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: c['content-tertiary'] }}>
                        <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {/* ── Inline API key input ─────────────────────────────────────────── */}
          {msg.inlineInput?.type === 'api-key' && (
            <div style={{ marginTop: sp.C, padding: `${sp.C}px ${sp.D}px`, borderRadius: 8, border: `1px solid ${c['border-default']}`, backgroundColor: c['background-subtle'] }}>
              {msg.inlineInput.submitted ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>
                    {msg.inlineInput.savedCredentials ? 'Saved Pendo credentials' : '•••••••••••'}
                  </span>
                  <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="6" fill="#16A34A" /><polyline points="3.5,6 5.5,8 8.5,4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Saved ✓
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
                  {/* Primary: use saved credentials from org secret store */}
                  <button
                    onClick={() => onApiKeySubmit?.(msg.id, '__saved__')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp.B, padding: '7px 14px', fontSize: fs.xs, fontWeight: fw.semibold, backgroundColor: c['content-brand'], color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: ff.primary }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="5" width="8" height="6" rx="1" stroke="#fff" strokeWidth="1.3" fill="none"/><path d="M4 5V3.5a2 2 0 014 0V5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Use saved Pendo credentials
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                    <div style={{ flex: 1, height: 1, backgroundColor: c['border-divider'] }} />
                    <span style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>or enter manually</span>
                    <div style={{ flex: 1, height: 1, backgroundColor: c['border-divider'] }} />
                  </div>
                  <div>
                    <label style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], display: 'block', marginBottom: sp.B }}>{msg.inlineInput.label}</label>
                    <div style={{ display: 'flex', gap: sp.B }}>
                      <input
                        type="password"
                        placeholder={msg.inlineInput.placeholder ?? 'Enter key…'}
                        value={apiKeyValue}
                        onChange={e => setApiKeyValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && apiKeyValue.trim()) { onApiKeySubmit?.(msg.id, apiKeyValue); setApiKeyValue(''); } }}
                        style={{ flex: 1, padding: '6px 10px', fontSize: fs.xs, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], color: c['content-primary'], fontFamily: ff.primary, outline: 'none' }}
                      />
                      <button
                        disabled={!apiKeyValue.trim()}
                        onClick={() => { if (apiKeyValue.trim()) { onApiKeySubmit?.(msg.id, apiKeyValue); setApiKeyValue(''); } }}
                        style={{ padding: '6px 14px', fontSize: fs.xs, fontWeight: fw.semibold, backgroundColor: apiKeyValue.trim() ? c['content-brand'] : c['background-subtle'], color: apiKeyValue.trim() ? '#fff' : c['content-tertiary'], border: 'none', borderRadius: 6, cursor: apiKeyValue.trim() ? 'pointer' : 'default', fontFamily: ff.primary }}
                      >
                        Submit
                      </button>
                    </div>
                    <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: sp.A }}>Stored in your org's credential vault — never visible in chat</div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* ── Inline file upload ───────────────────────────────────────────── */}
          {msg.inlineInput?.type === 'file-upload' && !msg.inlineInput.submitted && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={e => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) onFileUpload?.(msg.id, file); }}
              style={{ marginTop: sp.C, padding: `${sp.H}px ${sp.D}px`, borderRadius: 8, border: `1.5px dashed ${isDragOver ? c['content-brand'] : c['border-default']}`, backgroundColor: isDragOver ? c['background-information'] : c['background-subtle'], textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
              onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv'; input.onchange = ev => { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) onFileUpload?.(msg.id, f); }; input.click(); }}
            >
              <div style={{ fontSize: fs.xs, color: isDragOver ? c['content-brand'] : c['content-secondary'], fontWeight: fw.medium }}>{msg.inlineInput.label}</div>
              <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 2 }}>CSV · max 10 MB</div>
            </div>
          )}
          {msg.suggestions && msg.suggestions.length > 0 && (
            <SuggestionChips suggestions={msg.suggestions} onSelect={onSuggestion} />
          )}
          {msg.interactiveChips && msg.interactiveChips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, marginTop: sp.C }}>
              {msg.interactiveChips.map(chip => (
                <button
                  key={chip.value}
                  disabled={chipUsed}
                  onClick={() => { setChipUsed(true); onChipClick?.(chip.value); }}
                  style={{
                    padding: `${sp.A + 2}px ${sp.C}px`,
                    borderRadius: 20,
                    border: `1px solid ${chipUsed ? c['border-divider'] : c['content-brand']}`,
                    backgroundColor: chipUsed ? c['background-subtle'] : c['background-base'],
                    color: chipUsed ? c['content-tertiary'] : c['content-brand'],
                    fontSize: fs.xs,
                    fontWeight: fw.medium,
                    cursor: chipUsed ? 'default' : 'pointer',
                    fontFamily: ff.primary,
                    lineHeight: '18px',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (!chipUsed) e.currentTarget.style.backgroundColor = c['background-information']; }}
                  onMouseLeave={e => { if (!chipUsed) e.currentTarget.style.backgroundColor = c['background-base']; }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
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

// ── GenUI shared primitives ───────────────────────────────────────────────────

const GenUICard: React.FC<{ children: React.ReactNode; locked?: boolean }> = ({ children, locked }) => (
  <div style={{
    marginTop: sp.C, border: `1px solid ${locked ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff',
    opacity: locked ? 0.85 : 1,
  }}>
    {children}
  </div>
);

const GenUISection: React.FC<{ children: React.ReactNode; last?: boolean; bg?: string }> = ({ children, last, bg }) => (
  <div style={{
    padding: '10px 14px',
    borderBottom: last ? 'none' : '1px solid rgba(0,0,0,0.06)',
    backgroundColor: bg,
  }}>
    {children}
  </div>
);

const GenUIBadge: React.FC<{ children: React.ReactNode; variant: 'red' | 'green' | 'amber' | 'blue' | 'grey' }> = ({ children, variant }) => {
  const colors = {
    red:   { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
    green: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    amber: { color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
    blue:  { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    grey:  { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  }[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11.5, fontWeight: fw.semibold,
      color: colors.color, background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 5, padding: '3px 8px',
    }}>
      {children}
    </span>
  );
};

const GenUIActions: React.FC<{
  locked: boolean;
  lockedLabel?: string;
  primary?: { label: string; action: string; msgId: string; onAction: (a: string, id: string) => void };
  secondary?: { label: string; action: string; msgId: string; onAction: (a: string, id: string) => void };
}> = ({ locked, lockedLabel, primary, secondary }) => (
  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
    {locked ? (
      <span style={{ fontSize: 12, color: '#888' }}>{lockedLabel ?? 'Done'}</span>
    ) : (
      <>
        {secondary && (
          <button
            onClick={() => secondary.onAction(secondary.action, secondary.msgId)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: fw.medium, color: '#444', fontFamily: ff.primary }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
          >
            {secondary.label}
          </button>
        )}
        {primary && (
          <button
            onClick={() => primary.onAction(primary.action, primary.msgId)}
            style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#2563eb', cursor: 'pointer', fontSize: 12.5, fontWeight: fw.semibold, color: '#fff', fontFamily: ff.primary }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            {primary.label}
          </button>
        )}
      </>
    )}
  </div>
);

const StatPill: React.FC<{ children: React.ReactNode; green?: boolean }> = ({ children, green }) => (
  <span style={{
    fontSize: 11.5, padding: '2px 8px', borderRadius: 5,
    background: green ? '#f0fdf4' : '#f3f4f6',
    color: green ? '#15803d' : '#555',
    border: `1px solid ${green ? '#bbf7d0' : 'rgba(0,0,0,0.06)'}`,
    fontWeight: fw.medium,
  }}>{children}</span>
);

// ── Semantic Gaps mock data ───────────────────────────────────────────────────

const SEMANTIC_GAPS_DATA = [
  {
    column: 'campaign_id',
    type: 'string',
    samples: '"cmp_2024_q1_001", "cmp_2023_h2_045", "cmp_2024_q2_003"',
    samplesTruncated: '"cmp_2024_q1_001", "cmp_2023_h2_045"...',
    totalDistinct: 847,
    failures: 12,
    trend: 'up' as const,
    description: 'Unique identifier for marketing campaigns. Links to campaign master table to track performance metrics and attribution.',
    confidence: 'High',
  },
  {
    column: 'target_region',
    type: 'string',
    samples: '"APAC", "EMEA", "NA", "LATAM"',
    samplesTruncated: '"APAC", "EMEA", "NA", "LATAM"',
    totalDistinct: 4,
    failures: 8,
    trend: 'stable' as const,
    description: 'Geographic region targeted by the campaign. Values include APAC (Asia Pacific), EMEA (Europe/Middle East/Africa), NA (North America), and LATAM (Latin America).',
    confidence: 'High',
  },
  {
    column: 'channel',
    type: 'string',
    samples: '"paid_search", "organic_social", "email", "display"',
    samplesTruncated: '"paid_search", "organic_social", "email"...',
    totalDistinct: 8,
    failures: 7,
    trend: 'down' as const,
    description: 'Marketing channel used for the campaign. Distinguishes between paid channels (paid_search, display) and organic channels (organic_social, email).',
    confidence: 'High',
  },
  {
    column: 'spend',
    type: 'number',
    samples: '45000, 23400, 78900, 12500',
    samplesTruncated: '45000, 23400, 78900...',
    totalDistinct: 324,
    failures: 4,
    trend: 'stable' as const,
    description: 'Total amount spent on the campaign in USD. Used to calculate ROI, cost per acquisition, and other performance metrics.',
    confidence: 'High',
  },
];

const CACHE_QUERY_USERS = [
  { name: 'Sarah Chen', runs: 12 },
  { name: 'Marcus Rodriguez', runs: 8 },
  { name: 'Alex Kim', runs: 6 },
  { name: 'Jordan Lee', runs: 4 },
  { name: 'Pat Johnson', runs: 4 },
];

const FAILED_QUERIES = [
  {
    category: 'Attribution Questions',
    totalFailures: 17,
    affectedUsers: 6,
    queries: [
      { query: "What's our spend by channel this quarter?", count: 8, needs: ['channel', 'spend'] },
      { query: 'Show me campaign performance in APAC', count: 5, needs: ['target_region', 'campaign_id'] },
      { query: 'Compare paid search vs organic social ROI', count: 4, needs: ['channel'] },
    ],
  },
  {
    category: 'Performance Questions',
    totalFailures: 9,
    affectedUsers: 4,
    queries: [
      { query: 'Which campaigns had the highest ROI?', count: 3, needs: ['campaign_id', 'spend'] },
      { query: "What's our total spend by region?", count: 3, needs: ['target_region', 'spend'] },
      { query: 'Show me email campaign performance', count: 3, needs: ['channel', 'campaign_id'] },
    ],
  },
  {
    category: 'Budget Analysis',
    totalFailures: 5,
    affectedUsers: 3,
    queries: [
      { query: 'How much did we spend on APAC campaigns?', count: 3, needs: ['target_region', 'spend'] },
      { query: "What's our average spend per channel?", count: 2, needs: ['channel', 'spend'] },
    ],
  },
];

// ── SemanticGapsCard ──────────────────────────────────────────────────────────

const SemanticGapsCard: React.FC<{
  msgId: string;
  result?: string;
  onAction: (action: string, msgId: string) => void;
  onOpenObject?: (name: string, highlightCol?: string) => void;
}> = ({ msgId, result, onAction, onOpenObject }) => {
  const [activeTab, setActiveTab] = useState<'columns' | 'downstream'>('columns');
  const [whyDismissed, setWhyDismissed] = useState(false);
  const [hoveredSample, setHoveredSample] = useState<string | null>(null);

  return (
    <div style={{ marginTop: 12, background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
          4 columns need descriptions to fix Spotter failures
        </h3>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
          <span onClick={() => onOpenObject?.('Marketing Campaign Attribution')} style={{ color: '#2770ef', cursor: 'pointer', fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            Marketing Campaign Attribution
          </span>
          {' · Spotter failing 31 queries/week'}
        </div>
      </div>

      {!whyDismissed && (
        <div style={{ marginBottom: 20, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#92400e', lineHeight: 1.5, position: 'relative' }}>
          <button onClick={() => setWhyDismissed(true)} style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, padding: 0, border: 'none', background: 'none', color: '#b45309', cursor: 'pointer', fontSize: 14, lineHeight: '1', fontFamily: ff.primary }}>×</button>
          These gaps caused 31 Spotter failures last week, interrupting analysts an average of 6 times per day. Without descriptions, Spotter can't understand what these columns mean or when to use them.
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 14 }}>Impact</div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
          {(['columns', 'downstream'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #2770ef' : '2px solid transparent', color: activeTab === tab ? '#2770ef' : '#64748b', fontSize: 13, fontWeight: activeTab === tab ? 600 : 500, cursor: 'pointer', marginBottom: -1, fontFamily: ff.primary }}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'columns' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  {['Column', 'Failures', 'Type', 'Sample Values'].map(h => (
                    <th key={h} style={{ padding: '10px 12px 10px 0', textAlign: 'left', fontWeight: 500, color: '#64748b', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEMANTIC_GAPS_DATA.map((row, i) => {
                  const trendIcon = row.trend === 'up' ? '↗' : row.trend === 'down' ? '↘' : '→';
                  const trendColor = row.trend === 'up' ? '#dc2626' : row.trend === 'down' ? '#16a34a' : '#64748b';
                  return (
                    <tr key={row.column} style={{ borderBottom: i < SEMANTIC_GAPS_DATA.length - 1 ? '1px solid #f1f5f9' : 'none' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '16px 12px 16px 0' }}>
                        <span onClick={() => onOpenObject?.('Marketing Campaign Attribution', row.column)} style={{ color: '#2770ef', cursor: 'pointer', fontFamily: 'Menlo, Monaco, monospace', fontSize: 13, fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>{row.column}</span>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 4, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600 }}>{row.failures}/week</span>
                          <span style={{ fontSize: 14, color: trendColor }}>{trendIcon}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', color: '#64748b', fontSize: 12 }}>{row.type}</td>
                      <td style={{ padding: '16px 0 16px 12px', color: '#64748b', fontFamily: 'Menlo, Monaco, monospace', fontSize: 12, cursor: 'pointer', position: 'relative' }} onMouseEnter={() => setHoveredSample(row.column)} onMouseLeave={() => setHoveredSample(null)}>
                        {row.samplesTruncated}
                        {hoveredSample === row.column && (
                          <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, padding: '8px 10px', background: '#1e293b', color: '#fff', fontSize: 11, borderRadius: 6, whiteSpace: 'nowrap', zIndex: 10 }}>
                            {row.totalDistinct} distinct values
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'downstream' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FAILED_QUERIES.map((group, groupIdx) => (
              <div key={groupIdx}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{group.category}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#64748b' }}>
                    <span style={{ padding: '2px 6px', borderRadius: 3, background: '#fef2f2', color: '#dc2626', fontWeight: 600 }}>{group.totalFailures} failures/week</span>
                    <span>Affects {group.affectedUsers} users</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12 }}>
                  {group.queries.map((q, qIdx) => (
                    <div key={qIdx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 13, color: '#475569' }}>"{q.query}"</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 12, flexShrink: 0 }}>{q.count}× this week</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Menlo, Monaco, monospace' }}>
                        Needs: {q.needs.map((col, colIdx) => (
                          <span key={colIdx}>
                            <span style={{ color: '#2770ef', cursor: 'pointer' }} onClick={() => onOpenObject?.('Marketing Campaign Attribution', col)} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>{col}</span>
                            {colIdx < q.needs.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <button onClick={() => onAction('semantic_gaps_fill', msgId)} disabled={!!result} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: result === 'semantic_gaps_fill' ? '#94a3b8' : result ? '#16a34a' : '#2770ef', color: '#fff', fontSize: 13, fontWeight: 600, cursor: result ? 'not-allowed' : 'pointer', fontFamily: ff.primary }} onMouseEnter={e => { if (!result) (e.target as HTMLButtonElement).style.background = '#1d5bbf'; }} onMouseLeave={e => { if (!result) (e.target as HTMLButtonElement).style.background = '#2770ef'; }}>
          {result === 'semantic_gaps_fill' ? 'Analyzing...' : result ? '✓ Generated' : 'Generate descriptions →'}
        </button>
        {!result && <div style={{ fontSize: 11, color: '#94a3b8' }}>Based on patterns from 847 successful descriptions</div>}
      </div>
    </div>
  );
};

// ── SemanticFillRecommendationsCard ───────────────────────────────────────────

const SemanticFillRecommendationsCard: React.FC<{
  msgId: string;
  result?: string;
  onAction: (action: string, msgId: string) => void;
  onOpenObject?: (name: string, highlightCol?: string) => void;
}> = ({ msgId, result, onAction, onOpenObject }) => {
  const [descriptions, setDescriptions] = useState<Record<string, string>>(
    SEMANTIC_GAPS_DATA.reduce((acc, item) => ({ ...acc, [item.column]: item.description }), {} as Record<string, string>)
  );

  return (
    <div style={{ marginTop: 12, background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Recommended descriptions</h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {SEMANTIC_GAPS_DATA.map(item => (
          <div key={item.column} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ marginBottom: 8 }}>
              <span onClick={() => onOpenObject?.('Marketing Campaign Attribution', item.column)} style={{ color: '#2770ef', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'Menlo, Monaco, monospace' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>{item.column}</span>
            </div>
            <textarea value={descriptions[item.column]} onChange={e => setDescriptions({ ...descriptions, [item.column]: e.target.value })} style={{ width: '100%', minHeight: 60, padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#475569', lineHeight: '1.5', fontFamily: ff.primary, resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 4, background: '#dcfce7', color: '#166534', fontSize: 11, fontWeight: 600 }}>{item.confidence} confidence</span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Menlo, Monaco, monospace' }}>Sample: {item.samples.split(',')[0]}...</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20, padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
        These descriptions are based on column usage patterns, sample data, and join relationships. Review and edit before applying.
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={() => onAction('semantic_gaps_cancel', msgId)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>Cancel</button>
        <button onClick={() => onAction('semantic_gaps_apply_descriptions', msgId)} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#2770ef', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }} onMouseEnter={e => e.currentTarget.style.background = '#1d5bbf'} onMouseLeave={e => e.currentTarget.style.background = '#2770ef'}>Apply descriptions →</button>
      </div>
    </div>
  );
};

// ── SemanticGapsResolvedCard ──────────────────────────────────────────────────

const SemanticGapsResolvedCard: React.FC<{
  msgId: string;
  result?: string;
  onAction: (action: string, msgId: string) => void;
}> = ({ msgId, result, onAction }) => (
  <div style={{ marginTop: 12, background: '#fff', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
    <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 20, lineHeight: '1' }}>🎉</span>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>Descriptions added and Spotter updated</h3>
    </div>
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
      {['4 column descriptions added', 'Model metadata refreshed', 'Spotter context updated', '~31 failed queries/week will now succeed'].map(text => (
        <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M13 4L6 11L3 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{text}</span>
        </li>
      ))}
    </ul>
    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Descriptions applied</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} today</div>
    </div>
  </div>
);

// ── CacheMissOpportunityCard ──────────────────────────────────────────────────

const CacheMissOpportunityCard: React.FC<{
  msgId: string;
  result?: string;
  onAction: (action: string, msgId: string) => void;
  onOpenObject?: (name: string, highlightCol?: string) => void;
}> = ({ msgId, result, onAction, onOpenObject }) => {
  const [whyDismissed, setWhyDismissed] = useState(false);

  return (
    <div style={{ marginTop: 12, background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Cache miss opportunity detected</h3>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
          <span onClick={() => onOpenObject?.('Sales Performance')} style={{ color: '#2770ef', cursor: 'pointer', fontWeight: 500 }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Sales Performance</span>
          {' · "Win rate by region" · Run 34× this week · 0% cache hit · ~374s wasted'}
        </div>
      </div>

      {!whyDismissed && (
        <div style={{ marginBottom: 20, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#92400e', lineHeight: 1.5, position: 'relative' }}>
          <button onClick={() => setWhyDismissed(true)} style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, padding: 0, border: 'none', background: 'none', color: '#b45309', cursor: 'pointer', fontSize: 14, lineHeight: '1', fontFamily: ff.primary }}>×</button>
          This query is run frequently but never cached, causing unnecessary warehouse load and slow response times. Enabling caching would save ~11 seconds per query.
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: 14 }}>Query Pattern</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 16 }}>
          {[
            { label: 'Frequency', value: '34× this week', sub: 'Avg 5/day', red: false },
            { label: 'Avg Execution Time', value: '11.2s', sub: 'Per query', red: false },
            { label: 'Cache Hit Rate', value: '0%', sub: 'Always hits warehouse', red: true },
            { label: 'Time Wasted', value: '~374s', sub: 'This week', red: true },
          ].map(stat => (
            <div key={stat.label} style={{ padding: 16, background: stat.red ? '#fef2f2' : '#f8fafc', borderRadius: 8, border: `1px solid ${stat.red ? '#fecaca' : '#e2e8f0'}` }}>
              <div style={{ fontSize: 11, color: stat.red ? '#991b1b' : '#64748b', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: stat.red ? 600 : 400 }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: stat.red ? '#dc2626' : '#0f172a' }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: stat.red ? '#991b1b' : '#64748b', marginTop: 2 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Who's running it</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CACHE_QUERY_USERS.map((user, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 6 }}>
                <span style={{ fontSize: 13, color: '#475569' }}>{user.name}</span>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{user.runs} runs</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <button onClick={() => onAction('cache_miss_configure_action', msgId)} disabled={!!result} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: result === 'cache_miss_configure_action' ? '#94a3b8' : result ? '#16a34a' : '#2770ef', color: '#fff', fontSize: 13, fontWeight: 600, cursor: result ? 'not-allowed' : 'pointer', fontFamily: ff.primary }} onMouseEnter={e => { if (!result) (e.target as HTMLButtonElement).style.background = '#1d5bbf'; }} onMouseLeave={e => { if (!result) (e.target as HTMLButtonElement).style.background = '#2770ef'; }}>
          {result === 'cache_miss_configure_action' ? 'Analyzing...' : result ? '✓ Configured' : 'Enable caching →'}
        </button>
        {!result && <div style={{ fontSize: 11, color: '#94a3b8' }}>Save ~11s per query · ~374s/week total</div>}
      </div>
    </div>
  );
};

// ── CacheConfigurationCard ────────────────────────────────────────────────────

const CacheConfigurationCard: React.FC<{
  msgId: string;
  result?: string;
  onAction: (action: string, msgId: string) => void;
}> = ({ msgId, result, onAction }) => {
  const [cacheScope, setCacheScope] = useState<'query' | 'similar' | 'model'>('query');
  const [refreshSchedule, setRefreshSchedule] = useState('6h');
  const [ttl, setTTL] = useState('24h');

  const scopeOptions = [
    { value: 'query' as const, label: 'This query only', sub: 'Cache only "Win rate by region"' },
    { value: 'similar' as const, label: 'All similar queries', sub: 'Queries with same dimensions (region, time_period)' },
    { value: 'model' as const, label: 'Model-level cache', sub: 'All queries on Sales Performance model' },
  ];

  return (
    <div style={{ marginTop: 12, background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, padding: '24px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Cache configuration</h3>
        <div style={{ fontSize: 13, color: '#64748b' }}>Configure optimal cache settings for "Win rate by region"</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Cache scope</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {scopeOptions.map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, border: cacheScope === opt.value ? '2px solid #2770ef' : '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', background: cacheScope === opt.value ? '#eff6ff' : '#fff' }}>
              <input type="radio" name="cacheScope" value={opt.value} checked={cacheScope === opt.value} onChange={() => setCacheScope(opt.value)} style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 2 }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{opt.sub}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 10 }}>Refresh strategy</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Refresh schedule', value: refreshSchedule, setter: setRefreshSchedule, options: [{ value: 'realtime', label: 'Real-time' }, { value: '1h', label: 'Every hour' }, { value: '6h', label: 'Every 6 hours' }, { value: '24h', label: 'Daily' }, { value: '168h', label: 'Weekly' }] },
            { label: 'TTL (time to live)', value: ttl, setter: setTTL, options: [{ value: '1h', label: '1 hour' }, { value: '6h', label: '6 hours' }, { value: '12h', label: '12 hours' }, { value: '24h', label: '24 hours' }, { value: '168h', label: '7 days' }] },
          ].map(field => (
            <div key={field.label}>
              <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>{field.label}</label>
              <select value={field.value} onChange={e => field.setter(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, color: '#0f172a', fontFamily: ff.primary, cursor: 'pointer' }}>
                {field.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20, padding: '14px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 8 }}>Estimated Impact</div>
        {['Expected cache hit rate: ~85% (based on query pattern)', 'Time saved per week: ~320s (5.3 minutes)', 'Warehouse cost reduction: ~$0.42/week'].map(line => (
          <div key={line} style={{ fontSize: 12, color: '#166534' }}>{line}</div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={() => onAction('cache_cancel', msgId)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>Cancel</button>
        <button onClick={() => onAction('cache_enable_action', msgId)} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: '#2770ef', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }} onMouseEnter={e => e.currentTarget.style.background = '#1d5bbf'} onMouseLeave={e => e.currentTarget.style.background = '#2770ef'}>Enable cache →</button>
      </div>
    </div>
  );
};

// ── CacheEnabledCard ──────────────────────────────────────────────────────────

const CacheEnabledCard: React.FC<{
  msgId: string;
  result?: string;
  onAction: (action: string, msgId: string) => void;
}> = ({ msgId, result, onAction }) => (
  <div style={{ marginTop: 12, background: '#fff', border: '1px solid #bbf7d0', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
    <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 20, lineHeight: '1' }}>🎉</span>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>Caching enabled for "Win rate by region"</h3>
    </div>
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
      {['Cache policy created', 'First data pull scheduled', 'Query routing updated', '~11s saved per query · ~320s/week total'].map(text => (
        <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}><path d="M13 4L6 11L3 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>{text}</span>
        </li>
      ))}
    </ul>
    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Cache enabled</div>
      <div style={{ fontSize: 12, color: '#64748b' }}>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} today · Next refresh in 6 hours</div>
    </div>
  </div>
);

// ── ConnectionStatusCard ──────────────────────────────────────────────────────

const ConnectionStatusCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void; onOpenObject?: (name: string, highlightCol?: string) => void }> = ({ msgId, result, onAction, onOpenObject }) => {
  const locked = !!result;
  const applied = result === 'connection_status_apply';
  const blockedModels = ['Sales Analytics', 'Sales Performance', 'Revenue Forecast'];
  return (
    <GenUICard locked={locked}>
      <GenUISection>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <GenUIBadge variant={applied ? 'green' : 'red'}>{applied ? '✓ Connection restored' : '● Offline'}</GenUIBadge>
          <span style={{ fontSize: 11, color: '#999' }}>dbt Cloud · prod</span>
        </div>
      </GenUISection>
      <GenUISection>
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 8 }}>Why it failed</div>
        <div style={{ fontSize: 12.5, color: '#333', lineHeight: 1.55 }}>API token expired <span style={{ fontFamily: ff.mono, fontSize: 12 }}>Jan 12 at 10:22am</span></div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>Token last rotated: 90 days ago</div>
      </GenUISection>
      <GenUISection>
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 8 }}>{applied ? 'Models syncing' : '3 models currently blocked'}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
          {blockedModels.map(m => (
            <button key={m} onClick={() => onOpenObject?.(m)} style={{ fontSize: 11.5, fontWeight: fw.medium, color: applied ? '#166534' : '#1e40af', background: applied ? '#f0fdf4' : '#eff6ff', border: `1px solid ${applied ? '#bbf7d0' : '#bfdbfe'}`, borderRadius: 5, padding: '3px 8px', cursor: onOpenObject ? 'pointer' : 'default', fontFamily: ff.primary, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{m} <span style={{ opacity: 0.6, fontSize: 10 }}>↗</span></button>
          ))}
        </div>
        {applied && <div style={{ fontSize: 12, color: '#16a34a', marginTop: 8 }}>Estimated resync: ~4 minutes</div>}
      </GenUISection>
      {!applied && (
        <GenUISection>
          <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 6 }}>Fix</div>
          <div style={{ fontSize: 12.5, color: '#333', lineHeight: 1.55 }}>Rotate API token + trigger downstream resync</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>Risk: none — reversible at any time · ETA: ~4 min</div>
        </GenUISection>
      )}
      <GenUIActions locked={locked} lockedLabel={applied ? 'Fix applied' : 'Dismissed'} primary={!applied ? { label: 'Rotate token & resync', action: 'connection_status_apply', msgId, onAction } : undefined} />
    </GenUICard>
  );
};

// ── MultiModelDriftCard ───────────────────────────────────────────────────────

const MULTI_DRIFT_DEPENDENTS = [
  { name: 'Q4 Forecast', model: 'Revenue Forecast', ref: 'quarterly_target' },
  { name: 'Pipeline Summary', model: 'Pipeline Health', ref: 'pipeline_stage' },
  { name: 'Regional Forecast', model: 'Revenue Forecast', ref: 'forecast_region' },
  { name: 'Stage Conversion', model: 'Pipeline Health', ref: 'pipeline_stage' },
  { name: 'Exec Revenue View', model: 'Revenue Forecast', ref: 'quarterly_target' },
  { name: 'Deal Velocity', model: 'Pipeline Health', ref: 'forecast_region' },
];

const MultiModelDriftCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void; onOpenObject?: (name: string, highlightCol?: string) => void }> = ({ msgId, result, onAction, onOpenObject }) => {
  const locked = !!result;
  const repaired = result === 'multi_model_drift_repair';
  const [expanded, setExpanded] = React.useState(false);
  const visibleDependents = expanded ? MULTI_DRIFT_DEPENDENTS : MULTI_DRIFT_DEPENDENTS.slice(0, 2);
  const models = [
    { name: 'Revenue Forecast', columns: ['quarterly_target'] },
    { name: 'Pipeline Health', columns: ['forecast_region', 'pipeline_stage'] },
  ];
  return (
    <GenUICard locked={locked}>
      <GenUISection>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <GenUIBadge variant={repaired ? 'green' : 'red'}>{repaired ? '✓ Both models repaired' : '3 columns removed — no replacements'}</GenUIBadge>
          <span style={{ fontSize: 11, color: '#999' }}>warehouse source</span>
        </div>
      </GenUISection>
      <GenUISection>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {models.map(model => (
            <div key={model.name} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 7, padding: '8px 10px', background: repaired ? '#f0fdf4' : '#fafafa' }}>
              <button onClick={() => onOpenObject?.(model.name, model.columns[0])} style={{ fontSize: 12, fontWeight: fw.semibold, color: '#1e40af', marginBottom: 6, background: 'none', border: 'none', padding: 0, cursor: onOpenObject ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: 3 }}>{model.name} <span style={{ opacity: 0.5, fontSize: 10 }}>↗</span></button>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
                {model.columns.map(col => (
                  <span key={col} style={{ fontFamily: ff.mono, fontSize: 11, color: repaired ? '#6b7280' : '#991b1b', textDecoration: repaired ? 'line-through' : 'none', background: repaired ? 'transparent' : '#fee2e2', padding: repaired ? 0 : '1px 5px', borderRadius: 4, alignSelf: 'flex-start' }}>{col} ✕</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GenUISection>
      <GenUISection>
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 8 }}>8 dependents affected</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginBottom: visibleDependents.length < MULTI_DRIFT_DEPENDENTS.length ? 8 : 0 }}>
          {visibleDependents.map(d => (
            <button key={d.name} onClick={() => onOpenObject?.(d.name, d.ref)} style={{ fontSize: 11.5, color: '#444', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 5, padding: '2px 8px', fontWeight: fw.medium, fontFamily: ff.primary, cursor: onOpenObject ? 'pointer' : 'default', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{d.name} <span style={{ opacity: 0.45, fontSize: 10 }}>↗</span></button>
          ))}
          {!expanded && MULTI_DRIFT_DEPENDENTS.length > 2 && (
            <button onClick={() => setExpanded(true)} style={{ fontSize: 11.5, color: c['content-brand'], background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: ff.primary, fontWeight: fw.medium }}>+{MULTI_DRIFT_DEPENDENTS.length - 2} more</button>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#999' }}>No replacements found in warehouse</div>
      </GenUISection>
      <GenUIActions locked={locked} lockedLabel={repaired ? 'Repair started' : 'Dismissed'} primary={!repaired ? { label: 'Repair both models — remove deprecated columns', action: 'multi_model_drift_repair', msgId, onAction } : undefined} />
    </GenUICard>
  );
};

// ── RepairSummaryCard ─────────────────────────────────────────────────────────

const RepairSummaryCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void }> = ({ msgId, result, onAction }) => {
  const locked = !!result;
  const published = result === 'repair_summary_publish';
  return (
    <GenUICard locked={locked}>
      <GenUISection><GenUIBadge variant="green">{published ? '✓ Published' : '✓ Both models repaired'}</GenUIBadge></GenUISection>
      <GenUISection>
        <div style={{ display: 'flex', gap: 16 }}>
          {[{ label: 'models repaired', value: '2' }, { label: 'columns removed', value: '3' }, { label: 'dependents updated', value: '8' }].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 22, fontWeight: fw.semibold, color: '#1a1a1a', lineHeight: 1.2 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </GenUISection>
      <GenUIActions locked={locked} lockedLabel={published ? 'Published' : 'Done'} primary={!published ? { label: 'Publish changes', action: 'repair_summary_publish', msgId, onAction } : undefined} secondary={!published ? { label: 'Review changes', action: 'repair_summary_review', msgId, onAction } : undefined} />
    </GenUICard>
  );
};

// ── NullRateCard ──────────────────────────────────────────────────────────────

const NullRateCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void; onOpenObject?: (name: string, highlightCol?: string) => void }> = ({ msgId, result, onAction, onOpenObject }) => {
  const locked = !!result;
  const [selected, setSelected] = React.useState<'null_rate_add_organic' | 'null_rate_filter_organic' | 'null_rate_suppress'>('null_rate_add_organic');
  const options: { id: typeof selected; label: string; sublabel: string; recommended?: boolean }[] = [
    { id: 'null_rate_add_organic', label: 'Add "Organic" campaign', sublabel: 'Organic maps to a real channel — include it. 18% null rate becomes 0% with this fix.', recommended: true },
    { id: 'null_rate_filter_organic', label: 'Filter organic orders', sublabel: 'Null rate restored to 2%, but 18% of orders excluded from all attribution reports.' },
    { id: 'null_rate_suppress', label: 'Mark 18% as expected — suppress alert', sublabel: 'No model changes. Alert threshold updated to 22%.' },
  ];
  const sparkPoints = [2,2,2,2,2,2,2,2,2,3,4,5,9,14,18,18,18,18,18,18].map((v, i) => `${(i / 19) * 200},${28 - (v / 20) * 24}`).join(' ');
  const resultLabel = result === 'null_rate_add_organic' ? 'Organic campaign added' : result === 'null_rate_filter_organic' ? 'Organic orders filtered' : result === 'null_rate_suppress' ? 'Alert suppressed' : '';
  return (
    <GenUICard locked={locked}>
      <GenUISection>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <GenUIBadge variant={locked ? 'green' : 'amber'}>{locked ? `✓ ${resultLabel}` : 'campaign_id null rate spike'}</GenUIBadge>
          <button onClick={() => onOpenObject?.('Marketing Campaign Attribution', 'campaign_id')} style={{ fontSize: 11, color: '#1e40af', background: 'none', border: 'none', padding: 0, cursor: onOpenObject ? 'pointer' : 'default', fontFamily: ff.primary, display: 'inline-flex', alignItems: 'center', gap: 2 }}>Marketing Campaign Attribution <span style={{ opacity: 0.55, fontSize: 10 }}>↗</span></button>
        </div>
      </GenUISection>
      <GenUISection>
        <svg width="100%" height="36" viewBox="0 0 200 36" preserveAspectRatio="none" style={{ display: 'block', marginBottom: 6 }}>
          <rect x="130" y="0" width="70" height="36" fill="#fee2e2" opacity="0.35" />
          <polyline points={sparkPoints} fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="130" cy="4" r="2.5" fill="#dc2626" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999' }}>
          <span>Jan 1: 2%</span><span style={{ color: '#dc2626', fontWeight: fw.semibold }}>Jan 14: spike</span><span>Now: 18%</span>
        </div>
      </GenUISection>
      <GenUISection bg="#fffbeb">
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#92400e', marginBottom: 4 }}>Root cause — not a data error</div>
        <div style={{ fontSize: 12.5, color: '#78350f', lineHeight: 1.55 }}>Organic-channel orders added Jan 14 have no <span style={{ fontFamily: ff.mono, fontSize: 11.5 }}>campaign_id</span> by design.</div>
      </GenUISection>
      {!locked && (
        <GenUISection>
          <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 10 }}>How would you like to handle organic orders?</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 7 }}>
            {options.map(opt => (
              <label key={opt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 7, border: `1.5px solid ${selected === opt.id ? '#2563eb' : 'rgba(0,0,0,0.07)'}`, background: selected === opt.id ? '#eff6ff' : 'transparent' }}>
                <input type="radio" name={`null_rate_${msgId}`} value={opt.id} checked={selected === opt.id} onChange={() => setSelected(opt.id)} style={{ marginTop: 2, flexShrink: 0, accentColor: '#2563eb' }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: fw.medium, color: '#1a1a1a', lineHeight: 1.4 }}>
                    {opt.label}
                    {opt.recommended && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: fw.semibold, color: '#1d4ed8', background: '#dbeafe', padding: '1px 6px', borderRadius: 4 }}>recommended</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{opt.sublabel}</div>
                </div>
              </label>
            ))}
          </div>
        </GenUISection>
      )}
      <GenUIActions locked={locked} lockedLabel={resultLabel} primary={!locked ? { label: 'Apply selected fix', action: selected, msgId, onAction } : undefined} />
    </GenUICard>
  );
};

// ── Schema drift: column resolution card ──────────────────────────────────────

type ColumnOption = { name: string; type: 'string' | 'number' | 'date' | 'boolean'; description?: string };
const AVAILABLE_COLUMNS: ColumnOption[] = [
  { name: 'cost_bucket',    type: 'string', description: 'Normalized cost allocation bucket, post-reorg' },
  { name: 'cost_category',  type: 'string', description: 'High-level spend category for GL classification' },
  { name: 'department_code',type: 'string', description: 'Department identifier from HR master data' },
  { name: 'expense_type',   type: 'string', description: 'Expense classification for budget reporting' },
  { name: 'gl_segment',     type: 'string', description: 'General ledger segment identifier' },
  { name: 'spend_category', type: 'string', description: 'Spend grouping for finance dashboards' },
  { name: 'account_code',   type: 'string' }, { name: 'budget_code', type: 'string' },
  { name: 'allocation_code',type: 'string' }, { name: 'division_id', type: 'string' },
  { name: 'region_code',    type: 'string' }, { name: 'project_code', type: 'string' },
];
const TYPE_COLORS: Record<string, { text: string; bg: string }> = {
  string: { text: '#6b7280', bg: '#f3f4f6' }, number: { text: '#2563eb', bg: '#eff6ff' },
  date:   { text: '#7c3aed', bg: '#f5f3ff' }, boolean:{ text: '#d97706', bg: '#fef3c7' },
};
const TypeBadge: React.FC<{ type: string; mismatch?: boolean }> = ({ type, mismatch }) => {
  const { text, bg } = TYPE_COLORS[type] ?? { text: '#6b7280', bg: '#f3f4f6' };
  return <span style={{ fontSize: 10, fontWeight: fw.semibold, fontFamily: ff.mono, color: mismatch ? '#d97706' : text, background: mismatch ? '#fef3c7' : bg, borderRadius: 3, padding: '1px 5px', flexShrink: 0, border: mismatch ? '1px solid #fcd34d' : 'none' }}>{type}{mismatch ? ' ⚠' : ''}</span>;
};
const ColumnPickerDropdown: React.FC<{ options: ColumnOption[]; selected: string; suggested: string; removedType?: string; onSelect: (name: string) => void }> = ({ options, selected, suggested, removedType, onSelect }) => (
  <div style={{ position: 'absolute' as const, top: '100%', left: 0, marginTop: 4, zIndex: 20, background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 240, maxHeight: 260, overflowY: 'auto' as const, padding: '4px 0' }}>
    {options.map(opt => {
      const isCurrent = opt.name === selected;
      const isDefault = opt.name === suggested;
      const hasMismatch = !!removedType && opt.type !== removedType;
      return (
        <button key={opt.name} onClick={() => onSelect(opt.name)} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, width: '100%', padding: '7px 12px', background: isCurrent ? '#f0fdf4' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
          onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = '#f9fafb'; }}
          onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: opt.description ? 2 : 0 }}>
              <span style={{ fontFamily: ff.mono, fontSize: 12, color: isCurrent ? '#16a34a' : '#1a1a1a', fontWeight: isCurrent ? fw.semibold : fw.regular }}>{opt.name}</span>
              <TypeBadge type={opt.type} mismatch={hasMismatch} />
            </div>
            {opt.description && <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4, fontFamily: ff.primary }}>{opt.description}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 1, flexShrink: 0 }}>
            {isDefault && !isCurrent && <span style={{ fontSize: 10, color: '#aaa', fontFamily: ff.primary }}>suggested</span>}
            {isCurrent && <span style={{ fontSize: 12, color: '#16a34a' }}>✓</span>}
          </div>
        </button>
      );
    })}
  </div>
);

const SchemaDriftResolutionCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void; onOpenObject?: (name: string, highlightCol?: string) => void }> = ({ msgId, result, onAction, onOpenObject }) => {
  const locked = !!result;
  const didRemap = result === 'drift_resolution_sync';

  const [decisions, setDecisions] = React.useState<Record<string, 'remap' | 'remove'>>({
    cost_center: 'remap', allocation_type: 'remap',
  });
  const [remapTo, setRemapTo] = React.useState<Record<string, string>>({
    cost_center: 'cost_bucket', allocation_type: 'cost_category',
  });
  const [openPicker, setOpenPicker] = React.useState<string | null>(null);

  const columns = [
    { key: 'cost_center',     suggested: 'cost_bucket',   dependents: 9, note: 'Same data, new name — exact type match' },
    { key: 'allocation_type', suggested: 'cost_category', dependents: 6, note: 'Same data, new name — exact type match' },
  ];
  const dependentGroups = [
    { label: 'Answers',    dot: '#2563eb', mono: false, items: ['Q4 Cost Analysis', 'Budget Variance Report', 'FY Spend Summary', 'Regional Cost Breakdown'], highlightCol: 'cost_center' },
    { label: 'Liveboards', dot: '#7c3aed', mono: false, items: ['Finance Operations Dashboard', 'Executive Cost View', 'FnOps Monthly Review'], highlightCol: 'cost_center' },
    { label: 'Formulas',   dot: '#d97706', mono: true,  items: ['channel_cost_ratio', 'cost_per_campaign'], highlightCol: 'cost_center' },
  ];
  const suggested: Record<string, string> = { cost_center: 'cost_bucket', allocation_type: 'cost_category' };

  const removedCols = columns.filter(c => decisions[c.key] === 'remove');
  const breakCount = removedCols.reduce((acc, col) => Math.max(acc, col.dependents), 0);
  const allRemap = removedCols.length === 0;
  const ctaLabel = allRemap ? 'Apply mapping → all 9 continue' : removedCols.length === columns.length ? 'Apply — all 9 will break' : `Apply — ${breakCount} will break`;
  const ctaBg = allRemap ? c['content-brand'] : '#dc2626';

  return (
    <GenUICard locked={locked}>
      <GenUISection>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <GenUIBadge variant={locked ? 'green' : 'red'}>
            {didRemap ? '✓ Mapping applied' : locked ? '✓ Columns removed' : '2 columns removed from source'}
          </GenUIBadge>
          <button onClick={() => onOpenObject?.('FnOps Cost Model', 'cost_center')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#2563eb', fontFamily: ff.primary }} onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }} onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
            FnOps Cost Model <span style={{ opacity: 0.5, fontSize: 10 }}>↗</span>
          </button>
        </div>
      </GenUISection>

      {!locked && (
        <GenUISection bg="#f0f6ff">
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>✦</span>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: fw.semibold, color: '#1d4ed8', marginBottom: 3 }}>Both replacements carry the same data under new names.</div>
              <div style={{ fontSize: 12, color: '#3b5fa0', lineHeight: 1.55 }}>Map them and all 9 dependents continue without any changes — they'll never know the columns were renamed. Removing either one breaks the dependents that reference it.</div>
            </div>
          </div>
        </GenUISection>
      )}

      <GenUISection>
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
          {locked ? (didRemap ? 'Mapped columns' : 'Removed columns') : 'Decide per column'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {columns.map(col => {
            const decision = decisions[col.key];
            const isRemap = decision === 'remap';
            const isRemoved = decision === 'remove';
            const mappedTo = remapTo[col.key];
            const isPickerOpen = openPicker === col.key;
            return (
              <div key={col.key} style={{ background: isRemoved ? '#fff5f5' : '#fafafa', border: `1px solid ${isRemoved ? '#fecaca' : 'rgba(0,0,0,0.07)'}`, borderRadius: 8, padding: '10px 12px', transition: 'background 0.15s, border-color 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: ff.mono, fontSize: 12.5, fontWeight: fw.semibold, color: isRemoved ? '#dc2626' : '#1a1a1a', textDecoration: locked && !didRemap ? 'line-through' : 'none' }}>{col.key}</span>
                  <span style={{ fontSize: 11, color: '#aaa' }}>removed Jan 14</span>
                </div>
                {locked ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {didRemap ? (
                      <>
                        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ color: '#16a34a', flexShrink: 0 }}><path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span style={{ fontFamily: ff.mono, fontSize: 12, color: '#16a34a', fontWeight: fw.medium }}>{mappedTo}</span>
                        <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 'auto' }}>✓</span>
                      </>
                    ) : (
                      <span style={{ fontSize: 11.5, color: '#dc2626' }}>Removed — references cleared</span>
                    )}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 6, marginBottom: isRemap ? 6 : 0 }}>
                      <div style={{ position: 'relative' as const, flex: 1 }}>
                        <button
                          onClick={() => { setDecisions(d => ({ ...d, [col.key]: 'remap' })); if (isRemap) setOpenPicker(isPickerOpen ? null : col.key); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 6, border: `1.5px solid ${isRemap ? '#16a34a' : 'rgba(0,0,0,0.1)'}`, background: isRemap ? '#f0fdf4' : '#fff', color: isRemap ? '#16a34a' : '#666', fontSize: 12, fontWeight: isRemap ? fw.semibold : fw.regular, cursor: 'pointer', fontFamily: ff.primary, transition: 'all 0.12s' }}
                        >
                          {isRemap && <span style={{ fontSize: 11 }}>✓</span>}
                          <span style={{ flex: 1, textAlign: 'left' as const }}>Remap to</span>
                          <span style={{ fontFamily: ff.mono, fontSize: 11.5, color: isRemap ? '#16a34a' : '#999' }}>{mappedTo}</span>
                          {isRemap && <svg width="9" height="6" viewBox="0 0 9 6" fill="none" style={{ flexShrink: 0 }}><path d="M1 1l3.5 3.5L8 1" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round"/></svg>}
                        </button>
                        {isPickerOpen && (
                          <ColumnPickerDropdown options={AVAILABLE_COLUMNS} selected={mappedTo} suggested={suggested[col.key]} removedType="string" onSelect={name => { setRemapTo(r => ({ ...r, [col.key]: name })); setOpenPicker(null); }} />
                        )}
                      </div>
                      <button
                        onClick={() => { setDecisions(d => ({ ...d, [col.key]: 'remove' })); setOpenPicker(null); }}
                        style={{ padding: '5px 10px', borderRadius: 6, flexShrink: 0, border: `1.5px solid ${isRemoved ? '#dc2626' : 'rgba(0,0,0,0.1)'}`, background: isRemoved ? '#fef2f2' : '#fff', color: isRemoved ? '#dc2626' : '#888', fontSize: 12, fontWeight: isRemoved ? fw.semibold : fw.regular, cursor: 'pointer', fontFamily: ff.primary, transition: 'all 0.12s', whiteSpace: 'nowrap' as const }}
                      >
                        {isRemoved ? '✕ Remove it' : 'Remove it'}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: isRemap ? '#16a34a' : '#dc2626', lineHeight: 1.4 }}>
                      {isRemap ? col.note : `${col.dependents} dependents that reference ${col.key} will break`}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </GenUISection>

      <GenUISection last={locked}>
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
          {locked ? (didRemap ? 'Dependents remapped' : 'Dependents broken') : '9 dependents affected'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
          {dependentGroups.map(group => (
            <div key={group.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: group.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888' }}>{group.label}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, paddingLeft: 12 }}>
                {group.items.map(name => (
                  <button key={name} onClick={() => onOpenObject?.(name, group.highlightCol)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, border: '1px solid rgba(0,0,0,0.1)', background: locked && didRemap ? '#f0fdf4' : locked ? '#fff5f5' : '#fff', cursor: 'pointer', fontFamily: group.mono ? ff.mono : ff.primary, fontSize: group.mono ? 11 : 12, color: '#2563eb', fontWeight: fw.medium, transition: 'background 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = locked && didRemap ? '#f0fdf4' : locked ? '#fff5f5' : '#fff'; }}
                  >
                    {name} <span style={{ opacity: 0.4, fontSize: 9 }}>↗</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GenUISection>

      {!locked && (
        <GenUISection last bg="rgba(0,0,0,0.015)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!allRemap && <span style={{ fontSize: 11, color: '#dc2626', flex: 1 }}>{removedCols.length === columns.length ? 'All dependents will break — consider remapping instead' : `${breakCount} dependents will break from the removed column${removedCols.length > 1 ? 's' : ''}`}</span>}
            {allRemap && <span style={{ fontSize: 11, color: '#16a34a', flex: 1 }}>All 9 dependents continue working ✓</span>}
            <button onClick={() => onAction(allRemap ? 'drift_resolution_sync' : 'drift_resolution_remove', msgId)} style={{ padding: '6px 16px', borderRadius: 6, flexShrink: 0, border: 'none', background: ctaBg, color: '#fff', fontSize: 12, fontWeight: fw.semibold, cursor: 'pointer', fontFamily: ff.primary, transition: 'background 0.15s' }}>
              {ctaLabel}
            </button>
          </div>
        </GenUISection>
      )}
      {locked && (
        <GenUISection last bg="rgba(0,0,0,0.015)">
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <GenUIBadge variant="green">✓ {didRemap ? 'Mapping applied' : 'Columns removed'}</GenUIBadge>
          </div>
        </GenUISection>
      )}
    </GenUICard>
  );
};

// ── DriftPublishPreviewCard ───────────────────────────────────────────────────

const DriftPublishPreviewCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void; publishedVersion?: number }> = ({ msgId, result, onAction, publishedVersion }) => {
  const locked = !!result;
  const changes = [
    { icon: '↔', iconColor: '#2563eb', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#dc2626' }}>cost_center</span>{' → '}<span style={{ fontFamily: ff.mono, fontSize: 12, color: '#16a34a' }}>cost_bucket</span></> },
    { icon: '↔', iconColor: '#2563eb', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#dc2626' }}>allocation_type</span>{' → '}<span style={{ fontFamily: ff.mono, fontSize: 12, color: '#16a34a' }}>cost_category</span></> },
    { icon: 'ƒ', iconColor: '#d97706', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#1a1a1a' }}>channel_cost_ratio</span>{' — '}<span style={{ fontFamily: ff.mono, fontSize: 12, color: '#dc2626' }}>cost_center</span>{' → '}<span style={{ fontFamily: ff.mono, fontSize: 12, color: '#16a34a' }}>cost_bucket</span></> },
    { icon: 'ƒ', iconColor: '#d97706', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#1a1a1a' }}>cost_per_campaign</span>{' — '}<span style={{ fontFamily: ff.mono, fontSize: 12, color: '#dc2626' }}>cost_center</span>{' → '}<span style={{ fontFamily: ff.mono, fontSize: 12, color: '#16a34a' }}>cost_bucket</span></> },
    { icon: '↻', iconColor: '#d97706', detail: <span style={{ fontSize: 12, color: '#555' }}>7 dependents will re-query against the updated schema</span> },
  ];
  return (
    <GenUICard locked={locked}>
      <GenUISection><GenUIBadge variant={locked ? 'green' : 'blue'}>{locked ? '✓ Published — FnOps Cost Model v2' : 'Ready to publish · FnOps Cost Model v2'}</GenUIBadge></GenUISection>
      <GenUISection last={locked}>
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 10 }}>Changeset</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const }}>
          {changes.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < changes.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              <span style={{ width: 22, height: 22, borderRadius: 5, background: `${item.iconColor}14`, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: fw.semibold, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{item.detail}</span>
            </div>
          ))}
        </div>
      </GenUISection>
      {!locked && <GenUIActions locked={false} primary={{ label: publishedVersion && publishedVersion > 0 ? 'Update and publish →' : 'Publish model →', action: 'drift_publish_confirm', msgId, onAction }} />}
    </GenUICard>
  );
};

// ── Multi-model drift resolution card ─────────────────────────────────────────

const MULTI_AVAILABLE_COLUMNS: ColumnOption[] = [
  { name: 'q_target_amount', type: 'number', description: 'Quarterly revenue target in USD' },
  { name: 'q_target_value',  type: 'number', description: 'Target value for the current quarter' },
  { name: 'target_revenue',  type: 'number', description: 'Annual revenue target, prorated quarterly' },
  { name: 'forecast_amount', type: 'number' }, { name: 'region_code', type: 'string', description: 'Standardized region identifier' },
  { name: 'territory_code',  type: 'string', description: 'Sales territory short code' },
  { name: 'geo_segment',     type: 'string', description: 'Geographic market segment' },
  { name: 'region_id',       type: 'string' }, { name: 'deal_stage', type: 'string', description: 'CRM deal stage from Salesforce' },
  { name: 'opportunity_stage', type: 'string', description: 'Opportunity stage from CRM pipeline' },
  { name: 'stage_name',      type: 'string' }, { name: 'pipeline_stage_id', type: 'string' },
  { name: 'account_segment', type: 'string' }, { name: 'close_quarter', type: 'string' },
  { name: 'deal_type',       type: 'string' }, { name: 'source_channel', type: 'string' },
];

const DriftMultiResolutionCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void }> = ({ msgId, result, onAction }) => {
  const locked = !!result;
  const didRemap  = result === 'drift_multi_resolution_sync';
  const didRemove = result === 'drift_multi_resolution_remove';
  const suggested: Record<string, string> = { quarterly_target: 'q_target_amount', forecast_region: 'region_code', pipeline_stage: 'deal_stage' };
  const removedTypes: Record<string, string> = { quarterly_target: 'number', forecast_region: 'string', pipeline_stage: 'string' };
  const mappings = ['quarterly_target', 'forecast_region', 'pipeline_stage'];
  const [selections, setSelections] = React.useState<Record<string, string>>({ ...suggested });
  const [openPicker, setOpenPicker] = React.useState<string | null>(null);
  const [openModels, setOpenModels] = React.useState<Set<string>>(new Set());
  const [openContents, setOpenContents] = React.useState<Set<string>>(new Set());
  const toggleModel = (l: string) => setOpenModels(p => { const n = new Set(p); n.has(l) ? n.delete(l) : n.add(l); return n; });
  const toggleContent = (k: string) => setOpenContents(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const modelGroups = [
    { label: 'Revenue Forecast', total: 6, contents: [
      { label: 'Answers', count: 3, dot: '#2563eb', mono: false, examples: ['Q1 Revenue Projection', 'YoY Growth Analysis', 'Regional Forecast Summary'] },
      { label: 'Liveboards', count: 2, dot: '#7c3aed', mono: false, examples: ['Revenue Dashboard', 'Executive Forecast'] },
      { label: 'Formulas', count: 1, dot: '#d97706', mono: true, examples: ['target_attainment_rate'] },
    ]},
    { label: 'Pipeline Health', total: 6, contents: [
      { label: 'Answers', count: 2, dot: '#2563eb', mono: false, examples: ['Pipeline Velocity Report', 'Stage Conversion Analysis'] },
      { label: 'Liveboards', count: 2, dot: '#7c3aed', mono: false, examples: ['Sales Pipeline Overview', 'Deal Progress Tracker'] },
      { label: 'Formulas', count: 2, dot: '#d97706', mono: true, examples: ['pipeline_coverage_ratio', 'stage_conversion_rate'] },
    ]},
  ];
  return (
    <GenUICard locked={locked}>
      <GenUISection>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <GenUIBadge variant={locked ? 'green' : 'red'}>{didRemap ? '✓ Remapped across both models' : didRemove ? '✓ Removed from both models' : '3 columns removed from source'}</GenUIBadge>
          <span style={{ fontSize: 11, color: '#999' }}>warehouse source</span>
        </div>
      </GenUISection>
      <GenUISection>
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 10 }}>{didRemove ? 'Removed' : 'Mapping'}</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const }}>
          {mappings.map((col, i) => {
            const sel = selections[col]; const isSuggested = sel === suggested[col]; const isOpen = openPicker === col;
            return (
              <div key={col} style={{ padding: '8px 0', borderBottom: i < mappings.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: ff.mono, fontSize: 12, fontWeight: fw.medium, color: didRemove ? '#aaa' : '#1a1a1a', textDecoration: didRemove ? 'line-through' : 'none', minWidth: 140, flexShrink: 0 }}>{col}</span>
                  {!didRemove && (<>
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ flexShrink: 0, color: '#bbb' }}><path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <div style={{ position: 'relative' as const, flex: 1 }}>
                      {locked ? <span style={{ fontFamily: ff.mono, fontSize: 12, color: '#16a34a', fontWeight: fw.medium }}>{sel}</span> : (
                        <button onClick={() => setOpenPicker(isOpen ? null : col)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: ff.mono, fontSize: 12, fontWeight: fw.medium, color: '#16a34a', background: '#f0fdf4', border: `1px solid ${isOpen ? '#16a34a' : '#bbf7d0'}`, borderRadius: 5, padding: '2px 8px', cursor: 'pointer', lineHeight: 1.5 }}>
                          {sel}<svg width="9" height="6" viewBox="0 0 9 6" fill="none"><path d="M1 1l3.5 3.5L8 1" stroke="#16a34a" strokeWidth="1.3" strokeLinecap="round"/></svg>
                        </button>
                      )}
                      {isOpen && <ColumnPickerDropdown options={MULTI_AVAILABLE_COLUMNS} selected={sel} suggested={suggested[col]} removedType={removedTypes[col]} onSelect={name => { setSelections(s => ({ ...s, [col]: name })); setOpenPicker(null); }} />}
                    </div>
                    {!locked && isSuggested && <span style={{ fontSize: 10, color: '#16a34a', background: '#f0fdf4', padding: '1px 6px', borderRadius: 4, flexShrink: 0, fontWeight: fw.medium }}>Suggested</span>}
                    {!locked && !isSuggested && <button onClick={() => setSelections(s => ({ ...s, [col]: suggested[col] }))} style={{ fontSize: 10, color: '#999', background: 'transparent', border: 'none', cursor: 'pointer', padding: '1px 4px', flexShrink: 0, fontFamily: ff.primary }}>Reset</button>}
                    {locked && <span style={{ fontSize: 12, color: '#16a34a', marginLeft: 'auto' }}>✓</span>}
                  </>)}
                  {didRemove && <span style={{ fontSize: 11, color: '#bbb', marginLeft: 'auto' }}>removed</span>}
                </div>
              </div>
            );
          })}
        </div>
      </GenUISection>
      <GenUISection>
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 6 }}>{locked ? (didRemove ? 'References cleared' : 'Dependents remapped') : 'Impact across models'}</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const }}>
          {modelGroups.map((model, i) => {
            const isOpen = openModels.has(model.label);
            return (
              <div key={model.label} style={{ borderBottom: i < modelGroups.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <button onClick={() => !locked && toggleModel(model.label)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 0', background: 'none', border: 'none', cursor: locked ? 'default' : 'pointer', textAlign: 'left' as const }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: '#dc2626', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, color: '#222', fontWeight: fw.medium }}>{model.label}</span>
                  <span style={{ fontSize: 12, color: '#888', marginRight: locked ? 0 : 6 }}>{model.total} dependents</span>
                  {!locked && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#999', transition: 'transform 0.15s', transform: isOpen ? 'rotate(180deg)' : 'none' }}><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                {isOpen && !locked && (
                  <div style={{ paddingLeft: 17, paddingBottom: 6 }}>
                    {model.contents.map((ct, ci) => {
                      const contentKey = `${model.label}:${ct.label}`; const isCtOpen = openContents.has(contentKey);
                      return (
                        <div key={ct.label} style={{ borderBottom: ci < model.contents.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                          <button onClick={() => toggleContent(contentKey)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: ct.dot, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 13, color: '#333', fontWeight: fw.medium }}>{ct.label}</span>
                            <span style={{ fontSize: 13, fontWeight: fw.semibold, color: '#1a1a1a', marginRight: 6 }}>{ct.count}</span>
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#bbb', transition: 'transform 0.15s', transform: isCtOpen ? 'rotate(180deg)' : 'none' }}><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </button>
                          {isCtOpen && (
                            <div style={{ paddingLeft: 14, paddingBottom: 8 }}>
                              {ct.examples.map(name => (
                                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
                                  <span style={{ color: '#ddd', fontSize: 10 }}>—</span>
                                  <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' as const, lineHeight: 1.6, ...(ct.mono ? { fontFamily: ff.mono, fontSize: 12, color: '#2563eb' } : { fontFamily: ff.primary, fontSize: 13, color: '#2563eb' }) }}
                                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }} onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>{name}</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </GenUISection>
      <GenUISection last={locked}>{!locked && <div style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: '#d97706' }}>ⓘ</span> Mapping applies to both models — changes publish together</div>}</GenUISection>
      {!locked && <GenUIActions locked={false} secondary={{ label: 'Remove all', action: 'drift_multi_resolution_remove', msgId, onAction }} primary={{ label: 'Apply mapping →', action: 'drift_multi_resolution_sync', msgId, onAction }} />}
    </GenUICard>
  );
};

// ── DriftMultiPublishPreviewCard ──────────────────────────────────────────────

const DriftMultiPublishPreviewCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void; publishedVersion?: number }> = ({ msgId, result, onAction, publishedVersion }) => {
  const locked = !!result;
  const changes = [
    { icon: '↔', iconColor: '#2563eb', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#dc2626' }}>quarterly_target</span>{' → '}<span style={{ fontFamily: ff.mono, fontSize: 12, color: '#16a34a' }}>q_target_amount</span></> },
    { icon: '↔', iconColor: '#2563eb', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#dc2626' }}>forecast_region</span>{' → '}<span style={{ fontFamily: ff.mono, fontSize: 12, color: '#16a34a' }}>region_code</span></> },
    { icon: '↔', iconColor: '#2563eb', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#dc2626' }}>pipeline_stage</span>{' → '}<span style={{ fontFamily: ff.mono, fontSize: 12, color: '#16a34a' }}>deal_stage</span></> },
    { icon: 'ƒ', iconColor: '#d97706', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#1a1a1a' }}>target_attainment_rate</span>{' — column substituted'}</> },
    { icon: 'ƒ', iconColor: '#d97706', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#1a1a1a' }}>pipeline_coverage_ratio</span>{' — column substituted'}</> },
    { icon: 'ƒ', iconColor: '#d97706', detail: <><span style={{ fontFamily: ff.mono, fontSize: 12, color: '#1a1a1a' }}>stage_conversion_rate</span>{' — column substituted'}</> },
    { icon: '↻', iconColor: '#d97706', detail: <span style={{ fontSize: 12, color: '#555' }}>12 dependents will re-query across Revenue Forecast + Pipeline Health</span> },
  ];
  return (
    <GenUICard locked={locked}>
      <GenUISection><GenUIBadge variant={locked ? 'green' : 'blue'}>{locked ? '✓ Published — Revenue Forecast v2 + Pipeline Health v2' : 'Ready to publish · 2 models'}</GenUIBadge></GenUISection>
      <GenUISection last={locked}>
        <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#888', marginBottom: 10 }}>Changeset</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const }}>
          {changes.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < changes.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
              <span style={{ width: 22, height: 22, borderRadius: 5, background: `${item.iconColor}14`, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: fw.semibold, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{item.detail}</span>
            </div>
          ))}
        </div>
      </GenUISection>
      {!locked && <GenUIActions locked={false} primary={{ label: publishedVersion && publishedVersion > 0 ? 'Update and publish 2 models →' : 'Publish 2 models →', action: 'drift_multi_publish_confirm', msgId, onAction }} />}
    </GenUICard>
  );
};

// ── Completion cards ──────────────────────────────────────────────────────────

const DriftMultiCompleteCard: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  React.useEffect(() => { onComplete?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const items = ['3 columns remapped across both models', '3 formulas rewritten', '12 dependents updated (answers + liveboards)', 'Revenue Forecast re-published — v2', 'Pipeline Health re-published — v2', 'Monitoring alert cleared'];
  return (
    <GenUICard>
      <GenUISection><GenUIBadge variant="green">✓ Schema drift resolved — 2 models</GenUIBadge></GenUISection>
      <GenUISection last>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {items.map((item, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 12, color: '#16a34a', flexShrink: 0 }}>✓</span><span style={{ fontSize: 13, color: '#333' }}>{item}</span></div>)}
        </div>
      </GenUISection>
    </GenUICard>
  );
};

const SchemaDriftCompleteCard: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  React.useEffect(() => { onComplete?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const items = ['2 columns remapped', '2 formulas rewritten', '7 dependents updated (answers + liveboards)', 'Model re-published — v2', 'Monitoring alert cleared'];
  return (
    <GenUICard>
      <GenUISection><GenUIBadge variant="green">✓ Schema drift resolved</GenUIBadge></GenUISection>
      <GenUISection last>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {items.map((item, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 12, color: '#16a34a', flexShrink: 0 }}>✓</span><span style={{ fontSize: 13, color: '#333' }}>{item}</span></div>)}
        </div>
      </GenUISection>
    </GenUICard>
  );
};

// ── Blast Radius cards (ins-d3 schema drift detection flow) ───────────────────

const BLAST_BROKEN_ANSWERS = [
  'Q4 Revenue by Region', 'Win Rate by Territory', 'Sales Rep Leaderboard',
  'Pipeline by Stage', 'Closed Won Trend', 'Monthly Revenue Summary',
  'Revenue vs Target', 'YTD Revenue Breakdown',
];
const BLAST_BROKEN_LIVEBOARDS = [
  "CEO's Daily Pulse Liveboard", 'Executive Revenue Dashboard',
  'Sales Performance Overview', 'Regional Revenue Breakdown',
];
const BLAST_AVAILABLE_COLUMNS: ColumnOption[] = [
  { name: 'gm_final_amt',      type: 'number', description: 'Gross margin after adjustments, post-migration' },
  { name: 'margin_amt',        type: 'number', description: 'Pre-adjustment gross margin figure' },
  { name: 'gross_profit',      type: 'number', description: 'Revenue minus cost of goods sold' },
  { name: 'location_key',      type: 'string', description: 'Warehouse location identifier — replaces store_id' },
  { name: 'store_location_id', type: 'string', description: 'Full store location path' },
  { name: 'venue_id',          type: 'string', description: 'Physical venue identifier' },
  { name: 'site_code',         type: 'string', description: 'Site identifier for reporting' },
];
const RECONCILE_COLUMNS = [
  { key: 'gross_margin', type: 'number', suggested: 'gm_final_amt',   confidence: 95,
    reasoning: 'Exact semantic match — both represent post-adjustment gross margin. Same type (number), same aggregation behavior.',
    refs: 4 },
  { key: 'store_id',     type: 'string', suggested: 'location_key',   confidence: 88,
    reasoning: 'High confidence match — both are location identifiers. Naming convention changed during migration, but join behavior is identical.',
    refs: 2 },
];

const BlastRadiusCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void; onOpenObject?: (name: string, highlightCol?: string) => void }> = ({ msgId, result, onAction, onOpenObject }) => {
  const locked = !!result;
  const [impactTab, setImpactTab] = React.useState<'models' | 'downstream'>('models');
  const brokenModels = [
    { name: 'Sales Performance', formulas: 3, answers: 5, liveboards: 2 },
    { name: 'Revenue Summary',   formulas: 1, answers: 3, liveboards: 2 },
  ];
  return (
    <div style={{ marginTop: sp.C, background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, padding: '22px 24px 20px', opacity: locked ? 0.7 : 1, transition: 'opacity 0.2s', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      {/* What happened */}
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: fw.semibold, color: '#0f172a', lineHeight: 1.4, letterSpacing: '-0.01em' }}>Schema drift detected</h3>
        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
          <button onClick={() => onOpenObject?.('fact_sales')} style={{ background: 'none', border: 'none', padding: 0, fontFamily: ff.mono, color: '#2563eb', cursor: onOpenObject ? 'pointer' : 'default', fontSize: 13, textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 120ms' }} onMouseEnter={e => { e.currentTarget.style.textDecorationColor = '#2563eb'; }} onMouseLeave={e => { e.currentTarget.style.textDecorationColor = 'transparent'; }}>fact_sales</button>
          {' removed 2 columns from '}
          <span style={{ fontFamily: ff.mono, color: '#0f172a' }}>Snowflake_Sales_Prod</span>
          {' at 2:14 AM on Jan 12'}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
          <span style={{ fontFamily: ff.mono, fontSize: 13, color: '#0f172a', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: 5, fontWeight: fw.medium }}>gross_margin</span>
          <span style={{ fontFamily: ff.mono, fontSize: 13, color: '#0f172a', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: 5, fontWeight: fw.medium }}>store_id</span>
        </div>
      </div>
      {/* Why it matters */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: 8, padding: '12px 14px', marginBottom: 18 }}>
        <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>These columns were referenced by formulas and joins across your models. Queries using them are now failing.</div>
      </div>
      {/* Impact tabbed */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: fw.semibold, color: '#0f172a' }}>Impact</div>
          <div style={{ display: 'flex', gap: 2, background: '#f8fafc', borderRadius: 6, padding: 2 }}>
            {(['models', 'downstream'] as const).map(tab => (
              <button key={tab} onClick={() => setImpactTab(tab)} style={{ background: impactTab === tab ? '#fff' : 'transparent', border: impactTab === tab ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent', borderRadius: 5, padding: '5px 12px', fontSize: 13, fontWeight: fw.medium, color: impactTab === tab ? '#0f172a' : '#64748b', cursor: 'pointer', fontFamily: ff.primary, transition: 'all 120ms', boxShadow: impactTab === tab ? '0 1px 2px rgba(0,0,0,0.04)' : 'none' }}>
                {tab === 'models' ? 'Models · 2' : 'Downstream · 12'}
              </button>
            ))}
          </div>
        </div>
        {impactTab === 'models' && (
          <div style={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '14px 16px', background: '#fafafa' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontVariantNumeric: 'tabular-nums' as const }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                  {['Model', 'Formulas', 'Answers', 'Liveboards'].map((h, i) => (
                    <th key={h} style={{ fontSize: 11, fontWeight: fw.semibold, color: '#64748b', textAlign: i === 0 ? 'left' as const : 'right' as const, padding: '0 0 8px 0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brokenModels.map((model, i) => (
                  <tr key={model.name} style={{ borderBottom: i < brokenModels.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <td style={{ padding: '10px 0', fontSize: 13, color: '#0f172a', fontWeight: fw.medium }}>
                      <button onClick={() => onOpenObject?.(model.name)} style={{ background: 'none', border: 'none', padding: 0, color: '#2563eb', cursor: onOpenObject ? 'pointer' : 'default', fontSize: 13, fontWeight: fw.medium, fontFamily: ff.primary, textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 120ms' }} onMouseEnter={e => { e.currentTarget.style.textDecorationColor = '#2563eb'; }} onMouseLeave={e => { e.currentTarget.style.textDecorationColor = 'transparent'; }}>{model.name}</button>
                    </td>
                    <td style={{ padding: '10px 0', fontSize: 13, color: '#475569', textAlign: 'right' as const }}>{model.formulas}</td>
                    <td style={{ padding: '10px 0', fontSize: 13, color: '#475569', textAlign: 'right' as const }}>{model.answers}</td>
                    <td style={{ padding: '10px 0', fontSize: 13, color: '#475569', textAlign: 'right' as const }}>{model.liveboards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {impactTab === 'downstream' && (
          <div style={{ border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '14px 16px', background: '#fafafa' }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>4 liveboards</div>
              <div style={{ display: 'grid', gap: 2 }}>
                {BLAST_BROKEN_LIVEBOARDS.map(name => (
                  <button key={name} onClick={() => onOpenObject?.(name)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 6, cursor: onOpenObject ? 'pointer' : 'default', fontFamily: ff.primary, textAlign: 'left' as const, fontSize: 13, color: '#0f172a', fontWeight: fw.regular, transition: 'all 120ms' }} onMouseEnter={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
                    <span style={{ flex: 1 }}>{name}</span>
                    <span style={{ opacity: 0.3, fontSize: 12 }}>↗</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: fw.semibold, color: '#64748b', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>8 answers</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {BLAST_BROKEN_ANSWERS.map(name => (
                  <button key={name} onClick={() => onOpenObject?.(name)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 6, cursor: onOpenObject ? 'pointer' : 'default', fontFamily: ff.primary, textAlign: 'left' as const, fontSize: 13, color: '#0f172a', fontWeight: fw.regular, transition: 'all 120ms' }} onMouseEnter={e => { e.currentTarget.style.background = '#fafafa'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }} onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{name}</span>
                    <span style={{ opacity: 0.3, fontSize: 12, flexShrink: 0 }}>↗</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {!locked ? (
          <button onClick={() => onAction('blast_radius_review', msgId)} style={{ background: c['content-brand'], color: '#fff', border: 'none', borderRadius: 7, padding: '9px 16px', fontSize: 13, fontWeight: fw.semibold, cursor: 'pointer', fontFamily: ff.primary, display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'background 120ms', boxShadow: '0 1px 2px rgba(37,99,235,0.2)' }} onMouseEnter={e => (e.currentTarget.style.background = '#1d4ed8')} onMouseLeave={e => (e.currentTarget.style.background = c['content-brand'])}>
            Review fix plan
          </button>
        ) : (
          <span style={{ fontSize: 13, fontWeight: fw.medium, color: '#1e40af', background: '#eff6ff', borderRadius: 5, padding: '5px 11px' }}>Reviewing fix plan...</span>
        )}
      </div>
    </div>
  );
};

const SchemaReconciliationCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void; onOpenObject?: (name: string, highlightCol?: string) => void }> = ({ msgId, result, onAction, onOpenObject }) => {
  const locked = !!result;
  const [remapTo, setRemapTo] = React.useState<Record<string, string>>({ gross_margin: 'gm_final_amt', store_id: 'location_key' });
  const [columnActions, setColumnActions] = React.useState<Record<string, 'replace' | 'remove'>>({ gross_margin: 'replace', store_id: 'replace' });
  const [openPicker, setOpenPicker] = React.useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = React.useState<string | null>(null);
  const confidenceBg  = (pct: number) => pct >= 90 ? '#dcfce7' : '#fef9c3';
  const confidenceCol = (pct: number) => pct >= 90 ? '#15803d' : '#854d0e';
  const replaceCount = Object.values(columnActions).filter(a => a === 'replace').length;
  const removeCount  = Object.values(columnActions).filter(a => a === 'remove').length;
  return (
    <div style={{ marginTop: 12, background: '#fff', border: '1px solid rgba(15,23,42,0.1)', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.4 }}>Found replacement columns</h3>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
          <button onClick={() => onOpenObject?.('fact_sales')} style={{ background: 'none', border: 'none', padding: 0, fontFamily: ff.mono, color: '#2563eb', cursor: onOpenObject ? 'pointer' : 'default', fontSize: 13, textDecoration: 'underline', textDecorationColor: 'transparent', transition: 'text-decoration-color 120ms' }} onMouseEnter={e => { e.currentTarget.style.textDecorationColor = '#2563eb'; }} onMouseLeave={e => { e.currentTarget.style.textDecorationColor = 'transparent'; }}>fact_sales</button>
          {' schema changed — 2 columns removed but successors exist in the updated table'}
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Recommended replacements</div>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 14 }}>Both replacements are semantically equivalent — same type, same join behavior. You can safely replace references or delete them.</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          {RECONCILE_COLUMNS.map(col => {
            const mappedTo = remapTo[col.key];
            const action = columnActions[col.key];
            const isHovered = hoveredCol === col.key;
            const isPickerOpen = openPicker === col.key;
            return (
              <div key={col.key} style={{ position: 'relative' as const }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: ff.mono, fontSize: 12.5, fontWeight: 600, color: '#dc2626', textDecoration: locked ? 'line-through' : 'none', flexShrink: 0, minWidth: 110 }}>{col.key}</span>
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style={{ flexShrink: 0, color: '#cbd5e1' }}><path d="M1 5h11M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {action === 'replace' ? (
                    <div style={{ position: 'relative' as const, flex: 1 }}>
                      {locked ? (
                        <span style={{ fontFamily: ff.mono, fontSize: 12.5, fontWeight: 600, color: '#16a34a' }}>{mappedTo}</span>
                      ) : (
                        <button onClick={() => setOpenPicker(isPickerOpen ? null : col.key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: ff.mono, fontSize: 12.5, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: `1px solid ${isPickerOpen ? '#16a34a' : '#bbf7d0'}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', lineHeight: 1.5 }}>
                          {mappedTo}
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}><path d="M1 1l4 4 4-4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      )}
                      {isPickerOpen && <ColumnPickerDropdown options={BLAST_AVAILABLE_COLUMNS} selected={mappedTo} suggested={col.suggested} removedType={col.type} onSelect={name => { setRemapTo(r => ({ ...r, [col.key]: name })); setOpenPicker(null); }} />}
                    </div>
                  ) : (
                    <span style={{ fontFamily: ff.mono, fontSize: 12.5, fontWeight: 600, color: '#94a3b8', fontStyle: 'italic', flex: 1 }}>will be removed</span>
                  )}
                  {action === 'replace' && (
                    <span onMouseEnter={() => setHoveredCol(col.key)} onMouseLeave={() => setHoveredCol(null)} style={{ fontSize: 11, fontWeight: 600, flexShrink: 0, background: confidenceBg(col.confidence), color: confidenceCol(col.confidence), borderRadius: 12, padding: '3px 9px', cursor: 'help', position: 'relative' as const }}>
                      {col.confidence}%
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: locked ? 'default' : 'pointer', fontSize: 12, color: '#64748b' }}>
                      <input type="radio" name={`action-${col.key}`} checked={action === 'replace'} onChange={() => setColumnActions(prev => ({ ...prev, [col.key]: 'replace' }))} disabled={locked} style={{ cursor: locked ? 'default' : 'pointer' }} />
                      Replace
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: locked ? 'default' : 'pointer', fontSize: 12, color: '#64748b' }}>
                      <input type="radio" name={`action-${col.key}`} checked={action === 'remove'} onChange={() => setColumnActions(prev => ({ ...prev, [col.key]: 'remove' }))} disabled={locked} style={{ cursor: locked ? 'default' : 'pointer' }} />
                      Remove
                    </label>
                  </div>
                </div>
                {isHovered && action === 'replace' && !locked && (
                  <div style={{ position: 'absolute' as const, top: '100%', right: 0, marginTop: 6, background: '#1e293b', color: '#f1f5f9', fontSize: 12, lineHeight: 1.5, borderRadius: 8, padding: '10px 12px', maxWidth: 320, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 10 }}>
                    {col.reasoning}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {!locked ? (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>2 Models · 8 Answers · 4 Liveboards</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {replaceCount > 0 && `${replaceCount} to replace`}{replaceCount > 0 && removeCount > 0 && ' · '}{removeCount > 0 && `${removeCount} to remove`}
            </div>
          </div>
          <button onClick={() => onAction('schema_reconcile_heal', msgId)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>Apply changes</button>
        </div>
      ) : (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '5px 11px' }}>✓ Updating in progress...</span>
        </div>
      )}
    </div>
  );
};

const RestorePointCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void; onComplete?: () => void }> = ({ msgId, result, onAction, onComplete }) => {
  const rolledBack = result === 'restore_rollback';
  React.useEffect(() => { onComplete?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div style={{ marginTop: 12, background: '#fff', border: rolledBack ? '1px solid rgba(15,23,42,0.1)' : '1px solid #bbf7d0', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        {!rolledBack && <span style={{ fontSize: 20, lineHeight: 1 }}>🎉</span>}
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#0f172a', lineHeight: 1.4 }}>
          {rolledBack ? 'Rolled back to pre-reconciliation' : 'Columns successfully replaced and dependents updated'}
        </h3>
      </div>
      {!rolledBack && (
        <div style={{ marginBottom: 18 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {[
              { icon: 'check', label: <span><strong style={{ color: '#0f172a', fontWeight: 600 }}>2</strong> columns remapped</span> },
              { icon: 'check', label: <span><strong style={{ color: '#0f172a', fontWeight: 600 }}>6</strong> formulas rewritten</span> },
              { icon: 'check', label: <span><strong style={{ color: '#0f172a', fontWeight: 600 }}>14</strong> dependents updated</span> },
              { icon: 'heart', label: <span>~6 hours of manual work automated</span> },
            ].map((item, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  {item.icon === 'check'
                    ? <path d="M13 4L6 11L3 8" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    : <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  }
                </svg>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{rolledBack ? 'Restored to previous state' : 'Restore point saved'}</div>
          {!result && (
            <button onClick={() => onAction('restore_rollback', msgId)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>↩ Roll back</button>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>"Pre-reconciliation" · Apr 14, 2:47 PM</div>
        {rolledBack && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#92400e', lineHeight: 1.5, background: '#fffbeb', border: '1px solid #fde047', borderRadius: 8, padding: '10px 12px' }}>
            All 14 objects restored to their pre-reconciliation state. Re-run the fix plan when ready.
          </div>
        )}
      </div>
    </div>
  );
};

// ── NextIssueCard ─────────────────────────────────────────────────────────────

const NextIssueCard: React.FC<{ msgId: string; result?: string; onAction: (action: string, msgId: string) => void }> = ({ msgId, result, onAction }) => {
  const locked = !!result;
  const dismissed = result === 'next_issue_dismiss';
  return (
    <GenUICard locked={locked}>
      <GenUISection>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <GenUIBadge variant={locked ? (dismissed ? 'grey' : 'green') : 'red'}>{locked ? (dismissed ? 'Dismissed' : '✓ Acknowledged') : 'P1 · Debugging'}</GenUIBadge>
          <span style={{ fontSize: 11, color: '#999' }}>2h ago</span>
        </div>
      </GenUISection>
      <GenUISection last={locked}>
        <div style={{ fontSize: 14, fontWeight: fw.semibold, color: '#111', marginBottom: 5 }}>Sync failure cascade</div>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>dbt Cloud · <span style={{ fontWeight: fw.medium, color: '#333' }}>sales_analytics</span> failed — 3 downstream models blocked</div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: fw.semibold, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, padding: '2px 7px' }}>3 models blocked</span>
          <span style={{ fontSize: 11, color: '#aaa' }}>Sales Analytics · Marketing Rollup · Exec Summary</span>
        </div>
      </GenUISection>
      {!locked && <GenUIActions locked={false} secondary={{ label: 'Later', action: 'next_issue_dismiss', msgId, onAction }} primary={{ label: 'View connection →', action: 'next_issue_view_connection', msgId, onAction }} />}
    </GenUICard>
  );
};

export default AgentPanel;
