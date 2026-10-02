// Pizjo SPA module — exports initApp(page) called by every page.
// - Home page renders the menu + cart.
// - Other pages (about, contact, legal) just mount global nav and skip.

const CONFIG = window.PizjoConfig || {};
const WHATSAPP_NUMBER = CONFIG.whatsappNumber || '919265370588';
const CART_KEY = 'pizjo.cart.v3';

const Sec = window.PizjoSecurity;
if (!Sec) {
  console.error('[pizjo] security.js missing');
}

const $ = (id) => document.getElementById(id);

const State = {
  menu: [],
  catalog: [],
  current: '',
  cart: {},          // id -> {id, name, price, qty}
};

// ── Cart persistence ──────────────────────────────────────
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY) || localStorage.getItem('pizjo.cart.v2');
    if (raw) State.cart = Sec?.normalizeCart ? Sec.normalizeCart(JSON.parse(raw), State.catalog) : {};
    saveCart();
  } catch { State.cart = {}; }
}
function saveCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({ version: 3, items: State.cart }));
  } catch (e) { console.warn('cart save failed', e); }
}

const FALLBACK_MENU = [
  {
    name: "Single Pizza Combos",
    items: [
      { name: "Pick 1: Margherita Combo", price: 139, description: "Margherita Regular + Stuffed Garlic Bread + Coke", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Pick 2: Margherita Cheese Combo", price: 159, description: "Margherita Regular + Cheese Garlic Bread + Coke", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Pick 3: Golden Corn Combo", price: 169, description: "Golden Corn Regular + Stuffed Garlic Bread + Coke", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Pick 4: Veg Loaded Combo", price: 189, description: "Veg Loaded Regular + Stuffed Garlic Bread + Coke", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", veg: true }
    ]
  },
  {
    name: "Premium Pizza Combos",
    items: [
      { name: "Pick 5: Capsicum & Paneer Combo", price: 199, description: "Capsicum & Paneer Regular + Stuffed Garlic Bread + Coke", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Pick 6: Spicy Veg Feast & Shake", price: 219, description: "Spicy Veg. Feast Regular + Stuffed Garlic Bread + Vanilla Shake", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Pick 7: Peri-Peri Paneer Combo", price: 229, description: "Peri-Peri Paneer Regular + Stuffed Garlic Bread + Coke", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Pick 8: Paneer Tikka Combo", price: 239, description: "Paneer Tikka Regular + Stuffed Garlic Bread + Coke", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", veg: true }
    ]
  },
  {
    name: "Double Pizza & Calzone Combos",
    items: [
      { name: "Pick 9: Twin Margherita & Capsicum", price: 329, description: "Margherita Regular + Capsicum Regular + Stuffed Garlic Bread + 2 Coke", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Pick 10: 4-Topping Pizza Feast", price: 329, description: "Margherita Regular + Capsicum Regular + Onion Regular + Tomato Regular", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Pick 11: Extravaganza Double Combo", price: 379, description: "Veg Extravaganza Regular + Double Cheese Margherita + Stuffed Garlic Bread + 2 Coke", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Pick 12: Calzone Mega Combo", price: 399, description: "Cheese Calizza + Normal Veg Calizza (Any 2) + Stuffed Garlic Bread + 2 Coke", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", veg: true }
    ]
  },
  {
    name: "Burgers",
    items: [
      { name: "Classic Aloo Tikki Burger", price: 70, description: "Crispy golden potato patty with house spices and mayo", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Crispy Veg Burger", price: 80, description: "Crunchy mixed vegetable patty with lettuce and creamy mayo", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Mix Veg Momo Burger", price: 89, description: "Special fusion burger loaded with steamed mix veg momos", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Veg Cheese Burger", price: 100, description: "Classic veg patty topped with a thick melt of Amul cheese", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&w=600&q=80", veg: true }
    ]
  },
  {
    name: "French Fries",
    items: [
      { name: "Salted Fries (Medium)", price: 79, description: "Classic golden salted potato fries (180g)", image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Peri-Peri Fries (Medium)", price: 100, description: "Crispy fries tossed in hot & spicy African peri-peri seasoning", image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80", veg: true },
      { name: "Cheesy Salted Fries (Medium)", price: 130, description: "Golden salted fries loaded with warm liquid Amul cheese", image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80", veg: true }
    ]
  }
];

function sanitizeImagePaths(categories) {
  return (categories || []).map(cat => ({
    ...cat,
    items: (cat.items || []).map(it => ({
      ...it,
      image: it.image ? it.image.replace(/^\.\.\//, '') : ''
    }))
  }));
}

// ── Menu ───────────────────────────────────────────────────
async function loadMenu() {
  try {
    let catalog = State.catalog.length && State.menu.length
      ? { items: State.catalog, categories: State.menu }
      : await window.PizjoCatalog.load(CONFIG.menuUrl || 'data/menu.json?v=2');
    catalog = await window.PizjoStorefrontSync?.hydrateCatalog(catalog) || catalog;
    State.catalog = catalog.items;
    State.menu = catalog.categories.map((category) => ({
      ...category,
      icon: category.name.toLowerCase().includes('pizza') ? '🍕' : '🍽️',
    }));
  } catch (err) {
    console.warn('menu load fetch warning, using validated built-in fallback:', err);
    const fallback = window.PizjoCatalog.normalize({ categories: FALLBACK_MENU });
    State.catalog = fallback.items;
    State.menu = fallback.categories.map((category) => ({ ...category, icon: '🍽️' }));
  }

  if (State.menu.length) {
    // Open on a real pizza category — offer/special categories made a weak
    // first impression and aren't why people open a pizza menu.
    const firstPizza = State.menu.find((c) => /pizza/i.test(c.name) && !/offer|special/i.test(c.name));
    State.current = firstPizza?.name || State.menu[0].name;
    renderFilters();
    renderGrid();
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
      e.currentTarget.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      renderGrid();
    });
  });
  // Center the active pill in the scroll strip without scrolling the page
  // vertically (container math, not scrollIntoView, on first paint).
  const active = root.querySelector('.cat-btn.active');
  if (active) {
    root.scrollTo({ left: Math.max(0, active.offsetLeft - (root.clientWidth - active.offsetWidth) / 2) });
  }
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
  // Remove skeleton on first render
  const skel = document.getElementById('menu-skeleton');
  const catFilter = document.getElementById('categories-filter');
  if (catFilter) catFilter.querySelectorAll('.skeleton').forEach(el => el.style.display='none');

  grid.style.opacity = '0';
  grid.style.transform = 'translateY(8px)';
    setTimeout(() => {
    if (skel) skel.remove();
    grid.innerHTML = cat.items
      .map(
        (it) => `
          <article class="product-card animate-on-scroll${it.isAvailable === false ? ' is-unavailable' : ''}">
            <div class="product-info">
              <div class="product-badges">
                ${it.veg === false ? '' : (it.veg || vegName(it.name) ? '<span class="badge badge-veg">Veg</span>' : '')}
                ${it.price > 200 ? '<span class="badge badge-bestseller">Bestseller</span>' : ''}
                ${it.isAvailable === false ? '<span class="badge badge-unavailable">Out of stock</span>' : ''}
              </div>
              <h3 class="product-title">${Sec.escapeHTML(it.name)}</h3>
              <p class="product-desc">${Sec.escapeHTML(it.description || '')}</p>
            </div>
            <div class="product-image-container">
              ${it.image ? `<img src="${Sec.escapeHTML(it.image.replace(/w=600/g, 'w=300').replace(/fm=jpg/g, 'fm=webp').replace(/q=80/g, 'q=60'))}" srcset="${Sec.escapeHTML(it.image.replace(/w=600/g, 'w=300').replace(/fm=jpg/g, 'fm=webp').replace(/q=80/g, 'q=60'))} 300w, ${Sec.escapeHTML(it.image.replace(/fm=jpg/g, 'fm=webp').replace(/q=80/g, 'q=60'))} 600w" sizes="(max-width:480px) 155px, 180px" alt="${Sec.escapeHTML(it.name)}" class="product-image" loading="lazy" decoding="async" width="300" height="200" referrerpolicy="no-referrer">` : ''}
            </div>
            <div class="product-footer">
              <span class="product-price" style="font-size: 1.5rem;">${fmtPrice(it.price)}</span>
              <button class="btn-add" data-id="${Sec.escapeHTML(it.id)}" data-price="${Number(it.price)}" type="button" ${it.isAvailable === false ? 'disabled aria-disabled="true" aria-label="' + Sec.escapeHTML(it.name) + ' is currently out of stock"' : 'aria-label="Add ' + Sec.escapeHTML(it.name) + ' to cart"'}>
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
            </div>
          </article>`
      )
      .join('');

    // Bind scroll animations to the newly injected cards
    bindReveal();

    requestAnimationFrame(() => {
      grid.style.transition = 'all 0.3s var(--ease-out)';
      grid.style.opacity = '1';
      grid.style.transform = 'none';
    });
  }, 120);
}

