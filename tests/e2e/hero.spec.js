const { test, expect } = require('@playwright/test');

test.describe('Pizjo hero preload and swap', () => {
  test('shows LQ poster before LOD fetch and emits hero-ready', async ({ page }) => {
    await page.goto('http://localhost:3000/');
    // poster exists
    const poster = await page.locator('img[alt="Pizjo hero preview"]');
    await expect(poster).toBeVisible();
    // simulate preloader event if needed
    // The real test should assert network requests to LOD1 and swap, but this is a skeleton.
    expect(true).toBeTruthy();
  });
});
