import React from 'react';
import { c, sp, fs, fw, ff } from '../../styles';

interface SubTab {
  id: string;
  label: string;
}

/**
 * Thin sub-state switcher rendered as a small sticky bar inside the Shell body.
 * Looks like exploration-mode chrome, not product UI — clearly debug-y.
 */
export const SubStateBar: React.FC<{
  subtabs: SubTab[];
  active: string;
  onChange: (id: string) => void;
}> = ({ subtabs, active, onChange }) => (
  <div style={{
    flexShrink: 0,
    padding: `${sp.A + 1}px ${sp.D}px`,
    backgroundColor: c['background-warning'],
    borderBottom: `1px solid ${c['border-divider']}`,
    display: 'flex',
    alignItems: 'center',
    gap: sp.B,
    fontFamily: ff.primary,
  }}>
    <span style={{ fontSize: 10, color: c['content-warning'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.medium }}>
      Exploration sub-state
    </span>
    <div style={{ display: 'flex', gap: sp.A, flexWrap: 'wrap' }}>
      {subtabs.map(t => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              padding: `${sp.A - 1}px ${sp.B + 2}px`,
              borderRadius: 10,
              border: `1px solid ${isActive ? c['content-warning'] : 'transparent'}`,
              backgroundColor: isActive ? c['background-base'] : 'transparent',
              color: isActive ? c['content-warning'] : c['content-secondary'],
              fontSize: fs.xs,
              fontFamily: ff.primary,
              fontWeight: isActive ? fw.medium : fw.regular,
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
);
