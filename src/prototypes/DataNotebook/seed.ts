// ─────────────────────────────────────────────────────────────────────────────
// Seed data for the Hex notebook's DuckDB instance.
//
// Table + column names are the exact Customer Health schema from data/mockData.ts
// (hard rule: never invent table/column names). The first 5 accounts use the
// canonical mockData rows verbatim; accounts 6+ are generated deterministically
// (fixed LCG seed — stable across reloads) so real SQL aggregations have volume.
// ─────────────────────────────────────────────────────────────────────────────

import type { DataFrame, SeedTable, ConnectionGroup, SeedColumn } from './types';

// Deterministic PRNG so the dataset is identical on every load.
let _seed = 0x1a2b3c4d;
const rnd = () => {
  _seed = (_seed * 1664525 + 1013904223) >>> 0;
  return _seed / 0x100000000;
};
const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;
const round2 = (n: number) => Math.round(n * 100) / 100;

const REGIONS = ['NA', 'EMEA', 'APAC'];
const TIERS = ['Enterprise', 'Mid-Market', 'SMB'];
const INDUSTRIES = ['Manufacturing', 'Retail', 'Technology', 'Healthcare', 'Finance', 'Education', 'Logistics', null];
const CSMS = ['Priya Sharma', 'Liam Chen', 'Fatima Al-Hassan', 'Carlos Medina', 'Hannah Weber', 'Kenji Tanaka', 'Olivia Brooks'];
const SPONSORS = ['Ravi Menon', 'Mark Johansson', 'Ananya Rao', 'Sofia Rossi', 'Daniel Kim', null];
const NAME_A = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Soylent', 'Hooli', 'Vandelay', 'Stark', 'Wayne', 'Wonka', 'Cyberdyne', 'Tyrell', 'Massive', 'Pied Piper', 'Aperture', 'Gekko', 'Oscorp', 'Nakatomi', 'Bluth', 'Prestige'];
const NAME_B = ['Corp', 'Inc', 'LLC', 'Co', 'Systems', 'Industries', 'Group', 'Labs', 'Holdings', 'Partners'];

const pos = ['Great support, very responsive team.', 'Excellent product. We love the AI features.', 'Rollout went smoothly, team is happy.', 'Best-in-class analytics, huge time saver.', 'Support resolved our issue in minutes.'];
const neu = ['Good tool, occasional slowness in reports.', 'Works as expected, nothing remarkable.', 'Decent, but the docs could be clearer.', 'It does the job for now.'];
const neg = ['Onboarding was confusing, needed more help.', 'Too many bugs in the last release.', 'Performance has been frustratingly slow.', 'We are evaluating alternatives.'];

const pad = (n: number) => String(n).padStart(4, '0');

// ── Generate the account spine (ACC-0001 … ACC-0048) ────────────────────────────
const N_ACCOUNTS = 48;

interface Acct { id: string; name: string; industry: string | null; arr: number; region: string; tier: string; }
const accounts: Acct[] = [];

// Canonical first five (verbatim from mockData)
const canonical: Acct[] = [
  { id: 'ACC-0001', name: 'Acme Corp', industry: 'Manufacturing', arr: 240000, region: 'APAC', tier: 'Enterprise' },
  { id: 'ACC-0002', name: 'Globex Inc', industry: 'Retail', arr: 85000, region: 'NA', tier: 'Mid-Market' },
  { id: 'ACC-0003', name: 'Initech LLC', industry: 'Technology', arr: 420000, region: 'EMEA', tier: 'Enterprise' },
  { id: 'ACC-0004', name: 'Umbrella Co', industry: null, arr: 32000, region: 'NA', tier: 'SMB' },
  { id: 'ACC-0005', name: 'Soylent Systems', industry: 'Healthcare', arr: 190000, region: 'APAC', tier: 'Mid-Market' },
];
canonical.forEach(a => accounts.push(a));

for (let i = 6; i <= N_ACCOUNTS; i++) {
  const tier = pick(TIERS);
  const arr = tier === 'Enterprise' ? ri(150, 600) * 1000 : tier === 'Mid-Market' ? ri(50, 200) * 1000 : ri(8, 60) * 1000;
  accounts.push({
    id: `ACC-${pad(i)}`,
    name: `${pick(NAME_A)} ${pick(NAME_B)}`,
    industry: pick(INDUSTRIES),
    arr,
    region: pick(REGIONS),
    tier,
  });
}

