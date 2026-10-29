import { API_BASE_URL, getAuthHeaders } from '@/lib/api-client';
import { ShiftSchedule, TodaySchedule, BulkSchedulePayload } from '../types';

export async function fetchMySchedule(token: string): Promise<ShiftSchedule[]> {
  const res = await fetch(`${API_BASE_URL}/schedules/my-schedule`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch schedule roster');
  const json = await res.json();
  return json.data || [];
}

export async function fetchTodaySchedule(token: string): Promise<TodaySchedule> {
  const res = await fetch(`${API_BASE_URL}/schedules/today`, {
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
  const res = await fetch(`${API_BASE_URL}/schedules/bulk`, {
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

