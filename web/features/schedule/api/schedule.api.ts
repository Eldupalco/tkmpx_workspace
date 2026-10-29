import { apiRequest } from '@/lib/api-client';
import { ShiftSchedule, TodaySchedule, BulkSchedulePayload, UpdateSchedulePayload } from '../types';

export async function fetchMySchedule(token: string): Promise<ShiftSchedule[]> {
  const data = await apiRequest<ShiftSchedule[]>('/schedules/my-schedule', {
    token,
    errorMessage: 'Failed to fetch schedule roster',
  });
  return data ?? [];
}

export function fetchTodaySchedule(token: string): Promise<TodaySchedule> {
  return apiRequest('/schedules/today', { token, errorMessage: 'Failed to fetch today shift' });
}

export function postBulkSchedule(token: string, data: BulkSchedulePayload) {
  return apiRequest('/schedules/bulk', {
    method: 'POST',
    token,
    body: data,
    errorMessage: 'Bulk schedule assignment failed',
  });
}

/** Admin: all shifts of one employee, Monday first */
export async function fetchUserSchedules(token: string, userId: string): Promise<ShiftSchedule[]> {
  const query = new URLSearchParams({ userId, limit: '50', sortBy: 'dayOfWeek', sortOrder: 'asc' });
  const data = await apiRequest<ShiftSchedule[]>(`/schedules?${query.toString()}`, {
    token,
    errorMessage: 'Failed to fetch employee shifts',
  });
  return data ?? [];
}

export function updateSchedule(
  token: string,
  id: string,
  data: UpdateSchedulePayload
): Promise<ShiftSchedule> {
  return apiRequest(`/schedules/${id}`, {
    method: 'PATCH',
    token,
    body: data,
    errorMessage: 'Failed to update shift',
  });
}

export async function deleteSchedule(token: string, id: string): Promise<void> {
  await apiRequest(`/schedules/${id}`, { method: 'DELETE', token, errorMessage: 'Failed to delete shift' });
}
