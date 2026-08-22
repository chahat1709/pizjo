# Pizjo Admin — Local Offline Demo

This folder is a **local test workspace**, independent of the published Pizjo Admin and the public Pizjo customer site. It requires no business login and does not call any cloud API, WhatsApp account, payment service, Pizjo Admin database, or production storefront.

## Start it on this Windows computer

Double-click **`start-local.cmd`**. A command window will open. In a browser on the same computer, open [http://localhost:4173](http://localhost:4173).

All changes are stored only in that browser’s local storage. The **Reset local demo data** button deletes the local test orders, inventory adjustments, menu edits, offers, invoices, team records, social records, and activity history, then restores the demo baseline.

| Local demo feature | What it tests | What it does not do |
|---|---|---|
| Orders and sales | Status progression, totals, local reporting | Send WhatsApp messages or create production orders |
| Inventory and menu | Availability, thresholds, local edits | Change stock on the published Pizjo website |
| Offers | Campaign creation and activation workflow | Publish a customer offer |
| Billing | Itemized ₹ test invoices and print layout | Create accounting records or tax documents |
| Team and social | Management screens and activity records | Send invitations or connect accounts |

## Later online rollout

After the local review is approved, the same workflows can be moved to the protected Pizjo Admin deployment. That step requires admin authentication because it can affect live menu stock, offers, orders, and staff data. The local demo is deliberately isolated from this online rollout.
