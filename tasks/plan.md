# Implementation Plan: Pizjo Full Software

**Goal:** Turn the current demo-grade storefront + browser-local order flow into a real, production restaurant operating system: customers order and pay, the kitchen sees orders instantly, the owner controls menu/stock/offers, the counter can bill offline, and every surface agrees on one source of truth.

**Method:** Audit first (fix the defects a senior would flag), then build the missing backend, then payments/ops, then harden and hand over. Each phase is a vertical slice that leaves the system working.

---

## 0. Verified reality (audit baseline, 2026-10-19)

These are measured from the repo, not from `docs/HANDOFF.md`. Several handover claims are currently false; that is the root of the "many mistakes" feedback.

| Claim in docs | Measured reality | Evidence |
|---|---|---|
| Admin live at `pizjo-admin.vercel.app` | **404 — not deployed** | `Invoke-WebRequest` → 404; `js/config.js:12` |
| Live availability/offers feed | **Disabled** (`adminStorefrontHosts: []`) | `js/config.js:17` |
| Menu = 81 items | **158 items / 17 categories** | `data/menu.json` |
| Real food photos | **153 Unsplash URLs, 47 unique stock images** | `data/menu.json` |
| GA4 live | **No gtag/gtag script at all; legal page says staging-only** | `pages/legal.html:110` |
| "Order pipeline" | **Browser localStorage only; KDS needs manual import** | `js/orders.js`, `js/app.js` |
| Server API | **Only `api/order-summary.js` (price re-check)** | `api/` |
| Payments | **None — WhatsApp handoff only** | `js/app.js` |
| CSP consistent | **No — per-page `connect-src` differs; only menu allows admin** | `pages/about.html:9`, `vercel.json:11` |
| Asset budget | **7 unreferenced PNGs ≈ 5.8 MB still in deploy** | `assets/*.png` |
| Tests = 15/19 | **14 Playwright + 9 unit = 23; docs disagree** | `tests/`, `README.md:39` |
| Admin code ready | **Yes — schema/API/auth exist, but never provisioned** | `admin/api/`, `admin/drizzle/` |

### Phase 0 defects to fix before any new feature
- [ ] **P0-1 Doc drift:** update `README.md`, `docs/HANDOFF.md`, `docs/OWNER_PLAN.md` to real counts/status. No claim without a command that proves it.
- [ ] **P0-2 Dead config:** either deploy admin and set `adminBaseUrl`/`adminStorefrontHosts`, or remove the dead URL and feed code path. No half-wired state.
- [ ] **P0-3 CSP drift:** generate one CSP from a single source; remove per-page `meta` CSP duplicates or keep them in sync. Add a validator test that diffs them.
- [ ] **P0-4 Dead assets:** delete or archive the 7 unreferenced PNG/JPEGs; convert any actually used PNG to WebP.
- [ ] **P0-5 Honest analytics:** either wire a real GA4 ID (with consent) or delete the analytics claims from legal/handover.
- [ ] **P0-6 Validator expansion:** fail CI on broken internal links, missing assets, unsynced CSP, and doc/count drift.

**Checkpoint 0:** `npm run test:all` green; docs match measured reality; no dead URLs/assets.

---

## 1. Target architecture

```
Customer (static storefront)
   │  POST /api/orders  (re-price server-side, validate promo, create order)
   ▼
Order Service (Vercel serverless) ──► Postgres (Neon)
   │                                   orders, order_items, status_events,
   │                                   customers, catalog, stock, offers
   ├──► KDS (poll/SSE)  ◄── kitchen status bumps
   ├──► Track page (order lookup)
   ├──► Admin (catalog, stock, offers, staff, reports, GST)
   └──► Payments (Razorpay/PhonePe) + WhatsApp/SMS notifications

Desktop POS (Electron/SQLite) ── sync queue ──► Order Service (idempotent)
```

### Architecture decisions
1. **One database, one catalog.** `data/menu.json` becomes generated output; Postgres is authoritative for price/stock. Storefront reads a published snapshot.
2. **Orders are server-side.** `localStorage` becomes an optimistic cache only. KDS never depends on a pasted link.
3. **Static storefront stays static.** No SSR rewrite; fetch from `api/` + admin feeds. Preserves current Lighthouse profile.
4. **Payments optional at first, then default.** WhatsApp remains a fallback channel; payment is additive.
5. **Admin on Vercel + Neon** (already coded), desktop POS offline-first with sync.
6. **No new framework** on the storefront. Keep vanilla ES modules; add only what the order flow needs.

---

## 2. Phases and tasks

### Phase 1 — Real order backend (the largest gap)
**Outcome:** an order placed on a phone appears on the kitchen screen within seconds, survives refresh, and is visible to the owner. No WhatsApp copy/paste required.

