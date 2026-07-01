import React, { useState, useEffect } from 'react';
import { c, sp, fs, fw, ff } from '../styles';
import { Connection, ConnectionType } from '../data/mockData';

// ─── Screen state machine (mirrors Connections.dc.html) ───────────────────────
type Screen =
  | 'type-picker'
  | 'cdw-source' | 'cdw-configure' | 'cdw-tables'
  | 'semantic-source' | 'semantic-configure' | 'semantic-snowflake'
  | 'apps-source' | 'apps-connect'
  | 'success';

// Navigation is source-dependent for semantic — resolved at runtime in handleNext/handleBack
const NEXT_STATIC: Partial<Record<Screen, Screen>> = {
  'cdw-source': 'cdw-configure',
  'cdw-configure': 'cdw-tables',
  'cdw-tables': 'success',
  'semantic-snowflake': 'success',
  'apps-source': 'apps-connect',
  'apps-connect': 'success',
};
function nextScreen(screen: Screen, selectedSource: string | null): Screen | undefined {
  if (screen === 'semantic-source')    return selectedSource === 'Snowflake Cortex' ? 'semantic-snowflake' : 'semantic-configure';
  if (screen === 'semantic-configure') return selectedSource === 'dbt Semantic Layer' ? 'semantic-snowflake' : 'success';
  return NEXT_STATIC[screen];
}
function backScreen(screen: Screen, selectedSource: string | null): Screen | undefined {
  if (screen === 'semantic-snowflake') return selectedSource === 'Snowflake Cortex' ? 'semantic-source' : 'semantic-configure';
  const map: Partial<Record<Screen, Screen>> = {
    'cdw-source': 'type-picker', 'cdw-configure': 'cdw-source', 'cdw-tables': 'cdw-configure',
    'semantic-source': 'type-picker', 'semantic-configure': 'semantic-source',
    'apps-source': 'type-picker', 'apps-connect': 'apps-source',
  };
  return map[screen];
}

const TITLE: Record<Screen, string> = {
  'type-picker': 'New connection',
  'cdw-source': 'Cloud data warehouse',
  'cdw-configure': 'Cloud data warehouse',
  'cdw-tables': 'Cloud data warehouse',
  'semantic-source': 'Semantic layer',
  'semantic-configure': 'Semantic layer',
  'semantic-snowflake': 'Semantic layer',
  'apps-source': 'Business apps',
  'apps-connect': 'Business apps',
  'success': 'Connection ready',
};
const CONFIGURE_SCREENS: Screen[] = ['cdw-configure', 'semantic-configure', 'apps-connect'];
const SOURCE_SCREENS: Screen[] = ['cdw-source', 'semantic-source', 'apps-source'];

// ─── Token shortcuts ──────────────────────────────────────────────────────────
const bBase  = c['background-base'];
const bSunk  = c['background-sunken'];
const fg1    = c['content-primary'];
const fg2    = c['content-secondary'];
const fg3    = c['content-tertiary'];
const bdiv   = c['border-divider'];
const bdef   = c['border-default'];
const brand  = c['content-brand'];
const green  = c['content-success'];

// ─── Form style helpers ───────────────────────────────────────────────────────
const labelSt: React.CSSProperties = { fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary };
const inputSt: React.CSSProperties = {
  height: 36, borderRadius: 6, border: `1px solid ${bdef}`,
  padding: `0 ${sp.C}px`, fontSize: fs.sm, color: fg1,
  background: bBase, outline: 'none', width: '100%', fontFamily: ff.primary,
  boxSizing: 'border-box',
};
const hintSt: React.CSSProperties = { fontSize: 11, color: fg2, fontFamily: ff.primary, marginTop: 4, display: 'flex', alignItems: 'flex-start', gap: 5 };

// ─── TopBar ───────────────────────────────────────────────────────────────────
const TopBar: React.FC<{ title: string; showBack: boolean; onBack: () => void; onClose: () => void }> =
  ({ title, showBack, onBack, onClose }) => (
    <div style={{
      height: 56, flexShrink: 0, position: 'relative',
      background: bBase, borderBottom: `1px solid ${bdiv}`,
      display: 'flex', alignItems: 'center', padding: `0 ${sp.H}px`,
    }}>
      <div style={{ position: 'absolute', left: sp.H }}>
        {showBack && (
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: `6px ${sp.C}px`,
            background: 'none', border: 'none', cursor: 'pointer',
            color: fg2, fontFamily: ff.primary, fontSize: fs.sm, borderRadius: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>
        )}
      </div>
      <div style={{ flex: 1, textAlign: 'center' }}>
        <span style={{ fontSize: 15, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary }}>{title}</span>
      </div>
      <div style={{ position: 'absolute', right: sp.H }}>
        <button onClick={onClose} aria-label="Close" style={{
          width: 32, height: 32, padding: 0, border: 'none', background: 'transparent',
          borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: fg2, transition: 'background 150ms, color 150ms',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = bSunk; (e.currentTarget as HTMLButtonElement).style.color = fg1; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = fg2; }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );

// ─── StepBar ──────────────────────────────────────────────────────────────────
type StepStatus = 'inactive' | 'active' | 'done';

function getStepBar(screen: Screen, selectedSource: string | null): { show: boolean; steps: string[]; states: StepStatus[] } {
  if (screen.startsWith('cdw-')) {
    const order: Screen[] = ['cdw-source', 'cdw-configure', 'cdw-tables'];
    const idx = order.indexOf(screen);
    return {
      show: true,
      steps: ['Choose warehouse', 'Configure', 'Select schemas'],
      states: [0, 1, 2].map(i => i === idx ? 'active' : i < idx ? 'done' : 'inactive'),
    };
  }
  if (screen.startsWith('semantic-')) {
    // Step sequence varies by source
    const order: Screen[] =
      selectedSource === 'Snowflake Cortex'
        ? ['semantic-source', 'semantic-snowflake']
        : selectedSource === 'dbt Semantic Layer'
          ? ['semantic-source', 'semantic-configure', 'semantic-snowflake']
          : ['semantic-source', 'semantic-configure']; // Databricks Unity Catalog
    const labels: Partial<Record<Screen, string>> = {
      'semantic-source': 'Choose source',
      'semantic-configure': 'Configure',
      'semantic-snowflake': 'Snowflake connection',
    };
    const idx = order.indexOf(screen);
    return {
      show: true,
      steps: order.map(s => labels[s]!),
      states: order.map((_, i) => i === idx ? 'active' : i < idx ? 'done' : 'inactive'),
    };
  }
  if (screen.startsWith('apps-')) {
    const order: Screen[] = ['apps-source', 'apps-connect'];
    const idx = order.indexOf(screen);
    return {
      show: true,
      steps: ['Choose app', 'Connect'],
      states: [0, 1].map(i => i === idx ? 'active' : i < idx ? 'done' : 'inactive'),
    };
  }
  return { show: false, steps: [], states: [] };
}

const StepBar: React.FC<{ steps: string[]; states: StepStatus[] }> = ({ steps, states }) => (
  <div style={{
    height: 52, flexShrink: 0, background: bBase, borderBottom: `1px solid ${bdiv}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${sp.H}px`,
  }}>
    {steps.map((label, i) => (
      <React.Fragment key={label}>
        {i > 0 && <div style={{ width: 64, height: 1, background: bdiv, margin: `0 ${sp.C}px`, flexShrink: 0 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: fw.medium, fontFamily: ff.primary,
            background: states[i] === 'active' ? brand : states[i] === 'done' ? green : 'transparent',
            border: states[i] === 'inactive' ? `1.5px solid ${bdiv}` : 'none',
            color: states[i] === 'active' ? 'white' : states[i] === 'inactive' ? fg2 : 'transparent',
            transition: 'background 200ms',
          }}>
            {states[i] === 'done'
              ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : i + 1}
          </div>
          <span style={{
            fontSize: 13, fontFamily: ff.primary, whiteSpace: 'nowrap',
            color: states[i] === 'active' ? fg1 : fg2,
            fontWeight: states[i] === 'active' ? fw.medium : 400,
          }}>{label}</span>
        </div>
      </React.Fragment>
    ))}
  </div>
);

// ─── SourceCard (reusable for CDW / Semantic / Apps source grids) ─────────────
const SourceCard: React.FC<{
  icon: React.ReactNode; name: string; desc: string; selected: boolean; onClick: () => void;
}> = ({ icon, name, desc, selected, onClick }) => (
  <div onClick={onClick} style={{
    background: selected ? 'rgba(39,112,239,0.04)' : bBase,
    border: `1.5px solid ${selected ? brand : bdiv}`,
    borderRadius: 16, padding: sp.E, cursor: 'pointer',
    display: 'flex', flexDirection: 'column', gap: sp.B,
    boxShadow: selected ? '0 0 0 3px rgba(39,112,239,0.1)' : undefined,
    transition: 'border-color 150ms, box-shadow 150ms',
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 8, background: bSunk, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary }}>{name}</div>
    <div style={{ fontSize: 11, color: fg2, fontFamily: ff.primary }}>{desc}</div>
  </div>
);

// ─── TypePickerScreen ─────────────────────────────────────────────────────────
const TypeCard: React.FC<{
  iconBg: string; icon: React.ReactNode;
  title: string; desc: string; chips: string[]; onClick: () => void;
}> = ({ iconBg, icon, title, desc, chips, onClick }) => (
  <div
    onClick={onClick}
    style={{ background: bBase, border: `1.5px solid ${bdiv}`, borderRadius: 16, padding: sp.F, cursor: 'pointer', position: 'relative', flex: 1, transition: 'border-color 150ms, box-shadow 150ms' }}
    onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(39,112,239,0.4)'; el.style.boxShadow = '0 4px 16px rgba(39,112,239,0.08)'; }}
    onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = bdiv; el.style.boxShadow = ''; }}
  >
    <div style={{ height: 22, marginBottom: sp.D }} />
    <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: sp.D }}>{icon}</div>
    <div style={{ fontSize: 16, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: fs.sm, color: fg2, fontFamily: ff.primary, lineHeight: 1.6, marginBottom: sp.E, minHeight: 52 }}>{desc}</div>
    <div style={{ height: 1, background: bdiv, marginBottom: sp.D }} />
    <div style={{ fontSize: 11, color: fg2, fontFamily: ff.primary, marginBottom: sp.B }}>Works with</div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {chips.map(ch => (
        <span key={ch} style={{ fontSize: 11, fontWeight: fw.medium, padding: '3px 9px', borderRadius: 4, border: `1px solid ${bdiv}`, background: bSunk, color: fg2, fontFamily: ff.primary }}>{ch}</span>
      ))}
    </div>
  </div>
);

