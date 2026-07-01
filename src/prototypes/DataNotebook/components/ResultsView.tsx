import React from 'react';
import { c, ff, fw } from '../styles';
import type { CellOutput } from '../types';

const formatCell = (v: unknown): { text: string; muted?: boolean; numeric?: boolean } => {
  if (v === null || v === undefined) return { text: 'null', muted: true };
  if (typeof v === 'boolean') return { text: v ? 'true' : 'false' };
  if (typeof v === 'number') {
    const text = Number.isInteger(v) ? v.toLocaleString() : (Math.abs(v) < 1 ? v.toFixed(4) : v.toLocaleString(undefined, { maximumFractionDigits: 2 }));
    return { text, numeric: true };
  }
  return { text: String(v) };
};

const StdoutBlock: React.FC<{ stdout?: string }> = ({ stdout }) =>
  stdout ? (
    <pre style={{
      margin: 0, padding: '8px 12px', fontSize: 11.5,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      color: c['content-secondary'], backgroundColor: 'rgba(0,0,0,0.025)',
      whiteSpace: 'pre-wrap', borderBottom: '1px solid rgba(0,0,0,0.05)', lineHeight: 1.5,
      maxHeight: 160, overflow: 'auto',
    }}>{stdout}</pre>
  ) : null;

const ResultsTable: React.FC<{ output: CellOutput }> = ({ output }) => {
  const cols = output.columns ?? [];
  const rows = output.rows ?? [];
  if (cols.length === 0) return <div style={{ padding: '10px 12px', fontSize: 12, color: c['content-secondary'] }}>No columns returned.</div>;
  return (
    <div style={{ overflow: 'auto', maxHeight: 340 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontFamily: ff.primary }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, color: '#aeb6c2', fontWeight: fw.medium, width: 34, textAlign: 'right', paddingRight: 8 }}>#</th>
            {cols.map(col => (
              <th key={col.name} style={thStyle}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 12, fontWeight: fw.semibold, color: c['content-primary'] }}>{col.name}</span>
                  {col.type && col.type !== 'inferred' && (
                    <span style={{ fontSize: 9.5, fontWeight: fw.medium, color: '#aeb6c2', textTransform: 'lowercase', letterSpacing: '0.2px' }}>{col.type}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 ? 'rgba(0,0,0,0.014)' : 'transparent' }}>
              <td style={{ ...tdStyle, color: '#c4c9d4', textAlign: 'right', paddingRight: 8 }}>{i + 1}</td>
              {cols.map(col => {
                const f = formatCell(row[col.name]);
                return (
                  <td key={col.name} style={{ ...tdStyle, textAlign: f.numeric ? 'right' : 'left', color: f.muted ? '#c4c9d4' : c['content-primary'], fontStyle: f.muted ? 'italic' : 'normal', fontVariantNumeric: f.numeric ? 'tabular-nums' : 'normal' }}>
                    {f.text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  position: 'sticky', top: 0, zIndex: 1,
  textAlign: 'left', padding: '6px 12px',
  backgroundColor: '#fbfcfd', borderBottom: '1px solid rgba(0,0,0,0.08)',
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '5px 12px', fontSize: 12, borderBottom: '1px solid rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
};

const ResultsView: React.FC<{ output: CellOutput }> = ({ output }) => {
  if (output.kind === 'error') {
    return (
      <div>
        <StdoutBlock stdout={output.stdout} />
        <div style={{
          padding: '10px 12px', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          color: '#b91c1c', backgroundColor: '#fef2f2', whiteSpace: 'pre-wrap', lineHeight: 1.5,
          borderTop: '1px solid #fecaca',
        }}>
          <span style={{ fontWeight: fw.semibold, fontFamily: ff.primary }}>Error  </span>{output.error}
        </div>
      </div>
    );
  }
  if (output.kind === 'scalar' || output.kind === 'text') {
    return (
      <div>
        <StdoutBlock stdout={output.stdout} />
        {(output.scalar !== undefined && output.scalar !== null) && (
          <div style={{ padding: '10px 12px', fontSize: 13, fontFamily: output.kind === 'text' ? 'ui-monospace, monospace' : ff.primary, color: c['content-primary'], whiteSpace: 'pre-wrap' }}>
            {String(output.scalar)}
          </div>
        )}
      </div>
    );
  }
  if (output.kind === 'table') {
    return (
      <div>
        <StdoutBlock stdout={output.stdout} />
        <ResultsTable output={output} />
        <div style={{ padding: '6px 12px', fontSize: 11, color: '#aeb6c2', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: 12 }}>
          <span>{(output.rowCount ?? output.rows?.length ?? 0).toLocaleString()} rows × {output.columns?.length ?? 0} cols</span>
          {output.truncated && <span>· showing first {output.rows?.length}</span>}
          {output.elapsedMs !== undefined && <span style={{ marginLeft: 'auto' }}>{output.elapsedMs} ms</span>}
        </div>
      </div>
    );
  }
  // kind none — only stdout (e.g. a python cell that just printed)
  return <StdoutBlock stdout={output.stdout} />;
};

export default ResultsView;
