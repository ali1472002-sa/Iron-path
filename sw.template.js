// Generated into dist/sw.js by sw-plugin.ts. Only touches Cache Storage; never IndexedDB/localStorage.
const V = 'ironpath-__VERSION__';
const CORE = __CORE__;
const OPT = __OPT__;
const abs = (u) => new URL(u, self.registration.scope).href;
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then(async (c) => {
    await c.addAll(CORE.map((u) => new Request(abs(u), { cache: 'reload' })));
    await Promise.allSettled(OPT.map((u) => c.add(new Request(abs(u), { cache: 'reload' }))));
  }));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('ironpath-') && k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return; // never cache third-party / private responses
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then((res) => { const cp = res.clone(); caches.open(V).then((c) => c.put(abs('./'), cp)); return res; }).catch(() => caches.match(abs('./'))));
    return;
  }
  e.respondWith(caches.match(r).then((m) => m || fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; })));
});
