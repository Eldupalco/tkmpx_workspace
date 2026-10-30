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
import { useEffect, useState } from 'react';
import { FiDownload, FiRefreshCw, FiRotateCcw, FiSearch } from 'react-icons/fi';
import { useAuth } from '@/features/auth';
import {
  AttendanceTable,
  downloadAttendanceCsv,
  PaginationMeta,
  StatusFilter,
  useAttendanceHistory,
} from '@/features/attendance';
import { Pagination, DateRangePopover } from '@/components';

export function PunchHistorySection() {

  const { user, token } = useAuth();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Search runs 300ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const hasActiveFilters = Boolean(searchTerm || statusFilter !== 'all' || startDate || endDate);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Exports the same date range shown in the table
  const handleExportCsv = () => {
    if (!token || !user) return;
    downloadAttendanceCsv(token, {
      userId: user.id,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const historyQuery = useAttendanceHistory({
    page,
    limit,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const records = historyQuery.data?.data ?? [];
  const meta: PaginationMeta = historyQuery.data?.meta ?? { total: 0, page: 1, limit, totalPages: 1 };
  const loading = historyQuery.isPending;

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

        <HStack spacing={2} flexShrink={0}>
          <Button
            size="sm"
            variant="outline"
            fontSize="xs"
            leftIcon={<Icon as={FiDownload} boxSize={3} color="slate.500" />}
            onClick={handleExportCsv}
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            fontSize="xs"
            leftIcon={<Icon as={FiRefreshCw} boxSize={3} color="slate.500" />}
            onClick={() => historyQuery.refetch()}
            isLoading={historyQuery.isRefetching}
          >
            Refresh
          </Button>
        </HStack>
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
              setStatusFilter(e.target.value as StatusFilter);
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
