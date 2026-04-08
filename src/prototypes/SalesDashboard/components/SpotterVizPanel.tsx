import React, { useState } from 'react';
import { Icon } from '@components/icons';
import { colors, typography, shadows, layout } from '../styles';
import { spotterVizMessages } from '../data/mockData';

interface SpotterVizPanelProps {
  onClose: () => void;
}

export const SpotterVizPanel: React.FC<SpotterVizPanelProps> = ({ onClose }) => {
  const [input, setInput] = useState('');

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M7.111 1.778L8.889 5.333L12.444 7.111L8.889 8.889L7.111 12.444L5.333 8.889L1.778 7.111L5.333 5.333L7.111 1.778Z" stroke={colors.brand} strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
          <span style={s.headerTitle}>SpotterViz</span>
        </div>
        <button style={s.closeBtn} onClick={onClose}>
          <Icon name="cross" size="xs" color={colors.textSecondary} />
        </button>
      </div>

      <div style={s.body}>
        {spotterVizMessages.map((msg, i) => (
          <div key={i} style={msg.role === 'user' ? s.userMsg : s.aiMsg}>
            {msg.role === 'user' ? (
              <div style={s.userBubble}>
                <span style={s.userText}>{msg.text}</span>
              </div>
            ) : (
              <div style={s.aiBubble}>
                <span style={s.aiText}>{msg.text}</span>
                {'steps' in msg && msg.steps && (
                  <div style={s.steps}>
                    {msg.steps.map((step, j) => (
                      <div key={j} style={s.step}>
                        <Icon name="checkmark-circle" size="xs" color={colors.success} />
                        <span style={s.stepText}>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={s.disclaimer}>
        SpotterViz responses should be reviewed. Learn more
      </div>

      <div style={s.promptBar}>
        <input
          style={s.input}
          placeholder="Ask SpotterViz..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button style={s.sendBtn}>
          <Icon name="chevron-right" size="xs" color="white" />
        </button>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  panel: {
    width: layout.spotterPanelWidth,
    height: '100%',
    background: colors.panelBg,
    borderLeft: `1px solid ${colors.panelBorder}`,
    boxShadow: shadows.panel,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    padding: '0 16px',
    borderBottom: `1px solid ${colors.borderDivider}`,
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 4,
    padding: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  userMsg: { display: 'flex', justifyContent: 'flex-end' },
  aiMsg: { display: 'flex', justifyContent: 'flex-start' },
  userBubble: {
    background: colors.spotterUserBubble,
    borderRadius: '12px 12px 4px 12px',
    padding: '8px 12px',
    maxWidth: '85%',
  },
  userText: {
    fontSize: 13,
    color: 'white',
    fontFamily: typography.fontFamily,
    lineHeight: '18px',
  },
  aiBubble: {
    background: colors.spotterAiBubble,
    borderRadius: '12px 12px 12px 4px',
    padding: '10px 12px',
    maxWidth: '90%',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  aiText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    lineHeight: '18px',
  },
  steps: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '4px 0',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  stepText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
  },
  disclaimer: {
    padding: '8px 16px',
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily,
    textAlign: 'center',
    flexShrink: 0,
  },
  promptBar: {
    padding: 16,
    borderTop: `1px solid ${colors.borderDivider}`,
    display: 'flex',
    gap: 8,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    height: 40,
    padding: '0 12px',
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    fontSize: 13,
    fontFamily: typography.fontFamily,
    color: colors.textPrimary,
    outline: 'none',
    background: colors.pageBg,
  },
  sendBtn: {
    width: 40,
    height: 40,
    background: colors.brand,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
