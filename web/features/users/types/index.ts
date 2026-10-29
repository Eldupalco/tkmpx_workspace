import { User } from '@/features/auth/types';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export interface CurrentlyInUser {
  attendanceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  checkInTime: string;
  durationMinutes: number;
}

export interface DashboardMetrics {
  totalEmployees: number;
  checkedInToday: number;
  currentlyWorking: number;
  lateToday: number;
  onLeaveToday: number;
  notPunchedYet: number;
}

