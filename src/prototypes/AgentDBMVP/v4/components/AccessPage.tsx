import React, { useState } from 'react';
import { ActionMenu, ActionMenuItem, Button, Modal, ModalFooter, NoData, Select, Table, Tabs, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Person } from '../../types';
import { Identity, Role } from '../types';
import { PageHeader, StatusPill } from '../../components/primitives';
import { when } from '../data';
import { generateSecret, SecretModal } from './SecretModal';
import { COL } from '../layout';
import styles from '../v4.module.css';

const ROLE_OPTIONS = [
  { id: 'Viewer', label: 'Viewer' },
  { id: 'Editor', label: 'Editor' },
  { id: 'Admin', label: 'Admin' },
];
const NAME_RE = /^[a-z][a-z0-9-]{2,39}$/;

type Dialog =
  | null
  | { kind: 'addPerson' }
  | { kind: 'removePerson'; person: Person }
  | { kind: 'editRole'; person: Person }
  | { kind: 'createAccount' }
  | { kind: 'revokeAccount'; account: Identity }
  | { kind: 'secret'; name: string; secret: string; title: string; what: 'password' | 'secret' };

/**
 * Access: who may do what. People with roles, and service accounts, because to the database
 * both are users. Admin only for changes (Harviish, 14 Oct). Two tabs, no roles reference (Vivek, 15 Oct):
 * the three fixed roles stay on each person, the table explaining them is gone.
 */
