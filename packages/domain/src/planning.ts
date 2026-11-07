/**
 * Checklist timing. Tasks carry an offset in days relative to the wedding date; the stored
 * due date is derived from it. Dates are plain calendar dates (YYYY-MM-DD) in the wedding's
 * own time zone, so no time-zone arithmetic is needed here.
 */

export type TimeToGoBucket =
  | '12_plus_months'
  | '9_months'
  | '6_months'
  | '4_months'
  | '2_months'
  | '1_month'
  | 'final_week'
  | 'day_after';

export const BUCKET_ORDER: readonly TimeToGoBucket[] = [
  '12_plus_months',
  '9_months',
  '6_months',
  '4_months',
  '2_months',
  '1_month',
  'final_week',
  'day_after',
];

/** Map a task's offset from the wedding date (negative = before) to its planning bucket. */
export function bucketForOffset(offsetDays: number): TimeToGoBucket {
  if (offsetDays > 0) return 'day_after';
  const daysBefore = -offsetDays;
  if (daysBefore <= 7) return 'final_week';
  if (daysBefore <= 45) return '1_month';
  if (daysBefore <= 90) return '2_months';
  if (daysBefore <= 150) return '4_months';
  if (daysBefore <= 240) return '6_months';
  if (daysBefore <= 330) return '9_months';
  return '12_plus_months';
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Add days to an ISO calendar date without involving time zones. */
export function addDays(isoDate: string, days: number): string {
  const m = ISO_DATE.exec(isoDate);
  if (!m) throw new RangeError(`Expected YYYY-MM-DD, got ${isoDate}`);
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

export interface SchedulableTask {
  readonly status: 'open' | 'done';
  readonly dueMode: 'relative' | 'fixed' | 'none';
  readonly offsetDays: number | null;
  readonly dueDate: string | null;
}

/**
 * The due date a task should have for a given wedding date.
 *   - Completed tasks never move.
 *   - Fixed-date and undated tasks keep their date.
 *   - Relative tasks follow the wedding date; with no wedding date they have no due date.
 */
export function rescheduledDueDate(
  task: SchedulableTask,
  weddingDate: string | null,
): string | null {
  if (task.status === 'done' || task.dueMode !== 'relative') return task.dueDate;
  if (weddingDate === null || task.offsetDays === null) return null;
  return addDays(weddingDate, task.offsetDays);
}
