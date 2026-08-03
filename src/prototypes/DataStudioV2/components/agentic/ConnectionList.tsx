import React from 'react';
import { c, fs, fw, ff } from '../../styles';
import type { Connection } from '../../data/mockData';
import { CONNECTOR_MARK, PostgresMark, SourceMark, hasBrandMark } from '../icons/ConnectorIcons';
import styles from './TableSuggestionCard.module.css';

/**
 * The connections the user already has, listed under the agent's question.
 *
 * Run-of-show S2: "Agent replies in-thread: *Which of your connections should I
 * look at?* Below it, the connections she already has — Snowflake, Databricks,
 * Salesforce, Postgres."
 *
 * That's a component, not prose. Read-only: she answers by typing which ones she
 * wants, so there is nothing to click here.
 *
 * Shares TableSuggestionCard's stylesheet — same light card, same row rhythm as
 * the table and join proposals, so every list the agent puts in the thread reads
 * as one family. The connector mark sits where those cards put their checkbox.
 * It used to be the platform's initials in a tinted square, which is a fake logo.
 */

const PLATFORM_LABEL: Record<string, string> = {
  snowflake:  'Snowflake',
  databricks: 'Databricks',
  salesforce: 'Salesforce',
  postgres:   'Postgres',
  bigquery:   'BigQuery',
  redshift:   'Redshift',
  dbt:        'dbt',
};

export interface ConnectionListProps {
  connections: Connection[];
}

export const ConnectionList: React.FC<ConnectionListProps> = ({ connections }) => (
  <div className={styles.card} style={{ marginTop: 12 }}>
    <div className={`${styles.list} ${styles.readOnly}`}>
      {connections.map(cn => {
        const Mark = CONNECTOR_MARK[cn.type] ?? PostgresMark;
        const label = PLATFORM_LABEL[cn.type] ?? cn.type;
        // Real logo where the demo has one, silhouette otherwise. This list is the
        // first place she sees her sources (S2) and the canvas is the second — they
        // have to agree, so both read the same brand marks.
        const branded = hasBrandMark(cn.type);
        return (
          <div key={cn.id} className={styles.row} style={{ cursor: 'default', alignItems: 'center', gap: 12 }}>
            {/* 22px, not the 16px the checkbox slot was built for. These are logos,
                not glyphs: each one sits inside its own padding within a 16px
                viewBox, so a 14px render left about 10px of visible mark against a
                two-line row — legible, but reading as an afterthought. A fixed
                square keeps the four left edges true to each other even though the
                marks themselves are different shapes. */}
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, flexShrink: 0 }}>
              {branded ? <SourceMark name={cn.type} size={22} /> : <Mark size={20} />}
            </span>
            <div className={styles.rowText}>
              <span className={styles.rowName}>{label}</span>
              <span className={styles.rowDesc}>{cn.name} · {cn.tables} tables</span>
            </div>
            <span style={{
              flexShrink: 0, alignSelf: 'center',
              fontSize: fs.xs, color: c['content-secondary'],
              fontFamily: ff.primary, fontWeight: fw.medium, whiteSpace: 'nowrap',
            }}>
              {cn.lastSync}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);
