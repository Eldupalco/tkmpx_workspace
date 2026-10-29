'use client';

import { ChakraProvider, createStandaloneToast } from '@chakra-ui/react';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { AuthProvider } from '@/features/auth';
import { theme } from '@/theme';

const { ToastContainer, toast } = createStandaloneToast({ theme });

export function Providers({ children }: { children: React.ReactNode }) {
  // One client per browser session; useState keeps it stable across re-renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
        // Any failed data load shows one toast; the fixed id stops duplicates piling up
        queryCache: new QueryCache({
          onError: (error) => {
            if (toast.isActive('api-error')) return;
            toast({
              id: 'api-error',
              title: 'Some data could not be loaded',
              description: error.message,
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <AuthProvider>{children}</AuthProvider>
      </ChakraProvider>
      <ToastContainer />
    </QueryClientProvider>
  );
}
