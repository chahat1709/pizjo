const { test, expect } = require('../node_modules/@playwright/test');

test('runs core operational workflows locally without published-service requests', async ({ page }) => {
  const requests = [];
  page.on('request', request => requests.push(request.url()));

  await page.goto('http://localhost:4173/');
  await expect(page.getByText('LOCAL TEST MODE · NO LOGIN · DATA STAYS IN THIS BROWSER')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  await page.getByRole('link', { name: 'Orders' }).click();
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  await page.locator('#order-form select[name="itemId"]').selectOption({ index: 1 });
  await page.locator('#order-form input[name="qty"]').fill('2');
  await page.locator('#order-form').getByRole('button', { name: 'Log local order' }).click();
  await expect(page.getByText('Local test order logged.')).toBeVisible();

  await page.getByRole('link', { name: 'Inventory' }).click();
  await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();
  await page.locator('[data-availability]').first().click();
  await expect(page.getByText('Out of stock').first()).toBeVisible();

  await page.getByRole('link', { name: 'Billing' }).click();
  await expect(page.getByRole('heading', { name: 'Billing' })).toBeVisible();
  await page.locator('#invoice-form').getByRole('button', { name: 'Create local invoice' }).click();
  await expect(page.getByText('LOCAL-INV-0001')).toBeVisible();

  expect(requests.every(url => url.startsWith('http://localhost:4173/'))).toBeTruthy();
});
