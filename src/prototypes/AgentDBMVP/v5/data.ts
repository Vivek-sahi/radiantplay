import { Person, QueryRecord } from '../types';
import { ENDPOINT_HOST, LOAD_PORT, ORG_NAME, PEOPLE, PLAN, QUERIES, SQL_PORT } from '../data';
import { PLAIN_TYPES, PlainType, buildCreateSql } from '../tableSchema';
import { AppState, Column, Database, DbObject, Identity, LoadRecord, ObjectKind, SqlQuery, SqlWorkspace } from './types';

export { ENDPOINT_HOST, LOAD_PORT, ORG_NAME, PLAN, SQL_PORT };

export const DORIS_STREAM_LOAD_DOCS = 'https://doris.apache.org/docs/data-operate/import/import-way/stream-load-manual';

export const loadUrl = (database: string, table: string): string =>
  `http://${ENDPOINT_HOST}:${LOAD_PORT}/api/${database}/${table}/_stream_load`;

/** Dmitrii's sample (9 Oct), filled in for one table and one Ingest identity. */
export const curlFor = (identity: string, database: string, table: string): string =>
  [
    `curl -u ${identity}:<password> \\`,
    `  -H "label: ${table}-2026-10-14-01" \\`,
    `  -H "format: csv" \\`,
    `  -H "column_separator: ," \\`,
    `  -H "skip_lines: 1" \\`,
    `  -H "compress_type: GZ" \\`,
    `  -H "timeout: 600" \\`,
    `  -H "Expect: 100-continue" \\`,
    `  -T ${table}.csv.gz \\`,
    `  "${loadUrl(database, table)}"`,
  ].join('\n');

/** The header set, explained in plain words. Shown next to the command. */
export const LOAD_HEADERS: { name: string; means: string }[] = [
  { name: 'label', means: 'A name for this load. A retry with the same label is not loaded twice.' },
  { name: 'format', means: 'csv, json or parquet.' },
  { name: 'column_separator', means: 'The character between columns in a csv.' },
  { name: 'skip_lines', means: 'Lines to ignore at the top, usually the header row.' },
  { name: 'compress_type', means: 'GZ if the file is zipped.' },
  { name: 'timeout', means: 'Seconds to wait before giving up.' },
];

export const KIND_LABEL: Record<ObjectKind, string> = {
  table: 'Table',
  view: 'View',
  'materialized view': 'Materialised view',
};

const cols = (spec: string): Column[] =>
  spec.split(',').map((s) => {
    const [name, type] = s.trim().split(':');
    return { name, type };
  });

const FILLED_DATABASES: Database[] = [
  { id: 'acme_retail', name: 'acme_retail', createdBy: 'Priya Nair', createdOn: '2 Sep 2026' },
  { id: 'acme_marketing', name: 'acme_marketing', createdBy: 'Arjun Mehta', createdOn: '18 Sep 2026' },
];