| # | Task | Acceptance criteria | Files |
|---|---|---|---|
| 1.1 | Order schema + migration | Tables: `orders`, `order_items`, `status_events`, `customers`; FKs + indexes; migration runs on empty DB | `admin/drizzle/`, `admin/server/db/` |
| 1.2 | `POST /api/orders` | Re-prices every line from catalog; validates promo server-side; returns order ID; rejects unknown IDs/qty > 20; idempotency key supported | `api/orders.js`, `admin/api/` |
| 1.3 | `GET /api/orders/:id`, `GET /api/orders?phone=` | Returns order + status timeline; phone lookup rate-limited; no PII leakage | `api/orders.js` |
| 1.4 | Checkout integration | `js/app.js` calls API first, then opens WhatsApp with the confirmed ID; failure path keeps cart | `js/app.js`, `js/orders.js` |
| 1.5 | KDS server-backed | KDS polls/streams new orders; bump writes `status_events`; multi-tab consistent; no manual import needed | `pages/kds.html`, `api/` |
| 1.6 | Track page server-backed | Lookup by ID+phone hits API; falls back to local cache offline | `pages/track.html` |
| 1.7 | Admin orders view | Same DB; filters; status transitions; audit trail | `admin/client/` |

**Verification:** Playwright: place order → assert row in DB → open KDS in second context → assert card → bump → assert track timeline. Unit: price tamper, promo window, invalid qty.

**Checkpoint 1:** e2e order→KDS→track green; no localStorage dependency for fulfillment.

---

### Phase 2 — Provision the admin (unblock the feeds)
**Outcome:** `pizjo-admin.vercel.app` is real; owner can toggle stock and offers; storefront reflects it.

| # | Task | Acceptance criteria |
|---|---|---|
| 2.1 | Neon project + baseline | `0000_init-postgres.sql` applied; seed = 158 items/17 cats |
| 2.2 | Vercel admin project | `DATABASE_URL`, `SESSION_SECRET`, `STOREFRONT_ORIGIN`; first `/login` creates owner |
| 2.3 | Feed allowlist | `adminStorefrontHosts: ['pizjo.vercel.app']`; CORS exact-origin; 2-min staleness budget |
| 2.4 | Auth hardening | scrypt params, JWT expiry/rotation, login rate-limit, role matrix test |
| 2.5 | Backups | Neon PITR + documented restore drill |

**Checkpoint 2:** toggle one item out-of-stock in admin → storefront disables it ≤ 2 min → restore; offers feed populates `#live-offers`.

---

### Phase 3 — Payments + notifications
**Outcome:** customers can pay online; confirmations are automatic.

| # | Task | Acceptance criteria |
|---|---|---|
| 3.1 | Gateway decision (Razorpay/PhonePe/Cashfree) | Merchant account owner confirmed; test keys in Vercel |
| 3.2 | Payment intent + order linkage | Order created `pending_payment`; intent ID stored |
| 3.3 | Webhook verification | Signature checked; idempotent replay; failed payment → `payment_failed`, no kitchen ticket |
| 3.4 | Refund/cancel | Admin refund writes status event; gateway reconciliation report |
| 3.5 | Notifications | WhatsApp Cloud API or SMS: order confirmed + status changes; opt-out respected |
| 3.6 | GST invoice | Invoice number sequence, 5% breakup (CA-confirmed), printable + emailed |

**Checkpoint 3:** test-mode payment end-to-end; webhook replay creates no duplicates; failed payment creates no ticket.

---

### Phase 4 — Menu truth & content
**Outcome:** no stock photos; menu data is trustworthy and maintainable.

| # | Task | Acceptance criteria |
|---|---|---|
| 4.1 | Real photo intake | 20–30 real items first; consistent crop/background; WebP + srcset; no Unsplash |
| 4.2 | Image pipeline | `scripts/build-menu-images.mjs`: resize/compress/manifest; budget ≤ 80 KB/card |
| 4.3 | Modifiers/add-ons | Size/crust/extras with price deltas; server-side totals |
| 4.4 | Allergens/nutrition/veg | Optional fields rendered only when present |
| 4.5 | SEO | Per-category URLs, canonical, OG images, real reviews, Maps Place ID |

**Checkpoint 4:** zero external image hosts in CSP; Lighthouse mobile ≥ 90; menu JSON schema-validated.

---

### Phase 5 — Stock, offers, operations
**Outcome:** the shop can run day-to-day without the developer.

| # | Task | Acceptance criteria |
|---|---|---|
| 5.1 | Stock levels | Per-item stock; decrement on order; block add-to-cart at 0; 86 toggle |
| 5.2 | Offer rules engine | BOGO/LATE20 as data rules; server evaluates; admin preview |
| 5.3 | Staff/shifts | Roles, shift open/close, cash drawer (desktop) |
| 5.4 | Reports | Sales by day/item/promo/channel; export CSV; GST summary |
| 5.5 | Day-close | Z-report reconciles orders vs payments vs cash |

**Checkpoint 5:** out-of-stock blocks checkout; modifier prices match bill; day-close totals reconcile.

---

### Phase 6 — Desktop POS sync
**Outcome:** counter keeps billing during internet outages and reconciles cleanly.

