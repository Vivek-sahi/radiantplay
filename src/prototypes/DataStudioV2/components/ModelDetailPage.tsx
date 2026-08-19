/**
 * Model detail page — the **view state** (POC V2).
 *
 * Two states for a model: this one, and the canvas (the **edit state**). You land
 * here after publishing and when you open a model from Data objects; "Edit model"
 * takes you to the canvas.
 *
 * Ported from `surajboro-ts/spotter-readiness-vision`
 * (`Calibration/components/ModelViewMode` — his faithful adaptation of the
 * ThoughtSpot model worksheet view). His shell is dropped because our `Shell`
 * already provides Data Workspace's `AppShell`; his drift monitor is dropped
 * because it belongs to his Calibration flow. Structure, tabs and header actions
 * are his.
 *
 * The columns table runs on our own data: `MODEL_DETAILS` for the model's columns,
 * and `tableMetadata` for each column's warehouse-derived data type, additivity and
 * aggregation. Nothing here is invented — a column with no metadata reads "—".
 */
import React, { useMemo, useState } from 'react';
import { systemColors } from '../../../tokens/colors';
import { spacing } from '../../../tokens/spacing';
import { fontFamily } from '../../../tokens/typography';
import { MODEL_DETAILS, tableMetadata } from '../data/mockData';
import type { ModelColumn } from '../data/mockData';
import type { DataObject } from '../data/dataObjects';
// Near Store's model-caching components, used as they are rather than copied — see
// cache/modelCacheAdapter.ts on why the two sides meet in exactly one file.
import { CachingTab } from '../../NearStore/components/CachingTab';
import { useModelCache } from './cache/ModelCacheContext';
import { canFallBackToLive } from './cache/cacheState';
import { fromNearStoreModel, toNearStoreModel } from './cache/modelCacheAdapter';

/**
 * `Caching` sits fourth, where Near Store put it — its tab list is Columns · Joins · Data
 * samples · Dependents · Caching, which is this list's first four plus one, so the addition is
 * positional rather than a rearrangement.
 */
const TABS = [
  'Columns', 'Joins', 'Data samples', 'Dependents', 'Caching',
  'Column Security', 'Custom actions', 'Spotter optimisation', 'Instructions',
] as const;

const ink = systemColors.light;

const TH: React.CSSProperties = {
  padding: '0 14px', height: 40, fontSize: 12, fontWeight: 500, color: ink['content-primary'],
  textTransform: 'uppercase', letterSpacing: '0.06em', background: ink['background-base'],
  textAlign: 'left', whiteSpace: 'nowrap', borderBottom: `1px solid ${ink['border-divider']}`,
};
const TD: React.CSSProperties = {
  borderBottom: `1px solid ${ink['border-divider']}`, background: ink['background-base'],
  padding: '0 14px', height: 44, verticalAlign: 'middle', fontSize: 14, fontWeight: 300,
  color: ink['content-primary'],
};
const idle: React.CSSProperties = { color: ink['content-tertiary'], fontWeight: 300 };

const Chevron: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2.5 3.8L5 6.2l2.5-2.4" stroke={ink['content-tertiary']} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Toggle: React.FC<{ on: boolean; disabled?: boolean }> = ({ on, disabled }) => (
  <span style={{ width: 28, height: 16, position: 'relative', display: 'inline-flex', alignItems: 'center', opacity: disabled ? 0.4 : 1, flexShrink: 0 }}>
    <span style={{ position: 'absolute', width: 28, height: 8, borderRadius: 4, background: on ? '#cedcf5' : systemColors.light['background-inset'] }} />
    <span style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: on ? '#2770ef' : '#fff', border: `1px solid ${on ? '#2770ef' : systemColors.light['border-subtle-hover']}`, left: on ? 12 : 0, boxShadow: '0 2px 4px rgba(25,35,49,0.04)' }} />
  </span>
);

const Pill: React.FC<{ children: React.ReactNode; disabled?: boolean }> = ({ children, disabled }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', maxWidth: 150, padding: '6px 12px', borderRadius: 6, fontSize: 14, fontWeight: 300, background: ink['background-base'], color: ink['content-primary'], border: `1px solid ${ink['border-default']}`, opacity: disabled ? 0.4 : 1 }}>
    {children}<Chevron />
  </span>
);

