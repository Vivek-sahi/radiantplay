import React, { useState } from 'react';
import { Alert, Button, Modal, ModalFooter, Typography, Vertical } from '@/components';
import { FloatingToast } from './primitives';
import { spacing } from '../styles';
import { formatRowsFull } from '../utils';
import type { Plan } from '../types';

/**
 * A plan limit reached (Vivek, 4 Nov): the query hours used up for the month, or the
 * cache storage full. One warning banner, the same on the Data Cache page and on a
 * model's Caching tab, with the action that lifts the limit.
 *
 * Query hours: the PM's frame "Hours used up" (compute → query). Storage: not in the
 * PM's doc; the rule is Vivek's (existing caches keep running, no new model can be
 * cached), the words are placeholders for his copy pass.
 */
export type Limit = 'none' | 'hours' | 'storage';
export const LIMIT_OPTIONS: { id: Limit; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'hours', label: 'Query hours' },
  { id: 'storage', label: 'Storage' },
];

const message = (limit: Exclude<Limit, 'none'>, plan: Plan) =>
  limit === 'hours'
    ? `Caching is paused for November. You used your ${formatRowsFull(plan.freeHours)} free query hours on 22 Nov. Queries are running on your warehouse again and nothing is charged. Caching resumes 1 Dec, or now if you add hours.`
    : `Your ${plan.freeGB} GB of cache storage is full. Cached models keep refreshing, but no new model can be cached. Add storage, or purge a cache to free up space.`;

export const LimitBanner: React.FC<{ limit: Limit; plan: Plan }> = ({ limit, plan }) => {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  if (limit === 'none') return null;
  const hours = limit === 'hours';
  return (
    <>
      <Alert
        status="warning"
        variant="page"
        dismissible={false}
        message={message(limit, plan)}
        buttonText={hours ? 'Add hours' : 'Add storage'}
        onButtonClick={() => setOpen(true)}
      />
      {open && (
        <Modal
          isOpen
          onClose={() => setOpen(false)}
          title={hours ? 'Add query hours' : 'Add cache storage'}
          size="medium"
          footer={
            <ModalFooter
              secondaryAction={<Button variant="secondary" onClick={() => setOpen(false)}>Not now</Button>}
              primaryAction={<Button variant="primary" onClick={() => { setOpen(false); setToast('Request sent to your ThoughtSpot rep'); }}>Contact my ThoughtSpot rep</Button>}
            />
          }
        >
          {hours ? (
            <Vertical gap={spacing.D}>
              <Typography variant="body-normal" color="base" noMargin>
                Your {formatRowsFull(plan.freeHours)} free query hours for November are used up.
              </Typography>
              <Typography variant="body-normal" color="base" noMargin>
                Add a pack of 1,000 query hours and keep caching. Your ThoughtSpot rep can turn it on today.
              </Typography>
              <Alert status="info" variant="section-multiline" dismissible={false} message="Free hours reset on the 1st of every month. Nothing is charged until you add hours." />
            </Vertical>
          ) : (
            <Vertical gap={spacing.D}>
              <Typography variant="body-normal" color="base" noMargin>
                Your {plan.freeGB} GB of cache storage is full.
              </Typography>
              <Typography variant="body-normal" color="base" noMargin>
                Add more storage to cache new models. Your ThoughtSpot rep can turn it on today.
              </Typography>
            </Vertical>
          )}
        </Modal>
      )}
      {toast && <FloatingToast message={toast} type="success" onDismiss={() => setToast(null)} />}
    </>
  );
};
