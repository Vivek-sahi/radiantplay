import React from 'react';
import { systemColors } from '../../tokens/colors';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

// ─── Shared sub-components ────────────────────────────────────────────────────

const AIHighlightsBtn: React.FC = () => (
  <button style={{
    display: 'flex', alignItems: 'center', gap: '6px',
    height: '32px', padding: '0 14px', border: 'none',
    borderRadius: '999px', backgroundColor: brand,
    cursor: 'pointer', fontFamily: font, fontSize: '12.5px', fontWeight: 600, color: '#FFFFFF',
  }}>
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M6.5 1L7.8 4.7l3.7 1.3-3.7 1.3L6.5 11l-1.3-3.7L1.5 6l3.7-1.3z" fill="white" />
    </svg>
    AI Highlights
  </button>
);

const IconBtn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {children}
  </button>
);

const FilterChip: React.FC<{ label: string }> = ({ label }) => (
  <button style={{
    height: '28px', padding: '0 12px',
    border: '1px solid #E5E7EB', borderRadius: '999px',
    backgroundColor: '#FFFFFF', cursor: 'pointer',
    fontFamily: font, fontSize: '12px', color: '#374151',
    display: 'flex', alignItems: 'center',
  }}>
    {label}
  </button>
);

const SpotterChip: React.FC = () => (
  <button style={{
    display: 'flex', alignItems: 'center', gap: '5px',
    height: '26px', padding: '0 10px',
    border: '1px solid #E5E7EB', borderRadius: '999px',
    backgroundColor: '#F9FAFB', cursor: 'pointer',
    fontFamily: font, fontSize: '12px', color: '#374151',
  }}>
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <circle cx="5.5" cy="5.5" r="4.5" stroke="#6B7280" strokeWidth="1.1" />
      <circle cx="4" cy="4.5" r="1" fill="#6B7280" />
      <circle cx="7" cy="4.5" r="1" fill="#6B7280" />
      <path d="M3.5 7c.5.8 3.5.8 4 0" stroke="#6B7280" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
    Spotter
  </button>
);

const DotsBtn: React.FC = () => (
  <button style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="2" cy="6" r="1.1" fill="#6B7280" /><circle cx="6" cy="6" r="1.1" fill="#6B7280" /><circle cx="10" cy="6" r="1.1" fill="#6B7280" />
    </svg>
  </button>
);

// ─── Sparkline path helpers ───────────────────────────────────────────────────

const BLUE_SPARKLINE   = 'M0,44 C5,40 8,30 15,35 C22,40 25,20 32,15 C39,10 42,25 50,30 C57,35 60,20 67,18 C74,16 78,25 85,22 C90,20 95,30 100,40 C105,50 108,35 115,30 C120,25 125,38 130,36 C135,34 140,40 145,45';
const PURPLE_SPARKLINE = 'M0,20 C5,15 10,30 17,40 C24,50 28,20 35,10 C42,0 46,30 53,35 C60,40 64,15 71,20 C78,25 82,18 89,22 C95,26 100,35 107,38 C113,41 118,28 125,25 C130,22 136,32 145,36';
const TEAL_SPARKLINE   = 'M0,50 C8,48 15,45 22,42 C30,38 35,40 42,38 C50,36 55,32 62,28 C70,24 75,28 82,25 C90,22 95,26 102,24 C110,22 116,26 123,28 C130,30 136,32 145,34';

type SparklineColor = 'blue' | 'purple' | 'teal';

const SPARKLINE_PATHS: Record<SparklineColor, string> = { blue: BLUE_SPARKLINE, purple: PURPLE_SPARKLINE, teal: TEAL_SPARKLINE };
const SPARKLINE_STROKES: Record<SparklineColor, string> = { blue: brand, purple: '#8B5CF6', teal: '#14B8A6' };
const SPARKLINE_FILLS: Record<SparklineColor, string> = { blue: `${brand}18`, purple: '#8B5CF618', teal: '#14B8A618' };

