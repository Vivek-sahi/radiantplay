import React from 'react';
import { Button, Horizontal, Typography } from '@/components';
import { spacing } from '@tokens/spacing';
import { KeyValue } from '../../components/primitives';
import styles from '../v3.module.css';

/**
 * A value to copy, and a block to copy, in Plain (Vivek, 15 Oct: a code font only in the SQL
 * editor). v3's own, so v1's monospace versions stay as reviewed on 7 Oct.
 */
export const CopyField: React.FC<{ label: string; value: string; onCopied: (label: string) => void; secret?: boolean }> = ({
  label,
  value,
  onCopied,
  secret,
}) => (
  <KeyValue label={label}>
    <Horizontal gap={spacing.B} align="center">
      <Typography variant="body-normal" color="base" noMargin className={styles.copyValue}>
        {secret ? '••••••••••••••••' : value}
      </Typography>
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
