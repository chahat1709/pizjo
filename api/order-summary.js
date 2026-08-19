const menu = require('../data/menu.json');

const MAX_ITEM_QTY = 20;
const MAX_CART_ITEMS = 50;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
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
    let total = 0;

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
      total += lineTotal;
    }

    return json(res, 200, { items, total, currency: '₹' });
  } catch (error) {
    console.error('[order-summary] request failed', error);
    return json(res, 400, { error: 'Invalid order payload' });
  }
};
