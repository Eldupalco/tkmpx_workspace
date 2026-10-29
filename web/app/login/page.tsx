'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Box } from '@chakra-ui/react';
import { LoginForm, useAuth } from '@/features/auth';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/employee/dashboard');
      }
    }
  }, [user, isLoading, router]);

  return (
    <Box minH="100vh" bg="slate.50" px={4}>
      <Center minH="100vh" py={12}>
        <LoginForm />
      </Center>
    </Box>
  );
}

