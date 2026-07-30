/**
 * DataStudio Mock Data
 *
 * Scenario: Campaign Performance Analysis
 * Business intent: "Marketing team wants to understand how campaigns
 * are driving orders across regions and user segments."
 *
 * Three tables: orders, campaigns, users
 *
 * Intentional data quality issues (for prototype demo):
 *   - orders.campaign_id: 18% null (~27 rows, organic orders, no campaign)
 *   - orders: 7 duplicate rows (same order_id)
 *   - orders.amount: 4 anomalies (2 negative, 2 extreme outliers)
 *   - orders.order_date: MM/DD/YYYY format (conflicts with campaigns YYYY-MM-DD)
 *   - campaigns.end_date: 6 nulls (ongoing campaigns)
 *   - campaigns: 2 duplicate rows
 *   - users.segment: 15% null (~14 rows, unclassified users)
 *   - users.age: 4 anomalies (age: 0, age: 142, age: -3, age: 199)
 *   - users.signup_date: YYYY/MM/DD format (third date format)
 *   - Most columns: no descriptions set (semantic health issue)
 */

// ─── Table Metadata ──────────────────────────────────────────────────────────

export type ColumnType      = 'attribute' | 'measure' | 'key';
export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN' | 'COUNT_DISTINCT';
export type FormatPattern   = 'number' | 'currency' | 'percentage' | 'date' | 'text';

export interface ColumnMeta {
  id: string;
  name: string;

  // ── Warehouse-derived (auto, read-only) ──────────────────────────────────
  type: 'string' | 'number' | 'date' | 'boolean';
  nullable: boolean;
  isSystemField?: boolean;      // internal IDs / raw system fields
  isPII?: boolean;

  // ── Semantic (analyst-edited, agent-writable) ────────────────────────────
  description: string | null;   // null = missing (Data Health issue)
  aiContext:   string | null;   // how the AI should interpret this column
  synonyms?:   string[];        // alternative names Spotter matches on

  // ── Modeling (analyst-edited) ────────────────────────────────────────────
  classification?: ColumnType;
  aggregation?:    AggregationType;  // measures only
  isAdditive?:     boolean;          // measures only — can it be summed across all dims?
  isHidden?:       boolean;          // excluded from Spotter surface
  formatPattern?:  FormatPattern;

  // ── Data quality (from last prep scan, read-only) ────────────────────────
  nullRate?:       number;   // 0–100 %
  duplicateCount?: number;
  blankCount?:     number;   // empty string rows (distinct from null)
  anomalyCount?:   number;   // statistical outliers detected

  // ── Sync (dbt / external source status, read-only) ──────────────────────
  syncStatus?:     'ok' | 'broken' | 'degraded';

  // ── Staging table lineage (multi-source flow) ────────────────────────────
  sourceTable?:    string;   // which source table this column came from
  sourceColumn?:   string;   // original column name in the source table
}

export interface TableMeta {
  id: string;
  name: string;
  description: string;
  connection: string;
  connectionType: 'snowflake' | 'thoughtspot' | 'sap';
  columns: ColumnMeta[];
  rowCount: number;
  lastSynced: string;
  qualityIssues: QualityIssue[];
  isStaging?: boolean;
  owner?: string;
  dqScore?: number;
  sampleRows?: Record<string, string | number | boolean | null>[];
}

export interface QualityIssue {
  type: 'null' | 'duplicate' | 'anomaly' | 'no_description' | 'date_format';
  column?: string;
  severity: 'high' | 'medium' | 'low';
  count: number;
  percentage: number;
  description: string;
}

