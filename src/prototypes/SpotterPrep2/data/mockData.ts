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
  cacheScheduleLabel: string;
  nextCacheAt: string;
  dependents: { liveboards: number; answers: number; spotChats: number };
}

export const MODEL: DataModel = {
  id: 'hr-analytics',
  name: 'hr-analytics',
  connection: 'Databricks',
  tables: ['employees', 'payroll', 'performance_reviews'],
  totalRows: 12450,
  totalColumns: 17,
  lastCached: '2026-05-18T14:32:00Z',
  isCached: true,
  cacheScheduleLabel: 'Daily at 2:00 AM IST',
  nextCacheAt: '2026-05-19T20:30:00Z',
  dependents: { liveboards: 6, answers: 11, spotChats: 4 },
};

// ── Quality scores ─────────────────────────────────────────────────────────────

export type QualityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export const QUALITY_SCORE = {
  before: { score: 47, grade: 'D' as QualityGrade },
  after:  { score: 91, grade: 'A' as QualityGrade },
};

export const GRADE_META: Record<QualityGrade, { color: string; bg: string }> = {
  'A+': { color: '#15803d', bg: '#dcfce7' },
  'A':  { color: '#15803d', bg: '#dcfce7' },
  'B':  { color: '#0369a1', bg: '#e0f2fe' },
  'C':  { color: '#a16207', bg: '#fef3c7' },
  'D':  { color: '#b45309', bg: '#fef3c7' },
  'F':  { color: '#dc2626', bg: '#fee2e2' },
};

// ── Confidence tiers ──────────────────────────────────────────────────────────

export type ConfidenceTier = 'high' | 'medium' | 'low';

// ── Issue types ───────────────────────────────────────────────────────────────

export type IssueType =
  | 'null_rate'
  | 'negative_values'
  | 'float_precision'
  | 'date_format'
  | 'duplicates'
  | 'orphaned_fk'
  | 'impossible_sequence'
  | 'outliers';

// ── Column profile ─────────────────────────────────────────────────────────────

export interface ColumnProfile {
  id: string;
  name: string;
  table: string;
  dataType: string;
  nullPct: number;
  uniqueCount: number;
  hasIssue: boolean;
  issueType?: IssueType;
  tier?: ConfidenceTier;
}

