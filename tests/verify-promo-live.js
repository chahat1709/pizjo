const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await (await browser.newContext()).newPage();
  await page.goto('https://pizjo.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const r = await page.evaluate(async () => {
    const menu = await (await fetch('data/menu.json?v=3')).json();
    const a = menu.categories[0].items[0];
    const b = menu.categories[0].items[1];
    const bad = await (await fetch('/api/order-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: a.id, qty: 2 }], promoCode: 'FAKE99' }) })).json();
    const bogo = await (await fetch('/api/order-summary', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: a.id, qty: 1 }, { id: b.id, qty: 1 }], promoCode: 'BOGO' }) })).json();
    return { bad, bogo };
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
