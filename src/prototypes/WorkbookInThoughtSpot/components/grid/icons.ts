// Single-colour 12×12 icon paths (stroke), shared by the canvas painter and the DOM overlays.
export const ICON_PATHS: Record<string, string> = {
  'sort-asc': 'M6 10V2M2.5 5.5 6 2l3.5 3.5',
  'sort-desc': 'M6 2v8M2.5 6.5 6 10l3.5-3.5',
  filter: 'M1.5 2h9L7 6.5V10L5 9V6.5z',
  fx: 'M5 10c1 0 1.2-.8 1.4-2l.9-5c.2-1 .5-1.5 1.5-1.5M4.5 4.5h4',
  input: 'M2 10l.6-2.4L8 2.2a1.1 1.1 0 0 1 1.6 0l.2.2a1.1 1.1 0 0 1 0 1.6L4.4 9.4z',
  key: 'M1.5 6a2 2 0 1 0 4 0 2 2 0 1 0-4 0M5.5 6H11M9 6v2M11 6v1.5',
  chev: 'M3 4.5 6 7.5l3-3',
  plus: 'M6 2v8M2 6h8',
  x: 'M3 3l6 6M9 3 3 9',
  check: 'M2.5 6.2 5 8.6l4.5-5',
  search: 'M1.8 5.2a3.4 3.4 0 1 0 6.8 0 3.4 3.4 0 1 0-6.8 0M7.8 7.8 10.5 10.5',
  warn: 'M6 1.5 11 10.5H1zM6 5v2.4M6 9v.1',
  info: 'M1 6a5 5 0 1 0 10 0A5 5 0 1 0 1 6M6 5.5v3M6 3.6v.1',
  lock: 'M2.5 5.5h7v5h-7zM4 5.5V4a2 2 0 0 1 4 0v1.5',
  menu: 'M2 3h8M2 6h8M2 9h8',
  left: 'M7.5 3 4.5 6l3 3',
  right: 'M4.5 3l3 3-3 3',
  up: 'M3 7.5 6 4.5l3 3',
  calendar: 'M1.5 2.5h9v8h-9zM1.5 5h9M4 1v2.5M8 1v2.5',
  answer: 'M2 10V6M5 10V3M8 10V5M11 10H1',
  table: 'M1.5 2h9v8h-9zM1.5 5h9M4.5 5v5',
  hide: 'M1 6s2-3.5 5-3.5S11 6 11 6s-2 3.5-5 3.5S1 6 1 6zM2 2l8 8',
  rename: 'M1.5 9.5h9M3 7.5l4.5-4.5 1.5 1.5L4.5 9H3z',
  trash: 'M2 3h8M4.5 3V1.8h3V3M3 3l.6 7.2h4.8L9 3',
  copy: 'M3.5 3.5h6v7h-6zM2.5 8.5v-7h5',
  spin: 'M6 1.5a4.5 4.5 0 1 0 4.5 4.5',
};

const cache = new Map<string, Path2D>();
export function iconPath(name: string): Path2D {
  let p = cache.get(name);
  if (!p) {
    p = new Path2D(ICON_PATHS[name] ?? ICON_PATHS.info);
    cache.set(name, p);
  }
  return p;
}

/** The error badge is a filled circle with a mark, not a stroke icon. */
export function drawErrorBadge(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, mark: string) {
  const r = size / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + r, y + r, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mark;
  ctx.fillRect(x + r - 0.75, y + size * 0.24, 1.5, size * 0.32);
  ctx.fillRect(x + r - 0.75, y + size * 0.66, 1.5, 1.5);
}

export function drawIcon(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 12, size / 12);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke(iconPath(name));
  ctx.restore();
}
