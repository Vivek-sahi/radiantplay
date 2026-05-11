import React, { useState, useRef, useEffect } from 'react';
import { c, sp, fs, ff } from '../styles';
import type { Connection } from '../data/mockData';

interface ConnectionPillProps {
  connections: Connection[];
  value: string | null;
  onChange: (id: string | null) => void;
  dropDirection?: 'up' | 'down';
}

export default function ConnectionPill({ connections, value, onChange, dropDirection = 'down' }: ConnectionPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ? connections.find(cn => cn.id === value) : null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dotColor = (status: Connection['status']) => (
    status === 'connected' ? '#22c55e' : status === 'auth-needed' ? '#f59e0b' : '#ef4444'
  );

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Pill trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 30,
          background: c['background-subtle'],
          border: `1px solid ${c['border-default']}`,
          borderRadius: 20,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span style={{
          paddingLeft: 10,
          paddingRight: 8,
          fontSize: fs.sm,
          fontFamily: ff.primary,
          color: c['content-primary'],
          maxWidth: 160,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}>
          {selected ? selected.name : 'All connections'}
        </span>
        <span style={{ width: 1, height: 14, background: c['border-default'], flexShrink: 0 }} />
        <span style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          ...(dropDirection === 'up' ? { bottom: 'calc(100% + 4px)' } : { top: 'calc(100% + 4px)' }),
          left: 0,
          minWidth: 220,
          background: c['background-base'],
          border: `1px solid ${c['border-default']}`,
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 400,
          overflow: 'hidden',
        }}>
          <DropRow label="All connections" checked={value === null} onClick={() => { onChange(null); setOpen(false); }} />
          <div style={{ height: 1, background: c['border-divider'], margin: `0 ${sp.C}px` }} />
          {connections.map(conn => (
            <DropRow
              key={conn.id}
              label={conn.name}
              dot={dotColor(conn.status)}
              checked={value === conn.id}
              onClick={() => { onChange(conn.id); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DropRow({ label, dot, checked, onClick }: { label: string; dot?: string; checked: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: sp.B,
        width: '100%',
        padding: `${sp.B}px ${sp.C}px`,
        border: 'none',
        background: hover || checked ? c['background-subtle'] : 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {dot
        ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
        : <span style={{ width: 7, flexShrink: 0 }} />
      }
      <span style={{
        flex: 1,
        fontSize: fs.sm,
        fontFamily: ff.primary,
        color: c['content-primary'],
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke={c['content-brand']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
