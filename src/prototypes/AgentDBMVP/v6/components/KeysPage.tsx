import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, Button, Modal, ModalFooter, NoData, Select, Table, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Identity, IdentityType, Role, V3Page } from '../types';
import { PageHeader, StatusPill } from '../../components/primitives';
import { when } from '../data';
import { generateSecret, SecretModal } from './SecretModal';
import { COL } from '../layout';
import styles from '../v6.module.css';

const NAME_RE = /^[a-z][a-z0-9-]{2,39}$/;
const EXPIRY = [
  { id: 'never', label: 'Never' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
  { id: '365', label: '1 year' },
];
const expiresOn = (days: string): string | undefined => {
  if (days === 'never') return undefined;
  const d = new Date(2026, 9, 14 + Number(days));
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** What a key can do. Query: read, for BI tools, apps and agents. Query and load: read and write, for pipelines (Vivek, 26 Oct). */
const ACCESS: { id: IdentityType; label: string }[] = [
  { id: 'Query', label: 'Query' },
  { id: 'Ingest', label: 'Query and load' },
];
const accessLabel = (t: IdentityType) => ACCESS.find((a) => a.id === t)?.label ?? t;

type Dialog = null | { kind: 'create' } | { kind: 'rotate'; key: Identity } | { kind: 'revoke'; key: Identity } | { kind: 'secret'; name: string; secret: string; title: string };

/**
 * API keys: every machine credential, at account level (Vivek, 26 Oct). Service accounts merged in:
 * a key can query, or query and load. Create, rotate, revoke, last used.
 * Editors and Admins create them (Harviish, 14 Oct). Instructions live in Connect, not here.
 */
export const KeysPage: React.FC<{
  keys: Identity[];
  role: Role;
  me: string;
  onCreate: (name: string, type: IdentityType, expires?: string, secret?: string) => void;
  onUpdate: (id: string, patch: Partial<Identity>) => void;
  onNavigate: (p: V3Page) => void;
  toast: (m: string) => void;
}> = ({ keys, role, onCreate, onUpdate, toast }) => {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState('never');
  const [access, setAccess] = useState<IdentityType>('Query');
  const [menuKey, setMenuKey] = useState(0);
  const canManage = role !== 'Viewer';
  const trimmed = name.trim();
  const nameError = trimmed && !NAME_RE.test(trimmed) ? 'Lowercase letters, numbers and hyphens, 3 to 40 characters' : keys.some((k) => k.name === trimmed) ? 'A key with this name exists' : '';

  const create = () => {
    const secret = generateSecret('adb_');
    onCreate(trimmed, access, expiresOn(expiry), secret);
    setDialog({ kind: 'secret', name: trimmed, secret, title: 'API key created' });
  };

  const createButton = (
    <Button
      variant="primary"
      icon="plus"
      onClick={() => {
        setName('');
        setExpiry('never');
        setAccess('Query');
        setDialog({ kind: 'create' });
      }}
    >
      Create API key
    </Button>
  );

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="API keys" actions={canManage && keys.length ? createButton : undefined} />

      {keys.length === 0 ? (
          <div className={styles.empty}>
            <NoData
              title="No API keys yet"
              action={canManage ? createButton : undefined}
            />
          </div>
      ) : (
          <Table
            rowKey="id"
            data={keys as unknown as Record<string, unknown>[]}
            columns={[
              {
                key: 'name',
                label: 'Key',
                render: (v, r) => (
                  <Vertical gap={0}>
                    <span>{String(v)}</span>
                    {(r as unknown as Identity).revoked && (
                      <span>
                        <StatusPill kind="failure" label="Revoked" />
                      </span>
                    )}
                  </Vertical>
                ),
              },
              { key: 'type', label: 'Access', width: COL.xl, render: (v) => accessLabel(v as IdentityType) },
              { key: 'createdBy', label: 'Created by' },
              { key: 'createdOn', label: 'Created', render: (v) => when(String(v)) },
              { key: 'expires', label: 'Expires', render: (v) => (v ? when(String(v)) : 'Never') },
              { key: 'lastUsed', label: 'Last used', render: (v) => when(String(v)) },
              ...(canManage
                ? [
                    {
                      key: 'id',
                      label: '',
                      width: COL.xs,
                      render: (_v: unknown, r: Record<string, unknown>) => {
                        const k = r as unknown as Identity;
                        return (
                          <ActionMenu
                            key={`${k.id}-${menuKey}`}
                            placement="bottom-end"
                            trigger={
                              <Button variant="tertiary" size="small" icon="more" iconOnly aria-label={`Actions for ${k.name}`}>
                                More
                              </Button>
                            }
                          >
                            {!k.revoked && (
                              <ActionMenuItem
                                label="Rotate secret"
                                onClick={() => {
                                  setDialog({ kind: 'rotate', key: k });
                                  setMenuKey((n) => n + 1);
                                }}
                              />
                            )}
                            {k.revoked ? (
                              <ActionMenuItem
                                label="Restore"
                                onClick={() => {
                                  onUpdate(k.id, { revoked: false });
                                  toast(`${k.name} restored`);
                                  setMenuKey((n) => n + 1);
                                }}
                              />
                            ) : (
                              <ActionMenuItem
                                label="Revoke"
                                destructive
                                onClick={() => {
                                  setDialog({ kind: 'revoke', key: k });
                                  setMenuKey((n) => n + 1);
                                }}
                              />
                            )}
                          </ActionMenu>
                        );
                      },
                    },
                  ]
                : []),
            ]}
          />
      )}

      {dialog?.kind === 'create' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title="Create API key"
          size="medium"
          footer={
            <ModalFooter
              secondaryAction={
                <Button variant="secondary" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
              }
              primaryAction={
                <Button variant="primary" disabled={!trimmed || !!nameError} onClick={create}>
                  Create key
                </Button>
              }
            />
          }
        >
          <Vertical gap={spacing.D} className={styles.selectRoom}>
            <TextInput label="Name" placeholder="airflow-events" value={name} onChange={(e) => setName(e.target.value.toLowerCase())} error={!!nameError} errorMessage={nameError} />
            <Select label="Access" options={ACCESS} value={access} onChange={(v) => setAccess(v as IdentityType)} fullWidth />
            <Select label="Expires" options={EXPIRY} value={expiry} onChange={(v) => setExpiry(v)} fullWidth />
          </Vertical>
        </Modal>
      )}

      {dialog?.kind === 'rotate' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title={`Rotate the secret for ${dialog.key.name}?`}
          size="medium"
          footer={
            <ModalFooter
              secondaryAction={
                <Button variant="secondary" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
              }
              primaryAction={
                <Button
                  variant="primary"
                  onClick={() => {
                    const secret = generateSecret('adb_');
                    onUpdate(dialog.key.id, { createdOn: 'Today', secret });
                    setDialog({ kind: 'secret', name: dialog.key.name, secret, title: 'New secret' });
                  }}
                >
                  Rotate secret
                </Button>
              }
            />
          }
        >
          <Typography variant="body-normal" color="base" noMargin>
            The old secret stops working at once.
          </Typography>
        </Modal>
      )}

      {dialog?.kind === 'revoke' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title={`Revoke ${dialog.key.name}?`}
          size="medium"
          footer={
            <ModalFooter
              secondaryAction={
                <Button variant="secondary" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
              }
              primaryAction={
                <Button
                  variant="primary"
                  onClick={() => {
                    onUpdate(dialog.key.id, { revoked: true });
                    toast(`${dialog.key.name} revoked`);
                    setDialog(null);
                  }}
                >
                  Revoke key
                </Button>
              }
            />
          }
        >
          <Typography variant="body-normal" color="base" noMargin>
            The key stops working at once. It can be restored.
          </Typography>
        </Modal>
      )}

      {dialog?.kind === 'secret' && <SecretModal title={dialog.title} name={dialog.name} secret={dialog.secret} what="secret" onDone={() => setDialog(null)} />}
    </Vertical>
  );
};
