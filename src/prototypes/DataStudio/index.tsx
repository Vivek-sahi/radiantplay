import React, { useState } from 'react';
import { systemColors } from '../../tokens/colors';
import ProjectsList from './components/ProjectsList';
import Workspace from './components/Workspace';

/**
 * DataStudio
 *
 * Goal: Prototype the Data Studio product — a workspace for data teams to
 *       build, clean, join, and publish data models for AI-powered analytics.
 * User: Data analyst / analytics engineer (technical, AI-assisted workflow)
 * Flows: Projects list → New project → Build mode (Visualizer / Data Preview / Notebook)
 *        → Test mode → Share
 */

export type AppView = 'list' | 'workspace';

export interface ProjectContext {
  persona: string;
  sampleQuestions: string;
  businessLogic: string;
  spotterInstructions: string;
}

export const emptyContext: ProjectContext = {
  persona: '',
  sampleQuestions: '',
  businessLogic: '',
  spotterInstructions: '',
};

export interface ProjectState {
  id: string;
  name: string;
  buildStep: 'empty' | 'tables' | 'joined' | 'transformed' | 'healthy';
  activeTab: 'visualizer' | 'preview' | 'notebook';
  testMode: boolean;
  context: ProjectContext;
  profileComplete?: boolean;
}

const DataStudio: React.FC = () => {
  const [view, setView] = useState<AppView>('list');
  const [project, setProject] = useState<ProjectState>({
    id: 'proj-001',
    name: 'Untitled Project',
    buildStep: 'empty',
    activeTab: 'visualizer',
    testMode: false,
    context: emptyContext,
  });

  const openProject = (name?: string) => {
    setProject({ id: `proj-${Date.now()}`, name: name ?? 'Untitled Project', buildStep: 'empty', activeTab: 'visualizer', testMode: false, context: emptyContext });
    setView('workspace');
  };

  const resumeProject = () => setView('workspace');
  const backToList = () => setView('list');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: systemColors.light['background-sunken'] }}>
      {view === 'list'
        ? <ProjectsList onOpen={openProject} currentProject={project} onResume={resumeProject} />
        : <Workspace project={project} setProject={setProject} onBack={backToList} />
      }
    </div>
  );
};


export default DataStudio;
