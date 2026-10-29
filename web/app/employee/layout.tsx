'use client';

import { Box, Container } from '@chakra-ui/react';
import { AuthGuard } from '@/features/auth';
import { Navbar } from '@/components';

/** Shared frame for every /employee page: session + role check, navbar and page container */
export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['user', 'admin']}>
      <Box minH="100vh" bg="slate.50">
        <Navbar />
        <Container maxW="1200px" py={8}>
          {children}
        </Container>
      </Box>
    </AuthGuard>
  );
}
