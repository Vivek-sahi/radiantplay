import React from 'react';
import { ChartSearchIcon, OrbitsIcon } from '@spotter/icons';
import styles from './PromptSuggestionsPanel.module.css';

const SUGGESTIONS: Record<'quick-search' | 'deep-analysis', string[]> = {
  'quick-search': [
    'What was total revenue last month?',
    'Show me top 10 products by sales this quarter.',
    'How do sales this year compare to last year?',
    'Which region had the highest growth last quarter?',
  ],
  'deep-analysis': [
    'Generate report on sales trends last year',
    'Product categories that drove maximum growth',
    'Find out anomalies in my sales and suggest recommendations',
    'Compare my sales to market trends and identify trends',
  ],
};

export interface PromptSuggestionsPanelProps {
  mode: 'quick-search' | 'deep-analysis';
  onSelect: (text: string) => void;
  onClose: () => void;
}

export const PromptSuggestionsPanel: React.FC<PromptSuggestionsPanelProps> = ({
  mode,
  onSelect,
  onClose,
}) => {
  const isQuick = mode === 'quick-search';
  const label = isQuick ? 'Quick search' : 'Deep analysis';
  const Icon = isQuick ? ChartSearchIcon : OrbitsIcon;
  const suggestions = SUGGESTIONS[mode];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>
          <span className={styles.headerIcon} aria-hidden="true">
            <Icon size="s" />
          </span>
          {label}
        </span>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close suggestions"
        >
          ✕
        </button>
      </div>
      <ul className={styles.list} role="listbox" aria-label={`${label} suggestions`}>
        {suggestions.map((text) => (
          <li key={text} role="option" aria-selected={false}>
            <button
              type="button"
              className={styles.suggestion}
              onClick={() => onSelect(text)}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

PromptSuggestionsPanel.displayName = 'PromptSuggestionsPanel';

export default PromptSuggestionsPanel;
