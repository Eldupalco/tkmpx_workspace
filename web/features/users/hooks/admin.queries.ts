'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { fetchAttendances, postPunch } from '@/features/attendance/api/attendance.api';
import { AttendanceRosterFilters } from '@/features/attendance/types';
import { fetchCurrentlyIn, fetchDashboardMetrics, fetchUsers, fetchUsersPage } from '../api/users.api';
import { UserListFilters } from '../types';

/** Admin-wide data; invalidate `adminKeys.all` after any admin change */
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  usersPage: (filters: UserListFilters) => [...adminKeys.all, 'users-page', filters] as const,
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

/** One page of the team list; keeps the previous page on screen while the next one loads */
export function useUsersPage(filters: UserListFilters) {
  const { token } = useAuth();
  return useQuery({
    queryKey: adminKeys.usersPage(filters),
    queryFn: () => fetchUsersPage(token!, filters),
    enabled: !!token,
    placeholderData: keepPreviousData,
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

/** Manager override: records an employee's next punch for today, then refreshes all admin data */
export function useAdminPunch() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => postPunch(token!, 'Manager override punch', userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
