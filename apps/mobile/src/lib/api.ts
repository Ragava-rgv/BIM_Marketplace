import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'mb_access_token';
const REFRESH_TOKEN_KEY = 'mb_refresh_token';

export function getAccessToken(): string | null { return localStorage.getItem(ACCESS_TOKEN_KEY); }
export function getRefreshToken(): string | null { return localStorage.getItem(REFRESH_TOKEN_KEY); }
export function setTokens(a: string, r: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, a);
  localStorage.setItem(REFRESH_TOKEN_KEY, r);
}
export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      '/api/auth/refresh', { refreshToken },
    );
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && getRefreshToken()) {
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
