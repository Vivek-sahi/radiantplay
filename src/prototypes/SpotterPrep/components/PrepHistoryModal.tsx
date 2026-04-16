import React, { useState } from 'react';
import { c, sp, fs, fw } from '../styles';
import { PREP_HISTORY, ISSUE_META } from '../data/mockData';

interface PrepHistoryModalProps {
  onClose: () => void;
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' at '
    + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

const th: React.CSSProperties = {
  padding: `${sp.B}px ${sp.D}px`,
  textAlign: 'left', fontSize: fs.xs, fontWeight: fw.medium,
  color: c['content-secondary'],
  borderBottom: `1px solid ${c['border-divider']}`,
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: `${sp.B}px ${sp.D}px`,
  borderBottom: `1px solid ${c['border-divider']}`,
  verticalAlign: 'middle',
};


const PrepHistoryModal: React.FC<PrepHistoryModalProps> = ({ onClose }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(29,35,47,0.5)',
      zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 640, maxHeight: '80vh',
        backgroundColor: c['background-base'],
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: `${sp.D}px ${sp.F}px`,
          borderBottom: `1px solid ${c['border-divider']}`,
          display: 'flex', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'] }}>Prep history</div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>fnops-final · {PREP_HISTORY.length} runs</div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: c['content-secondary'], fontSize: 20, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Run list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {PREP_HISTORY.map(run => {
            const isExpanded = expanded.has(run.id);
            return (
              <div key={run.id} style={{ borderBottom: `1px solid ${c['border-divider']}` }}>

                {/* Collapsed row — always visible */}
                <button
                  onClick={() => toggle(run.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: `${sp.D}px ${sp.F}px`,
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: sp.C,
                    backgroundColor: isExpanded ? c['background-subtle'] : c['background-base'],
                  }}
                >
                  {/* Chevron */}
                  <span style={{
                    fontSize: 10, color: c['content-tertiary'], flexShrink: 0,
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.15s ease',
                    display: 'inline-block',
                  }}>▶</span>

                  {/* Timestamp + trigger */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>
                      {fmtDate(run.runAt)}
                    </div>
                    <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 2 }}>
                      {run.trigger === 'cache_refresh' ? 'Cache refresh' : 'Manual run'}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: sp.D, alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Jobs run</div>
                      <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>{run.operationsRun}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Successful</div>
                      <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-success'] }}>{run.operationsSucceeded}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: fs.xs, color: c['content-secondary'] }}>Failed</div>
                      <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: run.operationsFailed > 0 ? c['content-failure'] : c['content-tertiary'] }}>
                        {run.operationsFailed}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded — operation table */}
                {isExpanded && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fs.sm, borderTop: `1px solid ${c['border-divider']}` }}>
                    <thead>
                      <tr style={{ backgroundColor: c['background-subtle'] }}>
                        <th style={th}></th>
                        <th style={th}>Column</th>
                        <th style={th}>Issue type</th>
                        <th style={th}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {run.operations.map((op, i) => {
                        const meta = ISSUE_META[op.issueType];
                        return (
                          <tr key={i} style={{ backgroundColor: op.status === 'failed' ? '#fff8f8' : i % 2 === 0 ? c['background-base'] : c['background-sunken'] }}>
                            <td style={{ ...td, width: 36, textAlign: 'center' as const }}>
                              <span style={{ fontSize: 12, color: op.status === 'success' ? c['content-success'] : c['content-failure'] }}>
                                {op.status === 'success' ? '✓' : '✕'}
                              </span>
                            </td>
                            <td style={td}>
                              <div style={{ fontWeight: fw.medium, color: c['content-primary'], fontSize: fs.xs }}>{op.column}</div>
                              <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: 1 }}>{op.table}</div>
                            </td>
                            <td style={td}>
                              <span style={{
                                fontSize: 11, fontWeight: fw.medium,
                                color: meta.color, backgroundColor: meta.bg,
                                borderRadius: 3, padding: '1px 5px',
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                              }}>
                                {meta.icon} {meta.label}
                              </span>
                            </td>
                            <td style={{ ...td, fontSize: fs.xs }}>
                              {op.status === 'success'
                                ? <span style={{ color: c['content-success'] }}>✓ {op.rowsFixed.toLocaleString()} rows fixed</span>
                                : <span style={{ color: c['content-failure'] }}>{op.error ?? 'Failed'}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PrepHistoryModal;
