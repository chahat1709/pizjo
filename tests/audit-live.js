const { chromium } = require('playwright');

const BASE = process.env.PIZJO_BASE || 'https://pizjo.vercel.app';
const results = [];
const ok = (name, detail='') => results.push({ name, pass: true, detail });
const bad = (name, detail) => results.push({ name, pass: false, detail });

(async () => {
  const browser = await chromium.launch();

  // â”€â”€ Desktop audit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => pageErrors.push(e.message));
    page.on('requestfailed', r => failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`));
    page.on('response', r => { if (r.status() >= 400) failedRequests.push(`${r.url()} :: HTTP ${r.status()}`); });

await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Wait for the menu grid (JS render) and hero canvas with retries (cold-edge safe)
    await page.waitForSelector('.product-card', { timeout: 20000 }).catch(() => {});
    await page.waitForSelector('#three-canvas-container canvas', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1500);

    // 3D hero
    const hero = await page.evaluate(() => {
      const c = document.getElementById('three-canvas-container');
      const cv = c && c.querySelector('canvas');
      const p = document.getElementById('hero-poster');
      return { container: !!c, canvas: !!cv, posterFaded: p ? p.classList.contains('hero-poster-fade') : null };
    });
    hero.canvas && hero.posterFaded ? ok('3D hero: Blender GLB rendered (poster faded)', JSON.stringify(hero))
                                    : bad('3D hero', JSON.stringify(hero));

    // Menu cards
    const cards = await page.locator('.product-card').count();
    cards > 0 ? ok('Menu loaded', `${cards} cards`) : bad('Menu loaded', '0 cards');

    // Images without alt
    const imgNoAlt = await page.evaluate(() =>
      [...document.images].filter(i => !i.alt && i.offsetParent).map(i => i.src));
    imgNoAlt.length ? bad('All <img> have alt', imgNoAlt.join(', ')) : ok('All <img> have alt');

    // Category filter
    const filterCount = await page.locator('.cat-btn').count();
    filterCount > 1 ? ok('Category filter buttons', `${filterCount} buttons`) : bad('Category filter buttons', `${filterCount}`);
    await page.locator('.cat-btn').nth(1).click();
    await page.waitForTimeout(800);
    const filteredCards = await page.locator('.product-card').count();
    filteredCards > 0 ? ok('Filter switched category', `${filteredCards} cards`) : bad('Filter switched category', '0 cards after click');

    // Add to cart
    await page.locator('.btn-add').first().click();
    await page.waitForTimeout(600);
    const cartOpen = await page.locator('#cart-sidebar').evaluate(el => el.classList.contains('open'));
    cartOpen ? ok('Add to cart opens sidebar') : bad('Add to cart opens sidebar');
    const cartCount = await page.locator('#cart-count').textContent();
    cartCount === '1' ? ok('Cart count = 1', cartCount) : bad('Cart count', cartCount);

    // Quantity plus/minus
    await page.locator('.qty-btn[data-action="plus"]').first().click();
    await page.waitForTimeout(300);
    const qty = await page.locator('.qty-val').first().textContent();
    qty === '2' ? ok('Qty + works', qty) : bad('Qty +', qty);
    await page.locator('.qty-btn[data-action="minus"]').first().click();
    await page.locator('.qty-btn[data-action="minus"]').first().click();
    await page.waitForTimeout(300);
    const qtyAfter = await page.locator('.qty-val').count();
    qtyAfter === 0 ? ok('Qty - removes item at 0') : bad('Qty -', `${qtyAfter} items remain`);

    // Re-add, escape closes
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.locator('.btn-add').first().click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const closed = await page.locator('#cart-sidebar').evaluate(el => !el.classList.contains('open'));
    closed ? ok('Escape closes cart') : bad('Escape closes cart');

    // Checkout WhatsApp link
    await page.locator('.btn-add').first().click();
    await page.waitForTimeout(300);
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
      page.locator('#checkout-btn').click(),
    ]);
    if (popup) {
      const url = popup.url();
      (url.includes('wa.me/919265370588') || url.includes('api.whatsapp.com/send') && url.includes('phone=919265370588'))
        ? ok('Checkout opens WhatsApp', url)
        : bad('Checkout WhatsApp URL', url);
      await popup.close();
    } else {
      bad('Checkout opens WhatsApp', 'no popup');
    }

    // Nav links exist
    const navLinks = await page.locator('.nav-links a, .navbar a').evaluateAll(as => as.map(a => ({ href: a.href, text: a.textContent.trim() })).slice(0, 10));
    ok('Nav links', navLinks.map(l => `${l.text}:${l.href.replace(BASE,'')}`).join(' | '));

    // Horizontal overflow (desktop)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    overflow > 2 ? bad('No horizontal scroll (desktop)', `${overflow}px`) : ok('No horizontal scroll (desktop)');

    // Console / network errors
    consoleErrors.length ? bad('No console errors', consoleErrors.join(' || ')) : ok('No console errors');
    pageErrors.length ? bad('No page errors', pageErrors.join(' || ')) : ok('No page errors');
    failedRequests.length ? bad('No failed requests', failedRequests.join(' || ')) : ok('No failed requests');

    // LCP-ish timing
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return nav ? { domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) } : null;
    });
    ok('Page load timing', JSON.stringify(timing));

    // Full page screenshot
    await page.screenshot({ path: 'assets/verification/audit-desktop.png', fullPage: true });
    await page.close();
  }

  // â”€â”€ Mobile audit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', e => consoleErrors.push('PAGEERROR: ' + e.message));
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(4000);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    overflow > 5 ? bad('No horizontal scroll (mobile)', `${overflow}px`) : ok('No horizontal scroll (mobile)');

    // Hamburger menu
    const toggle = await page.locator('#mobile-menu-toggle').count();
    const toggleVisible = toggle ? await page.locator('#mobile-menu-toggle').isVisible().catch(() => false) : false;
    toggleVisible ? ok('Mobile menu toggle present and visible') : bad('Mobile menu toggle visible at 375px', 'button hidden');
    if (toggleVisible) {
      await page.locator('#mobile-menu-toggle').click();
      await page.waitForTimeout(400);
      const open = await page.locator('.nav-links').evaluate(el => el.classList.contains('open'));
      open ? ok('Mobile menu opens') : bad('Mobile menu opens', 'no .open class');
      await page.locator('#mobile-menu-toggle').click();
    }

    // Tap target: Add-to-cart visible
    const addVisible = await page.locator('.btn-add').first().isVisible();
    addVisible ? ok('Add-to-cart visible on mobile') : bad('Add-to-cart visible on mobile');

    // Hero 3D on mobile
    const heroCv = await page.evaluate(() => {
      const c = document.getElementById('three-canvas-container');
      const cv = c && c.querySelector('canvas');
      return cv ? { w: cv.width, h: cv.height } : null;
    });
    heroCv ? ok('3D canvas present on mobile', JSON.stringify(heroCv)) : bad('3D canvas on mobile', 'missing');

    // Hero text readability: font size of hero title
    const heroFont = await page.evaluate(() => {
      const h = document.getElementById('hero-title');
      return h ? getComputedStyle(h).fontSize : null;
    });
    parseFloat(heroFont) >= 24 ? ok('Hero title font size mobile', heroFont) : bad('Hero title font size mobile', heroFont);

    consoleErrors.length ? bad('No console errors (mobile)', consoleErrors.join(' || ')) : ok('No console errors (mobile)');

    // Tap cart toggle
    if (await page.locator('#cart-toggle').count()) {
      await page.locator('#cart-toggle').tap();
      await page.waitForTimeout(400);
      const open = await page.locator('#cart-sidebar').evaluate(el => el.classList.contains('open'));
      open ? ok('Cart opens via tap') : bad('Cart opens via tap');
    }
    await page.screenshot({ path: 'assets/verification/audit-mobile.png', fullPage: true });
    await ctx.close();
  }

  // â”€â”€ Sub-pages / navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    const page = await browser.newPage();
    const failures = [];
    for (const url of ['/pages/about.html', '/pages/contact.html', '/pages/legal.html']) {
      const resp = await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      resp.ok() ? ok('Page loads: ' + url) : bad('Page loads: ' + url, resp.status());
    }
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    // footer links
    const footerLinks = await page.locator('footer a, .footer a').evaluateAll(as => as.map(a => a.href).filter(Boolean));
    for (const href of footerLinks.slice(0, 15)) {
      const resp = await page.request.get(href, { timeout: 15000 }).catch(e => null);
      if (resp) {
        resp.ok() ? ok('Footer link ok: ' + href.replace(BASE, '')) : bad('Footer link: ' + href, 'HTTP ' + resp.status());
      } else {
        bad('Footer link: ' + href, 'request failed');
      }
    }
    if (!footerLinks.length) bad('Footer links', 'none found');
    await page.close();
  }

  await browser.close();

  // â”€â”€ Report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const passes = results.filter(r => r.pass).length;
  const fails = results.filter(r => !r.pass);
  console.log('\n=== PIZJO AUDIT REPORT ===');
  console.log(`PASS: ${passes}  FAIL: ${fails.length}`);
  for (const f of fails) console.log(`\n[FAIL] ${f.name}\n       ${f.detail}`);
  console.log('\n=== ALL PASS ITEMS ===');
  for (const r of results.filter(r => r.pass)) console.log(`[OK] ${r.name} ${r.detail ? ':: ' + r.detail : ''}`);
  console.log(`\nSCORE: ${Math.round((passes / results.length) * 100)}% (${passes}/${results.length})`);
})().catch(e => { console.error('AUDIT CRASHED:', e); process.exit(1); });
