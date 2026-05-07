const CACHE_NAME = 'pda-v2';
const STATIC = ['/manifest.json'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Network-first strategy: zawsze próbuj pobrać świeżą wersję, fallback na cache tylko offline
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache'uj tylko statyczne zasoby, NIGDY /api/*
        if (response.ok && !e.request.url.includes('/api/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
