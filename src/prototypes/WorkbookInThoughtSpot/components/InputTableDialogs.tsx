import React, { useMemo, useState } from 'react';
import { Modal } from '@components/Modal';
import { Button } from '@components/Button';
import { TextInput } from '@components/TextInput';
import { Select } from '@components/Select';
import { Radio } from '@components/Radio';
import { Checkbox } from '@components/Checkbox';
import { Typography } from '@components/Typography';
import { Vertical } from '@components/Layout';
import { warehouseName, type NewInputSpec, type Sheet, type Workbook } from '../engine/workbook';
import styles from './WorkbookDialogs.module.css';

// The input table flow (Vivek, 4 Nov). Creating one is a sheet-level action (tab + → Input table).
// Step 1 here: name it and say what each row stands for — keys brought from another tab (one or
// more; every distinct combination becomes a row), or start empty and type the rows.
// Saving is also sheet level (tab ▾ → Save to warehouse, or the status bar): it writes the table and
// can join its columns back onto the tab the keys came from.

export const NewInputTableDialog: React.FC<{ isOpen: boolean; wb: Workbook; defaultName: string; onClose: () => void; onCreate: (spec: NewInputSpec) => void }> = ({ isOpen, wb, defaultName, onClose, onCreate }) => {
  const sources = wb.sheets.filter((s) => s.rows.length > 0 && (s.kind === 'live' || s.kind === 'input') && !s.pivot);
  const [name, setName] = useState(defaultName);
  const [how, setHow] = useState<'keys' | 'empty'>(sources.length ? 'keys' : 'empty');
  const [from, setFrom] = useState(sources[0]?.id ?? '');
  const src = sources.find((s) => s.id === from);
  // Keys are the columns that name a row: text and dates, not measures.
  const candidates = (src?.columns ?? []).map((c, i) => ({ c, i })).filter((x) => x.c.type === 'text' || x.c.type === 'date');
  const [keys, setKeys] = useState<number[]>(() => candidates.slice(0, 2).map((x) => x.i));
  const rows = useMemo(() => {
    if (!src || !keys.length) return 0;
    return new Set(src.rows.map((r) => JSON.stringify(keys.map((k) => r[k])))).size;
  }, [src, keys]);
  const keyNames = keys.map((k) => src?.columns[k]?.title).filter(Boolean).join(' and ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New input table"
      size="small"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || (how === 'keys' && !keys.length)} onClick={() => onCreate({ name: name.trim(), keysFrom: how === 'keys' && src ? { sheetId: src.id, cols: keys } : undefined })}>Create</Button>
        </div>
      }
    >
      <Vertical gap={16}>
        <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Vertical gap={8}>
          <Typography variant="content-label">Rows</Typography>
          <Radio name="input-rows" value="keys" label="One row for each key, from another sheet" checked={how === 'keys'} disabled={!sources.length} onChange={() => setHow('keys')} />
          <Radio name="input-rows" value="empty" label="Start empty and type the rows" checked={how === 'empty'} onChange={() => setHow('empty')} />
        </Vertical>
        {how === 'keys' && src && (
          <Vertical gap={8}>
            <Select label="Keys from" options={sources.map((s) => ({ id: s.id, label: s.name }))} value={from} onChange={(id) => { setFrom(id); setKeys([]); }} size="basic" fullWidth />
            <Typography variant="content-label">Keys</Typography>
            {candidates.map(({ c, i }) => (
              <Checkbox key={i} label={c.title} checked={keys.includes(i)} onChange={(on) => setKeys((k) => (on ? [...k, i].sort((a, b) => a - b) : k.filter((x) => x !== i)))} />
            ))}
            <Typography variant="footnote" color="gray">
              {keys.length ? `${rows.toLocaleString()} rows, one for each ${keyNames}` : 'Pick at least one key'}
            </Typography>
          </Vertical>
        )}
        <Typography variant="footnote" color="gray">Saves to {warehouseName(name || 'Input table', wb.model)}</Typography>
      </Vertical>
    </Modal>
  );
};

export const SaveInputDialog: React.FC<{ isOpen: boolean; sheet: Sheet; changes: number; joined: boolean; onClose: () => void; onSave: (join: boolean) => void }> = ({ isOpen, sheet, changes, joined, onClose, onSave }) => {
  const keys = sheet.columns.filter((c) => c.key);
  const target = keys[0]?.keyFrom;
  const joinable = !!target && sheet.columns.some((c) => c.input && c.type !== 'text' && c.type !== 'date');
  const [join, setJoin] = useState(joinable && !joined);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Save to warehouse"
      size="small"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(join)}>Save</Button>
        </div>
      }
    >
      <Vertical gap={16}>
        <Typography variant="body-normal">
          Writes {changes.toLocaleString()} {changes === 1 ? 'change' : 'changes'} across {sheet.rows.length.toLocaleString()} rows to {sheet.writesTo}.
        </Typography>
        {joinable && !joined && (
          <Vertical gap={4}>
            <Checkbox label={`Add these columns to ${target}, matched by ${keys.map((k) => k.title).join(' and ')}`} checked={join} onChange={setJoin} />
            <Typography variant="footnote" color="gray">Joined in this workbook. Adding it to the data model, for everyone, is a request to the model's owner.</Typography>
          </Vertical>
        )}
        {joined && <Typography variant="footnote" color="gray">Already joined to {target}: its columns update when you save.</Typography>}
      </Vertical>
    </Modal>
  );
};
