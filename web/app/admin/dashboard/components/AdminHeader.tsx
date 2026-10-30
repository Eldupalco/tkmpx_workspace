'use client';

import { Box, HStack, Heading, Text, Button, Icon } from '@chakra-ui/react';
import { FiCalendar } from 'react-icons/fi';

interface AdminHeaderProps {
  onAssignShifts: () => void;
}

export function AdminHeader({ onAssignShifts }: AdminHeaderProps) {
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
      </HStack>
    </HStack>
  );
}
