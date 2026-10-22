import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import {
  loadMenu,
  validateOrderPayload,
  normalizePhone,
  otpCode,
  tableId,
  ticketText,
  TableOrderError
} from '../lib/table-core.cjs';
import { createStore } from '../lib/table-store.cjs';

const require = createRequire(import.meta.url);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const qrcode = require(path.join(HERE, 'table-server', 'vendor', 'qrcode.js'));
const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(HERE, 'data');

const MAX_BODY = 64 * 1024;
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 30 * 1000;
const OTP_ATTEMPTS = 3;
const OTP_PER_HOUR = 5;
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

const store = createStore({ dir: DATA_DIR });
let config = store.config;
if (!config.staffKey) {
  config = store.updateConfig({ staffKey: crypto.randomBytes(12).toString('hex') });
}
if (!config.tableToken) {
  config = store.updateConfig({ tableToken: crypto.randomBytes(6).toString('hex') });
}

const menu = loadMenu();

const staticRoots = ['/js/', '/css/', '/assets/', '/data/', '/pages/', '/tools/table-server/vendor/', '/vendor/'];
const staticFiles = new Set(['/favicon.ico', '/index.html', '/404.html', '/robots.txt', '/sitemap.xml']);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const otpChallenges = new Map();
const otpTokens = new Map();
const otpHourly = new Map();
const ipHits = new Map();

function nowIso() {
  return new Date().toISOString();
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function limitIp(req, bucket, max, windowMs) {
  const key = bucket + ':' + clientIp(req);
  const now = Date.now();
  const entry = ipHits.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  ipHits.set(key, entry);
  if (entry.count > max) {
    throw new TableOrderError('RATE_LIMITED', 'Too many requests. Wait a moment and try again.');
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
}

function fail(res, err) {
  if (err instanceof TableOrderError) {
    const status =
      err.code === 'ORDER_NOT_FOUND' || err.code === 'UNKNOWN_ITEM'
        ? 404
        : err.code === 'RATE_LIMITED'
          ? 429
          : err.code === 'UNAUTHORIZED'
            ? 401
            : 400;
    sendJson(res, status, { ok: false, error: { code: err.code, message: err.message } });
    return;
  }
  console.error('[table-server]', err);
  sendJson(res, 500, { ok: false, error: { code: 'SERVER_ERROR', message: 'Something went wrong on the server.' } });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new TableOrderError('BODY_TOO_LARGE', 'Request body is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new TableOrderError('BAD_JSON', 'Request body must be valid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

const TRUSTED_SUBDOMAINS = new Set(['admin', 'kitchen', 'qrorder', 'order', 'tables']);

function hostPrefix(req) {
  return String(req.headers.host || '').split('.')[0].toLowerCase();
}

function isStaff(req) {
  if (!config.requireStaffKey) return true;
  if (!config.staffKey) return true;
  if (req.headers['x-staff-key'] === config.staffKey) return true;
  return TRUSTED_SUBDOMAINS.has(hostPrefix(req));
}

function requireStaff(req) {
  if (!isStaff(req)) throw new TableOrderError('UNAUTHORIZED', 'Staff key required.');
}

function publicBase(req) {
  if (config.publicBaseUrl) return String(config.publicBaseUrl).replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || HOST + ':' + PORT;
  return proto + '://' + host;
}

function tableUrl(req, number) {
  const params = new URLSearchParams({ t: number });
  if (config.tableTokenRequired && config.tableToken) params.set('k', config.tableToken);
  return publicBase(req) + '/t/' + number + '?' + params.toString();
}

function qrSvg(text, size) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const scale = Math.max(2, Math.floor((size || 240) / count));
  const quiet = 2;
  const dim = (count + quiet * 2) * scale;
  let d = '';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        d += 'M' + ((col + quiet) * scale) + ' ' + ((row + quiet) * scale) + 'h' + scale + 'v' + scale + 'h-' + scale + 'z';
      }
    }
  }
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    dim +
    '" height="' +
    dim +
    '" viewBox="0 0 ' +
    dim +
    ' ' +
    dim +
    '" shape-rendering="crispEdges" role="img" aria-label="QR code">' +
    '<rect width="100%" height="100%" fill="#fff"/><path d="' +
    d +
    '" fill="#111"/></svg>'
  );
}

