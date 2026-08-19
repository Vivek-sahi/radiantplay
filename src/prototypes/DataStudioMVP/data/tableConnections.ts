/**
 * Where every table lives — the single answer to "which warehouse is this table in?"
 *
 * That question is the trigger for the whole caching flow (see
 * `2026-08-12-caching-flow-spec.md`), and before this file the canvas could not answer it:
 * `CanvasGroup` carried no connection, and the cross-connection check read a hardcoded
 * 6-entry map covering the renewal-risk demo tables only. Everything else resolved to
 * `undefined`, so the gate silently never fired.
 *
 * ⚠️ **This file is authoritative. It is not yet the only copy.**
 *
 * Six other table→source maps existed when this was written, using four different naming
 * schemes for the same connections (`databricks` vs `databricks-usage`, `bigquery-prod` vs
 * `bigquery-product` vs `bigquery-marketing`). They are deliberately left in place — POC is
 * frozen as the reviewed reference and Demo runs a script, so changing what they return
 * would move two cuts that nobody asked to move. Convergence happens as each site is
 * touched for other reasons:
 *
 * | Map | Where | Status |
 * |---|---|---|
 * | `TABLE_PATH` | was `ModelCanvas.tsx` | ✅ folded in here and deleted (it was `void`ed / dead) |
 * | `POC_TABLE_CONN` | `ModelCanvas.tsx` | Frozen — POC's on-drop gate reads it. Leave |
 * | `CONNECTION_BY_TABLE` | `ModelCanvas.tsx` | Publish modal + brand marks, display names. Converge when the publish modal is next touched |
 * | `browserIndex` | `ModelCanvas.tsx` | Search index, mirrors the tree JSX. Converge with the tree refactor its own comment already calls for |
 * | Browser tree JSX | `ModelCanvas.tsx` | Hardcoded lists. Same refactor |
 * | `tableMetadata[].connection` | `mockData.ts` | Display strings (`Snowflake`, `SF_PROD_CUSTOMER`). Metadata, not routing |
 *
 * If you add a table to the browser tree, add it here too.
 */

/** Connections tables can live in. Ids match the data-browser tree node ids. */
export type ConnectionId =
  | 'sf'          // snowflake-prod
  | 'bq'          // bigquery-product — reads as Databricks when scope.databricksConnection is on
  | 'agentdb'     // ThoughtSpot's own store
  | 'gdrive'      // Google Drive
  | 'sharepoint'  // SharePoint
  | 'mixpanel'
  | 'pendo';

export interface ConnectionInfo {
  id: ConnectionId;
  label: string;
  type: 'snowflake' | 'bigquery' | 'databricks' | 'thoughtspot' | 'drive' | 'sharepoint' | 'saas';
  /**
   * ThoughtSpot's own warehouse. Tables here **never need caching** — they are already
   * where a join has to happen. This is the field the caching gate turns on.
   */
  isThoughtSpot: boolean;
  /** Demo/POC rename — the `bq` connection reads as Databricks in cuts that set it. */
  altLabel?: string;
}

export const CONNECTION_INFO: Record<ConnectionId, ConnectionInfo> = {
  sf:         { id: 'sf',         label: 'snowflake-prod',    type: 'snowflake',  isThoughtSpot: false },
  bq:         { id: 'bq',         label: 'bigquery-product',  type: 'bigquery',   isThoughtSpot: false, altLabel: 'databricks' },
  agentdb:    { id: 'agentdb',    label: 'AgentDB',           type: 'thoughtspot', isThoughtSpot: true },
  gdrive:     { id: 'gdrive',     label: 'Google Drive',      type: 'drive',      isThoughtSpot: false },
  sharepoint: { id: 'sharepoint', label: 'SharePoint',        type: 'sharepoint', isThoughtSpot: false },
  mixpanel:   { id: 'mixpanel',   label: 'Mixpanel',          type: 'saas',       isThoughtSpot: false },
  pendo:      { id: 'pendo',      label: 'Pendo',             type: 'saas',       isThoughtSpot: false },
};

export interface TableLocation {
  connection: ConnectionId;
  db: string;
  schema: string;
}

/**
 * Table → where it lives.
 *
 * Provenance, so none of this is invented: the four `ANALYTICS.PUBLIC` tables and the two
 * `raw` ones are what the data-browser tree lists; `orders`…`dim_customers` and the
 * Mixpanel/Pendo sets come from the dead `TABLE_PATH` map this replaces;
 * `accounts`/`contracts`/`arr_snapshot`/`billing_events`/`usage_events`/`feature_adoption`
 * come from `CONNECTION_BY_TABLE`, which the publish modal reads.
 */
