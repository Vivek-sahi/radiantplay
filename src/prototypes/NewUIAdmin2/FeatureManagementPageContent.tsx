import React, { useState, useRef, useEffect } from 'react';
import { systemColors } from '../../tokens/colors';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

const Toggle: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    role="switch"
    aria-checked={checked}
    style={{
      position: 'relative', width: '36px', height: '20px', borderRadius: '10px',
      border: 'none', backgroundColor: checked ? brand : '#D1D5DB',
      cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background-color 0.2s ease',
    }}
  >
    <span style={{
      position: 'absolute', top: '2px', left: checked ? '18px' : '2px',
      width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff',
      transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
    }} />
  </button>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const SAMPLE_ORGS = ['Solidaris', 'Besins Healthcare', 'SymphonyAI', 'HIS', 'Conagra Brands'];
const EXTRA_ORGS  = ['Testorg3', 'Testorg2', 'Testorg1', 'SymphonyAI', 'Conagra Brands', 'Siemens Energy', 'Xtrac'];

type FeatureItem = {
  label: string;
  orgs: string[];
  orgsExtra: number;
  extraOrgsList?: string[];
  tooltip?: string;
};

const SECTIONS: { id: string; title: string; features: FeatureItem[] }[] = [
  {
    id: 'ts-ai',
    title: 'ThoughtSpot AI',
    features: [
      { label: 'Spotter',                                    orgs: [],         orgsExtra: 0, tooltip: 'No org gets the ability to override default value' },
      { label: 'Spotter on homepage and left navigation',    orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'Spotter on Liveboard',                       orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'Auto-mode to automatically select a data model', orgs: [],      orgsExtra: 0 },
      { label: 'Enable Connectors/MCP',                      orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'Enable chat history',                        orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'Chat history retention period',              orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'Enable add to coaching from conversation',   orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'AI Sample Questions',                        orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'AI Narratives for SpotIQ',                   orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'AI Highlights on Liveboard',                 orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'LLM Configuration provider',                 orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
      { label: 'Spotter connectors',                         orgs: SAMPLE_ORGS, orgsExtra: 5, extraOrgsList: EXTRA_ORGS },
    ],
  },
  {
    id: 'search-spotiq',
    title: 'Search & Spot IQ',
    features: [
      { label: 'SpotIQ Analyse',            orgs: SAMPLE_ORGS, orgsExtra: 3, extraOrgsList: EXTRA_ORGS.slice(0, 3) },
      { label: 'Change Analysis',           orgs: SAMPLE_ORGS, orgsExtra: 3, extraOrgsList: EXTRA_ORGS.slice(0, 3) },
      { label: 'KPI Anomalies',             orgs: [],          orgsExtra: 0 },
      { label: 'SQL Passthrough Functions', orgs: SAMPLE_ORGS, orgsExtra: 2, extraOrgsList: EXTRA_ORGS.slice(0, 2) },
    ],
  },
  {
    id: 'csv-upload',
    title: 'CSV Upload',
    features: [
      { label: 'Snowflake CSV upload',   orgs: SAMPLE_ORGS, orgsExtra: 1, extraOrgsList: EXTRA_ORGS.slice(0, 1) },
      { label: 'Databricks CSV upload',  orgs: [],          orgsExtra: 0 },
      { label: 'Google BigQuery upload', orgs: SAMPLE_ORGS, orgsExtra: 2, extraOrgsList: EXTRA_ORGS.slice(0, 2) },
    ],
  },
  {
    id: 'data-model',
    title: 'Data model',
    features: [
      { label: 'New TML Utility UI', orgs: SAMPLE_ORGS, orgsExtra: 4 },
      { label: 'Non Equi Joins',     orgs: [],          orgsExtra: 0 },
    ],
  },
  {
    id: 'downloads',
    title: 'Downloads & Schedules',
    features: [
      { label: 'Cover and filter pages in PDF',  orgs: SAMPLE_ORGS, orgsExtra: 2 },
      { label: 'Hide metadata header in CSV',    orgs: [],          orgsExtra: 0 },
      { label: 'Downloaded file instructions',   orgs: SAMPLE_ORGS, orgsExtra: 1 },
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    features: [
      { label: 'Hide org name',    orgs: SAMPLE_ORGS, orgsExtra: 2 },
      { label: 'Org URL sharing',  orgs: SAMPLE_ORGS, orgsExtra: 3 },
      { label: 'In-app support',   orgs: [],          orgsExtra: 0 },
    ],
  },
];

// ─── InfoTooltip ──────────────────────────────────────────────────────────────

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [visible, setVisible] = useState(false);

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '6px' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* ⓘ icon */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ cursor: 'default', flexShrink: 0 }}>
        <circle cx="7" cy="7" r="6.5" stroke="#9CA3AF" strokeWidth="1.2" fill="none" />
        <text x="7" y="11" textAnchor="middle" fontSize="8" fontWeight="700" fill="#9CA3AF" fontFamily="serif">i</text>
      </svg>
      {visible && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1F2937', color: '#FFFFFF',
          fontSize: '12px', fontFamily: font, fontWeight: 400, lineHeight: 1.5,
          padding: '8px 12px', borderRadius: '8px',
          whiteSpace: 'nowrap', zIndex: 200,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
        }}>
          {text.length > 36
            ? text.replace(/ (?=[^ ]*$)/, '\n').split('\n').map((line, i) => <div key={i}>{line}</div>)
            : text
          }
          {/* Arrow */}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid #1F2937',
          }} />
        </div>
      )}
    </span>
  );
};

