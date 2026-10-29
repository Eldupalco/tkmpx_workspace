import { User } from '@/features/auth/types';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: AttendanceStatus;
  notes?: string | null;
  users?: User | null;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface FetchAttendanceParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  employeeSearch?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  token?: string;
}

export interface TimesheetRecord {
  id: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string | null;
  status: string;
  hoursWorked: number;
  overtime: number;
}

export interface TimesheetSummary {
  totalHours: number;
  daysWorked: number;
  overtimeHours: number;
  averageHoursPerDay: number;
}

export interface TimesheetData {
  summary: TimesheetSummary;
  records: TimesheetRecord[];
}

