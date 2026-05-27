import React, { useState, useCallback } from 'react';
import { c, sp, fs, fw, ff, styles, TAB_BAR_HEIGHT } from '../styles';
import { MODEL, COLUMNS } from '../data/mockData';
import QualityTab from './QualityTab';
import type { QualityState } from './QualityTab';
import CachingTab from './CachingTab';

// ── Tab types ─────────────────────────────────────────────────────────────────

type ModelTab = 'columns' | 'joins' | 'data-samples' | 'dependents' | 'instructions' | 'caching' | 'quality';

const TABS: { id: ModelTab; label: string }[] = [
  { id: 'columns',      label: 'Columns'      },
  { id: 'joins',        label: 'Joins'        },
  { id: 'data-samples', label: 'Data samples' },
  { id: 'dependents',   label: 'Dependents'   },
  { id: 'instructions', label: 'Instructions' },
  { id: 'caching',      label: 'Caching'      },
  { id: 'quality',      label: 'Quality'      },
];

// ── Stub tab ──────────────────────────────────────────────────────────────────

const StubTab: React.FC<{ label: string; note?: string }> = ({ label, note }) => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: sp.D, color: c['content-secondary'] }}>
    <div style={{ fontSize: 28, opacity: 0.4 }}>⊞</div>
    <div style={{ fontSize: fs.md, color: c['content-secondary'] }}>{note ?? `${label} tab`}</div>
  </div>
);

// ── Dependents tab ────────────────────────────────────────────────────────────

const LIVEBOARD_NAMES = ['Revenue Overview', 'Sales Performance', 'HR Dashboard', 'Ops Summary', 'Finance Monthly', 'Exec Dashboard'];
const ANSWER_NAMES = ['YoY Revenue', 'Headcount by Dept', 'Q1 Sales', 'Budget vs Actual', 'Attrition Rate', 'Hire Trends', 'Payroll Summary', 'Bonus Analysis', 'Tenure Distribution', 'Department Costs', 'Manager Span'];
const CHAT_NAMES = ['Revenue question', 'Headcount analysis', 'Salary outliers', 'Department breakdown'];