export const COLUMNS: ColumnProfile[] = [
  // employees (9 columns)
  { id: 'c1',  name: 'employee_id',       table: 'employees', dataType: 'INT',      nullPct: 0,    uniqueCount: 12438, hasIssue: true,  issueType: 'duplicates',          tier: 'high'   },
  { id: 'c2',  name: 'name',              table: 'employees', dataType: 'VARCHAR',  nullPct: 0,    uniqueCount: 12450, hasIssue: false },
  { id: 'c3',  name: 'email',             table: 'employees', dataType: 'VARCHAR',  nullPct: 9.7,  uniqueCount: 11247, hasIssue: true,  issueType: 'null_rate',           tier: 'medium' },
  { id: 'c4',  name: 'department',        table: 'employees', dataType: 'VARCHAR',  nullPct: 6.8,  uniqueCount: 14,    hasIssue: true,  issueType: 'null_rate',           tier: 'high'   },
  { id: 'c5',  name: 'hire_date',         table: 'employees', dataType: 'DATE',     nullPct: 0,    uniqueCount: 2840,  hasIssue: true,  issueType: 'date_format',         tier: 'high'   },
  { id: 'c6',  name: 'termination_date',  table: 'employees', dataType: 'DATE',     nullPct: 71.2, uniqueCount: 890,   hasIssue: true,  issueType: 'impossible_sequence', tier: 'medium' },
  { id: 'c7',  name: 'salary',            table: 'employees', dataType: 'FLOAT',    nullPct: 0,    uniqueCount: 8421,  hasIssue: true,  issueType: 'negative_values',     tier: 'high'   },
  { id: 'c8',  name: 'manager_id',        table: 'employees', dataType: 'INT',      nullPct: 2.7,  uniqueCount: 284,   hasIssue: true,  issueType: 'orphaned_fk',         tier: 'high'   },
  { id: 'c9',  name: 'status',            table: 'employees', dataType: 'VARCHAR',  nullPct: 0,    uniqueCount: 2,     hasIssue: false },
  // payroll (4 columns)
  { id: 'c10', name: 'payroll_id',        table: 'payroll',   dataType: 'INT',      nullPct: 0,    uniqueCount: 12450, hasIssue: false },
  { id: 'c11', name: 'base_pay',          table: 'payroll',   dataType: 'FLOAT',    nullPct: 0,    uniqueCount: 8210,  hasIssue: true,  issueType: 'float_precision',     tier: 'high'   },
  { id: 'c12', name: 'bonus',             table: 'payroll',   dataType: 'FLOAT',    nullPct: 14.2, uniqueCount: 3840,  hasIssue: false },
  { id: 'c13', name: 'pay_period',        table: 'payroll',   dataType: 'DATE',     nullPct: 0,    uniqueCount: 24,    hasIssue: false },
  // performance_reviews (4 columns)
  { id: 'c14', name: 'review_id',         table: 'performance_reviews', dataType: 'INT',    nullPct: 0,   uniqueCount: 34821, hasIssue: false },
  { id: 'c15', name: 'rating',            table: 'performance_reviews', dataType: 'FLOAT',  nullPct: 0,   uniqueCount: 9,     hasIssue: false },
  { id: 'c16', name: 'review_date',       table: 'performance_reviews', dataType: 'DATE',   nullPct: 0,   uniqueCount: 1240,  hasIssue: false },
  { id: 'c17', name: 'reviewer_id',       table: 'performance_reviews', dataType: 'INT',    nullPct: 0,   uniqueCount: 284,   hasIssue: false },
];

// ── Issues ────────────────────────────────────────────────────────────────────

export interface Issue {
  id: string;
  columnId: string;
  columnName: string;
  table: string;
  issueType: IssueType;
  tier: ConfidenceTier;
  affectedRows: number;
  affectedPct: number;
  description: string;
  recommendation: string;
  recommendationDetail: string;
  fixValue?: string;
  clarificationQuestion?: string;
  clarificationOptions?: string[];
}

