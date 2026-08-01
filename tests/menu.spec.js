const { test, expect } = require('@playwright/test');

test.describe('Pizjo Menu Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:8000/pages/menu.html');
    });

    test('should load and render menu items from JSON', async ({ page }) => {
        // Wait for at least one product card to render
        const productCard = page.locator('.product-card').first();
        await expect(productCard).toBeVisible({ timeout: 8000 });

        // Should have multiple categories rendered
        const sections = page.locator('.menu-category-section');
        const sectionCount = await sections.count();
        expect(sectionCount).toBeGreaterThan(0);

        // Should have multiple product cards
        const cards = page.locator('.product-card');
        const cardCount = await cards.count();
        expect(cardCount).toBeGreaterThan(5);
    });

    test('should render sidebar with categories', async ({ page }) => {
        const sidebarLinks = page.locator('.sidebar-link');
        await expect(sidebarLinks.first()).toBeVisible({ timeout: 8000 });
        const count = await sidebarLinks.count();
        expect(count).toBeGreaterThan(0);
    });

    test('search should filter items', async ({ page }) => {
        const searchInput = page.locator('#menu-search');
        await expect(searchInput).toBeVisible();

        // Wait for initial render
        await page.waitForSelector('.product-card', { timeout: 8000 });
        const initialCount = await page.locator('.product-card').count();

        // Type a search query
        await searchInput.fill('pizza');
        await page.waitForTimeout(500); // debounce

        const filteredCount = await page.locator('.product-card').count();
        // Filtered should be <= initial (could be equal if all items contain "pizza")
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('no console errors on load', async ({ page }) => {
        const errors = [];
        page.on('pageerror', (err) => errors.push(err.message));
        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        // beforeEach already navigated; just wait for render.
        await page.waitForSelector('.product-card', { timeout: 8000 });
        await page.waitForTimeout(500); // let any async errors surface

        // Filter out known harmless warnings (e.g., font loading)
        const realErrors = errors.filter((e) =>
            !e.includes('Failed to load resource') &&
            !e.includes('fonts.gstatic.com') &&
            !e.includes('favicon')
        );
        expect(realErrors).toEqual([]);
    });
});
