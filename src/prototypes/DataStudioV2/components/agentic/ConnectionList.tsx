import React from 'react';
import { c, sp, fs, fw, ff } from '../../styles';
import type { Connection } from '../../data/mockData';

/**
 * The connections the user already has, listed under the agent's question.
 *
 * Run-of-show S2: "Agent replies in-thread: *Which of your connections should I
 * look at?* Below it, the connections she already has — Snowflake, Databricks,
 * Salesforce, Postgres."
 *
 * That's a component, not prose — so it renders as rows with a platform glyph,
 * table count and sync age, rather than being written into the message text.
 * Read-only: she answers by typing which ones she wants, so there is nothing
 * to click here.
 */

const PLATFORM: Record<string, { label: string; fg: string; bg: string }> = {
  snowflake:  { label: 'Snowflake',  fg: '#1D6FBF', bg: 'rgba(41,181,232,0.12)' },
  databricks: { label: 'Databricks', fg: '#C1442E', bg: 'rgba(255,54,33,0.10)' },
  salesforce: { label: 'Salesforce', fg: '#1B96D8', bg: 'rgba(0,161,224,0.12)' },
  postgres:   { label: 'Postgres',   fg: '#31648C', bg: 'rgba(51,103,145,0.12)' },
  bigquery:   { label: 'BigQuery',   fg: '#3367D6', bg: 'rgba(66,133,244,0.12)' },
  redshift:   { label: 'Redshift',   fg: '#2B5B84', bg: 'rgba(43,91,132,0.12)' },
  dbt:        { label: 'dbt',        fg: '#C0410C', bg: 'rgba(255,105,71,0.12)' },
};

export interface ConnectionListProps {
  connections: Connection[];
}

export const ConnectionList: React.FC<ConnectionListProps> = ({ connections }) => (
  <div
    style={{
      marginTop: sp.C,
      border: `1px solid ${c['border-default']}`,
      borderRadius: 8,
      overflow: 'hidden',
      background: c['background-base'],
    }}
  >
    {connections.map((cn, i) => {
      const p = PLATFORM[cn.type] ?? { label: cn.type, fg: '#64748B', bg: '#F0F2F6' };
      return (
        <div
          key={cn.id}
          style={{
            display: 'flex', alignItems: 'center', gap: sp.B,
            padding: `${sp.B}px ${sp.C}px`,
            borderTop: i === 0 ? 'none' : `1px solid ${c['border-divider']}`,
          }}
        >
          <span
            style={{
              flexShrink: 0, width: 22, height: 22, borderRadius: 5,
              background: p.bg, color: p.fg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: fw.semibold, fontFamily: ff.primary,
            }}
            aria-hidden="true"
          >
            {p.label.slice(0, 2)}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary }}>
              {p.label}
            </span>
            <span style={{ display: 'block', fontSize: 11, color: c['content-secondary'], fontFamily: ff.primary }}>
              {cn.name} · {cn.tables} tables
            </span>
          </span>
          <span style={{ flexShrink: 0, fontSize: 11, color: c['content-secondary'], fontFamily: ff.primary, whiteSpace: 'nowrap' }}>
            {cn.lastSync}
          </span>
        </div>
      );
    })}
  </div>
);
