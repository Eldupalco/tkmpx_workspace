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
  Textarea,
  VStack,
  useToast,
  Box,
  Text,
} from '@chakra-ui/react';
import { postLeaveRequest } from '../api/attendance.api';
import { AttendanceStatus } from '../types';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess: () => void;
}

export function LeaveRequestModal({
  isOpen,
  onClose,
  token,
  onSuccess,
}: LeaveRequestModalProps) {
  const toast = useToast();
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('on_leave');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setLoading(true);
    try {
      await postLeaveRequest(token, { date, status, notes });
      toast({
        title: 'Time-off request registered!',
        description: `Scheduled for ${date}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setDate('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        title: 'Failed to record leave',
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay bg="blackAlpha.400" backdropFilter="blur(4px)" />
      <ModalContent borderRadius="2xl" p={2}>
        <form onSubmit={handleSubmit}>
          <ModalHeader pb={1}>
            <Box>
              <Text fontSize="md" fontWeight="bold" color="slate.900">
                Request Time-Off or Leave
              </Text>
              <Text fontSize="xs" color="slate.500" fontWeight="normal">
                Register planned vacation, sick days or appointment leave
              </Text>
            </Box>
          </ModalHeader>
          <ModalCloseButton top={4} right={4} />

          <ModalBody py={4}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  Date of Leave
                </FormLabel>
                <Input
                  type="date"
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  min={new Date().toISOString().split('T')[0]}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  Leave Type
                </FormLabel>
                <Select
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                >
                  <option value="on_leave">Full Day PTO / Vacation</option>
                  <option value="half_day">Half Day (AM or PM)</option>
                  <option value="sick_leave">Sick / Medical Leave</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" textTransform="uppercase" color="slate.600">
                  Reason / Notes (Optional)
                </FormLabel>
                <Textarea
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  placeholder="Doctor appointment, family event, personal travel..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter pt={2}>
            <Button variant="ghost" size="sm" mr={2} borderRadius="lg" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="orange"
              size="sm"
              borderRadius="lg"
              type="submit"
              isLoading={loading}
              loadingText="Registering..."
            >
              Confirm Time-Off
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

