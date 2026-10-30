import { User, UserRole } from '@/features/auth/types';

/** Server-side filters for the team list */
export interface UserListFilters {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
}


export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface DashboardMetrics {
  totalEmployees: number;
  checkedInToday: number;
  currentlyWorking: number;
  lateToday: number;
  onLeaveToday: number;
  notPunchedYet: number;
}

