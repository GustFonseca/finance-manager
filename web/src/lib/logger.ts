import { http } from './http';

const MAX_REPORTS = 10;
const DEDUPE_MS = 10_000;

let sent = 0;
const recent = new Map<string, number>();

type Level = 'error' | 'warning';

export function reportError(error: unknown, level: Level = 'error') {
  const { message, stack } = describe(error);
  const now = Date.now();
  if (sent >= MAX_REPORTS || now - (recent.get(message) ?? 0) < DEDUPE_MS) return;
  sent++;
  recent.set(message, now);

  http
    .post('/client-logs', {
      level,
      message,
      stack,
      url: typeof location !== 'undefined' ? location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    })
    .catch(() => {});
}

function describe(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) return { message: `${error.name}: ${error.message}`, stack: error.stack };
  return { message: typeof error === 'string' ? error : JSON.stringify(error) ?? String(error) };
}

export function installGlobalErrorReporting(): () => void {
  const onError = (event: ErrorEvent) => reportError(event.error ?? event.message);
  const onRejection = (event: PromiseRejectionEvent) => reportError(event.reason);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  return () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
  };
}
