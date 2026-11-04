/**
 * Data Cache — mock data
 *
 * Four orgs, one per scenario. "Models cached" is the Pulse data set (every
 * caching state: healthy full, healthy custom, failed last run, model changed,
 * never cached, not cacheable) with warehouse usage added. The other three come
 * from the PLG reference (2 Nov): nothing cached yet, so the Data Cache page and
 * the Caching tab show their hooks. Org-wide figures live on the Org; the model
 * lists are the sample the prototype renders.
 */

import type { CacheRun, Cacheability, Column, DataModel, ModelTable, ModelUsage, Org, Plan, Schedule } from './types';

/** The free allowance in the plan. Both numbers are LaunchDarkly-configurable in the product. */
export const plan: Plan = { freeHours: 1000, freeGB: 500 };

const col = (id: string, name: string, type: Column['type']): Column => ({ id, name, type });

const dailyNineAm: Schedule = {
  frequency: 'daily',
  hour: 9,
  minute: 0,
  excludeWeekends: true,
  timezone: 'Asia/Calcutta',
};

// ── Reusable table shapes ───────────────────────────────────────────────────
const salesTables: ModelTable[] = [
  {
    id: 'orders',
    name: 'orders',
    rowCount: 1_500_000,
    columns: [
      col('order_id', 'order_id', 'string'),
      col('order_date', 'order_date', 'date'),
      col('ship_date', 'ship_date', 'date'),
      col('amount', 'amount', 'number'),
      col('customer_id', 'customer_id', 'string'),
    ],
  },
  {
    id: 'customers',
    name: 'customers',
    rowCount: 84_200,
    columns: [
      col('customer_id', 'customer_id', 'string'),
      col('created_at', 'created_at', 'date'),
      col('region', 'region', 'string'),
      col('segment', 'segment', 'string'),
    ],
  },
  {
    id: 'products',
    name: 'products',
    rowCount: 12_400,
    columns: [
      col('product_id', 'product_id', 'string'),
      col('category', 'category', 'string'),
      col('launch_date', 'launch_date', 'date'),
    ],
  },
  {
    id: 'line_items',
    name: 'line_items',
    rowCount: 6_100_000,
    columns: [
      col('line_id', 'line_id', 'string'),
      col('order_id', 'order_id', 'string'),
      col('qty', 'qty', 'number'),
      col('unit_price', 'unit_price', 'number'),
    ],
  },
  {
    id: 'returns',
    name: 'returns',
    rowCount: 91_000,
    columns: [
      col('return_id', 'return_id', 'string'),
      col('return_date', 'return_date', 'date'),
      col('reason', 'reason', 'string'),
    ],
  },
];

const marketingTables: ModelTable[] = [
  {
    id: 'sessions',
    name: 'web_sessions',
    rowCount: 8_200_000,
    columns: [
      col('session_id', 'session_id', 'string'),
      col('session_ts', 'session_ts', 'date'),
      col('channel', 'channel', 'string'),
      col('landing_page', 'landing_page', 'string'),
    ],
  },
  {
    id: 'campaigns',
    name: 'campaigns',
    rowCount: 3_400,
    columns: [
      col('campaign_id', 'campaign_id', 'string'),
      col('start_date', 'start_date', 'date'),
      col('end_date', 'end_date', 'date'),
      col('spend', 'spend', 'number'),
    ],
  },
  {
    id: 'touchpoints',
    name: 'touchpoints',
    rowCount: 21_000_000,
    columns: [
      col('touch_id', 'touch_id', 'string'),
      col('touch_ts', 'touch_ts', 'date'),
      col('campaign_id', 'campaign_id', 'string'),
      col('lead_id', 'lead_id', 'string'),
    ],
  },
];

