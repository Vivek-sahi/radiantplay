import React, { useState } from 'react';
import { systemColors } from '../../tokens/colors';

const font = '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const brand = systemColors.light['content-brand'];

type TabId = 'overview' | 'productivity' | 'object-usage' | 'object-stats';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard: React.FC<{
  title: string;
  subtitle: string;
  date?: string;
  value: string;
  style?: React.CSSProperties;
}> = ({ title, subtitle, date, value, style }) => (
  <div style={{
    backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: '12px', padding: '20px 20px 24px',
    display: 'flex', flexDirection: 'column', gap: '3px', flex: 1,
    ...style,
  }}>
    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</div>
    <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, lineHeight: 1.4 }}>{subtitle}</div>
    {date && <div style={{ fontSize: '11.5px', color: '#9CA3AF', fontFamily: font, marginTop: '1px' }}>{date}</div>}
    <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827', fontFamily: font, marginTop: '10px', letterSpacing: '-0.8px' }}>{value}</div>
  </div>
);

// ─── Sparkline Card ───────────────────────────────────────────────────────────

const SparklineCard: React.FC<{
  title: string;
  subtitle: string;
  date: string;
  value: string;
  change: number;
  comparison: string;
  label: string;
  variant: 'positive' | 'anomaly';
}> = ({ title, subtitle, date, value, change, comparison, label, variant }) => {
  const isPositive = change > 0;
  const lineColor = variant === 'positive' ? '#3B82F6' : '#3B82F6';
  const fillId = `fill-${title.replace(/\s/g, '')}`;

  const impressionsPath = 'M0,55 C15,48 25,30 40,22 C55,14 65,32 80,38 C95,44 105,50 120,46 C135,42 150,44 180,48 C190,50 200,52 210,54';
  const insightsPath   = 'M0,58 C10,52 20,40 35,28 C50,16 60,20 75,32 C90,44 105,50 120,50 C140,50 160,46 180,44 C195,43 205,44 210,45';

  const path = title.includes('Impressions') ? impressionsPath : insightsPath;

  return (
    <div style={{
      backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
      borderRadius: '12px', padding: '20px', flex: 1,
      display: 'flex', flexDirection: 'column', gap: '3px',
    }}>
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</div>
      <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font }}>{subtitle}</div>
      <div style={{ fontSize: '11.5px', color: '#9CA3AF', fontFamily: font, marginTop: '1px' }}>{date}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827', fontFamily: font, marginTop: '8px', letterSpacing: '-0.6px' }}>{value}</div>

      {/* Change badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          backgroundColor: isPositive ? '#D1FAE5' : '#FEE2E2',
          color: isPositive ? '#065F46' : '#991B1B',
          borderRadius: '4px', padding: '2px 6px',
          fontFamily: font, fontSize: '11.5px', fontWeight: 600,
        }}>
          {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
        </span>
        <span style={{ fontFamily: font, fontSize: '11.5px', color: '#6B7280' }}>{comparison}</span>
      </div>

      {/* Sparkline SVG */}
      <div style={{ position: 'relative', marginTop: '12px', height: '72px' }}>
        <svg width="100%" height="72" viewBox="0 0 210 72" preserveAspectRatio="none">
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={path + ' L210,72 L0,72 Z'} fill={`url(#${fillId})`} />
          <path d={path} fill="none" stroke={lineColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          {/* End dot */}
          <circle cx="210" cy={title.includes('Impressions') ? '54' : '45'} r="3.5" fill={lineColor} />
          {/* Label pill */}
          <rect x={title.includes('Impressions') ? '120' : '110'} y="58" width="80" height="14" rx="3" fill="white" stroke="#E5E7EB" strokeWidth="0.8" />
          <text x={title.includes('Impressions') ? '160' : '150'} y="68" textAnchor="middle" fontFamily={font} fontSize="9" fill="#6B7280">{label}</text>
        </svg>
      </div>

      <button style={{
        alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0,
        cursor: 'pointer', fontFamily: font, fontSize: '12.5px', fontWeight: 500,
        color: brand, marginTop: '4px',
      }}>
        Analyse change
      </button>
    </div>
  );
};

