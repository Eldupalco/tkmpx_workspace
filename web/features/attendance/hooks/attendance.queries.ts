'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import {
  fetchAttendances,
  fetchAttendanceSummary,
  fetchTimesheet,
  fetchTodayStatus,
  postPunch,
} from '../api/attendance.api';

export interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  onLeave: number;
}

export interface AttendanceHistoryFilters {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

/** Query keys are scoped by user id so cached data never crosses accounts */
export const attendanceKeys = {
  all: (userId: string) => ['attendances', userId] as const,
  todayStatus: (userId: string) => [...attendanceKeys.all(userId), 'today-status'] as const,
  summary: (userId: string) => [...attendanceKeys.all(userId), 'summary'] as const,
  timesheet: (userId: string) => [...attendanceKeys.all(userId), 'timesheet'] as const,
  history: (userId: string, filters: AttendanceHistoryFilters) =>
    [...attendanceKeys.all(userId), 'history', filters] as const,
};

export function useTodayStatus() {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: attendanceKeys.todayStatus(user?.id ?? ''),
    queryFn: () => fetchTodayStatus(token!),
    enabled: !!token && !!user,
  });
}

export function useAttendanceSummary() {
  const { user, token } = useAuth();
  return useQuery<AttendanceSummary>({
    queryKey: attendanceKeys.summary(user?.id ?? ''),
    queryFn: () => fetchAttendanceSummary(token!),
    enabled: !!token && !!user,
  });
}

/** Current user's own records; keeps the previous page on screen while the next one loads */
export function useAttendanceHistory(filters: AttendanceHistoryFilters) {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: attendanceKeys.history(user?.id ?? '', filters),
    queryFn: () => fetchAttendances({ ...filters, userId: user!.id, token: token! }),
    enabled: !!token && !!user,
    placeholderData: keepPreviousData,
  });
}

/** Loads only while `enabled` (e.g. the timesheet modal is open) */
export function useTimesheet(enabled: boolean) {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: attendanceKeys.timesheet(user?.id ?? ''),
    queryFn: () => fetchTimesheet(token!),
    enabled: enabled && !!token && !!user,
  });
}

/** Records the next punch and refreshes every attendance query of the current user */
export function usePunch() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string) => postPunch(token!, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: attendanceKeys.all(user?.id ?? '') }),
  });
}
