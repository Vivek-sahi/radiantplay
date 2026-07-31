// Calibration prototype — content model.
// Everything here is grounded in the concept work: four pillars (Physical,
// Semantic, AI Calibration are user-run; Drift Monitor is the separate push feed),
// the ~30-item check list, fix-ownership tagging, and the drift signal lifecycle.

export type Severity = 'high' | 'medium' | 'low';

// Where a finding can actually be fixed — drives the resolution surface.
export type Fixability =
  | 'auto'      // system can apply an exact fix (approve-to-apply)
  | 'judgment'  // fixable in-model but needs a human decision
  | 'not-here'; // source-system / data problem — detected, not resolvable here

export type PillarId = 'physical' | 'semantic' | 'ai';

export interface CheckPoint {
  icon: string;
  label: string;
}

export interface Pillar {
  id: PillarId;
  name: string;
  tagline: string;
  blurb: string;
  prereq: string;
  prereqMet: boolean;
  checkCount: number;
  cost: 'instant' | 'moderate' | 'heavy';
  costLabel: string;
  motif: 'gauge' | 'language' | 'waveform';
  /** When this pillar was last run on its own. null = never run. */
  lastRun: string | null;
  /** Three short lines describing what this check does. */
  points: CheckPoint[];
}

export const PILLARS: Pillar[] = [
  {
    id: 'physical',
    name: 'Physical',
    tagline: 'Structure & data',
    blurb:
      'Checks how the model is built — joins, types, table shape — and the real data underneath: nulls, duplicates, mismatched keys.',
    prereq: 'Tables and joins defined',
    prereqMet: true,
    checkCount: 22,
    cost: 'heavy',
    costLabel: 'Deep scan — queries the warehouse',
    motif: 'gauge',
    lastRun: null,
    points: [
      { icon: 'link', label: 'Verifies joins & keys' },
      { icon: 'hash', label: 'Flags nulls & dupes' },
      { icon: 'gauge', label: 'Catches type errors' },
    ],
  },
  {
    id: 'semantic',
    name: 'Semantic',
    tagline: 'Meaning & language',
    blurb:
      'Checks how well the model explains itself — names, descriptions, synonyms, and AI context that Spotter reads to understand each field.',
    prereq: 'Columns added to the model',
    prereqMet: true,
    checkCount: 10,
    cost: 'instant',
    costLabel: 'Instant — reads metadata only',
    motif: 'language',
    lastRun: '20 days ago',
    points: [
      { icon: 'chat', label: 'Rates naming clarity' },
      { icon: 'sparkle', label: 'Fills synonym gaps' },
      { icon: 'language', label: 'Flags ambiguous fields' },
    ],
  },
  {
    id: 'ai',
    name: 'For Spotter',
    tagline: 'Answers in practice',
    blurb:
      'Runs real questions against the model and asks you to confirm each answer. The only check that proves Spotter behaves — not just that the model looks right.',
    prereq: 'Sample questions from usage, docs, or added by you',
    prereqMet: true,
    checkCount: 14,
    cost: 'moderate',
    costLabel: 'Runs live questions — a few minutes',
    motif: 'waveform',
    lastRun: null,
    points: [
      { icon: 'play', label: 'Runs real questions' },
      { icon: 'check', label: 'You confirm answers' },
      { icon: 'waveform', label: 'Catches wrong answers' },
    ],
  },
];

// ---- Calibration findings (results surface) ----

export type IssueStatus = 'open' | 'resolved' | 'sent';

/** Where a fix lives in the DME, so the canvas walkthrough can spotlight it. */
export interface FixTarget {
  tab: 'tables' | 'columns' | 'formulas';
  tables?: string[];   // table cards to spotlight (join / table issues)
  columns?: string[];  // "table.column" rows to spotlight (column issues)
  formula?: string;    // formula name to spotlight (formula issues)
  /** For an "every column" fix (no specific `columns`), which cell the inline preview fills. */
  cell?: 'desc' | 'aiCtx';
  /** Short label for what part of the model is affected, e.g. "Join · sales → products". */
  where?: string;
}

