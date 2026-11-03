import React from 'react';
import { Typography } from '@components/Typography';
import { Horizontal } from '@components/Layout';
import { Icon } from '@components/icons';
import { LoadingIndicator } from '@components/LoadingIndicator';
import styles from './WorkbookLoading.module.css';

// The workbook's loading state: its frame is in place (title, formula bar, column letters, row
// numbers, sheet tab, status bar) while the cells load. Grid look from the Klimt-Grid proposal
// (Pratheek, 28 Oct): hairline gridlines, white header, messages only in the bottom status bar.

const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const ROWS = Array.from({ length: 22 }, (_, i) => i + 1);

export const WorkbookLoading: React.FC<{ name: string; status: string }> = ({ name, status }) => (
  <div className={styles.frame}>
    <Horizontal gap={8} align="center" className={styles.titleBar}>
      <Icon name="table" size="m" />
      <Typography variant="content-label">{name}</Typography>
      <span className={styles.draft}>Draft</span>
    </Horizontal>
    <Horizontal gap={8} align="center" className={styles.formulaBar}>
      <span className={styles.cellRef}>A1</span>
      <span className={styles.fx}>fx</span>
    </Horizontal>
    <div className={styles.gridWrap}>
      <div className={styles.grid} role="grid" aria-busy="true" aria-label="Sheet 1, loading">
        <div className={styles.corner} />
        {COLS.map((c) => <div key={c} className={styles.colHead}>{c}</div>)}
        {ROWS.map((r) => (
          <React.Fragment key={r}>
            <div className={styles.rowHead}>{r}</div>
            {COLS.map((c, ci) => (
              <div key={c} className={styles.cell}>
                {r <= 14 && <span className={styles.bar} style={{ width: `${40 + ((r * 7 + ci * 13) % 45)}%`, animationDelay: `${(r + ci) * 40}ms` }} />}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
    <Horizontal align="center" justify="space-between" className={styles.footer}>
      <span className={styles.tab}>Sheet 1</span>
      <Horizontal gap={8} align="center">
        <LoadingIndicator size="small" />
        <Typography variant="footnote" color="gray">{status}</Typography>
      </Horizontal>
    </Horizontal>
  </div>
);

export default WorkbookLoading;
