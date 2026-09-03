/**
 * Ported from https://github.com/phamfoo/figma-squircle
 * MIT License — phamfoo
 *
 * Generates an SVG path string that exactly matches Figma's corner-smoothing algorithm.
 */

// ── distribute.ts ─────────────────────────────────────────────────────────────

type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
type Side = 'top' | 'left' | 'right' | 'bottom';

interface Adjacent {
  side: Side;
  corner: Corner;
}

interface NormalizedCorner {
  radius: number;
  roundingAndSmoothingBudget: number;
}

interface NormalizedCorners {
  topLeft: NormalizedCorner;
  topRight: NormalizedCorner;
  bottomLeft: NormalizedCorner;
  bottomRight: NormalizedCorner;
}

const adjacentsByCorner: Record<Corner, Adjacent[]> = {
  topLeft: [{ corner: 'topRight', side: 'top' }, { corner: 'bottomLeft', side: 'left' }],
  topRight: [{ corner: 'topLeft', side: 'top' }, { corner: 'bottomRight', side: 'right' }],
  bottomLeft: [{ corner: 'bottomRight', side: 'bottom' }, { corner: 'topLeft', side: 'left' }],
  bottomRight: [{ corner: 'bottomLeft', side: 'bottom' }, { corner: 'topRight', side: 'right' }],
};

function distributeAndNormalize({
  topLeftCornerRadius, topRightCornerRadius,
  bottomRightCornerRadius, bottomLeftCornerRadius,
  width, height,
}: {
  topLeftCornerRadius: number; topRightCornerRadius: number;
  bottomRightCornerRadius: number; bottomLeftCornerRadius: number;
  width: number; height: number;
}): NormalizedCorners {
  const budgetMap: Record<Corner, number> = { topLeft: -1, topRight: -1, bottomLeft: -1, bottomRight: -1 };
  const radiusMap: Record<Corner, number> = {
    topLeft: topLeftCornerRadius, topRight: topRightCornerRadius,
    bottomLeft: bottomLeftCornerRadius, bottomRight: bottomRightCornerRadius,
  };

  (Object.entries(radiusMap) as [Corner, number][])
    .sort(([, r1], [, r2]) => r2 - r1)
    .forEach(([corner, radius]) => {
      const budget = Math.min(...adjacentsByCorner[corner].map(adj => {
        const adjRadius = radiusMap[adj.corner];
        if (radius === 0 && adjRadius === 0) return 0;
        const sideLen = adj.side === 'top' || adj.side === 'bottom' ? width : height;
        return budgetMap[adj.corner] >= 0
          ? sideLen - budgetMap[adj.corner]
          : (radius / (radius + adjRadius)) * sideLen;
      }));
      budgetMap[corner] = budget;
      radiusMap[corner] = Math.min(radius, budget);
    });

  return {
    topLeft: { radius: radiusMap.topLeft, roundingAndSmoothingBudget: budgetMap.topLeft },
    topRight: { radius: radiusMap.topRight, roundingAndSmoothingBudget: budgetMap.topRight },
    bottomLeft: { radius: radiusMap.bottomLeft, roundingAndSmoothingBudget: budgetMap.bottomLeft },
    bottomRight: { radius: radiusMap.bottomRight, roundingAndSmoothingBudget: budgetMap.bottomRight },
  };
}

// ── draw.ts ───────────────────────────────────────────────────────────────────

interface CornerPathParams {
  a: number; b: number; c: number; d: number;
  p: number; cornerRadius: number; arcSectionLength: number;
}

function toRadians(deg: number) { return (deg * Math.PI) / 180; }

function rounded(strings: TemplateStringsArray, ...values: number[]): string {
  return strings.reduce((acc, str, i) => {
    const v = values[i];
    return acc + str + (typeof v === 'number' ? v.toFixed(4) : (v ?? ''));
  }, '');
}

function getPathParamsForCorner({
  cornerRadius, cornerSmoothing, preserveSmoothing, roundingAndSmoothingBudget,
}: {
  cornerRadius: number; cornerSmoothing: number;
  preserveSmoothing: boolean; roundingAndSmoothingBudget: number;
}): CornerPathParams {
  let p = (1 + cornerSmoothing) * cornerRadius;

  if (!preserveSmoothing) {
    const maxSmoothing = roundingAndSmoothingBudget / cornerRadius - 1;
    cornerSmoothing = Math.min(cornerSmoothing, maxSmoothing);
    p = Math.min(p, roundingAndSmoothingBudget);
  }

  const arcMeasure = 90 * (1 - cornerSmoothing);
  const arcSectionLength = Math.sin(toRadians(arcMeasure / 2)) * cornerRadius * Math.sqrt(2);
  const angleAlpha = (90 - arcMeasure) / 2;
  const p3ToP4 = cornerRadius * Math.tan(toRadians(angleAlpha / 2));
  const angleBeta = 45 * cornerSmoothing;
  const c = p3ToP4 * Math.cos(toRadians(angleBeta));
  const d = c * Math.tan(toRadians(angleBeta));
  let b = (p - arcSectionLength - c - d) / 3;
  let a = 2 * b;

  if (preserveSmoothing && p > roundingAndSmoothingBudget) {
    const maxDist = roundingAndSmoothingBudget - d - arcSectionLength - c;
    const minA = maxDist / 6;
    const maxB = maxDist - minA;
    b = Math.min(b, maxB);
    a = maxDist - b;
    p = Math.min(p, roundingAndSmoothingBudget);
  }

  return { a, b, c, d, p, arcSectionLength, cornerRadius };
}

