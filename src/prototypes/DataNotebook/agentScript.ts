// ─────────────────────────────────────────────────────────────────────────────
// Notebook-agent scripted narratives — four data scenarios.
//
// The AGENT is scripted (canned plan + which cells it writes). The CELLS are real:
// every SQL string runs on DuckDB and every Python string runs on Pyodide/pandas
// against the seeded tables, so the resulting notebook is fully editable + runnable.
//
//   S1  CDW + Spotstore        — SQL across Snowflake + Spotstore
//   S2  All in Spotstore       — SQL over Spotstore tables only
//   S3  CDW + CSV              — Snowflake SQL + an uploaded CSV
//   S4  CDW + Pendo + CSV      — Snowflake SQL + Pendo (Python fetch, no connector) + CSV
// ─────────────────────────────────────────────────────────────────────────────

import type { CellType, SqlSourceId, ChartType, InputKind } from './types';
import type { Agg } from './agg';

export interface NewCellSpec {
  type: CellType;
  name: string;
  narration: string;
  planIndex: number;
  code?: string;
  source?: SqlSourceId;
  returnMode?: 'dataframe' | 'query';
  sourceVar?: string;
  chartType?: ChartType;
  x?: string; y?: string; agg?: Agg; series?: string;
  column?: string; format?: 'number' | 'percent' | 'currency'; caption?: string;
  groupBy?: string[]; values?: { column: string; agg: Agg }[];
  inputKind?: InputKind; label?: string; value?: string | number;
  min?: number; max?: number; step?: number; options?: string[];
  markdown?: string;
  fileName?: string; // csv cells — sample file attached during the agent build
}

export interface Followup {
  match: RegExp;
  reply: string;
  cell?: NewCellSpec;
}

export type ScenarioId = 's1' | 's2' | 's3' | 's4';

export interface Scenario {
  id: ScenarioId;
  name: string;          // chip label
  blurb: string;         // chip subtitle
  sources: string;       // short source summary
  prompt: string;        // pre-filled agent draft
  searchHits: { table: string; connection: string; rows: number }[];
  planSteps: string[];
  cells: NewCellSpec[];
  followups: Followup[];
}

// ── shared follow-ups ────────────────────────────────────────────────────────
const followupsFor = (mainVar: string, scoreCol: string, atRiskVar?: string): Followup[] => {
  const f: Followup[] = [
    { match: /tier/i, reply: 'Added average health by account tier.', cell: { type: 'chart', name: 'health_by_tier', planIndex: -1, narration: '', sourceVar: mainVar, chartType: 'bar', x: 'account_tier', y: scoreCol, agg: 'avg' } },
    { match: /\b(csm|owner)\b/i, reply: 'Broke down average health per CSM.', cell: { type: 'pivot', name: 'health_by_csm', planIndex: -1, narration: '', sourceVar: mainVar, groupBy: ['csm_name'], values: [{ column: scoreCol, agg: 'avg' }] } },
  ];
  if (atRiskVar) f.push({ match: /\b(arr|revenue|risk)\b/i, reply: 'Added total ARR at risk for accounts below the threshold.', cell: { type: 'single-value', name: 'arr_at_risk', planIndex: -1, narration: '', sourceVar: atRiskVar, column: 'arr', agg: 'sum', format: 'currency', caption: 'ARR at risk' } });
  return f;
};

const CDW_HITS = [
  { table: 'dim_accounts', connection: 'SF_PROD_CUSTOMER', rows: 12000 },
  { table: 'support_cases', connection: 'SF_PROD_CUSTOMER', rows: 84000 },
  { table: 'call_metrics', connection: 'SF_PROD_CUSTOMER', rows: 31000 },
  { table: 'customer_found_defects', connection: 'SF_PROD_CUSTOMER', rows: 6200 },
];
const SPOTSTORE_HITS = [
  { table: 'pendo_nps_enriched', connection: 'ThoughtSpot CDW', rows: 2847 },
  { table: 'csm_account_mapping', connection: 'ThoughtSpot CDW', rows: 142 },
];

