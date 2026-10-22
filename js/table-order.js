const $ = (id) => document.getElementById(id);
const inr = (value) =>
  '\u20B9' + Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STORE_KEYS = {
  order: 'pizjo.table.lastOrder',
  token: (table) => 'pizjo.table.token.' + table,
  statusKey: (table) => 'pizjo.table.statusKey.' + table,
  phone: (table) => 'pizjo.table.phone.' + table
};

const state = {
  table: '',
  menu: null,
  requireOtp: true,
  qty: new Map(),
  notes: '',
  token: '',
  statusKey: '',
  secret: '',
  phone: '',
  sending: false,
  pollTimer: 0,
  order: null
};

function tableFromUrl() {
  const raw = new URLSearchParams(location.search).get('t') || '';
  const cleaned = raw.trim().toUpperCase().replace(/^T-?/, '').replace(/[^A-Z0-9]/g, '');
  if (/^\d+$/.test(cleaned) && cleaned !== '0') return cleaned.padStart(2, '0');
  return /^[A-Z0-9]{1,4}$/.test(cleaned) ? cleaned : '';
}

function showAlert(message) {
  const box = $('to-alert');
  box.textContent = message;
  box.hidden = !message;
}

async function api(path, options) {
  const opts = { ...(options || {}) };
  opts.headers = { ...(opts.headers || {}) };
  if (opts.body && typeof opts.body !== 'string') {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  let res;
  try {
    res = await fetch(path, opts);
  } catch (err) {
    throw new Error('Cannot reach the kitchen tablet. Check the Wi-Fi and try again.');
  }
  let data = {};
  try {
    data = await res.json();
  } catch (err) {
    /* non-JSON error body */
  }
  if (!res.ok) {
    const message =
      (data && data.error && data.error.message) || 'Something went wrong (' + res.status + ').';
    const error = new Error(message);
    error.code = data && data.error && data.error.code;
    throw error;
  }
  return data;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function escapeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
}

function qtyFor(id) {
  return state.qty.get(id) || 0;
}

function setQty(id, next) {
  const value = Math.max(0, Math.min(20, next));
  if (value === 0) state.qty.delete(id);
  else state.qty.set(id, value);
  renderControls(id);
  renderTray();
}

function controlsFor(item) {
  const id = item.id;
  const qty = qtyFor(id);
  const wrap = el('div', 'to-stepper');

  if (qty === 0) {
    const add = el('button', 'to-add', 'Add');
    add.type = 'button';
    add.dataset.action = 'inc';
    add.dataset.id = id;
    add.setAttribute('aria-label', 'Add ' + item.name);
    return add;
  }

  const minus = el('button', null, '\u2212');
  minus.type = 'button';
  minus.dataset.action = 'dec';
  minus.dataset.id = id;
  minus.setAttribute('aria-label', 'Remove one ' + item.name);

  const count = el('span', 'to-qty', String(qty));
  count.setAttribute('aria-live', 'polite');

  const plus = el('button', null, '+');
  plus.type = 'button';
  plus.dataset.action = 'inc';
  plus.dataset.id = id;
  plus.setAttribute('aria-label', 'Add one more ' + item.name);

  wrap.append(minus, count, plus);
  return wrap;
}

function renderControls(id) {
  const slot = document.querySelector('[data-controls="' + escapeId(id) + '"]');
  if (!slot) return;
  const item = slot.itemData;
  if (!item) return;
  slot.replaceChildren(controlsFor(item));
}

function renderChips(categories) {
  const nav = $('category-chips');
  nav.replaceChildren();
  categories.forEach((category, index) => {
    if (!category.items || !category.items.length) return;
    const chip = el('button', 'to-chip', category.name);
    chip.type = 'button';
    chip.dataset.target = 'cat-' + escapeId(category.id || category.name);
    chip.setAttribute('aria-current', index === 0 ? 'true' : 'false');
    nav.append(chip);
  });
}

function renderMenu(categories) {
  const root = $('menu-sections');
  root.replaceChildren();
  for (const category of categories) {
    const items = Array.isArray(category.items) ? category.items : [];
    const section = el('section', 'to-cat');
    section.id = 'cat-' + escapeId(category.id || category.name);
    const h2 = el('h2', null, category.name);
    section.append(h2);
    if (!items.length) {
      section.append(el('p', 'to-empty-cat', 'Nothing here right now.'));
      root.append(section);
      continue;
    }
    for (const item of items) {
      const row = el('article', 'to-item');
      row.dataset.id = item.id;

      const img = el('img', 'to-item-img');
      img.src = item.image || '';
      img.alt = '';
      img.loading = 'lazy';
      img.width = 68;
      img.height = 68;
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => {
        img.hidden = true;
      });

      const info = el('div');
      info.append(el('h3', 'to-item-name', item.name));
      if (item.description) info.append(el('p', 'to-item-desc', item.description));

      const meta = el('div', 'to-item-meta');
      if (item.veg) meta.append(el('span', 'to-veg', 'Veg'));
      meta.append(el('span', null, inr(item.price)));
      info.append(meta);

      const slot = el('div');
      slot.dataset.controls = escapeId(item.id);
      slot.itemData = { id: item.id, name: item.name };
      slot.append(controlsFor(item));

      row.append(img, info, slot);
      section.append(row);
    }
    root.append(section);
  }
}

