import React from 'react';
import { c, ff, fw, sp } from '../styles';
import type { Cell as CellT, CellType } from '../types';
import Cell, { type VarInfo } from './Cell';
import AddCellBar from './AddCellBar';
import { CellGlyph } from './ui';

interface NotebookCanvasProps {
  cells: CellT[];
  varNames: string[];
  resolveVar: (name: string) => VarInfo | undefined;
  onChange: (id: string, patch: Partial<CellT>) => void;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onAddCell: (type: CellType, afterIndex: number) => void;
  onLoadCsv: (id: string, fileName: string, text: string) => void;
  onOpenDataBrowser: () => void;
}

const EmptyState: React.FC<{ onAddCell: (t: CellType) => void; onOpenDataBrowser: () => void }> = ({ onAddCell, onOpenDataBrowser }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420, gap: 18, textAlign: 'center', padding: 32 }}>
    <div style={{ display: 'flex', gap: 6 }}>
      {(['sql', 'python', 'chart'] as CellType[]).map(t => (
        <div key={t} style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', background: c['background-base'], display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <CellGlyph type={t} size={18} />
        </div>
      ))}
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: fw.semibold, color: c['content-primary'] }}>This notebook is empty</div>
      <div style={{ fontSize: 13, color: c['content-secondary'], marginTop: 4, maxWidth: 380, lineHeight: 1.5 }}>
        Ask the notebook agent on the right to build something, or add a cell yourself. Every cell runs for real — SQL on DuckDB, Python on pandas.
      </div>
    </div>
    <div style={{ display: 'flex', gap: 8 }}>
      <button onClick={onOpenDataBrowser} style={ctaSecondary}>Browse data sources</button>
      <button onClick={() => onAddCell('sql')} style={ctaPrimary}>+ Add SQL cell</button>
    </div>
  </div>
);

const NotebookCanvas: React.FC<NotebookCanvasProps> = ({ cells, varNames, resolveVar, onChange, onRun, onDelete, onAddCell, onLoadCsv, onOpenDataBrowser }) => {
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: c['background-sunken'], fontFamily: ff.primary }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: `${sp.F}px ${sp.F}px ${sp.I}px` }}>
        {cells.length === 0 ? (
          <EmptyState onAddCell={(t) => onAddCell(t, -1)} onOpenDataBrowser={onOpenDataBrowser} />
        ) : (
          <>
            <AddCellBar onAdd={(t) => onAddCell(t, -1)} />
            {cells.map((cell, i) => (
              <React.Fragment key={cell.id}>
                <div id={`hexcell-${cell.id}`}>
                  <Cell
                    cell={cell}
                    varNames={varNames}
                    resolveVar={resolveVar}
                    onChange={patch => onChange(cell.id, patch)}
                    onRun={() => onRun(cell.id)}
                    onDelete={() => onDelete(cell.id)}
                    onLoadCsv={(fileName, text) => onLoadCsv(cell.id, fileName, text)}
                    isFirst={i === 0}
                    isLast={i === cells.length - 1}
                  />
                </div>
                <AddCellBar onAdd={(t) => onAddCell(t, i)} variant={i === cells.length - 1 ? 'end' : 'between'} />
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const ctaPrimary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: 'none', background: c['content-brand'],
  color: '#fff', fontFamily: ff.primary, fontSize: 13, fontWeight: fw.semibold, cursor: 'pointer',
};
const ctaSecondary: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 8, border: `1px solid ${c['border-default']}`, background: c['background-base'],
  color: c['content-primary'], fontFamily: ff.primary, fontSize: 13, fontWeight: fw.medium, cursor: 'pointer',
};

export default NotebookCanvas;
