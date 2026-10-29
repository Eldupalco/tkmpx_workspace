import { API_BASE_URL, apiFetch, getAuthHeaders } from '@/lib/api-client';
import { User } from '@/features/auth/types';
import { Attendance } from '@/features/attendance/types';
import {
  CreateUserPayload,
  UpdateUserPayload,
  DashboardMetrics,
} from '../types';

export async function fetchUsers(token?: string): Promise<User[]> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/users?limit=50`, {
      headers: getAuthHeaders(token),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || [];
  } catch (error) {
    console.warn('API: fetchUsers failed', error);
    return [];
  }
}

export async function createUser(
  token: string,
  data: CreateUserPayload
): Promise<User> {
  const res = await apiFetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Failed to create user');
  }
  const json = await res.json();
  return json.data || json;
}

export async function updateUser(
  token: string,
  id: string,
  data: UpdateUserPayload
): Promise<User> {
  const res = await apiFetch(`${API_BASE_URL}/users/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Failed to update user');
  }
  const json = await res.json();
  return json.data || json;
}

export async function deleteUser(token: string, id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Failed to delete user');
  }
}

export async function fetchCurrentlyIn(token: string): Promise<Attendance[]> {
  const res = await apiFetch(`${API_BASE_URL}/attendances/currently-in`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch currently-in records');
  const json = await res.json();
  return json.data || [];
}

export async function fetchDashboardMetrics(token: string): Promise<DashboardMetrics> {
  const res = await apiFetch(`${API_BASE_URL}/attendances/dashboard`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  const json = await res.json();
  return json.data;
}
