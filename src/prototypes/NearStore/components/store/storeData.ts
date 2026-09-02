/**
 * AgentDB Store — sample data
 *
 * Illustrative only. Table names, row counts and timestamps are invented; nothing
 * reads a warehouse. Source names are real product connectors because the picker
 * has to look like the real one.
 */
import type { Connection, StoreTable, SyncRun, TableColumnMapping } from './storeTypes';

/** The connector catalogue, grouped the way the real picker groups it. */
export const SOURCE_GROUPS: { title: string; sources: { key: string; name: string }[] }[] = [
  {
    title: 'Cloud data platforms',
    sources: [
      { key: 'snowflake', name: 'Snowflake' },
      { key: 'databricks', name: 'Databricks' },
      { key: 'redshift', name: 'Amazon Redshift' },
      { key: 'bigquery', name: 'Google BigQuery' },
      { key: 'synapse', name: 'Azure Synapse' },
      { key: 'clickhouse', name: 'ClickHouse' },
      { key: 'iomete', name: 'Iomete' },
    ],
  },
  {
    title: 'Query engines',
    sources: [
      { key: 'athena', name: 'Amazon Athena' },
      { key: 'dremio', name: 'Dremio' },
      { key: 'presto', name: 'Presto' },
      { key: 'starburst', name: 'Starburst' },
      { key: 'trino', name: 'Trino' },
    ],
  },
  {
    title: 'Databases',
    sources: [
      { key: 'aurora', name: 'Amazon Aurora PostgreSQL' },
      { key: 'denodo', name: 'Denodo' },
      { key: 'alloydb', name: 'Google AlloyDB for PostgreSQL' },
      { key: 'cloudsql', name: 'Google Cloud SQL for PostgreSQL' },
      { key: 'mysql', name: 'MySQL' },
      { key: 'oracle', name: 'Oracle' },
      { key: 'postgres', name: 'PostgreSQL' },
      { key: 'saphana', name: 'SAP HANA' },
      { key: 'singlestore', name: 'SingleStore' },
      { key: 'sqlserver', name: 'SQL Server' },
    ],
  },
];

export const SOURCE_NAME: Record<string, string> = Object.fromEntries(
  SOURCE_GROUPS.flatMap((g) => g.sources.map((s) => [s.key, s.name])),
);

export const connections: Connection[] = [
  {
    id: 'c1', name: 'sales_warehouse_store', source: 'snowflake', sourceName: 'Snowflake',
    tags: ['Sales'], csvUpload: 'Disabled', policy: 'Default',
    modified: '5 hours ago', author: 'priya.menon', tableCount: 12,
  },
  {
    id: 'c2', name: 'product_events_store', source: 'databricks', sourceName: 'Databricks',
    tags: [], csvUpload: 'Disabled', policy: 'Default',
    modified: '7 hours ago', author: 'bharathram.g', tableCount: 8,
  },
  {
    id: 'c3', name: 'finance_pg_store', source: 'postgres', sourceName: 'PostgreSQL',
    tags: ['Finance'], csvUpload: 'Enabled', policy: 'Default',
    modified: '23 hours ago', author: 'peeyush.vardhan', tableCount: 6,
  },
  {
    id: 'c4', name: 'support_bq_store', source: 'bigquery', sourceName: 'Google BigQuery',
    tags: [], csvUpload: 'Disabled', policy: 'Default',
    modified: '2 days ago', author: 'shaheel.roshan', tableCount: 4,
  },
];

/** A representative column mapping — what step 2 of the wizard operates on. */
const orderCols: TableColumnMapping[] = [
  { source: 'O_ORDERKEY', sourceType: 'NUMBER(38,0)', sample: '4718021', target: 'o_orderkey', targetType: 'BIGINT', sync: true, primaryKey: true },
  { source: 'O_CUSTKEY', sourceType: 'NUMBER(38,0)', sample: '90213', target: 'o_custkey', targetType: 'BIGINT', sync: true, primaryKey: false },
  { source: 'O_ORDERSTATUS', sourceType: 'VARCHAR(1)', sample: 'F', target: 'o_orderstatus', targetType: 'VARCHAR', sync: true, primaryKey: false },
  { source: 'O_TOTALPRICE', sourceType: 'NUMBER(12,2)', sample: '173665.47', target: 'o_totalprice', targetType: 'DOUBLE', sync: true, primaryKey: false },
  { source: 'O_ORDERDATE', sourceType: 'DATE', sample: '2026-05-14', target: 'o_orderdate', targetType: 'DATE', sync: true, primaryKey: false },
  { source: 'O_UPDATED_AT', sourceType: 'TIMESTAMP_NTZ', sample: '2026-08-26 04:12', target: 'o_updated_at', targetType: 'TIMESTAMP', sync: true, primaryKey: false },
  { source: 'O_COMMENT', sourceType: 'VARCHAR(79)', sample: 'ly special reque', target: 'o_comment', targetType: 'VARCHAR', sync: false, primaryKey: false },
];

