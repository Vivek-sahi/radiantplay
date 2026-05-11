import React, { useState } from 'react';
import { c, sp, ff, fs, fw } from '../styles';

interface QualityPlanPanelProps {
  onClose: () => void;
  onApplyFixes: () => void;
  onEditPlan: () => void;
}

type SectionKey = 'goal' | 'nulls' | 'duplicates' | 'dates' | 'anomalous';

type Severity = 'high' | 'medium' | 'low';

interface Issue {
  col: string;
  severity: Severity;
  detail: string;
}

const SEVERITY_STYLE: Record<Severity, { bg: string; text: string; label: string }> = {
  high:   { bg: '#FEF2F2', text: '#DC2626', label: 'High' },
  medium: { bg: '#FFFBEB', text: '#D97706', label: 'Medium' },
  low:    { bg: '#F0FDF4', text: '#16A34A', label: 'Low' },
};

const SECTIONS: { key: SectionKey; label: string; issues: Issue[] }[] = [
  {
    key: 'nulls',
    label: 'Null values (3)',
    issues: [
      { col: 'campaign_id',      severity: 'high',   detail: '2.4% null values across 1,240 rows' },
      { col: 'conversion_date',  severity: 'medium', detail: '8% null — expected for non-converting events' },
      { col: 'user_segment',     severity: 'low',    detail: '0.3% null values' },
    ],
  },
  {
    key: 'duplicates',
    label: 'Duplicate rows (2)',
    issues: [
      { col: 'ad_impressions',   severity: 'high',   detail: '340 exact duplicates in the last 30-day window' },
      { col: 'campaign_spend',   severity: 'medium', detail: '12 near-duplicates within ±$0.01' },
    ],
  },
  {
    key: 'dates',
    label: 'Date format mismatches (3)',
    issues: [
      { col: 'conversion_date',  severity: 'high',   detail: 'Mixed ISO 8601 and MM/DD/YYYY formats' },
      { col: 'created_at',       severity: 'medium', detail: 'Timezone inconsistency (UTC vs local) in 6% of rows' },
      { col: 'session_date',     severity: 'low',    detail: '14 rows with year 2099 — likely import error' },
    ],
  },
  {
    key: 'anomalous',
    label: 'Anomalous values (1)',
    issues: [
      { col: 'revenue_amount',   severity: 'high',   detail: '3 rows with values > $1M (99.9th pct is $42K)' },
    ],
  },
];