export interface Issue {
  id: string;
  pillar: PillarId;
  checkCode: string;
  severity: Severity;
  icon: string;           // type icon shown in the card
  title: string;
  description: string;    // one-line statement of what's wrong
  impact: string;         // real-world consequence for users
  source: string;         // provenance — where the signal came from
  fixability: Fixability;
  suggestion: string;     // applied when the user clicks Fix
  status: IssueStatus;
  /** For Spotter-derived fixes: the sample question whose wrong answer prompted this fix. */
  basedOn?: string;
  /** Where in the DME this fix is applied (set on synthetic Spotter fixes). */
  fixTarget?: FixTarget;
  /** Before→after diff shown in the fix's preview card (set on synthetic Spotter fixes). */
  diff?: DiffField[];
}

/** Turns a table/column/formula name into a safe CSS class suffix so the DME can
 *  tag rows (`dmecol-…`, `dmeformula-…`) and the walkthrough can find them. */
export const fixSel = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Maps each fixable issue to the model object the canvas walkthrough spotlights. */
export const FIX_TARGETS: Record<string, FixTarget> = {
  i1: { tab: 'tables',   tables: ['FACT_INVOICES', 'FACT_SALES_ORDERS'],       where: 'Join · invoices → orders' },
  i2: { tab: 'tables',   tables: ['FACT_SUPPORT_TICKETS', 'DIM_CUSTOMERS'],    where: 'Join · support → customers' },
  i3: { tab: 'formulas', formula: 'Average Deal Size',                          where: 'Formula · Average Deal Size' },
  i4: { tab: 'formulas', formula: 'Gross Margin %',                             where: 'Formula · Gross Margin %' },
  i5: { tab: 'columns', cell: 'desc',                                            where: 'Columns · all tables' },
  i12: { tab: 'columns', cell: 'aiCtx',                                          where: 'Columns · all tables' },
  i6: { tab: 'columns',  columns: ['FACT_SALES_ORDERS.amount', 'FACT_INVOICES.amount'], where: 'Columns · the two “amount” fields' },
  i7: { tab: 'columns',  columns: ['DIM_CUSTOMERS.arr'],                        where: 'Column · arr' },
  i8: { tab: 'columns',  columns: ['FACT_SALES_ORDERS.amount'],                 where: 'Column · booked amount' },
  i9: { tab: 'columns',  columns: ['DIM_CUSTOMERS.churn_risk'],                 where: 'Column · churn_risk' },
};

