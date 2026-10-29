'use client';

import {
  Box,
  Flex,
  Avatar,
  Text,
  HStack,
  Badge,
  Button,
  useDisclosure,
  Container,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Icon,
} from '@chakra-ui/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { ProfileModal } from '@/features/users';
import {
  FiLogOut,
  FiChevronDown,
  FiSettings,
  FiCheck,
} from 'react-icons/fi';

interface NavbarProps {
  isLiveApi?: boolean;
}

export function Navbar({ isLiveApi = true }: NavbarProps) {

  const { user, token, logout, updateUser } = useAuth();
  const pathname = usePathname();
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isAdminView = pathname.startsWith('/admin');

  return (
    <>
      <Box
        as="header"
        bg="white"
        borderBottom="1px solid"
        borderColor="slate.200"
        position="sticky"
        top={0}
        zIndex="sticky"
      >
        <Container maxW="1200px">
          <Flex h="64px" justify="space-between" align="center" gap={3}>
            {/* Left: Brand Identity & Contextual Breadcrumb Switcher */}
            <Box>
              <HStack spacing={1.5} align="center">
                <Text fontSize="sm" fontWeight="extrabold" color="slate.900" letterSpacing="-0.02em">
                  TKPEX
                </Text>
                <Text fontSize="sm" color="slate.300" fontWeight="normal">
                  /
                </Text>

                {isAdmin ? (
                  <Menu placement="bottom-start">
                    <MenuButton
                      as={Button}
                      variant="ghost"
                      size="xs"
                      px={2}
                      py={1}
                      h="auto"
                      borderRadius="md"
                      fontWeight="semibold"
                      color="slate.700"
                      _hover={{ bg: 'slate.100', color: 'slate.900' }}
                      _active={{ bg: 'slate.200' }}
                      rightIcon={<Icon as={FiChevronDown} boxSize={3} color="slate.400" />}
                    >
                      {isAdminView ? 'Admin Operations' : 'Personal Workspace'}
                    </MenuButton>
                    <MenuList
                      shadow="lg"
                      borderColor="slate.200"
                      borderRadius="xl"
                      py={1.5}
                      minW="230px"
                      fontSize="xs"
                    >
                      <Box px={3} py={1.5}>
                        <Text
                          fontSize="10px"
                          fontWeight="bold"
                          color="slate.400"
                          textTransform="uppercase"
                          letterSpacing="0.05em"
                        >
                          Switch Workspace
                        </Text>
                      </Box>
                      <MenuItem
                        as={Link}
                        href="/admin/dashboard"
                        py={2}
                        px={3}
                        bg={isAdminView ? 'slate.50' : 'transparent'}
                      >
                        <Flex justify="space-between" align="center" w="full">
                          <Box>
                            <Text fontWeight={isAdminView ? 'bold' : 'medium'} color="slate.900">
                              Admin Operations
                            </Text>
                            <Text fontSize="11px" color="slate.500">
                              Company attendance & shift roster
                            </Text>
                          </Box>
                          {isAdminView && <Icon as={FiCheck} color="brand.600" boxSize={4} />}
                        </Flex>
                      </MenuItem>

                      <MenuItem
                        as={Link}
                        href="/employee/dashboard"
                        py={2}
                        px={3}
                        bg={!isAdminView ? 'slate.50' : 'transparent'}
                      >
                        <Flex justify="space-between" align="center" w="full">
                          <Box>
                            <Text fontWeight={!isAdminView ? 'bold' : 'medium'} color="slate.900">
                              Personal Workspace
                            </Text>
                            <Text fontSize="11px" color="slate.500">
                              My punch clock, timesheet & leave
                            </Text>
                          </Box>
                          {!isAdminView && <Icon as={FiCheck} color="brand.600" boxSize={4} />}
                        </Flex>
                      </MenuItem>
                    </MenuList>
                  </Menu>
                ) : (
                  <Text fontSize="xs" color="slate.500" fontWeight="medium">
                    Personal Workspace
                  </Text>
                )}
              </HStack>

              <HStack spacing={1.5} mt={0.5}>
                <Box
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg={isLiveApi ? 'emerald.500' : 'amber.500'}
                  boxShadow={isLiveApi ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none'}
                />
                <Text
                  fontSize="10px"
                  fontWeight="semibold"
                  color="slate.500"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {isLiveApi ? 'System Online' : 'Offline'}
                </Text>
              </HStack>
            </Box>

            {/* Right: User Profile Menu */}
            <HStack spacing={2}>
              <Menu placement="bottom-end">
                <MenuButton
                  as={Button}
                  variant="ghost"
                  p={1.5}
                  h="auto"
                  borderRadius="xl"
                  _hover={{ bg: 'slate.50' }}
                  _active={{ bg: 'slate.100' }}
                >
                  <HStack spacing={2.5}>
                    <Avatar
                      name={user.name}
                      size="sm"
                      bg="brand.600"
                      color="white"
                      fontWeight="bold"
                    />
                    <Box textAlign="left" display={{ base: 'none', md: 'block' }}>
                      <Text fontSize="xs" fontWeight="bold" color="slate.800" lineHeight="tight">
                        {user.name}
                      </Text>
                      <HStack spacing={1} mt={0.5}>
                        <Badge
                          variant="subtle"
                          bg="slate.100"
                          color="slate.600"
                          fontSize="9px"
                          borderRadius="full"
                          px={1.5}
                          py={0}
                          fontWeight="bold"
                          textTransform="uppercase"
                        >
                          {user.role}
                        </Badge>
                      </HStack>
                    </Box>
                    <Icon as={FiChevronDown} boxSize={3.5} color="slate.400" />
                  </HStack>
                </MenuButton>

                <MenuList
                  shadow="lg"
                  borderColor="slate.200"
                  borderRadius="xl"
                  py={1.5}
                  minW="210px"
                  fontSize="xs"
                >
                  <Box px={3} py={2}>
                    <Text fontSize="xs" fontWeight="bold" color="slate.800">
                      {user.name}
                    </Text>
                    <Text fontSize="11px" color="slate.500" noOfLines={1}>
                      {user.email}
                    </Text>
                  </Box>

                  <MenuDivider my={1} borderColor="slate.100" />

                  <MenuItem
                    icon={<Icon as={FiSettings} boxSize={4} color="slate.500" />}
                    onClick={onOpen}
                  >
                    Account Settings
                  </MenuItem>

                  <MenuDivider my={1} borderColor="slate.100" />

                  <MenuItem
                    icon={<Icon as={FiLogOut} boxSize={4} color="red.500" />}
                    color="red.600"
                    fontWeight="semibold"
                    onClick={logout}
                  >
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Account Settings Modal */}
      {token && (
        <ProfileModal
          isOpen={isOpen}
          onClose={onClose}
          user={user}
          token={token}
          onProfileUpdated={(updated) => updateUser(updated)}
        />
      )}
    </>
  );
}