function trayLines() {
  const lines = [];
  for (const [id, qty] of state.qty) {
    const item = state.menu.itemsById.get(id);
    if (!item) continue;
    lines.push({ id, name: item.name, price: item.price, qty, lineTotal: item.price * qty });
  }
  return lines;
}

function trayTotals() {
  const lines = trayLines();
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  return { lines, total: Math.round(total * 100) / 100, count };
}

function renderTray() {
  const { lines, total, count } = trayTotals();
  const tray = $('tray');
  tray.hidden = count === 0;
  $('tray-count').textContent = count === 1 ? '1 item' : count + ' items';
  $('tray-total').textContent = inr(total);
  $('sheet-total').textContent = inr(total);

  const list = $('tray-lines');
  list.replaceChildren();
  for (const line of lines) {
    const li = el('li', 'to-line');
    const name = el('span', 'to-line-name', line.qty + ' \u00D7 ' + line.name);
    const price = el('span', 'to-line-price', inr(line.lineTotal));

    const stepper = el('div', 'to-stepper');
    const minus = el('button', null, '\u2212');
    minus.type = 'button';
    minus.dataset.action = 'dec';
    minus.dataset.id = line.id;
    minus.setAttribute('aria-label', 'Remove one ' + line.name);
    const countEl = el('span', 'to-qty', String(line.qty));
    const plus = el('button', null, '+');
    plus.type = 'button';
    plus.dataset.action = 'inc';
    plus.dataset.id = line.id;
    plus.setAttribute('aria-label', 'Add one more ' + line.name);
    stepper.append(minus, countEl, plus);

    li.append(name, stepper, price);
    list.append(li);
  }

  const sendBtn = $('send-order');
  sendBtn.disabled = count === 0 || state.sending;
  sendBtn.textContent = state.sending ? 'Sending...' : 'Send to Kitchen';
}

function updateChips(target) {
  document.querySelectorAll('.to-chip').forEach((chip) => {
    chip.setAttribute('aria-current', chip.dataset.target === target ? 'true' : 'false');
  });
}

function bindMenuEvents() {
  const root = $('menu-sections');
  root.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    const current = qtyFor(id);
    setQty(id, btn.dataset.action === 'inc' ? current + 1 : current - 1);
  });

  $('category-chips').addEventListener('click', (event) => {
    const chip = event.target.closest('.to-chip');
    if (!chip) return;
    const target = document.getElementById(chip.dataset.target);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateChips(chip.dataset.target);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible && visible.target && visible.target.id) updateChips(visible.target.id);
    },
    { rootMargin: '-140px 0px -60% 0px', threshold: 0 }
  );
  root.querySelectorAll('.to-cat').forEach((section) => observer.observe(section));
}

function openTray(open) {
  const sheet = $('tray-sheet');
  const trigger = $('open-tray');
  if (open) {
    if (typeof sheet.showModal === 'function') sheet.showModal();
    else sheet.setAttribute('open', '');
    trigger.setAttribute('aria-expanded', 'true');
  } else {
    if (typeof sheet.close === 'function') sheet.close();
    else sheet.removeAttribute('open');
    trigger.setAttribute('aria-expanded', 'false');
  }
}

function openOtp(open) {
  const sheet = $('otp-sheet');
  if (open) {
    $('otp-error').textContent = '';
    $('otp-phone').value = state.phone || '';
    if (typeof sheet.showModal === 'function') sheet.showModal();
    else sheet.setAttribute('open', '');
    setTimeout(() => $('otp-phone').focus(), 50);
  } else {
    if (typeof sheet.close === 'function') sheet.close();
    else sheet.removeAttribute('open');
  }
}

