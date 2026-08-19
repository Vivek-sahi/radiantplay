import React, { useState } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { PlanData, PlanColumn, PlanTable } from './AgentPanel';

interface PlanPanelProps {
  plan: PlanData;
  onClose: () => void;
}

type PanelTab = 'preview' | 'code';
type SectionKey = 'goal' | 'tables' | 'relationships' | 'columns' | 'formulas' | 'questions';
type CellType = 'sql' | 'python' | 'text';

interface CellDef {
  label: string;
  type: CellType;
  instruction: string;
}

const CELL_DEFS: CellDef[] = [
  { label: 'Goal',             type: 'text', instruction: 'Sets the business intent and scope for this model. The agent uses this to guide all downstream decisions.' },
  { label: 'Tables',           type: 'sql',  instruction: 'Declares the source tables this model draws from.' },
  { label: 'Relationships',    type: 'sql',  instruction: 'Specifies how the source tables join to each other.' },
  { label: 'Columns',          type: 'sql',  instruction: 'Selects and renames the output columns that analysts will see.' },
  { label: 'Formulas',         type: 'sql',  instruction: 'Calculates derived metrics using ThoughtSpot formula syntax.' },
  { label: 'Sample questions', type: 'text', instruction: 'Natural language questions this model should answer — used to validate coverage.' },
];

// ── SQL / text generation ──────────────────────────────────────────────────────

function makeAliases(tables: PlanTable[]): Record<string, string> {
  const used = new Set<string>();
  const out: Record<string, string> = {};
  for (const t of tables) {
    let a = t.name[0].toLowerCase();
    if (used.has(a)) a = t.name.slice(0, 2).toLowerCase();
    used.add(a);
    out[t.name] = a;
  }
  return out;
}

function genGoalText(plan: PlanData): string {
  return plan.goal;
}

function genTablesSQL(plan: PlanData): string {
  if (plan.tables.length === 0) return '';
  const lines: string[] = ['-- Source tables', 'WITH'];
  plan.tables.forEach((t, i) => {
    const comma = i < plan.tables.length - 1 ? ',' : '';
    const rowNote = t.rowCount ? `  -- ${t.rowCount}` : '';
    lines.push(`  ${t.name} AS (SELECT * FROM ${t.schema}.${t.name})${comma}${rowNote}`);
  });
  return lines.join('\n');
}

function genRelationshipsSQL(plan: PlanData): string {
  if (plan.tables.length === 0) return '';
  const al = makeAliases(plan.tables);
  const primary = plan.tables[0];
  const pa = al[primary.name];

  const joinedCols = plan.columns
    .filter(col => col.type !== 'formula' && col.table !== primary.name)
    .map(col => {
      const alias = al[col.table] ?? col.table.slice(0, 1).toLowerCase();
      return `  ${alias}.${col.name}`;
    });

  const lines: string[] = [
    '-- Join conditions',
    'SELECT',
    `  ${pa}.*,`,
    ...joinedCols.map((line, i) => line + (i < joinedCols.length - 1 ? ',' : '')),
    `FROM ${primary.name} ${pa}`,
  ];

  plan.relationships.forEach(rel => {
    const ta = al[rel.toTable] ?? rel.toTable.slice(0, 1).toLowerCase();
    lines.push(`${rel.joinType} ${rel.toTable} ${ta}  -- ${rel.matchRate}`);
    lines.push(`  ON ${pa}.${rel.fromKey} = ${ta}.${rel.toKey}`);
  });

  return lines.join('\n');
}

function genColumnsSQL(plan: PlanData): string {
  const dims = plan.columns.filter(col => col.type === 'dimension');
  const metrics = plan.columns.filter(col => col.type === 'metric');
  const lines: string[] = ['-- Dimensions and metrics', 'SELECT'];

  if (dims.length > 0) {
    lines.push('  -- Dimensions');
    dims.forEach((col, i) => {
      const hasMore = i < dims.length - 1 || metrics.length > 0;
      lines.push(`  ${col.name}${hasMore ? ',' : ''}`);
    });
  }
  if (metrics.length > 0) {
    lines.push('  -- Metrics');
    metrics.forEach((col, i) => {
      lines.push(`  ${col.name}${i < metrics.length - 1 ? ',' : ''}`);
    });
  }

  const viewName = plan.modelName.toLowerCase().replace(/\s+/g, '_') + '_base';
  lines.push(`FROM ${viewName}`);
  return lines.join('\n');
}

