export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

let unauthorizedHandler: (() => void) | null = null;

/** Registered by AuthProvider: called when an authenticated request is rejected (expired/invalid token) */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

/** fetch wrapper: a 401 on a request that carried a Bearer token ends the session */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  const sentToken = new Headers(init?.headers).get('Authorization')?.startsWith('Bearer ');
  if (res.status === 401 && sentToken) {
    unauthorizedHandler?.();
  }
  return res;
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string | null;
  body?: unknown;
  /** Shown when the API gives no message of its own */
  errorMessage: string;
}

/** Calls the API and returns the full `{ data, meta? }` envelope; throws with the API's message on failure */
async function request<T>(path: string, { method = 'GET', token, body, errorMessage }: ApiRequestOptions) {
  const res = await apiFetch(`${API_BASE_URL}${path}`, {
    method,
    headers: getAuthHeaders(token ?? undefined),
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json?.message || errorMessage;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return json as { data: T; meta?: PaginationMeta } | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Returns the response's `data` */
export async function apiRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const json = await request<T>(path, options);
  return json?.data as T;
}

/** Returns `data` plus pagination `meta` for list endpoints */
export async function apiRequestPage<T>(
  path: string,
  options: ApiRequestOptions,
): Promise<{ data: T[]; meta: PaginationMeta }> {
  const json = await request<T[]>(path, options);
  const data = json?.data ?? [];
  return { data, meta: json?.meta ?? { total: data.length, page: 1, limit: data.length, totalPages: 1 } };
}