const isoDate = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// ── dim_accounts ────────────────────────────────────────────────────────────────
const dimAccounts: DataFrame = accounts.map((a, i) => ({
  account_id: a.id,
  account_name: a.name,
  industry: a.industry,
  arr: a.arr,
  contract_start_date: isoDate(2022, ri(1, 12), ri(1, 28)),
  contract_end_date: i % 13 === 4 ? null : isoDate(2024 + ri(0, 1), ri(1, 12), ri(1, 28)),
  region: a.region,
  account_tier: a.tier,
  renewal_date: i % 8 === 3 ? null : isoDate(2024, ri(7, 12), ri(1, 28)),
}));
// keep canonical renewal_date values
dimAccounts[0].renewal_date = '2024-09-30';
dimAccounts[1].renewal_date = '2024-11-15';
dimAccounts[2].renewal_date = '2025-01-31';
dimAccounts[3].renewal_date = '2024-08-20';
dimAccounts[4].renewal_date = null;

// ── support_cases ──────────────────────────────────────────────────────────────
const supportCases: DataFrame = [
  { case_id: 'CS-10441', account_id: 'ACC-0001', created_date: '2024-03-01', closed_date: '2024-03-03', priority: 'P2', status: 'Closed', case_category: 'Bug', resolution_time_hours: 48, reopened: false },
  { case_id: 'CS-10442', account_id: 'ACC-0003', created_date: '2024-03-05', closed_date: null, priority: 'P1', status: 'Open', case_category: 'Performance', resolution_time_hours: null, reopened: false },
  { case_id: 'CS-10443', account_id: 'ACC-0002', created_date: '2024-03-07', closed_date: '2024-03-10', priority: 'P3', status: 'Closed', case_category: null, resolution_time_hours: 72, reopened: true },
  { case_id: 'CS-10444', account_id: 'ACC-0001', created_date: '2024-03-12', closed_date: '2024-03-13', priority: 'P2', status: 'Closed', case_category: 'Data Loss', resolution_time_hours: 24, reopened: false },
  { case_id: 'CS-10445', account_id: 'ACC-0005', created_date: '2024-03-14', closed_date: null, priority: 'P1', status: 'Open', case_category: 'Bug', resolution_time_hours: null, reopened: false },
];
let caseSeq = 10446;
const CASE_CATS = ['Bug', 'Performance', 'Data Loss', 'How-to', 'Billing', null];
const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
accounts.forEach(a => {
  const n = ri(0, 5);
  for (let k = 0; k < n; k++) {
    const open = chance(0.3);
    const created = isoDate(2024, ri(1, 3), ri(1, 28));
    supportCases.push({
      case_id: `CS-${caseSeq++}`,
      account_id: a.id,
      created_date: created,
      closed_date: open ? null : isoDate(2024, ri(1, 3), ri(1, 28)),
      priority: pick(PRIORITIES),
      status: open ? 'Open' : 'Closed',
      case_category: pick(CASE_CATS),
      resolution_time_hours: open ? null : ri(2, 120),
      reopened: chance(0.12),
    });
  }
});

// ── call_metrics ───────────────────────────────────────────────────────────────
const callMetrics: DataFrame = [
  { call_id: 'CALL-7701', account_id: 'ACC-0001', call_date: '2024-03-20', duration_minutes: 42, sentiment_score: 0.71, talk_ratio_rep: 0.48, next_steps_mentioned: true, deal_risk_flag: false },
  { call_id: 'CALL-7702', account_id: 'ACC-0003', call_date: '2024-03-21', duration_minutes: 28, sentiment_score: 0.34, talk_ratio_rep: 0.62, next_steps_mentioned: false, deal_risk_flag: true },
  { call_id: 'CALL-7703', account_id: 'ACC-0002', call_date: '2024-03-22', duration_minutes: 55, sentiment_score: null, talk_ratio_rep: null, next_steps_mentioned: true, deal_risk_flag: false },
  { call_id: 'CALL-7704', account_id: 'ACC-0005', call_date: '2024-03-23', duration_minutes: 18, sentiment_score: 0.58, talk_ratio_rep: 0.51, next_steps_mentioned: false, deal_risk_flag: false },
  { call_id: 'CALL-7705', account_id: 'ACC-0001', call_date: '2024-03-24', duration_minutes: 37, sentiment_score: 0.82, talk_ratio_rep: 0.44, next_steps_mentioned: true, deal_risk_flag: false },
];
let callSeq = 7706;
accounts.forEach(a => {
  const n = ri(0, 3);
  for (let k = 0; k < n; k++) {
    const hasS = chance(0.92);
    const s = round2(0.2 + rnd() * 0.7);
    callMetrics.push({
      call_id: `CALL-${callSeq++}`,
      account_id: a.id,
      call_date: isoDate(2024, 3, ri(1, 28)),
      duration_minutes: ri(12, 60),
      sentiment_score: hasS ? s : null,
      talk_ratio_rep: hasS ? round2(0.4 + rnd() * 0.3) : null,
      next_steps_mentioned: chance(0.6),
      deal_risk_flag: hasS ? s < 0.4 : chance(0.2),
    });
  }
});

