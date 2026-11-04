import React, { useState } from 'react';
import { Card, Slider, TextInput, Typography, Horizontal, Vertical } from '@/components';
import { spacing } from '../styles';
import styles from './HookBoxes.module.css';
import { computeEstimate, formatRowsFull, usdRange } from '../utils';
import type { EstimateInputs, Plan } from '../types';

/** Which box the Caching tab hook shows under the title. Switched from the gear. */
export type HookBoxStyle = 'original' | 'receipt' | 'calculator';
export const HOOK_BOX_OPTIONS: { id: HookBoxStyle; label: string }[] = [
  { id: 'original', label: 'Original · the PM’s layout' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'calculator', label: 'Calculator' },
];

const BOX_TITLE = 'Estimated savings';

const Line: React.FC<{ label: string; sub?: string; value: React.ReactNode; total?: boolean; valueColor?: 'base' | 'success' }> = ({ label, sub, value, total, valueColor = 'base' }) => (
  <Horizontal justify="space-between" align="start" gap={spacing.D} className={`${styles.line} ${total ? styles.total : ''}`}>
    <Vertical gap={0}>
      <Typography variant="content-label" color="base" noMargin>{label}</Typography>
      {sub && <Typography variant="footnote" color="gray-light" noMargin>{sub}</Typography>}
    </Vertical>
    <Typography variant={total ? 'content-label' : 'body-normal'} color={valueColor} as="span" noMargin className={styles.value}>{value}</Typography>
  </Horizontal>
);

/**
 * The receipt (set 1, option 5, with Vivek's change of 4 Nov): start, subtract,
 * remainder, total with the rate as its subtext. Read-only: no inputs, no Edit.
 */
/** The receipt's lines alone, for the box and for the org-level modal on the Data Cache page. */
export const ReceiptLines: React.FC<{ inputs: EstimateInputs; plan: Plan; scope?: string }> = ({ inputs, plan, scope }) => {
  const r = computeEstimate(inputs, plan);
  const fromCache = inputs.queriesPerMonth - r.stillReaching;
  return (
    <Vertical gap={0}>
      <Line label="Warehouse queries a month today" sub={scope} value={formatRowsFull(inputs.queriesPerMonth)} />
      <Line label="Answered from the cache instead" value={`−${formatRowsFull(fromCache)}`} valueColor="success" />
      <Line label="Still on the warehouse" sub="Data outside the cache window" value={formatRowsFull(r.stillReaching)} />
      <Line
        label="Estimated saving a year"
        sub={`At $${inputs.ratePerQuery} per warehouse query, with up to ${inputs.hitPct}% of queries served from cache`}
        value={usdRange(r.savingPerYear)}
        total
        valueColor="success"
      />
    </Vertical>
  );
};

export const ReceiptBox: React.FC<{ inputs: EstimateInputs; plan: Plan }> = ({ inputs, plan }) => (
  <Card className={styles.card}>
    <Vertical gap={spacing.C} className={styles.cardBody}>
      <Typography variant="section-label" color="base" as="h3" noMargin>{BOX_TITLE}</Typography>
      <ReceiptLines inputs={inputs} plan={plan} />
    </Vertical>
  </Card>
);

/**
 * The calculator (set 2, option B, with Vivek's order of 4 Nov): the result first,
 * then the inputs in place: warehouse queries, cost per query, share served from
 * cache. Every change recomputes and is kept on the model.
 */
