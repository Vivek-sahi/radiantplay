import React, { useState, useEffect, useRef, useCallback } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { ISSUE_META, QUALITY_SCORE, COLUMNS } from '../data/mockData';
import PlanModal from './PlanModal';

// ── Types ─────────────────────────────────────────────────────────────────────

type AgentPhase  = 'choosing' | 'chatting' | 'fixing' | 'done';
type DataView    = 'before' | 'after';
type JourneyPath = 'problem' | 'system' | 'freetext' | null;

interface ChatMessage {
  id: string;
  role: 'agent' | 'user';
  content: string;
  type?: 'fix-result' | 'view-plan' | 'tool-call';
  toolName?: string;
  toolInput?: Record<string, unknown>;
}

interface DataRow {
  id: string;
  account_name: string | null;
  billing_entry_aws: string | null;
  billing_period_aws: string;
  reservation_arn: string | null;
  operation: string | null;
  blended_cost: number;
  line_item_type: string;
}

// ── Script types ──────────────────────────────────────────────────────────────

type ScriptStep =
  | { type: 'tool-call'; toolName: string; toolInput?: Record<string, string>; delay: number }
  | { type: 'agent';     content: string; msgType?: ChatMessage['type'];        delay: number }
  | { type: 'wait';      chips?: string[] }
  | { type: 'fix';       scope?: Array<keyof DataRow>; message?: string };

// ── Scripts ───────────────────────────────────────────────────────────────────

const PROBLEM_SCRIPT: ScriptStep[] = [
  {
    type: 'agent',
    content: "Tell me what's happening — which column or report is giving you trouble?",
    delay: 500,
  },
  {
    type: 'wait',
  },
  { type: 'tool-call', toolName: 'understand_context', toolInput: { column_name: 'blended_cost' }, delay: 600  },
  { type: 'tool-call', toolName: 'analyze_metadata',   toolInput: { column_name: 'blended_cost' }, delay: 1100 },
  { type: 'tool-call', toolName: 'sample_values',      toolInput: { column_name: 'blended_cost' }, delay: 1700 },
  {
    type: 'agent',
    content: "Found the problem. blended_cost has 23 anomalous rows — rows 7 and 39 show $78,234.50 and $65,890.44 vs a column average of ~$2,100. These outliers are inflating averages by ~3.7×.\n\nDownstream impact:\n• 12 answers are returning wrong totals\n• 4 liveboards affected: FinOps Cost Dashboard, Monthly Billing Summary, Budget vs Actual, Executive Cost Report\n\nRoot cause: billing_entry_aws has 14 nulls preventing proper deduplication. Once filled, the anomalous charges collapse.\n\nRecommended fixes:\n1. Populate billing_entry_aws nulls → removes duplicate charges\n2. Fill operation nulls with \"Unknown\" → preserves row integrity for cost grouping",
    delay: 2200,
  },
  {
    type: 'wait',
    chips: ['Fix the anomalies'],
  },
  {
    type: 'agent',
    content: "Before I apply fixes, here's what will change:\n\n• FinOps Cost Dashboard — average cost widget will drop ~72%\n• Monthly Billing Summary — Dec 2023 total decreases by ~$142K\n• Budget vs Actual — 3 departments shift from over-budget to on-track\n• Executive Cost Report — last-quarter spend will recalculate\n\nThese are improvements — the current numbers are wrong. Continue?",
    delay: 900,
  },
  { type: 'wait', chips: ['Continue anyway'] },
  { type: 'tool-call', toolName: 'fix_issue',   toolInput: { column_name: 'billing_entry_aws' }, delay: 400  },
  { type: 'tool-call', toolName: 'fix_issue',   toolInput: { column_name: 'operation' },         delay: 900  },
  { type: 'tool-call', toolName: 'recalculate', toolInput: { column_name: 'blended_cost' },      delay: 1200 },
  {
    type: 'fix',
    scope: ['billing_entry_aws', 'operation', 'blended_cost'],
    message: 'Done. Applied 2 fixes:\n• billing_entry_aws — 14 nulls → empty string (deduplication restored)\n• operation — 23 nulls → "Unknown" (row integrity preserved)\n\nblended_cost anomalies are resolved. Click Publish to save.',
  },
];

const SYSTEM_SCRIPT: ScriptStep[] = [
  { type: 'tool-call', toolName: 'profile_table',    toolInput: { table_name: 'billing_accounts' }, delay: 400  },
  { type: 'tool-call', toolName: 'generate_fix_plan',                                               delay: 1100 },
  { type: 'tool-call', toolName: 'check_privileges',                                                delay: 1700 },
  {
    type: 'agent',
    msgType: 'view-plan',
    content: "Scan complete. Found 50 issues across all columns in billing_accounts, line_items, and subscriptions:\n\n• 18 null columns — 67,150+ rows affected\n• 12 blank string columns — 3,969 rows\n• 11 type mismatches — 563 rows\n• 6 duplicate sets — 312 rows\n• 3 statistical anomalies — 23 rows\n\n49 fixes are ready. Quality score: 54 (D) → 96 (A+).",
    delay: 2300,
  },
  { type: 'wait' },
  {
    type: 'agent',
    content: "Before applying, here's the downstream impact:\n\n• 12 answers will recalculate with corrected data\n• 4 liveboards will update: FinOps Cost Dashboard, Monthly Billing Summary, Budget vs Actual, Executive Cost Report\n• Historical trend data will shift in 3 reports\n\nAll changes are improvements — current data has errors. Apply 49 fixes?",
    delay: 800,
  },
  { type: 'wait', chips: ['Apply all fixes'] },
  { type: 'tool-call', toolName: 'fix_all', delay: 300 },
  {
    type: 'fix',
    message: 'Done. 49 of 50 fixes applied successfully.\n\n1 skipped: blended_cost anomaly detection requires STATISTICAL_FUNCTION privilege in Snowflake.\n\nQuality score: 54 (D) → 96 (A+). Click Publish to save this version.',
  },
];