export const storeTables: StoreTable[] = [
  {
    id: 't1', name: 'LINEORDER', path: 'db_acme.public.lineorder', connectionId: 'c1', writtenBy: 'Fivetran',
    sizeMB: 16384, rows: 383_920_114, lastRefresh: '18 minutes ago', status: 'Success',
    schedule: 'Hourly', owner: 'priya.menon', incremental: true, columns: orderCols,
  },
  {
    id: 't2', name: 'CUSTOMER', path: 'db_acme.public.customer', connectionId: 'c1', writtenBy: 'Fivetran',
    sizeMB: 2304, rows: 3_000_000, lastRefresh: '18 minutes ago', status: 'Success',
    schedule: 'Hourly', owner: 'priya.menon', incremental: true, columns: orderCols,
  },
  {
    id: 't3', name: 'PART', path: 'db_acme.public.part', connectionId: 'c1', writtenBy: 'Fivetran',
    sizeMB: 512, rows: 1_400_000, lastRefresh: 'Today, 09:04', status: 'In progress',
    schedule: 'Hourly', owner: 'priya.menon', incremental: false, columns: orderCols,
  },
  {
    id: 't4', name: 'product_events', path: 'db_acme.public.product_events', connectionId: 'c2', writtenBy: 'dbt Cloud',
    sizeMB: 6144, rows: 92_400_881, lastRefresh: '3 days ago', status: 'Error',
    schedule: 'Daily · 06:00', owner: 'bharathram.g', incremental: true, columns: orderCols,
  },
  {
    id: 't5', name: 'invoice_lines', path: 'db_acme.finance.invoice_lines', connectionId: 'c3', writtenBy: 'Airflow',
    sizeMB: 1088, rows: 4_210_663, lastRefresh: '2 days ago', status: 'Paused',
    schedule: 'Daily · 02:00', owner: 'peeyush.vardhan', incremental: false, columns: orderCols,
  },
  {
    id: 't6', name: 'ticket_history', path: 'db_acme.support.ticket_history', connectionId: 'c4', writtenBy: 'Fivetran',
    sizeMB: 704, rows: 1_982_004, lastRefresh: 'Yesterday, 06:00', status: 'Success',
    schedule: 'Daily · 06:00', owner: 'shaheel.roshan', incremental: true, columns: orderCols,
  },
];

export const runs: SyncRun[] = [
  { id: 'r1', tableId: 't1', tableName: 'LINEORDER', when: 'Today, 09:00', by: 'Scheduled', rows: 412_990, duration: '2m 14s', status: 'Success' },
  { id: 'r2', tableId: 't3', tableName: 'PART', when: 'Today, 09:00', by: 'Scheduled', rows: 0, duration: '—', status: 'In progress' },
  { id: 'r3', tableId: 't4', tableName: 'product_events', when: 'Today, 06:00', by: 'Scheduled', rows: 0, duration: '48s', status: 'Error', note: 'Source column updated_at not found' },
  { id: 'r4', tableId: 't6', tableName: 'ticket_history', when: 'Today, 06:00', by: 'Scheduled', rows: 8_204, duration: '31s', status: 'Success' },
  { id: 'r5', tableId: 't1', tableName: 'LINEORDER', when: 'Today, 08:00', by: 'Scheduled', rows: 388_112, duration: '2m 08s', status: 'Success' },
  { id: 'r6', tableId: 't2', tableName: 'CUSTOMER', when: 'Yesterday, 17:22', by: 'priya.menon', rows: 3_000_000, duration: '6m 51s', status: 'Success' },
];

/** Tables offered by a connection that haven't been loaded yet — wizard step 1. */
export const sourceTables: Record<string, { name: string; rows: string }[]> = {
  c1: [
    { name: 'LINEORDER', rows: '383.9M rows' }, { name: 'CUSTOMER', rows: '3.0M rows' },
    { name: 'PART', rows: '1.4M rows' }, { name: 'SUPPLIER', rows: '200K rows' },
    { name: 'DATE_DIM', rows: '2.6K rows' }, { name: 'NATION', rows: '25 rows' },
    { name: 'REGION', rows: '5 rows' }, { name: 'ORDERS', rows: '150.0M rows' },
  ],
  c2: [
    { name: 'product_events', rows: '92.4M rows' }, { name: 'sessions', rows: '14.2M rows' },
    { name: 'feature_flags', rows: '1.1K rows' }, { name: 'accounts', rows: '48.0K rows' },
  ],
  c3: [
    { name: 'invoice_lines', rows: '4.2M rows' }, { name: 'invoices', rows: '820K rows' },
    { name: 'payments', rows: '790K rows' },
  ],
  c4: [
    { name: 'ticket_history', rows: '1.9M rows' }, { name: 'tickets', rows: '412K rows' },
  ],
};
