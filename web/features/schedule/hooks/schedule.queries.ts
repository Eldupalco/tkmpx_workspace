'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import { fetchMySchedule, fetchTodaySchedule } from '../api/schedule.api';

/** Query keys are scoped by user id so cached data never crosses accounts */
export const scheduleKeys = {
  all: (userId: string) => ['schedules', userId] as const,
  mine: (userId: string) => [...scheduleKeys.all(userId), 'mine'] as const,
  today: (userId: string) => [...scheduleKeys.all(userId), 'today'] as const,
};

export function useMySchedule() {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: scheduleKeys.mine(user?.id ?? ''),
    queryFn: () => fetchMySchedule(token!),
    enabled: !!token && !!user,
  });
}

export function useTodaySchedule() {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: scheduleKeys.today(user?.id ?? ''),
    queryFn: () => fetchTodaySchedule(token!),
    enabled: !!token && !!user,
  });
}
