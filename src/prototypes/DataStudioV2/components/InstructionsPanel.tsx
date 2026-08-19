import React from 'react';
import { c, sp, ff, fs, fw } from '../styles';

interface InstructionsPanelProps {
  modelName: string;
  onClose: () => void;
}

const InstructionsPanel: React.FC<InstructionsPanelProps> = ({ modelName, onClose }) => {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      border: `1px solid ${c['border-divider']}`, borderRadius: 10,
      backgroundColor: c['background-base'], fontFamily: ff.primary,
    }}>

      {/* Header */}
      <div style={{
        height: 48, flexShrink: 0, display: 'flex', alignItems: 'center',
        padding: `0 ${sp.D}px`, borderBottom: `1px solid ${c['border-divider']}`, gap: sp.B,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <rect x="2" y="1" width="10" height="12" rx="1.5" stroke={c['content-secondary']} strokeWidth="1.4" fill="none"/>
          <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" stroke={c['content-secondary']} strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="4.5" y1="7" x2="9.5" y2="7" stroke={c['content-secondary']} strokeWidth="1.1" strokeLinecap="round"/>
          <line x1="4.5" y1="9.5" x2="7.5" y2="9.5" stroke={c['content-secondary']} strokeWidth="1.1" strokeLinecap="round"/>
        </svg>
        <span style={{ flex: 1, fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'] }}>
          instructions.md
        </span>
        <button
          title="Download"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: sp.A, display: 'flex', alignItems: 'center',
            color: c['content-secondary'], borderRadius: 4,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
          onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2v7M4 6.5L7 9.5l3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 11h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: sp.A, display: 'flex', alignItems: 'center',
            color: c['content-secondary'], borderRadius: 4,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = c['content-primary'])}
          onMouseLeave={e => (e.currentTarget.style.color = c['content-secondary'])}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.F}px ${sp.H}px` }}>

        <h2 style={{
          margin: `0 0 ${sp.D}px`, fontSize: fs.lg, fontWeight: fw.semibold,
          color: c['content-primary'], lineHeight: 1.3,
        }}>
          {modelName}
        </h2>

        <p style={{
          margin: `0 0 ${sp.D}px`, fontSize: fs.sm, color: c['content-primary'],
          lineHeight: 1.65,
        }}>
          This model tracks campaign performance across paid and organic channels. It connects spend data with conversion outcomes to help teams understand which channels are driving ROI and where budget is being wasted.
        </p>

        <p style={{
          margin: `0 0 ${sp.F}px`, fontSize: fs.sm, color: c['content-primary'],
          lineHeight: 1.65,
        }}>
          Use it to answer questions about attribution, channel efficiency, and spend vs. results over time. The model is focused on ROI and attribution analysis — it does not include raw impression data or channel-level creative breakdowns.
        </p>

        <h3 style={{
          margin: `0 0 ${sp.C}px`, fontSize: fs.sm, fontWeight: fw.semibold,
          color: c['content-primary'],
        }}>
          Sample questions
        </h3>

        <ul style={{
          margin: 0, padding: `0 0 0 ${sp.D}px`,
          display: 'flex', flexDirection: 'column', gap: sp.B,
        }}>
          {[
            "What's the ROI by channel this quarter?",
            "Which campaigns had the highest spend vs. conversions?",
            "How does attribution vary across paid vs organic?",
            "What's the campaign performance trend over the last 30 days?",
            "Which channel has the lowest cost per acquisition?",
          ].map((q, i) => (
            <li key={i} style={{ fontSize: fs.sm, color: c['content-primary'], lineHeight: 1.55 }}>
              {q}
            </li>
          ))}
        </ul>

      </div>
    </div>
  );
};

export default InstructionsPanel;
