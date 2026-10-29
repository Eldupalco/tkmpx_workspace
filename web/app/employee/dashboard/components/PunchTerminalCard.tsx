'use client';

import { Box, Input } from '@chakra-ui/react';
import { PunchButton, TodayPunchStatus } from '@/features/attendance';

interface PunchTerminalCardProps {
  status: TodayPunchStatus | null;
  isLoading: boolean;
  notes: string;
  setNotes: (val: string) => void;
  onPunch: () => void;
}

export function PunchTerminalCard({
  status,
  isLoading,
  notes,
  setNotes,
  onPunch,
}: PunchTerminalCardProps) {
  return (
    <Box p={6} bg="white" border="1px solid" borderColor="slate.200" borderRadius="xl" shadow="xs">
      <PunchButton status={status} isLoading={isLoading} onPunch={onPunch} />

      {status?.nextPunch && (
        <Box mt={4} pt={4} borderTop="1px solid" borderColor="slate.100">
          <Input
            size="sm"
            borderRadius="lg"
            placeholder="Optional punch notes (e.g. Desk 4B, Work From Home)"
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
