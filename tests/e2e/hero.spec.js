const { test, expect } = require('@playwright/test');

test.describe('Pizjo hero', () => {
  test('renders the static pizza poster as the hero visual', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hero-poster')).toBeVisible();
    await expect(page.locator('#hero-poster')).toHaveAttribute('alt', /pure-vegetarian pizza/i);
    await expect(page.locator('#hero-3d-container')).toHaveCount(0);
    await expect(page.locator('.hero-visual canvas')).toHaveCount(0);
    await expect(page.locator('img[alt="Pizjo hero preview"]')).toHaveCount(0);
  });
});
