// The grid's public contract, trimmed from the LLD (02-contract.md) to what the prototype exercises.

export type Value = string | number | boolean | null;
export type DataType = 'text' | 'number' | 'currency' | 'percent' | 'date' | 'dropdown' | 'boolean';
export type Tone = 'neutral' | 'green' | 'amber' | 'blue' | 'purple';
export type RowHeight = 'compact' | 'standard' | 'open';
export type Mode = 'light' | 'dark';

/** A feature switch: on, off, or off with a reason the user sees (LLD decision 38). */
export type Switch = boolean | { disabledReason: string };
export const isOn = (s: Switch | undefined, fallback = true): boolean => (s === undefined ? fallback : s === true);
export const reasonOf = (s: Switch | undefined): string | null =>
  typeof s === 'object' && s ? s.disabledReason : null;

export type BadgeIcon = 'sort-asc' | 'sort-desc' | 'filter' | 'fx' | 'input' | 'key';
export interface Badge {
  icon: BadgeIcon;
  label: string; // shown in the tooltip, and read by screen readers
  active?: boolean; // blue: an active sort or filter
}

export interface Option {
  value: string;
  label: string;
  tone: Tone;
}

export interface Column {
  id: string;
  title: string;
  dataType: DataType;
  width?: number;
  editable?: Switch;
  badges?: Badge[];
  options?: Option[];
  placeholder?: string;
  /** Host rule on a parsed value; returns the reason it's invalid, or null. */
  validate?: (value: Value, row: Row) => string | null;
  invalidInput?: 'reject' | 'keep';
  renamable?: Switch;
  menu?: MenuEntry[];
}

export type Row = Record<string, Value> & { __id: string };

export interface MenuEntry {
  id: string;
  label: string;
  icon?: string;
  enabled?: Switch;
  danger?: boolean;
  divider?: boolean;
  submenu?: MenuEntry[];
}

export type NoticeTone = 'error' | 'warning' | 'info';
export interface CellRef {
  rowId: string;
  colId: string;
}
export interface Notice {
  id: string;
  tone: NoticeTone;
  title: string;
  detail?: string;
  cells?: CellRef[]; // a notice about cells jumps to the first one when clicked
  action?: { label: string; run: () => Promise<void> | void };
  dismissible?: boolean;
  owner: 'grid' | 'host';
}

export interface CellError {
  rowId: string;
  colId: string;
  reason: string;
  kind: 'server' | 'notSaved';
}

export interface CellEdit {
  rowId: string;
  colId: string;
  oldValue: Value;
  value: Value;
  valid: boolean;
  text?: string; // for kept invalid input
  error?: string;
}

export type EditSource = 'type' | 'paste' | 'fill' | 'clear' | 'cut' | 'pick';

export interface ViewState {
  order: string[];
  widths: Record<string, number>;
  frozenCols: number;
  frozenRows: number;
}
