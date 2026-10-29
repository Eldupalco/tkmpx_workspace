// Business dates and shift times are evaluated in one timezone (APP_TIMEZONE, else the server's),
// so "today", the weekday and late detection always agree with each other.

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function appTimeZone(): string {
  return (
    process.env.APP_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone
  );
}

function zonedParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: appTimeZone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    weekday: get('weekday'),
    time: `${get('hour')}:${get('minute')}`,
  };
}

/** Today's business date as YYYY-MM-DD */
export function todayDate(now = new Date()): string {
  return zonedParts(now).date;
}

/** ISO day of week: 1 = Monday ... 7 = Sunday */
export function isoDayOfWeek(now = new Date()): number {
  return WEEKDAYS.indexOf(zonedParts(now).weekday) + 1;
}

/** Current wall-clock time as HH:mm */
export function currentTime(now = new Date()): string {
  return zonedParts(now).time;
}

/** ISO day of week (1 = Monday ... 7 = Sunday) of a YYYY-MM-DD business date */
export function isoDayOfDate(date: string): number {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Minutes since midnight for an HH:mm string */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Builds a Prisma filter for a YYYY-MM-DD string column from optional bounds */
export function dateRangeFilter(startDate?: string, endDate?: string) {
  const range: { gte?: string; lte?: string } = {};
  if (startDate?.trim()) range.gte = startDate.trim();
  if (endDate?.trim()) range.lte = endDate.trim();
  return Object.keys(range).length > 0 ? range : undefined;
}
