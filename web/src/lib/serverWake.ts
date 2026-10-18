import { useSyncExternalStore } from 'react';

export const SLOW_REQUEST_MS = 4000;

let slowRequests = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function trackRequest(): () => void {
  let slow = false;
  const timer = setTimeout(() => {
    slow = true;
    slowRequests++;
    emit();
  }, SLOW_REQUEST_MS);
  return () => {
    clearTimeout(timer);
    if (!slow) return;
    slow = false;
    slowRequests--;
    emit();
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isServerWaking(): boolean {
  return slowRequests > 0;
}

export function useServerWaking(): boolean {
  return useSyncExternalStore(subscribe, isServerWaking, isServerWaking);
}