// ─── Champions Table ──────────────────────────────────────────────────────────

const CHAMPIONS = [
  { user: 'anshul.mehta@thoughtspot.com',      actions: '3.89K' },
  { user: 'damian.waldron@thoughtspot.com',     actions: '2.07K' },
  { user: 'sangeetha.mohan@thoughtspot.com',    actions: '1.16K' },
  { user: 'tsadmin',                            actions: '1.04K' },
  { user: 'siddhant.rohela@thoughtspot.com',    actions: '718' },
  { user: 'yagnika.sanagala@thoughtspot.com',   actions: '679' },
  { user: 'elizebeth.shaji@thoughtspot.com',    actions: '657' },
  { user: 'shaheel.roshankhan@thoughtspot.com', actions: '644' },
];

const ChampionsTable: React.FC = () => (
  <div style={{
    backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: '12px', padding: '20px',
    width: '380px', flexShrink: 0,
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>ThoughtSpot Champions</div>
    <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, marginTop: '3px', marginBottom: '16px' }}>
      Users who were most active, last 30 days
    </div>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: font }}>
      <thead>
        <tr style={{ borderBottom: '1.5px solid #E5E7EB' }}>
          <th style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textAlign: 'left', paddingBottom: '10px', paddingRight: '8px' }}>User</th>
          <th style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textAlign: 'right', paddingBottom: '10px', whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              User Actions
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1v8M2 6l3 3 3-3" stroke="#6B7280" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        {CHAMPIONS.map((c, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
            <td style={{ fontSize: '12.5px', color: '#374151', padding: '9px 8px 9px 0', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.user}</td>
            <td style={{ fontSize: '12.5px', color: '#374151', textAlign: 'right', padding: '9px 0' }}>{c.actions}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <div style={{ fontSize: '11.5px', color: '#9CA3AF', fontFamily: font, marginTop: '12px' }}>Showing 10 of 10 rows</div>
  </div>
);

// ─── Bar Chart Card ───────────────────────────────────────────────────────────

const BAR_DATA_SEARCHERS = [
  { label: 'priya.s...', value: 1820 },
  { label: 'rahul.v...', value: 1540 },
  { label: 'meera.k...', value: 1200 },
  { label: 'arun.b...', value: 980 },
  { label: 'kavya.r...', value: 870 },
  { label: 'sanjay.t...', value: 760 },
  { label: 'divya.m...', value: 640 },
  { label: 'nikhil.p...', value: 520 },
  { label: 'suma.n...', value: 410 },
  { label: 'vishal.c...', value: 310 },
];

const BAR_DATA_CONSUMERS = [
  { label: 'anjali.k...', value: 1950 },
  { label: 'ravi.s...', value: 1680 },
  { label: 'pooja.m...', value: 1420 },
  { label: 'suresh.r...', value: 1180 },
  { label: 'lakshmi.v...', value: 950 },
  { label: 'kiran.d...', value: 810 },
  { label: 'deepa.g...', value: 680 },
  { label: 'aditya.n...', value: 540 },
  { label: 'sneha.p...', value: 390 },
  { label: 'rohit.j...', value: 260 },
];