export const tableMetadata: Record<string, TableMeta> = {
  orders: {
    id: 'orders',
    name: 'Orders',
    description: 'All customer orders placed via the platform, including order details, amounts, and attribution data.',
    connection: 'Snowflake',
    connectionType: 'snowflake',
    rowCount: 150,
    lastSynced: '2024-03-28T14:32:00Z',
    columns: [
      { id: 'order_id',         name: 'order_id',         type: 'string', nullable: false, classification: 'key',      isSystemField: true,
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 7, blankCount: 0, anomalyCount: 0 },
      { id: 'user_id',          name: 'user_id',          type: 'string', nullable: false, classification: 'key',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'campaign_id',      name: 'campaign_id',      type: 'string', nullable: true,  classification: 'key',
        description: null, aiContext: null, isHidden: false,
        nullRate: 18, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'order_date',       name: 'order_date',       type: 'date',   nullable: false, classification: 'attribute',
        description: null, aiContext: null, isHidden: false, formatPattern: 'date',
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'amount',           name: 'amount',           type: 'number', nullable: false, classification: 'measure',  aggregation: 'SUM', isAdditive: true, formatPattern: 'currency',
        description: 'Order value in USD at time of purchase.', aiContext: null, synonyms: ['revenue', 'order value', 'sales'], isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 4 },
      { id: 'product_category', name: 'product_category', type: 'string', nullable: false, classification: 'attribute',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 2, anomalyCount: 0 },
      { id: 'status',           name: 'status',           type: 'string', nullable: false, classification: 'attribute', synonyms: ['order_status'],
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'region',           name: 'region',           type: 'string', nullable: false, classification: 'attribute',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
    ],
    qualityIssues: [
      { type: 'no_description', severity: 'high',   count: 7,   percentage: 70, description: 'No descriptions — AI agent cannot interpret columns correctly'  },
      { type: 'null',           severity: 'medium', count: 27,  percentage: 18, description: 'campaign_id is null — organic orders with no campaign attribution' },
      { type: 'duplicate',      severity: 'medium', count: 7,   percentage: 5,  description: 'Duplicate order_id rows — likely pipeline ingestion issue'         },
      { type: 'anomaly',        severity: 'low',    count: 4,   percentage: 3,  description: 'Anomalous amounts: 2 negative values, 2 extreme outliers'          },
      { type: 'date_format',    severity: 'high',   count: 150, percentage: 100,description: 'order_date uses MM/DD/YYYY — conflicts with campaigns YYYY-MM-DD'  },
    ],
  },

  campaigns: {
    id: 'campaigns',
    name: 'Campaigns',
    description: 'Marketing campaigns run across channels, including budget, spend, and targeting information.',
    connection: 'Snowflake',
    connectionType: 'snowflake',
    rowCount: 45,
    lastSynced: '2024-03-28T14:32:00Z',
    columns: [
      { id: 'campaign_id',   name: 'campaign_id',   type: 'string', nullable: false, classification: 'key',      isSystemField: false,
        description: 'Unique identifier for each marketing campaign.', aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 2, blankCount: 0, anomalyCount: 0 },
      { id: 'campaign_name', name: 'campaign_name', type: 'string', nullable: false, classification: 'attribute',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'channel',       name: 'channel',       type: 'string', nullable: false, classification: 'attribute', synonyms: ['marketing_channel', 'ad_channel'],
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'budget',        name: 'budget',        type: 'number', nullable: false, classification: 'measure',  aggregation: 'SUM', isAdditive: true, formatPattern: 'currency',
        description: 'Total approved budget for the campaign in USD.', aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'spend',         name: 'spend',         type: 'number', nullable: false, classification: 'measure',  aggregation: 'SUM', isAdditive: true, formatPattern: 'currency',
        description: null, aiContext: null, synonyms: ['ad spend', 'investment', 'cost'], isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'impressions',   name: 'impressions',   type: 'number', nullable: false, classification: 'measure',  aggregation: 'SUM', isAdditive: true,
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'start_date',    name: 'start_date',    type: 'date',   nullable: false, classification: 'attribute', formatPattern: 'date',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'end_date',      name: 'end_date',      type: 'date',   nullable: true,  classification: 'attribute', formatPattern: 'date',
        description: null, aiContext: null, isHidden: false,
        nullRate: 13, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'target_region', name: 'target_region', type: 'string', nullable: false, classification: 'attribute',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'status',        name: 'status',        type: 'string', nullable: false, classification: 'attribute', synonyms: ['campaign_status'],
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'campaign_roas',    name: 'campaign_roas',    type: 'number', nullable: true,  classification: 'measure', aggregation: 'AVG', isAdditive: false,
        description: 'Return on Ad Spend — total revenue divided by total spend per campaign.', aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0, syncStatus: 'broken' as const },
      { id: 'days_to_convert',  name: 'days_to_convert',  type: 'number', nullable: true,  classification: 'measure', aggregation: 'AVG', isAdditive: false,
        description: 'Average days from first impression to first order, per user.', aiContext: null, isHidden: false,
        nullRate: 12, duplicateCount: 0, blankCount: 0, anomalyCount: 0, syncStatus: 'broken' as const },
    ],
    qualityIssues: [
      { type: 'no_description', severity: 'high',   count: 7,  percentage: 78, description: 'Missing column descriptions'                                          },
      { type: 'null',           severity: 'low',    count: 6,  percentage: 13, description: 'end_date is null — ongoing campaigns with no planned end date'         },
      { type: 'duplicate',      severity: 'medium', count: 2,  percentage: 4,  description: 'Duplicate campaign_ids CAM-008, CAM-021 — duplicate entries in source' },
      { type: 'date_format',    severity: 'high',   count: 45, percentage: 100,description: 'start_date/end_date use YYYY-MM-DD — conflicts with orders'            },
    ],
  },

  users: {
    id: 'users',
    name: 'Users',
    description: 'Registered platform users including demographic and segmentation data.',
    connection: 'Snowflake',
    connectionType: 'snowflake',
    rowCount: 90,
    lastSynced: '2024-03-28T14:32:00Z',
    columns: [
      { id: 'user_id',        name: 'user_id',        type: 'string', nullable: false, classification: 'key',
        description: 'Unique identifier for each registered user.', aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'name',           name: 'name',           type: 'string', nullable: false, classification: 'attribute', isPII: true,
        description: null, aiContext: null, isHidden: true,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'email',          name: 'email',          type: 'string', nullable: false, classification: 'attribute', isPII: true,
        description: null, aiContext: null, isHidden: true,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'signup_date',    name: 'signup_date',    type: 'date',   nullable: false, classification: 'attribute', formatPattern: 'date',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'region',         name: 'region',         type: 'string', nullable: false, classification: 'attribute',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'segment',        name: 'segment',        type: 'string', nullable: true,  classification: 'attribute', synonyms: ['user_tier', 'customer_segment'],
        description: null, aiContext: null, isHidden: false,
        nullRate: 15, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'age',            name: 'age',            type: 'number', nullable: false, classification: 'attribute', isPII: true,
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 4 },
      { id: 'lifetime_value', name: 'lifetime_value', type: 'number', nullable: false, classification: 'measure',  aggregation: 'SUM', isAdditive: true, formatPattern: 'currency',
        description: 'Total historical spend by this user across all orders.', aiContext: null, synonyms: ['LTV', 'customer value'], isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'user_segment_fill', name: 'user_segment_fill', type: 'string', nullable: true, classification: 'attribute',
        description: 'Segment label backfilled using custom dbt macro — may not match ThoughtSpot logic exactly.', aiContext: null, isHidden: false,
        nullRate: 8, duplicateCount: 0, blankCount: 0, anomalyCount: 0, syncStatus: 'degraded' as const },
    ],
    qualityIssues: [
      { type: 'no_description', severity: 'high',   count: 6,  percentage: 75, description: 'Missing column descriptions'                                                    },
      { type: 'null',           severity: 'medium', count: 14, percentage: 15, description: 'segment is null — users not yet classified into a tier'                          },
      { type: 'anomaly',        severity: 'low',    count: 4,  percentage: 4,  description: 'age anomalies: age=0, age=142, age=-3, age=199 — likely data entry errors'       },
      { type: 'date_format',    severity: 'high',   count: 90, percentage: 100,description: 'signup_date uses YYYY/MM/DD — third date format in dataset'                     },
    ],
  },

  returns: {
    id: 'returns',
    name: 'Returns',
    description: 'Customer return requests linked to orders, including reason, amount, and resolution status.',
    connection: 'Snowflake',
    connectionType: 'snowflake',
    rowCount: 1240,
    lastSynced: '2024-03-28T14:32:00Z',
    columns: [
      { id: 'return_id',     name: 'return_id',     type: 'string', nullable: false, classification: 'key', isSystemField: true,
        description: 'Unique identifier for each return request.', aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'order_id',      name: 'order_id',      type: 'string', nullable: false, classification: 'key',
        description: 'References orders.order_id — the order this return belongs to.', aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'return_date',   name: 'return_date',   type: 'date',   nullable: false, classification: 'attribute', formatPattern: 'date',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'return_reason', name: 'return_reason', type: 'string', nullable: true,  classification: 'attribute',
        description: null, aiContext: null, isHidden: false,
        nullRate: 14, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'amount',        name: 'amount',        type: 'number', nullable: false, classification: 'measure', aggregation: 'SUM', isAdditive: true, formatPattern: 'currency',
        description: 'Value of the returned items in USD.', aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
      { id: 'return_status', name: 'return_status', type: 'string', nullable: false, classification: 'attribute',
        description: null, aiContext: null, isHidden: false,
        nullRate: 0, duplicateCount: 0, blankCount: 0, anomalyCount: 0 },
    ],
    qualityIssues: [
      { type: 'null',           severity: 'low',  count: 174, percentage: 14, description: 'return_reason is null — customer did not provide a reason (expected)' },
      { type: 'no_description', severity: 'high', count: 4,   percentage: 67, description: 'Missing descriptions on 4 of 6 columns'                              },
    ],
  },

  // ── Additional warehouse tables (minimal metadata — no sample rows) ───────────

  order_items: {
    id: 'order_items', name: 'Order Items', connection: 'Snowflake', connectionType: 'snowflake',
    description: 'Line-item detail for every order — one row per product per order.',
    rowCount: 420, lastSynced: '2024-03-28T14:32:00Z', qualityIssues: [],
    columns: [
      { id: 'item_id',          name: 'item_id',          type: 'string', description: 'Unique line-item identifier.',         nullable: false },
      { id: 'order_id',         name: 'order_id',         type: 'string', description: null,                                   nullable: false },
      { id: 'product_id',       name: 'product_id',       type: 'string', description: null,                                   nullable: false },
      { id: 'product_name',     name: 'product_name',     type: 'string', description: null,                                   nullable: false },
      { id: 'quantity',         name: 'quantity',         type: 'number', description: null,                                   nullable: false },
      { id: 'unit_price',       name: 'unit_price',       type: 'number', description: 'Price per unit at time of purchase.',  nullable: false },
      { id: 'discount',         name: 'discount',         type: 'number', description: null,                                   nullable: true  },
      { id: 'line_total',       name: 'line_total',       type: 'number', description: null,                                   nullable: false },
    ],
  },

  transactions: {
    id: 'transactions', name: 'Transactions', connection: 'Snowflake', connectionType: 'snowflake',
    description: 'Raw financial transactions including revenue and cost of goods by product and department.',
    rowCount: 50, lastSynced: '2024-03-28T14:32:00Z', qualityIssues: [],
    columns: [
      { id: 'transaction_id',   name: 'transaction_id',   type: 'string', description: null, nullable: false },
      { id: 'order_id',         name: 'order_id',         type: 'string', description: null, nullable: false },
      { id: 'revenue',          name: 'revenue',          type: 'number', description: null, nullable: false },
      { id: 'cogs',             name: 'cogs',             type: 'number', description: null, nullable: false },
      { id: 'date',             name: 'date',             type: 'date',   description: null, nullable: false },
      { id: 'product_category', name: 'product_category', type: 'string', description: null, nullable: false },
      { id: 'region',           name: 'region',           type: 'string', description: null, nullable: false },
      { id: 'department',       name: 'department',       type: 'string', description: null, nullable: false },
    ],
  },

  expenses: {
    id: 'expenses', name: 'Expenses', connection: 'Snowflake', connectionType: 'snowflake',
    description: 'Operating expenses by category, department, and vendor.',
    rowCount: 50, lastSynced: '2024-03-28T14:32:00Z', qualityIssues: [],
    columns: [
      { id: 'expense_id',   name: 'expense_id',   type: 'string', description: null, nullable: false },
      { id: 'category',     name: 'category',     type: 'string', description: null, nullable: false },
      { id: 'department',   name: 'department',   type: 'string', description: null, nullable: false },
      { id: 'amount',       name: 'amount',       type: 'number', description: null, nullable: false },
      { id: 'date',         name: 'date',         type: 'date',   description: null, nullable: false },
      { id: 'vendor',       name: 'vendor',       type: 'string', description: null, nullable: true  },
      { id: 'status',       name: 'status',       type: 'string', description: null, nullable: false },
      { id: 'approved_by',  name: 'approved_by',  type: 'string', description: null, nullable: true  },
    ],
  },

  budget_targets: {
    id: 'budget_targets', name: 'Budget Targets', connection: 'Snowflake', connectionType: 'snowflake',
    description: 'Monthly budget allocations by department and category, with actuals where available.',
    rowCount: 50, lastSynced: '2024-03-28T14:32:00Z', qualityIssues: [],
    columns: [
      { id: 'budget_id',        name: 'budget_id',        type: 'string', description: null,                                      nullable: false },
      { id: 'month',            name: 'month',            type: 'date',   description: null,                                      nullable: false },
      { id: 'department',       name: 'department',       type: 'string', description: null,                                      nullable: false },
      { id: 'category',         name: 'category',         type: 'string', description: null,                                      nullable: false },
      { id: 'budgeted_amount',  name: 'budgeted_amount',  type: 'number', description: null,                                      nullable: false },
      { id: 'actual_amount',    name: 'actual_amount',    type: 'number', description: 'Null for future months.',                  nullable: true  },
      { id: 'currency',         name: 'currency',         type: 'string', description: null,                                      nullable: false },
    ],
  },

  fct_pnl: {
    id: 'fct_pnl', name: 'fct_pnl', connection: 'dbt Analytics', connectionType: 'thoughtspot',
    description: 'P&L aggregated by department × month. Pre-built from transactions + expenses + budget_targets.',
    rowCount: 50, lastSynced: '2024-03-28T14:32:00Z', qualityIssues: [],
    columns: [
      { id: 'month',                name: 'month',                type: 'date',   description: null, nullable: false },
      { id: 'department',           name: 'department',           type: 'string', description: null, nullable: false },
      { id: 'revenue',              name: 'revenue',              type: 'number', description: null, nullable: false },
      { id: 'cogs',                 name: 'cogs',                 type: 'number', description: null, nullable: false },
      { id: 'gross_profit',         name: 'gross_profit',         type: 'number', description: null, nullable: false },
      { id: 'operating_expenses',   name: 'operating_expenses',   type: 'number', description: null, nullable: false },
      { id: 'net_income',           name: 'net_income',           type: 'number', description: null, nullable: false },
      { id: 'budget',               name: 'budget',               type: 'number', description: null, nullable: true  },
      { id: 'variance',             name: 'variance',             type: 'number', description: null, nullable: true  },
      { id: 'gross_margin_pct',     name: 'gross_margin_pct',     type: 'number', description: null, nullable: false },
      { id: 'budget_variance_pct',  name: 'budget_variance_pct',  type: 'number', description: null, nullable: true  },
    ],
  },

  sales_overview: {
    id: 'sales_overview', name: 'sales_overview', connection: 'Snowflake', connectionType: 'snowflake',
    description: 'Deals, accounts, and reps pre-joined as a semantic view. Includes computed win_rate, quota_attainment, pipeline_value.',
    rowCount: 50, lastSynced: '2024-03-28T14:32:00Z', qualityIssues: [],
    columns: [
      { id: 'deal_id',           name: 'deal_id',           type: 'string', description: null, nullable: false },
      { id: 'deal_amount',       name: 'deal_amount',       type: 'number', description: null, nullable: false },
      { id: 'stage',             name: 'stage',             type: 'string', description: null, nullable: false },
      { id: 'close_date',        name: 'close_date',        type: 'date',   description: null, nullable: true  },
      { id: 'deal_type',         name: 'deal_type',         type: 'string', description: null, nullable: false },
      { id: 'company_name',      name: 'company_name',      type: 'string', description: null, nullable: false },
      { id: 'industry',          name: 'industry',          type: 'string', description: null, nullable: false },
      { id: 'tier',              name: 'tier',              type: 'string', description: null, nullable: false },
      { id: 'rep_name',          name: 'rep_name',          type: 'string', description: null, nullable: false },
      { id: 'team',              name: 'team',              type: 'string', description: null, nullable: false },
      { id: 'region',            name: 'region',            type: 'string', description: null, nullable: false },
      { id: 'win_rate',          name: 'win_rate',          type: 'number', description: 'Computed: won / total deals.',        nullable: false },
      { id: 'quota_attainment',  name: 'quota_attainment',  type: 'number', description: 'Computed: revenue / quota.',         nullable: false },
      { id: 'pipeline_value',    name: 'pipeline_value',    type: 'number', description: 'Computed: open deals × probability.', nullable: false },
    ],
  },

  deals: {
    id: 'deals', name: 'Deals', connection: 'Snowflake', connectionType: 'snowflake',
    description: 'Raw sales deals with stage, amount, and close date.',
    rowCount: 50, lastSynced: '2024-03-28T14:32:00Z', qualityIssues: [],
    columns: [
      { id: 'deal_id',      name: 'deal_id',      type: 'string', description: null, nullable: false },
      { id: 'account_id',   name: 'account_id',   type: 'string', description: null, nullable: false },
      { id: 'rep_id',       name: 'rep_id',       type: 'string', description: null, nullable: false },
      { id: 'stage',        name: 'stage',        type: 'string', description: null, nullable: false },
      { id: 'amount',       name: 'amount',       type: 'number', description: null, nullable: false },
      { id: 'close_date',   name: 'close_date',   type: 'date',   description: null, nullable: true  },
      { id: 'created_date', name: 'created_date', type: 'date',   description: null, nullable: false },
      { id: 'region',       name: 'region',       type: 'string', description: null, nullable: false },
      { id: 'deal_type',    name: 'deal_type',    type: 'string', description: null, nullable: false },
      { id: 'probability',  name: 'probability',  type: 'number', description: null, nullable: true  },
    ],
  },

  accounts: {
    id: 'accounts', name: 'Accounts', connection: 'Snowflake', connectionType: 'snowflake',
    description: 'Company accounts including firmographic data.',
    rowCount: 50, lastSynced: '2024-03-28T14:32:00Z', qualityIssues: [],
    columns: [
      { id: 'account_id',     name: 'account_id',     type: 'string', description: null, nullable: false },
      { id: 'company_name',   name: 'company_name',   type: 'string', description: null, nullable: false },
      { id: 'industry',       name: 'industry',       type: 'string', description: null, nullable: false },
      { id: 'tier',           name: 'tier',           type: 'string', description: null, nullable: false },
      { id: 'region',         name: 'region',         type: 'string', description: null, nullable: false },
      { id: 'arr',            name: 'arr',            type: 'number', description: 'Annual recurring revenue.',  nullable: true  },
      { id: 'employee_count', name: 'employee_count', type: 'number', description: null, nullable: true  },
      { id: 'created_date',   name: 'created_date',   type: 'date',   description: null, nullable: false },
    ],
  },

  reps: {
    id: 'reps', name: 'Reps', connection: 'Snowflake', connectionType: 'snowflake',
    description: 'Sales representatives with quota, attainment, and team data.',
    rowCount: 50, lastSynced: '2024-03-28T14:32:00Z', qualityIssues: [],
    columns: [
      { id: 'rep_id',           name: 'rep_id',           type: 'string', description: null, nullable: false },
      { id: 'name',             name: 'name',             type: 'string', description: null, nullable: false },
      { id: 'region',           name: 'region',           type: 'string', description: null, nullable: false },
      { id: 'manager',          name: 'manager',          type: 'string', description: null, nullable: true  },
      { id: 'quota',            name: 'quota',            type: 'number', description: null, nullable: false },
      { id: 'attainment_ytd',   name: 'attainment_ytd',   type: 'number', description: null, nullable: false },
      { id: 'team',             name: 'team',             type: 'string', description: null, nullable: false },
      { id: 'hire_date',        name: 'hire_date',        type: 'date',   description: null, nullable: false },
    ],
  },

  // ─── Customer Health Scorecard tables (multi-source scenario) ────────────────

  dim_accounts: {
    id: 'dim_accounts', name: 'DIM_ACCOUNTS', connection: 'SF_PROD_CUSTOMER', connectionType: 'snowflake',
    description: 'Master account dimension from Salesforce — one row per customer account with contract and tier data.',
    rowCount: 12000, lastSynced: '2024-03-28T06:00:00Z', qualityIssues: [],
    owner: 'Revenue Ops (Priya Nair)', dqScore: 94,
    sampleRows: [
      { account_id: 'ACC-0001', account_name: 'Acme Corp',        industry: 'Manufacturing', arr: 240000, region: 'APAC',    account_tier: 'Enterprise',  renewal_date: '2024-09-30' },
      { account_id: 'ACC-0002', account_name: 'Globex Inc',       industry: 'Retail',        arr: 85000,  region: 'NA',      account_tier: 'Mid-Market',  renewal_date: '2024-11-15' },
      { account_id: 'ACC-0003', account_name: 'Initech LLC',      industry: 'Technology',    arr: 420000, region: 'EMEA',    account_tier: 'Enterprise',  renewal_date: '2025-01-31' },
      { account_id: 'ACC-0004', account_name: 'Umbrella Co',      industry: null,            arr: 32000,  region: 'NA',      account_tier: 'SMB',         renewal_date: '2024-08-20' },
      { account_id: 'ACC-0005', account_name: 'Soylent Systems',  industry: 'Healthcare',    arr: 190000, region: 'APAC',    account_tier: 'Mid-Market',  renewal_date: null },
    ],
    columns: [
      { id: 'account_id',       name: 'account_id',       type: 'string', nullable: false, classification: 'key', description: 'Unique account identifier across all systems.', aiContext: 'Primary join key for all customer health metrics.', nullRate: 0, duplicateCount: 0 },
      { id: 'account_name',     name: 'account_name',     type: 'string', nullable: false, classification: 'attribute', description: 'Customer account display name.', aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'industry',         name: 'industry',         type: 'string', nullable: true,  classification: 'attribute', description: 'Industry vertical for the account.', aiContext: null, nullRate: 4, duplicateCount: 0 },
      { id: 'arr',              name: 'arr',              type: 'number', nullable: false, classification: 'measure', description: 'Annual recurring revenue in USD.', aiContext: 'Key financial metric for customer health scoring.', aggregation: 'SUM', isAdditive: true, nullRate: 0, duplicateCount: 0 },
      { id: 'contract_start_date', name: 'contract_start_date', type: 'date', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'contract_end_date',   name: 'contract_end_date',   type: 'date', nullable: true,  classification: 'attribute', description: null, aiContext: null, nullRate: 8, duplicateCount: 0 },
      { id: 'region',           name: 'region',           type: 'string', nullable: false, classification: 'attribute', description: 'Sales region for the account.', aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'account_tier',     name: 'account_tier',     type: 'string', nullable: false, classification: 'attribute', description: 'Account tier: Enterprise, Mid-Market, or SMB.', aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'renewal_date',     name: 'renewal_date',     type: 'date',   nullable: true,  classification: 'attribute', description: 'Next contract renewal date.', aiContext: 'Use to identify accounts at renewal risk.', nullRate: 12, duplicateCount: 0 },
    ],
  },

  support_cases: {
    id: 'support_cases', name: 'SUPPORT_CASES', connection: 'SF_PROD_CUSTOMER', connectionType: 'snowflake',
    description: 'Support case history from Salesforce — all tickets filed by customer accounts.',
    rowCount: 84000, lastSynced: '2024-03-28T06:00:00Z', qualityIssues: [],
    owner: 'Customer Success Eng (Rahul Mehta)', dqScore: 81,
    sampleRows: [
      { case_id: 'CS-10441', account_id: 'ACC-0001', created_date: '2024-03-01', closed_date: '2024-03-03', priority: 'P2', status: 'Closed',  case_category: 'Bug',         resolution_time_hours: 48,   reopened: false },
      { case_id: 'CS-10442', account_id: 'ACC-0003', created_date: '2024-03-05', closed_date: null,          priority: 'P1', status: 'Open',    case_category: 'Performance', resolution_time_hours: null, reopened: false },
      { case_id: 'CS-10443', account_id: 'ACC-0002', created_date: '2024-03-07', closed_date: '2024-03-10', priority: 'P3', status: 'Closed',  case_category: null,          resolution_time_hours: 72,   reopened: true  },
      { case_id: 'CS-10444', account_id: 'ACC-0001', created_date: '2024-03-12', closed_date: '2024-03-13', priority: 'P2', status: 'Closed',  case_category: 'Data Loss',   resolution_time_hours: 24,   reopened: false },
      { case_id: 'CS-10445', account_id: 'ACC-0005', created_date: '2024-03-14', closed_date: null,          priority: 'P1', status: 'Open',    case_category: 'Bug',         resolution_time_hours: null, reopened: false },
    ],
    columns: [
      { id: 'case_id',            name: 'case_id',            type: 'string', nullable: false, classification: 'key', description: 'Unique support case identifier.', aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'account_id',         name: 'account_id',         type: 'string', nullable: false, classification: 'key', description: 'Account that filed the case.', aiContext: 'Join to DIM_ACCOUNTS on account_id.', nullRate: 0, duplicateCount: 0 },
      { id: 'created_date',       name: 'created_date',       type: 'date',   nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'closed_date',        name: 'closed_date',        type: 'date',   nullable: true,  classification: 'attribute', description: null, aiContext: null, nullRate: 22, duplicateCount: 0 },
      { id: 'priority',           name: 'priority',           type: 'string', nullable: false, classification: 'attribute', description: 'Case priority: P1, P2, P3, P4.', aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'status',             name: 'status',             type: 'string', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'case_category',      name: 'case_category',      type: 'string', nullable: true,  classification: 'attribute', description: null, aiContext: null, nullRate: 9, duplicateCount: 0 },
      { id: 'resolution_time_hours', name: 'resolution_time_hours', type: 'number', nullable: true, classification: 'measure', description: 'Hours from case creation to resolution.', aiContext: null, aggregation: 'AVG', isAdditive: false, nullRate: 22, duplicateCount: 0 },
      { id: 'reopened',           name: 'reopened',           type: 'boolean', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
    ],
  },

  call_metrics: {
    id: 'call_metrics', name: 'CALL_METRICS', connection: 'SF_PROD_CUSTOMER', connectionType: 'snowflake',
    description: 'Gong call recordings and sentiment analysis — one row per customer call.',
    rowCount: 31000, lastSynced: '2024-03-28T06:00:00Z', qualityIssues: [],
    owner: 'GTM Analytics (Sana Kapoor)', dqScore: 88,
    sampleRows: [
      { call_id: 'CALL-7701', account_id: 'ACC-0001', call_date: '2024-03-20', duration_minutes: 42, sentiment_score: 0.71, talk_ratio_rep: 0.48, next_steps_mentioned: true,  deal_risk_flag: false },
      { call_id: 'CALL-7702', account_id: 'ACC-0003', call_date: '2024-03-21', duration_minutes: 28, sentiment_score: 0.34, talk_ratio_rep: 0.62, next_steps_mentioned: false, deal_risk_flag: true  },
      { call_id: 'CALL-7703', account_id: 'ACC-0002', call_date: '2024-03-22', duration_minutes: 55, sentiment_score: null, talk_ratio_rep: null, next_steps_mentioned: true,  deal_risk_flag: false },
      { call_id: 'CALL-7704', account_id: 'ACC-0005', call_date: '2024-03-23', duration_minutes: 18, sentiment_score: 0.58, talk_ratio_rep: 0.51, next_steps_mentioned: false, deal_risk_flag: false },
      { call_id: 'CALL-7705', account_id: 'ACC-0001', call_date: '2024-03-24', duration_minutes: 37, sentiment_score: 0.82, talk_ratio_rep: 0.44, next_steps_mentioned: true,  deal_risk_flag: false },
    ],
    columns: [
      { id: 'call_id',             name: 'call_id',             type: 'string', nullable: false, classification: 'key', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'account_id',          name: 'account_id',          type: 'string', nullable: false, classification: 'key', description: 'Account on the call.', aiContext: 'Join to DIM_ACCOUNTS on account_id.', nullRate: 0, duplicateCount: 0 },
      { id: 'call_date',           name: 'call_date',           type: 'date',   nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'duration_minutes',    name: 'duration_minutes',    type: 'number', nullable: false, classification: 'measure', description: null, aiContext: null, aggregation: 'AVG', isAdditive: false, nullRate: 0, duplicateCount: 0 },
      { id: 'sentiment_score',     name: 'sentiment_score',     type: 'number', nullable: true,  classification: 'measure', description: 'Gong sentiment score 0–1. Higher = more positive.', aiContext: 'Key health signal — low scores indicate at-risk accounts.', aggregation: 'AVG', isAdditive: false, nullRate: 3, duplicateCount: 0 },
      { id: 'talk_ratio_rep',      name: 'talk_ratio_rep',      type: 'number', nullable: true,  classification: 'measure', description: null, aiContext: null, aggregation: 'AVG', isAdditive: false, nullRate: 3, duplicateCount: 0 },
      { id: 'next_steps_mentioned', name: 'next_steps_mentioned', type: 'boolean', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'deal_risk_flag',      name: 'deal_risk_flag',      type: 'boolean', nullable: false, classification: 'attribute', description: 'True if Gong detected deal risk language.', aiContext: null, nullRate: 0, duplicateCount: 0 },
    ],
  },

  customer_found_defects: {
    id: 'customer_found_defects', name: 'CUSTOMER_FOUND_DEFECTS', connection: 'SF_PROD_CUSTOMER', connectionType: 'snowflake',
    description: 'Engineering bugs and defects reported by customers via JIRA.',
    rowCount: 6200, lastSynced: '2024-03-28T06:00:00Z', qualityIssues: [],
    owner: 'Engineering Ops (Dev Sharma)', dqScore: 91,
    sampleRows: [
      { defect_id: 'DEF-3301', account_id: 'ACC-0003', reported_date: '2024-02-10', severity: 'S1', status: 'Open',     resolution_days: null, escalated_to_engineering: true  },
      { defect_id: 'DEF-3302', account_id: 'ACC-0001', reported_date: '2024-02-14', severity: 'S2', status: 'Resolved', resolution_days: 12,   escalated_to_engineering: false },
      { defect_id: 'DEF-3303', account_id: 'ACC-0002', reported_date: '2024-02-18', severity: 'S3', status: 'Resolved', resolution_days: 5,    escalated_to_engineering: false },
      { defect_id: 'DEF-3304', account_id: 'ACC-0005', reported_date: '2024-03-01', severity: 'S2', status: 'Open',     resolution_days: null, escalated_to_engineering: true  },
      { defect_id: 'DEF-3305', account_id: 'ACC-0003', reported_date: '2024-03-05', severity: 'S1', status: 'Open',     resolution_days: null, escalated_to_engineering: true  },
    ],
    columns: [
      { id: 'defect_id',           name: 'defect_id',           type: 'string', nullable: false, classification: 'key', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'account_id',          name: 'account_id',          type: 'string', nullable: false, classification: 'key', description: 'Account that reported the defect.', aiContext: 'Join to DIM_ACCOUNTS on account_id.', nullRate: 0, duplicateCount: 0 },
      { id: 'reported_date',       name: 'reported_date',       type: 'date',   nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'severity',            name: 'severity',            type: 'string', nullable: false, classification: 'attribute', description: 'Defect severity: S1 (Critical), S2 (Major), S3 (Minor).', aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'status',              name: 'status',              type: 'string', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'resolution_days',     name: 'resolution_days',     type: 'number', nullable: true,  classification: 'measure', description: null, aiContext: null, aggregation: 'AVG', isAdditive: false, nullRate: 31, duplicateCount: 0 },
      { id: 'escalated_to_engineering', name: 'escalated_to_engineering', type: 'boolean', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
    ],
  },

  // ─── Spotstore tables (created by agent during multi-source ingestion) ─────────

  pendo_nps_enriched: {
    id: 'pendo_nps_enriched', name: 'pendo_nps_enriched', connection: 'ThoughtSpot CDW (Spotstore)', connectionType: 'thoughtspot',
    description: 'Pendo NPS responses enriched with VADER sentiment scores — fetched and written by the ingestion notebook.',
    rowCount: 2847, lastSynced: '2024-03-28T14:55:00Z', dqScore: 92, owner: 'Agent (pendo_nps_ingestion.ipynb)', qualityIssues: [],
    sampleRows: [
      { account_id: 'ACC-0001', nps_score: 9, nps_comments: 'Great support, very responsive team.', sentiment: 'positive', sentiment_score: 0.74, response_date: '2024-03-15' },
      { account_id: 'ACC-0002', nps_score: 3, nps_comments: 'Onboarding was confusing, needed more help.', sentiment: 'negative', sentiment_score: -0.51, response_date: '2024-03-16' },
      { account_id: 'ACC-0003', nps_score: 8, nps_comments: 'Good tool, occasional slowness in reports.', sentiment: 'positive', sentiment_score: 0.34, response_date: '2024-03-16' },
      { account_id: 'ACC-0004', nps_score: 5, nps_comments: null, sentiment: 'neutral', sentiment_score: 0.0, response_date: '2024-03-17' },
      { account_id: 'ACC-0005', nps_score: 10, nps_comments: 'Excellent product. We love the AI features.', sentiment: 'positive', sentiment_score: 0.89, response_date: '2024-03-17' },
    ],
    columns: [
      { id: 'account_id',     name: 'account_id',     type: 'string', nullable: false, classification: 'key', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'nps_score',      name: 'nps_score',      type: 'number', nullable: false, classification: 'measure', description: 'NPS score 0–10.', aiContext: null, aggregation: 'AVG', isAdditive: false, nullRate: 0, duplicateCount: 0 },
      { id: 'nps_comments',   name: 'nps_comments',   type: 'string', nullable: true,  classification: 'attribute', description: 'Raw verbatim NPS comment text.', aiContext: null, nullRate: 38, duplicateCount: 0 },
      { id: 'sentiment',      name: 'sentiment',      type: 'string', nullable: false, classification: 'attribute', description: 'VADER sentiment label: positive, neutral, or negative.', aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'sentiment_score', name: 'sentiment_score', type: 'number', nullable: false, classification: 'measure', description: 'VADER compound sentiment score −1 to 1.', aiContext: null, aggregation: 'AVG', isAdditive: false, nullRate: 0, duplicateCount: 0 },
      { id: 'response_date',  name: 'response_date',  type: 'date',   nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
    ],
  },

  csm_account_mapping: {
    id: 'csm_account_mapping', name: 'csm_account_mapping', connection: 'ThoughtSpot CDW (Spotstore)', connectionType: 'thoughtspot',
    description: 'CSM and executive sponsor mapping per account — uploaded from CSM_MAPPING_Q2.csv.',
    rowCount: 142, lastSynced: '2024-03-28T14:56:00Z', dqScore: 98, owner: 'Agent (CSV upload)', qualityIssues: [],
    sampleRows: [
      { account_id: 'ACC-0001', csm_name: 'Priya Sharma', exec_sponsor: 'Ravi Menon', csm_region: 'APAC', account_tier: 'Enterprise' },
      { account_id: 'ACC-0002', csm_name: 'Liam Chen', exec_sponsor: null, csm_region: 'NA', account_tier: 'Mid-Market' },
      { account_id: 'ACC-0003', csm_name: 'Fatima Al-Hassan', exec_sponsor: 'Mark Johansson', csm_region: 'EMEA', account_tier: 'Enterprise' },
      { account_id: 'ACC-0004', csm_name: 'Carlos Medina', exec_sponsor: null, csm_region: 'NA', account_tier: 'SMB' },
      { account_id: 'ACC-0005', csm_name: 'Priya Sharma', exec_sponsor: 'Ananya Rao', csm_region: 'APAC', account_tier: 'Mid-Market' },
    ],
    columns: [
      { id: 'account_id',   name: 'account_id',   type: 'string', nullable: false, classification: 'key', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'csm_name',     name: 'csm_name',     type: 'string', nullable: false, classification: 'attribute', description: 'Name of the Customer Success Manager assigned to this account.', aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'exec_sponsor', name: 'exec_sponsor', type: 'string', nullable: true,  classification: 'attribute', description: 'Executive sponsor from the customer side.', aiContext: null, nullRate: 14, duplicateCount: 0 },
      { id: 'csm_region',   name: 'csm_region',   type: 'string', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
      { id: 'account_tier', name: 'account_tier', type: 'string', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0 },
    ],
  },

  customer_health_external: {
    id: 'customer_health_external', name: 'customer_health_external', connection: 'ThoughtSpot CDW (Spotstore)', connectionType: 'thoughtspot',
    description: 'Unified staging table — Pendo NPS enriched with CSM mapping, compiled by the agent.',
    rowCount: 2847, lastSynced: '2024-03-28T14:57:00Z', qualityIssues: [],
    isStaging: true,
    columns: [
      { id: 'account_id',     name: 'account_id',     type: 'string', nullable: false, classification: 'key', description: null, aiContext: null, nullRate: 0, duplicateCount: 0, sourceTable: 'pendo_nps_enriched', sourceColumn: 'account_id' },
      { id: 'nps_score',      name: 'nps_score',      type: 'number', nullable: false, classification: 'measure', description: null, aiContext: null, aggregation: 'AVG', isAdditive: false, nullRate: 0, duplicateCount: 0, sourceTable: 'pendo_nps_enriched', sourceColumn: 'nps_score' },
      { id: 'nps_comments',   name: 'nps_comments',   type: 'string', nullable: true,  classification: 'attribute', description: null, aiContext: null, nullRate: 38, duplicateCount: 0, sourceTable: 'pendo_nps_enriched', sourceColumn: 'nps_comments' },
      { id: 'sentiment',      name: 'sentiment',      type: 'string', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0, sourceTable: 'pendo_nps_enriched', sourceColumn: 'sentiment' },
      { id: 'sentiment_score', name: 'sentiment_score', type: 'number', nullable: false, classification: 'measure', description: null, aiContext: null, aggregation: 'AVG', isAdditive: false, nullRate: 0, duplicateCount: 0, sourceTable: 'pendo_nps_enriched', sourceColumn: 'sentiment_score' },
      { id: 'csm_name',       name: 'csm_name',       type: 'string', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0, sourceTable: 'csm_account_mapping', sourceColumn: 'csm_name' },
      { id: 'exec_sponsor',   name: 'exec_sponsor',   type: 'string', nullable: true,  classification: 'attribute', description: null, aiContext: null, nullRate: 14, duplicateCount: 0, sourceTable: 'csm_account_mapping', sourceColumn: 'exec_sponsor' },
      { id: 'csm_region',     name: 'csm_region',     type: 'string', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0, sourceTable: 'csm_account_mapping', sourceColumn: 'csm_region' },
      { id: 'account_tier',   name: 'account_tier',   type: 'string', nullable: false, classification: 'attribute', description: null, aiContext: null, nullRate: 0, duplicateCount: 0, sourceTable: 'csm_account_mapping', sourceColumn: 'account_tier' },
    ],
  },
};

// ─── Customer Health Scorecard — joined output (multi-source model) ───────────
// Derived from: DIM_ACCOUNTS + SUPPORT_CASES + CALL_METRICS + CUSTOMER_FOUND_DEFECTS + customer_health_external
// One row per account. p1_cases_open and open_defects are derived via COUNT() FILTER.
// customer_health_score: NPS 30% + support 20% + call sentiment 25% + defect rate 25%

export interface CustomerHealthRow {
  account_id: string;
  account_name: string;
  industry: string | null;
  arr: number;
  region: string;
  account_tier: string;           // from csm_account_mapping (overrides dim_accounts.account_tier)
  renewal_date: string | null;
  p1_cases_open: number;          // COUNT(*) FILTER (WHERE priority='P1' AND status='Open')
  avg_call_sentiment: number | null;
  deal_risk_flag: boolean;
  nps_score: number;
  sentiment: string;
  sentiment_score: number;
  csm_name: string;
  exec_sponsor: string | null;
  csm_region: string;
  customer_health_score: number;  // composite 0.0–1.0
}

export const customerHealthData: CustomerHealthRow[] = [
  {
    account_id: 'ACC-0001', account_name: 'Acme Corp',       industry: 'Manufacturing', arr: 240000, region: 'APAC', account_tier: 'Enterprise',
    renewal_date: '2024-09-30', p1_cases_open: 0, avg_call_sentiment: 0.77, deal_risk_flag: false,
    nps_score: 9, sentiment: 'positive', sentiment_score: 0.74, csm_name: 'Priya Sharma', exec_sponsor: 'Ravi Menon',       csm_region: 'APAC',
    customer_health_score: 0.94,
  },
  {
    account_id: 'ACC-0002', account_name: 'Globex Inc',      industry: 'Retail',        arr: 85000,  region: 'NA',   account_tier: 'Mid-Market',
    renewal_date: '2024-11-15', p1_cases_open: 0, avg_call_sentiment: null,  deal_risk_flag: false,
    nps_score: 3, sentiment: 'negative', sentiment_score: -0.51, csm_name: 'Liam Chen',     exec_sponsor: null,              csm_region: 'NA',
    customer_health_score: 0.64,
  },
  {
    account_id: 'ACC-0003', account_name: 'Initech LLC',     industry: 'Technology',    arr: 420000, region: 'EMEA', account_tier: 'Enterprise',
    renewal_date: '2025-01-31', p1_cases_open: 1, avg_call_sentiment: 0.34, deal_risk_flag: true,
    nps_score: 8, sentiment: 'positive', sentiment_score: 0.34, csm_name: 'Fatima Al-Hassan', exec_sponsor: 'Mark Johansson', csm_region: 'EMEA',
    customer_health_score: 0.52,
  },
  {
    account_id: 'ACC-0004', account_name: 'Umbrella Co',     industry: null,            arr: 32000,  region: 'NA',   account_tier: 'SMB',
    renewal_date: '2024-08-20', p1_cases_open: 0, avg_call_sentiment: null,  deal_risk_flag: false,
    nps_score: 5, sentiment: 'neutral', sentiment_score: 0.0, csm_name: 'Carlos Medina', exec_sponsor: null,               csm_region: 'NA',
    customer_health_score: 0.64,
  },
  {
    account_id: 'ACC-0005', account_name: 'Soylent Systems', industry: 'Healthcare',    arr: 190000, region: 'APAC', account_tier: 'Mid-Market',
    renewal_date: null,         p1_cases_open: 1, avg_call_sentiment: 0.58, deal_risk_flag: false,
    nps_score: 10, sentiment: 'positive', sentiment_score: 0.89, csm_name: 'Priya Sharma', exec_sponsor: 'Ananya Rao',      csm_region: 'APAC',
    customer_health_score: 0.70,
  },
];

// ─── Orders Data (50 rows) ────────────────────────────────────────────────────
// Date format: MM/DD/YYYY (intentional — conflicts with campaigns)
// Issues: 9 null campaign_ids, 5 duplicates (ORD-007, ORD-023 appear twice; ORD-041 three times)
// 2 amount anomalies: ORD-034 = -240, ORD-089 = 48200

export interface Order {
  order_id: string;
  user_id: string;
  campaign_id: string | null;
  order_date: string; // MM/DD/YYYY
  amount: number;
  product_category: string;
  status: string;
  region: string;
}

export const ordersData: Order[] = [
  { order_id: 'ORD-001', user_id: 'USR-012', campaign_id: 'CAM-003', order_date: '01/14/2024', amount: 128.50,  product_category: 'Apparel',     status: 'completed', region: 'West'  },
  { order_id: 'ORD-002', user_id: 'USR-007', campaign_id: 'CAM-001', order_date: '01/15/2024', amount: 245.00,  product_category: 'Electronics',  status: 'completed', region: 'East'  },
  { order_id: 'ORD-003', user_id: 'USR-023', campaign_id: null,       order_date: '01/15/2024', amount: 89.99,   product_category: 'Home',         status: 'completed', region: 'North' },
  { order_id: 'ORD-004', user_id: 'USR-005', campaign_id: 'CAM-002', order_date: '01/16/2024', amount: 310.00,  product_category: 'Apparel',     status: 'completed', region: 'West'  },
  { order_id: 'ORD-005', user_id: 'USR-018', campaign_id: 'CAM-005', order_date: '01/17/2024', amount: 67.25,   product_category: 'Beauty',       status: 'pending',   region: 'South' },
  { order_id: 'ORD-006', user_id: 'USR-031', campaign_id: null,       order_date: '01/18/2024', amount: 189.00,  product_category: 'Sports',       status: 'completed', region: 'East'  },
  { order_id: 'ORD-007', user_id: 'USR-009', campaign_id: 'CAM-004', order_date: '01/19/2024', amount: 420.00,  product_category: 'Electronics',  status: 'completed', region: 'West'  },
  { order_id: 'ORD-007', user_id: 'USR-009', campaign_id: 'CAM-004', order_date: '01/19/2024', amount: 420.00,  product_category: 'Electronics',  status: 'completed', region: 'West'  }, // DUPLICATE
  { order_id: 'ORD-008', user_id: 'USR-014', campaign_id: 'CAM-001', order_date: '01/20/2024', amount: 55.00,   product_category: 'Beauty',       status: 'completed', region: 'North' },
  { order_id: 'ORD-009', user_id: 'USR-027', campaign_id: 'CAM-006', order_date: '01/21/2024', amount: 275.50,  product_category: 'Apparel',     status: 'cancelled', region: 'South' },
  { order_id: 'ORD-010', user_id: 'USR-002', campaign_id: null,       order_date: '01/22/2024', amount: 140.00,  product_category: 'Home',         status: 'completed', region: 'West'  },
  { order_id: 'ORD-011', user_id: 'USR-019', campaign_id: 'CAM-002', order_date: '01/23/2024', amount: 390.00,  product_category: 'Electronics',  status: 'completed', region: 'East'  },
  { order_id: 'ORD-012', user_id: 'USR-008', campaign_id: 'CAM-003', order_date: '01/24/2024', amount: 115.75,  product_category: 'Apparel',     status: 'refunded',  region: 'North' },
  { order_id: 'ORD-013', user_id: 'USR-022', campaign_id: 'CAM-007', order_date: '01/25/2024', amount: 88.00,   product_category: 'Sports',       status: 'completed', region: 'West'  },
  { order_id: 'ORD-014', user_id: 'USR-030', campaign_id: null,       order_date: '01/26/2024', amount: 199.99,  product_category: 'Beauty',       status: 'completed', region: 'South' },
  { order_id: 'ORD-015', user_id: 'USR-011', campaign_id: 'CAM-005', order_date: '01/28/2024', amount: 465.00,  product_category: 'Electronics',  status: 'completed', region: 'East'  },
  { order_id: 'ORD-016', user_id: 'USR-025', campaign_id: 'CAM-001', order_date: '01/29/2024', amount: 78.50,   product_category: 'Home',         status: 'pending',   region: 'North' },
  { order_id: 'ORD-017', user_id: 'USR-003', campaign_id: 'CAM-008', order_date: '02/01/2024', amount: 320.00,  product_category: 'Apparel',     status: 'completed', region: 'West'  },
  { order_id: 'ORD-018', user_id: 'USR-016', campaign_id: 'CAM-004', order_date: '02/02/2024', amount: 155.00,  product_category: 'Sports',       status: 'completed', region: 'South' },
  { order_id: 'ORD-019', user_id: 'USR-028', campaign_id: null,       order_date: '02/03/2024', amount: 92.25,   product_category: 'Beauty',       status: 'completed', region: 'East'  },
  { order_id: 'ORD-020', user_id: 'USR-006', campaign_id: 'CAM-002', order_date: '02/04/2024', amount: 510.00,  product_category: 'Electronics',  status: 'completed', region: 'West'  },
  { order_id: 'ORD-021', user_id: 'USR-021', campaign_id: 'CAM-006', order_date: '02/05/2024', amount: 235.00,  product_category: 'Apparel',     status: 'completed', region: 'North' },
  { order_id: 'ORD-022', user_id: 'USR-013', campaign_id: 'CAM-003', order_date: '02/06/2024', amount: 175.50,  product_category: 'Home',         status: 'cancelled', region: 'South' },
  { order_id: 'ORD-023', user_id: 'USR-017', campaign_id: 'CAM-007', order_date: '02/07/2024', amount: 299.00,  product_category: 'Electronics',  status: 'completed', region: 'East'  },
  { order_id: 'ORD-023', user_id: 'USR-017', campaign_id: 'CAM-007', order_date: '02/07/2024', amount: 299.00,  product_category: 'Electronics',  status: 'completed', region: 'East'  }, // DUPLICATE
  { order_id: 'ORD-024', user_id: 'USR-029', campaign_id: null,       order_date: '02/08/2024', amount: 44.00,   product_category: 'Beauty',       status: 'completed', region: 'West'  },
  { order_id: 'ORD-025', user_id: 'USR-004', campaign_id: 'CAM-005', order_date: '02/09/2024', amount: 388.00,  product_category: 'Sports',       status: 'completed', region: 'North' },
  { order_id: 'ORD-026', user_id: 'USR-020', campaign_id: 'CAM-001', order_date: '02/10/2024', amount: 610.00,  product_category: 'Electronics',  status: 'completed', region: 'East'  },
  { order_id: 'ORD-027', user_id: 'USR-010', campaign_id: 'CAM-008', order_date: '02/11/2024', amount: 145.00,  product_category: 'Apparel',     status: 'refunded',  region: 'South' },
  { order_id: 'ORD-028', user_id: 'USR-026', campaign_id: 'CAM-004', order_date: '02/12/2024', amount: 220.00,  product_category: 'Home',         status: 'completed', region: 'West'  },
  { order_id: 'ORD-029', user_id: 'USR-015', campaign_id: null,       order_date: '02/13/2024', amount: 97.50,   product_category: 'Beauty',       status: 'completed', region: 'North' },
  { order_id: 'ORD-030', user_id: 'USR-001', campaign_id: 'CAM-002', order_date: '02/14/2024', amount: 780.00,  product_category: 'Electronics',  status: 'completed', region: 'East'  },
  { order_id: 'ORD-031', user_id: 'USR-024', campaign_id: 'CAM-006', order_date: '02/15/2024', amount: 159.00,  product_category: 'Apparel',     status: 'completed', region: 'West'  },
  { order_id: 'ORD-032', user_id: 'USR-007', campaign_id: 'CAM-003', order_date: '02/16/2024', amount: 340.00,  product_category: 'Sports',       status: 'completed', region: 'South' },
  { order_id: 'ORD-033', user_id: 'USR-018', campaign_id: 'CAM-007', order_date: '02/17/2024', amount: 265.00,  product_category: 'Home',         status: 'pending',   region: 'East'  },
  { order_id: 'ORD-034', user_id: 'USR-012', campaign_id: 'CAM-001', order_date: '02/18/2024', amount: -240.00, product_category: 'Apparel',     status: 'refunded',  region: 'West'  }, // ANOMALY: negative amount
  { order_id: 'ORD-035', user_id: 'USR-023', campaign_id: 'CAM-005', order_date: '02/19/2024', amount: 195.00,  product_category: 'Electronics',  status: 'completed', region: 'North' },
  { order_id: 'ORD-036', user_id: 'USR-030', campaign_id: null,       order_date: '02/20/2024', amount: 82.00,   product_category: 'Beauty',       status: 'completed', region: 'South' },
  { order_id: 'ORD-037', user_id: 'USR-005', campaign_id: 'CAM-008', order_date: '02/21/2024', amount: 415.00,  product_category: 'Apparel',     status: 'completed', region: 'East'  },
  { order_id: 'ORD-038', user_id: 'USR-019', campaign_id: 'CAM-004', order_date: '02/22/2024', amount: 550.00,  product_category: 'Electronics',  status: 'completed', region: 'West'  },
  { order_id: 'ORD-039', user_id: 'USR-008', campaign_id: 'CAM-002', order_date: '02/23/2024', amount: 133.25,  product_category: 'Home',         status: 'completed', region: 'North' },
  { order_id: 'ORD-040', user_id: 'USR-022', campaign_id: 'CAM-006', order_date: '02/24/2024', amount: 290.00,  product_category: 'Sports',       status: 'cancelled', region: 'South' },
  { order_id: 'ORD-041', user_id: 'USR-011', campaign_id: 'CAM-003', order_date: '02/25/2024', amount: 178.00,  product_category: 'Apparel',     status: 'completed', region: 'East'  },
  { order_id: 'ORD-041', user_id: 'USR-011', campaign_id: 'CAM-003', order_date: '02/25/2024', amount: 178.00,  product_category: 'Apparel',     status: 'completed', region: 'East'  }, // DUPLICATE
  { order_id: 'ORD-041', user_id: 'USR-011', campaign_id: 'CAM-003', order_date: '02/25/2024', amount: 178.00,  product_category: 'Apparel',     status: 'completed', region: 'East'  }, // DUPLICATE
  { order_id: 'ORD-042', user_id: 'USR-027', campaign_id: 'CAM-007', order_date: '03/01/2024', amount: 445.00,  product_category: 'Electronics',  status: 'completed', region: 'West'  },
  { order_id: 'ORD-043', user_id: 'USR-014', campaign_id: 'CAM-005', order_date: '03/02/2024', amount: 62.00,   product_category: 'Beauty',       status: 'completed', region: 'North' },
  { order_id: 'ORD-044', user_id: 'USR-002', campaign_id: null,       order_date: '03/03/2024', amount: 315.00,  product_category: 'Home',         status: 'completed', region: 'East'  },
  { order_id: 'ORD-045', user_id: 'USR-016', campaign_id: 'CAM-001', order_date: '03/04/2024', amount: 499.00,  product_category: 'Apparel',     status: 'completed', region: 'South' },
  { order_id: 'ORD-046', user_id: 'USR-028', campaign_id: 'CAM-008', order_date: '03/05/2024', amount: 225.00,  product_category: 'Sports',       status: 'pending',   region: 'West'  },
  { order_id: 'ORD-047', user_id: 'USR-003', campaign_id: 'CAM-004', order_date: '03/06/2024', amount: 680.00,  product_category: 'Electronics',  status: 'completed', region: 'East'  },
  { order_id: 'ORD-048', user_id: 'USR-021', campaign_id: 'CAM-002', order_date: '03/07/2024', amount: 147.50,  product_category: 'Beauty',       status: 'completed', region: 'North' },
  { order_id: 'ORD-049', user_id: 'USR-025', campaign_id: 'CAM-006', order_date: '03/08/2024', amount: 356.00,  product_category: 'Apparel',     status: 'completed', region: 'South' },
  { order_id: 'ORD-050', user_id: 'USR-009', campaign_id: 'CAM-003', order_date: '03/09/2024', amount: 48200.00, product_category: 'Electronics', status: 'completed', region: 'West'  }, // ANOMALY: extreme outlier
  // ── rows 51–150 ──
  { order_id: 'ORD-051', user_id: 'USR-031', campaign_id: 'CAM-009', order_date: '03/10/2024', amount: 210.00,  product_category: 'Apparel',     status: 'completed', region: 'West'  },
  { order_id: 'ORD-052', user_id: 'USR-032', campaign_id: null,       order_date: '03/10/2024', amount: 145.50,  product_category: 'Beauty',      status: 'completed', region: 'East'  },
  { order_id: 'ORD-053', user_id: 'USR-033', campaign_id: 'CAM-010', order_date: '03/11/2024', amount: 320.00,  product_category: 'Sports',      status: 'completed', region: 'North' },
  { order_id: 'ORD-054', user_id: 'USR-034', campaign_id: 'CAM-002', order_date: '03/11/2024', amount: 88.75,   product_category: 'Home',        status: 'pending',   region: 'South' },
  { order_id: 'ORD-055', user_id: 'USR-035', campaign_id: 'CAM-011', order_date: '03/12/2024', amount: 450.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-056', user_id: 'USR-036', campaign_id: null,       order_date: '03/12/2024', amount: 67.00,   product_category: 'Beauty',      status: 'completed', region: 'East'  },
  { order_id: 'ORD-057', user_id: 'USR-037', campaign_id: 'CAM-009', order_date: '03/13/2024', amount: 195.00,  product_category: 'Apparel',     status: 'cancelled', region: 'North' },
  { order_id: 'ORD-058', user_id: 'USR-038', campaign_id: 'CAM-012', order_date: '03/13/2024', amount: 530.00,  product_category: 'Electronics', status: 'completed', region: 'South' },
  { order_id: 'ORD-059', user_id: 'USR-039', campaign_id: 'CAM-010', order_date: '03/14/2024', amount: 112.00,  product_category: 'Home',        status: 'completed', region: 'West'  },
  { order_id: 'ORD-060', user_id: 'USR-040', campaign_id: null,       order_date: '03/14/2024', amount: 275.50,  product_category: 'Apparel',     status: 'completed', region: 'East'  },
  { order_id: 'ORD-061', user_id: 'USR-041', campaign_id: 'CAM-013', order_date: '03/15/2024', amount: 349.00,  product_category: 'Sports',      status: 'completed', region: 'North' },
  { order_id: 'ORD-062', user_id: 'USR-042', campaign_id: 'CAM-001', order_date: '03/15/2024', amount: 99.00,   product_category: 'Beauty',      status: 'refunded',  region: 'South' },
  { order_id: 'ORD-063', user_id: 'USR-043', campaign_id: 'CAM-014', order_date: '03/16/2024', amount: 620.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-064', user_id: 'USR-044', campaign_id: 'CAM-002', order_date: '03/16/2024', amount: 158.00,  product_category: 'Home',        status: 'completed', region: 'East'  },
  { order_id: 'ORD-065', user_id: 'USR-045', campaign_id: null,       order_date: '03/17/2024', amount: 233.00,  product_category: 'Apparel',     status: 'completed', region: 'North' },
  { order_id: 'ORD-066', user_id: 'USR-046', campaign_id: 'CAM-011', order_date: '03/17/2024', amount: 410.00,  product_category: 'Sports',      status: 'completed', region: 'South' },
  { order_id: 'ORD-067', user_id: 'USR-047', campaign_id: 'CAM-013', order_date: '03/18/2024', amount: 75.50,   product_category: 'Beauty',      status: 'completed', region: 'West'  },
  { order_id: 'ORD-068', user_id: 'USR-048', campaign_id: 'CAM-009', order_date: '03/18/2024', amount: 290.00,  product_category: 'Apparel',     status: 'pending',   region: 'East'  },
  { order_id: 'ORD-069', user_id: 'USR-049', campaign_id: 'CAM-010', order_date: '03/19/2024', amount: 185.00,  product_category: 'Electronics', status: 'completed', region: 'North' },
  { order_id: 'ORD-070', user_id: 'USR-050', campaign_id: null,       order_date: '03/19/2024', amount: 44.00,   product_category: 'Home',        status: 'completed', region: 'South' },
  { order_id: 'ORD-071', user_id: 'USR-051', campaign_id: 'CAM-012', order_date: '03/20/2024', amount: 560.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-072', user_id: 'USR-052', campaign_id: 'CAM-014', order_date: '03/20/2024', amount: 127.00,  product_category: 'Beauty',      status: 'completed', region: 'East'  },
  { order_id: 'ORD-073', user_id: 'USR-053', campaign_id: 'CAM-003', order_date: '03/21/2024', amount: 375.00,  product_category: 'Apparel',     status: 'completed', region: 'North' },
  { order_id: 'ORD-074', user_id: 'USR-054', campaign_id: null,       order_date: '03/21/2024', amount: 218.00,  product_category: 'Sports',      status: 'cancelled', region: 'South' },
  { order_id: 'ORD-075', user_id: 'USR-055', campaign_id: 'CAM-005', order_date: '03/22/2024', amount: 490.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-076', user_id: 'USR-056', campaign_id: 'CAM-013', order_date: '03/22/2024', amount: 93.00,   product_category: 'Home',        status: 'completed', region: 'East'  },
  { order_id: 'ORD-077', user_id: 'USR-057', campaign_id: 'CAM-007', order_date: '03/23/2024', amount: 342.00,  product_category: 'Apparel',     status: 'refunded',  region: 'North' },
  { order_id: 'ORD-078', user_id: 'USR-058', campaign_id: null,       order_date: '03/23/2024', amount: 167.50,  product_category: 'Beauty',      status: 'completed', region: 'South' },
  { order_id: 'ORD-079', user_id: 'USR-059', campaign_id: 'CAM-009', order_date: '03/24/2024', amount: 255.00,  product_category: 'Sports',      status: 'completed', region: 'West'  },
  { order_id: 'ORD-080', user_id: 'USR-060', campaign_id: 'CAM-014', order_date: '03/24/2024', amount: 710.00,  product_category: 'Electronics', status: 'completed', region: 'East'  },
  { order_id: 'ORD-081', user_id: 'USR-061', campaign_id: 'CAM-006', order_date: '03/25/2024', amount: 138.00,  product_category: 'Home',        status: 'completed', region: 'North' },
  { order_id: 'ORD-082', user_id: 'USR-062', campaign_id: null,       order_date: '03/25/2024', amount: 59.00,   product_category: 'Beauty',      status: 'completed', region: 'South' },
  { order_id: 'ORD-083', user_id: 'USR-063', campaign_id: 'CAM-010', order_date: '03/26/2024', amount: 398.00,  product_category: 'Apparel',     status: 'completed', region: 'West'  },
  { order_id: 'ORD-084', user_id: 'USR-064', campaign_id: 'CAM-002', order_date: '03/26/2024', amount: 175.00,  product_category: 'Sports',      status: 'pending',   region: 'East'  },
  { order_id: 'ORD-085', user_id: 'USR-065', campaign_id: 'CAM-011', order_date: '03/27/2024', amount: 522.00,  product_category: 'Electronics', status: 'completed', region: 'North' },
  { order_id: 'ORD-086', user_id: 'USR-066', campaign_id: null,       order_date: '03/27/2024', amount: 84.00,   product_category: 'Home',        status: 'completed', region: 'South' },
  { order_id: 'ORD-087', user_id: 'USR-067', campaign_id: 'CAM-012', order_date: '03/28/2024', amount: 267.00,  product_category: 'Apparel',     status: 'completed', region: 'West'  },
  { order_id: 'ORD-088', user_id: 'USR-068', campaign_id: 'CAM-014', order_date: '03/28/2024', amount: 431.00,  product_category: 'Beauty',      status: 'completed', region: 'East'  },
  { order_id: 'ORD-089', user_id: 'USR-069', campaign_id: 'CAM-009', order_date: '03/29/2024', amount: -185.00, product_category: 'Electronics', status: 'refunded',  region: 'North' }, // ANOMALY: negative
  { order_id: 'ORD-090', user_id: 'USR-070', campaign_id: null,       order_date: '03/29/2024', amount: 144.00,  product_category: 'Sports',      status: 'completed', region: 'South' },
  { order_id: 'ORD-091', user_id: 'USR-031', campaign_id: 'CAM-013', order_date: '03/30/2024', amount: 308.00,  product_category: 'Apparel',     status: 'completed', region: 'West'  },
  { order_id: 'ORD-091', user_id: 'USR-031', campaign_id: 'CAM-013', order_date: '03/30/2024', amount: 308.00,  product_category: 'Apparel',     status: 'completed', region: 'West'  }, // DUPLICATE
  { order_id: 'ORD-092', user_id: 'USR-072', campaign_id: 'CAM-010', order_date: '03/30/2024', amount: 191.00,  product_category: 'Home',        status: 'completed', region: 'East'  },
  { order_id: 'ORD-093', user_id: 'USR-073', campaign_id: 'CAM-007', order_date: '04/01/2024', amount: 475.00,  product_category: 'Electronics', status: 'completed', region: 'North' },
  { order_id: 'ORD-094', user_id: 'USR-074', campaign_id: null,       order_date: '04/01/2024', amount: 62.00,   product_category: 'Beauty',      status: 'completed', region: 'South' },
  { order_id: 'ORD-095', user_id: 'USR-075', campaign_id: 'CAM-014', order_date: '04/02/2024', amount: 55900.00,product_category: 'Electronics', status: 'completed', region: 'West'  }, // ANOMALY: extreme outlier
  { order_id: 'ORD-096', user_id: 'USR-076', campaign_id: 'CAM-002', order_date: '04/02/2024', amount: 229.00,  product_category: 'Apparel',     status: 'completed', region: 'East'  },
  { order_id: 'ORD-097', user_id: 'USR-077', campaign_id: 'CAM-011', order_date: '04/03/2024', amount: 388.00,  product_category: 'Sports',      status: 'cancelled', region: 'North' },
  { order_id: 'ORD-098', user_id: 'USR-078', campaign_id: null,       order_date: '04/03/2024', amount: 117.00,  product_category: 'Home',        status: 'completed', region: 'South' },
  { order_id: 'ORD-099', user_id: 'USR-079', campaign_id: 'CAM-009', order_date: '04/04/2024', amount: 543.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-100', user_id: 'USR-080', campaign_id: 'CAM-013', order_date: '04/04/2024', amount: 156.00,  product_category: 'Apparel',     status: 'completed', region: 'East'  },
  { order_id: 'ORD-101', user_id: 'USR-081', campaign_id: 'CAM-010', order_date: '04/05/2024', amount: 284.00,  product_category: 'Beauty',      status: 'completed', region: 'North' },
  { order_id: 'ORD-102', user_id: 'USR-082', campaign_id: null,       order_date: '04/05/2024', amount: 371.00,  product_category: 'Sports',      status: 'completed', region: 'South' },
  { order_id: 'ORD-103', user_id: 'USR-083', campaign_id: 'CAM-012', order_date: '04/06/2024', amount: 199.00,  product_category: 'Home',        status: 'pending',   region: 'West'  },
  { order_id: 'ORD-104', user_id: 'USR-084', campaign_id: 'CAM-007', order_date: '04/06/2024', amount: 467.00,  product_category: 'Electronics', status: 'completed', region: 'East'  },
  { order_id: 'ORD-105', user_id: 'USR-085', campaign_id: 'CAM-014', order_date: '04/07/2024', amount: 93.50,   product_category: 'Apparel',     status: 'completed', region: 'North' },
  { order_id: 'ORD-106', user_id: 'USR-086', campaign_id: null,       order_date: '04/07/2024', amount: 312.00,  product_category: 'Beauty',      status: 'completed', region: 'South' },
  { order_id: 'ORD-107', user_id: 'USR-087', campaign_id: 'CAM-003', order_date: '04/08/2024', amount: 588.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-108', user_id: 'USR-088', campaign_id: 'CAM-011', order_date: '04/08/2024', amount: 142.00,  product_category: 'Sports',      status: 'completed', region: 'East'  },
  { order_id: 'ORD-109', user_id: 'USR-089', campaign_id: 'CAM-013', order_date: '04/09/2024', amount: 247.00,  product_category: 'Home',        status: 'refunded',  region: 'North' },
  { order_id: 'ORD-110', user_id: 'USR-090', campaign_id: null,       order_date: '04/09/2024', amount: 79.00,   product_category: 'Beauty',      status: 'completed', region: 'South' },
  { order_id: 'ORD-111', user_id: 'USR-032', campaign_id: 'CAM-009', order_date: '04/10/2024', amount: 415.00,  product_category: 'Apparel',     status: 'completed', region: 'West'  },
  { order_id: 'ORD-112', user_id: 'USR-034', campaign_id: 'CAM-002', order_date: '04/10/2024', amount: 268.00,  product_category: 'Electronics', status: 'completed', region: 'East'  },
  { order_id: 'ORD-113', user_id: 'USR-036', campaign_id: null,       order_date: '04/11/2024', amount: 133.00,  product_category: 'Sports',      status: 'completed', region: 'North' },
  { order_id: 'ORD-114', user_id: 'USR-038', campaign_id: 'CAM-010', order_date: '04/11/2024', amount: 356.00,  product_category: 'Home',        status: 'pending',   region: 'South' },
  { order_id: 'ORD-115', user_id: 'USR-040', campaign_id: 'CAM-012', order_date: '04/12/2024', amount: 492.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-116', user_id: 'USR-042', campaign_id: 'CAM-014', order_date: '04/12/2024', amount: 108.00,  product_category: 'Beauty',      status: 'completed', region: 'East'  },
  { order_id: 'ORD-117', user_id: 'USR-044', campaign_id: null,       order_date: '04/13/2024', amount: 339.00,  product_category: 'Apparel',     status: 'completed', region: 'North' },
  { order_id: 'ORD-118', user_id: 'USR-046', campaign_id: 'CAM-007', order_date: '04/13/2024', amount: 625.00,  product_category: 'Electronics', status: 'completed', region: 'South' },
  { order_id: 'ORD-119', user_id: 'USR-048', campaign_id: 'CAM-011', order_date: '04/14/2024', amount: 177.00,  product_category: 'Sports',      status: 'completed', region: 'West'  },
  { order_id: 'ORD-120', user_id: 'USR-050', campaign_id: null,       order_date: '04/14/2024', amount: 54.00,   product_category: 'Home',        status: 'completed', region: 'East'  },
  { order_id: 'ORD-121', user_id: 'USR-052', campaign_id: 'CAM-013', order_date: '04/15/2024', amount: 281.00,  product_category: 'Beauty',      status: 'cancelled', region: 'North' },
  { order_id: 'ORD-122', user_id: 'USR-054', campaign_id: 'CAM-009', order_date: '04/15/2024', amount: 448.00,  product_category: 'Apparel',     status: 'completed', region: 'South' },
  { order_id: 'ORD-123', user_id: 'USR-056', campaign_id: 'CAM-003', order_date: '04/16/2024', amount: 319.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-124', user_id: 'USR-058', campaign_id: null,       order_date: '04/16/2024', amount: 166.00,  product_category: 'Sports',      status: 'completed', region: 'East'  },
  { order_id: 'ORD-125', user_id: 'USR-060', campaign_id: 'CAM-010', order_date: '04/17/2024', amount: 507.00,  product_category: 'Home',        status: 'completed', region: 'North' },
  { order_id: 'ORD-126', user_id: 'USR-062', campaign_id: 'CAM-014', order_date: '04/17/2024', amount: 88.00,   product_category: 'Beauty',      status: 'completed', region: 'South' },
  { order_id: 'ORD-127', user_id: 'USR-064', campaign_id: 'CAM-006', order_date: '04/18/2024', amount: 392.00,  product_category: 'Apparel',     status: 'refunded',  region: 'West'  },
  { order_id: 'ORD-128', user_id: 'USR-066', campaign_id: null,       order_date: '04/18/2024', amount: 215.00,  product_category: 'Electronics', status: 'completed', region: 'East'  },
  { order_id: 'ORD-129', user_id: 'USR-068', campaign_id: 'CAM-012', order_date: '04/19/2024', amount: 143.00,  product_category: 'Sports',      status: 'completed', region: 'North' },
  { order_id: 'ORD-130', user_id: 'USR-070', campaign_id: 'CAM-002', order_date: '04/19/2024', amount: 336.00,  product_category: 'Home',        status: 'completed', region: 'South' },
  { order_id: 'ORD-131', user_id: 'USR-072', campaign_id: 'CAM-011', order_date: '04/20/2024', amount: 579.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-132', user_id: 'USR-074', campaign_id: null,       order_date: '04/20/2024', amount: 71.00,   product_category: 'Beauty',      status: 'completed', region: 'East'  },
  { order_id: 'ORD-133', user_id: 'USR-076', campaign_id: 'CAM-013', order_date: '04/21/2024', amount: 254.00,  product_category: 'Apparel',     status: 'completed', region: 'North' },
  { order_id: 'ORD-134', user_id: 'USR-078', campaign_id: 'CAM-007', order_date: '04/21/2024', amount: 461.00,  product_category: 'Sports',      status: 'pending',   region: 'South' },
  { order_id: 'ORD-135', user_id: 'USR-080', campaign_id: 'CAM-009', order_date: '04/22/2024', amount: 328.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-136', user_id: 'USR-082', campaign_id: null,       order_date: '04/22/2024', amount: 102.00,  product_category: 'Home',        status: 'completed', region: 'East'  },
  { order_id: 'ORD-137', user_id: 'USR-084', campaign_id: 'CAM-014', order_date: '04/23/2024', amount: 415.00,  product_category: 'Apparel',     status: 'completed', region: 'North' },
  { order_id: 'ORD-138', user_id: 'USR-086', campaign_id: 'CAM-003', order_date: '04/23/2024', amount: 237.00,  product_category: 'Beauty',      status: 'cancelled', region: 'South' },
  { order_id: 'ORD-139', user_id: 'USR-088', campaign_id: 'CAM-010', order_date: '04/24/2024', amount: 693.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-140', user_id: 'USR-090', campaign_id: null,       order_date: '04/24/2024', amount: 158.00,  product_category: 'Sports',      status: 'completed', region: 'East'  },
  { order_id: 'ORD-141', user_id: 'USR-033', campaign_id: 'CAM-012', order_date: '04/25/2024', amount: 344.00,  product_category: 'Home',        status: 'completed', region: 'North' },
  { order_id: 'ORD-142', user_id: 'USR-035', campaign_id: 'CAM-011', order_date: '04/25/2024', amount: 519.00,  product_category: 'Electronics', status: 'completed', region: 'South' },
  { order_id: 'ORD-143', user_id: 'USR-037', campaign_id: null,       order_date: '04/26/2024', amount: 87.00,   product_category: 'Beauty',      status: 'completed', region: 'West'  },
  { order_id: 'ORD-144', user_id: 'USR-039', campaign_id: 'CAM-006', order_date: '04/26/2024', amount: 263.00,  product_category: 'Apparel',     status: 'refunded',  region: 'East'  },
  { order_id: 'ORD-145', user_id: 'USR-041', campaign_id: 'CAM-009', order_date: '04/27/2024', amount: 482.00,  product_category: 'Sports',      status: 'completed', region: 'North' },
  { order_id: 'ORD-146', user_id: 'USR-043', campaign_id: 'CAM-002', order_date: '04/27/2024', amount: 131.00,  product_category: 'Home',        status: 'completed', region: 'South' },
  { order_id: 'ORD-147', user_id: 'USR-045', campaign_id: null,       order_date: '04/28/2024', amount: 367.00,  product_category: 'Electronics', status: 'completed', region: 'West'  },
  { order_id: 'ORD-148', user_id: 'USR-047', campaign_id: 'CAM-013', order_date: '04/28/2024', amount: 214.00,  product_category: 'Apparel',     status: 'completed', region: 'East'  },
  { order_id: 'ORD-149', user_id: 'USR-049', campaign_id: 'CAM-014', order_date: '04/29/2024', amount: 555.00,  product_category: 'Beauty',      status: 'completed', region: 'North' },
  { order_id: 'ORD-150', user_id: 'USR-051', campaign_id: 'CAM-007', order_date: '04/29/2024', amount: -92.00,  product_category: 'Apparel',     status: 'refunded',  region: 'South' }, // ANOMALY: negative
];

// ─── Campaigns Data (15 rows) ─────────────────────────────────────────────────
// Date format: YYYY-MM-DD (intentional — conflicts with orders MM/DD/YYYY)
// Issues: 2 null end_dates (ongoing), 1 duplicate (CAM-008)

export interface Campaign {
  campaign_id: string;
  campaign_name: string;
  channel: string;
  budget: number;
  spend: number;
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  target_region: string;
  status: string;
}

export const campaignsData: Campaign[] = [
  { campaign_id: 'CAM-001', campaign_name: 'Spring Apparel Launch',        channel: 'Social',     budget: 50000,  spend: 47200,  start_date: '2024-01-01', end_date: '2024-02-28', target_region: 'West',  status: 'completed' },
  { campaign_id: 'CAM-002', campaign_name: 'Electronics Q1 Promo',         channel: 'Search',     budget: 80000,  spend: 75500,  start_date: '2024-01-08', end_date: '2024-03-31', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-003', campaign_name: 'Apparel Retargeting — East',   channel: 'Display',    budget: 25000,  spend: 22100,  start_date: '2024-01-15', end_date: '2024-03-15', target_region: 'East',  status: 'completed' },
  { campaign_id: 'CAM-004', campaign_name: 'Influencer — Sports & Outdoors',channel: 'Influencer', budget: 35000,  spend: 34800,  start_date: '2024-01-20', end_date: '2024-02-20', target_region: 'North', status: 'completed' },
  { campaign_id: 'CAM-005', campaign_name: 'Valentine\'s Beauty Push',      channel: 'Email',      budget: 15000,  spend: 13900,  start_date: '2024-02-01', end_date: '2024-02-14', target_region: 'All',   status: 'completed' },
  { campaign_id: 'CAM-006', campaign_name: 'Home Refresh — Spring',         channel: 'Social',     budget: 40000,  spend: 28300,  start_date: '2024-02-10', end_date: null,          target_region: 'South', status: 'active'    }, // NULL end_date
  { campaign_id: 'CAM-007', campaign_name: 'Electronics Brand Awareness',   channel: 'Display',    budget: 60000,  spend: 41200,  start_date: '2024-02-15', end_date: '2024-04-15', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-008', campaign_name: 'Apparel — Premium Segment',     channel: 'Email',      budget: 20000,  spend: 18700,  start_date: '2024-02-20', end_date: '2024-03-31', target_region: 'West',  status: 'active'    },
  { campaign_id: 'CAM-008', campaign_name: 'Apparel — Premium Segment',     channel: 'Email',      budget: 20000,  spend: 18700,  start_date: '2024-02-20', end_date: '2024-03-31', target_region: 'West',  status: 'active'    }, // DUPLICATE
  { campaign_id: 'CAM-009', campaign_name: 'Search — High Intent Buyers',   channel: 'Search',     budget: 45000,  spend: 39100,  start_date: '2024-03-01', end_date: '2024-04-30', target_region: 'East',  status: 'active'    },
  { campaign_id: 'CAM-010', campaign_name: 'Sports — March Madness',        channel: 'Social',     budget: 30000,  spend: 11500,  start_date: '2024-03-01', end_date: '2024-03-31', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-011', campaign_name: 'Beauty — Influencer Series',    channel: 'Influencer', budget: 18000,  spend: 8200,   start_date: '2024-03-05', end_date: null,          target_region: 'South', status: 'active'    }, // NULL end_date
  { campaign_id: 'CAM-012', campaign_name: 'Electronics — Deals Week',      channel: 'Email',      budget: 55000,  spend: 4100,   start_date: '2024-03-15', end_date: '2024-03-22', target_region: 'All',   status: 'paused'    },
  { campaign_id: 'CAM-013', campaign_name: 'Home — Summer Preview',         channel: 'Display',    budget: 28000,  spend: 2800,   start_date: '2024-03-20', end_date: '2024-05-20', target_region: 'North', status: 'active'    },
  { campaign_id: 'CAM-014', campaign_name: 'Apparel — New Arrivals',         channel: 'Social',     budget: 32000,  spend: 1200,   start_date: '2024-03-25', end_date: '2024-04-25', target_region: 'West',  status: 'active'    },
  // ── rows 15–45 ──
  { campaign_id: 'CAM-015', campaign_name: 'Electronics — Spring Refresh',   channel: 'Search',     budget: 70000,  spend: 62400,  start_date: '2024-01-05', end_date: '2024-03-05', target_region: 'All',   status: 'completed' },
  { campaign_id: 'CAM-016', campaign_name: 'Beauty — Glow Up Series',        channel: 'Influencer', budget: 22000,  spend: 19800,  start_date: '2024-01-12', end_date: '2024-02-12', target_region: 'South', status: 'completed' },
  { campaign_id: 'CAM-017', campaign_name: 'Home — New Year Reset',          channel: 'Email',      budget: 18000,  spend: 16500,  start_date: '2024-01-02', end_date: '2024-01-31', target_region: 'North', status: 'completed' },
  { campaign_id: 'CAM-018', campaign_name: 'Sports — New Year Resolutions',  channel: 'Social',     budget: 27000,  spend: 24100,  start_date: '2024-01-03', end_date: '2024-01-31', target_region: 'All',   status: 'completed' },
  { campaign_id: 'CAM-019', campaign_name: 'Apparel — Winter Clearance',     channel: 'Display',    budget: 15000,  spend: 14200,  start_date: '2024-01-10', end_date: '2024-01-25', target_region: 'East',  status: 'completed' },
  { campaign_id: 'CAM-020', campaign_name: 'Electronics — Tax Season',       channel: 'Search',     budget: 55000,  spend: 51300,  start_date: '2024-02-01', end_date: '2024-04-15', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-021', campaign_name: 'Beauty — Spring Bloom',          channel: 'Social',     budget: 19000,  spend: 17600,  start_date: '2024-03-01', end_date: null,          target_region: 'West',  status: 'active'    }, // NULL end_date
  { campaign_id: 'CAM-021', campaign_name: 'Beauty — Spring Bloom',          channel: 'Social',     budget: 19000,  spend: 17600,  start_date: '2024-03-01', end_date: null,          target_region: 'West',  status: 'active'    }, // DUPLICATE
  { campaign_id: 'CAM-022', campaign_name: 'Home — Spring Cleaning',         channel: 'Email',      budget: 21000,  spend: 9800,   start_date: '2024-03-10', end_date: '2024-04-10', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-023', campaign_name: 'Sports — Marathon Season',       channel: 'Influencer', budget: 33000,  spend: 12400,  start_date: '2024-03-15', end_date: '2024-05-15', target_region: 'North', status: 'active'    },
  { campaign_id: 'CAM-024', campaign_name: 'Electronics — Work From Home',   channel: 'Display',    budget: 48000,  spend: 18700,  start_date: '2024-03-20', end_date: '2024-05-20', target_region: 'East',  status: 'active'    },
  { campaign_id: 'CAM-025', campaign_name: 'Apparel — Earth Day Collection', channel: 'Social',     budget: 25000,  spend: 7200,   start_date: '2024-04-01', end_date: '2024-04-30', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-026', campaign_name: 'Beauty — Mother\'s Day Gifting', channel: 'Email',      budget: 29000,  spend: 4100,   start_date: '2024-04-15', end_date: '2024-05-12', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-027', campaign_name: 'Home — Outdoor Living',          channel: 'Display',    budget: 36000,  spend: 3300,   start_date: '2024-04-20', end_date: '2024-06-20', target_region: 'South', status: 'active'    },
  { campaign_id: 'CAM-028', campaign_name: 'Sports — Summer Kickoff',        channel: 'Social',     budget: 41000,  spend: 2800,   start_date: '2024-04-25', end_date: null,          target_region: 'West',  status: 'active'    }, // NULL end_date
  { campaign_id: 'CAM-029', campaign_name: 'Electronics — Graduation Gifts', channel: 'Search',     budget: 52000,  spend: 1900,   start_date: '2024-05-01', end_date: '2024-06-30', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-030', campaign_name: 'Apparel — Summer Preview',       channel: 'Influencer', budget: 23000,  spend: 1100,   start_date: '2024-05-05', end_date: '2024-06-05', target_region: 'East',  status: 'active'    },
  { campaign_id: 'CAM-031', campaign_name: 'Beauty — Summer Glow',           channel: 'Social',     budget: 17000,  spend: 900,    start_date: '2024-05-10', end_date: null,          target_region: 'South', status: 'active'    }, // NULL end_date
  { campaign_id: 'CAM-032', campaign_name: 'Home — Smart Home Push',         channel: 'Search',     budget: 44000,  spend: 800,    start_date: '2024-05-12', end_date: '2024-07-12', target_region: 'North', status: 'active'    },
  { campaign_id: 'CAM-033', campaign_name: 'Sports — Back to Gym',           channel: 'Email',      budget: 20000,  spend: 600,    start_date: '2024-05-15', end_date: '2024-06-15', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-034', campaign_name: 'Electronics — Mid-Year Sale',    channel: 'Display',    budget: 65000,  spend: 400,    start_date: '2024-06-01', end_date: '2024-06-30', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-035', campaign_name: 'Apparel — Festival Season',      channel: 'Social',     budget: 38000,  spend: 200,    start_date: '2024-06-05', end_date: '2024-07-05', target_region: 'West',  status: 'active'    },
  { campaign_id: 'CAM-036', campaign_name: 'Beauty — Summer Essentials',     channel: 'Influencer', budget: 16000,  spend: 0,      start_date: '2024-06-10', end_date: null,          target_region: 'East',  status: 'paused'    }, // NULL end_date
  { campaign_id: 'CAM-037', campaign_name: 'Home — Independence Day',        channel: 'Email',      budget: 24000,  spend: 0,      start_date: '2024-06-20', end_date: '2024-07-10', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-038', campaign_name: 'Sports — Summer Olympics Tie-in',channel: 'Display',    budget: 75000,  spend: 0,      start_date: '2024-07-01', end_date: '2024-08-12', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-039', campaign_name: 'Electronics — Back to School',   channel: 'Search',     budget: 85000,  spend: 0,      start_date: '2024-07-15', end_date: '2024-09-15', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-040', campaign_name: 'Apparel — Fall Preview',         channel: 'Social',     budget: 30000,  spend: 0,      start_date: '2024-08-01', end_date: '2024-09-01', target_region: 'North', status: 'active'    },
  { campaign_id: 'CAM-041', campaign_name: 'Beauty — Back to Routine',       channel: 'Email',      budget: 14000,  spend: 0,      start_date: '2024-08-10', end_date: '2024-09-10', target_region: 'South', status: 'active'    },
  { campaign_id: 'CAM-042', campaign_name: 'Home — Fall Refresh',            channel: 'Influencer', budget: 26000,  spend: 0,      start_date: '2024-08-20', end_date: '2024-10-20', target_region: 'West',  status: 'active'    },
  { campaign_id: 'CAM-043', campaign_name: 'Sports — Fall Fitness',          channel: 'Search',     budget: 31000,  spend: 0,      start_date: '2024-09-01', end_date: '2024-10-31', target_region: 'East',  status: 'active'    },
  { campaign_id: 'CAM-044', campaign_name: 'Electronics — Holiday Preview',  channel: 'Display',    budget: 90000,  spend: 0,      start_date: '2024-10-01', end_date: '2024-12-31', target_region: 'All',   status: 'active'    },
  { campaign_id: 'CAM-045', campaign_name: 'Apparel — Holiday Collection',   channel: 'Social',     budget: 55000,  spend: 0,      start_date: '2024-11-01', end_date: '2024-12-31', target_region: 'All',   status: 'active'    },
];

// ─── Users Data (30 rows) ─────────────────────────────────────────────────────
// Date format: YYYY/MM/DD (intentional — third distinct format)
// Issues: 5 null segments (15%), 2 age anomalies (age: 0, age: 142)

export interface User {
  user_id: string;
  name: string;
  email: string;
  signup_date: string; // YYYY/MM/DD
  region: string;
  segment: string | null;
  age: number;
  lifetime_value: number;
}

export const usersData: User[] = [
  { user_id: 'USR-001', name: 'Sarah Chen',        email: 'sarah.chen@email.com',        signup_date: '2022/03/15', region: 'East',  segment: 'Premium',  age: 34,  lifetime_value: 4280.00 },
  { user_id: 'USR-002', name: 'Marcus Johnson',    email: 'marcus.j@email.com',          signup_date: '2021/11/08', region: 'East',  segment: 'Premium',  age: 41,  lifetime_value: 6150.50 },
  { user_id: 'USR-003', name: 'Priya Patel',       email: 'priya.patel@email.com',       signup_date: '2023/01/22', region: 'East',  segment: 'Standard', age: 29,  lifetime_value: 1890.75 },
  { user_id: 'USR-004', name: 'Jake Williams',     email: 'jakew@email.com',             signup_date: '2022/07/30', region: 'North', segment: 'Standard', age: 26,  lifetime_value: 2340.00 },
  { user_id: 'USR-005', name: 'Amelia Torres',     email: 'amelia.t@email.com',          signup_date: '2020/09/14', region: 'West',  segment: 'Premium',  age: 38,  lifetime_value: 9820.25 },
  { user_id: 'USR-006', name: 'David Kim',         email: 'david.kim@email.com',         signup_date: '2021/05/03', region: 'West',  segment: 'Premium',  age: 45,  lifetime_value: 7440.00 },
  { user_id: 'USR-007', name: 'Rachel Nguyen',     email: 'rachel.n@email.com',          signup_date: '2023/04/18', region: 'East',  segment: 'Trial',    age: 24,  lifetime_value: 340.50  },
  { user_id: 'USR-008', name: 'Omar Hassan',       email: 'omar.hassan@email.com',       signup_date: '2022/12/01', region: 'North', segment: null,       age: 33,  lifetime_value: 1120.00 }, // NULL segment
  { user_id: 'USR-009', name: 'Lisa Park',         email: 'lisa.park@email.com',         signup_date: '2021/08/19', region: 'West',  segment: 'Premium',  age: 39,  lifetime_value: 11200.75},
  { user_id: 'USR-010', name: 'Tom Blackwell',     email: 'tom.b@email.com',             signup_date: '2023/02/28', region: 'South', segment: 'Standard', age: 31,  lifetime_value: 870.00  },
  { user_id: 'USR-011', name: 'Nina Rodriguez',    email: 'nina.r@email.com',            signup_date: '2020/06/10', region: 'East',  segment: 'Premium',  age: 44,  lifetime_value: 8930.50 },
  { user_id: 'USR-012', name: 'Alex Morgan',       email: 'alex.morgan@email.com',       signup_date: '2022/10/25', region: 'West',  segment: 'Standard', age: 28,  lifetime_value: 2100.00 },
  { user_id: 'USR-013', name: 'Chris Okafor',      email: 'chris.o@email.com',           signup_date: '2023/06/07', region: 'South', segment: null,       age: 0,   lifetime_value: 155.00  }, // ANOMALY: age = 0
  { user_id: 'USR-014', name: 'Sophie Andersen',   email: 'sophie.a@email.com',          signup_date: '2021/04/12', region: 'North', segment: 'Trial',    age: 22,  lifetime_value: 420.25  },
  { user_id: 'USR-015', name: 'James Liu',         email: 'james.liu@email.com',         signup_date: '2022/01/30', region: 'North', segment: 'Standard', age: 36,  lifetime_value: 3670.00 },
  { user_id: 'USR-016', name: 'Fatima Al-Rashid',  email: 'fatima.ar@email.com',         signup_date: '2020/11/22', region: 'South', segment: 'Premium',  age: 47,  lifetime_value: 12400.00},
  { user_id: 'USR-017', name: 'Ben Walsh',         email: 'ben.walsh@email.com',         signup_date: '2023/03/09', region: 'East',  segment: 'Standard', age: 30,  lifetime_value: 980.50  },
  { user_id: 'USR-018', name: 'Mia Thompson',      email: 'mia.t@email.com',             signup_date: '2021/09/17', region: 'South', segment: null,       age: 27,  lifetime_value: 1540.75 }, // NULL segment
  { user_id: 'USR-019', name: 'Carlos Mendez',     email: 'carlos.m@email.com',          signup_date: '2022/06/04', region: 'East',  segment: 'Premium',  age: 42,  lifetime_value: 6780.00 },
  { user_id: 'USR-020', name: 'Aisha Williams',    email: 'aisha.w@email.com',           signup_date: '2020/08/28', region: 'East',  segment: 'Premium',  age: 50,  lifetime_value: 15600.25},
  { user_id: 'USR-021', name: 'Ethan Clarke',      email: 'ethan.c@email.com',           signup_date: '2023/01/15', region: 'North', segment: 'Trial',    age: 23,  lifetime_value: 280.00  },
  { user_id: 'USR-022', name: 'Hannah Johansson',  email: 'hannah.j@email.com',          signup_date: '2021/07/02', region: 'South', segment: null,       age: 35,  lifetime_value: 2890.50 }, // NULL segment
  { user_id: 'USR-023', name: 'Ryan O\'Brien',      email: 'ryan.ob@email.com',           signup_date: '2022/04/19', region: 'North', segment: 'Standard', age: 32,  lifetime_value: 1760.00 },
  { user_id: 'USR-024', name: 'Leila Ahmadi',      email: 'leila.a@email.com',           signup_date: '2020/12/05', region: 'West',  segment: 'Premium',  age: 40,  lifetime_value: 9100.75 },
  { user_id: 'USR-025', name: 'Kevin Brown',       email: 'kevin.b@email.com',           signup_date: '2023/05/21', region: 'North', segment: 'Trial',    age: 25,  lifetime_value: 195.50  },
  { user_id: 'USR-026', name: 'Diana Petrov',      email: 'diana.p@email.com',           signup_date: '2021/03/14', region: 'West',  segment: 'Standard', age: 37,  lifetime_value: 3210.00 },
  { user_id: 'USR-027', name: 'Sam Foster',        email: 'sam.foster@email.com',        signup_date: '2022/08/27', region: 'South', segment: 'Standard', age: 29,  lifetime_value: 1450.25 },
  { user_id: 'USR-028', name: 'Yuki Tanaka',       email: 'yuki.t@email.com',            signup_date: '2023/07/03', region: 'East',  segment: null,       age: 142, lifetime_value: 620.00  }, // ANOMALY: age = 142
  { user_id: 'USR-029', name: 'Grace Osei',        email: 'grace.o@email.com',           signup_date: '2021/10/11', region: 'South', segment: 'Standard', age: 33,  lifetime_value: 2080.00 },
  { user_id: 'USR-030', name: 'Tyler Reeves',      email: 'tyler.r@email.com',      signup_date: '2020/07/16', region: 'South', segment: 'Premium',  age: 48,  lifetime_value: 7900.50  },
  // ── rows 31–90 ──
  { user_id: 'USR-031', name: 'Nadia Sokolova',   email: 'nadia.s@email.com',      signup_date: '2022/02/14', region: 'West',  segment: 'Standard', age: 31,  lifetime_value: 1840.00  },
  { user_id: 'USR-032', name: 'Aaron Mitchell',   email: 'aaron.m@email.com',      signup_date: '2021/06/30', region: 'East',  segment: null,       age: 27,  lifetime_value: 560.25   }, // NULL segment
  { user_id: 'USR-033', name: 'Ingrid Larsen',    email: 'ingrid.l@email.com',     signup_date: '2023/03/05', region: 'North', segment: 'Trial',    age: 24,  lifetime_value: 310.00   },
  { user_id: 'USR-034', name: 'Kwame Asante',     email: 'kwame.a@email.com',      signup_date: '2020/10/18', region: 'South', segment: 'Premium',  age: 43,  lifetime_value: 9200.75  },
  { user_id: 'USR-035', name: 'Melissa Grant',    email: 'melissa.g@email.com',    signup_date: '2022/05/22', region: 'West',  segment: 'Standard', age: 36,  lifetime_value: 2650.00  },
  { user_id: 'USR-036', name: 'Ivan Petrov',      email: 'ivan.p@email.com',       signup_date: '2021/12/10', region: 'East',  segment: null,       age: 39,  lifetime_value: 3100.50  }, // NULL segment
  { user_id: 'USR-037', name: 'Camille Dubois',   email: 'camille.d@email.com',    signup_date: '2023/07/28', region: 'North', segment: 'Trial',    age: 22,  lifetime_value: 180.00   },
  { user_id: 'USR-038', name: 'Raj Krishnamurthy',email: 'raj.k@email.com',        signup_date: '2020/04/15', region: 'West',  segment: 'Premium',  age: 46,  lifetime_value: 11500.25 },
  { user_id: 'USR-039', name: 'Elena Vasquez',    email: 'elena.v@email.com',      signup_date: '2022/09/03', region: 'South', segment: 'Standard', age: 33,  lifetime_value: 2080.00  },
  { user_id: 'USR-040', name: 'Patrick O\'Connell',email: 'patrick.oc@email.com',  signup_date: '2021/03/19', region: 'East',  segment: 'Premium',  age: 41,  lifetime_value: 7350.00  },
  { user_id: 'USR-041', name: 'Zara Ahmed',       email: 'zara.a@email.com',       signup_date: '2023/01/07', region: 'North', segment: 'Trial',    age: 25,  lifetime_value: 420.50   },
  { user_id: 'USR-042', name: 'Felix Hoffman',    email: 'felix.h@email.com',      signup_date: '2020/08/24', region: 'West',  segment: 'Standard', age: 37,  lifetime_value: 3890.00  },
  { user_id: 'USR-043', name: 'Aiko Yamamoto',    email: 'aiko.y@email.com',       signup_date: '2022/11/11', region: 'South', segment: null,       age: -3,  lifetime_value: 720.00   }, // ANOMALY: age = -3
  { user_id: 'USR-044', name: 'Jordan Hayes',     email: 'jordan.h@email.com',     signup_date: '2021/07/06', region: 'East',  segment: 'Premium',  age: 44,  lifetime_value: 8670.75  },
  { user_id: 'USR-045', name: 'Simone Leclerc',   email: 'simone.l@email.com',     signup_date: '2023/04/25', region: 'North', segment: 'Trial',    age: 23,  lifetime_value: 240.00   },
  { user_id: 'USR-046', name: 'Marcus Webb',      email: 'marcus.w@email.com',     signup_date: '2020/06/13', region: 'West',  segment: 'Premium',  age: 49,  lifetime_value: 13200.00 },
  { user_id: 'USR-047', name: 'Divya Sharma',     email: 'divya.s@email.com',      signup_date: '2022/01/29', region: 'South', segment: 'Standard', age: 30,  lifetime_value: 1920.50  },
  { user_id: 'USR-048', name: 'Connor Walsh',     email: 'connor.w@email.com',     signup_date: '2021/09/17', region: 'East',  segment: null,       age: 28,  lifetime_value: 840.00   }, // NULL segment
  { user_id: 'USR-049', name: 'Amara Diallo',     email: 'amara.d@email.com',      signup_date: '2023/06/02', region: 'North', segment: 'Trial',    age: 21,  lifetime_value: 155.25   },
  { user_id: 'USR-050', name: 'Brett Cooper',     email: 'brett.c@email.com',      signup_date: '2020/11/30', region: 'West',  segment: 'Premium',  age: 52,  lifetime_value: 16800.00 },
  { user_id: 'USR-051', name: 'Hana Kim',         email: 'hana.k@email.com',       signup_date: '2022/04/08', region: 'South', segment: 'Standard', age: 34,  lifetime_value: 2310.00  },
  { user_id: 'USR-052', name: 'Gabriel Santos',   email: 'gabriel.s@email.com',    signup_date: '2021/02/23', region: 'East',  segment: 'Premium',  age: 40,  lifetime_value: 6540.75  },
  { user_id: 'USR-053', name: 'Lena Novak',       email: 'lena.n@email.com',       signup_date: '2023/08/14', region: 'North', segment: null,       age: 26,  lifetime_value: 380.00   }, // NULL segment
  { user_id: 'USR-054', name: 'Darius Freeman',   email: 'darius.f@email.com',     signup_date: '2020/05/20', region: 'West',  segment: 'Premium',  age: 47,  lifetime_value: 10900.50 },
  { user_id: 'USR-055', name: 'Mei Lin',          email: 'mei.lin@email.com',      signup_date: '2022/07/17', region: 'South', segment: 'Standard', age: 32,  lifetime_value: 2780.00  },
  { user_id: 'USR-056', name: 'Oscar Andersen',   email: 'oscar.a@email.com',      signup_date: '2021/10/05', region: 'East',  segment: 'Premium',  age: 45,  lifetime_value: 8120.25  },
  { user_id: 'USR-057', name: 'Priscilla Adeyemi',email: 'priscilla.a@email.com',  signup_date: '2023/02/11', region: 'North', segment: 'Trial',    age: 24,  lifetime_value: 290.50   },
  { user_id: 'USR-058', name: 'Tom Nakamura',     email: 'tom.n@email.com',        signup_date: '2020/09/26', region: 'West',  segment: 'Standard', age: 38,  lifetime_value: 3450.00  },
  { user_id: 'USR-059', name: 'Isabella Romano',  email: 'isabella.r@email.com',   signup_date: '2022/03/04', region: 'South', segment: null,       age: 29,  lifetime_value: 1100.75  }, // NULL segment
  { user_id: 'USR-060', name: 'Samuel Oduya',     email: 'samuel.o@email.com',     signup_date: '2021/01/18', region: 'East',  segment: 'Premium',  age: 43,  lifetime_value: 7890.00  },
  { user_id: 'USR-061', name: 'Clara Becker',     email: 'clara.b@email.com',      signup_date: '2023/05/30', region: 'North', segment: 'Trial',    age: 22,  lifetime_value: 210.00   },
  { user_id: 'USR-062', name: 'Moses Kamau',      email: 'moses.k@email.com',      signup_date: '2020/12/22', region: 'West',  segment: 'Premium',  age: 51,  lifetime_value: 14300.50 },
  { user_id: 'USR-063', name: 'Sophie Martin',    email: 'sophie.m@email.com',     signup_date: '2022/08/09', region: 'South', segment: 'Standard', age: 35,  lifetime_value: 2190.00  },
  { user_id: 'USR-064', name: 'Ravi Nair',        email: 'ravi.n@email.com',       signup_date: '2021/04/27', region: 'East',  segment: 'Premium',  age: 42,  lifetime_value: 6270.75  },
  { user_id: 'USR-065', name: 'Alicia Moreno',    email: 'alicia.m@email.com',     signup_date: '2023/09/15', region: 'North', segment: null,       age: 27,  lifetime_value: 470.00   }, // NULL segment
  { user_id: 'USR-066', name: 'Derek Stone',      email: 'derek.s@email.com',      signup_date: '2020/03/08', region: 'West',  segment: 'Premium',  age: 50,  lifetime_value: 12100.25 },
  { user_id: 'USR-067', name: 'Yuna Park',        email: 'yuna.p@email.com',       signup_date: '2022/06/21', region: 'South', segment: 'Standard', age: 31,  lifetime_value: 1760.50  },
  { user_id: 'USR-068', name: 'Emmanuel Osei',    email: 'emmanuel.o@email.com',   signup_date: '2021/11/14', region: 'East',  segment: 'Premium',  age: 46,  lifetime_value: 9450.00  },
  { user_id: 'USR-069', name: 'Tara Johansson',   email: 'tara.j@email.com',       signup_date: '2023/01/28', region: 'North', segment: 'Trial',    age: 23,  lifetime_value: 330.25   },
  { user_id: 'USR-070', name: 'Luke Patterson',   email: 'luke.p@email.com',       signup_date: '2020/07/04', region: 'West',  segment: 'Standard', age: 36,  lifetime_value: 3020.00  },
  { user_id: 'USR-071', name: 'Nia Williams',     email: 'nia.w@email.com',        signup_date: '2022/10/16', region: 'South', segment: null,       age: 28,  lifetime_value: 690.00   }, // NULL segment
  { user_id: 'USR-072', name: 'Stefan Mueller',   email: 'stefan.m@email.com',     signup_date: '2021/05/31', region: 'East',  segment: 'Premium',  age: 44,  lifetime_value: 8230.75  },
  { user_id: 'USR-073', name: 'Keiko Hayashi',    email: 'keiko.h@email.com',      signup_date: '2023/04/12', region: 'North', segment: 'Trial',    age: 25,  lifetime_value: 265.50   },
  { user_id: 'USR-074', name: 'Brendan Kelly',    email: 'brendan.k@email.com',    signup_date: '2020/02/17', region: 'West',  segment: 'Premium',  age: 53,  lifetime_value: 17400.00 },
  { user_id: 'USR-075', name: 'Sana Khan',        email: 'sana.k@email.com',       signup_date: '2022/09/28', region: 'South', segment: 'Standard', age: 33,  lifetime_value: 2560.00  },
  { user_id: 'USR-076', name: 'Victor Reyes',     email: 'victor.r@email.com',     signup_date: '2021/08/10', region: 'East',  segment: 'Standard', age: 38,  lifetime_value: 3670.25  },
  { user_id: 'USR-077', name: 'Anika Patel',      email: 'anika.p@email.com',      signup_date: '2023/07/19', region: 'North', segment: 'Trial',    age: 21,  lifetime_value: 145.00   },
  { user_id: 'USR-078', name: 'Chris Blackwood',  email: 'chris.b@email.com',      signup_date: '2020/01/06', region: 'West',  segment: 'Premium',  age: 48,  lifetime_value: 11700.50 },
  { user_id: 'USR-079', name: 'Maria Gonzalez',   email: 'maria.g@email.com',      signup_date: '2022/04/25', region: 'South', segment: 'Standard', age: 34,  lifetime_value: 2040.00  },
  { user_id: 'USR-080', name: 'Jin Ho Lee',       email: 'jinho.l@email.com',      signup_date: '2021/12/03', region: 'East',  segment: 'Premium',  age: 41,  lifetime_value: 7120.75  },
  { user_id: 'USR-081', name: 'Petra Novotna',    email: 'petra.n@email.com',      signup_date: '2023/03/22', region: 'North', segment: null,       age: 26,  lifetime_value: 530.00   }, // NULL segment
  { user_id: 'USR-082', name: 'Andre Laurent',    email: 'andre.l@email.com',      signup_date: '2020/10/09', region: 'West',  segment: 'Premium',  age: 50,  lifetime_value: 13800.25 },
  { user_id: 'USR-083', name: 'Fatou Diop',       email: 'fatou.d@email.com',      signup_date: '2022/07/14', region: 'South', segment: 'Standard', age: 32,  lifetime_value: 1890.00  },
  { user_id: 'USR-084', name: 'Tomás Herrera',    email: 'tomas.h@email.com',      signup_date: '2021/02/01', region: 'East',  segment: 'Premium',  age: 45,  lifetime_value: 8950.50  },
  { user_id: 'USR-085', name: 'Lily Zhang',       email: 'lily.z@email.com',       signup_date: '2023/08/07', region: 'North', segment: 'Trial',    age: 23,  lifetime_value: 195.75   },
  { user_id: 'USR-086', name: 'Noah Thompson',    email: 'noah.t@email.com',       signup_date: '2020/05/25', region: 'West',  segment: 'Standard', age: 37,  lifetime_value: 3230.00  },
  { user_id: 'USR-087', name: 'Chioma Eze',       email: 'chioma.e@email.com',     signup_date: '2022/11/30', region: 'South', segment: null,       age: 29,  lifetime_value: 960.25   }, // NULL segment
  { user_id: 'USR-088', name: 'Pierre Dupont',    email: 'pierre.d@email.com',     signup_date: '2021/06/18', region: 'East',  segment: 'Premium',  age: 44,  lifetime_value: 7680.00  },
  { user_id: 'USR-089', name: 'Aaliya Rao',       email: 'aaliya.r@email.com',     signup_date: '2023/02/14', region: 'North', segment: 'Trial',    age: 22,  lifetime_value: 275.50   },
  { user_id: 'USR-090', name: 'William Foster',   email: 'william.f@email.com',    signup_date: '2020/08/03', region: 'West',  segment: 'Premium',  age: 199, lifetime_value: 15200.75 }, // ANOMALY: age = 199
];

// ─── Relationships ────────────────────────────────────────────────────────────

export const relationships = [
  {
    id: 'REL-001',
    name: 'Order x campaigns',
    leftTable: 'orders',
    leftColumn: 'campaign_id',
    rightTable: 'campaigns',
    rightColumn: 'campaign_id',
    joinType: 'left' as const,
    cardinality: 'many-to-one' as const,
    status: 'confirmed' as const,
    note: 'LEFT JOIN preserves organic orders (null campaign_id)',
  },
  {
    id: 'REL-002',
    name: 'Order x users',
    leftTable: 'orders',
    leftColumn: 'user_id',
    rightTable: 'users',
    rightColumn: 'user_id',
    joinType: 'inner' as const,
    cardinality: 'many-to-one' as const,
    status: 'confirmed' as const,
    note: null,
  },
];

// ─── Transformations ──────────────────────────────────────────────────────────

export const transformations = [
  {
    id: 'TRF-001',
    name: 'Return on Spend',
    type: 'metric' as const,
    formula: 'SUM(orders.amount) / NULLIF(campaigns.spend, 0)',
    description: 'Total order revenue divided by campaign spend.',
    createdBy: 'agent' as const,
  },
  {
    id: 'TRF-002',
    name: 'Conversion Rate',
    type: 'metric' as const,
    formula: 'COUNT(orders.order_id) / NULLIF(campaigns.impressions, 0) * 100',
    description: 'Orders as a percentage of campaign impressions.',
    createdBy: 'agent' as const,
  },
  {
    id: 'TRF-003',
    name: 'Days to Convert',
    type: 'metric' as const,
    formula: 'DATEDIFF(orders.order_date, campaigns.start_date)',
    description: 'Days between campaign start and order date.',
    createdBy: 'agent' as const,
  },
];

// ─── Project Context ──────────────────────────────────────────────────────────

export const projectContext = {
  goal: 'Understand how marketing campaigns are driving orders across regions and user segments. Help the marketing team identify which campaigns deliver the highest return on spend and which regions and user segments respond best.',
  persona: 'Marketing analyst. Asks questions like: "Which campaign drove the most orders last month?" and "What is the ROI by campaign channel?" Expects answers in plain English with supporting charts.',
  instructions: 'When campaign_id is null, treat the order as organic (not campaign-driven). Use completed orders only for revenue calculations — exclude cancelled and refunded. Region comparisons should always include all four regions: West, East, North, South.',
};

// ─── Data Health Summary ──────────────────────────────────────────────────────

export const dataHealthSummary = {
  overallScore: 34,
  rating: 'Poor' as const,
  topIssues: [
    { type: 'No descriptions', table: 'Orders',    percentage: 70 },
    { type: 'Nulls',           table: 'Orders',    percentage: 18 },
    { type: 'Duplicates',      table: 'Campaigns', percentage: 15 },
    { type: 'Anomalies',       table: 'Orders',    percentage: 11 },
  ],
};

// ─── Agent Interaction Mock Responses ────────────────────────────────────────
// Pre-scripted agent responses for the prototype walkthrough

export const agentResponses: Record<string, { thinking: string; response: string }> = {
  'add_orders': {
    thinking: 'Running: Add table from connection...',
    response: 'Added **Orders** from Snowflake. It has 50 rows and 8 columns. I noticed **18% null values** in `campaign_id` and **5 duplicate rows** — want me to flag these for cleanup?',
  },
  'profile_orders': {
    thinking: 'Running: Profile table...',
    response: '**Orders table profile:**\n- 50 rows, 8 columns\n- `campaign_id`: 18% null (organic orders)\n- `order_date`: MM/DD/YYYY — conflicts with `campaigns` which uses YYYY-MM-DD\n- `amount`: 2 anomalies detected (1 negative, 1 extreme outlier)\n- 7 of 8 columns have no descriptions — this will reduce AI answer accuracy',
  },
  'suggest_joins': {
    thinking: 'Running: Analyze columns for join candidates...',
    response: 'Found **2 suggested joins:**\n\n**High confidence:**\n- `orders.campaign_id` → `campaigns.campaign_id` (many-to-one) — 82% match rate\n- `orders.user_id` → `users.user_id` (many-to-one) — 100% match rate\n\nWant me to create both?',
  },
  'fix_dates': {
    thinking: 'Running: Detect and normalize date formats...',
    response: 'Found date format mismatch across all 3 tables:\n- `orders.order_date`: MM/DD/YYYY\n- `campaigns.start_date`, `end_date`: YYYY-MM-DD\n- `users.signup_date`: YYYY/MM/DD\n\nCreated 3 transformations to normalize all dates to **YYYY-MM-DD**. Joins on date columns will now work correctly.',
  },
  'remove_duplicates': {
    thinking: 'Running: Find and remove duplicate rows...',
    response: 'Removed **7 duplicate rows** across tables — Orders: ORD-007, ORD-023, ORD-041, ORD-091 (5 rows); Campaigns: CAM-008, CAM-021 (2 rows). Kept the latest entry per ID. Orders now has 146 rows, Campaigns 43.',
  },
  'check_health': {
    thinking: 'Running: Data health check...',
    response: '**Data health is Poor (34/100)**\n\nTop issues:\n- No descriptions: Orders (70%) — AI accuracy risk\n- Nulls: Orders (18%) in `campaign_id`\n- Duplicates: Campaigns (15%)\n- Anomalies: Orders (11%) — negative amount, extreme outlier\n\nFix descriptions first — they have the biggest impact on answer quality.',
  },
};

// ─── Overview mock data ──────────────────────────────────────────────────────

export interface OverviewProject {
  id: string;
  name: string;
  status: 'draft' | 'published';
  lastModified: string;
  conversations?: number;
  author: string;
  issues?: OverviewAlert[];
}

export const OVERVIEW_PROJECTS: OverviewProject[] = [
  {
    id: 'proj-mc', name: 'Marketing Campaign Attribution', status: 'published',
    lastModified: '20 April', author: 'Sara Chen', conversations: 1839,
  },
  {
    id: 'proj-sp', name: 'Sales Performance', status: 'published',
    lastModified: '20 April', author: 'Sara Chen', conversations: 412,
    issues: [{
      id: 'alert-1', type: 'sync_failure', severity: 'critical',
      title: 'dbt model `dbt_sales_pipeline` failed to sync — compilation error',
      project: 'Sales Performance', projectId: 'proj-sp',
      source: 'dbt Cloud · sales_analytics', time: '2h ago',
      errorLog: `[Apr 20 · 02:14:33]  Starting sync for dbt model: dbt_sales_pipeline\n[Apr 20 · 02:14:34]  Connecting to dbt Cloud... OK\n[Apr 20 · 02:14:38]  Fetching latest run — job: sales-pipeline-daily (run #234821)\n[Apr 20 · 02:14:39]  ERROR: dbt run failed with exit code 1\n[Apr 20 · 02:14:39]  Compilation error in model dbt_sales_pipeline\n             Column 'rep_territory_id' not found in source 'raw.sales_reps'\n             This column may have been renamed or removed upstream.\n[Apr 20 · 02:14:39]  Sync aborted. Last successful sync: Apr 19 · 02:00 AM`,
    }],
  },
  {
    id: 'proj-1', name: 'Sales Analytics', status: 'draft',
    lastModified: '8 April', author: 'Vivek Sahi', conversations: 0,
  },
  {
    id: 'proj-2', name: 'Customer 360', status: 'published',
    lastModified: '3 April', author: 'Priya M.', conversations: 142,
  },
  {
    id: 'proj-3', name: 'FnOps Cost Model', status: 'draft',
    lastModified: '31 March', author: 'Vivek Sahi', conversations: 0,
    issues: [{
      id: 'alert-2', type: 'schema_change', severity: 'critical',
      title: '2 columns removed from `dbt_finance_spend` — cost_center, allocation_type',
      project: 'FnOps Cost Model', projectId: 'proj-3',
      source: 'dbt Cloud · finance_analytics', time: '4h ago',
    }],
  },
  {
    id: 'proj-6', name: 'Product Usage Analytics', status: 'published',
    lastModified: '18 April', author: 'Sara Chen', conversations: 287,
    issues: [{
      id: 'alert-3', type: 'data_freshness', severity: 'warning',
      title: '`user_events` hasn\'t updated in 26h — exceeds 12h SLA',
      project: 'Product Usage Analytics', projectId: 'proj-6',
      source: 'BigQuery · product_db', time: '2h ago',
    }],
  },
  {
    id: 'proj-7', name: 'Revenue Attribution', status: 'draft',
    lastModified: '14 April', author: 'Raj Patel', conversations: 0,
  },
  {
    id: 'proj-8', name: 'Churn Prediction', status: 'published',
    lastModified: '10 April', author: 'Priya M.', conversations: 94,
  },
  {
    id: 'proj-9', name: 'Support Analytics', status: 'draft',
    lastModified: '6 April', author: 'Vivek Sahi', conversations: 0,
  },
  {
    id: 'proj-10', name: 'Inventory & Supply Chain', status: 'published',
    lastModified: '28 March', author: 'Sara Chen', conversations: 61,
  },
];

// ─── Model detail data (for model view screen) ───────────────────────────────

export interface ModelTable  { name: string; connection: string; rows: number; includedColumns: number }
export interface ModelJoin   { left: string; right: string; on: string; type: string }
export interface ModelColumn {
  name: string;
  table: string;                              // 'computed' for derived metrics, else source table name
  type: 'attribute' | 'measure' | 'metric';
  formula?: string;                           // computed metrics only
  description?: string;
  aiContextSet: boolean;
  hidden?: boolean;                           // if true, excluded from Info tab column list
}

export interface ModelDetails {
  source: 'warehouse' | 'dbt';
  description: string;
  tables: ModelTable[];
  joins: ModelJoin[];
  columns: ModelColumn[];
  syncInfo?: {
    project: string;
    connection: string;
    schedule: string;
    lastSuccessfulSync: string;
  };
  warehouseInfo?: {
    type: string;
    database: string;
  };
}

export const MODEL_DETAILS: Record<string, ModelDetails> = {
  'proj-sp': {
    source: 'dbt',
    syncInfo: {
      project: 'sales_analytics',
      connection: 'dbt Cloud',
      schedule: 'Daily · 2:00 AM UTC',
      lastSuccessfulSync: 'Apr 19 · 02:00 AM',
    },
    description: 'Sales pipeline analysis for the revenue team. Tracks deal stage progression, rep performance, and territory coverage using dbt-modelled views from Salesforce.',
    tables: [
      { name: 'dbt_sales_pipeline', connection: 'dbt Cloud · sales_analytics', rows: 840, includedColumns: 8 },
      { name: 'dbt_sales_reps',     connection: 'dbt Cloud · sales_analytics', rows: 62,  includedColumns: 5 },
      { name: 'dbt_territories',    connection: 'dbt Cloud · sales_analytics', rows: 18,  includedColumns: 4 },
    ],
    joins: [
      { left: 'dbt_sales_pipeline', right: 'dbt_sales_reps',  on: 'rep_id',       type: 'LEFT JOIN' },
      { left: 'dbt_sales_pipeline', right: 'dbt_territories', on: 'territory_id', type: 'LEFT JOIN' },
    ],
    columns: [
      // Computed metrics
      { name: 'Win Rate',          table: 'computed', type: 'metric',    formula: "COUNT(CASE WHEN stage = 'closed_won' THEN 1 END) / COUNT(*)", description: 'Percentage of pipeline deals closed as won.',          aiContextSet: true  },
      { name: 'Avg Deal Size',     table: 'computed', type: 'metric',    formula: "AVG(CASE WHEN stage = 'closed_won' THEN amount END)",         description: 'Average revenue per closed-won deal.',                aiContextSet: true  },
      { name: 'Pipeline Coverage', table: 'computed', type: 'metric',    formula: 'SUM(expected_revenue) / NULLIF(SUM(quota), 0)',               description: 'Pipeline value as a multiple of sales quota.',        aiContextSet: true  },
      // dbt_sales_pipeline columns
      { name: 'deal_id',           table: 'dbt_sales_pipeline', type: 'attribute', description: 'Unique identifier for each pipeline deal.',                    aiContextSet: true  },
      { name: 'stage',             table: 'dbt_sales_pipeline', type: 'attribute', description: 'Current deal stage: prospecting, proposal, negotiation, closed_won, closed_lost.', aiContextSet: true  },
      { name: 'amount',            table: 'dbt_sales_pipeline', type: 'measure',   description: 'Expected deal value in USD.',                                  aiContextSet: true  },
      { name: 'expected_revenue',  table: 'dbt_sales_pipeline', type: 'measure',   description: 'Probability-weighted revenue (amount × close probability).',   aiContextSet: true  },
      { name: 'close_date',        table: 'dbt_sales_pipeline', type: 'attribute', description: 'Projected or actual close date.',                              aiContextSet: true  },
      { name: 'created_date',      table: 'dbt_sales_pipeline', type: 'attribute', description: 'Date the deal was entered into the pipeline.',                 aiContextSet: false },
      { name: 'quota',             table: 'dbt_sales_pipeline', type: 'measure',   description: 'Sales quota assigned to this rep for the period.',             aiContextSet: true  },
      { name: 'segment',           table: 'dbt_sales_pipeline', type: 'attribute', description: 'Customer segment: SMB, Mid-Market, Enterprise.',               aiContextSet: true  },
      // dbt_sales_reps columns
      { name: 'rep_name',          table: 'dbt_sales_reps', type: 'attribute', description: 'Full name of the sales representative.',   aiContextSet: true  },
      { name: 'region',            table: 'dbt_sales_reps', type: 'attribute', description: 'Sales region the rep is assigned to.',     aiContextSet: true  },
      { name: 'hire_date',         table: 'dbt_sales_reps', type: 'attribute', description: 'Date the rep joined the sales team.',      aiContextSet: false },
      { name: 'manager',           table: 'dbt_sales_reps', type: 'attribute', description: 'Name of the rep\'s direct manager.',       aiContextSet: true  },
      { name: 'target',            table: 'dbt_sales_reps', type: 'measure',   description: 'Annual revenue target for this rep.',      aiContextSet: true  },
      // dbt_territories columns
      { name: 'territory_name',    table: 'dbt_territories', type: 'attribute', description: 'Name of the sales territory.',         aiContextSet: true  },
      { name: 'territory_region',  table: 'dbt_territories', type: 'attribute', description: 'Geographic region of the territory.',  aiContextSet: true  },
      { name: 'quota_target',      table: 'dbt_territories', type: 'measure',   description: 'Aggregate quota target for the territory.', aiContextSet: true  },
      { name: 'account_count',     table: 'dbt_territories', type: 'measure',   description: 'Number of active accounts in territory.', aiContextSet: false },
    ],
  },
  'proj-mc': {
    source: 'warehouse',
    warehouseInfo: {
      type: 'Snowflake',
      database: 'marketing_db',
    },
    description: 'Campaign performance analysis for the marketing team. Covers order attribution by campaign and channel, budget efficiency across regions, and user segment conversion rates.',
    tables: [
      { name: 'orders',    connection: 'Snowflake · marketing_db', rows: 150, includedColumns: 5 },
      { name: 'campaigns', connection: 'Snowflake · marketing_db', rows: 45,  includedColumns: 7 },
      { name: 'users',     connection: 'Snowflake · marketing_db', rows: 90,  includedColumns: 4 },
    ],
    joins: [
      { left: 'orders', right: 'campaigns', on: 'campaign_id', type: 'LEFT JOIN'  },
      { left: 'orders', right: 'users',     on: 'user_id',     type: 'INNER JOIN' },
    ],
    columns: [
      // Computed metrics
      { name: 'Return on Spend',  table: 'computed', type: 'metric', formula: 'SUM(orders.amount) / NULLIF(SUM(campaigns.spend), 0)',                       description: 'Revenue generated per dollar of campaign spend.',        aiContextSet: true  },
      { name: 'Conversion Rate',  table: 'computed', type: 'metric', formula: 'COUNT(DISTINCT orders.user_id) / NULLIF(COUNT(DISTINCT users.user_id), 0)',  description: 'Percentage of users who placed an order.',              aiContextSet: true  },
      // orders columns
      { name: 'amount',           table: 'orders', type: 'measure',   description: 'Order revenue in USD.',                                                  aiContextSet: true  },
      { name: 'order_date',       table: 'orders', type: 'attribute', description: 'Date the order was placed (MM/DD/YYYY).',                                aiContextSet: true  },
      { name: 'product_category', table: 'orders', type: 'attribute', description: 'Product line: Electronics, Apparel, Home, Beauty, Sports.',              aiContextSet: true  },
      { name: 'region',           table: 'orders', type: 'attribute', description: 'Geographic region where the order was placed.',                          aiContextSet: true  },
      { name: 'status',           table: 'orders', type: 'attribute', description: 'Order status: completed, returned, pending.',                            aiContextSet: true  },
      // campaigns columns
      { name: 'campaign_name',    table: 'campaigns', type: 'attribute', description: 'Marketing campaign display name.',                                    aiContextSet: true  },
      { name: 'channel',          table: 'campaigns', type: 'attribute', description: 'Marketing channel: paid_search, social, email, display.',             aiContextSet: true  },
      { name: 'spend',            table: 'campaigns', type: 'measure',   description: 'Total ad spend for the campaign in USD.',                             aiContextSet: true  },
      { name: 'budget',           table: 'campaigns', type: 'measure',   description: 'Allocated budget for the campaign in USD.',                           aiContextSet: true  },
      { name: 'target_region',    table: 'campaigns', type: 'attribute', description: 'Geographic region the campaign is targeting.',                        aiContextSet: true  },
      { name: 'start_date',       table: 'campaigns', type: 'attribute',                                                                                     aiContextSet: false },
      { name: 'end_date',         table: 'campaigns', type: 'attribute', description: 'End date of the campaign; null if campaign is ongoing.',              aiContextSet: false },
      // users columns
      { name: 'segment',          table: 'users', type: 'attribute', description: 'Customer segment: SMB, Mid-Market, Enterprise.',                          aiContextSet: true  },
      { name: 'lifetime_value',   table: 'users', type: 'measure',   description: 'Total revenue from this customer across all orders.',                     aiContextSet: true  },
      { name: 'country',          table: 'users', type: 'attribute', description: 'Customer country.',                                                       aiContextSet: true  },
      { name: 'age',              table: 'users', type: 'attribute', description: 'Customer age in years.',                                                  aiContextSet: true  },
    ],
  },
};

// ─── Model conversations (for usage tab) ─────────────────────────────────────

export interface ModelConversation {
  id: string;
  question: string;
  user: string;
  timestamp: string;
  feedback: 'positive' | 'negative' | null;
  failed: boolean;
}

export const MODEL_CONVERSATIONS: Record<string, ModelConversation[]> = {
  'proj-sp': [
    { id: 'sc1', question: 'What is our win rate by territory this quarter?',      user: 'Raj Patel', timestamp: 'Apr 19, 3:10 PM',  feedback: 'positive', failed: false },
    { id: 'sc2', question: 'Which reps have the highest pipeline coverage?',        user: 'Amy L.',    timestamp: 'Apr 19, 1:45 PM',  feedback: null,       failed: false },
    { id: 'sc3', question: 'Show deals stuck in negotiation for 30+ days',          user: 'Raj Patel', timestamp: 'Apr 18, 4:30 PM',  feedback: null,       failed: true  },
    { id: 'sc4', question: 'What is average deal size by segment?',                 user: 'Tom W.',    timestamp: 'Apr 18, 11:00 AM', feedback: 'positive', failed: false },
    { id: 'sc5', question: 'How does Q1 pipeline compare to Q4 last year?',        user: 'Amy L.',    timestamp: 'Apr 17, 9:15 AM',  feedback: null,       failed: false },
  ],
  'proj-mc': [
    { id: 'c1', question: 'What is our ROAS by campaign for last quarter?',      user: 'Alex Kim',   timestamp: 'Apr 18, 2:14 PM',  feedback: 'positive', failed: false },
    { id: 'c2', question: 'Which user segments convert best?',                   user: 'Priya M.',   timestamp: 'Apr 18, 11:30 AM', feedback: 'negative', failed: false },
    { id: 'c3', question: 'How efficient is our budget across regions?',          user: 'Marcus J.',  timestamp: 'Apr 17, 4:45 PM',  feedback: null,       failed: false },
    { id: 'c4', question: 'What is revenue by product category?',                user: 'Nina R.',    timestamp: 'Apr 17, 3:20 PM',  feedback: null,       failed: true  },
    { id: 'c5', question: 'Show me top campaigns by ROI',                        user: 'Alex Kim',   timestamp: 'Apr 16, 9:15 AM',  feedback: 'positive', failed: false },
    { id: 'c6', question: 'What percentage of orders are organic?',              user: 'Sara Chen',  timestamp: 'Apr 15, 2:00 PM',  feedback: null,       failed: false },
    { id: 'c7', question: 'Compare ROAS between paid search and social',         user: 'Priya M.',   timestamp: 'Apr 14, 10:45 AM', feedback: 'positive', failed: false },
    { id: 'c8', question: 'Which campaigns drove the most SMB conversions?',     user: 'David K.',   timestamp: 'Apr 13, 3:30 PM',  feedback: null,       failed: false },
  ],
};

export interface OverviewAlert {
  id: string;
  type: 'schema_change' | 'sync_failure' | 'cache_failed' | 'prep_job_failed' | 'data_freshness';
  title: string;
  project: string;
  projectId: string;
  source: string;
  time: string;
  severity: 'critical' | 'warning';
  errorLog?: string;
}

export interface RecentTable {
  id: string;
  name: string;
  connection: string;
  rowCount: string;
  columns: number;
  lastSynced: string;
}

export const RECENT_TABLES: RecentTable[] = [
  { id: 'orders',           name: 'orders',           connection: 'Snowflake · marketing_db',  rowCount: '1.2M', columns: 8,  lastSynced: '3h ago' },
  { id: 'campaigns',        name: 'campaigns',        connection: 'Snowflake · marketing_db',  rowCount: '84K',  columns: 12, lastSynced: '3h ago' },
  { id: 'user_events',      name: 'user_events',      connection: 'BigQuery · product_db',     rowCount: '9.4M', columns: 38, lastSynced: '1d ago' },
  { id: 'users',            name: 'users',            connection: 'Snowflake · marketing_db',  rowCount: '52K',  columns: 9,  lastSynced: '3h ago' },
  { id: 'products',         name: 'products',         connection: 'Snowflake · commerce_db',   rowCount: '18K',  columns: 14, lastSynced: '3h ago' },
  { id: 'transactions',     name: 'transactions',     connection: 'Snowflake · finance_db',    rowCount: '4.7M', columns: 11, lastSynced: '6h ago' },
  { id: 'support_tickets',  name: 'support_tickets',  connection: 'Salesforce · support',      rowCount: '210K', columns: 22, lastSynced: '2h ago' },
  { id: 'inventory',        name: 'inventory',        connection: 'Snowflake · commerce_db',   rowCount: '31K',  columns: 7,  lastSynced: '12h ago' },
  { id: 'ad_impressions',   name: 'ad_impressions',   connection: 'BigQuery · ads_db',         rowCount: '22M',  columns: 16, lastSynced: '4h ago' },
  { id: 'revenue_monthly',  name: 'revenue_monthly',  connection: 'Snowflake · finance_db',    rowCount: '860',  columns: 6,  lastSynced: '1d ago' },
];

// ─── Warehouse Simulation — Deterministic Helpers ─────────────────────────────

const _p  = <T>(arr: readonly T[], i: number): T => arr[Math.abs((i * 7 + 3) % arr.length)];
const _f  = (i: number, min: number, max: number, dp = 2) =>
  parseFloat((min + (Math.abs((i * 13 + 7) % 97) / 97) * (max - min)).toFixed(dp));
const _d  = (i: number, startMs: number, spanDays: number): string => {
  const ms = startMs + ((Math.abs(i * 7) % spanDays)) * 86400000;
  return new Date(ms).toISOString().split('T')[0];
};
const _pd = (n: number, w = 3) => String(n).padStart(w, '0');

const _REGIONS  = ['West', 'East', 'North', 'South'] as const;
const _FIN_DEPTS = ['Marketing', 'Engineering', 'Sales', 'Finance', 'Operations'] as const;
const _EXP_CATS  = ['Marketing Spend', 'Cloud & Infra', 'Salaries & Benefits', 'Travel & Events', 'Facilities'] as const;
const _VENDORS   = ['Google Ads', 'AWS', 'Stripe', 'Salesforce', 'Workday', 'Zoom', 'HubSpot', 'NetSuite', 'Slack', 'Notion'] as const;
const _FIN_START = Date.parse('2024-01-01');

// ─── Finance Domain — raw tables ──────────────────────────────────────────────
// Use case: P&L analysis — revenue vs cost vs budget by department
// Underlying data for dbt model fct_pnl

export interface Transaction {
  transaction_id:   string;
  order_id:         string;
  revenue:          number;
  cogs:             number;
  date:             string;
  product_category: string;
  region:           string;
  department:       string;
}

const _PROD_CATS = ['Electronics', 'Clothing', 'Home', 'Beauty', 'Sports'] as const;

export const transactionsData: Transaction[] = Array.from({ length: 50 }, (_, i) => {
  const revenue = _f(i, 50, 2000);
  const cogs    = parseFloat((revenue * _f(i + 50, 0.35, 0.55)).toFixed(2));
  return {
    transaction_id:   `TRX-${_pd(i + 1)}`,
    order_id:         `ORD-${_pd(((i * 3) % 50) + 1)}`,
    revenue,
    cogs,
    date:             _d(i, _FIN_START, 90),
    product_category: _p(_PROD_CATS, i),
    region:           _p(_REGIONS, i),
    department:       _p(_FIN_DEPTS, i),
  };
});

export interface Expense {
  expense_id:  string;
  category:    string;
  department:  string;
  amount:      number;
  date:        string;
  vendor:      string;
  status:      string;
  approved_by: string;
}

const _APPROVERS = ['Anika R.', 'David K.', 'Priya M.', 'James L.', 'Sarah C.'] as const;
const _EXP_STATUSES = ['approved', 'approved', 'approved', 'pending', 'rejected'] as const;

export const expensesData: Expense[] = Array.from({ length: 50 }, (_, i) => ({
  expense_id:  `EXP-${_pd(i + 1)}`,
  category:    _p(_EXP_CATS, i),
  department:  _p(_FIN_DEPTS, i),
  amount:      _f(i, 500, 50000),
  date:        _d(i, _FIN_START, 90),
  vendor:      _p(_VENDORS, i),
  status:      _p(_EXP_STATUSES, i),
  approved_by: _p(_APPROVERS, i),
}));

export interface BudgetTarget {
  budget_id:       string;
  month:           string;
  department:      string;
  category:        string;
  budgeted_amount: number;
  actual_amount:   number | null;
  currency:        string;
}

const _BUDGET_MONTHS = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'] as const;

export const budgetTargetsData: BudgetTarget[] = Array.from({ length: 50 }, (_, i) => {
  const month  = _p(_BUDGET_MONTHS, i);
  const budget = _f(i, 5000, 200000);
  // future months have no actuals yet
  const actual = month >= '2024-04' ? null : parseFloat((budget * _f(i + 25, 0.8, 1.2)).toFixed(2));
  return {
    budget_id:       `BUD-${_pd(i + 1)}`,
    month,
    department:      _p(_FIN_DEPTS, i),
    category:        _p(_EXP_CATS, i),
    budgeted_amount: budget,
    actual_amount:   actual,
    currency:        'USD',
  };
});

// ─── Finance Domain — dbt model: fct_pnl ─────────────────────────────────────
// Pre-aggregated P&L by department × month.
// Joins: transactions + expenses + budget_targets (all resolved, carry over to ThoughtSpot).
// Computed columns: gross_profit, net_income, variances (carry over).
// Gaps: Jinja macros, custom dbt tests (do not carry over).

export interface PnLRow {
  month:               string;
  department:          string;
  revenue:             number;
  cogs:                number;
  gross_profit:        number;
  operating_expenses:  number;
  net_income:          number;
  budget:              number;
  variance:            number;
  gross_margin_pct:    number;
  budget_variance_pct: number;
}

const _PNL_DEPTS = [
  'Marketing', 'Engineering', 'Sales - SMB', 'Sales - Enterprise',
  'Finance - Accounting', 'Finance - FP&A', 'Operations', 'HR', 'Product', 'Customer Success',
] as const;
const _PNL_MONTHS = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05'] as const;

// 5 months × 10 departments = 50 rows
export const fctPnlData: PnLRow[] = Array.from({ length: 50 }, (_, i) => {
  const monthIdx   = Math.floor(i / 10);
  const deptIdx    = i % 10;
  const month      = _PNL_MONTHS[monthIdx];
  const department = _PNL_DEPTS[deptIdx];
  const revenue    = _f(i, 80000, 500000);
  const cogs       = parseFloat((revenue * _f(i + 10, 0.35, 0.55)).toFixed(2));
  const gp         = parseFloat((revenue - cogs).toFixed(2));
  const opex       = _f(i + 20, 10000, 80000);
  const ni         = parseFloat((gp - opex).toFixed(2));
  const budget     = _f(i + 30, 70000, 520000);
  const variance   = parseFloat((ni - budget).toFixed(2));
  return {
    month, department, revenue, cogs,
    gross_profit:        gp,
    operating_expenses:  opex,
    net_income:          ni,
    budget,
    variance,
    gross_margin_pct:    parseFloat(((gp / revenue) * 100).toFixed(1)),
    budget_variance_pct: parseFloat(((variance / budget) * 100).toFixed(1)),
  };
});

// ─── Sales Domain — raw tables ────────────────────────────────────────────────
// Use case: Deal pipeline + rep quota attainment
// Underlying data for Snowflake semantic view sales_overview

export interface Account {
  account_id:     string;
  company_name:   string;
  industry:       string;
  tier:           string;
  region:         string;
  arr:            number;
  employee_count: number;
  created_date:   string;
}

const _INDUSTRIES = ['SaaS', 'Retail', 'Healthcare', 'Finance', 'Manufacturing', 'Education', 'Media', 'Consulting'] as const;
const _TIERS      = ['enterprise', 'mid_market', 'smb'] as const;
const _COMPANIES  = [
  'Nexus Analytics','Brightwave Inc','Vortex Systems','Apex Health','Meridian Labs',
  'Cobalt Finance','Ironside Corp','Zephyr Media','Cascade Retail','Pinnacle Consulting',
  'Horizon SaaS','Summit Tech','Vertex Data','Prism Solutions','Orbit Education',
  'Ember Health','Nova Finance','Pulse Manufacturing','Beacon Analytics','Stellar Retail',
  'Quantum Systems','Atlas Media','Helix Consulting','Core SaaS','Spark Health',
  'Forge Finance','Titan Retail','Echo Tech','Solstice Labs','Flux Education',
  'Arc Analytics','Drift Systems','Bloom Health','Granite Finance','Tempo Retail',
  'Synapse SaaS','Rally Media','Crest Consulting','Mesh Manufacturing','Lime Education',
  'Strata Health','Coast Finance','Cipher Analytics','Blaze Tech','Metro Retail',
  'Glint SaaS','Ridge Systems','Bay Media','Vault Consulting','Dune Health',
] as const;
const _ACCT_START = Date.parse('2020-01-01');

export const accountsData: Account[] = Array.from({ length: 50 }, (_, i) => ({
  account_id:     `ACC-${_pd(i + 1)}`,
  company_name:   _COMPANIES[i],
  industry:       _p(_INDUSTRIES, i),
  tier:           _p(_TIERS, i),
  region:         _p(_REGIONS, i),
  arr:            _f(i, 10000, 1000000),
  employee_count: Math.abs(((i * 17 + 5) % 9990)) + 10,
  created_date:   _d(i, _ACCT_START, 1460),
}));

export interface Rep {
  rep_id:         string;
  name:           string;
  region:         string;
  manager:        string;
  quota:          number;
  attainment_ytd: number;
  team:           string;
  hire_date:      string;
}

const _REP_NAMES = [
  'Liam Foster','Emma Clarke','Noah Patel','Olivia Kim','Lucas Johnson',
  'Sophia Williams','Nathan Brown','Ava Jones','William Davis','Isabella Martinez',
  'James Garcia','Mia Anderson','Oliver Wilson','Charlotte Moore','Benjamin Taylor',
  'Amelia Jackson','Elijah White','Harper Harris','Mason Thompson','Evelyn Lewis',
  'Alexander Robinson','Abigail Walker','Henry Hall','Emily Allen','Sebastian Young',
  'Elizabeth Hernandez','Jack King','Sofia Wright','Aiden Lopez','Grace Scott',
  'Samuel Green','Ella Adams','David Baker','Scarlett Nelson','Joseph Carter',
  'Chloe Mitchell','Owen Perez','Lily Roberts','Daniel Turner','Zoey Phillips',
  'Matthew Campbell','Hannah Parker','Logan Evans','Avery Edwards','Jackson Collins',
  'Madison Stewart','Carter Sanchez','Layla Morris','Wyatt Rogers','Penelope Reed',
] as const;
const _MANAGERS   = ['Sarah C.', 'David K.', 'Priya M.', 'James L.'] as const;
const _TEAMS      = ['Enterprise', 'Mid-Market', 'SMB', 'Channel'] as const;
const _REP_START  = Date.parse('2019-01-01');

export const repsData: Rep[] = Array.from({ length: 50 }, (_, i) => {
  const quota = _f(i, 500000, 2000000, 0);
  return {
    rep_id:         `REP-${_pd(i + 1)}`,
    name:           _REP_NAMES[i],
    region:         _p(_REGIONS, i),
    manager:        _p(_MANAGERS, i),
    quota,
    attainment_ytd: _f(i + 25, 0, quota, 0),
    team:           _p(_TEAMS, i),
    hire_date:      _d(i, _REP_START, 1826),
  };
});

export interface Deal {
  deal_id:      string;
  account_id:   string;
  rep_id:       string;
  stage:        string;
  amount:       number;
  close_date:   string;
  created_date: string;
  region:       string;
  deal_type:    string;
  probability:  number;
}

const _STAGES       = ['discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const;
const _PROB_BY_STAGE: Record<string, number> = { discovery: 10, proposal: 25, negotiation: 50, closed_won: 100, closed_lost: 0 };
const _DEAL_TYPES   = ['new_business', 'expansion', 'renewal'] as const;
const _DEAL_START   = Date.parse('2024-01-01');
const _CREATE_START = Date.parse('2023-06-01');

export const dealsData: Deal[] = Array.from({ length: 50 }, (_, i) => {
  const stage = _p(_STAGES, i);
  return {
    deal_id:      `DL-${_pd(i + 1)}`,
    account_id:   `ACC-${_pd(((i * 3) % 20) + 1)}`,
    rep_id:       `REP-${_pd(((i * 7) % 10) + 1)}`,
    stage,
    amount:       _f(i, 5000, 500000, 0),
    close_date:   _d(i, _DEAL_START, 360),
    created_date: _d(i, _CREATE_START, 270),
    region:       _p(_REGIONS, i),
    deal_type:    _p(_DEAL_TYPES, i),
    probability:  _PROB_BY_STAGE[stage],
  };
});

// ─── Sales Domain — Snowflake semantic view: sales_overview ───────────────────
// Pre-joins deals + accounts + reps. Computes win_rate, quota_attainment, pipeline_value.
// All joins carry over to ThoughtSpot. Computed metrics carry over.
// Gaps: timezone handling may differ; Snowflake-specific window functions need review.

export interface SalesOverviewRow {
  deal_id:          string;
  deal_amount:      number;
  stage:            string;
  close_date:       string;
  deal_type:        string;
  probability:      number;
  company_name:     string;
  industry:         string;
  tier:             string;
  rep_name:         string;
  team:             string;
  region:           string;
  quota:            number;
  win_rate:         number;
  quota_attainment: number;
  pipeline_value:   number;
}

export const salesOverviewData: SalesOverviewRow[] = dealsData.map((deal) => {
  const acc        = accountsData.find(a => a.account_id === deal.account_id);
  const rep        = repsData.find(r => r.rep_id === deal.rep_id);
  const repDeals   = dealsData.filter(d => d.rep_id === deal.rep_id);
  const closed     = repDeals.filter(d => d.stage === 'closed_won' || d.stage === 'closed_lost');
  const won        = repDeals.filter(d => d.stage === 'closed_won');
  const win_rate   = closed.length > 0 ? parseFloat(((won.length / closed.length) * 100).toFixed(1)) : 0;
  const pipelineVal = repDeals
    .filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((s, d) => s + d.amount * (d.probability / 100), 0);
  return {
    deal_id:          deal.deal_id,
    deal_amount:      deal.amount,
    stage:            deal.stage,
    close_date:       deal.close_date,
    deal_type:        deal.deal_type,
    probability:      deal.probability,
    company_name:     acc?.company_name ?? '—',
    industry:         acc?.industry ?? '—',
    tier:             acc?.tier ?? '—',
    rep_name:         rep?.name ?? '—',
    team:             rep?.team ?? '—',
    region:           deal.region,
    quota:            rep?.quota ?? 0,
    win_rate,
    quota_attainment: rep ? parseFloat(((rep.attainment_ytd / rep.quota) * 100).toFixed(1)) : 0,
    pipeline_value:   parseFloat(pipelineVal.toFixed(2)),
  };
});

// ─── Warehouse Registry ───────────────────────────────────────────────────────
// All browseable data objects, organized for agent lookup and data browser UI.
// Agent priority: semantic_view → dbt_model → table

export type SourceType = 'table' | 'dbt_model' | 'semantic_view';

export interface WarehouseObject {
  id:          string;
  name:        string;
  type:        SourceType;
  domain:      'marketing' | 'finance' | 'sales';
  connection:  string;
  description: string;
  rowCount:    number;
  columns:     Array<{ name: string; type: string; nullable: boolean; description: string | null }>;
  qualityNotes?:  string[];
  dbtInfo?:       { sourceRefs: string[]; materializedAs: 'table' | 'view'; carries: string[]; gaps: string[] };
  semanticInfo?:  { baseObjects: string[]; predefinedJoins: string[]; predefinedMetrics: string[]; carries: string[]; gaps: string[] };
}

export const warehouseObjects: WarehouseObject[] = [
  // ── Marketing ──────────────────────────────────────────────────────────────
  {
    id: 'orders', name: 'orders', type: 'table', domain: 'marketing', connection: 'Snowflake / TechCorp',
    description: 'All e-commerce orders with campaign attribution, amount, and region.',
    rowCount: 150,
    columns: [
      { name: 'order_id',         type: 'string',  nullable: false, description: null },
      { name: 'user_id',          type: 'string',  nullable: false, description: null },
      { name: 'campaign_id',      type: 'string',  nullable: true,  description: null },
      { name: 'order_date',       type: 'date',    nullable: false, description: null },
      { name: 'amount',           type: 'number',  nullable: false, description: 'Order value in USD' },
      { name: 'product_category', type: 'string',  nullable: false, description: null },
      { name: 'status',           type: 'string',  nullable: false, description: null },
      { name: 'region',           type: 'string',  nullable: false, description: null },
    ],
    qualityNotes: ['18% null campaign_ids (organic orders)', '5 duplicate rows', '2 anomalous amounts', 'MM/DD/YYYY date format — conflicts with campaigns'],
  },
  {
    id: 'campaigns', name: 'campaigns', type: 'table', domain: 'marketing', connection: 'Snowflake / TechCorp',
    description: 'Marketing campaigns with budget, spend, channel, and targeting.',
    rowCount: 45,
    columns: [
      { name: 'campaign_id',   type: 'string', nullable: false, description: 'Unique campaign identifier' },
      { name: 'campaign_name', type: 'string', nullable: false, description: null },
      { name: 'channel',       type: 'string', nullable: false, description: null },
      { name: 'budget',        type: 'number', nullable: false, description: 'Total approved budget in USD' },
      { name: 'spend',         type: 'number', nullable: false, description: null },
      { name: 'start_date',    type: 'date',   nullable: false, description: null },
      { name: 'end_date',      type: 'date',   nullable: true,  description: null },
      { name: 'target_region', type: 'string', nullable: false, description: null },
      { name: 'status',        type: 'string', nullable: false, description: null },
    ],
    qualityNotes: ['6 null end_dates (ongoing campaigns)', '2 duplicate campaign_ids', 'YYYY-MM-DD format — conflicts with orders'],
  },
  {
    id: 'users', name: 'users', type: 'table', domain: 'marketing', connection: 'Snowflake / TechCorp',
    description: 'Registered platform users with demographics and lifetime value.',
    rowCount: 90,
    columns: [
      { name: 'user_id',        type: 'string',  nullable: false, description: 'Unique user identifier' },
      { name: 'name',           type: 'string',  nullable: false, description: null },
      { name: 'email',          type: 'string',  nullable: false, description: null },
      { name: 'signup_date',    type: 'date',    nullable: false, description: null },
      { name: 'region',         type: 'string',  nullable: false, description: null },
      { name: 'segment',        type: 'string',  nullable: true,  description: null },
      { name: 'age',            type: 'number',  nullable: false, description: null },
      { name: 'lifetime_value', type: 'number',  nullable: false, description: 'Total historical spend in USD' },
    ],
    qualityNotes: ['15% null segments', '4 anomalous ages (0, -3, 142, 199)', 'YYYY/MM/DD format — third date format in dataset'],
  },

  // ── Finance ─────────────────────────────────────────────────────────────────
  {
    id: 'fct_pnl', name: 'fct_pnl', type: 'dbt_model', domain: 'finance', connection: 'Snowflake / TechCorp',
    description: 'Pre-aggregated P&L by department and month. Built from transactions, expenses, and budget_targets. Use this for any finance or P&L use case.',
    rowCount: 50,
    columns: [
      { name: 'month',               type: 'string', nullable: false, description: 'Month of reporting period (YYYY-MM)' },
      { name: 'department',          type: 'string', nullable: false, description: 'Business department' },
      { name: 'revenue',             type: 'number', nullable: false, description: 'Total recognized revenue (USD)' },
      { name: 'cogs',                type: 'number', nullable: false, description: 'Cost of goods sold' },
      { name: 'gross_profit',        type: 'number', nullable: false, description: 'Revenue minus COGS' },
      { name: 'operating_expenses',  type: 'number', nullable: false, description: 'Total operating expenses' },
      { name: 'net_income',          type: 'number', nullable: false, description: 'Gross profit minus operating expenses' },
      { name: 'budget',              type: 'number', nullable: false, description: 'Approved budget for the period' },
      { name: 'variance',            type: 'number', nullable: false, description: 'Net income minus budget (positive = favorable)' },
      { name: 'gross_margin_pct',    type: 'number', nullable: false, description: 'Gross profit as % of revenue' },
      { name: 'budget_variance_pct', type: 'number', nullable: false, description: 'Variance as % of budget' },
    ],
    dbtInfo: {
      sourceRefs:      ['transactions', 'expenses', 'budget_targets'],
      materializedAs:  'table',
      carries: ['Joins (pre-resolved)', 'Computed columns (gross_profit, net_income, margins)', 'Column descriptions', 'Primary/foreign keys'],
      gaps:    ['Jinja macros', 'Custom dbt tests', 'dbt source freshness checks'],
    },
  },
  {
    id: 'transactions', name: 'transactions', type: 'table', domain: 'finance', connection: 'Snowflake / TechCorp',
    description: 'Revenue-side transactions linked to orders, by product category and department.',
    rowCount: 50,
    columns: [
      { name: 'transaction_id',   type: 'string', nullable: false, description: null },
      { name: 'order_id',         type: 'string', nullable: false, description: 'Links to orders table' },
      { name: 'revenue',          type: 'number', nullable: false, description: null },
      { name: 'cogs',             type: 'number', nullable: false, description: null },
      { name: 'date',             type: 'date',   nullable: false, description: null },
      { name: 'product_category', type: 'string', nullable: false, description: null },
      { name: 'region',           type: 'string', nullable: false, description: null },
      { name: 'department',       type: 'string', nullable: false, description: null },
    ],
  },
  {
    id: 'expenses', name: 'expenses', type: 'table', domain: 'finance', connection: 'Snowflake / TechCorp',
    description: 'Operational expenses by category, department, and vendor.',
    rowCount: 50,
    columns: [
      { name: 'expense_id',  type: 'string', nullable: false, description: null },
      { name: 'category',    type: 'string', nullable: false, description: null },
      { name: 'department',  type: 'string', nullable: false, description: null },
      { name: 'amount',      type: 'number', nullable: false, description: null },
      { name: 'date',        type: 'date',   nullable: false, description: null },
      { name: 'vendor',      type: 'string', nullable: false, description: null },
      { name: 'status',      type: 'string', nullable: false, description: null },
      { name: 'approved_by', type: 'string', nullable: false, description: null },
    ],
  },
  {
    id: 'budget_targets', name: 'budget_targets', type: 'table', domain: 'finance', connection: 'Snowflake / TechCorp',
    description: 'Monthly budget allocations by department and category. Actuals null for future months.',
    rowCount: 50,
    columns: [
      { name: 'budget_id',       type: 'string', nullable: false, description: null },
      { name: 'month',           type: 'string', nullable: false, description: 'YYYY-MM' },
      { name: 'department',      type: 'string', nullable: false, description: null },
      { name: 'category',        type: 'string', nullable: false, description: null },
      { name: 'budgeted_amount', type: 'number', nullable: false, description: null },
      { name: 'actual_amount',   type: 'number', nullable: true,  description: 'Null for future months' },
      { name: 'currency',        type: 'string', nullable: false, description: null },
    ],
  },

  // ── Sales ────────────────────────────────────────────────────────────────────
  {
    id: 'sales_overview', name: 'sales_overview', type: 'semantic_view', domain: 'sales', connection: 'Snowflake / TechCorp',
    description: 'Pre-joined view of deals + accounts + reps with computed metrics. Use this for any sales pipeline, rep performance, or quota use case. All joins are preserved when translated to ThoughtSpot.',
    rowCount: 50,
    columns: [
      { name: 'deal_id',          type: 'string', nullable: false, description: 'Unique deal identifier' },
      { name: 'deal_amount',      type: 'number', nullable: false, description: 'Deal value in USD' },
      { name: 'stage',            type: 'string', nullable: false, description: 'discovery / proposal / negotiation / closed_won / closed_lost' },
      { name: 'close_date',       type: 'date',   nullable: false, description: 'Expected or actual close date' },
      { name: 'deal_type',        type: 'string', nullable: false, description: 'new_business / expansion / renewal' },
      { name: 'probability',      type: 'number', nullable: false, description: 'Close probability (0–100)' },
      { name: 'company_name',     type: 'string', nullable: false, description: 'Account company name' },
      { name: 'industry',         type: 'string', nullable: false, description: null },
      { name: 'tier',             type: 'string', nullable: false, description: 'enterprise / mid_market / smb' },
      { name: 'rep_name',         type: 'string', nullable: false, description: null },
      { name: 'team',             type: 'string', nullable: false, description: 'Enterprise / Mid-Market / SMB / Channel' },
      { name: 'region',           type: 'string', nullable: false, description: null },
      { name: 'quota',            type: 'number', nullable: false, description: 'Annual quota for the rep' },
      { name: 'win_rate',         type: 'number', nullable: false, description: '% of closed deals that were won (computed)' },
      { name: 'quota_attainment', type: 'number', nullable: false, description: '% of quota achieved YTD (computed)' },
      { name: 'pipeline_value',   type: 'number', nullable: false, description: 'Probability-weighted open pipeline value (computed)' },
    ],
    semanticInfo: {
      baseObjects:      ['deals', 'accounts', 'reps'],
      predefinedJoins:  ['deals.account_id → accounts.account_id (inner)', 'deals.rep_id → reps.rep_id (inner)'],
      predefinedMetrics:['win_rate (closed_won / total_closed)', 'quota_attainment (attainment_ytd / quota)', 'pipeline_value (SUM(amount × probability/100) for open deals)'],
      carries: ['All joins preserved', 'Computed metrics carry over', 'Column descriptions carry over'],
      gaps:    ['Snowflake window function syntax may differ', 'Timezone handling'],
    },
  },
  {
    id: 'deals', name: 'deals', type: 'table', domain: 'sales', connection: 'Snowflake / TechCorp',
    description: 'CRM deal records — pipeline stage, value, and attribution.',
    rowCount: 50,
    columns: [
      { name: 'deal_id',      type: 'string', nullable: false, description: null },
      { name: 'account_id',   type: 'string', nullable: false, description: 'Links to accounts table' },
      { name: 'rep_id',       type: 'string', nullable: false, description: 'Links to reps table' },
      { name: 'stage',        type: 'string', nullable: false, description: null },
      { name: 'amount',       type: 'number', nullable: false, description: null },
      { name: 'close_date',   type: 'date',   nullable: false, description: null },
      { name: 'created_date', type: 'date',   nullable: false, description: null },
      { name: 'region',       type: 'string', nullable: false, description: null },
      { name: 'deal_type',    type: 'string', nullable: false, description: null },
      { name: 'probability',  type: 'number', nullable: false, description: null },
    ],
  },
  {
    id: 'accounts', name: 'accounts', type: 'table', domain: 'sales', connection: 'Snowflake / TechCorp',
    description: 'Customer accounts with industry, tier, and ARR.',
    rowCount: 50,
    columns: [
      { name: 'account_id',     type: 'string', nullable: false, description: null },
      { name: 'company_name',   type: 'string', nullable: false, description: null },
      { name: 'industry',       type: 'string', nullable: false, description: null },
      { name: 'tier',           type: 'string', nullable: false, description: null },
      { name: 'region',         type: 'string', nullable: false, description: null },
      { name: 'arr',            type: 'number', nullable: false, description: 'Annual recurring revenue in USD' },
      { name: 'employee_count', type: 'number', nullable: false, description: null },
      { name: 'created_date',   type: 'date',   nullable: false, description: null },
    ],
  },
  {
    id: 'reps', name: 'reps', type: 'table', domain: 'sales', connection: 'Snowflake / TechCorp',
    description: 'Sales representatives with quota and YTD attainment.',
    rowCount: 50,
    columns: [
      { name: 'rep_id',         type: 'string', nullable: false, description: null },
      { name: 'name',           type: 'string', nullable: false, description: null },
      { name: 'region',         type: 'string', nullable: false, description: null },
      { name: 'manager',        type: 'string', nullable: false, description: null },
      { name: 'quota',          type: 'number', nullable: false, description: 'Annual quota in USD' },
      { name: 'attainment_ytd', type: 'number', nullable: false, description: 'Revenue closed YTD in USD' },
      { name: 'team',           type: 'string', nullable: false, description: null },
      { name: 'hire_date',      type: 'date',   nullable: false, description: null },
    ],
  },
];

// ─── LLM Prompt Context ────────────────────────────────────────────────────────
// 5 representative rows per preferred object + column listings for raw tables.
// Called from buildSkill() in agent.ts.

function _fmtRows(rows: Record<string, string | number | boolean | null | undefined>[], cols: string[]): string {
  const header = cols.join(' | ');
  const lines  = rows.slice(0, 5).map(r => cols.map(c => String(r[c] ?? '—')).join(' | '));
  return [header, ...lines].join('\n');
}

export function getWarehousePromptContext(): string {
  const mktSample = _fmtRows(ordersData as never, ['order_id','user_id','campaign_id','order_date','amount','product_category','status','region']);
  const camSample = _fmtRows(campaignsData as never, ['campaign_id','campaign_name','channel','budget','spend','start_date','end_date','status']);
  const usrSample = _fmtRows(usersData as never, ['user_id','name','email','signup_date','region','segment','age','lifetime_value']);
  const pnlSample = _fmtRows(fctPnlData as never, ['month','department','revenue','cogs','gross_profit','operating_expenses','net_income','variance','gross_margin_pct']);
  const salSample = _fmtRows(salesOverviewData as never, ['deal_id','deal_amount','stage','close_date','company_name','industry','rep_name','team','win_rate','quota_attainment']);

  return `## Warehouse — Snowflake / TechCorp

### MARKETING DOMAIN (raw tables — campaign attribution for e-commerce)

**orders** (table · 150 rows) — Orders with campaign attribution, amount, and region.
Columns: order_id, user_id, campaign_id (nullable — 18% null = organic), order_date (MM/DD/YYYY ⚠), amount, product_category, status, region
⚠ Quality: 18% null campaign_ids, 5 duplicate rows, 2 anomalous amounts
Sample (5 rows):
${mktSample}

**campaigns** (table · 45 rows) — Campaigns with budget, spend, channel.
Columns: campaign_id, campaign_name, channel, budget, spend, impressions, start_date (YYYY-MM-DD ⚠), end_date (nullable), target_region, status
⚠ Quality: 6 null end_dates, 2 duplicate campaign_ids, YYYY-MM-DD format conflicts with orders
Sample (5 rows):
${camSample}

**users** (table · 90 rows) — Registered users with demographics.
Columns: user_id, name, email, signup_date (YYYY/MM/DD ⚠), region, segment (nullable — 15% null), age, lifetime_value
⚠ Quality: 15% null segments, 4 anomalous ages (0, -3, 142, 199), YYYY/MM/DD third date format
Sample (5 rows):
${usrSample}

### FINANCE DOMAIN ★ Use fct_pnl for any P&L, revenue, cost, or budget use case

**fct_pnl** (dbt model · 50 rows) ★ PREFERRED — P&L aggregated by department × month.
Built from: transactions + expenses + budget_targets (joins pre-resolved).
Columns: month, department, revenue, cogs, gross_profit, operating_expenses, net_income, budget, variance, gross_margin_pct, budget_variance_pct
✓ Carries to ThoughtSpot: joins, computed columns, descriptions
⚠ Gaps: Jinja macros, dbt-specific tests
Sample (5 rows):
${pnlSample}

Underlying raw tables (use only if fct_pnl doesn't cover the use case):
- transactions (50 rows): transaction_id, order_id, revenue, cogs, date, product_category, region, department
- expenses (50 rows): expense_id, category, department, amount, date, vendor, status, approved_by
- budget_targets (50 rows): budget_id, month, department, category, budgeted_amount, actual_amount (null = future), currency

### SALES DOMAIN ★ Use sales_overview for any pipeline, rep performance, or quota use case

**sales_overview** (Snowflake semantic view · 50 rows) ★ PREFERRED — Deals + accounts + reps, pre-joined.
Predefined joins: deals.account_id → accounts, deals.rep_id → reps (both inner).
Predefined metrics: win_rate, quota_attainment, pipeline_value (all computed, carry to ThoughtSpot).
Columns: deal_id, deal_amount, stage, close_date, deal_type, probability, company_name, industry, tier, rep_name, team, region, quota, win_rate, quota_attainment, pipeline_value
✓ Carries to ThoughtSpot: all joins, all metrics, column descriptions
⚠ Gaps: Snowflake window function syntax, timezone handling
Sample (5 rows):
${salSample}

Underlying raw tables (use only if sales_overview doesn't cover the use case):
- deals (50 rows): deal_id, account_id, rep_id, stage, amount, close_date, created_date, region, deal_type, probability
- accounts (50 rows): account_id, company_name, industry, tier, region, arr, employee_count, created_date
- reps (50 rows): rep_id, name, region, manager, quota, attainment_ytd, team, hire_date`;
}

// ─── Warehouse Tree — canonical source for PromptBar + Data Browser ───────────
// Single source of truth for connections / databases / schemas / tables.
// Optional metadata fields (rows, cols, sync, description, tests) are read by
// the Data Browser. PromptBar's `+ Tables` flow only needs id/name/type.

export type WarehouseTableType = 'table' | 'dbt_model' | 'semantic_view';
export type WarehouseConnectionType = 'snowflake' | 'dbt';

export interface WarehouseTable {
  id: string;
  name: string;
  type?: WarehouseTableType;
  rows?: string;
  cols?: number;
  sync?: string;
  tests?: string;
  description?: string;
  // dbt-only fields — populated for dbt models so the Data Browser detail page
  // can show what the model is built from and how it materializes.
  sources?:        string[];          // upstream tables / models the dbt SQL reads from
  materialization?: 'table' | 'view' | 'incremental' | 'ephemeral';
  dbtProject?:     string;            // dbt project name
  dbtSchedule?:    string;            // human-readable schedule, e.g. "Daily · 02:00 UTC"
}

export interface WarehouseSchema {
  id: string;
  name: string;
  tables: WarehouseTable[];
}

export interface WarehouseDatabase {
  id: string;
  name: string;
  schemas: WarehouseSchema[];
}

export interface WarehouseConnection {
  id: string;
  name: string;
  type: WarehouseConnectionType;
  databases: WarehouseDatabase[];
}

export const WAREHOUSE_TREE: WarehouseConnection[] = [
  {
    id: 'snowflake-1', name: 'Snowflake — production', type: 'snowflake',
    databases: [
      {
        id: 'marketing_db', name: 'marketing_db',
        schemas: [{ id: 'mkt_public', name: 'public', tables: [
          { id: 'orders',      name: 'orders',      type: 'table', rows: '12.4M', cols: 22, sync: '2h ago', description: 'All customer orders placed via the platform.' },
          { id: 'order_items', name: 'order_items', type: 'table', rows: '38.1M', cols: 9,  sync: '2h ago', description: 'Line items for each order.' },
          { id: 'campaigns',   name: 'campaigns',   type: 'table', rows: '8.2K',  cols: 18, sync: '2h ago', description: 'Marketing campaigns by channel and budget.' },
          { id: 'users',       name: 'users',       type: 'table', rows: '142K',  cols: 24, sync: '2h ago', description: 'Registered platform users.' },
          { id: 'returns',     name: 'returns',     type: 'table', rows: '912K',  cols: 11, sync: '2h ago', description: 'Returned orders with reason codes.' },
        ]}],
      },
      {
        id: 'finance_db', name: 'finance_db',
        schemas: [{ id: 'fin_reporting', name: 'reporting', tables: [
          { id: 'transactions',   name: 'transactions',   type: 'table', rows: '4.4M', cols: 18, sync: '6h ago', description: 'Payment-level transaction records.' },
          { id: 'expenses',       name: 'expenses',       type: 'table', rows: '320K', cols: 14, sync: '6h ago', description: 'Operating expenses by department and vendor.' },
          { id: 'budget_targets', name: 'budget_targets', type: 'table', rows: '50',   cols: 7,  sync: '6h ago', description: 'Monthly budget targets by department.' },
        ]}],
      },
      {
        id: 'sales_db', name: 'sales_db',
        schemas: [{ id: 'sales_schema', name: 'sales_schema', tables: [
          { id: 'accounts',       name: 'accounts',       type: 'table',         rows: '24K',  cols: 16, sync: '4h ago', description: 'Customer accounts with industry and tier.' },
          { id: 'reps',           name: 'reps',           type: 'table',         rows: '420',  cols: 12, sync: '4h ago', description: 'Sales reps with quota and territory.' },
          { id: 'deals',          name: 'deals',          type: 'table',         rows: '88K',  cols: 19, sync: '4h ago', description: 'Pipeline deals with stage and probability.' },
          { id: 'sales_overview', name: 'sales_overview', type: 'semantic_view', rows: '88K',  cols: 16, sync: '4h ago', description: 'Snowflake semantic view — deals + accounts + reps pre-joined.' },
        ]}],
      },
    ],
  },
  {
    id: 'dbt-1', name: 'dbt Analytics', type: 'dbt',
    databases: [{
      id: 'analytics', name: 'analytics',
      schemas: [{ id: 'dbt_models', name: 'models', tables: [
        { id: 'fct_pnl', name: 'fct_pnl', type: 'dbt_model', rows: '50', cols: 11, sync: '2h ago', tests: '12 / 12 passing', description: 'dbt model — P&L aggregated by department × month.', sources: ['transactions', 'expenses', 'budget_targets'], materialization: 'table', dbtProject: 'analytics', dbtSchedule: 'Daily · 02:00 UTC' },
      ]}],
    }],
  },
];

// ─── Connections ─────────────────────────────────────────────────────────────

export type ConnectionType   = 'snowflake' | 'bigquery' | 'databricks' | 'redshift' | 'postgres' | 'dbt' | 'salesforce';
export type ConnectionStatus = 'connected' | 'auth-needed' | 'error';

export interface Connection {
  id:          string;
  name:        string;
  type:        ConnectionType;
  status:      ConnectionStatus;
  lastSync:    string;
  ownerEmail?: string;
  tables:      number;
}

export const CONNECTIONS: Connection[] = [
  { id: 'snow-prod', name: 'snowflake-prod',    type: 'snowflake', status: 'connected',   lastSync: '3h ago', ownerEmail: 'vivek@example.com', tables: 184 },
  { id: 'bq-mkt',   name: 'bigquery-marketing', type: 'bigquery',  status: 'connected',   lastSync: '1d ago', ownerEmail: 'vivek@example.com', tables: 42  },
  { id: 'snow-fin', name: 'snowflake-finance',   type: 'snowflake', status: 'auth-needed', lastSync: 'Never',  tables: 0   },
  // Renewal-risk demo (run-of-show S2): the agent lists what she already has,
  // and the sources it names have to exist. Databricks carries product usage;
  // Postgres is the billing replica. Salesforce is in the script too but
  // ConnectionType has no such variant, so it's left out rather than faked.
  { id: 'dbx-usage', name: 'databricks-usage',   type: 'databricks', status: 'connected', lastSync: '2h ago', ownerEmail: 'vivek@example.com', tables: 31 },
  { id: 'pg-bill',   name: 'postgres-billing',   type: 'postgres',   status: 'connected', lastSync: '6h ago', ownerEmail: 'vivek@example.com', tables: 12 },
  { id: 'sfdc-crm',  name: 'salesforce-crm',     type: 'salesforce', status: 'connected', lastSync: '4h ago', ownerEmail: 'vivek@example.com', tables: 26 },
];

/**
 * The four connections the run-of-show names at S2 — "the connections she
 * already has: Snowflake, Databricks, Salesforce, Postgres". Listed explicitly
 * rather than filtering CONNECTIONS by status, so the demo shows exactly these
 * four and stays stable if other connections are added for other flows.
 */
export const DEMO_CONNECTION_IDS = ['snow-prod', 'dbx-usage', 'sfdc-crm', 'pg-bill'] as const;

// ─── Workspace Monitoring Mock Data ──────────────────────────────────────────

export interface WorkspaceQuery {
  id: string;
  query: string;
  model: string;
  modelId: string;
  user: string;
  latencyMs: number;
  status: 'success' | 'error';
  timestamp: string;
  errorMessage?: string;
}

export const WORKSPACE_QUERIES: WorkspaceQuery[] = [
  { id: 'q-1',  query: 'Win rate by region last quarter',             model: 'Sales Performance',             modelId: 'proj-sp',  user: 'Sara Chen',   latencyMs: 340,  status: 'success', timestamp: '2 min ago' },
  { id: 'q-2',  query: 'Campaign ROI by channel',                     model: 'Marketing Campaign Attribution', modelId: 'proj-mc',  user: 'Raj Patel',   latencyMs: 520,  status: 'success', timestamp: '5 min ago' },
  { id: 'q-3',  query: 'Revenue by department Q1 vs Q2',              model: 'FnOps Cost Model',               modelId: 'proj-3',   user: 'Vivek Sahi',  latencyMs: 0,    status: 'error',   timestamp: '12 min ago', errorMessage: 'Column rep_territory_id not found in source' },
  { id: 'q-4',  query: 'Monthly active users by segment',             model: 'Product Usage Analytics',        modelId: 'proj-6',   user: 'Priya M.',    latencyMs: 890,  status: 'success', timestamp: '18 min ago' },
  { id: 'q-5',  query: 'Customer lifetime value distribution',        model: 'Customer 360',                   modelId: 'proj-2',   user: 'Sara Chen',   latencyMs: 1240, status: 'success', timestamp: '24 min ago' },
  { id: 'q-6',  query: 'Top deals by rep this month',                 model: 'Sales Performance',             modelId: 'proj-sp',  user: 'Raj Patel',   latencyMs: 0,    status: 'error',   timestamp: '31 min ago', errorMessage: 'dbt model sync failed — stale data' },
  { id: 'q-7',  query: 'Churn risk by cohort',                        model: 'Churn Prediction',               modelId: 'proj-8',   user: 'Priya M.',    latencyMs: 670,  status: 'success', timestamp: '45 min ago' },
  { id: 'q-8',  query: 'Support ticket volume by category',           model: 'Support Analytics',              modelId: 'proj-9',   user: 'Vivek Sahi',  latencyMs: 290,  status: 'success', timestamp: '1h ago' },
  { id: 'q-9',  query: 'Impressions vs spend by campaign',            model: 'Marketing Campaign Attribution', modelId: 'proj-mc',  user: 'Sara Chen',   latencyMs: 410,  status: 'success', timestamp: '1h 20m ago' },
  { id: 'q-10', query: 'Inventory turnover by SKU',                   model: 'Inventory & Supply Chain',       modelId: 'proj-10',  user: 'Raj Patel',   latencyMs: 560,  status: 'success', timestamp: '2h ago' },
  { id: 'q-11', query: 'Pipeline value by stage',                     model: 'Sales Performance',             modelId: 'proj-sp',  user: 'Sara Chen',   latencyMs: 0,    status: 'error',   timestamp: '2h 10m ago', errorMessage: 'Column rep_territory_id not found in source' },
  { id: 'q-12', query: 'Budget vs actual by category',                model: 'FnOps Cost Model',               modelId: 'proj-3',   user: 'Vivek Sahi',  latencyMs: 320,  status: 'success', timestamp: '3h ago' },
];

export interface SchemaChange {
  type: 'added' | 'removed' | 'renamed';
  column: string;
  table: string;
  timestamp: string;
}

export interface WorkspaceQualityEntry {
  model: string;
  modelId: string;
  lastUpdated: string;
  freshnessStatus: 'fresh' | 'stale' | 'critical';
  anomalies: number;
  nullRate: number;
  schemaChanges: SchemaChange[];
}

export const WORKSPACE_QUALITY: WorkspaceQualityEntry[] = [
  {
    model: 'Marketing Campaign Attribution', modelId: 'proj-mc',
    lastUpdated: '3h ago', freshnessStatus: 'fresh', anomalies: 4, nullRate: 18,
    schemaChanges: [],
  },
  {
    model: 'Sales Performance', modelId: 'proj-sp',
    lastUpdated: 'Never (sync failed)', freshnessStatus: 'critical', anomalies: 0, nullRate: 0,
    schemaChanges: [
      { type: 'removed', column: 'rep_territory_id', table: 'raw.sales_reps', timestamp: 'Apr 20 · 02:14 AM' },
    ],
  },
  {
    model: 'Customer 360', modelId: 'proj-2',
    lastUpdated: '3h ago', freshnessStatus: 'fresh', anomalies: 2, nullRate: 8,
    schemaChanges: [],
  },
  {
    model: 'FnOps Cost Model', modelId: 'proj-3',
    lastUpdated: '4h ago', freshnessStatus: 'stale', anomalies: 0, nullRate: 5,
    schemaChanges: [
      { type: 'removed', column: 'cost_center',     table: 'dbt_finance_spend', timestamp: 'Apr 20 · 10:30 AM' },
      { type: 'removed', column: 'allocation_type', table: 'dbt_finance_spend', timestamp: 'Apr 20 · 10:30 AM' },
    ],
  },
  {
    model: 'Product Usage Analytics', modelId: 'proj-6',
    lastUpdated: '26h ago', freshnessStatus: 'stale', anomalies: 7, nullRate: 3,
    schemaChanges: [],
  },
  {
    model: 'Churn Prediction', modelId: 'proj-8',
    lastUpdated: '3h ago', freshnessStatus: 'fresh', anomalies: 1, nullRate: 11,
    schemaChanges: [],
  },
];

export interface WorkspaceUsageDay {
  date: string;
  queries: number;
  users: number;
}

export interface WorkspaceModelUsage {
  model: string;
  modelId: string;
  queryCount: number;
  uniqueUsers: number;
  topSearches: string[];
}

export const WORKSPACE_USAGE_DAYS: WorkspaceUsageDay[] = [
  { date: 'Apr 14', queries: 124, users: 18 },
  { date: 'Apr 15', queries: 89,  users: 14 },
  { date: 'Apr 16', queries: 67,  users: 11 },
  { date: 'Apr 17', queries: 201, users: 29 },
  { date: 'Apr 18', queries: 178, users: 26 },
  { date: 'Apr 19', queries: 143, users: 22 },
  { date: 'Apr 20', queries: 97,  users: 15 },
];

export const WORKSPACE_MODEL_USAGE: WorkspaceModelUsage[] = [
  { model: 'Marketing Campaign Attribution', modelId: 'proj-mc',  queryCount: 1839, uniqueUsers: 34, topSearches: ['campaign ROI', 'channel performance', 'impressions vs spend'] },
  { model: 'Sales Performance',              modelId: 'proj-sp',  queryCount: 412,  uniqueUsers: 12, topSearches: ['win rate', 'pipeline value', 'rep performance'] },
  { model: 'Customer 360',                   modelId: 'proj-2',   queryCount: 142,  uniqueUsers: 9,  topSearches: ['lifetime value', 'churn risk', 'segment analysis'] },
  { model: 'Product Usage Analytics',        modelId: 'proj-6',   queryCount: 287,  uniqueUsers: 21, topSearches: ['MAU', 'feature adoption', 'session length'] },
  { model: 'Churn Prediction',               modelId: 'proj-8',   queryCount: 94,   uniqueUsers: 7,  topSearches: ['churn probability', 'cohort analysis', 'at-risk users'] },
  { model: 'Inventory & Supply Chain',       modelId: 'proj-10',  queryCount: 61,   uniqueUsers: 5,  topSearches: ['turnover rate', 'stock levels', 'reorder point'] },
];

export interface SyncFailure {
  timestamp: string;
  model: string;
  modelId: string;
  error: string;
}

export interface WorkspaceConnection {
  id: string;
  name: string;
  type: 'snowflake' | 'bigquery' | 'dbt' | 'salesforce';
  status: 'healthy' | 'degraded' | 'failed';
  lastSync: string;
  nextSync: string;
  failures: SyncFailure[];
}

export const WORKSPACE_CONNECTIONS: WorkspaceConnection[] = [
  {
    id: 'conn-snow',
    name: 'Snowflake · marketing_db',
    type: 'snowflake',
    status: 'healthy',
    lastSync: '3h ago',
    nextSync: 'In 21h',
    failures: [],
  },
  {
    id: 'conn-dbt-sales',
    name: 'dbt Cloud · sales_analytics',
    type: 'dbt',
    status: 'failed',
    lastSync: 'Apr 19 · 02:00 AM',
    nextSync: 'Paused (error)',
    failures: [
      { timestamp: 'Apr 20 · 02:14 AM', model: 'Sales Performance', modelId: 'proj-sp', error: "Column 'rep_territory_id' not found in source 'raw.sales_reps'" },
    ],
  },
  {
    id: 'conn-bq',
    name: 'BigQuery · product_db',
    type: 'bigquery',
    status: 'degraded',
    lastSync: '26h ago',
    nextSync: 'Retrying…',
    failures: [
      { timestamp: 'Apr 19 · 12:00 PM', model: 'Product Usage Analytics', modelId: 'proj-6', error: "'user_events' hasn't updated — exceeds 12h SLA" },
    ],
  },
  {
    id: 'conn-dbt-fin',
    name: 'dbt Cloud · finance_analytics',
    type: 'dbt',
    status: 'degraded',
    lastSync: '4h ago',
    nextSync: 'In 20h',
    failures: [
      { timestamp: 'Apr 20 · 10:30 AM', model: 'FnOps Cost Model', modelId: 'proj-3', error: '2 columns removed from dbt_finance_spend — cost_center, allocation_type' },
    ],
  },
  {
    id: 'conn-sf',
    name: 'Salesforce · support',
    type: 'salesforce',
    status: 'healthy',
    lastSync: '2h ago',
    nextSync: 'In 1h',
    failures: [],
  },
  {
    id: 'conn-snow-fin',
    name: 'Snowflake · finance_db',
    type: 'snowflake',
    status: 'healthy',
    lastSync: '6h ago',
    nextSync: 'In 18h',
    failures: [],
  },
];

// ─── Active Insights ──────────────────────────────────────────────────────────

export interface ActiveInsight {
  id: string;
  priority: number;                    // 1–10 (lower = more urgent)
  category: 'debugging' | 'optimization';
  title: string;                       // single-line: includes object name
  titleShort?: string;                 // two-line: problem category only, detail on line 2
  context: string;                     // legacy, unused in UI
  impact?: string;                     // downstream scope shown on line 2
  metric?: string;                     // key callout number/stat
  timestamp: string;
  modelId: string;
  primaryAction: {
    label: string;
    type: 'fix-model' | 'fix-models' | 'view-connection' | 'enable-cache' | 'view-gaps';
  };
}

export const ACTIVE_INSIGHTS: ActiveInsight[] = [
  // ── Debugging (D1–D6) ────────────────────────────────────────────────────
  {
    id: 'ins-d1',
    priority: 1,
    category: 'debugging',
    title: 'dbt Cloud connection down — sales_analytics',
    titleShort: 'dbt Cloud connection down',
    context: '',
    impact: 'sales_analytics · 3 models blocked · 12 answers stale · 4 liveboards affected',
    metric: '3 models blocked',
    timestamp: '2h ago',
    modelId: 'proj-sp',
    primaryAction: { label: 'Fix with agent →', type: 'view-connection' },
  },
  {
    id: 'ins-d2',
    priority: 2,
    category: 'debugging',
    title: 'cost_center, allocation_type removed — FnOps Cost Model',
    titleShort: 'Source columns removed',
    context: '',
    impact: 'FnOps Cost Model · cost_center + allocation_type removed from dbt_finance_spend · 6 formulas broken',
    metric: '2 columns removed',
    timestamp: '4h ago',
    modelId: 'proj-3',
    primaryAction: { label: 'Fix with agent →', type: 'fix-model' },
  },
  {
    id: 'ins-d3',
    priority: 3,
    category: 'debugging',
    title: 'Schema drift on fact_sales — Snowflake_Sales_Prod',
    titleShort: 'Schema drift detected',
    context: '',
    impact: 'fact_sales · gross_margin + store_id removed · 2 models broken · 8 answers failing · 4 liveboards affected',
    metric: '14 objects broken',
    timestamp: '3h ago',
    modelId: 'proj-2',
    primaryAction: { label: 'Fix with agent →', type: 'fix-models' },
  },
  {
    id: 'ins-d4',
    priority: 4,
    category: 'debugging',
    title: 'Freshness SLA breached — Product Usage Analytics',
    titleShort: 'Freshness SLA breached',
    context: '',
    impact: 'Product Usage Analytics · data is 26h old · SLA is 12h · 8 dashboards showing stale data',
    metric: '14h overdue',
    timestamp: '14h ago',
    modelId: 'proj-6',
    primaryAction: { label: 'Fix with agent →', type: 'view-connection' },
  },
  {
    id: 'ins-d5',
    priority: 5,
    category: 'debugging',
    title: 'rep_territory_id missing — Sales Performance',
    titleShort: 'Missing column causing failures',
    context: '',
    impact: 'Sales Performance · rep_territory_id removed from source · still referenced in 5 formulas · 3 errors today',
    metric: '3 errors today',
    timestamp: '1h ago',
    modelId: 'proj-sp',
    primaryAction: { label: 'Fix with agent →', type: 'fix-model' },
  },
  {
    id: 'ins-d6',
    priority: 6,
    category: 'debugging',
    title: 'campaign_id null spike — Marketing Campaign Attribution',
    titleShort: 'Null rate spike in join key',
    context: '',
    impact: 'Marketing Campaign Attribution · campaign_id nulls rose from 2% to 18% since Jan 14 · 9 answers affected',
    metric: '18% null rate',
    timestamp: '6h ago',
    modelId: 'proj-mc',
    primaryAction: { label: 'Fix with agent →', type: 'fix-model' },
  },
  // ── Optimization (O1–O5) ─────────────────────────────────────────────────
  {
    id: 'ins-o4',
    priority: 7,
    category: 'optimization',
    title: '"Win rate by region" — 0% cache hit rate, Sales Performance',
    titleShort: 'Cache miss opportunity',
    context: '',
    impact: 'Sales Performance · "Win rate by region" run 34× this week · 0% cache hit rate · ~374s wasted',
    metric: '~11s saved/query',
    timestamp: '1d ago',
    modelId: 'proj-sp',
    primaryAction: { label: 'Enable with agent →', type: 'enable-cache' },
  },
  {
    id: 'ins-o3',
    priority: 8,
    category: 'optimization',
    title: '4 column descriptions missing — Marketing Campaign Attribution',
    titleShort: 'Semantic gaps limiting Spotter',
    context: '',
    impact: 'Marketing Campaign Attribution · campaign_id, target_region, channel, spend · Spotter fails 31 queries/week',
    metric: '4 gaps',
    timestamp: '2d ago',
    modelId: 'proj-mc',
    primaryAction: { label: 'Fill with agent →', type: 'view-gaps' },
  },
  {
    id: 'ins-o1',
    priority: 9,
    category: 'optimization',
    title: '"Lifetime value distribution" slow — Customer 360',
    titleShort: 'Slow query hot spot',
    context: '',
    impact: 'Customer 360 · "lifetime value distribution" averaging 1.2s · full table scan · run 18× this week',
    metric: 'Avg 1.2s',
    timestamp: '3d ago',
    modelId: 'proj-2',
    primaryAction: { label: 'Optimize with agent →', type: 'fix-model' },
  },
  {
    id: 'ins-o2',
    priority: 10,
    category: 'optimization',
    title: '6 unused columns — Churn Prediction',
    titleShort: 'Unused columns detected',
    context: '',
    impact: 'Churn Prediction · referral_source, device_type, shipping_method +3 · none queried in 30+ days',
    metric: '6 unused',
    timestamp: '5d ago',
    modelId: 'proj-8',
    primaryAction: { label: 'Clean up with agent →', type: 'fix-model' },
  },
  {
    id: 'ins-o5',
    priority: 10,
    category: 'optimization',
    title: 'Low adoption — Churn Prediction',
    titleShort: 'Low model adoption',
    context: '',
    impact: 'Churn Prediction · 7 users, 94 queries/mo · avg model has 89 users, 1,839 queries/mo',
    metric: '94 queries/mo',
    timestamp: '7d ago',
    modelId: 'proj-8',
    primaryAction: { label: 'Improve with agent →', type: 'fix-model' },
  },
];

// ─── Semantic Gaps ────────────────────────────────────────────────────────────

export interface SemanticGap {
  modelId: string;
  column: string;
  queryCount: number;
  issue: string;
  intentPattern?: string;
}

export const SEMANTIC_GAPS: SemanticGap[] = [
  { modelId: 'proj-mc', column: 'campaign_id',      queryCount: 89, issue: 'No description — Spotter cannot resolve ambiguous references' },
  { modelId: 'proj-mc', column: 'target_region',    queryCount: 74, issue: 'No description or synonyms — "area", "geo" not matched' },
  { modelId: 'proj-mc', column: 'channel',          queryCount: 67, issue: 'No AI context — paid vs organic distinction unclear to Spotter' },
  { modelId: 'proj-mc', column: 'spend',            queryCount: 52, issue: 'No description — "cost", "budget spent" not reliably matched' },
  { modelId: 'proj-sp', column: 'rep_territory_id', queryCount: 38, issue: 'Broken — column missing from source (sync failure)' },
  { modelId: 'proj-2',  column: 'lifetime_value',   queryCount: 31, issue: 'No description — "LTV", "CLV" synonyms not configured' },
];

// ─── Cache Stats ──────────────────────────────────────────────────────────────

export interface CacheStat {
  modelId: string;
  query: string;
  runCount: number;
  avgLatencyMs: number;
  potentialSavingMs: number;
}

export const CACHE_STATS: CacheStat[] = [
  { modelId: 'proj-sp', query: 'Win rate by region last quarter',      runCount: 34, avgLatencyMs: 11200, potentialSavingMs: 10800 },
  { modelId: 'proj-sp', query: 'Top deals by rep this month',          runCount: 21, avgLatencyMs: 8400,  potentialSavingMs: 8100  },
  { modelId: 'proj-mc', query: 'Campaign ROI by channel',              runCount: 47, avgLatencyMs: 3200,  potentialSavingMs: 3000  },
  { modelId: 'proj-mc', query: 'Impressions vs spend by campaign',     runCount: 29, avgLatencyMs: 2800,  potentialSavingMs: 2600  },
  { modelId: 'proj-2',  query: 'Customer lifetime value distribution', runCount: 18, avgLatencyMs: 4100,  potentialSavingMs: 3900  },
];

// ─── Dead Columns ─────────────────────────────────────────────────────────────

export interface DeadColumn {
  modelId: string;
  table: string;
  column: string;
  lastQueried: string | null;
  reason: string;
}

export const DEAD_COLUMNS: DeadColumn[] = [
  { modelId: 'proj-8', table: 'users',     column: 'referral_source',   lastQueried: null,      reason: 'Never queried' },
  { modelId: 'proj-8', table: 'users',     column: 'device_type',       lastQueried: '45d ago', reason: 'No queries in 30+ days' },
  { modelId: 'proj-8', table: 'orders',    column: 'shipping_method',   lastQueried: null,      reason: 'Never queried' },
  { modelId: 'proj-8', table: 'orders',    column: 'coupon_code',       lastQueried: '38d ago', reason: 'No queries in 30+ days' },
  { modelId: 'proj-8', table: 'campaigns', column: 'agency_name',       lastQueried: null,      reason: 'Never queried' },
  { modelId: 'proj-8', table: 'campaigns', column: 'creative_variant',  lastQueried: '52d ago', reason: 'No queries in 30+ days' },
  { modelId: 'proj-3', table: 'orders',    column: 'cost_center',       lastQueried: '60d ago', reason: 'Removed from source — schema drift' },
  { modelId: 'proj-3', table: 'orders',    column: 'allocation_type',   lastQueried: '60d ago', reason: 'Removed from source — schema drift' },
];

// ─── Monitoring Trends ────────────────────────────────────────────────────────

export interface MonitoringTrend {
  modelId: string;
  syncFailuresThisWeek: number;
  syncFailuresLastWeek: number;
  spotterSuccessRateThisWeek: number;
  spotterSuccessRateLastWeek: number;
  spotterFailedQueriesThisWeek: number;
  spotterFailedQueriesLastWeek: number;
  avgLatencyMsThisWeek: number;
  avgLatencyMsLastWeek: number;
  queriesThisWeek: number;
  queriesLastWeek: number;
}

export const MONITORING_TRENDS: MonitoringTrend[] = [
  { modelId: 'proj-sp',  syncFailuresThisWeek: 1,  syncFailuresLastWeek: 0,  spotterSuccessRateThisWeek: 74, spotterSuccessRateLastWeek: 91, spotterFailedQueriesThisWeek: 14, spotterFailedQueriesLastWeek: 5,  avgLatencyMsThisWeek: 9200, avgLatencyMsLastWeek: 8800, queriesThisWeek: 127, queriesLastWeek: 141 },
  { modelId: 'proj-mc',  syncFailuresThisWeek: 0,  syncFailuresLastWeek: 0,  spotterSuccessRateThisWeek: 65, spotterSuccessRateLastWeek: 78, spotterFailedQueriesThisWeek: 31, spotterFailedQueriesLastWeek: 19, avgLatencyMsThisWeek: 2900, avgLatencyMsLastWeek: 3100, queriesThisWeek: 412, queriesLastWeek: 389 },
  { modelId: 'proj-3',   syncFailuresThisWeek: 2,  syncFailuresLastWeek: 0,  spotterSuccessRateThisWeek: 43, spotterSuccessRateLastWeek: 82, spotterFailedQueriesThisWeek: 9,  spotterFailedQueriesLastWeek: 2,  avgLatencyMsThisWeek: 1800, avgLatencyMsLastWeek: 1600, queriesThisWeek: 16,  queriesLastWeek: 24  },
  { modelId: 'proj-6',   syncFailuresThisWeek: 0,  syncFailuresLastWeek: 1,  spotterSuccessRateThisWeek: 81, spotterSuccessRateLastWeek: 83, spotterFailedQueriesThisWeek: 11, spotterFailedQueriesLastWeek: 14, avgLatencyMsThisWeek: 1400, avgLatencyMsLastWeek: 1500, queriesThisWeek: 74,  queriesLastWeek: 88  },
  { modelId: 'proj-2',   syncFailuresThisWeek: 0,  syncFailuresLastWeek: 0,  spotterSuccessRateThisWeek: 88, spotterSuccessRateLastWeek: 86, spotterFailedQueriesThisWeek: 4,  spotterFailedQueriesLastWeek: 5,  avgLatencyMsThisWeek: 3800, avgLatencyMsLastWeek: 4200, queriesThisWeek: 38,  queriesLastWeek: 32  },
  { modelId: 'proj-8',   syncFailuresThisWeek: 0,  syncFailuresLastWeek: 0,  spotterSuccessRateThisWeek: 79, spotterSuccessRateLastWeek: 81, spotterFailedQueriesThisWeek: 5,  spotterFailedQueriesLastWeek: 5,  avgLatencyMsThisWeek: 2200, avgLatencyMsLastWeek: 2400, queriesThisWeek: 22,  queriesLastWeek: 27  },
];

// ─── Monitoring Stats ─────────────────────────────────────────────────────────

export interface MonitoringStats {
  modelId: string;
  uniqueUsersThisWeek: number;
  weeklyQueryVolume: number;
  estimatedWeeklyCostUsd: number;
  costPerQuery: number;
  costPerUser: number;
  roiFlag: 'positive' | 'neutral' | 'negative';
}

export const MONITORING_STATS: MonitoringStats[] = [
  { modelId: 'proj-sp',  uniqueUsersThisWeek: 12, weeklyQueryVolume: 127, estimatedWeeklyCostUsd: 180, costPerQuery: 1.42, costPerUser: 15.0, roiFlag: 'neutral'  },
  { modelId: 'proj-mc',  uniqueUsersThisWeek: 34, weeklyQueryVolume: 412, estimatedWeeklyCostUsd: 74,  costPerQuery: 0.18, costPerUser: 2.18, roiFlag: 'positive' },
  { modelId: 'proj-3',   uniqueUsersThisWeek: 3,  weeklyQueryVolume: 16,  estimatedWeeklyCostUsd: 45,  costPerQuery: 2.81, costPerUser: 15.0, roiFlag: 'negative' },
  { modelId: 'proj-6',   uniqueUsersThisWeek: 21, weeklyQueryVolume: 74,  estimatedWeeklyCostUsd: 95,  costPerQuery: 1.28, costPerUser: 4.52, roiFlag: 'neutral'  },
  { modelId: 'proj-2',   uniqueUsersThisWeek: 9,  weeklyQueryVolume: 38,  estimatedWeeklyCostUsd: 125, costPerQuery: 3.29, costPerUser: 13.9, roiFlag: 'neutral'  },
  { modelId: 'proj-8',   uniqueUsersThisWeek: 7,  weeklyQueryVolume: 22,  estimatedWeeklyCostUsd: 35,  costPerQuery: 1.59, costPerUser: 5.0,  roiFlag: 'negative' },
];

// ─── Semantic Coverage ────────────────────────────────────────────────────────

export interface SemanticCoverage {
  modelId: string;
  totalIntentsSampled: number;
  coveredIntents: number;
}

export const SEMANTIC_COVERAGE: SemanticCoverage[] = [
  { modelId: 'proj-sp',  totalIntentsSampled: 100, coveredIntents: 74 },
  { modelId: 'proj-mc',  totalIntentsSampled: 100, coveredIntents: 65 },
  { modelId: 'proj-3',   totalIntentsSampled: 100, coveredIntents: 43 },
  { modelId: 'proj-6',   totalIntentsSampled: 100, coveredIntents: 81 },
  { modelId: 'proj-2',   totalIntentsSampled: 100, coveredIntents: 88 },
  { modelId: 'proj-8',   totalIntentsSampled: 100, coveredIntents: 79 },
];