function queuePrint(order) {
  const mode = config.print && config.print.mode;
  if (!mode || mode === 'none' || mode === 'browser') return;
  const dir = path.join(DATA_DIR, 'print-queue');
  fs.mkdirSync(dir, { recursive: true });
  const text = ticketText(order, {
    width: config.print.width,
    name: config.shopName,
    address: config.address,
    gstin: config.gstin
  });
  fs.writeFileSync(path.join(dir, order.id + '.txt'), text, 'utf8');
  if (mode === 'escpos' && config.print.host) {
    const socket = net.connect(Number(config.print.port) || 9100, config.print.host, () => {
      socket.write(Buffer.from([0x1b, 0x40]));
      socket.write(text + '\n\n\n');
      socket.end();
    });
    socket.setTimeout(4000, () => socket.destroy());
    socket.on('error', (err) => console.error('[table-server] printer error:', err.message));
  }
}

async function apiRoute(req, res, url) {
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      name: config.shopName,
      time: nowIso(),
      tables: store.listTables().length,
      otp: config.requireOtp ? 'required' : 'off',
      print: config.print.mode
    });
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/menu') {
    limitIp(req, 'menu', 120, 60 * 1000);
    sendJson(res, 200, {
      ok: true,
      shop: { name: config.shopName, address: config.address, gstin: config.gstin },
      gstRate: 0.05,
      categories: menu.categories
    });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/otp/request') {
    limitIp(req, 'otp', 10, 60 * 1000);
    const body = await readBody(req);
    const table = tableId(body.table);
    const phone = normalizePhone(body.phone);
    if (!config.requireOtp) {
      sendJson(res, 200, { ok: true, devCode: null, otpRequired: false });
      return true;
    }
    const hour = otpHourly.get(phone) || { count: 0, resetAt: Date.now() + 60 * 60 * 1000 };
    if (Date.now() > hour.resetAt) {
      hour.count = 0;
      hour.resetAt = Date.now() + 60 * 60 * 1000;
    }
    if (hour.count >= OTP_PER_HOUR) {
      throw new TableOrderError('RATE_LIMITED', 'Too many codes for this number. Try again later.');
    }
    const key = table + ':' + phone;
    const existing = otpChallenges.get(key);
    if (existing && Date.now() - existing.sentAt < OTP_RESEND_MS) {
      const wait = Math.ceil((OTP_RESEND_MS - (Date.now() - existing.sentAt)) / 1000);
      throw new TableOrderError('OTP_COOLDOWN', 'Wait ' + wait + 's before requesting another code.');
    }
    const code = otpCode();
    otpChallenges.set(key, { code, sentAt: Date.now(), expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    hour.count += 1;
    otpHourly.set(phone, hour);
    const provider = config.otpProvider || 'console';
    if (provider === 'console') {
      console.log('[otp] table ' + table + ' phone ' + phone + ' code ' + code);
    } else {
      console.warn('[otp] provider "' + provider + '" is not configured; code was not sent.');
    }
    sendJson(res, 200, {
      ok: true,
      otpRequired: true,
      provider,
      devCode: provider === 'console' ? code : null,
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000)
    });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/otp/verify') {
    limitIp(req, 'otp-verify', 20, 60 * 1000);
    const body = await readBody(req);
    const table = tableId(body.table);
    const phone = normalizePhone(body.phone);
    if (!config.requireOtp) {
      sendJson(res, 200, { ok: true, token: null, otpRequired: false });
      return true;
    }
    const key = table + ':' + phone;
    const challenge = otpChallenges.get(key);
    if (!challenge) {
      throw new TableOrderError('OTP_NOT_FOUND', 'Request a code first.');
    }
    if (Date.now() > challenge.expiresAt) {
      otpChallenges.delete(key);
      throw new TableOrderError('OTP_EXPIRED', 'That code expired. Request a new one.');
    }
    if (challenge.attempts >= OTP_ATTEMPTS) {
      otpChallenges.delete(key);
      throw new TableOrderError('OTP_LOCKED', 'Too many wrong codes. Request a new one.');
    }
    if (String(body.code || '').trim() !== challenge.code) {
      challenge.attempts += 1;
      throw new TableOrderError('OTP_INVALID', 'That code is not right.');
    }
    otpChallenges.delete(key);
    const token = crypto.randomBytes(18).toString('hex');
    otpTokens.set(token, { table, phone, expiresAt: Date.now() + TOKEN_TTL_MS });
    sendJson(res, 200, { ok: true, token, otpRequired: true });
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/orders') {
    limitIp(req, 'order', 8, 60 * 1000);
    const body = await readBody(req);
    const payload = validateOrderPayload(body, menu.index);
    if (config.requireOtp) {
      const token = otpTokens.get(String(body.token || ''));
      if (!token || token.expiresAt < Date.now() || token.table !== payload.table || token.phone !== payload.phone) {
        throw new TableOrderError('OTP_REQUIRED', 'Verify your mobile number before sending the order.');
      }
    }
    const table = store.listTables().find((t) => t.number === payload.table);
    if (table && table.active === false) {
      throw new TableOrderError('TABLE_INACTIVE', 'This table is not taking orders right now. Please call a server.');
    }
    if (config.tableTokenRequired && config.tableToken && String(body.k || '') !== config.tableToken) {
      throw new TableOrderError('INVALID_TABLE_TOKEN', 'This QR code is out of date. Please ask a server for help.');
    }
    const order = store.createOrder({
      ...payload,
      payAtCounter: config.payAtCounter,
      statusKey: crypto.randomBytes(6).toString('hex')
    });
    queuePrint(order);
    sendJson(res, 201, { ok: true, order });
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/orders') {
    requireStaff(req);
    const orders = store
      .listOrders({
        since: url.searchParams.get('since') || undefined,
        status: url.searchParams.get('status') || undefined,
        table: url.searchParams.get('table') || undefined,
        limit: url.searchParams.get('limit') || undefined
      })
      .map(({ statusKey, ...rest }) => rest);
    sendJson(res, 200, { ok: true, orders, stats: store.stats() });
    return true;
  }

  const orderMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (orderMatch && req.method === 'GET') {
    const order = store.getOrder(decodeURIComponent(orderMatch[1]));
    if (!order) throw new TableOrderError('ORDER_NOT_FOUND', 'Order not found.');
    if (!isStaff(req)) {
      const key = url.searchParams.get('key') || '';
      if (!order.statusKey || key !== order.statusKey) {
        throw new TableOrderError('UNAUTHORIZED', 'Order not found.');
      }
    }
    const { statusKey, ...safe } = order;
    sendJson(res, 200, { ok: true, order: safe });
    return true;
  }

  const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (statusMatch && req.method === 'POST') {
    requireStaff(req);
    const body = await readBody(req);
    const order = store.setStatus(decodeURIComponent(statusMatch[1]), String(body.status || ''));
    sendJson(res, 200, { ok: true, order });
    return true;
  }

  if (pathname === '/api/tables' && req.method === 'GET') {
    sendJson(res, 200, {
      ok: true,
      tables: store.listTables(),
      tokenRequired: Boolean(config.tableTokenRequired),
      token: config.tableTokenRequired && isStaff(req) ? config.tableToken : null
    });
    return true;
  }

  if (pathname === '/api/tables' && req.method === 'POST') {
    requireStaff(req);
    const body = await readBody(req);
    const table = store.upsertTable(body);
    sendJson(res, 200, { ok: true, table });
    return true;
  }

  const qrMatch = pathname.match(/^\/api\/tables\/qr\/([^/]+)\.svg$/);
  if (qrMatch && req.method === 'GET') {
    const number = tableId(decodeURIComponent(qrMatch[1]));
    const size = Number(url.searchParams.get('size')) || 240;
    res.writeHead(200, {
      'content-type': 'image/svg+xml',
      'cache-control': 'public, max-age=300'
    });
    res.end(qrSvg(tableUrl(req, number), size));
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/config') {
    sendJson(res, 200, {
      ok: true,
      shop: { name: config.shopName, address: config.address, gstin: config.gstin },
      requireOtp: Boolean(config.requireOtp),
      payAtCounter: Boolean(config.payAtCounter),
      print: { mode: config.print.mode, width: config.print.width }
    });
    return true;
  }

  return false;
}

