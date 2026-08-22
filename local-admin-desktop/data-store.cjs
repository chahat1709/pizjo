const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DAY = 24 * 60 * 60 * 1000;
const ORDER_STATUSES = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
const OFFER_STATUSES = ['draft', 'active', 'paused', 'scheduled', 'expired'];

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function now() { return Date.now(); }
function id(prefix) { return `${prefix}-${crypto.randomUUID()}`; }
function json(value) { return JSON.stringify(value ?? []); }
function parse(value, fallback = []) { try { return JSON.parse(value || ''); } catch { return fallback; } }

function makePasswordHash(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('base64')}:${hash.toString('base64')}`;
}

function verifyPassword(password, record) {
  if (!record || typeof password !== 'string') return false;
  const [saltText, hashText] = String(record).split(':');
  if (!saltText || !hashText) return false;
  const actual = crypto.scryptSync(password, Buffer.from(saltText, 'base64'), 64);
  const expected = Buffer.from(hashText, 'base64');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

class DataStore {
  constructor({ databasePath, menuPath }) {
    this.databasePath = databasePath;
    this.menuPath = menuPath;
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    this.db = new DatabaseSync(databasePath);
    this.sessions = new Map();
    this.initialize();
  }

  initialize() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin','staff')), password_hash TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
        price INTEGER NOT NULL CHECK(price >= 0), available INTEGER NOT NULL DEFAULT 1,
        stock INTEGER NOT NULL DEFAULT 0, threshold INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY, created_at INTEGER NOT NULL, status TEXT NOT NULL,
        source TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', items_json TEXT NOT NULL, total INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE, order_id TEXT NOT NULL,
        created_at INTEGER NOT NULL, items_json TEXT NOT NULL, total INTEGER NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id)
      );
      CREATE TABLE IF NOT EXISTS offers (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', type TEXT NOT NULL,
        value INTEGER NOT NULL DEFAULT 0, code TEXT NOT NULL DEFAULT '', status TEXT NOT NULL,
        starts_at INTEGER, ends_at INTEGER, updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS social_accounts (
        id TEXT PRIMARY KEY, platform TEXT NOT NULL, handle TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '', updated_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS social_posts (
        id TEXT PRIMARY KEY, platform TEXT NOT NULL, caption TEXT NOT NULL, status TEXT NOT NULL, created_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS activity_events (
        id TEXT PRIMARY KEY, at INTEGER NOT NULL, actor_id TEXT NOT NULL, actor_name TEXT NOT NULL, action TEXT NOT NULL
      );
    `);
    const count = this.db.prepare('SELECT COUNT(*) AS count FROM menu_items').get().count;
    if (count === 0) this.seedMenu();
    const socials = this.db.prepare('SELECT COUNT(*) AS count FROM social_accounts').get().count;
    if (socials === 0) {
      const insert = this.db.prepare('INSERT INTO social_accounts (id, platform, handle, url, updated_at) VALUES (?, ?, ?, ?, ?)');
      ['Instagram', 'Facebook', 'WhatsApp'].forEach(platform => insert.run(id('social'), platform, '', '', now()));
    }
  }

  seedMenu() {
    const menu = JSON.parse(fs.readFileSync(this.menuPath, 'utf8'));
    const insert = this.db.prepare('INSERT INTO menu_items (id, name, category, description, price, available, stock, threshold, updated_at) VALUES (?, ?, ?, ?, ?, 1, 0, 10, ?)');
    for (const category of menu.categories || []) {
      for (const item of category.items || []) {
        insert.run(String(item.id), String(item.name), String(category.name || 'Menu'), String(item.description || ''), Math.max(0, Math.round(asNumber(item.price))), now());
      }
    }
  }

  setting(key) { return this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value; }
  setSetting(key, value) { this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value)); }
  bootstrap() { return { needsSetup: this.setting('ownerConfigured') !== 'true', product: 'Pizjo Admin', mode: 'offline desktop' }; }

  setupOwner({ username, displayName, password }) {
    if (this.setting('ownerConfigured') === 'true') throw new Error('Owner account has already been configured.');
    const safeUsername = String(username || '').trim().toLowerCase();
    const safeName = String(displayName || '').trim();
    if (!/^[a-z0-9._-]{3,32}$/.test(safeUsername)) throw new Error('Use a 3–32 character username with letters, numbers, dot, underscore, or hyphen.');
    if (safeName.length < 2 || safeName.length > 80) throw new Error('Enter the owner’s display name.');
    if (String(password || '').length < 8) throw new Error('Use a password with at least 8 characters.');
    const owner = { id: id('user'), username: safeUsername, displayName: safeName, role: 'admin', passwordHash: makePasswordHash(password) };
    this.db.prepare('INSERT INTO users (id, username, display_name, role, password_hash, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').run(owner.id, owner.username, owner.displayName, owner.role, owner.passwordHash, now());
    this.setSetting('ownerConfigured', 'true');
    this.log(owner, 'Owner account configured on this computer');
    return this.createSession(owner);
  }

  createSession(user) {
    const token = crypto.randomBytes(32).toString('base64url');
    this.sessions.set(token, { id: user.id, username: user.username, displayName: user.displayName, role: user.role, expiresAt: now() + 8 * 60 * 60 * 1000 });
    return { token, user: { username: user.username, displayName: user.displayName, role: user.role } };
  }

  signIn({ username, password }) {
    const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(String(username || '').trim().toLowerCase());
    if (!user || !user.active || !verifyPassword(String(password || ''), user.password_hash)) throw new Error('Incorrect username or password.');
    const clean = { id: user.id, username: user.username, displayName: user.display_name, role: user.role };
    this.log(clean, 'Signed in locally');
    return this.createSession(clean);
  }

  signOut(session) {
    if (session?.token) this.sessions.delete(session.token);
    return true;
  }

  requireSession(session) {
    const active = this.sessions.get(session?.token);
    if (!active || active.expiresAt < now()) { if (session?.token) this.sessions.delete(session.token); throw new Error('Your local session has ended. Please sign in again.'); }
    return active;
  }

  requireAdmin(session) {
    const user = this.requireSession(session);
    if (user.role !== 'admin') throw new Error('Administrator access is required for this action.');
    return user;
  }

  log(user, action) {
    this.db.prepare('INSERT INTO activity_events (id, at, actor_id, actor_name, action) VALUES (?, ?, ?, ?, ?)').run(id('event'), now(), user.id, user.displayName, action);
  }

  getState(session) {
    const user = this.requireSession(session);
    const rows = (sql, params = []) => this.db.prepare(sql).all(...params);
    const menu = rows('SELECT * FROM menu_items ORDER BY category, name').map(item => ({ ...item, available: Boolean(item.available) }));
    const orders = rows('SELECT * FROM orders ORDER BY created_at DESC LIMIT 500').map(order => ({ ...order, items: parse(order.items_json) }));
    const delivered = orders.filter(order => order.status === 'delivered');
    const revenue = delivered.reduce((sum, order) => sum + order.total, 0);
    return {
      user: { username: user.username, displayName: user.displayName, role: user.role },
      menu,
      orders,
      invoices: rows('SELECT * FROM invoices ORDER BY created_at DESC LIMIT 200').map(invoice => ({ ...invoice, items: parse(invoice.items_json) })),
      offers: rows('SELECT * FROM offers ORDER BY updated_at DESC'),
      users: rows('SELECT id, username, display_name AS displayName, role, active, created_at FROM users ORDER BY display_name').map(member => ({ ...member, active: Boolean(member.active) })),
      socialAccounts: rows('SELECT * FROM social_accounts ORDER BY platform'),
      socialPosts: rows('SELECT * FROM social_posts ORDER BY created_at DESC LIMIT 100'),
      activity: rows('SELECT * FROM activity_events ORDER BY at DESC LIMIT 100'),
      kpis: {
        deliveredRevenue: revenue,
        deliveredOrders: delivered.length,
        averageOrder: delivered.length ? Math.round(revenue / delivered.length) : 0,
        lowStock: menu.filter(item => item.stock <= item.threshold).length,
      },
    };
  }

  perform(session, action) {
    const user = this.requireSession(session);
    const type = String(action?.type || '');
    const payload = action?.payload || {};
    if (type === 'create-order') return this.createOrder(user, payload);
    if (type === 'order-status') return this.updateOrderStatus(user, payload);
    if (type === 'create-invoice') return this.createInvoice(user, payload);
    if (type === 'stock-adjust') return this.adjustStock(user, payload);
    if (type === 'save-menu' || type === 'availability') return this.saveMenu(session, payload, type);
    if (type === 'save-offer' || type === 'toggle-offer') return this.saveOffer(session, payload, type);
    if (type === 'save-staff' || type === 'toggle-staff') return this.saveStaff(session, payload, type);
    if (type === 'save-social' || type === 'save-post') return this.saveSocial(user, session, payload, type);
    throw new Error('Unknown local operation.');
  }

  createOrder(user, payload) {
    const requested = Array.isArray(payload.items) ? payload.items : [];
    if (!requested.length) throw new Error('Add at least one menu item to the order.');
    const items = requested.map(line => {
      const menu = this.db.prepare('SELECT * FROM menu_items WHERE id = ?').get(String(line.id));
      const qty = Math.max(1, Math.min(999, Math.floor(asNumber(line.qty, 1))));
      if (!menu || !menu.available) throw new Error('One selected item is unavailable.');
      if (menu.stock < qty) throw new Error(`${menu.name} does not have enough stock.`);
      return { id: menu.id, name: menu.name, price: menu.price, qty };
    });
    const order = { id: id('order'), createdAt: now(), status: 'pending', source: String(payload.source || 'Walk-in'), note: String(payload.note || '').slice(0, 500), items, total: items.reduce((sum, item) => sum + item.price * item.qty, 0) };
    const insert = this.db.prepare('INSERT INTO orders (id, created_at, status, source, note, items_json, total) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const reduce = this.db.prepare('UPDATE menu_items SET stock = stock - ?, updated_at = ? WHERE id = ?');
    this.db.exec('BEGIN');
    try {
      insert.run(order.id, order.createdAt, order.status, order.source, order.note, json(order.items), order.total);
      items.forEach(item => reduce.run(item.qty, now(), item.id));
      this.log(user, `Created ${order.source} order ${order.id}`);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    return order;
  }

  updateOrderStatus(user, { id: orderId, status }) {
    if (!ORDER_STATUSES.includes(status)) throw new Error('Invalid order status.');
    const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) throw new Error('Order not found.');
    this.db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, orderId);
    this.log(user, `${orderId} moved to ${status}`);
    return true;
  }

  createInvoice(user, { orderId }) {
    const order = this.db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) throw new Error('Order not found.');
    const existing = this.db.prepare('SELECT id FROM invoices WHERE order_id = ?').get(orderId);
    if (existing) throw new Error('An invoice already exists for this order.');
    const count = this.db.prepare('SELECT COUNT(*) AS count FROM invoices').get().count + 1;
    const invoice = { id: id('invoice'), number: `PZ-${String(count).padStart(5, '0')}`, createdAt: now(), orderId, items: parse(order.items_json), total: order.total };
    this.db.prepare('INSERT INTO invoices (id, number, order_id, created_at, items_json, total) VALUES (?, ?, ?, ?, ?, ?)').run(invoice.id, invoice.number, invoice.orderId, invoice.createdAt, json(invoice.items), invoice.total);
    this.log(user, `Created invoice ${invoice.number} for ${orderId}`);
    return invoice;
  }

  adjustStock(user, { id: menuId, change, threshold }) {
    const item = this.db.prepare('SELECT * FROM menu_items WHERE id = ?').get(menuId);
    if (!item) throw new Error('Menu item not found.');
    const next = Math.max(0, item.stock + Math.trunc(asNumber(change)));
    const nextThreshold = threshold === undefined ? item.threshold : Math.max(0, Math.trunc(asNumber(threshold)));
    this.db.prepare('UPDATE menu_items SET stock = ?, threshold = ?, updated_at = ? WHERE id = ?').run(next, nextThreshold, now(), menuId);
    this.log(user, `${item.name} stock changed from ${item.stock} to ${next}`);
    return true;
  }

  saveMenu(session, payload, type) {
    const user = this.requireAdmin(session);
    if (type === 'availability') {
      const item = this.db.prepare('SELECT name FROM menu_items WHERE id = ?').get(payload.id);
      if (!item) throw new Error('Menu item not found.');
      this.db.prepare('UPDATE menu_items SET available = ?, updated_at = ? WHERE id = ?').run(payload.available ? 1 : 0, now(), payload.id);
      this.log(user, `${item.name} marked ${payload.available ? 'available' : 'out of stock'}`);
      return true;
    }
    const name = String(payload.name || '').trim();
    const category = String(payload.category || '').trim();
    if (!name || !category) throw new Error('Menu name and category are required.');
    const price = Math.max(0, Math.round(asNumber(payload.price)));
    if (payload.id) {
      this.db.prepare('UPDATE menu_items SET name = ?, category = ?, description = ?, price = ?, threshold = ?, updated_at = ? WHERE id = ?').run(name, category, String(payload.description || '').slice(0, 500), price, Math.max(0, Math.trunc(asNumber(payload.threshold, 10))), now(), payload.id);
      this.log(user, `Updated menu item ${name}`);
    } else {
      this.db.prepare('INSERT INTO menu_items (id, name, category, description, price, available, stock, threshold, updated_at) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)').run(id('menu'), name, category, String(payload.description || '').slice(0, 500), price, Math.max(0, Math.trunc(asNumber(payload.stock))), Math.max(0, Math.trunc(asNumber(payload.threshold, 10))), now());
      this.log(user, `Added menu item ${name}`);
    }
    return true;
  }

  saveOffer(session, payload, type) {
    const user = this.requireAdmin(session);
    if (type === 'toggle-offer') {
      const offer = this.db.prepare('SELECT title, status FROM offers WHERE id = ?').get(payload.id);
      if (!offer) throw new Error('Offer not found.');
      const status = offer.status === 'active' ? 'paused' : 'active';
      this.db.prepare('UPDATE offers SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), payload.id);
      this.log(user, `${offer.title} ${status}`);
      return true;
    }
    const title = String(payload.title || '').trim();
    if (!title) throw new Error('Offer title is required.');
    const status = OFFER_STATUSES.includes(payload.status) ? payload.status : 'draft';
    if (payload.id) {
      this.db.prepare('UPDATE offers SET title = ?, description = ?, type = ?, value = ?, code = ?, status = ?, starts_at = ?, ends_at = ?, updated_at = ? WHERE id = ?').run(title, String(payload.description || '').slice(0, 500), String(payload.offerType || 'percentage'), Math.max(0, Math.round(asNumber(payload.value))), String(payload.code || '').slice(0, 32), status, payload.startsAt || null, payload.endsAt || null, now(), payload.id);
      this.log(user, `Updated offer ${title}`);
    } else {
      this.db.prepare('INSERT INTO offers (id, title, description, type, value, code, status, starts_at, ends_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id('offer'), title, String(payload.description || '').slice(0, 500), String(payload.offerType || 'percentage'), Math.max(0, Math.round(asNumber(payload.value))), String(payload.code || '').slice(0, 32), status, payload.startsAt || null, payload.endsAt || null, now());
      this.log(user, `Created offer ${title}`);
    }
    return true;
  }

  saveStaff(session, payload, type) {
    const user = this.requireAdmin(session);
    if (type === 'toggle-staff') {
      if (payload.id === user.id) throw new Error('You cannot deactivate your own account.');
      const member = this.db.prepare('SELECT display_name, active FROM users WHERE id = ?').get(payload.id);
      if (!member) throw new Error('Staff account not found.');
      const active = member.active ? 0 : 1;
      this.db.prepare('UPDATE users SET active = ? WHERE id = ?').run(active, payload.id);
      this.log(user, `${member.display_name} ${active ? 'activated' : 'deactivated'}`);
      return true;
    }
    const username = String(payload.username || '').trim().toLowerCase();
    const displayName = String(payload.displayName || '').trim();
    const password = String(payload.password || '');
    if (!/^[a-z0-9._-]{3,32}$/.test(username) || displayName.length < 2 || password.length < 8) throw new Error('Enter a valid username, display name, and an 8-character minimum password.');
    const role = payload.role === 'admin' ? 'admin' : 'staff';
    try {
      this.db.prepare('INSERT INTO users (id, username, display_name, role, password_hash, active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)').run(id('user'), username, displayName, role, makePasswordHash(password), now());
    } catch (error) { if (String(error.message).includes('UNIQUE')) throw new Error('That username already exists.'); throw error; }
    this.log(user, `Created ${role} account for ${displayName}`);
    return true;
  }

  saveSocial(user, session, payload, type) {
    if (type === 'save-post') {
      const caption = String(payload.caption || '').trim();
      if (!caption) throw new Error('Post caption is required.');
      this.db.prepare('INSERT INTO social_posts (id, platform, caption, status, created_at) VALUES (?, ?, ?, ?, ?)').run(id('post'), String(payload.platform || 'Instagram'), caption.slice(0, 2000), String(payload.status || 'draft'), now());
      this.log(user, `Saved ${payload.platform || 'social'} post idea`);
      return true;
    }
    const admin = this.requireAdmin(session);
    const platform = String(payload.platform || '').trim();
    if (!platform) throw new Error('Platform is required.');
    if (payload.id) {
      this.db.prepare('UPDATE social_accounts SET platform = ?, handle = ?, url = ?, updated_at = ? WHERE id = ?').run(platform, String(payload.handle || '').slice(0, 120), String(payload.url || '').slice(0, 500), now(), payload.id);
    } else {
      this.db.prepare('INSERT INTO social_accounts (id, platform, handle, url, updated_at) VALUES (?, ?, ?, ?, ?)').run(id('social'), platform, String(payload.handle || '').slice(0, 120), String(payload.url || '').slice(0, 500), now());
    }
    this.log(admin, `Saved ${platform} social record`);
    return true;
  }

  backupTo(targetPath) {
    this.db.exec('PRAGMA wal_checkpoint(FULL)');
    fs.copyFileSync(this.databasePath, targetPath);
  }

  restoreFrom(sourcePath) {
    if (!fs.existsSync(sourcePath)) throw new Error('Selected backup file does not exist.');
    this.db.exec('PRAGMA wal_checkpoint(FULL)');
    this.close();
    fs.copyFileSync(this.databasePath, `${this.databasePath}.before-restore-${Date.now()}.db`);
    fs.copyFileSync(sourcePath, this.databasePath);
  }

  close() { if (this.db) { this.db.close(); this.db = null; } }
}

function createDataStore(options) { return new DataStore(options); }
module.exports = { createDataStore, makePasswordHash, verifyPassword };
