import React, { useState } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { PlanData, PlanColumn } from './AgentPanel';

interface PlanPanelProps {
  plan: PlanData;
  onClose: () => void;
}

type SectionKey = 'goal' | 'tables' | 'relationships' | 'columns' | 'formulas' | 'questions';

const PlanPanel: React.FC<PlanPanelProps> = ({ plan, onClose }) => {
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    goal: false, tables: false, relationships: false, columns: false, formulas: false, questions: false,
  });

  const toggleSection = (key: SectionKey) =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const baseColumns  = plan.columns.filter(col => col.type !== 'formula');
  const formulaCols  = plan.columns.filter(col => col.type === 'formula');

  // Group base columns by table
  const columnsByTable = baseColumns.reduce<Record<string, PlanColumn[]>>((acc, col) => {
    if (!acc[col.table]) acc[col.table] = [];
    acc[col.table].push(col);
    return acc;
  }, {});

  const typeColor = (type: PlanColumn['type']) =>
    type === 'metric' ? '#1AA251' : c['content-secondary'];

  const typeLabel = (type: PlanColumn['type']) =>
    type === 'metric' ? 'Metric' : 'Dimension';

  return (
    <>
    <style>{`@keyframes ds-slide-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    <div style={{
      flex: 1,
      borderLeft: `1px solid ${c['border-divider']}`,
      backgroundColor: c['background-base'],
      display: 'flex',
      flexDirection: 'column',
      padding: 12,
      overflow: 'hidden',
      fontFamily: ff.primary,
      animation: 'ds-slide-in 0.2s ease-out',
    }}>

      {/* Inner document card */}
      <div style={{
        flex: 1,
        backgroundColor: c['background-base'],
        border: `1px solid ${c['border-default']}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

      {/* Header */}
      <div style={{
        height: 40,
        borderBottom: `1px solid ${c['border-divider']}`,
        padding: `0 ${sp.D}px`,
        display: 'flex',
        alignItems: 'center',
        gap: sp.C,
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: sp.B }}>
          <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{plan.modelName}</span>
          <span style={{ fontSize: 11, fontWeight: fw.medium, padding: '2px 7px', borderRadius: 4, backgroundColor: c['background-subtle'], color: c['content-secondary'] }}>
            v{plan.version}
          </span>
        </div>
        <button
          title="Download plan"
          style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: c['content-secondary'], padding: 0, flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v8"/><polyline points="5,7 8,10 11,7"/><path d="M3 13h10"/>
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

      {/* Sections — scrollable, starts directly with Goal */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.B}px 0` }}>

        <Section label="Goal" collapsed={collapsed.goal} onToggle={() => toggleSection('goal')}>
          <p style={{ margin: 0, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px', padding: `0 ${sp.D}px ${sp.D}px` }}>
            {plan.goal}
          </p>
        </Section>

        <Section label={`Tables (${plan.tables.length})`} collapsed={collapsed.tables} onToggle={() => toggleSection('tables')}>
          <div style={{ padding: `0 ${sp.D}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.C }}>
            {plan.tables.map(table => (
              <div key={table.name} style={{ borderRadius: 7, border: `1px solid ${c['border-divider']}`, padding: `${sp.B}px ${sp.C}px` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: 'monospace' }}>
                    {table.schema}.{table.name}
                  </span>
                  {table.rowCount && (
                    <span style={{ fontSize: 11, color: c['content-secondary'] }}>{table.rowCount}</span>
                  )}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: 4, flexWrap: 'wrap' }}>
                  <code style={{ fontSize: 11, color: c['content-primary'], backgroundColor: c['background-subtle'], padding: '1px 5px', borderRadius: 3 }}>{rel.fromTable}</code>
                  <span style={{ fontSize: 11, color: c['content-secondary'] }}>→</span>
                  <code style={{ fontSize: 11, color: c['content-primary'], backgroundColor: c['background-subtle'], padding: '1px 5px', borderRadius: 3 }}>{rel.toTable}</code>
                  <span style={{ fontSize: 11, fontWeight: fw.medium, color: '#1AA251', marginLeft: 'auto' }}>{rel.joinType}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: c['content-secondary'] }}>on</span>
                  <code style={{ fontSize: 11, color: c['content-primary'] }}>{rel.fromKey} = {rel.toKey}</code>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: c['content-secondary'] }}>{rel.matchRate}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section label={`Columns (${baseColumns.length})`} collapsed={collapsed.columns} onToggle={() => toggleSection('columns')}>
          <div style={{ padding: `0 ${sp.D}px ${sp.D}px`, display: 'flex', flexDirection: 'column', gap: sp.D }}>
            {Object.entries(columnsByTable).map(([tableName, cols]) => (
              <div key={tableName}>
                <p style={{ margin: `0 0 ${sp.B}px`, fontSize: 10, fontWeight: fw.semibold, color: c['content-secondary'], textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {tableName}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {cols.map((col, ci) => (
                    <div key={col.name} style={{ display: 'flex', gap: sp.B, padding: `${sp.B}px 0`, borderBottom: ci < cols.length - 1 ? `1px solid ${c['border-divider']}` : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: 2 }}>
                          <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{col.name}</span>
                          <span style={{ fontSize: 10, color: typeColor(col.type) }}>{typeLabel(col.type)}</span>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: 3 }}>
                    <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{col.name}</span>
                    <span style={{ fontSize: 10, color: c['content-brand'] }}>Formula</span>
                  </div>
                  <p style={{ margin: `0 0 3px`, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '16px' }}>{col.description}</p>
                  {col.formula && (
                    <code style={{ display: 'block', fontSize: 10, color: c['content-brand'], lineHeight: '16px', fontFamily: 'monospace' }}>{col.formula}</code>
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

      </div>{/* end inner card */}
    </div>
    </>
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

export default PlanPanel;
