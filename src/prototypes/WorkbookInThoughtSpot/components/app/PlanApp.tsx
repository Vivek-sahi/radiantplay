import React, { useMemo, useState } from 'react';
import { Typography } from '@components/Typography';
import { Select } from '@components/Select';
import { TextInput } from '@components/TextInput';
import { Button } from '@components/Button';
import { Horizontal, Vertical } from '@components/Layout';
import { setCell, type Sheet, type Workbook } from '../../engine/workbook';
import styles from './PlanApp.module.css';

// The App tab Spotter builds from the FY26 workbook (Vivek, 3 Nov: the data app happens via the agent).
// Regional leads pick their region, see actual against plan, edit plan by month, and send it to the plan
// owner for approval (the PM's e2e flow). Plan edits write to the workbook's Plan input table, so the
// sheets and the app stay one source.

const money = (n: number) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n)).toLocaleString()}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const monthOrder = (m: string) => { const [mo, y] = m.split(' '); return Number(y) * 12 + MONTHS.indexOf(mo); };

export interface PlanAppProps {
  wb: Workbook;
  sheet: Sheet;
  onChange: (next: Workbook) => void;
  onNote: (note: string) => void;
}

export const PlanApp: React.FC<PlanAppProps> = ({ wb, sheet, onChange, onNote }) => {
  const plan = wb.sheets.find((s) => s.name === 'Plan');
  const finance = wb.sheets.find((s) => s.name === 'Finance');
  const regions = useMemo(() => [...new Set((plan?.rows ?? []).map((r) => String(r[0])))], [plan]);
  const [region, setRegion] = useState(regions[0] ?? '');
  const [edited, setEdited] = useState<Set<string>>(new Set());

  // The last six months of this region: actual from Finance, plan from the Plan input table.
  const months = useMemo(() => {
    const actual = new Map<string, number>();
    for (const r of finance?.rows ?? []) if (r[0] === region) actual.set(String(r[1]), (actual.get(String(r[1])) ?? 0) + Number(r[3]));
    return (plan?.rows ?? [])
      .map((r, i) => ({ i, region: String(r[0]), month: String(r[1]), plan: Number(r[2]) }))
      .filter((r) => r.region === region)
      .sort((a, b) => monthOrder(a.month) - monthOrder(b.month))
      .slice(-6)
      .map((r) => ({ ...r, actual: actual.get(r.month) ?? 0 }));
  }, [plan, finance, region]);

  const tot = months.reduce((a, m) => ({ actual: a.actual + m.actual, plan: a.plan + m.plan }), { actual: 0, plan: 0 });

  const editPlan = (rowIndex: number, month: string, text: string) => {
    if (!plan) return;
    const v = text.replace(/[$,\s]/g, '');
    if (v === '' || isNaN(Number(v)) || Number(v) === Math.round(Number(plan.rows[rowIndex][2]))) return;
    onChange(setCell(wb, plan.id, 2, rowIndex + 2, v).wb);
    setEdited((e) => new Set(e).add(`${region}|${month}`));
  };

  if (!plan || !finance) {
    return <div className={styles.root}><Typography variant="body-normal">This app needs the Plan and Finance tabs.</Typography></div>;
  }

  return (
    <div className={styles.root}>
      <Vertical gap={24} className={styles.inner}>
        <Vertical gap={4}>
          <Typography variant="page-title">{sheet.app?.title}</Typography>
          <Typography variant="body-normal" color="gray">
            For {sheet.app?.audience}. Plan changes write to {sheet.app?.writesTo} once the plan owner approves them.
          </Typography>
        </Vertical>

        <div style={{ maxWidth: 240 }}>
          <Select label="Region" options={regions.map((r) => ({ id: r, label: r }))} value={region} onChange={(v) => setRegion(v)} />
        </div>

        <div className={styles.kpis}>
          {[
            ['Actual, last 6 months', money(tot.actual)],
            ['Plan, last 6 months', money(tot.plan)],
            ['Variance', money(tot.actual - tot.plan)],
          ].map(([label, value]) => (
            <div key={label} className={styles.kpi}>
              <Typography variant="footnote" color="gray">{label}</Typography>
              <Typography variant="headline-large">{value}</Typography>
            </div>
          ))}
        </div>

        <div className={`${styles.table} ${styles[sheet.app?.style ?? 'light']}`}>
          <div className={`${styles.row} ${styles.head}`}>
            <Typography variant="content-label">Month</Typography>
            <Typography variant="content-label" className={styles.num}>Actual</Typography>
            <Typography variant="content-label" className={styles.num}>Plan</Typography>
            <Typography variant="content-label" className={styles.num}>Variance</Typography>
          </div>
          {months.map((m) => {
            const v = m.actual - m.plan;
            const key = `${region}|${m.month}`;
            return (
              <div key={key} className={styles.row}>
                <Typography variant="body-normal">{m.month}</Typography>
                <Typography variant="body-normal" className={styles.num}>{money(m.actual)}</Typography>
                <div className={edited.has(key) ? styles.edited : undefined}>
                  <TextInput
                    key={`${key}|${m.plan}`}
                    label={`Plan for ${m.month}`}
                    showLabel={false}
                    aria-label={`Plan for ${m.month}`}
                    defaultValue={Math.round(m.plan).toLocaleString()}
                    onBlur={(e) => editPlan(m.i, m.month, e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </div>
                <Typography variant="body-normal" className={`${styles.num} ${v < 0 ? styles.neg : ''}`}>{money(v)}</Typography>
              </div>
            );
          })}
        </div>

        <Horizontal gap={8} align="center">
          <Button
            variant="primary"
            disabled={!edited.size}
            onClick={() => {
              onNote(`Sent ${edited.size} plan change${edited.size === 1 ? '' : 's'} for ${region} to the plan owner for approval`);
              setEdited(new Set());
            }}
          >
            Send for approval
          </Button>
          <Typography variant="footnote" color="gray">
            {edited.size ? `${edited.size} month${edited.size === 1 ? '' : 's'} changed` : 'Edit a plan value to send it for approval'}
          </Typography>
        </Horizontal>
      </Vertical>
    </div>
  );
};

export default PlanApp;
