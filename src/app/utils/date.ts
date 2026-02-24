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

/** YYYY-MM-DD in local time from an ISO timestamp (e.g. log.submittedAt). */
export function getDateStringFromISO(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "Feb 24, 2026" from an ISO timestamp (date only, no Today/Yesterday). */
export function formatDateOnly(isoString: string): string {
  return parseLocalDate(getDateStringFromISO(isoString)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** "Today", "Yesterday", or "Feb 23, 2026" for a YYYY-MM-DD string. */
export function formatDateWithTodayYesterday(dateString: string): string {
  const date = parseLocalDate(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LOCALE_OPTS = { month: 'short' as const, day: 'numeric' as const, year: 'numeric' as const, hour: 'numeric' as const, minute: '2-digit' as const, hour12: true };

/** "Feb 23, 2026, 3:45 PM" for a Date (e.g. timestamp display). */
export function formatDateTimeDisplay(d: Date): string {
  return d.toLocaleString('en-US', LOCALE_OPTS);
}

/** "3:45 PM" from an ISO string. */
export function formatTimeOnly(isoString: string | null | undefined): string | null {
  if (!isoString) return null;
  return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/** "Feb 23, 2026 at 3:45 PM" from an ISO string. */
export function formatDateTimeLogged(isoString: string | null | undefined): string | null {
  if (!isoString) return null;
  const d = new Date(isoString);
  const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} at ${timePart}`;
}

/** "hour" or "hours" for display. */
export function formatHourLabel(hours: number): string {
  return hours === 1 ? 'hour' : 'hours';
}

/** YYYY-MM-DDTHH:mm for datetime-local input. */
export function toDateTimeLocalString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

export type PeriodTimeRange = 'day' | 'week' | 'month';

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
    default:
      return {
        start: new Date(y, m, d, 0, 0, 0, 0),
        end: new Date(y, m, d, 23, 59, 59, 999),
      };
  }
}
