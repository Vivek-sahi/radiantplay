import React, { useState, useEffect, useRef } from 'react';
import { c, sp, ff, fs, fw } from '../styles';

// ── InlineField ───────────────────────────────────────────────────────────────

const InlineField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  mono?: boolean;
  placeholder?: string;
  wasEdited?: boolean;
}> = ({ value, onChange, multiline = false, mono = false, placeholder = 'Edit…', wasEdited = false }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const [hovered, setHovered] = useState(false);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  const commit = () => { onChange(draft.trim() || value); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  const base: React.CSSProperties = {
    fontFamily: mono ? 'monospace' : ff.primary,
    fontSize: fs.sm, lineHeight: '20px', color: c['content-primary'],
  };

  if (editing) return multiline ? (
    <textarea autoFocus value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={commit} onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
      rows={Math.max(2, draft.split('\n').length)}
      style={{ ...base, width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' as const,
        border: `1.5px solid ${c['content-brand']}`, borderRadius: 4,
        padding: '3px 6px', outline: 'none', backgroundColor: c['background-base'], display: 'block' }}
    />
  ) : (
    <input autoFocus value={draft} onChange={e => setDraft(e.target.value)}
      onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
      style={{ ...base, width: '100%', boxSizing: 'border-box' as const,
        border: `1.5px solid ${c['content-brand']}`, borderRadius: 4,
        padding: '2px 6px', outline: 'none', backgroundColor: c['background-base'], display: 'block' }}
    />
  );

  return (
    <span title="Click to edit" onClick={() => setEditing(true)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...base, cursor: 'text', display: 'block', borderRadius: 4,
        padding: '1px 6px 1px 8px',
        borderLeft: wasEdited ? `2px solid ${c['content-brand']}` : '2px solid transparent',
        backgroundColor: hovered ? c['background-subtle'] : 'transparent',
        transition: 'background-color 0.1s',
        whiteSpace: multiline ? 'pre-wrap' as const : undefined,
      }}
    >
      {value || <span style={{ color: c['content-secondary'], fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
};

// ── Tag ───────────────────────────────────────────────────────────────────────

const Tag: React.FC<{ label: string }> = ({ label }) => (
  <span style={{
    display: 'inline-block', fontSize: 12, padding: '2px 8px', borderRadius: 4,
    backgroundColor: c['background-subtle'], color: c['content-secondary'],
    border: `1px solid ${c['border-default']}`, lineHeight: '16px', whiteSpace: 'nowrap' as const,
  }}>{label}</span>
);

// ── SectionLabel ──────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: fw.semibold, textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', color: c['content-secondary'],
    paddingBottom: sp.B, marginBottom: sp.B, marginTop: sp.E,
    borderBottom: `1px solid ${c['border-divider']}`,
  }}>{children}</div>
);

// ── MRD data ──────────────────────────────────────────────────────────────────

interface CalcField { name: string; formula: string; }
interface MRDData {
  modelName: string;
  intent: string;
  entities: string[];
  measures: string[];
  dimensions: string[];
  relationships: string[];
  calculatedFields: CalcField[];
  outOfScope: string;
}

const makeMRD = (prompt: string): MRDData => {
  const lower = prompt.toLowerCase();
  const isCampaign = lower.includes('campaign') || lower.includes('marketing') || lower.includes('roi') || lower.includes('channel');
  if (isCampaign) return {
    modelName: 'Campaign Performance Analytics',
    intent: 'Analyze marketing campaign performance across channels and geographic regions to identify top-performing campaigns and optimize spend allocation.',
    entities: ['Campaign', 'Channel', 'Region'],
    measures: ['Total spend', 'Revenue', 'ROI', 'ROAS', 'Impressions', 'Conversions'],
    dimensions: ['Channel', 'Region', 'Date', 'Campaign status'],
    relationships: [
      'Campaign → Channel  (many-to-one)',
      'Campaign → Region   (many-to-one)',
    ],
    calculatedFields: [
      { name: 'ROI',             formula: '(Revenue − Spend) / Spend × 100' },
      { name: 'ROAS',            formula: 'Revenue / Spend' },
      { name: 'Conversion rate', formula: 'Conversions / Impressions × 100' },
    ],
    outOfScope: 'Individual user tracking, A/B test results, attribution modelling',
  };
  return {
    modelName: 'Analytics Model',
    intent: prompt,
    entities: ['Primary entity', 'Dimension entity'],
    measures: ['Count', 'Total'],
    dimensions: ['Date', 'Category'],
    relationships: ['Primary entity → Dimension (many-to-one)'],
    calculatedFields: [{ name: 'Metric', formula: 'SUM(value)' }],
    outOfScope: 'Historical data beyond 2 years',
  };
};

// ── Generation steps ──────────────────────────────────────────────────────────

type StepStatus = 'pending' | 'active' | 'done' | 'paused';

const GEN_STEPS = [
  { id: 'scan',         label: 'Scanning connection',               detail: 'Connected to Snowflake_Sales_Prod' },
  { id: 'match-entity', label: 'Matching "Campaign" entity',         detail: 'Found: campaigns table (14 cols)' },
  { id: 'match-region', label: 'Matching "Region" entity' },
  { id: 'build',        label: 'Building table structure',           detail: 'campaigns + orders, 2 tables' },
  { id: 'joins',        label: 'Configuring joins',                  detail: 'campaigns.campaign_id → orders.campaign_id' },
  { id: 'descriptions', label: 'Adding descriptions',               detail: 'AI-written for all 11 columns' },
];

// ── Live model cards ──────────────────────────────────────────────────────────

const LIVE_MODEL = [
  {
    name: 'campaigns', type: 'fact' as const,
    cols: [
      { name: 'campaign_id',   type: 'STRING',  desc: 'Unique campaign identifier' },
      { name: 'campaign_name', type: 'STRING',  desc: 'Display name of the campaign' },
      { name: 'channel',       type: 'STRING',  desc: 'Marketing channel (email, paid, organic)' },
      { name: 'target_region', type: 'STRING',  desc: 'Geographic target region' },
      { name: 'spend',         type: 'DECIMAL', desc: 'Total spend in USD' },
      { name: 'impressions',   type: 'INTEGER', desc: 'Total impressions served' },
    ],
  },
  {
    name: 'orders', type: 'fact' as const,
    cols: [
      { name: 'order_id',    type: 'STRING',  desc: 'Unique order identifier' },
      { name: 'campaign_id', type: 'STRING',  desc: 'FK → campaigns.campaign_id' },
      { name: 'order_date',  type: 'DATE',    desc: 'Date the order was placed' },
      { name: 'amount',      type: 'DECIMAL', desc: 'Order revenue in USD' },
      { name: 'region',      type: 'STRING',  desc: 'Region where order originated' },
    ],
  },
];

// ── Pause options ─────────────────────────────────────────────────────────────

const PAUSE_OPTIONS = [
  { label: 'orders.region',            desc: 'Region where the order was placed' },
  { label: 'campaigns.target_region',  desc: 'Geographic target of the campaign' },
  { label: 'Use both',                 desc: 'Include both as separate dimensions' },
];

// ── Main component ────────────────────────────────────────────────────────────

export interface MRDReviewProps {
  prompt: string;
  onApprove: () => void;
  onBack: () => void;
}

const MRDReview: React.FC<MRDReviewProps> = ({ prompt, onApprove, onBack }) => {
  const [phase, setPhase]   = useState<'review' | 'generating' | 'notified'>('review');
  const [promptOpen, setPromptOpen] = useState(false);
  const [mrd, setMrd]       = useState<MRDData>(() => makeMRD(prompt));
  const original            = useRef<MRDData>(makeMRD(prompt));
  const hasEdits            = JSON.stringify(mrd) !== JSON.stringify(original.current);

  // generation state
  const [steps, setSteps]           = useState<Record<string, StepStatus>>({});
  const [pauseAnswer, setPauseAnswer] = useState<string | null>(null);
  const [revealedCards, setRevealedCards] = useState(0);
  const [revealedCols, setRevealedCols]   = useState([0, 0]);
  const [showDescs, setShowDescs]   = useState(false);
  const [showRelLine, setShowRelLine] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const setStep = (id: string, s: StepStatus) =>
    setSteps(prev => ({ ...prev, [id]: s }));

  // Run post-pause sequence (shared between initial run-past-pause and resume)
  const runPostPause = () => {
    const T: ReturnType<typeof setTimeout>[] = [];
    timers.current = T;
    let t = 0;
    const after = (d: number, fn: () => void) => T.push(setTimeout(fn, t += d));

    after(300,  () => { setStep('match-region', 'done'); setStep('build', 'active'); setRevealedCards(1); });
    after(1200, () => { setRevealedCols([999, 0]); setRevealedCards(2); });
    after(600,  () => { setStep('build', 'done'); setStep('joins', 'active'); });
    after(1000, () => { setStep('joins', 'done'); setShowRelLine(true); setStep('descriptions', 'active'); });
    after(1200, () => { setStep('descriptions', 'done'); setShowDescs(true); setRevealedCols([999, 999]); });
    after(900,  () => onApprove());
  };

  // Start generation when phase switches
  useEffect(() => {
    if (phase !== 'generating') return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const T = timers.current;
    let t = 0;
    const after = (d: number, fn: () => void) => T.push(setTimeout(fn, t += d));

    after(400,  () => setStep('scan', 'active'));
    after(1000, () => { setStep('scan', 'done'); setStep('match-entity', 'active'); });
    after(900,  () => { setStep('match-entity', 'done'); setStep('match-region', 'active'); });
    after(1000, () => setStep('match-region', 'paused'));

    return () => T.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Resume when user answers the pause
  useEffect(() => {
    if (!pauseAnswer || steps['match-region'] !== 'paused') return;
    timers.current.forEach(clearTimeout);
    runPostPause();
    return () => timers.current.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pauseAnswer]);

  // ── Review phase ────────────────────────────────────────────────────────────

  if (phase === 'review') {
    return (
      <div style={{ height: '100%', backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', fontFamily: ff.primary }}>
        <style>{`
          @keyframes mrd-in  { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
          @keyframes mrd-row { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }
        `}</style>

        {/* Header */}
        <div style={{ padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary, padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
            onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}>
            ← Back to prompt
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.A + 2, fontSize: fs.xs, color: c['content-brand'], fontWeight: fw.medium }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7" cy="7" r="5.5" /><path d="M5 7l1.5 1.5L9 5" />
            </svg>
            AI generated
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.H}px ${sp.D}px` }}>
          <div style={{ maxWidth: 720, margin: '0 auto', animation: 'mrd-in 0.25s ease-out' }}>

            <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginBottom: sp.C }}>
              Step 2 of 2 · Review requirements
            </div>

            {/* Original prompt */}
            <button onClick={() => setPromptOpen(p => !p)} style={{
              display: 'flex', alignItems: 'center', gap: sp.B,
              width: '100%', textAlign: 'left' as const,
              background: c['background-subtle'], border: `1px solid ${c['border-default']}`,
              borderRadius: 6, padding: `${sp.B}px ${sp.C}px`, cursor: 'pointer',
              fontFamily: ff.primary, fontSize: fs.xs, color: c['content-secondary'],
              marginBottom: sp.E,
            }}>
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                <path d="M10 7.5C10 8.3 9.4 9 8.8 9H3.5L2 11V3.2C2 2.5 2.6 2 3.2 2H8.8C9.4 2 10 2.5 10 3.2V7.5Z" />
              </svg>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: promptOpen ? 'normal' : 'nowrap' as const }}>
                {prompt || 'Analyze campaign performance by channel and region'}
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                style={{ transform: promptOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                <polyline points="2,3.5 5,6.5 8,3.5" />
              </svg>
            </button>

            {/* Model name */}
            <div style={{ marginBottom: sp.D }}>
              <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A + 2 }}>Model name</div>
              <InlineField value={mrd.modelName} onChange={v => setMrd(p => ({ ...p, modelName: v }))}
                wasEdited={mrd.modelName !== original.current.modelName} />
            </div>

            {/* Intent */}
            <div style={{ marginBottom: sp.D }}>
              <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A + 2 }}>Intent</div>
              <InlineField value={mrd.intent} onChange={v => setMrd(p => ({ ...p, intent: v }))}
                multiline wasEdited={mrd.intent !== original.current.intent}
                placeholder="Describe what this model is for…" />
            </div>

            <SectionLabel>Entities needed</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, marginBottom: sp.D }}>
              {mrd.entities.map((e, i) => (
                <div key={i} style={{ animation: `mrd-row 0.18s ease-out ${i * 60}ms both` }}><Tag label={e} /></div>
              ))}
            </div>

            <SectionLabel>Key measures</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, marginBottom: sp.D }}>
              {mrd.measures.map((m, i) => (
                <div key={i} style={{ animation: `mrd-row 0.18s ease-out ${i * 50}ms both` }}><Tag label={m} /></div>
              ))}
            </div>

            <SectionLabel>Dimensions</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: sp.B, marginBottom: sp.D }}>
              {mrd.dimensions.map((d, i) => (
                <div key={i} style={{ animation: `mrd-row 0.18s ease-out ${i * 50}ms both` }}><Tag label={d} /></div>
              ))}
            </div>

            <SectionLabel>Logical relationships</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B, marginBottom: sp.D }}>
              {mrd.relationships.map((r, i) => (
                <div key={i} style={{
                  fontSize: fs.xs, fontFamily: 'monospace', color: c['content-primary'],
                  padding: `${sp.B}px ${sp.C}px`, backgroundColor: c['background-subtle'],
                  borderRadius: 5, animation: `mrd-row 0.18s ease-out ${i * 60}ms both`,
                }}>{r}</div>
              ))}
            </div>

            <SectionLabel>Calculated fields</SectionLabel>
            <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 8, overflow: 'hidden', marginBottom: sp.D }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: sp.D, padding: `${sp.B}px ${sp.D}px`, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}` }}>
                {['Name', 'Formula'].map(h => <span key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'] }}>{h}</span>)}
              </div>
              {mrd.calculatedFields.map((f, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '130px 1fr', gap: sp.D,
                  padding: `${sp.C}px ${sp.D}px`,
                  borderBottom: i < mrd.calculatedFields.length - 1 ? `1px solid ${c['border-divider']}` : 'none',
                  animation: `mrd-row 0.18s ease-out ${i * 60}ms both`,
                }}>
                  <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{f.name}</span>
                  <InlineField value={f.formula} mono
                    onChange={v => setMrd(p => ({ ...p, calculatedFields: p.calculatedFields.map((cf, j) => j === i ? { ...cf, formula: v } : cf) }))}
                    wasEdited={f.formula !== original.current.calculatedFields[i]?.formula} />
                </div>
              ))}
            </div>

            <SectionLabel>Out of scope</SectionLabel>
            <div style={{ marginBottom: sp.H }}>
              <InlineField value={mrd.outOfScope} onChange={v => setMrd(p => ({ ...p, outOfScope: v }))}
                multiline wasEdited={mrd.outOfScope !== original.current.outOfScope}
                placeholder="What this model won't cover…" />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.E}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: sp.C, flexShrink: 0, backgroundColor: c['background-base'] }}>
          {hasEdits && (
            <div style={{ flex: 1, fontSize: fs.xs, color: c['content-secondary'] }}>
              You've edited the requirements — approving your version.
            </div>
          )}
          {!hasEdits && <div style={{ flex: 1 }} />}
          <button onClick={() => setPhase('generating')} style={{
            height: 34, padding: `0 ${sp.D}px`, border: 'none', borderRadius: 6,
            backgroundColor: c['content-brand'], color: 'white',
            fontSize: fs.sm, fontWeight: fw.semibold, fontFamily: ff.primary, cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {hasEdits ? 'Approve edited version & Generate →' : 'Approve & Generate →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Notified state ──────────────────────────────────────────────────────────

  if (phase === 'notified') {
    return (
      <div style={{ height: '100%', backgroundColor: c['background-base'], display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.primary }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 18, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.B }}>
            Building in the background
          </div>
          <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.6, marginBottom: sp.E }}>
            We'll notify you when your model is ready. It usually takes 3–4 minutes.
          </div>
          <button onClick={onBack} style={{
            background: 'none', border: `1px solid ${c['border-default']}`, borderRadius: 6,
            padding: `${sp.B}px ${sp.D}px`, cursor: 'pointer',
            fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = c['content-brand']; e.currentTarget.style.color = c['content-brand']; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-default']; e.currentTarget.style.color = c['content-secondary']; }}
          >
            ← Back to overview
          </button>
        </div>
      </div>
    );
  }

  // ── Generating phase ────────────────────────────────────────────────────────

  const isPaused = steps['match-region'] === 'paused' && !pauseAnswer;

  return (
    <div style={{ height: '100%', backgroundColor: c['background-base'], display: 'flex', flexDirection: 'column', fontFamily: ff.primary }}>
      <style>{`
        @keyframes mrd-spin    { from { transform:rotate(0deg); }   to { transform:rotate(360deg); } }
        @keyframes mrd-card-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes mrd-col-in  { from { opacity:0; }               to { opacity:1; } }
      `}</style>

      {/* Generating header */}
      <div style={{ padding: `${sp.C}px ${sp.E}px`, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: sp.C }}>
        {isPaused ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="7" cy="7" r="5.5" /><line x1="7" y1="4" x2="7" y2="7.5" /><circle cx="7" cy="10" r="0.7" fill="#F59E0B" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c['content-brand']} strokeWidth="1.6" strokeLinecap="round"
            style={{ animation: 'mrd-spin 0.9s linear infinite', flexShrink: 0 }}>
            <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4" />
          </svg>
        )}
        <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>
          {isPaused ? 'Needs your input to continue' : 'Building your model…'}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{mrd.modelName}</span>
      </div>

      {/* Split pane */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Left — step list */}
        <div style={{ width: 340, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, overflowY: 'auto', padding: `${sp.E}px ${sp.D}px`, display: 'flex', flexDirection: 'column' }}>
          {GEN_STEPS.map(step => {
            const s = steps[step.id] ?? 'pending';
            return (
              <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', gap: sp.C, marginBottom: sp.D }}>
                {/* Status icon */}
                <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                  {s === 'done' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={c['content-brand']} strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="8" cy="8" r="6.5" /><path d="M5.5 8l2 2 3-3" />
                    </svg>
                  )}
                  {s === 'active' && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c['content-brand']} strokeWidth="1.6" strokeLinecap="round"
                      style={{ animation: 'mrd-spin 0.9s linear infinite' }}>
                      <path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4" />
                    </svg>
                  )}
                  {s === 'paused' && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#F59E0B" strokeWidth="1.6" strokeLinecap="round">
                      <circle cx="8" cy="8" r="6.5" /><line x1="8" y1="5" x2="8" y2="9.5" /><circle cx="8" cy="11.5" r="0.7" fill="#F59E0B" />
                    </svg>
                  )}
                  {s === 'pending' && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c['border-default'] }} />
                  )}
                </div>

                {/* Step content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: fs.sm, lineHeight: '20px',
                    fontWeight: (s === 'active' || s === 'paused') ? fw.semibold : fw.regular,
                    color: s === 'pending' ? c['content-secondary'] : c['content-primary'],
                  }}>{step.label}</div>

                  {s === 'done' && step.detail && (
                    <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2, animation: 'mrd-col-in 0.2s ease-out' }}>
                      {step.detail}
                    </div>
                  )}

                  {/* Pause: clarifying question */}
                  {s === 'paused' && !pauseAnswer && (
                    <div style={{ marginTop: sp.C, padding: sp.C, backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, animation: 'mrd-card-in 0.2s ease-out' }}>
                      <div style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: '#92400E', marginBottom: sp.C, lineHeight: '18px' }}>
                        I found 2 candidates for "Region" — which should I use for the regional breakdown?
                      </div>
                      {PAUSE_OPTIONS.map(opt => (
                        <button key={opt.label} onClick={() => setPauseAnswer(opt.label)} style={{
                          display: 'block', width: '100%', textAlign: 'left' as const,
                          padding: `${sp.B}px ${sp.C}px`, marginBottom: sp.A + 2,
                          border: '1px solid #FCD34D', borderRadius: 6,
                          backgroundColor: 'white', cursor: 'pointer', fontFamily: ff.primary,
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.backgroundColor = '#FEF3C7'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#FCD34D'; e.currentTarget.style.backgroundColor = 'white'; }}
                        >
                          <div style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: '#78350F' }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: '#92400E', marginTop: 2 }}>{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {s === 'paused' && pauseAnswer && (
                    <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>
                      Using: {pauseAnswer}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Notify me */}
          {!isPaused && (
            <button onClick={() => setPhase('notified')} style={{
              background: 'none', border: 'none', padding: `${sp.B}px 0 0`,
              cursor: 'pointer', textAlign: 'left' as const,
              fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary,
              textDecoration: 'underline',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = c['content-primary']; }}
              onMouseLeave={e => { e.currentTarget.style.color = c['content-secondary']; }}
            >
              Notify me when done →
            </button>
          )}
        </div>

        {/* Right — live model */}
        <div style={{ flex: 1, overflowY: 'auto', padding: sp.E, backgroundColor: c['background-sunken'] }}>
          <div style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-secondary'], marginBottom: sp.D, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            {mrd.modelName}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.D, maxWidth: 640 }}>
            {LIVE_MODEL.map((card, ci) => {
              if (ci >= revealedCards) return null;
              const visCount = revealedCols[ci] ?? 0;
              const cols = visCount === 999 ? card.cols : card.cols.slice(0, visCount);
              const stillBuilding = visCount < card.cols.length && visCount !== 999;

              return (
                <div key={card.name} style={{
                  backgroundColor: c['background-base'], border: `1px solid ${c['border-divider']}`,
                  borderRadius: 8, overflow: 'hidden', animation: 'mrd-card-in 0.25s ease-out',
                }}>
                  <div style={{ padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: sp.B }}>
                    <span style={{ fontSize: 12, fontWeight: fw.semibold, color: c['content-primary'], textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{card.name}</span>
                    <span style={{
                      fontSize: 11, padding: '1px 6px', borderRadius: 3, fontWeight: fw.semibold,
                      backgroundColor: card.type === 'fact' ? '#EEF4FF' : '#ECFDF5',
                      color: card.type === 'fact' ? '#2563EB' : '#059669',
                    }}>{card.type}</span>
                  </div>

                  {cols.map((col, colIdx) => (
                    <div key={col.name} style={{
                      display: 'grid', gridTemplateColumns: '150px 70px 1fr', gap: sp.C,
                      padding: `${sp.B + 1}px ${sp.D}px`,
                      borderBottom: colIdx < cols.length - 1 ? `1px solid ${c['border-divider']}` : 'none',
                      animation: 'mrd-col-in 0.15s ease-out',
                    }}>
                      <span style={{ fontSize: fs.xs, fontFamily: 'monospace', color: c['content-primary'] }}>{col.name}</span>
                      <span style={{ fontSize: 11, color: c['content-secondary'] }}>{col.type}</span>
                      {showDescs
                        ? <span style={{ fontSize: 11, color: c['content-secondary'], animation: 'mrd-col-in 0.3s ease-out' }}>{col.desc}</span>
                        : <span />
                      }
                    </div>
                  ))}

                  {stillBuilding && (
                    <div style={{ padding: `${sp.B}px ${sp.D}px`, display: 'flex', alignItems: 'center', gap: sp.B }}>
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke={c['content-brand']} strokeWidth="1.6" strokeLinecap="round"
                        style={{ animation: 'mrd-spin 0.9s linear infinite' }}>
                        <path d="M7 1v2M7 11v2M1 7h2M11 7h2" />
                      </svg>
                      <span style={{ fontSize: 11, color: c['content-secondary'] }}>Adding columns…</span>
                    </div>
                  )}
                </div>
              );
            })}

            {showRelLine && (
              <div style={{ animation: 'mrd-card-in 0.2s ease-out', display: 'flex', alignItems: 'center', gap: sp.B, padding: `${sp.A}px 0` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c['content-brand'], flexShrink: 0 }} />
                <div style={{ flex: 1, height: 1, backgroundColor: c['border-default'] }} />
                <span style={{ fontSize: 11, color: c['content-secondary'], whiteSpace: 'nowrap' as const }}>
                  campaigns.campaign_id → orders.campaign_id
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: c['border-default'] }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c['content-brand'], flexShrink: 0 }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MRDReview;
