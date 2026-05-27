import React from 'react';
import { spotterLayout } from '../tokens';
import styles from './SpotterShell.module.css';

export interface SpotterShellProps {
  header: React.ReactNode;
  leftSide: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-screen Spotter page layout: header on top, left side rail/panel,
 * canvas on the right. Mode (rail vs panel) is owned by the consumer —
 * pass the rendered SpotterRail or SpotterPanel into `leftSide`.
 *
 * Injects `--spotter-chat-max-width` and `--spotter-text-max-width` CSS
 * variables from `spotterLayout` tokens so child module CSS can consume
 * them without hardcoding magic px values.
 */
export const SpotterShell: React.FC<SpotterShellProps> = ({
  header,
  leftSide,
  children,
  className,
}) => {
  const classes = [styles.shell, className].filter(Boolean).join(' ');
  const cssVars: React.CSSProperties = {
    ['--spotter-chat-max-width' as string]: `${spotterLayout.chatMaxWidth}px`,
    ['--spotter-text-max-width' as string]: `${spotterLayout.textMaxWidth}px`,
  };
  return (
    <div className={classes} style={cssVars}>
      <div className={styles.header}>{header}</div>
      <div className={styles.body}>
        {leftSide}
        <main className={styles.canvas}>{children}</main>
      </div>
    </div>
  );
};

SpotterShell.displayName = 'SpotterShell';

export default SpotterShell;
