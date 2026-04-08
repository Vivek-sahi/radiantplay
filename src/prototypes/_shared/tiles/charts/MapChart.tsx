import React from 'react';
import ReactECharts from 'echarts-for-react';
import { chartColors, chartUi, chartFont } from '../chartPalette';

// Regional bubbles on a simple XY plane (prototype stand-in for a geo map)
const regions = [
  { name: 'NA',    x: 20,  y: 40,  value: 1200 },
  { name: 'EU',    x: 52,  y: 32,  value: 800  },
  { name: 'APAC',  x: 80,  y: 50,  value: 600  },
  { name: 'LATAM', x: 30,  y: 70,  value: 300  },
  { name: 'MEA',   x: 62,  y: 65,  value: 200  },
];

interface Props { width?: number; height?: number; }

export const MapChart: React.FC<Props> = ({ height }) => {
  const option = {
    grid: { top: 8, bottom: 8, left: 8, right: 8, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: { name: string; data: { value: [number, number, number] } }) =>
        `${p.name}: $${(p.data.value[2] / 1000).toFixed(1)}M`,
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      show: false,
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      inverse: true,
      show: false,
    },
    series: regions.map((r, i) => ({
      name: r.name,
      type: 'scatter',
      data: [{ value: [r.x, r.y, r.value] }],
      symbolSize: (val: number[]) => Math.sqrt(val[2]) * 1.2,
      itemStyle: { color: chartColors[i % chartColors.length], opacity: 0.75 },
      label: {
        show: true,
        formatter: r.name,
        fontFamily: chartFont,
        fontSize: 10,
        color: '#fff',
        fontWeight: 600,
        position: 'inside',
      },
    })),
    legend: {
      show: true,
      bottom: 0,
      data: regions.map((r) => r.name),
      textStyle: { fontFamily: chartFont, fontSize: 10, color: chartUi.labelColor },
    },
  };

  return (
    <ReactECharts
      option={option}
      notMerge
      style={{ width: '100%', height: height ?? 180 }}
    />
  );
};
