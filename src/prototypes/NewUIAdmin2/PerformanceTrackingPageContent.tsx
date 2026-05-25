import React, { useState } from 'react';
import { systemColors } from '../../tokens/colors';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

// ─── Shared header icons ──────────────────────────────────────────────────────

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="#9CA3AF" strokeWidth="1.3" />
    <path d="M7 6.5v4M7 5h.01" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5l1.5 3.2 3.5.5-2.5 2.4.6 3.5L7 9.3l-3.1 1.8.6-3.5L2 5.2l3.5-.5z" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="3" y="6" width="8" height="6" rx="1.5" stroke="#9CA3AF" strokeWidth="1.3" />
    <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M12 7A5 5 0 112 7" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M12 3.5V7h-3.5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1v9M4 4l3-3 3 3M2 11h10" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DotsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="3" cy="7" r="1.2" fill="#6B7280" />
    <circle cx="7" cy="7" r="1.2" fill="#6B7280" />
    <circle cx="11" cy="7" r="1.2" fill="#6B7280" />
  </svg>
);

const SparkleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M6.5 1L7.8 4.7l3.7 1.3-3.7 1.3L6.5 11l-1.3-3.7L1.5 6l3.7-1.3z" fill="white" />
  </svg>
);

// ─── Scatter plot data (~80 points) [xPct 0-1, yVal 0-12] ───────────────────

const SCATTER_POINTS: [number, number][] = [
  [0.04,1.2],[0.06,2.1],[0.08,0.8],[0.09,1.8],[0.12,2.8],[0.14,1.1],[0.15,3.2],[0.17,0.9],
  [0.19,2.4],[0.21,1.5],[0.23,3.8],[0.24,0.7],[0.26,1.9],[0.28,2.2],[0.30,4.1],[0.31,1.3],
  [0.33,2.7],[0.35,0.6],[0.36,3.4],[0.38,1.7],[0.40,2.9],[0.41,4.3],[0.43,1.0],[0.44,2.5],
  [0.46,3.1],[0.47,0.8],[0.49,1.6],[0.51,2.0],[0.52,4.8],[0.53,1.4],[0.55,3.6],[0.57,2.3],
  [0.58,1.1],[0.60,4.5],[0.61,0.9],[0.63,2.8],[0.64,1.7],[0.66,3.3],[0.67,0.5],[0.69,2.1],
  [0.70,4.0],[0.72,1.8],[0.73,3.7],[0.75,2.4],[0.76,1.3],[0.78,4.2],[0.79,0.7],[0.81,3.0],
  [0.82,2.6],[0.84,1.5],[0.85,3.9],[0.87,4.7],[0.88,2.2],[0.90,1.0],[0.91,3.5],[0.92,0.6],
  [0.05,8.2],[0.18,9.1],[0.32,8.7],[0.50,10.3],[0.65,9.5],[0.80,11.0],[0.94,8.9],
  [0.10,1.4],[0.20,3.0],[0.40,2.2],[0.60,1.8],[0.75,3.5],[0.88,2.9],[0.95,1.6],
  [0.03,0.5],[0.16,1.9],[0.27,2.6],[0.42,1.1],[0.56,3.8],[0.68,2.0],[0.83,4.4],[0.93,1.3],
];

// ─── User Queries and Latency — scatter plot card ─────────────────────────────

