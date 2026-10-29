'use client';

import { Box, SimpleGrid, Skeleton } from '@chakra-ui/react';
import { ScheduleCard, useMySchedule, useTodaySchedule } from '@/features/schedule';

export function ScheduleSection() {
  const myShiftsQuery = useMySchedule();
  const todayShiftQuery = useTodaySchedule();

  if (myShiftsQuery.isPending || todayShiftQuery.isPending) {
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

  return <ScheduleCard shifts={myShiftsQuery.data ?? []} todayShift={todayShiftQuery.data ?? null} />;
}
