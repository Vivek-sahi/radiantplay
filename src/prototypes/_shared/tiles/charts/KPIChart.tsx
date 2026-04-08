import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartFont, chartUi } from '../chartPalette';

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
  const isUp   = trend > 0;
  const isFlat = trend === 0;
  const trendColor = isFlat ? chartUi.labelColor : isUp ? '#06BF7F' : '#E22B3D';
  const trendBg    = isFlat ? '#F6F8FA'           : isUp ? '#E0F8EF' : '#FFEBEC';
  const arrow      = isFlat ? '→' : isUp ? '↑' : '↓';
  // Figma: 74.54 and % are separate spans, both 12px/500 in the same badge
  const trendAbs   = Math.abs(trend).toFixed(2);

  const sparkOption = {
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
        lineStyle: { color: '#2770EF', width: 1.5 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(39,112,239,0.18)' },
              { offset: 1, color: 'rgba(39,112,239,0.02)' },
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
        paddingLeft: 4,
      }}
    >
      {/* ── KPI info ── */}
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, paddingLeft: 4 }}>

        {/* Period — 14px / 400 / #777E8B */}
        <div style={{ fontSize: 14, fontWeight: 400, color: chartUi.labelColor, lineHeight: '20px' }}>
          {period}
        </div>

        {/* Value — Title/Page Title: 24px / Medium(500) / 32px lh / -0.096px tracking */}
        <div
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: '#1D232F',
            lineHeight: '32px',
            letterSpacing: '-0.096px',
          }}
        >
          {value}
        </div>

        {/* Comparison row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
          {/* Badge: arrow + number + % — Figma: 12px/500/#06BF7F on #E0F8EF */}
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

          {/* "vs FY 2024" — 14px / 400 / #777E8B */}
          <span style={{ fontSize: 14, fontWeight: 400, color: chartUi.labelColor, lineHeight: '20px', whiteSpace: 'nowrap' }}>
            {trendLabel}
          </span>

          {/* "(US$15.65M)" — 14px / 400 / #777E8B */}
          {trendCompare && (
            <span style={{ fontSize: 14, fontWeight: 400, color: chartUi.labelColor, lineHeight: '20px', whiteSpace: 'nowrap' }}>
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
        {/* "As expected" — Figma: bg-#F2F7FF, border-top: 1px solid white, 12px/500/#777E8B */}
        {status && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: '#F2F7FF',
              borderTop: '1px solid #ffffff',
              padding: '2px 8px',
              fontSize: 12,
              fontWeight: 500,
              color: chartUi.labelColor,
              lineHeight: '18px',
              letterSpacing: '-0.072px',
              pointerEvents: 'none',
            }}
          >
            {status}
          </div>
        )}
      </div>

      {/* ── Analyze link — 14px / 400 / #2770EF ── */}
      {analyzeLabel && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: '#2770EF',
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
