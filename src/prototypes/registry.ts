/**
 * Project Registry — Merger
 *
 * This file merges core (upstream) and mine (designer) registries.
 * Do not add prototypes here directly.
 *
 * - Upstream prototypes → registry-core.ts  (maintained by main repo)
 * - Your prototypes     → registry-mine.ts  (yours, never conflicts on sync)
 */

export type { ProjectMeta } from './registry-core';
export { coreRegistry } from './registry-core';
export { myRegistry } from './registry-mine';

import { coreRegistry, type ProjectMeta } from './registry-core';
import { myRegistry } from './registry-mine';

export const projectRegistry = [...coreRegistry, ...myRegistry];

/**
 * Whether a prototype renders light while the app is dark. Designer prototypes default to light, so
 * nothing they built before dark mode changes until they opt in with theme: 'global'.
 */
export function isLightOnly(project: ProjectMeta): boolean {
  if (project.theme === 'light-only') return true;
  if (project.theme === 'global') return false;
  return myRegistry.includes(project);
}

export function getProject(id: string) {
  return projectRegistry.find(p => p.id === id);
}

export function getAllProjects() {
  return projectRegistry;
}

export function projectExists(id: string): boolean {
  return projectRegistry.some(p => p.id === id);
}

export default projectRegistry;
