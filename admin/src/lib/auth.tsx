import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, clearTokens, getAccessToken, setTokens } from './api';
import type { AdminUser } from './types';

interface AuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    if (!getAccessToken()) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<AdminUser>('/api/admin/me');
      setAdmin(data);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.skipAuth.post<{ admin: AdminUser; accessToken: string; refreshToken: string }>(
      '/api/admin/auth/login',
      { email, password },
    );
    setTokens(data.accessToken, data.refreshToken);
    setAdmin(data.admin);
  }

  function logout() {
    api.post('/api/admin/auth/logout').catch(() => {});
    clearTokens();
    setAdmin(null);
  }

  return <AuthContext.Provider value={{ admin, loading, login, logout, refreshMe }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