const FILLED_OBJECTS: DbObject[] = [
  {
    id: 'o_app_events', database: 'acme_retail', name: 'app_events', kind: 'table',
    rows: 6_210_000_000, sizeGB: 214.3, lastUpdated: '4 min ago', createdBy: 'Arjun Mehta', createdOn: '3 Sep 2026',
    columns: cols('event_id:Whole number,user_id:Whole number,event_name:Text,event_time:Date and time,device:Text,properties:Long text'),
  },
  {
    id: 'o_orders', database: 'acme_retail', name: 'orders', kind: 'table',
    rows: 412_800_000, sizeGB: 28.1, lastUpdated: 'Today, 02:04', createdBy: 'Arjun Mehta', createdOn: '2 Sep 2026',
    columns: cols('order_id:Whole number,customer_id:Whole number,product_id:Whole number,order_date:Date,region:Text,amount:Decimal,channel:Text'),
  },
  {
    id: 'o_tickets', database: 'acme_retail', name: 'tickets', kind: 'table',
    rows: 188_300_000, sizeGB: 30.7, lastUpdated: 'Today, 06:00', createdBy: 'Arjun Mehta', createdOn: '2 Sep 2026',
    columns: cols('ticket_id:Whole number,customer_id:Whole number,opened_at:Date and time,priority:Text,status:Text,resolution_hours:Decimal'),
  },
  {
    id: 'o_charges', database: 'acme_retail', name: 'charges', kind: 'table',
    rows: 58_900_000, sizeGB: 12.6, lastUpdated: 'Yesterday, 09:14', createdBy: 'Arjun Mehta', createdOn: '2 Sep 2026',
    columns: cols('charge_id:Text,customer_id:Text,amount:Decimal,currency:Text,created_at:Date and time,status:Text'),
  },
  {
    id: 'o_opportunity', database: 'acme_retail', name: 'opportunity', kind: 'table',
    rows: 2_100_000, sizeGB: 4.8, lastUpdated: 'Today, 06:00', createdBy: 'Arjun Mehta', createdOn: '5 Sep 2026',
    columns: cols('id:Text,account_id:Text,stage:Text,amount:Decimal,close_date:Date,owner:Text'),
  },
  {
    id: 'o_customers', database: 'acme_retail', name: 'customers', kind: 'table',
    rows: 9_400_000, sizeGB: 3.2, lastUpdated: 'Today, 02:00', createdBy: 'Arjun Mehta', createdOn: '2 Sep 2026',
    columns: cols('customer_id:Whole number,name:Text,city:Text,segment:Text,signup_date:Date'),
  },
  {
    id: 'o_account', database: 'acme_retail', name: 'account', kind: 'table',
    rows: 640_000, sizeGB: 1.9, lastUpdated: 'Today, 06:00', createdBy: 'Arjun Mehta', createdOn: '5 Sep 2026',
    columns: cols('id:Text,name:Text,industry:Text,employees:Whole number,country:Text'),
  },
  {
    id: 'o_open_tickets', database: 'acme_retail', name: 'open_tickets', kind: 'view',
    rows: 0, sizeGB: 0, lastUpdated: '—', createdBy: 'Arjun Mehta', createdOn: '21 Sep 2026',
    columns: cols('ticket_id:Whole number,customer_id:Whole number,opened_at:Date and time,priority:Text'),
    definition: "SELECT ticket_id, customer_id, opened_at, priority\nFROM tickets\nWHERE status <> 'closed'",
  },
  {
    id: 'o_revenue_by_day', database: 'acme_retail', name: 'revenue_by_day', kind: 'materialized view',
    rows: 1_300_000, sizeGB: 0.9, lastUpdated: 'Today, 10:00', createdBy: 'Arjun Mehta', createdOn: '24 Sep 2026',
    columns: cols('day:Date,region:Text,channel:Text,revenue:Decimal,orders:Whole number'),
    definition: 'SELECT order_date AS day, region, channel, SUM(amount) AS revenue, COUNT(*) AS orders\nFROM orders\nGROUP BY order_date, region, channel',
    refresh: 'Every hour',
  },
  {
    id: 'o_web_sessions', database: 'acme_marketing', name: 'web_sessions', kind: 'table',
    rows: 1_840_000_000, sizeGB: 96.2, lastUpdated: 'Today, 03:00', createdBy: 'Arjun Mehta', createdOn: '18 Sep 2026',
    columns: cols('session_id:Text,user_id:Whole number,started_at:Date and time,source:Text,pages:Whole number,converted:True or false'),
  },
  {
    id: 'o_dim_customers', database: 'acme_marketing', name: 'dim_customers', kind: 'table',
    rows: 9_400_000, sizeGB: 1.1, lastUpdated: 'Today, 05:30', createdBy: 'Arjun Mehta', createdOn: '18 Sep 2026',
    columns: cols('customer_id:Whole number,segment:Text,first_order_date:Date,lifetime_value:Decimal,is_active:True or false'),
  },
  {
    id: 'o_campaigns', database: 'acme_marketing', name: 'campaigns', kind: 'table',
    rows: 12_400, sizeGB: 0.1, lastUpdated: 'Yesterday, 18:20', createdBy: 'Arjun Mehta', createdOn: '19 Sep 2026',
    columns: cols('campaign_id:Text,name:Text,channel:Text,start_date:Date,end_date:Date,budget:Decimal'),
  },
];

