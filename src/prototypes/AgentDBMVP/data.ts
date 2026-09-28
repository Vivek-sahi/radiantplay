import { Person, QueryRecord, ServiceAccount, StoreTable, WriterKind, IdentityKind } from './types';

export const ORG_NAME = 'Acme Retail';
export const ENDPOINT_HOST = 'acme-retail.agentdb.thoughtspot.cloud';
export const SQL_PORT = '9030';
export const LOAD_PORT = '8030';
export const MCP_URL = `https://${ENDPOINT_HOST}/mcp`;

export const PLAN = { name: 'Standard', includedGB: 500 };

const cols = (spec: string): { name: string; type: string; isKey?: boolean }[] =>
  spec.split(',').map((s) => {
    const [name, type] = s.trim().split(':');
    return { name: name.replace('*', ''), type, isKey: name.endsWith('*') };
  });

export const TABLES: StoreTable[] = [
  {
    id: 't1', database: 'retail_sales', name: 'orders',
    writer: { kind: 'pulse', label: 'Pulse', detail: 'Retail Sales' },
    rows: 412_800_000, sizeGB: 28.1, lastArrived: 'Today, 02:00', nextRefresh: 'Tomorrow, 02:00',
    columns: cols('order_id*:Whole number,customer_id:Whole number,product_id:Whole number,order_date:Date,region:Text,amount:Decimal,channel:Text'),
  },
  {
    id: 't2', database: 'retail_sales', name: 'customers',
    writer: { kind: 'pulse', label: 'Pulse', detail: 'Retail Sales' },
    rows: 9_400_000, sizeGB: 3.2, lastArrived: 'Today, 02:00', nextRefresh: 'Tomorrow, 02:00',
    columns: cols('customer_id*:Whole number,name:Text,city:Text,segment:Text,signup_date:Date'),
  },
  {
    id: 't3', database: 'retail_sales', name: 'products',
    writer: { kind: 'pulse', label: 'Pulse', detail: 'Retail Sales' },
    rows: 64_000, sizeGB: 0.4, lastArrived: 'Today, 02:00', nextRefresh: 'Tomorrow, 02:00',
    columns: cols('product_id*:Whole number,name:Text,category:Text,brand:Text,list_price:Decimal'),
  },
  {
    id: 't4', database: 'support_ops', name: 'tickets',
    writer: { kind: 'pulse', label: 'Pulse', detail: 'Support Ops' },
    rows: 188_300_000, sizeGB: 30.7, lastArrived: 'Today, 06:00', nextRefresh: 'Today, 12:00',
    columns: cols('ticket_id*:Whole number,customer_id:Whole number,opened_at:Date and time,priority:Text,status:Text,resolution_hours:Decimal'),
  },
  {
    id: 't5', database: 'events', name: 'app_events',
    writer: { kind: 'pipeline', label: 'Airflow', detail: 'airflow-events' },
    rows: 6_210_000_000, sizeGB: 214.3, lastArrived: '4 min ago', loading: true, splitBy: 'event_time',
    columns: cols('event_id:Whole number,user_id:Whole number,event_name:Text,event_time:Date and time,device:Text,properties:Long text'),
  },
  {
    id: 't6', database: 'stripe', name: 'charges',
    writer: { kind: 'pipeline', label: 'Fivetran', detail: 'fivetran-prod' },
    rows: 58_900_000, sizeGB: 12.6, lastArrived: 'Yesterday, 09:14',
    late: { usual: 'every hour', since: '26 hours' },
    columns: cols('charge_id*:Text,customer_id:Text,amount:Decimal,currency:Text,created_at:Date and time,status:Text'),
  },
  {
    id: 't7', database: 'salesforce', name: 'opportunity',
    writer: { kind: 'pipeline', label: 'Fivetran', detail: 'fivetran-prod' },
    rows: 2_100_000, sizeGB: 4.8, lastArrived: '22 min ago',
    columns: cols('id*:Text,account_id:Text,stage:Text,amount:Decimal,close_date:Date,owner:Text'),
  },
  {
    id: 't8', database: 'salesforce', name: 'account',
    writer: { kind: 'pipeline', label: 'Fivetran', detail: 'fivetran-prod' },
    rows: 640_000, sizeGB: 1.9, lastArrived: '22 min ago',
    columns: cols('id*:Text,name:Text,industry:Text,employees:Whole number,country:Text'),
  },
  {
    id: 't9', database: 'analytics', name: 'fct_revenue_daily',
    writer: { kind: 'pipeline', label: 'dbt Cloud', detail: 'dbt-cloud' },
    rows: 1_300_000, sizeGB: 0.9, lastArrived: 'Today, 05:30', splitBy: 'day',
    columns: cols('day*:Date,region*:Text,channel*:Text,revenue:Decimal,orders:Whole number'),
  },
  {
    id: 't10', database: 'uploads', name: 'store_targets_2026',
    writer: { kind: 'upload', label: 'File upload', detail: 'Priya Nair' },
    rows: 4_800, sizeGB: 0.2, lastArrived: '12 Sep',
    columns: cols('store_id:Whole number,month:Date,target_revenue:Decimal'),
  },
];

