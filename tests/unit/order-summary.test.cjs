const test = require('node:test');
const assert = require('node:assert/strict');
const menu = require('../../data/menu.json');
const handler = require('../../api/order-summary.js');

function invoke(body, method = 'POST') {
  return new Promise((resolve) => {
    const response = {
      statusCode: 200,
      headers: {},
      status(code) { this.statusCode = code; return this; },
      setHeader(key, value) { this.headers[key] = value; },
      end(payload) { resolve({ status: this.statusCode, body: JSON.parse(payload) }); },
    };
    Promise.resolve(handler({ method, body }, response));
  });
}

test('recalculates trusted prices from catalog IDs', async () => {
  const item = menu.categories[0].items[0];
  const result = await invoke({ items: [{ id: item.id, qty: 2 }] });
  assert.equal(result.status, 200);
  assert.equal(result.body.items[0].unitPrice, item.price);
  assert.equal(result.body.total, item.price * 2);
});

test('rejects unknown IDs and invalid quantities', async () => {
  const result = await invoke({ items: [{ id: 'not-a-real-item', qty: 999 }] });
  assert.equal(result.status, 400);
});

test('rejects non-POST requests', async () => {
  const result = await invoke({}, 'GET');
  assert.equal(result.status, 405);
});

test('returns subtotal with no promo (backward compatible)', async () => {
  const item = menu.categories[0].items[0];
  const result = await invoke({ items: [{ id: item.id, qty: 2 }] });
  assert.equal(result.status, 200);
  assert.equal(result.body.subtotal, item.price * 2);
  assert.equal(result.body.discount, null);
  assert.equal(result.body.total, item.price * 2);
});

test('rejects unknown promo codes', async () => {
  const item = menu.categories[0].items[0];
  const result = await invoke({ items: [{ id: item.id, qty: 1 }], promoCode: 'NOPE123' });
  assert.equal(result.status, 400);
  assert.equal(result.body.code, 'INVALID_PROMO');
});

test('rounds fractional prices to 2dp (no float dust in bills)', async () => {
  const item = menu.categories.flatMap((c) => c.items).find((i) => i.price !== Math.floor(i.price));
  assert.ok(item, 'catalog needs a fractional-price item for this test');
  const qty = 3;
  const result = await invoke({ items: [{ id: item.id, qty }] });
  assert.equal(result.status, 200);
  const expected = Math.round(item.price * qty * 100) / 100;
  assert.equal(result.body.items[0].lineTotal, expected);
  assert.equal(result.body.total, expected);
});

test('validates promo day/time windows server-side', async () => {
  const item = menu.categories[0].items[0];
  // BOGO requires Tuesday + 2 items; a 1-item cart must fail with PROMO_NOT_APPLICABLE or day error
  const result = await invoke({ items: [{ id: item.id, qty: 1 }], promoCode: 'BOGO' });
  assert.equal(result.status, 400);
  assert.match(result.body.code, /PROMO_NOT_APPLICABLE|INVALID_PROMO/);
});