const TypePickerScreen: React.FC<{ onSelect: (s: 'cdw' | 'semantic' | 'app') => void }> = ({ onSelect }) => (
  <div style={{ background: bSunk, minHeight: '100%' }}>
    <div style={{ maxWidth: 960, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
      <div style={{ marginBottom: sp.F }}>
        <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
          Choose a connection type
        </h2>
        <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
          Tell us what kind of data you're bringing in — we'll guide the setup from there.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: sp.E }}>
        <TypeCard
          iconBg="#EBF2FF"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="5" rx="8" ry="3" stroke="#2770EF" strokeWidth="1.75"/><path d="M4 5v6c0 1.65 3.58 3 8 3s8-1.35 8-3V5" stroke="#2770EF" strokeWidth="1.75"/><path d="M4 11v6c0 1.65 3.58 3 8 3s8-1.35 8-3v-6" stroke="#2770EF" strokeWidth="1.75"/></svg>}
          title="Cloud data warehouse"
          desc="Import raw tables to build models and search your data with natural language."
          chips={['Snowflake', 'BigQuery', 'Databricks', 'Redshift', '+2']}
          onClick={() => onSelect('cdw')}
        />
        <TypeCard
          iconBg="#F2EEFF"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="4.5" r="2.5" stroke="#8C62F5" strokeWidth="1.75"/><circle cx="4.5" cy="18" r="2.5" stroke="#8C62F5" strokeWidth="1.75"/><circle cx="19.5" cy="18" r="2.5" stroke="#8C62F5" strokeWidth="1.75"/><path d="M12 7v5.5M12 12.5L5.8 16.3M12 12.5l6.2 3.8" stroke="#8C62F5" strokeWidth="1.75" strokeLinecap="round"/></svg>}
          title="Semantic layer"
          desc="Bring in pre-modeled metrics, dimensions and business rules. Skip the model-building step entirely."
          chips={['dbt Semantic Layer', 'Snowflake Cortex', 'Databricks Unity']}
          onClick={() => onSelect('semantic')}
        />
        <TypeCard
          iconBg="#E6F9FB"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#1CA7B3" strokeWidth="1.75"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#1CA7B3" strokeWidth="1.75"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#1CA7B3" strokeWidth="1.75"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="#1CA7B3" strokeWidth="1.75"/></svg>}
          title="Business apps"
          desc="Connect SaaS tools and REST APIs to pull operational data directly into ThoughtSpot."
          chips={['Salesforce', 'Mixpanel', 'HubSpot', 'Stripe', '+1']}
          onClick={() => onSelect('app')}
        />
      </div>
    </div>
  </div>
);