// Findings are grounded in the real (hand-built, flawed) "Customer revenue & retention"
// model in init-dme.js: a fan-out invoices→orders join, a wrong-column support→customers
// join, an "Average Deal Size" formula missing DISTINCT, a hardcoded-cost "Gross Margin %",
// two ambiguous "amount" columns, and no descriptions or synonyms anywhere.
export const ISSUES: Issue[] = [
  {
    id: 'i1',
    pillar: 'physical',
    checkCode: 'P3',
    severity: 'high',
    icon: 'link',
    title: 'Invoices join to orders as one-to-many',
    description: 'The FACT_INVOICES → FACT_SALES_ORDERS join is set to 1 : Many.',
    impact: 'Booked revenue and order counts fan out and double-count once invoices are involved.',
    source: 'Join check · cardinality',
    fixability: 'auto',
    suggestion: 'Set the FACT_INVOICES → FACT_SALES_ORDERS join cardinality to Many : 1.',
    status: 'open',
  },
  {
    id: 'i2',
    pillar: 'physical',
    checkCode: 'P4',
    severity: 'high',
    icon: 'link',
    title: 'Support tickets join to customers on the wrong column',
    description: 'The support join uses “rep_id” instead of the customer key.',
    impact: 'CSAT and support volume broken out by account return wrong or empty results.',
    source: 'Join check · non-key join column',
    fixability: 'auto',
    suggestion: 'Join FACT_SUPPORT_TICKETS.customer_id to DIM_CUSTOMERS.customer_id.',
    status: 'open',
  },
  {
    id: 'i3',
    pillar: 'physical',
    checkCode: 'P12',
    severity: 'high',
    icon: 'gauge',
    title: '“Average Deal Size” counts rows, not orders',
    description: 'The formula divides by COUNT(order_id) without DISTINCT.',
    impact: 'Average deal size is understated once orders fan out across invoice rows.',
    source: 'Formula check · missing DISTINCT',
    fixability: 'auto',
    suggestion: 'Use COUNT(DISTINCT FACT_SALES_ORDERS.order_id) in the denominator.',
    status: 'open',
  },
  {
    id: 'i4',
    pillar: 'physical',
    checkCode: 'P14',
    severity: 'medium',
    icon: 'gauge',
    title: '“Gross Margin %” hard-codes a 60% cost',
    description: 'The formula assumes cost is always 60% of amount and ignores the real column.',
    impact: 'Margin is wrong for every order whose actual gross margin differs.',
    source: 'Formula check · hardcoded ratio',
    fixability: 'judgment',
    suggestion: 'Compute margin from FACT_SALES_ORDERS.gross_margin instead of a fixed 0.6.',
    status: 'open',
  },
  {
    id: 'i5',
    pillar: 'semantic',
    checkCode: 'S7',
    severity: 'medium',
    icon: 'chat',
    title: 'No column has a description',
    description: 'Across all 5 tables, not one column in the model is documented.',
    impact: 'Spotter guesses what each field means from the name alone.',
    source: 'Metadata check · description coverage',
    fixability: 'auto',
    suggestion: 'Generate descriptions from names and sample values, then review.',
    status: 'open',
  },
  {
    id: 'i12',
    pillar: 'semantic',
    checkCode: 'S8',
    severity: 'medium',
    icon: 'chat',
    title: 'No column has AI context',
    description: 'Not one column carries AI context to guide how Spotter interprets it.',
    impact: 'Spotter has no guidance on how to read each field for questions.',
    source: 'Metadata check · AI context coverage',
    fixability: 'auto',
    suggestion: 'Generate AI context for every column from names and sample values.',
    status: 'open',
  },
  {
    id: 'i6',
    pillar: 'semantic',
    checkCode: 'S2',
    severity: 'medium',
    icon: 'chat',
    title: 'Two “amount” columns are ambiguous',
    description: 'FACT_SALES_ORDERS.amount (booked) and FACT_INVOICES.amount (invoiced) both read as “amount”.',
    impact: 'Spotter can’t tell which measure “revenue” means and may pick the wrong one.',
    source: 'Naming check · overlapping meaning',
    fixability: 'judgment',
    suggestion: 'Add AI context distinguishing booked order amount from invoiced amount.',
    status: 'open',
  },
  {
    id: 'i7',
    pillar: 'semantic',
    checkCode: 'S3',
    severity: 'low',
    icon: 'chat',
    title: '“arr” uses an unclear abbreviation',
    description: 'The DIM_CUSTOMERS.arr column name isn’t recognizable to users or Spotter.',
    impact: 'Questions about “annual recurring revenue” won’t map to this column.',
    source: 'Naming check · abbreviation detected',
    fixability: 'auto',
    suggestion: 'Rename to “Annual recurring revenue” and keep “arr” as a synonym.',
    status: 'open',
  },
  {
    id: 'i8',
    pillar: 'semantic',
    checkCode: 'S8',
    severity: 'low',
    icon: 'sparkle',
    title: 'Booked “amount” has no synonyms',
    description: 'The booked-revenue measure isn’t mapped to common terms.',
    impact: 'Questions using “sales”, “revenue”, or “bookings” may miss this measure.',
    source: 'Vocabulary check · terms from query history',
    fixability: 'auto',
    suggestion: 'Add “Bookings”, “Revenue”, and “Sales” as synonyms for FACT_SALES_ORDERS.amount.',
    status: 'open',
  },
  {
    id: 'i9',
    pillar: 'semantic',
    checkCode: 'S9',
    severity: 'low',
    icon: 'chat',
    title: '“churn_risk” values aren’t explained',
    description: 'Spotter has no context for what the Low / Medium / High values mean.',
    impact: 'Questions about at-risk accounts can be misinterpreted.',
    source: 'AI context check · unexplained categorical',
    fixability: 'judgment',
    suggestion: 'Add AI context describing the churn_risk categories and which is the priority.',
    status: 'open',
  },
  {
    id: 'i10',
    pillar: 'physical',
    checkCode: 'P11',
    severity: 'high',
    icon: 'hash',
    title: '“churn_risk” is 22% empty',
    description: 'Just over a fifth of DIM_CUSTOMERS rows have no churn_risk value.',
    impact: 'At-risk-account questions silently undercount.',
    source: 'Data profiling · null rate on a grouping column',
    fixability: 'not-here',
    suggestion: 'Backfill churn_risk in your source, or exclude null rows.',
    status: 'open',
  },
  {
    id: 'i11',
    pillar: 'physical',
    checkCode: 'P19',
    severity: 'medium',
    icon: 'hash',
    title: '“industry” has inconsistent values',
    description: '“Tech”, “Technology”, and “TECH” all appear.',
    impact: 'The same industry splits across groups and filters miss rows.',
    source: 'Data profiling · inconsistent categorical values',
    fixability: 'not-here',
    suggestion: 'Standardize industry values in your source, or map them in the model.',
    status: 'open',
  },
];

