import React from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { RuleEntry } from './PrepContextPanel';

interface RulesChainPanelProps {
  rules: RuleEntry[];
  modelName: string;
  onClose: () => void;
}

const ISSUE_COLORS: Record<string, { bg: string; text: string }> = {
  'Null values':          { bg: '#fff7ed', text: '#c2410c' },
  'Blank strings':        { bg: '#f5f3ff', text: '#6d28d9' },
  'Type mismatch':        { bg: '#ecfdf5', text: '#065f46' },
  'Statistical anomaly':  { bg: '#fdf2f8', text: '#be185d' },
  'Duplicate rows':       { bg: '#eff6ff', text: '#1d4ed8' },
  'Date format':          { bg: '#f0fdf4', text: '#15803d' },
};

const TABLES_ORDER = ['billing_accounts', 'line_items', 'subscriptions'];

const RulesChainPanel: React.FC<RulesChainPanelProps> = ({ rules, modelName, onClose }) => {
  // Group rules by table
  const byTable = TABLES_ORDER.reduce<Record<string, RuleEntry[]>>((acc, t) => {
    acc[t] = rules.filter(r => r.table === t);
    return acc;
  }, {});

  const hasRules = rules.length > 0;

  return (
    <div style={{
      flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
      backgroundColor: c['background-base'],
      border: `1px solid ${c['border-divider']}`,
      borderRadius: 10,
    }}>

      {/* Identity row */}
      <div style={{
        height: 48, borderBottom: `1px solid ${c['border-divider']}`,
        display: 'flex', alignItems: 'center',
        paddingLeft: sp.D, paddingRight: sp.D, gap: sp.C, flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2" y="1" width="10" height="12" rx="1.5" stroke={c['content-secondary']} strokeWidth="1.4" fill="none"/>
          <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" stroke={c['content-secondary']} strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="4.5" y1="7" x2="9.5" y2="7" stroke={c['content-secondary']} strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="4.5" y1="9.5" x2="7.5" y2="9.5" stroke={c['content-secondary']} strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: fs.sm, fontWeight: fw.semibold, color: c['content-primary'] }}>Rules chain</span>
          <span style={{ fontSize: fs.xs, color: c['content-secondary'], marginLeft: sp.B }}>{modelName}</span>
        </div>
        {hasRules && (
          <span style={{
            fontSize: 11, fontWeight: fw.medium,
            color: c['content-brand'],
            backgroundColor: c['background-information'],
            border: `1px solid ${c['border-brand']}`,
            borderRadius: 4, padding: '1px 7px', flexShrink: 0,
          }}>
            {rules.length} {rules.length === 1 ? 'rule' : 'rules'}
          </span>
        )}
        <button
          onClick={onClose}
          title="Close"
          style={{
            width: 28, height: 28, border: 'none', borderRadius: 6,
            backgroundColor: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: c['content-secondary'], marginLeft: sp.A,
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = c['background-subtle'])}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: sp.D }}>
        {!hasRules ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: sp.C, color: c['content-secondary'],
          }}>
            <svg width="32" height="32" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              <line x1="4.5" y1="9.5" x2="7.5" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: fs.sm }}>No rules applied yet.</span>
            <span style={{ fontSize: fs.xs, textAlign: 'center', maxWidth: 220 }}>
              Rules are added here as the agent applies fixes to the model.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: sp.F }}>

            {/* Description */}
            <div style={{
              padding: sp.C, backgroundColor: c['background-sunken'],
              borderRadius: 8, border: `1px solid ${c['border-divider']}`,
            }}>
              <div style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.6 }}>
                This rules chain re-runs on every cache refresh, keeping <strong style={{ color: c['content-primary'], fontWeight: fw.medium }}>{modelName}</strong> clean as new data arrives.
              </div>
            </div>

            {/* Rules grouped by table */}
            {TABLES_ORDER.map(tableName => {
              const tableRules = byTable[tableName];
              if (!tableRules || tableRules.length === 0) return null;
              return (
                <div key={tableName}>
                  <div style={{
                    fontSize: 11, fontWeight: fw.medium, color: c['content-secondary'],
                    fontFamily: 'monospace', marginBottom: sp.B,
                    display: 'flex', alignItems: 'center', gap: sp.B,
                  }}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                      <line x1="1" y1="4.5" x2="13" y2="4.5" stroke="currentColor" strokeWidth="1.1"/>
                      <line x1="5" y1="4.5" x2="5" y2="13" stroke="currentColor" strokeWidth="1.1"/>
                    </svg>
                    {tableName}
                    <span style={{ fontSize: 10, color: c['content-tertiary'], fontFamily: ff.primary }}>
                      {tableRules.length} {tableRules.length === 1 ? 'rule' : 'rules'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                    {tableRules.map((rule, i) => {
                      const colors = ISSUE_COLORS[rule.issueType] ?? { bg: c['background-sunken'], text: c['content-secondary'] };
                      return (
                        <div
                          key={rule.id}
                          style={{
                            padding: sp.C,
                            border: `1px solid ${c['border-divider']}`,
                            borderRadius: 8,
                            backgroundColor: c['background-base'],
                            display: 'flex', flexDirection: 'column', gap: 5,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                            <span style={{
                              fontSize: 10, fontFamily: 'monospace', fontWeight: fw.medium,
                              color: c['content-primary'],
                            }}>
                              {rule.column}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: fw.medium,
                              color: colors.text, backgroundColor: colors.bg,
                              borderRadius: 3, padding: '1px 5px', flexShrink: 0,
                            }}>
                              {rule.issueType}
                            </span>
                          </div>
                          <div style={{
                            fontSize: 11, fontFamily: 'monospace',
                            color: c['content-secondary'],
                            backgroundColor: c['background-sunken'],
                            padding: `3px ${sp.B}px`, borderRadius: 4,
                          }}>
                            {rule.transformation}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RulesChainPanel;
