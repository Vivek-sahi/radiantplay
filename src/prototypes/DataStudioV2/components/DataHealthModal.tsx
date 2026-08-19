import React, { useState } from 'react';
import { c, sp, fs, fw, ts, ff } from '../styles';
import { Button } from '../../../components/Button';
import { ProjectState } from '../index';
import { ordersData } from '../data/mockData';

interface DataHealthModalProps {
  buildStep: ProjectState['buildStep'];
  onClose: () => void;
}

// ── Issues list (derived from mock quality issues) ────────────────────────────

interface Issue {
  id: string;
  title: string;
  table: string;
  percentage: number;
  type: 'null' | 'duplicate' | 'anomaly' | 'no_description' | 'date_format';
  highlightColumn?: string;
}

const ALL_ISSUES: Issue[] = [
  { id: 'i1',  title: 'Nulls in orders.campaign_id',     table: 'Orders',    percentage: 18, type: 'null',           highlightColumn: 'campaign_id'      },
  { id: 'i2',  title: 'Duplicates in orders.order_id',   table: 'Orders',    percentage:  5, type: 'duplicate',      highlightColumn: 'order_id'         },
  { id: 'i3',  title: 'Anomalies in orders.amount',      table: 'Orders',    percentage:  3, type: 'anomaly',        highlightColumn: 'amount'           },
  { id: 'i4',  title: 'Date format mismatch order_date', table: 'Orders',    percentage:100, type: 'date_format',    highlightColumn: 'order_date'       },
  { id: 'i5',  title: 'Nulls in campaigns.end_date',     table: 'Campaigns', percentage: 13, type: 'null',           highlightColumn: 'end_date'         },
  { id: 'i6',  title: 'Duplicates campaign_id',          table: 'Campaigns', percentage:  4, type: 'duplicate',      highlightColumn: 'campaign_id'      },
  { id: 'i7',  title: 'Nulls in users.segment',          table: 'Users',     percentage: 15, type: 'null',           highlightColumn: 'segment'          },
  { id: 'i8',  title: 'Anomalies in users.age',          table: 'Users',     percentage:  4, type: 'anomaly',        highlightColumn: 'age'              },
  { id: 'i9',  title: 'Missing descriptions — Orders',   table: 'Orders',    percentage: 70, type: 'no_description'  },
  { id: 'i10', title: 'Missing descriptions — Campaigns',table: 'Campaigns', percentage: 78, type: 'no_description'  },
  { id: 'i11', title: 'Missing descriptions — Users',    table: 'Users',     percentage: 75, type: 'no_description'  },
];

const TYPE_COLOR: Record<Issue['type'], string> = {
  null:           '#E53935',
  duplicate:      '#FB8C00',
  anomaly:        '#FB8C00',
  no_description: '#1565C0',
  date_format:    '#6A1B9A',
};

// Sample preview columns to show
const PREVIEW_COLS = ['order_id', 'campaign_id', 'amount', 'order_date', 'region'];