const BarChartCard: React.FC<{
  title: string;
  subtitle: string;
  data: { label: string; value: number }[];
}> = ({ title, subtitle, data }) => {
  const max = Math.max(...data.map((d) => d.value));
  const chartH = 160;
  const chartW = 260;
  const barW = Math.floor(chartW / data.length) - 4;
  const axisPad = 32;

  return (
    <div style={{
      backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
      borderRadius: '12px', padding: '20px', flex: 1,
    }}>
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827', fontFamily: font }}>{title}</div>
      <div style={{ fontSize: '12px', color: '#6B7280', fontFamily: font, marginTop: '3px', marginBottom: '16px' }}>{subtitle}</div>

      <div style={{ display: 'flex', gap: '0' }}>
        {/* Y-axis labels */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '20px', width: '32px', flexShrink: 0 }}>
          {[2000, 1500, 1000, 500, 0].map((v) => (
            <span key={v} style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: font, lineHeight: 1 }}>
              {v === 0 ? '' : `${v / 1000}K`}
            </span>
          ))}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="100%" height={chartH + 20} viewBox={`0 0 ${chartW + 10} ${chartH + 20}`} preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
              <line key={i}
                x1="0" y1={r * chartH} x2={chartW + 10} y2={r * chartH}
                stroke="#F3F4F6" strokeWidth="1"
              />
            ))}
            {/* Bars */}
            {data.map((d, i) => {
              const barH = Math.max(2, (d.value / max) * (chartH - 8));
              const x = i * (barW + 4);
              return (
                <g key={i}>
                  <rect
                    x={x} y={chartH - barH}
                    width={barW} height={barH}
                    fill={brand} rx="2"
                    fillOpacity="0.85"
                  />
                  <text
                    x={x + barW / 2} y={chartH + 14}
                    textAnchor="middle" fontFamily={font} fontSize="8.5" fill="#9CA3AF"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewContent: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    {/* Row 1: 4 KPI cards */}
    <div style={{ display: 'flex', gap: '16px' }}>
      <KpiCard title="MAU Last 30 Days"   subtitle="Active Users, last 30 days"                          value="442"   />
      <KpiCard title="WAU Last Week"      subtitle="Weekly Active Users, last week" date="Week of 16/03/FY 2027" value="231"   />
      <KpiCard title="Unique Count User"  subtitle="Total unique users"                                   value="1.76K" />
      <KpiCard title="Inactive Users"     subtitle="Users who were not active in the last 30 days"       value="1.32K" />
    </div>

    {/* Row 2: Answers + Liveboards (left) + Champions (right) */}
    <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
      {/* Left: stacked pairs */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <KpiCard title="Answers"    subtitle="Total count of answers"    value="10.86K" />
          <KpiCard title="Liveboards" subtitle="Total count of liveboards" value="3.24K"  />
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <SparklineCard
            title="Impressions"
            subtitle="Count of visualisation generated, last month"
            date="Feb FY 2027"
            value="103.01K"
            change={38.58}
            comparison="vs Jan FY 2026 (74.33K)"
            label="As expected"
            variant="positive"
          />
          <SparklineCard
            title="Insights Created"
            subtitle="Count of object interactions, last month"
            date="Feb FY 2027"
            value="10.18K"
            change={-9.97}
            comparison="vs Jan FY 2026 (11.31K)"
            label="Detecting anomalies..."
            variant="anomaly"
          />
        </div>
      </div>

      {/* Right: Champions table */}
      <ChampionsTable />
    </div>

    {/* Row 3: Bar charts */}
    <div style={{ display: 'flex', gap: '16px' }}>
      <BarChartCard
        title="Top 10 Adhoc Searchers"
        subtitle="Top 10 users who used Search"
        data={BAR_DATA_SEARCHERS}
      />
      <BarChartCard
        title="Top 10 Liveboard Consumers Last 30 days"
        subtitle="Top 10 users who used Liveboards"
        data={BAR_DATA_CONSUMERS}
      />
    </div>
  </div>
);

// ─── Usage Insights Tab ───────────────────────────────────────────────────────

const UsageInsightsContent: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ display: 'flex', gap: '16px' }}>
      <KpiCard title="Total Searches"     subtitle="Total search queries, last 30 days"                value="28.4K"  />
      <KpiCard title="Avg Session Length" subtitle="Average session duration"     date="Feb FY 2027"   value="12.3m"  />
      <KpiCard title="Search Success Rate" subtitle="Searches with results"                            value="94.2%"  />
      <KpiCard title="Peak Usage Hour"    subtitle="Hour with most queries"       date="Last 30 days"  value="2–3 PM" />
    </div>
    <div style={{ display: 'flex', gap: '16px' }}>
      <SparklineCard
        title="Daily Active Searches"
        subtitle="Search queries per day, rolling 30 days"
        date="Feb FY 2027"
        value="947"
        change={12.4}
        comparison="vs Jan FY 2027 (842)"
        label="As expected"
        variant="positive"
      />
      <SparklineCard
        title="Answer View Rate"
        subtitle="Saved answers viewed per day, last month"
        date="Feb FY 2027"
        value="2.31K"
        change={-4.2}
        comparison="vs Jan FY 2027 (2.41K)"
        label="Slight decline"
        variant="anomaly"
      />
      <SparklineCard
        title="Liveboard Views"
        subtitle="Liveboard opens per day, last month"
        date="Feb FY 2027"
        value="1.84K"
        change={22.1}
        comparison="vs Jan FY 2027 (1.51K)"
        label="As expected"
        variant="positive"
      />
    </div>
    <div style={{ display: 'flex', gap: '16px' }}>
      <BarChartCard
        title="Top 10 Most Searched Keywords"
        subtitle="Most frequently searched terms, last 30 days"
        data={[
          { label: 'revenue', value: 1820 }, { label: 'sales', value: 1640 },
          { label: 'users', value: 1350 }, { label: 'orders', value: 1120 },
          { label: 'churn', value: 940 }, { label: 'margin', value: 820 },
          { label: 'leads', value: 700 }, { label: 'forecast', value: 560 },
          { label: 'NPS', value: 430 }, { label: 'growth', value: 310 },
        ]}
      />
      <BarChartCard
        title="Top 10 Active Orgs"
        subtitle="Orgs with most usage, last 30 days"
        data={[
          { label: 'Solidaris', value: 2100 }, { label: 'SymphonyAI', value: 1780 },
          { label: 'Conagra', value: 1520 }, { label: 'Siemens', value: 1280 },
          { label: 'HIS', value: 1050 }, { label: 'Besins', value: 890 },
          { label: 'Testorg3', value: 740 }, { label: 'Xtrac', value: 590 },
          { label: 'Testorg2', value: 420 }, { label: 'Testorg1', value: 280 },
        ]}
      />
    </div>
  </div>
);

// ─── Adoption Insights Tab ────────────────────────────────────────────────────

const AdoptionInsightsContent: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <div style={{ display: 'flex', gap: '16px' }}>
      <KpiCard title="New Users (30d)"        subtitle="Users onboarded, last 30 days"                   value="142"   />
      <KpiCard title="Feature Adoption Rate"  subtitle="% of users using 3+ features" date="Feb FY 2027" value="67.4%" />
      <KpiCard title="Spotter Adoption"       subtitle="Users who used Spotter, last 30 days"             value="1.14K" />
      <KpiCard title="Retention Rate"         subtitle="Users active for 3+ consecutive months"           value="83.2%" />
    </div>
    <div style={{ display: 'flex', gap: '16px' }}>
      <SparklineCard
        title="New User Activations"
        subtitle="First-time active users per day"
        date="Feb FY 2027"
        value="142"
        change={18.3}
        comparison="vs Jan FY 2027 (120)"
        label="Growing"
        variant="positive"
      />
      <SparklineCard
        title="Spotter Sessions"
        subtitle="AI query sessions created, last month"
        date="Feb FY 2027"
        value="4.87K"
        change={31.2}
        comparison="vs Jan FY 2027 (3.71K)"
        label="As expected"
        variant="positive"
      />
      <SparklineCard
        title="Liveboard Schedules"
        subtitle="Scheduled Liveboard deliveries, last month"
        date="Feb FY 2027"
        value="892"
        change={-6.1}
        comparison="vs Jan FY 2027 (950)"
        label="Detecting anomalies..."
        variant="anomaly"
      />
    </div>
    <div style={{ display: 'flex', gap: '16px' }}>
      <BarChartCard
        title="Feature Adoption by Org"
        subtitle="Number of features adopted per org, last 30 days"
        data={[
          { label: 'Solidaris', value: 1900 }, { label: 'SymphonyAI', value: 1650 },
          { label: 'Conagra', value: 1400 }, { label: 'Siemens', value: 1180 },
          { label: 'Besins', value: 960 }, { label: 'HIS', value: 800 },
          { label: 'Xtrac', value: 640 }, { label: 'Testorg3', value: 510 },
          { label: 'Testorg2', value: 380 }, { label: 'Testorg1', value: 240 },
        ]}
      />
      <BarChartCard
        title="Top 10 Spotter Users"
        subtitle="Users with most Spotter sessions, last 30 days"
        data={[
          { label: 'anshul.m...', value: 1750 }, { label: 'damian.w...', value: 1420 },
          { label: 'sangeetha...', value: 1180 }, { label: 'tsadmin', value: 980 },
          { label: 'siddhant...', value: 820 }, { label: 'yagnika...', value: 690 },
          { label: 'elizebeth...', value: 570 }, { label: 'shaheel...', value: 440 },
          { label: 'priya.s...', value: 320 }, { label: 'rahul.v...', value: 210 },
        ]}
      />
    </div>
  </div>
);

