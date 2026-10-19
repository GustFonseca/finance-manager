import fs from 'fs';
import path from 'path';

const SOURCE = fs.readFileSync(path.join(__dirname, '../../../public/sw.js'), 'utf8');
const ORIGIN = 'https://app.test';

type FakeResponse = { body: string; ok: boolean; type: string; clone: () => FakeResponse };
type FakeRequest = { url: string; method: string; mode?: string };

function response(body: string, ok = true): FakeResponse {
  const res: FakeResponse = { body, ok, type: 'basic', clone: () => res };
  return res;
}

function keyOf(request: FakeRequest | string) {
  const url = typeof request === 'string' ? `${ORIGIN}${request}` : request.url;
  return url;
}

function loadWorker(source = SOURCE) {
  const handlers: Record<string, (event: unknown) => void> = {};
  const stores = new Map<string, Map<string, FakeResponse>>();
  const open = async (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      addAll: async (urls: string[]) => urls.forEach((url) => store.set(keyOf(url), response(`shell ${url}`))),
      put: async (request: FakeRequest, res: FakeResponse) => void store.set(keyOf(request), res),
    };
  };
  const caches = {
    open,
    keys: async () => [...stores.keys()],
    delete: async (name: string) => stores.delete(name),
    match: async (request: FakeRequest | string, options?: { ignoreSearch?: boolean }) => {
      const key = keyOf(request);
      for (const store of stores.values()) {
        const hit = store.get(options?.ignoreSearch ? key.split('?')[0] : key);
        if (hit) return hit;
      }
      return undefined;
    },
  };
  const fetch = jest.fn<Promise<FakeResponse>, [FakeRequest]>();
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, handler: (event: unknown) => void) => (handlers[type] = handler),
    skipWaiting: jest.fn(),
    clients: { claim: jest.fn() },
  };
  const ResponseStub = { error: () => response('error', false) };
  new Function('self', 'caches', 'fetch', 'Response', source)(self, caches, fetch, ResponseStub);

  async function lifecycle(type: 'install' | 'activate') {
    let done: Promise<unknown> = Promise.resolve();
    handlers[type]({ waitUntil: (promise: Promise<unknown>) => (done = promise) });
    await done;
  }

  function request(pathname: string, init: Partial<FakeRequest> = {}) {
    const req = { url: pathname.startsWith('http') ? pathname : `${ORIGIN}${pathname}`, method: 'GET', ...init };
    let responded: Promise<FakeResponse> | null = null;
    const pending: Promise<unknown>[] = [];
    handlers.fetch({
      request: req,
      respondWith: (value: Promise<FakeResponse>) => (responded = value),
      waitUntil: (promise: Promise<unknown>) => pending.push(promise),
    });
    return { responded: responded as Promise<FakeResponse> | null, settled: () => Promise.all(pending) };
  }

  return { stores, fetch, self, lifecycle, request };
}

describe('service worker', () => {
  it('names the cache after the build version and drops caches from older builds', async () => {
    const worker = loadWorker(SOURCE.replace(/__BUILD_VERSION__/g, 'abc123'));
    worker.stores.set('finance-manager-v1', new Map());
    worker.stores.set('finance-manager-old', new Map());

    await worker.lifecycle('install');
    expect(worker.self.skipWaiting).toHaveBeenCalled();
    await worker.lifecycle('activate');

    expect([...worker.stores.keys()]).toEqual(['finance-manager-abc123']);
    expect(worker.self.clients.claim).toHaveBeenCalled();
  });

  it('keeps the placeholder name in local builds', async () => {
    const worker = loadWorker();
    await worker.lifecycle('install');
    expect([...worker.stores.keys()]).toEqual(['finance-manager-__BUILD_VERSION__']);
  });

  it('never touches API requests, other origins or writes', () => {
    const worker = loadWorker();
    expect(worker.request('/api/summary').responded).toBeNull();
    expect(worker.request('https://api.test/summary').responded).toBeNull();
    expect(worker.request('/manifest.json', { method: 'POST' }).responded).toBeNull();
    expect(worker.request('/other.txt').responded).toBeNull();
  });

  it('serves pages from the network first and falls back to the cached shell offline', async () => {
    const worker = loadWorker();
    await worker.lifecycle('install');
    worker.fetch.mockResolvedValueOnce(response('nova página'));
    await expect(worker.request('/goals', { mode: 'navigate' }).responded).resolves.toMatchObject({ body: 'nova página' });

    worker.fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(worker.request('/goals?x=1', { mode: 'navigate' }).responded).resolves.toMatchObject({ body: 'nova página' });

    worker.fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(worker.request('/savings', { mode: 'navigate' }).responded).resolves.toMatchObject({ body: 'shell /' });
  });

  it('answers with an error when offline and nothing is cached', async () => {
    const worker = loadWorker();
    worker.fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(worker.request('/goals', { mode: 'navigate' }).responded).resolves.toMatchObject({ ok: false });
  });

  it('serves hashed bundles from the cache first', async () => {
    const worker = loadWorker();
    worker.fetch.mockResolvedValueOnce(response('bundle'));
    await expect(worker.request('/_expo/static/js/app-123.js').responded).resolves.toMatchObject({ body: 'bundle' });
    await expect(worker.request('/_expo/static/js/app-123.js').responded).resolves.toMatchObject({ body: 'bundle' });
    worker.fetch.mockResolvedValueOnce(response('falhou', false));
    await expect(worker.request('/assets/font.ttf').responded).resolves.toMatchObject({ ok: false });
    expect(worker.fetch).toHaveBeenCalledTimes(2);
  });

  it('serves the manifest and icons stale while revalidating them', async () => {
    const worker = loadWorker();
    await worker.lifecycle('install');

    worker.fetch.mockResolvedValueOnce(response('manifest novo'));
    const first = worker.request('/manifest.json');
    await expect(first.responded).resolves.toMatchObject({ body: 'shell /manifest.json' });
    await first.settled();

    worker.fetch.mockResolvedValueOnce(response('manifest mais novo'));
    const second = worker.request('/manifest.json');
    await expect(second.responded).resolves.toMatchObject({ body: 'manifest novo' });
    await second.settled();

    worker.fetch.mockResolvedValueOnce(response('ico'));
    await expect(worker.request('/favicon.ico').responded).resolves.toMatchObject({ body: 'ico' });

    worker.fetch.mockRejectedValueOnce(new Error('offline'));
    const offline = worker.request('/icon.png');
    await expect(offline.responded).resolves.toMatchObject({ body: 'shell /icon.png' });
    await expect(offline.settled()).resolves.toBeDefined();
  });
});
