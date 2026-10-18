import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export const OFFLINE_CACHE_KEY = 'fm_offline_summary';
export const OFFLINE_CACHE_MAX_CHARS = 1_000_000;

type Entry = { key: QueryKey; data: unknown; updatedAt: number };

function isSummaryKey(key: QueryKey): boolean {
  return key[0] === queryKeys.summary[0];
}

function readEntries(): Entry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((e) => Array.isArray(e?.key) && typeof e.updatedAt === 'number') : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: Entry[]) {
  try {
    let list = [...entries].sort((a, b) => b.updatedAt - a.updatedAt);
    let text = JSON.stringify(list);
    while (text.length > OFFLINE_CACHE_MAX_CHARS && list.length > 0) {
      list = list.slice(0, -1);
      text = JSON.stringify(list);
    }
    localStorage.setItem(OFFLINE_CACHE_KEY, text);
  } catch {
    return;
  }
}

export function restoreOfflineCache(client: QueryClient): void {
  readEntries().forEach((entry) => {
    if (isSummaryKey(entry.key) && client.getQueryData(entry.key) === undefined) {
      client.setQueryData(entry.key, entry.data, { updatedAt: entry.updatedAt });
    }
  });
}

export function persistOfflineCache(client: QueryClient): () => void {
  return client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'success') return;
    const { queryKey, state } = event.query;
    if (!isSummaryKey(queryKey)) return;
    const id = JSON.stringify(queryKey);
    const others = readEntries().filter((entry) => JSON.stringify(entry.key) !== id);
    writeEntries([{ key: queryKey, data: state.data, updatedAt: state.dataUpdatedAt }, ...others]);
  });
}

export function clearOfflineCache(): void {
  try {
    localStorage.removeItem(OFFLINE_CACHE_KEY);
  } catch {
    return;
  }
}
