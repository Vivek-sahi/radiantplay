import React from 'react';
import { Select } from '@components/Select';
import { Button } from '@components/Button';
import { Typography } from '@components/Typography';
import { Vertical } from '@components/Layout';
import { pivotFields, type PivotAgg, type PivotConfig, type Sheet } from '../engine/workbook';
import styles from './PivotPanel.module.css';

// The pivot editor, on the right of a Pivot tab as in Google Sheets: Rows, Columns, Values and how
// to show them. Every change recomputes the table at once.

const AGGS = [{ id: 'sum', label: 'Sum' }, { id: 'average', label: 'Average' }, { id: 'count', label: 'Count' }];
const SHOW = [{ id: 'value', label: 'Value' }, { id: 'row-pct', label: '% of row total' }];

export const PivotPanel: React.FC<{ cfg: PivotConfig; source: Sheet; onChange: (cfg: PivotConfig) => void }> = ({ cfg, source, onChange }) => {
  const fields = pivotFields(source);
  const notUsed = fields.filter((f) => !cfg.rows.includes(f.name) && f.name !== cfg.column);
  const opt = (list: { name: string }[]) => list.map((f) => ({ id: f.name, label: f.name }));
  return (
    <aside className={styles.panel} aria-label="Pivot table editor">
      <Vertical gap={16}>
        <Vertical gap={2}>
          <Typography variant="content-label">Pivot table editor</Typography>
          <Typography variant="footnote" color="gray">From {source.name} · {source.rows.length.toLocaleString()} rows</Typography>
        </Vertical>

        <Vertical gap={8}>
          <Typography variant="section-label">Rows</Typography>
          {cfg.rows.map((r) => (
            <div key={r} className={styles.chip}>
              <span>{r}</span>
              <Button className={styles.quiet} variant="tertiary" size="xs" iconOnly icon="cross" iconPosition="leading" onClick={() => onChange({ ...cfg, rows: cfg.rows.filter((x) => x !== r) })}>Remove {r}</Button>
            </div>
          ))}
          <Select placeholder="Add a row field" options={opt(notUsed)} value="" onChange={(v) => onChange({ ...cfg, rows: [...cfg.rows, v] })} size="small" fullWidth />
        </Vertical>

        <Vertical gap={8}>
          <Typography variant="section-label">Columns</Typography>
          <Select options={[{ id: '', label: 'None' }, ...opt(fields.filter((f) => !f.numeric && !cfg.rows.includes(f.name)))]} value={cfg.column ?? ''} onChange={(v) => onChange({ ...cfg, column: v || null })} size="small" fullWidth />
        </Vertical>

        <Vertical gap={8}>
          <Typography variant="section-label">Values</Typography>
          <Select options={opt(fields.filter((f) => f.numeric))} value={cfg.values[0]?.field ?? ''} onChange={(v) => onChange({ ...cfg, values: [{ field: v, agg: cfg.values[0]?.agg ?? 'sum' }] })} size="small" fullWidth />
          <Select options={AGGS} value={cfg.values[0]?.agg ?? 'sum'} onChange={(v) => onChange({ ...cfg, values: [{ field: cfg.values[0]?.field ?? '', agg: v as PivotAgg }] })} size="small" fullWidth />
        </Vertical>

        <Vertical gap={8}>
          <Typography variant="section-label">Show values as</Typography>
          <Select options={SHOW} value={cfg.show} onChange={(v) => onChange({ ...cfg, show: v as PivotConfig['show'] })} size="small" fullWidth />
        </Vertical>
      </Vertical>
    </aside>
  );
};

export default PivotPanel;
