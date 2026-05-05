// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  COMBINED MODEL STATUS — IA explorations (cache + quality together)      ║
// ║                                                                          ║
// ║  Premise: in the real product, cache and quality coexist on one header.  ║
// ║  Showing them as two independent chips is the obvious option but not    ║
// ║  necessarily the right one. These five iterations test different IA     ║
// ║  strategies — different *mental models* for how cache and quality       ║
// ║  relate to each other and to the rest of the chrome.                    ║
// ║                                                                          ║
// ║  The implicit question each variant answers:                             ║
// ║    M1 — both equal flat affordances                                      ║
// ║    M2 — cache = ambient state, quality = urgent action (different kinds) ║
// ║    M3 — single rolled-up "Model" chip → composite status panel           ║
// ║    M4 — secondary status strip, header stays for actions only            ║
// ║    M5 — adaptive priority: whichever is most urgent dominates            ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import React, { useState } from 'react';
import { c, sp, ff, fs, fw, ts, HEADER_HEIGHT } from './styles';
import { CacheModal } from './CacheDiscoverability';
import { QualityModal } from './DataQualityDiscoverability';

// ── Severity tone (mirrors quality file) ─────────────────────────────────────

const SEV_HIGH = { bg: '#FEE2E2', fg: '#991B1B', chip: '#DC2626' };

// ── Header building blocks ───────────────────────────────────────────────────

const ProjectIdentity: React.FC = () => (
  <>
    <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>Campaign Performance</span>
    <span style={{ fontSize: 11, fontWeight: fw.regular, color: c['content-secondary'] }}>v1</span>
  </>
);

const StandardActions: React.FC = () => (
  <>
    <button title="More" style={iconBtn}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="1.5" fill={c['content-secondary']}/>
        <circle cx="3.75" cy="9" r="1.5" fill={c['content-secondary']}/>
        <circle cx="14.25" cy="9" r="1.5" fill={c['content-secondary']}/>
      </svg>
    </button>
    <div style={{ width: 1, height: 20, backgroundColor: c['border-divider'], flexShrink: 0 }} />
    <button title="Share" style={iconBtn}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="3.75" r="2.25"/><circle cx="4.5" cy="9" r="2.25"/><circle cx="13.5" cy="14.25" r="2.25"/>
        <line x1="6.44" y1="10.13" x2="11.56" y2="13.12"/><line x1="11.56" y1="4.88" x2="6.44" y2="7.87"/>
      </svg>
    </button>
    <button style={publishBtn}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563EB'}
    >
      <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11.25V2.25M9 2.25L5.25 6M9 2.25L12.75 6"/>
        <line x1="3" y1="15.75" x2="15" y2="15.75"/>
      </svg>
      Publish
    </button>
  </>
);

// ── Reusable chip atoms ──────────────────────────────────────────────────────