/** The three inputs of the calculator, as rows. Used by the box and by the Data Cache banner. */
export const CalculatorInputs: React.FC<{
  inputs: EstimateInputs;
  onChange: (next: EstimateInputs) => void;
  queriesHelp?: string;
  /** `rows` (the box): label left, field right, one under another. `row` (the banner): the three side by side, label above field. */
  layout?: 'rows' | 'row';
}> = ({ inputs, onChange, queriesHelp = 'Last 30 days', layout = 'rows' }) => {
  const [draft, setDraft] = useState({ q: formatRowsFull(inputs.queriesPerMonth), rate: String(inputs.ratePerQuery) });
  const commit = (k: 'q' | 'rate', raw: string) => {
    setDraft((d) => ({ ...d, [k]: raw }));
    const n = Number(raw.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(n) || raw.trim() === '') return;
    onChange(k === 'q' ? { ...inputs, queriesPerMonth: Math.max(0, Math.round(n)) } : { ...inputs, ratePerQuery: Math.max(0, n) });
  };
  if (layout === 'row') {
    return (
      <Horizontal gap={spacing.F} align="end" wrap className={styles.knobRow}>
        <Vertical gap={spacing.A} className={styles.knob}>
          <Typography variant="content-label" color="base" noMargin>Warehouse queries a month</Typography>
          <TextInput
            value={draft.q}
            onChange={(e) => commit('q', e.target.value)}
            onBlur={() => setDraft((d) => ({ ...d, q: formatRowsFull(inputs.queriesPerMonth) }))}
            inputMode="numeric"
            aria-label="Warehouse queries a month"
          />
        </Vertical>
        <Vertical gap={spacing.A} className={styles.knob}>
          <Typography variant="content-label" color="base" noMargin>Warehouse cost per query ($)</Typography>
          <TextInput value={draft.rate} onChange={(e) => commit('rate', e.target.value)} inputMode="decimal" aria-label="Warehouse cost per query ($)" />
        </Vertical>
        <Vertical gap={spacing.A} className={styles.knobWide}>
          <Typography variant="content-label" color="base" noMargin>Queries served from cache</Typography>
          <Horizontal gap={spacing.C} align="center" className={styles.knobSlider}>
            <div className={styles.slider}>
              <Slider value={inputs.hitPct} min={0} max={100} step={5} onChange={(v) => onChange({ ...inputs, hitPct: v })} aria-label="Queries served from cache" />
            </div>
            <Typography variant="body-normal" color="base" as="span" noMargin className={styles.pct}>{inputs.hitPct}%</Typography>
          </Horizontal>
        </Vertical>
      </Horizontal>
    );
  }
  return (
    <Vertical gap={0}>
      <Horizontal justify="space-between" align="center" gap={spacing.D} className={styles.line}>
        <Vertical gap={0}>
          <Typography variant="content-label" color="base" noMargin>Warehouse queries a month</Typography>
          <Typography variant="footnote" color="gray-light" noMargin>{queriesHelp}</Typography>
        </Vertical>
        <div className={styles.field}>
          <TextInput
            value={draft.q}
            onChange={(e) => commit('q', e.target.value)}
            onBlur={() => setDraft((d) => ({ ...d, q: formatRowsFull(inputs.queriesPerMonth) }))}
            inputMode="numeric"
            aria-label="Warehouse queries a month"
          />
        </div>
      </Horizontal>
      <Horizontal justify="space-between" align="center" gap={spacing.D} className={styles.line}>
        <Typography variant="content-label" color="base" noMargin>Warehouse cost per query ($)</Typography>
        <div className={styles.field}>
          <TextInput value={draft.rate} onChange={(e) => commit('rate', e.target.value)} inputMode="decimal" aria-label="Warehouse cost per query ($)" />
        </div>
      </Horizontal>
      <Horizontal justify="space-between" align="center" gap={spacing.D} className={styles.line}>
        <Vertical gap={0}>
          <Typography variant="content-label" color="base" noMargin>Queries served from cache</Typography>
          <Typography variant="footnote" color="gray-light" noMargin>Most models reach 60 to 80%</Typography>
        </Vertical>
        <Horizontal gap={spacing.C} align="center" className={styles.field}>
          <div className={styles.slider}>
            <Slider value={inputs.hitPct} min={0} max={100} step={5} onChange={(v) => onChange({ ...inputs, hitPct: v })} aria-label="Queries served from cache" />
          </div>
          <Typography variant="body-normal" color="base" as="span" noMargin className={styles.pct}>{inputs.hitPct}%</Typography>
        </Horizontal>
      </Horizontal>
    </Vertical>
  );
};

export const CalculatorBox: React.FC<{ inputs: EstimateInputs; plan: Plan; onChange: (next: EstimateInputs) => void }> = ({ inputs, plan, onChange }) => {
  const r = computeEstimate(inputs, plan);
  return (
    <Card className={styles.card}>
      <Vertical gap={spacing.C} className={styles.cardBody}>
        <Typography variant="section-label" color="base" as="h3" noMargin>{BOX_TITLE}</Typography>
        <Vertical gap={spacing.A} className={styles.result}>
          <Typography variant="page-title" color="success" as="span" noMargin>{usdRange(r.savingPerYear)}</Typography>
          <Typography variant="footnote" color="gray-light" noMargin>a year in warehouse cost</Typography>
        </Vertical>
        {/* Harviish, 4 Nov: ties cache query hours to the warehouse queries. Static for now. */}
        <Typography variant="body-normal" color="gray" noMargin>Caching this model uses ~32 of your 1,000 query hours</Typography>
        <CalculatorInputs inputs={inputs} onChange={onChange} />
      </Vertical>
    </Card>
  );
};
