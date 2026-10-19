import { IdentityKind, Person, QueryRecord, Role, ServiceAccount, StoreTable } from './types';

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
  { id: 'q8', time: '10:43:02', who: 'churn-analyst', kind: 'agent', summary: 'SELECT user_id, COUNT(*) FROM app_events WHERE event_time >= … GROUP BY user_id', tables: ['app_events'], durationMs: 0, status: 'In progress', bytesRead: '2.1 GB so far', profile: [{ phase: 'Plan', ms: 40 }, { phase: 'Scan', ms: 9800 }] },
  { id: 'q7', time: '10:42:40', who: 'dbt-cloud', kind: 'pipeline', summary: 'INSERT OVERWRITE TABLE fct_revenue_daily SELECT day, region, channel, SUM(amount) … FROM orders', tables: ['fct_revenue_daily', 'orders'], durationMs: 0, status: 'In progress', bytesRead: '28.1 GB so far', profile: [{ phase: 'Plan', ms: 60 }, { phase: 'Scan', ms: 21000 }, { phase: 'Aggregate', ms: 6400 }] },
  { id: 'q1', time: '10:42:18', who: 'support-copilot', kind: 'agent', summary: 'SELECT ticket_id, priority, status FROM tickets WHERE opened_at >= … AND customer_id = 88412', tables: ['tickets'], durationMs: 180, status: 'Completed', endedAt: '10:42:18', bytesRead: '410 MB', resultRows: 12, profile: [{ phase: 'Plan', ms: 8 }, { phase: 'Scan', ms: 130 }, { phase: 'Filter', ms: 30 }, { phase: 'Return', ms: 12 }] },
  { id: 'q2', time: '10:42:11', who: 'thoughtspot', kind: 'app', summary: 'SELECT region, SUM(amount) FROM orders WHERE order_date >= … GROUP BY region', tables: ['orders'], durationMs: 240, status: 'Completed', endedAt: '10:42:11', bytesRead: '1.2 GB', resultRows: 4, profile: [{ phase: 'Plan', ms: 10 }, { phase: 'Scan', ms: 180 }, { phase: 'Aggregate', ms: 42 }, { phase: 'Return', ms: 8 }] },
  { id: 'q3', time: '10:41:57', who: 'churn-analyst', kind: 'agent', summary: 'SELECT c.segment, COUNT(*) FROM customers c JOIN orders o ON … GROUP BY c.segment', tables: ['customers', 'orders'], durationMs: 920, status: 'Completed', endedAt: '10:41:58', bytesRead: '6.8 GB', resultRows: 5, profile: [{ phase: 'Plan', ms: 14 }, { phase: 'Scan', ms: 610 }, { phase: 'Join', ms: 240 }, { phase: 'Aggregate', ms: 48 }, { phase: 'Return', ms: 8 }] },
  { id: 'q4', time: '10:41:49', who: 'churn-analyst', kind: 'agent', summary: 'SELECT c.segment, COUNT(*) FROM customers c JOIN orders o ON … GROUP BY c.segment', tables: ['customers', 'orders'], durationMs: 2, status: 'Failed', note: 'Refused at the rate limit (10 queries a second)', endedAt: '10:41:49', bytesRead: '0 B', resultRows: 0 },
  { id: 'q5', time: '10:41:30', who: 'seller-portal', kind: 'app', summary: 'SELECT * FROM orders WHERE seller_id = 20931 AND order_date >= …', tables: ['orders'], durationMs: 12, status: 'Completed', endedAt: '10:41:30', bytesRead: '2 MB', resultRows: 31, profile: [{ phase: 'Plan', ms: 3 }, { phase: 'Scan', ms: 6 }, { phase: 'Return', ms: 3 }] },
  { id: 'q6', time: '10:40:02', who: 'Sara Lee', kind: 'person', summary: 'SELECT stage, SUM(amount) FROM opportunity GROUP BY stage', tables: ['opportunity'], durationMs: 310, status: 'Completed', endedAt: '10:40:02', bytesRead: '220 MB', resultRows: 6, profile: [{ phase: 'Plan', ms: 9 }, { phase: 'Scan', ms: 240 }, { phase: 'Aggregate', ms: 52 }, { phase: 'Return', ms: 9 }] },
  { id: 'q9', time: '10:35:51', who: 'support-copilot', kind: 'agent', summary: 'SELECT … FROM tickets t JOIN charges c ON t.customer_id = c.customer_id', tables: ['tickets', 'charges'], durationMs: 60, status: 'Failed', note: 'No permission to read charges', endedAt: '10:35:51', bytesRead: '0 B', resultRows: 0 },
  { id: 'q10', time: '10:31:26', who: 'thoughtspot', kind: 'app', summary: 'SELECT priority, COUNT(*) FROM tickets WHERE opened_at >= … GROUP BY priority', tables: ['tickets'], durationMs: 160, status: 'Completed', endedAt: '10:31:26', bytesRead: '640 MB', resultRows: 4, profile: [{ phase: 'Plan', ms: 7 }, { phase: 'Scan', ms: 120 }, { phase: 'Aggregate', ms: 26 }, { phase: 'Return', ms: 7 }] },
  { id: 'q11', time: '10:29:40', who: 'seller-portal', kind: 'app', summary: 'SELECT name, industry, country FROM account WHERE id = …', tables: ['account'], durationMs: 9, status: 'Completed', endedAt: '10:29:40', bytesRead: '1 MB', resultRows: 1, profile: [{ phase: 'Plan', ms: 2 }, { phase: 'Scan', ms: 5 }, { phase: 'Return', ms: 2 }] },
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

