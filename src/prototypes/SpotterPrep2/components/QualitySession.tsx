import React, { useState, useEffect, useRef, useCallback } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { COLUMNS, EMPLOYEE_ROWS, MODEL, CACHE_DISPLAY } from '../data/mockData';
import type { EmployeeRow } from '../data/mockData';

// ── Types ─────────────────────────────────────────────────────────────────────

type FixPhase = 'none' | 'high-done' | 'medium-done' | 'all-done';
type DataView  = 'before' | 'after';

interface WorkingStep {
  label: string;
  detail?: string;
  delay: number;
  status: 'pending' | 'running' | 'done';
}

interface FixTableRow {
  column: string;
  issue: string;
  fix: string;
  rows: string;
}

interface ScanIssue {
  column: string;
  table: string;
  issueType: string;
  affectedRows: string;
  proposedFix: string;
  decision?: 'accepted' | 'documented' | 'flagged';
}

interface ScanTier {
  tier: 'high' | 'medium' | 'low';
  count: number;
  issues: ScanIssue[];
}

interface ScanCardData {
  totalIssues: number;
  score: number;
  grade: string;
  tiers: ScanTier[];
}

interface RulesChainRule {
  column: string;
  table: string;
  issueType: string;
  fixAction: string;
  affectedRows: string;
  status: 'staged' | 'documented' | 'flagged';
  dependsOn?: string;
}

interface RulesChainGroup {
  label: string;
  subtitle: string;
  rules: RulesChainRule[];
  moreCount?: number;
}

interface AgentMessage {
  id: string;
  type: 'user' | 'working' | 'response' | 'execution' | 'scan-card';
  content: string;
  steps?: WorkingStep[];
  stepsCollapsed?: boolean;
  interactiveChips?: { label: string; value: string }[];
  outcomeCard?: { title: string; chips: string[]; note: string };
  scanCard?: ScanCardData;
  fixTable?: FixTableRow[];
}

interface ClarifyOption {
  label: string;
  thenSteps: ScriptStep[];
}

type ScriptStep =
  | { type: 'tool-call';   toolName: string; toolInput?: Record<string, string>; delay: number; detail?: string }
  | { type: 'agent';       content: string; delay: number }
  | { type: 'wait';        chips?: string[] }
  | { type: 'fix-partial'; phase: FixPhase; message: string }
  | { type: 'fix';         message: string }
  | { type: 'clarify';     question: string; context?: string; options: ClarifyOption[]; current?: number; total?: number }
  | { type: 'scan-reveal'; data: ScanCardData }
  | { type: 'fix-table';   intro: string; rows: FixTableRow[] };

// ── Tool labels ───────────────────────────────────────────────────────────────

const TOOL_LABELS: Record<string, string> = {
  profile_table:     'Profiled table',
  detect_issues:     'Detected quality issues',
  apply_fix:         'Applied fixes',
  fix_issue:         'Fixed column',
  recalculate_score: 'Updated quality score',
  check_constraints: 'Checked constraints',
  load_scan_results: 'Loaded scan results',
  run_quality_scan:  'Ran quality scan',
};

// ── Scan card data ────────────────────────────────────────────────────────────

const SCAN_CARD_DATA: ScanCardData = {
  totalIssues: 9,
  score: 47,
  grade: 'D',
  tiers: [
    {
      tier: 'high',
      count: 6,
      issues: [
        { column: 'department',  table: 'employees', issueType: 'Null values',          affectedRows: '847 (6.8%)',   proposedFix: 'Fill "Unassigned"',         decision: 'accepted' },
        { column: 'employee_id', table: 'employees', issueType: 'Duplicate PKs',        affectedRows: '12',           proposedFix: 'Deduplicate',               decision: 'accepted' },
        { column: 'manager_id',  table: 'employees', issueType: 'Orphaned FK',           affectedRows: '34',           proposedFix: 'Set null',                  decision: 'accepted' },
        { column: 'hire_date',   table: 'employees', issueType: 'Format error',          affectedRows: '89',           proposedFix: 'Normalize to ISO 8601',      decision: 'accepted' },
        { column: 'salary',      table: 'employees', issueType: 'Negative values',       affectedRows: '3',            proposedFix: 'Flip sign',                 decision: 'accepted' },
        { column: 'base_pay',    table: 'employees', issueType: 'Float precision',       affectedRows: '1,204',        proposedFix: 'Round to 2 decimal places', decision: 'accepted' },
      ],
    },
    {
      tier: 'medium',
      count: 2,
      issues: [
        { column: 'email',            table: 'employees', issueType: 'Null values',         affectedRows: '1,203 (9.7%)', proposedFix: 'Not all employees have work emails', decision: 'documented' },
        { column: 'termination_date', table: 'employees', issueType: 'Impossible sequence', affectedRows: '7',            proposedFix: 'Swap hire_date and termination_date', decision: 'accepted' },
      ],
    },
    {
      tier: 'low',
      count: 1,
      issues: [
        { column: 'salary', table: 'employees', issueType: 'Statistical outliers', affectedRows: '3 ($788K–$912K)', proposedFix: 'Valid executive compensation', decision: 'documented' },
      ],
    },
  ],
};

const BATCH_SCAN_DATA: ScanCardData = {
  totalIssues: 22,
  score: 63,
  grade: 'C',
  tiers: [
    {
      tier: 'high',
      count: 15,
      issues: [
        { column: 'order_id',       table: 'orders',      issueType: 'Duplicate PKs',       affectedRows: '8',        proposedFix: 'Deduplicate',               decision: 'accepted' },
        { column: 'customer_id',    table: 'orders',      issueType: 'Orphaned FK',          affectedRows: '34',       proposedFix: 'Set null',                  decision: 'accepted' },
        { column: 'product_id',     table: 'order_items', issueType: 'Orphaned FK',          affectedRows: '67',       proposedFix: 'Set null',                  decision: 'accepted' },
        { column: 'rep_id',         table: 'orders',      issueType: 'Orphaned FK',          affectedRows: '19',       proposedFix: 'Set null',                  decision: 'accepted' },
        { column: 'unit_price',     table: 'order_items', issueType: 'Float precision',      affectedRows: '1,847',    proposedFix: 'Round to 2 decimal places', decision: 'accepted' },
        { column: 'revenue',        table: 'orders',      issueType: 'Float precision',      affectedRows: '892',      proposedFix: 'Round to 2 decimal places', decision: 'accepted' },
        { column: 'discount',       table: 'orders',      issueType: 'Invalid values',       affectedRows: '23',       proposedFix: 'Cap at 1.0',                decision: 'accepted' },
        { column: 'payment_status', table: 'orders',      issueType: 'Invalid values',       affectedRows: '5',        proposedFix: 'Standardize',               decision: 'accepted' },
        { column: 'order_date',     table: 'orders',      issueType: 'Format error',         affectedRows: '112',      proposedFix: 'Normalize to ISO 8601',      decision: 'accepted' },
        { column: 'ship_date',      table: 'orders',      issueType: 'Impossible sequence',  affectedRows: '18',       proposedFix: 'Flag for review',           decision: 'flagged'  },
        { column: 'created_at',     table: 'orders',      issueType: 'Future-dated records', affectedRows: '22',       proposedFix: 'Backdate to today',          decision: 'accepted' },
        { column: 'quantity',       table: 'order_items', issueType: 'Negative values',      affectedRows: '4',        proposedFix: 'Flip sign',                 decision: 'accepted' },
        { column: 'cost',           table: 'order_items', issueType: 'Negative values',      affectedRows: '3',        proposedFix: 'Flip sign',                 decision: 'accepted' },
        { column: 'region',         table: 'orders',      issueType: 'Null values',          affectedRows: '156',      proposedFix: 'Fill "Unassigned"',          decision: 'accepted' },
        { column: 'postal_code',    table: 'customers',   issueType: 'Null values',          affectedRows: '234',      proposedFix: 'Fill "Unknown"',             decision: 'accepted' },
      ],
    },
    {
      tier: 'medium',
      count: 5,
      issues: [
        { column: 'email',           table: 'customers', issueType: 'Null values',  affectedRows: '2,341 (18%)', proposedFix: 'Guest orders and older accounts — expected', decision: 'documented' },
        { column: 'phone',           table: 'customers', issueType: 'Null values',  affectedRows: '892',         proposedFix: 'Flag for data team to backfill',             decision: 'flagged'    },
        { column: 'discount_reason', table: 'orders',    issueType: 'Null values',  affectedRows: '156',         proposedFix: 'Fill "Manual override"',                     decision: 'accepted'   },
        { column: 'priority',        table: 'orders',    issueType: 'Null values',  affectedRows: '234',         proposedFix: 'Fill "Normal"',                              decision: 'accepted'   },
        { column: 'order_notes',     table: 'orders',    issueType: 'PII patterns', affectedRows: '67',          proposedFix: 'Redact PII patterns',                        decision: 'accepted'   },
      ],
    },
    {
      tier: 'low',
      count: 2,
      issues: [
        { column: 'unit_price', table: 'order_items', issueType: 'Statistical outliers', affectedRows: '7',  proposedFix: 'Flag for pricing team to review', decision: 'flagged' },
        { column: 'quantity',   table: 'order_items', issueType: 'Statistical outliers', affectedRows: '12', proposedFix: 'Flag for review',                 decision: 'flagged' },
      ],
    },
  ],
};

const AUTO_SCAN_DATA: ScanCardData = {
  totalIssues: 67,
  score: 31,
  grade: 'F',
  tiers: [
    {
      tier: 'high',
      count: 42,
      issues: [
        { column: 'sku',              table: 'inventory',           issueType: 'Duplicate PKs',       affectedRows: '127',         proposedFix: 'Deduplicate',               decision: 'accepted' },
        { column: 'warehouse_id',     table: 'shipments',           issueType: 'Orphaned FK',          affectedRows: '340',         proposedFix: 'Set null',                  decision: 'accepted' },
        { column: 'vendor_id',        table: 'purchase_orders',     issueType: 'Orphaned FK',          affectedRows: '89',          proposedFix: 'Set null',                  decision: 'accepted' },
        { column: 'quantity_on_hand', table: 'inventory',           issueType: 'Float precision',      affectedRows: '2,847',       proposedFix: 'Round to 0 decimal places', decision: 'accepted' },
        { column: 'unit_cost',        table: 'inventory',           issueType: 'Float precision',      affectedRows: '1,204',       proposedFix: 'Round to 2 decimal places', decision: 'accepted' },
        { column: 'received_date',    table: 'inventory',           issueType: 'Format error',         affectedRows: '234',         proposedFix: 'Normalize to ISO 8601',      decision: 'accepted' },
        { column: 'expiry_date',      table: 'inventory',           issueType: 'Impossible sequence',  affectedRows: '67',          proposedFix: 'Flag for review',           decision: 'flagged'  },
        { column: 'reorder_point',    table: 'inventory',           issueType: 'Negative values',      affectedRows: '892',         proposedFix: 'Set to 0',                  decision: 'accepted' },
        { column: 'lead_time_days',   table: 'purchase_orders',     issueType: 'Negative values',      affectedRows: '45',          proposedFix: 'Flip sign',                 decision: 'accepted' },
        { column: 'location_code',    table: 'warehouse_locations', issueType: 'Format error',         affectedRows: '312',         proposedFix: 'Normalize',                 decision: 'accepted' },
      ],
    },
    {
      tier: 'medium',
      count: 18,
      issues: [
        { column: 'bin_location',   table: 'inventory',       issueType: 'Null values',        affectedRows: '1,203 (28%)', proposedFix: 'Bulk storage items — bin location not always assigned', decision: 'documented' },
        { column: 'batch_number',   table: 'inventory',       issueType: 'Null values',        affectedRows: '567',         proposedFix: 'Flag for warehouse team to backfill',                  decision: 'flagged'    },
        { column: 'supplier_code',  table: 'purchase_orders', issueType: 'Unrecognized codes', affectedRows: '234',         proposedFix: 'Flag for procurement team to reconcile',               decision: 'flagged'    },
        { column: 'hazmat_flag',    table: 'inventory',       issueType: 'Null values',        affectedRows: '89',          proposedFix: 'Fill false — safe default for non-hazmat items',       decision: 'accepted'   },
        { column: 'country_origin', table: 'inventory',       issueType: 'Null values',        affectedRows: '156',         proposedFix: 'Fill "Unknown"',                                       decision: 'accepted'   },
      ],
    },
    {
      tier: 'low',
      count: 7,
      issues: [
        { column: 'unit_cost',        table: 'inventory', issueType: 'Statistical outliers', affectedRows: '12', proposedFix: 'Flag for cost team to verify',    decision: 'flagged' },
        { column: 'quantity_on_hand', table: 'inventory', issueType: 'Capacity violations',  affectedRows: '8',  proposedFix: 'Flag for operations team to review', decision: 'flagged' },
      ],
    },
  ],
};

// ── Scripts ───────────────────────────────────────────────────────────────────

const RESCAN_STEPS_BASE: ScriptStep[] = [
  { type: 'tool-call', toolName: 'profile_table', delay: 600, detail: 'Profiling tables…' },
  { type: 'tool-call', toolName: 'detect_issues', delay: 900, detail: 'Checking nulls, duplicates, format errors, constraint violations, statistical outliers…' },
];

