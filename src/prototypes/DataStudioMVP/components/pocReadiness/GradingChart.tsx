import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { chartPalette } from '@tokens/colors/charts';
import type { QChart } from './data';

/**
 * Renders a real chart for a Spotter answer in the grading modal — bar (horizontal),
 * column (vertical), and line via ECharts; KPI as a metric tile; table as HTML. Kept
 * self-contained to the Calibration prototype so it doesn't depend on the Spotter VizBlock.
 */
const AXIS = '#E5E7EB';
const GRID = '#F0F1F3';
const TICK = '#6B7280';

const GradingChart: React.FC<{ chart?: QChart; height?: number }> = ({ chart, height = 176 }) => {
  const option = useMemo(() => {
    if (!chart || chart.kind === 'kpi' || chart.kind === 'table') return null;
    const { categories, series, kind, unit } = chart;
    const horizontal = kind === 'bar';
    const catAxis = {
      type: 'category' as const,
      data: categories,
      axisLine: { lineStyle: { color: AXIS } },
      axisTick: { show: false },
      axisLabel: { color: TICK, fontSize: 12 },
    };
    const valAxis = {
      type: 'value' as const,
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: { color: '#9CA3AF', fontSize: 12, formatter: (v: number) => (unit === '$M' ? `${v}` : v >= 1000 ? `${v / 1000}k` : `${v}`) },
    };
    return {
      grid: { left: 6, right: 14, top: 14, bottom: series.length > 1 ? 30 : 6, containLabel: true },
      tooltip: { trigger: 'axis' as const, confine: true },
      legend: series.length > 1
        ? { bottom: 0, icon: 'roundRect', itemHeight: 8, itemWidth: 8, textStyle: { fontSize: 12, color: TICK } }
        : undefined,
      xAxis: horizontal ? valAxis : catAxis,
      yAxis: horizontal ? { ...catAxis, inverse: true } : valAxis,
      series: series.map((s, i) => ({
        name: s.name,
        type: kind === 'line' ? 'line' : 'bar',
        data: s.data,
        smooth: kind === 'line',
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: kind === 'line',
        barMaxWidth: 26,
        itemStyle: {
          color: chartPalette.primary[i % chartPalette.primary.length],
          borderRadius: kind === 'line' ? 0 : (horizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]),
        },
        lineStyle: kind === 'line' ? { color: chartPalette.primary[i % chartPalette.primary.length], width: 2 } : undefined,
        areaStyle: kind === 'line' ? { color: 'rgba(39,112,239,0.08)' } : undefined,
      })),
    };
  }, [chart]);

  if (!chart) return <div className="calx-gc calx-gc-empty" style={{ height }} />;

  if (chart.kind === 'kpi') {
    return (
      <div className="calx-gc calx-gc-kpi" style={{ minHeight: height }}>
        <div className="calx-gc-kpival">{chart.value}</div>
        {chart.delta && <div className={`calx-gc-kpidelta ${chart.deltaUp ? 'up' : 'down'}`}>{chart.delta}</div>}
        {chart.caption && <div className="calx-gc-kpicap">{chart.caption}</div>}
      </div>
    );
  }

  if (chart.kind === 'table') {
    return (
      <div className="calx-gc calx-gc-table" style={{ maxHeight: height + 40 }}>
        <table>
          <thead>
            <tr>{chart.columns.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {chart.rows.map((row, ri) => (
              <tr key={ri}>{row.map((cell, ci) => <td key={ci}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="calx-gc">
      <ReactECharts option={option!} style={{ height, width: '100%' }} opts={{ renderer: 'svg' }} notMerge />
    </div>
  );
};

export default GradingChart;
