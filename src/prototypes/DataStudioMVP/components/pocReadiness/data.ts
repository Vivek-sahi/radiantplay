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
  i1: { tab: 'tables',   tables: ['accounts', 'jira_cs_tickets'],   where: 'Join · accounts → jira_cs_tickets' },
  i2: { tab: 'tables',   tables: ['accounts', 'feature_adoption'],  where: 'Join · accounts → feature_adoption' },
  i3: { tab: 'formulas', formula: 'Renewal Risk',                   where: 'Formula · Renewal Risk' },
  i4: { tab: 'formulas', formula: 'Renewal Risk',                   where: 'Formula · Renewal Risk' },
  i5: { tab: 'columns',  cell: 'desc',                              where: 'Columns · 6 undocumented' },
  i12: { tab: 'columns', cell: 'aiCtx',                             where: 'Columns · all tables' },
  i6: { tab: 'columns',  columns: ['contracts.acv', 'arr_snapshot.arr'], where: 'Columns · acv and arr' },
  i7: { tab: 'columns',  columns: ['accounts.acct_st'],             where: 'Column · acct_st' },
  i8: { tab: 'columns',  columns: ['accounts.acct_st'],             where: 'Column · acct_st' },
  i9: { tab: 'formulas', formula: 'Renewal Risk',                   where: 'Formula · Renewal Risk' },
};

