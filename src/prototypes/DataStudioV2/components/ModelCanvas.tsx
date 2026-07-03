import React, { useState, useRef, useCallback } from 'react';
import { ff, fw } from '../styles';
import AgentPanel, { AgentMessage } from './AgentPanel';
import { ProjectState, emptyContext } from '../index';

// ── Types ─────────────────────────────────────────────────────────────────────

type OpType = 'source' | 'join' | 'filter' | 'agg' | 'formula' | 'rename' | 'sort' | 'union' | 'limit' | 'sql' | 'nullfix';

interface PipelineStep {
  type: OpType;
  label: string;
  desc: string;
  cols: [string, string][];
  prep?: boolean; // materialization-requiring prep step (blocks switching back to live)
  nullFix?: { column: string; value: string }; // per-step null remediation (for version-aware preview)
}

interface CsvSettings {
  fileName: string;
  delimiter: string;
  quote: string;
  encoding: string;
  header: boolean;
}

interface CanvasGroup {
  id: string;
  tableName: string;
  steps: PipelineStep[];
  x: number;
  y: number;
  expanded: boolean;
  activeStep: number;
  sourceKind?: 'warehouse' | 'csv';
  csv?: CsvSettings;
}

interface CanvasJoin {
  id: string;
  name: string;
  table1Id: string;
  table2Name: string;
  col1: string;
  col2: string;
  joinType: 'inner' | 'full_outer' | 'left_outer' | 'right_outer';
  cardinality: 'many_to_one' | 'one_to_many' | 'one_to_one';
  x: number;
  y: number;
}

interface ModelCanvasProps {
  onBack: () => void;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const TABLE_COLS: Record<string, [string, string][]> = {
  orders:       [['order_id','INT'],['order_date','DATE'],['customer_id','INT'],['amount','FLOAT'],['status','VARCHAR'],['region','VARCHAR']],
  customers:    [['customer_id','INT'],['name','VARCHAR'],['segment','VARCHAR'],['lifetime_value','FLOAT'],['signup_date','DATE']],
  products:     [['product_id','INT'],['name','VARCHAR'],['category','VARCHAR'],['price','FLOAT']],
  line_items:   [['order_id','INT'],['product_id','INT'],['qty','INT'],['unit_price','FLOAT']],
  transactions: [['txn_id','INT'],['order_id','INT'],['amount','FLOAT'],['method','VARCHAR'],['date','DATE']],
  campaigns:    [['campaign_id','VARCHAR'],['campaign_name','VARCHAR'],['channel','VARCHAR'],['spend','FLOAT'],['budget','FLOAT'],['impressions','INT']],
  ad_events:    [['event_id','INT'],['campaign_id','VARCHAR'],['event_type','VARCHAR'],['ts','TIMESTAMP']],
  conversions:  [['conv_id','INT'],['campaign_id','VARCHAR'],['customer_id','INT'],['revenue','FLOAT']],
  fct_orders:   [['order_id','INT'],['date','DATE'],['amount','FLOAT'],['segment','VARCHAR'],['channel','VARCHAR']],
  dim_customers:[['customer_id','INT'],['name','VARCHAR'],['segment','VARCHAR'],['ltv','FLOAT']],
  customer_regions:[['customer_id','INT'],['region','VARCHAR'],['csm_owner','VARCHAR'],['tier','VARCHAR']],
};

type Row = (string | number | boolean | null)[];
const MOCK_DATA: Record<string, Row[]> = {
  orders: [
    [1001,'2024-01-15',42,349.99,'completed','West'],
    [1002,'2024-01-16',17,89.00,'pending','East'],
    [1003,'2024-01-17',88,1240.50,'completed','North'],
    [1004,'2024-01-18',42,56.20,'refunded','West'],
    [1005,'2024-01-19',5,789.00,'shipped','South'],
    [1006,'2024-01-20',31,210.75,'completed','East'],
    [1007,'2024-01-21',72,43.99,'pending','West'],
    [1008,'2024-01-22',17,3450.00,'completed','North'],
  ],
  customers: [
    [42,'Alice Johnson','Enterprise',12450.00,'2022-03-10'],
    [17,'Bob Smith','SMB',3200.00,'2023-07-22'],
    [5,'Carol White','Enterprise',98000.00,'2021-11-04'],
    [31,'David Lee','Startup',750.00,'2024-01-08'],
    [88,'Eva Martinez','SMB',5600.00,'2022-09-30'],
    [72,'Frank Chen','Enterprise',22100.00,'2021-06-15'],
    [9,'Grace Park','Startup',1200.00,'2023-12-01'],
    [54,'Henry Moore','SMB',4300.00,'2022-05-18'],
  ],
  customer_regions: [
    [42,'West','Dana Wu','Enterprise'],
    [17,'East',null,'SMB'],
    [5,null,'Priya Shah','Enterprise'],
    [31,'South','Dana Wu',null],
    [88,null,null,'SMB'],
    [72,'North','Sam Okafor','Enterprise'],
    [9,'West',null,'Startup'],
    [54,'East','Priya Shah','SMB'],
  ],
  products: [
    [101,'Analytics Pro','Software',299.00],
    [102,'Data Connector','Integration',99.00],
    [103,'Dashboard Kit','Visualization',149.00],
    [104,'API Access','Infrastructure',49.00],
    [105,'ML Pipeline','AI/ML',499.00],
    [106,'Alerts Add-on','Monitoring',79.00],
    [107,'Export Tools','Utility',39.00],
    [108,'SSO Module','Security',199.00],
  ],
  line_items: [
    [1001,101,1,299.00],[1001,102,2,99.00],[1002,104,1,49.00],
    [1003,105,1,499.00],[1003,101,1,299.00],[1003,103,2,149.00],
    [1004,102,1,99.00],[1005,105,1,499.00],
  ],
  transactions: [
    [9001,1001,349.99,'credit_card','2024-01-15'],
    [9002,1002,89.00,'paypal','2024-01-16'],
    [9003,1003,1240.50,'credit_card','2024-01-17'],
    [9004,1004,-56.20,'refund','2024-01-19'],
    [9005,1005,789.00,'wire','2024-01-19'],
    [9006,1006,210.75,'credit_card','2024-01-20'],
    [9007,1007,43.99,'paypal','2024-01-21'],
    [9008,1008,3450.00,'wire','2024-01-22'],
  ],
  campaigns: [
    ['C-101','Q1 Brand Push','paid_search',42000,50000,1820000],
    ['C-102','Spring Retarget','display',18500,20000,940000],
    ['C-103','Product Launch','social',75000,80000,3100000],
    ['C-104','ABM Enterprise','email',9200,10000,0],
    ['C-105','Webinar Series','content',4800,5000,0],
    ['C-106','Partner Co-mkt','display',22000,25000,770000],
    ['C-107','APAC Expansion','paid_search',31000,35000,1050000],
    ['C-108','Q2 Awareness','video',60000,65000,5400000],
  ],
  ad_events: [
    [5001,'C-101','impression','2024-01-15 09:12:04'],
    [5002,'C-101','click','2024-01-15 09:12:31'],
    [5003,'C-103','impression','2024-01-15 10:05:18'],
    [5004,'C-103','conversion','2024-01-15 10:07:44'],
    [5005,'C-102','impression','2024-01-15 11:33:02'],
    [5006,'C-101','impression','2024-01-15 12:01:55'],
    [5007,'C-107','click','2024-01-15 13:22:09'],
    [5008,'C-108','impression','2024-01-15 14:45:37'],
  ],
  conversions: [
    [3001,'C-101',42,349.99],[3002,'C-103',88,1240.50],
    [3003,'C-107',5,789.00],[3004,'C-101',31,210.75],
    [3005,'C-103',72,3450.00],[3006,'C-102',17,89.00],
    [3007,'C-108',9,499.00],[3008,'C-101',54,149.00],
  ],
  fct_orders: [
    [1001,'2024-01-15',349.99,'Enterprise','paid_search'],
    [1002,'2024-01-16',89.00,'SMB','organic'],
    [1003,'2024-01-17',1240.50,'Enterprise','paid_search'],
    [1004,'2024-01-18',56.20,'Enterprise','direct'],
    [1005,'2024-01-19',789.00,'Enterprise','partner'],
    [1006,'2024-01-20',210.75,'Startup','organic'],
    [1007,'2024-01-21',43.99,'SMB','social'],
    [1008,'2024-01-22',3450.00,'Enterprise','direct'],
  ],
  dim_customers: [
    [42,'Alice Johnson','Enterprise',12450.00],
    [17,'Bob Smith','SMB',3200.00],
    [5,'Carol White','Enterprise',98000.00],
    [31,'David Lee','Startup',750.00],
    [88,'Eva Martinez','SMB',5600.00],
    [72,'Frank Chen','Enterprise',22100.00],
    [9,'Grace Park','Startup',1200.00],
    [54,'Henry Moore','SMB',4300.00],
  ],
};

const OP_META: Record<OpType, { label: string; tag: string; desc: string }> = {
  source:  { label: 'Source',    tag: 'source',  desc: 'Raw table' },
  join:    { label: 'Join',      tag: 'join',    desc: 'Join on key' },
  filter:  { label: 'Filter',    tag: 'filter',  desc: 'Filter rows' },
  agg:     { label: 'Aggregate', tag: 'agg',     desc: 'Aggregate values' },
  formula: { label: 'Formula',   tag: 'formula', desc: 'Computed column' },
  rename:  { label: 'Rename',    tag: 'rename',  desc: 'Rename columns' },
  sort:    { label: 'Sort',      tag: 'sort',    desc: 'Sort rows' },
  union:   { label: 'Union',     tag: 'union',   desc: 'Union tables' },
  limit:   { label: 'Limit',     tag: 'limit',   desc: 'Limit rows' },
  sql:     { label: 'SQL',       tag: 'sql',     desc: 'Custom SQL' },
  nullfix: { label: 'Fix nulls', tag: 'prep',    desc: 'Remediate null values' },
};

const OP_ICON: Record<string, React.ReactNode> = {
  source:  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5.5h12M4.5 5.5v6.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  filter:  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5h11L8 8.5v3.5L6 11V8.5L1.5 3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  agg:     <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 11V3M2 7h4M2 3l2 2M2 11l2-2M8 3h3a1 1 0 010 4h-3M8 7h4a1 1 0 010 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  formula: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M4 2.5c0-1 2 0 2 1V5c0 .5.5 1 1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M6 5v6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M4 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  rename:  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sort:    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M2 7h7M2 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M11 7v5.5M9 10.5l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  union:   <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  limit:   <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h7M2 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  sql:     <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 4l3 3-3 3M7.5 10h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  join:    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="7" r="3" stroke="currentColor" strokeWidth="1.2"/><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.2"/></svg>,
  nullfix: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2C4.8 5 3.5 7 3.5 9a3.5 3.5 0 007 0c0-2-1.3-4-3.5-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
};

const OP_TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  source:  { bg: 'rgba(39,112,239,0.1)',   fg: '#2770EF' },
  filter:  { bg: 'rgba(252,200,56,0.15)',  fg: '#92640A' },
  agg:     { bg: 'rgba(140,98,245,0.1)',   fg: '#6B4FBF' },
  join:    { bg: 'rgba(72,209,224,0.12)',  fg: '#0E7D8B' },
  prep:    { bg: 'rgba(236,72,153,0.10)',  fg: '#BE185D' },
  rename:  { bg: 'rgba(100,116,139,0.1)', fg: '#475569' },
  formula: { bg: 'rgba(6,191,127,0.1)',   fg: '#047857' },
  sort:    { bg: 'rgba(255,129,66,0.1)',  fg: '#C05621' },
  union:   { bg: 'rgba(100,116,139,0.1)', fg: '#475569' },
  limit:   { bg: 'rgba(100,116,139,0.1)', fg: '#475569' },
  sql:     { bg: 'rgba(140,98,245,0.1)',  fg: '#6B4FBF' },
};

const NODE_POSITIONS = [
  { x: 80,  y: 60  }, { x: 300, y: 60  }, { x: 520, y: 60  },
  { x: 80,  y: 260 }, { x: 300, y: 260 }, { x: 520, y: 260 },
];

// ── Shared style primitives ───────────────────────────────────────────────────

const BORDER  = `1px solid #EAEDF2`;
const RADIUS6 = 6;
const RADIUS8 = 8;

// ── SVG icons (inline) ────────────────────────────────────────────────────────

