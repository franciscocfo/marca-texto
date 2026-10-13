const VERSAO = 'marcatexto-v1';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const proprio = url.origin === location.origin;
  const externoUtil = /fonts\.(googleapis|gstatic)\.com$|cdnjs\.cloudflare\.com$/.test(url.hostname);
  if (!proprio && !externoUtil) return;
  e.respondWith(caches.open(VERSAO).then(async cache => {
    const salvo = await cache.match(req, {ignoreSearch: proprio});
    const rede = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }).catch(() => null);
    if (salvo) { e.waitUntil(rede); return salvo; }
    const r = await rede;
    if (r) return r;
    if (req.mode === 'navigate') return cache.match('./index.html');
    return new Response('', {status: 504});
  }));
});
