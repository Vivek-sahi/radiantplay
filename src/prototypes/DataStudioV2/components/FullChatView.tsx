import React, { useState, useCallback, useRef, useEffect } from 'react';
import { c, ff, fs, fw } from '../styles';
import AgentPanel, { AgentMessage } from './AgentPanel';
import ChatContextPanel from './ChatContextPanel';
import { ProjectState } from '../index';
import { AnswerTile, ChartType } from '../../_shared/tiles';
import { LiveboardHeader } from '@components/LiveboardHeader';

// ── Flow context (for ChatContextPanel) ──────────────────────────────────────

const CHAT_WIDTH = 860;

interface FlowContext { models: string[]; tables: string[]; skill: string }

const FLOW_CONTEXT: Record<string, FlowContext> = {
  dbt_connection_repair:    { models: ['Sales Analytics', 'Sales Performance', 'Revenue Forecast'], tables: [],                        skill: 'Repair dbt connection' },
  schema_drift_repair:      { models: ['FnOps Cost Model'],                                        tables: ['dbt_finance_spend'],       skill: 'Resolve schema drift' },
  schema_drift_multi_repair:{ models: ['Revenue Forecast', 'Pipeline Health'],                     tables: [],                        skill: 'Resolve schema drift' },
  null_rate_investigation:  { models: ['Marketing Campaign Attribution'],                          tables: ['orders', 'campaigns'],     skill: 'Investigate data quality' },
  enable_cache:             { models: ['Campaign Performance'],                                    tables: [],                        skill: 'Enable query caching' },
};

// ── Object data (for ObjectPanel and LiveboardObjectView) ─────────────────────

type ObjCol = {
  name: string;
  colType: string;
  broken?: boolean;
  brokenLabel?: string;
  nullRate?: number;
};

