import { useMemo, useState } from 'react';
import { Modal } from '../../../components/Modal/Modal';
import { Button } from '../../../components/Button';
import { SearchInput } from '../../../components/SearchInput';
import { Select, SelectOption } from '../../../components/Select';
import { c, sp, fs, fw, ff } from '../styles';

/*
  ── Insert formula ────────────────────────────────────────────────────────────
  Replicates ThoughtSpot's shipping "Insert formula" dialog. Formulas are authored **in
  the spreadsheet and nowhere else** (Vivek, 2026-08-19), and this is the front door: the
  side panel that used to author them is gone.

  ⚠️ **We are not building this dialog, we are replicating it.** The spreadsheet — this
  modal, the formula bar, the column ▾ and its rename — is being **inherited from another
  product team**. It is here so our workflow can be walked end to end, which is why the
  function reference is a faithful-looking catalogue rather than a complete one, and why
  the category filter and search are as far as the behaviour goes.

  The flow it starts: pick a function → **Insert formula** → the formula bar activates
  carrying `=fn ( placeholder )` with the placeholder selected → the user completes it →
  Enter adds a column at the far right of the sheet, loading first, then values.
*/

export interface FormulaFn {
  name: string;
  /** The signature as the dialog prints it, e.g. `ABS ( NUMBER )`. */
  signature: string;
  description: string;
  /** Worked examples, shown one per row in their own box. */
  examples: string[];
  category: FormulaCategory;
  /**
   * What lands in the formula bar on insert — the argument names, which become the
   * selectable placeholder(s). `[]` for a function that takes none.
   */
  args: string[];
}

export type FormulaCategory =
  | 'Aggregate' | 'Conditional' | 'Conversion' | 'Date' | 'Math' | 'Operators' | 'Text';

export const FORMULA_CATEGORIES: FormulaCategory[] = [
  'Aggregate', 'Conditional', 'Conversion', 'Date', 'Math', 'Operators', 'Text',
];

/**
 * The function reference.
 *
 * Alphabetical, the way the dialog lists it. Signatures, descriptions and examples follow
 * ThoughtSpot's own wording and shape (`ABS ( NUMBER )` · "Returns the absolute value of a
 * number." · `abs ( -10 ) = 10`, `abs ( profit )`) — one abstract example showing the
 * result, one column example showing the use.
 *
 * ⚠️ **Not the complete catalogue.** The real one runs past 150 functions; this is the set
 * worth reaching for, across every category, so the list scrolls and searches convincingly.
 * If a walkthrough needs a function that isn't here, add it — don't reword the ones that are.
 */