const ledgerTables: ModelTable[] = [
  {
    id: 'gl_entries',
    name: 'gl_entries',
    rowCount: 6_100_000,
    columns: [
      col('entry_id', 'entry_id', 'string'),
      col('posted_date', 'posted_date', 'date'),
      col('account', 'account', 'string'),
      col('amount', 'amount', 'number'),
    ],
  },
  {
    id: 'accounts',
    name: 'accounts',
    rowCount: 4_800,
    columns: [
      col('account', 'account', 'string'),
      col('opened_date', 'opened_date', 'date'),
      col('type', 'type', 'string'),
    ],
  },
  {
    id: 'fx_rates',
    name: 'fx_rates',
    rowCount: 320_000,
    columns: [
      col('rate_date', 'rate_date', 'date'),
      col('currency', 'currency', 'string'),
      col('rate', 'rate', 'number'),
    ],
  },
];

// A wide model (10 tables) — exercises the scrollable per-table list in the
// Caching Settings modal (custom scope).
const hrTables: ModelTable[] = [
  { id: 'employees', name: 'employees', rowCount: 48_000, columns: [col('employee_id', 'employee_id', 'string'), col('hire_date', 'hire_date', 'date'), col('department_id', 'department_id', 'string')] },
  { id: 'departments', name: 'departments', rowCount: 320, columns: [col('department_id', 'department_id', 'string'), col('name', 'name', 'string')] },
  { id: 'compensation', name: 'compensation', rowCount: 210_000, columns: [col('employee_id', 'employee_id', 'string'), col('effective_date', 'effective_date', 'date'), col('base_salary', 'base_salary', 'number')] },
  { id: 'org_hierarchy', name: 'org_hierarchy', rowCount: 48_000, columns: [col('employee_id', 'employee_id', 'string'), col('manager_id', 'manager_id', 'string')] },
  { id: 'attrition', name: 'attrition', rowCount: 12_400, columns: [col('employee_id', 'employee_id', 'string'), col('term_date', 'term_date', 'date'), col('reason', 'reason', 'string')] },
  { id: 'reviews', name: 'performance_reviews', rowCount: 96_000, columns: [col('review_id', 'review_id', 'string'), col('review_date', 'review_date', 'date'), col('rating', 'rating', 'number')] },
  { id: 'leave', name: 'leave_requests', rowCount: 180_000, columns: [col('leave_id', 'leave_id', 'string'), col('start_date', 'start_date', 'date'), col('days', 'days', 'number')] },
  { id: 'headcount_snap', name: 'headcount_snapshots', rowCount: 560_000, columns: [col('snapshot_date', 'snapshot_date', 'date'), col('department_id', 'department_id', 'string'), col('headcount', 'headcount', 'number')] },
  { id: 'locations', name: 'locations', rowCount: 140, columns: [col('location_id', 'location_id', 'string'), col('country', 'country', 'string')] },
  { id: 'benefits', name: 'benefits_enrollment', rowCount: 132_000, columns: [col('employee_id', 'employee_id', 'string'), col('enrolled_date', 'enrolled_date', 'date'), col('plan', 'plan', 'string')] },
];

// A model on a connector that can't be cached — powers the "caching unavailable"
// empty state.
const feedbackTables: ModelTable[] = [
  { id: 'nps_responses', name: 'nps_responses', rowCount: 24_800, columns: [col('response_id', 'response_id', 'string'), col('submitted_at', 'submitted_at', 'date'), col('score', 'score', 'number'), col('comment', 'comment', 'string')] },
  { id: 'survey_meta', name: 'survey_meta', rowCount: 120, columns: [col('survey_id', 'survey_id', 'string'), col('title', 'title', 'string')] },
];

// ── Run history builders ────────────────────────────────────────────────────
const salesRun = (
  id: string,
  runType: CacheRun['runType'],
  startTime: string,
  status: CacheRun['status'],
  rows?: number,
  endTime?: string,
): CacheRun => ({
  id,
  runType,
  startTime,
  endTime,
  rows,
  status,
  tableResults: salesTables.map((t) => ({
    tableId: t.id,
    status,
    rows: status === 'Success' ? t.rowCount : Math.round(t.rowCount * 0.6),
    sizeMB: Math.max(1, Math.round(t.rowCount / 12_000)),
    durationSec: 20 + Math.round(t.rowCount / 250_000),
    windowApplied: 'All history',
  })),
});

