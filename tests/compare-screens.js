const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const mp = await mobile.newPage();
  await mp.goto('https://pizjo.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });
  await mp.waitForTimeout(3000);
  await mp.screenshot({ path: 'C:/Users/chaha/AppData/Local/Temp/opencode/mobile-hero.png' });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await desktop.newPage();
  await dp.goto('https://pizjo.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });
  await dp.waitForTimeout(3000);
  await dp.screenshot({ path: 'C:/Users/chaha/AppData/Local/Temp/opencode/desktop-hero.png' });

  await browser.close();
  console.log('done');
})();
