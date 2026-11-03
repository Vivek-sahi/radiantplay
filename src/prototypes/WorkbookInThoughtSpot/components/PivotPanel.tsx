import React from 'react';
import { Select } from '@components/Select';
import { Button } from '@components/Button';
import { Card } from '@components/Card';
import { Checkbox } from '@components/Checkbox';
import { ActionMenu } from '@components/ActionMenu';
import { Typography } from '@components/Typography';
import { Horizontal, Vertical } from '@components/Layout';
import {
  AGG_LABEL, fieldItems, pivotFields,
  type PivotAgg, type PivotConfig, type PivotFilter, type PivotGroup, type PivotShow, type PivotValue, type Sheet,
} from '../engine/workbook';
import styles from './PivotPanel.module.css';

// The pivot table editor, as Google Sheets has it, built from Radiant components: Suggested pivots
// for a one-click start, then Rows, Columns, Values and Filters, each with Add. Rows and columns
// have an order and Show totals; values have Summarise by and Show as; filters are a checklist of
// the field's values. Every change recomputes the table.

const ORDER = [{ id: 'asc', label: 'Ascending' }, { id: 'desc', label: 'Descending' }];
const AGGS = (Object.keys(AGG_LABEL) as PivotAgg[]).map((a) => ({ id: a, label: AGG_LABEL[a] }));
const SHOW: { id: PivotShow; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'row', label: '% of row' },
  { id: 'column', label: '% of column' },
  { id: 'total', label: '% of grand total' },
];

interface Props { cfg: PivotConfig; source: Sheet; onChange: (cfg: PivotConfig) => void }

