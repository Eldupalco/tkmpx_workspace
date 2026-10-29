export interface ShiftSchedule {
  id: string;
  userId: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  /** null = shift without a lunch break */
  breakStart: string | null;
  breakEnd: string | null;
  graceMinutes: number;
  shiftName?: string;
  isActive: boolean;
}

export interface TodaySchedule {
  hasShiftToday: boolean;
  dayName: string;
  todayDayOfWeek: number;
  schedule: ShiftSchedule | null;
}

export interface BulkSchedulePayload {
  userId: string;
  workDays: number[];
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  graceMinutes?: number;
  shiftName?: string;
}

export interface UpdateSchedulePayload {
  startTime?: string;
  endTime?: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  graceMinutes?: number;
  shiftName?: string;
  isActive?: boolean;
}

