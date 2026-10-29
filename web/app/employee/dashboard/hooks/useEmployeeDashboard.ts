'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import {
  attendanceKeys,
  downloadAttendanceCsv,
  useAttendanceHistory,
  useAttendanceSummary,
  usePunch,
  useTimesheet,
  useTodayStatus,
  AttendanceSummary,
  PaginationMeta,
} from '@/features/attendance';
import { scheduleKeys, useMySchedule, useTodaySchedule } from '@/features/schedule';

const EMPTY_SUMMARY: AttendanceSummary = {
  total: 0,
  present: 0,
  late: 0,
  halfDay: 0,
  absent: 0,
  onLeave: 0,
};

export function useEmployeeDashboard() {

  const { user, token } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Punch notes
  const [notes, setNotes] = useState<string>('');

  // Punch History Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(5);

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Modals state
  const timesheetDisclosure = useDisclosure();
  const leaveDisclosure = useDisclosure();

  // Each section loads, caches and fails independently
  const todayStatusQuery = useTodayStatus();
  const summaryQuery = useAttendanceSummary();
  const myShiftsQuery = useMySchedule();
  const todayShiftQuery = useTodaySchedule();
  const historyQuery = useAttendanceHistory({
    page,
    limit,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const timesheetQuery = useTimesheet(timesheetDisclosure.isOpen);
  const punchMutation = usePunch();

  const queries = [todayStatusQuery, summaryQuery, myShiftsQuery, todayShiftQuery, historyQuery];
  const failed = queries.filter((q) => q.isError);
  // Backend counts as unreachable only when every section failed
  const isLiveApi = failed.length < queries.length;
  const apiError = failed[0]?.error?.message ?? null;

  // Refetch everything shown on the dashboard
  const loadAllData = useCallback(() => {
    if (!user) return;
    queryClient.invalidateQueries({ queryKey: attendanceKeys.all(user.id) });
    queryClient.invalidateQueries({ queryKey: scheduleKeys.all(user.id) });
  }, [queryClient, user]);

  // Records the next punch in sequence: Morning In -> Morning Out -> Afternoon In -> Afternoon Out
  const handlePunch = async () => {
    if (!token) return;
    const label = todayStatusQuery.data?.nextPunchLabel ?? 'Punch';
    try {
      await punchMutation.mutateAsync(notes || undefined);
      toast({
        title: `${label} Recorded`,
        description: `Punched at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNotes('');
    } catch (err: any) {
      toast({
        title: `${label} Failed`,
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // Timesheet errors surface as a toast; the modal itself only shows loading/data
  useEffect(() => {
    if (timesheetQuery.isError) {
      toast({
        title: 'Failed to load timesheet',
        description: timesheetQuery.error.message,
        status: 'error',
        duration: 3000,
      });
    }
  }, [timesheetQuery.isError, timesheetQuery.error, toast]);

  // Open Timesheet Modal; the query starts once the modal is open
  const handleOpenTimesheet = () => {
    if (!token) return;
    timesheetDisclosure.onOpen();
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!token || !user) return;
    downloadAttendanceCsv(token, {
      userId: user.id,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  // Reset Filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const meta: PaginationMeta = historyQuery.data?.meta ?? { total: 0, page: 1, limit, totalPages: 1 };

  return {
    user,
    token,
    isLiveApi,
    apiError,
    loadAllData,
    // Terminal Punch
    punch: {
      status: todayStatusQuery.data ?? null,
      actionLoading: punchMutation.isPending,
      notes,
      setNotes,
      onPunch: handlePunch,
    },
    // Metrics
    summary: summaryQuery.data ?? EMPTY_SUMMARY,
    summaryLoading: summaryQuery.isPending,
    // Schedules
    myShifts: myShiftsQuery.data ?? [],
    todayShift: todayShiftQuery.data ?? null,
    scheduleLoading: myShiftsQuery.isPending || todayShiftQuery.isPending,
    // History
    history: {
      records: historyQuery.data?.data ?? [],
      meta,
      loading: historyQuery.isPending,
      searchTerm,
      setSearchTerm,
      statusFilter,
      setStatusFilter,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      page,
      setPage,
      limit,
      setLimit,
      resetFilters,
    },
    // Modals
    timesheetDisclosure,
    timesheetData: timesheetQuery.data ?? null,
    timesheetLoading: timesheetQuery.isPending,
    leaveDisclosure,
    handleOpenTimesheet,
    handleExportCsv,
  };
}
