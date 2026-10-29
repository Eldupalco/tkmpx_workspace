'use client';

import React, { useState, useEffect } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverFooter,
  Button,
  HStack,
  VStack,
  Box,
  Text,
  Input,
  Icon,
  SimpleGrid,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import { FiCalendar, FiChevronDown, FiX, FiCheck } from 'react-icons/fi';

interface DateRangePopoverProps {
  startDate?: string;
  endDate?: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
}

export function DateRangePopover({
  startDate = '',
  endDate = '',
  onChange,
}: DateRangePopoverProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Internal draft state
  const [draftStart, setDraftStart] = useState(startDate);
  const [draftEnd, setDraftEnd] = useState(endDate);

  // Sync with incoming props
  useEffect(() => {
    setDraftStart(startDate);
    setDraftEnd(endDate);
  }, [startDate, endDate]);

  const hasActiveRange = Boolean(startDate || endDate);

  // Helper date generators
  const toIsoDate = (d: Date) => d.toISOString().split('T')[0];

  const handleApplyPreset = (preset: string) => {
    const now = new Date();
    let start = '';
    let end = toIsoDate(now);

    switch (preset) {
      case 'today':
        start = end;
        break;
      case 'yesterday': {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        start = toIsoDate(y);
        end = start;
        break;
      }
      case 'this_week': {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(d.setDate(diff));
        start = toIsoDate(monday);
        break;
      }
      case 'last_7_days': {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        start = toIsoDate(d);
        break;
      }
      case 'this_month': {
        const d = new Date();
        start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        break;
      }
      case 'last_30_days': {
        const d = new Date();
        d.setDate(d.getDate() - 29);
        start = toIsoDate(d);
        break;
      }
    }

    setDraftStart(start);
    setDraftEnd(end);
    onChange({ startDate: start, endDate: end });
    onClose();
  };

  const handleApplyCustom = () => {
    onChange({ startDate: draftStart, endDate: draftEnd });
    onClose();
  };

  const handleClear = () => {
    setDraftStart('');
    setDraftEnd('');
    onChange({ startDate: '', endDate: '' });
    onClose();
  };

  // Human-readable trigger label
  const getTriggerLabel = () => {
    if (!startDate && !endDate) return 'Date Range';
    if (startDate && endDate) {
      if (startDate === endDate) return startDate;
      return `${startDate} → ${endDate}`;
    }
    if (startDate) return `From ${startDate}`;
    return `Until ${endDate}`;
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      placement="bottom-start"
      closeOnBlur={true}
    >
      <PopoverTrigger>
        <Button
          size="sm"
          variant="outline"
          borderRadius="lg"
          borderColor={hasActiveRange ? 'brand.400' : 'slate.200'}
          bg={hasActiveRange ? 'brand.50' : 'slate.50'}
          color={hasActiveRange ? 'brand.700' : 'slate.700'}
          fontSize="xs"
          fontWeight={hasActiveRange ? 'semibold' : 'normal'}
          leftIcon={<Icon as={FiCalendar} boxSize={3.5} color={hasActiveRange ? 'brand.600' : 'slate.400'} />}
          rightIcon={<Icon as={FiChevronDown} boxSize={3} color={hasActiveRange ? 'brand.600' : 'slate.400'} />}
          _hover={{ bg: hasActiveRange ? 'brand.100' : 'slate.100', borderColor: 'slate.300' }}
          px={3}
          h="32px"
        >
          {getTriggerLabel()}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        w="320px"
        p={0}
        borderRadius="xl"
        borderColor="slate.200"
        shadow="lg"
        bg="white"
        _focus={{ boxShadow: 'lg', outline: 'none' }}
      >
        <PopoverBody p={4}>
          <VStack align="stretch" spacing={3.5}>
            {/* Presets Header */}
            <Box>
              <Text fontSize="10px" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em" color="slate.400" mb={2}>
                Quick Presets
              </Text>
              <SimpleGrid columns={2} spacing={1.5}>
                <Button size="xs" variant="ghost" colorScheme="slate" justifyContent="flex-start" fontSize="xs" onClick={() => handleApplyPreset('today')}>
                  Today
                </Button>
                <Button size="xs" variant="ghost" colorScheme="slate" justifyContent="flex-start" fontSize="xs" onClick={() => handleApplyPreset('yesterday')}>
                  Yesterday
                </Button>
                <Button size="xs" variant="ghost" colorScheme="slate" justifyContent="flex-start" fontSize="xs" onClick={() => handleApplyPreset('this_week')}>
                  This Week
                </Button>
                <Button size="xs" variant="ghost" colorScheme="slate" justifyContent="flex-start" fontSize="xs" onClick={() => handleApplyPreset('last_7_days')}>
                  Last 7 Days
                </Button>
                <Button size="xs" variant="ghost" colorScheme="slate" justifyContent="flex-start" fontSize="xs" onClick={() => handleApplyPreset('this_month')}>
                  This Month
                </Button>
                <Button size="xs" variant="ghost" colorScheme="slate" justifyContent="flex-start" fontSize="xs" onClick={() => handleApplyPreset('last_30_days')}>
                  Last 30 Days
                </Button>
              </SimpleGrid>
            </Box>

            {/* Custom Date Range Inputs */}
            <Box pt={2} borderTop="1px solid" borderColor="slate.100">
              <Text fontSize="10px" fontWeight="bold" textTransform="uppercase" letterSpacing="0.05em" color="slate.400" mb={2}>
                Custom Interval
              </Text>
              <VStack spacing={2} align="stretch">
                <HStack spacing={2}>
                  <Text fontSize="xs" w="45px" color="slate.500">From:</Text>
                  <Input
                    type="date"
                    size="xs"
                    borderRadius="md"
                    value={draftStart}
                    onChange={(e) => setDraftStart(e.target.value)}
                    bg="slate.50"
                    borderColor="slate.200"
                  />
                </HStack>
                <HStack spacing={2}>
                  <Text fontSize="xs" w="45px" color="slate.500">To:</Text>
                  <Input
                    type="date"
                    size="xs"
                    borderRadius="md"
                    value={draftEnd}
                    onChange={(e) => setDraftEnd(e.target.value)}
                    bg="slate.50"
                    borderColor="slate.200"
                  />
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </PopoverBody>

        <PopoverFooter
          p={3}
          bg="slate.50"
          borderTop="1px solid"
          borderColor="slate.100"
          borderBottomRadius="xl"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Button
            size="xs"
            variant="ghost"
            colorScheme="slate"
            onClick={handleClear}
            isDisabled={!hasActiveRange && !draftStart && !draftEnd}
          >
            Clear
          </Button>

          <HStack spacing={2}>
            <Button size="xs" variant="outline" borderColor="slate.200" bg="white" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="xs"
              colorScheme="brand"
              bg="brand.600"
              _hover={{ bg: 'brand.700' }}
              onClick={handleApplyCustom}
              leftIcon={<Icon as={FiCheck} boxSize={3} />}
            >
              Apply
            </Button>
          </HStack>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
}