| # | Task | Acceptance criteria |
|---|---|---|
| 6.1 | Offline queue | Orders persist in SQLite; sync on reconnect; idempotent IDs |
| 6.2 | Conflict policy | Server wins on price; client order preserved; duplicate detection |
| 6.3 | Receipt printer | Thermal 58/80 mm; GST invoice format |
| 6.4 | Kiosk hardening | Auto-start, no devtools, crash recovery |

**Checkpoint 6:** offline order syncs exactly once; bill matches server record.

---

### Phase 7 — Quality, security, observability
| # | Task | Acceptance criteria |
|---|---|---|
| 7.1 | Test expansion | Order→KDS→track→admin; payment test mode; stock; modifiers |
| 7.2 | CI gates | lint + typecheck + unit + e2e + validator + Lighthouse budgets on every PR |
| 7.3 | Security review | Authz matrix, rate limits, CSP, secrets scan, dependency audit; no highs |
| 7.4 | Observability | Sentry (or equivalent), uptime checks, order-funnel metrics, alerting |
| 7.5 | Performance | Mobile ≥ 90, LCP ≤ 2.5 s, CLS ≤ 0.1, JS budget ≤ 200 KB core |

**Checkpoint 7:** CI green; restore drill passed; alerts fire on a forced 500.

---

### Phase 8 — Launch & handover
| # | Task | Acceptance criteria |
|---|---|---|
| 8.1 | Staging → prod cutover | DNS/alias switched; rollback rehearsed |
| 8.2 | Analytics + consent | Real GA4 (or removed), consent banner, privacy policy updated |
| 8.3 | Runbooks | Deploy, restore, rotate secrets, add item, refund |
| 8.4 | Training | 15-min KDS + admin + day-close; Loom recording |
| 8.5 | Credentials + warranty | Template filled, IP transfer on final payment, 30-day scope |

**Checkpoint 8:** owner completes one real order + one refund + one day-close unaided.

---

## 3. Sequencing and checkpoints

```
Phase 0 (2d) ─► Phase 1 (5-7d) ─► Phase 2 (2-3d) ─► Phase 3 (5-7d)
                                             │
                                             ├─► Phase 4 (2-3d) ─┐
                                             └─► Phase 5 (4-5d) ─┼─► Phase 6 (5d)
                                                                  └─► Phase 7 (3-4d) ─► Phase 8 (2-3d)
```

- **Fail fast:** Phase 0 and 1 first — if orders cannot reach the kitchen, nothing else matters.
- **Parallelizable:** Phase 4 (content/photos) can run alongside Phase 3; Phase 6 can start after Phase 5 schema freezes.
- **Human checkpoints:** after Phase 0 (accept the audit), after Phase 2 (owner sees live admin), after Phase 3 (payment sign-off), after Phase 8 (go-live).

---

## 4. Definition of Done (every task)

- [ ] Acceptance criteria met and demonstrated (screenshot/log)
- [ ] Unit or e2e test added; `npm run test:all` green
- [ ] No new console errors, no CSP violations
- [ ] Mobile 375 px + desktop 1440 px checked
- [ ] Docs updated in the same commit (no drift)
- [ ] Rollback path known

---

## 5. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scope says "full software" but budget is ₹35–50k | High | Tier the scope: Phase 0–2 = launch-ready; 3–6 = full commerce (re-quote) |
| Admin never provisioned (Neon/Vercel access) | High | Owner supplies accounts in Phase 0; otherwise freeze feed features |
| No real photos | Medium | Ship with branded placeholders (not stock) until photos arrive |
| GST treatment wrong | High | CA sign-off before printing fiscal invoices; keep 5% inclusive assumption flagged |
| Payment gateway KYC delay | Medium | Keep WhatsApp fallback; launch Phase 1–2 without payments |
| Desktop sync duplicates | High | Idempotency keys + unique constraint; sync tests |
| Owner edits catalog outside admin | Medium | Make admin the only write path; lock direct JSON edits in docs |
| Single maintainer | Medium | Runbooks + backups + CI; handover package |

---

## 6. Open questions (need answers before Phase 1)

1. **Payments:** which gateway, and whose merchant account (owner's PAN/GST)? Online payment in scope now or later?
2. **Scope/budget:** is this a new paid phase, or part of the existing ₹35k/₹50k? Which tier is the target?
3. **Multi-outlet:** single Amraiwadi shop only, or should the schema support future outlets now?
4. **Photos:** who supplies real food photos, by when? Can we shoot 20 items in week 1?
5. **GST:** has the CA confirmed 5% inclusive / SAC 9963?
6. **Admin hosting:** can the owner create Neon + Vercel projects this week, or should we host under your account and transfer?
7. **WhatsApp:** keep the manual handoff as fallback, or move fully to Cloud API (needs Meta business verification)?
8. **Go-live date:** is there a hard date (e.g., before a DotPe renewal)?

---

## 7. Immediate next actions

1. Answer the open questions (at least 1, 2, 4, 6).
2. Execute Phase 0 defects (small, same-day, removes the senior's obvious complaints).
3. Start Phase 1.1–1.3 (schema + order API) behind a feature flag.
4. Provision admin (Phase 2) in parallel so the feed can be re-enabled.
