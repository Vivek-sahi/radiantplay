import React from 'react';
import { Link, Typography } from '@/components';
import styles from '../v5.module.css';

/**
 * A metric tile, thin and sleek (Vivek, 27 Oct): replaces v1's StatTile in v5 (StatTile stays
 * untouched for v1). An instrument readout: small label, the figure in tabular digits with its
 * unit in grey, an optional note, and a link to the job behind the number.
 */
export const Metric: React.FC<{
  label: string;
  value: string;
  note?: string;
  tone?: 'failure';
  link?: { label: string; onClick: () => void };
}> = ({ label, value, note, tone, link }) => {
  // "394 GB" reads as a figure and a unit; the unit is set small.
  const m = value.match(/^([\d.,]+)\s*([A-Za-z%]+)$/);
  return (
    <div className={styles.metric}>
      <Typography variant="footnote" color="gray-light" noMargin>
        {label}
      </Typography>
      <span className={[styles.metricValue, tone === 'failure' && styles.metricBad].filter(Boolean).join(' ')}>
        {m ? m[1] : value}
        {m && <span className={styles.metricUnit}>{m[2]}</span>}
      </span>
      {(note || link) && (
        <span className={styles.metricFoot}>
          {note && (
            <Typography variant="footnote" color="gray-light" noMargin>
              {note}
            </Typography>
          )}
          {link && (
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                link.onClick();
              }}
            >
              {link.label}
            </Link>
          )}
        </span>
      )}
    </div>
  );
};
