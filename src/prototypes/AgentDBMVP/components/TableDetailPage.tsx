import React, { useMemo, useState } from 'react';
import { ActionMenu, ActionMenuItem, Button, Horizontal, Modal, ModalFooter, Select, Table, Tabs, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import { StoreTable, TableColumn } from '../types';
import { formatGB, formatRows } from '../data';
import { PLAIN_TYPES, PlainType, WIDENS_TO } from '../tableSchema';
import { KeyValue, Panel } from './primitives';
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
      return col.name.endsWith('_id') ? String(88410000 + row) : String(n % 20000);
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

type Confirm = null | 'delete' | 'empty' | 'review';

/**
 * Full-page table view. V1 (7 Oct): no status tags and no in-progress states — the page shows
 * what the database knows (rows, size, last update) and the structure.
 */
export const TableDetailPage: React.FC<{
  table: StoreTable;
  onBack: () => void;
  onDelete: (t: StoreTable) => void;
  onUpdate: (t: StoreTable, message: string) => void;
}> = ({ table: t, onBack, onDelete, onUpdate }) => {
  const [tab, setTab] = useState('columns');
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [typed, setTyped] = useState('');
  const [editing, setEditing] = useState(false);
  const [menuKey, setMenuKey] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const source = t.empty ? 'your pipeline' : t.writer.label;

  const startEdit = () => {
    setDrafts(t.columns.map((c, i) => ({ id: `c${i}`, name: c.name, type: c.type as PlainType, original: c })));
    setEditing(true);
  };

  const changes = useMemo(() => {
    const out: { kind: 'add' | 'rename' | 'widen'; text: string }[] = [];
    drafts.forEach((d) => {
      if (!d.original) {
        if (d.name.trim()) out.push({ kind: 'add', text: `Add ${d.name} (${d.type}) — empty until the next load` });
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
    const columns: TableColumn[] = drafts
      .filter((d) => d.name.trim())
      .map((d) => (d.original ? { ...d.original, name: d.name, type: d.type } : { name: d.name, type: d.type, addedLater: !t.empty }));
    onUpdate({ ...t, columns }, `${changes.length} ${changes.length === 1 ? 'change' : 'changes'} saved`);
    setEditing(false);
    setConfirm(null);
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

  const renderConfirm = () => {
    if (confirm === 'delete') {
      return (
        <Modal
          isOpen
          onClose={() => setConfirm(null)}
          title={`Delete ${t.name}?`}
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
          title={`Empty ${t.name}?`}
          size="medium"
          footer={
            <ModalFooter
              secondaryAction={<Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button>}
              primaryAction={
                <Button
                  variant="primary"
                  onClick={() => {
                    onUpdate({ ...t, rows: 0, sizeGB: 0, empty: true, lastUpdated: '—' }, `${t.name} emptied`);
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
              Make the same change in {source} so its next load matches.
            </Typography>
          </Vertical>
        </Modal>
      );
    }

    return null;
  };

  return (
    <>
      <Vertical gap={spacing.F}>
        <Vertical gap={spacing.C}>
          <div>
            <Button variant="tertiary" size="small" icon="arrow-left" onClick={onBack}>
              Data
            </Button>
          </div>
          <Horizontal justify="space-between" align="start" gap={spacing.D} wrap>
            <Vertical gap={spacing.A}>
              <Typography variant="page-title" color="base" noMargin>
                {t.name}
              </Typography>
              <Typography variant="body-normal" color="gray-light" noMargin>
                {t.empty
                  ? `Empty. Point your pipeline at ${t.name} using a service account with write access.`
                  : `Written by ${t.writer.label} (${t.writer.detail}). The job itself is scheduled and managed in ${t.writer.label}.`}
              </Typography>
            </Vertical>
            <Horizontal gap={spacing.B}>
              <Button
                variant="secondary"
                icon="pencil"
                disabled={editing}
                onClick={() => {
                  setTab('columns');
                  startEdit();
                }}
              >
                Edit columns
              </Button>
              <ActionMenu
                key={menuKey}
                placement="bottom-end"
                trigger={
                  <Button variant="secondary" icon="more" iconOnly aria-label="More actions">
                    More
                  </Button>
                }
              >
                {!t.empty && (
                  <ActionMenuItem
                    label="Empty table"
                    onClick={() => {
                      setConfirm('empty');
                      setMenuKey((k) => k + 1);
                    }}
                  />
                )}
                <ActionMenuItem
                  label="Delete table"
                  onClick={() => {
                    setTyped('');
                    setConfirm('delete');
                    setMenuKey((k) => k + 1);
                  }}
                />
              </ActionMenu>
            </Horizontal>
          </Horizontal>
        </Vertical>

        <Panel title="Details">
          <div className={styles.factGrid}>
            <KeyValue label="Rows">{t.empty ? '0' : formatRows(t.rows)}</KeyValue>
            <KeyValue label="Size">{t.empty ? '—' : formatGB(t.sizeGB)}</KeyValue>
            <KeyValue label="Last updated">{t.lastUpdated}</KeyValue>
          </div>
        </Panel>

        <Panel title="Structure and data">
          <Vertical gap={spacing.D}>
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
            {tab === 'columns' && !editing && (
              <Table
                compact
                rowKey="name"
                data={t.columns as unknown as Record<string, unknown>[]}
                columns={[
                  { key: 'name', label: 'Column', render: (v) => <code className={styles.mono}>{String(v)}</code> },
                  { key: 'type', label: 'Type' },
                ]}
              />
            )}

            {tab === 'columns' && editing && (
              <Vertical gap={spacing.B}>
                {drafts.map((d, i) => {
                  const widen = d.original ? WIDENS_TO[d.original.type as PlainType] : undefined;
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
                        ) : widen ? (
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
                            {d.type} · can’t be changed
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
                  removed.
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
        </Panel>
      </Vertical>
      {renderConfirm()}
    </>
  );
};
