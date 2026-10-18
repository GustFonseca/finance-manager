import { QueryClient } from '@tanstack/react-query';
import {
  clearOfflineCache,
  OFFLINE_CACHE_KEY,
  OFFLINE_CACHE_MAX_CHARS,
  persistOfflineCache,
  restoreOfflineCache,
} from '../offlineCache';

function stored() {
  return JSON.parse(localStorage.getItem(OFFLINE_CACHE_KEY) ?? 'null');
}

function store(value: unknown) {
  localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(value));
}

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
});

afterEach(() => {
  client.clear();
  jest.restoreAllMocks();
});

describe('restoreOfflineCache', () => {
  it('puts the saved summary data back with its original age', () => {
    store([
      { key: ['summary', { start: 's' }], data: { balanceCents: 10 }, updatedAt: 1000 },
      { key: ['transactions'], data: ['x'], updatedAt: 1000 },
      { key: 'summary', data: 1, updatedAt: 1 },
      { key: ['summary', 'daily'], data: 2, updatedAt: 'old' },
      null,
    ]);

    restoreOfflineCache(client);

    expect(client.getQueryData(['summary', { start: 's' }])).toEqual({ balanceCents: 10 });
    expect(client.getQueryState(['summary', { start: 's' }])?.dataUpdatedAt).toBe(1000);
    expect(client.getQueryData(['transactions'])).toBeUndefined();
    expect(client.getQueryData(['summary', 'daily'])).toBeUndefined();
  });

  it('keeps fresher data already in memory', () => {
    client.setQueryData(['summary', 'x'], 'novo');
    store([{ key: ['summary', 'x'], data: 'velho', updatedAt: 1 }]);

    restoreOfflineCache(client);

    expect(client.getQueryData(['summary', 'x'])).toBe('novo');
  });

  it('ignores missing, broken or unexpected storage', () => {
    restoreOfflineCache(client);
    localStorage.setItem(OFFLINE_CACHE_KEY, '{broken');
    restoreOfflineCache(client);
    store({ key: ['summary'] });
    restoreOfflineCache(client);
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    restoreOfflineCache(client);

    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
});

describe('persistOfflineCache', () => {
  it('saves successful summary queries, newest first, replacing older copies', async () => {
    const stop = persistOfflineCache(client);
    await client.fetchQuery({ queryKey: ['summary', 'a'], queryFn: async () => 1 });
    await client.fetchQuery({ queryKey: ['transactions'], queryFn: async () => 'ignorado' });
    await client.fetchQuery({ queryKey: ['summary', 'b'], queryFn: async () => 2 });
    await client.fetchQuery({ queryKey: ['summary', 'a'], queryFn: async () => 3, staleTime: 0 });

    const entries = stored();
    expect(entries.map((e: { key: unknown; data: unknown }) => [e.key, e.data])).toEqual([
      [['summary', 'a'], 3],
      [['summary', 'b'], 2],
    ]);
    expect(typeof entries[0].updatedAt).toBe('number');

    stop();
    await client.fetchQuery({ queryKey: ['summary', 'c'], queryFn: async () => 4 });
    expect(stored()).toHaveLength(2);
  });

  it('ignores failed queries', async () => {
    persistOfflineCache(client);
    await expect(client.fetchQuery({ queryKey: ['summary', 'x'], queryFn: () => Promise.reject(new Error('x')) })).rejects.toThrow();
    expect(stored()).toBeNull();
  });

  it('drops the oldest entries to stay under the size limit', async () => {
    const big = 'x'.repeat(OFFLINE_CACHE_MAX_CHARS / 2);
    const now = jest.spyOn(Date, 'now');
    persistOfflineCache(client);
    now.mockReturnValue(1);
    await client.fetchQuery({ queryKey: ['summary', 'old'], queryFn: async () => big });
    now.mockReturnValue(2);
    await client.fetchQuery({ queryKey: ['summary', 'new'], queryFn: async () => big });

    expect(stored().map((e: { key: unknown }) => e.key)).toEqual([['summary', 'new']]);
  });

  it('keeps working when the storage refuses to save', async () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    persistOfflineCache(client);

    await expect(client.fetchQuery({ queryKey: ['summary', 'x'], queryFn: async () => 1 })).resolves.toBe(1);
  });
});

describe('clearOfflineCache', () => {
  it('forgets the saved data and tolerates blocked storage', () => {
    store([]);
    clearOfflineCache();
    expect(localStorage.getItem(OFFLINE_CACHE_KEY)).toBeNull();

    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => clearOfflineCache()).not.toThrow();
  });
});
