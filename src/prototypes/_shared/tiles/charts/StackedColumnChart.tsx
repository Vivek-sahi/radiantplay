import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartFont } from '../chartPalette';
import { useChartTheme } from '../chartTheme';

const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
const seriesData = [
  { name: 'Product A', data: [120, 140, 130, 160] },
  { name: 'Product B', data: [80, 95, 88, 105] },
  { name: 'Product C', data: [60, 70, 75, 85] },
];

interface Props { width?: number; height?: number; }

export const StackedColumnChart: React.FC<Props> = ({ height }) => {
  const { colors: themeColors, ui } = useChartTheme();
  const option = {
    backgroundColor: 'transparent',
    grid: { top: 8, bottom: 8, left: 8, right: 8, containLabel: true },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: chartFont, fontSize: 10, color: ui.labelColor },
    },
    xAxis: {
      type: 'category',
      data: quarters,
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
      type: 'bar',
      stack: 'total',
      data: s.data,
      itemStyle: { color: themeColors[i % themeColors.length] },
      barMaxWidth: 40,
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