// ── Cart ───────────────────────────────────────────────────
export function addToCart(id, price) {
  if (!id) return;
  const catalogItem = State.catalog.find((item) => item.id === id) ||
    (window.PizjoMenuCatalog || []).find((item) => item.id === id);
  if (!catalogItem) return;
  if (catalogItem.isAvailable === false) { alert(`${catalogItem.name} is currently out of stock.`); return; }
  const guard = Sec.canAddToCart(Object.values(State.cart), id);
  if (!guard.ok) { alert(guard.reason || 'Cannot add more'); return; }
  const canonicalPrice = Number(catalogItem.price);
  if (!Number.isFinite(canonicalPrice) || canonicalPrice < 0) return;
  State.cart[id] = State.cart[id] || { id, name: catalogItem.name, price: canonicalPrice, qty: 0 };
  State.cart[id].name = catalogItem.name;
  State.cart[id].price = canonicalPrice;
  State.cart[id].qty += 1;
  saveCart();
  paintCart();
  openCart();
}
window.addToCart = addToCart;
function changeQty(id, delta) {
  if (!State.cart[id]) return;
  const catalogItem = State.catalog.find((item) => item.id === id);
  if (delta > 0 && catalogItem?.isAvailable === false) { alert(`${catalogItem.name} is currently out of stock.`); return; }
  const nextQty = State.cart[id].qty + delta;
  if (nextQty > Sec.MAX_ITEM_QTY) return;
  State.cart[id].qty = nextQty;
  if (State.cart[id].qty <= 0) delete State.cart[id];
  saveCart();
  paintCart();
}

