import axios from 'axios';
import { getItem } from './storage';

export const TOKEN_KEY = 'jwt_token';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5101/api';

/**
 * Shared axios instance. Every request is automatically authenticated with the
 * stored JWT. Feature `api.ts` modules build on top of this client so the
 * base URL, headers and auth handling live in a single place.
 */
export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use(async (config) => {
  const token = await getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

/**
 * Registers the callback run when the API rejects the stored JWT (expired, or
 * signed with a different secret), so the app can sign out instead of
 * silently showing empty screens.
 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

http.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    onUnauthorized?.();
  }
  return Promise.reject(error);
});

/**
 * Extracts a human-friendly message from an axios error. Unexpected server
 * errors carry the request's trace id, shown so the user can quote it and it
 * can be found in the API logs.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) return data.message;
    const traceId = data?.traceId ?? error.response?.headers['x-trace-id'];
    if (error.response && error.response.status >= 500 && traceId) {
      return `${fallback}.\nCódigo do erro: ${traceId}`;
    }
  }
  return fallback;
}
