const { test, expect } = require('@playwright/test');

const pages = [
  { path: '/pages/menu.html', marker: '#menu-sections .product-card' },
  { path: '/pages/about.html', marker: 'main' },
  { path: '/pages/contact.html', marker: '#contact-form' },
  { path: '/pages/legal.html', marker: '#privacy' },
  { path: '/404.html', marker: '#main' },
];

for (const entry of pages) {
  test(`loads ${entry.path} without page errors`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(entry.path);
    await expect(page.locator(entry.marker).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}
