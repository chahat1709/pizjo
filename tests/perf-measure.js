const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  // Emulate Moto G4 + Slow 4G (as per skill) and also 15KB/s case
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  // Track all requests
  const requests = [];
  page.on('request', r => requests.push({ url: r.url(), type: r.resourceType(), method: r.method() }));
  let cdp = await context.newCDPSession(page);
  // Enable network
  await cdp.send('Network.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // slow CPU

  const slow4G = { offline: false, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 };
  await cdp.send('Network.emulateNetworkConditions', slow4G);

  const start = Date.now();
  await page.goto('https://pizjo.vercel.app/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(5000);
  const elapsed = Date.now() - start;

  // Get performance entries
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const paints = performance.getEntriesByType('paint').reduce((acc,e)=>{acc[e.name]=e.startTime;return acc},{});
    const resources = performance.getEntriesByType('resource').map(r=>({
      name: r.name.split('/').pop().split('?')[0],
      type: r.initiatorType,
      size: r.transferSize,
      duration: Math.round(r.duration),
      start: Math.round(r.startTime)
    })).sort((a,b)=>b.size-a.size).slice(0,15);
    const lcp = performance.getEntriesByType('largest-contentful-paint').pop();
    return {
      nav: nav ? { domContentLoaded: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd), transferSize: nav.transferSize, type: nav.type } : null,
      paints,
      resources,
      lcp: lcp ? { startTime: Math.round(lcp.startTime), size: lcp.size, element: lcp.element?.tagName } : null,
      timeOrigin: performance.timeOrigin
    };
  });

  console.log(JSON.stringify({ elapsed, ...perf, totalRequests: requests.length }, null, 2));

  // Also get JS errors
  const errors = [];
  page.on('pageerror', e=> errors.push(e.message));
  await browser.close();
})();
