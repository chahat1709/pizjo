/* Pizjo Service Worker
   - Caches: poster images, hero LODs, stage assets
   - Strategy: cache-first for models (versioned), stale-while-revalidate for images
   - Versioning: update CACHE_VERSION on deploy to invalidate
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

// helper to cache-first models (GLB/GLTF) and cache images with stale-while-revalidate
self.addEventListener('fetch', (evt) => {
  const url = new URL(evt.request.url);
  // only handle same-origin
  if (url.origin !== location.origin) return;

  if (url.pathname.endsWith('.glb') || url.pathname.endsWith('.gltf') || url.pathname.endsWith('.ktx2')) {
    // cache-first for models
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
    // stale-while-revalidate
    evt.respondWith((async ()=>{
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(evt.request);
      const network = fetch(evt.request).then(res=>{ if (res.ok) cache.put(evt.request, res.clone()); return res; }).catch(()=>null);
      return cached || (await network) || new Response('');
    })());
    return;
  }
});

// simple messaging for clients to skipWaiting or clear caches
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
