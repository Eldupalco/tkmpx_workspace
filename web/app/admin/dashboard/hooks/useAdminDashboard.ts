'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast, useDisclosure } from '@chakra-ui/react';
import { useAuth, User } from '@/features/auth';
import {
  fetchAttendances,
  postCheckOut,
  downloadAttendanceCsv,
  Attendance,
  PaginationMeta,
} from '@/features/attendance';
import {
  fetchUsers,
  fetchDashboardMetrics,
  fetchCurrentlyIn,
  deleteUser,
} from '@/features/users';

export function useAdminDashboard() {
  const { token } = useAuth();
  const toast = useToast();

  // API status & loading
  const [isLiveApi, setIsLiveApi] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [adminDataLoading, setAdminDataLoading] = useState<boolean>(true);

  // Executive Metrics Pulse
  const [pulse, setPulse] = useState({
    totalEmployees: 0,
    checkedInToday: 0,
    currentlyWorking: 0,
    lateToday: 0,
    onLeaveToday: 0,
    notPunchedYet: 0,
  });

  // Tab 2: Live Presence
  const [currentlyInList, setCurrentlyInList] = useState<Attendance[]>([]);

  // Tab 1: Attendance Roster State
  const [usersList, setUsersList] = useState<User[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [debouncedEmployeeSearch, setDebouncedEmployeeSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [records, setRecords] = useState<Attendance[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Debounce employee search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmployeeSearch(employeeSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  // Tab 3: Team Rostering State
  const [teamSearchTerm, setTeamSearchTerm] = useState<string>('');
  const [teamRoleFilter, setTeamRoleFilter] = useState<string>('all');
  const [teamPage, setTeamPage] = useState<number>(1);
  const [teamLimit, setTeamLimit] = useState<number>(5);

  // Modals state
  const scheduleDisclosure = useDisclosure();
  const [scheduleTargetUserId, setScheduleTargetUserId] = useState<string>('');
  const userModalDisclosure = useDisclosure();
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Load dashboard data from backend API
  const loadAdminData = useCallback(async () => {
    if (!token) return;
    try {
      const [pulseRes, liveRes, usersRes, attRes] = await Promise.all([
        fetchDashboardMetrics(token).catch(() => null),
        fetchCurrentlyIn(token).catch(() => []),
        fetchUsers(token).catch(() => []),
        fetchAttendances({
          page,
          limit,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          employeeSearch: debouncedEmployeeSearch || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          token,
        }),
      ]);

      if (pulseRes) setPulse(pulseRes);
      setCurrentlyInList(liveRes);
      setUsersList(usersRes);
      setRecords(attRes.data);
      setMeta(attRes.meta);

      setIsLiveApi(true);
      setApiError(null);
    } catch (err: any) {
      setIsLiveApi(false);
      setApiError(err?.message || 'Unable to connect to NestJS API');
    } finally {
      setAdminDataLoading(false);
    }
  }, [token, page, limit, statusFilter, debouncedEmployeeSearch, startDate, endDate]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Filtered & paginated users for Tab 3
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = teamSearchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchesRole =
        teamRoleFilter === 'all' || u.role.toLowerCase() === teamRoleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [usersList, teamSearchTerm, teamRoleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (teamPage - 1) * teamLimit;
    return filteredUsers.slice(start, start + teamLimit);
  }, [filteredUsers, teamPage, teamLimit]);

  const teamTotalPages = Math.ceil(filteredUsers.length / teamLimit) || 1;

  // Handlers
  const handleAdminCheckOut = async (attendanceId: string) => {
    if (!token) return;
    try {
      await postCheckOut(token, attendanceId, 'Manager override punch out');
      toast({
        title: 'Check-out updated by manager',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadAdminData();
    } catch (err: any) {
      toast({
        title: 'Check-out update failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const openScheduleForUser = (userId?: string) => {
    setScheduleTargetUserId(userId || '');
    scheduleDisclosure.onOpen();
  };

  const handleOpenCreateUser = () => {
    setUserToEdit(null);
    userModalDisclosure.onOpen();
  };

  const handleOpenEditUser = (user: User) => {
    setUserToEdit(user);
    userModalDisclosure.onOpen();
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to deactivate ${name}'s account?`)) return;

    try {
      await deleteUser(token, id);
      toast({
        title: 'Employee Deleted',
        description: `${name} has been removed from the workforce.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      loadAdminData();
    } catch (err: any) {
      toast({
        title: 'Failed to Delete User',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleExportCsv = () => {
    if (!token) return;
    downloadAttendanceCsv(token, {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const resetRosterFilters = () => {
    setEmployeeSearch('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const resetTeamFilters = () => {
    setTeamSearchTerm('');
    setTeamRoleFilter('all');
    setTeamPage(1);
  };

  return {
    token,
    isLiveApi,
    apiError,
    adminDataLoading,
    loadAdminData,
    pulse,
    // Tab 1 (Attendance Roster)
    roster: {
      records,
      meta,
      employeeSearch,
      setEmployeeSearch,
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
      resetFilters: resetRosterFilters,
      onCheckOut: handleAdminCheckOut,
    },
    // Tab 2 (Live Radar)
    currentlyInList,
    // Tab 3 (Team Rostering)
    team: {
      usersList,
      filteredUsers,
      paginatedUsers,
      teamSearchTerm,
      setTeamSearchTerm,
      teamRoleFilter,
      setTeamRoleFilter,
      teamPage,
      setTeamPage,
      teamLimit,
      setTeamLimit,
      teamTotalPages,
      resetFilters: resetTeamFilters,
      openCreateUser: handleOpenCreateUser,
      openEditUser: handleOpenEditUser,
      deleteUser: handleDeleteUser,
      openSchedule: openScheduleForUser,
    },
    // Modals
    scheduleDisclosure,
    scheduleTargetUserId,
    openScheduleForUser,
    userModalDisclosure,
    userToEdit,
    handleExportCsv,
  };
}
