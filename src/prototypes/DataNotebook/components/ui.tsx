import React from 'react';
import { c, ff, fw } from '../styles';
import type { CellType, CellStatus } from '../types';

// ── Cell-type metadata: label + accent colour + monochrome glyph ────────────────
// Inline functional SVGs (consistent with the existing Overview.tsx icon pattern).

export const cellTypeMeta: Record<CellType, { label: string; color: string }> = {
  sql:            { label: 'SQL',          color: '#6E56CF' },
  python:         { label: 'Python',       color: '#2563EB' },
  chart:          { label: 'Chart',        color: '#D97706' },
  input:          { label: 'Input',        color: '#0EA5E9' },
  'single-value': { label: 'Single value', color: '#059669' },
  pivot:          { label: 'Pivot',        color: '#DB2777' },
  csv:            { label: 'CSV',          color: '#0D9488' },
  markdown:       { label: 'Text',         color: '#6B7280' },
};

export const CellGlyph: React.FC<{ type: CellType; size?: number }> = ({ type, size = 13 }) => {
  const color = cellTypeMeta[type].color;
  const common = { width: size, height: size, viewBox: '0 0 16 16', fill: 'none' as const, style: { color, flexShrink: 0 } };
  switch (type) {
    case 'sql':
      return (<svg {...common}><ellipse cx="8" cy="3.5" rx="5" ry="2" stroke="currentColor" strokeWidth="1.3"/><path d="M3 3.5V12.5C3 13.6 5.2 14.5 8 14.5C10.8 14.5 13 13.6 13 12.5V3.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 8C3 9.1 5.2 10 8 10C10.8 10 13 9.1 13 8" stroke="currentColor" strokeWidth="1.3"/></svg>);
    case 'python':
      return (<svg {...common}><path d="M4 5.5L1.5 8L4 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 5.5L14.5 8L12 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 3L6.5 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>);
    case 'chart':
      return (<svg {...common}><path d="M2 14V2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2 14H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="4" y="8" width="2.4" height="4" fill="currentColor"/><rect x="7.8" y="5" width="2.4" height="7" fill="currentColor"/><rect x="11.6" y="9.5" width="2.4" height="2.5" fill="currentColor"/></svg>);
    case 'input':
      return (<svg {...common}><circle cx="5" cy="5" r="1.6" stroke="currentColor" strokeWidth="1.3"/><path d="M6.6 5H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M2 5H3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="11" cy="11" r="1.6" stroke="currentColor" strokeWidth="1.3"/><path d="M2 11H9.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M12.6 11H14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>);
    case 'single-value':
      return (<svg {...common}><path d="M5 4.5L8 2.5V13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 13.5H10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>);
    case 'pivot':
      return (<svg {...common}><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 6H14M6 2V14" stroke="currentColor" strokeWidth="1.3"/></svg>);
    case 'markdown':
      return (<svg {...common}><path d="M3 12V4L6 8L9 4V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M11.5 4V11M11.5 11L13.5 9M11.5 11L9.5 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>);
    case 'csv':
      return (<svg {...common}><path d="M4 1.5H9.5L13 5V14.5H4V1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 1.5V5H13" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M6 9.5L7.3 11.5L8.6 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
  }
};

// ── Status indicator ────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<CellStatus, string> = {
  idle: '#cbd2dd', queued: '#f59e0b', running: '#2770EF', success: '#16a34a', error: '#dc2626', stale: '#f59e0b',
};

export const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 13, color = '#2770EF' }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" style={{ animation: 'hexspin 0.7s linear infinite' }}>
    <circle cx="8" cy="8" r="6" stroke={color} strokeOpacity="0.2" strokeWidth="2" fill="none" />
    <path d="M8 2A6 6 0 0 1 14 8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

export const StatusDot: React.FC<{ status: CellStatus }> = ({ status }) => {
  if (status === 'running') return <Spinner size={12} />;
  return <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: STATUS_COLOR[status], display: 'inline-block', flexShrink: 0 }} />;
};

// ── Pill ──────────────────────────────────────────────────────────────────────
export const Pill: React.FC<{ children: React.ReactNode; color?: string; bg?: string; onClick?: () => void; title?: string }> = ({ children, color = c['content-secondary'], bg = 'rgba(0,0,0,0.045)', onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, border: 'none',
      fontSize: 11, fontWeight: fw.semibold, fontFamily: ff.primary,
      color, backgroundColor: bg, cursor: onClick ? 'pointer' : 'default', whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
);

// ── Small ghost icon button ─────────────────────────────────────────────────────
export const IconButton: React.FC<{ onClick?: (e: React.MouseEvent) => void; title?: string; children: React.ReactNode; active?: boolean }> = ({ onClick, title, children, active }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 26, borderRadius: 6, border: 'none',
      background: active ? 'rgba(39,112,239,0.1)' : 'transparent',
      color: active ? '#2770EF' : c['content-secondary'],
      cursor: 'pointer', padding: 0, transition: 'background 0.12s',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    {children}
  </button>
);

// Common path icons
export const PlayIcon: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M4.5 3.5L12 8L4.5 12.5V3.5Z" fill="currentColor" /></svg>
);
export const DotsIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3.5" r="1.3" fill="currentColor"/><circle cx="8" cy="8" r="1.3" fill="currentColor"/><circle cx="8" cy="12.5" r="1.3" fill="currentColor"/></svg>
);
export const PlusIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
);
export const CloseIcon: React.FC<{ size?: number }> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
);
export const DragHandle: React.FC = () => (
  <svg width="10" height="14" viewBox="0 0 10 14" fill="none"><circle cx="3" cy="3" r="1.1" fill="currentColor"/><circle cx="7" cy="3" r="1.1" fill="currentColor"/><circle cx="3" cy="7" r="1.1" fill="currentColor"/><circle cx="7" cy="7" r="1.1" fill="currentColor"/><circle cx="3" cy="11" r="1.1" fill="currentColor"/><circle cx="7" cy="11" r="1.1" fill="currentColor"/></svg>
);

// Keyframes injected once.
export const HexKeyframes: React.FC = () => (
  <style>{`
    @keyframes hexspin { to { transform: rotate(360deg); } }
    @keyframes hexfadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes hexpulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  `}</style>
);
