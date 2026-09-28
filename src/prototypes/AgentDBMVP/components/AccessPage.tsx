import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, Avatar, Button, Horizontal, Modal, ModalFooter, ProgressBar, Select, Table, Tabs, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { IdentityKind, Permission, ServiceAccount } from '../types';
import { ENDPOINT_HOST, formatUSD, KIND_LABEL, PEOPLE, SQL_PORT } from '../data';
import { CopyField, PageHeader, Panel, StatusPill } from './primitives';
import { useVariant } from '../variant';
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

const BudgetCell: React.FC<{ a: ServiceAccount }> = ({ a }) => {
  if (!a.budget) {
    return (
      <Typography variant="body-normal" color="gray-light" noMargin>
        {formatUSD(a.spent)} · no limit
      </Typography>
    );
  }
  const ratio = a.spent / a.budget;
  return (
    <Vertical gap={spacing.A} className={styles.barCell}>
      <Horizontal gap={spacing.B} justify="space-between">
        <span className={styles.num}>
          {formatUSD(a.spent)} of {formatUSD(a.budget)}
        </span>
        {ratio >= 0.9 && <StatusPill kind="warning" label={`${Math.round(ratio * 100)}%`} />}
      </Horizontal>
      <ProgressBar value={a.spent} max={a.budget} size="small" color={ratio >= 0.9 ? 'yellow' : 'blue'} />
    </Vertical>
  );
};

export const AccessPage: React.FC<{
  accounts: ServiceAccount[];
  onCreate: (a: ServiceAccount) => void;
  onUpdate: (a: ServiceAccount) => void;
  toast: (m: string) => void;
}> = ({ accounts, onCreate, onUpdate, toast }) => {
  const [tab, setTab] = useState('accounts');
  const [creating, setCreating] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const [resetting, setResetting] = useState<ServiceAccount | null>(null);
  const [revoking, setRevoking] = useState<ServiceAccount | null>(null);
  const variant = useVariant();

  return (
    <Vertical gap={spacing.F}>
      <PageHeader
        title="Access"
        subtitle={`People sign in with ${variant === 'v1' ? 'ThoughtSpot' : 'single sign-on'}. Tools, pipelines and agents each get their own service account.`}
        actions={
          tab === 'accounts' ? (
            <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
              Create service account
            </Button>
          ) : (
            variant === 'v1' ? (
              <Button variant="secondary" icon="navigate" onClick={() => toast('Opens user management in ThoughtSpot')}>
                Manage people in ThoughtSpot
              </Button>
            ) : (
              <Button variant="primary" icon="add-user" onClick={() => toast('Invite sent')}>
                Invite people
              </Button>
            )
          )
        }
      />
      <Tabs
        tabs={[
          { id: 'accounts', label: `Service accounts (${accounts.length})` },
          { id: 'people', label: `People (${PEOPLE.length})` },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      {tab === 'accounts' ? (
        <Panel title="Service accounts" flush>
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
                        {a.managed ? 'Managed by ThoughtSpot' : `Created by ${a.createdBy} · password set ${a.passwordSetAt}`}
                      </Typography>
                    </Vertical>
                  );
                },
              },
              { key: 'kind', label: 'Type', render: (v) => KIND_LABEL[v as IdentityKind] },
              { key: 'permission', label: 'Can' },
              { key: 'budget', label: 'Monthly budget', width: '26%', render: (_v, r) => <BudgetCell a={r as unknown as ServiceAccount} /> },
              { key: 'rateLimit', label: 'Rate limit', render: (v) => (v ? `${v} queries/s` : '—') },
              { key: 'lastUsed', label: 'Last used' },
              {
                key: 'id',
                label: '',
                width: '56px',
                render: (_v, r) => {
                  const a = r as unknown as ServiceAccount;
                  if (a.managed) return null;
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
      ) : (
        <Panel title="People" flush>
          <Table
            rowKey="id"
            data={PEOPLE as unknown as Record<string, unknown>[]}
            columns={[
              {
                key: 'name',
                label: 'Name',
                render: (_v, r) => {
                  const p = r as unknown as (typeof PEOPLE)[number];
                  return (
                    <Horizontal gap={spacing.C}>
                      <Avatar name={p.name} size="s" />
                      <Vertical gap={0}>
                        <Typography variant="body-normal" color="base" noMargin>{p.name}</Typography>
                        <Typography variant="footnote" color="gray-light" noMargin>{p.email}</Typography>
                      </Vertical>
                    </Horizontal>
                  );
                },
              },
              { key: 'role', label: 'Role' },
              { key: 'lastActive', label: 'Last active' },
            ]}
          />
        </Panel>
      )}

      {resetting && (
        <ResetPasswordModal
          account={resetting}
          onClose={() => setResetting(null)}
          onDone={(a) => {
            onUpdate({ ...a, revoked: false, passwordSetAt: 'Today' });
          }}
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
      {creating && (
        <CreateAccountModal
          onClose={() => setCreating(false)}
          onCreate={(a) => onCreate(a)}
          toast={toast}
        />
      )}
    </Vertical>
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
  const [budget, setBudget] = useState('100');
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
                  budget: budget ? Number(budget) : null,
                  spent: 0,
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
        <Horizontal gap={spacing.D} align="start">
          <div className={styles.grow}>
            <TextInput label="Monthly budget (USD)" value={budget} onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className={styles.grow}>
            <TextInput label="Rate limit (queries a second)" value={rate} onChange={(e) => setRate(e.target.value.replace(/\D/g, ''))} />
          </div>
        </Horizontal>
        <Typography variant="footnote" color="gray-light" noMargin>
          When it reaches its budget, its queries are refused until next month or until you raise the limit. Leave a field
          empty for no limit.
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
