# Pizjo — Full System Handover Package
**Storefront:** https://pizjo.vercel.app | **Admin:** https://pizjoadmin-9mxbkqqm.manus.space | **Date:** 2026-08-22 | **Version:** 1.0.0

This document is the single source for client handover. Gate the ZIP + this doc behind final payment.

## 1) What you receive
```
/handoff/
  /storefront/   -> Full static site (index.html, pages/, css/, js/, assets/, data/menu.json, vercel.json)
  /admin/        -> Admin app (admin/client + admin/server + drizzle + .env.example)
  /desktop/      -> Windows desktop app (local-admin-desktop/)
  /demo/         -> Offline demo (local-admin-demo/ + start-local.cmd)
  HANDOFF.md     -> This file
  CREDENTIALS.md -> All logins, API keys, DNS, GA, Business Profile (separate PDF)
  README.md      -> Setup, deploy, common tasks
```

## 2) Storefront — what's built
- 5 pages: Home (hero + stash menu + offers + hangout + CTA), Full Menu (15 cats, search, 81 items), About, Contact, Legal + `404.html:1` `robots.txt:1` `sitemap.xml:1`
- Cart `pizjo.cart.v1` localStorage, WhatsApp checkout `js/app.js:316` with server validation `api/order-summary.js:1`
- Security: CSP `vercel.json:11` + `index.html:67`, XSS escape `js/security.js:1`, rate-limit, validation
- Performance: WebP `assets/pizza_hero-300.webp:1` 21.8KB (vs 915KB PNG), lazy Three `index.html:440` only desktop idle, fonts 2 families non-blocking `index.html:99`, skeleton `css/global.css:968` `index.html:216`
- Lighthouse mobile 81 (FCP 3.6s, LCP 3.6s, TBT 0, CLS 0)

## 3) Admin software
- `admin/` Node + Drizzle + tRPC, role-protected routes, 81 items baseline, availability/offers feeds `js/admin-storefront-sync.js:9` (`/api/storefront/availability`, `/offers`) CORS-limited to `pizjo.vercel.app`
- `local-admin-demo/` browser-local demo at `http://localhost:4173` (no login, resettable)
- `local-admin-desktop/` Electron Windows app with `data-store.cjs:1`

## 4) Deployment
**Vercel (storefront):**
```bash
vercel --prod   # from repo root, uses vercel.json headers + CSP
```
Domain: add custom domain in Vercel → update DNS A/CNAME, SSL auto-renew. Current alias `pizjo.vercel.app`.

**Admin (Manus):**
Deployed at `pizjoadmin-9mxbkqqm.manus.space`. Env `admin/.env` → `adminBaseUrl`, `adminStorefrontHosts`. Drizzle migrations `admin/drizzle/`.

## 5) Credentials to transfer (see CREDENTIALS.md)
- GitHub `chahat1709/pizjo` PRIVATE `pr7/telemetry-budgets` → transfer to client org or add as owner
- Vercel project `pizjo` → Transfer Project to client team
- Domain registrar (if custom domain) + DNS (Cloudflare nameservers)
- Google Analytics GA4 `G-XXXXXXXXXX` → replace placeholder in `index.html:12` + all `pages/*.html`
- Google Business Profile (Maps Place ID for `pages/contact.html:163` iframe), WhatsApp Business `+91 92653 70588` in `js/config.js:1`

## 6) Common tasks for client (no dev needed)
- Update menu: edit `data/menu.json` or via Admin → Publish → storefront auto-hydrates
- Change price/photo: Admin Console → Catalog → Save, or direct `data/menu.json` push triggers Vercel deploy
- Add offer: Admin → Offers → Create → appears in `index.html:308` `#live-offers` within 2min, else empty state
- Update hours/phone: `js/config.js:1` + `index.html:198` badge

## 7) QA sign-off (done)
- Playwright `npm run test:all` 15 admin + storefront e2e pass, `bindReveal` hero `is-visible` `tests/debug-mobile-visible.js:1`
- Manual: 375/768/1440, Chrome/Firefox/Safari, forms → WhatsApp, cart 20/qty 50 limits, a11y skip-link `index.html:111`

## 8) Post-handover
- Warranty: 30 days bugs that don't match scope (spec) free, new features at hourly rate
- Support rate: ₹500-800/hr after warranty, maintenance retainer ₹3k-5k/mo optional
- Scope change: use written SCR form, re-quote
- IP transfers on final payment receipt (see `pages/legal.html:162`)

## 9) Pending business actions (1 day, before final invoice)
- Replace `G-XXXXXXXXXX` with real GA4 ID (all pages)
- Replace Unsplash `data/menu.json:10` with 20 real food photos
- Replace mock reviews `index.html:252` with 3 real Google/Zomato quotes
- Replace Maps `0x0` with real Place ID from Business Profile
- Live toggle test: Admin toggles one item out-of-stock → verify homepage/manu disabled, then restore

## 10) Acceptance
Client confirms: "Received and accepted deliverables as scoped." → 10 business days review, silence = deemed accepted.