const Sparkline: React.FC<{ color: SparklineColor }> = ({ color }) => {
  const path = SPARKLINE_PATHS[color];
  const stroke = SPARKLINE_STROKES[color];
  const fill = SPARKLINE_FILLS[color];
  const endX = 145, endY = color === 'blue' ? 45 : color === 'purple' ? 36 : 34;
  return (
    <svg width="100%" height="60" viewBox="0 0 145 60" preserveAspectRatio="none" style={{ display: 'block', marginTop: '8px' }}>
      <path d={path + ` L145,60 L0,60 Z`} fill={fill} />
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx={endX} cy={endY} r="3.5" fill={stroke} />
      <rect x="80" y="50" width="58" height="12" rx="3" fill="white" stroke="#E5E7EB" strokeWidth="0.8" />
      <text x="109" y="59" textAnchor="middle" fontFamily={font} fontSize="8.5" fill="#6B7280">As expected</text>
    </svg>
  );
};

// ─── Trend card ───────────────────────────────────────────────────────────────

const TrendCard: React.FC<{
  title: string;
  period: string;
  date: string;
  value: string;
  change: number;
  vs: string;
  color: SparklineColor;
  showSpotter?: boolean;
}> = ({ title, period, date, value, change, vs, color, showSpotter }) => {
  const isPos = change > 0;
  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2px' }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{title}</div>
        {showSpotter && (
          <div style={{ display: 'flex', gap: '6px', marginLeft: '8px', flexShrink: 0 }}>
            <button style={{ width: '28px', height: '26px', borderRadius: '6px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 9.5C2 6 5 1.5 5.5 1.5S9 6 9 9.5" stroke="#6B7280" strokeWidth="1" strokeLinecap="round" /><path d="M5.5 8a.5.5 0 100 1 .5.5 0 000-1z" fill="#6B7280" /></svg>
            </button>
            <SpotterChip />
            <DotsBtn />
          </div>
        )}
      </div>
      <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font }}>{period}</div>
      <div style={{ fontSize: '11.5px', color: '#9CA3AF', fontFamily: font, marginTop: '1px' }}>{date}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', fontFamily: font, marginTop: '8px', letterSpacing: '-0.6px' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
        <span style={{ backgroundColor: isPos ? '#D1FAE5' : '#FEE2E2', color: isPos ? '#065F46' : '#991B1B', borderRadius: '4px', padding: '2px 6px', fontFamily: font, fontSize: '11.5px', fontWeight: 600 }}>
          {isPos ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
        </span>
        <span style={{ fontFamily: font, fontSize: '11.5px', color: '#6B7280' }}>{vs}</span>
      </div>
      <Sparkline color={color} />
      <button style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: font, fontSize: '12.5px', fontWeight: 500, color: brand, marginTop: '6px' }}>
        Analyse change
      </button>
    </div>
  );
};

// ─── Monthly bar chart data ───────────────────────────────────────────────────

const MONTHLY_DATA = [
  { label: 'Mar 2024', val: 594210, display: '594.21K' },
  { label: 'Apr 2024', val: 885670, display: '885.67K' },
  { label: 'May 2024', val: 83280, display: '83.28K' },
  { label: 'Jun 2024', val: 61400, display: '61.4K' },
  { label: 'Jul 2024', val: 69070, display: '69.07K' },
  { label: 'Aug 2024', val: 65670, display: '65.67K' },
  { label: 'Sep 2024', val: 1210000, display: '1.21M' },
  { label: 'Oct 2024', val: 2790000, display: '2.79M' },
  { label: 'Nov 2024', val: 3690000, display: '3.69M' },
  { label: 'Dec 2024', val: 4630000, display: '4.63M' },
  { label: 'Jan 2025', val: 5000000, display: '5M' },
  { label: 'Feb 2025', val: 3200000, display: '3.2M' },
  { label: 'Mar 2025', val: 4070000, display: '4.07M' },
  { label: 'Apr 2025', val: 3680000, display: '3.68M' },
  { label: 'May 2025', val: 3890000, display: '3.89M' },
  { label: 'Jun 2025', val: 4210000, display: '4.21M' },
  { label: 'Jul 2025', val: 198570, display: '198.57K' },
  { label: 'Aug 2025', val: 217630, display: '217.63K' },
  { label: 'Sep 2025', val: 156900, display: '156.9K' },
  { label: 'Oct 2025', val: 79120, display: '79.12K' },
  { label: 'Nov 2025', val: 2100000, display: '2.1M' },
  { label: 'Dec 2025', val: 246600, display: '246.6K' },
  { label: 'Jan 2026', val: 73250, display: '73.25K' },
  { label: 'Feb 2026', val: 100710, display: '100.71K' },
  { label: 'Mar 2026', val: 53530, display: '53.53K' },
];

