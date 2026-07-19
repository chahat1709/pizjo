// Pizjo SPA module — exports initApp(page) called by every page.
// - Home page renders the menu + cart.
// - Other pages (about, contact, legal) just mount global nav and skip.

const WHATSAPP_NUMBER = '919265370588';
const CART_KEY = 'pizjo.cart.v1';

const Sec = window.PizjoSecurity;
if (!Sec) {
  console.error('[pizjo] security.js missing');
}

const $ = (id) => document.getElementById(id);

const State = {
  menu: [],
  current: '',
  cart: {},          // name -> {name, price, qty}
};

// ── Cart persistence ──────────────────────────────────────
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw) State.cart = JSON.parse(raw) || {};
  } catch { State.cart = {}; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(State.cart)); }
  catch (e) { console.warn('cart save failed', e); }
}

// ── Menu ───────────────────────────────────────────────────
async function loadMenu() {
  const grid = $('menu-grid');
  try {
    const res = await fetch(`data/menu.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('menu fetch failed');
    const data = await res.json();
    State.menu = data.categories || [];
    if (State.menu.length) {
      State.current = State.menu[0].name;
      renderFilters();
      renderGrid();
    }
  } catch (err) {
    console.error('menu load', err);
    if (grid) grid.textContent = 'Failed to load menu. Please try again later.';
  }
}

function renderFilters() {
  const root = $('categories-filter');
  if (!root) return;
  root.innerHTML = State.menu
    .map(
      (cat) =>
        `<button class="cat-btn ${cat.name === State.current ? 'active' : ''}" data-cat="${Sec.escapeHTML(cat.name)}">${Sec.escapeHTML(cat.name)}</button>`
    )
    .join('');
  root.querySelectorAll('.cat-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      State.current = e.currentTarget.dataset.cat;
      root.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      renderGrid();
    });
  });
}

function vegName(name) {
  const n = name.toLowerCase();
  return /\b(veg|paneer|margherita|corn|mushroom|capsicum|onion|tomato|olive|pizza|pasta|sandwich|burger)\b/.test(n);
}
function fmtPrice(p) {
  return '₹' + Number(p).toLocaleString('en-IN');
}

function renderGrid() {
  const grid = $('menu-grid');
  const cat = State.menu.find((c) => c.name === State.current);
  if (!grid || !cat) return;

  grid.style.opacity = '0';
  grid.style.transform = 'translateY(8px)';
  setTimeout(() => {
    grid.innerHTML = cat.items
      .map(
        (it) => `
          <article class="product-card">
            <div class="product-info">
              <div class="product-badges">
                ${it.veg === false ? '' : (it.veg || vegName(it.name) ? '<span class="badge badge-veg">Veg</span>' : '')}
                ${it.price > 200 ? '<span class="badge badge-bestseller">Bestseller</span>' : ''}
              </div>
              <h3 class="product-title">${Sec.escapeHTML(it.name)}</h3>
              <span class="product-price">${fmtPrice(it.price)}</span>
              <p class="product-desc">${Sec.escapeHTML(it.description || '')}</p>
            </div>
            <div class="product-image-container">
              ${it.image ? `<img src="${Sec.escapeHTML(it.image)}" alt="${Sec.escapeHTML(it.name)}" class="product-image" loading="lazy" referrerpolicy="no-referrer">` : ''}
              <button class="btn-add" data-name="${Sec.escapeHTML(it.name)}" data-price="${Number(it.price)}" type="button">ADD</button>
            </div>
          </article>`
      )
      .join('');

    grid.querySelectorAll('.btn-add').forEach((btn) => {
      btn.addEventListener('click', () => {
        addToCart(btn.dataset.name, parseInt(btn.dataset.price, 10));
      });
    });
    requestAnimationFrame(() => {
      grid.style.transition = 'all 0.3s var(--ease-out)';
      grid.style.opacity = '1';
      grid.style.transform = 'none';
    });
  }, 120);
}

// ── Cart ───────────────────────────────────────────────────
function addToCart(name, price) {
  if (!name) return;
  const guard = Sec.canAddToCart(Object.values(State.cart), name);
  if (!guard.ok) { alert(guard.reason || 'Cannot add more'); return; }
  State.cart[name] = State.cart[name] || { name, price, qty: 0 };
  State.cart[name].qty += 1;
  saveCart();
  paintCart();
  openCart();
}
function changeQty(name, delta) {
  if (!State.cart[name]) return;
  State.cart[name].qty += delta;
  if (State.cart[name].qty <= 0) delete State.cart[name];
  saveCart();
  paintCart();
}

function paintCart() {
  const items = Object.values(State.cart);
  let totalItems = 0, totalPrice = 0;

  const cards = items.map((it) => {
    totalItems += it.qty;
    totalPrice += it.price * it.qty;
    return `
      <div class="cart-item">
        <div>
          <div class="cart-item-title">${Sec.escapeHTML(it.name)}</div>
          <div class="cart-item-price">${fmtPrice(it.price)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-name="${Sec.escapeHTML(it.name)}" data-action="minus" type="button">−</button>
          <span class="qty-val">${it.qty}</span>
          <button class="qty-btn" data-name="${Sec.escapeHTML(it.name)}" data-action="plus" type="button">+</button>
        </div>
      </div>`;
  }).join('');

  const list = $('cart-items');
  if (list) {
    list.innerHTML = cards ||
      `<div class="cart-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <p>Your cart is empty.</p>
      </div>`;
    list.querySelectorAll('.qty-btn').forEach((b) => {
      b.addEventListener('click', () =>
        changeQty(b.dataset.name, b.dataset.action === 'plus' ? 1 : -1)
      );
    });
  }
  $('cart-count').textContent = totalItems;
  $('cart-total').textContent = fmtPrice(totalPrice);
}

function openCart() {
  $('cart-sidebar').classList.add('open');
  $('cart-sidebar').setAttribute('aria-hidden', 'false');
  $('cart-overlay').classList.add('open');
  $('cart-overlay').hidden = false;
}
function closeCart() {
  $('cart-sidebar').classList.remove('open');
  $('cart-sidebar').setAttribute('aria-hidden', 'true');
  $('cart-overlay').classList.remove('open');
  $('cart-overlay').hidden = true;
}

function bindCart() {
  $('cart-toggle')?.addEventListener('click', openCart);
  $('cart-close')?.addEventListener('click', closeCart);
  $('cart-overlay')?.addEventListener('click', closeCart);
  $('checkout-btn')?.addEventListener('click', checkout);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });
}

function checkout() {
  const items = Object.values(State.cart);
  if (!items.length) return;
  if (!Sec.rateLimit('checkout', 800)) return;

  let text = "Hello Pizjo! I'd like to place an order:%0a%0a";
  let total = 0;
  items.forEach((it) => {
    const line = `${it.qty}x ${it.name} — ₹${it.price * it.qty}`;
    text += `*${line}*%0a`;
    total += it.price * it.qty;
  });
  text += `%0a*Total: ₹${total}*%0a%0aPlease confirm.`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank', 'noopener,noreferrer');
}

// ── Reveal on scroll (any page) ────────────────────────────
function bindReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-right');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach((e) => e.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
    { threshold: 0.12 }
  );
  els.forEach((e) => io.observe(e));
}

// Exposed for other page scripts (about/contact) to call.
export async function initApp(page = 'home') {
  loadCart();
  if (Sec?.init) Sec.init();
  bindCart();
  paintCart();
  bindReveal();

  if (page === 'home') {
    await loadMenu();
  }
}

// Auto-boot if loaded directly on the home page (not via import).
if (typeof window !== 'undefined' && document.body) {
  // Make body available immediately for paint…
  document.addEventListener('DOMContentLoaded', () => {
    // Heuristic: home has #menu-grid; other pages shouldn't auto-init menu.
    if ($('menu-grid')) {
      initApp('home').catch((e) => console.error(e));
    } else {
      initApp('other').catch((e) => console.error(e));
    }
  });
}