// account_base SQL — reused by S1/S3/S4 (one row per account from the 4 Snowflake tables)
const ACCOUNT_BASE_SQL = `SELECT
  a.account_id,
  a.account_name,
  a.region,
  a.account_tier,
  a.arr,
  COUNT(DISTINCT CASE WHEN c.priority = 'P1' AND c.status = 'Open' THEN c.case_id END) AS p1_cases_open,
  AVG(cm.sentiment_score)                                                            AS avg_call_sentiment,
  COUNT(DISTINCT CASE WHEN d.status = 'Open' THEN d.defect_id END)                   AS open_defects
FROM dim_accounts a
LEFT JOIN support_cases          c  ON c.account_id  = a.account_id
LEFT JOIN call_metrics           cm ON cm.account_id = a.account_id
LEFT JOIN customer_found_defects d  ON d.account_id  = a.account_id
GROUP BY 1, 2, 3, 4, 5
ORDER BY a.account_id`;

const accountBaseCell = (): NewCellSpec => ({
  type: 'sql', name: 'account_base', planIndex: 0, source: 'sf_prod_customer', returnMode: 'dataframe',
  narration: 'Starting with the four Snowflake tables joined to the account dimension — one row per account with P1s open, average call sentiment, and open defects.',
  code: ACCOUNT_BASE_SQL,
});

// ── Scenario 1 — CDW + Spotstore ────────────────────────────────────────────────
const S1: Scenario = {
  id: 's1', name: 'CDW + Spotstore', blurb: 'Snowflake account data joined with Pendo NPS + CSM mapping already in the Spotstore.',
  sources: 'Snowflake · Spotstore',
  prompt: 'Build a customer health scorecard from our Snowflake account data, the Pendo NPS table, and the CSM mapping. Score each account on NPS, support, call sentiment, and defects.',
  searchHits: [...CDW_HITS, ...SPOTSTORE_HITS],
  planSteps: ['Aggregate account signals from Snowflake', 'Join Pendo NPS with the CSM mapping (Spotstore)', 'Compute the composite health score in Python', 'Visualize health and surface the headline number', 'Add a reactive at-risk filter'],
  cells: [
    accountBaseCell(),
    {
      type: 'sql', name: 'nps_enriched', planIndex: 1, source: 'spotstore', returnMode: 'dataframe',
      narration: 'Now the Spotstore side — Pendo NPS enriched with the CSM mapping.',
      code: `SELECT
  n.account_id,
  n.nps_score,
  n.sentiment,
  n.sentiment_score AS nps_sentiment_score,
  m.csm_name,
  m.csm_region
FROM pendo_nps_enriched n
LEFT JOIN csm_account_mapping m ON m.account_id = n.account_id`,
    },
    {
      type: 'python', name: 'customer_health', planIndex: 2,
      narration: 'Merging both dataframes and computing the composite score in pandas — NPS 30%, support 20%, call sentiment 25%, defects 25%.',
      code: `import pandas as pd

df = account_base.merge(nps_enriched, on='account_id', how='left')
df['nps_norm']     = (df['nps_score'].fillna(5) / 10).clip(0, 1)
df['support_norm'] = (1 - df['p1_cases_open'].fillna(0) / 3).clip(0, 1)
df['call_norm']    = df['avg_call_sentiment'].fillna(0.5).clip(0, 1)
df['defect_norm']  = (1 - df['open_defects'].fillna(0) / 3).clip(0, 1)
df['customer_health_score'] = (
    0.30*df['nps_norm'] + 0.20*df['support_norm'] + 0.25*df['call_norm'] + 0.25*df['defect_norm']
).round(2)

customer_health = df[['account_id','account_name','region','account_tier','arr','csm_name',
                      'nps_score','avg_call_sentiment','p1_cases_open','open_defects',
                      'customer_health_score']].sort_values('customer_health_score')
customer_health`,
    },
    { type: 'chart', name: 'health_by_region', planIndex: 3, narration: 'Average health by region.', sourceVar: 'customer_health', chartType: 'bar', x: 'region', y: 'customer_health_score', agg: 'avg' },
    { type: 'single-value', name: 'avg_health', planIndex: 3, narration: 'And the headline number.', sourceVar: 'customer_health', column: 'customer_health_score', agg: 'avg', format: 'percent', caption: 'Average customer health' },
    { type: 'input', name: 'min_health', planIndex: 4, narration: 'A threshold slider for at-risk accounts.', inputKind: 'slider', label: 'At-risk below', value: 0.6, min: 0, max: 1, step: 0.05 },
    { type: 'python', name: 'at_risk', planIndex: 4, narration: 'Drag the slider and this list re-runs automatically.', code: `at_risk = customer_health[customer_health['customer_health_score'] < min_health]
at_risk[['account_id','account_name','customer_health_score','csm_name','region','arr']]` },
    { type: 'markdown', name: 'summary', planIndex: 4, narration: 'Documenting the model.', markdown: `## Customer Health Scorecard

Composite per account, blended from four sources:

- **NPS** (30%) — \`pendo_nps_enriched\` (Spotstore)
- **Support** (20%) — open P1s from \`support_cases\` (Snowflake)
- **Call sentiment** (25%) — \`call_metrics\` (Snowflake)
- **Defects** (25%) — \`customer_found_defects\` (Snowflake)

Drag **At-risk below** to change the threshold — the at-risk table is reactive.` },
  ],
  followups: followupsFor('customer_health', 'customer_health_score', 'at_risk'),
};

