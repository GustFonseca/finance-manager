import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { monthKeyOf, monthRange } from './periods';
import { queryKeys } from './queryKeys';

export const OFFLINE_CACHE_VERSION = 2;
export const OFFLINE_CACHE_PREFIX = 'fm_offline';
export const OFFLINE_CACHE_MAX_CHARS = 1_000_000;
export const OFFLINE_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60_000;
export const OFFLINE_CACHE_WRITE_DELAY_MS = 1000;

type Entry = { key: QueryKey; data: unknown; updatedAt: number };

let owner: string | null = null;
let entries = new Map<string, Entry>();
let pending: { timer: ReturnType<typeof setTimeout>; run: () => void } | null = null;

export function offlineCacheKey(email: string): string {
  return `${OFFLINE_CACHE_PREFIX}:v${OFFLINE_CACHE_VERSION}:${email.trim().toLowerCase()}`;
}

function isCurrentMonthFilter(value: unknown, extra: string[] = []): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const { start, end, ...rest } = value as Record<string, unknown>;
  const month = monthRange(monthKeyOf(new Date()));
  const others = Object.entries(rest).filter(([name, v]) => v !== undefined && !extra.includes(name));
  return start === month.start && end === month.end && others.length === 0;
}

export function isPersistedKey(key: QueryKey): boolean {
  if (key[0] !== queryKeys.summary[0]) return false;
  if (key.length === 2) return isCurrentMonthFilter(key[1]);
  if (key.length === 3 && key[1] === 'forecast') return isCurrentMonthFilter(key[2]);
  if (key.length === 4 && key[1] === 'daily') return isCurrentMonthFilter(key[2]) && typeof key[3] === 'string';
  return false;
}

function isValidEntry(entry: unknown): entry is Entry {
  const candidate = entry as Entry | null;
  return Array.isArray(candidate?.key) && typeof candidate?.updatedAt === 'number';
}

function isFresh(entry: Entry): boolean {
  return Date.now() - entry.updatedAt <= OFFLINE_CACHE_MAX_AGE_MS;
}

function storedKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(OFFLINE_CACHE_PREFIX)) keys.push(key);
  }
  return keys;
}

function removeOtherCaches(keep: string | null) {
  storedKeys()
    .filter((key) => key !== keep)
    .forEach((key) => localStorage.removeItem(key));
}

function readEntries(storageKey: string): Entry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isValidEntry) : [];
  } catch {
    return [];
  }
}

function flush(storageKey: string) {
  const parts: string[] = [];
  let size = 2;
  const list = [...entries.values()].filter(isFresh).sort((a, b) => b.updatedAt - a.updatedAt);
  for (const entry of list) {
    const text = JSON.stringify(entry);
    const added = text.length + (parts.length ? 1 : 0);
    if (size + added > OFFLINE_CACHE_MAX_CHARS) continue;
    parts.push(text);
    size += added;
  }
  try {
    localStorage.setItem(storageKey, `[${parts.join(',')}]`);
  } catch {
    return;
  }
}

function cancelWrite() {
  if (pending) clearTimeout(pending.timer);
  pending = null;
}

function scheduleWrite(storageKey: string) {
  cancelWrite();
  const run = () => {
    pending = null;
    flush(storageKey);
  };
  pending = { timer: setTimeout(run, OFFLINE_CACHE_WRITE_DELAY_MS), run };
}

export function restoreOfflineCache(client: QueryClient, email: string): void {
  cancelWrite();
  owner = email;
  entries = new Map();
  try {
    const storageKey = offlineCacheKey(email);
    removeOtherCaches(storageKey);
    readEntries(storageKey)
      .filter((entry) => isPersistedKey(entry.key) && isFresh(entry))
      .forEach((entry) => {
        entries.set(JSON.stringify(entry.key), entry);
        if (client.getQueryData(entry.key) === undefined) {
          client.setQueryData(entry.key, entry.data, { updatedAt: entry.updatedAt });
        }
      });
  } catch {
    return;
  }
}

export function persistOfflineCache(client: QueryClient): () => void {
  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success' || !owner) return;
    const { queryKey, state } = event.query;
    if (!isPersistedKey(queryKey)) return;
    entries.set(JSON.stringify(queryKey), { key: queryKey, data: state.data, updatedAt: state.dataUpdatedAt });
    scheduleWrite(offlineCacheKey(owner));
  });
  return () => {
    unsubscribe();
    const write = pending;
    if (!write) return;
    cancelWrite();
    write.run();
  };
}

export function clearOfflineCache(): void {
  cancelWrite();
  owner = null;
  entries = new Map();
  try {
    removeOtherCaches(null);
  } catch {
    return;
  }
}
