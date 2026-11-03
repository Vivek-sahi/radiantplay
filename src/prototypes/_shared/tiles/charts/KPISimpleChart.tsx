import React from 'react';
import { chartFont } from '../chartPalette';
import { compVar, sysVar } from '@tokens/colors';

/**
 * KPI (no sparkline) — shows only period, value and comparison row.
 * Sparkline, "As expected" badge and "Analyze →" are all hidden.
 */
interface Props {
  width?: number;
  height?: number;
  value?: string;
  period?: string;
  trend?: number;
  trendLabel?: string;
  trendCompare?: string;
}

export const KPISimpleChart: React.FC<Props> = ({
  value        = 'US$3.99M',
  period       = 'FY 2025',
  trend        = 74.54,
  trendLabel   = 'vs FY 2024',
  trendCompare = '(US$15.65M)',
}) => {
  const isUp   = trend > 0;
  const isFlat = trend === 0;
  const trendColor = isFlat ? compVar('chart-axis-label') : isUp ? sysVar('content-success') : sysVar('content-failure');
  const trendBg    = isFlat ? sysVar('background-sunken') : isUp ? sysVar('background-success') : sysVar('background-failure');
  const arrow      = isFlat ? '→' : isUp ? '↑' : '↓';
  const trendAbs   = Math.abs(trend).toFixed(2);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: chartFont,
        paddingLeft: 4,
        overflow: 'hidden',
      }}
    >
      {/* Period */}
      <div style={{ fontSize: 13, color: compVar('chart-axis-label'), lineHeight: '18px', flexShrink: 0 }}>
        {period}
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 500,
          color: sysVar('content-primary'),
          lineHeight: '32px',
          letterSpacing: '-0.096px',
          marginTop: 1,
          flexShrink: 0,
        }}
      >
        {value}
      </div>

      {/* Comparison row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: trendBg, borderRadius: 4, padding: '1px 4px' }}>
          <span style={{ fontSize: 11, fontWeight: 500, color: trendColor, lineHeight: '18px' }}>{arrow}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: trendColor, lineHeight: '18px', letterSpacing: '-0.072px' }}>{trendAbs}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: trendColor, lineHeight: '18px', letterSpacing: '-0.072px' }}>%</span>
        </span>
        <span style={{ fontSize: 14, fontWeight: 400, color: compVar('chart-axis-label'), lineHeight: '20px', whiteSpace: 'nowrap' }}>{trendLabel}</span>
        {trendCompare && (
          <span style={{ fontSize: 14, fontWeight: 400, color: compVar('chart-axis-label'), lineHeight: '20px', whiteSpace: 'nowrap' }}>{trendCompare}</span>
        )}
      </div>
    </div>
  );
};
