import React, { useMemo, useState } from 'react';
import { RdModal } from '../../../components/RdModal';
import { systemColors } from '@tokens/colors';
import { spacing as sp } from '@tokens/spacing';
import { fontFamily as ff, fontSize as fs, fontWeight as fw } from '@tokens/typography';
import { radius } from '@tokens/radius';
import { Icon } from '@components/icons';
import { SearchBar } from '@components/SearchBar';
import { CONNECTION_INFO, TABLE_LOCATION, type ConnectionId } from '../data/tableConnections';
import { SourceMark } from './icons/ConnectorIcons';

/**
 * Select Connection — the last step before the canvas opens.
 *
 * Master/detail: the connections on the left with search over them, and the selected one's
 * metadata on the right. Matches the shape of the real product's own Select Connection
 * dialog, which is where this flow comes from.
 *
 * ⚠️ **Choosing one here does not scope the model to it.** The data browser shows every
 * connection in one tree by design — a cross-warehouse join is impossible to express
 * otherwise, which is the point of this cut. So this is a *starting point*: the chosen
 * connection is the one expanded when the canvas opens. That reading needs confirming; if
 * the intent is to genuinely scope the model to one connection, it contradicts the
 * multi-source premise and the browser has to change with it.
 */

const c = systemColors.light;

export interface SelectConnectionModalProps {
  onClose: () => void;
  onBack: () => void;
  /** Next pressed — carries the chosen connection through to the canvas. */
  onNext: (connectionId: ConnectionId) => void;
}

/** Placeholder metadata — the real dialog shows created/modified, tags and authors. */
const CONN_META: Partial<Record<ConnectionId, { created: string; modified: string; author: string; description?: string }>> = {
  sf:         { created: '02/11/2025', modified: '08/13/2026', author: 'maya.chen', description: 'Production Snowflake warehouse — accounts, contracts and support data.' },
  bq:         { created: '04/02/2025', modified: '08/11/2026', author: 'maya.chen', description: 'Product analytics warehouse.' },
  agentdb:    { created: '01/09/2026', modified: '08/16/2026', author: 'system',     description: "ThoughtSpot's own store. Cached tables land here." },
  gdrive:     { created: '06/21/2025', modified: '07/30/2026', author: 'dana.wu' },
  sharepoint: { created: '06/21/2025', modified: '07/30/2026', author: 'dana.wu' },
  mixpanel:   { created: '03/14/2025', modified: '05/02/2026', author: 'sam.reid' },
  pendo:      { created: '03/14/2025', modified: '05/02/2026', author: 'sam.reid' },
};

