import { ShiftSchedule } from '../types';

type ShiftTimes = Pick<ShiftSchedule, 'startTime' | 'endTime' | 'breakStart' | 'breakEnd' | 'graceMinutes'>;

/** Converts an API/database HH:mm value to a display-only 12-hour time. */
export function formatShiftTime(value: string): string {
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/** e.g. "8:00 AM – 5:00 PM · break 12:00 PM–1:00 PM · 5 min grace" */
export function describeShift(s: ShiftTimes): string {
  const breakText = s.breakStart && s.breakEnd
    ? `break ${formatShiftTime(s.breakStart)}–${formatShiftTime(s.breakEnd)}`
    : 'no break';
  const graceText = s.graceMinutes > 0 ? ` · ${s.graceMinutes} min grace` : '';
  return `${formatShiftTime(s.startTime)} – ${formatShiftTime(s.endTime)} · ${breakText}${graceText}`;
}