const INTERACTIVE_STEPS: ScriptStep[] = [
  { type: 'agent', content: "Let's go through the 6 I'm confident about. I'll show you what I'd do for each — you apply or skip.", delay: 0 },

  {
    type: 'clarify',
    question: 'employee_id · 12 duplicate primary keys', current: 1, total: 6,
    options: [
      {
        label: 'Keep earlier record, reassign IDs to duplicates',
        thenSteps: [
          { type: 'agent', content: 'Staged — 12 duplicate employee_ids will be resolved on next cache refresh, keeping the later record.', delay: 500 },
        ],
      },
      {
        label: 'Keep later record, reassign IDs to earlier duplicates',
        thenSteps: [
          { type: 'agent', content: 'Staged — 12 duplicate employee_ids will be resolved on next cache refresh, keeping the earlier record.', delay: 500 },
        ],
      },
    ],
  },

  {
    type: 'clarify',
    question: "department · 847 null values (6.8% of rows)", current: 2, total: 6,
    options: [
      {
        label: "Fill with 'Unassigned' — keeps rows in queries",
        thenSteps: [
          { type: 'agent', content: "Staged — 847 null department values will be filled with 'Unassigned' on next cache refresh.", delay: 400 },
        ],
      },
      {
        label: 'Leave as null — they\'re intentional',
        thenSteps: [],
      },
    ],
  },

  {
    type: 'clarify',
    question: 'hire_date · 89 rows in non-ISO format', current: 3, total: 6,
    options: [
      {
        label: 'Normalize all to YYYY-MM-DD',
        thenSteps: [
          { type: 'agent', content: 'Staged — 89 hire_date values will be normalized to ISO 8601 on next cache refresh.', delay: 400 },
        ],
      },
      {
        label: 'Leave as is — format is intentional',
        thenSteps: [],
      },
    ],
  },

  {
    type: 'clarify',
    question: 'salary · 3 negative values', current: 4, total: 6,
    options: [
      {
        label: 'Flip sign — these are data entry errors',
        thenSteps: [
          { type: 'agent', content: 'Staged — 3 negative salary values will be corrected on next cache refresh.', delay: 300 },
        ],
      },
      {
        label: 'Remove these rows — the values are invalid',
        thenSteps: [
          { type: 'agent', content: 'Staged — 3 invalid salary rows will be removed on next cache refresh.', delay: 300 },
        ],
      },
    ],
  },

  {
    type: 'clarify',
    question: 'base_pay · 1,204 values with more than 2 decimal places', current: 5, total: 6,
    options: [
      {
        label: 'Round to 2 decimal places',
        thenSteps: [
          { type: 'agent', content: 'Staged — 1,204 base_pay values will be rounded to 2 decimal places on next cache refresh.', delay: 400 },
        ],
      },
      {
        label: 'Leave as is — sub-cent precision is intentional',
        thenSteps: [],
      },
    ],
  },

  {
    type: 'clarify',
    question: "manager_id · 34 references that don't match any employee_id", current: 6, total: 6,
    options: [
      {
        label: 'Set orphaned references to null',
        thenSteps: [
          { type: 'agent', content: 'Staged — 34 orphaned manager_id references will be set to null on next cache refresh.', delay: 400 },
        ],
      },
      {
        label: 'Flag for review — don\'t modify yet',
        thenSteps: [],
      },
    ],
  },

  { type: 'fix-partial', phase: 'high-done', message: '6 high-confidence rules staged. Projected grade: D → ~C.' },
  { type: 'agent', content: "There are 2 issues I'm less certain about. Want to go through them?", delay: 0 },
  { type: 'wait', chips: ['Review 2 remaining issues'] },

  {
    type: 'clarify',
    question: 'email · 1,203 null values (9.7% of rows)', current: 1, total: 2,
    context: 'Nulls spread evenly across departments and hire years — not clustered in one team or period. Could be intentional (contractors or some roles may not have corporate emails) or a data capture gap.',
    options: [
      {
        label: 'Expected — not all employees have a work email',
        thenSteps: [
          { type: 'agent', content: "Got it — email nulls are expected. Documented in the rules chain.", delay: 0 },
        ],
      },
      {
        label: 'Data issue — flag these rows for review',
        thenSteps: [
          { type: 'agent', content: '1,203 rows flagged for data owner review.', delay: 500 },
        ],
      },
    ],
  },

  {
    type: 'clarify',
    question: 'termination_date · before hire_date in 7 rows', current: 2, total: 2,
    context: 'Gap between the two dates is under 30 days in all 7 cases. Most likely data entry error — dates entered in the wrong fields.',
    options: [
      {
        label: 'Swap the dates — entered in reverse',
        thenSteps: [
          { type: 'agent', content: 'Staged — 7 rows will be corrected on next cache refresh, swapping hire_date and termination_date.', delay: 400 },
          { type: 'fix-partial', phase: 'medium-done', message: '8 of 9 rules staged. Projected grade: D → ~B.\n\n1 low-confidence issue to review.' },
        ],
      },
      {
        label: 'Null out termination_date — treat as still active',
        thenSteps: [
          { type: 'agent', content: 'Staged — termination_date will be set to null for 7 employees on next cache refresh.', delay: 400 },
          { type: 'fix-partial', phase: 'medium-done', message: '8 of 9 rules staged. Projected grade: D → ~B.\n\n1 low-confidence issue to review.' },
        ],
      },
    ],
  },

  {
    type: 'clarify',
    question: 'salary · 3 values between $788K–$912K',
    context: "Column average is $82K. These could be valid executive compensation or data entry errors — I can't tell from the data alone.",
    options: [
      {
        label: 'Valid — executive compensation',
        thenSteps: [
          { type: 'fix', message: 'All 9 rules staged. Projected grade: D → ~A.\n\nRules chain ready — save to lock these in. They apply on your next cache refresh.' },
        ],
      },
      {
        label: 'Flag for review — likely data errors',
        thenSteps: [
          { type: 'agent', content: 'Staged — 3 outlier salary rows will be flagged for review on next cache refresh.', delay: 400 },
          { type: 'fix', message: 'All 9 rules staged. Projected grade: D → ~A.\n\nRules chain ready — save to lock these in. They apply on your next cache refresh.' },
        ],
      },
    ],
  },
];

const BATCH_STEPS: ScriptStep[] = [
  { type: 'fix-table', intro: 'I found 15 high-confidence fixes ready to apply:', rows: [
    { column: 'order_id',       issue: 'Duplicate primary keys',   fix: 'Deduplicate',           rows: '8' },
    { column: 'customer_id',    issue: 'Orphaned foreign key',     fix: 'Set null',              rows: '34' },
    { column: 'product_id',     issue: 'Orphaned foreign key',     fix: 'Set null',              rows: '67' },
    { column: 'unit_price',     issue: 'Float precision > 2dp',    fix: 'Round to 2dp',          rows: '1,847' },
    { column: 'revenue',        issue: 'Float precision > 2dp',    fix: 'Round to 2dp',          rows: '892' },
    { column: 'discount',       issue: 'Values > 1.0',             fix: 'Cap at 1.0',            rows: '23' },
    { column: 'order_date',     issue: 'Format errors',            fix: 'Normalize to ISO 8601', rows: '112' },
    { column: 'quantity',       issue: 'Negative values',          fix: 'Flip sign',             rows: '4' },
    { column: 'region',         issue: 'Null values',              fix: 'Fill from postal code', rows: '156' },
    { column: 'postal_code',    issue: 'Null values',              fix: 'Fill from region',      rows: '234' },
    { column: 'payment_status', issue: 'Non-standard values',      fix: 'Standardize',           rows: '5' },
    { column: 'cost',           issue: 'Negative values',          fix: 'Flip sign',             rows: '3' },
    { column: 'created_at',     issue: 'Future-dated records',     fix: 'Set to current date',   rows: '22' },
    { column: 'rep_id',         issue: 'Orphaned foreign key',     fix: 'Set null',              rows: '19' },
    { column: 'ship_date',      issue: 'Format errors',            fix: 'Normalize to ISO 8601', rows: '14' },
  ]},
  { type: 'wait', chips: ['Apply 15 fixes'] },
  { type: 'agent', content: 'Staged. Replaced 8 duplicate order_ids · set 101 orphaned FKs to null · rounded 2,739 float values · capped 23 discounts · normalized 112 dates · flipped 7 negatives · filled 390 nulls · standardized 5 payment_statuses.', delay: 1500 },
  { type: 'fix-partial', phase: 'high-done', message: '15 high-confidence rules staged. Projected grade: C → ~B.' },
  { type: 'agent', content: "There are 5 issues I'm less certain about. Want to go through them?", delay: 0 },
  { type: 'wait', chips: ['Review 5 remaining issues'] },

  {
    type: 'clarify',
    question: 'email · 2,341 null values (18% of rows)', current: 1, total: 5,
    context: 'Nulls distributed evenly across customer segments and signup periods. Could be guest checkouts or older accounts without emails on file.',
    options: [
      {
        label: 'Expected — guest orders and older accounts',
        thenSteps: [
          { type: 'agent', content: "Noted — email nulls are expected for guest orders. Documented in the rules chain.", delay: 0 },
        ],
      },
      {
        label: 'Data issue — flag for review',
        thenSteps: [
          { type: 'agent', content: '2,341 rows flagged for review.', delay: 500 },
        ],
      },
    ],
  },

  {
    type: 'clarify',
    question: 'discount_reason · null on 156 discounted orders', current: 2, total: 5,
    context: 'These orders have a discount applied but no reason code. Could be manual overrides or a missing step in the order entry flow.',
    options: [
      {
        label: 'Fill with "Manual override"',
        thenSteps: [
          { type: 'agent', content: 'Staged — 156 null discount_reason values will be filled with "Manual override" on next cache refresh.', delay: 400 },
        ],
      },
      {
        label: 'Flag for review',
        thenSteps: [
          { type: 'agent', content: '156 rows flagged for review.', delay: 400 },
        ],
      },
    ],
  },

  {
    type: 'clarify',
    question: 'order_notes · 67 entries with possible PII', current: 3, total: 5,
    context: 'Pattern matching found what looks like email addresses and phone numbers in free-text order notes.',
    options: [
      {
        label: 'Redact PII patterns',
        thenSteps: [
          { type: 'agent', content: 'Staged — PII patterns will be redacted from 67 order_notes entries on next cache refresh.', delay: 500 },
        ],
      },
      {
        label: 'Leave as-is — review with legal first',
        thenSteps: [
          { type: 'agent', content: "OK — noted as unresolved. Review with legal before the next cache run.", delay: 0 },
        ],
      },
    ],
  },

  {
    type: 'clarify',
    question: 'priority · 234 null order priorities', current: 4, total: 5,
    context: "No default is obvious — 'Normal' is safe, but these could be intentionally unprioritized (e.g. bulk or wholesale orders).",
    options: [
      {
        label: 'Fill with "Normal"',
        thenSteps: [
          { type: 'agent', content: 'Staged — 234 null priority values will be filled with "Normal" on next cache refresh.', delay: 400 },
        ],
      },
      {
        label: 'Leave as null — handle in reporting',
        thenSteps: [
          { type: 'agent', content: "OK — left as null. Documented so reporting can handle them explicitly.", delay: 0 },
        ],
      },
    ],
  },

  {
    type: 'clarify',
    question: 'unit_price · 7 statistical outliers ($0.01 or > $50K)', current: 5, total: 5,
    context: 'Most products are priced between $5–$2,000. These 7 values are either test entries or pricing errors.',
    options: [
      {
        label: 'Flag for pricing team to review',
        thenSteps: [
          { type: 'agent', content: 'Staged — 7 outlier unit_price rows will be flagged for pricing review on next cache refresh.', delay: 400 },
          { type: 'fix', message: 'All 22 rules staged. Projected grade: C → ~A.\n\nRules chain ready — save to lock these in. They apply on your next cache refresh.' },
        ],
      },
      {
        label: 'Leave as-is',
        thenSteps: [
          { type: 'fix', message: '21 of 22 rules staged. Projected grade: C → ~A.\n\nRules chain ready — save to lock these in. They apply on your next cache refresh.' },
        ],
      },
    ],
  },
];

const AUTONOMOUS_STEPS: ScriptStep[] = [
  { type: 'tool-call', toolName: 'apply_fix', toolInput: { tables: 'inventory, shipments' }, delay: 200, detail: 'Deduplicating 127 SKUs · clearing 340 orphaned warehouse_ids · clearing 89 orphaned vendor_ids.' },
  { type: 'tool-call', toolName: 'apply_fix', toolInput: { tables: 'inventory' }, delay: 180, detail: 'Rounding 2,847 quantity_on_hand values · rounding 1,204 unit_costs · normalizing 234 received_dates.' },
  { type: 'tool-call', toolName: 'apply_fix', toolInput: { tables: 'inventory, purchase_orders' }, delay: 180, detail: 'Flagging 67 expiry_date anomalies · zeroing 892 negative reorder_points · flipping 45 negative lead_time_days.' },
  { type: 'tool-call', toolName: 'apply_fix', toolInput: { tables: 'shipments, warehouse_locations, vendors' }, delay: 180, detail: 'Normalizing 312 location_codes · fixing date formats · resolving remaining FK violations · filling categorical nulls.' },
  { type: 'tool-call', toolName: 'check_constraints', delay: 200, detail: 'All foreign key constraints satisfied. 0 remaining FK violations.' },
  { type: 'tool-call', toolName: 'recalculate_score', delay: 300, detail: '65 of 67 issues resolved automatically. Score: 31 → 88 (B). 2 issues need your input.' },
  { type: 'fix-partial', phase: 'high-done', message: '65 of 67 issues resolved autonomously.\n\n2 issues need your input:' },

  { type: 'agent', content: "bin_location — 1,203 nulls across inventory. Bulk storage items don't always have assigned bin locations — consistent pattern. Documented in the rules chain.", delay: 600 },
  { type: 'agent', content: "unit_cost — 12 values 40–200× the category average. Could be specialty or premium items. Flagging for cost team to confirm before the next refresh.", delay: 700 },
  { type: 'fix', message: '67 of 67 rules staged. Projected grade: F → ~A.\n\nRules chain ready — save to lock these in. They apply on your next cache refresh.' },
];

type PrepMode = 'interactive' | 'batch' | 'autonomous';

interface ModeConfig {
  modelName: string;
  tableLabel: string;
  scanData: ScanCardData;
  openingMessage: string;
  startChip: string;
  rowsScanned: string;
  beforeScore: number;
  beforeGrade: string;
  highDoneScore: number;
  mediumDoneScore: number;
  afterScore: number;
  afterGrade: string;
  script: ScriptStep[];
}