const dunderRuns: CacheRun[] = [
  { id: 'r0', runType: 'Scheduled', startTime: '1 hr ago', status: 'In progress', tableResults: [] },
  { id: 'r0p', runType: 'Purge', startTime: '3 hrs ago', endTime: '3 hrs ago', status: 'Success', tableResults: [] },
  { id: 'r0m', runType: 'Model update', startTime: 'Yesterday', endTime: 'Yesterday', status: 'Success', tableResults: [] },
  salesRun('r1', 'Scheduled', 'Yesterday', 'Success', 1_500_000, 'Yesterday'),
  salesRun('r2', 'Scheduled', '2 days ago', 'Success', 1_498_220, '2 days ago'),
  salesRun('r3', 'Scheduled', '10 May 2026', 'Success', 1_495_010, '10 May 2026'),
];

// Paused model: a model change was detected, so serving fell back to live. The
// newest event is the model update that triggered the pause.
const supplyRuns: CacheRun[] = [
  { id: 'sc0', runType: 'Model update', startTime: '20 min ago', endTime: '20 min ago', status: 'Success', tableResults: [] },
  salesRun('sc1', 'Scheduled', 'Yesterday', 'Success', 1_500_000, 'Yesterday'),
  salesRun('sc2', 'Scheduled', '2 days ago', 'Success', 1_499_500, '2 days ago'),
];

const ledgerRuns: CacheRun[] = [
  {
    id: 'lr0',
    runType: 'Scheduled',
    startTime: '1 hr ago',
    endTime: '45 min ago',
    rows: undefined,
    status: 'Error',
    tableResults: ledgerTables.map((t, i) => ({
      tableId: t.id,
      status: i === 0 ? 'Error' : 'Success',
      rows: i === 0 ? 0 : t.rowCount,
      sizeMB: i === 0 ? 0 : Math.max(1, Math.round(t.rowCount / 9_000)),
      durationSec: i === 0 ? 12 : 30 + i * 10,
      windowApplied: 'All history',
      note: i === 0 ? 'Source query timed out after 600s on posted_date partition scan' : undefined,
    })),
  },
  {
    id: 'lr1',
    runType: 'Scheduled',
    startTime: 'Yesterday',
    endTime: 'Yesterday',
    rows: 6_100_000,
    status: 'Success',
    tableResults: ledgerTables.map((t) => ({
      tableId: t.id,
      status: 'Success',
      rows: t.rowCount,
      sizeMB: Math.max(1, Math.round(t.rowCount / 9_000)),
      durationSec: 40,
      windowApplied: 'All history',
    })),
  },
];

const marketingRuns: CacheRun[] = [
  {
    id: 'mr1',
    runType: 'Scheduled',
    startTime: '6 hrs ago',
    endTime: '5 hrs ago',
    rows: 29_200_000,
    status: 'Success',
    tableResults: marketingTables.map((t, i) => ({
      tableId: t.id,
      status: 'Success',
      rows: i === 0 ? 2_400_000 : i === 2 ? 5_900_000 : t.rowCount,
      sizeMB: Math.max(1, Math.round(t.rowCount / 2_000)),
      durationSec: 60 + i * 25,
      windowApplied: i === 0 ? 'Last 13 months' : i === 2 ? 'Last 6 months' : 'All history',
    })),
  },
  {
    id: 'mr2',
    runType: 'Ad-hoc',
    startTime: '4 days ago',
    endTime: '4 days ago',
    rows: 29_050_000,
    status: 'Success',
    tableResults: marketingTables.map((t) => ({
      tableId: t.id,
      status: 'Success',
      rows: t.rowCount,
      sizeMB: Math.max(1, Math.round(t.rowCount / 2_000)),
      durationSec: 70,
      windowApplied: 'All history',
    })),
  },
];


