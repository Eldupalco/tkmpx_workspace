/**
 * Every call to the NestJS API goes through this file.
 *
 *   apiRequest      → returns `data`             (most endpoints)
 *   apiRequestPage  → returns `{ data, meta }`   (paginated lists)
 *   apiDownload     → returns a Blob             (file downloads, e.g. CSV)
 *
 * All three add the auth header, throw an ApiError (message + HTTP status) on failure,
 * and log the user out when the API rejects their token (401).
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** JWT of the logged-in user; omit for public endpoints like login */
  token?: string | null;
  /** Sent as JSON */
  body?: unknown;
  /** Shown when the API gives no error message of its own */
  errorMessage: string;
}

/**
 * Thrown for any failed API call. `status` lets callers react to specific cases,
 * e.g. `if (err instanceof ApiError && err.status === 409)` for a duplicate email.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------- Session expiry ----------

let onUnauthorized: (() => void) | null = null;

/** AuthProvider registers its logout here; it runs when a logged-in request gets a 401 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// ---------- Core ----------

/** Sends the request and returns the response; throws if the API answered with an error */
async function send(path: string, { method = 'GET', token, body, errorMessage }: RequestOptions) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  if (res.status === 401 && token) onUnauthorized?.();

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    // NestJS validation errors arrive as an array of messages
    const message = json?.message || errorMessage;
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, res.status);
  }

  return res;
}

// ---------- Public helpers ----------

/** Returns the `data` field of the API response */
export async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const res = await send(path, options);
  const json = await res.json().catch(() => null);
  return json?.data as T;
}

/** Returns `data` and pagination `meta` for list endpoints */
export async function apiRequestPage<T>(
  path: string,
  options: RequestOptions,
): Promise<{ data: T[]; meta: PaginationMeta }> {
  const res = await send(path, options);
  const json = await res.json().catch(() => null);
  const data: T[] = json?.data ?? [];
  const meta: PaginationMeta = json?.meta ?? { total: data.length, page: 1, limit: data.length, totalPages: 1 };
  return { data, meta };
}

/** Returns the response body as a file Blob */
export async function apiDownload(path: string, options: RequestOptions): Promise<Blob> {
  const res = await send(path, options);
  return res.blob();
}
