'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { fetchAttendances } from '@/features/attendance/api/attendance.api';
import { fetchCurrentlyIn, fetchDashboardMetrics, fetchUsers } from '../api/users.api';

export interface AttendanceRosterFilters {
  page: number;
  limit: number;
  employeeSearch?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/** Admin-wide data; invalidate `adminKeys.all` after any admin change */
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  metrics: () => [...adminKeys.all, 'metrics'] as const,
  currentlyIn: () => [...adminKeys.all, 'currently-in'] as const,
  roster: (filters: AttendanceRosterFilters) => [...adminKeys.all, 'roster', filters] as const,
};

export function useUsers() {
  const { token } = useAuth();
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: () => fetchUsers(token!),
    enabled: !!token,
  });
}

export function useDashboardMetrics() {
  const { token } = useAuth();
  return useQuery({
    queryKey: adminKeys.metrics(),
    queryFn: () => fetchDashboardMetrics(token!),
    enabled: !!token,
  });
}

export function useCurrentlyIn() {
  const { token } = useAuth();
  return useQuery({
    queryKey: adminKeys.currentlyIn(),
    queryFn: () => fetchCurrentlyIn(token!),
    enabled: !!token,
  });
}

/** All employees' attendance records; keeps the previous page on screen while the next one loads */
export function useAttendanceRoster(filters: AttendanceRosterFilters) {
  const { token } = useAuth();
  return useQuery({
    queryKey: adminKeys.roster(filters),
    queryFn: () => fetchAttendances({ ...filters, token: token! }),
    enabled: !!token,
    placeholderData: keepPreviousData,
  });
}
