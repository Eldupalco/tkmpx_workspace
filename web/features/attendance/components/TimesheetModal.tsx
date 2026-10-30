'use client';

import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  IconButton,
  Tooltip,
  SimpleGrid,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  TableContainer,
  HStack,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Icon,
} from '@chakra-ui/react';
import { TimesheetData, TimesheetRecord } from '../types';
import { FiSearch, FiRotateCcw } from 'react-icons/fi';

interface TimesheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  timesheetData: TimesheetData | null;
  isLoading: boolean;
}

export function TimesheetModal({
  isOpen,
  onClose,
  timesheetData,
  isLoading,
}: TimesheetModalProps) {
  const summary = timesheetData?.summary;
  const rawRecords = timesheetData?.records || [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRecords = useMemo(() => {
    return rawRecords.filter((r) => {
      const matchesSearch = !search.trim() || r.date.toLowerCase().includes(search.trim().toLowerCase());
      const rStatus = r.status.toLowerCase();
      const fStatus = statusFilter.toLowerCase();
      const matchesStatus =
        fStatus === 'all' ||
        (fStatus === 'leave' || fStatus === 'on_leave'
          ? rStatus === 'leave' || rStatus === 'on_leave'
          : rStatus === fStatus);
      return matchesSearch && matchesStatus;
    });
  }, [rawRecords, search, statusFilter]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <ModalContent maxW="720px" borderRadius="2xl" p={2}>
        <ModalHeader pb={1}>
          <Box>
            <Text fontSize="md" fontWeight="bold" color="slate.900">
              Timesheet & Overtime Analysis
            </Text>
            <Text fontSize="xs" color="slate.500" fontWeight="normal">
              Monthly worked hours, daily averages and overtime calculation
            </Text>
          </Box>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody py={4}>
          {isLoading ? (
            <Text py={8} textAlign="center" color="slate.400" fontSize="sm">
              Calculating work hours & timesheet records...
            </Text>
          ) : !summary ? (
            <Text py={8} textAlign="center" color="slate.400" fontSize="sm">
              No timesheet sessions recorded yet.
            </Text>
          ) : (
            <Box>
              <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3} mb={5}>
                <Box p={3.5} bg="slate.50" border="1px solid" borderColor="slate.200" borderRadius="xl">
                  <Text fontSize="10px" fontWeight="bold" textTransform="uppercase" color="slate.400">
                    Total Hours
                  </Text>
                  <Text fontSize="xl" fontWeight="extrabold" color="slate.900" mt={1}>
                    {summary.totalHours} hrs
                  </Text>
                </Box>
                <Box p={3.5} bg="emerald.50" border="1px solid" borderColor="emerald.100" borderRadius="xl">
                  <Text fontSize="10px" fontWeight="bold" textTransform="uppercase" color="emerald.600">
                    Days Worked
                  </Text>
                  <Text fontSize="xl" fontWeight="extrabold" color="emerald.800" mt={1}>
                    {summary.daysWorked} days
                  </Text>
                </Box>
                <Box p={3.5} bg="amber.50" border="1px solid" borderColor="amber.100" borderRadius="xl">
                  <Text fontSize="10px" fontWeight="bold" textTransform="uppercase" color="amber.600">
                    Overtime
                  </Text>
                  <Text fontSize="xl" fontWeight="extrabold" color="amber.800" mt={1}>
                    +{summary.overtimeHours} hrs
                  </Text>
                </Box>
                <Box p={3.5} bg="purple.50" border="1px solid" borderColor="purple.100" borderRadius="xl">
                  <Text fontSize="10px" fontWeight="bold" textTransform="uppercase" color="purple.600">
                    Daily Average
                  </Text>
                  <Text fontSize="xl" fontWeight="extrabold" color="purple.800" mt={1}>
                    {summary.averageHoursPerDay} hrs
                  </Text>
                </Box>
              </SimpleGrid>

              <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
                <Text fontSize="xs" fontWeight="semibold" color="slate.600">
                  Daily Work Sessions ({filteredRecords.length} of {rawRecords.length})
                </Text>

                <HStack spacing={2}>
                  <Select
                    size="xs"
                    borderRadius="lg"
                    maxW="110px"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    bg="slate.50"
                    borderColor="slate.200"
                    fontSize="xs"
                  >
                    <option value="all">All</option>
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="leave">Leave</option>
                  </Select>

                  <InputGroup size="xs" maxW="150px">
                    <InputLeftElement pointerEvents="none">
                      <Icon as={FiSearch} color="slate.400" boxSize={3} />
                    </InputLeftElement>
                    <Input
                      placeholder="Search date..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      borderRadius="lg"
                      bg="slate.50"
                      borderColor="slate.200"
                      fontSize="xs"
                      _focus={{ bg: 'white', borderColor: 'brand.500' }}
                    />
                  </InputGroup>

                  {(search || statusFilter !== 'all') && (
                    <Tooltip label="Reset filters" fontSize="xs" bg="slate.900" color="white" borderRadius="md" px={2} py={1} hasArrow>
                      <IconButton
                        size="xs"
                        h="24px"
                        w="24px"
                        minW="24px"
                        variant="ghost"
                        colorScheme="slate"
                        color="slate.500"
                        _hover={{ bg: 'slate.100', color: 'slate.800' }}
                        borderRadius="md"
                        aria-label="Reset filters"
                        icon={<Icon as={FiRotateCcw} boxSize={3} />}
                        onClick={() => {
                          setSearch('');
                          setStatusFilter('all');
                        }}
                      />
                    </Tooltip>
                  )}
                </HStack>
              </Flex>

              <TableContainer maxH="280px" overflowY="auto" border="1px solid" borderColor="slate.200" borderRadius="xl">
                <Table size="sm" variant="simple">
                  <Thead bg="slate.50" position="sticky" top={0} zIndex={1}>
                    <Tr>
                      <Th py={2.5} fontSize="10px" color="slate.500" fontWeight="700">DATE</Th>
                      <Th py={2.5} fontSize="10px" color="slate.500" fontWeight="700">HOURS WORKED</Th>
                      <Th py={2.5} fontSize="10px" color="slate.500" fontWeight="700">OVERTIME (&gt;8H)</Th>
                      <Th py={2.5} fontSize="10px" color="slate.500" fontWeight="700">LATE / UNDERTIME</Th>
                      <Th py={2.5} fontSize="10px" color="slate.500" fontWeight="700">STATUS</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredRecords.length === 0 ? (
                      <Tr>
                        <Td colSpan={5} textAlign="center" py={6} color="slate.400" fontSize="xs">
                          No sessions match filter criteria
                        </Td>
                      </Tr>
                    ) : (
                      filteredRecords.map((r: TimesheetRecord) => (
                        <Tr key={r.id} _hover={{ bg: 'slate.50' }} transition="background 0.15s ease">
                          <Td py={3} fontWeight="600" color="slate.800" fontSize="xs">
                            {r.date}
                          </Td>
                          <Td py={3} fontSize="xs" color="slate.700" fontFamily="mono">
                            {r.hoursWorked > 0 ? `${r.hoursWorked} hrs` : '—'}
                          </Td>
                          <Td py={3}>
                            {r.overtime > 0 ? (
                              <Badge colorScheme="amber" variant="subtle" fontSize="10px" borderRadius="full">
                                +{r.overtime} hrs
                              </Badge>
                            ) : (
                              <Text as="span" color="slate.300">—</Text>
                            )}
                          </Td>
                          <Td py={3} fontSize="xs" fontFamily="mono" color={r.lateMinutes || r.undertimeMinutes ? 'amber.700' : 'slate.300'}>
                            {r.lateMinutes || r.undertimeMinutes ? `${r.lateMinutes} / ${r.undertimeMinutes} min` : '—'}
                          </Td>
                          <Td py={3}>
                            <Badge
                              colorScheme={
                                r.status === 'present'
                                  ? 'green'
                                  : r.status === 'late'
                                    ? 'orange'
                                    : 'purple'
                              }
                              variant="subtle"
                              fontSize="10px"
                              borderRadius="full"
                            >
                              {r.status.toUpperCase()}
                            </Badge>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </ModalBody>
        <ModalFooter pt={2}>
          <Button variant="ghost" size="sm" borderRadius="lg" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

