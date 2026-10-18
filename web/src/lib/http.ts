import { trackRequest } from './serverWake';
import { getItem } from './storage';

export const TOKEN_KEY = 'jwt_token';
export const REQUEST_TIMEOUT_MS = 90_000;

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5101/api';

type Params = Record<string, string | number | boolean | null | undefined>;

export type RequestConfig = {
  params?: Params;
  headers?: Record<string, string>;
};

export type HttpResponse<T> = {
  data: T;
  status: number;
  headers: Record<string, string>;
};

export class HttpError extends Error {
  readonly response?: HttpResponse<any>;

  constructor(message: string, response?: HttpResponse<any>) {
    super(message);
    this.name = 'HttpError';
    this.response = response;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function buildUrl(path: string, params?: Params): string {
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) query.append(key, String(value));
  });
  const text = query.toString();
  return `${API_BASE_URL}${path}${text ? `?${text}` : ''}`;
}

function headersOf(response: Response): Record<string, string> {
  const result: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

async function bodyOf(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  const type = response.headers.get('content-type') ?? '';
  if (!type.includes('json')) return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(method: string, path: string, body?: unknown, config: RequestConfig = {}): Promise<HttpResponse<T>> {
  const headers: Record<string, string> = { ...config.headers };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (isForm) delete headers['Content-Type'];
  else if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = await getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const done = trackRequest();
  try {
    let response: Response;
    try {
      response = await fetch(buildUrl(path, config.params), {
        method,
        headers,
        body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      throw new HttpError(controller.signal.aborted ? 'timeout' : error instanceof Error ? error.message : 'network error');
    }
    const result: HttpResponse<T> = { data: (await bodyOf(response)) as T, status: response.status, headers: headersOf(response) };
    if (!response.ok) {
      if (response.status === 401) onUnauthorized?.();
      throw new HttpError(`Request failed with status ${response.status}`, result);
    }
    return result;
  } finally {
    clearTimeout(timer);
    done();
  }
}

export const http = {
  get: <T = unknown>(path: string, config?: RequestConfig) => request<T>('GET', path, undefined, config),
  delete: <T = unknown>(path: string, config?: RequestConfig) => request<T>('DELETE', path, undefined, config),
  post: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) => request<T>('POST', path, body ?? undefined, config),
  put: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) => request<T>('PUT', path, body ?? undefined, config),
};

export function getErrorMessage(error: unknown, fallback: string): string {
  if (isHttpError(error) && error.response) {
    const data = error.response.data;
    if (data?.message) return data.message;
    const traceId = data?.traceId ?? error.response.headers['x-trace-id'];
    if (error.response.status >= 500 && traceId) {
      return `${fallback}.\nCódigo do erro: ${traceId}`;
    }
  }
  return fallback;
}
