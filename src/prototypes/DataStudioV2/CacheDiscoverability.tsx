// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  CACHE DISCOVERABILITY — Playground explorations                         ║
// ║                                                                          ║
// ║  5 header variants, all sharing one CacheModal. Backed by                ║
// ║  research/caching-discoverability.md — model-level trigger that opens    ║
// ║  an in-canvas agentic workflow with smart per-table defaults.            ║
// ║                                                                          ║
// ║  Each variant tests a different placement / framing of the indicator     ║
// ║  in the canvas chrome alongside Publish / Share. Click → same modal.     ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import React, { useState } from 'react';
import { c, sp, ff, fs, fw, ts, HEADER_HEIGHT } from './styles';
import type { ProjectState } from './index';

// ── Cache modal config ───────────────────────────────────────────────────────

type Cadence = 'hourly' | 'daily' | 'weekly' | 'never';

interface TableCacheConfig {
  table: string;
  kind: 'fact' | 'dim' | 'static' | 'streaming';
  rows: string;
  size: string;
  enabled: boolean;
  cadence: Cadence;
  reason: string;
}

const DEFAULT_CONFIG: TableCacheConfig[] = [
  { table: 'orders',         kind: 'fact',      rows: '1.2M',  size: '48 GB', enabled: true,  cadence: 'hourly', reason: 'Fact · frequent updates'  },
  { table: 'campaigns',      kind: 'fact',      rows: '8.4K',  size: '12 GB', enabled: true,  cadence: 'hourly', reason: 'Fact · frequent updates'  },
  { table: 'users',          kind: 'dim',       rows: '125K',  size: '8 GB',  enabled: true,  cadence: 'weekly', reason: 'Dim · slow-changing'      },
  { table: 'products',       kind: 'dim',       rows: '4.2K',  size: '2 GB',  enabled: true,  cadence: 'weekly', reason: 'Dim · slow-changing'      },
  { table: 'live_inventory', kind: 'streaming', rows: '—',     size: '—',     enabled: false, cadence: 'never',  reason: 'Streaming · skip caching' },
];

// ── Shared cache modal ───────────────────────────────────────────────────────

type CacheMode = 'model' | 'tables';
type ModelRefresh = 'hourly' | 'daily' | 'weekly';
const LOOKUP_OPTIONS = ['3 months', '6 months', '1 year', '2 years', 'All history'] as const;
type LookupPeriod = typeof LOOKUP_OPTIONS[number];
const TIME_OPTIONS = ['12:00 AM', '3:00 AM', '6:00 AM', '9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM'] as const;
type RefreshTime = typeof TIME_OPTIONS[number];
const TIMEZONE_OPTIONS = ['IST (UTC+5:30)', 'UTC', 'PST (UTC-8)', 'EST (UTC-5)', 'CET (UTC+1)'] as const;
type Timezone = typeof TIMEZONE_OPTIONS[number];

