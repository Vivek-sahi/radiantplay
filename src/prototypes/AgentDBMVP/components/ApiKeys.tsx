import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, Button, Horizontal, Modal, ModalFooter, Table, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Person, ServiceAccount } from '../types';
import { CURRENT_USER, DATABASE, ENDPOINT_HOST, roleOf, SQL_PORT } from '../data';
import { keyPermission, useRole } from '../variant';
import { CopyField, Panel, StatusPill } from './primitives';
import styles from './pages.module.css';

const secret = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

/**
 * v2 · PM plan item 5: API keys. A key is created by a person and can do what that person can.
 * Admins see every key; everyone else sees the keys they created. One key per data source,
 * with a source label the user types (item 14).
 */
export const ApiKeys: React.FC<{
  keys: ServiceAccount[];
  people: Person[];
  onCreate: (k: ServiceAccount) => void;
  onUpdate: (k: ServiceAccount) => void;
  toast: (m: string) => void;
}> = ({ keys, people, onCreate, onUpdate, toast }) => {
  const role = useRole();
  const me = CURRENT_USER[role];
  const [creating, setCreating] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const [resetting, setResetting] = useState<ServiceAccount | null>(null);
  const [revoking, setRevoking] = useState<ServiceAccount | null>(null);
  const visible = role === 'Admin' ? keys : keys.filter((k) => k.createdBy === me);

  return (
    <>
      <Panel
        title={`API keys (${visible.length})`}
        flush
        actions={
          <Button variant="primary" size="small" icon="plus" onClick={() => setCreating(true)}>
            Create API key
          </Button>
        }
      >
        <Table
          rowKey="id"
          data={visible as unknown as Record<string, unknown>[]}
          emptyMessage="No keys yet"
          columns={[
            {
              key: 'name',
              label: 'Key',
              render: (_v, r) => {
                const k = r as unknown as ServiceAccount;
                return (
                  <Vertical gap={0}>
                    <Horizontal gap={spacing.B}>
                      <code className={styles.mono}>{k.name}</code>
                      {k.revoked && <StatusPill kind="failure" label="Revoked" />}
                    </Horizontal>
                    <Typography variant="footnote" color="gray-light" noMargin>
                      Created by {k.createdBy} · {roleOf(k.createdBy, people)} · {k.passwordSetAt}
                    </Typography>
                  </Vertical>
                );
              },
            },
            { key: 'sourceLabel', label: 'Source', render: (v) => (v ? String(v) : '—') },
            { key: 'createdBy', label: 'Can', render: (v) => keyPermission(roleOf(String(v), people)) },
            { key: 'lastUsed', label: 'Last used' },
            {
              key: 'id',
              label: '',
              width: '56px',
              render: (_v, r) => {
                const k = r as unknown as ServiceAccount;
                return (
                  <ActionMenu
                    key={`${k.id}-${menuKey}`}
                    placement="bottom-end"
                    trigger={
                      <Button variant="tertiary" size="small" icon="more" iconOnly aria-label={`Actions for ${k.name}`}>
                        Actions
                      </Button>
                    }
                  >
                    <ActionMenuItem
                      label={k.revoked ? 'Restore with a new secret' : 'Rotate secret'}
                      onClick={() => {
                        setResetting(k);
                        setMenuKey((n) => n + 1);
                      }}
                    />
                    {!k.revoked && (
                      <ActionMenuItem
                        label="Revoke"
                        onClick={() => {
                          setRevoking(k);
                          setMenuKey((n) => n + 1);
                        }}
                      />
                    )}
                  </ActionMenu>
                );
              },
            },
          ]}
        />
        <Typography variant="footnote" color="gray-light" noMargin className={styles.resultMeta}>
          {role === 'Admin' ? 'A key can do what the person who created it can do.' : 'You see the keys you created. Admins see every key.'}
        </Typography>
      </Panel>

      {creating && (
        <CreateKeyModal
          me={me}
          role={role}
          onClose={() => setCreating(false)}
          onCreate={(k) => onCreate(k)}
          toast={toast}
        />
      )}
      {resetting && (
        <RotateModal
          k={resetting}
          onClose={() => setResetting(null)}
          onDone={() => onUpdate({ ...resetting, revoked: false, passwordSetAt: 'Today' })}
          toast={toast}
        />
      )}
      {revoking && (
        <Modal
          isOpen
          onClose={() => setRevoking(null)}
          title={`Revoke ${revoking.name}?`}
          size="medium"
          footer={
            <ModalFooter
              secondaryAction={<Button variant="secondary" onClick={() => setRevoking(null)}>Cancel</Button>}
              primaryAction={
                <Button
                  variant="primary"
                  onClick={() => {
                    onUpdate({ ...revoking, revoked: true });
                    toast(`${revoking.name} revoked`);
                    setRevoking(null);
                  }}
                >
                  Revoke
                </Button>
              }
            />
          }
        >
          <Typography variant="body-normal" color="base" noMargin>
            The key stops working immediately. Anything using it, a pipeline, a BI tool or an agent, fails to connect until you
            give it a new secret.
          </Typography>
        </Modal>
      )}
    </>
  );
};

