const { test, expect } = require('@playwright/test');

test.describe('Cart ordering flow', () => {
  test('adds an item, persists it, and enforces the per-item limit', async ({ page }) => {
    await page.goto('/');
    const addButton = page.locator('#menu-grid .btn-add').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    await expect(page.locator('#cart-count')).toHaveText('1');

    const plusButton = page.locator('#cart-items .qty-btn[data-action="plus"]').first();
    await plusButton.click({ clickCount: 19, delay: 25 });
    await expect(page.locator('#cart-count')).toHaveText('20');

    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pizjo.cart.v3')));
    expect(stored.version).toBe(3);
    expect(Object.values(stored.items)[0].qty).toBe(20);
    expect(Object.values(stored.items)[0].id).toBeTruthy();
    expect(Object.values(stored.items)[0].price).toBeGreaterThan(0);
  });
});
