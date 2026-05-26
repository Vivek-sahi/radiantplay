import React, { useState } from 'react';
import { Icon } from '@components/icons';
import mascot from './spotterviz-mascot.png';

interface SpotterVizPanelProps {
  onClose: () => void;
}

// Colors from Figma node 825:32553 (SpotterViz panel — dark variant)
const c = {
  bg:               '#1d232f',
  divider:          '#323946',
  textPrimary:      '#eaedf2',
  textWhite:        '#ffffff',
  textMuted:        '#a5acb9',
  textDim:          '#c0c6cf',
  brand:            '#71a1f4',
  chipBg:           'rgba(192, 198, 207, 0.12)',
  chipBorder:       '#777e8b',
  chipBorderSubtle: '#4a515e',
};

const FONT = "'Plain', -apple-system, BlinkMacSystemFont, sans-serif";

const SUGGESTIONS = [
  'For the CEO, to track monthly sales, trends, regional splits, and top items.',
  'For the Product Manager, to review new launch performance, regional response, and top-performing SKUs.',
  'For the Ops Manager, to monitor daily store efficiency: sales vs targets, staffing levels, and stock availability.',
];

const SuggestionChip: React.FC<{ text: string; onClick?: () => void }> = ({ text, onClick }) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: `1px solid ${hover ? c.chipBorder : c.chipBorderSubtle}`,
        borderRadius: 8,
        padding: '8px 12px',
        background: hover ? c.chipBg : 'transparent',
        color: c.textPrimary,
        fontSize: 14,
        fontWeight: 375,
        lineHeight: '20px',
        fontFamily: FONT,
        textAlign: 'left',
        cursor: 'pointer',
        width: '100%',
        transition: 'background 120ms ease, border-color 120ms ease',
      }}
    >
      {text}
    </button>
  );
};

export const SpotterVizPanel: React.FC<SpotterVizPanelProps> = ({ onClose }) => {
  const [input, setInput] = useState('');

  return (
    <div style={s.panel}>
      {/* Header */}
      <div style={s.header}>
        <span style={s.title}>SpotterViz</span>
        <button type="button" onClick={onClose} aria-label="Collapse panel" style={s.collapseBtn}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 3.5L8 8L3.5 12.5M8.5 3.5L13 8L8.5 12.5"
              stroke={c.textPrimary}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Body — welcome state */}
      <div style={s.body}>
        <div style={s.hero}>
          <img src={mascot} alt="" width={48} height={48} style={s.mascot} />
          <div style={s.greeting}>
            <span>Hi, there! I&apos;m </span>
            <span style={{ color: c.brand }}>SpotterViz</span>
          </div>
          <p style={s.tagline}>
            Create your Liveboard in minutes by adding user persona and goal.
          </p>
        </div>

        <div style={s.suggestionStack}>
          {SUGGESTIONS.map((text, i) => (
            <SuggestionChip key={i} text={text} onClick={() => setInput(text)} />
          ))}
        </div>
      </div>

      {/* Prompt bar */}
      <div style={s.promptArea}>
        <div style={s.promptBar}>
          <input
            style={s.input}
            placeholder="Build this Liveboard"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div style={s.promptActions}>
            <button type="button" aria-label="Settings" style={s.iconBtn}>
              <Icon name="cog" size="s" color={c.textMuted} />
            </button>
            <button type="button" aria-label="Send" style={s.sendBtn}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 13V3M8 3L3 8M8 3L13 8"
                  stroke={c.bg}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <p style={s.disclaimer}>
          SpotterViz responses should be reviewed.{' '}
          <a href="#" style={s.disclaimerLink}>Learn more</a>
        </p>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  panel: {
    // Overlay panel: slides over the right side of the page, anchored below the
    // EditToolbar (60px). Sits above the sticky LiveboardHeader (z:100).
    position: 'fixed',
    top: 60,
    right: 0,
    bottom: 0,
    width: 340,
    zIndex: 110,
    background: c.bg,
    borderLeft: `1px solid ${c.divider}`,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    fontFamily: FONT,
  },
  header: {
    height: 48,
    flexShrink: 0,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${c.divider}`,
    borderTop: `1px solid ${c.divider}`,
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    lineHeight: '24px',
    letterSpacing: '-0.072px',
    color: c.textPrimary,
  },
  collapseBtn: {
    width: 24,
    height: 24,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    borderRadius: 4,
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '88px 24px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 64,
  },
  hero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  mascot: {
    display: 'block',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: '28px',
    letterSpacing: '-0.08px',
    color: c.textWhite,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: 375,
    lineHeight: '24px',
    letterSpacing: '-0.064px',
    color: c.textWhite,
    textAlign: 'center',
    margin: 0,
  },
  suggestionStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  promptArea: {
    flexShrink: 0,
    padding: '0 16px 8px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  promptBar: {
    width: '100%',
    background: c.bg,
    border: `1px solid ${c.divider}`,
    boxShadow: '0px 0px 2px rgba(255,255,255,0.1), 0px 2px 2px rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: c.textPrimary,
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 375,
    lineHeight: '20px',
    padding: 0,
  },
  promptActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 18,
    background: c.brand,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  disclaimer: {
    fontSize: 12,
    fontWeight: 400,
    lineHeight: '18px',
    letterSpacing: '-0.072px',
    color: c.textDim,
    textAlign: 'center',
    margin: 0,
  },
  disclaimerLink: {
    color: c.brand,
    textDecoration: 'none',
  },
};
