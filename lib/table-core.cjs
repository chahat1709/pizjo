'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const GST_RATE = 0.05;
const MAX_ITEM_QTY = 20;
const MAX_LINE_ITEMS = 50;
const MAX_ORDER_TOTAL = 20000;
const MAX_NOTES = 200;
const MENU_PATH = path.join(__dirname, '..', 'data', 'menu.json');

const STATUSES = ['received', 'preparing', 'ready', 'served', 'cancelled'];

const TRANSITIONS = {
  received: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: [],
  cancelled: []
};

class TableOrderError extends Error {
  constructor(code, message, details) {
    super(message || code);
    this.name = 'TableOrderError';
    this.code = code;
    if (details) this.details = details;
  }
}

function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

function toRupees(paise) {
  return Math.round(paise) / 100;
}

function formatINR(amount) {
  const value = Number(amount) || 0;
  return '\u20B9' + value.toFixed(2);
}

function gstBreakup(totalPaise) {
  const total = Math.round(totalPaise);
  const taxable = Math.round(total / (1 + GST_RATE));
  const gst = total - taxable;
  const cgst = Math.floor(gst / 2);
  return { taxable, gst, cgst, sgst: gst - cgst, total };
}

function flattenMenu(menu) {
  const categories = Array.isArray(menu && menu.categories) ? menu.categories : [];
  const index = new Map();
  const items = [];
  for (const category of categories) {
    const list = Array.isArray(category.items) ? category.items : [];
    for (const item of list) {
      if (!item || typeof item.id !== 'string' || !item.id) continue;
      const entry = {
        id: item.id,
        name: String(item.name || item.id),
        price: Number(item.price),
        veg: item.veg !== false,
        category: String(category.name || ''),
        categoryId: String(category.id || '')
      };
      if (!Number.isFinite(entry.price) || entry.price <= 0) continue;
      index.set(entry.id, entry);
      items.push(entry);
    }
  }
  return { index, items, categories };
}

function loadMenu(menuPath) {
  const file = menuPath || MENU_PATH;
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new TableOrderError('MENU_UNAVAILABLE', 'Menu file could not be read: ' + file);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new TableOrderError('MENU_INVALID', 'Menu file is not valid JSON: ' + file);
  }
  const flat = flattenMenu(parsed);
  if (!flat.items.length) {
    throw new TableOrderError('MENU_EMPTY', 'Menu file has no priced items: ' + file);
  }
  return { menu: parsed, ...flat };
}

function normalizeLines(lines) {
  if (!Array.isArray(lines) || !lines.length) {
    throw new TableOrderError('EMPTY_ORDER', 'An order needs at least one item.');
  }
  if (lines.length > MAX_LINE_ITEMS) {
    throw new TableOrderError('TOO_MANY_LINES', 'An order can hold at most ' + MAX_LINE_ITEMS + ' items.');
  }
  const merged = new Map();
  for (const line of lines) {
    if (!line || typeof line !== 'object') {
      throw new TableOrderError('INVALID_LINE', 'Each order line must be an object.');
    }
    const id = typeof line.id === 'string' ? line.id.trim() : '';
    if (!id) {
      throw new TableOrderError('INVALID_LINE', 'Each order line needs an item id.');
    }
    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QTY) {
      throw new TableOrderError(
        'INVALID_QTY',
        'Quantity for ' + id + ' must be a whole number between 1 and ' + MAX_ITEM_QTY + '.'
      );
    }
    merged.set(id, (merged.get(id) || 0) + qty);
  }
  const out = [];
  for (const [id, qty] of merged) {
    if (qty > MAX_ITEM_QTY) {
      throw new TableOrderError(
        'INVALID_QTY',
        'Quantity for ' + id + ' must be between 1 and ' + MAX_ITEM_QTY + '.'
      );
    }
    out.push({ id, qty });
  }
  return out;
}

function reprice(lines, menuIndex) {
  const index = menuIndex instanceof Map ? menuIndex : flattenMenu(menuIndex).index;
  const requested = normalizeLines(lines);
  const priced = [];
  let subtotal = 0;
  let itemCount = 0;
  for (const line of requested) {
    const item = index.get(line.id);
    if (!item) {
      throw new TableOrderError(
        'UNKNOWN_ITEM',
        'That item is no longer on the menu: ' + line.id + '. Please refresh and try again.',
        { id: line.id }
      );
    }
    const unit = toPaise(item.price);
    const lineTotal = unit * line.qty;
    subtotal += lineTotal;
    itemCount += line.qty;
    priced.push({
      id: item.id,
      name: item.name,
      price: toRupees(unit),
      qty: line.qty,
      lineTotal: toRupees(lineTotal)
    });
  }
  const total = toRupees(subtotal);
  if (total > MAX_ORDER_TOTAL) {
    throw new TableOrderError(
      'ORDER_TOO_LARGE',
      'Orders above ' + formatINR(MAX_ORDER_TOTAL) + ' need to be placed with staff.'
    );
  }
  const breakup = gstBreakup(subtotal);
  return {
    lines: priced,
    itemCount,
    subtotal: toRupees(breakup.total),
    taxable: toRupees(breakup.taxable),
    cgst: toRupees(breakup.cgst),
    sgst: toRupees(breakup.sgst),
    gst: toRupees(breakup.gst),
    total: toRupees(breakup.total)
  };
}