const MODE_CONFIG: Record<PrepMode, ModeConfig> = {
  interactive: {
    modelName: 'hr-analytics',
    tableLabel: 'employees',
    scanData: SCAN_CARD_DATA,
    openingMessage: "I've scanned hr-analytics and found 9 issues. I have a clear fix for 6 of them — we'll go through each one and you decide whether to apply it. The remaining 3 are ambiguous and I'll need your judgment on those.",
    startChip: 'Start reviewing',
    rowsScanned: '12,450',
    beforeScore: 47, beforeGrade: 'D',
    highDoneScore: 72, mediumDoneScore: 83,
    afterScore: 91, afterGrade: 'A',
    script: INTERACTIVE_STEPS,
  },
  batch: {
    modelName: 'customer-orders',
    tableLabel: 'orders',
    scanData: BATCH_SCAN_DATA,
    openingMessage: "I found 22 issues across customer-orders — duplicates, nulls, format inconsistencies, broken foreign keys. Fifteen of them are deterministic fixes I can apply in one batch. The other 5 are ambiguous and I'll need a quick decision from you on each.",
    startChip: 'Review the 15 fixes',
    rowsScanned: '38,714',
    beforeScore: 63, beforeGrade: 'C',
    highDoneScore: 84, mediumDoneScore: 91,
    afterScore: 94, afterGrade: 'A',
    script: BATCH_STEPS,
  },
  autonomous: {
    modelName: 'ops-warehouse',
    tableLabel: 'inventory',
    scanData: AUTO_SCAN_DATA,
    openingMessage: "ops-warehouse has 67 quality issues spread across 5 tables. Almost all of them are deterministic — I can handle them automatically. I'll run through everything and surface the 2 that need a decision from you at the end.",
    startChip: 'Run autonomously',
    rowsScanned: '185,430',
    beforeScore: 31, beforeGrade: 'F',
    highDoneScore: 88, mediumDoneScore: 88,
    afterScore: 92, afterGrade: 'A',
    script: AUTONOMOUS_STEPS,
  },
};

// ── Rules chain data ──────────────────────────────────────────────────────────

const INTERACTIVE_RULES: RulesChainGroup[] = [
  {
    label: 'Structural fixes',
    subtitle: 'Independent — run in any order',
    rules: [
      { column: 'employee_id',      table: 'employees', issueType: 'Duplicate PKs',       fixAction: 'Deduplicate — reassign IDs',             affectedRows: '12',    status: 'staged'     },
      { column: 'department',       table: 'employees', issueType: 'Null values',          fixAction: 'Fill "Unassigned"',                      affectedRows: '847',   status: 'staged'     },
      { column: 'hire_date',        table: 'employees', issueType: 'Format error',         fixAction: 'Normalize to ISO 8601',                  affectedRows: '89',    status: 'staged'     },
      { column: 'salary',           table: 'employees', issueType: 'Negative values',      fixAction: 'Flip sign',                              affectedRows: '3',     status: 'staged'     },
      { column: 'base_pay',         table: 'employees', issueType: 'Float precision',      fixAction: 'Round to 2 decimal places',              affectedRows: '1,204', status: 'staged'     },
      { column: 'termination_date', table: 'employees', issueType: 'Impossible sequence',  fixAction: 'Swap hire_date and termination_date',    affectedRows: '7',     status: 'staged'     },
      { column: 'salary',           table: 'employees', issueType: 'Statistical outliers', fixAction: 'Valid executive compensation — document', affectedRows: '3',     status: 'documented' },
      { column: 'email',            table: 'employees', issueType: 'Null values',          fixAction: 'Not all employees have work emails',     affectedRows: '1,203', status: 'documented' },
    ],
  },
  {
    label: 'Relational fixes',
    subtitle: 'Must run after structural fixes — depends on employee_id dedup',
    rules: [
      { column: 'manager_id', table: 'employees', issueType: 'Orphaned FK', fixAction: 'Set null', affectedRows: '34', status: 'staged', dependsOn: 'Structural fixes' },
    ],
  },
];

const BATCH_RULES: RulesChainGroup[] = [
  {
    label: 'Structural fixes',
    subtitle: 'Independent — run in any order',
    rules: [
      { column: 'order_id',        table: 'orders',      issueType: 'Duplicate PKs',        fixAction: 'Deduplicate',                affectedRows: '8',     status: 'staged'     },
      { column: 'unit_price',      table: 'order_items', issueType: 'Float precision',       fixAction: 'Round to 2 decimal places',  affectedRows: '1,847', status: 'staged'     },
      { column: 'revenue',         table: 'orders',      issueType: 'Float precision',       fixAction: 'Round to 2 decimal places',  affectedRows: '892',   status: 'staged'     },
      { column: 'discount',        table: 'orders',      issueType: 'Invalid values',        fixAction: 'Cap at 1.0',                 affectedRows: '23',    status: 'staged'     },
      { column: 'order_date',      table: 'orders',      issueType: 'Format error',          fixAction: 'Normalize to ISO 8601',      affectedRows: '112',   status: 'staged'     },
      { column: 'quantity',        table: 'order_items', issueType: 'Negative values',       fixAction: 'Flip sign',                  affectedRows: '4',     status: 'staged'     },
      { column: 'cost',            table: 'order_items', issueType: 'Negative values',       fixAction: 'Flip sign',                  affectedRows: '3',     status: 'staged'     },
      { column: 'region',          table: 'orders',      issueType: 'Null values',           fixAction: 'Fill from postal_code',      affectedRows: '156',   status: 'staged'     },
      { column: 'postal_code',     table: 'customers',   issueType: 'Null values',           fixAction: 'Fill from region',           affectedRows: '234',   status: 'staged'     },
      { column: 'payment_status',  table: 'orders',      issueType: 'Invalid values',        fixAction: 'Standardize',                affectedRows: '5',     status: 'staged'     },
      { column: 'created_at',      table: 'orders',      issueType: 'Future-dated records',  fixAction: 'Set to current date',        affectedRows: '22',    status: 'staged'     },
      { column: 'discount_reason', table: 'orders',      issueType: 'Null values',           fixAction: 'Fill "Manual override"',     affectedRows: '156',   status: 'staged'     },
      { column: 'order_notes',     table: 'orders',      issueType: 'PII patterns',          fixAction: 'Redact PII patterns',        affectedRows: '67',    status: 'staged'     },
      { column: 'priority',        table: 'orders',      issueType: 'Null values',           fixAction: 'Fill "Normal"',              affectedRows: '234',   status: 'staged'     },
      { column: 'email',           table: 'customers',   issueType: 'Null values',           fixAction: 'Guest orders — expected',    affectedRows: '2,341', status: 'documented' },
      { column: 'ship_date',       table: 'orders',      issueType: 'Impossible sequence',   fixAction: 'Flag for review',            affectedRows: '18',    status: 'flagged'    },
      { column: 'phone',           table: 'customers',   issueType: 'Null values',           fixAction: 'Flag for data team',         affectedRows: '892',   status: 'flagged'    },
      { column: 'unit_price',      table: 'order_items', issueType: 'Statistical outliers',  fixAction: 'Flag for pricing team',      affectedRows: '7',     status: 'flagged'    },
      { column: 'quantity',        table: 'order_items', issueType: 'Statistical outliers',  fixAction: 'Flag for review',            affectedRows: '12',    status: 'flagged'    },
    ],
  },
  {
    label: 'Relational fixes',
    subtitle: 'Must run after structural fixes — depends on order_id dedup',
    rules: [
      { column: 'customer_id', table: 'orders',      issueType: 'Orphaned FK', fixAction: 'Set null', affectedRows: '34', status: 'staged', dependsOn: 'Structural fixes' },
      { column: 'product_id',  table: 'order_items', issueType: 'Orphaned FK', fixAction: 'Set null', affectedRows: '67', status: 'staged', dependsOn: 'Structural fixes' },
      { column: 'rep_id',      table: 'orders',      issueType: 'Orphaned FK', fixAction: 'Set null', affectedRows: '19', status: 'staged', dependsOn: 'Structural fixes' },
    ],
  },
];

const AUTONOMOUS_RULES: RulesChainGroup[] = [
  {
    label: 'Structural fixes',
    subtitle: 'Independent — run in any order',
    moreCount: 50,
    rules: [
      { column: 'sku',              table: 'inventory',           issueType: 'Duplicate PKs',        fixAction: 'Deduplicate',                              affectedRows: '127',   status: 'staged'     },
      { column: 'quantity_on_hand', table: 'inventory',           issueType: 'Float precision',       fixAction: 'Round to 0 decimal places',               affectedRows: '2,847', status: 'staged'     },
      { column: 'unit_cost',        table: 'inventory',           issueType: 'Float precision',       fixAction: 'Round to 2 decimal places',               affectedRows: '1,204', status: 'staged'     },
      { column: 'received_date',    table: 'inventory',           issueType: 'Format error',          fixAction: 'Normalize to ISO 8601',                   affectedRows: '234',   status: 'staged'     },
      { column: 'reorder_point',    table: 'inventory',           issueType: 'Negative values',       fixAction: 'Set to 0',                                affectedRows: '892',   status: 'staged'     },
      { column: 'lead_time_days',   table: 'purchase_orders',     issueType: 'Negative values',       fixAction: 'Flip sign',                               affectedRows: '45',    status: 'staged'     },
      { column: 'location_code',    table: 'warehouse_locations', issueType: 'Format error',          fixAction: 'Normalize',                               affectedRows: '312',   status: 'staged'     },
      { column: 'hazmat_flag',      table: 'inventory',           issueType: 'Null values',           fixAction: 'Fill false — safe default',               affectedRows: '89',    status: 'staged'     },
      { column: 'country_origin',   table: 'inventory',           issueType: 'Null values',           fixAction: 'Fill "Unknown"',                          affectedRows: '156',   status: 'staged'     },
      { column: 'expiry_date',      table: 'inventory',           issueType: 'Impossible sequence',   fixAction: 'Flag for review',                         affectedRows: '67',    status: 'flagged'    },
      { column: 'batch_number',     table: 'inventory',           issueType: 'Null values',           fixAction: 'Flag for warehouse team',                 affectedRows: '567',   status: 'flagged'    },
      { column: 'supplier_code',    table: 'purchase_orders',     issueType: 'Unrecognized codes',    fixAction: 'Flag for procurement team',               affectedRows: '234',   status: 'flagged'    },
      { column: 'unit_cost',        table: 'inventory',           issueType: 'Statistical outliers',  fixAction: 'Flag for cost team',                      affectedRows: '12',    status: 'flagged'    },
      { column: 'quantity_on_hand', table: 'inventory',           issueType: 'Capacity violations',   fixAction: 'Flag for operations team',                affectedRows: '8',     status: 'flagged'    },
      { column: 'bin_location',     table: 'inventory',           issueType: 'Null values',           fixAction: 'Bulk storage — bin location not required', affectedRows: '1,203', status: 'documented' },
    ],
  },
  {
    label: 'Relational fixes',
    subtitle: 'Must run after structural fixes — depends on SKU and vendor dedup',
    rules: [
      { column: 'warehouse_id', table: 'shipments',       issueType: 'Orphaned FK', fixAction: 'Set null', affectedRows: '340', status: 'staged', dependsOn: 'Structural fixes' },
      { column: 'vendor_id',    table: 'purchase_orders', issueType: 'Orphaned FK', fixAction: 'Set null', affectedRows: '89',  status: 'staged', dependsOn: 'Structural fixes' },
    ],
  },
];

const MODE_RULES: Record<PrepMode, RulesChainGroup[]> = {
  interactive: INTERACTIVE_RULES,
  batch:       BATCH_RULES,
  autonomous:  AUTONOMOUS_RULES,
};

const MODE_RULE_COUNTS: Record<PrepMode, number> = {
  interactive: 9,
  batch:       22,
  autonomous:  67,
};

// ── Cell highlight helpers ────────────────────────────────────────────────────

const ORPHANED_MANAGER_IDS = new Set([9997, 9998, 9999]);
const isNonIso = (d: string) => !/^\d{4}-\d{2}-\d{2}$/.test(d);
const isImpossibleSeq = (row: EmployeeRow) =>
  row.termination_date !== null && row.termination_date < row.hire_date;

type EmpKey = keyof EmployeeRow;

const getBeforeCellStyle = (row: EmployeeRow, col: EmpKey): React.CSSProperties => {
  switch (col) {
    case 'email':
      if (row.email === null) return { backgroundColor: '#fff7ed', color: '#c2410c', fontStyle: 'italic' };
      return {};
    case 'department':
      if (row.department === null) return { backgroundColor: '#fff7ed', color: '#c2410c', fontStyle: 'italic' };
      return {};
    case 'hire_date':
      if (isNonIso(row.hire_date)) return { backgroundColor: '#ecfdf5', color: '#065f46' };
      return {};
    case 'termination_date':
      if (isImpossibleSeq(row)) return { backgroundColor: '#fee2e2', color: '#dc2626' };
      return {};
    case 'salary':
      if (row.salary < 0) return { backgroundColor: '#f5f3ff', color: '#6d28d9' };
      if (row.salary > 500000) return { backgroundColor: '#fdf2f8', color: '#be185d', fontWeight: fw.semibold };
      return {};
    case 'manager_id':
      if (row.manager_id !== null && ORPHANED_MANAGER_IDS.has(row.manager_id)) return { backgroundColor: '#fef3c7', color: '#b45309' };
      return {};
    case 'employee_id':
      return row.employee_id === 1003 ? { backgroundColor: '#fdf2f8', color: '#be185d' } : {};
    default:
      return {};
  }
};

