// Standalone verification: confirm the Blender-baked animation actually plays.
// Run: node tests/verify-anim.js
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    const logs = [];
    page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));

    await page.goto('http://localhost:8080/index.html?test=1', { waitUntil: 'load' });

    // Wait for the hero GLB to load and the canvas to appear in the container.
    await page.waitForSelector('#three-canvas-container canvas', { timeout: 20000 });

    // Give the loader a moment to parse + start the mixer.
    await page.waitForTimeout(2500);

    const result = await page.evaluate(() => {
        const container = document.getElementById('three-canvas-container');
        const canvas = container ? container.querySelector('canvas') : null;
        const poster = document.getElementById('hero-poster');
        return {
            hasCanvas: !!canvas,
            canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
            posterFaded: poster ? poster.classList.contains('hero-poster-fade') : null,
            // The hero module doesn't expose the mixer globally, so detect motion by
            // sampling the WebGL framebuffer twice and checking pixels change.
        };
    });

    // Detect actual on-screen motion: screenshot the hero region twice, compare.
    const heroBox = await page.locator('.hero-visual-box').first().boundingBox();
    const clip = heroBox ? { x: heroBox.x, y: heroBox.y, width: heroBox.width, height: heroBox.height } : undefined;
    const shotA = await page.screenshot({ clip });
    await page.waitForTimeout(700);
    const shotB = await page.screenshot({ clip });
    const motionDetected = !shotA.equals(shotB);

    console.log('=== VERIFY RESULT ===');
    console.log('hasCanvas     :', result.hasCanvas);
    console.log('canvasSize    :', JSON.stringify(result.canvasSize));
    console.log('posterFaded   :', result.posterFaded);
    console.log('motionDetected:', motionDetected);
    console.log('=== CONSOLE (last 20) ===');
    logs.slice(-20).forEach((l) => console.log(l));

    await browser.close();

    const pass = result.hasCanvas && motionDetected;
    console.log(pass ? '\nPASS: animated 3D pizza is rendering and animating.' : '\nFAIL: see logs above.');
    process.exit(pass ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
