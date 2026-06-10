import React, { useState, useEffect, useRef } from 'react';
import { c, ff, fs, fw, sp } from '../styles';
import { NotebookCell as NotebookCellDef } from './ChatContextPanel';

// ── Types ─────────────────────────────────────────────────────────────────────

type NbCellType   = 'sql' | 'python' | 'text';
type NbCellStatus = 'idle' | 'running' | 'success' | 'error';

interface NbCell {
  id: string;
  type: NbCellType;
  label: string;
  query: string;
  agentOutput?: string;   // text output from the agent (e.g. "12,431 rows")
  initialStatus?: NbCellStatus;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const NB_CELL_ACCENT: Record<NbCellType, string> = {
  sql:    c['content-brand'],
  python: '#D97706',
  text:   c['border-divider'],
};

const NB_SQL_KW = new Set(['SELECT','FROM','JOIN','LEFT','INNER','RIGHT','OUTER','ON','WHERE','AS','DISTINCT','OVER','PARTITION','BY','ORDER','GROUP','HAVING','WITH','SUM','COUNT','AVG','MAX','MIN','NULLIF','AND','OR','NOT','NULL','CASE','WHEN','THEN','ELSE','END','COALESCE','CREATE','OR','REPLACE','TABLE','INSERT','UPDATE','DELETE','DROP','ALTER','LIMIT','OFFSET','UNION','ALL']);
const NB_SQL_KW_RE = /\b(SELECT|FROM|JOIN|LEFT|INNER|RIGHT|OUTER|ON|WHERE|AS|DISTINCT|OVER|PARTITION|BY|ORDER|GROUP|HAVING|WITH|SUM|COUNT|AVG|MAX|MIN|NULLIF|AND|OR|NOT|NULL|CASE|WHEN|THEN|ELSE|END|COALESCE|CREATE|REPLACE|TABLE|INSERT|UPDATE|DELETE|DROP|ALTER|LIMIT|OFFSET|UNION|ALL)\b/g;

const NbSqlTokens: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(new RegExp(NB_SQL_KW_RE.source, 'g'));
  return (
    <span>
      {parts.map((part, i) =>
        NB_SQL_KW.has(part)
          ? <span key={i} style={{ color: '#7C3AED', fontWeight: fw.semibold }}>{part}</span>
          : <span key={i} style={{ color: c['content-primary'] }}>{part}</span>
      )}
    </span>
  );
};

const NbSqlLine: React.FC<{ line: string }> = ({ line }) => {
  const commentIdx = line.indexOf('--');
  if (commentIdx === 0) return <span style={{ color: c['content-secondary'] }}>{line}</span>;
  if (commentIdx > 0) return (
    <span>
      <NbSqlTokens text={line.slice(0, commentIdx)} />
      <span style={{ color: c['content-secondary'] }}>{line.slice(commentIdx)}</span>
    </span>
  );
  return <NbSqlTokens text={line} />;
};

const NbPyLine: React.FC<{ line: string }> = ({ line }) => {
  if (line.startsWith('#')) return <span style={{ color: c['content-secondary'] }}>{line}</span>;
  if (line.startsWith('import') || line.startsWith('from')) return <span style={{ color: '#7C3AED' }}>{line}</span>;
  return <span style={{ color: c['content-primary'] }}>{line}</span>;
};

// ── Status dot ────────────────────────────────────────────────────────────────

const StatusDot: React.FC<{ status: NbCellStatus }> = ({ status }) => {
  if (status === 'idle') return null;
  if (status === 'running') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, flexShrink: 0 }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: 'nb-spin 0.8s linear infinite' }}>
        <style>{`@keyframes nb-spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="6" cy="6" r="4.5" stroke={c['content-brand']} strokeWidth="1.5" strokeDasharray="14 8" strokeLinecap="round" />
      </svg>
    </span>
  );
  if (status === 'success') return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="5" fill={c['background-accent-green']} stroke={c['border-accent-green']} strokeWidth="1" />
      <path d="M3.5 6l1.8 1.8 3.2-3.2" stroke={c['content-accent-green']} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="5" fill={c['background-accent-red']} stroke={c['border-accent-red']} strokeWidth="1" />
      <path d="M4 4l4 4M8 4l-4 4" stroke={c['content-accent-red']} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

// ── Output panel ──────────────────────────────────────────────────────────────

const CellOutput: React.FC<{ status: NbCellStatus; output?: string; onEditRetry: () => void }> = ({ status, output, onEditRetry }) => {
  if (status === 'error') return (
    <div style={{ background: c['background-accent-red'], borderTop: `1px solid ${c['border-accent-red']}`, padding: `${sp.C}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.B }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.B }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="8" cy="8" r="7" stroke={c['content-accent-red']} strokeWidth="1.5" />
          <path d="M8 5v3.5M8 10.5v.5" stroke={c['content-accent-red']} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: fs.xs, color: c['content-accent-red'], lineHeight: '18px' }}>
          Error running cell.
        </span>
      </div>
      <button onClick={onEditRetry} style={{ alignSelf: 'flex-start', padding: '3px 10px', background: c['background-base'], border: `1px solid ${c['border-accent-red']}`, borderRadius: 5, cursor: 'pointer', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-accent-red'], fontFamily: ff.primary }}>
        Edit and retry
      </button>
    </div>
  );

  if (status !== 'success' || !output) return null;

  return (
    <div style={{ borderTop: `1px solid ${c['border-divider']}`, backgroundColor: c['background-sunken'], padding: `${sp.B}px ${sp.D}px` }}>
      <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' }}>
        ↳ {output}
      </span>
    </div>
  );
};