export const FORMULA_FNS: FormulaFn[] = [
  { name: 'ABS', signature: 'ABS ( NUMBER )', description: 'Returns the absolute value of a number.', examples: ['abs ( -10 ) = 10', 'abs ( profit )'], category: 'Math', args: ['number'] },
  { name: 'ACOS', signature: 'ACOS ( NUMBER )', description: 'Returns the arccosine of a number, in radians.', examples: ['acos ( 1 ) = 0', 'acos ( ratio )'], category: 'Math', args: ['number'] },
  { name: 'ADD_DAYS', signature: 'ADD_DAYS ( DATE, INTEGER )', description: 'Adds a number of days to a date.', examples: ['add_days ( 06/15/2026 , 5 ) = 06/20/2026', 'add_days ( renewal_date , 30 )'], category: 'Date', args: ['date', 'days'] },
  { name: 'ADD_MINUTES', signature: 'ADD_MINUTES ( DATE, INTEGER )', description: 'Adds a number of minutes to a date.', examples: ['add_minutes ( created_date , 90 )'], category: 'Date', args: ['date', 'minutes'] },
  { name: 'ADD_MONTHS', signature: 'ADD_MONTHS ( DATE, INTEGER )', description: 'Adds a number of months to a date.', examples: ['add_months ( 01/31/2026 , 1 ) = 02/28/2026', 'add_months ( start_date , 12 )'], category: 'Date', args: ['date', 'months'] },
  { name: 'ADD_SECONDS', signature: 'ADD_SECONDS ( DATE, INTEGER )', description: 'Adds a number of seconds to a date.', examples: ['add_seconds ( event_date , 30 )'], category: 'Date', args: ['date', 'seconds'] },
  { name: 'ADD_WEEKS', signature: 'ADD_WEEKS ( DATE, INTEGER )', description: 'Adds a number of weeks to a date.', examples: ['add_weeks ( renewal_date , 2 )'], category: 'Date', args: ['date', 'weeks'] },
  { name: 'ADD_YEARS', signature: 'ADD_YEARS ( DATE, INTEGER )', description: 'Adds a number of years to a date.', examples: ['add_years ( first_contract_date , 1 )'], category: 'Date', args: ['date', 'years'] },
  { name: 'ASIN', signature: 'ASIN ( NUMBER )', description: 'Returns the arcsine of a number, in radians.', examples: ['asin ( 0 ) = 0'], category: 'Math', args: ['number'] },
  { name: 'ATAN', signature: 'ATAN ( NUMBER )', description: 'Returns the arctangent of a number, in radians.', examples: ['atan ( 1 )'], category: 'Math', args: ['number'] },
  { name: 'AVERAGE', signature: 'AVERAGE ( MEASURE )', description: 'Returns the average of a measure across the rows in scope.', examples: ['average ( health_score )'], category: 'Aggregate', args: ['measure'] },
  { name: 'CEIL', signature: 'CEIL ( NUMBER )', description: 'Rounds a number up to the nearest integer.', examples: ['ceil ( 4.2 ) = 5', 'ceil ( discount_pct )'], category: 'Math', args: ['number'] },
  { name: 'CONCAT', signature: 'CONCAT ( TEXT, TEXT )', description: 'Joins two or more text values into one.', examples: ["concat ( 'Tier ' , account_tier )", 'concat ( region , country )'], category: 'Text', args: ['text1', 'text2'] },
  { name: 'CONTAINS', signature: 'CONTAINS ( TEXT, TEXT )', description: 'Returns true when the first text value contains the second.', examples: ["contains ( account_name , 'Corp' )"], category: 'Text', args: ['text', 'substring'] },
  { name: 'COS', signature: 'COS ( NUMBER )', description: 'Returns the cosine of an angle given in radians.', examples: ['cos ( 0 ) = 1'], category: 'Math', args: ['number'] },
  { name: 'COUNT', signature: 'COUNT ( COLUMN )', description: 'Counts the non-null values in a column.', examples: ['count ( case_id )'], category: 'Aggregate', args: ['column'] },
  { name: 'CUMULATIVE_SUM', signature: 'CUMULATIVE_SUM ( MEASURE )', description: 'Returns a running total of a measure.', examples: ['cumulative_sum ( net_new_arr )'], category: 'Aggregate', args: ['measure'] },
  { name: 'DATE_DIFF', signature: 'DATE_DIFF ( DATE, DATE )', description: 'Returns the number of days between two dates.', examples: ['date_diff ( start_date , end_date )', 'date_diff ( created_date , paid_date )'], category: 'Date', args: ['date1', 'date2'] },
  { name: 'DAY', signature: 'DAY ( DATE )', description: 'Returns the day of the month for a date.', examples: ['day ( 06/15/2026 ) = 15', 'day ( renewal_date )'], category: 'Date', args: ['date'] },
  { name: 'DAY_NUMBER_OF_WEEK', signature: 'DAY_NUMBER_OF_WEEK ( DATE )', description: 'Returns the day of the week for a date, as a number.', examples: ['day_number_of_week ( created_date )'], category: 'Date', args: ['date'] },
  { name: 'DAY_NUMBER_OF_YEAR', signature: 'DAY_NUMBER_OF_YEAR ( DATE )', description: 'Returns the day of the year for a date, as a number.', examples: ['day_number_of_year ( renewal_date )'], category: 'Date', args: ['date'] },
  { name: 'EDIT_DISTANCE', signature: 'EDIT_DISTANCE ( TEXT, TEXT )', description: 'Returns how many single-character edits separate two text values.', examples: ["edit_distance ( 'Acme' , 'Acme Corp' )"], category: 'Text', args: ['text1', 'text2'] },
  { name: 'EXP', signature: 'EXP ( NUMBER )', description: 'Returns e raised to the power of a number.', examples: ['exp ( 1 )'], category: 'Math', args: ['number'] },
  { name: 'FLOOR', signature: 'FLOOR ( NUMBER )', description: 'Rounds a number down to the nearest integer.', examples: ['floor ( 4.8 ) = 4', 'floor ( health_score )'], category: 'Math', args: ['number'] },
  { name: 'GROUP_AVERAGE', signature: 'GROUP_AVERAGE ( MEASURE, ATTRIBUTE )', description: 'Returns the average of a measure within each group.', examples: ['group_average ( arr , region )'], category: 'Aggregate', args: ['measure', 'attribute'] },
  { name: 'GROUP_COUNT', signature: 'GROUP_COUNT ( COLUMN, ATTRIBUTE )', description: 'Counts values within each group.', examples: ['group_count ( case_id , account_id )'], category: 'Aggregate', args: ['column', 'attribute'] },
  { name: 'GROUP_MAX', signature: 'GROUP_MAX ( MEASURE, ATTRIBUTE )', description: 'Returns the largest value of a measure within each group.', examples: ['group_max ( arr , segment )'], category: 'Aggregate', args: ['measure', 'attribute'] },
  { name: 'GROUP_SUM', signature: 'GROUP_SUM ( MEASURE, ATTRIBUTE )', description: 'Returns the total of a measure within each group.', examples: ['group_sum ( acv , account_id )'], category: 'Aggregate', args: ['measure', 'attribute'] },
  { name: 'HOUR', signature: 'HOUR ( DATE )', description: 'Returns the hour of the day for a date.', examples: ['hour ( last_seen )'], category: 'Date', args: ['date'] },
  { name: 'IF', signature: 'IF ( CONDITION ) THEN VALUE ELSE VALUE', description: 'Returns one value when a condition is true and another when it is false.', examples: ['if ( health_score < 50 ) then 1 else 0', "if ( auto_renew = true ) then 'Auto' else 'Manual'"], category: 'Conditional', args: ['condition'] },
  { name: 'IFNULL', signature: 'IFNULL ( COLUMN, VALUE )', description: 'Returns the column value, or a replacement when it is null.', examples: ['ifnull ( discount_pct , 0 )'], category: 'Conditional', args: ['column', 'value'] },
  { name: 'ISNULL', signature: 'ISNULL ( COLUMN )', description: 'Returns true when a value is null.', examples: ['isnull ( parent_account_id )'], category: 'Conditional', args: ['column'] },
  { name: 'LAST_DAY_OF_MONTH', signature: 'LAST_DAY_OF_MONTH ( DATE )', description: 'Returns the last day of the month a date falls in.', examples: ['last_day_of_month ( renewal_date )'], category: 'Date', args: ['date'] },
  { name: 'LN', signature: 'LN ( NUMBER )', description: 'Returns the natural logarithm of a number.', examples: ['ln ( arr )'], category: 'Math', args: ['number'] },
  { name: 'LOG10', signature: 'LOG10 ( NUMBER )', description: 'Returns the base-10 logarithm of a number.', examples: ['log10 ( employee_count )'], category: 'Math', args: ['number'] },
  { name: 'LOWER', signature: 'LOWER ( TEXT )', description: 'Converts text to lower case.', examples: ["lower ( 'ACME' ) = 'acme'", 'lower ( account_name )'], category: 'Text', args: ['text'] },
  { name: 'LTRIM', signature: 'LTRIM ( TEXT )', description: 'Removes leading spaces from text.', examples: ['ltrim ( owner )'], category: 'Text', args: ['text'] },
  { name: 'MAX', signature: 'MAX ( MEASURE )', description: 'Returns the largest value of a measure.', examples: ['max ( arr )'], category: 'Aggregate', args: ['measure'] },
  { name: 'MIN', signature: 'MIN ( MEASURE )', description: 'Returns the smallest value of a measure.', examples: ['min ( health_score )'], category: 'Aggregate', args: ['measure'] },
  { name: 'MOD', signature: 'MOD ( NUMBER, NUMBER )', description: 'Returns the remainder after dividing one number by another.', examples: ['mod ( 10 , 3 ) = 1', 'mod ( term_months , 12 )'], category: 'Math', args: ['number', 'divisor'] },
  { name: 'MONTH', signature: 'MONTH ( DATE )', description: 'Returns the month of a date.', examples: ['month ( renewal_date )'], category: 'Date', args: ['date'] },
  { name: 'MONTH_NUMBER', signature: 'MONTH_NUMBER ( DATE )', description: 'Returns the month of a date, as a number from 1 to 12.', examples: ['month_number ( 06/15/2026 ) = 6'], category: 'Date', args: ['date'] },
  { name: 'NOW', signature: 'NOW ( )', description: 'Returns the current date and time.', examples: ['now ( )', 'date_diff ( renewal_date , now ( ) )'], category: 'Date', args: [] },
  { name: 'POW', signature: 'POW ( NUMBER, NUMBER )', description: 'Raises a number to a power.', examples: ['pow ( 2 , 3 ) = 8', 'pow ( growth , 2 )'], category: 'Math', args: ['number', 'power'] },
  { name: 'QUARTER', signature: 'QUARTER ( DATE )', description: 'Returns the quarter a date falls in.', examples: ['quarter ( renewal_date )'], category: 'Date', args: ['date'] },
  { name: 'RANK', signature: 'RANK ( MEASURE )', description: 'Returns the rank of each row by a measure.', examples: ['rank ( arr )'], category: 'Aggregate', args: ['measure'] },
  { name: 'ROUND', signature: 'ROUND ( NUMBER, INTEGER )', description: 'Rounds a number to a given number of decimal places.', examples: ['round ( 4.567 , 2 ) = 4.57', 'round ( renewal_probability , 2 )'], category: 'Math', args: ['number', 'decimals'] },
  { name: 'RTRIM', signature: 'RTRIM ( TEXT )', description: 'Removes trailing spaces from text.', examples: ['rtrim ( owner )'], category: 'Text', args: ['text'] },
  { name: 'SIGN', signature: 'SIGN ( NUMBER )', description: 'Returns -1, 0 or 1 depending on the sign of a number.', examples: ['sign ( arr_change_pct )'], category: 'Math', args: ['number'] },
  { name: 'SIN', signature: 'SIN ( NUMBER )', description: 'Returns the sine of an angle given in radians.', examples: ['sin ( 0 ) = 0'], category: 'Math', args: ['number'] },
  { name: 'SQRT', signature: 'SQRT ( NUMBER )', description: 'Returns the square root of a number.', examples: ['sqrt ( 16 ) = 4', 'sqrt ( seats )'], category: 'Math', args: ['number'] },
  { name: 'STDDEV', signature: 'STDDEV ( MEASURE )', description: 'Returns the standard deviation of a measure.', examples: ['stddev ( health_score )'], category: 'Aggregate', args: ['measure'] },
  { name: 'STRPOS', signature: 'STRPOS ( TEXT, TEXT )', description: 'Returns the position of one text value inside another.', examples: ["strpos ( account_name , 'Corp' )"], category: 'Text', args: ['text', 'substring'] },
  { name: 'SUBSTR', signature: 'SUBSTR ( TEXT, INTEGER, INTEGER )', description: 'Returns part of a text value, from a start position for a length.', examples: ['substr ( account_id , 5 , 4 )'], category: 'Text', args: ['text', 'start', 'length'] },
  { name: 'SUM', signature: 'SUM ( MEASURE )', description: 'Returns the total of a measure.', examples: ['sum ( arr )', 'sum ( net_new_arr )'], category: 'Aggregate', args: ['measure'] },
  { name: 'TAN', signature: 'TAN ( NUMBER )', description: 'Returns the tangent of an angle given in radians.', examples: ['tan ( 0 ) = 0'], category: 'Math', args: ['number'] },
  { name: 'TO_BOOL', signature: 'TO_BOOL ( VALUE )', description: 'Converts a value to a boolean.', examples: ['to_bool ( is_reference )'], category: 'Conversion', args: ['value'] },
  { name: 'TO_DATE', signature: 'TO_DATE ( TEXT, TEXT )', description: 'Converts text to a date using a format.', examples: ["to_date ( order_date , 'yyyy-MM-dd' )"], category: 'Conversion', args: ['text', 'format'] },
  { name: 'TO_DOUBLE', signature: 'TO_DOUBLE ( VALUE )', description: 'Converts a value to a decimal number.', examples: ['to_double ( seats )'], category: 'Conversion', args: ['value'] },
  { name: 'TO_INTEGER', signature: 'TO_INTEGER ( VALUE )', description: 'Converts a value to a whole number.', examples: ['to_integer ( health_score )'], category: 'Conversion', args: ['value'] },
  { name: 'TO_STRING', signature: 'TO_STRING ( VALUE )', description: 'Converts a value to text.', examples: ['to_string ( employee_count )'], category: 'Conversion', args: ['value'] },
  { name: 'TRIM', signature: 'TRIM ( TEXT )', description: 'Removes leading and trailing spaces from text.', examples: ['trim ( account_name )'], category: 'Text', args: ['text'] },
  { name: 'UPPER', signature: 'UPPER ( TEXT )', description: 'Converts text to upper case.', examples: ["upper ( 'acme' ) = 'ACME'", 'upper ( region )'], category: 'Text', args: ['text'] },
  { name: 'VARIANCE', signature: 'VARIANCE ( MEASURE )', description: 'Returns the variance of a measure.', examples: ['variance ( arr )'], category: 'Aggregate', args: ['measure'] },
  { name: 'WEEK', signature: 'WEEK ( DATE )', description: 'Returns the week a date falls in.', examples: ['week ( created_date )'], category: 'Date', args: ['date'] },
  { name: 'YEAR', signature: 'YEAR ( DATE )', description: 'Returns the year of a date.', examples: ['year ( 06/15/2026 ) = 2026', 'year ( renewal_date )'], category: 'Date', args: ['date'] },
];

