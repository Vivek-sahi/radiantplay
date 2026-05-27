import React, { useState } from 'react';
import {
  SpotterShell,
  SpotterLeftSide,
  SpotterRail,
  SpotterRailItem,
  SpotterPanel,
  SpotterPanelAction,
  SpotterPanelSection,
  SpotterPanelItem,
  SpotterLeftToggle,
  SpotterWelcome,
} from '@spotter/page';
import { GlobalHeader } from '@components/GlobalHeader';
import { SpotterChatProvider } from '@spotter/chat';

const sampleRail = (mode: 'rail' | 'panel', onToggle: () => void) => (
  <SpotterRail
    top={
      <>
        <SpotterLeftToggle mode={mode} onClick={onToggle} />
        <SpotterRailItem icon="plus" label="New chat" onClick={() => undefined} />
      </>
    }
    bottom={<SpotterRailItem icon="cog" label="Settings" onClick={() => undefined} />}
  />
);

const samplePanel = (mode: 'rail' | 'panel', onToggle: () => void) => (
  <SpotterPanel
    top={<SpotterLeftToggle mode={mode} onClick={onToggle} />}
    primaryAction={<SpotterPanelAction label="New chat" icon="plus" />}
    footer={<SpotterPanelAction label="Settings" icon="cog" />}
  >
    <SpotterPanelSection label="Analysts">
      <SpotterPanelItem label="Sales analyst" selected />
      <SpotterPanelItem label="Pipeline analyst" />
      <SpotterPanelItem label="View all" trailingIcon="chevron-right" />
    </SpotterPanelSection>
    <SpotterPanelSection label="Chats">
      <SpotterPanelItem label="Q4 sales by region" />
      <SpotterPanelItem label="Top accounts this quarter" />
      <SpotterPanelItem label="Churn trends 2026" />
    </SpotterPanelSection>
  </SpotterPanel>
);

/**
 * SpotterShell at full viewport — no Radiant chrome around it. Linked from
 * the SpotterShell doc page via the "View fullscreen ↗" link.
 */
export const SpotterShellFullscreen: React.FC = () => {
  const [mode, setMode] = useState<'rail' | 'panel'>('panel');
  const [v, setV] = useState('');
  const toggle = (): void => setMode((m) => (m === 'rail' ? 'panel' : 'rail'));

  return (
    <SpotterChatProvider mode="canned">
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
        <SpotterShell
          header={
            <GlobalHeader
              theme="light"
              userName="Mohammed"
              notificationCount={2}
              searchPlaceholder="Search Spotter"
            />
          }
          leftSide={
            <SpotterLeftSide mode={mode} onToggle={toggle} rail={sampleRail(mode, toggle)} panel={samplePanel(mode, toggle)} />
          }
        >
          <SpotterWelcome
            promptProps={{
              value: v,
              onChange: setV,
              onSubmit: () => undefined,
              dataModelLabel: 'Sales core',
              onDataModelClick: () => undefined,
            }}
          />
        </SpotterShell>
      </div>
    </SpotterChatProvider>
  );
};

export default SpotterShellFullscreen;
