import React, { useMemo, useState } from 'react';
import { Modal } from '@components/Modal';
import { Button } from '@components/Button';
import { SearchInput } from '@components/SearchInput';
import { Select } from '@components/Select';
import { TextInput } from '@components/TextInput';
import { Radio } from '@components/Radio';
import { Typography } from '@components/Typography';
import { Horizontal, Vertical } from '@components/Layout';
import { Icon } from '@components/icons';
import { FUNCTIONS } from '../engine/formula';
import styles from './WorkbookDialogs.module.css';

// Dialogs the workbook opens. Insert function follows Excel's and Sheets': search, a category, the
// syntax and a line about the function you pick, then it's inserted into the cell with its
// argument hint. Pin opens ThoughtSpot's own pin flow: choose a Liveboard, or make a new one.

const CATEGORIES = ['All', ...Array.from(new Set(FUNCTIONS.map((f) => f.category)))];

export const InsertFunctionDialog: React.FC<{ isOpen: boolean; onClose: () => void; onInsert: (name: string) => void }> = ({ isOpen, onClose, onInsert }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [pick, setPick] = useState('XLOOKUP');
  const list = useMemo(
    () => FUNCTIONS.filter((f) => (category === 'All' || f.category === category) && (f.name + f.about).toLowerCase().includes(query.toLowerCase())),
    [query, category],
  );
  const chosen = FUNCTIONS.find((f) => f.name === pick) ?? list[0];
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insert function"
      size="medium"
      footer={
        <Horizontal gap={8} justify="end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!chosen} onClick={() => chosen && onInsert(chosen.name)}>Insert</Button>
        </Horizontal>
      }
    >
      <Vertical gap={12}>
        <Horizontal gap={8} align="center">
          <div className={styles.grow}><SearchInput placeholder="Search for a function" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} /></div>
          <Select options={CATEGORIES.map((c) => ({ id: c, label: c }))} value={category} onChange={setCategory} size="basic" />
        </Horizontal>
        <div className={styles.list} role="listbox" aria-label="Functions">
          {list.map((f) => (
            <button
              key={f.name}
              role="option"
              aria-selected={f.name === chosen?.name}
              className={`${styles.item} ${f.name === chosen?.name ? styles.itemOn : ''}`}
              onClick={() => setPick(f.name)}
              onDoubleClick={() => onInsert(f.name)}
            >
              <span className={styles.fn}>{f.name}</span>
              <span className={styles.cat}>{f.category}</span>
            </button>
          ))}
          {!list.length && <Typography variant="body-normal" color="gray">No function matches “{query}”</Typography>}
        </div>
        {chosen && (
          <Vertical gap={4} className={styles.detail}>
            <span className={styles.syntax}>{chosen.syntax}</span>
            <Typography variant="body-normal" color="gray">{chosen.about}</Typography>
          </Vertical>
        )}
      </Vertical>
    </Modal>
  );
};

const LIVEBOARDS = ['FY26 Regional review', 'Revenue cockpit', 'Finance weekly', 'Board pack Q3'];

export const PinDialog: React.FC<{ isOpen: boolean; what: string; live: boolean; reason?: string; onClose: () => void; onPin: (liveboard: string) => void }> = ({ isOpen, what, live, reason, onClose, onPin }) => {
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState(LIVEBOARDS[0]);
  const shown = LIVEBOARDS.filter((l) => l.toLowerCase().includes(query.toLowerCase()));
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pin to a Liveboard"
      size="medium"
      footer={
        <Horizontal gap={8} justify="end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onPin(pick)}>{live ? 'Pin' : 'Pin snapshot'}</Button>
        </Horizontal>
      }
    >
      <Vertical gap={12}>
        <Typography variant="body-normal">Pinning {what}.</Typography>
        <div className={`${styles.callout} ${live ? styles.live : styles.snapshot}`}>
          <Icon name={live ? 'sync' : 'clock'} size="s" />
          <span>{live ? 'Live tile: it updates with the data.' : reason}</span>
        </div>
        <SearchInput placeholder="Search Liveboards" value={query} onChange={(e) => setQuery(e.target.value)} onClear={() => setQuery('')} />
        <div className={styles.list} role="listbox" aria-label="Liveboards">
          {shown.map((l) => (
            <button key={l} role="option" aria-selected={l === pick} className={`${styles.item} ${l === pick ? styles.itemOn : ''}`} onClick={() => setPick(l)}>
              <Icon name="liveboard-stroke" size="s" />
              <span className={styles.fn}>{l}</span>
            </button>
          ))}
          <button className={styles.item} onClick={() => setPick('New Liveboard')}>
            <Icon name="plus" size="s" />
            <span className={styles.fn}>New Liveboard</span>
          </button>
        </div>
      </Vertical>
    </Modal>
  );
};

/** Insert > Pivot table, as in Google Sheets: the data range, and where to put the pivot. */
export const CreatePivotDialog: React.FC<{
  isOpen: boolean;
  defaultRange: string;
  emptySheets: { id: string; name: string }[];
  onClose: () => void;
  onCreate: (range: string, targetId?: string) => void;
}> = ({ isOpen, defaultRange, emptySheets, onClose, onCreate }) => {
  const [range, setRange] = useState(defaultRange);
  const [where, setWhere] = useState<'new' | 'existing'>('new');
  const [target, setTarget] = useState(emptySheets[0]?.id ?? '');
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create pivot table"
      size="small"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!range.trim() || (where === 'existing' && !target)} onClick={() => onCreate(range.trim(), where === 'existing' ? target : undefined)}>Create</Button>
        </div>
      }
    >
      <Vertical gap={16}>
        <TextInput label="Data range" value={range} onChange={(e) => setRange(e.target.value)} />
        <Vertical gap={8}>
          <Typography variant="content-label">Insert to</Typography>
          <Radio name="pivot-where" value="new" label="New sheet" checked={where === 'new'} onChange={() => setWhere('new')} />
          <Radio name="pivot-where" value="existing" label="Existing sheet" checked={where === 'existing'} disabled={!emptySheets.length} onChange={() => setWhere('existing')} />
          {where === 'existing' && (
            <Select options={emptySheets.map((s) => ({ id: s.id, label: s.name }))} value={target} onChange={setTarget} size="basic" fullWidth />
          )}
          {!emptySheets.length && <Typography variant="footnote" color="gray">Existing sheet needs an empty tab to put the pivot on.</Typography>}
        </Vertical>
      </Vertical>
    </Modal>
  );
};
