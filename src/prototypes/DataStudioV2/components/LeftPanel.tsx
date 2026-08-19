import React, { useState, useRef, useEffect } from 'react';
import { c, sp, ff, fs, fw, ts } from '../styles';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/icons';
import { ProjectState, ProjectContext } from '../index';
import { tableMetadata, relationships, transformations } from '../data/mockData';
import TableDetailModal from './TableDetailModal';

interface LeftPanelProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  onSendToAgent: (message: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ABBR: Record<string, string> = {
  string: 'str',
  number: 'num',
  date: 'date',
  boolean: 'bool',
};

// ── Shared style constants ────────────────────────────────────────────────────

// All item names (table, column, join, formula) start at this x position.
// Chevron is position:absolute at left:6px so it never shifts the name.
const NAME_LEFT = 20;
const ROW_H = 24;
const COL_ROW_H = 22;

const rowStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  height: ROW_H,
  paddingLeft: NAME_LEFT,
  paddingRight: sp.B,
  cursor: 'pointer',
  borderRadius: 3,
};

const colRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: COL_ROW_H,
  paddingLeft: NAME_LEFT,
  paddingRight: sp.B,
  borderRadius: 3,
};

const secLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: fw.bold,
  color: c['content-secondary'],
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

// ── Main component ────────────────────────────────────────────────────────────