// ---- Fix metadata for the two new calibration models (#dme-staging, #dme-proposal) ----
// The staging (Model A) and proposal/families (Model B) explorations share this. Each
// fixable issue gets: a change type (drives the tag + the 3 canvas grammars), an object
// type (filter), a subject-area family (Model B grouping), an optional list of tables it
// touches (cross-table context line), and a before→after diff (both models' diff views).

export type ChangeType = 'add' | 'edit' | 'remove';
export type ObjectType = 'join' | 'column' | 'formula' | 'metadata';
export type FamilyId = 'sales-deals' | 'revenue-collections' | 'customers-churn' | 'support';

export interface Family {
  id: FamilyId;
  name: string;   // subject-area name in the analyst's own vocabulary
  blurb: string;  // one line describing the subject
}

// Subject-area families — named as topics, not tables, so a fix can live here even when
// no table itself changes (only its columns / formulas / metadata do).
export const FAMILIES: Family[] = [
  { id: 'sales-deals',         name: 'Sales & deals',         blurb: 'Booked orders, deal size, and margin' },
  { id: 'revenue-collections', name: 'Revenue & collections', blurb: 'Invoices and collected revenue' },
  { id: 'customers-churn',     name: 'Customers & churn',     blurb: 'Accounts, ARR, and churn risk' },
  { id: 'support',             name: 'Support',               blurb: 'Tickets and CSAT by account' },
];

export interface DiffField {
  field: string;   // what changed, e.g. "Cardinality"
  before: string;  // current (flawed) value
  after: string;   // corrected value
  /** For formula rewrites, render before/after as a code diff rather than a value pair. */
  code?: boolean;
}

// Impact tier — how the fix improves Spotter, framed as purpose ("To …") so it heads a
// list of fixes without reading as the symptom. Ordered by severity; empty tiers vanish.
export type ImpactTier = 'avoid-wrong' | 'unlock' | 'accuracy' | 'polish' | 'faster';

export const IMPACT_META: Record<ImpactTier, { label: string; order: number }> = {
  'avoid-wrong': { label: 'To avoid wrong answers', order: 0 },
  'unlock':      { label: 'To unlock new questions', order: 1 },
  'accuracy':    { label: 'To improve answer accuracy', order: 2 },
  'polish':      { label: 'To polish the model', order: 3 },
  'faster':      { label: 'To get faster answers', order: 4 },
};

export interface FixMeta {
  changeType: ChangeType;
  objectType: ObjectType;
  family: FamilyId;
  /** Impact tier — drives the collapsible group the fix sits under in the agentic dock. */
  severity: ImpactTier;
  /** What breaks if this stays unfixed — shown alongside the diff in the info overlay. */
  impact: string;
  /** Tables this fix touches — powers the "uses: …" context line on cross-table items. */
  uses?: string[];
  /** One-line, human-readable summary of the change (the diff list one-liner). */
  headline: string;
  diff: DiffField[];
}

