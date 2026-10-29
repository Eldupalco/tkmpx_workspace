'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Flex,
  Heading,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

export function LoginForm() {

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await login({ email, password });
      // Keep the button busy on success: navigation to the dashboard is still in progress
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
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
            TKPEX Workforce
          </Heading>
          <Text fontSize="xs" color="slate.500" mt={1}>
            Sign in to access your attendance workspace
          </Text>
        </Box>

        {errorMessage && (
          <Alert status="error" borderRadius="xl" fontSize="xs" py={2.5}>
            <AlertIcon />
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
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

            <FormControl isRequired>
              <Flex justify="space-between" align="center">
                <FormLabel fontSize="11px" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em" color="slate.600" mb={1.5}>
                  Password
                </FormLabel>
                <Text
                  as={Link}
                  href="/forgot-password"
                  fontSize="xs"
                  color="brand.600"
                  fontWeight="medium"
                  _hover={{ textDecoration: 'underline' }}
                >
                  Forgot password?
                </Text>
              </Flex>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              loadingText="Signing In..."
              _hover={{ bg: 'brand.700' }}
            >
              Sign In to Workspace
            </Button>
          </VStack>
        </form>

        <HStack justify="center" fontSize="xs" color="slate.600">
          <Text>Don&apos;t have an account?</Text>
          <Text as={Link} href="/register" color="brand.600" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
            Register
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}

