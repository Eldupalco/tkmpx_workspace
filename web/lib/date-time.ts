export const APP_TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || 'Asia/Manila';

type AppTimeOptions = {
  includeSeconds?: boolean;
};

/** Formats an instant as Philippine business time using a 12-hour clock. */
export function formatAppTime(
  value: string | Date,
  { includeSeconds = false }: AppTimeOptions = {},
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('en-PH', {
    timeZone: APP_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: includeSeconds ? '2-digit' : undefined,
    hour12: true,
  });
}

/** Formats the date shown beside the employee terminal clock. */
export function formatAppLongDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-PH', {
    timeZone: APP_TIME_ZONE,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Produces the YYYY-MM-DD business date used by attendance records. */
export function formatAppDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}
