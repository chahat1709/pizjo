# Pizjo Full Software — Task Checklist

Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## Phase 0 — Truth & hygiene (2 days)
- [ ] P0-1 Update README/HANDOFF/OWNER_PLAN to measured reality (158 items, admin 404, GA absent, tests 23)
- [ ] P0-2 Decide admin URL + feeds: deploy or remove dead code path
- [ ] P0-3 Single-source CSP; sync or remove per-page meta CSP
- [ ] P0-4 Delete/archive 7 unreferenced assets (~5.8 MB); convert remaining used PNGs to WebP
- [ ] P0-5 Wire real GA4 with consent, or remove analytics claims
- [ ] P0-6 Extend validator: broken links, missing assets, CSP drift, doc drift
- [ ] Checkpoint 0: `npm run test:all` green; audit accepted

## Phase 1 — Real order backend (5–7 days)
- [ ] 1.1 Orders schema + migration (orders, order_items, status_events, customers)
- [ ] 1.2 `POST /api/orders` (server re-price, promo, idempotency)
- [ ] 1.3 `GET /api/orders/:id` + phone lookup (rate-limited)
- [ ] 1.4 Checkout calls API, then WhatsApp; failure keeps cart
- [ ] 1.5 KDS server-backed (poll/SSE, bump writes events)
- [ ] 1.6 Track page server-backed with offline fallback
- [ ] 1.7 Admin orders view on same DB
- [ ] Checkpoint 1: order→KDS→track e2e green; no manual import

## Phase 2 — Provision admin (2–3 days)
- [ ] 2.1 Neon project + baseline migration + seed 158 items
- [ ] 2.2 Vercel admin project + env (`DATABASE_URL`, `SESSION_SECRET`, `STOREFRONT_ORIGIN`)
- [ ] 2.3 Enable feeds (`adminStorefrontHosts`) with exact-origin CORS
- [ ] 2.4 Auth hardening + role matrix test
- [ ] 2.5 Backups + restore drill
- [ ] Checkpoint 2: admin toggle reflects on storefront ≤ 2 min

## Phase 3 — Payments + notifications (5–7 days)
- [ ] 3.1 Gateway + merchant account decision
- [ ] 3.2 Payment intent + order linkage
- [ ] 3.3 Webhook verification + idempotency
- [ ] 3.4 Refund/cancel + reconciliation
- [ ] 3.5 WhatsApp/SMS confirmations + status updates
- [ ] 3.6 GST invoice sequence + print/email
- [ ] Checkpoint 3: test-mode payment e2e; no duplicate on webhook replay

## Phase 4 — Menu truth & content (2–3 days)
- [ ] 4.1 Real photos for first 20–30 items
- [ ] 4.2 Image build pipeline (WebP, srcset, manifest, ≤80 KB/card)
- [ ] 4.3 Modifiers/add-ons with server-side totals
- [ ] 4.4 Allergens/nutrition/veg fields
- [ ] 4.5 Per-category SEO, OG images, real reviews, Maps Place ID
- [ ] Checkpoint 4: no external image hosts; Lighthouse mobile ≥ 90

## Phase 5 — Stock, offers, operations (4–5 days)
- [ ] 5.1 Stock levels + decrement + 86 toggle
- [ ] 5.2 Offer rules engine + admin preview
- [ ] 5.3 Staff/shifts/roles + cash drawer
- [ ] 5.4 Reports (day/item/promo/channel) + CSV + GST summary
- [ ] 5.5 Day-close / Z-report reconciliation
- [ ] Checkpoint 5: out-of-stock blocks checkout; day-close reconciles

## Phase 6 — Desktop POS sync (5 days)
- [ ] 6.1 Offline queue + reconnect sync + idempotent IDs
- [ ] 6.2 Conflict policy + duplicate detection
- [ ] 6.3 Thermal receipt + GST invoice format
- [ ] 6.4 Kiosk hardening
- [ ] Checkpoint 6: offline order syncs exactly once

## Phase 7 — Quality, security, observability (3–4 days)
- [ ] 7.1 Expand e2e: order→KDS→track→admin, payments, stock, modifiers
- [ ] 7.2 CI gates: lint, typecheck, unit, e2e, validator, Lighthouse
- [ ] 7.3 Security review: authz, rate limits, CSP, secrets, deps
- [ ] 7.4 Error tracking + uptime + funnel metrics
- [ ] 7.5 Perf budgets enforced
- [ ] Checkpoint 7: CI green; restore drill passed

## Phase 8 — Launch & handover (2–3 days)
- [ ] 8.1 Staging → prod cutover + rollback rehearsal
- [ ] 8.2 GA4/consent + privacy policy
- [ ] 8.3 Runbooks (deploy, restore, rotate, add item, refund)
- [ ] 8.4 Staff training + Loom
- [ ] 8.5 Credentials + IP transfer + 30-day warranty
- [ ] Checkpoint 8: owner completes order + refund + day-close unaided

## Blocked / waiting on owner
- [ ] Neon + Vercel account access (Phase 2)
- [ ] Payment gateway + merchant KYC (Phase 3)
- [ ] Real food photos (Phase 4)
- [ ] CA confirmation on 5% GST inclusive (Phase 3.6)
- [ ] Scope/budget tier confirmation (before Phase 1)

## Slice - Dine-in QR table ordering (built alongside Phase 1)
- [x] S1 Plan + locked decisions (`tasks/table-order-plan.md`)
- [x] S2 Pure logic: reprice, GST, IDs, phone, OTP, ticket text (`lib/table-core.cjs`, 32 unit tests)
- [x] S3 Atomic JSON store + tables + events (`lib/table-store.cjs`)
- [x] S4 Zero-dep server: static, REST, SSE, QR SVG, print queue (`tools/table-server.mjs`)
- [x] S5 Guest page: menu, tray, OTP, live status (`pages/table-order.html`)
- [x] S6 Kitchen board: SSE, status flow, auto-print, sound (`pages/table-kds.html`)
- [x] S7 Table admin: registry, QR sheet, today's orders (`pages/table-admin.html`)
- [x] S8 End-to-end smoke: guest order -> KDS -> guest status -> QR render
- [ ] S9 Hosted twin: Vercel + Neon API behind the same JSON contract
- [ ] S10 Real SMS provider keys + printer model confirmation
