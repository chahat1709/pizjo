const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('Starting advanced Playwright scraper...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Intercept network requests
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('catalog') || url.includes('items') || url.includes('menu')) {
            try {
                const text = await response.text();
                if (text.includes('category') || text.includes('price')) {
                    console.log('Intercepted promising API call:', url);
                    fs.writeFileSync('data/intercepted_menu.json', text);
                }
            } catch (e) {
                // ignore
            }
        }
    });

    console.log('Navigating to pizjo.in...');
    try {
        await page.goto('https://pizjo.in/', { waitUntil: 'networkidle', timeout: 30000 });
        console.log('Waiting 5 seconds for dynamic content...');
        await page.waitForTimeout(5000);
        
        // Let's also just extract all text that looks like an item
        const data = await page.evaluate(() => {
            return document.body.innerText;
        });
        fs.writeFileSync('data/page_text.txt', data);
        console.log('Saved page text.');
        
    } catch(e) {
        console.log('Error during navigation:', e.message);
    }

    await browser.close();
})();
