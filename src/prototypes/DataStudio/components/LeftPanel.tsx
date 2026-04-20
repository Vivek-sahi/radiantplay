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

function getJoinKeySet(tableId: string): Set<string> {
  const keys = new Set<string>();
  for (const rel of relationships) {
    if (rel.leftTable === tableId) keys.add(rel.leftColumn);
    if (rel.rightTable === tableId) keys.add(rel.rightColumn);
  }
  return keys;
}

const TYPE_ABBR: Record<string, string> = {
  string: 'str',
  number: 'num',
  date: 'date',
  boolean: 'bool',
};

const TABLE_COLORS: Record<string, string> = {
  orders: '#2770ef',
  campaigns: '#7c3aed',
  users: '#059669',
};

// ── Main component ────────────────────────────────────────────────────────────

const LeftPanel: React.FC<LeftPanelProps> = ({ project, setProject, onSendToAgent }) => {
  const [memoryOpen, setMemoryOpen]         = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu]             = useState<string | null>(null);

  const ctx       = project.context;
  const hasMemory = ctx.purpose || ctx.persona || ctx.sampleQuestions || ctx.businessLogic || ctx.spotterInstructions;
  const summaryText = hasMemory
    ? (ctx.purpose || ctx.persona || ctx.sampleQuestions || ctx.businessLogic).slice(0, 42) + '…'
    : 'Purpose, audience, and instructions';

  const hasData      = project.addedTables.length > 0;
  const hasJoins     = project.buildStep === 'joined' || project.buildStep === 'transformed' || project.buildStep === 'healthy';
  const hasTransforms = project.buildStep === 'transformed' || project.buildStep === 'healthy';

  const activeJoins = relationships.filter(
    r => project.addedTables.includes(r.leftTable) && project.addedTables.includes(r.rightTable)
  );

  const toggleTable = (id: string) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const removeTable = (tableId: string) => {
    setProject(p => {
      const addedTables = p.addedTables.filter(id => id !== tableId);
      const includedColumns = { ...p.includedColumns };
      delete includedColumns[tableId];
      return {
        ...p,
        addedTables,
        includedColumns,
        buildStep: addedTables.length === 0 ? 'empty' : p.buildStep,
      };
    });
  };

  return (
    <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

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

      {/* ── Memory ── */}
      <PanelSection
        label="Memory"
        action={<IconBtn title="Edit memory" icon="pencil" onClick={() => setMemoryOpen(true)} />}
      >
        <p
          onClick={() => setMemoryOpen(true)}
          style={{ fontSize: fs.xs, color: hasMemory ? c['content-brand'] : c['content-secondary'], margin: 0, cursor: 'pointer', wordBreak: 'break-word' }}
        >
          {summaryText}
        </p>
      </PanelSection>

      {/* ── Tables ── */}
      <PanelSection
        label="Tables"
        action={<IconBtn title="Add table" icon="plus" onClick={() => onSendToAgent('Add tables to this project')} />}
      >
        {!hasData ? (
          <p style={{ fontSize: fs.xs, color: c['content-secondary'], margin: 0 }}>No tables added yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {project.addedTables.map(id => {
              const table = tableMetadata[id];
              if (!table) return null;

              const isExpanded  = expandedTables.has(id);
              const joinKeys    = getJoinKeySet(id);
              const includedSet = new Set(project.includedColumns[id] ?? []);
              const color       = TABLE_COLORS[id] ?? c['content-brand'];

              // Badge: included count (join keys + explicitly included)
              const allIncluded    = new Set([...joinKeys, ...includedSet]);
              const includedCount  = project.columnsSelected ? allIncluded.size : joinKeys.size;
              const totalCount     = table.columns.length;

              return (
                <div key={id}>
                  {/* Table row */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: `${sp.B}px`, borderRadius: 4, cursor: 'pointer', position: 'relative' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <span
                      onClick={() => toggleTable(id)}
                      style={{ fontSize: 10, color: c['content-secondary'], width: 12, textAlign: 'center', flexShrink: 0, userSelect: 'none' }}
                    >
                      {isExpanded ? '▾' : '›'}
                    </span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                    <span
                      onClick={() => toggleTable(id)}
                      style={{ fontSize: fs.xs, color: c['content-primary'], fontWeight: fw.medium, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {table.name}
                    </span>
                    <span style={{ fontSize: 10, color: c['content-secondary'], flexShrink: 0, marginRight: 2 }}>
                      {includedCount}/{totalCount}
                    </span>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <span
                        onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === `table-${id}` ? null : `table-${id}`); }}
                        style={{ fontSize: fs.xs, color: c['content-secondary'], cursor: 'pointer', padding: `0 2px`, lineHeight: 1, userSelect: 'none' }}
                      >
                        ···
                      </span>
                      {openMenu === `table-${id}` && (
                        <ContextMenu
                          items={[
                            { label: 'View detail', onClick: () => setSelectedTableId(id) },
                            { label: 'Remove table', danger: true, onClick: () => removeTable(id) },
                          ]}
                          onClose={() => setOpenMenu(null)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Column list */}
                  {isExpanded && (
                    <div style={{ paddingLeft: 18, paddingBottom: sp.A }}>
                      {table.columns.map(col => {
                        const isKey      = joinKeys.has(col.id);
                        const isIncluded = project.columnsSelected && (includedSet.has(col.id) || isKey);
                        const muted      = !isKey && !isIncluded;

                        return (
                          <div
                            key={col.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: `2px ${sp.B}px`, borderRadius: 3 }}
                            title={col.description ?? col.name}
                          >
                            <span style={{
                              fontSize: 10,
                              width: 10,
                              flexShrink: 0,
                              color: isKey ? '#f59e0b' : isIncluded ? c['content-brand'] : c['content-secondary'],
                              opacity: muted ? 0.5 : 1,
                              textAlign: 'center',
                            }}>
                              {isKey ? '⚿' : isIncluded ? '✓' : '–'}
                            </span>
                            <span style={{
                              fontSize: 10,
                              fontFamily: ff.mono,
                              color: muted ? c['content-secondary'] : c['content-primary'],
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              opacity: muted ? 0.6 : 1,
                            }}>
                              {col.id}
                            </span>
                            <span style={{
                              fontSize: 9,
                              color: c['content-secondary'],
                              flexShrink: 0,
                              opacity: muted ? 0.4 : 0.7,
                            }}>
                              {TYPE_ABBR[col.type] ?? col.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PanelSection>

      {/* ── Joins ── */}
      <PanelSection
        label="Joins"
        action={hasData ? <IconBtn title="Add join" icon="plus" onClick={() => onSendToAgent('Add joins between the tables in my project')} /> : undefined}
      >
        {!hasJoins || activeJoins.length === 0 ? (
          <p style={{ fontSize: fs.xs, color: c['content-secondary'], margin: 0, fontStyle: 'italic' }}>No joins yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activeJoins.map(rel => (
              <div
                key={rel.id}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: `${sp.B}px`, borderRadius: 4, position: 'relative' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: 10, color: c['content-secondary'], flexShrink: 0 }}>⇄</span>
                <span style={{ fontSize: fs.xs, color: c['content-primary'], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {tableMetadata[rel.leftTable]?.name ?? rel.leftTable}
                </span>
                <span style={{ fontSize: 9, color: c['content-secondary'], flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {rel.joinType}
                </span>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <span
                    onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === `join-${rel.id}` ? null : `join-${rel.id}`); }}
                    style={{ fontSize: fs.xs, color: c['content-secondary'], cursor: 'pointer', padding: `0 2px`, userSelect: 'none' }}
                  >
                    ···
                  </span>
                  {openMenu === `join-${rel.id}` && (
                    <ContextMenu
                      items={[
                        { label: 'Edit join type', onClick: () => {} },
                        { label: 'Remove join', danger: true, onClick: () => {} },
                      ]}
                      onClose={() => setOpenMenu(null)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelSection>

      {/* ── Formulas ── */}
      <PanelSection
        label="Formulas"
        action={hasData ? <IconBtn title="Add formula" icon="plus" onClick={() => onSendToAgent('Add a calculated column to my project')} /> : undefined}
      >
        {!hasTransforms ? (
          <p style={{ fontSize: fs.xs, color: c['content-secondary'], margin: 0, fontStyle: 'italic' }}>No calculated columns yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {transformations.map(t => (
              <div
                key={t.id}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: `${sp.B}px`, borderRadius: 4, position: 'relative' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <span style={{ fontSize: 10, color: c['content-secondary'], fontFamily: ff.mono, flexShrink: 0 }}>ƒx</span>
                <span style={{ fontSize: fs.xs, color: c['content-primary'], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.name}
                </span>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <span
                    onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === `formula-${t.id}` ? null : `formula-${t.id}`); }}
                    style={{ fontSize: fs.xs, color: c['content-secondary'], cursor: 'pointer', padding: `0 2px`, userSelect: 'none' }}
                  >
                    ···
                  </span>
                  {openMenu === `formula-${t.id}` && (
                    <ContextMenu
                      items={[
                        { label: 'Edit formula', onClick: () => {} },
                        { label: 'Remove formula', danger: true, onClick: () => {} },
                      ]}
                      onClose={() => setOpenMenu(null)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelSection>

    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const PanelSection: React.FC<{
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ label, action, children }) => (
  <div style={{ padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.B }}>
      <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>{label}</span>
      {action}
    </div>
    {children}
  </div>
);

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
        position: 'absolute',
        right: 0,
        top: '100%',
        marginTop: 2,
        backgroundColor: c['background-base'],
        border: `1px solid ${c['border-divider']}`,
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        zIndex: 200,
        minWidth: 148,
        overflow: 'hidden',
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

const IconBtn: React.FC<{ title: string; icon: 'pencil' | 'plus' | 'settings'; onClick?: () => void }> = ({ title, icon, onClick }) => (
  <Button variant="tertiary" size="small" title={title} onClick={onClick}>
    <Icon name={icon} size="s" color={c['content-secondary']} />
  </Button>
);

// ── Memory modal ──────────────────────────────────────────────────────────────

const MemoryModal: React.FC<{
  context: ProjectContext;
  onSave: (updated: ProjectContext) => void;
  onClose: () => void;
}> = ({ context, onSave, onClose }) => {
  const [draft, setDraft] = useState<ProjectContext>({ ...context });

  const sections: Array<{ key: keyof ProjectContext; label: string; placeholder: string; rows?: number }> = [
    {
      key: 'purpose',
      label: 'Purpose',
      placeholder: 'What is this project for? What decisions does it support?',
      rows: 3,
    },
    {
      key: 'persona',
      label: 'Audience',
      placeholder: 'Who uses this project? Describe their role and what they care about.',
      rows: 3,
    },
    {
      key: 'sampleQuestions',
      label: 'Sample questions',
      placeholder: 'Key questions this model is designed to answer.\n\nExamples:\n— What was ARR last quarter?\n— Which regions are underperforming?\n— Show me churn by segment.',
      rows: 5,
    },
    {
      key: 'businessLogic',
      label: 'Business logic',
      placeholder: 'Domain definitions, KPI formulas, exclusion rules, date conventions.\n\nUse @table or @column to reference data.',
      rows: 5,
    },
    {
      key: 'spotterInstructions',
      label: 'Spotter instructions',
      placeholder: "How should Spotter interpret this data?\n\ne.g. If the user asks for 'latest', consider last week. If they ask 'top', consider first 100 by ARR.",
      rows: 4,
    },
  ];

  const handleClose = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={handleClose}
    >
      <div
        style={{ backgroundColor: c['background-base'], borderRadius: 12, width: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <span style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Memory</span>
            <p style={{ margin: `${sp.A}px 0 0`, fontSize: fs.xs, color: c['content-secondary'] }}>
              Project context for this model. Updated by the agent and by you.
            </p>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c['content-secondary'], lineHeight: 1, padding: 0, marginTop: 2 }}>×</button>
        </div>

        {/* Document body */}
        <div style={{ overflowY: 'auto', flexGrow: 1 }}>
          {sections.map(({ key, label, placeholder, rows }, i) => (
            <div
              key={key}
              style={{
                padding: `${sp.D}px ${sp.F}px`,
                borderBottom: i < sections.length - 1 ? `1px solid ${c['border-divider']}` : 'none',
              }}
            >
              <p style={{ ...ts.overline, color: c['content-secondary'], margin: `0 0 ${sp.B}px` }}>{label}</p>
              <textarea
                value={draft[key]}
                onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                placeholder={placeholder}
                rows={rows ?? 4}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  resize: 'none',
                  fontSize: fs.sm,
                  color: c['content-primary'],
                  fontFamily: ff.primary,
                  lineHeight: '1.65',
                  boxSizing: 'border-box',
                  padding: 0,
                }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Saves when you close</span>
          <Button variant="primary" size="basic" onClick={handleClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