const ScatterCard: React.FC = () => {
  const W = 560, H = 240;
  const padL = 52, padR = 16, padT = 16, padB = 48;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxY = 12;

  const toX = (xPct: number) => padL + xPct * chartW;
  const toY = (yVal: number) => padT + chartH - (yVal / maxY) * chartH;

  const xLabels = ['01/01/2026','15/01/2026','29/01/2026','12/02/2026','26/02/2026','12/03/2026'];
  const yLabels = [0, 10, 20];

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', flex: 1.4, minWidth: 0 }}>
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font, marginBottom: '16px' }}>
        User Queries and Latency
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Gridlines + Y labels */}
        {yLabels.map((v, i) => {
          const y = padT + (i === 0 ? chartH : i === 1 ? chartH / 2 : 0);
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#F3F4F6" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontFamily={font} fontSize="9" fill="#9CA3AF">{v}</text>
            </g>
          );
        })}
        {/* Y-axis title */}
        <text transform={`rotate(-90, 10, ${padT + chartH / 2})`} x="10" y={padT + chartH / 2} textAnchor="middle" fontFamily={font} fontSize="9" fill="#6B7280">
          Average latency in...
        </text>
        {/* Trend line */}
        <line x1={toX(0.02)} y1={toY(1.5)} x2={toX(0.96)} y2={toY(3.2)} stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
        {/* Scatter dots */}
        {SCATTER_POINTS.map(([xPct, yVal], i) => (
          <circle key={i} cx={toX(xPct)} cy={toY(yVal)} r="3.5" fill="#8B5CF6" fillOpacity="0.75" />
        ))}
        {/* X labels */}
        {xLabels.map((label, i) => (
          <text key={label} x={padL + (i / (xLabels.length - 1)) * chartW} y={H - 6} textAnchor="middle" fontFamily={font} fontSize="8.5" fill="#9CA3AF">{label}</text>
        ))}
        {/* X-axis title */}
        <text x={padL + chartW / 2} y={H - 32} textAnchor="middle" fontFamily={font} fontSize="9" fill="#6B7280">Daily Timestamp ↑</text>
      </svg>
    </div>
  );
};

// ─── Average Latency Trend — line chart card ──────────────────────────────────

