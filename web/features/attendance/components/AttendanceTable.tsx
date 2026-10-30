'use client';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Box,
  Text,
  Button,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { formatAppDateKey, formatAppTime } from '@/lib/date-time';
import { Attendance } from '../types';
import { FiCalendar } from 'react-icons/fi';

interface AttendanceTableProps {
  records: Attendance[];
  /** Admin override: record the employee's next punch (today's rows only) */
  onPunch?: (record: Attendance) => void;
}

const LEAVE_STATUSES = ['on_leave', 'leave'];

/** Label of the next punch for a row, or null when the day is complete */
function nextPunchLabel(r: Attendance): string | null {
  // Shift without a lunch break: single Time In / Time Out session
  if (r.schedules && r.schedules.breakStart === null) {
    if (!r.amIn) return 'Time In';
    if (!r.amOut) return 'Time Out';
    return null;
  }
  if (!r.amIn && !r.pmIn) return 'Punch In';
  if (r.amIn && !r.amOut && !r.pmIn) return 'Morning Out';
  if (!r.pmIn) return 'Afternoon In';
  if (!r.pmOut) return 'Afternoon Out';
  return null;
}

function hoursWorked(r: Attendance): number {
  const span = (from?: string | null, to?: string | null) =>
    from && to ? Math.max(0, new Date(to).getTime() - new Date(from).getTime()) : 0;
  return Number(((span(r.amIn, r.amOut) + span(r.pmIn, r.pmOut)) / 3_600_000).toFixed(2));
}

