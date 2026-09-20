# Pizjo Admin and Storefront Production-Readiness Report

> Superseded by `vercel-neon-migration.md`: the admin moved to Vercel + Neon
> with local credential auth. The previous hosting below is retired; this
> report is kept as the historical verification record.

## Status summary

The protected Pizjo Admin application is published at `https://pizjo-admin.vercel.app/`. The customer storefront is published at `https://pizjo.vercel.app/`. Both systems are connected through narrowly scoped, read-only customer feeds: menu availability and active offers.

| Area | Verified status | Evidence |
|---|---|---|
| Protected admin access | Ready | Role-protected routes and server-side admin procedures are implemented and tested. |
| Catalog baseline | Ready | The authoritative baseline has 81 menu items across 11 categories. |
| Customer menu availability feed | Ready | The published admin endpoint responds with HTTP 200 and allows the storefront origin only. |
| Customer offers feed | Ready | The storefront replaces previous hardcoded offer cards with administrator-controlled campaigns and an honest empty state when no campaign is active. |
| Storefront security boundary | Ready | Production CSP allows only the published Pizjo Admin origin for customer feed requests; HSTS and frame protection remain active. |
| Local offline testing | Ready | A no-login Windows local demo runs at `http://localhost:4173`, uses browser-local resettable data, and avoids published services. |
| Automated checks | Ready | The protected-admin suite has 15 passing tests; the storefront validator, unit suite, and browser suite passed after feed integration. |

## Controlled rollout status

The online connectivity is deployed, but this report does **not** classify every operational change as ready for unattended use. Live inventory and offers can affect customer ordering, so they remain protected behind administrator authentication.

The one deferred verification is a real out-of-stock test on the public storefront. The published availability feed currently reports all live items as available. The storefront code, local browser test, and customer-facing fallback behavior have been verified; however, temporarily changing a real menu item’s availability requires an authorized administrator to sign in and approve that business action. This check should be performed during the later online rollout, with the selected item restored immediately afterward.

## Online rollout procedure

When the local workflow review is approved, an authorized administrator should sign in to Pizjo Admin, select a non-critical menu item, mark it out of stock, and confirm the homepage plus `/pages/menu.html` show the out-of-stock label and disabled add-to-cart control. The item should then be restored to available. Active offers should similarly be created only when their terms, dates, eligibility, and customer communication have been approved.

## Local-test procedure

For local review, open `C:\Users\chaha\OneDrive\Pictures\Predator\pizjo-admin-local-demo\start-local.cmd` and browse to `http://localhost:4173`. All local operations, including stock changes, orders, invoices, offers, team records, and social content, remain test data in the browser. The reset control clears that local data.
