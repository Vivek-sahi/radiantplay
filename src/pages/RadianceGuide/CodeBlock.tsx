import React from 'react';
import styles from './CodeBlock.module.css';

/** The docs code block (ArchitectureShowcase style): dark in both themes. */
export const CodeBlock: React.FC<{ title?: string; code: string }> = ({ title, code }) => (
  <div className={styles.block}>
    {title && <div className={styles.title}>{title}</div>}
    <pre className={styles.code}>{code}</pre>
  </div>
);

/** A single line of code in the same style, without a title bar. */
export const CodeLine: React.FC<{ code: string }> = ({ code }) => (
  <div className={styles.block}>
    <pre className={`${styles.code} ${styles.line}`}>{code}</pre>
  </div>
);
