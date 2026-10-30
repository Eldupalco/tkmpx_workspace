import { apiRequest, apiRequestPage, PaginationMeta } from '@/lib/api-client';
import { User } from '@/features/auth/types';
import { Attendance } from '@/features/attendance/types';
import {
  CreateUserPayload,
  UpdateUserPayload,
  DashboardMetrics,
  UserListFilters,
} from '../types';

/** One page of users, searched and filtered by the API */
export function fetchUsersPage(
  token: string,
  { page, limit, search, role }: UserListFilters
): Promise<{ data: User[]; meta: PaginationMeta }> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit), sortBy: 'name', sortOrder: 'asc' });
  if (search?.trim()) query.set('search', search.trim());
  if (role) query.set('role', role);
  return apiRequestPage(`/users?${query.toString()}`, { token, errorMessage: 'Failed to fetch users' });
}

/** Every user (for pickers), loaded 100 at a time, the API's maximum page size */
export async function fetchUsers(token: string): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await fetchUsersPage(token, { page, limit: 100 });
    users.push(...data);
    if (page >= meta.totalPages) return users;
  }
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
