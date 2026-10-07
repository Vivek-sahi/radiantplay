import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, Button, Horizontal, Modal, ModalFooter, Select, Table, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { IdentityKind, Permission, ServiceAccount } from '../types';
import { ENDPOINT_HOST, KIND_LABEL, SQL_PORT } from '../data';
import { CopyField, Panel, StatusPill } from './primitives';
import styles from './pages.module.css';

const KIND_OPTIONS = [
  { id: 'agent', label: 'Agent' },
  { id: 'app', label: 'App' },
  { id: 'pipeline', label: 'Pipeline' },
];
const PERMISSION_OPTIONS = [
  { id: 'Read', label: 'Read' },
  { id: 'Write', label: 'Write' },
  { id: 'Read & write', label: 'Read & write' },
];

/** Service accounts live under Connect (7 Oct): the credential is the connection. */
export const ServiceAccounts: React.FC<{
  accounts: ServiceAccount[];
  onCreate: (a: ServiceAccount) => void;
  onUpdate: (a: ServiceAccount) => void;
  toast: (m: string) => void;
}> = ({ accounts, onCreate, onUpdate, toast }) => {
  const [creating, setCreating] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const [resetting, setResetting] = useState<ServiceAccount | null>(null);
  const [revoking, setRevoking] = useState<ServiceAccount | null>(null);

  return (
    <>
      <Panel
        title={`Service accounts (${accounts.length})`}
        flush
        actions={
          <Button variant="primary" size="small" icon="plus" onClick={() => setCreating(true)}>
            Create service account
          </Button>
        }
      >
        <Table
          rowKey="id"
          data={accounts as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (_v, r) => {
                const a = r as unknown as ServiceAccount;
                return (
                  <Vertical gap={0}>
                    <Horizontal gap={spacing.B}>
                      <code className={styles.mono}>{a.name}</code>
                      {a.revoked && <StatusPill kind="failure" label="Revoked" />}
                    </Horizontal>
                    <Typography variant="footnote" color="gray-light" noMargin>
                      Created by {a.createdBy} · password set {a.passwordSetAt}
                    </Typography>
                  </Vertical>
                );
              },
            },
            { key: 'kind', label: 'Type', render: (v) => KIND_LABEL[v as IdentityKind] },
            { key: 'permission', label: 'Can' },
            { key: 'rateLimit', label: 'Rate limit', render: (v) => (v ? `${v} queries/s` : '—') },
            { key: 'lastUsed', label: 'Last used' },
            {
              key: 'id',
              label: '',
              width: '56px',
              render: (_v, r) => {
                const a = r as unknown as ServiceAccount;
                return (
                  <ActionMenu
                    key={`${a.id}-${menuKey}`}
                    placement="bottom-end"
                    trigger={
                      <Button variant="tertiary" size="small" icon="more" iconOnly aria-label={`Actions for ${a.name}`}>
                        Actions
                      </Button>
                    }
                  >
                    <ActionMenuItem
                      label={a.revoked ? 'Restore with a new password' : 'Reset password'}
                      onClick={() => {
                        setResetting(a);
                        setMenuKey((k) => k + 1);
                      }}
                    />
                    {!a.revoked && (
                      <ActionMenuItem
                        label="Revoke access"
                        onClick={() => {
                          setRevoking(a);
                          setMenuKey((k) => k + 1);
                        }}
                      />
                    )}
                  </ActionMenu>
                );
              },
            },
          ]}
        />
      </Panel>

      {resetting && (
        <ResetPasswordModal
          account={resetting}
          onClose={() => setResetting(null)}
          onDone={(a) => onUpdate({ ...a, revoked: false, passwordSetAt: 'Today' })}
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
                  Revoke access
                </Button>
              }
            />
          }
        >
          <Typography variant="body-normal" color="base" noMargin>
            Its password stops working immediately. Anything using it, such as a pipeline or an agent, will fail to connect until
            you set a new password and update that tool.
          </Typography>
        </Modal>
      )}
      {creating && <CreateAccountModal onClose={() => setCreating(false)} onCreate={onCreate} toast={toast} />}
    </>
  );
};