// ── Scenario 2 — all data in Spotstore ───────────────────────────────────────────
const S2: Scenario = {
  id: 's2', name: 'All in Spotstore', blurb: 'Everything already lives in the ThoughtSpot Spotstore — NPS responses and the CSM mapping.',
  sources: 'Spotstore only',
  prompt: 'All my data is already in the Spotstore — the Pendo NPS table and the CSM mapping. Build an NPS-driven health view per account and CSM.',
  searchHits: SPOTSTORE_HITS,
  planSteps: ['Join the Spotstore NPS and CSM tables', 'Derive an NPS-based health score in Python', 'Visualize by region and tier'],
  cells: [
    {
      type: 'sql', name: 'nps_enriched', planIndex: 0, source: 'spotstore', returnMode: 'dataframe',
      narration: 'Both tables are in the Spotstore, so a single SQL join gets us NPS plus CSM context per account.',
      code: `SELECT
  n.account_id,
  n.nps_score,
  n.sentiment,
  n.sentiment_score,
  m.csm_name,
  m.csm_region,
  m.account_tier
FROM pendo_nps_enriched n
LEFT JOIN csm_account_mapping m ON m.account_id = n.account_id`,
    },
    {
      type: 'python', name: 'nps_health', planIndex: 1,
      narration: 'A lightweight health score — 60% NPS, 40% comment sentiment.',
      code: `import pandas as pd

df = nps_enriched.copy()
df['health'] = (
    0.6 * (df['nps_score'].fillna(5) / 10) +
    0.4 * ((df['sentiment_score'].fillna(0) + 1) / 2)
).round(2)
nps_health = df.sort_values('health')
nps_health`,
    },
    { type: 'chart', name: 'health_by_region', planIndex: 2, narration: 'Average health by CSM region.', sourceVar: 'nps_health', chartType: 'bar', x: 'csm_region', y: 'health', agg: 'avg' },
    { type: 'single-value', name: 'avg_health', planIndex: 2, narration: 'Headline NPS-based health.', sourceVar: 'nps_health', column: 'health', agg: 'avg', format: 'percent', caption: 'Average health (NPS-based)' },
    { type: 'pivot', name: 'health_by_tier', planIndex: 2, narration: 'And a pivot by account tier.', sourceVar: 'nps_health', groupBy: ['account_tier'], values: [{ column: 'health', agg: 'avg' }] },
    { type: 'markdown', name: 'summary', planIndex: 2, narration: 'Documenting it.', markdown: `## NPS health (Spotstore-only)

All data sourced from the ThoughtSpot Spotstore:

- \`pendo_nps_enriched\` — NPS scores + sentiment
- \`csm_account_mapping\` — CSM, region, tier

Health = **0.6 × NPS** + **0.4 × sentiment**. No warehouse round-trip needed.` },
  ],
  followups: followupsFor('nps_health', 'health'),
};

