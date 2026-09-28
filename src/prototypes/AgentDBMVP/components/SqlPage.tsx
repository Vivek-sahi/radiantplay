import React, { useState } from 'react';
import { Button, Horizontal, Select, Table, TextArea, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { StoreTable } from '../types';
import { PageHeader, Panel } from './primitives';
import styles from './pages.module.css';

const DEFAULT_SQL = `SELECT region, SUM(amount) AS revenue
FROM retail_sales.orders
WHERE order_date >= '2026-07-01'
GROUP BY region
ORDER BY revenue DESC;`;

const RESULT = [
  { region: 'West', revenue: '48,210,904.20' },
  { region: 'South', revenue: '41,887,120.75' },
  { region: 'North', revenue: '36,402,558.10' },
  { region: 'East', revenue: '29,115,730.95' },
];

export const SqlPage: React.FC<{ tables: StoreTable[] }> = ({ tables }) => {
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [runAs, setRunAs] = useState('me');
  const [ran, setRan] = useState(false);

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="SQL editor" subtitle="Check what landed, or explore your data directly." />
      <div className={styles.sqlLayout}>
        <Panel title="Tables">
          <Vertical gap={spacing.A}>
            {tables.map((t) => (
              <Button
                key={t.id}
                variant="tertiary"
                size="small"
                icon="table"
                fullWidth
                className={styles.leftAlign}
                onClick={() => setSql(`SELECT *\nFROM ${t.database}.${t.name}\nLIMIT 100;`)}
              >
                {`${t.database}.${t.name}`}
              </Button>
            ))}
          </Vertical>
        </Panel>

        <Vertical gap={spacing.D}>
          <Panel
            title="Query"
            actions={
              <Horizontal gap={spacing.B}>
                <Select
                  size="small"
                  options={[
                    { id: 'me', label: 'Run as Priya Nair' },
                    { id: 'support-copilot', label: 'Run as support-copilot' },
                  ]}
                  value={runAs}
                  onChange={(v) => {
                    setRunAs(v);
                    setRan(false);
                  }}
                />
                <Button variant="primary" size="small" icon="play" onClick={() => setRan(true)}>
                  Run
                </Button>
              </Horizontal>
            }
          >
            <TextArea
              label="SQL"
              showLabel={false}
              rows={8}
              resize="vertical"
              value={sql}
              onChange={(e) => {
                setSql(e.target.value);
                setRan(false);
              }}
              className={styles.sqlInput}
            />
          </Panel>

          {ran && (
            <Panel title="Result" flush>
              {runAs === 'me' ? (
                <>
                  <Typography variant="footnote" color="gray-light" noMargin className={styles.resultMeta}>
                    4 rows · 240 ms · read 1.2 GB · cost under $0.01
                  </Typography>
                  <Table
                    compact
                    rowKey="region"
                    data={RESULT}
                    columns={[
                      { key: 'region', label: 'region' },
                      { key: 'revenue', label: 'revenue', align: 'right' },
                    ]}
                  />
                </>
              ) : (
                <Typography variant="body-normal" color="failure" noMargin className={styles.resultMeta}>
                  support-copilot can&apos;t read retail_sales.orders. It has read access to support_ops only. Change this in
                  Access.
                </Typography>
              )}
            </Panel>
          )}
        </Vertical>
      </div>
    </Vertical>
  );
};
