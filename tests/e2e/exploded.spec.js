const { test, expect } = require('@playwright/test');

test.describe('Hero asset budget', () => {
  test('never requests the 3D model, three.js bundle or draco decoder', async ({ page }) => {
    const heavy = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.endsWith('.glb') || url.endsWith('.gltf') || url.includes('three-bundle') || url.includes('/draco/')) {
        heavy.push(url);
      }
    });
    await page.goto('/');
    await expect(page.locator('#hero-poster')).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(heavy).toEqual([]);
  });
});
