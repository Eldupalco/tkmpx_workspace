'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast, useDisclosure } from '@chakra-ui/react';
import { useAuth } from '@/features/auth';
import {
  fetchAttendances,
  fetchTodayStatus,
  postCheckIn,
  postCheckOut,
  fetchAttendanceSummary,
  fetchTimesheet,
  downloadAttendanceCsv,
  Attendance,
  PaginationMeta,
  TimesheetData,
} from '@/features/attendance';
import {
  fetchMySchedule,
  fetchTodaySchedule,
  ShiftSchedule,
  TodaySchedule,
} from '@/features/schedule';

export function useEmployeeDashboard() {
  const { user, token } = useAuth();
  const toast = useToast();

  // API connection & loading
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Today Punch Status State
  const [activeAttendanceId, setActiveAttendanceId] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Summary Metrics
  const [summary, setSummary] = useState<{
    total: number;
    present: number;
    late: number;
    absent: number;
    onLeave: number;
  }>({ total: 0, present: 0, late: 0, absent: 0, onLeave: 0 });

  // Weekly Schedules
  const [myShifts, setMyShifts] = useState<ShiftSchedule[]>([]);
  const [todayShift, setTodayShift] = useState<TodaySchedule | null>(null);

  // Punch History Filters & Pagination
  const [records, setRecords] = useState<Attendance[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(5);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  });

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
  const [timesheetData, setTimesheetData] = useState<TimesheetData | null>(null);
  const [timesheetLoading, setTimesheetLoading] = useState(false);
  const leaveDisclosure = useDisclosure();

  // Fetch all employee dashboard data
  const loadAllData = useCallback(async () => {
    if (!token || !user) return;
    try {
      const statusRes = await fetchTodayStatus(token);
      if (statusRes) {
        setIsCheckedIn(statusRes.hasCheckedIn && !statusRes.hasCheckedOut);
        setActiveAttendanceId(statusRes.record?.id || null);
        setCheckInTime(statusRes.record?.checkInTime ? String(statusRes.record.checkInTime) : null);
      }

      const sumRes = await fetchAttendanceSummary(token);
      if (sumRes) setSummary(sumRes);

      const [shifts, tShift] = await Promise.all([
        fetchMySchedule(token).catch(() => []),
        fetchTodaySchedule(token).catch(() => null),
      ]);
      setMyShifts(shifts);
      setTodayShift(tShift);

      const attRes = await fetchAttendances({
        page,
        limit,
        userId: user.id,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        token,
      });
      setRecords(attRes.data);
      setMeta(attRes.meta);

      setIsLiveApi(true);
      setApiError(null);
    } catch (err: any) {
      setIsLiveApi(false);
      setApiError(err?.message || 'Unable to connect to NestJS API');
    } finally {
      setDataLoading(false);
    }
  }, [token, user, page, limit, debouncedSearch, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Punch In Handler
  const handleCheckIn = async () => {
    if (!token) return;
    setActionLoading(true);
    try {
      const created = await postCheckIn(token, notes);
      toast({
        title: 'Check-In Punch Recorded!',
        description: `Clocked in at ${new Date(created.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNotes('');
      await loadAllData();
    } catch (err: any) {
      toast({
        title: 'Check-In Failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Punch Out Handler
  const handleCheckOut = async (idToCheckout?: string) => {
    if (!token) return;
    const targetId = idToCheckout || activeAttendanceId;
    if (!targetId) return;

    setActionLoading(true);
    try {
      await postCheckOut(token, targetId);
      toast({
        title: 'Check-Out Punch Recorded!',
        description: 'Have a wonderful evening!',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      await loadAllData();
    } catch (err: any) {
      toast({
        title: 'Check-Out Failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Timesheet Modal & Load Timesheet API
  const handleOpenTimesheet = async () => {
    if (!token) return;
    timesheetDisclosure.onOpen();
    setTimesheetLoading(true);
    try {
      const data = await fetchTimesheet(token);
      setTimesheetData(data);
    } catch (err: any) {
      toast({
        title: 'Failed to load timesheet',
        description: err.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setTimesheetLoading(false);
    }
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

  return {
    user,
    token,
    isLiveApi,
    apiError,
    dataLoading,
    loadAllData,
    // Terminal Punch
    punch: {
      isCheckedIn,
      actionLoading,
      checkInTime,
      notes,
      setNotes,
      onCheckIn: handleCheckIn,
      onCheckOut: handleCheckOut,
    },
    // Metrics
    summary,
    // Schedules
    myShifts,
    todayShift,
    // History
    history: {
      records,
      meta,
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
      onCheckOut: handleCheckOut,
    },
    // Modals
    timesheetDisclosure,
    timesheetData,
    timesheetLoading,
    leaveDisclosure,
    handleOpenTimesheet,
    handleExportCsv,
  };
}
