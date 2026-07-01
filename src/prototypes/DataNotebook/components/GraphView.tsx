import React from 'react';
import { c, ff, fw } from '../styles';
import type { Cell, CellStatus } from '../types';
import { graphEdges, producerMap, cellOutputVar } from '../deps';
import { cellTypeMeta, CellGlyph } from './ui';

interface GraphViewProps {
  cells: Cell[];
  onSelectCell: (id: string) => void;
}

const STATUS_RING: Record<CellStatus, string> = {
  idle: '#cbd2dd', queued: '#f59e0b', running: '#2770EF', success: '#16a34a', error: '#dc2626', stale: '#f59e0b',
};

const NODE_W = 168;
const NODE_H = 46;
const COL_GAP = 90;
const ROW_GAP = 24;
const PAD = 40;

// Assign a layer (longest path from a source) to each cell for a left→right DAG.
function layout(cells: Cell[]) {
  const producers = producerMap(cells);
  const byId = new Map(cells.map(c => [c.id, c]));
  const level = new Map<string, number>();
  const visiting = new Set<string>();

  const compute = (id: string): number => {
    if (level.has(id)) return level.get(id)!;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    const cell = byId.get(id);
    let lvl = 0;
    if (cell) {
      for (const v of cell.inputs) {
        const from = producers.get(v);
        if (from && from !== id) lvl = Math.max(lvl, compute(from) + 1);
      }
    }
    visiting.delete(id);
    level.set(id, lvl);
    return lvl;
  };
  cells.forEach(c => compute(c.id));

  // group by level, preserving cell order within a level
  const byLevel = new Map<number, Cell[]>();
  cells.forEach(c => {
    const l = level.get(c.id)!;
    if (!byLevel.has(l)) byLevel.set(l, []);
    byLevel.get(l)!.push(c);
  });

  const pos = new Map<string, { x: number; y: number }>();
  const maxLevel = Math.max(0, ...[...byLevel.keys()]);
  let maxRows = 0;
  for (const [l, arr] of byLevel) {
    arr.forEach((cell, i) => {
      pos.set(cell.id, { x: PAD + l * (NODE_W + COL_GAP), y: PAD + i * (NODE_H + ROW_GAP) });
    });
    maxRows = Math.max(maxRows, arr.length);
  }
  const width = PAD * 2 + (maxLevel + 1) * NODE_W + maxLevel * COL_GAP;
  const height = PAD * 2 + maxRows * (NODE_H + ROW_GAP);
  return { pos, width, height };
}

const GraphView: React.FC<GraphViewProps> = ({ cells, onSelectCell }) => {
  if (cells.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c['background-sunken'], color: c['content-secondary'], fontFamily: ff.primary, fontSize: 13 }}>
        The dependency graph appears once the notebook has cells.
      </div>
    );
  }
  const { pos, width, height } = layout(cells);
  const edges = graphEdges(cells);

  return (
    <div style={{ flex: 1, overflow: 'auto', background: c['background-sunken'], fontFamily: ff.primary }}>
      <div style={{ position: 'relative', width: Math.max(width, 600), height: Math.max(height, 400), margin: '0 auto' }}>
        <svg width={Math.max(width, 600)} height={Math.max(height, 400)} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <defs>
            <marker id="hexarrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="#c2cad6" /></marker>
          </defs>
          {edges.map(([from, to], i) => {
            const a = pos.get(from); const b = pos.get(to);
            if (!a || !b) return null;
            const x1 = a.x + NODE_W, y1 = a.y + NODE_H / 2;
            const x2 = b.x, y2 = b.y + NODE_H / 2;
            const mx = (x1 + x2) / 2;
            return <path key={i} d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} stroke="#c2cad6" strokeWidth={1.5} fill="none" markerEnd="url(#hexarrow)" />;
          })}
        </svg>
        {cells.map(cell => {
          const p = pos.get(cell.id)!;
          const outVar = cellOutputVar(cell);
          return (
            <button
              key={cell.id}
              onClick={() => onSelectCell(cell.id)}
              style={{
                position: 'absolute', left: p.x, top: p.y, width: NODE_W, height: NODE_H,
                display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px',
                background: c['background-base'], border: `1px solid ${STATUS_RING[cell.status]}`,
                borderLeft: `4px solid ${cellTypeMeta[cell.type].color}`,
                borderRadius: 9, cursor: 'pointer', textAlign: 'left',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)', fontFamily: ff.primary,
              }}
            >
              <CellGlyph type={cell.type} size={15} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell.name}</div>
                <div style={{ fontSize: 10, color: '#aeb6c2' }}>{cellTypeMeta[cell.type].label}{outVar ? ' · var' : ''}</div>
              </div>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_RING[cell.status], flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GraphView;
