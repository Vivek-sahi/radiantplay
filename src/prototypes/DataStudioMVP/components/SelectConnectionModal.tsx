import React, { useMemo, useRef, useState } from 'react';
import { RdModal } from '../../../components/RdModal';
import { Horizontal, Vertical } from '../../../components/Layout';
import { Divider } from '../../../components/Divider';
import { c, sp, ts, text } from '../styles';
import { radius } from '@tokens/radius';
import { Icon } from '@components/icons';
import { SearchBar } from '@components/SearchBar';
import { CONNECTION_INFO, TABLE_LOCATION, type ConnectionId } from '../data/tableConnections';
import { SourceMark } from './icons/ConnectorIcons';

/**
 * Select connection — the step before the canvas opens.
 *
 * Master/detail: the connections on the left with search over them, the selected one's
 * metadata on the right. Matches the shape of the real product's own dialog, which is
 * where this flow comes from.
 *
 * ⚠️ **One connection per model, and it cannot be changed afterwards.** What is chosen
 * here scopes the whole model: the data browser becomes a flat list of *this*
 * connection's tables, with no connection, database or schema levels above them. That is
 * why the choice is made before the canvas rather than inside it.
 *
 * ⚠️ **Do not wrap text in `<View>`.** `View` is `display: flex` with row direction, not a
 * generic div — a text node inside one becomes a flex item, and a list inside one lays its
 * rows out side by side. Plain `<div>` for text, `Vertical` / `Horizontal` for layout.
 */

/** Placeholder metadata — the real dialog shows created/modified, tags and authors. */
const CONN_META: Partial<Record<ConnectionId, { created: string; modified: string; author: string; description?: string }>> = {
  sf:         { created: '02/11/2025', modified: '08/13/2026', author: 'maya.chen', description: 'Production Snowflake warehouse — accounts, contracts and support data.' },
  bq:         { created: '04/02/2025', modified: '08/11/2026', author: 'maya.chen', description: 'Product analytics warehouse.' },
  agentdb:    { created: '01/09/2026', modified: '08/16/2026', author: 'system',     description: "ThoughtSpot's own store." },
  gdrive:     { created: '06/21/2025', modified: '07/30/2026', author: 'dana.wu' },
  sharepoint: { created: '06/21/2025', modified: '07/30/2026', author: 'dana.wu' },
  mixpanel:   { created: '03/14/2025', modified: '05/02/2026', author: 'sam.reid' },
  pendo:      { created: '03/14/2025', modified: '05/02/2026', author: 'sam.reid' },
};

/** Brand marks exist only for these; everything else falls back to the generic glyph. */
const BRANDED = ['snowflake', 'databricks', 'bigquery', 'postgres'];

export interface SelectConnectionModalProps {
  onClose: () => void;
  onBack: () => void;
  /** Next pressed — carries the chosen connection through to the canvas. */
  onNext: (connectionId: ConnectionId) => void;
}

