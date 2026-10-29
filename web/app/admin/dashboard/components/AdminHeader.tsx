'use client';

import { Box, HStack, Heading, Text, Button, Icon } from '@chakra-ui/react';
import { FiCalendar, FiDownload } from 'react-icons/fi';

interface AdminHeaderProps {
  onAssignShifts: () => void;
  onExportCsv: () => void;
}

export function AdminHeader({ onAssignShifts, onExportCsv }: AdminHeaderProps) {
  return (
    <HStack justify="space-between" align="center" wrap="wrap" gap={4}>
      <Box>
        <Heading size="md" color="slate.900" fontWeight="extrabold" letterSpacing="-0.02em">
          Workforce Operations & Audit
        </Heading>
        <Text color="slate.500" fontSize="xs" mt={0.5}>
          Company-wide attendance monitoring, live on-site presence & team shift rostering
        </Text>
      </Box>

      <HStack spacing={2.5}>
        <Button
          size="sm"
          colorScheme="brand"
          bg="brand.600"
          borderRadius="lg"
          fontSize="xs"
          fontWeight="semibold"
          leftIcon={<Icon as={FiCalendar} boxSize={3.5} />}
          onClick={onAssignShifts}
          _hover={{ bg: 'brand.700' }}
        >
          Assign Weekly Shifts
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
          Export Company CSV
        </Button>
      </HStack>
    </HStack>
  );
}
