import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { c, sp, fs, fw, ff } from '../styles';
import { COLUMNS, ISSUES, PROFILING_METRICS, Issue } from '../data/mockData';
import PrepHistoryModal from './PrepHistoryModal';
import PrepWizard from './PrepWizard';

// ── Types ─────────────────────────────────────────────────────────────────────

type PrepState = 'profiled' | 'done';

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtNumber = (n: number) => n.toLocaleString();

// Map columnId → issue for quick lookup
const issuesByColumn = ISSUES.reduce<Record<string, Issue>>((acc, issue) => {
  acc[issue.columnId] = issue;
  return acc;
}, {});

const DataTypePill: React.FC<{ type: string }> = ({ type }) => (
  <span style={{
    fontSize: 10, fontFamily: 'monospace', fontWeight: fw.medium,
    color: '#7c3aed', backgroundColor: '#f5f3ff',
    borderRadius: 3, padding: '1px 5px',
  }}>{type}</span>
);

// ── Tooltip (portal-based to avoid overflow clipping) ────────────────────────

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4, cursor: 'default' }}
      onMouseEnter={() => {
        if (ref.current) {
          const r = ref.current.getBoundingClientRect();
          setPos({ x: r.left + r.width / 2, y: r.top });
        }
      }}
      onMouseLeave={() => setPos(null)}
    >
      <span style={{ fontSize: 10, color: c['content-tertiary'], lineHeight: 1 }}>ⓘ</span>
      {pos && createPortal(
        <span style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y - 6,
          transform: 'translate(-50%, -100%)',
          backgroundColor: c['background-base-inverse'],
          color: c['content-primary-inverse'],
          borderRadius: 4, padding: '4px 8px',
          fontSize: 11, whiteSpace: 'nowrap',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
        }}>
          {text}
        </span>,
        document.body
      )}
    </span>
  );
};

// ── Model-level metrics bar ───────────────────────────────────────────────────

const MetricsBar: React.FC<{ clean?: boolean }> = ({ clean = false }) => {
  const score  = clean ? 98 : PROFILING_METRICS.completenessScore;
  const issues = clean ? 0  : PROFILING_METRICS.totalIssues;

  const metrics = [
    { label: 'Total rows',      value: fmtNumber(PROFILING_METRICS.totalRows) },
    { label: 'Completeness',    value: `${score}%` },
    { label: 'Issues detected', value: String(issues) },
  ];

  return (
    <div style={{
      display: 'flex', gap: 1,
      backgroundColor: c['border-divider'],
      borderBottom: `1px solid ${c['border-divider']}`,
      flexShrink: 0,
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          flex: 1, padding: `${sp.C}px ${sp.D}px`,
          backgroundColor: c['background-base'],
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{m.label}</div>
          <div style={{ fontSize: 20, fontWeight: fw.semibold, color: c['content-primary'] }}>
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Column profile table ──────────────────────────────────────────────────────

const ISSUE_COLS: { key: Issue['issueType']; label: string; tooltip: string }[] = [
  { key: 'nulls',         label: 'Null %',            tooltip: 'Percentage of rows with NULL values in this column' },
  { key: 'duplicates',    label: 'Duplicates',         tooltip: 'Rows with duplicate values that may indicate data entry errors' },
  { key: 'anomaly',       label: 'Anomalies',          tooltip: 'Values more than 3 standard deviations from the column mean' },
  { key: 'blanks',        label: 'Blanks',             tooltip: 'Rows with empty strings or whitespace-only values' },
  { key: 'type_mismatch', label: 'Inconsistent types', tooltip: 'Rows where the value does not match the declared column data type' },
];

const ColumnProfileTable: React.FC = () => (
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.sm }}>
    <thead>
      <tr style={{ backgroundColor: c['background-subtle'], position: 'sticky', top: 0, zIndex: 1 }}>
        <th style={{ padding: `${sp.B}px ${sp.D}px`, textAlign: 'left', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], borderBottom: `1px solid ${c['border-divider']}`, whiteSpace: 'nowrap' }}>
          Column
        </th>
        <th style={{ padding: `${sp.B}px ${sp.D}px`, textAlign: 'left', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], borderBottom: `1px solid ${c['border-divider']}`, whiteSpace: 'nowrap' }}>
          Data type
        </th>
        {ISSUE_COLS.map(ic => (
          <th key={ic.key} style={{ padding: `${sp.B}px ${sp.D}px`, textAlign: 'left', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], borderBottom: `1px solid ${c['border-divider']}`, whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {ic.label}
              <Tooltip text={ic.tooltip} />
            </span>
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {COLUMNS.map((col, i) => {
        const issue = issuesByColumn[col.id];
        return (
          <tr key={col.id} style={{ backgroundColor: i % 2 === 0 ? c['background-base'] : c['background-sunken'] }}>
            <td style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontWeight: fw.medium, color: c['content-primary'] }}>
              {col.name}
            </td>
            <td style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
              <DataTypePill type={col.dataType} />
            </td>
            {/* Null % — derived from column nullPct, not issue */}
            <td style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.xs, color: c['content-primary'] }}>
              {col.nullPct === 0 ? <span style={{ color: c['content-secondary'] }}>—</span> : `${col.nullPct.toFixed(1)}%`}
            </td>
            {/* Duplicates */}
            <td style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.xs, color: issue?.issueType === 'duplicates' ? c['content-primary'] : c['content-secondary'] }}>
              {issue?.issueType === 'duplicates' ? fmtNumber(issue.affectedRows) : '—'}
            </td>
            {/* Anomalies */}
            <td style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.xs, color: issue?.issueType === 'anomaly' ? c['content-primary'] : c['content-secondary'] }}>
              {issue?.issueType === 'anomaly' ? fmtNumber(issue.affectedRows) : '—'}
            </td>
            {/* Blanks */}
            <td style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.xs, color: issue?.issueType === 'blanks' ? c['content-primary'] : c['content-secondary'] }}>
              {issue?.issueType === 'blanks' ? fmtNumber(issue.affectedRows) : '—'}
            </td>
            {/* Inconsistent types */}
            <td style={{ padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, fontSize: fs.xs, color: issue?.issueType === 'type_mismatch' ? c['content-primary'] : c['content-secondary'] }}>
              {issue?.issueType === 'type_mismatch' ? fmtNumber(issue.affectedRows) : '—'}
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);


