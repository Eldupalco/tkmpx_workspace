'use client';

import { useState, useCallback, useMemo } from 'react';
import { useToast, useDisclosure } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth, User } from '@/features/auth';
import { Attendance } from '@/features/attendance';
import {
  adminKeys,
  deleteUser,
  DashboardMetrics,
  useCurrentlyIn,
  useDashboardMetrics,
  useUsers,
} from '@/features/users';

const EMPTY_PULSE: DashboardMetrics = {
  totalEmployees: 0,
  checkedInToday: 0,
  currentlyWorking: 0,
  lateToday: 0,
  onLeaveToday: 0,
  notPunchedYet: 0,
};

export function useAdminDashboard() {
  const { token } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Modals state
  const scheduleDisclosure = useDisclosure();
  const manageShiftsDisclosure = useDisclosure();
  const [manageShiftsUser, setManageShiftsUser] = useState<User | null>(null);
  const [scheduleTargetUserId, setScheduleTargetUserId] = useState<string>('');
  const userModalDisclosure = useDisclosure();
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Each block loads, caches and fails independently
  const metricsQuery = useDashboardMetrics();
  const currentlyInQuery = useCurrentlyIn();
  const usersQuery = useUsers();
  const pulse = metricsQuery.data ?? EMPTY_PULSE;
  const currentlyInList: Attendance[] = currentlyInQuery.data ?? [];
  const usersList: User[] = useMemo(
    () => usersQuery.data ?? [],
    [usersQuery.data],
  );

  // Refetch everything shown on the admin dashboard
  const loadAdminData = useCallback(
    () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
    [queryClient],
  );

  const openScheduleForUser = (userId?: string) => {
    setScheduleTargetUserId(userId || '');
    scheduleDisclosure.onOpen();
  };

  // Per-employee shift list (edit / deactivate / delete)
  const openManageShifts = (target: User) => {
    setManageShiftsUser(target);
    manageShiftsDisclosure.onOpen();
  };

  // From the shift list, switch to the bulk weekly assignment for the same employee
  const bulkAssignFromManage = (userId: string) => {
    manageShiftsDisclosure.onClose();
    openScheduleForUser(userId);
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
    if (
      !window.confirm(`Are you sure you want to deactivate ${name}'s account?`)
    )
      return;

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

  return {
    token,
    loadAdminData,
    pulse,
    pulseLoading: metricsQuery.isPending,
    // Tab 2 (Live Radar)
    currentlyInList,
    // Tab 3 (Team Rostering)
    team: {
      usersList,
      openCreateUser: handleOpenCreateUser,
      openEditUser: handleOpenEditUser,
      deleteUser: handleDeleteUser,
      openSchedule: openScheduleForUser,
      manageShifts: openManageShifts,
    },
    // Modals
    scheduleDisclosure,
    scheduleTargetUserId,
    openScheduleForUser,
    manageShiftsDisclosure,
    manageShiftsUser,
    bulkAssignFromManage,
    userModalDisclosure,
    userToEdit,
  };
}
