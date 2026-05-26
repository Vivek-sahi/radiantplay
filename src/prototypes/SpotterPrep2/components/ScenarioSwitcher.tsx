import React from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import type { QualityState } from './QualityTab';

export type ScenarioId = '1' | '2' | '3' | '4' | '5a' | '5b';

interface Scenario {
  id: ScenarioId;
  label: string;
  indent?: boolean;
}

const SCENARIOS: Scenario[] = [
  { id: '1',  label: 'Not cached' },
  { id: '2',  label: 'Cached · not prepped' },
  { id: '3',  label: 'Cached · prepped, unsaved' },
  { id: '4',  label: 'Cached · prepped, saved' },
  { id: '5a', label: 'After refresh · no new issues', indent: true },
  { id: '5b', label: 'After refresh · new issues found', indent: true },
];

export function scenarioToQualityState(s: ScenarioId): QualityState {
  switch (s) {
    case '1':  return 'not-cached';
    case '2':  return 'scanned';
    case '3':  return 'wip';
    case '4':  return 'saved';
    case '5a': return 'published';
    case '5b': return 'refresh-issues';
  }
}

interface ScenarioSwitcherProps {
  active: ScenarioId;
  onChange: (s: ScenarioId) => void;
}

const ScenarioSwitcher: React.FC<ScenarioSwitcherProps> = ({ active, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const activeLabel = SCENARIOS.find(s => s.id === active)?.label ?? '';

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 20, zIndex: 9999,
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderRadius: 10,
      padding: `${sp.C}px ${sp.C}px`,
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      minWidth: open ? 240 : 0,
      fontFamily: ff.primary,
      backdropFilter: 'blur(8px)',
    }}>
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: sp.C, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: `0 ${sp.B}px`,
          paddingBottom: open ? sp.B : 0,
          borderBottom: open ? '1px solid rgba(255,255,255,0.08)' : 'none',
          marginBottom: open ? sp.B : 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span style={{
            fontSize: 10, fontWeight: fw.semibold,
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase', letterSpacing: '0.09em',
          }}>
            Prototype · Scenario
          </span>
          {!open && (
            <span style={{ fontSize: fs.sm, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
              {activeLabel}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
          {open ? '▼' : '▲'}
        </span>
      </button>

      {/* Scenario list — only when open */}
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {SCENARIOS.map((s, i) => {
            const isActive = active === s.id;
            const showGroupLabel = i === 4;

            return (
              <React.Fragment key={s.id}>
                {showGroupLabel && (
                  <div style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.25)',
                    padding: `${sp.B}px ${sp.B}px ${sp.A}px`,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    marginTop: sp.A,
                  }}>
                    5 · After cache refresh
                  </div>
                )}
                <button
                  onClick={() => { onChange(s.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: sp.B,
                    padding: `5px ${sp.B}px 5px ${s.indent ? sp.D : sp.B}px`,
                    borderRadius: 6, border: 'none',
                    backgroundColor: isActive ? 'rgba(59,130,246,0.22)' : 'transparent',
                    color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                    fontSize: fs.sm,
                    fontWeight: isActive ? fw.medium : fw.regular,
                    cursor: 'pointer', fontFamily: ff.primary,
                    textAlign: 'left', width: '100%',
                    transition: 'background-color 0.1s, color 0.1s',
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: isActive ? '#3b82f6' : 'rgba(255,255,255,0.18)',
                    transition: 'background-color 0.1s',
                  }} />
                  {s.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScenarioSwitcher;

// ── Inline picker for embedding in a header bar ────────────────────────────────

export const InlineScenarioPicker: React.FC<ScenarioSwitcherProps> = ({ active, onChange }) => {
  const [open, setOpen] = React.useState(false);
  const activeLabel = SCENARIOS.find(s => s.id === active)?.label ?? '';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6,
          border: `1px solid ${c['border-divider']}`,
          backgroundColor: c['background-subtle'],
          cursor: 'pointer', fontFamily: ff.primary,
        }}
      >
        <span style={{ fontSize: 10, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: fw.medium }}>Scenario</span>
        <span style={{ fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium }}>{activeLabel}</span>
        <span style={{ fontSize: 10, color: c['content-tertiary'] }}>{open ? '▲' : '▾'}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999,
          backgroundColor: 'rgba(15, 23, 42, 0.96)',
          borderRadius: 10, padding: `${sp.C}px`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
          minWidth: 240, fontFamily: ff.primary,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {SCENARIOS.map((s, i) => {
              const isActive = active === s.id;
              const showGroupLabel = i === 4;
              return (
                <React.Fragment key={s.id}>
                  {showGroupLabel && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', padding: `${sp.B}px ${sp.B}px ${sp.A}px`, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: sp.A }}>
                      5 · After cache refresh
                    </div>
                  )}
                  <button
                    onClick={() => { onChange(s.id); setOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: sp.B,
                      padding: `5px ${sp.B}px 5px ${s.indent ? sp.D : sp.B}px`,
                      borderRadius: 6, border: 'none',
                      backgroundColor: isActive ? 'rgba(59,130,246,0.22)' : 'transparent',
                      color: isActive ? '#93c5fd' : 'rgba(255,255,255,0.5)',
                      fontSize: fs.sm, fontWeight: isActive ? fw.medium : fw.regular,
                      cursor: 'pointer', fontFamily: ff.primary, textAlign: 'left', width: '100%',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, backgroundColor: isActive ? '#3b82f6' : 'rgba(255,255,255,0.18)' }} />
                    {s.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
