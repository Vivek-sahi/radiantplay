import React, { useState } from 'react';
import { Modal, ModalFooter, Button, Typography, Vertical } from '@/components';
import { CalculatorInputs } from './HookBoxes';
import { spacing } from '../styles';
import styles from './EstimateModal.module.css';
import { computeEstimate, estimateBasis, formatRowsFull, usdRangeYr } from '../utils';
import type { EstimateInputs, Plan } from '../types';

/** The fit line: does caching the estimated queries fit in the plan's query hours? Org level. */
export const fitLine = (e: EstimateInputs, plan: Plan): { text: string; ok: boolean } => {
  const r = computeEstimate(e, plan);
  return r.withinFree
    ? { ok: true, text: `Caching these needs about ${formatRowsFull(r.cacheHours)} of the ${formatRowsFull(plan.freeHours)} query hours in your plan.` }
    : { ok: false, text: `Caching these needs about ${formatRowsFull(r.cacheHours)} query hours, more than the ${formatRowsFull(plan.freeHours)} in your plan. Add hours to cache them all.` };
};

/**
 * The calculator in a modal: the saving on its surface, then the same three inputs as
 * the calculator box. With `fit`, the org-level version also says whether caching the
 * estimated queries fits in the plan's query hours.
 */
export const EstimateModal: React.FC<{
  initial: EstimateInputs;
  plan: Plan;
  onSave: (next: EstimateInputs) => void;
  onClose: () => void;
  title?: string;
  /** Helper under the queries field. */
  queriesHelp?: string;
  /** Org level: show the average query time and the fit against the plan's query hours. */
  fit?: boolean;
  /** The first input's label (the page's modal is org-wide, Vivek's wording 4 Nov). */
  queriesLabel?: string;
}> = ({ initial, plan, onSave, onClose, title = 'Estimate your saving', queriesHelp = 'Last 30 days', fit = false, queriesLabel }) => {
  const [draft, setDraft] = useState<EstimateInputs>(initial);
  const r = computeEstimate(draft, plan);
  const f = fitLine(draft, plan);
  return (
    <Modal
      isOpen
      onClose={onClose}
      title={title}
      size="medium"
      footer={
        <ModalFooter
          secondaryAction={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
          primaryAction={<Button variant="primary" onClick={() => onSave(draft)}>Save</Button>}
        />
      }
    >
      <Vertical gap={spacing.D}>
        <Vertical gap={spacing.A} className={styles.result}>
          <Typography variant="page-title" color="success" as="span" noMargin>{usdRangeYr(r.savingPerYear)}</Typography>
          <Typography variant="footnote" color="gray-light" noMargin>{estimateBasis(draft)}</Typography>
          {fit && (
            <Typography variant="footnote" color={f.ok ? 'gray-light' : 'warning'} noMargin>{f.text}</Typography>
          )}
        </Vertical>
        <CalculatorInputs inputs={draft} onChange={setDraft} queriesHelp={queriesHelp} queriesLabel={queriesLabel} />
      </Vertical>
    </Modal>
  );
};
