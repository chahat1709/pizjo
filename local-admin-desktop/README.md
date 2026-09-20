# Pizjo Admin — Windows Desktop Application

This is the standalone, offline Pizjo restaurant-operations application. It is separate from the live Pizjo customer website, the cloud-hosted admin, and the browser-only local demo.

## What it does

The desktop application stores restaurant records in a SQLite database on the Windows computer. It supports local owner setup and sign-in, admin/staff roles, menu and stock controls, order intake, status updates, invoices, sales summaries, local offers, local staff accounts, social-planning records, activity history, and manual backup/restore.

It makes no network requests during normal use. It does not need any cloud account, Vercel, Cloudflare, a cloud database, or internet access.

## Install the Windows application

The built installer is created at:

```text
release\Pizjo Admin Setup 0.1.0.exe
```

Double-click the installer, complete the Windows installation prompts, then open **Pizjo Admin** from the Start menu or the desktop shortcut. On first launch, create the owner account for that computer. Use an eight-character-or-longer password and keep a safe record of it.

## Data location and backup

The operational database is created inside the signed-in Windows user’s application-data area; do not move, edit, or share the database while the app is open. Use **Settings → Create backup** to write a backup file to a USB drive or another safe folder. Use **Settings → Restore a backup** only when you intend to replace the current local records; Pizjo Admin first writes a safety copy before restoring.

## Development commands

```text
npm install
npm test
npm start
npm run dist
```

The generated `release/` installer, `node_modules/`, and live local databases are intentionally ignored by Git. Only the source code, tests, menu baseline, and documentation should be committed.

## Explicit boundary

This desktop application does not update the public Pizjo website, send WhatsApp messages, publish offers, connect social accounts, or migrate current cloud records. Those integrations require a separately approved online deployment and synchronization design.
