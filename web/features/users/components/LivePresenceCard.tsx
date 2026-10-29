'use client';

import React from 'react';
import {
  Box,
  Heading,
  Text,
  HStack,
  Avatar,
  Badge,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { Attendance } from '@/features/attendance/types';
import { FiClock } from 'react-icons/fi';

interface LivePresenceCardProps {
  currentlyInList: Attendance[];
}

export function LivePresenceCard({ currentlyInList }: LivePresenceCardProps) {
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
          <HStack spacing={2} align="center">
            <Heading size="xs" color="slate.900" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
              Live On-Site Presence
            </Heading>
            <Badge colorScheme="green" variant="subtle" borderRadius="full" px={2} py={0} fontSize="9px">
              LIVE
            </Badge>
          </HStack>
          <Text fontSize="xs" color="slate.500" mt={0.5}>
            Employees currently clocked in and working on-site today
          </Text>
        </Box>

        <HStack spacing={1.5} bg="slate.100" px={2.5} py={1} borderRadius="md">
          <Text fontSize="xs" fontWeight="bold" color="slate.700">
            {currentlyInList.length} Active Now
          </Text>
        </HStack>
      </HStack>

      {currentlyInList.length === 0 ? (
        <Box
          p={6}
          textAlign="center"
          bg="slate.50"
          borderRadius="lg"
          border="1px dashed"
          borderColor="slate.200"
        >
          <Text fontSize="xs" color="slate.400">
            No employees currently clocked in today.
          </Text>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={3}>
          {currentlyInList.map((item) => (
            <HStack
              key={item.id}
              p={3}
              bg="slate.50"
              border="1px solid"
              borderColor="slate.200"
              borderRadius="lg"
              spacing={3}
            >
              <Avatar
                size="sm"
                name={item.users?.name || item.userId}
                bg="brand.600"
                color="white"
                fontWeight="bold"
              />
              <Box flex="1" overflow="hidden">
                <Text fontSize="xs" fontWeight="bold" color="slate.800" noOfLines={1}>
                  {item.users?.name || item.userId}
                </Text>
                <HStack spacing={1} mt={0.5}>
                  <Icon as={FiClock} boxSize={3} color="slate.400" />
                  <Text fontSize="10px" color="slate.500" fontFamily="mono">
                    {item.pmIn ? 'Afternoon in' : 'Morning in'} at{' '}
                    {new Date((item.pmIn ?? item.amIn) as string).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </HStack>
              </Box>
            </HStack>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}