// ─── FeatureRow ───────────────────────────────────────────────────────────────

const FeatureRow: React.FC<FeatureItem> = ({ label, orgs, orgsExtra, extraOrgsList, tooltip }) => {
  const hasOrgs = orgs.length > 0;
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopoverOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverOpen]);

  return (
    <div style={{
      backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
      padding: '16px 20px',
    }}>
      {/* Label row */}
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font, marginBottom: '8px' }}>
        {label}
      </div>

      {/* Orgs row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, flexWrap: 'wrap', gap: '2px' }}>
          {hasOrgs ? (
            <span style={{ fontSize: '13px', color: '#6B7280', fontFamily: font }}>
              {orgs.join(' , ')}
              {orgsExtra > 0 && extraOrgsList && (
                <>
                  {' '}
                  <span ref={popoverRef} style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      onClick={() => setPopoverOpen(!popoverOpen)}
                      style={{
                        border: 'none', background: 'none', cursor: 'pointer', padding: 0,
                        fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font,
                      }}
                    >
                      +{orgsExtra} more
                    </button>

                    {popoverOpen && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                        backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
                        borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        zIndex: 200, minWidth: '180px',
                        maxHeight: '220px', overflowY: 'auto',
                      }}>
                        {extraOrgsList.map((org) => (
                          <div key={org} style={{
                            padding: '10px 16px', fontSize: '13px', color: '#111827',
                            fontFamily: font, borderBottom: '1px solid #F3F4F6',
                          }}>
                            {org}
                          </div>
                        ))}
                      </div>
                    )}
                  </span>
                </>
              )}
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#9CA3AF', fontFamily: font }}>
              No org selected
              {tooltip && <InfoTooltip text={tooltip} />}
            </span>
          )}
        </div>

        {/* Action link */}
        <button style={{
          border: 'none', background: 'none', cursor: 'pointer', padding: 0,
          fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {hasOrgs ? 'Edit orgs' : 'Allocate orgs'}
        </button>
      </div>
    </div>
  );
};

// ─── CollapsibleGroup ─────────────────────────────────────────────────────────

