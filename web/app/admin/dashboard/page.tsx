'use client';

import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from '@chakra-ui/react';
import { AuthGuard } from '@/features/auth';
import { BulkScheduleModal } from '@/features/schedule';
import { UserModal } from '@/features/users';
import { Navbar } from '@/components';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import {
  AdminHeader,
  ExecutiveKpiGrid,
  AttendanceRosterTab,
  LiveRadarTab,
  TeamRosteringTab,
} from './components';

function AdminDashboardContent() {
  const {
    token,
    isLiveApi,
    apiError,
    adminDataLoading,
    loadAdminData,
    pulse,
    roster,
    currentlyInList,
    team,
    scheduleDisclosure,
    scheduleTargetUserId,
    openScheduleForUser,
    userModalDisclosure,
    userToEdit,
    handleExportCsv,
  } = useAdminDashboard();

  return (
    <Box minH="100vh" bg="slate.50">
      <Navbar isLiveApi={isLiveApi} />

      <Container maxW="1200px" py={8}>
        <VStack spacing={6} align="stretch">
          {/* API Error Notification */}
          {!isLiveApi && (
            <Alert status="warning" borderRadius="xl" shadow="xs" border="1px solid" borderColor="amber.200">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle fontSize="sm">API Connection Notice</AlertTitle>
                <AlertDescription fontSize="xs">
                  {apiError || 'NestJS backend is unreachable.'}
                </AlertDescription>
              </Box>
              <Button size="xs" colorScheme="orange" onClick={loadAdminData}>
                Retry
              </Button>
            </Alert>
          )}

          {/* 1. Header with Title & Action Buttons */}
          <AdminHeader
            onAssignShifts={() => openScheduleForUser()}
            onExportCsv={handleExportCsv}
          />

          {/* 2. Executive Pulse KPI Grid */}
          <ExecutiveKpiGrid pulse={pulse} loading={adminDataLoading} />

          {/* 3. Sub-View Tabs */}
          <Tabs variant="unstyled" defaultIndex={0}>
            <TabList
              borderBottom="1px solid"
              borderColor="slate.200"
              mb={5}
              gap={6}
              overflowX="auto"
              overflowY="hidden"
              sx={{
                scrollbarWidth: 'none',
                '::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {/* Tab 1 Trigger */}
              <Tab
                px={1}
                py={3}
                fontSize="xs"
                fontWeight="semibold"
                color="slate.500"
                borderBottom="2px solid"
                borderColor="transparent"
                mb="-1px"
                transition="all 0.15s ease"
                _hover={{ color: 'slate.800' }}
                _selected={{ color: 'brand.600', borderColor: 'brand.600', fontWeight: 'bold' }}
              >
                <HStack spacing={2}>
                  <Text>Attendance Roster</Text>
                  <Badge variant="subtle" bg="slate.100" color="slate.700" borderRadius="full" px={2} py={0.2} fontSize="10px">
                    {roster.meta.total}
                  </Badge>
                </HStack>
              </Tab>

              {/* Tab 2 Trigger */}
              <Tab
                px={1}
                py={3}
                fontSize="xs"
                fontWeight="semibold"
                color="slate.500"
                borderBottom="2px solid"
                borderColor="transparent"
                mb="-1px"
                transition="all 0.15s ease"
                _hover={{ color: 'slate.800' }}
                _selected={{ color: 'brand.600', borderColor: 'brand.600', fontWeight: 'bold' }}
              >
                <HStack spacing={2}>
                  <Text>Live On-Site Radar</Text>
                  <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2} py={0.2} fontSize="10px">
                    {currentlyInList.length}
                  </Badge>
                </HStack>
              </Tab>

              {/* Tab 3 Trigger */}
              <Tab
                px={1}
                py={3}
                fontSize="xs"
                fontWeight="semibold"
                color="slate.500"
                borderBottom="2px solid"
                borderColor="transparent"
                mb="-1px"
                transition="all 0.15s ease"
                _hover={{ color: 'slate.800' }}
                _selected={{ color: 'brand.600', borderColor: 'brand.600', fontWeight: 'bold' }}
              >
                <HStack spacing={2}>
                  <Text>Team Shift Rostering</Text>
                  <Badge variant="subtle" bg="slate.100" color="slate.700" borderRadius="full" px={2} py={0.2} fontSize="10px">
                    {team.usersList.length}
                  </Badge>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: Attendance Roster */}
              <TabPanel p={0}>
                <AttendanceRosterTab
                  records={roster.records}
                  meta={roster.meta}
                  loading={adminDataLoading}
                  employeeSearch={roster.employeeSearch}
                  setEmployeeSearch={roster.setEmployeeSearch}
                  statusFilter={roster.statusFilter}
                  setStatusFilter={roster.setStatusFilter}
                  startDate={roster.startDate}
                  setStartDate={roster.setStartDate}
                  endDate={roster.endDate}
                  setEndDate={roster.setEndDate}
                  setPage={roster.setPage}
                  setLimit={roster.setLimit}
                  resetFilters={roster.resetFilters}
                  onRefresh={loadAdminData}
                  onCheckOut={roster.onCheckOut}
                />
              </TabPanel>

              {/* Tab 2: Live On-Site Presence */}
              <TabPanel p={0}>
                <LiveRadarTab currentlyInList={currentlyInList} />
              </TabPanel>

              {/* Tab 3: Shift Rostering & Team Management */}
              <TabPanel p={0}>
                <TeamRosteringTab
                  usersCount={team.usersList.length}
                  filteredUsers={team.filteredUsers}
                  paginatedUsers={team.paginatedUsers}
                  teamSearchTerm={team.teamSearchTerm}
                  setTeamSearchTerm={team.setTeamSearchTerm}
                  teamRoleFilter={team.teamRoleFilter}
                  setTeamRoleFilter={team.setTeamRoleFilter}
                  teamPage={team.teamPage}
                  setTeamPage={team.setTeamPage}
                  teamLimit={team.teamLimit}
                  setTeamLimit={team.setTeamLimit}
                  teamTotalPages={team.teamTotalPages}
                  resetFilters={team.resetFilters}
                  onOpenCreateUser={team.openCreateUser}
                  onOpenEditUser={team.openEditUser}
                  onDeleteUser={team.deleteUser}
                  onOpenSchedule={team.openSchedule}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Bulk Schedule Assignment Modal */}
      {token && team.usersList.length > 0 && (
        <BulkScheduleModal
          isOpen={scheduleDisclosure.isOpen}
          onClose={scheduleDisclosure.onClose}
          users={team.usersList}
          defaultUserId={scheduleTargetUserId}
          token={token}
          onSuccess={loadAdminData}
        />
      )}

      {/* User CRUD Modal */}
      {token && (
        <UserModal
          isOpen={userModalDisclosure.isOpen}
          onClose={userModalDisclosure.onClose}
          token={token}
          userToEdit={userToEdit}
          onSuccess={loadAdminData}
        />
      )}
    </Box>
  );
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <AdminDashboardContent />
    </AuthGuard>
  );
}
