import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartColors, chartUi, chartFont } from '../chartPalette';

const data = [
  { name: 'Direct',   value: 38 },
  { name: 'Organic',  value: 27 },
  { name: 'Referral', value: 18 },
  { name: 'Social',   value: 11 },
  { name: 'Email',    value: 6  },
];

interface Props { width?: number; height?: number; }

export const DonutChart: React.FC<Props> = ({ height }) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: chartColors[i % chartColors.length] },
        })),
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontFamily: chartFont,
          fontSize: 10,
          color: chartUi.labelColor,
        },
        labelLine: { show: true },
        emphasis: { scale: true, scaleSize: 4 },
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