const QualityPlanPanel: React.FC<QualityPlanPanelProps> = ({ onClose, onApplyFixes, onEditPlan }) => {
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    goal: false, nulls: false, duplicates: false, dates: false, anomalous: false,
  });

  const toggle = (key: SectionKey) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      <style>{`@keyframes ds-slide-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      <div style={{
        flex: 1,
        borderLeft: `1px solid ${c['border-divider']}`,
        backgroundColor: c['background-base'],
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        overflow: 'hidden',
        fontFamily: ff.primary,
        animation: 'ds-slide-in 0.2s ease-out',
      }}>
        <div style={{
          flex: 1,
          backgroundColor: c['background-base'],
          border: `1px solid ${c['border-default']}`,
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* Identity row */}
          <div style={{ height: 40, borderBottom: `1px solid ${c['border-divider']}`, padding: `0 ${sp.D}px`, display: 'flex', alignItems: 'center', gap: sp.C, flexShrink: 0 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: sp.B }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2L14 14H2L8 2z"/><line x1="8" y1="7" x2="8" y2="10"/><circle cx="8" cy="12.5" r="0.5" fill="#D97706"/>
              </svg>
              <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>Data Quality Plan</span>
              <span style={{ fontSize: 11, fontWeight: fw.medium, padding: '2px 7px', borderRadius: 4, backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>9 issues</span>
            </div>
            <button
              title="Download plan"
              style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: c['content-secondary'], padding: 0, flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v8"/><polyline points="5,7 8,10 11,7"/><path d="M3 13h10"/>
              </svg>
            </button>
            <button
              onClick={onClose}
              title="Close"
              style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, color: c['content-secondary'], padding: 0, flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="4" y1="4" x2="12" y2="12"/><line x1="12" y1="4" x2="4" y2="12"/>
              </svg>
            </button>
          </div>

          {/* Sections */}
          <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.B}px 0` }}>

            {/* Goal section */}
            <Section label="Goal" collapsed={collapsed.goal} onToggle={() => toggle('goal')}>
              <div style={{ padding: `0 ${sp.D}px ${sp.D}px` }}>
                <p style={{ margin: `0 0 ${sp.C}px`, fontSize: fs.sm, color: c['content-primary'], lineHeight: '20px' }}>
                  Identify and resolve data quality issues in the Campaign Performance model — null values, duplicate rows, date format inconsistencies, and anomalous transaction amounts.
                </p>
                <div style={{ display: 'flex', gap: sp.B, flexWrap: 'wrap' }}>
                  {([['4 high', '#FEF2F2', '#DC2626', '#FECACA'], ['4 medium', '#FFFBEB', '#D97706', '#FDE68A'], ['1 low', '#F0FDF4', '#16A34A', '#BBF7D0']] as const).map(([label, bg, text, border]) => (
                    <span key={label} style={{ fontSize: 11, fontWeight: fw.semibold, padding: '2px 8px', borderRadius: 4, backgroundColor: bg, color: text, border: `1px solid ${border}` }}>{label}</span>
                  ))}
                </div>
              </div>
            </Section>

            {SECTIONS.map(section => (
              <Section key={section.key} label={section.label} collapsed={collapsed[section.key]} onToggle={() => toggle(section.key)}>
                <div style={{ padding: `0 ${sp.D}px ${sp.D}px`, display: 'flex', flexDirection: 'column' }}>
                  {section.issues.map((issue, i) => {
                    const sev = SEVERITY_STYLE[issue.severity];
                    return (
                      <div key={issue.col} style={{ padding: `${sp.B}px 0`, borderBottom: i < section.issues.length - 1 ? `1px solid ${c['border-divider']}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, marginBottom: 3 }}>
                          <code style={{ fontSize: fs.xs, color: c['content-primary'], backgroundColor: c['background-subtle'], padding: '1px 5px', borderRadius: 3, fontFamily: 'monospace', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.col}</code>
                          <span style={{ fontSize: 11, fontWeight: fw.medium, padding: '1px 7px', borderRadius: 4, backgroundColor: sev.bg, color: sev.text, flexShrink: 0 }}>{sev.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: sp.B }}>
                          <p style={{ margin: 0, fontSize: fs.xs, color: c['content-secondary'], lineHeight: '16px' }}>{issue.detail}</p>
                          <button
                            style={{ fontSize: fs.xs, color: c['content-brand'], background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: ff.primary, flexShrink: 0, whiteSpace: 'nowrap' }}
                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                          >
                            → fix
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: `${sp.C}px ${sp.D}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', gap: sp.B, flexShrink: 0 }}>
            <button
              onClick={onApplyFixes}
              style={{ flex: 1, height: 32, backgroundColor: '#2770EF', color: '#fff', border: 'none', borderRadius: 7, fontSize: fs.sm, fontWeight: fw.semibold, cursor: 'pointer', fontFamily: ff.primary }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1a5fd4')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#2770EF')}
            >
              Apply fixes
            </button>
            <button
              onClick={onEditPlan}
              style={{ height: 32, padding: '0 14px', backgroundColor: 'transparent', color: c['content-primary'], border: `1px solid ${c['border-default']}`, borderRadius: 7, fontSize: fs.sm, fontWeight: fw.medium, cursor: 'pointer', fontFamily: ff.primary }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Edit plan
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

const Section: React.FC<{
  label: string;
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ label, collapsed, onToggle, children }) => (
  <div style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
    <button
      onClick={onToggle}
      style={{ width: '100%', padding: `${sp.C}px ${sp.D}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', fontFamily: ff.primary, textAlign: 'left' }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>{label}</span>
      <svg
        width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
      >
        <polyline points="2,4 6,8 10,4" />
      </svg>
    </button>
    {!collapsed && children}
  </div>
);

export default QualityPlanPanel;
