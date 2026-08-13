import type { ApiEnvelope, ApiErrorBody, ListMeta } from './types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const ACCESS_KEY = 'hajj_admin_access_token';
const REFRESH_KEY = 'hajj_admin_refresh_token';

export class ApiError extends Error {
  status: number;
  details?: { path: string; message: string }[];

  constructor(status: number, message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE_URL}/api/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const body = (await res.json()) as ApiEnvelope<{ accessToken: string; refreshToken: string }>;
        setTokens(body.data.accessToken, body.data.refreshToken);
        return body.data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  isForm?: boolean;
  skipAuth?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']) {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function rawRequest(path: string, options: RequestOptions, token: string | null) {
  const headers: Record<string, string> = {};
  if (!options.isForm) headers['Content-Type'] = 'application/json';
  if (token && !options.skipAuth) headers.Authorization = `Bearer ${token}`;

  return fetch(buildUrl(path, options.query), {
    method: options.method || 'GET',
    headers,
    body: options.isForm ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
  });
}

/** Every admin request goes through here — attaches the token, retries once after a silent refresh on 401. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<{ data: T; meta?: ListMeta }> {
  let token = options.skipAuth ? null : getAccessToken();
  let res = await rawRequest(path, options, token);

  if (res.status === 401 && !options.skipAuth) {
    token = await refreshAccessToken();
    if (token) {
      res = await rawRequest(path, options, token);
    }
  }

  if (res.status === 204) return { data: undefined as T };

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const err = body as ApiErrorBody | null;
    if (res.status === 401) clearTokens();
    throw new ApiError(res.status, err?.error?.message || `Request failed (${res.status})`, err?.error?.details);
  }

  const envelope = body as ApiEnvelope<T>;
  return { data: envelope.data, meta: envelope.meta };
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => apiRequest<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PUT', body }),
  delete: <T>(path: string, query?: RequestOptions['query']) => apiRequest<T>(path, { method: 'DELETE', query }),
  upload: <T>(path: string, form: FormData) => apiRequest<T>(path, { method: 'POST', body: form, isForm: true }),
  skipAuth: {
    post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body, skipAuth: true }),
  },
};
