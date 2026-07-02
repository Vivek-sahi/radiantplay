import React, { useState, useRef, useEffect } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { PlanData, PlanColumn, PlanRelationship, PlanTable } from './AgentPanel';

interface PlanPanelProps {
  plan: PlanData;
  onClose: () => void;
  buildingMode?: boolean;
  onBuildComplete?: () => void;
  onBuildModel?: () => void;
  hideClose?: boolean;
  readOnly?: boolean;
  hideHeader?: boolean;
}

type PlanTab = 'tables' | 'relationships' | 'metrics' | 'questions';

// ── Badge palette ──────────────────────────────────────────────────────────────

const BADGE = {
  fact:      { bg: '#EEF4FF', text: '#2563EB' },
  dimension: { bg: '#ECFDF5', text: '#059669' },
  metric:    { bg: '#F5F3FF', text: '#7C3AED' },
  formula:   { bg: '#FFF7ED', text: '#EA580C' },
};

// ── TypeBadge ─────────────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ label: string; kind: keyof typeof BADGE }> = ({ label, kind }) => (
  <span style={{
    display: 'inline-block',
    fontSize: 11,
    fontWeight: fw.semibold,
    padding: '2px 7px',
    borderRadius: 4,
    backgroundColor: BADGE[kind].bg,
    color: BADGE[kind].text,
    lineHeight: '16px',
    whiteSpace: 'nowrap' as const,
  }}>{label}</span>
);

// ── ConfidenceBadge ────────────────────────────────────────────────────────────

const ConfidenceBadge: React.FC<{ value: number; reasoning?: string }> = ({ value, reasoning }) => {
  const [tip, setTip] = useState(false);
  const color = value >= 85 ? '#16A34A' : value >= 70 ? '#D97706' : '#DC2626';
  const bg    = value >= 85 ? 'rgba(22,163,74,0.08)' : value >= 70 ? 'rgba(217,119,6,0.08)' : 'rgba(220,38,38,0.08)';
  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      <span style={{ fontSize: 11, fontWeight: fw.semibold, color, backgroundColor: bg, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap' as const, cursor: 'default' }}>
        {value}%
      </span>
      {reasoning && tip && (
        <div style={{
          position: 'absolute', bottom: '100%', right: 0, marginBottom: 6,
          backgroundColor: '#1C1C2E', color: '#F1F5F9',
          fontSize: fs.xs, lineHeight: '18px',
          padding: '7px 10px', borderRadius: 6,
          width: 240, whiteSpace: 'normal' as const,
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
          zIndex: 100, pointerEvents: 'none' as const,
        }}>
          {reasoning}
        </div>
      )}
    </div>
  );
};

// ── SectionHeader ──────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div style={{ paddingTop: sp.D, paddingBottom: sp.C }}>
    <div style={{ fontSize: 14, fontWeight: fw.semibold, color: c['content-primary'], lineHeight: '20px' }}>{title}</div>
    <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2, lineHeight: '16px' }}>{subtitle}</div>
  </div>
);

// ── Callout ────────────────────────────────────────────────────────────────────

const Callout: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div style={{
    borderLeft: '3px solid #F59E0B',
    backgroundColor: '#FFFBEB',
    borderRadius: '0 6px 6px 0',
    padding: `${sp.C}px ${sp.D}px`,
    marginTop: sp.D,
  }}>
    <div style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: '#D97706', lineHeight: '16px' }}>{title}</div>
    <div style={{ fontSize: fs.xs, color: '#92400E', lineHeight: '18px', marginTop: 3 }}>{body}</div>
  </div>
);

// ── DataTable ──────────────────────────────────────────────────────────────────

