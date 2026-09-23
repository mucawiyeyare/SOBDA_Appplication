import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL, REQUEST_TIMEOUT_MS } from '../constants/config';
import { getToken } from '../services/secureStorage';

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  isNetworkError: boolean;

  constructor(message: string, opts: { status?: number; data?: unknown; isNetworkError?: boolean } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.data = opts.data;
    this.isNetworkError = opts.isNetworkError ?? false;
  }
}

// The auth store registers this so a 401 anywhere logs the user out
// without the API layer importing the store (avoids a circular dependency).
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

const http = axios.create({ baseURL: API_URL, timeout: REQUEST_TIMEOUT_MS });

http.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    if (!error.response) {
      const timedOut = error.code === 'ECONNABORTED';
      return Promise.reject(
        new ApiError(
          timedOut
            ? 'The server took too long to respond. Please try again.'
            : 'No connection. Check your internet and try again.',
          { isNetworkError: true },
        ),
      );
    }
    const { status, data } = error.response;
    // Only an authenticated request failing with 401 means the token is bad;
    // a 401 from /login itself is just wrong credentials.
    if (status === 401 && error.config?.headers?.Authorization) onUnauthorized?.();
    return Promise.reject(new ApiError(data?.message || `Request failed (${status})`, { status, data }));
  },
);

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => http.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    http.post<T>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    http.put<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    http.patch<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) => http.delete<T>(url, config).then((r) => r.data),
};

export const errorMessage = (e: unknown): string =>
  e instanceof Error ? e.message : 'Something went wrong. Please try again.';