export const ISSUES: Issue[] = [
  {
    id: 'i1', columnId: 'c1', columnName: 'employee_id', table: 'employees',
    issueType: 'duplicates', tier: 'high', affectedRows: 12, affectedPct: 0.1,
    description: '12 duplicate employee_id values across 6 row pairs.',
    recommendation: 'Deduplicate — keep the record with the latest hire_date',
    recommendationDetail: 'Removes 6 redundant rows. Downstream joins will return correct counts.',
    fixValue: 'DEDUP(employee_id, keep=latest_hire_date)',
  },
  {
    id: 'i2', columnId: 'c3', columnName: 'email', table: 'employees',
    issueType: 'null_rate', tier: 'medium', affectedRows: 1203, affectedPct: 9.7,
    description: '1,203 email values are null (9.7% of rows).',
    recommendation: 'Requires your call — cannot determine intent',
    recommendationDetail: 'Business rule unclear: some organizations allow employees without corporate emails; others require it.',
    clarificationQuestion: "I'm not sure how to treat null email values. Is this:",
    clarificationOptions: ["Expected — some employees don't have corporate emails", 'A data issue — flag rows for review'],
  },
  {
    id: 'i3', columnId: 'c4', columnName: 'department', table: 'employees',
    issueType: 'null_rate', tier: 'high', affectedRows: 847, affectedPct: 6.8,
    description: '847 null department values (6.8% of rows).',
    recommendation: 'Fill nulls with "Unassigned"',
    recommendationDetail: 'Standard fill for categorical nulls with no business ambiguity. Preserves row integrity for grouping.',
    fixValue: 'FILL_NULL(department, "Unassigned")',
  },
  {
    id: 'i4', columnId: 'c5', columnName: 'hire_date', table: 'employees',
    issueType: 'date_format', tier: 'high', affectedRows: 89, affectedPct: 0.7,
    description: '89 hire_date values are not ISO 8601 format (e.g., "Jan 2021", "15/03/2019").',
    recommendation: 'Normalize to ISO 8601 (YYYY-MM-DD)',
    recommendationDetail: 'All 89 values are parseable — normalization is lossless.',
    fixValue: 'NORMALIZE_DATE(hire_date, target="YYYY-MM-DD")',
  },
  {
    id: 'i5', columnId: 'c6', columnName: 'termination_date', table: 'employees',
    issueType: 'impossible_sequence', tier: 'medium', affectedRows: 7, affectedPct: 0.06,
    description: '7 rows where termination_date is before hire_date — impossible sequence.',
    recommendation: 'Requires your call — dates may be swapped',
    recommendationDetail: 'Pattern suggests data entry error (dates transposed), but corrective action depends on your data rules.',
    clarificationQuestion: 'termination_date appears before hire_date for 7 employees. Most likely dates were swapped. Should I:',
    clarificationOptions: ['Swap the dates (most likely correct)', 'Null out termination_date (preserve hire record)'],
  },
  {
    id: 'i6', columnId: 'c7', columnName: 'salary', table: 'employees',
    issueType: 'negative_values', tier: 'high', affectedRows: 3, affectedPct: 0.02,
    description: '3 salary values are negative — semantically impossible for compensation.',
    recommendation: 'Convert to absolute value (flip sign)',
    recommendationDetail: 'Salary cannot be negative. Sign flip is unambiguous for compensation data.',
    fixValue: 'ABS(salary) WHERE salary < 0',
  },
  {
    id: 'i7', columnId: 'c11', columnName: 'base_pay', table: 'payroll',
    issueType: 'float_precision', tier: 'high', affectedRows: 1204, affectedPct: 9.7,
    description: '1,204 base_pay values have more than 2 decimal places (monetary column).',
    recommendation: 'Round to 2 decimal places',
    recommendationDetail: 'Standard monetary precision. No data loss — extra decimals are floating-point artifacts.',
    fixValue: 'ROUND(base_pay, 2)',
  },
  {
    id: 'i8', columnId: 'c8', columnName: 'manager_id', table: 'employees',
    issueType: 'orphaned_fk', tier: 'high', affectedRows: 34, affectedPct: 0.3,
    description: "34 manager_id values reference employee_ids that don't exist.",
    recommendation: 'Set orphaned manager_id to null',
    recommendationDetail: 'Orphaned FKs break join integrity. Setting to null preserves the employee record while correcting the relationship.',
    fixValue: 'SET_NULL(manager_id) WHERE manager_id NOT IN (SELECT employee_id)',
  },
  {
    id: 'i9', columnId: 'c7', columnName: 'salary', table: 'employees',
    issueType: 'outliers', tier: 'low', affectedRows: 3, affectedPct: 0.02,
    description: '3 salary values are statistical outliers: $847,320 / $912,440 / $788,100 vs column avg $82,450.',
    recommendation: 'Requires validation — could be executive compensation',
    recommendationDetail: 'Values are >10× the column average. Legitimate for C-suite roles, but should be confirmed.',
    clarificationQuestion: '3 salary values are statistical outliers ($847K–$912K vs avg $82K). Are these valid?',
    clarificationOptions: ['Valid — executive compensation', 'Flag for review'],
  },
];

// ── Issue meta (for rendering) ────────────────────────────────────────────────

