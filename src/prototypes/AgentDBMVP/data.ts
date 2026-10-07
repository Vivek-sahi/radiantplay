import { IdentityKind, Person, QueryRecord, ServiceAccount, StoreTable } from './types';

export const ORG_NAME = 'Acme Retail';
export const ENDPOINT_HOST = 'acme-retail.agentdb.thoughtspot.cloud';
export const SQL_PORT = '9030';
export const LOAD_PORT = '8030';
/** One database per AgentDB (7 Oct): every table lives here. */
export const DATABASE = 'acme_retail';
export const MCP_URL = `https://${ENDPOINT_HOST}/mcp`;

export const PLAN = { name: 'Standard', includedGB: 500 };

const cols = (spec: string): { name: string; type: string }[] =>
  spec.split(',').map((s) => {
    const [name, type] = s.trim().split(':');
    return { name, type };
  });

/** V1 sample: every table was written by a pipeline through a service account. */
export const TABLES: StoreTable[] = [
  {
    id: 't5', name: 'app_events',
    writer: { kind: 'pipeline', label: 'Airflow', detail: 'airflow-events' },
    rows: 6_210_000_000, sizeGB: 214.3, lastUpdated: '4 min ago', queries24h: 12_400, splitBy: 'event_time',
    columns: cols('event_id:Whole number,user_id:Whole number,event_name:Text,event_time:Date and time,device:Text,properties:Long text'),
  },
  {
    id: 't11', name: 'orders',
    writer: { kind: 'pipeline', label: 'Airbyte', detail: 'airbyte-shopify' },
    rows: 412_800_000, sizeGB: 28.1, lastUpdated: 'Today, 02:00', queries24h: 9_600,
    columns: cols('order_id:Whole number,customer_id:Whole number,product_id:Whole number,order_date:Date,region:Text,amount:Decimal,channel:Text'),
  },
  {
    id: 't13', name: 'tickets',
    writer: { kind: 'pipeline', label: 'Fivetran', detail: 'fivetran-prod' },
    rows: 188_300_000, sizeGB: 30.7, lastUpdated: 'Today, 06:00', queries24h: 4_400,
    columns: cols('ticket_id:Whole number,customer_id:Whole number,opened_at:Date and time,priority:Text,status:Text,resolution_hours:Decimal'),
  },
  {
    id: 't6', name: 'charges',
    writer: { kind: 'pipeline', label: 'Fivetran', detail: 'fivetran-prod' },
    rows: 58_900_000, sizeGB: 12.6, lastUpdated: 'Yesterday, 09:14', queries24h: 3_100,
    columns: cols('charge_id:Text,customer_id:Text,amount:Decimal,currency:Text,created_at:Date and time,status:Text'),
  },
  {
    id: 't7', name: 'opportunity',
    writer: { kind: 'pipeline', label: 'Fivetran', detail: 'fivetran-prod' },
    rows: 2_100_000, sizeGB: 4.8, lastUpdated: '22 min ago', queries24h: 8_900,
    columns: cols('id:Text,account_id:Text,stage:Text,amount:Decimal,close_date:Date,owner:Text'),
  },
  {
    id: 't12', name: 'customers',
    writer: { kind: 'pipeline', label: 'Airbyte', detail: 'airbyte-shopify' },
    rows: 9_400_000, sizeGB: 3.2, lastUpdated: 'Today, 02:00', queries24h: 2_700,
    columns: cols('customer_id:Whole number,name:Text,city:Text,segment:Text,signup_date:Date'),
  },
  {
    id: 't8', name: 'account',
    writer: { kind: 'pipeline', label: 'Fivetran', detail: 'fivetran-prod' },
    rows: 640_000, sizeGB: 1.9, lastUpdated: '22 min ago', queries24h: 6_200,
    columns: cols('id:Text,name:Text,industry:Text,employees:Whole number,country:Text'),
  },
  {
    id: 't14', name: 'dim_customers',
    writer: { kind: 'pipeline', label: 'dbt Cloud', detail: 'dbt-cloud' },
    rows: 9_400_000, sizeGB: 1.1, lastUpdated: 'Today, 05:30', queries24h: 1_900,
    columns: cols('customer_id:Whole number,segment:Text,first_order_date:Date,lifetime_value:Decimal,is_active:True or false'),
  },
  {
    id: 't9', name: 'fct_revenue_daily',
    writer: { kind: 'pipeline', label: 'dbt Cloud', detail: 'dbt-cloud' },
    rows: 1_300_000, sizeGB: 0.9, lastUpdated: 'Today, 05:30', queries24h: 14_800, splitBy: 'day',
    columns: cols('day:Date,region:Text,channel:Text,revenue:Decimal,orders:Whole number'),
  },
];

