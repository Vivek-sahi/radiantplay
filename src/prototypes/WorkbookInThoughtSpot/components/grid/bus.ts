// A tiny event bus. The grid and the host report what happened; the Journeys panel ticks steps off it,
// and the screen-reader panel shows what was announced.

export type BusEvent =
  | { type: 'select'; colId: string; rowIndex: number; kind: 'cells' | 'rows' | 'cols'; cells: number; mouse: boolean }
  | { type: 'edit-start'; colId: string; how: 'type' | 'f2' | 'mouse' }
  | { type: 'edit-commit'; colId: string; source: string; count: number; keyboard: boolean }
  | { type: 'edit-reject'; colId: string; reason: string }
  | { type: 'edit-kept'; colId: string }
  | { type: 'edit-cancel'; colId: string }
  | { type: 'readonly-hint'; colId: string }
  | { type: 'dropdown-open'; colId: string }
  | { type: 'dropdown-pick'; colId: string; search: boolean }
  | { type: 'date-open'; colId: string }
  | { type: 'date-pick'; colId: string }
  | { type: 'paste'; count: number; skipped: number }
  | { type: 'copy'; count: number }
  | { type: 'save-start'; count: number }
  | { type: 'save-done'; saved: number; rejected: number }
  | { type: 'save-failed' }
  | { type: 'retry' }
  | { type: 'jump'; colId: string; keyboard: boolean }
  | { type: 'notices-open' }
  | { type: 'menu-open'; colId: string; keyboard: boolean }
  | { type: 'menu-disabled-seen'; label: string }
  | { type: 'menu-action'; colId: string; id: string }
  | { type: 'menu-done'; colId: string; id: string; ok: boolean }
  | { type: 'loader'; on: boolean }
  | { type: 'add-menu' }
  | { type: 'col-added'; colId: string }
  | { type: 'rename-done'; colId: string; title: string }
  | { type: 'rename-error' }
  | { type: 'tabs-scroll' }
  | { type: 'tabs-list' }
  | { type: 'tab-switch'; name: string; viaList: boolean }
  | { type: 'focus-status' }
  | { type: 'shortcuts' }
  | { type: 'announce'; text: string; assertive: boolean }
  | { type: 'scenario'; key: string; value: unknown };

type Listener = (e: BusEvent) => void;
const listeners = new Set<Listener>();

export const bus = {
  emit(e: BusEvent) {
    listeners.forEach(l => l(e));
  },
  on(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

/** Screen-reader announcements go to a live region and to the bus (so sighted reviewers can see them). */
export function announce(text: string, assertive = false) {
  const el = document.getElementById(assertive ? 'kg-alert' : 'kg-status-live');
  if (el) {
    el.textContent = '';
    setTimeout(() => (el.textContent = text), 30);
  }
  bus.emit({ type: 'announce', text, assertive });
}

/** What a screen reader reads by itself (focus moving onto a cell or menu item). Shown in the panel only: announcing
 * it through the live region as well would make a real screen reader say it twice. */
export function narrate(text: string) {
  bus.emit({ type: 'announce', text, assertive: false });
}

if (import.meta.env.DEV) (window as unknown as { __bus: typeof bus }).__bus = bus;
