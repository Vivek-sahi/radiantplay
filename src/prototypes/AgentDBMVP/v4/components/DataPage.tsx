import React, { useEffect, useMemo, useState } from 'react';
import { Button, Horizontal, Icon, NoData, SearchInput, Table, Tree, Typography, Vertical } from '@/components';
import type { IconName } from '@/components';
import type { TreeNode } from '@/components/Tree/Tree';
import { spacing } from '@tokens/spacing';
import { Database, DbObject, Identity, LoadRecord, ObjectKind, Role } from '../types';
import { formatGB, formatRows, KIND_LABEL, when } from '../data';
import { PageHeader } from '../../components/primitives';
import { Strip } from './Strip';
import { ObjectPage } from './ObjectPage';
import styles from '../v4.module.css';

export const KIND_ICON: Record<ObjectKind, IconName> = { table: 'table', view: 'formula', 'materialized view': 'collection' };

interface Props {
  databases: Database[];
  objects: DbObject[];
  loads: LoadRecord[];
  identities: Identity[];
  queries24h: string;
  selection: string;
  onSelect: (id: string) => void;
  role: Role;
  onOpenSql: (database: string, sql?: string) => void;
  onDeleteDatabase: (id: string) => void;
  onEmptyObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
  toast: (m: string) => void;
}

/**
 * Data: the catalog, in the Databricks shape (PM, 14 Oct). Three figures in one line on top,
 * Harviish's homepage metrics: storage used, tables, queries (figures only, no status sentence,
 * no plan limit, no database count, no loads: Vivek, 15 Oct). Then the browser: a tree of the
 * databases and their objects, and the pane showing whatever is selected. There is no account
 * above the databases (Vivek, 15 Oct).
 */
export const DataPage: React.FC<Props> = (props) => {
  const { databases, objects, queries24h, selection, onSelect } = props;
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<string[]>(() => databases.map((d) => `db:${d.id}`));
  const query = q.trim().toLowerCase();

  // Selecting an object from elsewhere (SQL, a database page) opens its branch.
  useEffect(() => {
    if (selection.startsWith('obj:')) {
      const o = objects.find((x) => `obj:${x.id}` === selection);
      if (o) setExpanded((prev) => (prev.includes(`db:${o.database}`) ? prev : [...prev, `db:${o.database}`]));
    }
  }, [selection, objects]);

  const nodes: TreeNode[] = useMemo(
    () =>
      databases.map((d) => ({
        id: `db:${d.id}`,
        label: d.name,
        icon: <Icon name="database" size="s" aria-hidden />,
        children: objects
          .filter((o) => o.database === d.id && (!query || o.name.includes(query)))
          .map((o) => ({ id: `obj:${o.id}`, label: o.name, icon: <Icon name={KIND_ICON[o.kind]} size="s" aria-hidden /> })),
      })),
    [databases, objects, query],
  );
  const expandedIds = query ? databases.map((d) => `db:${d.id}`) : expanded;
  const toggle = (id: string) => setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const db = selection.startsWith('db:') ? databases.find((d) => `db:${d.id}` === selection) : undefined;
  const obj = selection.startsWith('obj:') ? objects.find((o) => `obj:${o.id}` === selection) : undefined;
  const objDb = obj ? databases.find((d) => d.id === obj.database) : undefined;

  const tables = objects.filter((o) => o.kind === 'table');
  const used = objects.reduce((s, o) => s + o.sizeGB, 0);

  return (
    <Vertical gap={spacing.F} className={styles.page}>
      <PageHeader title="Data" />
      <Strip
        figures={[
          { value: used ? formatGB(used) : '0 GB', label: 'used' },
          { value: String(tables.length), label: tables.length === 1 ? 'table' : 'tables' },
          { value: queries24h, label: 'queries, 24 h' },
        ]}
      />
      <div className={styles.catalog}>
        <aside className={styles.rail} aria-label="Catalog">
          <SearchInput placeholder="Search tables" value={q} onChange={(e) => setQ(e.target.value)} />
          <Tree nodes={nodes} selectedIds={[selection]} expandedIds={expandedIds} onSelect={onSelect} onExpand={toggle} />
        </aside>
        <div className={styles.pane}>
          {obj && objDb && <Crumbs items={[{ label: objDb.name, onClick: () => onSelect(`db:${objDb.id}`) }, { label: obj.name }]} />}
          {obj && objDb ? (
            <ObjectPage
              object={obj}
              database={objDb}
              loads={props.loads.filter((l) => l.database === obj.database && l.table === obj.name)}
              identities={props.identities}
              role={props.role}
              onOpenSql={props.onOpenSql}
              onEmpty={() => props.onEmptyObject(obj.id)}
              onDelete={() => {
                props.onDeleteObject(obj.id);
                onSelect(`db:${objDb.id}`);
              }}
              toast={props.toast}
            />
          ) : db ? (
            <DatabaseView db={db} {...props} />
          ) : (
            <div className={styles.empty}>
              <NoData title="No databases" />
            </div>
          )}
        </div>
      </div>
    </Vertical>
  );
};

