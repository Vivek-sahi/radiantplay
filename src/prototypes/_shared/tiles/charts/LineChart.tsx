import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartColors, chartUi, chartFont } from '../chartPalette';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const seriesData = [
  { name: 'Revenue', data: [40, 55, 48, 70, 62, 78, 72, 85] },
  { name: 'Target',  data: [50, 50, 60, 60, 70, 70, 80, 80] },
];

interface Props { width?: number; height?: number; }

export const LineChart: React.FC<Props> = ({ height }) => {
  const option = {
    grid: { top: 8, bottom: 8, left: 8, right: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: chartFont, fontSize: 10, color: chartUi.labelColor },
    },
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
      symbol: i === 0 ? 'circle' : 'none',
      symbolSize: 5,
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
