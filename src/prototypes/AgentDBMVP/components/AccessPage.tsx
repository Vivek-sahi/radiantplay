import React, { useState } from 'react';
import { Avatar, Button, Horizontal, Modal, ModalFooter, Select, Table, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Person, Role } from '../types';
import { canManagePeople, useRole, useVariant } from '../variant';
import { CopyField, PageHeader, Panel } from './primitives';

const ROLE_OPTIONS = [
  { id: 'Admin', label: 'Admin' },
  { id: 'Editor', label: 'Editor' },
  { id: 'Viewer', label: 'Viewer' },
];

/**
 * Access is people only (7 Oct). Roles: Admin, Editor, Viewer.
 * v2 (PM plan item 3): basic username and password, no SSO, so an Admin adds a person and
 * hands over a temporary password shown once.
 */
export const AccessPage: React.FC<{ people: Person[]; onAddPerson: (p: Person) => void; toast: (m: string) => void }> = ({
  people,
  onAddPerson,
  toast,
}) => {
  const variant = useVariant();
  const role = useRole();
  const [adding, setAdding] = useState(false);
  const v2 = variant === 'v2';

  return (
    <Vertical gap={spacing.F}>
      <PageHeader
        title="Access"
        actions={
          v2 ? (
            canManagePeople(variant, role) ? (
              <Button variant="primary" icon="add-user" onClick={() => setAdding(true)}>
                Add person
              </Button>
            ) : undefined
          ) : (
            <Button variant="primary" icon="add-user" onClick={() => toast('Invite sent')}>
              Invite people
            </Button>
          )
        }
      />

      <Panel title={`People (${people.length})`} flush>
        <Table
          rowKey="id"
          data={people as unknown as Record<string, unknown>[]}
          columns={[
            {
              key: 'name',
              label: 'Name',
              render: (_v, r) => {
                const p = r as unknown as Person;
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

      {adding && <AddPersonModal onClose={() => setAdding(false)} onAdd={onAddPerson} toast={toast} />}
    </Vertical>
  );
};

const AddPersonModal: React.FC<{ onClose: () => void; onAdd: (p: Person) => void; toast: (m: string) => void }> = ({ onClose, onAdd, toast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Viewer');
  const [added, setAdded] = useState<Person | null>(null);
  const [password] = useState(() => Math.random().toString(36).slice(2, 8) + '-' + Math.random().toString(36).slice(2, 8));
  const valid = name.trim().length > 1 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  if (added) {
    return (
      <Modal
        isOpen
        onClose={onClose}
        title={`${added.name} is added`}
        size="medium"
        footer={<ModalFooter primaryAction={<Button variant="primary" onClick={onClose}>Done</Button>} />}
      >
        <Vertical gap={spacing.D}>
          <Typography variant="body-normal" color="base" noMargin>
            Share the temporary password with them. It is shown once; they set their own on first sign-in.
          </Typography>
          <Vertical gap={spacing.C}>
            <CopyField label="Username" value={added.email} onCopied={(l) => toast(`${l} copied`)} />
            <CopyField label="Temporary password" value={password} onCopied={(l) => toast(`${l} copied`)} />
          </Vertical>
        </Vertical>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add person"
      size="medium"
      footer={
        <ModalFooter
          secondaryAction={<Button variant="secondary" onClick={onClose}>Cancel</Button>}
          primaryAction={
            <Button
              variant="primary"
              disabled={!valid}
              onClick={() => {
                const p: Person = { id: `p_${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase(), role, lastActive: 'Never' };
                onAdd(p);
                setAdded(p);
              }}
            >
              Add
            </Button>
          }
        />
      }
    >
      <Vertical gap={spacing.D}>
        <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextInput label="Email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Select label="Role" options={ROLE_OPTIONS} value={role} onChange={(v) => setRole(v as Role)} fullWidth />
        <Typography variant="footnote" color="gray-light" noMargin>
          Admins manage people and see every key. Editors create and change tables. Viewers read. Each can create keys that do
          what they can.
        </Typography>
      </Vertical>
    </Modal>
  );
};