const getAfterCellValue = (row: EmployeeRow, col: EmpKey, fixPhase: FixPhase, rowIndex: number): { value: string; fixed: boolean } => {
  const highFixed = fixPhase === 'high-done' || fixPhase === 'medium-done' || fixPhase === 'all-done';
  const medFixed  = fixPhase === 'medium-done' || fixPhase === 'all-done';

  switch (col) {
    case 'department':
      if (highFixed && row.department === null) return { value: 'Unassigned', fixed: true };
      return { value: row.department ?? '', fixed: false };
    case 'hire_date':
      if (highFixed && isNonIso(row.hire_date)) return { value: '2018-01-01', fixed: true };
      return { value: row.hire_date, fixed: false };
    case 'salary':
      if (highFixed && row.salary < 0) return { value: `$${Math.abs(row.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fixed: true };
      if (fixPhase === 'all-done' && row.salary > 500000) return { value: `$${row.salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (expected)`, fixed: true };
      return { value: `$${row.salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, fixed: false };
    case 'manager_id':
      if (highFixed && row.manager_id !== null && ORPHANED_MANAGER_IDS.has(row.manager_id)) return { value: '(none)', fixed: true };
      return { value: row.manager_id !== null ? String(row.manager_id) : '—', fixed: false };
    case 'employee_id':
      if (highFixed && row.employee_id === 1003 && rowIndex === 22) return { value: '1030', fixed: true };
      return { value: String(row.employee_id), fixed: false };
    case 'email':
      if (medFixed && row.email === null) return { value: '⚑ flagged', fixed: true };
      return { value: row.email ?? 'null', fixed: false };
    case 'termination_date':
      if (medFixed && isImpossibleSeq(row)) return { value: row.hire_date, fixed: true };
      return { value: row.termination_date ?? '—', fixed: false };
    default: {
      const v = row[col];
      return { value: v !== null && v !== undefined ? String(v) : '—', fixed: false };
    }
  }
};

const getRawText = (row: EmployeeRow, col: EmpKey): string => {
  switch (col) {
    case 'email':            return row.email ?? 'null';
    case 'department':       return row.department ?? 'null';
    case 'termination_date': return row.termination_date ?? '—';
    case 'manager_id':       return row.manager_id !== null ? String(row.manager_id) : '—';
    case 'salary':           return `$${row.salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    default: {
      const v = row[col];
      return v !== null && v !== undefined ? String(v) : '—';
    }
  }
};

const SS_COLS: { key: EmpKey; label: string; width: number }[] = [
  { key: 'employee_id',      label: 'Employee ID',       width: 110 },
  { key: 'name',             label: 'Name',              width: 150 },
  { key: 'email',            label: 'Email',             width: 210 },
  { key: 'department',       label: 'Department',        width: 140 },
  { key: 'hire_date',        label: 'Hire date',         width: 110 },
  { key: 'termination_date', label: 'Termination date',  width: 145 },
  { key: 'salary',           label: 'Salary',            width: 100 },
  { key: 'manager_id',       label: 'Manager ID',        width: 100 },
];

const SS_BORDER = '1px solid #ebede8';
const SS_ROW_H  = 20;
const SS_TOTAL  = 41288;
const SS_PER_PG = 100;

const SortIcon = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 3.5l2.5 2.5 2.5-2.5" stroke="#b0b8b0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FilterIcon = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1.5 2.5h6M2.5 4.5h4M3.5 6.5h2" stroke="#b0b8b0" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// ── Data table ────────────────────────────────────────────────────────────────

const DataTable: React.FC<{ view: DataView; fixPhase: FixPhase }> = ({ view, fixPhase }) => {
  const isBefore = view === 'before';
  const totalPages = Math.ceil(SS_TOTAL / SS_PER_PG);

  const numTdBase: React.CSSProperties = {
    width: 40, minWidth: 40,
    textAlign: 'right', padding: `0 8px`,
    borderBottom: SS_BORDER, borderRight: SS_BORDER,
    fontSize: 11, height: SS_ROW_H, lineHeight: `${SS_ROW_H}px`,
    userSelect: 'none', fontFamily: ff.mono,
  };

  const pageBtnStyle: React.CSSProperties = {
    border: SS_BORDER, borderRadius: 4, backgroundColor: 'transparent',
    cursor: 'pointer', fontSize: 10, padding: '2px 5px',
    color: '#6b7280', lineHeight: 1, fontFamily: ff.primary,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Scrollable grid */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11, whiteSpace: 'nowrap', minWidth: '100%', fontFamily: ff.primary }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <th style={{ ...numTdBase, backgroundColor: '#f3f5f3', borderTop: SS_BORDER, fontWeight: 400, color: '#9ca3af', fontFamily: ff.primary }} />
              {SS_COLS.map(col => (
                <th key={col.key} style={{
                  backgroundColor: '#f3f5f3',
                  borderTop: SS_BORDER, borderBottom: SS_BORDER, borderRight: SS_BORDER,
                  height: SS_ROW_H, padding: '0 8px', textAlign: 'left',
                  fontSize: 11, fontWeight: 500, color: '#374151', width: col.width,
                  fontFamily: ff.primary,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.label}</span>
                    <SortIcon />
                    <FilterIcon />
                  </div>
                </th>
              ))}
              <th style={{
                backgroundColor: '#f3f5f3',
                borderTop: SS_BORDER, borderBottom: SS_BORDER, borderRight: SS_BORDER,
                height: SS_ROW_H, width: 28, textAlign: 'center',
                fontSize: 14, color: '#9ca3af', fontWeight: 400, cursor: 'pointer',
              }}>+</th>
            </tr>
          </thead>
          <tbody>
            {EMPLOYEE_ROWS.map((row, i) => {
              const isDark = i % 2 !== 0;
              const rowBg  = isDark ? '#f3f5f3' : '#ffffff';
              return (
                <tr key={`${row.employee_id}-${i}`}>
                  <td style={{
                    ...numTdBase,
                    backgroundColor: isDark ? '#eaece7' : '#f3f5f3',
                    color: '#9ca3af',
                  }}>{i + 1}</td>
                  {SS_COLS.map(col => {
                    let cellStyle: React.CSSProperties = {};
                    let cellText = '';
                    if (isBefore || fixPhase === 'none') {
                      cellStyle = getBeforeCellStyle(row, col.key);
                      cellText  = getRawText(row, col.key);
                    } else {
                      const { value, fixed } = getAfterCellValue(row, col.key, fixPhase, i);
                      cellText = value;
                      if (fixed) {
                        cellStyle = col.key === 'email' && value === '⚑ flagged'
                          ? { backgroundColor: '#fff7ed', color: '#b45309' }
                          : { backgroundColor: '#f0fdf4', color: '#15803d' };
                      }
                    }
                    return (
                      <td key={col.key} style={{
                        backgroundColor: rowBg,
                        padding: '0 8px',
                        borderBottom: SS_BORDER, borderRight: SS_BORDER,
                        height: SS_ROW_H, lineHeight: `${SS_ROW_H}px`,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        color: '#374151', fontFamily: ff.mono,
                        ...cellStyle,
                      }}>{cellText}</td>
                    );
                  })}
                  <td style={{ backgroundColor: rowBg, borderBottom: SS_BORDER, borderRight: SS_BORDER, height: SS_ROW_H }} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
        padding: `0 ${sp.D}px`, height: 36,
        borderTop: SS_BORDER, backgroundColor: '#ffffff',
        fontSize: 11, color: '#6b7280', fontFamily: ff.primary,
      }}>
        <button style={pageBtnStyle}>{'<<'}</button>
        <button style={pageBtnStyle}>{'<'}</button>
        <span>Page</span>
        <input
          type="text"
          defaultValue="1"
          style={{
            width: 36, height: 22, border: SS_BORDER, borderRadius: 4,
            textAlign: 'center', fontSize: 11, fontFamily: ff.mono,
            color: '#374151', padding: 0, outline: 'none',
          }}
        />
        <span>of {totalPages}</span>
        <button style={pageBtnStyle}>{'>'}</button>
        <button style={pageBtnStyle}>{'>>'}</button>
        <span style={{ marginLeft: 12, color: '#9ca3af' }}>
          Showing rows 1–{SS_PER_PG} of {SS_TOTAL.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

// ── Markdown-lite renderer ────────────────────────────────────────────────────

const renderContent = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line === '') return <div key={i} style={{ height: 6 }} />;
    if (/^High confidence — (\d+) issues?/.test(line)) {
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: fw.semibold, color: '#15803d', backgroundColor: '#dcfce7', borderRadius: 4, padding: '1px 7px' }}>High</span>
          <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{line.replace('High confidence — ', '').replace(' issues', ' issues — ready to apply')}</span>
        </div>
      );
    }
    if (/^Medium confidence — (\d+) issues?/.test(line)) {
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: fw.semibold, color: '#b45309', backgroundColor: '#fef3c7', borderRadius: 4, padding: '1px 7px' }}>Medium</span>
          <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{line.replace('Medium confidence — ', '')}</span>
        </div>
      );
    }
    if (/^Low confidence — (\d+) issues?/.test(line)) {
      return (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 11, fontWeight: fw.semibold, color: '#9333ea', backgroundColor: '#faf5ff', borderRadius: 4, padding: '1px 7px' }}>Low</span>
          <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{line.replace('Low confidence — ', '')}</span>
        </div>
      );
    }
    if (/^• /.test(line)) {
      return (
        <div key={i} style={{ display: 'flex', gap: 6, lineHeight: 1.6, marginBottom: 1 }}>
          <span style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    }
    return <div key={i} style={{ lineHeight: 1.6 }}>{line}</div>;
  });
};

// ── AgentAvatar ───────────────────────────────────────────────────────────────

const AgentAvatar: React.FC<{ working?: boolean; size?: number }> = ({ working, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ flexShrink: 0, borderRadius: '50%', animation: working ? 'ag-pulse 1.4s ease-in-out infinite' : 'none' }}>
    <defs>
      <linearGradient id="ag-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#2770ef" />
        <stop offset="1" stopColor="#5b9ef4" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="12" fill="url(#ag-grad)" />
    <g style={{ transformOrigin: '12px 12px', animation: working ? 'ag-spin 2.2s linear infinite' : 'none' }}>
      <path d="M12 7.5l.8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8z" fill="white" fillOpacity="0.95" />
    </g>
    <circle cx="16.5" cy="8" r="1" fill="white" fillOpacity="0.6" />
    <circle cx="8.5" cy="16" r="0.7" fill="white" fillOpacity="0.5" />
  </svg>
);

// ── TypewriterText ────────────────────────────────────────────────────────────

const TypewriterText: React.FC<{ text: string; active: boolean }> = ({ text, active }) => {
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
  }, [active, text]);
  return <>{displayed}</>;
};

// ── Score popover ─────────────────────────────────────────────────────────────

const ScorePopover: React.FC<{ hasFixes: boolean; fixPhase: FixPhase; modelName: string; onClose: () => void }> = ({ hasFixes, fixPhase, modelName, onClose }) => {
  const issueColumns = COLUMNS.filter(col => col.hasIssue);
  const partialScore = fixPhase === 'high-done' ? 72 : fixPhase === 'medium-done' ? 83 : hasFixes ? 91 : 47;
  return (
    <div style={{
      position: 'absolute', top: 40, left: 0, width: 300, zIndex: 500,
      backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`,
      borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', fontFamily: ff.primary,
    }}>
      <div style={{ padding: `${sp.C}px ${sp.D}px ${sp.B}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-primary'] }}>Quality score: {partialScore} / 100</div>
          <div style={{ fontSize: 10, color: c['content-tertiary'], marginTop: 1 }}>{modelName} · {issueColumns.length} columns with issues</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: 16, lineHeight: 1, padding: 2 }}>×</button>
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto', padding: `${sp.B}px 0` }}>
        {issueColumns.map(col => (
          <div key={col.id} style={{ padding: `${sp.A}px ${sp.D}px`, display: 'flex', alignItems: 'center', gap: sp.C }}>
            <span style={{ fontSize: 10, fontWeight: fw.medium, color: '#6366f1', backgroundColor: '#eef2ff', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
              {col.issueType?.toUpperCase().slice(0, 4)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.mono }}>{col.name}</div>
              <div style={{ fontSize: 10, color: c['content-tertiary'] }}>{col.table}</div>
            </div>
            <div style={{ fontSize: 10, color: c['content-secondary'], flexShrink: 0 }}>{col.tier}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Outcome card helper ───────────────────────────────────────────────────────

const parseOutcomeCard = (message: string): AgentMessage['outcomeCard'] | undefined => {
  const scoreMatch = message.match(/Quality score: (\d+) → (\d+) \(([A-Z])\)/);
  if (!scoreMatch) return undefined;
  const issueMatch = message.match(/(\d+) (?:of \d+ )?issues? resolved/);
  const issueCount = issueMatch?.[1];
  return {
    title: issueCount ? `${issueCount} issues resolved` : 'Issues resolved',
    chips: [`Score: ${scoreMatch[1]} → ${scoreMatch[2]}`, `Grade: ${scoreMatch[3]}`],
    note: 'Save to apply on your next cache refresh.',
  };
};

// ── SaveAsNewModelModal ───────────────────────────────────────────────────────

const SaveAsNewModelModal: React.FC<{
  defaultName: string;
  onConfirm: (name: string, description: string) => void;
  onCancel: () => void;
}> = ({ defaultName, onConfirm, onCancel }) => {
  const [name, setName]               = useState(`${defaultName} (clean)`);
  const [description, setDescription] = useState('');
  const canSave = name.trim().length > 0;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(29,35,47,0.45)',
      zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        width: 480,
        backgroundColor: c['background-base'],
        borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        fontFamily: ff.primary,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: `${sp.F}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>
              Save as new model
            </div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: sp.A }}>
              Your rules chain will be saved to a new model with the cleaned dataset.
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              width: 28, height: 28, border: 'none', borderRadius: 6,
              backgroundColor: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: c['content-secondary'], flexShrink: 0, marginTop: -2,
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <div style={{ padding: `${sp.E}px ${sp.F}px`, display: 'flex', flexDirection: 'column', gap: sp.D }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A }}>
              Model name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: `${sp.B}px ${sp.C}px`,
                border: `1px solid ${name.trim() ? c['border-default'] : '#fca5a5'}`,
                borderRadius: 6, fontSize: fs.sm, fontFamily: ff.primary,
                color: c['content-primary'], backgroundColor: c['background-base'],
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2770EF')}
              onBlur={e => (e.currentTarget.style.borderColor = name.trim() ? c['border-default'] : '#fca5a5')}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A }}>
              Description <span style={{ color: c['content-tertiary'], fontWeight: fw.regular }}>optional</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What was cleaned, and why…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'none',
                padding: `${sp.B}px ${sp.C}px`,
                border: `1px solid ${c['border-default']}`, borderRadius: 6,
                fontSize: fs.sm, fontFamily: ff.primary,
                color: c['content-primary'], backgroundColor: c['background-base'],
                outline: 'none', lineHeight: 1.5,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2770EF')}
              onBlur={e => (e.currentTarget.style.borderColor = c['border-default'])}
            />
          </div>

          {/* Caching — inherited, read-only */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.B }}>
              <label style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'] }}>
                Caching
              </label>
              <span style={{ fontSize: 10, fontWeight: fw.medium, color: '#0369a1', backgroundColor: '#e0f2fe', borderRadius: 4, padding: '2px 6px' }}>
                Inherited from {defaultName}
              </span>
            </div>
            <div style={{
              border: `1px solid ${c['border-divider']}`, borderRadius: 8,
              backgroundColor: c['background-sunken'], overflow: 'hidden',
            }}>
              {[
                { label: 'Cache window',          value: CACHE_DISPLAY.cacheWindow },
                { label: 'Date reference column', value: CACHE_DISPLAY.dateReferenceColumn },
                { label: 'Refresh frequency',     value: MODEL.cacheScheduleLabel, secondary: 'Excluding weekends' },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: 'grid', gridTemplateColumns: '180px 1fr',
                    padding: `${sp.B}px ${sp.D}px`,
                    borderBottom: i < arr.length - 1 ? `1px solid ${c['border-divider']}` : 'none',
                  }}
                >
                  <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{row.label}</div>
                  <div>
                    <div style={{ fontSize: fs.xs, color: c['content-primary'] }}>{row.value}</div>
                    {row.secondary && (
                      <div style={{ fontSize: fs.xs, color: c['content-tertiary'] }}>{row.secondary}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: sp.A, lineHeight: 1.5 }}>
              Caching is required for quality rules to run automatically. You can adjust the schedule from the Caching tab.
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            display: 'flex', gap: sp.C,
            padding: `${sp.C}px ${sp.D}px`,
            backgroundColor: c['background-sunken'],
            border: `1px solid ${c['border-divider']}`,
            borderRadius: 8,
          }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ flexShrink: 0, marginTop: 1, color: c['content-secondary'] }}>
              <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7.5 6.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="7.5" cy="4.5" r="0.8" fill="currentColor"/>
            </svg>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5 }}>
              This creates a standalone new model. It won't be linked to <strong style={{ color: c['content-primary'], fontWeight: fw.medium }}>{defaultName}</strong> — existing dependents like liveboards and answers will continue to point to the original model.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: `${sp.D}px ${sp.F}px`,
          borderTop: `1px solid ${c['border-divider']}`,
          display: 'flex', justifyContent: 'flex-end', gap: sp.B,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: `${sp.B}px ${sp.D}px`,
              border: `1px solid ${c['border-default']}`, borderRadius: 6,
              backgroundColor: 'transparent', fontSize: fs.sm,
              color: c['content-secondary'], cursor: 'pointer', fontFamily: ff.primary,
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={() => canSave && onConfirm(name.trim(), description.trim())}
            style={{
              padding: `${sp.B}px ${sp.D}px`,
              border: 'none', borderRadius: 6,
              backgroundColor: canSave ? '#2770EF' : c['background-subtle'],
              color: canSave ? '#fff' : c['content-tertiary'],
              fontSize: fs.sm, fontWeight: fw.medium,
              cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: ff.primary,
              transition: 'background-color 0.15s',
            }}
          >
            Save as new model
          </button>
        </div>
      </div>
    </div>
  );
};