const OBJECT_DATA: Record<string, { label: 'Model' | 'Dependent' | 'Liveboard'; blocked?: boolean; cols: ObjCol[] }> = {
  'Revenue Forecast': {
    label: 'Model',
    cols: [
      { name: 'quarterly_target',      colType: 'number', broken: true,  brokenLabel: 'removed from source' },
      { name: 'forecast_region',       colType: 'string', broken: true,  brokenLabel: 'removed from source' },
      { name: 'order_date',            colType: 'date' },
      { name: 'amount',                colType: 'number' },
      { name: 'region',                colType: 'string' },
      { name: 'pipeline_contribution', colType: 'number' },
    ],
  },
  'Pipeline Health': {
    label: 'Model',
    cols: [
      { name: 'forecast_region',  colType: 'string', broken: true, brokenLabel: 'removed from source' },
      { name: 'pipeline_stage',   colType: 'string', broken: true, brokenLabel: 'removed from source' },
      { name: 'deal_value',       colType: 'number' },
      { name: 'close_date',       colType: 'date' },
      { name: 'win_probability',  colType: 'number' },
      { name: 'stage_name',       colType: 'string' },
    ],
  },
  'Sales Analytics': {
    label: 'Model',
    blocked: true,
    cols: [
      { name: 'revenue',    colType: 'number' },
      { name: 'sale_date',  colType: 'date' },
      { name: 'region',     colType: 'string' },
      { name: 'rep_id',     colType: 'string' },
    ],
  },
  'Sales Performance': {
    label: 'Model',
    blocked: true,
    cols: [
      { name: 'quota_attainment', colType: 'number' },
      { name: 'rep_name',         colType: 'string' },
      { name: 'period',           colType: 'date' },
    ],
  },
  'Marketing Campaign Attribution': {
    label: 'Model',
    cols: [
      { name: 'campaign_id',        colType: 'string', nullRate: 18 },
      { name: 'campaign_name',      colType: 'string' },
      { name: 'channel',            colType: 'string' },
      { name: 'spend',              colType: 'number' },
      { name: 'attributed_revenue', colType: 'number' },
      { name: 'touch_count',        colType: 'number' },
    ],
  },
  'FnOps Cost Model': {
    label: 'Model',
    cols: [
      { name: 'cost_center',     colType: 'string', broken: true, brokenLabel: 'removed from source' },
      { name: 'allocation_type', colType: 'string', broken: true, brokenLabel: 'removed from source' },
      { name: 'spend',           colType: 'number' },
      { name: 'quarter',         colType: 'string' },
      { name: 'department',      colType: 'string' },
    ],
  },
  'Q4 Forecast': {
    label: 'Dependent',
    cols: [
      { name: 'quarterly_target',  colType: 'number', broken: true, brokenLabel: 'broken reference' },
      { name: 'forecast_date',     colType: 'date' },
      { name: 'region',            colType: 'string' },
      { name: 'projected_revenue', colType: 'number' },
    ],
  },
  'Pipeline Summary': {
    label: 'Dependent',
    cols: [
      { name: 'pipeline_stage', colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'deal_count',     colType: 'number' },
      { name: 'total_value',    colType: 'number' },
    ],
  },
  'Regional Forecast': {
    label: 'Dependent',
    cols: [
      { name: 'forecast_region',   colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'quarterly_target',  colType: 'number', broken: true, brokenLabel: 'broken reference' },
      { name: 'projected_revenue', colType: 'number' },
      { name: 'period',            colType: 'date' },
    ],
  },
  'Stage Conversion': {
    label: 'Dependent',
    cols: [
      { name: 'pipeline_stage',  colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'conversion_rate', colType: 'number' },
      { name: 'deal_count',      colType: 'number' },
    ],
  },
  'Exec Revenue View': {
    label: 'Dependent',
    cols: [
      { name: 'quarterly_target', colType: 'number', broken: true, brokenLabel: 'broken reference' },
      { name: 'actual_revenue',   colType: 'number' },
      { name: 'region',           colType: 'string' },
    ],
  },
  'Deal Velocity': {
    label: 'Dependent',
    cols: [
      { name: 'forecast_region',   colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'avg_days_to_close', colType: 'number' },
      { name: 'deal_stage',        colType: 'string' },
    ],
  },
  'Q4 Cost Analysis': {
    label: 'Dependent',
    cols: [
      { name: 'cost_center',     colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'allocation_type', colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'spend',           colType: 'number' },
      { name: 'quarter',         colType: 'string' },
      { name: 'department',      colType: 'string' },
    ],
  },
  'Budget Variance Report': {
    label: 'Dependent',
    cols: [
      { name: 'cost_center',  colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'budget',       colType: 'number' },
      { name: 'actual_spend', colType: 'number' },
      { name: 'variance',     colType: 'number' },
    ],
  },
  'FY Spend Summary': {
    label: 'Dependent',
    cols: [
      { name: 'allocation_type', colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'total_spend',     colType: 'number' },
      { name: 'fiscal_year',     colType: 'string' },
    ],
  },
  'Regional Cost Breakdown': {
    label: 'Dependent',
    cols: [
      { name: 'cost_center',     colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'allocation_type', colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'region',          colType: 'string' },
      { name: 'spend',           colType: 'number' },
    ],
  },
  'Finance Operations Dashboard': { label: 'Liveboard', cols: [] },
  'Executive Cost View':          { label: 'Liveboard', cols: [] },
  'FnOps Monthly Review':         { label: 'Liveboard', cols: [] },
  'channel_cost_ratio': {
    label: 'Dependent',
    cols: [
      { name: 'cost_center', colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'channel',     colType: 'string' },
      { name: 'ratio',       colType: 'number' },
    ],
  },
  'cost_per_campaign': {
    label: 'Dependent',
    cols: [
      { name: 'allocation_type', colType: 'string', broken: true, brokenLabel: 'broken reference' },
      { name: 'campaign_id',     colType: 'string' },
      { name: 'cost',            colType: 'number' },
    ],
  },
};

