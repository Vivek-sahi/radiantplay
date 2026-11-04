import React, { useState } from 'react';
import { NoData } from '@/components';
import { Shell, NAV_LABELS, type NavBadge } from './components/Shell';
import { ProtoMenu, type PageVersion } from './components/ProtoMenu';
import type { HookBoxStyle } from './components/HookBoxes';
import type { HeroStyle, HookLayout, HookBackground, AnimationStyle, IconStyle } from './components/CachingHook';
import { DataCacheView } from './components/DataCacheView';
import { DataCacheViewV2 } from './components/DataCacheViewV2';
import { DataCacheViewV3, defaultOrgEstimate, type TitleTag, type PlanLine } from './components/DataCacheViewV3';
import { DataObjectsView } from './components/DataObjectsView';
import { ModelView } from './components/ModelView';
import type { Limit } from './components/LimitBanner';
import { orgs, plan } from './data';
import { JUMPS, SCENARIOS, type ScenarioId } from './scenarios';
import type { DataModel, EstimateInputs } from './types';

/**
 * Data Cache
 *
 * ThoughtSpot's data caching offering, for the product-led motion (Nov 2026).
 * The caching workflow is Pulse's: Cache Model on a model's Caching tab, the
 * Caching Settings modal, cached / failed / model-changed / not-cacheable states,
 * run history, purge and disable. What is new is the empty states, which are now
 * hooks: the Data Cache page says what the plan includes and what caching each
 * model would save, and the Caching tab makes the case before the button.
 *
 * Started from the Pulse handoff (src/prototypes/NearStore, frozen) as a copy,
 * plus the PLG reference (Data Cache Hook.html, 2 Nov). Created: 2026-11-03
 */

type Origin = 'objects' | 'datacache';
type View =
  | { kind: 'objects' }
  | { kind: 'datacache' }
  | { kind: 'other'; id: string }
  | { kind: 'model'; modelId: string; origin: Origin; openSettings?: boolean };

