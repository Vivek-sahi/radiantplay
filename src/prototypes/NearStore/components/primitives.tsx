import React from 'react';
import { createPortal } from 'react-dom';
import { Toast, Typography, Horizontal, Vertical, Card, Modal, ModalFooter, Button } from '@/components';
import { spacing } from '../styles';
import styles from './primitives.module.css';
import type { RunStatus } from '../types';

// ── StatusPill ────────────────────────────────────────────────────────────────
export type PillKind = 'success' | 'failure' | 'warning' | 'info' | 'neutral';

export const StatusPill: React.FC<{ kind: PillKind; label: string }> = ({ kind, label }) => (
  <span className={`${styles.pill} ${styles[kind]}`}>{label}</span>
);

export function runStatusPillKind(status: RunStatus): PillKind {
  if (status === 'Success') return 'success';
  if (status === 'Error') return 'failure';
  return 'neutral'; // In progress
}

// ── StatCard ──────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{ label: string; value: string; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <Card className={styles.statCard}>
    <Vertical gap={spacing.A} className={styles.statCardBody}>
      <Typography variant="overline" color="gray-light" noMargin>
        {label}
      </Typography>
      <Typography variant="page-title" color="base" noMargin>
        {value}
      </Typography>
      {sub && (
        <Typography variant="footnote" color="gray-light" noMargin>
          {sub}
        </Typography>
      )}
    </Vertical>
  </Card>
);

// ── FloatingToast ───────────────────────────────────────────────────────────
// The DS Toast has no positioning of its own (the position-* classes only swap
// the animation), so we portal it to the body and pin it bottom-center.
export const FloatingToast: React.FC<{ message: string; type: 'success' | 'info'; onDismiss: () => void }> = ({
  message,
  type,
  onDismiss,
}) =>
  createPortal(
    <div className={styles.toastAnchor}>
      <Toast className={styles.toastWide} message={message} type={type} position="bottom" onDismiss={onDismiss} />
    </div>,
    document.body,
  );

// ── KeyValue (label → value rows) ───────────────────────────────────────────────
export const KeyValue: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Horizontal align="start" gap={spacing.D} className={styles.keyValueRow}>
    <div className={styles.keyValueLabel}>
      <Typography variant="body-normal" color="gray-light" noMargin>
        {label}
      </Typography>
    </div>
    <div className={styles.keyValueValue}>{children}</div>
  </Horizontal>
);

// ── SectionHeader ──────────────────────────────────────────────────────────────
export const SectionHeader: React.FC<{ title: string; actions?: React.ReactNode; size?: 'default' | 'small' }> = ({ title, actions, size = 'default' }) => (
  <Horizontal justify="space-between" align="center" className={styles.sectionHeader}>
    <Typography variant={size === 'small' ? 'content-label' : 'section-label'} color="base" noMargin>
      {title}
    </Typography>
    {actions && <Horizontal gap={spacing.E}>{actions}</Horizontal>}
  </Horizontal>
);

// ── ConfirmModal ────────────────────────────────────────────────────────────
// Left-aligned confirm dialog on the standard Radiant Modal. The DS ConfirmDialog
// is a centred "alert" pattern (top coloured icon, centred text/buttons) that reads
// inconsistently with the rest of Near Store, so purge/disable use this instead.
export const ConfirmModal: React.FC<{
  title: string;
  message: React.ReactNode;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmText, cancelText = 'Cancel', onConfirm, onCancel }) => (
  <Modal
    isOpen
    onClose={onCancel}
    title={title}
    size="medium"
    footer={
      <ModalFooter
        secondaryAction={<Button variant="secondary" onClick={onCancel}>{cancelText}</Button>}
        primaryAction={<Button variant="primary" onClick={onConfirm}>{confirmText}</Button>}
      />
    }
  >
    <Typography variant="body-normal" color="gray-light" noMargin>
      {message}
    </Typography>
  </Modal>
);
