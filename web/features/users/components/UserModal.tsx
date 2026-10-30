'use client';

import React, { useState, useEffect } from 'react';
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
  Select,
  VStack,
  useToast,
  Box,
  Text,
} from '@chakra-ui/react';
import { createUser, updateUser } from '../api/users.api';
import { User, UserRole } from '@/features/auth/types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  userToEdit?: User | null;
  onSuccess: () => void;
}

export function UserModal({
  isOpen,
  onClose,
  token,
  userToEdit,
  onSuccess,
}: UserModalProps) {
  const toast = useToast();
  const isEditing = Boolean(userToEdit);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setRole('user');
    }
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && userToEdit) {
        await updateUser(token, userToEdit.id, {
          name,
          email,
          role,
          ...(password ? { password } : {}),
        });
        toast({
          title: 'Employee Updated',
          description: `${name} has been updated successfully.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createUser(token, {
          name,
          email,
          password: password || 'password!!!',
          role,
        });
        toast({
          title: 'Employee Created',
          description: `${name} has been registered to the team.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: isEditing ? 'Update Failed' : 'Creation Failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" p={2}>
        <form onSubmit={handleSubmit}>
          <ModalHeader pb={1}>
            <Box>
              <Text fontSize="md" fontWeight="bold" color="slate.900">
                {isEditing ? 'Edit Employee Account' : 'Register New Employee'}
              </Text>
              <Text fontSize="xs" color="slate.500" fontWeight="normal">
                {isEditing
                  ? 'Update employee contact details and role permissions'
                  : 'Add a new member to the company workforce roster'}
              </Text>
            </Box>
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />

          <ModalBody py={4}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  Full Name
                </FormLabel>
                <Input
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  fontSize="sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
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
                  fontSize="sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. jane.doe@tkpex.com"
                />
              </FormControl>

              <FormControl isRequired={!isEditing}>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  {isEditing ? 'New Password (leave blank to keep current)' : 'Initial Password'}
                </FormLabel>
                <Input
                  type="password"
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  fontSize="sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  Account Role
                </FormLabel>
                <Select
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  fontSize="sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="user">Staff / Employee</option>
                  <option value="admin">Admin / Manager</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter pt={2}>
            <Button variant="ghost" size="sm" mr={2} borderRadius="lg" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              bg="brand.600"
              size="sm"
              borderRadius="lg"
              type="submit"
              isLoading={loading}
              loadingText={isEditing ? 'Saving...' : 'Registering...'}
              _hover={{ bg: 'brand.700' }}
            >
              {isEditing ? 'Save Changes' : 'Create Account'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

