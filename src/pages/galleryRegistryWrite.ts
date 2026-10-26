/**
 * Saving gallery edits (groups, archive) to src/prototypes/registry-mine.ts.
 *
 * Under `npm run dev` the gallery posts to the dev server endpoint in
 * vite.registry-write.ts, which edits the file. A deployed site has no dev
 * server, and sample prototypes live in registry-core.ts, which the gallery
 * never writes; for those it hands the designer a prompt for Claude instead.
 */
import { myRegistry, ProjectMeta } from '../prototypes/registry';

export const REGISTRY_WRITE_PATH = '/__radiantplay/registry';
export const THUMBNAILS_PATH = '/__radiantplay/thumbnails';

export interface ThumbnailState {
  status: 'running' | 'idle';
  setup: 'ready' | 'setup-needed' | 'declined';
  capturing: string[];
  done: string[];
  failed: string[];
  /** The designer's prototypes that have no thumbnail yet and can be captured */
  missing: string[];
}

/** Capture status from the dev server; null on a deployed site, where there is none. */
export async function thumbnailState(ids?: string[]): Promise<ThumbnailState | null> {
  if (!import.meta.env.DEV) return null;
  try {
    const res = ids
      ? await fetch(THUMBNAILS_PATH, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
      : await fetch(THUMBNAILS_PATH);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** One entry's change, or a group rename across every entry in that group */
type EntryChange = { id: string; group?: string | null; section?: 'archived' | 'mine'; name?: string };
/** One entry's change, a group rename across every entry in it, or several changes in one write */
export type RegistryChange =
  | EntryChange
  | { renameGroup: { from: string; to: string } }
  | { batch: EntryChange[] };

/** True when this prototype's entry can be saved from the gallery right now. */
export function canSaveLocally(project: ProjectMeta): boolean {
  return import.meta.env.DEV && myRegistry.some((p) => p.id === project.id);
}

export async function saveRegistryChange(change: RegistryChange): Promise<boolean> {
  try {
    const res = await fetch(REGISTRY_WRITE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(change),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const registryFile = (project: ProjectMeta) =>
  myRegistry.some((p) => p.id === project.id) ? 'registry-mine.ts' : 'registry-core.ts';

/** Prompts the designer pastes into Claude when the gallery can't save itself. */
export function groupPrompt(project: ProjectMeta, group: string | null): string {
  return group
    ? `In src/prototypes/${registryFile(project)}, set the group of the '${project.id}' entry to '${group}'.`
    : `In src/prototypes/${registryFile(project)}, remove the group from the '${project.id}' entry.`;
}

export function renameGroupPrompt(from: string, to: string): string {
  return `In src/prototypes/registry-mine.ts, rename the group '${from}' to '${to}' on every entry that has it.`;
}

// A save rewrites registry-mine.ts, and Vite may reload the page to pick it up.
// The toast for that save waits in sessionStorage so it still shows afterwards.
const PENDING_TOAST_KEY = 'radiantplay:gallery-toast';

export interface SavedToast {
  message: string;
  detail?: string;
  undo?: RegistryChange;
}

export function stashToast(toast: SavedToast) {
  try {
    sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify(toast));
  } catch {
    // storage unavailable: the toast just won't survive a reload
  }
}

export function takeStashedToast(): SavedToast | null {
  try {
    const raw = sessionStorage.getItem(PENDING_TOAST_KEY);
    sessionStorage.removeItem(PENDING_TOAST_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed.message === 'string' ? parsed : null;
  } catch {
    return null;
  }
}