const IconTrash = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M1.5 3h9M4.5 3V2h3v1M5 5.5v3M7 5.5v3M2.5 3l.7 7h5.6l.7-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevronRight = ({ size = 10, color = '#BFC6D0' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M4 3l3 3-3 3" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevronLeft = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevronDown = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconTable = ({ size = 11, color = '#C0C6CF' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <rect x="1" y="2" width="10" height="8" rx="1" stroke={color} strokeWidth="1.2"/>
    <path d="M1 5h10M1 8h10M4 5v5M8 5v5" stroke={color} strokeWidth="1"/>
  </svg>
);
const IconDb = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <ellipse cx="6" cy="3" rx="4" ry="1.5" stroke="#8B96A5" strokeWidth="1.1"/>
    <path d="M2 3v6c0 .83 1.79 1.5 4 1.5s4-.67 4-1.5V3" stroke="#8B96A5" strokeWidth="1.1"/>
    <path d="M2 6c0 .83 1.79 1.5 4 1.5S10 6.83 10 6" stroke="#8B96A5" strokeWidth="1.1"/>
  </svg>
);
const IconSchema = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <rect x="1" y="1" width="4" height="4" rx="0.8" stroke="#A5ACB9" strokeWidth="1.1"/>
    <rect x="7" y="1" width="4" height="4" rx="0.8" stroke="#A5ACB9" strokeWidth="1.1"/>
    <rect x="1" y="7" width="4" height="4" rx="0.8" stroke="#A5ACB9" strokeWidth="1.1"/>
    <path d="M9 5v2M3 5v2M3 7h6" stroke="#A5ACB9" strokeWidth="1"/>
  </svg>
);
const IconDbt = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <polygon points="6,1 11,3.5 11,8.5 6,11 1,8.5 1,3.5" stroke="#8C62F5" strokeWidth="1.1" fill="none"/>
  </svg>
);
const IconSnowflake = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5c-1.5 0-2.5.7-2.5 1.5V4c0 .8-1 1.5-1 2.5S4.5 8 5 8s.5.5.5 1v1.5C5.5 11.8 6 12.5 7 12.5s1.5-.7 1.5-2V9c0-.5 0-1 .5-1s1.5-1 1.5-2S9.5 4 9.5 4V3C9.5 2.2 8.5 1.5 7 1.5z" stroke="#C0C6CF" strokeWidth="1.2"/>
  </svg>
);
const IconBigquery = ({ size = 11 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M7 2l3.5 5.5H7V12L3.5 6.5H7V2z" stroke="#C0C6CF" strokeWidth="1.2" strokeLinejoin="round"/>
  </svg>
);

const IconPlus = ({ size = 10, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 2v8M2 6h8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IconInfo = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 7.5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <circle cx="8" cy="5.2" r="0.8" fill="currentColor"/>
  </svg>
);
const IconAddToCanvas = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconDagEmpty = () => (
  <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
    <rect x="2" y="10" width="9" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="17" y="5" width="9" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <rect x="17" y="15" width="9" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 14h3l3-5.5M11 14h3l3 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ── Tree row ──────────────────────────────────────────────────────────────────

function getColTypeBadge(type: string): { bg: string; color: string } {
  if (['INT','FLOAT','DECIMAL','NUMERIC','INTEGER','BIGINT'].includes(type))
    return { bg: 'rgba(27,88,212,0.08)', color: '#1B58D4' };
  if (['VARCHAR','TEXT','STRING','CHAR'].includes(type))
    return { bg: 'rgba(107,79,191,0.08)', color: '#6B4FBF' };
  if (['DATE','TIMESTAMP','DATETIME','TIME'].includes(type))
    return { bg: 'rgba(14,125,139,0.08)', color: '#0E7D8B' };
  if (['BOOLEAN','BOOL'].includes(type))
    return { bg: 'rgba(4,120,87,0.08)', color: '#047857' };
  return { bg: 'rgba(100,116,139,0.08)', color: '#64748B' };
}

function getColSemanticMeta(col: string, type: string): { description: string; nullable: boolean; isPk: boolean } {
  const isPk = col === 'id' || (col.endsWith('_id') && !col.includes('_') === false && col.split('_').length <= 2 && col === col.split('_')[0] + '_id');
  if (col === 'id') return { description: 'Primary key, auto-incremented', nullable: false, isPk: true };
  if (col.endsWith('_id')) return { description: `Foreign key → ${col.slice(0, -3)}s`, nullable: false, isPk: false };
  if (col === 'name' || col.endsWith('_name')) return { description: 'Human-readable display name', nullable: false, isPk: false };
  if (col === 'email') return { description: 'Email address, must be unique', nullable: false, isPk: false };
  if (col === 'phone') return { description: 'Contact phone number', nullable: true, isPk: false };
  if (col === 'status') return { description: 'Current status of the record', nullable: false, isPk: false };
  if (col === 'type') return { description: 'Classification type', nullable: false, isPk: false };
  if (col === 'channel') return { description: 'Marketing or acquisition channel', nullable: true, isPk: false };
  if (col === 'region' || col === 'geo') return { description: 'Geographic region or market', nullable: true, isPk: false };
  if (col === 'country') return { description: 'ISO 3166-1 country code', nullable: true, isPk: false };
  if (col === 'city') return { description: 'City name', nullable: true, isPk: false };
  if (col === 'segment') return { description: 'Customer segment classification', nullable: true, isPk: false };
  if (['amount','revenue','spend','budget','price','cost','fee','ltv','mrr','margin','unit_price','line_total','net_amount','refund_amount','total_amount','lifetime_value','conversion_value'].includes(col))
    return { description: 'Monetary value in USD', nullable: true, isPk: false };
  if (['impressions','clicks','conversions','qty','stock_qty'].includes(col))
    return { description: 'Aggregate count metric', nullable: false, isPk: false };
  if (col.endsWith('_at') || col === 'ts' || col === 'date') return { description: 'Timestamp of the event', nullable: true, isPk: false };
  if (col.endsWith('_date')) return { description: 'Date value (no time component)', nullable: true, isPk: false };
  if (col === 'description' || col === 'notes') return { description: 'Free-text description or notes', nullable: true, isPk: false };
  if (col === 'tags') return { description: 'Comma-separated tag list', nullable: true, isPk: false };
  if (type === 'BOOLEAN') return { description: 'Boolean flag, true/false', nullable: false, isPk: false };
  if (type === 'TIMESTAMP') return { description: 'UTC timestamp', nullable: true, isPk: false };
  if (type === 'DATE') return { description: 'Calendar date', nullable: true, isPk: false };
  if (type === 'INT' || type === 'BIGINT') return { description: 'Integer value', nullable: false, isPk };
  if (type === 'FLOAT' || type === 'DECIMAL') return { description: 'Decimal numeric value', nullable: true, isPk: false };
  return { description: 'String value', nullable: true, isPk: false };
}

const TreeTableRow: React.FC<{
  name: string;
  isDbt?: boolean;
  onCanvas?: boolean;
  onAdd: (name: string) => void;
  depthPad?: number;
  expanded?: boolean;
  onToggleExpand?: (name: string) => void;
  deselectedCols?: Set<string>;
  onToggleCol?: (tableName: string, col: string) => void;
}> = ({ name, isDbt, onCanvas, onAdd, depthPad = 28, expanded = false, onToggleExpand, deselectedCols, onToggleCol }) => {
  const [hovered, setHovered] = useState(false);
  const showActions = hovered || onCanvas;
  const cols = TABLE_COLS[name];
  const hasCols = cols !== undefined;

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: `4px 10px 4px ${depthPad}px`,
          fontSize: 12,
          color: onCanvas ? '#1B58D4' : hovered ? '#1D232F' : '#64748B',
          cursor: hasCols ? 'pointer' : 'grab',
          borderRadius: 4, margin: '0 6px',
          background: onCanvas ? 'rgba(39,112,239,0.05)' : hovered ? '#F6F8FA' : 'transparent',
          position: 'relative', transition: 'background 110ms, color 110ms',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => hasCols && onToggleExpand?.(name)}
      >
        <span style={{ color: onCanvas ? '#2770EF' : undefined, flexShrink: 0, display: 'flex' }}>
          {isDbt ? <IconDbt /> : <IconTable />}
        </span>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: onCanvas ? 500 : undefined }}>
          {name}
        </span>
        {showActions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {onCanvas ? (
              <div
                title="Already on canvas"
                style={{ width: 22, height: 22, borderRadius: 4, color: '#2770EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={e => e.stopPropagation()}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            ) : (
              <>
                <button
                  style={{ width: 22, height: 22, border: 'none', background: 'transparent', borderRadius: 4, color: '#BFC6D0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'background 100ms, color 100ms' }}
                  onClick={e => e.stopPropagation()}
                  title="Table info"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EEF2FF'; (e.currentTarget as HTMLElement).style.color = '#2770EF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#BFC6D0'; }}
                >
                  <IconInfo />
                </button>
                <button
                  style={{ width: 22, height: 22, border: 'none', background: 'transparent', borderRadius: 4, color: '#BFC6D0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'background 100ms, color 100ms' }}
                  onClick={e => { e.stopPropagation(); onAdd(name); }}
                  title="Add to canvas"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EEF2FF'; (e.currentTarget as HTMLElement).style.color = '#2770EF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#BFC6D0'; }}
                >
                  <IconAddToCanvas />
                </button>
              </>
            )}
          </div>
        )}
        {/* Expand chevron — always show when table has column definitions */}
        {hasCols && (
          <span style={{
            color: '#BFC6D0', flexShrink: 0, display: 'flex',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 160ms cubic-bezier(0.4,0,0.2,1)',
          }}>
            <IconChevronRight size={9} />
          </span>
        )}
      </div>
      {/* Column rows */}
      {expanded && hasCols && cols.map(([col, type]) => {
        const isDesel = deselectedCols?.has(col) ?? false;
        const badge = getColTypeBadge(type);
        return (
          <div
            key={col}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: `3px 10px 3px ${depthPad + 14}px`,
              cursor: onCanvas ? 'pointer' : 'default',
              transition: 'background 80ms',
            }}
            onMouseEnter={e => { if (onCanvas) (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            onClick={() => onCanvas && onToggleCol?.(name, col)}
          >
            {onCanvas && (
              <div style={{
                width: 11, height: 11, borderRadius: 2.5, flexShrink: 0,
                border: `1.5px solid ${isDesel ? '#D1D5DB' : '#2770EF'}`,
                background: isDesel ? '#fff' : '#2770EF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 120ms',
              }}>
                {!isDesel && (
                  <svg width="6" height="6" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4.5l2 2 4-4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            )}
            <span style={{
              fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
              padding: '1px 4px', borderRadius: 3, flexShrink: 0,
              background: badge.bg, color: badge.color,
              opacity: isDesel ? 0.35 : 1, transition: 'opacity 120ms',
            }}>
              {type}
            </span>
            <span style={{
              fontSize: 11, flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: isDesel ? '#C0C6CF' : '#64748B',
              transition: 'color 120ms',
            }}>
              {col}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Tree connection (collapsible group) ───────────────────────────────────────

const TreeConn: React.FC<{
  id: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  muted?: boolean;
  depth?: number;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}> = ({ id, icon, label, count, muted, depth = 0, open, onToggle, children }) => {
  const pad = 14 + depth * 10;
  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: `5px 10px 5px ${pad}px`, cursor: 'pointer',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        onClick={() => onToggle(id)}
      >
        {icon}
        <span style={{ fontSize: 12, fontWeight: muted ? 500 : 600, color: muted ? '#64748B' : '#1D232F', flex: 1 }}>
          {label}
        </span>
        {count !== undefined && (
          <span style={{ fontSize: 10, color: '#BFC6D0', fontWeight: 500 }}>{count}</span>
        )}
        <span style={{ color: '#BFC6D0', transition: 'transform 180ms', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>
          <IconChevronRight />
        </span>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
};

// ── Canvas node card ──────────────────────────────────────────────────────────

const JOIN_TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  Inner:       { bg: 'rgba(39,112,239,0.10)',  fg: '#2770EF' },
  'Full Outer':  { bg: 'rgba(124,58,237,0.10)', fg: '#7C3AED' },
  'Left Outer':  { bg: 'rgba(6,182,212,0.10)',  fg: '#0891B2' },
  'Right Outer': { bg: 'rgba(245,158,11,0.10)', fg: '#D97706' },
};

const JoinBlockCard: React.FC<{
  join: CanvasJoin;
  selected: boolean;
  joinLabel: string;
  cardinalityLabel: string;
  onClick: (multi: boolean) => void;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
}> = ({ join, selected, joinLabel, cardinalityLabel, onClick, onMove, onRemove }) => {
  const dragRef = useRef<{ startPx: number; startPy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const jc = JOIN_TYPE_COLOR[joinLabel] || JOIN_TYPE_COLOR.Inner;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragRef.current = { startPx: e.clientX, startPy: e.clientY, ox: join.x, oy: join.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    const dx = e.clientX - d.startPx, dy = e.clientY - d.startPy;
    if (!d.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    d.moved = true; onMove(d.ox + dx, d.oy + dy);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current; dragRef.current = null;
    (e.currentTarget as HTMLElement).style.cursor = 'grab';
    if (!d?.moved) { e.stopPropagation(); onClick(e.shiftKey); }
  };

  return (
    <div
      style={{ position: 'absolute', left: join.x, top: join.y, cursor: 'grab', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={e => e.stopPropagation()}
    >
      <div style={{
        background: '#fff',
        border: `1.5px solid ${selected ? '#2770EF' : '#C0C6CF'}`,
        borderRadius: RADIUS8,
        boxShadow: selected
          ? '0 0 0 3px rgba(39,112,239,0.14), 0 2px 10px rgba(25,35,49,0.08)'
          : '0 2px 10px rgba(25,35,49,0.08)',
        width: 176,
        overflow: 'hidden',
      }}>
        {/* Accent stripe */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${jc.fg}aa, ${jc.fg}44)` }} />
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px 6px' }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: jc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="8" r="3.5" stroke={jc.fg} strokeWidth="1.3"/><circle cx="10" cy="8" r="3.5" stroke={jc.fg} strokeWidth="1.3"/></svg>
          </div>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1D232F', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{join.name}</span>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ width: 16, height: 16, border: 'none', background: 'transparent', color: '#C0C6CF', cursor: 'pointer', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E5484D')}
            onMouseLeave={e => (e.currentTarget.style.color = '#C0C6CF')}
          >
            <IconTrash size={10} />
          </button>
        </div>
        {/* Tags */}
        <div style={{ display: 'flex', gap: 5, padding: '0 10px 8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: jc.bg, color: jc.fg, letterSpacing: '0.02em' }}>{joinLabel}</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: '#F6F8FA', color: '#8B96A5', border: '1px solid #EAEDF2' }}>{cardinalityLabel}</span>
        </div>
        {/* Table pair */}
        <div style={{ borderTop: '1px solid #F0F2F6', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 10.5, color: '#475569', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{join.name.split(' × ')[0] || '—'}</span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><path d="M2 6h8M7 3l3 3-3 3" stroke="#BFC6D0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: 10.5, color: '#475569', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{join.table2Name || '—'}</span>
        </div>
        {/* Key columns */}
        {(join.col1 || join.col2) && (
          <div style={{ borderTop: '1px solid #F0F2F6', padding: '5px 10px 7px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <code style={{ fontSize: 9.5, color: '#8B96A5', fontFamily: "'SF Mono','Fira Mono',monospace", background: '#F6F8FA', padding: '1px 5px', borderRadius: 3, border: '1px solid #EAEDF2' }}>{join.col1 || '—'}</code>
            <span style={{ fontSize: 9, color: '#C8CDD6' }}>=</span>
            <code style={{ fontSize: 9.5, color: '#8B96A5', fontFamily: "'SF Mono','Fira Mono',monospace", background: '#F6F8FA', padding: '1px 5px', borderRadius: 3, border: '1px solid #EAEDF2' }}>{join.col2 || '—'}</code>
          </div>
        )}
      </div>
    </div>
  );
};

const CanvasNodeCard: React.FC<{
  group: CanvasGroup;
  selected: boolean;
  cached?: boolean;
  onClick: (multi: boolean) => void;
  onStepClick: (index: number) => void;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
  onRemoveStep: (index: number) => void;
}> = ({ group, selected, cached, onClick, onStepClick, onMove, onRemove, onRemoveStep }) => {
  const lastStep = group.steps[group.steps.length - 1];
  const meta = OP_META[lastStep.type];
  const tagColors = OP_TAG_COLORS[meta.tag] || OP_TAG_COLORS.source;
  const hasSteps = group.steps.length > 1;
  const isCsv = group.sourceKind === 'csv';
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const dragRef = useRef<{ startPx: number; startPy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragRef.current = { startPx: e.clientX, startPy: e.clientY, ox: group.x, oy: group.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    (e.currentTarget as HTMLElement).style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startPx;
    const dy = e.clientY - d.startPy;
    if (!d.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    d.moved = true;
    onMove(d.ox + dx, d.oy + dy);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    (e.currentTarget as HTMLElement).style.cursor = 'grab';
    if (!d?.moved) { e.stopPropagation(); onClick(e.shiftKey); }
  };

  return (
    <div
      style={{ position: 'absolute', left: group.x, top: group.y, cursor: 'grab', userSelect: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={e => e.stopPropagation()}
    >
      {/* Main card */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: '#fff',
        border: `1.5px solid ${selected ? '#2770EF' : '#C0C6CF'}`,
        borderRadius: RADIUS8,
        boxShadow: selected
          ? '0 0 0 3px rgba(39,112,239,0.14), 0 2px 10px rgba(25,35,49,0.08)'
          : '0 2px 10px rgba(25,35,49,0.08)',
        minWidth: 168,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px 7px', borderBottom: BORDER }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: isCsv ? 'rgba(22,163,74,0.10)' : '#F6F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCsv ? '#16A34A' : '#8B96A5', flexShrink: 0 }}>
            <IconTable size={11} color={isCsv ? '#16A34A' : '#8B96A5'} />
          </div>
          <span style={{ fontSize: 12, fontWeight: fw.semibold, color: '#1D232F', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.tableName}
          </span>
          {hasSteps && (
            <span style={{ fontSize: 10, fontWeight: fw.semibold, padding: '1px 6px', background: '#F0F2F6', borderRadius: 99, color: '#8B96A5', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {group.steps.length} steps
            </span>
          )}
          {isCsv ? (
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '1px 5px', borderRadius: 3, flexShrink: 0,
              background: 'rgba(22,163,74,0.10)', color: '#16A34A',
            }}>
              CSV
            </span>
          ) : (
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '1px 5px', borderRadius: 3, flexShrink: 0,
              background: tagColors.bg, color: tagColors.fg,
            }}>
              {meta.label}
            </span>
          )}
          {cached && (
            <span title="Cached in ThoughtSpot" style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '1px 5px', borderRadius: 3, flexShrink: 0,
              background: 'rgba(140,98,245,0.12)', color: '#7C3AED',
            }}>
              Cached
            </span>
          )}
          {/* Remove node */}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onRemove(); }}
            title="Remove"
            style={{
              width: 18, height: 18, border: 'none', background: 'transparent',
              color: '#C0C6CF', cursor: 'pointer', borderRadius: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E5484D')}
            onMouseLeave={e => (e.currentTarget.style.color = '#C0C6CF')}
          >
            <IconTrash size={11} />
          </button>
        </div>

        {/* Inline pipeline */}
        {hasSteps && (
          <div style={{ borderTop: BORDER, padding: '8px 10px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
              {group.steps.map((step, i) => {
                const m = OP_META[step.type];
                const tc = OP_TAG_COLORS[m.tag] || OP_TAG_COLORS.source;
                const isActive = group.activeStep === i;
                return (
                  <React.Fragment key={i}>
                    <div
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); onStepClick(i); }}
                      onMouseEnter={() => setHoveredStep(i)}
                      onMouseLeave={() => setHoveredStep(null)}
                      style={{
                        position: 'relative',
                        background: isActive ? 'rgba(39,112,239,0.04)' : '#F6F8FA',
                        border: `1px solid ${isActive ? '#2770EF' : hoveredStep === i ? '#A5ACB9' : '#EAEDF2'}`,
                        borderRadius: RADIUS6,
                        padding: '5px 10px',
                        minWidth: 'unset',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'border-color 120ms, background 120ms',
                      }}
                    >
                      {/* Remove step button — only for transformations (index > 0) */}
                      {i > 0 && hoveredStep === i && (
                        <button
                          onPointerDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); onRemoveStep(i); }}
                          title="Remove step"
                          style={{
                            position: 'absolute', top: 3, right: 3,
                            width: 14, height: 14, border: 'none',
                            background: '#fff', borderRadius: 3,
                            color: '#A5ACB9', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#E5484D')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#A5ACB9')}
                        >
                          <IconTrash size={9} />
                        </button>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: tc.fg }}>
                        {OP_ICON[step.type]}
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{m.label}</span>
                      </span>
                    </div>
                    {/* Arrow connector */}
                    {i < group.steps.length - 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', color: '#C0C6CF', flexShrink: 0 }}>
                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                          <path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main ModelCanvas ──────────────────────────────────────────────────────────

// Columns of a table that contain null values (for the Fix-nulls prep operator).
const nullColumnsOf = (tableName: string): { name: string; count: number }[] => {
  const cols = TABLE_COLS[tableName] ?? [];
  const rows = MOCK_DATA[tableName] ?? [];
  return cols
    .map(([name], i) => ({ name, count: rows.filter(r => r[i] === null).length }))
    .filter(c => c.count > 0);
};

// AI-suggested fill for a column's nulls (mirrors the Formula operator's Build-using-AI).
const suggestNullFill = (column: string, desc: string): string => {
  const d = desc.toLowerCase();
  if (/\b0\b|zero/.test(d)) return '0';
  if (d.includes('unassign') || d.includes('unknown') || d.includes('n/a')) return 'Unassigned';
  if (d.includes('blank') || d.includes('empty')) return "''";
  if (column === 'csm_owner') return 'CRM account owner (fallback: region lead)';
  if (column === 'region') return "back-filled from account's other records";
  if (column === 'tier') return 'derived from segment';
  return 'Unassigned';
};

const ModelCanvas: React.FC<ModelCanvasProps> = ({ onBack }) => {
  const [modelName, setModelName] = useState('Untitled model');
  const [dataMode, setDataMode] = useState<'live' | 'cached'>('live');
  const [cacheConfirm, setCacheConfirm] = useState<null | { onConfirm: () => void }>(null);
  const [dataModeMenuOpen, setDataModeMenuOpen] = useState(false);
  const [cacheSettingsOpen, setCacheSettingsOpen] = useState(false);
  const [cacheScope, setCacheScope] = useState<'Full model' | 'Custom'>('Full model');
  const [cacheFreq, setCacheFreq] = useState('Daily');
  const [cacheHour, setCacheHour] = useState('9:00 AM');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [agentProject, setAgentProject] = useState<ProjectState>({
    id: 'canvas-proj',
    name: 'Untitled model',
    buildStep: 'empty',
    activeTab: 'tables',
    publishedVersion: 0,
    hasUnpublishedChanges: true,
    projectSource: 'warehouse',
    context: emptyContext,
    addedTables: [],
    columnsSelected: false,
    includedColumns: {},
    columnOverrides: {},
    dqStatus: 'idle',
  });
  const [agentCollapsed, setAgentCollapsed] = useState(false);
  const [browserCollapsed, setBrowserCollapsed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewHeight, setPreviewHeight] = useState(224);
  const [previewMode, setPreviewMode] = useState<'data' | 'semantic'>('data');
  const [previewView, setPreviewView] = useState<'output' | 'input' | 'both'>('both');
  const [previewLimit, setPreviewLimit] = useState(25);
  const [activeBrowserTab, setActiveBrowserTab] = useState<'warehouse' | 'semantic' | 'business'>('warehouse');
  const [addDataOpen, setAddDataOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterConns, setFilterConns] = useState(new Set(['sf', 'bq']));
  const [groups, setGroups] = useState<CanvasGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const nodeCountRef = useRef(0);

  // Derived: primary selected (single) and selectedGroup
  const selectedId: string | null = selectedIds.size === 1 ? [...selectedIds][0] : null;

  const [expanded, setExpanded] = useState(new Set([
    'sf', 'sf-analytics', 'sf-public', 'bq', 'bq-db', 'bq-raw', 'dbt',
  ]));

  const [expandedTableRows, setExpandedTableRows] = useState<Set<string>>(new Set());
  const [deselectedCols, setDeselectedCols] = useState<Record<string, Set<string>>>({});

  const [multiJoinActive, setMultiJoinActive] = useState(false);
  const [multiJoinTable1, setMultiJoinTable1] = useState('');
  const [singleJoinActive, setSingleJoinActive] = useState(false);
  const [editingJoinId, setEditingJoinId] = useState<string | null>(null);
  const [canvasJoins, setCanvasJoins] = useState<CanvasJoin[]>([]);
  const joinCountRef = useRef(0);
  const [highlightedCol, setHighlightedCol] = useState<string | null>(null);
  const previewScrollRef = useRef<HTMLDivElement | null>(null);

  const [agentWidth, setAgentWidth] = useState(340);
  const [browserWidth, setBrowserWidth] = useState(260);
  const [resizingPanel, setResizingPanel] = useState<null | 'agent' | 'browser'>(null);
  const agentResizeRef = useRef<{ startX: number; startW: number } | null>(null);
  const browserResizeRef = useRef<{ startX: number; startW: number } | null>(null);

  const [joinConfig, setJoinConfig] = useState<{
    name: string;
    table2: string;
    col1: string;
    col2: string;
    joinType: 'inner' | 'full_outer' | 'left_outer' | 'right_outer';
    cardinality: 'many_to_one' | 'one_to_many' | 'one_to_one';
    extraPairs: Array<{ col1: string; col2: string }>;
  }>({
    name: '',
    table2: '',
    col1: '',
    col2: '',
    joinType: 'inner',
    cardinality: 'many_to_one',
    extraPairs: [],
  });

  const [formulaConfig, setFormulaConfig] = useState({
    colName: '',
    colNameTouched: false,
    aiDesc: '',
    aiActive: false,
    aiGenerating: false,
    expr: '',
  });

  const [nullFixConfig, setNullFixConfig] = useState<{
    column: string;
    aiActive: boolean;
    aiDesc: string;
    aiGenerating: boolean;
    value: string;
    applied: boolean;
  }>({ column: '', aiActive: false, aiDesc: '', aiGenerating: false, value: '', applied: false });

  const toggleExpanded = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleExpandTableRow = useCallback((name: string) => {
    setExpandedTableRows(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);

  const toggleCol = useCallback((tableName: string, col: string) => {
    setDeselectedCols(prev => {
      const set = new Set(prev[tableName] ?? []);
      if (set.has(col)) set.delete(col); else set.add(col);
      return { ...prev, [tableName]: set };
    });
  }, []);

  const handleAgentResizeDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    agentResizeRef.current = { startX: e.clientX, startW: agentWidth };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setResizingPanel('agent');
  }, [agentWidth]);
  const handleAgentResizeMove = useCallback((e: React.PointerEvent) => {
    if (!agentResizeRef.current) return;
    const dx = e.clientX - agentResizeRef.current.startX;
    setAgentWidth(Math.max(240, Math.min(560, agentResizeRef.current.startW + dx)));
  }, []);
  const handleAgentResizeUp = useCallback(() => {
    agentResizeRef.current = null;
    setResizingPanel(null);
  }, []);

  const handleBrowserResizeDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    browserResizeRef.current = { startX: e.clientX, startW: browserWidth };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setResizingPanel('browser');
  }, [browserWidth]);
  const handleBrowserResizeMove = useCallback((e: React.PointerEvent) => {
    if (!browserResizeRef.current) return;
    const dx = e.clientX - browserResizeRef.current.startX;
    setBrowserWidth(Math.max(200, Math.min(480, browserResizeRef.current.startW + dx)));
  }, []);
  const handleBrowserResizeUp = useCallback(() => {
    browserResizeRef.current = null;
    setResizingPanel(null);
  }, []);

  const addToCanvas = useCallback((tableName: string, sourceKind: 'warehouse' | 'csv' = 'warehouse', fileName?: string) => {
    const i = nodeCountRef.current % NODE_POSITIONS.length;
    nodeCountRef.current++;
    const pos = NODE_POSITIONS[i];
    const cols = TABLE_COLS[tableName] ?? [['id', 'INT'], ['value', 'VARCHAR']];
    const id = `ng_${nodeCountRef.current}`;
    setGroups(prev => [...prev, {
      id, tableName,
      sourceKind,
      csv: sourceKind === 'csv'
        ? { fileName: fileName ?? `${tableName}.csv`, delimiter: 'comma', quote: '"', encoding: 'UTF-8', header: true }
        : undefined,
      steps: [{ type: 'source', label: tableName, desc: sourceKind === 'csv' ? 'Uploaded file' : 'Raw table', cols }],
      x: pos.x + (nodeCountRef.current > NODE_POSITIONS.length ? Math.floor(nodeCountRef.current / NODE_POSITIONS.length) * 30 : 0),
      y: pos.y,
      expanded: false,
      activeStep: 0,
    }]);
    setSelectedIds(new Set([id]));
    setPreviewOpen(true);
    if (TABLE_COLS[tableName]) {
      setExpandedTableRows(prev => new Set([...prev, tableName]));
    }
  }, []);

  // ── CSV upload + data-mode caching gate ──────────────────────────────────────
  const handleCsvFile = (file?: File) => {
    const fileName = file?.name ?? 'customer_regions.csv';
    const add = () => addToCanvas('customer_regions', 'csv', fileName);
    const hasWarehouse = groups.some(g => (g.sourceKind ?? 'warehouse') === 'warehouse');
    if (dataMode === 'live' && hasWarehouse) {
      // Warehouse data present → must migrate it into the store to join with the file.
      setCacheConfirm({ onConfirm: () => { setDataMode('cached'); add(); setCacheConfirm(null); } });
    } else {
      // Nothing to migrate — the file lands in-store, so the model is inherently cached.
      setDataMode('cached');
      add();
    }
  };

  const setActiveStep = useCallback((id: string, step: number) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, activeStep: step } : g));
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, x, y } : g));
  }, []);

  const removeNode = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  }, []);

  const removeNodeStep = useCallback((id: string, index: number) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== id) return g;
      const steps = g.steps.filter((_, i) => i !== index);
      return { ...g, steps, activeStep: Math.min(g.activeStep, steps.length - 1) };
    }));
  }, []);

  const addStep = useCallback((opType: OpType, isPrep = false) => {
    if (!selectedId) return;
    if (opType === 'formula') {
      setFormulaConfig({ colName: '', colNameTouched: false, aiDesc: '', aiActive: false, aiGenerating: false, expr: '' });
    }
    if (opType === 'nullfix') {
      const g = groups.find(gr => gr.id === selectedId);
      const firstNull = g ? (nullColumnsOf(g.tableName)[0]?.name ?? '') : '';
      setNullFixConfig({ column: firstNull, aiActive: false, aiDesc: '', aiGenerating: false, value: '', applied: false });
    }
    setGroups(prev => prev.map(g => {
      if (g.id !== selectedId) return g;
      const meta = OP_META[opType];
      const cols = g.steps[g.steps.length - 1].cols;
      return {
        ...g,
        steps: [...g.steps, { type: opType, label: `${meta.label}: ${g.tableName}`, desc: meta.desc, cols, prep: isPrep || opType === 'nullfix' }],
        activeStep: g.steps.length,
      };
    }));
  }, [selectedId, groups]);

  // Prep transforms materialize data → they require caching. (Join/filter/formula/aggregate stay live.)
  const handlePrepStep = (op: OpType) => {
    const hasWarehouse = groups.some(g => (g.sourceKind ?? 'warehouse') === 'warehouse');
    if (dataMode === 'live' && hasWarehouse) {
      setCacheConfirm({ onConfirm: () => { setDataMode('cached'); addStep(op, true); setCacheConfirm(null); } });
    } else {
      setDataMode('cached');
      addStep(op, true);
    }
  };

  const applyJoin = useCallback(() => {
    const table1Id = multiJoinActive
      ? (groups.find(g => g.tableName === multiJoinTable1)?.id ?? '')
      : (selectedId ?? '');
    const t1 = groups.find(g => g.id === table1Id);
    const t2 = groups.find(g => g.tableName === joinConfig.table2);
    const x1 = t1?.x ?? 80, y1 = t1?.y ?? 80;
    const x2 = t2?.x ?? x1 + 300, y2 = t2?.y ?? y1;
    joinCountRef.current++;
    const jid = `join_${joinCountRef.current}`;
    setCanvasJoins(prev => [...prev, {
      id: jid,
      name: joinConfig.name || `${t1?.tableName ?? 'table1'} × ${joinConfig.table2 || 'table2'}`,
      table1Id,
      table2Name: joinConfig.table2,
      col1: joinConfig.col1,
      col2: joinConfig.col2,
      joinType: joinConfig.joinType,
      cardinality: joinConfig.cardinality,
      x: Math.round((x1 + x2) / 2) - 88,
      y: Math.max(y1, y2) + 110,
    }]);
    setSingleJoinActive(false);
    setMultiJoinActive(false);
    setSelectedIds(new Set([jid]));
    setJoinConfig({ name: '', table2: '', col1: '', col2: '', joinType: 'inner', cardinality: 'many_to_one', extraPairs: [] });
  }, [multiJoinActive, multiJoinTable1, groups, selectedId, joinConfig]);

  const selectedGroup = groups.find(g => g.id === selectedId) ?? null;

  // ── Topbar ──────────────────────────────────────────────────────────────────

  // Switching Cached → Live is only allowed with no CSV and no prep transformations.
  const modelHasCsv = groups.some(g => g.sourceKind === 'csv');
  const modelHasPrep = groups.some(g => g.steps.some(s => s.prep));
  const canSwitchToLive = !modelHasCsv && !modelHasPrep;

  const topbar = (
    <div style={{
      height: 48, background: '#fff', borderBottom: BORDER,
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 6, flexShrink: 0,
    }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748B', fontSize: 13, cursor: 'pointer', padding: '5px 8px', borderRadius: RADIUS6, border: 'none', background: 'none', fontFamily: ff.primary }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
      >
        <IconChevronLeft /> Models
      </button>
      <span style={{ color: '#C0C6CF', fontSize: 13, userSelect: 'none' }}>/</span>
      {/* Model name */}
      <input
        value={modelName}
        onChange={e => setModelName(e.target.value)}
        style={{
          fontSize: 14, fontWeight: fw.medium, color: '#1D232F',
          border: '1px solid transparent', borderRadius: RADIUS6,
          padding: '3px 8px', outline: 'none', background: 'transparent', fontFamily: ff.primary,
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.12)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none'; }}
        onMouseEnter={e => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.borderColor = '#C0C6CF'; e.currentTarget.style.background = '#F6F8FA'; } }}
        onMouseLeave={e => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent'; } }}
      />
      {/* Draft pill */}
      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 99, background: '#F6F8FA', color: '#8B96A5', border: BORDER, letterSpacing: '0.01em', userSelect: 'none', flexShrink: 0 }}>
        Draft
      </span>
      {/* Data mode dropdown — one-way status: Live → Cached */}
      <div style={{ position: 'relative', marginLeft: 4, flexShrink: 0 }}>
        <button
          onClick={e => { e.stopPropagation(); setDataModeMenuOpen(o => !o); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            fontSize: 12.5, fontWeight: 600, padding: '5px 9px 5px 12px', borderRadius: 99, cursor: 'pointer',
            fontFamily: ff.primary,
            background: dataMode === 'cached' ? 'rgba(140,98,245,0.10)' : 'rgba(22,163,74,0.10)',
            color: dataMode === 'cached' ? '#7C3AED' : '#16A34A',
            border: `1px solid ${dataMode === 'cached' ? 'rgba(140,98,245,0.32)' : 'rgba(22,163,74,0.30)'}`,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
          {dataMode === 'cached' ? 'Cached model' : 'Live query'}
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transform: dataModeMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {dataModeMenuOpen && (
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 290, background: '#fff', border: BORDER, borderRadius: RADIUS8, boxShadow: '0 8px 28px rgba(25,35,49,0.16)', zIndex: 120, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: dataMode === 'cached' ? '#7C3AED' : '#16A34A' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1D232F' }}>{dataMode === 'cached' ? 'Cached model' : 'Live query'}</span>
              {dataMode === 'cached' && (
                <>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => { setDataModeMenuOpen(false); setCacheSettingsOpen(true); }}
                    title="Cache settings"
                    style={{ width: 24, height: 24, border: 'none', background: 'transparent', borderRadius: 5, color: '#8B96A5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F0F2F6')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1.6l.85 1.55 1.72-.38.32 1.73 1.53.87-.83 1.55.83 1.55-1.53.87-.32 1.73-1.72-.38L8 14.4l-.85-1.55-1.72.38-.32-1.73-1.53-.87.83-1.55-.83-1.55 1.53-.87.32-1.73 1.72.38L8 1.6z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
                  </button>
                </>
              )}
            </div>
            {dataMode === 'cached' ? (
              <>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: '#5B6472', marginBottom: 10 }}>
                  Materialized in ThoughtSpot&rsquo;s data store — required to join uploaded files and run transformations.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#8B96A5' }}>Scope</span><span style={{ color: '#1D232F', fontWeight: 500 }}>{cacheScope}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#8B96A5' }}>Refresh</span><span style={{ color: '#1D232F', fontWeight: 500 }}>{cacheFreq} · {cacheHour}</span></div>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: BORDER }}>
                  <button
                    onClick={() => { if (canSwitchToLive) { setDataMode('live'); setDataModeMenuOpen(false); } }}
                    disabled={!canSwitchToLive}
                    style={{ width: '100%', padding: '7px 0', borderRadius: 7, border: `1px solid ${canSwitchToLive ? '#C0C6CF' : '#EAEDF2'}`, background: '#fff', color: canSwitchToLive ? '#1D232F' : '#BFC6D0', fontSize: 12, fontWeight: 600, cursor: canSwitchToLive ? 'pointer' : 'default', fontFamily: ff.primary }}
                  >
                    Switch to live query
                  </button>
                  {!canSwitchToLive && (
                    <div style={{ fontSize: 11, lineHeight: 1.45, color: '#8B96A5', marginTop: 7 }}>
                      Remove {modelHasCsv ? 'uploaded files' : ''}{modelHasCsv && modelHasPrep ? ' and ' : ''}{modelHasPrep ? 'prep transformations' : ''} to switch back to live query.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: '#5B6472', marginBottom: 12 }}>
                  Queries run live against your warehouse. Uploading a file or a prep transformation will cache this model into ThoughtSpot&rsquo;s data store.
                </div>
                <button
                  onClick={() => { setDataModeMenuOpen(false); setCacheConfirm({ onConfirm: () => { setDataMode('cached'); setCacheConfirm(null); } }); }}
                  style={{ width: '100%', padding: '7px 0', borderRadius: 7, border: '1px solid #C0C6CF', background: '#fff', color: '#1D232F', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}
                >
                  Switch to cached
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <div style={{ flex: 1 }} />
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {/* Run */}
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: RADIUS6, border: BORDER, background: '#fff', color: '#1D232F', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary, whiteSpace: 'nowrap' }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 3l10 5-10 5V3z" fill="currentColor"/></svg>
          Run
        </button>
        {/* Save */}
        <button style={{ padding: '6px 14px', borderRadius: RADIUS6, border: '1px solid #C0C6CF', background: '#fff', color: '#1D232F', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>
          Save
        </button>
        {/* Publish */}
        <button style={{ padding: '6px 16px', borderRadius: RADIUS6, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>
          Publish
        </button>
      </div>
    </div>
  );

  // ── Agent panel ─────────────────────────────────────────────────────────────

  const agentPanel = (
    <div style={{
      position: 'relative', flexShrink: 0,
      width: agentCollapsed ? 48 : agentWidth,
      transition: resizingPanel === 'agent' ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
    }}>
      <div style={{
        width: '100%', height: '100%',
        background: '#fff', borderRight: BORDER,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {agentCollapsed ? (
          /* Rail */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0', gap: 2 }}>
            <button onClick={() => setAgentCollapsed(false)} style={railBtnStyle} title="Expand data agent">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><circle cx="6" cy="6.5" r="0.75" fill="currentColor"/><circle cx="10" cy="6.5" r="0.75" fill="currentColor"/><path d="M5.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </button>
          </div>
        ) : (
          <AgentPanel
            project={agentProject}
            setProject={setAgentProject}
            messages={agentMessages}
            setMessages={setAgentMessages}
            isFromScratch={true}
            width={agentWidth}
          />
        )}
      </div>
      {/* Collapse button — overlaid top-right when expanded */}
      {!agentCollapsed && (
        <button
          onClick={() => setAgentCollapsed(true)}
          title="Collapse agent panel"
          style={{
            position: 'absolute', top: 9, right: 10, zIndex: 10,
            width: 22, height: 22, border: BORDER, borderRadius: 4,
            background: '#fff', color: '#8B96A5', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(25,35,49,0.08)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#1D232F'; (e.currentTarget as HTMLElement).style.borderColor = '#C0C6CF'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8B96A5'; (e.currentTarget as HTMLElement).style.borderColor = '#EAEDF2'; }}
        >
          <IconChevronLeft size={12} />
        </button>
      )}
      {/* Drag-to-resize handle */}
      {!agentCollapsed && (
        <div
          style={{
            position: 'absolute', right: -2, top: 0, bottom: 0, width: 4,
            cursor: 'col-resize', zIndex: 20,
          }}
          onPointerDown={handleAgentResizeDown}
          onPointerMove={handleAgentResizeMove}
          onPointerUp={handleAgentResizeUp}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(39,112,239,0.18)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        />
      )}
    </div>
  );

  // ── Data browser panel ──────────────────────────────────────────────────────

  const browserPanel = (
    <div style={{
      position: 'relative', flexShrink: 0,
      width: browserCollapsed ? 48 : browserWidth,
      transition: resizingPanel === 'browser' ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
    }}>
    <div style={{
      width: '100%', height: '100%',
      background: '#fff', borderRight: BORDER,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ height: 40, display: 'flex', alignItems: 'center', padding: browserCollapsed ? '0' : '0 14px', gap: 8, borderBottom: BORDER, flexShrink: 0, justifyContent: browserCollapsed ? 'center' : undefined }}>
        <div style={{ color: '#8B96A5', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="5" rx="5.5" ry="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 5v6c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" stroke="currentColor" strokeWidth="1.3"/></svg>
        </div>
        {!browserCollapsed && (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', flex: 1, whiteSpace: 'nowrap' }}>Data browser</span>
            {/* Add data */}
            <div style={{ position: 'relative' }}>
              <button
                style={{ width: 22, height: 22, border: BORDER, background: '#fff', borderRadius: 4, color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={e => { e.stopPropagation(); setAddDataOpen(o => !o); }}
                title="Add data"
              >
                <IconPlus size={10} />
              </button>
              {addDataOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: BORDER, borderRadius: RADIUS8, boxShadow: '0 4px 16px rgba(25,35,49,0.12)', minWidth: 172, zIndex: 100, overflow: 'hidden' }}>
                  {[
                    { label: 'Upload file', sub: 'CSV, Excel, JSON', color: 'rgba(39,112,239,0.08)', fg: '#2770EF', icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 11V5M5 8l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
                    { label: 'Create connection', sub: 'Snowflake, BigQuery…', color: 'rgba(140,98,245,0.08)', fg: '#8C62F5', icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 0010 0A5 5 0 003 8z" stroke="currentColor" strokeWidth="1.3"/><path d="M8 3c-1.5 0-2.5 2.2-2.5 5s1 5 2.5 5 2.5-2.2 2.5-5-1-5-2.5-5z" stroke="currentColor" strokeWidth="1.3"/><path d="M3 8h10" stroke="currentColor" strokeWidth="1.3"/></svg> },
                  ].map(item => (
                    <div key={item.label}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', fontSize: 12, color: '#1D232F', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F6F8FA'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      onClick={() => { setAddDataOpen(false); if (item.label === 'Upload file') fileInputRef.current?.click(); }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: item.color, color: item.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{item.label}</div>
                        <div style={{ fontSize: 10, color: '#8B96A5', marginTop: 1 }}>{item.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setBrowserCollapsed(true)} style={phdrBtnStyle} title="Collapse">
              <IconChevronLeft size={12} />
            </button>
          </>
        )}
      </div>

      {browserCollapsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0', gap: 2 }}>
          <button onClick={() => setBrowserCollapsed(false)} style={railBtnStyle} title="Expand data browser">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="5" rx="5.5" ry="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 5v6c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V5" stroke="currentColor" strokeWidth="1.3"/></svg>
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Browser tabs */}
          <div style={{ display: 'flex', borderBottom: BORDER, flexShrink: 0, background: '#fff', padding: '0 10px', gap: 16 }}>
            {(['warehouse', 'semantic', 'business'] as const).map(tab => {
              const isActive = activeBrowserTab === tab;
              const label = tab === 'warehouse' ? 'Warehouse' : tab === 'semantic' ? 'Semantic Models' : 'Business Apps';
              return (
                <button key={tab}
                  onClick={() => setActiveBrowserTab(tab)}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '7px 0 0', border: 'none', background: 'transparent',
                    cursor: 'pointer', fontFamily: ff.primary, marginBottom: -1, flexShrink: 0,
                  }}
                >
                  <span style={{
                    fontSize: 11.5, fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#2770EF' : '#8B96A5',
                    paddingBottom: 7,
                    borderBottom: `2px solid ${isActive ? '#2770EF' : 'transparent'}`,
                    transition: 'color 140ms, border-color 140ms',
                    whiteSpace: 'nowrap', display: 'inline-block',
                  }}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Search + filter */}
          <div style={{ padding: '9px 12px 8px', borderBottom: BORDER, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 32, background: '#F6F8FA', border: '1px solid #EAEDF2', borderRadius: RADIUS6, padding: '0 11px', transition: 'border-color 150ms, box-shadow 150ms' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#71A1F4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.10)'; e.currentTarget.style.background = '#fff'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#F6F8FA'; }}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ color: '#C0C6CF', flexShrink: 0 }}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input type="text" placeholder="Find tables, columns..." style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#1D232F', outline: 'none', flex: 1, minWidth: 0, fontFamily: ff.primary }} />
              </div>
              {/* Filter toggle */}
              <button
                onClick={() => setFilterOpen(o => !o)}
                title="Filter connections"
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  border: `1px solid ${filterOpen ? '#71A1F4' : '#EAEDF2'}`,
                  borderRadius: RADIUS6, background: filterOpen ? 'rgba(39,112,239,0.07)' : '#fff',
                  color: filterOpen ? '#2770EF' : '#8B96A5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 120ms',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>
            {/* Filter panel */}
            {filterOpen && (
              <div style={{ marginTop: 8, border: BORDER, borderRadius: RADIUS8, background: '#fff', overflow: 'hidden', boxShadow: '0 4px 16px rgba(25,35,49,0.10)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px 6px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#BFC6D0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connections</span>
                  <span
                    style={{ fontSize: 11, fontWeight: 600, color: '#2770EF', cursor: 'pointer' }}
                    onClick={() => setFilterConns(filterConns.size === 2 ? new Set() : new Set(['sf', 'bq']))}
                  >
                    {filterConns.size === 2 ? 'Deselect all' : 'Select all'}
                  </span>
                </div>
                <div style={{ padding: '2px 8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { id: 'sf', label: 'snowflake-prod', icon: <IconSnowflake /> },
                    { id: 'bq', label: 'bigquery-marketing', icon: <IconBigquery /> },
                  ].map(conn => (
                    <div
                      key={conn.id}
                      onClick={() => setFilterConns(prev => {
                        const next = new Set(prev);
                        if (next.has(conn.id)) next.delete(conn.id); else next.add(conn.id);
                        return next;
                      })}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: RADIUS6, cursor: 'pointer', transition: 'background 100ms' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F6F8FA'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <div style={{
                        width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${filterConns.has(conn.id) ? '#2770EF' : '#D1D5DB'}`,
                        background: filterConns.has(conn.id) ? '#2770EF' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 120ms',
                      }}>
                        {filterConns.has(conn.id) && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 5.5l2.5 2.5 5-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <span style={{ color: '#A5ACB9', flexShrink: 0, display: 'flex' }}>{conn.icon}</span>
                      <span style={{ fontSize: 12, color: '#1D232F', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Tree body */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeBrowserTab === 'warehouse' ? (
              <>
                {/* snowflake-prod */}
                {filterConns.has('sf') && (
                  <TreeConn id="sf" icon={<IconSnowflake />} label="snowflake-prod" open={expanded.has('sf')} onToggle={toggleExpanded}>
                    <TreeConn id="sf-analytics" icon={<IconDb />} label="ANALYTICS" muted depth={1} open={expanded.has('sf-analytics')} onToggle={toggleExpanded}>
                      <TreeConn id="sf-public" icon={<IconSchema />} label="PUBLIC" muted depth={2} open={expanded.has('sf-public')} onToggle={toggleExpanded}>
                        {['orders','customers','products','line_items','transactions'].map(t => (
                          <TreeTableRow
                            key={t} name={t} depthPad={50}
                            onCanvas={groups.some(g => g.tableName === t)}
                            onAdd={addToCanvas}
                            expanded={expandedTableRows.has(t)}
                            onToggleExpand={toggleExpandTableRow}
                            deselectedCols={deselectedCols[t]}
                            onToggleCol={toggleCol}
                          />
                        ))}
                      </TreeConn>
                    </TreeConn>
                  </TreeConn>
                )}
                {/* bigquery-marketing */}
                {filterConns.has('bq') && (
                  <TreeConn id="bq" icon={<IconBigquery />} label="bigquery-marketing" open={expanded.has('bq')} onToggle={toggleExpanded}>
                    <TreeConn id="bq-db" icon={<IconDb />} label="marketing_db" muted depth={1} open={expanded.has('bq-db')} onToggle={toggleExpanded}>
                      <TreeConn id="bq-raw" icon={<IconSchema />} label="raw" muted depth={2} open={expanded.has('bq-raw')} onToggle={toggleExpanded}>
                        {['campaigns','ad_events','conversions'].map(t => (
                          <TreeTableRow
                            key={t} name={t} depthPad={50}
                            onCanvas={groups.some(g => g.tableName === t)}
                            onAdd={addToCanvas}
                            expanded={expandedTableRows.has(t)}
                            onToggleExpand={toggleExpandTableRow}
                            deselectedCols={deselectedCols[t]}
                            onToggleCol={toggleCol}
                          />
                        ))}
                      </TreeConn>
                    </TreeConn>
                  </TreeConn>
                )}
              </>
            ) : (
              /* Semantic Models */
              <TreeConn id="dbt" icon={<IconDbt />} label="dbt (imported)" count={2} open={expanded.has('dbt')} onToggle={toggleExpanded}>
                {['fct_orders','dim_customers'].map(t => (
                  <TreeTableRow
                    key={t} name={t} isDbt depthPad={28}
                    onCanvas={groups.some(g => g.tableName === t)}
                    onAdd={addToCanvas}
                    expanded={expandedTableRows.has(t)}
                    onToggleExpand={toggleExpandTableRow}
                    deselectedCols={deselectedCols[t]}
                    onToggleCol={toggleCol}
                  />
                ))}
              </TreeConn>
            )}
          </div>
        </div>
      )}
    </div>
      {/* Drag-to-resize handle */}
      {!browserCollapsed && (
        <div
          style={{
            position: 'absolute', right: -2, top: 0, bottom: 0, width: 4,
            cursor: 'col-resize', zIndex: 20,
          }}
          onPointerDown={handleBrowserResizeDown}
          onPointerMove={handleBrowserResizeMove}
          onPointerUp={handleBrowserResizeUp}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(39,112,239,0.18)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        />
      )}
    </div>
  );

  // ── Properties panel ────────────────────────────────────────────────────────

  const activeStep = selectedGroup ? selectedGroup.steps[selectedGroup.activeStep] : null;
  void activeStep; // used via selectedGroup.steps[activeStep] inside panel

  const table1Cols: [string, string][] = selectedGroup ? (TABLE_COLS[selectedGroup.tableName] ?? []) : [];
  const table2Cols: [string, string][] = joinConfig.table2 ? (TABLE_COLS[joinConfig.table2] ?? []) : [];

  const joinTypePills: Array<{ key: 'inner' | 'full_outer' | 'left_outer' | 'right_outer'; label: string }> = [
    { key: 'inner', label: 'Inner' },
    { key: 'full_outer', label: 'Full Outer' },
    { key: 'left_outer', label: 'Left Outer' },
    { key: 'right_outer', label: 'Right Outer' },
  ];
  const cardinalityPills: Array<{ key: 'many_to_one' | 'one_to_many' | 'one_to_one'; label: string }> = [
    { key: 'many_to_one', label: 'Many:1' },
    { key: 'one_to_many', label: '1:Many' },
    { key: 'one_to_one', label: '1:1' },
  ];

  const selectStyle: React.CSSProperties = {
    width: '100%', appearance: 'none' as const, WebkitAppearance: 'none' as const,
    border: BORDER, borderRadius: 6, padding: '7px 28px 7px 10px',
    fontSize: 12, color: '#1D232F', background: '#fff', cursor: 'pointer',
    fontFamily: 'inherit', outline: 'none',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600, color: '#8B96A5',
    marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  };
  const selectWrap: React.CSSProperties = { position: 'relative' };
  const selectArrow = (
    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#BFC6D0' }}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );

  const TABLE_PATH: Record<string, { conn: string; db: string; schema: string }> = {
    orders:       { conn: 'snowflake-prod', db: 'analytics', schema: 'public' },
    customers:    { conn: 'snowflake-prod', db: 'analytics', schema: 'public' },
    products:     { conn: 'snowflake-prod', db: 'analytics', schema: 'public' },
    line_items:   { conn: 'snowflake-prod', db: 'analytics', schema: 'public' },
    transactions: { conn: 'snowflake-prod', db: 'analytics', schema: 'public' },
    campaigns:    { conn: 'bigquery-prod',  db: 'marketing', schema: 'raw' },
    ad_events:    { conn: 'bigquery-prod',  db: 'marketing', schema: 'raw' },
    conversions:  { conn: 'bigquery-prod',  db: 'marketing', schema: 'raw' },
    fct_orders:   { conn: 'snowflake-prod', db: 'analytics', schema: 'dbt' },
    dim_customers:{ conn: 'snowflake-prod', db: 'analytics', schema: 'dbt' },
  };

  // ── Canvas viewport ─────────────────────────────────────────────────────────

  const opButtons: { label: string; op: OpType; icon: React.ReactNode }[] = [
    { label: 'Join',      op: 'join',    icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/></svg> },
    { label: 'Filter',    op: 'filter',  icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4.5h12l-4.5 5.5v3l-3-1.5V10L2 4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
    { label: 'Aggregate', op: 'agg',     icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11.5 4h-7l5 4-5 4h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: 'Formula',   op: 'formula', icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M5.5 3.5c0-1 1.5-1 2 0V5c0 .5.5 1 1 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M7.5 5.5v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M5 8.5h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { label: 'Sort',      op: 'sort',    icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M5 3v10M5 13l-2-2M5 13l2-2M11 3v10M11 3l-2 2M11 3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: 'SQL',       op: 'sql',     icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4.5 5L2 8l2.5 3M11.5 5L14 8l-2.5 3M9.5 3.5l-3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: 'Python',    op: 'sql',     icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 2c-1.1 0-2 .4-2 1v2h4V4H6V3h4c1.1 0 2 .4 2 1v2c0 1.1-.9 2-2 2H6c-1.1 0-2 .9-2 2v2c0 .6.9 1 2 1h4c1.1 0 2-.4 2-1v-2H8v1h2v1H6v-1h4c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H6c-1.1 0-2-.9-2-2V3c0-.6.9-1 2-1z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round"/></svg> },
  ];

  const canvasViewport = (
    <div style={{
      flex: 1, position: 'relative', overflow: 'hidden',
      backgroundColor: '#EFF1F5',
      backgroundImage: 'radial-gradient(circle, #C2C9D4 1.2px, transparent 1.2px)',
      backgroundSize: '24px 24px',
    }}
      onClick={() => setSelectedIds(new Set())}
      onDragOver={e => { e.preventDefault(); }}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && /\.csv$/i.test(f.name)) handleCsvFile(f); }}
    >
      {/* Floating operator toolbar */}
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', alignItems: 'center', gap: 6, width: 'max-content' }}>
        <div style={{ background: '#fff', border: '1px solid #E2E6EC', borderRadius: 10, boxShadow: '0 4px 20px rgba(25,35,49,0.12), 0 1px 4px rgba(25,35,49,0.06)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
          {opButtons.map(({ label, op, icon }) => (
            <button key={label}
              onClick={e => {
                e.stopPropagation();
                if (op === 'join') {
                  if (selectedIds.size >= 2) {
                    const selGroups = [...selectedIds].map(id => groups.find(g => g.id === id)).filter(Boolean) as CanvasGroup[];
                    setMultiJoinTable1(selGroups[0]?.tableName ?? '');
                    setJoinConfig({ name: '', table2: selGroups[1]?.tableName ?? '', col1: '', col2: '', joinType: 'inner', cardinality: 'many_to_one', extraPairs: [] });
                    setMultiJoinActive(true);
                    setSingleJoinActive(false);
                  } else if (selectedId) {
                    setJoinConfig({ name: '', table2: '', col1: '', col2: '', joinType: 'inner', cardinality: 'many_to_one', extraPairs: [] });
                    setSingleJoinActive(true);
                    setMultiJoinActive(false);
                  }
                } else {
                  setSingleJoinActive(false);
                  setMultiJoinActive(false);
                  addStep(op);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: RADIUS6, border: 'none', background: 'transparent', color: '#64748B', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: ff.primary }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
            >
              {icon}{label}
            </button>
          ))}
          <div style={{ width: 1, height: 18, background: '#EAEDF2', margin: '0 2px', flexShrink: 0 }} />
          {/* Prep dropdown */}
          <div style={{ position: 'relative' }}
            onMouseEnter={e => { const menu = e.currentTarget.querySelector('[data-prep-menu]') as HTMLElement; if (menu) menu.style.display = 'block'; }}
            onMouseLeave={e => { const menu = e.currentTarget.querySelector('[data-prep-menu]') as HTMLElement; if (menu) menu.style.display = 'none'; }}
          >
            <button
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: RADIUS6, border: 'none', background: 'transparent', color: '#64748B', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: ff.primary }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M5 8h6M7 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              Prep
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 1 }}><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div data-prep-menu="" style={{ display: 'none', position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: '1px solid #E2E6EC', borderRadius: RADIUS8, boxShadow: '0 6px 24px rgba(25,35,49,0.13)', minWidth: 280, zIndex: 100, overflow: 'hidden', padding: '4px 0' }}>
              {[
                { label: 'Change type',    desc: 'Convert a column to another data type.',      op: 'formula' as OpType, icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><text x="1" y="11" fontSize="7" fontWeight="700" fill="currentColor">1</text><path d="M6 4l2-2 2 2M8 2v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><text x="8" y="15" fontSize="7" fontWeight="700" fill="currentColor">3</text></svg> },
                { label: 'Replace value', desc: 'Find and replace values in a column.',         op: 'formula' as OpType, icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-7 7-2.5.5.5-2.5 7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                { label: 'Fix nulls',     desc: 'AI-assisted or manual fix for null values.',   op: 'nullfix' as OpType, icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><line x1="4" y1="12" x2="12" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
                { label: 'Text case',     desc: 'Change case to lower, upper, or title.',       op: 'formula' as OpType, icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><text x="4" y="12" fontSize="11" fontWeight="700" fill="currentColor" fontFamily="serif">T</text></svg> },
                { label: 'Trim',          desc: 'Remove whitespace from one or both ends.',     op: 'formula' as OpType, icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 3l-4 5 4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                { label: 'Regex replace', desc: 'Replace text matching a regex pattern.',       op: 'formula' as OpType, icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 6L2 8l2 2M12 6l2 2-2 2M7 11l2-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                { label: 'Extract',       desc: 'Extract a substring matching a regex group.',  op: 'formula' as OpType, icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2"/><path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
                { label: 'Parse date',    desc: 'Parse a string into a date or timestamp.',     op: 'formula' as OpType, icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2 7h12M5 2v2M11 2v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={e => { e.stopPropagation(); handlePrepStep(item.op); }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F6F8FA'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <span style={{ color: '#64748B', flexShrink: 0, marginTop: 1, display: 'flex' }}>{item.icon}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F' }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: '#8B96A5', fontWeight: 400 }}>{item.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Undo / Redo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#fff', border: '1px solid #E2E6EC', borderRadius: 7, padding: '3px 4px', boxShadow: '0 2px 8px rgba(25,35,49,0.08)' }}>
          <button style={{ width: 26, height: 26, border: 'none', borderRadius: 4, background: 'transparent', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Undo"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {/* Undo: counter-clockwise arrow */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M9 14H4V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 14a9 9 0 1 1 2.34 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
          <button style={{ width: 26, height: 26, border: 'none', borderRadius: 4, background: 'transparent', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Redo"
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {/* Redo: clockwise arrow */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 14h5V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 14a9 9 0 1 0-2.34 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#fff', border: '1px solid #E2E6EC', borderRadius: 7, padding: '3px 4px', boxShadow: '0 2px 8px rgba(25,35,49,0.08)' }}>
          <button style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: 'transparent', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 300 }}>−</button>
          <span style={{ fontSize: 11, color: '#A5ACB9', padding: '0 4px', minWidth: 32, textAlign: 'center' }}>100%</span>
          <button style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: 'transparent', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 300 }}>+</button>
        </div>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: '#fff', border: '1px solid #E2E6EC', boxShadow: '0 2px 14px rgba(25,35,49,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B96A5', marginBottom: 2 }}>
            <IconDagEmpty />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1D232F' }}>Start building your model</div>
          <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 1.65, maxWidth: 288 }}>
            Drag a table from the browser onto the canvas, or let the AI agent build it for you.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              onClick={e => { e.stopPropagation(); addToCanvas('orders'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}
            >
              <IconPlus size={12} color="#fff" /> Add source
            </button>
            <button style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #C0C6CF', background: '#fff', color: '#1D232F', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>
              Ask AI
            </button>
          </div>
        </div>
      )}

      {/* Canvas nodes */}
      {groups.map(group => (
        <CanvasNodeCard
          key={group.id}
          group={group}
          selected={selectedIds.has(group.id)}
          cached={dataMode === 'cached'}
          onClick={(multi) => {
            if (multi) {
              setSelectedIds(prev => { const next = new Set(prev); if (next.has(group.id)) next.delete(group.id); else next.add(group.id); return next; });
            } else {
              setSelectedIds(new Set([group.id]));
            }
          }}
          onStepClick={(i) => setActiveStep(group.id, i)}
          onMove={(x, y) => moveNode(group.id, x, y)}
          onRemove={() => removeNode(group.id)}
          onRemoveStep={(i) => removeNodeStep(group.id, i)}
        />
      ))}

      {/* SVG connector layer */}
      {canvasJoins.length > 0 && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          {canvasJoins.map(j => {
            const t1 = groups.find(g => g.id === j.table1Id);
            const t2 = groups.find(g => g.tableName === j.table2Name);
            const jcx = j.x + 88; // join card center x (card ~176px wide)
            const jcy = j.y + 36; // join card center y
            const lines = [];
            if (t1) {
              const sx = t1.x + 180, sy = t1.y + 20;
              const mx = (sx + jcx) / 2;
              lines.push(<path key="t1" d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${jcy}, ${jcx} ${jcy}`} stroke="#2770EF" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.5"/>);
              lines.push(<circle key="t1d" cx={sx} cy={sy} r="3" fill="#2770EF" opacity="0.4"/>);
            }
            if (t2) {
              const sx = t2.x + 180, sy = t2.y + 20;
              const mx = (sx + jcx) / 2;
              lines.push(<path key="t2" d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${jcy}, ${jcx} ${jcy}`} stroke="#2770EF" strokeWidth="1.5" fill="none" strokeDasharray="4 3" opacity="0.5"/>);
              lines.push(<circle key="t2d" cx={sx} cy={sy} r="3" fill="#2770EF" opacity="0.4"/>);
            }
            return <g key={j.id}>{lines}</g>;
          })}
        </svg>
      )}

      {/* Join blocks */}
      {canvasJoins.map(j => {
        const joinLabel: Record<string, string> = { inner: 'Inner', full_outer: 'Full Outer', left_outer: 'Left Outer', right_outer: 'Right Outer' };
        const cardLabel: Record<string, string> = { many_to_one: 'Many:1', one_to_many: '1:Many', one_to_one: '1:1' };
        const selected = selectedIds.has(j.id);
        return (
          <JoinBlockCard
            key={j.id}
            join={j}
            selected={selected}
            joinLabel={joinLabel[j.joinType]}
            cardinalityLabel={cardLabel[j.cardinality]}
            onClick={(multi) => {
              setSingleJoinActive(false);
              setMultiJoinActive(false);
              if (multi) {
                setSelectedIds(prev => { const next = new Set(prev); if (next.has(j.id)) next.delete(j.id); else next.add(j.id); return next; });
              } else {
                setSelectedIds(new Set([j.id]));
              }
            }}
            onMove={(x, y) => setCanvasJoins(prev => prev.map(jj => jj.id === j.id ? { ...jj, x, y } : jj))}
            onRemove={() => { setCanvasJoins(prev => prev.filter(jj => jj.id !== j.id)); setSelectedIds(new Set()); }}
          />
        );
      })}

      {/* Floating properties panel — only when nodes selected */}
      {selectedIds.size > 0 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 60, right: 16, zIndex: 30,
            width: 288,
            background: '#fff', borderRadius: 10,
            border: BORDER, boxShadow: '0 4px 20px rgba(25,35,49,0.13), 0 1px 4px rgba(25,35,49,0.07)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            maxHeight: 'calc(100% - 32px)',
          }}
        >
          <div style={{ height: 38, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: BORDER, flexShrink: 0 }}>
            {(singleJoinActive || multiJoinActive) ? (
              <>
                <button onClick={() => { setSingleJoinActive(false); setMultiJoinActive(false); }} style={{ width: 20, height: 20, border: 'none', background: 'transparent', borderRadius: 4, color: '#BFC6D0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#64748B'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#BFC6D0'; }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <div style={{ color: '#2770EF' }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/></svg></div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', flex: 1 }}>Create Join</span>
              </>
            ) : (
              <>
                <div style={{ color: '#8B96A5' }}><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6h6M5 8.5h4M5 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg></div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', flex: 1 }}>Properties</span>
              </>
            )}
            <button
              onClick={() => { setSelectedIds(new Set()); setSingleJoinActive(false); setMultiJoinActive(false); }}
              style={{ width: 20, height: 20, border: 'none', background: 'transparent', borderRadius: 4, color: '#BFC6D0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#BFC6D0'; }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div style={{ overflowY: 'auto' }}>
            {(() => {
              // Check if the sole selection is a join block
              const selectedJoin = selectedIds.size === 1 ? canvasJoins.find(j => j.id === selectedId) : null;
              if (selectedJoin && !singleJoinActive) {
                const joinLabel: Record<string, string> = { inner: 'Inner', full_outer: 'Full Outer', left_outer: 'Left Outer', right_outer: 'Right Outer' };
                const cardLabel: Record<string, string> = { many_to_one: 'Many:1', one_to_many: '1:Many', one_to_one: '1:1' };
                const jc = JOIN_TYPE_COLOR[joinLabel[selectedJoin.joinType]] || JOIN_TYPE_COLOR.Inner;
                const isEditing = editingJoinId === selectedJoin.id;
                const t1Name = groups.find(g => g.id === selectedJoin.table1Id)?.tableName ?? selectedJoin.name.split(' × ')[0];
                const t1Cols: [string,string][] = TABLE_COLS[t1Name] ?? [];
                const t2Cols: [string,string][] = TABLE_COLS[selectedJoin.table2Name] ?? [];

                if (isEditing) {
                  return (
                    <div style={{ padding: '12px' }}>
                      <div style={{ marginBottom: 10 }}>
                        <label style={labelStyle}>Join name</label>
                        <input
                          value={joinConfig.name}
                          onChange={e => setJoinConfig(c => ({ ...c, name: e.target.value }))}
                          placeholder={selectedJoin.name}
                          style={{ width: '100%', boxSizing: 'border-box', border: BORDER, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#1D232F', fontFamily: ff.primary, outline: 'none', background: '#fff' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.12)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                      <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        <div><label style={labelStyle}>Table 1</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#8B96A5', fontFamily: ff.primary }}>{t1Name}</div></div>
                        <div><label style={labelStyle}>Table 2</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#8B96A5', fontFamily: ff.primary }}>{selectedJoin.table2Name}</div></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <div><label style={labelStyle}>Col (T1)</label><div style={selectWrap}><select value={joinConfig.col1} onChange={e => setJoinConfig(c => ({ ...c, col1: e.target.value }))} style={selectStyle}><option value="">Select</option>{t1Cols.map(([col]) => <option key={col} value={col}>{col}</option>)}</select>{selectArrow}</div></div>
                        <div><label style={labelStyle}>Col (T2)</label><div style={selectWrap}><select value={joinConfig.col2} onChange={e => setJoinConfig(c => ({ ...c, col2: e.target.value }))} style={selectStyle}><option value="">Select</option>{t2Cols.map(([col]) => <option key={col} value={col}>{col}</option>)}</select>{selectArrow}</div></div>
                      </div>
                      <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                      <div style={{ marginBottom: 10 }}>
                        <label style={labelStyle}>Join Type</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {joinTypePills.map(({ key, label }) => { const active = joinConfig.joinType === key; return <button key={key} onClick={() => setJoinConfig(c => ({ ...c, joinType: key }))} style={{ padding: '4px 9px', borderRadius: 99, border: `1px solid ${active ? '#2770EF' : '#E2E6EC'}`, background: active ? '#2770EF' : '#F6F8FA', color: active ? '#fff' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary, whiteSpace: 'nowrap' }}>{label}</button>; })}
                        </div>
                      </div>
                      <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                      <div style={{ marginBottom: 12 }}>
                        <label style={labelStyle}>Cardinality</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {cardinalityPills.map(({ key, label }) => { const active = joinConfig.cardinality === key; return <button key={key} onClick={() => setJoinConfig(c => ({ ...c, cardinality: key }))} style={{ padding: '4px 9px', borderRadius: 99, border: `1px solid ${active ? '#2770EF' : '#E2E6EC'}`, background: active ? '#2770EF' : '#F6F8FA', color: active ? '#fff' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>{label}</button>; })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            setCanvasJoins(prev => prev.map(j => j.id === selectedJoin.id ? {
                              ...j,
                              name: joinConfig.name || j.name,
                              col1: joinConfig.col1,
                              col2: joinConfig.col2,
                              joinType: joinConfig.joinType,
                              cardinality: joinConfig.cardinality,
                            } : j));
                            setEditingJoinId(null);
                          }}
                          style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}
                        >Save</button>
                        <button
                          onClick={() => setEditingJoinId(null)}
                          style={{ padding: '8px 14px', borderRadius: 7, border: BORDER, background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}
                        >Cancel</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      {[t1Name, selectedJoin.table2Name].map(name => (
                        <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, padding: '3px 9px 3px 7px', borderRadius: 99, background: '#EEF2FF', color: '#2770EF', border: '1px solid rgba(39,112,239,0.18)' }}>
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><rect x="0.75" y="1.75" width="10.5" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.1"/><path d="M0.75 4.5h10.5M4 4.5v5.75" stroke="currentColor" strokeWidth="1.1"/></svg>
                          {name}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 4, background: jc.bg, color: jc.fg }}>{joinLabel[selectedJoin.joinType]}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 4, background: '#F6F8FA', color: '#8B96A5', border: '1px solid #EAEDF2' }}>{cardLabel[selectedJoin.cardinality]}</span>
                    </div>
                    {(selectedJoin.col1 || selectedJoin.col2) && (
                      <div style={{ background: '#F6F8FA', border: BORDER, borderRadius: 7, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <code style={{ fontSize: 11, color: '#475569', fontFamily: "'SF Mono','Fira Mono',monospace" }}>{selectedJoin.col1}</code>
                        <span style={{ color: '#BFC6D0', fontSize: 11 }}>=</span>
                        <code style={{ fontSize: 11, color: '#475569', fontFamily: "'SF Mono','Fira Mono',monospace" }}>{selectedJoin.col2}</code>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setJoinConfig({
                          name: selectedJoin.name,
                          table2: selectedJoin.table2Name,
                          col1: selectedJoin.col1,
                          col2: selectedJoin.col2,
                          joinType: selectedJoin.joinType,
                          cardinality: selectedJoin.cardinality,
                          extraPairs: [],
                        });
                        setEditingJoinId(selectedJoin.id);
                      }}
                      style={{ width: '100%', padding: '7px 0', borderRadius: 7, border: BORDER, background: '#fff', color: '#1D232F', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.color = '#2770EF'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.color = '#1D232F'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Edit join
                    </button>
                  </div>
                );
              }
              return null;
            })()}
            {selectedIds.size > 1 ? (
              multiJoinActive ? (
                /* Multi-select join config */
                <div style={{ padding: '12px' }}>
                  {/* Table chips */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                    {[multiJoinTable1, joinConfig.table2].filter(Boolean).map((t, i) => (
                      <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: '#EEF2FF', color: '#2770EF', border: '1px solid rgba(39,112,239,0.18)' }}>{t}</span>
                    ))}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={labelStyle}>Join name</label>
                    <input value={joinConfig.name} onChange={e => setJoinConfig(c => ({ ...c, name: e.target.value }))} placeholder="e.g. orders_customers" style={{ width: '100%', boxSizing: 'border-box', border: BORDER, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#1D232F', fontFamily: 'inherit', outline: 'none', background: '#fff' }} onFocus={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.12)'; }} onBlur={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; }} />
                  </div>
                  <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={labelStyle}>Table 1</label>
                      <div style={selectWrap}>
                        <select value={multiJoinTable1} onChange={e => setMultiJoinTable1(e.target.value)} style={selectStyle}>
                          {Object.keys(TABLE_COLS).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>{selectArrow}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Table 2</label>
                      <div style={selectWrap}>
                        <select value={joinConfig.table2} onChange={e => setJoinConfig(c => ({ ...c, table2: e.target.value, col2: '' }))} style={selectStyle}>
                          <option value="">Select table</option>
                          {Object.keys(TABLE_COLS).filter(t => t !== multiJoinTable1).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>{selectArrow}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                    <div>
                      <label style={labelStyle}>Col (T1)</label>
                      <div style={selectWrap}>
                        <select value={joinConfig.col1} onChange={e => setJoinConfig(c => ({ ...c, col1: e.target.value }))} style={selectStyle}>
                          <option value="">Select</option>
                          {(TABLE_COLS[multiJoinTable1] ?? []).map(([col]) => <option key={col} value={col}>{col}</option>)}
                        </select>{selectArrow}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Col (T2)</label>
                      <div style={selectWrap}>
                        <select value={joinConfig.col2} onChange={e => setJoinConfig(c => ({ ...c, col2: e.target.value }))} style={selectStyle} disabled={!joinConfig.table2}>
                          <option value="">Select</option>
                          {(TABLE_COLS[joinConfig.table2] ?? []).map(([col]) => <option key={col} value={col}>{col}</option>)}
                        </select>{selectArrow}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setJoinConfig(c => ({ ...c, extraPairs: [...c.extraPairs, { col1: '', col2: '' }] }))} style={{ background: 'none', border: 'none', color: '#2770EF', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '4px 0', marginBottom: 10, fontFamily: 'inherit' }}>+ Add column</button>
                  <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                  <div style={{ marginBottom: 10 }}>
                    <label style={labelStyle}>Join Type</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {joinTypePills.map(({ key, label }) => { const active = joinConfig.joinType === key; return <button key={key} onClick={() => setJoinConfig(c => ({ ...c, joinType: key }))} style={{ padding: '4px 9px', borderRadius: 99, border: `1px solid ${active ? '#2770EF' : '#E2E6EC'}`, background: active ? '#2770EF' : '#F6F8FA', color: active ? '#fff' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{label}</button>; })}
                    </div>
                  </div>
                  <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                  <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>Cardinality</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {cardinalityPills.map(({ key, label }) => { const active = joinConfig.cardinality === key; return <button key={key} onClick={() => setJoinConfig(c => ({ ...c, cardinality: key }))} style={{ padding: '4px 9px', borderRadius: 99, border: `1px solid ${active ? '#2770EF' : '#E2E6EC'}`, background: active ? '#2770EF' : '#F6F8FA', color: active ? '#fff' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>; })}
                    </div>
                  </div>
                  <button onClick={applyJoin} style={{ width: '100%', padding: '8px 0', borderRadius: 7, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>Apply Join</button>
                </div>
              ) : (
                /* Multi-select summary — prompt to use Join */
                <div style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2770EF' }}>
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1D232F' }}>{selectedIds.size} tables selected</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#8B96A5', lineHeight: 1.6 }}>
                    {[...selectedIds].map(id => groups.find(g => g.id === id)?.tableName).filter(Boolean).join(', ')}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#BFC6D0' }}>Click Join in the toolbar to configure</p>
                </div>
              )
            ) : singleJoinActive ? (
              /* Single node join config */
              <div style={{ padding: '12px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                  {[selectedGroup!.tableName, joinConfig.table2].filter(Boolean).map((t, i) => (
                    <span key={i} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: '#EEF2FF', color: '#2770EF', border: '1px solid rgba(39,112,239,0.18)' }}>{t}</span>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Join name</label>
                  <input value={joinConfig.name} onChange={e => setJoinConfig(c => ({ ...c, name: e.target.value }))} placeholder={`${selectedGroup!.tableName} × ${joinConfig.table2 || '…'}`} style={{ width: '100%', boxSizing: 'border-box', border: BORDER, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#1D232F', fontFamily: ff.primary, outline: 'none', background: '#fff' }} onFocus={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.12)'; }} onBlur={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>
                <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div><label style={labelStyle}>Table 1</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#8B96A5', fontFamily: ff.primary }}>{selectedGroup!.tableName}</div></div>
                  <div><label style={labelStyle}>Table 2</label><div style={selectWrap}><select value={joinConfig.table2} onChange={e => setJoinConfig(c => ({ ...c, table2: e.target.value, col2: '' }))} style={selectStyle}><option value="">Select table</option>{Object.keys(TABLE_COLS).filter(t => t !== selectedGroup!.tableName).map(t => <option key={t} value={t}>{t}</option>)}</select>{selectArrow}</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                  <div><label style={labelStyle}>Col (T1)</label><div style={selectWrap}><select value={joinConfig.col1} onChange={e => setJoinConfig(c => ({ ...c, col1: e.target.value }))} style={selectStyle}><option value="">Select</option>{(TABLE_COLS[selectedGroup!.tableName] ?? []).map(([col]) => <option key={col} value={col}>{col}</option>)}</select>{selectArrow}</div></div>
                  <div><label style={labelStyle}>Col (T2)</label><div style={selectWrap}><select value={joinConfig.col2} onChange={e => setJoinConfig(c => ({ ...c, col2: e.target.value }))} style={selectStyle} disabled={!joinConfig.table2}><option value="">Select</option>{(TABLE_COLS[joinConfig.table2] ?? []).map(([col]) => <option key={col} value={col}>{col}</option>)}</select>{selectArrow}</div></div>
                </div>
                <button onClick={() => setJoinConfig(c => ({ ...c, extraPairs: [...c.extraPairs, { col1: '', col2: '' }] }))} style={{ background: 'none', border: 'none', color: '#2770EF', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '4px 0', marginBottom: 10, fontFamily: ff.primary }}>+ Add column</button>
                <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                <div style={{ marginBottom: 10 }}>
                  <label style={labelStyle}>Join Type</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {joinTypePills.map(({ key, label }) => { const active = joinConfig.joinType === key; return <button key={key} onClick={() => setJoinConfig(c => ({ ...c, joinType: key }))} style={{ padding: '4px 9px', borderRadius: 99, border: `1px solid ${active ? '#2770EF' : '#E2E6EC'}`, background: active ? '#2770EF' : '#F6F8FA', color: active ? '#fff' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary, whiteSpace: 'nowrap' }}>{label}</button>; })}
                  </div>
                </div>
                <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Cardinality</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {cardinalityPills.map(({ key, label }) => { const active = joinConfig.cardinality === key; return <button key={key} onClick={() => setJoinConfig(c => ({ ...c, cardinality: key }))} style={{ padding: '4px 9px', borderRadius: 99, border: `1px solid ${active ? '#2770EF' : '#E2E6EC'}`, background: active ? '#2770EF' : '#F6F8FA', color: active ? '#fff' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>{label}</button>; })}
                  </div>
                </div>
                <button onClick={applyJoin} style={{ width: '100%', padding: '8px 0', borderRadius: 7, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>Apply Join</button>
              </div>
            ) : !selectedGroup ? null : (
              /* Single node — pipeline dropdown + step config */
              <div>
                {/* Table name + path + pipeline — single section */}
                <div style={{ padding: '11px 12px 10px', borderBottom: BORDER }}>
                  {/* Name */}
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1D232F', marginBottom: 3 }}>{selectedGroup.tableName}</div>
                  {/* Path breadcrumb */}
                  {(() => {
                    const p = TABLE_PATH[selectedGroup.tableName];
                    if (!p) return null;
                    const crumbs = [p.conn, p.db, p.schema];
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 10, flexWrap: 'wrap' }}>
                        {crumbs.map((c, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 1.5l3 2.5-3 2.5" stroke="#C8CDD6" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            <span style={{ fontSize: 10.5, color: '#8B96A5', fontWeight: 500 }}>{c}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    );
                  })()}
                  {/* Pipeline label + dropdown */}
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#BFC6D0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Pipeline</div>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedGroup.activeStep}
                      onChange={e => setGroups(prev => prev.map(g => g.id === selectedId ? { ...g, activeStep: Number(e.target.value) } : g))}
                      style={{
                        width: '100%', appearance: 'none', WebkitAppearance: 'none',
                        border: BORDER, borderRadius: 6,
                        padding: '6px 28px 6px 9px', fontSize: 12, color: '#1D232F',
                        background: '#fff', cursor: 'pointer', fontFamily: ff.primary,
                        fontWeight: 500, outline: 'none',
                      }}
                    >
                      {selectedGroup.steps.map((step, i) => {
                        const m = OP_META[step.type];
                        return (
                          <option key={i} value={i}>Step {i + 1} — {step.label} ({m.label})</option>
                        );
                      })}
                    </select>
                    <div style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#BFC6D0' }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>

                {/* Step configuration */}
                <div style={{ padding: '12px' }}>
                  {(() => {
                    const sg = selectedGroup!;
                    const step = sg.steps[sg.activeStep];
                    const m = OP_META[step.type];
                    const tc = OP_TAG_COLORS[m.tag] || OP_TAG_COLORS.source;

                    if (step.type === 'source') {
                      return (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#BFC6D0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Source</div>
                          {sg.sourceKind !== 'csv' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER }}>
                              <span style={{ fontSize: 12, color: '#8B96A5', fontWeight: 500 }}>Table</span>
                              <span style={{ fontSize: 12, color: '#1D232F', fontWeight: 600 }}>{sg.tableName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER }}>
                              <span style={{ fontSize: 12, color: '#8B96A5', fontWeight: 500 }}>Columns</span>
                              <span style={{ fontSize: 12, color: '#1D232F', fontWeight: 600 }}>{step.cols.length}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER }}>
                              <span style={{ fontSize: 12, color: '#8B96A5', fontWeight: 500 }}>Connection</span>
                              <span style={{ fontSize: 12, color: '#1D232F', fontWeight: 600 }}>Snowflake</span>
                            </div>
                          </div>
                          )}
                          {sg.sourceKind === 'csv' && sg.csv && (
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#BFC6D0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>CSV import</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div><label style={labelStyle}>File</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#8B96A5', fontFamily: ff.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sg.csv.fileName}</div></div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <div style={{ flex: 1 }}><label style={labelStyle}>Rows</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#1D232F', fontWeight: 600, fontFamily: ff.primary }}>{MOCK_DATA[sg.tableName]?.length ?? '—'}</div></div>
                                  <div style={{ flex: 1 }}><label style={labelStyle}>Columns</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#1D232F', fontWeight: 600, fontFamily: ff.primary }}>{step.cols.length}</div></div>
                                </div>
                                <div><label style={labelStyle}>Delimiter</label><div style={selectWrap}><select value={sg.csv.delimiter} onChange={e => setGroups(prev => prev.map(g => g.id === sg.id ? { ...g, csv: { ...g.csv!, delimiter: e.target.value } } : g))} style={selectStyle}><option value="comma">Comma ( , )</option><option value="tab">Tab</option><option value="semicolon">Semicolon ( ; )</option><option value="pipe">Pipe ( | )</option></select>{selectArrow}</div></div>
                                <div><label style={labelStyle}>Quote character</label><div style={selectWrap}><select value={sg.csv.quote} onChange={e => setGroups(prev => prev.map(g => g.id === sg.id ? { ...g, csv: { ...g.csv!, quote: e.target.value } } : g))} style={selectStyle}><option value={'"'}>Double ( &quot; )</option><option value={"'"}>Single ( &apos; )</option></select>{selectArrow}</div></div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#1D232F', cursor: 'pointer', fontFamily: ff.primary }}>
                                  <input type="checkbox" checked={sg.csv.header} onChange={e => setGroups(prev => prev.map(g => g.id === sg.id ? { ...g, csv: { ...g.csv!, header: e.target.checked } } : g))} />
                                  First row is header
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    if (step.type === 'join') {
                      return (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#BFC6D0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Join Configuration</div>
                          <div style={{ marginBottom: 10 }}>
                            <label style={labelStyle}>Join name</label>
                            <input value={joinConfig.name} onChange={e => setJoinConfig(c => ({ ...c, name: e.target.value }))} placeholder="e.g. orders_customers" style={{ width: '100%', boxSizing: 'border-box', border: BORDER, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#1D232F', fontFamily: 'inherit', outline: 'none', background: '#fff' }} onFocus={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.12)'; }} onBlur={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; }} />
                          </div>
                          <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                            <div><label style={labelStyle}>Table 1</label><div style={selectWrap}><select value={sg.tableName} disabled style={{ ...selectStyle, background: '#F6F8FA', color: '#8B96A5', cursor: 'default' }}><option>{sg.tableName}</option></select>{selectArrow}</div></div>
                            <div><label style={labelStyle}>Table 2</label><div style={selectWrap}><select value={joinConfig.table2} onChange={e => setJoinConfig(c => ({ ...c, table2: e.target.value, col2: '' }))} style={selectStyle}><option value="">Select table</option>{Object.keys(TABLE_COLS).filter(t => t !== sg.tableName).map(t => <option key={t} value={t}>{t}</option>)}</select>{selectArrow}</div></div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
                            <div><label style={labelStyle}>Col (T1)</label><div style={selectWrap}><select value={joinConfig.col1} onChange={e => setJoinConfig(c => ({ ...c, col1: e.target.value }))} style={selectStyle}><option value="">Select</option>{table1Cols.map(([col]) => <option key={col} value={col}>{col}</option>)}</select>{selectArrow}</div></div>
                            <div><label style={labelStyle}>Col (T2)</label><div style={selectWrap}><select value={joinConfig.col2} onChange={e => setJoinConfig(c => ({ ...c, col2: e.target.value }))} style={selectStyle} disabled={!joinConfig.table2}><option value="">Select</option>{table2Cols.map(([col]) => <option key={col} value={col}>{col}</option>)}</select>{selectArrow}</div></div>
                          </div>
                          <button onClick={() => setJoinConfig(c => ({ ...c, extraPairs: [...c.extraPairs, { col1: '', col2: '' }] }))} style={{ background: 'none', border: 'none', color: '#2770EF', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: '4px 0', marginBottom: 10, fontFamily: 'inherit' }}>+ Add column</button>
                          <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                          <div style={{ marginBottom: 10 }}>
                            <label style={labelStyle}>Join Type</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {joinTypePills.map(({ key, label }) => { const active = joinConfig.joinType === key; return <button key={key} onClick={() => setJoinConfig(c => ({ ...c, joinType: key }))} style={{ padding: '4px 9px', borderRadius: 99, border: `1px solid ${active ? '#2770EF' : '#E2E6EC'}`, background: active ? '#2770EF' : '#F6F8FA', color: active ? '#fff' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{label}</button>; })}
                            </div>
                          </div>
                          <div style={{ borderTop: BORDER, margin: '10px 0' }} />
                          <div style={{ marginBottom: 12 }}>
                            <label style={labelStyle}>Cardinality</label>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {cardinalityPills.map(({ key, label }) => { const active = joinConfig.cardinality === key; return <button key={key} onClick={() => setJoinConfig(c => ({ ...c, cardinality: key }))} style={{ padding: '4px 9px', borderRadius: 99, border: `1px solid ${active ? '#2770EF' : '#E2E6EC'}`, background: active ? '#2770EF' : '#F6F8FA', color: active ? '#fff' : '#64748B', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>; })}
                            </div>
                          </div>
                          <button style={{ width: '100%', padding: '8px 0', borderRadius: 7, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Apply Join</button>
                        </div>
                      );
                    }

                    if (step.type === 'nullfix') {
                      const nc = nullFixConfig;
                      const nullCols = nullColumnsOf(sg.tableName);
                      const nfInputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: BORDER, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#1D232F', fontFamily: ff.primary, outline: 'none', background: '#fff' };
                      const nfFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.10)'; };
                      const nfBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; };
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {/* Column to fix */}
                          <div>
                            <label style={labelStyle}>Column to fix</label>
                            <div style={selectWrap}>
                              <select value={nc.column} onChange={e => setNullFixConfig(c => ({ ...c, column: e.target.value, applied: false }))} style={selectStyle}>
                                {nullCols.length === 0 && <option value="">No columns with nulls</option>}
                                {nullCols.map(c => <option key={c.name} value={c.name}>{c.name} · {c.count} null{c.count === 1 ? '' : 's'}</option>)}
                              </select>
                              {selectArrow}
                            </div>
                          </div>

                          {/* Fix using AI */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                              <span style={labelStyle}>Fix using AI</span>
                              <div title="Describe how to fill the nulls — AI suggests a value or expression" style={{ width: 14, height: 14, borderRadius: 99, border: '1.5px solid #BFC6D0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', flexShrink: 0 }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><text x="3.2" y="8" fontSize="8" fontWeight="700" fill="#BFC6D0">i</text></svg>
                              </div>
                            </div>
                            {nc.aiActive ? (
                              <div>
                                <textarea autoFocus value={nc.aiDesc} onChange={e => setNullFixConfig(c => ({ ...c, aiDesc: e.target.value }))} onFocus={nfFocus} onBlur={nfBlur} placeholder="e.g. use the account's region from CRM, or set to 0" rows={3} style={{ ...nfInputStyle, resize: 'none', lineHeight: 1.5 }} />
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                  <button disabled={!nc.aiDesc.trim() || nc.aiGenerating} onClick={() => { setNullFixConfig(c => ({ ...c, aiGenerating: true })); setTimeout(() => setNullFixConfig(c => ({ ...c, aiGenerating: false, aiActive: false, value: suggestNullFill(c.column, c.aiDesc), applied: false })), 1100); }} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: nc.aiDesc.trim() && !nc.aiGenerating ? '#2770EF' : '#E8ECEF', color: nc.aiDesc.trim() && !nc.aiGenerating ? '#fff' : '#A0A8B5', fontSize: 12, fontWeight: 600, cursor: nc.aiDesc.trim() && !nc.aiGenerating ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                    {nc.aiGenerating
                                      ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="20 40" strokeLinecap="round"/></svg>Generating…</>
                                      : <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="currentColor"/></svg>Generate fix</>
                                    }
                                  </button>
                                  <button onClick={() => setNullFixConfig(c => ({ ...c, aiActive: false, aiDesc: '' }))} style={{ padding: '6px 10px', borderRadius: 6, border: BORDER, background: '#fff', color: '#8B96A5', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button onClick={() => setNullFixConfig(c => ({ ...c, aiActive: true }))} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: '1.5px dashed #D6DBE5', borderRadius: 7, background: '#FAFBFC', color: '#A0A8B5', fontSize: 12, fontStyle: 'italic', cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: 6 }} onMouseEnter={e => e.currentTarget.style.borderColor = '#2770EF'} onMouseLeave={e => e.currentTarget.style.borderColor = '#D6DBE5'}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="#BFC6D0"/></svg>
                                {nc.aiDesc || 'Describe how to fill the nulls…'}
                              </button>
                            )}
                          </div>

                          <div style={{ borderTop: BORDER }} />

                          {/* Manual fill value / expression */}
                          <div>
                            <label style={labelStyle}>Fill value or expression</label>
                            <input value={nc.value} onChange={e => setNullFixConfig(c => ({ ...c, value: e.target.value, applied: false }))} onFocus={nfFocus} onBlur={nfBlur} placeholder="e.g. 0, Unassigned, or an expression" style={nfInputStyle} />
                          </div>

                          {/* Apply */}
                          <button
                            onClick={() => {
                              if (!nc.value.trim()) return;
                              setGroups(prev => prev.map(g => g.id === sg.id ? { ...g, steps: g.steps.map((s, i) => i === g.activeStep ? { ...s, nullFix: { column: nc.column, value: nc.value.trim() } } : s) } : g));
                              setNullFixConfig(c => ({ ...c, applied: true }));
                            }}
                            disabled={!nc.value.trim() || nc.applied}
                            style={{ width: '100%', padding: '9px 0', borderRadius: 7, border: 'none', background: nc.applied ? 'rgba(22,163,74,0.12)' : nc.value.trim() ? '#2770EF' : '#E8ECEF', color: nc.applied ? '#16A34A' : nc.value.trim() ? '#fff' : '#A0A8B5', fontSize: 13, fontWeight: 600, cursor: nc.value.trim() && !nc.applied ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                          >
                            {nc.applied
                              ? <><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>Fix applied</>
                              : 'Apply fix'
                            }
                          </button>
                        </div>
                      );
                    }

                    if (step.type === 'formula') {
                      const fc = formulaConfig;
                      const showColError = fc.colNameTouched && !fc.colName.trim();
                      const SAMPLE_EXPRS = [
                        { label: 'Profit margin', expr: '(revenue - cost) / revenue' },
                        { label: 'Full name', expr: "concat(first_name, ' ', last_name)" },
                        { label: 'Year', expr: 'year(order_date)' },
                      ];
                      const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: BORDER, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#1D232F', fontFamily: ff.primary, outline: 'none', background: '#fff' };
                      const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.10)'; };
                      const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; };
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {/* Column name */}
                          <div>
                            <label style={labelStyle}>New column name</label>
                            <input
                              value={fc.colName}
                              onChange={e => setFormulaConfig(f => ({ ...f, colName: e.target.value }))}
                              onBlur={e => { setFormulaConfig(f => ({ ...f, colNameTouched: true })); inputBlur(e); }}
                              onFocus={inputFocus}
                              placeholder="e.g. profit_margin"
                              style={{ ...inputStyle, borderColor: showColError ? '#E53E3E' : '#EAEDF2' }}
                            />
                            {showColError && <div style={{ fontSize: 11, color: '#E53E3E', marginTop: 4, fontWeight: 500, fontFamily: ff.primary }}>Required</div>}
                          </div>

                          {/* Build using AI */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                              <span style={labelStyle}>Build using AI</span>
                              <div title="Describe what you want in plain language — AI will write the expression for you" style={{ width: 14, height: 14, borderRadius: 99, border: '1.5px solid #BFC6D0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', flexShrink: 0 }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><text x="3.2" y="8" fontSize="8" fontWeight="700" fill="#BFC6D0">i</text></svg>
                              </div>
                            </div>
                            {fc.aiActive ? (
                              <div>
                                <textarea
                                  autoFocus
                                  value={fc.aiDesc}
                                  onChange={e => setFormulaConfig(f => ({ ...f, aiDesc: e.target.value }))}
                                  onFocus={inputFocus}
                                  onBlur={inputBlur}
                                  placeholder="e.g. profit divided by revenue as a percentage"
                                  rows={3}
                                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                                />
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                  <button
                                    disabled={!fc.aiDesc.trim() || fc.aiGenerating}
                                    onClick={() => {
                                      setFormulaConfig(f => ({ ...f, aiGenerating: true }));
                                      setTimeout(() => {
                                        const generated = fc.aiDesc.toLowerCase().includes('profit')
                                          ? '(revenue - cost) / revenue * 100'
                                          : fc.aiDesc.toLowerCase().includes('name')
                                          ? "concat(first_name, ' ', last_name)"
                                          : fc.aiDesc.toLowerCase().includes('year')
                                          ? 'year(order_date)'
                                          : `/* ${fc.aiDesc} */`;
                                        setFormulaConfig(f => ({ ...f, aiGenerating: false, aiActive: false, expr: generated }));
                                      }, 1200);
                                    }}
                                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: fc.aiDesc.trim() && !fc.aiGenerating ? '#2770EF' : '#E8ECEF', color: fc.aiDesc.trim() && !fc.aiGenerating ? '#fff' : '#A0A8B5', fontSize: 12, fontWeight: 600, cursor: fc.aiDesc.trim() && !fc.aiGenerating ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                  >
                                    {fc.aiGenerating
                                      ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="20 40" strokeLinecap="round"/></svg>Generating…</>
                                      : <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="currentColor"/></svg>Generate expression</>
                                    }
                                  </button>
                                  <button onClick={() => setFormulaConfig(f => ({ ...f, aiActive: false, aiDesc: '' }))} style={{ padding: '6px 10px', borderRadius: 6, border: BORDER, background: '#fff', color: '#8B96A5', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setFormulaConfig(f => ({ ...f, aiActive: true }))}
                                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: '1.5px dashed #D6DBE5', borderRadius: 7, background: '#FAFBFC', color: '#A0A8B5', fontSize: 12, fontStyle: 'italic', cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: 6 }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#2770EF'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#D6DBE5'}
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="#BFC6D0"/></svg>
                                {fc.aiDesc || 'Describe your formula in plain language…'}
                              </button>
                            )}
                          </div>

                          <div style={{ borderTop: BORDER }} />

                          {/* Expression */}
                          <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={labelStyle}>Expression</span>
                              {fc.expr && <button onClick={() => setFormulaConfig(f => ({ ...f, expr: '' }))} style={{ background: 'none', border: 'none', color: '#BFC6D0', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: ff.primary }}>Clear</button>}
                            </div>
                            <textarea
                              value={fc.expr}
                              onChange={e => setFormulaConfig(f => ({ ...f, expr: e.target.value }))}
                              onFocus={inputFocus}
                              onBlur={inputBlur}
                              placeholder={'Enter an expression or custom value'}
                              rows={4}
                              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: "'SF Mono', 'Fira Mono', 'Menlo', monospace", background: '#F6F8FA', minHeight: 80 }}
                            />
                            {fc.aiGenerating && (
                              <div style={{ position: 'absolute', inset: 0, borderRadius: 6, background: 'rgba(245,248,255,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#2770EF', animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="20 40" strokeLinecap="round"/></svg>
                                <span style={{ fontSize: 11, color: '#2770EF', fontWeight: 600, fontFamily: ff.primary }}>Generating expression…</span>
                              </div>
                            )}
                          </div>

                          {/* Quick examples */}
                          {!fc.expr && (
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#BFC6D0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: ff.primary }}>Examples</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {SAMPLE_EXPRS.map(s => (
                                  <button key={s.label} onClick={() => setFormulaConfig(f => ({ ...f, expr: s.expr }))}
                                    style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 6, border: BORDER, background: '#F6F8FA', cursor: 'pointer', fontFamily: ff.primary, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#EEF2FF'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.background = '#F6F8FA'; }}>
                                    <span style={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>{s.label}</span>
                                    <code style={{ fontSize: 10, color: '#8B96A5', fontFamily: "'SF Mono', 'Fira Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{s.expr}</code>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <button
                            disabled={!fc.colName.trim() || !fc.expr.trim()}
                            onClick={() => {
                              if (!fc.colName.trim() || !fc.expr.trim() || !selectedId) return;
                              const colName = fc.colName.trim();
                              // Add column to active step's cols
                              setGroups(prev => prev.map(g => {
                                if (g.id !== selectedId) return g;
                                const steps = g.steps.map((s, i) =>
                                  i === g.activeStep ? { ...s, cols: [...s.cols, [colName, 'FLOAT'] as [string, string]] } : s
                                );
                                return { ...g, steps };
                              }));
                              // Reset formula form
                              setFormulaConfig({ colName: '', colNameTouched: false, aiDesc: '', aiActive: false, aiGenerating: false, expr: '' });
                              // Open preview + scroll/highlight new column
                              setPreviewOpen(true);
                              setHighlightedCol(colName);
                              setTimeout(() => {
                                const el = previewScrollRef.current?.querySelector(`[data-col="${colName}"]`);
                                el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                              }, 60);
                              setTimeout(() => setHighlightedCol(null), 2500);
                            }}
                            style={{ width: '100%', padding: '8px 0', borderRadius: 7, border: 'none', background: fc.colName.trim() && fc.expr.trim() ? '#2770EF' : '#E8ECEF', color: fc.colName.trim() && fc.expr.trim() ? '#fff' : '#A0A8B5', fontSize: 13, fontWeight: 600, cursor: fc.colName.trim() && fc.expr.trim() ? 'pointer' : 'default', fontFamily: ff.primary }}
                          >
                            Add column
                          </button>
                        </div>
                      );
                    }

                    /* All other step types — generic config placeholder */
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 4, background: tc.bg, color: tc.fg }}>{m.label}</span>
                          <span style={{ fontSize: 11, color: '#8B96A5' }}>{m.desc}</span>
                        </div>
                        <div style={{ background: '#F6F8FA', border: BORDER, borderRadius: 8, padding: '20px 16px', textAlign: 'center' }}>
                          <div style={{ fontSize: 12, color: '#BFC6D0', fontWeight: 500 }}>
                            {step.label}
                          </div>
                          <div style={{ fontSize: 11, color: '#C8CDD6', marginTop: 4 }}>
                            Configuration panel
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Minimap */}
      <div style={{ position: 'absolute', bottom: 16, left: 16, width: 128, height: 80, background: '#fff', border: '1px solid #E2E6EC', borderRadius: RADIUS6, boxShadow: '0 2px 8px rgba(25,35,49,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 22, borderBottom: '1px solid #F0F2F6', display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0, gap: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#BFC6D0', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>Overview</span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ color: '#C8CDD6' }}><rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/></svg>
        </div>
        <div style={{ flex: 1, background: '#F6F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 9, color: '#C8CDD6' }}>{groups.length === 0 ? 'Empty canvas' : `${groups.length} node${groups.length > 1 ? 's' : ''}`}</span>
        </div>
      </div>
    </div>
  );

  // ── Preview panel ───────────────────────────────────────────────────────────

  const previewPanel = (
    <div style={{
      background: '#fff', borderTop: BORDER,
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
      height: previewOpen ? previewHeight : 38,
      transition: 'height 220ms cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Resize handle */}
      {previewOpen && (
        <div
          style={{ height: 4, cursor: 'ns-resize', flexShrink: 0, background: 'transparent', position: 'relative', zIndex: 10 }}
          onPointerDown={e => {
            e.preventDefault();
            const startY = e.clientY;
            const startH = previewHeight;
            const onMove = (ev: PointerEvent) => setPreviewHeight(Math.max(120, Math.min(600, startH + (startY - ev.clientY))));
            const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', onUp);
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(39,112,239,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        />
      )}
      {/* ── Header ── */}
      <div style={{ height: 38, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6, flexShrink: 0 }}>
        {/* Data / Semantic toggle */}
        <div style={{ display: 'flex', alignItems: 'center', background: '#F0F2F6', borderRadius: 6, padding: 2, gap: 1 }}>
          {(['data', 'semantic'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              style={{
                fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 4,
                border: 'none', cursor: 'pointer', fontFamily: ff.primary,
                background: previewMode === mode ? '#fff' : 'transparent',
                color: previewMode === mode ? '#1D232F' : '#8B96A5',
                boxShadow: previewMode === mode ? '0 1px 2px rgba(25,35,49,0.10)' : 'none',
                transition: 'all 120ms', whiteSpace: 'nowrap',
              }}
            >{mode === 'data' ? 'Data' : 'Semantic'}</button>
          ))}
        </div>
        {/* View selector — only in data mode */}
        {previewMode === 'data' && (() => {
          const hasTransform = selectedGroup ? selectedGroup.steps.length > 1 : !!canvasJoins.find(j => j.id === selectedId);
          const effectiveView = hasTransform ? previewView : 'output';
          return (
            <>
              <div style={{ width: 1, height: 14, background: '#EAEDF2', flexShrink: 0 }} />
              <div style={{ position: 'relative' }}>
                <select
                  value={effectiveView}
                  onChange={e => setPreviewView(e.target.value as 'output' | 'input' | 'both')}
                  disabled={!hasTransform}
                  style={{ appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 5, padding: '3px 22px 3px 8px', fontSize: 11, fontFamily: ff.primary, fontWeight: 500, color: hasTransform ? '#1D232F' : '#BFC6D0', background: '#fff', cursor: hasTransform ? 'pointer' : 'default', outline: 'none', opacity: hasTransform ? 1 : 0.55 }}
                >
                  <option value="output">Output only</option>
                  <option value="input" disabled={!hasTransform}>Source only</option>
                  <option value="both" disabled={!hasTransform}>Source &amp; output</option>
                </select>
                <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#BFC6D0' }}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </>
          );
        })()}
        {/* Table info — semantic mode */}
        {selectedGroup && previewMode === 'semantic' && (
          <>
            <span style={{ fontSize: 11, color: '#C0C6CF', flexShrink: 0 }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#1D232F', flexShrink: 0 }}>{selectedGroup.tableName}</span>
            <span style={{ fontSize: 11, color: '#BFC6D0', flexShrink: 0 }}>{selectedGroup.steps[selectedGroup.activeStep].cols.length} columns</span>
          </>
        )}
        <div style={{ flex: 1 }} />
        {/* Limit — data mode only */}
        {previewMode === 'data' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#8B96A5', whiteSpace: 'nowrap' }}>Limit</span>
            <div style={{ position: 'relative' }}>
              <select value={previewLimit} onChange={e => setPreviewLimit(Number(e.target.value))}
                style={{ appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 5, padding: '3px 22px 3px 8px', fontSize: 11, fontFamily: ff.primary, fontWeight: 500, color: '#1D232F', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#BFC6D0' }}>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setPreviewOpen(o => !o)}
          style={{ width: 22, height: 22, border: 'none', background: 'transparent', borderRadius: 4, color: '#BFC6D0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconChevronDown size={11} />
        </button>
      </div>

      {/* ── Content ── */}
      {previewOpen && (() => {
        const numericTypes = ['INT', 'FLOAT', 'DECIMAL', 'NUMERIC', 'INTEGER', 'BIGINT'];
        // grow rows with panel height: overhead = handle(4) + header(38) + mini-header(28) + thead(25)
        const rowsThatFit = Math.max(0, Math.floor((previewHeight - 95) / 25));
        const rowCap = Math.max(previewLimit, rowsThatFit);

        // ── Join block selected ──
        const selJoin = !selectedGroup ? canvasJoins.find(j => j.id === selectedId) : null;
        if (!selectedGroup && selJoin) {
          const t1Group = groups.find(g => g.id === selJoin.table1Id);
          const t2Group = groups.find(g => g.tableName === selJoin.table2Name);
          const t1Cols: [string, string][] = t1Group ? t1Group.steps[0].cols : (TABLE_COLS[selJoin.name.split(' × ')[0]] ?? []);
          const t2Cols: [string, string][] = t2Group ? t2Group.steps[0].cols : (TABLE_COLS[selJoin.table2Name] ?? []);
          const t1Rows = (MOCK_DATA[t1Group?.tableName ?? ''] ?? []).slice(0, rowCap);
          const t2Rows = (MOCK_DATA[selJoin.table2Name] ?? []).slice(0, rowCap);
          const mergedCols: [string, string][] = [...t1Cols, ...t2Cols];
          const mergedRows = t1Rows.map((r, i) => [...r, ...(t2Rows[i] ?? t2Cols.map(() => null))]);
          const joinLabel: Record<string, string> = { inner: 'Inner', full_outer: 'Full Outer', left_outer: 'Left Outer', right_outer: 'Right Outer' };

          const renderJoinTable = (tCols: [string, string][], tRows: Row[], scrollRef?: React.RefObject<HTMLDivElement | null>) => (
            <div ref={scrollRef} style={{ flex: 1, overflow: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 11.5, tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}>
                <thead>
                  <tr style={{ background: '#F6F8FA', position: 'sticky', top: 0, zIndex: 2 }}>
                    <th style={{ width: 36, padding: '5px 8px', borderRight: BORDER, borderBottom: BORDER, color: '#C0C6CF', fontWeight: 600, fontSize: 10, textAlign: 'center' }}>#</th>
                    {tCols.map(([col, type]) => (
                      <th key={col} style={{ padding: '5px 12px', borderRight: BORDER, borderBottom: BORDER, textAlign: numericTypes.includes(type) ? 'right' : 'left', whiteSpace: 'nowrap', fontWeight: 600, color: '#1D232F', minWidth: numericTypes.includes(type) ? 72 : 100 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: numericTypes.includes(type) ? 'flex-end' : 'flex-start' }}>
                          {col}
                          <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', padding: '1px 3px', borderRadius: 2, background: getColTypeBadge(type).bg, color: getColTypeBadge(type).color }}>{type}</span>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tRows.length === 0 ? (
                    <tr><td colSpan={tCols.length + 1} style={{ padding: '20px', textAlign: 'center', color: '#A5ACB9', fontSize: 12 }}>No rows</td></tr>
                  ) : tRows.map((row, ri) => (
                    <tr key={ri} style={{ background: ri % 2 === 1 ? '#FAFBFC' : '#fff' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EEF2FF'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ri % 2 === 1 ? '#FAFBFC' : '#fff'}
                    >
                      <td style={{ padding: '4px 8px', borderRight: BORDER, color: '#C0C6CF', fontSize: 10, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{ri + 1}</td>
                      {tCols.map(([col, type], ci) => {
                        const val = row[ci];
                        const isNum = numericTypes.includes(type);
                        return (
                          <td key={col} style={{ padding: '4px 12px', borderRight: BORDER, textAlign: isNum ? 'right' : 'left', color: '#1D232F', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {val === null || val === undefined ? <span style={{ color: '#C0C6CF' }}>null</span> : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );

          if (previewMode === 'semantic') {
            return (
              <div style={{ flex: 1, borderTop: BORDER, overflow: 'auto' }}>
                <div style={{ padding: '7px 12px 6px', background: '#F6F8FA', borderBottom: BORDER, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#8B96A5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{joinLabel[selJoin.joinType]} join</span>
                  <span style={{ color: '#D0D6DF' }}>·</span>
                  <span style={{ fontSize: 11, color: '#1D232F' }}>{t1Group?.tableName ?? selJoin.name.split(' × ')[0]}</span>
                  <span style={{ fontSize: 11, color: '#BFC6D0' }}>×</span>
                  <span style={{ fontSize: 11, color: '#1D232F' }}>{selJoin.table2Name}</span>
                  <span style={{ fontSize: 10, color: '#BFC6D0', marginLeft: 4 }}>{mergedCols.length} columns</span>
                </div>
                <table style={{ borderCollapse: 'collapse', fontSize: 11.5, tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}>
                  <thead>
                    <tr style={{ background: '#F6F8FA', position: 'sticky', top: 0, zIndex: 2 }}>
                      <th style={{ width: 32, padding: '5px 8px', borderRight: BORDER, borderBottom: BORDER, color: '#C0C6CF', fontWeight: 600, fontSize: 10, textAlign: 'center' }}>#</th>
                      <th style={{ padding: '5px 14px', borderRight: BORDER, borderBottom: BORDER, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', textAlign: 'left', minWidth: 130 }}>Column</th>
                      <th style={{ padding: '5px 14px', borderRight: BORDER, borderBottom: BORDER, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', textAlign: 'left', minWidth: 80 }}>Type</th>
                      <th style={{ padding: '5px 14px', borderRight: BORDER, borderBottom: BORDER, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', textAlign: 'left', minWidth: 60 }}>Source</th>
                      <th style={{ padding: '5px 14px', borderBottom: BORDER, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', textAlign: 'left', minWidth: 90 }}>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedCols.map(([col, type], ri) => {
                      const badge = getColTypeBadge(type);
                      const sourceTable = ri < t1Cols.length ? (t1Group?.tableName ?? '—') : selJoin.table2Name;
                      const meta = getColSemanticMeta(col, type);
                      return (
                        <tr key={`${col}_${ri}`} style={{ background: ri % 2 === 1 ? '#FAFBFC' : '#fff' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F4FF'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ri % 2 === 1 ? '#FAFBFC' : '#fff'}
                        >
                          <td style={{ padding: '5px 8px', borderRight: BORDER, color: '#C0C6CF', fontSize: 10, textAlign: 'center' }}>{ri + 1}</td>
                          <td style={{ padding: '5px 14px', borderRight: BORDER, fontWeight: 500, color: '#1D232F', whiteSpace: 'nowrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 14, height: 14, borderRadius: 3, background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><rect x="1" y="2" width="8" height="6" rx="0.8" stroke={badge.color} strokeWidth="1.2"/><path d="M1 4h8" stroke={badge.color} strokeWidth="0.8"/></svg>
                              </span>
                              {col}
                            </span>
                          </td>
                          <td style={{ padding: '5px 14px', borderRight: BORDER }}>
                            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', padding: '2px 5px', borderRadius: 3, background: badge.bg, color: badge.color }}>{type}</span>
                          </td>
                          <td style={{ padding: '5px 14px', borderRight: BORDER }}>
                            <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 3, background: '#EEF2FF', color: '#2770EF' }}>{sourceTable}</span>
                          </td>
                          <td style={{ padding: '5px 14px' }}>
                            {meta.isPk
                              ? <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(252,200,56,0.15)', color: '#92640A' }}>PK</span>
                              : col.endsWith('_id')
                                ? <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(14,125,139,0.08)', color: '#0E7D8B' }}>FK</span>
                                : <span style={{ color: '#C0C6CF', fontSize: 11 }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }

          // Join data mode
          const TableIcon = () => (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <rect x="0.75" y="1.75" width="10.5" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
              <path d="M0.75 4.5h10.5M4 4.5v5.75" stroke="currentColor" strokeWidth="1.1"/>
            </svg>
          );
          const showT1 = previewView === 'input' || previewView === 'both';
          const showMerged = previewView === 'output' || previewView === 'both';

          return (
            <div style={{ flex: 1, borderTop: BORDER, display: 'flex', overflow: 'hidden' }}>
              {showT1 && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: showMerged ? `1px solid #EAEDF2` : 'none' }}>
                  <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, flexShrink: 0, borderBottom: BORDER, background: '#FAFBFC' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#8B96A5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Input</span>
                    <span style={{ color: '#D0D6DF', fontSize: 10 }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2770EF' }}>
                      <TableIcon />
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#1D232F' }}>{t1Group?.tableName ?? '—'}</span>
                    </span>
                    <span style={{ fontSize: 10, color: '#BFC6D0', marginLeft: 2 }}>{t1Cols.length} cols</span>
                  </div>
                  {renderJoinTable(t1Cols, t1Rows)}
                </div>
              )}
              {showMerged && (
                <div style={{ flex: showT1 ? 2 : 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, flexShrink: 0, borderBottom: BORDER, background: '#FAFBFC' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#2770EF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Output</span>
                    <span style={{ color: '#D0D6DF', fontSize: 10 }}>·</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#1D232F' }}>{joinLabel[selJoin.joinType]} join</span>
                    <span style={{ fontSize: 10, color: '#BFC6D0', marginLeft: 2 }}>{mergedCols.length} cols · {mergedRows.length} rows</span>
                  </div>
                  {renderJoinTable(mergedCols, mergedRows, previewScrollRef)}
                </div>
              )}
            </div>
          );
        }

        if (!selectedGroup) {
          return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: BORDER, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: 0.4, textAlign: 'center' }}>
                <svg width="30" height="30" viewBox="0 0 32 32" fill="none"><rect x="3" y="7" width="26" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 12h26M9 12v13M16 12v13M23 12v13" stroke="currentColor" strokeWidth="1.3"/></svg>
                <span style={{ fontSize: 12, color: '#64748B' }}>No data to preview</span>
                <span style={{ fontSize: 11, color: '#A5ACB9' }}>Select a node on the canvas</span>
              </div>
            </div>
          );
        }

        const step = selectedGroup.steps[selectedGroup.activeStep];
        const inputStep = selectedGroup.steps[Math.max(0, selectedGroup.activeStep - 1)];
        const cols = step.cols;
        const inputCols = inputStep.cols;

        if (previewMode === 'semantic') {
          return (
            <div style={{ flex: 1, borderTop: BORDER, overflow: 'auto' }}>
              <style>{`@keyframes colFade { 0%{background:rgba(39,112,239,0.18)} 70%{background:rgba(39,112,239,0.10)} 100%{background:transparent} }`}</style>
              <table style={{ borderCollapse: 'collapse', fontSize: 11.5, tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}>
                <thead>
                  <tr style={{ background: '#F6F8FA', position: 'sticky', top: 0, zIndex: 2 }}>
                    <th style={{ width: 32, padding: '5px 8px', borderRight: BORDER, borderBottom: BORDER, color: '#C0C6CF', fontWeight: 600, fontSize: 10, textAlign: 'center' }}>#</th>
                    <th style={{ padding: '5px 14px', borderRight: BORDER, borderBottom: BORDER, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', textAlign: 'left', minWidth: 130 }}>Column</th>
                    <th style={{ padding: '5px 14px', borderRight: BORDER, borderBottom: BORDER, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', textAlign: 'left', minWidth: 80 }}>Type</th>
                    <th style={{ padding: '5px 14px', borderRight: BORDER, borderBottom: BORDER, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', textAlign: 'left', minWidth: 220 }}>Description</th>
                    <th style={{ padding: '5px 14px', borderRight: BORDER, borderBottom: BORDER, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', textAlign: 'center', minWidth: 72 }}>Nullable</th>
                    <th style={{ padding: '5px 14px', borderBottom: BORDER, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', textAlign: 'left', minWidth: 90 }}>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {cols.map(([col, type], ri) => {
                    const meta = getColSemanticMeta(col, type);
                    const badge = getColTypeBadge(type);
                    const isNew = col === highlightedCol;
                    return (
                      <tr key={col} style={{ background: isNew ? 'rgba(39,112,239,0.08)' : ri % 2 === 1 ? '#FAFBFC' : '#fff', animation: isNew ? 'colFade 2.4s ease forwards' : 'none' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F0F4FF'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = isNew ? 'rgba(39,112,239,0.08)' : ri % 2 === 1 ? '#FAFBFC' : '#fff'}
                      >
                        <td style={{ padding: '5px 8px', borderRight: BORDER, color: '#C0C6CF', fontSize: 10, textAlign: 'center' }}>{ri + 1}</td>
                        <td style={{ padding: '5px 14px', borderRight: BORDER, fontWeight: 500, color: '#1D232F', whiteSpace: 'nowrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 14, height: 14, borderRadius: 3, background: badge.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><rect x="1" y="2" width="8" height="6" rx="0.8" stroke={badge.color} strokeWidth="1.2"/><path d="M1 4h8" stroke={badge.color} strokeWidth="0.8"/></svg>
                            </span>
                            {col}
                          </span>
                        </td>
                        <td style={{ padding: '5px 14px', borderRight: BORDER }}>
                          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', padding: '2px 5px', borderRadius: 3, background: badge.bg, color: badge.color }}>{type}</span>
                        </td>
                        <td style={{ padding: '5px 14px', borderRight: BORDER, color: '#64748B', whiteSpace: 'nowrap' }}>{meta.description}</td>
                        <td style={{ padding: '5px 14px', borderRight: BORDER, textAlign: 'center' }}>
                          {meta.nullable ? <span style={{ color: '#C0C6CF', fontSize: 11 }}>—</span> : <span style={{ color: '#047857', fontSize: 11, fontWeight: 600 }}>✓</span>}
                        </td>
                        <td style={{ padding: '5px 14px' }}>
                          {meta.isPk
                            ? <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(252,200,56,0.15)', color: '#92640A' }}>PK</span>
                            : col.endsWith('_id')
                              ? <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: 'rgba(14,125,139,0.08)', color: '#0E7D8B' }}>FK</span>
                              : <span style={{ color: '#C0C6CF', fontSize: 11 }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        // ── Data mode ──
        const rows = (MOCK_DATA[selectedGroup.tableName] ?? []).slice(0, rowCap);
        const tblName = selectedGroup.tableName;
        // Version-aware null-fix overlay: OUTPUT = fixes up to & incl. the active step; INPUT (source pane) = up to the previous step.
        const outputFixes: Record<string, string> = {};
        selectedGroup.steps.slice(1, selectedGroup.activeStep + 1).forEach(s => { if (s.nullFix) outputFixes[s.nullFix.column] = s.nullFix.value; });
        const inputFixes: Record<string, string> = {};
        selectedGroup.steps.slice(1, selectedGroup.activeStep).forEach(s => { if (s.nullFix) inputFixes[s.nullFix.column] = s.nullFix.value; });

        const renderDataTable = (
          tableCols: [string, string][],
          isInput: boolean,
          scrollRef?: React.RefObject<HTMLDivElement | null>,
        ) => (
          <div ref={scrollRef} style={{ flex: 1, overflow: 'auto' }}>
            <style>{`@keyframes colFade { 0%{background:rgba(39,112,239,0.18)} 70%{background:rgba(39,112,239,0.10)} 100%{background:transparent} }`}</style>
            <table style={{ borderCollapse: 'collapse', fontSize: 11.5, tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}>
              <thead>
                <tr style={{ background: '#F6F8FA', position: 'sticky', top: 0, zIndex: 2 }}>
                  <th style={{ width: 36, padding: '5px 8px', borderRight: BORDER, borderBottom: BORDER, color: '#C0C6CF', fontWeight: 600, fontSize: 10, textAlign: 'center' }}>#</th>
                  {tableCols.map(([col, type]) => {
                    const isNew = !isInput && col === highlightedCol;
                    return (
                      <th key={col} data-col={col} style={{
                        padding: '5px 12px', borderRight: BORDER, borderBottom: BORDER,
                        textAlign: numericTypes.includes(type) ? 'right' : 'left',
                        whiteSpace: 'nowrap', fontWeight: 600, color: isNew ? '#1B58D4' : '#1D232F',
                        minWidth: numericTypes.includes(type) ? 72 : 100,
                        animation: isNew ? 'colFade 2.4s ease forwards' : 'none',
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: numericTypes.includes(type) ? 'flex-end' : 'flex-start' }}>
                          {col}
                          {isNew && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#2770EF', color: '#fff', letterSpacing: '0.02em' }}>NEW</span>}
                          <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'monospace', padding: '1px 3px', borderRadius: 2, background: getColTypeBadge(type).bg, color: getColTypeBadge(type).color }}>{type}</span>
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={tableCols.length + 1} style={{ padding: '20px', textAlign: 'center', color: '#A5ACB9', fontSize: 12 }}>No rows</td></tr>
                ) : rows.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 1 ? '#FAFBFC' : '#fff' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#EEF2FF'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ri % 2 === 1 ? '#FAFBFC' : '#fff'}
                  >
                    <td style={{ padding: '4px 8px', borderRight: BORDER, color: '#C0C6CF', fontSize: 10, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{ri + 1}</td>
                    {tableCols.map(([col, type], ci) => {
                      const val = row[ci];
                      const isNum = numericTypes.includes(type);
                      const isNew = !isInput && col === highlightedCol;
                      const activeFixes = isInput ? inputFixes : outputFixes;
                      const fixVal = (val === null || val === undefined) ? activeFixes[col] : undefined;
                      const display = isNew
                        ? <span style={{ color: '#1B58D4', fontStyle: 'italic' }}>—</span>
                        : fixVal !== undefined
                          ? <span style={{ color: '#15803D', fontWeight: 600 }}>{fixVal}</span>
                          : val === null || val === undefined ? <span style={{ color: '#C0C6CF' }}>null</span> : String(val);
                      return (
                        <td key={col} style={{
                          padding: '4px 12px', borderRight: BORDER,
                          textAlign: isNum ? 'right' : 'left',
                          color: '#1D232F', fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap', maxWidth: 200,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          background: fixVal !== undefined ? 'rgba(22,163,74,0.08)' : undefined,
                          animation: isNew ? 'colFade 2.4s ease forwards' : 'none',
                        }}>{display}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        const hasTransform = selectedGroup.steps.length > 1;
        const activeView = hasTransform ? previewView : 'output';
        const showInput = activeView === 'input' || activeView === 'both';
        const showOutput = activeView === 'output' || activeView === 'both';
        const TableIcon = () => (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <rect x="0.75" y="1.75" width="10.5" height="8.5" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M0.75 4.5h10.5M4 4.5v5.75" stroke="currentColor" strokeWidth="1.1"/>
          </svg>
        );

        const isSourceStep = selectedGroup.activeStep === 0;
        const stepLabel = isSourceStep ? null : OP_META[step.type]?.label ?? step.type;

        return (
          <div style={{ flex: 1, borderTop: BORDER, display: 'flex', overflow: 'hidden' }}>
            {/* Source (input) pane */}
            {showInput && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: showOutput ? `1px solid #EAEDF2` : 'none' }}>
                <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, flexShrink: 0, borderBottom: BORDER, background: '#FAFBFC' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#8B96A5', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Source</span>
                  <span style={{ color: '#D0D6DF', fontSize: 10 }}>·</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2770EF' }}>
                    <TableIcon />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#1D232F' }}>{tblName}</span>
                  </span>
                  <span style={{ fontSize: 10, color: '#BFC6D0', marginLeft: 2 }}>{inputCols.length} cols</span>
                </div>
                {renderDataTable(inputCols, true)}
              </div>
            )}
            {/* Output pane */}
            {showOutput && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, flexShrink: 0, borderBottom: BORDER, background: '#FAFBFC' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isSourceStep ? '#8B96A5' : '#2770EF', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                    {isSourceStep ? 'Source' : 'Output'}
                  </span>
                  <span style={{ color: '#D0D6DF', fontSize: 10 }}>·</span>
                  {stepLabel ? (
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#1D232F' }}>{stepLabel}</span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2770EF' }}>
                      <TableIcon />
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#1D232F' }}>{tblName}</span>
                    </span>
                  )}
                  <span style={{ fontSize: 10, color: '#BFC6D0', marginLeft: 2 }}>{cols.length} cols · {rows.length} rows</span>
                </div>
                {renderDataTable(cols, false, previewScrollRef)}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );


  // ── Root render ─────────────────────────────────────────────────────────────

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: ff.primary, background: '#EFF1F5' }}
      onClick={() => { setAddDataOpen(false); setDataModeMenuOpen(false); }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={e => { handleCsvFile(e.target.files?.[0] ?? undefined); e.currentTarget.value = ''; }}
      />
      {topbar}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {agentPanel}
        {browserPanel}
        {/* Canvas column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {canvasViewport}
          {previewPanel}
        </div>
      </div>
      {cacheConfirm && (
        <div onClick={() => setCacheConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(25,35,49,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, background: '#fff', borderRadius: 12, boxShadow: '0 12px 48px rgba(25,35,49,0.24)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(140,98,245,0.12)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="4" rx="5" ry="2" stroke="currentColor" strokeWidth="1.3"/><path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4" stroke="currentColor" strokeWidth="1.3"/><path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" stroke="currentColor" strokeWidth="1.3"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1D232F' }}>Cache this model?</div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: '#5B6472', marginBottom: 20 }}>
              To join uploaded files and run transformations, ThoughtSpot will cache this model&rsquo;s warehouse data into its data store. The model will run on cached data (refreshed on a schedule). <strong style={{ color: '#1D232F', fontWeight: 600 }}>This can&rsquo;t be switched back to live query.</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setCacheConfirm(null)} style={{ padding: '8px 16px', borderRadius: RADIUS6, border: '1px solid #C0C6CF', background: '#fff', color: '#1D232F', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>Cancel</button>
              <button onClick={() => cacheConfirm.onConfirm()} style={{ padding: '8px 16px', borderRadius: RADIUS6, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>Cache &amp; continue</button>
            </div>
          </div>
        </div>
      )}
      {cacheSettingsOpen && (
        <div onClick={() => setCacheSettingsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(25,35,49,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, background: '#fff', borderRadius: 12, boxShadow: '0 12px 48px rgba(25,35,49,0.24)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(140,98,245,0.12)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1.6l.85 1.55 1.72-.38.32 1.73 1.53.87-.83 1.55.83 1.55-1.53.87-.32 1.73-1.72-.38L8 14.4l-.85-1.55-1.72.38-.32-1.73-1.53-.87.83-1.55-.83-1.55 1.53-.87.32-1.73 1.72.38L8 1.6z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1D232F' }}>Cache settings</div>
            </div>
            <div style={{ fontSize: 12.5, color: '#8B96A5', marginBottom: 18, paddingLeft: 39 }}>Control how this model is materialized in ThoughtSpot.</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', marginBottom: 7 }}>Scope</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['Full model', 'Custom'] as const).map(s => (
                  <button key={s} onClick={() => setCacheScope(s)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, cursor: 'pointer', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 600, border: `1.5px solid ${cacheScope === s ? '#2770EF' : '#EAEDF2'}`, background: cacheScope === s ? 'rgba(39,112,239,0.05)' : '#fff', color: cacheScope === s ? '#2770EF' : '#64748B' }}>{s}</button>
                ))}
              </div>
              {cacheScope === 'Custom' && <div style={{ fontSize: 11.5, color: '#8B96A5', marginTop: 7 }}>Choose which tables and how much history to cache per table.</div>}
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', marginBottom: 7 }}>Refresh</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <select value={cacheFreq} onChange={e => setCacheFreq(e.target.value)} style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 7, padding: '8px 28px 8px 10px', fontSize: 12.5, color: '#1D232F', background: '#fff', cursor: 'pointer', fontFamily: ff.primary, fontWeight: 500, outline: 'none' }}>
                    {['Daily', 'Hourly', 'Weekly'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#BFC6D0' }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                </div>
                <div style={{ flex: 1, position: 'relative', opacity: cacheFreq === 'Hourly' ? 0.5 : 1 }}>
                  <select value={cacheHour} disabled={cacheFreq === 'Hourly'} onChange={e => setCacheHour(e.target.value)} style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 7, padding: '8px 28px 8px 10px', fontSize: 12.5, color: '#1D232F', background: '#fff', cursor: cacheFreq === 'Hourly' ? 'default' : 'pointer', fontFamily: ff.primary, fontWeight: 500, outline: 'none' }}>
                    {['12:00 AM', '6:00 AM', '9:00 AM', '12:00 PM', '6:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#BFC6D0' }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setCacheSettingsOpen(false)} style={{ padding: '8px 18px', borderRadius: RADIUS6, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelCanvas;

// ── Shared micro-styles ───────────────────────────────────────────────────────

const phdrBtnStyle: React.CSSProperties = {
  width: 22, height: 22, border: 'none', background: 'transparent', borderRadius: 4,
  color: '#BFC6D0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const railBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent',
  color: '#8B96A5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
