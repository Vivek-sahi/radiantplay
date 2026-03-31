import React, { useState } from 'react';
import { c, sp } from '../styles';
import { ProjectState } from '../index';
import { tableMetadata, relationships, transformations, dataHealthSummary } from '../data/mockData';

interface LeftPanelProps {
  project: ProjectState;
  onAddData?: () => void;
}

const FULL_CONTEXT = `Goal: Analyze campaign performance vs orders by region and user segment.

Persona: Data analyst at an e-commerce company. Technical user comfortable with SQL and data modeling.

Instructions:
- Focus on campaign ROI by region
- Segment analysis by user tier (Premium/Standard/Basic)
- Date range: last 12 months
- Key metrics: conversion rate, revenue per campaign, order frequency`;

const LeftPanel: React.FC<LeftPanelProps> = ({ project, onAddData }) => {
  const [contextModalOpen, setContextModalOpen] = useState(false);
  const hasData = project.buildStep !== 'empty';
  const hasJoins = project.buildStep === 'joined' || project.buildStep === 'transformed' || project.buildStep === 'healthy';
  const hasTransforms = project.buildStep === 'transformed' || project.buildStep === 'healthy';
  const hasHealth = hasData;

  const contextText = project.contextHint ?? 'Goal, Persona and instructions';
  const truncated = contextText.length > 38 ? contextText.slice(0, 38) + '…' : contextText;

  return (
    <div style={{ width: 240, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

      {/* Context modal */}
      {contextModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setContextModalOpen(false)}
        >
          <div
            style={{ backgroundColor: c['background-base'], borderRadius: 10, width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: `${sp.D}px ${sp.D}px ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: c['content-primary'] }}>Context</span>
              <button onClick={() => setContextModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c['content-secondary'], lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: sp.D, overflowY: 'auto' }}>
              <pre style={{ margin: 0, fontSize: 13, color: c['content-primary'], lineHeight: 1.6, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{FULL_CONTEXT}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Context section */}
      <Section
        label="Context"
        action={<IconBtn title="Edit context">✏</IconBtn>}
        updated={hasData}
      >
        <p
          onClick={hasData ? () => setContextModalOpen(true) : undefined}
          style={{ fontSize: 12, color: hasData ? c['content-brand'] : c['content-secondary'], margin: 0, lineHeight: 1.5, cursor: hasData ? 'pointer' : 'default', wordBreak: 'break-word' }}
        >
          {truncated}
        </p>
      </Section>

      {/* Data section */}
      <Section
        label="Data"
        action={<IconBtn title="Add data" onClick={onAddData}>+</IconBtn>}
      >
        {!hasData ? (
          <div>
            <p style={{ fontSize: 12, color: c['content-secondary'], margin: `0 0 ${sp.C}px`, lineHeight: 1.5 }}>
              No data available in the project
            </p>
            <button
              onClick={onAddData}
              style={{ padding: `${sp.A}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], color: c['content-primary'], fontSize: 12, cursor: 'pointer' }}
            >
              Add Data
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>

            {/* Data Sources */}
            <SubSection label="Data Sources">
              {Object.values(tableMetadata).map(t => (
                <DataItem key={t.id} icon="⊞" label={t.name} />
              ))}
            </SubSection>

            {/* Relationships */}
            <SubSection label="Relationships">
              {hasJoins ? relationships.map(r => (
                <DataItem key={r.id} icon="⇄" label={r.name} />
              )) : (
                <p style={{ fontSize: 11, color: c['content-secondary'], margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>No relationships yet</p>
              )}
            </SubSection>

            {/* Transformations */}
            <SubSection label="Transformations">
              {hasTransforms ? transformations.map(t => (
                <DataItem key={t.id} icon="ƒx" label={t.name} mono />
              )) : (
                <p style={{ fontSize: 11, color: c['content-secondary'], margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>No calculated fields yet</p>
              )}
            </SubSection>
          </div>
        )}
      </Section>

      {/* Data Health section */}
      <Section
        label="Data Health"
        action={<IconBtn title="Health settings">⚙</IconBtn>}
      >
        {!hasHealth ? (
          <div>
            <p style={{ fontSize: 12, color: c['content-secondary'], margin: `0 0 ${sp.C}px`, lineHeight: 1.5 }}>
              Data health is available only when data is present in the project
            </p>
            <button
              disabled
              style={{ padding: `${sp.A}px ${sp.C}px`, border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-subtle'], color: c['content-secondary'], fontSize: 12, cursor: 'not-allowed', opacity: 0.5 }}
            >
              Check data health
            </button>
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
  children: React.ReactNode;
}> = ({ label, action, updated, children }) => (
  <div style={{ padding: sp.D, borderBottom: `1px solid ${c['border-divider']}` }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.B }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: c['content-primary'] }}>{label}</span>
        {updated && (
          <span style={{ fontSize: 10, backgroundColor: '#EEF4FF', color: '#4A90E2', padding: '1px 5px', borderRadius: 4, fontWeight: 500 }}>Updated</span>
        )}
      </div>
      {action}
    </div>
    {children}
  </div>
);

const SubSection: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p style={{ fontSize: 11, fontWeight: 500, color: c['content-secondary'], margin: `0 0 ${sp.A}px`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {children}
    </div>
  </div>
);

const DataItem: React.FC<{ icon: string; label: string; mono?: boolean }> = ({ icon, label, mono }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.A}px ${sp.B}px`, borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    <span style={{ fontSize: 12, color: c['content-secondary'], width: 14, textAlign: 'center', flexShrink: 0, fontFamily: mono ? 'monospace' : 'inherit' }}>{icon}</span>
    <span style={{ color: c['content-primary'], fontSize: 12 }}>{label}</span>
  </div>
);

const IconBtn: React.FC<{ title: string; onClick?: () => void; children: React.ReactNode }> = ({ title, onClick, children }) => (
  <button
    title={title}
    onClick={onClick}
    style={{ background: 'none', border: 'none', cursor: 'pointer', color: c['content-secondary'], fontSize: 14, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, padding: 0 }}
    onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
  >
    {children}
  </button>
);

// Health gauge widget
const HealthWidget: React.FC<{ step: ProjectState['buildStep'] }> = ({ step }) => {
  const score = step === 'healthy' ? 82 : dataHealthSummary.overallScore;
  const rating = step === 'healthy' ? 'Good' : dataHealthSummary.rating;
  const color = rating === 'Good' ? '#22C55E' : rating === 'Poor' ? '#EF4444' : '#F59E0B';

  return (
    <div>
      {/* Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: sp.C }}>
        <GaugeSVG score={score} color={color} />
        <p style={{ margin: `${sp.A}px 0 0`, fontSize: 13, color: c['content-primary'] }}>
          Data health is <strong>{rating}</strong>
        </p>
      </div>

      {/* Top issues */}
      {step !== 'healthy' && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 500, color: c['content-secondary'], margin: `0 0 ${sp.B}px`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Top issues</p>
          {dataHealthSummary.topIssues.map(issue => (
            <div key={issue.type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: `2px 0`, color: c['content-primary'] }}>
              <span style={{ color: c['content-secondary'] }}>{issue.type}</span>
              <span style={{ color: '#EF4444', fontWeight: 500 }}>{issue.table} ({issue.percentage}%)</span>
            </div>
          ))}
        </div>
      )}

      {step === 'healthy' && (
        <div style={{ padding: `${sp.B}px ${sp.C}px`, backgroundColor: '#F0FDF4', borderRadius: 6, fontSize: 12, color: '#15803D', lineHeight: 1.4 }}>
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
      <path d="M 15 60 A 45 45 0 0 1 105 60" stroke="#E8EDF2" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Red zone */}
      <path d="M 15 60 A 45 45 0 0 1 37 22" stroke="#EF4444" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Yellow zone */}
      <path d="M 37 22 A 45 45 0 0 1 83 22" stroke="#F59E0B" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Green zone */}
      <path d="M 83 22 A 45 45 0 0 1 105 60" stroke="#22C55E" strokeWidth="10" fill="none" strokeLinecap="round" />
      {/* Needle */}
      <line x1="60" y1="60" x2={nx} y2={ny} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="60" cy="60" r="4" fill={color} />
    </svg>
  );
};

export default LeftPanel;
