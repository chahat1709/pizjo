'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  makeOrderId,
  tableId,
  nextStatus,
  STATUSES,
  TableOrderError
} = require('./table-core.cjs');

const RETENTION_DAYS = 30;
const DEFAULT_TABLES = 12;

const DEFAULTS = {
  shopName: 'Pizjo',
  address: 'Amraiwadi, Ahmedabad',
  gstin: '',
  payAtCounter: true,
  requireOtp: true,
  tableTokenRequired: false,
  staffKey: '',
  requireStaffKey: false,
  tableCount: DEFAULT_TABLES,
  print: { mode: 'browser', host: '', port: 9100, width: 32 }
};

function readJson(file, fallback) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    if (err && err.code === 'ENOENT') return fallback;
    throw err;
  }
}

function writeJsonAtomic(file, value) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = file + '.' + process.pid + '.' + Date.now() + '.tmp';
  const body = JSON.stringify(value, null, 2) + '\n';
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeFileSync(fd, body);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
}

function createStore(options) {
  const opts = options || {};
  const dir = opts.dir || path.join(__dirname, '..', 'tools', 'data');
  const files = {
    orders: path.join(dir, 'orders.json'),
    tables: path.join(dir, 'tables.json'),
    config: path.join(dir, 'config.json')
  };

  fs.mkdirSync(dir, { recursive: true });

  let config = { ...DEFAULTS, ...(readJson(files.config, {}) || {}) };
  config.print = { ...DEFAULTS.print, ...(config.print || {}) };
  if (!readJson(files.config, null)) writeJsonAtomic(files.config, config);

  let tables = readJson(files.tables, null);
  if (!Array.isArray(tables) || !tables.length) {
    tables = Array.from({ length: config.tableCount || DEFAULT_TABLES }, (_, i) => ({
      number: tableId(i + 1),
      seats: 4,
      active: true
    }));
    writeJsonAtomic(files.tables, tables);
  }

  let orders = readJson(files.orders, []);
  if (!Array.isArray(orders)) orders = [];

  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const pruned = orders.filter((o) => {
    const at = o && o.createdAt ? Date.parse(o.createdAt) : 0;
    return at >= cutoff;
  });
  if (pruned.length !== orders.length) {
    orders = pruned;
    writeJsonAtomic(files.orders, orders);
  }

  const byId = new Map(orders.map((o) => [o.id, o]));
  const listeners = new Set();

  function emit(event) {
    for (const fn of listeners) {
      try {
        fn(event);
      } catch (err) {
        /* a broken listener must not break the store */
      }
    }
  }

  function saveOrders() {
    writeJsonAtomic(files.orders, orders);
  }

  function saveTables() {
    writeJsonAtomic(files.tables, tables);
  }

  function saveConfig() {
    writeJsonAtomic(files.config, config);
  }

  function listTables() {
    return tables
      .slice()
      .sort((a, b) => String(a.number).localeCompare(String(b.number), 'en', { numeric: true }))
      .map((t) => ({ ...t }));
  }

  function upsertTable(input) {
    const number = tableId(input && input.number);
    const seats = Math.min(20, Math.max(1, Number(input && input.seats) || 4));
    const active = input && input.active === false ? false : true;
    const existing = tables.find((t) => t.number === number);
    if (existing) {
      existing.seats = seats;
      existing.active = active;
    } else {
      tables.push({ number, seats, active });
    }
    saveTables();
    return { number, seats, active };
  }

  function createOrder(data) {
    const payload = data || {};
    const table = tableId(payload.table);
    const existingIds = orders.map((o) => o.id);
    const { id } = makeOrderId(table, existingIds, payload.createdAt ? new Date(payload.createdAt) : new Date());
    const now = new Date().toISOString();
    const order = {
      id,
      table,
      phone: String(payload.phone || ''),
      lines: Array.isArray(payload.lines) ? payload.lines : [],
      notes: String(payload.notes || ''),
      subtotal: Number(payload.subtotal) || 0,
      taxable: Number(payload.taxable) || 0,
      cgst: Number(payload.cgst) || 0,
      sgst: Number(payload.sgst) || 0,
      gst: Number(payload.gst) || 0,
      total: Number(payload.total) || 0,
      itemCount: Number(payload.itemCount) || 0,
      payAtCounter: payload.payAtCounter !== false,
      statusKey: String(payload.statusKey || ''),
      status: 'received',
      createdAt: now,
      updatedAt: now,
      statusHistory: [{ status: 'received', at: now }]
    };
    orders.push(order);
    byId.set(order.id, order);
    saveOrders();
    emit({ type: 'order.created', order: { ...order } });
    return { ...order };
  }

  function getOrder(id) {
    const order = byId.get(String(id));
    return order ? { ...order } : null;
  }

  function listOrders(filter) {
    const f = filter || {};
    const since = f.since ? Date.parse(f.since) : 0;
    return orders
      .filter((o) => (f.status ? o.status === f.status : true))
      .filter((o) => (Number.isFinite(since) && since ? Date.parse(o.createdAt) >= since : true))
      .filter((o) => (f.table ? o.table === tableId(f.table) : true))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, Number(f.limit) > 0 ? Number(f.limit) : 200)
      .map((o) => ({ ...o }));
  }

  function setStatus(id, status, meta) {
    const order = byId.get(String(id));
    if (!order) {
      throw new TableOrderError('ORDER_NOT_FOUND', 'Order not found: ' + id);
    }
    if (!STATUSES.includes(status)) {
      throw new TableOrderError('INVALID_STATUS', 'Unknown status: ' + status);
    }
    nextStatus(order.status, status);
    const now = new Date().toISOString();
    order.status = status;
    order.updatedAt = now;
    order.statusHistory = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    order.statusHistory.push({ status, at: now, by: (meta && meta.by) || 'staff' });
    saveOrders();
    emit({ type: 'order.updated', order: { ...order } });
    return { ...order };
  }

  function stats() {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    let count = 0;
    let revenue = 0;
    for (const o of orders) {
      if (o.status === 'cancelled') continue;
      if (Date.parse(o.createdAt) >= start) {
        count += 1;
        revenue += Number(o.total) || 0;
      }
    }
    return { todayOrders: count, todayRevenue: Math.round(revenue * 100) / 100, totalOrders: orders.length };
  }

  return {
    dir,
    files,
    get config() {
      return { ...config, print: { ...config.print } };
    },
    updateConfig(patch) {
      config = { ...config, ...(patch || {}) };
      if (patch && patch.print) config.print = { ...DEFAULTS.print, ...config.print, ...patch.print };
      saveConfig();
      return { ...config };
    },
    listTables,
    upsertTable,
    createOrder,
    getOrder,
    listOrders,
    setStatus,
    stats,
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    close() {
      listeners.clear();
    }
  };
}

module.exports = { createStore, DEFAULTS, writeJsonAtomic, readJson };
