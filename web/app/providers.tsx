'use client';

import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { AuthProvider } from '@/features/auth';
import { theme } from '@/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>{children}</AuthProvider>
    </ChakraProvider>
  );
}
