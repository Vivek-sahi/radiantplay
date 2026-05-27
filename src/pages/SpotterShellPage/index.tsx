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
import { PreviewCard } from '../SpotterShowcase/PreviewCard';
import pageStyles from './SpotterShellPage.module.css';

// ── Shared preview helpers ────────────────────────────────────────────────

const PREVIEW_HEIGHT = 360;

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

const ShellDemo: React.FC = () => {
  const [mode, setMode] = useState<'rail' | 'panel'>('panel');
  const toggle = (): void => setMode((m) => (m === 'rail' ? 'panel' : 'rail'));

  return (
    <div style={{ width: '100%', height: PREVIEW_HEIGHT, border: '1px solid var(--rd-sys-color-background-subtle)', borderRadius: 8, overflow: 'hidden' }}>
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
        <div style={{ padding: 24, color: 'var(--rd-sys-color-content-tertiary)', fontStyle: 'italic' }}>
          (Canvas — chat thread or welcome state goes here)
        </div>
      </SpotterShell>
    </div>
  );
};

const LeftSidePanelDemo: React.FC = () => {
  const [mode, setMode] = useState<'rail' | 'panel'>('panel');
  const toggle = (): void => setMode((m) => (m === 'rail' ? 'panel' : 'rail'));
  return (
    <div style={{ height: PREVIEW_HEIGHT, display: 'flex' }}>
      <SpotterLeftSide mode={mode} onToggle={toggle} rail={sampleRail(mode, toggle)} panel={samplePanel(mode, toggle)} />
      <div style={{ flex: 1, padding: 16, color: 'var(--rd-sys-color-content-tertiary)', fontStyle: 'italic', fontSize: 13 }}>
        Current mode: <strong>{mode}</strong>. Click the toggle inside the {mode === 'panel' ? 'panel' : 'rail'} to switch.
      </div>
    </div>
  );
};

const WelcomeDefaultDemo: React.FC = () => {
  const [v, setV] = useState('');
  return (
    <div style={{ width: '100%', height: PREVIEW_HEIGHT, overflow: 'hidden', display: 'flex' }}>
      <SpotterWelcome
        promptProps={{
          value: v,
          onChange: setV,
          onSubmit: () => undefined,
          dataModelLabel: 'Sales core',
          onDataModelClick: () => undefined,
        }}
      />
    </div>
  );
};

const WelcomeCustomDemo: React.FC = () => {
  const [v, setV] = useState('');
  return (
    <div style={{ width: '100%', height: PREVIEW_HEIGHT, overflow: 'hidden', display: 'flex' }}>
      <SpotterWelcome
        greeting={
          <h1 style={{ margin: 0, fontFamily: '"Plain", sans-serif', fontSize: 28, fontWeight: 600, color: 'var(--rd-sys-color-content-primary)', textAlign: 'center' }}>
            Welcome back, Mohammed.
          </h1>
        }
        promptProps={{
          value: v,
          onChange: setV,
          onSubmit: () => undefined,
          dataModelLabel: 'Sales core',
          onDataModelClick: () => undefined,
        }}
      />
    </div>
  );
};

const LeftToggleDemo: React.FC = () => {
  const [mode, setMode] = useState<'rail' | 'panel'>('panel');
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center', padding: 16, background: 'var(--rd-sys-color-background-sunken)', borderRadius: 8 }}>
      <SpotterLeftToggle mode={mode} onClick={() => setMode((m) => (m === 'rail' ? 'panel' : 'rail'))} />
      <span style={{ fontSize: 13, color: 'var(--rd-sys-color-content-secondary)' }}>Current mode: <strong>{mode}</strong> — click to toggle</span>
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────

export const SpotterShellPage: React.FC = () => {
  return (
    <div className={pageStyles.page}>
      <header className={pageStyles.pageHeader}>
        <nav className={pageStyles.breadcrumb} aria-label="Breadcrumb">
          <a href="/radiant">Home</a>
          <span className={pageStyles.breadcrumbSeparator}>›</span>
          <a href="/radiant/spotter">Spotter DS</a>
          <span className={pageStyles.breadcrumbSeparator}>›</span>
          <span className={pageStyles.breadcrumbCurrent}>SpotterShell</span>
        </nav>
        <h1 className={pageStyles.pageTitle}>SpotterShell</h1>
        <p className={pageStyles.pageSubtitle}>
          Full-page Spotter layout primitives. Imported from <code>@spotter/page</code>. Covers the shell itself plus the
          left-side rail / panel chrome, panel composition, welcome canvas, and toggle.
        </p>
      </header>

      <PreviewCard
        name="SpotterShell"
        path="@spotter/page"
        description={`Full-page Spotter layout: top app nav (Radiant GlobalHeader in light theme), Spotter left bar on the left, canvas on the right. Like AppShell but with the Spotter rail/panel instead of AppSidebar. The header and leftSide slots are consumer-owned — pass GlobalHeader (light theme) into header and either SpotterRail or SpotterPanel via SpotterLeftSide into leftSide.`}
        fullSizeHref="/preview/spottershell"
        variants={[
          {
            label: 'Default',
            description: 'Light GlobalHeader + Spotter left side + canvas stub. Click the toggle to swap rail/panel.',
            node: <ShellDemo />,
          },
        ]}
      />

      <PreviewCard
        name="SpotterLeftSide"
        path="@spotter/page"
        description={`The Spotter left navigation. Renders one of two compositions and animates the width between them:\n\n• Rail mode (64px, icon-only) — built from \`SpotterRail\` + \`SpotterRailItem\`. Top + bottom slots, icon buttons with tooltip labels.\n• Panel mode (260px, with labels and sections) — built from \`SpotterPanel\` + \`SpotterPanelAction\` (primary + footer) + \`SpotterPanelSection\` + \`SpotterPanelItem\` (rows with icon, label, optional trailing icon, selected state).\n\nA single component with two states — click the toggle inside to switch.`}
        variants={[
          {
            label: 'Default',
            description: 'Starts in panel mode (Analysts + Chats sections). Click the toggle to collapse to rail; click again to expand back.',
            node: <LeftSidePanelDemo />,
          },
        ]}
      />

      <PreviewCard
        name="SpotterWelcome"
        path="@spotter/page"
        description="Welcome canvas — radial brand glow + greeting + prompt + optional quick actions. Greeting accepts a string or ReactNode; pass quickActionProps to render the default QuickActionRow."
        useTabs
        variants={[
          {
            label: 'Default greeting',
            description: 'Renders the brand default greeting and the standard quick-action row.',
            node: <WelcomeDefaultDemo />,
          },
          {
            label: 'Custom greeting',
            description: 'Greeting overridden with a custom ReactNode. Use this for returning-user / topical states once those land.',
            node: <WelcomeCustomDemo />,
          },
        ]}
      />

      <PreviewCard
        name="SpotterLeftToggle"
        path="@spotter/page"
        description="Default toggle button — sidebar/layout glyph with a tooltip that flips based on mode."
        variants={[
          {
            label: 'Both states',
            description: 'Click to flip. Tooltip wording adapts.',
            node: <LeftToggleDemo />,
          },
        ]}
      />

      <PreviewCard
        name="Spotter topbar variants"
        path="@spotter/page (planned)"
        description="Topbar treatments for different surface contexts — with / without breadcrumbs, with a model-context chip, embedded mode."
        variants={[]}
        planned
        plannedHint="Design pending. Standalone today uses Radiant GlobalHeader (light). These variants may wrap or replace it. See spotter-components.md → Planned components."
      />
    </div>
  );
};

export default SpotterShellPage;
