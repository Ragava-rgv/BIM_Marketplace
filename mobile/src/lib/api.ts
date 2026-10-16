import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

const ACCESS_TOKEN_KEY = 'mb_access_token';
const REFRESH_TOKEN_KEY = 'mb_refresh_token';

// Keychain (iOS) / Keystore-backed EncryptedSharedPreferences (Android) via the Capacitor
// secure-storage plugin — falls back to prefixed localStorage automatically when running
// in a plain browser (dev server, or this app loaded as a website), so the same code path
// works everywhere without a native/web branch here.
export async function getAccessToken(): Promise<string | null> {
  try {
    return (await SecureStoragePlugin.get({ key: ACCESS_TOKEN_KEY })).value;
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return (await SecureStoragePlugin.get({ key: REFRESH_TOKEN_KEY })).value;
  } catch {
    return null;
  }
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await SecureStoragePlugin.set({ key: ACCESS_TOKEN_KEY, value: access });
  await SecureStoragePlugin.set({ key: REFRESH_TOKEN_KEY, value: refresh });
}

export async function clearTokens(): Promise<void> {
  await SecureStoragePlugin.remove({ key: ACCESS_TOKEN_KEY }).catch(() => {});
  await SecureStoragePlugin.remove({ key: REFRESH_TOKEN_KEY }).catch(() => {});
}

// In the browser (dev server or plain web deploy), '/api' is proxied/same-origin.
// In a Capacitor-bundled native build there's no such proxy — the WebView's origin
// is capacitor://localhost, so the API base must be an absolute production URL,
// supplied at build time via VITE_API_BASE_URL (see .env.production).
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`, { refreshToken },
    );
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    await clearTokens();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && (await getRefreshToken())) {
      original._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => { refreshPromise = null; });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.set?.('Authorization', `Bearer ${newToken}`);
        return api.request(original);
      }
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Cannot connect to the server. Make sure the API is running and try again.';
    const data = error.response.data as { message?: string | string[] } | undefined;
    if (data && typeof data === 'object' && data.message) {
      return Array.isArray(data.message) ? data.message.join(' ') : data.message;
    }
    // Proxy returned a non-JSON body (e.g. 502 when API server is down)
    if (error.response.status >= 500) return 'Cannot reach the API server. Please start the API and try again.';
  }
  return fallback;
}
