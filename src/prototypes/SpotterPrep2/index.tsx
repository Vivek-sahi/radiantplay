import React, { useState, useEffect } from 'react';
import Shell from './components/Shell';
import DataModelsPage from './components/DataModelsPage';
import ModelDetail from './components/ModelDetail';
import QualitySession from './components/QualitySession';
import type { QualityState } from './components/QualityTab';
import ScenarioSwitcher, { InlineScenarioPicker, type ScenarioId, scenarioToQualityState } from './components/ScenarioSwitcher';

type PrototypeView = 'models' | 'model-detail' | 'loading-session' | 'quality-session';

const SpotterPrep2: React.FC = () => {
  useEffect(() => {
    const prev = document.title;
    document.title = 'SpotterPrep v2';
    return () => { document.title = prev; };
  }, []);

  const [protoView, setProtoView]       = useState<PrototypeView>('models');
  const [activeModelId, setActiveModelId] = useState<string>('hr-analytics');
  const [activeNav, setActiveNav]       = useState('data-models');

  // Scenario switcher — drives the quality state of hr-analytics.
  const [scenario, setScenario] = useState<ScenarioId>('2');

  // Per-model quality state, initially set from the default scenario.
  const [modelQuality, setModelQuality] = useState<Record<string, QualityState>>({
    'hr-analytics': scenarioToQualityState('2'),
  });
  const [scanTimers, setScanTimers]     = useState<Record<string, ReturnType<typeof setTimeout>>>({});

  const handleScenarioChange = (s: ScenarioId) => {
    setScenario(s);
    setModelQuality({ 'hr-analytics': scenarioToQualityState(s) });
    setProtoView('models');
    setActiveModelId('hr-analytics');
    setActiveNav('data-models');
  };

  const activeQualityState: QualityState = modelQuality[activeModelId] ?? 'not-cached';

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goToModelDetail = (id: string) => {
    setActiveModelId(id);
    setProtoView('model-detail');
  };

  const handleNavChange = (id: string) => {
    setActiveNav(id);
    if (id === 'data-models') setProtoView('models');
  };

  const handleBack = () => {
    setProtoView('models');
    setActiveNav('data-models');
  };

  const handleSave = () => {
    setActiveModelId('hr-analytics-clean');
    setModelQuality(prev => ({ ...prev, 'hr-analytics-clean': 'saved' }));
    setProtoView('model-detail');
  };

  const handleExit = () => setProtoView('model-detail');

  // Triggers scan (or re-scan) for the active model
  const handleSetupCache = () => {
    if (scanTimers[activeModelId]) clearTimeout(scanTimers[activeModelId]);
    setModelQuality(prev => ({ ...prev, [activeModelId]: 'scanning' }));
    const t = setTimeout(() => {
      setModelQuality(prev => ({ ...prev, [activeModelId]: 'scanned' }));
    }, 3500);
    setScanTimers(prev => ({ ...prev, [activeModelId]: t }));
  };

  const handleStartQuality = () => {
    if (activeQualityState !== 'not-cached' && activeQualityState !== 'scanning') {
      setProtoView('loading-session');
      setTimeout(() => setProtoView('quality-session'), 1200);
    }
  };

  useEffect(() => {
    return () => { Object.values(scanTimers).forEach(t => clearTimeout(t)); };
  }, [scanTimers]);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      {protoView === 'loading-session' && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 16,
          animation: 'session-fadein 0.35s ease both',
          zIndex: 400,
        }}>
          <style>{`
            @keyframes session-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes session-spin { to { transform: rotate(360deg); } }
          `}</style>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            border: '2.5px solid #e5e7eb',
            borderTopColor: '#2770EF',
            animation: 'session-spin 0.75s linear infinite',
          }} />
          <div style={{ fontSize: 14, color: '#6b7280', fontFamily: '"Plain", -apple-system, sans-serif', letterSpacing: '0.01em' }}>
            Opening quality session
          </div>
        </div>
      )}
      {protoView === 'quality-session' && (
        <QualitySession
          onSave={handleSave}
          onExit={handleExit}
          headerCenter={<InlineScenarioPicker active={scenario} onChange={handleScenarioChange} />}
        />
      )}
      {protoView !== 'quality-session' && protoView !== 'loading-session' && (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          <div style={{ width: '112%', height: '112%', transform: 'scale(0.893)', transformOrigin: 'top left' }}>
            <Shell activeNav={activeNav} onNavChange={handleNavChange}>
              {protoView === 'models' && (
                <DataModelsPage onOpenModel={goToModelDetail} qualityOverride={modelQuality} />
              )}
              {protoView === 'model-detail' && (
                <ModelDetail
                  modelId={activeModelId}
                  qualityState={activeQualityState}
                  onBack={handleBack}
                  onStartQuality={handleStartQuality}
                  onSetupCache={handleSetupCache}
                  onRescan={handleSetupCache}
                  defaultTab="quality"
                />
              )}
            </Shell>
          </div>
        </div>
      )}
      {protoView !== 'quality-session' && protoView !== 'loading-session' && (
        <ScenarioSwitcher active={scenario} onChange={handleScenarioChange} />
      )}
    </div>
  );
};

export default SpotterPrep2;
