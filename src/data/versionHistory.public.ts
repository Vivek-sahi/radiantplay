/**
 * Version History — PUBLIC build.
 *
 * Swapped in for src/data/versionHistory.ts by scripts/public-strip.sh at export time.
 * Public releases use SemVer starting at 1.0.0, independent of the internal CalVer.
 * Keep this file's exported API identical to versionHistory.ts — only the data differs.
 */
import { PLATFORM_VERSION } from './platformVersion';

export type ChangeType = 'added' | 'modified' | 'removed' | 'synced';
export type VersionType = 'major' | 'minor' | 'patch' | 'figma-sync';

export interface VersionChange {
  type: ChangeType;
  component: string;
  description: string;
  group?: string; // optional theme group — renders a section header in the changelog
}

export interface VersionEntry {
  version: string;
  date: string;
  type: VersionType;
  changes: VersionChange[];
}

/**
 * Version history entries - newest first
 */
export const versionHistory: VersionEntry[] = [
  {
    version: '1.0.0',
    date: '2026-05-27',
    type: 'major',
    changes: [
      { type: 'added', group: 'Release', component: 'First public release', description: 'Radiant Play is now open: the Radiant design system primitives, layout components, design tokens, and a starter set of sample prototypes to build from.' },
      { type: 'added', group: 'Components', component: 'Radiant component library', description: '70+ product-agnostic components — inputs, actions, feedback, overlays, data display, navigation — plus layout primitives (Horizontal, Vertical, View, Grid).' },
      { type: 'added', group: 'Prototypes', component: 'Sample prototypes', description: 'A starter set of sample prototypes demonstrating realistic data, layout primitives, and component composition.' },
    ],
  },
];

/**
 * Get the current version (latest entry)
 */
export const getCurrentVersion = (): string => {
  return PLATFORM_VERSION;
};

/**
 * Get recent version entries
 */
export const getRecentVersions = (count: number = 5): VersionEntry[] => {
  return versionHistory.slice(0, count);
};

/**
 * Get change type icon
 */
export const getChangeTypeIcon = (type: ChangeType): string => {
  switch (type) {
    case 'added':
      return '+';
    case 'modified':
      return '~';
    case 'removed':
      return '-';
    case 'synced':
      return '↻';
    default:
      return '•';
  }
};

/**
 * Get change type color
 */
export const getChangeTypeColor = (type: ChangeType): string => {
  switch (type) {
    case 'added':
      return 'var(--rd-sys-color-content-success, #06BF7F)';
    case 'modified':
      return 'var(--rd-sys-color-content-brand, #2770EF)';
    case 'removed':
      return 'var(--rd-sys-color-content-failure, #E22B3D)';
    case 'synced':
      return 'var(--rd-ref-color-purple-60, #8C62F5)';
    default:
      return 'var(--rd-sys-color-content-secondary, #777E8B)';
  }
};

/**
 * Get version type label
 */
export const getVersionTypeLabel = (type: VersionType): string => {
  switch (type) {
    case 'major':
      return 'Major Release';
    case 'minor':
      return 'Minor Release';
    case 'patch':
      return 'Patch';
    case 'figma-sync':
      return 'Figma Sync';
    default:
      return 'Update';
  }
};
