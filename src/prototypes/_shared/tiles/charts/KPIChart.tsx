import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartFont } from '../chartPalette';
import { useChartTheme } from '../chartTheme';
import { compVar, referenceColors, sysVar, systemColors } from '@tokens/colors';

/** "#RRGGBB" plus an alpha, as rgba(). The sparkline gradient needs literal colours. */
const withAlpha = (hex: string, alpha: number): string =>
  `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${alpha})`;

// ─── Sparkline data ───────────────────────────────────────────────────────────
const DEFAULT_SPARK = [
  72, 68, 74, 70, 66, 63, 67, 64, 69, 72, 70, 65, 67, 71, 74,
  70, 73, 76, 72, 75, 78, 74, 72, 76, 80, 77, 74, 78, 83, 88,
];

interface Props {
  width?: number;
  height?: number;
  // KPI content (title/description are rendered by AnswerTile above)
  value?: string;
  period?: string;
  trend?: number;           // positive = up, negative = down
  trendLabel?: string;      // "vs FY 2024"
  trendCompare?: string;    // "(US$15.65M)"
  status?: string;          // "As expected"
  sparkData?: number[];
  analyzeLabel?: string;
}

export const KPIChart: React.FC<Props> = ({
  value        = 'US$3.99M',
  period       = 'FY 2025',
  trend        = 74.54,
  trendLabel   = 'vs FY 2024',
  trendCompare = '(US$15.65M)',
  status       = 'As expected',
  sparkData    = DEFAULT_SPARK,
  analyzeLabel = 'Analyze →',
}) => {
  const { isDark } = useChartTheme();
  // ECharts needs literal colours, so read the brand token for the current theme
  const sparkColor = systemColors[isDark ? 'dark' : 'light']['content-brand'];
  const isUp   = trend > 0;
  const isFlat = trend === 0;
  const trendColor = isFlat ? compVar('chart-axis-label') : isUp ? sysVar('content-success') : sysVar('content-failure');
  const trendBg    = isFlat ? sysVar('background-sunken') : isUp ? sysVar('background-success') : sysVar('background-failure');
  const arrow      = isFlat ? '→' : isUp ? '↑' : '↓';
  // Figma: 74.54 and % are separate spans, both 12px/500 in the same badge
  const trendAbs   = Math.abs(trend).toFixed(2);

  const sparkOption = {
    backgroundColor: 'transparent',
    animation: false,
    grid: { top: 0, bottom: 0, left: 0, right: 0 },
    xAxis: { type: 'category', show: false, boundaryGap: false },
    yAxis: { type: 'value',    show: false, scale: false },
    series: [
      {
        type: 'line',
        data: sparkData,
        smooth: false,
        symbol: 'none',
        lineStyle: { color: sparkColor, width: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: withAlpha(sparkColor, 0.18) },
              { offset: 1, color: withAlpha(sparkColor, 0.02) },
            ],
          },
        },
      },
    ],
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: chartFont,
        overflow: 'hidden',
      }}
    >
      {/* ── KPI info ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, paddingLeft: 4 }}>

        {/* Period — 14px / 400 / chart-axis-label */}
        <div style={{ fontSize: 14, fontWeight: 400, color: compVar('chart-axis-label'), lineHeight: '20px' }}>
          {period}
        </div>

        {/* Value — Title/Page Title: 24px / Medium(500) / 32px lh / -0.096px tracking */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: sysVar('content-primary'),
            lineHeight: '32px',
            letterSpacing: '-0.096px',
          }}
        >
          {value}
        </div>

        {/* Comparison row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
          {/* Badge: arrow + number + % — Figma: 12px/500, content-success on background-success */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              background: trendBg,
              borderRadius: 4,
              padding: '1px 4px',
            }}
          >
            {/* Arrow icon — 12×12 (using text for now, matching Figma proportions) */}
            <span style={{ fontSize: 11, fontWeight: 500, color: trendColor, lineHeight: '18px' }}>
              {arrow}
            </span>
            {/* Number and % as separate spans — exact Figma structure */}
            <span style={{ fontSize: 12, fontWeight: 500, color: trendColor, lineHeight: '18px', letterSpacing: '-0.072px' }}>
              {trendAbs}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: trendColor, lineHeight: '18px', letterSpacing: '-0.072px' }}>
              %
            </span>
          </span>

          {/* "vs FY 2024" — 14px / 400 / chart-axis-label */}
          <span style={{ fontSize: 14, fontWeight: 400, color: compVar('chart-axis-label'), lineHeight: '20px', whiteSpace: 'nowrap' }}>
            {trendLabel}
          </span>

          {/* "(US$15.65M)" — 14px / 400 / chart-axis-label */}
          {trendCompare && (
            <span style={{ fontSize: 14, fontWeight: 400, color: compVar('chart-axis-label'), lineHeight: '20px', whiteSpace: 'nowrap' }}>
              {trendCompare}
            </span>
          )}
        </div>
      </div>

      {/* ── Sparkline — flex-1, fills remaining height ── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <ReactECharts
          option={sparkOption}
          notMerge
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'svg' }}
        />
        {/* "As expected" — Figma: bg brand-10, border-top border-gap, 12px/500 chart-axis-label */}
        {status && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: isDark ? sysVar('background-information') : referenceColors.brand['10'],
              borderTop: `1px solid ${sysVar('border-gap')}`,
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 500,
              color: compVar('chart-axis-label'),
              lineHeight: '18px',
              letterSpacing: '-0.072px',
              pointerEvents: 'none',
            }}
          >
            {status}
          </div>
        )}
      </div>

      {/* ── Analyze link — 14px / 400 / content-link ── */}
      {analyzeLabel && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: sysVar('content-link'),
            lineHeight: '20px',
            flexShrink: 0,
            cursor: 'pointer',
            paddingLeft: 4,
          }}
        >
          {analyzeLabel}
        </div>
      )}
    </div>
  );
};
