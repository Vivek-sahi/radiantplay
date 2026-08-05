import React, { useEffect, useRef, useState } from 'react';
import { ViewHeader } from '@components/LiveboardHeader';
import { Icon } from '@/components';
import {
  AnswerTile,
  NoteTile,
  type ChartType,
  NOTE_VARIATIONS,
  type NoteVariant,
} from '../../_shared/tiles';
import { CacheMarker } from './CacheMarker';
import { DatabaseZapIcon } from './DatabaseZapIcon';
import { spotterModels } from '../spotterData';
import { c } from '../styles';
import styles from './LiveboardSurface.module.css';

/**
 * Liveboard business-user surface. Reuses the REAL liveboard building blocks —
 * the shared board tiles (AnswerTile / NoteTile) and the product ViewHeader —
 * laid out view-only (business users consume boards, they don't edit). The one
 * Near Store addition is the per-tile cached/live marker, rendered through
 * AnswerTile's additive `provenance` slot at the placement chosen from the
 * switcher (above the graph, or a bottom legend row).
 *
 * Tiles tie to the SAME running-example models as the Spotter surface
 * (spotterModels), so freshness varies tile-to-tile — the mixed board that is
 * the whole reason provenance lives at the answer level.
 *
 * The `treatment` prop selects one cache-indicator VISUAL EXPLORATION (chosen
 * from the header switcher, Liveboard only):
 *   text-above / text-bottom — the explicit CacheMarker line (2 placements)
 *   dot        — a neutral status dot before each tile title (hover for detail)
 *   statement  — one board-level summary line, no per-tile marker
 *   stroke     — each card's border coloured by source, with a board-level key
 */

// ── Grid math (mirrors _liveboard-template) ───────────────────────────────────
const COLUMNS = 12;
const GUTTER = 16;
const ROW_H = 80;
const ROW_UNIT = 96;
const PAD = 24;

function colUnit(containerWidth: number): number {
  return (containerWidth - PAD * 2 - GUTTER * (COLUMNS - 1)) / COLUMNS;
}
function tilePixels(t: { x: number; y: number; w: number; h: number }, cu: number) {
  return {
    left: PAD + t.x * (cu + GUTTER),
    top: PAD + t.y * ROW_UNIT,
    width: t.w * cu + (t.w - 1) * GUTTER,
    height: t.h * ROW_H + (t.h - 1) * GUTTER,
  };
}

// ── Board definition ──────────────────────────────────────────────────────────
type Pos = { x: number; y: number; w: number; h: number };
type BoardTile = { i: string } & Pos &
  (
    | { tileType: 'answer'; chartType: ChartType; title: string; description?: string; modelId: string }
    | { tileType: 'note'; noteVariant: NoteVariant }
  );

const BOARD: BoardTile[] = [
  // KPI row — 3 cached, 1 live, side by side
  { i: 'kpi-users',   x: 0, y: 0, w: 3, h: 2, tileType: 'answer', chartType: 'kpi',        title: 'Daily active users',    modelId: 'mixpanel-daily' },
  { i: 'kpi-cases',   x: 3, y: 0, w: 3, h: 2, tileType: 'answer', chartType: 'kpi-simple', title: 'Cases solved this week', modelId: 'case-created-solved' },
  { i: 'kpi-revenue', x: 6, y: 0, w: 3, h: 2, tileType: 'answer', chartType: 'kpi',        title: 'Revenue today',         modelId: 'agentspot-financial' },
  { i: 'kpi-queries', x: 9, y: 0, w: 3, h: 2, tileType: 'answer', chartType: 'kpi-simple', title: 'Queries / min',         modelId: 'embrace-query-stats' },
  // Chart row — cached line next to a live bar
  { i: 'chart-users',   x: 0, y: 2, w: 6, h: 3, tileType: 'answer', chartType: 'line', title: 'Active users over time', description: 'Daily, last 14 days', modelId: 'mixpanel-daily' },
  { i: 'chart-segment', x: 6, y: 2, w: 6, h: 3, tileType: 'answer', chartType: 'bar',  title: 'Revenue by segment',      modelId: 'retail-apparel' },
  // Note + a live table
  { i: 'note-summary', x: 0, y: 5, w: 4, h: 4, tileType: 'note', noteVariant: 'weekly-update' },
  { i: 'table-teams',  x: 4, y: 5, w: 8, h: 4, tileType: 'answer', chartType: 'table', title: 'Support volume by team', modelId: 'claude-metadata' },
];

// Per-tile provenance derived from its model's cache state.
type Provenance = { state: 'cached'; fullDate: string } | { state: 'live' };
function provenanceFor(modelId: string): Provenance {
  const model = spotterModels.find((m) => m.id === modelId);
  if (model && model.cache.state === 'cached') {
    return { state: 'cached', fullDate: model.cache.lastRefreshed };
  }
  return { state: 'live' };
}

// ── Static header content (view-only) ─────────────────────────────────────────
const TABS = [
  { label: 'Overview', id: 'overview' },
  { label: 'Adoption', id: 'adoption' },
  { label: 'Support', id: 'support' },
];
const FILTERS = [
  { label: 'Time period', value: 'This quarter' },
  { label: 'Region', value: 'All regions' },
];

// ── Surface ─────────────────────────────────────────────────────────────────
export type LiveboardTreatment =
  | 'text-above'
  | 'text-bottom'
  | 'dot'
  | 'statement'
  | 'stroke'
  | 'hover'
  | 'hover-source';

