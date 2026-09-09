// Pizjo order store — shared by checkout (app.js), track page, and KDS.
// Browser-local order log. Same-device truth; cross-device via WhatsApp handoff link.
// Status machine: pending -> preparing -> ready -> delivered, or -> cancelled.
(function (global) {
  'use strict';

  const ORDERS_KEY = 'pizjo.orders.v1';
  const TRANSITIONS = {
    pending: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['delivered', 'cancelled'],
    delivered: [],
    cancelled: [],
  };
  // Menu prices are treated as GST-inclusive (common for small restaurants).
  // Breakup shown on bills: CGST 2.5% + SGST 2.5% (SAC 9963, 5% slab, no ITC).
  const GST_RATE = 0.05;

  function load() {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  function save(orders) {
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }
    catch (e) { console.warn('[orders] save failed', e); }
  }

  function genId(existing) {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const day = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
    const ids = new Set((existing || []).map((o) => o.id));
    let id;
    do {
      id = `PZ-${day}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    } while (ids.has(id));
    return id;
  }

  function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    const national = digits.length === 12 && digits.startsWith('91') ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0') ? digits.slice(1)
      : digits;
    return /^[6-9]\d{9}$/.test(national) ? national : '';
  }

  function create({ items, subtotal, discount, total, promoCode, phone, source }) {
    const orders = load();
    const order = {
      id: genId(orders),
      createdAt: Date.now(),
      status: 'pending',
      timeline: [{ status: 'pending', at: Date.now() }],
      items: (items || []).map((i) => ({ id: String(i.id), name: String(i.name), qty: Number(i.qty), unitPrice: Number(i.unitPrice), lineTotal: Number(i.lineTotal) })),
      subtotal: Number(subtotal) || 0,
      discount: discount ? { code: String(discount.code), title: String(discount.title || ''), amount: Number(discount.amount) || 0 } : null,
      total: Number(total) || 0,
      promoCode: promoCode ? String(promoCode).toUpperCase() : '',
      phone: normalizePhone(phone),
      source: source || 'website',
    };
    orders.unshift(order);
    save(orders.slice(0, 200));
    return order;
  }

  function get(id) {
    return load().find((o) => o.id === String(id || '').toUpperCase()) || null;
  }

  function byPhone(phone) {
    const p = normalizePhone(phone);
    if (!p) return [];
    return load().filter((o) => o.phone === p);
  }

  function setStatus(id, next) {
    const orders = load();
    const order = orders.find((o) => o.id === String(id).toUpperCase());
    if (!order) return null;
    if (!(TRANSITIONS[order.status] || []).includes(next)) return null;
    order.status = next;
    order.timeline.push({ status: next, at: Date.now() });
    save(orders);
    return order;
  }

  function gstBreakup(total) {
    const base = total / (1 + GST_RATE);
    const gst = total - base;
    return { base, cgst: gst / 2, sgst: gst / 2, gst, rate: GST_RATE };
  }

  function importFromHash() {
    try {
      const m = String(location.hash || '').match(/#order=([A-Za-z0-9+/=_-]+)/);
      if (!m) return null;
      const order = JSON.parse(decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')))));
      if (!order || !order.id || !Array.isArray(order.items)) return null;
      const orders = load();
      if (!orders.some((o) => o.id === order.id)) {
        order.status = order.status && TRANSITIONS[order.status] ? order.status : 'pending';
        order.timeline = Array.isArray(order.timeline) && order.timeline.length ? order.timeline : [{ status: 'pending', at: order.createdAt || Date.now() }];
        orders.unshift(order);
        save(orders.slice(0, 200));
      }
      history.replaceState(null, '', location.pathname + location.search);
      return order.id;
    } catch { return null; }
  }

  function exportHash(order) {
    const raw = btoa(unescape(encodeURIComponent(JSON.stringify(order))));
    return `#order=${raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
  }

  global.PizjoOrders = Object.freeze({
    ORDERS_KEY, TRANSITIONS, GST_RATE,
    load, create, get, byPhone, setStatus,
    normalizePhone, gstBreakup, importFromHash, exportHash,
  });
})(window);
