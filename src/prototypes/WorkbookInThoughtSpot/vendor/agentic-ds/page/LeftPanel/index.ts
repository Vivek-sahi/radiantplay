// The Spotter left panel — analysts, chats, and the settings menu.
//
// This lived in `prototypes/SpotterLeftPanel` and was imported across prototype
// folders by five other prototypes, which inverted the layering: prototypes are
// supposed to depend on the DS, not on each other. It is a Spotter domain
// surface, so it belongs here.
//
// `prototypes/SpotterLeftPanel` still exists as the panel's isolated playground.

export { LeftPanel } from './LeftPanel';
export type { LeftPanelProps } from './LeftPanel';

export { AnalystAvatar } from './AnalystAvatar';
export { NavListItem } from './NavListItem';
export { NavSectionHeader } from './NavSectionHeader';
export { PanelIconButton } from './PanelIconButton';
export { Collapsible } from './Collapsible';

export { RowMenu } from './RowMenu';
export type { RowMenuOption } from './RowMenu';

export { SettingsMenu } from './SettingsMenu';
export { useMenuAnchor, useMenuDismiss } from './useMenuAnchor';

export { ComposeIcon, PanelToggleIcon, SpotterMark } from './icons';

// The analyst and chat roster the panel renders. Hosts read it to resolve a
// selected id back to the thing it names.
export { analysts, chats, firstChatFor, landingFor } from './data';
export type { Analyst, AnalystAvatar as AnalystAvatarSpec, Chat } from './data';

export type { AttentionMotion } from './NavListItem';