// i5 ("no column has a description") is genuinely model-wide; for the families view it's
// filed under Sales & deals — the model's revenue spine, where undocumented columns hurt
// most — with `uses` spanning every table so its reach stays visible on the row.
export const FIX_META: Record<string, FixMeta> = {
  i1: {
    changeType: 'edit', objectType: 'join', family: 'revenue-collections',
    severity: 'avoid-wrong',
    impact: 'Revenue and order counts double through the invoice join, so every total reads high.',
    uses: ['FACT_INVOICES', 'FACT_SALES_ORDERS'],
    headline: 'Set invoices → orders join to Many : One',
    diff: [{ field: 'Cardinality', before: '1 : Many', after: 'Many : One' }],
  },
  i2: {
    changeType: 'edit', objectType: 'join', family: 'support',
    severity: 'accuracy',
    impact: 'Support tickets attach to the wrong customer, skewing per-account counts.',
    uses: ['FACT_SUPPORT_TICKETS', 'DIM_CUSTOMERS'],
    headline: 'Join support tickets on the customer key',
    diff: [{ field: 'Join column', before: 'FACT_SUPPORT_TICKETS.rep_id', after: 'FACT_SUPPORT_TICKETS.customer_id' }],
  },
  i3: {
    changeType: 'edit', objectType: 'formula', family: 'sales-deals',
    severity: 'avoid-wrong',
    impact: 'Average deal size reads low — repeated order IDs inflate the denominator.',
    uses: ['FACT_SALES_ORDERS'],
    headline: 'Count distinct orders in Average Deal Size',
    diff: [{ field: 'Average Deal Size', code: true,
      before: 'SUM(amount) / COUNT(order_id)',
      after: 'SUM(amount) / COUNT(DISTINCT order_id)' }],
  },
  i4: {
    changeType: 'edit', objectType: 'formula', family: 'sales-deals',
    severity: 'avoid-wrong',
    impact: 'Gross margin is a hardcoded 40% guess, so every margin answer is wrong.',
    uses: ['FACT_SALES_ORDERS'],
    headline: 'Base Gross Margin % on the real cost column',
    diff: [{ field: 'Gross Margin %', code: true,
      before: '(SUM(amount) - SUM(amount) * 0.6) / SUM(amount)',
      after: '(SUM(amount) - SUM(gross_margin)) / SUM(amount)' }],
  },
  i5: {
    changeType: 'add', objectType: 'metadata', family: 'sales-deals',
    severity: 'polish',
    impact: 'Undocumented columns leave Spotter guessing what each field means.',
    uses: ['FACT_SALES_ORDERS', 'FACT_INVOICES', 'DIM_CUSTOMERS', 'FACT_SUPPORT_TICKETS', 'DIM_DATE'],
    headline: 'Generate descriptions for every column',
    // Real sample values (matching the generator) so the preview shows what each column gets,
    // not just a count. Long values truncate in the card. 42 columns total.
    diff: [
      { field: 'FACT_SALES_ORDERS · amount', before: '(none)', after: 'Booked amount for each sales order.' },
      { field: 'DIM_CUSTOMERS · churn_risk', before: '(none)', after: 'Churn-risk tier for the customer.' },
      { field: 'FACT_SUPPORT_TICKETS · priority', before: '(none)', after: 'Priority for each support ticket record.' },
      { field: '+ 39 more columns', before: '(none)', after: 'Generated from names and sample values.' },
    ],
  },
  i12: {
    changeType: 'add', objectType: 'metadata', family: 'sales-deals',
    severity: 'polish',
    impact: 'Without AI context, Spotter has to guess how to use each column.',
    uses: ['FACT_SALES_ORDERS', 'FACT_INVOICES', 'DIM_CUSTOMERS', 'FACT_SUPPORT_TICKETS', 'DIM_DATE'],
    headline: 'Add AI context to every column',
    // Real sample values (matching the generator) so the preview shows the AI context each
    // column gets, not just a count. Long values truncate in the card. 42 columns total.
    diff: [
      { field: 'FACT_SALES_ORDERS · amount', before: '(none)', after: 'Booked order amount — revenue booked at order time (distinct from the invoiced amount).' },
      { field: 'DIM_CUSTOMERS · churn_risk', before: '(none)', after: 'Churn risk tier — Low / Medium / High; High = priority to retain.' },
      { field: 'DIM_CUSTOMERS · arr', before: '(none)', after: 'Annual recurring revenue for the account.' },
      { field: '+ 39 more columns', before: '(none)', after: 'Generated from names, sample values, and how the column is used.' },
    ],
  },
  i7: {
    changeType: 'edit', objectType: 'column', family: 'customers-churn',
    severity: 'accuracy',
    impact: 'Questions about recurring revenue don’t match the cryptic "arr".',
    uses: ['DIM_CUSTOMERS'],
    headline: 'Rename "arr" to Annual recurring revenue',
    diff: [{ field: 'Display name', before: 'arr', after: 'Annual recurring revenue' }],
  },
};

