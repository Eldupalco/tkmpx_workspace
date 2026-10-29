'use client';

import { Box, Flex, Text, Badge, Tooltip } from '@chakra-ui/react';

interface StatCardProps {
  title: string;
  value: string | number;
  helpText?: string;
  badgeText?: string;
  badgeScheme?: string;
  tooltip?: string;
}

export function StatCard({
  title,
  value,
  helpText,
  badgeText,
  badgeScheme = 'gray',
  tooltip,
}: StatCardProps) {
  const card = (
    <Box
      p={4}
      bg="white"
      borderWidth="1px"
      borderColor="slate.200"
      borderRadius="xl"
      shadow="xs"
      cursor={tooltip ? 'default' : 'default'}
      transition="all 0.15s ease"
      _hover={tooltip ? { borderColor: 'slate.300', shadow: 'sm' } : undefined}
    >
      <Flex justify="space-between" align="center" gap={2}>
        <Text
          fontSize="11px"
          fontWeight="bold"
          textTransform="uppercase"
          letterSpacing="0.05em"
          color="slate.500"
          noOfLines={1}
        >
          {title}
        </Text>

        {badgeText && (
          <Badge
            colorScheme={badgeScheme}
            variant="subtle"
            fontSize="10px"
            borderRadius="full"
            px={2}
            py={0.2}
            fontWeight="semibold"
            textTransform="capitalize"
            flexShrink={0}
          >
            {badgeText}
          </Badge>
        )}
      </Flex>

      <Text
        fontSize="2xl"
        fontWeight="extrabold"
        color="slate.900"
        mt={2}
        lineHeight="1.1"
      >
        {value}
      </Text>

      {helpText && (
        <Text fontSize="xs" color="slate.500" mt={1.5} noOfLines={1}>
          {helpText}
        </Text>
      )}
    </Box>
  );

  if (tooltip) {
    return (
      <Tooltip
        label={tooltip}
        fontSize="xs"
        bg="slate.900"
        color="white"
        borderRadius="md"
        px={2.5}
        py={1.5}
        hasArrow
        placement="top"
      >
        {card}
      </Tooltip>
    );
  }

  return card;
}
