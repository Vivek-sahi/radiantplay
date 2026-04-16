import React, { useState } from 'react';
import Shell from './components/Shell';
import DataModelsPage from './components/DataModelsPage';
import ModelDetail from './components/ModelDetail';
import PrepSession from './components/PrepSession';
import { QualityState } from './components/QualityTab';

type PrototypeView = 'models' | 'model-detail' | 'prep-session';

const SpotterPrep: React.FC = () => {
  React.useEffect(() => {
    const prev = document.title;
    document.title = 'SpotterPrep';
    return () => { document.title = prev; };
  }, []);

  const [protoView, setProtoView]         = useState<PrototypeView>('models');
  const [qualityState, setQualityState]   = useState<QualityState>('ready');
  const [activeNav, setActiveNav]         = useState('data-models');
  const [activeModelId, setActiveModelId] = useState<string>('fnops-final');

  // ── Navigation helpers ──────────────────────────────────────────────────────

  const goToModelDetail = (id: string) => {
    setActiveModelId(id);
    setProtoView('model-detail');
  };

  const goToPrepSession = () => setProtoView('prep-session');

  const handleNavChange = (id: string) => {
    setActiveNav(id);
    if (id === 'data-models') setProtoView('models');
  };

  const handlePublish    = () => { setQualityState('post-prep'); setProtoView('model-detail'); };
  const handleExit       = () => setProtoView('model-detail');
  const handleBack       = () => { setProtoView('models'); setActiveNav('data-models'); };
  const handleSetupCache = () => setQualityState('ready');
  const prepDone         = qualityState === 'post-prep';

  // campaign-perf always shows 'ready' — no prep run yet
  const activeQualityState: QualityState = activeModelId === 'campaign-perf' ? 'ready' : qualityState;

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>

      {/* PrepSession — full viewport, no scale wrapper */}
      {protoView === 'prep-session' && (
        <PrepSession onExit={handleExit} onPublish={handlePublish} />
      )}

      {/* Shell — scale wrapper for ThoughtSpot chrome */}
      {protoView !== 'prep-session' && (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <div style={{
            width: '112%', height: '112%',
            transform: 'scale(0.893)', transformOrigin: 'top left',
          }}>
            <Shell activeNav={activeNav} onNavChange={handleNavChange}>
              {protoView === 'models' && (
                <DataModelsPage onOpenModel={goToModelDetail} prepDone={prepDone} />
              )}
              {protoView === 'model-detail' && (
                <ModelDetail
                  modelId={activeModelId}
                  onBack={handleBack}
                  onStartPrep={goToPrepSession}
                  qualityState={activeQualityState}
                  onSetupCache={handleSetupCache}
                />
              )}
            </Shell>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotterPrep;