/** Where you are in the catalog. The last item is the page itself. */
const Crumbs: React.FC<{ items: { label: string; onClick?: () => void }[] }> = ({ items }) => (
  <div className={styles.crumbs}>
    {items.map((it, i) => (
      <React.Fragment key={it.label + i}>
        {i > 0 && (
          <Typography variant="footnote" color="gray-light" noMargin>
            /
          </Typography>
        )}
        {it.onClick ? (
          <Button variant="tertiary" size="small" onClick={it.onClick}>
            {it.label}
          </Button>
        ) : (
          <Typography variant="footnote" color="gray-light" noMargin>
            {it.label}
          </Typography>
        )}
      </React.Fragment>
    ))}
  </div>
);

/** One database: its objects, with search. Freshness beside the name (principle 8). No delete: databases are allocated in the backend (Vivek, 20 Oct). */
const DatabaseView: React.FC<Props & { db: Database }> = ({ db, objects, role, onSelect, onOpenSql }) => {
  const [q, setQ] = useState('');
  const objs = objects.filter((o) => o.database === db.id);
  const count = (k: ObjectKind) => objs.filter((o) => o.kind === k).length;
  const size = objs.reduce((s, o) => s + o.sizeGB, 0);
  const facts = [
    `${count('table')} ${count('table') === 1 ? 'table' : 'tables'}`,
    count('view') ? `${count('view')} ${count('view') === 1 ? 'view' : 'views'}` : '',
    count('materialized view') ? `${count('materialized view')} materialised ${count('materialized view') === 1 ? 'view' : 'views'}` : '',
    size ? formatGB(size) : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const rows = objs.filter((o) => o.name.includes(q.trim().toLowerCase())).sort((a, b) => b.sizeGB - a.sizeGB);

  return (
    <>
      <Vertical gap={spacing.A}>
        <Horizontal justify="space-between" align="center" gap={spacing.D}>
          <Typography variant="modal-title" color="base" noMargin>
            {db.name}
          </Typography>
        </Horizontal>
        {objs.length > 0 && (
          <Typography variant="body-normal" color="gray-light" noMargin>
            {facts}
          </Typography>
        )}
      </Vertical>

      {objs.length === 0 ? (
        <div className={styles.empty}>
          <NoData
            title="No tables yet"
            description={role === 'Viewer' ? 'Created in SQL by an Editor.' : 'Create one in SQL.'}
            action={
              <Button variant="primary" icon="formula" onClick={() => onOpenSql(db.id)}>
                Open SQL
              </Button>
            }
          />
        </div>
      ) : (
        <Vertical gap={spacing.C}>
          <div className={styles.search}>
            <SearchInput placeholder="Search in this database" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Table
            compact
            hoverable
            rowKey="id"
            onRowClick={(r) => onSelect(`obj:${String(r.id)}`)}
            data={rows as unknown as Record<string, unknown>[]}
            emptyMessage="No objects match"
            columns={[
              {
                key: 'name',
                label: 'Name',
                render: (v, r) => (
                  <span className={styles.nameCell}>
                    <Icon name={KIND_ICON[(r as unknown as DbObject).kind]} size="s" aria-hidden />
                    <Typography variant="content-label-subhead" color="accent" noMargin>
                      {String(v)}
                    </Typography>
                  </span>
                ),
              },
              { key: 'kind', label: 'Kind', render: (v) => KIND_LABEL[v as ObjectKind] },
              { key: 'lastUpdated', label: 'Last updated', render: (v) => when(String(v)) },
              { key: 'rows', label: 'Rows', render: (v, r) => ((r as unknown as DbObject).kind === 'view' ? '—' : (v as number) ? formatRows(v as number) : '0') },
              { key: 'sizeGB', label: 'Size', render: (v, r) => ((r as unknown as DbObject).kind === 'view' || !(v as number) ? '—' : formatGB(v as number)) },
            ]}
          />
        </Vertical>
      )}
    </>
  );
};
