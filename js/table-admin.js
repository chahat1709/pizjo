const $ = (id) => document.getElementById(id);
const inr = (value) =>
  '\u20B9' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const KEY_STORE = 'pizjo.kds.staffKey';

const state = {
  tables: [],
  staffKey: localStorage.getItem(KEY_STORE) || '',
  tokenRequired: false,
  token: ''
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function showAlert(message) {
  const box = $('ta-alert');
  box.textContent = message || '';
  box.hidden = !message;
}

function guestUrl(table) {
  const params = new URLSearchParams({ t: table });
  if (state.tokenRequired && state.token) params.set('k', state.token);
  return location.origin + '/pages/table-order.html?' + params.toString();
}

async function api(path, options) {
  const opts = { ...(options || {}) };
  opts.headers = { ...(opts.headers || {}) };
  if (state.staffKey) opts.headers['x-staff-key'] = state.staffKey;
  if (opts.body) {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error((data.error && data.error.message) || 'Request failed (' + res.status + ').');
    error.status = res.status;
    throw error;
  }
  return data;
}

function renderTables() {
  const grid = $('table-grid');
  grid.replaceChildren();
  for (const table of state.tables) {
    const card = el('article', 'ta-card');
    card.dataset.active = table.active === false ? 'false' : 'true';

    const head = el('div', 'ta-card-head');
    head.append(el('span', 'ta-card-num', table.number));
    head.append(el('span', 'ta-card-seats', table.seats + ' seats'));

    const img = el('img', 'ta-qr');
    img.src = '/api/tables/qr/' + encodeURIComponent(table.number) + '.svg?size=420';
    img.alt = 'QR code for table ' + table.number;
    img.loading = 'lazy';
    img.width = 200;
    img.height = 200;

    const url = el('code', 'ta-url', guestUrl(table.number));

    const actions = el('div', 'ta-card-actions');
    const copy = el('button', 'ta-btn', 'Copy link');
    copy.type = 'button';
    copy.dataset.action = 'copy';
    copy.dataset.number = table.number;
    const toggle = el('button', 'ta-btn', table.active === false ? 'Enable' : 'Disable');
    toggle.type = 'button';
    toggle.dataset.action = 'toggle';
    toggle.dataset.number = table.number;
    actions.append(copy, toggle);

    card.append(head, img, url, actions);
    grid.append(card);
  }

  if (!state.tables.length) {
    grid.append(el('p', 'ta-hint', 'No tables yet. Add the first one above.'));
  }

  $('stat-tables').textContent = String(state.tables.filter((t) => t.active !== false).length);
}

async function loadTables() {
  try {
    const data = await api('/api/tables');
    state.tables = data.tables || [];
    state.tokenRequired = Boolean(data.tokenRequired);
    state.token = data.token || '';
    renderTables();
  } catch (err) {
    if (err.status === 401) {
      openKeyDialog('Enter the staff key to manage tables.');
      return;
    }
    showAlert(err.message);
  }
}

function paintOrders(orders) {
  const list = $('order-list');
  list.replaceChildren();
  $('orders-hint').hidden = orders.length > 0;
  if (!orders.length) {
    $('orders-hint').textContent = 'No orders yet today.';
    return;
  }
  for (const order of orders) {
    const li = el('li', 'ta-order');
    li.append(el('span', 'ta-order-id', order.id));
    li.append(el('span', null, 'Table ' + order.table + ' \u00B7 ' + order.itemCount + ' items'));
    li.append(el('span', null, inr(order.total)));
    const status = el('span', 'ta-order-status', order.status);
    status.dataset.status = order.status;
    li.append(status);
    list.append(li);
  }
}

async function loadOrders() {
  try {
    const data = await api('/api/orders?limit=10');
    $('stat-orders').textContent = String((data.stats && data.stats.todayOrders) || 0);
    $('stat-revenue').textContent = inr((data.stats && data.stats.todayRevenue) || 0);
    paintOrders(data.orders || []);
  } catch (err) {
    if (err.status === 401) {
      $('orders-hint').hidden = false;
      $('orders-hint').textContent = 'Staff key rejected. Update it in the header.';
      return;
    }
    $('orders-hint').hidden = false;
    $('orders-hint').textContent = err.message;
    showAlert(err.message);
  }
}

function openKeyDialog(message) {
  const dialog = $('key-dialog');
  $('key-error').textContent = message || '';
  $('staff-key').value = '';
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  setTimeout(() => $('staff-key').focus(), 50);
}

async function saveTable(form) {
  const number = $('new-table').value.trim();
  const seats = Number($('new-seats').value) || 4;
  if (!number) return;
  try {
    await api('/api/tables', { method: 'POST', body: { number, seats } });
    $('new-table').value = '';
    showAlert('');
    await loadTables();
  } catch (err) {
    if (err.status === 401) {
      openKeyDialog('Enter the staff key to add a table.');
      return;
    }
    showAlert(err.message);
  }
}

async function toggleTable(number) {
  const table = state.tables.find((t) => t.number === number);
  if (!table) return;
  try {
    await api('/api/tables', {
      method: 'POST',
      body: { number: table.number, seats: table.seats, active: table.active === false }
    });
    await loadTables();
  } catch (err) {
    if (err.status === 401) {
      openKeyDialog('Enter the staff key to change a table.');
      return;
    }
    showAlert(err.message);
  }
}

async function copyLink(number) {
  const url = guestUrl(number);
  try {
    await navigator.clipboard.writeText(url);
    showAlert('Copied ' + url);
    setTimeout(() => showAlert(''), 2500);
  } catch (err) {
    window.prompt('Copy this link', url);
  }
}

function bind() {
  $('add-table').addEventListener('submit', (event) => {
    event.preventDefault();
    saveTable();
  });

  $('table-grid').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'copy') copyLink(btn.dataset.number);
    if (btn.dataset.action === 'toggle') toggleTable(btn.dataset.number);
  });

  $('print-sheet').addEventListener('click', () => window.print());
  $('refresh').addEventListener('click', () => {
    loadTables();
    loadOrders();
  });

  $('staff-key-btn').addEventListener('click', () => openKeyDialog(''));

  $('save-key').addEventListener('click', () => {
    const key = $('staff-key').value.trim();
    if (!key) {
      $('key-error').textContent = 'Enter the key from the server console.';
      return;
    }
    state.staffKey = key;
    localStorage.setItem(KEY_STORE, key);
    if (typeof $('key-dialog').close === 'function') $('key-dialog').close();
    else $('key-dialog').removeAttribute('open');
    showAlert('');
    loadOrders();
  });

  $('close-key').addEventListener('click', () => {
    if (typeof $('key-dialog').close === 'function') $('key-dialog').close();
    else $('key-dialog').removeAttribute('open');
  });
}

bind();
loadTables().then(loadOrders);