const DependentsTab: React.FC = () => {
  const { dependents } = MODEL;
  const sections = [
    { label: 'Liveboards', count: dependents.liveboards, items: LIVEBOARD_NAMES, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Saved answers', count: dependents.answers, items: ANSWER_NAMES, color: '#6366f1', bg: '#eef2ff' },
    { label: 'Spotter chats', count: dependents.spotChats, items: CHAT_NAMES, color: '#10b981', bg: '#ecfdf5' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: sp.F }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: sp.D }}>
        {sections.map(sec => (
          <div key={sec.label} style={{
            border: `1px solid ${c['border-default']}`,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: c['background-base'],
          }}>
            {/* Card header */}
            <div style={{
              padding: `${sp.D}px ${sp.E}px`,
              borderBottom: `1px solid ${c['border-divider']}`,
              display: 'flex', alignItems: 'center', gap: sp.B,
            }}>
              <span style={{
                fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: 1,
              }}>{sec.count}</span>
              <span style={{
                fontSize: fs.sm, fontWeight: fw.medium, color: c['content-secondary'],
              }}>{sec.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: fw.medium, color: sec.color, backgroundColor: sec.bg, borderRadius: 10, padding: '2px 8px' }}>
                {sec.count}
              </span>
            </div>
            {/* Items list */}
            <div style={{ padding: `${sp.B}px 0` }}>
              {sec.items.map(item => (
                <div key={item} style={{
                  padding: `${sp.A}px ${sp.E}px`,
                  fontSize: fs.sm,
                  fontFamily: ff.mono,
                  color: c['content-brand'],
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Columns tab ───────────────────────────────────────────────────────────────

const ColumnsTab: React.FC = () => {
  const empCols = COLUMNS.filter(col => col.table === 'employees');

  const issueColors: Record<string, { color: string; bg: string }> = {
    null_rate:           { color: '#c2410c', bg: '#fff7ed' },
    negative_values:     { color: '#7c3aed', bg: '#f5f3ff' },
    float_precision:     { color: '#0369a1', bg: '#eff6ff' },
    date_format:         { color: '#065f46', bg: '#ecfdf5' },
    duplicates:          { color: '#be185d', bg: '#fdf2f8' },
    orphaned_fk:         { color: '#b45309', bg: '#fef3c7' },
    impossible_sequence: { color: '#dc2626', bg: '#fee2e2' },
    outliers:            { color: '#9333ea', bg: '#faf5ff' },
  };

  const issueLabels: Record<string, string> = {
    null_rate: 'Null', negative_values: 'Negative', float_precision: 'Precision',
    date_format: 'Date format', duplicates: 'Duplicate', orphaned_fk: 'Orphaned FK',
    impossible_sequence: 'Impossible seq.', outliers: 'Outlier',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.md }}>
        <thead>
          <tr style={{ backgroundColor: c['background-subtle'], position: 'sticky', top: 0 }}>
            {['Column name', 'Data type', 'Null %', 'Issue'].map(h => (
              <th key={h} style={{
                padding: `${sp.C}px ${sp.D}px`,
                textAlign: 'left', fontSize: fs.md, fontWeight: fw.medium,
                color: c['content-secondary'],
                borderBottom: `1px solid ${c['border-divider']}`,
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empCols.map((col, i) => {
            const ic = col.issueType ? issueColors[col.issueType] : null;
            return (
              <tr key={col.id} style={{ backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-sunken'] }}>
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.mono }}>
                  {col.name}
                </td>
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                  <span style={{ fontSize: 10, fontFamily: ff.mono, fontWeight: fw.medium, color: '#7c3aed', backgroundColor: '#f5f3ff', borderRadius: 3, padding: '1px 5px' }}>
                    {col.dataType}
                  </span>
                </td>
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.md, color: col.nullPct > 0 ? '#c2410c' : c['content-tertiary'] }}>
                  {col.nullPct > 0 ? `${col.nullPct.toFixed(1)}%` : '—'}
                </td>
                <td style={{ padding: `${sp.D}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                  {col.hasIssue && ic && col.issueType ? (
                    <span style={{ fontSize: 10, fontWeight: fw.medium, color: ic.color, backgroundColor: ic.bg, borderRadius: 4, padding: '2px 7px' }}>
                      {issueLabels[col.issueType]}
                    </span>
                  ) : (
                    <span style={{ color: c['content-tertiary'] }}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={4} style={{ padding: `${sp.D}px ${sp.D}px`, fontSize: fs.md, color: c['content-tertiary'], fontStyle: 'italic', borderTop: `1px solid ${c['border-divider']}` }}>
              Showing employees table ({empCols.length} of {COLUMNS.length} columns)
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ── ModelDetail ───────────────────────────────────────────────────────────────

export interface ModelDetailProps {
  modelId: string;
  qualityState: QualityState;
  onBack: () => void;
  onStartQuality: () => void;
  onSetupCache: () => void;
  onRescan: () => void;
  defaultTab?: ModelTab;
}

const MODEL_NAMES: Record<string, string> = {
  'hr-analytics':       'hr-analytics',
  'hr-analytics-clean': 'hr-analytics · cleaned',
};

const ModelDetail: React.FC<ModelDetailProps> = ({
  modelId,
  qualityState,
  onBack,
  onStartQuality,
  onSetupCache,
  onRescan,
  defaultTab = 'quality',
}) => {
  const [activeTab, setActiveTab] = useState<ModelTab>(defaultTab);
  const [autoOpenCacheModal, setAutoOpenCacheModal] = useState(false);
  const modelName = MODEL_NAMES[modelId] ?? modelId;

  const handleQualitySetupCache = useCallback(() => {
    setActiveTab('caching');
    setAutoOpenCacheModal(true);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page header */}
      <div style={styles.pageHeader}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: c['content-secondary'], fontSize: 18, padding: 4, lineHeight: 1,
          display: 'flex', alignItems: 'center',
        }}>←</button>
        <div>
          <div style={{ fontSize: fs.md, color: c['content-secondary'] }}>MODEL</div>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>{modelName}</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: sp.B }}>
          <input
            placeholder="Search this model"
            style={{
              padding: `${sp.A}px ${sp.C}px`, borderRadius: 6,
              border: `1px solid ${c['border-default']}`,
              fontSize: fs.md, color: c['content-primary'],
              fontFamily: ff.primary, width: 180,
              backgroundColor: c['background-sunken'],
              outline: 'none',
            }}
          />
          <button style={{
            padding: `${sp.A}px ${sp.C}px`, borderRadius: 6,
            border: `1px solid ${c['border-default']}`,
            fontSize: fs.md, color: c['content-secondary'],
            backgroundColor: 'transparent', cursor: 'pointer', fontFamily: ff.primary,
          }}>Edit model</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: `0 ${sp.C}px`,
                height: TAB_BAR_HEIGHT,
                background: 'none',
                border: 'none',
                borderBottom: active ? `2px solid ${c['border-brand']}` : '2px solid transparent',
                cursor: 'pointer',
                fontSize: fs.md,
                fontFamily: ff.primary,
                fontWeight: active ? fw.semibold : fw.regular,
                color: active ? c['content-brand'] : c['content-secondary'],
                whiteSpace: 'nowrap',
                marginBottom: -1,
                transition: 'color 0.1s',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: c['background-base'] }}>
        {activeTab === 'columns'      && <ColumnsTab />}
        {activeTab === 'joins'        && <StubTab label="Joins" note="3 joins defined" />}
        {activeTab === 'data-samples' && <StubTab label="Data samples" note="Preview of first 100 rows" />}
        {activeTab === 'dependents'   && <DependentsTab />}
        {activeTab === 'instructions' && <StubTab label="Instructions" note="Model instructions for Spotter" />}
        {activeTab === 'caching' && (
          <CachingTab
            modelId={modelId}
            qualityState={qualityState}
            onEnableCache={onSetupCache}
            onEditCache={() => {}}
            autoOpenModal={autoOpenCacheModal}
            onAutoOpenConsumed={() => setAutoOpenCacheModal(false)}
          />
        )}
        {activeTab === 'quality' && (
          <QualityTab
            qualityState={qualityState}
            onSetupCache={handleQualitySetupCache}
            onStartQuality={onStartQuality}
            onRescan={onRescan}
            modelId={modelId}
          />
        )}
      </div>
    </div>
  );
};

export default ModelDetail;
