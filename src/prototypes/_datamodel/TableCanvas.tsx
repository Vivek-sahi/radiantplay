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
}

const TableCanvas: React.FC<TableCanvasProps> = ({ tables, joins, onTableDragEnd }) => {
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
          />
        );
      })}
      <JoinConnector joins={joins} cardRects={cardRects} />
    </>
  );
};

export default TableCanvas;