// ── Usage + cacheability builders ──────────────────────────────────────────
const use = (warehouseQueries30d: number, avgQuerySeconds: number, users30d: number): ModelUsage => ({
  warehouseQueries30d,
  avgQuerySeconds,
  users30d,
});
const blocked = (reasonCode: NonNullable<Cacheability['reasonCode']>, reason: string): Cacheability => ({
  cacheable: false,
  reasonCode,
  reason,
});

// ── Models ──────────────────────────────────────────────────────────────────
const pulseModels: DataModel[] = [
  {
    id: 'dunder-mifflin-sales',
    usage: use(41_200, 3.4, 1_210),
    name: 'Dunder Mifflin Sales',
    description:
      'The Dunder Mifflin Sales worksheet provides a comprehensive overview of sales data, capturing details about customers, orders, and products. It includes revenue, margins, and fulfillment metrics across regions.',
    source: 'Snowflake',
    tables: salesTables,
    tags: ['Revenue', 'Sales'],
    author: { name: 'Vivek Sahi' },
    lastModified: '2 hours ago',
    cache: {
      status: 'cached',
      window: 'full',
      schedule: dailyNineAm,
      cacheSizeMB: 256,
      rowCount: 1_500_000,
      nextRunAt: '20 May 2026, 9:00 AM',
      lastRunStatus: 'Success',
      runs: dunderRuns,
      analytics: { totalQueries: 41_200, cachedQueries: 30_900, liveQueries: 10_300, basedOn: '15 May 2026, 9:00 AM' },
    },
  },
  {
    id: 'marketing-attribution',
    usage: use(28_900, 4.1, 860),
    name: 'Marketing Attribution',
    description:
      'Multi-touch attribution across paid, organic, and email channels. Joins web sessions, campaigns, and touchpoints to model pipeline influence and spend efficiency.',
    source: 'Snowflake',
    tables: marketingTables,
    tags: ['Marketing', 'Attribution'],
    author: { name: 'Aastha Sharma' },
    lastModified: 'Yesterday',
    cache: {
      status: 'cached',
      window: 'custom',
      tableSettings: [
        { tableId: 'sessions', mode: 'window', windowMonths: 13, referenceColumnId: 'session_ts' },
        { tableId: 'campaigns', mode: 'full_table' },
        { tableId: 'touchpoints', mode: 'window', windowMonths: 6, referenceColumnId: 'touch_ts' },
      ],
      schedule: { ...dailyNineAm, hour: 3, excludeWeekends: false },
      cacheSizeMB: 35_020,
      rowCount: 29_200_000,
      nextRunAt: '19 May 2026, 3:00 AM',
      lastRunStatus: 'Success',
      runs: marketingRuns,
      analytics: { totalQueries: 28_900, cachedQueries: 22_400, liveQueries: 6_500, basedOn: '18 May 2026, 3:00 AM' },
    },
  },
  {
    id: 'financial-ledger',
    usage: use(17_600, 6.2, 140),
    name: 'Financial Ledger',
    description:
      'General ledger, chart of accounts, and daily FX rates. Powers close reporting, variance analysis, and multi-currency consolidation.',
    source: 'Snowflake',
    tables: ledgerTables,
    tags: ['Finance', 'DO NOT DELETE'],
    author: { name: 'Devin McPherson' },
    lastModified: '3 days ago',
    cache: {
      status: 'cached',
      window: 'full',
      schedule: { ...dailyNineAm, hour: 2 },
      cacheSizeMB: 28_160,
      rowCount: 6_100_000,
      nextRunAt: '19 May 2026, 2:00 AM',
      lastRunStatus: 'Error',
      runs: ledgerRuns,
    },
  },
  {
    id: 'hr-headcount',
    usage: use(9_800, 2.8, 320),
    name: 'HR Headcount',
    description:
      'Headcount, org hierarchy, and compensation bands. Monthly snapshots for workforce planning and attrition analysis.',
    source: 'Snowflake',
    tables: hrTables,
    tags: ['HR', 'People'],
    author: { name: 'Ramkumar Natarajan' },
    lastModified: '4 days ago',
  },
  {
    id: 'supply-chain-inventory',
    usage: use(11_400, 5.0, 95),
    name: 'Supply Chain Inventory',
    description:
      'On-hand inventory, purchase orders, and supplier lead times across distribution centers. Feeds replenishment and stockout risk models.',
    source: 'Snowflake',
    tables: salesTables,
    tags: ['Operations'],
    author: { name: 'Bharath Kumar' },
    lastModified: '5 days ago',
    cache: {
      status: 'paused',
      window: 'full',
      schedule: { ...dailyNineAm, hour: 5 },
      cacheSizeMB: 512,
      rowCount: 1_500_000,
      nextRunAt: '21 May 2026, 5:00 AM',
      lastRunStatus: 'Success',
      runs: supplyRuns,
    },
  },
  {
    id: 'csat-survey-uploads',
    usage: use(3_500, 1.9, 60),
    name: 'CSAT Survey Uploads',
    description:
      'Customer satisfaction survey exports uploaded from spreadsheets. Ad-hoc NPS and CSAT responses with free-text comments.',
    source: 'CSV upload',
    tables: feedbackTables,
    tags: ['CX', 'Survey'],
    author: { name: 'Priya Menon' },
    lastModified: '6 days ago',
    cacheability: {
      cacheable: false,
      reasonCode: 'UNSUPPORTED_CONNECTOR',
      reason:
        'This model is built on a connection type that doesn’t support caching yet. Caching is available for supported cloud data warehouses.',
    },
  },
];