export const DataCache: React.FC = () => {
  // Deep links for the spec and for devs: ?scenario=global&limit=hours&enabled=0&model=<id>
  const params = new URLSearchParams(window.location.search);
  const initialScenario = SCENARIOS.some((x) => x.id === params.get('scenario')) ? (params.get('scenario') as ScenarioId) : 'retail';
  const initialLimit: Limit = params.get('limit') === 'hours' || params.get('limit') === 'storage' ? (params.get('limit') as Limit) : 'none';
  const [scenarioId, setScenarioId] = useState<ScenarioId>(initialScenario);
  const [version, setVersion] = useState<PageVersion>('modal');
  const [orgEstimates, setOrgEstimates] = useState<Record<string, EstimateInputs>>({});
  const [boxStyle, setBoxStyle] = useState<HookBoxStyle>('calculator');
  const [hero, setHero] = useState<HeroStyle>('none');
  const [animation, setAnimation] = useState<AnimationStyle>('planes');
  const [icon, setIcon] = useState<IconStyle>('figma');
  const [layout, setLayout] = useState<HookLayout>('columns');
  const [background, setBackground] = useState<HookBackground>('dots');
  const [navBadge, setNavBadge] = useState<NavBadge>('new');
  const [titleTag, setTitleTag] = useState<TitleTag>('none');
  const [planLine, setPlanLine] = useState<PlanLine>('plain');
  const [enabled, setEnabled] = useState(params.get('enabled') !== '0');
  const [limit, setLimit] = useState<Limit>(initialLimit);
  const [savingForAll, setSavingForAll] = useState(false);
  const [modelsByOrg, setModelsByOrg] = useState<Record<string, DataModel[]>>(() =>
    Object.fromEntries(Object.values(orgs).map((o) => [o.id, o.models])),
  );
  const [view, setView] = useState<View>(() => (params.get('model') ? { kind: 'model', modelId: params.get('model')!, origin: 'objects' } : { kind: 'datacache' }));
  const [hookHighlight] = useState(0);

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const org = orgs[scenario.org];
  const models = modelsByOrg[org.id];

  const updateModel = (next: DataModel) =>
    setModelsByOrg((prev) => ({ ...prev, [org.id]: prev[org.id].map((m) => (m.id === next.id ? next : m)) }));

  const openModel = (modelId: string, origin: Origin, openSettings = false) => {
    if (!modelId) {
      setView({ kind: 'objects' });
      return;
    }
    setView({ kind: 'model', modelId, origin, openSettings });
  };
  const navigate = (id: string) => {
    if (id === 'objects' || id === 'datacache') setView({ kind: id });
    else setView({ kind: 'other', id });
  };
  // Learn more will open the documentation page later; for now it goes nowhere (Vivek, 4 Nov).
  const learnMore = () => {};
  const pickScenario = (id: ScenarioId) => {
    setScenarioId(id);
    setView({ kind: 'datacache' });
  };
  // The handoff design: what the gear returns to when Design explorations is switched off.
  const lockDesign = () => {
    setVersion('modal'); setBoxStyle('calculator'); setHero('none'); setAnimation('planes'); setIcon('figma');
    setLayout('columns'); setBackground('dots'); setNavBadge('new'); setTitleTag('none'); setPlanLine('plain');
    setSavingForAll(false);
    if (SCENARIOS.find((x) => x.id === scenarioId)?.exploration) setScenarioId('claims');
  };
  const resetScenario = () => {
    setModelsByOrg((prev) => ({ ...prev, [org.id]: org.models }));
    setOrgEstimates((prev) => { const next = { ...prev }; delete next[org.id]; return next; });
    setView({ kind: 'datacache' });
  };
  const jump = (id: 'heavy' | 'low') => {
    const j = JUMPS.find((x) => x.id === id)!;
    setScenarioId(j.scenario);
    setView({ kind: 'model', modelId: j.modelId, origin: 'objects' });
  };

  const activeNav = view.kind === 'model' ? view.origin : view.kind === 'other' ? view.id : view.kind;

  const renderContent = () => {
    if (view.kind === 'datacache' && version !== 'v1' && version !== 'v2') {
      return (
        <DataCacheViewV3
          org={org}
          models={models}
          plan={plan}
          enabled={enabled}
          banner={version}
          titleTag={titleTag}
          planLine={planLine}
          limit={limit}
          savingForAll={savingForAll}
          estimate={orgEstimates[org.id] ?? defaultOrgEstimate(org)}
          onEstimate={(next) => setOrgEstimates((prev) => ({ ...prev, [org.id]: next }))}
          onOpenModel={(id) => openModel(id, 'datacache')}
          onCacheModel={(id) => openModel(id, 'datacache', true)}
        />
      );
    }
    if (view.kind === 'datacache' && version === 'v2') {
      return (
        <DataCacheViewV2
          org={org}
          models={models}
          plan={plan}
          enabled={enabled}
          showList={scenario.list}
          onOpenModel={(id) => openModel(id, 'datacache')}
          onOpenObjects={() => setView({ kind: 'objects' })}
          onCacheModel={(id) => openModel(id, 'datacache', true)}
          highlightKey={hookHighlight}
        />
      );
    }
    if (view.kind === 'datacache') {
      return (
        <DataCacheView
          org={org}
          models={models}
          plan={plan}
          enabled={enabled}
          showList={scenario.list}
          onOpenModel={(id) => openModel(id, 'datacache')}
          onCacheModel={(id) => openModel(id, 'datacache', true)}
          highlightKey={hookHighlight}
        />
      );
    }
    if (view.kind === 'objects') {
      return <DataObjectsView models={models} onOpenModel={(id) => openModel(id, 'objects')} />;
    }
    if (view.kind === 'other') {
      return <NoData title={NAV_LABELS[view.id] ?? view.id} description="Not part of this prototype. Data objects and DataCache are the pages that are built." />;
    }
    const model = models.find((m) => m.id === view.modelId);
    if (!model) return null;
    return (
      <ModelView
        key={`${model.id}-${view.openSettings ? 'settings' : 'view'}`}
        model={model}
        onChange={updateModel}
        plan={plan}
        enabled={enabled}
        limit={limit}
        onLearnMore={learnMore}
        autoOpenSettings={view.openSettings}
        boxStyle={boxStyle}
        hero={hero}
        animation={animation}
        icon={icon}
        layout={layout}
        background={background}
      />
    );
  };

  return (
    <>
      <Shell active={activeNav} onNavigate={navigate} navBadge={navBadge}>
        {renderContent()}
      </Shell>
      <ProtoMenu version={version} onVersion={setVersion} boxStyle={boxStyle} onBoxStyle={setBoxStyle} hero={hero} onHero={setHero} animation={animation} onAnimation={setAnimation} icon={icon} onIcon={setIcon} layout={layout} onLayout={setLayout} background={background} onBackground={setBackground} navBadge={navBadge} onNavBadge={setNavBadge} titleTag={titleTag} onTitleTag={setTitleTag} planLine={planLine} onPlanLine={setPlanLine} scenario={scenarioId} onScenario={pickScenario} enabled={enabled} onEnabled={setEnabled} limit={limit} onLimit={setLimit} savingForAll={savingForAll} onSavingForAll={setSavingForAll} onJump={jump} onReset={resetScenario} onLockDesign={lockDesign} />
    </>
  );
};

export default DataCache;