/** Tag label + tone for a change type (drives the diff-list tags and family rows). */
export const CHANGE_TAG: Record<ChangeType, { label: string; tone: 'add' | 'edit' | 'remove' }> = {
  add:    { label: 'Added',   tone: 'add' },
  edit:   { label: 'Edited',  tone: 'edit' },
  remove: { label: 'Removed', tone: 'remove' },
};

export const OBJECT_LABEL: Record<ObjectType, string> = {
  join: 'Joins', column: 'Columns', formula: 'Formulas', metadata: 'Metadata',
};

/** Value-driven, concise "what's at stake" problem statements — shown as the fix-row TITLE,
 *  with the recommendation (FIX_META.headline / fix suggestion) as the row DESCRIPTION. Keyed
 *  by issue id and by Spotter-fix id (`fix-<questionId>`). */
export const FIX_PROBLEM: Record<string, string> = {
  i1: 'Revenue double-counts',
  i2: 'Support metrics hit the wrong account',
  i3: 'Average deal size reads low',
  i4: 'Gross margin is a fixed guess',
  i5: 'Spotter guesses what columns mean',
  i12: 'Spotter has no column context',
  i7: 'ARR questions won’t match',
  'fix-q1': 'Revenue answers come back inflated',
  'fix-q2': 'Wrong “amount” read as revenue',
  'fix-q3': 'Monthly revenue double-counts',
  'fix-q4': 'No measure for revenue at risk',
  'fix-q5': 'Average deal size is off',
  'fix-q6': 'Collected vs booked is ambiguous',
};

/** The fixable, in-model issues both new models operate on (excludes source/not-here). */
export const CALIBRATION_FIXES: Issue[] = ISSUES.filter((i) => i.fixability !== 'not-here' && FIX_META[i.id]);

// ---- Drift signals ----
// (Removed for the POC AI-readiness port — the POC flow is scope = readiness only,
//  no drift monitoring. See MERGE_POC_AI_READINESS.md.)

// ---- Model / stage state ----

export type CalibrationState =
  | 'never'       // A1
  | 'calibrated'  // A2
  | 'stale'       // A3 — calibrated, edited since
  | 'partial';    // A4 — only some pillars run

export interface ModelMeta {
  name: string;
  description: string;
  connection: string;
  state: CalibrationState;
  lastRun: string | null;
}

export const MODEL: ModelMeta = {
  name: 'Customer revenue & retention',
  description: 'Revenue, collections, and churn signals, ready for Spotter.',
  connection: 'Enterprise sales',
  state: 'stale',
  lastRun: '20 days ago',
};

export const severityRank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

// Detailed checks streamed as running points during the loading state (no icons).
export const PILLAR_CHECKS: Record<PillarId, string[]> = {
  physical: [
    'Checking table joins',
    'Checking for fan-out duplication',
    'Checking metrics are their own columns',
    'Checking column count',
    'Checking date column count',
    'Checking default date granularity',
    'Checking column data types',
    'Checking column value indexing',
    'Checking overlapping column values',
    'Checking for hardcoded ratio formulas',
    'Checking nulls in key columns',
    'Checking foreign key matches',
    'Checking primary key uniqueness',
    'Checking relationship cardinality',
    'Checking for duplicate rows',
    'Checking value ranges',
    'Checking unit consistency',
    'Checking for outliers',
    'Checking categorical value consistency',
    'Checking whitespace & casing',
    'Checking date formats',
    'Checking time zones',
  ],
  semantic: [
    'Checking name clarity',
    'Checking for similar names',
    'Checking name spacing',
    'Checking naming prefixes',
    'Checking for special characters',
    'Checking name uniqueness',
    'Checking column descriptions',
    'Checking synonyms',
    'Checking model AI instructions',
    'Checking column AI context',
  ],
  ai: [
    'Testing “What was total booked revenue last quarter?”',
    'Testing “Which industries drive the most revenue?”',
    'Testing “Monthly booked revenue trend this year”',
    'Testing “Revenue at risk from high-churn accounts”',
    'Testing “Average deal size by segment”',
    'Testing “Collected vs. booked revenue”',
  ],
};