function genFormulasSQL(plan: PlanData): string {
  const formulas = plan.columns.filter(col => col.type === 'formula');
  if (formulas.length === 0) return '-- No formula columns defined';
  const lines: string[] = ['-- Calculated columns', 'SELECT', '  *,'];
  formulas.forEach((col, i) => {
    const comma = i < formulas.length - 1 ? ',' : '';
    lines.push(`  ${col.formula || col.name} AS ${col.name}${comma}  -- ${col.description}`);
  });
  const viewName = plan.modelName.toLowerCase().replace(/\s+/g, '_') + '_joined';
  lines.push(`FROM ${viewName}`);
  return lines.join('\n');
}

function genSampleQuestionsText(plan: PlanData): string {
  return plan.sampleQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
}

function genCellValue(plan: PlanData, index: number): string {
  switch (index) {
    case 0: return genGoalText(plan);
    case 1: return genTablesSQL(plan);
    case 2: return genRelationshipsSQL(plan);
    case 3: return genColumnsSQL(plan);
    case 4: return genFormulasSQL(plan);
    case 5: return genSampleQuestionsText(plan);
    default: return '';
  }
}

// ── SQL colorizer ──────────────────────────────────────────────────────────────

const SQL_KW = new Set([
  'SELECT', 'FROM', 'JOIN', 'LEFT', 'INNER', 'RIGHT', 'OUTER', 'ON', 'WHERE', 'AS',
  'DISTINCT', 'OVER', 'PARTITION', 'BY', 'ORDER', 'GROUP', 'HAVING', 'WITH',
  'SUM', 'COUNT', 'AVG', 'MAX', 'MIN', 'NULLIF', 'AND', 'OR', 'NOT', 'NULL',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'COALESCE',
]);
const SQL_KW_RE = /\b(SELECT|FROM|JOIN|LEFT|INNER|RIGHT|OUTER|ON|WHERE|AS|DISTINCT|OVER|PARTITION|BY|ORDER|GROUP|HAVING|WITH|SUM|COUNT|AVG|MAX|MIN|NULLIF|AND|OR|NOT|NULL|CASE|WHEN|THEN|ELSE|END|COALESCE)\b/g;

const SqlLine: React.FC<{ line: string }> = ({ line }) => {
  const commentIdx = line.indexOf('--');
  if (commentIdx === 0) {
    return <span style={{ color: c['content-secondary'] }}>{line}</span>;
  }
  if (commentIdx > 0) {
    const code = line.slice(0, commentIdx);
    const comment = line.slice(commentIdx);
    return (
      <span>
        <SqlTokens text={code} />
        <span style={{ color: c['content-secondary'] }}>{comment}</span>
      </span>
    );
  }
  return <SqlTokens text={line} />;
};

const SqlTokens: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(new RegExp(SQL_KW_RE.source, 'g'));
  return (
    <span>
      {parts.map((part, i) =>
        SQL_KW.has(part)
          ? <span key={i} style={{ color: '#7C3AED', fontWeight: fw.semibold }}>{part}</span>
          : <span key={i} style={{ color: c['content-primary'] }}>{part}</span>
      )}
    </span>
  );
};

// ── Cell accent colors ─────────────────────────────────────────────────────────

const CELL_ACCENT: Record<CellType, string> = {
  sql:    '#2770EF',
  python: '#E8A020',
  text:   c['border-divider'],
};

// ── Code cell ──────────────────────────────────────────────────────────────────

interface CodeCellProps {
  label: string;
  type: CellType;
  value: string;
  isEditing: boolean;
  draftValue: string;
  isRunning?: boolean;
  isFlash?: boolean;
  onEdit: () => void;
  onRun: () => void;
  onCancel: () => void;
  onDraftChange: (v: string) => void;
}

