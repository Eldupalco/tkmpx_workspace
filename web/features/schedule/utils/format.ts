import { ShiftSchedule } from '../types';

type ShiftTimes = Pick<ShiftSchedule, 'startTime' | 'endTime' | 'breakStart' | 'breakEnd' | 'graceMinutes'>;

/** e.g. "08:00 – 17:00 · break 12:00–13:00 · 5 min grace" or "08:00 – 12:00 · no break" */
export function describeShift(s: ShiftTimes): string {
  const breakText = s.breakStart && s.breakEnd ? `break ${s.breakStart}–${s.breakEnd}` : 'no break';
  const graceText = s.graceMinutes > 0 ? ` · ${s.graceMinutes} min grace` : '';
  return `${s.startTime} – ${s.endTime} · ${breakText}${graceText}`;
}
