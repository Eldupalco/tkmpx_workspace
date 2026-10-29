import { API_BASE_URL, apiFetch, getAuthHeaders } from '@/lib/api-client';
import { User, LoginCredentials, AuthResponse } from '../types';

export async function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await apiFetch(`${API_BASE_URL}/auth/login`, {
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
  const res = await apiFetch(`${API_BASE_URL}/auth/profile`, {
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
  const res = await apiFetch(`${API_BASE_URL}/auth/profile`, {
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
  const res = await apiFetch(`${API_BASE_URL}/auth/change-password`, {
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

export async function registerUser(data: { name: string; email: string; password: string }): Promise<User> {
  const res = await apiFetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    const message = errorJson?.message || 'Failed to register account';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  const json = await res.json();
  return json.data || json;
}

export async function requestForgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
  const res = await apiFetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Failed to request reset link');
  }
  const json = await res.json();
  return json.data || json;
}

export async function resetPasswordWithToken(data: {
  resetToken?: string;
  token?: string;
  newPassword: string;
  email?: string;
}): Promise<{ message: string }> {
  const resetToken = data.resetToken || data.token;
  const res = await apiFetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resetToken,
      newPassword: data.newPassword,
    }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    const message = errorJson?.message || 'Failed to reset password';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  const json = await res.json();
  return json.data || json;
}

