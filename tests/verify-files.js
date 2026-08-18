const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  
  const urls = [
    'https://pizjo.vercel.app/robots.txt',
    'https://pizjo.vercel.app/sitemap.xml',
    'https://pizjo.vercel.app/404.html',
    'https://pizjo.vercel.app/pages/menu.html',
    'https://pizjo.vercel.app/pages/about.html',
    'https://pizjo.vercel.app/pages/contact.html',
    'https://pizjo.vercel.app/pages/legal.html',
  ];
  
  for (const url of urls) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      console.log(`${response.status()} ${url}`);
    } catch (e) {
      console.log(`ERROR ${url}: ${e.message}`);
    }
  }
  
  await browser.close();
})();