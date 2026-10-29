import { API_BASE_URL, getAuthHeaders } from '@/lib/api-client';
import { User, LoginCredentials, AuthResponse } from '../types';

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    const message =
      errorJson?.message || (res.status === 401 ? 'Invalid email or password' : res.statusText);
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  const json = await res.json();
  return json.data || json;
}

export async function fetchUserProfile(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) throw new Error('Session expired or unauthorized');
  const json = await res.json();
  return json.data || json;
}

export async function updateProfile(
  token: string,
  data: { name?: string; email?: string }
): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Failed to update profile');
  }
  const json = await res.json();
  return json.data || json;
}

export async function changePassword(
  token: string,
  data: { currentPassword: string; newPassword: string }
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Failed to change password');
  }
  const json = await res.json();
  return json.data || json;
}

