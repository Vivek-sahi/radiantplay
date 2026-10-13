import React, { forwardRef } from 'react';
import styles from './DotLoader.module.css';

export interface DotLoaderProps {
  /** Text under the dots (Figma "Copy=True"), e.g. a patience message */
  message?: React.ReactNode;
  /**
   * Accessible name announced while loading
   * @default 'Loading'
   */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DotLoader
 *
 * The Figma global loader (17953:18391): three dots, 12, 8 and 4px, in the
 * tertiary content color. The large dot travels left to right. An optional
 * message sits 32px below in 14/20 secondary text, centered, up to 256px wide.
 * The frame keeps the Figma 48px top and bottom padding.
 *
 * With prefers-reduced-motion the dots hold the Figma pose and do not move.
 * LoadingIndicator stays the ring spinner for inline and button loading.
 *
 * @example
 * ```tsx
 * <DotLoader message="We're crunching a lot of numbers. Please be patient. Your answer will be here shortly." />
 * ```
 */
export const DotLoader = forwardRef<HTMLDivElement, DotLoaderProps>(({
  message,
  label = 'Loading',
  className,
  style,
}, ref) => (
  <div
    ref={ref}
    className={[styles.root, message ? styles.withMessage : '', className].filter(Boolean).join(' ')}
    style={style}
    role="status"
    aria-live="polite"
    aria-label={message ? undefined : label}
  >
    <span className={styles.dots} aria-hidden="true">
      <span className={`${styles.dot} ${styles.dotFirst}`} />
      <span className={`${styles.dot} ${styles.dotSecond}`} />
      <span className={`${styles.dot} ${styles.dotThird}`} />
    </span>
    {message && <p className={styles.message}>{message}</p>}
  </div>
));

DotLoader.displayName = 'DotLoader';

export default DotLoader;
