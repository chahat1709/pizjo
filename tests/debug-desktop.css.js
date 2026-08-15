const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }
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
    const heroTitle = document.getElementById('hero-title');
    
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
      } : null,
      heroVisual: heroVisual ? {
        w: heroVisual.getBoundingClientRect().width,
        h: heroVisual.getBoundingClientRect().height,
      } : null,
      heroVisualBox: heroVisualBox ? {
        w: heroVisualBox.getBoundingClientRect().width,
        h: heroVisualBox.getBoundingClientRect().height,
      } : null,
      heroTitle: heroTitle ? {
        fs: getStyle(heroTitle).fontSize,
        w: heroTitle.getBoundingClientRect().width,
      } : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();