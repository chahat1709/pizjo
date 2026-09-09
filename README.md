# Pizjo — Full Brand Software

Pure-veg pizza brand system for Pizjo, Amraiwadi, Ahmedabad: customer storefront + order pipeline, cloud admin, offline desktop billing, and a zero-setup demo.

| Surface | Live / Run | Status |
|---|---|---|
| Storefront (customer) | https://pizjo.vercel.app | Lighthouse mobile 81, validator green |
| Admin (staff, protected) | https://pizjoadmin-9mxbkqqm.manus.space | 15 tests green |
| Desktop billing (offline) | `local-admin-desktop/` → `npm start` | Electron + SQLite |
| Local demo (no login) | `local-admin-demo/start-local.cmd` → http://localhost:4173 | Resettable test data |

## What each part does

- **Storefront** (`index.html`, `pages/`, `js/`, `api/`) — 81-item menu with search/filter, cart (`pizjo.cart.v3`), server-verified WhatsApp checkout (`api/order-summary.js`), promo codes (BOGO Tuesdays, LATE20 22:00–24:00 IST), order log (`pizjo.orders.v1`) with track-by-phone page, staff KDS board (`pages/kds.html`), thermal GST bill print, CSP/HSTS/rate-limit hardening.
- **Admin** (`admin/`) — dashboard, orders (`pending→preparing→ready→delivered`), sales reports, inventory, menu CRUD + availability feed, offers campaigns + storefront feed, GST invoices, team/shifts, social planner. React + tRPC + Drizzle/MySQL.
- **Desktop** (`local-admin-desktop/`) — offline counter billing: orders, invoices (`PZ-00001…`), stock, offers, staff, printable bills. Zero network by design.
- **Demo** (`local-admin-demo/`) — click-through training copy in the browser. Never touches production.

## Quickstart

```bash
# Storefront (must be served over HTTP — fetch + ES modules + SW)
npm install
npm run dev          # http://localhost:3000

# Admin (needs pnpm + DATABASE_URL, see admin/.env.example if present)
cd admin && pnpm install && pnpm dev

# Desktop billing
cd local-admin-desktop && npm install && npm start

# Offline demo (Windows, no install)
local-admin-demo/start-local.cmd   # http://localhost:4173
```

## Tests

```bash
npm run test:all      # validate (8 pages, 81 IDs, CSP) + unit + Playwright e2e
npm run test:report   # open HTML report
npx playwright install chromium   # first time only
```

The browser suite covers hero/WebGL fallback, cart limits, WhatsApp hydration, promo validation, track + KDS flows, and secondary-page health. Unit suite covers trusted pricing + promo windows (`tests/unit/order-summary.test.cjs`).

## Configuration

Single source of truth: `js/config.js` (`whatsappNumber`, `adminBaseUrl`, `menuUrl`). Business facts: `data/store.json`. Menu: `data/menu.json` (stable IDs required — enforced by validator). Promos: `data/offers.json` (validated server-side; IST day/time windows).

Menu prices are treated as GST-inclusive @5% (CGST 2.5 + SGST 2.5, SAC 9963) — confirm with CA before fiscal use.

## Privacy

Cart (`pizjo.cart.v3`) and orders (`pizjo.orders.v1`) stay in the visitor's browser. Orders reach the business only via WhatsApp after explicit submit. Telemetry is opt-in, staging-only.

## Project structure

```
index.html 404.html robots.txt sitemap.xml site.webmanifest vercel.json
pages/          menu · about · contact · legal · track · kds (staff, noindex)
css/ js/        tokens · global · home · app · catalog · site · security · config · orders
data/           menu.json (81 items) · offers.json · store.json
api/            order-summary.js (trusted totals + promo validation)
sw/             versioned service worker
admin/          cloud admin (client + server + drizzle)
local-admin-desktop/   offline Electron billing + SQLite
local-admin-demo/      browser-only training demo
tests/          e2e/ · unit/ · live verification scripts
docs/           HANDOFF.md (master) · CREDENTIALS_TEMPLATE.md · review-*.md
```

## Handover

Client delivery runs through `docs/HANDOFF.md` (scope, deploy, QA, warranty) + `docs/CREDENTIALS_TEMPLATE.md` (fill after payment, never commit). IP transfers on final payment.

## Asset builds

```bash
npm run build:vendor   # rebuild Three.js bundle on dependency change
npm run build:draco    # rebuild Draco assets on hero model change
```
