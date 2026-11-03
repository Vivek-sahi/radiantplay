import React, { useState } from 'react';
import { Icon } from '@components/icons';
import { sysVar } from '@tokens/colors';
import mascot from './spotterviz-mascot.png';
import styles from './SpotterVizPanel.module.css';

interface SpotterVizPanelProps {
  onClose: () => void;
}

const SUGGESTIONS = [
  'For the CEO, to track monthly sales, trends, regional splits, and top items.',
  'For the Product Manager, to review new launch performance, regional response, and top-performing SKUs.',
  'For the Ops Manager, to monitor daily store efficiency: sales vs targets, staffing levels, and stock availability.',
];

const SuggestionChip: React.FC<{ text: string; onClick?: () => void }> = ({ text, onClick }) => (
  <button type="button" onClick={onClick} className={styles.chip}>
    {text}
  </button>
);

export const SpotterVizPanel: React.FC<SpotterVizPanelProps> = ({ onClose }) => {
  const [input, setInput] = useState('');

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>SpotterViz</span>
        <button type="button" onClick={onClose} aria-label="Collapse panel" className={styles.collapseBtn}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 3.5L8 8L3.5 12.5M8.5 3.5L13 8L8.5 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Body — welcome state */}
      <div className={styles.body}>
        <div className={styles.hero}>
          <img src={mascot} alt="" width={48} height={48} className={styles.mascot} />
          <div className={styles.greeting}>
            <span>Hi, there! I&apos;m </span>
            <span className={styles.greetingBrand}>SpotterViz</span>
          </div>
          <p className={styles.tagline}>
            Create your Liveboard in minutes by adding user persona and goal.
          </p>
        </div>

        <div className={styles.suggestionStack}>
          {SUGGESTIONS.map((text, i) => (
            <SuggestionChip key={i} text={text} onClick={() => setInput(text)} />
          ))}
        </div>
      </div>

      {/* Prompt bar */}
      <div className={styles.promptArea}>
        <div className={styles.promptBar}>
          <input
            className={styles.input}
            placeholder="Build this Liveboard"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <div className={styles.promptActions}>
            <button type="button" aria-label="Settings" className={styles.iconBtn}>
              <Icon name="cog" size="s" color={sysVar('content-secondary')} />
            </button>
            <button type="button" aria-label="Send" className={styles.sendBtn}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M8 13V3M8 3L3 8M8 3L13 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <p className={styles.disclaimer}>
          SpotterViz responses should be reviewed.{' '}
          <a href="#" className={styles.disclaimerLink}>Learn more</a>
        </p>
      </div>
    </div>
  );
};
