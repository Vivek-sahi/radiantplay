import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartColors, chartFont } from '../chartPalette';

const data = [
  { name: 'Electronics', value: 320 },
  { name: 'Apparel',     value: 240 },
  { name: 'Home',        value: 180 },
  { name: 'Sports',      value: 120 },
  { name: 'Beauty',      value: 80  },
  { name: 'Food',        value: 60  },
];

interface Props { width?: number; height?: number; }

export const TreemapChart: React.FC<Props> = ({ height }) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}',
    },
    series: [
      {
        type: 'treemap',
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: chartColors[i % chartColors.length] },
        })),
        label: {
          show: true,
          fontFamily: chartFont,
          fontSize: 11,
          color: '#fff',
          formatter: '{b}\n{c}',
        },
        upperLabel: { show: false },
        breadcrumb: { show: false },
        roam: false,
        nodeClick: false,
        width: '100%',
        height: '100%',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
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