export function AttendanceTable({ records, onPunch }: AttendanceTableProps) {
  // Philippine business date as YYYY-MM-DD
  const today = formatAppDateKey(new Date());
  if (records.length === 0) {
    return (
      <Box
        p={12}
        textAlign="center"
        bg="slate.50"
        borderRadius="xl"
        border="1px dashed"
        borderColor="slate.200"
      >
        <Box
          w="40px"
          h="40px"
          borderRadius="xl"
          bg="slate.100"
          color="slate.400"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mx="auto"
          mb={3}
        >
          <Icon as={FiCalendar} boxSize={5} />
        </Box>
        <Text fontWeight="bold" fontSize="sm" color="slate.700">
          No attendance records found
        </Text>
        <Text fontSize="xs" color="slate.400" mt={1}>
          Punches and attendance sessions will automatically appear here.
        </Text>
      </Box>
    );
  }

  const renderStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return (
          <HStack spacing={1.5} bg="emerald.50" px={2.5} py={0.5} borderRadius="full" w="fit-content">
            <Box w="6px" h="6px" borderRadius="full" bg="emerald.500" />
            <Text fontSize="11px" fontWeight="bold" color="emerald.700" textTransform="uppercase">
              Present
            </Text>
          </HStack>
        );
      case 'late':
        return (
          <HStack spacing={1.5} bg="amber.50" px={2.5} py={0.5} borderRadius="full" w="fit-content">
            <Box w="6px" h="6px" borderRadius="full" bg="amber.500" />
            <Text fontSize="11px" fontWeight="bold" color="amber.700" textTransform="uppercase">
              Late
            </Text>
          </HStack>
        );
      case 'half_day':
        return (
          <HStack spacing={1.5} bg="blue.50" px={2.5} py={0.5} borderRadius="full" w="fit-content">
            <Box w="6px" h="6px" borderRadius="full" bg="blue.500" />
            <Text fontSize="11px" fontWeight="bold" color="blue.700" textTransform="uppercase">
              Half Day
            </Text>
          </HStack>
        );
      case 'on_leave':
      case 'leave':
        return (
          <HStack spacing={1.5} bg="purple.50" px={2.5} py={0.5} borderRadius="full" w="fit-content">
            <Box w="6px" h="6px" borderRadius="full" bg="purple.500" />
            <Text fontSize="11px" fontWeight="bold" color="purple.700" textTransform="uppercase">
              On Leave
            </Text>
          </HStack>
        );
      case 'absent':
        return (
          <HStack spacing={1.5} bg="red.50" px={2.5} py={0.5} borderRadius="full" w="fit-content">
            <Box w="6px" h="6px" borderRadius="full" bg="red.500" />
            <Text fontSize="11px" fontWeight="bold" color="red.700" textTransform="uppercase">
              Absent
            </Text>
          </HStack>
        );
      default:
        return (
          <Badge variant="subtle" colorScheme="gray" px={2} py={0.5} borderRadius="full" fontSize="10px">
            {status.toUpperCase()}
          </Badge>
        );
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return <Text as="span" color="slate.300">—</Text>;
    try {
      const d = new Date(timeStr);
      return (
        <Text as="span" fontWeight="600" color="slate.800" fontFamily="mono" fontSize="xs">
          {formatAppTime(d)}
        </Text>
      );
    } catch {
      return timeStr;
    }
  };

  return (
    <TableContainer border="1px solid" borderColor="slate.200" borderRadius="xl">
      <Table variant="simple" size="sm">
        <Thead bg="slate.50">
          <Tr>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              DATE
            </Th>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              EMPLOYEE
            </Th>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              AM IN
            </Th>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              AM OUT
            </Th>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              PM IN
            </Th>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              PM OUT
            </Th>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              HOURS
            </Th>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              LATE / UT
            </Th>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              STATUS
            </Th>
            <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em">
              NOTES
            </Th>
            {onPunch && (
              <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" letterSpacing="0.05em" isNumeric>
                ACTION
              </Th>
            )}
          </Tr>
        </Thead>
        <Tbody>
          {records.map((item) => (
            <Tr key={item.id} _hover={{ bg: 'slate.50' }} transition="background 0.15s ease">
              <Td py={3.5} fontWeight="semibold" color="slate.900" fontSize="xs">
                {item.date}
              </Td>
              <Td py={3.5}>
                <Box>
                  <Text fontSize="xs" fontWeight="bold" color="slate.800" lineHeight="tight">
                    {item.users?.name || item.userId}
                  </Text>
                  {item.users?.email && (
                    <Text fontSize="10px" color="slate.500" mt={0.5}>
                      {item.users.email}
                    </Text>
                  )}
                </Box>
              </Td>
              <Td py={3.5}>{formatTime(item.amIn)}</Td>
              <Td py={3.5}>{formatTime(item.amOut)}</Td>
              <Td py={3.5}>{formatTime(item.pmIn)}</Td>
              <Td py={3.5}>{formatTime(item.pmOut)}</Td>
              <Td py={3.5} fontFamily="mono" fontSize="xs" color="slate.800">
                {hoursWorked(item) > 0 ? `${hoursWorked(item)} h` : <Text as="span" color="slate.300">—</Text>}
              </Td>
              <Td py={3.5} fontSize="xs">
                {item.lateMinutes > 0 || item.undertimeMinutes > 0 ? (
                  <Text as="span" color="amber.700" fontWeight="600">
                    {item.lateMinutes} / {item.undertimeMinutes} min
                  </Text>
                ) : (
                  <Text as="span" color="slate.300">—</Text>
                )}
              </Td>
              <Td py={3.5}>{renderStatus(item.status)}</Td>
              <Td py={3.5} color="slate.500" fontSize="xs" maxW="200px" isTruncated>
                {item.notes || <Text as="span" color="slate.300">—</Text>}
              </Td>
              {onPunch && (
                <Td py={3.5} isNumeric>
                  {item.date === today && !LEAVE_STATUSES.includes(item.status) && nextPunchLabel(item) ? (
                    <Button
                      size="xs"
                      colorScheme="brand"
                      variant="outline"
                      borderRadius="md"
                      fontSize="11px"
                      h="26px"
                      onClick={() => onPunch(item)}
                    >
                      {nextPunchLabel(item)}
                    </Button>
                  ) : (
                    <Badge colorScheme="slate" variant="subtle" fontSize="10px" borderRadius="full">
                      {nextPunchLabel(item) ? 'Closed' : 'Completed'}
                    </Badge>
                  )}
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