const LeftPanel: React.FC<LeftPanelProps> = ({ project, setProject, onSendToAgent }) => {
  const [memoryOpen, setMemoryOpen]           = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [expandedTables, setExpandedTables]   = useState<Set<string>>(new Set());
  const [addMenuOpen, setAddMenuOpen]         = useState(false);

  const ctx       = project.context;
  const hasMemory = !!(ctx.purpose || ctx.persona || ctx.sampleQuestions || ctx.businessLogic || ctx.spotterInstructions);
  const memoryText = hasMemory
    ? (ctx.purpose || ctx.persona || ctx.sampleQuestions || ctx.businessLogic || ctx.spotterInstructions)
    : 'Add purpose, audience, and instructions';

  const isDbt        = project.projectSource === 'dbt';
  const hasData      = project.addedTables.length > 0;
  const hasJoins     = project.buildStep === 'joined' || project.buildStep === 'transformed' || project.buildStep === 'healthy';
  const hasTransforms = project.buildStep === 'transformed' || project.buildStep === 'healthy';

  const activeJoins = relationships.filter(
    r => project.addedTables.includes(r.leftTable) && project.addedTables.includes(r.rightTable)
  );

  // For dbt: computed columns with syncStatus — the translated metrics that may need fixing
  const dbtFormulas = isDbt ? project.addedTables.flatMap(tableId => {
    const included = new Set(project.includedColumns[tableId] ?? []);
    const meta = tableMetadata[tableId];
    if (!meta) return [];
    return meta.columns.filter(col => included.has(col.id) && col.syncStatus);
  }) : [];

  const toggleTable = (id: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{ width: 240, height: '100%', flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {memoryOpen && (
        <MemoryModal
          context={ctx}
          onSave={(updated: ProjectContext) => setProject(p => ({ ...p, context: updated }))}
          onClose={() => setMemoryOpen(false)}
        />
      )}

      {selectedTableId && (
        <TableDetailModal
          tableId={selectedTableId}
          buildStep={project.buildStep}
          onClose={() => setSelectedTableId(null)}
        />
      )}

      {/* ── Memory ─────────────────────────────────────────────────────── */}
      <div
        onClick={() => setMemoryOpen(true)}
        style={{ padding: `${sp.D}px ${sp.C}px ${sp.B}px`, borderBottom: `1px solid ${c['border-divider']}`, cursor: 'pointer' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <div style={{ ...secLabelStyle, marginBottom: sp.A }}>Memory</div>
        <p style={{
          fontSize: fs.xs,
          color: hasMemory ? c['content-primary'] : c['content-secondary'],
          margin: 0,
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {memoryText}
        </p>
      </div>

      {/* ── Data ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1 }}>

        {/* Data header with + */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${sp.B}px ${sp.B}px ${sp.A}px ${sp.C}px`, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
            <span style={secLabelStyle}>Data</span>
            {isDbt && (
              <span style={{ fontSize: 12, fontWeight: fw.medium, color: c['content-secondary'], background: c['background-subtle'], border: `1px solid ${c['border-divider']}`, borderRadius: 3, padding: '1px 5px', lineHeight: '16px' }}>
                dbt
              </span>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              title={isDbt ? 'Model structure is managed by dbt' : 'Add'}
              disabled={isDbt}
              onClick={isDbt ? undefined : () => setAddMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: isDbt ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: sp.A, borderRadius: 3, color: c['content-secondary'], opacity: isDbt ? 0.35 : 1 }}
              onMouseEnter={e => { if (!isDbt) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
                <path d="M9 3.75V14.25M3.75 9H14.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            {addMenuOpen && (
              <ContextMenu
                items={[
                  { label: 'Add table',   onClick: () => onSendToAgent('Add tables to this model') },
                  { label: 'Add join',    onClick: () => onSendToAgent('Add joins between the tables in my model') },
                  { label: 'Add formula', onClick: () => onSendToAgent('Add a calculated column to my model') },
                ]}
                onClose={() => setAddMenuOpen(false)}
              />
            )}
          </div>
        </div>

        {/* dbt model name */}
        {isDbt && (
          <div style={{ display: 'flex', alignItems: 'center', height: ROW_H, paddingLeft: NAME_LEFT, paddingRight: sp.B, marginBottom: sp.A }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginRight: sp.A, color: c['content-secondary'] }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" fill="currentColor" opacity="0"/>
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 8h4M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-primary'], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name}
            </span>
          </div>
        )}

        {/* Tables */}
        <div style={{ marginBottom: sp.A }}>
          <div style={{ ...secLabelStyle, padding: `4px ${sp.C}px 2px` }}>Tables</div>
          {!hasData ? (
            <div style={{ ...rowStyle, cursor: 'default' }}>
              <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontStyle: 'italic' }}>No tables yet</span>
            </div>
          ) : (
            project.addedTables.map(id => {
              const table      = tableMetadata[id];
              if (!table) return null;
              const isExpanded = expandedTables.has(id);
              const includedSet = new Set(project.includedColumns[id] ?? []);

              return (
                <div key={id}>
                  {/* Table row */}
                  <div
                    style={rowStyle}
                    onClick={() => toggleTable(id)}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Chevron — absolute so it never shifts the name */}
                    <svg
                      style={{ position: 'absolute', left: 6, color: c['content-secondary'], transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.12s' }}
                      width="10" height="10" viewBox="0 0 18 18" fill="none"
                    >
                      <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: fs.xs, color: c['content-primary'], fontWeight: fw.medium, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {table.name}
                    </span>
                  </div>

                  {/* Column list */}
                  {isExpanded && (
                    <div style={{ paddingBottom: sp.A }}>
                      {table.columns.map(col => {
                        const isIncluded = !project.columnsSelected || includedSet.has(col.id) ||
                          relationships.some(r =>
                            (r.leftTable === id && r.leftColumn === col.id) ||
                            (r.rightTable === id && r.rightColumn === col.id)
                          );
                        return (
                          <div
                            key={col.id}
                            style={{ ...colRowStyle, opacity: isIncluded ? 1 : 0.45 }}
                            title={col.description ?? col.name}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span style={{ fontSize: 12, fontFamily: ff.mono, color: c['content-primary'], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {col.id}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Joins */}
        <div style={{ marginBottom: sp.A }}>
          <div style={{ ...secLabelStyle, padding: `4px ${sp.C}px 2px` }}>Joins</div>
          {!hasJoins || activeJoins.length === 0 ? (
            <div style={{ ...rowStyle, cursor: 'default' }}>
              <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontStyle: 'italic' }}>No joins yet</span>
            </div>
          ) : (
            activeJoins.map(rel => (
              <div
                key={rel.id}
                style={rowStyle}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: fs.xs, color: c['content-primary'], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tableMetadata[rel.leftTable]?.name ?? rel.leftTable} → {tableMetadata[rel.rightTable]?.name ?? rel.rightTable}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Formulas */}
        <div>
          <div style={{ ...secLabelStyle, padding: `4px ${sp.C}px 2px` }}>Formulas</div>
          {isDbt ? (
            dbtFormulas.length === 0 ? (
              <div style={{ ...rowStyle, cursor: 'default' }}>
                <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontStyle: 'italic' }}>No formulas</span>
              </div>
            ) : (
              dbtFormulas.map(col => {
                const effectiveStatus = project.columnOverrides?.[col.id]?.syncStatus ?? col.syncStatus;
                const isBroken   = effectiveStatus === 'broken';
                const isDegraded = effectiveStatus === 'degraded';
                const isFixed    = effectiveStatus === 'ok';
                return (
                  <div
                    key={col.id}
                    style={{ ...rowStyle, cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span style={{ fontSize: fs.xs, color: c['content-primary'], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {col.name}
                    </span>
                    {!isFixed && (isBroken || isDegraded) && (
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: isBroken ? c['content-failure'] : c['content-warning'] }}>
                        <rect x="7" y="3" width="2" height="6" rx="1" fill="currentColor"/>
                        <rect x="7" y="11" width="2" height="2" rx="1" fill="currentColor"/>
                      </svg>
                    )}
                  </div>
                );
              })
            )
          ) : !hasTransforms ? (
            <div style={{ ...rowStyle, cursor: 'default' }}>
              <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontStyle: 'italic' }}>No formulas yet</span>
            </div>
          ) : (
            transformations.map(t => (
              <div
                key={t.id}
                style={rowStyle}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: fs.xs, color: c['content-primary'], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.name}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Transformations — below Formulas */}
        {project.prepTransforms && project.prepTransforms.length > 0 && (
          <div style={{ marginTop: sp.A }}>
            <div style={{ ...secLabelStyle, padding: `4px ${sp.C}px 2px` }}>Transformations</div>
            {project.prepTransforms.map(t => (
              <div
                key={t.id}
                style={rowStyle}
                title={t.sql}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: fs.xs, color: c['content-primary'], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

// ── Context menu ──────────────────────────────────────────────────────────────

const ContextMenu: React.FC<{
  items: Array<{ label: string; danger?: boolean; onClick: () => void }>;
  onClose: () => void;
}> = ({ items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', right: 0, top: '100%', marginTop: sp.A,
        backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`,
        borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        zIndex: 200, minWidth: 148, overflow: 'hidden',
      }}
    >
      {items.map(item => (
        <div
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          style={{ padding: `${sp.B}px ${sp.C}px`, fontSize: fs.sm, cursor: 'pointer', color: item.danger ? '#ef4444' : c['content-primary'] }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

// ── Memory modal ──────────────────────────────────────────────────────────────

const MemoryModal: React.FC<{
  context: ProjectContext;
  onSave: (updated: ProjectContext) => void;
  onClose: () => void;
}> = ({ context, onSave, onClose }) => {
  const [draft, setDraft] = useState<ProjectContext>({ ...context });

  const sections: Array<{ key: keyof ProjectContext; label: string; placeholder: string; rows?: number }> = [
    { key: 'purpose',             label: 'Purpose',           placeholder: 'What is this model for? What decisions does it support?', rows: 3 },
    { key: 'persona',             label: 'Audience',          placeholder: 'Who uses this model? Describe their role and what they care about.', rows: 3 },
    { key: 'sampleQuestions',     label: 'Sample questions',  placeholder: 'Key questions this model is designed to answer.', rows: 5 },
    { key: 'businessLogic',       label: 'Business logic',    placeholder: 'Domain definitions, KPI formulas, exclusion rules, date conventions.', rows: 5 },
    { key: 'spotterInstructions', label: 'Spotter instructions', placeholder: "How should Spotter interpret this data?", rows: 4 },
  ];

  const handleClose = () => { onSave(draft); onClose(); };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={handleClose}
    >
      <div
        style={{ backgroundColor: c['background-base'], borderRadius: 12, width: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Memory</span>
            <p style={{ margin: `${sp.A}px 0 0`, fontSize: fs.xs, color: c['content-secondary'] }}>Model context. Updated by the agent and by you.</p>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c['content-secondary'], lineHeight: 1, padding: 0, marginTop: sp.A }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', flexGrow: 1 }}>
          {sections.map(({ key, label, placeholder, rows }, i) => (
            <div key={key} style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: i < sections.length - 1 ? `1px solid ${c['border-divider']}` : 'none' }}>
              <p style={{ ...ts.overline, color: c['content-secondary'], margin: `0 0 ${sp.B}px` }}>{label}</p>
              <textarea
                value={draft[key]}
                onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={rows ?? 4}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontSize: fs.sm, color: c['content-primary'], fontFamily: ff.primary, lineHeight: '1.65', boxSizing: 'border-box', padding: 0 }}
              />
            </div>
          ))}
        </div>

        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Saves when you close</span>
          <Button variant="primary" size="basic" onClick={handleClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
