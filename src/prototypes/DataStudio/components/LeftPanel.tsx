import React, { useState } from 'react';
import { c, sp, ff, fs, fw, ts } from '../styles';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/icons';
import { ProjectState, ProjectContext } from '../index';
import { tableMetadata, relationships, transformations, dataHealthSummary } from '../data/mockData';
import DataBrowserModal from './DataBrowserModal';
import TableDetailModal from './TableDetailModal';
import DataHealthModal from './DataHealthModal';

interface LeftPanelProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ project, setProject }) => {
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const [dataBrowserOpen, setDataBrowserOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [healthModalOpen, setHealthModalOpen] = useState(false);

  const hasData = project.buildStep !== 'empty';
  const hasJoins = project.buildStep === 'joined' || project.buildStep === 'transformed' || project.buildStep === 'healthy';
  const hasTransforms = project.buildStep === 'transformed' || project.buildStep === 'healthy';

  const ctx = project.context;
  const hasContext = ctx.persona || ctx.sampleQuestions || ctx.businessLogic || ctx.spotterInstructions;
  const summaryText = hasContext
    ? (ctx.persona || ctx.sampleQuestions || ctx.businessLogic).slice(0, 42) + '…'
    : 'Goal, Persona and instructions';

  const openDataBrowser = () => setDataBrowserOpen(true);

  return (
    <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {contextModalOpen && (
        <ContextModal
          context={ctx}
          onSave={(updated: ProjectContext) => { setProject(p => ({ ...p, context: updated })); setContextModalOpen(false); }}
          onClose={() => setContextModalOpen(false)}
        />
      )}

      {dataBrowserOpen && (
        <DataBrowserModal
          onAdd={() => { setProject(p => ({ ...p, buildStep: p.buildStep === 'empty' ? 'tables' : p.buildStep })); setDataBrowserOpen(false); }}
          onClose={() => setDataBrowserOpen(false)}
        />
      )}

      {selectedTableId && (
        <TableDetailModal
          tableId={selectedTableId}
          buildStep={project.buildStep}
          onClose={() => setSelectedTableId(null)}
        />
      )}

      {healthModalOpen && (
        <DataHealthModal
          buildStep={project.buildStep}
          onClose={() => setHealthModalOpen(false)}
        />
      )}

      {/* Context section */}
      <Section
        label="Context"
        action={<IconBtn title="Edit context" icon="pencil" onClick={() => setContextModalOpen(true)} />}
        updated={!!hasContext}
      >
        <p
          onClick={() => setContextModalOpen(true)}
          style={{ fontSize: fs.xs, color: hasContext ? c['content-brand'] : c['content-secondary'], margin: 0, cursor: 'pointer', wordBreak: 'break-word' }}
        >
          {summaryText}
        </p>
      </Section>

      {/* Data section */}
      <Section
        label="Data"
        action={<IconBtn title="Add data" onClick={openDataBrowser} icon="plus" />}
      >
        {!hasData ? (
          <div>
            <p style={{ fontSize: fs.xs, color: c['content-secondary'], margin: `0 0 ${sp.C}px` }}>
              No data available in the project
            </p>
            <Button variant="secondary" size="small" onClick={openDataBrowser}>Add data</Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
            <SubSection label="Data Sources">
              {Object.values(tableMetadata).map(t => (
                <DataItem key={t.id} icon="⊞" label={t.name} onClick={() => setSelectedTableId(t.id)} />
              ))}
            </SubSection>
            <SubSection label="Relationships">
              {hasJoins ? relationships.map(r => (
                <DataItem key={r.id} icon="⇄" label={r.name} />
              )) : (
                <p style={{ fontSize: fs.xs, color: c['content-secondary'], margin: 0, fontStyle: 'italic' }}>No relationships yet</p>
              )}
            </SubSection>
            <SubSection label="Transformations">
              {hasTransforms ? transformations.map(t => (
                <DataItem key={t.id} icon="ƒx" label={t.name} mono />
              )) : (
                <p style={{ fontSize: fs.xs, color: c['content-secondary'], margin: 0, fontStyle: 'italic' }}>No calculated fields yet</p>
              )}
            </SubSection>
          </div>
        )}
      </Section>

      {/* Data Health section */}
      <Section
        label="Data Health"
        action={<IconBtn title="Health settings" icon="settings" onClick={() => hasData ? setHealthModalOpen(true) : undefined} />}
        onHeaderClick={hasData ? () => setHealthModalOpen(true) : undefined}
      >
        {!hasData ? (
          <div>
            <p style={{ fontSize: fs.xs, color: c['content-secondary'], margin: `0 0 ${sp.C}px` }}>
              Data health is available only when data is present in the project
            </p>
            <Button variant="secondary" size="small" disabled>Check data health</Button>
          </div>
        ) : (
          <HealthWidget step={project.buildStep} />
        )}
      </Section>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Section: React.FC<{
  label: string;
  action?: React.ReactNode;
  updated?: boolean;
  onHeaderClick?: () => void;
  children: React.ReactNode;
}> = ({ label, action, updated, onHeaderClick, children }) => (
  <div style={{ padding: sp.D, borderBottom: `1px solid ${c['border-divider']}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.B }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: sp.B, cursor: onHeaderClick ? 'pointer' : 'default' }}
        onClick={onHeaderClick}
      >
        <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>{label}</span>
        {updated && (
          <span style={{ fontSize: fs.xs, backgroundColor: c['background-information'], color: c['content-brand'], padding: '1px 5px', borderRadius: 4, fontWeight: fw.medium }}>Updated</span>
        )}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const SubSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p style={{ ...ts.overline, color: c['content-secondary'], margin: `0 0 ${sp.A}px` }}>{label}</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {children}
    </div>
  </div>
);

const DataItem: React.FC<{ icon: string; label: string; mono?: boolean; onClick?: () => void }> = ({ icon, label, mono, onClick }) => (
  <div
    style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.A}px ${sp.B}px`, borderRadius: 4, cursor: 'pointer', fontSize: fs.sm }}
    onClick={onClick}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <span style={{ fontSize: fs.xs, color: c['content-secondary'], width: 14, textAlign: 'center', flexShrink: 0, fontFamily: mono ? ff.mono : undefined }}>{icon}</span>
    <span style={{ color: c['content-primary'], fontSize: fs.xs }}>{label}</span>
  </div>
);

const IconBtn: React.FC<{ title: string; icon: 'pencil' | 'plus' | 'settings'; onClick?: () => void }> = ({ title, icon, onClick }) => (
  <Button variant="tertiary" size="small" title={title} onClick={onClick}>
    <Icon name={icon} size="s" color={c['content-secondary']} />
  </Button>
);

// Health gauge widget
const HealthWidget: React.FC<{ step: ProjectState['buildStep'] }> = ({ step }) => {
  const score = step === 'healthy' ? 82 : dataHealthSummary.overallScore;
  const rating = step === 'healthy' ? 'Good' : dataHealthSummary.rating;
  const color = rating === 'Good' ? c['content-success'] : rating === 'Poor' ? c['content-failure'] : c['content-warning'];

  return (
    <div>
      {/* Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: sp.C }}>
        <GaugeSVG score={score} color={color} />
        <p style={{ margin: `${sp.A}px 0 0`, fontSize: fs.sm, color: c['content-primary'] }}>
          Data health is <strong>{rating}</strong>
        </p>
      </div>

      {/* Top issues */}
      {step !== 'healthy' && (
        <div>
          <p style={{ ...ts.overline, color: c['content-secondary'], margin: `0 0 ${sp.B}px` }}>Top issues</p>
          {dataHealthSummary.topIssues.map(issue => (
            <div key={issue.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: fs.xs, padding: `2px 0`, color: c['content-primary'] }}>
              <span style={{ color: c['content-secondary'] }}>{issue.type}</span>
              <span style={{ color: c['content-failure'], fontWeight: fw.medium }}>{issue.table} ({issue.percentage}%)</span>
            </div>
          ))}
        </div>
      )}

      {step === 'healthy' && (
        <div style={{ padding: `${sp.B}px ${sp.C}px`, backgroundColor: c['background-success'], borderRadius: 6, fontSize: fs.xs, color: c['content-success'] }}>
          ✓ Model is AI-ready. All descriptions added, data cleaned.
        </div>
      )}
    </div>
  );
};

const GaugeSVG: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  // Arc spans from 180° (left) to 360°/0° (right) via 270° (top).
  // score=0 → 180° (left/red), score=50 → 270° (top), score=100 → 360° (right/green)
  const rad = ((180 + (score / 100) * 180) * Math.PI) / 180;
  const nx = 60 + 38 * Math.cos(rad);
  const ny = 60 + 38 * Math.sin(rad);

  return (
    <svg width="120" height="70" viewBox="0 0 120 70">
      {/* Track */}
      <path d="M 15 60 A 45 45 0 0 1 105 60" stroke={c['border-divider']} strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Red zone */}
      <path d="M 15 60 A 45 45 0 0 1 37 22" stroke={c['content-failure']} strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Yellow zone */}
      <path d="M 37 22 A 45 45 0 0 1 83 22" stroke={c['content-warning']} strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Green zone */}
      <path d="M 83 22 A 45 45 0 0 1 105 60" stroke={c['content-success']} strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Needle */}
      <line x1="60" y1="60" x2={nx} y2={ny} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="60" r="4" fill={color} />
    </svg>
  );
};