export const ISSUE_META: Record<IssueType, { label: string; color: string; bg: string; icon: string }> = {
  null_rate:           { label: 'Null',               color: '#c2410c', bg: '#fff7ed', icon: 'NULL' },
  negative_values:     { label: 'Negative',           color: '#7c3aed', bg: '#f5f3ff', icon: 'NEG'  },
  float_precision:     { label: 'Precision',          color: '#0369a1', bg: '#eff6ff', icon: 'FP'   },
  date_format:         { label: 'Date format',        color: '#065f46', bg: '#ecfdf5', icon: 'DATE' },
  duplicates:          { label: 'Duplicate',          color: '#be185d', bg: '#fdf2f8', icon: 'DUP'  },
  orphaned_fk:         { label: 'Orphaned FK',        color: '#b45309', bg: '#fef3c7', icon: 'FK'   },
  impossible_sequence: { label: 'Impossible seq.',    color: '#dc2626', bg: '#fee2e2', icon: 'SEQ'  },
  outliers:            { label: 'Outlier',            color: '#9333ea', bg: '#faf5ff', icon: 'OUT'  },
};

// ── Prep history ──────────────────────────────────────────────────────────────

export interface PrepRun {
  id: string;
  runAt: string;
  rulesApplied: number;
  operationsRun: number;
  operationsSucceeded: number;
  triggeredBy: 'cache_refresh' | 'manual';
  status: 'passed' | 'partial' | 'failed';
}

export const PREP_HISTORY: PrepRun[] = [
  { id: 'r1', runAt: '2026-05-18T14:32:00Z', rulesApplied: 7, operationsRun: 7, operationsSucceeded: 7, triggeredBy: 'cache_refresh', status: 'passed' },
  { id: 'r2', runAt: '2026-05-17T14:31:00Z', rulesApplied: 7, operationsRun: 7, operationsSucceeded: 6, triggeredBy: 'cache_refresh', status: 'partial' },
  { id: 'r3', runAt: '2026-05-16T14:30:00Z', rulesApplied: 7, operationsRun: 7, operationsSucceeded: 7, triggeredBy: 'cache_refresh', status: 'passed' },
];

// ── Cache tab display ──────────────────────────────────────────────────────────

export const CACHE_DISPLAY = {
  cacheWindow: '1 month',
  dateReferenceColumn: 'employees : hire_date',
  cacheSize: '48 MB',
};

export const CACHE_ANALYTICS = {
  totalQueriesFired: 12000,
  cachedQueryPct: 75,
  cachedQueryCount: 9000,
  liveQueryPct: 25,
  liveQueryCount: 3000,
};

// ── Clean columns (post-save, all issues resolved) ────────────────────────────

export const COLUMNS_CLEAN: ColumnProfile[] = COLUMNS.map(col => ({
  ...col,
  hasIssue: false,
  issueType: undefined,
  tier: undefined,
  nullPct: col.id === 'c4' ? 0 : col.nullPct, // department nulls filled with "Unassigned"
}));

// ── Rules chain (decisions made in quality session) ────────────────────────────

export interface RuleEntry {
  id: string;
  column: string;
  table: string;
  rule: string;
  issueType: IssueType;
}

export const RULES_CHAIN: RuleEntry[] = [
  { id: 'rule1', column: 'employee_id',      table: 'employees', rule: 'Deduplicate — keep latest hire_date', issueType: 'duplicates'          },
  { id: 'rule2', column: 'department',       table: 'employees', rule: 'Fill nulls with "Unassigned"',        issueType: 'null_rate'           },
  { id: 'rule3', column: 'hire_date',        table: 'employees', rule: 'Normalize to ISO 8601 (YYYY-MM-DD)',  issueType: 'date_format'         },
  { id: 'rule4', column: 'salary',           table: 'employees', rule: 'Convert negative values to absolute', issueType: 'negative_values'     },
  { id: 'rule5', column: 'manager_id',       table: 'employees', rule: 'Set orphaned FK to null',             issueType: 'orphaned_fk'         },
  { id: 'rule6', column: 'base_pay',         table: 'payroll',   rule: 'Round to 2 decimal places',          issueType: 'float_precision'     },
  { id: 'rule7', column: 'termination_date', table: 'employees', rule: 'Swap transposed dates',               issueType: 'impossible_sequence' },
];

// ── Employee data rows (for quality session data table) ───────────────────────