// ── DocIcon ───────────────────────────────────────────────────────────────────

const DocIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" fill="none"/>
    <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
    <line x1="4.5" y1="9.5" x2="7.5" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
);

// ── MetricTile ────────────────────────────────────────────────────────────────

const MetricTile: React.FC<{ value: string | number; label: string; accent?: string; last?: boolean }> = ({ value, label, accent, last }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: `${sp.D}px ${sp.E}px`,
    borderRight: last ? 'none' : `1px solid ${c['border-divider']}`,
    minWidth: 100,
  }}>
    <span style={{ fontSize: 24, fontWeight: fw.semibold, color: accent ?? c['content-primary'], fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
      {value}
    </span>
    <span style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.3 }}>{label}</span>
  </div>
);

// ── ScanDocumentPanel ─────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  high:   { bg: '#dcfce7', color: '#15803d', label: 'High'   },
  medium: { bg: '#fef3c7', color: '#b45309', label: 'Medium' },
  low:    { bg: '#faf5ff', color: '#9333ea', label: 'Low'    },
};

const TH_STYLE: React.CSSProperties = {
  padding: '7px 12px', textAlign: 'left', fontSize: 11,
  fontWeight: fw.semibold, color: c['content-secondary'],
  backgroundColor: c['background-sunken'],
  borderBottom: `1px solid ${c['border-divider']}`,
  borderRight: `1px solid ${c['border-divider']}`,
  whiteSpace: 'nowrap', userSelect: 'none',
};

const TD_STYLE: React.CSSProperties = {
  padding: '7px 12px', fontSize: 12,
  borderBottom: `1px solid ${c['border-divider']}`,
  borderRight: `1px solid ${c['border-divider']}`,
  verticalAlign: 'middle',
};

const ScanDocumentPanel: React.FC<{ data: ScanCardData; modelName: string; rowsScanned: string; onClose: () => void }> = ({ data, modelName, rowsScanned, onClose }) => {
  const allRows = data.tiers.flatMap(tier => tier.issues.map(issue => ({ ...issue, tier: tier.tier })));
  const acceptedCount   = allRows.filter(r => r.decision === 'accepted').length;
  const documentedCount = allRows.filter(r => r.decision === 'documented').length;
  const flaggedCount    = allRows.filter(r => r.decision === 'flagged').length;

  const DL_BTN_STYLE: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: sp.A, padding: '4px 10px', border: `1px solid ${c['border-divider']}`, borderRadius: 6, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary, flexShrink: 0 };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8 }}>

      {/* Header */}
      <div style={{ height: 44, flexShrink: 0, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C }}>
        <div style={{ color: c['content-secondary'] }}><DocIcon /></div>
        <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], flex: 1 }}>Quality scan</span>
        <button style={DL_BTN_STYLE} onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M3.5 6l2.5 2.5L8.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Download
        </button>
        <button onClick={onClose} style={{ width: 26, height: 26, border: 'none', borderRadius: 6, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-secondary'], flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Context bar */}
      <div style={{ height: 32, flexShrink: 0, borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: c['background-sunken'], display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C }}>
        <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, fontFamily: ff.mono, color: c['content-primary'] }}>{modelName}</span>
        <span style={{ fontSize: fs.xs, color: c['border-divider'] }}>·</span>
        <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Scanned 2 hours ago</span>
        <span style={{ fontSize: fs.xs, color: c['border-divider'] }}>·</span>
        <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{rowsScanned} rows (full dataset)</span>
      </div>

      {/* Metrics */}
      <div style={{ flexShrink: 0, display: 'flex', borderBottom: `1px solid ${c['border-divider']}` }}>
        <MetricTile value={data.totalIssues} label="Issues found" />
        <MetricTile value={acceptedCount}    label="Accepted" accent="#15803d" />
        <MetricTile value={flaggedCount}     label="Flagged for review" accent="#b45309" />
        <MetricTile value={documentedCount}  label="Documented" accent="#1d4ed8" last />
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: ff.primary }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <th style={{ ...TH_STYLE, width: 110 }}>Column</th>
              <th style={{ ...TH_STYLE, width: 120 }}>Table</th>
              <th style={{ ...TH_STYLE, width: 160 }}>Issue type</th>
              <th style={{ ...TH_STYLE, width: 100, textAlign: 'right' }}>Rows</th>
              <th style={{ ...TH_STYLE }}>Resolution</th>
              <th style={{ ...TH_STYLE, width: 110, textAlign: 'center', borderRight: 'none' }}>Decision</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map((row, idx) => {
              const tc = TIER_COLORS[row.tier] ?? TIER_COLORS.low;
              const rowBg = idx % 2 === 0 ? c['background-base'] : c['background-sunken'];
              const dec = row.decision === 'accepted'   ? { bg: '#dcfce7', color: '#15803d', label: 'Accepted'    }
                        : row.decision === 'flagged'    ? { bg: '#fef3c7', color: '#b45309', label: 'Flagged'     }
                        : row.decision === 'documented' ? { bg: '#eff6ff', color: '#1d4ed8', label: 'Documented'  }
                        : null;
              return (
                <tr key={`${row.column}-${idx}`} style={{ backgroundColor: rowBg }}>
                  <td style={{ ...TD_STYLE, fontFamily: ff.mono, fontWeight: fw.medium, color: c['content-primary'] }}>{row.column}</td>
                  <td style={{ ...TD_STYLE, fontFamily: ff.mono, color: c['content-secondary'], fontSize: 11 }}>{row.table}</td>
                  <td style={{ ...TD_STYLE }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                      <span style={{ fontSize: 10, fontWeight: fw.semibold, padding: '1px 5px', borderRadius: 3, backgroundColor: tc.bg, color: tc.color, flexShrink: 0 }}>{tc.label}</span>
                      <span style={{ color: c['content-secondary'] }}>{row.issueType}</span>
                    </div>
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'right', fontFamily: ff.mono, color: c['content-primary'] }}>{row.affectedRows}</td>
                  <td style={{ ...TD_STYLE, color: c['content-primary'] }}>{row.proposedFix}</td>
                  <td style={{ ...TD_STYLE, textAlign: 'center', borderRight: 'none' }}>
                    {dec ? (
                      <span style={{ fontSize: 11, fontWeight: fw.semibold, padding: '2px 8px', borderRadius: 4, backgroundColor: dec.bg, color: dec.color, whiteSpace: 'nowrap' }}>{dec.label}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: c['content-tertiary'] }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── ScanArtifact ──────────────────────────────────────────────────────────────

const ScanArtifact: React.FC<{
  data: ScanCardData;
  modelName: string;
  onOpen: () => void;
}> = ({ data, modelName, onOpen }) => (
  <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 10, backgroundColor: c['background-base'], overflow: 'hidden', marginBottom: sp.B }}>

    {/* Header: icon + title + meta */}
    <div style={{ padding: `${sp.C}px ${sp.D}px`, display: 'flex', alignItems: 'center', gap: sp.C, borderBottom: `1px solid ${c['border-divider']}` }}>
      <div style={{ color: c['content-secondary'], flexShrink: 0 }}><DocIcon /></div>
      <div>
        <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>Quality scan</div>
        <div style={{ fontSize: fs.xs, color: c['content-tertiary'], marginTop: 1 }}>
          {modelName} · v1 · 2 hours ago
        </div>
      </div>
    </div>

    {/* Issues + CTA */}
    <div style={{ padding: `${sp.C}px ${sp.D}px` }}>
      <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B }}>
        {data.totalIssues} issues found
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
        {data.tiers.map(tier => {
          const tc = TIER_COLORS[tier.tier];
          return (
            <span key={tier.tier} style={{ fontSize: 11, fontWeight: fw.medium, padding: '2px 8px', borderRadius: 4, backgroundColor: tc.bg, color: tc.color }}>
              {tc.label} {tier.count}
            </span>
          );
        })}
        <div style={{ flex: 1 }} />
        <button onClick={onOpen} style={{ fontSize: fs.xs, color: c['content-brand'], background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: ff.primary }}>
          View details →
        </button>
      </div>
    </div>

  </div>
);

// ── Rules chain panel ─────────────────────────────────────────────────────────

const ChainIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="3" cy="3.5" r="1.6" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <circle cx="3" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <circle cx="3" cy="10.5" r="1.6" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <line x1="3" y1="5.1" x2="3" y2="5.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="3" y1="8.6" x2="3" y2="8.9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="5.2" y1="3.5" x2="12" y2="3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.55"/>
    <line x1="5.2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.55"/>
    <line x1="5.2" y1="10.5" x2="9" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.55"/>
  </svg>
);

const STATUS_STYLES = {
  staged:     { bg: '#dcfce7', color: '#15803d', label: 'Staged'     },
  documented: { bg: '#eff6ff', color: '#1d4ed8', label: 'Documented' },
  flagged:    { bg: '#fef3c7', color: '#b45309', label: 'Flagged'    },
};

