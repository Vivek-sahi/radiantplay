import React from 'react';
import styles from './JoinDiagram.module.css';

/**
 * table.column ──1:N──> table.column
 *
 * Shape follows the upstream JoinDiagram (surajboro-ts/spotter-readiness-vision),
 * but the connector is drawn rather than a static PNG. Upstream rendered the same
 * `join-type.png` whatever the cardinality; cardinality is precisely what causes
 * fan-out, so it's worth showing honestly.
 */

export type Cardinality = 'many_to_one' | 'one_to_many' | 'one_to_one';

const CARDINALITY_LABEL: Record<Cardinality, string> = {
  one_to_one: '1:1',
  one_to_many: '1:N',
  many_to_one: 'N:1',
};

export interface JoinDiagramProps {
  leftTable: string;
  leftCol: string;
  rightTable: string;
  rightCol: string;
  cardinality: Cardinality;
  /** Flagged when the cardinality can inflate aggregates on the many side. */
  warnFanOut?: boolean;
}

export const JoinDiagram: React.FC<JoinDiagramProps> = ({
  leftTable, leftCol, rightTable, rightCol, cardinality, warnFanOut,
}) => (
  <div className={styles.diagram}>
    <div className={styles.side}>
      <span className={styles.table}>{leftTable}</span>
      <span className={styles.col}>{leftCol}</span>
    </div>
    <div className={styles.connector} title={warnFanOut ? 'Many side — aggregates can inflate' : undefined}>
      <span className={`${styles.cardinality} ${warnFanOut ? styles.warn : ''}`}>
        {CARDINALITY_LABEL[cardinality]}
      </span>
      <svg width="46" height="8" viewBox="0 0 46 8" fill="none" aria-hidden="true">
        <path d="M1 4h38" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M38 1.5L42.5 4L38 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div className={`${styles.side} ${styles.right}`}>
      <span className={styles.table}>{rightTable}</span>
      <span className={styles.col}>{rightCol}</span>
    </div>
  </div>
);
