import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthTokensDto, SupportedLanguage, UserDto } from '../shared';
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from './api';
import i18n from './i18n';

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  /** Persist a fresh token pair and load the authenticated profile. */
  authenticate: (tokens: { accessToken: string; refreshToken: string }) => Promise<UserDto>;
  refreshProfile: () => Promise<void>;
  /** Persist active mode preference (BUYER | SELLER) to server and update local state. */
  switchMode: (mode: 'BUYER' | 'SELLER') => Promise<void>;
  /** Persist language preference to server (signed-in users) and switch the active UI language immediately. */
  switchLanguage: (language: SupportedLanguage) => Promise<void>;
  /** First-time enablement of seller capability (requires GST ACTIVE) — sets canSell + role + activeMode. */
  switchToSeller: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }
    try {
      const { data } = await api.get<UserDto>('/auth/me');
      setUser(data);
      return data;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    loadProfile().finally(() => setLoading(false));
  }, [loadProfile]);

  const authenticate = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      const profile = await loadProfile();
      if (!profile) {
        throw new Error('Could not load your profile after signing in.');
      }
      return profile;
    },
    [loadProfile],
  );

  const switchMode = useCallback(async (mode: 'BUYER' | 'SELLER') => {
    const { data } = await api.post<UserDto>('/auth/switch-mode', { mode });
    setUser(data);
  }, []);

  const switchLanguage = useCallback(async (language: SupportedLanguage) => {
    await i18n.changeLanguage(language.toLowerCase());
    if (!getAccessToken()) return;
    const { data } = await api.post<UserDto>('/auth/language', { language });
    setUser(data);
  }, []);

  const switchToSeller = useCallback(async () => {
    const { data } = await api.post<AuthTokensDto>('/auth/switch-to-seller');
    await authenticate(data);
  }, [authenticate]);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // best-effort: clear local state regardless of server response
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, authenticate, refreshProfile: async () => { await loadProfile(); }, switchMode, switchLanguage, switchToSeller, logout }),
    [user, loading, authenticate, loadProfile, switchMode, switchLanguage, switchToSeller, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
