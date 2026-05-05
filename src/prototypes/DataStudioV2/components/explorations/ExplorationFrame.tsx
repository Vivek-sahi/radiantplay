import React from 'react';
import { c, sp, fs, fw, ff } from '../../styles';

interface SubTab {
  id: string;
  label: string;
}

interface ExplorationFrameProps {
  title: string;
  subtabs: SubTab[];
  active: string;
  onChange: (id: string) => void;
  children: React.ReactNode;
}

export const ExplorationFrame: React.FC<ExplorationFrameProps> = ({ title, subtabs, active, onChange, children }) => (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'], fontFamily: ff.primary }}>
    {/* Header with title + sub-tab pills */}
    <div style={{ flexShrink: 0, padding: `${sp.D}px ${sp.H}px`, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sp.C }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: fw.semibold, color: c['content-primary'] }}>{title}</h2>
        <span style={{ fontSize: 11, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Exploration · sub-state: <strong style={{ color: c['content-secondary'] }}>{subtabs.find(s => s.id === active)?.label}</strong>
        </span>
      </div>
      <div style={{ display: 'flex', gap: sp.A }}>
        {subtabs.map(t => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              style={{
                padding: `${sp.A + 1}px ${sp.C}px`,
                borderRadius: 14,
                border: `1px solid ${isActive ? c['content-brand'] : c['border-default']}`,
                backgroundColor: isActive ? c['background-information'] : 'transparent',
                color: isActive ? c['content-brand'] : c['content-secondary'],
                fontSize: fs.xs, fontFamily: ff.primary, fontWeight: isActive ? fw.semibold : fw.regular,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
    {/* Body */}
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {children}
    </div>
  </div>
);

// ── Shared visual primitives ──────────────────────────────────────────────────

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    backgroundColor: c['background-base'],
    border: `1px solid ${c['border-divider']}`,
    borderRadius: 8,
    ...(style ?? {}),
  }}>
    {children}
  </div>
);

export const PrimaryButton: React.FC<{ onClick?: () => void; children: React.ReactNode; size?: 'sm' | 'md' }> = ({ onClick, children, size = 'md' }) => (
  <button onClick={onClick} style={{
    padding: size === 'sm' ? `${sp.A + 1}px ${sp.C}px` : `${sp.B}px ${sp.D}px`,
    borderRadius: 6,
    border: 'none',
    backgroundColor: c['background-brand'],
    color: c['content-on-brand'],
    fontSize: size === 'sm' ? fs.xs : fs.sm,
    fontFamily: ff.primary,
    fontWeight: fw.medium,
    cursor: 'pointer',
  }}>
    {children}
  </button>
);

export const GhostButton: React.FC<{ onClick?: () => void; children: React.ReactNode; size?: 'sm' | 'md' }> = ({ onClick, children, size = 'md' }) => (
  <button onClick={onClick} style={{
    padding: size === 'sm' ? `${sp.A + 1}px ${sp.C}px` : `${sp.B}px ${sp.D}px`,
    borderRadius: 6,
    border: `1px solid ${c['border-default']}`,
    backgroundColor: c['background-base'],
    color: c['content-primary'],
    fontSize: size === 'sm' ? fs.xs : fs.sm,
    fontFamily: ff.primary,
    fontWeight: fw.medium,
    cursor: 'pointer',
  }}>
    {children}
  </button>
);

export const Pill: React.FC<{ tone?: 'neutral' | 'good' | 'warn' | 'error' | 'info'; children: React.ReactNode }> = ({ tone = 'neutral', children }) => {
  const palette = {
    neutral: { bg: c['background-subtle'],     fg: c['content-secondary'] },
    good:    { bg: c['background-success'],    fg: c['content-success']   },
    warn:    { bg: c['background-warning'],    fg: c['content-warning']   },
    error:   { bg: c['background-danger'],     fg: c['content-danger']    },
    info:    { bg: c['background-information'],fg: c['content-brand']     },
  }[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: `2px ${sp.B}px`, borderRadius: 10,
      backgroundColor: palette.bg,
      color: palette.fg,
      fontSize: 11, fontWeight: fw.medium,
    }}>{children}</span>
  );
};
