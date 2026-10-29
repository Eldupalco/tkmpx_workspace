'use client';

import React from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  Badge,
  SimpleGrid,
} from '@chakra-ui/react';
import { ShiftSchedule, TodaySchedule } from '../types';
import { describeShift } from '../utils/format';

interface ScheduleCardProps {
  shifts: ShiftSchedule[];
  todayShift?: TodaySchedule | null;
}

export function ScheduleCard({ shifts, todayShift }: ScheduleCardProps) {
  const currentIsoDay = todayShift?.todayDayOfWeek || (new Date().getDay() === 0 ? 7 : new Date().getDay());

  return (
    <Box
      p={5}
      bg="white"
      border="1px solid"
      borderColor="slate.200"
      borderRadius="xl"
      shadow="xs"
    >
      <HStack justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
        <Box>
          <Heading size="xs" color="slate.900" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
            Assigned Shift Schedule
          </Heading>
          <Text fontSize="xs" color="slate.500" mt={0.5}>
            Recurring shifts and expected hours for the week
          </Text>
        </Box>

        {todayShift && (
          <HStack
            spacing={1.5}
            bg={todayShift.hasShiftToday ? 'emerald.50' : 'slate.100'}
            px={3}
            py={1}
            borderRadius="full"
            border="1px solid"
            borderColor={todayShift.hasShiftToday ? 'emerald.200' : 'slate.200'}
          >
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg={todayShift.hasShiftToday ? 'emerald.500' : 'slate.400'}
            />
            <Text
              fontSize="11px"
              fontWeight="bold"
              color={todayShift.hasShiftToday ? 'emerald.700' : 'slate.600'}
            >
              Today ({todayShift.dayName}):{' '}
              {todayShift.hasShiftToday && todayShift.schedule
                ? describeShift(todayShift.schedule)
                : 'No Shift'}
            </Text>
          </HStack>
        )}
      </HStack>

      {shifts.length === 0 ? (
        <Text fontSize="xs" color="slate.400" py={3} textAlign="center">
          No weekly shift assignments found for this account.
        </Text>
      ) : (
        <SimpleGrid columns={{ base: 2, sm: 3, md: 5, lg: 7 }} spacing={2.5}>
          {shifts.map((s) => {
            const isToday = s.dayOfWeek === currentIsoDay;
            return (
              <Box
                key={s.id}
                p={3}
                bg={isToday ? 'brand.50' : 'slate.50'}
                border="1px solid"
                borderColor={isToday ? 'brand.200' : 'slate.200'}
                borderRadius="lg"
                position="relative"
              >
                {isToday && (
                  <Badge
                    position="absolute"
                    top={1.5}
                    right={1.5}
                    colorScheme="brand"
                    fontSize="8px"
                    borderRadius="full"
                    px={1}
                  >
                    TODAY
                  </Badge>
                )}
                <Text
                  fontSize="xs"
                  fontWeight="bold"
                  color={isToday ? 'brand.700' : 'slate.700'}
                >
                  {s.dayName}
                </Text>
                <Text
                  fontSize="11px"
                  fontWeight="bold"
                  color="slate.900"
                  fontFamily="mono"
                  mt={1}
                >
                  {describeShift(s)}
                </Text>
                <Text fontSize="10px" color="slate.400" mt={0.5} noOfLines={1}>
                  {s.shiftName || 'Standard'}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>
      )}
    </Box>
  );
}