const LatencyTrendCard: React.FC = () => {
  const W = 380, H = 200;
  const padL = 36, padR = 16, padT = 16, padB = 48;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const redPoints: [number, number][] = [[0,140],[40,120],[80,80],[120,100],[160,60],[200,80],[240,110]];

  const toSvgX = (x: number) => padL + (x / 300) * chartW;
  const toSvgY = (y: number) => padT + y;

  const solidPath = redPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${toSvgX(p[0])},${toSvgY(p[1])}`).join(' ');
  const dottedPath = `M${toSvgX(240)},${toSvgY(110)} L${toSvgX(300)},${toSvgY(130)}`;
  const bluePath = `M${toSvgX(0)},${toSvgY(150)} L${toSvgX(300)},${toSvgY(100)}`;

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>Average Latency Trend</div>
      <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, marginBottom: '16px' }}>Last 60 Days</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Gridlines + Y labels */}
        {[1, 2, 3].map((v, i) => {
          const y = padT + (i === 0 ? chartH * 0.25 : i === 1 ? chartH * 0.55 : chartH * 0.85);
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#F3F4F6" strokeWidth="1" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontFamily={font} fontSize="9" fill="#9CA3AF">{v}</text>
            </g>
          );
        })}
        {/* Y-axis title */}
        <text transform={`rotate(-90, 8, ${padT + chartH / 2})`} x="8" y={padT + chartH / 2} textAnchor="middle" fontFamily={font} fontSize="9" fill="#6B7280">
          Average latency in...
        </text>
        {/* Blue trend */}
        <path d={bluePath} fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" />
        {/* Red solid */}
        <path d={solidPath} fill="none" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Red dotted extension */}
        <path d={dottedPath} fill="none" stroke="#EF4444" strokeWidth="1.8" strokeDasharray="4 3" strokeLinecap="round" />
        {/* X labels */}
        {['19/01/2026','23/02/2026'].map((label, i) => (
          <text key={label} x={padL + (i / 1) * chartW * 0.85} y={H - 6} textAnchor="middle" fontFamily={font} fontSize="8.5" fill="#9CA3AF">{label}</text>
        ))}
        {/* X-axis title */}
        <text x={padL + chartW / 2} y={H - 30} textAnchor="middle" fontFamily={font} fontSize="9" fill="#6B7280">Weekly Timestamp - Fiscal ↑</text>
      </svg>
    </div>
  );
};

// ─── Latency Ratio Bar Chart ──────────────────────────────────────────────────

const LatencyRatioCard: React.FC<{ title: string; showSpotter?: boolean }> = ({ title, showSpotter = false }) => {
  const W = 360, H = 400;
  const padL = 48, padR = 16, padT = 16, padB = 60;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const buckets = [0.93, 0.04, 0.02, 0.01, 0.005];
  const barCount = buckets.length;
  const barW = (chartW / barCount) * 0.6;
  const barGap = chartW / barCount;
  const yLabels = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font, flex: 1 }}>{title}</div>
        {showSpotter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '999px', padding: '2px 10px', fontSize: '11.5px', fontFamily: font, color: '#374151' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <ellipse cx="6" cy="6" rx="5" ry="3.5" stroke="#9CA3AF" strokeWidth="1.2" />
                <circle cx="6" cy="6" r="1.5" fill="#9CA3AF" />
              </svg>
              Spotter
            </span>
            <button style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DotsIcon />
            </button>
          </div>
        )}
      </div>
      <div style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: font, marginBottom: '16px', lineHeight: 1.5 }}>
        0 = % requests in &quot;zero to one second&quot; 1 = % requests in &quot;one to two seconds&quot; etc.
      </div>
      <div style={{ position: 'relative' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
          {/* Gridlines + Y labels */}
          {yLabels.map((v) => {
            const y = padT + chartH - v * chartH;
            return (
              <g key={v}>
                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#F3F4F6" strokeWidth="1" />
                <text x={padL - 6} y={y + 4} textAnchor="end" fontFamily={font} fontSize="9" fill="#9CA3AF">{v}</text>
              </g>
            );
          })}
          {/* Y-axis title */}
          <text transform={`rotate(-90, 8, ${padT + chartH / 2})`} x="8" y={padT + chartH / 2} textAnchor="middle" fontFamily={font} fontSize="9" fill="#6B7280">
            Request Percentage
          </text>
          {/* Bars */}
          {buckets.map((val, i) => {
            const barH = Math.max(2, val * chartH);
            const x = padL + i * barGap + (barGap - barW) / 2;
            const y = padT + chartH - barH;
            return (
              <g key={i}>
                <rect x={x} y={y} width={barW} height={barH} fill="#5EEAD4" rx="2" />
                {i === 0 && (
                  <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontFamily={font} fontSize="10" fill="#374151" fontWeight={600}>
                    {val.toFixed(2)}
                  </text>
                )}
                <text x={x + barW / 2} y={padT + chartH + 16} textAnchor="middle" fontFamily={font} fontSize="10" fill="#9CA3AF">{i}</text>
              </g>
            );
          })}
          {/* Scrollbar indicator */}
          <rect x={W / 2 - 30} y={H - 18} width={60} height={8} rx="4" fill="#E5E7EB" />
          <rect x={W / 2 - 12} y={H - 18} width={24} height={8} rx="4" fill="#D1D5DB" />
        </svg>
      </div>
    </div>
  );
};

// ─── PerformanceTrackingPageContent ──────────────────────────────────────────

export const PerformanceTrackingPageContent: React.FC = () => {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {/* Liveboard container */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Liveboard header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 16px', borderBottom: '1px solid #E5E7EB' }}>
            {/* Left: title + icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827', fontFamily: font, letterSpacing: '-0.3px' }}>
                Performance Tracking Liveboard
              </span>
              <InfoIcon />
              <StarIcon />
              <LockIcon />
              <RefreshIcon />
            </div>

            {/* Right: AI Highlights + share + dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 14px', border: 'none', borderRadius: '999px', backgroundColor: brand, cursor: 'pointer', fontFamily: font, fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF' }}>
                <SparkleIcon />
                AI Highlights
              </button>
              <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShareIcon />
              </button>
              <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DotsIcon />
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <button style={{ height: '28px', padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: '999px', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: font, fontSize: '12px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Org Name (Select)
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Row 1 */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
              <ScatterCard />
              <LatencyTrendCard />
            </div>

            {/* Row 2 */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
              <LatencyRatioCard title="Data Query Latency Ratio (secs) Last 7 days" showSpotter />
              <LatencyRatioCard title="Data Query Latency Ratio (secs) Last 30 days" />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default PerformanceTrackingPageContent;
