import { apiRequest } from '@/lib/api-client';
import { User } from '@/features/auth/types';
import { Attendance } from '@/features/attendance/types';
import {
  CreateUserPayload,
  UpdateUserPayload,
  DashboardMetrics,
} from '../types';

export async function fetchUsers(token: string): Promise<User[]> {
  const data = await apiRequest<User[]>('/users?limit=50', { token, errorMessage: 'Failed to fetch users' });
  return data ?? [];
}

export function createUser(token: string, data: CreateUserPayload): Promise<User> {
  return apiRequest('/users', { method: 'POST', token, body: data, errorMessage: 'Failed to create user' });
}

export function updateUser(token: string, id: string, data: UpdateUserPayload): Promise<User> {
  return apiRequest(`/users/${id}`, { method: 'PATCH', token, body: data, errorMessage: 'Failed to update user' });
}

export async function deleteUser(token: string, id: string): Promise<void> {
  await apiRequest(`/users/${id}`, { method: 'DELETE', token, errorMessage: 'Failed to delete user' });
}

export async function fetchCurrentlyIn(token: string): Promise<Attendance[]> {
  const data = await apiRequest<Attendance[]>('/attendances/currently-in', {
    token,
    errorMessage: 'Failed to fetch currently-in records',
  });
  return data ?? [];
}

export function fetchDashboardMetrics(token: string): Promise<DashboardMetrics> {
  return apiRequest('/attendances/dashboard', { token, errorMessage: 'Failed to fetch dashboard metrics' });
}
