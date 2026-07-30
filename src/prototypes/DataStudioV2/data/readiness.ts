/**
 * AI readiness — pillars and findings.
 *
 * Ported from surajboro-ts/spotter-readiness-vision (`Calibration/data.ts`) and
 * re-pointed onto the renewal-risk demo tables. Run-of-show S15–S18.
 *
 * Two things came across, one didn't:
 *
 *  - PILLARS: the three layers the script describes ("three layers checking in
 *    sequence"). Physical and Semantic carry static findings; "For Spotter"
 *    generates its findings by running real questions and having the user grade
 *    the answers — which DataStudio's existing tuning flow already does, using
 *    the same correct/incorrect/OOS vocabulary. So that pillar has no static
 *    issues here by design.
 *
 *  - ISSUES: instance-level findings, named. Deliberately not category-level
 *    counts ("2 of 12 columns mapped") — the script's build note is explicit
 *    that a generic "3 issues found" wastes the beat.
 *
 *  - NOT ported: his fix pipeline UI (CanvasFixOverlay, FixWalkthrough,
 *    fixCanvas). Those locate rows via CSS classes his canvas stamps
 *    (`dmecol-…`, `dmeformula-…`); ours doesn't work that way. `fixTarget`
 *    below targets abstractly instead, so our canvas can satisfy it.
 *
 * Every table and column referenced here exists in the canvas TABLE_COLS
 * catalogue, and every finding is true of the mock rows — the Jira fan-out is
 * real (ACC-0002 and ACC-0004 each have three tickets), `arr` really does sit
 * next to `acv` with no description.
 */

export type PillarId = 'physical' | 'semantic' | 'ai';
export type Severity = 'high' | 'medium' | 'low';

/**
 * auto      — the agent can apply it unattended
 * judgment  — needs a human decision; the agent proposes, the user confirms
 * not-here  — the real fix belongs upstream in the warehouse, not in the model
 */
export type Fixability = 'auto' | 'judgment' | 'not-here';

export interface CheckPoint { icon: string; label: string }

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
  lastRun: string | null;
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
      'Checks how well the model explains itself — names, descriptions, synonyms and AI context that Spotter reads to understand each field.',
    prereq: 'Columns added to the model',
    prereqMet: true,
    checkCount: 10,
    cost: 'instant',
    costLabel: 'Instant — reads metadata only',
    lastRun: null,
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
    lastRun: null,
    points: [
      { icon: 'play', label: 'Runs real questions' },
      { icon: 'check', label: 'You confirm answers' },
      { icon: 'waveform', label: 'Catches wrong answers' },
    ],
  },
];

/**
 * Where a fix applies. Abstract on purpose — his version pointed at DOM classes
 * on his canvas. `view` maps onto our Canvas/Columns switcher; there is no
 * formulas view here, so metric findings land in Columns.
 */
export interface FixTarget {
  view: 'canvas' | 'columns';
  /** Table cards to spotlight, by tableName. */
  tables?: string[];
  /** "table.column" rows to spotlight. */
  columns?: string[];
  /** Short human label — "Join · jira_cs_tickets → accounts". */
  where: string;
}

/**
 * Superset of the legacy AIR_ITEMS shape so existing chrome (score, scan
 * animation, task list, per-column diff review) keeps reading `id/name/detail/
 * sev/tag` untouched, while new UI reads the richer fields.
 */
export interface ReadinessIssue {
  id: string;
  /** Legacy display name. */
  name: string;
  /** Legacy one-line detail. */
  detail: string;
  /** Legacy severity — drives the existing pill colours. */
  sev: 'miss' | 'warn' | 'good';
  /** Legacy tag. */
  tag: 'Missing' | 'Partial' | 'Good';