/** Newest first. Two failures, both of the ordinary kind. */
const FILLED_LOADS: LoadRecord[] = [
  { id: 'l1', time: 'Today, 10:39', identity: 'airflow-events', database: 'acme_retail', table: 'app_events', label: 'app_events-20261014-1030', rows: 2_410_000, bytes: '1.1 GB', durationMs: 42_000, status: 'Completed' },
  { id: 'l2', time: 'Today, 10:09', identity: 'airflow-events', database: 'acme_retail', table: 'app_events', label: 'app_events-20261014-1000', rows: 2_330_000, bytes: '1.0 GB', durationMs: 40_000, status: 'Completed' },
  { id: 'l3', time: 'Today, 06:00', identity: 'crm-sync', database: 'acme_retail', table: 'tickets', label: 'tickets-20261014', rows: 188_300_000, bytes: '30.7 GB', durationMs: 372_000, status: 'Completed' },
  { id: 'l4', time: 'Today, 06:00', identity: 'crm-sync', database: 'acme_retail', table: 'opportunity', label: 'opportunity-20261014', rows: 2_100_000, bytes: '4.8 GB', durationMs: 58_000, status: 'Completed' },
  { id: 'l5', time: 'Today, 06:00', identity: 'crm-sync', database: 'acme_retail', table: 'account', label: 'account-20261014', rows: 640_000, bytes: '1.9 GB', durationMs: 31_000, status: 'Completed' },
  { id: 'l6', time: 'Today, 05:30', identity: 'dbt-cloud', database: 'acme_marketing', table: 'dim_customers', label: 'dim_customers-20261014', rows: 9_400_000, bytes: '1.1 GB', durationMs: 125_000, status: 'Completed' },
  { id: 'l7', time: 'Today, 03:00', identity: 'web-sync', database: 'acme_marketing', table: 'web_sessions', label: 'web_sessions-20261014', rows: 1_840_000_000, bytes: '96.2 GB', durationMs: 1_450_000, status: 'Completed' },
  { id: 'l8', time: 'Today, 02:04', identity: 'shopify-sync', database: 'acme_retail', table: 'orders', label: 'orders-20261014-b', rows: 412_800_000, bytes: '28.1 GB', durationMs: 54_000, status: 'Completed' },
  { id: 'l9', time: 'Today, 02:00', identity: 'shopify-sync', database: 'acme_retail', table: 'orders', label: 'orders-20261014-a', rows: 0, bytes: '18.0 GB', durationMs: 600_000, status: 'Failed', error: 'Timed out after 600 s. 18.0 GB of a 28.1 GB file received. Nothing was written.' },
  { id: 'l10', time: 'Today, 02:00', identity: 'shopify-sync', database: 'acme_retail', table: 'customers', label: 'customers-20261014', rows: 9_400_000, bytes: '3.2 GB', durationMs: 40_000, status: 'Completed' },
  { id: 'l11', time: 'Yesterday, 09:14', identity: 'crm-sync', database: 'acme_retail', table: 'charges', label: 'charges-20261013', rows: 58_900_000, bytes: '12.6 GB', durationMs: 160_000, status: 'Completed' },
  { id: 'l12', time: 'Yesterday, 06:00', identity: 'crm-sync', database: 'acme_retail', table: 'tickets', label: 'tickets-20261013', rows: 0, bytes: '30.6 GB', durationMs: 310_000, status: 'Failed', error: "Row 1,204: value 'n/a' does not fit resolution_hours (Decimal). Nothing was written." },
  { id: 'l13', time: 'Yesterday, 02:00', identity: 'shopify-sync', database: 'acme_retail', table: 'orders', label: 'orders-20261013', rows: 411_900_000, bytes: '28.0 GB', durationMs: 53_000, status: 'Completed' },
];