const CacheChip: React.FC<{ onClick: () => void; size?: 'normal' | 'small' | 'tiny' }> = ({ onClick, size = 'normal' }) => {
  if (size === 'tiny') {
    return (
      <button onClick={onClick} title="Live · Snowflake" style={{ width: 18, height: 18, padding: 0, border: 'none', borderRadius: 9, backgroundColor: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10B981' }} />
      </button>
    );
  }
  return (
    <button onClick={onClick}
      style={{ height: 26, padding: '0 10px', border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontFamily: ff.primary, color: c['content-primary'] }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = c['background-base']}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
      Live · Snowflake
    </button>
  );
};

const QualityChip: React.FC<{ onClick: () => void; size?: 'normal' | 'small' | 'tiny'; loud?: boolean }> = ({ onClick, size = 'normal', loud = false }) => {
  if (size === 'tiny') {
    return (
      <button onClick={onClick} title="3 high · 6 medium issues" style={{ width: 18, height: 18, padding: 0, border: 'none', borderRadius: 9, backgroundColor: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: SEV_HIGH.chip }} />
      </button>
    );
  }
  return (
    <button onClick={onClick}
      style={{
        height: 26, padding: '0 10px',
        border: `1px solid ${loud ? SEV_HIGH.chip + '55' : c['border-default']}`,
        borderRadius: 6,
        backgroundColor: loud ? SEV_HIGH.bg : c['background-base'],
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 7,
        fontSize: 12, fontWeight: loud ? fw.medium : fw.regular,
        fontFamily: ff.primary,
        color: loud ? SEV_HIGH.fg : c['content-primary'],
      }}
    >
      <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke={loud ? SEV_HIGH.fg : c['content-secondary']} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 1.5L1.5 15.75H16.5L9 1.5Z"/>
        <line x1="9" y1="7" x2="9" y2="10.5"/>
        <circle cx="9" cy="13" r="0.5" fill={loud ? SEV_HIGH.fg : c['content-secondary']}/>
      </svg>
      {loud ? '3 high · 6 medium' : '9 issues'}
    </button>
  );
};

// ── Five combined-IA variants ────────────────────────────────────────────────

// M1 — Twin chips, side-by-side (flat list mental model)
const HeaderM1: React.FC<{ onCacheClick: () => void; onQualityClick: () => void }> = ({ onCacheClick, onQualityClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity />
    <div style={rightActionsStyle}>
      <QualityChip onClick={onQualityClick} loud />
      <CacheChip onClick={onCacheClick} />
      <StandardActions />
    </div>
  </div>
);

// M2 — Property-side cache + action-side quality (different-kinds mental model)
const HeaderM2: React.FC<{ onCacheClick: () => void; onQualityClick: () => void }> = ({ onCacheClick, onQualityClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity />
    {/* Cache as a property next to identity — quiet, ambient */}
    <button onClick={onCacheClick}
      style={{ height: 22, padding: '0 8px', border: 'none', borderRadius: 11, backgroundColor: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: ff.primary, color: c['content-secondary'] }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
      Live · Snowflake
    </button>
    <div style={rightActionsStyle}>
      {/* Quality as action chip — loud, demands attention */}
      <QualityChip onClick={onQualityClick} loud />
      <StandardActions />
    </div>
  </div>
);

// M3 — Single unified "Model status" chip
const HeaderM3: React.FC<{ onCombinedClick: () => void }> = ({ onCombinedClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity />
    <div style={rightActionsStyle}>
      <button onClick={onCombinedClick}
        style={{ height: 26, padding: '0 10px', border: `1px solid ${SEV_HIGH.chip}55`, borderRadius: 6, backgroundColor: SEV_HIGH.bg, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontFamily: ff.primary, color: SEV_HIGH.fg, fontWeight: fw.medium }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
          Live
        </span>
        <span style={{ width: 1, height: 12, backgroundColor: SEV_HIGH.fg + '33' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: SEV_HIGH.chip }} />
          9 issues
        </span>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={SEV_HIGH.fg} strokeWidth="1.5" strokeLinecap="round"><path d="M3 5l3 3 3-3"/></svg>
      </button>
      <StandardActions />
    </div>
  </div>
);

// ── Icons (used in M4 + canvas variants) ─────────────────────────────────────

const DatabaseIcon: React.FC<{ size?: number; color?: string }> = ({ size = 12, color = c['content-secondary'] }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="8" cy="3.5" rx="5" ry="1.75"/>
    <path d="M3 3.5v5c0 1 2.24 1.75 5 1.75s5-.75 5-1.75v-5"/>
    <path d="M3 8.5v4c0 1 2.24 1.75 5 1.75s5-.75 5-1.75v-4"/>
  </svg>
);

const WarningIcon: React.FC<{ size?: number; color?: string }> = ({ size = 12, color = SEV_HIGH.fg }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 1.5L1.5 15.75H16.5L9 1.5Z"/>
    <line x1="9" y1="7" x2="9" y2="10.5"/>
    <circle cx="9" cy="13" r="0.5" fill={color}/>
  </svg>
);

const RefreshIcon: React.FC<{ size?: number; color?: string }> = ({ size = 11, color = c['content-tertiary'] }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.5 3.5v3h-3"/>
    <path d="M2.5 12.5v-3h3"/>
    <path d="M3.5 6.5a4.5 4.5 0 018-1.5l2 1.5"/>
    <path d="M12.5 9.5a4.5 4.5 0 01-8 1.5l-2-1.5"/>
  </svg>
);

// ── M4 — Status strip below the action header ────────────────────────────────

const StatusStrip: React.FC<{ onCacheClick: () => void; onQualityClick: () => void; onRefresh?: () => void }> = ({ onCacheClick, onQualityClick, onRefresh }) => (
  <div style={{ height: 32, backgroundColor: c['background-subtle'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, gap: 10, flexShrink: 0 }}>
    <span style={{ fontSize: 10, color: c['content-tertiary'], fontFamily: ff.primary, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: fw.medium }}>Model</span>
    <span style={{ width: 1, height: 12, backgroundColor: c['border-divider'] }} />
    <button onClick={onCacheClick}
      style={{ height: 22, padding: '0 6px', border: 'none', borderRadius: 4, backgroundColor: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontFamily: ff.primary, color: c['content-secondary'] }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-base']}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <DatabaseIcon />
      Live · Snowflake
    </button>
    <span style={{ color: c['border-divider'], fontSize: 11 }}>·</span>
    <button onClick={onQualityClick}
      style={{ height: 22, padding: '0 6px', border: 'none', borderRadius: 4, backgroundColor: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontFamily: ff.primary, color: SEV_HIGH.fg, fontWeight: fw.medium }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = SEV_HIGH.bg}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <WarningIcon />
      9 quality issues
    </button>
    <span style={{ color: c['border-divider'], fontSize: 11 }}>·</span>
    <span style={{ fontSize: 11.5, fontFamily: ff.primary, color: c['content-tertiary'], display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      Last validated 2h ago
      <button title="Re-run quality scan" onClick={onRefresh}
        style={{ width: 18, height: 18, padding: 0, border: 'none', borderRadius: 3, backgroundColor: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-base']}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <RefreshIcon />
      </button>
    </span>
  </div>
);

const HeaderM4: React.FC<{ onCacheClick: () => void; onQualityClick: () => void }> = ({ onCacheClick, onQualityClick }) => (
  <>
    <div style={mainHeaderStyle}>
      <ProjectIdentity />
      <div style={rightActionsStyle}>
        <StandardActions />
      </div>
    </div>
    <StatusStrip onCacheClick={onCacheClick} onQualityClick={onQualityClick} />
  </>
);

// M5 — Adaptive priority (urgency wins)
// Quality has high-severity issues → quality chip dominates, cache shrinks to dot.
const HeaderM5: React.FC<{ onCacheClick: () => void; onQualityClick: () => void }> = ({ onCacheClick, onQualityClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity />
    <div style={rightActionsStyle}>
      {/* Quality dominates — full loud chip */}
      <QualityChip onClick={onQualityClick} loud />
      {/* Cache shrinks to a tiny dot since nothing's urgent there */}
      <CacheChip onClick={onCacheClick} size="tiny" />
      <StandardActions />
    </div>
  </div>
);

// ── Identity-with-subtext (used by M7) ───────────────────────────────────────

const ProjectIdentityWithStatus: React.FC<{ onCacheClick: () => void; onQualityClick: () => void; onRefresh?: () => void }> = ({ onCacheClick, onQualityClick, onRefresh }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: sp.C, lineHeight: 1.2 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>Campaign Performance</span>
      <span style={{ fontSize: 11, fontWeight: fw.regular, color: c['content-secondary'] }}>v1</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: c['content-tertiary'] }}>
      <button onClick={onCacheClick}
        style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: ff.primary, color: c['content-secondary'] }}
        onMouseEnter={e => e.currentTarget.style.color = c['content-primary']}
        onMouseLeave={e => e.currentTarget.style.color = c['content-secondary']}
      >
        <DatabaseIcon size={11} />
        Live · Snowflake
      </button>
      <span style={{ color: c['border-divider'] }}>·</span>
      <button onClick={onQualityClick}
        style={{ padding: 0, border: 'none', background: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: ff.primary, color: SEV_HIGH.fg, fontWeight: fw.medium }}
      >
        <WarningIcon size={11} />
        9 quality issues
      </button>
      <span style={{ color: c['border-divider'] }}>·</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        Last validated 2h ago
        <button title="Re-run quality scan" onClick={onRefresh}
          style={{ width: 16, height: 16, padding: 0, border: 'none', borderRadius: 3, backgroundColor: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <RefreshIcon size={10} />
        </button>
      </span>
    </div>
  </div>
);

// ── Canvas mock (for M6 / M7) ────────────────────────────────────────────────

const CANVAS_TABS = ['Columns', 'Tables', 'Preview', 'Notebook'];

const CanvasMock: React.FC<{ header: React.ReactNode; height?: number }> = ({ header, height = 540 }) => (
  <div style={{ position: 'relative', height, display: 'flex', flexDirection: 'column', backgroundColor: c['background-base'], overflow: 'hidden' }}>
    {/* Custom header */}
    {header}

    {/* Sub-header — Data toggle / centered tabs / Data Agent toggle */}
    <div style={{ height: 40, backgroundColor: c['background-base'], borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.D}px`, flexShrink: 0, position: 'relative' }}>
      <button style={{ height: 26, padding: '0 10px', border: `1px solid ${c['border-brand']}`, borderRadius: 6, backgroundColor: c['background-information'], display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: ff.primary, color: c['content-brand'], fontWeight: fw.medium }}>
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="14" height="14" rx="2"/><line x1="5" y1="1" x2="5" y2="15"/></svg>
        Data
      </button>

      {/* Centered tab pill */}
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', backgroundColor: c['background-subtle'], borderRadius: 6, padding: 2 }}>
        {CANVAS_TABS.map((t, i) => (
          <button key={t}
            style={{
              height: 24, padding: '0 12px',
              border: 'none', borderRadius: 4,
              backgroundColor: i === 0 ? c['background-base'] : 'transparent',
              cursor: 'pointer',
              fontSize: 11.5, fontFamily: ff.primary,
              fontWeight: i === 0 ? fw.medium : fw.regular,
              color: i === 0 ? c['content-primary'] : c['content-secondary'],
              boxShadow: i === 0 ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}
          >{t}</button>
        ))}
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: c['content-tertiary'], fontFamily: ff.primary }}>17 columns</span>
        <button title="Search" style={{ width: 24, height: 24, border: 'none', borderRadius: 4, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke={c['content-secondary']} strokeWidth="1.5"><circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/></svg>
        </button>
        <button style={{ height: 26, padding: '0 10px', border: `1px solid ${c['border-brand']}`, borderRadius: 6, backgroundColor: c['background-information'], display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: ff.primary, color: c['content-brand'], fontWeight: fw.medium }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5 L9.1 6.4 L14.5 8 L9.1 9.6 L8 14.5 L6.9 9.6 L1.5 8 L6.9 6.4 Z"/></svg>
          Data Agent
        </button>
      </div>
    </div>

    {/* Body */}
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Left rail */}
      <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, padding: `${sp.C}px ${sp.B}px`, display: 'flex', flexDirection: 'column', gap: 2, fontSize: fs.xs }}>
        <div style={{ fontSize: 10, color: c['content-tertiary'], padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.medium }}>Tables</div>
        {['orders', 'campaigns', 'users', 'products'].map((t, i) => (
          <div key={t} style={{ padding: '5px 8px', borderRadius: 4, backgroundColor: i === 0 ? c['background-information'] : 'transparent', color: i === 0 ? c['content-brand'] : c['content-primary'], fontSize: 12 }}>
            {t}
          </div>
        ))}
        <div style={{ fontSize: 10, color: c['content-tertiary'], padding: '12px 8px 6px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.medium }}>Joins</div>
        <div style={{ padding: '5px 8px', color: c['content-secondary'], fontSize: 11.5 }}>orders ↔ users</div>
        <div style={{ padding: '5px 8px', color: c['content-secondary'], fontSize: 11.5 }}>orders ↔ campaigns</div>
      </div>

      {/* Center — column rows */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.7fr 0.7fr 0.7fr', padding: '8px 16px', fontSize: 10, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: fw.medium, borderBottom: `1px solid ${c['border-divider']}`, backgroundColor: c['background-subtle'] }}>
          <span>Column</span><span>Description</span><span>Null %</span><span>Duplicates</span><span>Anomalies</span>
        </div>
        {[
          { col: 'campaign_id', desc: 'Campaign identifier', nullPct: '18%', dup: '0', anom: '0', issue: true },
          { col: 'amount', desc: 'Order amount in USD', nullPct: '0%', dup: '0', anom: '0', issue: true },
          { col: 'order_date', desc: 'Date of order', nullPct: '0%', dup: '—', anom: '0', issue: true },
          { col: 'channel', desc: 'Acquisition channel', nullPct: '0%', dup: '—', anom: '0', issue: true },
          { col: 'spend', desc: 'Campaign spend', nullPct: '0%', dup: '0', anom: '0.4%', issue: true },
          { col: 'region', desc: 'Geographic region', nullPct: '0%', dup: '—', anom: '0', issue: false },
          { col: 'segment', desc: 'User segment', nullPct: '0%', dup: '—', anom: '0', issue: true },
        ].map(r => (
          <div key={r.col} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.7fr 0.7fr 0.7fr', padding: '10px 16px', fontSize: fs.sm, borderBottom: `1px solid ${c['border-divider']}`, alignItems: 'center' }}>
            <span style={{ fontFamily: ff.mono, fontSize: 12, color: c['content-primary'], display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {r.issue && <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: SEV_HIGH.chip, flexShrink: 0 }} />}
              {r.col}
            </span>
            <span style={{ fontSize: 12, color: c['content-secondary'] }}>{r.desc}</span>
            <span style={{ fontSize: 12, color: r.nullPct !== '0%' ? SEV_HIGH.fg : c['content-secondary'] }}>{r.nullPct}</span>
            <span style={{ fontSize: 12, color: c['content-secondary'] }}>{r.dup}</span>
            <span style={{ fontSize: 12, color: r.anom !== '0' && r.anom !== '0%' ? SEV_HIGH.fg : c['content-secondary'] }}>{r.anom}</span>
          </div>
        ))}
      </div>

      {/* Agent panel */}
      <div style={{ width: 280, flexShrink: 0, borderLeft: `1px solid ${c['border-divider']}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 40, padding: `0 ${sp.C}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: fw.medium, color: c['content-primary'] }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill={c['content-brand']}><path d="M8 1.5 L9.1 6.4 L14.5 8 L9.1 9.6 L8 14.5 L6.9 9.6 L1.5 8 L6.9 6.4 Z"/></svg>
          Data Agent
        </div>
        <div style={{ flex: 1, padding: sp.D, fontSize: 11, color: c['content-tertiary'], lineHeight: 1.5 }}>
          Ask the agent to make changes to your model, review quality, or test it.
        </div>
        <div style={{ padding: sp.C, borderTop: `1px solid ${c['border-divider']}` }}>
          <div style={{ height: 32, border: `1px solid ${c['border-default']}`, borderRadius: 6, padding: '0 10px', fontSize: fs.xs, color: c['content-tertiary'], display: 'flex', alignItems: 'center' }}>
            Ask the agent...
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── M6 + M7 — M4 inside a real canvas mock ───────────────────────────────────

const HeaderM6: React.FC<{ onCacheClick: () => void; onQualityClick: () => void }> = ({ onCacheClick, onQualityClick }) => (
  <>
    <div style={mainHeaderStyle}>
      <button style={{ width: 26, height: 26, padding: 0, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: c['content-secondary'], fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
      <ProjectIdentity />
      <div style={rightActionsStyle}>
        <StandardActions />
      </div>
    </div>
    <StatusStrip onCacheClick={onCacheClick} onQualityClick={onQualityClick} />
  </>
);

const HeaderM7: React.FC<{ onCacheClick: () => void; onQualityClick: () => void }> = ({ onCacheClick, onQualityClick }) => (
  <div style={{ ...mainHeaderStyle, height: 64 }}>
    <button style={{ width: 26, height: 26, padding: 0, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: c['content-secondary'], fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
    <ProjectIdentityWithStatus onCacheClick={onCacheClick} onQualityClick={onQualityClick} />
    <div style={rightActionsStyle}>
      <StandardActions />
    </div>
  </div>
);

// ── Single comparison page ───────────────────────────────────────────────────

interface VariantSpec {
  id: string;
  label: string;
  mentalModel: string;
  blurb: string;
  render: (handlers: { onCacheClick: () => void; onQualityClick: () => void; onCombinedClick: () => void }) => React.ReactNode;
}

const VARIANTS: VariantSpec[] = [
  {
    id: 'M1',
    label: 'Twin chips, side-by-side',
    mentalModel: 'Both first-class affordances. Flat list.',
    blurb: 'Cache and quality each get an action chip in the action group. Simplest mental model — they\'re both important things, both clickable. Tradeoff: header crowds fast as more state surfaces appear (prep, lineage, monitoring). Doesn\'t encode that quality is more urgent than cache.',
    render: (h) => <HeaderM1 onCacheClick={h.onCacheClick} onQualityClick={h.onQualityClick} />,
  },
  {
    id: 'M2',
    label: 'Property-side cache + action-side quality',
    mentalModel: 'Cache = ambient state. Quality = urgent action.',
    blurb: 'Treats cache and quality as fundamentally different kinds of state. Cache (ambient, rarely actioned on) sits as a quiet property next to v1, like Draft. Quality (urgent, demands review) lives in the action group near Publish. Encodes priority through placement, not just visual weight.',
    render: (h) => <HeaderM2 onCacheClick={h.onCacheClick} onQualityClick={h.onQualityClick} />,
  },
  {
    id: 'M3',
    label: 'Unified "Model status" chip',
    mentalModel: 'One status surface rolls up all model state.',
    blurb: 'Single chip "Live · 9 issues" opens a composite panel with both states. Tightest header. Scales as new state surfaces appear (prep, lineage). Tradeoff: hides severity behind one click — can a user tell at a glance if there\'s a problem?',
    render: (h) => <HeaderM3 onCombinedClick={h.onCombinedClick} />,
  },
  {
    id: 'M4',
    label: 'Status strip below header',
    mentalModel: 'Header is for actions. State has its own real estate.',
    blurb: 'Slim secondary strip lists all model state in a sentence-like form. Main header stays clean for action affordances (Share, Publish). Scales well — drop in monitoring, prep, last-validated freely. Tradeoff: extra vertical real estate, and the strip can feel like a place "things go to be ignored" if not visually distinct.',
    render: (h) => <HeaderM4 onCacheClick={h.onCacheClick} onQualityClick={h.onQualityClick} />,
  },
  {
    id: 'M5',
    label: 'Adaptive priority',
    mentalModel: 'Whichever state is most urgent dominates.',
    blurb: 'Quality has high-severity issues → quality chip is loud, cache shrinks to a tiny dot. When quality is clean, cache becomes the prominent chip. Header content responds to model state. Highest information value per pixel. Tradeoff: chip placement shifts as state changes — possibly disorienting.',
    render: (h) => <HeaderM5 onCacheClick={h.onCacheClick} onQualityClick={h.onQualityClick} />,
  },
];

// Canvas-embedded variants (M4 inside the real chrome)
const CANVAS_VARIANTS: Array<{
  id: string;
  label: string;
  mentalModel: string;
  blurb: string;
  Header: React.FC<{ onCacheClick: () => void; onQualityClick: () => void }>;
}> = [
  {
    id: 'M6',
    label: 'M4 in canvas — separate strip row',
    mentalModel: 'Status has its own row, isolated from actions and tabs.',
    blurb: 'M4 placed inside the actual canvas chrome. Three rows of header before content: main header (identity + actions), status strip, sub-header (Data toggle / centered tabs / Data Agent). Trades vertical real estate for clear separation. The strip uses background-subtle so it reads as state, not navigation.',
    Header: HeaderM6,
  },
  {
    id: 'M7',
    label: 'M4 in canvas — status as identity subtext',
    mentalModel: 'Status belongs to the model identity. Same line of thought as Draft / v1.',
    blurb: 'Project identity becomes two-line: "Campaign Performance v1" on top, "Live · 9 quality issues · Last validated 2h ago" beneath. No extra row. Tightest vertical footprint. Tradeoff: identity area gets visually heavier; status competes with name for attention.',
    Header: HeaderM7,
  },
];

// ── Combined modal (used by M3 only) ─────────────────────────────────────────

const CombinedStatusPanel: React.FC<{ onClose: () => void; onOpenCache: () => void; onOpenQuality: () => void }> = ({ onClose, onOpenCache, onOpenQuality }) => (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, fontFamily: ff.primary }}>
    <div style={{ width: 540, backgroundColor: c['background-base'], borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
      <div style={{ height: 56, padding: `0 ${sp.E}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Model status</div>
          <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 1 }}>Campaign Performance · v1</div>
        </div>
        <button onClick={onClose} style={{ marginLeft: 'auto', width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', color: c['content-secondary'], fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>×</button>
      </div>
      <div style={{ padding: sp.E, display: 'flex', flexDirection: 'column', gap: sp.C }}>
        {/* Cache row */}
        <button onClick={onOpenCache} style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: sp.D, border: `1px solid ${c['border-divider']}`, borderRadius: 8, backgroundColor: c['background-base'], cursor: 'pointer', textAlign: 'left' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = c['border-brand']}
          onMouseLeave={e => e.currentTarget.style.borderColor = c['border-divider']}
        >
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10B981', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>Live · Snowflake</div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>Every query hits the warehouse. Cache to reduce cost.</div>
          </div>
          <span style={{ fontSize: 11, color: c['content-tertiary'] }}>Configure →</span>
        </button>
        {/* Quality row */}
        <button onClick={onOpenQuality} style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: sp.D, border: `1px solid ${SEV_HIGH.chip}55`, borderRadius: 8, backgroundColor: SEV_HIGH.bg, cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: SEV_HIGH.chip, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: SEV_HIGH.fg }}>9 quality issues · 3 high</div>
            <div style={{ fontSize: fs.xs, color: SEV_HIGH.fg + 'BB', marginTop: 2 }}>Across 4 columns. Review and apply fixes before publishing.</div>
          </div>
          <span style={{ fontSize: 11, color: SEV_HIGH.fg }}>Review →</span>
        </button>
      </div>
    </div>
  </div>
);

// ── Comparison page export ───────────────────────────────────────────────────

export const CombinedDiscoverabilityCompare: React.FC = () => {
  const [cacheModalOpen, setCacheModalOpen] = useState(false);
  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [statusPanelOpen, setStatusPanelOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'], fontFamily: ff.primary, overflow: 'auto' }}>
      <div style={{ padding: '40px 48px 24px', maxWidth: 1100, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Playground · Combined model status</div>
        <div style={{ fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: 10 }}>Five IA strategies for cache + quality on one header</div>
        <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.6, maxWidth: 780 }}>
          The single header has to hold cache state, quality state, project identity, and primary actions (Share, Publish) — and prep / lineage / monitoring are coming. These five iterations test different mental models for how cache and quality relate to each other and to the rest of the chrome. The right answer depends on whether they\'re the same kind of thing (both "model state", flat list) or different kinds (one ambient, one urgent).
        </div>
      </div>

      <div style={{ padding: '0 48px 40px', display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 1100, width: '100%', boxSizing: 'border-box' }}>
        {VARIANTS.map(v => (
          <div key={v.id}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontFamily: ff.mono, fontWeight: fw.medium, color: c['content-tertiary'], letterSpacing: '0.06em', backgroundColor: c['background-subtle'], padding: '3px 7px', borderRadius: 4 }}>
                {v.id}
              </span>
              <span style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>{v.label}</span>
            </div>
            <div style={{ fontSize: fs.xs, fontStyle: 'italic', color: c['content-brand'], marginBottom: 8, fontWeight: fw.medium }}>
              {v.mentalModel}
            </div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.55, marginBottom: 14, maxWidth: 780 }}>{v.blurb}</div>
            <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              {v.render({
                onCacheClick: () => { setActiveVariant(v.id); setCacheModalOpen(true); },
                onQualityClick: () => { setActiveVariant(v.id); setQualityModalOpen(true); },
                onCombinedClick: () => { setActiveVariant(v.id); setStatusPanelOpen(true); },
              })}
            </div>
          </div>
        ))}
      </div>

      {/* In-canvas variants — chrome layered with tabs + body */}
      <div style={{ padding: '20px 48px 24px', maxWidth: 1100, width: '100%', boxSizing: 'border-box', borderTop: `1px solid ${c['border-divider']}`, marginTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>M4 inside the canvas</div>
        <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: 8 }}>How does it sit alongside tabs and content?</div>
        <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.6, maxWidth: 780 }}>
          M4 in isolation looks clean. The real test is how it stacks against the canvas sub-header (Data toggle, centered tabs, Data Agent toggle) and the body below. Two placements:
        </div>
      </div>

      <div style={{ padding: '0 48px 80px', display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 1100, width: '100%', boxSizing: 'border-box' }}>
        {CANVAS_VARIANTS.map(v => (
          <div key={v.id}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontFamily: ff.mono, fontWeight: fw.medium, color: c['content-tertiary'], letterSpacing: '0.06em', backgroundColor: c['background-subtle'], padding: '3px 7px', borderRadius: 4 }}>
                {v.id}
              </span>
              <span style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>{v.label}</span>
            </div>
            <div style={{ fontSize: fs.xs, fontStyle: 'italic', color: c['content-brand'], marginBottom: 8, fontWeight: fw.medium }}>
              {v.mentalModel}
            </div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.55, marginBottom: 14, maxWidth: 780 }}>{v.blurb}</div>
            <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <CanvasMock
                header={
                  <v.Header
                    onCacheClick={() => { setActiveVariant(v.id); setCacheModalOpen(true); }}
                    onQualityClick={() => { setActiveVariant(v.id); setQualityModalOpen(true); }}
                  />
                }
              />
            </div>
          </div>
        ))}
      </div>

      {cacheModalOpen && (
        <CacheModal
          onClose={() => { setCacheModalOpen(false); setActiveVariant(null); }}
          onConfirm={() => { setCacheModalOpen(false); setActiveVariant(null); }}
          triggeredBy={activeVariant ?? undefined}
        />
      )}
      {qualityModalOpen && (
        <QualityModal
          onClose={() => { setQualityModalOpen(false); setActiveVariant(null); }}
          onReviewWithAgent={() => { setQualityModalOpen(false); setActiveVariant(null); }}
          triggeredBy={activeVariant ?? undefined}
        />
      )}
      {statusPanelOpen && (
        <CombinedStatusPanel
          onClose={() => { setStatusPanelOpen(false); setActiveVariant(null); }}
          onOpenCache={() => { setStatusPanelOpen(false); setCacheModalOpen(true); }}
          onOpenQuality={() => { setStatusPanelOpen(false); setQualityModalOpen(true); }}
        />
      )}
    </div>
  );
};

// ── Style helpers ────────────────────────────────────────────────────────────

const mainHeaderStyle: React.CSSProperties = {
  height: HEADER_HEIGHT,
  backgroundColor: c['background-base'],
  borderBottom: `1px solid ${c['border-divider']}`,
  display: 'flex',
  alignItems: 'center',
  padding: `0 ${sp.D}px`,
  gap: sp.C,
  flexShrink: 0,
};

const rightActionsStyle: React.CSSProperties = {
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const iconBtn: React.CSSProperties = {
  width: 26, height: 26, padding: 4,
  border: `1px solid ${c['border-default']}`, borderRadius: 6,
  backgroundColor: 'transparent', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxSizing: 'border-box',
};

const publishBtn: React.CSSProperties = {
  height: 26, padding: '0 14px',
  border: 'none', borderRadius: 6,
  backgroundColor: '#2563EB', color: 'white',
  cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 7,
  fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary,
  boxSizing: 'border-box',
  transition: 'background-color 0.15s',
};