function paintCart(promoDiscount = 0) {
  const items = Object.values(State.cart).map((item) => {
    const current = State.catalog.find((candidate) => candidate.id === item.id);
    return current ? { ...item, name: current.name, price: current.price } : item;
  });
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
          <button class="qty-btn" data-id="${Sec.escapeHTML(it.id)}" data-action="minus" type="button" aria-label="Decrease ${Sec.escapeHTML(it.name)} quantity">−</button>
          <span class="qty-val">${it.qty}</span>
          <button class="qty-btn" data-id="${Sec.escapeHTML(it.id)}" data-action="plus" type="button" aria-label="Increase ${Sec.escapeHTML(it.name)} quantity">+</button>
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
  }
  const cartCount = $('cart-count');
  const cartTotal = $('cart-total');
  if (cartCount) cartCount.textContent = totalItems;
  if (cartTotal) cartTotal.textContent = fmtPrice(Math.max(0, totalPrice - (Number(promoDiscount) || 0)));
  const cartToggle = $('cart-toggle');
  if (cartToggle) {
    cartToggle.setAttribute(
      'aria-label',
      totalItems === 0 ? 'Open cart, empty' : `Open cart, ${totalItems} ${totalItems === 1 ? 'item' : 'items'}`
    );
  }
}

let lastCartTrigger = null;
function setCartExpanded(open) {
  $('cart-toggle')?.setAttribute('aria-expanded', String(open));
}
function openCart() {
  lastCartTrigger = document.activeElement;
  const sidebar = $('cart-sidebar');
  sidebar?.classList.add('open');
  sidebar?.setAttribute('aria-hidden', 'false');
  if (sidebar) sidebar.inert = false;
  $('cart-overlay')?.classList.add('open');
  if ($('cart-overlay')) $('cart-overlay').hidden = false;
  setCartExpanded(true);
  $('cart-close')?.focus();
}
function closeCart() {
  const sidebar = $('cart-sidebar');
  sidebar?.classList.remove('open');
  sidebar?.setAttribute('aria-hidden', 'true');
  if (sidebar) sidebar.inert = true;
  $('cart-overlay')?.classList.remove('open');
  if ($('cart-overlay')) $('cart-overlay').hidden = true;
  setCartExpanded(false);
  if (lastCartTrigger && typeof lastCartTrigger.focus === 'function') lastCartTrigger.focus();
}

