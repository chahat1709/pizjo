const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    console.log('Starting Playwright...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    });

    console.log('Navigating to pizjo.in...');
    await page.goto('https://pizjo.in/', { waitUntil: 'networkidle', timeout: 60000 });
    
    console.log('Waiting for categories to load...');
    await page.waitForSelector('.category-list, .item-card, [class*="category"], [class*="item"]', { timeout: 15000 }).catch(() => console.log('Could not find standard category classes'));
    
    // Attempt to extract menu data. Since we don't know the exact DotPe DOM structure, we'll try to find common patterns.
    const menuData = await page.evaluate(() => {
        const categories = [];
        
        // DotPe usually has a sidebar or horizontal scroll for categories, and a main list for items.
        // Let's just grab all text that looks like a product.
        // Often, items are in elements that contain a price like ₹100
        
        const priceEls = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.children.length === 0 && el.textContent.includes('₹');
        });
        
        // This is a naive extraction. Let's instead look in the window.__NEXT_DATA__
        if (window.__NEXT_DATA__ && window.__NEXT_DATA__.props && window.__NEXT_DATA__.props.pageProps) {
            return window.__NEXT_DATA__.props;
        }
        
        return null;
    });

    if (menuData && menuData.pageProps) {
        console.log('Found __NEXT_DATA__ props!');
        fs.writeFileSync('data/scraped_next_data.json', JSON.stringify(menuData.pageProps, null, 2));
        console.log('Saved to data/scraped_next_data.json');
    } else {
        console.log('__NEXT_DATA__ not found. Attempting generic DOM scrape...');
        // Let's dump the HTML so we can analyze it if needed.
        const html = await page.content();
        fs.writeFileSync('data/pizjo_raw_dom.html', html);
        console.log('Saved DOM to data/pizjo_raw_dom.html');
    }

    await browser.close();
})();