export const LiveboardSurface: React.FC<{ treatment: LiveboardTreatment }> = ({
  treatment,
}) => {
  const [containerWidth, setContainerWidth] = useState(1200);
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      if (canvasRef.current) setContainerWidth(canvasRef.current.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  const cu = colUnit(containerWidth);
  const maxBottom = BOARD.reduce((m, t) => Math.max(m, t.y + t.h), 0);
  const canvasHeight = PAD + maxBottom * ROW_UNIT - GUTTER + PAD;

  // Board-level provenance summary — used by the 'statement' treatment (and to
  // shape the running example: a mixed board of cached + live tiles).
  const answerModelIds = BOARD.flatMap((t) => (t.tileType === 'answer' ? [t.modelId] : []));
  const answerProvs = answerModelIds.map(provenanceFor);
  const cachedProvs = answerProvs.filter(
    (p): p is Extract<Provenance, { state: 'cached' }> => p.state === 'cached',
  );
  const cachedCount = cachedProvs.length;
  const liveCount = answerProvs.length - cachedCount;
  const refreshDate = cachedProvs[0]?.fullDate;
  const boardStatement =
    liveCount === 0
      ? `All tiles cached · as of ${refreshDate}`
      : cachedCount === 0
        ? 'All tiles queried live from source'
        : `Mixed sources — ${cachedCount} of ${answerProvs.length} tiles cached as of ${refreshDate}, ${liveCount} live`;

  return (
    <div className={styles.surface}>
      <ViewHeader
        title="Product & support overview"
        activeTab={activeTab}
        tabs={TABS}
        filters={FILTERS}
        onTabChange={setActiveTab}
        onEdit={() => {}}
      />

      {/* Board-level treatments: a single summary line, or a stroke legend. */}
      {treatment === 'statement' && (
        <div className={styles.boardBar}>
          <DatabaseZapIcon size={14} color={c['content-secondary']} />
          <span>{boardStatement}</span>
        </div>
      )}
      {treatment === 'stroke' && (
        <div className={styles.boardBar}>
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swatchCached}`} />
            Cached in AgentDB
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.swatch} ${styles.swatchLive}`} />
            Live from source
          </span>
        </div>
      )}

      <div ref={canvasRef} className={styles.canvas} style={{ height: canvasHeight }}>
        {BOARD.map((tile) => {
          const p = tilePixels(tile, cu);
          const wrapperStyle: React.CSSProperties = {
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.width,
            height: p.height,
          };

          if (tile.tileType === 'note') {
            return (
              <div key={tile.i} style={wrapperStyle}>
                <NoteTile content={NOTE_VARIATIONS[tile.noteVariant]} style={{ width: '100%', height: '100%' }} />
              </div>
            );
          }

          const prov = provenanceFor(tile.modelId);

          // Encode the cached/live signal per the chosen exploration.
          const tileStyle: React.CSSProperties = { width: '100%', height: '100%' };
          let provenanceNode: React.ReactNode;
          let placement: 'above-graph' | 'bottom' = 'above-graph';
          let titleLeading: React.ReactNode;

          if (treatment === 'text-above' || treatment === 'text-bottom') {
            provenanceNode =
              prov.state === 'cached' ? (
                <CacheMarker state="cached" detail={prov.fullDate} />
              ) : (
                <CacheMarker state="live" />
              );
            placement = treatment === 'text-bottom' ? 'bottom' : 'above-graph';
          } else if (treatment === 'dot') {
            titleLeading = (
              <CacheMarker
                state={prov.state}
                detail={prov.state === 'cached' ? prov.fullDate : undefined}
                variant="icon"
              />
            );
          } else if (treatment === 'stroke') {
            const strokeColor =
              prov.state === 'cached'
                ? 'var(--rd-sys-color-content-brand)'
                : 'var(--rd-sys-color-content-secondary)';
            tileStyle.outline = `2px solid ${strokeColor}`;
            tileStyle.outlineOffset = '-1px';
          } else if (treatment === 'hover' || treatment === 'hover-source') {
            // Clean tile face — pin the border so hovering doesn't add a stroke.
            tileStyle.borderColor = 'var(--rd-sys-color-border-divider)';
          }
          // 'statement' → no per-tile marker (summarised at board level above)
          // 'hover'     → clean tile face; clock+dot icon revealed on hover (top-right)

          return (
            <div
              key={tile.i}
              style={wrapperStyle}
              className={
                treatment === 'hover' || treatment === 'hover-source' ? styles.hoverTile : undefined
              }
            >
              {(treatment === 'hover' || treatment === 'hover-source') && (
                // Product-accurate hover cluster: Spotter · Data freshness · ⋯
                <div className={styles.hoverCluster}>
                  <button className={styles.spotterPill} type="button">
                    <Icon name="spotter" size="s" />
                    <span>Spotter</span>
                  </button>
                  {treatment === 'hover' ? (
                    <span className={styles.clusterIconBtn}>
                      <CacheMarker
                        state={prov.state}
                        detail={prov.state === 'cached' ? prov.fullDate : undefined}
                        variant="icon"
                      />
                    </span>
                  ) : (
                    <span className={styles.clusterTextChip}>
                      <CacheMarker
                        state={prov.state}
                        detail={prov.state === 'cached' ? prov.fullDate : undefined}
                        copy="source"
                      />
                    </span>
                  )}
                  <button className={styles.clusterIconBtn} type="button" aria-label="More">
                    <Icon name="more" size="s" />
                  </button>
                </div>
              )}
              <AnswerTile
                chartType={tile.chartType}
                title={tile.title}
                description={tile.description}
                provenance={provenanceNode}
                provenancePlacement={placement}
                titleLeading={titleLeading}
                style={tileStyle}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
