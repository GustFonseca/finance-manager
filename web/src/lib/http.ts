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

/** Extracts a human-friendly message from an axios error. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}