const DataTable: React.FC<{
  headers: string[];
  rows: React.ReactNode[][];
  cols: string;
}> = ({ headers, rows, cols }) => (
  <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
    <div style={{
      display: 'grid', gridTemplateColumns: cols, gap: sp.D,
      padding: `${sp.B}px ${sp.D}px`,
      backgroundColor: c['background-subtle'],
      borderBottom: `1px solid ${c['border-divider']}`,
    }}>
      {headers.map((h, i) => (
        <span key={i} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'] }}>{h}</span>
      ))}
    </div>
    {rows.map((row, ri) => (
      <div key={ri} style={{
        display: 'grid', gridTemplateColumns: cols, gap: sp.D,
        padding: `${sp.D}px ${sp.D}px`,
        backgroundColor: c['background-base'],
        borderBottom: ri < rows.length - 1 ? `1px solid ${c['border-divider']}` : 'none',
        alignItems: 'start',
      }}>
        {row.map((cell, ci) => <div key={ci}>{cell}</div>)}
      </div>
    ))}
  </div>
);

// ── InlineField ────────────────────────────────────────────────────────────────

const InlineField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  mono?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}> = ({ value, onChange, multiline = false, mono = false, placeholder = 'Add text…', style }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [hovered, setHovered] = useState(false);

  React.useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  const commit = () => { onChange(draft.trim() || value); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  const base: React.CSSProperties = {
    fontFamily: mono ? ff.mono : ff.primary,
    fontSize: fs.sm,
    lineHeight: '20px',
    color: c['content-primary'],
    ...style,
  };

  if (editing) {
    return multiline ? (
      <textarea
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
        rows={Math.max(2, draft.split('\n').length)}
        style={{
          ...base, width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' as const,
          border: `1.5px solid ${c['content-brand']}`, borderRadius: 4,
          padding: '3px 6px', outline: 'none', backgroundColor: c['background-base'], display: 'block',
        }}
      />
    ) : (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
        style={{
          ...base, width: '100%', boxSizing: 'border-box' as const,
          border: `1.5px solid ${c['content-brand']}`, borderRadius: 4,
          padding: '2px 6px', outline: 'none', backgroundColor: c['background-base'], display: 'block',
        }}
      />
    );
  }

  return (
    <span
      title="Click to edit"
      onClick={() => setEditing(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...base, cursor: 'text', display: 'block', borderRadius: 4,
        padding: '1px 4px', margin: '0 -4px',
        backgroundColor: hovered ? c['background-subtle'] : 'transparent',
        transition: 'background-color 0.1s',
        whiteSpace: multiline ? 'pre-wrap' as const : undefined,
      }}
    >
      {value || <span style={{ color: c['content-secondary'], fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
};

// ── Remove button ──────────────────────────────────────────────────────────────

const RemoveBtn: React.FC<{ onClick: () => void; visible: boolean; title?: string }> = ({ onClick, visible, title = 'Remove' }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      flexShrink: 0, width: 20, height: 20, border: 'none', background: 'none',
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 3, color: c['content-secondary'], padding: 0,
      opacity: visible ? 1 : 0, transition: 'opacity 0.1s',
    }}
    onMouseEnter={e => { e.currentTarget.style.color = '#DC2626'; }}
    onMouseLeave={e => { e.currentTarget.style.color = c['content-secondary']; }}
  >
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
    </svg>
  </button>
);

// ── ColumnRow ──────────────────────────────────────────────────────────────────

const COL_GRID = '1.2fr 110px 2fr';

const ColumnRow: React.FC<{
  col: PlanColumn;
  onUpdate: (field: keyof PlanColumn, val: string) => void;
  onRemove: () => void;
  isLast: boolean;
  readOnly?: boolean;
}> = ({ col, onUpdate, onRemove, isLast, readOnly = false }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: COL_GRID, gap: sp.D,
        padding: `${sp.D}px ${sp.D}px`,
        backgroundColor: c['background-base'],
        borderBottom: isLast ? 'none' : `1px solid ${c['border-divider']}`,
        alignItems: 'start',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div>
        <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], display: 'block', padding: '1px 4px', margin: '0 -4px' }}>{col.name}</span>
      </div>
      <div>
        <TypeBadge
          label={col.type === 'metric' ? 'Metric' : 'Dimension'}
          kind={col.type === 'metric' ? 'metric' : 'dimension'}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {readOnly
            ? <span style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px', display: 'block', padding: '1px 4px', margin: '0 -4px' }}>{col.description}</span>
            : <InlineField value={col.description} onChange={v => onUpdate('description', v)} multiline placeholder="Add description…" style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }} />
          }
        </div>
        {col.confidence !== undefined && <ConfidenceBadge value={col.confidence} reasoning={col.reasoning} />}
        {!readOnly && <RemoveBtn onClick={onRemove} visible={hovered} title="Remove column" />}
      </div>
    </div>
  );
};

