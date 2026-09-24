import React, { useState, useMemo, useEffect } from 'react';
import TableCard from './TableCard';
import JoinConnector from './JoinConnector';
import type { JoinInfo, CardRect } from './JoinConnector';

const CARD_W = 200;
const CARD_H = 120;

export interface TablePositionData {
  name: string;
  x: number;
  y: number;
  totalColumns: number;
  addedColumns: number;
}

export interface TableCanvasProps {
  tables: TablePositionData[];
  joins: JoinInfo[];
  onTableDragEnd: (name: string, x: number, y: number) => void;
  selectedTable?: string;
  onSelectTable?: (name: string) => void;
  // Optional interactive join selection — see JoinConnectorProps. Omitted by
  // default so existing consumers' join lines stay purely decorative.
  selectedJoinKey?: string;
  onSelectJoin?: (join: JoinInfo) => void;
  // Extra tables to highlight alongside selectedTable — used when a join is
  // selected, to also highlight the two tables it connects. Omitted by
  // default so existing consumers keep single-table highlighting only.
  highlightedTables?: string[];
  // Additive, opt-in — see TableCard's own prop. Off by default so the other
  // consumers of this canvas keep their current hover-less cards.
  hoverAffordance?: boolean;
  // Fired by the join handle: clicking it passes no target (the consumer asks
  // the user to choose one); dragging it onto another card passes that card.
  // Omitted by default, which also leaves the handle inert.
  onCreateJoin?: (fromTable: string, toTable?: string) => void;
  // Additive, opt-in — see TableCard's own prop.
  onAddColumns?: (tableName: string) => void;
  // Additive, opt-in: fires on a card's "..." button with the click, so the
  // consumer can anchor its own menu there. Omitted by default, which leaves
  // that button inert exactly as it is for the other consumers.
  onTableMenu?: (tableName: string, e: React.MouseEvent) => void;
  // Additive, opt-in pair: explicit preview (eye) buttons on cards and join
  // badges — see TableCard.onPreview / JoinConnector.onPreviewJoin. Omitted
  // by default so every other consumer keeps its current cards and badges.
  onPreviewTable?: (tableName: string) => void;
  onPreviewJoin?: (join: JoinInfo) => void;
}

const TableCanvas: React.FC<TableCanvasProps> = ({ tables, joins, onTableDragEnd, selectedTable, onSelectTable, selectedJoinKey, onSelectJoin, highlightedTables, hoverAffordance, onCreateJoin, onAddColumns, onTableMenu, onPreviewTable, onPreviewJoin }) => {
  // Live dotted line while dragging from a card's join handle.
  const [joinDrag, setJoinDrag] = useState<{ from: string; x: number; y: number } | null>(null);

  const handleJoinHandleMouseDown = (name: string, e: React.MouseEvent) => {
    if (!onCreateJoin) return;
    e.preventDefault();
    // Cards are absolutely positioned inside the canvas, so the card's own
    // offsetParent is exactly the space their x/y — and this line — live in.
    const cardEl = (e.target as HTMLElement).closest('[data-table]') as HTMLElement | null;
    const parent = cardEl?.offsetParent as HTMLElement | null;
    if (!parent) return;
    const toCanvas = (ev: { clientX: number; clientY: number }) => {
      const r = parent.getBoundingClientRect();
      return { x: ev.clientX - r.left + parent.scrollLeft, y: ev.clientY - r.top + parent.scrollTop };
    };
    const start = toCanvas(e);
    let moved = false;

    const onMove = (ev: MouseEvent) => {
      const p = toCanvas(ev);
      if (!moved && (Math.abs(p.x - start.x) > 3 || Math.abs(p.y - start.y) > 3)) moved = true;
      if (moved) setJoinDrag({ from: name, x: p.x, y: p.y });
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setJoinDrag(null);
      if (!moved) { onCreateJoin(name); return; }
      const dropped = (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)
        ?.closest('[data-table]') as HTMLElement | null;
      const target = dropped?.getAttribute('data-table') ?? undefined;
      if (target && target !== name) onCreateJoin(name, target);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(tables.map(t => [t.name, { x: t.x, y: t.y }]))
  );

  // Re-sync positions when tables change; init.js is authoritative (tablePositions state)
  useEffect(() => {
    setPositions(Object.fromEntries(tables.map(t => [t.name, { x: t.x, y: t.y }])));
  }, [tables]);

  const cardRects = useMemo((): Record<string, CardRect> => {
    const rects: Record<string, CardRect> = {};
    tables.forEach(t => {
      const pos = positions[t.name] ?? { x: t.x, y: t.y };
      rects[t.name] = { x: pos.x, y: pos.y, w: CARD_W, h: CARD_H };
    });
    return rects;
  }, [tables, positions]);

  return (
    <>
      {tables.map(t => {
        const pos = positions[t.name] ?? { x: t.x, y: t.y };
        return (
          <TableCard
            key={t.name}
            name={t.name}
            totalColumns={t.totalColumns}
            addedColumns={t.addedColumns}
            x={pos.x}
            y={pos.y}
            onDrag={(x, y) => setPositions(prev => ({ ...prev, [t.name]: { x, y } }))}
            onDragEnd={(x, y) => onTableDragEnd(t.name, x, y)}
            selected={t.name === selectedTable || (highlightedTables?.includes(t.name) ?? false)}
            onSelect={onSelectTable}
            hoverAffordance={hoverAffordance}
            onJoinHandleMouseDown={handleJoinHandleMouseDown}
            onAddColumns={onAddColumns}
            onMenuClick={onTableMenu ? e => onTableMenu(t.name, e) : undefined}
            onPreview={onPreviewTable}
          />
        );
      })}
      <JoinConnector joins={joins} cardRects={cardRects} selectedJoinKey={selectedJoinKey} onSelectJoin={onSelectJoin} onPreviewJoin={onPreviewJoin} />
      {joinDrag && cardRects[joinDrag.from] && (
        <svg
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 1 }}
          aria-hidden="true"
        >
          <path
            d={`M ${cardRects[joinDrag.from].x + cardRects[joinDrag.from].w} ${cardRects[joinDrag.from].y + cardRects[joinDrag.from].h / 2} L ${joinDrag.x} ${joinDrag.y}`}
            stroke="var(--rd-sys-color-border-brand, #2770EF)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      )}
    </>
  );
};

export default TableCanvas;
