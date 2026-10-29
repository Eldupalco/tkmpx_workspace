'use client';

import React from 'react';
import { Center, Box } from '@chakra-ui/react';
import { ForgotPasswordForm } from '@/features/auth';

export default function ForgotPasswordPage() {
  return (
    <Box minH="100vh" bg="slate.50" px={4}>
      <Center minH="100vh" py={12}>
        <ForgotPasswordForm />
      </Center>
    </Box>
  );
}
