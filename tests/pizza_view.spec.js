import { test, expect } from '@playwright/test';
import fs from 'fs';

test('capture exploded pizza view', async ({ page }) => {
    // Navigate
    await page.goto('http://localhost:8000/');
    await page.waitForTimeout(2000);
    
    // Screenshot normal state
    await page.screenshot({ path: 'C:\\Users\\chaha\\.gemini\\antigravity-ide\\brain\\c8b5cf9a-f3a0-44d2-898a-7ff2f29b5468\\pizza_normal.png' });
    
    // Hover the hero visual
    const container = page.locator('.exploded-view-container');
    await container.hover();
    await page.waitForTimeout(1000); // Wait for explode animation
    
    // Screenshot exploded state
    await page.screenshot({ path: 'C:\\Users\\chaha\\.gemini\\antigravity-ide\\brain\\c8b5cf9a-f3a0-44d2-898a-7ff2f29b5468\\pizza_exploded.png' });
});
