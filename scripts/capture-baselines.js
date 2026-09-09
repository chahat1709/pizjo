const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function capture(){
  const outDir = path.join(__dirname, '..', 'docs', 'research', 'baselines');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const targets = [
    { url: '/', name: 'hero_idle.png' },
    { url: '/#exploded', name: 'exploded_stage_mid.png' },
    { url: '/#product-spin', name: 'product_spin.png' },
  ];
  for (const t of targets){
    const url = t.url.startsWith('http') ? t.url : `http://localhost:3000${t.url}`;
    console.log('Navigating', url);
    await page.goto(url, { waitUntil: 'networkidle' });
    // small wait for animations to settle
    await page.waitForTimeout(800);
    const out = path.join(outDir, t.name);
    await page.screenshot({ path: out, fullPage: false });
    console.log('Saved', out);
  }
  await browser.close();
}

capture().catch(e=>{ console.error(e); process.exit(1); });
