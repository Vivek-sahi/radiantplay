import React from 'react';
import { ChartType } from '../AnswerTile';
import { useContainerSize } from '../useContainerSize';

export { BarChart }           from './BarChart';
export { ColumnChart }        from './ColumnChart';
export { StackedColumnChart } from './StackedColumnChart';
export { LineChart }          from './LineChart';
export { AreaChart }          from './AreaChart';
export { DonutChart }         from './DonutChart';
export { KPIChart }           from './KPIChart';
export { KPISimpleChart }     from './KPISimpleChart';
export { TableChart }         from './TableChart';
export { HeatmapChart }       from './HeatmapChart';
export { TreemapChart }       from './TreemapChart';
export { MapChart }           from './MapChart';

import { BarChart }           from './BarChart';
import { ColumnChart }        from './ColumnChart';
import { StackedColumnChart } from './StackedColumnChart';
import { LineChart }          from './LineChart';
import { AreaChart }          from './AreaChart';
import { DonutChart }         from './DonutChart';
import { KPIChart }           from './KPIChart';
import { KPISimpleChart }     from './KPISimpleChart';
import { TableChart }         from './TableChart';
import { HeatmapChart }       from './HeatmapChart';
import { TreemapChart }       from './TreemapChart';
import { MapChart }           from './MapChart';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const chartMap: Record<ChartType, React.FC<any>> = {
  'bar':             BarChart,
  'column':          ColumnChart,
  'stacked-column':  StackedColumnChart,
  'line':            LineChart,
  'area':            AreaChart,
  'donut':           DonutChart,
  'kpi':             KPIChart,
  'kpi-simple':      KPISimpleChart,
  'table':           TableChart,
  'heatmap':         HeatmapChart,
  'treemap':         TreemapChart,
  'map':             MapChart,
};

interface ChartRendererProps {
  type: ChartType;
}

/**
 * Measures its container via ResizeObserver and passes the actual
 * pixel dimensions to the chart component so it can fill the tile.
 */
export const ChartRenderer: React.FC<ChartRendererProps> = ({ type }) => {
  const [containerRef, { width, height }] = useContainerSize();
  const Chart = chartMap[type];

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', display: 'flex', flex: 1, minHeight: 0 }}
    >
      {Chart ? <Chart width={width} height={height} /> : null}
    </div>
  );
};