const CodeCell: React.FC<CodeCellProps> = ({
  label, type, value, isEditing, draftValue, isRunning, isFlash, onEdit, onRun, onCancel, onDraftChange,
}) => {
  const [headerHovered, setHeaderHovered] = useState(false);
  const displayValue = isEditing ? draftValue : value;
  const lineCount = displayValue.split('\n').length;

  const headerBg = isFlash
    ? '#dcfce7'
    : headerHovered && !isEditing && !isRunning
      ? c['background-subtle']
      : c['background-base'];

  return (
    <div style={{
      border: `1px solid ${isFlash ? '#86efac' : c['border-divider']}`,
      borderLeft: `3px solid ${isFlash ? '#16a34a' : CELL_ACCENT[type]}`,
      borderRadius: 8,
      backgroundColor: c['background-base'],
      overflow: 'hidden',
      flexShrink: 0,
      transition: 'border-color 0.3s',
    }}>
      {/* Cell header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `6px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`,
          backgroundColor: headerBg,
          transition: 'background-color 0.3s',
        }}
        onMouseEnter={() => setHeaderHovered(true)}
        onMouseLeave={() => setHeaderHovered(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
          <span style={{
            fontSize: 12, fontWeight: fw.semibold, color: type === 'sql' ? '#7C3AED' : type === 'python' ? '#B45309' : c['content-secondary'],
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{type}</span>
          <span style={{ fontSize: fs.xs, color: c['content-primary'], fontWeight: fw.medium }}>{label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, opacity: isEditing || isRunning || isFlash || headerHovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          {isRunning ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: 'ds-spin 0.8s linear infinite', flexShrink: 0 }}>
                <circle cx="6" cy="6" r="4.5" strokeOpacity="0.25" />
                <path d="M6 1.5A4.5 4.5 0 0 1 10.5 6" strokeLinecap="round" />
              </svg>
              Running…
            </div>
          ) : isFlash ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.A, fontSize: fs.xs, color: '#16a34a', fontFamily: ff.primary, fontWeight: fw.medium }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,6 5,9 10,3" />
              </svg>
              Applied
            </div>
          ) : isEditing ? (
            <>
              <button
                onClick={onCancel}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-secondary'], padding: '2px 6px', fontFamily: ff.primary }}
              >
                Cancel
              </button>
              <button
                onClick={onRun}
                style={{
                  display: 'flex', alignItems: 'center', gap: sp.A,
                  background: '#16a34a', color: '#fff', border: 'none',
                  borderRadius: 5, cursor: 'pointer',
                  fontSize: fs.xs, fontWeight: fw.semibold, padding: '3px 10px', fontFamily: ff.primary,
                }}
              >
                <svg width="7" height="8" viewBox="0 0 7 8" fill="currentColor"><polygon points="0,0 7,4 0,8" /></svg>
                Run
              </button>
            </>
          ) : (
            <button
              onClick={onEdit}
              title="Edit cell"
              style={{
                width: 24, height: 24, border: 'none', background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: 4,
                color: c['content-secondary'], padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
              onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 2.5a1.5 1.5 0 0 1 2.1 2.1L5 13.1l-3 .9.9-3 8.6-8.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Cell body */}
      {isEditing ? (
        <textarea
          autoFocus
          value={draftValue}
          onChange={e => onDraftChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: Math.max(lineCount * 20 + 24, 80),
            padding: sp.C,
            fontFamily: type === 'sql' ? ff.mono : ff.primary,
            fontSize: fs.xs,
            color: c['content-primary'],
            backgroundColor: type === 'sql' ? c['background-sunken'] : c['background-base'],
            border: 'none', outline: 'none',
            resize: 'vertical', lineHeight: '20px',
            boxSizing: 'border-box',
          }}
        />
      ) : type === 'sql' ? (
        <div style={{ padding: sp.C, fontFamily: ff.mono, fontSize: fs.xs, lineHeight: '20px', backgroundColor: c['background-sunken'] }}>
          {value.split('\n').map((line, i) => (
            <div key={i} style={{ display: 'flex', gap: sp.C }}>
              <span style={{ color: c['content-secondary'], userSelect: 'none', minWidth: 18, textAlign: 'right', flexShrink: 0, opacity: 0.5 }}>
                {i + 1}
              </span>
              <SqlLine line={line} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: `${sp.C}px ${sp.D}px`, fontSize: fs.sm, color: c['content-primary'], lineHeight: '22px', whiteSpace: 'pre-wrap' }}>
          {value}
        </div>
      )}
    </div>
  );
};