// ── Shared button styles ──────────────────────────────────────────────────────

const primaryBtn: React.CSSProperties = {
  padding: `${sp.B}px ${sp.D}px`,
  backgroundColor: c['background-brand'],
  color: '#fff',
  border: 'none', borderRadius: 6,
  fontSize: fs.sm, fontWeight: fw.medium,
  cursor: 'pointer', fontFamily: ff.primary,
};


// ── Main SpotterPrepTab ───────────────────────────────────────────────────────

const SpotterPrepTab: React.FC = () => {
  const [prepState, setPrepState] = useState<PrepState>('profiled');
  const [showWizard, setShowWizard]   = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Prep banner — shown before prep is done */}
      {prepState === 'profiled' && (
        <div style={{
          padding: `${sp.D}px ${sp.D}px`,
          backgroundColor: c['background-subtle'],
          borderBottom: `1px solid ${c['border-divider']}`,
          display: 'flex', alignItems: 'center', gap: sp.D,
          flexShrink: 0,
        }}>
          {/* Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(145deg, #dbeafe 0%, #eff6ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            🩺
          </div>
          {/* Text */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: 3 }}>
              Get started with data prep for agents
            </div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.6 }}>
              Spotter's answers are only as good as your data. SpotterPrep scans your model for quality issues — nulls,
              blanks, duplicates, and type mismatches — and automatically applies fixes on every cache refresh, so your
              agents always reason over clean, reliable data.
            </div>
          </div>
          {/* CTA */}
          <button onClick={() => setShowWizard(true)} style={primaryBtn}>
            Prep data
          </button>
        </div>
      )}

      {/* Metrics bar */}
      <MetricsBar clean={prepState === 'done'} />

      {/* Column profile section label */}
      <div style={{
        padding: `${sp.C}px ${sp.D}px`,
        backgroundColor: c['background-base'],
        borderBottom: `1px solid ${c['border-divider']}`,
        display: 'flex', alignItems: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>
          Column profile
        </span>
        <div style={{ flex: 1 }} />
        {prepState === 'done' && (
          <button
            onClick={() => setShowHistory(true)}
            style={{ background: 'none', border: 'none', padding: 0, color: c['content-brand'], fontSize: fs.xs, cursor: 'pointer', fontFamily: ff.primary }}
          >
            Prep history
          </button>
        )}
      </div>

      {/* Column profile table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <ColumnProfileTable />
      </div>

      {/* Prep wizard */}
      {showWizard && (
        <PrepWizard
          onClose={() => setShowWizard(false)}
          onDone={() => { setShowWizard(false); setPrepState('done'); }}
        />
      )}

      {/* Prep history modal */}
      {showHistory && <PrepHistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  );
};

export default SpotterPrepTab;
