/**
 * Connections — modelled on ThoughtSpot's real Connections page.
 *
 * Columns from the product: Source · Connection & configuration name · Tags ·
 * CSV Data upload · Policy · Modified · Author · overflow. The reference
 * screenshots came from a white-labelled tenant, so their palette is ignored —
 * structure and information design carry over, colour comes from Radiant.
 *
 * Connections are few (a handful of warehouses, ever), which is why elsewhere
 * they are a filter rather than a grouping.
 */
import React, { useState } from 'react';
import {
  Typography, Button, SearchInput, Table, Link, ActionMenu, ActionMenuItem,
} from '@/components';
import type { TableColumn } from '@/components';
import type { Connection } from './storeTypes';
import { ConnectorMark } from './ConnectorMark';
import { AuthorCell, TagCell } from './storePrimitives';
import styles from './store.module.css';

export const StoreConnectionsView: React.FC<{
  connections: Connection[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  /** Hidden when the page already carries a header of its own. */
  showHeader?: boolean;
}> = ({ connections, onOpen, onCreate, showHeader = true }) => {
  const [query, setQuery] = useState('');
  const rows = connections.filter((cn) => cn.name.toLowerCase().includes(query.toLowerCase()));

  const columns: TableColumn<Connection>[] = [
    {
      key: 'source', label: 'Source', width: '170px',
      render: (_v, row) => <ConnectorMark source={row.source} label={row.sourceName} />,
    },
    {
      key: 'name', label: 'Connection & configuration name', minWidth: '250px',
      render: (_v, row) => <Link onClick={() => onOpen(row.id)}>{row.name}</Link>,
    },
    { key: 'tags', label: 'Tags', width: '130px', render: (_v, row) => <TagCell tags={row.tags} /> },
    { key: 'tableCount', label: 'Tables', width: '90px', align: 'right' },
    { key: 'csvUpload', label: 'CSV Data upload', width: '140px' },
    { key: 'policy', label: 'Policy', width: '100px' },
    { key: 'modified', label: 'Modified', width: '130px' },
    { key: 'author', label: 'Author', minWidth: '170px', render: (_v, row) => <AuthorCell name={row.author} /> },
    {
      key: 'actions', label: '', width: '52px', align: 'right',
      render: (_v, row) => (
        <span className={styles.rowActions}>
          <ActionMenu
            placement="bottom-end"
            trigger={<Button variant="tertiary" size="small" icon="more" iconOnly aria-label="More">More</Button>}
          >
            <ActionMenuItem label="Manage tables" onClick={() => onOpen(row.id)} />
            <ActionMenuItem label="Edit connection" onClick={() => onOpen(row.id)} />
            <ActionMenuItem label="Delete" destructive onClick={() => {}} />
          </ActionMenu>
        </span>
      ),
    },
  ];

  return (
    <div className={styles.subPage}>
      {showHeader ? (
        <div className={styles.head}>
          <div className={styles.headText}>
            <Typography variant="page-title" noMargin>Connections</Typography>
          </div>
          <Button variant="primary" onClick={onCreate}>Create connection</Button>
        </div>
      ) : null}

      <div className={styles.bar}>
        <div className={styles.search}>
          <SearchInput placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {showHeader ? null : (
          <Button variant="secondary" onClick={onCreate}>Create connection</Button>
        )}
      </div>

      <div className={styles.card}>
        <Table
          columns={columns as unknown as TableColumn[]}
          data={rows as unknown as Record<string, unknown>[]}
          rowKey="id"
          hoverable
          selectable
          emptyMessage="No connections match your search."
        />
        <div className={styles.footer}>
          <Typography variant="footnote" color="gray-light" noMargin>Showing 1–{rows.length}</Typography>
        </div>
      </div>
    </div>
  );
};
