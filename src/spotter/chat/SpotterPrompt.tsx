import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { Icon } from '@components/icons';
import { ChartSearchIcon, OrbitsIcon } from '../icons';
import styles from './SpotterPrompt.module.css';

export type SpotterPromptMode = 'ask' | 'analyze';

export interface SpotterPromptProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  dataModelLabel?: string;
  onDataModelClick?: () => void;
  /**
   * When false, the data model picker and the + source button are hidden.
   * Use on named-analyst landing pages where no data model concept applies.
   * Defaults to true.
   */
  showDataModel?: boolean;
  mode?: SpotterPromptMode;
  onModeChange?: (mode: SpotterPromptMode) => void;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_PLACEHOLDER = "Ask me a question. Use '@' to select columns and values";
const DEFAULT_DATA_MODEL_LABEL = 'All data models';

export const SpotterPrompt = forwardRef<HTMLDivElement, SpotterPromptProps>(
  (
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      onSubmit,
      placeholder = DEFAULT_PLACEHOLDER,
      dataModelLabel = DEFAULT_DATA_MODEL_LABEL,
      onDataModelClick,
      showDataModel = true,
      mode = 'ask',
      onModeChange,
      disabled = false,
      className,
    },
    ref,
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = isControlled ? controlledValue : internalValue;

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      const node = textareaRef.current;
      if (!node) return;
      node.style.height = 'auto';
      node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
      const next = e.target.value;
      if (!isControlled) setInternalValue(next);
      onChange?.(next);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim()) {
          onSubmit?.(value);
          if (!isControlled) setInternalValue('');
        }
      }
    };

    const handleSubmit = (): void => {
      if (!value.trim()) return;
      onSubmit?.(value);
      if (!isControlled) setInternalValue('');
    };

    const classes = [styles.prompt, className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classes}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-label="Ask Spotter a question"
        />
        <div className={styles.actions}>
          <div className={styles.leftActions}>
            <div className={styles.modeToggle} role="group" aria-label="Prompt mode">
              <button
                type="button"
                className={styles.modeBtn}
                data-active={mode === 'ask'}
                onClick={() => onModeChange?.('ask')}
                aria-label="Ask"
                aria-pressed={mode === 'ask'}
              >
                <ChartSearchIcon size="m" />
              </button>
              <button
                type="button"
                className={styles.modeBtn}
                data-active={mode === 'analyze'}
                onClick={() => onModeChange?.('analyze')}
                aria-label="Analyze"
                aria-pressed={mode === 'analyze'}
              >
                <OrbitsIcon size="l" />
              </button>
            </div>
            {showDataModel && (
              <>
                <span className={styles.divider} aria-hidden="true" />
                <button
                  type="button"
                  className={styles.modelPicker}
                  onClick={onDataModelClick}
                >
                  <span>{dataModelLabel}</span>
                  <Icon name="chevron-down" size="s" />
                </button>
                <button type="button" className={styles.iconBtn} aria-label="Add data sources">
                  <Icon name="plus" size="s" />
                </button>
              </>
            )}
          </div>
          <div className={styles.rightActions}>
            <button type="button" className={styles.iconBtn} aria-label="Prompt settings">
              <Icon name="controls" size="s" />
            </button>
            <button
              type="button"
              className={styles.submit}
              onClick={handleSubmit}
              disabled={disabled || !value.trim()}
              aria-label="Submit"
            >
              <Icon name="arrow-up" size="s" />
            </button>
          </div>
        </div>
      </div>
    );
  },
);

SpotterPrompt.displayName = 'SpotterPrompt';

export default SpotterPrompt;
