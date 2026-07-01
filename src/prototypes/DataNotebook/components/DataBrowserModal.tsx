import React, { useState } from 'react';
import { c, ff, fw } from '../styles';
import { CONNECTIONS, getSeedTable } from '../seed';
import type { SeedColumn } from '../types';
import { CloseIcon } from './ui';

interface DataBrowserModalProps {
  open: boolean;
  onClose: () => void;
  onQueryTable: (tableName: string, source: string) => void;
}

const CLASS_COLOR: Record<SeedColumn['classification'], string> = {
  key: '#7C3AED', measure: '#2563EB', attribute: '#64748b',
};

const DataBrowserModal: React.FC<DataBrowserModalProps> = ({ open, onClose, onQueryTable }) => {
  const [selected, setSelected] = useState('dim_accounts');
  if (!open) return null;
  const table = getSeedTable(selected);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff.primary }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 880, maxWidth: '94vw', height: 560, maxHeight: '88vh', background: c['background-base'], borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        {/* header */}
        <div style={{ height: 52, flexShrink: 0, borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: fw.semibold, color: c['content-primary'] }}>Data browser</span>
          <span style={{ fontSize: 12, color: c['content-secondary'] }}>Connected sources available to this notebook</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: c['content-secondary'], display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CloseIcon size={15} /></button>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* left — connections + tables */}
          <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', overflowY: 'auto', padding: 10 }}>
            {CONNECTIONS.map(conn => (
              <div key={conn.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 8px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: conn.type === 'snowflake' ? '#29B5E8' : '#7C3AED' }} />
                  <span style={{ fontSize: 12.5, fontWeight: fw.semibold, color: c['content-primary'] }}>{conn.label}</span>
                </div>
                <div style={{ fontSize: 10.5, color: '#aeb6c2', padding: '0 8px 4px 23px' }}>{conn.sublabel}</div>
                {conn.tables.map(t => (
                  <button key={t} onClick={() => setSelected(t)} style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                    padding: '6px 8px 6px 23px', border: 'none', borderRadius: 6, cursor: 'pointer',
                    background: selected === t ? 'rgba(39,112,239,0.09)' : 'transparent',
                    color: selected === t ? '#2770EF' : c['content-primary'],
                    fontFamily: 'ui-monospace, monospace', fontSize: 12,
                  }}>
                    <TableIcon /> {t}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* right — schema + sample */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
            {table && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: 'ui-monospace, monospace' }}>{table.name}</div>
                    <div style={{ fontSize: 12.5, color: c['content-secondary'], marginTop: 4, lineHeight: 1.5 }}>{table.description}</div>
                    <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11.5, color: '#8a93a3' }}>
                      <span>{table.rowCount.toLocaleString()} rows</span>
                      {table.dqScore !== undefined && <span>DQ {table.dqScore}</span>}
                      {table.owner && <span>· {table.owner}</span>}
                    </div>
                  </div>
                  <button onClick={() => onQueryTable(table.name, table.source)} style={{ flexShrink: 0, padding: '7px 13px', borderRadius: 8, border: 'none', background: c['content-brand'], color: '#fff', fontFamily: ff.primary, fontSize: 12.5, fontWeight: fw.semibold, cursor: 'pointer' }}>
                    Query in a SQL cell
                  </button>
                </div>

                <div style={{ marginTop: 16, fontSize: 11, fontWeight: fw.semibold, color: '#aeb6c2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Schema · {table.columns.length} columns</div>
                <div style={{ marginTop: 8, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, overflow: 'hidden' }}>
                  {table.columns.map((col, i) => (
                    <div key={col.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderTop: i ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: c['content-primary'], minWidth: 170 }}>{col.name}</span>
                      <span style={{ fontSize: 10.5, color: '#8a93a3', textTransform: 'lowercase', minWidth: 70 }}>{col.type}</span>
                      <span style={{ fontSize: 10, fontWeight: fw.semibold, color: CLASS_COLOR[col.classification], background: `${CLASS_COLOR[col.classification]}14`, padding: '1px 7px', borderRadius: 10 }}>{col.classification}</span>
                      {col.nullRate ? <span style={{ fontSize: 10.5, color: '#b45309' }}>{col.nullRate}% null</span> : null}
                      {col.description && <span style={{ fontSize: 11.5, color: '#8a93a3', marginLeft: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{col.description}</span>}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, fontSize: 11, fontWeight: fw.semibold, color: '#aeb6c2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sample rows</div>
                <div style={{ marginTop: 8, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, overflow: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                    <thead><tr>{table.columns.map(co => <th key={co.name} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, fontWeight: fw.semibold, color: c['content-secondary'], background: '#fbfcfd', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>{co.name}</th>)}</tr></thead>
                    <tbody>
                      {table.records.slice(0, 5).map((row, ri) => (
                        <tr key={ri}>{table.columns.map(co => <td key={co.name} style={{ padding: '5px 10px', fontSize: 11.5, color: row[co.name] == null ? '#c4c9d4' : c['content-primary'], fontStyle: row[co.name] == null ? 'italic' : 'normal', borderTop: '1px solid rgba(0,0,0,0.04)', whiteSpace: 'nowrap' }}>{row[co.name] == null ? 'null' : String(row[co.name])}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TableIcon = () => <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2 6.5H14M6 6.5V13" stroke="currentColor" strokeWidth="1.2"/></svg>;

export default DataBrowserModal;