// ── customer_found_defects ───────────────────────────────────────────────────────
const defects: DataFrame = [
  { defect_id: 'DEF-3301', account_id: 'ACC-0003', reported_date: '2024-02-10', severity: 'S1', status: 'Open', resolution_days: null, escalated_to_engineering: true },
  { defect_id: 'DEF-3302', account_id: 'ACC-0001', reported_date: '2024-02-14', severity: 'S2', status: 'Resolved', resolution_days: 12, escalated_to_engineering: false },
  { defect_id: 'DEF-3303', account_id: 'ACC-0002', reported_date: '2024-02-18', severity: 'S3', status: 'Resolved', resolution_days: 5, escalated_to_engineering: false },
  { defect_id: 'DEF-3304', account_id: 'ACC-0005', reported_date: '2024-03-01', severity: 'S2', status: 'Open', resolution_days: null, escalated_to_engineering: true },
  { defect_id: 'DEF-3305', account_id: 'ACC-0003', reported_date: '2024-03-05', severity: 'S1', status: 'Open', resolution_days: null, escalated_to_engineering: true },
];
let defSeq = 3306;
const SEVERITIES = ['S1', 'S2', 'S3'];
accounts.forEach(a => {
  const n = ri(0, 2);
  for (let k = 0; k < n; k++) {
    const open = chance(0.4);
    defects.push({
      defect_id: `DEF-${defSeq++}`,
      account_id: a.id,
      reported_date: isoDate(2024, ri(1, 3), ri(1, 28)),
      severity: pick(SEVERITIES),
      status: open ? 'Open' : 'Resolved',
      resolution_days: open ? null : ri(1, 40),
      escalated_to_engineering: chance(0.4),
    });
  }
});

// ── pendo_nps_enriched ────────────────────────────────────────────────────────
const pendoNps: DataFrame = [
  { account_id: 'ACC-0001', nps_score: 9, nps_comments: 'Great support, very responsive team.', sentiment: 'positive', sentiment_score: 0.74, response_date: '2024-03-15' },
  { account_id: 'ACC-0002', nps_score: 3, nps_comments: 'Onboarding was confusing, needed more help.', sentiment: 'negative', sentiment_score: -0.51, response_date: '2024-03-16' },
  { account_id: 'ACC-0003', nps_score: 8, nps_comments: 'Good tool, occasional slowness in reports.', sentiment: 'positive', sentiment_score: 0.34, response_date: '2024-03-16' },
  { account_id: 'ACC-0004', nps_score: 5, nps_comments: null, sentiment: 'neutral', sentiment_score: 0.0, response_date: '2024-03-17' },
  { account_id: 'ACC-0005', nps_score: 10, nps_comments: 'Excellent product. We love the AI features.', sentiment: 'positive', sentiment_score: 0.89, response_date: '2024-03-17' },
];
accounts.slice(5).forEach(a => {
  const r = rnd();
  const sentiment = r > 0.55 ? 'positive' : r > 0.3 ? 'neutral' : 'negative';
  const nps = sentiment === 'positive' ? ri(8, 10) : sentiment === 'neutral' ? ri(5, 7) : ri(0, 4);
  const sScore = sentiment === 'positive' ? round2(0.3 + rnd() * 0.6) : sentiment === 'neutral' ? 0.0 : round2(-0.8 + rnd() * 0.5);
  const hasComment = chance(0.62);
  pendoNps.push({
    account_id: a.id,
    nps_score: nps,
    nps_comments: hasComment ? (sentiment === 'positive' ? pick(pos) : sentiment === 'neutral' ? pick(neu) : pick(neg)) : null,
    sentiment,
    sentiment_score: sScore,
    response_date: isoDate(2024, 3, ri(10, 28)),
  });
});