// ─── Spotter Calibration sample questions ────────────────────────────────────
// A fixed set Spotter answers so the modeller can grade whether each answer is
// correct. Chart type drives the card icon; the chart itself is a placeholder.
export type ChartType = 'bar' | 'line' | 'column' | 'kpi' | 'table';

/** Mock answer data so the grading modal can render a real chart per question. */
export type QChart =
  | { kind: 'kpi'; value: string; delta?: string; deltaUp?: boolean; caption?: string }
  | { kind: 'table'; columns: string[]; rows: (string | number)[][] }
  | { kind: 'bar' | 'column' | 'line'; categories: string[]; series: { name: string; data: number[] }[]; unit?: string };

export interface SampleQuestion {
  id: string;
  name: string;
  description: string;
  chartType: ChartType;
  /** Question topic — groups the questions ("For revenue", "For churn risk", …). */
  topic?: string;
  /** Mock answer data rendered as a real chart in the grading modal. */
  chart?: QChart;
  /** When a wrong answer is turned into a fix, these give it a specific title/fix
   *  (e.g. "add a Units Sold measure"). Falls back to a generic fix if absent. */
  fixTitle?: string;
  fixSuggestion?: string;
  /** Where the resulting fix is applied in the DME (drives the canvas walkthrough). */
  fixTarget?: FixTarget;
  /** Before→after diff shown in the fix's preview card. For multi-column fixes, one entry
   *  per column in the same order as fixTarget.columns. */
  fixDiff?: DiffField[];
}

