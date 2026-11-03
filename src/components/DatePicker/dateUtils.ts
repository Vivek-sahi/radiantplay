/**
 * Date helpers shared by DatePicker and DateRangePicker.
 */
import type { DateFormat } from './DatePicker';

export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type CalendarView = 'days' | 'months' | 'years';

/**
 * Format date to string based on format
 */
export function formatDate(date: Date | null, format: DateFormat): string {
  if (!date) return '';
  
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear().toString();
  
  switch (format) {
    case 'DD/MM/YYYY': return `${d}/${m}/${y}`;
    case 'YYYY-MM-DD': return `${y}-${m}-${d}`;
    case 'MM/DD/YYYY':
    default: return `${m}/${d}/${y}`;
  }
}

/**
 * Parse string to date based on format
 */
export function parseDate(value: string, format: DateFormat): Date | null {
  if (!value) return null;
  
  let parts: string[];
  let d: number, m: number, y: number;
  
  switch (format) {
    case 'DD/MM/YYYY':
      parts = value.split('/');
      if (parts.length !== 3) return null;
      d = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      y = parseInt(parts[2], 10);
      break;
    case 'YYYY-MM-DD':
      parts = value.split('-');
      if (parts.length !== 3) return null;
      y = parseInt(parts[0], 10);
      m = parseInt(parts[1], 10) - 1;
      d = parseInt(parts[2], 10);
      break;
    case 'MM/DD/YYYY':
    default:
      parts = value.split('/');
      if (parts.length !== 3) return null;
      m = parseInt(parts[0], 10) - 1;
      d = parseInt(parts[1], 10);
      y = parseInt(parts[2], 10);
  }
  
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Get days in month grid (including prev/next month days)
 */
export function getCalendarDays(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  
  // Previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  
  // Next month days (fill to 42 = 6 weeks)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }
  
  return days;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(a: Date | null, b: Date): boolean {
  if (!a) return false;
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(new Date(), date);
}
