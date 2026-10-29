import { API_BASE_URL, getAuthHeaders } from '@/lib/api-client';
import {
  Attendance,
  PaginatedResponse,
  FetchAttendanceParams,
  TimesheetData,
} from '../types';

export async function fetchAttendances({
  page = 1,
  limit = 5,
  search = '',
  userId = '',
  employeeSearch = '',
  status = '',
  startDate = '',
  endDate = '',
  token,
}: FetchAttendanceParams = {}): Promise<PaginatedResponse<Attendance>> {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  if (search && search.trim()) queryParams.set('search', search.trim());
  if (userId && userId.trim()) queryParams.set('userId', userId.trim());
  if (employeeSearch && employeeSearch.trim()) queryParams.set('employeeSearch', employeeSearch.trim());
  if (status && status.trim() && status !== 'all') queryParams.set('status', status.trim());
  if (startDate && startDate.trim()) queryParams.set('startDate', startDate.trim());
  if (endDate && endDate.trim()) queryParams.set('endDate', endDate.trim());

  const res = await fetch(`${API_BASE_URL}/attendances?${queryParams.toString()}`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch attendances: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  if (json && json.data) {
    const data = Array.isArray(json.data) ? json.data : [];
    const meta = json.meta || {
      total: data.length,
      page,
      limit,
      totalPages: Math.ceil(data.length / limit) || 1,
    };
    return { data, meta };
  }

  return { data: [], meta: { total: 0, page: 1, limit, totalPages: 1 } };
}

export async function fetchTodayStatus(token: string, userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE_URL}/attendances/today-status${query}`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch today status');
  const json = await res.json();
  return json.data;
}

export async function fetchAttendanceSummary(token: string, userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE_URL}/attendances/summary${query}`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch attendance summary');
  const json = await res.json();
  return json.data;
}

export async function fetchTimesheet(
  token: string,
  params?: { startDate?: string; endDate?: string; userId?: string }
): Promise<TimesheetData> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  if (params?.userId) query.set('userId', params.userId);

  const res = await fetch(`${API_BASE_URL}/attendances/timesheet?${query.toString()}`, {
    headers: getAuthHeaders(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch timesheet');
  const json = await res.json();
  return json.data;
}

export async function postCheckIn(token: string, notes?: string): Promise<Attendance> {
  const res = await fetch(`${API_BASE_URL}/attendances/check-in`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Check-in failed');
  }
  const json = await res.json();
  return json.data;
}

export async function postCheckOut(
  token: string,
  attendanceId: string,
  notes?: string
): Promise<Attendance> {
  const res = await fetch(`${API_BASE_URL}/attendances/${attendanceId}/check-out`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ notes }),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Check-out failed');
  }
  const json = await res.json();
  return json.data;
}

export async function postLeaveRequest(
  token: string,
  data: { date: string; status?: string; notes?: string; userId?: string }
) {
  const res = await fetch(`${API_BASE_URL}/attendances/leave`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.message || 'Leave registration failed');
  }
  const json = await res.json();
  return json.data;
}

export function downloadAttendanceCsv(
  token: string,
  paramsOrUserId?: string | { userId?: string; startDate?: string; endDate?: string }
) {
  const query = new URLSearchParams();
  if (typeof paramsOrUserId === 'string') {
    if (paramsOrUserId) query.set('userId', paramsOrUserId);
  } else if (paramsOrUserId) {
    if (paramsOrUserId.userId) query.set('userId', paramsOrUserId.userId);
    if (paramsOrUserId.startDate) query.set('startDate', paramsOrUserId.startDate);
    if (paramsOrUserId.endDate) query.set('endDate', paramsOrUserId.endDate);
  }
  const qs = query.toString() ? `?${query.toString()}` : '';
  const url = `${API_BASE_URL}/attendances/export${qs}`;

  fetch(url, { headers: getAuthHeaders(token) })
    .then((res) => res.blob())
    .then((blob) => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `attendance-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    })
    .catch((err) => console.error('CSV download error', err));
}

