import { apiDownload, apiRequest, apiRequestPage } from '@/lib/api-client';
import {
  Attendance,
  AttendanceRangeParams,
  AttendanceSummary,
  LeaveRequestData,
  PaginatedResponse,
  FetchAttendanceParams,
  TimesheetData,
  TodayPunchStatus,
} from '../types';

export function fetchAttendances({
  page = 1,
  limit = 5,
  search = '',
  userId = '',
  employeeSearch = '',
  status = 'all',
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

  return apiRequestPage(`/attendances?${queryParams.toString()}`, {
    token,
    errorMessage: 'Failed to fetch attendances',
  });
}

export function fetchTodayStatus(token: string, userId?: string): Promise<TodayPunchStatus> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiRequest(`/attendances/today-status${query}`, { token, errorMessage: 'Failed to fetch today status' });
}

export function fetchAttendanceSummary(token: string, userId?: string): Promise<AttendanceSummary> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiRequest(`/attendances/summary${query}`, {
    token,
    errorMessage: 'Failed to fetch attendance summary',
  });
}

export function fetchTimesheet(
  token: string,
  params?: AttendanceRangeParams
): Promise<TimesheetData> {

  const query = new URLSearchParams();
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  if (params?.userId) query.set('userId', params.userId);

  return apiRequest(`/attendances/timesheet?${query.toString()}`, {
    token,
    errorMessage: 'Failed to fetch timesheet',
  });
}

/** Records the next punch of the day: Morning In, Morning Out, Afternoon In, Afternoon Out */
export function postPunch(token: string, notes?: string, userId?: string): Promise<Attendance> {
  return apiRequest('/attendances/punch', {
    method: 'POST',
    token,
    // userId is honoured only for admins (punch on behalf of an employee)
    body: { ...(notes ? { notes } : {}), ...(userId ? { userId } : {}) },
    errorMessage: 'Punch failed',
  });
}

export function postLeaveRequest(token: string, data: LeaveRequestData): Promise<Attendance> {
  return apiRequest('/attendances/leave', {
    method: 'POST',
    token,
    body: data,
    errorMessage: 'Leave registration failed',
  });
}

export function downloadAttendanceCsv(
  token: string,
  paramsOrUserId?: string | AttendanceRangeParams
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

  apiDownload(`/attendances/export${qs}`, { token, errorMessage: 'CSV export failed' })
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