/** `thoughtspot` is an ordinary read account an admin created: AgentDB treats it like any other. */
export const SERVICE_ACCOUNTS: ServiceAccount[] = [
  { id: 's1', name: 'thoughtspot', kind: 'app', permission: 'Read', rateLimit: null, lastUsed: 'Just now', createdBy: 'Priya Nair', passwordSetAt: '12 Sep' },
  { id: 's3', name: 'fivetran-prod', kind: 'pipeline', permission: 'Write', rateLimit: null, lastUsed: '22 min ago', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
  { id: 's4', name: 'airflow-events', kind: 'pipeline', permission: 'Write', rateLimit: null, lastUsed: '4 min ago', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
  { id: 's9', name: 'airbyte-shopify', kind: 'pipeline', permission: 'Write', rateLimit: null, lastUsed: 'Today, 02:00', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
  { id: 's5', name: 'dbt-cloud', kind: 'pipeline', permission: 'Read & write', rateLimit: null, lastUsed: 'Today, 05:30', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
  { id: 's6', name: 'support-copilot', kind: 'agent', permission: 'Read', rateLimit: 20, lastUsed: '1 min ago', createdBy: 'Priya Nair', passwordSetAt: '12 Sep' },
  { id: 's7', name: 'churn-analyst', kind: 'agent', permission: 'Read', rateLimit: 10, lastUsed: '3 min ago', createdBy: 'Sara Lee', passwordSetAt: '12 Sep' },
  { id: 's8', name: 'seller-portal', kind: 'app', permission: 'Read', rateLimit: 200, lastUsed: 'Just now', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
];

export const PEOPLE: Person[] = [
  { id: 'p1', name: 'Priya Nair', email: 'priya.nair@acmeretail.com', role: 'Admin', lastActive: 'Now' },
  { id: 'p2', name: 'Arjun Mehta', email: 'arjun.mehta@acmeretail.com', role: 'Editor', lastActive: 'Today' },
  { id: 'p3', name: 'Sara Lee', email: 'sara.lee@acmeretail.com', role: 'Viewer', lastActive: 'Yesterday' },
];

/** Recent queries, newest first. The database only sees SQL and the account that sent it. */
export const QUERIES: QueryRecord[] = [
  { id: 'q8', time: '10:43:02', who: 'churn-analyst', kind: 'agent', summary: 'SELECT user_id, COUNT(*) FROM app_events WHERE event_time >= … GROUP BY user_id', tables: ['app_events'], durationMs: 0, status: 'In progress' },
  { id: 'q7', time: '10:42:40', who: 'dbt-cloud', kind: 'pipeline', summary: 'INSERT OVERWRITE TABLE fct_revenue_daily SELECT day, region, channel, SUM(amount) … FROM orders', tables: ['fct_revenue_daily', 'orders'], durationMs: 0, status: 'In progress' },
  { id: 'q1', time: '10:42:18', who: 'support-copilot', kind: 'agent', summary: 'SELECT ticket_id, priority, status FROM tickets WHERE opened_at >= … AND customer_id = 88412', tables: ['tickets'], durationMs: 180, status: 'Completed' },
  { id: 'q2', time: '10:42:11', who: 'thoughtspot', kind: 'app', summary: 'SELECT region, SUM(amount) FROM orders WHERE order_date >= … GROUP BY region', tables: ['orders'], durationMs: 240, status: 'Completed' },
  { id: 'q3', time: '10:41:57', who: 'churn-analyst', kind: 'agent', summary: 'SELECT c.segment, COUNT(*) FROM customers c JOIN orders o ON … GROUP BY c.segment', tables: ['customers', 'orders'], durationMs: 920, status: 'Completed' },
  { id: 'q4', time: '10:41:49', who: 'churn-analyst', kind: 'agent', summary: 'SELECT c.segment, COUNT(*) FROM customers c JOIN orders o ON … GROUP BY c.segment', tables: ['customers', 'orders'], durationMs: 2, status: 'Failed', note: 'Refused at the rate limit (10 queries a second)' },
  { id: 'q5', time: '10:41:30', who: 'seller-portal', kind: 'app', summary: 'SELECT * FROM orders WHERE seller_id = 20931 AND order_date >= …', tables: ['orders'], durationMs: 12, status: 'Completed' },
  { id: 'q6', time: '10:40:02', who: 'Sara Lee', kind: 'person', summary: 'SELECT stage, SUM(amount) FROM opportunity GROUP BY stage', tables: ['opportunity'], durationMs: 310, status: 'Completed' },
  { id: 'q9', time: '10:35:51', who: 'support-copilot', kind: 'agent', summary: 'SELECT … FROM tickets t JOIN charges c ON t.customer_id = c.customer_id', tables: ['tickets', 'charges'], durationMs: 60, status: 'Failed', note: 'No permission to read charges' },
  { id: 'q10', time: '10:31:26', who: 'thoughtspot', kind: 'app', summary: 'SELECT priority, COUNT(*) FROM tickets WHERE opened_at >= … GROUP BY priority', tables: ['tickets'], durationMs: 160, status: 'Completed' },
  { id: 'q11', time: '10:29:40', who: 'seller-portal', kind: 'app', summary: 'SELECT name, industry, country FROM account WHERE id = …', tables: ['account'], durationMs: 9, status: 'Completed' },
];

/** Last 24 hours (sample). In progress is whatever is running right now. */
export const QUERY_STATS = {
  total24h: '48.5K',
  completed24h: '48.2K',
  failed24h: '358',
  inProgress: QUERIES.filter((q) => q.status === 'In progress').length,
};

export const KIND_LABEL: Record<IdentityKind, string> = {
  pipeline: 'Pipeline',
  agent: 'Agent',
  app: 'App',
  person: 'Person',
};

export const formatRows = (n: number): string => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

export const formatGB = (gb: number): string => (gb >= 100 ? `${gb.toFixed(0)} GB` : `${gb.toFixed(1)} GB`);

export const formatMs = (ms: number): string => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);
