'use client';

import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { User, LoginCredentials } from '../types';
import { loginUser, fetchUserProfile } from '../api/auth.api';
import { setUnauthorizedHandler } from '@/lib/api-client';

/** Milliseconds until the JWT's `exp` claim, or null if it cannot be read */
function msUntilExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 - Date.now() : null;
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authentication state from localStorage on load
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedToken = localStorage.getItem('auth_token');
        const savedUserStr = localStorage.getItem('auth_user');

        if (savedToken && savedUserStr) {

          setToken(savedToken);
          setUser(JSON.parse(savedUserStr));

          // Silently verify with backend
          try {
            const profile = await fetchUserProfile(savedToken);
            setUser(profile);
            localStorage.setItem('auth_user', JSON.stringify(profile));
          } catch {
            // If token expired, clear
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        console.error('Session restoration error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();

  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await loginUser(credentials);
      const { user: authUser, accessToken } = response;

      setUser(authUser);
      setToken(accessToken);

      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      // The login page redirects to the role dashboard once `user` is set
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    // Drop cached API data so the next user never sees the previous user's records
    queryClient.clear();
    router.replace('/login');
  }, [router, queryClient]);

  // Any API call rejected with 401 (expired or invalid token) ends the session
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Also log out exactly when the token expires, even if no request is made
  useEffect(() => {
    if (!token) return;
    const remaining = msUntilExpiry(token);
    if (remaining === null) return;
    const timer = setTimeout(logout, Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [token, logout]);

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('auth_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

