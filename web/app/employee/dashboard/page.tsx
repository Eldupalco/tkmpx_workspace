'use client';

import {
  Box,
  Container,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from '@chakra-ui/react';
import { AuthGuard } from '@/features/auth';
import { TimesheetModal, LeaveRequestModal } from '@/features/attendance';
import { Navbar } from '@/components';
import { useEmployeeDashboard } from './hooks/useEmployeeDashboard';
import {
  EmployeeHeader,
  PunchTerminalCard,
  EmployeeSummaryCards,
  ScheduleSection,
  PunchHistorySection,
} from './components';

function EmployeeDashboardContent() {
  const {
    user,
    token,
    isLiveApi,
    apiError,
    dataLoading,
    loadAllData,
    punch,
    summary,
    myShifts,
    todayShift,
    history,
    timesheetDisclosure,
    timesheetData,
    timesheetLoading,
    leaveDisclosure,
    handleOpenTimesheet,
    handleExportCsv,
  } = useEmployeeDashboard();

  return (
    <Box minH="100vh" bg="slate.50">
      <Navbar isLiveApi={isLiveApi} />

      <Container maxW="1200px" py={8}>
        <VStack spacing={6} align="stretch">
          {/* API Connection Warning */}
          {!isLiveApi && (
            <Alert status="warning" borderRadius="xl" shadow="xs" border="1px solid" borderColor="amber.200">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle fontSize="sm">API Connection Notice</AlertTitle>
                <AlertDescription fontSize="xs">
                  {apiError || 'NestJS backend is unreachable.'}
                </AlertDescription>
              </Box>
              <Button size="xs" colorScheme="orange" onClick={loadAllData}>
                Retry
              </Button>
            </Alert>
          )}

          {/* 1. Header & Quick Actions */}
          <EmployeeHeader
            userName={user?.name}
            onOpenTimesheet={handleOpenTimesheet}
            onOpenLeave={leaveDisclosure.onOpen}
            onExportCsv={handleExportCsv}
          />

          {/* 2. Clock-In / Clock-Out Punch Terminal */}
          <PunchTerminalCard
            status={punch.status}
            isLoading={punch.actionLoading}
            notes={punch.notes}
            setNotes={punch.setNotes}
            onPunch={punch.onPunch}
          />

          {/* 3. Metric Summary Cards */}
          <EmployeeSummaryCards summary={summary} loading={dataLoading} />

          {/* 4. Weekly Schedule Card */}
          <ScheduleSection
            shifts={myShifts}
            todayShift={todayShift}
            loading={dataLoading}
          />

          {/* 5. Personal Punch History & Filters */}
          <PunchHistorySection
            records={history.records}
            meta={history.meta}
            loading={dataLoading}
            searchTerm={history.searchTerm}
            setSearchTerm={history.setSearchTerm}
            statusFilter={history.statusFilter}
            setStatusFilter={history.setStatusFilter}
            startDate={history.startDate}
            setStartDate={history.setStartDate}
            endDate={history.endDate}
            setEndDate={history.setEndDate}
            setPage={history.setPage}
            setLimit={history.setLimit}
            resetFilters={history.resetFilters}
            onRefresh={loadAllData}
          />
        </VStack>
      </Container>

      {/* Timesheet & Overtime Modal */}
      <TimesheetModal
        isOpen={timesheetDisclosure.isOpen}
        onClose={timesheetDisclosure.onClose}
        timesheetData={timesheetData}
        isLoading={timesheetLoading}
      />

      {/* Leave Request Modal */}
      {token && (
        <LeaveRequestModal
          isOpen={leaveDisclosure.isOpen}
          onClose={leaveDisclosure.onClose}
          token={token}
          onSuccess={loadAllData}
        />
      )}
    </Box>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <AuthGuard allowedRoles={['user', 'admin']}>
      <EmployeeDashboardContent />
    </AuthGuard>
  );
}