// ── The three PLG orgs (nothing cached yet) ────────────────────────────────
// Model rows: warehouse queries in 30 d, average seconds per query, users.
const retailModels: DataModel[] = [
  {
    id: 'retail-omnichannel-sales',
    name: 'Omnichannel Sales',
    description: 'Orders, revenue and margin across stores, web and app, joined to products and customers.',
    source: 'Snowflake',
    tables: salesTables,
    tags: ['AI', 'DO NOT DELETE'],
    author: { name: 'Alex Johnson' },
    lastModified: '4 hours ago',
    usage: use(228_790, 4.2, 12_509),
  },
  {
    id: 'retail-store-traffic-conversion',
    name: 'Store Traffic & Conversion',
    description: 'Footfall, visits and conversion by store and hour, with staffing overlays.',
    source: 'Databricks',
    tables: marketingTables,
    tags: ['Sales', 'DO NOT DELETE'],
    author: { name: 'Sarah Chen' },
    lastModified: '20 hours ago',
    usage: use(93_628, 3.1, 12_506),
  },
  {
    id: 'retail-inventory-availability',
    name: 'Inventory Availability',
    description: 'On-hand and in-transit stock by SKU and location, refreshed from the warehouse feed.',
    source: 'Snowflake',
    tables: ledgerTables,
    author: { name: 'Administrator' },
    lastModified: '22 hours ago',
    usage: use(54_507, 6.8, 1),
  },
  {
    id: 'retail-loyalty-members',
    name: 'Loyalty Members',
    description: 'Member profiles, tiers and points activity for the loyalty programme.',
    source: 'Databricks',
    tables: hrTables,
    tags: ['AI'],
    author: { name: 'Alex Johnson' },
    lastModified: 'a day ago',
    usage: use(43_195, 2.4, 459),
    cacheability: blocked('OAUTH_CONNECTION', 'This model is on an OAuth connection, which doesn’t support caching yet. Caching is available on connections that use a service account.'),
  },
  {
    id: 'retail-product-catalog-performance',
    name: 'Product Catalog Performance',
    description: 'Sell-through, returns and ratings by product line and launch cohort.',
    source: 'Snowflake',
    tables: salesTables,
    tags: ['DO NOT DELETE'],
    author: { name: 'Alex Johnson' },
    lastModified: 'a day ago',
    usage: use(42_766, 5.1, 205),
  },
  {
    id: 'retail-marketing-campaigns',
    name: 'Marketing Campaigns',
    description: 'Campaign spend, reach and attributed revenue across paid and owned channels.',
    source: 'Snowflake',
    tables: marketingTables,
    tags: ['AI'],
    author: { name: 'Michael Roberts' },
    lastModified: '2 days ago',
    usage: use(37_040, 3.6, 284),
  },
  {
    id: 'retail-returns-exchanges',
    name: 'Returns & Exchanges',
    description: 'Return reasons, refund value and exchange rates by product and store.',
    source: 'Databricks',
    tables: ledgerTables,
    author: { name: 'Emily Davis' },
    lastModified: '1 week ago',
    usage: use(28_045, 2.9, 352),
  },
  {
    id: 'retail-supply-chain-lead-times',
    name: 'Supply Chain Lead Times',
    description: 'Supplier lead times, purchase orders and on-time delivery by distribution centre.',
    source: 'BigQuery',
    tables: hrTables,
    author: { name: 'James Wilson' },
    lastModified: '1 week ago',
    usage: use(19_804, 7.4, 15),
    cacheability: blocked('UNSUPPORTED_CONNECTOR', 'This model’s source isn’t supported for caching yet. Caching is available for models on Snowflake and Databricks.'),
  },
  {
    id: 'retail-customer-service-cases',
    name: 'Customer Service Cases',
    description: 'Support cases, handle time and resolution by channel and reason.',
    source: 'Databricks',
    tables: salesTables,
    tags: ['AI'],
    author: { name: 'Lisa Thompson' },
    lastModified: '2 weeks ago',
    usage: use(15_280, 2.2, 79),
  },
  {
    id: 'retail-beauty-advisor-scorecard',
    name: 'Beauty Advisor Scorecard',
    description: 'Advisor-level sales, attach rate and customer feedback by store.',
    source: 'Snowflake',
    tables: marketingTables,
    tags: ['DO NOT DELETE'],
    author: { name: 'Alex Johnson' },
    lastModified: '3 weeks ago',
    usage: use(13_411, 3.3, 422),
  },
];