/** Set once, when the table was created (Doris's table type can't be changed later). */
export const rowBehaviour = (t: StoreTable): string => {
  const keys = t.columns.filter((c) => c.isKey).map((c) => c.name);
  return keys.length ? `Replaced when ${keys.join(' + ')} matches` : 'Only added, every row kept';
};

export const storageByWriter = (tables: StoreTable[]): Record<WriterKind, number> =>
  tables.reduce(
    (acc, t) => ({ ...acc, [t.writer.kind]: acc[t.writer.kind] + t.sizeGB }),
    { pulse: 0, pipeline: 0, upload: 0 } as Record<WriterKind, number>,
  );

export const SERVICE_ACCOUNTS: ServiceAccount[] = [
  { id: 's1', name: 'thoughtspot', kind: 'system', permission: 'Read', budget: null, spent: 684, rateLimit: null, lastUsed: 'Just now', managed: true, createdBy: 'ThoughtSpot', passwordSetAt: '12 Sep' },
  { id: 's2', name: 'pulse', kind: 'system', permission: 'Write', budget: null, spent: 96, rateLimit: null, lastUsed: 'Today, 06:00', managed: true, createdBy: 'ThoughtSpot', passwordSetAt: '12 Sep' },
  { id: 's3', name: 'fivetran-prod', kind: 'pipeline', permission: 'Write', budget: null, spent: 118, rateLimit: null, lastUsed: '22 min ago', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
  { id: 's4', name: 'airflow-events', kind: 'pipeline', permission: 'Write', budget: null, spent: 241, rateLimit: null, lastUsed: '4 min ago', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
  { id: 's5', name: 'dbt-cloud', kind: 'pipeline', permission: 'Read & write', budget: 200, spent: 74, rateLimit: null, lastUsed: 'Today, 05:30', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
  { id: 's6', name: 'support-copilot', kind: 'agent', permission: 'Read', budget: 300, spent: 212, rateLimit: 20, lastUsed: '1 min ago', createdBy: 'Priya Nair', passwordSetAt: '12 Sep' },
  { id: 's7', name: 'churn-analyst', kind: 'agent', permission: 'Read', budget: 150, spent: 147, rateLimit: 10, lastUsed: '3 min ago', createdBy: 'Sara Lee', passwordSetAt: '12 Sep' },
  { id: 's8', name: 'seller-portal', kind: 'app', permission: 'Read', budget: 400, spent: 106, rateLimit: 200, lastUsed: 'Just now', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
];

export const PEOPLE: Person[] = [
  { id: 'p1', name: 'Priya Nair', email: 'priya.nair@acmeretail.com', role: 'Admin', lastActive: 'Now' },
  { id: 'p2', name: 'Arjun Mehta', email: 'arjun.mehta@acmeretail.com', role: 'Editor', lastActive: 'Today' },
  { id: 'p3', name: 'Sara Lee', email: 'sara.lee@acmeretail.com', role: 'Viewer', lastActive: 'Yesterday' },
];

export const QUERIES: QueryRecord[] = [
  { id: 'q1', time: '10:42:18', who: 'support-copilot', kind: 'agent', summary: 'Tickets similar to #88412 in the last 30 days', durationMs: 180, scanned: '410 MB', cost: 0.01, status: 'Success' },
  { id: 'q2', time: '10:42:11', who: 'thoughtspot', kind: 'system', summary: 'Revenue by region, last 12 months (Liveboard: Weekly sales)', durationMs: 240, scanned: '1.2 GB', cost: 0.02, status: 'Success' },
  { id: 'q3', time: '10:41:57', who: 'churn-analyst', kind: 'agent', summary: 'Customers with falling order count, by segment', durationMs: 920, scanned: '6.8 GB', cost: 0.11, status: 'Success' },
  { id: 'q4', time: '10:41:49', who: 'churn-analyst', kind: 'agent', summary: 'Same query, repeated 40 times in 2 minutes', durationMs: 910, scanned: '6.8 GB', cost: 4.4, status: 'Stopped', note: 'Stopped at the rate limit (10 queries a second)' },
  { id: 'q5', time: '10:41:30', who: 'seller-portal', kind: 'app', summary: 'Orders for seller 20931, this week', durationMs: 12, scanned: '2 MB', cost: 0.0, status: 'Success' },
  { id: 'q6', time: '10:40:02', who: 'Sara Lee', kind: 'person', summary: 'SQL editor: SELECT stage, SUM(amount) FROM salesforce.opportunity …', durationMs: 310, scanned: '220 MB', cost: 0.0, status: 'Success' },
  { id: 'q7', time: '10:38:44', who: 'thoughtspot', kind: 'system', summary: 'Spotter: why did repeat orders drop in Pune? (6 queries)', durationMs: 1480, scanned: '3.1 GB', cost: 0.05, status: 'Success' },
  { id: 'q8', time: '10:37:09', who: 'dbt-cloud', kind: 'pipeline', summary: 'Rebuild analytics.fct_revenue_daily', durationMs: 48200, scanned: '28.1 GB', cost: 0.46, status: 'Success' },
  { id: 'q9', time: '10:35:51', who: 'support-copilot', kind: 'agent', summary: 'Join tickets to stripe.charges on customer_id', durationMs: 60, scanned: '0 B', cost: 0.0, status: 'Error', note: 'No permission to read stripe.charges' },
  { id: 'q10', time: '10:31:26', who: 'thoughtspot', kind: 'system', summary: 'Search: tickets by priority, this month', durationMs: 160, scanned: '640 MB', cost: 0.01, status: 'Success' },
];

export const KIND_LABEL: Record<IdentityKind, string> = {
  system: 'ThoughtSpot',
  pipeline: 'Pipeline',
  agent: 'Agent',
  app: 'App',
  person: 'Person',
};

/** Month-to-date spend split. Compute = sum of service-account spend + people. */
export const SPEND = {
  storage: 298,
  compute: SERVICE_ACCOUNTS.reduce((s, a) => s + a.spent, 0) + 22,
  lastMonth: 1640,
  /** Estimated warehouse spend avoided by serving Pulse models from AgentDB (estimate). */
  warehouseAvoided: 6420,
};

export const formatRows = (n: number): string => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

export const formatGB = (gb: number): string => (gb >= 100 ? `${gb.toFixed(0)} GB` : `${gb.toFixed(1)} GB`);

export const formatUSD = (n: number): string =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: n < 10 && n % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`;

export const formatMs = (ms: number): string => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);