// ── Available columns per table (schema source of truth for the dropdown) ──────

const AVAILABLE_COLS: Record<string, Array<{ name: string; type: 'metric' | 'dimension' }>> = {
  dim_accounts: [
    { name: 'account_id',    type: 'dimension' },
    { name: 'account_name',  type: 'dimension' },
    { name: 'industry',      type: 'dimension' },
    { name: 'arr',           type: 'metric'    },
    { name: 'region',        type: 'dimension' },
    { name: 'account_tier',  type: 'dimension' },
    { name: 'renewal_date',  type: 'dimension' },
    { name: 'csm_region',    type: 'dimension' },
  ],
  support_cases: [
    { name: 'account_id',            type: 'dimension' },
    { name: 'priority',              type: 'dimension' },
    { name: 'status',                type: 'dimension' },
    { name: 'case_category',         type: 'dimension' },
    { name: 'resolution_time_hours', type: 'metric'    },
    { name: 'reopened',              type: 'dimension' },
    { name: 'created_date',          type: 'dimension' },
  ],
  call_metrics: [
    { name: 'account_id',           type: 'dimension' },
    { name: 'sentiment_score',      type: 'metric'    },
    { name: 'avg_sentiment_score',  type: 'metric'    },
    { name: 'next_steps_mentioned', type: 'metric'    },
    { name: 'deal_risk_flag',       type: 'dimension' },
    { name: 'call_date',            type: 'dimension' },
  ],
  customer_found_defects: [
    { name: 'account_id',               type: 'dimension' },
    { name: 'severity',                 type: 'dimension' },
    { name: 'resolution_days',          type: 'metric'    },
    { name: 'escalated_to_engineering', type: 'dimension' },
    { name: 'status',                   type: 'dimension' },
  ],
  customer_health_external: [
    { name: 'account_id',     type: 'dimension' },
    { name: 'nps_score',      type: 'metric'    },
    { name: 'sentiment',      type: 'dimension' },
    { name: 'sentiment_score',type: 'metric'    },
    { name: 'csm_name',       type: 'dimension' },
    { name: 'exec_sponsor',   type: 'dimension' },
  ],
};

// ── TableSection ───────────────────────────────────────────────────────────────

