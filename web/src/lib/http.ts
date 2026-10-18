import axios from 'axios';
import { getItem } from './storage';

export const TOKEN_KEY = 'jwt_token';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5101/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90_000,
});

http.interceptors.request.use(async (config) => {
  const token = await getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

http.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    onUnauthorized?.();
  }
  return Promise.reject(error);
});

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
