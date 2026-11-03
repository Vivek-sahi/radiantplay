import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartFont } from '../chartPalette';
import { useChartTheme } from '../chartTheme';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const seriesData = [
  { name: 'Sales',   data: [30, 48, 42, 65, 58, 72, 68, 80] },
  { name: 'Returns', data: [10, 15, 12, 18, 14, 20, 16, 22] },
];

interface Props { width?: number; height?: number; colors?: string[]; }

export const AreaChart: React.FC<Props> = ({ height, colors }) => {
  const { colors: themeColors, seriesColor, ui } = useChartTheme();
  const palette = colors ? colors.map(seriesColor) : themeColors;
  const option = {
    backgroundColor: 'transparent',
    grid: { top: 8, bottom: 8, left: 8, right: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
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
      lineStyle: { color: palette[i % palette.length], width: 2 },
      itemStyle: { color: palette[i % palette.length] },
      areaStyle: { color: palette[i % palette.length], opacity: 0.15 },
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
