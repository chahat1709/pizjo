const $ = (id) => document.getElementById(id);
const inr = (value) => '\u20B9' + Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const KEY_STORE = 'pizjo.kds.staffKey';
const PREF_PRINT = 'pizjo.kds.autoPrint';
const PREF_SOUND = 'pizjo.kds.sound';

const ACTIVE = new Set(['received', 'preparing', 'ready']);
const NEXT = {
  received: { status: 'preparing', label: 'Start cooking' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'served', label: 'Served' }
};

const state = {
  orders: [],
  loaded: false,
  sig: '',
  pollTimer: 0,
  keyPrompted: false,
  staffKey: localStorage.getItem(KEY_STORE) || '',
  print: localStorage.getItem(PREF_PRINT) !== 'off',
  sound: localStorage.getItem(PREF_SOUND) !== 'off',
  pending: new Set(),
  fresh: new Set(),
  audio: null
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function showAlert(message) {
  const box = $('kds-alert');
  box.textContent = message || '';
  box.hidden = !message;
}

function ago(iso) {
  const ms = Date.now() - Date.parse(iso);
  if (!Number.isFinite(ms) || ms < 0) return '0m';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return '<1m';
  if (mins < 60) return mins + 'm';
  const hours = Math.floor(mins / 60);
  return hours + 'h ' + (mins % 60) + 'm';
}

function beep() {
  if (!state.sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    state.audio = state.audio || new Ctx();
    const ctx = state.audio;
    if (ctx.state === 'suspended') ctx.resume();
    [880, 1180].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + index * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.18 + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + index * 0.18);
      osc.stop(ctx.currentTime + index * 0.18 + 0.25);
    });
  } catch (err) {
    /* audio is a nicety, never a blocker */
  }
}

function printTicket(id) {
  if (!state.print) return;
  const frame = document.createElement('iframe');
  frame.hidden = true;
  frame.setAttribute('aria-hidden', 'true');
  frame.src = '/print/ticket/' + encodeURIComponent(id);
  document.body.append(frame);
  setTimeout(() => frame.remove(), 30000);
}

function card(order) {
  const active = ACTIVE.has(order.status);
  const node = el('article', 'kds-card');
  node.dataset.status = order.status;
  node.dataset.id = order.id;
  if (state.fresh.has(order.id)) node.classList.add('is-new');

  const head = el('div', 'kds-card-head');
  const table = el('p', 'kds-table', 'Table');
  table.append(el('strong', null, order.table));
  const age = el('span', 'kds-age', ago(order.createdAt));
  age.dataset.ageFor = order.id;
  if (Date.now() - Date.parse(order.createdAt) > 12 * 60000) age.dataset.hot = 'true';
  head.append(table, age);

  const list = el('ul', 'kds-lines');
  for (const line of order.lines || []) {
    const li = el('li', 'kds-line');
    li.append(el('span', 'kds-qty', String(line.qty)), el('span', null, line.name));
    list.append(li);
  }

  node.append(head, list);
  if (order.notes) node.append(el('p', 'kds-note', 'Note: ' + order.notes));

  if (active) {
    const foot = el('div', 'kds-foot');
    const next = NEXT[order.status];
    if (next) {
      const go = el('button', 'kds-btn kds-btn-primary', next.label);
      go.type = 'button';
      go.dataset.action = 'advance';
      go.dataset.id = order.id;
      go.dataset.next = next.status;
      go.disabled = state.pending.has(order.id);
      foot.append(go);
    }
    const cancel = el('button', 'kds-btn kds-btn-ghost', 'Cancel');
    cancel.type = 'button';
    cancel.dataset.action = 'cancel';
    cancel.dataset.id = order.id;
    cancel.disabled = state.pending.has(order.id);
    foot.append(cancel);
    node.append(foot);
  } else {
    const done = el('div', 'kds-foot');
    done.append(el('span', 'kds-stat', order.status === 'served' ? 'Served' : 'Cancelled'));
    node.append(done);
  }

  return node;
}

function render() {
  const board = $('board');
  const active = state.orders
    .filter((order) => ACTIVE.has(order.status))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const fragment = document.createDocumentFragment();
  for (const order of active) fragment.append(card(order));
  if (!active.length) {
    const empty = el('p', 'kds-empty', 'No open orders. New tickets appear here and print automatically.');
    fragment.append(empty);
  }
  board.replaceChildren(fragment);
}

