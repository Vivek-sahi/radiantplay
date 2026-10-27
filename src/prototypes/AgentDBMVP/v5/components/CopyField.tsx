import React from 'react';
import { Button, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import styles from '../v5.module.css';

const copyText = (value: string) => navigator.clipboard?.writeText(value).catch(() => undefined);

/** A fact to copy: label, value, Copy. Rows in a grid (Connect) or a column (a secret). Plain. */
export const CopyField: React.FC<{ label: string; value: string; onCopied: (label: string) => void; secret?: boolean }> = ({
  label,
  value,
  onCopied,
  secret,
}) => (
  <div className={styles.fact}>
    <Typography variant="body-normal" color="gray-light" noMargin className={styles.factLabel}>
      {label}
    </Typography>
    <Typography variant="body-normal" color="base" noMargin className={styles.factValue}>
      {secret ? '••••••••••••••••' : value}
    </Typography>
    <Button
      variant="tertiary"
      size="small"
      icon="copy"
      iconOnly
      aria-label={`Copy ${label}`}
      onClick={() => {
        copyText(value);
        onCopied(label);
      }}
    >
      Copy
    </Button>
  </div>
);

/** The thing to paste, first and big, with the page's one primary button (principle 6). */
export const CopyBlock: React.FC<{ label: string; value: string; onCopied: (label: string) => void }> = ({ label, value, onCopied }) => (
  <div className={styles.copyBlock}>
    <Vertical gap={spacing.A} className={styles.blockValue}>
      <Typography variant="footnote" color="gray-light" noMargin>
        {label}
      </Typography>
      <Typography variant="content-label" color="base" noMargin>
        {value}
      </Typography>
    </Vertical>
    <Button
      variant="primary"
      icon="copy"
      onClick={() => {
        copyText(value);
        onCopied(label);
      }}
    >
      Copy
    </Button>
  </div>
);

export const CodeBlock: React.FC<{ children: string }> = ({ children }) => <pre className={styles.codeBlock}>{children}</pre>;
