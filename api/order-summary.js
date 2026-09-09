const menu = require('../data/menu.json');
const offers = require('../data/offers.json');

const MAX_ITEM_QTY = 20;
const MAX_CART_ITEMS = 50;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function istNow(nowMs = Date.now()) {
  return new Date(nowMs + IST_OFFSET_MS);
}

function findPromo(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return null;
  return (offers.promos || []).find((p) => p.code === normalized) || null;
}

function validatePromo(promo, { subtotal, totalQty, items }, nowMs) {
  const now = istNow(nowMs);
  const day = now.getUTCDay();
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60;

  if (Array.isArray(promo.days) && !promo.days.includes(day)) {
    return { ok: false, reason: `${promo.code} is valid only on ${promo.days.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}` };
  }
  if (typeof promo.startHour === 'number' && typeof promo.endHour === 'number') {
    if (hour < promo.startHour || hour >= promo.endHour) {
      return { ok: false, reason: `${promo.code} is valid only between ${promo.startHour}:00 and ${promo.endHour}:00 IST` };
    }
  }
  if (promo.minTotal && subtotal < promo.minTotal) {
    return { ok: false, reason: `${promo.code} needs a minimum order of ₹${promo.minTotal}` };
  }
  if (promo.minItems && totalQty < promo.minItems) {
    return { ok: false, reason: `${promo.code} needs at least ${promo.minItems} items in cart` };
  }

  let amount = 0;
  if (promo.type === 'percent') {
    amount = Math.floor((subtotal * Number(promo.value || 0)) / 100);
  } else if (promo.type === 'bogo_cheapest_free') {
    const cheapest = Math.min(...items.map((i) => i.unitPrice));
    amount = Number.isFinite(cheapest) ? cheapest : 0;
  } else {
    return { ok: false, reason: `${promo.code} is not redeemable online` };
  }

  if (promo.maxDiscount) amount = Math.min(amount, promo.maxDiscount);
  amount = Math.max(0, Math.min(amount, subtotal));
  if (!amount) return { ok: false, reason: `${promo.code} gives no discount on this cart` };
  return { ok: true, amount };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const requested = Array.isArray(payload?.items) ? payload.items : [];
    if (!requested.length || requested.length > MAX_CART_ITEMS) {
      return json(res, 400, { error: 'Invalid order item count' });
    }

    const catalog = new Map((menu.categories || []).flatMap((category) => (category.items || []).map((item) => [item.id, item])));
    const seen = new Set();
    const items = [];
    let subtotal = 0;
    let totalQty = 0;

    for (const requestedItem of requested) {
      const id = String(requestedItem?.id || '');
      const qty = Number(requestedItem?.qty);
      const product = catalog.get(id);
      if (!product || seen.has(id) || !Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QTY) {
        return json(res, 400, { error: 'Invalid order item' });
      }
      seen.add(id);
      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * qty;
      items.push({ id, name: product.name, qty, unitPrice, lineTotal });
      subtotal += lineTotal;
      totalQty += qty;
    }

    let discount = null;
    if (payload?.promoCode) {
      const promo = findPromo(payload.promoCode);
      if (!promo) {
        return json(res, 400, { error: 'Invalid promo code', code: 'INVALID_PROMO' });
      }
      const check = validatePromo(promo, { subtotal, totalQty, items }, Date.now());
      if (!check.ok) {
        return json(res, 400, { error: check.reason, code: 'PROMO_NOT_APPLICABLE' });
      }
      discount = { code: promo.code, title: promo.title, amount: check.amount };
    }

    const total = subtotal - (discount ? discount.amount : 0);
    return json(res, 200, { items, subtotal, discount, total, currency: '₹' });
  } catch (error) {
    console.error('[order-summary] request failed', error);
    return json(res, 400, { error: 'Invalid order payload' });
  }
};