const CollapsibleGroup: React.FC<{
  title: string;
  defaultOpen?: boolean;
  features: FeatureItem[];
}> = ({ title, defaultOpen = false, features }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
        padding: '16px 20px', border: 'none', borderBottom: open ? '1px solid #E5E7EB' : 'none',
        background: 'none', cursor: 'pointer', fontFamily: font, textAlign: 'left',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ flexShrink: 0, transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.22s ease' }}>
          <path d="M3 5.5l4 4 4-4" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', fontFamily: font }}>
          {title}
        </span>
      </button>

      <div style={{ maxHeight: open ? '4000px' : '0px', overflow: 'hidden', transition: 'max-height 0.28s ease' }}>
        <div style={{ padding: '12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {features.map((f, i) => <FeatureRow key={i} {...f} />)}
        </div>
      </div>
    </div>
  );
};

// ─── OrgSelector ──────────────────────────────────────────────────────────────

// ─── Early access data ────────────────────────────────────────────────────────

type EarlyFeature = {
  label: string;
  defaultEnabled: boolean;
  orgs?: string[];
  orgsExtra?: number;
  extraOrgsList?: string[];
};

const EARLY_FEATURES: EarlyFeature[] = [
  { label: 'Advanced settings for charts',                        defaultEnabled: true,  orgs: SAMPLE_ORGS, orgsExtra: 56, extraOrgsList: EXTRA_ORGS },
  { label: 'Categorise connectors',                               defaultEnabled: false },
  { label: 'Automatic OAuth Sign-In Trigger',                     defaultEnabled: false },
  { label: 'Build your own charts with Muze Studio',              defaultEnabled: false },
  { label: 'Categorise and style visualisations within Liveboard',defaultEnabled: true,  orgs: SAMPLE_ORGS, orgsExtra: 5,  extraOrgsList: EXTRA_ORGS },
  { label: 'ClickHouse connector',                                defaultEnabled: true,  orgs: SAMPLE_ORGS, orgsExtra: 5,  extraOrgsList: EXTRA_ORGS },
  { label: 'New connection configuration experience',             defaultEnabled: true,  orgs: SAMPLE_ORGS, orgsExtra: 5,  extraOrgsList: EXTRA_ORGS },
  { label: 'New Pivot Table',                                     defaultEnabled: true,  orgs: SAMPLE_ORGS, orgsExtra: 5,  extraOrgsList: EXTRA_ORGS },
  { label: 'OAuth Redirection Behaviour',                         defaultEnabled: true,  orgs: SAMPLE_ORGS, orgsExtra: 5,  extraOrgsList: EXTRA_ORGS },
];

// ─── EarlyAccessRow ───────────────────────────────────────────────────────────

const EarlyAccessRow: React.FC<EarlyFeature> = ({ label, defaultEnabled, orgs = [], orgsExtra = 0, extraOrgsList = [] }) => {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setPopoverOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverOpen]);

  return (
    <div style={{
      backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header: label + toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', padding: '18px 20px',
        borderBottom: (enabled && orgs.length > 0) ? '1px solid #E5E7EB' : 'none',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>
          {label}
        </span>
        <button onClick={() => setEnabled(!enabled)} role="switch" aria-checked={enabled}
          style={{
            position: 'relative', width: '36px', height: '20px', borderRadius: '10px', border: 'none',
            backgroundColor: enabled ? brand : '#D1D5DB',
            cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background-color 0.2s ease',
          }}
        >
          <span style={{
            position: 'absolute', top: '2px', left: enabled ? '18px' : '2px',
            width: '16px', height: '16px', borderRadius: '50%',
            backgroundColor: '#fff', transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
          }} />
        </button>
      </div>

      {/* Orgs row — only when enabled and has orgs */}
      {enabled && orgs.length > 0 && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: '16px', padding: '16px 20px',
          }}>
            <span style={{ fontSize: '13px', color: '#6B7280', fontFamily: font }}>
              {orgs.join(' , ')}
              {orgsExtra > 0 && (
                <>
                  {' '}
                  <span ref={popoverRef} style={{ position: 'relative', display: 'inline-block' }}>
                    <button onClick={() => setPopoverOpen(!popoverOpen)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font }}>
                      +{orgsExtra} more
                    </button>
                    {popoverOpen && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                        backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200,
                        minWidth: '180px', maxHeight: '220px', overflowY: 'auto',
                      }}>
                        {extraOrgsList.map((org) => (
                          <div key={org} style={{
                            padding: '10px 16px', fontSize: '13px', color: '#111827',
                            fontFamily: font, borderBottom: '1px solid #F3F4F6',
                          }}>
                            {org}
                          </div>
                        ))}
                      </div>
                    )}
                  </span>
                </>
              )}
            </span>
            <button style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: 0,
              fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font, flexShrink: 0,
            }}>
              Edit orgs
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const OrgSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ORGS = ['All orgs', 'Solidaris', 'Besins Healthcare', 'SymphonyAI', 'HIS', 'Conagra Brands'];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: '13px', color: '#6B7280', fontFamily: font }}>Orgs</span>
      <button onClick={() => setOpen(!open)} style={{
        border: 'none', background: 'none', cursor: 'pointer', padding: 0,
        fontSize: '13px', fontWeight: 500, color: brand, fontFamily: font,
        display: 'flex', alignItems: 'center', gap: '4px',
      }}>
        Select orgs
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
          <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke={brand} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)', zIndex: 100, overflow: 'hidden', minWidth: '200px',
        }}>
          {ORGS.map((org) => (
            <button key={org} onClick={() => setOpen(false)} style={{
              display: 'block', width: '100%', padding: '10px 16px',
              border: 'none', textAlign: 'left', fontFamily: font, fontSize: '13px',
              color: '#111827', backgroundColor: 'transparent', cursor: 'pointer',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
            >
              {org}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Primary Org Feature Data ─────────────────────────────────────────────────

const PRIMARY_ORG_FEATURES: { label: string; description: string; defaultEnabled: boolean }[] = [
  { label: 'Advanced settings for charts',                        description: 'Access advanced configuration options for chart visualisations.',                              defaultEnabled: false },
  { label: 'Categorise connectors',                               description: 'Organise and group data connectors into custom categories.',                                  defaultEnabled: true  },
  { label: 'Automatic OAuth Sign-In Trigger',                     description: 'Automatically initiate OAuth authentication when users sign in.',                             defaultEnabled: true  },
  { label: 'Build your own charts with Muze Studio',             description: 'Create custom chart types using the Muze Studio visual builder.',                             defaultEnabled: true  },
  { label: 'Categorise and style visualisations within Liveboard', description: 'Apply custom categories and styling to visualisations on Liveboards.',                       defaultEnabled: false },
  { label: 'ClickHouse connector',                               description: 'Connect to ClickHouse databases as a data source.',                                           defaultEnabled: true  },
  { label: 'New connection configuration experience',             description: 'Use the redesigned interface for setting up and managing data connections.',                   defaultEnabled: false },
  { label: 'New Pivot Table',                                     description: 'Use the updated pivot table component with enhanced sorting and formatting options.',          defaultEnabled: false },
  { label: 'OAuth Redirection Behaviour',                         description: 'Control how users are redirected after completing OAuth authentication.',                     defaultEnabled: false },
];

// ─── Primary Org Feature Row ──────────────────────────────────────────────────

const PrimaryOrgFeatureRow: React.FC<{ label: string; description: string; defaultEnabled: boolean }> = ({ label, description, defaultEnabled }) => {
  const [enabled, setEnabled] = useState(defaultEnabled);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '32px', padding: '16px 20px',
      backgroundColor: '#FFFFFF', border: '1px solid #E9EAEC', borderRadius: '8px',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font, lineHeight: 1.4 }}>{label}</div>
        <div style={{ fontSize: '12.5px', color: '#9CA3AF', fontFamily: font, marginTop: '3px', lineHeight: 1.5 }}>{description}</div>
      </div>
      <Toggle checked={enabled} onChange={() => setEnabled(!enabled)} />
    </div>
  );
};

// ─── FeatureManagementPageContent ─────────────────────────────────────────────

export const FeatureManagementPageContent: React.FC<{ scope?: 'all-orgs' | 'primary-org' }> = ({ scope = 'all-orgs' }) => {
  const isPrimary = scope === 'primary-org';
  const [activeTab, setActiveTab] = useState('general');

  const pageTabs = [
    { id: 'general', label: 'General access' },
    { id: 'early',   label: 'Early access'   },
  ];

  if (isPrimary) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
        {/* ── Sticky header ── */}
        <div style={{ flexShrink: 0, padding: '28px 40px 20px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px' }}>
            Feature management
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#6B7280', fontFamily: font, lineHeight: 1.5 }}>
            Manage &lsquo;Early access features&rsquo; for your org. For other features, contact your system admin.
          </p>
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 40px 64px', boxSizing: 'border-box' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '10px' }}>
                  <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.4" />
                  <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <input type="text" placeholder="Search" style={{
                  width: '220px', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                  border: '1px solid #D1D5DB', borderRadius: '8px',
                  fontFamily: font, fontSize: '13px', color: '#111827',
                  outline: 'none', backgroundColor: '#FFFFFF',
                }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '36px', padding: '0 14px',
                border: '1px solid #D1D5DB', borderRadius: '8px',
                backgroundColor: '#FFFFFF', cursor: 'pointer',
                fontFamily: font, fontSize: '13px', color: '#374151',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 3h12M3 7h8M5 11h4" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Orgs / Select orgs
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 3.5l3 3 3-3" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Feature list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PRIMARY_ORG_FEATURES.map((f, i) => <PrimaryOrgFeatureRow key={i} {...f} />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>

      {/* ── Sticky header ── */}
      <div style={{
        flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: '28px 40px 0', borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF',
      }}>
        <h1 style={{
          margin: '0 0 16px 0', fontSize: '22px', fontWeight: 700,
          color: '#0F172A', fontFamily: font, letterSpacing: '-0.3px',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Feature management
        </h1>
        <div style={{ width: '1px', height: '24px', backgroundColor: '#D1D5DB', margin: '0 24px 16px', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', flex: 1 }}>
          {pageTabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '0 14px 16px', border: 'none', background: 'none',
              cursor: 'pointer', fontFamily: font, fontSize: '13.5px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? brand : '#6B7280',
              borderBottom: activeTab === tab.id ? `2px solid ${brand}` : '2px solid transparent',
              marginBottom: '-1px', transition: 'color 0.15s', whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 40px 64px', boxSizing: 'border-box' }}>

          {activeTab === 'general' && (
            <>
              {/* Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                {/* Search */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ position: 'absolute', left: '10px' }}>
                    <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.4" />
                    <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input type="text" placeholder="Search" style={{
                    width: '220px', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                    border: '1px solid #D1D5DB', borderRadius: '8px',
                    fontFamily: font, fontSize: '13px', color: '#111827',
                    outline: 'none', backgroundColor: '#FFFFFF',
                  }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Org selector */}
                <OrgSelector />
              </div>

              {/* Collapsible sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {SECTIONS.map((section) => (
                  <CollapsibleGroup
                    key={section.id}
                    title={section.title}
                    defaultOpen={section.id === 'ts-ai'}
                    features={section.features}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === 'early' && (
            <>
              {/* Toolbar — same as general tab */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                    style={{ position: 'absolute', left: '10px' }}>
                    <circle cx="6" cy="6" r="4.5" stroke="#9CA3AF" strokeWidth="1.4" />
                    <line x1="9.5" y1="9.5" x2="12.5" y2="12.5" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input type="text" placeholder="Search" style={{
                    width: '220px', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                    border: '1px solid #D1D5DB', borderRadius: '8px',
                    fontFamily: font, fontSize: '13px', color: '#111827',
                    outline: 'none', backgroundColor: '#FFFFFF',
                  }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = brand; e.currentTarget.style.boxShadow = `0 0 0 2px ${brand}22`; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <OrgSelector />
              </div>

              {/* Feature rows — flat list, no collapsible groups */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {EARLY_FEATURES.map((f, i) => <EarlyAccessRow key={i} {...f} />)}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default FeatureManagementPageContent;
