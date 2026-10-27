import React from 'react';
import { Typography } from '@/components';
import styles from '../v5.module.css';

export interface Figure {
  value: string;
  label: string;
  /** Red value: the figure is a failure count above zero. */
  tone?: 'bad';
}

/**
 * The page's figures in one quiet line above the content (principle 1: size follows urgency).
 * Figures only, no status sentence (Vivek, 15 Oct). Values at text size, labels below them.
 */
export const Strip: React.FC<{ figures: Figure[] }> = ({ figures }) => (
  <div className={styles.strip}>
    <div className={styles.figs}>
      {figures.map((f) => (
        <div key={f.label} className={styles.fig}>
          <Typography variant="content-label" color={f.tone === 'bad' ? 'failure' : 'base'} noMargin>
            {f.value}
          </Typography>
          <Typography variant="footnote" color="gray-light" noMargin>
            {f.label}
          </Typography>
        </div>
      ))}
    </div>
  </div>
);
