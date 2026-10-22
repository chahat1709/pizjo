'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createStore } = require('../../lib/table-store.cjs');

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pizjo-table-'));
}

function orderInput(overrides) {
  return {
    table: '07',
    phone: '9876543210',
    lines: [{ id: 'x', name: 'X', price: 100, qty: 2, lineTotal: 200 }],
    subtotal: 200,
    taxable: 190.48,
    cgst: 4.76,
    sgst: 4.76,
    gst: 9.52,
    total: 200,
    itemCount: 2,
    ...overrides
  };
}

test('store seeds config, tables and orders on first run', () => {
  const dir = tempDir();
  const store = createStore({ dir });
  assert.equal(store.listTables().length, 12);
  assert.equal(store.listTables()[0].number, '01');
  assert.equal(store.config.payAtCounter, true);
  assert.ok(fs.existsSync(path.join(dir, 'config.json')));
  assert.ok(fs.existsSync(path.join(dir, 'tables.json')));
  store.close();
});

test('store persists orders across restarts', () => {
  const dir = tempDir();
  const first = createStore({ dir });
  const created = first.createOrder(orderInput());
  first.close();

  const second = createStore({ dir });
  const loaded = second.getOrder(created.id);
  assert.ok(loaded);
  assert.equal(loaded.table, '07');
  assert.equal(loaded.status, 'received');
  assert.equal(second.listOrders().length, 1);
  second.close();
});

test('order ids increment per table per day', () => {
  const store = createStore({ dir: tempDir() });
  const a = store.createOrder(orderInput());
  const b = store.createOrder(orderInput());
  const c = store.createOrder(orderInput({ table: '08' }));
  assert.match(a.id, /-07-A$/);
  assert.match(b.id, /-07-B$/);
  assert.match(c.id, /-08-A$/);
  store.close();
});

test('status changes are validated and recorded', () => {
  const store = createStore({ dir: tempDir() });
  const order = store.createOrder(orderInput());
  const updated = store.setStatus(order.id, 'preparing');
  assert.equal(updated.status, 'preparing');
  assert.equal(updated.statusHistory.length, 2);
  assert.throws(() => store.setStatus(order.id, 'served'), (err) => err.code === 'INVALID_TRANSITION');
  assert.throws(() => store.setStatus('missing', 'ready'), (err) => err.code === 'ORDER_NOT_FOUND');
  store.close();
});

test('subscribers hear create and update events', () => {
  const store = createStore({ dir: tempDir() });
  const events = [];
  const off = store.subscribe((event) => events.push(event.type));
  const order = store.createOrder(orderInput());
  store.setStatus(order.id, 'preparing');
  off();
  store.setStatus(order.id, 'ready');
  assert.deepEqual(events, ['order.created', 'order.updated']);
  store.close();
});

test('tables can be added and edited', () => {
  const store = createStore({ dir: tempDir() });
  store.upsertTable({ number: '13', seats: 6 });
  const table = store.listTables().find((t) => t.number === '13');
  assert.equal(table.seats, 6);
  store.upsertTable({ number: '13', seats: 2, active: false });
  const edited = store.listTables().find((t) => t.number === '13');
  assert.equal(edited.seats, 2);
  assert.equal(edited.active, false);
  store.close();
});

test('stats only count live orders from today', () => {
  const store = createStore({ dir: tempDir() });
  const order = store.createOrder(orderInput());
  store.createOrder(orderInput({ table: '08' }));
  store.setStatus(order.id, 'cancelled');
  const stats = store.stats();
  assert.equal(stats.todayOrders, 1);
  assert.equal(stats.todayRevenue, 200);
  store.close();
});

test('listOrders filters by table and status', () => {
  const store = createStore({ dir: tempDir() });
  const a = store.createOrder(orderInput());
  store.createOrder(orderInput({ table: '08' }));
  store.setStatus(a.id, 'preparing');
  assert.equal(store.listOrders({ table: '07' }).length, 1);
  assert.equal(store.listOrders({ status: 'preparing' }).length, 1);
  assert.equal(store.listOrders({ status: 'received' }).length, 1);
  store.close();
});
