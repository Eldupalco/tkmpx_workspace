import { apiRequest } from '@/lib/api-client';
import {
  AuthResponse,
  ChangePasswordData,
  LoginCredentials,
  RegisterData,
  ResetPasswordData,
  UpdateProfileData,
  User,
} from '../types';

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

export function updateProfile(token: string, data: UpdateProfileData): Promise<User> {
  return apiRequest('/auth/profile', {
    method: 'PATCH',
    token,
    body: data,
    errorMessage: 'Failed to update profile',
  });
}

export function changePassword(token: string, data: ChangePasswordData): Promise<{ message: string }> {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    token,
    body: data,
    errorMessage: 'Failed to change password',
  });
}

export function registerUser(data: RegisterData): Promise<User> {
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

export function resetPasswordWithToken(data: ResetPasswordData): Promise<{ message: string }> {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: data,
    errorMessage: 'Failed to reset password',
  });
}
