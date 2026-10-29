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
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import {
  FiUserPlus,
  FiSearch,
  FiRotateCcw,
  FiCalendar,
  FiEdit2,
  FiTrash2,
} from 'react-icons/fi';
import { User } from '@/features/auth';
import { Pagination } from '@/components';

interface TeamRosteringTabProps {
  usersCount: number;
  filteredUsers: User[];
  paginatedUsers: User[];
  teamSearchTerm: string;
  setTeamSearchTerm: (val: string) => void;
  teamRoleFilter: string;
  setTeamRoleFilter: (val: string) => void;
  teamPage: number;
  setTeamPage: (p: number) => void;
  teamLimit: number;
  setTeamLimit: (l: number) => void;
  teamTotalPages: number;
  resetFilters: () => void;
  onOpenCreateUser: () => void;
  onOpenEditUser: (user: User) => void;
  onDeleteUser: (id: string, name: string) => void;
  onManageShifts: (user: User) => void;
}

export function TeamRosteringTab({
  usersCount,
  filteredUsers,
  paginatedUsers,
  teamSearchTerm,
  setTeamSearchTerm,
  teamRoleFilter,
  setTeamRoleFilter,
  teamPage,
  setTeamPage,
  teamLimit,
  setTeamLimit,
  teamTotalPages,
  resetFilters,
  onOpenCreateUser,
  onOpenEditUser,
  onDeleteUser,
  onManageShifts,
}: TeamRosteringTabProps) {
  const hasActiveFilters = Boolean(teamSearchTerm || teamRoleFilter !== 'all');

  return (
    <Box p={6} bg="white" border="1px solid" borderColor="slate.200" borderRadius="xl" shadow="xs">
      {/* Row 1: Header Title & Add Employee Action */}
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
              Team Members & Shift Rostering
            </Heading>
            <Badge variant="subtle" bg="slate.100" color="slate.700" borderRadius="full" px={2} py={0.2} fontSize="10px">
              {usersCount} Total
            </Badge>
          </HStack>
          <Text fontSize="xs" color="slate.500" mt={1}>
            Manage employee profiles, role permissions, and assign recurring weekly shifts
          </Text>
        </Box>

        <Button
          size="sm"
          colorScheme="brand"
          bg="brand.600"
          borderRadius="lg"
          fontSize="xs"
          fontWeight="semibold"
          leftIcon={<Icon as={FiUserPlus} boxSize={3.5} />}
          onClick={onOpenCreateUser}
          _hover={{ bg: 'brand.700' }}
          flexShrink={0}
        >
          Add Employee
        </Button>
      </Flex>

      {/* Row 2: Search & Filter Toolbar */}
      <Box pt={3} pb={4} borderTop="1px solid" borderColor="slate.100">
        <HStack spacing={2.5} flexWrap="wrap">
          {/* Search Employee Input */}
          <InputGroup size="sm" w={{ base: '100%', sm: '260px' }}>
            <InputLeftElement pointerEvents="none">
              <Icon as={FiSearch} color="slate.400" boxSize={3.5} />
            </InputLeftElement>
            <Input
              placeholder="Search employee by name or email..."
              value={teamSearchTerm}
              onChange={(e) => {
                setTeamSearchTerm(e.target.value);
                setTeamPage(1);
              }}
              borderRadius="lg"
              bg="slate.50"
              borderColor="slate.200"
              fontSize="xs"
              _focus={{ bg: 'white', borderColor: 'brand.500' }}
            />
          </InputGroup>

          {/* Role Filter */}
          <Select
            size="sm"
            borderRadius="lg"
            w="130px"
            value={teamRoleFilter}
            onChange={(e) => {
              setTeamRoleFilter(e.target.value);
              setTeamPage(1);
            }}
            bg="slate.50"
            borderColor="slate.200"
            fontSize="xs"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">Staff (User)</option>
          </Select>

          {/* Reset Button */}
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

      {/* Row 3: Table or Empty State */}
      {filteredUsers.length === 0 ? (
        <Box p={8} textAlign="center" bg="slate.50" borderRadius="xl" border="1px dashed" borderColor="slate.200">
          <Text fontWeight="bold" fontSize="sm" color="slate.700">
            No team members found
          </Text>
          <Text fontSize="xs" color="slate.400" mt={1}>
            No employee profiles match the selected search query or role filter.
          </Text>
          {hasActiveFilters && (
            <Button size="xs" mt={3} variant="outline" borderColor="slate.200" bg="white" color="slate.700" onClick={resetFilters}>
              Clear Filters
            </Button>
          )}
        </Box>
      ) : (
        <>
          <TableContainer border="1px solid" borderColor="slate.200" borderRadius="xl">
            <Table size="sm" variant="simple">
              <Thead bg="slate.50">
                <Tr>
                  <Th py={3} fontSize="10px" fontWeight="700" color="slate.500">EMPLOYEE</Th>
                  <Th py={3} fontSize="10px" fontWeight="700" color="slate.500">ROLE</Th>
                  <Th py={3} fontSize="10px" fontWeight="700" color="slate.500">EMAIL</Th>
                  <Th py={3} fontSize="10px" fontWeight="700" color="slate.500" isNumeric>ACTIONS</Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedUsers.map((u) => (
                  <Tr key={u.id} _hover={{ bg: 'slate.50' }} transition="background 0.15s ease">
                    <Td py={3.5} fontWeight="bold" fontSize="xs" color="slate.900">
                      {u.name}
                    </Td>
                    <Td py={3.5}>
                      <Badge
                        variant="subtle"
                        bg={u.role === 'admin' ? 'purple.50' : 'slate.100'}
                        color={u.role === 'admin' ? 'purple.700' : 'slate.700'}
                        fontSize="10px"
                        borderRadius="full"
                        px={2}
                        textTransform="uppercase"
                      >
                        {u.role}
                      </Badge>
                    </Td>
                    <Td py={3.5} fontSize="xs" color="slate.600">
                      {u.email}
                    </Td>
                    <Td py={3.5} isNumeric>
                      <HStack spacing={1.5} justify="flex-end">
                        <Button
                          size="xs"
                          variant="outline"
                          bg="white"
                          borderColor="slate.200"
                          color="slate.700"
                          _hover={{ bg: 'slate.50', borderColor: 'slate.300', color: 'slate.900' }}
                          borderRadius="md"
                          leftIcon={<Icon as={FiCalendar} boxSize={3} color="brand.600" />}
                          onClick={() => onManageShifts(u)}
                        >
                          Shifts
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="slate"
                          borderRadius="md"
                          onClick={() => onOpenEditUser(u)}
                          aria-label="Edit employee"
                        >
                          <Icon as={FiEdit2} boxSize={3} />
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          borderRadius="md"
                          onClick={() => onDeleteUser(u.id, u.name)}
                          aria-label="Delete employee"
                        >
                          <Icon as={FiTrash2} boxSize={3} color="red.500" />
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>

          <Pagination
            page={teamPage}
            totalPages={teamTotalPages}
            total={filteredUsers.length}
            limit={teamLimit}
            onPageChange={setTeamPage}
            onLimitChange={(newLimit) => {
              setTeamLimit(newLimit);
              setTeamPage(1);
            }}
          />
        </>
      )}
    </Box>
  );
}
