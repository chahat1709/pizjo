# Pizjo Admin: Offline Local Demo and Later Online Rollout

## Purpose and boundary

The **Pizjo Admin Local Demo** is an isolated Windows test application. It is intended for visual and workflow review before any further online business changes are made. It does not access, copy, or modify live Pizjo order, stock, offer, employee, customer, WhatsApp, social, or billing data.

The published Pizjo Admin remains a separate cloud application. Its protected online mode depends on local credential sign-in, a managed Postgres database for persisted operations data, and public read-only availability and offers endpoints consumed by the published Pizjo storefront. These cloud dependencies are intentionally absent from the local demo.

| Mode | Login and storage | What can change | Network behavior |
|---|---|---|---|
| **Local demo** | No login; browser local storage only | Test orders, test stock, test offers, test bills, test team, and test social records in the local browser | Runs at `http://localhost:4173`; does not call published Pizjo services |
| **Published admin** | Protected business login and managed database | Live menu availability, offers, operational records, and storefront feed data | Uses the published Pizjo Admin service and its production integrations |

## Validated Windows local test procedure

The demo was installed at:

```text
C:\Users\chaha\OneDrive\Pictures\Predator\pizjo-admin-local-demo
```

To test it locally, double-click `start-local.cmd` and open [http://localhost:4173](http://localhost:4173) on the same Windows computer. The test server starts with Node.js. `app.js` and `server.mjs` passed Node syntax checks, and a temporary server run returned HTTP 200 for the local entry page.

Use the **Reset local demo data** control to discard all local test changes. This reset removes only the browser-local demo data and has no effect on the published Pizjo applications.

## Later online rollout prerequisites

The online rollout should occur only after the local workflow review is approved. Before enabling any live menu or offer changes, authenticate to the published Pizjo Admin as an authorized business administrator, confirm the current menu and offer records, and decide which local scenarios should become real business workflows.

The move online is not an automatic sync. It is a controlled configuration and data-review step, ensuring that local test orders, invoices, staff, offers, and stock adjustments cannot accidentally become production records.
