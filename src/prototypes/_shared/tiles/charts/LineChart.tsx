import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartFont } from '../chartPalette';
import { useChartTheme } from '../chartTheme';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const seriesData = [
  { name: 'Revenue', data: [40, 55, 48, 70, 62, 78, 72, 85] },
  { name: 'Target',  data: [50, 50, 60, 60, 70, 70, 80, 80] },
];

interface Props { width?: number; height?: number; }

export const LineChart: React.FC<Props> = ({ height }) => {
  const { colors: themeColors, ui } = useChartTheme();
  const option = {
    backgroundColor: 'transparent',
    grid: { top: 8, bottom: 28, left: 8, right: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: chartFont, fontSize: 10, color: ui.labelColor },
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { fontFamily: chartFont, fontSize: 10, color: ui.labelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontFamily: chartFont, fontSize: 10, color: ui.labelColor },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: ui.axis } },
    },
    series: seriesData.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      lineStyle: { color: themeColors[i % themeColors.length], width: 2 },
      itemStyle: { color: themeColors[i % themeColors.length] },
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
