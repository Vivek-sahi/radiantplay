import React, { useMemo, useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button';
import { SegmentedControl } from '../../../components/SegmentedControl';
import { Select, SelectOption } from '../../../components/Select';
import { SearchInput } from '../../../components/SearchInput';
import { Checkbox } from '../../../components/Checkbox';
import { DatePicker } from '../../../components/DatePicker';
import { Horizontal, Vertical } from '../../../components/Layout';
import { c, sp, fs, fw, ff } from '../styles';

/*
  ── Filter — the spreadsheet's own modal ──────────────────────────────────────
  Replicates ThoughtSpot's shipping `Select value for :` dialog, which is where this
  object comes from: filters are authored **in the spreadsheet and nowhere else**
  (Vivek, 2026-08-19), so we adopt the spreadsheet's pattern rather than designing one.
  The side-panel filter that used to live on the Fields pane and on a card is gone.

  ⚠️ **There is no scratch filter.** Applying one saves it — "by default, whatever you do in
  a data model does get saved" (Vivek, 2026-08-19). So there is no Save step on the marker, no
  promoted-versus-exploratory distinction, and nothing for a filter to be promoted *into*: a
  filter on a column of this model is part of this model from the moment it applies.

  ⚠️ **It is a family, not one modal.** The reference is a *date* column — Rolling /
  Fixed → a value → a Preview chip. A number, a string and a boolean column each need
  their own controls, and the renewal-risk tables have all four. What every variant
  keeps is the **Preview chip stating the resolved filter in words**: that is the
  explain-don't-prevent posture, and it is the only part of this dialog that tells the
  user what they are about to do to their rows.
*/

export type FilterKind = 'date' | 'number' | 'string' | 'boolean';

/**
 * One column's filter.
 *
 * Deliberately flat rather than a discriminated union per kind: the modal edits a draft
 * in place and a union would mean rebuilding the draft on every kind switch, for a
 * prototype where a column's kind never changes under it.
 */
export interface SheetFilter {
  col: string;
  kind: FilterKind;
  /** date */
  dateMode: 'rolling' | 'fixed';
  rolling: string;
  fixedFrom: string;
  fixedTo: string;
  /** number */
  numOp: string;
  numValue: string;
  numValue2: string;
  /** string + boolean — the checked values */
  values: string[];
}

/**
 * Filter operator → the words shown for it.
 *
 * ⚠️ Module scope, and exported, deliberately: this used to be declared inside the
 * property panel's filter branch, and every surface that has to *summarise* a filter
 * needs the same words. Two copies of a label map is how a condition ends up worded
 * differently in two places.
 */
export const OPERATOR_LABEL: Record<string, string> = {
  '=': 'equals', '!=': 'does not equal', '>': 'greater than', '<': 'less than',
  '>=': 'greater or equal', '<=': 'less or equal', contains: 'contains',
  'is null': 'is null', 'is not null': 'is not null',
};

/**
 * The number variant's conditions.
 *
 * ⚠️ Kept separate from `OPERATOR_LABEL` rather than merged into it: `between` takes two
 * values and the card-level filter form builds its dropdown by mapping that map, so
 * merging would offer a condition that form cannot apply.
 */
const NUMBER_OPS = ['=', '!=', '>', '>=', '<', '<=', 'between', 'is null', 'is not null'];
const numOpLabel = (op: string) => (op === 'between' ? 'between' : OPERATOR_LABEL[op] ?? op);
const NEEDS_NO_VALUE = new Set(['is null', 'is not null']);

const NUMERIC_TYPES = ['INT', 'FLOAT', 'DECIMAL', 'NUMERIC', 'INTEGER', 'BIGINT'];
const DATE_TYPES = ['DATE', 'TIMESTAMP', 'DATETIME'];

/** Which variant a column's SQL type gets. Anything unrecognised is treated as a string. */
export function filterKindFor(type: string): FilterKind {
  const t = (type ?? '').toUpperCase();
  if (DATE_TYPES.includes(t)) return 'date';
  if (NUMERIC_TYPES.includes(t)) return 'number';
  if (t === 'BOOLEAN' || t === 'BOOL') return 'boolean';
  return 'string';
}

// ── Rolling windows ───────────────────────────────────────────────────────────
// The list the reference dialog offers on a date column. Each resolves against *today*
// at apply time rather than being frozen at authoring time — that is what makes it
// rolling, and it is why the Preview chip states the dates it currently resolves to.
const ROLLING: { id: string; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last_7', label: 'Last 7 days' },
  { id: 'last_30', label: 'Last 30 days' },
  { id: 'last_90', label: 'Last 90 days' },
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'this_quarter', label: 'This quarter' },
  { id: 'this_year', label: 'This year' },
  { id: 'last_year', label: 'Last year' },
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => {
  const out = startOfDay(d);
  out.setDate(out.getDate() + n);
  return out;
};
const pad2 = (n: number) => String(n).padStart(2, '0');
/** MM/DD/YYYY — the format the reference chip uses. */
export const fmtDate = (d: Date) => `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
const isoDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** Resolve a rolling window to the inclusive day range it currently covers. */
function resolveRolling(id: string, now: Date): { from: Date; to: Date } {
  const today = startOfDay(now);
  switch (id) {
    case 'today': return { from: today, to: today };
    case 'yesterday': return { from: addDays(today, -1), to: addDays(today, -1) };
    case 'last_7': return { from: addDays(today, -6), to: today };
    case 'last_30': return { from: addDays(today, -29), to: today };
    case 'last_90': return { from: addDays(today, -89), to: today };
    case 'this_month': return { from: new Date(today.getFullYear(), today.getMonth(), 1), to: today };
    case 'last_month': return {
      from: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      to: new Date(today.getFullYear(), today.getMonth(), 0),
    };
    case 'this_quarter': return {
      from: new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1),
      to: today,
    };
    case 'this_year': return { from: new Date(today.getFullYear(), 0, 1), to: today };
    case 'last_year': return {
      from: new Date(today.getFullYear() - 1, 0, 1),
      to: new Date(today.getFullYear() - 1, 11, 31),
    };
    default: return { from: today, to: today };
  }
}

const rollingLabel = (id: string) => ROLLING.find(r => r.id === id)?.label ?? id;
const parseIso = (s: string): Date | null => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

/** A cell's value as a day, for date comparisons. Mock dates are `YYYY-MM-DD` strings. */
function cellAsDate(v: unknown): Date | null {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).slice(0, 10);
  return parseIso(s);
}

// ── The words ─────────────────────────────────────────────────────────────────
/**
 * The resolved filter, in words — the Preview chip, the column marker's tooltip and any
 * later list of saved filters all read from this, so a filter is described identically
 * wherever it appears.
 */
export function describeFilter(f: SheetFilter, now: Date = new Date()): string {
  switch (f.kind) {
    case 'date': {
      if (f.dateMode === 'fixed') {
        const from = parseIso(f.fixedFrom);
        const to = parseIso(f.fixedTo);
        if (from && to) return `${fmtDate(from)} – ${fmtDate(to)}`;
        if (from) return `on or after ${fmtDate(from)}`;
        if (to) return `on or before ${fmtDate(to)}`;
        return 'any date';
      }
      const { from, to } = resolveRolling(f.rolling, now);
      const stamp = isoDate(from) === isoDate(to) ? fmtDate(from) : `${fmtDate(from)} – ${fmtDate(to)}`;
      return `${rollingLabel(f.rolling)} (${stamp})`;
    }
    case 'number': {
      if (NEEDS_NO_VALUE.has(f.numOp)) return numOpLabel(f.numOp);
      if (f.numOp === 'between') return `between ${f.numValue || '—'} and ${f.numValue2 || '—'}`;
      return `${numOpLabel(f.numOp)} ${f.numValue || '—'}`;
    }
    case 'boolean':
    case 'string': {
      if (f.values.length === 0) return 'no values selected';
      if (f.values.length === 1) return `is ${f.values[0]}`;
      const head = f.values.slice(0, 2).join(', ');
      return f.values.length > 2
        ? `is any of ${head} +${f.values.length - 2}`
        : `is any of ${head}`;
    }
  }
}

/** Whether one cell value survives one filter. */
export function cellPassesFilter(f: SheetFilter, raw: unknown, now: Date = new Date()): boolean {
  switch (f.kind) {
    case 'date': {
      const d = cellAsDate(raw);
      if (!d) return false;
      if (f.dateMode === 'fixed') {
        const from = parseIso(f.fixedFrom);
        const to = parseIso(f.fixedTo);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      }
      const { from, to } = resolveRolling(f.rolling, now);
      return d >= from && d <= to;
    }
    case 'number': {
      if (f.numOp === 'is null') return raw === null || raw === undefined || raw === '';
      if (f.numOp === 'is not null') return !(raw === null || raw === undefined || raw === '');
      const n = Number(raw);
      if (!Number.isFinite(n)) return false;
      const a = Number(f.numValue);
      if (f.numOp === 'between') {
        const b = Number(f.numValue2);
        if (!Number.isFinite(a) || !Number.isFinite(b)) return true;
        return n >= Math.min(a, b) && n <= Math.max(a, b);
      }
      if (!Number.isFinite(a)) return true;
      switch (f.numOp) {
        case '=': return n === a;
        case '!=': return n !== a;
        case '>': return n > a;
        case '>=': return n >= a;
        case '<': return n < a;
        case '<=': return n <= a;
        default: return true;
      }
    }
    case 'boolean':
    case 'string': {
      // Nothing checked filters nothing out, rather than emptying the sheet — an
      // empty selection is an unfinished filter, not "show me no rows".
      if (f.values.length === 0) return true;
      return f.values.includes(raw === null || raw === undefined ? 'null' : String(raw));
    }
  }
}

/** A fresh draft for a column, defaulted the way the reference dialog opens. */
export function newFilter(col: string, kind: FilterKind): SheetFilter {
  return {
    col, kind,
    dateMode: 'rolling', rolling: 'today', fixedFrom: '', fixedTo: '',
    numOp: '>=', numValue: '', numValue2: '',
    values: [],
  };
}

export interface FilterModalProps {
  /**
   * The filter being authored or edited — a fresh draft from `newFilter`, or the existing
   * filter when opened from the column marker's Edit.
   *
   * ⚠️ **Mount this with `key={filter.col}`.** The draft is seeded once, on mount, so a
   * remount is what re-seeds it; without the key, opening a second column's filter would
   * inherit the first column's draft.
   */
  filter: SheetFilter;
  /**
   * Distinct values in that column, for the string and boolean variants. Taken from the
   * rows the sheet currently holds, so what is offered is what is actually there.
   */
  distinctValues: string[];
  onCancel: () => void;
  onApply: (f: SheetFilter) => void;
}

export function FilterModal({ filter, distinctValues, onCancel, onApply }: FilterModalProps) {
  const [draft, setDraft] = useState<SheetFilter>(filter);
  const [valueQuery, setValueQuery] = useState('');

  const set = (patch: Partial<SheetFilter>) => setDraft(d => ({ ...d, ...patch }));
  const shownValues = useMemo(
    () => distinctValues.filter(v => v.toLowerCase().includes(valueQuery.trim().toLowerCase())),
    [distinctValues, valueQuery],
  );
  const toggleValue = (v: string) => set({
    values: draft.values.includes(v) ? draft.values.filter(x => x !== v) : [...draft.values, v],
  });

  // Apply stays available unless the filter would mean nothing at all. The posture is
  // explain, don't prevent — a filter that matches no rows is a legitimate finding, and
  // the sheet showing no rows is how the user learns it.
  const nothingChosen =
    (draft.kind === 'string' || draft.kind === 'boolean') ? draft.values.length === 0
    : draft.kind === 'number' ? (!NEEDS_NO_VALUE.has(draft.numOp) && !draft.numValue.trim())
    : draft.dateMode === 'fixed' ? (!draft.fixedFrom && !draft.fixedTo)
    : false;

  const label = (t: string) => (
    <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: sp.A, fontFamily: ff.primary }}>{t}</div>
  );

  // ⚠️ `SelectOption` keys on `id`, not `value` — `value` is the optional override that
  // defaults to it. Same for `SegmentedControl`'s options.
  const rollingOptions: SelectOption[] = ROLLING.map(r => ({ id: r.id, label: r.label }));
  const numOptions: SelectOption[] = NUMBER_OPS.map(op => ({ id: op, label: numOpLabel(op) }));

  return (
    <Modal
      isOpen
      onClose={onCancel}
      /* Spacing around the colon is the reference's, not a typo. */
      title={`Select value for : ${draft.col}`}
      size="M2"
      footer={(
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: sp.B }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" disabled={nothingChosen} onClick={() => onApply(draft)}>Apply</Button>
        </div>
      )}
    >
      <Vertical gap={sp.E}>
        {draft.kind === 'date' && (
          <>
            <SegmentedControl
              options={[{ id: 'rolling', label: 'Rolling' }, { id: 'fixed', label: 'Fixed' }]}
              value={draft.dateMode}
              onChange={v => set({ dateMode: v as 'rolling' | 'fixed' })}
              aria-label="Date filter mode"
            />
            {draft.dateMode === 'rolling' ? (
              <div style={{ maxWidth: 260 }}>
                <Select options={rollingOptions} value={draft.rolling} onChange={v => set({ rolling: v })} />
              </div>
            ) : (
              <Horizontal gap={sp.C} align="end">
                <div>
                  {label('From')}
                  <DatePicker value={parseIso(draft.fixedFrom)} onChange={d => set({ fixedFrom: d ? isoDate(d) : '' })} />
                </div>
                <div>
                  {label('To')}
                  <DatePicker value={parseIso(draft.fixedTo)} onChange={d => set({ fixedTo: d ? isoDate(d) : '' })} />
                </div>
              </Horizontal>
            )}
          </>
        )}

        {draft.kind === 'number' && (
          <Horizontal gap={sp.C} align="end" wrap>
            <div style={{ width: 200 }}>
              {label('Condition')}
              <Select options={numOptions} value={draft.numOp} onChange={v => set({ numOp: v })} />
            </div>
            {!NEEDS_NO_VALUE.has(draft.numOp) && (
              <div style={{ width: 140 }}>
                {label(draft.numOp === 'between' ? 'From' : 'Value')}
                <input
                  value={draft.numValue}
                  onChange={e => set({ numValue: e.target.value })}
                  inputMode="decimal"
                  style={INPUT}
                />
              </div>
            )}
            {draft.numOp === 'between' && (
              <div style={{ width: 140 }}>
                {label('To')}
                <input
                  value={draft.numValue2}
                  onChange={e => set({ numValue2: e.target.value })}
                  inputMode="decimal"
                  style={INPUT}
                />
              </div>
            )}
          </Horizontal>
        )}

        {(draft.kind === 'string' || draft.kind === 'boolean') && (
          <>
            {draft.kind === 'string' && (
              <div style={{ maxWidth: 320 }}>
                <SearchInput
                  value={valueQuery}
                  onChange={e => setValueQuery(e.target.value)}
                  placeholder="Search values"
                />
              </div>
            )}
            {/* A plain block container: a list inside `View` would lay its rows out
                side by side, which is the trap that broke the entry-flow modals. */}
            <div style={{
              maxHeight: 240, overflowY: 'auto', border: `1px solid ${c['border-divider']}`,
              borderRadius: 6, padding: `${sp.B}px ${sp.C}px`,
            }}>
              {shownValues.length === 0 ? (
                <div style={{ fontSize: fs.xs, color: c['content-tertiary'], padding: `${sp.B}px 0`, fontFamily: ff.primary }}>
                  No matching values
                </div>
              ) : shownValues.map(v => (
                <div key={v} style={{ padding: '3px 0' }}>
                  <Checkbox
                    checked={draft.values.includes(v)}
                    onChange={() => toggleValue(v)}
                    label={v === 'null' ? '(null)' : v}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ height: 1, background: c['border-divider'] }} />

        {/*
          ── Preview ───────────────────────────────────────────────────────────────
          ⚠️ **Every variant keeps this.** The filter is stated in words, with a rolling
          window resolved to the dates it currently means, so the user reads what will
          happen to their rows before it happens. Correctness here is explanation, not
          validation — so this chip is load-bearing, not decoration.
        */}
        <div>
          {label('Preview:')}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: sp.A,
            background: c['background-subtle'], borderRadius: 999,
            padding: `${sp.A + 2}px ${sp.C}px`, fontSize: fs.sm, fontFamily: ff.primary,
            color: c['content-primary'], maxWidth: '100%',
          }}>
            <span>{draft.col}</span>
            <strong style={{ fontWeight: fw.semibold }}>{describeFilter(draft)}</strong>
          </span>
        </div>
      </Vertical>
    </Modal>
  );
}

const INPUT: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', height: 32,
  border: `1px solid ${c['border-default']}`, borderRadius: 6,
  padding: `0 ${sp.B}px`, fontSize: fs.xs, fontFamily: ff.primary,
  color: c['content-primary'], outline: 'none', background: c['background-base'],
};