// Findings are grounded in the renewal-risk model the demo actually builds — the seven
// tables in ModelCanvas' TABLE_COLS (accounts, contracts, arr_snapshot, usage_events,
// feature_adoption, qbr_sentiment, jira_cs_tickets; 36 columns), every join hanging off
// accounts.account_id, and Maya's hand-written Renewal Risk metric.
//
// The run-of-show names four of these out loud at S16, so they are not ours to reword:
//   i5  — 6 columns with no description
//   i7  — acct_st, ambiguous name…
//   i8  — …and no synonyms
//   i1  — fan-out risk on the Jira join
//   i9  — Renewal Risk has no definition an LLM can reason from
// No column, table or value below is invented: all of them exist in TABLE_COLS, and the
// two fan-out joins are the ones already carrying `warnFanOut` in AgentPanel's DEMO_JOINS.
export const ISSUES: Issue[] = [
  {
    id: 'i1',
    pillar: 'physical',
    checkCode: 'P3',
    severity: 'high',
    icon: 'link',
    title: 'Jira tickets fan out against accounts',
    description: 'accounts → jira_cs_tickets is one-to-many and nothing aggregates it first.',
    impact: 'Every account-level total multiplies by that account’s ticket count, so ARR at risk reads high.',
    source: 'Join check · cardinality',
    fixability: 'auto',
    suggestion: 'Aggregate jira_cs_tickets to one row per account before the join.',
    status: 'open',
  },
  {
    id: 'i2',
    pillar: 'physical',
    checkCode: 'P4',
    severity: 'high',
    icon: 'link',
    title: 'Feature adoption fans out the same way',
    description: 'accounts → feature_adoption carries one row per feature per account.',
    impact: 'ARR and usage totals multiply by the number of features an account has adopted.',
    source: 'Join check · cardinality',
    fixability: 'auto',
    suggestion: 'Aggregate feature_adoption to one row per account before the join.',
    status: 'open',
  },
  {
    id: 'i3',
    pillar: 'physical',
    checkCode: 'P12',
    severity: 'high',
    icon: 'gauge',
    title: 'Renewal Risk counts ticket rows, not escalations',
    description: 'The escalation term counts jira_cs_tickets rows without DISTINCT.',
    impact: 'Wherever a ticket fans out, the open-P1 term inflates and the risk score climbs with it.',
    source: 'Formula check · missing DISTINCT',
    fixability: 'auto',
    suggestion: 'Use COUNT(DISTINCT issue_key) for the escalation term.',
    status: 'open',
  },
  {
    id: 'i4',
    pillar: 'physical',
    checkCode: 'P14',
    severity: 'medium',
    icon: 'gauge',
    title: 'Renewal Risk hard-codes its weights',
    description: 'Usage decline is weighted 0.4 and escalations 0.35, with nothing recording why.',
    impact: 'The score can’t be defended or retuned — every reader has to take the weighting on trust.',
    source: 'Formula check · hardcoded ratio',
    fixability: 'judgment',
    suggestion: 'Record what the weights mean, so the score can be explained and tuned.',
    status: 'open',
  },
  {
    id: 'i5',
    pillar: 'semantic',
    checkCode: 'S7',
    severity: 'medium',
    icon: 'chat',
    title: '6 columns have no description',
    description: 'acct_st, segment, owner, term_months, issue_key and assignee are undocumented.',
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
    description: 'Not one of the 36 columns carries AI context to guide how Spotter interprets it.',
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
    title: '“acv” and “arr” both read as revenue',
    description: 'contracts.acv (contract value) and arr_snapshot.arr (recurring revenue) are indistinguishable by name.',
    impact: 'Spotter can’t tell which measure “revenue” means and may pick the wrong one.',
    source: 'Naming check · overlapping meaning',
    fixability: 'judgment',
    suggestion: 'Add AI context distinguishing annual contract value from annual recurring revenue.',
    status: 'open',
  },
  {
    id: 'i7',
    pillar: 'semantic',
    checkCode: 'S3',
    severity: 'high',
    icon: 'chat',
    title: '“acct_st” is an ambiguous name',
    description: 'accounts.acct_st gives no clue that it holds the account’s renewal status.',
    impact: 'A human can guess it. An LLM reading the model has nothing to go on — it’s a coin-flip.',
    source: 'Naming check · abbreviation detected',
    fixability: 'auto',
    suggestion: 'Rename to “Account status” and keep “acct_st” as a synonym.',
    status: 'open',
  },
  {
    id: 'i8',
    pillar: 'semantic',
    checkCode: 'S8',
    severity: 'medium',
    icon: 'sparkle',
    title: '“acct_st” has no synonyms',
    description: 'Nothing maps the column to the words people actually ask with.',
    impact: 'Questions using “status”, “renewal status” or “account state” miss the column entirely.',
    source: 'Vocabulary check · terms from query history',
    fixability: 'auto',
    suggestion: 'Add “status”, “account state” and “renewal status” as synonyms for acct_st.',
    status: 'open',
  },
  {
    id: 'i9',
    pillar: 'semantic',
    checkCode: 'S9',
    severity: 'high',
    icon: 'chat',
    title: 'Renewal Risk has no definition an LLM can reason from',
    description: 'The formula returns a number but carries no description of what it measures.',
    impact: 'Spotter can print the score and cannot say what counts as risky, or defend a ranking built on it.',
    source: 'AI context check · undefined metric',
    fixability: 'judgment',
    suggestion: 'Document what Renewal Risk measures, which signals feed it, and what counts as high.',
    status: 'open',
  },
  {
    id: 'i10',
    pillar: 'physical',
    checkCode: 'P11',
    severity: 'high',
    icon: 'hash',
    title: '“usage_delta_90d” is empty for 3 accounts',
    description: 'Three of the twelve accounts have no usage_delta_90d value in usage_events.',
    impact: 'Declining-usage questions silently skip those accounts.',
    source: 'Data profiling · null rate on a grouping column',
    fixability: 'not-here',
    suggestion: 'Backfill usage_delta_90d in Databricks, or exclude null rows.',
    status: 'open',
  },
  {
    id: 'i11',
    pillar: 'physical',
    checkCode: 'P19',
    severity: 'medium',
    icon: 'hash',
    title: '“segment” has inconsistent values',
    description: '“Enterprise”, “ENT” and “Ent.” all appear in accounts.segment.',
    impact: 'The same segment splits across groups and filters miss rows.',
    source: 'Data profiling · inconsistent categorical values',
    fixability: 'not-here',
    suggestion: 'Standardize segment values in Snowflake, or map them in the model.',
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
export type FamilyId = 'accounts-renewals' | 'revenue-arr' | 'usage-adoption' | 'support-escalations';

export interface Family {
  id: FamilyId;
  name: string;   // subject-area name in the analyst's own vocabulary
  blurb: string;  // one line describing the subject
}

// Subject-area families — named as topics, not tables, so a fix can live here even when
// no table itself changes (only its columns / formulas / metadata do).
export const FAMILIES: Family[] = [
  { id: 'accounts-renewals',   name: 'Accounts & renewals',    blurb: 'Accounts, contracts, and renewal dates' },
  { id: 'revenue-arr',         name: 'Revenue & ARR',          blurb: 'Contract value, ARR, and its change' },
  { id: 'usage-adoption',      name: 'Usage & adoption',       blurb: 'Active users, sessions, and feature adoption' },
  { id: 'support-escalations', name: 'Support & escalations',  blurb: 'Jira tickets and QBR sentiment by account' },
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

// i5 ("6 columns with no description") and i12 ("no AI context") span the whole model; for
// the families view they file under Accounts & renewals — the model's spine, where an
// undocumented column hurts most — with `uses` naming every table so the reach stays visible.
export const FIX_META: Record<string, FixMeta> = {
  i1: {
    changeType: 'edit', objectType: 'join', family: 'support-escalations',
    severity: 'avoid-wrong',
    impact: 'ARR at risk multiplies by ticket count, so the riskiest accounts are whichever ones complain most.',
    uses: ['accounts', 'jira_cs_tickets'],
    headline: 'Aggregate Jira tickets to one row per account',
    diff: [{ field: 'Join input', before: 'jira_cs_tickets (one row per ticket)', after: 'One row per account_id, escalations counted' }],
  },
  i2: {
    changeType: 'edit', objectType: 'join', family: 'usage-adoption',
    severity: 'avoid-wrong',
    impact: 'Adoption rows multiply every account-level total the same way the Jira join does.',
    uses: ['accounts', 'feature_adoption'],
    headline: 'Aggregate feature adoption to one row per account',
    diff: [{ field: 'Join input', before: 'feature_adoption (one row per feature)', after: 'One row per account_id, adoption averaged' }],
  },
  i3: {
    changeType: 'edit', objectType: 'formula', family: 'support-escalations',
    severity: 'avoid-wrong',
    impact: 'The open-P1 term inflates wherever a ticket fans out, and the risk score climbs with it.',
    uses: ['jira_cs_tickets'],
    headline: 'Count distinct escalations in Renewal Risk',
    diff: [{ field: 'Renewal Risk', code: true,
      before: 'COUNT(issue_key) WHERE priority = \'P1\'',
      after: 'COUNT(DISTINCT issue_key) WHERE priority = \'P1\'' }],
  },
  i4: {
    changeType: 'edit', objectType: 'formula', family: 'accounts-renewals',
    severity: 'accuracy',
    impact: 'Nothing records why usage counts 0.4 and escalations 0.35, so the score can’t be defended.',
    uses: ['usage_events', 'jira_cs_tickets'],
    headline: 'Record what the Renewal Risk weights mean',
    diff: [{ field: 'Weighting note', before: '(none)', after: 'Usage decline 0.4, open P1s 0.35 — set with CS in the Q2 review.' }],
  },
  i5: {
    changeType: 'add', objectType: 'metadata', family: 'accounts-renewals',
    severity: 'polish',
    impact: 'Undocumented columns leave Spotter guessing what each field means.',
    uses: ['accounts', 'contracts', 'jira_cs_tickets'],
    headline: 'Generate descriptions for the 6 undocumented columns',
    // One entry per undocumented column — the preview shows what each one gets, not a count.
    diff: [
      { field: 'accounts · acct_st', before: '(none)', after: 'Renewal status for the account.' },
      { field: 'accounts · segment', before: '(none)', after: 'Sales segment the account belongs to.' },
      { field: 'accounts · owner', before: '(none)', after: 'Account executive who owns the relationship.' },
      { field: 'contracts · term_months', before: '(none)', after: 'Length of the contract term, in months.' },
      { field: 'jira_cs_tickets · issue_key', before: '(none)', after: 'Jira identifier for the escalation.' },
      { field: 'jira_cs_tickets · assignee', before: '(none)', after: 'Support engineer the ticket is assigned to.' },
    ],
  },
  i12: {
    changeType: 'add', objectType: 'metadata', family: 'accounts-renewals',
    severity: 'polish',
    impact: 'Without AI context, Spotter has to guess how to use each column.',
    uses: ['accounts', 'contracts', 'arr_snapshot', 'usage_events', 'feature_adoption', 'qbr_sentiment', 'jira_cs_tickets'],
    headline: 'Add AI context to all 36 columns',
    diff: [
      { field: 'accounts · acct_st', before: '(none)', after: 'Renewal status — A = active, AR = at risk, CH = churned, P = pending renewal.' },
      { field: 'usage_events · usage_delta_90d', before: '(none)', after: 'Change in active users over 90 days; negative means declining usage.' },
      { field: 'jira_cs_tickets · priority', before: '(none)', after: 'Jira priority — P1 is an escalation and counts toward renewal risk.' },
      { field: '+ 33 more columns', before: '(none)', after: 'Generated from names, sample values, and how the column is used.' },
    ],
  },
  i6: {
    changeType: 'add', objectType: 'metadata', family: 'revenue-arr',
    severity: 'avoid-wrong',
    impact: 'Asked for “revenue”, Spotter can pick contract value or recurring revenue — they disagree.',
    uses: ['contracts', 'arr_snapshot'],
    headline: 'Distinguish contract value from recurring revenue',
    diff: [
      { field: 'contracts · acv', before: '(none)', after: 'Annual contract value — what the account signed for.' },
      { field: 'arr_snapshot · arr', before: '(none)', after: 'Annual recurring revenue — what the account is billed now. Use this for “revenue”.' },
    ],
  },
  i7: {
    changeType: 'edit', objectType: 'column', family: 'accounts-renewals',
    severity: 'avoid-wrong',
    impact: 'A model can be perfectly correct and still be a coin-flip for an LLM if a column is called acct_st.',
    uses: ['accounts'],
    headline: 'Rename "acct_st" to Account status',
    diff: [{ field: 'Display name', before: 'acct_st', after: 'Account status' }],
  },
  i8: {
    changeType: 'add', objectType: 'metadata', family: 'accounts-renewals',
    severity: 'unlock',
    impact: 'Questions phrased with “status” or “renewal status” never reach the column.',
    uses: ['accounts'],
    headline: 'Add synonyms for Account status',
    diff: [{ field: 'Synonyms', before: '(none)', after: 'status · account state · renewal status' }],
  },
  i9: {
    changeType: 'add', objectType: 'metadata', family: 'accounts-renewals',
    severity: 'avoid-wrong',
    impact: 'Spotter can return the number and cannot say what makes an account risky, or defend the ranking.',
    uses: ['usage_events', 'jira_cs_tickets', 'contracts'],
    headline: 'Define what Renewal Risk measures',
    diff: [{ field: 'Renewal Risk · definition', before: '(none)',
      after: 'Likelihood an account fails to renew: 90-day usage decline and open P1 escalations, weighted. Above 0.6 is high.' }],
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
  i1: 'ARR at risk multiplies by ticket count',
  i2: 'Adoption rows inflate every total',
  i3: 'Escalation counts read high',
  i4: 'The risk weights can’t be defended',
  i5: '6 columns Spotter has to guess at',
  i12: 'Spotter has no column context',
  i6: '“Revenue” could mean either column',
  i7: '“acct_st” means nothing to an LLM',
  i8: 'Status questions miss the column',
  i9: 'Renewal Risk can’t be reasoned about',
  'fix-q1': 'Renewal list ranks by ticket volume',
  'fix-q2': 'Declining usage misses null accounts',
  'fix-q3': '“At risk” has no definition to match',
  'fix-q4': 'Escalation counts double',
  'fix-q5': 'ARR at risk reads high',
  'fix-q6': 'Segment totals split three ways',
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
  name: 'Renewal risk',
  description: 'Contracts, ARR, usage and escalations, ready for Spotter.',
  connection: 'Snowflake · Databricks · Jira',
  state: 'never',
  lastRun: null,
};

export const severityRank: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/**
 * The columns the renewal-risk model exposes to Spotter, as the Edit Answer picker
 * lists them. Business names rather than physical ones — this is the surface a CCO
 * reads, and `usage_delta_90d` is exactly the kind of thing the semantic pass exists
 * to translate.
 */
export const MODEL_MEASURES = [
  '# Open P1s', '90-day usage change', 'ARR', 'ARR at risk',
  'Feature adoption', 'QBR sentiment', 'Renewal Risk',
];
export const MODEL_ATTRIBUTES = [
  'Account', 'Account status', 'Account tier', 'Industry',
  'Owner', 'Priority', 'Region', 'Renewal date',
];

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
    'Testing “Which accounts are renewing in the next 90 days?”',
    'Testing “Which renewing accounts have declining usage?”',
    'Testing “Which accounts are at risk?”',
    'Testing “Which accounts have open P1 escalations?”',
    'Testing “How much ARR is at risk this quarter?”',
    'Testing “Renewal risk by segment”',
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
  /**
   * The search tokens that produced this answer, shown in the Edit Answer editor.
   * Written out rather than derived from the chart: the tokens are the *question* as
   * the engine understood it, and things like "top 10" or a filter never appear in the
   * result. Seeing them is the whole point of opening the editor.
   */
  tokens?: string[];
  /** Columns ticked in the editor's picker when it opens — what this answer used. */
  usedColumns?: string[];
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
    name: 'Which accounts renewing in the next 90 days are most at risk?',
    description: 'Renewing accounts ranked by renewal risk, with the ARR each one carries.',
    chartType: 'table',
    topic: 'renewal risk',
    tokens: ['Account', 'Renewal date', 'ARR at risk', 'sort by Renewal Risk', 'Renewal date next 90 days'],
    usedColumns: ['Account', 'Renewal date', 'ARR at risk', 'Renewal Risk'],
    chart: { kind: 'table', columns: ['Account', 'Renewal date', 'ARR at risk'], rows: [['Northwind', '12 Aug 2024', '$420K'], ['Contoso', '3 Sep 2024', '$310K'], ['Fabrikam', '28 Aug 2024', '$280K'], ['Adventure Works', '19 Sep 2024', '$95K']] },
    fixTitle: 'Rank by risk, not by ticket volume',
    fixSuggestion: 'Aggregate jira_cs_tickets to one row per account so escalations stop multiplying the ranking.',
    fixTarget: { tab: 'tables', tables: ['accounts', 'jira_cs_tickets'], where: 'Join · accounts → jira_cs_tickets' },
    fixDiff: [{ field: 'Join input', before: 'jira_cs_tickets (one row per ticket)', after: 'One row per account_id, escalations counted' }],
  },
  {
    id: 'q2',
    name: 'Which renewing accounts have declining usage?',
    description: 'Accounts with a negative 90-day usage delta and a renewal in the window.',
    chartType: 'bar',
    topic: 'usage',
    tokens: ['Account', '90-day usage change', '90-day usage change < 0', 'sort by 90-day usage change'],
    usedColumns: ['Account', '90-day usage change'],
    chart: { kind: 'bar', categories: ['Northwind', 'Fabrikam', 'Contoso', 'Tailspin'], series: [{ name: '90-day usage change', data: [-38, -31, -27, -12] }], unit: '%' },
    fixTitle: 'Say what a missing usage delta means',
    fixSuggestion: 'Add AI context to usage_delta_90d so accounts with no reading aren’t read as flat.',
    fixTarget: { tab: 'columns', columns: ['usage_events.usage_delta_90d'], where: 'Column · usage_delta_90d' },
    fixDiff: [{ field: 'AI context', before: '(none)', after: 'Change in active users over 90 days; negative means declining. Null means no reading, not zero change.' }],
  },
  {
    id: 'q3',
    name: 'Which accounts are at risk?',
    description: 'Accounts the model considers at risk of not renewing.',
    chartType: 'table',
    topic: 'renewal risk',
    tokens: ['Account', 'Account status', 'Renewal Risk', 'sort by Renewal Risk'],
    usedColumns: ['Account', 'Account status', 'Renewal Risk'],
    chart: { kind: 'table', columns: ['Account', 'Status', 'Renewal risk'], rows: [['Northwind', 'AR', '0.78'], ['Fabrikam', 'AR', '0.71'], ['Contoso', 'P', '0.64'], ['Tailspin', 'A', '0.31']] },
    fixTitle: 'Define what “at risk” means',
    fixSuggestion: 'Document the Renewal Risk metric and the acct_st codes so “at risk” resolves to something.',
    fixTarget: { tab: 'formulas', formula: 'Renewal Risk', where: 'Formula · Renewal Risk' },
    fixDiff: [{ field: 'Renewal Risk · definition', before: '(none)', after: 'Likelihood an account fails to renew. Above 0.6 is high. acct_st = AR marks it at risk.' }],
  },
  {
    id: 'q4',
    name: 'Which accounts have open P1 escalations?',
    description: 'Accounts with unresolved P1 tickets in Jira, counted per account.',
    chartType: 'column',
    topic: 'escalations',
    tokens: ['Account', '# Open P1s', 'Priority = P1', 'sort by # Open P1s'],
    usedColumns: ['Account', '# Open P1s', 'Priority'],
    chart: { kind: 'column', categories: ['Northwind', 'Contoso', 'Fabrikam', 'Tailspin'], series: [{ name: 'Open P1s', data: [3, 2, 2, 1] }] },
    fixTitle: 'Count each escalation once',
    fixSuggestion: 'Use COUNT(DISTINCT issue_key) so a fanned-out ticket isn’t counted twice.',
    fixTarget: { tab: 'formulas', formula: 'Renewal Risk', where: 'Formula · Renewal Risk' },
    fixDiff: [{ field: 'Renewal Risk', code: true, before: 'COUNT(issue_key) WHERE priority = \'P1\'', after: 'COUNT(DISTINCT issue_key) WHERE priority = \'P1\'' }],
  },
  {
    id: 'q5',
    name: 'How much ARR is at risk this quarter?',
    description: 'Total ARR across accounts renewing this quarter with high renewal risk.',
    chartType: 'kpi',
    topic: 'renewal risk',
    tokens: ['ARR at risk', 'Renewal date this quarter'],
    usedColumns: ['ARR at risk', 'Renewal date'],
    chart: { kind: 'kpi', value: '$1.1M', delta: '+14%', deltaUp: true, caption: 'vs. last quarter' },
    fixTitle: 'Stop ARR multiplying through the joins',
    fixSuggestion: 'Aggregate feature_adoption and jira_cs_tickets per account so ARR is summed once.',
    fixTarget: { tab: 'tables', tables: ['accounts', 'feature_adoption'], where: 'Join · accounts → feature_adoption' },
    fixDiff: [{ field: 'Join input', before: 'feature_adoption (one row per feature)', after: 'One row per account_id, adoption averaged' }],
  },
  {
    id: 'q6',
    name: 'Renewal risk by segment',
    description: 'Average renewal risk grouped by the account’s sales segment.',
    chartType: 'column',
    topic: 'renewal risk',
    tokens: ['Account tier', 'Renewal Risk', 'sort by Renewal Risk'],
    usedColumns: ['Account tier', 'Renewal Risk'],
    chart: { kind: 'column', categories: ['Enterprise', 'Mid-market', 'SMB'], series: [{ name: 'Avg renewal risk', data: [0.62, 0.44, 0.29] }] },
    fixTitle: 'Standardize the segment values',
    fixSuggestion: 'Map “ENT” and “Ent.” onto “Enterprise” so the segment stops splitting three ways.',
    fixTarget: { tab: 'columns', columns: ['accounts.segment'], where: 'Column · segment' },
    fixDiff: [{ field: 'Values', before: 'Enterprise · ENT · Ent.', after: 'Enterprise' }],
  },
];