const HeaderButton: React.FC<{ onClick?: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      height: 32, padding: '0 16px', borderRadius: 16, border: 'none',
      background: ink['background-subtle'], color: ink['content-primary'],
      fontSize: 14, fontWeight: 300, cursor: 'pointer', fontFamily: fontFamily.primary,
    }}
  >
    {children}
  </button>
);

/** Warehouse-derived facts for a model column, looked up in `tableMetadata`. */
const resolveMeta = (col: ModelColumn) => {
  const meta = tableMetadata[col.table]?.columns.find(c => c.name === col.name);
  return {
    dataType: meta ? meta.type.toUpperCase() : '—',
    additive: meta?.isAdditive,
    aggregation: meta?.aggregation ? String(meta.aggregation).toUpperCase() : undefined,
  };
};

export interface ModelDetailPageProps {
  object: DataObject;
  /** Opens the edit state — our canvas for a multi-source model. */
  onEditModel: () => void;
}

const ModelDetailPage: React.FC<ModelDetailPageProps> = ({ object, onEditModel }) => {
  const [tab, setTab] = useState<string>('Columns');

  const details = object.projectId ? MODEL_DETAILS[object.projectId] : undefined;
  const columns = useMemo(() => (details?.columns ?? []).filter(c => !c.hidden), [details]);

  // What the canvas cached for this model, if it was built there. Absent for every other model,
  // which is what makes the Caching tab show its "Cache {model}" call to action instead.
  const modelCache = useModelCache();
  const cache = modelCache.get(object.name);
  const nearStoreModel = useMemo(() => toNearStoreModel(object, cache), [object, cache]);

  return (
    <div
      style={{
        height: '100%', overflowY: 'auto', background: ink['background-sunken'],
        fontFamily: fontFamily.primary, padding: `${spacing.F}px ${spacing.F}px 0`,
      }}
    >
      {/* Model header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.G, gap: spacing.F }}>
        <div style={{ minWidth: 0, flex: 1, maxWidth: 560 }}>
          <div style={{ fontSize: 12, fontWeight: 400, color: ink['content-primary'], textTransform: 'uppercase', marginBottom: 4 }}>Model</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: ink['content-primary'], marginBottom: 8 }}>{object.name}</div>
          <div style={{ fontSize: 14, fontWeight: 300, color: ink['content-secondary'], lineHeight: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {details?.description ?? 'No description yet.'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.C, flexShrink: 0 }}>
          <HeaderButton>Search on this model</HeaderButton>
          <HeaderButton onClick={onEditModel}>Edit model</HeaderButton>
          <button
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: ink['background-subtle'], color: ink['content-primary'],
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
            aria-label="More actions"
          >
            <svg width="14" height="4" viewBox="0 0 14 4" fill="none">
              <circle cx="1.5" cy="2" r="1.5" fill="currentColor" />
              <circle cx="7" cy="2" r="1.5" fill="currentColor" />
              <circle cx="12.5" cy="2" r="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${ink['border-divider']}`, gap: 4, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              height: 48, padding: '0 12px', fontSize: 14, fontWeight: 300, cursor: 'pointer',
              border: 'none', background: 'none', marginBottom: -1, whiteSpace: 'nowrap',
              borderBottom: `2px solid ${t === tab ? ink['content-brand'] : 'transparent'}`,
              color: t === tab ? ink['content-brand'] : ink['content-primary'],
              fontFamily: fontFamily.primary,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: `${spacing.F}px 0` }}>
        {tab === 'Caching' && (
          <CachingTab
            model={nearStoreModel}
            // A multi-source model has no live fallback, so Near Store's copy about older data
            // being queried from source is false for it. The prop swaps that copy rather than
            // forking the component. See flow spec §9.
            canFallBackToLive={!cache || canFallBackToLive(cache)}
            onChange={next => {
              // Editing settings here has to move the canvas's state too, or the card badges and
              // the model listing would keep describing the windows this tab just replaced.
              if (cache) modelCache.set(object.name, fromNearStoreModel(next, cache));
            }}
          />
        )}
        {tab === 'Columns' && columns.length > 0 && (
          <>
            <div style={{ border: `1px solid ${ink['border-divider']}`, borderRadius: 6, overflow: 'hidden', background: ink['background-base'] }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th style={{ ...TH, width: '18%' }}>Column name</th>
                    <th style={{ ...TH, width: '9%'  }}>Sync</th>
                    <th style={{ ...TH, width: '16%' }}>Description</th>
                    <th style={{ ...TH, width: '16%' }}>AI context</th>
                    <th style={{ ...TH, width: '11%' }}>Data type</th>
                    <th style={{ ...TH, width: '14%' }}>Column type</th>
                    <th style={{ ...TH, width: '8%'  }}>Additive</th>
                    <th style={{ ...TH, width: '8%'  }}>Aggregation</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map(col => {
                    const { dataType, additive, aggregation } = resolveMeta(col);
                    const attr = col.type === 'attribute';
                    return (
                      <tr key={`${col.table}.${col.name}`} className="mdp-row">
                        <td style={{ ...TD, fontWeight: 400 }}>{col.name}</td>
                        <td style={TD}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span>Off</span><Toggle on={false} />
                          </span>
                        </td>
                        <td style={TD}>
                          {col.description
                            ? <span title={col.description} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.description}</span>
                            : <span style={idle}>Click to edit</span>}
                        </td>
                        <td style={TD}>
                          {col.aiContextSet ? <span>Set</span> : <span style={idle}>Click to edit</span>}
                        </td>
                        <td style={TD}>{dataType}</td>
                        <td style={{ ...TD, padding: '0 8px' }}>
                          <Pill disabled={attr}>{col.type.toUpperCase()}</Pill>
                        </td>
                        <td style={TD}>
                          {additive === undefined ? (
                            <span style={idle}>—</span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: attr ? 0.4 : 1 }}>
                              <span>{additive ? 'Yes' : 'No'}</span><Toggle on={additive} disabled={attr} />
                            </span>
                          )}
                        </td>
                        <td style={TD}>
                          {aggregation ? <Pill disabled={attr}>{aggregation}</Pill> : <span style={idle}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: spacing.D, fontSize: 14, fontWeight: 300, color: ink['content-primary'] }}>
              Model has {columns.length} columns
            </div>
          </>
        )}

        {/* A model just created on an empty canvas has no columns yet — say so rather
            than borrowing another model's. */}
        {tab === 'Columns' && columns.length === 0 && (
          <div style={{ padding: '80px 0', textAlign: 'center', color: ink['content-tertiary'], fontSize: 14, fontWeight: 300 }}>
            No columns yet — add tables on the canvas, then save.
          </div>
        )}

        {tab === 'Joins' && (
          details?.joins?.length ? (
            <div style={{ border: `1px solid ${ink['border-divider']}`, borderRadius: 6, overflow: 'hidden', background: ink['background-base'] }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH}>Left table</th>
                    <th style={TH}>Right table</th>
                    <th style={TH}>On</th>
                    <th style={TH}>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {details.joins.map(j => (
                    <tr key={`${j.left}-${j.right}-${j.on}`} className="mdp-row">
                      <td style={TD}>{j.left}</td>
                      <td style={TD}>{j.right}</td>
                      <td style={TD}>{j.on}</td>
                      <td style={TD}>{j.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '80px 0', textAlign: 'center', color: ink['content-tertiary'], fontSize: 14, fontWeight: 300 }}>
              No joins yet.
            </div>
          )
        )}

        {/* Caching excluded: it *is* in this prototype now (Near Store's tab, ported above), and
            printing "not in this prototype" under a working tab is the kind of thing a reviewer
            reasonably reads as the real state. */}
        {tab !== 'Columns' && tab !== 'Joins' && tab !== 'Caching' && (
          <div style={{ padding: '80px 0', textAlign: 'center', color: ink['content-tertiary'], fontSize: 14, fontWeight: 300 }}>
            {tab} — not in this prototype.
          </div>
        )}
      </div>

      <style>{`.mdp-row:hover td { background: ${ink['background-subtle']}; }`}</style>
    </div>
  );
};

export default ModelDetailPage;
