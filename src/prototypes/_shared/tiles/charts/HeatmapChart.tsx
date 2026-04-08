import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartColors, chartUi, chartFont } from '../chartPalette';

const rows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const cols = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm'];

const rawData = [
  [20, 45, 72, 58, 30, 10, 40, 55, 35, 15, 8],
  [35, 60, 85, 78, 50, 20, 55, 70, 48, 22, 12],
  [25, 55, 90, 82, 62, 28, 60, 75, 52, 26, 14],
  [30, 50, 78, 70, 45, 18, 48, 65, 42, 18, 10],
  [15, 40, 65, 55, 35, 12, 38, 52, 30, 12, 6],
];

// Build [colIndex, rowIndex, value] format for ECharts heatmap
const heatData: [number, number, number][] = [];
rawData.forEach((row, ri) => {
  row.forEach((val, ci) => {
    heatData.push([ci, ri, val]);
  });
});

interface Props { width?: number; height?: number; }

export const HeatmapChart: React.FC<Props> = ({ height }) => {
  const option = {
    grid: { top: 8, bottom: 8, left: 8, right: 8, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: { data: [number, number, number] }) =>
        `${rows[p.data[1]]} ${cols[p.data[0]]}: ${p.data[2]}`,
    },
    xAxis: {
      type: 'category',
      data: cols,
      axisLabel: { fontFamily: chartFont, fontSize: 10, color: chartUi.labelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: rows,
      axisLabel: { fontFamily: chartFont, fontSize: 10, color: chartUi.labelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    visualMap: {
      min: 0,
      max: 100,
      show: false,
      inRange: {
        color: ['#EAF1FB', chartColors[0]],
      },
    },
    series: [
      {
        type: 'heatmap',
        data: heatData,
        itemStyle: { borderRadius: 2 },
        emphasis: { itemStyle: { shadowBlur: 4 } },
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
