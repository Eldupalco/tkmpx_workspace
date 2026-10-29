'use client';

import { useEffect } from 'react';
import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button } from '@chakra-ui/react';

/** Catches render errors in the dashboard so the navbar stays usable and the user can retry */
export default function EmployeeDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Employee dashboard error', error);
  }, [error]);

  return (
    <Alert status="error" borderRadius="xl" shadow="xs" alignItems="flex-start">
      <AlertIcon />
      <Box flex="1">
        <AlertTitle fontSize="sm">The dashboard could not be displayed</AlertTitle>
        <AlertDescription fontSize="xs">
          An unexpected error occurred. Try again, or reload the page if it persists.
        </AlertDescription>
      </Box>
      <Button size="xs" colorScheme="red" onClick={reset}>
        Try again
      </Button>
    </Alert>
  );
}
