import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartColors, chartUi, chartFont } from '../chartPalette';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const seriesData = [
  { name: 'Sales',   data: [30, 48, 42, 65, 58, 72, 68, 80] },
  { name: 'Returns', data: [10, 15, 12, 18, 14, 20, 16, 22] },
];

interface Props { width?: number; height?: number; }

export const AreaChart: React.FC<Props> = ({ height }) => {
  const option = {
    grid: { top: 8, bottom: 8, left: 8, right: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { fontFamily: chartFont, fontSize: 10, color: chartUi.labelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontFamily: chartFont, fontSize: 10, color: chartUi.labelColor },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: chartUi.axis } },
    },
    series: seriesData.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      lineStyle: { color: chartColors[i], width: 2 },
      itemStyle: { color: chartColors[i] },
      areaStyle: { color: chartColors[i], opacity: 0.15 },
      symbol: 'none',
    })),
  };

  return (
    <ReactECharts
      option={option}
      notMerge
      style={{ width: '100%', height: height ?? 180 }}
    />
  );
};