const claimsModels: DataModel[] = [
  {
    id: 'claims-claims-pipeline',
    name: 'Claims Pipeline',
    description: 'Open and closed claims by stage, age and adjuster, with reserve movements.',
    source: 'Databricks',
    tables: salesTables,
    tags: ['DO NOT DELETE'],
    author: { name: 'Alex Johnson' },
    lastModified: '3 hours ago',
    usage: use(9_537, 4.4, 23),
  },
  {
    id: 'claims-adjuster-workload',
    name: 'Adjuster Workload',
    description: 'Caseload, cycle time and backlog per adjuster and team.',
    source: 'Databricks',
    tables: marketingTables,
    tags: ['WIP'],
    author: { name: 'Sarah Chen' },
    lastModified: 'a day ago',
    usage: use(6_892, 3.2, 21),
  },
  {
    id: 'claims-repairer-network',
    name: 'Repairer Network',
    description: 'Approved repairers, capacity and repair cost benchmarks by region.',
    source: 'Databricks',
    tables: ledgerTables,
    author: { name: 'Administrator' },
    lastModified: '2 days ago',
    usage: use(2_740, 5.6, 36),
    cacheability: blocked('PASSTHROUGH_SQL', 'This model uses passthrough SQL, which can’t be cached yet.'),
  },
  {
    id: 'claims-payments-settlements',
    name: 'Payments & Settlements',
    description: 'Settlement amounts, payment timing and leakage by claim type.',
    source: 'Snowflake',
    tables: hrTables,
    tags: ['AI'],
    author: { name: 'Alex Johnson' },
    lastModified: '3 days ago',
    usage: use(1_635, 2.8, 13),
  },
  {
    id: 'claims-policy-holder-contacts',
    name: 'Policy Holder Contacts',
    description: 'Contact attempts, channel and outcome across the claim lifecycle.',
    source: 'Databricks',
    tables: salesTables,
    author: { name: 'Michael Roberts' },
    lastModified: '1 week ago',
    usage: use(1_439, 3.9, 10),
  },
  {
    id: 'claims-intake-volume',
    name: 'Intake Volume',
    description: 'New claims by day, channel and product, against forecast.',
    source: 'Databricks',
    tables: marketingTables,
    author: { name: 'Emily Davis' },
    lastModified: '1 week ago',
    usage: use(1_395, 4.1, 12),
  },
  {
    id: 'claims-sla-compliance',
    name: 'SLA Compliance',
    description: 'Stage-level SLA attainment and breaches, by team and cause.',
    source: 'Databricks',
    tables: ledgerTables,
    tags: ['DO NOT DELETE'],
    author: { name: 'James Wilson' },
    lastModified: '2 weeks ago',
    usage: use(1_270, 3.5, 19),
  },
  {
    id: 'claims-vehicle-assessments',
    name: 'Vehicle Assessments',
    description: 'Assessment outcomes, total-loss rates and assessor turnaround.',
    source: 'Databricks',
    tables: hrTables,
    author: { name: 'Alex Johnson' },
    lastModified: '2 weeks ago',
    usage: use(705, 6.2, 26),
  },
  {
    id: 'claims-fraud-flags',
    name: 'Fraud Flags',
    description: 'Claims flagged by the fraud model, with investigation status and outcome.',
    source: 'Databricks',
    tables: salesTables,
    tags: ['AI'],
    author: { name: 'Lisa Thompson' },
    lastModified: '3 weeks ago',
    usage: use(627, 2.6, 4),
  },
  {
    id: 'claims-call-centre-activity',
    name: 'Call Centre Activity',
    description: 'Call volumes, wait time and first-contact resolution by queue.',
    source: 'Databricks',
    tables: marketingTables,
    author: { name: 'Alex Johnson' },
    lastModified: '3 weeks ago',
    usage: use(352, 3.0, 1),
  },
];