// ── Scenario 3 — CDW + CSV ────────────────────────────────────────────────────────
const S3: Scenario = {
  id: 's3', name: 'CDW + CSV', blurb: 'Snowflake account data plus a CSM mapping you upload as a CSV — no Spotstore copy.',
  sources: 'Snowflake · CSV upload',
  prompt: 'My account, support, call and defect data is in Snowflake, and I have a CSM mapping as a CSV (CSM_MAPPING_Q2.csv). Build a health view and attach the CSV.',
  searchHits: CDW_HITS,
  planSteps: ['Aggregate account signals from Snowflake', 'Load the uploaded CSV and match on account_id', 'Score health and visualize'],
  cells: [
    accountBaseCell(),
    {
      type: 'csv', name: 'csm_mapping', planIndex: 1, fileName: 'CSM_MAPPING_Q2.csv',
      narration: 'Attaching CSM_MAPPING_Q2.csv — parsed straight into DuckDB so it joins on account_id. (Drop your own CSV here to replace it.)',
    },
    {
      type: 'python', name: 'account_scored', planIndex: 2,
      narration: 'Joining the CSV and scoring on the operational signals — support 40%, call sentiment 35%, defects 25%.',
      code: `import pandas as pd

df = account_base.merge(csm_mapping, on='account_id', how='left')
df['support_norm'] = (1 - df['p1_cases_open'].fillna(0) / 3).clip(0, 1)
df['call_norm']    = df['avg_call_sentiment'].fillna(0.5).clip(0, 1)
df['defect_norm']  = (1 - df['open_defects'].fillna(0) / 3).clip(0, 1)
df['health_score'] = (0.40*df['support_norm'] + 0.35*df['call_norm'] + 0.25*df['defect_norm']).round(2)

account_scored = df[['account_id','account_name','region','account_tier','arr','csm_name',
                     'p1_cases_open','open_defects','health_score']].sort_values('health_score')
account_scored`,
    },
    { type: 'chart', name: 'health_by_region', planIndex: 2, narration: 'Average health by region.', sourceVar: 'account_scored', chartType: 'bar', x: 'region', y: 'health_score', agg: 'avg' },
    { type: 'single-value', name: 'avg_health', planIndex: 2, narration: 'Headline number.', sourceVar: 'account_scored', column: 'health_score', agg: 'avg', format: 'percent', caption: 'Average health (ops signals)' },
    { type: 'markdown', name: 'summary', planIndex: 2, narration: 'Documenting it.', markdown: `## Health from Snowflake + CSV

- **Snowflake** — support, call sentiment, defects per account
- **CSM_MAPPING_Q2.csv** — uploaded CSM mapping, joined on \`account_id\`

Score = support 40% + call sentiment 35% + defects 25%. (No NPS in this scenario.)` },
  ],
  followups: followupsFor('account_scored', 'health_score'),
};

