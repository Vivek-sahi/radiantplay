import React, { useState } from 'react';
import styles from './ToolcallCard.module.css';

export interface ToolcallData {
  id: string;
  title: string;
  input: string;
  output: string;
  status: 'loading' | 'done' | 'error';
  isVisible: boolean;
}

interface ToolcallCardProps {
  data: ToolcallData;
}

export const ToolcallCard: React.FC<ToolcallCardProps> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  const statusClass = data.status === 'done' ? styles.done
    : data.status === 'error' ? styles.error
    : styles.loading;

  return (
    <div
      className={`${styles.card} ${statusClass} ${data.isVisible ? styles.visible : ''} ${expanded ? styles.expanded : ''}`}
      onClick={() => setExpanded(e => !e)}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.iconStack}>
            <svg className={styles.tsIcon} width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M14.8795 5H5V6.82982H14.8795V5Z" fill="currentColor"/>
              <path d="M14.8795 7.43975H11.1257V9.26957H14.8795V7.43975Z" fill="currentColor"/>
              <path d="M7.39834 7.43975H5V9.26957H7.39834C8.29442 9.26957 9.02484 9.99999 9.02484 10.8961V14.8795H10.8547V10.8961C10.8547 8.99095 9.30346 7.43975 7.39834 7.43975Z" fill="currentColor"/>
              <path d="M13.0045 11.9277C12.1574 11.9277 11.4684 12.6167 11.4684 13.4639C11.4684 14.311 12.1574 15 13.0045 15C13.8516 15 14.5406 14.311 14.5406 13.4639C14.5406 12.6167 13.8516 11.9277 13.0045 11.9277Z" fill="currentColor"/>
            </svg>
            <svg className={styles.spinnerSvg} width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18.8889 9.99997C18.8889 14.9092 14.9092 18.8889 9.99998 18.8889C5.09078 18.8889 1.11109 14.9092 1.11109 9.99997C1.11109 5.09077 5.09077 1.11108 9.99997 1.11108" stroke="currentColor" strokeWidth="2.22222" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={`${styles.titleText} ${data.status === 'error' ? styles.errorTitle : ''}`}>
            {data.title}
          </span>
        </div>
        <svg className={styles.expandBtn} viewBox="0 0 16 16" fill="none" width="16" height="16">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <span className={styles.label}>INPUT</span>
          <span className={styles.value}>{data.input}</span>
        </div>
        <div className={styles.section}>
          <span className={styles.label}>OUTPUT</span>
          {data.status === 'loading' && <div className={styles.skeleton} />}
          {data.status !== 'loading' && <span className={styles.value}>{data.output}</span>}
        </div>
      </div>
    </div>
  );
};
