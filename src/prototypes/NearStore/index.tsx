import React, { useState } from 'react';
import { Shell, type NavKey, type Surface } from './components/Shell';
import { DataStoreView } from './components/DataStoreView';
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

type Origin = 'objects' | 'datastore';
type View =
  | { kind: 'objects' }
  | { kind: 'datastore' }
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

  const updateModel = (next: DataModel) =>
    setModels((prev) => prev.map((m) => (m.id === next.id ? next : m)));

  const openModel = (modelId: string, origin: Origin) => setView({ kind: 'model', modelId, origin });
  const navigate = (key: NavKey) => setView(key === 'objects' ? { kind: 'objects' } : { kind: 'datastore' });

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
    <Shell active={activeNav} onNavigate={navigate} surface={surface} onSurfaceChange={setSurface}>
      {renderContent()}
    </Shell>
  );
};

export default NearStore;
