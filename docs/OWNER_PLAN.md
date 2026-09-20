# Pizjo — Owner Meeting & Project Plan
**Owner:** Rippalkumar Solanki · **Shop:** Amraiwadi, Ahmedabad · **Goal:** Close build + launch

## 1. Intel (read before entering)
- Ex-Jio (store ops) → Paytm Sr Executive (LFR brands, POS/payments, pan-India award) → DotPe Area/Ops/Sales Manager 2021–25 → Pizjo owner since May 2025.
- Speaks fluent POS (KOT/KDS/roles/day-close). Never dumb it down. Never bash DotPe (ex-employer) — frame **graduation, not replacement**.
- Shop signals: 3.5★/57 ratings, ~25 orders/day, nets ~₹35–50k/mo, bleeds ~₹19k/mo to platforms. DotPe costs him ~₹4–5k/mo + ₹20–25k/yr sunk.
- Enemy: The Lio' Pizza (13 outlets, 4.1★). He can't out-spend them; he must out-convert.
- Trigger: he's competitive (Reactivation Champ) and respects vendor process (he implemented solutions himself).

## 2. Carry into the meeting
- [ ] Two devices, both charged: phone (customer site) + phone/tablet (KDS)
- [ ] pizjo.vercel.app + `pages/kds.html` pre-loaded (incognito-tested, hard-refreshed)
- [ ] Printed one-page price sheet (section 5)
- [ ] Advance receipt (50%, with scope + go-live date lines, duplicate book)
- [ ] `docs/HANDOFF.md` open on laptop + validator/test output screenshots
- [ ] Ask for on the spot: menu photos from his phone, logo file, GA/Business-profile access decision, go-live date

## 3. Meeting agenda (45 min)
| Time | Block | Script |
|---|---|---|
| 0–5 | Rapport | Acknowledge his background: Jio store, Paytm LFR, DotPe merchant solutions. "Aapne implementation kiya hai — main process se baat karunga, presentation se nahi." |
| 5–12 | Diagnosis | Ask ONE question, then listen: "DotPe + Zomato-Swiggy milake mahine ka kitna kat jata hai?" Let him say the number. Confirm: rented template, per-order cuts, no customer data, 3.5★ gap vs Lio. |
| 12–27 | Live demo | **KDS first** (his language): order appears → bump Pending→Preparing→Ready. Then customer flow: add 2 pizzas → apply LATE20 → checkout → WhatsApp msg with order ID. Then `pages/track.html`: timeline → print GST bill. Then admin: one-tap availability toggle. |
| 27–35 | Price | Present sheet. Anchor: "3 mahine ka commission = meri poori fee, ek baar." Mention DotPe renewal (₹20–25k/yr, non-refundable) landing again if he waits. |
| 35–40 | Objections | Rista call → ownership math. Cash → 50/50 split. Menu updates → show admin (2 min) or ₹3k/mo care. Breakage → 30-day written warranty. |
| 40–45 | Close | Collect: 50% advance, his food photos/logo, GA + Business Profile access, **go-live date** ("this Sunday"). Receipt signed by both. |

## 4. Lines that work on him
- "DotPe ne launch-day pe dukaan live kar di — sahi call tha. Ab dukaan ko apna system chahiye."
- "Rista aapne merchants ko lagwaya hai — usme kya milta hai, kya nahi, aap mujhse behtar jaante ho."
- "13 outlet wale se saste mein nahi jeetoge. Repeat customer apne paas rakh ke jeetoge."
- "Yeh raha mera test report — 19 tests, validator green. Aap vendor judge karna jaante ho."
- Never: aggregator-bashing, tech jargon without purpose, "AI website", promises of Zomato integration or online payments (not built).

## 5. Price sheet (print this)
| Package | One-time | Includes |
|---|---|---|
| Website + ordering | ₹35,000 | Brand site, 81-item menu, cart, WhatsApp orders, BOGO/LATE20 promo engine, order tracking, KDS screen, GST bill print |
| + Admin + billing | ₹50,000 | All above + stock, staff/shifts, GST invoices, offers control, sales reports |
| Monthly care (optional) | ₹3,000/mo | Menu changes, updates, backup, priority support |

Terms: 50% advance to start, 50% on go-live. 30-day bug-fix warranty (scope bugs free; new features billed). IP + all credentials transfer on final payment (`docs/HANDOFF.md`, `docs/CREDENTIALS_TEMPLATE.md`).

## 6. Execution plan (after advance)
| Week | Work | Owner needed for |
|---|---|---|
| 1 | Real food photos swap (top 20), GA4 ID live, Business Profile Place ID fix, reviews intake (ask 10 regulars) | Photos, GA login, 30 min access |
| 2 | Review links live, bill review-QR, promo calendar wired (post → code → order), live out-of-stock toggle test | Approve offers/dates |
| 3 | Cross-device QA, staff KDS training (15 min), go-live, handover ZIP + credentials + Loom walkthrough | Sign-off, balance payment |

## 7. Risks
- **He calls ex-DotPe colleagues for Rista.** Counter: ownership math, never feature war.
- **Cash tight (setup debt).** Hold 50/50, fast go-live date, no scope creep without SCR.
- **Scope creep ("Swiggy jaisa app bana do").** Point at signed scope; new asks = new quote.
- **DotPe renewal auto-charges.** Ask its date in the meeting; time go-live before it.

## 8. Success metrics (review at day 30, sells the retainer)
- Direct (zero-commission) orders/week, repeat-customer count from order log, Google rating movement, DotPe/aggregator share of revenue down. Present as one page → converts to ₹3k/mo care.
