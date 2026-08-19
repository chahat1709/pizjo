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
