import React, { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import styles from './DatePicker.module.css';
import type { DateFormat } from './DatePicker';
import {
  WEEKDAYS,
  MONTHS,
  MONTHS_SHORT,
  formatDate,
  parseDate,
  getCalendarDays,
  isSameDay,
  isToday,
} from './dateUtils';
import type { CalendarView } from './dateUtils';
import { ChevronLeftIcon, ChevronRightIcon } from './CalendarIcons';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  /** Selected range */
  value?: DateRange;
  /** Change handler, called with the full range on every change */
  onChange: (range: DateRange) => void;
  /**
   * Date format
   * @default 'MM/DD/YYYY'
   */
  format?: DateFormat;
  /** Label shown above both fields */
  label?: string;
  /**
   * Placeholder for the start field
   * @default 'Start date'
   */
  startPlaceholder?: string;
  /**
   * Placeholder for the end field
   * @default 'End date'
   */
  endPlaceholder?: string;
  /**
   * Word between the two fields
   * @default 'to'
   */
  separator?: string;
  /** Error state for both fields */
  hasError?: boolean;
  /** Helper or error text */
  helperText?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Additional class name */
  className?: string;
  /** Base id; the fields get `<id>-start` and `<id>-end` */
  id?: string;
}

type RangeField = 'start' | 'end';

const EMPTY_RANGE: DateRange = { start: null, end: null };

const startOfDay = (d: Date): number => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const getYearRange = (centerYear: number): number[] => {
  const startYear = Math.floor(centerYear / 12) * 12;
  return Array.from({ length: 12 }, (_, i) => startYear + i);
};

