const CACHE = 'pulsa-web-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

const isNavigation = (req) => req.mode === 'navigate' || (req.url.match(/\/index\.html$|\/$/) && req.headers.get('accept') || '').includes('text/html');

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // Navegação: sempre tenta a rede primeiro (mantém o app atualizado), cai no cache se offline.
  if (isNavigation(e.request)) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }
  // Assets estáticos: cache-first, com fallback para a rede e cache do resultado.
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok && new URL(e.request.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});