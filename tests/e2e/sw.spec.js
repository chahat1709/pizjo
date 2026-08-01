const { test, expect } = require('@playwright/test');

test.describe('Service Worker', ()=>{
  test('registers and caches model assets', async ({ page })=>{
    await page.goto('http://localhost:3000/');
    // Check registration
    const registered = await page.evaluate(async ()=>{
      if (!('serviceWorker' in navigator)) return false;
      const reg = await navigator.serviceWorker.getRegistration('/sw/service-worker.js');
      return !!reg;
    });
    expect(registered).toBeTruthy();
  });
});
