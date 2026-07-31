import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { GlobalHeader } from '../../../components';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import { Icon } from '../../../components/icons';
import { BrandMark } from '../../../components/BrandMark';
import AgentPanel, { AgentMessage } from './AgentPanel';
import { PILLARS, READINESS_ISSUES, issuesForPillar } from '../data/readiness';
import { SpreadsheetGrid, SpreadsheetSkeleton, SpreadsheetColumnMenu, DataSheetToolbar } from './Spreadsheet';
import { AnchoredMenu } from './AnchoredMenu';
import { SnowflakeMark, DatabricksMark, BigqueryMark, SalesforceMark, DbtMark } from './icons/ConnectorIcons';
import TestView from './TestView';
import { useVariant } from '../variant';
import { ProjectState, emptyContext } from '../index';

// ── Types ─────────────────────────────────────────────────────────────────────

type OpType = 'source' | 'join' | 'filter' | 'agg' | 'formula' | 'rename' | 'sort' | 'union' | 'limit' | 'sql' | 'python' | 'nullfix';

interface PipelineStep {
  type: OpType;
  label: string;
  desc: string;
  cols: [string, string][];
  prep?: boolean; // materialization-requiring prep step (blocks switching back to live)
  nullFix?: { column: string; value: string }; // per-step null remediation (for version-aware preview)
  sql?: string; // saved query for a SQL step
  filter?: { name: string; column: string; operator: string; value: string }; // per-step filter predicate
  title?: string; // user-given block name (shown in the properties-panel header)
  formulas?: { col: string; expr: string }[]; // computed columns added via this step (cumulative)
  pythonCode?: string; // saved script for a Python step
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
  inputIds?: string[]; // block-flow mode: ids of upstream blocks feeding this one
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
  /** Set once dragged — the badge then keeps the user's position instead of
   *  riding the midpoint of its line. */
  moved?: boolean;
}

export interface InitialCanvasJoin {
  table1: string;
  table2: string;
  col1: string;
  col2: string;
  joinType: 'inner' | 'full_outer' | 'left_outer' | 'right_outer';
  cardinality: 'many_to_one' | 'one_to_many' | 'one_to_one';
}

interface ModelCanvasProps {
  onBack: () => void;
  onPublished?: () => void;
  mode?: 'dataset' | 'blocks' | 'dataset2';
  // Pre-populate the canvas with tables/joins (MRD flow, SpotterX embed).
  initialTables?: string[];
  initialJoins?: InitialCanvasJoin[];
  // SpotterX embed hooks. Accepted so the shell type-checks; the wired ones
  // (hideAgentPanel, embedHeaderLeft/Right) take effect, the rest are no-ops on
  // this canvas until re-implemented here.
  hideAgentPanel?: boolean;
  embedHeaderLeft?: React.ReactNode;
  embedHeaderRight?: React.ReactNode;
  hideSemanticModelsTab?: boolean;
  contextualToolbar?: boolean;
  showTestTab?: boolean;
  onTestFixWithAI?: (items: unknown[]) => void;
  // POC: scoped data browser — no source tabs / filter (data connections only),
  // multi-connection selectable, with expandable tick-based column selection and
  // explicit + add icons. Unset (Vision / SpotterX) = full browser, unchanged.
  poc?: boolean;
}

// ── Per-op icon for the properties-panel header ─────────────────────────────────
function stepIcon(type: string) {
  const p = { width: 13, height: 13, viewBox: '0 0 16 16', fill: 'none' as const };
  switch (type) {
    case 'python': return <svg {...p}><path d="M6 2c-1.1 0-2 .4-2 1v2h4V4H6V3h4c1.1 0 2 .4 2 1v2c0 1.1-.9 2-2 2H6c-1.1 0-2 .9-2 2v2c0 .6.9 1 2 1h4c1.1 0 2-.4 2-1v-2H8v1h2v1H6v-1h4c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H6c-1.1 0-2-.9-2-2V3c0-.6.9-1 2-1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>;
    case 'sql': return <svg {...p}><path d="M4.5 5L2 8l2.5 3M11.5 5L14 8l-2.5 3M9.5 3.5l-3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'join': return <svg {...p}><circle cx="6" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/></svg>;
    case 'filter': return <svg {...p}><path d="M2 4.5h12l-4.5 5.5v3l-3-1.5V10L2 4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>;
    case 'agg': return <svg {...p}><path d="M11.5 4h-7l5 4-5 4h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'formula': return <svg {...p}><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
    case 'nullfix': return <svg {...p}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/><line x1="4" y1="12" x2="12" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
    default: return <svg {...p}><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M5 6h6M5 8.5h4M5 11h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
  }
}

// ── Properties-panel header icon — Radiant icons where an equivalent exists;
// bespoke (refined to match Radiant's stroke/size) for concepts Radiant has no icon for.
function panelHeaderIcon(type: string, color: string) {
  switch (type) {
    case 'join':   return <Icon name="join-inner" size="xs" color={color} />;
    case 'filter': return <Icon name="filter" size="xs" color={color} />;
    case 'formula':return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke={color} strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/></svg>;
    case 'python': return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M6 2c-1.1 0-2 .4-2 1v2h4V4H6V3h4c1.1 0 2 .4 2 1v2c0 1.1-.9 2-2 2H6c-1.1 0-2 .9-2 2v2c0 .6.9 1 2 1h4c1.1 0 2-.4 2-1v-2H8v1h2v1H6v-1h4c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H6c-1.1 0-2-.9-2-2V3c0-.6.9-1 2-1z" stroke={color} strokeWidth="1.1" strokeLinejoin="round"/></svg>;
    case 'sql':    return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4.5 5L2 8l2.5 3M11.5 5L14 8l-2.5 3M9.5 3.5l-3 9" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'agg':    return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11.5 4h-7l5 4-5 4h7" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'nullfix':return <Icon name="wrench" size="xs" color={color} />;
    default:       return <Icon name="table" size="xs" color={color} />; // source
  }
}

// ── Code editor (line-numbered gutter + textarea) ───────────────────────────────
// Lightweight syntax highlighter (demo-grade) — escapes, then colors comments,
// strings, keywords and numbers in a single pass so tokens never nest wrongly.
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CODE_COLORS = { comment: '#777E8B', string: '#C2410C', keyword: '#7C3AED', number: '#0E7490' };
/**
 * Colour theming for the spreadsheet formula bar.
 *
 * Formulas here are written in business terms, not code —
 *   Renewal Risk = (Usage Decline 90d × 0.4) + (Open P1 Escalations × 0.35)
 * — so the tokens worth colouring are different from Python/SQL: the column
 * being defined, the fields it reads, the weights, and the operators.
 *
 * Rendered into a <pre> sitting behind a transparent-text input, the same
 * layering CodeEditor uses.
 */
const FORMULA_COLORS = {
  target:   '#7C3AED', // the column being defined, left of '='
  field:    '#2770EF', // referenced fields
  number:   '#0E7490',
  operator: '#777E8B',
  paren:    '#A5ACB9',
};

// Field names first so a digit inside one (`Usage Decline 90d`) isn't split off as
// a number. One pass over the raw text, not a chain of replaces over the output of
// the last: the chained version re-matched the `=` and `#` inside its own
// `style="color:…"` attributes and painted the markup into the visible string.
const FORMULA_TOKEN = /([A-Za-z][A-Za-z0-9_]*(?:[ \t]+[A-Za-z0-9_]+)*)|(\d+(?:\.\d+)?)|([×*+\-/=])|([()])/g;

function highlightFormula(text: string): string {
  const eq = text.indexOf('=');
  const head = eq >= 0 ? text.slice(0, eq) : '';
  const body = eq >= 0 ? text.slice(eq) : text;

  let painted = '';
  let last = 0;
  for (const m of body.matchAll(FORMULA_TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) painted += escapeHtml(body.slice(last, at));
    const color = m[1] ? FORMULA_COLORS.field
      : m[2] ? FORMULA_COLORS.number
      : m[3] ? FORMULA_COLORS.operator
      : FORMULA_COLORS.paren;
    painted += `<span style="color:${color}">${escapeHtml(m[0])}</span>`;
    last = at + m[0].length;
  }
  painted += escapeHtml(body.slice(last));

  return (head
    ? `<span style="color:${FORMULA_COLORS.target};font-weight:600">${escapeHtml(head)}</span>`
    : '') + painted;
}

const PY_RE =/(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|(?:[frbu]{0,2})"(?:\\.|[^"\\\n])*"|(?:[frbu]{0,2})'(?:\\.|[^'\\\n])*')|\b(import|from|as|def|class|return|if|elif|else|for|while|in|not|and|or|is|None|True|False|with|try|except|finally|raise|lambda|yield|global|nonlocal|pass|break|continue|async|await|del|assert)\b|\b(\d+\.?\d*)\b/g;
const SQL_RE = /(--[^\n]*)|('(?:\\.|[^'\\\n])*')|\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|GROUP|BY|ORDER|HAVING|LIMIT|OFFSET|AS|AND|OR|NOT|NULL|IS|IN|LIKE|BETWEEN|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|WITH|UNION|ALL|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|VIEW|COALESCE|CAST|OVER|PARTITION|DESC|ASC)\b|\b(\d+\.?\d*)\b/gi;
const wrapTok = (_m: string, c?: string, s?: string, kw?: string, num?: string) =>
  c ? `<span style="color:${CODE_COLORS.comment}">${c}</span>`
  : s ? `<span style="color:${CODE_COLORS.string}">${s}</span>`
  : kw ? `<span style="color:${CODE_COLORS.keyword}">${kw}</span>`
  : num ? `<span style="color:${CODE_COLORS.number}">${num}</span>`
  : _m;
function highlightCode(code: string, lang: 'python' | 'sql') {
  const esc = escapeHtml(code);
  return (lang === 'sql' ? esc.replace(SQL_RE, wrapTok) : esc.replace(PY_RE, wrapTok)) + '\n';
}

// Measure the pixel position of a textarea's caret (viewport coords) — for anchoring
// the @-mention menu inline at the cursor rather than below the editor.
function caretPoint(ta: HTMLTextAreaElement): { x: number; y: number; height: number } {
  const pos = ta.selectionStart;
  const s = getComputedStyle(ta);
  const mirror = document.createElement('div');
  const copy = ['boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textTransform', 'whiteSpace', 'wordBreak', 'wordWrap', 'tabSize'];
  copy.forEach(p => { (mirror.style as unknown as Record<string, string>)[p] = (s as unknown as Record<string, string>)[p]; });
  mirror.style.position = 'absolute';
  mirror.style.top = '0';
  mirror.style.left = '0';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordBreak = 'break-word';
  mirror.style.overflow = 'hidden';
  mirror.style.height = 'auto';
  mirror.textContent = ta.value.slice(0, pos);
  const marker = document.createElement('span');
  marker.textContent = ta.value.slice(pos) || '.';
  mirror.appendChild(marker);
  document.body.appendChild(mirror);
  const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.65;
  const rect = ta.getBoundingClientRect();
  const x = rect.left + marker.offsetLeft - ta.scrollLeft;
  const y = rect.top + marker.offsetTop - ta.scrollTop;
  document.body.removeChild(mirror);
  return { x, y, height: lh };
}