/**
 * What the formula bar receives on insert, and where the first placeholder sits.
 *
 * `=abs ( number )` with `number` selected, so typing replaces it — the reference's
 * behaviour. `selStart`/`selEnd` are the caret range the bar should select on focus.
 */
export function insertionFor(fn: FormulaFn): { text: string; selStart: number; selEnd: number } {
  const lower = fn.name.toLowerCase();
  if (fn.args.length === 0) {
    const text = `=${lower} ( )`;
    return { text, selStart: text.length, selEnd: text.length };
  }
  const text = `=${lower} ( ${fn.args.join(', ')} )`;
  const selStart = text.indexOf(fn.args[0]);
  return { text, selStart, selEnd: selStart + fn.args[0].length };
}

export interface InsertFormulaModalProps {
  onCancel: () => void;
  onInsert: (fn: FormulaFn) => void;
}

export function InsertFormulaModal({ onCancel, onInsert }: InsertFormulaModalProps) {
  const [category, setCategory] = useState<'all' | FormulaCategory>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string>(FORMULA_FNS[0].name);

  const shown = useMemo(() => FORMULA_FNS.filter(f => {
    if (category !== 'all' && f.category !== category) return false;
    const q = query.trim().toLowerCase();
    return !q || f.name.toLowerCase().includes(q);
  }), [category, query]);

  // The detail pane follows the selection, and falls back to the first row in view when a
  // filter or search has moved the selected function out of the list.
  const active = shown.find(f => f.name === selected) ?? shown[0] ?? null;

  const categoryOptions: SelectOption[] = [
    { id: 'all', label: 'All functions' },
    ...FORMULA_CATEGORIES.map(cat => ({ id: cat, label: cat })),
  ];

  return (
    <Modal
      isOpen
      onClose={onCancel}
      title="Insert formula"
      size="M3"
      footer={(
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: sp.B }}>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" disabled={!active} onClick={() => active && onInsert(active)}>
            Insert formula
          </Button>
        </div>
      )}
    >
      {/* One bordered card holding both panes, split by a single rule — the reference's
          frame. Fixed height so the list scrolls inside it rather than the modal growing
          with the number of functions. */}
      <div style={{
        display: 'flex', height: 420, border: `1px solid ${c['border-divider']}`,
        borderRadius: 8, overflow: 'hidden',
      }}>
        {/* ── Left rail: category · search · the list ────────────────────────────── */}
        <div style={{
          width: 300, flexShrink: 0, borderRight: `1px solid ${c['border-divider']}`,
          display: 'flex', flexDirection: 'column', minHeight: 0,
          background: c['background-sunken'],
        }}>
          <div style={{ padding: sp.C, display: 'flex', flexDirection: 'column', gap: sp.B, flexShrink: 0 }}>
            <Select
              options={categoryOptions}
              value={category}
              onChange={v => setCategory(v as 'all' | FormulaCategory)}
            />
            <SearchInput value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" />
          </div>
          {/* A plain block container, not `View` — a list inside one lays its rows out
              side by side. */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', borderTop: `1px solid ${c['border-divider']}` }}>
            {shown.length === 0 ? (
              <div style={{ padding: sp.D, fontSize: fs.xs, color: c['content-tertiary'], fontFamily: ff.primary }}>
                No functions match
              </div>
            ) : shown.map(f => {
              const isActive = active?.name === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => setSelected(f.name)}
                  /* The selected row sits on white against the rail's sunken ground and
                     carries a tick — that contrast is what makes it read as chosen rather
                     than merely hovered. */
                  style={{
                    display: 'flex', alignItems: 'center', gap: sp.B, width: '100%',
                    padding: `${sp.B}px ${sp.C}px`, border: 'none', textAlign: 'left',
                    background: isActive ? c['background-base'] : 'transparent',
                    cursor: 'pointer', fontFamily: ff.primary, fontSize: fs.xs,
                    fontWeight: isActive ? fw.semibold : fw.regular,
                    color: c['content-primary'],
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = c['background-subtle']; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ width: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c['content-primary'] }}>
                    {isActive && (
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    )}
                  </span>
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right pane: signature · description · examples ─────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: sp.E, background: c['background-base'] }}>
          {active && (
            <>
              <div style={{ fontSize: fs.md, fontWeight: fw.semibold, color: c['content-primary'], fontFamily: ff.primary, marginBottom: sp.C }}>
                {active.signature}
              </div>
              <div style={{ fontSize: fs.sm, color: c['content-primary'], fontFamily: ff.primary, lineHeight: 1.5, marginBottom: sp.D }}>
                {active.description}
              </div>
              <div style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], fontFamily: ff.primary, marginBottom: sp.B }}>
                Examples:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                {active.examples.map(ex => (
                  <div key={ex} style={{
                    background: c['background-sunken'], borderRadius: 6,
                    padding: `${sp.C}px ${sp.D}px`, fontSize: fs.sm,
                    color: c['content-primary'], fontFamily: ff.primary,
                  }}>
                    {ex}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
