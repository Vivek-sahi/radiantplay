import React, { useMemo, useState } from 'react';
import { ActionMenu, ActionMenuItem, Button, Horizontal, Modal, ModalFooter, NoData, Table, Tabs, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { Database, DbObject, Identity, LoadRecord, Role } from '../types';
import { createSqlFor, formatGB, formatMs, formatRows, KIND_LABEL, logTime, sampleValue, when } from '../data';
import { StatusPill } from '../../components/primitives';
import { GoToIcon } from './GoToIcon';
import { CodeBlock } from './CopyField';
import styles from '../v5.module.css';

type Dialog = null | 'empty' | 'delete';

const baseOf = (o: DbObject): string => o.definition?.match(/\bfrom\s+([`\w.]+)/i)?.[1] ?? 'a table';

/**
 * One table, view or materialised view. Columns · Sample data · Details · History (tables).
 * Actions: Load data (opens Connect › Ingestion with this table ticked: Vivek, 27 Oct), Empty, Delete.
 * No Open in SQL (Vivek, 26 Oct).
 */
export const ObjectPage: React.FC<{
  object: DbObject;
  database: Database;
  loads: LoadRecord[];
  identities: Identity[];
  role: Role;
  onEmpty: () => void;
  onDelete: () => void;
  toast: (m: string) => void;
  /** Back to the Data list. A plain arrow beside the name, no breadcrumb (Vivek, 26 Oct). */
  onBack?: () => void;
  onLoad?: () => void;
}> = ({ onBack, onLoad, object: o, database: db, loads, role, onEmpty, onDelete, toast }) => {
  const [tab, setTab] = useState('columns');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [typed, setTyped] = useState('');
  const [menuKey, setMenuKey] = useState(0);

  const isTable = o.kind === 'table';
  const canChange = role !== 'Viewer';
  const hasData = o.kind === 'view' || o.rows > 0;
  const kindLabel = KIND_LABEL[o.kind].toLowerCase();

  const sampleRows = useMemo(
    () =>
      hasData
        ? Array.from({ length: 100 }, (_, r) => Object.fromEntries([['_i', String(r)], ...o.columns.map((c) => [c.name, sampleValue(c.type, c.name, r)])]))
        : [],
    [o, hasData],
  );

  // The database leads the facts line now that the breadcrumb is gone (Vivek, 26 Oct).
  const facts = `${db.name} · ` + (isTable
    ? o.rows
      ? `${formatRows(o.rows)} rows · ${formatGB(o.sizeGB)} · last updated ${when(o.lastUpdated)}`
      : 'No rows yet.'
    : o.kind === 'view'
      ? `View · built from ${baseOf(o)} · stores nothing`
      : `Materialised view · ${formatRows(o.rows)} rows · ${formatGB(o.sizeGB)} · refreshes ${o.refresh?.toLowerCase()} · last refreshed ${when(o.lastUpdated)}`);

  const tabs = [
    { id: 'columns', label: `Columns (${o.columns.length})` },
    { id: 'sample', label: 'Sample data' },
    { id: 'info', label: 'Info' },
    { id: 'sql', label: 'SQL' },
    ...(isTable ? [{ id: 'history', label: `History (${loads.length})` }] : []),
  ];

  const copy = (text: string, what: string) => {
    navigator.clipboard?.writeText(text).catch(() => undefined);
    toast(`${what} copied`);
  };

  const loadButton = (
    <Button variant="secondary" icon={<GoToIcon />} iconPosition="trailing" onClick={() => onLoad?.()}>
      Load instructions
    </Button>
  );

  return (
    <>
      <Vertical gap={spacing.C}>
        <Horizontal justify="space-between" align="start" gap={spacing.D} wrap>
          <Vertical gap={spacing.A}>
            <Horizontal gap={spacing.B} align="center">
              {onBack && <Button variant="tertiary" icon="arrow-left" iconOnly aria-label="Back to Overview" onClick={onBack}>Back to Overview</Button>}
              <Typography variant="modal-title" color="base" noMargin>
                {o.name}
              </Typography>
            </Horizontal>
            <Typography variant="body-normal" color="gray-light" noMargin>
              {facts}
            </Typography>
          </Vertical>
          <Horizontal gap={spacing.B}>
            {isTable && canChange && loadButton}
            {canChange && (
              <ActionMenu
                key={menuKey}
                placement="bottom-end"
                trigger={
                  <Button variant="secondary" icon="more" iconOnly aria-label="More actions">
                    More
                  </Button>
                }
              >
                {isTable && o.rows > 0 && (
                  <ActionMenuItem
                    label="Empty table"
                    onClick={() => {
                      setDialog('empty');
                      setMenuKey((k) => k + 1);
                    }}
                  />
                )}
                <ActionMenuItem
                  label={`Delete ${kindLabel}`}
                  destructive
                  onClick={() => {
                    setTyped('');
                    setDialog('delete');
                    setMenuKey((k) => k + 1);
                  }}
                />
              </ActionMenu>
            )}
          </Horizontal>
        </Horizontal>
      </Vertical>

      <Vertical gap={spacing.D}>
          <Tabs tabs={tabs} activeTab={tab} onTabChange={setTab} />

          {tab === 'columns' && (
            <Table
              compact
              rowKey="name"
              data={o.columns as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'name', label: 'Column' },
                { key: 'type', label: 'Type' },
              ]}
            />
          )}

          {tab === 'sample' &&
            (hasData ? (
              <Vertical gap={spacing.B}>
                <Typography variant="footnote" color="gray-light" noMargin>
                  First 100 rows
                </Typography>
                <div className={styles.scroll}>
                  <Table compact data={sampleRows} rowKey="_i" columns={o.columns.map((c) => ({ key: c.name, label: c.name }))} />
                </div>
              </Vertical>
            ) : (
              <div className={styles.empty}>
                <NoData title="No rows yet" action={canChange ? loadButton : undefined} />
              </div>
            ))}

          {tab === 'info' && (
            <div className={styles.infoList}>
              {[
                ['Kind', KIND_LABEL[o.kind]],
                ['Database', db.name],
                ['Created by', o.createdBy],
                ['Created', when(o.createdOn)],
                ...(o.kind !== 'view' ? [['Rows', o.rows ? formatRows(o.rows) : '0'], ['Size', o.sizeGB ? formatGB(o.sizeGB) : '—']] : []),
                [o.kind === 'materialized view' ? 'Last refreshed' : 'Last updated', when(o.lastUpdated)],
                ...(o.kind === 'materialized view' ? [['Refresh', o.refresh ?? '—']] : []),
                ...(o.kind !== 'table' ? [['Built from', baseOf(o)]] : []),
              ].map(([label, value]) => (
                <div key={label} className={styles.fact}>
                  <Typography variant="body-normal" color="gray-light" noMargin className={styles.factLabel}>
                    {label}
                  </Typography>
                  <Typography variant="body-normal" color="base" noMargin className={styles.factValue}>
                    {value}
                  </Typography>
                </div>
              ))}
            </div>
          )}

          {tab === 'sql' && (
            <Vertical gap={spacing.B}>
              <Horizontal justify="space-between" align="center" className={styles.infoList}>
                <Typography variant="body-normal" color="gray-light" noMargin>
                  The statement that created this {kindLabel}.
                </Typography>
                <Button variant="secondary" size="small" icon="copy" onClick={() => copy(createSqlFor(o), 'SQL')}>
                  Copy
                </Button>
              </Horizontal>
              <CodeBlock>{createSqlFor(o)}</CodeBlock>
            </Vertical>
          )}

          {tab === 'history' &&
            (loads.length ? (
              <Table
                compact
                rowKey="id"
                data={loads as unknown as Record<string, unknown>[]}
                columns={[
                  { key: 'time', label: 'Time', render: (v) => logTime(String(v)) },
                  { key: 'identity', label: 'Identity' },
                  { key: 'rows', label: 'Rows', render: (v) => <span className={styles.num}>{(v as number) ? formatRows(v as number) : '0'}</span> },
                  { key: 'bytes', label: 'Bytes' },
                  { key: 'durationMs', label: 'Duration', render: (v) => formatMs(v as number) },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (_v, r) => {
                      const l = r as unknown as LoadRecord;
                      return (
                        <Vertical gap={spacing.A}>
                          <span>
                            <StatusPill kind={l.status === 'Completed' ? 'success' : 'failure'} label={l.status} />
                          </span>
                          {l.error && (
                            <Typography variant="body-normal" color="gray-light" noMargin>
                              {l.error}
                            </Typography>
                          )}
                        </Vertical>
                      );
                    },
                  },
                ]}
              />
            ) : (
              <div className={styles.empty}>
                <NoData title="No loads yet" action={canChange ? loadButton : undefined} />
              </div>
            ))}
      </Vertical>

      {dialog === 'empty' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title={`Empty ${o.name}?`}
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
                    onEmpty();
                    setDialog(null);
                  }}
                >
                  Empty table
                </Button>
              }
            />
          }
        >
          <Vertical gap={spacing.C}>
            <Typography variant="body-normal" color="base" noMargin>
              Removes {formatRows(o.rows)} rows and frees {formatGB(o.sizeGB)}. The table and its columns stay. Can&apos;t be undone.
            </Typography>
          </Vertical>
        </Modal>
      )}

      {dialog === 'delete' && (
        <Modal
          isOpen
          onClose={() => setDialog(null)}
          title={`Delete ${o.name}?`}
          size="medium"
          footer={
            <ModalFooter
              secondaryAction={
                <Button variant="secondary" onClick={() => setDialog(null)}>
                  Cancel
                </Button>
              }
              primaryAction={
                <Button variant="primary" disabled={typed !== o.name} onClick={onDelete}>
                  Delete {kindLabel}
                </Button>
              }
            />
          }
        >
          <Vertical gap={spacing.D}>
            {isTable && o.rows > 0 ? (
              <Typography variant="body-normal" color="base" noMargin>
                Removes {formatRows(o.rows)} rows and frees {formatGB(o.sizeGB)}. Can&apos;t be undone.
              </Typography>
            ) : o.kind === 'table' ? (
              <Typography variant="body-normal" color="base" noMargin>
                The table is empty. No data is lost.
              </Typography>
            ) : (
              <Typography variant="body-normal" color="base" noMargin>
                The tables it is built from are not touched.
              </Typography>
            )}
            <TextInput label={`Type ${o.name} to confirm`} value={typed} onChange={(e) => setTyped(e.target.value)} />
          </Vertical>
        </Modal>
      )}
    </>
  );
};
