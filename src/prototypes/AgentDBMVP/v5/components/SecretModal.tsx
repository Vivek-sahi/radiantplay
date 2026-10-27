import React from 'react';
import { Button, Modal, ModalFooter, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { CopyBlock, CopyField } from './CopyField';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/** A plausible secret for the prototype. */
export const generateSecret = (prefix = ''): string =>
  prefix + Array.from({ length: 40 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');

/** The one moment a secret is visible. SOC 2: shown once, never again. */
export const SecretModal: React.FC<{ title: string; name: string; secret: string; what: 'password' | 'secret'; onDone: () => void }> = ({
  title,
  name,
  secret,
  what,
  onDone,
}) => (
  <Modal
    isOpen
    onClose={onDone}
    title={title}
    size="medium"
    closeOnOverlayClick={false}
    footer={
      <ModalFooter
        primaryAction={
          <Button variant="primary" onClick={onDone}>
            Done
          </Button>
        }
      />
    }
  >
    <Vertical gap={spacing.D}>
      <Typography variant="body-normal" color="base" noMargin>
        Shown once. Copy the {what} now.
      </Typography>
      <CopyField label="Name" value={name} onCopied={() => undefined} />
      <CopyBlock label={what === 'password' ? 'Password' : 'Secret'} value={secret} onCopied={() => undefined} />
    </Vertical>
  </Modal>
);
