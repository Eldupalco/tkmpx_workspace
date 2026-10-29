import { currentTime, toMinutes } from '../../common/utils/date.util.js';

// Daily Time Record rules: four punches per day, always recorded in this order
export const PUNCH_ORDER = ['amIn', 'amOut', 'pmIn', 'pmOut'] as const;
export type PunchSlot = (typeof PUNCH_ORDER)[number];

export const PUNCH_LABELS: Record<PunchSlot, string> = {
  amIn: 'Morning In',
  amOut: 'Morning Out',
  pmIn: 'Afternoon In',
  pmOut: 'Afternoon Out',
};

export const LEAVE_STATUSES = ['on_leave', 'leave'];
export const DEFAULT_BREAK = { breakStart: '12:00', breakEnd: '13:00' };

export interface Punches {
  amIn?: Date | string | null;
  amOut?: Date | string | null;
  pmIn?: Date | string | null;
  pmOut?: Date | string | null;
}

export interface ShiftTimes {
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

/**
 * Next punch in sequence, or null when the day is complete.
 * With no punches yet, the morning is skipped once the lunch break has started (half day).
 */
export function nextPunch(
  record: Punches | null,
  nowTime: string,
  breakStart = DEFAULT_BREAK.breakStart,
): PunchSlot | null {
  if (!record?.amIn && !record?.pmIn) {
    return nowTime >= breakStart ? 'pmIn' : 'amIn';
  }
  if (record.amIn && !record.amOut && !record.pmIn) return 'amOut';
  if (!record.pmIn) return 'pmIn';
  if (!record.pmOut) return 'pmOut';
  return null;
}

/** Minimum gap between two punches, so a double click cannot punch In and Out at once */
export const PUNCH_COOLDOWN_SECONDS = 60;

/** Seconds since the most recent punch, or null if nothing is punched yet */
export function secondsSinceLastPunch(record: Punches | null, now: Date): number | null {
  const times = PUNCH_ORDER.map((slot) => record?.[slot])
    .filter(Boolean)
    .map((value) => new Date(value as Date | string).getTime());
  return times.length ? (now.getTime() - Math.max(...times)) / 1000 : null;
}

/** True while a half-day session is open (punched in, not yet out) */
export function isWorking(record: Punches | null): boolean {
  if (!record) return false;
  return Boolean(
    (record.amIn && !record.amOut && !record.pmIn) || (record.pmIn && !record.pmOut),
  );
}

function hoursBetween(from?: Date | string | null, to?: Date | string | null): number {
  if (!from || !to) return 0;
  return Math.max(0, (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000);
}

/** Hours worked across both halves of the day, rounded to 2 decimals */
export function hoursWorked(record: Punches): number {
  const total =
    hoursBetween(record.amIn, record.amOut) + hoursBetween(record.pmIn, record.pmOut);
  return Number(total.toFixed(2));
}

/** Late = AM In after shift start + PM In after break end; undertime = AM Out before break + PM Out before shift end */
export function punchMetrics(record: Punches, shift: ShiftTimes | null) {
  if (!shift) return { lateMinutes: 0, undertimeMinutes: 0 };

  const at = (value?: Date | string | null) =>
    value ? toMinutes(currentTime(new Date(value))) : null;
  const after = (actual: number | null, expected: string) =>
    actual === null ? 0 : Math.max(0, actual - toMinutes(expected));
  const before = (actual: number | null, expected: string) =>
    actual === null ? 0 : Math.max(0, toMinutes(expected) - actual);

  return {
    lateMinutes: after(at(record.amIn), shift.startTime) + after(at(record.pmIn), shift.breakEnd),
    undertimeMinutes:
      before(at(record.amOut), shift.breakStart) + before(at(record.pmOut), shift.endTime),
  };
}

/** Status derived from punches; leave is never overwritten */
export function punchStatus(record: Punches, lateMinutes: number, current?: string): string {
  if (current && LEAVE_STATUSES.includes(current)) return current;
  if (lateMinutes > 0) return 'late';
  if (!record.amIn && record.pmIn) return 'half_day';
  return 'present';
}