function drawTopRightPath({ cornerRadius, a, b, c, d, p, arcSectionLength }: CornerPathParams) {
  return cornerRadius
    ? rounded`c ${a} 0 ${a + b} 0 ${a + b + c} ${d} a ${cornerRadius} ${cornerRadius} 0 0 1 ${arcSectionLength} ${arcSectionLength} c ${d} ${c} ${d} ${b + c} ${d} ${a + b + c}`
    : rounded`l ${p} 0`;
}

function drawBottomRightPath({ cornerRadius, a, b, c, d, p, arcSectionLength }: CornerPathParams) {
  return cornerRadius
    ? rounded`c 0 ${a} 0 ${a + b} ${-d} ${a + b + c} a ${cornerRadius} ${cornerRadius} 0 0 1 -${arcSectionLength} ${arcSectionLength} c ${-c} ${d} ${-(b + c)} ${d} ${-(a + b + c)} ${d}`
    : rounded`l 0 ${p}`;
}

function drawBottomLeftPath({ cornerRadius, a, b, c, d, p, arcSectionLength }: CornerPathParams) {
  return cornerRadius
    ? rounded`c ${-a} 0 ${-(a + b)} 0 ${-(a + b + c)} ${-d} a ${cornerRadius} ${cornerRadius} 0 0 1 -${arcSectionLength} -${arcSectionLength} c ${-d} ${-c} ${-d} ${-(b + c)} ${-d} ${-(a + b + c)}`
    : rounded`l ${-p} 0`;
}

function drawTopLeftPath({ cornerRadius, a, b, c, d, p, arcSectionLength }: CornerPathParams) {
  return cornerRadius
    ? rounded`c 0 ${-a} 0 ${-(a + b)} ${d} ${-(a + b + c)} a ${cornerRadius} ${cornerRadius} 0 0 1 ${arcSectionLength} -${arcSectionLength} c ${c} ${-d} ${b + c} ${-d} ${a + b + c} ${-d}`
    : rounded`l 0 ${-p}`;
}

function getSVGPathFromPathParams({
  width, height,
  topLeftPathParams, topRightPathParams, bottomLeftPathParams, bottomRightPathParams,
}: {
  width: number; height: number;
  topRightPathParams: CornerPathParams; bottomRightPathParams: CornerPathParams;
  bottomLeftPathParams: CornerPathParams; topLeftPathParams: CornerPathParams;
}) {
  return `M ${width - topRightPathParams.p} 0 ${drawTopRightPath(topRightPathParams)} L ${width} ${height - bottomRightPathParams.p} ${drawBottomRightPath(bottomRightPathParams)} L ${bottomLeftPathParams.p} ${height} ${drawBottomLeftPath(bottomLeftPathParams)} L 0 ${topLeftPathParams.p} ${drawTopLeftPath(topLeftPathParams)} Z`
    .replace(/[\t\s\n]+/g, ' ')
    .trim();
}

// ── public API ────────────────────────────────────────────────────────────────

export interface FigmaSquircleParams {
  cornerRadius?: number;
  topLeftCornerRadius?: number;
  topRightCornerRadius?: number;
  bottomRightCornerRadius?: number;
  bottomLeftCornerRadius?: number;
  cornerSmoothing: number;
  width: number;
  height: number;
  preserveSmoothing?: boolean;
}

export function getSvgPath({
  cornerRadius = 0,
  topLeftCornerRadius, topRightCornerRadius,
  bottomRightCornerRadius, bottomLeftCornerRadius,
  cornerSmoothing, width, height, preserveSmoothing = false,
}: FigmaSquircleParams): string {
  const tl = topLeftCornerRadius ?? cornerRadius;
  const tr = topRightCornerRadius ?? cornerRadius;
  const bl = bottomLeftCornerRadius ?? cornerRadius;
  const br = bottomRightCornerRadius ?? cornerRadius;

  if (tl === tr && tr === br && br === bl) {
    const budget = Math.min(width, height) / 2;
    const r = Math.min(tl, budget);
    const params = getPathParamsForCorner({ cornerRadius: r, cornerSmoothing, preserveSmoothing, roundingAndSmoothingBudget: budget });
    return getSVGPathFromPathParams({ width, height, topLeftPathParams: params, topRightPathParams: params, bottomLeftPathParams: params, bottomRightPathParams: params });
  }

  const { topLeft, topRight, bottomLeft, bottomRight } = distributeAndNormalize({
    topLeftCornerRadius: tl, topRightCornerRadius: tr,
    bottomRightCornerRadius: br, bottomLeftCornerRadius: bl,
    width, height,
  });

  return getSVGPathFromPathParams({
    width, height,
    topLeftPathParams: getPathParamsForCorner({ cornerSmoothing, preserveSmoothing, cornerRadius: topLeft.radius, roundingAndSmoothingBudget: topLeft.roundingAndSmoothingBudget }),
    topRightPathParams: getPathParamsForCorner({ cornerSmoothing, preserveSmoothing, cornerRadius: topRight.radius, roundingAndSmoothingBudget: topRight.roundingAndSmoothingBudget }),
    bottomRightPathParams: getPathParamsForCorner({ cornerSmoothing, preserveSmoothing, cornerRadius: bottomRight.radius, roundingAndSmoothingBudget: bottomRight.roundingAndSmoothingBudget }),
    bottomLeftPathParams: getPathParamsForCorner({ cornerSmoothing, preserveSmoothing, cornerRadius: bottomLeft.radius, roundingAndSmoothingBudget: bottomLeft.roundingAndSmoothingBudget }),
  });
}