// ── Notebook cell ─────────────────────────────────────────────────────────────

const NbCellComponent: React.FC<{
  cell: NbCell;
  status: NbCellStatus;
  isEditing: boolean;
  draftValue: string;
  onEdit: () => void;
  onRun: () => void;
  onRunCell: () => void;
  onCancel: () => void;
  onDraftChange: (v: string) => void;
}> = ({ cell, status, isEditing, draftValue, onEdit, onRun, onRunCell, onCancel, onDraftChange }) => {
  const [hovered, setHovered] = useState(false);
  const displayValue = isEditing ? draftValue : cell.query;
  const lineCount    = displayValue.split('\n').length;

  const leftBorder = status === 'success' ? c['border-accent-green']
                   : status === 'error'   ? c['border-accent-red']
                   : status === 'running' ? c['content-brand']
                   : NB_CELL_ACCENT[cell.type];

  return (
    <div style={{ border: `1px solid ${c['border-divider']}`, borderLeft: `3px solid ${leftBorder}`, borderRadius: 8, backgroundColor: c['background-base'], overflow: 'hidden', flexShrink: 0, transition: 'border-left-color 0.2s' }}>
      {/* Header */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `6px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: hovered && !isEditing ? c['background-subtle'] : c['background-base'], transition: 'background-color 0.1s' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
          <StatusDot status={status} />
          <span style={{ fontSize: 10, fontWeight: fw.semibold, color: cell.type === 'sql' ? c['content-brand'] : cell.type === 'python' ? '#D97706' : c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.06em' }}>{cell.type}</span>
          <span style={{ fontSize: fs.xs, color: c['content-primary'], fontWeight: fw.medium }}>{cell.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: isEditing || hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          {isEditing ? (
            <>
              <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-secondary'], padding: '2px 6px', fontFamily: ff.primary }}>Cancel</button>
              <button onClick={onRun} style={{ display: 'flex', alignItems: 'center', gap: 5, background: c['background-accent-green'], color: c['content-accent-green'], border: `1px solid ${c['border-accent-green']}`, borderRadius: 5, cursor: 'pointer', fontSize: fs.xs, fontWeight: fw.semibold, padding: '3px 10px', fontFamily: ff.primary }}>
                <svg width="7" height="8" viewBox="0 0 7 8" fill="currentColor"><polygon points="0,0 7,4 0,8" /></svg>
                Run
              </button>
            </>
          ) : (
            <>
              <button onClick={onRunCell} title="Run cell" style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: c['content-secondary'], padding: 0 }} onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])} onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}>
                <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor"><polygon points="0,0 9,5 0,10" /></svg>
              </button>
              <button onClick={onEdit} title="Edit cell" style={{ width: 24, height: 24, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: c['content-secondary'], padding: 0 }} onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])} onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 2.5a1.5 1.5 0 0 1 2.1 2.1L5 13.1l-3 .9.9-3 8.6-8.5z" /></svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Code body */}
      {isEditing ? (
        <textarea autoFocus value={draftValue} onChange={e => onDraftChange(e.target.value)} style={{ width: '100%', minHeight: Math.max(lineCount * 20 + 24, 80), padding: sp.C, fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: fs.xs, color: c['content-primary'], backgroundColor: c['background-sunken'], border: 'none', outline: 'none', resize: 'vertical', lineHeight: '20px', boxSizing: 'border-box' }} />
      ) : (
        <div style={{ padding: sp.C, fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize: fs.xs, lineHeight: '20px', backgroundColor: c['background-sunken'], opacity: status === 'running' ? 0.5 : 1, transition: 'opacity 0.2s' }}>
          {displayValue.split('\n').map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: sp.C }}>
              <span style={{ color: c['content-secondary'], userSelect: 'none', minWidth: 18, textAlign: 'right', flexShrink: 0, opacity: 0.5 }}>{i + 1}</span>
              {cell.type === 'sql' ? <NbSqlLine line={line} /> : <NbPyLine line={line} />}
            </div>
          ))}
        </div>
      )}

      {/* Output */}
      {(status === 'success' || status === 'error') && !isEditing && (
        <CellOutput status={status} output={cell.agentOutput} onEditRetry={onEdit} />
      )}
    </div>
  );
};

// ── Map from NotebookCellDef (chat flow) to NbCell ────────────────────────────

function toNbCell(def: NotebookCellDef): NbCell {
  return {
    id: def.id,
    type: def.type === 'file-upload' || def.type === 'markdown' ? 'text' : def.type,
    label: def.label,
    query: def.type === 'file-upload' ? `-- Uploaded file: ${def.code}\n-- Schema detected automatically` : def.code,
    agentOutput: def.output,
    initialStatus: def.status === 'pending' ? 'idle'
                 : def.status === 'running' ? 'running'
                 : def.status === 'done'    ? 'success'
                 : 'error',
  };
}

// ── Mock run results ──────────────────────────────────────────────────────────

interface MockResultRow { [col: string]: string }
interface MockResult { columns: string[]; rows: MockResultRow[]; footer: string }

const NB_MOCK_RESULTS: Record<string, MockResult> = {
  'sql-1': {
    columns: ['account_id', 'account_name', 'account_tier', 'account_status', 'arr'],
    rows: [
      { account_id: 'ACC-001', account_name: 'Acme Corp',  account_tier: 'Enterprise', account_status: 'Active',  arr: '125,000' },
      { account_id: 'ACC-002', account_name: 'Beta Inc',   account_tier: 'Growth',     account_status: 'Active',  arr: '48,000'  },
      { account_id: 'ACC-003', account_name: 'Gamma Ltd',  account_tier: 'Starter',    account_status: 'Churned', arr: '8,500'   },
    ],
    footer: '3 rows returned',
  },
  'sql-2': {
    columns: ['case_id', 'account_id', 'status', 'priority'],
    rows: [
      { case_id: 'CS-001', account_id: 'ACC-001', status: 'Open',   priority: 'P1' },
      { case_id: 'CS-002', account_id: 'ACC-002', status: 'Closed', priority: 'P2' },
      { case_id: 'CS-003', account_id: 'ACC-001', status: 'Open',   priority: 'P1' },
    ],
    footer: '3 rows returned',
  },
  'sql-3': {
    columns: ['call_id', 'account_id', 'duration_min', 'outcome'],
    rows: [
      { call_id: 'CALL-001', account_id: 'ACC-001', duration_min: '42', outcome: 'Escalated' },
      { call_id: 'CALL-002', account_id: 'ACC-003', duration_min: '18', outcome: 'Resolved'  },
      { call_id: 'CALL-003', account_id: 'ACC-002', duration_min: '27', outcome: 'Resolved'  },
    ],
    footer: '3 rows returned',
  },
  'sql-4': {
    columns: ['defect_id', 'account_id', 'severity', 'status'],
    rows: [
      { defect_id: 'DEF-001', account_id: 'ACC-001', severity: 'High',     status: 'Open'   },
      { defect_id: 'DEF-002', account_id: 'ACC-003', severity: 'Medium',   status: 'Closed' },
      { defect_id: 'DEF-003', account_id: 'ACC-001', severity: 'Critical', status: 'Open'   },
    ],
    footer: '3 rows returned',
  },
};

const CellRunResults: React.FC<{ cellId: string }> = ({ cellId }) => {
  const result = NB_MOCK_RESULTS[cellId];
  const monoFont = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  if (!result) {
    return (
      <div style={{ borderTop: `1px solid ${c['border-divider']}`, backgroundColor: c['background-sunken'], padding: '5px 12px' }}>
        <span style={{ fontSize: 11, fontFamily: monoFont, color: c['content-secondary'] }}>3 rows returned</span>
      </div>
    );
  }

  const colCount = result.columns.length;
  const cellPad = '3px 8px';

  return (
    <div style={{ borderTop: `1px solid ${c['border-divider']}`, backgroundColor: c['background-sunken'], maxHeight: 120, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: monoFont, tableLayout: 'fixed' }}>
        <colgroup>
          {result.columns.map((_, i) => <col key={i} style={{ width: `${100 / colCount}%` }} />)}
        </colgroup>
        <thead>
          <tr style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
            {result.columns.map(col => (
              <th key={col} style={{ padding: cellPad, textAlign: 'left', fontWeight: 600, color: c['content-secondary'], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < result.rows.length - 1 ? `1px solid ${c['border-divider']}` : 'none' }}>
              {result.columns.map(col => (
                <td key={col} style={{ padding: cellPad, color: c['content-primary'], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ padding: '3px 8px 5px', borderTop: `1px solid ${c['border-divider']}` }}>
        <span style={{ fontSize: 11, fontFamily: monoFont, color: c['content-secondary'] }}>{result.footer}</span>
      </div>
    </div>
  );
};

// ── Public component ──────────────────────────────────────────────────────────

interface NotebookViewProps {
  cells: NotebookCellDef[];
  notebookName?: string;
  onClose: () => void;
  highlightCellId?: string | null;
}

const NotebookView: React.FC<NotebookViewProps> = ({ cells, notebookName = 'customer_health_analysis', onClose, highlightCellId }) => {
  const nbCells = cells.map(toNbCell);

  const [cellStatuses, setCellStatuses] = useState<Record<string, NbCellStatus>>(() =>
    Object.fromEntries(nbCells.map(c => [c.id, c.initialStatus ?? 'idle']))
  );
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [draftValue, setDraftValue]   = useState('');
  const [cellValues, setCellValues]   = useState<Record<string, string>>({});
  const [extraCells, setExtraCells]   = useState<NbCell[]>([]);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [runAllActive, setRunAllActive] = useState(false);
  const [activePulse, setActivePulse] = useState<string | null>(null);
  const [ranCells, setRanCells] = useState<Set<string>>(new Set());
  const cellRefMap = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!highlightCellId) return;
    const el = cellRefMap.current.get(highlightCellId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setActivePulse(highlightCellId);
      const t = setTimeout(() => setActivePulse(null), 1600);
      return () => clearTimeout(t);
    }
  }, [highlightCellId]);

  // Sync statuses when new cells arrive from agent
  const latestStatuses = Object.fromEntries(nbCells.map(c => [c.id, c.initialStatus ?? 'idle']));
  const mergedStatuses = { ...latestStatuses, ...cellStatuses };

  const getValue = (cell: NbCell) => cellValues[cell.id] ?? cell.query;

  const runCell = (cellId: string) => {
    setCellStatuses(prev => ({ ...prev, [cellId]: 'running' }));
    setTimeout(() => {
      setCellStatuses(prev => ({ ...prev, [cellId]: 'success' }));
      setRanCells(prev => new Set([...prev, cellId]));
    }, 1400);
  };

  const handleEditRun = (cellId: string) => {
    setCellValues(prev => ({ ...prev, [cellId]: draftValue }));
    setEditingCell(null);
    runCell(cellId);
  };

  const handleRunAll = () => {
    if (runAllActive) return;
    setRunAllActive(true);
    const all = [...nbCells, ...extraCells];
    let delay = 0;
    all.forEach((cell, i) => {
      setTimeout(() => {
        setCellStatuses(prev => ({ ...prev, [cell.id]: 'running' }));
        setTimeout(() => {
          setCellStatuses(prev => ({ ...prev, [cell.id]: 'success' }));
          setRanCells(prev => new Set([...prev, cell.id]));
          if (i === all.length - 1) setRunAllActive(false);
        }, 1200);
      }, delay);
      delay += 400;
    });
  };

  const addCell = (type: NbCellType) => {
    const defaults: Record<NbCellType, string> = { sql: '-- Write SQL here\n', python: '# Write Python here\n', text: 'Add notes here' };
    const labels:   Record<NbCellType, string> = { sql: 'New SQL cell', python: 'New Python cell', text: 'New text cell' };
    const newId = `user-${extraCells.length}`;
    setExtraCells(prev => [...prev, { id: newId, type, label: labels[type], query: defaults[type] }]);
    setCellStatuses(prev => ({ ...prev, [newId]: 'idle' }));
    setShowAddMenu(false);
  };

  const allCells = [...nbCells, ...extraCells];
  const successCount = allCells.filter(cell => mergedStatuses[cell.id] === 'success').length;
  const errorCount   = allCells.filter(cell => mergedStatuses[cell.id] === 'error').length;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8, margin: '8px 8px 8px 0' }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: c['content-secondary'] }}>
          <rect x="3" y="1" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
          <line x1="1.5" y1="4" x2="3" y2="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="1.5" y1="7" x2="3" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="1.5" y1="10" x2="3" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1="5.5" y1="4" x2="9.5" y2="4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="5.5" y1="7" x2="8.5" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="5.5" y1="10.5" x2="9" y2="10.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
        <span style={{ flex: 1, fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>{notebookName}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: c['content-secondary'], borderRadius: 4 }} onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])} onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.B}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
          {errorCount > 0 && (
            <span style={{ fontSize: fs.xs, color: c['content-accent-red'], display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke={c['content-accent-red']} strokeWidth="1.5"/><path d="M8 5v3.5M8 10.5v.5" stroke={c['content-accent-red']} strokeWidth="1.5" strokeLinecap="round"/></svg>
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
          {successCount > 0 && errorCount === 0 && (
            <span style={{ fontSize: fs.xs, color: c['content-accent-green'] }}>{successCount} / {allCells.length} cells ran successfully</span>
          )}
          {allCells.length === 0 && (
            <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{cells.length > 0 ? 'Agent is working…' : 'No cells yet'}</span>
          )}
        </div>
        <button
          onClick={handleRunAll}
          disabled={runAllActive || allCells.length === 0}
          style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: '4px 12px', background: c['background-base'], border: `1px solid ${c['border-default']}`, borderRadius: 6, cursor: runAllActive || allCells.length === 0 ? 'default' : 'pointer', fontSize: fs.xs, fontWeight: fw.medium, color: runAllActive || allCells.length === 0 ? c['content-secondary'] : c['content-primary'], fontFamily: ff.primary }}
          onMouseEnter={e => { if (!runAllActive) e.currentTarget.style.background = c['background-subtle']; }}
          onMouseLeave={e => { if (!runAllActive) e.currentTarget.style.background = c['background-base']; }}
        >
          <svg width="9" height="10" viewBox="0 0 9 10" fill="currentColor"><polygon points="0,0 9,5 0,10" /></svg>
          Run all
        </button>
      </div>

      {/* Cells */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.D, display: 'flex', flexDirection: 'column', gap: sp.C }}>
        {allCells.map(cell => (
          <div
            key={cell.id}
            ref={el => { if (el) cellRefMap.current.set(cell.id, el); else cellRefMap.current.delete(cell.id); }}
            style={{
              borderRadius: 9,
              outline: activePulse === cell.id ? `2px solid ${c['content-brand']}` : '2px solid transparent',
              transition: 'outline 0.3s ease',
            }}
          >
            <NbCellComponent
              cell={{ ...cell, agentOutput: nbCells.find(c => c.id === cell.id)?.agentOutput ?? cell.agentOutput }}
              status={mergedStatuses[cell.id] ?? 'idle'}
              isEditing={editingCell === cell.id}
              draftValue={editingCell === cell.id ? draftValue : ''}
              onEdit={() => { setEditingCell(cell.id); setDraftValue(getValue(cell)); }}
              onRun={() => handleEditRun(cell.id)}
              onRunCell={() => runCell(cell.id)}
              onCancel={() => setEditingCell(null)}
              onDraftChange={setDraftValue}
            />
            {cell.type === 'sql' && ranCells.has(cell.id) && !editingCell && (
              <CellRunResults cellId={cell.id} />
            )}
          </div>
        ))}

        {/* Add cell */}
        <div style={{ position: 'relative', marginTop: sp.B }}>
          <button
            onClick={() => setShowAddMenu(prev => !prev)}
            style={{ width: '100%', padding: `${sp.B}px ${sp.C}px`, border: `1px dashed ${c['border-divider']}`, borderRadius: 8, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp.B, fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.color = c['content-primary']; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-divider']; e.currentTarget.style.color = c['content-secondary']; }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M6 1v10M1 6h10" /></svg>
            Add cell
          </button>
          {showAddMenu && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, background: c['background-base'], border: `1px solid ${c['border-divider']}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', minWidth: 160, zIndex: 10 }}>
              {(['sql', 'python', 'text'] as NbCellType[]).map(type => (
                <button key={type} onClick={() => addCell(type)} style={{ width: '100%', padding: `${sp.B}px ${sp.C}px`, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: sp.B, fontSize: fs.xs, color: c['content-primary'], fontFamily: ff.primary, textAlign: 'left' }} onMouseEnter={e => { e.currentTarget.style.background = c['background-subtle']; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: NB_CELL_ACCENT[type], flexShrink: 0 }} />
                  {type === 'sql' ? 'SQL cell' : type === 'python' ? 'Python cell' : 'Text cell'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotebookView;
