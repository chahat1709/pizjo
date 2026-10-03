# Admin: Manus → Vercel + Neon cutover runbook

The admin no longer depends on Manus. Auth is local username/password
(scrypt + HS256 cookie sessions), the database is Postgres, and the app ships
as a static Vite client + serverless API on Vercel.

## What changed (code)

- `drizzle/schema.ts`: MySQL → PostgreSQL. Old snapshots archived under
  `drizzle/mysql-legacy/`; fresh baseline is `drizzle/0000_init-postgres.sql`.
- `server/db.ts`: `drizzle-orm/postgres-js` (`max: 1` for serverless),
  `onConflictDoUpdate` upserts, `.returning()` inserts, explicit `updatedAt`.
- `server/auth/`: local credentials. `POST /api/auth/setup` (first user becomes
  admin, then 403s), `POST /api/auth/login` (10/min/IP best-effort limit),
  `POST /api/auth/logout`, `GET /api/auth/setup-status`. Login page at `/login`.
- `server/_core/context.ts`: session resolved from Cookie or Bearer header —
  identical on Express (local dev) and Vercel functions.
- Deleted Manus-only code: `sdk`, `oauth`, `storageProxy`, `storage`,
  `dataApi`, `heartbeat`, `notification`, `llm`, `map`, `imageGeneration`,
  `voiceTranscription`, `ManusDialog`, `__manus__` debug collector, Manus Vite
  plugins and dev-server host allowlist. `systemRouter.notifyOwner` now logs
  and returns `{ success: false }` until an SMS/WhatsApp provider is wired.
- `api/`: `trpc/[trpc].ts` (fetch adapter), `storefront/availability`,
  `storefront/offers`, `auth/*`, `health`. `vercel.json`: static `dist/public`
  + SPA rewrite + security headers.

## 1. Create the Neon database (10 min, owner does this once)

1. Sign up at https://neon.tech → New Project → Postgres 16, region closest to
   Mumbai (Singapore `ap-southeast-1` is usually fastest from India).
2. Copy the **pooled** connection string
   (`postgresql://user:pass@ep-xxx-pooler…/pizjo?sslmode=require`).
3. From `admin/` with `DATABASE_URL` set to that string:
   ```bash
   pnpm drizzle-kit push
   ```
   (Baseline `0000_init-postgres.sql` creates all 15 tables + enums.)
4. Seed the 158-item catalog: open the admin UI → Menu → **Sync baseline**
   (or call `admin.catalog.sync` via the UI once logged in).

## 2. Deploy to Vercel (15 min)

1. Vercel → Add New Project → import `chahat1709/pizjo`, set **Root Directory**
   to `admin/`, Framework Preset **Vite**.
2. Environment variables:
   - `DATABASE_URL` = pooled Neon string (from step 1)
   - `SESSION_SECRET` = 32+ random chars (`openssl rand -hex 32`)
   - `STOREFRONT_ORIGIN` = `https://pizjo.vercel.app` (default already)
   - `NODE_ENV` = `production`
3. Deploy. Note the URL (e.g. `https://pizjo-admin.vercel.app`).
4. Open `/login` → create the owner account (first user = admin).
5. Smoke test: `/api/health` → `{"ok":true}`, dashboard KPIs load, toggle one
   menu item out-of-stock → confirm `pizjo.vercel.app` menu reflects it.

## 3. Repoint the storefront

If the admin URL differs from `https://pizjo-admin.vercel.app`, update in
**two** places and redeploy the storefront (`vercel --prod` from repo root):

- `js/config.js` → `adminBaseUrl`
- root `vercel.json` → CSP `connect-src` admin origin

(`scripts/validate-project.mjs` pins the same origin — keep all three in sync.)

## 4. Decommission Manus (only after step 2–3 verify green for 48h)

1. Export any new Manus-side data first (orders/invoices created there after
   the Neon cutover date will NOT migrate automatically — plan a quiet window).
2. Delete/suspend the Manus deployment. Rotate any shared secrets.

## Rollback

Every step is reversible until step 4: the Manus deployment is untouched by
this migration. To roll back the storefront pointer, revert `js/config.js` +
root `vercel.json` to the Manus origin and redeploy. Git tag pre-migration:
`v1.0.0-handover`.

## Verification evidence (2026-09-20, local PG16 via Docker)

- `drizzle-kit migrate` from scratch: 15 tables + 14 enum types created.
- `pnpm vitest run`: **21/21 pass** (incl. 2 DB integration tests skipped without a database).
- `admin/verify-migration.mjs` against live Express + real Postgres: **11/11 pass**
  (setup → owner bootstrap → setup lockout → bad-password 401 → login cookie →
  `auth.me` → catalog sync `{categories:11, items:81}` → order create →
  81-item availability feed → offers feed → logout).
- `tsc --noEmit` clean; `vite build` succeeds (29.9s).
- Security spot-check: `auth.me` returns no `passwordHash` (fixed during verification).

## Known limitations vs Manus build

- Login rate limit is per-instance in-memory (fine for 2–5 staff; revisit if
  brute-force attempts appear in logs).
- No owner push notifications (`system.notifyOwner` returns false).
- No image upload pipeline (menu images remain Unsplash URLs, as before).
- Client JS bundle is ~1MB (pre-existing; code-split as follow-up).