function bindCart() {
  $('cart-toggle')?.addEventListener('click', openCart);
  $('cart-close')?.addEventListener('click', closeCart);
  $('cart-overlay')?.addEventListener('click', closeCart);
  $('checkout-btn')?.addEventListener('click', checkout);

  // Event Delegation for cart quantity adjustments
  $('cart-items')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    changeQty(btn.dataset.id, btn.dataset.action === 'plus' ? 1 : -1);
  });

  // Event Delegation for Add to Cart buttons on the homepage
  $('menu-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add');
    if (!btn) return;
    addToCart(btn.dataset.id, parseInt(btn.dataset.price, 10));
  });

  // Promo code apply (validates live against trusted server pricing)
  $('promo-apply')?.addEventListener('click', applyPromo);
  $('promo-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyPromo(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });
}

// ── Promo ────────────────────────────────────────────────
function getPromoCode() {
  return String(document.getElementById('promo-input')?.value || '').trim().toUpperCase();
}
function setPromoMsg(text, ok) {
  const el = document.getElementById('promo-msg');
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? 'var(--color-veg)' : '#B3261E';
}
async function applyPromo() {
  const code = getPromoCode();
  const items = Object.values(State.cart);
  if (!code) { setPromoMsg('Enter a code like BOGO or LATE20.', false); return; }
  if (!items.length) { setPromoMsg('Your cart is empty.', false); return; }
  setPromoMsg('Checking…', true);
  try {
    const response = await fetch('/api/order-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((i) => ({ id: i.id, qty: i.qty })), promoCode: code }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Promo check failed');
    setPromoMsg(`${data.discount.code} applied — you save ₹${data.discount.amount}!`, true);
    paintCart(data.discount.amount);
  } catch (err) {
    setPromoMsg(err.message || 'That code does not apply right now.', false);
    paintCart(0);
  }
}

// ⚠️ SECURITY: Sanitize order text to prevent injection
function sanitizeOrderText(text) {
  return text.replace(/[<>]/g, '').trim();
}

