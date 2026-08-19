import React, { useEffect, useRef, useState } from 'react';
import { ff, sp } from '../styles';
import { c } from '../styles';

// ── TestFixCard — fix recommendations from a failed model test ────────────────
// Self-contained card mirroring the AI-readiness recommendations pattern
// (per-row "Fix" + "Fix all", pending → fixing → done animation). Content is
// tied to the specific divergences the Spotter comparison surfaced.

export interface TestFixItem {
  id: string;
  title: string;
  detail: string;      // what Spotter did wrong
  fix: string;         // what the fix does
  layer: 'Logical' | 'Semantic' | 'Physical';
}

type FixState = 'pending' | 'fixing' | 'done';

const LAYER_COLOR: Record<string, { fg: string; bg: string }> = {
  Logical:  { fg: '#8257C9', bg: 'rgba(124,58,237,0.07)' },
  Semantic: { fg: '#3F72C4', bg: 'rgba(39,112,239,0.07)' },
  Physical: { fg: '#9A7415', bg: 'rgba(252,200,56,0.10)' },
};

const TestFixCard: React.FC<{ items: TestFixItem[]; onAllFixed?: () => void }> = ({ items, onAllFixed }) => {
  const [states, setStates] = useState<Record<string, FixState>>(
    () => Object.fromEntries(items.map(i => [i.id, 'pending' as FixState]))
  );
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const allDone = items.every(i => states[i.id] === 'done');
  const pendingCount = items.filter(i => states[i.id] === 'pending').length;

  const fixOne = (id: string, delay = 0) => {
    if (states[id] !== 'pending') return;
    setStates(prev => ({ ...prev, [id]: 'fixing' }));
    const t = setTimeout(() => {
      setStates(prev => {
        const next = { ...prev, [id]: 'done' as FixState };
        if (items.every(i => next[i.id] === 'done')) onAllFixed?.();
        return next;
      });
    }, 900 + delay);
    timers.current.push(t);
  };

  const fixAll = () => {
    items.filter(i => states[i.id] === 'pending').forEach((i, idx) => {
      const t = setTimeout(() => fixOne(i.id), idx * 260);
      timers.current.push(t);
    });
  };

  return (
    <div style={{
      border: `1px solid ${c['border-subtle-hover']}`, borderRadius: 12, background: '#fff', overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(25,35,49,0.05)', fontFamily: ff.primary,
    }}>
      <style>{`@keyframes tfc-spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{
        padding: '13px 15px', borderBottom: `1px solid ${c['border-divider']}`,
        display: 'flex', alignItems: 'flex-start', gap: sp.C,
        background: allDone ? 'rgba(6,191,127,0.05)' : 'transparent',
        transition: 'background 300ms',
      }}>
        <span style={{ flexShrink: 0, marginTop: 1, display: 'flex' }}>
          {allDone ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#06BF7F"/><path d="M6 10l2.6 2.6L14 7.2" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.6 4.9 5.1.1-4.1 3 1.5 4.9L10 12l-4.1 2.9 1.5-4.9-4.1-3 5.1-.1L10 2z" fill="#2770EF"/></svg>
          )}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: c['content-primary'], letterSpacing: '-0.2px' }}>
            {allDone ? 'All issues fixed' : `${items.length} recommended fix${items.length === 1 ? '' : 'es'}`}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, marginTop: sp.A }}>
            {allDone
              ? 'Re-run the test — Spotter should now match the exact answer.'
              : 'Applying these makes Spotter match the exact query on this question.'}
          </div>
        </div>
      </div>

      {/* Rows */}
      <div>
        {items.map(item => {
          const st = states[item.id];
          const lc = LAYER_COLOR[item.layer];
          return (
            <div key={item.id} style={{ padding: '11px 14px', borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', gap: sp.C, alignItems: 'flex-start' }}>
              {/* Status dot / check */}
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                border: st === 'done' ? 'none' : `1.5px solid ${st === 'fixing' ? '#2770EF' : c['border-subtle-hover']}`,
                background: st === 'done' ? '#06BF7F' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: st === 'fixing' ? 'tfc-spin 700ms linear infinite' : 'none',
              }}>
                {st === 'done' && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {st === 'fixing' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2770EF' }} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: sp.A }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: c['content-primary'] }}>{item.title}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '1px 5px', borderRadius: 4, color: lc.fg, background: lc.bg, textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>{item.layer}</span>
                </div>
                <div style={{ fontSize: 12, color: '#8B96A5', lineHeight: 1.5 }}>
                  {st === 'done' ? item.fix : item.detail}
                </div>
              </div>

              {/* Per-row action */}
              {st === 'pending' && (
                <button
                  onClick={() => fixOne(item.id)}
                  style={{ flexShrink: 0, height: 26, padding: '0 11px', borderRadius: 6, border: `1px solid ${c['border-subtle-hover']}`, background: '#fff', color: '#2770EF', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: sp.A }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2770EF'; e.currentTarget.style.background = c['background-sunken']; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = c['border-subtle-hover']; e.currentTarget.style.background = '#fff'; }}
                >
                  Fix
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              {st === 'fixing' && (
                <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: '#2770EF', paddingTop: sp.A }}>Fixing…</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer — Fix all */}
      {!allDone && (
        <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={fixAll}
            disabled={pendingCount === 0}
            style={{ height: 30, padding: '0 15px', borderRadius: 7, border: 'none', background: pendingCount ? '#2770EF' : c['background-subtle'], color: pendingCount ? '#fff' : '#A5ACB9', fontSize: 12, fontWeight: 600, cursor: pendingCount ? 'pointer' : 'default', fontFamily: ff.primary, display: 'flex', alignItems: 'center', gap: sp.B }}
            onMouseEnter={e => { if (pendingCount) e.currentTarget.style.background = '#2359B6'; }}
            onMouseLeave={e => { if (pendingCount) e.currentTarget.style.background = '#2770EF'; }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.9 4.4L14 6l-3 3 .8 4.8L8 11.6 4.2 13.8 5 9 2 6l4.1-.6L8 1z" fill="currentColor"/></svg>
            Fix all
          </button>
        </div>
      )}
    </div>
  );
};

export default TestFixCard;
