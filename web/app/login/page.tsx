'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { LoginForm, useAuth } from '@/features/auth';

export default function LoginPage() {

  const { user, isLoading } = useAuth();

  const router = useRouter();

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/employee/dashboard');
      }
    }
  }, [user, isLoading, router]);

  // Signed in: show progress instead of an idle form while the dashboard loads
  if (user) {
    return (
      <Center minH="100vh" bg="slate.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text fontSize="sm" color="slate.600">
            Redirecting to your dashboard...
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg="slate.50" px={4}>
      <Center minH="100vh" py={12}>
        <LoginForm />
      </Center>
    </Box>
  );
}
