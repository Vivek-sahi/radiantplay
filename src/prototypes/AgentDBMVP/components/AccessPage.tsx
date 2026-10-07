import React from 'react';
import { Avatar, Button, Horizontal, Table, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { PEOPLE } from '../data';
import { PageHeader, Panel } from './primitives';

/** Access is people only (7 Oct). Service accounts moved to Connect. Roles: Admin, Editor, Viewer. */
export const AccessPage: React.FC<{ toast: (m: string) => void }> = ({ toast }) => {
  return (
    <Vertical gap={spacing.F}>
      <PageHeader
        title="Access"
        actions={
          <Button variant="primary" icon="add-user" onClick={() => toast('Invite sent')}>
            Invite people
          </Button>
        }
      />

      <Panel title={`People (${PEOPLE.length})`} flush>
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
    </Vertical>
  );
};