// ── csm_account_mapping ──────────────────────────────────────────────────────
const csmMapping: DataFrame = [
  { account_id: 'ACC-0001', csm_name: 'Priya Sharma', exec_sponsor: 'Ravi Menon', csm_region: 'APAC', account_tier: 'Enterprise' },
  { account_id: 'ACC-0002', csm_name: 'Liam Chen', exec_sponsor: null, csm_region: 'NA', account_tier: 'Mid-Market' },
  { account_id: 'ACC-0003', csm_name: 'Fatima Al-Hassan', exec_sponsor: 'Mark Johansson', csm_region: 'EMEA', account_tier: 'Enterprise' },
  { account_id: 'ACC-0004', csm_name: 'Carlos Medina', exec_sponsor: null, csm_region: 'NA', account_tier: 'SMB' },
  { account_id: 'ACC-0005', csm_name: 'Priya Sharma', exec_sponsor: 'Ananya Rao', csm_region: 'APAC', account_tier: 'Mid-Market' },
];
accounts.slice(5).forEach(a => {
  csmMapping.push({
    account_id: a.id,
    csm_name: pick(CSMS),
    exec_sponsor: pick(SPONSORS),
    csm_region: a.region,
    account_tier: a.tier,
  });
});

// ── Column metadata (from mockData) ──────────────────────────────────────────
const col = (name: string, type: string, classification: SeedColumn['classification'], nullable = false, nullRate = 0, description: string | null = null): SeedColumn =>
  ({ name, type, classification, nullable, nullRate, description });

export const SEED_TABLES: SeedTable[] = [
  {
    name: 'dim_accounts', source: 'sf_prod_customer', connectionLabel: 'SF_PROD_CUSTOMER', connectionType: 'snowflake',
    description: 'Master account dimension from Salesforce — one row per customer account with contract and tier data.',
    rowCount: 12000, dqScore: 94, owner: 'Revenue Ops (Priya Nair)',
    columns: [
      col('account_id', 'VARCHAR', 'key', false, 0, 'Unique account identifier across all systems.'),
      col('account_name', 'VARCHAR', 'attribute'),
      col('industry', 'VARCHAR', 'attribute', true, 4),
      col('arr', 'BIGINT', 'measure', false, 0, 'Annual recurring revenue in USD.'),
      col('contract_start_date', 'DATE', 'attribute'),
      col('contract_end_date', 'DATE', 'attribute', true, 8),
      col('region', 'VARCHAR', 'attribute'),
      col('account_tier', 'VARCHAR', 'attribute', false, 0, 'Enterprise, Mid-Market, or SMB.'),
      col('renewal_date', 'DATE', 'attribute', true, 12, 'Next contract renewal date.'),
    ],
    records: dimAccounts,
  },
  {
    name: 'support_cases', source: 'sf_prod_customer', connectionLabel: 'SF_PROD_CUSTOMER', connectionType: 'snowflake',
    description: 'Support case history from Salesforce — all tickets filed by customer accounts.',
    rowCount: 84000, dqScore: 81, owner: 'Customer Success Eng (Rahul Mehta)',
    columns: [
      col('case_id', 'VARCHAR', 'key'),
      col('account_id', 'VARCHAR', 'key', false, 0, 'Join to dim_accounts on account_id.'),
      col('created_date', 'DATE', 'attribute'),
      col('closed_date', 'DATE', 'attribute', true, 22),
      col('priority', 'VARCHAR', 'attribute', false, 0, 'P1–P4.'),
      col('status', 'VARCHAR', 'attribute'),
      col('case_category', 'VARCHAR', 'attribute', true, 9),
      col('resolution_time_hours', 'DOUBLE', 'measure', true, 22, 'Hours from creation to resolution.'),
      col('reopened', 'BOOLEAN', 'attribute'),
    ],
    records: supportCases,
  },
  {
    name: 'call_metrics', source: 'sf_prod_customer', connectionLabel: 'SF_PROD_CUSTOMER', connectionType: 'snowflake',
    description: 'Gong call recordings and sentiment analysis — one row per customer call.',
    rowCount: 31000, dqScore: 88, owner: 'GTM Analytics (Sana Kapoor)',
    columns: [
      col('call_id', 'VARCHAR', 'key'),
      col('account_id', 'VARCHAR', 'key', false, 0, 'Join to dim_accounts on account_id.'),
      col('call_date', 'DATE', 'attribute'),
      col('duration_minutes', 'DOUBLE', 'measure'),
      col('sentiment_score', 'DOUBLE', 'measure', true, 3, 'Gong sentiment 0–1. Higher = more positive.'),
      col('talk_ratio_rep', 'DOUBLE', 'measure', true, 3),
      col('next_steps_mentioned', 'BOOLEAN', 'attribute'),
      col('deal_risk_flag', 'BOOLEAN', 'attribute', false, 0, 'True if Gong detected deal-risk language.'),
    ],
    records: callMetrics,
  },
  {
    name: 'customer_found_defects', source: 'sf_prod_customer', connectionLabel: 'SF_PROD_CUSTOMER', connectionType: 'snowflake',
    description: 'Engineering bugs and defects reported by customers via JIRA.',
    rowCount: 6200, dqScore: 91, owner: 'Engineering Ops (Dev Sharma)',
    columns: [
      col('defect_id', 'VARCHAR', 'key'),
      col('account_id', 'VARCHAR', 'key', false, 0, 'Account that reported the defect.'),
      col('reported_date', 'DATE', 'attribute'),
      col('severity', 'VARCHAR', 'attribute', false, 0, 'S1 (Critical), S2 (Major), S3 (Minor).'),
      col('status', 'VARCHAR', 'attribute'),
      col('resolution_days', 'DOUBLE', 'measure', true, 31),
      col('escalated_to_engineering', 'BOOLEAN', 'attribute'),
    ],
    records: defects,
  },
  {
    name: 'pendo_nps_enriched', source: 'spotstore', connectionLabel: 'ThoughtSpot CDW (Spotstore)', connectionType: 'thoughtspot',
    description: 'Pendo NPS responses enriched with sentiment scores — written by the ingestion notebook.',
    rowCount: 2847, dqScore: 92, owner: 'Agent (pendo_nps_ingestion)',
    columns: [
      col('account_id', 'VARCHAR', 'key'),
      col('nps_score', 'BIGINT', 'measure', false, 0, 'NPS score 0–10.'),
      col('nps_comments', 'VARCHAR', 'attribute', true, 38, 'Raw verbatim NPS comment text.'),
      col('sentiment', 'VARCHAR', 'attribute', false, 0, 'positive, neutral, or negative.'),
      col('sentiment_score', 'DOUBLE', 'measure', false, 0, 'Compound sentiment −1 to 1.'),
      col('response_date', 'DATE', 'attribute'),
    ],
    records: pendoNps,
  },
  {
    name: 'csm_account_mapping', source: 'spotstore', connectionLabel: 'ThoughtSpot CDW (Spotstore)', connectionType: 'thoughtspot',
    description: 'CSM and executive sponsor mapping per account — uploaded from CSM_MAPPING_Q2.csv.',
    rowCount: 142, dqScore: 98, owner: 'Agent (CSV upload)',
    columns: [
      col('account_id', 'VARCHAR', 'key'),
      col('csm_name', 'VARCHAR', 'attribute', false, 0, 'Customer Success Manager assigned to the account.'),
      col('exec_sponsor', 'VARCHAR', 'attribute', true, 14, 'Executive sponsor from the customer side.'),
      col('csm_region', 'VARCHAR', 'attribute'),
      col('account_tier', 'VARCHAR', 'attribute'),
    ],
    records: csmMapping,
  },
];

