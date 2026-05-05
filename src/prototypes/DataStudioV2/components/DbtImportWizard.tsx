import React, { useState, useEffect } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Button } from '../../../components/Button';

// ── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = 1 | 2 | 3 | 4;

type ModelStatus = 'blocking' | 'advisory' | 'ready';

interface DbtModel {
  name:       string;
  status:     ModelStatus;
  issues:     number;
  issueLabel: string;
}

const DBT_MODELS: DbtModel[] = [
  { name: 'fct_revenue',        status: 'advisory', issues: 2, issueLabel: '2 advisory'                   },
  { name: 'fct_orders',         status: 'blocking', issues: 1, issueLabel: 'broken ref: customers.email'  },
  { name: 'dim_customers',      status: 'ready',    issues: 0, issueLabel: '—'                            },
  { name: 'dim_campaigns',      status: 'advisory', issues: 1, issueLabel: '1 advisory'                   },
  { name: 'fct_marketing_perf', status: 'advisory', issues: 3, issueLabel: '3 advisory'                   },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface DbtImportWizardProps {
  onClose:        () => void;
  onImportClose:  () => void;
  onReviewIssues: (modelName: string) => void;
  onPublishModel: (modelName: string) => void;
}

// ── Shared chrome ─────────────────────────────────────────────────────────────

const StepIndicator: React.FC<{ current: WizardStep; total: number }> = ({ current, total }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
    {Array.from({ length: total }, (_, i) => {
      const n = (i + 1) as WizardStep;
      const done    = n < current;
      const active  = n === current;
      return (
        <React.Fragment key={n}>
          <div style={{
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: done ? c['content-success'] : active ? c['content-brand'] : c['background-subtle'],
            border: `1px solid ${done ? c['content-success'] : active ? c['content-brand'] : c['border-default']}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: fw.semibold, fontFamily: ff.primary,
            color: done || active ? 'white' : c['content-tertiary'],
            flexShrink: 0, transition: 'all 0.2s',
          }}>
            {done ? '✓' : n}
          </div>
          {i < total - 1 && (
            <div style={{ flex: 1, height: 1, backgroundColor: done ? c['content-success'] : c['border-divider'], transition: 'background-color 0.3s' }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Step 1 — Connect ──────────────────────────────────────────────────────────

const Step1: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [token, setToken] = useState('');

  const fieldStyle: React.CSSProperties = {
    width: '100%', height: 34,
    border: `1px solid ${c['border-default']}`,
    borderRadius: 6, backgroundColor: c['background-base'],
    padding: `0 ${sp.C}px`, boxSizing: 'border-box',
    fontSize: fs.sm, fontFamily: ff.primary,
    color: c['content-primary'], outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: fs.xs, fontWeight: fw.medium,
    color: c['content-secondary'], fontFamily: ff.primary,
    marginBottom: sp.A + 1, display: 'block',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.E }}>
      {/* Warehouse */}
      <div>
        <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary, marginBottom: sp.C }}>
          Warehouse
        </div>
        <div style={{
          height: 34, border: `1px solid ${c['border-default']}`,
          borderRadius: 6, backgroundColor: c['background-subtle'],
          padding: `0 ${sp.C}px`, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
            <img src="/logos/snowflake.png" alt="" width={16} height={16} style={{ objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span style={{ fontSize: fs.sm, fontFamily: ff.primary, color: c['content-primary'] }}>snowflake-prod</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke={c['content-tertiary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary, marginTop: sp.A }}>
          Using your existing warehouse connection
        </div>
      </div>

      {/* dbt credentials */}
      <div>
        <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary, marginBottom: sp.C }}>
          dbt Cloud credentials
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
          <div>
            <label style={labelStyle}>dbt Cloud API token</label>
            <input
              type="password"
              placeholder="dbtc_••••••••••••••••"
              value={token}
              onChange={e => setToken(e.target.value)}
              style={fieldStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Service URL</label>
            <input
              type="text"
              defaultValue="https://cloud.getdbt.com"
              style={fieldStyle}
            />
          </div>
        </div>
      </div>

      <Button variant="primary" onClick={onNext} style={{ alignSelf: 'flex-end' }}>
        Test connection →
      </Button>
    </div>
  );
};

// ── Step 2 — Testing connection ───────────────────────────────────────────────

const CONNECT_STEPS = [
  'Connecting to dbt Cloud',
  'Reading manifest.json',
  'Resolving warehouse views',
];

const Step2: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    CONNECT_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setProgress(i + 1), (i + 1) * 600));
    });
    timers.push(setTimeout(onDone, CONNECT_STEPS.length * 600 + 400));
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
      {CONNECT_STEPS.map((label, i) => {
        const done    = i < progress;
        const active  = i === progress;
        return (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: sp.C,
            padding: `${sp.B + 2}px ${sp.D}px`,
            borderRadius: 8,
            backgroundColor: done ? c['background-success'] : active ? c['background-information'] : c['background-subtle'],
            transition: 'background-color 0.3s',
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 9, flexShrink: 0,
              backgroundColor: done ? c['content-success'] : active ? c['content-brand'] : c['background-sunken'],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: 'white', transition: 'all 0.2s',
            }}>
              {done ? '✓' : active ? '↻' : ''}
            </div>
            <span style={{
              fontSize: fs.sm, fontFamily: ff.primary,
              color: done ? c['content-success'] : active ? c['content-brand'] : c['content-tertiary'],
              transition: 'color 0.2s',
            }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── Step 3 — Select projects ──────────────────────────────────────────────────

const PROJECTS = [
  { id: 'analytics', label: 'analytics', models: 18, checked: true  },
  { id: 'marketing', label: 'marketing', models: 6,  checked: true  },
  { id: 'finance',   label: 'finance',   models: 24, checked: false },
];

const Step3: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(PROJECTS.map(p => [p.id, p.checked]))
  );

  const selectedCount  = Object.values(checked).filter(Boolean).length;
  const selectedModels = PROJECTS.filter(p => checked[p.id]).reduce((s, p) => s + p.models, 0);

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.D }}>
      <div style={{ fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary }}>
        We found 3 projects in your dbt Cloud account
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
        {PROJECTS.map(p => (
          <div
            key={p.id}
            onClick={() => toggle(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: sp.C,
              padding: `${sp.C}px ${sp.D}px`,
              border: `1px solid ${checked[p.id] ? c['content-brand'] : c['border-default']}`,
              borderRadius: 8, cursor: 'pointer',
              backgroundColor: checked[p.id] ? c['background-information'] : c['background-base'],
              transition: 'all 0.12s',
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: `1.5px solid ${checked[p.id] ? c['content-brand'] : c['border-default']}`,
              backgroundColor: checked[p.id] ? c['content-brand'] : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {checked[p.id] && <span style={{ fontSize: 10, color: 'white', lineHeight: 1 }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>
                {p.label}
              </span>
            </div>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary }}>
              {p.models} models
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={onNext} disabled={selectedCount === 0}>
          Import {selectedCount > 0 ? `${selectedCount} project${selectedCount > 1 ? 's' : ''} (${selectedModels} models)` : ''} →
        </Button>
      </div>
    </div>
  );
};

// ── Step 4 — Review ───────────────────────────────────────────────────────────

const TRANSLATE_STEPS = [
  'Translating 24 models to draft TS Models',
  'Running validation pass (chasm traps, joins, descriptions)',
];

const statusColor = (s: ModelStatus) =>
  s === 'blocking' ? c['content-danger'] : s === 'advisory' ? '#B45309' : c['content-success'];

const StatusDot: React.FC<{ status: ModelStatus }> = ({ status }) => (
  <span style={{ color: statusColor(status), fontSize: 12 }}>
    {status === 'advisory' ? '▲' : status === 'blocking' ? '●' : '●'}
  </span>
);

interface Step4Props {
  onImportClose:  () => void;
  onReviewIssues: (name: string) => void;
  onPublish:      (name: string) => void;
}

const Step4: React.FC<Step4Props> = ({ onImportClose, onReviewIssues, onPublish }) => {
  const [translating, setTranslating] = useState(true);
  const [progress, setProgress]       = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    TRANSLATE_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setProgress(i + 1), (i + 1) * 700));
    });
    timers.push(setTimeout(() => setTranslating(false), TRANSLATE_STEPS.length * 700 + 400));
    return () => timers.forEach(clearTimeout);
  }, []);

  if (translating) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
        {TRANSLATE_STEPS.map((label, i) => {
          const done   = i < progress;
          const active = i === progress;
          return (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: sp.C,
              padding: `${sp.B + 2}px ${sp.D}px`, borderRadius: 8,
              backgroundColor: done ? c['background-success'] : active ? c['background-information'] : c['background-subtle'],
              transition: 'background-color 0.3s',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 9, flexShrink: 0,
                backgroundColor: done ? c['content-success'] : active ? c['content-brand'] : c['background-sunken'],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: 'white', transition: 'all 0.2s',
              }}>
                {done ? '✓' : active ? '↻' : ''}
              </div>
              <span style={{
                fontSize: fs.sm, fontFamily: ff.primary,
                color: done ? c['content-success'] : active ? c['content-brand'] : c['content-tertiary'],
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.D }}>
      {/* Summary chips */}
      <div style={{ display: 'flex', gap: sp.B, flexWrap: 'wrap' }}>
        {[
          { label: '24 models',   color: c['content-secondary'],  bg: c['background-subtle'] },
          { label: '1 blocking',  color: c['content-danger'],     bg: '#FEE2E2' },
          { label: '14 advisory', color: '#B45309',               bg: '#FEF3C7' },
          { label: '9 ready',     color: c['content-success'],    bg: c['background-success'] },
        ].map(chip => (
          <span key={chip.label} style={{
            fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary,
            padding: `${sp.A}px ${sp.C}px`, borderRadius: 12,
            color: chip.color, backgroundColor: chip.bg,
          }}>
            {chip.label}
          </span>
        ))}
      </div>

      {/* Model table */}
      <div style={{
        border: `1px solid ${c['border-divider']}`,
        borderRadius: 8, overflow: 'hidden',
        backgroundColor: c['background-base'],
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.4fr auto',
          gap: sp.C, padding: `${sp.B}px ${sp.D}px`,
          backgroundColor: c['background-subtle'],
          borderBottom: `1px solid ${c['border-divider']}`,
        }}>
          {['Model', 'Status', 'Issues', ''].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], fontFamily: ff.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {DBT_MODELS.map((m, i) => (
          <div key={m.name} style={{
            display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.4fr auto',
            gap: sp.C, padding: `${sp.B + 1}px ${sp.D}px`,
            alignItems: 'center',
            borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
          }}>
            <code style={{ fontFamily: ff.mono, fontSize: fs.sm, color: c['content-brand'] }}>
              {m.name}
            </code>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
              <StatusDot status={m.status} />
              <span style={{ fontSize: fs.xs, color: statusColor(m.status), fontFamily: ff.primary, fontWeight: fw.medium, textTransform: 'capitalize' }}>
                {m.status}
              </span>
            </div>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'], fontFamily: ff.primary }}>
              {m.issueLabel}
            </span>
            <div style={{ display: 'flex', gap: sp.A, justifyContent: 'flex-end' }}>
              <button
                onClick={() => onReviewIssues(m.name)}
                style={{
                  padding: `${sp.A}px ${sp.B + 2}px`, borderRadius: 5,
                  border: `1px solid ${c['border-default']}`,
                  backgroundColor: 'transparent', cursor: 'pointer',
                  fontSize: 11, fontFamily: ff.primary, color: c['content-secondary'],
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Review issues
              </button>
              {m.status !== 'blocking' && (
                <button
                  onClick={() => onPublish(m.name)}
                  style={{
                    padding: `${sp.A}px ${sp.B + 2}px`, borderRadius: 5,
                    border: `1px solid ${c['border-default']}`,
                    backgroundColor: 'transparent', cursor: 'pointer',
                    fontSize: 11, fontFamily: ff.primary, color: c['content-secondary'],
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  Publish
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onImportClose}>Import & close</Button>
      </div>
    </div>
  );
};

// ── Wizard shell ──────────────────────────────────────────────────────────────

const STEP_TITLES: Record<WizardStep, string> = {
  1: 'Connect to dbt Cloud',
  2: 'Testing connection',
  3: 'Select projects',
  4: 'Review models',
};

const DbtImportWizard: React.FC<DbtImportWizardProps> = ({
  onClose, onImportClose, onReviewIssues, onPublishModel,
}) => {
  const [step, setStep] = useState<WizardStep>(1);

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: c['background-base'], borderRadius: 14, width: 560, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: sp.D }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.C }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, backgroundColor: '#FF694A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: fw.semibold, color: 'white', fontFamily: ff.primary, flexShrink: 0 }}>
                d
              </div>
              <span style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>
                Import dbt project
              </span>
            </div>
            <StepIndicator current={step} total={4} />
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 7, backgroundColor: c['background-subtle'], border: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c['content-secondary'] }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Step label */}
        <div style={{ padding: `${sp.C}px ${sp.F}px ${sp.B}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
          <div style={{ fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary, marginBottom: 2 }}>
            Step {step} of 4
          </div>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary }}>
            {STEP_TITLES[step]}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: `${sp.E}px ${sp.F}px`, overflowY: 'auto', flex: 1 }}>
          {step === 1 && <Step1 onNext={() => setStep(2)} />}
          {step === 2 && <Step2 onDone={() => setStep(3)} />}
          {step === 3 && <Step3 onNext={() => setStep(4)} />}
          {step === 4 && (
            <Step4
              onImportClose={onImportClose}
              onReviewIssues={onReviewIssues}
              onPublish={onPublishModel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DbtImportWizard;