const CreateAccountModal: React.FC<{
  onClose: () => void;
  onCreate: (a: ServiceAccount) => void;
  toast: (m: string) => void;
}> = ({ onClose, onCreate, toast }) => {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<IdentityKind>('agent');
  const [permission, setPermission] = useState<Permission>('Read');
  const [rate, setRate] = useState('10');
  const [created, setCreated] = useState<ServiceAccount | null>(null);
  const [password] = useState(() => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10));

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
            Copy the password now. It won&apos;t be shown again; you can reset it later.
          </Typography>
          <Vertical gap={spacing.C}>
            <CopyField label="Host" value={ENDPOINT_HOST} onCopied={(l) => toast(`${l} copied`)} />
            <CopyField label="Port" value={SQL_PORT} onCopied={(l) => toast(`${l} copied`)} />
            <CopyField label="Username" value={created.name} onCopied={(l) => toast(`${l} copied`)} />
            <CopyField label="Password" value={password} onCopied={(l) => toast(`${l} copied`)} />
          </Vertical>
        </Vertical>
      </Modal>
    );
  }

  const valid = /^[a-z0-9-]{3,}$/.test(name);

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create service account"
      size="medium"
      footer={
        <ModalFooter
          secondaryAction={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
          primaryAction={
            <Button
              variant="primary"
              disabled={!valid}
              onClick={() => {
                const a: ServiceAccount = {
                  id: `s_${Date.now()}`,
                  name,
                  kind,
                  permission,
                  rateLimit: rate ? Number(rate) : null,
                  lastUsed: 'Never',
                  createdBy: 'Priya Nair',
                  passwordSetAt: 'Today',
                };
                onCreate(a);
                setCreated(a);
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
          placeholder="e.g. pricing-agent"
          value={name}
          onChange={(e) => setName(e.target.value.toLowerCase())}
          error={name.length > 0 && !valid}
          errorMessage="Use at least 3 lowercase letters, numbers or hyphens"
        />
        <Select label="What is it?" options={KIND_OPTIONS} value={kind} onChange={(v) => setKind(v as IdentityKind)} fullWidth />
        <Select label="It can" options={PERMISSION_OPTIONS} value={permission} onChange={(v) => setPermission(v as Permission)} fullWidth />
        <TextInput label="Rate limit (queries a second)" value={rate} onChange={(e) => setRate(e.target.value.replace(/\D/g, ''))} />
        <Typography variant="footnote" color="gray-light" noMargin>
          Queries over the limit are refused. Leave it empty for no limit.
        </Typography>
      </Vertical>
    </Modal>
  );
};

const ResetPasswordModal: React.FC<{
  account: ServiceAccount;
  onClose: () => void;
  onDone: (a: ServiceAccount) => void;
  toast: (m: string) => void;
}> = ({ account, onClose, onDone, toast }) => {
  const [password, setPassword] = useState<string | null>(null);

  if (password) {
    return (
      <Modal
        isOpen
        onClose={onClose}
        title={`New password for ${account.name}`}
        size="medium"
        footer={<ModalFooter primaryAction={<Button variant="primary" onClick={onClose}>Done</Button>} />}
      >
        <Vertical gap={spacing.D}>
          <Typography variant="body-normal" color="base" noMargin>
            Copy it now. It won&apos;t be shown again. Update the tool that uses {account.name}, since the old password no longer works.
          </Typography>
          <CopyField label="Password" value={password} onCopied={(l) => toast(`${l} copied`)} />
        </Vertical>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={account.revoked ? `Restore ${account.name}?` : `Reset the password for ${account.name}?`}
      size="medium"
      footer={
        <ModalFooter
          secondaryAction={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
          primaryAction={
            <Button
              variant="primary"
              onClick={() => {
                setPassword(Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10));
                onDone(account);
              }}
            >
              {account.revoked ? 'Restore' : 'Reset password'}
            </Button>
          }
        />
      }
    >
      <Typography variant="body-normal" color="base" noMargin>
        {account.revoked
          ? 'A new password is created and the account works again with it.'
          : 'The current password stops working straight away. Anything using it will fail to connect until you give it the new one.'}
      </Typography>
    </Modal>
  );
};
