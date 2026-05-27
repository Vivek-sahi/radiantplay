import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ReactECharts from 'echarts-for-react';
import { Icon } from '@components/icons';
import { Modal } from '@components/Modal';
import {
  chartColors,
  chartUi,
  chartFont,
  chartFontSize,
} from '../../../prototypes/_shared/tiles/chartPalette';
import type {
  VizBlockData,
  VizChartKind,
  VizData,
  VizSource,
  VizTableData,
  VizToken,
} from '../../runtime/schema';
import styles from './VizBlock.module.css';

export type VizView = 'chart' | 'table';

export interface VizBlockProps {
  block: VizBlockData;
  /**
   * React node to render inside the chart slot. Wins over `block.source`.
   * Use this when the consumer has a chart instance to embed directly.
   */
  chartSlot?: React.ReactNode;
  /**
   * Footer-left action group. Defaults to Pin / Save / Download / Edit.
   * Pass `null` to hide. Pass a custom node to override.
   */
  footerLeft?: React.ReactNode;
  /**
   * Footer-right action group. Defaults to "Add to coaching".
   * Pass `null` to hide. Pass a custom node to override.
   */
  footerRight?: React.ReactNode;
  /** Controlled view. */
  view?: VizView;
  /** Called when the user clicks a view-toggle segment. */
  onViewChange?: (view: VizView) => void;
  /**
   * Called when the user clicks the expand button.
   * Default: opens an internal fullscreen modal.
   */
  onExpand?: () => void;
  /** Default-action handlers — used when `footerLeft` / `footerRight` are not overridden. */
  onPin?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
  onAddToCoaching?: () => void;
}

/**
 * Renderer for the viz block. The chart slot is filled per `VizSource`:
 * iframe / data (real ECharts via @shared/tiles palette) / placeholder.
 * See `docs/2026-05-07-spotter-viz-block-behaviour.md` for the slot model
 * and customization points.
 */
export const VizBlock: React.FC<VizBlockProps> = ({
  block,
  chartSlot,
  footerLeft,
  footerRight,
  view: controlledView,
  onViewChange,
  onExpand,
  onPin,
  onSave,
  onDownload,
  onEdit,
  onAddToCoaching,
}) => {
  const [internalView, setInternalView] = useState<VizView>('chart');
  const view = controlledView ?? internalView;
  const handleViewChange = (next: VizView): void => {
    if (controlledView === undefined) setInternalView(next);
    onViewChange?.(next);
  };

  const [expandedInternal, setExpandedInternal] = useState(false);
  const handleExpand = (): void => {
    if (onExpand) onExpand();
    else setExpandedInternal(true);
  };

  return (
    <div className={styles.viz}>
      {block.title && <h3 className={styles.title}>{block.title}</h3>}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.tokens}>
            {block.tokens.map((token) => (
              <Token key={token.id} token={token} />
            ))}
          </div>
          <div className={styles.headerActions}>
            <div className={styles.viewToggle} role="group" aria-label="View mode">
              <button
                type="button"
                className={styles.viewBtn}
                data-active={view === 'table'}
                onClick={() => handleViewChange('table')}
                aria-label="Table view"
                aria-pressed={view === 'table'}
              >
                <Icon name="table" size="s" />
              </button>
              <button
                type="button"
                className={styles.viewBtn}
                data-active={view === 'chart'}
                onClick={() => handleViewChange('chart')}
                aria-label="Chart view"
                aria-pressed={view === 'chart'}
              >
                <Icon name="chart" size="s" />
              </button>
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleExpand}
              aria-label="Expand"
            >
              <Icon name="expand" size="s" />
            </button>
          </div>
        </div>
        <div className={styles.cardBody}>
          <Slot
            view={view}
            chartSlot={chartSlot}
            source={block.source}
            tableData={block.tableData}
            includeLegend
          />
        </div>
        <div className={styles.cardFooter}>
          <div className={styles.footerLeft}>
            {footerLeft === undefined ? (
              <DefaultFooterLeft
                onPin={onPin}
                onSave={onSave}
                onDownload={onDownload}
                onEdit={onEdit}
              />
            ) : (
              footerLeft
            )}
          </div>
          <div className={styles.footerRight}>
            {footerRight === undefined ? (
              <DefaultFooterRight onAddToCoaching={onAddToCoaching} />
            ) : (
              footerRight
            )}
          </div>
        </div>
      </div>
      {/*
        Portal the Modal to document.body so that any transform / will-change
        / contain on an ancestor in the chat tree doesn't trap its
        position: fixed inside the canvas. Modal needs to anchor to the
        viewport for the M4 size to actually fill the screen.
      */}
      {typeof document !== 'undefined' &&
        createPortal(
          <Modal
            isOpen={expandedInternal}
            onClose={() => setExpandedInternal(false)}
            title="Expand"
            size="M4"
            showCloseButton
            className={styles.expandModalFull}
          >
            <div className={styles.expandedView}>
              <div className={styles.expandedHeader}>
                <h2 className={styles.expandedTitle}>
                  {block.title ?? 'Chart'}
                </h2>
                <div
                  className={styles.viewToggle}
                  role="group"
                  aria-label="View mode"
                >
                  <button
                    type="button"
                    className={styles.viewBtn}
                    data-active={view === 'table'}
                    onClick={() => handleViewChange('table')}
                    aria-label="Table view"
                    aria-pressed={view === 'table'}
                  >
                    <Icon name="table" size="s" />
                  </button>
                  <button
                    type="button"
                    className={styles.viewBtn}
                    data-active={view === 'chart'}
                    onClick={() => handleViewChange('chart')}
                    aria-label="Chart view"
                    aria-pressed={view === 'chart'}
                  >
                    <Icon name="chart" size="s" />
                  </button>
                </div>
              </div>
              <div className={styles.expandedTokens}>
                {block.tokens.map((token) => (
                  <Token key={token.id} token={token} />
                ))}
              </div>
              <div className={styles.expandedChart}>
                <Slot
                  view={view}
                  chartSlot={chartSlot}
                  source={block.source}
                  tableData={block.tableData}
                  includeLegend={false}
                />
              </div>
              <div className={styles.expandedFooter}>
                {getDataPointsLabel(block)}
              </div>
            </div>
          </Modal>,
          document.body,
        )}
    </div>
  );
};

