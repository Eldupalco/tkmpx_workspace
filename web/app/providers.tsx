'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { AuthProvider } from '@/features/auth';
import { theme } from '@/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  // One client per browser session; useState keeps it stable across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <AuthProvider>{children}</AuthProvider>
      </ChakraProvider>
    </QueryClientProvider>
  );
}
