/**
 * Which prototypes render light while the app is dark.
 *
 * Kept out of registry.ts so forks that edited that file merge cleanly.
 * Designer prototypes (registry-mine.ts) default to light, so nothing built
 * before dark mode changes until it opts in with theme: 'global', which
 * /rp-new-prototype and /rp-migrate-prototype set once a prototype is dark ready.
 */
import type { ProjectMeta } from './registry-core';
import { myRegistry } from './registry-mine';

export function isLightOnly(project: ProjectMeta): boolean {
  if (project.theme === 'light-only') return true;
  if (project.theme === 'global') return false;
  return myRegistry.includes(project);
}
