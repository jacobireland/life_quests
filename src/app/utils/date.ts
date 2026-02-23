/**
 * Date handling: we treat all dates in the user's current timezone for display and "today" logic.
 * When persisting to a DB, store datetimes in UTC and convert to the user's timezone only when
 * displaying (so users can change timezones without rewriting stored data).
 */

/**
 * Parse a YYYY-MM-DD string as local midnight.
 * Using new Date(dateString) treats it as UTC midnight, which can shift to the previous day in western timezones.
 */
export function parseLocalDate(dateString: string): Date {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

/**
 * Today's date in the user's local timezone as YYYY-MM-DD.
 * Avoids toISOString() which uses UTC and can yield the wrong calendar day.
 */
export function getTodayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfWeek(d: Date): Date {
  const date = startOfWeek(d);
  date.setDate(date.getDate() + 6);
  date.setHours(23, 59, 59, 999);
  return date;
}

export type PeriodTimeRange = 'day' | 'week' | 'month' | 'year';

/** True if the given calendar day (dateString YYYY-MM-DD) overlaps the period [start, end]. */
export function isLogDateInPeriod(dateString: string, start: Date, end: Date): boolean {
  const logStart = parseLocalDate(dateString).getTime();
  return logStart <= end.getTime() && logStart + 86400000 - 1 >= start.getTime();
}

/** Bounds of the period containing the given date. */
export function getPeriodBoundsForDate(date: Date, timeRange: PeriodTimeRange): { start: Date; end: Date } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  switch (timeRange) {
    case 'day':
      return {
        start: new Date(y, m, d, 0, 0, 0, 0),
        end: new Date(y, m, d, 23, 59, 59, 999),
      };
    case 'week':
      return { start: startOfWeek(date), end: endOfWeek(date) };
    case 'month':
      return {
        start: new Date(y, m, 1, 0, 0, 0, 0),
        end: new Date(y, m + 1, 0, 23, 59, 59, 999),
      };
    case 'year':
      return {
        start: new Date(y, 0, 1, 0, 0, 0, 0),
        end: new Date(y, 11, 31, 23, 59, 59, 999),
      };
    default:
      return {
        start: new Date(y, m, d, 0, 0, 0, 0),
        end: new Date(y, m, d, 23, 59, 59, 999),
      };
  }
}
