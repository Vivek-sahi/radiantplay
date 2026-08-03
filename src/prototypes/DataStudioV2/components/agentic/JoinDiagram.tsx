import React from 'react';
import styles from './JoinDiagram.module.css';
import { JoinTypeIcon, JOIN_TYPE_LABEL, type JoinTypeKey } from '../icons/JoinTypeIcon';

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
  /**
   * Which rows survive. Distinct from cardinality, which is how many match — and the
   * one the agent's reasoning keeps referring to ("left outer keeps the other four,
   * with sentiment null rather than zero"). Optional so the diagram still renders for
   * callers that don't know it.
   */
  joinType?: JoinTypeKey;
  /** Flagged when the cardinality can inflate aggregates on the many side. */
  warnFanOut?: boolean;
}

export const JoinDiagram: React.FC<JoinDiagramProps> = ({
  leftTable, leftCol, rightTable, rightCol, cardinality, joinType, warnFanOut,
}) => (
  <div className={styles.diagram}>
    <div className={styles.side}>
      <span className={styles.table}>{leftTable}</span>
      <span className={styles.col}>{leftCol}</span>
    </div>
    {/* Everything true of the relationship, stacked in one column: how many rows match,
        the direction, and which rows survive. It was a separate labelled column on the
        right, which cost ~90px and pushed every table name into "accou…" — the row had
        five things competing when it only has one thing to say. The glyph depicts the
        join rather than colour-coding it, so it carries the meaning on its own; the words
        are on hover. */}
    <div className={styles.connector} title={warnFanOut ? 'Many side — aggregates can inflate' : undefined}>
      {/* Plain, always. This used to go amber on a fan-out risk, which put a second
          quality signal on the row and read as "low confidence" — confidence is the
          score's job, and 1:N is a fact about the data, not a judgement about it. The
          fan-out caution survives on the connector's hover and in the agent's reasoning
          behind the score, which is where it says something actionable. */}
      <span className={styles.cardinality}>
        {CARDINALITY_LABEL[cardinality]}
      </span>
      <svg width="46" height="8" viewBox="0 0 46 8" fill="none" aria-hidden="true">
        <path d="M1 4h38" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M38 1.5L42.5 4L38 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {joinType && (
        <span className={styles.joinTypeMark} title={`${JOIN_TYPE_LABEL[joinType]} join`}>
          <JoinTypeIcon type={joinType} size={15} />
        </span>
      )}
    </div>
    <div className={`${styles.side} ${styles.right}`}>
      <span className={styles.table}>{rightTable}</span>
      <span className={styles.col}>{rightCol}</span>
    </div>
  </div>
);