const DataHealthModal: React.FC<DataHealthModalProps> = ({ buildStep, onClose }) => {
  const [search, setSearch] = useState('');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [selectedIssue, setSelectedIssue] = useState<Issue>(ALL_ISSUES[0]);

  const isHealthy = buildStep === 'healthy';

  const visibleIssues = ALL_ISSUES.filter(i =>
    !dismissed.has(i.id) &&
    (i.title.toLowerCase().includes(search.toLowerCase()) || i.table.toLowerCase().includes(search.toLowerCase()))
  );

  const previewRows = ordersData.slice(0, 24) as unknown as Record<string, unknown>[];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: c['background-base'], borderRadius: 12, width: '92vw', maxWidth: 1200, height: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ ...ts.contentLabelSubhead, color: c['content-primary'], fontSize: fs.md }}>Data Health</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c['content-secondary'], lineHeight: 1, padding: 0 }}>×</button>
        </div>

        {isHealthy ? (
          /* ── Healthy empty state ── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: sp.C }}>
            <div style={{ fontSize: 48 }}>✅</div>
            <p style={{ ...ts.contentLabelSubhead, color: c['content-primary'], margin: 0 }}>All issues resolved</p>
            <p style={{ fontSize: fs.sm, color: c['content-secondary'], margin: 0 }}>Data health is Good (82/100). Your model is AI-ready.</p>
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div style={{ padding: `${sp.C}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', gap: sp.B, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: sp.B, border: `1px solid ${c['border-default']}`, borderRadius: 20, padding: `${sp.A}px ${sp.C}px`, width: 280 }}>
                <span style={{ color: c['content-secondary'], fontSize: fs.sm }}>🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by issue type, column, table..."
                  style={{ border: 'none', outline: 'none', fontSize: fs.sm, background: 'transparent', color: c['content-primary'], flex: 1 }}
                />
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: sp.A, border: `1px solid ${c['border-default']}`, borderRadius: 20, padding: `${sp.A}px ${sp.C}px`, background: c['background-subtle'], cursor: 'pointer', fontSize: fs.sm, color: c['content-primary'], fontWeight: fw.medium }}>
                Filter issues by table <span style={{ fontSize: fs.xs }}>▾</span>
              </button>
            </div>

            {/* Body: issues list + data grid */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

              {/* Left: issues */}
              <div style={{ width: 260, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`, overflowY: 'auto' }}>
                {visibleIssues.length === 0 && (
                  <div style={{ padding: sp.D, fontSize: fs.sm, color: c['content-secondary'] }}>No issues found</div>
                )}
                {visibleIssues.map(issue => (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    style={{ padding: `${sp.C}px ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, cursor: 'pointer', backgroundColor: selectedIssue.id === issue.id ? c['background-information'] : 'transparent' }}
                    onMouseEnter={e => { if (selectedIssue.id !== issue.id) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                    onMouseLeave={e => { if (selectedIssue.id !== issue.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: sp.A }}>
                      <span style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-primary'], flex: 1, paddingRight: sp.B }}>{issue.title}</span>
                      <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: TYPE_COLOR[issue.type], flexShrink: 0 }}>{issue.percentage}%</span>
                    </div>
                    <p style={{ margin: `0 0 ${sp.B}px`, fontSize: fs.xs, color: c['content-brand'] }}>{issue.table}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.B }}>
                      <Button variant="secondary" size="small">Fix issue ▾</Button>
                      <button onClick={e => { e.stopPropagation(); setDismissed(d => new Set([...d, issue.id])); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: fs.xs, color: c['content-secondary'], padding: 0 }}>Ignore</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: data preview grid */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: fs.xs, minWidth: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: c['background-base'], zIndex: 1 }}>
                    <tr style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
                      <th style={{ padding: `${sp.B}px ${sp.C}px`, textAlign: 'right', width: 36, color: c['content-secondary'], fontWeight: fw.regular, borderRight: `1px solid ${c['border-divider']}` }}></th>
                      {PREVIEW_COLS.map(k => (
                        <th key={k} style={{ padding: `${sp.B}px ${sp.D}px`, textAlign: 'left', color: c['content-secondary'], fontWeight: fw.medium, whiteSpace: 'nowrap', minWidth: 140 }}>
                          {k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} <span style={{ opacity: 0.4 }}>▾</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${c['border-divider']}` }}>
                        <td style={{ padding: `${sp.B}px ${sp.C}px`, textAlign: 'right', color: c['content-secondary'], borderRight: `1px solid ${c['border-divider']}`, fontFamily: ff.mono }}>{i + 1}</td>
                        {PREVIEW_COLS.map(k => {
                          const val = (row as Record<string, unknown>)[k];
                          const isNull = val === null || val === undefined || val === '';
                          const isHighlighted = selectedIssue.highlightColumn === k && isNull;
                          const isValueAnomalous = k === 'amount' && typeof val === 'number' && (val < 0 || val > 20000);
                          const flagged = isHighlighted || (selectedIssue.highlightColumn === k && (isNull || isValueAnomalous));
                          return (
                            <td key={k} style={{ padding: `${sp.B}px ${sp.D}px`, color: flagged ? c['content-failure'] : c['content-primary'], backgroundColor: flagged ? 'rgba(229,57,53,0.08)' : 'transparent', whiteSpace: 'nowrap', fontFamily: ff.mono }}>
                              {isNull ? '-' : String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataHealthModal;
