// ── Model ──────────────────────────────────────────────────────────────────────

export interface DataModel {
  id: string;
  name: string;
  connection: string;
  tables: string[];
  totalRows: number;
  totalColumns: number;
  lastCached: string;
  isCached: boolean;
  cacheScheduleLabel: string; // human-readable frequency
  nextCacheAt: string;        // ISO timestamp of next scheduled cache
}

export const MODEL: DataModel = {
  id: 'fnops-final',
  name: 'fnops-final',
  connection: 'PROD_SNOWFLAKE',
  tables: ['billing_accounts', 'line_items', 'subscriptions'],
  totalRows: 68432,
  totalColumns: 22,
  lastCached: '2026-04-09T08:14:00Z',
  isCached: true,
  cacheScheduleLabel: 'Every 6 hours',
  nextCacheAt: '2026-04-09T14:14:00Z',
};

// ── Column profile ─────────────────────────────────────────────────────────────

export type IssueType = 'nulls' | 'blanks' | 'duplicates' | 'anomaly' | 'type_mismatch';

export interface ColumnProfile {
  id: string;
  name: string;
  table: string;
  dataType: string;
  nullPct: number;       // 0–100
  uniqueCount: number;
  hasIssue: boolean;
  issueType?: IssueType;
}

export const COLUMNS: ColumnProfile[] = [
  // billing_accounts (8 columns)
  { id: 'c1',  name: 'account_id',              table: 'billing_accounts', dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 68432,  hasIssue: false },
  { id: 'c2',  name: 'account_name',             table: 'billing_accounts', dataType: 'VARCHAR',   nullPct: 2.1,  uniqueCount: 4210,   hasIssue: true, issueType: 'blanks' },
  { id: 'c3',  name: 'billing_entry_aws',        table: 'billing_accounts', dataType: 'VARCHAR',   nullPct: 18.4, uniqueCount: 1830,   hasIssue: true, issueType: 'nulls' },
  { id: 'c4',  name: 'billing_period_aws',       table: 'billing_accounts', dataType: 'DATE_TIME', nullPct: 0,    uniqueCount: 24,     hasIssue: true, issueType: 'type_mismatch' },
  { id: 'c5',  name: 'start_date_aws',           table: 'billing_accounts', dataType: 'DATE_TIME', nullPct: 0,    uniqueCount: 730,    hasIssue: false },
  { id: 'c6',  name: 'end_date_aws',             table: 'billing_accounts', dataType: 'DATE_TIME', nullPct: 0,    uniqueCount: 730,    hasIssue: false },
  { id: 'c7',  name: 'reservation_arn',          table: 'billing_accounts', dataType: 'VARCHAR',   nullPct: 61.2, uniqueCount: 892,    hasIssue: true, issueType: 'nulls' },
  { id: 'c8',  name: 'payer_account_id',         table: 'billing_accounts', dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 12,     hasIssue: false },
  // line_items (10 columns)
  { id: 'c9',  name: 'line_item_id',             table: 'line_items',       dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 68432,  hasIssue: false },
  { id: 'c10', name: 'line_item_type',           table: 'line_items',       dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 8,      hasIssue: true, issueType: 'type_mismatch' },
  { id: 'c11', name: 'line_item_description',    table: 'line_items',       dataType: 'VARCHAR',   nullPct: 3.7,  uniqueCount: 15840,  hasIssue: true, issueType: 'blanks' },
  { id: 'c12', name: 'blended_cost',             table: 'line_items',       dataType: 'DOUBLE',    nullPct: 0,    uniqueCount: 48291,  hasIssue: true, issueType: 'anomaly' },
  { id: 'c13', name: 'unblended_cost',           table: 'line_items',       dataType: 'DOUBLE',    nullPct: 0,    uniqueCount: 47102,  hasIssue: false },
  { id: 'c14', name: 'availability_zone',        table: 'line_items',       dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 22,     hasIssue: true, issueType: 'duplicates' },
  { id: 'c15', name: 'product_code',             table: 'line_items',       dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 184,    hasIssue: false },
  { id: 'c16', name: 'usage_type',               table: 'line_items',       dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 412,    hasIssue: false },
  { id: 'c17', name: 'operation',                table: 'line_items',       dataType: 'VARCHAR',   nullPct: 7.2,  uniqueCount: 67,     hasIssue: true, issueType: 'nulls' },
  { id: 'c18', name: 'region',                   table: 'line_items',       dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 18,     hasIssue: false },
  // subscriptions (4 columns)
  { id: 'c19', name: 'subscription_id',          table: 'subscriptions',    dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 4210,   hasIssue: false },
  { id: 'c20', name: 'product_code',             table: 'subscriptions',    dataType: 'VARCHAR',   nullPct: 0,    uniqueCount: 184,    hasIssue: false },
  { id: 'c21', name: 'subscription_start',       table: 'subscriptions',    dataType: 'DATE_TIME', nullPct: 0,    uniqueCount: 1095,   hasIssue: false },
  { id: 'c22', name: 'subscription_end',         table: 'subscriptions',    dataType: 'DATE_TIME', nullPct: 12.8, uniqueCount: 890,    hasIssue: true, issueType: 'nulls' },
];

