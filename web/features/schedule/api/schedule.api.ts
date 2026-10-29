import { API_BASE_URL, apiFetch, getAuthHeaders } from '@/lib/api-client';
import { ShiftSchedule, TodaySchedule, BulkSchedulePayload, UpdateSchedulePayload } from '../types';

export async function fetchMySchedule(token: string): Promise<ShiftSchedule[]> {
  const res = await apiFetch(`${API_BASE_URL}/schedules/my-schedule`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch schedule roster');
  const json = await res.json();
  return json.data || [];
}

export async function fetchTodaySchedule(token: string): Promise<TodaySchedule> {
  const res = await apiFetch(`${API_BASE_URL}/schedules/today`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch today shift');
  const json = await res.json();
  return json.data;
}

export async function postBulkSchedule(
  token: string,
  data: BulkSchedulePayload
) {
  const res = await apiFetch(`${API_BASE_URL}/schedules/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Bulk schedule assignment failed');
  }
  const json = await res.json();
  return json.data;
}


/** Admin: all shifts of one employee, Monday first */
export async function fetchUserSchedules(token: string, userId: string): Promise<ShiftSchedule[]> {
  const query = new URLSearchParams({ userId, limit: '50', sortBy: 'dayOfWeek', sortOrder: 'asc' });
  const res = await apiFetch(`${API_BASE_URL}/schedules?${query.toString()}`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch employee shifts');
  const json = await res.json();
  return json.data || [];
}

export async function updateSchedule(
  token: string,
  id: string,
  data: UpdateSchedulePayload
): Promise<ShiftSchedule> {
  const res = await apiFetch(`${API_BASE_URL}/schedules/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    const message = errorJson?.message || 'Failed to update shift';
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteSchedule(token: string, id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE_URL}/schedules/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Failed to delete shift');
  }
}