// ─── UsageAdoptionPageContent ─────────────────────────────────────────────────

export const UsageAdoptionPageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview',      label: 'Adoption overview' },
    { id: 'productivity',  label: 'User Productivity' },
    { id: 'object-usage',  label: 'Object Usage' },
    { id: 'object-stats',  label: 'Object statistics' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {/* Liveboard container */}
        <div style={{
          backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
          borderRadius: '12px', overflow: 'hidden',
        }}>

          {/* Liveboard header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px 0', borderBottom: '1px solid #E5E7EB',
          }}>
            {/* Left: title + divider + tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
                <span style={{ fontSize: '17px', fontWeight: 700, color: '#111827', fontFamily: font, letterSpacing: '-0.3px' }}>
                  Usage &amp; Adoption
                </span>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#9CA3AF" strokeWidth="1.3" />
                  <path d="M7 6.5v4M7 5h.01" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5l1.5 3.2 3.5.5-2.5 2.4.6 3.5L7 9.3l-3.1 1.8.6-3.5L2 5.2l3.5-.5z" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div style={{ width: '1px', height: '20px', backgroundColor: '#E5E7EB', margin: '0 16px 16px', flexShrink: 0 }} />

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    padding: '0 14px 16px', border: 'none', background: 'none',
                    cursor: 'pointer', fontFamily: font, fontSize: '13.5px',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    color: activeTab === tab.id ? brand : '#6B7280',
                    borderBottom: activeTab === tab.id ? `2px solid ${brand}` : '2px solid transparent',
                    marginBottom: '-1px', transition: 'color 0.15s', whiteSpace: 'nowrap',
                  }}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: AI Highlights + share + dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
              <button style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                height: '32px', padding: '0 14px', border: 'none',
                borderRadius: '999px', backgroundColor: brand,
                cursor: 'pointer', fontFamily: font, fontSize: '12.5px',
                fontWeight: 600, color: '#FFFFFF',
              }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1L7.8 4.7l3.7 1.3-3.7 1.3L6.5 11l-1.3-3.7L1.5 6l3.7-1.3z" fill="white" />
                </svg>
                AI Highlights
              </button>
              <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v9M4 4l3-3 3 3M2 11h10" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="3" cy="7" r="1.2" fill="#6B7280" />
                  <circle cx="7" cy="7" r="1.2" fill="#6B7280" />
                  <circle cx="11" cy="7" r="1.2" fill="#6B7280" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid #F3F4F6' }}>
            {['User\u00a0(Select)', 'Org Name\u00a0(Select)'].map((chip) => (
              <button key={chip} style={{
                height: '28px', padding: '0 12px',
                border: '1px solid #E5E7EB', borderRadius: '999px',
                backgroundColor: '#FFFFFF', cursor: 'pointer',
                fontFamily: font, fontSize: '12px', color: '#374151',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                {chip}
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ padding: '20px' }}>
            {activeTab === 'overview'  && <OverviewContent />}
            {activeTab === 'productivity'  && <UsageInsightsContent />}
            {activeTab === 'object-usage'  && <AdoptionInsightsContent />}
            {activeTab === 'object-stats'  && <AdoptionInsightsContent />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default UsageAdoptionPageContent;
