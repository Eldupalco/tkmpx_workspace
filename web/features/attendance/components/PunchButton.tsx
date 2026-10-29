'use client';

import React, { useState, useEffect } from 'react';
import {
  Button,
  HStack,
  Text,
  Box,
  Badge,
  Flex,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import { FiClock, FiLogIn, FiLogOut, FiCheck } from 'react-icons/fi';
import { PunchSlot, TodayPunchStatus } from '../types';

const SLOTS: { key: PunchSlot; label: string }[] = [
  { key: 'amIn', label: 'Morning In' },
  { key: 'amOut', label: 'Morning Out' },
  { key: 'pmIn', label: 'Afternoon In' },
  { key: 'pmOut', label: 'Afternoon Out' },
];

// Shifts without a lunch break: one session
const NO_BREAK_SLOTS: { key: PunchSlot; label: string }[] = [
  { key: 'amIn', label: 'Time In' },
  { key: 'amOut', label: 'Time Out' },
];

interface PunchButtonProps {
  status: TodayPunchStatus | null;
  isLoading: boolean;
  onPunch: () => void;
}

function formatPunch(value?: string | null) {
  return value
    ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
}

function dutyBadge(status: TodayPunchStatus | null) {
  const record = status?.record;
  if (status?.onLeave) return { label: '● ON LEAVE', scheme: 'purple' };
  if (status?.completed) return { label: '✓ DAY COMPLETE', scheme: 'blue' };
  if (status?.isWorking) return { label: '● ON SHIFT', scheme: 'green' };
  if (record?.amOut && !record?.pmIn) return { label: '◐ ON BREAK', scheme: 'orange' };
  return { label: '○ OFF DUTY', scheme: 'gray' };
}

export function PunchButton({ status, isLoading, onPunch }: PunchButtonProps) {
  // Live digital clock updating every second
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [elapsedDuration, setElapsedDuration] = useState<string>('');

  const record = status?.record;
  // The half-day session currently open, if any
  const openSince = status?.isWorking ? (record?.pmIn ?? record?.amIn ?? null) : null;

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString([], {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );

      if (openSince) {
        const diffMs = now.getTime() - new Date(openSince).getTime();
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          setElapsedDuration(`${hours}h ${mins}m this session`);
        }
      } else {
        setElapsedDuration('');
      }
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [openSince]);

  const badge = dutyBadge(status);
  const slots = status && !status.hasBreak ? NO_BREAK_SLOTS : SLOTS;
  const next = status?.nextPunch ?? null;
  const isInPunch = next === 'amIn' || next === 'pmIn';
  const isActive = Boolean(status?.isWorking);

  return (
    <Box>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        gap={5}
      >
        {/* Left: Live Terminal Clock & Punch Status */}
        <HStack spacing={4} align="center">
          <Box
            w="52px"
            h="52px"
            borderRadius="2xl"
            bg={isActive ? 'emerald.50' : 'slate.100'}
            color={isActive ? 'emerald.600' : 'slate.500'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor={isActive ? 'emerald.200' : 'slate.200'}
          >
            <Icon as={FiClock} boxSize={6} />
          </Box>

          <Box>
            <HStack spacing={2} align="center">
              <Text fontSize="xl" fontWeight="extrabold" color="slate.900" fontFamily="mono">
                {currentTime || '00:00:00'}
              </Text>
              <Badge
                colorScheme={badge.scheme}
                variant="subtle"
                fontSize="10px"
                borderRadius="full"
                px={2}
                py={0.5}
                fontWeight="bold"
                textTransform="uppercase"
              >
                {badge.label}
              </Badge>
            </HStack>

            <Text fontSize="xs" color="slate.500" mt={0.5}>
              {currentDate || 'Loading date...'}
              {elapsedDuration ? ` • ${elapsedDuration}` : ''}
              {status && status.hoursWorked > 0 ? ` • ${status.hoursWorked} hrs today` : ''}
            </Text>
          </Box>
        </HStack>

        {/* Right: Single punch button for the next slot */}
        <HStack spacing={3}>
          {next ? (
            <Button
              colorScheme={isInPunch ? 'brand' : 'red'}
              bg={isInPunch ? 'brand.600' : undefined}
              variant={isInPunch ? 'solid' : 'outline'}
              size="lg"
              h="48px"
              px={8}
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              borderWidth={isInPunch ? undefined : '1.5px'}
              leftIcon={<Icon as={isInPunch ? FiLogIn : FiLogOut} boxSize={4} />}
              isLoading={isLoading}
              loadingText="Recording Punch..."
              onClick={onPunch}
              shadow="sm"
              _hover={isInPunch ? { bg: 'brand.700', shadow: 'md' } : { bg: 'red.50' }}
            >
              Punch {status?.nextPunchLabel}
            </Button>
          ) : (
            <Button
              size="lg"
              h="48px"
              px={8}
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              leftIcon={<Icon as={FiCheck} boxSize={4} />}
              isDisabled
            >
              {status?.onLeave ? 'On Leave Today' : 'All Punches Recorded'}
            </Button>
          )}
        </HStack>
      </Flex>

      {/* Daily Time Record: the four punches of today */}
      <SimpleGrid columns={{ base: 2, md: slots.length }} spacing={3} mt={5}>
        {slots.map((slot) => {
          const value = record?.[slot.key];
          const isNext = slot.key === next;
          return (
            <Box
              key={slot.key}
              p={3}
              borderRadius="lg"
              border="1px solid"
              borderColor={isNext ? 'brand.300' : 'slate.200'}
              bg={value ? 'slate.50' : isNext ? 'brand.50' : 'white'}
            >
              <Text fontSize="10px" fontWeight="bold" textTransform="uppercase" color="slate.500">
                {slot.label}
              </Text>
              <Text
                fontSize="md"
                fontWeight="extrabold"
                fontFamily="mono"
                color={value ? 'slate.900' : 'slate.300'}
                mt={0.5}
              >
                {formatPunch(value)}
              </Text>
            </Box>
          );
        })}
      </SimpleGrid>

      {record && (record.lateMinutes > 0 || record.undertimeMinutes > 0) && (
        <HStack spacing={2} mt={3}>
          {record.lateMinutes > 0 && (
            <Badge colorScheme="orange" variant="subtle" borderRadius="full" fontSize="10px" px={2}>
              Late {record.lateMinutes} min
            </Badge>
          )}
          {record.undertimeMinutes > 0 && (
            <Badge colorScheme="red" variant="subtle" borderRadius="full" fontSize="10px" px={2}>
              Undertime {record.undertimeMinutes} min
            </Badge>
          )}
        </HStack>
      )}
    </Box>
  );
}