function CodeEditor({ value, onChange, placeholder, minHeight, language = 'python', fill = false, focused = false }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight: number;
  language?: 'python' | 'sql';
  fill?: boolean;
  focused?: boolean;
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);
  const preRef = React.useRef<HTMLPreElement>(null);
  const mono = "'SF Mono', 'Fira Mono', 'Menlo', monospace";
  const lineCount = Math.max(value.split('\n').length, 1);
  const codeMetrics: React.CSSProperties = { boxSizing: 'border-box', padding: '10px 12px', fontFamily: mono, fontSize: 12.5, lineHeight: '1.65em', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 };
  return (
    <div ref={wrapRef} style={{ display: 'flex', alignItems: 'stretch', border: `1px solid ${focused ? '#2770EF' : '#E2E6EC'}`, borderRadius: 8, background: '#F6F8FA', overflow: 'hidden', boxShadow: focused ? '0 0 0 3px rgba(39,112,239,0.10)' : 'none', ...(fill ? { flex: 1, minHeight: 0 } : { minHeight }), transition: 'border-color 120ms, box-shadow 120ms' }}>
      <div ref={gutterRef} style={{ flexShrink: 0, boxSizing: 'border-box', padding: '10px 8px 10px 6px', textAlign: 'right', color: '#A5ACB9', fontFamily: mono, fontSize: 12.5, lineHeight: '1.65em', userSelect: 'none', overflow: 'hidden', background: '#EEF1F5', borderRight: '1px solid #E4E8EE', minWidth: 38 }}>
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} style={{ height: '1.65em' }}>{i + 1}</div>
        ))}
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: fill ? 0 : minHeight }}>
        <pre ref={preRef} aria-hidden="true" style={{ ...codeMetrics, position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', color: '#1D232F' }} dangerouslySetInnerHTML={{ __html: highlightCode(value, language) }} />
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onScroll={e => { const t = e.currentTarget; if (gutterRef.current) gutterRef.current.scrollTop = t.scrollTop; if (preRef.current) { preRef.current.scrollTop = t.scrollTop; preRef.current.scrollLeft = t.scrollLeft; } }}
          onFocus={() => { if (wrapRef.current) { wrapRef.current.style.borderColor = '#2770EF'; wrapRef.current.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.10)'; } }}
          onBlur={() => { if (wrapRef.current) { wrapRef.current.style.borderColor = focused ? '#2770EF' : '#E2E6EC'; wrapRef.current.style.boxShadow = focused ? '0 0 0 3px rgba(39,112,239,0.10)' : 'none'; } }}
          placeholder={placeholder}
          spellCheck={false}
          style={{ ...codeMetrics, position: 'absolute', inset: 0, border: 'none', outline: 'none', resize: 'none', background: 'transparent', color: 'transparent', caretColor: '#1D232F', overflow: 'auto', width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
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
  customer_regions:[['customer_id','INT'],['region','VARCHAR'],['csm_owner','VARCHAR'],['tier','VARCHAR'],['comment','VARCHAR']],
  mp_events:    [['event_id','VARCHAR'],['event_name','VARCHAR'],['user_id','VARCHAR'],['timestamp','TIMESTAMP'],['properties','VARCHAR']],
  mp_users:     [['user_id','VARCHAR'],['email','VARCHAR'],['plan','VARCHAR'],['signup_date','DATE'],['last_seen','TIMESTAMP']],
  mp_cohorts:   [['cohort_id','VARCHAR'],['name','VARCHAR'],['size','INT'],['created_at','DATE']],
  pendo_nps:    [['response_id','VARCHAR'],['visitor_id','VARCHAR'],['score','INT'],['comment','VARCHAR'],['submitted_at','DATE']],
  pendo_feature_usage:[['visitor_id','VARCHAR'],['feature','VARCHAR'],['clicks','INT'],['last_used','TIMESTAMP']],
  pendo_visitors:[['visitor_id','VARCHAR'],['account_id','VARCHAR'],['first_seen','DATE'],['region','VARCHAR']],
  // account_id added so the Jira table can join to accounts (run-of-show S12);
  // priority uses P1/P2/P3 so the notebook filter in S11 has something to match.
  jira_cs_tickets:[['issue_key','VARCHAR'],['account_id','VARCHAR'],['summary','VARCHAR'],['status','VARCHAR'],['priority','VARCHAR'],['assignee','VARCHAR'],['created','DATE']],
  // ── Customer Health dataset ───────────────────────────────────────────────────
  dim_accounts:          [['account_id','VARCHAR'],['account_name','VARCHAR'],['industry','VARCHAR'],['arr','FLOAT'],['region','VARCHAR'],['account_tier','VARCHAR'],['renewal_date','DATE']],
  support_cases:         [['case_id','VARCHAR'],['account_id','VARCHAR'],['created_date','DATE'],['priority','VARCHAR'],['status','VARCHAR'],['case_category','VARCHAR'],['resolution_time_hours','FLOAT']],
  call_metrics:          [['call_id','VARCHAR'],['account_id','VARCHAR'],['call_date','DATE'],['duration_minutes','FLOAT'],['sentiment_score','FLOAT'],['deal_risk_flag','VARCHAR']],
  customer_found_defects:[['defect_id','VARCHAR'],['account_id','VARCHAR'],['reported_date','DATE'],['severity','VARCHAR'],['status','VARCHAR'],['resolution_days','FLOAT']],
  csm_account_mapping:   [['account_id','VARCHAR'],['csm_name','VARCHAR'],['exec_sponsor','VARCHAR'],['csm_region','VARCHAR'],['account_tier','VARCHAR']],
  pendo_nps_enriched:    [['account_id','VARCHAR'],['nps_score','FLOAT'],['nps_comments','VARCHAR'],['sentiment','VARCHAR'],['sentiment_score','FLOAT'],['response_date','DATE']],
  qbr_notes:             [['account_id','VARCHAR'],['qbr_date','DATE'],['summary','VARCHAR'],['csm_name','VARCHAR'],['action_items','INT']],
  renewal_tracker:       [['account_id','VARCHAR'],['renewal_date','DATE'],['stage','VARCHAR'],['forecast','VARCHAR'],['owner','VARCHAR']],
  // ── Renewal-risk demo (run-of-show) ───────────────────────────────────────────
  // Table names and the columns called out on screen come straight from the
  // script. Keyed on the same ACC-#### ids as dim_accounts so they join.
  // Snowflake:
  // `acct_st` is deliberately cryptic: S16's narration names it out loud as the
  // example of a column an LLM can't reason about. Values are codes, not words.
  accounts:              [['account_id','VARCHAR'],['account_name','VARCHAR'],['acct_st','VARCHAR'],['segment','VARCHAR'],['owner','VARCHAR'],['region','VARCHAR']],
  contracts:             [['contract_id','VARCHAR'],['account_id','VARCHAR'],['renewal_date','DATE'],['term_months','INT'],['acv','FLOAT']],
  arr_snapshot:          [['account_id','VARCHAR'],['arr','FLOAT'],['arr_change_pct','FLOAT'],['snapshot_date','DATE']],
  billing_events:        [['event_id','VARCHAR'],['account_id','VARCHAR'],['event_type','VARCHAR'],['amount','FLOAT'],['event_date','DATE']],
  // Databricks:
  usage_events:          [['account_id','VARCHAR'],['event_date','DATE'],['active_users','INT'],['sessions','INT'],['usage_delta_90d','FLOAT']],
  feature_adoption:      [['account_id','VARCHAR'],['feature','VARCHAR'],['adoption_pct','FLOAT'],['last_used','DATE']],
  // CSV the CS team uploads:
  qbr_sentiment:         [['account_id','VARCHAR'],['qbr_date','DATE'],['sentiment','VARCHAR'],['sentiment_delta','FLOAT'],['csm_name','VARCHAR']],
};

/**
 * Where each demo table came from — read by the publish modal so it can name the
 * model's real sources instead of claiming everything is Snowflake. Only covers
 * the run-of-show tables; anything else falls back to its `sourceKind`.
 */
const CONNECTION_BY_TABLE: Record<string, string> = {
  accounts:        'Snowflake',
  contracts:       'Snowflake',
  arr_snapshot:    'Snowflake',
  billing_events:  'Snowflake',
  usage_events:    'Databricks',
  feature_adoption: 'Databricks',
  qbr_sentiment:   'CSV upload',
  jira_cs_tickets: 'Jira (script)',
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
    [42,'West','Dana Wu','Enterprise','Love the new dashboards — huge time saver.'],
    [17,'East',null,'SMB','Support was slow to respond last month.'],
    [5,null,'Priya Shah','Enterprise','Works well overall, a few small bugs.'],
    [31,'South','Dana Wu',null,'The product keeps crashing during export.'],
    [88,null,null,'SMB','Pricing feels high for what we actually use.'],
    [72,'North','Sam Okafor','Enterprise','Fantastic onboarding — very happy so far.'],
    [9,'West',null,'Startup','It is okay, nothing special.'],
    [54,'East','Priya Shah','SMB','Renewed because the analytics are excellent.'],
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
  // ── Customer Health dataset ───────────────────────────────────────────────────
  dim_accounts: [
    ['ACC-0001','Acme Corp',         'Manufacturing',      240000,'APAC','Enterprise', '2024-09-30'],
    ['ACC-0002','Globex Inc',        'Retail',              85000,'NA',  'Mid-Market', '2024-11-15'],
    ['ACC-0003','Initech LLC',       'Technology',         420000,'EMEA','Enterprise', '2025-01-31'],
    ['ACC-0004','Umbrella Co',       null,                  32000,'NA',  'SMB',        '2024-08-20'],
    ['ACC-0005','Soylent Systems',   'Healthcare',         190000,'APAC','Mid-Market', null],
    ['ACC-0006','Stark Industries',  'Technology',         510000,'NA',  'Enterprise', '2025-02-28'],
    ['ACC-0007','Wayne Enterprises', 'Manufacturing',      375000,'NA',  'Enterprise', '2024-12-01'],
    ['ACC-0008','Wonka Industries',  'Consumer Goods',      64000,'EMEA','SMB',        '2024-10-12'],
    ['ACC-0009','Cyberdyne Systems', 'Technology',         298000,'APAC','Enterprise', '2025-03-15'],
    ['ACC-0010','Tyrell Corp',       'Technology',         142000,'NA',  'Mid-Market', '2024-11-30'],
    ['ACC-0011','Hooli',             'Technology',         460000,'NA',  'Enterprise', '2025-01-10'],
    ['ACC-0012','Pied Piper',        'Technology',          28000,'NA',  'SMB',        '2024-09-05'],
    ['ACC-0013','Massive Dynamic',   'Healthcare',         330000,'EMEA','Enterprise', '2025-04-01'],
    ['ACC-0014','Vandelay Inds',     'Logistics',           76000,'APAC','Mid-Market', '2024-12-20'],
    ['ACC-0015','Gekko & Co',        'Financial Services', 215000,'NA',  'Enterprise', null],
    ['ACC-0016','Wernham Hogg',      'Media',               54000,'EMEA','SMB',        '2024-10-28'],
    ['ACC-0017','Dunder Mifflin',    'Manufacturing',       98000,'NA',  'Mid-Market', '2024-11-08'],
    ['ACC-0018','Prestige Worldwide',null,                  41000,'APAC','SMB',        '2025-02-14'],
    ['ACC-0019','Bluth Company',     'Real Estate',         67000,'NA',  'Mid-Market', '2024-12-31'],
    ['ACC-0020','Sterling Cooper',   'Media',              185000,'EMEA','Mid-Market', '2025-01-22'],
    ['ACC-0021','Oscorp',            'Healthcare',         402000,'NA',  'Enterprise', '2025-03-30'],
    ['ACC-0022','LexCorp',           'Energy',             488000,'NA',  'Enterprise', '2024-10-05'],
    ['ACC-0023','Nakatomi Trading',  'Financial Services', 256000,'APAC','Enterprise', '2025-02-11'],
    ['ACC-0024','Weyland Corp',      'Energy',              39000,'EMEA','SMB',        '2024-09-18'],
    ['ACC-0025','Aperture Science',  'Technology',         174000,'NA',  'Mid-Market', '2025-04-20'],
    ['ACC-0026','Black Mesa',        'Energy',             221000,'NA',  'Enterprise', null],
    ['ACC-0027','Gringotts',         'Financial Services', 345000,'EMEA','Enterprise', '2025-01-05'],
    ['ACC-0028','Duff Brewing',      'Consumer Goods',      58000,'APAC','SMB',        '2024-11-25'],
    ['ACC-0029','Krusty Corp',       'Hospitality',         47000,'NA',  'SMB',        '2024-12-09'],
    ['ACC-0030','Monsters Inc',      'Energy',             163000,'NA',  'Mid-Market', '2025-03-08'],
    ['ACC-0031','Los Pollos',        'Hospitality',         35000,'EMEA','SMB',        '2024-10-17'],
    ['ACC-0032','Vought Intl',       'Media',              395000,'NA',  'Enterprise', '2025-02-01'],
    ['ACC-0033','Sirius Cybernetics','Technology',         128000,'APAC','Mid-Market', '2024-12-15'],
    ['ACC-0034','Rich Industries',   'Manufacturing',       82000,'NA',  'Mid-Market', '2025-01-18'],
    ['ACC-0035','Blue Sun Corp',     'Logistics',          274000,'EMEA','Enterprise', '2024-11-02'],
  ],
  support_cases: [
    ['CS-10441','ACC-0001','2024-03-01','P2','Closed','Bug',         48],
    ['CS-10442','ACC-0003','2024-03-05','P1','Open',  'Performance', null],
    ['CS-10443','ACC-0002','2024-03-07','P3','Closed', null,         72],
    ['CS-10444','ACC-0001','2024-03-12','P2','Closed','Data Loss',   24],
    ['CS-10445','ACC-0005','2024-03-14','P1','Open',  'Bug',         null],
  ],
  call_metrics: [
    ['CALL-7701','ACC-0001','2024-03-20',42,  0.71,'false'],
    ['CALL-7702','ACC-0003','2024-03-21',28,  0.34,'true'],
    ['CALL-7703','ACC-0002','2024-03-22',55,  null, 'false'],
    ['CALL-7704','ACC-0005','2024-03-23',18,  0.58,'false'],
    ['CALL-7705','ACC-0001','2024-03-24',37,  0.82,'false'],
  ],
  customer_found_defects: [
    ['DEF-3301','ACC-0003','2024-02-10','S1','Open',     null],
    ['DEF-3302','ACC-0001','2024-02-14','S2','Resolved', 12],
    ['DEF-3303','ACC-0002','2024-02-18','S3','Resolved', 5],
    ['DEF-3304','ACC-0005','2024-03-01','S2','Open',     null],
    ['DEF-3305','ACC-0003','2024-03-05','S1','Open',     null],
  ],
  csm_account_mapping: [
    ['ACC-0001','Priya Sharma',     'Ravi Menon',     'APAC','Enterprise'],
    ['ACC-0002','Liam Chen',        null,             'NA',  'Mid-Market'],
    ['ACC-0003','Fatima Al-Hassan', 'Mark Johansson', 'EMEA','Enterprise'],
    ['ACC-0004','Carlos Medina',    null,             'NA',  'SMB'],
    ['ACC-0005','Priya Sharma',     'Ananya Rao',     'APAC','Mid-Market'],
  ],
  pendo_nps_enriched: [
    ['ACC-0001', 9, 'Great support, very responsive team.',        'positive',  0.74, '2024-03-15'],
    ['ACC-0002', 3, 'Onboarding was confusing, needed more help.', 'negative', -0.51, '2024-03-16'],
    ['ACC-0003', 8, 'Good tool, occasional slowness in reports.',  'positive',  0.34, '2024-03-16'],
    ['ACC-0004', 5, null,                                          'neutral',   0.0,  '2024-03-17'],
    ['ACC-0005',10, 'Excellent product. We love the AI features.', 'positive',  0.89, '2024-03-17'],
  ],
  qbr_notes: [
    ['ACC-0001','2024-02-12','Expansion discussed — adding 2 seats.','Ravi Menon', 3],
    ['ACC-0002','2024-02-20','At-risk; onboarding gaps flagged.',    'Ravi Menon', 5],
    ['ACC-0003','2024-01-30','Steady usage, no blockers.',           'Ana Duarte', 1],
    ['ACC-0004','2024-02-28','Exec sponsor changed.',                'Ana Duarte', 2],
    ['ACC-0005','2024-03-04','Advocate; open to a case study.',      'Ravi Menon', 1],
  ],
  renewal_tracker: [
    ['ACC-0001','2024-06-30','Commit',   'Likely',   'Priya Shah'],
    ['ACC-0002','2024-05-15','Risk',     'At risk',  'Priya Shah'],
    ['ACC-0003','2024-08-01','Commit',   'Likely',   'Tom Reilly'],
    ['ACC-0004','2024-07-10','Forecast', 'Upside',   'Tom Reilly'],
    ['ACC-0005','2024-09-22','Commit',   'Likely',   'Priya Shah'],
  ],
  jira_cs_tickets: [
    ['CS-1842','ACC-0002','Cannot export dashboard to PDF','Open','P2','Sarah Chen','2024-01-15'],
    ['CS-1901','ACC-0002','SSO login fails for OKTA users','In Progress','P1','James Park','2024-01-17'],
    ['CS-1923','ACC-0004','Slow query performance on large datasets','Open','P1','Priya Shah','2024-01-18'],
    ['CS-1955','ACC-0007','Mobile app crashes on iOS 17','Resolved','P3','Sarah Chen','2024-01-19'],
    ['CS-1962','ACC-0004','API rate limit error in bulk export','Open','P1','James Park','2024-01-20'],
    ['CS-1978','ACC-0009','Permission denied on shared liveboards','In Progress','P1','Dana Wu','2024-01-21'],
    ['CS-1990','ACC-0002','Column mapping lost after schema change','Open','P2','Priya Shah','2024-01-22'],
    ['CS-2001','ACC-0011','Chart legend overlaps on small screens','Open','P3','Dana Wu','2024-01-23'],
    ['CS-2014','ACC-0004','Scheduled refresh silently failing','Open','P1','James Park','2024-01-24'],
    ['CS-2027','ACC-0009','Row-level security not applied on export','In Progress','P2','Dana Wu','2024-01-25'],
  ],
  // ── Renewal-risk demo (run-of-show) ───────────────────────────────────────────
  accounts: [
    ['ACC-0001','Acme Corp','A'   ,        'Enterprise', 'Priya Shah','APAC'],
    ['ACC-0002','Globex Inc','AR'  ,       'Mid-Market', 'Priya Shah','NA'  ],
    ['ACC-0003','Initech LLC','A'   ,      'Enterprise', 'Tom Reilly','EMEA'],
    ['ACC-0004','Umbrella Health','AR'  ,  'Enterprise', 'Tom Reilly','NA'  ],
    ['ACC-0005','Soylent Foods','A'   ,    'Mid-Market', 'Priya Shah','NA'  ],
    ['ACC-0006','Stark Industries','A'   , 'Enterprise', 'Ana Duarte','EMEA'],
    ['ACC-0007','Wayne Logistics','CH'  ,  'Mid-Market', 'Ana Duarte','NA'  ],
    ['ACC-0008','Tyrell Data','A'   ,      'Enterprise', 'Tom Reilly','APAC'],
    ['ACC-0009','Cyberdyne Systems','AR'  ,'Enterprise', 'Priya Shah','NA'  ],
    ['ACC-0010','Vandelay Group','A'   ,   'Mid-Market', 'Ana Duarte','EMEA'],
    ['ACC-0011','Hooli Cloud','P'   ,      'Mid-Market', 'Tom Reilly','NA'  ],
    ['ACC-0012','Massive Dynamic','A'   ,  'Enterprise', 'Ana Duarte','APAC'],
  ],
  contracts: [
    ['CTR-4401','ACC-0001','2024-09-30',24, 240000],
    ['CTR-4402','ACC-0002','2024-08-15',12,  85000],
    ['CTR-4403','ACC-0003','2024-09-12',36, 420000],
    ['CTR-4404','ACC-0004','2024-08-28',24, 610000],
    ['CTR-4405','ACC-0005','2024-09-22',12, 120000],
    ['CTR-4406','ACC-0006','2024-07-31',36, 880000],
    ['CTR-4407','ACC-0007','2024-09-05',12,  96000],
    ['CTR-4408','ACC-0008','2024-08-19',24, 355000],
    ['CTR-4409','ACC-0009','2024-09-28',24, 540000],
    ['CTR-4410','ACC-0010','2024-07-22',12, 110000],
    ['CTR-4411','ACC-0011','2024-08-08',12, 145000],
    ['CTR-4412','ACC-0012','2024-09-16',36, 720000],
  ],
  arr_snapshot: [
    ['ACC-0001',240000,  2.4,'2024-06-30'],
    ['ACC-0002', 85000,-18.2,'2024-06-30'],
    ['ACC-0003',420000,  5.1,'2024-06-30'],
    ['ACC-0004',610000,-24.6,'2024-06-30'],
    ['ACC-0005',120000,  0.8,'2024-06-30'],
    ['ACC-0006',880000,  9.3,'2024-06-30'],
    ['ACC-0007', 96000, -6.4,'2024-06-30'],
    ['ACC-0008',355000,  3.7,'2024-06-30'],
    ['ACC-0009',540000,-31.5,'2024-06-30'],
    ['ACC-0010',110000, -2.1,'2024-06-30'],
    ['ACC-0011',145000,-11.9,'2024-06-30'],
    ['ACC-0012',720000,  6.2,'2024-06-30'],
  ],
  billing_events: [
    ['BE-9001','ACC-0001','invoice_paid',    20000,'2024-06-01'],
    ['BE-9002','ACC-0002','invoice_overdue',  7083,'2024-06-03'],
    ['BE-9003','ACC-0004','invoice_overdue', 50833,'2024-06-05'],
    ['BE-9004','ACC-0006','invoice_paid',    73333,'2024-06-07'],
    ['BE-9005','ACC-0009','credit_note',    -12000,'2024-06-11'],
    ['BE-9006','ACC-0011','invoice_overdue', 12083,'2024-06-14'],
  ],
  usage_events: [
    ['ACC-0001','2024-06-28',412,1880,  3.1],
    ['ACC-0002','2024-06-28', 63, 210,-42.7],
    ['ACC-0003','2024-06-28',388,1642,  1.8],
    ['ACC-0004','2024-06-28',104, 351,-58.3],
    ['ACC-0005','2024-06-28',150, 690, -4.2],
    ['ACC-0006','2024-06-28',902,4310, 12.6],
    ['ACC-0007','2024-06-28', 88, 302,-19.5],
    ['ACC-0008','2024-06-28',276,1130,  2.2],
    ['ACC-0009','2024-06-28',119, 407,-63.9],
    ['ACC-0010','2024-06-28',132, 560, -8.8],
    ['ACC-0011','2024-06-28', 74, 288,-27.4],
    ['ACC-0012','2024-06-28',655,2980,  7.4],
  ],
  feature_adoption: [
    ['ACC-0002','Scheduled reports', 12.0,'2024-04-18'],
    ['ACC-0002','Spotter search',     8.5,'2024-03-30'],
    ['ACC-0004','Liveboards',        22.4,'2024-05-02'],
    ['ACC-0004','Spotter search',     6.1,'2024-04-11'],
    ['ACC-0009','Liveboards',        18.9,'2024-04-26'],
    ['ACC-0009','Data modelling',     4.3,'2024-03-15'],
    ['ACC-0001','Liveboards',        78.2,'2024-06-24'],
    ['ACC-0006','Spotter search',    84.6,'2024-06-27'],
    ['ACC-0011','Scheduled reports', 15.7,'2024-04-30'],
    ['ACC-0012','Liveboards',        71.3,'2024-06-25'],
  ],
  qbr_sentiment: [
    ['ACC-0001','2024-05-12','Positive', 0.4,'Ravi Menon'],
    ['ACC-0002','2024-05-20','Negative',-1.8,'Ravi Menon'],
    ['ACC-0003','2024-04-30','Neutral',  0.1,'Ana Duarte'],
    ['ACC-0004','2024-05-28','Negative',-2.3,'Ana Duarte'],
    ['ACC-0006','2024-05-08','Positive', 0.9,'Ravi Menon'],
    ['ACC-0009','2024-06-02','Negative',-2.6,'Ana Duarte'],
    ['ACC-0011','2024-05-15','Negative',-1.2,'Ravi Menon'],
    ['ACC-0012','2024-05-22','Positive', 0.6,'Ana Duarte'],
  ],
};

/**
 * Row filters expressed in a code step, applied to the preview.
 *
 * The notebook beat (S11) has the user narrowing a fetch to `priority in
 * (P1, P2)`, re-running, and watching the row count drop — the script calls
 * that line out as the whole point of the beat. The run handler already reads
 * code for column assignment and auth patterns; this is the row half, so
 * editing the filter has a visible effect instead of none.
 *
 * Recognised forms, on any column:
 *   df[df['col'].isin(['A','B'])]
 *   df[df['col'] == 'A']
 *   col in ('A','B')            ← SQL-ish, the way the script writes it
 */
function applyCodeRowFilters(code: string | undefined, cols: [string, string][], rows: Row[]): Row[] {
  if (!code) return rows;
  const idxOf = (name: string) => cols.findIndex(c => c[0].toLowerCase() === name.toLowerCase());
  const values = (raw: string) =>
    raw.split(',').map(v => v.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);

  let out = rows;
  const keep = (col: string, allowed: string[]) => {
    const i = idxOf(col);
    if (i < 0 || allowed.length === 0) return;
    const set = new Set(allowed.map(v => v.toLowerCase()));
    out = out.filter(r => set.has(String(r[i] ?? '').toLowerCase()));
  };

  for (const m of code.matchAll(/df\[['"](\w+)['"]\]\s*\.isin\(\s*\[([^\]]*)\]\s*\)/g)) {
    keep(m[1], values(m[2]));
  }
  for (const m of code.matchAll(/df\[['"](\w+)['"]\]\s*==\s*['"]([^'"]+)['"]/g)) {
    keep(m[1], [m[2]]);
  }
  for (const m of code.matchAll(/\b(\w+)\s+in\s*\(([^)]*)\)/gi)) {
    keep(m[1], values(m[2]));
  }
  return out;
}

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
  python:  { label: 'Python',    tag: 'python',  desc: 'Custom Python' },
  nullfix: { label: 'Fix nulls', tag: 'prep',    desc: 'Remediate null values' },
};

// A step only earns its place in the card's pipeline chip row once its properties-panel
// form has actually been saved — not the instant it's added via the "+" menu. "Source"
// isn't an action the user configures, so it's always considered saved.
function isStepSaved(s: PipelineStep): boolean {
  switch (s.type) {
    case 'source':  return true;
    case 'filter':  return !!s.filter;
    case 'nullfix': return !!s.nullFix;
    case 'formula': return (s.formulas?.length ?? 0) > 0;
    case 'sql':     return !!s.sql;
    case 'python':  return !!s.pythonCode;
    default:        return true;
  }
}

const OP_ICON: Record<string, React.ReactNode> = {
  source:  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5.5h12M4.5 5.5v6.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  filter:  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1.5 3.5h11L8 8.5v3.5L6 11V8.5L1.5 3.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  agg:     <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 11V3M2 7h4M2 3l2 2M2 11l2-2M8 3h3a1 1 0 010 4h-3M8 7h4a1 1 0 010 4H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  formula: <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
  rename:  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  sort:    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 3h10M2 7h7M2 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><path d="M11 7v5.5M9 10.5l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  union:   <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="9" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  limit:   <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 4h10M2 7h7M2 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  sql:     <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 4l3 3-3 3M7.5 10h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  join:    <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="5" cy="7" r="3" stroke="currentColor" strokeWidth="1.2"/><circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.2"/></svg>,
  nullfix: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2C4.8 5 3.5 7 3.5 9a3.5 3.5 0 007 0c0-2-1.3-4-3.5-7z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
  python:  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 2c-1.1 0-2 .4-2 1v2h4V4H6V3h4c1.1 0 2 .4 2 1v2c0 1.1-.9 2-2 2H6c-1.1 0-2 .9-2 2v2c0 .6.9 1 2 1h4c1.1 0 2-.4 2-1v-2H8v1h2v1H6v-1h4c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2H6c-1.1 0-2-.9-2-2V3c0-.6.9-1 2-1z" stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinejoin="round"/></svg>,
};

const BLOCK_MENU_ACTIONS: { op: OpType; label: string }[] = [
  { op: 'join',    label: 'Join' },
  { op: 'filter',  label: 'Filter' },
  { op: 'formula', label: 'Formula' },
];
const BLOCK_MENU_PREP: { op: OpType; label: string }[] = [
  { op: 'nullfix', label: 'Fix nulls' },
  { op: 'formula', label: 'Change type' },
  { op: 'formula', label: 'Replace value' },
  { op: 'formula', label: 'Text case' },
  { op: 'formula', label: 'Trim' },
];
// Code transforms — SQL/Python written against the card's data (a chip), grouped like "Clean".
const BLOCK_MENU_CODE: { op: OpType; label: string }[] = [
  { op: 'sql',    label: 'SQL' },
  { op: 'python', label: 'Python' },
];

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
  python:  { bg: 'rgba(43,108,176,0.10)', fg: '#2B6CB0' },
};

// ── AI Fix Review data (shown in preview panel when a fix is being reviewed) ──
const AIR_FIX_REVIEW: Record<string, { title: string; rows: { col: string; current: string; proposed: string }[] }> = {
  desc: {
    title: 'Column AI context',
    rows: [
      { col: 'amount',      current: '—', proposed: 'Use SUM for total revenue. Denominator in ROAS calculations.' },
      { col: 'segment',     current: '—', proposed: 'Customer tier. Nulls = unclassified users, not missing data.' },
      { col: 'channel',     current: '—', proposed: 'Marketing channel. Primary slice for ROAS analysis.' },
      { col: 'order_date',  current: '—', proposed: 'Primary time axis. Use for trends and time-series queries.' },
      { col: 'campaign_id', current: '—', proposed: 'Join key to campaigns. Null = organic order, not an error.' },
      { col: 'user_id',     current: '—', proposed: 'Join key to users. Always present, no nulls expected.' },
      { col: 'spend',       current: '—', proposed: 'Denominator in ROAS. Use with SUM; compare against budget.' },
      { col: 'region',      current: '—', proposed: 'Geographic dimension. 5 known values, no nulls.' },
    ],
  },
  synonyms: {
    title: 'Column synonyms',
    rows: [
      { col: 'customer_id', current: '—',             proposed: 'client, account, buyer' },
      { col: 'order_date',  current: 'purchase date', proposed: 'purchase date, transaction date, order placed' },
      { col: 'amount',      current: '—',             proposed: 'sales, income, earnings, GMV' },
    ],
  },
  coldesc: {
    title: 'Column descriptions',
    rows: [
      { col: 'customer_id', current: '—', proposed: 'Unique identifier for each registered customer.' },
      { col: 'order_date',  current: '—', proposed: 'Date the order was placed, normalised to YYYY-MM-DD.' },
      { col: 'amount',      current: '—', proposed: 'Order value in USD at time of purchase.' },
      { col: 'segment',     current: '—', proposed: 'Customer tier (Enterprise, SMB, Mid-market). Null = unclassified.' },
    ],
  },
  indexing: {
    title: 'Enable indexing',
    rows: [
      { col: 'region',   current: 'Off', proposed: 'On' },
      { col: 'segment',  current: 'Off', proposed: 'On' },
      { col: 'channel',  current: 'Off', proposed: 'On' },
      { col: 'status',   current: 'Off', proposed: 'On' },
    ],
  },
  col_types: {
    title: 'Column type corrections',
    rows: [
      { col: 'impressions', current: 'TEXT',   proposed: 'BIGINT (measure)' },
      { col: 'campaign_id', current: 'BIGINT', proposed: 'VARCHAR (attribute)' },
      { col: 'user_id',     current: 'BIGINT', proposed: 'VARCHAR (attribute)' },
    ],
  },
  date_vals: {
    title: 'Date value issues',
    rows: [
      { col: 'order_date', current: 'TEXT — MM/DD/YYYY', proposed: 'DATE — ISO 8601 (YYYY-MM-DD)' },
    ],
  },
};

const AIR_ITEMS = [
  { id: 'desc',      name: 'Column AI context',         detail: 'Missing on 8 of 12 columns — Spotter uses this to know how to apply each field.', sev: 'miss', tag: 'Missing' },
  { id: 'synonyms',  name: 'Column synonyms',           detail: '2 of 12 columns mapped — low coverage reduces search accuracy.',      sev: 'warn', tag: 'Partial' },
  { id: 'coldesc',   name: 'Column descriptions',       detail: '4 of 12 columns described — improves answer quality significantly.', sev: 'warn', tag: 'Partial' },
  { id: 'indexing',  name: 'Enable indexing',           detail: 'Not enabled — Spotter can\'t retrieve attribute values during search.', sev: 'miss', tag: 'Missing' },
  { id: 'col_types', name: 'Column type mismatches',    detail: '3 columns typed incorrectly — aggregations may be applied wrong.',   sev: 'warn', tag: 'Partial' },
  { id: 'date_vals', name: 'Date value issues',         detail: 'order_date uses text format — time filters won\'t work correctly.',  sev: 'miss', tag: 'Missing' },
  { id: 'joins',     name: 'Data relationships',        detail: '3 joins detected — model structure looks good.',                      sev: 'good', tag: 'Good'    },
] as const;
type AirItemId = typeof AIR_ITEMS[number]['id'];
type AirItemState = 'pending' | 'fixing' | 'awaiting' | 'done' | 'oos' | 'manual';

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
const IconChevronRight = ({ color = '#A5ACB9' }: { size?: number; color?: string }) => (
  <Icon name="chevron-right" size="xs" color={color} />
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
// Vision-only tree-row affordances. The POC replaced these with a single explicit
// "+" control (see TreeTableRow's showColumns branch); Vision keeps the original
// hover pair so its data browser is unchanged.
const IconAddToCanvas = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const IconTable = ({ size = 11, color = '#8B96A5' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <rect x="1" y="2" width="10" height="8" rx="1" stroke={color} strokeWidth="1.2"/>
    <path d="M1 5h10M1 8h10M4 5v5M8 5v5" stroke={color} strokeWidth="1"/>
  </svg>
);
// Data-browser source marks — refined to a consistent, muted line style (uniform
// stroke, 16px viewBox, distinctive silhouettes). No Radiant brand logos exist, so
// these stay bespoke but read as one clean set alongside the Radiant structural icons.
// The connector marks now live in components/icons/ConnectorIcons so the agent
// thread's connection list shows the same glyph for the same connection.
const IconCloud      = () => <SalesforceMark />;
const IconFolder     = () => <Icon name="folder" size="xs" color="#8B96A5" />;
const IconDb         = () => <Icon name="database" size="xs" color="#777E8B" />;
const IconSchema     = () => <Icon name="schema" size="xs" color="#A5ACB9" />;
const IconDbt        = () => <DbtMark />;
const IconSnowflake  = () => <SnowflakeMark />;
const IconBigquery   = () => <BigqueryMark />;
const IconDatabricks = () => <DatabricksMark />;

const IconPlus = ({ size = 10, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
    <path d="M6 2v8M2 6h8" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
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

// ── Spotter readiness panel (POC) — the tests a user can run on the model ──────
const SPOTTER_TESTS = [
  { id: 'physical', title: 'Physical schema', lead: 'Structure & data.', rest: 'Tables, joins, columns, formulas etc.' },
  { id: 'semantics', title: 'Semantics', lead: 'Language & meaning.', rest: 'Names, descriptions, AI context etc.' },
  { id: 'answers', title: 'Spotter answers', lead: 'Answers in practice.', rest: 'Rate actual Spotter responses.' },
];

const SpotterReadinessPanel: React.FC<{ onRun: (id: string) => void }> = ({ onRun }) => {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setChecked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <div style={{ padding: `${sp.C}px ${sp.D}px ${sp.A}px`, fontFamily: ff.primary }}>
      <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], letterSpacing: '-0.1px', padding: `${sp.A}px 0 ${sp.C}px` }}>Check for</div>
      {SPOTTER_TESTS.map((t, i) => {
        const isChecked = checked.has(t.id);
        return (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px 0`, borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none' }}>
            <button
              onClick={() => toggle(t.id)}
              title={isChecked ? 'Selected' : 'Select'}
              style={{ width: 16, height: 16, flexShrink: 0, borderRadius: 4, border: `1.5px solid ${isChecked ? c['content-brand'] : c['border-default']}`, background: isChecked ? c['content-brand'] : c['background-base'], cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'border-color 120ms, background 120ms' }}
            >
              {isChecked && <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5l3 3 6-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '20px' }}>{t.title}</div>
              <div style={{ fontSize: fs.xs, lineHeight: '17px', marginTop: 1 }}>
                <span style={{ color: c['content-secondary'] }}>{t.lead}</span> <span style={{ color: c['content-tertiary'] }}>{t.rest}</span>
              </div>
            </div>
            <button
              onClick={() => onRun(t.id)}
              style={{ flexShrink: 0, padding: `6px ${sp.D}px`, borderRadius: RADIUS6, border: 'none', background: c['background-subtle'], color: c['content-primary'], fontSize: fs.xs, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary, transition: 'background 120ms' }}
              onMouseEnter={e => (e.currentTarget.style.background = c['background-sunken'])}
              onMouseLeave={e => (e.currentTarget.style.background = c['background-subtle'])}
            >
              Run
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ── Tree row ──────────────────────────────────────────────────────────────────

// Column type glyph — clean `123` / `Abc` / date affordance (per the metrics-list
// UI inspiration), tinted brand blue.
const ColTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const t = (type || '').toUpperCase();
  if (/DATE|TIME/.test(t)) {
    return (
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ color: '#2770EF' }}>
        <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M2.5 6.5h11M5.5 2.5v2M10.5 2.5v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    );
  }
  const numeric = /INT|FLOAT|NUMBER|DECIMAL|DOUBLE|BIGINT/.test(t);
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color: '#2770EF', fontFamily: "'SF Mono','Fira Mono',monospace", letterSpacing: '0.02em', lineHeight: 1, whiteSpace: 'nowrap' }}>
      {numeric ? '123' : 'Abc'}
    </span>
  );
};

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
  // POC: reveal a chevron that expands the table into its selectable columns.
  showColumns?: boolean;
}> = ({ name, isDbt, onCanvas, onAdd, depthPad = 28, expanded, onToggleExpand, deselectedCols, onToggleCol, showColumns }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: `4px 10px 4px ${depthPad}px`,
          fontSize: 12,
          color: onCanvas ? '#2770EF' : hovered ? '#1D232F' : '#64748B',
          cursor: onCanvas ? 'default' : 'pointer',
          borderRadius: 4, margin: '0 6px',
          background: onCanvas ? 'rgba(39,112,239,0.05)' : hovered ? '#F6F8FA' : 'transparent',
          position: 'relative', transition: 'background 110ms, color 110ms',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={onCanvas ? 'Already on canvas' : 'Add to canvas'}
        onClick={() => { if (!onCanvas) onAdd(name); }}
      >
        <span style={{ color: onCanvas ? '#2770EF' : undefined, flexShrink: 0, display: 'flex' }}>
          {isDbt ? <IconDbt /> : <Icon name="table" size="xs" color="#8B96A5" />}
        </span>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: onCanvas ? 500 : undefined }}>
          {name}
        </span>
        {showColumns ? (
          // Explicit add control: + to add, check once on canvas.
          <button
            onClick={e => { e.stopPropagation(); if (!onCanvas) onAdd(name); }}
            title={onCanvas ? 'Added to canvas' : 'Add table to canvas'}
            style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'transparent', cursor: onCanvas ? 'default' : 'pointer', color: onCanvas ? '#2770EF' : '#8B96A5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 110ms, color 110ms' }}
            onMouseEnter={e => { if (!onCanvas) { e.currentTarget.style.background = 'rgba(39,112,239,0.10)'; e.currentTarget.style.color = '#2770EF'; } }}
            onMouseLeave={e => { if (!onCanvas) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B96A5'; } }}
          >
            {onCanvas
              ? <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
          </button>
        ) : (hovered || onCanvas) && (
          // Vision: original hover pair (info + add), unchanged from pre-POC.
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            {onCanvas ? (
              <div
                title="Already on canvas"
                style={{ width: 22, height: 22, borderRadius: 4, color: '#2770EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            ) : (
              <>
                {/* "Table info" removed — it never had a handler beyond
                    stopPropagation, so hovering and clicking it did nothing. */}
                <button
                  style={{ width: 22, height: 22, border: 'none', background: 'transparent', borderRadius: 4, color: '#777E8B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, transition: 'background 100ms, color 100ms' }}
                  onClick={e => { e.stopPropagation(); onAdd(name); }}
                  title="Add to canvas"
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#EEF2FF'; (e.currentTarget as HTMLElement).style.color = '#2770EF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#777E8B'; }}
                >
                  <IconAddToCanvas />
                </button>
              </>
            )}
          </div>
        )}
      </div>
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
  // POC: render only the children (no header row) — used to drop the redundant
  // connection-level node when the browser is already scoped to one connection.
  bare?: boolean;
}> = ({ id, icon, label, count, muted, depth = 0, open, onToggle, children, bare }) => {
  const pad = 14 + depth * 10;
  if (bare) return <>{children}</>;
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
          <span style={{ fontSize: 10, color: '#A5ACB9', fontWeight: 500 }}>{count}</span>
        )}
        <span style={{ color: '#A5ACB9', transition: 'transform 180ms', transform: open ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>
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
  const [hover, setHover] = useState(false);
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
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={`${join.name} · ${joinLabel} join`}
    >
      {/* Compact join icon on the relationship — click to edit join details */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{
          position: 'relative', width: 34, height: 34, borderRadius: 10, background: '#fff',
          border: `1px solid ${selected ? '#2770EF' : '#D5DAE1'}`,
          boxShadow: selected ? '0 0 0 3px rgba(39,112,239,0.14), 0 1px 4px rgba(25,35,49,0.06)' : (hover ? '0 1px 4px rgba(25,35,49,0.08)' : 'none'),
          transition: 'box-shadow 120ms, border-color 120ms',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="17" height="17" viewBox="0 0 22 22" fill="none">
            <circle cx="9" cy="11" r="4.5" fill={jc.bg} stroke={jc.fg} strokeWidth="1.2"/>
            <circle cx="13" cy="11" r="4.5" fill="none" stroke="#2770EF" strokeWidth="1.2"/>
          </svg>
          {hover && (
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onRemove(); }}
              title="Remove join"
              style={{ position: 'absolute', top: -7, right: -7, width: 16, height: 16, border: 'none', background: '#fff', borderRadius: 4, color: '#777E8B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.14)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E5484D')}
              onMouseLeave={e => (e.currentTarget.style.color = '#777E8B')}
            >
              <IconTrash size={9} />
            </button>
          )}
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1,
          padding: '2px 6px', borderRadius: 99,
          color: selected ? '#2770EF' : '#475569',
          background: selected ? 'rgba(39,112,239,0.10)' : '#F0F2F6',
        }}>{cardinalityLabel}</span>
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
      <div data-block-id={group.id} style={{
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
          <div style={{ width: 20, height: 20, borderRadius: 4, background: isCsv ? 'rgba(22,163,74,0.10)' : '#F6F8FA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isCsv ? '#16A34A' : '#777E8B', flexShrink: 0 }}>
            <IconTable size={11} color={isCsv ? '#16A34A' : '#777E8B'} />
          </div>
          <span style={{ fontSize: 12, fontWeight: fw.semibold, color: '#1D232F', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {group.tableName}
          </span>
          {hasSteps && (
            <span style={{ fontSize: 10, fontWeight: fw.semibold, padding: '1px 6px', background: '#F0F2F6', borderRadius: 99, color: '#777E8B', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {group.steps.length} steps
            </span>
          )}
          {isCsv ? (
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '1px 5px', borderRadius: 3, flexShrink: 0,
              background: 'rgba(22,163,74,0.10)', color: '#06BF7F',
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
              background: 'rgba(140,98,245,0.12)', color: '#8C62F5',
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
              color: '#A5ACB9', cursor: 'pointer', borderRadius: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E5484D')}
            onMouseLeave={e => (e.currentTarget.style.color = '#A5ACB9')}
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
                            color: '#777E8B', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#E5484D')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#777E8B')}
                        >
                          <IconTrash size={9} />
                        </button>
                      )}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: tc.fg }}>
                        {OP_ICON[step.type]}
                        <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{(() => { const nm = step.title?.trim() || m.label; return nm.length > 10 ? nm.slice(0, 10) + '…' : nm; })()}</span>
                      </span>
                    </div>
                    {/* Arrow connector */}
                    {i < group.steps.length - 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', color: '#A5ACB9', flexShrink: 0 }}>
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

// ── Block-flow node (mode === 'blocks'): one action per node, wired by edges ────
const BLOCK_W = 180;
const BLOCK_H = 46;
// BlockNode's card is minWidth: BLOCK_W, maxWidth: CARD_W — an empty/idle card (just
// Source, no transformations) stays at its natural, narrow width; adding chips lets it
// grow wider up to CARD_W, and only past that cap does the chip row wrap onto a new
// line, growing the card's HEIGHT instead of pushing width past the cap.
const CARD_W = 300;

const BlockNode: React.FC<{
  group: CanvasGroup;
  selected: boolean;
  wiring: boolean;
  onSelect: (shift: boolean) => void;
  onMove: (x: number, y: number) => void;
  onRemove: () => void;
  onWireStart: (clientX: number, clientY: number) => void;
  onWireMove?: (clientX: number, clientY: number) => void;
  onWireEnd?: (clientX: number, clientY: number) => void;
  onAction?: (op: OpType, isPrep?: boolean) => void;
  onStepClick?: (index: number) => void;
  onRemoveStep?: (index: number) => void;
  // POC: hides the Clean and Code actions from the node menu.
  poc?: boolean;
}> = ({ group, selected, wiring, onSelect, onMove, onRemove, onWireStart, onWireMove, onWireEnd, onAction, onStepClick, onRemoveStep, poc }) => {
  const step = group.steps[0];
  const meta = OP_META[step.type];
  const tag = OP_TAG_COLORS[meta.tag] || OP_TAG_COLORS.source;
  const name = step.title?.trim() || (step.type === 'source' ? group.tableName : meta.label);
  const isSource = step.type === 'source';
  // A step only earns a chip once its properties-panel form is actually saved — not the
  // instant it's added via the "+" menu. Original indices are kept so onStepClick/
  // onRemoveStep still address the real position in group.steps.
  const visibleSteps = group.steps.map((s, i) => ({ s, i })).filter(({ s }) => isStepSaved(s));
  const hasSteps = visibleSteps.length > 1;
  const lastStep = group.steps[group.steps.length - 1];
  const lastMeta = OP_META[lastStep.type];
  const lastTag = OP_TAG_COLORS[lastMeta.tag] || OP_TAG_COLORS.source;
  const [menuOpen, setMenuOpen] = useState(false);
  const [cleanOpen, setCleanOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [hoveredChip, setHoveredChip] = useState<number | null>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null);
  // Outside-click / Esc close is handled by AnchoredMenu (the menu is portaled).

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    dragRef.current = { px: e.clientX, py: e.clientY, ox: group.x, oy: group.y, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMovePt = (e: React.PointerEvent) => {
    const d = dragRef.current; if (!d) return;
    const dx = e.clientX - d.px, dy = e.clientY - d.py;
    if (!d.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
    d.moved = true; onMove(d.ox + dx, d.oy + dy);
  };
  const onUp = (e: React.PointerEvent) => {
    const d = dragRef.current; dragRef.current = null;
    if (!d?.moved) { e.stopPropagation(); onSelect(e.shiftKey); }
  };

  return (
    <div
      style={{ position: 'absolute', left: group.x, top: group.y, minWidth: BLOCK_W, maxWidth: CARD_W, cursor: 'grab', userSelect: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMovePt}
      onPointerUp={onUp}
      onClick={e => e.stopPropagation()}
    >
      <div data-block-id={group.id} style={{
        position: 'relative', background: '#fff', minWidth: BLOCK_W, maxWidth: CARD_W,
        border: `1.5px solid ${selected ? '#2770EF' : wiring ? '#71A1F4' : '#C0C6CF'}`,
        borderRadius: RADIUS8,
        boxShadow: selected ? '0 0 0 3px rgba(39,112,239,0.14), 0 2px 10px rgba(25,35,49,0.08)' : '0 2px 10px rgba(25,35,49,0.08)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: BLOCK_H, padding: '0 12px' }}>
          <span style={{ width: 20, height: 20, borderRadius: 4, background: isSource ? '#F6F8FA' : lastTag.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isSource ? '#777E8B' : lastTag.fg, flexShrink: 0 }}>
            {isSource ? <IconTable size={11} color="#777E8B" /> : stepIcon(step.type)}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: fw.semibold, color: '#1D232F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        </div>
        {/* Inline pipeline — steps live as chips inside the card, ordered left-to-right,
            wrapping to a new row (growing the card's height) once a row fills up rather
            than growing the card wider. Only saved actions (+ Source) get a chip. */}
        {hasSteps && (
          <div style={{ borderTop: BORDER, padding: '8px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 0' }}>
              {visibleSteps.map(({ s, i }, vi) => {
                const m = OP_META[s.type];
                const tc = OP_TAG_COLORS[m.tag] || OP_TAG_COLORS.source;
                const active = selected && group.activeStep === i;
                const raw = s.title?.trim() || (s.type === 'source' ? 'Source' : m.label);
                const label = raw.length > 20 ? raw.slice(0, 20) + '…' : raw;
                return (
                  <React.Fragment key={i}>
                    <div
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); onStepClick?.(i); }}
                      onMouseEnter={() => setHoveredChip(i)}
                      onMouseLeave={() => setHoveredChip(null)}
                      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 5, background: active ? 'rgba(39,112,239,0.04)' : '#F6F8FA', border: `1px solid ${active ? '#2770EF' : hoveredChip === i ? '#A5ACB9' : '#EAEDF2'}`, borderRadius: RADIUS6, padding: '5px 10px', cursor: 'pointer', flexShrink: 0, color: tc.fg, transition: 'border-color 120ms, background 120ms' }}
                    >
                      {i > 0 && hoveredChip === i && (
                        <button onPointerDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); onRemoveStep?.(i); }} title="Remove step" style={{ position: 'absolute', top: 3, right: 3, width: 14, height: 14, border: 'none', background: '#fff', borderRadius: 3, color: '#777E8B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} onMouseEnter={e => (e.currentTarget.style.color = '#E5484D')} onMouseLeave={e => (e.currentTarget.style.color = '#777E8B')}><IconTrash size={9} /></button>
                      )}
                      <span style={{ display: 'flex', flexShrink: 0 }}>{OP_ICON[s.type]}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</span>
                    </div>
                    {vi < visibleSteps.length - 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', color: '#A5ACB9', flexShrink: 0 }}>
                        <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
        {/* Anchored above vertical-center on purpose — a level join's connector line
            exits near the card's mid-height, so centering here would sit the button
            directly on top of that line. */}
        {onAction && (selected || menuOpen) && (
          <div style={{ position: 'absolute', right: -10, top: BLOCK_H * 0.3, transform: 'translateY(-50%)' }}>
            <button
              ref={menuBtnRef}
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
              title="Actions"
              style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `1px solid ${menuOpen ? '#2770EF' : '#C0C6CF'}`,
                background: menuOpen ? '#EEF2FF' : '#fff',
                color: menuOpen ? '#2770EF' : '#8B96A5',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                boxShadow: '0 1px 3px rgba(25,35,49,0.10)',
                transition: 'background 120ms, border-color 120ms, color 120ms',
              }}
              onMouseEnter={e => { if (!menuOpen) { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#2770EF'; } }}
              onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.borderColor = '#C0C6CF'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#8B96A5'; } }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 3h8M2 6h8M2 9h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
            {menuOpen && (
              <AnchoredMenu
                open={menuOpen}
                anchorRef={menuBtnRef}
                onClose={() => { setMenuOpen(false); setCleanOpen(false); setCodeOpen(false); }}
                placement="right-start"
                style={{ background: '#fff', border: '1px solid #E2E6EC', borderRadius: 8, boxShadow: '0 6px 24px rgba(25,35,49,0.13)', minWidth: 164, padding: '4px 0' }}
              >
                {BLOCK_MENU_ACTIONS.map(({ op, label }) => (
                  <button key={`${op}-${label}`}
                    onClick={() => { setMenuOpen(false); onAction(op); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#1D232F' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: '#64748B', display: 'flex', flexShrink: 0 }}>{OP_ICON[op]}</span>
                    {label}
                  </button>
                ))}
                {/* POC hides Clean + Code — only Join/Filter/Formula + Delete remain */}
                {!poc && (<>
                <div style={{ height: 1, background: '#EAEDF2', margin: '3px 0' }} />
                {/* Clean — single entry; the individual operators live one level down */}
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setCleanOpen(true)}
                  onMouseLeave={() => setCleanOpen(false)}
                >
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', border: 'none', background: cleanOpen ? '#F6F8FA' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#1D232F' }}
                  >
                    <span style={{ color: '#64748B', display: 'flex', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M3.26665 4.13194H10.7333L10.3933 6.26547C10.3752 6.3502 10.3353 6.43034 10.2764 6.49997C10.2176 6.56959 10.1413 6.62692 10.0533 6.66771L8.26664 7.50093C8.15398 7.55241 8.06082 7.63066 7.99819 7.72639C7.93557 7.82213 7.90611 7.93134 7.91331 8.04107L8.29331 13.3909C8.29877 13.4692 8.28557 13.5476 8.25452 13.6214C8.22347 13.6951 8.17523 13.7626 8.11277 13.8197C8.05031 13.8767 7.97496 13.9222 7.89136 13.9532C7.80775 13.9842 7.71766 14.0001 7.62664 14H6.36665C6.27622 14.0001 6.18672 13.9843 6.10358 13.9536C6.02045 13.923 5.94542 13.8781 5.88306 13.8216C5.82069 13.7652 5.7723 13.6984 5.74083 13.6253C5.70936 13.5523 5.69546 13.4745 5.69998 13.3966L6.03331 8.03533C6.04049 7.92773 6.01241 7.82057 5.95229 7.72607C5.89217 7.63157 5.80243 7.55356 5.69332 7.50093L3.95332 6.67921C3.86495 6.63659 3.78901 6.57719 3.73126 6.5055C3.6735 6.43381 3.63545 6.35173 3.61999 6.26547L3.26665 4.13194ZM2.33332 0H4.01999L5.13332 0.826387L6.06665 0H11.6666L10.7333 3.30555H3.26665L2.33332 0Z" fill="currentColor"/></svg>
                    </span>
                    <span style={{ flex: 1 }}>Clean</span>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#A5ACB9' }}><path d="M4.5 2.5l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  {cleanOpen && (
                    <div style={{ position: 'absolute', left: 'calc(100% + 3px)', top: -5, background: '#fff', border: '1px solid #E2E6EC', borderRadius: 8, boxShadow: '0 6px 24px rgba(25,35,49,0.13)', minWidth: 168, zIndex: 310, padding: '4px 0' }}>
                      {BLOCK_MENU_PREP.map(({ op, label }) => (
                        <button key={label}
                          onClick={() => { setMenuOpen(false); setCleanOpen(false); onAction(op, true); }}
                          style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#1D232F' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ height: 1, background: '#EAEDF2', margin: '3px 0' }} />
                {/* Code — SQL / Python as a transform step on this card (a chip) */}
                <div
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setCodeOpen(true)}
                  onMouseLeave={() => setCodeOpen(false)}
                >
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', border: 'none', background: codeOpen ? '#F6F8FA' : 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#1D232F' }}
                  >
                    <span style={{ color: '#64748B', display: 'flex', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M5.5 5L3 8l2.5 3M10.5 5L13 8l-2.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    <span style={{ flex: 1 }}>Code</span>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#A5ACB9' }}><path d="M4.5 2.5l3 3.5-3 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  {codeOpen && (
                    <div style={{ position: 'absolute', left: 'calc(100% + 3px)', top: -5, background: '#fff', border: '1px solid #E2E6EC', borderRadius: 8, boxShadow: '0 6px 24px rgba(25,35,49,0.13)', minWidth: 140, zIndex: 310, padding: '4px 0' }}>
                      {BLOCK_MENU_CODE.map(({ op, label }) => (
                        <button key={label}
                          onClick={() => { setMenuOpen(false); setCodeOpen(false); onAction(op); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#1D232F' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ color: '#64748B', display: 'flex', flexShrink: 0 }}>{OP_ICON[op]}</span>
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                </>)}
                <div style={{ height: 1, background: '#EAEDF2', margin: '3px 0' }} />
                <button
                  onClick={() => { setMenuOpen(false); onRemove(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontSize: 12, fontWeight: 500, color: '#E5484D' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FDF2F2')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ display: 'flex', flexShrink: 0 }}><Icon name="trash-can" size="xs" color="currentColor" /></span>
                  Delete
                </button>
              </AnchoredMenu>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Radiance wash + grain — copied from SpotterXShell so the +Model canvas backdrop
// matches SpotterX exactly. Applied only when the canvas renders its own agent panel
// (+Model flow); the SpotterX embed passes hideAgentPanel and keeps its shell's wash.
const RADIANCE_WASH = [
  'linear-gradient(180deg, rgba(236,199,203,0.50) 0px, rgba(236,199,203,0.22) 140px, rgba(236,199,203,0) 420px)',
  'radial-gradient(900px 500px at 12% 0%, rgba(244,181,178,0.35), transparent 70%)',
  'radial-gradient(700px 480px at 45% 5%, rgba(228,190,214,0.25), transparent 70%)',
  'radial-gradient(640px 420px at 92% 0%, rgba(205,218,246,0.30), transparent 70%)',
].join(', ');
const GRAIN_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

// POC: which connection each browser table belongs to. Adding a table from a
// second connection requires caching first (you can only model across
// connections once the model is cached).
const POC_TABLE_CONN: Record<string, string> = {
  dim_accounts: 'snowflake-prod', support_cases: 'snowflake-prod', call_metrics: 'snowflake-prod', customer_found_defects: 'snowflake-prod',
  pendo_nps_enriched: 'databricks', csm_account_mapping: 'databricks',
};

const ModelCanvas: React.FC<ModelCanvasProps> = ({ onBack, onPublished, mode = 'dataset', initialTables, initialJoins, hideAgentPanel = false, embedHeaderLeft, embedHeaderRight, showTestTab = false, onTestFixWithAI, poc = false }) => {
  const { variant, scope } = useVariant();
  // Demo is the only cut that runs the run-of-show script. Vision stays clean.
  const demo = variant === 'demo';
  // Node-level vs model-level data preview — POC's addition, picked up by Demo.
  // Scoped to the +Model canvas (hideAgentPanel is only true for the SpotterX
  // embed) so SpotterX is unaffected regardless of the active variant.
  const showModelLevelPreview = scope.modelLevelPreview && !hideAgentPanel;
  // Connections the browser actually renders — drives the filter list and its
  // select-all, so the filter can't offer a connection that isn't there.
  const visibleConnIds = scope.nearStoreConnection
    ? ['sf', 'bq', 'gdrive', 'sharepoint', 'agentdb']
    : ['sf', 'bq', 'gdrive', 'sharepoint'];
  const [modelName, setModelName] = useState('Untitled model');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(modelName);
  const [publishOpen, setPublishOpen] = useState(false);
  const [published, setPublished] = useState(false);
  const [dataMode, setDataMode] = useState<'live' | 'cached'>('live');
  // `settings: true` adds the scope + refresh controls (the agent's cross-warehouse
  // hand-off); the other call sites stay a plain confirm.
  const [cacheConfirm, setCacheConfirm] = useState<null | { onConfirm: (settings?: { range: string; refresh: string }) => void; title?: string; body?: string; cancelLabel?: string; settings?: boolean; note?: string }>(null);
  // Cards whose script the agent wrote but nobody has run yet. Their preview is
  // empty until Run — S11's point is that the data arrives because she ran it.
  const [awaitingRunIds, setAwaitingRunIds] = useState<Set<string>>(new Set());
  const [cacheRange, setCacheRange] = useState('Last 6 months');
  const [cacheRefresh, setCacheRefresh] = useState('Daily');
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFull, setPreviewFull] = useState(false);
  const [previewHeight, setPreviewHeight] = useState(224);
  const [previewMode, setPreviewMode] = useState<'data' | 'semantic'>('data');
  const [previewScope, setPreviewScope] = useState<'node' | 'model'>('node');
  const [previewView] = useState<'output' | 'input' | 'both'>('output');
  const [previewLimit, setPreviewLimit] = useState(1000);
  const [colsMenuOpen, setColsMenuOpen] = useState(false);
  const [hiddenPreviewCols, setHiddenPreviewCols] = useState<Set<string>>(new Set());
  // Column-header dropdown (spreadsheet ▾ menu) + view-only sort
  const [previewColMenu, setPreviewColMenu] = useState<{ col: string; x: number; y: number } | null>(null);
  const [previewSort, setPreviewSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);
  // Data-load skeleton — shown for ~3.5s when a table/CSV is added or a code block is run
  const [previewLoading, setPreviewLoading] = useState(false);
  const triggerPreviewLoad = () => { setPreviewLoading(true); setTimeout(() => setPreviewLoading(false), 3500); };
  const [colCleanSub, setColCleanSub] = useState(false); // column ▾ menu — Clean submenu open

  // ── Data tab state — kept independent from the preview panel's equivalents above.
  // The Data tab shows a different dataset (every table on the canvas, merged), so
  // sharing state would cross-contaminate the two views (e.g. sorting in one would
  // silently re-sort the other, a stray column menu could open in the wrong view).
  const [dataSort, setDataSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);
  const [dataColMenu, setDataColMenu] = useState<{ col: string; x: number; y: number } | null>(null);
  const [dataCleanSub, setDataCleanSub] = useState(false);
  const [dataHiddenCols, setDataHiddenCols] = useState<Set<string>>(new Set());
  const [dataLimit, setDataLimit] = useState(1000);
  const dataScrollRef = useRef<HTMLDivElement | null>(null);
  // Value is read straight from the clicked cell's rendered DOM text (not looked
  // up by row index into mergedRows) so it's correct regardless of the grid's own
  // internal sort order or which columns are currently hidden.
  const [dataSelectedCell, setDataSelectedCell] = useState<{ col: string; value: string } | null>(null);

  /**
   * Formula bar (run-of-show S14).
   *
   * Maya defines a weighted metric in the bar — typed or pasted — and on commit
   * the column appears in the sheet: skeleton first while it "computes", then
   * values fill down.
   *
   * `formulaDraft` is what's in the bar. Null means the bar is showing the
   * selected cell's value instead, which is its resting state.
   */
  const [formulaDraft, setFormulaDraft] = useState<string | null>(null);
  const [formulaFocused, setFormulaFocused] = useState(false);
  /** Columns added from the bar, in the order added — appended to the sheet. */
  const [formulaCols, setFormulaCols] = useState<Array<{ name: string; expr: string }>>([]);
  /** Values per formula column. Absent while the column is still computing. */
  const [formulaValues, setFormulaValues] = useState<Record<string, (string | number | null)[]>>({});
  /** The column currently showing its loading skeleton. */
  const [formulaComputing, setFormulaComputing] = useState<string | null>(null);
  /** Surfaced under the bar when a formula can't be parsed or a term didn't match. */
  const [formulaError, setFormulaError] = useState<string | null>(null);
  // Toolbar Filter/Formula on the merged Data sheet need a target table — this holds
  // the pending action while a small "which table?" picker is shown.
  const [dataActionPicker, setDataActionPicker] = useState<'filter' | 'formula' | null>(null);
  const [prepMenuOpen, setPrepMenuOpen] = useState(false);
  const prepMenuRef = useRef<HTMLDivElement>(null);
  const [codeMenuOpen, setCodeMenuOpen] = useState(false);
  const codeMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!prepMenuOpen) return;
    const close = (e: MouseEvent) => { if (prepMenuRef.current && !prepMenuRef.current.contains(e.target as Node)) setPrepMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [prepMenuOpen]);
  useEffect(() => {
    if (!codeMenuOpen) return;
    const close = (e: MouseEvent) => { if (codeMenuRef.current && !codeMenuRef.current.contains(e.target as Node)) setCodeMenuOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [codeMenuOpen]);
  // Escape should stay inside the model canvas — the Playground wrapper otherwise
  // navigates back to the registry on Escape, which is jarring mid-edit. Swallow it
  // in the capture phase so the wrapper's document-level listener never fires.
  useEffect(() => {
    const swallowEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') e.stopImmediatePropagation(); };
    document.addEventListener('keydown', swallowEscape, true);
    return () => document.removeEventListener('keydown', swallowEscape, true);
  }, []);
  const [activeBrowserTab, setActiveBrowserTab] = useState<'warehouse' | 'business' | 'external'>('warehouse');
  const [addDataOpen, setAddDataOpen] = useState(false);
  const [toolbarAddOpen, setToolbarAddOpen] = useState(false);
  const [browserAddOpen, setBrowserAddOpen] = useState(false);
  const [emptyAddOpen, setEmptyAddOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterConns, setFilterConns] = useState(new Set(visibleConnIds));
  const [groups, setGroups] = useState<CanvasGroup[]>([]);
  const [wiring, setWiring] = useState<{ fromId: string; cx: number; cy: number; overId: string | null } | null>(null);
  const wireTargetRef = useRef<string | null>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  // Measured card boxes for the join-connector layer. Reading offsetWidth/offsetHeight
  // directly during render always reflects the PREVIOUS commit — a card that just grew
  // (e.g. a step chip row appeared) would leave the connector anchored to its old,
  // shorter height for one frame and, if nothing else re-renders, forever. Re-measuring
  // in useLayoutEffect (after the DOM updates, before the browser paints) keeps it correct.
  const [cardSizes, setCardSizes] = useState<Record<string, { w: number; h: number }>>({});
  const prevCardSizesRef = useRef<Record<string, { w: number; h: number }>>({});
  useLayoutEffect(() => {
    const next: Record<string, { w: number; h: number }> = {};
    groups.forEach(g => {
      const el = canvasAreaRef.current?.querySelector(`[data-block-id="${g.id}"]`) as HTMLElement | null;
      if (el) next[g.id] = { w: el.offsetWidth, h: el.offsetHeight };
    });
    setCardSizes(next);

    // Block-flow mode only (BlockNode) — CanvasNodeCard/SpotterX is untouched.
    // When a card's measured box GREW since the last pass (a transformation chip
    // was saved, wrapping onto a new row), nudge any neighbor it now overlaps just
    // far enough to clear it, along whichever axis needs the smaller push. Only
    // genuine growth triggers a push — dragging a card near another (position-only
    // change) never does. Single-pass: doesn't chase secondary collisions caused
    // by the push itself, which is the deliberately simple version of this.
    if (mode !== 'dataset') {
      const prev = prevCardSizesRef.current;
      const grown = groups.filter(g => {
        const p = prev[g.id], n = next[g.id];
        return p && n && (n.w > p.w || n.h > p.h);
      });
      if (grown.length > 0) {
        const GAP = 24;
        const deltas: Record<string, { dx: number; dy: number }> = {};
        grown.forEach(g => {
          const gs = next[g.id]; if (!gs) return;
          const gBox = { left: g.x, top: g.y, right: g.x + gs.w, bottom: g.y + gs.h };
          groups.forEach(c => {
            if (c.id === g.id) return;
            const cs = next[c.id]; if (!cs) return;
            const d = deltas[c.id] ?? { dx: 0, dy: 0 };
            const cBox = { left: c.x + d.dx, top: c.y + d.dy, right: c.x + d.dx + cs.w, bottom: c.y + d.dy + cs.h };
            const overlapX = Math.min(gBox.right, cBox.right) - Math.max(gBox.left, cBox.left);
            const overlapY = Math.min(gBox.bottom, cBox.bottom) - Math.max(gBox.top, cBox.top);
            if (overlapX <= 0 || overlapY <= 0) return;
            const gCx = (gBox.left + gBox.right) / 2, gCy = (gBox.top + gBox.bottom) / 2;
            const cCx = (cBox.left + cBox.right) / 2, cCy = (cBox.top + cBox.bottom) / 2;
            if (overlapX < overlapY) {
              const dir = cCx >= gCx ? 1 : -1;
              deltas[c.id] = { dx: d.dx + dir * (overlapX + GAP), dy: d.dy };
            } else {
              const dir = cCy >= gCy ? 1 : -1;
              deltas[c.id] = { dx: d.dx, dy: d.dy + dir * (overlapY + GAP) };
            }
          });
        });
        if (Object.keys(deltas).length > 0) {
          setGroups(prevGroups => prevGroups.map(gr => {
            const d = deltas[gr.id];
            return d ? { ...gr, x: gr.x + d.dx, y: gr.y + d.dy } : gr;
          }));
        }
      }
    }
    prevCardSizesRef.current = next;
  }, [groups, mode]);
  // Canvas pan offset — shifts the node+edge layer so the selected node stays centered
  // in the visible canvas area when the properties panel opens.
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Option 2 (blocks) and Option 3 (dataset2) both use the block-flow engine:
  // each action is its own node wired by edges. Option 1 (dataset) keeps stacked steps.
  const isBlockMode = mode !== 'dataset';
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const nodeCountRef = useRef(0);

  // Derived: primary selected (single) and selectedGroup
  const selectedId: string | null = selectedIds.size === 1 ? [...selectedIds][0] : null;

  // +Model flow: connection + database + first schema all start open, so tables are
  // immediately visible for quick selection on "New model" — no extra clicks to drill
  // in. SpotterX embed (hideAgentPanel) keeps its original collapsed-schema default.
  const [expanded, setExpanded] = useState(new Set(
    hideAgentPanel ? ['sf', 'sf-analytics'] : ['sf', 'sf-analytics', 'sf-public']
  ));

  const [expandedTableRows, setExpandedTableRows] = useState<Set<string>>(new Set());
  // Which connection subtrees show — driven by the connection filter.
  const showConn = (id: string) => filterConns.has(id);
  const [deselectedCols, setDeselectedCols] = useState<Record<string, Set<string>>>({});

  const [multiJoinActive, setMultiJoinActive] = useState(false);
  const [multiJoinTable1, setMultiJoinTable1] = useState('');
  const [singleJoinActive, setSingleJoinActive] = useState(false);
  const [editingJoinId, setEditingJoinId] = useState<string | null>(null);
  // Shared "which step is currently in its editable form" state for the properties
  // panel's summary/edit pattern (mirrors editingJoinId, applied uniformly across
  // filter/nullfix/formula/sql/python). Key = `${groupId}_${stepIndex}`.
  const [editingStepKey, setEditingStepKey] = useState<string | null>(null);
  const stepKey = (groupId: string, stepIndex: number) => `${groupId}_${stepIndex}`;
  // Panel-header title — click-to-rename (same pattern as the topbar model name).
  // Defaults to displaying the action name (e.g. "Filter") when no custom title is
  // set, matching Join's plain-text header instead of a generic "Untitled block".
  const [editingTitleFor, setEditingTitleFor] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [canvasJoins, setCanvasJoins] = useState<CanvasJoin[]>([]);
  const joinCountRef = useRef(0);
  // Derive edges: directional data-flow arrows from a source card → a SQL-derived card
  // (drawn when the SQL cell is run and its @-referenced tables resolve). Distinct from joins.
  const [deriveEdges, setDeriveEdges] = useState<{ fromId: string; toId: string }[]>([]);
  // @-mention table picker inside the SQL editor.
  const [sqlAtOpen, setSqlAtOpen] = useState(false);
  const [sqlAtQuery, setSqlAtQuery] = useState('');
  const [sqlAtPoint, setSqlAtPoint] = useState<{ x: number; y: number; height: number } | null>(null);
  const sqlEditorRef = useRef<HTMLDivElement>(null);
  const [highlightedCol, setHighlightedCol] = useState<string | null>(null);
  // Values for columns produced by a code transform (e.g. Python sentiment), keyed by column name → per-row values.
  const [derivedCols, setDerivedCols] = useState<Record<string, (string | number | null)[]>>({});
  const previewScrollRef = useRef<HTMLDivElement | null>(null);

  const [agentWidth, setAgentWidth] = useState(420);
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

  const [sqlConfig, setSqlConfig] = useState({
    sql: '',
    aiActive: false,
    aiDesc: '',
    aiGenerating: false,
    applied: false,
  });

  const [pythonConfig, setPythonConfig] = useState({
    colName: '',
    colNameTouched: false,
    code: '',
    aiActive: false,
    aiDesc: '',
    aiGenerating: false,
    pyVersion: '3.11',
    ran: false,
    error: null as string | null,
    fixing: false,
    apiData: false,
  });
  // A code step is always an editor — there's no read-only rendering of SQL or
  // Python — so the shared editor config has to follow whichever code step is
  // selected. That's what the old "Edit code" / "Edit query" buttons did on click.
  const loadedCodeStepRef = useRef<string | null>(null);

  // Agentic "Fix with AI": after the agent pastes the fix + reruns, show Accept/Reject below the
  // code. Reject restores the stashed pre-fix code + error state.
  const [pythonFixReview, setPythonFixReview] = useState(false);
  const pythonFixStashRef = useRef<{ groupId: string; activeStep: number; tableName: string; cols: [string, string][]; code: string; error: string | null } | null>(null);

  const [nullFixConfig, setNullFixConfig] = useState<{
    column: string;
    aiActive: boolean;
    aiDesc: string;
    aiGenerating: boolean;
    value: string;
    applied: boolean;
  }>({ column: '', aiActive: false, aiDesc: '', aiGenerating: false, value: '', applied: false });
  const [filterConfig, setFilterConfig] = useState<{ name: string; column: string; operator: string; value: string; applied: boolean }>({ name: '', column: '', operator: '=', value: '', applied: false });

  // ── AI Readiness Pill ──────────────────────────────────────────────────────
  const [airOpen, setAirOpen] = useState(false);
  const [airPillTooltip, setAirPillTooltip] = useState(false);
  const [airDropView, setAirDropView] = useState<'intro' | 'results'>('intro');
  const [airItemStates, setAirItemStates] = useState<Record<AirItemId, AirItemState>>({} as Record<AirItemId, AirItemState>);
  const [airTuneRecsCount, setAirTuneRecsCount] = useState<number | null>(null);
  const [airFixReview, setAirFixReview] = useState<string | null>(null);
  const [airAccepted, setAirAccepted] = useState<Record<string, Record<string, string>>>({});
  const [airIgnoredIds, setAirIgnoredIds] = useState<Set<string>>(new Set());
  const airPillRef = useRef<HTMLDivElement>(null);
  // Anchor refs for auto-positioned dropdowns (see AnchoredMenu).
  const dataModeBtnRef = useRef<HTMLButtonElement>(null);
  const browserAddBtnRef = useRef<HTMLButtonElement>(null);

  // ── Canvas / Columns view switcher ───────────────────────────────────────────
  const [viewMode, setViewMode] = useState<'canvas' | 'columns' | 'data' | 'test'>('canvas');
  const [colEdits, setColEdits] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [indexedCols, setIndexedCols] = useState<Set<string>>(new Set());
  // Columns tab. `removedModelCols` = columns taken out of the model (they leave the
  // table and become available again under "Add column"). `selectedModelCols` = the
  // rows currently ticked for a bulk Remove. Both keyed `${table}__${col}`.
  const [removedModelCols, setRemovedModelCols] = useState<Set<string>>(new Set());
  const [selectedModelCols, setSelectedModelCols] = useState<Set<string>>(new Set());
  const [addColMenuOpen, setAddColMenuOpen] = useState(false);
  // Model-level formulas: calculated columns that belong to the whole model rather
  // than one source table's transform step. Shown as their own rows in the Columns tab.
  const [modelFormulas, setModelFormulas] = useState<{ id: string; name: string; expr: string }[]>([]);
  const [formulaModalOpen, setFormulaModalOpen] = useState(false);
  const [modelFormulaDraft, setModelFormulaDraft] = useState<{ id: string | null; name: string; expr: string }>({ id: null, name: '', expr: '' });

  // Fixes always show in the Columns view. Auto-switch if currently on Canvas.
  (window as any).__airShowFixReview__ = (checkId: string) => {
    setAirFixReview(checkId);
    setViewMode('columns');
  };
  (window as any).__airSetIgnored__ = (checkId: string, ignored: boolean) =>
    setAirIgnoredIds(prev => {
      const next = new Set(prev);
      if (ignored) next.add(checkId); else next.delete(checkId);
      return next;
    });
  const hasTable = groups.length > 0;

  const airGetState = (id: AirItemId): AirItemState => airItemStates[id] ?? 'pending';
  const airPassCount = AIR_ITEMS.filter(it => airGetState(it.id) === 'done' || it.sev === 'good').length;
  const airPendingCount = AIR_ITEMS.filter(it => it.sev !== 'good' && airGetState(it.id) !== 'done' && !airIgnoredIds.has(it.id)).length;
  const airPct = Math.round((airPassCount / AIR_ITEMS.length) * 100);
  const airColor = airPct <= 30 ? '#E22B3D' : airPct <= 65 ? '#FCC838' : '#06BF7F';
  const airSubText = `${airPassCount} of ${AIR_ITEMS.length} checks passed${airPassCount < AIR_ITEMS.length ? ' — fix the items below to progress.' : ' — ready to tune!'}`;
  const airPillLabel = poc
    ? 'Spotter readiness'
    : airDropView === 'intro'
    ? 'AI readiness'
    : airPendingCount > 0
      ? `${airPendingCount} improvement${airPendingCount === 1 ? '' : 's'} pending`
      : airTuneRecsCount === null
        ? 'Needs tuning'
        : airTuneRecsCount > 0
          ? `${airTuneRecsCount} tuning fix${airTuneRecsCount === 1 ? '' : 'es'}`
          : 'Spotter ready';
  const airPillDotColor = airDropView === 'intro'
    ? '#A5ACB9'
    : airPendingCount > 0
      ? '#FCC838'
      : airTuneRecsCount === null
        ? '#06BF7F'
        : airTuneRecsCount > 0
          ? '#FCC838'
          : '#06BF7F';

  // ── Publish modal rows — derived, not hardcoded ─────────────────────────────
  // These used to read "Snowflake" and "weekly refresh" whatever was on the
  // canvas, which contradicts the model by the time you publish it: the demo
  // spans four sources and caches daily.
  // Grouped by connection, so the modal names the actual tables rather than
  // running four source names into one wrapping line.
  const publishSourceGroups = (() => {
    const bySource = new Map<string, string[]>();
    groups.forEach(g => {
      const source = g.sourceKind === 'csv' ? 'CSV upload'
        : CONNECTION_BY_TABLE[g.tableName]
          ?? (g.steps.some(st => st.type === 'python') ? 'Python script' : 'Warehouse');
      const list = bySource.get(source) ?? [];
      if (!list.includes(g.tableName)) list.push(g.tableName);
      bySource.set(source, list);
    });
    return [...bySource.entries()].map(([source, tables]) => ({ source, tables }));
  })();
  const publishCache = dataMode === 'cached'
    ? `Yes · ${cacheRefresh.toLowerCase()} refresh, ${cacheRange.toLowerCase()}`
    : 'No · live queries';
  const publishStatus = airDropView === 'intro'
    ? { value: 'Readiness not checked', color: '#777E8B', check: false }
    : airPendingCount > 0
      ? { value: `${airPendingCount} improvement${airPendingCount === 1 ? '' : 's'} pending`, color: '#FCC838', check: false }
      : airTuneRecsCount === null
        ? { value: 'Needs tuning', color: '#FCC838', check: false }
        : airTuneRecsCount > 0
          ? { value: `${airTuneRecsCount} tuning fix${airTuneRecsCount === 1 ? '' : 'es'}`, color: '#FCC838', check: false }
          : { value: 'Spotter ready', color: '#06BF7F', check: true };

  const airRunScan = () => {
    if (agentCollapsed) setAgentCollapsed(false);
    (window as any).__airRunScan__ = airRunScan;
    (window as any).__airApplyFix__ = (checkId: string) => {
      const saveAccepted = (ids: string[]) => {
        setAirAccepted(prev => {
          const next = { ...prev };
          ids.forEach(id => {
            next[id] = Object.fromEntries((AIR_FIX_REVIEW[id]?.rows ?? []).map(r => [r.col, r.proposed]));
          });
          return next;
        });
      };
      if (checkId === '__all__') {
        saveAccepted(Object.keys(AIR_FIX_REVIEW));
        setAirItemStates(prev => {
          const next = { ...prev } as Record<AirItemId, AirItemState>;
          AIR_ITEMS.forEach(item => { if (item.sev !== 'good') next[item.id] = 'done'; });
          return next;
        });
      } else {
        saveAccepted([checkId]);
        setAirItemStates(prev => ({ ...prev, [checkId]: 'done' } as Record<AirItemId, AirItemState>));
      }
      setAirFixReview(null);
    };
    // Clear any previous air readiness conversation
    setAgentMessages(prev => prev.filter(m => !m.id.startsWith('air-')));

    const ts = Date.now();

    // User trigger message
    setAgentMessages(prev => [...prev, {
      id: `air-user-${ts}`,
      type: 'user' as const,
      content: 'Check for AI readiness',
    }]);

    // Working message — one reasoning step per check
    const workingId = `air-work-${ts}`;
    setAgentMessages(prev => [...prev, {
      id: workingId,
      type: 'working' as const,
      content: '',
      stepsCollapsed: false,
      allStepsVisible: true,
      // Three layers checking in sequence (S15) — each carries its own check
      // count and cost, so the heavy warehouse scan reads as heavier than the
      // instant metadata pass rather than all steps looking alike.
      steps: PILLARS.map(p => ({
        label: `${p.name} — ${p.tagline.toLowerCase()}`,
        detail: `${p.checkCount} checks · ${p.costLabel}`,
        status: 'pending' as const,
      })),
    }]);

    // Animate each step: pending → running → done
    PILLARS.forEach((_, idx) => {
      setTimeout(() => {
        setAgentMessages(prev => prev.map(m =>
          m.id !== workingId || !m.steps ? m : {
            ...m,
            steps: m.steps!.map((s, i) => i === idx ? { ...s, status: 'running' as const } : s),
          }
        ));
        setTimeout(() => {
          setAgentMessages(prev => prev.map(m =>
            m.id !== workingId || !m.steps ? m : {
              ...m,
              steps: m.steps!.map((s, i) => i === idx ? { ...s, status: 'done' as const } : s),
            }
          ));
        }, 300);
      }, idx * 320);
    });

    // After all steps complete: collapse steps, transition dropdown, add diagnostics card
    const totalMs = PILLARS.length * 320 + 450;
    setTimeout(() => {
      setAirDropView('results');
      const findings = READINESS_ISSUES.filter(it => it.sev !== 'good');
      const highCount = findings.filter(f => f.severity === 'high').length;
      const pillarBreakdown = PILLARS
        .map(p => ({ p, n: issuesForPillar(p.id).filter(i => i.sev !== 'good').length }))
        .filter(x => x.n > 0)
        .map(x => `${x.n} ${x.p.name.toLowerCase()}`)
        .join(', ');
      const summaryText = findings.length === 0
        ? 'All checks passed — this model is ready for Spotter.'
        : `${findings.length} findings — ${pillarBreakdown}. ${highCount} would cause wrong answers, not just weaker ones.`;
      setAgentMessages(prev => prev.map(m =>
        m.id !== workingId ? m : { ...m, stepsCollapsed: true }
      ));
      setAgentMessages(prev => [...prev, {
        id: `air-resp-${Date.now()}`,
        type: 'response' as const,
        content: summaryText,
        genUI: 'air_readiness',
        // `name` carries the instance-level title ("Jira tickets fan out against
        // accounts"), not the category — S16 wants named findings, and the card
        // already renders name + detail, so no card change is needed.
        genUIResult: JSON.stringify(READINESS_ISSUES.map(item => ({
          id: item.id, name: item.title, sev: item.sev, detail: item.detail,
        }))),
      }]);
    }, totalMs);
  };

  const airStartTuning = () => {
    setAirOpen(false);
    if (agentCollapsed) setAgentCollapsed(false);
    (window as any).__airTuneComplete__ = (recCount: number) => setAirTuneRecsCount(recCount);
    const ts = Date.now();
    setAgentMessages(prev => [...prev, { id: `tune-user-${ts}`, type: 'user' as const, content: 'Tune model with sample questions' }]);
    const workingId = `tune-work-${ts}`;
    const tuneSteps = ['Generating sample questions', 'Simulating Spotter answers', 'Preparing evaluation'];
    setAgentMessages(prev => [...prev, {
      id: workingId, type: 'working' as const, content: '',
      stepsCollapsed: false, allStepsVisible: true,
      steps: tuneSteps.map(label => ({ label, status: 'pending' as const })),
    }]);
    tuneSteps.forEach((_, idx) => {
      setTimeout(() => {
        setAgentMessages(prev => prev.map(m =>
          m.id !== workingId || !m.steps ? m : { ...m, steps: m.steps!.map((s, i) => i === idx ? { ...s, status: 'running' as const } : s) }
        ));
        setTimeout(() => {
          setAgentMessages(prev => prev.map(m =>
            m.id !== workingId || !m.steps ? m : { ...m, steps: m.steps!.map((s, i) => i === idx ? { ...s, status: 'done' as const } : s) }
          ));
        }, 280);
      }, idx * 320);
    });
    const totalMs = tuneSteps.length * 320 + 450;
    setTimeout(() => {
      setAgentMessages(prev => prev.map(m => m.id !== workingId ? m : { ...m, stepsCollapsed: true }));
      setAgentMessages(prev => [...prev, {
        id: `tune-resp-${Date.now()}`, type: 'response' as const,
        content: 'I simulated Spotter answers for your 3 sample questions. Rate each one — mark it correct, incorrect (with a reason), or out of scope.',
        genUI: 'air_tune_eval', genUIResult: 'ready',
      }]);
    }, totalMs);
  };

  // Outside-click / Esc close is handled by AnchoredMenu (the dropdown is portaled).


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

  // Load the selected code step's saved code into the editor config, once per step.
  // Keyed on step identity, so it never clobbers an edit in progress or a run result.
  useEffect(() => {
    const g = groups.find(gg => gg.id === selectedId);
    const st = g?.steps[g.activeStep];
    if (!g || !st || (st.type !== 'python' && st.type !== 'sql')) { loadedCodeStepRef.current = null; return; }
    const key = stepKey(g.id, g.activeStep);
    if (loadedCodeStepRef.current === key) return;
    loadedCodeStepRef.current = key;
    if (st.type === 'python' && st.pythonCode) {
      setPythonConfig(p => ({ ...p, code: st.pythonCode ?? '', ran: !awaitingRunIds.has(g.id), error: null }));
    }
    if (st.type === 'sql' && st.sql) {
      setSqlConfig(s => ({ ...s, sql: st.sql ?? '', applied: true }));
    }
  }, [groups, selectedId, awaitingRunIds]);

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

  /**
   * `select: false` adds the card without selecting it or opening the preview —
   * used when the agent commits several tables at once, so the canvas fills up
   * and the user chooses which one to look at, rather than the last table
   * silently winning and forcing the preview open.
   */
  const addToCanvas = useCallback((
    tableName: string,
    sourceKind: 'warehouse' | 'csv' = 'warehouse',
    fileName?: string,
    opts: { select?: boolean } = {},
  ) => {
    const { select = true } = opts;
    const doAdd = () => {
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
      if (select) {
        setSelectedIds(new Set([id]));
        setPreviewOpen(true);
        triggerPreviewLoad();
      }
      if (TABLE_COLS[tableName]) {
        setExpandedTableRows(prev => new Set([...prev, tableName]));
      }
    };
    // POC: modeling across connections requires caching. If this table comes from
    // a different connection than what's already on the canvas (and we're still
    // live), confirm caching first — accepting caches the model, then adds.
    if (poc && sourceKind === 'warehouse' && dataMode !== 'cached') {
      const newConn = POC_TABLE_CONN[tableName];
      const existingConns = new Set(groups.map(g => POC_TABLE_CONN[g.tableName]).filter(Boolean));
      if (newConn && existingConns.size > 0 && !existingConns.has(newConn)) {
        setCacheConfirm({
          title: 'Caching required to combine connections',
          body: 'This table is from a different connection. To model across connections, the model must be cached into ThoughtSpot’s data store. It will run on cached data, refreshed on a schedule.',
          cancelLabel: 'Cancel',
          onConfirm: () => { setDataMode('cached'); doAdd(); setCacheConfirm(null); },
        });
        return;
      }
    }
    doAdd();
  }, [poc, dataMode, groups]);

  /**
   * Agent → canvas commit seam (run-of-show S3/S4/S5).
   *
   * The agent proposes tables in the thread; the user ticks the ones they want
   * and clicks Add. This is what runs on that click — each accepted table lands
   * as a normal canvas card, identical to one added by hand.
   *
   * Deliberately built on addToCanvas rather than a parallel path, so agent-added
   * cards inherit the same ids, positions, selection, preview and caching gate.
   * Appends — it never replaces the canvas, unlike the initialTables seeder.
   *
   * Tables already on the canvas are skipped, so re-accepting is harmless.
   */
  const agentAddTables = useCallback((tableNames: string[]) => {
    const present = new Set(groups.map(g => g.tableName));
    tableNames
      .filter(name => !present.has(name))
      // Only tables the canvas can actually render — TABLE_COLS is the catalogue.
      .filter(name => Boolean(TABLE_COLS[name]))
      .forEach(name => addToCanvas(name, 'warehouse', undefined, { select: false }));
  }, [groups, addToCanvas]);

  /**
   * Commit a formula typed or pasted into the formula bar (S14).
   *
   * Expects `Name = expression`. The column lands immediately with a skeleton,
   * then values fill in — computing rather than faking them where the terms
   * resolve to real columns.
   *
   * Term matching is deliberately forgiving, the same way the SQL block's
   * @-references are: the script writes business names ("Usage Decline 90d")
   * that don't match column names ("usage_delta_90d") character for character.
   * Anything unresolved contributes 0 and is reported back, rather than the
   * whole formula silently producing nonsense.
   */
  const commitFormula = useCallback((raw: string, cols: [string, string][], rows: Row[]) => {
    const eq = raw.indexOf('=');
    if (eq < 0) return { ok: false as const, reason: 'Needs a name — try "Renewal Risk = …"' };
    const name = raw.slice(0, eq).trim();
    const expr = raw.slice(eq + 1).trim();
    if (!name || !expr) return { ok: false as const, reason: 'Needs both a name and an expression' };

    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const toks = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const entries = cols.map((c, i) => ({ i, n: norm(c[0]), t: toks(c[0]) }));

    const resolve = (term: string): number | null => {
      const n = norm(term);
      const exact = entries.find(e => e.n === n);
      if (exact) return exact.i;
      const sub = entries.find(e => e.n.includes(n) || n.includes(e.n));
      if (sub) return sub.i;
      // Token overlap. Substring matching isn't enough: the script writes
      // "Usage Decline 90d" for usage_delta_90d — no shared substring, but two
      // of three tokens match. Threshold is low enough for "QBR Sentiment Drop"
      // → sentiment_delta and high enough that unrelated terms stay unresolved.
      const tt = toks(term);
      let best: number | null = null;
      let bestScore = 0;
      for (const e of entries) {
        const shared = e.t.filter(x => tt.includes(x)).length;
        if (!shared) continue;
        const score = shared / Math.max(e.t.length, tt.length);
        if (score > bestScore) { bestScore = score; best = e.i; }
      }
      return bestScore >= 0.34 ? best : null;
    };

    // Replace each non-numeric term with the row's value, then evaluate the
    // arithmetic. × is the script's multiplication sign.
    const unresolved = new Set<string>();
    const values = rows.map(row => {
      const substituted = expr.replace(/[A-Za-z][A-Za-z0-9_]*(?:\s+[A-Za-z0-9_]+)*/g, term => {
        const i = resolve(term);
        if (i === null) { unresolved.add(term.trim()); return '0'; }
        const v = Number(row[i]);
        return Number.isFinite(v) ? String(v) : '0';
      }).replace(/×/g, '*');
      try {
        // eslint-disable-next-line no-new-func
        const out = Function(`"use strict";return (${substituted})`)();
        return Number.isFinite(out) ? Math.round(out * 100) / 100 : null;
      } catch { return null; }
    });

    setFormulaCols(prev => prev.some(f => f.name === name) ? prev : [...prev, { name, expr }]);
    setFormulaComputing(name);
    setFormulaValues(prev => { const next = { ...prev }; delete next[name]; return next; });
    // Skeleton first, then the values land.
    window.setTimeout(() => {
      setFormulaValues(prev => ({ ...prev, [name]: values }));
      setFormulaComputing(cur => (cur === name ? null : cur));
    }, 1100);

    return { ok: true as const, name, unresolved: [...unresolved] };
  }, []);

  /**
   * Agent-written Python source (run-of-show S10).
   *
   * Lands a card whose source step carries the script the agent wrote, so the
   * user can open it in the properties panel, edit the filter and re-run —
   * which is the point of S11. Selects it and opens the panel so Review lands
   * the user directly in the code.
   */
  const agentAddPythonSource = useCallback((tableName: string, code: string, openForReview: boolean) => {
    if (!TABLE_COLS[tableName]) return;
    const i = nodeCountRef.current % NODE_POSITIONS.length;
    nodeCountRef.current++;
    const pos = NODE_POSITIONS[i];
    const id = `ng_${nodeCountRef.current}`;
    // Two steps, not one: a source step so the card reads as the table it
    // produces, plus a python step carrying the script as a chip. A single
    // python step makes the canvas render it as an operation node labelled
    // "Python" — right for a transform, wrong for "the fourth table lands".
    setGroups(prev => [...prev, {
      id, tableName, sourceKind: 'warehouse' as const,
      steps: [
        { type: 'source' as OpType, label: tableName, desc: 'Fetched via script', cols: TABLE_COLS[tableName] },
        { type: 'python' as OpType, label: 'Fetch script', desc: 'Written by the agent', cols: TABLE_COLS[tableName], pythonCode: code },
      ],
      x: pos.x + (nodeCountRef.current > NODE_POSITIONS.length ? Math.floor(nodeCountRef.current / NODE_POSITIONS.length) * 30 : 0),
      y: pos.y, expanded: false, activeStep: 1,
    }]);
    setSelectedIds(new Set([id]));
    // An unrun script has no rows, so the preview stays collapsed — running it is
    // what opens the panel and fills it. Landing it run (the "Run as-is" path)
    // opens the preview straight away.
    if (openForReview) {
      setPreviewOpen(false);
    } else {
      setPreviewOpen(true);
      triggerPreviewLoad();
    }
    // Review lands the user in the code itself, not just the panel — and lands it
    // *unrun*, so Run is the obvious next action and the block reads "Not run yet".
    if (openForReview) {
      setPythonConfig(p => ({ ...p, code, ran: false, error: null }));
      setEditingStepKey(stepKey(id, 1));
      setAwaitingRunIds(prev => new Set([...prev, id]));
    }
  }, []);

  /**
   * Agent → canvas join commit (run-of-show S7).
   *
   * Mirrors agentAddTables: appends, skips anything already joined, and drops
   * proposals whose tables aren't on the canvas — a join edge needs both ends.
   * Resolves table1Id by name the same way the initialJoins seeder does.
   */
  /**
   * Tidy the canvas into a layered graph.
   *
   * Cards land wherever the next free slot in NODE_POSITIONS happens to be, which
   * is fine for one or two but reads as chaos once five tables are joined to one
   * hub. This lays them out left-to-right by distance from the most-connected
   * table: the hub in the first column, everything joined to it in the second,
   * anything joined to those in the third, unconnected cards in a column of
   * their own at the end. Each column is centred vertically against the tallest.
   *
   * Called after joins are created, not on every change — dragging a card should
   * stay put.
   */
  /**
   * Join geometry — one orthogonal line per join, routed through the gutter.
   *
   * Each join used to draw as *two* curves meeting a floating badge, so five
   * joins into one hub meant ten swooping beziers and five nodes adrift in the
   * middle of the canvas. Now: leave the left card horizontally, one vertical run
   * in the empty gutter between columns, enter the right card horizontally — the
   * shape an ERD uses, because it reads.
   *
   * Two anti-overlap rules: joins sharing a gutter each get their own vertical
   * channel, and joins leaving the same card exit at different heights along its
   * edge. The badge rides the midpoint of the vertical run unless it's been
   * dragged, in which case the user's position wins.
   */
  const joinGeometry = React.useMemo(() => {
    const rectOf = (g: CanvasGroup) => {
      const m = cardSizes[g.id];
      return { left: g.x, top: g.y, width: m?.w ?? BLOCK_W, height: m?.h ?? BLOCK_H };
    };
    const resolved = canvasJoins.map(j => {
      const a = groups.find(g => g.id === j.table1Id);
      const b = groups.find(g => g.tableName === j.table2Name);
      return a && b ? { j, a, b } : null;
    }).filter(Boolean) as { j: CanvasJoin; a: CanvasGroup; b: CanvasGroup }[];

    // How many joins leave each card, so their exit points can be spread out.
    const exitCount = new Map<string, number>();
    resolved.forEach(({ a, b }) => {
      exitCount.set(a.id, (exitCount.get(a.id) ?? 0) + 1);
      exitCount.set(b.id, (exitCount.get(b.id) ?? 0) + 1);
    });
    const exitSeen = new Map<string, number>();

    const out = new Map<string, { d: string; from: { x: number; y: number }; to: { x: number; y: number }; badge: { x: number; y: number } }>();

    resolved.forEach(({ j, a, b }, i) => {
      const ra = rectOf(a), rb = rectOf(b);
      const aIsLeft = ra.left + ra.width / 2 <= rb.left + rb.width / 2;
      const L = aIsLeft ? ra : rb, R = aIsLeft ? rb : ra;
      const lId = aIsLeft ? a.id : b.id, rId = aIsLeft ? b.id : a.id;

      // Spread exits down each card's edge: nth of m sits at (n+1)/(m+1) height.
      const spread = (id: string, rect: typeof ra) => {
        const total = exitCount.get(id) ?? 1;
        const seen = (exitSeen.get(id) ?? 0) + 1;
        exitSeen.set(id, seen);
        return rect.top + (rect.height * seen) / (total + 1);
      };
      const sy = spread(lId, L);
      const ty = spread(rId, R);
      const sx = L.left + L.width;
      const tx = R.left;

      // Each join gets its own vertical channel inside the gutter.
      const gutter = Math.max(24, tx - sx);
      const slot = (i % 5) - 2;
      const midX = sx + gutter / 2 + slot * 9;

      const r = 8; // corner radius
      const vDir = ty > sy ? 1 : -1;
      const d = Math.abs(ty - sy) < r * 2
        ? `M ${sx} ${sy} L ${tx} ${ty}`
        : [
            `M ${sx} ${sy}`,
            `L ${midX - r} ${sy}`,
            `Q ${midX} ${sy} ${midX} ${sy + r * vDir}`,
            `L ${midX} ${ty - r * vDir}`,
            `Q ${midX} ${ty} ${midX + r} ${ty}`,
            `L ${tx} ${ty}`,
          ].join(' ');

      out.set(j.id, {
        d,
        from: { x: sx, y: sy },
        to: { x: tx, y: ty },
        badge: { x: midX - 20, y: (sy + ty) / 2 - 20 },
      });
    });
    return out;
  }, [canvasJoins, groups, cardSizes]);

  const arrangeCanvas = useCallback((joinsOverride?: CanvasJoin[]) => {
    const COL_GAP = 90;
    const ROW_GAP = 34;
    const DEFAULT_H = 132;
    const ORIGIN = { x: 80, y: 60 };

    setGroups(gs => {
      if (gs.length < 2) return gs;
      const joins = joinsOverride ?? canvasJoins;
      const idByName: Record<string, string> = {};
      gs.forEach(g => { idByName[g.tableName] = g.id; });

      const adj = new Map<string, Set<string>>(gs.map(g => [g.id, new Set<string>()]));
      joins.forEach(j => {
        const a = j.table1Id;
        const b = idByName[j.table2Name];
        if (a && b && adj.has(a) && adj.has(b)) { adj.get(a)!.add(b); adj.get(b)!.add(a); }
      });
      // Derive edges also count — a SQL card built from other cards belongs downstream.
      deriveEdges.forEach(e => {
        if (adj.has(e.fromId) && adj.has(e.toId)) { adj.get(e.fromId)!.add(e.toId); adj.get(e.toId)!.add(e.fromId); }
      });

      const degree = (id: string) => adj.get(id)?.size ?? 0;
      const connected = gs.filter(g => degree(g.id) > 0);
      if (connected.length === 0) return gs;

      // Hub = most joins; ties broken by canvas order so the layout is stable.
      const hub = connected.reduce((best, g) => (degree(g.id) > degree(best.id) ? g : best), connected[0]);

      const depth = new Map<string, number>([[hub.id, 0]]);
      const queue = [hub.id];
      while (queue.length) {
        const cur = queue.shift()!;
        adj.get(cur)!.forEach(n => {
          if (!depth.has(n)) { depth.set(n, depth.get(cur)! + 1); queue.push(n); }
        });
      }
      // A join between two cards at the same depth has no gutter to route
      // through — its line would cross whatever is stacked between them. Push the
      // lesser-connected end one column on so every edge gets empty space.
      for (let pass = 0; pass < 4; pass++) {
        let moved = false;
        joins.forEach(jn => {
          const a = jn.table1Id;
          const b = idByName[jn.table2Name];
          if (!a || !b || !depth.has(a) || !depth.has(b)) return;
          if (depth.get(a) !== depth.get(b)) return;
          const push = degree(a) <= degree(b) ? a : b;
          depth.set(push, depth.get(push)! + 1);
          moved = true;
        });
        if (!moved) break;
      }

      const maxDepth = Math.max(...depth.values());
      gs.forEach(g => { if (!depth.has(g.id)) depth.set(g.id, maxDepth + 1); });

      const columns = new Map<number, CanvasGroup[]>();
      gs.forEach(g => {
        const d = depth.get(g.id)!;
        columns.set(d, [...(columns.get(d) ?? []), g]);
      });

      const heightOf = (g: CanvasGroup) => cardSizes[g.id]?.h ?? DEFAULT_H;
      const widthOf  = (g: CanvasGroup) => cardSizes[g.id]?.w ?? CARD_W;
      const colHeight = (col: CanvasGroup[]) =>
        col.reduce((sum, g) => sum + heightOf(g), 0) + ROW_GAP * (col.length - 1);
      const tallest = Math.max(...[...columns.values()].map(colHeight));

      const pos = new Map<string, { x: number; y: number }>();
      let x = ORIGIN.x;
      [...columns.keys()].sort((a, b) => a - b).forEach(d => {
        const col = columns.get(d)!;
        let y = ORIGIN.y + (tallest - colHeight(col)) / 2;
        col.forEach(g => {
          pos.set(g.id, { x, y });
          y += heightOf(g) + ROW_GAP;
        });
        x += Math.max(...col.map(widthOf)) + COL_GAP;
      });

      return gs.map(g => ({ ...g, ...(pos.get(g.id) ?? { x: g.x, y: g.y }) }));
    });
  }, [canvasJoins, deriveEdges, cardSizes]);

  const agentAddJoins = useCallback((joins: InitialCanvasJoin[]) => {
    setGroups(currentGroups => {
      setCanvasJoins(prevJoins => {
        const idByName: Record<string, string> = {};
        currentGroups.forEach(g => { idByName[g.tableName] = g.id; });
        const existing = new Set(prevJoins.map(j => `${j.table1Id}|${j.table2Name}`));
        const additions = joins
          .filter(j => idByName[j.table1] && currentGroups.some(g => g.tableName === j.table2))
          .filter(j => !existing.has(`${idByName[j.table1]}|${j.table2}`))
          .map((j, idx) => ({
            id: `agentjoin_${prevJoins.length + idx + 1}`,
            name: `${j.table1} × ${j.table2}`,
            table1Id: idByName[j.table1],
            table2Name: j.table2,
            col1: j.col1, col2: j.col2,
            joinType: j.joinType, cardinality: j.cardinality,
            x: 0, y: 0,
          }));
        const next = additions.length ? [...prevJoins, ...additions] : prevJoins;
        // Lay the graph out against the joins that now exist, not the stale state.
        if (additions.length) window.setTimeout(() => arrangeCanvas(next), 60);
        return next;
      });
      return currentGroups;
    });
  }, []);

  // Seed the canvas from initialTables/initialJoins (MRD flow, SpotterX embed) — once.
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || !initialTables || initialTables.length === 0) return;
    seededRef.current = true;
    const seededGroups: CanvasGroup[] = initialTables.map((tableName, idx) => {
      const pos = NODE_POSITIONS[idx % NODE_POSITIONS.length];
      const cols = TABLE_COLS[tableName] ?? [['id', 'INT'], ['value', 'VARCHAR']];
      return {
        id: `seed_${idx + 1}`, tableName, sourceKind: 'warehouse' as const,
        steps: [{ type: 'source' as OpType, label: tableName, desc: 'Raw table', cols }],
        x: pos.x, y: pos.y, expanded: false, activeStep: 0,
      };
    });
    setGroups(seededGroups);
    nodeCountRef.current = seededGroups.length;
    if (initialJoins && initialJoins.length) {
      const idByName: Record<string, string> = {};
      seededGroups.forEach(g => { idByName[g.tableName] = g.id; });
      setCanvasJoins(initialJoins.filter(j => idByName[j.table1]).map((j, idx) => ({
        id: `seedjoin_${idx + 1}`, name: `${j.table1} × ${j.table2}`,
        table1Id: idByName[j.table1], table2Name: j.table2,
        col1: j.col1, col2: j.col2, joinType: j.joinType, cardinality: j.cardinality,
        x: 0, y: 0,
      })));
    }
  }, [initialTables, initialJoins]);

  // ── CSV upload + data-mode caching gate ──────────────────────────────────────
  const handleCsvFile = (file?: File) => {
    const fileName = file?.name ?? 'customer_regions.csv';
    const add = () => addToCanvas('customer_regions', 'csv', fileName);
    if (dataMode === 'live') {
      // A file (and any transforms on it) requires the model to be cached into the store.
      // Always confirm the live → cached switch, even on an empty canvas.
      setCacheConfirm({ onConfirm: () => { setDataMode('cached'); add(); setCacheConfirm(null); } });
    } else {
      // Already cached — the file just lands in the store.
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

  const addStep = useCallback((opType: OpType, isPrep = false, forGroupId?: string) => {
    const gid = forGroupId ?? selectedId;
    if (!gid) return;
    if (opType === 'formula') {
      setFormulaConfig({ colName: '', colNameTouched: false, aiDesc: '', aiActive: false, aiGenerating: false, expr: '' });
    }
    if (opType === 'nullfix') {
      const g = groups.find(gr => gr.id === gid);
      const firstNull = g ? (nullColumnsOf(g.tableName)[0]?.name ?? '') : '';
      setNullFixConfig({ column: firstNull, aiActive: false, aiDesc: '', aiGenerating: false, value: '', applied: false });
    }
    if (opType === 'sql') {
      setSqlConfig({ sql: '', aiActive: false, aiDesc: '', aiGenerating: false, applied: false });
    }
    if (opType === 'python') {
      setPythonConfig({ colName: '', colNameTouched: false, code: '', aiActive: false, aiDesc: '', aiGenerating: false, pyVersion: '3.11', ran: false, error: null, fixing: false, apiData: false });
    }
    // A brand-new step has nothing to summarize yet — open it straight into its
    // editable form, same as how a dragged join opens straight into edit mode.
    const g0 = groups.find(gr => gr.id === gid);
    setEditingStepKey(stepKey(gid, g0 ? g0.steps.length : 0));
    setGroups(prev => prev.map(g => {
      if (g.id !== gid) return g;
      const meta = OP_META[opType];
      const cols = g.steps[g.steps.length - 1].cols;
      return {
        ...g,
        steps: [...g.steps, { type: opType, label: `${meta.label}: ${g.tableName}`, desc: meta.desc, cols, prep: isPrep || opType === 'nullfix' }],
        activeStep: g.steps.length,
      };
    }));
    if (forGroupId) setSelectedIds(new Set([forGroupId]));
  }, [selectedId, groups]);

  // Prep transforms materialize data → they require caching. (Join/filter/formula/aggregate stay live.)
  const addBlock = (op: OpType, standalone = false) => {
    nodeCountRef.current++;
    const id = `blk_${nodeCountRef.current}`;
    const meta = OP_META[op];
    if (op === 'formula') setFormulaConfig({ colName: '', colNameTouched: false, aiDesc: '', aiActive: false, aiGenerating: false, expr: '' });
    if (op === 'nullfix') setNullFixConfig({ column: '', aiActive: false, aiDesc: '', aiGenerating: false, value: '', applied: false });
    if (op === 'sql') setSqlConfig({ sql: '', aiActive: false, aiDesc: '', aiGenerating: false, applied: false });
    if (op === 'python') setPythonConfig({ colName: '', colNameTouched: false, code: '', aiActive: false, aiDesc: '', aiGenerating: false, pyVersion: '3.11', ran: false, error: null, fixing: false, apiData: false });

    // Ingestion blocks (from "Add data") are always independent; otherwise chain to the
    // selected block(s), or drop free-standing if nothing is selected.
    const parents = standalone ? [] : groups.filter(g => selectedIds.has(g.id));
    let x: number, y: number, inputIds: string[];
    if (parents.length > 0) {
      x = Math.max(...parents.map(p => p.x)) + CARD_W + 64;
      y = parents.reduce((sum, p) => sum + p.y, 0) / parents.length;
      inputIds = parents.map(p => p.id);
    } else {
      const i = nodeCountRef.current % NODE_POSITIONS.length;
      const pos = NODE_POSITIONS[i];
      x = pos.x + Math.floor(nodeCountRef.current / NODE_POSITIONS.length) * 30;
      y = pos.y;
      inputIds = [];
    }

    setGroups(prev => [...prev, {
      id,
      tableName: meta.label,
      sourceKind: 'warehouse',
      steps: [{ type: op, label: meta.label, desc: meta.desc, cols: [], prep: op === 'nullfix' }],
      x, y,
      expanded: false,
      activeStep: 0,
      inputIds,
    }]);
    setSelectedIds(new Set([id]));
    setPreviewOpen(true);
  };

  // Drag-to-connect: drag from a card's edge handle onto another card to form a link (join).
  // The handle pointer-captures the gesture (see BlockNode) so move/up keep flowing even
  // after it unmounts on hover-out; elementFromPoint resolves the drop target card.
  const cardIdAtPoint = (clientX: number, clientY: number): string | null =>
    ((document.elementFromPoint(clientX, clientY) as HTMLElement | null)?.closest('[data-block-id]') as HTMLElement | null)?.getAttribute('data-block-id') ?? null;
  const wireStart = (fromId: string, clientX: number, clientY: number) => {
    const rect = canvasAreaRef.current?.getBoundingClientRect();
    wireTargetRef.current = null;
    setWiring({ fromId, cx: clientX - (rect?.left ?? 0), cy: clientY - (rect?.top ?? 0), overId: null });
  };
  const wireMove = (clientX: number, clientY: number) => {
    const rect = canvasAreaRef.current?.getBoundingClientRect();
    const raw = cardIdAtPoint(clientX, clientY);
    setWiring(w => {
      if (!w) return w;
      // Track the card under the pointer so the drop lands even if released a hair off-target.
      const overId = raw && raw !== w.fromId ? raw : null;
      wireTargetRef.current = overId;
      return { ...w, cx: clientX - (rect?.left ?? 0), cy: clientY - (rect?.top ?? 0), overId };
    });
  };
  const wireEnd = (fromId: string, clientX: number, clientY: number) => {
    const atPoint = cardIdAtPoint(clientX, clientY);
    // Prefer the exact release target; fall back to the last card we hovered during the drag.
    const toId = (atPoint && atPoint !== fromId) ? atPoint : wireTargetRef.current;
    wireTargetRef.current = null;
    if (toId && toId !== fromId) {
      const t1 = groups.find(g => g.id === fromId);
      const t2 = groups.find(g => g.id === toId);
      if (t1 && t2 && !canvasJoins.some(j => (j.table1Id === fromId && j.table2Name === t2.tableName) || (j.table1Id === toId && j.table2Name === t1.tableName))) {
        // Connecting two data cards = a join. Infer a shared key and open join details.
        const cols1 = (TABLE_COLS[t1.tableName] ?? []).map(c => c[0]);
        const cols2 = (TABLE_COLS[t2.tableName] ?? []).map(c => c[0]);
        const shared = cols1.find(c => cols2.includes(c)) ?? '';
        joinCountRef.current++;
        const jid = `join_${joinCountRef.current}`;
        setCanvasJoins(prev => [...prev, {
          id: jid,
          name: `${t1.tableName} × ${t2.tableName}`,
          table1Id: fromId,
          table2Name: t2.tableName,
          col1: shared, col2: shared,
          joinType: 'left_outer',
          cardinality: 'many_to_one',
          x: Math.round((t1.x + t2.x) / 2) + 70,
          y: Math.round((t1.y + t2.y) / 2) + 34,
        }]);
          setSingleJoinActive(false);
        setMultiJoinActive(false);
        setSelectedIds(new Set([jid]));  // select the join → side panel shows join details
        // Open the join straight into its editable form, pre-filled with the inferred key.
        setJoinConfig({ name: `${t1.tableName} × ${t2.tableName}`, table2: t2.tableName, col1: shared, col2: shared, joinType: 'left_outer', cardinality: 'many_to_one', extraPairs: [] });
        setEditingJoinId(jid);
        setPreviewOpen(true);
      }
    }
    setWiring(null);
  };

  const handlePrepStep = (op: OpType, forGroupId?: string) => {
    // Clean/prep is a table-level action → always a chip on the card, never a standalone block.
    const hasWarehouse = groups.some(g => (g.sourceKind ?? 'warehouse') === 'warehouse');
    if (dataMode === 'live' && hasWarehouse) {
      setCacheConfirm({ onConfirm: () => { setDataMode('cached'); addStep(op, true, forGroupId); setCacheConfirm(null); } });
    } else {
      setDataMode('cached');
      addStep(op, true, forGroupId);
    }
  };

  // Code transform (chip). SQL pushes down to the warehouse → stays live; Python runs in
  // ThoughtSpot's compute → materializes data, so it gates the live → cached switch.
  const handleCodeStep = (op: OpType, forGroupId?: string) => {
    if (op === 'python' && dataMode === 'live') {
      setCacheConfirm({ onConfirm: () => { setDataMode('cached'); addStep(op, false, forGroupId); setCacheConfirm(null); } });
    } else {
      addStep(op, false, forGroupId);
    }
  };

  // ── Canvas-agent bridges — AgentPanel (isCanvasAgent) drives the canvas through these ──
  const [pickMode, setPickMode] = useState(false);
  useEffect(() => {
    (window as any).__dsAgentCanvasState__ = () => ({
      tables: groups.filter(g => g.steps[0]?.type === 'source').map(g => g.tableName),
      joins: canvasJoins.length,
    });
    (window as any).__dsAgentAddNode__ = (name: string) => addToCanvas(name, 'warehouse');
    (window as any).__dsAgentApplyChip__ = (tableName: string, op: string) => {
      const g = groups.find(gr => gr.tableName === tableName);
      if (!g) return;
      // The agent's approved plan is the consent — prep materializes data, so switch to cached directly.
      setDataMode('cached');
      addStep(op as OpType, true, g.id);
    };
    // Agent-created join — commits a join between two named tables directly (no
    // manual wiring / edit panel), used by the join-recommendation "Add" flow.
    (window as any).__dsAgentAddJoin__ = (t1Name: string, t2Name: string, key: string, joinType: string, cardinality: string) => {
      const t1 = groups.find(g => g.tableName === t1Name);
      const t2 = groups.find(g => g.tableName === t2Name);
      if (!t1 || !t2) return;
      if (canvasJoins.some(j => (j.table1Id === t1.id && j.table2Name === t2.tableName) || (j.table1Id === t2.id && j.table2Name === t1.tableName))) return;
      joinCountRef.current++;
      const jid = `join_${joinCountRef.current}`;
      setCanvasJoins(prev => [...prev, {
        id: jid, name: `${t1.tableName} × ${t2.tableName}`,
        table1Id: t1.id, table2Name: t2.tableName,
        col1: key, col2: key,
        joinType: ((joinType || 'inner').toLowerCase().replace(/[ -]/g, '_')) as CanvasJoin['joinType'],
        cardinality: ((cardinality || 'many_to_one').toLowerCase().replace(/[ -]/g, '_')) as CanvasJoin['cardinality'],
        x: Math.round((t1.x + t2.x) / 2) + 70,
        y: Math.round((t1.y + t2.y) / 2) + 34,
      } as CanvasJoin]);
      };
    (window as any).__dsEnterPickMode__ = () => setPickMode(true);
    (window as any).__dsTogglePickMode__ = () => setPickMode(p => !p);
    return () => {
      delete (window as any).__dsAgentCanvasState__;
      delete (window as any).__dsAgentAddNode__;
      delete (window as any).__dsAgentApplyChip__;
      delete (window as any).__dsEnterPickMode__;
      delete (window as any).__dsTogglePickMode__;
      delete (window as any).__dsAgentAddJoin__;
    };
  }, [groups, canvasJoins, addToCanvas, addStep]);

  // Keep the composer's reference button in sync with pick mode (active highlight).
  useEffect(() => { (window as any).__dsPickModeChanged__?.(pickMode); }, [pickMode]);

  // Pick mode (A4) — click canvas cards to reference them in the composer. In the
  // POC you can reference many nodes in one session (click card after card);
  // Esc or a click on empty canvas ends it. Vision references one, then exits.
  useEffect(() => {
    if (!pickMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPickMode(false); };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // The card's drag wrapper uses pointer capture, so the click target can be the
      // wrapper (no data-block-id) or a child. Resolve via closest → descendant →
      // the actual element under the cursor, so any click on a node references it.
      const el = (t.closest?.('[data-block-id]') as HTMLElement | null)
        || (t.querySelector?.('[data-block-id]') as HTMLElement | null)
        || ((document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest?.('[data-block-id]') as HTMLElement | null);
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        const gid = el.getAttribute('data-block-id');
        const g = groups.find(gr => gr.id === gid);
        if (g) (window as any).__dsAddPromptRef__?.({ kind: 'table', label: g.tableName });
        if (!scope.multiSelectJoinFlow) setPickMode(false); // one reference per activation
      } else {
        setPickMode(false); // clicking empty canvas ends multi-select
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick, true); // capture — beat the card's own select handler
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('click', onClick, true); };
  }, [pickMode, groups, scope.multiSelectJoinFlow]);

  // Agentic Python fix — the agent (AgentPanel) calls __dsApplyPythonFix__ after its working steps.
  const PENDO_FIX_CODE = `import requests\nimport pandas as pd\n\n# Fixed: Pendo uses apiKey as a query param, not a Bearer token\napi_key = "your-pendo-integration-key"\nbase_url = "https://app.pendo.io/api/v1"\nparams = {"apiKey": api_key}\n\nresponse = requests.get(\n    f"{base_url}/aggregation",\n    params=params,\n    headers={"Content-Type": "application/json"},\n)\nrecords = response.json().get("results", [])\ndf = pd.DataFrame(records)`;
  const PENDO_FIX_COLS: [string, string][] = [['account_id', 'VARCHAR'], ['nps_score', 'FLOAT'], ['nps_comments', 'VARCHAR'], ['sentiment', 'VARCHAR'], ['sentiment_score', 'FLOAT'], ['response_date', 'DATE']];

  const applyPythonFix = () => {
    const gid = selectedId;
    const g = gid ? groups.find(gr => gr.id === gid) : null;
    if (!gid || !g) return;
    // Stash the pre-fix block so Reject can restore the error state.
    pythonFixStashRef.current = { groupId: gid, activeStep: g.activeStep, tableName: g.tableName, cols: g.steps[g.activeStep]?.cols ?? [], code: pythonConfig.code, error: pythonConfig.error };
    // Propose the fix: show the corrected code + Accept/Reject only. The data does NOT load yet —
    // the preview keeps showing the error until Accept, so you never see data for un-accepted code.
    setPythonConfig(p => ({ ...p, code: PENDO_FIX_CODE, fixing: false }));
    setPythonFixReview(true);
    setPreviewOpen(true);
  };
  const acceptPythonFix = () => {
    const st = pythonFixStashRef.current;
    if (st) {
      // Now apply the corrected run's data.
      setGroups(prev => prev.map(gr => gr.id === st.groupId ? { ...gr, tableName: 'pendo_nps_enriched', steps: gr.steps.map((s, i) => i === st.activeStep ? { ...s, cols: PENDO_FIX_COLS } : s) } : gr));
      setHiddenPreviewCols(prev => new Set([...prev, 'sentiment', 'sentiment_score']));
      setPythonConfig(p => ({ ...p, error: null, ran: true, apiData: true }));
      setPreviewOpen(true);
    }
    setPythonFixReview(false);
    pythonFixStashRef.current = null;
  };
  const rejectPythonFix = () => {
    const st = pythonFixStashRef.current;
    if (st) {
      setGroups(prev => prev.map(gr => gr.id === st.groupId ? { ...gr, tableName: st.tableName, steps: gr.steps.map((s, i) => i === st.activeStep ? { ...s, cols: st.cols } : s) } : gr));
      setPythonConfig(p => ({ ...p, code: st.code, error: st.error, ran: false, apiData: false }));
    }
    setPythonFixReview(false);
    pythonFixStashRef.current = null;
    setPreviewOpen(true);
  };
  // Re-assign every render so the bridge always uses the freshest closure over groups/pythonConfig.
  useEffect(() => { (window as any).__dsApplyPythonFix__ = applyPythonFix; });

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
  // Code steps (SQL/Python) let the editor fill the panel down to the preview; other steps scroll naturally.
  const activeStepIsCode = selectedGroup ? ['sql', 'python'].includes(selectedGroup.steps[selectedGroup.activeStep]?.type) : false;

  // Keep the selected node centered in the visible canvas (canvas width minus the properties panel).
  // Only re-runs on (de)selection or panel-width change — NOT on node position, so dragging the
  // selected card doesn't fight the pan.
  useLayoutEffect(() => {
    const area = canvasAreaRef.current;
    if (!area) return;
    const center = () => {
      if (!selectedId) { setPan({ x: 0, y: 0 }); return; }
      const g = groups.find(gg => gg.id === selectedId);
      const j = g ? null : canvasJoins.find(jj => jj.id === selectedId);
      const target = g ?? j;
      if (!target) { setPan({ x: 0, y: 0 }); return; }
      const el = area.querySelector(`[data-block-id="${selectedId}"]`) as HTMLElement | null;
      const nw = el?.offsetWidth ?? (g ? BLOCK_W : 44);
      // Reveal, don't recenter: pan horizontally ONLY if the card runs past a visible edge,
      // and only by the minimum needed. Already-visible cards get no motion at all.
      const margin = 40;
      const vw = area.clientWidth;
      const left = target.x;
      const right = target.x + nw;
      let px = 0;
      if (right > vw - margin) px = (vw - margin) - right;   // past the right edge → nudge left
      else if (left < margin) px = margin - left;            // past the left edge → nudge right
      setPan({ x: Math.round(px), y: 0 });
    };
    center();
    // Re-measure after the panel's width transition settles (360 ⇄ 820 for code blocks).
    const t = setTimeout(center, 260);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, activeStepIsCode]);

  // ── Topbar ──────────────────────────────────────────────────────────────────

  // Switching Cached → Live is only allowed with no CSV and no prep transformations.
  const modelHasCsv = groups.some(g => g.sourceKind === 'csv');
  const modelHasPrep = groups.some(g => g.steps.some(s => s.prep));
  const canSwitchToLive = !modelHasCsv && !modelHasPrep;

  const topbar = (
    <div style={{
      position: 'relative',
      height: 48, background: '#fff', borderBottom: BORDER,
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 6, flexShrink: 0,
    }}>
      {/* Model identity — click to rename inline.
          SpotterX embed can replace the left slot with its own header node. */}
      {embedHeaderLeft ?? (
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, minWidth: 0, maxWidth: 300, marginRight: 4 }}>
          {editingName ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onFocus={e => e.currentTarget.select()}
              onBlur={() => { setModelName(nameDraft.trim() || modelName); setEditingName(false); }}
              onKeyDown={e => {
                if (e.key === 'Enter') { setModelName(nameDraft.trim() || modelName); setEditingName(false); }
                if (e.key === 'Escape') { setNameDraft(modelName); setEditingName(false); }
              }}
              style={{
                fontSize: 16, fontWeight: 700, color: '#1D232F', letterSpacing: '-0.2px',
                fontFamily: ff.primary, width: '100%', minWidth: 120, boxSizing: 'border-box',
                border: '1.5px solid #2770EF', borderRadius: 6, padding: '2px 6px', outline: 'none',
                background: '#fff',
              }}
            />
          ) : (
            <span
              onClick={() => { setNameDraft(modelName); setEditingName(true); }}
              title="Click to rename"
              style={{
                fontSize: 16, fontWeight: 700, color: modelName === 'Untitled model' ? '#A5ACB9' : '#1D232F',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px',
                cursor: 'pointer', borderRadius: 6, padding: '2px 6px', margin: '0 -6px',
                transition: 'background 100ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F6F8FA'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >{modelName}</span>
          )}
        </div>
      )}
      {/* Collapsed data browser — icon moves into the topbar (mirrors the collapsed agent panel); click to reopen */}
      {browserCollapsed && (
        <button
          onClick={() => setBrowserCollapsed(false)}
          title="Open data browser"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F0F2F6'; e.currentTarget.style.color = '#1D232F'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="5" rx="5.5" ry="2" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 5v6c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V5" stroke="currentColor" strokeWidth="1.3"/><path d="M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" stroke="currentColor" strokeWidth="1.3"/></svg>
        </button>
      )}
      {mode === 'blocks' && (
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8C62F5', background: 'rgba(124,58,237,0.10)', padding: '3px 8px', borderRadius: 5 }}>Block flow</span>
      )}
      {/* Draft status moved next to Publish (right group) */}
      {/* Data mode — Live query / Cached (one-way status: Live → Cached) */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          ref={dataModeBtnRef}
          onClick={e => { e.stopPropagation(); setDataModeMenuOpen(o => !o); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, boxSizing: 'border-box',
            fontSize: 12, fontWeight: 600, padding: '0 9px 0 11px', borderRadius: 99, cursor: 'pointer',
            fontFamily: ff.primary,
            background: dataMode === 'cached' ? 'rgba(140,98,245,0.10)' : 'rgba(22,163,74,0.10)',
            color: dataMode === 'cached' ? '#8C62F5' : '#16A34A',
            border: `1px solid ${dataMode === 'cached' ? 'rgba(140,98,245,0.32)' : 'rgba(22,163,74,0.30)'}`,
            outline: 'none',
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
          {dataMode === 'cached' ? 'Cached' : 'Live query'}
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transform: dataModeMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }}><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {dataModeMenuOpen && (
          <AnchoredMenu open={dataModeMenuOpen} anchorRef={dataModeBtnRef} onClose={() => setDataModeMenuOpen(false)} placement="bottom-start" gap={6} style={{ width: 290, background: '#fff', border: BORDER, borderRadius: RADIUS8, boxShadow: '0 8px 28px rgba(25,35,49,0.16)', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: dataMode === 'cached' ? '#7C3AED' : '#16A34A' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1D232F' }}>{dataMode === 'cached' ? 'Cached' : 'Live query'}</span>
              {dataMode === 'cached' && (
                <>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => { setDataModeMenuOpen(false); setCacheSettingsOpen(true); }}
                    title="Cache settings"
                    style={{ width: 24, height: 24, border: 'none', background: 'transparent', borderRadius: 5, color: '#777E8B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
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
                <div style={{ fontSize: 12, lineHeight: 1.5, color: '#64748B', marginBottom: 10 }}>
                  Materialized in ThoughtSpot&rsquo;s data store — required to join uploaded files and run transformations.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#777E8B' }}>Scope</span><span style={{ color: '#1D232F', fontWeight: 500 }}>{cacheScope}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span style={{ color: '#777E8B' }}>Refresh</span><span style={{ color: '#1D232F', fontWeight: 500 }}>{cacheFreq} · {cacheHour}</span></div>
                </div>
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: BORDER }}>
                  <button
                    onClick={() => { if (canSwitchToLive) { setDataMode('live'); setDataModeMenuOpen(false); } }}
                    disabled={!canSwitchToLive}
                    style={{ width: '100%', padding: '7px 0', borderRadius: 7, border: `1px solid ${canSwitchToLive ? '#C0C6CF' : '#EAEDF2'}`, background: '#fff', color: canSwitchToLive ? '#1D232F' : '#A5ACB9', fontSize: 12, fontWeight: 600, cursor: canSwitchToLive ? 'pointer' : 'default', fontFamily: ff.primary }}
                  >
                    Switch to live query
                  </button>
                  {!canSwitchToLive && (
                    <div style={{ fontSize: 11, lineHeight: 1.45, color: '#777E8B', marginTop: 7 }}>
                      Remove {modelHasCsv ? 'uploaded files' : ''}{modelHasCsv && modelHasPrep ? ' and ' : ''}{modelHasPrep ? 'prep transformations' : ''} to switch back to live query.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, lineHeight: 1.5, color: '#64748B', marginBottom: 12 }}>
                  Queries run live against your warehouse. Uploading a file or a prep transformation will cache this model into ThoughtSpot&rsquo;s data store.
                </div>
                <button
                  onClick={() => { setDataModeMenuOpen(false); setCacheConfirm({ onConfirm: () => { setDataMode('cached'); setCacheConfirm(null); } }); }}
                  style={{ width: '100%', padding: '7px 0', borderRadius: 7, border: '1px solid #C0C6CF', background: '#fff', color: '#1D232F', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}
                >
                  Cache model
                </button>
              </>
            )}
          </AnchoredMenu>
        )}
      </div>
      {/* Canvas / Columns view switcher — centered over main content (right of browser panel) */}
      <div style={{ position: 'absolute', left: `calc(50% + ${(browserCollapsed ? 48 : browserWidth) / 2}px)`, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', background: '#F0F2F6', borderRadius: 8, padding: 3, gap: 1 }}>
        {(['canvas', 'data', 'columns', 'test'] as const).filter(v => (v !== 'test' || showTestTab) && (v !== 'columns' || scope.columnsTab)).map(v => (
          <button
            key={v}
            onClick={() => {
              // POC: switching to the spreadsheet shouldn't carry the canvas
              // selection's properties panel over — it opens on demand only.
              if (scope.clearSelectionOnSpreadsheet && v === 'data') { setSelectedIds(new Set()); setDataActionPicker(null); setEditingStepKey(null); }
              setViewMode(v);
            }}
            style={{
              fontSize: 12, fontWeight: 500, padding: '4px 14px', borderRadius: 5,
              border: 'none', cursor: 'pointer', fontFamily: ff.primary,
              background: viewMode === v ? '#fff' : 'transparent',
              color: viewMode === v ? '#1D232F' : '#777E8B',
              boxShadow: viewMode === v ? '0 1px 3px rgba(25,35,49,0.10)' : 'none',
              transition: 'all 130ms', whiteSpace: 'nowrap', userSelect: 'none',
            }}
          >{v === 'canvas' ? 'Canvas' : v === 'columns' ? 'Columns' : v === 'data' ? 'Spreadsheet' : 'Test'}</button>
        ))}
      </div>

      {/* AI Readiness Pill — grouped left as a status after the model name */}
      <div ref={airPillRef} style={{ position: 'relative', flexShrink: 0 }}>
        {airPillTooltip && !hasTable && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 7px)', left: '50%', transform: 'translateX(-50%)', background: '#1D232F', color: '#fff', fontSize: 11, fontWeight: 500, padding: '5px 9px', borderRadius: 5, whiteSpace: 'nowrap', zIndex: 300, pointerEvents: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
            Add at least one table to check AI readiness
          </div>
        )}
        <button
          onClick={() => { if (hasTable) setAirOpen(o => !o); }}
          disabled={!hasTable}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, boxSizing: 'border-box',
            padding: '0 10px 0 9px', borderRadius: 99,
            border: `1px solid ${!hasTable ? '#E2E6EC' : airOpen ? '#2770EF' : '#C0C6CF'}`,
            background: '#fff', fontFamily: ff.primary,
            fontSize: 12, fontWeight: 500,
            color: !hasTable ? '#A5ACB9' : airOpen ? '#2770EF' : '#64748B',
            boxShadow: airOpen ? '0 0 0 3px rgba(39,112,239,0.10)' : 'none',
            whiteSpace: 'nowrap', transition: 'border-color 130ms, box-shadow 130ms, color 130ms',
            cursor: hasTable ? 'pointer' : 'not-allowed', opacity: 1,
          }}
          onMouseEnter={e => {
            if (!hasTable) { setAirPillTooltip(true); return; }
            if (!airOpen) { e.currentTarget.style.borderColor = '#A5ACB9'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(25,35,49,0.08)'; }
          }}
          onMouseLeave={e => {
            setAirPillTooltip(false);
            if (!airOpen) { e.currentTarget.style.borderColor = hasTable ? '#C0C6CF' : '#E2E6EC'; e.currentTarget.style.boxShadow = 'none'; }
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block', transition: 'background 150ms', background: !hasTable ? '#E2E6EC' : airOpen ? '#2770EF' : airPillDotColor }} />
          <span>{airPillLabel}</span>
          <svg style={{ color: !hasTable ? '#D1D5DB' : airOpen ? '#71A1F4' : '#A5ACB9', transform: airOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms cubic-bezier(0.4,0,0.2,1)', flexShrink: 0 }} width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>

        {/* Dropdown */}
        {airOpen && (() => {
          const starSVG = <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M6 1l1.2 3.6H11l-3 2.3 1.1 3.5L6 8.5l-3.1 1.9 1.1-3.5-3-2.3h3.8z" fill="currentColor"/></svg>;

          const AirTaskCompact = ({ item }: { item: typeof AIR_ITEMS[number] }) => {
            const state = airGetState(item.id);
            const isDone = state === 'done'; const isOOS = state === 'oos'; const isGood = item.sev === 'good';
            const tagText = isDone ? 'Fixed' : isOOS ? 'Skipped' : state === 'awaiting' ? 'Reviewing' : state === 'manual' ? 'Manual' : item.tag;
            const tagColors: Record<string, { color: string; bg: string }> = { miss: { color: '#E22B3D', bg: 'rgba(226,43,61,0.08)' }, warn: { color: '#B8860B', bg: 'rgba(252,200,56,0.10)' }, good: { color: '#06BF7F', bg: 'rgba(6,191,127,0.09)' }, done: { color: '#06BF7F', bg: 'rgba(6,191,127,0.09)' }, oos: { color: '#A5ACB9', bg: '#F6F8FA' }, Reviewing: { color: '#B8860B', bg: 'rgba(252,200,56,0.10)' }, Manual: { color: '#2770EF', bg: 'rgba(39,112,239,0.08)' } };
            const tagKey = isDone ? 'done' : isOOS ? 'oos' : item.sev;
            const tc = tagColors[tagKey] || tagColors.miss;
            const cbCls = state === 'fixing' || state === 'awaiting' ? 'spin' : isDone ? 'done' : isOOS ? 'oos' : item.sev;
            const cbBg = isDone || isGood ? '#06BF7F' : isOOS ? '#F6F8FA' : 'transparent';
            const cbBorder = cbCls === 'spin' ? '#2770EF' : isDone || isGood ? '#06BF7F' : isOOS ? '#E2E6EC' : item.sev === 'miss' ? '#E22B3D' : item.sev === 'warn' ? '#FCC838' : '#06BF7F';
            return (
              <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 9, borderBottom: '1px solid #F6F8FA' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${cbBorder}`, background: cbBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: (state === 'fixing' || state === 'awaiting') ? 'air-spin 700ms linear infinite' : 'none' }}>
                  {(isDone || isGood) && <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: isOOS ? '#A5ACB9' : '#1D232F', flex: 1, textDecoration: isOOS ? 'line-through' : 'none' }}>{item.name}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 3, color: tc.color, background: tc.bg, flexShrink: 0 }}>{tagText}</span>
              </div>
            );
          };

          return (
            <AnchoredMenu open={airOpen} anchorRef={airPillRef} onClose={() => setAirOpen(false)} placement="bottom-end" gap={7} style={{
              width: poc ? 400 : 292,
              background: '#fff', border: '1px solid #E2E6EC', borderRadius: poc ? 16 : 10,
              boxShadow: '0 8px 28px rgba(25,35,49,0.12), 0 1px 4px rgba(25,35,49,0.06)',
              overflow: 'hidden',
              animation: 'air-fadeIn 140ms cubic-bezier(0,0,0.2,1) both',
            }}>
              <style>{`@keyframes air-fadeIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}} @keyframes air-spin{to{transform:rotate(360deg)}}`}</style>

              {poc ? (
                <SpotterReadinessPanel onRun={() => { setAirOpen(false); if (hasTable) { setAirItemStates({} as Record<AirItemId, AirItemState>); airRunScan(); } }} />
              ) : airDropView === 'intro' ? (
                <>
                  <div style={{ padding: '15px 16px 13px', borderBottom: '1px solid #EAEDF2' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#A5ACB9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>AI readiness</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1D232F', marginBottom: 6, letterSpacing: '-0.3px', lineHeight: 1.3 }}>Make this model work with Spotter</div>
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55, marginBottom: 12 }}>Run a 10-second check. Get a precise diagnosis — and fix every gap with a single click.</div>
                    {/* Journey dots */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#A5ACB9', border: '1.5px solid #A5ACB9', flexShrink: 0 }} />
                      <span style={{ fontSize: 9.5, fontWeight: 500, color: '#A5ACB9', marginLeft: 4, marginRight: 6, whiteSpace: 'nowrap' }}>Not configured</span>
                      {[0,1,2,3].map(i => <React.Fragment key={i}><div style={{ width: 18, height: 1.5, background: '#EAEDF2', flexShrink: 0 }} /><div style={{ width: 7, height: 7, borderRadius: '50%', background: i === 3 ? 'rgba(6,191,127,0.35)' : '#E2E6EC', flexShrink: 0 }} /></React.Fragment>)}
                      <span style={{ fontSize: 9.5, fontWeight: 500, color: 'rgba(6,191,127,0.6)', marginLeft: 4, whiteSpace: 'nowrap' }}>Spotter enabled</span>
                    </div>
                  </div>
                  <div style={{ padding: '13px 16px 14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {[
                        { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: '5 metadata dimensions', sub: 'Descriptions, synonyms, questions, columns, joins' },
                        { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.4 4.2H14l-3.7 2.7 1.4 4.3L8 10.5l-3.7 2.7 1.4-4.3L2 6.9h4.6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>, label: 'AI fixes, one click each', sub: 'Or apply manually — your choice' },
                        { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 11l3-5 3 3.5 2-2 3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>, label: 'Readiness tracked over time', sub: 'See how the model improves each run' },
                      ].map(({ icon, label, sub }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#F6F8FA', color: '#777E8B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', display: 'block' }}>{label}</span>
                            <span style={{ fontSize: 11, color: '#A5ACB9', display: 'block', marginTop: 1 }}>{sub}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => { setAirOpen(false); setAirItemStates({} as Record<AirItemId, AirItemState>); airRunScan(); }}
                        style={{ flex: 1, padding: 8, borderRadius: 7, border: 'none', background: '#2770EF', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#2359B6'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#2770EF'; }}
                      >
                        {starSVG} Check AI readiness
                      </button>
                      <span style={{ fontSize: 10.5, color: '#A5ACB9', whiteSpace: 'nowrap', flexShrink: 0 }}>~10 sec</span>
                    </div>
                  </div>
                </>
              ) : airPendingCount > 0 ? (
                <>
                  <div style={{ padding: '11px 16px 10px', borderBottom: '1px solid #EAEDF2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1D232F', flex: 1 }}>AI readiness check</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#F6F8FA', color: '#777E8B', border: '1px solid #EAEDF2' }}>Not configured</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{airSubText}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                      <div style={{ flex: 1, height: 4, background: '#EAEDF2', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${airPct}%`, borderRadius: 99, background: airColor, transition: 'width 700ms cubic-bezier(0.4,0,0.2,1) 200ms' }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#777E8B', whiteSpace: 'nowrap' }}>{airPct}%</span>
                    </div>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {AIR_ITEMS.map(item => <AirTaskCompact key={item.id} item={item} />)}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #EAEDF2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => { setAirOpen(false); setAirItemStates(prev => { const n = { ...prev } as Record<AirItemId, AirItemState>; AIR_ITEMS.forEach(it => { if (n[it.id] !== 'oos') n[it.id] = 'pending'; }); return n; }); airRunScan(); }}
                      style={{ fontSize: 11, color: '#64748B', background: 'none', border: '1px solid #EAEDF2', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: ff.primary, fontWeight: 500 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#C0C6CF'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; }}
                    >Run again</button>
                    <button
                      onClick={() => {
                        setAirOpen(false);
                        setAirItemStates(prev => { const n = { ...prev } as Record<AirItemId, AirItemState>; AIR_ITEMS.forEach(it => { if (it.sev !== 'good' && (n[it.id] === 'pending' || !n[it.id])) n[it.id] = 'fixing'; }); return n; });
                        setTimeout(() => { setAirItemStates(prev => { const n = { ...prev } as Record<AirItemId, AirItemState>; AIR_ITEMS.forEach(it => { if (n[it.id] === 'fixing') n[it.id] = 'done'; }); return n; }); }, 1500);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#fff', background: '#2770EF', border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: ff.primary, fontWeight: 600 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2359B6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#2770EF'; }}
                    >
                      {starSVG} Fix all with AI
                    </button>
                  </div>
                </>
              ) : airTuneRecsCount === null ? (
                <>
                  <div style={{ padding: '15px 16px 13px', borderBottom: '1px solid #EAEDF2' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#A5ACB9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>Model tuning</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1D232F', marginBottom: 6, letterSpacing: '-0.3px', lineHeight: 1.3 }}>Tune Spotter with sample questions</div>
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>Simulate how Spotter answers your sample questions. Rate each answer to identify gaps and get targeted metadata fixes.</div>
                  </div>
                  <div style={{ padding: '13px 16px 14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                      {[
                        { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8l2 2.5 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, label: '3 sample questions', sub: 'Generated from your model schema' },
                        { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, label: 'Rate each Spotter answer', sub: 'Correct, incorrect, or out of scope' },
                        { icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 11l3-5 3 3.5 2-2 3 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><rect x="2" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>, label: 'Get metadata improvements', sub: 'Targeted fixes based on your ratings' },
                      ].map(({ icon, label, sub }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 24, height: 24, borderRadius: 6, background: '#F6F8FA', color: '#777E8B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', display: 'block' }}>{label}</span>
                            <span style={{ fontSize: 11, color: '#A5ACB9', display: 'block', marginTop: 1 }}>{sub}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={airStartTuning}
                      style={{ width: '100%', padding: 8, borderRadius: 7, border: 'none', background: '#2770EF', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2359B6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#2770EF'; }}
                    >
                      {starSVG} Tune model
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ padding: '15px 16px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: airTuneRecsCount > 0 ? 'rgba(252,200,56,0.15)' : 'rgba(6,191,127,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {airTuneRecsCount > 0
                          ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M6 3v3.5l2 1.5" stroke="#B8860B" strokeWidth="1.4" strokeLinecap="round"/><circle cx="6" cy="6" r="5" stroke="#B8860B" strokeWidth="1.2"/></svg>
                          : <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#06BF7F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        }
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1D232F' }}>
                        {airTuneRecsCount > 0 ? `${airTuneRecsCount} tuning fix${airTuneRecsCount === 1 ? '' : 'es'} found` : 'All answers correct'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginBottom: 12 }}>
                      {airTuneRecsCount > 0
                        ? 'Review the metadata recommendations in the agent panel and apply them to improve Spotter accuracy.'
                        : 'Spotter answered all sample questions correctly. The model is well-tuned.'}
                    </div>
                    <button
                      onClick={airStartTuning}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748B', background: 'none', border: '1px solid #EAEDF2', borderRadius: 5, padding: '5px 11px', cursor: 'pointer', fontFamily: ff.primary, fontWeight: 500 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#C0C6CF'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; }}
                    >
                      {starSVG} Tune again
                    </button>
                  </div>
                </>
              )}
            </AnchoredMenu>
          );
        })()}
      </div>

      <div style={{ flex: 1 }} />
      {/* Controls — draft status + publish (right group) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {published ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, boxSizing: 'border-box', fontSize: 12, fontWeight: 600, padding: '0 11px', borderRadius: 99, background: 'rgba(6,191,127,0.10)', color: '#06BF7F', border: '1px solid rgba(6,191,127,0.30)', letterSpacing: '0.01em', userSelect: 'none', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06BF7F' }} />
            Published · v1
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: '#A5ACB9', letterSpacing: '0.01em', userSelect: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 8.5l2.5 2.5L12 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Draft saved 1 min ago
          </span>
        )}
        {/* Publish */}
        <button onClick={() => setPublishOpen(true)} style={{ padding: '6px 16px', borderRadius: RADIUS6, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>
          {published ? 'Republish' : 'Publish'}
        </button>
        {/* SpotterX embed: close button (or any right-slot node) */}
        {embedHeaderRight}
      </div>
    </div>
  );

  // ── Agent panel ─────────────────────────────────────────────────────────────

  const agentPanel = (agentCollapsed || hideAgentPanel) ? null : (
    <div style={{
      position: 'relative', flexShrink: 0,
      width: agentWidth,
      display: 'flex', flexDirection: 'column',
      transition: resizingPanel === 'agent' ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Agent panel header */}
      <div style={{
        height: 48, flexShrink: 0,
        background: 'transparent',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 6,
      }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: fw.semibold, color: '#1D232F', padding: '3px 6px', fontFamily: ff.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>New chat</span>
        <button
          onClick={() => setAgentCollapsed(true)}
          title="Collapse agent panel"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: RADIUS6, border: 'none', background: 'none', color: '#777E8B', cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#777E8B'; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M6 2.5v11" stroke="currentColor" strokeWidth="1.3"/>
          </svg>
        </button>
      </div>
      {/* Agent content */}
      <div style={{ flex: 1, overflow: 'hidden', background: 'transparent' }}>
        <AgentPanel
          project={agentProject}
          setProject={setAgentProject}
          messages={agentMessages}
          setMessages={setAgentMessages}
          isFromScratch={true}
          isCanvasAgent={true}
          poc={poc}
          demo={demo}
          multiSelectJoinFlow={scope.multiSelectJoinFlow}
          onAgentAddTables={agentAddTables}
          onAgentAddJoins={agentAddJoins}
          onAgentAddPythonSource={agentAddPythonSource}
          onCachingApplied={() => setDataMode('cached')}
          canvasTableCount={groups.filter(g => g.steps[0]?.type === 'source').length}
          width={agentWidth}
          rootBackground="transparent"
        />
      </div>
      {/* Drag-to-resize handle */}
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
      {/* Pick mode (A4) — hover outline on canvas cards (no hint pill) */}
      {pickMode && (
        <style>{`[data-block-id] { cursor: crosshair !important; } [data-block-id]:hover { outline: 2px solid #2770EF; outline-offset: 2px; border-radius: 14px; }`}</style>
      )}
    </div>
  );

  // Shared "Add data" menu — used by both the data browser header and the empty-state "Add source" button.
  const addDataItems: { key: string; label: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'csv',    label: 'Upload file', desc: 'CSV, Excel, Parquet, or JSON', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 10.5V3.5M5.5 6L8 3.5 10.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 10.5v1.5A1.5 1.5 0 004.5 13.5h7a1.5 1.5 0 001.5-1.5v-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
    { key: 'sql',    label: 'SQL',        desc: 'Query warehouse tables or views',   icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4.5 5L2 8l2.5 3M11.5 5L14 8l-2.5 3M9.5 3.5l-3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { key: 'python', label: 'Python',     desc: 'Fetch from an API, SDK, or file',   icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zM21.1 6.11l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09z"/></svg> },
  ];
  const handleAddData = (key: string) => {
    setToolbarAddOpen(false);
    setBrowserAddOpen(false);
    setEmptyAddOpen(false);
    if (key === 'csv') { fileInputRef.current?.click(); return; }
    if (key === 'cdw') { addToCanvas('dim_accounts'); return; }
    // SQL/Python from "Add data" = independent ingestion block. SQL is a live warehouse query;
    // a Python source runs in-store → it materializes data, so gate the live → cached switch.
    if (key === 'python' && dataMode === 'live') {
      setCacheConfirm({ onConfirm: () => { setDataMode('cached'); addBlock('python', true); setCacheConfirm(null); } });
    } else {
      addBlock(key as OpType, true);
    }
  };

  // ── Data browser panel ──────────────────────────────────────────────────────

  const browserPanel = (
    <div style={{
      position: 'relative', flexShrink: 0,
      // Vision collapses the panel away entirely (0) and hands the control up to
      // the topbar database icon. POC keeps a 44px rail with its own toggle.
      width: browserCollapsed ? (poc ? 44 : 0) : browserWidth,
      transition: resizingPanel === 'browser' ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
    }}>
    <div style={{
      width: '100%', height: '100%',
      background: '#fff', borderRight: browserCollapsed ? 'none' : BORDER,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ height: 40, display: 'flex', alignItems: 'center', padding: browserCollapsed ? '0' : '0 14px', gap: 8, borderBottom: BORDER, flexShrink: 0, justifyContent: browserCollapsed ? 'center' : undefined }}>
        {/* POC: single database icon in the header toggles the panel open/closed.
            Vision has no header database icon — it uses the chevron below to
            collapse, and the topbar database icon to reopen. */}
        {poc && (
          <button onClick={() => setBrowserCollapsed(c => !c)} title={browserCollapsed ? 'Expand data browser' : 'Collapse data browser'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: RADIUS6, border: 'none', background: 'transparent', color: '#777E8B', cursor: 'pointer', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F0F2F6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Icon name="database" size="s" color="#777E8B" />
          </button>
        )}
        {!browserCollapsed && (
          <>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Data browser
            </span>
            {/* POC: no cross-source "Add" — only the existing data connections */}
            {!poc && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                ref={browserAddBtnRef}
                onClick={() => setBrowserAddOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 3, height: 24, padding: '0 8px', borderRadius: RADIUS6, border: '1px solid #C0C6CF', background: browserAddOpen ? '#F6F8FA' : '#fff', color: '#1D232F', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: ff.primary }}
              >
                <Icon name="plus" size="xs" color="#1D232F" />
                Add
                <Icon name="chevron-down" size="xs" color="#1D232F" />
              </button>
              {browserAddOpen && (
                <AnchoredMenu open={browserAddOpen} anchorRef={browserAddBtnRef} onClose={() => setBrowserAddOpen(false)} placement="bottom-end" style={{ background: '#fff', border: '1px solid #E2E6EC', borderRadius: RADIUS8, boxShadow: '0 6px 24px rgba(25,35,49,0.13)', minWidth: 232, padding: '4px 0' }}>
                  {addDataItems.map(item => (
                    <button key={item.key} onClick={() => handleAddData(item.key)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F6F8FA'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <span style={{ color: '#64748B', flexShrink: 0, marginTop: 1, display: 'flex' }}>{item.icon}</span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F' }}>{item.label}</span>
                        <span style={{ fontSize: 11, color: '#777E8B', fontWeight: 400 }}>{item.desc}</span>
                      </span>
                    </button>
                  ))}
                </AnchoredMenu>
              )}
            </div>
            )}
            {/* Vision: chevron collapses the panel to 0; reopen from the topbar. */}
            {!poc && (
              <button onClick={() => setBrowserCollapsed(true)} style={phdrBtnStyle} title="Collapse">
                <IconChevronLeft size={12} />
              </button>
            )}
          </>
        )}
      </div>

      {browserCollapsed ? null : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Browser tabs — hidden when locked to a single connection (POC, Demo) */}
          {scope.browserCategoryTabs && (
          <div style={{ display: 'flex', borderBottom: BORDER, flexShrink: 0, background: '#fff', padding: '0 10px', gap: 16 }}>
            {(['warehouse', 'business', 'external'] as const).map(tab => {
              const isActive = activeBrowserTab === tab;
              const label = tab === 'warehouse' ? 'Warehouse' : tab === 'business' ? 'Business Apps' : 'External sources';
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
                    color: isActive ? '#2770EF' : '#777E8B',
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
          )}
          {/* Search + filter */}
          <div style={{ padding: '9px 12px 8px', borderBottom: BORDER, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 32, background: '#F6F8FA', border: '1px solid #EAEDF2', borderRadius: RADIUS6, padding: '0 11px', transition: 'border-color 150ms, box-shadow 150ms' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#71A1F4'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.10)'; e.currentTarget.style.background = '#fff'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = '#F6F8FA'; }}
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ color: '#777E8B', flexShrink: 0 }}><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input type="text" placeholder="Find tables, columns..." style={{ border: 'none', background: 'transparent', fontSize: 12, color: '#1D232F', outline: 'none', flex: 1, minWidth: 0, fontFamily: ff.primary }} />
              </div>
              {/* Filter toggle — hidden when locked to a single connection (POC) */}
              {!poc && <button
                onClick={() => setFilterOpen(o => !o)}
                title="Filter connections"
                style={{
                  width: 32, height: 32, flexShrink: 0,
                  border: `1px solid ${filterOpen ? '#71A1F4' : '#EAEDF2'}`,
                  borderRadius: RADIUS6, background: filterOpen ? 'rgba(39,112,239,0.07)' : '#fff',
                  color: filterOpen ? '#2770EF' : '#777E8B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 120ms',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4.5 8h7M7 12h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>}
            </div>
            {/* Filter panel */}
            {filterOpen && (
              <div style={{ marginTop: 8, border: BORDER, borderRadius: RADIUS8, background: '#fff', overflow: 'hidden', boxShadow: '0 4px 16px rgba(25,35,49,0.10)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px 6px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#A5ACB9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connections</span>
                  <span
                    style={{ fontSize: 11, fontWeight: 600, color: '#2770EF', cursor: 'pointer' }}
                    onClick={() => setFilterConns(filterConns.size === visibleConnIds.length ? new Set() : new Set(visibleConnIds))}
                  >
                    {filterConns.size === visibleConnIds.length ? 'Deselect all' : 'Select all'}
                  </span>
                </div>
                <div style={{ padding: '2px 8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {[
                    { id: 'sf', label: 'snowflake-prod', icon: <IconSnowflake /> },
                    scope.databricksConnection
                      ? { id: 'bq', label: 'databricks', icon: <IconDatabricks /> }
                      : { id: 'bq', label: 'bigquery-product', icon: <IconBigquery /> },
                    { id: 'gdrive', label: 'Google Drive', icon: <IconCloud /> },
                    { id: 'sharepoint', label: 'SharePoint', icon: <IconFolder /> },
                    { id: 'agentdb', label: 'AgentDB', icon: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><ellipse cx="7" cy="3.5" rx="4.5" ry="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 3.5v7c0 .83 2 1.5 4.5 1.5s4.5-.67 4.5-1.5v-7" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 7c0 .83 2 1.5 4.5 1.5S11.5 7.83 11.5 7" stroke="currentColor" strokeWidth="1.2"/><circle cx="11" cy="11" r="2.5" fill="#2770EF"/><path d="M10 11h2M11 10v2" stroke="white" strokeWidth="1" strokeLinecap="round"/></svg> },
                  ].filter(conn => visibleConnIds.includes(conn.id)).map(conn => (
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
                {showConn('sf') && (
                  <TreeConn id="sf" icon={<IconSnowflake />} label="snowflake-prod" open={expanded.has('sf')} onToggle={toggleExpanded}>
                    <TreeConn id="sf-analytics" icon={<IconDb />} label="ANALYTICS" muted depth={1} open={expanded.has('sf-analytics')} onToggle={toggleExpanded}>
                      <TreeConn id="sf-public" icon={<IconSchema />} label="PUBLIC" muted depth={2} open={expanded.has('sf-public')} onToggle={toggleExpanded}>
                        {['dim_accounts','support_cases','call_metrics','customer_found_defects'].map(t => (
                          <TreeTableRow
                            key={t} name={t} depthPad={50}
                            onCanvas={groups.some(g => g.tableName === t)}
                            onAdd={addToCanvas}
                            expanded={expandedTableRows.has(t)}
                            onToggleExpand={toggleExpandTableRow}
                            deselectedCols={deselectedCols[t]}
                            onToggleCol={toggleCol}
                          showColumns={poc}
                          />
                        ))}
                      </TreeConn>
                    </TreeConn>
                  </TreeConn>
                )}
                {/* bigquery-marketing */}
                {showConn('bq') && (
                  <TreeConn id="bq" icon={scope.databricksConnection ? <IconDatabricks /> : <IconBigquery />} label={scope.databricksConnection ? 'databricks' : 'bigquery-product'} open={expanded.has('bq')} onToggle={toggleExpanded}>
                    <TreeConn id="bq-db" icon={<IconDb />} label={scope.databricksConnection ? 'product_catalog' : 'product_db'} muted depth={1} open={expanded.has('bq-db')} onToggle={toggleExpanded}>
                      <TreeConn id="bq-raw" icon={<IconSchema />} label="raw" muted depth={2} open={expanded.has('bq-raw')} onToggle={toggleExpanded}>
                        {['pendo_nps_enriched','csm_account_mapping'].map(t => (
                          <TreeTableRow
                            key={t} name={t} depthPad={50}
                            onCanvas={groups.some(g => g.tableName === t)}
                            onAdd={addToCanvas}
                            expanded={expandedTableRows.has(t)}
                            onToggleExpand={toggleExpandTableRow}
                            deselectedCols={deselectedCols[t]}
                            onToggleCol={toggleCol}
                          showColumns={poc}
                          />
                        ))}
                      </TreeConn>
                    </TreeConn>
                  </TreeConn>
                )}
                {/* AgentDB — ThoughtSpot's own data store */}
                {scope.nearStoreConnection && showConn('agentdb') && (
                  <TreeConn id="agentdb" icon={<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><ellipse cx="7" cy="3.5" rx="4.5" ry="1.5" stroke="#2770EF" strokeWidth="1.2"/><path d="M2.5 3.5v7c0 .83 2 1.5 4.5 1.5s4.5-.67 4.5-1.5v-7" stroke="#2770EF" strokeWidth="1.2"/><path d="M2.5 7c0 .83 2 1.5 4.5 1.5S11.5 7.83 11.5 7" stroke="#2770EF" strokeWidth="1.2"/></svg>} label="AgentDB" open={expanded.has('agentdb')} onToggle={toggleExpanded}>
                    <TreeConn id="agentdb-cached" icon={<IconSchema />} label="cached" muted depth={1} open={expanded.has('agentdb-cached')} onToggle={toggleExpanded}>
                      {['customer_regions', 'csm_account_mapping', 'pendo_nps_enriched', 'customer_health_external'].map(t => (
                        <TreeTableRow
                          key={t} name={t} depthPad={50}
                          onCanvas={groups.some(g => g.tableName === t)}
                          onAdd={addToCanvas}
                          expanded={expandedTableRows.has(t)}
                          onToggleExpand={toggleExpandTableRow}
                          deselectedCols={deselectedCols[t]}
                          onToggleCol={toggleCol}
                        showColumns={poc}
                        />
                      ))}
                    </TreeConn>
                  </TreeConn>
                )}
              </>
            ) : activeBrowserTab === 'external' ? (
              /* External sources — file/folder-based connections, distinct from the warehouse */
              <>
                {/* Google Drive */}
                {showConn('gdrive') && (
                  <TreeConn id="gdrive" icon={<IconCloud />} label="Google Drive" open={expanded.has('gdrive')} onToggle={toggleExpanded}>
                    <TreeConn id="gdrive-cs" icon={<IconFolder />} label="Customer Success" muted depth={1} open={expanded.has('gdrive-cs')} onToggle={toggleExpanded}>
                      {['qbr_notes'].map(t => (
                        <TreeTableRow
                          key={t} name={t} depthPad={50}
                          onCanvas={groups.some(g => g.tableName === t)}
                          onAdd={addToCanvas}
                          expanded={expandedTableRows.has(t)}
                          onToggleExpand={toggleExpandTableRow}
                          deselectedCols={deselectedCols[t]}
                          onToggleCol={toggleCol}
                        showColumns={poc}
                        />
                      ))}
                    </TreeConn>
                  </TreeConn>
                )}
                {/* SharePoint */}
                {showConn('sharepoint') && (
                  <TreeConn id="sharepoint" icon={<IconFolder />} label="SharePoint" open={expanded.has('sharepoint')} onToggle={toggleExpanded}>
                    <TreeConn id="sp-renewals" icon={<IconFolder />} label="Renewals" muted depth={1} open={expanded.has('sp-renewals')} onToggle={toggleExpanded}>
                      {['renewal_tracker'].map(t => (
                        <TreeTableRow
                          key={t} name={t} depthPad={50}
                          onCanvas={groups.some(g => g.tableName === t)}
                          onAdd={addToCanvas}
                          expanded={expandedTableRows.has(t)}
                          onToggleExpand={toggleExpandTableRow}
                          deselectedCols={deselectedCols[t]}
                          onToggleCol={toggleCol}
                        showColumns={poc}
                        />
                      ))}
                    </TreeConn>
                  </TreeConn>
                )}
              </>
            ) : (
              /* Business Apps — each app is a schema with its tables inside */
              <>
                <TreeConn id="mixpanel" icon={<IconSchema />} label="Mixpanel" count={3} open={expanded.has('mixpanel')} onToggle={toggleExpanded}>
                  {['mp_events','mp_users','mp_cohorts'].map(t => (
                    <TreeTableRow
                      key={t} name={t} depthPad={28}
                      onCanvas={groups.some(g => g.tableName === t)}
                      onAdd={addToCanvas}
                      expanded={expandedTableRows.has(t)}
                      onToggleExpand={toggleExpandTableRow}
                      deselectedCols={deselectedCols[t]}
                      onToggleCol={toggleCol}
                    showColumns={poc}
                    />
                  ))}
                </TreeConn>
                <TreeConn id="pendo" icon={<IconSchema />} label="Pendo" count={3} open={expanded.has('pendo')} onToggle={toggleExpanded}>
                  {['pendo_nps','pendo_feature_usage','pendo_visitors'].map(t => (
                    <TreeTableRow
                      key={t} name={t} depthPad={28}
                      onCanvas={groups.some(g => g.tableName === t)}
                      onAdd={addToCanvas}
                      expanded={expandedTableRows.has(t)}
                      onToggleExpand={toggleExpandTableRow}
                      deselectedCols={deselectedCols[t]}
                      onToggleCol={toggleCol}
                    showColumns={poc}
                    />
                  ))}
                </TreeConn>
              </>
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
    display: 'block', fontSize: 11, fontWeight: 600, color: '#777E8B',
    marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  };
  const selectWrap: React.CSSProperties = { position: 'relative' };
  const selectArrow = (
    <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#A5ACB9' }}>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </div>
  );

  // ── Shared summary/edit pattern — same shape for every action (Join/Filter/
  // Nullfix/Formula/SQL/Python): a read-only summary of key values once saved,
  // with a single "Edit <action>" affordance that reopens the form.
  const summaryRow = (label: string, value: React.ReactNode, key?: string) => (
    <div key={key ?? label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #F3F5F8' }}>
      <span style={{ fontSize: 12, color: '#777E8B', fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#1D232F', fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{value}</span>
    </div>
  );
  const EDIT_PENCIL_ICON = <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  const ADD_PLUS_ICON = <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
  const editActionButton = (label: string, onClick: () => void, icon: React.ReactNode = EDIT_PENCIL_ICON) => (
    <button
      onClick={onClick}
      style={{ width: '100%', padding: '7px 0', borderRadius: 7, border: BORDER, background: '#fff', color: '#1D232F', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.color = '#2770EF'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.color = '#1D232F'; }}
    >
      {icon}
      {label}
    </button>
  );
  const saveCancelRow = (opts: { onSave: () => void; onCancel?: () => void; disabled?: boolean; saveLabel?: string }) => (
    <div style={{ display: 'flex', gap: 6 }}>
      <button
        onClick={opts.onSave}
        disabled={opts.disabled}
        style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', background: opts.disabled ? '#E8ECEF' : '#2770EF', color: opts.disabled ? '#A5ACB9' : '#fff', fontSize: 13, fontWeight: 600, cursor: opts.disabled ? 'default' : 'pointer', fontFamily: ff.primary }}
      >{opts.saveLabel ?? 'Save'}</button>
      {opts.onCancel && (
        <button onClick={opts.onCancel} style={{ padding: '8px 14px', borderRadius: 7, border: BORDER, background: '#fff', color: '#64748B', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>Cancel</button>
      )}
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
    mp_events:    { conn: 'mixpanel', db: 'mixpanel', schema: 'events' },
    mp_users:     { conn: 'mixpanel', db: 'mixpanel', schema: 'events' },
    mp_cohorts:   { conn: 'mixpanel', db: 'mixpanel', schema: 'events' },
    pendo_nps:    { conn: 'pendo', db: 'pendo', schema: 'analytics' },
    pendo_feature_usage: { conn: 'pendo', db: 'pendo', schema: 'analytics' },
    pendo_visitors:{ conn: 'pendo', db: 'pendo', schema: 'analytics' },
  };
  void TABLE_PATH; // retained mock provenance; breadcrumb removed from the properties panel

  // ── Canvas viewport ─────────────────────────────────────────────────────────

  const opButtonsAll: { label: string; op: OpType; icon: React.ReactNode }[] = [
    { label: 'Join',      op: 'join',    icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/></svg> },
    { label: 'Filter',    op: 'filter',  icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4.5h12l-4.5 5.5v3l-3-1.5V10L2 4.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
    { label: 'Aggregate', op: 'agg',     icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M11.5 4h-7l5 4-5 4h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: 'Formula',   op: 'formula', icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
    { label: 'SQL',       op: 'sql',     icon: <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4.5 5L2 8l2.5 3M11.5 5L14 8l-2.5 3M9.5 3.5l-3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { label: 'Python',    op: 'python',  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zM21.1 6.11l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09z"/></svg> },
  ];
  // Option 3: Upload CSV / CDW / SQL / Python are clubbed under an "Add data" menu (below),
  // so the only standalone op-button is Join (a combine). Filter/Sort/Aggregate/Formula are chips.
  const opButtons = mode === 'dataset2' ? opButtonsAll.filter(() => false) : opButtonsAll;

  // Docked properties panel — shared by the Canvas viewport and the Data tab,
  // so filter/formula actions from either surface open the same edit form.
  // When a Data-tab toolbar action is pending (dataActionPicker set), the panel
  // first shows a table chooser; picking a table adds the step and flips to its form.
  const propertiesPanel = dataActionPicker ? (
        <div
          onClick={e => e.stopPropagation()}
          style={{ width: 360, flexShrink: 0, zIndex: 30, background: '#fff', borderLeft: BORDER, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div style={{ height: 38, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: BORDER, flexShrink: 0 }}>
            <div style={{ color: '#64748B', display: 'flex', flexShrink: 0 }}>{panelHeaderIcon(dataActionPicker, '#64748B')}</div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1D232F', flex: 1 }}>{dataActionPicker === 'filter' ? 'Add filter' : 'Add formula'}</span>
            <button onClick={() => setDataActionPicker(null)} style={{ width: 20, height: 20, border: 'none', background: 'transparent', borderRadius: 4, color: '#777E8B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#1D232F'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#777E8B'; }}>
              <Icon name="cross" size="xs" color="currentColor" />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px' }}>
            <label style={labelStyle}>Table</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {groups.map(g => (
                <button key={g.id}
                  onClick={() => { const op = dataActionPicker; setDataActionPicker(null); addStep(op, false, g.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px', border: BORDER, borderRadius: 7, background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 500, color: '#1D232F' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#F5F8FF'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.background = '#fff'; }}
                >
                  <span style={{ color: '#8B96A5', display: 'flex', flexShrink: 0 }}><Icon name="table" size="xs" color="#8B96A5" /></span>
                  {g.tableName}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#A5ACB9', marginTop: 10, lineHeight: 1.5 }}>Choose which table this {dataActionPicker} applies to.</div>
          </div>
        </div>
  ) : selectedIds.size > 0 ? (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: activeStepIsCode ? 'clamp(460px, 44vw, 820px)' : 360, flexShrink: 0, zIndex: 30,
            transition: resizingPanel ? 'none' : 'width 220ms cubic-bezier(0.4,0,0.2,1)',
            background: '#fff',
            borderLeft: BORDER,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <div style={{ height: 38, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: BORDER, flexShrink: 0 }}>
            {(singleJoinActive || multiJoinActive) ? (
              <>
                <button onClick={() => { setSingleJoinActive(false); setMultiJoinActive(false); }} style={{ width: 20, height: 20, border: 'none', background: 'transparent', borderRadius: 4, color: '#777E8B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#1D232F'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#777E8B'; }}>
                  <Icon name="chevron-left" size="xs" color="currentColor" />
                </button>
                <div style={{ color: '#2770EF', display: 'flex' }}><Icon name="join-inner" size="xs" color="#2770EF" /></div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', flex: 1 }}>Create Join</span>
              </>
            ) : (() => {
              const hg = selectedIds.size === 1 ? selectedGroup : null;
              const hstep = hg ? hg.steps[hg.activeStep] : null;
              if (!hg || !hstep) {
                const selJoin = selectedIds.size === 1 ? canvasJoins.find(j => j.id === selectedId) : null;
                return (
                  <>
                    <div style={{ color: selJoin ? '#2770EF' : '#777E8B', display: 'flex', flexShrink: 0 }}>
                      {panelHeaderIcon(selJoin ? 'join' : 'source', selJoin ? '#2770EF' : '#777E8B')}
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1D232F', flex: 1 }}>{selJoin ? 'Join' : 'Properties'}</span>
                  </>
                );
              }
              return (
                <>
                  <div style={{ color: '#64748B', display: 'flex', flexShrink: 0 }}>{panelHeaderIcon(hstep.type, '#64748B')}</div>
                  {hstep.type === 'source' ? (
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#1D232F', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hg.tableName}</span>
                  ) : (() => {
                    const thisTitleKey = stepKey(hg.id, hg.activeStep);
                    const defaultLabel = OP_META[hstep.type]?.label ?? 'Step';
                    if (editingTitleFor === thisTitleKey) {
                      return (
                        <input
                          autoFocus
                          value={titleDraft}
                          onChange={e => setTitleDraft(e.target.value)}
                          onFocus={e => e.currentTarget.select()}
                          onBlur={() => { const v = titleDraft; setGroups(prev => prev.map(g => g.id === hg.id ? { ...g, steps: g.steps.map((s, i) => i === hg.activeStep ? { ...s, title: v } : s) } : g)); setEditingTitleFor(null); }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { const v = titleDraft; setGroups(prev => prev.map(g => g.id === hg.id ? { ...g, steps: g.steps.map((s, i) => i === hg.activeStep ? { ...s, title: v } : s) } : g)); setEditingTitleFor(null); }
                            if (e.key === 'Escape') { setEditingTitleFor(null); }
                          }}
                          placeholder={defaultLabel}
                          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, fontWeight: 600, color: '#1D232F', fontFamily: ff.primary, padding: 0 }}
                        />
                      );
                    }
                    return (
                      <span
                        onClick={() => { setTitleDraft(hstep.title ?? ''); setEditingTitleFor(thisTitleKey); }}
                        title="Click to rename"
                        style={{ fontSize: 12.5, fontWeight: 600, color: '#1D232F', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'text' }}
                      >
                        {hstep.title?.trim() || defaultLabel}
                      </span>
                    );
                  })()}
                  {/* Expand removed from code block header */}
                </>
              );
            })()}
            <button
              title="Delete"
              onClick={() => {
                const selJoin = canvasJoins.find(j => j.id === selectedId);
                if (selJoin) setCanvasJoins(prev => prev.filter(j => j.id !== selJoin.id));
                else if (selectedId) removeNode(selectedId);
                setSelectedIds(new Set()); setSingleJoinActive(false); setMultiJoinActive(false);
              }}
              style={{ width: 20, height: 20, border: 'none', background: 'transparent', borderRadius: 4, color: '#777E8B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#E22B3D'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#777E8B'; }}
            >
              <Icon name="trash-can" size="xs" color="currentColor" />
            </button>
            <button
              onClick={() => { setSelectedIds(new Set()); setSingleJoinActive(false); setMultiJoinActive(false); }}
              style={{ width: 20, height: 20, border: 'none', background: 'transparent', borderRadius: 4, color: '#777E8B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#777E8B'; }}
            >
              <Icon name="cross" size="xs" color="currentColor" />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: activeStepIsCode ? 'hidden' : 'auto', display: activeStepIsCode ? 'flex' : 'block', flexDirection: 'column' }}>
            {(() => {
              // Check if the sole selection is a join block
              const selectedJoin = selectedIds.size === 1 ? canvasJoins.find(j => j.id === selectedId) : null;
              if (selectedJoin && !singleJoinActive) {
                const joinLabel: Record<string, string> = { inner: 'Inner', full_outer: 'Full Outer', left_outer: 'Left Outer', right_outer: 'Right Outer' };
                const cardLabel: Record<string, string> = { many_to_one: 'M:1', one_to_many: '1:M', one_to_one: '1:1' };
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
                        <div><label style={labelStyle}>Table 1</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#777E8B', fontFamily: ff.primary }}>{t1Name}</div></div>
                        <div><label style={labelStyle}>Table 2</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#777E8B', fontFamily: ff.primary }}>{selectedJoin.table2Name}</div></div>
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
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                      {([['Left table', t1Name], ['Right table', selectedJoin.table2Name], ['Join type', joinLabel[selectedJoin.joinType]], ['Cardinality', cardLabel[selectedJoin.cardinality]]] as [string, string][]).map(([label, value]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #F3F5F8' }}>
                          <span style={{ fontSize: 12, color: '#777E8B', fontWeight: 500, flexShrink: 0 }}>{label}</span>
                          <span style={{ fontSize: 12, color: '#1D232F', fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                        </div>
                      ))}
                      {(selectedJoin.col1 || selectedJoin.col2) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 0' }}>
                          <span style={{ fontSize: 12, color: '#777E8B', fontWeight: 500, flexShrink: 0 }}>Join key</span>
                          <span style={{ fontSize: 11, color: '#1D232F', fontWeight: 600, fontFamily: "'SF Mono','Fira Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedJoin.col1} = {selectedJoin.col2}</span>
                        </div>
                      )}
                    </div>
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
                          {groups.map(g => g.tableName).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>{selectArrow}
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Table 2</label>
                      <div style={selectWrap}>
                        <select value={joinConfig.table2} onChange={e => setJoinConfig(c => ({ ...c, table2: e.target.value, col2: '' }))} style={selectStyle}>
                          <option value="">Select table</option>
                          {groups.map(g => g.tableName).filter(t => t !== multiJoinTable1).map(t => <option key={t} value={t}>{t}</option>)}
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
                  <p style={{ margin: 0, fontSize: 12, color: '#777E8B', lineHeight: 1.6 }}>
                    {[...selectedIds].map(id => groups.find(g => g.id === id)?.tableName).filter(Boolean).join(', ')}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#A5ACB9' }}>Click Join in the toolbar to configure</p>
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
                  <div><label style={labelStyle}>Table 1</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#777E8B', fontFamily: ff.primary }}>{selectedGroup!.tableName}</div></div>
                  <div><label style={labelStyle}>Table 2</label><div style={selectWrap}><select value={joinConfig.table2} onChange={e => setJoinConfig(c => ({ ...c, table2: e.target.value, col2: '' }))} style={selectStyle}><option value="">Select table</option>{groups.map(g => g.tableName).filter(t => t !== selectedGroup!.tableName).map(t => <option key={t} value={t}>{t}</option>)}</select>{selectArrow}</div></div>
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
              <div style={activeStepIsCode ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}>
                {/* step switcher removed — each block stands on its own */}

                {/* Step configuration */}
                <div style={{ padding: '12px', ...(activeStepIsCode ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : {}) }}>
                  {(() => {
                    const sg = selectedGroup!;
                    const step = sg.steps[sg.activeStep];
                    const m = OP_META[step.type];
                    const tc = OP_TAG_COLORS[m.tag] || OP_TAG_COLORS.source;

                    if (step.type === 'source') {
                      return (
                        <div>
                          {sg.sourceKind !== 'csv' && (() => {
                            const rowN = MOCK_DATA[sg.tableName]?.length ?? 0;
                            const colN = step.cols.length;
                            const metaRow = (label: string, value: React.ReactNode) => (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #F3F5F8' }}>
                                <span style={{ fontSize: 12, color: '#777E8B', fontWeight: 500, flexShrink: 0 }}>{label}</span>
                                <span style={{ fontSize: 12, color: '#1D232F', fontWeight: 600, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                              </div>
                            );
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {metaRow('Connection', 'Snowflake')}
                                {metaRow('Rows', rowN.toLocaleString())}
                                {metaRow('Size', `${Math.max(1, Math.round(rowN * colN * 0.06))} KB`)}
                                {metaRow('Owner', 'DATA_ENGINEERING')}
                                {metaRow('Created', '2023-06-14')}
                                {metaRow('Last synced', '2 hours ago')}
                              </div>
                            );
                          })()}
                          {sg.sourceKind === 'csv' && sg.csv && (
                            <div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#A5ACB9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>CSV import</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div><label style={labelStyle}>File</label><div style={{ padding: '6px 10px', background: '#F6F8FA', borderRadius: 6, border: BORDER, fontSize: 12, color: '#777E8B', fontFamily: ff.primary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sg.csv.fileName}</div></div>
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

                    if (step.type === 'filter') {
                      const fc = filterConfig;
                      const savedFilter = step.filter;
                      const thisKey = stepKey(sg.id, sg.activeStep);
                      const isEditing = editingStepKey === thisKey || !savedFilter;
                      const OPERATOR_LABEL: Record<string, string> = {
                        '=': 'equals', '!=': 'does not equal', '>': 'greater than', '<': 'less than',
                        '>=': 'greater or equal', '<=': 'less or equal', contains: 'contains',
                        'is null': 'is null', 'is not null': 'is not null',
                      };
                      if (!isEditing && savedFilter) {
                        const rows: [string, string][] = [];
                        if (savedFilter.name) rows.push(['Name', savedFilter.name]);
                        rows.push(['Column', savedFilter.column]);
                        rows.push(['Condition', OPERATOR_LABEL[savedFilter.operator] ?? savedFilter.operator]);
                        if (savedFilter.operator !== 'is null' && savedFilter.operator !== 'is not null') rows.push(['Value', savedFilter.value]);
                        return (
                          <div style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                              {rows.map(([label, value]) => summaryRow(label, value))}
                            </div>
                            {editActionButton('Edit filter', () => {
                              setFilterConfig({ name: savedFilter.name ?? '', column: savedFilter.column, operator: savedFilter.operator, value: savedFilter.value, applied: true });
                              setEditingStepKey(thisKey);
                            })}
                          </div>
                        );
                      }
                      const fcols = (TABLE_COLS[sg.tableName] ?? sg.steps[0]?.cols ?? []) as [string, string][];
                      const needsValue = fc.operator !== 'is null' && fc.operator !== 'is not null';
                      const fInput: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: BORDER, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#1D232F', fontFamily: ff.primary, outline: 'none', background: '#fff' };
                      // Distinct sample values for the selected column, sourced from the same mock
                      // rows the preview uses — so Value is a pick-list, not free text.
                      const colIdx = fcols.findIndex(([c]) => c === fc.column);
                      const valueOptions = colIdx < 0 ? [] : Array.from(new Set(
                        (MOCK_DATA[sg.tableName] ?? [])
                          .map(r => r[colIdx])
                          .filter((v): v is string | number => v !== null && v !== undefined)
                          .map(v => String(v))
                      )).sort();
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          <div>
                            <label style={labelStyle}>Filter name</label>
                            <input value={fc.name} onChange={e => setFilterConfig(c => ({ ...c, name: e.target.value }))} placeholder="e.g. Enterprise accounts only" style={fInput} onFocus={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.12)'; }} onBlur={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; }} />
                          </div>
                          <div style={{ borderTop: BORDER }} />
                          <div>
                            <label style={labelStyle}>Column</label>
                            <div style={selectWrap}>
                              <select value={fc.column} onChange={e => setFilterConfig(c => ({ ...c, column: e.target.value, value: '' }))} style={selectStyle}>
                                {fcols.length === 0 && <option value="">No columns</option>}
                                {fc.column === '' && <option value="">Select a column</option>}
                                {fcols.map(([c]) => <option key={c} value={c}>{c}</option>)}
                              </select>
                              {selectArrow}
                            </div>
                          </div>
                          <div>
                            <label style={labelStyle}>Condition</label>
                            <div style={selectWrap}>
                              <select value={fc.operator} onChange={e => setFilterConfig(c => ({ ...c, operator: e.target.value }))} style={selectStyle}>
                                <option value="=">equals</option>
                                <option value="!=">does not equal</option>
                                <option value=">">greater than</option>
                                <option value="<">less than</option>
                                <option value=">=">greater or equal</option>
                                <option value="<=">less or equal</option>
                                <option value="contains">contains</option>
                                <option value="is null">is null</option>
                                <option value="is not null">is not null</option>
                              </select>
                              {selectArrow}
                            </div>
                          </div>
                          {needsValue && (
                            <div>
                              <label style={labelStyle}>Value</label>
                              <div style={selectWrap}>
                                <select value={fc.value} onChange={e => setFilterConfig(c => ({ ...c, value: e.target.value }))} style={selectStyle} disabled={!fc.column}>
                                  <option value="">{fc.column ? 'Select a value' : 'Select a column first'}</option>
                                  {valueOptions.map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                                {selectArrow}
                              </div>
                            </div>
                          )}
                          {saveCancelRow({
                            disabled: !fc.column || (needsValue && !fc.value.trim()),
                            onSave: () => {
                              if (!fc.column || (needsValue && !fc.value.trim())) return;
                              setGroups(prev => prev.map(g => g.id === sg.id ? { ...g, steps: g.steps.map((s, i) => i === g.activeStep ? { ...s, filter: { name: fc.name.trim(), column: fc.column, operator: fc.operator, value: fc.value.trim() } } : s) } : g));
                              setEditingStepKey(null);
                            },
                            onCancel: savedFilter ? () => setEditingStepKey(null) : undefined,
                          })}
                        </div>
                      );
                    }

                    if (step.type === 'nullfix') {
                      const nc = nullFixConfig;
                      const savedFix = step.nullFix;
                      const thisKey = stepKey(sg.id, sg.activeStep);
                      const isEditing = editingStepKey === thisKey || !savedFix;
                      if (!isEditing && savedFix) {
                        return (
                          <div style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                              {summaryRow('Column', savedFix.column)}
                              {summaryRow('Fill value', savedFix.value)}
                            </div>
                            {editActionButton('Edit fix', () => {
                              setNullFixConfig(c => ({ ...c, column: savedFix.column, value: savedFix.value, applied: true }));
                              setEditingStepKey(thisKey);
                            })}
                          </div>
                        );
                      }
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
                              <select value={nc.column} onChange={e => setNullFixConfig(c => ({ ...c, column: e.target.value }))} style={selectStyle}>
                                {nullCols.length === 0 && <option value="">No columns with nulls</option>}
                                {nullCols.map(c => <option key={c.name} value={c.name}>{c.name} · {c.count} null{c.count === 1 ? '' : 's'}</option>)}
                              </select>
                              {selectArrow}
                            </div>
                          </div>

                          {/* Manual fill value / expression */}
                          <div>
                            <label style={labelStyle}>Fill value or expression</label>
                            <input value={nc.value} onChange={e => setNullFixConfig(c => ({ ...c, value: e.target.value }))} onFocus={nfFocus} onBlur={nfBlur} placeholder="e.g. 0, Unassigned, or an expression" style={nfInputStyle} />
                          </div>

                          {saveCancelRow({
                            disabled: !nc.value.trim(),
                            saveLabel: 'Save',
                            onSave: () => {
                              if (!nc.value.trim()) return;
                              setGroups(prev => prev.map(g => g.id === sg.id ? { ...g, steps: g.steps.map((s, i) => i === g.activeStep ? { ...s, nullFix: { column: nc.column, value: nc.value.trim() } } : s) } : g));
                              setEditingStepKey(null);
                            },
                            onCancel: savedFix ? () => setEditingStepKey(null) : undefined,
                          })}
                        </div>
                      );
                    }

                    if (step.type === 'formula') {
                      const fc = formulaConfig;
                      const savedFormulas = step.formulas ?? [];
                      const thisKey = stepKey(sg.id, sg.activeStep);
                      const isEditing = editingStepKey === thisKey || savedFormulas.length === 0;
                      if (!isEditing) {
                        return (
                          <div style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                              {savedFormulas.map((f, i) => summaryRow(f.col, <code style={{ fontFamily: "'SF Mono','Fira Mono',monospace" }}>{f.expr}</code>, `${f.col}_${i}`))}
                            </div>
                            {editActionButton('Add another column', () => {
                              setFormulaConfig({ colName: '', colNameTouched: false, aiDesc: '', aiActive: false, aiGenerating: false, expr: '' });
                              setEditingStepKey(thisKey);
                            }, ADD_PLUS_ICON)}
                          </div>
                        );
                      }
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
                            {showColError && <div style={{ fontSize: 11, color: '#E22B3D', marginTop: 4, fontWeight: 500, fontFamily: ff.primary }}>Required</div>}
                          </div>

                          {/* Build using AI */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                              <span style={labelStyle}>Build using AI</span>
                              <div title="Describe what you want in plain language — AI will write the expression for you" style={{ width: 14, height: 14, borderRadius: 99, border: '1.5px solid #A5ACB9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', flexShrink: 0 }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><text x="3.2" y="8" fontSize="8" fontWeight="700" fill="#A5ACB9">i</text></svg>
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
                                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: fc.aiDesc.trim() && !fc.aiGenerating ? '#2770EF' : '#E8ECEF', color: fc.aiDesc.trim() && !fc.aiGenerating ? '#fff' : '#A5ACB9', fontSize: 12, fontWeight: 600, cursor: fc.aiDesc.trim() && !fc.aiGenerating ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                  >
                                    {fc.aiGenerating
                                      ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="20 40" strokeLinecap="round"/></svg>Generating…</>
                                      : <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="currentColor"/></svg>Generate expression</>
                                    }
                                  </button>
                                  <button onClick={() => setFormulaConfig(f => ({ ...f, aiActive: false, aiDesc: '' }))} style={{ padding: '6px 10px', borderRadius: 6, border: BORDER, background: '#fff', color: '#777E8B', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setFormulaConfig(f => ({ ...f, aiActive: true }))}
                                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: '1.5px dashed #D6DBE5', borderRadius: 7, background: '#FAFBFC', color: '#A5ACB9', fontSize: 12, fontStyle: 'italic', cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: 6 }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#2770EF'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#D6DBE5'}
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="#A5ACB9"/></svg>
                                {fc.aiDesc || 'Describe your formula in plain language…'}
                              </button>
                            )}
                          </div>

                          <div style={{ borderTop: BORDER }} />

                          {/* Expression */}
                          <div style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={labelStyle}>Expression</span>
                              {fc.expr && <button onClick={() => setFormulaConfig(f => ({ ...f, expr: '' }))} style={{ background: 'none', border: 'none', color: '#A5ACB9', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: ff.primary }}>Clear</button>}
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
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#A5ACB9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, fontFamily: ff.primary }}>Examples</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {SAMPLE_EXPRS.map(s => (
                                  <button key={s.label} onClick={() => setFormulaConfig(f => ({ ...f, expr: s.expr }))}
                                    style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 6, border: BORDER, background: '#F6F8FA', cursor: 'pointer', fontFamily: ff.primary, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#EEF2FF'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.background = '#F6F8FA'; }}>
                                    <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>{s.label}</span>
                                    <code style={{ fontSize: 10, color: '#777E8B', fontFamily: "'SF Mono', 'Fira Mono', monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{s.expr}</code>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {saveCancelRow({
                            disabled: !fc.colName.trim() || !fc.expr.trim(),
                            saveLabel: 'Add column',
                            onSave: () => {
                              if (!fc.colName.trim() || !fc.expr.trim() || !selectedId) return;
                              const colName = fc.colName.trim();
                              const expr = fc.expr.trim();
                              // Add column to active step's cols + record it for the summary view
                              setGroups(prev => prev.map(g => {
                                if (g.id !== selectedId) return g;
                                const steps = g.steps.map((s, i) =>
                                  i === g.activeStep ? { ...s, cols: [...s.cols, [colName, 'FLOAT'] as [string, string]], formulas: [...(s.formulas ?? []), { col: colName, expr }] } : s
                                );
                                return { ...g, steps };
                              }));
                              setEditingStepKey(null);
                              // Open preview + scroll/highlight new column
                              setPreviewOpen(true);
                              setHighlightedCol(colName);
                              setTimeout(() => {
                                const el = previewScrollRef.current?.querySelector(`[data-col="${colName}"]`);
                                el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                              }, 60);
                              setTimeout(() => setHighlightedCol(null), 2500);
                            },
                            onCancel: savedFormulas.length > 0 ? () => setEditingStepKey(null) : undefined,
                          })}
                        </div>
                      );
                    }

                    if (step.type === 'sql') {
                      const sc = sqlConfig;
                      // Always the editor — a query is code, so there's no read-only
                      // rendering to step through before you can change it.
                      const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: BORDER, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#1D232F', fontFamily: ff.primary, outline: 'none', background: '#fff' };
                      const inputFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.10)'; };
                      const inputBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; };
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...(activeStepIsCode ? { flex: 1, minHeight: 0 } : {}) }}>
                          {/* Action strip — last run + Run (top) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1 }} />
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: sc.applied ? '#06BF7F' : '#777E8B', fontWeight: 500, fontFamily: ff.primary, whiteSpace: 'nowrap' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.applied ? '#06BF7F' : '#C0C6CF' }} />
                              {sc.applied ? 'Last run 1.28s ago' : 'Not run yet'}
                            </span>
                            <button
                              disabled={!sc.sql.trim()}
                              onClick={() => {
                                if (!sc.sql.trim() || !selectedId) return;
                                const sid = selectedId;
                                setSqlAtOpen(false);
                                triggerPreviewLoad();
                                const sqlText = sc.sql;
                                // Resolve @-referenced tables → the source cards this SQL derives from.
                                // Supports @word and @[Name With Spaces] (for display-named cards like "NPS (Pendo)").
                                // Forgiving match: normalize away spaces/parens/underscores/case, then match
                                // exact-or-contains, so @[NPS (Pendo)], @[NPS Pendo], @NPS all hit the "NPS Pendo" card.
                                const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                                const refNames = [...sqlText.matchAll(/@\[([^\]]+)\]|@(\w+)/g)].map(m => norm(m[1] ?? m[2] ?? '')).filter(Boolean);
                                const refGroups = groups.filter(g => {
                                  if (g.id === sid) return false;
                                  // Match the card's tableName AND its displayed name (a rename is stored as a step title),
                                  // so @[NPS] resolves even when the card was renamed from its original tableName.
                                  const names = [g.tableName, ...(g.steps ?? []).map(s => s.title)]
                                    .filter(Boolean).map(n => norm(n as string)).filter(Boolean);
                                  return refNames.some(r => names.some(gn => r === gn || gn.includes(r) || r.includes(gn)));
                                });
                                const mergedCols = refGroups.flatMap(g => g.steps[0]?.cols ?? []);
                                setGroups(prev => prev.map(g => {
                                  if (g.id !== sid) return g;
                                  const steps = g.steps.map((s, i) => i === g.activeStep
                                    ? { ...s, sql: sqlText, ...(mergedCols.length ? { cols: mergedCols } : {}) }
                                    : s);
                                  // Note: do NOT set inputIds here — that renders the gray block-flow wire.
                                  // The blue derive arrows are driven solely by deriveEdges below.
                                  return { ...g, steps };
                                }));
                                // Draw directional derive arrows from each referenced source card into this SQL card.
                                setDeriveEdges(prev => [
                                  ...prev.filter(e => e.toId !== sid),
                                  ...refGroups.map(r => ({ fromId: r.id, toId: sid })),
                                ]);
                                setSqlConfig(s => ({ ...s, applied: true }));
                                setPreviewOpen(true);
                                setEditingStepKey(null);
                              }}
                              style={{ padding: '6px 16px', borderRadius: 7, border: 'none', background: sc.sql.trim() ? '#2770EF' : '#E8ECEF', color: sc.sql.trim() ? '#fff' : '#A5ACB9', fontSize: 12.5, fontWeight: 600, cursor: sc.sql.trim() ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                            >
                              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 3l9 5-9 5V3z" fill="currentColor"/></svg>
                              Run
                            </button>
                            {step.sql && (
                              <button onClick={() => setEditingStepKey(null)} style={{ padding: '6px 10px', borderRadius: 7, border: BORDER, background: '#fff', color: '#64748B', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary, flexShrink: 0 }}>Cancel</button>
                            )}
                          </div>
                          {/* Build using AI — REMOVED */}
                          {false && (<>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                              <span style={labelStyle}>Build using AI</span>
                              <div title="Describe the query in plain language — AI will write the SQL for you" style={{ width: 14, height: 14, borderRadius: 99, border: '1.5px solid #A5ACB9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', flexShrink: 0 }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><text x="3.2" y="8" fontSize="8" fontWeight="700" fill="#A5ACB9">i</text></svg>
                              </div>
                            </div>
                            {sc.aiActive ? (
                              <div>
                                <textarea
                                  autoFocus
                                  value={sc.aiDesc}
                                  onChange={e => setSqlConfig(s => ({ ...s, aiDesc: e.target.value }))}
                                  onFocus={inputFocus}
                                  onBlur={inputBlur}
                                  placeholder="e.g. total revenue by region for the last 30 days"
                                  rows={3}
                                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                                />
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                  <button
                                    disabled={!sc.aiDesc.trim() || sc.aiGenerating}
                                    onClick={() => {
                                      setSqlConfig(s => ({ ...s, aiGenerating: true }));
                                      setTimeout(() => {
                                        const d = sc.aiDesc.toLowerCase();
                                        const gen = d.includes('per customer') || d.includes('most recent') || d.includes('latest') || d.includes('window') || d.includes('dedup') || d.includes('rank')
                                          ? 'SELECT customer_id, order_id, order_date, amount, status\nFROM (\n  SELECT *,\n    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn\n  FROM orders\n)\nWHERE rn = 1'
                                          : d.includes('region') || d.includes('revenue')
                                          ? 'SELECT region, SUM(amount) AS revenue\nFROM orders\nGROUP BY region\nORDER BY revenue DESC'
                                          : d.includes('join') || d.includes('customer') || d.includes('segment')
                                          ? 'SELECT o.*, c.segment\nFROM orders o\nJOIN customers c ON o.customer_id = c.customer_id'
                                          : d.includes('recent') || d.includes('last') || d.includes('30') || d.includes('day')
                                          ? 'SELECT * FROM orders\nWHERE order_date >= current_date - 30'
                                          : `-- ${sc.aiDesc}\nSELECT * FROM ${selectedGroup?.tableName ?? 'orders'}`;
                                        setSqlConfig(s => ({ ...s, aiGenerating: false, aiActive: false, sql: gen }));
                                      }, 1200);
                                    }}
                                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: sc.aiDesc.trim() && !sc.aiGenerating ? '#2770EF' : '#E8ECEF', color: sc.aiDesc.trim() && !sc.aiGenerating ? '#fff' : '#A5ACB9', fontSize: 12, fontWeight: 600, cursor: sc.aiDesc.trim() && !sc.aiGenerating ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                  >
                                    {sc.aiGenerating
                                      ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="20 40" strokeLinecap="round"/></svg>Generating…</>
                                      : <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="currentColor"/></svg>Generate SQL</>
                                    }
                                  </button>
                                  <button onClick={() => setSqlConfig(s => ({ ...s, aiActive: false, aiDesc: '' }))} style={{ padding: '6px 10px', borderRadius: 6, border: BORDER, background: '#fff', color: '#777E8B', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setSqlConfig(s => ({ ...s, aiActive: true }))}
                                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: '1.5px dashed #D6DBE5', borderRadius: 7, background: '#FAFBFC', color: '#A5ACB9', fontSize: 12, fontStyle: 'italic', cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: 6 }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#2770EF'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#D6DBE5'}
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="#A5ACB9"/></svg>
                                {sc.aiDesc || 'Describe the query in plain language…'}
                              </button>
                            )}
                          </div>

                          <div style={{ borderTop: BORDER }} />
                          </>)}

                          {/* SQL editor — type @ to reference another table and derive a combined table */}
                          <div ref={sqlEditorRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <CodeEditor
                              value={sc.sql}
                              onChange={v => {
                                setSqlConfig(s => ({ ...s, sql: v, applied: false }));
                                const m = v.match(/@(\w*)$/);
                                if (m) {
                                  setSqlAtOpen(true);
                                  setSqlAtQuery(m[1]);
                                  const ta = sqlEditorRef.current?.querySelector('textarea');
                                  if (ta) setSqlAtPoint(caretPoint(ta));
                                } else if (sqlAtOpen) { setSqlAtOpen(false); }
                              }}
                              placeholder={'SELECT *\nFROM @table_a\nJOIN @table_b ON …'}
                              minHeight={340}
                              language="sql"
                              fill
                            />
                            {sqlAtOpen && (() => {
                              const avail = groups
                                .filter(g => g.id !== selectedId)
                                .filter(g => g.tableName.toLowerCase().includes(sqlAtQuery.toLowerCase()));
                              return (
                                <AnchoredMenu open={sqlAtOpen} anchorRef={sqlEditorRef} anchorPoint={sqlAtPoint} onClose={() => setSqlAtOpen(false)} placement="bottom-start" gap={2} style={{ background: '#fff', border: '1px solid #E2E6EC', borderRadius: 8, boxShadow: '0 6px 24px rgba(25,35,49,0.13)', minWidth: 220, maxHeight: 240, overflowY: 'auto', padding: '4px 0' }}>
                                  <div style={{ padding: '5px 12px 4px', fontSize: 10, fontWeight: 700, color: '#A5ACB9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reference a table</div>
                                  {avail.length === 0 ? (
                                    <div style={{ padding: '8px 12px', fontSize: 12, color: '#A5ACB9' }}>No matching tables</div>
                                  ) : avail.map(g => (
                                    <button key={g.id}
                                      onClick={() => {
                                        // Bracket the reference when the card name isn't a bare word (spaces/parens) so it can be parsed back.
                                        const ref = /^\w+$/.test(g.tableName) ? `@${g.tableName} ` : `@[${g.tableName}] `;
                                        setSqlConfig(s => ({ ...s, sql: s.sql.replace(/@(\w*)$/, ref), applied: false }));
                                        setSqlAtOpen(false);
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 500, color: '#1D232F' }}
                                      onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                      <span style={{ color: '#64748B', display: 'flex', flexShrink: 0 }}><IconTable size={12} color="#64748B" /></span>
                                      {g.tableName}
                                      <span style={{ marginLeft: 'auto', fontSize: 10, color: g.sourceKind === 'csv' ? '#16A34A' : '#777E8B', fontWeight: 700, textTransform: 'uppercase' }}>{g.sourceKind === 'csv' ? 'CSV' : 'Source'}</span>
                                    </button>
                                  ))}
                                </AnchoredMenu>
                              );
                            })()}
                          </div>

                          {/* Run moved to action strip above */}
                        </div>
                      );
                    }

                    if (step.type === 'python') {
                      const pc = pythonConfig;
                      // Always the editor — see the SQL step above.
                      const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: BORDER, borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#1D232F', fontFamily: ff.primary, outline: 'none', background: '#fff' };
                      const inputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.10)'; };
                      const inputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; };
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, ...(activeStepIsCode ? { flex: 1, minHeight: 0 } : {}) }}>
                          {/* Action strip — runtime + Run */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ position: 'relative' }}>
                              <select
                                value={pc.pyVersion}
                                onChange={e => setPythonConfig(p => ({ ...p, pyVersion: e.target.value }))}
                                style={{ appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 6, padding: '5px 24px 5px 9px', fontSize: 11.5, fontFamily: ff.primary, fontWeight: 500, color: '#1D232F', background: '#fff', cursor: 'pointer', outline: 'none' }}
                              >
                                <option value="3.12">Python 3.12</option>
                                <option value="3.11">Python 3.11</option>
                                <option value="3.10">Python 3.10</option>
                              </select>
                              <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#A5ACB9' }}>
                                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </div>
                            </div>
                            <button
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 6, border: BORDER, background: '#fff', color: '#64748B', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F6F8FA'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                            >
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h7M3 8h7M3 11.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="11.5" y="3.5" width="2" height="9" rx="0.6" stroke="currentColor" strokeWidth="1.2"/></svg>
                              Libraries
                            </button>
                            <button
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 6, border: BORDER, background: '#fff', color: '#64748B', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}
                              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F6F8FA'}
                              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#fff'}
                            >
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="3.5" y="7" width="9" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" stroke="currentColor" strokeWidth="1.3"/></svg>
                              Secrets
                            </button>
                            <div style={{ flex: 1 }} />
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: pc.ran ? '#06BF7F' : '#777E8B', fontWeight: 500, fontFamily: ff.primary, whiteSpace: 'nowrap' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: pc.ran ? '#06BF7F' : '#C0C6CF' }} />
                              {pc.ran ? 'Last run 4.2s ago' : 'Not run yet'}
                            </span>
                            <button
                              disabled={!pc.code.trim()}
                              onClick={() => {
                                if (!pc.code.trim() || !selectedId) return;
                                triggerPreviewLoad();
                                const isApiPattern = /requests\.|urllib|api[_\-]?key|Authorization|Bearer|\.get\(http|\.post\(http/.test(pc.code);
                                const isFixed = /apiKey|Basic|base64|HTTPBasicAuth|Fixed:/.test(pc.code);
                                if (isApiPattern && !isFixed) {
                                  setPythonConfig(p => ({ ...p, error: `HTTPError: 401 Unauthorized\n\nTraceback (most recent call last):\n  File "<block>", line 8\n    response.raise_for_status()\nrequests.exceptions.HTTPError: 401 Client Error\n\nPendo requires an Integration Key passed as ?apiKey= query param — Bearer tokens in the Authorization header are not supported.`, ran: false }));
                                  setPreviewOpen(true);
                                  return;
                                }
                                const m = pc.code.match(/df\[["']([^"']+)["']\]\s*=/);
                                const colName = m?.[1] ?? '';
                                if (colName) {
                                  setGroups(prev => prev.map(g => {
                                    if (g.id !== selectedId) return g;
                                    if (g.steps[g.activeStep]?.cols.some(c => c[0] === colName)) return g;
                                    const steps = g.steps.map((s, i) =>
                                      i === g.activeStep ? { ...s, cols: [...s.cols, [colName, 'VARCHAR'] as [string, string]] } : s
                                    );
                                    return { ...g, steps };
                                  }));
                                  setHighlightedCol(colName);
                                  // Populate believable values so the new column isn't empty in the preview.
                                  const grp = groups.find(g => g.id === selectedId);
                                  if (grp) {
                                    const srcCols = (grp.steps[0]?.cols ?? []).map(c => c[0]);
                                    const srcRows = MOCK_DATA[grp.tableName] ?? [];
                                    const lc = colName.toLowerCase();
                                    let vals: (string | number | null)[] | null = null;
                                    if (lc.includes('sentiment')) {
                                      const scoreIdx = srcCols.findIndex(c => /nps|score/.test(c));
                                      const commentIdx = srcCols.findIndex(c => /comment/.test(c));
                                      vals = srcRows.map(r => {
                                        if (scoreIdx >= 0 && typeof r[scoreIdx] === 'number') { const s = r[scoreIdx] as number; return s >= 8 ? 'positive' : s >= 5 ? 'neutral' : 'negative'; }
                                        const c = commentIdx >= 0 ? String(r[commentIdx] ?? '') : '';
                                        if (/great|excellent|love|good|responsive|happy/i.test(c)) return 'positive';
                                        if (/confus|slow|bad|hard|need|poor|issue/i.test(c)) return 'negative';
                                        return 'neutral';
                                      });
                                    }
                                    if (vals) setDerivedCols(prev => ({ ...prev, [colName]: vals as (string | number | null)[] }));
                                  }
                                  setTimeout(() => {
                                    const el = previewScrollRef.current?.querySelector(`[data-col="${colName}"]`);
                                    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                  }, 60);
                                  setTimeout(() => setHighlightedCol(null), 2500);
                                }
                                const isApiDataBlock = /pd\.DataFrame\(response|df\s*=\s*pd\.DataFrame\(/.test(pc.code);
                                const hasSentiment = /sentiment/i.test(pc.code);
                                if (isApiDataBlock && selectedId) {
                                  setGroups(prev => prev.map(g => {
                                    if (g.id !== selectedId) return g;
                                    return { ...g, tableName: 'pendo_nps_enriched', steps: g.steps.map((s, i) => i === g.activeStep ? { ...s, cols: [['account_id','VARCHAR'],['nps_score','FLOAT'],['nps_comments','VARCHAR'],['sentiment','VARCHAR'],['sentiment_score','FLOAT'],['response_date','DATE']] as [string,string][] } : s) };
                                  }));
                                  // Fetch-only stubs the enriched schema but hides the sentiment columns until they're computed.
                                  // A combined fetch+sentiment cell computes them in the same run, so it falls through to the reveal below.
                                  if (!hasSentiment) setHiddenPreviewCols(prev => new Set([...prev, 'sentiment', 'sentiment_score']));
                                }
                                // Sentiment computed (standalone OR combined cell): reveal the columns and pulse them.
                                if (hasSentiment) {
                                  setHiddenPreviewCols(prev => { const n = new Set(prev); n.delete('sentiment'); n.delete('sentiment_score'); return n; });
                                  setHighlightedCol('sentiment_score');
                                  setTimeout(() => setHighlightedCol(null), 2500);
                                }
                                setPythonConfig(p => ({ ...p, ran: true, error: null, apiData: isApiDataBlock }));
                                setGroups(prev => prev.map(g => g.id === selectedId ? { ...g, steps: g.steps.map((s, i) => i === g.activeStep ? { ...s, pythonCode: pc.code } : s) } : g));
                                setPreviewOpen(true);
                                // Stay in the code after a run — it's a cell, not a form.
                                // Collapsing to a read-only block meant re-running an edit
                                // took a detour through "Edit code" (S11 is edit → re-run).
                                // First run fills the preview; every later run re-filters it.
                                setAwaitingRunIds(prev => { const n = new Set(prev); n.delete(selectedId); return n; });
                                // Canvas → agent: a script the agent wrote has actually
                                // been run, so it can now commit what it promised.
                                const ranTable = groups.find(g => g.id === selectedId)?.tableName;
                                if (ranTable) (window as any).__dsNotifyPythonRun__?.(ranTable);
                              }}
                              style={{ padding: '6px 16px', borderRadius: 7, border: 'none', background: pc.code.trim() ? '#2770EF' : '#E8ECEF', color: pc.code.trim() ? '#fff' : '#A5ACB9', fontSize: 12.5, fontWeight: 600, cursor: pc.code.trim() ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                            >
                              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 3l9 5-9 5V3z" fill="currentColor"/></svg>
                              Run
                            </button>
                            {step.pythonCode && (
                              <button onClick={() => setEditingStepKey(null)} style={{ padding: '6px 10px', borderRadius: 7, border: BORDER, background: '#fff', color: '#64748B', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary, flexShrink: 0 }}>Cancel</button>
                            )}
                          </div>
                          {/* On error the code editor stays code — full traceback + Fix with AI live in the results/preview panel (like any code editor). */}
                          {/* Build using AI — REMOVED */}
                          {false && (<>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                              <span style={labelStyle}>Build using AI</span>
                              <div title="Describe what you want in plain language — AI will write the Python for you" style={{ width: 14, height: 14, borderRadius: 99, border: '1.5px solid #A5ACB9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help', flexShrink: 0 }}>
                                <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><text x="3.2" y="8" fontSize="8" fontWeight="700" fill="#A5ACB9">i</text></svg>
                              </div>
                            </div>
                            {pc.aiActive ? (
                              <div>
                                <textarea
                                  autoFocus
                                  value={pc.aiDesc}
                                  onChange={e => setPythonConfig(p => ({ ...p, aiDesc: e.target.value }))}
                                  onFocus={inputFocus}
                                  onBlur={inputBlur}
                                  placeholder="e.g. run sentiment analysis on the comment column"
                                  rows={3}
                                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                                />
                                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                  <button
                                    disabled={!pc.aiDesc.trim() || pc.aiGenerating}
                                    onClick={() => {
                                      setPythonConfig(p => ({ ...p, aiGenerating: true }));
                                      setTimeout(() => {
                                        const d = pc.aiDesc.toLowerCase();
                                        const gen = d.includes('sentiment')
                                          ? 'from transformers import pipeline\nclf = pipeline("sentiment-analysis")\ndf["nps_sentiment"] = df["comment"].apply(\n    lambda c: clf(c)[0]["label"].lower() if c else "neutral"\n)'
                                          : d.includes('churn') || d.includes('score') || d.includes('predict')
                                          ? 'import joblib\nmodel = joblib.load("churn_v3.pkl")\ndf["churn_risk"] = model.predict_proba(df[FEATURES])[:, 1]'
                                          : d.includes('industry') || d.includes('enrich') || d.includes('api')
                                          ? 'import requests\ndf["industry"] = df["domain"].apply(\n    lambda d: requests.get(f"https://api.enrich.co/{d}").json().get("industry")\n)'
                                          : `# ${pc.aiDesc}\ndf["new_col"] = ...`;
                                        const suggestedCol = d.includes('sentiment') ? 'nps_sentiment' : d.includes('churn') || d.includes('score') ? 'churn_risk' : d.includes('industry') || d.includes('enrich') ? 'industry' : '';
                                        setPythonConfig(p => ({ ...p, aiGenerating: false, aiActive: false, code: gen, colName: p.colName || suggestedCol }));
                                      }, 1300);
                                    }}
                                    style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: pc.aiDesc.trim() && !pc.aiGenerating ? '#2770EF' : '#E8ECEF', color: pc.aiDesc.trim() && !pc.aiGenerating ? '#fff' : '#A5ACB9', fontSize: 12, fontWeight: 600, cursor: pc.aiDesc.trim() && !pc.aiGenerating ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                  >
                                    {pc.aiGenerating
                                      ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="20 40" strokeLinecap="round"/></svg>Generating…</>
                                      : <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="currentColor"/></svg>Generate Python</>
                                    }
                                  </button>
                                  <button onClick={() => setPythonConfig(p => ({ ...p, aiActive: false, aiDesc: '' }))} style={{ padding: '6px 10px', borderRadius: 6, border: BORDER, background: '#fff', color: '#777E8B', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setPythonConfig(p => ({ ...p, aiActive: true }))}
                                style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: '1.5px dashed #D6DBE5', borderRadius: 7, background: '#FAFBFC', color: '#A5ACB9', fontSize: 12, fontStyle: 'italic', cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: 6 }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#2770EF'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#D6DBE5'}
                              >
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.3 3.7L13 7l-3.7 1.3L8 12l-1.3-3.7L3 7l3.7-1.3L8 2z" fill="#A5ACB9"/></svg>
                                {pc.aiDesc || 'Describe what you want in plain language…'}
                              </button>
                            )}
                          </div>

                          <div style={{ borderTop: BORDER }} />
                          </>)}

                          {/* Python editor */}
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            <CodeEditor
                              value={pc.code}
                              onChange={v => setPythonConfig(p => ({ ...p, code: v, ran: false }))}
                              placeholder={'# df is the current table\ndf["new_col"] = ...'}
                              minHeight={340}
                              fill
                              focused={pythonFixReview}
                            />
                          </div>

                          {/* Agent fix review — accept keeps the updated code; reject restores the error */}
                          {pythonFixReview && (
                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                              <button onClick={rejectPythonFix} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'rgba(226,43,61,0.09)', color: '#E22B3D', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>Reject</button>
                              <button onClick={acceptPythonFix} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'rgba(6,191,127,0.12)', color: '#06BF7F', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>Accept</button>
                            </div>
                          )}

                          {/* Run moved to action strip above */}
                        </div>
                      );
                    }

                    /* All other step types — generic config placeholder */
                    return (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 4, background: tc.bg, color: tc.fg }}>{m.label}</span>
                          <span style={{ fontSize: 11, color: '#777E8B' }}>{m.desc}</span>
                        </div>
                        <div style={{ background: '#F6F8FA', border: BORDER, borderRadius: 8, padding: '20px 16px', textAlign: 'center' }}>
                          <div style={{ fontSize: 12, color: '#A5ACB9', fontWeight: 500 }}>
                            {step.label}
                          </div>
                          <div style={{ fontSize: 11, color: '#C0C6CF', marginTop: 4 }}>
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
  ) : null;

  const canvasViewport = (
    <div style={{ flex: 1, display: 'flex', minWidth: 0, minHeight: 0 }}>
    <div ref={canvasAreaRef} style={{
      flex: 1, position: 'relative', overflow: 'hidden',
      backgroundColor: '#EFF1F5',
      backgroundImage: 'radial-gradient(circle, #C2C9D4 1.2px, transparent 1.2px)',
      backgroundSize: '24px 24px',
    }}
      onClick={() => { setSelectedIds(new Set()); }}
      onDragOver={e => { e.preventDefault(); }}
      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && /\.csv$/i.test(f.name)) handleCsvFile(f); }}
    >
      {/* Floating operator toolbar — hidden in dataset2 mode (no op buttons, no Clean menu) */}
      {(opButtons.length > 0 || mode !== 'dataset2') && (
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', alignItems: 'center', gap: 6, width: 'max-content' }}>
        <div style={{ background: '#fff', border: '1px solid #E2E6EC', borderRadius: 10, boxShadow: '0 4px 20px rgba(25,35,49,0.12), 0 1px 4px rgba(25,35,49,0.06)', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
          {opButtons.map(({ label, op, icon }) => (
            <button key={label}
              onClick={e => {
                e.stopPropagation();
                if (op === 'join') {
                  // A join is a relationship between cards (an edge), never a block.
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
                  return;
                }
                // SQL / Python produce their own data → a new card. Every other transform
                // is table-level → it attaches as a chip on the selected card (Option 1 schema).
                if (isBlockMode && (op === 'sql' || op === 'python')) { addBlock(op); return; }
                setSingleJoinActive(false);
                setMultiJoinActive(false);
                addStep(op);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: RADIUS6, border: 'none', background: 'transparent', color: '#64748B', fontSize: 11.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: ff.primary }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
            >
              {icon}{label}
            </button>
          ))}
          {mode !== 'dataset2' && (<>
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
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M3.26665 4.13194H10.7333L10.3933 6.26547C10.3752 6.3502 10.3353 6.43034 10.2764 6.49997C10.2176 6.56959 10.1413 6.62692 10.0533 6.66771L8.26664 7.50093C8.15398 7.55241 8.06082 7.63066 7.99819 7.72639C7.93557 7.82213 7.90611 7.93134 7.91331 8.04107L8.29331 13.3909C8.29877 13.4692 8.28557 13.5476 8.25452 13.6214C8.22347 13.6951 8.17523 13.7626 8.11277 13.8197C8.05031 13.8767 7.97496 13.9222 7.89136 13.9532C7.80775 13.9842 7.71766 14.0001 7.62664 14H6.36665C6.27622 14.0001 6.18672 13.9843 6.10358 13.9536C6.02045 13.923 5.94542 13.8781 5.88306 13.8216C5.82069 13.7652 5.7723 13.6984 5.74083 13.6253C5.70936 13.5523 5.69546 13.4745 5.69998 13.3966L6.03331 8.03533C6.04049 7.92773 6.01241 7.82057 5.95229 7.72607C5.89217 7.63157 5.80243 7.55356 5.69332 7.50093L3.95332 6.67921C3.86495 6.63659 3.78901 6.57719 3.73126 6.5055C3.6735 6.43381 3.63545 6.35173 3.61999 6.26547L3.26665 4.13194ZM2.33332 0H4.01999L5.13332 0.826387L6.06665 0H11.6666L10.7333 3.30555H3.26665L2.33332 0Z" fill="currentColor"/></svg>
              Clean
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
                    <span style={{ fontSize: 11, color: '#777E8B', fontWeight: 400 }}>{item.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          </>)}
        </div>
      </div>
      )}

      {/* Undo / Redo + Zoom — bottom-right */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Tidy up — re-runs the layered layout on demand. Hand-placed cards are
            never moved automatically, so this is how you ask for it. */}
        {groups.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #E2E6EC', borderRadius: 7, padding: '3px 4px', boxShadow: '0 2px 8px rgba(25,35,49,0.08)' }}>
            <button
              onClick={() => arrangeCanvas()}
              title="Tidy up — arrange cards by their joins"
              style={{ height: 26, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 5, border: 'none', borderRadius: 4, background: 'transparent', color: '#64748B', cursor: 'pointer', fontFamily: ff.primary, fontSize: 12, fontWeight: 500 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F6F8FA'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="1.6" y="2.4" width="4.4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="1.6" y="9.6" width="4.4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="10" y="6" width="4.4" height="4" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M6 4.4h2a1 1 0 0 1 1 1V8M6 11.6h2a1 1 0 0 0 1-1V8M9 8h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Tidy up
            </button>
          </div>
        )}
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
      {groups.length === 0 && !isBlockMode && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: '#fff', border: '1px solid #E2E6EC', boxShadow: '0 2px 14px rgba(25,35,49,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777E8B', marginBottom: 2 }}>
            <IconDagEmpty />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1D232F' }}>Make your data AI ready</div>
          <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 1.65, maxWidth: 288 }}>
            Start by adding data from the data browser, or use the agent to look across your data.
          </div>
        </div>
      )}

      {/* Rich empty state — +Model flow only. Introduces the modelling capabilities. */}
      {groups.length === 0 && isBlockMode && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: ff.primary, overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 720, width: '100%' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1D232F', letterSpacing: '-0.3px', marginBottom: 8, textAlign: 'center' }}>
              Build an AI-ready model
            </div>
            <div style={{ fontSize: 13.5, color: '#64748B', textAlign: 'center', lineHeight: 1.6, maxWidth: 440, marginBottom: 24 }}>
              Bring raw tables onto the canvas, shape and join them with no SQL, and publish a model your team can ask questions of.
            </div>

            {/* Capabilities — compact horizontal cards: icon beside a title + one-line desc */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                {
                  title: 'Add tables',
                  desc: 'Pull from any source and join',
                  tint: '#EAF1FF', fg: '#2770EF',
                  icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="3.5" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M2.5 7.5h15M7 7.5v9M13 7.5v9" stroke="currentColor" strokeWidth="1.4"/></svg>,
                },
                {
                  title: 'Preview instantly',
                  desc: 'Live row-level previews',
                  tint: '#E6F8F0', fg: '#06BF7F',
                  icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.6"/></svg>,
                },
                {
                  title: 'Spreadsheet edits',
                  desc: 'Formulas & data cleanup',
                  tint: '#F1EAFE', fg: '#8B5CF6',
                  icon: <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="2.5" y="2.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M2.5 7.5h15M2.5 12.5h15M7.5 2.5v15" stroke="currentColor" strokeWidth="1.4"/></svg>,
                },
              ].map(card => (
                <div key={card.title} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fff', border: '1px solid #EDEFF3', borderRadius: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: card.tint, color: card.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {card.icon}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap' }}>{card.title}</div>
                    <div style={{ fontSize: 11.5, color: '#8B96A5', whiteSpace: 'nowrap' }}>{card.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pannable layer — nodes + edges translated together so the selected node stays centered when the panel opens */}
      <div style={{ position: 'absolute', inset: 0, transform: `translate(${pan.x}px, ${pan.y}px)`, transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)', cursor: pickMode ? 'copy' : undefined }}>
      {/* Canvas nodes (dataset mode — Option 1 only) */}
      {!isBlockMode && groups.map(group => (
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

      {/* Canvas nodes + edges (block-flow mode — Options 2 & 3) */}
      {isBlockMode && (
        <>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            <defs>
              <marker id="blk-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z" fill="#8B96A5" />
              </marker>
            </defs>
            {groups.flatMap(g => (g.inputIds ?? []).map(srcId => {
              const s = groups.find(x => x.id === srcId);
              if (!s) return null;
              const sx = s.x + CARD_W, sy = s.y + BLOCK_H / 2;
              const tx = g.x, ty = g.y + BLOCK_H / 2;
              // Short horizontal nub out of each boundary (capped) so the wire leaves the card cleanly
              // without swooping when the target is to the left or above.
              const k = Math.min(72, Math.max(30, Math.abs(tx - sx) / 2));
              return <path key={`${srcId}-${g.id}`} d={`M ${sx} ${sy} C ${sx + k} ${sy}, ${tx - k} ${ty}, ${tx} ${ty}`} stroke="#8B96A5" strokeWidth={1.6} fill="none" markerEnd="url(#blk-arrow)" />;
            }))}
            {wiring && (() => {
              const s = groups.find(x => x.id === wiring.fromId);
              if (!s) return null;
              const sx = s.x + CARD_W, sy = s.y + BLOCK_H / 2;
              // Cursor coords are canvas-area-relative; this wire is drawn inside the panned
              // wrapper, so shift the endpoint by -pan to land under the actual cursor.
              const ex = wiring.cx - pan.x, ey = wiring.cy - pan.y;
              // Cap the control offset so dragging up/left gives a clean curve, not a big swoop.
              const k = Math.min(72, Math.max(30, Math.abs(ex - sx) / 2));
              return <path d={`M ${sx} ${sy} C ${sx + k} ${sy}, ${ex - k} ${ey}, ${ex} ${ey}`} stroke="#2770EF" strokeWidth={1.8} strokeDasharray="5 3" fill="none" />;
            })()}
          </svg>
          {groups.map(group => (
            <BlockNode
              key={group.id}
              poc={poc}
              group={group}
              selected={selectedIds.has(group.id)}
              wiring={wiring?.overId === group.id}
              onSelect={(shift) => {
                if (shift) setSelectedIds(prev => { const next = new Set(prev); if (next.has(group.id)) next.delete(group.id); else next.add(group.id); return next; });
                // Clicking the block opens the block's own details (step 0); chip clicks open the chip's details.
                else { setSelectedIds(new Set([group.id])); setActiveStep(group.id, 0); setPreviewOpen(true); }
              }}
              onMove={(x, y) => moveNode(group.id, x, y)}
              onRemove={() => { removeNode(group.id); setGroups(prev => prev.map(g => ({ ...g, inputIds: (g.inputIds ?? []).filter(id => id !== group.id) }))); }}
              onWireStart={(cx, cy) => wireStart(group.id, cx, cy)}
              onWireMove={(cx, cy) => wireMove(cx, cy)}
              onWireEnd={(cx, cy) => wireEnd(group.id, cx, cy)}
              onAction={(op, isPrep) => {
                if (isPrep) { handlePrepStep(op, group.id); return; }
                if (op === 'join') {
                  setSelectedIds(new Set([group.id]));
                  setJoinConfig({ name: '', table2: '', col1: '', col2: '', joinType: 'inner', cardinality: 'many_to_one', extraPairs: [] });
                  setSingleJoinActive(true);
                  setMultiJoinActive(false);
                  setPreviewOpen(true);
                  return;
                }
                if (op === 'sql' || op === 'python') { handleCodeStep(op, group.id); return; }
                addStep(op, false, group.id);
              }}
              onStepClick={(i) => { setActiveStep(group.id, i); setSelectedIds(new Set([group.id])); setPreviewOpen(true); }}
              onRemoveStep={(i) => removeNodeStep(group.id, i)}
            />
          ))}
        </>
      )}

      {/* Join lines — one orthogonal path per join, routed through the column
          gutter. Geometry comes from joinGeometry so the badge below sits on the
          line it belongs to. */}
      {canvasJoins.length > 0 && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          {canvasJoins.map(j => {
            const geo = joinGeometry.get(j.id);
            if (!geo) return null;
            const selected = selectedIds.has(j.id);
            return (
              <g key={j.id}>
                <path
                  d={geo.d}
                  stroke={selected ? '#1E5FD8' : '#2770EF'}
                  strokeWidth={selected ? 2.2 : 1.5}
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx={geo.from.x} cy={geo.from.y} r="2.5" fill="#2770EF" />
                <circle cx={geo.to.x} cy={geo.to.y} r="2.5" fill="#2770EF" />
              </g>
            );
          })}
        </svg>
      )}

      {/* Derive edges — directional data-flow arrows (source card → SQL-derived card). Blue + arrowhead, distinct from the gray join connectors. */}
      {deriveEdges.length > 0 && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <marker id="ds-derive-arrow" markerWidth="9" markerHeight="9" refX="6.5" refY="3" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0 0 L6.5 3 L0 6 Z" fill="#D0D6DF" />
            </marker>
          </defs>
          {deriveEdges.map((e, i) => {
            const from = groups.find(g => g.id === e.fromId);
            const to = groups.find(g => g.id === e.toId);
            if (!from || !to) return null;
            // Real widths from the same measured-size state the join connectors use
            // (so the arrow starts at the actual edge — cards grow past 180px — and
            // never lags a frame behind when a card's content changes its size).
            const fromW = cardSizes[from.id]?.w ?? BLOCK_W;
            const toW = cardSizes[to.id]?.w ?? BLOCK_W;
            const fromLeftOfTo = from.x + fromW / 2 <= to.x + toW / 2;
            const sx = fromLeftOfTo ? from.x + fromW : from.x;
            const sy = from.y + 20;
            const tx = fromLeftOfTo ? to.x : to.x + toW;
            const ty = to.y + 20;
            const mx = (sx + tx) / 2;
            return (
              <g key={`${e.fromId}-${e.toId}-${i}`}>
                <path d={`M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`} stroke="#D0D6DF" strokeWidth="1.6" fill="none" markerEnd="url(#ds-derive-arrow)" />
              </g>
            );
          })}
        </svg>
      )}

      {/* Join blocks */}
      {canvasJoins.map(j => {
        const joinLabel: Record<string, string> = { inner: 'Inner', full_outer: 'Full Outer', left_outer: 'Left Outer', right_outer: 'Right Outer' };
        const cardLabel: Record<string, string> = { many_to_one: 'M:1', one_to_many: '1:M', one_to_one: '1:1' };
        const selected = selectedIds.has(j.id);
        const geo = joinGeometry.get(j.id);
        // Sit on the line unless the user has dragged this badge somewhere.
        const placed = j.moved || !geo ? j : { ...j, x: geo.badge.x, y: geo.badge.y };
        return (
          <JoinBlockCard
            key={j.id}
            join={placed}
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
            onMove={(x, y) => setCanvasJoins(prev => prev.map(jj => jj.id === j.id ? { ...jj, x, y, moved: true } : jj))}
            onRemove={() => { setCanvasJoins(prev => prev.filter(jj => jj.id !== j.id)); setSelectedIds(new Set()); }}
          />
        );
      })}
      </div>

      {/* Overview minimap removed */}
    </div>

      {propertiesPanel}
    </div>
  );

  // Resolve the rows for a card. A SQL-derived card (tableName "SQL") has no static
  // MOCK_DATA — its rows are the positional merge of its @-referenced inputs. A source
  // card whose display name isn't a data key (e.g. "NPS (Pendo)") is matched to a real
  // mock table by identical columns, so we reuse real rows without inventing data.
  // Component-scoped (not just previewPanel-local) so the Data tab can reuse it too.
  const rowsForCard = (g: CanvasGroup | null | undefined, rowCap: number): Row[] => {
    if (!g) return [];
    const inputs = deriveEdges
      .filter(e => e.toId === g.id)
      .map(e => groups.find(gg => gg.id === e.fromId))
      .filter(Boolean) as CanvasGroup[];
    if (inputs.length > 0) {
      const per = inputs.map(gi => rowsForCard(gi, rowCap));
      const n = Math.max(0, ...per.map(r => r.length));
      return Array.from({ length: Math.min(n, rowCap) }, (_, i) =>
        inputs.flatMap((gi, gj) => per[gj][i] ?? (gi.steps[0]?.cols ?? []).map(() => null))
      );
    }
    // Row filters written into a code step narrow the preview (S11) — applied
    // before the cap, so the count reflects the filter rather than the cap.
    const withFilters = (base: Row[]): Row[] => {
      const cols = g.steps[0]?.cols ?? [];
      const upto = g.steps.slice(0, (g.activeStep ?? 0) + 1);
      const filtered = upto.reduce(
        (acc, s) => applyCodeRowFilters(s.pythonCode ?? s.sql, cols, acc),
        base
      );
      return filtered.slice(0, rowCap);
    };

    if (MOCK_DATA[g.tableName]) return withFilters(MOCK_DATA[g.tableName]);
    // Fallback: match a mock table with the same columns (handles display-named sources).
    const sig = (g.steps[0]?.cols ?? []).map(c => c[0]).join('|');
    const match = sig ? Object.keys(MOCK_DATA).find(k => (TABLE_COLS[k] ?? []).map(c => c[0]).join('|') === sig) : undefined;
    return match ? withFilters(MOCK_DATA[match]) : [];
  };

  // ── Preview panel ───────────────────────────────────────────────────────────

  const allModelCols = groups.flatMap(g => {
    const srcCols = g.steps[0]?.cols ?? [];
    return srcCols.map(([col, type]) => ({ table: g.tableName, col, type }));
  });

  const colEditKey = (table: string, col: string, field: string) => `${table}__${col}__${field}`;
  const modelColKey = (table: string, col: string) => `${table}__${col}`;
  // Columns currently in the model (the rows the table shows) vs. removed ones
  // available to add back. Removed columns grouped by table for the Add-column picker.
  const includedCols = allModelCols.filter(({ table, col }) => !removedModelCols.has(modelColKey(table, col)));
  const availableCols = allModelCols.filter(({ table, col }) => removedModelCols.has(modelColKey(table, col)));
  const availableByTable = availableCols.reduce<Record<string, typeof availableCols>>((acc, c) => {
    (acc[c.table] ??= []).push(c);
    return acc;
  }, {});
  const toggleSelectCol = (table: string, col: string) => {
    setSelectedModelCols(prev => {
      const next = new Set(prev);
      const k = modelColKey(table, col);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };
  const removeSelectedCols = () => {
    setRemovedModelCols(prev => new Set([...prev, ...selectedModelCols]));
    setSelectedModelCols(new Set());
  };
  const addColBack = (table: string, col: string) => {
    setRemovedModelCols(prev => {
      const next = new Set(prev);
      next.delete(modelColKey(table, col));
      return next;
    });
  };

  const COL_TYPE_DEFAULTS: Record<string, string> = {
    INT: 'MEASURE', FLOAT: 'MEASURE', BIGINT: 'MEASURE',
    VARCHAR: 'ATTRIBUTE', TEXT: 'ATTRIBUTE', TIMESTAMP: 'ATTRIBUTE', DATE: 'ATTRIBUTE',
  };

  // Helpers for inline diffs in the columns view
  const airIsAllReview = airFixReview === '__all__';
  const airCheckActive = (checkId: string) => airFixReview === checkId || airIsAllReview;
  const airGetRowForCheck = (checkId: string, col: string) =>
    (AIR_FIX_REVIEW[checkId]?.rows ?? []).find(r => r.col === col);
  // Maps the editable field name to the AIR check that affects it
  const FIELD_TO_CHECK: Record<string, string> = { desc: 'coldesc', aicontext: 'desc', synonyms: 'synonyms' };

  const testView = (
    <TestView
      tables={groups.map(g => ({ name: g.tableName, cols: TABLE_COLS[g.tableName] ?? [] }))}
      onFixWithAI={onTestFixWithAI as never}
    />
  );

  // Shared column-table renderer — same fields/interactions as the Columns tab
  // (checkbox, name, table, data type, column type, indexed toggle, description,
  // AI context, synonyms), parameterized by which rows to show so the Semantic
  // preview (model level = every row; node level = just that table's/join's rows)
  // can render identically instead of a slimmer bespoke table.
  // Add formula / Add column (available, by table) — shared between the standalone
  // Columns tab's toolbar and the compact preview panel's header (Semantic mode).
  const renderAddActions = (opts: { compact?: boolean } = {}) => {
    const compact = opts.compact ?? false;
    const iconBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 24, padding: 0, borderRadius: 5, border: 'none', background: 'transparent', color: '#1D232F', cursor: 'pointer', fontFamily: ff.primary };
    return (
    <>
      <button
        onClick={() => { setModelFormulaDraft({ id: null, name: '', expr: '' }); setFormulaModalOpen(true); }}
        title="Add formula"
        style={compact
          ? iconBtnStyle
          : { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, border: '1px solid #D8DDE5', background: '#fff', color: '#1D232F', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary, whiteSpace: 'nowrap' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F6F8FA')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = compact ? 'transparent' : '#fff')}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        {!compact && 'Add formula'}
      </button>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setAddColMenuOpen(o => !o)}
          title="Add column"
          style={compact
            ? iconBtnStyle
            : { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, border: '1px solid #D8DDE5', background: '#fff', color: '#1D232F', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary, whiteSpace: 'nowrap' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F6F8FA')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = compact ? 'transparent' : '#fff')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {!compact && 'Add column'}
          {!compact && <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 1 }}><path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>
        {addColMenuOpen && (
          <>
            <div onClick={() => setAddColMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 260, maxHeight: 360, overflowY: 'auto', background: '#fff', border: '1px solid #E2E6EC', borderRadius: 8, boxShadow: '0 8px 24px rgba(16,24,40,0.14)', zIndex: 41, padding: 4 }}>
              {availableCols.length === 0 ? (
                <div style={{ padding: '14px 12px', fontSize: 12, color: '#A5ACB9', fontFamily: ff.primary, textAlign: 'center' }}>All available columns are in the model</div>
              ) : (
                Object.entries(availableByTable).map(([table, cols]) => (
                  <div key={table}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px 4px', fontSize: 10.5, fontWeight: 700, color: '#8B96A5', letterSpacing: '0.03em' }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5h10M1 8h10M4 5v5M8 5v5" stroke="currentColor" strokeWidth="1"/></svg>
                      {table.toUpperCase()}
                    </div>
                    {cols.map(({ col }) => (
                      <button
                        key={modelColKey(table, col)}
                        onClick={() => { addColBack(table, col); if (availableCols.length === 1) setAddColMenuOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 10px', border: 'none', background: 'transparent', borderRadius: 5, cursor: 'pointer', fontFamily: ff.primary }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F0F5FF')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ color: '#2770EF', flexShrink: 0 }}><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap' }}>{col}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
    );
  };

  const renderColumnsTable = (rowsToShow: { table: string; col: string; type: string }[], opts: { showFormulas?: boolean; showToolbar?: boolean } = {}) => {
    const showFormulas = opts.showFormulas ?? true;
    const showToolbar = opts.showToolbar ?? true;
    const scopeSelected = rowsToShow.filter(({ table, col }) => selectedModelCols.has(modelColKey(table, col)));
    const allVisibleSelectedScoped = rowsToShow.length > 0 && scopeSelected.length === rowsToShow.length;
    const someVisibleSelectedScoped = scopeSelected.length > 0;
    return (
      <>
      {/* Toolbar — bulk Remove (of selected rows) + Add column (available, by table) */}
      {showToolbar && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#fff', borderBottom: '1px solid #EAEDF2', flexShrink: 0 }}>
        {selectedModelCols.size > 0 && (
          <span style={{ fontSize: 12, color: '#1D232F', fontWeight: 600, fontFamily: ff.primary }}>{selectedModelCols.size} selected</span>
        )}
        <div style={{ flex: 1 }} />
        {selectedModelCols.size > 0 && (
          <Button variant="secondary" size="small" onClick={removeSelectedCols}>
            {`Remove${selectedModelCols.size > 1 ? ` (${selectedModelCols.size})` : ''}`}
          </Button>
        )}
        {renderAddActions()}
      </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff.primary, fontSize: 12 }}>
          <thead>
            <tr style={{ boxShadow: '0 1px 0 #EAEDF2' }}>
              <th style={{ position: 'sticky', top: 0, zIndex: 3, padding: '8px 12px', textAlign: 'center', width: 40, minWidth: 40, borderBottom: '1px solid #EAEDF2', background: '#fff' }}>
                <input
                  type="checkbox"
                  checked={allVisibleSelectedScoped}
                  ref={el => { if (el) el.indeterminate = someVisibleSelectedScoped && !allVisibleSelectedScoped; }}
                  onChange={e => setSelectedModelCols(prev => {
                    const next = new Set(prev);
                    rowsToShow.forEach(({ table, col }) => {
                      const k = modelColKey(table, col);
                      if (e.target.checked) next.add(k); else next.delete(k);
                    });
                    return next;
                  })}
                  title={allVisibleSelectedScoped ? 'Deselect all' : 'Select all'}
                  style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#2770EF' }}
                />
              </th>
              {[
                { label: 'Column name', width: 160 },
                { label: 'Table', width: 100 },
                { label: 'Data type', width: 90 },
                { label: 'Column type', width: 100 },
                { label: 'Indexed', width: 70 },
                { label: 'Description', width: 200 },
                { label: 'AI context', width: 200 },
                { label: 'Synonyms', width: 180 },
              ].map(({ label, width }) => {
                // Highlight header if any active review touches this column
                const checkForLabel: Record<string, string> = {
                  'Description': 'coldesc', 'AI context': 'desc', 'Synonyms': 'synonyms',
                  'Indexed': 'indexing', 'Column type': 'col_types', 'Data type': 'date_vals',
                };
                const hdrCheck = checkForLabel[label];
                const hdrActive = hdrCheck && airCheckActive(hdrCheck);
                return (
                  <th key={label} style={{ position: 'sticky', top: 0, zIndex: 3, padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: hdrActive ? '#92640A' : '#777E8B', whiteSpace: 'nowrap', borderBottom: hdrActive ? '2px solid rgba(252,200,56,0.5)' : '1px solid #EAEDF2', width, minWidth: width, letterSpacing: '0.02em', background: hdrActive ? 'rgba(252,200,56,0.06)' : '#fff', transition: 'all 150ms' }}>
                    {label.toUpperCase()}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rowsToShow.map(({ table, col, type }, idx) => {
              const indexed = indexedCols.has(`${table}__${col}`);
              const colType = COL_TYPE_DEFAULTS[type] ?? 'ATTRIBUTE';
              const isSelected = selectedModelCols.has(modelColKey(table, col));
              const rowBg = isSelected ? '#EEF4FF' : idx % 2 === 0 ? '#fff' : '#FAFBFC';

              // Per-row diff helpers
              const indexingRow = airCheckActive('indexing') ? airGetRowForCheck('indexing', col) : null;
              const indexingAccepted = airAccepted['indexing']?.[col];
              const colTypeRow = airCheckActive('col_types') ? airGetRowForCheck('col_types', col) : null;
              const colTypeAccepted = airAccepted['col_types']?.[col];
              const dateValsRow = airCheckActive('date_vals') ? airGetRowForCheck('date_vals', col) : null;
              const dateValsAccepted = airAccepted['date_vals']?.[col];

              const renderEditCell = (field: string, placeholder: string) => {
                const checkId = FIELD_TO_CHECK[field];
                const key = colEditKey(table, col, field);
                const val = colEdits[key] ?? '';
                const isEditing = editingCell === key;

                // Accepted value: show as plain text (no indicator)
                const accepted = checkId ? airAccepted[checkId]?.[col] : undefined;
                if (accepted) {
                  return (
                    <td key={field} style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'top', maxWidth: 200 }}>
                      <span style={{ fontSize: 12, color: '#1D232F', lineHeight: 1.45 }}>{accepted}</span>
                    </td>
                  );
                }

                // Active review: show amber diff
                const reviewRow = checkId && airCheckActive(checkId) ? airGetRowForCheck(checkId, col) : null;
                if (reviewRow) {
                  return (
                    <td key={field} style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'top', maxWidth: 200, background: 'rgba(252,200,56,0.10)' }}>
                      {reviewRow.current !== '—' && (
                        <div style={{ fontSize: 10.5, color: '#A5ACB9', textDecoration: 'line-through', lineHeight: '14px', marginBottom: 3 }}>{reviewRow.current}</div>
                      )}
                      <span style={{ fontSize: 12, color: '#1D232F', lineHeight: 1.45 }}>{reviewRow.proposed}</span>
                    </td>
                  );
                }

                // Editing
                if (isEditing) {
                  return (
                    <td key={field} style={{ padding: '4px 8px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'top' }}>
                      <textarea
                        autoFocus
                        defaultValue={val}
                        onBlur={e => {
                          setColEdits(prev => ({ ...prev, [key]: e.target.value }));
                          setEditingCell(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Escape') setEditingCell(null);
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            setColEdits(prev => ({ ...prev, [key]: (e.target as HTMLTextAreaElement).value }));
                            setEditingCell(null);
                          }
                        }}
                        style={{ width: '100%', minHeight: 52, resize: 'vertical', fontFamily: ff.primary, fontSize: 12, color: '#1D232F', border: '1.5px solid #2770EF', borderRadius: 5, padding: '5px 8px', outline: 'none', boxShadow: '0 0 0 3px rgba(39,112,239,0.10)', background: '#fff', lineHeight: 1.45 }}
                      />
                    </td>
                  );
                }

                // Normal read / placeholder
                return (
                  <td key={field} onClick={() => setEditingCell(key)}
                    style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', cursor: 'text', verticalAlign: 'top', maxWidth: 200 }}
                  >
                    {val
                      ? <span style={{ color: '#1D232F', lineHeight: 1.45, display: 'block' }}>{val}</span>
                      : <span style={{ color: '#C0C6CF', fontStyle: 'italic' }}>{placeholder}</span>}
                  </td>
                );
              };

              // Derive display values with diff awareness
              const displayColType = colTypeAccepted ?? (colTypeRow ? colTypeRow.proposed : colType);
              const colTypeDiffed = !!(colTypeRow && !colTypeAccepted);

              const displayDataType = dateValsAccepted ?? (dateValsRow ? dateValsRow.proposed : type);
              const dataTypeDiffed = !!(dateValsRow && !dateValsAccepted);

              const displayIndexed = indexingAccepted
                ? indexingAccepted === 'On'
                : indexingRow
                  ? indexingRow.proposed === 'On'
                  : indexed;
              const indexDiffed = !!(indexingRow && !indexingAccepted);
              const indexAcceptedVal = !!indexingAccepted;

              // data-model-col is the DOM hook readiness fixes use to spotlight a
              // column and draw an inline before→after diff on it. React `key` never
              // reaches the DOM, so without this the row can't be found.
              return (
                <tr key={`${table}-${col}-${idx}`} data-model-col={modelColKey(table, col)} style={{ background: rowBg }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isSelected ? '#E4EEFF' : '#F0F5FF'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = rowBg}
                >
                  {/* Row selection checkbox */}
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', textAlign: 'center', verticalAlign: 'middle' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectCol(table, col)}
                      title={isSelected ? 'Deselect' : 'Select'}
                      style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#2770EF' }}
                    />
                  </td>
                  {/* Column name */}
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{col}</td>
                  {/* Table badge */}
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'middle' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(39,112,239,0.07)', color: '#2770EF', whiteSpace: 'nowrap' }}>
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1 5h10M1 8h10M4 5v5M8 5v5" stroke="currentColor" strokeWidth="1"/></svg>
                      {table}
                    </span>
                  </td>
                  {/* Data type — diff-aware */}
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'middle', background: dataTypeDiffed ? 'rgba(252,200,56,0.10)' : 'transparent' }}>
                    {dataTypeDiffed && <div style={{ fontSize: 10, color: '#A5ACB9', textDecoration: 'line-through', marginBottom: 2 }}>{type}</div>}
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', padding: '2px 6px', borderRadius: 3, background: '#F0F2F6', whiteSpace: 'nowrap' }}>{displayDataType}</span>
                  </td>
                  {/* Column type — diff-aware */}
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'middle', background: colTypeDiffed ? 'rgba(252,200,56,0.10)' : 'transparent' }}>
                    {colTypeDiffed && <div style={{ fontSize: 10, color: '#A5ACB9', textDecoration: 'line-through', marginBottom: 2 }}>{colType}</div>}
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 3, whiteSpace: 'nowrap', color: displayColType.includes('MEASURE') || displayColType.includes('measure') ? '#06BF7F' : '#64748B', background: displayColType.includes('MEASURE') || displayColType.includes('measure') ? 'rgba(6,191,127,0.09)' : '#F0F2F6' }}>{displayColType}</span>
                  </td>
                  {/* Indexed toggle — diff-aware */}
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'middle', background: indexDiffed ? 'rgba(252,200,56,0.10)' : 'transparent' }}>
                    {indexDiffed && <div style={{ fontSize: 10, color: '#A5ACB9', textDecoration: 'line-through', marginBottom: 3 }}>Off</div>}
                    <div>
                      <button
                        onClick={() => {
                          if (indexDiffed || indexAcceptedVal) return;
                          setIndexedCols(prev => {
                            const next = new Set(prev);
                            const k = `${table}__${col}`;
                            if (next.has(k)) next.delete(k); else next.add(k);
                            return next;
                          });
                        }}
                        style={{ width: 32, height: 18, borderRadius: 9, border: 'none', cursor: indexDiffed || indexAcceptedVal ? 'default' : 'pointer', background: displayIndexed ? '#2770EF' : '#D1D5DB', position: 'relative', transition: 'background 150ms', padding: 0 }}
                      >
                        <span style={{ position: 'absolute', top: 2, left: displayIndexed ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 150ms', boxShadow: '0 1px 2px rgba(0,0,0,0.18)', display: 'block' }} />
                      </button>
                    </div>
                  </td>
                  {renderEditCell('desc', 'Click to add description')}
                  {renderEditCell('aicontext', 'Click to add AI context')}
                  {renderEditCell('synonyms', 'Click to add synonyms')}
                </tr>
              );
            })}
            {/* Model-level formula rows — calculated columns owned by the whole model */}
            {showFormulas && modelFormulas.map((f, i) => (
              <tr key={`formula-${f.id}`} style={{ background: 'rgba(6,191,127,0.045)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(6,191,127,0.09)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(6,191,127,0.045)'}
              >
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', textAlign: 'center', verticalAlign: 'middle' }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: '#047857' }}><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', fontWeight: 600, color: '#1D232F', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{f.name}</td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'middle' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(6,191,127,0.1)', color: '#047857', whiteSpace: 'nowrap' }}>Model formula</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'middle' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', padding: '2px 6px', borderRadius: 3, background: '#F0F2F6', whiteSpace: 'nowrap' }}>FLOAT</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'middle' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 3, whiteSpace: 'nowrap', color: '#06BF7F', background: 'rgba(6,191,127,0.09)' }}>MEASURE</span>
                </td>
                <td style={{ padding: '8px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'middle', color: '#C0C6CF' }}>—</td>
                <td colSpan={3} style={{ padding: '6px 12px', borderBottom: '1px solid #EAEDF2', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <code style={{ flex: 1, fontFamily: "'SF Mono','Fira Mono',monospace", fontSize: 11, color: '#1D232F', background: '#F6F8FA', border: '1px solid #EAEDF2', borderRadius: 5, padding: '4px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.expr}</code>
                    <button
                      onClick={() => { setModelFormulaDraft({ id: f.id, name: f.name, expr: f.expr }); setFormulaModalOpen(true); }}
                      title="Edit formula"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 5, border: '1px solid #E2E6EC', background: '#fff', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F6F8FA')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11.5 2.5l2 2-7.5 7.5-2.5.5.5-2.5 7.5-7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button
                      onClick={() => setModelFormulas(prev => prev.filter((_, j) => j !== i))}
                      title="Delete formula"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 5, border: '1px solid #F3C6C6', background: '#fff', color: '#D64545', cursor: 'pointer', flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FDF2F2')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2.5 3.5h9M5.5 3.5V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M4 3.5l.5 8a1 1 0 0 0 1 .9h3a1 1 0 0 0 1-.9l.5-8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rowsToShow.length === 0 && (!showFormulas || modelFormulas.length === 0) && (
              <tr>
                <td colSpan={9} style={{ padding: '40px 16px', textAlign: 'center', color: '#A5ACB9', fontSize: 12, fontFamily: ff.primary }}>
                  All columns removed. Use <strong style={{ color: '#64748B', fontWeight: 600 }}>Add column</strong> to bring columns back into the model.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
    );
  };

  const previewPanel = (
    <div style={{
      background: '#fff', borderTop: BORDER,
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
      ...(previewFull
        ? { position: 'absolute' as const, inset: 0, zIndex: 30, height: 'auto' }
        : { height: previewOpen ? previewHeight : 38 }),
      transition: previewFull ? 'none' : 'height 220ms cubic-bezier(0.4,0,0.2,1)',
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
        {/* Preview label — always visible */}
        <span style={{ fontSize: 11, fontWeight: 700, color: '#777E8B', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Preview</span>
        {/* POC: node level (current selection) vs model level (entire model, combined) */}
        {showModelLevelPreview && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <select
              value={previewScope}
              onChange={e => setPreviewScope(e.target.value as 'node' | 'model')}
              style={{ appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 5, padding: '3px 22px 3px 8px', fontSize: 11, fontFamily: ff.primary, fontWeight: 500, color: '#1D232F', background: '#fff', cursor: 'pointer', outline: 'none' }}
            >
              <option value="node">Node level</option>
              <option value="model">Model level</option>
            </select>
            <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#A5ACB9' }}>
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>
        )}
        {/* Data / Semantic toggle — hidden while a join is being configured (nothing to preview yet) */}
        {(previewScope === 'model' ? groups.length > 0 : (selectedGroup || canvasJoins.some(j => j.id === selectedId))) && !(singleJoinActive || multiJoinActive) && (
        <div style={{ display: 'flex', alignItems: 'center', background: '#F0F2F6', borderRadius: 6, padding: 2, gap: 1 }}>
          {(['data', 'semantic'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              style={{
                fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 4,
                border: 'none', cursor: 'pointer', fontFamily: ff.primary,
                background: previewMode === mode ? '#fff' : 'transparent',
                color: previewMode === mode ? '#1D232F' : '#777E8B',
                boxShadow: previewMode === mode ? '0 1px 2px rgba(25,35,49,0.10)' : 'none',
                transition: 'all 120ms', whiteSpace: 'nowrap',
              }}
            >{mode === 'data' ? 'Data' : 'Semantic'}</button>
          ))}
        </div>
        )}
        <div style={{ flex: 1 }} />
        {/* Add formula / Add column — Semantic mode only, moved up here (from the
            table's own toolbar) to keep the compact preview panel to one row. */}
        {previewMode === 'semantic' && (previewScope === 'model' ? groups.length > 0 : (selectedGroup || canvasJoins.some(j => j.id === selectedId))) && !(singleJoinActive || multiJoinActive) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            {selectedModelCols.size > 0 && (
              <Button variant="secondary" size="small" onClick={removeSelectedCols}>
                {`Remove${selectedModelCols.size > 1 ? ` (${selectedModelCols.size})` : ''}`}
              </Button>
            )}
            {renderAddActions({ compact: true })}
          </div>
        )}
        {/* Limit — data mode only, shown for both table and join selection */}
        {(previewScope === 'model' ? groups.length > 0 : (selectedGroup || canvasJoins.some(j => j.id === selectedId))) && previewMode === 'data' && !(singleJoinActive || multiJoinActive) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: '#777E8B', whiteSpace: 'nowrap' }}>Limit</span>
            <div style={{ position: 'relative' }}>
              <select value={previewLimit} onChange={e => setPreviewLimit(Number(e.target.value))}
                style={{ appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 5, padding: '3px 22px 3px 8px', fontSize: 11, fontFamily: ff.primary, fontWeight: 500, color: '#1D232F', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                {[100, 500, 1000].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#A5ACB9' }}>
                <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        )}
        {/* Full-screen toggle for the spreadsheet view — hidden where Spreadsheet
            is its own tab, since the chevron is then the only control needed */}
        {scope.spreadsheetFullScreen && (
        <button
          onClick={() => setPreviewFull(f => { const nf = !f; if (nf) setPreviewOpen(true); return nf; })}
          title={previewFull ? 'Exit full screen' : 'Full screen'}
          style={{ width: 22, height: 22, border: 'none', background: 'transparent', borderRadius: 4, color: previewFull ? '#2770EF' : '#A5ACB9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => { if (!previewFull) (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
          onMouseLeave={e => { if (!previewFull) (e.currentTarget as HTMLElement).style.color = '#A5ACB9'; }}
        >
          {previewFull ? (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M6 2v2.5a1.5 1.5 0 0 1-1.5 1.5H2M14 6h-2.5A1.5 1.5 0 0 1 10 4.5V2M10 14v-2.5a1.5 1.5 0 0 1 1.5-1.5H14M2 10h2.5A1.5 1.5 0 0 1 6 11.5V14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 6V3.5A1.5 1.5 0 0 1 3.5 2H6M14 6V3.5A1.5 1.5 0 0 0 12.5 2H10M2 10v2.5A1.5 1.5 0 0 0 3.5 14H6M14 10v2.5a1.5 1.5 0 0 1-1.5 1.5H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>
        )}
        <button
          onClick={() => { if (previewFull) setPreviewFull(false); else setPreviewOpen(o => !o); }}
          title={previewFull ? 'Exit full screen' : previewOpen ? 'Collapse' : 'Expand'}
          style={{ width: 22, height: 22, border: 'none', background: 'transparent', borderRadius: 4, color: '#A5ACB9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <IconChevronDown size={11} />
        </button>
      </div>

      {/* ── Content ── */}
      {previewOpen && (previewLoading ? (
        <SpreadsheetSkeleton />
      ) : (() => {
        // grow rows with panel height: overhead = handle(4) + header(38) + mini-header(28) + thead(25)
        const rowsThatFit = Math.max(0, Math.floor((previewHeight - 95) / 25));
        const rowCap = Math.max(previewLimit, rowsThatFit);

        // ── Model level (POC): preview of the entire model, combined ──
        if (previewScope === 'model') {
          if (groups.length === 0) {
            return (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: BORDER, overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: 0.4, textAlign: 'center' }}>
                  <svg width="30" height="30" viewBox="0 0 32 32" fill="none"><rect x="3" y="7" width="26" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 12h26M9 12v13M16 12v13M23 12v13" stroke="currentColor" strokeWidth="1.3"/></svg>
                  <span style={{ fontSize: 12, color: '#64748B' }}>No data to preview</span>
                  <span style={{ fontSize: 11, color: '#A5ACB9' }}>Add a table to the model</span>
                </div>
              </div>
            );
          }

          // Combine every table currently on the canvas — same simple concat/zip
          // approach the join preview already uses, generalized from 2 tables to N.
          const modelCols: [string, string, string][] = groups.flatMap(g => {
            const cols = g.steps[g.activeStep]?.cols ?? TABLE_COLS[g.tableName] ?? [];
            return cols.map(([col, type]) => [col, type, g.tableName] as [string, string, string]);
          });
          const perTableRows = groups.map(g => rowsForCard(g, rowCap));
          const rowCount = Math.max(0, ...perTableRows.map(r => r.length));
          const mergedRows: Row[] = Array.from({ length: Math.min(rowCount, rowCap) }, (_, i) =>
            groups.flatMap((g, gi) => perTableRows[gi][i] ?? (g.steps[g.activeStep]?.cols ?? TABLE_COLS[g.tableName] ?? []).map(() => null))
          );

          if (previewMode === 'semantic') {
            return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {renderColumnsTable(includedCols, { showFormulas: true, showToolbar: false })}
              </div>
            );
          }

          // Data mode — mimics the Data tab's spreadsheet chrome (toolbar, formula bar,
          // column menu), condensed into this smaller panel. Column names collide often
          // across tables (e.g. every table has its own account_id) — qualify only the
          // names that actually collide, with the owning table, same as the Data tab.
          const nameCounts = modelCols.reduce<Record<string, number>>((acc, [name]) => {
            acc[name] = (acc[name] ?? 0) + 1;
            return acc;
          }, {});
          const sheetCols: [string, string][] = modelCols.map(([name, type, table]) =>
            nameCounts[name] > 1 ? [`${table}.${name}`, type] : [name, type]
          );

          return (
            <div style={{ flex: 1, borderTop: BORDER, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <SpreadsheetGrid
                  tableCols={sheetCols}
                  isInput={false}
                  scrollRef={previewScrollRef}
                  rows={mergedRows}
                  outputRows={mergedRows}
                  previewSort={previewSort}
                  previewColMenu={previewColMenu}
                  setPreviewColMenu={setPreviewColMenu}
                  hiddenPreviewCols={hiddenPreviewCols}
                  highlightedCol={null}
                  derivedCols={{}}
                  inputFixes={{}}
                  outputFixes={{}}
                />
              </div>
            </div>
          );
        }

        // ── Join being configured (not yet applied) — no preview until the join is created ──
        if (singleJoinActive || multiJoinActive) {
          return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: BORDER, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, opacity: 0.5, textAlign: 'center' }}>
                <svg width="26" height="26" viewBox="0 0 16 16" fill="none"><circle cx="6" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="8" r="4" stroke="currentColor" strokeWidth="1.3"/></svg>
                <span style={{ fontSize: 12, color: '#64748B' }}>Preview available after you create the join</span>
                <span style={{ fontSize: 11, color: '#A5ACB9' }}>Configure the join, then select Apply join</span>
              </div>
            </div>
          );
        }

        // ── Join block selected ──
        const selJoin = !selectedGroup ? canvasJoins.find(j => j.id === selectedId) : null;
        if (!selectedGroup && selJoin) {
          const t1Group = groups.find(g => g.id === selJoin.table1Id);
          const t2Group = groups.find(g => g.tableName === selJoin.table2Name);
          const t1Cols: [string, string][] = t1Group ? t1Group.steps[0].cols : (TABLE_COLS[selJoin.name.split(' × ')[0]] ?? []);
          const t2Cols: [string, string][] = t2Group ? t2Group.steps[0].cols : (TABLE_COLS[selJoin.table2Name] ?? []);
          const t1Rows = t1Group ? rowsForCard(t1Group, rowCap) : (MOCK_DATA[selJoin.name.split(' × ')[0]] ?? []).slice(0, rowCap);
          const t2Rows = t2Group ? rowsForCard(t2Group, rowCap) : (MOCK_DATA[selJoin.table2Name] ?? []).slice(0, rowCap);
          const mergedCols: [string, string][] = [...t1Cols, ...t2Cols];
          const mergedRows = t1Rows.map((r, i) => [...r, ...(t2Rows[i] ?? t2Cols.map(() => null))]);

          if (previewMode === 'semantic') {
            const joinTable1Name = t1Group?.tableName ?? selJoin.name.split(' × ')[0];
            const joinRows = includedCols.filter(({ table }) => table === joinTable1Name || table === selJoin.table2Name);
            return (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {renderColumnsTable(joinRows, { showFormulas: false, showToolbar: false })}
              </div>
            );
          }

          // Join data mode — consistent with table view; same spreadsheet chrome as Model level.
          return (
            <div style={{ flex: 1, borderTop: BORDER, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <SpreadsheetGrid
                tableCols={mergedCols}
                isInput={false}
                scrollRef={previewScrollRef}
                rows={mergedRows}
                outputRows={mergedRows}
                previewSort={previewSort}
                previewColMenu={previewColMenu}
                setPreviewColMenu={setPreviewColMenu}
                hiddenPreviewCols={hiddenPreviewCols}
                highlightedCol={null}
                derivedCols={{}}
                inputFixes={{}}
                outputFixes={{}}
              />
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
          const tableRows = includedCols.filter(({ table }) => table === selectedGroup.tableName);
          return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {renderColumnsTable(tableRows, { showFormulas: false, showToolbar: false })}
            </div>
          );
        }

        // ── Python error state ──
        if (selectedGroup && selectedGroup.steps[selectedGroup.activeStep]?.type === 'python' && pythonConfig.error) {
          return (
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#DC2626" strokeWidth="1.3"/><path d="M8 5v4M8 11v.5" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#E22B3D', fontFamily: ff.primary }}>Run error</span>
              </div>
              {/* Traceback scrolls internally so the Fix action below stays visible even in a short preview. */}
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto', borderRadius: 8, border: '1.5px solid #FECACA', background: '#FEF2F2', padding: '12px 14px' }}>
                <pre style={{ margin: 0, fontSize: 11.5, color: '#7F1D1D', fontFamily: "'SF Mono','Fira Mono','Menlo',monospace", lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{pythonConfig.error}</pre>
              </div>
              {!pythonFixReview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  disabled={pythonConfig.fixing}
                  onClick={() => {
                    // Hand off to the agent: drop the error into the prompt bar as a chip and let
                    // the user send it. Falls back to an inline fix if the agent panel isn't mounted.
                    const req = (window as any).__dsRequestPythonFix__;
                    if (req) req(pythonConfig.error);
                    else applyPythonFix();
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, border: 'none', background: pythonConfig.fixing ? '#E8ECEF' : '#2770EF', color: pythonConfig.fixing ? '#A5ACB9' : '#fff', fontSize: 12, fontWeight: 600, cursor: pythonConfig.fixing ? 'default' : 'pointer', fontFamily: ff.primary }}
                >
                  {pythonConfig.fixing ? (
                    <><svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.9s linear infinite' }}><path d="M8 2a6 6 0 110 12A6 6 0 018 2z" stroke="currentColor" strokeWidth="1.8" strokeDasharray="28 10"/></svg>Fixing…</>
                  ) : (
                    <><svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 8c0-3.3 2.7-6 6-6a6 6 0 010 12c-2.1 0-3.9-1-5-2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 12V8h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Fix with AI</>
                  )}
                </button>
                <span style={{ fontSize: 11, color: '#A5ACB9', fontFamily: ff.primary }}>Sends the error to the agent — press send to run the fix</span>
              </div>
              )}
            </div>
          );
        }

        // ── Derived SQL card (combines other tables via @) — show the combined result ──
        const dStep = selectedGroup.steps[selectedGroup.activeStep];
        const deriveInputs = deriveEdges
          .filter(e => e.toId === selectedGroup.id)
          .map(e => groups.find(g => g.id === e.fromId))
          .filter(Boolean) as CanvasGroup[];
        if (dStep?.type === 'sql' && deriveInputs.length > 0) {
          const dCols: [string, string][] = deriveInputs.flatMap(g => g.steps[0]?.cols ?? []);
          const dRows = rowsForCard(selectedGroup, rowCap);
          return (
            <div style={{ flex: 1, borderTop: BORDER, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, flexShrink: 0, borderBottom: BORDER, background: '#FAFBFC' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2770EF' }}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4.5 5L2 8l2.5 3M11.5 5L14 8l-2.5 3M9.5 3.5l-3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#1D232F' }}>Derived</span>
                </span>
                <span style={{ color: '#C0C6CF', fontSize: 10 }}>·</span>
                <span style={{ fontSize: 11, color: '#777E8B' }}>{deriveInputs.map(g => g.tableName).join(' + ')}</span>
                <span style={{ fontSize: 10, color: '#A5ACB9', marginLeft: 2 }}>{dCols.length} cols</span>
              </div>
              <SpreadsheetGrid
                tableCols={dCols}
                isInput={false}
                scrollRef={previewScrollRef}
                rows={dRows}
                outputRows={dRows}
                previewSort={previewSort}
                previewColMenu={previewColMenu}
                setPreviewColMenu={setPreviewColMenu}
                hiddenPreviewCols={hiddenPreviewCols}
                highlightedCol={null}
                derivedCols={{}}
                inputFixes={{}}
                outputFixes={{}}
              />
            </div>
          );
        }

        // ── Data mode ──
        // An agent-written script that hasn't been run yet has no data to show:
        // columns are known from the schema, rows arrive on Run (S11).
        const awaitingRun = awaitingRunIds.has(selectedGroup.id);
        const rows = awaitingRun ? [] : (MOCK_DATA[selectedGroup.tableName] ?? []).slice(0, rowCap);
        const tblName = selectedGroup.tableName;
        // Output reflects row filters written into a code step (S11: narrowing the
        // fetch to `priority in (P1, P2)` and re-running drops the count); the
        // source pane stays raw.
        let outputRows = awaitingRun ? [] : rowsForCard(selectedGroup, rowCap);
        const activeStepObj = selectedGroup.steps[selectedGroup.activeStep];
        if (activeStepObj?.type === 'sql' && activeStepObj.sql) {
          const srcCols = (selectedGroup.steps[0]?.cols ?? []).map(c => c[0]);
          const custIdx = srcCols.indexOf('customer_id');
          const dateIdx = srcCols.findIndex(n => n.toLowerCase().includes('date'));
          if (custIdx >= 0 && dateIdx >= 0) {
            const latest = new Map<string, Row>();
            (MOCK_DATA[selectedGroup.tableName] ?? []).forEach(r => {
              const k = String(r[custIdx]);
              const cur = latest.get(k);
              if (!cur || String(r[dateIdx]) > String(cur[dateIdx])) latest.set(k, r);
            });
            outputRows = [...latest.values()].slice(0, rowCap);
          }
        }
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
          <SpreadsheetGrid
            tableCols={tableCols}
            isInput={isInput}
            scrollRef={scrollRef}
            rows={rows}
            outputRows={outputRows}
            previewSort={previewSort}
            previewColMenu={previewColMenu}
            setPreviewColMenu={setPreviewColMenu}
            hiddenPreviewCols={hiddenPreviewCols}
            highlightedCol={highlightedCol}
            derivedCols={derivedCols}
            inputFixes={inputFixes}
            outputFixes={outputFixes}
          />
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, borderTop: BORDER, display: 'flex', overflow: 'hidden' }}>
              {/* Source (input) pane */}
              {showInput && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: showOutput ? `1px solid #EAEDF2` : 'none' }}>
                  <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, flexShrink: 0, borderBottom: BORDER, background: '#FAFBFC' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#777E8B', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Source</span>
                    <span style={{ color: '#C0C6CF', fontSize: 10 }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2770EF' }}>
                      <TableIcon />
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#1D232F' }}>{tblName}</span>
                    </span>
                    <span style={{ fontSize: 10, color: '#A5ACB9', marginLeft: 2 }}>{inputCols.length} cols · {rows.length} rows</span>
                  </div>
                  {renderDataTable(inputCols, true)}
                </div>
              )}
              {/* Output pane */}
              {showOutput && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, flexShrink: 0, borderBottom: BORDER, background: '#FAFBFC' }}>
                    {/* Always keep the table name for context; append the step label as secondary. */}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2770EF' }}>
                      <TableIcon />
                      <span style={{ fontSize: 11, fontWeight: 500, color: '#1D232F' }}>{tblName}</span>
                    </span>
                    {stepLabel && (
                      <>
                        <span style={{ color: '#C0C6CF', fontSize: 10 }}>·</span>
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#777E8B' }}>{stepLabel}</span>
                      </>
                    )}
                    {/* Row count — S11's payoff is watching this drop when the fetch
                        is narrowed and re-run, so it has to be on screen. */}
                    <span style={{ fontSize: 10, color: '#A5ACB9', marginLeft: 2 }}>
                      {awaitingRun ? 'Not run yet' : `${cols.length} cols · ${outputRows.length} rows`}
                    </span>
                  </div>
                  {renderDataTable(cols, false, previewScrollRef)}
                </div>
              )}
            </div>
          </div>
        );
      })())}
      {/* ── Column ▾ menu (spreadsheet-style) — in Spreadsheet.tsx ── */}
      <SpreadsheetColumnMenu
        menu={previewColMenu}
        onClose={() => setPreviewColMenu(null)}
        sort={previewSort}
        onSort={setPreviewSort}
        onHide={(col) => setHiddenPreviewCols(prev => { const n = new Set(prev); n.add(col); return n; })}
        // Add-formula/filter/clean target a single table unambiguously — no-op for a
        // join or the Model-level merged view, where there's no one table to edit.
        onAddFormula={() => { if (selectedGroup) addStep('formula', false); }}
        onFilter={() => { if (selectedGroup) addStep('filter', false); }}
        onClean={(op) => { if (selectedGroup) handlePrepStep(op as OpType); }}
        cleanOptions={BLOCK_MENU_PREP.map(({ op, label }) => ({ op, label, icon: OP_ICON[op] }))}
        cleanSubOpen={colCleanSub}
        setCleanSubOpen={setColCleanSub}
        extended
      />
      {/* footer removed — spreadsheet uses infinite scroll, no pagination */}
    </div>
  );


  // ── Root render ─────────────────────────────────────────────────────────────

  // ── Columns view ─────────────────────────────────────────────────────────────

  const columnsView = (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#F6F8FA' }}>
      {/* Review action bar — shown inline at top of column view when a fix is under review */}
      {airFixReview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(252,200,56,0.07)', borderBottom: '1px solid rgba(252,200,56,0.22)', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: '#92640A', flexShrink: 0 }}><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.8" fill="currentColor"/></svg>
          <span style={{ fontSize: 12, color: '#92640A', flex: 1, lineHeight: '16px' }}>
            {airFixReview === '__all__'
              ? 'Review all suggested changes — highlighted cells show proposed values. Accept to apply everything.'
              : `Review suggested changes for "${AIR_FIX_REVIEW[airFixReview]?.title ?? airFixReview}" — highlighted cells show proposed values.`}
          </span>
          <button
            onClick={() => {
              (window as any).__airApplyFix__?.(airFixReview);
              (window as any).__airFixAccepted__?.(airFixReview);
            }}
            style={{ padding: '5px 14px', borderRadius: 5, border: 'none', background: '#06BF7F', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary, whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >{airFixReview === '__all__' ? 'Accept all' : 'Accept'}</button>
          <button
            onClick={() => {
              (window as any).__airFixRejected__?.(airFixReview);
              setAirFixReview(null);
            }}
            style={{ padding: '5px 12px', borderRadius: 5, border: '1px solid #E2E6EC', background: '#fff', color: '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary, whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F6F8FA')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
          >{airFixReview === '__all__' ? 'Reject all' : 'Reject'}</button>
        </div>
      )}

      {groups.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ opacity: 0.3 }}><rect x="3" y="5" width="26" height="22" rx="3" stroke="#64748B" strokeWidth="1.8"/><path d="M3 11h26M11 11v16" stroke="#64748B" strokeWidth="1.5"/></svg>
          <span style={{ fontSize: 13, color: '#A5ACB9', fontFamily: ff.primary }}>Add tables to the model to see columns here</span>
        </div>
      ) : renderColumnsTable(includedCols, { showFormulas: true })}

      {/* Model-level formula editor */}
      {formulaModalOpen && (
        <div
          onClick={() => setFormulaModalOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(16,24,40,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: 460, maxWidth: 'calc(100vw - 40px)', background: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(16,24,40,0.28)', fontFamily: ff.primary, overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '14px 18px', borderBottom: '1px solid #EAEDF2' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: 'rgba(6,191,127,0.1)', color: '#047857' }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1D232F' }}>{modelFormulaDraft.id ? 'Edit model formula' : 'New model formula'}</div>
                <div style={{ fontSize: 11.5, color: '#8B96A5' }}>A calculated column available across the whole model</div>
              </div>
              <button onClick={() => setFormulaModalOpen(false)} style={{ background: 'none', border: 'none', color: '#A5ACB9', cursor: 'pointer', padding: 4, display: 'inline-flex' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, letterSpacing: '0.02em' }}>Column name</label>
                <input
                  autoFocus
                  value={modelFormulaDraft.name}
                  onChange={e => setModelFormulaDraft(d => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. profit_margin"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #EAEDF2', borderRadius: 6, padding: '7px 10px', fontSize: 12.5, color: '#1D232F', fontFamily: ff.primary, outline: 'none', background: '#fff' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.10)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.02em' }}>Expression</label>
                  {modelFormulaDraft.expr && <button onClick={() => setModelFormulaDraft(d => ({ ...d, expr: '' }))} style={{ background: 'none', border: 'none', color: '#A5ACB9', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: ff.primary }}>Clear</button>}
                </div>
                <textarea
                  value={modelFormulaDraft.expr}
                  onChange={e => setModelFormulaDraft(d => ({ ...d, expr: e.target.value }))}
                  placeholder="Enter an expression, e.g. sum(sales) / sum(quantity)"
                  rows={4}
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #EAEDF2', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#1D232F', outline: 'none', resize: 'vertical', lineHeight: 1.6, fontFamily: "'SF Mono','Fira Mono','Menlo',monospace", background: '#F6F8FA', minHeight: 84 }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(39,112,239,0.10)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              {!modelFormulaDraft.expr && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#A5ACB9', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Examples</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                      { label: 'Profit margin', expr: '(sum(revenue) - sum(cost)) / sum(revenue)' },
                      { label: 'Avg order value', expr: 'sum(sales) / count(order_id)' },
                      { label: 'Days since order', expr: 'datediff(\'day\', order_date, now())' },
                    ].map(s => (
                      <button key={s.label} onClick={() => setModelFormulaDraft(d => ({ ...d, expr: s.expr }))}
                        style={{ textAlign: 'left', padding: '7px 10px', borderRadius: 6, border: '1px solid #EAEDF2', background: '#F6F8FA', cursor: 'pointer', fontFamily: ff.primary, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = '#EEF2FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#EAEDF2'; e.currentTarget.style.background = '#F6F8FA'; }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>{s.label}</span>
                        <code style={{ fontSize: 10, color: '#777E8B', fontFamily: "'SF Mono','Fira Mono',monospace", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{s.expr}</code>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 18px', borderTop: '1px solid #EAEDF2', background: '#FAFBFC' }}>
              <button
                onClick={() => setFormulaModalOpen(false)}
                style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #E2E6EC', background: '#fff', color: '#64748B', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F6F8FA')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
              >Cancel</button>
              <button
                disabled={!modelFormulaDraft.name.trim() || !modelFormulaDraft.expr.trim()}
                onClick={() => {
                  const name = modelFormulaDraft.name.trim();
                  const expr = modelFormulaDraft.expr.trim();
                  if (!name || !expr) return;
                  setModelFormulas(prev => modelFormulaDraft.id
                    ? prev.map(f => f.id === modelFormulaDraft.id ? { ...f, name, expr } : f)
                    : [...prev, { id: `mf_${Date.now()}`, name, expr }]);
                  setFormulaModalOpen(false);
                }}
                style={{ padding: '7px 16px', borderRadius: 6, border: 'none', background: (!modelFormulaDraft.name.trim() || !modelFormulaDraft.expr.trim()) ? '#B9C0CC' : '#2770EF', color: '#fff', fontSize: 12, fontWeight: 600, cursor: (!modelFormulaDraft.name.trim() || !modelFormulaDraft.expr.trim()) ? 'default' : 'pointer', fontFamily: ff.primary }}
              >{modelFormulaDraft.id ? 'Save formula' : 'Add formula'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Data tab — a single spreadsheet merging every table currently on the canvas ──
  // Empty sheet fills whatever height the tab has, rather than stopping at a
  // fixed row count and leaving dead space under it. Re-measures on resize.
  const emptySheetRef = useRef<HTMLDivElement>(null);
  const [emptySheetRows, setEmptySheetRows] = useState(24);
  useEffect(() => {
    const el = emptySheetRef.current;
    if (!el) return;
    const measure = () => setEmptySheetRows(Math.max(24, Math.ceil((el.clientHeight - 26) / 25) + 1));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewMode, groups.length]);

  const dataView = (() => {
    // Empty state is an empty *sheet*, not a grey panel with a message in it —
    // the tab is a spreadsheet, so it should read as one before there's data.
    // Same chrome as SpreadsheetGrid (gutter, header band, 25px rows) with
    // lettered columns, and the guidance floats over it rather than replacing it.
    if (groups.length === 0) {
      const emptyCols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      return (
        <div ref={emptySheetRef} style={{ flex: 1, position: 'relative', overflow: 'auto', background: '#fff' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 11.5, tableLayout: 'fixed', width: '100%', minWidth: 'max-content' }}>
            <thead>
              <tr style={{ background: '#F6F8FA', position: 'sticky', top: 0, zIndex: 2 }}>
                <th style={{ width: 36, padding: '5px 8px', borderRight: BORDER, borderBottom: BORDER, color: '#C0C6CF', fontWeight: 600, fontSize: 10, textAlign: 'center' }}>#</th>
                {emptyCols.map(col => (
                  <th key={col} style={{ minWidth: 116, padding: '5px 12px', borderRight: BORDER, borderBottom: BORDER, textAlign: 'left', fontWeight: 600, color: '#C0C6CF' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: emptySheetRows }, (_, r) => (
                <tr key={r}>
                  <td style={{ width: 36, height: 25, padding: '5px 8px', borderRight: BORDER, borderBottom: BORDER, color: '#C0C6CF', fontSize: 10, textAlign: 'center', background: '#FAFBFC' }}>{r + 1}</td>
                  {emptyCols.map(col => (
                    <td key={col} style={{ height: 25, padding: '5px 12px', borderRight: BORDER, borderBottom: BORDER }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Merge every table's CURRENT output (its last step's cols — reflects any
    // filters/formulas already applied) into one row-aligned sheet, the same way
    // the join-preview branch above merges exactly two tables, generalized to N.
    // Column names collide often across tables (e.g. every table has its own
    // account_id foreign key) — SpreadsheetGrid keys header/body cells by the raw
    // column name, so an un-disambiguated merge produces duplicate React keys.
    // Qualify only the names that actually collide, with the owning table, so the
    // common (non-colliding) case still shows a clean bare column name.
    const rawMergedCols = groups.flatMap(g => (g.steps[g.steps.length - 1]?.cols ?? []).map(c => ({ col: c, table: g.tableName, groupId: g.id })));
    const nameCounts = rawMergedCols.reduce<Record<string, number>>((acc, { col: [name] }) => {
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});
    const mergedCols: [string, string][] = rawMergedCols.map(({ col: [name, type], table }) =>
      nameCounts[name] > 1 ? [`${table}.${name}`, type] : [name, type]
    );
    // Displayed column name → owning group id, so the column ▾ menu's Filter/
    // Add-formula can target the right table with no picker (the column IS the target).
    const colToGroupId: Record<string, string> = {};
    rawMergedCols.forEach(({ col: [name], table, groupId }) => {
      colToGroupId[nameCounts[name] > 1 ? `${table}.${name}` : name] = groupId;
    });
    // Add a filter/formula step to a specific group and open its edit form. addStep
    // selects the group + sets editingStepKey, so the docked propertiesPanel (rendered
    // on this tab below) opens straight into the new step's form.
    const startAction = (op: 'filter' | 'formula', groupId: string) => {
      if (op === 'filter') addStep('filter', false, groupId);
      else addStep('formula', false, groupId);
    };
    const perTableRows = groups.map(g => rowsForCard(g, dataLimit));
    const rowCount = Math.min(dataLimit, Math.max(0, ...perTableRows.map(r => r.length)));
    const mergedRows: Row[] = Array.from({ length: rowCount }, (_, i) =>
      groups.flatMap((g, gi) => perTableRows[gi][i] ?? (g.steps[g.steps.length - 1]?.cols ?? []).map(() => null))
    );

    const downloadCsv = () => {
      const escapeCsv = (v: unknown) => {
        const s = v === null || v === undefined ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = [
        mergedCols.map(([col]) => escapeCsv(col)).join(','),
        ...mergedRows.map(r => r.map(escapeCsv).join(',')),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'model_data.csv';
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div style={{ flex: 1, display: 'flex', minWidth: 0, minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, background: '#fff', position: 'relative' }}>
        <DataSheetToolbar
          onDownloadCsv={downloadCsv}
          onToggleExpand={() => setBrowserCollapsed(c => !c)}
          expanded={browserCollapsed}
          onFilter={() => setDataActionPicker('filter')}
          onFormula={() => setDataActionPicker('formula')}
        />
        {/* Formula bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderBottom: BORDER, flexShrink: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, color: '#8B96A5', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M4 13V6a2 2 0 0 1 2-2h1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2.5 8.5H7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9 8l4 5M13 8l-4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </span>
          {/* Editable + colour-themed. The highlighted <pre> sits behind a
              transparent-text input — same layering as CodeEditor. Resting
              state shows the selected cell; typing or pasting switches it to
              formula mode. */}
          {(() => {
            const shown = formulaDraft ?? dataSelectedCell?.value ?? '';
            const editing = formulaDraft !== null;
            const metrics: React.CSSProperties = {
              fontSize: 12.5, fontFamily: ff.primary, lineHeight: '20px',
              whiteSpace: 'pre', letterSpacing: 'normal', margin: 0, padding: 0,
            };
            return (
              <div style={{ position: 'relative', flex: 1, height: 20 }}>
                <pre
                  aria-hidden="true"
                  style={{ ...metrics, position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', color: '#1D232F' }}
                  dangerouslySetInnerHTML={{ __html: editing ? highlightFormula(shown) : escapeHtml(shown) }}
                />
                <input
                  value={shown}
                  placeholder="Enter formula or value"
                  onChange={e => setFormulaDraft(e.target.value)}
                  onFocus={() => { setFormulaFocused(true); setFormulaDraft(d => d ?? (dataSelectedCell?.value ?? '')); }}
                  onBlur={() => setFormulaFocused(false)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') { setFormulaDraft(null); (e.currentTarget as HTMLInputElement).blur(); return; }
                    if (e.key !== 'Enter' || !formulaDraft?.trim()) return;
                    e.preventDefault();
                    const res = commitFormula(formulaDraft, mergedCols, mergedRows);
                    if (!res.ok) { setFormulaError(res.reason); return; }
                    // A successful add says nothing — the column appearing is the
                    // feedback. Only a formula that won't parse gets a message.
                    setFormulaError(null);
                    setFormulaDraft(null);
                    (e.currentTarget as HTMLInputElement).blur();
                  }}
                  style={{
                    ...metrics, position: 'absolute', inset: 0, width: '100%',
                    border: 'none', outline: 'none', background: 'transparent',
                    // Transparent text so the highlighted layer shows through;
                    // the caret stays visible via caret-color.
                    color: editing ? 'transparent' : '#1D232F',
                    caretColor: '#1D232F',
                  }}
                />
              </div>
            );
          })()}
          {formulaFocused && (
            <span style={{ fontSize: 10.5, color: '#A5ACB9', flexShrink: 0, whiteSpace: 'nowrap' }}>
              Enter to add column · Esc to cancel
            </span>
          )}
        </div>
        {formulaError && (
          <div style={{ padding: '5px 12px', borderBottom: BORDER, background: '#FFF7ED', color: '#92640A', fontSize: 11.5, fontFamily: ff.primary, flexShrink: 0 }}>
            {formulaError}
          </div>
        )}
        <div
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          onClick={e => {
            // Delegate: find the clicked body cell, then read its column name off the
            // header cell at the same DOM position (robust to sort order + hidden
            // columns, since both header and body skip the same columns identically).
            const td = (e.target as HTMLElement).closest('td');
            const tr = td?.closest('tr');
            const table = td?.closest('table');
            if (!td || !tr || !table || td.cellIndex === 0) { setDataSelectedCell(null); return; }
            const th = table.querySelectorAll('thead th')[td.cellIndex] as HTMLElement | undefined;
            const col = th?.getAttribute('data-col');
            if (!col) { setDataSelectedCell(null); return; }
            setDataSelectedCell({ col, value: (td.textContent ?? '').trim() });
          }}
        >
          {/* Formula columns are appended to the sheet. While one is computing
              its values are absent, so the grid renders the column empty —
              the skeleton overlay below sits on top of it. */}
          <SpreadsheetGrid
            tableCols={[...mergedCols, ...formulaCols.map(f => [f.name, 'FLOAT'] as [string, string])]}
            isInput={false}
            scrollRef={dataScrollRef}
            rows={mergedRows}
            outputRows={mergedRows}
            previewSort={dataSort}
            previewColMenu={dataColMenu}
            setPreviewColMenu={setDataColMenu}
            hiddenPreviewCols={dataHiddenCols}
            highlightedCol={formulaCols.length ? formulaCols[formulaCols.length - 1].name : null}
            derivedCols={formulaValues}
            loadingCols={formulaComputing ? new Set([formulaComputing]) : undefined}
            formulaCols={new Set(formulaCols.map(f => f.name))}
            inputFixes={{}}
            outputFixes={{}}
          />
        </div>
        <SpreadsheetColumnMenu
          menu={dataColMenu}
          onClose={() => setDataColMenu(null)}
          sort={dataSort}
          onSort={setDataSort}
          onHide={col => { setDataHiddenCols(prev => new Set([...prev, col])); setDataColMenu(null); }}
          onAddFormula={() => { const gid = dataColMenu && colToGroupId[dataColMenu.col]; setDataColMenu(null); if (gid) startAction('formula', gid); }}
          onFilter={() => { const gid = dataColMenu && colToGroupId[dataColMenu.col]; setDataColMenu(null); if (gid) startAction('filter', gid); }}
          onClean={() => setDataColMenu(null)}
          cleanOptions={BLOCK_MENU_PREP.map(({ op, label }) => ({ op, label, icon: OP_ICON[op] }))}
          cleanSubOpen={dataCleanSub}
          setCleanSubOpen={setDataCleanSub}
          extended
        />
      </div>
      {/* Same docked properties panel the Canvas uses — a filter/formula action
          from the toolbar or a column menu opens its edit form right here. */}
      {propertiesPanel}
      </div>
    );
  })();

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', fontFamily: ff.primary, background: '#fff' }}
      onClick={() => { setAddDataOpen(false); setDataModeMenuOpen(false); setToolbarAddOpen(false); }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.tsv,.xlsx,.xls,.parquet,.json"
        style={{ display: 'none' }}
        onChange={e => { handleCsvFile(e.target.files?.[0] ?? undefined); e.currentTarget.value = ''; }}
      />
      {/* Global header */}
      <GlobalHeader
        theme="light"
        showHamburger
        searchPlaceholder="Search in your library"
        userName="Royal Enfield"
        notificationCount={1}
        onLogoClick={() => {}}
        style={{ flexShrink: 0 }}
        logo={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BrandMark style={{ height: 22, width: 'auto' }} color="#1D232F" />
            {/* Vision: collapsing the agent panel hands its control up to the topbar
                (mirrors the data-browser collapse). POC uses a slim rail instead. */}
            {!poc && agentCollapsed && !hideAgentPanel && (
              <span
                role="button"
                tabIndex={0}
                onClick={e => { e.stopPropagation(); setAgentCollapsed(false); }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setAgentCollapsed(false); } }}
                title="Open agent panel"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, background: 'none', color: '#64748B', cursor: 'pointer', flexShrink: 0 }}
                onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = '#F0F2F6'; (ev.currentTarget as HTMLElement).style.color = '#1D232F'; }}
                onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = 'none'; (ev.currentTarget as HTMLElement).style.color = '#64748B'; }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M6 2.5v11" stroke="currentColor" strokeWidth="1.3"/>
                </svg>
              </span>
            )}
          </div>
        }
      />
      {/* Gradient work area — full-screen treatment below the global header.
          +Model flow: the RADIANCE_WASH + grain persist even when the agent is
          collapsed (collapsing swaps the panel for a slim rail, mimicking SpotterX).
          SpotterX embed (hideAgentPanel): unchanged — gradient/card framing drop
          away and the artifact goes edge-to-edge when collapsed. */}
      <div style={{
        flex: 1, display: 'flex', minHeight: 0, position: 'relative',
        backgroundColor: '#fff',
        backgroundImage: (!hideAgentPanel || !agentCollapsed)
          ? (hideAgentPanel
              ? 'radial-gradient(78% 82% at 1% 0%, #EFCEC8 0%, #F6DEDA 20%, #FAEBE7 36%, #F6F0F0 62%, #F2EDEE 100%)'
              : RADIANCE_WASH)
          : 'none',
      }}>
        {/* Film grain — matches SpotterX; +Model canvas only (behind the flex content) */}
        {!hideAgentPanel && (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: GRAIN_URI, opacity: 0.03 }} />
        )}
        {/* Collapsed rail — slim column + expand toggle at top (mimics SpotterX's chat rail).
            POC only; Vision reopens from the topbar icon instead. */}
        {poc && !hideAgentPanel && agentCollapsed && (
          <div style={{ position: 'relative', width: 56, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 16 }}>
            <button
              onClick={() => setAgentCollapsed(false)}
              title="Open agent panel"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: RADIUS6, border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F0F2F6'; (e.currentTarget as HTMLElement).style.color = '#1D232F'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748B'; }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1.5" y="2.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M6 2.5v11" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
            </button>
          </div>
        )}
        {agentPanel}
        {/* Artifact — solid rounded card floating on the gradient (full-bleed only in the
            SpotterX embed when its chrome is hidden; framed in the +Model flow) */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative',
          margin: (!hideAgentPanel || !agentCollapsed) ? '14px 14px 14px 6px' : 0,
          background: '#fff',
          borderRadius: (!hideAgentPanel || !agentCollapsed) ? 14 : 0,
          border: (!hideAgentPanel || !agentCollapsed) ? '1px solid #EAE4E4' : 'none',
          boxShadow: (!hideAgentPanel || !agentCollapsed) ? '0 8px 28px rgba(70,30,30,0.08), 0 1px 3px rgba(25,35,49,0.05)' : 'none',
          overflow: 'hidden',
        }}>
          {topbar}
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {viewMode !== 'test' && browserPanel}
            {/* Canvas column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {viewMode === 'canvas' ? canvasViewport : viewMode === 'columns' && scope.columnsTab ? columnsView : viewMode === 'data' ? dataView : viewMode === 'test' ? testView : canvasViewport}
              {viewMode === 'canvas' && !previewFull && previewPanel}
            </div>
          </div>
          {/* Full screen: the preview takes over the whole artifact (topbar + browser + canvas); only the agent panel remains. */}
          {viewMode === 'canvas' && previewFull && previewPanel}

        </div>
      </div>
      {cacheConfirm && (
        <div onClick={() => setCacheConfirm(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(25,35,49,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, background: '#fff', borderRadius: 12, boxShadow: '0 12px 48px rgba(25,35,49,0.24)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(140,98,245,0.12)', color: '#8C62F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="4" rx="5" ry="2" stroke="currentColor" strokeWidth="1.3"/><path d="M3 4v8c0 1.1 2.2 2 5 2s5-.9 5-2V4" stroke="currentColor" strokeWidth="1.3"/><path d="M3 8c0 1.1 2.2 2 5 2s5-.9 5-2" stroke="currentColor" strokeWidth="1.3"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1D232F' }}>{cacheConfirm.title ?? 'Caching is required'}</div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55, color: '#64748B', marginBottom: cacheConfirm.settings ? 16 : 20 }}>
              {cacheConfirm.body ?? 'To use uploaded files, this model is required to be cached into ThoughtSpot’s data store. It will run on cached data, refreshed on a schedule.'}
            </div>
            {cacheConfirm.settings && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <Select
                    label="Data range"
                    size="small"
                    fullWidth
                    value={cacheRange}
                    onChange={setCacheRange}
                    options={['Last 30 days', 'Last 6 months', 'Last 1 year', 'All time'].map(o => ({ id: o, label: o }))}
                  />
                  <Select
                    label="Refresh"
                    size="small"
                    fullWidth
                    value={cacheRefresh}
                    onChange={setCacheRefresh}
                    options={['Daily', 'Weekly', 'Monthly'].map(o => ({ id: o, label: o }))}
                  />
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.55, color: '#777E8B', marginBottom: 20 }}>
                  {cacheConfirm.note ?? 'The first run pulls the full range, so it can take a while. You can change either setting later in the model’s cache settings.'}
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setCacheConfirm(null)} style={{ padding: '8px 16px', borderRadius: RADIUS6, border: '1px solid #C0C6CF', background: '#fff', color: '#1D232F', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>{cacheConfirm.cancelLabel ?? 'Cancel file upload'}</button>
              <button onClick={() => cacheConfirm.onConfirm({ range: cacheRange, refresh: cacheRefresh })} style={{ padding: '8px 16px', borderRadius: RADIUS6, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>Continue with caching</button>
            </div>
          </div>
        </div>
      )}
      {publishOpen && (
        <div onClick={() => setPublishOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(25,35,49,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 420, background: '#fff', borderRadius: 12, boxShadow: '0 12px 48px rgba(25,35,49,0.24)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(39,112,239,0.10)', color: '#2770EF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l4 4M8 2.5l-4 4M8 2.5v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1D232F' }}>Publish model</div>
                <div style={{ fontSize: 12, color: '#777E8B' }}>{modelName} → your organization</div>
              </div>
            </div>
            <div style={{ margin: '16px 0 20px', border: BORDER, borderRadius: 9, overflow: 'hidden' }}>
              {[
                { label: 'Status', value: publishStatus.value, color: publishStatus.color, check: publishStatus.check },
                { label: 'Cache', value: publishCache, color: '#1D232F', check: false },
              ].map((row, i) => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 14px', borderTop: i > 0 ? '1px solid #F0F2F6' : 'none' }}>
                  <span style={{ fontSize: 12.5, color: '#777E8B', flexShrink: 0, fontFamily: ff.primary }}>{row.label}</span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: row.color, fontFamily: ff.primary }}>
                    {row.check && <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="rgba(6,191,127,0.14)"/><path d="M5 8l2 2 4-4" stroke="#06BF7F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    {row.value}
                  </span>
                </div>
              ))}
              {/* Sources — a list, one row per connection, so a long table set wraps
                  inside its own column instead of over the label. */}
              <div style={{ padding: '11px 14px', borderTop: '1px solid #F0F2F6' }}>
                <span style={{ fontSize: 12.5, color: '#777E8B', fontFamily: ff.primary }}>Sources</span>
                {publishSourceGroups.length === 0 ? (
                  <div style={{ marginTop: 6, fontSize: 12.5, color: '#A5ACB9', fontFamily: ff.primary }}>Nothing on the canvas yet</div>
                ) : (
                  <div style={{ marginTop: 7, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {publishSourceGroups.map(({ source, tables }) => (
                      <div key={source} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                        <span style={{ width: 96, flexShrink: 0, fontSize: 12, fontWeight: 600, color: '#1D232F', fontFamily: ff.primary }}>{source}</span>
                        <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#64748B', fontFamily: ff.primary, lineHeight: 1.5 }}>
                          {tables.join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setPublishOpen(false)} style={{ padding: '8px 16px', borderRadius: RADIUS6, border: '1px solid #C0C6CF', background: '#fff', color: '#1D232F', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: ff.primary }}>Cancel</button>
              <button onClick={() => { setPublished(true); setPublishOpen(false); onPublished?.(); }} style={{ padding: '8px 18px', borderRadius: RADIUS6, border: 'none', background: '#2770EF', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary }}>Publish</button>
            </div>
          </div>
        </div>
      )}
      {cacheSettingsOpen && (
        <div onClick={() => setCacheSettingsOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(25,35,49,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 440, background: '#fff', borderRadius: 12, boxShadow: '0 12px 48px rgba(25,35,49,0.24)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 3 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: 'rgba(140,98,245,0.12)', color: '#8C62F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1.6l.85 1.55 1.72-.38.32 1.73 1.53.87-.83 1.55.83 1.55-1.53.87-.32 1.73-1.72-.38L8 14.4l-.85-1.55-1.72.38-.32-1.73-1.53-.87.83-1.55-.83-1.55 1.53-.87.32-1.73 1.72.38L8 1.6z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1D232F' }}>Cache settings</div>
            </div>
            <div style={{ fontSize: 12.5, color: '#777E8B', marginBottom: 18, paddingLeft: 39 }}>Control how this model is materialized in ThoughtSpot.</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', marginBottom: 7 }}>Scope</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['Full model', 'Custom'] as const).map(s => (
                  <button key={s} onClick={() => setCacheScope(s)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, cursor: 'pointer', fontFamily: ff.primary, fontSize: 12.5, fontWeight: 600, border: `1.5px solid ${cacheScope === s ? '#2770EF' : '#EAEDF2'}`, background: cacheScope === s ? 'rgba(39,112,239,0.05)' : '#fff', color: cacheScope === s ? '#2770EF' : '#64748B' }}>{s}</button>
                ))}
              </div>
              {cacheScope === 'Custom' && <div style={{ fontSize: 11.5, color: '#777E8B', marginTop: 7 }}>Choose which tables and how much history to cache per table.</div>}
            </div>

            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1D232F', marginBottom: 7 }}>Refresh</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <select value={cacheFreq} onChange={e => setCacheFreq(e.target.value)} style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 7, padding: '8px 28px 8px 10px', fontSize: 12.5, color: '#1D232F', background: '#fff', cursor: 'pointer', fontFamily: ff.primary, fontWeight: 500, outline: 'none' }}>
                    {['Daily', 'Hourly', 'Weekly'].map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#A5ACB9' }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                </div>
                <div style={{ flex: 1, position: 'relative', opacity: cacheFreq === 'Hourly' ? 0.5 : 1 }}>
                  <select value={cacheHour} disabled={cacheFreq === 'Hourly'} onChange={e => setCacheHour(e.target.value)} style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none', border: BORDER, borderRadius: 7, padding: '8px 28px 8px 10px', fontSize: 12.5, color: '#1D232F', background: '#fff', cursor: cacheFreq === 'Hourly' ? 'default' : 'pointer', fontFamily: ff.primary, fontWeight: 500, outline: 'none' }}>
                    {['12:00 AM', '6:00 AM', '9:00 AM', '12:00 PM', '6:00 PM'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#A5ACB9' }}><svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
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
  color: '#A5ACB9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const railBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 6, border: 'none', background: 'transparent',
  color: '#777E8B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
