'use client';

import { useState } from 'react';
import { Box, Input, useToast } from '@chakra-ui/react';
import { PunchButton, usePunch, useTodayStatus } from '@/features/attendance';

export function PunchTerminalCard() {
  const toast = useToast();
  const { data: status = null } = useTodayStatus();
  const punchMutation = usePunch();
  const [notes, setNotes] = useState<string>('');

  // Records the next punch in sequence: Morning In -> Morning Out -> Afternoon In -> Afternoon Out
  const handlePunch = async () => {
    const label = status?.nextPunchLabel ?? 'Punch';
    try {
      await punchMutation.mutateAsync(notes || undefined);
      toast({
        title: `${label} Recorded`,
        description: `Punched at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNotes('');
    } catch (err: any) {
      toast({
        title: `${label} Failed`,
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6} bg="white" border="1px solid" borderColor="slate.200" borderRadius="xl" shadow="xs">
      <PunchButton status={status} isLoading={punchMutation.isPending} onPunch={handlePunch} />

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