const FREETEXT_SCRIPT: ScriptStep[] = [
  { type: 'tool-call', toolName: 'profile_table',  toolInput: { table_name: 'billing_accounts' }, delay: 600  },
  { type: 'tool-call', toolName: 'explain_column', toolInput: { column_name: 'blended_cost' },    delay: 1100 },
  {
    type: 'agent',
    content: "I scanned fnops-final. Here's what I found:\n\n• 50 issues across all columns — 68,432 rows\n• Most critical: blended_cost has 23 anomalous rows (avg $2,100 vs outliers at $78K+)\n• 18 columns with null values — 67,150+ affected rows\n• 12 columns with blank strings — 3,969 rows\n\nWould you like me to generate a full fix plan?",
    delay: 1800,
  },
  { type: 'wait', chips: ['Generate fix plan', 'Tell me more about blended_cost', 'Fix all issues'] },
  { type: 'tool-call', toolName: 'generate_fix_plan', delay: 500 },
  {
    type: 'agent',
    msgType: 'view-plan',
    content: "Generated a fix plan for all 50 issues. 49 are ready to apply — quality score: 54 (D) → 96 (A+).",
    delay: 1200,
  },
  { type: 'wait', chips: ['Apply all fixes'] },
  { type: 'tool-call', toolName: 'fix_all', delay: 300 },
  {
    type: 'fix',
    message: 'Done. 49 of 50 fixes applied.\n\nQuality score: 54 (D) → 96 (A+). Click Publish to save this version.',
  },
];

const TOOL_LABELS: Record<string, string> = {
  profile_table:          'Profiling table',
  explain_column:         'Analyzing column',
  understand_context:     'Understanding column context',
  analyze_metadata:       'Analyzing column metadata',
  sample_values:          'Sampling column values',
  recalculate:            'Recalculating anomaly scores',
  get_affected_row_count: 'Counting affected rows',
  get_column_sample:      'Sampling column',
  get_downstream_impact:  'Checking downstream impact',
  fix_issue:              'Fixing column',
  fix_all:                'Applying all fixes',
  generate_fix_plan:      'Generating fix plan',
  check_privileges:       'Checking warehouse privileges',
};

// ── Mock data rows ────────────────────────────────────────────────────────────

