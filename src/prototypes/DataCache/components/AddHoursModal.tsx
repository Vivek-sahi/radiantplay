import React from 'react';
import { Alert, Button, Modal, ModalFooter, Typography, Vertical } from '@/components';
import { spacing } from '../styles';
import { cacheHours, formatRowsFull } from '../utils';
import type { DataModel, Plan } from '../types';

/** Add hours for a model the free hours don't cover. The one upsell moment, routed to the rep. */
export const AddHoursModal: React.FC<{
  model: DataModel;
  plan: Plan;
  hoursLeft: number;
  onRequest: () => void;
  onClose: () => void;
}> = ({ model, plan, hoursLeft, onRequest, onClose }) => (
  <Modal
    isOpen
    onClose={onClose}
    title="Add query hours"
    size="medium"
    footer={
      <ModalFooter
        secondaryAction={<Button variant="secondary" onClick={onClose}>Not now</Button>}
        primaryAction={<Button variant="primary" onClick={onRequest}>Contact my ThoughtSpot rep</Button>}
      />
    }
  >
    <Vertical gap={spacing.D}>
      <Typography variant="body-normal" color="base" noMargin>
        Caching {model.name} needs about {formatRowsFull(cacheHours(model))} query hours a month.{' '}
        {hoursLeft > 0
          ? `Your free hours have about ${formatRowsFull(hoursLeft)} left this month.`
          : `Your ${formatRowsFull(plan.freeHours)} free hours are used up this month.`}
      </Typography>
      <Typography variant="body-normal" color="base" noMargin>
        Add a pack of 1,000 query hours and keep caching. Your ThoughtSpot rep can turn it on today.
      </Typography>
      <Alert status="info" variant="section-multiline" dismissible={false} message="Free hours reset on the 1st of every month. Nothing is charged until you add hours." />
    </Vertical>
  </Modal>
);