/**
 * DateRangePicker
 *
 * Two date fields ("Start date" to "End date") that share one calendar. The calendar
 * opens under whichever field is active. Picking a start date moves on to the end
 * field; days between start and end are highlighted. Matches Figma "Date Picker / Range".
 *
 * Keyboard: type a date in either field, ArrowDown moves into the calendar, arrow keys
 * move by day or week, PageUp and PageDown change month, Enter picks, Escape closes.
 *
 * @example
 * ```tsx
 * const [range, setRange] = useState<DateRange>({ start: null, end: null });
 * <DateRangePicker label="Date range" value={range} onChange={setRange} />
 * ```
 */
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  (
    {
      value = EMPTY_RANGE,
      onChange,
      format = 'MM/DD/YYYY',
      label,
      startPlaceholder = 'Start date',
      endPlaceholder = 'End date',
      separator = 'to',
      hasError = false,
      helperText,
      disabled = false,
      minDate,
      maxDate,
      className = '',
      id,
    },
    ref,
  ) => {
    const autoId = useId();
    const baseId = id ?? `rd-daterange-${autoId}`;
    const labelId = `${baseId}-label`;
    const helperId = `${baseId}-helper`;

    const { start, end } = value;

    const [isOpen, setIsOpen] = useState(false);
    const [active, setActive] = useState<RangeField>('start');
    const [startText, setStartText] = useState(() => formatDate(start, format));
    const [endText, setEndText] = useState(() => formatDate(end, format));
    const [viewDate, setViewDate] = useState<Date>(() => start ?? end ?? new Date());
    const [calendarView, setCalendarView] = useState<CalendarView>('days');
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [focusDate, setFocusDate] = useState<Date>(() => start ?? new Date());

    const containerRef = useRef<HTMLDivElement>(null);
    const startInputRef = useRef<HTMLInputElement>(null);
    const endInputRef = useRef<HTMLInputElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const moveFocusToGrid = useRef(false);
    // Set while we move focus between the fields ourselves, so onFocus does not reopen or reset the calendar
    const programmaticFocus = useRef(false);

    const focusField = (field: RangeField) => {
      programmaticFocus.current = true;
      (field === 'start' ? startInputRef : endInputRef).current?.focus();
      programmaticFocus.current = false;
    };

    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref],
    );

    // Keep the field text in step with the value prop
    useEffect(() => {
      setStartText(formatDate(start, format));
    }, [start, format]);
    useEffect(() => {
      setEndText(formatDate(end, format));
    }, [end, format]);

    const close = useCallback(() => {
      setIsOpen(false);
      setCalendarView('days');
      setHoverDate(null);
    }, []);

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return undefined;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) close();
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, close]);

    // Move DOM focus to the roving day after keyboard navigation
    useEffect(() => {
      if (!moveFocusToGrid.current || !gridRef.current) return;
      moveFocusToGrid.current = false;
      const btn = gridRef.current.querySelector<HTMLButtonElement>(`[data-date="${dateKey(focusDate)}"]`);
      btn?.focus();
    }, [focusDate, viewDate, isOpen, calendarView]);

    const isDateDisabled = (date: Date): boolean => {
      if (minDate && startOfDay(date) < startOfDay(minDate)) return true;
      if (maxDate && startOfDay(date) > startOfDay(maxDate)) return true;
      return false;
    };

    const openFor = (field: RangeField) => {
      if (disabled) return;
      setActive(field);
      const anchor = field === 'end' ? end ?? start : start ?? end;
      const target = anchor ?? new Date();
      if (!isOpen || field !== active) {
        setViewDate(new Date(target.getFullYear(), target.getMonth(), 1));
        setFocusDate(target);
        setCalendarView('days');
      }
      setIsOpen(true);
    };

    const commit = (next: DateRange) => onChange(next);

    const pickDate = (date: Date) => {
      if (isDateDisabled(date)) return;
      if (active === 'start') {
        const nextEnd = end && startOfDay(end) < startOfDay(date) ? null : end;
        commit({ start: date, end: nextEnd });
        setActive('end');
        setFocusDate(date);
        focusField('end');
        return;
      }
      // Picking the end date
      if (start && startOfDay(date) < startOfDay(start)) {
        // Earlier than the start: treat it as a new start and keep asking for the end
        commit({ start: date, end: null });
        setFocusDate(date);
        return;
      }
      commit({ start, end: date });
      if (start) {
        close();
        focusField('end');
      } else {
        setActive('start');
        focusField('start');
      }
    };

    const handleTextChange = (field: RangeField) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      if (field === 'start') setStartText(text);
      else setEndText(text);
      const parsed = parseDate(text, format);
      if (parsed) {
        commit(field === 'start' ? { start: parsed, end } : { start, end: parsed });
        setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
        setFocusDate(parsed);
      }
    };

    const handleTextBlur = (field: RangeField) => () => {
      const text = field === 'start' ? startText : endText;
      const current = field === 'start' ? start : end;
      if (!text) return;
      const parsed = parseDate(text, format);
      const formatted = formatDate(parsed ?? current, format);
      if (field === 'start') setStartText(formatted);
      else setEndText(formatted);
    };

    const handleInputKeyDown = (field: RangeField) => (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!isOpen || active !== field) openFor(field);
        moveFocusToGrid.current = true;
        setCalendarView('days');
        setFocusDate((d) => new Date(d));
      }
    };

    const moveFocus = (next: Date) => {
      moveFocusToGrid.current = true;
      setFocusDate(next);
      if (next.getMonth() !== viewDate.getMonth() || next.getFullYear() !== viewDate.getFullYear()) {
        setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
      }
    };

    const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const d = focusDate;
      const shift = (days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
      switch (e.key) {
        case 'ArrowLeft': e.preventDefault(); moveFocus(shift(-1)); break;
        case 'ArrowRight': e.preventDefault(); moveFocus(shift(1)); break;
        case 'ArrowUp': e.preventDefault(); moveFocus(shift(-7)); break;
        case 'ArrowDown': e.preventDefault(); moveFocus(shift(7)); break;
        case 'PageUp': e.preventDefault(); moveFocus(new Date(d.getFullYear(), d.getMonth() - 1, d.getDate())); break;
        case 'PageDown': e.preventDefault(); moveFocus(new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())); break;
        case 'Escape':
          e.preventDefault();
          close();
          focusField(active);
          break;
        default:
          break;
      }
    };

    const activeDate = active === 'start' ? start : end;

    const renderDays = () => {
      const days = getCalendarDays(viewDate.getFullYear(), viewDate.getMonth());
      // While picking the end, preview the range up to the hovered day
      const previewEnd = active === 'end' && start && !end && hoverDate && startOfDay(hoverDate) > startOfDay(start)
        ? hoverDate
        : null;
      const rangeEnd = end ?? previewEnd;
      const focusInView = days.some(({ date }) => isSameDay(focusDate, date));

      return (
        <>
          <div className={styles.calendarHeader}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              aria-label="Previous month"
            >
              <ChevronLeftIcon />
            </button>
            <span className={styles.rangeHeaderButtons}>
              <button
                type="button"
                className={styles.headerButton}
                onClick={() => setCalendarView('months')}
                aria-label="Select month"
              >
                {MONTHS[viewDate.getMonth()]}
              </button>
              <button
                type="button"
                className={styles.headerButton}
                onClick={() => setCalendarView('years')}
                aria-label="Select year"
              >
                {viewDate.getFullYear()}
              </button>
            </span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              aria-label="Next month"
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className={styles.weekdays} aria-hidden="true">
            {WEEKDAYS.map((day, i) => (
              <span key={i} className={styles.weekday}>{day}</span>
            ))}
          </div>

          <div
            className={styles.days}
            ref={gridRef}
            role="grid"
            aria-label={`${MONTHS[viewDate.getMonth()]} ${viewDate.getFullYear()}`}
            onKeyDown={handleGridKeyDown}
            onMouseLeave={() => setHoverDate(null)}
          >
            {days.map(({ date, isCurrentMonth }, i) => {
              const isStart = isSameDay(start, date);
              const isEnd = isSameDay(end, date);
              const t = startOfDay(date);
              const inRange = !!start && !!rangeEnd && t > startOfDay(start) && t < startOfDay(rangeEnd);
              const isPreviewEnd = !!previewEnd && isSameDay(previewEnd, date);
              const isDisabled = isDateDisabled(date);
              const isFocusTarget = focusInView ? isSameDay(focusDate, date) : i === 0;

              const dayClasses = [
                styles.day,
                !isCurrentMonth && styles.dayOtherMonth,
                isToday(date) && styles.dayToday,
                inRange && styles.dayInRange,
                isPreviewEnd && styles.dayInRange,
                (isStart || isEnd) && styles.daySelected,
                isDisabled && styles.dayDisabled,
              ].filter(Boolean).join(' ');

              return (
                <button
                  key={i}
                  type="button"
                  role="gridcell"
                  data-date={dateKey(date)}
                  className={dayClasses}
                  onClick={() => pickDate(date)}
                  onMouseEnter={() => setHoverDate(date)}
                  onFocus={() => setFocusDate(date)}
                  disabled={isDisabled}
                  tabIndex={isFocusTarget ? 0 : -1}
                  aria-selected={isStart || isEnd || inRange}
                  aria-label={`${date.toDateString()}${isStart ? ', start date' : ''}${isEnd ? ', end date' : ''}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </>
      );
    };

    const renderMonths = () => (
      <>
        <div className={styles.calendarHeader}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1))}
            aria-label="Previous year"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={styles.headerButton}
            onClick={() => setCalendarView('years')}
            aria-label="Select year"
          >
            {viewDate.getFullYear()}
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1))}
            aria-label="Next year"
          >
            <ChevronRightIcon />
          </button>
        </div>
        <div className={styles.monthsGrid}>
          {MONTHS_SHORT.map((month, i) => {
            const isSelected = !!activeDate && activeDate.getMonth() === i && activeDate.getFullYear() === viewDate.getFullYear();
            const now = new Date();
            const isCurrent = now.getMonth() === i && now.getFullYear() === viewDate.getFullYear();
            const monthClasses = [
              styles.monthCell,
              isSelected && styles.monthCellSelected,
              isCurrent && styles.monthCellCurrent,
            ].filter(Boolean).join(' ');
            return (
              <button
                key={i}
                type="button"
                className={monthClasses}
                onClick={() => {
                  setViewDate(new Date(viewDate.getFullYear(), i, 1));
                  setCalendarView('days');
                }}
                aria-pressed={isSelected}
              >
                {month}
              </button>
            );
          })}
        </div>
      </>
    );

    const renderYears = () => {
      const years = getYearRange(viewDate.getFullYear());
      return (
        <>
          <div className={styles.calendarHeader}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setViewDate(new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1))}
              aria-label="Previous year range"
            >
              <ChevronLeftIcon />
            </button>
            <span className={styles.monthYear}>
              {years[0]} - {years[11]}
            </span>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => setViewDate(new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1))}
              aria-label="Next year range"
            >
              <ChevronRightIcon />
            </button>
          </div>
          <div className={styles.yearsGrid}>
            {years.map((year) => {
              const isSelected = !!activeDate && activeDate.getFullYear() === year;
              const isCurrent = new Date().getFullYear() === year;
              const yearClasses = [
                styles.yearCell,
                isSelected && styles.yearCellSelected,
                isCurrent && styles.yearCellCurrent,
              ].filter(Boolean).join(' ');
              return (
                <button
                  key={year}
                  type="button"
                  className={yearClasses}
                  onClick={() => {
                    setViewDate(new Date(year, viewDate.getMonth(), 1));
                    setCalendarView('months');
                  }}
                  aria-pressed={isSelected}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </>
      );
    };

    const renderCalendar = (field: RangeField) =>
      isOpen && !disabled && active === field ? (
        <div
          className={`${styles.calendar} ${styles.rangeCalendar}`}
          role="dialog"
          aria-label={field === 'start' ? 'Choose start date' : 'Choose end date'}
        >
          {calendarView === 'days' && renderDays()}
          {calendarView === 'months' && renderMonths()}
          {calendarView === 'years' && renderYears()}
        </div>
      ) : null;

    const inputClasses = (field: RangeField) =>
      [
        styles.input,
        styles.rangeInput,
        isOpen && active === field && styles.rangeInputActive,
        hasError && styles.inputError,
        disabled && styles.inputDisabled,
      ].filter(Boolean).join(' ');

    const describedBy = helperText ? helperId : undefined;

    return (
      <div className={`${styles.container} ${className}`} ref={setRefs}>
        {label && (
          <span id={labelId} className={styles.label}>
            {label}
          </span>
        )}

        <div
          className={styles.rangeRow}
          role="group"
          aria-labelledby={label ? labelId : undefined}
          aria-label={label ? undefined : 'Date range'}
        >
          <div className={styles.inputWrapper}>
            <input
              ref={startInputRef}
              type="text"
              id={`${baseId}-start`}
              className={inputClasses('start')}
              value={startText}
              onChange={handleTextChange('start')}
              onBlur={handleTextBlur('start')}
              onFocus={() => { if (!programmaticFocus.current) openFor('start'); }}
              onClick={() => openFor('start')}
              onKeyDown={handleInputKeyDown('start')}
              placeholder={startPlaceholder}
              disabled={disabled}
              aria-label={startPlaceholder}
              aria-invalid={hasError}
              aria-describedby={describedBy}
              aria-haspopup="dialog"
              aria-expanded={isOpen && active === 'start'}
            />
            {renderCalendar('start')}
          </div>

          <span className={styles.rangeSeparator} aria-hidden="true">
            {separator}
          </span>

          <div className={styles.inputWrapper}>
            <input
              ref={endInputRef}
              type="text"
              id={`${baseId}-end`}
              className={inputClasses('end')}
              value={endText}
              onChange={handleTextChange('end')}
              onBlur={handleTextBlur('end')}
              onFocus={() => { if (!programmaticFocus.current) openFor('end'); }}
              onClick={() => openFor('end')}
              onKeyDown={handleInputKeyDown('end')}
              placeholder={endPlaceholder}
              disabled={disabled}
              aria-label={endPlaceholder}
              aria-invalid={hasError}
              aria-describedby={describedBy}
              aria-haspopup="dialog"
              aria-expanded={isOpen && active === 'end'}
            />
            {renderCalendar('end')}
          </div>
        </div>

        {helperText && (
          <div className={styles.underlineWrapper} id={helperId}>
            {hasError && (
              <svg className={styles.underlineIcon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5V8.5M8 11V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
            <span className={`${styles.underlineText} ${hasError ? styles.underlineTextError : ''}`}>
              {helperText}
            </span>
          </div>
        )}
      </div>
    );
  },
);

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker;
