const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 3210;
const MIME = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
    '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
    '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

async function checkPage(page, url, name) {
    await page.goto(`http://localhost:${PORT}${url}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
        const doc = document.documentElement;
        const overflow = doc.scrollWidth - doc.clientWidth;
        const bigText = [];
        document.querySelectorAll('h1, h2, h3, .menu-title, .hero-title, .footer-brand, .about-hero-title, .contact-hero-title, .menu-hero-title').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.width > 0 && r.right > doc.clientWidth + 1) {
                bigText.push({ tag: el.tagName, cls: el.className, text: el.textContent.trim().slice(0, 30), right: Math.round(r.right), vw: doc.clientWidth });
            }
        });
        return {
            overflow,
            scrollWidth: doc.scrollWidth,
            clientWidth: doc.clientWidth,
            overflowingText: bigText,
            navVisible: !!document.querySelector('.navbar')?.offsetWidth,
            toggleDisplay: getComputedStyle(document.getElementById('mobile-menu-toggle')).display
        };
    });
    await page.screenshot({ path: path.join(ROOT, `assets/verification/mobile-${name}.png`), fullPage: true });
    console.log(`\n=== ${name} (${url}) ===`);
    console.log(JSON.stringify(info, null, 1));
    return info;
}

(async () => {
    await new Promise((resolve) => server.listen(PORT, resolve));
    const browser = await chromium.launch();
    const ctx = await browser.newContext({
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2
    });
    const page = await ctx.newPage();

    const results = {};
    results.home = await checkPage(page, '/', 'home');
    results.menu = await checkPage(page, '/pages/menu.html', 'menu');
    results.about = await checkPage(page, '/pages/about.html', 'about');
    results.contact = await checkPage(page, '/pages/contact.html', 'contact');

    await browser.close();
    server.close();

    const anyOverflow = Object.values(results).some((r) => r.overflow > 0);
    const anyTextOverflow = Object.values(results).some((r) => r.overflowingText.length > 0);
    console.log('\n\n===== SUMMARY =====');
    console.log('Horizontal overflow (px):', Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.overflow])));
    console.log('Overflowing text elements:', Object.fromEntries(Object.entries(results).map(([k, v]) => [k, v.overflowingText.length])));
    console.log(anyOverflow || anyTextOverflow ? '⚠️  ISSUES FOUND' : '✅ NO MOBILE OVERFLOW ISSUES');
    process.exit(0);
})();