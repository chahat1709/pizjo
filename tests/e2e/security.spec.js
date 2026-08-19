const { test, expect } = require('@playwright/test');

test.describe('Security and state boundaries', () => {
  test('404 CTA uses shared configuration instead of a hardcoded href', async ({ page }) => {
    await page.goto('/404.html');
    await expect(page.locator('[data-whatsapp-link]')).toHaveAttribute('href', /^https:\/\/wa\.me\/919265370588/);
  });

  test('malformed persisted cart is discarded without breaking boot', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('pizjo.cart.v3', JSON.stringify({
        version: 3,
        items: {
          injected: { id: 'not-real', name: '<script>alert(1)</script>', price: 999999, qty: 999999 }
        }
      }));
    });
    await page.goto('/');
    await expect(page.locator('#menu-grid .btn-add').first()).toBeVisible();
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('pizjo.cart.v3')));
    expect(cart.items).toEqual({});
  });
});
