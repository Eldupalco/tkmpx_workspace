'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  Checkbox,
  Switch,
  HStack,
  VStack,
  Box,
  Text,
  Spinner,
  Center,
  IconButton,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { FiTrash2, FiPlus } from 'react-icons/fi';
import { User } from '@/features/auth/types';
import { ShiftSchedule, UpdateSchedulePayload } from '../types';
import { fetchUserSchedules, updateSchedule, deleteSchedule } from '../api/schedule.api';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ManageShiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  token: string;
  /** Opens the bulk weekly assignment for this employee */
  onBulkAssign: (userId: string) => void;
  onChanged: () => void;
}

interface ShiftDraft {
  startTime: string;
  endTime: string;
  noBreak: boolean;
  breakStart: string;
  breakEnd: string;
  graceMinutes: number;
}

function toDraft(s: ShiftSchedule): ShiftDraft {
  return {
    startTime: s.startTime,
    endTime: s.endTime,
    noBreak: s.breakStart === null,
    breakStart: s.breakStart ?? '12:00',
    breakEnd: s.breakEnd ?? '13:00',
    graceMinutes: s.graceMinutes,
  };
}

function ShiftRow({
  shift,
  token,
  onSaved,
}: {
  shift: ShiftSchedule;
  token: string;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<ShiftDraft>(toDraft(shift));
  const [busy, setBusy] = useState(false);

  useEffect(() => setDraft(toDraft(shift)), [shift]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(shift));
  const set = (patch: Partial<ShiftDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const run = async (action: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await action();
      toast({ title: success, status: 'success', duration: 2500, isClosable: true });
      onSaved();
    } catch (err: any) {
      toast({ title: 'Shift update failed', description: err.message, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    const payload: UpdateSchedulePayload = {
      startTime: draft.startTime,
      endTime: draft.endTime,
      // null on both = shift without a lunch break
      breakStart: draft.noBreak ? null : draft.breakStart,
      breakEnd: draft.noBreak ? null : draft.breakEnd,
      graceMinutes: draft.graceMinutes,
    };
    run(() => updateSchedule(token, shift.id, payload), `${DAY_NAMES[shift.dayOfWeek]} shift saved`);
  };

  const toggleActive = (isActive: boolean) =>
    run(
      () => updateSchedule(token, shift.id, { isActive }),
      `${DAY_NAMES[shift.dayOfWeek]} shift ${isActive ? 'activated' : 'deactivated'}`,
    );

  const remove = () => {
    if (!window.confirm(`Remove the ${DAY_NAMES[shift.dayOfWeek]} shift? Past attendance is kept.`)) return;
    run(() => deleteSchedule(token, shift.id), `${DAY_NAMES[shift.dayOfWeek]} shift removed`);
  };

  const timeInput = (value: string, onChange: (v: string) => void, label: string, disabled = false) => (
    <Box>
      <Text fontSize="9px" fontWeight="bold" textTransform="uppercase" color="slate.500">
        {label}
      </Text>
      <Input
        type="time"
        size="xs"
        w="96px"
        borderRadius="md"
        value={value}
        isDisabled={disabled || busy}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );

  return (
    <Box
      p={3}
      border="1px solid"
      borderColor={shift.isActive ? 'slate.200' : 'slate.100'}
      borderRadius="lg"
      bg={shift.isActive ? 'white' : 'slate.50'}
      opacity={shift.isActive ? 1 : 0.75}
    >
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="bold" color="slate.800">
          {DAY_NAMES[shift.dayOfWeek]}
          {shift.shiftName ? (
            <Text as="span" fontWeight="normal" color="slate.500" fontSize="xs">
              {' '}· {shift.shiftName}
            </Text>
          ) : null}
        </Text>
        <HStack spacing={3}>
          <HStack spacing={1.5}>
            <Text fontSize="xs" color="slate.600">
              Active
            </Text>
            <Switch
              size="sm"
              colorScheme="brand"
              isChecked={shift.isActive}
              isDisabled={busy}
              onChange={(e) => toggleActive(e.target.checked)}
            />
          </HStack>
          <IconButton
            aria-label="Delete shift"
            size="xs"
            variant="ghost"
            colorScheme="red"
            icon={<Icon as={FiTrash2} boxSize={3} />}
            isDisabled={busy}
            onClick={remove}
          />
        </HStack>
      </HStack>

      <HStack spacing={2} align="flex-end" flexWrap="wrap">
        {timeInput(draft.startTime, (v) => set({ startTime: v }), 'Start')}
        {timeInput(draft.breakStart, (v) => set({ breakStart: v }), 'Break start', draft.noBreak)}
        {timeInput(draft.breakEnd, (v) => set({ breakEnd: v }), 'Break end', draft.noBreak)}
        {timeInput(draft.endTime, (v) => set({ endTime: v }), 'End')}
        <Box>
          <Text fontSize="9px" fontWeight="bold" textTransform="uppercase" color="slate.500">
            Grace (min)
          </Text>
          <Input
            type="number"
            size="xs"
            w="64px"
            min={0}
            max={120}
            borderRadius="md"
            value={draft.graceMinutes}
            isDisabled={busy}
            onChange={(e) => set({ graceMinutes: Math.max(0, Math.min(120, Number(e.target.value) || 0)) })}
          />
        </Box>
        <Checkbox
          size="sm"
          colorScheme="brand"
          isChecked={draft.noBreak}
          isDisabled={busy}
          onChange={(e) => set({ noBreak: e.target.checked })}
          pb={1}
        >
          <Text fontSize="xs">No break</Text>
        </Checkbox>
        <Button size="xs" colorScheme="brand" isDisabled={!dirty} isLoading={busy} onClick={save} mb={0.5}>
          Save
        </Button>
      </HStack>
    </Box>
  );
}

export function ManageShiftsModal({ isOpen, onClose, user, token, onBulkAssign, onChanged }: ManageShiftsModalProps) {
  const toast = useToast();
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setShifts(await fetchUserSchedules(token, user.id));
    } catch (err: any) {
      toast({ title: 'Failed to load shifts', description: err.message, status: 'error', duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, [token, user, toast]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  const handleSaved = () => {
    load();
    onChanged();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader fontSize="md">
          Shifts · {user?.name}
          <Text fontSize="xs" color="slate.500" fontWeight="normal" mt={1}>
            Edit times, lunch break and late grace per day; deactivate or remove a day
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading && shifts.length === 0 ? (
            <Center py={10}>
              <Spinner color="brand.500" />
            </Center>
          ) : shifts.length === 0 ? (
            <Text fontSize="sm" color="slate.500" textAlign="center" py={8}>
              No shifts assigned yet.
            </Text>
          ) : (
            <VStack spacing={2.5} align="stretch">
              {shifts.map((s) => (
                <ShiftRow key={s.id} shift={s} token={token} onSaved={handleSaved} />
              ))}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter justifyContent="space-between">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Icon as={FiPlus} />}
            onClick={() => user && onBulkAssign(user.id)}
          >
            Bulk assign weekly shifts
          </Button>
          <Button size="sm" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
