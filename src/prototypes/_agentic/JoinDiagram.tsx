import React from 'react';
import styles from './JoinDiagram.module.css';

interface JoinDiagramProps {
  leftTable: string;
  leftCol: string;
  cardinality: string;
  rightTable: string;
  rightCol: string;
}

export const JoinDiagram: React.FC<JoinDiagramProps> = ({
  leftTable, leftCol, cardinality, rightTable, rightCol,
}) => (
  <div className={styles.diagram}>
    <div className={styles.side}>
      <span className={styles.table}>{leftTable}</span>
      <span className={styles.col}>{leftCol}</span>
    </div>
    <div className={styles.connector}>
      <div className={styles.line} />
      <div className={styles.centerBox}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden="true" className={styles.joinIcon}>
          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
          <circle cx="10.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
        <span className={styles.cardinality}>{cardinality}</span>
      </div>
      <div className={styles.line} />
    </div>
    <div className={`${styles.side} ${styles.right}`}>
      <span className={styles.table}>{rightTable}</span>
      <span className={styles.col}>{rightCol}</span>
    </div>
  </div>
);
