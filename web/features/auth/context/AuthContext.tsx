'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginCredentials } from '../types';
import { loginUser, fetchUserProfile } from '../api/auth.api';

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

      // Redirect user to their role-specific dashboard
      if (authUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/employee/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

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

