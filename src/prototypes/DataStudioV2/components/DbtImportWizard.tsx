import React, { useState, useEffect } from 'react';
import { WizardModal, WizardStep } from '../../../components/WizardModal';
import { c, sp, fs, fw, ff } from '../styles';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModelStatus = 'blocking' | 'advisory' | 'ready';

interface DbtModel {
  name:       string;
  status:     ModelStatus;
  issueLabel: string;
}

const DBT_MODELS: DbtModel[] = [
  { name: 'fct_revenue',   status: 'advisory', issueLabel: '2 issues' },
  { name: 'dim_customers', status: 'ready',    issueLabel: '—'        },
  { name: 'dim_campaigns', status: 'advisory', issueLabel: '1 issue'  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface DbtImportWizardProps {
  onClose:        () => void;
  onImportClose:  () => void;
  onReviewIssues: (modelName: string) => void;
  onPublishModel: (modelName: string) => void;
}

// ── Step 1 — Connect ──────────────────────────────────────────────────────────

const Step1Content: React.FC = () => {
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
            <input type="text" defaultValue="https://cloud.getdbt.com" style={fieldStyle} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Step 2 — Testing connection ───────────────────────────────────────────────

const CONNECT_STEPS = [
  'Connecting to dbt Cloud',
  'Reading manifest.json',
  'Resolving warehouse views',
];

const Step2Content: React.FC<{ onAutoAdvance: () => void }> = ({ onAutoAdvance }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    CONNECT_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setProgress(i + 1), (i + 1) * 600));
    });
    timers.push(setTimeout(onAutoAdvance, CONNECT_STEPS.length * 600 + 400));
    return () => timers.forEach(clearTimeout);
  // onAutoAdvance is stable (from parent closure) — empty dep list is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
      {CONNECT_STEPS.map((label, i) => {
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
  { id: 'finance',   label: 'finance',   models: 24, checked: false },
];

const Step3Content: React.FC = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(PROJECTS.map(p => [p.id, p.checked]))
  );
  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: sp.D }}>
      <div style={{ fontSize: fs.sm, color: c['content-secondary'], fontFamily: ff.primary }}>
        We found 2 projects in your dbt Cloud account
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

interface Step4ContentProps {
  onReviewIssues: (name: string) => void;
  onPublish:      (name: string) => void;
}

const Step4Content: React.FC<Step4ContentProps> = ({ onReviewIssues, onPublish }) => {
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
    <div style={{
      border: `1px solid ${c['border-divider']}`,
      borderRadius: 8, overflow: 'hidden',
      backgroundColor: c['background-base'],
    }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1.4fr 160px',
        gap: sp.C, padding: `${sp.B}px ${sp.D}px`,
        backgroundColor: c['background-subtle'],
        borderBottom: `1px solid ${c['border-divider']}`,
      }}>
        {['Model', 'Issues', ''].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'], fontFamily: ff.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {DBT_MODELS.map((m, i) => (
        <div key={m.name} style={{
          display: 'grid', gridTemplateColumns: '2fr 1.4fr 160px',
          gap: sp.C, padding: `${sp.B + 1}px ${sp.D}px`,
          alignItems: 'center',
          borderTop: i > 0 ? `1px solid ${c['border-divider']}` : 'none',
        }}>
          <span style={{ fontFamily: ff.primary, fontSize: fs.sm, color: c['content-brand'] }}>
            {m.name}
          </span>
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
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Wizard shell ──────────────────────────────────────────────────────────────

const DbtImportWizard: React.FC<DbtImportWizardProps> = ({
  onClose, onImportClose, onReviewIssues, onPublishModel,
}) => {
  const [step, setStep] = useState(0);

  const wrap = (node: React.ReactNode) => (
    <div style={{ minHeight: 280 }}>{node}</div>
  );

  const steps: WizardStep[] = [
    {
      id: 'connect',
      title: 'Connect to dbt Cloud',
      content: wrap(<Step1Content />),
      nextButtonText: 'Test connection →',
      hideBackButton: true,
    },
    {
      id: 'testing',
      title: 'Testing connection',
      content: wrap(<Step2Content onAutoAdvance={() => setStep(2)} />),
      hideNextButton: true,
      hideBackButton: true,
    },
    {
      id: 'select',
      title: 'Select projects',
      content: wrap(<Step3Content />),
      nextButtonText: 'Import',
    },
    {
      id: 'review',
      title: 'Review models',
      content: wrap(<Step4Content onReviewIssues={onReviewIssues} onPublish={onPublishModel} />),
      nextButtonText: 'Import & close',
    },
  ];

  return (
    <WizardModal
      isOpen
      onClose={onClose}
      title="Import dbt project"
      steps={steps}
      onComplete={onImportClose}
      currentStep={step}
      onStepChange={setStep}
      size="medium"
      showProgress
    />
  );
};

export default DbtImportWizard;
