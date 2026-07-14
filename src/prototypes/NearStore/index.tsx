import React, { useState } from 'react';
import { Shell, type NavKey } from './components/Shell';
import { DataStoreView } from './components/DataStoreView';
import { DataObjectsView } from './components/DataObjectsView';
import { ModelView } from './components/ModelView';
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

export const NearStore: React.FC = () => {
  const [models, setModels] = useState<DataModel[]>(seedModels);
  const [view, setView] = useState<View>({ kind: 'objects' });

  const updateModel = (next: DataModel) =>
    setModels((prev) => prev.map((m) => (m.id === next.id ? next : m)));

  const openModel = (modelId: string, origin: Origin) => setView({ kind: 'model', modelId, origin });
  const navigate = (key: NavKey) => setView(key === 'objects' ? { kind: 'objects' } : { kind: 'datastore' });

  const activeNav: NavKey = view.kind === 'model' ? view.origin : view.kind;

  const renderContent = () => {
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
    <Shell active={activeNav} onNavigate={navigate}>
      {renderContent()}
    </Shell>
  );
};

export default NearStore;
