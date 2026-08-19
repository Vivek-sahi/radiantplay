import React, { useState, useMemo } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import { c, sp, ff, fs, fw } from '../styles';
import type { PrepSuggestion } from './AgentPanel';

interface DataQualityPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: PrepSuggestion[];
  onToggle: (id: string) => void;
  onFixChange: (id: string, value: string) => void;
  onApply: () => void;
}

const SEVERITY_COLOR: Record<PrepSuggestion['severity'], { bg: string; text: string; label: string }> = {
  high:   { bg: '#FEF2F2', text: '#DC2626', label: 'High' },
  medium: { bg: '#FFFBEB', text: '#D97706', label: 'Medium' },
  low:    { bg: '#F0FDF4', text: '#16A34A', label: 'Low' },
};

const SEVERITY_OPTIONS = [
  { id: 'all', label: 'All severities' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const TABLE_OPTIONS = [
  { id: 'all', label: 'All tables' },
  { id: 'orders', label: 'orders' },
  { id: 'campaigns', label: 'campaigns' },
  { id: 'users', label: 'users' },
];

const DataQualityPlanModal: React.FC<DataQualityPlanModalProps> = ({
  isOpen,
  onClose,
  suggestions,
  onToggle,
  onFixChange,
  onApply,
}) => {
  const [search, setSearch]           = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');
  const [editingId, setEditingId]     = useState<string | null>(null);

  const checkedCount = suggestions.filter(s => s.checked).length;
  const highCount    = suggestions.filter(s => s.severity === 'high').length;
  const mediumCount  = suggestions.filter(s => s.severity === 'medium').length;
  const lowCount     = suggestions.filter(s => s.severity === 'low').length;

  const filtered = useMemo(() => {
    return suggestions.filter(s => {
      if (severityFilter !== 'all' && s.severity !== severityFilter) return false;
      if (tableFilter !== 'all' && s.tableId !== tableFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.columnId.includes(q) && !s.tableId.includes(q) && !s.issue.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [suggestions, severityFilter, tableFilter, search]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="M3"
      title="Data quality fix plan"
      footer={
        <div style={{ display: 'flex', gap: sp.B, justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>Dismiss</Button>
          <Button
            variant="primary"
            onClick={onApply}
            disabled={checkedCount === 0}
          >
            {checkedCount < suggestions.length ? `Apply (${checkedCount})` : 'Apply'}
          </Button>
        </div>
      }
    >
      {/* Escape content padding and build own layout */}
      <div style={{ margin: '-24px', display: 'flex', flexDirection: 'column' }}>

        {/* Intro block */}
        <div style={{
          padding: `${sp.D}px ${sp.F}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          backgroundColor: c['background-base'],
        }}>
          <p style={{ margin: `0 0 ${sp.C}px`, fontSize: fs.sm, color: c['content-secondary'], lineHeight: '20px' }}>
            I scanned all 3 tables for issues that could affect how Spotter answers questions — null values that distort
            aggregations, duplicate rows that inflate counts, anomalous values, and date format mismatches that break
            joins. Each fix is a <strong>query-time SQL transform</strong> embedded in your model. It runs on every
            query and doesn't modify your warehouse data. Uncheck any you want to skip.
          </p>
          <div style={{ display: 'flex', gap: sp.C }}>
            <StatPill label="High" count={highCount} color="#DC2626" bg="#FEF2F2" />
            <StatPill label="Medium" count={mediumCount} color="#D97706" bg="#FFFBEB" />
            <StatPill label="Low" count={lowCount} color="#16A34A" bg="#F0FDF4" />
            <StatPill label="total" count={suggestions.length} color={c['content-secondary']} bg={c['background-sunken']} />
          </div>
        </div>

        {/* Filter bar */}
        <div style={{
          display: 'flex',
          gap: sp.C,
          padding: `${sp.C}px ${sp.F}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          alignItems: 'center',
          backgroundColor: c['background-base'],
          flexWrap: 'wrap' as const,
        }}>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by column..."
            style={{
              flex: '1 1 160px',
              maxWidth: 220,
              padding: '5px 10px',
              border: `1px solid ${c['border-default']}`,
              borderRadius: 6,
              fontSize: fs.sm,
              fontFamily: ff.primary,
              color: c['content-primary'],
              backgroundColor: c['background-base'],
              outline: 'none',
              height: 32,
              boxSizing: 'border-box' as const,
            }}
          />

          {/* Severity dropdown */}
          <div style={{ width: 160 }}>
            <Select
              options={SEVERITY_OPTIONS}
              value={severityFilter}
              onChange={v => setSeverityFilter(v)}
              size="basic"
            />
          </div>

          {/* Table dropdown */}
          <div style={{ width: 160 }}>
            <Select
              options={TABLE_OPTIONS}
              value={tableFilter}
              onChange={v => setTableFilter(v)}
              size="basic"
            />
          </div>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '36px 160px 1fr 220px 1fr 80px',
          padding: `${sp.B}px ${sp.F}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          backgroundColor: c['background-sunken'],
          flexShrink: 0,
        }}>
          <div />
          <HeaderCell>Column</HeaderCell>
          <HeaderCell>Issue</HeaderCell>
          <HeaderCell>Suggested fix</HeaderCell>
          <HeaderCell>Why this fix</HeaderCell>
          <HeaderCell>Severity</HeaderCell>
        </div>

        {/* Scrollable rows */}
        <div style={{ overflowY: 'auto' as const, maxHeight: 340 }}>
          {filtered.length === 0 ? (
            <div style={{
              padding: `${sp.H}px ${sp.F}px`,
              textAlign: 'center' as const,
              color: c['content-secondary'],
              fontSize: fs.sm,
            }}>
              No issues match your filters.
            </div>
          ) : (
            filtered.map((s, idx) => (
              <div
                key={s.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 160px 1fr 220px 1fr 80px',
                  padding: `${sp.C}px ${sp.F}px`,
                  borderBottom: `1px solid ${c['border-divider']}`,
                  backgroundColor: idx % 2 === 0 ? c['background-base'] : c['background-sunken'],
                  alignItems: 'start',
                  opacity: s.checked ? 1 : 0.45,
                  transition: 'opacity 0.15s',
                }}
              >
                {/* Checkbox */}
                <div style={{ paddingTop: sp.A }}>
                  <input
                    type="checkbox"
                    checked={s.checked}
                    onChange={() => onToggle(s.id)}
                    style={{ cursor: 'pointer', accentColor: c['content-brand'], width: 14, height: 14 }}
                  />
                </div>

                {/* Column */}
                <div style={{ paddingRight: sp.C }}>
                  <span style={{
                    fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium,
                    lineHeight: '20px', display: 'block',
                  }}>
                    {s.columnId}
                  </span>
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }}>
                    {s.tableId}
                  </span>
                </div>

                {/* Issue */}
                <div style={{ paddingRight: sp.C }}>
                  <span style={{ fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>
                    {s.issue}
                  </span>
                </div>

                {/* Fix — text with pencil-to-edit */}
                <div style={{ paddingRight: sp.C }}>
                  {editingId === s.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={s.fix}
                      onChange={e => onFixChange(s.id, e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingId(null); }}
                      style={{
                        width: '100%',
                        padding: '3px 8px',
                        border: `1px solid ${c['content-brand']}`,
                        borderRadius: 4,
                        fontSize: fs.sm,
                        fontFamily: ff.primary,
                        color: c['content-primary'],
                        backgroundColor: c['background-base'],
                        outline: 'none',
                        boxSizing: 'border-box' as const,
                      }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.A }}>
                      <span style={{ fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px', flex: 1 }}>
                        {s.fix}
                      </span>
                      {s.checked && (
                        <button
                          onClick={() => setEditingId(s.id)}
                          title="Edit suggestion"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: sp.A,
                            flexShrink: 0,
                            color: c['content-secondary'],
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: sp.A,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = c['content-brand'])}
                          onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
                        >
                          <PencilIcon />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div style={{ paddingRight: sp.C }}>
                  <span style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: '18px' }}>
                    {s.reason}
                  </span>
                </div>

                {/* Severity badge */}
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: fw.medium,
                    lineHeight: '18px',
                    backgroundColor: SEVERITY_COLOR[s.severity].bg,
                    color: SEVERITY_COLOR[s.severity].text,
                  }}>
                    {SEVERITY_COLOR[s.severity].label}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

const HeaderCell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: 12,
    fontWeight: fw.semibold,
    color: c['content-secondary'],
    lineHeight: '18px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  }}>
    {children}
  </div>
);

const StatPill: React.FC<{ label: string; count: number; color: string; bg: string }> = ({ label, count, color, bg }) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: sp.A,
    padding: '2px 10px',
    borderRadius: 10,
    backgroundColor: bg,
    border: `1px solid ${color}30`,
  }}>
    <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color, lineHeight: '18px' }}>{count}</span>
    <span style={{ fontSize: fs.xs, color, lineHeight: '18px' }}>{label}</span>
  </div>
);

const PencilIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M9.5 2.5L11.5 4.5L5 11H3V9L9.5 2.5Z"
      stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

export default DataQualityPlanModal;
