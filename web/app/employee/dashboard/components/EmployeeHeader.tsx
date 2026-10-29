'use client';

import { Box, HStack, Heading, Text, Button, Icon, useDisclosure } from '@chakra-ui/react';
import { FiFileText, FiSend } from 'react-icons/fi';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import {
  attendanceKeys,
  LeaveRequestModal,
  TimesheetModal,
  useTimesheet,
} from '@/features/attendance';

// Outline styling comes from the theme's Button `outline` variant
const actionButtonProps = { size: 'sm', variant: 'outline', fontSize: 'xs' } as const;

export function EmployeeHeader() {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const timesheetDisclosure = useDisclosure();
  const leaveDisclosure = useDisclosure();
  const timesheetQuery = useTimesheet(timesheetDisclosure.isOpen);

  const handleLeaveSuccess = () => {
    if (user) queryClient.invalidateQueries({ queryKey: attendanceKeys.all(user.id) });
  };

  return (
    <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
      <Box>
        <Heading size="md" color="slate.900" fontWeight="extrabold" letterSpacing="-0.02em">
          Welcome, {user?.name || 'Employee'}
        </Heading>
        <Text color="slate.500" fontSize="xs" mt={0.5}>
          Employee Workspace • Punch shifts, inspect weekly rosters & request leave
        </Text>
      </Box>

      <HStack spacing={2.5}>
        <Button
          {...actionButtonProps}
          leftIcon={<Icon as={FiFileText} boxSize={3.5} color="slate.500" />}
          onClick={timesheetDisclosure.onOpen}
        >
          Timesheet & Overtime
        </Button>
        <Button
          {...actionButtonProps}
          leftIcon={<Icon as={FiSend} boxSize={3.5} color="slate.500" />}
          onClick={leaveDisclosure.onOpen}
        >
          Request Leave
        </Button>
      </HStack>

      <TimesheetModal
        isOpen={timesheetDisclosure.isOpen}
        onClose={timesheetDisclosure.onClose}
        timesheetData={timesheetQuery.data ?? null}
        isLoading={timesheetQuery.isPending}
      />

      {token && (
        <LeaveRequestModal
          isOpen={leaveDisclosure.isOpen}
          onClose={leaveDisclosure.onClose}
          token={token}
          onSuccess={handleLeaveSuccess}
        />
      )}
    </HStack>
  );
}
