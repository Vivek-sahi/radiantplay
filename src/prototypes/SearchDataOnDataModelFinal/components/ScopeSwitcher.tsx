import React, { useRef, useState } from 'react';
import { Button } from '@components/Button';
import { Icon } from '@components/icons';
import { AnchoredMenu } from './AnchoredMenu';

/**
 * Table / Join / Model scope switcher for the Split data preview's title bar
 * (2026-09-22, Komal: "in the centre here, add a scope switcher as other
 * options — between tables, joins and model").
 *
 * Combined already has one, built inline in SearchDataExplorations.tsx's
 * spreadsheet sub-header. This is that control, lifted out so the two read
 * identically: the same trailing-chevron tertiary Button trigger, the same
 * 160px menu with "Tables" and "Joins" opening a searchable flyout on hover
 * and "Model" acting immediately, the same check mark, row metrics and
 * colours. Nothing here is a new pattern — only the host is new.
 *
 * Combined's copy stays where it is; it is wired to that file's own canvasScope
 * callbacks and its own render sites, and lifting it out of there would mean
 * touching a screen this change has no business in.
 */

export type PreviewScope = 'none' | 'table' | 'join' | 'model';
export type ScopeJoin = { leftTable: string; rightTable: string };

export interface ScopeSwitcherProps {
  scope: PreviewScope;
  tables: { name: string }[];
  joins: ScopeJoin[];
  selectedTable: string;
  selectedJoin: ScopeJoin | null;
  onPickTable: (name: string) => void;
  onPickJoin: (join: ScopeJoin) => void;
  onPickModel: () => void;
}

const joinLabel = (j: ScopeJoin) => `${j.leftTable} – ${j.rightTable}`;

export const ScopeSwitcher: React.FC<ScopeSwitcherProps> = ({
  scope, tables, joins, selectedTable, selectedJoin, onPickTable, onPickJoin, onPickModel,
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState<'tables' | 'joins' | null>(null);
  const [search, setSearch] = useState('');

  // Nothing picked yet reads as "Select data", not as a silently-defaulted
  // scope — it matches the panel's own "Nothing selected" empty state.
  const label = scope === 'model' ? 'Model'
    : scope === 'join' && selectedJoin ? joinLabel(selectedJoin)
    : scope === 'table' && selectedTable ? selectedTable
    : 'Select data';

  const q = search.trim().toLowerCase();
  const matchedTables = tables.filter(t => t.name.toLowerCase().includes(q));
  const matchedJoins = joins.filter(j => joinLabel(j).toLowerCase().includes(q));

  const close = () => { setOpen(false); setSub(null); setSearch(''); };

  const row = (text: string, checked: boolean, submenu: 'tables' | 'joins' | null, onClick?: () => void) => (
    <div
      key={text}
      style={{ position: 'relative' }}
      onMouseEnter={() => submenu && setSub(submenu)}
      onMouseLeave={() => setSub(cur => cur === submenu ? null : cur)}
    >
      <button
        type="button"
        onClick={onClick}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', border: 'none', background: sub === submenu ? '#F6F8FA' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#1D232F' }}
      >
        <span style={{ width: 14, height: 14, flexShrink: 0, display: 'flex', color: '#2770EF' }}>
          {checked && <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </span>
        <span style={{ flex: 1 }}>{text}</span>
        {submenu && (
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" style={{ color: '#A5ACB9', flexShrink: 0 }}><path d="M5 3l6 5-6 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        )}
      </button>

      {submenu === 'tables' && sub === 'tables' && (
        <div style={{ position: 'absolute', left: '100%', top: -4, marginLeft: 2, width: 220, background: '#fff', border: '1px solid #EAEDF2', borderRadius: 8, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', padding: '6px' }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tables"
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #EAEDF2', borderRadius: 6, padding: '5px 8px', fontSize: 12.5, color: '#1D232F', outline: 'none', marginBottom: 2 }}
          />
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {matchedTables.length === 0 ? (
              <div style={{ padding: '8px 6px', fontSize: 12, color: '#A5ACB9' }}>{tables.length === 0 ? 'No tables yet' : 'No matches'}</div>
            ) : (
              matchedTables.map(t => {
                const active = scope === 'table' && t.name === selectedTable;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => { onPickTable(t.name); close(); }}
                    style={{ display: 'block', width: '100%', padding: '6px 8px', border: 'none', borderRadius: 5, background: active ? '#EAF1FE' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: '#1D232F' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                    onMouseLeave={e => (e.currentTarget.style.background = active ? '#EAF1FE' : 'transparent')}
                  >{t.name}</button>
                );
              })
            )}
          </div>
        </div>
      )}

      {submenu === 'joins' && sub === 'joins' && (
        <div style={{ position: 'absolute', left: '100%', top: -4, marginLeft: 2, width: 240, background: '#fff', border: '1px solid #EAEDF2', borderRadius: 8, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', padding: '6px' }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search joins"
            style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #EAEDF2', borderRadius: 6, padding: '5px 8px', fontSize: 12.5, color: '#1D232F', outline: 'none', marginBottom: 2 }}
          />
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {matchedJoins.length === 0 ? (
              <div style={{ padding: '8px 6px', fontSize: 12, color: '#A5ACB9' }}>No joins yet</div>
            ) : (
              matchedJoins.map((j, i) => {
                const active = scope === 'join' && selectedJoin?.leftTable === j.leftTable && selectedJoin?.rightTable === j.rightTable;
                return (
                  <button
                    key={`${j.leftTable}-${j.rightTable}-${i}`}
                    type="button"
                    onClick={() => { onPickJoin(j); close(); }}
                    style={{ display: 'block', width: '100%', padding: '6px 8px', border: 'none', borderRadius: 5, background: active ? '#EAF1FE' : 'transparent', cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: '#1D232F' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F6F8FA')}
                    onMouseLeave={e => (e.currentTarget.style.background = active ? '#EAF1FE' : 'transparent')}
                  >{joinLabel(j)}</button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Button
        ref={btnRef}
        variant="tertiary"
        size="small"
        iconPosition="trailing"
        icon={<Icon name="chevron-down" size="s" color="var(--rd-sys-color-content-secondary, #596278)" />}
        onClick={() => { setOpen(o => !o); setSub(null); setSearch(''); }}
        style={{ color: 'var(--rd-sys-color-content-primary, #1d232f)' }}
      >
        {label}
      </Button>
      <AnchoredMenu
        open={open}
        anchorRef={btnRef}
        onClose={close}
        placement="bottom-start"
        style={{ width: 160, background: '#fff', border: '1px solid #EAEDF2', borderRadius: 8, boxShadow: '0 8px 28px rgba(25,35,49,0.16), 0 1px 4px rgba(25,35,49,0.06)', padding: '4px 0' }}
      >
        {row('Tables', scope === 'table', 'tables')}
        {row('Joins', scope === 'join', 'joins')}
        {row('Model', scope === 'model', null, () => { onPickModel(); close(); })}
      </AnchoredMenu>
    </>
  );
};

export default ScopeSwitcher;
