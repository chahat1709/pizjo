/* Public service worker proxy for tests
   Mirrors src/sw/service-worker.js so browsers can register at /sw/service-worker.js
*/
const CACHE_VERSION = 'v1';
const CACHE_NAME = `pizjo-assets-${CACHE_VERSION}`;
const MODEL_CACHE = `pizjo-models-${CACHE_VERSION}`;

self.addEventListener('install', (evt) => {
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>!k.startsWith('pizjo-')).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);
  if (url.origin !== location.origin) return;

  if (url.pathname.endsWith('.glb') || url.pathname.endsWith('.gltf') || url.pathname.endsWith('.ktx2')) {
    evt.respondWith((async ()=>{
      const cache = await caches.open(MODEL_CACHE);
      const cached = await cache.match(evt.request);
      if (cached) return cached;
      try {
        const res = await fetch(evt.request);
        if (res.ok) await cache.put(evt.request, res.clone());
        return res;
      } catch (err) {
        return cached || new Response('');
      }
    })());
    return;
  }

  if (evt.request.destination === 'image') {
    evt.respondWith((async ()=>{
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(evt.request);
      const network = fetch(evt.request).then(res=>{ if (res.ok) cache.put(evt.request, res.clone()); return res; }).catch(()=>null);
      return cached || (await network) || new Response('');
    })());
    return;
  }
});

self.addEventListener('message', (evt)=>{
  if (!evt.data) return;
  if (evt.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (evt.data.type === 'CLEAR_CACHES') {
    evt.waitUntil((async ()=>{
      const keys = await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    })());
  }
});