export const AccessPage: React.FC<{
  people: Person[];
  accounts: Identity[];
  role: Role;
  me: string;
  onAddPerson: (p: Person) => void;
  onUpdatePerson: (id: string, patch: Partial<Person>) => void;
  onRemovePerson: (id: string) => void;
  onCreateAccount: (name: string) => void;
  onUpdateAccount: (id: string, patch: Partial<Identity>) => void;
  toast: (m: string) => void;
}> = ({ people, accounts, role, me, onAddPerson, onUpdatePerson, onRemovePerson, onCreateAccount, onUpdateAccount, toast }) => {
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pRole, setPRole] = useState<Role>('Viewer');
  const [aName, setAName] = useState('');
  const [menuKey, setMenuKey] = useState(0);
  const [tab, setTab] = useState('people');
  const isAdmin = role === 'Admin';

  const emailError = pEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(pEmail.trim()) ? 'Enter a full email address' : people.some((p) => p.email === pEmail.trim()) ? 'This person already has access' : '';
  const aTrim = aName.trim();
  const aError = aTrim && !NAME_RE.test(aTrim) ? 'Lowercase letters, numbers and hyphens, 3 to 40 characters' : accounts.some((a) => a.name === aTrim) ? 'An account with this name exists' : '';

  const bump = () => setMenuKey((n) => n + 1);

  const addPersonButton = (
    <Button
      variant="primary"
      icon="add-user"
      onClick={() => {
        setPName('');
        setPEmail('');
        setPRole('Viewer');
        setDialog({ kind: 'addPerson' });
      }}
    >
      Add person
    </Button>
  );
  const createAccountButton = (
    <Button
      variant="secondary"
      icon="plus"
      onClick={() => {
        setAName('');
        setDialog({ kind: 'createAccount' });
      }}
    >
      Create service account
    </Button>
  );

  return (
    <Vertical gap={spacing.F}>
      <PageHeader title="Access" actions={isAdmin ? (tab === 'people' ? addPersonButton : accounts.length ? createAccountButton : undefined) : undefined} />
      <Tabs
        tabs={[
          { id: 'people', label: 'People' },
          { id: 'accounts', label: 'Service accounts' },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />

      {tab === 'people' && (
        <Table
          rowKey="id"
          data={people as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (v, r) => (
                <Vertical gap={0}>
                  <Typography variant="body-normal" color="base" noMargin>
                    {String(v)}
                    {String(v) === me ? ' (you)' : ''}
                  </Typography>
                  <Typography variant="footnote" color="gray-light" noMargin>
                    {String((r as unknown as Person).email)}
                  </Typography>
                </Vertical>
              ),
            },
            {
              key: 'role',
              label: 'Role',
              width: COL.xl,
            },
            { key: 'lastActive', label: 'Last active' },
            ...(isAdmin
              ? [
                  {
                    key: 'id',
                    label: '',
                    width: COL.xs,
                    render: (_v: unknown, r: Record<string, unknown>) => {
                      const p = r as unknown as Person;
                      if (p.name === me) return null;
                      return (
                        <ActionMenu
                          key={`${p.id}-${menuKey}`}
                          placement="bottom-end"
                          trigger={
                            <Button variant="tertiary" size="small" icon="more" iconOnly aria-label={`Actions for ${p.name}`}>
                              More
                            </Button>
                          }
                        >
                          <ActionMenuItem
                            label="Edit role"
                            onClick={() => {
                              setPRole(p.role);
                              setDialog({ kind: 'editRole', person: p });
                              bump();
                            }}
                          />
                          <ActionMenuItem
                            label="Reset password"
                            onClick={() => {
                              toast(`Sign-in email sent to ${p.email}`);
                              bump();
                            }}
                          />
                          <ActionMenuItem
                            label="Remove"
                            destructive
                            onClick={() => {
                              setDialog({ kind: 'removePerson', person: p });
                              bump();
                            }}
                          />
                        </ActionMenu>
                      );
                    },
                  },
                ]
              : []),
          ]}
        />
      )}

      {tab === 'accounts' && (accounts.length === 0 ? (
          <div className={styles.empty}>
            <NoData
              title="No service accounts yet"
              action={isAdmin ? createAccountButton : undefined}
            />
          </div>
      ) : (
          <Table
            rowKey="id"
            data={accounts as unknown as Record<string, unknown>[]}
            columns={[
              {
                key: 'name',
                label: 'Account',
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
              { key: 'createdBy', label: 'Created by' },
              { key: 'createdOn', label: 'Created', render: (v) => when(String(v)) },
              { key: 'lastUsed', label: 'Last used', render: (v) => when(String(v)) },
              ...(isAdmin
                ? [
                    {
                      key: 'id',
                      label: '',
                      width: COL.xs,
                      render: (_v: unknown, r: Record<string, unknown>) => {
                        const a = r as unknown as Identity;
                        return (
                          <ActionMenu
                            key={`${a.id}-${menuKey}`}
                            placement="bottom-end"
                            trigger={
                              <Button variant="tertiary" size="small" icon="more" iconOnly aria-label={`Actions for ${a.name}`}>
                                More
                              </Button>
                            }
                          >
                            {!a.revoked && (
                              <ActionMenuItem
                                label="Reset password"
                                onClick={() => {
                                  onUpdateAccount(a.id, { createdOn: 'Today' });
                                  setDialog({ kind: 'secret', name: a.name, secret: generateSecret(), title: 'New password', what: 'password' });
                                  bump();
                                }}
                              />
                            )}
                            {a.revoked ? (
                              <ActionMenuItem
                                label="Restore"
                                onClick={() => {
                                  onUpdateAccount(a.id, { revoked: false });
                                  toast(`${a.name} restored`);
                                  bump();
                                }}
                              />
                            ) : (
                              <ActionMenuItem
                                label="Revoke"
                                destructive
                                onClick={() => {
                                  setDialog({ kind: 'revokeAccount', account: a });
                                  bump();
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
      ))}

      {dialog?.kind === 'addPerson' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title="Add person"
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
                  disabled={!pName.trim() || !pEmail.trim() || !!emailError}
                  onClick={() => {
                    onAddPerson({ id: `p_${Date.now()}`, name: pName.trim(), email: pEmail.trim(), role: pRole, lastActive: 'Invited' });
                    toast(`Invitation sent to ${pEmail.trim()}`);
                    setDialog(null);
                  }}
                >
                  Send invitation
                </Button>
              }
            />
          }
        >
          <Vertical gap={spacing.D} className={styles.selectRoom}>
            <TextInput label="Name" value={pName} onChange={(e) => setPName(e.target.value)} />
            <TextInput label="Email" value={pEmail} onChange={(e) => setPEmail(e.target.value)} error={!!emailError} errorMessage={emailError} />
            <Select label="Role" options={ROLE_OPTIONS} value={pRole} onChange={(v) => setPRole(v as Role)} fullWidth />
          </Vertical>
        </Modal>
      )}

      {dialog?.kind === 'editRole' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title={`Edit role for ${dialog.person.name}`}
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
                  disabled={pRole === dialog.person.role}
                  onClick={() => {
                    onUpdatePerson(dialog.person.id, { role: pRole });
                    toast(`${dialog.person.name} is now ${pRole === 'Admin' ? 'an' : 'a'} ${pRole}`);
                    setDialog(null);
                  }}
                >
                  Save
                </Button>
              }
            />
          }
        >
          <div className={styles.selectRoom}>
            <Select label="Role" options={ROLE_OPTIONS} value={pRole} onChange={(v) => setPRole(v as Role)} fullWidth />
          </div>
        </Modal>
      )}

      {dialog?.kind === 'removePerson' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title={`Remove ${dialog.person.name}?`}
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
                    onRemovePerson(dialog.person.id);
                    toast(`${dialog.person.name} removed`);
                    setDialog(null);
                  }}
                >
                  Remove
                </Button>
              }
            />
          }
        >
          <Vertical gap={spacing.C}>
            <Typography variant="body-normal" color="base" noMargin>
              Their sign-in stops at once. Identities they created keep working.
            </Typography>
          </Vertical>
        </Modal>
      )}

      {dialog?.kind === 'createAccount' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title="Create service account"
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
                  disabled={!aTrim || !!aError}
                  onClick={() => {
                    onCreateAccount(aTrim);
                    setDialog({ kind: 'secret', name: aTrim, secret: generateSecret(), title: 'Service account created', what: 'password' });
                  }}
                >
                  Create account
                </Button>
              }
            />
          }
        >
          <Vertical gap={spacing.D}>
            <TextInput label="Name" placeholder="thoughtspot" value={aName} onChange={(e) => setAName(e.target.value.toLowerCase())} error={!!aError} errorMessage={aError} />
          </Vertical>
        </Modal>
      )}

      {dialog?.kind === 'revokeAccount' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title={`Revoke ${dialog.account.name}?`}
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
                    onUpdateAccount(dialog.account.id, { revoked: true });
                    toast(`${dialog.account.name} revoked`);
                    setDialog(null);
                  }}
                >
                  Revoke account
                </Button>
              }
            />
          }
        >
          <Typography variant="body-normal" color="base" noMargin>
            The account stops working at once. It can be restored.
          </Typography>
        </Modal>
      )}

      {dialog?.kind === 'secret' && <SecretModal title={dialog.title} name={dialog.name} secret={dialog.secret} what={dialog.what} onDone={() => setDialog(null)} />}
    </Vertical>
  );
};
