const { test, expect } = require('@playwright/test');

test.describe('Progressive hero resilience', () => {
  test('keeps the accessible poster when WebGL is unavailable', async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type) {
        if (type === 'webgl' || type === 'webgl2') return null;
        return original.call(this, type);
      };
    });
    await page.goto('/');
    await expect(page.locator('#hero-poster')).toBeVisible();
    await expect(page.locator('#hero-3d-container')).toBeAttached();
  });
});
