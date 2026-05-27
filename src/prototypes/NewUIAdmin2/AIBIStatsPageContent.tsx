import React, { useState } from 'react';
import { systemColors } from '../../tokens/colors';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

// ─── Shared icons ──────────────────────────────────────────────────────────────

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

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'adoption' | 'credit' | 'groups' | 'performance' | 'prod';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  title: string;
  subtitle?: string;
  value: string;
}> = ({ title, subtitle, value }) => (
  <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</div>
    {subtitle && <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, lineHeight: 1.4 }}>{subtitle}</div>}
    <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827', fontFamily: font, marginTop: '10px', letterSpacing: '-0.8px' }}>{value}</div>
  </div>
);

// ─── Sparkline path helpers ───────────────────────────────────────────────────

function makeSparklinePath(points: [number, number][], w: number, h: number): string {
  if (points.length < 2) return '';
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const toX = (x: number) => ((x - minX) / rangeX) * w;
  const toY = (y: number) => h - 6 - ((y - minY) / rangeY) * (h - 10);
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p[0]).toFixed(1)},${toY(p[1]).toFixed(1)}`).join(' ');
}

// ─── Sparkline Card ───────────────────────────────────────────────────────────

const SparklineCard: React.FC<{
  title: string;
  subtitle: string;
  date: string;
  value: string;
  change: number;
  comparison: string;
  sparkPoints?: [number, number][];
}> = ({ title, subtitle, date, value, change, comparison, sparkPoints }) => {
  const isPositive = change > 0;
  const fillId = `spark-${title.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;
  const defaultPts: [number, number][] = [[0,60],[20,52],[40,44],[60,48],[80,38],[100,42],[120,50],[140,40],[160,30],[180,24],[200,20]];
  const pts = sparkPoints || defaultPts;
  const W = 210, H = 72;
  const linePath = makeSparklinePath(pts, W, H);
  const lastPt = pts[pts.length - 1];
  const xs = pts.map(p => p[0]);
  const ys = pts.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const endX = ((lastPt[0] - minX) / rangeX) * W;
  const endY = H - 6 - ((lastPt[1] - minY) / rangeY) * (H - 10);

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</div>
      <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font }}>{subtitle}</div>
      <div style={{ fontSize: '11.5px', color: '#9CA3AF', fontFamily: font, marginTop: '1px' }}>{date}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', fontFamily: font, marginTop: '8px', letterSpacing: '-0.6px' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', backgroundColor: isPositive ? '#D1FAE5' : '#FEE2E2', color: isPositive ? '#065F46' : '#991B1B', borderRadius: '4px', padding: '2px 6px', fontFamily: font, fontSize: '11.5px', fontWeight: 600 }}>
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
        </span>
        <span style={{ fontFamily: font, fontSize: '11.5px', color: '#6B7280' }}>{comparison}</span>
      </div>
      <div style={{ position: 'relative', marginTop: '12px', height: '72px' }}>
        <svg width="100%" height="72" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={`${linePath} L${W},${H} L0,${H} Z`} fill={`url(#${fillId})`} />
          <path d={linePath} fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={endX} cy={endY} r="3.5" fill="#3B82F6" />
        </svg>
      </div>
      <button style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: font, fontSize: '12.5px', fontWeight: 500, color: brand, marginTop: '4px' }}>
        Analyse change
      </button>
    </div>
  );
};

// ─── Hourly Active Users — stacked area chart ─────────────────────────────────

const DAYS = [
  { label: 'Monday',    color: '#22C55E' },
  { label: 'Tuesday',   color: '#EAB308' },
  { label: 'Wednesday', color: '#F59E0B' },
  { label: 'Thursday',  color: '#F97316' },
  { label: 'Friday',    color: '#EF4444' },
  { label: 'Saturday',  color: '#93C5FD' },
  { label: 'Sunday',    color: '#3B82F6' },
];

// Profiles per day — values represent users active at each hour 0-23
const DAY_PROFILES: number[][] = [
  // Monday
  [2,1,1,1,2,5,20,60,120,140,130,110,90,120,110,90,70,50,30,20,12,8,5,3],
  // Tuesday
  [2,1,1,1,2,4,18,55,110,130,120,100,85,110,100,85,65,45,28,18,10,7,4,2],
  // Wednesday
  [2,1,1,1,2,4,16,50,100,120,115,95,80,100,95,80,60,42,25,16,9,6,4,2],
  // Thursday
  [2,1,1,1,2,3,14,45,90,110,105,90,75,90,85,72,55,38,22,14,8,5,3,2],
  // Friday
  [2,1,1,1,2,3,12,40,80,95,90,78,65,78,72,62,48,34,20,12,7,4,3,2],
  // Saturday
  [1,1,1,1,1,2,5,15,30,40,38,32,28,30,28,24,18,14,9,6,4,3,2,1],
  // Sunday
  [1,1,1,1,1,2,4,12,25,32,30,26,22,24,22,20,15,11,7,5,3,2,2,1],
];