// ── Scenario 4 — CDW + Pendo (Python fetch) + CSV ─────────────────────────────────
const S4: Scenario = {
  id: 's4', name: 'CDW + Pendo + CSV', blurb: 'Snowflake + Pendo NPS pulled via the Pendo API in a Python cell (no connector) + a CSV mapping.',
  sources: 'Snowflake · Pendo API · CSV',
  prompt: "We have no Pendo connector, so pull NPS from the Pendo API in a Python cell, add my CSM CSV, join both to the Snowflake account data, and build the full health scorecard.",
  searchHits: CDW_HITS,
  planSteps: ['Aggregate account signals from Snowflake', 'Pull NPS from the Pendo API in Python', 'Load the CSM CSV', 'Compute the composite health score', 'Visualize + reactive at-risk filter'],
  cells: [
    accountBaseCell(),
    {
      type: 'python', name: 'pendo_nps', planIndex: 1,
      narration: "There's no Pendo connector, so I'll pull NPS straight from the Pendo REST API here in Python and shape it into a dataframe.",
      code: `import pandas as pd, numpy as np

# No connector — fetched from the Pendo REST API inside the notebook.
ids = account_base['account_id'].tolist()
rng = np.random.default_rng(7)
scores = rng.integers(0, 11, size=len(ids))
noise = rng.normal(0, 0.1, size=len(ids))

pendo_nps = pd.DataFrame({'account_id': ids, 'nps_score': scores})
pendo_nps['sentiment_score'] = np.clip((scores / 10) * 2 - 1 + noise, -1, 1).round(2)
pendo_nps['sentiment'] = pendo_nps['sentiment_score'].apply(
    lambda s: 'positive' if s > 0.2 else ('negative' if s < -0.2 else 'neutral'))
pendo_nps`,
    },
    {
      type: 'csv', name: 'csm_mapping', planIndex: 2, fileName: 'CSM_MAPPING_Q2.csv',
      narration: 'And the CSM mapping as a CSV — parsed into DuckDB and joined on account_id.',
    },
    {
      type: 'python', name: 'customer_health', planIndex: 3,
      narration: 'Merging all three sources and computing the composite score — NPS 30%, support 20%, call sentiment 25%, defects 25%.',
      code: `import pandas as pd

df = (account_base
      .merge(pendo_nps, on='account_id', how='left')
      .merge(csm_mapping, on='account_id', how='left'))
df['nps_norm']     = (df['nps_score'].fillna(5) / 10).clip(0, 1)
df['support_norm'] = (1 - df['p1_cases_open'].fillna(0) / 3).clip(0, 1)
df['call_norm']    = df['avg_call_sentiment'].fillna(0.5).clip(0, 1)
df['defect_norm']  = (1 - df['open_defects'].fillna(0) / 3).clip(0, 1)
df['customer_health_score'] = (
    0.30*df['nps_norm'] + 0.20*df['support_norm'] + 0.25*df['call_norm'] + 0.25*df['defect_norm']
).round(2)

customer_health = df[['account_id','account_name','region','account_tier','arr','csm_name',
                      'nps_score','avg_call_sentiment','p1_cases_open','open_defects',
                      'customer_health_score']].sort_values('customer_health_score')
customer_health`,
    },
    { type: 'chart', name: 'health_by_region', planIndex: 4, narration: 'Average health by region.', sourceVar: 'customer_health', chartType: 'bar', x: 'region', y: 'customer_health_score', agg: 'avg' },
    { type: 'single-value', name: 'avg_health', planIndex: 4, narration: 'Headline number.', sourceVar: 'customer_health', column: 'customer_health_score', agg: 'avg', format: 'percent', caption: 'Average customer health' },
    { type: 'input', name: 'min_health', planIndex: 4, narration: 'A threshold slider.', inputKind: 'slider', label: 'At-risk below', value: 0.6, min: 0, max: 1, step: 0.05 },
    { type: 'python', name: 'at_risk', planIndex: 4, narration: 'Reactive at-risk list — drag the slider.', code: `at_risk = customer_health[customer_health['customer_health_score'] < min_health]
at_risk[['account_id','account_name','customer_health_score','csm_name','region','arr']]` },
    { type: 'markdown', name: 'summary', planIndex: 4, narration: 'Documenting it.', markdown: `## Customer Health Scorecard (CDW + Pendo + CSV)

- **Snowflake** — support, calls, defects
- **Pendo API** — NPS pulled in Python (no connector)
- **CSM CSV** — joined on \`account_id\`

Composite = NPS 30% + support 20% + call sentiment 25% + defects 25%. Drag the slider for a reactive at-risk list.` },
  ],
  followups: followupsFor('customer_health', 'customer_health_score', 'at_risk'),
};

export const SCENARIOS: Scenario[] = [S1, S2, S3, S4];
export const getScenario = (id: ScenarioId): Scenario => SCENARIOS.find(s => s.id === id) ?? S1;
