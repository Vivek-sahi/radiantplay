/**
 * Near Store — mock data
 *
 * A spread of caching states so every screen has something real to show:
 * full-cached (healthy), custom-cached (healthy), cached with a failed last run,
 * purged (config kept, no snapshot), and two never-cached models.
 */

import type { CacheRun, Column, DataModel, ModelTable, Schedule } from './types';

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

// ── Models ──────────────────────────────────────────────────────────────────
export const models: DataModel[] = [
  {
    id: 'dunder-mifflin-sales',
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
      analytics: { totalQueries: 12_000, cachedQueries: 9_000, liveQueries: 3_000, basedOn: '15 May 2026, 9:00 AM' },
    },
  },
  {
    id: 'marketing-attribution',
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
      analytics: { totalQueries: 48_200, cachedQueries: 41_000, liveQueries: 7_200, basedOn: '18 May 2026, 3:00 AM' },
    },
  },
  {
    id: 'financial-ledger',
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

export const capacity = { purchasedGB: 100 };
