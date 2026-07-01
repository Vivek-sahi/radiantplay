import React, { useEffect, useState } from 'react';
import Home from './Home';
import HexNotebook from './HexNotebook';
import type { ScenarioId } from './agentScript';

// Standalone "Data Notebook" prototype — a Hex-style reactive data notebook with a
// notebook agent. Self-contained: home (prompt bar + scenario chips) → notebook.
const DataNotebook: React.FC = () => {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Data Notebook';
    return () => { document.title = prev; };
  }, []);

  const [view, setView] = useState<'home' | 'notebook'>('home');
  const [scenarioId, setScenarioId] = useState<ScenarioId | null>('s1');
  const [prompt, setPrompt] = useState('');

  const launch = (id: ScenarioId | null, p: string) => {
    setScenarioId(id);
    setPrompt(p);
    setView('notebook');
  };

  if (view === 'home') return <Home onLaunch={launch} />;
  return <HexNotebook key={String(scenarioId) + prompt} scenarioId={scenarioId} initialPrompt={prompt} onBack={() => setView('home')} />;
};

export default DataNotebook;