export const TABLE_LOCATION: Record<string, TableLocation> = {
  // ── snowflake-prod · ANALYTICS.PUBLIC — the renewal-risk set, as the tree lists it ──
  dim_accounts:           { connection: 'sf', db: 'ANALYTICS', schema: 'PUBLIC' },
  support_cases:          { connection: 'sf', db: 'ANALYTICS', schema: 'PUBLIC' },
  call_metrics:           { connection: 'sf', db: 'ANALYTICS', schema: 'PUBLIC' },
  customer_found_defects: { connection: 'sf', db: 'ANALYTICS', schema: 'PUBLIC' },

  // ── snowflake-prod · analytics.public — the original e-commerce set ──
  orders:       { connection: 'sf', db: 'analytics', schema: 'public' },
  customers:    { connection: 'sf', db: 'analytics', schema: 'public' },
  products:     { connection: 'sf', db: 'analytics', schema: 'public' },
  line_items:   { connection: 'sf', db: 'analytics', schema: 'public' },
  transactions: { connection: 'sf', db: 'analytics', schema: 'public' },

  // ── snowflake-prod · analytics.dbt ──
  fct_orders:    { connection: 'sf', db: 'analytics', schema: 'dbt' },
  dim_customers: { connection: 'sf', db: 'analytics', schema: 'dbt' },

  // ── snowflake-prod — the run-of-show tables the publish modal names as Snowflake ──
  accounts:       { connection: 'sf', db: 'ANALYTICS', schema: 'CRM' },
  contracts:      { connection: 'sf', db: 'ANALYTICS', schema: 'CRM' },
  arr_snapshot:   { connection: 'sf', db: 'ANALYTICS', schema: 'CRM' },
  billing_events: { connection: 'sf', db: 'ANALYTICS', schema: 'CRM' },

  // ── bq · product_db.raw — what the tree lists (reads as Databricks in Demo) ──
  pendo_nps_enriched:  { connection: 'bq', db: 'product_db', schema: 'raw' },
  csm_account_mapping: { connection: 'bq', db: 'product_db', schema: 'raw' },

  // ── bq — product usage, which the run-of-show puts in Databricks ──
  usage_events:     { connection: 'bq', db: 'product_db', schema: 'usage' },
  feature_adoption: { connection: 'bq', db: 'product_db', schema: 'usage' },

  // ── bq · marketing.raw — the campaign-performance set ──
  campaigns:   { connection: 'bq', db: 'marketing', schema: 'raw' },
  ad_events:   { connection: 'bq', db: 'marketing', schema: 'raw' },
  conversions: { connection: 'bq', db: 'marketing', schema: 'raw' },

  // ── ThoughtSpot's own store — already where joins happen, so never cached ──
  customer_regions:         { connection: 'agentdb', db: 'AgentDB', schema: 'cached' },
  customer_health_external: { connection: 'agentdb', db: 'AgentDB', schema: 'cached' },

  // ── File-based connections ──
  qbr_notes:       { connection: 'gdrive',     db: 'Google Drive', schema: 'Customer Success' },
  renewal_tracker: { connection: 'sharepoint', db: 'SharePoint',   schema: 'Renewals' },

  // ── Business apps ──
  mp_events:  { connection: 'mixpanel', db: 'mixpanel', schema: 'events' },
  mp_users:   { connection: 'mixpanel', db: 'mixpanel', schema: 'events' },
  mp_cohorts: { connection: 'mixpanel', db: 'mixpanel', schema: 'events' },

  pendo_nps:           { connection: 'pendo', db: 'pendo', schema: 'analytics' },
  pendo_feature_usage: { connection: 'pendo', db: 'pendo', schema: 'analytics' },
  pendo_visitors:      { connection: 'pendo', db: 'pendo', schema: 'analytics' },
};

/**
 * Tables with no source connection — our store *is* their home.
 *
 * Not "cached": nothing is being copied, so they have no window, no refresh and no
 * staleness. See the flow spec §2 on why this is a third state rather than a flag.
 */
export const NATIVE_TABLES: Record<string, 'csv' | 'python'> = {
  qbr_sentiment:   'csv',     // the CSV the CS team uploads
  jira_cs_tickets: 'python',  // a script the agent writes, not a connection
};

/** Where a table lives, or null if it has no source connection (native, or unknown). */
export const locationOf = (table: string): TableLocation | null =>
  TABLE_LOCATION[table] ?? null;

export const connectionOf = (table: string): ConnectionId | null =>
  TABLE_LOCATION[table]?.connection ?? null;

/**
 * True when the table already sits in ThoughtSpot's warehouse — natively (CSV, Python) or
 * because its connection *is* our store. These never need caching.
 */
export const isInThoughtSpot = (table: string): boolean => {
  if (NATIVE_TABLES[table]) return true;
  const conn = connectionOf(table);
  return conn ? CONNECTION_INFO[conn].isThoughtSpot : false;
};

/**
 * Which tables in a set have to be cached before they can be joined.
 *
 * The rule is *bring everything that isn't already here* — a join needs every table in one
 * place, and the only place we can put them is ours:
 *
 * - nothing here yet, and all tables in one external warehouse → **nothing**. They're already
 *   together, so the join pushes down to that warehouse
 * - otherwise → **every table not already here**
 *
 * ⚠️ **Anything already in our store anchors the model there.** Once one table is cached (or
 * is native, like a CSV), the join can only happen in ThoughtSpot — so a second table from
 * the *same warehouse as the cached one* still has to come over. It reads like a table that
 * could be left alone, and it can't: a 6-hour cached copy and a full-history live table are
 * in two different places holding two different amounts of data, and "this model covers the
 * last 6 hours" would stop being true of it.
 *
 * `alreadyCached` is how a third table joining a finished model surfaces only itself.
 */
export const tablesNeedingCache = (
  tables: string[],
  alreadyCached: (table: string) => boolean = () => false,
): string[] => {
  const here = (t: string) => isInThoughtSpot(t) || alreadyCached(t);
  // Nothing anchored here yet and one warehouse between them → they're already together.
  if (!tables.some(here)) {
    const connections = new Set(tables.map(connectionOf).filter(Boolean));
    if (connections.size <= 1) return [];
  }
  return tables.filter(t => !here(t));
};

/** Display label for a connection, honouring the Databricks rename. */
export const connectionLabel = (conn: ConnectionId, databricksRename = false): string => {
  const info = CONNECTION_INFO[conn];
  return databricksRename && info.altLabel ? info.altLabel : info.label;
};