const OBJECT_NOTES: Record<string, string> = {
  'Revenue Forecast':               'quarterly_target is used in 4 calculated columns in this model — all will be removed when you confirm the repair.',
  'Pipeline Health':                'forecast_region and pipeline_stage are referenced across 5 columns — all will be removed on confirm.',
  'Sales Analytics':                'This model is blocked — the dbt API token needs to be rotated before data can sync.',
  'Sales Performance':              'Same dbt connection issue. Once the token is rotated, this model resyncs automatically.',
  'Marketing Campaign Attribution': 'campaign_id shows 18% null rate since Jan 14. Organic-channel orders have no campaign assignment by design.',
  'FnOps Cost Model':               'cost_center and allocation_type were removed from the source warehouse on Jan 12 — 9 dependents are currently broken.',
  'Q4 Forecast':                    'This view references quarterly_target directly — it\'s been failing since Jan 12 when the column was removed.',
  'Pipeline Summary':               'This view references pipeline_stage, which was removed from the warehouse source on Jan 12.',
  'Regional Forecast':              'This view references both quarterly_target and forecast_region — both removed from source.',
  'Stage Conversion':               'pipeline_stage is used in the main grouping logic — it\'s been returning errors since Jan 12.',
  'Exec Revenue View':              'Uses quarterly_target for the target vs. actual calculation.',
  'Deal Velocity':                  'Segments deal velocity by forecast_region — failing since the column was removed.',
  'Q4 Cost Analysis':               'References both cost_center and allocation_type — this answer has been failing since the columns were removed.',
  'Budget Variance Report':         'Uses cost_center to group spend by department — the grouping dimension is now broken.',
  'FY Spend Summary':               'Uses allocation_type to categorize spend — currently returning errors.',
  'Regional Cost Breakdown':        'References both removed columns — all regional breakdowns are broken.',
  'Finance Operations Dashboard':   'cost_center is used in 3 of the 5 charts on this liveboard.',
  'Executive Cost View':            'allocation_type drives the primary breakdown on this liveboard.',
  'FnOps Monthly Review':           'Both removed columns are used across multiple charts on this liveboard.',
  'channel_cost_ratio':             'This formula divides spend by cost_center — it\'s returning null since cost_center was removed.',
  'cost_per_campaign':              'This formula uses allocation_type to weight cost — currently broken.',
};

// ── Liveboard layout data ─────────────────────────────────────────────────────

type LBTile = {
  id: string;
  title: string;
  chartType: ChartType;
  broken?: boolean;
  brokenCol?: string;
  cols: number;
  rows: number;
};

const LIVEBOARD_DATA: Record<string, { tabs: { id: string; label: string }[]; tiles: LBTile[] }> = {
  'Finance Operations Dashboard': {
    tabs: [{ id: 'overview', label: 'Overview' }, { id: 'monthly', label: 'Monthly' }],
    tiles: [
      { id: 't1', title: 'Total Spend by Cost Center',  chartType: 'bar',    broken: true,  brokenCol: 'cost_center',     cols: 6, rows: 3 },
      { id: 't2', title: 'Spend Over Time',             chartType: 'line',   broken: false,                                cols: 6, rows: 3 },
      { id: 't3', title: 'Cost Center Breakdown',       chartType: 'donut',  broken: true,  brokenCol: 'cost_center',     cols: 4, rows: 3 },
      { id: 't4', title: 'Monthly Variance',            chartType: 'column', broken: false,                                cols: 4, rows: 3 },
      { id: 't5', title: 'Top Cost Centers',            chartType: 'table',  broken: true,  brokenCol: 'cost_center',     cols: 4, rows: 3 },
    ],
  },
  'Executive Cost View': {
    tabs: [{ id: 'overview', label: 'Overview' }, { id: 'q4', label: 'Q4' }],
    tiles: [
      { id: 't1', title: 'Spend by Allocation Type',   chartType: 'column', broken: true,  brokenCol: 'allocation_type', cols: 6, rows: 3 },
      { id: 't2', title: 'Budget vs Actual',           chartType: 'bar',    broken: false,                                cols: 6, rows: 3 },
      { id: 't3', title: 'Allocation Distribution',    chartType: 'donut',  broken: true,  brokenCol: 'allocation_type', cols: 4, rows: 3 },
      { id: 't4', title: 'Spend Trend',                chartType: 'line',   broken: false,                                cols: 8, rows: 3 },
    ],
  },
  'FnOps Monthly Review': {
    tabs: [{ id: 'overview', label: 'Overview' }],
    tiles: [
      { id: 't1', title: 'Cost Center Overview',       chartType: 'bar',    broken: true,  brokenCol: 'cost_center',     cols: 6, rows: 3 },
      { id: 't2', title: 'Allocation Type Summary',    chartType: 'column', broken: true,  brokenCol: 'allocation_type', cols: 6, rows: 3 },
      { id: 't3', title: 'Monthly Spend Trend',        chartType: 'line',   broken: false,                                cols: 6, rows: 3 },
      { id: 't4', title: 'Cost Breakdown',             chartType: 'donut',  broken: true,  brokenCol: 'cost_center',     cols: 6, rows: 3 },
    ],
  },
};

