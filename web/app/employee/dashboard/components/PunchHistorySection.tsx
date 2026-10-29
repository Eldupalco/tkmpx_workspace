'use client';

import {
  Box,
  Flex,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Tooltip,
  IconButton,
  Skeleton,
} from '@chakra-ui/react';
import { FiRefreshCw, FiRotateCcw, FiSearch } from 'react-icons/fi';
import { Attendance, PaginationMeta, AttendanceTable } from '@/features/attendance';
import { Pagination, DateRangePopover } from '@/components';

interface PunchHistorySectionProps {
  records: Attendance[];
  meta: PaginationMeta;
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  setPage: (p: number) => void;
  setLimit: (l: number) => void;
  resetFilters: () => void;
  onRefresh: () => void;
}

export function PunchHistorySection({
  records,
  meta,
  loading,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  setPage,
  setLimit,
  resetFilters,
  onRefresh,
}: PunchHistorySectionProps) {
  const hasActiveFilters = Boolean(searchTerm || statusFilter !== 'all' || startDate || endDate);

  return (
    <Box p={6} bg="white" border="1px solid" borderColor="slate.200" borderRadius="xl" shadow="xs">
      {/* Row 1: Header Title & Refresh Action */}
      <Flex
        justify="space-between"
        align={{ base: 'flex-start', sm: 'center' }}
        direction={{ base: 'column', sm: 'row' }}
        gap={3}
        mb={4}
      >
        <Box>
          <HStack spacing={2} align="center">
            <Heading size="xs" color="slate.900" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em">
              Personal Punch History
            </Heading>
            <Badge variant="subtle" bg="slate.100" color="slate.700" borderRadius="full" px={2} py={0.2} fontSize="10px">
              {meta.total} Records
            </Badge>
          </HStack>
          <Text fontSize="xs" color="slate.500" mt={1}>
            Filter by status, date range, or search shift notes
          </Text>
        </Box>

        <Button
          size="sm"
          variant="outline"
          bg="white"
          borderColor="slate.200"
          color="slate.700"
          borderRadius="lg"
          fontSize="xs"
          leftIcon={<Icon as={FiRefreshCw} boxSize={3} color="slate.500" />}
          onClick={onRefresh}
          flexShrink={0}
        >
          Refresh
        </Button>
      </Flex>

      {/* Row 2: Search & Filter Toolbar */}
      <Box pt={3} pb={4} borderTop="1px solid" borderColor="slate.100">
        <HStack spacing={2.5} flexWrap="wrap" align="center">
          {/* Search Input */}
          <InputGroup size="sm" w={{ base: '100%', sm: '220px' }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="slate.400" boxSize={3.5} />
            </InputLeftElement>
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="lg"
              bg="slate.50"
              borderColor="slate.200"
              fontSize="xs"
              _focus={{ bg: 'white', borderColor: 'brand.500' }}
            />
          </InputGroup>

          {/* Status Filter */}
          <Select
            size="sm"
            borderRadius="lg"
            w="130px"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            bg="slate.50"
            borderColor="slate.200"
            fontSize="xs"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="on_leave">On Leave</option>
            <option value="absent">Absent</option>
          </Select>

          {/* Date Range Popover */}
          <DateRangePopover
            startDate={startDate}
            endDate={endDate}
            onChange={({ startDate: s, endDate: e }) => {
              setStartDate(s);
              setEndDate(e);
              setPage(1);
            }}
          />

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <Tooltip label="Reset filters" fontSize="xs" bg="slate.900" color="white" borderRadius="md" px={2} py={1} hasArrow>
              <IconButton
                size="sm"
                h="32px"
                w="32px"
                minW="32px"
                variant="ghost"
                colorScheme="slate"
                color="slate.500"
                _hover={{ bg: 'slate.100', color: 'slate.800' }}
                borderRadius="lg"
                aria-label="Reset filters"
                icon={<Icon as={FiRotateCcw} boxSize={3.5} />}
                onClick={resetFilters}
              />
            </Tooltip>
          )}
        </HStack>
      </Box>

      {/* Row 3: Records Table & Pagination */}
      {loading ? (
        <Box py={4}>
          <Skeleton h="36px" mb={2} borderRadius="lg" />
          <Skeleton h="36px" mb={2} borderRadius="lg" />
          <Skeleton h="36px" mb={2} borderRadius="lg" />
        </Box>
      ) : (
        <>
          <AttendanceTable records={records} />
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            limit={meta.limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }}
          />
        </>
      )}
    </Box>
  );
}
