'use client';

import { Box, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { ScheduleCard, ShiftSchedule, TodaySchedule } from '@/features/schedule';

interface ScheduleSectionProps {
  shifts: ShiftSchedule[];
  todayShift: TodaySchedule | null;
  loading: boolean;
}

export function ScheduleSection({ shifts, todayShift, loading }: ScheduleSectionProps) {
  if (loading) {
    return (
      <Box p={5} bg="white" border="1px solid" borderColor="slate.200" borderRadius="xl">
        <Skeleton h="18px" w="180px" mb={4} borderRadius="md" />
        <SimpleGrid columns={{ base: 2, sm: 4, md: 7 }} spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} h="70px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      </Box>
    );
  }

  return <ScheduleCard shifts={shifts} todayShift={todayShift} />;
}
