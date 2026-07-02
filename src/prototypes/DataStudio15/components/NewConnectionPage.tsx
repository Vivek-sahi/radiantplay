import React, { useState, useEffect } from 'react';
import { c, sp, fs, fw, ff, ts } from '../styles';
import { Connection, ConnectionType } from '../data/mockData';

// ─── Screen state machine (mirrors Connections.dc.html) ───────────────────────
type Screen =
  | 'type-picker'
  | 'cdw-source' | 'cdw-configure' | 'cdw-tables'
  | 'semantic-source' | 'semantic-configure' | 'semantic-dbt-models' | 'semantic-snowflake'
  | 'apps-source' | 'apps-auth' | 'apps-scope' | 'apps-flatten' | 'apps-cache'
  | 'success';

// Navigation is source-dependent for semantic — resolved at runtime in handleNext/handleBack
const NEXT_STATIC: Partial<Record<Screen, Screen>> = {
  'cdw-source': 'cdw-configure',
  'cdw-configure': 'cdw-tables',
  'cdw-tables': 'success',
  'semantic-snowflake': 'success',
  'apps-source': 'apps-auth',
  'apps-auth': 'apps-scope',
  'apps-scope': 'apps-flatten',
  'apps-flatten': 'apps-cache',
  'apps-cache': 'success',
};
function nextScreen(screen: Screen, selectedSource: string | null): Screen | undefined {
  if (screen === 'semantic-source')     return selectedSource === 'Snowflake Cortex' ? 'semantic-snowflake' : 'semantic-configure';
  if (screen === 'semantic-configure')  return selectedSource === 'dbt Semantic Layer' ? 'semantic-snowflake' : 'success';
  if (screen === 'semantic-snowflake' && selectedSource === 'dbt Semantic Layer') return 'semantic-dbt-models';
  if (screen === 'semantic-dbt-models') return 'success';
  return NEXT_STATIC[screen];
}
function backScreen(screen: Screen, selectedSource: string | null): Screen | undefined {
  if (screen === 'semantic-snowflake')  return selectedSource === 'Snowflake Cortex' ? 'semantic-source' : 'semantic-configure';
  if (screen === 'semantic-dbt-models') return 'semantic-snowflake';
  const map: Partial<Record<Screen, Screen>> = {
    'cdw-source': 'type-picker', 'cdw-configure': 'cdw-source', 'cdw-tables': 'cdw-configure',
    'semantic-source': 'type-picker', 'semantic-configure': 'semantic-source',
    'apps-source': 'type-picker', 'apps-auth': 'apps-source', 'apps-scope': 'apps-auth', 'apps-flatten': 'apps-scope', 'apps-cache': 'apps-flatten',
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
  'semantic-dbt-models': 'Semantic layer',
  'semantic-snowflake': 'Semantic layer',
  'apps-source': 'Business apps',
  'apps-auth': 'Business apps',
  'apps-scope': 'Business apps',
  'apps-flatten': 'Business apps',
  'apps-cache': 'Business apps',
  'success': 'Connection ready',
};
const CONFIGURE_SCREENS: Screen[] = ['cdw-configure', 'semantic-configure', 'apps-auth'];
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
          ? ['semantic-source', 'semantic-configure', 'semantic-snowflake', 'semantic-dbt-models']
          : ['semantic-source', 'semantic-configure']; // Databricks Unity Catalog
    const labels: Partial<Record<Screen, string>> = {
      'semantic-source': 'Choose source',
      'semantic-configure': 'Configure',
      'semantic-dbt-models': 'Select models',
      'semantic-snowflake': 'Database connection',
    };
    const idx = order.indexOf(screen);
    return {
      show: true,
      steps: order.map(s => labels[s]!),
      states: order.map((_, i) => i === idx ? 'active' : i < idx ? 'done' : 'inactive'),
    };
  }
  if (screen.startsWith('apps-')) {
    const order: Screen[] = ['apps-source', 'apps-auth', 'apps-scope', 'apps-flatten', 'apps-cache'];
    const idx = order.indexOf(screen);
    return {
      show: true,
      steps: ['Choose app', 'Authenticate', 'Scope', 'Preview', 'Cache'],
      states: order.map((_, i) => i === idx ? 'active' : i < idx ? 'done' : 'inactive'),
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
  { id: 'Snowflake',     desc: 'Cloud data platform',         icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M16 3v26M6.1 8.5l19.8 15M25.9 8.5L6.1 23.5" stroke="#29B5E8" strokeWidth="2.4" strokeLinecap="round"/><path d="M16 3l-2.8 3.8M16 3l2.8 3.8M16 29l-2.8-3.8M16 29l2.8 3.8" stroke="#29B5E8" strokeWidth="1.6" strokeLinecap="round"/><path d="M6.1 8.5l3.8 1.2M6.1 8.5l1.2 3.8M25.9 8.5l-3.8 1.2M25.9 8.5l-1.2 3.8M6.1 23.5l3.8-1.2M6.1 23.5l1.2-3.8M25.9 23.5l-3.8-1.2M25.9 23.5l-1.2-3.8" stroke="#29B5E8" strokeWidth="1.6" strokeLinecap="round"/></svg> },
  { id: 'Databricks',   desc: 'Unified analytics platform',  icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M7.5 12l8.5-8 8.5 8-8.5 5z" fill="#FF3621"/><path d="M7.5 17.5l8.5 5 8.5-5-8.5 5.5z" fill="#FF6B35"/><path d="M7.5 22l8.5 4.5 8.5-4.5-8.5 5z" fill="#FF3621" opacity="0.6"/></svg> },
  { id: 'BigQuery',     desc: 'Google Cloud analytics',      icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="13.5" cy="13.5" r="9" stroke="#4285F4" strokeWidth="2" fill="#4285F4" fillOpacity="0.07"/><path d="M20 20L27 27" stroke="#34A853" strokeWidth="2.5" strokeLinecap="round"/><rect x="10.5" y="11" width="2" height="5.5" rx="1" fill="#EA4335"/><rect x="13.5" y="9" width="2" height="7.5" rx="1" fill="#FBBC05"/><rect x="16.5" y="12.5" width="2" height="4" rx="1" fill="#4285F4"/></svg> },
  { id: 'Redshift',     desc: 'Amazon Web Services',         icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="10" rx="9.5" ry="3.5" fill="#8C4FFF" fillOpacity="0.12" stroke="#8C4FFF" strokeWidth="1.6"/><path d="M6.5 10v12" stroke="#8C4FFF" strokeWidth="1.6"/><path d="M25.5 10v12" stroke="#8C4FFF" strokeWidth="1.6"/><ellipse cx="16" cy="22" rx="9.5" ry="3.5" fill="#8C4FFF" fillOpacity="0.12" stroke="#8C4FFF" strokeWidth="1.6"/><ellipse cx="16" cy="16" rx="9.5" ry="3.5" stroke="#8C4FFF" strokeWidth="1" opacity="0.35"/></svg> },
  { id: 'Azure Synapse',desc: 'Microsoft Azure',             icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M5 25L11 9l5 9 5-9 6 16" stroke="#0078D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 25h22" stroke="#0078D4" strokeWidth="1.4" strokeLinecap="round" opacity="0.4"/></svg> },
  { id: 'PostgreSQL',   desc: 'Open-source relational',      icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><ellipse cx="15.5" cy="14" rx="8.5" ry="9" stroke="#336791" strokeWidth="1.75" fill="#336791" fillOpacity="0.08"/><path d="M7.5 17c-1.5 2.5-1.5 6.5 1.5 7.5 2 .7 3-1.5 2.5-3.5" stroke="#336791" strokeWidth="1.75" strokeLinecap="round"/><path d="M23 8c3.5-1 5.5 1.5 5.5 5.5" stroke="#336791" strokeWidth="1.75" strokeLinecap="round"/><circle cx="18.5" cy="12" r="1.2" fill="#336791"/></svg> },
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
  { id: 'dbt Semantic Layer',       desc: 'Metrics & dimension definitions from dbt Cloud', icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="8" cy="16" r="4.5" fill="#FF694A" fillOpacity="0.15" stroke="#FF694A" strokeWidth="1.75"/><circle cx="24" cy="16" r="4.5" fill="#FF694A" fillOpacity="0.15" stroke="#FF694A" strokeWidth="1.75"/><path d="M12.5 16h7" stroke="#FF694A" strokeWidth="1.75" strokeLinecap="round"/><path d="M17 13l3 3-3 3" stroke="#FF694A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'Snowflake Cortex',         desc: 'Semantic views & ML functions in Snowflake',    icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M15 3v22M6.1 8l17.8 13.5M23.9 8L6.1 21.5" stroke="#29B5E8" strokeWidth="2.2" strokeLinecap="round"/><path d="M15 3l-2.5 3.5M15 3l2.5 3.5M15 25l-2.5-3.5M15 25l2.5 3.5" stroke="#29B5E8" strokeWidth="1.5" strokeLinecap="round"/><path d="M6.1 8l3.5 1.1M6.1 8l1.1 3.5M23.9 8l-3.5 1.1M23.9 8l-1.1 3.5M6.1 21.5l3.5-1.1M6.1 21.5l1.1-3.5M23.9 21.5l-3.5-1.1M23.9 21.5l-1.1-3.5" stroke="#29B5E8" strokeWidth="1.4" strokeLinecap="round"/><path d="M26 5l.7 1.8 1.8.7-1.8.7L26 10l-.7-1.8-1.8-.7 1.8-.7z" fill="#8C62F5"/></svg> },
  { id: 'Databricks Unity Catalog', desc: 'Unified governance & metric definitions',       icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M7.5 12l8.5-8 8.5 8-8.5 5z" fill="#FF3621"/><path d="M7.5 17.5l8.5 5 8.5-5-8.5 5.5z" fill="#FF6B35"/><path d="M7.5 22l8.5 4.5 8.5-4.5-8.5 5z" fill="#FF3621" opacity="0.6"/><circle cx="25" cy="8" r="4.5" fill="#1B3139"/><path d="M23 8h4M25 6v4" stroke="white" strokeWidth="1.4" strokeLinecap="round"/></svg> },
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
          <svg width="13" height="13" viewBox="0 0 32 32" fill="none"><circle cx="8" cy="16" r="4" fill="#FF694A" fillOpacity="0.2" stroke="#FF694A" strokeWidth="1.6"/><circle cx="24" cy="16" r="4" fill="#FF694A" fillOpacity="0.2" stroke="#FF694A" strokeWidth="1.6"/><path d="M12 16h8" stroke="#FF694A" strokeWidth="1.6" strokeLinecap="round"/><path d="M18 13.5l2.5 2.5-2.5 2.5" stroke="#FF694A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {sourceLabel}
        </div>
      </div>
      <div style={{ background: bBase, borderRadius: 16, padding: sp.F, border: `1px solid ${bdiv}` }}>
        <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: sp.D }}>Connection details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.D }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Semantic connection name</label>
            <input type="text" placeholder="e.g. dbt-production" style={inputSt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>URL</label>
            <input type="text" placeholder="https://cloud.getdbt.com/" style={inputSt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Access token</label>
            <input type="password" placeholder="" style={inputSt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Account ID</label>
            <input type="text" placeholder="43692" style={inputSt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Project ID</label>
            <input type="text" placeholder="502023" style={inputSt} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
            <label style={labelSt}>Environment ID</label>
            <input type="text" placeholder="Enter environment id" style={inputSt} />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ─── Semantic dbt Model Selection Screen ─────────────────────────────────────

const DBT_FOLDERS: { name: string; path: string; synced: boolean; models: { id: string; name: string; description: string; synced: boolean; hasMetrics: boolean; table: string }[] }[] = [
  {
    name: 'marts',
    path: 'models/marts',
    synced: true,
    models: [
      { id: 'fct_orders',    name: 'fct_orders',    description: 'One row per order, with revenue and status',        synced: true,  hasMetrics: true,  table: 'ANALYTICS.MARTS.FCT_ORDERS'    },
      { id: 'fct_revenue',   name: 'fct_revenue',   description: 'Daily revenue rolled up by product and region',     synced: true,  hasMetrics: true,  table: 'ANALYTICS.MARTS.FCT_REVENUE'   },
      { id: 'fct_sessions',  name: 'fct_sessions',  description: 'Web sessions with attribution data',                synced: false, hasMetrics: false, table: 'ANALYTICS.MARTS.FCT_SESSIONS'  },
    ],
  },
  {
    name: 'core',
    path: 'models/core',
    synced: true,
    models: [
      { id: 'dim_customers', name: 'dim_customers', description: 'Customer master with LTV and segment',              synced: true,  hasMetrics: false, table: 'ANALYTICS.CORE.DIM_CUSTOMERS'  },
      { id: 'dim_products',  name: 'dim_products',  description: 'Product catalog with category hierarchy',           synced: true,  hasMetrics: false, table: 'ANALYTICS.CORE.DIM_PRODUCTS'   },
      { id: 'dim_date',      name: 'dim_date',      description: 'Date spine from 2020 to 2030',                      synced: false, hasMetrics: false, table: 'ANALYTICS.CORE.DIM_DATE'       },
    ],
  },
  {
    name: 'staging',
    path: 'models/staging',
    synced: false,
    models: [
      { id: 'stg_orders',    name: 'stg_orders',    description: 'Cleaned orders from the source system',             synced: false, hasMetrics: false, table: 'ANALYTICS.STAGING.STG_ORDERS'  },
      { id: 'stg_customers', name: 'stg_customers', description: 'Cleaned customer records',                          synced: false, hasMetrics: false, table: 'ANALYTICS.STAGING.STG_CUSTOMERS'},
      { id: 'stg_events',    name: 'stg_events',    description: 'Raw product events, deduplicated',                  synced: false, hasMetrics: false, table: 'ANALYTICS.STAGING.STG_EVENTS'  },
    ],
  },
];


const MetricsBadge: React.FC<{ has: boolean }> = ({ has }) => (
  <span style={{
    fontSize: 11, fontFamily: ff.primary, fontWeight: fw.medium,
    color: has ? '#15803D' : fg3,
    background: has ? '#DCFCE7' : c['background-subtle'],
    padding: '1px 7px', borderRadius: 99, whiteSpace: 'nowrap',
  }}>
    {has ? 'dbt metrics' : 'No metrics'}
  </span>
);

const SyncDot: React.FC<{ synced: boolean; showLabel?: boolean }> = ({ synced, showLabel = true }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: synced ? green : fg3, flexShrink: 0 }} />
    {showLabel && <span style={{ fontSize: 12, fontFamily: ff.primary, color: synced ? green : fg3, whiteSpace: 'nowrap' }}>{synced ? 'Synced' : 'Not synced'}</span>}
  </div>
);

const ModelChk: React.FC<{ checked: boolean; indeterminate: boolean; onClick: (e: React.MouseEvent) => void }> = ({ checked, indeterminate, onClick }) => (
  <div onClick={onClick} style={{
    width: 16, height: 16, borderRadius: 3, flexShrink: 0, cursor: 'pointer',
    border: `1.5px solid ${checked || indeterminate ? brand : c['border-default']}`,
    background: checked || indeterminate ? brand : bBase,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {checked && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    {!checked && indeterminate && <div style={{ width: 7, height: 2, background: 'white', borderRadius: 1 }} />}
  </div>
);

const SemanticDbtModelsScreen: React.FC = () => {
  const allIds = DBT_FOLDERS.flatMap(f => f.models.map(m => m.id));

  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState('');

  const toggle = (id: string) => setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleFolder = (name: string) => {
    const ids = DBT_FOLDERS.find(f => f.name === name)!.models.map(m => m.id);
    const allOn = ids.every(id => checked.has(id));
    setChecked(prev => { const n = new Set(prev); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
  };
  const toggleExpand = (name: string) => setExpanded(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n; });

  const allChecked = allIds.every(id => checked.has(id));
  const someChecked = checked.size > 0 && !allChecked;
  const isSearching = search.trim() !== '';

  const filteredFolders = isSearching
    ? DBT_FOLDERS.map(f => ({ ...f, models: f.models.filter(m => m.name.includes(search.toLowerCase())) })).filter(f => f.models.length > 0)
    : DBT_FOLDERS;

  return (
    <div style={{ background: bSunk, minHeight: '100%' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>

        {/* Page title */}
        <div style={{ marginBottom: sp.F }}>
          <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
            Select models
          </h2>
          <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary, lineHeight: 1.6 }}>
            Choose which dbt models to import into ThoughtSpot. You can update this later.
          </p>
        </div>

        <div style={{ background: bBase, borderRadius: 16, border: `1px solid ${bdiv}`, overflow: 'hidden' }}>

          {/* Search toolbar */}
          <div style={{ padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${bdiv}` }}>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: fg3, pointerEvents: 'none' }}>
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <input type="text" placeholder="Search models…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ ...inputSt, paddingLeft: 32, height: 34, fontSize: fs.sm }} />
            </div>
          </div>

          {/* Select-all row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `9px ${sp.D}px`, borderBottom: `1px solid ${bdiv}` }}>
            <ModelChk
              checked={allChecked}
              indeterminate={someChecked}
              onClick={e => { e.stopPropagation(); setChecked(allChecked ? new Set() : new Set(allIds)); }}
            />
            <span style={{ fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>Select all</span>
            <span style={{ marginLeft: 'auto', fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
              <span style={{ fontWeight: fw.medium, color: fg1 }}>{checked.size}</span>{' of '}{allIds.length} selected
            </span>
          </div>

          {/* Folder accordion */}
          {filteredFolders.map((folder) => {
            const folderIds = folder.models.map(m => m.id);
            const allFolderOn  = folderIds.every(id => checked.has(id));
            const someFolderOn = folderIds.some(id => checked.has(id)) && !allFolderOn;
            const isOpen = isSearching || expanded.has(folder.name);

            return (
              <div key={folder.name} style={{ borderBottom: `1px solid ${bdiv}` }}>

                {/* Folder header */}
                <div onClick={() => toggleExpand(folder.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: sp.B, padding: `9px ${sp.D}px`, background: bSunk, cursor: 'pointer', userSelect: 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ flexShrink: 0, transition: 'transform 150ms', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
                    <path d="M4 5.5l3 3 3-3" stroke={fg2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <ModelChk
                    checked={allFolderOn}
                    indeterminate={someFolderOn}
                    onClick={e => { e.stopPropagation(); toggleFolder(folder.name); }}
                  />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: sp.B }}>
                    <span style={{ ...ts.overline, color: fg1 }}>{folder.name}</span>
                    <span style={{ fontSize: 11, color: fg3, fontFamily: ff.mono }}>{folder.path}</span>
                    <span style={{ fontSize: 12, color: fg3, fontFamily: ff.primary }}>
                      {folderIds.filter(id => checked.has(id)).length}/{folder.models.length}
                    </span>
                  </div>
                  <SyncDot synced={folder.synced} />
                </div>

                {/* Expanded model list */}
                {isOpen && (
                  <div style={{ borderTop: `1px solid ${bdiv}` }}>
                    {folder.models.map((model, mi) => (
                      <div key={model.id} onClick={() => toggle(model.id)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: sp.C, padding: `11px ${sp.D}px 11px 46px`, borderBottom: mi < folder.models.length - 1 ? `1px solid ${bdiv}` : 'none', cursor: 'pointer', userSelect: 'none', background: checked.has(model.id) ? 'rgba(39,112,239,0.035)' : 'transparent', transition: 'background 120ms' }}>
                        <ModelChk
                          checked={checked.has(model.id)}
                          indeterminate={false}
                          onClick={e => { e.stopPropagation(); toggle(model.id); }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 2 }}>{model.name}</div>
                          <div style={{ fontSize: 12, color: fg2, fontFamily: ff.primary, lineHeight: 1.5, marginBottom: 5 }}>{model.description}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, flexWrap: 'wrap' }}>
                            <span style={{ fontFamily: ff.mono, fontSize: 10, color: fg2, letterSpacing: '0.04em' }}>{model.table}</span>
                            <MetricsBadge has={model.hasMetrics} />
                          </div>
                        </div>
                        <SyncDot synced={model.synced} />
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })}

          {isSearching && filteredFolders.length === 0 && (
            <div style={{ padding: `${sp.H}px ${sp.D}px`, textAlign: 'center', color: fg2, fontSize: fs.sm, fontFamily: ff.primary }}>
              No models match "{search}"
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

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
  const headTitle = selectedSource === 'dbt Semantic Layer'
    ? 'Select your database connection'
    : 'Create a semantic connection';
  const headDesc = selectedSource === 'Snowflake Cortex'
    ? 'Give this semantic connection a name, then choose the Snowflake warehouse ThoughtSpot should read your Cortex semantic views from.'
    : 'Choose the Snowflake warehouse where your dbt models run. ThoughtSpot will read the underlying data from here.';

  return (
    <div style={{ background: bSunk, minHeight: '100%' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
        <div style={{ marginBottom: sp.F }}>
          <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
            {headTitle}
          </h2>
          <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary, lineHeight: 1.6 }}>
            {headDesc}
          </p>
        </div>

        {/* Single unified card */}
        <div style={{ background: bBase, borderRadius: 16, border: `1px solid ${bdiv}`, overflow: 'hidden' }}>

          {/* Name + description — only for Snowflake Cortex */}
          {selectedSource === 'Snowflake Cortex' && (
            <>
              <div style={{ padding: sp.F, display: 'flex', flexDirection: 'column', gap: sp.D }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                  <label style={labelSt}>Semantic connection name</label>
                  <input type="text" placeholder="e.g. cortex-semantic-prod" style={inputSt} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                  <label style={labelSt}>
                    Description <span style={{ fontWeight: 400, color: fg3 }}>(optional)</span>
                  </label>
                  <textarea
                    placeholder="What semantic models does this connection expose? Who owns it?"
                    style={{ ...inputSt, height: 72, padding: sp.C, resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>
              </div>
              <div style={{ height: 1, background: bdiv }} />
            </>
          )}

          {/* Snowflake source section label */}
          <div style={{ padding: `${sp.D}px ${sp.F}px ${sp.C}px` }}>
            <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary }}>
              {selectedSource === 'dbt Semantic Layer' ? 'Database connection' : 'Snowflake source'}
            </div>
            <div style={{ fontSize: 12, color: fg2, fontFamily: ff.primary, marginTop: 4 }}>
              {selectedSource === 'dbt Semantic Layer'
                ? 'Choose the Snowflake warehouse where your dbt models run'
                : 'Choose the Snowflake warehouse to bring the semantic layer from'}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {SF_EXISTING.map((conn, i) => {
              const sel = selectedSfConn === conn.id;
              return (
                <div key={conn.id}>
                  {i > 0 && <div style={{ height: 1, background: bdiv, margin: `0 ${sp.F}px` }} />}
                  <div onClick={() => onPickSfConn(conn.id)} style={{
                    display: 'flex', alignItems: 'center', gap: sp.C,
                    padding: `12px ${sp.F}px`,
                    background: sel ? 'rgba(39,112,239,0.04)' : 'transparent',
                    cursor: 'pointer', transition: 'background 150ms',
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${sel ? brand : bdef}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 150ms' }}>
                      {sel && <div style={{ width: 9, height: 9, borderRadius: '50%', background: brand }} />}
                    </div>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: bSunk, border: `1px solid ${bdiv}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <SnowflakeIcon />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary }}>{conn.name}</div>
                      <div style={{ fontSize: 11, color: fg2, fontFamily: ff.primary, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.meta}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: conn.status === 'connected' ? green : '#F5A623', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: fw.medium, color: conn.status === 'connected' ? green : '#E0831A', fontFamily: ff.primary }}>
                        {conn.status === 'connected' ? 'Connected' : 'Auth needed'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "or" divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.B}px ${sp.F}px` }}>
            <div style={{ flex: 1, height: 1, background: bdiv }} />
            <span style={{ fontSize: 11, color: fg3, fontFamily: ff.primary }}>or</span>
            <div style={{ flex: 1, height: 1, background: bdiv }} />
          </div>

          {/* Create new row */}
          {(() => {
            const sel = selectedSfConn === 'new';
            return (
              <div onClick={() => onPickSfConn('new')} style={{
                display: 'flex', alignItems: 'center', gap: sp.C,
                padding: `12px ${sp.F}px`,
                background: sel ? 'rgba(39,112,239,0.04)' : 'transparent',
                cursor: 'pointer', transition: 'background 150ms',
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
                  <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary }}>Connect a new Snowflake warehouse</div>
                  <div style={{ fontSize: 11, color: fg2, fontFamily: ff.primary, marginTop: 2 }}>Don't see your warehouse? Authenticate a new Snowflake source right here.</div>
                </div>
              </div>
            );
          })()}

          {/* Bottom spacer — matches top padding (sp.F=24); row has 12px bottom, so +12px here) */}
          {selectedSfConn !== 'new' && <div style={{ height: 12 }} />}

          {/* Inline new-connection form */}
          {selectedSfConn === 'new' && (
            <>
              <style>{`@keyframes ncp-card-enter { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>
              <div style={{ height: 1, background: bdiv }} />
              <div style={{ padding: sp.F, animation: 'ncp-card-enter 0.24s ease both' }}>
                <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: sp.D }}>New Snowflake warehouse</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: sp.D }}>
                  <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: sp.B }}>
                    <label style={labelSt}>Warehouse name</label>
                    <input type="text" placeholder="e.g. snowflake-prod" style={inputSt} />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Apps Source Screen ───────────────────────────────────────────────────────
const APP_SOURCES = [
  { id: 'Salesforce', desc: 'CRM & customer data',      icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M12.5 8.5c1-2.8 4-4.5 7-3.8 2.2.5 4 2.2 4.5 4.3 1.2-.5 2.8-.3 3.8.8 1.2 1.2 1.3 3 .3 4.4 1.3 1 2 2.5 1.8 4.2-.4 2.3-2.5 3.9-4.8 3.9H8.5C6 22.3 4 20.3 4 17.8c0-1.9 1.2-3.6 3-4.3.3-2.2 2-4 4.3-4.5" stroke="#00A1E0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'Mixpanel',   desc: 'Product analytics',        icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="8" cy="22" r="3" fill="#7856FF" fillOpacity="0.8"/><circle cx="16" cy="14" r="3" fill="#7856FF" fillOpacity="0.6"/><circle cx="24" cy="8" r="3" fill="#7856FF" fillOpacity="0.4"/><path d="M8 22l8-8 8-6" stroke="#7856FF" strokeWidth="1.75" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5"/></svg> },
  { id: 'Pendo',      desc: 'User engagement data',     icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><path d="M9 7h9c3.5 0 6.5 2.8 6.5 6.5S21.5 20 18 20H9V7z" fill="#F6426E" fillOpacity="0.1" stroke="#F6426E" strokeWidth="2" strokeLinejoin="round"/><path d="M9 20v5" stroke="#F6426E" strokeWidth="2" strokeLinecap="round"/></svg> },
  { id: 'HubSpot',    desc: 'Marketing & sales data',   icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="4.5" fill="#FF7A59" fillOpacity="0.85"/><path d="M16 5v5.5M16 21.5v5.5M5 16h5.5M21.5 16h5.5" stroke="#FF7A59" strokeWidth="2" strokeLinecap="round"/><circle cx="16" cy="5" r="2.5" fill="#FF7A59" fillOpacity="0.3" stroke="#FF7A59" strokeWidth="1.5"/><circle cx="16" cy="27" r="2.5" fill="#FF7A59" fillOpacity="0.3" stroke="#FF7A59" strokeWidth="1.5"/><circle cx="5" cy="16" r="2.5" fill="#FF7A59" fillOpacity="0.3" stroke="#FF7A59" strokeWidth="1.5"/><circle cx="27" cy="16" r="2.5" fill="#FF7A59" fillOpacity="0.3" stroke="#FF7A59" strokeWidth="1.5"/></svg> },
  { id: 'Stripe',     desc: 'Payment & revenue data',   icon: <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect x="4" y="4" width="24" height="24" rx="6" fill="#635BFF" fillOpacity="0.1" stroke="#635BFF" strokeWidth="1.5"/><path d="M20 12.5c0-2-1.8-3.5-4.5-3.5-2.5 0-4.5 1.5-4.5 4 0 2.5 2 3.5 4.5 4.5 2.5 1 4 2.2 4 4.5 0 2.5-2.2 4-5 4s-5-1.8-5-4" stroke="#635BFF" strokeWidth="2" strokeLinecap="round"/></svg> },
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

// ─── Apps Auth Screen ─────────────────────────────────────────────────────────
const AppsAuthScreen: React.FC<{ appName: string }> = ({ appName }) => {
  const [method, setMethod] = useState<'oauth' | 'apikey'>('oauth');

  return (
    <div style={{ background: bSunk, minHeight: '100%' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
        <div style={{ marginBottom: sp.F }}>
          <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
            Authenticate with {appName}
          </h2>
          <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary, lineHeight: 1.55 }}>
            Choose how ThoughtSpot should identify itself when calling the {appName} API.
          </p>
        </div>

        {/* Method toggle */}
        <div style={{ background: bBase, border: `1px solid ${bdiv}`, borderRadius: 12, overflow: 'hidden', marginBottom: sp.D }}>
          <div style={{ display: 'flex', padding: sp.C, gap: sp.B, background: bSunk, borderBottom: `1px solid ${bdiv}` }}>
            {(['oauth', 'apikey'] as const).map(m => (
              <button key={m} onClick={() => { setMethod(m); }} style={{
                flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: fs.sm, fontFamily: ff.primary, fontWeight: method === m ? fw.medium : 400,
                background: method === m ? bBase : 'transparent',
                color: method === m ? fg1 : fg2,
                boxShadow: method === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms',
              }}>
                {m === 'oauth' ? 'OAuth 2.0' : 'Service Token'}
              </button>
            ))}
          </div>

          <div style={{ padding: `${sp.D}px ${sp.E}px`, display: 'flex', flexDirection: 'column', gap: sp.D }}>
            {method === 'oauth' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.C, padding: sp.C, borderRadius: 8, background: 'rgba(39,112,239,0.05)', border: '1px solid rgba(39,112,239,0.15)' }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="8" cy="8" r="6.5" stroke={brand} strokeWidth="1.25"/>
                    <path d="M8 7v3.5M8 5.5v.5" stroke={brand} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize: 12, color: fg2, fontFamily: ff.primary, lineHeight: 1.5 }}>
                    You'll be redirected to <strong style={{ color: fg1 }}>{appName}</strong> to authorize read-only access. ThoughtSpot never stores your password.
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                  <label style={labelSt}>Client ID</label>
                  <input type="text" placeholder="e.g. 12abc34d-ef56-…" style={inputSt} />
                  <span style={{ fontSize: 11, color: fg2, fontFamily: ff.primary, marginTop: 2 }}>{appName} → Settings → OAuth Applications</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                  <label style={labelSt}>Client secret</label>
                  <input type="password" placeholder="Paste OAuth secret…" style={inputSt} />
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                  <label style={labelSt}>Service account username</label>
                  <input type="text" placeholder="e.g. thoughtspot.sync" style={inputSt} />
                  <span style={{ fontSize: 11, color: fg2, fontFamily: ff.primary, marginTop: 2 }}>{appName} → Organization Settings → Service Accounts</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                  <label style={labelSt}>Bearer token / secret</label>
                  <input type="password" placeholder="Paste service account secret…" style={inputSt} />
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// ─── Apps Scope Screen ────────────────────────────────────────────────────────
const SCOPE_GROUPS = [
  {
    label: 'Core Events',
    items: [
      { id: 'pageview',  label: '$pageview',           sub: 'Page view events',              records: 820000,  lookback: 90  },
      { id: 'track',     label: 'Custom track events', sub: 'All .track() calls',             records: 1140000, lookback: 90  },
      { id: 'identify',  label: 'User identify',       sub: 'User profile stitching events',  records: 142000,  lookback: 90  },
    ],
  },
  {
    label: 'User Properties',
    items: [
      { id: 'user_props', label: 'User property columns',  sub: 'plan, country, created_at…', records: 38000, lookback: 180 },
      { id: 'cohorts',    label: 'Cohort memberships',     sub: 'Current cohort assignments', records: 12200, lookback: 30  },
    ],
  },
  {
    label: 'Revenue Events',
    items: [
      { id: 'revenue', label: 'Charge / subscription', sub: 'Purchase and renewal events', records: 64400, lookback: 90 },
      { id: 'refund',  label: 'Refund events',         sub: 'Full and partial refunds',    records: 8200,  lookback: 90 },
    ],
  },
];

const ALL_SCOPE_ITEMS = SCOPE_GROUPS.flatMap(g => g.items);
const ALL_SCOPE_IDS   = ALL_SCOPE_ITEMS.map(i => i.id);

function fmtRec(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return Math.round(n / 1000) + 'K';
  return String(n);
}
function fmtMB(bytes: number): string {
  if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
  return Math.round(bytes / 1e6) + ' MB';
}

const AppsScopeScreen: React.FC = () => {
  const [checked,   setChecked]   = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setChecked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleGroup = (ids: string[]) => {
    const allOn = ids.every(id => checked.has(id));
    setChecked(prev => { const s = new Set(prev); ids.forEach(id => allOn ? s.delete(id) : s.add(id)); return s; });
  };

  const toggleCollapse = (label: string) =>
    setCollapsed(prev => { const s = new Set(prev); s.has(label) ? s.delete(label) : s.add(label); return s; });

  const sel = ALL_SCOPE_ITEMS.filter(i => checked.has(i.id));
  const totalRec  = sel.reduce((sum, i) => sum + i.records, 0);
  const maxLook   = sel.length > 0 ? Math.max(...sel.map(i => i.lookback)) : 0;
  const sizeBytes = totalRec * 370;
  const syncMin   = Math.max(1, Math.round(totalRec / 180000));

  const estimCards = [
    { label: 'Expected records', val: checked.size === 0 ? '—' : `~${fmtRec(totalRec)}`,     color: brand,    icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 12V6l5-3 5 3v6l-5 3-5-3z" stroke={brand} strokeWidth="1.4" strokeLinejoin="round"/></svg> },
    { label: 'API lookback',     val: maxLook > 0 ? `${maxLook} days` : '—',                  color: '#8C62F5', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#8C62F5" strokeWidth="1.4"/><path d="M8 5v3.5l2 1.5" stroke="#8C62F5" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { label: 'Est. size',        val: checked.size === 0 ? '—' : `~${fmtMB(sizeBytes)}`,      color: '#0EA47A', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="3" y="4" width="10" height="8" rx="1.5" stroke="#0EA47A" strokeWidth="1.4"/><path d="M6 8h4M8 6v4" stroke="#0EA47A" strokeWidth="1.4" strokeLinecap="round"/></svg> },
    { label: 'Sync duration',    val: checked.size === 0 ? '—' : `~${syncMin} min`,            color: '#F59E0B', icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#F59E0B" strokeWidth="1.4"/><path d="M8 4v4.5l3 1.5" stroke="#F59E0B" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  ];

  return (
    <div style={{ background: bSunk, minHeight: '100%' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
        <div style={{ marginBottom: sp.F }}>
          <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
            Scope selection
          </h2>
          <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
            Choose which event types and properties to sync. Fewer scopes mean faster syncs and lower memory usage.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: sp.F, alignItems: 'start' }}>
          {/* Checklist */}
          <div style={{ background: bBase, border: `1px solid ${bdiv}`, borderRadius: 12, overflow: 'hidden' }}>
            {SCOPE_GROUPS.map((group, gi) => {
              const gids  = group.items.map(i => i.id);
              const allOn = gids.every(id => checked.has(id));
              const someOn = gids.some(id => checked.has(id)) && !allOn;
              const isCollapsed = collapsed.has(group.label);
              return (
                <div key={group.label}>
                  {gi > 0 && <div style={{ height: 1, background: bdiv }} />}
                  <div
                    onClick={() => toggleCollapse(group.label)}
                    style={{ padding: `8px ${sp.E}px`, background: bSunk, display: 'flex', alignItems: 'center', gap: sp.C, cursor: 'pointer', userSelect: 'none' }}
                  >
                    <label onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1 }}>
                      <input type="checkbox" checked={allOn}
                        ref={el => { if (el) el.indeterminate = someOn; }}
                        onChange={() => toggleGroup(gids)}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: brand }} />
                      <span style={{ ...ts.overline.regular, color: fg1 }}>{group.label}</span>
                    </label>
                    {/* Chevron — right side */}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transition: 'transform 180ms', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                      <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke={fg3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {!isCollapsed && group.items.map(item => (
                    <label key={item.id} style={{
                      display: 'flex', alignItems: 'center', padding: `10px ${sp.E}px`, gap: sp.C,
                      cursor: 'pointer', borderTop: `1px solid ${bdiv}`,
                    }}>
                      <input type="checkbox" checked={checked.has(item.id)} onChange={() => toggle(item.id)}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: brand, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: fg3, fontFamily: ff.primary, marginTop: 1 }}>{item.sub}</div>
                      </div>
                      <span style={{ fontSize: 12, color: fg2, fontFamily: ff.primary, flexShrink: 0 }}>~{fmtRec(item.records)}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Estimator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
            <span style={{ fontSize: 11, fontWeight: fw.medium, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: fg3, fontFamily: ff.primary }}>
              Live estimate
            </span>
            {estimCards.map(card => (
              <div key={card.label} style={{ background: bBase, border: `1px solid ${bdiv}`, borderRadius: 10, padding: `${sp.C}px ${sp.D}px`, display: 'flex', alignItems: 'center', gap: sp.C }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: fg3, fontFamily: ff.primary }}>{card.label}</div>
                  <div style={{ fontSize: 17, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginTop: 1 }}>{card.val}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Apps Flatten Screen ──────────────────────────────────────────────────────
type FlattenRow = {
  id: string;
  src: string;
  type: 'STRING' | 'NUMBER' | 'TIMESTAMP' | 'BOOLEAN';
  col: string;
  excluded: boolean;
};

const INIT_ROWS: FlattenRow[] = [
  { id: 'r1',  src: 'time',                  type: 'TIMESTAMP', col: 'event_time',    excluded: false },
  { id: 'r2',  src: 'distinct_id',           type: 'STRING',    col: 'distinct_id',   excluded: false },
  { id: 'r3',  src: '$insert_id',            type: 'STRING',    col: 'insert_id',     excluded: false },
  { id: 'r4',  src: 'properties.$os',        type: 'STRING',    col: 'event_os',      excluded: false },
  { id: 'r5',  src: 'properties.$browser',   type: 'STRING',    col: 'event_browser', excluded: false },
  { id: 'r6',  src: 'properties.url',        type: 'STRING',    col: 'event_url',     excluded: false },
  { id: 'r7',  src: 'properties.price',      type: 'NUMBER',    col: 'event_price',   excluded: false },
  { id: 'r8',  src: 'properties.plan',       type: 'STRING',    col: 'user_plan',     excluded: false },
  { id: 'r9',  src: 'properties.country',    type: 'STRING',    col: 'user_country',  excluded: false },
  { id: 'r10', src: 'properties.is_paid',    type: 'BOOLEAN',   col: 'is_paid',       excluded: false },
];

const TYPE_CHIP: Record<string, { color: string; bg: string }> = {
  STRING:    { color: '#7856FF', bg: 'rgba(120,86,255,0.1)'  },
  NUMBER:    { color: '#0EA47A', bg: 'rgba(14,164,122,0.1)'  },
  TIMESTAMP: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  BOOLEAN:   { color: '#2770EF', bg: 'rgba(39,112,239,0.1)'  },
};

const AppsFlattenScreen: React.FC = () => {
  const [rows, setRows]       = useState<FlattenRow[]>(INIT_ROWS);
  const [editId, setEditId]   = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const update = (id: string, patch: Partial<FlattenRow>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const startEdit = (id: string, val: string) => { setEditId(id); setEditVal(val); };
  const commitEdit = (id: string) => {
    const v = editVal.trim().replace(/\s+/g, '_').toLowerCase();
    if (v) update(id, { col: v });
    setEditId(null);
  };

  const active = rows.filter(r => !r.excluded).length;

  return (
    <div style={{ background: bSunk, minHeight: '100%' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>
        <div style={{ marginBottom: sp.F }}>
          <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
            Auto-flattening preview
          </h2>
          <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>
            Nested JSON keys are automatically flattened into columns. Rename, retype, or exclude fields before import.
          </p>
        </div>

        <div style={{ background: bBase, border: `1px solid ${bdiv}`, borderRadius: 12, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 120px 1fr 110px',
            padding: `9px ${sp.E}px`, background: bSunk, borderBottom: `1px solid ${bdiv}`,
          }}>
            {['Source path', 'Inferred type', 'Target column', ''].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: fw.medium, textTransform: 'uppercase' as const, letterSpacing: '0.07em', color: fg3, fontFamily: ff.primary }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, i) => {
            const chip = TYPE_CHIP[row.type];
            return (
              <div key={row.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 1fr 110px',
                padding: `10px ${sp.E}px`, alignItems: 'center',
                borderTop: i > 0 ? `1px solid ${bdiv}` : 'none',
                background: row.excluded ? bSunk : 'transparent',
                opacity: row.excluded ? 0.45 : 1,
                transition: 'opacity 200ms',
              }}>
                <span style={{ fontSize: 12, color: fg2, fontFamily: ff.mono }}>{row.src}</span>

                {/* Type dropdown */}
                <div>
                  <select value={row.type} disabled={row.excluded}
                    onChange={e => update(row.id, { type: e.target.value as FlattenRow['type'] })}
                    style={{
                      fontSize: 11, fontWeight: fw.medium, color: chip.color,
                      background: chip.bg, border: `1px solid ${chip.color}44`,
                      borderRadius: 5, padding: '3px 7px', cursor: row.excluded ? 'not-allowed' : 'pointer',
                      fontFamily: ff.primary, outline: 'none', appearance: 'none' as const,
                    }}
                  >
                    {(['STRING', 'NUMBER', 'TIMESTAMP', 'BOOLEAN'] as const).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Target col — inline edit */}
                <div>
                  {editId === row.id ? (
                    <input type="text" value={editVal} autoFocus
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={() => commitEdit(row.id)}
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(row.id); if (e.key === 'Escape') setEditId(null); }}
                      style={{ ...inputSt, height: 28, fontSize: 12, fontFamily: ff.mono, maxWidth: 200 }}
                    />
                  ) : (
                    <button onClick={() => !row.excluded && startEdit(row.id, row.col)} style={{
                      background: 'none', border: 'none', padding: '2px 6px', borderRadius: 4,
                      fontSize: 12, fontFamily: ff.mono, color: fg1,
                      cursor: row.excluded ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {row.col}
                      {!row.excluded && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M8.5 2.5l1 1-6 6H2.5V8.5l6-6z" stroke={fg3} strokeWidth="1.2" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {/* Exclude toggle */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => update(row.id, { excluded: !row.excluded })} style={{
                    background: 'none', border: `1px solid ${bdef}`, borderRadius: 5,
                    padding: '3px 10px', fontSize: 11,
                    color: row.excluded ? brand : fg3,
                    cursor: 'pointer', fontFamily: ff.primary,
                    fontWeight: row.excluded ? fw.medium : 400,
                  }}>
                    {row.excluded ? 'Include' : 'Exclude'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 12, color: fg3, fontFamily: ff.primary, marginTop: sp.C }}>
          {active} of {rows.length} columns included
        </p>
      </div>
    </div>
  );
};

// ─── Apps Cache Screen ────────────────────────────────────────────────────────
type CacheSchedule = 'automatic' | 'custom';

const AppsCacheScreen: React.FC = () => {
  const [schedule, setSchedule] = useState<CacheSchedule>('automatic');
  const [refreshFreq, setRefreshFreq] = useState('6 hours');

  const opts: { id: CacheSchedule; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'automatic',
      label: 'Automatic refresh',
      desc: 'Cache refreshes on a fixed interval. ThoughtSpot handles scheduling — no configuration needed beyond the frequency.',
      icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M11 2.5l2 4.5h5l-4 3 1.5 4.5L11 12l-4.5 2.5L8 10l-4-3h5z" stroke={brand} strokeWidth="1.5" strokeLinejoin="round"/></svg>,
    },
    {
      id: 'custom',
      label: 'Custom schedule',
      desc: 'Set your own refresh interval with a cron expression. Useful for aligning cache refreshes with upstream pipeline runs.',
      icon: <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="3.5" y="4.5" width="15" height="14" rx="2.5" stroke="#F59E0B" strokeWidth="1.5"/><path d="M3.5 9h15M8 3.5v3M14 3.5v3" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    },
  ];

  const activeColor = schedule === 'automatic' ? brand : '#F59E0B';

  return (
    <div style={{ background: bSunk, minHeight: '100%' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: `${sp.H}px ${sp.F}px` }}>

        {/* Header */}
        <div style={{ marginBottom: sp.F }}>
          <h2 style={{ margin: `0 0 ${sp.B}px`, fontSize: 24, fontWeight: fw.medium, letterSpacing: '-0.02em', color: fg1, fontFamily: ff.primary }}>
            Cache settings
          </h2>
          <p style={{ margin: 0, fontSize: fs.sm, color: fg2, fontFamily: ff.primary, lineHeight: 1.55 }}>
            All synced Mixpanel data is cached by ThoughtSpot for fast query performance. Configure how often the cache refreshes.
          </p>
        </div>

        {/* Cache always-on badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, padding: `${sp.C}px ${sp.D}px`, borderRadius: 10, background: 'rgba(39,112,239,0.06)', border: '1px solid rgba(39,112,239,0.18)', marginBottom: sp.E }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="9" r="7.5" fill="rgba(39,112,239,0.1)" stroke={brand} strokeWidth="1.25"/>
            <path d="M6 9l2.5 2.5 4-4" stroke={brand} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontSize: 13, color: fg1, fontFamily: ff.primary }}>
            <strong style={{ fontWeight: fw.medium }}>ThoughtSpot Managed Cache</strong> — all imported columns will be cached
          </span>
        </div>

        {/* Refresh schedule options */}
        <div style={{ marginBottom: sp.D }}>
          <span style={{ fontSize: 11, fontWeight: fw.medium, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: fg3, fontFamily: ff.primary }}>
            Refresh schedule
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: sp.C }}>
          {opts.map(opt => {
            const isSel = schedule === opt.id;
            const col   = opt.id === 'automatic' ? brand : '#F59E0B';
            return (
              <div key={opt.id} onClick={() => setSchedule(opt.id)} style={{
                background: bBase, border: `2px solid ${isSel ? col : bdiv}`,
                borderRadius: 12, padding: `${sp.D}px ${sp.E}px`,
                cursor: 'pointer', transition: 'border-color 150ms',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.D }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: isSel ? `${col}12` : bSunk,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 150ms',
                  }}>
                    {opt.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 4 }}>{opt.label}</div>
                    <p style={{ margin: 0, fontSize: 12, color: fg2, fontFamily: ff.primary, lineHeight: 1.55 }}>{opt.desc}</p>

                    {/* Automatic: frequency dropdown */}
                    {opt.id === 'automatic' && isSel && (
                      <div style={{ marginTop: sp.C, display: 'flex', alignItems: 'center', gap: sp.C }}>
                        <span style={{ fontSize: 13, color: fg1, fontFamily: ff.primary }}>Refresh every</span>
                        <select value={refreshFreq} onChange={e => setRefreshFreq(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          style={{ height: 32, borderRadius: 6, border: `1px solid ${bdef}`, padding: `0 ${sp.C}px`, fontSize: fs.sm, color: fg1, background: bBase, fontFamily: ff.primary, cursor: 'pointer', outline: 'none' }}
                        >
                          {['1 hour', '3 hours', '6 hours', '12 hours', '24 hours'].map(v => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Custom: cron input */}
                    {opt.id === 'custom' && isSel && (
                      <div style={{ marginTop: sp.C, display: 'flex', flexDirection: 'column', gap: sp.B }}>
                        <input type="text" defaultValue="0 */6 * * *" placeholder="Cron expression"
                          style={{ ...inputSt, maxWidth: 220, fontFamily: ff.mono, fontSize: 12 }}
                          onClick={e => e.stopPropagation()}
                        />
                        <span style={{ fontSize: 11, color: fg3, fontFamily: ff.primary }}>UTC timezone</span>
                      </div>
                    )}
                  </div>
                  {/* Radio dot */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    border: `2px solid ${isSel ? col : bdef}`,
                    background: isSel ? col : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 150ms',
                  }}>
                    {isSel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── Success Screen ───────────────────────────────────────────────────────────
const SEMANTIC_SOURCES_SET = new Set(['dbt Semantic Layer', 'Snowflake Cortex', 'Databricks Unity Catalog']);

const SuccessCheckmark = () => (
  <>
    <style>{`
      @keyframes ncp-sck-pop  { 0%{transform:scale(0.5);opacity:0} 80%{transform:scale(1.06)} 100%{transform:scale(1);opacity:1} }
      @keyframes ncp-sck-draw { to { stroke-dashoffset: 0; } }
      @keyframes spin { to { transform: rotate(360deg); } }
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
            {sourceLabel === 'dbt Semantic Layer' ? 'Models imported' : 'Model imported'}
          </h2>
          <p style={{ fontSize: fs.sm, color: fg2, margin: `0 0 ${sp.D}px`, fontFamily: ff.primary, textAlign: 'center', lineHeight: 1.6, maxWidth: 420 }}>
            {sourceLabel === 'dbt Semantic Layer'
              ? <>Your metrics and dimensions from <strong style={{ color: fg1, fontWeight: fw.medium }}>{sourceLabel}</strong> have been imported as individual models — one per dbt model selected. Here's what to do next.</>
              : <>Your metrics and dimensions from <strong style={{ color: fg1, fontWeight: fw.medium }}>{sourceLabel}</strong> have been automatically imported. Here's how to activate them.</>
            }
          </p>
          <div style={{ display: 'flex', gap: sp.B, alignItems: 'center', justifyContent: 'center', marginBottom: sp.F }}>
            <span style={{ fontSize: 11, fontWeight: fw.medium, padding: '4px 14px', borderRadius: 99, background: bBase, border: `1px solid ${bdiv}`, color: fg1, fontFamily: ff.primary }}>{sourceLabel}</span>
          </div>

          {/* Next steps card — Open model CTA + capabilities list */}
          <div style={{
            width: '100%', marginBottom: sp.F,
            background: 'linear-gradient(150deg, #ffffff 0%, #f5f2ff 100%)',
            border: `1px solid ${bdiv}`, borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 2px 12px rgba(140,98,245,0.07)',
          }}>

            {/* Capabilities list */}
            <div style={{ padding: `${sp.D}px ${sp.E}px`, display: 'flex', flexDirection: 'column', gap: sp.C }}>
              {/* Item: Make it AI ready */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.C }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(39,112,239,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 9.5l-3.1 2 .6-3.5L3 5.5 6.5 5z" stroke={brand} strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 2 }}>{sourceLabel === 'dbt Semantic Layer' ? 'Make your models Spotter-ready' : 'Make your semantic layer Spotter-ready'}</div>
                  <div style={{ fontSize: 12, color: fg2, fontFamily: ff.primary, lineHeight: 1.45 }}>{sourceLabel === 'dbt Semantic Layer' ? 'Enrich your imported models with descriptions, synonyms, relationships, and verified answers — so Spotter responds with precision.' : 'Enrich your imported model with descriptions, synonyms, relationships, and verified answers — so Spotter responds with precision.'}</div>
                </div>
              </div>
              {/* Item: Enable for Spotter */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.C }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(140,98,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="#8C62F5" strokeWidth="1.4"/>
                    <path d="M5.5 8.5l2 2 3-4" stroke="#8C62F5" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 2 }}>Your whole team gets instant answers</div>
                  <div style={{ fontSize: 12, color: fg2, fontFamily: ff.primary, lineHeight: 1.45 }}>{sourceLabel === 'dbt Semantic Layer' ? 'Enable your models for Spotter to let your whole team ask questions in plain language.' : 'Enable for Spotter to let your whole team ask questions in plain language.'}</div>
                </div>
              </div>
            </div>

            {/* Card-level CTA */}
            <div style={{ padding: `${sp.C}px ${sp.E}px ${sp.D}px`, borderTop: `1px solid ${bdiv}` }}>
              <button onClick={goModels} style={{
                width: '100%', padding: '9px 0', borderRadius: 8,
                background: brand, color: 'white', border: 'none',
                fontSize: fs.sm, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary,
                letterSpacing: '0.01em',
              }}>
                Go to models
              </button>
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
        <div style={{
          width: '100%', marginBottom: sp.F,
          background: 'linear-gradient(150deg, #ffffff 0%, #f5f2ff 100%)',
          border: `1px solid ${bdiv}`, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(140,98,245,0.07)',
        }}>

          {/* Capabilities list */}
          <div style={{ padding: `${sp.D}px ${sp.E}px`, display: 'flex', flexDirection: 'column', gap: sp.C }}>
            {/* Joins & transformations */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.C }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(39,112,239,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7 2v10" stroke={brand} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 2 }}>Shape data around your team's questions</div>
                <div style={{ fontSize: 12, color: fg2, fontFamily: ff.primary, lineHeight: 1.45 }}>Join tables and apply transformations to shape data around your team's questions.</div>
              </div>
            </div>
            {/* AI-ready metrics */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.C }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(39,112,239,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2l1.5 3.5H12l-3 2.2 1.1 3.3L7 9l-3.1 2 1.1-3.3L2 5.5h3.5z" stroke={brand} strokeWidth="1.2" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 2 }}>Build an AI ready model</div>
                <div style={{ fontSize: 12, color: fg2, fontFamily: ff.primary, lineHeight: 1.45 }}>Build an AI ready model by enriching it with descriptions, synonyms, relationships, and verified answers — so Spotter responds with precision.</div>
              </div>
            </div>
            {/* Natural language search */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: sp.C }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(140,98,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4" stroke="#8C62F5" strokeWidth="1.4"/>
                  <path d="M9 9l3 3" stroke="#8C62F5" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: fw.medium, color: fg1, fontFamily: ff.primary, marginBottom: 2 }}>Self-serve analytics for everyone</div>
                <div style={{ fontSize: 12, color: fg2, fontFamily: ff.primary, lineHeight: 1.45 }}>Your team asks questions in plain English — Spotter finds the answer instantly.</div>
              </div>
            </div>
          </div>

          {/* Card-level CTA */}
          <div style={{ padding: `${sp.C}px ${sp.E}px ${sp.D}px`, borderTop: `1px solid ${bdiv}` }}>
            <button onClick={goModels} style={{
              width: '100%', padding: '9px 0', borderRadius: 8,
              background: brand, color: 'white', border: 'none',
              fontSize: fs.sm, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary,
              letterSpacing: '0.01em',
            }}>
              Create a model
            </button>
          </div>

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
  const isDbtConfigure = screen === 'semantic-configure' && selectedSource === 'dbt Semantic Layer';
  const isAppsAuth = screen === 'apps-auth';
  const needsTest = isConfig || isSfNewTest;
  const nextLabel = isDbtConfigure || isAppsAuth
    ? (testStatus === 'testing' ? 'Testing…' : 'Test connection')
    : needsTest
    ? (testStatus === 'testing' ? 'Testing…' : 'Test and create')
    : screen === 'semantic-dbt-models' ? 'Import models'
    : (screen === 'cdw-tables' || (screen === 'semantic-snowflake' && selectedSource !== 'dbt Semantic Layer') || screen === 'apps-cache') ? 'Create connection'
    : 'Next';
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
  const [screen,            setScreen]            = useState<Screen>('type-picker');
  const [selectedSource,    setSelectedSource]    = useState<string | null>(null);
  const [cgEnabled,         setCgEnabled]         = useState(false);
  const [testStatus,        setTestStatus]        = useState<'testing' | null>(null);
  const [checkedSchemas,    setCheckedSchemas]    = useState(['ANALYTICS · PUBLIC']);
  const [selectedSfConn,    setSelectedSfConn]    = useState<SfConn>(null);
  const [transitionLoading, setTransitionLoading] = useState<string | null>(null);

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

  const SEMANTIC_LOADING_LABELS: Partial<Record<Screen, string>> = {
    'semantic-source':     'Connecting to source…',
    'semantic-dbt-models': 'Importing models…',
    'semantic-snowflake':  'Verifying connection…',
    'apps-cache':          'Connecting to Mixpanel…',
  };

  const handleNext = () => {
    const next = nextScreen(screen, selectedSource);
    if (!next) return;
    // Test connection simulation for configure screens and new-SF-conn creation
    const isSfNewTest = screen === 'semantic-snowflake' && selectedSfConn === 'new';
    if (CONFIGURE_SCREENS.includes(screen) || isSfNewTest) {
      setTestStatus('testing');
      setTimeout(() => {
        setTestStatus(null);
        advanceTo(next);
      }, 1600);
      return;
    }
    // Loading transition for semantic screens
    const semanticLabel = SEMANTIC_LOADING_LABELS[screen];
    if (semanticLabel) {
      setTransitionLoading(semanticLabel);
      const ms = screen === 'semantic-dbt-models' ? 2800 : 2200;
      setTimeout(() => {
        setTransitionLoading(null);
        advanceTo(next);
      }, ms);
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

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {transitionLoading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: sp.D, background: bSunk }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ animation: 'spin 0.85s linear infinite' }}>
              <circle cx="16" cy="16" r="13" stroke={bdiv} strokeWidth="3"/>
              <path d="M16 3a13 13 0 0 1 13 13" stroke={brand} strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: fs.sm, color: fg2, fontFamily: ff.primary }}>{transitionLoading}</span>
          </div>
        ) : (
          <>
            {screen === 'type-picker'          && <TypePickerScreen onSelect={handleTypeSelect} />}
            {screen === 'cdw-source'           && <CdwSourceScreen selected={selectedSource} onSelect={setSelectedSource} />}
            {screen === 'cdw-configure'        && <CdwConfigureScreen sourceName={selectedSource ?? undefined} cgEnabled={cgEnabled} onCgToggle={() => setCgEnabled(v => !v)} />}
            {screen === 'cdw-tables'           && <CdwTablesScreen checked={checkedSchemas} onToggle={toggleSchema} />}
            {screen === 'semantic-source'      && <SemanticSourceScreen selected={selectedSource} onSelect={setSelectedSource} />}
            {screen === 'semantic-configure'   && <SemanticConfigureScreen sourceLabel={selectedSource ?? 'Semantic layer'} />}
            {screen === 'semantic-dbt-models'  && <SemanticDbtModelsScreen />}
            {screen === 'semantic-snowflake'   && <SemanticSnowflakeScreen selectedSource={selectedSource} selectedSfConn={selectedSfConn} onPickSfConn={setSelectedSfConn} />}
            {screen === 'apps-source'          && <AppsSourceScreen selected={selectedSource} onSelect={setSelectedSource} />}
            {screen === 'apps-auth'            && <AppsAuthScreen appName={selectedSource ?? 'your app'} />}
            {screen === 'apps-scope'           && <AppsScopeScreen />}
            {screen === 'apps-flatten'         && <AppsFlattenScreen />}
            {screen === 'apps-cache'           && <AppsCacheScreen />}
            {screen === 'success'              && <SuccessScreen sourceLabel={selectedSource ?? 'Connection'} cgEnabled={cgEnabled} isSemantic={SEMANTIC_SOURCES_SET.has(selectedSource ?? '')} onClose={onClose} onGoToModels={onGoToModels} />}
          </>
        )}
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
