import React, { useState } from 'react';
import { Button, Icon, NoData, SearchBar, Select, Table, Typography, Vertical } from '@/components';
import type { IconName } from '@/components';
import { spacing } from '@tokens/spacing';
import { Database, DbObject, Identity, LoadRecord, ObjectKind, Role, V3Page } from '../types';
import { formatGB, formatRows, KIND_LABEL, NOW_MIN, when } from '../data';
import { PageHeader } from '../../components/primitives';
import { Metric } from './Metric';
import { ObjectPage } from './ObjectPage';
import styles from '../v6.module.css';

/** The grid for every kind for now; views and materialised views get their own icons later (Vivek, 20 Oct). */
export const KIND_ICON: Record<ObjectKind, IconName> = {
  table: 'table',
  view: 'table',
  'materialized view': 'table',
};

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
  onNavigate: (p: V3Page) => void;
  onOpenIngestion: (database: string, table: string) => void;
}

const ALL = 'all';

/**
 * Data: the data objects page (Vivek, 26 Oct). Three tiles on top (tiles again, Vivek 26 Oct), Harviish's
 * homepage metrics: storage used, tables, queries (Vivek, 15 Oct). Then one list of every table,
 * view and materialised view, filtered by database and searched by name. The catalog tree and the
 * page per database are gone; the catalog lives in SQL now. Opening an object replaces the list,
 * with a back arrow beside its name; the filter and search are kept.
 */
export const DataPage: React.FC<Props> = (props) => {
  const { databases, objects, queries24h, selection, onSelect, role, onOpenSql } = props;
  const [q, setQ] = useState('');
  const [dbFilter, setDbFilter] = useState(ALL);
  const query = q.trim().toLowerCase();

  const obj = selection.startsWith('obj:') ? objects.find((o) => `obj:${o.id}` === selection) : undefined;
  const objDb = obj ? databases.find((d) => d.id === obj.database) : undefined;

  const tables = objects.filter((o) => o.kind === 'table');
  const used = objects.reduce((s, o) => s + o.sizeGB, 0);
  const all = dbFilter === ALL;
  // Newest first: the question this page answers most is "did my load land" (Vivek, 26 Oct).
  const rows = objects.filter((o) => (all || o.database === dbFilter) && o.name.toLowerCase().includes(query)).sort((a, b) => recency(a.lastUpdated) - recency(b.lastUpdated));
  const dbName = (id: string) => databases.find((d) => d.id === id)?.name ?? id;
  const firstDb = all ? databases[0]?.id : dbFilter;

  if (obj && objDb) {
    return (
      <Vertical gap={spacing.F} className={styles.page}>
        <ObjectPage
          object={obj}
          database={objDb}
          loads={props.loads.filter((l) => l.database === obj.database && l.table === obj.name)}
          identities={props.identities}
          role={role}
          onBack={() => onSelect('')}
          onLoad={() => props.onOpenIngestion(obj.database, obj.name)}
          onEmpty={() => props.onEmptyObject(obj.id)}
          onDelete={() => {
            props.onDeleteObject(obj.id);
            onSelect('');
          }}
          toast={props.toast}
        />
      </Vertical>
    );
  }

  return (
    <Vertical gap={spacing.F} className={styles.page}>
      <PageHeader title="Overview" />
      <div className={styles.tiles}>
        <Metric label="Storage" value={used ? formatGB(used) : '0 GB'} />
        <Metric label="Tables" value={String(tables.length)} note={`In ${databases.length} ${databases.length === 1 ? 'database' : 'databases'}`} />
        {/* Seeing the queries is a job of its own: the tile links there (Vivek, 27 Oct). */}
        <Metric label="Queries" value={queries24h} note="Last 24 hours" link={{ label: 'View queries', onClick: () => props.onNavigate('activity') }} />
      </div>
      {databases.length === 0 ? (
        <div className={styles.empty}>
          <NoData title="No databases" />
        </div>
      ) : (
        <Vertical gap={spacing.C}>
          <div className={styles.filters}>
            <div className={styles.search}>
              <Select
                aria-label="Database"
                options={[{ id: ALL, label: 'All databases' }, ...databases.map((d) => ({ id: d.id, label: d.name }))]}
                value={dbFilter}
                onChange={(v) => setDbFilter(v)}
                fullWidth
              />
            </div>
            <div className={styles.search}>
              <SearchBar size="md" placeholder="Search by name" value={q} onChange={setQ} onClear={() => setQ('')} />
            </div>
          </div>
          {rows.length === 0 && !query ? (
            <div className={styles.empty}>
              <NoData
                title="No tables yet"
                description={role === 'Viewer' ? 'Created in SQL by an Editor.' : 'Create one in SQL.'}
                action={
                  firstDb && (
                    <Button variant="primary" icon="formula" onClick={() => onOpenSql(firstDb)}>
                      Open SQL
                    </Button>
                  )
                }
              />
            </div>
          ) : (
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
                  width: '28%',
                  render: (v, r) => (
                    <span className={styles.nameCell}>
                      <Icon name={KIND_ICON[(r as unknown as DbObject).kind]} size="s" aria-hidden />
                      <Typography variant="content-label-subhead" color="accent" noMargin>
                        {String(v)}
                      </Typography>
                    </span>
                  ),
                },
                {
                  key: 'kind',
                  label: 'Kind',
                  width: '16%',
                  render: (v) => KIND_LABEL[v as ObjectKind],
                },
                // Edge to edge, widths in proportion so searching doesn't reflow the columns (Vivek, 26 Oct).
                // Database only when more than one database is in the list.
                ...(all
                  ? [
                      {
                        key: 'database',
                        label: 'Database',
                        width: '16%',
                        render: (v: unknown) => dbName(String(v)),
                      },
                    ]
                  : []),
                {
                  key: 'rows',
                  label: 'Rows',
                  width: '11%',
                  render: (v, r) => ((r as unknown as DbObject).kind === 'view' ? '—' : (v as number) ? formatRows(v as number) : '0'),
                },
                {
                  key: 'sizeGB',
                  label: 'Size',
                  width: '11%',
                  render: (v, r) => ((r as unknown as DbObject).kind === 'view' || !(v as number) ? '—' : formatGB(v as number)),
                },
                {
                  key: 'lastUpdated',
                  label: 'Last updated',
                  width: '18%',
                  render: (v) => when(String(v)),
                },
              ]}
            />
          )}
        </Vertical>
      )}
    </Vertical>
  );
};

/** Minutes since the last change, for sorting newest first. Nothing arrived ('—') sorts last. */
const recency = (t: string): number => {
  if (t === 'Just now' || t === 'Today') return 0;
  const ago = t.match(/^(\d+) min ago$/);
  if (ago) return Number(ago[1]);
  const day = t.match(/^(Today|Yesterday), (\d{2}):(\d{2})$/);
  if (day) return NOW_MIN - (Number(day[2]) * 60 + Number(day[3])) + (day[1] === 'Yesterday' ? 1440 : 0);
  return Infinity;
};
