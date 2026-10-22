'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const {
  loadMenu,
  flattenMenu,
  reprice,
  gstBreakup,
  tableId,
  makeOrderId,
  normalizePhone,
  otpCode,
  nextStatus,
  ticketText,
  validateOrderPayload,
  TableOrderError,
  MAX_ITEM_QTY,
  GST_RATE
} = require('../../lib/table-core.cjs');

const menu = loadMenu(path.join(__dirname, '..', '..', 'data', 'menu.json'));
const firstId = menu.items[0].id;

test('menu loads with unique ids and positive prices', () => {
  assert.ok(menu.items.length > 100);
  assert.equal(new Set(menu.items.map((i) => i.id)).size, menu.items.length);
  for (const item of menu.items) assert.ok(item.price > 0 && Number.isFinite(item.price));
});

test('reprice computes inclusive GST that adds up', () => {
  const result = reprice([{ id: firstId, qty: 1 }], menu.index);
  assert.equal(result.lines.length, 1);
  assert.ok(result.total > 0);
  assert.equal(result.taxable + result.gst, result.total);
  assert.equal(Math.round((result.cgst + result.sgst) * 100), Math.round(result.gst * 100));
  assert.equal(result.itemCount, 1);
});

test('reprice merges duplicate lines and multiplies totals', () => {
  const single = reprice([{ id: firstId, qty: 1 }], menu.index);
  const dupes = reprice([{ id: firstId, qty: 2 }, { id: firstId, qty: 1 }], menu.index);
  assert.equal(dupes.lines.length, 1);
  assert.equal(dupes.itemCount, 3);
  assert.equal(dupes.total, single.total * 3);
});

test('reprice rejects unknown, empty and oversized orders', () => {
  assert.throws(() => reprice([], menu.index), (err) => err.code === 'EMPTY_ORDER');
  assert.throws(
    () => reprice([{ id: 'not-a-real-item', qty: 1 }], menu.index),
    (err) => err.code === 'UNKNOWN_ITEM'
  );
  assert.throws(
    () => reprice([{ id: firstId, qty: MAX_ITEM_QTY + 1 }], menu.index),
    (err) => err.code === 'INVALID_QTY'
  );
  assert.throws(
    () => reprice([{ id: firstId, qty: 1.5 }], menu.index),
    (err) => err.code === 'INVALID_QTY'
  );
});

test('client-supplied prices are ignored', () => {
  const result = reprice([{ id: firstId, qty: 1, price: 1 }], menu.index);
  assert.equal(result.lines[0].price, menu.index.get(firstId).price);
});

test('gstBreakup splits 5 percent evenly', () => {
  const b = gstBreakup(10000);
  assert.equal(b.total, 10000);
  assert.equal(b.taxable, Math.round(10000 / (1 + GST_RATE)));
  assert.equal(b.cgst + b.sgst, b.gst);
});

test('tableId normalizes guest input', () => {
  assert.equal(tableId('7'), '07');
  assert.equal(tableId('07'), '07');
  assert.equal(tableId(' T-12 '), '12');
  assert.equal(tableId('a1'), 'A1');
  assert.throws(() => tableId(''), (err) => err.code === 'INVALID_TABLE');
  assert.throws(() => tableId('0'), (err) => err.code === 'INVALID_TABLE');
  assert.throws(() => tableId('table-seven'), (err) => err.code === 'INVALID_TABLE');
});

test('makeOrderId is stable per table per day and skips used suffixes', () => {
  const date = new Date('2026-10-20T12:00:00Z');
  const first = makeOrderId('7', [], date);
  assert.match(first.id, /^T-2026-10-20-07-A$/);
  const second = makeOrderId('7', [first.id], date);
  assert.match(second.id, /^T-2026-10-20-07-B$/);
  const otherTable = makeOrderId('8', [first.id], date);
  assert.match(otherTable.id, /^T-2026-10-20-08-A$/);
});

test('normalizePhone accepts Indian formats and rejects junk', () => {
  assert.equal(normalizePhone('98765 43210'), '9876543210');
  assert.equal(normalizePhone('+91 98765-43210'), '9876543210');
  assert.equal(normalizePhone('09876543210'), '9876543210');
  assert.throws(() => normalizePhone('12345'), (err) => err.code === 'INVALID_PHONE');
  assert.throws(() => normalizePhone('1234567890'), (err) => err.code === 'INVALID_PHONE');
});

test('otpCode is always six digits', () => {
  for (let i = 0; i < 50; i += 1) assert.match(otpCode(), /^\d{6}$/);
});

test('status transitions follow the kitchen flow', () => {
  assert.equal(nextStatus('received', 'preparing'), 'preparing');
  assert.equal(nextStatus('ready', 'served'), 'served');
  assert.throws(() => nextStatus('received', 'served'), (err) => err.code === 'INVALID_TRANSITION');
  assert.throws(() => nextStatus('served', 'preparing'), (err) => err.code === 'INVALID_TRANSITION');
  assert.throws(() => nextStatus('received', 'nope'), (err) => err.code === 'INVALID_STATUS');
});

test('ticketText includes table, items and totals within width', () => {
  const order = {
    id: 'T-2026-10-20-07-A',
    table: '07',
    createdAt: '2026-10-20T12:00:00Z',
    phone: '9876543210',
    notes: 'no onion please',
    lines: [{ name: 'Farmhouse', qty: 2, lineTotal: 458 }],
    total: 458,
    cgst: 10.9,
    sgst: 10.91
  };
  const text = ticketText(order, { width: 32, name: 'PIZJO' });
  assert.match(text, /TABLE 07/);
  assert.match(text, /2 x Farmhouse/);
  assert.match(text, /TOTAL/);
  assert.match(text, /PAY AT COUNTER/);
  assert.match(text, /no onion/);
  for (const line of text.split('\n')) assert.ok(line.length <= 32, 'too wide: ' + line);
});

test('validateOrderPayload returns a repriced order with a normalized table', () => {
  const payload = validateOrderPayload(
    { table: '7', phone: '9876543210', lines: [{ id: firstId, qty: 1 }], notes: '  extra spicy  ' },
    menu.index
  );
  assert.equal(payload.table, '07');
  assert.equal(payload.phone, '9876543210');
  assert.equal(payload.notes, 'extra spicy');
  assert.ok(payload.total > 0);
});

test('errors are TableOrderError instances', () => {
  try {
    reprice([], menu.index);
    assert.fail('should throw');
  } catch (err) {
    assert.ok(err instanceof TableOrderError);
    assert.equal(err.name, 'TableOrderError');
  }
});

test('flattenMenu tolerates bad shapes', () => {
  const flat = flattenMenu({ categories: [{ name: 'X', items: [{ id: 'a', name: 'A', price: '10' }, { id: 'b', price: 0 }, null] }] });
  assert.equal(flat.items.length, 1);
  assert.equal(flat.items[0].price, 10);
});
