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
import { registerUser } from '../api/auth.api';

export function RegisterForm() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      await registerUser({ name, email, password });
      toast({
        title: 'Account Created',
        description: 'You can now sign in with your credentials.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      router.push('/login');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account');
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
            Create Account
          </Heading>
          <Text fontSize="xs" color="slate.500" mt={1}>
            Register for your TKPEX workforce account
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
                Full Name
              </FormLabel>
              <Input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                Email Address
              </FormLabel>
              <Input
                type="email"
                placeholder="jane.doe@tkpex.com"
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
              <FormLabel fontSize="11px" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em" color="slate.600">
                Password
              </FormLabel>
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
              loadingText="Creating Account..."
              _hover={{ bg: 'brand.700' }}
            >
              Register Account
            </Button>
          </VStack>
        </form>

        <HStack justify="center" fontSize="xs" color="slate.600">
          <Text>Already registered?</Text>
          <Text as={Link} href="/login" color="brand.600" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
            Sign In
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}
