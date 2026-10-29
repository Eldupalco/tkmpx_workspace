'use client';

import { VStack } from '@chakra-ui/react';
import {
  EmployeeHeader,
  PunchTerminalCard,
  EmployeeSummaryCards,
  ScheduleSection,
  PunchHistorySection,
} from './components';

// Auth, navbar and container come from app/employee/layout.tsx; each section loads its own data
export default function EmployeeDashboardPage() {
  return (
    <VStack spacing={6} align="stretch">
      <EmployeeHeader />
      <PunchTerminalCard />
      <EmployeeSummaryCards />
      <ScheduleSection />
      <PunchHistorySection />
    </VStack>
  );
}