export const CONNECTIONS: ConnectionGroup[] = [
  {
    id: 'sf_prod_customer', label: 'SF_PROD_CUSTOMER', type: 'snowflake',
    sublabel: 'Snowflake · 4 tables',
    tables: ['dim_accounts', 'support_cases', 'call_metrics', 'customer_found_defects'],
  },
  {
    id: 'spotstore', label: 'ThoughtSpot CDW (Spotstore)', type: 'thoughtspot',
    sublabel: 'Spotstore · 2 tables',
    tables: ['pendo_nps_enriched', 'csm_account_mapping'],
  },
];

export const getSeedTable = (name: string): SeedTable | undefined =>
  SEED_TABLES.find(t => t.name === name);

// All warehouse table names known to the kernel (used for dependency derivation).
export const SEED_TABLE_NAMES = SEED_TABLES.map(t => t.name);

// ── CSV helpers ──────────────────────────────────────────────────────────────
const csvEscape = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (records: DataFrame, columns: string[]): string => {
  const lines = [columns.join(',')];
  for (const r of records) lines.push(columns.map(c => csvEscape(r[c])).join(','));
  return lines.join('\n');
};

// Bundled sample CSV (CSM mapping) — lets the demo / agent attach a real CSV without
// the user having a file. Excludes region/account_tier to avoid join-column collisions.
export const SAMPLE_CSV = {
  name: 'CSM_MAPPING_Q2.csv',
  get text() {
    return toCsv(csmMapping, ['account_id', 'csm_name', 'exec_sponsor', 'csm_region']);
  },
};