// ── Context modal ─────────────────────────────────────────────────────────────

const ContextModal: React.FC<{
  context: ProjectContext;
  onSave: (updated: ProjectContext) => void;
  onClose: () => void;
}> = ({ context, onSave, onClose }) => {
  const [draft, setDraft] = useState<ProjectContext>({ ...context });

  const fields: Array<{ key: keyof ProjectContext; placeholder: string; hint?: string }> = [
    { key: 'persona',             placeholder: 'Who is the user for this project?' },
    { key: 'sampleQuestions',     placeholder: 'What are some of the questions that users will be interested in?' },
    { key: 'businessLogic',       placeholder: 'Any business level logic about tables or columns that you want to provide for this project?', hint: "Use '@' to refer table or column …" },
    { key: 'spotterInstructions', placeholder: 'Any specific instructions for Spotter on how to interpret this data to better answer user questions?', hint: 'e.g. if user asks for "latest", consider last week. if user asks "top", consider first 100 by ARR' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: c['background-base'], borderRadius: 12, width: 680, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'], fontSize: fs.md }}>Context</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c['content-secondary'], lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {/* Fields */}
        <div style={{ overflowY: 'auto', padding: `${sp.C}px ${sp.F}px`, display: 'flex', flexDirection: 'column', gap: sp.C }}>
          {fields.map(({ key, placeholder, hint }) => (
            <div key={key} style={{ backgroundColor: c['background-subtle'], borderRadius: 8, padding: `${sp.C}px ${sp.D}px` }}>
              <textarea
                value={draft[key]}
                onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                placeholder={hint ? `${placeholder}\n${hint}` : placeholder}
                rows={4}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', resize: 'none', fontSize: fs.sm, color: c['content-primary'], fontFamily: ff.primary, lineHeight: '1.5', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', justifyContent: 'flex-end', gap: sp.B, flexShrink: 0 }}>
          <Button variant="secondary" size="basic" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="basic" onClick={() => onSave(draft)}>Update</Button>
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;