async function checkout() {
  const items = Object.values(State.cart);
  if (!items.length || !Sec.rateLimit('checkout', 800)) return;
  const unavailable = items.filter(item => State.catalog.find(candidate => candidate.id === item.id)?.isAvailable === false);
  if (unavailable.length) {
    unavailable.forEach(item => delete State.cart[item.id]);
    saveCart();
    paintCart();
    alert('Unavailable items were removed from your cart. Please review your order.');
    return;
  }

  const promoCode = getPromoCode();
  let summary;
  try {
    const response = await fetch('/api/order-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((item) => ({ id: item.id, qty: item.qty })), promoCode: promoCode || undefined }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data.code === 'INVALID_PROMO' || data.code === 'PROMO_NOT_APPLICABLE') {
        setPromoMsg(data.error || 'That code does not apply.', false);
        paintCart(0);
        return;
      }
      throw new Error(`order summary HTTP ${response.status}`);
    }
    summary = data;
  } catch (error) {
    console.error('[pizjo] trusted order summary unavailable', error);
    alert('Order verification is temporarily unavailable. Please try again in a moment.');
    return;
  }

  const phoneRaw = document.getElementById('order-phone')?.value || '';
  const phone = window.PizjoOrders ? window.PizjoOrders.normalizePhone(phoneRaw) : '';
  if (phoneRaw && !phone) {
    alert('Please enter a valid 10-digit mobile number for tracking, or leave it blank.');
    return;
  }

  let order = null;
  if (window.PizjoOrders) {
    order = window.PizjoOrders.create({
      items: summary.items, subtotal: summary.subtotal,
      discount: summary.discount, total: summary.total,
      promoCode, phone, source: 'website',
    });
  }

  let text = `Hello Pizjo! I'd like to place an order${order ? ` (${order.id})` : ''}:\n\n`;
  for (const item of summary.items || []) {
    const safeName = sanitizeOrderText(item.name).slice(0, 200);
    text += `*${item.qty}x ${safeName} — ₹${item.lineTotal}*\n`;
  }
  text += `\nSubtotal: ₹${summary.subtotal}`;
  if (summary.discount) text += `\nDiscount (${summary.discount.code}): −₹${summary.discount.amount}`;
  text += `\n*Total: ₹${summary.total}*`;
  if (phone) text += `\nMy number: ${phone}`;
  text += '\n\nPlease confirm.';
  const safeText = sanitizeOrderText(text);
  const waUrl = CONFIG.whatsappUrl
    ? CONFIG.whatsappUrl(safeText)
    : `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(safeText)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
  if (order) {
    const trackUrl = `pages/track.html?id=${encodeURIComponent(order.id)}${phone ? `&phone=${encodeURIComponent(phone)}` : ''}`;
    setPromoMsg(`Order ${order.id} saved.`, true);
    setTimeout(() => { if (confirm(`Order ${order.id} logged. Open order tracking?`)) location.href = trackUrl; }, 600);
  }
}

// ── Reveal on scroll (any page) ────────────────────────────
let revealObserver = null;
function bindReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.animate-on-scroll:not(.observed)').forEach((e) => {
      e.classList.add('is-visible', 'observed');
    });
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-visible')),
      // threshold 0 + a 60px bottom inset: tall cards reveal as soon as they
      // enter the viewport. The old 0.12 ratio meant tall elements never
      // reached the ratio and stayed invisible.
      { rootMargin: '0px 0px -60px 0px', threshold: 0 }
    );
  }
  document.querySelectorAll('.animate-on-scroll:not(.observed)').forEach((e) => {
    e.classList.add('observed');
    revealObserver.observe(e);
  });
}

// Exposed for other page scripts (about/contact) to call.
export async function initApp(page = 'home') {
  if (Sec?.init) Sec.init();
  if (window.PizjoCatalog) {
    try {
      let catalog = await window.PizjoCatalog.load(CONFIG.menuUrl || 'data/menu.json?v=2');
      catalog = await window.PizjoStorefrontSync?.hydrateCatalog(catalog) || catalog;
      State.catalog = catalog.items;
      State.menu = catalog.categories.map((category) => ({
        ...category,
        icon: category.name.toLowerCase().includes('pizza') ? '🍕' : '🍽️',
      }));
    } catch (error) {
      console.warn('[pizjo] shared catalog preload failed', error);
    }
  }
  loadCart();
  if ('serviceWorker' in navigator && location.protocol === 'http:') {
    navigator.serviceWorker.register('/sw/service-worker.js').catch((error) => {
      console.warn('[pizjo] service worker registration failed', error);
    });
  }
  bindCart();
  paintCart();
  bindReveal();

  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks && mobileToggle.dataset.bound !== 'true') {
    mobileToggle.dataset.bound = 'true';
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      mobileToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  if (page === 'home') {
    await loadMenu();
    window.PizjoStorefrontSync?.renderOffers();
  }
}

// Auto-boot if loaded directly on the home page (not via import).
if (typeof window !== 'undefined' && document.body) {
  document.addEventListener('DOMContentLoaded', () => {
    if ($('menu-grid')) {
      initApp('home').catch((e) => console.error(e));
    } else {
      initApp('other').catch((e) => console.error(e));
    }
  });
}