export interface EmployeeRow {
  employee_id: number;
  name: string;
  email: string | null;
  department: string | null;
  hire_date: string;
  termination_date: string | null;
  salary: number;
  manager_id: number | null;
}

export const EMPLOYEE_ROWS: EmployeeRow[] = [
  { employee_id: 1001, name: 'Priya Sharma',       email: 'priya.sharma@acme.com',     department: 'Engineering',   hire_date: '2019-03-15',   termination_date: null,         salary: 98500.00,   manager_id: 2041 },
  { employee_id: 1002, name: 'James Chen',          email: null,                         department: 'Engineering',   hire_date: '2020-07-01',   termination_date: null,         salary: 112000.00,  manager_id: 2041 },
  { employee_id: 1003, name: 'Anika Patel',         email: 'anika.patel@acme.com',      department: null,            hire_date: 'Jan 2018',     termination_date: null,         salary: 87250.50,   manager_id: 9999 },
  { employee_id: 1004, name: 'Marcus Williams',     email: 'marcus.w@acme.com',         department: 'Marketing',     hire_date: '2021-11-22',   termination_date: null,         salary: 76000.0000, manager_id: 2042 },
  { employee_id: 1005, name: 'Sofia Ramirez',       email: null,                         department: null,            hire_date: '2022-04-10',   termination_date: null,         salary: 65000.00,   manager_id: 2042 },
  { employee_id: 1006, name: 'Kenji Tanaka',        email: 'kenji.t@acme.com',          department: 'Finance',       hire_date: '15/03/2019',   termination_date: '2024-01-15', salary: 94000.00,   manager_id: 2043 },
  { employee_id: 1007, name: 'Leila Hassan',        email: 'leila.hassan@acme.com',     department: 'Engineering',   hire_date: '2023-06-05',   termination_date: null,         salary: 847320.00,  manager_id: 2041 },
  { employee_id: 1008, name: 'David Okafor',        email: 'david.o@acme.com',          department: 'Sales',         hire_date: '2020-01-20',   termination_date: null,         salary: 83000.0001, manager_id: 2044 },
  { employee_id: 1009, name: 'Rachel Kim',          email: null,                         department: 'HR',            hire_date: 'March 2021',   termination_date: null,         salary: 72000.00,   manager_id: 2045 },
  { employee_id: 1010, name: 'Tariq Farouk',        email: 'tariq.f@acme.com',          department: 'Engineering',   hire_date: '2018-09-03',   termination_date: '2023-06-30', salary: 105000.00,  manager_id: 2041 },
  { employee_id: 1011, name: 'Nora Johansson',      email: 'nora.j@acme.com',           department: null,            hire_date: '2021-08-16',   termination_date: null,         salary: -58000.00,  manager_id: 9998 },
  { employee_id: 1012, name: 'Ben Rodriguez',       email: 'ben.r@acme.com',            department: 'Marketing',     hire_date: '2022-02-14',   termination_date: '2021-12-01', salary: 79000.00,   manager_id: 2042 },
  { employee_id: 1013, name: 'Yuki Watanabe',       email: null,                         department: 'Engineering',   hire_date: '2019-11-30',   termination_date: null,         salary: 118500.00,  manager_id: 2041 },
  { employee_id: 1014, name: 'Amara Diallo',        email: 'amara.d@acme.com',          department: 'Sales',         hire_date: '2023-01-09',   termination_date: null,         salary: 69500.0043, manager_id: 2044 },
  { employee_id: 1015, name: 'Chris Park',          email: 'chris.park@acme.com',       department: 'Finance',       hire_date: '2017-05-22',   termination_date: null,         salary: 912440.00,  manager_id: 2043 },
  { employee_id: 1016, name: 'Isabela Costa',       email: 'isabela.c@acme.com',        department: null,            hire_date: '2020-12-07',   termination_date: null,         salary: 88000.00,   manager_id: 2042 },
  { employee_id: 1017, name: 'Ahmed Al-Rashid',     email: 'ahmed.ar@acme.com',         department: 'Engineering',   hire_date: '09/2022',      termination_date: null,         salary: 97000.00,   manager_id: 2041 },
  { employee_id: 1018, name: 'Grace Mensah',        email: null,                         department: 'HR',            hire_date: '2021-03-25',   termination_date: null,         salary: 71000.00,   manager_id: 2045 },
  { employee_id: 1019, name: 'Luca Ferrari',        email: 'luca.f@acme.com',           department: 'Sales',         hire_date: '2022-07-18',   termination_date: null,         salary: 74500.0099, manager_id: 2044 },
  { employee_id: 1020, name: 'Zara Ahmed',          email: 'zara.ahmed@acme.com',       department: 'Engineering',   hire_date: '2023-04-03',   termination_date: null,         salary: -92000.00,  manager_id: 9997 },
  { employee_id: 1021, name: 'Tomás García',        email: null,                         department: null,            hire_date: '2020-06-15',   termination_date: null,         salary: 83000.00,   manager_id: 2043 },
  { employee_id: 1022, name: 'Mei Lin',             email: 'mei.lin@acme.com',          department: 'Engineering',   hire_date: '2018-11-12',   termination_date: '2023-09-30', salary: 108000.00,  manager_id: 2041 },
  { employee_id: 1003, name: 'Anika Patel',         email: 'anika.patel@acme.com',      department: 'Product',       hire_date: '2018-01-01',   termination_date: null,         salary: 87250.50,   manager_id: 2046 },
  { employee_id: 1023, name: 'Nia Thompson',        email: null,                         department: 'Marketing',     hire_date: 'Q1 2021',      termination_date: null,         salary: 68000.00,   manager_id: 2042 },
  { employee_id: 1024, name: 'Ivan Petrov',         email: 'ivan.p@acme.com',           department: 'Finance',       hire_date: '2019-08-27',   termination_date: null,         salary: 91000.0050, manager_id: 2043 },
  { employee_id: 1025, name: 'Fatima Al-Zahrawi',   email: 'fatima.z@acme.com',         department: 'Engineering',   hire_date: '2021-10-04',   termination_date: null,         salary: 788100.00,  manager_id: 2041 },
  { employee_id: 1026, name: 'Kofi Asante',         email: 'kofi.a@acme.com',           department: null,            hire_date: '2022-05-19',   termination_date: null,         salary: 76500.00,   manager_id: 2044 },
  { employee_id: 1027, name: 'Saoirse Murphy',      email: null,                         department: 'HR',            hire_date: '2023-02-28',   termination_date: '2022-11-15', salary: 67000.00,   manager_id: 2045 },
  { employee_id: 1028, name: 'Raj Krishnaswamy',    email: 'raj.k@acme.com',            department: 'Engineering',   hire_date: '2020-09-14',   termination_date: null,         salary: 102000.00,  manager_id: 2041 },
  { employee_id: 1029, name: 'Chiara Bianchi',      email: 'chiara.b@acme.com',         department: 'Sales',         hire_date: '2021-05-31',   termination_date: null,         salary: -45000.00,  manager_id: 2044 },
  { employee_id: 1030, name: 'Omar Shaikh',         email: 'omar.s@acme.com',           department: 'Engineering',   hire_date: '2022-08-01',   termination_date: null,         salary: 95000.00,   manager_id: 2041 },
  { employee_id: 1031, name: 'Lin Wei',             email: null,                         department: 'Finance',       hire_date: '2019-12-10',   termination_date: null,         salary: 88500.00,   manager_id: 2043 },
  { employee_id: 1032, name: 'Adaeze Obi',          email: 'adaeze.o@acme.com',         department: 'Marketing',     hire_date: '2021-06-14',   termination_date: null,         salary: 72000.00,   manager_id: 2042 },
  { employee_id: 1033, name: 'Marco Ferretti',      email: 'marco.f@acme.com',          department: 'Sales',         hire_date: '2020-03-22',   termination_date: null,         salary: 81000.00,   manager_id: 2044 },
  { employee_id: 1034, name: 'Preethi Nair',        email: 'preethi.n@acme.com',        department: 'Engineering',   hire_date: '2023-01-17',   termination_date: null,         salary: 99000.00,   manager_id: 2041 },
  { employee_id: 1035, name: 'Carlos Mendoza',      email: null,                         department: null,            hire_date: '2020-11-05',   termination_date: null,         salary: 74000.00,   manager_id: 2043 },
  { employee_id: 1036, name: 'Yuna Park',           email: 'yuna.p@acme.com',           department: 'HR',            hire_date: '2022-02-28',   termination_date: null,         salary: 69500.00,   manager_id: 2045 },
  { employee_id: 1037, name: 'Seun Adeyemi',        email: 'seun.a@acme.com',           department: 'Engineering',   hire_date: '2018-07-09',   termination_date: '2024-03-01', salary: 115000.00,  manager_id: 2041 },
  { employee_id: 1038, name: 'Ines Martínez',       email: 'ines.m@acme.com',           department: 'Product',       hire_date: '2021-09-20',   termination_date: null,         salary: 93000.00,   manager_id: 2046 },
  { employee_id: 1039, name: 'Akira Mori',          email: null,                         department: 'Engineering',   hire_date: '2022-04-11',   termination_date: null,         salary: 86000.00,   manager_id: 2041 },
  { employee_id: 1040, name: 'Blessing Okonkwo',    email: 'blessing.o@acme.com',       department: 'Sales',         hire_date: '2019-05-30',   termination_date: null,         salary: 78000.00,   manager_id: 2044 },
  { employee_id: 1041, name: 'Dmitri Volkov',       email: 'dmitri.v@acme.com',         department: 'Finance',       hire_date: '2020-08-18',   termination_date: null,         salary: 97500.00,   manager_id: 2043 },
  { employee_id: 1042, name: 'Amelia Santos',       email: 'amelia.s@acme.com',         department: 'Marketing',     hire_date: '2023-03-06',   termination_date: null,         salary: 70000.00,   manager_id: 2042 },
  { employee_id: 1043, name: 'Hiroshi Tanaka',      email: null,                         department: 'Engineering',   hire_date: '2017-10-23',   termination_date: null,         salary: 128000.00,  manager_id: 2041 },
  { employee_id: 1044, name: 'Zanele Dlamini',      email: 'zanele.d@acme.com',         department: 'HR',            hire_date: '2022-11-14',   termination_date: null,         salary: 66000.00,   manager_id: 2045 },
  { employee_id: 1045, name: 'Paulo Salave\'a',     email: 'paulo.s@acme.com',          department: 'Sales',         hire_date: '2021-07-07',   termination_date: null,         salary: 83500.00,   manager_id: 2044 },
  { employee_id: 1046, name: 'Nadia Kowalski',      email: 'nadia.k@acme.com',          department: 'Engineering',   hire_date: '2020-02-14',   termination_date: null,         salary: 104000.00,  manager_id: 2041 },
  { employee_id: 1047, name: 'Tariq Al-Amin',       email: null,                         department: 'Finance',       hire_date: '2019-01-31',   termination_date: null,         salary: 92000.00,   manager_id: 2043 },
  { employee_id: 1048, name: 'Elsa Björk',          email: 'elsa.b@acme.com',           department: 'Product',       hire_date: '2022-06-22',   termination_date: null,         salary: 89000.00,   manager_id: 2046 },
  { employee_id: 1049, name: 'Kwame Boateng',       email: 'kwame.b@acme.com',          department: 'Engineering',   hire_date: '2021-12-01',   termination_date: null,         salary: 96000.00,   manager_id: 2041 },
  { employee_id: 1050, name: 'Valentina Cruz',      email: 'valentina.c@acme.com',      department: 'Marketing',     hire_date: '2020-09-08',   termination_date: null,         salary: 75500.00,   manager_id: 2042 },
];