// ── Section accordion ─────────────────────────────────────────────────────────

const Section: React.FC<{
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ label, collapsed, onToggle, children }) => (
  <div style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
    <button
      onClick={onToggle}
      style={{ width: '100%', padding: `${sp.C}px ${sp.D}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff.primary, textAlign: 'left' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{label}</span>
      <svg
        width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
      >
        <polyline points="2,4 6,8 10,4" />
      </svg>
    </button>
    {!collapsed && children}
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────

const PlanPanel: React.FC<PlanPanelProps> = ({ plan, onClose }) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('preview');
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    goal: false, tables: false, relationships: false, columns: false, formulas: false, questions: false,
  });

  const [cellDefs, setCellDefs] = useState<CellDef[]>(() => [...CELL_DEFS]);
  const [cellValues, setCellValues] = useState<string[]>(() =>
    CELL_DEFS.map((_, i) => genCellValue(plan, i))
  );
  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [appliedCells, setAppliedCells] = useState<Set<number>>(new Set());
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [runningCells, setRunningCells] = useState<Set<number>>(new Set());
  const [flashCells, setFlashCells] = useState<Set<number>>(new Set());
  const [localVersion, setLocalVersion] = useState(plan.version);

  const addCell = (type: CellType) => {
    const defaults: Record<CellType, string> = {
      sql:    '-- Write SQL here\n',
      python: '# Write Python here\n',
      text:   'Add description here',
    };
    const labels: Record<CellType, string> = {
      sql:    'New SQL cell',
      python: 'New Python cell',
      text:   'New text cell',
    };
    setCellDefs(prev => [...prev, { label: labels[type], type, instruction: '' }]);
    setCellValues(prev => [...prev, defaults[type]]);
    setShowAddMenu(false);
  };

  const toggleSection = (key: SectionKey) =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const startEdit = (i: number) => { setEditingCell(i); setDraftValue(cellValues[i]); };
  const cancelEdit = () => { setEditingCell(null); setDraftValue(''); };
  const runCell = (i: number) => {
    const valueToApply = draftValue;
    setEditingCell(null);
    setRunningCells(prev => new Set(prev).add(i));
    setTimeout(() => {
      setCellValues(prev => { const next = [...prev]; next[i] = valueToApply; return next; });
      setAppliedCells(prev => new Set(prev).add(i));
      setRunningCells(prev => { const s = new Set(prev); s.delete(i); return s; });
      setFlashCells(prev => new Set(prev).add(i));
      setLocalVersion(prev => Math.round((prev + 0.1) * 10) / 10);
      setDraftValue('');
      setTimeout(() => {
        setFlashCells(prev => { const s = new Set(prev); s.delete(i); return s; });
      }, 600);
    }, 700);
  };

  const baseColumns = plan.columns.filter(col => col.type !== 'formula');
  const formulaCols = plan.columns.filter(col => col.type === 'formula');
  const columnsByTable = baseColumns.reduce<Record<string, PlanColumn[]>>((acc, col) => {
    if (!acc[col.table]) acc[col.table] = [];
    acc[col.table].push(col);
    return acc;
  }, {});

  const typeColor = (type: PlanColumn['type']) => type === 'metric' ? '#1AA251' : c['content-secondary'];
  const typeLabel = (type: PlanColumn['type']) => type === 'metric' ? 'Metric' : 'Dimension';

  return (
    <>
      <style>{`
        @keyframes ds-slide-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes ds-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        flex: 1,
        minHeight: 0,
        backgroundColor: c['background-base'],
        border: `1px solid ${c['border-divider']}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: ff.primary,
        animation: 'ds-slide-in 0.2s ease-out',
      }}>

        {/* Identity row */}
        <div style={{
          height: 48, borderBottom: `1px solid ${c['border-divider']}`,
          padding: `0 ${sp.D}px`, display: 'flex', alignItems: 'center', gap: sp.C, flexShrink: 0,
        }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: sp.B }}>
            <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{plan.modelName}</span>
            <span style={{ fontSize: fs.xs, fontWeight: fw.medium, padding: '2px 7px', borderRadius: 4, backgroundColor: c['background-subtle'], color: c['content-secondary'] }}>
              v{localVersion.toFixed(1)}
            </span>
          </div>
          <button
            title="Download plan"
            style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: c['content-secondary'], padding: 0, flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v8" /><polyline points="5,7 8,10 11,7" /><path d="M3 13h10" />
            </svg>
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: c['content-secondary'], padding: 0, flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" /><line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${c['border-divider']}`, padding: `0 ${sp.D}px`, flexShrink: 0, gap: sp.D }}>
          {(['preview', 'code'] as PanelTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab ? `2px solid ${c['content-brand']}` : '2px solid transparent',
                padding: `${sp.B}px 0`, marginBottom: -1,
                fontSize: fs.sm,
                fontWeight: activeTab === tab ? fw.semibold : fw.regular,
                color: activeTab === tab ? c['content-brand'] : c['content-secondary'],
                fontFamily: ff.primary, textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Preview tab */}
        {activeTab === 'preview' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: `${sp.B}px 0` }}>
            {appliedCells.size > 0 && (
              <div style={{
                margin: `${sp.B}px ${sp.D}px`,
                padding: `${sp.B}px ${sp.C}px`,
                borderRadius: 6, backgroundColor: c['background-information'],
                fontSize: fs.xs, color: c['content-brand'],
                display: 'flex', alignItems: 'center', gap: sp.B,
              }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6" /><line x1="8" y1="5" x2="8" y2="8" /><circle cx="8" cy="11" r="0.6" fill="currentColor" stroke="none" />
                </svg>
                Some sections were last edited in code view
              </div>
            )}

            <Section label="Goal" collapsed={collapsed.goal} onToggle={() => toggleSection('goal')}>
              <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px', padding: `0 ${sp.D}px ${sp.D}px` }}>
                {plan.goal}
              </p>
            </Section>

            <Section label={`Tables (${plan.tables.length})`} collapsed={collapsed.tables} onToggle={() => toggleSection('tables')}>
              <div style={{ padding: `0 ${sp.D}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.C }}>
                {plan.tables.map(table => (
                  <div key={table.name} style={{ borderRadius: 7, border: `1px solid ${c['border-divider']}`, padding: `${sp.B}px ${sp.C}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.A }}>
                      <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: 'monospace' }}>
                        {table.schema}.{table.name}
                      </span>
                      {table.rowCount && <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{table.rowCount}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: fs.sm, color: c['content-secondary'], lineHeight: '20px' }}>{table.description}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section label={`Relationships (${plan.relationships.length})`} collapsed={collapsed.relationships} onToggle={() => toggleSection('relationships')}>
              <div style={{ padding: `0 ${sp.D}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.C }}>
                {plan.relationships.map((rel, i) => (
                  <div key={i} style={{ borderRadius: 7, border: `1px solid ${c['border-divider']}`, padding: `${sp.B}px ${sp.C}px` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.A, flexWrap: 'wrap' }}>
                      <code style={{ fontSize: fs.xs, color: c['content-primary'], backgroundColor: c['background-subtle'], padding: '1px 5px', borderRadius: 3 }}>{rel.fromTable}</code>
                      <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>→</span>
                      <code style={{ fontSize: fs.xs, color: c['content-primary'], backgroundColor: c['background-subtle'], padding: '1px 5px', borderRadius: 3 }}>{rel.toTable}</code>
                      <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: '#1AA251', marginLeft: 'auto' }}>{rel.joinType}</span>
                    </div>
                    <div style={{ display: 'flex', gap: sp.A, marginBottom: sp.A }}>
                      <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>on</span>
                      <code style={{ fontSize: fs.xs, color: c['content-primary'] }}>{rel.fromKey} = {rel.toKey}</code>
                    </div>
                    <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'] }}>{rel.matchRate}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section label={`Columns (${baseColumns.length})`} collapsed={collapsed.columns} onToggle={() => toggleSection('columns')}>
              <div style={{ padding: `0 ${sp.D}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.D }}>
                {Object.entries(columnsByTable).map(([tableName, cols]) => (
                  <div key={tableName}>
                    <p style={{ margin: `0 0 ${sp.B}px`, fontSize: 12, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {tableName}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {cols.map((col, ci) => (
                        <div key={col.name} style={{ display: 'flex', gap: sp.B, padding: `${sp.B}px 0`, borderBottom: ci < cols.length - 1 ? `1px solid ${c['border-divider']}` : 'none' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.A }}>
                              <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{col.name}</span>
                              <span style={{ fontSize: fs.xs, color: typeColor(col.type) }}>{typeLabel(col.type)}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '16px' }}>{col.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {formulaCols.length > 0 && (
              <Section label={`Formulas (${formulaCols.length})`} collapsed={collapsed.formulas} onToggle={() => toggleSection('formulas')}>
                <div style={{ padding: `0 ${sp.D}px ${sp.D}px`, display: 'flex', flexDirection: 'column' }}>
                  {formulaCols.map((col, ci) => (
                    <div key={col.name} style={{ padding: `${sp.B}px 0`, borderBottom: ci < formulaCols.length - 1 ? `1px solid ${c['border-divider']}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.A }}>
                        <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{col.name}</span>
                        <span style={{ fontSize: fs.xs, color: c['content-brand'] }}>Formula</span>
                      </div>
                      <p style={{ margin: `0 0 3px`, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '16px' }}>{col.description}</p>
                      {col.formula && (
                        <code style={{ display: 'block', fontSize: fs.xs, color: c['content-brand'], lineHeight: '16px', fontFamily: 'monospace' }}>{col.formula}</code>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            <Section label={`Sample questions (${plan.sampleQuestions.length})`} collapsed={collapsed.questions} onToggle={() => toggleSection('questions')}>
              <div style={{ padding: `0 ${sp.D}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.B }}>
                {plan.sampleQuestions.map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: sp.B, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: fs.xs, color: c['content-secondary'], flexShrink: 0, paddingTop: 1, minWidth: 16, textAlign: 'right' }}>{i + 1}.</span>
                    <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '18px' }}>{q}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Code tab */}
        {activeTab === 'code' && (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: sp.D, display: 'flex', flexDirection: 'column', gap: sp.C }}>
            {cellDefs.map(({ label, type, instruction }, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: sp.A }}>
                {instruction && (
                  <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '16px', paddingLeft: sp.A }}>{instruction}</p>
                )}
                <CodeCell
                  label={label}
                  type={type}
                  value={cellValues[i]}
                  isEditing={editingCell === i}
                  draftValue={editingCell === i ? draftValue : ''}
                  isRunning={runningCells.has(i)}
                  isFlash={flashCells.has(i)}
                  onEdit={() => startEdit(i)}
                  onRun={() => runCell(i)}
                  onCancel={cancelEdit}
                  onDraftChange={setDraftValue}
                />
              </div>
            ))}

            {/* Add new code block */}
            <div style={{ position: 'relative', marginTop: sp.B }}>
              <button
                onClick={() => setShowAddMenu(prev => !prev)}
                style={{
                  width: '100%', padding: `${sp.B}px ${sp.C}px`,
                  border: `1px dashed ${c['border-divider']}`, borderRadius: 8,
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: sp.B,
                  fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.color = c['content-primary']; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-divider']; e.currentTarget.style.color = c['content-secondary']; }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 1v10M1 6h10" />
                </svg>
                Add new code block
              </button>

              {showAddMenu && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: 0, marginBottom: sp.A,
                  background: c['background-base'], border: `1px solid ${c['border-divider']}`,
                  borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  overflow: 'hidden', minWidth: 160, zIndex: 10,
                }}>
                  {(['sql', 'python', 'text'] as CellType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => addCell(type)}
                      style={{
                        width: '100%', padding: `${sp.B}px ${sp.C}px`,
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: sp.B,
                        fontSize: fs.xs, color: c['content-primary'],
                        fontFamily: ff.primary, textAlign: 'left',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = c['background-subtle']; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: CELL_ACCENT[type], flexShrink: 0 }} />
                      {type === 'sql' ? 'SQL cell' : type === 'python' ? 'Python cell' : 'Text cell'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default PlanPanel;
