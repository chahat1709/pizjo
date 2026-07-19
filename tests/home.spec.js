const { test, expect } = require('@playwright/test');

test.describe('Pizjo Homepage', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:8000/');
  });

  test('should have the correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Pizjo/);
  });

  test('should load menu items from JSON', async ({ page }) => {
    // Wait for at least one product card to be rendered by JS
    const productCard = page.locator('.product-card').first();
    await expect(productCard).toBeVisible({ timeout: 5000 });
    
    // Check if the "Add" button is present on the card
    const addButton = productCard.locator('.btn-add');
    await expect(addButton).toBeVisible();
  });

  test('should render the 3D canvas', async ({ page }) => {
    // The three-hero scene appends a canvas to #three-canvas-container
    const canvas = page.locator('#three-canvas-container canvas');
    await expect(canvas).toBeVisible();
  });

  test('cart sidebar should open when cart button is clicked', async ({ page }) => {
    const cartToggle = page.locator('#cart-toggle');
    await cartToggle.click();

    const cartSidebar = page.locator('#cart-sidebar');
    await expect(cartSidebar).toHaveClass(/open/);
  });
});
