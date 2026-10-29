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
  Select,
  CheckboxGroup,
  Checkbox,
  Stack,
  VStack,
  Box,
  Text,
  useToast,
} from '@chakra-ui/react';
import { postBulkSchedule } from '../api/schedule.api';
import { User } from '@/features/auth/types';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  defaultUserId?: string;
  token: string;
  onSuccess: () => void;
}

export function BulkScheduleModal({
  isOpen,
  onClose,
  users,
  defaultUserId,
  token,
  onSuccess,
}: BulkScheduleModalProps) {
  const toast = useToast();
  const [selectedUser, setSelectedUser] = useState(defaultUserId || users[0]?.id || '');

  React.useEffect(() => {
    if (defaultUserId) {
      setSelectedUser(defaultUserId);
    } else if (users[0]?.id) {
      setSelectedUser(users[0].id);
    }
  }, [defaultUserId, users]);
  const [workDays, setWorkDays] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakStart, setBreakStart] = useState('12:00');
  const [breakEnd, setBreakEnd] = useState('13:00');
  const [noBreak, setNoBreak] = useState(false);
  const [graceMinutes, setGraceMinutes] = useState(0);
  const [shiftName, setShiftName] = useState('Standard Shift');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || workDays.length === 0) return;

    setLoading(true);
    try {
      await postBulkSchedule(token, {
        userId: selectedUser,
        workDays: workDays.map(Number),
        startTime,
        endTime,
        // null on both = shift without a lunch break
        breakStart: noBreak ? null : breakStart,
        breakEnd: noBreak ? null : breakEnd,
        graceMinutes,
        shiftName,
      });

      toast({
        title: 'Weekly schedules assigned successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Schedule assignment failed',
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" p={2}>
        <form onSubmit={handleSubmit}>
          <ModalHeader pb={1}>
            <Box>
              <Text fontSize="md" fontWeight="bold" color="slate.900">
                Assign Weekly Schedule
              </Text>
              <Text fontSize="xs" color="slate.500" fontWeight="normal">
                Configure recurring shift hours and working days
              </Text>
            </Box>
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />

          <ModalBody py={4}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  Select Employee
                </FormLabel>
                <Select
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  fontSize="sm"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  Working Days
                </FormLabel>
                <CheckboxGroup
                  value={workDays}
                  onChange={(values) => setWorkDays(values as string[])}
                >
                  <Stack spacing={[2, 3]} direction={['column', 'row']} wrap="wrap" pt={1}>
                    <Checkbox value="1" colorScheme="brand" fontSize="sm">Mon</Checkbox>
                    <Checkbox value="2" colorScheme="brand" fontSize="sm">Tue</Checkbox>
                    <Checkbox value="3" colorScheme="brand" fontSize="sm">Wed</Checkbox>
                    <Checkbox value="4" colorScheme="brand" fontSize="sm">Thu</Checkbox>
                    <Checkbox value="5" colorScheme="brand" fontSize="sm">Fri</Checkbox>
                    <Checkbox value="6" colorScheme="brand" fontSize="sm">Sat</Checkbox>
                    <Checkbox value="7" colorScheme="brand" fontSize="sm">Sun</Checkbox>
                  </Stack>
                </CheckboxGroup>
              </FormControl>

              <Stack direction={['column', 'row']} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                    Shift Start Time
                  </FormLabel>
                  <Input
                    type="time"
                    borderRadius="lg"
                    bg="slate.50"
                    borderColor="slate.200"
                    fontSize="sm"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                    Shift End Time
                  </FormLabel>
                  <Input
                    type="time"
                    borderRadius="lg"
                    bg="slate.50"
                    borderColor="slate.200"
                    fontSize="sm"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </FormControl>
              </Stack>

              <Checkbox
                isChecked={noBreak}
                onChange={(e) => setNoBreak(e.target.checked)}
                colorScheme="brand"
                fontSize="sm"
              >
                No lunch break (single Time In / Time Out, e.g. half-day or part-time shift)
              </Checkbox>

              <Stack direction={['column', 'row']} spacing={3} display={noBreak ? 'none' : 'flex'}>
                <FormControl isRequired={!noBreak}>
                  <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                    Lunch Break Start
                  </FormLabel>
                  <Input
                    type="time"
                    borderRadius="lg"
                    bg="slate.50"
                    borderColor="slate.200"
                    fontSize="sm"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                  />
                </FormControl>

                <FormControl isRequired={!noBreak}>
                  <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                    Lunch Break End
                  </FormLabel>
                  <Input
                    type="time"
                    borderRadius="lg"
                    bg="slate.50"
                    borderColor="slate.200"
                    fontSize="sm"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                  />
                </FormControl>
              </Stack>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  Late Grace Period (minutes)
                </FormLabel>
                <Input
                  type="number"
                  min={0}
                  max={120}
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  fontSize="sm"
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Math.max(0, Math.min(120, Number(e.target.value) || 0)))}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  Shift Label / Description
                </FormLabel>
                <Input
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  fontSize="sm"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="e.g. Standard Morning Shift"
                />
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
              loadingText="Assigning..."
              _hover={{ bg: 'brand.700' }}
            >
              Save Schedule
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

