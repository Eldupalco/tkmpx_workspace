'use client';

import { SimpleGrid, Box, Skeleton } from '@chakra-ui/react';
import { StatCard } from '@/components';
import { DashboardMetrics } from '@/features/users';

interface ExecutiveKpiGridProps {
  pulse: DashboardMetrics;
  loading: boolean;
}

export function ExecutiveKpiGrid({ pulse, loading }: ExecutiveKpiGridProps) {
  if (loading) {
    return (
      <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Box key={i} p={4} bg="white" border="1px solid" borderColor="slate.200" borderRadius="xl">
            <Skeleton h="10px" w="50px" mb={2} borderRadius="md" />
            <Skeleton h="28px" w="35px" mb={2} borderRadius="md" />
            <Skeleton h="8px" w="60px" borderRadius="md" />
          </Box>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} spacing={3}>
      <StatCard
        title="Employees"
        value={pulse.totalEmployees}
        badgeText="Total"
        badgeScheme="gray"
        tooltip="Total registered workforce accounts in the organization"
      />
      <StatCard
        title="Punched Today"
        value={pulse.checkedInToday}
        badgeText="Active"
        badgeScheme="blue"
        tooltip="Employees who have logged a check-in punch today"
      />
      <StatCard
        title="On-Site Now"
        value={pulse.currentlyWorking}
        badgeText="Live"
        badgeScheme="green"
        tooltip="Employees actively clocked in and working on-site right now"
      />
      <StatCard
        title="Late Shifts"
        value={pulse.lateToday}
        badgeText="Tardy"
        badgeScheme="orange"
        tooltip="Shifts where check-in occurred after scheduled start time"
      />
      <StatCard
        title="On Leave"
        value={pulse.onLeaveToday}
        badgeText="PTO"
        badgeScheme="purple"
        tooltip="Employees with approved PTO or vacation scheduled for today"
      />
      <StatCard
        title="Not Punched"
        value={pulse.notPunchedYet}
        badgeText="Pending"
        badgeScheme="red"
        tooltip="Scheduled employees who have not clocked in or punched attendance today"
      />
    </SimpleGrid>
  );
}
