/**
 * Shared date/time helpers (#35).
 *
 * Conventions used across the app:
 * - Trip and day dates are stored as `YYYY-MM-DD` strings (Postgres `date`).
 * - Item times are stored as ISO timestamps (`timestamptz`) and shown as `HH:mm`.
 * - Times are interpreted in the device's local timezone. Destination-specific
 *   timezones are deferred (see docs/architecture.md).
 */
// Import from subpaths: Metro does not tree-shake, so `from 'date-fns'` would
// bundle the whole library (~300 modules).
import { addDays } from 'date-fns/addDays';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { format } from 'date-fns/format';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import { parseISO } from 'date-fns/parseISO';

const DAY_FORMAT = 'yyyy-MM-dd';
const DISPLAY_DAY_FORMAT = 'dd.MM.yyyy';
const TIME_FORMAT = 'HH:mm';

/** `YYYY-MM-DD` → Date at local midnight. */
export function parseDayDate(day: string): Date {
  return parse(day, DAY_FORMAT, new Date());
}

/** Date → `YYYY-MM-DD` (local date). */
export function toDayString(date: Date): string {
  return format(date, DAY_FORMAT);
}

/** `YYYY-MM-DD` → `DD.MM.YYYY`. Returns the input unchanged if it can't be parsed. */
export function formatDayDate(day: string | null | undefined): string {
  if (!day) return '';
  const date = parseDayDate(day);
  return isValid(date) ? format(date, DISPLAY_DAY_FORMAT) : day;
}

/** `DD.MM.YYYY - DD.MM.YYYY` for a trip's date range. */
export function formatDayRange(start: string | null | undefined, end: string | null | undefined): string {
  return `${formatDayDate(start)} - ${formatDayDate(end)}`;
}

/** Date → `HH:mm` (local time). */
export function toTimeString(date: Date): string {
  return format(date, TIME_FORMAT);
}

/** ISO timestamp → `HH:mm` (local time). Empty string for null/invalid input. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = parseISO(iso);
  return isValid(date) ? toTimeString(date) : '';
}

/** `HH:mm - HH:mm`, or just `HH:mm` without an end time. Empty if there is no start. */
export function formatTimeRange(startIso: string | null | undefined, endIso: string | null | undefined): string {
  const start = formatTime(startIso);
  if (!start) return '';
  const end = formatTime(endIso);
  return end ? `${start} - ${end}` : start;
}

/** `HH:mm` → Date on `baseDate`'s day (defaults to today). */
export function parseTime(time: string, baseDate: Date = new Date()): Date {
  return parse(time, TIME_FORMAT, baseDate);
}

/** Day (`YYYY-MM-DD`) + time (`HH:mm`) in local time → ISO timestamp for the database. */
export function combineDayAndTime(day: string, time: string): string {
  return parseTime(time, parseDayDate(day)).toISOString();
}

/**
 * Move a plan's timestamp from one day to another, keeping the time of day
 * (and an end time that runs past midnight stays on the following day).
 */
export function shiftToDay(iso: string | null, fromDay: string, toDay: string): string | null {
  if (!iso) return null;
  const date = parseISO(iso);
  if (!isValid(date)) return iso;
  return addDays(date, differenceInCalendarDays(parseDayDate(toDay), parseDayDate(fromDay))).toISOString();
}
