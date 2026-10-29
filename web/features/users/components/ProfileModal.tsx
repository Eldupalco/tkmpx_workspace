'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Box,
  Text,
} from '@chakra-ui/react';
import { updateProfile, changePassword } from '@/features/auth/api/auth.api';
import { User } from '@/features/auth/types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  token: string;
  onProfileUpdated: (updated: User) => void;
}

export function ProfileModal({
  isOpen,
  onClose,
  user,
  token,
  onProfileUpdated,
}: ProfileModalProps) {
  const toast = useToast();

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const updated = await updateProfile(token, { name, email });
      toast({
        title: 'Profile updated!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onProfileUpdated(updated);
      onClose();
    } catch (err: any) {
      toast({
        title: 'Profile update failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      await changePassword(token, { currentPassword, newPassword });
      toast({
        title: 'Password changed successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setCurrentPassword('');
      setNewPassword('');
      onClose();
    } catch (err: any) {
      toast({
        title: 'Password change failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" p={2}>
        <ModalHeader pb={1}>
          <Box>
            <Text fontSize="md" fontWeight="bold" color="slate.900">
              Account & Security Settings
            </Text>
            <Text fontSize="xs" color="slate.500" fontWeight="normal">
              Manage your credentials and security profile
            </Text>
          </Box>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody py={4}>
          <Tabs isFitted variant="enclosed" colorScheme="brand">
            <TabList mb="1em" borderColor="slate.200">
              <Tab fontSize="xs" fontWeight="bold" borderRadius="lg" _selected={{ bg: 'white', color: 'brand.600', borderColor: 'slate.200', borderBottomColor: 'white' }}>
                Profile Details
              </Tab>
              <Tab fontSize="xs" fontWeight="bold" borderRadius="lg" _selected={{ bg: 'white', color: 'brand.600', borderColor: 'slate.200', borderBottomColor: 'white' }}>
                Security & Password
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <form onSubmit={handleUpdateProfile}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                        Full Name
                      </FormLabel>
                      <Input
                        borderRadius="lg"
                        bg="slate.50"
                        borderColor="slate.200"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                        Email Address
                      </FormLabel>
                      <Input
                        type="email"
                        borderRadius="lg"
                        bg="slate.50"
                        borderColor="slate.200"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </FormControl>

                    <Button
                      type="submit"
                      colorScheme="brand"
                      bg="brand.600"
                      width="full"
                      size="sm"
                      h="40px"
                      borderRadius="lg"
                      mt={2}
                      isLoading={profileLoading}
                      _hover={{ bg: 'brand.700' }}
                    >
                      Save Profile Changes
                    </Button>
                  </VStack>
                </form>
              </TabPanel>

              <TabPanel px={0}>
                <form onSubmit={handleChangePassword}>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                        Current Password
                      </FormLabel>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        borderRadius="lg"
                        bg="slate.50"
                        borderColor="slate.200"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                        New Password (min 6 characters)
                      </FormLabel>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        borderRadius="lg"
                        bg="slate.50"
                        borderColor="slate.200"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </FormControl>

                    <Button
                      type="submit"
                      colorScheme="purple"
                      width="full"
                      size="sm"
                      h="40px"
                      borderRadius="lg"
                      mt={2}
                      isLoading={passwordLoading}
                    >
                      Update Password
                    </Button>
                  </VStack>
                </form>
              </TabPanel>
            </TabPanels>
          </Tabs>
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

