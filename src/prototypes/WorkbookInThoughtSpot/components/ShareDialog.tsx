import React, { useState } from 'react';
import { Modal } from '@components/Modal';
import { Button } from '@components/Button';
import { TextInput } from '@components/TextInput';
import { TextArea } from '@components/TextArea';
import { Checkbox } from '@components/Checkbox';
import { Select } from '@components/Select';
import { Avatar } from '@components/Avatar';
import { Tooltip } from '@components/Tooltip';
import { Typography } from '@components/Typography';
import { Horizontal, Vertical } from '@components/Layout';
import { Icon } from '@components/icons';
import styles from './ShareDialog.module.css';

// ThoughtSpot's Share dialog, as the product ships it for Liveboards (Vivek's reference, 3 Nov),
// built from Radiant components: add people or groups, send a notification with an optional
// message, embedded link format, who it's shared with and at what level, and a link to copy.

interface Grant { id: string; name: string; group?: boolean; access: 'view' | 'edit'; locked?: boolean }

const ACCESS = [{ id: 'view', label: 'Can view' }, { id: 'edit', label: 'Can edit' }];

const INITIAL: Grant[] = [
  { id: 'all', name: 'All Group (+999)', group: true, access: 'view' },
  { id: 'priya', name: 'priya.nair', access: 'view' },
  { id: 'james', name: 'james.carter', access: 'view' },
  { id: 'you', name: 'You (owner)', access: 'edit', locked: true },
];

export const ShareDialog: React.FC<{ isOpen: boolean; objectName: string; onClose: () => void; onShared: (n: number) => void }> = ({ isOpen, objectName, onClose, onShared }) => {
  const [who, setWho] = useState('');
  const [grants, setGrants] = useState<Grant[]>(INITIAL);
  const [added, setAdded] = useState(0);
  const [notify, setNotify] = useState(true);
  const [withMessage, setWithMessage] = useState(false);
  const [message, setMessage] = useState('');
  const [embedded, setEmbedded] = useState(false);
  const [copied, setCopied] = useState(false);

  const add = () => {
    const name = who.trim();
    if (!name) return;
    setGrants((g) => [{ id: `${name}-${Date.now()}`, name, access: 'view' }, ...g]);
    setAdded((n) => n + 1);
    setWho('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share"
      size="large"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onShared(added)}>Share</Button>
        </div>
      }
    >
      <Vertical gap={16}>
        <Vertical gap={8}>
          <Horizontal gap={4} align="center">
            <Typography variant="content-label">Enter user name or group name</Typography>
            <Tooltip content="People and groups you add get the published version of this workbook." showDelay={200} hideDelay={0}>
              <span className={styles.info}><Icon name="info-circle" size="s" /></span>
            </Tooltip>
          </Horizontal>
          <Horizontal gap={8} align="center">
            <div className={styles.grow}>
              <TextInput
                placeholder="User name or group name"
                value={who}
                onChange={(e) => setWho(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') add(); }}
              />
            </div>
            <Button className={styles.quiet} variant="tertiary" size="small" iconOnly icon="plus" iconPosition="leading" disabled={!who.trim()} onClick={add}>Add</Button>
          </Horizontal>
          <Horizontal gap={24} align="center" wrap>
            <Checkbox label="Send notification" checked={notify} onChange={setNotify} />
            <Checkbox label="Add message (optional)" checked={withMessage} onChange={setWithMessage} />
            <Horizontal gap={4} align="center">
              <Checkbox label="Embedded link format" checked={embedded} onChange={setEmbedded} />
              <Tooltip content="Share a link that opens the workbook inside your embedded app." showDelay={200} hideDelay={0}>
                <span className={styles.info}><Icon name="info-circle" size="s" /></span>
              </Tooltip>
            </Horizontal>
          </Horizontal>
          {withMessage && <TextArea placeholder="Add a message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />}
        </Vertical>

        <div className={styles.list}>
          <Typography variant="content-label">Previously shared with:</Typography>
          {grants.map((g) => (
            <div key={g.id} className={styles.row}>
              <Avatar name={g.name} size="m" />
              <span className={styles.name}>{g.name}</span>
              <div className={styles.access}>
                <Select
                  options={ACCESS}
                  value={g.access}
                  size="basic"
                  disabled={g.locked}
                  onChange={(v) => setGrants((all) => all.map((x) => (x.id === g.id ? { ...x, access: v as Grant['access'] } : x)))}
                />
              </div>
              <Button
                className={styles.quiet}
                variant="tertiary"
                size="small"
                iconOnly
                icon="cross"
                iconPosition="leading"
                disabled={g.locked}
                onClick={() => setGrants((all) => all.filter((x) => x.id !== g.id))}
              >
                Remove {g.name}
              </Button>
            </div>
          ))}
        </div>

        <Horizontal gap={12} align="center" className={styles.link}>
          <Typography variant="body-normal">Anyone who already has access to {objectName} can use this link to view it</Typography>
          <Button variant="secondary" size="small" onClick={() => { navigator.clipboard?.writeText(window.location.href).catch(() => undefined); setCopied(true); }}>
            {copied ? 'Link copied' : 'Copy link'}
          </Button>
        </Horizontal>
      </Vertical>
    </Modal>
  );
};

export default ShareDialog;
