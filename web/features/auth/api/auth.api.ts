import { apiRequest } from '@/lib/api-client';
import { User, LoginCredentials, AuthResponse } from '../types';

export function loginUser(credentials: LoginCredentials): Promise<AuthResponse> {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
    errorMessage: 'Invalid email or password',
  });
}

export function fetchUserProfile(token: string): Promise<User> {
  return apiRequest('/auth/profile', { token, errorMessage: 'Session expired or unauthorized' });
}

export function updateProfile(token: string, data: { name?: string; email?: string }): Promise<User> {
  return apiRequest('/auth/profile', {
    method: 'PATCH',
    token,
    body: data,
    errorMessage: 'Failed to update profile',
  });
}

export function changePassword(
  token: string,
  data: { currentPassword: string; newPassword: string }
): Promise<{ message: string }> {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    token,
    body: data,
    errorMessage: 'Failed to change password',
  });
}

export function registerUser(data: { name: string; email: string; password: string }): Promise<User> {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: data,
    errorMessage: 'Failed to register account',
  });
}

export function requestForgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    errorMessage: 'Failed to request reset link',
  });
}

export function resetPasswordWithToken(data: {
  resetToken?: string;
  token?: string;
  newPassword: string;
  email?: string;
}): Promise<{ message: string }> {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: { resetToken: data.resetToken || data.token, newPassword: data.newPassword },
    errorMessage: 'Failed to reset password',
  });
}