  // ── Added by the port ──────────────────────────────────────────────────────
  pillar: PillarId;
  /** Instance-level headline, e.g. "Jira tickets fan out against accounts". */
  title: string;
  severity: Severity;
  /** Real-world consequence, in the user's terms. */
  impact: string;
  /** Provenance — how the check knows. */
  source: string;
  fixability: Fixability;
  /** Applied when the user accepts the fix. */
  suggestion: string;
  fixTarget: FixTarget;
  /** Maps onto the existing per-column review keys so Columns-table highlighting still works. */
  reviewKey?: 'coldesc' | 'desc' | 'synonyms' | 'indexing' | 'col_types' | 'date_vals';
}

export const READINESS_ISSUES: ReadinessIssue[] = [
  // ── Physical ───────────────────────────────────────────────────────────────
  {
    id: 'fanout_jira',
    pillar: 'physical',
    name: 'Join cardinality',
    title: 'Jira tickets fan out against accounts',
    detail: 'jira_cs_tickets joins accounts one-to-many — totals will inflate.',
    sev: 'miss', tag: 'Missing', severity: 'high',
    impact: 'Any ARR or contract total aggregated across this join is counted once per ticket. ACC-0004 has three open tickets, so its ARR is tripled.',
    source: 'Key profiling — account_id is unique in accounts, repeated in jira_cs_tickets',
    fixability: 'auto',
    suggestion: 'Add a join hint marking jira_cs_tickets as the many side, and aggregate ticket counts before joining.',
    fixTarget: { view: 'canvas', tables: ['jira_cs_tickets', 'accounts'], where: 'Join · jira_cs_tickets → accounts' },
  },
  {
    id: 'metric_renewal_risk',
    pillar: 'physical',
    name: 'Metric definition',
    title: '"Renewal Risk" has no definition Spotter can reason from',
    detail: 'The formula exists but carries no description of what it means or when to use it.',
    sev: 'miss', tag: 'Missing', severity: 'high',
    impact: 'Spotter can compute the number but cannot explain it, qualify it, or decline to use it where it does not apply — so it will answer "why is this account at risk" with a figure and no reasoning.',
    source: 'Formula scan — computed column with no semantic description',
    fixability: 'judgment',
    suggestion: 'Describe the metric in business terms: weighted blend of 90-day usage decline (0.4), open P1 escalations (0.35) and QBR sentiment drop (0.25); higher is worse; only meaningful for accounts with an active contract.',
    fixTarget: { view: 'columns', columns: ['model.Renewal Risk'], where: 'Formula · Renewal Risk' },
  },
  {
    id: 'nulls_sentiment',
    pillar: 'physical',
    name: 'Null coverage',
    title: 'qbr_sentiment covers only 8 of 12 accounts',
    detail: 'Four accounts have no QBR row, so the sentiment term silently contributes zero.',
    sev: 'warn', tag: 'Partial', severity: 'medium',
    impact: 'Renewal Risk reads artificially low for the four accounts with no QBR — they look safer than accounts that were actually reviewed.',
    source: 'Row profiling — 8 of 12 account_ids present',
    fixability: 'judgment',
    suggestion: 'Treat a missing QBR as unknown rather than neutral, and exclude those accounts from the sentiment term instead of scoring them zero.',
    fixTarget: { view: 'canvas', tables: ['qbr_sentiment'], where: 'Table · qbr_sentiment' },
  },
  // ── Semantic ───────────────────────────────────────────────────────────────
  {
    id: 'coldesc',
    pillar: 'semantic',
    name: 'Column descriptions',
    title: '6 columns have no description',
    detail: '6 of 12 columns described — improves answer quality significantly.',
    sev: 'warn', tag: 'Partial', severity: 'medium',
    impact: 'Spotter guesses at what undescribed fields mean, which is where confidently wrong answers come from.',
    source: 'Metadata scan',
    fixability: 'auto',
    suggestion: 'Generate descriptions from column names, types and sample values, for review.',
    fixTarget: { view: 'columns', where: 'Columns · all tables' },
    reviewKey: 'coldesc',
  },
  {
    id: 'aicontext',
    pillar: 'semantic',
    name: 'Column AI context',
    title: 'No column has AI context',
    detail: 'Missing on all 12 columns — Spotter uses this to know how to apply each field.',
    sev: 'miss', tag: 'Missing', severity: 'medium',
    impact: 'Without it Spotter knows what a column contains but not how to use it — which fields are filters, which are measures, which are safe to sum.',
    source: 'Metadata scan',
    fixability: 'auto',
    suggestion: 'Generate AI context per column from its role in the model.',
    fixTarget: { view: 'columns', where: 'Columns · all tables' },
    reviewKey: 'desc',
  },
  {
    id: 'ambiguous_arr',
    pillar: 'semantic',
    name: 'Ambiguous naming',
    title: '"arr" and "acv" are indistinguishable to Spotter',
    detail: 'Two revenue measures, abbreviated, with no descriptions to separate them.',
    sev: 'warn', tag: 'Partial', severity: 'high',
    impact: 'Asked for "revenue at risk", Spotter has no way to choose between annual recurring revenue and annual contract value — and the two differ per account.',
    source: 'Naming scan — abbreviations with overlapping meaning',
    fixability: 'judgment',
    suggestion: 'Expand both names and describe the difference: arr is recognised recurring revenue; acv is contracted value for the current term.',
    fixTarget: { view: 'columns', columns: ['arr_snapshot.arr', 'contracts.acv'], where: 'Columns · arr, acv' },
    reviewKey: 'coldesc',
  },
  {
    id: 'synonyms',
    pillar: 'semantic',
    name: 'Column synonyms',
    title: '"usage_delta_90d" has no synonyms',
    detail: 'Nobody asks for "usage delta 90d" — they ask about usage dropping or declining.',
    sev: 'warn', tag: 'Partial', severity: 'medium',
    impact: 'Questions phrased in natural language miss the column entirely, so Spotter answers from a weaker signal or not at all.',
    source: 'Search-term gap analysis',
    fixability: 'auto',
    suggestion: 'Add synonyms: usage decline, usage drop, declining usage, engagement drop.',
    fixTarget: { view: 'columns', columns: ['usage_events.usage_delta_90d'], where: 'Column · usage_delta_90d' },
    reviewKey: 'synonyms',
  },
  {
    id: 'indexing',
    pillar: 'semantic',
    name: 'Enable indexing',
    title: 'Attribute values are not indexed',
    detail: 'Spotter can\'t retrieve values like "Enterprise" or "P1" during search.',
    sev: 'miss', tag: 'Missing', severity: 'medium',
    impact: 'A question naming a value — "open P1s", "Enterprise accounts" — can\'t resolve that value to a column without indexing.',
    source: 'Index configuration',
    fixability: 'auto',
    suggestion: 'Enable value indexing on segment, priority, status and region.',
    fixTarget: { view: 'columns', columns: ['accounts.segment', 'jira_cs_tickets.priority'], where: 'Columns · segment, priority' },
    reviewKey: 'indexing',
  },
  {
    id: 'joins_ok',
    pillar: 'physical',
    name: 'Data relationships',
    title: 'Account keys join cleanly across sources',
    detail: 'All six sources share account_id with no orphans.',
    sev: 'good', tag: 'Good', severity: 'low',
    impact: '—',
    source: 'Key profiling',
    fixability: 'auto',
    suggestion: '',
    fixTarget: { view: 'canvas', where: 'Model · joins' },
  },
];

/** Findings for one pillar. "For Spotter" has none until tuning has been run. */
export const issuesForPillar = (id: PillarId): ReadinessIssue[] =>
  READINESS_ISSUES.filter(i => i.pillar === id);

/** Readiness percentage — share of non-passing findings that have been resolved. */
export const readinessPct = (resolvedIds: Set<string>): number => {
  const actionable = READINESS_ISSUES.filter(i => i.sev !== 'good');
  if (actionable.length === 0) return 100;
  const passing = READINESS_ISSUES.filter(i => i.sev === 'good').length;
  const resolved = actionable.filter(i => resolvedIds.has(i.id)).length;
  return Math.round(((passing + resolved) / READINESS_ISSUES.length) * 100);
};
