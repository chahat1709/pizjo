# Pizjo Web

Pizjo is a static, multi-page restaurant storefront and WhatsApp ordering experience for Pizjo, Amraiwadi, Ahmedabad. It uses semantic HTML, modular CSS, vanilla ES modules, a data-driven menu, a persistent cart, an optional local Three.js hero, a service worker, and Playwright end-to-end tests.

## Technology

- HTML, CSS, and vanilla JavaScript ES modules.
- Three.js and local GLTF/DRACO assets for the progressive hero experience.
- Playwright with Chromium for browser-level regression tests.
- Vercel-compatible static deployment headers in `vercel.json`.

## Local development

The site must be served over HTTP because the menu uses `fetch()`, ES modules, and a service worker. Opening `index.html` directly with `file://` is not supported.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

## Tests

Install the Playwright browser once, then run the suite:

```bash
npx playwright install chromium
npm run test:all
```

The unified pipeline validates all public HTML pages—including the 404 route—checks stable catalog IDs and deployment CSP, runs server-side order-summary unit tests, and executes the browser suite. The active suite verifies the accessible hero poster and real WebGL container, graceful behavior when WebGL is unavailable, application-owned service-worker registration, stable-ID cart limits, shared WhatsApp link hydration, malformed-cart recovery, and secondary-page runtime health. The HTML report can be opened with `npm run test:report`.

## Asset builds

When Three.js or loader dependencies change, rebuild the local vendor bundle. When the compressed hero model changes, rebuild the Draco assets as well.

```bash
npm run build:vendor
npm run build:draco
npm run build:assets
```

## Privacy and ordering

Cart data is stored locally in the browser under `pizjo.cart.v2`. Orders and contact requests are handed off to the business WhatsApp account only after the user chooses to submit. Optional telemetry is disabled by default and is available only to designated staging builds after explicit consent.

## Project structure

- `index.html`: homepage and primary conversion flow.
- `pages/`: full menu, about, contact, and legal pages.
- `js/app.js`: shared boot logic, stable-ID cart, menu loading, service-worker registration, and trusted checkout handoff.
- `js/catalog.js`: shared catalog loading, normalization, stable IDs, and catalog lookup.
- `js/site.js`: shared business-link hydration, WhatsApp handoff forms, and mobile navigation.
- `js/security.js`: escaping, validation, rate limiting, cart normalization, and external-link hardening.
- `js/config.js`: shared public business configuration.
- `api/order-summary.js`: server-side catalog-backed order validation and total calculation.
- `data/menu.json`: menu content source.
- `sw/service-worker.js`: versioned asset and image caching.
- `tests/e2e/`: active Playwright regression suite.
