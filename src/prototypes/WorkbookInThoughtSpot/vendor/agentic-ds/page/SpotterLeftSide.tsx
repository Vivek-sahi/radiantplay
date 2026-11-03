import React from 'react';
import { Tooltip } from '@components/Tooltip';
import { PanelToggleIcon } from '../icons';
import styles from './SpotterLeftSide.module.css';

export type SpotterLeftMode = 'rail' | 'panel';

export interface SpotterLeftSideProps {
  mode: SpotterLeftMode;
  onToggle: () => void;
  /** Rendered when mode === 'rail'. */
  rail: React.ReactNode;
  /** Rendered when mode === 'panel'. */
  panel: React.ReactNode;
}

/**
 * The left side of the Spotter shell. Renders either the slim rail or the
 * expanded panel based on `mode`. Owns the wrapper that smoothly animates
 * width between rail (64) and panel (260). Inner rail/panel components fill
 * the wrapper. The toggle button is the consumer's responsibility — it can
 * live inside the rail or panel content. We expose `SpotterLeftToggle` as
 * a default trigger that calls `onToggle`.
 */
export const SpotterLeftSide: React.FC<SpotterLeftSideProps> = ({ mode, rail, panel }) => {
  const width = mode === 'rail' ? 64 : 260;
  return (
    <div className={styles.leftSide} style={{ width: `${width}px` }} data-mode={mode}>
      <div className={styles.inner}>{mode === 'rail' ? rail : panel}</div>
    </div>
  );
};

SpotterLeftSide.displayName = 'SpotterLeftSide';

export interface SpotterLeftToggleProps {
  mode: SpotterLeftMode;
  onClick: () => void;
}

/**
 * Default toggle button — sidebar/layout glyph. Tooltip flips based on mode.
 */
export const SpotterLeftToggle: React.FC<SpotterLeftToggleProps> = ({ mode, onClick }) => {
  const label = mode === 'panel' ? 'Collapse panel' : 'Expand panel';
  return (
    <Tooltip content={label} placement="right">
      <button
        type="button"
        className={styles.toggle}
        onClick={onClick}
        aria-label={label}
        aria-pressed={mode === 'panel'}
      >
        <PanelToggleIcon size="m" />
      </button>
    </Tooltip>
  );
};

SpotterLeftToggle.displayName = 'SpotterLeftToggle';

export default SpotterLeftSide;
