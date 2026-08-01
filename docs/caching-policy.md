# Pizjo Caching & Streaming Policy

Purpose: define how hero assets, models, and stage assets are prefetched, cached, and invalidated.

Cache names & versioning
- `pizjo-assets-<version>`: general images and small resources (posters, thumbnails).
- `pizjo-models-<version>`: GLB/GLTF and KTX2 files. Models should include a version/hash in filename to allow long-term caching.

Strategy
- Models (GLB/GLTF/KT X2): cache-first with network fallback. These assets are large and should be served from cache after first fetch.
- Poster images: stale-while-revalidate so the poster displays instantly while being refreshed in background.
- LOD policy: always fetch LOD1 (low) at FMP, defer LOD2/3 until idle or interaction.

Service Worker responsibilities
- Register under `/sw/service-worker.js`.
- On fetch for models, check cache first, then network and cache response.
- Expose message API: `SKIP_WAITING` to activate new SW, `CLEAR_CACHES` for manual invalidation during QA.

Build-time requirements
- All model assets must contain content-hash in filename (e.g., `pizza.hero.v1.glb` or `pizza.hero.abcdef.glb`).
- Generate an `assets-manifest.json` that maps logical names to versioned filenames for runtime prefetch lists.

Prefetch order
1. LQ poster (immediate) — preload link tag
2. LOD1 GLB (low) — critical fetch
3. Stage ±1 assets — prefetch with low-priority
4. LOD2/LOD3 — defer until idle

Invalidation & rollout
- Update `CACHE_VERSION` constant during deployment to force SW cache rotation.
- Use `assets-manifest.json` to compute changed assets and invalidate older entries.

Acceptance
- Repeat-visit FMP <= 500ms with service worker warm cache on mobile emulation.
- Playwright tests verify SW registration and caching behavior.
