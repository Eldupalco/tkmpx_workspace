'use client';

import {
  VStack,
  HStack,
  Text,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { BulkScheduleModal, ManageShiftsModal } from '@/features/schedule';
import { UserModal } from '@/features/users';
import { useAdminDashboard } from './hooks/useAdminDashboard';
import {
  AdminHeader,
  ExecutiveKpiGrid,
  AttendanceRosterTab,
  LiveRadarTab,
  TeamRosteringTab,
} from './components';

// Auth, navbar and container come from app/admin/layout.tsx
export default function AdminDashboardPage() {
  const {
    token,
    loadAdminData,
    pulse,
    pulseLoading,
    currentlyInList,
    team,
    scheduleDisclosure,
    scheduleTargetUserId,
    openScheduleForUser,
    manageShiftsDisclosure,
    manageShiftsUser,
    bulkAssignFromManage,
    userModalDisclosure,
    userToEdit,
  } = useAdminDashboard();

  return (
    <>
      <VStack spacing={6} align="stretch">
        {/* 1. Header with Title & Action Buttons */}
        <AdminHeader
          onAssignShifts={() => openScheduleForUser()}
        />

        {/* 2. Executive Pulse KPI Grid */}
        <ExecutiveKpiGrid pulse={pulse} loading={pulseLoading} />

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
              _selected={{
                color: 'brand.600',
                borderColor: 'brand.600',
                fontWeight: 'bold',
              }}
            >
              {/* Record count is shown inside the tab, which owns the roster data */}
              <Text>Attendance Roster</Text>
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
              _selected={{
                color: 'brand.600',
                borderColor: 'brand.600',
                fontWeight: 'bold',
              }}
            >
              <HStack spacing={2}>
                <Text>Live On-Site Radar</Text>
                <Badge
                  colorScheme="green"
                  variant="subtle"
                  borderRadius="full"
                  px={2}
                  py={0.2}
                  fontSize="10px"
                >
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
              _selected={{
                color: 'brand.600',
                borderColor: 'brand.600',
                fontWeight: 'bold',
              }}
            >
              <HStack spacing={2}>
                <Text>Team Shift Rostering</Text>
                <Badge
                  variant="subtle"
                  bg="slate.100"
                  color="slate.700"
                  borderRadius="full"
                  px={2}
                  py={0.2}
                  fontSize="10px"
                >
                  {team.usersList.length}
                </Badge>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Tab 1: Attendance Roster */}
            <TabPanel p={0}>
              <AttendanceRosterTab />
            </TabPanel>

            {/* Tab 2: Live On-Site Presence */}
            <TabPanel p={0}>
              <LiveRadarTab currentlyInList={currentlyInList} />
            </TabPanel>

            {/* Tab 3: Shift Rostering & Team Management */}
            <TabPanel p={0}>
              <TeamRosteringTab
                onOpenCreateUser={team.openCreateUser}
                onOpenEditUser={team.openEditUser}
                onDeleteUser={team.deleteUser}
                onManageShifts={team.manageShifts}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Per-employee shift management */}
      {token && (
        <ManageShiftsModal
          isOpen={manageShiftsDisclosure.isOpen}
          onClose={manageShiftsDisclosure.onClose}
          user={manageShiftsUser}
          token={token}
          onBulkAssign={bulkAssignFromManage}
          onChanged={loadAdminData}
        />
      )}

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
    </>
  );
}
