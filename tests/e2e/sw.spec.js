const { test, expect } = require('@playwright/test');

test.describe('Service Worker', () => {
  test('registers from the production application', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const registration = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return null;
      const reg = await navigator.serviceWorker.getRegistration('/sw/service-worker.js');
      return reg ? reg.scope : null;
    });
    expect(registration).toContain('/');
  });
});