const globalModels: DataModel[] = [
  {
    id: 'global-global-sales-ledger',
    name: 'Global Sales Ledger',
    description: 'Invoiced sales by entity, currency and product family, reconciled to the ledger.',
    source: 'Snowflake',
    tables: salesTables,
    tags: ['DO NOT DELETE'],
    author: { name: 'Alex Johnson' },
    lastModified: '2 hours ago',
    usage: use(612_400, 2.5, 18_230),
  },
  {
    id: 'global-customer-360',
    name: 'Customer 360',
    description: 'One row per customer: purchases, engagement, support and lifetime value.',
    source: 'Databricks',
    tables: marketingTables,
    tags: ['AI'],
    author: { name: 'Sarah Chen' },
    lastModified: '5 hours ago',
    usage: use(388_120, 3.0, 9_870),
  },
  {
    id: 'global-order-fulfilment',
    name: 'Order Fulfilment',
    description: 'Order-to-ship times, fill rate and carrier performance by region.',
    source: 'Snowflake',
    tables: ledgerTables,
    tags: ['DO NOT DELETE'],
    author: { name: 'Administrator' },
    lastModified: 'a day ago',
    usage: use(241_900, 4.4, 3_210),
  },
  {
    id: 'global-web-app-events',
    name: 'Web & App Events',
    description: 'Sessions, events and funnels from web and app, sessionised daily.',
    source: 'Databricks',
    tables: hrTables,
    tags: ['AI'],
    author: { name: 'Michael Roberts' },
    lastModified: 'a day ago',
    usage: use(198_450, 2.7, 1_120),
  },
  {
    id: 'global-supply-chain-lead-times',
    name: 'Supply Chain Lead Times',
    description: 'Supplier lead times, purchase orders and on-time delivery by plant.',
    source: 'Snowflake',
    tables: salesTables,
    author: { name: 'James Wilson' },
    lastModified: '2 days ago',
    usage: use(142_300, 6.1, 880),
  },
  {
    id: 'global-marketing-attribution',
    name: 'Marketing Attribution',
    description: 'Multi-touch attribution across paid, organic and email, with spend efficiency.',
    source: 'Databricks',
    tables: marketingTables,
    tags: ['AI'],
    author: { name: 'Emily Davis' },
    lastModified: '3 days ago',
    usage: use(121_700, 3.3, 2_040),
  },
  {
    id: 'global-finance-close',
    name: 'Finance Close',
    description: 'Close tasks, journal status and variance by entity on the fiscal calendar.',
    source: 'Snowflake',
    tables: ledgerTables,
    tags: ['DO NOT DELETE'],
    author: { name: 'Alex Johnson' },
    lastModified: '1 week ago',
    usage: use(96_300, 7.9, 310),
    cacheability: blocked('MISSING_CUSTOM_CALENDAR', 'This model uses a custom calendar, which caching doesn’t support yet.'),
  },
  {
    id: 'global-store-ops-scorecard',
    name: 'Store Ops Scorecard',
    description: 'Store KPIs: sales, labour, shrink and NPS against targets.',
    source: 'Databricks',
    tables: hrTables,
    author: { name: 'Lisa Thompson' },
    lastModified: '1 week ago',
    usage: use(84_100, 2.9, 4_420),
  },
  {
    id: 'global-returns-refunds',
    name: 'Returns & Refunds',
    description: 'Return reasons, refund value and exchange rates by product and store.',
    source: 'Databricks',
    tables: salesTables,
    author: { name: 'Alex Johnson' },
    lastModified: '2 weeks ago',
    usage: use(61_200, 3.4, 1_210),
  },
  {
    id: 'global-hr-headcount',
    name: 'HR Headcount',
    description: 'Headcount, org hierarchy and compensation bands, monthly snapshots.',
    source: 'Snowflake',
    tables: marketingTables,
    author: { name: 'Michael Roberts' },
    lastModified: '3 weeks ago',
    usage: use(44_800, 2.1, 620),
    cacheability: blocked('OAUTH_CONNECTION', 'This model is on an OAuth connection, which doesn’t support caching yet. Caching is available on connections that use a service account.'),
  },
];

