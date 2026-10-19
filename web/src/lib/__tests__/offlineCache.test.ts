import { QueryClient } from '@tanstack/react-query';
import {
  clearOfflineCache,
  isPersistedKey,
  OFFLINE_CACHE_MAX_AGE_MS,
  OFFLINE_CACHE_MAX_CHARS,
  OFFLINE_CACHE_PREFIX,
  OFFLINE_CACHE_WRITE_DELAY_MS,
  offlineCacheKey,
  persistOfflineCache,
  restoreOfflineCache,
} from '../offlineCache';
import { monthKeyOf, monthRange } from '../periods';

const EMAIL = 'g@x.com';
const KEY = offlineCacheKey(EMAIL);

function currentMonth() {
  return monthRange(monthKeyOf(new Date()));
}

function stored() {
  return JSON.parse(localStorage.getItem(KEY) ?? 'null');
}

function store(value: unknown, key = KEY) {
  localStorage.setItem(key, JSON.stringify(value));
}

function storedKeys() {
  return stored().map((entry: { key: unknown }) => entry.key);
}

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});

afterEach(() => {
  clearOfflineCache();
  client.clear();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('offlineCacheKey', () => {
  it('versions the key and scopes it to the user', () => {
    expect(offlineCacheKey(' G@X.com ')).toBe(`${OFFLINE_CACHE_PREFIX}:v2:g@x.com`);
  });
});

describe('isPersistedKey', () => {
  it('keeps only the base summary, forecast and daily budget of the current month', () => {
    const month = currentMonth();
    expect(isPersistedKey(['summary', month])).toBe(true);
    expect(isPersistedKey(['summary', { ...month, accountId: undefined }])).toBe(true);
    expect(isPersistedKey(['summary', 'forecast', month])).toBe(true);
    expect(isPersistedKey(['summary', 'daily', month, 'day'])).toBe(true);

    expect(isPersistedKey(['summary', { ...month, accountId: 'a1' }])).toBe(false);
    expect(isPersistedKey(['summary', monthRange('2020-01')])).toBe(false);
    expect(isPersistedKey(['summary', 'daily', month, 5])).toBe(false);
    expect(isPersistedKey(['summary', 'recurring', month])).toBe(false);
    expect(isPersistedKey(['summary', 'avoidable', month])).toBe(false);
    expect(isPersistedKey(['summary', 'planning', 'tax', 2026])).toBe(false);
    expect(isPersistedKey(['summary', null])).toBe(false);
    expect(isPersistedKey(['summary', [month]])).toBe(false);
    expect(isPersistedKey(['transactions', month])).toBe(false);
  });
});

describe('restoreOfflineCache', () => {
  it('puts the saved data back with its original age', () => {
    const month = currentMonth();
    const now = Date.now();
    store([
      { key: ['summary', month], data: { balanceCents: 10 }, updatedAt: now - 1000 },
      { key: ['summary', 'forecast', month], data: 'velho', updatedAt: now - OFFLINE_CACHE_MAX_AGE_MS - 1 },
      { key: ['summary', 'recurring', month], data: ['x'], updatedAt: now },
      { key: 'summary', data: 1, updatedAt: 1 },
      { key: ['summary', 'daily', month, 'd'], data: 2, updatedAt: 'old' },
      null,
    ]);

    restoreOfflineCache(client, EMAIL);

    expect(client.getQueryData(['summary', month])).toEqual({ balanceCents: 10 });
    expect(client.getQueryState(['summary', month])?.dataUpdatedAt).toBe(now - 1000);
    expect(client.getQueryData(['summary', 'forecast', month])).toBeUndefined();
    expect(client.getQueryData(['summary', 'recurring', month])).toBeUndefined();
    expect(client.getQueryData(['summary', 'daily', month, 'd'])).toBeUndefined();
  });

  it('keeps fresher data already in memory', () => {
    const month = currentMonth();
    client.setQueryData(['summary', month], 'novo');
    store([{ key: ['summary', month], data: 'velho', updatedAt: Date.now() }]);

    restoreOfflineCache(client, EMAIL);

    expect(client.getQueryData(['summary', month])).toBe('novo');
  });

  it('removes copies left by other users, older versions and the legacy key', () => {
    const month = currentMonth();
    store([{ key: ['summary', month], data: 'outro', updatedAt: Date.now() }], offlineCacheKey('outra@x.com'));
    store([], `${OFFLINE_CACHE_PREFIX}:v1:${EMAIL}`);
    store([], 'fm_offline_summary');
    localStorage.setItem('jwt_token', 'tok');

    restoreOfflineCache(client, EMAIL);

    expect(client.getQueryData(['summary', month])).toBeUndefined();
    expect(localStorage.getItem(offlineCacheKey('outra@x.com'))).toBeNull();
    expect(localStorage.getItem(`${OFFLINE_CACHE_PREFIX}:v1:${EMAIL}`)).toBeNull();
    expect(localStorage.getItem('fm_offline_summary')).toBeNull();
    expect(localStorage.getItem('jwt_token')).toBe('tok');
  });

  it('ignores missing, broken or unexpected storage', () => {
    restoreOfflineCache(client, EMAIL);
    localStorage.setItem(KEY, '{broken');
    restoreOfflineCache(client, EMAIL);
    store({ key: ['summary'] });
    restoreOfflineCache(client, EMAIL);
    jest.spyOn(Storage.prototype, 'key').mockImplementation(() => {
      throw new Error('blocked');
    });
    restoreOfflineCache(client, EMAIL);

    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
});

describe('persistOfflineCache', () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick', 'setImmediate'] });
  });

  async function fetch(key: unknown[], data: unknown, options: { staleTime?: number } = {}) {
    await client.fetchQuery({ queryKey: key, queryFn: async () => data, ...options });
  }

  it('waits for writes to settle before saving the allowed queries, newest first', async () => {
    const month = currentMonth();
    restoreOfflineCache(client, EMAIL);
    const stop = persistOfflineCache(client);
    const base = Date.now();
    jest.setSystemTime(base + 1_000);
    await fetch(['summary', month], 1);
    await fetch(['transactions'], 'ignorado');
    await fetch(['summary', 'recurring', month], 'ignorado');
    jest.setSystemTime(base + 2_000);
    await fetch(['summary', 'forecast', month], 2);
    expect(stored()).toBeNull();

    jest.advanceTimersByTime(OFFLINE_CACHE_WRITE_DELAY_MS);
    expect(storedKeys()).toEqual([['summary', 'forecast', month], ['summary', month]]);

    jest.setSystemTime(base + 3_000);
    await fetch(['summary', month], 3, { staleTime: 0 });
    jest.advanceTimersByTime(OFFLINE_CACHE_WRITE_DELAY_MS);
    expect(stored().map((e: { data: unknown }) => e.data)).toEqual([3, 2]);

    stop();
    await fetch(['summary', 'daily', month, 'd'], 4);
    jest.advanceTimersByTime(OFFLINE_CACHE_WRITE_DELAY_MS);
    expect(stored()).toHaveLength(2);
  });

  it('saves a pending write when it stops', async () => {
    const month = currentMonth();
    restoreOfflineCache(client, EMAIL);
    const stop = persistOfflineCache(client);
    await fetch(['summary', month], 1);

    stop();

    expect(storedKeys()).toEqual([['summary', month]]);
  });

  it('does not save anything while nobody is signed in', async () => {
    const stop = persistOfflineCache(client);
    await fetch(['summary', currentMonth()], 1);
    jest.advanceTimersByTime(OFFLINE_CACHE_WRITE_DELAY_MS);
    stop();

    expect(localStorage.length).toBe(0);
  });

  it('ignores failed queries', async () => {
    restoreOfflineCache(client, EMAIL);
    persistOfflineCache(client);
    await expect(
      client.fetchQuery({ queryKey: ['summary', currentMonth()], queryFn: () => Promise.reject(new Error('x')) })
    ).rejects.toThrow();
    jest.advanceTimersByTime(OFFLINE_CACHE_WRITE_DELAY_MS);
    expect(stored()).toBeNull();
  });

  it('drops the oldest entries to stay under the size limit', async () => {
    const month = currentMonth();
    const big = 'x'.repeat(OFFLINE_CACHE_MAX_CHARS / 2);
    restoreOfflineCache(client, EMAIL);
    persistOfflineCache(client);
    jest.setSystemTime(Date.now());
    await fetch(['summary', month], big);
    jest.setSystemTime(Date.now() + 1);
    await fetch(['summary', 'forecast', month], big);
    jest.setSystemTime(Date.now() + 1);
    await fetch(['summary', 'daily', month, 'd'], 'pequeno');
    jest.advanceTimersByTime(OFFLINE_CACHE_WRITE_DELAY_MS);

    expect(storedKeys()).toEqual([['summary', 'daily', month, 'd'], ['summary', 'forecast', month]]);
  });

  it('drops entries older than a week when saving', async () => {
    const month = currentMonth();
    store([{ key: ['summary', month], data: 1, updatedAt: Date.now() }]);
    restoreOfflineCache(client, EMAIL);
    persistOfflineCache(client);
    jest.setSystemTime(Date.now() + OFFLINE_CACHE_MAX_AGE_MS + 1);
    await fetch(['summary', 'forecast', month], 2);
    jest.advanceTimersByTime(OFFLINE_CACHE_WRITE_DELAY_MS);

    expect(storedKeys()).toEqual([['summary', 'forecast', month]]);
  });

  it('keeps working when the storage refuses to save', async () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    restoreOfflineCache(client, EMAIL);
    persistOfflineCache(client);

    await expect(client.fetchQuery({ queryKey: ['summary', currentMonth()], queryFn: async () => 1 })).resolves.toBe(1);
    expect(() => jest.advanceTimersByTime(OFFLINE_CACHE_WRITE_DELAY_MS)).not.toThrow();
  });

  it('cancels a pending write when the user signs out', async () => {
    restoreOfflineCache(client, EMAIL);
    persistOfflineCache(client);
    await fetch(['summary', currentMonth()], 1);

    clearOfflineCache();
    jest.advanceTimersByTime(OFFLINE_CACHE_WRITE_DELAY_MS);

    expect(stored()).toBeNull();
  });
});

describe('clearOfflineCache', () => {
  it('forgets every saved copy and tolerates blocked storage', () => {
    store([]);
    store([], 'fm_offline_summary');
    localStorage.setItem('jwt_token', 'tok');
    clearOfflineCache();
    expect(localStorage.getItem(KEY)).toBeNull();
    expect(localStorage.getItem('fm_offline_summary')).toBeNull();
    expect(localStorage.getItem('jwt_token')).toBe('tok');

    jest.spyOn(Storage.prototype, 'key').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => clearOfflineCache()).not.toThrow();
  });
});