const RulesChainPanel: React.FC<{
  groups: RulesChainGroup[];
  totalRules: number;
  modelName: string;
  beforeGrade: string;
  afterGrade: string;
  onClose: () => void;
}> = ({ groups, totalRules, modelName, beforeGrade, afterGrade, onClose }) => {
  const totalAffected = groups.flatMap(g => g.rules).reduce((sum, r) => {
    const n = parseInt(r.affectedRows.replace(/,/g, '').replace(/\s.*/, ''), 10);
    return isNaN(n) ? sum : sum + n;
  }, 0);

  const DL_BTN: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: sp.A, padding: '4px 10px', border: `1px solid ${c['border-divider']}`, borderRadius: 6, backgroundColor: 'transparent', color: c['content-secondary'], fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary, flexShrink: 0 };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8 }}>

      {/* Header */}
      <div style={{ height: 44, flexShrink: 0, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C }}>
        <div style={{ color: c['content-secondary'] }}><ChainIcon /></div>
        <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>Rules chain</span>
        <span style={{ fontSize: 11, fontWeight: fw.semibold, padding: '1px 7px', borderRadius: 10, backgroundColor: c['background-subtle'], color: c['content-secondary'], border: `1px solid ${c['border-divider']}` }}>{totalRules}</span>
        <div style={{ flex: 1 }} />
        <button style={DL_BTN} onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M3.5 6l2.5 2.5L8.5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Download
        </button>
        <button onClick={onClose} style={{ width: 26, height: 26, border: 'none', borderRadius: 6, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-secondary'], flexShrink: 0 }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])} onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Context bar */}
      <div style={{ height: 32, flexShrink: 0, borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: c['background-sunken'], display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C }}>
        <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, fontFamily: ff.mono, color: c['content-primary'] }}>{modelName}</span>
        <span style={{ fontSize: fs.xs, color: c['border-divider'] }}>·</span>
        <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Applies on next cache refresh</span>
      </div>

      {/* Metrics */}
      <div style={{ flexShrink: 0, display: 'flex', borderBottom: `1px solid ${c['border-divider']}` }}>
        <MetricTile value={totalRules} label="Rules recorded" />
        <MetricTile value={totalAffected.toLocaleString()} label="Rows affected" />
        <MetricTile value={`${beforeGrade} → ~${afterGrade}`} label="Projected grade" accent="#15803d" last />
      </div>

      {/* Rules table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: ff.primary }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <th style={{ ...TH_STYLE, width: 110 }}>Column</th>
              <th style={{ ...TH_STYLE, width: 120 }}>Table</th>
              <th style={{ ...TH_STYLE, width: 150 }}>Issue</th>
              <th style={{ ...TH_STYLE }}>Action recorded</th>
              <th style={{ ...TH_STYLE, width: 90, textAlign: 'right' }}>Rows</th>
              <th style={{ ...TH_STYLE, width: 110, textAlign: 'center', borderRight: 'none' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group, gi) => (
              <React.Fragment key={gi}>
                <tr>
                  <td colSpan={6} style={{
                    padding: `${sp.B}px ${sp.D}px`,
                    backgroundColor: gi === 0 ? '#f3f5f3' : '#eaece7',
                    borderBottom: `1px solid ${c['border-divider']}`,
                    borderTop: gi > 0 ? `1px solid ${c['border-divider']}` : undefined,
                  }}>
                    <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-primary'] }}>{group.label}</span>
                    <span style={{ fontSize: fs.xs, color: c['content-secondary'], marginLeft: sp.B }}>— {group.subtitle}</span>
                    <span style={{ fontSize: 11, color: c['content-tertiary'], float: 'right' }}>
                      {group.rules.length + (group.moreCount ?? 0)} rules
                    </span>
                  </td>
                </tr>
                {group.rules.map((rule, ri) => {
                  const rowBg = ri % 2 === 0 ? c['background-base'] : c['background-sunken'];
                  const st = STATUS_STYLES[rule.status];
                  return (
                    <tr key={ri} style={{ backgroundColor: rowBg }}>
                      <td style={{ ...TD_STYLE, fontFamily: ff.mono, fontWeight: fw.medium, color: c['content-primary'] }}>{rule.column}</td>
                      <td style={{ ...TD_STYLE, fontFamily: ff.mono, color: c['content-secondary'], fontSize: 11 }}>{rule.table}</td>
                      <td style={{ ...TD_STYLE, color: c['content-secondary'] }}>{rule.issueType}</td>
                      <td style={{ ...TD_STYLE }}>
                        <div style={{ color: c['content-primary'] }}>{rule.fixAction}</div>
                        {rule.dependsOn && (
                          <div style={{ fontSize: 10, color: c['content-tertiary'], marginTop: 2 }}>↳ runs after {rule.dependsOn}</div>
                        )}
                      </td>
                      <td style={{ ...TD_STYLE, textAlign: 'right', fontFamily: ff.mono, color: c['content-primary'] }}>{rule.affectedRows}</td>
                      <td style={{ ...TD_STYLE, textAlign: 'center', borderRight: 'none' }}>
                        <span style={{ fontSize: 11, fontWeight: fw.semibold, padding: '2px 8px', borderRadius: 4, backgroundColor: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {group.moreCount != null && (
                  <tr>
                    <td colSpan={6} style={{ ...TD_STYLE, textAlign: 'center', color: c['content-tertiary'], fontStyle: 'italic', borderRight: 'none' }}>
                      + {group.moreCount} more rules in this group
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── ClarifyCard ───────────────────────────────────────────────────────────────

const PersonIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="5.5" r="2.5" fill={c['content-tertiary']} />
    <path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke={c['content-tertiary']} strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

const PencilIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClarifyCard: React.FC<{
  question: string;
  context?: string;
  options: string[];
  onAnswer: (idx: number) => void;
  onSkip: () => void;
  onCustom: (text: string) => void;
  current?: number;
  total?: number;
  disabled?: boolean;
}> = ({ question, context, options, onAnswer, onSkip, onCustom, current, total, disabled }) => {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const [customText, setCustomText] = React.useState('');
  const [customFocused, setCustomFocused] = React.useState(false);

  React.useEffect(() => { setHoveredIdx(null); setCustomText(''); }, [question]);

  return (
    <div style={{
      border: `1px solid ${c['border-divider']}`, borderRadius: 12,
      backgroundColor: c['background-base'], marginBottom: sp.C, overflow: 'hidden',
      opacity: disabled ? 0.55 : 1, pointerEvents: disabled ? 'none' : 'auto',
      transition: 'opacity 0.15s',
    }}>
      {/* Header */}
      <div style={{ padding: `${sp.C}px ${sp.D}px`, display: 'flex', alignItems: 'flex-start', gap: sp.B }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '20px' }}>
            {question}
          </p>
          {context && (
            <p style={{ margin: '4px 0 0', fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.6 }}>
              {context}
            </p>
          )}
        </div>
        {current !== undefined && total !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, paddingTop: 2 }}>
            <span style={{ fontSize: 11, color: c['content-tertiary'], opacity: 0.4, userSelect: 'none' }}>‹</span>
            <span style={{ fontSize: 11, color: c['content-secondary'], fontVariantNumeric: 'tabular-nums', padding: '0 4px' }}>{current} of {total}</span>
            <span style={{ fontSize: 11, color: c['content-tertiary'], opacity: 0.4, userSelect: 'none' }}>›</span>
            <button onClick={onSkip} style={{ marginLeft: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: c['content-tertiary'], flexShrink: 0, fontSize: 14, lineHeight: 1 }}>×</button>
          </div>
        )}
      </div>

      {/* Options */}
      {options.map((opt, idx) => (
        <div key={idx}
          onClick={() => onAnswer(idx)}
          onMouseEnter={() => setHoveredIdx(idx)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: sp.C,
            padding: `${sp.C}px ${sp.D}px`,
            borderTop: `1px solid ${c['border-divider']}`,
            cursor: 'pointer',
            backgroundColor: hoveredIdx === idx ? c['background-sunken'] : 'transparent',
            transition: 'background-color 0.1s',
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: 6, flexShrink: 0,
            backgroundColor: hoveredIdx === idx ? c['background-subtle'] : c['background-sunken'],
            border: `1px solid ${c['border-divider']}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: fw.semibold, color: c['content-secondary'],
            fontFamily: ff.mono, transition: 'background-color 0.1s',
          }}>{idx + 1}</div>
          <span style={{ flex: 1, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>{opt}</span>
          <span style={{ color: c['content-secondary'], opacity: hoveredIdx === idx ? 1 : 0, transition: 'opacity 0.1s' }}>
            <ArrowIcon />
          </span>
        </div>
      ))}

      {/* Enter your own + Skip */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: sp.B,
          padding: `${sp.B + 2}px ${sp.D}px`,
          borderTop: `1px solid ${c['border-divider']}`,
          backgroundColor: customFocused ? c['background-sunken'] : 'transparent',
        }}
      >
        <span style={{ color: c['content-tertiary'], flexShrink: 0 }}><PencilIcon /></span>
        <input
          value={customText}
          onChange={e => setCustomText(e.target.value)}
          onFocus={() => setCustomFocused(true)}
          onBlur={() => setCustomFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter' && customText.trim()) onCustom(customText.trim()); }}
          placeholder="Something else"
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: fs.sm, color: c['content-primary'], fontFamily: ff.primary,
          }}
        />
        <button
          onClick={onSkip}
          style={{
            padding: `${sp.A}px ${sp.C}px`, border: `1px solid ${c['border-divider']}`,
            borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer',
            fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'],
            fontFamily: ff.primary, flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = c['background-base'])}
        >Skip</button>
      </div>
    </div>
  );
};

// ── Right context panel ───────────────────────────────────────────────────────

const TableChevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);


const ModelIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <ellipse cx="7" cy="3.5" rx="5" ry="2" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <path d="M2 3.5v3c0 1.1 2.24 2 5 2s5-.9 5-2v-3" stroke="currentColor" strokeWidth="1.3" fill="none"/>
    <path d="M2 6.5v3c0 1.1 2.24 2 5 2s5-.9 5-2v-3" stroke="currentColor" strokeWidth="1.3" fill="none"/>
  </svg>
);

const RightContextPanel: React.FC<{
  hasFixes: boolean;
  modelName: string;
  onCollapse: () => void;
  onRulesClick?: () => void;
  onScanClick?: () => void;
  onModelClick?: () => void;
}> = ({ hasFixes, modelName, onCollapse, onRulesClick, onScanClick, onModelClick }) => {
  const [createdOpen, setCreatedOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);
  const secondary = c['content-secondary'];

  const sectionHeader = (label: string, open: boolean, onToggle: () => void) => (
    <button onClick={onToggle} style={{
      display: 'flex', alignItems: 'center', gap: sp.B, width: '100%',
      padding: `${sp.B}px ${sp.C}px`, background: 'none', border: 'none', cursor: 'pointer',
      color: secondary, fontSize: fs.xs, fontWeight: fw.medium,
      textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: ff.primary,
    }}>
      <TableChevron open={open} />
      {label}
    </button>
  );

  return (
    <div style={{
      width: 240, flexShrink: 0, borderLeft: `1px solid ${c['border-divider']}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      backgroundColor: c['background-base'], fontFamily: ff.primary,
    }}>
      {/* Panel header */}
      <div style={{ padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: fs.sm, fontWeight: fw.medium, color: secondary }}>Artifacts</span>
        <button
          onClick={onCollapse}
          style={{ width: 24, height: 24, border: 'none', borderRadius: 5, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: secondary }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sectionHeader('Created', createdOpen, () => setCreatedOpen(o => !o))}
        {createdOpen && (
          <div style={{ padding: `0 ${sp.C}px ${sp.C}px`, display: 'flex', flexDirection: 'column' }}>
            <div
              onClick={onScanClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `5px ${sp.B}px`, borderRadius: 4, cursor: 'pointer', color: c['content-primary'] }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <DocIcon />
              <span style={{ fontSize: fs.sm }}>Quality scan</span>
            </div>
            {hasFixes && (
              <div
                onClick={onRulesClick}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `5px ${sp.B}px`, borderRadius: 4, cursor: 'pointer', color: c['content-primary'] }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <ChainIcon />
                <span style={{ fontSize: fs.sm }}>Rules chain</span>
              </div>
            )}
          </div>
        )}

        <div style={{ height: 1, backgroundColor: c['border-divider'], margin: `0 ${sp.C}px` }} />

        {sectionHeader('Context', contextOpen, () => setContextOpen(o => !o))}
        {contextOpen && (
          <div style={{ padding: `0 ${sp.C}px ${sp.C}px`, display: 'flex', flexDirection: 'column' }}>
            <div
              onClick={onModelClick}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `5px ${sp.B}px`, borderRadius: 4, cursor: 'pointer', color: c['content-primary'] }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ModelIcon />
              <span style={{ fontSize: fs.sm }}>{modelName}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Misc helpers ──────────────────────────────────────────────────────────────

let msgCounter = 0;
const mkId = () => `m${++msgCounter}`;
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// ── QualitySessionInner ───────────────────────────────────────────────────────

interface QualitySessionProps { onSave: () => void; onExit: () => void; headerCenter?: React.ReactNode; }
interface QualitySessionInnerProps extends QualitySessionProps { mode: PrepMode; }

const QualitySessionInner: React.FC<QualitySessionInnerProps> = ({ onSave, onExit, headerCenter, mode }) => {
  const cfg = MODE_CONFIG[mode];

  const [messages, setMessages]       = useState<AgentMessage[]>(() => [
    { id: mkId(), type: 'response' as const, content: cfg.openingMessage },
    { id: mkId(), type: 'scan-card' as const, content: '', scanCard: cfg.scanData },
  ]);
  const [isWorking, setIsWorking]     = useState(false);
  const [clarifyStep, setClarifyStep] = useState<{ question: string; context?: string; options: ClarifyOption[]; current?: number; total?: number } | null>(null);
  const [clarifyPending, setClarifyPending] = useState(false);
  const [dataView, setDataView]       = useState<DataView>('before');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [fixPhase, setFixPhase]       = useState<FixPhase>('none');
  const [hasFixes, setHasFixes]       = useState(false);
  const [showScorePopover, setShowScorePopover] = useState(false);
  const [showSaveModal, setShowSaveModal]     = useState(false);
  const [agentCollapsed, setAgentCollapsed] = useState(false);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [agentPanelWidth, setAgentPanelWidth] = useState(380);
  const [centerView, setCenterView]   = useState<'table' | 'scan' | 'rules'>('table');

  const pendingMainStepsRef = useRef<ScriptStep[]>([]);
  const isMounted        = useRef(false);
  const hasFixes_        = useRef(false);
  const chatEndRef       = useRef<HTMLDivElement>(null);
  const dragStartX       = useRef(0);
  const dragStartWidth   = useRef(380);
  const isDraggingAgent  = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    playScript([{ type: 'wait', chips: [cfg.startChip] }, ...cfg.script]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isWorking, clarifyStep]);

  // Drag-to-resize agent panel
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDraggingAgent.current) return;
      const delta = e.clientX - dragStartX.current;
      const next = Math.max(260, Math.min(520, dragStartWidth.current + delta));
      setAgentPanelWidth(next);
    };
    const onUp = () => {
      if (isDraggingAgent.current) {
        isDraggingAgent.current = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const playScript = useCallback(async (steps: ScriptStep[]) => {
    let i = 0;

    while (i < steps.length) {
      if (!isMounted.current) return;
      const step = steps[i];

      if (step.type === 'clarify') {
        pendingMainStepsRef.current = steps.slice(i + 1);
        setClarifyPending(false);
        setClarifyStep({ question: step.question, context: step.context, options: step.options, current: step.current, total: step.total });
        setIsWorking(false);
        return;
      }

      if (step.type === 'scan-reveal') {
        setMessages(prev => [...prev, {
          id: mkId(), type: 'scan-card', content: '', scanCard: step.data,
        }]);
        i++;
        continue;
      }

      // Collect consecutive tool-call steps into one working message
      if (step.type === 'tool-call') {
        const toolSteps: WorkingStep[] = [];
        let j = i;
        while (j < steps.length && steps[j].type === 'tool-call') {
          const s = steps[j] as Extract<ScriptStep, { type: 'tool-call' }>;
          toolSteps.push({
            label: TOOL_LABELS[s.toolName] ?? s.toolName,
            detail: s.detail,
            delay: s.delay,
            status: 'pending',
          });
          j++;
        }
        const workingId = mkId();
        setMessages(prev => [...prev, {
          id: workingId, type: 'working', content: '',
          steps: toolSteps.map(s => ({ ...s })), stepsCollapsed: true,
        }]);
        setIsWorking(true);

        for (let k = 0; k < toolSteps.length; k++) {
          if (!isMounted.current) return;
          setMessages(prev => prev.map(m => m.id === workingId
            ? { ...m, steps: m.steps!.map((s, idx) => idx === k ? { ...s, status: 'running' as const } : s) }
            : m));
          await wait(toolSteps[k].delay > 0 ? toolSteps[k].delay : 800);
          if (!isMounted.current) return;
          setMessages(prev => prev.map(m => m.id === workingId
            ? { ...m, steps: m.steps!.map((s, idx) => idx === k ? { ...s, status: 'done' as const } : s) }
            : m));
        }

        await wait(400);
        if (!isMounted.current) return;
        // Do NOT auto-collapse — steps stay expanded
        setIsWorking(false);
        i = j;
        continue;
      }

      if (step.type === 'wait') {
        const chipObjects = (step.chips ?? []).map(ch => ({ label: ch, value: ch }));
        pendingMainStepsRef.current = steps.slice(i + 1);
        setMessages(prev => {
          const last = [...prev].map((m, idx) => ({ m, idx }))
            .filter(({ m }) => m.type === 'response')
            .pop();
          if (!last) return prev;
          return prev.map((m, idx) => idx === last.idx ? { ...m, interactiveChips: chipObjects } : m);
        });
        setClarifyStep(null);
        setClarifyPending(false);
        setIsWorking(false);
        return;
      }

      if (step.type === 'fix-partial') {
        setFixPhase(step.phase);
        if (step.phase !== 'none') {
          hasFixes_.current = true;
          setHasFixes(true);
          setCompareEnabled(true);
          setDataView('after');
        }
        setMessages(prev => [...prev, { id: mkId(), type: 'execution', content: step.message }]);
        i++;
        continue;
      }

      if (step.type === 'fix') {
        setFixPhase('all-done');
        hasFixes_.current = true;
        setHasFixes(true);
        setCompareEnabled(true);
        setDataView('after');
        const outcomeCard = parseOutcomeCard(step.message);
        setMessages(prev => [...prev, { id: mkId(), type: 'response', content: step.message, outcomeCard }]);
        setClarifyStep(null);
        setClarifyPending(false);
        setIsWorking(false);
        return;
      }

      if (step.type === 'agent') {
        if (step.delay > 0) {
          setIsWorking(true);
          await wait(step.delay);
          if (!isMounted.current) return;
          setIsWorking(false);
        }
        setMessages(prev => [...prev, { id: mkId(), type: 'response', content: step.content }]);
        i++;
        continue;
      }

      if (step.type === 'fix-table') {
        setMessages(prev => [...prev, { id: mkId(), type: 'response', content: step.intro, fixTable: step.rows }]);
        i++;
        continue;
      }

      i++;
    }
    setClarifyStep(null);
    setClarifyPending(false);
    setIsWorking(false);
  }, []);

  const handleClarifyAnswer = useCallback((idx: number) => {
    if (!clarifyStep || clarifyPending) return;
    const option = clarifyStep.options[idx];
    setClarifyPending(true);
    setMessages(prev => [...prev, { id: mkId(), type: 'user', content: option.label }]);
    const combined = [...option.thenSteps, ...pendingMainStepsRef.current];
    pendingMainStepsRef.current = [];
    playScript(combined);
  }, [clarifyStep, clarifyPending, playScript]);

  const handleSkip = useCallback(() => {
    if (!clarifyStep || clarifyPending) return;
    setClarifyPending(true);
    const remaining = pendingMainStepsRef.current;
    pendingMainStepsRef.current = [];
    playScript(remaining);
  }, [clarifyStep, clarifyPending, playScript]);

  const handleCustom = useCallback((text: string) => {
    if (!clarifyStep || clarifyPending) return;
    setClarifyPending(true);
    setMessages(prev => [...prev, { id: mkId(), type: 'user', content: text }]);
    const primarySteps = clarifyStep.options[0]?.thenSteps ?? [];
    const combined = [...primarySteps, ...pendingMainStepsRef.current];
    pendingMainStepsRef.current = [];
    playScript(combined);
  }, [clarifyStep, clarifyPending, playScript]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    setMessages(prev => prev.map(m => ({ ...m, interactiveChips: undefined })));
    setMessages(prev => [...prev, { id: mkId(), type: 'user', content: text }]);

    if (text === 'Rescan') {
      pendingMainStepsRef.current = [];
      const scanData = cfg.scanData;
      const modeScript = cfg.script;
      playScript([
        ...RESCAN_STEPS_BASE,
        { type: 'scan-reveal' as const, data: scanData },
        ...modeScript,
      ]);
      return;
    }

    // Resume script paused at a wait step
    if (pendingMainStepsRef.current.length > 0) {
      const remaining = pendingMainStepsRef.current;
      pendingMainStepsRef.current = [];
      playScript(remaining);
      return;
    }

    if (hasFixes_.current) {
      setIsWorking(true);
      setTimeout(() => {
        if (!isMounted.current) return;
        setIsWorking(false);
        setMessages(prev => [...prev, { id: mkId(), type: 'response', content: 'What else would you like to explore?' }]);
      }, 700);
    }
  }, [playScript, cfg]);

  const handleToggleWorkingSteps = useCallback((msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, stepsCollapsed: !m.stepsCollapsed } : m));
  }, []);

  const currentGrade = fixPhase === 'high-done' ? (cfg.highDoneScore >= 90 ? 'A' : cfg.highDoneScore >= 80 ? 'B' : 'C') : fixPhase === 'medium-done' ? (cfg.mediumDoneScore >= 90 ? 'A' : 'B') : hasFixes ? cfg.afterGrade : cfg.beforeGrade;

  const hasActiveWorking = messages.some(m => m.type === 'working' && !m.stepsCollapsed && m.steps?.some(s => s.status === 'running'));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: ff.primary, backgroundColor: c['background-base'] }}>
      <style>{`
        @keyframes ag-spin  { to { transform: rotate(360deg); } }
        @keyframes ag-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(39,112,239,0.4); } 50% { box-shadow: 0 0 0 5px rgba(39,112,239,0); } }
        @keyframes ag-step-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sp-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Session top bar — chat session chrome only, no artifact actions */}
      <div style={{
        height: 48, flexShrink: 0, backgroundColor: c['background-base'],
        borderBottom: `1px solid ${c['border-divider']}`,
        display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: sp.C,
      }}>
        {/* Back button */}
        <button
          onClick={onExit}
          style={{
            width: 28, height: 28, border: 'none', borderRadius: 6,
            backgroundColor: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: c['content-secondary'], flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-secondary'] }}>Prep a model</span>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {headerCenter}
        </div>
      </div>

      {/* 3-panel body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Agent panel — left */}
        {agentCollapsed ? (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', paddingTop: sp.D, borderRight: `1px solid ${c['border-divider']}` }}>
            <button
              onClick={() => setAgentCollapsed(false)}
              title="Open agent"
              style={{ width: 28, height: 28, border: 'none', borderRadius: 6, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-secondary'], margin: `0 ${sp.B}px` }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        ) : (
          <div style={{ width: agentPanelWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${c['border-divider']}` }}>

            {/* Agent panel header */}
            <div style={{ padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
              {/* AI icon */}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: c['content-brand'] }}>
                  <circle cx="8" cy="8" r="3" fill="currentColor" opacity="0.9"/>
                  <circle cx="8" cy="2" r="1.2" fill="currentColor" opacity="0.5"/>
                  <circle cx="8" cy="14" r="1.2" fill="currentColor" opacity="0.5"/>
                  <circle cx="2" cy="8" r="1.2" fill="currentColor" opacity="0.5"/>
                  <circle cx="14" cy="8" r="1.2" fill="currentColor" opacity="0.5"/>
                  <circle cx="3.8" cy="3.8" r="1" fill="currentColor" opacity="0.3"/>
                  <circle cx="12.2" cy="3.8" r="1" fill="currentColor" opacity="0.3"/>
                  <circle cx="3.8" cy="12.2" r="1" fill="currentColor" opacity="0.3"/>
                  <circle cx="12.2" cy="12.2" r="1" fill="currentColor" opacity="0.3"/>
                </svg>
              </div>
              <button
                onClick={() => setAgentCollapsed(true)}
                style={{ width: 24, height: 24, border: 'none', borderRadius: 5, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-secondary'] }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 3L5 7 9 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>

            {/* Message list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.D}px` }}>

              {messages.map(msg => {
                if (msg.type === 'working') {
                  const steps = msg.steps ?? [];
                  const allDone = steps.every(s => s.status === 'done');
                  const isRunning = steps.some(s => s.status === 'running');
                  const isCollapsed = msg.stepsCollapsed ?? false;
                  const visibleSteps = steps.filter(s => s.status !== 'pending');

                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: sp.C, alignItems: 'flex-start', marginBottom: sp.D, animation: 'ag-step-in 0.2s ease-out' }}>
                      <AgentAvatar working={isRunning} />
                      <div style={{ flex: 1, minWidth: 0, paddingTop: 3 }}>
                        {allDone && (
                          <button onClick={() => handleToggleWorkingSteps(msg.id)} style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                            fontFamily: ff.primary, marginBottom: isCollapsed ? 0 : sp.C,
                          }}>
                            <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontWeight: fw.medium }}>Show work</span>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                              style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}>
                              <polyline points="2,4 6,8 10,4" />
                            </svg>
                          </button>
                        )}
                        {(!allDone || !isCollapsed) && visibleSteps.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {visibleSteps.map((step, si) => (
                              <div key={si} style={{ display: 'flex', gap: 12, animation: 'ag-step-in 0.22s ease' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 10, flexShrink: 0 }}>
                                  <div style={{
                                    width: 10, height: 10, borderRadius: '50%',
                                    backgroundColor: step.status === 'done' ? '#2770EF' : step.status === 'running' ? '#93c5fd' : c['border-divider'],
                                    flexShrink: 0, marginTop: 5, transition: 'background-color 0.3s',
                                  }} />
                                  {si < visibleSteps.length - 1 && (
                                    <div style={{ flex: 1, width: 1, minHeight: 10, marginTop: 3, backgroundColor: c['border-divider'] }} />
                                  )}
                                </div>
                                <div style={{ flex: 1, paddingBottom: si < visibleSteps.length - 1 ? sp.D : 0 }}>
                                  <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, lineHeight: '20px', color: c['content-primary'] }}>
                                    {step.label}
                                  </span>
                                  {step.detail && (
                                    <p style={{ margin: '3px 0 0', fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }}>
                                      {step.status === 'running'
                                        ? <TypewriterText text={step.detail} active={true} />
                                        : step.detail}
                                    </p>
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

                if (msg.type === 'scan-card') {
                  return (
                    <div key={msg.id} style={{ marginBottom: sp.D, animation: 'ag-step-in 0.2s ease-out' }}>
                      {msg.scanCard && (
                        <ScanArtifact
                          data={msg.scanCard}
                          modelName={cfg.modelName}
                          onOpen={() => setCenterView('scan')}
                        />
                      )}
                      {msg.interactiveChips && msg.interactiveChips.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, marginTop: sp.C }}>
                          {msg.interactiveChips.map(chip => (
                            <button key={chip.value}
                              onClick={() => handleSend(chip.value)}
                              style={{
                                padding: `${sp.A + 2}px ${sp.C}px`,
                                borderRadius: 20,
                                border: `1px solid ${c['content-brand']}`,
                                backgroundColor: c['background-base'],
                                color: c['content-brand'],
                                fontSize: fs.xs, fontWeight: fw.medium,
                                cursor: 'pointer',
                                fontFamily: ff.primary, lineHeight: '18px',
                              }}
                            >{chip.label}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                if (msg.type === 'response') {
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: sp.C, alignItems: 'flex-start', marginBottom: sp.D, animation: 'ag-step-in 0.2s ease-out' }}>
                      <AgentAvatar />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: fs.sm, color: c['content-primary'] }}>
                          {renderContent(msg.content)}
                        </div>
                        {/* Fix table */}
                        {msg.fixTable && msg.fixTable.length > 0 && (
                          <div style={{ marginTop: sp.B, borderRadius: 6, overflow: 'hidden', border: `1px solid ${c['border-divider']}` }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: ff.primary }}>
                              <thead>
                                <tr>
                                  <th style={{ ...TH_STYLE, fontSize: 10 }}>Column</th>
                                  <th style={{ ...TH_STYLE, fontSize: 10 }}>Issue</th>
                                  <th style={{ ...TH_STYLE, fontSize: 10 }}>Fix</th>
                                  <th style={{ ...TH_STYLE, fontSize: 10, textAlign: 'right', borderRight: 'none' }}>Rows</th>
                                </tr>
                              </thead>
                              <tbody>
                                {msg.fixTable.map((row, rowIdx) => (
                                  <tr key={rowIdx}>
                                    <td style={{ ...TD_STYLE, fontFamily: ff.mono, fontSize: 11 }}>{row.column}</td>
                                    <td style={{ ...TD_STYLE, fontSize: 11 }}>{row.issue}</td>
                                    <td style={{ ...TD_STYLE, fontSize: 11 }}>{row.fix}</td>
                                    <td style={{ ...TD_STYLE, fontSize: 11, textAlign: 'right', borderRight: 'none' }}>{row.rows}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {/* Interactive chips */}
                        {msg.interactiveChips && msg.interactiveChips.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, marginTop: sp.C }}>
                            {msg.interactiveChips.map(chip => (
                              <button key={chip.value} onClick={() => handleSend(chip.value)}
                                style={{
                                  padding: `${sp.A}px ${sp.C}px`, border: `1px solid ${c['border-divider']}`,
                                  borderRadius: 14, backgroundColor: c['background-subtle'],
                                  fontSize: fs.xs, color: c['content-primary'],
                                  cursor: 'pointer', fontFamily: ff.primary, fontWeight: fw.medium,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = '#2770EF')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = c['border-divider'])}
                              >{chip.label}</button>
                            ))}
                          </div>
                        )}
                        {/* Outcome card */}
                        {msg.outcomeCard && (
                          <div style={{
                            marginTop: sp.C, padding: `${sp.C}px ${sp.D}px`,
                            border: `1px solid ${c['border-divider']}`, borderRadius: 8,
                            backgroundColor: c['background-base'],
                          }}>
                            <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B }}>
                              {msg.outcomeCard.title}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.A, marginBottom: sp.B }}>
                              {msg.outcomeCard.chips.map(chip => (
                                <span key={chip} style={{ fontSize: fs.xs, padding: '2px 8px', borderRadius: 10, backgroundColor: '#dcfce7', color: '#15803d', fontWeight: fw.medium }}>{chip}</span>
                              ))}
                            </div>
                            <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'] }}>{msg.outcomeCard.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (msg.type === 'user') {
                  return (
                    <div key={msg.id} style={{ marginBottom: sp.D, animation: 'ag-step-in 0.2s ease-out' }}>
                      <div style={{ backgroundColor: c['background-subtle'], borderRadius: 10, padding: `${sp.C}px ${sp.D}px ${sp.D}px` }}>
                        <div style={{ marginBottom: sp.B }}><PersonIcon /></div>
                        <div style={{ fontSize: fs.sm, color: c['content-primary'], lineHeight: 1.6 }}>{msg.content}</div>
                      </div>
                    </div>
                  );
                }

                if (msg.type === 'execution') {
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: sp.C, alignItems: 'flex-start', marginBottom: sp.D, animation: 'ag-step-in 0.2s ease-out' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d', fontSize: 13, fontWeight: fw.semibold }}>✓</div>
                      <div style={{ flex: 1, minWidth: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: 1.6, paddingTop: 3 }}>
                        {renderContent(msg.content)}
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {/* Thinking indicator */}
              {isWorking && !hasActiveWorking && (
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.D }}>
                  <AgentAvatar working={true} />
                  <span style={{ fontSize: fs.sm, color: c['content-secondary'] }}>Thinking…</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* ClarifyCard + PromptBar */}
            <div style={{ padding: `${sp.C}px ${sp.D}px`, borderTop: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
              {clarifyStep && (
                <ClarifyCard
                  question={clarifyStep.question}
                  context={clarifyStep.context}
                  options={clarifyStep.options.map(o => o.label)}
                  onAnswer={handleClarifyAnswer}
                  onSkip={handleSkip}
                  onCustom={handleCustom}
                  current={clarifyStep.current}
                  total={clarifyStep.total}
                  disabled={clarifyPending}
                />
              )}
              {!clarifyStep && (
                <PromptBar
                  disabled={false}
                  hasFixes={hasFixes}
                  onSend={handleSend}
                />
              )}
              <div style={{ marginTop: sp.A, fontSize: 11, color: c['content-tertiary'] }}>
                Quality agent responses should be reviewed.
              </div>
            </div>
          </div>
        )}

        {/* Drag handle */}
        {!agentCollapsed && (
          <div
            onMouseDown={e => {
              e.preventDefault();
              dragStartX.current = e.clientX;
              dragStartWidth.current = agentPanelWidth;
              isDraggingAgent.current = true;
              document.body.style.userSelect = 'none';
              document.body.style.cursor = 'col-resize';
            }}
            style={{ width: 5, flexShrink: 0, cursor: 'col-resize', backgroundColor: c['background-base'] }}
          />
        )}

        {/* Artifact space — center */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '8px 8px 8px 0' }}>
          {centerView === 'scan' ? (
            <ScanDocumentPanel data={cfg.scanData} modelName={cfg.modelName} rowsScanned={cfg.rowsScanned} onClose={() => setCenterView('table')} />
          ) : centerView === 'rules' ? (
            <RulesChainPanel
              groups={MODE_RULES[mode]}
              totalRules={MODE_RULE_COUNTS[mode]}
              modelName={cfg.modelName}
              beforeGrade={cfg.beforeGrade}
              afterGrade={cfg.afterGrade}
              onClose={() => setCenterView('table')}
            />
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              border: `1px solid ${c['border-divider']}`, borderRadius: 8,
              backgroundColor: c['background-base'],
            }}>
              {/* Data model artifact header */}
              <div style={{
                height: 44, padding: `0 ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`,
                display: 'flex', alignItems: 'center', gap: sp.C, flexShrink: 0,
                backgroundColor: c['background-base'],
              }}>
                {/* Icon + name */}
                <div style={{ color: c['content-secondary'], display: 'flex', alignItems: 'center' }}><ModelIcon /></div>
                <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{cfg.modelName}</span>

                {/* Quality grade badge — projected when rules are staged */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowScorePopover(v => !v)}
                    title={hasFixes ? 'Projected grade — based on staged rules, updates on next cache refresh' : 'Current quality grade'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: sp.A,
                      padding: '2px 8px', borderRadius: 5,
                      backgroundColor: hasFixes ? '#dcfce7' : '#fef2f2',
                      border: `1px solid ${hasFixes ? '#86efac' : '#fca5a5'}`,
                      cursor: 'pointer', fontFamily: ff.primary,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: fw.semibold, color: hasFixes ? '#15803d' : '#dc2626' }}>
                      {hasFixes ? `~${currentGrade}` : currentGrade}
                    </span>
                    {hasFixes && <span style={{ fontSize: 10, color: '#15803d', fontWeight: fw.medium }}>projected</span>}
                    <span style={{ fontSize: 10, color: c['content-tertiary'] }}>▾</span>
                  </button>
                  {showScorePopover && (
                    <ScorePopover hasFixes={hasFixes} fixPhase={fixPhase} modelName={cfg.modelName} onClose={() => setShowScorePopover(false)} />
                  )}
                </div>

                <div style={{ flex: 1 }} />

                {/* View before/after toggle — only when compare is available */}
                {compareEnabled && (
                  <button
                    onClick={() => setDataView(v => v === 'before' ? 'after' : 'before')}
                    style={{
                      padding: '4px 10px', border: `1px solid ${c['border-divider']}`, borderRadius: 6,
                      backgroundColor: 'transparent', color: c['content-brand'],
                      fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary,
                    }}
                  >
                    {dataView === 'before' ? 'Preview with rules →' : '← Raw scan data'}
                  </button>
                )}

                {/* Rescan — secondary action */}
                <button
                  onClick={() => handleSend('Rescan')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: sp.A,
                    padding: '4px 10px', border: `1px solid ${c['border-divider']}`, borderRadius: 6,
                    backgroundColor: 'transparent', color: c['content-secondary'],
                    fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 6a4 4 0 1 1-1.17-2.83" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 2v2.5H7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Rescan
                </button>

                {/* Save — primary action, opens Save as new model modal */}
                <button
                  onClick={hasFixes ? () => setShowSaveModal(true) : undefined}
                  style={{
                    padding: '4px 12px', border: 'none', borderRadius: 6,
                    backgroundColor: hasFixes ? '#2770EF' : c['background-subtle'],
                    color: hasFixes ? '#fff' : c['content-tertiary'],
                    fontSize: fs.xs, fontWeight: fw.medium,
                    cursor: hasFixes ? 'pointer' : 'not-allowed',
                    fontFamily: ff.primary, transition: 'background-color 0.15s',
                  }}
                >
                  Save
                </button>

                {/* Close — exits prep session */}
                <button
                  onClick={onExit}
                  style={{
                    width: 26, height: 26, border: 'none', borderRadius: 6,
                    backgroundColor: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: c['content-secondary'],
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
                <DataTable view={dataView} fixPhase={fixPhase} />
              </div>
            </div>
          )}
        </div>

        {/* Right context panel */}
        {contextPanelOpen ? (
          <RightContextPanel
            hasFixes={hasFixes}
            modelName={cfg.modelName}
            onCollapse={() => setContextPanelOpen(false)}
            onRulesClick={() => setCenterView('rules')}
            onScanClick={() => setCenterView('scan')}
            onModelClick={() => setCenterView('table')}
          />
        ) : (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', paddingTop: sp.D, borderLeft: `1px solid ${c['border-divider']}` }}>
            <button
              onClick={() => setContextPanelOpen(true)}
              title="Open context panel"
              style={{ width: 28, height: 28, border: 'none', borderRadius: 6, backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-secondary'], margin: `0 ${sp.B}px` }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l-4 4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Save as new model modal */}
      {showSaveModal && (
        <SaveAsNewModelModal
          defaultName={cfg.modelName}
          onConfirm={() => { setShowSaveModal(false); onSave(); }}
          onCancel={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
};

// ── PromptBar ─────────────────────────────────────────────────────────────────

const PromptBar: React.FC<{ disabled: boolean; hasFixes: boolean; onSend: (text: string) => void }> = ({ disabled, hasFixes, onSend }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-end' }}>
      <textarea
        value={inputValue}
        disabled={disabled}
        onChange={e => setInputValue(e.target.value)}
        placeholder={disabled ? '' : hasFixes ? 'Ask a follow-up…' : 'Type a message…'}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
        }}
        style={{
          flex: 1, minWidth: 0, resize: 'none', minHeight: 44, maxHeight: 120, overflow: 'auto',
          padding: `${sp.C}px`, border: `1px solid ${c['border-divider']}`, borderRadius: 10,
          fontSize: fs.sm, fontFamily: ff.primary, color: c['content-primary'],
          backgroundColor: disabled ? c['background-sunken'] : c['background-subtle'],
          outline: 'none', lineHeight: 1.5, opacity: disabled ? 0.5 : 1,
        }}
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled}
        style={{
          width: 34, height: 34, flexShrink: 0, border: 'none', borderRadius: '50%',
          backgroundColor: disabled ? c['background-subtle'] : '#2770EF',
          color: disabled ? c['content-tertiary'] : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
        }}
      >↑</button>
    </div>
  );
};

// ── Inline mode picker ────────────────────────────────────────────────────────

const MODE_OPTIONS: { id: PrepMode; label: string; sub: string }[] = [
  { id: 'interactive', label: 'Interactive',  sub: 'Review each fix before it\'s applied'          },
  { id: 'batch',       label: 'Batch',        sub: 'Apply safe fixes together, decide on the rest' },
  { id: 'autonomous',  label: 'Autonomous',   sub: 'Agent decides — you review the summary'        },
];

const InlineModePicker: React.FC<{ active: PrepMode; onChange: (m: PrepMode) => void }> = ({ active, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const option = MODE_OPTIONS.find(m => m.id === active)!;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6,
          border: `1px solid ${c['border-divider']}`,
          backgroundColor: c['background-subtle'],
          cursor: 'pointer', fontFamily: ff.primary,
        }}
      >
        <span style={{ fontSize: 10, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: fw.medium }}>Mode</span>
        <span style={{ fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium }}>{option.label}</span>
        <span style={{ fontSize: 10, color: c['content-tertiary'] }}>{open ? '▲' : '▾'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          borderRadius: 10, padding: `${sp.C}px`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          minWidth: 240, fontFamily: ff.primary,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {MODE_OPTIONS.map(m => {
              const isActive = active === m.id;
              return (
                <button key={m.id} onClick={() => { onChange(m.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: sp.B, padding: `5px ${sp.B}px`,
                    borderRadius: 6, border: 'none',
                    backgroundColor: isActive ? 'rgba(39,112,239,0.22)' : 'transparent',
                    color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                    fontSize: fs.sm, fontWeight: isActive ? fw.medium : fw.regular,
                    cursor: 'pointer', fontFamily: ff.primary, textAlign: 'left', width: '100%',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: isActive ? '#2770EF' : 'rgba(255,255,255,0.18)' }} />
                  <div>
                    <div>{m.label}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{m.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── QualitySession (wrapper) ──────────────────────────────────────────────────

const QualitySession: React.FC<QualitySessionProps> = ({ onSave, onExit, headerCenter }) => {
  const [mode, setMode] = useState<PrepMode>('interactive');
  const [sessionKey, setSessionKey] = useState(0);

  const handleModeChange = (m: PrepMode) => {
    setMode(m);
    setSessionKey(k => k + 1);
  };

  const composedHeader = (
    <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
      {headerCenter}
      <InlineModePicker active={mode} onChange={handleModeChange} />
    </div>
  );

  return (
    <QualitySessionInner key={sessionKey} mode={mode} onSave={onSave} onExit={onExit} headerCenter={composedHeader} />
  );
};

export default QualitySession;
