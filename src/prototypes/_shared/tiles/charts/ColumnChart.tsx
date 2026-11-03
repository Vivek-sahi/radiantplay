import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartFont } from '../chartPalette';
import { useChartTheme } from '../chartTheme';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const values = [42, 68, 55, 81, 47, 73, 60, 88];

interface Props { width?: number; height?: number; colors?: string[]; }

export const ColumnChart: React.FC<Props> = ({ height, colors }) => {
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
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: { color: palette[0], borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 32,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      notMerge
      style={{ width: '100%', height: height ?? 180 }}
    />
  );
};
