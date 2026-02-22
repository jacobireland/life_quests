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