export const CacheModal: React.FC<{
  onClose: () => void;
  onConfirm: () => void;
  onDisable?: () => void;
  applied?: boolean;
  triggeredBy?: string;
}> = ({ onClose, onConfirm, onDisable, applied = false, triggeredBy }) => {
  const [mode, setMode] = useState<CacheMode>('model');
  const [modelRefresh, setModelRefresh] = useState<ModelRefresh>('daily');
  const [time, setTime] = useState<RefreshTime>('9:00 AM');
  const [timezone, setTimezone] = useState<Timezone>('IST (UTC+5:30)');
  const [lookup, setLookup] = useState<LookupPeriod>('6 months');
  const [tableConfig, setTableConfig] = useState<TableCacheConfig[]>(DEFAULT_CONFIG);

  const setCadence = (table: string, cadence: Cadence) =>
    setTableConfig(c => c.map(t => t.table === table ? { ...t, cadence } : t));
  const toggleTable = (table: string) =>
    setTableConfig(c => c.map(t => t.table === table ? { ...t, enabled: !t.enabled } : t));

  // Shared form body — used in both initial form view and applied/edit view
  const renderForm = () => (
    <>
      {/* Mode picker — two radio cards */}
      <ModalSection title="Caching mode">
        <ModeCard
          selected={mode === 'model'}
          onClick={() => setMode('model')}
          title="Cache model"
          badge="Recommended"
          description="All tables cached together with the same refresh schedule. Smart defaults applied — best for most cases."
        />
        <ModeCard
          selected={mode === 'tables'}
          onClick={() => setMode('tables')}
          title="Cache by tables"
          description="Pick which tables to cache and set per-table refresh schedules."
        />
      </ModalSection>

      {/* Mode-specific config */}
      {mode === 'model' ? (
        <ModalSection title="Frequency" subtitle="How often the cache refreshes from the warehouse.">
          <FormRow label="Frequency">
            <select
              value={modelRefresh}
              onChange={e => setModelRefresh(e.target.value as ModelRefresh)}
              style={selectStyle}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </FormRow>
          {modelRefresh !== 'hourly' && (
            <>
              <FormRow label="Time">
                <select value={time} onChange={e => setTime(e.target.value as RefreshTime)} style={selectStyle}>
                  {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormRow>
              <FormRow label="Time zone">
                <select value={timezone} onChange={e => setTimezone(e.target.value as Timezone)} style={selectStyle}>
                  {TIMEZONE_OPTIONS.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </FormRow>
            </>
          )}
        </ModalSection>
      ) : (
        <ModalSection title="Tables">
          {tableConfig.map(t => (
            <div key={t.table} style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px 0`, borderBottom: `1px solid ${c['border-divider']}`, opacity: t.enabled ? 1 : 0.55 }}>
              <input
                type="checkbox"
                checked={t.enabled}
                onChange={() => toggleTable(t.table)}
                disabled={t.kind === 'streaming'}
                style={{ width: 14, height: 14, cursor: t.kind === 'streaming' ? 'not-allowed' : 'pointer', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{t.table}</div>
                <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>{t.kind} · {t.rows !== '—' ? `${t.rows} rows` : t.reason}</div>
              </div>
              <select
                value={t.cadence}
                onChange={e => setCadence(t.table, e.target.value as Cadence)}
                disabled={!t.enabled}
                style={{ ...selectStyle, cursor: t.enabled ? 'pointer' : 'not-allowed' }}
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="never">No refresh</option>
              </select>
            </div>
          ))}
        </ModalSection>
      )}

      {/* Lookup period */}
      <ModalSection title="Lookup period" subtitle="How much historical data is included in the cache. Older queries route to the live warehouse.">
        <FormRow label="Time period">
          <select
            value={lookup}
            onChange={e => setLookup(e.target.value as LookupPeriod)}
            style={selectStyle}
          >
            {LOOKUP_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormRow>
      </ModalSection>
    </>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, fontFamily: ff.primary }}>
      <div style={{ width: 600, maxHeight: '85vh', backgroundColor: c['background-base'], borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,0.18)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Modal header — title only */}
        <div style={{ height: 52, padding: `0 ${sp.E}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Model caching</div>
          {triggeredBy && <span style={{ marginLeft: 10, fontSize: fs.xs, color: c['content-tertiary'] }}>· opened from {triggeredBy}</span>}
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', color: c['content-secondary'], fontSize: 20, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >×</button>
        </div>

        {applied ? (
          // ── Applied view — same form, editable, with green banner + Save changes ──
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: sp.E }}>
              <div style={{ display: 'flex', gap: sp.C, marginBottom: sp.E, padding: sp.D, backgroundColor: '#F0FDF4', borderRadius: 8, border: '1px solid #BBF7D0' }}>
                <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="#15803D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="9" cy="9" r="7"/>
                  <path d="M5.5 9l2.5 2.5 4.5-5"/>
                </svg>
                <div style={{ fontSize: fs.sm, color: '#14532D', lineHeight: 1.5 }}>
                  Caching is active. Queries are running on ThoughtSpot's store instead of the warehouse.
                </div>
              </div>
              {renderForm()}
            </div>
            <div style={{ height: 60, padding: `0 ${sp.E}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {onDisable && (
                <button onClick={onDisable} style={{ height: 32, padding: '0 14px', border: '1px solid #FECACA', borderRadius: 6, backgroundColor: '#FEF2F2', cursor: 'pointer', fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary, color: '#B91C1C' }}>
                  Disable cache
                </button>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: sp.B }}>
                <button onClick={onClose} style={{ height: 32, padding: '0 14px', border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary, color: c['content-primary'] }}>
                  Close
                </button>
                <button onClick={onConfirm} style={{ height: 32, padding: '0 16px', border: 'none', borderRadius: 6, backgroundColor: '#2563EB', color: 'white', cursor: 'pointer', fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563EB'}
                >
                  Save changes
                </button>
              </div>
            </div>
          </>
        ) : (
          // ── Form view (not yet cached) ─────────────────────────────────
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: sp.E }}>

              {renderForm()}

              {/* Estimated savings — insight line with lightbulb */}
              <div style={{ marginTop: sp.D, padding: `${sp.C}px ${sp.D}px`, backgroundColor: '#FEFCE8', border: '1px solid #FEF08A', borderRadius: 6, fontSize: fs.xs, color: c['content-secondary'], display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.5 }}>
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="#A16207" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <path d="M9 2C6 2 4 4 4 7c0 1.8.9 3.2 2 4v2c0 .6.4 1 1 1h4c.6 0 1-.4 1-1v-2c1.1-.8 2-2.2 2-4 0-3-2-5-5-5z"/>
                  <line x1="6.5" y1="16" x2="11.5" y2="16"/>
                </svg>
                <span style={{ color: '#713F12' }}>
                  Estimated savings <strong style={{ color: '#713F12', fontWeight: fw.semibold }}>$420 per month</strong>, assuming an average of 100 queries per day on this model.
                </span>
              </div>
            </div>

            <div style={{ height: 60, padding: `0 ${sp.E}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: sp.B, flexShrink: 0 }}>
              <button onClick={onClose} style={{ height: 32, padding: '0 14px', border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary, color: c['content-primary'] }}>
                Cancel
              </button>
              <button onClick={onConfirm} style={{ height: 32, padding: '0 16px', border: 'none', borderRadius: 6, backgroundColor: '#2563EB', color: 'white', cursor: 'pointer', fontSize: fs.sm, fontWeight: fw.medium, fontFamily: ff.primary }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563EB'}
              >
                Cache the model
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Mode picker / form helpers ───────────────────────────────────────────────

const ModeCard: React.FC<{ selected: boolean; onClick: () => void; title: string; description: string; badge?: string }> = ({ selected, onClick, title, description, badge }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', textAlign: 'left',
      display: 'flex', alignItems: 'flex-start', gap: sp.C,
      padding: sp.D, marginBottom: sp.B,
      border: `1px solid ${selected ? c['border-brand'] : c['border-default']}`,
      borderRadius: 8,
      backgroundColor: c['background-base'],
      cursor: 'pointer',
      fontFamily: ff.primary,
    }}
  >
    <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${selected ? c['border-brand'] : c['border-default']}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
      {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c['content-brand'] }} />}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{title}</span>
        {badge && <span style={{ fontSize: 10, fontWeight: fw.medium, padding: '1px 6px', borderRadius: 3, backgroundColor: '#DCFCE7', color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{badge}</span>}
      </div>
      <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.5 }}>{description}</div>
    </div>
  </button>
);

const FormRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.B}px 0` }}>
    <span style={{ fontSize: fs.sm, color: c['content-primary'], minWidth: 110 }}>{label}</span>
    {children}
  </div>
);

const selectStyle: React.CSSProperties = {
  height: 32, padding: '0 10px',
  border: `1px solid ${c['border-default']}`, borderRadius: 6,
  fontSize: fs.sm, fontFamily: ff.primary,
  backgroundColor: c['background-base'], color: c['content-primary'],
  cursor: 'pointer',
  minWidth: 160,
};

// ── Modal sub-components ─────────────────────────────────────────────────────

const ModalSection: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <div style={{ marginBottom: sp.E }}>
    <div style={{ marginBottom: sp.C }}>
      <div style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{title}</div>
      {subtitle && <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

// ── Header building blocks (shared right-side actions) ──────────────────────

const ProjectIdentity: React.FC<{ project?: ProjectState }> = ({ project }) => {
  const name = project?.name ?? 'Campaign Performance';
  const version = project?.publishedVersion ?? 1;
  return (
    <>
      <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'] }}>{name}</span>
      <span style={{ fontSize: 11, fontWeight: fw.regular, color: c['content-secondary'] }}>v{version}</span>
    </>
  );
};

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

// ── Five header variants ─────────────────────────────────────────────────────

// CD1 — Status as model property (next to name/version)
// Frames cache as an attribute of the model, like Draft/v1. Subtlest variant.
const HeaderCD1: React.FC<{ project?: ProjectState; onCacheClick: () => void }> = ({ project, onCacheClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity project={project} />
    <button onClick={onCacheClick}
      style={{ height: 22, padding: '0 8px', border: 'none', borderRadius: 11, backgroundColor: 'transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: ff.primary, color: c['content-secondary'] }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
      Live · Snowflake
    </button>
    <div style={rightActionsStyle}>
      <StandardActions />
    </div>
  </div>
);

// CD2 — Action chip with explicit verb
// Reads as a CTA. Loudest variant. Prone to feeling pushy if user isn't ready.
const HeaderCD2: React.FC<{ project?: ProjectState; onCacheClick: () => void }> = ({ project, onCacheClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity project={project} />
    <div style={rightActionsStyle}>
      <button onClick={onCacheClick}
        style={{ height: 26, padding: '0 12px', border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary, color: c['content-primary'] }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = c['background-base']}
      >
        <svg width="12" height="12" viewBox="0 0 18 18" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 1.5L11.25 6L16 6.75L12.5 10L13.5 14.5L9 12.25L4.5 14.5L5.5 10L2 6.75L6.75 6Z"/>
        </svg>
        Cache model
      </button>
      <StandardActions />
    </div>
  </div>
);

// CD3 — Split state + action
// State (always visible) + dedicated cache button. Sara always sees what's
// happening; the action is always one click away.
const HeaderCD3: React.FC<{ project?: ProjectState; onCacheClick: () => void }> = ({ project, onCacheClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity project={project} />
    <div style={rightActionsStyle}>
      <span style={{ fontSize: 11, color: c['content-secondary'], fontFamily: ff.primary, display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
        Live querying Snowflake
      </span>
      <button onClick={onCacheClick} style={secondaryBtn}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = c['background-base']}
      >
        Cache
      </button>
      <div style={{ width: 1, height: 20, backgroundColor: c['border-divider'], flexShrink: 0 }} />
      <StandardActions />
    </div>
  </div>
);

// CD4 — Replace warehouse icon with state chip (current chrome's nearest mutation)
// Chip with caret. Click opens modal. Smallest visual change from today's header.
const HeaderCD4: React.FC<{ project?: ProjectState; onCacheClick: () => void }> = ({ project, onCacheClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity project={project} />
    <div style={rightActionsStyle}>
      <button onClick={onCacheClick}
        style={{ height: 26, padding: '0 10px', border: `1px solid ${c['border-default']}`, borderRadius: 6, backgroundColor: c['background-base'], cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontFamily: ff.primary, color: c['content-primary'] }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = c['background-subtle']}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = c['background-base']}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
        Live · Snowflake
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round"><path d="M3 5l3 3 3-3"/></svg>
      </button>
      <StandardActions />
    </div>
  </div>
);

// CD5 — Status with cost cue (proactive nudge)
// Tests the "should the chip ever proactively flag heavy queries?" question.
// Cost number lives in the chip itself. Loudest discoverability variant.
const HeaderCD5: React.FC<{ project?: ProjectState; onCacheClick: () => void }> = ({ project, onCacheClick }) => (
  <div style={mainHeaderStyle}>
    <ProjectIdentity project={project} />
    <div style={rightActionsStyle}>
      <button onClick={onCacheClick}
        style={{ height: 26, padding: '0 10px', border: `1px solid #FCD34D`, borderRadius: 6, backgroundColor: '#FFFBEB', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontFamily: ff.primary, color: '#92400E' }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF3C7'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFBEB'}
      >
        <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="#92400E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 1.5L1.5 15.75H16.5L9 1.5Z"/>
          <line x1="9" y1="7" x2="9" y2="10.5"/>
          <circle cx="9" cy="13" r="0.5" fill="#92400E"/>
        </svg>
        Live · ~$48 this week
      </button>
      <StandardActions />
    </div>
  </div>
);

// ── Single comparison page — all 5 variants visible at once ──────────────────

interface VariantSpec {
  id: string;
  label: string;
  blurb: string;
  Header: React.FC<{ project?: ProjectState; onCacheClick: () => void }>;
}

const VARIANTS: VariantSpec[] = [
  { id: 'CD1', label: 'Property chip',         blurb: 'Cache state framed as a model attribute, sitting next to the version badge. Subtlest. Risks being missed.', Header: HeaderCD1 },
  { id: 'CD2', label: 'Action chip',           blurb: '"Cache model" reads as a CTA in the action group next to Share / Publish. Loud. Can feel pushy on a fresh model.', Header: HeaderCD2 },
  { id: 'CD3', label: 'Split state + action',  blurb: 'Always-visible "Live querying Snowflake" label + dedicated Cache button. State and action separated. Most explicit.', Header: HeaderCD3 },
  { id: 'CD4', label: 'State chip + caret',    blurb: "Replaces today's warehouse icon with a labeled chip. Smallest visual change from current chrome.", Header: HeaderCD4 },
  { id: 'CD5', label: 'Cost-cue nudge',        blurb: 'Amber chip surfaces weekly cost. Tests "should the chip ever proactively flag heavy queries?" Risk: feels naggy.', Header: HeaderCD5 },
];

export const CacheDiscoverabilityCompare: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState<string | null>(null);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', backgroundColor: c['background-sunken'], fontFamily: ff.primary, overflow: 'auto' }}>

      {/* Page header */}
      <div style={{ padding: '40px 48px 24px', maxWidth: 1100, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 11, fontWeight: fw.medium, color: c['content-tertiary'], textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Playground · Cache discoverability</div>
        <div style={{ fontSize: 22, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: 10 }}>Five header variants for surfacing cache state</div>
        <div style={{ fontSize: fs.sm, color: c['content-secondary'], lineHeight: 1.6, maxWidth: 760 }}>
          All five variants share the same modal — clicking any chip below opens the same in-canvas caching workflow with smart per-table defaults. Compare placement, framing, and visual weight. See <code style={{ fontSize: fs.xs, padding: '1px 6px', backgroundColor: c['background-subtle'], borderRadius: 4 }}>research/caching-discoverability.md</code> for the reasoning.
        </div>
      </div>

      {/* Variant stack */}
      <div style={{ padding: '0 48px 80px', display: 'flex', flexDirection: 'column', gap: 36, maxWidth: 1100, width: '100%', boxSizing: 'border-box' }}>
        {VARIANTS.map(v => (
          <div key={v.id}>
            {/* Label row */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontFamily: ff.mono, fontWeight: fw.medium, color: c['content-tertiary'], letterSpacing: '0.06em', backgroundColor: c['background-subtle'], padding: '3px 7px', borderRadius: 4 }}>
                {v.id}
              </span>
              <span style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>{v.label}</span>
            </div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.55, marginBottom: 14, maxWidth: 760 }}>{v.blurb}</div>

            {/* The header chrome */}
            <div style={{ border: `1px solid ${c['border-divider']}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <v.Header onCacheClick={() => { setActiveVariant(v.id); setModalOpen(true); }} />
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <CacheModal
          onClose={() => { setModalOpen(false); setActiveVariant(null); }}
          onConfirm={() => { setModalOpen(false); setActiveVariant(null); }}
          triggeredBy={activeVariant ?? undefined}
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

const secondaryBtn: React.CSSProperties = {
  height: 26, padding: '0 12px',
  border: `1px solid ${c['border-default']}`, borderRadius: 6,
  backgroundColor: c['background-base'], cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6,
  fontSize: 12, fontWeight: fw.medium, fontFamily: ff.primary,
  color: c['content-primary'], boxSizing: 'border-box',
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

const tabBtn = (active: boolean): React.CSSProperties => ({
  height: 28, padding: '0 10px', gap: 6,
  border: `1px solid ${active ? c['border-brand'] : c['border-default']}`,
  borderRadius: 6,
  backgroundColor: active ? c['background-information'] : 'transparent',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center',
  fontSize: fs.xs, fontWeight: fw.medium, fontFamily: ff.primary,
  color: active ? c['content-brand'] : c['content-secondary'],
  boxSizing: 'border-box',
});