const RAW_ROWS: DataRow[] = [
  { id: 'acc-0001', account_name: 'Acme Corporation',    billing_entry_aws: 'BE-20231201-001', billing_period_aws: '2023-12-01', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 1247.82,  line_item_type: 'Usage' },
  { id: 'acc-0002', account_name: 'TechStart Inc',       billing_entry_aws: 'BE-20231201-002', billing_period_aws: 'December 2023', reservation_arn: 'arn:aws:ec2:us-east-1:234:ri/abc123',   operation: null,                 blended_cost: 892.14,   line_item_type: 'Usage' },
  { id: 'acc-0003', account_name: '',                    billing_entry_aws: null,              billing_period_aws: '2023-12-03', reservation_arn: null,                                        operation: 'DescribeInstances',  blended_cost: 156.40,   line_item_type: '3' },
  { id: 'acc-0004', account_name: 'DataFlow LLC',        billing_entry_aws: 'BE-20231201-004', billing_period_aws: '2023-12-04', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 4821.03,  line_item_type: 'Usage' },
  { id: 'acc-0005', account_name: 'CloudBase Systems',   billing_entry_aws: 'BE-20231201-005', billing_period_aws: 'Dec-23',     reservation_arn: 'arn:aws:ec2:us-west-2:345:ri/def456',       operation: null,                 blended_cost: 2103.77,  line_item_type: 'Usage' },
  { id: 'acc-0006', account_name: null,                  billing_entry_aws: null,              billing_period_aws: '2023-12-06', reservation_arn: null,                                        operation: 'CreateVolume',       blended_cost: 445.29,   line_item_type: '7' },
  { id: 'acc-0007', account_name: 'Bright Analytics',    billing_entry_aws: 'BE-20231201-007', billing_period_aws: '2023-12-07', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 78234.50, line_item_type: 'Usage' },
  { id: 'acc-0008', account_name: 'Nexus Media',         billing_entry_aws: 'BE-20231201-008', billing_period_aws: '12/2023',    reservation_arn: null,                                        operation: 'DescribeImages',     blended_cost: 3841.65,  line_item_type: 'Usage' },
  { id: 'acc-0009', account_name: '',                    billing_entry_aws: null,              billing_period_aws: '2023-12-09', reservation_arn: 'arn:aws:ec2:eu-west-1:456:ri/ghi789',       operation: null,                 blended_cost: 1299.00,  line_item_type: 'Usage' },
  { id: 'acc-0010', account_name: 'Frontier Cloud',      billing_entry_aws: 'BE-20231201-010', billing_period_aws: '2023-12-10', reservation_arn: null,                                        operation: 'StartInstances',     blended_cost: 5621.40,  line_item_type: 'Usage' },
  { id: 'acc-0011', account_name: 'Vertex AI Labs',      billing_entry_aws: null,              billing_period_aws: '2023-12-11', reservation_arn: null,                                        operation: null,                 blended_cost: 892.55,   line_item_type: '12' },
  { id: 'acc-0012', account_name: 'Pinnacle Data',       billing_entry_aws: 'BE-20231201-012', billing_period_aws: 'December',   reservation_arn: 'arn:aws:ec2:ap-southeast-1:678:ri/jkl012', operation: 'ModifyInstance',     blended_cost: 1547.80,  line_item_type: 'Usage' },
  { id: 'acc-0013', account_name: 'BluePeak Corp',       billing_entry_aws: 'BE-20231201-013', billing_period_aws: '2023-12-13', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 413.90,   line_item_type: 'Usage' },
  { id: 'acc-0014', account_name: 'DataSphere Inc',      billing_entry_aws: null,              billing_period_aws: '2023-12-14', reservation_arn: null,                                        operation: 'CreateSnapshot',     blended_cost: 2284.15,  line_item_type: 'Usage' },
  { id: 'acc-0015', account_name: 'OmniStack',           billing_entry_aws: 'BE-20231201-015', billing_period_aws: '2023-12-15', reservation_arn: null,                                        operation: null,                 blended_cost: 689.45,   line_item_type: 'Usage' },
  { id: 'acc-0016', account_name: 'StormCloud Inc',      billing_entry_aws: 'BE-20231201-016', billing_period_aws: '2023-12-16', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 910.20,   line_item_type: 'Usage' },
  { id: 'acc-0017', account_name: 'Meridian Data',       billing_entry_aws: 'BE-20231201-017', billing_period_aws: '2023-12-17', reservation_arn: null,                                        operation: 'StopInstances',      blended_cost: 234.55,   line_item_type: 'Usage' },
  { id: 'acc-0018', account_name: null,                  billing_entry_aws: null,              billing_period_aws: '2023-12-18', reservation_arn: null,                                        operation: 'CreateBucket',       blended_cost: 1834.22,  line_item_type: '19' },
  { id: 'acc-0019', account_name: 'Atlas Analytics',     billing_entry_aws: 'BE-20231201-019', billing_period_aws: '2023-12-19', reservation_arn: 'arn:aws:ec2:us-east-1:789:ri/mno345',       operation: null,                 blended_cost: 3421.00,  line_item_type: 'Usage' },
  { id: 'acc-0020', account_name: 'Cascade Systems',     billing_entry_aws: 'BE-20231201-020', billing_period_aws: '2023-12-20', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 567.89,   line_item_type: 'Usage' },
  { id: 'acc-0021', account_name: 'Horizon Tech',        billing_entry_aws: 'BE-20231201-021', billing_period_aws: '2023-12-21', reservation_arn: null,                                        operation: 'TerminateInstances', blended_cost: 3102.44,  line_item_type: 'Usage' },
  { id: 'acc-0022', account_name: '',                    billing_entry_aws: 'BE-20231201-022', billing_period_aws: '2023-12-22', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 788.30,   line_item_type: 'Usage' },
  { id: 'acc-0023', account_name: 'SolarFlux Inc',       billing_entry_aws: 'BE-20231201-023', billing_period_aws: '2023-12-23', reservation_arn: null,                                        operation: 'DescribeVolumes',    blended_cost: 1122.60,  line_item_type: 'Usage' },
  { id: 'acc-0024', account_name: 'NeoNode Corp',        billing_entry_aws: null,              billing_period_aws: '2023-12-24', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 4455.00,  line_item_type: 'Usage' },
  { id: 'acc-0025', account_name: 'Vertex Systems',      billing_entry_aws: 'BE-20231201-025', billing_period_aws: 'Dec 23',     reservation_arn: null,                                        operation: 'ModifyInstance',     blended_cost: 2890.10,  line_item_type: 'Usage' },
  { id: 'acc-0026', account_name: 'CloudPeak Data',      billing_entry_aws: 'BE-20231201-026', billing_period_aws: '2023-12-26', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 345.80,   line_item_type: 'Usage' },
  { id: 'acc-0027', account_name: 'Pacific Rim Tech',    billing_entry_aws: 'BE-20231201-027', billing_period_aws: '2023-12-27', reservation_arn: null,                                        operation: 'StartInstances',     blended_cost: 1780.25,  line_item_type: 'Usage' },
  { id: 'acc-0028', account_name: null,                  billing_entry_aws: null,              billing_period_aws: '2023-12-28', reservation_arn: null,                                        operation: 'CreateSnapshot',     blended_cost: 990.00,   line_item_type: 'Usage' },
  { id: 'acc-0029', account_name: 'TerraBytes Inc',      billing_entry_aws: 'BE-20231201-029', billing_period_aws: '2023-12-29', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 6234.55,  line_item_type: 'Usage' },
  { id: 'acc-0030', account_name: 'FinEdge Corp',        billing_entry_aws: 'BE-20231201-030', billing_period_aws: '2023-12-30', reservation_arn: null,                                        operation: 'DescribeInstances',  blended_cost: 822.10,   line_item_type: 'Usage' },
  { id: 'acc-0031', account_name: 'Apex Compute',        billing_entry_aws: 'BE-20231201-031', billing_period_aws: '2023-12-31', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 1455.75,  line_item_type: 'Usage' },
  { id: 'acc-0032', account_name: 'ClearPath Analytics', billing_entry_aws: 'BE-20231202-001', billing_period_aws: '2024-01-01', reservation_arn: null,                                        operation: 'CreateVolume',       blended_cost: 678.40,   line_item_type: 'Usage' },
  { id: 'acc-0033', account_name: 'BlueSky Data',        billing_entry_aws: 'BE-20231202-002', billing_period_aws: '2024-01-02', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 2340.00,  line_item_type: 'Usage' },
  { id: 'acc-0034', account_name: 'PhoenixDB',           billing_entry_aws: 'BE-20231202-003', billing_period_aws: 'Jan 2024',   reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 1892.30,  line_item_type: 'Usage' },
  { id: 'acc-0035', account_name: 'MetroCloud',          billing_entry_aws: 'BE-20231202-004', billing_period_aws: '2024-01-04', reservation_arn: null,                                        operation: 'TerminateInstances', blended_cost: 455.60,   line_item_type: 'Usage' },
  { id: 'acc-0036', account_name: 'GlobalData Corp',     billing_entry_aws: 'BE-20231202-005', billing_period_aws: '2024-01-05', reservation_arn: 'arn:aws:ec2:us-west-1:901:ri/pqr678',       operation: 'ModifyInstance',     blended_cost: 3120.90,  line_item_type: 'Usage' },
  { id: 'acc-0037', account_name: 'MaxFlow Systems',     billing_entry_aws: 'BE-20231202-006', billing_period_aws: '2024-01-06', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 734.15,   line_item_type: 'Usage' },
  { id: 'acc-0038', account_name: 'InfraWave Inc',       billing_entry_aws: 'BE-20231202-007', billing_period_aws: '2024-01-07', reservation_arn: null,                                        operation: 'DescribeInstances',  blended_cost: 1566.20,  line_item_type: 'Usage' },
  { id: 'acc-0039', account_name: 'TrueData Corp',       billing_entry_aws: 'BE-20231202-008', billing_period_aws: '2024-01-08', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 65890.44, line_item_type: 'Usage' },
  { id: 'acc-0040', account_name: 'PureCloud Ltd',       billing_entry_aws: 'BE-20231202-009', billing_period_aws: '2024-01-09', reservation_arn: null,                                        operation: 'StartInstances',     blended_cost: 2214.80,  line_item_type: 'Usage' },
  { id: 'acc-0041', account_name: 'StratoBase',          billing_entry_aws: 'BE-20231202-010', billing_period_aws: '2024-01-10', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 887.00,   line_item_type: 'Usage' },
  { id: 'acc-0042', account_name: '',                    billing_entry_aws: null,              billing_period_aws: '2024-01-11', reservation_arn: null,                                        operation: 'CreateBucket',       blended_cost: 312.55,   line_item_type: '43' },
  { id: 'acc-0043', account_name: 'NubeData',            billing_entry_aws: 'BE-20231202-012', billing_period_aws: '2024-01-12', reservation_arn: null,                                        operation: null,                 blended_cost: 1990.30,  line_item_type: 'Usage' },
  { id: 'acc-0044', account_name: 'QuickScale Inc',      billing_entry_aws: 'BE-20231202-013', billing_period_aws: '2024-01-13', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 550.00,   line_item_type: 'Usage' },
  { id: 'acc-0045', account_name: 'SkyData Corp',        billing_entry_aws: 'BE-20231202-014', billing_period_aws: '2024-01-14', reservation_arn: null,                                        operation: 'ModifyInstance',     blended_cost: 4210.75,  line_item_type: 'Usage' },
  { id: 'acc-0046', account_name: 'CubeAnalytics',       billing_entry_aws: 'BE-20231202-015', billing_period_aws: '2024-01-15', reservation_arn: 'arn:aws:ec2:ap-east-1:234:ri/stu901',       operation: 'DescribeInstances',  blended_cost: 1320.45,  line_item_type: 'Usage' },
  { id: 'acc-0047', account_name: 'DataFlow Pro',        billing_entry_aws: 'BE-20231202-016', billing_period_aws: '2024-01-16', reservation_arn: null,                                        operation: null,                 blended_cost: 2780.60,  line_item_type: 'Usage' },
  { id: 'acc-0048', account_name: 'SynCloud Corp',       billing_entry_aws: 'BE-20231202-017', billing_period_aws: '2024-01-17', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 990.15,   line_item_type: 'Usage' },
  { id: 'acc-0049', account_name: '',                    billing_entry_aws: 'BE-20231202-018', billing_period_aws: '2024-01-18', reservation_arn: null,                                        operation: 'CreateVolume',       blended_cost: 143.30,   line_item_type: 'Usage' },
  { id: 'acc-0050', account_name: 'OmniData Systems',    billing_entry_aws: 'BE-20231202-019', billing_period_aws: '2024-01-19', reservation_arn: null,                                        operation: 'RunInstances',       blended_cost: 3356.80,  line_item_type: 'Usage' },
];

