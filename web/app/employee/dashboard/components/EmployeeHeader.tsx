'use client';

import { Box, HStack, Heading, Text, Button, Icon } from '@chakra-ui/react';
import { FiFileText, FiSend, FiDownload } from 'react-icons/fi';

interface EmployeeHeaderProps {
  userName?: string;
  onOpenTimesheet: () => void;
  onOpenLeave: () => void;
  onExportCsv: () => void;
}

export function EmployeeHeader({
  userName,
  onOpenTimesheet,
  onOpenLeave,
  onExportCsv,
}: EmployeeHeaderProps) {
  return (
    <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
      <Box>
        <Heading size="md" color="slate.900" fontWeight="extrabold" letterSpacing="-0.02em">
          Welcome, {userName || 'Employee'}
        </Heading>
        <Text color="slate.500" fontSize="xs" mt={0.5}>
          Employee Workspace • Punch shifts, inspect weekly rosters & request leave
        </Text>
      </Box>

      <HStack spacing={2.5}>
        <Button
          size="sm"
          variant="outline"
          bg="white"
          borderColor="slate.200"
          color="slate.700"
          _hover={{ bg: 'slate.50', borderColor: 'slate.300', color: 'slate.900' }}
          borderRadius="lg"
          fontSize="xs"
          fontWeight="semibold"
          leftIcon={<Icon as={FiFileText} boxSize={3.5} color="slate.500" />}
          onClick={onOpenTimesheet}
        >
          Timesheet & Overtime
        </Button>
        <Button
          size="sm"
          variant="outline"
          bg="white"
          borderColor="slate.200"
          color="slate.700"
          _hover={{ bg: 'slate.50', borderColor: 'slate.300', color: 'slate.900' }}
          borderRadius="lg"
          fontSize="xs"
          fontWeight="semibold"
          leftIcon={<Icon as={FiSend} boxSize={3.5} color="slate.500" />}
          onClick={onOpenLeave}
        >
          Request Leave
        </Button>
        <Button
          size="sm"
          variant="outline"
          bg="white"
          borderColor="slate.200"
          color="slate.700"
          _hover={{ bg: 'slate.50', borderColor: 'slate.300', color: 'slate.900' }}
          borderRadius="lg"
          fontSize="xs"
          fontWeight="semibold"
          leftIcon={<Icon as={FiDownload} boxSize={3.5} color="slate.500" />}
          onClick={onExportCsv}
        >
          Export CSV
        </Button>
      </HStack>
    </HStack>
  );
}
