import React from 'react';

export interface JoinInfo {
  leftTable: string;
  rightTable: string;
}

export interface CardRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface JoinConnectorProps {
  joins: JoinInfo[];
  cardRects: Record<string, CardRect>;
}

type Edge = 'left' | 'right' | 'top' | 'bottom';
type Point = { x: number; y: number };

function cardEdges(rect: CardRect): Record<Edge, Point> {
  const { x: l, y: t, w, h } = rect;
  return {
    left:   { x: l,         y: t + h / 2 },
    right:  { x: l + w,     y: t + h / 2 },
    top:    { x: l + w / 2, y: t         },
    bottom: { x: l + w / 2, y: t + h     },
  };
}

function pickEdges(a: CardRect, b: CardRect): { edgeA: Edge; edgeB: Edge } {
  const la = a.x, ra = la + a.w;
  const lb = b.x, rb = lb + b.w;
  const ta = a.y, ba = ta + a.h;
  const tb = b.y, bb = tb + b.h;
  if (lb >= ra - 8) return { edgeA: 'right',  edgeB: 'left'   };
  if (la >= rb - 8) return { edgeA: 'left',   edgeB: 'right'  };
  if (tb >= ba - 8) return { edgeA: 'bottom', edgeB: 'top'    };
  if (ta >= bb - 8) return { edgeA: 'top',    edgeB: 'bottom' };
  const dx = (lb + b.w / 2) - (la + a.w / 2);
  const dy = (tb + b.h / 2) - (ta + a.h / 2);
  if (Math.abs(dx) >= Math.abs(dy))
    return dx >= 0 ? { edgeA: 'right', edgeB: 'left' } : { edgeA: 'left', edgeB: 'right' };
  return dy >= 0   ? { edgeA: 'bottom', edgeB: 'top' } : { edgeA: 'top', edgeB: 'bottom' };
}

function elbowPath(
  p1: Point, edge1: Edge, offset1: number,
  p2: Point, edge2: Edge, offset2: number
): { d: string; midX: number; midY: number } {
  const isHoriz1 = edge1 === 'left' || edge1 === 'right';
  const isHoriz2 = edge2 === 'left' || edge2 === 'right';
  const sx = p1.x + (isHoriz1 ? 0 : offset1);
  const sy = p1.y + (isHoriz1 ? offset1 : 0);
  const ex = p2.x + (isHoriz2 ? 0 : offset2);
  const ey = p2.y + (isHoriz2 ? offset2 : 0);
  const isHoriz = isHoriz1;

  let d: string, seg1: number, seg2: number, seg3: number, midX: number, midY: number;
  if (isHoriz) {
    const bx = (sx + ex) / 2;
    seg1 = Math.abs(bx - sx);
    seg2 = Math.abs(ey - sy);
    seg3 = Math.abs(ex - bx);
    d = `M ${sx} ${sy} L ${bx} ${sy} L ${bx} ${ey} L ${ex} ${ey}`;
    const half = (seg1 + seg2 + seg3) / 2;
    if (half <= seg1) {
      midX = sx + (seg1 ? (half / seg1) * (bx - sx) : 0); midY = sy;
    } else if (half <= seg1 + seg2) {
      const t = (half - seg1) / (seg2 || 1);
      midX = bx; midY = sy + t * (ey - sy);
    } else {
      const t = (half - seg1 - seg2) / (seg3 || 1);
      midX = bx + t * (ex - bx); midY = ey;
    }
  } else {
    const by = (sy + ey) / 2;
    seg1 = Math.abs(by - sy);
    seg2 = Math.abs(ex - sx);
    seg3 = Math.abs(ey - by);
    d = `M ${sx} ${sy} L ${sx} ${by} L ${ex} ${by} L ${ex} ${ey}`;
    const half = (seg1 + seg2 + seg3) / 2;
    if (half <= seg1) {
      midX = sx; midY = sy + (seg1 ? (half / seg1) * (by - sy) : 0);
    } else if (half <= seg1 + seg2) {
      const t = (half - seg1) / (seg2 || 1);
      midX = sx + t * (ex - sx); midY = by;
    } else {
      const t = (half - seg1 - seg2) / (seg3 || 1);
      midX = ex; midY = by + t * (ey - by);
    }
  }
  return { d, midX, midY };
}

const OFFSET_STEP = 12;

const JoinConnector: React.FC<JoinConnectorProps> = ({ joins, cardRects }) => {
  type Resolved = { j: JoinInfo; rectA: CardRect; rectB: CardRect; edgeA: Edge; edgeB: Edge };

  // Pass 1: resolve cards and edges
  const resolved: Resolved[] = joins
    .filter(j => j.leftTable && j.rightTable && cardRects[j.leftTable] && cardRects[j.rightTable])
    .map(j => {
      const rectA = cardRects[j.leftTable];
      const rectB = cardRects[j.rightTable];
      const { edgeA, edgeB } = pickEdges(rectA, rectB);
      return { j, rectA, rectB, edgeA, edgeB };
    });

  if (!resolved.length) return null;

  // Pass 2: group by card+edge for spreading
  const edgeSlots = new Map<string, Resolved[]>();
  resolved.forEach(entry => {
    const keyA = `${entry.j.leftTable}:${entry.edgeA}`;
    if (!edgeSlots.has(keyA)) edgeSlots.set(keyA, []);
    edgeSlots.get(keyA)!.push(entry);
    const keyB = `${entry.j.rightTable}:${entry.edgeB}`;
    if (!edgeSlots.has(keyB)) edgeSlots.set(keyB, []);
    edgeSlots.get(keyB)!.push(entry);
  });

  // Pass 3: compute paths and badge midpoints
  const paths: Array<{ d: string }> = [];
  const badges: Array<{ x: number; y: number }> = [];

  resolved.forEach(({ j, rectA, rectB, edgeA, edgeB }) => {
    const edgesA = cardEdges(rectA);
    const edgesB = cardEdges(rectB);

    const slotA = edgeSlots.get(`${j.leftTable}:${edgeA}`) || [];
    const idxA = slotA.findIndex(e => e.j === j);
    const offset1 = (idxA - (slotA.length - 1) / 2) * OFFSET_STEP;

    const slotB = edgeSlots.get(`${j.rightTable}:${edgeB}`) || [];
    const idxB = slotB.findIndex(e => e.j === j);
    const offset2 = (idxB - (slotB.length - 1) / 2) * OFFSET_STEP;

    const { d, midX, midY } = elbowPath(
      edgesA[edgeA], edgeA, offset1,
      edgesB[edgeB], edgeB, offset2
    );
    paths.push({ d });
    badges.push({ x: Math.round(midX - 16), y: Math.round(midY - 7) });
  });

  return (
    <>
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 0, color: 'var(--rd-sys-color-content-primary)' }}
        aria-hidden="true"
      >
        {paths.map((p, i) => (
          <path key={i} d={p.d} stroke="currentColor" strokeWidth="1.5" fill="none" />
        ))}
      </svg>
      {badges.map((b, i) => (
        <div
          key={i}
          style={{ position: 'absolute', left: b.x, top: b.y, zIndex: 1, pointerEvents: 'none' }}
        >
          <img src="/spotter-assets/Join UI.svg" width="32" height="14" alt="join" />
        </div>
      ))}
    </>
  );
};

export default JoinConnector;