function tableId(raw) {
  const cleaned = String(raw == null ? '' : raw)
    .trim()
    .toUpperCase()
    .replace(/^T-?/, '')
    .replace(/[^A-Z0-9]/g, '');
  if (!cleaned) {
    throw new TableOrderError('INVALID_TABLE', 'Missing table number.');
  }
  if (cleaned.length > 4) {
    throw new TableOrderError('INVALID_TABLE', 'Table number is too long.');
  }
  if (/^\d+$/.test(cleaned)) {
    if (cleaned === '0') {
      throw new TableOrderError('INVALID_TABLE', 'Table 0 does not exist.');
    }
    return cleaned.padStart(2, '0');
  }
  return cleaned;
}

function dateStamp(date) {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

function sequenceLabel(n) {
  let value = Math.max(1, Math.floor(n));
  let label = '';
  while (value > 0) {
    const rem = (value - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
}

function makeOrderId(table, existingIds, date) {
  const tablePart = tableId(table);
  const stamp = dateStamp(date);
  const prefix = 'T-' + stamp + '-' + tablePart + '-';
  const used = new Set(
    (Array.isArray(existingIds) ? existingIds : [])
      .filter((id) => typeof id === 'string' && id.startsWith(prefix))
      .map((id) => id.slice(prefix.length))
      .filter((suffix) => /^[A-Z]+$/.test(suffix))
      .map((suffix) => {
        let value = 0;
        for (const ch of suffix) value = value * 26 + (ch.charCodeAt(0) - 64);
        return value;
      })
  );
  let n = 1;
  while (used.has(n)) n += 1;
  const label = sequenceLabel(n);
  return { id: prefix + label, sequence: n, label };
}

function normalizePhone(raw) {
  let digits = String(raw == null ? '' : raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new TableOrderError('INVALID_PHONE', 'Enter a 10-digit Indian mobile number.');
  }
  return digits;
}

function otpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

function nextStatus(current, next) {
  if (!STATUSES.includes(next)) {
    throw new TableOrderError('INVALID_STATUS', 'Unknown status: ' + next);
  }
  const flow = TRANSITIONS[current];
  if (!flow) {
    throw new TableOrderError('INVALID_STATUS', 'Unknown current status: ' + current);
  }
  if (!flow.includes(next)) {
    throw new TableOrderError(
      'INVALID_TRANSITION',
      'Cannot move an order from ' + current + ' to ' + next + '.'
    );
  }
  return next;
}

function centerLine(text, width) {
  const s = String(text);
  if (s.length >= width) return s;
  const left = Math.floor((width - s.length) / 2);
  return ' '.repeat(left) + s;
}

function wrapText(text, width) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= width) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function padPair(left, right, width) {
  const l = String(left);
  const r = String(right);
  const gap = Math.max(1, width - l.length - r.length);
  return l + ' '.repeat(gap) + r;
}

function ticketText(order, opts) {
  const settings = opts || {};
  const width = Number(settings.width) || 32;
  const name = settings.name || 'PIZJO';
  const address = settings.address || 'Amraiwadi, Ahmedabad';
  const gstin = settings.gstin || '';
  const line = '-'.repeat(width);
  const out = [];
  const created = order && order.createdAt ? new Date(order.createdAt) : new Date();
  out.push(centerLine(name, width));
  if (address) out.push(centerLine(address, width));
  if (gstin) out.push(centerLine('GSTIN: ' + gstin, width));
  out.push(line);
  out.push('TABLE ' + (order && order.table ? order.table : '--'));
  out.push('Order ' + (order && order.id ? order.id : ''));
  out.push(created.toLocaleString('en-IN', { hour12: false }));
  out.push(line);
  for (const item of (order && order.lines) || []) {
    if (!item) continue;
    out.push(padPair(String(item.qty) + ' x ' + item.name, Number(item.lineTotal || 0).toFixed(2), width));
  }
  if (order && order.notes) {
    out.push(line);
    for (const l of wrapText('Note: ' + order.notes, width)) out.push(l);
  }
  out.push(line);
  out.push(padPair('Subtotal', Number((order && order.total) || 0).toFixed(2), width));
  out.push(padPair('CGST 2.5%', Number((order && order.cgst) || 0).toFixed(2), width));
  out.push(padPair('SGST 2.5%', Number((order && order.sgst) || 0).toFixed(2), width));
  out.push(padPair('TOTAL', Number((order && order.total) || 0).toFixed(2), width));
  out.push(line);
  out.push(centerLine('PAY AT COUNTER', width));
  if (order && order.phone) out.push(centerLine('Ph ' + order.phone, width));
  out.push('');
  return out.join('\n');
}

function validateOrderPayload(body, menuIndex, opts) {
  const settings = opts || {};
  const payload = body && typeof body === 'object' ? body : {};
  const table = tableId(payload.table);
  const phone = payload.phone == null && settings.requirePhone === false ? '' : normalizePhone(payload.phone);
  const priced = reprice(payload.lines, menuIndex);
  const notes = String(payload.notes == null ? '' : payload.notes).trim().slice(0, MAX_NOTES);
  return { table, phone, notes, ...priced };
}

module.exports = {
  GST_RATE,
  MAX_ITEM_QTY,
  MAX_LINE_ITEMS,
  MAX_ORDER_TOTAL,
  MAX_NOTES,
  MENU_PATH,
  STATUSES,
  TRANSITIONS,
  TableOrderError,
  toPaise,
  toRupees,
  formatINR,
  gstBreakup,
  flattenMenu,
  loadMenu,
  normalizeLines,
  reprice,
  tableId,
  dateStamp,
  sequenceLabel,
  makeOrderId,
  normalizePhone,
  otpCode,
  nextStatus,
  ticketText,
  validateOrderPayload
};