const CreateKeyModal: React.FC<{
  me: string;
  role: Person['role'];
  onClose: () => void;
  onCreate: (k: ServiceAccount) => void;
  toast: (m: string) => void;
}> = ({ me, role, onClose, onCreate, toast }) => {
  const [name, setName] = useState('');
  const [source, setSource] = useState('');
  const [created, setCreated] = useState<ServiceAccount | null>(null);
  const [value] = useState(secret);
  const permission = keyPermission(role);
  const valid = /^[a-z0-9-]{3,}$/.test(name);

  if (created) {
    return (
      <Modal
        isOpen
        onClose={onClose}
        title={`${created.name} is ready`}
        size="medium"
        footer={<ModalFooter primaryAction={<Button variant="primary" onClick={onClose}>Done</Button>} />}
      >
        <Vertical gap={spacing.D}>
          <Typography variant="body-normal" color="base" noMargin>
            Copy the secret now. It won&apos;t be shown again; you can rotate it later.
          </Typography>
          <Vertical gap={spacing.C}>
            <CopyField label="Host" value={ENDPOINT_HOST} onCopied={(l) => toast(`${l} copied`)} />
            <CopyField label="Port" value={SQL_PORT} onCopied={(l) => toast(`${l} copied`)} />
            <CopyField label="Database" value={DATABASE} onCopied={(l) => toast(`${l} copied`)} />
            <CopyField label="Key" value={created.name} onCopied={(l) => toast(`${l} copied`)} />
            <CopyField label="Secret" value={value} onCopied={(l) => toast(`${l} copied`)} />
          </Vertical>
        </Vertical>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create API key"
      size="medium"
      footer={
        <ModalFooter
          secondaryAction={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
          primaryAction={
            <Button
              variant="primary"
              disabled={!valid}
              onClick={() => {
                const k: ServiceAccount = {
                  id: `k_${Date.now()}`,
                  name,
                  kind: source.trim() ? 'pipeline' : 'app',
                  permission,
                  rateLimit: null,
                  lastUsed: 'Never',
                  createdBy: me,
                  passwordSetAt: 'Today',
                  sourceLabel: source.trim() || undefined,
                };
                onCreate(k);
                setCreated(k);
              }}
            >
              Create
            </Button>
          }
        />
      }
    >
      <Vertical gap={spacing.D}>
        <TextInput
          label="Name"
          placeholder="e.g. snowflake-sales"
          value={name}
          onChange={(e) => setName(e.target.value.toLowerCase())}
          error={name.length > 0 && !valid}
          errorMessage="Use at least 3 lowercase letters, numbers or hyphens"
        />
        <TextInput
          label="Source (optional)"
          placeholder="e.g. Snowflake"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <Typography variant="footnote" color="gray-light" noMargin>
          Set a source if a pipeline will write with this key; its tables show under that name. The key can {permission.toLowerCase()},
          the same as you ({role}).
        </Typography>
      </Vertical>
    </Modal>
  );
};

const RotateModal: React.FC<{ k: ServiceAccount; onClose: () => void; onDone: () => void; toast: (m: string) => void }> = ({
  k,
  onClose,
  onDone,
  toast,
}) => {
  const [value, setValue] = useState<string | null>(null);

  if (value) {
    return (
      <Modal
        isOpen
        onClose={onClose}
        title={`New secret for ${k.name}`}
        size="medium"
        footer={<ModalFooter primaryAction={<Button variant="primary" onClick={onClose}>Done</Button>} />}
      >
        <Vertical gap={spacing.D}>
          <Typography variant="body-normal" color="base" noMargin>
            Copy it now. It won&apos;t be shown again. Update the tool that uses {k.name}; the old secret no longer works.
          </Typography>
          <CopyField label="Secret" value={value} onCopied={(l) => toast(`${l} copied`)} />
        </Vertical>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={k.revoked ? `Restore ${k.name}?` : `Rotate the secret for ${k.name}?`}
      size="medium"
      footer={
        <ModalFooter
          secondaryAction={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
          primaryAction={
            <Button
              variant="primary"
              onClick={() => {
                setValue(secret());
                onDone();
              }}
            >
              {k.revoked ? 'Restore' : 'Rotate secret'}
            </Button>
          }
        />
      }
    >
      <Typography variant="body-normal" color="base" noMargin>
        {k.revoked
          ? 'A new secret is created and the key works again with it.'
          : 'The current secret stops working straight away. Anything using it fails to connect until you give it the new one.'}
      </Typography>
    </Modal>
  );
};
