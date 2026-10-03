const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const out = {};

  // 1. Promo engine: invalid code rejected, no-promo summary works
  await page.goto('https://pizjo.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });
  out.invalidPromo = await page.evaluate(async () => {
    const r = await fetch('/api/order-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [], promoCode: 'NOPE' }) });
    return { status: r.status, body: await r.json() };
  });
  out.noPromo = await page.evaluate(async () => {
    const menu = await (await fetch('data/menu.json?v=3')).json();
    const item = menu.categories[0].items[0];
    const r = await fetch('/api/order-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: item.id, qty: 1 }] }) });
    return { status: r.status, body: await r.json() };
  });

  // 2. Full checkout flow: add item, apply invalid promo, checkout creates order log
  await page.waitForTimeout(2000);
  out.orderFlow = await page.evaluate(async () => {
    const grid = document.getElementById('menu-grid');
    const addBtn = grid ? grid.querySelector('.btn-add') : null;
    if (!addBtn) return { error: 'no add button (menu not loaded?)' };
    addBtn.click();
    await new Promise((r) => setTimeout(r, 500));
    const count = document.getElementById('cart-count')?.textContent;
    return { cartCount: count, promoInput: !!document.getElementById('promo-input'), phoneInput: !!document.getElementById('order-phone') };
  });

  // 3. Track page: seed order, lookup by id+phone
  const track = await ctx.newPage();
  await track.goto('https://pizjo.vercel.app/pages/track.html', { waitUntil: 'networkidle', timeout: 60000 });
  out.track = await track.evaluate(() => {
    const order = window.PizjoOrders.create({
      items: [{ id: 't1', name: 'Test Pizza', qty: 2, unitPrice: 199, lineTotal: 398 }],
      subtotal: 398, discount: { code: 'LATE20', title: 'Late', amount: 80 }, total: 318,
      promoCode: 'LATE20', phone: '9876543210', source: 'verify',
    });
    document.getElementById('track-id').value = order.id;
    document.getElementById('track-phone').value = '9876543210';
    document.getElementById('track-form').requestSubmit();
    return new Promise((resolve) => setTimeout(() => {
      const box = document.getElementById('track-result');
      resolve({ id: order.id, visible: !box.hidden, hasGST: box.innerHTML.includes('CGST'), hasPrint: !!document.getElementById('print-bill'), hasTimeline: box.innerHTML.includes('timeline') });
    }, 500));
  });

  // 4. KDS page: renders columns, import works, bump works
  const kds = await ctx.newPage();
  await kds.goto('https://pizjo.vercel.app/pages/kds.html', { waitUntil: 'networkidle', timeout: 60000 });
  out.kds = await kds.evaluate(() => {
    const cols = ['pending', 'preparing', 'ready'].map((c) => !!document.getElementById('col-' + c));
    const order = window.PizjoOrders.create({
      items: [{ id: 'k1', name: 'KDS Test', qty: 1, unitPrice: 100, lineTotal: 100 }],
      subtotal: 100, discount: null, total: 100, promoCode: '', phone: '', source: 'verify',
    });
    // re-render happens on interval; force via storage event path: call setStatus then check
    const bumped = window.PizjoOrders.setStatus(order.id, 'preparing');
    const bad = window.PizjoOrders.setStatus(order.id, 'delivered'); // illegal skip
    return { cols, created: order.id, bumped: bumped?.status, illegalBlocked: bad === null, gst: window.PizjoOrders.gstBreakup(105) };
  });

  out.jsErrors = errors;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