const FILLED_IDENTITIES: Identity[] = [
  { id: 'i1', name: 'thoughtspot', type: 'Query', createdBy: 'Priya Nair', createdOn: '2 Sep 2026', lastUsed: 'Just now' },
  { id: 'i2', name: 'seller-portal', type: 'Query', createdBy: 'Arjun Mehta', createdOn: '9 Sep 2026', lastUsed: 'Just now' },
  { id: 'i3', name: 'support-copilot', type: 'Query', createdBy: 'Priya Nair', createdOn: '12 Sep 2026', lastUsed: '1 min ago' },
  { id: 'i4', name: 'churn-analyst', type: 'Query', createdBy: 'Arjun Mehta', createdOn: '26 Sep 2026', lastUsed: '3 min ago' },
  { id: 'i5', name: 'airflow-events', type: 'Ingest', createdBy: 'Arjun Mehta', createdOn: '3 Sep 2026', lastUsed: '4 min ago' },
  { id: 'i6', name: 'shopify-sync', type: 'Ingest', createdBy: 'Arjun Mehta', createdOn: '2 Sep 2026', lastUsed: 'Today, 02:04' },
  { id: 'i7', name: 'crm-sync', type: 'Ingest', createdBy: 'Arjun Mehta', createdOn: '5 Sep 2026', lastUsed: 'Today, 06:00' },
  { id: 'i8', name: 'dbt-cloud', type: 'Ingest', createdBy: 'Arjun Mehta', createdOn: '18 Sep 2026', lastUsed: 'Today, 05:30' },
  { id: 'i9', name: 'web-sync', type: 'Ingest', createdBy: 'Arjun Mehta', createdOn: '18 Sep 2026', lastUsed: 'Today, 03:00' },
  { id: 'i10', name: 'old-loader', type: 'Ingest', createdBy: 'Arjun Mehta', createdOn: '2 Sep 2026', lastUsed: '12 Sep 2026', revoked: true },
];

export interface Sample {
  databases: Database[];
  objects: DbObject[];
  loads: LoadRecord[];
  identities: Identity[];
  people: Person[];
  queries: QueryRecord[];
  queries24h: string;
}

/** A brand-new customer: one database ThoughtSpot set up, nothing in it, the first Admin only. */
const EMPTY: Sample = {
  databases: [{ id: 'acme_retail', name: 'acme_retail', createdBy: 'ThoughtSpot', createdOn: 'Today' }],
  objects: [],
  loads: [],
  identities: [],
  people: [PEOPLE[0]],
  queries: [],
  queries24h: '0',
};

const FILLED: Sample = {
  databases: FILLED_DATABASES,
  objects: FILLED_OBJECTS,
  loads: FILLED_LOADS,
  identities: FILLED_IDENTITIES,
  people: PEOPLE,
  queries: QUERIES,
  queries24h: '48.5K',
};

export const sampleFor = (state: AppState): Sample => (state === 'filled' ? FILLED : EMPTY);

/** Deterministic sample values, by plain type, so previews and query results look like data. */
export const sampleValue = (type: string, name: string, row: number): string => {
  const n = (row * 7919 + name.length * 31) % 9973;
  if (type === 'Whole number' || type === 'Big whole number') return name.endsWith('_id') ? String(88_410_000 + row) : String(n % 20_000);
  if (type === 'Decimal' || type === 'High-precision decimal') return ((n % 250_000) / 100).toFixed(2);
  if (type === 'Date') return `2026-10-${String(14 - (row % 13)).padStart(2, '0')}`;
  if (type === 'Date and time') return `2026-10-${String(14 - (row % 13)).padStart(2, '0')} ${String(n % 24).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  if (type === 'True or false') return n % 3 ? 'true' : 'false';
  const words: Record<string, string[]> = {
    region: ['West', 'South', 'North', 'East'],
    channel: ['Web', 'Store', 'App'],
    status: ['open', 'closed', 'pending'],
    segment: ['Enterprise', 'Mid-market', 'SMB', 'Consumer'],
    priority: ['High', 'Medium', 'Low'],
    currency: ['usd', 'eur', 'inr'],
    device: ['ios', 'android', 'web'],
    source: ['search', 'email', 'social', 'direct'],
    stage: ['Prospect', 'Qualified', 'Proposal', 'Won'],
    industry: ['Retail', 'Finance', 'Health', 'Media'],
    country: ['US', 'IN', 'UK', 'DE'],
    city: ['Austin', 'Pune', 'Leeds', 'Berlin'],
  };
  const list = words[name];
  return list ? list[row % list.length] : `${name}_${n % 97}`;
};

/** The statement that would recreate the object. Details tab. */
export const createSqlFor = (o: DbObject): string => {
  if (o.kind === 'table') {
    const draft = o.columns.map((c) => ({ name: c.name, type: (PLAIN_TYPES.some((p) => p.id === c.type) ? c.type : 'Text') as PlainType }));
    return buildCreateSql(o.database, o.name, draft);
  }
  if (o.kind === 'view') return `CREATE VIEW ${o.database}.${o.name} AS\n${o.definition ?? ''}`;
  return `CREATE MATERIALIZED VIEW ${o.database}.${o.name}\nREFRESH ${o.refresh === 'Every hour' ? 'EVERY 1 HOUR' : 'ON SCHEDULE'}\nAS\n${o.definition ?? ''}`;
};

export const formatRows = (n: number): string => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

export const formatGB = (gb: number): string => (gb >= 100 ? `${gb.toFixed(0)} GB` : gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(gb * 1000)} MB`);

