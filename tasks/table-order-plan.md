# Pizjo Table Server - dine-in QR ordering

Status: Pass A complete. Scope: a shop-PC web server that lets guests order from a QR
code on the table, and lets the kitchen see and print tickets. No cloud account required.

## Why a local server

The kitchen and the thermal printer are physically at the shop. Anything that must print
cannot depend on the internet being up. A single zero-dependency Node process on the shop
PC owns the menu prices, the order store and the printer, and serves the guest pages over
the shop Wi-Fi. The guest pages call relative `/api/...` URLs, so the same pages can later
be pointed at a hosted API (Vercel + Neon) without a rewrite.

## Decisions (locked)

| Question | Decision | Reason |
| --- | --- | --- |
| QR encoder | vendored MIT `qrcode-generator` | A hand-rolled encoder cannot be verified locally; an unscannable code is worse than a dependency. |
| Cart | no cart page, no checkout page | The menu is the order surface. A bottom-sheet tray batches items, then "Send to Kitchen". |
| Table identity | from the QR URL (`?t=07`) | Guests never type a table number, so it cannot be wrong. |
| Anti-spam | optional `&k=<token>` secret in the QR | Cheap, per-shop, can be turned off. |
| Guest identity | phone + 6-digit OTP before the first send | Gives the shop a callback number and blocks casual spam. |
| Prices | always repriced on the server from `data/menu.json` | Client prices are never trusted. |
| GST | 5% inclusive (2.5% CGST + 2.5% SGST), SAC 9963 | Matches the existing bill logic; needs CA sign-off before real invoices. |
| Payment | pay at counter by default | No gateway account exists yet. |
| Storage | JSON file, atomic write, in-memory index | Zero dependencies. SQLite/Postgres is a documented upgrade, not a rewrite. |
| Printing | `none` / `browser` / `escpos` | Browser print works today; ESC/POS is the production path. |
| Kitchen refresh | polling every 3 seconds | No SSE or websockets. Simple to debug, survives disconnects, plenty fast for tickets. |
| Hosts | one process, host-based routing | `kitchen.`, `admin.`, `qrorder.` all resolve to the same server. |

## Guest flow

1. Scan QR on the table -> `/t/07?k=...` -> `pages/table-order.html`.
2. Browse categories, tap +/- on items. The tray shows the running total.
3. Tap "Send to Kitchen" -> OTP sheet -> phone -> code -> send.
4. Order appears on the KDS within 3 seconds and prints.
5. Guest sees live status: received -> preparing -> ready -> served.

## Staff flow

- `pages/table-kds.html` - big table numbers, per-order items, one-tap status buttons,
  auto-print on arrival. Runs fullscreen on a kitchen tablet.
- `pages/table-admin.html` - table registry, QR print sheet, today's orders.

## One domain, three hosts

The server routes on the `Host` header, so one process backs the whole thing:

| Host | Serves |
| --- | --- |
| `kitchen.<domain>` | Kitchen board |
| `admin.<domain>` | Tables, QR sheet, orders |
| `qrorder.<domain>` | Guest menu (with `?t=07`) |
| anything else | Admin |

`localhost` and the LAN IP still work for setup; the prefixes are simple host checks, not
DNS requirements. Real subdomains need a DNS record pointing at this box, plus a reverse
proxy (Caddy or nginx) if TLS is wanted. No code change is needed.

## Data model

Order:

```json
{
  "id": "T-2026-10-20-07-A",
  "table": "07",
  "phone": "9876543210",
  "lines": [{ "id": "farmhouse", "name": "Farmhouse", "price": 229, "qty": 2, "lineTotal": 458 }],
  "notes": "",
  "subtotal": 458,
  "taxable": 436.19,
  "gst": 21.81,
  "cgst": 10.9,
  "sgst": 10.91,
  "total": 458,
  "itemCount": 2,
  "status": "received",
  "statusKey": "opaque guest status key",
  "createdAt": "2026-10-20T12:31:00.000Z",
  "updatedAt": "2026-10-20T12:31:00.000Z",
  "statusHistory": [{ "status": "received", "at": "..." }]
}
```

States: `received -> preparing -> ready -> served`, plus `cancelled` from any live state.

Money is stored and computed in paise internally, emitted as rupees with 2 decimals.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/menu` | Categories + items (server prices). |
| GET | `/api/config` | Shop name, OTP and pay-at-counter flags. |
| POST | `/api/otp/request` | `{table, phone}` -> `{ok, devCode?}`. |
| POST | `/api/otp/verify` | `{table, phone, code}` -> `{ok, token}`. |
| POST | `/api/orders` | `{table, phone, token, lines, notes, k}` -> order. |
| GET | `/api/orders` | Staff list, `?since=&status=&table=&limit=`. |
| GET | `/api/orders/:id` | One order; guests need `?key=<statusKey>`. |
| POST | `/api/orders/:id/status` | `{status}` - validated transition. |
| GET | `/api/tables` | Table registry. |
| POST | `/api/tables` | Add/update a table. |
| GET | `/api/tables/qr/:n.svg` | Print-ready QR for table `n`. |
| GET | `/print/ticket/:id` | Browser-printable ticket. |

The kitchen board polls `/api/orders` every 3 seconds. No SSE, no websockets, no extra
moving parts.

Guest endpoints are rate limited per IP and per phone. Staff endpoints are open by default
(`requireStaffKey: false`) because the server is on the shop LAN; set it to `true` to require
`X-Staff-Key` from `tools/data/config.json`. Kitchen and admin hosts are always trusted.

## Limits

- 1-20 per line item, max 50 lines, max Rs 20,000 per order.
- OTP: 6 digits, 5 minute TTL, 3 attempts, 30 s resend cooldown, 5 requests/hour/phone.
- Table token verified once per table session; stored in `sessionStorage`.

## Files

- `lib/table-core.cjs` - pure logic: menu index, reprice, IDs, phone, OTP, ticket text.
- `lib/table-store.cjs` - file-backed store with atomic writes.
- `tools/table-server.mjs` - zero-dep HTTP server, REST, host routing, printing.
- `tools/table-server/vendor/qrcode.js` - vendored MIT QR encoder.
- `pages/table-order.html`, `js/table-order.js`, `css/table-order.css` - guest surface.
- `pages/table-kds.html`, `js/table-kds.js`, `css/table-kds.css` - kitchen board.
- `pages/table-admin.html`, `js/table-admin.js`, `css/table-admin.css` - table registry.
- `tests/unit/table-core.test.cjs`, `tests/unit/table-store.test.cjs` - logic tests.

Runtime data lives in `tools/data/` and is gitignored.

## Failure modes handled

- Menu file changed under a stale guest page -> reprice error names the item, guest is told
  to refresh; no order is created at a wrong price.
- Server restarts mid-service -> state is re-read from disk; the board recovers on its next poll.
- Printer offline -> ticket is queued to `tools/data/print-queue/` so nothing is lost.
- Guest loses the tab -> order id and status key are in `sessionStorage`, status resumes.
- Someone guesses an order id -> guest read requires the per-order status key.

## Not in this pass

- Hosted API on Vercel + Neon (same JSON shapes, different store).
- Payment gateway, split bills, item-level notes, waiter app.
- Multi-outlet. Schema keeps `outlet` out on purpose until the owner confirms.

## Open items

- Actual domain name and who controls DNS (needed for real subdomains).
- Real SMS provider keys (default is `console`, code returned in the response in dev).
- CA confirmation of 5% inclusive and SAC 9963.
- Printer model (ESC/POS width 32 vs 42) and whether a cash drawer kick is needed.