const SelectConnectionModal: React.FC<SelectConnectionModalProps> = ({ onClose, onBack, onNext }) => {
  // Only connections that actually hold tables — an empty one is a dead end you can pick.
  const connections = useMemo(() => {
    const withTables = new Set(Object.values(TABLE_LOCATION).map(l => l.connection));
    return (Object.keys(CONNECTION_INFO) as ConnectionId[]).filter(id => withTables.has(id));
  }, []);

  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ConnectionId>(connections[0]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? connections.filter(id => CONNECTION_INFO[id].label.toLowerCase().includes(q))
    : connections;

  const info = CONNECTION_INFO[selected];
  const meta = CONN_META[selected];
  const tableCount = Object.values(TABLE_LOCATION).filter(l => l.connection === selected).length;

  const detailLabel = (label: string) => (
    <span style={{ display: 'block', fontSize: fs.xs, fontWeight: fw.semibold, color: c['content-primary'], marginBottom: sp.A }}>{label}</span>
  );

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
      <div style={{ display: 'flex', gap: sp.D, height: 420, minHeight: 0 }}>
        {/* Left — search + list */}
        <div style={{
          width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column',
          border: `1px solid ${c['border-default']}`, borderRadius: radius.lg,
          background: c['background-sunken'], overflow: 'hidden',
        }}>
          <div style={{ padding: sp.C, borderBottom: `1px solid ${c['border-divider']}`, flexShrink: 0 }}>
            <SearchBar size="sm" placeholder="Search" value={query} onChange={setQuery} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: `${sp.A}px 0` }}>
            {visible.length === 0 ? (
              <div style={{ padding: `${sp.F}px ${sp.D}px`, fontSize: fs.xs, color: c['content-secondary'], textAlign: 'center' }}>
                Nothing matches “{query.trim()}”.
              </div>
            ) : visible.map(id => {
              const isSel = id === selected;
              return (
                <div
                  key={id}
                  onClick={() => setSelected(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: sp.B,
                    padding: `${sp.B}px ${sp.D}px`, cursor: 'pointer',
                    background: isSel ? c['background-base'] : 'transparent',
                    borderLeft: `2px solid ${isSel ? c['border-brand'] : 'transparent'}`,
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = c['background-subtle']; }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', width: 16, height: 16, justifyContent: 'center' }}>
                    {/* SourceMark returns null for anything without a brand asset, so the
                        generic glyph is a fallback rather than an alternative. */}
                    <SourceMark name={CONNECTION_INFO[id].type} size={16} />
                    {!['snowflake', 'databricks', 'bigquery', 'postgres'].includes(CONNECTION_INFO[id].type) && (
                      <Icon name="database" size="xs" color={c['content-secondary']} />
                    )}
                  </span>
                  <span style={{
                    fontSize: fs.xs, color: c['content-primary'],
                    fontWeight: isSel ? fw.semibold : fw.regular,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{CONNECTION_INFO[id].label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — the selected connection */}
        <div style={{
          flex: 1, minWidth: 0, overflowY: 'auto',
          border: `1px solid ${c['border-default']}`, borderRadius: radius.lg,
          padding: sp.F, display: 'flex', flexDirection: 'column', gap: sp.E,
        }}>
          <div>
            <div style={{ fontSize: fs.lg, fontWeight: fw.semibold, color: c['content-primary'] }}>{info.label}</div>
            <div style={{ fontSize: fs.xs, color: c['content-secondary'], marginTop: sp.A, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {info.type}
            </div>
            {meta && (
              <div style={{ display: 'flex', gap: sp.F, marginTop: sp.B, fontSize: fs.xs, color: c['content-secondary'], flexWrap: 'wrap' }}>
                <span>Created: {meta.created}</span>
                <span>Modified: {meta.modified}</span>
              </div>
            )}
          </div>

          <div>
            {detailLabel('Description')}
            <span style={{ fontSize: fs.xs, color: meta?.description ? c['content-secondary'] : c['content-tertiary'], lineHeight: 1.5 }}>
              {meta?.description ?? '—'}
            </span>
          </div>

          <div>
            {detailLabel('Tables')}
            <span style={{ fontSize: fs.xs, color: c['content-secondary'] }}>
              {tableCount} table{tableCount === 1 ? '' : 's'}
            </span>
          </div>

          <div>
            {detailLabel('Authors')}
            <span style={{ fontSize: fs.xs, color: meta?.author ? c['content-secondary'] : c['content-tertiary'] }}>
              {meta?.author ?? '—'}
            </span>
          </div>

          {info.isThoughtSpot && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: sp.B,
              background: c['background-information'], borderRadius: radius.md, padding: sp.C,
            }}>
              <span style={{ flexShrink: 0, display: 'flex', marginTop: 1, color: c['content-brand'] }}>
                <Icon name="information" size="xs" color="currentColor" />
              </span>
              <span style={{ fontSize: fs.xs, color: c['content-secondary'], lineHeight: 1.45, fontFamily: ff.primary }}>
                ThoughtSpot’s own store. Tables here never need caching — they are already where a join has to happen.
              </span>
            </div>
          )}
        </div>
      </div>
    </RdModal>
  );
};

export default SelectConnectionModal;
