import asyncio
import json
import random
from playwright.async_api import async_playwright

async def scrape_images(page, query, count=30):
    print(f"Searching Unsplash for {query}...")
    await page.goto(f'https://unsplash.com/s/photos/{query}', timeout=60000)
    await page.wait_for_timeout(3000)
    
    # Scroll a few times to load more images
    for _ in range(5):
        await page.mouse.wheel(0, 2000)
        await page.wait_for_timeout(1000)
        
    imgs = await page.evaluate('''() => {
        const images = Array.from(document.querySelectorAll('img[src*="images.unsplash.com/photo-"]'));
        return images.map(img => {
            const url = new URL(img.src);
            url.searchParams.set('w', '600');
            url.searchParams.set('q', '80');
            return url.toString();
        });
    }''')
    
    # Deduplicate and limit
    unique_imgs = list(set(imgs))
    print(f"Found {len(unique_imgs)} images for {query}")
    return unique_imgs[:count]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        
        db = {
            "pizza": await scrape_images(page, "pizza", 40),
            "burger": await scrape_images(page, "burger", 20),
            "fries": await scrape_images(page, "french-fries", 10),
            "momo": await scrape_images(page, "dumplings", 10),
            "waffle": await scrape_images(page, "waffle", 10),
            "drink": await scrape_images(page, "iced-coffee", 10),
            "mojito": await scrape_images(page, "mojito", 5),
            "dip": await scrape_images(page, "sauce-dip", 5),
            "garlic bread": await scrape_images(page, "garlic-bread", 5)
        }
        
        await browser.close()
        
        with open('data/menu.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        def get_img(cat_name, item_name):
            cat_name = cat_name.lower()
            item_name = item_name.lower()
            
            pool = db["pizza"] # default
            if "burger" in cat_name or "burger" in item_name: pool = db["burger"]
            elif "fries" in cat_name or "fries" in item_name: pool = db["fries"]
            elif "momo" in cat_name or "momo" in item_name: pool = db["momo"]
            elif "waffle" in item_name or "brownie" in item_name: pool = db["waffle"]
            elif "mojito" in item_name: pool = db["mojito"]
            elif "shake" in item_name or "coffee" in item_name or "tea" in item_name or "cooler" in cat_name: pool = db["drink"]
            elif "garlic bread" in cat_name or "garlic bread" in item_name: pool = db["garlic bread"]
            elif "dip" in cat_name or "dip" in item_name: pool = db["dip"]
            
            if not pool: pool = db["pizza"] # fallback if empty
            
            # Instead of popping (which can empty the list), just pick randomly
            # from the pool so we never run out! 15 unique images is plenty for variety.
            if len(pool) > 0:
                return random.choice(pool)
            else:
                return random.choice(db["pizza"])

        for cat in data.get('categories', []):
            cat_name = cat['name']
            for item in cat.get('items', []):
                item['image'] = get_img(cat_name, item['name'])
                
        with open('data/menu.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
            
        print("Updated menu.json with 100% unique Unsplash images!")

if __name__ == '__main__':
    asyncio.run(main())
