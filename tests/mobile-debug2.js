const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await ctx.newPage();
  await page.goto('https://pizjo.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);
  const info = await page.evaluate(() => {
    const doc = document.documentElement;
    const hero = document.querySelector('.hero-visual-box');
    const title = document.getElementById('hero-title');
    const btn = document.querySelector('.btn-primary');
    const menu = document.querySelector('.menu-grid');
    const nav = document.querySelector('.navbar');
    const toggle = document.getElementById('mobile-menu-toggle');
    const cart = document.getElementById('cart-toggle');
    const cv = document.querySelector('#three-canvas-container canvas');
    const canvasContainer = document.getElementById('three-canvas-container');
    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      hero: { w: hero?.getBoundingClientRect().width, h: hero?.getBoundingClientRect().height },
      title: { fs: getComputedStyle(title).fontSize, visible: title?.offsetWidth > 0 },
      menu: { w: menu?.getBoundingClientRect().width, children: menu?.children.length, innerHTML: menu?.innerHTML.slice(0, 100) },
      nav: { w: nav?.getBoundingClientRect().width },
      toggle: { w: toggle?.getBoundingClientRect().width, h: toggle?.getBoundingClientRect().height, display: getComputedStyle(toggle).display },
      cartBtn: { w: cart?.getBoundingClientRect().width, h: cart?.getBoundingClientRect().height, right: cart?.getBoundingClientRect().right },
      canvas: { w: cv?.width, h: cv?.height },
      canvasContainer: { w: canvasContainer?.getBoundingClientRect().width, h: canvasContainer?.getBoundingClientRect().height }
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();