// ── Orgs ───────────────────────────────────────────────────────────────────
export const orgs: Record<string, Org> = {
  retail: {
    id: 'retail',
    name: 'Retail',
    activeModels: 264,
    cacheableModels: 231,
    eligibleModels: 53,
    warehouseQueries30d: 844_507,
    warehouseHours30d: 890,
    cacheableHours30d: 810,
    connections: 4,
    volumeShare: 93,
    savingPerYear: 381_479,
    aboveThreshold: true,
    models: retailModels,
  },
  claims: {
    id: 'claims',
    name: 'Claims',
    activeModels: 29,
    cacheableModels: 26,
    eligibleModels: 3,
    warehouseQueries30d: 27_926,
    warehouseHours30d: 31,
    cacheableHours30d: 28,
    connections: 2,
    volumeShare: 69,
    savingPerYear: 9_328,
    aboveThreshold: false,
    models: claimsModels,
  },
  global: {
    id: 'global',
    name: 'Global',
    activeModels: 412,
    cacheableModels: 352,
    eligibleModels: 96,
    warehouseQueries30d: 2_310_884,
    warehouseHours30d: 2_640,
    cacheableHours30d: 2_380,
    connections: 7,
    volumeShare: 95,
    savingPerYear: 1_043_000,
    aboveThreshold: true,
    models: globalModels,
  },
  // The Pulse data set: three models cached (one with a failed last run), one
  // model changed since it was cached, one never cached, one not cacheable.
  cached: {
    id: 'cached',
    name: 'Models cached',
    activeModels: 38,
    cacheableModels: 31,
    eligibleModels: 9,
    warehouseQueries30d: 148_000,
    warehouseHours30d: 156,
    cacheableHours30d: 150,
    connections: 2,
    volumeShare: 92,
    savingPerYear: 72_000,
    aboveThreshold: true,
    models: pulseModels,
  },
};
