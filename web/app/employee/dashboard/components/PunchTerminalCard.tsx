'use client';

import { Box, Input } from '@chakra-ui/react';
import { CheckInButton } from '@/features/attendance';

interface PunchTerminalCardProps {
  isCheckedIn: boolean;
  isLoading: boolean;
  lastCheckInTime: string | null;
  notes: string;
  setNotes: (val: string) => void;
  onCheckIn: () => void;
  onCheckOut: () => void;
}

export function PunchTerminalCard({
  isCheckedIn,
  isLoading,
  lastCheckInTime,
  notes,
  setNotes,
  onCheckIn,
  onCheckOut,
}: PunchTerminalCardProps) {
  return (
    <Box p={6} bg="white" border="1px solid" borderColor="slate.200" borderRadius="xl" shadow="xs">
      <CheckInButton
        isCheckedIn={isCheckedIn}
        isLoading={isLoading}
        lastCheckInTime={lastCheckInTime}
        onCheckIn={onCheckIn}
        onCheckOut={onCheckOut}
      />

      {!isCheckedIn && (
        <Box mt={4} pt={4} borderTop="1px solid" borderColor="slate.100">
          <Input
            size="sm"
            borderRadius="lg"
            placeholder="Optional shift notes (e.g. Desk 4B, Work From Home)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxW="480px"
            bg="slate.50"
            borderColor="slate.200"
            _focus={{ bg: 'white', borderColor: 'brand.500' }}
          />
        </Box>
      )}
    </Box>
  );
}