// ─── CDW Source Screen ────────────────────────────────────────────────────────
const CDW_SOURCES = [
  { id: 'Snowflake',     desc: 'Cloud data platform',         icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 4l2.8 5.1L16 14.2l-2.8-5.1z" fill="#29B5E8"/><path d="M16 17.8l2.8 5.1L16 28l-2.8-5.1z" fill="#29B5E8"/><path d="M4 16l5.1-2.8 5.1 2.8-5.1 2.8z" fill="#29B5E8"/><path d="M17.8 16l5.1-2.8L28 16l-5.1 2.8z" fill="#29B5E8"/><path d="M6.7 6.7l5.4 1.4 1.4 5.4-5.4-1.4z" fill="#29B5E8" opacity="0.6"/><path d="M18.5 18.5l5.4 1.4 1.4 5.4-5.4-1.4z" fill="#29B5E8" opacity="0.6"/><path d="M6.7 25.3l1.4-5.4 5.4-1.4-1.4 5.4z" fill="#29B5E8" opacity="0.6"/><path d="M18.5 13.5l1.4-5.4 5.4-1.4-1.4 5.4z" fill="#29B5E8" opacity="0.6"/></svg> },
  { id: 'Databricks',   desc: 'Unified analytics platform',  icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 4l12 7-12 5-12-5z" fill="#FF6D00"/><path d="M4 15l12 5 12-5-12 7z" fill="#FF8F00"/><path d="M4 20l12 5 12-5-12 7z" fill="#FF6D00" opacity="0.7"/></svg> },
  { id: 'BigQuery',     desc: 'Google Cloud analytics',      icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 5L4 23h24z" fill="#4285F4" opacity="0.18"/><path d="M16 5L4 23h12V5z" fill="#4285F4"/><path d="M28 23L16 5v18h12z" fill="#3367D6"/><circle cx="22" cy="23.5" r="5" fill="#4285F4"/><path d="M20 23.5h4M22 21.5v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: 'Redshift',     desc: 'Amazon Web Services',         icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 4l11 6.5v11L16 28 5 21.5v-11z" fill="#E41D3D" opacity="0.1"/><path d="M16 4l11 6.5-11 5.5-11-5.5z" fill="#E41D3D"/><path d="M5 10.5v11L16 28V16z" fill="#C7152D"/><path d="M27 10.5v11L16 28V16z" fill="#E41D3D" opacity="0.8"/></svg> },
  { id: 'Azure Synapse',desc: 'Microsoft Azure',             icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M4 24L16 5l12 19H4z" fill="#0078D4" opacity="0.14"/><path d="M4 24L16 8v16H4z" fill="#0078D4"/><path d="M28 24L16 8v16h12z" fill="#004C8C"/></svg> },
  { id: 'PostgreSQL',   desc: 'Open-source relational',      icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="13" rx="9" ry="8" stroke="#336791" strokeWidth="1.75" fill="#336791" fillOpacity="0.08"/><path d="M7 13c0 5.5 2.5 11 9 13" stroke="#336791" strokeWidth="1.5" strokeLinecap="round"/><path d="M25 13c0 5.5-2.5 11-9 13" stroke="#336791" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/><path d="M22 7c2.5-1.5 5.5 0 5.5 4.5" stroke="#336791" strokeWidth="1.5" strokeLinecap="round"/></svg> },
];

const CdwSourceScreen: React.FC<{ selected: string | null; onSelect: (id: string) => void }> = ({ selected, onSelect }) => (
  <div style={{ background: bSunk, minHeight: '100%' }}>
    <div style={{ maxWidth: 960, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
      <div style={{ marginBottom: sp.F }}>
        <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
          Choose your data warehouse
        </h2>
        <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
          Select your data warehouse. You'll authenticate and choose tables in the next steps.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: sp.D }}>
        {CDW_SOURCES.map(s => (
          <SourceCard key={s.id} icon={s.icon} name={s.id} desc={s.desc} selected={selected === s.id} onClick={() => onSelect(s.id)} />
        ))}
      </div>
    </div>
  </div>
);

// ─── CDW Configure Screen ─────────────────────────────────────────────────────
const CdwConfigureScreen: React.FC<{ sourceName?: string; cgEnabled: boolean; onCgToggle: () => void }> = ({ sourceName, cgEnabled, onCgToggle }) => (
  <div style={{ background: bSunk, minHeight: '100%' }}>
    <div style={{ maxWidth: 800, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
      <div style={{ marginBottom: sp.F }}>
        <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
          Configure {sourceName ?? 'your connection'}
        </h2>
        <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
          Enter your credentials and connection settings. We'll test the connection in the next step.
        </p>
      </div>

      {/* Main form card */}
      <div style={{ background: bBase, borderRadius: 16, padding: sp.F, border: `1px solid ${bdiv}`, marginBottom: sp.D, display: 'flex', flexDirection: 'column', gap: sp.D }}>
        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
          <label style={labelSt}>Name and describe the connection</label>
          <input type="text" placeholder="e.g. snowflake-prod" defaultValue="snowflake-prod" style={inputSt} />
        </div>
        {/* Description */}
        <textarea placeholder="Description (Optional)" defaultValue="" style={{ ...inputSt, height: 72, padding: sp.C, resize: 'vertical', lineHeight: 1.5 }} />
        <div style={{ height: 1, background: bdiv }} />
        {/* Auth type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
          <label style={labelSt}>Authentication type</label>
          <select style={{ ...inputSt, cursor: 'pointer', width: 220 }}>
            <option>Service Account</option>
            <option>Key-pair authentication</option>
            <option>OAuth</option>
          </select>
        </div>
        {/* Account */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
          <label style={labelSt}>Account name or your Snowflake URL</label>
          <input type="text" placeholder="thoughtspot_partner" style={inputSt} />
          <div style={hintSt}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M7 6.5v3.5M7 4.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Whitelist ThoughtSpot IPs (98.85.89.6, 3.219.99.9, 18.208.46.42) in your Snowflake network policy
          </div>
        </div>
        {/* User + Password */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.D }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>User</label>
            <input type="text" placeholder="dev_user" style={inputSt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Password</label>
            <input type="password" placeholder="••••••••••" style={inputSt} />
            <div style={hintSt}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M7 1.5L2.5 3.8v3.5c0 2.4 2 4.7 4.5 5.2 2.5-.5 4.5-2.8 4.5-5.2V3.8L7 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
              Credentials are encrypted and never stored in plain text
            </div>
          </div>
        </div>
        {/* Role + Warehouse */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.D }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Role</label>
            <input type="text" placeholder="dev" style={inputSt} />
            <span style={{ fontSize: 11, color: fg2, fontFamily: ff.primary }}>This role must have SELECT access to the tables you want to connect</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Warehouse</label>
            <input type="text" placeholder="CX_AUTO_WH" style={inputSt} />
            <span style={{ fontSize: 11, color: fg2, fontFamily: ff.primary }}>Set auto-resume to 'true' and auto-suspend to '5 minutes'</span>
          </div>
        </div>
        <div style={{ height: 1, background: bdiv }} />
        {/* Advanced config */}
        <div>
          <div style={{ ...labelSt, marginBottom: sp.C }}>
            Advanced Config <span style={{ fontWeight: 400, color: fg3 }}>(Optional)</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${bdiv}`, borderRadius: 6, overflow: 'hidden' }}>
            <thead>
              <tr style={{ background: bSunk }}>
                <th style={{ textAlign: 'left', padding: `${sp.B}px ${sp.C}px`, fontSize: 11, fontWeight: fw.medium, color: fg2, borderBottom: `1px solid ${bdiv}`, width: '50%', fontFamily: ff.primary }}>Key</th>
                <th style={{ textAlign: 'left', padding: `${sp.B}px ${sp.C}px`, fontSize: 11, fontWeight: fw.medium, color: fg2, borderBottom: `1px solid ${bdiv}`, fontFamily: ff.primary }}>Value</th>
                <th style={{ width: 32, borderBottom: `1px solid ${bdiv}` }} />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: `4px ${sp.C}px` }}>
                  <input type="text" placeholder="Add key" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: fs.sm, color: fg1, outline: 'none', fontFamily: ff.primary }} />
                </td>
                <td style={{ padding: `4px ${sp.C}px` }}>
                  <input type="text" placeholder="Add value" style={{ width: '100%', border: 'none', background: 'transparent', fontSize: fs.sm, color: fg1, outline: 'none', fontFamily: ff.primary }} />
                </td>
                <td style={{ textAlign: 'center', color: fg3, fontSize: 16, cursor: 'pointer' }}>×</td>
              </tr>
            </tbody>
          </table>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: brand, fontFamily: ff.primary, fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, padding: `4px 0`, marginTop: sp.B }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
            Add row
          </button>
        </div>
      </div>

      {/* Context Graph inline card */}
      <div style={{ background: bBase, border: `1px solid ${bdiv}`, borderLeft: `3px solid ${brand}`, borderRadius: 16, padding: sp.F }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: sp.E }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: fs.md, fontWeight: fw.medium, color: fg1, margin: `0 0 ${sp.B}px`, letterSpacing: '-0.01em', fontFamily: ff.primary, lineHeight: 1.3 }}>
              Enable access to your Query history
            </h3>
            <p style={{ fontSize: fs.sm, color: fg2, lineHeight: 1.65, margin: `0 0 ${sp.D}px`, fontFamily: ff.primary }}>
              Spotter learns from how your team actually uses data — the joins they write, filters they apply, and metrics they repeat — and uses that context to give precise answers, not generic ones.
            </p>
            <div style={{ display: 'flex', gap: sp.F, flexWrap: 'wrap' }}>
              {['Read-only, never writes', 'No data leaves your warehouse', 'Disable in settings any time'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: fg2, fontFamily: ff.primary }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: brand, flexShrink: 0 }} />
                  {t}
                </span>
              ))}
            </div>
            {cgEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginTop: sp.C }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize: 11, color: green, fontWeight: fw.medium, fontFamily: ff.primary }}>Query history access granted</span>
              </div>
            )}
          </div>
          {/* Toggle */}
          <button onClick={onCgToggle} style={{
            flexShrink: 0, width: 36, height: 20, borderRadius: 99, border: 'none', cursor: 'pointer',
            padding: 0, marginTop: 4, position: 'relative',
            background: cgEnabled ? brand : '#C4C9D4', transition: 'background 220ms',
          }}>
            <span style={{
              position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: '50%',
              background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block',
              transition: 'transform 220ms', transform: cgEnabled ? 'translateX(16px)' : 'translateX(0)',
            }} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── CDW Tables Screen ────────────────────────────────────────────────────────
const SCHEMA_ROWS = [
  { key: 'ANALYTICS · PUBLIC',  meta: '14 tables · 2.6M rows total'  },
  { key: 'ANALYTICS · STAGING', meta: '6 tables · 2.6M rows total'   },
  { key: 'RAW · FIVETRAN',      meta: '38 tables · 12.1M rows total' },
];

const CdwTablesScreen: React.FC<{ checked: string[]; onToggle: (k: string) => void }> = ({ checked, onToggle }) => (
  <div style={{ background: bSunk, minHeight: '100%' }}>
    <div style={{ maxWidth: 800, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
      <div style={{ marginBottom: sp.F }}>
        <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
          Select schemas to import
        </h2>
        <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
          Choose which database schemas to include. All tables within a selected schema will be available to search.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
        {SCHEMA_ROWS.map(s => {
          const on = checked.includes(s.key);
          return (
            <div key={s.key} onClick={() => onToggle(s.key)} style={{
              display: 'flex', alignItems: 'center', gap: sp.D, padding: `${sp.D}px ${sp.E}px`,
              background: on ? 'rgba(39,112,239,0.04)' : bBase,
              border: `1.5px solid ${on ? brand : bdiv}`,
              borderRadius: 12, cursor: 'pointer', transition: 'border-color 150ms',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: 3, flexShrink: 0,
                background: on ? brand : bBase, border: `1.5px solid ${on ? brand : bdef}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {on && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.mono }}>{s.key}</div>
                <div style={{ fontSize: 11, color: fg2, fontFamily: ff.primary, marginTop: 2 }}>{s.meta}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Semantic Source Screen ───────────────────────────────────────────────────
const SEMANTIC_SOURCES = [
  { id: 'dbt Semantic Layer',       desc: 'Metrics & dimension definitions from dbt Cloud', icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M8 24l8-16 8 16" stroke="#FF6B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 19h10" stroke="#FF6B4A" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'Snowflake Cortex',         desc: 'Semantic views & ML functions in Snowflake',    icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 4l2.4 4.4L16 12.8l-2.4-4.4z" fill="#29B5E8"/><path d="M16 19.2l2.4 4.4L16 28l-2.4-4.4z" fill="#29B5E8"/><path d="M4 16l4.4-2.4L12.8 16l-4.4 2.4z" fill="#29B5E8"/><path d="M19.2 16l4.4-2.4L28 16l-4.4 2.4z" fill="#29B5E8"/><circle cx="24" cy="8" r="3.5" fill="#8C62F5"/><path d="M22.5 8h3M24 6.5v3" stroke="white" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { id: 'Databricks Unity Catalog', desc: 'Unified governance & metric definitions',       icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 4l12 7-12 5-12-5z" fill="#FF6D00"/><path d="M4 15l12 5 12-5-12 7z" fill="#FF8F00"/><path d="M4 20l12 5 12-5-12 7z" fill="#FF6D00" opacity="0.65"/></svg> },
];

const SemanticSourceScreen: React.FC<{ selected: string | null; onSelect: (id: string) => void }> = ({ selected, onSelect }) => (
  <div style={{ background: bSunk, minHeight: '100%' }}>
    <div style={{ maxWidth: 960, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
      <div style={{ marginBottom: sp.F }}>
        <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
          Choose a semantic layer source
        </h2>
        <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
          ThoughtSpot reads metric and dimension definitions directly from your semantic layer — no manual modelling required.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: sp.D }}>
        {SEMANTIC_SOURCES.map(s => (
          <SourceCard key={s.id} icon={s.icon} name={s.id} desc={s.desc} selected={selected === s.id} onClick={() => onSelect(s.id)} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Semantic Configure Screen ────────────────────────────────────────────────
const SemanticConfigureScreen: React.FC<{ sourceLabel: string }> = ({ sourceLabel }) => (
  <div style={{ background: bSunk, minHeight: '100%' }}>
    <div style={{ maxWidth: 800, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
      <div style={{ marginBottom: sp.F }}>
        <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
          Configure your connection
        </h2>
        <p style={{ margin: `0 0 ${sp.D}px`, fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
          Enter your credentials so ThoughtSpot can read metric and dimension definitions.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: sp.B, padding: `5px 12px`, borderRadius: 99, border: `1px solid ${bdiv}`, fontSize: 11, fontWeight: fw.medium, color: fg1, background: bBase, fontFamily: ff.primary }}>
          <svg width="13" height="13" viewBox="0 0 32 32" fill="none"><path d="M8 24l8-16 8 16" stroke="#FF6B4A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 19h10" stroke="#FF6B4A" strokeWidth="2" strokeLinecap="round"/></svg>
          {sourceLabel}
        </div>
      </div>
      <div style={{ background: bBase, borderRadius: 16, padding: sp.F, border: `1px solid ${bdiv}` }}>
        <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: sp.D }}>Connection details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.D }}>
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Connection name</label>
            <input type="text" placeholder="e.g. dbt-production" style={inputSt} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>dbt Cloud environment URL</label>
            <input type="text" placeholder="https://cloud.getdbt.com/api" style={inputSt} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Service token</label>
            <input type="password" placeholder="dbt_service_token_…" style={inputSt} />
            <span style={{ fontSize: 11, color: fg2, fontFamily: ff.primary }}>Generate in dbt Cloud → Account Settings → Service Tokens</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Project</label>
            <input type="text" placeholder="analytics" style={inputSt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Target environment</label>
            <select style={{ ...inputSt, cursor: 'pointer' }}>
              <option>production</option><option>staging</option><option>development</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Semantic Snowflake Connection Screen ────────────────────────────────────
type SfConn = 'snowflake-prod' | 'snowflake-finance' | 'new' | null;

const SF_EXISTING: { id: SfConn & string; name: string; meta: string; status: 'connected' | 'auth-needed' }[] = [
  { id: 'snowflake-prod',    name: 'snowflake-prod',    meta: 'Service Account · ANALYTICS_WH · last sync 3h ago',   status: 'connected'  },
  { id: 'snowflake-finance', name: 'snowflake-finance', meta: 'Key-pair authentication · authenticate to access',    status: 'auth-needed' },
];

const SnowflakeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
    <path d="M8 1.5v13M1.7 4.75l12.6 6.5M14.3 4.75l-12.6 6.5" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const SemanticSnowflakeScreen: React.FC<{
  selectedSource: string | null;
  selectedSfConn: SfConn;
  onPickSfConn: (id: SfConn) => void;
}> = ({ selectedSource, selectedSfConn, onPickSfConn }) => {
  const headDesc = selectedSource === 'Snowflake Cortex'
    ? 'Snowflake Cortex semantic views live in your warehouse. Choose the Snowflake connection ThoughtSpot should read them from.'
    : 'Your dbt models are built and run on Snowflake. Choose the Snowflake connection ThoughtSpot should read the underlying data from.';

  return (
    <div style={{ background: bSunk, minHeight: '100%' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
        <div style={{ marginBottom: sp.F }}>
          <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
            Select a Snowflake connection
          </h2>
          <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary, lineHeight: 1.6 }}>
            {headDesc}
          </p>
        </div>

        {/* Existing connections */}
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase', color: fg3, fontFamily: ff.primary, marginBottom: sp.C }}>
          Existing connections
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B, marginBottom: sp.D }}>
          {SF_EXISTING.map(conn => {
            const sel = selectedSfConn === conn.id;
            return (
              <div key={conn.id} onClick={() => onPickSfConn(conn.id)} style={{
                display: 'flex', alignItems: 'center', gap: sp.C,
                padding: `12px ${sp.D}px`,
                background: sel ? 'rgba(39,112,239,0.04)' : bBase,
                border: `1.5px solid ${sel ? brand : bdiv}`,
                borderRadius: 12, cursor: 'pointer',
                boxShadow: sel ? '0 0 0 3px rgba(39,112,239,0.1)' : undefined,
                transition: 'border-color 150ms, background 150ms',
              }}>
                {/* Radio */}
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${sel ? brand : bdef}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 150ms' }}>
                  {sel && <div style={{ width: 9, height: 9, borderRadius: '50%', background: brand }} />}
                </div>
                {/* Logo */}
                <div style={{ width: 34, height: 34, borderRadius: 8, background: bSunk, border: `1px solid ${bdiv}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SnowflakeIcon />
                </div>
                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary }}>{conn.name}</div>
                  <div style={{ fontSize: 11, color: fg2, fontFamily: ff.primary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.meta}</div>
                </div>
                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: conn.status === 'connected' ? green : '#F5A623', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: fw.medium, color: conn.status === 'connected' ? green : '#E0831A', fontFamily: ff.primary }}>
                    {conn.status === 'connected' ? 'Connected' : 'Auth needed'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* "or" divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, margin: `${sp.D}px 0 ${sp.C}px` }}>
          <div style={{ flex: 1, height: 1, background: bdiv }} />
          <span style={{ fontSize: 11, color: fg3, fontFamily: ff.primary }}>or</span>
          <div style={{ flex: 1, height: 1, background: bdiv }} />
        </div>

        {/* Create new */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
          {(() => {
            const sel = selectedSfConn === 'new';
            return (
              <div onClick={() => onPickSfConn('new')} style={{
                display: 'flex', alignItems: 'center', gap: sp.C,
                padding: `12px ${sp.D}px`,
                background: sel ? 'rgba(39,112,239,0.04)' : 'transparent',
                border: `1.5px dashed ${sel ? brand : bdiv}`,
                borderRadius: 12, cursor: 'pointer',
                boxShadow: sel ? '0 0 0 3px rgba(39,112,239,0.1)' : undefined,
                transition: 'border-color 150ms, background 150ms',
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${sel ? brand : bdef}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 150ms' }}>
                  {sel && <div style={{ width: 9, height: 9, borderRadius: '50%', background: brand }} />}
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(39,112,239,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke={brand} strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary }}>Create a new Snowflake connection</div>
                  <div style={{ fontSize: 11, color: fg2, fontFamily: ff.primary, marginTop: 2 }}>Don't see your warehouse? Authenticate a new one right here.</div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Inline new-connection form */}
        {selectedSfConn === 'new' && (
          <div style={{ background: bBase, borderRadius: 16, padding: sp.F, border: `1px solid ${bdiv}`, marginTop: sp.E, animation: 'ncp-card-enter 0.28s ease both' }}>
            <style>{`@keyframes ncp-card-enter { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
            <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: sp.D }}>New Snowflake connection</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.D }}>
              <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: sp.B }}>
                <label style={labelSt}>Connection name</label>
                <input type="text" placeholder="e.g. snowflake-semantic" style={inputSt} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                <label style={labelSt}>Authentication type</label>
                <select style={{ ...inputSt, cursor: 'pointer' }}>
                  <option>Service Account</option>
                  <option>Key-pair authentication</option>
                  <option>OAuth</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                <label style={labelSt}>Account name or URL</label>
                <input type="text" placeholder="thoughtspot_partner" style={inputSt} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                <label style={labelSt}>User</label>
                <input type="text" placeholder="ts_service" style={inputSt} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                <label style={labelSt}>Password</label>
                <input type="password" placeholder="" style={inputSt} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                <label style={labelSt}>Role</label>
                <input type="text" placeholder="transformer" style={inputSt} />
                <span style={{ fontSize: 11, color: fg2, fontFamily: ff.primary }}>Must have SELECT access to the semantic-layer tables</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                <label style={labelSt}>Warehouse</label>
                <input type="text" placeholder="CX_AUTO_WH" style={inputSt} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Apps Source Screen ───────────────────────────────────────────────────────
const APP_SOURCES = [
  { id: 'Salesforce', desc: 'CRM & customer data',      icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M13 8c1-2.5 3.5-4 6-3.5 2 .4 3.5 1.8 4 3.5 1-.5 2.3-.5 3.2.3 1.2 1 1.4 2.7.6 4 1.2.8 2 2.2 1.8 3.7-.3 2-2.2 3.5-4.2 3.5H9c-2.2 0-4-1.8-4-4 0-1.8 1.2-3.4 3-3.8C7.5 10.5 9 8 11 7.5" stroke="#00A1E0" strokeWidth="1.75" fill="none"/></svg> },
  { id: 'Mixpanel',   desc: 'Product analytics',        icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" fill="#7856FF" opacity="0.1"/><path d="M10 20l3-6 3 4 3-8 3 10" stroke="#7856FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'Pendo',      desc: 'User engagement data',     icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect x="5" y="5" width="22" height="22" rx="5" fill="#4F55FF" opacity="0.1"/><path d="M11 11h5c2.5 0 4.5 2 4.5 4.5S18.5 20 16 20h-5V11z" stroke="#4F55FF" strokeWidth="2" strokeLinejoin="round"/></svg> },
  { id: 'HubSpot',    desc: 'Marketing & sales data',   icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="5" fill="#FF7A59" opacity="0.8"/><path d="M16 4v5M16 23v5M4 16h5M23 16h5M8 8l3.5 3.5M20.5 20.5L24 24M24 8l-3.5 3.5M8 24l3.5-3.5" stroke="#FF7A59" strokeWidth="1.75" strokeLinecap="round"/></svg> },
  { id: 'Stripe',     desc: 'Payment & revenue data',   icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect x="5" y="5" width="22" height="22" rx="5" fill="#635BFF" opacity="0.1"/><path d="M12 14c0-1.5 1.3-2.5 3.5-2.5 2.3 0 4.5 1 5.5 2.5l-2.5 1.5c-.5-1-1.5-1.5-3-1.5-1 0-1.5.4-1.5 1 0 2 7 .8 7 5 0 2-1.8 3.5-4.5 3.5-2.5 0-4.5-1-5.5-2.8l2.5-1.4c.5 1 1.5 1.7 3 1.7 1.2 0 2-.5 2-1.2 0-2.2-7-1-7-5.8z" fill="#635BFF"/></svg> },
];

const AppsSourceScreen: React.FC<{ selected: string | null; onSelect: (id: string) => void }> = ({ selected, onSelect }) => (
  <div style={{ background: bSunk, minHeight: '100%' }}>
    <div style={{ maxWidth: 960, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
      <div style={{ marginBottom: sp.F }}>
        <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
          Choose a business app
        </h2>
        <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
          ThoughtSpot syncs data from business apps via their REST APIs. Choose an app to continue.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: sp.D }}>
        {APP_SOURCES.map(s => (
          <SourceCard key={s.id} icon={s.icon} name={s.id} desc={s.desc} selected={selected === s.id} onClick={() => onSelect(s.id)} />
        ))}
      </div>
    </div>
  </div>
);

// ─── Apps Connect Screen (OAuth) ──────────────────────────────────────────────
const AppsConnectScreen: React.FC<{ appName: string }> = ({ appName }) => (
  <div style={{ background: bSunk, minHeight: '100%' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: sp.E, padding: `${sp.I}px 0` }}>
      <div style={{ width: 68, height: 68, borderRadius: 16, background: bBase, border: `1px solid ${bdiv}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="10" fill="#7856FF" opacity="0.12"/>
          <path d="M10 20l3-6 3 4 3-8 3 10" stroke="#7856FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 style={{ margin: 0, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>Connect {appName}</h2>
      <p style={{ fontSize: fs.sm, color: fg2, textAlign: 'center', maxWidth: 400, lineHeight: 1.6, margin: 0, fontFamily: ff.primary }}>
        ThoughtSpot requests read-only access to sync data from your {appName} account. Nothing is written or modified.
      </p>
      <button style={{ padding: '10px 32px', borderRadius: 6, background: brand, color: 'white', border: 'none', fontSize: 15, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary }}>
        Connect with {appName}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, width: 360, color: fg2, fontSize: 11, fontFamily: ff.primary }}>
        <div style={{ flex: 1, height: 1, background: bdiv }} />
        or use API key
        <div style={{ flex: 1, height: 1, background: bdiv }} />
      </div>
      <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: sp.B }}>
        <label style={labelSt}>API key</label>
        <input type="password" placeholder="Paste your secret API key…" style={{ ...inputSt, width: '100%' }} />
        <span style={{ fontSize: 11, color: fg2, fontFamily: ff.primary }}>Found in {appName} → Settings → API Access</span>
      </div>
    </div>
  </div>
);

// ─── Success Screen ───────────────────────────────────────────────────────────
const SEMANTIC_SOURCES_SET = new Set(['dbt Semantic Layer', 'Snowflake Cortex', 'Databricks Unity Catalog']);

const SuccessCheckmark = () => (
  <>
    <style>{`
      @keyframes ncp-sck-pop  { 0%{transform:scale(0.5);opacity:0} 80%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
      @keyframes ncp-sck-draw { to { stroke-dashoffset: 0; } }
    `}</style>
    <div style={{
      width: 72, height: 72, borderRadius: '50%',
      background: 'rgba(6,191,127,0.08)', border: '2px solid rgba(6,191,127,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: sp.E,
      animation: 'ncp-sck-pop 0.4s cubic-bezier(0.2,0,0,1) both', flexShrink: 0,
    }}>
      <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
        <path d="M8 17l6 6 12-12" stroke="#06BF7F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ strokeDasharray: 36, strokeDashoffset: 36, animation: 'ncp-sck-draw 0.4s 0.28s ease-out forwards' }}
        />
      </svg>
    </div>
  </>
);

const SuccessScreen: React.FC<{
  sourceLabel: string; cgEnabled: boolean; isSemantic: boolean;
  onClose: () => void; onGoToModels?: () => void;
}> = ({ sourceLabel, cgEnabled, isSemantic, onClose, onGoToModels }) => {
  const goModels = () => { onGoToModels?.(); onClose(); };

  if (isSemantic) {
    return (
      <div style={{ background: bSunk, minHeight: '100%' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: `${sp.I}px ${sp.F}px ${sp.H}px`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <SuccessCheckmark />
          <h2 style={{ fontSize: 26, fontWeight: fw.medium, color: fg1, margin: `0 0 ${sp.B}px`, fontFamily: ff.primary, textAlign: 'center' }}>
            Model imported
          </h2>
          <p style={{ fontSize: fs.sm, color: fg2, margin: `0 0 ${sp.D}px`, fontFamily: ff.primary, textAlign: 'center', lineHeight: 1.6, maxWidth: 420 }}>
            Your metrics and dimensions from <strong style={{ color: fg1, fontWeight: fw.medium }}>{sourceLabel}</strong> have been automatically imported. Here's how to activate them.
          </p>
          <div style={{ display: 'flex', gap: sp.B, alignItems: 'center', justifyContent: 'center', marginBottom: sp.F }}>
            <span style={{ fontSize: 11, fontWeight: fw.medium, padding: '4px 14px', borderRadius: 99, background: bBase, border: `1px solid ${bdiv}`, color: fg1, fontFamily: ff.primary }}>{sourceLabel}</span>
          </div>

          {/* 3-step next actions */}
          <div style={{ width: '100%', background: bBase, border: `1px solid ${bdiv}`, borderRadius: 16, overflow: 'hidden', marginBottom: sp.F }}>
            {/* Step 1 */}
            <div style={{ padding: sp.E, display: 'flex', alignItems: 'flex-start', gap: sp.D, borderBottom: `1px solid ${bdiv}` }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: brand, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <span style={{ fontSize: 12, fontWeight: fw.medium, color: 'white', fontFamily: ff.primary }}>1</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 4 }}>Open the model</div>
                <p style={{ fontSize: fs.sm, color: fg2, margin: `0 0 ${sp.C}px`, fontFamily: ff.primary, lineHeight: 1.55 }}>
                  Review the metrics and dimension tables that were imported. Rename, reorder, or hide anything that doesn't fit your team's workflow.
                </p>
                <button onClick={goModels} style={{ padding: '6px 16px', borderRadius: 6, background: brand, color: 'white', border: 'none', fontSize: fs.sm, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary }}>
                  Open model
                </button>
              </div>
            </div>
            {/* Step 2 */}
            <div style={{ padding: sp.E, display: 'flex', alignItems: 'flex-start', gap: sp.D, borderBottom: `1px solid ${bdiv}` }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: bSunk, border: `1.5px solid ${bdiv}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <span style={{ fontSize: 12, fontWeight: fw.medium, color: fg2, fontFamily: ff.primary }}>2</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 4 }}>Make it AI ready</div>
                <p style={{ fontSize: fs.sm, color: fg2, margin: `0 0 ${sp.C}px`, fontFamily: ff.primary, lineHeight: 1.55 }}>
                  Add plain-language descriptions and synonyms to each metric and dimension so Spotter can map natural language questions to the right data.
                </p>
                <div style={{ display: 'flex', gap: sp.B, flexWrap: 'wrap' }}>
                  {['Descriptions', 'Synonyms', 'Verified answers'].map(t => (
                    <span key={t} style={{ fontSize: 11, fontWeight: fw.medium, padding: '3px 10px', borderRadius: 4, background: bSunk, border: `1px solid ${bdiv}`, color: fg2, fontFamily: ff.primary }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
            {/* Step 3 */}
            <div style={{ padding: sp.E, display: 'flex', alignItems: 'flex-start', gap: sp.D }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: bSunk, border: `1.5px solid ${bdiv}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <span style={{ fontSize: 12, fontWeight: fw.medium, color: fg2, fontFamily: ff.primary }}>3</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 4 }}>Enable for Spotter</div>
                <p style={{ fontSize: fs.sm, color: fg2, margin: `0 0 ${sp.C}px`, fontFamily: ff.primary, lineHeight: 1.55 }}>
                  Publish the model to make it searchable. Your team can then ask Spotter questions in natural language and get instant, accurate answers.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#8C62F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5.5l2 2L8 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span style={{ fontSize: 11, color: '#8C62F5', fontWeight: fw.medium, fontFamily: ff.primary }}>Spotter-ready once published</span>
                </div>
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: fg2, fontFamily: ff.primary, fontSize: fs.sm, padding: '7px 4px' }}>
            View connections
          </button>
        </div>
      </div>
    );
  }

  // CDW / Business apps path
  return (
    <div style={{ background: bSunk, minHeight: '100%' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: `${sp.I}px ${sp.F}px ${sp.H}px`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <SuccessCheckmark />
        <h2 style={{ fontSize: 26, fontWeight: fw.medium, color: fg1, margin: `0 0 ${sp.B}px`, fontFamily: ff.primary, textAlign: 'center' }}>
          Connection ready
        </h2>
        <p style={{ fontSize: fs.sm, color: fg2, margin: `0 0 ${sp.D}px`, fontFamily: ff.primary, textAlign: 'center', lineHeight: 1.6 }}>
          Raw data connected. Create a model to unlock transformations, AI-ready metrics, and natural language search.
        </p>
        <div style={{ display: 'flex', gap: sp.B, alignItems: 'center', justifyContent: 'center', marginBottom: sp.F, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: fw.medium, padding: '4px 14px', borderRadius: 99, background: bBase, border: `1px solid ${bdiv}`, color: fg1, fontFamily: ff.primary }}>{sourceLabel}</span>
          {cgEnabled && (
            <span style={{ fontSize: 11, fontWeight: fw.medium, padding: '4px 14px', borderRadius: 99, background: 'rgba(140,98,245,0.08)', border: '1px solid rgba(140,98,245,0.22)', color: '#8C62F5', display: 'flex', alignItems: 'center', gap: 6, fontFamily: ff.primary }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8C62F5', flexShrink: 0 }} />
              Context Graph active
            </span>
          )}
        </div>

        {/* Create a model card */}
        <div style={{ width: '100%', background: 'rgba(39,112,239,0.04)', border: '1.5px solid rgba(39,112,239,0.2)', borderRadius: 16, padding: sp.F, textAlign: 'left', marginBottom: sp.F }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, marginBottom: sp.C }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(39,112,239,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5.5" height="5.5" rx="1" stroke={brand} strokeWidth="1.4"/>
                <rect x="8.5" y="2" width="5.5" height="5.5" rx="1" stroke={brand} strokeWidth="1.4"/>
                <rect x="2" y="8.5" width="5.5" height="5.5" rx="1" stroke={brand} strokeWidth="1.4"/>
                <path d="M11.5 8.5v7M8 12h7" stroke={brand} strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: fw.medium, color: brand, fontFamily: ff.primary }}>Create a model</span>
          </div>
          <p style={{ fontSize: fs.sm, color: fg2, lineHeight: 1.65, margin: `0 0 ${sp.D}px`, fontFamily: ff.primary }}>
            Join your tables, apply transformations, and define the metrics and dimensions your team will search. Models are the bridge between raw data and AI-powered answers.
          </p>

          {/* Capability chips */}
          <div style={{ display: 'flex', gap: sp.B, flexWrap: 'wrap', marginBottom: sp.E }}>
            {[
              { label: 'Joins & transformations', icon: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2v10" stroke={brand} strokeWidth="1.5" strokeLinecap="round"/></svg> },
              { label: 'AI-ready metrics',         icon: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2l1.5 3.5H12l-3 2.2 1.1 3.3L7 9l-3.1 2 1.1-3.3L2 5.5h3.5z" stroke={brand} strokeWidth="1.2" strokeLinejoin="round"/></svg> },
              { label: 'Natural language search',  icon: <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><circle cx="6" cy="6" r="4" stroke={brand} strokeWidth="1.4"/><path d="M9 9l3 3" stroke={brand} strokeWidth="1.4" strokeLinecap="round"/></svg> },
            ].map(cap => (
              <span key={cap.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: fw.medium, padding: '4px 10px', borderRadius: 6, background: 'rgba(39,112,239,0.08)', border: '1px solid rgba(39,112,239,0.18)', color: brand, fontFamily: ff.primary }}>
                {cap.icon}{cap.label}
              </span>
            ))}
          </div>

          <button onClick={goModels} style={{ padding: '8px 24px', borderRadius: 6, background: brand, color: 'white', border: 'none', fontSize: fs.sm, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary }}>
            Create a model
          </button>
        </div>

        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: fg2, fontFamily: ff.primary, fontSize: fs.sm, padding: '7px 4px' }}>
          View connections
        </button>
      </div>
    </div>
  );
};

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer: React.FC<{
  screen: Screen; selectedSource: string | null; selectedSfConn: SfConn;
  testStatus: 'testing' | null;
  onBack: () => void; onCancel: () => void; onNext: () => void; onSkip: () => void;
}> = ({ screen, selectedSource, selectedSfConn, testStatus, onBack, onCancel, onNext, onSkip }) => {
  if (screen === 'success') return null;

  const isConfig    = CONFIGURE_SCREENS.includes(screen);
  const isSrc       = SOURCE_SCREENS.includes(screen);
  const isSfNewTest = screen === 'semantic-snowflake' && selectedSfConn === 'new';
  const nextLabel   = (isConfig || isSfNewTest)
    ? (testStatus === 'testing' ? 'Testing…' : 'Test connection')
    : (screen === 'cdw-tables' || screen === 'semantic-snowflake') ? 'Create connection' : 'Next';
  const nextDisabled =
    (isSrc && !selectedSource) ||
    (screen === 'semantic-snowflake' && !selectedSfConn) ||
    testStatus === 'testing';
  const showBack = screen !== 'type-picker';
  const showNext = screen !== 'type-picker';
  const showSkip = screen === 'cdw-tables';

  const btnBase: React.CSSProperties = { padding: `7px 16px`, borderRadius: 6, fontSize: fs.sm, fontFamily: ff.primary, cursor: 'pointer' };

  return (
    <div style={{ height: 68, flexShrink: 0, background: bBase, borderTop: `1px solid ${bdiv}`, display: 'flex', alignItems: 'center', padding: `0 ${sp.H}px`, gap: sp.C }}>
      {showBack ? (
        <button onClick={onBack} style={{ ...btnBase, background: 'none', border: 'none', color: fg2, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9 3L4 7l5 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
      ) : <div style={{ width: 60 }} />}
      <div style={{ flex: 1 }} />
      {showSkip && (
        <button onClick={onSkip} style={{ ...btnBase, background: bBase, border: `1px solid ${bdef}`, color: fg1 }}>Skip for now</button>
      )}
      <button onClick={onCancel} style={{ ...btnBase, background: bBase, border: `1px solid ${bdef}`, color: fg1 }}>Cancel</button>
      {showNext && (
        <button onClick={nextDisabled ? undefined : onNext} style={{ ...btnBase, background: brand, color: 'white', border: 'none', fontWeight: fw.medium, opacity: nextDisabled ? 0.5 : 1, cursor: nextDisabled ? 'not-allowed' : 'pointer' }}>
          {nextLabel}
        </button>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export interface NewConnectionPageProps {
  onClose: () => void;
  onDone: (conn: Connection) => void;
  onGoToModels?: () => void;
}

const NewConnectionPage: React.FC<NewConnectionPageProps> = ({ onClose, onDone, onGoToModels }) => {
  const [screen,         setScreen]         = useState<Screen>('type-picker');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [cgEnabled,      setCgEnabled]      = useState(false);
  const [testStatus,     setTestStatus]     = useState<'testing' | null>(null);
  const [checkedSchemas, setCheckedSchemas] = useState(['ANALYTICS · PUBLIC']);
  const [selectedSfConn, setSelectedSfConn] = useState<SfConn>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const fireOnDone = () => {
    const type: ConnectionType =
      selectedSource === 'Snowflake' || selectedSource === 'Snowflake Cortex' ? 'snowflake' :
      selectedSource === 'Databricks' || selectedSource === 'Databricks Unity Catalog' ? 'databricks' :
      selectedSource === 'BigQuery' ? 'bigquery' :
      selectedSource === 'Redshift' ? 'redshift' :
      selectedSource === 'PostgreSQL' ? 'postgres' :
      selectedSource?.includes('dbt') ? 'dbt' : 'snowflake';
    onDone({
      id: `conn-${selectedSource ?? 'new'}-${Date.now()}`,
      name: selectedSource ? selectedSource.toLowerCase().replace(/\s+/g, '-') + '-prod' : 'new-connection',
      type,
      status: 'connected',
      lastSync: 'Just now',
      ownerEmail: 'you',
      tables: 184,
    });
  };

  const advanceTo = (next: Screen) => {
    if (next === 'success') { fireOnDone(); }
    setScreen(next);
  };

  const handleNext = () => {
    const next = nextScreen(screen, selectedSource);
    if (!next) return;
    // Test connection simulation for configure screens AND new-SF-conn creation
    const isSfNewTest = screen === 'semantic-snowflake' && selectedSfConn === 'new';
    if (CONFIGURE_SCREENS.includes(screen) || isSfNewTest) {
      setTestStatus('testing');
      setTimeout(() => {
        setTestStatus(null);
        advanceTo(next);
      }, 1600);
      return;
    }
    advanceTo(next);
  };

  const handleBack = () => {
    const prev = backScreen(screen, selectedSource);
    if (!prev) return;
    if (prev === 'type-picker') setSelectedSource(null);
    if (prev === 'semantic-source') setSelectedSfConn(null);
    setTestStatus(null);
    setScreen(prev);
  };

  const handleTypeSelect = (t: 'cdw' | 'semantic' | 'app') => {
    setSelectedSource(null);
    setSelectedSfConn(null);
    setScreen(t === 'cdw' ? 'cdw-source' : t === 'semantic' ? 'semantic-source' : 'apps-source');
  };

  const toggleSchema = (key: string) =>
    setCheckedSchemas(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const { show: showSB, steps, states } = getStepBar(screen, selectedSource);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: bBase, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <TopBar title={TITLE[screen]} showBack={!['type-picker', 'success'].includes(screen)} onBack={handleBack} onClose={onClose} />
      {showSB && <StepBar steps={steps} states={states} />}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {screen === 'type-picker'          && <TypePickerScreen onSelect={handleTypeSelect} />}
        {screen === 'cdw-source'           && <CdwSourceScreen selected={selectedSource} onSelect={setSelectedSource} />}
        {screen === 'cdw-configure'        && <CdwConfigureScreen sourceName={selectedSource ?? undefined} cgEnabled={cgEnabled} onCgToggle={() => setCgEnabled(v => !v)} />}
        {screen === 'cdw-tables'           && <CdwTablesScreen checked={checkedSchemas} onToggle={toggleSchema} />}
        {screen === 'semantic-source'      && <SemanticSourceScreen selected={selectedSource} onSelect={setSelectedSource} />}
        {screen === 'semantic-configure'   && <SemanticConfigureScreen sourceLabel={selectedSource ?? 'Semantic layer'} />}
        {screen === 'semantic-snowflake'   && <SemanticSnowflakeScreen selectedSource={selectedSource} selectedSfConn={selectedSfConn} onPickSfConn={setSelectedSfConn} />}
        {screen === 'apps-source'          && <AppsSourceScreen selected={selectedSource} onSelect={setSelectedSource} />}
        {screen === 'apps-connect'         && <AppsConnectScreen appName={selectedSource ?? 'your app'} />}
        {screen === 'success'              && <SuccessScreen sourceLabel={selectedSource ?? 'Connection'} cgEnabled={cgEnabled} isSemantic={SEMANTIC_SOURCES_SET.has(selectedSource ?? '')} onClose={onClose} onGoToModels={onGoToModels} />}
      </div>

      <Footer
        screen={screen} selectedSource={selectedSource} selectedSfConn={selectedSfConn}
        testStatus={testStatus}
        onBack={handleBack} onCancel={onClose} onNext={handleNext}
        onSkip={() => advanceTo('success')}
      />
    </div>
  );
};

export default NewConnectionPage;
