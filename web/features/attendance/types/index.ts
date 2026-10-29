import { User } from '@/features/auth/types';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'on_leave';

/** Daily Time Record punch slots, always recorded in this order */
export type PunchSlot = 'amIn' | 'amOut' | 'pmIn' | 'pmOut';

export interface DailyPunches {
  amIn?: string | null;
  amOut?: string | null;
  pmIn?: string | null;
  pmOut?: string | null;
}

export interface Attendance extends DailyPunches {
  id: string;
  userId: string;
  date: string;
  lateMinutes: number;
  undertimeMinutes: number;
  status: AttendanceStatus;
  notes?: string | null;
  users?: User | null;
  /** Shift the punches were measured against; breakStart null = no lunch break */
  schedules?: { shiftName?: string | null; dayOfWeek: number; breakStart: string | null } | null;
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

export interface TimesheetRecord extends DailyPunches {
  id: string;
  date: string;
  status: string;
  hoursWorked: number;
  overtime: number;
  lateMinutes: number;
  undertimeMinutes: number;
}

export interface TimesheetSummary {
  totalHours: number;
  daysWorked: number;
  overtimeHours: number;
  averageHoursPerDay: number;
  totalLateMinutes: number;
  totalUndertimeMinutes: number;
}

export interface TimesheetData {
  summary: TimesheetSummary;
  records: TimesheetRecord[];
}


export interface TodayPunchStatus {
  today: string;
  onLeave: boolean;
  isWorking: boolean;
  completed: boolean;
  nextPunch: PunchSlot | null;
  nextPunchLabel: string | null;
  hoursWorked: number;
  /** false = single Time In / Time Out session */
  hasBreak: boolean;
  shift: {
    startTime: string;
    breakStart: string | null;
    breakEnd: string | null;
    endTime: string;
    graceMinutes: number;
  } | null;
  record: Attendance | null;
}