function updateClock() {
  $('clock').textContent = new Date().toLocaleTimeString('en-IN', { hour12: false });
  document.querySelectorAll('[data-age-for]').forEach((node) => {
    const order = state.orders.find((o) => o.id === node.dataset.ageFor);
    if (!order) return;
    node.textContent = ago(order.createdAt);
    node.dataset.hot = Date.now() - Date.parse(order.createdAt) > 12 * 60000 ? 'true' : 'false';
  });
}

function applyStats(stats) {
  if (!stats) return;
  $('stat-orders').textContent = String(stats.todayOrders || 0);
  $('stat-orders-label').textContent = stats.todayOrders === 1 ? 'order' : 'orders';
  $('stat-revenue').textContent = inr(stats.todayRevenue || 0);
}

function setConn(status) {
  const node = $('conn');
  node.dataset.state = status;
  node.textContent = status === 'live' ? 'Live' : status === 'offline' ? 'Offline' : 'Connecting';
}

function upsert(order) {
  const index = state.orders.findIndex((o) => o.id === order.id);
  if (index >= 0) state.orders[index] = order;
  else state.orders.push(order);
}

function signature(orders) {
  return orders.map((o) => o.id + ':' + o.status + ':' + o.updatedAt).join('|');
}

async function poll() {
  clearTimeout(state.pollTimer);
  try {
    const res = await fetch('/api/orders?limit=100', {
      headers: state.staffKey ? { 'x-staff-key': state.staffKey } : {}
    });
    if (res.status === 401) {
      setConn('offline');
      if (!state.keyPrompted) {
        state.keyPrompted = true;
        openKeyDialog('Enter the staff key printed by the server.');
      }
      throw new Error('Staff key required.');
    }
    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    const previousActive = new Set(state.orders.filter((o) => ACTIVE.has(o.status)).map((o) => o.id));
    const next = data.orders || [];
    const incoming = next.filter((o) => ACTIVE.has(o.status) && !previousActive.has(o.id));
    const sig = signature(next);

    state.orders = next;
    applyStats(data.stats);

    if (state.loaded) {
      for (const order of incoming) {
        state.fresh.add(order.id);
        beep();
        printTicket(order.id);
        setTimeout(() => {
          state.fresh.delete(order.id);
          render();
        }, 3000);
      }
    }
    state.loaded = true;

    if (sig !== state.sig) {
      state.sig = sig;
      render();
    }
    setConn('live');
    showAlert('');
  } catch (err) {
    setConn('offline');
  } finally {
    if (!document.hidden) state.pollTimer = setTimeout(poll, 3000);
  }
}
async function changeStatus(id, status) {
  if (state.pending.has(id)) return;
  state.pending.add(id);
  render();
  try {
    const res = await fetch('/api/orders/' + encodeURIComponent(id) + '/status', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-staff-key': state.staffKey
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        openKeyDialog('That staff key was rejected. Enter the key printed by the server.');
        return;
      }
      throw new Error((data.error && data.error.message) || 'Could not update the order.');
    }
    upsert(data.order);
    showAlert('');
  } catch (err) {
    showAlert(err.message);
  } finally {
    state.pending.delete(id);
    render();
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

function bind() {
  $('board').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'advance') changeStatus(btn.dataset.id, btn.dataset.next);
    if (btn.dataset.action === 'cancel') changeStatus(btn.dataset.id, 'cancelled');
  });

  $('auto-print').checked = state.print;
  $('auto-print').addEventListener('change', (event) => {
    state.print = event.target.checked;
    localStorage.setItem(PREF_PRINT, state.print ? 'on' : 'off');
  });

  $('sound-on').checked = state.sound;
  $('sound-on').addEventListener('change', (event) => {
    state.sound = event.target.checked;
    localStorage.setItem(PREF_SOUND, state.sound ? 'on' : 'off');
    if (state.sound) beep();
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
    $('key-dialog').close();
    showAlert('');
  });
  $('close-key').addEventListener('click', () => {
    if (typeof $('key-dialog').close === 'function') $('key-dialog').close();
    else $('key-dialog').removeAttribute('open');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(state.pollTimer);
      return;
    }
    updateClock();
    poll();
  });

  setInterval(updateClock, 1000);
}

bind();
updateClock();
poll();