async function requestOtp() {
  const phoneInput = $('otp-phone');
  const errorBox = $('otp-error');
  errorBox.textContent = '';
  const digits = phoneInput.value.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(digits)) {
    errorBox.textContent = 'Enter a 10-digit Indian mobile number.';
    phoneInput.focus();
    return;
  }
  const btn = $('request-otp');
  btn.disabled = true;
  btn.textContent = 'Sending...';
  try {
    const data = await api('/api/otp/request', { method: 'POST', body: { table: state.table, phone: digits } });
    state.phone = digits;
    $('otp-step-code').hidden = false;
    const dev = $('dev-code');
    if (data.devCode) {
      dev.textContent = 'Dev mode code: ' + data.devCode;
      dev.hidden = false;
    } else {
      dev.hidden = true;
    }
    $('otp-code').focus();
  } catch (err) {
    errorBox.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send code';
  }
}

async function verifyOtpAndSend() {
  const errorBox = $('otp-error');
  const code = $('otp-code').value.replace(/\D/g, '').slice(0, 6);
  if (code.length !== 6) {
    errorBox.textContent = 'Enter the 6-digit code.';
    return;
  }
  const btn = $('verify-otp');
  btn.disabled = true;
  btn.textContent = 'Verifying...';
  try {
    const verified = await api('/api/otp/verify', {
      method: 'POST',
      body: { table: state.table, phone: state.phone, code }
    });
    state.token = verified.token || '';
    if (state.token) sessionStorage.setItem(STORE_KEYS.token(state.table), state.token);
    sessionStorage.setItem(STORE_KEYS.phone(state.table), state.phone);
    openOtp(false);
    await submitOrder();
  } catch (err) {
    errorBox.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Verify & send order';
  }
}

async function submitOrder() {
  if (state.sending) return;
  const { lines, count } = trayTotals();
  if (!count) return;
  state.sending = true;
  renderTray();
  try {
    const data = await api('/api/orders', {
      method: 'POST',
      body: {
        table: state.table,
        phone: state.phone,
        token: state.token,
        k: state.secret,
        notes: $('order-notes').value.trim(),
        lines: lines.map((line) => ({ id: line.id, qty: line.qty }))
      }
    });
    state.qty.clear();
    $('order-notes').value = '';
    state.sending = false;
    renderTray();
    openTray(false);
    showStatus(data.order);
    state.statusKey = data.order.statusKey || '';
    if (state.statusKey) sessionStorage.setItem(STORE_KEYS.statusKey(state.table), state.statusKey);
    sessionStorage.setItem(STORE_KEYS.order, data.order.id);
  } catch (err) {
    state.sending = false;
    renderTray();
    if (err.code === 'OTP_REQUIRED') {
      sessionStorage.removeItem(STORE_KEYS.token(state.table));
      state.token = '';
      openOtp(true);
      $('otp-error').textContent = 'Please verify your number again.';
      return;
    }
    showAlert(err.message);
    openOtp(false);
    openTray(true);
  }
}

function stageOrder(status) {
  return ['received', 'preparing', 'ready', 'served'].indexOf(status);
}

function showStatus(order) {
  state.order = order;
  $('status-panel').hidden = false;
  document.body.classList.add('to-locked');
  $('status-order-id').textContent = order.id + ' \u00B7 Table ' + order.table;
  $('status-total').textContent = inr(order.total) + ' \u00B7 pay at counter';
  paintTimeline(order.status);
  schedulePoll();
}

function paintTimeline(status) {
  const order = state.order || { status };
  const active = status === 'cancelled' ? -1 : stageOrder(status);
  document.querySelectorAll('#status-timeline li').forEach((li) => {
    const stage = stageOrder(li.dataset.stage);
    li.classList.toggle('is-done', active >= 0 && stage < active);
    li.classList.toggle('is-current', active >= 0 && stage === active);
  });
  const titles = {
    received: 'Sent to the kitchen',
    preparing: 'In the kitchen',
    ready: 'Ready \u2014 on its way',
    served: 'Served. Enjoy!',
    cancelled: 'Order cancelled'
  };
  $('status-title').textContent = titles[order.status] || 'Order sent';
}

function schedulePoll() {
  clearTimeout(state.pollTimer);
  if (!state.order) return;
  if (state.order.status === 'served' || state.order.status === 'cancelled') return;
  state.pollTimer = setTimeout(pollStatus, 5000);
}