// ---------------------------------------------------------------------------------------------
// v2 · PM plan (7 Oct). Nothing below is read by v1.
// ---------------------------------------------------------------------------------------------

/** Who is signed in, per role. v1 is always Priya (Admin). */
export const CURRENT_USER: Record<Role, string> = { Admin: 'Priya Nair', Editor: 'Arjun Mehta', Viewer: 'Sara Lee' };

export const roleOf = (name: string, people: Person[]): Role => people.find((p) => p.name === name)?.role ?? 'Viewer';

/** PM plan item 14: one key per source, with a source label the user typed. Tables take the label of the key that wrote them. */
export const V2_SOURCE: Record<string, { label: string; detail: string }> = {
  t5: { label: 'S3', detail: 's3-events' },
  t11: { label: 'Snowflake', detail: 'snowflake-sales' },
  t12: { label: 'Snowflake', detail: 'snowflake-sales' },
  t6: { label: 'Snowflake', detail: 'snowflake-sales' },
  t13: { label: 'Salesforce', detail: 'salesforce-crm' },
  t7: { label: 'Salesforce', detail: 'salesforce-crm' },
  t8: { label: 'Salesforce', detail: 'salesforce-crm' },
  t14: { label: 'Databricks', detail: 'databricks-marts' },
  t9: { label: 'Databricks', detail: 'databricks-marts' },
};

/** PM plan item 5: API keys. Permission is not stored — it is the creator's role (see keyPermission). */
export const API_KEYS: ServiceAccount[] = [
  { id: 'k1', name: 'thoughtspot', kind: 'app', permission: 'Read', rateLimit: null, lastUsed: 'Just now', createdBy: 'Sara Lee', passwordSetAt: '12 Sep' },
  { id: 'k2', name: 'snowflake-sales', kind: 'pipeline', permission: 'Read & write', rateLimit: null, lastUsed: 'Today, 02:00', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep', sourceLabel: 'Snowflake' },
  { id: 'k3', name: 'salesforce-crm', kind: 'pipeline', permission: 'Read & write', rateLimit: null, lastUsed: '22 min ago', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep', sourceLabel: 'Salesforce' },
  { id: 'k4', name: 's3-events', kind: 'pipeline', permission: 'Read & write', rateLimit: null, lastUsed: '4 min ago', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep', sourceLabel: 'S3' },
  { id: 'k5', name: 'databricks-marts', kind: 'pipeline', permission: 'Read & write', rateLimit: null, lastUsed: 'Today, 05:30', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep', sourceLabel: 'Databricks' },
  { id: 'k6', name: 'support-copilot', kind: 'agent', permission: 'Read & write', rateLimit: null, lastUsed: '1 min ago', createdBy: 'Priya Nair', passwordSetAt: '12 Sep' },
  { id: 'k7', name: 'churn-analyst', kind: 'agent', permission: 'Read', rateLimit: null, lastUsed: '3 min ago', createdBy: 'Sara Lee', passwordSetAt: '12 Sep' },
  { id: 'k8', name: 'seller-portal', kind: 'app', permission: 'Read & write', rateLimit: null, lastUsed: 'Just now', createdBy: 'Arjun Mehta', passwordSetAt: '12 Sep' },
];
