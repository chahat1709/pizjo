const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

for (const path of ['/', '/pages/menu.html', '/pages/contact.html']) {
  test(`has no serious accessibility violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact));
    expect(serious, serious.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([]);
  });
}