// ─── BillingQueryStatsPageContent ────────────────────────────────────────────

export const BillingQueryStatsPageContent: React.FC = () => {
  const maxVal = 5000000;
  const chartH = 220, barW = 28, barGap = 6;
  const chartW = MONTHLY_DATA.length * (barW + barGap);

  // X-axis labels: every other month
  const xAxisLabels = ['Mar 2024', 'May 2024', 'Jul 2024', 'Sept 2024', 'Nov 2024', 'Jan 2025', 'Mar 2025', 'May 2025', 'Jul 2025', 'Sept 2025', 'Nov 2025', 'Jan 2026', 'Mar 2026'];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827', fontFamily: font, letterSpacing: '-0.3px' }}>Billable Query Stats Liveboard</span>
              {[
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#9CA3AF" strokeWidth="1.3"/><path d="M7 6.5v4M7 5h.01" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.5l1.5 3.2 3.5.5-2.5 2.4.6 3.5L7 9.3l-3.1 1.8.6-3.5L2 5.2l3.5-.5z" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="6" width="8" height="6" rx="1.5" stroke="#9CA3AF" strokeWidth="1.3"/><path d="M5 6V4.5a2 2 0 014 0V6" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 7A5 5 0 112 7" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round"/><path d="M12 3.5V7h-3.5" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
              ].map((icon, i) => <span key={i} style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AIHighlightsBtn />
              <IconBtn><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v9M4 4l3-3 3 3M2 11h10" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></IconBtn>
              <IconBtn><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="7" r="1.2" fill="#6B7280"/><circle cx="7" cy="7" r="1.2" fill="#6B7280"/><circle cx="11" cy="7" r="1.2" fill="#6B7280"/></svg></IconBtn>
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #F3F4F6' }}>
            <FilterChip label="Connection Name (Select)" />
            <FilterChip label="User Name (Select)" />
            <FilterChip label="Org Name (Select)" />
          </div>

          {/* Content */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Row 1: 3 trend cards + 1 stacked KPI */}
            <div style={{ display: 'flex', gap: '16px' }}>
              <TrendCard title="Query Count Trend" period="daily" date="24/03/FY 2027" value="1.66K" change={-50.30} vs="vs 23/03/FY 2027 (3.33K)" color="blue" />
              <TrendCard title="Query Co..." period="weekly" date="Week of 16/03/FY 2027" value="14.29K" change={-20.40} vs="vs Week of 09/03/FY 2027 (17.95K)" color="purple" showSpotter />
              <TrendCard title="Query Count Trend" period="monthly" date="Feb FY 2027" value="100.71K" change={37.49} vs="vs Jan FY 2026 (73.25K)" color="teal" />

              {/* Stacked KPI card */}
              <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '18px 18px 20px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>Total Query Count</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, marginTop: '2px' }}>all time</div>
                  <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827', fontFamily: font, marginTop: '10px', letterSpacing: '-0.8px' }}>41.35M</div>
                </div>
                <div style={{ padding: '18px 18px 20px', backgroundColor: '#FFFFFF' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>Total Query Count</div>
                  <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, marginTop: '2px' }}>last 60 days</div>
                  <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827', fontFamily: font, marginTop: '10px', letterSpacing: '-0.8px' }}>172.23K</div>
                </div>
              </div>
            </div>

            {/* Row 2: Monthly bar chart (full width) */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font, marginBottom: '20px' }}>Query Count, Monthly</div>
              <div style={{ overflowX: 'auto' }}>
                <div style={{ position: 'relative', minWidth: `${chartW + 60}px` }}>
                  {/* Y-axis labels */}
                  <div style={{ position: 'absolute', left: 0, top: 0, width: '48px', height: `${chartH}px`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: '8px', boxSizing: 'border-box' }}>
                    {['10M', '5M', '0'].map((l) => <span key={l} style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: font }}>{l}</span>)}
                  </div>
                  {/* Y-axis title */}
                  <div style={{ position: 'absolute', left: '-32px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '10px', color: '#9CA3AF', fontFamily: font, whiteSpace: 'nowrap' }}>Billable Query Count</div>

                  <svg width={chartW + 10} height={chartH + 60} viewBox={`0 0 ${chartW + 10} ${chartH + 60}`} style={{ marginLeft: '48px' }}>
                    {/* Gridlines */}
                    {[0, 0.5, 1].map((r, i) => (
                      <line key={i} x1="0" y1={r * chartH} x2={chartW + 10} y2={r * chartH} stroke="#F3F4F6" strokeWidth="1" />
                    ))}
                    {/* Bars */}
                    {MONTHLY_DATA.map((d, i) => {
                      const barH = Math.max(2, (d.val / maxVal) * chartH);
                      const x = i * (barW + barGap);
                      const y = chartH - barH;
                      return (
                        <g key={i}>
                          <rect x={x} y={y} width={barW} height={barH} fill={brand} rx="2" />
                          {/* Value label above bar */}
                          <text
                            x={x + barW / 2} y={Math.max(y - 3, 10)}
                            textAnchor="middle" fontFamily={font} fontSize="7.5" fill="#6B7280"
                            transform={`rotate(-60, ${x + barW / 2}, ${Math.max(y - 3, 10)})`}
                          >
                            {d.display}
                          </text>
                          {/* X-axis label (every other) */}
                          {xAxisLabels.includes(d.label) && (
                            <text
                              x={x + barW / 2} y={chartH + 14}
                              textAnchor="middle" fontFamily={font} fontSize="9" fill="#9CA3AF"
                            >
                              {d.label}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {/* X-axis title */}
                    <text x={chartW / 2} y={chartH + 30} textAnchor="middle" fontFamily={font} fontSize="10" fill="#6B7280">
                      Monthly Query Start Date ↑
                    </text>
                    {/* Scroll indicator */}
                    <rect x={chartW / 2 - 24} y={chartH + 44} width="48" height="5" rx="2.5" fill="#D1D5DB" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Row 3: Daily chart + Connection table */}
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Daily bar chart */}
              <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', minHeight: '200px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>Query Count, Daily</div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, marginTop: '2px', marginBottom: '16px' }}>last 30 days</div>
                <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="none">
                  {/* Grid */}
                  {[0, 0.5, 1].map((r, i) => <line key={i} x1="0" y1={r * 100} x2="400" y2={r * 100} stroke="#F3F4F6" strokeWidth="1" />)}
                  <text x="0" y="10" fontFamily={font} fontSize="9" fill="#9CA3AF">10K</text>
                  {/* Bars */}
                  {Array.from({ length: 30 }, (_, i) => {
                    const h = Math.max(4, Math.random() * 80 + 10);
                    return <rect key={i} x={i * 13 + 2} y={100 - h} width={10} height={h} fill={brand} rx="1.5" />;
                  })}
                </svg>
                <div style={{ textAlign: 'center', marginTop: '4px' }}>
                  <div style={{ width: '48px', height: '5px', backgroundColor: '#D1D5DB', borderRadius: '2.5px', display: 'inline-block' }} />
                </div>
              </div>

              {/* Connection table */}
              <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827', fontFamily: font }}>Query Count by Connection</div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, marginTop: '2px', marginBottom: '16px' }}>all time</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #E5E7EB' }}>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textAlign: 'left', paddingBottom: '10px', paddingRight: '12px' }}>Connection Name</th>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textAlign: 'right', paddingBottom: '10px', paddingRight: '12px', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>Query Count <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M2 6l3 3 3-3" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                      </th>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textAlign: 'right', paddingBottom: '10px' }}>Unique Count User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Metrics Connection',  count: '38.93M', users: 829 },
                      { name: 'Sales Analytics',     count: '12.41M', users: 412 },
                      { name: 'Finance DB',          count: '8.76M',  users: 238 },
                      { name: 'Operations DW',       count: '5.34M',  users: 174 },
                      { name: 'Marketing CDP',       count: '3.18M',  users: 96  },
                      { name: 'Product Analytics',   count: '1.92M',  users: 67  },
                    ].map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ fontSize: '12.5px', color: '#374151', padding: '9px 12px 9px 0' }}>{r.name}</td>
                        <td style={{ fontSize: '12.5px', color: '#374151', textAlign: 'right', padding: '9px 12px 9px 0' }}>{r.count}</td>
                        <td style={{ fontSize: '12.5px', color: '#374151', textAlign: 'right', padding: '9px 0' }}>{r.users}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingQueryStatsPageContent;
