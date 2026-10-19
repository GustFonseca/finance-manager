const BUILD_VERSION = '__BUILD_VERSION__';
const CACHE = `finance-manager-${BUILD_VERSION}`;
const SHELL = ['/', '/manifest.json', '/icon.png', '/favicon.png'];
const STATIC_FILES = ['/manifest.json', '/icon.png', '/favicon.png', '/favicon.ico'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isApi(url) {
  return url.origin !== self.location.origin || url.pathname.includes('/api/');
}

function isHashedAsset(url) {
  return url.pathname.startsWith('/_expo/static/') || url.pathname.startsWith('/assets/');
}

function isStaticFile(url) {
  return STATIC_FILES.includes(url.pathname);
}

async function store(request, response) {
  if (!response.ok || response.type === 'opaque') return;
  const cache = await caches.open(CACHE);
  await cache.put(request, response.clone());
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  await store(request, response);
  return response;
}

async function staleWhileRevalidate(event) {
  const request = event.request;
  const cached = await caches.match(request);
  const refresh = fetch(request).then(async (response) => {
    await store(request, response);
    return response;
  });
  if (!cached) return refresh;
  event.waitUntil(refresh.catch(() => undefined));
  return cached;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await store(request, response);
    return response;
  } catch (error) {
    const cached =
      (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match('/')) ||
      (await caches.match('/index.html'));
    return cached || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isApi(url)) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (isHashedAsset(url)) event.respondWith(cacheFirst(request));
  else if (isStaticFile(url)) event.respondWith(staleWhileRevalidate(event));
});