async function pollStatus() {
  if (!state.order) return;
  try {
    const query = state.statusKey ? '?key=' + encodeURIComponent(state.statusKey) : '';
    const data = await api('/api/orders/' + encodeURIComponent(state.order.id) + query);
    state.order = data.order;
    paintTimeline(data.order.status);
    if (data.order.status === 'served' || data.order.status === 'cancelled') {
      clearTimeout(state.pollTimer);
      return;
    }
  } catch (err) {
    /* transient; keep polling */
  }
  schedulePoll();
}

function restoreSession() {
  const token = sessionStorage.getItem(STORE_KEYS.token(state.table));
  if (token) state.token = token;
  const phone = sessionStorage.getItem(STORE_KEYS.phone(state.table));
  if (phone) state.phone = phone;
  const statusKey = sessionStorage.getItem(STORE_KEYS.statusKey(state.table));
  if (statusKey) state.statusKey = statusKey;
  const lastId = sessionStorage.getItem(STORE_KEYS.order);
  if (!lastId) return;
  const query = state.statusKey ? '?key=' + encodeURIComponent(state.statusKey) : '';
  api('/api/orders/' + encodeURIComponent(lastId) + query)
    .then((data) => showStatus(data.order))
    .catch(() => sessionStorage.removeItem(STORE_KEYS.order));
}

function trackHeaderHeight() {
  const head = document.querySelector('.to-head');
  if (!head) return;
  const apply = () => document.documentElement.style.setProperty('--to-head-h', head.offsetHeight + 'px');
  apply();
  if ('ResizeObserver' in window) new ResizeObserver(apply).observe(head);
  else window.addEventListener('resize', apply);
}

function bindSheetEvents() {
  $('open-tray').addEventListener('click', () => openTray(true));
  $('close-tray').addEventListener('click', () => openTray(false));
  $('tray-sheet').addEventListener('click', (event) => {
    if (event.target === $('tray-sheet')) openTray(false);
  });
  $('tray-lines').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const current = qtyFor(btn.dataset.id);
    setQty(btn.dataset.id, btn.dataset.action === 'inc' ? current + 1 : current - 1);
  });
  $('send-order').addEventListener('click', () => {
    const { count } = trayTotals();
    if (!count) return;
    if (state.requireOtp && !state.token) openOtp(true);
    else submitOrder();
  });
  $('close-otp').addEventListener('click', () => openOtp(false));
  $('otp-sheet').addEventListener('click', (event) => {
    if (event.target === $('otp-sheet')) openOtp(false);
  });
  $('request-otp').addEventListener('click', requestOtp);
  $('resend-otp').addEventListener('click', requestOtp);
  $('verify-otp').addEventListener('click', verifyOtpAndSend);
  $('otp-code').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      verifyOtpAndSend();
    }
  });
  $('order-more').addEventListener('click', () => {
    $('status-panel').hidden = true;
    document.body.classList.remove('to-locked');
    sessionStorage.removeItem(STORE_KEYS.order);
    state.order = null;
    clearTimeout(state.pollTimer);
    $('menu').focus();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(state.pollTimer);
    else if (state.order) {
      pollStatus();
    }
  });
}

async function boot() {
  state.table = tableFromUrl();
  if (!state.table) {
    $('table-number').textContent = '--';
    $('shop-line').textContent = 'Scan the QR code on your table to order.';
    showAlert('No table selected. Scan the QR code on the table to start a fresh order.');
    $('menu-loading').hidden = true;
    return;
  }
  $('table-number').textContent = state.table;
  state.secret = new URLSearchParams(location.search).get('k') || '';
  document.title = 'Table ' + state.table + ' - Order at Pizjo';

  try {
    const [data, config] = await Promise.all([
      api('/api/menu'),
      api('/api/config').catch(() => ({ requireOtp: true }))
    ]);
    state.menu = { categories: data.categories || [], itemsById: new Map() };
    state.requireOtp = config.requireOtp !== false;
    for (const category of state.menu.categories) {
      for (const item of category.items || []) state.menu.itemsById.set(item.id, item);
    }
    $('shop-line').textContent = (data.shop && data.shop.name ? data.shop.name : 'Pizjo') + ' \u00B7 order and pay at the counter';
    $('menu-loading').hidden = true;
    renderChips(state.menu.categories);
    renderMenu(state.menu.categories);
    bindMenuEvents();
    renderTray();
  } catch (err) {
    $('menu-loading').hidden = true;
    showAlert(err.message);
  }

  bindSheetEvents();
  trackHeaderHeight();
  restoreSession();
}

boot();
