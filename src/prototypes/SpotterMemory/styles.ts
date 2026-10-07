import { CSSProperties } from 'react';
import { sysVar } from '../../tokens/colors';
import { spacing } from '../../tokens/spacing';

/**
 * Styles for Spotter Memory prototype
 * Using CSS-in-JS for prototype-specific styling
 * Following Radiant design tokens and content guidelines
 */

export const styles = {
  // Main layout
  layout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: sysVar('background-sunken'),
    fontFamily: 'var(--font-family-primary)',
  } as CSSProperties,

  // Header area
  header: {
    flexShrink: 0,
    zIndex: 100,
  } as CSSProperties,

  // Body area (sidebar + main)
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  } as CSSProperties,

  // Sidebar
  sidebar: {
    width: '220px',
    flexShrink: 0,
    backgroundColor: sysVar('background-base'),
    borderRight: `1px solid ${sysVar('background-subtle')}`,
    overflowY: 'auto',
  } as CSSProperties,

  // Main content area
  main: {
    flex: 1,
    overflowY: 'auto',
    padding: `${spacing.F}px ${spacing.H}px`,
    backgroundColor: sysVar('background-base'),
  } as CSSProperties,

  // Content container
  content: {
    maxWidth: '1200px',
  } as CSSProperties,
};

// App Header styles - matching Liveboard header pattern
export const headerStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    padding: `0 ${spacing.F}px`,
    backgroundColor: sysVar('content-primary'),
    color: sysVar('background-base'),
    fontFamily: 'var(--font-family-primary)',
  } as CSSProperties,

  left: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.D}px`,
  } as CSSProperties,

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    color: sysVar('background-base'),
    fontWeight: 'var(--font-weight-emphasis)',
    fontSize: '16px',
  } as CSSProperties,

  iconTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.A}px`,
    marginLeft: `${spacing.C}px`,
    padding: `${spacing.A}px`,
    backgroundColor: `color-mix(in srgb, ${sysVar('background-base')} 8%, transparent)`,
    borderRadius: '6px',
  } as CSSProperties,

  iconTab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    cursor: 'pointer',
    color: `color-mix(in srgb, ${sysVar('background-base')} 60%, transparent)`,
    transition: 'all 0.15s ease',
  } as CSSProperties,

  iconTabActive: {
    backgroundColor: `color-mix(in srgb, ${sysVar('background-base')} 15%, transparent)`,
    color: sysVar('background-base'),
  } as CSSProperties,

  center: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '400px',
    margin: '0 auto',
  } as CSSProperties,

  searchContainer: {
    width: '100%',
    maxWidth: '280px',
  } as CSSProperties,

  searchInput: {
    width: '100%',
    height: '36px',
    padding: `0 ${spacing.C}px`,
    paddingLeft: '40px',
    backgroundColor: `color-mix(in srgb, ${sysVar('background-base')} 10%, transparent)`,
    border: `1px solid color-mix(in srgb, ${sysVar('background-base')} 10%, transparent)`,
    borderRadius: '6px',
    color: sysVar('background-base'),
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.15s ease',
  } as CSSProperties,

  right: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.D}px`,
  } as CSSProperties,

  iconButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    cursor: 'pointer',
    color: `color-mix(in srgb, ${sysVar('background-base')} 70%, transparent)`,
    transition: 'all 0.15s ease',
    position: 'relative',
  } as CSSProperties,

  notificationDot: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '8px',
    height: '8px',
    backgroundColor: sysVar('content-failure'),
    borderRadius: '50%',
    border: `2px solid ${sysVar('content-primary')}`,
  } as CSSProperties,
};

// Navigation sidebar styles - matching proper spacing from componentSpacing
export const sidebarStyles = {
  container: {
    padding: `${spacing.C}px 0`,
    fontFamily: 'var(--font-family-primary)',
  } as CSSProperties,

  section: {
    padding: `${spacing.B}px ${spacing.D}px`,
  } as CSSProperties,

  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.C}px ${spacing.D}px`,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    borderRadius: '0',
  } as CSSProperties,

  sectionTitle: {
    fontSize: '13px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    letterSpacing: '-0.1px',
  } as CSSProperties,

  sectionLabel: {
    fontSize: '11px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-tertiary'),
    textTransform: 'uppercase',
    letterSpacing: '0.6px',
    padding: `${spacing.D}px ${spacing.D}px ${spacing.B}px`,
    marginTop: `${spacing.B}px`,
  } as CSSProperties,

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    padding: `${spacing.B}px ${spacing.D}px ${spacing.B}px ${spacing.F}px`,
    fontSize: '13px',
    color: sysVar('content-secondary'),
    cursor: 'pointer',
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s ease',
    lineHeight: 1.4,
  } as CSSProperties,

  navItemActive: {
    color: sysVar('content-brand'),
    backgroundColor: `color-mix(in srgb, ${sysVar('content-brand')} 3%, transparent)`,
    borderLeftColor: sysVar('content-brand'),
    fontWeight: 500,
  } as CSSProperties,

  navItemHover: {
    backgroundColor: sysVar('background-sunken'),
  } as CSSProperties,

  externalLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: sysVar('content-tertiary'),
  } as CSSProperties,
};

// Page header styles
export const pageHeaderStyles = {
  container: {
    marginBottom: `${spacing.D}px`,
  } as CSSProperties,

  title: {
    fontSize: '20px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    margin: 0,
    marginBottom: `${spacing.B}px`,
    letterSpacing: '-0.2px',
  } as CSSProperties,

  description: {
    fontSize: '14px',
    color: sysVar('content-secondary'),
    margin: 0,
    marginBottom: `${spacing.D}px`,
    lineHeight: 1.5,
    maxWidth: '720px',
  } as CSSProperties,

  tabs: {
    borderBottom: `1px solid ${sysVar('background-subtle')}`,
  } as CSSProperties,
};

// Toolbar styles
export const toolbarStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: `${spacing.D}px`,
    marginBottom: `${spacing.D}px`,
    gap: `${spacing.D}px`,
  } as CSSProperties,

  searchWrapper: {
    width: '260px',
  } as CSSProperties,
};

// Table styles
export const tableStyles = {
  container: {
    backgroundColor: sysVar('background-base'),
    borderRadius: '8px',
    border: `1px solid ${sysVar('background-subtle')}`,
    overflow: 'hidden',
  } as CSSProperties,

  linkCell: {
    color: sysVar('content-brand'),
    textDecoration: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '13px',
  } as CSSProperties,

  authorCell: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
  } as CSSProperties,

  modelsCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'wrap',
  } as CSSProperties,

  moreLink: {
    color: sysVar('content-brand'),
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  } as CSSProperties,

  actionsCell: {
    display: 'flex',
    justifyContent: 'flex-end',
  } as CSSProperties,

  moreButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: sysVar('content-tertiary'),
    transition: 'background-color 0.15s ease',
  } as CSSProperties,

  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: `${spacing.C}px ${spacing.D}px`,
    borderTop: `1px solid ${sysVar('background-subtle')}`,
    gap: `${spacing.C}px`,
  } as CSSProperties,

  paginationText: {
    fontSize: '13px',
    color: sysVar('content-secondary'),
  } as CSSProperties,

  paginationLink: {
    fontSize: '13px',
    color: sysVar('content-brand'),
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 500,
  } as CSSProperties,
};
