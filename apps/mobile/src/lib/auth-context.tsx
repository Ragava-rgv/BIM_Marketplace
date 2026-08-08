import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SupportedLanguage, UserDto } from '@machinebazaar/shared';
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from './api';
import i18n from './i18n';

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  authenticate: (tokens: { accessToken: string; refreshToken: string }) => Promise<UserDto>;
  refreshProfile: () => Promise<void>;
  /** Persist active mode preference (BUYER | SELLER) and update local state. */
  switchMode: (mode: 'BUYER' | 'SELLER') => Promise<void>;
  /** Persist language preference to server (signed-in users) and switch the active UI language immediately. */
  switchLanguage: (language: SupportedLanguage) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!(await getAccessToken())) { setUser(null); return null; }
    try {
      const { data } = await api.get<UserDto>('/auth/me');
      setUser(data);
      return data;
    } catch {
      await clearTokens();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => { loadProfile().finally(() => setLoading(false)); }, [loadProfile]);

  const authenticate = useCallback(async (tokens: { accessToken: string; refreshToken: string }) => {
    await setTokens(tokens.accessToken, tokens.refreshToken);
    const profile = await loadProfile();
    if (!profile) throw new Error('Could not load profile after sign in.');
    return profile;
  }, [loadProfile]);

  const switchMode = useCallback(async (mode: 'BUYER' | 'SELLER') => {
    const { data } = await api.post<UserDto>('/auth/switch-mode', { mode });
    setUser(data);
  }, []);

  const switchLanguage = useCallback(async (language: SupportedLanguage) => {
    await i18n.changeLanguage(language.toLowerCase());
    if (!(await getAccessToken())) return;
    const { data } = await api.post<UserDto>('/auth/language', { language });
    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    try { if (refreshToken) await api.post('/auth/logout', { refreshToken }); } catch {}
    await clearTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, authenticate, refreshProfile: async () => { await loadProfile(); }, switchMode, switchLanguage, logout }),
    [user, loading, authenticate, loadProfile, switchMode, switchLanguage, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