function getDataPointsLabel(block: VizBlockData): string {
  if (block.source.type === 'data') {
    const count = block.source.data.series[0]?.data.length ?? 0;
    return `Showing ${count} of ${count} data points`;
  }
  if (block.tableData) {
    const count = block.tableData.rows.length;
    return `Showing ${count} of ${count} data points`;
  }
  return '';
}

VizBlock.displayName = 'VizBlock';

// ---------- Slot dispatcher ----------

interface SlotProps {
  view: VizView;
  chartSlot?: React.ReactNode;
  source: VizSource;
  tableData?: VizTableData;
  includeLegend: boolean;
}

const Slot: React.FC<SlotProps> = ({ view, chartSlot, source, tableData, includeLegend }) => {
  if (view === 'table' && tableData) {
    return (
      <div className={styles.tableWrap}>
        <table className={styles.tableEl}>
          <thead>
            <tr>
              {tableData.columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Chart view — slot priority: chartSlot > iframe > data > placeholder
  if (chartSlot !== undefined) {
    return <div className={styles.slot}>{chartSlot}</div>;
  }

  if (source.type === 'iframe') {
    return (
      <div className={styles.slot}>
        <iframe
          className={styles.slotIframe}
          src={source.url}
          sandbox={source.sandbox}
          title={source.title ?? 'Chart'}
        />
      </div>
    );
  }

  if (source.type === 'data') {
    return (
      <div className={styles.slot}>
        <RealChart
          chartKind={source.chartKind}
          data={source.data}
          showLegend={includeLegend !== false}
        />
      </div>
    );
  }

  // placeholder
  return (
    <div className={styles.slot}>
      <span className={styles.slotPlaceholder}>
        {source.message ?? 'Chart will appear here'}
      </span>
    </div>
  );
};

// ---------- Tokens ----------

const Token: React.FC<{ token: VizToken }> = ({ token }) => {
  const showFunnel = token.kind === 'filter';
  return (
    <span className={styles.token} data-kind={token.kind}>
      {showFunnel && <Icon name="funnel" size="xs" />}
      <span>{token.label}</span>
    </span>
  );
};

// ---------- Default footer actions ----------

const DefaultFooterLeft: React.FC<{
  onPin?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onEdit?: () => void;
}> = ({ onPin, onSave, onDownload, onEdit }) => (
  <>
    <FooterAction icon="pin" label="Pin" onClick={onPin} />
    <FooterAction icon="save" label="Save" onClick={onSave} />
    <FooterAction icon="download" label="Download" onClick={onDownload} />
    <FooterAction icon="pencil" label="Edit" onClick={onEdit} />
  </>
);

const DefaultFooterRight: React.FC<{ onAddToCoaching?: () => void }> = ({ onAddToCoaching }) => (
  <FooterAction icon="plus" label="Add to coaching" onClick={onAddToCoaching} brand />
);

const FooterAction: React.FC<{
  icon: React.ComponentProps<typeof Icon>['name'];
  label: string;
  onClick?: () => void;
  brand?: boolean;
}> = ({ icon, label, onClick, brand }) => (
  <button
    type="button"
    className={`${styles.footerAction} ${brand ? styles.footerActionBrand : ''}`}
    onClick={onClick}
  >
    <Icon name={icon} size="s" />
    <span>{label}</span>
  </button>
);

// ---------- Real chart (ECharts) ----------

interface RealChartProps {
  chartKind: VizChartKind;
  data: VizData;
  showLegend?: boolean;
}

/**
 * Renders the inline data via ECharts. Mirrors the existing chart-sample
 * patterns in `src/prototypes/_shared/tiles/charts/*` (palette, axis
 * styling, font). One chart for both inline and expanded views — the
 * container's height controls the rendered size.
 */
const RealChart: React.FC<RealChartProps> = ({ chartKind, data, showLegend = true }) => {
  const isLine = chartKind === 'line';
  const isPie = chartKind === 'pie';
  const isBar = chartKind === 'bar';

  const seriesConfig = data.series.map((s, i) => {
    const color = s.color ?? chartColors[i % chartColors.length];
    if (isPie) {
      return {
        name: s.label,
        type: 'pie',
        radius: ['40%', '65%'],
        avoidLabelOverlap: true,
        itemStyle: { color },
        data: (data.xAxis?.categories ?? []).map((cat, idx) => ({
          name: cat,
          value: s.data[idx] ?? 0,
          itemStyle: {
            color: chartColors[idx % chartColors.length],
          },
        })),
      };
    }
    return {
      name: s.label,
      type: isLine ? 'line' : 'bar',
      data: s.data,
      smooth: isLine,
      lineStyle: isLine ? { color, width: 2 } : undefined,
      itemStyle: {
        color,
        borderRadius: isBar ? [4, 4, 0, 0] : undefined,
      },
      symbol: isLine ? 'circle' : undefined,
      symbolSize: isLine ? 5 : undefined,
      barMaxWidth: isBar ? 56 : undefined,
      label: isBar
        ? {
            show: true,
            position: 'top',
            fontFamily: chartFont,
            fontSize: chartFontSize.value,
            color: chartUi.valueColor,
            formatter: (params: { value: number }) => formatNumber(params.value),
          }
        : undefined,
    };
  });

  const showSeriesLegend =
    showLegend && !isPie && data.series.length > 1;

  const option: Record<string, unknown> = {
    grid: { top: showSeriesLegend ? 36 : 16, bottom: 8, left: 8, right: 8, containLabel: true },
    tooltip: {
      trigger: isPie ? 'item' : 'axis',
      textStyle: { fontFamily: chartFont, fontSize: chartFontSize.label },
    },
    color: chartColors,
    series: seriesConfig,
  };

  if (showSeriesLegend) {
    option.legend = {
      top: 4,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        fontFamily: chartFont,
        fontSize: chartFontSize.label,
        color: chartUi.labelColor,
      },
    };
  }

  if (!isPie) {
    option.xAxis = {
      type: 'category',
      data: data.xAxis?.categories ?? [],
      name: data.xAxis?.label,
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: {
        fontFamily: chartFont,
        fontSize: chartFontSize.label,
        color: chartUi.labelColor,
      },
      axisLabel: {
        fontFamily: chartFont,
        fontSize: chartFontSize.tick,
        color: chartUi.labelColor,
      },
      axisLine: { show: false },
      axisTick: { show: false },
    };
    option.yAxis = {
      type: 'value',
      name: data.yAxis?.label,
      nameLocation: 'middle',
      nameGap: 48,
      nameRotate: 90,
      nameTextStyle: {
        fontFamily: chartFont,
        fontSize: chartFontSize.label,
        color: chartUi.labelColor,
      },
      axisLabel: {
        fontFamily: chartFont,
        fontSize: chartFontSize.tick,
        color: chartUi.labelColor,
        formatter: (v: number) => formatNumber(v),
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: chartUi.axis } },
    };
  }

  return (
    <ReactECharts
      option={option}
      notMerge
      lazyUpdate
      style={{ width: '100%', height: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
};

const formatNumber = (v: number): string => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
};

export default VizBlock;