function serveStatic(req, res, pathname) {
  let rel = pathname;
  if (rel === '/') {
    res.writeHead(302, { location: '/pages/table-admin.html' });
    res.end();
    return;
  }
  if (!staticRoots.some((prefix) => rel.startsWith(prefix)) && !staticFiles.has(rel)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const file = path.join(ROOT, path.normalize(rel));
  if (!file.startsWith(ROOT + path.sep)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, {
      'content-type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'content-length': stat.size,
      'cache-control': rel.startsWith('/data/') ? 'no-store' : 'no-cache'
    });
    fs.createReadStream(file).pipe(res);
  });
}

function ticketPage(order) {
  const text = ticketText(order, {
    width: 40,
    name: config.shopName,
    address: config.address,
    gstin: config.gstin
  });
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return (
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>' +
    order.id +
    '</title><style>body{font-family:ui-monospace,Consolas,monospace;font-size:12px;margin:0;padding:8px}' +
    'pre{margin:0;white-space:pre-wrap}@media print{@page{margin:4mm}}</style></head><body><pre>' +
    escaped +
    '</pre><script>window.addEventListener("load",function(){window.print()})</script></body></html>'
  );
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  try {
    const printMatch = url.pathname.match(/^\/print\/ticket\/([^/]+)$/);
    if (printMatch && req.method === 'GET') {
      const order = store.getOrder(decodeURIComponent(printMatch[1]));
      if (!order) throw new TableOrderError('ORDER_NOT_FOUND', 'Order not found.');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(ticketPage(order));
      return;
    }

    const tableMatch = url.pathname.match(/^\/t\/([^/]+)\/?$/);
    if (tableMatch && req.method === 'GET') {
      const number = tableId(decodeURIComponent(tableMatch[1]));
      const params = new URLSearchParams({ t: number });
      const secret = url.searchParams.get('k');
      if (secret) params.set('k', secret);
      res.writeHead(302, { location: '/pages/table-order.html?' + params.toString() });
      res.end();
      return;
    }

    const pathAlias = {
      '/kitchen': '/pages/table-kds.html',
      '/admin': '/pages/table-admin.html',
      '/order': '/pages/table-order.html'
    }[url.pathname];
    if (pathAlias) {
      res.writeHead(302, { location: pathAlias + url.search });
      res.end();
      return;
    }

    if (url.pathname === '/') {
      const prefix = hostPrefix(req);
      const target =
        prefix === 'kitchen'
          ? '/pages/table-kds.html'
          : prefix === 'qrorder' || prefix === 'order'
            ? '/pages/table-order.html'
            : '/pages/table-admin.html';
      res.writeHead(302, { location: target });
      res.end();
      return;
    }

    if (url.pathname.startsWith('/api/')) {
      const handled = await apiRoute(req, res, url);
      if (!handled) sendJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'Unknown endpoint.' } });
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Method not allowed');
      return;
    }
    serveStatic(req, res, url.pathname);
  } catch (err) {
    fail(res, err);
  }
});

server.listen(PORT, HOST, () => {
  const tables = store.listTables().length;
  console.log('');
  console.log('  ' + config.shopName + ' table server');
  console.log('  guest menu : http://localhost:' + PORT + '/t/07');
  console.log('  kitchen    : http://localhost:' + PORT + '/pages/table-kds.html');
  console.log('  tables/QR  : http://localhost:' + PORT + '/pages/table-admin.html');
  console.log('  staff key  : ' + config.staffKey + (config.requireStaffKey ? ' (required)' : ' (optional)'));
  console.log('  data dir   : ' + DATA_DIR);
  console.log('  tables     : ' + tables + '  | otp: ' + (config.requireOtp ? 'on' : 'off') + '  | print: ' + config.print.mode);
  console.log('');
});

function shutdown() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
