import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartColors, chartUi, chartFont } from '../chartPalette';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
const values = [42, 68, 55, 81, 47, 73, 60, 88];

interface Props { width?: number; height?: number; }

export const ColumnChart: React.FC<Props> = ({ height }) => {
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
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: { color: chartColors[0], borderRadius: [2, 2, 0, 0] },
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
