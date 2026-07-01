import React, { useState } from 'react';
import { c, ff, fw } from '../styles';
import type { CellType } from '../types';
import { cellTypeMeta, CellGlyph, PlusIcon } from './ui';

const ORDER: CellType[] = ['sql', 'python', 'chart', 'pivot', 'single-value', 'input', 'csv', 'markdown'];

interface AddCellBarProps {
  onAdd: (type: CellType) => void;
  variant?: 'between' | 'end';
}

// The green "+ Add cell" affordance Hex shows between and below cells.
const AddCellBar: React.FC<AddCellBarProps> = ({ onAdd, variant = 'between' }) => {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: variant === 'end' ? 40 : 22 }}
    >
      {/* hover line */}
      {variant === 'between' && (
        <div style={{ position: 'absolute', left: 0, right: 0, height: 1, background: hover ? 'rgba(22,163,74,0.35)' : 'transparent', transition: 'background 0.12s' }} />
      )}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: variant === 'end' ? '6px 14px' : '2px 10px',
          borderRadius: 20, border: `1px solid ${open || hover || variant === 'end' ? 'rgba(22,163,74,0.4)' : 'transparent'}`,
          background: open || variant === 'end' ? 'rgba(22,163,74,0.08)' : hover ? c['background-base'] : 'transparent',
          color: '#15803d', fontFamily: ff.primary, fontSize: 12, fontWeight: fw.semibold,
          cursor: 'pointer', position: 'relative', zIndex: 1, transition: 'all 0.12s',
          opacity: variant === 'between' && !hover && !open ? 0 : 1,
        }}
      >
        <PlusIcon size={12} /> Add cell
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: variant === 'end' ? 38 : 26, zIndex: 41,
            background: c['background-base'], borderRadius: 10, padding: 5, minWidth: 180,
            boxShadow: '0 8px 28px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.06)',
          }}>
            {ORDER.map(t => (
              <button
                key={t}
                onClick={() => { onAdd(t); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', padding: '7px 9px', border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontFamily: ff.primary, fontSize: 12.5, color: c['content-primary'] }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.045)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <CellGlyph type={t} size={14} />
                {cellTypeMeta[t].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AddCellBar;
