// Capture the rendered hero pizza to a PNG so we can see the 3D result.
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    // NOTE: no ?test=1 here — the test-helper stub injects an extra static
    // poster img that would cover the real 3D canvas in the screenshot.
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'load' });
    await page.waitForSelector('#three-canvas-container canvas', { timeout: 20000 });
    // Wait for assemble to finish and idle to begin (~assemble is 90f/30fps = 3s)
    await page.waitForTimeout(4000);
    // Hide every <img> inside the hero box (the LQIP poster AND the test-helper
    // stub that gets injected on localhost) so the screenshot shows the real
    // 3D canvas, not a static photographic poster layered on top of it.
    await page.evaluate(() => {
        document.querySelectorAll('.hero-visual-box img').forEach((e) => {
            e.style.display = 'none';
        });
    });
    await page.waitForTimeout(150); // let a frame render with images hidden

    const box = await page.locator('.hero-visual-box').first().boundingBox();
    await page.screenshot({ path: 'assets/verification/hero-render.png', clip: box });
    // Second shot a moment later to show idle motion difference
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'assets/verification/hero-render-2.png', clip: box });
    await browser.close();
    console.log('Saved assets/verification/hero-render.png and hero-render-2.png');
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
