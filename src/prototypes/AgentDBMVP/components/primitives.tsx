import React from 'react';
import { createPortal } from 'react-dom';
import { Button, Card, Horizontal, Toast, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import styles from './primitives.module.css';

/* Own copies for this prototype — nothing is imported from AgentDBStore or NearStore. */

export type PillKind = 'success' | 'failure' | 'warning' | 'info' | 'neutral';

export const StatusPill: React.FC<{ kind: PillKind; label: string }> = ({ kind, label }) => (
  <span className={`${styles.pill} ${styles[kind]}`}>{label}</span>
);

export const FloatingToast: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) =>
  createPortal(
    <div className={styles.toastAnchor}>
      <Toast className={styles.toastWide} message={message} type="success" position="bottom" onDismiss={onDismiss} />
    </div>,
    document.body,
  );

export const PageHeader: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
}) => (
  <Horizontal justify="space-between" align="start" gap={spacing.D} wrap>
    <Vertical gap={spacing.A}>
      <Typography variant="page-title" color="base" noMargin>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body-normal" color="gray-light" noMargin>
          {subtitle}
        </Typography>
      )}
    </Vertical>
    {actions && (
      <Horizontal gap={spacing.B} align="center">
        {actions}
      </Horizontal>
    )}
  </Horizontal>
);

/** A metric tile: label, big value, one line of context. */
export const StatTile: React.FC<{ label: string; value: string; note?: React.ReactNode; children?: React.ReactNode }> = ({
  label,
  value,
  note,
  children,
}) => (
  <Card>
    <Vertical gap={spacing.B} className={styles.tile}>
      <Typography variant="footnote" color="gray-light" noMargin>
        {label}
      </Typography>
      <Typography variant="headline-large" color="base" noMargin>
        {value}
      </Typography>
      {children}
      {note && (
        <Typography variant="footnote" color="gray-light" noMargin>
          {note}
        </Typography>
      )}
    </Vertical>
  </Card>
);

/** A white section panel with a heading row. */
export const Panel: React.FC<{ title: string; actions?: React.ReactNode; children: React.ReactNode; flush?: boolean }> = ({
  title,
  actions,
  children,
  flush,
}) => (
  <Card>
    <Vertical gap={spacing.D} className={flush ? styles.panelFlush : styles.panel}>
      <Horizontal justify="space-between" align="center" className={flush ? styles.panelHeadFlush : undefined}>
        <Typography variant="content-label" color="base" noMargin>
          {title}
        </Typography>
        {actions}
      </Horizontal>
      {children}
    </Vertical>
  </Card>
);

export const KeyValue: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Horizontal gap={spacing.D} align="start" className={styles.kv}>
    <Typography variant="body-normal" color="gray-light" noMargin className={styles.kvLabel}>
      {label}
    </Typography>
    <div className={styles.kvValue}>{children}</div>
  </Horizontal>
);

/** Monospace value with a copy button. */
export const CopyField: React.FC<{ label: string; value: string; onCopied: (label: string) => void; secret?: boolean }> = ({
  label,
  value,
  onCopied,
  secret,
}) => (
  <KeyValue label={label}>
    <Horizontal gap={spacing.B} align="center">
      <code className={styles.code}>{secret ? '••••••••••••••••' : value}</code>
      <Button
        variant="tertiary"
        size="small"
        icon="copy"
        iconOnly
        aria-label={`Copy ${label}`}
        onClick={() => {
          navigator.clipboard?.writeText(value).catch(() => undefined);
          onCopied(label);
        }}
      >
        Copy
      </Button>
    </Horizontal>
  </KeyValue>
);

export const CodeBlock: React.FC<{ children: string }> = ({ children }) => <pre className={styles.codeBlock}>{children}</pre>;

/** Coloured square used in legends. kind maps to a token colour. */
export const Swatch: React.FC<{ kind: 'pulse' | 'pipeline' | 'upload' | 'free' }> = ({ kind }) => (
  <span className={`${styles.swatch} ${styles[`sw_${kind}`]}`} aria-hidden />
);
