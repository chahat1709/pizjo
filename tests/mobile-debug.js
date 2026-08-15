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
  await page.waitForTimeout(5000);
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
    return {
      overflow: doc.scrollWidth - doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      innerWidth: window.innerWidth,
      hero: { w: hero?.getBoundingClientRect().width, h: hero?.getBoundingClientRect().height },
      title: { fs: getComputedStyle(title).fontSize, visible: title?.offsetWidth > 0 },
      btn: { w: btn?.getBoundingClientRect().width, h: btn?.getBoundingClientRect().height, visible: btn?.offsetWidth > 0 },
      menu: { w: menu?.getBoundingClientRect().width, children: menu?.children.length },
      nav: { w: nav?.getBoundingClientRect().width },
      toggle: { w: toggle?.getBoundingClientRect().width, h: toggle?.getBoundingClientRect().height, display: getComputedStyle(toggle).display },
      cartBtn: { w: cart?.getBoundingClientRect().width, h: cart?.getBoundingClientRect().height, right: cart?.getBoundingClientRect().right },
      canvas: { w: cv?.width, h: cv?.height }
    };
  });
  console.log(JSON.stringify(info, null, 1));
  await browser.close();
})();