export const formatMs = (ms: number): string => {
  if (ms >= 60_000) return `${Math.floor(ms / 60_000)} m ${Math.round((ms % 60_000) / 1000)} s`;
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)} s`;
  return `${ms} ms`;
};

/** The sample's "now": the newest record in it is 10:43 today. */
export const NOW_MIN = 10 * 60 + 45;

/** One way to say when (principle 8): Just now · 4 min ago · 3 h ago · Yesterday, 09:14 · 2 Sep. */
export const when = (s: string): string => {
  const today = s.match(/^Today, (\d{2}):(\d{2})$/);
  if (today) {
    const diff = NOW_MIN - (Number(today[1]) * 60 + Number(today[2]));
    if (diff <= 0) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.round(diff / 60)} h ago`;
  }
  const dated = s.match(/^(\d{1,2} [A-Z][a-z]{2}) 2026$/);
  if (dated) return dated[1];
  if (s === 'Today') return 'Just now';
  return s;
};

/** Times in the log stay absolute, because a log is a timeline. "Today, 10:43" reads 10:43; yesterday keeps its day. */
export const logTime = (s: string): string => s.replace(/^Today, /, '');

/**
 * The SQL page's queries (26 Oct). Empty workspace = first visit: one empty query. Filled = a
 * returning engineer: a few tabs left open, and a Recent list of what they ran before.
 */
const q = (id: string, sql: string, updated: string, age: number, extra: Partial<SqlQuery> = {}): SqlQuery => ({ id, sql, updated, age, status: 'ok', ...extra });
const FILLED_QUERIES: SqlQuery[] = [
  q('q_loaded', 'SELECT count(*), max(ts)\nFROM acme_retail.app_events\nWHERE ts >= CURDATE();', 'Today, 09:40', 65, { pinned: true, name: 'Loaded today: app_events' }),
  q('q_tableau', "SELECT region, count(*)\nFROM acme_retail.orders\nWHERE region = 'APAC'\nGROUP BY region;", 'Today, 08:45', 120),
  q('q_clicks', 'CREATE TABLE acme_marketing.clicks (\n  user_id BIGINT,\n  event VARCHAR(64),\n  url STRING,\n  ts DATETIME\n)\nDUPLICATE KEY (user_id)\nDISTRIBUTED BY HASH(user_id) BUCKETS AUTO;', 'Yesterday, 16:10', 1115, { status: 'failed' }),
  q('q_region', 'ALTER TABLE acme_retail.account ADD COLUMN region VARCHAR(32);', 'Yesterday, 11:30', 1395),
  q('q_tickets', 'SELECT *\nFROM acme_retail.tickets\nLIMIT 100;', 'Yesterday, 09:05', 1540),
  q('q_sessions', 'SELECT count(*)\nFROM acme_marketing.web_sessions;', '22 Oct 2026', 5760),
  q('q_orders_ddl', 'SHOW TABLES;', '21 Oct 2026', 7200, { status: undefined }),
];
const FILLED_WORKSPACE: SqlWorkspace = { queries: FILLED_QUERIES, open: ['q_tableau', 'q_clicks', 'q_loaded'], active: 'q_tableau', preview: null };

export const newQuery = (): SqlQuery => ({ id: `q_${Date.now()}_${Math.round(Math.random() * 1e4)}`, sql: '', updated: 'Just now', age: 0 });

export const sqlWorkspaceFor = (state: AppState): SqlWorkspace => {
  if (state === 'filled') return FILLED_WORKSPACE;
  const first = newQuery();
  return { queries: [first], open: [first.id], active: first.id, preview: null };
};

/** A column's type as the database writes it (catalog shows types as text, Vivek 26 Oct). */
export const sqlTypeOf = (plain: string): string => PLAIN_TYPES.find((p) => p.id === plain)?.sql ?? plain.toUpperCase();
