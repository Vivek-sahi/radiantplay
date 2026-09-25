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
  // Optional interactive selection — omitted by default (all existing
  // consumers keep the purely decorative, non-interactive connector lines).
  // When provided, each join line/badge becomes clickable and the selected
  // one is highlighted.
  selectedJoinKey?: string;
  onSelectJoin?: (join: JoinInfo) => void;
  // Additive, opt-in: renders an explicit preview (eye) button beside each
  // join badge. SearchDataOnDataModelFinal's explicit-preview direction only
  // (2026-09-23); omit to keep every other consumer's badges unchanged.
  onPreviewJoin?: (join: JoinInfo) => void;
  // Additive, opt-in (2026-09-24, the eye-icon direction): a badge click opens
  // the consumer's join menu (Preview / Edit join / Delete join) instead of
  // selecting directly — matching the product's join-click behaviour. Line
  // clicks keep onSelectJoin. Omitted, badges select as before.
  onJoinMenu?: (join: JoinInfo, e: React.MouseEvent) => void;
  // Product-reference visual skin (2026-09-25): light grey line instead of
  // content-primary, plus a crow's foot where the line meets the right table
  // — matching the product screenshot. Omitted, lines render as before.
  skin?: 'product';
}

export function joinKey(j: JoinInfo): string {
  return `${j.leftTable}::${j.rightTable}`;
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

const JoinConnector: React.FC<JoinConnectorProps> = ({ joins, cardRects, selectedJoinKey, onSelectJoin, onPreviewJoin, onJoinMenu, skin }) => {
  const interactive = !!onSelectJoin;
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
  const paths: Array<{ d: string; j: JoinInfo; footD?: string }> = [];
  const badges: Array<{ x: number; y: number; j: JoinInfo }> = [];

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
    // Product skin: crow's foot where the line meets the right table's edge —
    // two angled prongs to either side of the entry point (the line itself is
    // the middle prong), fanned along the edge like the reference screenshot.
    let footD: string | undefined;
    if (skin === 'product') {
      const isHorizB = edgeB === 'left' || edgeB === 'right';
      const ex = edgesB[edgeB].x + (isHorizB ? 0 : offset2);
      const ey = edgesB[edgeB].y + (isHorizB ? offset2 : 0);
      // All three prongs land exactly on the card edge, like the product
      // (2026-09-25, Vivek: "the central line is, the other 2 are not") —
      // the earlier float came from stale card widths, fixed in cardRects.
      const stem = 12, fan = 7;
      if (edgeB === 'left')   footD = `M ${ex - stem} ${ey} L ${ex} ${ey - fan} M ${ex - stem} ${ey} L ${ex} ${ey + fan}`;
      if (edgeB === 'right')  footD = `M ${ex + stem} ${ey} L ${ex} ${ey - fan} M ${ex + stem} ${ey} L ${ex} ${ey + fan}`;
      if (edgeB === 'top')    footD = `M ${ex} ${ey - stem} L ${ex - fan} ${ey} M ${ex} ${ey - stem} L ${ex + fan} ${ey}`;
      if (edgeB === 'bottom') footD = `M ${ex} ${ey + stem} L ${ex - fan} ${ey} M ${ex} ${ey + stem} L ${ex + fan} ${ey}`;
    }
    paths.push({ d, j, footD });
    // Badge centred on the line's midpoint — the product-skin capsule is
    // 40×22, the legacy Join UI.svg is 32×14.
    badges.push(skin === 'product'
      ? { x: Math.round(midX - 20), y: Math.round(midY - 11), j }
      : { x: Math.round(midX - 16), y: Math.round(midY - 7), j });
  });

  return (
    <>
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible', zIndex: 0, color: 'var(--rd-sys-color-content-primary)' }}
        aria-hidden="true"
      >
        {paths.map((p, i) => {
          const selected = interactive && joinKey(p.j) === selectedJoinKey;
          return (
            <g key={i}>
              {interactive && (
                <path
                  d={p.d}
                  stroke="transparent"
                  strokeWidth="12"
                  fill="none"
                  style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                  onClick={() => onSelectJoin?.(p.j)}
                />
              )}
              <path
                d={p.d}
                stroke={selected ? 'var(--rd-sys-color-content-brand, #2770EF)' : skin === 'product' ? 'var(--rd-sys-color-border-default, #d5dae2)' : 'currentColor'}
                strokeWidth={selected ? 2 : 1.5}
                fill="none"
                style={{ pointerEvents: 'none' }}
              />
              {p.footD && (
                <path
                  d={p.footD}
                  stroke={selected ? 'var(--rd-sys-color-content-brand, #2770EF)' : 'var(--rd-sys-color-border-default, #d5dae2)'}
                  strokeWidth={selected ? 2 : 1.5}
                  strokeLinecap="round"
                  fill="none"
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </g>
          );
        })}
      </svg>
      {badges.map((b, i) => (
        <div
          key={i}
          onClick={onJoinMenu ? e => { e.stopPropagation(); onJoinMenu(b.j, e); } : interactive ? () => onSelectJoin?.(b.j) : undefined}
          style={{ position: 'absolute', left: b.x, top: b.y, zIndex: 1, pointerEvents: interactive || onPreviewJoin || onJoinMenu ? 'auto' : 'none', cursor: interactive || onJoinMenu ? 'pointer' : undefined }}
        >
          {skin === 'product' ? (
            // Product-reference badge (2026-09-25, Vivek's screenshot): a
            // white capsule with Radiant's inner-join rings — replacing the
            // legacy two-glyph Join UI.svg.
            <div style={{
              width: 40, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--rd-sys-color-background-base, #fff)',
              // Capsule stroke matches the join line; only the rings stay ink
              // (2026-09-25, Vivek).
              border: '1.5px solid var(--rd-sys-color-border-default, #d5dae2)', borderRadius: 11, boxSizing: 'border-box',
              color: 'var(--rd-sys-color-content-primary, #1d232f)',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M4.66667 10.1111C6.38489 10.1111 7.77778 8.71823 7.77778 7.00001C7.77778 5.28179 6.38489 3.8889 4.66667 3.8889C2.94845 3.8889 1.55556 5.28179 1.55556 7.00001C1.55556 8.71823 2.94845 10.1111 4.66667 10.1111ZM4.66667 11.6667C7.24399 11.6667 9.33333 9.57734 9.33333 7.00001C9.33333 4.42268 7.24399 2.33334 4.66667 2.33334C2.08934 2.33334 0 4.42268 0 7.00001C0 9.57734 2.08934 11.6667 4.66667 11.6667Z" fill="currentColor"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M9.33333 10.1111C11.0516 10.1111 12.4444 8.71823 12.4444 7.00001C12.4444 5.28179 11.0516 3.8889 9.33333 3.8889C7.61511 3.8889 6.22222 5.28179 6.22222 7.00001C6.22222 8.71823 7.61511 10.1111 9.33333 10.1111ZM9.33333 11.6667C11.9107 11.6667 14 9.57734 14 7.00001C14 4.42268 11.9107 2.33334 9.33333 2.33334C6.75601 2.33334 4.66667 4.42268 4.66667 7.00001C4.66667 9.57734 6.75601 11.6667 9.33333 11.6667Z" fill="currentColor"/>
              </svg>
            </div>
          ) : (
            <img src="/spotter-assets/Join UI.svg" width="32" height="14" alt="join" />
          )}
          {onPreviewJoin && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onPreviewJoin(b.j); }}
              title="Preview join data"
              style={{
                position: 'absolute', left: skin === 'product' ? 44 : 36, top: skin === 'product' ? 1 : -3, width: 20, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--rd-sys-color-border-default, #d5dae2)', borderRadius: 10,
                background: 'var(--rd-sys-color-background-base, #fff)', cursor: 'pointer', padding: 0,
                color: 'var(--rd-sys-color-content-secondary, #6b7280)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M1.8 8s2.3-4.3 6.2-4.3S14.2 8 14.2 8s-2.3 4.3-6.2 4.3S1.8 8 1.8 8z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="1.9" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </>
  );
};

export default JoinConnector;