export const SPOTTER_QUESTIONS: SampleQuestion[] = [
  {
    id: 'q1',
    name: 'What was total booked revenue last quarter?',
    description: 'Sum of booked order amounts for the most recent completed quarter.',
    chartType: 'kpi',
    topic: 'revenue',
    chart: { kind: 'kpi', value: '$4.2M', delta: '+8.4%', deltaUp: true, caption: 'vs. previous quarter' },
    fixTitle: 'Stop revenue from double-counting',
    fixSuggestion: 'Set the FACT_INVOICES → FACT_SALES_ORDERS join to Many : 1 so revenue stops fanning out.',
    fixTarget: { tab: 'tables', tables: ['FACT_INVOICES', 'FACT_SALES_ORDERS'], where: 'Join · invoices → orders' },
    fixDiff: [{ field: 'Cardinality', before: '1 : Many', after: 'Many : One' }],
  },
  {
    id: 'q2',
    name: 'Which industries drive the most revenue?',
    description: 'Booked revenue ranked by customer industry.',
    chartType: 'bar',
    topic: 'revenue',
    chart: { kind: 'bar', categories: ['Technology', 'Financials', 'Retail', 'Healthcare', 'Industrials'], series: [{ name: 'Booked revenue', data: [1820, 1340, 980, 760, 540] }], unit: '$K' },
    fixTitle: 'Disambiguate which “amount” means revenue',
    fixSuggestion: 'Add AI context so Spotter uses FACT_SALES_ORDERS.amount (booked), not FACT_INVOICES.amount (invoiced).',
    fixTarget: { tab: 'columns', columns: ['FACT_SALES_ORDERS.amount', 'FACT_INVOICES.amount'], where: 'Columns · the two “amount” fields' },
    fixDiff: [
      { field: 'AI context', before: '(none)', after: 'Booked order amount — use this for “revenue”.' },
      { field: 'AI context', before: '(none)', after: 'Invoiced amount billed to the customer — not booked revenue.' },
    ],
  },
  {
    id: 'q3',
    name: 'Monthly booked revenue trend this year',
    description: 'Total booked revenue by month across the current year.',
    chartType: 'line',
    topic: 'revenue',
    chart: { kind: 'line', categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'], series: [{ name: 'Booked revenue', data: [520, 610, 580, 690, 720, 810, 760] }], unit: '$K' },
    fixTitle: 'Stop the monthly trend double-counting',
    fixSuggestion: 'Set the FACT_INVOICES → FACT_SALES_ORDERS join to Many : 1 so each month’s revenue stops fanning out.',
    fixTarget: { tab: 'tables', tables: ['FACT_INVOICES', 'FACT_SALES_ORDERS'], where: 'Join · invoices → orders' },
    fixDiff: [{ field: 'Cardinality', before: '1 : Many', after: 'Many : One' }],
  },
  {
    id: 'q4',
    name: 'How much revenue is at risk from high-churn accounts?',
    description: 'Booked revenue tied to accounts flagged as high churn risk.',
    chartType: 'table',
    topic: 'churn risk',
    chart: { kind: 'table', columns: ['Account', 'Segment', 'Revenue at risk'], rows: [['Northwind', 'Enterprise', '$420K'], ['Contoso', 'Mid-market', '$310K'], ['Fabrikam', 'Enterprise', '$280K'], ['Adventure Works', 'SMB', '$95K']] },
    fixTitle: 'Add a “Revenue at Risk” measure',
    fixSuggestion: 'Create a formula Revenue at Risk = SUM(FACT_SALES_ORDERS.amount) filtered to churn_risk = High.',
    fixTarget: { tab: 'formulas', formula: 'Revenue at Risk', where: 'Formula · Revenue at Risk' },
    fixDiff: [{ field: 'Revenue at Risk', code: true, before: 'Not defined', after: "SUM(FACT_SALES_ORDERS.amount) WHERE churn_risk = 'High'" }],
  },
  {
    id: 'q5',
    name: 'Average deal size by segment',
    description: 'Mean booked amount per order, broken out by customer segment.',
    chartType: 'column',
    topic: 'deal size',
    chart: { kind: 'column', categories: ['Enterprise', 'Mid-market', 'SMB'], series: [{ name: 'Avg deal size', data: [82, 34, 12] }], unit: '$K' },
    fixTitle: 'Fix Average Deal Size',
    fixSuggestion: 'Use COUNT(DISTINCT order_id) in Average Deal Size so it stops counting fanned-out rows.',
    fixTarget: { tab: 'formulas', formula: 'Average Deal Size', where: 'Formula · Average Deal Size' },
    fixDiff: [{ field: 'Average Deal Size', code: true, before: 'SUM(FACT_SALES_ORDERS.amount) / COUNT(FACT_SALES_ORDERS.order_id)', after: 'SUM(FACT_SALES_ORDERS.amount) / COUNT(DISTINCT FACT_SALES_ORDERS.order_id)' }],
  },
  {
    id: 'q6',
    name: 'Collected vs. booked revenue',
    description: 'Collected invoice amounts against booked order amounts.',
    chartType: 'bar',
    topic: 'billing accuracy',
    chart: { kind: 'bar', categories: ['Q1', 'Q2', 'Q3', 'Q4'], series: [{ name: 'Booked', data: [3.4, 3.9, 4.1, 4.2] }, { name: 'Collected', data: [3.1, 3.6, 3.8, 3.7] }], unit: '$M' },
    fixTitle: 'Distinguish collected from booked revenue',
    fixSuggestion: 'Add AI context so Spotter reads FACT_INVOICES.paid_amount as collected and FACT_SALES_ORDERS.amount as booked.',
    fixTarget: { tab: 'columns', columns: ['FACT_INVOICES.paid_amount', 'FACT_SALES_ORDERS.amount'], where: 'Columns · collected vs booked' },
    fixDiff: [
      { field: 'AI context', before: '(none)', after: 'Collected revenue — amount actually paid on the invoice.' },
      { field: 'AI context', before: '(none)', after: 'Booked revenue — order amount before invoicing.' },
    ],
  },
];