export const PivotPanel: React.FC<Props> = ({ cfg, source, onChange }) => {
  const fields = pivotFields(source);
  const numeric = fields.filter((f) => f.numeric);
  const grouped = new Set([...cfg.rows, ...cfg.columns].map((g) => g.field));
  const empty = !cfg.rows.length && !cfg.columns.length && !cfg.values.length;

  // Suggestions in Sheets' words: "<value> for each <field>".
  const firstNum = numeric[0]?.name;
  const group = (field: string): PivotGroup => ({ field, order: 'asc', totals: true });
  const value = (field: string, show: PivotShow = 'default'): PivotValue => ({ field, agg: 'sum', show });
  const suggestions: { label: string; cfg: Partial<PivotConfig> }[] = firstNum ? [
    { label: `${firstNum} for each Region`, cfg: { rows: [group('Region')], values: [value(firstNum)] } },
    { label: `${firstNum} for each Region by Quarter`, cfg: { rows: [group('Region')], columns: [group('Quarter')], values: [value(firstNum)] } },
    { label: `Share of ${firstNum} by Industry`, cfg: { rows: [group('Industry')], values: [value(firstNum, 'total')] } },
  ].filter((sg) => [...(sg.cfg.rows ?? []), ...(sg.cfg.columns ?? [])].every((r) => fields.some((f) => f.name === r.field))) : [];

  const update = (patch: Partial<PivotConfig>) => onChange({ ...cfg, ...patch });
  const editAt = <T,>(list: T[], i: number, patch: Partial<T>) => list.map((x, j) => (j === i ? { ...x, ...patch } : x));

  const addMenu = (options: { name: string }[], onPick: (field: string) => void) => (
    <ActionMenu
      placement="bottom-end"
      trigger={<Button className={styles.add} variant="tertiary" size="small" icon="plus" iconPosition="leading" disabled={!options.length}>Add</Button>}
    >
      {options.map((f) => <ActionMenu.Item key={f.name} label={f.name} onClick={() => onPick(f.name)} />)}
    </ActionMenu>
  ) ;

  const section = (title: string, menu: React.ReactNode, body: React.ReactNode) => (
    <Vertical gap={8}>
      <Horizontal justify="space-between" align="center">
        <Typography variant="section-label">{title}</Typography>
        {menu}
      </Horizontal>
      {body}
    </Vertical>
  );

  const removeButton = (label: string, onClick: () => void) => (
    <Button className={styles.quiet} variant="tertiary" size="xs" iconOnly icon="cross" iconPosition="leading" onClick={onClick}>{label}</Button>
  );

  const groupCard = (g: PivotGroup, i: number, which: 'rows' | 'columns') => (
    <Card key={`${which}-${g.field}`}>
      <Card.Body>
        <Vertical gap={8}>
          <Horizontal justify="space-between" align="center">
            <Typography variant="content-label">{g.field}</Typography>
            {removeButton(`Remove ${g.field}`, () => update({ [which]: cfg[which].filter((_, j) => j !== i) } as Partial<PivotConfig>))}
          </Horizontal>
          <Select label="Order" options={ORDER} value={g.order} size="small" fullWidth onChange={(v) => update({ [which]: editAt(cfg[which], i, { order: v as PivotGroup['order'] }) } as Partial<PivotConfig>)} />
          {i === 0 && <Checkbox label="Show totals" checked={g.totals} onChange={(c) => update({ [which]: editAt(cfg[which], i, { totals: c }) } as Partial<PivotConfig>)} />}
        </Vertical>
      </Card.Body>
    </Card>
  );

  const valueCard = (v: PivotValue, i: number) => (
    <Card key={`v-${i}`}>
      <Card.Body>
        <Vertical gap={8}>
          <Horizontal justify="space-between" align="center">
            <Typography variant="content-label">{v.field}</Typography>
            {removeButton(`Remove ${v.field}`, () => update({ values: cfg.values.filter((_, j) => j !== i) }))}
          </Horizontal>
          <Select label="Summarise by" options={AGGS} value={v.agg} size="small" fullWidth onChange={(x) => update({ values: editAt(cfg.values, i, { agg: x as PivotAgg }) })} />
          <Select label="Show as" options={SHOW} value={v.show} size="small" fullWidth onChange={(x) => update({ values: editAt(cfg.values, i, { show: x as PivotShow }) })} />
        </Vertical>
      </Card.Body>
    </Card>
  );

  const filterCard = (f: PivotFilter, i: number) => {
    const items = fieldItems(source, f.field);
    const shown = items.length - f.hidden.length;
    return (
      <Card key={`f-${f.field}`}>
        <Card.Body>
          <Vertical gap={8}>
            <Horizontal justify="space-between" align="center">
              <Typography variant="content-label">{f.field}</Typography>
              {removeButton(`Remove filter on ${f.field}`, () => update({ filters: cfg.filters.filter((_, j) => j !== i) }))}
            </Horizontal>
            <Typography variant="footnote" color="gray">{shown === items.length ? 'Showing all items' : `Showing ${shown} of ${items.length} items`}</Typography>
            <Horizontal gap={8}>
              <Button variant="tertiary" size="xs" onClick={() => update({ filters: editAt(cfg.filters, i, { hidden: [] }) })}>Select all</Button>
              <Button variant="tertiary" size="xs" onClick={() => update({ filters: editAt(cfg.filters, i, { hidden: items }) })}>Clear</Button>
            </Horizontal>
            <div className={styles.items}>
              {items.map((it) => (
                <Checkbox
                  key={it}
                  label={it || '(Blank)'}
                  checked={!f.hidden.includes(it)}
                  onChange={(c) => update({ filters: editAt(cfg.filters, i, { hidden: c ? f.hidden.filter((h) => h !== it) : [...f.hidden, it] }) })}
                />
              ))}
            </div>
          </Vertical>
        </Card.Body>
      </Card>
    );
  };

  return (
    <aside className={styles.panel} aria-label="Pivot table editor">
      <Vertical gap={20}>
        <Vertical gap={2}>
          <Typography variant="content-label">Pivot table editor</Typography>
          <Typography variant="footnote" color="gray">Range: {cfg.range}</Typography>
        </Vertical>

        {empty && suggestions.length > 0 && (
          <Vertical gap={8}>
            <Typography variant="section-label">Suggested</Typography>
            {suggestions.map((sg) => (
              <Button key={sg.label} className={styles.suggestion} variant="secondary" size="small" fullWidth onClick={() => update(sg.cfg)}>{sg.label}</Button>
            ))}
          </Vertical>
        )}

        {section('Rows', addMenu(fields.filter((f) => !f.numeric && !grouped.has(f.name)), (field) => update({ rows: [...cfg.rows, { field, order: 'asc', totals: true }] })),
          <Vertical gap={8}>{cfg.rows.map((g, i) => groupCard(g, i, 'rows'))}</Vertical>)}

        {section('Columns', addMenu(fields.filter((f) => !f.numeric && !grouped.has(f.name)), (field) => update({ columns: [...cfg.columns, { field, order: 'asc', totals: true }] })),
          <Vertical gap={8}>{cfg.columns.map((g, i) => groupCard(g, i, 'columns'))}</Vertical>)}

        {section('Values', addMenu(numeric, (field) => update({ values: [...cfg.values, { field, agg: 'sum', show: 'default' }] })),
          <Vertical gap={8}>{cfg.values.map(valueCard)}</Vertical>)}

        {section('Filters', addMenu(fields.filter((f) => !f.numeric && !cfg.filters.some((x) => x.field === f.name)), (field) => update({ filters: [...cfg.filters, { field, hidden: [] }] })),
          <Vertical gap={8}>{cfg.filters.map(filterCard)}</Vertical>)}
      </Vertical>
    </aside>
  );
};

export default PivotPanel;
