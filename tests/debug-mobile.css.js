const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await ctx.newPage();
  await page.goto('https://pizjo.vercel.app/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  
  const info = await page.evaluate(() => {
    const heroGrid = document.querySelector('.hero-grid');
    const heroContent = document.querySelector('.hero-content');
    const heroVisual = document.querySelector('.hero-visual');
    const heroVisualBox = document.querySelector('.hero-visual-box');
    const container = document.querySelector('.container');
    
    const getStyle = (el) => el ? window.getComputedStyle(el) : null;
    
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      container: container ? { w: container.getBoundingClientRect().width } : null,
      heroGrid: heroGrid ? { 
        w: heroGrid.getBoundingClientRect().width,
        display: getStyle(heroGrid).display,
        flexDir: getStyle(heroGrid).flexDirection,
        gap: getStyle(heroGrid).gap,
      } : null,
      heroContent: heroContent ? {
        w: heroContent.getBoundingClientRect().width,
        flex: getStyle(heroContent).flex,
        minWidth: getStyle(heroContent).minWidth,
      } : null,
      heroVisual: heroVisual ? {
        w: heroVisual.getBoundingClientRect().width,
        h: heroVisual.getBoundingClientRect().height,
        flex: getStyle(heroVisual).flex,
        minWidth: getStyle(heroVisual).minWidth,
      } : null,
      heroVisualBox: heroVisualBox ? {
        w: heroVisualBox.getBoundingClientRect().width,
        h: heroVisualBox.getBoundingClientRect().height,
        width: getStyle(heroVisualBox).width,
        height: getStyle(heroVisualBox).height,
      } : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();