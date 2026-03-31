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

export interface ColumnMeta {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  description: string | null; // null = missing description (Data Health issue)
  nullable: boolean;
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
      { id: 'order_id',         name: 'order_id',         type: 'string',  description: null,                                                    nullable: false },
      { id: 'user_id',          name: 'user_id',          type: 'string',  description: null,                                                    nullable: false },
      { id: 'campaign_id',      name: 'campaign_id',      type: 'string',  description: null,                                                    nullable: true  },
      { id: 'order_date',       name: 'order_date',       type: 'date',    description: null,                                                    nullable: false },
      { id: 'amount',           name: 'amount',           type: 'number',  description: 'Order value in USD at time of purchase.',               nullable: false },
      { id: 'product_category', name: 'product_category', type: 'string',  description: null,                                                    nullable: false },
      { id: 'status',           name: 'status',           type: 'string',  description: null,                                                    nullable: false },
      { id: 'region',           name: 'region',           type: 'string',  description: null,                                                    nullable: false },
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
      { id: 'campaign_id',     name: 'campaign_id',     type: 'string',  description: 'Unique identifier for each marketing campaign.',         nullable: false },
      { id: 'campaign_name',   name: 'campaign_name',   type: 'string',  description: null,                                                     nullable: false },
      { id: 'channel',         name: 'channel',         type: 'string',  description: null,                                                     nullable: false },
      { id: 'budget',          name: 'budget',          type: 'number',  description: 'Total approved budget for the campaign in USD.',         nullable: false },
      { id: 'spend',           name: 'spend',           type: 'number',  description: null,                                                     nullable: false },
      { id: 'start_date',      name: 'start_date',      type: 'date',    description: null,                                                     nullable: false },
      { id: 'end_date',        name: 'end_date',        type: 'date',    description: null,                                                     nullable: true  },
      { id: 'target_region',   name: 'target_region',   type: 'string',  description: null,                                                     nullable: false },
      { id: 'status',          name: 'status',          type: 'string',  description: null,                                                     nullable: false },
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
      { id: 'user_id',         name: 'user_id',         type: 'string',  description: 'Unique identifier for each registered user.',            nullable: false },
      { id: 'name',            name: 'name',            type: 'string',  description: null,                                                     nullable: false },
      { id: 'email',           name: 'email',           type: 'string',  description: null,                                                     nullable: false },
      { id: 'signup_date',     name: 'signup_date',     type: 'date',    description: null,                                                     nullable: false },
      { id: 'region',          name: 'region',          type: 'string',  description: null,                                                     nullable: false },
      { id: 'segment',         name: 'segment',         type: 'string',  description: null,                                                     nullable: true  },
      { id: 'age',             name: 'age',             type: 'number',  description: null,                                                     nullable: false },
      { id: 'lifetime_value',  name: 'lifetime_value',  type: 'number',  description: 'Total historical spend by this user across all orders.', nullable: false },
    ],
    qualityIssues: [
      { type: 'no_description', severity: 'high',   count: 6,  percentage: 75, description: 'Missing column descriptions'                                                    },
      { type: 'null',           severity: 'medium', count: 14, percentage: 15, description: 'segment is null — users not yet classified into a tier'                          },
      { type: 'anomaly',        severity: 'low',    count: 4,  percentage: 4,  description: 'age anomalies: age=0, age=142, age=-3, age=199 — likely data entry errors'       },
      { type: 'date_format',    severity: 'high',   count: 90, percentage: 100,description: 'signup_date uses YYYY/MM/DD — third date format in dataset'                     },
    ],
  },
};

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
    name: 'Campaign performance',
    type: 'metric' as const,
    formula: 'COUNT(orders.order_id) / NULLIF(campaigns.budget, 0) * 1000',
    description: 'Orders per thousand dollars of campaign budget.',
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
