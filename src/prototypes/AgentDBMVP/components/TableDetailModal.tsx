import React, { useMemo, useState } from 'react';
import { Button, Horizontal, Modal, ModalFooter, Select, Table, Tabs, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { StoreTable, TableColumn } from '../types';
import { formatGB, formatRows, rowBehaviour } from '../data';
import { PLAIN_TYPES, PlainType, WIDENS_TO } from '../tableSchema';
import { KeyValue, StatusPill } from './primitives';
import styles from './pages.module.css';

const NAME_RE = /^[a-z][a-z0-9_]*$/;
const TYPE_OPTIONS = PLAIN_TYPES.map((t) => ({ id: t.id, label: t.id }));

/** Deterministic sample values for the preview, by type. */
const sampleValue = (col: TableColumn, row: number, table: StoreTable): string => {
  if (col.addedLater && row < 100) return '';
  const n = (row * 7919 + col.name.length * 31) % 9973;
  switch (col.type) {
    case 'Whole number':
    case 'Big whole number':
      return col.isKey ? String(88410000 + row) : String(n % 20000);
    case 'Decimal':
    case 'High-precision decimal':
      return ((n % 250000) / 100).toFixed(2);
    case 'Date':
      return `2026-09-${String(28 - (row % 27)).padStart(2, '0')}`;
    case 'Date and time':
      return `2026-09-${String(28 - (row % 27)).padStart(2, '0')} ${String(n % 24).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
    case 'True or false':
      return n % 3 ? 'true' : 'false';
    default: {
      const words: Record<string, string[]> = {
        region: ['West', 'South', 'North', 'East'],
        channel: ['Web', 'Store', 'App'],
        status: ['open', 'closed', 'pending'],
        currency: ['usd', 'eur', 'inr'],
      };
      const list = words[col.name] ?? [`${table.name}_${col.name}_${n % 97}`];
      return list[row % list.length];
    }
  }
};

type Draft = { id: string; name: string; type: PlainType; original?: TableColumn };

type Confirm = null | 'delete' | 'empty' | 'blocked-delete' | 'blocked-empty' | 'review';

export const TableDetailModal: React.FC<{
  table: StoreTable;
  onClose: () => void;
  onDelete: (t: StoreTable) => void;
  onUpdate: (t: StoreTable, message: string) => void;
  toast: (m: string) => void;
}> = ({ table: t, onClose, onDelete, onUpdate, toast }) => {
  const [tab, setTab] = useState('columns');
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [typed, setTyped] = useState('');
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const isPulse = t.writer.kind === 'pulse';
  const fullName = `${t.database}.${t.name}`;

  const startEdit = () => {
    setDrafts(t.columns.map((c, i) => ({ id: `c${i}`, name: c.name, type: c.type as PlainType, original: c })));
    setEditing(true);
  };

  const changes = useMemo(() => {
    const out: { kind: 'add' | 'rename' | 'widen'; text: string }[] = [];
    drafts.forEach((d) => {
      if (!d.original) {
        if (d.name.trim()) out.push({ kind: 'add', text: `Add ${d.name} (${d.type}) — empty for existing rows` });
        return;
      }
      if (d.name !== d.original.name) out.push({ kind: 'rename', text: `Rename ${d.original.name} to ${d.name}` });
      if (d.type !== d.original.type) out.push({ kind: 'widen', text: `${d.name}: ${WIDENS_TO[d.original.type as PlainType]?.label.toLowerCase()} (${d.original.type} → ${d.type})` });
    });
    return out;
  }, [drafts]);

  const draftNames = drafts.map((d) => d.name.trim()).filter(Boolean);
  const draftError = draftNames.some((n) => !NAME_RE.test(n))
    ? 'Column names use lowercase letters, numbers and underscores'
    : new Set(draftNames).size !== draftNames.length
      ? 'Two columns have the same name'
      : '';

  const applyChanges = () => {
    const widened = drafts.filter((d) => d.original && d.type !== d.original.type).map((d) => d.name);
    const columns: TableColumn[] = drafts
      .filter((d) => d.name.trim())
      .map((d) =>
        d.original
          ? { ...d.original, name: d.name, type: d.type, updating: widened.includes(d.name) }
          : { name: d.name, type: d.type, addedLater: !t.empty },
      );
    onUpdate({ ...t, columns }, `${changes.length} ${changes.length === 1 ? 'change' : 'changes'} saved`);
    setEditing(false);
    setConfirm(null);
    // PRD Req 3: widening takes a moment on big tables; "Updating" is the only status shown.
    if (widened.length) {
      window.setTimeout(() => onUpdate({ ...t, columns: columns.map((c) => ({ ...c, updating: false })) }, 'Column type updated'), 5000);
    }
  };

  const previewRows = useMemo(
    () =>
      t.empty
        ? []
        : Array.from({ length: 100 }, (_, r) =>
            Object.fromEntries([['_i', String(r)], ...t.columns.map((c) => [c.name, sampleValue(c, r, t)])]),
          ),
    [t],
  );

  // ---------- confirmations ----------
  if (confirm === 'blocked-delete' || confirm === 'blocked-empty') {
    return (
      <Modal
        isOpen
        onClose={() => setConfirm(null)}
        title="A load is arriving"
        size="medium"
        footer={<ModalFooter primaryAction={<Button variant="primary" onClick={() => setConfirm(null)}>OK</Button>} />}
      >
        <Typography variant="body-normal" color="base" noMargin>
          {t.writer.label} is loading data into {fullName} right now. You can {confirm === 'blocked-delete' ? 'delete' : 'empty'} the
          table once the load finishes.
        </Typography>
      </Modal>
    );
  }

  if (confirm === 'delete') {
    return (
      <Modal
        isOpen
        onClose={() => setConfirm(null)}
        title={`Delete ${fullName}?`}
        size="medium"
        footer={
          <ModalFooter
            secondaryAction={<Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>}
            primaryAction={
              <Button variant="primary" disabled={typed !== t.name} onClick={() => onDelete(t)}>
                Delete table
              </Button>
            }
          />
        }
      >
        <Vertical gap={spacing.D}>
          {t.empty ? (
            <Typography variant="body-normal" color="base" noMargin>
              The table is empty, so no data is lost. Anything set up to load into it will fail until it&apos;s created again.
            </Typography>
          ) : (
            <Vertical gap={spacing.C}>
              <Typography variant="body-normal" color="base" noMargin>
                This is the only copy of this data. Deleting it removes {formatRows(t.rows)} rows and frees {formatGB(t.sizeGB)}.
              </Typography>
              <Typography variant="body-normal" color="gray-light" noMargin>
                If {t.writer.label} is still set up to write here, its next load will fail. Turn off the job in {t.writer.label}{' '}
                first.
              </Typography>
            </Vertical>
          )}
          <TextInput label={`Type ${t.name} to confirm`} value={typed} onChange={(e) => setTyped(e.target.value)} />
        </Vertical>
      </Modal>
    );
  }

  if (confirm === 'empty') {
    return (
      <Modal
        isOpen
        onClose={() => setConfirm(null)}
        title={`Empty ${fullName}?`}
        size="medium"
        footer={
          <ModalFooter
            secondaryAction={<Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>}
            primaryAction={
              <Button
                variant="primary"
                onClick={() => {
                  onUpdate({ ...t, rows: 0, sizeGB: 0, empty: true, lastArrived: '—', late: undefined }, `${fullName} emptied`);
                  setConfirm(null);
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
            All {formatRows(t.rows)} rows are removed and {formatGB(t.sizeGB)} is freed. The table and its columns stay, so your
            pipeline can load into it again.
          </Typography>
          <Typography variant="body-normal" color="gray-light" noMargin>
            This is the only copy of the data. It can&apos;t be undone.
          </Typography>
        </Vertical>
      </Modal>
    );
  }

  if (confirm === 'review') {
    return (
      <Modal
        isOpen
        onClose={() => setConfirm(null)}
        title="Save column changes?"
        size="medium"
        footer={
          <ModalFooter
            secondaryAction={<Button variant="secondary" onClick={() => setConfirm(null)}>Back</Button>}
            primaryAction={<Button variant="primary" onClick={applyChanges}>Save changes</Button>}
          />
        }
      >
        <Vertical gap={spacing.C}>
          {changes.map((c) => (
            <Typography key={c.text} variant="body-normal" color="base" noMargin>
              • {c.text}
            </Typography>
          ))}
          <Typography variant="footnote" color="gray-light" noMargin>
            Make the same change in {t.writer.label === 'Not loaded yet' ? 'your pipeline' : t.writer.label} so its next load
            matches. Changing a type can take a few minutes on large tables.
          </Typography>
        </Vertical>
      </Modal>
    );
  }

  // ---------- main ----------
  const footer = (
    <ModalFooter
      secondaryAction={
        isPulse ? undefined : (
          <Horizontal gap={spacing.B}>
            <Button variant="tertiary" icon="trash-can" onClick={() => { setTyped(''); setConfirm(t.loading ? 'blocked-delete' : 'delete'); }}>
              Delete table
            </Button>
            {!t.empty && (
              <Button variant="tertiary" icon="reset" onClick={() => setConfirm(t.loading ? 'blocked-empty' : 'empty')}>
                Empty table
              </Button>
            )}
          </Horizontal>
        )
      }
      primaryAction={
        <Horizontal gap={spacing.B}>
          <Button variant="secondary" icon="formula" onClick={() => toast(`Opened ${fullName} in the SQL editor`)}>
            Query in SQL editor
          </Button>
          <Button variant="primary" onClick={onClose}>Done</Button>
        </Horizontal>
      }
    />
  );

  return (
    <Modal isOpen onClose={onClose} eyebrow={t.database} title={t.name} size="large" footer={footer}>
      <Vertical gap={spacing.D}>
        {isPulse ? (
          <div className={styles.note}>
            <Typography variant="body-normal" color="base" noMargin>
              Managed by Pulse. ThoughtSpot refreshes this table on the <b>{t.writer.detail}</b> model&apos;s schedule and rebuilds
              it from your warehouse if it&apos;s removed. To change or stop caching, open the model&apos;s Caching tab in ThoughtSpot.
            </Typography>
          </div>
        ) : t.empty ? (
          <div className={styles.note}>
            <Typography variant="body-normal" color="base" noMargin>
              This table is empty. Point your pipeline at <b>{fullName}</b> using a service account with write access, and rows
              will appear after its next load.
            </Typography>
          </div>
        ) : (
          <div className={styles.note}>
            <Horizontal gap={spacing.B} align="center" wrap>
              {t.loading && <StatusPill kind="info" label="Load arriving" />}
              <Typography variant="body-normal" color="base" noMargin>
                Written by <b>{t.writer.label}</b> ({t.writer.detail}). AgentDB shows when data arrives; the job itself is scheduled
                and managed in {t.writer.label}.
              </Typography>
            </Horizontal>
          </div>
        )}

        <div className={styles.facts}>
          <KeyValue label="Rows">{t.empty ? '0' : formatRows(t.rows)}</KeyValue>
          <KeyValue label="Size">{t.empty ? '—' : formatGB(t.sizeGB)}</KeyValue>
          <KeyValue label="Last data arrived">
            <Horizontal gap={spacing.B}>
              <span>{t.lastArrived}</span>
              {t.late && <StatusPill kind="warning" label={`Late · usually ${t.late.usual}`} />}
            </Horizontal>
          </KeyValue>
          {t.nextRefresh && <KeyValue label="Next refresh">{t.nextRefresh}</KeyValue>}
          <KeyValue label="How rows arrive">
            <Vertical gap={0}>
              <span>{rowBehaviour(t)}</span>
              <Typography variant="footnote" color="gray-light" noMargin>
                Set when the table was created. It can&apos;t be changed.
              </Typography>
            </Vertical>
          </KeyValue>
          <KeyValue label="Split by date">{t.splitBy ? `By month, on ${t.splitBy}` : 'No'}</KeyValue>
          <KeyValue label="Who can read it">
            {isPulse ? 'ThoughtSpot only (cached model data)' : 'Admins, Editors, and 4 service accounts'}
          </KeyValue>
        </div>

        <Horizontal justify="space-between" align="end">
          <Tabs
            tabs={[
              { id: 'columns', label: `Columns (${t.columns.length})` },
              { id: 'preview', label: 'Preview' },
            ]}
            activeTab={tab}
            onTabChange={(id) => {
              setTab(id);
              setEditing(false);
            }}
          />
          {tab === 'columns' && !isPulse && !editing && (
            <Button variant="secondary" size="small" icon="pencil" onClick={startEdit}>
              Edit columns
            </Button>
          )}
        </Horizontal>

        {tab === 'columns' && !editing && (
          <Table
            compact
            rowKey="name"
            data={t.columns as unknown as Record<string, unknown>[]}
            columns={[
              {
                key: 'name',
                label: 'Column',
                render: (v, r) => {
                  const c = r as unknown as TableColumn;
                  return (
                    <Horizontal gap={spacing.B}>
                      <code className={styles.mono}>{String(v)}</code>
                      {c.addedLater && <StatusPill kind="neutral" label="Empty for existing rows" />}
                    </Horizontal>
                  );
                },
              },
              {
                key: 'type',
                label: 'Type',
                render: (v, r) => (
                  <Horizontal gap={spacing.B}>
                    <span>{String(v)}</span>
                    {(r as unknown as TableColumn).updating && <StatusPill kind="info" label="Updating" />}
                  </Horizontal>
                ),
              },
              { key: 'isKey', label: 'Identifies a row', render: (v) => (v ? 'Yes' : '') },
            ]}
          />
        )}

        {tab === 'columns' && editing && (
          <Vertical gap={spacing.B}>
            {drafts.map((d, i) => {
              const widen = d.original ? WIDENS_TO[d.original.type as PlainType] : undefined;
              const locked = d.original?.isKey;
              return (
                <Horizontal key={d.id} gap={spacing.C} align="center">
                  <div className={styles.grow}>
                    <TextInput
                      label={`Column ${i + 1}`}
                      showLabel={false}
                      value={d.name}
                      placeholder="New column name"
                      onChange={(e) => setDrafts((ds) => ds.map((x) => (x.id === d.id ? { ...x, name: e.target.value.toLowerCase() } : x)))}
                    />
                  </div>
                  <div className={styles.typeCell}>
                    {!d.original ? (
                      <Select
                        options={TYPE_OPTIONS}
                        value={d.type}
                        onChange={(v) => setDrafts((ds) => ds.map((x) => (x.id === d.id ? { ...x, type: v as PlainType } : x)))}
                        fullWidth
                      />
                    ) : widen && !locked ? (
                      <Select
                        options={[
                          { id: d.original.type, label: d.original.type },
                          { id: widen.to, label: `${widen.to} · ${widen.label}` },
                        ]}
                        value={d.type}
                        onChange={(v) => setDrafts((ds) => ds.map((x) => (x.id === d.id ? { ...x, type: v as PlainType } : x)))}
                        fullWidth
                      />
                    ) : (
                      <Typography variant="body-normal" color="gray-light" noMargin>
                        {d.type}
                        {locked ? ' · identifies a row, type locked' : ' · can’t be changed'}
                      </Typography>
                    )}
                  </div>
                  {!d.original ? (
                    <Button
                      variant="tertiary"
                      icon="trash-can"
                      iconOnly
                      aria-label="Remove new column"
                      onClick={() => setDrafts((ds) => ds.filter((x) => x.id !== d.id))}
                    >
                      Remove
                    </Button>
                  ) : (
                    <span className={styles.iconSpacer} />
                  )}
                </Horizontal>
              );
            })}
            {draftError && (
              <Typography variant="footnote" color="failure" noMargin>
                {draftError}
              </Typography>
            )}
            <Horizontal justify="space-between">
              <Button
                variant="tertiary"
                size="small"
                icon="plus"
                onClick={() => setDrafts((ds) => [...ds, { id: `n${Date.now()}`, name: '', type: 'Text' }])}
              >
                Add column
              </Button>
              <Horizontal gap={spacing.B}>
                <Button variant="secondary" size="small" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="small" disabled={!changes.length || !!draftError} onClick={() => setConfirm('review')}>
                  Review changes
                </Button>
              </Horizontal>
            </Horizontal>
            <Typography variant="footnote" color="gray-light" noMargin>
              You can add columns, rename them, and change a type only in a direction that holds more. Columns can&apos;t be
              removed, and identifying columns keep their type.
            </Typography>
          </Vertical>
        )}

        {tab === 'preview' &&
          (t.empty ? (
            <Typography variant="body-normal" color="gray-light" noMargin>
              No rows yet.
            </Typography>
          ) : (
            <Vertical gap={spacing.B}>
              <Typography variant="footnote" color="gray-light" noMargin>
                First 100 rows
              </Typography>
              <div className={styles.previewScroll}>
                <Table compact data={previewRows} rowKey="_i" columns={t.columns.map((c) => ({ key: c.name, label: c.name }))} />
              </div>
            </Vertical>
          ))}
      </Vertical>
    </Modal>
  );
};
