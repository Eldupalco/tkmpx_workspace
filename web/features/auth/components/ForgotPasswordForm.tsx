'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { requestForgotPassword, resetPasswordWithToken } from '../api/auth.api';

export function ForgotPasswordForm() {
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await requestForgotPassword(email);
      setSuccessMessage(res.message || 'If an account exists, a reset token was generated.');
      if (res.resetToken) {
        setToken(res.resetToken);
      }
      setStep('reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request reset token');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await resetPasswordWithToken({ email, token, newPassword });
      toast({
        title: 'Password Reset Successful',
        description: 'You can now sign in with your new password.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      router.push('/login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      w="100%"
      maxW="400px"
      bg="white"
      p={{ base: 7, sm: 9 }}
      borderRadius="2xl"
      boxShadow="0 4px 20px -2px rgba(0, 0, 0, 0.05)"
      border="1px solid"
      borderColor="slate.200"
    >
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Heading size="md" color="slate.900" fontWeight="extrabold" letterSpacing="-0.02em">
            {step === 'request' ? 'Reset Password' : 'Enter New Password'}
          </Heading>
          <Text fontSize="xs" color="slate.500" mt={1}>
            {step === 'request'
              ? 'Enter your account email to receive a password reset token'
              : 'Enter your reset token and new password'}
          </Text>
        </Box>

        {errorMessage && (
          <Alert status="error" borderRadius="xl" fontSize="xs" py={2.5}>
            <AlertIcon />
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert status="info" borderRadius="xl" fontSize="xs" py={2.5}>
            <AlertIcon />
            {successMessage}
          </Alert>
        )}

        {step === 'request' ? (
          <form onSubmit={handleRequestToken}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="11px" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em" color="slate.600">
                  Email Address
                </FormLabel>
                <Input
                  type="email"
                  placeholder="name@tkpex.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  focusBorderColor="brand.500"
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  fontSize="sm"
                  _focus={{ bg: 'white' }}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                bg="brand.600"
                size="md"
                h="44px"
                width="full"
                mt={2}
                borderRadius="lg"
                fontWeight="bold"
                isLoading={loading}
                loadingText="Sending Request..."
                _hover={{ bg: 'brand.700' }}
              >
                Send Reset Token
              </Button>
            </VStack>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="11px" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em" color="slate.600">
                  Reset Token
                </FormLabel>
                <Input
                  type="text"
                  placeholder="Enter 64-char token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  focusBorderColor="brand.500"
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  fontSize="sm"
                  _focus={{ bg: 'white' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="11px" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em" color="slate.600">
                  New Password
                </FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  focusBorderColor="brand.500"
                  borderRadius="lg"
                  bg="slate.50"
                  borderColor="slate.200"
                  fontSize="sm"
                  _focus={{ bg: 'white' }}
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="brand"
                bg="brand.600"
                size="md"
                h="44px"
                width="full"
                mt={2}
                borderRadius="lg"
                fontWeight="bold"
                isLoading={loading}
                loadingText="Updating Password..."
                _hover={{ bg: 'brand.700' }}
              >
                Update Password
              </Button>
            </VStack>
          </form>
        )}

        <HStack justify="center" fontSize="xs" color="slate.600">
          <Text>Remember your password?</Text>
          <Text as={Link} href="/login" color="brand.600" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
            Back to Sign In
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}