const TableSection: React.FC<{
  t: PlanTable;
  isFact: boolean;
  indexedCols: { col: PlanColumn; idx: number }[];
  onRemoveTable: () => void;
  onUpdateCol: (idx: number, field: keyof PlanColumn, val: string) => void;
  onRemoveCol: (idx: number) => void;
  onAddCol: (name: string, type: 'metric' | 'dimension') => void;
  buildComplete?: boolean;
  readOnly?: boolean;
}> = ({ t, isFact, indexedCols, onRemoveTable, onUpdateCol, onRemoveCol, onAddCol, buildComplete = true, readOnly = false }) => {
  const [barHovered, setBarHovered] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  const existing = new Set(indexedCols.map(({ col }) => col.name));
  const schema = AVAILABLE_COLS[t.name] ?? [];
  const options = schema.filter(o => !existing.has(o.name) && o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ marginBottom: sp.D }}>
      {/* Table metadata bar */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.B }}
        onMouseEnter={() => setBarHovered(true)}
        onMouseLeave={() => setBarHovered(false)}
      >
        <span style={{
          fontSize: 13, fontWeight: fw.semibold, color: c['content-primary'],
          textTransform: 'uppercase' as const, letterSpacing: '0.06em',
        }}>{t.name}</span>
        <TypeBadge label={isFact ? 'Fact' : 'Dimension'} kind={isFact ? 'fact' : 'dimension'} />
        {t.connection && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' as const }}>
            {t.connectionType === 'snowflake' && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M12 2v4M12 18v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M2 12h4M18 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="#29B5E8" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            )}
            {t.connectionType === 'spotstore' && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#7C3AED" strokeWidth="2"/>
                <path d="M3 9h18" stroke="#7C3AED" strokeWidth="2"/>
                <circle cx="7" cy="7" r="1" fill="#7C3AED"/>
                <circle cx="10" cy="7" r="1" fill="#7C3AED"/>
              </svg>
            )}
            {t.connectionType === 'csv' && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14 2 14 8 20 8" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            {t.connection}
          </span>
        )}
        <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>·</span>
        <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{indexedCols.length} columns</span>
        {t.rowCount && (
          <>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>·</span>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{t.rowCount}</span>
          </>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: sp.B }}>
          {t.confidence !== undefined && <ConfidenceBadge value={t.confidence} reasoning={t.reasoning} />}
          {!readOnly && <RemoveBtn onClick={onRemoveTable} visible={barHovered} title="Remove table" />}
        </div>
      </div>

      {/* Column table */}
      <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: COL_GRID, gap: sp.D,
          padding: `${sp.B}px ${sp.D}px`,
          backgroundColor: c['background-subtle'],
          borderBottom: `1px solid ${c['border-divider']}`,
        }}>
          {['Column', 'Type', 'Description'].map((h, i) => (
            <span key={i} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'] }}>{h}</span>
          ))}
        </div>
        {indexedCols.map(({ col, idx }, rowIdx) => (
          <div key={idx} style={{ animation: 'ds-row-in 0.2s ease-out' }}>
            <ColumnRow
              col={col}
              onUpdate={(field, val) => onUpdateCol(idx, field, val)}
              onRemove={() => onRemoveCol(idx)}
              isLast={rowIdx === indexedCols.length - 1 && !buildComplete}
              readOnly={readOnly}
            />
          </div>
        ))}

        {/* Add column — dropdown trigger */}
        {buildComplete && !readOnly && (
          <div ref={dropRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setDropOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none',
                borderTop: indexedCols.length > 0 ? `1px solid ${c['border-divider']}` : 'none',
                cursor: 'pointer',
                padding: `${sp.B + 1}px ${sp.D}px`,
                fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary,
                width: '100%', textAlign: 'left' as const,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = c['content-brand']; e.currentTarget.style.backgroundColor = c['background-subtle']; }}
              onMouseLeave={e => { e.currentTarget.style.color = c['content-secondary']; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
              </svg>
              Add column
            </button>

            {dropOpen && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 50,
                backgroundColor: c['background-base'],
                border: `1px solid ${c['border-divider']}`,
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                overflow: 'hidden',
              }}>
                {/* Search */}
                <div style={{ padding: `${sp.B}px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
                  <input
                    autoFocus
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search columns…"
                    style={{
                      width: '100%', boxSizing: 'border-box' as const,
                      border: 'none', outline: 'none', background: 'transparent',
                      fontSize: fs.xs, color: c['content-primary'], fontFamily: ff.primary,
                    }}
                  />
                </div>
                {/* Options */}
                <div style={{ maxHeight: 200, overflowY: 'auto' as const }}>
                  {options.length === 0 ? (
                    <div style={{ padding: `${sp.C}px ${sp.D}px`, fontSize: fs.xs, color: c['content-secondary'] }}>
                      No columns available
                    </div>
                  ) : options.map(opt => (
                    <button
                      key={opt.name}
                      onClick={() => { onAddCol(opt.name, opt.type); setDropOpen(false); setSearch(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: sp.C,
                        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                        padding: `${sp.B + 1}px ${sp.D}px`, fontFamily: ff.primary, textAlign: 'left' as const,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-primary'], flex: 1 }}>{opt.name}</span>
                      <TypeBadge label={opt.type === 'metric' ? 'Metric' : 'Dimension'} kind={opt.type === 'metric' ? 'metric' : 'dimension'} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── QuestionRow ────────────────────────────────────────────────────────────────

const QuestionRow: React.FC<{
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}> = ({ index, value, onChange, onRemove }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: 'flex', gap: sp.C, alignItems: 'flex-start', padding: `${sp.B}px 0`, borderBottom: `1px solid ${c['border-divider']}` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: fs.xs, color: c['content-secondary'], flexShrink: 0, paddingTop: 3, minWidth: 18, textAlign: 'right' as const }}>
        {index + 1}.
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <InlineField value={value} onChange={onChange} multiline placeholder="Type a question…" />
      </div>
      <RemoveBtn onClick={onRemove} visible={hovered} title="Remove" />
    </div>
  );
};

// ── Tab icons ──────────────────────────────────────────────────────────────────

const IconTables = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="10" height="10" rx="1.5" />
    <line x1="1" y1="4.5" x2="11" y2="4.5" />
    <line x1="4.5" y1="4.5" x2="4.5" y2="11" />
  </svg>
);

const IconRelationships = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="2.5" cy="6" r="1.5" />
    <circle cx="9.5" cy="6" r="1.5" />
    <line x1="4" y1="6" x2="7.2" y2="6" />
    <polyline points="6.2,4.5 8,6 6.2,7.5" />
  </svg>
);

const IconMetrics = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1,9 3.5,5.5 5.5,7.5 8,3 11,3" />
  </svg>
);

const IconQuestions = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 7.5C10 8.3 9.3 9 8.5 9H4L2 11V3.5C2 2.7 2.7 2 3.5 2H8.5C9.3 2 10 2.7 10 3.5V7.5Z" />
  </svg>
);

const TABS: { key: PlanTab; label: string; Icon: React.FC }[] = [
  { key: 'tables',        label: 'Tables & Columns',   Icon: IconTables },
  { key: 'relationships', label: 'Relationships',       Icon: IconRelationships },
  { key: 'metrics',       label: 'Formulas',             Icon: IconMetrics },
  { key: 'questions',     label: 'Sample questions',    Icon: IconQuestions },
];

// ── Icon button style ──────────────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  width: 28, height: 28, border: 'none', background: 'transparent',
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', borderRadius: 5,
  color: c['content-secondary'], padding: 0, flexShrink: 0,
};

// ── AddButton ──────────────────────────────────────────────────────────────────

const AddButton: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 6,
      margin: `${sp.B}px 0`,
      background: 'none',
      border: `1px dashed ${c['border-default']}`,
      borderRadius: 6, cursor: 'pointer',
      padding: `${sp.B}px ${sp.C}px`,
      fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary,
      width: '100%',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = c['content-brand']; e.currentTarget.style.color = c['content-brand']; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.color = c['content-secondary']; }}
  >
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <line x1="6" y1="1" x2="6" y2="11" /><line x1="1" y1="6" x2="11" y2="6" />
    </svg>
    {label}
  </button>
);

// ── Main component ─────────────────────────────────────────────────────────────

const SUB_STATUSES = [
  'Mapping tables',
  'Resolving columns',
  'Configuring joins',
  'Calculating metrics',
  'Finalising questions',
];

const PlanPanelV3: React.FC<PlanPanelProps> = ({ plan, onClose, buildingMode = false, onBuildComplete, onBuildModel, hideClose = false, readOnly = false, hideHeader = false }) => {
  const [activeTab, setActiveTab] = useState<PlanTab>('tables');
  const [tables, setTables] = useState<PlanTable[]>(plan.tables);
  const [rels, setRels] = useState<PlanRelationship[]>(plan.relationships);
  const [cols, setCols] = useState<PlanColumn[]>(plan.columns);
  const [questions, setQuestions] = useState<string[]>(plan.sampleQuestions);
  const tableCounter = useRef(0);

  // ── Build-mode reveal state ───────────────────────────────────────────────────
  const [revealedTables, setRevealedTables] = useState(buildingMode ? 0 : plan.tables.length + 99);
  const [revealedColCounts, setRevealedColCounts] = useState<number[]>(() =>
    buildingMode ? plan.tables.map(() => 0) : plan.tables.map(() => 999)
  );
  const [unlockedTabs, setUnlockedTabs] = useState<Set<PlanTab>>(
    () => buildingMode ? new Set<PlanTab>(['tables']) : new Set<PlanTab>(['tables', 'relationships', 'metrics', 'questions'])
  );
  const [buildComplete, setBuildComplete] = useState(!buildingMode);
  const [subStatusIdx, setSubStatusIdx] = useState(0);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!buildingMode) return;

    const timers = timerRefs.current;

    // Pre-compute non-formula column counts per table
    const tableNames = plan.tables.map(t => t.name);
    const colsPerTable = tableNames.map(name =>
      plan.columns.filter(col => col.table === name && col.type !== 'formula').length
    );

    let t = 0;

    tableNames.forEach((_, tableIdx) => {
      // Reveal table header
      const capturedIdx = tableIdx;
      timers.push(setTimeout(() => {
        setRevealedTables(capturedIdx + 1);
        setSubStatusIdx(capturedIdx === 0 ? 0 : 1);
      }, t));
      t += 500;

      // Stagger columns
      for (let ci = 0; ci < colsPerTable[capturedIdx]; ci++) {
        const capturedCi = ci;
        timers.push(setTimeout(() => {
          setRevealedColCounts(prev => {
            const next = [...prev];
            next[capturedIdx] = capturedCi + 1;
            return next;
          });
        }, t));
        t += 150;
      }

      t += 600; // gap between tables
    });

    timers.push(setTimeout(() => { setUnlockedTabs(prev => new Set([...prev, 'relationships'])); setSubStatusIdx(2); }, 5500));
    timers.push(setTimeout(() => { setUnlockedTabs(prev => new Set([...prev, 'metrics'])); setSubStatusIdx(3); }, 7000));
    timers.push(setTimeout(() => { setUnlockedTabs(prev => new Set([...prev, 'questions'])); setSubStatusIdx(4); }, 8500));
    timers.push(setTimeout(() => {
      setBuildComplete(true);
      onBuildComplete?.();
    }, 10000));

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Relationship ops ─────────────────────────────────────────────────────────
  const updateRel = (i: number, field: keyof PlanRelationship, val: string) =>
    setRels(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  // ── Column ops (by name — for Metrics tab) ───────────────────────────────────
  const updateCol = (name: string, field: keyof PlanColumn, val: string) =>
    setCols(prev => prev.map(col => col.name === name ? { ...col, [field]: val } : col));

  // ── Column ops (by index — for Tables tab) ───────────────────────────────────
  const updateColByIdx = (idx: number, field: keyof PlanColumn, val: string) =>
    setCols(prev => prev.map((col, i) => i === idx ? { ...col, [field]: val } : col));

  const removeColByIdx = (idx: number) =>
    setCols(prev => prev.filter((_, i) => i !== idx));

  const addCol = (tableName: string, colName: string, colType: 'metric' | 'dimension') =>
    setCols(prev => [...prev, { table: tableName, name: colName, type: colType, description: '', included: true }]);

  // ── Table ops ────────────────────────────────────────────────────────────────
  const removeTable = (name: string) => {
    setTables(prev => prev.filter(t => t.name !== name));
    setCols(prev => prev.filter(col => col.table !== name));
  };

  // ── Question ops ─────────────────────────────────────────────────────────────
  const updateQuestion = (i: number, val: string) =>
    setQuestions(prev => prev.map((q, idx) => idx === i ? val : q));

  const addQuestion    = () => setQuestions(prev => [...prev, '']);
  const removeQuestion = (i: number) => setQuestions(prev => prev.filter((_, idx) => idx !== i));

  const metricAndFormulaCols = cols.filter(col => col.type === 'formula');

  return (
    <>
      <style>{`
        @keyframes ds-slide-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes ds-row-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ds-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ds-tab-pulse { 0%,100% { color: inherit; } 40% { color: #2770EF; } }
      `}</style>

      <div style={{
        flex: 1, minHeight: 0,
        backgroundColor: c['background-base'],
        border: `1px solid ${c['border-divider']}`,
        borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', fontFamily: ff.primary,
        animation: 'ds-slide-in 0.2s ease-out',
      }}>

        {/* ── Hero (building state only) ─────────────────────────────────── */}
        {!hideHeader && buildingMode && !buildComplete && (
          <div style={{ padding: `${sp.D}px 20px`, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={c['content-brand']} strokeWidth="1.6" strokeLinecap="round" style={{ animation: 'ds-spin 0.9s linear infinite', flexShrink: 0 }}>
                    <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4" />
                  </svg>
                  <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>Building draft model…</span>
                </div>
                <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 3, marginLeft: 21 }}>
                  {SUB_STATUSES[subStatusIdx]}
                </div>
              </div>
              {!hideClose && (
                <button
                  onClick={onClose}
                  title="Close"
                  style={iconBtn}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tab bar ───────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: sp.F, padding: '0 20px',
          borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0,
        }}>
          {TABS.map(({ key, label, Icon }) => {
            const active = activeTab === key;
            const unlocked = unlockedTabs.has(key);
            return (
              <button
                key={key}
                onClick={() => unlocked ? setActiveTab(key) : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none',
                  borderBottom: active ? `2px solid ${c['content-brand']}` : '2px solid transparent',
                  padding: `${sp.B + 1}px 0`, marginBottom: -1,
                  cursor: unlocked ? 'pointer' : 'default', fontFamily: ff.primary,
                  color: active ? c['content-brand'] : c['content-secondary'],
                  fontSize: fs.sm,
                  fontWeight: active ? fw.semibold : fw.regular,
                  whiteSpace: 'nowrap' as const,
                  opacity: unlocked ? 1 : 0.35,
                  transition: 'opacity 0.3s',
                }}
              >
                <Icon />
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Scrollable content ────────────────────────────────────────────── */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: `0 20px ${sp.H}px` }}>

          {/* Tab 1 — Tables & Columns */}
          {activeTab === 'tables' && (
            <>
              <div style={{ paddingTop: sp.D }}>
                {tables.map((t, tableIdx) => {
                  if (tableIdx >= revealedTables) return null;
                  const isFact = tableIdx === 0;
                  const visibleCount = revealedColCounts[tableIdx] ?? 0;
                  const allIndexedCols = cols
                    .map((col, idx) => ({ col, idx }))
                    .filter(({ col }) => col.table === t.name && col.type !== 'formula');
                  const indexedCols = buildComplete ? allIndexedCols : allIndexedCols.slice(0, visibleCount);
                  return (
                    <div
                      key={t.name}
                      style={{ animation: 'ds-row-in 0.2s ease-out' }}
                    >
                      <TableSection
                        t={t}
                        isFact={isFact}
                        indexedCols={indexedCols}
                        onRemoveTable={() => removeTable(t.name)}
                        onUpdateCol={(idx, field, val) => updateColByIdx(idx, field, val)}
                        onRemoveCol={idx => removeColByIdx(idx)}
                        onAddCol={(name, type) => addCol(t.name, name, type)}
                        buildComplete={buildComplete}
                        readOnly={readOnly}
                      />
                    </div>
                  );
                })}
              </div>

            </>
          )}

          {/* Tab 2 — Relationships */}
          {activeTab === 'relationships' && (
            <>
              <SectionHeader
                title="Join configuration"
                subtitle="Directional joins structured to prevent fan traps"
              />
              <DataTable
                headers={['Source', 'Target', 'Join condition', 'Join type', 'Cardinality', 'Confidence']}
                cols="0.8fr 0.8fr 2fr 100px 110px 82px"
                rows={rels.map((rel, i) => [
                  <span style={{ fontSize: fs.sm, fontFamily: ff.mono, color: c['content-primary'] }}>{rel.fromTable}</span>,
                  <span style={{ fontSize: fs.sm, fontFamily: ff.mono, color: c['content-primary'] }}>{rel.toTable}</span>,
                  <span style={{ fontSize: fs.xs, fontFamily: ff.mono, color: c['content-secondary'] }}>
                    {rel.fromTable}.{rel.fromKey} = {rel.toTable}.{rel.toKey}
                  </span>,
                  <InlineField
                    value={rel.joinType}
                    onChange={val => updateRel(i, 'joinType', val)}
                    placeholder="e.g. LEFT JOIN"
                    style={{ fontSize: fs.xs, color: c['content-primary'] }}
                  />,
                  <InlineField
                    value={rel.cardinality ?? ''}
                    onChange={val => updateRel(i, 'cardinality', val)}
                    placeholder="e.g. Many-to-one"
                    style={{ fontSize: fs.xs, color: c['content-primary'] }}
                  />,
                  rel.confidence !== undefined ? <ConfidenceBadge value={rel.confidence} reasoning={rel.reasoning} /> : <span />,
                ])}
              />
              <Callout
                title="Fan trap prevention"
                body="All joins are directional (one-to-many). Avoid circular join paths — they cause double-counting in aggregations."
              />
            </>
          )}

          {/* Tab 3 — Metrics & Formulas */}
          {activeTab === 'metrics' && (
            <>
              <SectionHeader
                title="Formulas"
                subtitle="Calculated columns defined in ThoughtSpot"
              />
              {metricAndFormulaCols.length === 0 ? (
                <div style={{ fontSize: fs.sm, color: c['content-secondary'], padding: `${sp.H}px 0`, textAlign: 'center' as const }}>
                  No formulas defined yet.
                </div>
              ) : (
                <DataTable
                  headers={['Name', 'Expression', 'Description', 'Confidence']}
                  cols="1fr 1.5fr 1fr 82px"
                  rows={metricAndFormulaCols.map(col => [
                    <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{col.name}</span>,
                    <InlineField
                      value={col.formula ?? ''}
                      onChange={val => updateCol(col.name, 'formula', val)}
                      mono
                      placeholder="e.g. SUM(amount)"
                      style={{ fontSize: fs.xs, color: c['content-primary'] }}
                    />,
                    <InlineField
                      value={col.description}
                      onChange={val => updateCol(col.name, 'description', val)}
                      multiline
                      placeholder="Add description…"
                      style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }}
                    />,
                    col.confidence !== undefined ? <ConfidenceBadge value={col.confidence} reasoning={col.reasoning} /> : <span />,
                  ])}
                />
              )}
            </>
          )}

          {/* Tab 4 — Sample questions */}
          {activeTab === 'questions' && (
            <>
              <SectionHeader
                title="Spotter-ready questions"
                subtitle="Questions this model should answer out of the box"
              />
              <div style={{ borderTop: `1px solid ${c['border-divider']}` }}>
                {questions.map((q, i) => (
                  readOnly
                    ? (
                      <div key={i} style={{ display: 'flex', gap: sp.C, alignItems: 'flex-start', padding: `${sp.B}px 0`, borderBottom: `1px solid ${c['border-divider']}` }}>
                        <span style={{ fontSize: fs.xs, color: c['content-secondary'], flexShrink: 0, paddingTop: 3, minWidth: 18, textAlign: 'right' as const }}>{i + 1}.</span>
                        <span style={{ fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>{q}</span>
                      </div>
                    ) : (
                      <QuestionRow
                        key={i}
                        index={i}
                        value={q}
                        onChange={val => updateQuestion(i, val)}
                        onRemove={() => removeQuestion(i)}
                      />
                    )
                ))}
              </div>
              {!readOnly && <AddButton label="Add question" onClick={addQuestion} />}
            </>
          )}


        </div>

        {/* ── Sticky footer CTA ────────────────────────────────────────────── */}
        {onBuildModel && (
          <div style={{
            flexShrink: 0,
            padding: `${sp.C}px 20px`,
            borderTop: `1px solid ${c['border-divider']}`,
            backgroundColor: c['background-base'],
            display: 'flex', justifyContent: 'flex-end', gap: sp.B,
          }}>
            <button
              style={{
                height: 34, padding: `0 ${sp.D}px`,
                border: `1px solid ${c['border-default']}`, borderRadius: 7,
                backgroundColor: 'transparent', color: c['content-primary'],
                fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary,
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = c['background-subtle']; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              Modify plan
            </button>
            <button
              onClick={onBuildModel}
              style={{
                height: 34, padding: `0 ${sp.D}px`,
                border: 'none', borderRadius: 7,
                backgroundColor: c['content-brand'], color: 'white',
                fontSize: fs.sm, fontWeight: fw.semibold, fontFamily: ff.primary,
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              Build model
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default PlanPanelV3;