const HourlyUsersCard: React.FC = () => {
  const W = 620, H = 200;
  const padL = 44, padR = 12, padT = 12, padB = 44;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const hours = 24;

  // Compute cumulative stacks
  const stacks: number[][] = Array.from({ length: hours }, (_, h) => {
    let cum = 0;
    return DAY_PROFILES.map(dp => { cum += dp[h]; return cum; });
  });
  const maxVal = Math.max(...stacks.map(s => s[s.length - 1]));

  const toX = (h: number) => padL + (h / (hours - 1)) * chartW;
  const toY = (v: number) => padT + chartH - (v / maxVal) * chartH;

  // Build stacked area paths per day layer
  const paths = DAYS.map((_, di) => {
    const topPoints = Array.from({ length: hours }, (_, h) => [toX(h), toY(stacks[h][di])]);
    const bottomPoints = di === 0
      ? Array.from({ length: hours }, (_, h) => [toX(h), toY(0)])
      : Array.from({ length: hours }, (_, h) => [toX(h), toY(stacks[h][di - 1])]);

    const topPath = topPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const bottomRev = [...bottomPoints].reverse().map((p, i) => `${i === 0 ? 'L' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    return `${topPath} ${bottomRev} Z`;
  });

  const xTickHours = [0,3,6,9,12,15,18,21,23];

  return (
    <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', flex: 2, minWidth: 0 }}>
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>Hourly Active Query Users</div>
      <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, marginBottom: '12px' }}>Per Day of Week in Filtered Range</div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginBottom: '12px' }}>
        {DAYS.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: d.color }} />
            <span style={{ fontSize: '11px', color: '#6B7280', fontFamily: font }}>{d.label}</span>
          </div>
        ))}
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Y labels */}
        <text x={padL - 6} y={padT + 4} textAnchor="end" fontFamily={font} fontSize="9" fill="#9CA3AF">1.6K</text>
        <text x={padL - 6} y={padT + chartH + 4} textAnchor="end" fontFamily={font} fontSize="9" fill="#9CA3AF">0</text>
        {/* Y-axis title */}
        <text transform={`rotate(-90, 8, ${padT + chartH / 2})`} x="8" y={padT + chartH / 2} textAnchor="middle" fontFamily={font} fontSize="9" fill="#6B7280">Unique Cou...</text>
        {/* Stacked areas */}
        {paths.map((d, i) => (
          <path key={i} d={d} fill={DAYS[i].color} fillOpacity="0.75" />
        ))}
        {/* X ticks */}
        {xTickHours.map(h => (
          <text key={h} x={toX(h)} y={H - 6} textAnchor="middle" fontFamily={font} fontSize="8.5" fill="#9CA3AF">{h}</text>
        ))}
        {/* X-axis title */}
        <text x={padL + chartW / 2} y={H - 26} textAnchor="middle" fontFamily={font} fontSize="9" fill="#6B7280">Hour of day TS Query Start Time - Fiscal</text>
      </svg>
    </div>
  );
};

// ─── Overview content ─────────────────────────────────────────────────────────

const OverviewContent: React.FC = () => {
  const kpiRow1 = [
    { title: 'Provisioned Users', subtitle: undefined, value: '3.03K' },
    { title: 'Weekly Active Users', subtitle: 'Last Week', value: '161' },
    { title: 'Monthly Active Users', subtitle: 'Last Month', value: '355' },
    { title: 'Quarterly Active Users', subtitle: 'Last Quarter', value: '490' },
    { title: 'Annual Active Users', subtitle: 'Last Year', value: '1.15K' },
    { title: 'Total Active Users', subtitle: 'All Time', value: '1.46K' },
  ];

  const sparkRow3 = [
    { title: 'Liveboard Object Vol...', subtitle: 'Per Month', date: 'Mar FY 2027', value: '325', change: -27.13, comparison: 'vs Feb FY 2027 (4...)' },
    { title: 'Answer Object Volume', subtitle: 'Per Month', date: 'Mar FY 2027', value: '1.85K', change: -40.91, comparison: 'vs Feb FY 2027 (3.)' },
    { title: 'Search Query Volume', subtitle: 'Per Month', date: 'Mar FY 2027', value: '3.84K', change: -4.99, comparison: 'vs Feb FY 2027 (4.0...)' },
    { title: 'Spotter Query Volume', subtitle: 'Per Month', date: 'Mar FY 2027', value: '2.03K', change: -66.04, comparison: 'vs Feb FY 2027 (5.97K)' },
    { title: 'Analyst Studio Query Volume', subtitle: 'Per Month', date: 'Mar FY 2027', value: '867', change: -10.43, comparison: 'vs Feb FY 2027 (968)' },
  ];

  // Declining sparkline points
  const decliningPts: [number, number][] = [[0,20],[20,28],[40,22],[60,35],[80,30],[100,42],[120,55],[140,50],[160,62],[180,70],[200,80]];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Row 1: 6 KPI cards */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {kpiRow1.map(k => <KpiCard key={k.title} title={k.title} subtitle={k.subtitle} value={k.value} />)}
      </div>

      {/* Row 2: WAU card + MAU card + Hourly chart */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
        <SparklineCard
          title="Weekly Active Users"
          subtitle="In Filtered Range"
          date="Week of 23/03/FY 2027"
          value="111"
          change={-31.06}
          comparison="vs Week of 16/03/FY 2027 (161)"
          sparkPoints={decliningPts}
        />
        <SparklineCard
          title="Monthly Active Users"
          subtitle="In Filtered Range"
          date="Mar FY 2027"
          value="319"
          change={-10.14}
          comparison="vs Feb FY 2027 (355)"
          sparkPoints={[[0,18],[30,24],[60,20],[90,30],[120,28],[150,38],[180,45],[210,55]]}
        />
        <HourlyUsersCard />
      </div>

      {/* Row 3: 5 sparkline cards */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {sparkRow3.map(s => (
          <SparklineCard
            key={s.title}
            title={s.title}
            subtitle={s.subtitle}
            date={s.date}
            value={s.value}
            change={s.change}
            comparison={s.comparison}
            sparkPoints={decliningPts}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Placeholder tab content ──────────────────────────────────────────────────

const PlaceholderContent: React.FC<{ tabName: string }> = ({ tabName }) => {
  const configs: Record<string, { kpis: { title: string; subtitle?: string; value: string }[]; sparks: { title: string; subtitle: string; date: string; value: string; change: number; comparison: string }[] }> = {
    adoption: {
      kpis: [
        { title: 'New Users (30d)', subtitle: 'Onboarded last 30 days', value: '142' },
        { title: 'Feature Adoption Rate', subtitle: 'Users using 3+ features', value: '67.4%' },
        { title: 'Spotter Adoption', subtitle: 'Used Spotter, last 30 days', value: '1.14K' },
        { title: 'Retention Rate', subtitle: 'Active 3+ consecutive months', value: '83.2%' },
      ],
      sparks: [
        { title: 'New User Activations', subtitle: 'First-time active users per day', date: 'Mar FY 2027', value: '142', change: 18.3, comparison: 'vs Feb FY 2027 (120)' },
        { title: 'Spotter Sessions', subtitle: 'AI query sessions, last month', date: 'Mar FY 2027', value: '4.87K', change: 31.2, comparison: 'vs Feb FY 2027 (3.71K)' },
      ],
    },
    credit: {
      kpis: [
        { title: 'Credits Consumed', subtitle: 'Total credits used, last 30 days', value: '128.4K' },
        { title: 'Credits Remaining', subtitle: 'Balance as of today', value: '341.6K' },
        { title: 'Avg Daily Burn', subtitle: 'Average credits per day', value: '4.28K' },
        { title: 'Projected Runout', subtitle: 'Estimated depletion date', value: '~80 days' },
      ],
      sparks: [
        { title: 'Daily Credit Consumption', subtitle: 'Credits used per day', date: 'Mar FY 2027', value: '4.28K', change: -8.2, comparison: 'vs Feb FY 2027 (4.66K)' },
        { title: 'AI Credit Usage', subtitle: 'Credits consumed by AI features', date: 'Mar FY 2027', value: '1.92K', change: 12.4, comparison: 'vs Feb FY 2027 (1.71K)' },
      ],
    },
    groups: {
      kpis: [
        { title: 'Total Groups', subtitle: 'All active groups', value: '247' },
        { title: 'Active Groups (30d)', subtitle: 'Groups with activity, last 30 days', value: '189' },
        { title: 'Avg Group Size', subtitle: 'Average members per group', value: '12.3' },
        { title: 'Empty Groups', subtitle: 'Groups with no members', value: '14' },
      ],
      sparks: [
        { title: 'Group Activity', subtitle: 'Groups active per day', date: 'Mar FY 2027', value: '189', change: 5.6, comparison: 'vs Feb FY 2027 (179)' },
        { title: 'New Groups Created', subtitle: 'Groups created, last month', date: 'Mar FY 2027', value: '23', change: -13.2, comparison: 'vs Feb FY 2027 (26.5)' },
      ],
    },
    performance: {
      kpis: [
        { title: 'Avg Query Latency', subtitle: 'Average response time', value: '1.2s' },
        { title: 'P95 Latency', subtitle: '95th percentile response time', value: '3.8s' },
        { title: 'Error Rate', subtitle: 'Queries with errors, last 30 days', value: '0.3%' },
        { title: 'Cache Hit Rate', subtitle: 'Queries served from cache', value: '72.1%' },
      ],
      sparks: [
        { title: 'Daily Avg Latency', subtitle: 'Average query latency per day', date: 'Mar FY 2027', value: '1.2s', change: -4.0, comparison: 'vs Feb FY 2027 (1.25s)' },
        { title: 'Error Volume', subtitle: 'Total errors per day', date: 'Mar FY 2027', value: '142', change: 8.4, comparison: 'vs Feb FY 2027 (131)' },
      ],
    },
    prod: {
      kpis: [
        { title: 'Prod Cluster Uptime', subtitle: 'Last 30 days', value: '99.98%' },
        { title: 'Deployments (30d)', subtitle: 'Prod deployments, last 30 days', value: '8' },
        { title: 'Incidents (30d)', subtitle: 'Production incidents', value: '2' },
        { title: 'Mean Recovery Time', subtitle: 'Average time to resolve', value: '18m' },
      ],
      sparks: [
        { title: 'Prod Query Volume', subtitle: 'Queries in production per day', date: 'Mar FY 2027', value: '12.4K', change: 3.1, comparison: 'vs Feb FY 2027 (12.0K)' },
        { title: 'Error Rate Trend', subtitle: 'Production errors per day', date: 'Mar FY 2027', value: '0.3%', change: -15.0, comparison: 'vs Feb FY 2027 (0.35%)' },
      ],
    },
  };

  const cfg = configs[tabName];
  if (!cfg) return null;

  const declPts: [number, number][] = [[0,20],[30,28],[60,24],[90,36],[120,32],[150,44],[180,55],[210,62]];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        {cfg.kpis.map(k => <KpiCard key={k.title} title={k.title} subtitle={k.subtitle} value={k.value} />)}
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        {cfg.sparks.map(s => (
          <SparklineCard key={s.title} title={s.title} subtitle={s.subtitle} date={s.date} value={s.value} change={s.change} comparison={s.comparison} sparkPoints={declPts} />
        ))}
      </div>
    </div>
  );
};

// ─── AIBIStatsPageContent ─────────────────────────────────────────────────────

export const AIBIStatsPageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview',     label: 'Overview' },
    { id: 'adoption',     label: 'Adoption' },
    { id: 'credit',       label: 'Credit Consumption' },
    { id: 'groups',       label: 'Groups' },
    { id: 'performance',  label: 'Performance' },
    { id: 'prod',         label: 'Prod >' },
  ];

  const filterChips = [
    'Org (Select)',
    'User != (empty), {Null}',
    'TS Query Start Time Last 180 Days (26/09/2025 < 25...',
    'Group (Select)',
    'Is Billable true',
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {/* Liveboard container */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>

          {/* Liveboard header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0', borderBottom: '1px solid #E5E7EB' }}>
            {/* Left: title + icons + divider + tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
                <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827', fontFamily: font, letterSpacing: '-0.3px' }}>
                  AI and BI System Liveboard
                </span>
                <InfoIcon />
                <StarIcon />
                <LockIcon />
                <RefreshIcon />
              </div>

              {/* Vertical divider */}
              <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E7EB', margin: '0 16px 16px', flexShrink: 0 }} />

              {/* Tabs */}
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '0 14px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: font, fontSize: '13.5px', fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? brand : '#6B7280', borderBottom: activeTab === tab.id ? `2px solid ${brand}` : '2px solid transparent', marginBottom: '-1px', transition: 'color 0.15s', whiteSpace: 'nowrap' }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: AI Highlights + share + dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #F3F4F6' }}>
            {filterChips.map(chip => (
              <button key={chip} style={{ height: '28px', padding: '0 12px', border: '1px solid #E5E7EB', borderRadius: '999px', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: font, fontSize: '12px', color: '#374151', display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {chip}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '20px' }}>
            {activeTab === 'overview'    && <OverviewContent />}
            {activeTab === 'adoption'    && <PlaceholderContent tabName="adoption" />}
            {activeTab === 'credit'      && <PlaceholderContent tabName="credit" />}
            {activeTab === 'groups'      && <PlaceholderContent tabName="groups" />}
            {activeTab === 'performance' && <PlaceholderContent tabName="performance" />}
            {activeTab === 'prod'        && <PlaceholderContent tabName="prod" />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AIBIStatsPageContent;