// ── Issues ────────────────────────────────────────────────────────────────────

export interface Issue {
  id: string;
  columnId: string;
  columnName: string;
  table: string;
  issueType: IssueType;
  affectedRows: number;
  affectedPct: number;
  recommendation: string;
  recommendationDetail: string;
  fixValue: string; // short editable value shown in the wizard (user can override)
  willFail?: boolean; // used in demo to simulate a failed job
}

export const ISSUES: Issue[] = [
  {
    id: 'i1',
    columnId: 'c3',
    columnName: 'billing_entry_aws',
    table: 'billing_accounts',
    issueType: 'nulls',
    affectedRows: 12588,
    affectedPct: 18.4,
    recommendation: 'Replace nulls with empty string',
    recommendationDetail: 'Set all NULL values to an empty string to maintain row integrity.',
    fixValue: '""',
  },
  {
    id: 'i2',
    columnId: 'c7',
    columnName: 'reservation_arn',
    table: 'billing_accounts',
    issueType: 'nulls',
    affectedRows: 41876,
    affectedPct: 61.2,
    recommendation: 'Replace nulls with placeholder',
    recommendationDetail: '61.2% of rows have NULL. These represent non-reserved instances. Replace with a placeholder for downstream filter compatibility.',
    fixValue: '"(none)"',
  },
  {
    id: 'i3',
    columnId: 'c17',
    columnName: 'operation',
    table: 'line_items',
    issueType: 'nulls',
    affectedRows: 4927,
    affectedPct: 7.2,
    recommendation: 'Replace nulls with "Unknown"',
    recommendationDetail: 'NULL values detected in operation column. Replace with "Unknown" to enable grouping in downstream analyses.',
    fixValue: '"Unknown"',
  },
  {
    id: 'i4',
    columnId: 'c22',
    columnName: 'subscription_end',
    table: 'subscriptions',
    issueType: 'nulls',
    affectedRows: 8759,
    affectedPct: 12.8,
    recommendation: 'Add is_active derived column',
    recommendationDetail: 'NULL values in subscription_end indicate active subscriptions. Add a derived boolean column instead of filling nulls.',
    fixValue: 'ADD COLUMN is_active = (subscription_end IS NULL)',
  },
  {
    id: 'i5',
    columnId: 'c2',
    columnName: 'account_name',
    table: 'billing_accounts',
    issueType: 'blanks',
    affectedRows: 1437,
    affectedPct: 2.1,
    recommendation: 'Convert blanks to NULL',
    recommendationDetail: '1,437 rows have blank string values in account_name. Normalize to NULL for consistent null handling.',
    fixValue: 'NULL',
  },
  {
    id: 'i6',
    columnId: 'c11',
    columnName: 'line_item_description',
    table: 'line_items',
    issueType: 'blanks',
    affectedRows: 2532,
    affectedPct: 3.7,
    recommendation: 'Convert blanks to NULL',
    recommendationDetail: 'Blank descriptions found. Normalizing to NULL aligns with other null handling in this model.',
    fixValue: 'NULL',
  },
  {
    id: 'i7',
    columnId: 'c14',
    columnName: 'availability_zone',
    table: 'line_items',
    issueType: 'duplicates',
    affectedRows: 312,
    affectedPct: 0.5,
    recommendation: 'Deduplicate on line_item_id, keep first',
    recommendationDetail: '312 duplicate rows detected. Deduplication will retain the first occurrence per line_item_id.',
    fixValue: 'KEEP FIRST BY line_item_id',
  },
  {
    id: 'i8',
    columnId: 'c12',
    columnName: 'blended_cost',
    table: 'line_items',
    issueType: 'anomaly',
    affectedRows: 23,
    affectedPct: 0.03,
    recommendation: 'Flag values > 3σ from mean',
    recommendationDetail: '23 rows have blended_cost values more than 3 standard deviations from the mean. Flagging adds an is_anomaly column without removing data.',
    fixValue: 'ADD COLUMN is_anomaly = (value > 3σ)',
    willFail: true,
  },
  {
    id: 'i9',
    columnId: 'c4',
    columnName: 'billing_period_aws',
    table: 'billing_accounts',
    issueType: 'type_mismatch',
    affectedRows: 445,
    affectedPct: 0.7,
    recommendation: 'Cast to DATE_TIME',
    recommendationDetail: '445 rows have billing_period_aws stored as VARCHAR instead of DATE_TIME. Cast to standardize the column type.',
    fixValue: 'CAST AS DATE_TIME',
  },
  {
    id: 'i10',
    columnId: 'c10',
    columnName: 'line_item_type',
    table: 'line_items',
    issueType: 'type_mismatch',
    affectedRows: 118,
    affectedPct: 0.2,
    recommendation: 'Cast to VARCHAR',
    recommendationDetail: '118 rows contain numeric codes instead of expected string values. Cast to VARCHAR to standardize.',
    fixValue: 'CAST AS VARCHAR',
  },
];