const fixedValue = (row: DataRow, col: keyof DataRow): { value: string; wasFixed: boolean } => {
  switch (col) {
    case 'account_name':
      if (row.account_name === null || row.account_name === '') return { value: 'NULL', wasFixed: true };
      return { value: row.account_name, wasFixed: false };
    case 'billing_entry_aws':
      if (row.billing_entry_aws === null) return { value: '""', wasFixed: true };
      return { value: row.billing_entry_aws, wasFixed: false };
    case 'billing_period_aws': {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(row.billing_period_aws);
      if (!iso) return { value: '2023-12-01', wasFixed: true };
      return { value: row.billing_period_aws, wasFixed: false };
    }
    case 'reservation_arn':
      if (row.reservation_arn === null) return { value: '(none)', wasFixed: true };
      return { value: row.reservation_arn, wasFixed: false };
    case 'operation':
      if (row.operation === null) return { value: 'Unknown', wasFixed: true };
      return { value: row.operation, wasFixed: false };
    case 'line_item_type': {
      const isNumeric = /^\d+$/.test(row.line_item_type);
      if (isNumeric) return { value: 'Usage', wasFixed: true };
      return { value: row.line_item_type, wasFixed: false };
    }
    default:
      return { value: String(row[col] ?? ''), wasFixed: false };
  }
};

const getRawText = (row: DataRow, col: keyof DataRow): string => {
  switch (col) {
    case 'account_name':
      if (row.account_name === null) return 'null';
      if (row.account_name === '')   return '""';
      return row.account_name;
    case 'billing_entry_aws':
      if (row.billing_entry_aws === null) return 'null';
      return row.billing_entry_aws;
    case 'reservation_arn':
      if (row.reservation_arn === null) return 'null';
      return row.reservation_arn;
    case 'operation':
      if (row.operation === null) return 'null';
      return row.operation;
    case 'blended_cost':
      return row.blended_cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    default:
      return String(row[col] ?? '');
  }
};

const isDateTypeMismatch = (val: string) => val !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(val);

// ── Data table ────────────────────────────────────────────────────────────────

const COLS: { key: keyof DataRow; label: string }[] = [
  { key: 'id',                 label: 'account_id'         },
  { key: 'account_name',       label: 'account_name'       },
  { key: 'billing_entry_aws',  label: 'billing_entry_aws'  },
  { key: 'billing_period_aws', label: 'billing_period_aws' },
  { key: 'reservation_arn',    label: 'reservation_arn'    },
  { key: 'operation',          label: 'operation'          },
  { key: 'blended_cost',       label: 'blended_cost'       },
  { key: 'line_item_type',     label: 'line_item_type'     },
];

