import React, { useState } from 'react';
import { Shell, type NavKey, type StoreModel, type Surface } from './components/Shell';
import { DataStoreView } from './components/DataStoreView';
import { StoreView } from './components/store/StoreView';
import { ModelCachePage, DataStorePage } from './components/store/StoreSplitPages';
import { storeTables } from './components/store/storeData';
import { DataObjectsView } from './components/DataObjectsView';
import { ModelView } from './components/ModelView';
import { SearchDataSurface } from './components/SearchDataSurface';
import { SpotterSurface } from './components/SpotterSurface';
import { LiveboardSurface, type LiveboardTreatment } from './components/LiveboardSurface';
import { models as seedModels } from './data';
import type { DataModel } from './types';

/**
 * Near Store
 *
 * ThoughtSpot's data caching offering. Customers cache model data they query
 * live from Snowflake into ThoughtSpot to reduce their querying costs.
 *
 * Surfaces: Data store (admin capacity view) · Data objects (model list with a
 * source+cache indicator) · Model → Caching tab (enable / configure / inspect).
 *
 * Created: 2026-07-02
 */

type Origin = 'objects' | 'datastore' | 'agentdbstore' | 'modelcache';
type View =
  | { kind: 'objects' }
  | { kind: 'datastore' }
  | { kind: 'agentdbstore' }
  | { kind: 'modelcache' }
  | { kind: 'externalstore' }
  | { kind: 'model'; modelId: string; origin: Origin };

// Each Liveboard switcher variant maps to one cache-indicator visual treatment.
const LIVEBOARD_TREATMENT: Partial<Record<Surface, LiveboardTreatment>> = {
  'liveboard': 'text-above',
  'liveboard-b': 'text-bottom',
  'liveboard-dot': 'dot',
  'liveboard-statement': 'statement',
  'liveboard-stroke': 'stroke',
  'liveboard-hover': 'hover',
  'liveboard-hover-source': 'hover-source',
};

export const NearStore: React.FC = () => {
  const [models, setModels] = useState<DataModel[]>(seedModels);
  const [view, setView] = useState<View>({ kind: 'objects' });
  const [surface, setSurface] = useState<Surface>('data-workspace');
  // The open product question — see `StoreModel` in Shell.
  // Phase 1 (Pulse only) is the default — it is what shipped.
  const [storeModel, setStoreModel] = useState<StoreModel>('pulse-only');

  const updateModel = (next: DataModel) =>
    setModels((prev) => prev.map((m) => (m.id === next.id ? next : m)));

  const openModel = (modelId: string, origin: Origin) => setView({ kind: 'model', modelId, origin });
  const navigate = (key: NavKey) =>
    setView({ kind: key } as View);

  const activeNav: NavKey = view.kind === 'model' ? view.origin : view.kind;

  const renderContent = () => {
    // Spotter and Liveboard are the built-out business-user surfaces; Search
    // data remains a scaffolded placeholder for now.
    if (
      surface === 'spotter' ||
      surface === 'spotter-b' ||
      surface === 'spotter-source' ||
      surface === 'spotter-header-icon'
    ) {
      const cacheVariant =
        surface === 'spotter' ? 'above' : surface === 'spotter-header-icon' ? 'header-icon' : 'below';
      const copyVariant = surface === 'spotter-source' ? 'source' : 'default';
      return <SpotterSurface cacheVariant={cacheVariant} copyVariant={copyVariant} />;
    }
    if (surface.startsWith('liveboard')) {
      return <LiveboardSurface treatment={LIVEBOARD_TREATMENT[surface] ?? 'text-above'} />;
    }
    if (surface === 'search' || surface === 'search-icon') {
      return <SearchDataSurface freshnessPlacement={surface === 'search-icon' ? 'top-right' : 'footer'} />;
    }
    if (view.kind === 'modelcache') {
      return <ModelCachePage models={models} onOpenModel={(id) => openModel(id, 'modelcache')} />;
    }
    if (view.kind === 'externalstore') {
      return <DataStorePage tables={storeTables} />;
    }
    if (view.kind === 'agentdbstore') {
      return (
        <StoreView
          tables={storeTables}
          models={models}
          onOpenModel={(id) => openModel(id, 'agentdbstore')}
        />
      );
    }
    if (view.kind === 'datastore') {
      return <DataStoreView models={models} onViewDetails={(id) => openModel(id, 'datastore')} />;
    }
    if (view.kind === 'objects') {
      return <DataObjectsView models={models} onOpenModel={(id) => openModel(id, 'objects')} />;
    }
    const model = models.find((m) => m.id === view.modelId);
    if (!model) return null;
    return (
      <ModelView model={model} onChange={updateModel} />
    );
  };

  return (
    <Shell
      active={activeNav}
      onNavigate={navigate}
      surface={surface}
      onSurfaceChange={setSurface}
      storeModel={storeModel}
      onStoreModelChange={(m) => {
        setStoreModel(m);
        // Each phase drops the other's nav entry, so don't strand the user on a
        // page that no longer has a way back to it.
        const storePages = ['datastore', 'agentdbstore', 'modelcache', 'externalstore'];
        if (!storePages.includes(view.kind)) return;
        if (m === 'pulse-only') setView({ kind: 'datastore' });
        if (m === 'agentdb') setView({ kind: 'agentdbstore' });
        if (m === 'split') setView({ kind: 'modelcache' });
      }}
    >
      {renderContent()}
    </Shell>
  );
};

export default NearStore;
