import type { HttpError as HttpErrorType, HttpResponse } from '@/lib/http';

const { HttpError } = jest.requireActual<typeof import('@/lib/http')>('@/lib/http');

export function httpResponse<T>(data: T, status = 200, headers: Record<string, string> = {}): HttpResponse<T> {
  return { data, status, headers };
}

export function httpError(status: number, data?: unknown, headers: Record<string, string> = {}): HttpErrorType {
  return new HttpError(`Request failed with status ${status}`, { data, status, headers });
}

export function apiError(message: string, status = 400): HttpErrorType {
  return httpError(status, { message });
}
