# CREDENTIALS — Pizjo (To be filled and transferred after payment)
> Keep this separate PDF, not in Git. Share via 1Password/encrypted drive.

| Service | URL / Host | Login | Password / Key | Owner after handover | Notes |
|---|---|---|---|---|---|
| GitHub | https://github.com/chahat1709/pizjo | chahat1709 | — | Client (transfer repo) | Branch `pr7/telemetry-budgets` → `main` on acceptance |
| Vercel | https://vercel.com/chahatjain096-8593s-projects/pizjo | — | Token gho_*** | Client team | Transfer Project → client team, re-deploy |
| Domain | — | registrar login | — | Client | DNS A/CNAME to Vercel, SSL auto |
| GA4 | https://analytics.google.com | GA property | G-XXXXXXXXXX → real | Client | Replace in index.html:12 + pages/*.html |
| Google Business Profile | https://business.google.com | — | Place ID | Client | For Maps iframe pages/contact.html:163 |
| WhatsApp Business | +91 92653 70588 | — | — | Client | From js/config.js:1 telUrl/whatsappUrl |
| Admin | https://pizjo-admin.vercel.app | owner username | owner password | Client admin | Created via /login setup, rotate after handover |
| DB (Neon Postgres) | Neon console → project | — | pooled DATABASE_URL | Client | Never commit, Vercel env only |
| Sessions | — | — | SESSION_SECRET (32+ chars) | Client | Vercel env only |
| Fonts | fonts.googleapis.com | — | — | — | No key, preload in index.html:99 |

**Transfer steps:**
1. GitHub: Settings → Transfer ownership → client org
2. Vercel: Settings → Transfer Project
3. Domain: registrar → Push to client account, update nameservers
4. Rotate all temp passwords after transfer
5. Remove dev access after 30-day warranty unless retainer
