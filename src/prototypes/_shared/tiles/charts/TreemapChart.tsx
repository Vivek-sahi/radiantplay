import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartFont } from '../chartPalette';
import { useChartTheme } from '../chartTheme';
import { systemColors } from '@tokens/colors';

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
  const { isDark, colors: themeColors } = useChartTheme();
  const option = {
    backgroundColor: 'transparent',
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
          itemStyle: { color: themeColors[i % themeColors.length] },
        })),
        label: {
          show: true,
          fontFamily: chartFont,
          fontSize: 11,
          // Sits on a series colour: white on light, dark on the lifted dark palette
          color: systemColors[isDark ? 'dark' : 'light']['content-primary-inverse'],
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