const SelectConnectionModal: React.FC<SelectConnectionModalProps> = ({ onClose, onBack, onNext }) => {
  // Only connections that actually hold tables — an empty one is a dead end you can pick.
  const connections = useMemo(() => {
    const withTables = new Set(Object.values(TABLE_LOCATION).map(l => l.connection));
    return (Object.keys(CONNECTION_INFO) as ConnectionId[]).filter(id => withTables.has(id));
  }, []);

  /** Table counts per connection, so a row carries weight rather than just a name. */
  const counts = useMemo(() => {
    const m = {} as Record<ConnectionId, number>;
    for (const l of Object.values(TABLE_LOCATION)) m[l.connection] = (m[l.connection] ?? 0) + 1;
    return m;
  }, []);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ConnectionId>(connections[0]);
  const listRef = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const visible = q
    ? connections.filter(id => CONNECTION_INFO[id].label.toLowerCase().includes(q))
    : connections;

  const info = CONNECTION_INFO[selected];
  const meta = CONN_META[selected];
  const tableCount = counts[selected] ?? 0;

  /* Arrow keys move within the filtered list. Selection follows focus, which is the
     right pattern for a single-select list whose detail panel updates alongside it. */
  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const i = visible.indexOf(selected);
    const next = e.key === 'ArrowDown'
      ? visible[Math.min(i + 1, visible.length - 1)]
      : visible[Math.max(i - 1, 0)];
    if (next) {
      setSelected(next);
      listRef.current?.querySelector<HTMLElement>(`[data-conn="${next}"]`)?.scrollIntoView({ block: 'nearest' });
    }
  };

  /** One metadata row. A fixed label column is what makes four of these read as a set. */
  const metaRow = (label: string, value: React.ReactNode) => (
    <Horizontal gap={sp.C} align="start">
      <div style={{ ...text(ts.caption), color: c['content-secondary'], width: 76, flexShrink: 0 }}>{label}</div>
      <div style={{ ...text(ts.caption), color: c['content-primary'], minWidth: 0 }}>{value}</div>
    </Horizontal>
  );

  const mark = (type: string, size: number) => (BRANDED.includes(type)
    ? <SourceMark name={type} size={size} />
    : <Icon name="database" size={size >= 20 ? 's' : 'xs'} color={c['content-secondary']} />);

  return (
    <RdModal
      size="M2"
      title="Select connection"
      onClose={onClose}
      cancelLabel="Back"
      onCancel={onBack}
      confirmLabel="Next"
      onConfirm={() => onNext(selected)}
    >
      <div style={{ display: 'flex', gap: sp.D, height: 420, minHeight: 0, alignItems: 'stretch' }}>

        {/* ── Left: search, then the list ──────────────────────────────────── */}
        <div style={{
          width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column',
          border: `1px solid ${c['border-default']}`, borderRadius: radius.lg,
          background: c['background-sunken'], overflow: 'hidden',
        }}>
          <div style={{ padding: sp.C, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
            <SearchBar size="sm" placeholder="Search connections" value={query} onChange={setQuery} />
          </div>

          <div
            ref={listRef}
            role="listbox"
            aria-label="Connections"
            tabIndex={0}
            onKeyDown={onListKeyDown}
            className="dsmvp-conn-list"
            style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: `${sp.A}px 0`, outline: 'none' }}
          >
            {visible.length === 0 ? (
              <div style={{ ...text(ts.caption), padding: `${sp.F}px ${sp.D}px`, color: c['content-secondary'], textAlign: 'center' }}>
                Nothing matches “{query.trim()}”
              </div>
            ) : visible.map(id => {
              const isSel = id === selected;
              const conn = CONNECTION_INFO[id];
              const n = counts[id] ?? 0;
              return (
                <div
                  key={id}
                  data-conn={id}
                  role="option"
                  aria-selected={isSel}
                  onClick={() => setSelected(id)}
                  className="dsmvp-conn-row"
                  style={{
                    display: 'flex', alignItems: 'center', gap: sp.B,
                    padding: `${sp.B}px ${sp.D}px`, cursor: 'pointer',
                    background: isSel ? c['background-base'] : 'transparent',
                    borderLeft: `2px solid ${isSel ? c['border-brand'] : 'transparent'}`,
                  }}
                >
                  <div style={{
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 16, height: 16,
                  }}>{mark(conn.type, 16)}</div>

                  {/* name over count — two levels in a row that used to have one */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      ...text(ts.caption),
                      fontWeight: isSel ? 600 : 400,
                      color: c['content-primary'],
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{conn.label}</div>
                    <div style={{ ...text(ts.caption), color: c['content-secondary'] }}>
                      {n} table{n === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right: the selected connection ───────────────────────────────── */}
        <div style={{
          flex: 1, minWidth: 0, overflowY: 'auto',
          border: `1px solid ${c['border-default']}`, borderRadius: radius.lg,
          padding: sp.F,
        }}>
          <Vertical gap={sp.E}>
            {/* Title block — the one place on this screen with real size on it */}
            <Horizontal gap={sp.C} align="center">
              <div style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: radius.md,
                background: c['background-subtle'],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{mark(info.type, 20)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ ...text(ts.contentLabel), color: c['content-primary'] }}>{info.label}</div>
                <div style={{ ...text(ts.overline), color: c['content-secondary'] }}>{info.type}</div>
              </div>
            </Horizontal>

            <Divider spacing="none" />

            {meta?.description && (
              <div style={{ ...text(ts.footnote), color: c['content-secondary'] }}>{meta.description}</div>
            )}

            {/* One aligned set, rather than four stacked label-above-value pairs */}
            <Vertical gap={sp.B}>
              {metaRow('Tables', `${tableCount} table${tableCount === 1 ? '' : 's'}`)}
              {metaRow('Created', meta?.created ?? '—')}
              {metaRow('Modified', meta?.modified ?? '—')}
              {metaRow('Author', meta?.author ?? '—')}
            </Vertical>
          </Vertical>
        </div>
      </div>

      {/* Hover lives in CSS rather than in mouse handlers mutating inline style. */}
      <style>{`
        .dsmvp-conn-row:hover[aria-selected="false"] { background: ${c['background-subtle']}; }
        .dsmvp-conn-list:focus-visible { outline: 2px solid ${c['border-focus']}; outline-offset: -2px; }
      `}</style>
    </RdModal>
  );
};

export default SelectConnectionModal;