// ── Column type colours ───────────────────────────────────────────────────────

const COL_TYPE_COLOR: Record<string, string> = {
  number:  '#7c3aed',
  string:  '#0369a1',
  date:    '#0f766e',
  boolean: '#a16207',
};

// ── LiveboardObjectView ───────────────────────────────────────────────────────

const LiveboardObjectView: React.FC<{ name: string; onClose: () => void }> = ({ name, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const data = LIVEBOARD_DATA[name];
  if (!data) return null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <LiveboardHeader
        mode="view"
        title={name}
        activeTab={activeTab}
        tabs={data.tabs}
        filters={[{ label: 'Time period', value: 'Last 12 months' }, { label: 'Region', value: 'All regions' }]}
        onTabChange={setActiveTab}
        onEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
      />

      <div style={{ position: 'relative', flex: 1, overflow: 'auto', backgroundColor: '#f4f5f7' }}>
        <button
          onClick={onClose}
          title="Close"
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            width: 28, height: 28, border: '1px solid rgba(0,0,0,0.12)',
            background: '#fff', cursor: 'pointer', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#666', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" /><line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>

        <div style={{ padding: '20px 20px 32px', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 12, alignItems: 'start' }}>
          {data.tiles.map(tile => (
            <div key={tile.id} style={{ gridColumn: `span ${tile.cols}`, position: 'relative' }}>
              <AnswerTile
                chartType={tile.chartType}
                title={tile.title}
                mode="view"
                style={{ height: tile.rows * 80 + (tile.rows - 1) * 12 }}
              />
              {tile.broken && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 8,
                  background: 'rgba(254,242,242,0.88)',
                  border: '1.5px solid #fca5a5',
                  display: 'flex', flexDirection: 'column' as const,
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  backdropFilter: 'blur(1px)',
                }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="#dc2626" strokeWidth="1.5"/>
                    <line x1="10" y1="5" x2="10" y2="11" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="10" cy="14.5" r="1" fill="#dc2626"/>
                  </svg>
                  <div style={{ fontSize: 12, fontWeight: fw.semibold, color: '#dc2626', textAlign: 'center' as const }}>
                    Column removed
                  </div>
                  <div style={{ fontSize: 11, color: '#991b1b', fontFamily: ff.mono }}>
                    {tile.brokenCol}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── ObjectPanel (models and dependents) ──────────────────────────────────────

const ObjectPanel: React.FC<{
  name: string;
  highlightCol?: string;
  onClose: () => void;
}> = ({ name, highlightCol, onClose }) => {
  const obj = OBJECT_DATA[name];

  if (obj?.label === 'Liveboard') {
    return <LiveboardObjectView name={name} onClose={onClose} />;
  }

  const cols = obj?.cols ?? [];
  const brokenCount = cols.filter(col => col.broken).length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Identity row — matches Workspace artifact */}
      <div style={{
        height: 48, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </span>
          <span style={{
            fontSize: 10, fontWeight: fw.semibold,
            color: obj?.label === 'Model' ? '#374151' : '#6d28d9',
            background: obj?.label === 'Model' ? '#f3f4f6' : '#ede9fe',
            border: `1px solid ${obj?.label === 'Model' ? '#e5e7eb' : '#ddd6fe'}`,
            borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase' as const, letterSpacing: '0.04em', flexShrink: 0,
          }}>
            {obj?.label ?? 'Object'}
          </span>
          {obj?.blocked && (
            <span style={{
              fontSize: 10, fontWeight: fw.semibold, color: '#92400e',
              background: '#fef3c7', border: '1px solid #fde68a',
              borderRadius: 4, padding: '1px 6px', flexShrink: 0,
            }}>sync blocked</span>
          )}
          {!obj?.blocked && brokenCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: fw.semibold, color: '#991b1b',
              background: '#fee2e2', border: '1px solid #fecaca',
              borderRadius: 4, padding: '1px 6px', flexShrink: 0,
            }}>
              {brokenCount} broken column{brokenCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          title="Close"
          style={{
            width: 28, height: 28, border: 'none', background: 'transparent',
            cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#999', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" />
            <line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>
      </div>

      {/* Column table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 24px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 72px 1fr',
          padding: '0 8px 8px', borderBottom: '1px solid rgba(0,0,0,0.06)',
          marginBottom: 4,
        }}>
          {['Column name', 'Type', 'Status'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: fw.semibold, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</span>
          ))}
        </div>

        {cols.map(col => {
          const isHighlighted = col.name === highlightCol || col.broken;
          return (
            <div
              key={col.name}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 72px 1fr',
                padding: '9px 8px',
                borderBottom: '1px solid rgba(0,0,0,0.04)',
                background: isHighlighted ? (col.broken ? '#fff8f8' : col.nullRate ? '#fffbeb' : 'transparent') : 'transparent',
                borderRadius: isHighlighted ? 5 : 0,
                alignItems: 'center',
              }}
            >
              <span style={{
                fontFamily: ff.mono, fontSize: 12,
                color: col.broken ? '#991b1b' : col.nullRate ? '#92400e' : '#1a1a1a',
                fontWeight: isHighlighted ? fw.semibold : fw.regular,
              }}>
                {col.name}
              </span>
              <span style={{
                fontSize: 11, color: COL_TYPE_COLOR[col.colType] ?? '#555',
                background: 'rgba(0,0,0,0.04)', borderRadius: 4,
                padding: '1px 5px', fontFamily: ff.mono,
                alignSelf: 'center', display: 'inline-block', width: 'fit-content',
              }}>
                {col.colType}
              </span>
              <div>
                {col.broken && (
                  <span style={{
                    fontSize: 11, fontWeight: fw.semibold,
                    color: '#dc2626', background: '#fee2e2',
                    border: '1px solid #fca5a5', borderRadius: 4, padding: '2px 6px',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#dc2626" strokeWidth="1.4"/><line x1="3.2" y1="3.2" x2="6.8" y2="6.8" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round"/><line x1="6.8" y1="3.2" x2="3.2" y2="6.8" stroke="#dc2626" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    {col.brokenLabel ?? 'broken'}
                  </span>
                )}
                {col.nullRate && (
                  <span style={{
                    fontSize: 11, fontWeight: fw.semibold,
                    color: '#d97706', background: '#fef3c7',
                    border: '1px solid #fde68a', borderRadius: 4, padding: '2px 6px',
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M5 1v4" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"/><circle cx="5" cy="8" r="0.9" fill="#d97706"/></svg>
                    {col.nullRate}% null
                  </span>
                )}
                {!col.broken && !col.nullRate && (
                  <span style={{ fontSize: 11, color: '#16a34a' }}>✓</span>
                )}
              </div>
            </div>
          );
        })}

        {obj?.blocked && (
          <div style={{
            marginTop: 12, padding: '10px 12px', borderRadius: 7,
            background: '#fef3c7', border: '1px solid #fde68a',
            fontSize: 12, color: '#78350f', lineHeight: 1.5,
          }}>
            Sync blocked — dbt Cloud connection is offline. Rotate the API token to restore data flow.
          </div>
        )}
      </div>
    </div>
  );
};

// ── FullChatView ──────────────────────────────────────────────────────────────

interface FullChatViewProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  initialFlow: string;
  initialMessage?: string;
  onBack: () => void;
  onInsightResolved?: (id: string) => void;
}

const AGENT_MIN = 320;
const AGENT_MAX = () => window.innerWidth - 320;
const AGENT_DEFAULT = () => Math.round(window.innerWidth * 0.4);

const FullChatView: React.FC<FullChatViewProps> = ({ project, setProject, initialFlow, initialMessage, onBack, onInsightResolved }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const [activeObject, setActiveObject] = useState<{ name: string; highlightCol?: string } | null>(null);
  const [referencedObjects, setReferencedObjects] = useState<string[]>([]);
  const [agentWidth, setAgentWidth] = useState(CHAT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(CHAT_WIDTH);

  const ctx = FLOW_CONTEXT[initialFlow] ?? { models: [], tables: [], skill: '' };
  const isSplit = !!activeObject;

  const allModels = Array.from(new Set([...ctx.models, ...referencedObjects]));

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      const next = Math.min(Math.max(dragStartWidth.current + delta, AGENT_MIN), AGENT_MAX());
      setAgentWidth(next);
    };
    const onUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  const handleOpenObject = useCallback((name: string, highlightCol?: string) => {
    setActiveObject({ name, highlightCol });
    setReferencedObjects(prev => prev.includes(name) ? prev : [...prev, name]);
    setAgentWidth(AGENT_DEFAULT());
    setContextPanelOpen(false);
    const note = OBJECT_NOTES[name];
    if (note) {
      setMessages(prev => [...prev, {
        id: `obj-note-${Date.now()}`,
        type: 'response' as const,
        content: note,
      }]);
    }
  }, []);

  const handleCloseObject = useCallback(() => {
    setActiveObject(null);
    setContextPanelOpen(true);
  }, []);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', backgroundColor: c['background-base'], fontFamily: ff.primary,
    }}>

      {/* 48px header */}
      <div style={{
        height: 48, flexShrink: 0, display: 'flex', alignItems: 'center',
        borderBottom: `1px solid ${c['border-divider']}`, padding: '0 16px',
      }}>
        <div style={{ flex: 1 }}>
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary, borderRadius: 4,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
            onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Overview
          </button>
        </div>
        <button
          onClick={() => setContextPanelOpen(o => !o)}
          title={contextPanelOpen ? 'Hide context panel' : 'Show context panel'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            display: 'flex', alignItems: 'center',
            color: contextPanelOpen ? c['content-primary'] : c['content-secondary'], borderRadius: 4,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1.5" y="1.5" width="15" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <line x1="12" y1="1.5" x2="12" y2="16.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Agent chat — single instance, wrapper resizes on split */}
        <div style={{
          width: isSplit ? agentWidth : '100%',
          flexShrink: 0,
          height: '100%',
          display: 'flex',
          justifyContent: isSplit ? 'flex-start' : 'center',
          overflow: 'hidden',
        }}>
          <div style={{ width: isSplit ? agentWidth : CHAT_WIDTH, height: '100%', display: 'flex', overflow: 'hidden' }}>
            <AgentPanel
              project={project}
              setProject={setProject}
              messages={messages}
              setMessages={setMessages}
              initialFlow={initialFlow}
              initialMessage={initialMessage}
              width={isSplit ? agentWidth : CHAT_WIDTH}
              onBack={onBack}
              onInsightResolved={onInsightResolved}
              onOpenObject={handleOpenObject}
            />
          </div>
        </div>

        {/* Drag handle — only visible in split mode */}
        {isSplit && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              dragStartX.current = e.clientX;
              dragStartWidth.current = agentWidth;
              setIsDragging(true);
              document.body.style.userSelect = 'none';
              document.body.style.cursor = 'col-resize';
            }}
            style={{ width: 5, flexShrink: 0, cursor: 'col-resize', backgroundColor: c['background-base'] }}
          />
        )}

        {/* Object panel — artifact card, slides in from right */}
        {isSplit && (
          <div style={{
            flex: 1, minWidth: 0, display: 'flex', padding: '8px 8px 8px 0',
            backgroundColor: c['background-base'],
            animation: 'obj-slide-in 0.22s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            <style>{`@keyframes obj-slide-in { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }`}</style>
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
              border: `1px solid ${c['border-divider']}`,
              borderRadius: 10,
              backgroundColor: c['background-base'],
            }}>
              <ObjectPanel
                name={activeObject.name}
                highlightCol={activeObject.highlightCol}
                onClose={handleCloseObject}
              />
            </div>
          </div>
        )}

        {/* Context panel — independently toggled via header button */}
        {contextPanelOpen && (
          <ChatContextPanel
            created={[]}
            models={allModels}
            tables={ctx.tables}
            skills={ctx.skill ? [ctx.skill] : []}
          />
        )}

      </div>
    </div>
  );
};

export default FullChatView;