const DataTable: React.FC<{ view: DataView; fixedCols?: Set<keyof DataRow> }> = ({ view, fixedCols }) => {
  const before = view === 'before';

  // A column is "fixed" when: we're in after view AND (no scope restriction OR col is in scope)
  const shouldFix = (col: keyof DataRow): boolean => {
    if (before) return false;
    if (!fixedCols || fixedCols.size === 0) return true;
    return fixedCols.has(col);
  };

  const getCellStyle = (row: DataRow, col: keyof DataRow): React.CSSProperties => {
    if (shouldFix(col)) {
      const { wasFixed } = fixedValue(row, col);
      if (wasFixed) return { backgroundColor: '#f0fdf4', color: '#15803d' };
      return {};
    }
    // Before view or unfixed-after-view: show error highlights
    switch (col) {
      case 'account_name':
        if (row.account_name === null || row.account_name === '')
          return { backgroundColor: '#f5f3ff', color: '#6d28d9', fontStyle: 'italic' };
        return {};
      case 'billing_entry_aws':
        if (row.billing_entry_aws === null)
          return { backgroundColor: '#fff7ed', color: '#c2410c', fontStyle: 'italic' };
        return {};
      case 'billing_period_aws':
        if (isDateTypeMismatch(row.billing_period_aws)) return { backgroundColor: '#ecfdf5', color: '#065f46' };
        return {};
      case 'reservation_arn':
        if (row.reservation_arn === null)
          return { backgroundColor: '#fff7ed', color: '#c2410c', fontStyle: 'italic' };
        return {};
      case 'operation':
        if (row.operation === null)
          return { backgroundColor: '#fff7ed', color: '#c2410c', fontStyle: 'italic' };
        return {};
      case 'blended_cost':
        if (row.blended_cost > 20000) return { backgroundColor: '#fdf2f8', color: '#be185d', fontWeight: fw.semibold };
        return {};
      case 'line_item_type':
        if (/^\d+$/.test(row.line_item_type)) return { backgroundColor: '#ecfdf5', color: '#065f46' };
        return {};
      default:
        return {};
    }
  };

  const getCellText = (row: DataRow, col: keyof DataRow): string => {
    if (shouldFix(col)) return fixedValue(row, col).value;
    return getRawText(row, col);
  };

  const thStyle: React.CSSProperties = {
    padding: `${sp.B}px ${sp.C}px`,
    textAlign: 'left', fontSize: fs.sm, fontWeight: fw.medium,
    color: c['content-secondary'],
    borderBottom: `1px solid ${c['border-divider']}`,
    borderRight: `1px solid ${c['border-divider']}`,
    fontFamily: 'monospace',
    backgroundColor: c['background-subtle'],
  };

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: fs.sm, whiteSpace: 'nowrap', minWidth: '100%' }}>
        <thead>
          <tr style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <th style={{ ...thStyle, width: 44, textAlign: 'right', color: c['content-tertiary'] }}>#</th>
            {COLS.map(col => <th key={col.key} style={thStyle}>{col.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {RAW_ROWS.map((row, i) => (
            <tr key={row.id} style={{ backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-sunken'] }}>
              <td style={{
                padding: `${sp.B}px ${sp.C}px`,
                borderBottom: `1px solid ${c['border-divider']}`,
                borderRight: `1px solid ${c['border-divider']}`,
                fontSize: 11, fontFamily: 'monospace',
                color: c['content-tertiary'],
                textAlign: 'right', userSelect: 'none',
                backgroundColor: c['background-subtle'],
              }}>{i + 1}</td>
              {COLS.map(col => (
                <td key={col.key} style={{
                  padding: `${sp.A}px ${sp.C}px`,
                  borderBottom: `1px solid ${c['border-divider']}`,
                  borderRight: `1px solid ${c['border-divider']}`,
                  fontFamily: 'monospace', maxWidth: 200,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  ...getCellStyle(row, col.key),
                }}>
                  {getCellText(row, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Score popover ─────────────────────────────────────────────────────────────

const ScorePopover: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const issueColumns = COLUMNS.filter(c => c.hasIssue);
  return (
    <div style={{
      position: 'absolute', top: 52, right: 0, width: 320, zIndex: 500,
      backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`,
      borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.16)', fontFamily: ff.primary,
    }}>
      <div style={{ position: 'absolute', top: -6, right: 16, width: 12, height: 12, backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderBottom: 'none', borderRight: 'none', transform: 'rotate(45deg)' }} />
      <div style={{ padding: `${sp.C}px ${sp.D}px ${sp.B}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-primary'] }}>Data quality issues</div>
          <div style={{ fontSize: 10, color: c['content-tertiary'], marginTop: 1 }}>fnops-final · {issueColumns.length} columns affected</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: 16, lineHeight: 1, padding: 2 }}>×</button>
      </div>
      <div style={{ maxHeight: 240, overflowY: 'auto', padding: `${sp.B}px 0` }}>
        {issueColumns.map(col => {
          const meta = ISSUE_META[col.issueType!];
          return (
            <div key={col.id} style={{ padding: `${sp.A}px ${sp.D}px`, display: 'flex', alignItems: 'center', gap: sp.C }}>
              <span style={{ fontSize: 10, fontWeight: fw.medium, color: meta.color, backgroundColor: meta.bg, borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>{meta.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-primary'], fontFamily: 'monospace' }}>{col.name}</div>
                <div style={{ fontSize: 10, color: c['content-tertiary'] }}>{col.table}</div>
              </div>
              <div style={{ fontSize: 10, color: c['content-secondary'], flexShrink: 0 }}>
                {col.nullPct > 0 ? `${col.nullPct}% null` : meta.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Markdown-lite renderer for agent messages ────────────────────────────────

const renderContent = (text: string): React.ReactNode => {
  return text.split('\n').map((line, i) => {
    if (line === '') {
      return <div key={i} style={{ height: 6 }} />;
    }
    if (/^• /.test(line)) {
      return (
        <div key={i} style={{ display: 'flex', gap: 6, lineHeight: 1.6, marginBottom: 1 }}>
          <span style={{ color: '#94a3b8', flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    }
    if (/^\d+\. /.test(line)) {
      const m = line.match(/^(\d+)\. (.+)/)!;
      return (
        <div key={i} style={{ display: 'flex', gap: 6, lineHeight: 1.6, marginBottom: 1 }}>
          <span style={{ color: '#94a3b8', flexShrink: 0, minWidth: 16 }}>{m[1]}.</span>
          <span>{m[2]}</span>
        </div>
      );
    }
    if (/^[A-Za-z].{0,40}:$/.test(line)) {
      return (
        <div key={i} style={{ fontWeight: 600, color: '#0f172a', marginTop: 6, lineHeight: 1.6 }}>
          {line}
        </div>
      );
    }
    return <div key={i} style={{ lineHeight: 1.6 }}>{line}</div>;
  });
};

// ── Agent panel ───────────────────────────────────────────────────────────────

const AgentPanel: React.FC<{
  phase: AgentPhase;
  path: JourneyPath;
  messages: ChatMessage[];
  inputValue: string;
  isLoading: boolean;
  chips: string[];
  onInputChange: (v: string) => void;
  onSend: (text: string) => void;
  onChoosePath: (path: 'problem' | 'system' | 'freetext') => void;
  onViewPlan: () => void;
}> = ({ phase, path, messages, inputValue, isLoading, chips, onInputChange, onSend, onChoosePath, onViewPlan }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, chips]);

  const inputPlaceholder =
    phase === 'choosing' ? 'Type a question, or choose a workflow above…' :
                           'Or type your own response…';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: c['background-base'], borderLeft: `1px solid ${c['border-divider']}` }}>

      {/* Header */}
      <div style={{ padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: fw.semibold }}>S</div>
        <span style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>SpotterPrep</span>
        {path && (
          <>
            <div style={{ width: 1, height: 14, backgroundColor: c['border-divider'] }} />
            <span style={{
              fontSize: 10, fontWeight: fw.medium,
              color: path === 'problem' ? '#7c3aed' : path === 'system' ? '#0369a1' : '#065f46',
              backgroundColor: path === 'problem' ? '#f5f3ff' : path === 'system' ? '#eff6ff' : '#ecfdf5',
              borderRadius: 4, padding: '1px 6px',
            }}>
              {path === 'problem' ? 'Fix column problem' : path === 'system' ? 'Fix all problems' : 'Ask anything'}
            </span>
          </>
        )}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.D}px` }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: sp.D }}>
            {msg.type === 'tool-call' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `${sp.A}px ${sp.C}px`, backgroundColor: c['background-sunken'], border: `1px solid ${c['border-divider']}`, borderRadius: 6, fontSize: 11, fontFamily: 'monospace', color: c['content-secondary'], marginLeft: 30 }}>
                <span style={{ color: '#6366f1', fontSize: 10, flexShrink: 0 }}>→</span>
                <span style={{ fontWeight: fw.medium, color: c['content-primary'] }}>
                  {TOOL_LABELS[msg.toolName ?? ''] ?? msg.toolName}
                </span>
                {msg.toolInput && Object.keys(msg.toolInput).length > 0 && (
                  <span style={{ color: c['content-tertiary'] }}>
                    {Object.values(msg.toolInput).map(v => `"${v}"`).join(', ')}
                  </span>
                )}
              </div>
            ) : msg.role === 'agent' ? (
              <div style={{ display: 'flex', gap: sp.C, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: fw.semibold, marginTop: 1 }}>S</div>
                <div style={{ flex: 1, minWidth: 0, fontSize: fs.sm, color: c['content-primary'] }}>
                  {renderContent(msg.content)}
                  {msg.type === 'view-plan' && (
                    <button onClick={onViewPlan} style={{ marginTop: sp.C, display: 'inline-block', padding: `${sp.B}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], color: c['content-brand'], fontSize: fs.sm, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary }}>
                      Review plan →
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: sp.C, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, backgroundColor: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: fw.semibold, marginTop: 1 }}>V</div>
                <div style={{ flex: 1, minWidth: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: 1.6 }}>
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Path chooser */}
        {phase === 'choosing' && (
          <div style={{ marginTop: sp.D, border: `1px solid ${c['border-default']}`, borderRadius: 8, overflow: 'hidden' }}>
            {[
              { id: 'problem',  label: 'Fix a specific column problem', sub: 'I have a specific issue or column to debug' },
              { id: 'system',   label: 'Fix all quality problems',       sub: 'Profile the table and generate a full fix plan' },
            ].map((item, i, arr) => (
              <button
                key={item.id}
                onClick={() => onChoosePath(item.id as 'problem' | 'system' | 'freetext')}
                style={{
                  width: '100%', padding: `${sp.C}px ${sp.D}px`,
                  border: 'none',
                  borderBottom: i < arr.length - 1 ? `1px solid ${c['border-divider']}` : 'none',
                  backgroundColor: 'transparent', cursor: 'pointer',
                  textAlign: 'left', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', fontFamily: ff.primary,
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-sunken'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div>
                  <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{item.sub}</div>
                </div>
                <span style={{ fontSize: 18, color: c['content-tertiary'], flexShrink: 0, marginLeft: sp.C, lineHeight: 1 }}>›</span>
              </button>
            ))}
          </div>
        )}

        {/* Suggestion chips */}
        {chips.length > 0 && !isLoading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, marginTop: sp.B, marginLeft: 30 }}>
            {chips.map(chip => (
              <button key={chip} onClick={() => onSend(chip)} style={{ padding: `${sp.A}px ${sp.C}px`, border: `1px solid #c7d2fe`, borderRadius: 14, backgroundColor: '#eef2ff', fontSize: 11, color: '#4338ca', cursor: 'pointer', fontFamily: ff.primary }}>
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Fixing progress */}
        {phase === 'fixing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginTop: sp.B }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${c['border-divider']}`, borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: c['content-secondary'] }}>Applying fixes…</span>
          </div>
        )}

        {/* Thinking indicator */}
        {isLoading && phase !== 'fixing' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginTop: sp.B, marginLeft: 30 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${c['border-divider']}`, borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: c['content-secondary'] }}>Thinking…</span>
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div ref={chatEndRef} />
      </div>

      {/* Input — always visible; disabled during fixing */}
      <div style={{ padding: `${sp.C}px ${sp.D}px`, borderTop: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: sp.B, alignItems: 'flex-end' }}>
          <textarea
            value={inputValue}
            onChange={e => onInputChange(e.target.value)}
            placeholder={phase === 'fixing' ? 'Applying fixes…' : inputPlaceholder}
            disabled={phase === 'fixing'}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (inputValue.trim() && phase !== 'fixing') onSend(inputValue.trim());
              }
            }}
            style={{
              flex: 1, minWidth: 0, resize: 'none', minHeight: 44, maxHeight: 120,
              overflow: 'auto',
              padding: `${sp.C}px ${sp.C}px`,
              border: `1px solid ${c['border-divider']}`,
              borderRadius: 10, fontSize: fs.sm, fontFamily: ff.primary,
              color: phase === 'fixing' ? c['content-tertiary'] : c['content-primary'],
              backgroundColor: phase === 'fixing' ? c['background-sunken'] : c['background-subtle'],
              outline: 'none', lineHeight: 1.5,
            }}
            rows={1}
          />
          <button
            onClick={() => { if (inputValue.trim() && phase !== 'fixing') onSend(inputValue.trim()); }}
            disabled={phase === 'fixing'}
            style={{
              width: 34, height: 34, flexShrink: 0, border: 'none', borderRadius: '50%',
              backgroundColor: phase === 'fixing' ? c['background-subtle'] : '#6366f1',
              color: phase === 'fixing' ? c['content-tertiary'] : '#fff',
              cursor: phase === 'fixing' ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, transition: 'background-color 0.15s',
            }}
          >↑</button>
        </div>
        <div style={{ marginTop: sp.A, fontSize: 11, color: c['content-tertiary'] }}>
          SpotterPrep responses should be reviewed.{' '}
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Learn more</span>
        </div>
      </div>
    </div>
  );
};

// ── PrepSession ───────────────────────────────────────────────────────────────

interface PrepSessionProps {
  onExit: () => void;
  onPublish: () => void;
}

let msgCounter = 0;
const mkId = () => `m${++msgCounter}`;

const VERSIONS = [
  { value: 'v2', label: 'v2 · Current' },
  { value: 'v1', label: 'v1 · Original' },
];

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const PrepSession: React.FC<PrepSessionProps> = ({ onExit, onPublish }) => {
  const [phase, setPhase]           = useState<AgentPhase>('choosing');
  const [path, setPath]             = useState<JourneyPath>(null);
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [chips, setChips]           = useState<string[]>([]);
  const [dataView, setDataView]     = useState<DataView>('before');
  const [compareEnabled, setCompareEnabled]     = useState(false);
  const [showPlanModal, setShowPlanModal]       = useState(false);
  const [showScorePopover, setShowScorePopover] = useState(false);
  const [version, setVersion]       = useState('v2');
  const [fixedCols, setFixedCols]   = useState<Set<keyof DataRow>>(new Set());
  const [hasFixes, setHasFixes]     = useState(false);

  const scriptRef      = useRef<ScriptStep[]>([]);
  const scriptIndexRef = useRef(0);
  const isMounted      = useRef(false);
  const initDoneRef    = useRef(false);
  const scoreRef       = useRef<HTMLDivElement>(null);
  const hasFixesRef    = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: mkId() }]);
  }, []);

  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;
    addMessage({ role: 'agent', content: 'How would you like to proceed?' });
  }, [addMessage]);

  const playScript = useCallback(async (from: number) => {
    const steps = scriptRef.current;
    let i = from;

    while (i < steps.length) {
      if (!isMounted.current) return;
      const step = steps[i];

      if (step.type === 'wait') {
        setIsLoading(false);
        setChips(step.chips ?? []);
        scriptIndexRef.current = i + 1;
        return;
      }

      if (step.type === 'fix') {
        setIsLoading(false);
        setChips([]);
        setPhase('fixing');
        await wait(2800);
        if (!isMounted.current) return;
        if (step.scope && step.scope.length > 0) {
          setFixedCols(new Set(step.scope));
        }
        hasFixesRef.current = true;
        setHasFixes(true);
        setPhase('done');
        setCompareEnabled(true);
        setDataView('after');
        const msg = step.message ?? 'Done. Fixes applied successfully. Click Publish to save this version.';
        addMessage({ role: 'agent', type: 'fix-result', content: msg });
        return;
      }

      if (step.delay > 0) {
        setIsLoading(true);
        await wait(step.delay);
        if (!isMounted.current) return;
      }

      if (step.type === 'tool-call') {
        addMessage({ role: 'agent', type: 'tool-call', toolName: step.toolName, toolInput: step.toolInput, content: '' });
      } else if (step.type === 'agent') {
        setIsLoading(false);
        addMessage({ role: 'agent', type: step.msgType, content: step.content });
      }

      i++;
    }

    setIsLoading(false);
  }, [addMessage]);

  const handleChoosePath = useCallback((chosen: 'problem' | 'system' | 'freetext') => {
    setPath(chosen);
    setPhase('chatting');
    setChips([]);
    const label = chosen === 'problem' ? 'Fix a specific column problem' : chosen === 'system' ? 'Fix all quality problems' : 'Ask anything';
    addMessage({ role: 'user', content: label });
    scriptRef.current = chosen === 'problem' ? PROBLEM_SCRIPT : chosen === 'system' ? SYSTEM_SCRIPT : FREETEXT_SCRIPT;
    scriptIndexRef.current = 0;
    playScript(0);
  }, [addMessage, playScript]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    setInputValue('');
    setChips([]);
    addMessage({ role: 'user', content: text });

    if (phase === 'choosing') {
      setPath('freetext');
      setPhase('chatting');
      scriptRef.current = FREETEXT_SCRIPT;
      scriptIndexRef.current = 0;
      playScript(0);
      return;
    }

    if (hasFixesRef.current) {
      setIsLoading(true);
      setTimeout(() => {
        if (!isMounted.current) return;
        setIsLoading(false);
        addMessage({ role: 'agent', content: 'What else would you like to fix or explore?' });
      }, 700);
      return;
    }

    const next = scriptIndexRef.current;
    playScript(next);
  }, [phase, addMessage, playScript]);

  const handlePlanApply = useCallback((_selectedIds: Set<string>, _fixValues: Record<string, string>) => {
    setShowPlanModal(false);
    addMessage({ role: 'user', content: 'Apply all' });
    setChips([]);
    const next = scriptIndexRef.current;
    playScript(next);
  }, [addMessage, playScript]);

  const { before } = QUALITY_SCORE;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', fontFamily: ff.primary, backgroundColor: c['background-base'] }}>

      {/* ── Top bar ── */}
      <div style={{ height: 48, flexShrink: 0, backgroundColor: c['background-base-inverse'], display: 'flex', alignItems: 'center', padding: `0 ${sp.F}px`, gap: sp.D }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: fw.semibold }}>S</div>
          <span style={{ fontSize: fs.xs, color: 'rgba(255,255,255,0.5)' }}>SpotterPrep</span>
          <span style={{ fontSize: fs.xs, color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: 'rgba(255,255,255,0.9)' }}>fnops-final</span>
        </div>

        <select value={version} onChange={e => setVersion(e.target.value)} style={{ padding: `2px ${sp.B}px`, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: ff.primary, cursor: 'pointer', outline: 'none' }}>
          {VERSIONS.map(v => <option key={v.value} value={v.value} style={{ backgroundColor: '#1e1e2e', color: '#fff' }}>{v.label}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        {phase !== 'choosing' && (
          <div ref={scoreRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowScorePopover(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `3px ${sp.C}px`, borderRadius: 6, backgroundColor: hasFixes ? '#15803d22' : '#c2410c22', border: `1px solid ${hasFixes ? '#15803d44' : '#c2410c44'}`, cursor: 'pointer', fontFamily: ff.primary }}>
              <span style={{ fontSize: 12, fontWeight: fw.semibold, color: hasFixes ? '#86efac' : '#fca5a5' }}>{hasFixes ? QUALITY_SCORE.after.grade : before.grade}</span>
              <span style={{ fontSize: 11, fontWeight: fw.semibold, color: hasFixes ? '#86efac' : '#fca5a5' }}>{hasFixes ? QUALITY_SCORE.after.score : before.score}</span>
              {hasFixes && <span style={{ fontSize: 10, color: '#4ade80', marginLeft: 2 }}>↑ +{QUALITY_SCORE.after.score - before.score}</span>}
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginLeft: 1 }}>▾</span>
            </button>
            {showScorePopover && <ScorePopover onClose={() => setShowScorePopover(false)} />}
          </div>
        )}

        <button onClick={onExit} style={{ padding: `${sp.A}px ${sp.C}px`, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, backgroundColor: 'transparent', color: 'rgba(255,255,255,0.8)', fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary }}>Exit</button>
        <button onClick={hasFixes ? onPublish : undefined} style={{ padding: `${sp.A}px ${sp.C}px`, border: 'none', borderRadius: 6, backgroundColor: hasFixes ? c['background-brand'] : 'rgba(255,255,255,0.12)', color: hasFixes ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: fs.xs, fontWeight: fw.medium, cursor: hasFixes ? 'pointer' : 'not-allowed', fontFamily: ff.primary, transition: 'background-color 0.2s' }}>Publish</button>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* Data table */}
        <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], fontFamily: 'monospace' }}>billing_accounts</span>
            <span style={{ fontSize: 11, color: c['content-tertiary'] }}>· 68,432 rows · showing {RAW_ROWS.length} · 8 columns</span>
            {compareEnabled && (
              <span style={{ fontSize: 10, fontWeight: fw.medium, color: dataView === 'after' ? '#15803d' : '#c2410c', backgroundColor: dataView === 'after' ? '#dcfce7' : '#fff7ed', borderRadius: 4, padding: '1px 6px', marginLeft: sp.B }}>
                {dataView === 'after' ? 'After prep' : 'Before prep'}
              </span>
            )}
            {compareEnabled && (
              <button
                onClick={() => setDataView(v => v === 'before' ? 'after' : 'before')}
                style={{ marginLeft: 'auto', padding: `${sp.A}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 5, backgroundColor: 'transparent', color: c['content-brand'], fontSize: 11, cursor: 'pointer', fontFamily: ff.primary }}
              >
                {dataView === 'before' ? 'View after →' : '← View before'}
              </button>
            )}
          </div>

          {dataView === 'before' && (
            <div style={{ padding: `${sp.A}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', gap: sp.C, alignItems: 'center', flexShrink: 0, backgroundColor: c['background-sunken'] }}>
              <span style={{ fontSize: 10, color: c['content-tertiary'] }}>Highlighted:</span>
              {[
                { color: '#fff7ed', textColor: '#c2410c', label: 'Null' },
                { color: '#f5f3ff', textColor: '#6d28d9', label: 'Blank' },
                { color: '#ecfdf5', textColor: '#065f46', label: 'Type mismatch' },
                { color: '#fdf2f8', textColor: '#be185d', label: 'Anomaly' },
              ].map(item => (
                <span key={item.label} style={{ fontSize: 10, color: item.textColor, backgroundColor: item.color, borderRadius: 3, padding: '1px 5px' }}>{item.label}</span>
              ))}
            </div>
          )}

          <DataTable view={dataView} fixedCols={fixedCols} />
        </div>

        {/* Agent panel */}
        <div style={{ width: 360, flexShrink: 0 }}>
          <AgentPanel
            phase={phase}
            path={path}
            messages={messages}
            inputValue={inputValue}
            isLoading={isLoading}
            chips={chips}
            onInputChange={setInputValue}
            onSend={handleSend}
            onChoosePath={handleChoosePath}
            onViewPlan={() => setShowPlanModal(true)}
          />
        </div>
      </div>

      {showPlanModal && (
        <PlanModal
          onApply={handlePlanApply}
          onClose={() => setShowPlanModal(false)}
          onBackToAgent={() => setShowPlanModal(false)}
        />
      )}
    </div>
  );
};

export default PrepSession;
