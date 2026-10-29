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
