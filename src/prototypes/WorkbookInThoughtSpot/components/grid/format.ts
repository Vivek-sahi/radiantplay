import type { Column, Value } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** Dates travel as ISO 'YYYY-MM-DD' strings; shown as '25 Jul 2026'. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

export function display(col: Column, v: Value): string {
  if (v === null || v === undefined || v === '') return '';
  switch (col.dataType) {
    case 'currency':
      return typeof v === 'number' ? `${v < 0 ? '-' : ''}$${money.format(Math.abs(v))}` : String(v);
    case 'percent':
      return typeof v === 'number' ? `${v.toFixed(1)}%` : String(v);
    case 'number':
      return typeof v === 'number' ? whole.format(v) : String(v);
    case 'date':
      return formatDate(String(v));
    case 'dropdown':
      return col.options?.find(o => o.value === v)?.label ?? String(v);
    case 'boolean':
      return v ? 'Yes' : 'No';
    default:
      return String(v);
  }
}

/** The text the editor opens with: raw, unformatted, so editing "$1,329.30" starts from "1329.3". */
export function editText(col: Column, v: Value): string {
  if (v === null || v === undefined) return '';
  if (col.dataType === 'boolean') return v ? 'Yes' : 'No';
  if (col.dataType === 'dropdown') return display(col, v);
  return String(v);
}

export const isNumeric = (col: Column) =>
  col.dataType === 'number' || col.dataType === 'currency' || col.dataType === 'percent';

export const alignOf = (col: Column): 'left' | 'right' => (isNumeric(col) ? 'right' : 'left');

/** Tabular digits for numbers and dates, so columns line up (foundations §1). */
export const tabularOf = (col: Column) => isNumeric(col) || col.dataType === 'date';

export type ParseResult = { ok: true; value: Value } | { ok: false; reason: string };

const NUMBER = /^-?\d+(\.\d+)?$/;
const MONTH_INDEX: Record<string, number> = Object.fromEntries(MONTHS.map((m, i) => [m.toLowerCase(), i + 1]));

/** Parses typed or pasted text strictly by data type (HLD §5.5 commit pipeline, step 1). */
export function parse(col: Column, text: string): ParseResult {
  const t = text.trim();
  if (t === '') return { ok: true, value: null };
  switch (col.dataType) {
    case 'number':
    case 'currency':
    case 'percent': {
      const cleaned = col.dataType === 'currency' ? t.replace(/^\$/, '') : col.dataType === 'percent' ? t.replace(/%$/, '') : t;
      if (!NUMBER.test(cleaned)) return { ok: false, reason: col.dataType === 'number' ? 'Enter a number, like 12' : 'Enter a number, like 24.5' };
      return { ok: true, value: Number(cleaned) };
    }
    case 'date': {
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return { ok: true, value: t };
      const m = /^(\d{1,2})\s+([A-Za-z]{3})\w*\s+(\d{4})$/.exec(t);
      if (m && MONTH_INDEX[m[2].toLowerCase()]) {
        return { ok: true, value: `${m[3]}-${String(MONTH_INDEX[m[2].toLowerCase()]).padStart(2, '0')}-${m[1].padStart(2, '0')}` };
      }
      return { ok: false, reason: 'Enter a date, like 25 Jul 2026' };
    }
    case 'boolean': {
      if (/^(yes|true|1|y)$/i.test(t)) return { ok: true, value: true };
      if (/^(no|false|0|n)$/i.test(t)) return { ok: true, value: false };
      return { ok: false, reason: 'Enter Yes or No' };
    }
    case 'dropdown': {
      const opt = col.options?.find(o => o.label.toLowerCase() === t.toLowerCase() || o.value.toLowerCase() === t.toLowerCase());
      return opt ? { ok: true, value: opt.value } : { ok: false, reason: `Pick one of: ${col.options?.map(o => o.label).join(', ')}` };
    }
    default:
      return { ok: true, value: t };
  }
}
