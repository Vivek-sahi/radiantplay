import { CSSProperties } from 'react';
import { systemColors } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

// ── Layout constants ──────────────────────────────────────────────────────────
export const HEADER_HEIGHT = 56;
export const LEFT_PANEL_WIDTH = 240;
export const RIGHT_PANEL_WIDTH = 320;
export const GLOBAL_NAV_HEIGHT = 48;

// ── Shared style objects ──────────────────────────────────────────────────────
export const styles: Record<string, CSSProperties> = {
  // Full-height app shell
  shell: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: systemColors.light['background-sunken'],
    fontFamily: 'Inter, system-ui, sans-serif',
  },

  // Global top bar (dark)
  globalHeader: {
    height: GLOBAL_NAV_HEIGHT,
    backgroundColor: '#1D232F',
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${spacing.D}px`,
    flexShrink: 0,
    gap: spacing.C,
  },

  // Project workspace header (white)
  projectHeader: {
    height: HEADER_HEIGHT,
    backgroundColor: systemColors.light['background-base'],
    borderBottom: `1px solid ${systemColors.light['border-divider']}`,
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${spacing.D}px`,
    flexShrink: 0,
    gap: spacing.C,
  },

  // Left panel (project metadata)
  leftPanel: {
    width: LEFT_PANEL_WIDTH,
    flexShrink: 0,
    backgroundColor: systemColors.light['background-base'],
    borderRight: `1px solid ${systemColors.light['border-divider']}`,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },

  // Center panel (tab views)
  centerPanel: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: systemColors.light['background-sunken'],
  },

  // Right panel (Data Agent)
  rightPanel: {
    width: RIGHT_PANEL_WIDTH,
    flexShrink: 0,
    backgroundColor: systemColors.light['background-base'],
    borderLeft: `1px solid ${systemColors.light['border-divider']}`,
    display: 'flex',
    flexDirection: 'column',
  },

  // Left panel section
  panelSection: {
    padding: `${spacing.D}px`,
    borderBottom: `1px solid ${systemColors.light['border-divider']}`,
  },

  panelSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.B,
  },

  panelSectionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: systemColors.light['content-primary'],
  },

  panelSectionSubtitle: {
    fontSize: 12,
    color: systemColors.light['content-secondary'],
    lineHeight: 1.4,
  },

  panelItem: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.B,
    padding: `${spacing.A}px 0`,
    fontSize: 13,
    color: systemColors.light['content-primary'],
    cursor: 'pointer',
  },

  // Projects list
  pageContainer: {
    padding: `${spacing.F}px ${spacing.H}px`,
    maxWidth: 1200,
    margin: '0 auto',
    width: '100%',
  },

  pageTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: spacing.F,
  },
};

// ── Color shortcuts ───────────────────────────────────────────────────────────
export const c = systemColors.light;
export const sp = spacing;
