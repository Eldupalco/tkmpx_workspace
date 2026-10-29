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
} from '@chakra-ui/react';
import { FiClock, FiPlay, FiSquare } from 'react-icons/fi';

interface CheckInButtonProps {
  isCheckedIn: boolean;
  isLoading: boolean;
  lastCheckInTime?: string | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function CheckInButton({
  isCheckedIn,
  isLoading,
  lastCheckInTime,
  onCheckIn,
  onCheckOut,
}: CheckInButtonProps) {
  // Live digital clock updating every second
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [elapsedDuration, setElapsedDuration] = useState<string>('');

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

      // If checked in, calculate elapsed shift time
      if (isCheckedIn && lastCheckInTime) {
        const diffMs = now.getTime() - new Date(lastCheckInTime).getTime();
        if (diffMs > 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          setElapsedDuration(`${hours}h ${mins}m elapsed`);
        }
      }
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [isCheckedIn, lastCheckInTime]);

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
            bg={isCheckedIn ? 'emerald.50' : 'slate.100'}
            color={isCheckedIn ? 'emerald.600' : 'slate.500'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor={isCheckedIn ? 'emerald.200' : 'slate.200'}
          >
            <Icon as={FiClock} boxSize={6} />
          </Box>

          <Box>
            <HStack spacing={2} align="center">
              <Text fontSize="xl" fontWeight="extrabold" color="slate.900" fontFamily="mono">
                {currentTime || '00:00:00'}
              </Text>
              <Badge
                colorScheme={isCheckedIn ? 'green' : 'gray'}
                variant="subtle"
                fontSize="10px"
                borderRadius="full"
                px={2}
                py={0.5}
                fontWeight="bold"
                textTransform="uppercase"
              >
                {isCheckedIn ? '● ON SHIFT' : '○ OFF DUTY'}
              </Badge>
            </HStack>

            <Text fontSize="xs" color="slate.500" mt={0.5}>
              {currentDate || 'Loading date...'}
              {isCheckedIn && elapsedDuration ? ` • ${elapsedDuration}` : ''}
            </Text>
          </Box>
        </HStack>

        {/* Right: Tactile Punch Button */}
        <HStack spacing={3}>
          {!isCheckedIn ? (
            <Button
              colorScheme="brand"
              bg="brand.600"
              size="lg"
              h="48px"
              px={8}
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              leftIcon={<Icon as={FiPlay} boxSize={4} />}
              isLoading={isLoading}
              loadingText="Recording Punch..."
              onClick={onCheckIn}
              shadow="sm"
              _hover={{ bg: 'brand.700', shadow: 'md' }}
            >
              Clock In Now
            </Button>
          ) : (
            <Button
              colorScheme="red"
              variant="outline"
              size="lg"
              h="48px"
              px={8}
              borderRadius="xl"
              fontWeight="bold"
              fontSize="sm"
              leftIcon={<Icon as={FiSquare} boxSize={4} />}
              isLoading={isLoading}
              loadingText="Recording Punch..."
              onClick={onCheckOut}
              borderWidth="1.5px"
              _hover={{ bg: 'red.50' }}
            >
              Clock Out
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}

