// Spotter — page surface. Full-page shells and panel chrome.

export { SpotterShell } from './SpotterShell';
export type { SpotterShellProps } from './SpotterShell';

export { SpotterLeftSide, SpotterLeftToggle } from './SpotterLeftSide';
export type {
  SpotterLeftSideProps,
  SpotterLeftToggleProps,
  SpotterLeftMode,
} from './SpotterLeftSide';

export { SpotterRail } from './SpotterRail';
export type { SpotterRailProps } from './SpotterRail';

export { SpotterRailItem } from './SpotterRailItem';
export type { SpotterRailItemProps } from './SpotterRailItem';

export { SpotterPanel, SpotterPanelAction } from './SpotterPanel';
export type {
  SpotterPanelProps,
  SpotterPanelActionProps,
} from './SpotterPanel';

export { SpotterPanelSection } from './SpotterPanelSection';
export type { SpotterPanelSectionProps } from './SpotterPanelSection';

export { SpotterPanelItem } from './SpotterPanelItem';
export type { SpotterPanelItemProps } from './SpotterPanelItem';

export { SpotterWelcome } from './SpotterWelcome';
export type { SpotterWelcomeProps } from './SpotterWelcome';

export { SettingsMenu } from './SettingsMenu';
export type { SettingsMenuProps } from './SettingsMenu';

export { PersonalMemoryToggle } from './PersonalMemoryToggle';
export type { PersonalMemoryToggleProps } from './PersonalMemoryToggle';

export { ChatRowMenu } from './ChatRowMenu';
export type { ChatRowMenuProps } from './ChatRowMenu';

export { AnalystRowMenu } from './AnalystRowMenu';
export type { AnalystRowMenuProps } from './AnalystRowMenu';

// The Spotter refresh left panel and zero states. Hosts render LeftPanel into
// SpotterShell's `leftSide` slot; the rail and panel above stay for the
// prototypes that already use them.
export * from './LeftPanel';

export { SpotterLanding } from './SpotterLanding';
export type { SpotterLandingProps } from './SpotterLanding';

export { AnalystLanding } from './AnalystLanding';
export type { AnalystLandingProps } from './AnalystLanding';

export { StarterChips, STARTER_CHIPS } from './StarterChips';
export type { StarterChip, StarterChipsProps } from './StarterChips';
