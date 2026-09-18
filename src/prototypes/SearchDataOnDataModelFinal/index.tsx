import React, { useState } from 'react';
import SearchDataOnDataModelFinal from './SearchDataOnDataModelFinal';
import { DataWorkspaceHome } from './components/DataWorkspaceHome';
import { ModelSelectionModal } from './components/ModelSelectionModal';
import { ConnectionSelectionScreen } from './components/ConnectionSelectionScreen';
import { ModelOnboardingScreen } from './components/ModelOnboardingScreen';
import type { DataConnection } from './data/mockData';

/**
 * Flow: Data workspace home → model-selection modal → connection selection →
 * onboarding screen → "Continue building manually" → the data model editor.
 *
 * The four screens ahead of the editor are ported verbatim from
 * OneClickModelGenerationFinal; only their wiring lives here.
 */
type Screen = 'home' | 'connections' | 'onboarding' | 'editor';

const SearchDataOnDataModelFinalEntry: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('home');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<DataConnection | null>(null);
  // Shown as an overlay on top of the onboarding screen when the user wants to switch connection.
  const [showConnectionPicker, setShowConnectionPicker] = useState(false);

  // Brand-new model: empty canvas, 'Add model name', SpotterModel's new-model
  // welcome panel. Read in SearchDataOnDataModelFinal's useState initialisers and
  // by init-dme.js, so it has to be set before the editor mounts.
  (window as any).__DME_CONFIG__ = {
    spotterModel: true,
    welcomeVariant: 'blank',
  };

  return (
    <>
      {/* Home page is always rendered for 'home' and 'connections' screens so the
          connection modal overlays the same background as the model-selection modal. */}
      {(screen === 'home' || screen === 'connections') && (
        <>
          <DataWorkspaceHome onOpenModal={() => setIsModalOpen(true)} />
          <ModelSelectionModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onNext={() => {
              setIsModalOpen(false);
              setScreen('connections');
            }}
          />
        </>
      )}

      {/* Connection selection from home — RdModal floats on top of the home page */}
      {screen === 'connections' && (
        <ConnectionSelectionScreen
          onBack={() => {
            setScreen('home');
            setIsModalOpen(true);
          }}
          onDismiss={() => setScreen('home')}
          onNext={(conn) => {
            setSelectedConnection(conn);
            setScreen('onboarding');
          }}
        />
      )}

      {screen === 'onboarding' && selectedConnection && (
        <ModelOnboardingScreen
          connection={selectedConnection}
          onBuild={() => setScreen('editor')}
          onSkip={() => setScreen('editor')}
          onExit={() => {/* no-op — 'Exit data model' is present for visual parity only */}}
          onChangeConnection={() => setShowConnectionPicker(true)}
        />
      )}

      {/* Connection picker opened from onboarding — RdModal floats on top of the onboarding screen */}
      {screen === 'onboarding' && showConnectionPicker && (
        <ConnectionSelectionScreen
          cancelLabel="Cancel"
          confirmLabel="Apply"
          onBack={() => setShowConnectionPicker(false)}
          onDismiss={() => setShowConnectionPicker(false)}
          onNext={(conn) => {
            setSelectedConnection(conn);
            setShowConnectionPicker(false);
          }}
        />
      )}

      {screen === 'editor' && <SearchDataOnDataModelFinal />}
    </>
  );
};
export default SearchDataOnDataModelFinalEntry;
