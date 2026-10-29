'use client';

import { HStack, Button, IconButton, Text, Flex, Box, Select, Icon } from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  onLimitChange?: (newLimit: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <Flex
      direction={{ base: 'column', sm: 'row' }}
      justify="space-between"
      align="center"
      pt={4}
      gap={3}
    >
      <Text fontSize="xs" color="slate.500">
        Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of{' '}
        <strong>{total}</strong> records
      </Text>

      <HStack spacing={1.5} align="center">
        {onLimitChange && (
          <Box mr={1}>
            <Select
              size="xs"
              h="28px"
              borderRadius="md"
              borderColor="slate.200"
              fontSize="xs"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              w="105px"
              bg="white"
              cursor="pointer"
              _hover={{ borderColor: 'slate.300' }}
              _focus={{ borderColor: 'brand.500', boxShadow: 'none' }}
            >
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </Select>
          </Box>
        )}

        <IconButton
          size="xs"
          h="28px"
          w="28px"
          minW="28px"
          variant="outline"
          borderRadius="md"
          borderColor="slate.200"
          bg="white"
          color="slate.700"
          _hover={{ bg: 'slate.50', borderColor: 'slate.300' }}
          isDisabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          icon={<Icon as={FiChevronLeft} boxSize={3.5} />}
        />

        {getPageNumbers().map((pageNum) => (
          <Button
            key={pageNum}
            size="xs"
            h="28px"
            w="28px"
            minW="28px"
            px={0}
            borderRadius="md"
            colorScheme={pageNum === page ? 'brand' : 'gray'}
            bg={pageNum === page ? 'brand.600' : 'transparent'}
            color={pageNum === page ? 'white' : 'slate.700'}
            fontSize="xs"
            fontWeight={pageNum === page ? 'bold' : 'normal'}
            variant={pageNum === page ? 'solid' : 'ghost'}
            _hover={{ bg: pageNum === page ? 'brand.700' : 'slate.100' }}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </Button>
        ))}

        <IconButton
          size="xs"
          h="28px"
          w="28px"
          minW="28px"
          variant="outline"
          borderRadius="md"
          borderColor="slate.200"
          bg="white"
          color="slate.700"
          _hover={{ bg: 'slate.50', borderColor: 'slate.300' }}
          isDisabled={page >= totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          icon={<Icon as={FiChevronRight} boxSize={3.5} />}
        />
      </HStack>
    </Flex>
  );
}
