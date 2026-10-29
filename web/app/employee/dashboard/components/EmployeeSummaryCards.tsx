'use client';

import { SimpleGrid, Box, Skeleton } from '@chakra-ui/react';
import { StatCard } from '@/components';

interface AttendanceSummary {
  total: number;
  present: number;
  late: number;
  absent: number;
  onLeave: number;
}

interface EmployeeSummaryCardsProps {
  summary: AttendanceSummary;
  loading: boolean;
}

export function EmployeeSummaryCards({ summary, loading }: EmployeeSummaryCardsProps) {
  if (loading) {
    return (
      <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={4}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} p={5} bg="white" border="1px solid" borderColor="slate.200" borderRadius="xl">
            <Skeleton h="12px" w="70px" mb={3} borderRadius="md" />
            <Skeleton h="32px" w="45px" mb={2} borderRadius="md" />
            <Skeleton h="10px" w="90px" borderRadius="md" />
          </Box>
        ))}
      </SimpleGrid>
    );
  }

  return (
    <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={4}>
      <StatCard
        title="Present Shifts"
        value={summary.present}
        helpText="Logged working days"
        badgeText="On Track"
        badgeScheme="green"
        tooltip="Completed work shifts logged on schedule"
      />
      <StatCard
        title="Late Arrivals"
        value={summary.late}
        helpText="Tardy punch count"
        badgeText="Review"
        badgeScheme="orange"
        tooltip="Shifts where check-in occurred after scheduled start time"
      />
      <StatCard
        title="Approved Leave"
        value={summary.onLeave}
        helpText="Time-off days"
        badgeText="PTO"
        badgeScheme="purple"
        tooltip="Approved paid time-off and vacation days"
      />
      <StatCard
        title="Total Sessions"
        value={summary.total}
        helpText="All-time sessions"
        badgeText="Total"
        badgeScheme="gray"
        tooltip="Cumulative attendance sessions recorded across all time"
      />
    </SimpleGrid>
  );
}
