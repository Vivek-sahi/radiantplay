import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartColors, chartUi, chartFont } from '../chartPalette';

const categories = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East'];
const values = [1.2, 0.8, 0.6, 0.3, 0.2];

interface Props { width?: number; height?: number; }

export const BarChart: React.FC<Props> = ({ height }) => {
  const option = {
    grid: { top: 8, bottom: 8, left: 8, right: 8, containLabel: true },
    tooltip: { trigger: 'item', formatter: (p: { name: string; value: number }) => `${p.name}: $${p.value}M` },
    xAxis: {
      type: 'value',
      axisLabel: { fontFamily: chartFont, fontSize: 10, color: chartUi.labelColor },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: chartUi.axis } },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontFamily: chartFont, fontSize: 10, color: chartUi.labelColor },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: chartColors[i % chartColors.length], borderRadius: [0, 2, 2, 0] },
        })),
        label: {
          show: true,
          position: 'right',
          formatter: (p: { value: number }) => `$${p.value}M`,
          fontFamily: chartFont,
          fontSize: 10,
          color: chartUi.valueColor,
        },
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
