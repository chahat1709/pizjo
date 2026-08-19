const { test, expect } = require('@playwright/test');

test.describe('Pizjo hero', () => {
  test('renders an accessible poster and the real progressive WebGL container', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero-poster')).toBeVisible();
    await expect(page.locator('#hero-poster')).toHaveAttribute('alt', /pure-vegetarian pizza/i);
    await expect(page.locator('#hero-3d-container')).toBeAttached();
    await expect(page.locator('img[alt="Pizjo hero preview"]')).toHaveCount(0);
  });
});
