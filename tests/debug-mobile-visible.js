const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await ctx.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));
  
  await page.goto('https://pizjo.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  
  const info = await page.evaluate(() => {
    const heroContent = document.querySelector('.hero-content');
    const heroVisual = document.querySelector('.hero-visual');
    const heroTitle = document.getElementById('hero-title');
    const menuGrid = document.getElementById('menu-grid');
    const catFilter = document.getElementById('categories-filter');
    
    return {
      heroContentClasses: heroContent?.className,
      heroContentVisible: heroContent?.classList.contains('is-visible'),
      heroContentObserved: heroContent?.classList.contains('observed'),
      heroContentOpacity: heroContent ? getComputedStyle(heroContent).opacity : null,
      heroVisualClasses: heroVisual?.className,
      heroVisualVisible: heroVisual?.classList.contains('is-visible'),
      heroVisualOpacity: heroVisual ? getComputedStyle(heroVisual).opacity : null,
      heroTitleOpacity: heroTitle ? getComputedStyle(heroTitle).opacity : null,
      menuGridChildren: menuGrid?.children.length,
      catFilterChildren: catFilter?.children.length,
    };
  });
  info.jsErrors = errors;
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