// ── Profiling summary ─────────────────────────────────────────────────────────

export interface ProfilingMetrics {
  totalRows: number;
  totalColumns: number;
  columnsWithIssues: number;
  totalIssues: number;
  completenessScore: number; // 0–100
  issueBreakdown: Record<IssueType, number>;
}

export const PROFILING_METRICS: ProfilingMetrics = {
  totalRows: 68432,
  totalColumns: 22,
  columnsWithIssues: 10,
  totalIssues: 10,
  completenessScore: 76,
  issueBreakdown: {
    nulls:         4,
    blanks:        2,
    duplicates:    1,
    anomaly:       1,
    type_mismatch: 2,
  },
};

// ── Prep history ──────────────────────────────────────────────────────────────

export interface PrepOperation {
  column: string;
  table: string;
  issueType: IssueType;
  rowsFixed: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface PrepHistoryEntry {
  id: string;
  runAt: string;
  trigger: 'cache_refresh' | 'manual';
  operationsRun: number;
  operationsSucceeded: number;
  operationsFailed: number;
  rowsAffected: number;
  status: 'success' | 'failed';
  operations: PrepOperation[];
}

export const PREP_HISTORY: PrepHistoryEntry[] = [
  {
    id: 'h1',
    runAt: '2026-04-09T08:14:22Z',
    trigger: 'cache_refresh',
    operationsRun: 10,
    operationsSucceeded: 9,
    operationsFailed: 1,
    rowsAffected: 72406,
    status: 'failed',
    operations: [
      { column: 'billing_entry_aws',     table: 'billing_accounts', issueType: 'nulls',         rowsFixed: 12588, status: 'success' },
      { column: 'reservation_arn',       table: 'billing_accounts', issueType: 'nulls',         rowsFixed: 41876, status: 'success' },
      { column: 'operation',             table: 'line_items',       issueType: 'nulls',         rowsFixed: 4927,  status: 'success' },
      { column: 'subscription_end',      table: 'subscriptions',    issueType: 'nulls',         rowsFixed: 8759,  status: 'success' },
      { column: 'account_name',          table: 'billing_accounts', issueType: 'blanks',        rowsFixed: 1437,  status: 'success' },
      { column: 'line_item_description', table: 'line_items',       issueType: 'blanks',        rowsFixed: 2532,  status: 'success' },
      { column: 'availability_zone',     table: 'line_items',       issueType: 'duplicates',    rowsFixed: 312,   status: 'success' },
      { column: 'blended_cost',          table: 'line_items',       issueType: 'anomaly',       rowsFixed: 0,     status: 'failed',  error: 'Insufficient warehouse privileges to apply statistical function' },
      { column: 'billing_period_aws',    table: 'billing_accounts', issueType: 'type_mismatch', rowsFixed: 445,   status: 'success' },
      { column: 'line_item_type',        table: 'line_items',       issueType: 'type_mismatch', rowsFixed: 118,   status: 'success' },
    ],
  },
  {
    id: 'h2',
    runAt: '2026-04-08T02:07:55Z',
    trigger: 'cache_refresh',
    operationsRun: 10,
    operationsSucceeded: 7,
    operationsFailed: 3,
    rowsAffected: 69350,
    status: 'failed',
    operations: [
      { column: 'billing_entry_aws',     table: 'billing_accounts', issueType: 'nulls',         rowsFixed: 12588, status: 'success' },
      { column: 'reservation_arn',       table: 'billing_accounts', issueType: 'nulls',         rowsFixed: 41876, status: 'success' },
      { column: 'operation',             table: 'line_items',       issueType: 'nulls',         rowsFixed: 4927,  status: 'success' },
      { column: 'subscription_end',      table: 'subscriptions',    issueType: 'nulls',         rowsFixed: 0,     status: 'failed',  error: 'Column type mismatch: expected DATE_TIME, got VARCHAR' },
      { column: 'account_name',          table: 'billing_accounts', issueType: 'blanks',        rowsFixed: 1437,  status: 'success' },
      { column: 'line_item_description', table: 'line_items',       issueType: 'blanks',        rowsFixed: 2532,  status: 'success' },
      { column: 'availability_zone',     table: 'line_items',       issueType: 'duplicates',    rowsFixed: 312,   status: 'success' },
      { column: 'blended_cost',          table: 'line_items',       issueType: 'anomaly',       rowsFixed: 0,     status: 'failed',  error: 'Insufficient warehouse privileges to apply statistical function' },
      { column: 'billing_period_aws',    table: 'billing_accounts', issueType: 'type_mismatch', rowsFixed: 0,     status: 'failed',  error: 'Timeout: operation exceeded 30s limit' },
      { column: 'line_item_type',        table: 'line_items',       issueType: 'type_mismatch', rowsFixed: 118,   status: 'success' },
    ],
  },
];

// ── Issue type metadata ───────────────────────────────────────────────────────

export const ISSUE_META: Record<IssueType, { label: string; color: string; bg: string; icon: string }> = {
  nulls:         { label: 'Null values',         color: '#B45309', bg: '#FFF7ED', icon: '∅' },
  blanks:        { label: 'Blank values',         color: '#6D28D9', bg: '#F5F3FF', icon: '␣' },
  duplicates:    { label: 'Duplicates',           color: '#0369A1', bg: '#EFF6FF', icon: '⊕' },
  anomaly:       { label: 'Statistical anomaly',  color: '#BE185D', bg: '#FDF2F8', icon: '⚡' },
  type_mismatch: { label: 'Type inconsistency',   color: '#065F46', bg: '#ECFDF5', icon: '⇄' },
};

// ── Quality grades ────────────────────────────────────────────────────────────

export type QualityGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export const GRADE_META: Record<QualityGrade, { color: string; bg: string }> = {
  A: { color: '#15803d', bg: '#dcfce7' },
  B: { color: '#0369a1', bg: '#dbeafe' },
  C: { color: '#b45309', bg: '#fef3c7' },
  D: { color: '#c2410c', bg: '#fff7ed' },
  F: { color: '#dc2626', bg: '#fee2e2' },
};

export const QUALITY_SCORE = {
  before: { grade: 'D' as QualityGrade, score: 54 },
  after:  { grade: 'A' as QualityGrade, score: 91 },
};

// ── Prep rules ────────────────────────────────────────────────────────────────

export interface PrepRule {
  id: string;
  column: string;
  table: string;
  issueType: IssueType;
  ruleDescription: string;
  status: 'active';
}

export const PREP_RULES: PrepRule[] = [
  { id: 'r1', column: 'billing_entry_aws',     table: 'billing_accounts', issueType: 'nulls',         ruleDescription: 'Replace null values with ""',                 status: 'active' },
  { id: 'r2', column: 'reservation_arn',        table: 'billing_accounts', issueType: 'nulls',         ruleDescription: 'Replace null values with "(none)"',            status: 'active' },
  { id: 'r3', column: 'operation',              table: 'line_items',       issueType: 'nulls',         ruleDescription: 'Replace null values with "Unknown"',            status: 'active' },
  { id: 'r4', column: 'subscription_end',       table: 'subscriptions',    issueType: 'nulls',         ruleDescription: 'Add derived column is_active',                  status: 'active' },
  { id: 'r5', column: 'account_name',           table: 'billing_accounts', issueType: 'blanks',        ruleDescription: 'Convert blank strings to NULL',                 status: 'active' },
  { id: 'r6', column: 'line_item_description',  table: 'line_items',       issueType: 'blanks',        ruleDescription: 'Convert blank strings to NULL',                 status: 'active' },
  { id: 'r7', column: 'availability_zone',      table: 'line_items',       issueType: 'duplicates',    ruleDescription: 'Deduplicate on line_item_id, keep first',       status: 'active' },
  { id: 'r8', column: 'billing_period_aws',     table: 'billing_accounts', issueType: 'type_mismatch', ruleDescription: 'Cast VARCHAR → DATE_TIME',                      status: 'active' },
  { id: 'r9', column: 'line_item_type',         table: 'line_items',       issueType: 'type_mismatch', ruleDescription: 'Cast numeric codes → VARCHAR',                  status: 'active' },
];
